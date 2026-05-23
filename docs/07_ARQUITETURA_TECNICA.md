# 🏗️ Arquitetura Técnica — CRISP NG-SOC

## 1. Visão geral

O CRISP é uma plataforma de SOC composta por **cinco camadas funcionais**, conectadas por integrações ponto a ponto via API REST, syslog e pipelines de logs. A arquitetura prioriza componentes open source e processamento local, com integrações nativas ao ecossistema Fortinet.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 1 — TELEMETRIA                        │
│  FortiGate (Firewall/IPS) │ Zeek (NDR) │ Wazuh Agent (HIDS/EDR)│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA 2 — INGESTÃO E NORMALIZAÇÃO             │
│   Proxy Flask (FortiGate API)  │  Filebeat (Zeek logs)         │
│   Wazuh Manager (HIDS events)  │  Wazuh Consumer (EDR polling) │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              CAMADA 3 — ARMAZENAMENTO E CORRELAÇÃO              │
│   Wazuh Indexer (OpenSearch) — regras Sigma + customizadas      │
│              PostgreSQL — incidentes, análises IA               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│             CAMADA 4 — ANÁLISE E ORQUESTRAÇÃO                   │
│   FastAPI Bridge → Ollama (LLaMA 3.1) — análise de ameaças      │
│           Playbooks YAML — resposta automatizada                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              CAMADA 5 — APRESENTAÇÃO E AÇÃO                     │
│       Dashboard HTML/JS  │  Audit Log  │  Notificações          │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Componentes e responsabilidades

| Componente | Função | Tecnologia | Host |
|---|---|---|---|
| FortiGate | Firewall, IPS, Web Filter, App Control, DNS Filter | Fortinet 7.6 | VM VMware (NAT) |
| Proxy FortiGate | Mediação da API REST, abstração do token, rate limit | Flask + Python 3.10 | Windows |
| Zeek | Análise de tráfego de rede (NDR), geração de logs estruturados | Zeek 6.x | WSL2 Ubuntu |
| Filebeat | Shipping de logs Zeek para Wazuh Indexer | Elastic Filebeat 8.x | WSL2 Ubuntu |
| Wazuh Agent | HIDS/EDR, FIM, monitoramento de processos, autenticação | Wazuh 4.x | Endpoints Windows |
| Wazuh Manager | Aplicação de regras, correlação, gestão de agentes | Wazuh 4.x | Docker (WSL2) |
| Wazuh Indexer | Armazenamento de eventos, busca em tempo real | OpenSearch 2.x | Docker (WSL2) |
| Wazuh Consumer | Polling da Wazuh API — ingestão de alertas level≥10 para IA | Python 3.10 | Windows |
| FastAPI Bridge | Endpoint REST para análise de eventos pela IA | FastAPI + Uvicorn | Windows |
| Ollama | Serving local do modelo LLaMA 3.1 | Ollama 0.x | Docker (Windows) |
| PostgreSQL | Persistência de incidentes, análises IA e audit log | PostgreSQL 16 | Docker (Windows) |
| Dashboard CRISP | Interface unificada | HTML/CSS/JS puro | Browser |

## 3. Integrações — fluxos detalhados

### 3.1 FortiGate → Proxy → Dashboard

| Atributo | Valor |
|---|---|
| Protocolo | HTTPS |
| Autenticação | Bearer Token (REST API Admin) |
| Endpoints consumidos | `/api/v2/monitor/system/interface/`, `/api/v2/monitor/firewall/session`, `/api/v2/monitor/utm/app-lookup`, `/api/v2/cmdb/firewall/policy` |
| Frequência de polling | 5 a 15 segundos (configurável) |
| Tratamento de erros | Retry com backoff exponencial, 3 tentativas |
| Cache | TTL de 10s para reduzir carga no FortiGate |

### 3.2 Endpoints → Wazuh Agent → Wazuh Manager → Indexer

| Atributo | Valor |
|---|---|
| Protocolo agente-manager | TCP 1514 (encrypted) |
| Protocolo manager-indexer | HTTPS 9200 |
| Regras aplicadas | Regras Wazuh oficiais + `local_rules.xml` (regras customizadas CRISP) |
| Eventos monitorados | Logins Windows (4624/4625/4672), FIM em pastas críticas, alterações de registro, execução de processos |
| Throughput esperado | até 50.000 EPS (events per second) por manager |

### 3.3 Rede → Zeek → Filebeat → Wazuh Indexer

| Atributo | Valor |
|---|---|
| Captura | SPAN port ou TAP físico replicando tráfego para a interface monitorada |
| Logs gerados | `conn.log`, `dns.log`, `http.log`, `ssl.log`, `files.log`, `notice.log` |
| Formato | JSON (configurado em `local.zeek`) |
| Filebeat módulo | Customizado para parsear cada log file do Zeek |
| Latência | < 5 segundos da captura até indexação |

### 3.4 Wazuh Alert → FastAPI → Ollama → Análise

