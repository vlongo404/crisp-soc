# CRISP NG-SOC Platform

**Cyber Response Intelligence Security Platform**

Plataforma de SOC (Security Operations Center) de próxima geração, construída do zero com integração nativa ao ecossistema Fortinet, SIEM open source, detecção de rede e Inteligência Artificial local.

---

## 📺 Demonstração

> Dashboard unificado com dados reais do FortiGate, alertas do Wazuh, logs do Zeek e análise de ameaças via IA local (Ollama + LLaMA 3.1) — tudo sem enviar dados para a nuvem.

---

## 🏗️ Arquitetura

```
Rede / Endpoints
      │
      ├── FortiGate 7.6 ──────► Proxy Flask ──────────────────────┐
      │   (API REST / Bearer)   (porta 5000)                      │
      │                                                           ▼
      └── Zeek NDR ──► Filebeat ──► Wazuh Indexer          Dashboard CRISP
          (logs JSON)              (OpenSearch :9200)        (crisp.html)
                                        │                         ▲
                                   Wazuh Manager                  │
                                 (regras customizadas)            │
                                        │                         │
                                   FastAPI + Ollama ──────────────┘
                                   (IA local LLaMA 3.1)
                                   (porta 8000)
```

---

## 🧩 Componentes

| Componente | Tecnologia | Onde roda |
|-----------|-----------|-----------|
| Firewall / borda | FortiGate 7.6 | VM VMware (NAT) |
| SIEM | Wazuh 4.x | WSL2 / Docker |
| NDR | Zeek | WSL2 / Ubuntu |
| IA local | Ollama + LLaMA 3.1 | Docker Windows |
| Banco de dados | PostgreSQL | Docker Windows |
| EDR | CrowdStrike Falcon | Agente Windows |
| Agente host | Wazuh Agent | Windows |
| API de IA | FastAPI (Python) | Windows |
| Proxy FortiGate | Flask (Python) | Windows |
| Dashboard | HTML/CSS/JS puro | Navegador |

---

## ⚙️ Pré-requisitos

