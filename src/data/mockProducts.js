import { brasil2025Products } from "./brasil2025";

// Mock products to simulate a real e-commerce with categories and leagues
export const mockEcommerceProducts = [
  ...brasil2025Products.map(p => ({
    ...p,
    league: 'Seleções',
    team: 'Brasil',
    version: p.name.includes('Jogador') ? 'Jogador' : 'Torcedor'
  })),
  {
    id: 'flamengo_home_24',
    name: 'Flamengo Titular 24/25 (Torcedor)',
    category: 'Clubes Brasileiros',
    league: 'Brasileirão',
    team: 'Flamengo',
    version: 'Torcedor',
    price: 44.90,
    image: 'https://imagedelivery.net/qEsqz0-NqQZ-DmlU-d0-Vw/0fa0bb51-bc95-442a-a9e9-f30a218f2f00/public',
    gallery: ['https://imagedelivery.net/qEsqz0-NqQZ-DmlU-d0-Vw/0fa0bb51-bc95-442a-a9e9-f30a218f2f00/public']
  },
  {
    id: 'real_madrid_home_24',
    name: 'Real Madrid Titular 24/25 (Jogador)',
    category: 'Clubes Europeus',
    league: 'La Liga',
    team: 'Real Madrid',
    version: 'Jogador',
    price: 69.90,
    image: 'https://imagedelivery.net/qEsqz0-NqQZ-DmlU-d0-Vw/28cc3993-41bb-45ca-9a3b-285d39234100/public',
    gallery: ['https://imagedelivery.net/qEsqz0-NqQZ-DmlU-d0-Vw/28cc3993-41bb-45ca-9a3b-285d39234100/public']
  },
  {
    id: 'arsenal_home_24',
    name: 'Arsenal Titular 24/25 (Torcedor)',
    category: 'Clubes Europeus',
    league: 'Premier League',
    team: 'Arsenal',
    version: 'Torcedor',
    price: 44.90,
    image: 'https://imagedelivery.net/qEsqz0-NqQZ-DmlU-d0-Vw/2cb8e8c8-bfae-4a65-1d67-4fd68acc0300/public',
    gallery: ['https://imagedelivery.net/qEsqz0-NqQZ-DmlU-d0-Vw/2cb8e8c8-bfae-4a65-1d67-4fd68acc0300/public']
  }
];

export const getAllProducts = (supabaseData = []) => {
  return supabaseData;
};

export const getCategories = () => {
  return ['Seleções', 'Brasileirão', 'Internacionais', 'Lançamentos', 'Retrô'];
};

export const getLeagues = () => {
  return ['Brasileirão', 'Premier League', 'La Liga', 'Serie A', 'Ligue 1', 'Bundesliga'];
}
