import React from 'react';

const TeamsBar = ({ teams = [], onSelectTeam }) => {
  if (!teams || teams.length === 0) return null;

  // Garantimos que a track tenha itens suficientes para não quebrar a animação infinita
  // Se houver poucos times, duplicamos mais vezes para preencher a largura da tela
  const multiplier = teams.length < 5 ? 4 : 2;
  const fullTrack = Array(multiplier).fill(teams).flat();

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
            100% { transform: translateX(-${100 / multiplier}%); }
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
      
      <div className="teams-track" style={{ animationDuration: `${teams.length * 3}s` }}>
        {fullTrack.map((team, index) => (
          <div 
            key={`${team.name}-${index}`} 
            className="team-item" 
            title={team.name}
            onClick={() => onSelectTeam && onSelectTeam(team.name)}
          >
            <img src={team.logo} alt={team.name} className="team-logo" referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsBar;
