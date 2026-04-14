import React from 'react';

const TeamsBar = ({ onSelectTeam }) => {
  const teams = [
    { name: 'Flamengo', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_brazilian_multi-sport_club_logo.svg' },
    { name: 'Palmeiras', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg' },
    { name: 'Corinthians', logo: 'https://upload.wikimedia.org/wikipedia/pt/1/10/Corinthians_simbolo.png' },
    { name: 'São Paulo', logo: 'https://upload.wikimedia.org/wikipedia/pt/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png' },
    { name: 'Santos', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg' },
    { name: 'Grêmio', logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/d/d3/Gremio-logo.png/1200px-Gremio-logo.png' },
    { name: 'Internacional', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg' },
    { name: 'Cruzeiro', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Cruzeiro_Esporte_Clube_logo.svg' },
    { name: 'Vasco', logo: 'https://upload.wikimedia.org/wikipedia/pt/e/e9/Vasco_da_Gama.png' },
    { name: 'Atlético MG', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_logo.svg' },
    { name: 'Botafogo', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Botafogo_de_Futebol_e_Regatas_logo.svg' },
    { name: 'Fluminense', logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a2/Fluminense_FC_logo.png' },
    { name: 'Bahia', logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/8/84/Esporte_Clube_Bahia_logo.svg/1200px-Esporte_Clube_Bahia_logo.svg.png' },
  ];

  const fullTrack = [...teams, ...teams];

  return (
    <div style={{ 
      width: '100%', 
      background: 'rgba(0,0,0,0.3)', 
      padding: '2rem 0', 
      borderBottom: '1px solid var(--border-color)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .teams-track {
            display: flex;
            width: max-content;
            animation: marquee 40s linear infinite;
          }
          .teams-track:hover {
            animation-play-state: paused;
          }
          .team-item {
            width: 80px;
            height: 80px;
            margin: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            padding: 12px;
            transition: all 0.3s ease;
            filter: grayscale(0.2) brightness(0.9);
            cursor: pointer;
          }
          .team-item:hover {
            filter: grayscale(0) brightness(1.2);
            border-color: var(--accent-color);
            transform: scale(1.1);
            background: rgba(219, 254, 135, 0.05);
            box-shadow: 0 0 20px rgba(219, 254, 135, 0.15);
          }
          .team-logo {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        `}
      </style>
      
      <div className="teams-track">
        {fullTrack.map((team, index) => (
          <div 
            key={index} 
            className="team-item" 
            title={team.name}
            onClick={() => onSelectTeam && onSelectTeam(team.name)}
          >
            <img src={team.logo} alt={team.name} className="team-logo" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsBar;
