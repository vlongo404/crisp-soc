import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

FG_HOST  = os.getenv("FG_HOST", "192.168.1.1")
FG_PORT  = os.getenv("FG_PORT", "443")
FG_TOKEN = os.getenv("FG_TOKEN", "")
BASE     = f"https://{FG_HOST}:{FG_PORT}/api/v2"

requests.packages.urllib3.disable_warnings()

HEADERS = {"Authorization": f"Bearer {FG_TOKEN}"}


def fg_get(path):
    try:
        r = requests.get(f"{BASE}{path}", headers=HEADERS, verify=False, timeout=10)
        return r.json()
    except Exception as e:
        return {"error": str(e)}


@app.route("/health")
def health():
    r = fg_get("/monitor/system/interface/select/")
    if "error" in r or r.get("status") == "error":
        return jsonify({"status": "error", "fortigate": FG_HOST}), 500
    return jsonify({"status": "ok", "fortigate": FG_HOST, "auth": "token", "version": r.get("version","?")})


@app.route("/api/interfaces")
def interfaces():
    return jsonify(fg_get("/monitor/system/interface/select/"))


@app.route("/api/policies")
def policies():
    return jsonify(fg_get("/cmdb/firewall/policy/"))


@app.route("/api/sessions")
def sessions():
    # FortiGate 7.6 session endpoint
    r = fg_get("/monitor/firewall/session/select/?count=1&global=1")
    if r.get("status") == "error":
        r = fg_get("/monitor/firewall/session/select/")
    return jsonify(r)


@app.route("/api/status")
def status():
    """System resource usage: CPU, RAM, uptime, sessions"""
    ifaces = fg_get("/monitor/system/interface/select/")
    # Build a summary from interfaces + system info
    results = ifaces.get("results", {})
    port1 = results.get("port1", {})
    summary = {
        "version":    ifaces.get("version", "?"),
        "serial":     ifaces.get("serial", "?"),
        "port1_ip":   port1.get("ip", "—"),
        "port1_link": port1.get("link", False),
        "port1_rx":   port1.get("rx_bytes", 0),
        "port1_tx":   port1.get("tx_bytes", 0),
        "port1_speed": port1.get("speed", 0),
        "total_rx":   sum(v.get("rx_bytes", 0) for v in results.values() if isinstance(v, dict)),
        "total_tx":   sum(v.get("tx_bytes", 0) for v in results.values() if isinstance(v, dict)),
        "interfaces": [
            {"name": k, "ip": v.get("ip","—"), "link": v.get("link", False),
             "rx": v.get("rx_bytes",0), "tx": v.get("tx_bytes",0)}
            for k, v in results.items() if isinstance(v, dict) and k.startswith("port")
        ]
    }
    return jsonify({"status": "ok", "results": summary})


@app.route("/api/threats")
def threats():
    return jsonify(fg_get("/monitor/utm/app-ctrl/select/"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
