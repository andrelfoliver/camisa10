import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error('Uso: node src/scripts/identificador_node.js SUA_CHAVE_GEMINI');
  process.exit(1);
}

const dir = path.join(__dirname, '../../public/camisas');
const outPath = path.join(__dirname, '../data/shirt_mapping.json');

async function getAvailableModel() {
  console.log('Buscando modelo disponível para sua chave...');
  return new Promise((resolve, reject) => {
    https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) return reject(new Error(parsed.error.message));
          
          let chosenModel = '';
          const models = parsed.models || [];
          
          // Tenta achar qualquer modelo que suporte generateContent
          const validModels = models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
          
          const preferred = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro-vision', 'gemini-pro', 'gemini-1.0-pro-vision-latest'];
          
          for (const pref of preferred) {
             const found = validModels.find(m => m.name.endsWith(pref));
             if (found) { chosenModel = found.name.replace('models/', ''); break; }
          }
          
          if (!chosenModel && validModels.length > 0) {
             chosenModel = validModels[0].name.replace('models/', '');
          }
          
          if(chosenModel) resolve(chosenModel);
          else reject(new Error('Nenhum modelo do Gemini encontrado para esta chave.'));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function askGemini(model, b64) {
  const data = JSON.stringify({
    contents: [{
      parts: [
        { text: 'Determine a quais time pertence a camisa com a maior precisão possível. Responda APENAS E EXATAMENTE um JSON SEM CRASES MARDKOWN com as chaves minúsculas: "time" (exato), "liga" (exato como: Brasileirão, La Liga, Premier League, Seleções, Serie A, Internacional, etc), "temporada", "tipo".' },
        { inlineData: { mimeType: 'image/png', data: b64 } }
      ]
    }],
    generationConfig: { temperature: 0.1 }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(body));
        try {
          const parsed = JSON.parse(body);
          if (!parsed.candidates) return reject(new Error('Sem resposta: ' + body));
          const txt = parsed.candidates[0].content.parts[0].text;
          const clean = txt.replace(/```json|```/g, '').trim();
          resolve(JSON.parse(clean));
        } catch (e) {
          resolve({ time: 'ERRO_PARSE' });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const files = fs.readdirSync(dir).filter(f => f.startsWith('@carinhacriativo') && f.endsWith('.png'));
  console.log(`Encontradas ${files.length} imagens. Consultando o Google...`);
  
  if(!fs.existsSync(path.dirname(outPath))) fs.mkdirSync(path.dirname(outPath), {recursive: true});

  let results = {};
  if (fs.existsSync(outPath)) {
    results = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }

  let modelToUse = 'gemini-1.5-flash';
  
  try {
     modelToUse = await getAvailableModel();
     console.log(`✓ Modelo auto-selecionado pelo Google: ${modelToUse}`);
  } catch(e) {
     console.error('Falha ao checar modelos. A chave digitada é válida? Erro: ', e.message);
     process.exit(1);
  }
  
  let i = 0;
  for (const f of files) {
    if (results[f] && results[f].time && results[f].time !== 'ERRO_PARSE') continue; 
    i++;
    console.log(`[${i}/${files.length}] Escaneando ${f}...`);
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
    try {
      const res = await askGemini(modelToUse, b64);
      results[f] = res;
      console.log(` ✅ ${res.time} (${res.tipo} - ${res.liga})`);
      
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
      
      await sleep(4000); 
    } catch(err) {
      console.error(` ❌ Erro: ${err.message.slice(0,100)}`);
      await sleep(6000);
    }
  }
  console.log('\n\nFinalizado com Sucesso!! Os resultados estão em "src/data/shirt_mapping.json".');
}

run();
