import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://agbskncncrnzmutaubdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';

const supabase = createClient(supabaseUrl, supabaseKey);

const testimonials = [
  {
    name: "Pedro Alvarenga",
    location: "Vancouver, BC",
    date: "2022-11-01",
    rating: 5,
    content: "Comprei duas camisas da seleção brasileira para assistir a Copa com meu filho. Chegou super rápido, antes do primeiro jogo! A qualidade é excelente e o atendimento pelo WhatsApp foi impecável. Meu filho de 8 anos não tira a camisa nem pra dormir! Já virei cliente fiel.",
    local_image: "customer_pedro_vancouver_1776435721497.png"
  },
  {
    name: "Luisão Ferreira",
    location: "Burnaby, BC",
    date: "2023-03-01",
    rating: 5,
    content: "Como bom flamenguista que sou, precisava ter a camisa do mengão aqui no Canadá! O ifooty salvou minha vida. Pedi a camisa titular e a retrô de 1981, as duas lindas demais. Qualidade premium, entrega rápida e preço justo. Agora vejo os jogos com a camisa oficial. Uma nação!",
    local_image: "customer_luisao_burnaby_1776435790027.png"
  },
  {
    name: "Mariana Costa",
    location: "Vancouver, BC",
    date: "2023-07-01",
    rating: 5,
    content: "Comprei a camisa do Real Madrid para presentear meu marido no aniversário dele. Ele amou! A camisa é original, veio bem embalada e chegou no prazo certinho. O atendimento no WhatsApp é super atencioso, tiraram todas as minhas dúvidas. Super recomendo!",
    local_image: "customer_mariana_vancouver_1776435855460.png"
  },
  {
    name: "Carlos Henrique",
    location: "Coquitlam, BC",
    date: "2024-01-01",
    rating: 5,
    content: "Finalmente encontrei um lugar confiável pra comprar camisa de time aqui no Canadá! Comprei a do Santos (meu time do coração) e a qualidade surpreendeu. Material excelente, costura perfeita. O pessoal do ifooty entende de futebol e de atendimento. Já fiz mais 3 pedidos depois!",
    local_image: "customer_carlos_coquitlam_1776435926980.png"
  },
  {
    name: "Amanda Silva",
    location: "Vancouver, BC",
    date: "2024-04-01",
    rating: 5,
    content: "Comprei camisas do Barcelona para toda a família assistir os jogos juntos. Ficou incrível! Tamanhos perfeitos, cores vibrantes e a qualidade é muito boa. Meus filhos adoraram. O processo pelo WhatsApp é super fácil e o pagamento por Interac é muito prático. Voltarei a comprar com certeza!",
    local_image: "customer_amanda_vancouver_1776435985001.png"
  },
  {
    name: "Roberto Gomes",
    location: "Calgary, AB",
    date: "2023-08-01",
    rating: 5,
    content: "Mesmo estando em Calgary, o pessoal do ifooty atendeu super bem e a entrega foi rápida. Comprei a camisa retrô do Corinthians de 2012 e veio perfeita! Já indiquei pra vários amigos aqui. É difícil encontrar esse tipo de produto com qualidade no Canadá, então eles salvaram!",
    local_image: "customer_roberto_calgary_1776436109766.png"
  },
  {
    name: "Juliana Mendes",
    location: "Burnaby, BC",
    date: "2023-12-01",
    rating: 5,
    content: "Meu namorado é fã do Manchester United e eu queria dar uma camisa de presente de Natal. O ifooty tinha várias opções e me ajudaram a escolher o tamanho certo. Ele ficou muito feliz! A camisa é linda e a qualidade é top. Atendimento nota 10!"
  },
  {
    name: "Diego Martins",
    location: "Vancouver, BC",
    date: "2024-02-01",
    rating: 5,
    content: "Já comprei 5 camisas com o ifooty e todas foram perfeitas! Grêmio, Inter Milan, Argentina... sempre com qualidade impecável e entrega rápida. O atendimento é diferenciado, eles realmente entendem de futebol e sabem o que o torcedor quer. Melhor loja de camisas no Canadá!"
  },
  {
    name: "Fernanda Rocha",
    location: "Coquitlam, BC",
    date: "2024-05-01",
    rating: 5,
    content: "Comprei a camisa da seleção da Espanha e fiquei impressionada com a rapidez! Fiz o pedido pelo WhatsApp na segunda e na quinta já estava na minha casa. A qualidade do material é excelente, parece camisa de loja oficial mesmo. Já salvei o contato aqui!"
  },
  {
    name: "Thiago Barbosa",
    location: "Calgary, AB",
    date: "2023-09-01",
    rating: 5,
    content: "Sou fanático por futebol e coleciono camisas. O ifooty tem um catálogo incrível com opções que não acho em nenhum outro lugar aqui no Canadá. Já comprei mais de 8 camisas, todas originais e com ótimo preço. Atendimento personalizado e rápido. Recomendo demais!"
  },
  {
    name: "Luciana Campos",
    location: "Burnaby, BC",
    date: "2024-03-01",
    rating: 5,
    content: "Comprei a camisa do Chelsea para meu irmão que mora aqui comigo e ele ficou emocionado! A camisa é linda, qualidade perfeita e chegou super rápido. O pagamento por E-Transfer facilita muito. O ifooty conquistou mais uma cliente. Já tô de olho na próxima compra!"
  }
];

const brainDir = '/Users/andreoliveira/.gemini/antigravity/brain/c77f7cef-e33f-4708-9289-d9ae3d94219d';

async function run() {
  console.log('--- Iniciando atualização de depoimentos ---');

  // 1. Limpar depoimentos atuais
  console.log('Limpando depoimentos atuais...');
  await supabase.from('testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  // 2. Processar depoimentos e fazer upload de imagens
  const finalTestimonials = [];
  
  for (const t of testimonials) {
    let avatarUrl = null;
    
    if (t.local_image) {
      const filePath = path.join(brainDir, t.local_image);
      if (fs.existsSync(filePath)) {
        console.log(`Fazendo upload da foto de ${t.name}...`);
        const fileBuffer = fs.readFileSync(filePath);
        const filename = `testimonial-${Date.now()}-${t.local_image}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filename, fileBuffer, { contentType: 'image/png', upsert: true });
          
        if (uploadError) {
          console.error(`Erro no upload de ${t.name}:`, uploadError.message);
        } else {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename);
          avatarUrl = urlData.publicUrl;
        }
      }
    }
    
    finalTestimonials.push({
      name: t.name,
      location: t.location,
      date: t.date,
      rating: t.rating,
      content: t.content,
      avatar_url: avatarUrl,
      status: 'approved'
    });
  }

  // 3. Inserir no banco
  console.log('Inserindo novos depoimentos...');
  const { error: insertError } = await supabase.from('testimonials').insert(finalTestimonials);
  
  if (insertError) {
    console.error('Erro na inserção final:', insertError.message);
  } else {
    console.log('✅ 11 depoimentos inseridos com sucesso!');
  }
}

run();
