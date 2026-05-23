import os
import re
import json
import httpx
from dotenv import load_dotenv
from database import save_analysis

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("MODEL", "llama3.1:8b")

SYSTEM_PROMPT = """Você é um analista sênior de SOC. Ambiente monitorado:
- FortiGate: firewall de borda, rede 192.168.0.0/16
- Wazuh: SIEM central com agentes em todos os hosts
- Zeek/Suricata: NIDS monitorando tráfego interno
- CrowdStrike Falcon: EDR nos endpoints
Frameworks: MITRE ATT&CK, NIST CSF. Responda SOMENTE em JSON válido, sem texto adicional."""


def send_to_ollama(user_prompt: str) -> dict:
    try:
        r = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL,
                "system": SYSTEM_PROMPT,
                "prompt": user_prompt,
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 800},
            },
            timeout=120,
        )
        raw = r.json()["response"].strip()
        clean = re.sub(r"```json|```", "", raw).strip()
        return json.loads(clean)
    except json.JSONDecodeError:
        return {
            "priority": "PARSE_ERROR",
            "summary": raw[:300],
            "findings": [],
            "recommended_action": "Verificar output do modelo",
        }
    except Exception as e:
        return {
            "priority": "ERRO",
            "summary": str(e),
            "findings": [],
            "recommended_action": "Verificar se Ollama está rodando em localhost:11434",
        }


def build_wazuh_prompt(alerts: list) -> str:
    lines = []
    for a in alerts:
        lines.append(
            f"Rule: {a.get('rule', {}).get('id', '?')} | "
            f"Level: {a.get('rule', {}).get('level', '?')} | "
            f"Desc: {a.get('rule', {}).get('description', '?')} | "
            f"Agent: {a.get('agent', {}).get('name', '?')} | "
            f"IP: {a.get('data', {}).get('srcip', '?')} | "
            f"MITRE: {a.get('rule', {}).get('mitre', {}).get('id', '?')}"
        )
    return f"""Analise os alertas Wazuh abaixo e retorne JSON:

ALERTAS ({len(alerts)} eventos):
{chr(10).join(lines)}

Retorne SOMENTE este JSON:
{{
  "priority": "CRÍTICO|ALTO|MÉDIO|BAIXO|SEM_ANOMALIA",
  "summary": "resumo em 2-3 frases",
  "findings": [{{"type":"str","description":"str","mitre":"str","confidence":"ALTA|MÉDIA|BAIXA"}}],
  "recommended_action": "ação imediata"
}}"""


def analyze_wazuh_batch(alerts: list):
    if not alerts:
        return
    prompt = build_wazuh_prompt(alerts)
    result = send_to_ollama(prompt)
    save_analysis(
        source="wazuh",
        count=len(alerts),
        priority=result.get("priority", "?"),
        summary=result.get("summary", ""),
        findings=result.get("findings", []),
        action=result.get("recommended_action", ""),
        events=alerts,
    )
    print(f"[Wazuh][{result.get('priority')}] {result.get('summary', '')[:80]}")
    return result
