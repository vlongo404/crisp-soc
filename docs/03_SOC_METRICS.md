# Métricas de SOC — CRISP NG-SOC

## 1. Definições

| Sigla | Nome | Descrição |
|---|---|---|
| MTTD | Mean Time To Detect | Tempo médio entre a ocorrência do evento e a geração do alerta |
| MTTR | Mean Time To Respond | Tempo médio entre a geração do alerta e a contenção/resposta |
| MTTI | Mean Time To Investigate | Tempo médio entre alerta e conclusão da investigação |
| FPR | False Positive Rate | Proporção de alertas que não correspondem a ameaças reais |
| Coverage | Cobertura MITRE ATT&CK | % de técnicas relevantes monitoradas pelo SOC |

## 2. Alvos por playbook

Valores estimados com base na arquitetura proposta (detecção via Wazuh/Zeek com regras pré-calibradas, IA local para enriquecimento, resposta automatizada via API FortiGate/Falcon).

| Playbook | MTTD alvo | MTTR alvo | FPR esperada | Confiança da estimativa |
|---|---|---|---|---|
| Ransomware (rename burst) | < 10 s | < 30 s | 2–5% | Alta — regra determinística baseada em threshold de FIM |
| Movimento lateral | 30–120 s | 60–180 s | 10–15% | Média — depende de baseline de comportamento; FPR inicial mais alta |
| DNS Tunneling | 15–60 s | < 60 s | 5–10% | Média — entropia + payload size são heurísticas, podem gerar FP em CDN |
| Falcon EDR (sev alta) | < 5 s | < 60 s | < 2% | Alta — sinal vem do EDR já classificado |

## 3. KPIs operacionais do SOC

| KPI | Definição | Alvo (3 meses) | Alvo (12 meses) |
|---|---|---|---|
| Alertas por dia | Volume total processado | 200–500 | 500–2.000 |
| Alertas críticos por dia | Severidade ≥ alta | 5–15 | 10–30 |
| Taxa de fechamento | Alertas fechados / alertas abertos | ≥ 90% | ≥ 95% |
| Tempo médio de fechamento (não automatizado) | Alerta → resolução manual | < 4h | < 1h |
| Cobertura MITRE ATT&CK | Técnicas monitoradas / técnicas relevantes | 30% | 60% |
| Disponibilidade da plataforma | Uptime do dashboard + APIs | 99% | 99,5% |
| Tempo de retenção de logs | Volume × política | 30 dias | 90 dias |

## 4. Métricas específicas da camada de IA

| Métrica | Definição | Alvo |
|---|---|---|
| Latência de análise IA | Tempo de inferência do Ollama por evento | < 5 s (eventos curtos), < 15 s (contexto longo) |
| Taxa de acerto da classificação | Casos validados como corretos em revisão humana | ≥ 75% (validação documentada em `04_LLM_VALIDATION.md`) |
| Taxa de alucinação detectada | Saídas com fatos inventados / total | < 10% |
| Cobertura por tática MITRE | Táticas com prompt template específico | 6 de 14 (TA0001–TA0014) na v1 |

## 5. Volumetria estimada da plataforma

Cenário de referência: **PME brasileira, 100–300 endpoints, 1 FortiGate, 1 segmento de rede monitorado pelo Zeek**.

| Componente | Volume estimado/dia | Armazenamento mensal |
|---|---|---|
| Wazuh — alertas | 10k–50k eventos | 5–20 GB |
| Zeek — logs de conexão | 1M–5M linhas | 30–100 GB |
| FortiGate — logs de tráfego (via proxy) | sob demanda (não armazenado) | — |
| Falcon — detecções | 10–100 | < 1 GB |
| Análises IA armazenadas (Postgres) | 100–500 | < 500 MB |

## 6. Metodologia das estimativas

Os números acima são **estimativas baseadas em arquitetura**, não medidos em produção. Foram derivados de:

- Documentação oficial do Wazuh e Zeek para thresholds de detecção típicos.
- Latências observadas em testes locais do Ollama com `llama3.1:8b` em hardware classe workstation (32GB RAM, GPU dedicada opcional).
- Benchmarks públicos de FPR para regras Sigma equivalentes às do `local_rules.xml`.
- Casos de uso publicados pela ANPD e relatórios do CERT.br sobre incidentes em empresas brasileiras de porte médio.

Em deployment real, todos os alvos devem ser **medidos durante 30 dias de tuning** antes de serem assumidos como SLA contratual.
