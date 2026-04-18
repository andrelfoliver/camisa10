#!/bin/bash

# Configurações do Supabase
if [ -f ".env" ]; then
  source .env
  SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
  SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
else
  echo "Erro: Arquivo .env não encontrado."
  exit 1
fi

DB_URL="${SUPABASE_URL}/rest/v1/teams"

# Função para atualizar banco com caminho local
sync_local() {
  local team_name=$2
  local filename=$(basename "$1")
  local local_path="/escudos/${filename}"
  
  echo "Sincronizando: $team_name -> ${local_path}"
  
  curl -X PATCH "${DB_URL}?name=eq.$(python3 -c "import urllib.parse; print(urllib.parse.quote('$team_name'))")" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"logo\": \"${local_path}\"}" \
    -s -o /dev/null
}

echo "--- Sincronizando Banco de Dados com Ativos Locais ---"
# Brasileirão
sync_local "athletico-paranaense.png" "Athletico-PR"
sync_local "atletico-go.png" "Atlético-GO"
sync_local "atletico-mineiro.png" "Atlético-MG"
sync_local "bahia.png" "Bahia"
sync_local "botafogo.png" "Botafogo"
sync_local "corinthians.png" "Corinthians"
sync_local "coritiba.png" "Coritiba"
sync_local "criciuma.png" "Criciúma"
sync_local "cruzeiro.png" "Cruzeiro"
sync_local "cuiaba.png" "Cuiabá"
sync_local "flamengo.png" "Flamengo"
sync_local "fluminense.png" "Fluminense"
sync_local "fortaleza.png" "Fortaleza"
sync_local "gremio.png" "Grêmio"
sync_local "internacional.png" "Internacional"
sync_local "juventude.png" "Juventude"
sync_local "mirassol-sp.png" "Mirassol"
sync_local "palmeiras.png" "Palmeiras"
sync_local "red-bull-bragantino.png" "Bragantino"
sync_local "sao-paulo.png" "São Paulo"
sync_local "vasco-da-gama.png" "Vasco da Gama"
sync_local "vitoria.png" "Vitória"
sync_local "santos.png" "Santos"

# Internacionais
sync_local "al-nassr.png" "Al-Nassr"
sync_local "al-hilal.png" "Al-Hilal"
sync_local "real-madrid.png" "Real Madrid"
sync_local "barcelona.png" "Barcelona"
sync_local "inter-miami.png" "Inter Miami"
sync_local "manchester-city.png" "Manchester City"
sync_local "manchester-united.png" "Manchester United"
sync_local "arsenal.png" "Arsenal"
sync_local "liverpool.png" "Liverpool"
sync_local "psg.png" "PSG"
sync_local "psg.png" "Paris Saint-Germain"
sync_local "ac-milan.png" "AC Milan"
sync_local "inter-milao.png" "Inter de Milão"
sync_local "juventude.png" "Juventus"
sync_local "borussia-dortmund.png" "Borussia Dortmund"
sync_local "boca-juniors.png" "Boca Juniors"
sync_local "river-plate.png" "River Plate"

# Seleções
sync_local "alemanha.png" "Alemanha"
sync_local "argentina.png" "Argentina"
sync_local "brasil.png" "Brasil"
sync_local "portugal.png" "Portugal"
sync_local "franca.png" "França"
sync_local "espanha.png" "Espanha"
sync_local "inglaterra.png" "Inglaterra"
sync_local "italia.png" "Itália"
sync_local "uruguai.png" "Uruguai"

echo "ESTABILIZAÇÃO CONCLUÍDA!"