| Atributo | Valor |
|---|---|
| Trigger | `wazuh_consumer.py` — polling da Wazuh Manager API (JWT) a cada 30s |
| Endpoint | `POST http://localhost:8000/analyze` |
| Payload | JSON com evento bruto + contexto (asset, severity, rule_id) |
| Modelo IA | `llama3.1:8b` (configurável para `llama3.1:70b` em hardware maior) |
| Prompt template | System prompt em pt-BR especializado em MITRE ATT&CK + few-shot examples |
| Latência | 3–15 segundos por evento |
| Output | JSON estruturado: classificação, técnica MITRE, severity, recomendações, briefing em pt-BR |

### 3.5 Análise → Playbook → FortiGate

| Atributo | Valor |
|---|---|
| Motor | Python (em playbook executor — extensível para n8n/Shuffle) |
| Ações no FortiGate | Adicionar IP a address group de quarentena, criar política de bloqueio, adicionar domínio ao DNS Filter |
| Audit | Toda ação gera registro no PostgreSQL com hash SHA-256 |

### 3.6 Wazuh Agent EDR → Consumer → Análise

| Atributo | Valor |
|---|---|
| Protocolo | Wazuh Manager REST API (HTTPS, porta 55000) |
| Autenticação | JWT renovado automaticamente a cada 14 minutos |
| Eventos consumidos | Alertas com `rule.level >= 10` — execução suspeita, FIM, autenticação anômala |
| Persistência | PostgreSQL tabela `analyses` |
| Trigger downstream | Alertas críticos disparam análise IA + playbook imediatamente |

## 4. Matriz de portas

| Porta | Direção | Protocolo | Componente |
|---|---|---|---|
| 443 | Inbound (LAN) | HTTPS | FortiGate Web UI / API |
| 5000 | Loopback | HTTP | Proxy Flask FortiGate |
| 8000 | Loopback | HTTP | FastAPI Bridge |
| 11434 | Loopback | HTTP | Ollama API |
| 5432 | Loopback | TCP | PostgreSQL |
| 1514 | Inbound (LAN) | TCP/UDP | Wazuh Agent ingest |
| 1515 | Inbound (LAN) | TCP | Wazuh Agent enrollment |
| 9200 | Loopback (WSL2) | HTTPS | Wazuh Indexer |
| 55000 | Loopback (WSL2) | HTTPS | Wazuh Manager API |
| 47760 | Loopback (WSL2) | TCP | Zeek BroControl |

## 5. Dados em trânsito vs em repouso

| Caminho | Em trânsito | Em repouso |
|---|---|---|
| Endpoint → Wazuh Agent | TLS | — |
| Wazuh Agent → Manager | AES-256 (Wazuh native) | — |
| Manager → Indexer | HTTPS | OpenSearch — não criptografado por padrão (recomendado ativar) |
| FortiGate → Proxy | HTTPS | — |
| Proxy → Dashboard | HTTP localhost | — |
| Eventos → Ollama | HTTP localhost | — |
| Análises IA → PostgreSQL | TCP localhost | Não criptografado por padrão (recomendado ativar TDE/disk encryption) |

## 6. Pontos de extensão

Para evolução pós-MVP, a arquitetura prevê:

1. **SOAR integrado** — substituir o playbook executor Python por n8n ou Shuffle, ganhando interface visual de workflow.
2. **RAG sobre histórico** — vector store (pgvector ou Qdrant) com incidentes passados, enriquecendo o prompt do LLM com casos similares.
3. **FortiAnalyzer** — adicionar fonte adicional pelo conector REST do FortiAnalyzer, permitindo correlação multi-FortiGate.
4. **MFA e RBAC** no dashboard — integração com Keycloak ou Authentik para multi-usuário e auditoria por analista.
5. **Sigma rules nativas** — conversor Sigma → Wazuh para acelerar adoção de detecções comunitárias.

## 7. Decisões arquiteturais — justificativas

| Decisão | Alternativa rejeitada | Razão |
|---|---|---|
| Ollama local em vez de OpenAI/Anthropic | API em nuvem | LGPD + custo recorrente |
| HTML puro em vez de React/Vue | Framework SPA | Reduzir dependências, facilitar deploy offline |
| Flask proxy em vez de chamar FortiGate direto do front | JS direto no browser | Esconder token, centralizar rate limit e cache |
| Postgres em vez de MongoDB | NoSQL | Audit log e integridade transacional |
| Wazuh em vez de Elastic Stack puro | ELK custom | SIEM out-of-the-box, regras prontas, comunidade ativa |
| Zeek em vez de Suricata | IDS-only | NDR foca em análise comportamental, não só assinatura |
| Wazuh Agent como EDR em vez de CrowdStrike Falcon | EDR proprietário | Custo zero, integração nativa com Wazuh SIEM, sem dependência de licença |
| Docker em vez de bare metal | Instalação nativa | Reprodutibilidade, isolamento, portabilidade |
