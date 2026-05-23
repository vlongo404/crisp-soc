# Threat Model & MITRE ATT&CK Mapping — CRISP NG-SOC

## 1. Escopo

Este documento descreve as ameaças cobertas pela plataforma CRISP e o mapeamento dos playbooks de resposta para a matriz **MITRE ATT&CK Enterprise v15**. Cobre dois domínios:

- **Ameaças detectadas pelo CRISP** — eventos que a plataforma monitora e responde.
- **Ameaças contra o próprio CRISP (STRIDE)** — superfície de ataque da plataforma em si.

---

## 2. Ameaças detectadas — MITRE ATT&CK Mapping

### 2.1 Cenário: Ransomware

| Campo | Valor |
|---|---|
| Playbook | `playbook-ransomware.yml` |
| Gatilho de detecção | 500+ operações de rename em 30 segundos (Wazuh FIM + regra customizada) |
| Fonte do sinal | Wazuh Agent (Windows) + Zeek (tráfego SMB anômalo) |
| Tática MITRE | TA0040 — Impact |
| Técnicas MITRE | T1486 (Data Encrypted for Impact), T1490 (Inhibit System Recovery), T1083 (File and Directory Discovery) |
| Resposta automatizada | Isolar host via FortiGate (quarentena de IP), bloquear C2 conhecido, alerta SOC, análise IA do evento |
| Tempo alvo (MTTR) | < 30s do gatilho até isolamento |

### 2.2 Cenário: Movimento Lateral

| Campo | Valor |
|---|---|
| Playbook | `playbook-lateral-movement.yml` |
| Gatilho de detecção | Conexões internas anômalas (Zeek NDR) + uso de credenciais administrativas fora do horário (Wazuh) |
| Fonte do sinal | Zeek `conn.log`, Wazuh autenticação Windows (4624/4672) |
| Tática MITRE | TA0008 — Lateral Movement |
| Técnicas MITRE | T1021.001 (RDP), T1021.002 (SMB/Windows Admin Shares), T1570 (Lateral Tool Transfer), T1078 (Valid Accounts) |
| Resposta automatizada | Alerta SOC, IA classifica intenção, sugere revisão de políticas FortiGate, opcional: bloqueio de segmentação |
| Tempo alvo (MTTR) | < 2 min do gatilho até alerta enriquecido |

### 2.3 Cenário: DNS Tunneling / Exfiltração

| Campo | Valor |
|---|---|
| Playbook | `playbook-dns-tunneling.yml` |
| Gatilho de detecção | Queries DNS com payload > 100 bytes ou domínios com alta entropia (Zeek `dns.log`) |
| Fonte do sinal | Zeek NDR, FortiGate DNS Filter |
| Tática MITRE | TA0011 — Command and Control / TA0010 — Exfiltration |
| Técnicas MITRE | T1071.004 (Application Layer Protocol: DNS), T1048.003 (Exfiltration Over Unencrypted Non-C2 Protocol), T1568 (Dynamic Resolution) |
| Resposta automatizada | Bloquear domínio no FortiGate, alertar SOC, IA analisa entropia + frequência para confirmar |
| Tempo alvo (MTTR) | < 1 min do gatilho até bloqueio |

### 2.4 Cenário: Wazuh Agent EDR — Processo Malicioso

| Campo | Valor |
|---|---|
| Playbook | `playbook-wazuh-edr.yml` |
| Gatilho de detecção | Alerta Wazuh level ≥ 10 — execução suspeita, PowerShell ofuscado, FIM em pastas críticas |
| Fonte do sinal | `wazuh_consumer.py` — polling da Wazuh Manager API a cada 30s |
| Tática MITRE | TA0002 — Execution / TA0005 — Defense Evasion |
| Técnicas MITRE | T1059 (Command and Scripting Interpreter), T1055 (Process Injection), T1027 (Obfuscated Files or Information) |
| Resposta automatizada | Isolamento via FortiNAC, alerta SOC, IA gera resumo do incidente em pt-BR |
| Tempo alvo (MTTR) | < 1 min do gatilho até quarentena |

---

## 3. STRIDE — Ameaças contra a plataforma CRISP

| Categoria | Ameaça | Componente afetado | Mitigação atual | Mitigação proposta |
|---|---|---|---|---|
| **S**poofing | Atacante se passa pelo FortiGate enviando dados falsos ao proxy | `proxy_fortigate.py` | Token Bearer no FortiGate | Validar TLS com cert pinning, restringir IP de origem |
| **T**ampering | Manipulação de regras Wazuh para suprimir alertas | `wazuh/config/local_rules.xml` | Permissões de arquivo | Hash de integridade nas regras + alerta em alteração |
| **R**epudiation | Analista nega ter aprovado ação de resposta automática | Dashboard / playbooks | Nenhuma | Audit log com SHA-256 por ação, append-only no Postgres |
| **I**nformation Disclosure | Token `super_admin` do FortiGate exposto via proxy Flask | `proxy/.env` | `.gitignore` + perfil read-only recomendado | Vault local (HashiCorp Vault / `pass`), bind 127.0.0.1, shared-secret header |
| **D**enial of Service | Flood de eventos no FastAPI satura Ollama | `soc-ai/main.py` | Nenhuma | Rate limit por origem, fila Redis, backpressure |
| **E**levation of Privilege | Comprometimento do host → uso do token FortiGate para alterar políticas | Proxy + FortiGate | Token único | Perfil FortiGate read-only + workflow de aprovação para escrita |

---

## 4. Threat Model — Resumo executivo

O CRISP opera como **camada de orquestração defensiva** entre fontes de telemetria (FortiGate, Wazuh, Zeek, Wazuh Agent EDR) e o operador humano, com IA local fazendo enriquecimento e triagem. Os principais riscos identificados são:

1. **Exposição do token FortiGate** — risco crítico, mitigado por escopo read-only e isolamento de rede.
2. **Confiança excessiva no LLM** — risco médio, mitigado pela validação documentada em `04_LLM_VALIDATION.md` e por manter o humano no loop (aprovação para ações de escrita).
3. **Falsos positivos em playbooks automatizados** — risco médio, mitigado por thresholds calibrados e modo dry-run antes de produção.

Ameaças explicitamente **fora de escopo** desta versão:
- Ataques físicos à infraestrutura.
- Comprometimento do host Windows que hospeda o CRISP (depende de hardening externo).
- Insider threat com acesso administrativo legítimo ao próprio CRISP.
