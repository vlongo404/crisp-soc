# Carregar políticas essenciais
@load base/protocols/conn
@load base/protocols/dns
@load base/protocols/http
@load base/protocols/ssl
@load base/protocols/smb
@load base/protocols/ssh
@load policy/protocols/dns/detect-external-names
@load policy/misc/detect-traceroute

# Saída em JSON (obrigatório para integração com Wazuh/Filebeat)
@load policy/tuning/json-logs
redef LogAscii::use_json = T;

# Rotação de logs a cada hora
redef Log::default_rotation_interval = 1hr;

# Detectar scan de portas
@load misc/scan

# Detectar DNS com alta entropia (possível tunneling)
@load policy/protocols/dns/detect-external-names

# Threshold para alertas de DNS anômalos
redef DNS::max_pending_msgs = 500;
