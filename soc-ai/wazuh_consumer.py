"""
CRISP — Wazuh Agent Consumer
Poleia alertas de alta severidade do Wazuh Manager API a cada 30s
e envia para análise via Ollama.
"""

import os
import time
import httpx
import json
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from analyzer import send_to_ollama, build_wazuh_prompt
from database import save_analysis

load_dotenv()


def get_wsl2_ip() -> str:
    """Descobre o IP atual do WSL2 dinamicamente."""
    import subprocess
    try:
        result = subprocess.run(
            ["wsl", "-d", "Ubuntu", "-e", "bash", "-c",
             "ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1"],
            capture_output=True, text=True, timeout=10
        )
        ip = result.stdout.strip()
        if ip:
            return f"https://{ip}:55000"
    except Exception:
        pass
    return "https://172.20.160.27:55000"  # fallback


WAZUH_HOST = os.getenv("WAZUH_HOST") or get_wsl2_ip()
WAZUH_USER = os.getenv("WAZUH_USER", "wazuh-wui")
WAZUH_PASS = os.getenv("WAZUH_PASS", "MyS3cr37P450r.*-")
MIN_LEVEL   = int(os.getenv("WAZUH_MIN_LEVEL", "10"))   # nível mínimo de alerta
POLL_SECS   = int(os.getenv("WAZUH_POLL_SECS", "30"))   # intervalo de polling


def get_token() -> str:
    r = httpx.post(
        f"{WAZUH_HOST}/security/user/authenticate",
        auth=(WAZUH_USER, WAZUH_PASS),
        verify=False,
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["data"]["token"]


def get_alerts(token: str, since: str) -> list:
    """Busca alertas com level >= MIN_LEVEL desde 'since' (ISO8601)."""
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "limit": 100,
        "sort": "-timestamp",
        "q": f"rule.level>={MIN_LEVEL};timestamp>{since}",
    }
    try:
        r = httpx.get(
            f"{WAZUH_HOST}/alerts",
            headers=headers,
            params=params,
            verify=False,
            timeout=20,
        )
        if r.status_code == 200:
            return r.json().get("data", {}).get("affected_items", [])
    except Exception as e:
        print(f"[Wazuh Consumer] Erro ao buscar alertas: {e}")
    return []


def build_consumer_prompt(alerts: list) -> str:
    lines = []
    for a in alerts:
        rule  = a.get("rule", {})
        agent = a.get("agent", {})
        data  = a.get("data", {})
        mitre = rule.get("mitre", {})
        lines.append(
            f"Rule:{rule.get('id','?')} | "
            f"Level:{rule.get('level','?')} | "
            f"Desc:{rule.get('description','?')[:80]} | "
            f"Agent:{agent.get('name','?')} | "
            f"IP:{data.get('srcip', a.get('agent',{}).get('ip','?'))} | "
            f"MITRE:{mitre.get('id','?')} / {mitre.get('technique','?')}"
        )
    return f"""Analise os alertas Wazuh abaixo e retorne JSON:

ALERTAS ({len(alerts)} eventos — level >= {MIN_LEVEL}):
{chr(10).join(lines)}

Retorne SOMENTE este JSON:
{{
  "priority": "CRÍTICO|ALTO|MÉDIO|BAIXO|SEM_ANOMALIA",
  "summary": "resumo em 2-3 frases",
  "findings": [{{"type":"str","description":"str","mitre":"str","confidence":"ALTA|MÉDIA|BAIXA"}}],
  "recommended_action": "ação imediata recomendada"
}}"""


def analyze_and_save(alerts: list):
    if not alerts:
        return
    result = send_to_ollama(build_consumer_prompt(alerts))
    save_analysis(
        source="wazuh-agent",
        count=len(alerts),
        priority=result.get("priority", "?"),
        summary=result.get("summary", ""),
        findings=result.get("findings", []),
        action=result.get("recommended_action", ""),
        events=alerts[:20],
    )
    print(f"[Wazuh Agent][{result.get('priority')}] {result.get('summary','')[:100]}")


def run():
    print(f"[Wazuh Consumer] Iniciando — host: {WAZUH_HOST} | level >= {MIN_LEVEL} | poll: {POLL_SECS}s")

    token = None
    token_ts = 0

    # Começa buscando alertas dos últimos 2 minutos
    last_check = datetime.now(timezone.utc) - timedelta(minutes=2)

    while True:
        try:
            # Renova token a cada 14 minutos (expira em 15)
            if time.time() - token_ts > 840:
                token = get_token()
                token_ts = time.time()
                print("[Wazuh Consumer] Token renovado.")

            since = last_check.strftime("%Y-%m-%dT%H:%M:%SZ")
            last_check = datetime.now(timezone.utc)

            alerts = get_alerts(token, since)

            if alerts:
                print(f"[Wazuh Consumer] {len(alerts)} alerta(s) encontrado(s) — analisando...")
                analyze_and_save(alerts)
            else:
                print(f"[Wazuh Consumer] Sem alertas level>={MIN_LEVEL} desde {since}")

        except httpx.HTTPStatusError as e:
            print(f"[Wazuh Consumer] HTTP {e.response.status_code} — reconectando em 30s")
            token_ts = 0  # força renovação de token
        except Exception as e:
            print(f"[Wazuh Consumer] Erro: {e} — tentando novamente em 30s")

        time.sleep(POLL_SECS)


if __name__ == "__main__":
    run()
