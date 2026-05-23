# 📘 Guia de Implementação — CRISP NG-SOC

Este documento permite que um avaliador reproduza o ambiente CRISP do zero. Para o passo a passo completo com configuração de FortiGate VM, ver `README.md`. Este guia é a **versão enxuta** para validação rápida.

---

## 1. Pré-requisitos

| Componente | Requisito mínimo | Onde validar |
|---|---|---|
| Sistema operacional | Windows 10/11 64-bit | `winver` |
| WSL2 | Ubuntu 22.04+ | `wsl --status` |
| Docker Desktop | 4.20+, com integração WSL2 | `docker --version` |
| Python | 3.10+ | `python --version` |
| Hardware | 16 GB RAM, 50 GB livres em disco | — |
| GPU (opcional) | NVIDIA com 6 GB+ VRAM para acelerar Ollama | `nvidia-smi` |
| FortiGate | VM 7.6 ativa via NAT ou hardware acessível por IP | — |

---

## 2. Instalação em 7 passos

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/vlongo404/crisp-soc.git
cd crisp-soc
```

### Passo 2 — Configurar credenciais do FortiGate

```bash
copy proxy\.env.example proxy\.env
```

Editar `proxy/.env`:

```
FG_HOST=192.168.174.129
FG_PORT=443
FG_TOKEN=<token_gerado_no_fortigate>
```

Para gerar o token, ver seção "Configuração do FortiGate VM" no `README.md`.

### Passo 3 — Subir PostgreSQL e Ollama

```bash
docker-compose up -d
docker exec -it ollama ollama pull llama3.1
```

Aguardar o download do modelo (≈ 4,7 GB). Validar:

```bash
docker exec -it ollama ollama list
```

Deve listar `llama3.1:latest`.

### Passo 4 — Instalar dependências Python

```bash
cd proxy
pip install -r requirements.txt
cd ..\soc-ai
pip install -r requirements.txt
cd ..
```

### Passo 5 — Subir Wazuh no WSL2

```bash
wsl
cd /opt/crisp-soc/wazuh/wazuh-docker/single-node
docker-compose up -d
```

Aplicar regras customizadas:

```bash
docker cp wazuh/config/local_rules.xml wazuh.manager:/var/ossec/etc/rules/local_rules.xml
docker exec wazuh.manager /var/ossec/bin/wazuh-control restart
exit
```

### Passo 6 — Configurar Zeek (WSL2)

```bash
wsl
sudo cp zeek/local.zeek /opt/zeek/share/zeek/site/local.zeek
sudo zeekctl deploy
exit
```

### Passo 7 — Iniciar serviços CRISP

```bash
start-crisp.bat
```

Abrir `dashboard/crisp.html` no navegador. Validar que:

- O dashboard carrega sem erros no console (F12)
- Métricas do FortiGate aparecem em até 5 segundos
- Painel da IA mostra "Ollama: connected"

---

## 3. Validação rápida (smoke test)

Após subir, rode estes 4 comandos. Todos devem retornar HTTP 200:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/status
curl http://localhost:8000/health
curl -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d "{\"event\":\"test\"}"
```

Saída esperada do primeiro comando:

```json
{"status":"ok","fortigate":"192.168.174.129","version":"7.6.x"}
```

---

## 4. Testar um cenário de detecção

Para validar o pipeline completo, simule um burst de renames em uma pasta de teste:

```powershell
# PowerShell — gera 600 arquivos e renomeia todos em loop
New-Item -ItemType Directory -Force -Path C:\TestCRISP
1..600 | ForEach-Object { New-Item -Path "C:\TestCRISP\file$_.txt" -ItemType File -Force | Out-Null }
1..600 | ForEach-Object { Rename-Item -Path "C:\TestCRISP\file$_.txt" -NewName "encrypted$_.locked" }
```

Resultado esperado em até 30 segundos:

1. Alerta crítico no dashboard CRISP
2. Análise gerada pela IA, em português, mapeada ao MITRE T1486
3. Log do playbook `playbook-ransomware` em `soc-ai/logs/`

---

## 5. Estrutura de portas e serviços

| Porta | Serviço | Origem |
|---|---|---|
| 443 | FortiGate Web UI / API | Externo (VM ou hardware) |
| 5000 | Proxy Flask (FortiGate) | Local (host Windows) |
| 8000 | FastAPI (Ollama bridge) | Local (host Windows) |
| 11434 | Ollama API | Docker (host Windows) |
| 5432 | PostgreSQL | Docker (host Windows) |
| 1514, 1515 | Wazuh Agent ingest | WSL2 |
| 9200 | Wazuh Indexer (OpenSearch) | WSL2 |
| 443 (WSL2) | Wazuh Dashboard | WSL2 |
| 47760/tcp | Zeek BroControl | WSL2 |

---

## 6. Troubleshooting rápido

| Sintoma | Diagnóstico | Solução |
|---|---|---|
| Dashboard mostra "FortiGate: disconnected" | Token errado ou FortiGate offline | `curl http://localhost:5000/health` e validar o FG_TOKEN |
| Ollama timeout no `/analyze` | Modelo não carregado ou GPU sem memória | `docker logs ollama` — relancar com `ollama pull llama3.1` |
| Wazuh manager não recebe eventos | Filebeat não enviando | `docker logs filebeat` no WSL2 |
| Playbook não dispara | Regra Wazuh não recarregada | `docker exec wazuh.manager /var/ossec/bin/wazuh-control restart` |
| Porta 5000 ocupada | Outro Flask ativo | `netstat -ano \| findstr 5000` e matar o PID |
| Browser bloqueia o dashboard | CORS no Flask | Verificar `Access-Control-Allow-Origin` no `proxy_fortigate.py` |

---

## 7. Tempo estimado de reprodução

| Etapa | Tempo |
|---|---|
| Clonar repo + configurar `.env` | 5 min |
| Docker Compose + pull do modelo Ollama | 15–25 min (depende de banda) |
| Pip install nas duas pastas | 3 min |
| Wazuh + Zeek no WSL2 | 10–15 min |
| Smoke test + cenário de demonstração | 5 min |
| **Total realista** | **40–55 min** |

---

## 8. Como o avaliador valida que está rodando

Checklist mínimo para considerar o ambiente reprodutível:

- [ ] `docker ps` mostra ao menos: `ollama`, `postgres`, `wazuh.manager`, `wazuh.indexer`
- [ ] `curl http://localhost:5000/health` retorna 200
- [ ] `curl http://localhost:8000/health` retorna 200
- [ ] Dashboard carrega no browser e mostra dados em tempo real
- [ ] Cenário de ransomware dispara alerta com análise IA em ≤ 30 s
- [ ] Logs do playbook em `soc-ai/logs/` registram a ação executada
