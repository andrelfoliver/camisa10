#!/bin/bash

# Configurações do Supabase (Carregadas do .env)
# Nota: Como este script roda no ambiente do usuário, assumimos que .env está na raiz.
if [ -f ".env" ]; then
  source .env
  # Se o source falhar em definir as variáveis (devido ao formato VITE_), definimos manualmente:
  SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
  SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
else
  echo "Erro: Arquivo .env não encontrado."
  exit 1
fi

BUCKET="product-images"
STORAGE_URL="${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/teams"
UPLOAD_URL="${SUPABASE_URL}/storage/v1/object/${BUCKET}/teams"
DB_URL="${SUPABASE_URL}/rest/v1/teams"

# Função para fazer upload e atualizar banco
upload_and_sync() {
  local filepath=$1
  local team_name=$2
  local filename=$(basename "$filepath")
  
  echo "Processando: $team_name ($filename)..."
  
  # 1. Upload para o Storage
  curl -X POST "${UPLOAD_URL}/${filename}" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: image/png" \
    --data-binary "@${filepath}" \
    -s -o /dev/null
    
  local public_url="${STORAGE_URL}/${filename}"
  
  # 2. Atualizar o Banco de Dados (PATCH)
  curl -X PATCH "${DB_URL}?name=eq.$(python3 -c "import urllib.parse; print(urllib.parse.quote('$team_name'))")" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"logo\": \"${public_url}\"}" \
    -s -o /dev/null
    
  echo "Concluído: $team_name -> ${public_url}"
}

echo "--- Iniciando Upload de Escudos Nacionais ---"
upload_and_sync "public/escudos/atletico-mineiro.png" "Atlético-MG"
upload_and_sync "public/escudos/athletico-paranaense.png" "Athletico-PR"
upload_and_sync "public/escudos/bahia.png" "Bahia"
upload_and_sync "public/escudos/botafogo.png" "Botafogo"
upload_and_sync "public/escudos/corinthians.png" "Corinthians"
upload_and_sync "public/escudos/cruzeiro.png" "Cruzeiro"
upload_and_sync "public/escudos/flamengo.png" "Flamengo"
upload_and_sync "public/escudos/fluminense.png" "Fluminense"
upload_and_sync "public/escudos/gremio.png" "Grêmio"
upload_and_sync "public/escudos/internacional.png" "Internacional"
upload_and_sync "public/escudos/palmeiras.png" "Palmeiras"
upload_and_sync "public/escudos/santos.png" "Santos"
upload_and_sync "public/escudos/sao-paulo.png" "São Paulo"
upload_and_sync "public/escudos/vasco-da-gama.png" "Vasco da Gama"
upload_and_sync "public/escudos/vitoria.png" "Vitória"
upload_and_sync "public/escudos/red-bull-bragantino.png" "Bragantino"

echo "--- Iniciando Upload de Escudos Internacionais ---"
upload_and_sync "public/escudos/temp/al-nassr.png" "Al-Nassr"
upload_and_sync "public/escudos/temp/al-hilal.png" "Al-Hilal"
upload_and_sync "public/escudos/temp/real-madrid.png" "Real Madrid"
upload_and_sync "public/escudos/temp/barcelona.png" "Barcelona"
upload_and_sync "public/escudos/temp/inter-miami.png" "Inter Miami"
upload_and_sync "public/escudos/temp/manchester-city.png" "Manchester City"
upload_and_sync "public/escudos/temp/manchester-united.png" "Manchester United"
upload_and_sync "public/escudos/temp/arsenal.png" "Arsenal"
upload_and_sync "public/escudos/temp/liverpool.png" "Liverpool"
upload_and_sync "public/escudos/temp/alemanha.png" "Alemanha"
upload_and_sync "public/escudos/temp/argentina.png" "Argentina"
upload_and_sync "public/escudos/temp/brasil.png" "Brasil"
upload_and_sync "public/escudos/temp/portugal.png" "Portugal"
upload_and_sync "public/escudos/temp/psg.png" "PSG"
upload_and_sync "public/escudos/temp/ac-milan.png" "AC Milan"
upload_and_sync "public/escudos/temp/inter-milao.png" "Inter de Milão"
upload_and_sync "public/escudos/temp/juventus.png" "Juventus"
upload_and_sync "public/escudos/temp/borussia-dortmund.png" "Borussia Dortmund"
upload_and_sync "public/escudos/temp/boca-juniors.png" "Boca Juniors"
upload_and_sync "public/escudos/temp/river-plate.png" "River Plate"
upload_and_sync "public/escudos/temp/espanha.png" "Espanha"
upload_and_sync "public/escudos/temp/inglaterra.png" "Inglaterra"
upload_and_sync "public/escudos/temp/italia.png" "Itália"
upload_and_sync "public/escudos/temp/uruguai.png" "Uruguai"
upload_and_sync "public/escudos/temp/franca.png" "França"

echo "SINCRONIZAÇÃO COMPLETA!"
