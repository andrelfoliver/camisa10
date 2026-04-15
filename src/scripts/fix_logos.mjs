const url = 'https://agbskncncrnzmutaubdn.supabase.co/rest/v1/teams';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';

const logos = {
  "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  "Manchester United": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "Inter de Milão": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
  "AC Milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
  "Inter Miami": "https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg",
  "Real Madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "Barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "PSG": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "Juventus": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg",
  "Chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "Arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "Bayern de Munique": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "Borussia Dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "Boca Juniors": "https://upload.wikimedia.org/wikipedia/commons/2/28/Escudo_Boca.svg",
  "River Plate": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Logo_River_Plate.png",
  "Al-Nassr": "https://upload.wikimedia.org/wikipedia/en/2/2c/Al_Nassr_FC_Logo.svg"
};

async function fixLogos() {
  for (const [name, logoUrl] of Object.entries(logos)) {
    const query = `name=eq.${encodeURIComponent(name)}`;
    const headers = { 
      'apikey': key, 
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    
    try {
      console.log(`Updating ${name}...`);
      const res = await fetch(`${url}?${query}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ logo: logoUrl })
      });
      const data = await res.json();
      console.log(`Updated ${name}: Status ${res.status}, Rows Modified: ${data.length || 0}`);
    } catch (e) {
      console.error(`Failed ${name}: ${e.message}`);
    }
  }
}

fixLogos();
