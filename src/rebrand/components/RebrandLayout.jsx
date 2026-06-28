import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import RebrandCartSidebar from './RebrandCartSidebar';
import AiChatbot from '../../components/AiChatbot';
import ExitIntentPopup from '../../components/ExitIntentPopup';
import SalesPopup from '../../components/SalesPopup';
import '../styles/rebrand.css'; // Importa estilos específicos do Rebranding

const RebrandLayout = () => {
  return (
    <div className="rebrand-scope global-wrapper" style={{ background: 'var(--rebrand-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Exclusiva Rebrand */}
      <Navbar />
      
      {/* Carrinho Lateral Rebrand - tema light estilo Fanatics */}
      <RebrandCartSidebar />

      {/* Conteúdo da Rota Rebrand */}
      <main style={{ flex: 1, position: 'relative' }}>
        <Outlet />
      </main>

      {/* Footer Exclusivo Rebrand */}
      <Footer />

      {/* Widgets Rebrand */}
      <AiChatbot />
      <ExitIntentPopup />
      <SalesPopup />
    </div>
  );
};

export default RebrandLayout;