### Windows (host principal)
- Windows 10/11 64-bit
- [WSL2](https://learn.microsoft.com/pt-br/windows/wsl/install) com Ubuntu instalado
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (integração WSL2 ativada)
- Python 3.10+ com pip
- Node.js 18+ (só para gerar documentos — opcional)

### WSL2 / Ubuntu
- Docker e Docker Compose
- Zeek NDR (`apt install zeek`)
- Filebeat 8.x

### Contas e licenças
- FortiGate físico ou VM com licença (avaliação gratuita em [forticloud.com](https://support.fortinet.com))
- CrowdStrike Falcon — opcional (o dashboard funciona sem ele)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/vlongo404/crisp-soc.git
cd crisp-soc
```

### 2. Configure as credenciais do FortiGate

```bash
cp proxy/.env.example proxy/.env
```

Edite `proxy/.env` com os dados do seu FortiGate:

```env
FG_HOST=192.168.1.1      # IP do seu FortiGate
FG_PORT=443
FG_TOKEN=seu_token_aqui  # Criado em: System > Admin > REST API Admin
```

### 3. Suba o Docker (Postgres + Ollama)

```bash
docker-compose up -d
```

Aguarde o Ollama iniciar e baixe o modelo:

```bash
docker exec -it ollama ollama pull llama3.1
```

### 4. Instale as dependências Python

```bash
# Proxy FortiGate
cd proxy
pip install -r requirements.txt

# AI Pipeline
cd ../soc-ai
pip install -r requirements.txt
```

### 5. Configure o Wazuh (WSL2)

No WSL2, suba o Wazuh com Docker Compose:

```bash
cd /opt/crisp-soc/wazuh/wazuh-docker/single-node
docker-compose up -d
```

Copie as regras customizadas para o container:

```bash
docker cp wazuh/config/local_rules.xml wazuh.manager:/var/ossec/etc/rules/local_rules.xml
docker exec wazuh.manager /var/ossec/bin/wazuh-control restart
```

### 6. Configure o Zeek

```bash
sudo cp zeek/local.zeek /opt/zeek/share/zeek/site/local.zeek
sudo zeekctl deploy
```

### 7. Inicie tudo de uma vez (Windows)

Depois de configurado, basta rodar:

```
start-crisp.bat
```

Ou iniciar manualmente:

```powershell
# AI Pipeline
cd soc-ai
uvicorn main:app --host 0.0.0.0 --port 8000

# Proxy FortiGate (outro terminal)
cd proxy
python proxy_fortigate.py
```

Abra `dashboard/crisp.html` no navegador.

---

## 📁 Estrutura do Projeto

```
crisp-soc/
├── dashboard/
│   └── crisp.html              # Dashboard principal (HTML puro)
├── proxy/
│   ├── proxy_fortigate.py      # Proxy Flask para API do FortiGate
│   ├── requirements.txt
│   └── .env.example            # Template de credenciais
├── soc-ai/
│   ├── main.py                 # FastAPI — integração com Ollama
│   ├── analyzer.py             # Lógica de análise de ameaças
│   ├── falcon_consumer.py      # Consumidor CrowdStrike Falcon
│   ├── database.py             # Conexão PostgreSQL
│   └── requirements.txt
├── wazuh/
│   └── config/
│       ├── local_rules.xml     # Regras customizadas Wazuh
│       └── ossec.conf          # Configuração do manager
├── zeek/
│   └── local.zeek              # Configuração do Zeek NDR
├── playbooks/
│   ├── playbook-ransomware.yml
│   ├── playbook-lateral-movement.yml
│   ├── playbook-dns-tunneling.yml
│   └── playbook-falcon-edr.yml
├── systemd/                    # Serviços Linux (WSL2)
├── docx-gen/                   # Scripts para gerar roteiros/slides
├── docker-compose.yml          # Postgres + Ollama
├── start-crisp.bat             # Inicialização completa da stack
├── Roteiro_SOC_Demo_2pessoas.docx
└── Pitch_CRISP_Fortinet.pptx
```

---

## 🔌 Endpoints da API

### Proxy FortiGate (`http://localhost:5000`)

| Endpoint | Descrição |
|----------|-----------|
| `GET /health` | Status da conexão com o FortiGate |
| `GET /api/status` | Resumo de interfaces, rx/tx, versão, serial |
| `GET /api/interfaces` | Lista completa de interfaces |
| `GET /api/policies` | Políticas de firewall |
| `GET /api/sessions` | Sessões ativas |
| `GET /api/threats` | Detecções UTM/App Control |

### AI Pipeline (`http://localhost:8000`)

| Endpoint | Descrição |
|----------|-----------|
| `POST /analyze` | Envia evento para análise pelo LLaMA 3.1 |
| `GET /health` | Status do Ollama e modelo carregado |

---

## 🛡️ Diferenciais

- **IA 100% local** — Ollama + LLaMA 3.1 roda na empresa, sem enviar dados para nuvem. Conformidade com LGPD.
- **Integração nativa Fortinet** — FortiGate via API REST Bearer token, pronto para FortiAnalyzer e FortiNAC.
- **Custo zero em licenças** — Wazuh, Zeek, Ollama e PostgreSQL são open source.
- **Resposta automatizada** — playbooks executam isolamento, bloqueio de C2 e alertas em menos de 30 segundos.
- **Dashboard unificado** — FortiGate + Wazuh + Zeek + Falcon numa única interface sem frameworks.

---

## 📋 Playbooks de Resposta

| Playbook | Gatilho | Ações |
|----------|---------|-------|
| Ransomware | 500+ renames em 30s | Alerta → IA → Isolar host → Bloquear C2 |
| Movimento Lateral | Conexões internas anômalas | Alerta → IA → Revisão de políticas |
| DNS Tunneling | Queries DNS com payload > 100b | Alerta → IA → Bloquear domínio |
| Falcon EDR | Processo malicioso detectado | Alerta → IA → Quarentena |

---

## 📄 Documentos

- `Roteiro_SOC_Demo_2pessoas.docx` — Roteiro completo da demo técnica (10 min, 2 apresentadores)
- `Pitch_CRISP_Fortinet.pptx` — Slides do pitch comercial para representantes Fortinet (5 min)

---

## 👥 Equipe

Desenvolvido como projeto acadêmico para apresentação a representantes Fortinet.

---

## ⚠️ Segurança

- **Nunca** suba o arquivo `proxy/.env` com credenciais reais
- O token do FortiGate deve ser de um usuário REST API com permissões mínimas (read-only)
- Em produção, use HTTPS no proxy Flask e restrinja CORS

---

## 📜 Licença

MIT License — livre para uso, modificação e distribuição com atribuição.
