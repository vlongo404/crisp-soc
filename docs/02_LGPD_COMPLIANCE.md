# Aderência LGPD — CRISP NG-SOC

## 1. Contexto regulatório

A **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** estabelece obrigações específicas para o tratamento de dados pessoais por organizações brasileiras. Em um SOC, logs de rede, autenticação e endpoint contêm rotineiramente dados pessoais: identificadores de usuários, endereços IP (considerados dados pessoais pela ANPD em casos qualificados), nomes de máquinas associados a colaboradores, e conteúdo de pacotes em alertas.

Quando um SOC envia esses logs para serviços de IA em nuvem (OpenAI, Anthropic, Google), três obrigações da LGPD são acionadas simultaneamente: **base legal para transferência**, **transferência internacional**, e **princípio da minimização**.

## 2. Por que IA local atende e IA em nuvem não

### Princípio da minimização — Art. 6º, inciso III

> "Limitação do tratamento ao mínimo necessário para a realização de suas finalidades."

| Cenário | Avaliação |
|---|---|
| Ollama local (CRISP) | ✅ Atende. Os dados nunca deixam o perímetro da empresa. O escopo de tratamento é o mínimo necessário para a finalidade declarada (detecção e resposta a incidentes). |
| OpenAI / Anthropic API | ⚠️ Risco. Logs completos são enviados ao processador externo, o que tipicamente excede o mínimo necessário e cria histórico fora do controle do controlador. |

### Transferência internacional — Art. 33

> "A transferência internacional de dados pessoais somente é permitida nos seguintes casos: I - para países ou organismos internacionais que proporcionem grau de proteção de dados pessoais adequado..."

| Cenário | Avaliação |
|---|---|
| Ollama local (CRISP) | ✅ **Não há transferência internacional.** O modelo LLaMA 3.1 roda em hardware dentro do Brasil; o requisito do Art. 33 não é acionado. |
| OpenAI / Anthropic API | ⚠️ Transferência internacional para os EUA. Exige uma das bases do Art. 33 (cláusulas contratuais específicas, decisão da ANPD, consentimento específico). Ainda não há decisão de adequação da ANPD para os EUA até a presente data. |

### Bases legais para o tratamento — Art. 7º

A finalidade "segurança da informação e detecção de incidentes" costuma se apoiar nas bases do **Art. 7º, IX** (legítimo interesse) ou **Art. 7º, II** (cumprimento de obrigação legal/regulatória — p.ex., setores regulados pelo BACEN ou CVM).

| Cenário | Avaliação |
|---|---|
| Ollama local (CRISP) | ✅ Legítimo interesse defensável. O teste de proporcionalidade é favorável: tratamento limitado ao perímetro, finalidade clara, sem compartilhamento com terceiros. |
| OpenAI / Anthropic API | ⚠️ Legítimo interesse fica mais difícil de sustentar. O teste de proporcionalidade precisa endereçar por que o compartilhamento com processador externo é necessário, e a expectativa razoável do titular de que seus dados não sairiam da organização. |

### Direitos dos titulares — Art. 18

| Direito | Ollama local (CRISP) | IA em nuvem |
|---|---|---|
| Acesso aos dados (inciso II) | ✅ Possível: dados estão em Postgres local, consultáveis | ⚠️ Depende do processador externo |
| Eliminação (inciso VI) | ✅ Possível: `DELETE` na base local | ⚠️ Depende de contrato e processos do processador |
| Portabilidade (inciso V) | ✅ Trivial | ⚠️ Pode envolver retenção em logs do processador |
| Informação sobre uso compartilhado (inciso VII) | ✅ Sem compartilhamento | ⚠️ Compartilhamento existente, requer transparência ativa |

## 3. Quadro comparativo executivo

| Critério LGPD | CRISP (IA local) | SOC com IA em nuvem |
|---|---|---|
| Minimização (Art. 6º, III) | ✅ | ⚠️ |
| Sem transferência internacional (Art. 33) | ✅ | ❌ exige base do Art. 33 |
| Legítimo interesse defensável (Art. 7º, IX) | ✅ | ⚠️ teste mais difícil |
| Controlador detém os dados (Art. 5º, VI) | ✅ | ⚠️ processador externo envolvido |
| Atende direitos do titular (Art. 18) | ✅ | ⚠️ depende de terceiro |
| RIPD simplificado | ✅ Escopo pequeno | ❌ Escopo amplo, multi-jurisdicional |
| Notificação à ANPD em incidente (Art. 48) | ✅ Sob controle do controlador | ⚠️ Depende do processador para timing |

## 4. Cláusula técnica relevante

O CRISP, por arquitetura, garante que:

1. **Nenhum log de segurança sai do perímetro da empresa.** O Ollama roda em hardware on-premise; o tráfego entre Wazuh, Zeek, FortiGate e o modelo de IA permanece dentro da rede local.
2. **Não há dependência de provedor estrangeiro** para a funcionalidade core de análise. Em caso de bloqueio regulatório, sanção comercial ou indisponibilidade do provedor, a operação não é interrompida.
3. **Dados pessoais tratados em alertas são retidos apenas pelo período definido pelo controlador**, conforme política interna, sem retenção paralela em sistemas externos.

## 5. Conclusão

A escolha por **IA local (Ollama + LLaMA 3.1)** no CRISP não é apenas uma decisão técnica de custo ou latência — é o que viabiliza o uso de IA generativa em um SOC brasileiro sem expandir significativamente a superfície de obrigações da LGPD. Para empresas dos setores **financeiro, saúde, jurídico e governo**, onde os dados em logs de segurança frequentemente incluem informações sensíveis (Art. 5º, II), essa arquitetura passa de "diferencial" para "pré-requisito".

---

*Referências: Lei nº 13.709/2018 (LGPD), Resolução CD/ANPD nº 4/2023 (sanções), Guia ANPD de Tratamento de Dados Pessoais para Pequenas Empresas (2022).*
