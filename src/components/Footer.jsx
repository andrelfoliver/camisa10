import React from 'react';

const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '4rem', paddingBottom: '2rem', marginTop: '4rem', background: '#050507' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            <img src="/favicon.png" alt="Camisa10" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span><span style={{ color: '#fff' }}>Camisa</span><span style={{ color: 'var(--accent-color)' }}>10</span></span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            A sua conexão com o futebol, onde quer que você esteja. Especialistas em camisas de futebol para brasileiros no Canadá.
          </p>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Links Rápidos</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/" style={{ color: 'var(--text-muted)', transition: '0.2s' }}>Catálogo</a></li>
            <li><a href="/#faq" style={{ color: 'var(--text-muted)', transition: '0.2s' }}>Como Comprar</a></li>
            <li><a href="/#about" style={{ color: 'var(--text-muted)', transition: '0.2s' }}>Sobre Nós</a></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Pagamento</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 600, color: '#FFB81C' }}>Interac</span> <span style={{ fontWeight: 400, color: 'var(--text-main)' }}>e-Transfer</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            Aceitamos transferências Interac simples, rápidas e seguras.
          </p>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; {new Date().getFullYear()} Camisa10. Todos os direitos reservados.
        <div style={{ marginTop: '0.5rem', opacity: 0.5, fontSize: '0.7rem' }}>Desenvolvido por BIVisualizer</div>
      </div>
    </footer>
  );
};

export default Footer;
