import React from 'react';

const TeamsBar = ({ teams = [], onSelectTeam }) => {
  if (!teams || teams.length === 0) return null;

  // Garantimos que a track tenha itens suficientes para não quebrar a animação infinita
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
            pointer-events: auto;
          }
          .teams-track:hover {
            animation-play-state: paused !important;
          }
          .team-item {
            width: 80px;
            height: 80px;
            margin: 0 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            padding: 4px;
            transition: all 0.3s ease;
            cursor: pointer;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
          }
          .team-item:hover {
            transform: scale(1.15);
            filter: drop-shadow(0 12px 25px var(--accent-glow));
          }
          .team-logo {
            width: 72px;
            height: 72px;
            object-fit: contain;
            display: block;
            filter: none;
          }
        `}
      </style>
      
      <div className="teams-track" style={{ animationDuration: `${teams.length * 1.5}s` }}>
        {fullTrack.map((team, index) => (
          <div 
            key={`${team.name}-${index}`} 
            className="team-item" 
            title={team.name}
            onClick={() => onSelectTeam && onSelectTeam(team.name)}
            style={{ display: 'flex' }}
          >
            <img 
              src={team.logo} 
              alt={team.name} 
              className="team-logo"
              onError={(e) => { 
                const container = e.target.closest('.team-item');
                if (container) container.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsBar;
