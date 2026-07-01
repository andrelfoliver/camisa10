export const formatProductName = (name) => {
  if (!name) return '';
  
  // Dictionary for translating and standardizing Portuguese terms/names into English
  const translations = {
    // Version / Style terms
    'jogador': 'Player',
    'torcedor': 'Fan',
    'titular': 'Home',
    'reserva': 'Away',
    'infantil': 'Kids',
    'feminino': 'Women',
    'masculino': 'Men',
    'retrô': 'Retro',
    'retro': 'Retro',
    
    // Countries and Teams
    'brasil': 'Brazil',
    'noruega': 'Norway',
    'alemanha': 'Germany',
    'frança': 'France',
    'franca': 'France',
    'espanha': 'Spain',
    'itália': 'Italy',
    'italia': 'Italy',
    'inglaterra': 'England',
    'japão': 'Japan',
    'japao': 'Japan',
    'bélgica': 'Belgium',
    'belgica': 'Belgium',
    'suécia': 'Sweden',
    'suecia': 'Sweden',
    'suíça': 'Switzerland',
    'suica': 'Switzerland',
    'holanda': 'Netherlands',
    'marrocos': 'Morocco',
    'camarões': 'Cameroon',
    'camacoes': 'Cameroon',
    'coreia do sul': 'South Korea',
    'coreia': 'Korea',
    'dinamarca': 'Denmark',
    'uruguai': 'Uruguay',
    'méxico': 'Mexico',
    'mexico': 'Mexico',
    'estados unidos': 'United States',
    'croácia': 'Croatia',
    'croacia': 'Croatia',
    'colômbia': 'Colombia',
    'colombia': 'Colombia',
    'macedônia': 'Macedonia',
    'macedonia': 'Macedonia',
    'escócia': 'Scotland',
    'escocia': 'Scotland',
    'turquia': 'Turkey',
    'gales': 'Wales',
    'ucrânia': 'Ukraine',
    'ucrania': 'Ukraine',
    'áustria': 'Austria',
    'austria': 'Austria',
    'polônia': 'Poland',
    'polonia': 'Poland',
    'finlândia': 'Finland',
    'finlandia': 'Finland',
    'república tcheca': 'Czech Republic',
    'republica tcheca': 'Czech Republic',
    'rep. tcheca': 'Czech Republic',
    'gana': 'Ghana',
    'egito': 'Egypt',
    'nigéria': 'Nigeria',
    'nigeria': 'Nigeria',
    'argélia': 'Algeria',
    'argelia': 'Algeria',
    'tunísia': 'Tunisia',
    'tunisia': 'Tunisia',
    'arábia saudita': 'Saudi Arabia',
    'arabia saudita': 'Saudi Arabia',
    'irã': 'Iran',
    'ira': 'Iran',
    'catar': 'Qatar'
  };

  let formatted = name.toLowerCase();
  
  // Sort keys by descending length to prevent partial replacements first (e.g. "Coreia" before "Coreia do Sul")
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    // Match only whole words/phrases using boundary checks
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formatted = formatted.replace(regex, translations[key].toLowerCase());
  }

  const acronyms = ['NHL', 'NBA', 'NFL', 'MLB', 'MLS', 'CAD', 'US', 'UK', 'EU', 'VIP'];
  return formatted
    .split(' ')
    .map(word => {
      const upper = word.toUpperCase();
      if (acronyms.includes(upper)) return upper;
      
      const lookup = word.toLowerCase();
      const translationMatch = translations[lookup];
      if (translationMatch) return translationMatch;

      if (word.includes('-')) {
        return word
          .split('-')
          .map(w => {
            const transW = translations[w.toLowerCase()];
            if (transW) return transW;
            return w.charAt(0).toUpperCase() + w.slice(1);
          })
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const getProductRating = (id) => {
  if (!id) return 4.8;
  const idStr = String(id);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(Math.abs(hash)) * 10000;
  const rand = x - Math.floor(x);
  
  if (rand < 0.33) return 4.8;
  if (rand < 0.66) return 4.9;
  return 5.0;
};

export const getProductReviewsCount = (id) => {
  if (!id) return 32;
  const idStr = String(id);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.cos(Math.abs(hash)) * 10000;
  const rand = x - Math.floor(x);
  return Math.floor(rand * 50) + 12;
};


