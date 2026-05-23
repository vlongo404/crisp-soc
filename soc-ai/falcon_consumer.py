import httpx
import json
import time
import os
from dotenv import load_dotenv
from analyzer import send_to_ollama, build_wazuh_prompt
from database import save_analysis

load_dotenv()

CLIENT_ID = os.getenv("FALCON_CLIENT_ID")
CLIENT_SECRET = os.getenv("FALCON_CLIENT_SECRET")
BASE_URL = os.getenv("FALCON_BASE_URL", "https://api.crowdstrike.com")


def get_token():
    r = httpx.post(
        f"{BASE_URL}/oauth2/token",
        data={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def get_stream(token):
    r = httpx.get(
        f"{BASE_URL}/sensors/entities/datafeed/v2",
        headers={"Authorization": f"Bearer {token}"},
        params={"appId": "crisp-consumer"},
        timeout=30,
    )
    r.raise_for_status()
    res = r.json()["resources"][0]
    return {
        "url": res["dataFeedURL"],
        "token": res["sessionToken"]["token"],
        "refresh_url": res.get("refreshActiveSessionURL", ""),
    }


def is_critical(event):
    return (
        event.get("metadata", {}).get("eventType") == "DetectionSummaryEvent"
        and event.get("event", {}).get("Severity", 0) >= 4
    )


def build_falcon_prompt(batch):
    detections = [
        e for e in batch
        if e.get("metadata", {}).get("eventType") == "DetectionSummaryEvent"
    ]
    lines = []
    for d in detections:
        ev = d.get("event", {})
        lines.append(
            f"Host:{ev.get('ComputerName','?')} "
            f"Sev:{ev.get('Severity')} "
            f"Tactic:{ev.get('Tactic')} "
            f"Technique:{ev.get('Technique')} "
            f"Process:{ev.get('FileName')} "
            f"Cmd:{str(ev.get('CommandLine',''))[:60]}"
        )
    return f"""Analise as detecções do CrowdStrike Falcon e retorne JSON:

DETECÇÕES ({len(detections)}):
{chr(10).join(lines)}

Retorne SOMENTE:
{{"priority":"CRÍTICO|ALTO|MÉDIO|BAIXO","summary":"str","findings":[{{"type":"str","description":"str","mitre":"str","confidence":"str"}}],"recommended_action":"str"}}"""


def analyze_batch(batch):
    relevant = [
        e for e in batch
        if e.get("metadata", {}).get("eventType") in {
            "DetectionSummaryEvent",
            "NetworkContainmentEvent",
            "AuthActivityAuditEvent",
        }
    ]
    if not relevant:
        return
    result = send_to_ollama(build_falcon_prompt(relevant))
    save_analysis(
        "crowdstrike",
        len(relevant),
        result.get("priority", "?"),
        result.get("summary", ""),
        result.get("findings", []),
        result.get("recommended_action", ""),
        relevant[:20],
    )
    print(f"[Falcon][{result.get('priority')}] {result.get('summary','')[:80]}")


def consume_stream():
    token = get_token()
    stream = get_stream(token)
    print(f"[Falcon] Stream ativo. Aguardando eventos...")
    buffer, last_flush, last_refresh = [], time.time(), time.time()

    with httpx.stream(
        "GET",
        stream["url"],
        headers={
            "Authorization": f"Token {stream['token']}",
            "Connection": "keep-alive",
        },
        timeout=None,
    ) as resp:
        for line in resp.iter_lines():
            now = time.time()
            # Renovar sessão a cada 25 minutos
            if now - last_refresh > 1500:
                httpx.post(
                    stream["refresh_url"],
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10,
                )
                last_refresh = now

            if not line or not line.strip():
                # Flush por tempo (30s sem novos eventos)
                if buffer and (now - last_flush) > 30:
                    analyze_batch(buffer.copy())
                    buffer.clear()
                    last_flush = now
                continue

            try:
                ev = json.loads(line)
                ev["_source"] = "crowdstrike_falcon"
                buffer.append(ev)
                # Flush imediato em evento crítico ou buffer cheio
                if is_critical(ev) or len(buffer) >= 20:
                    analyze_batch(buffer.copy())
                    buffer.clear()
                    last_flush = now
            except json.JSONDecodeError:
                continue


if __name__ == "__main__":
    while True:
        try:
            consume_stream()
        except Exception as e:
            print(f"[Falcon] Erro: {e} — reconectando em 30s")
            time.sleep(30)
