import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  TrendingUp, DollarSign, Gift, Calendar, Award, Globe, Rocket, Terminal, CheckCircle2, 
  AlertCircle, MessageSquare, BarChart3, Shield, ChevronRight, Mail, X
} from 'lucide-react';

const AffiliateProgram = () => {
  const [waNumber, setWaNumber] = useState('');

  useEffect(() => {
    async function loadConfig() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'whatsapp_number').single();
      if (data && data.value) setWaNumber(data.value);
    }
    loadConfig();
    window.scrollTo(0, 0);
  }, []);

  const waLink = `https://wa.me/${waNumber.replace(/\D/g, '')}?text=Olá!%20Li%20o%20guia%20completo%20e%20tenho%20interesse%20em%20me%20tornar%20um%20embaixador%20da%20iFooty.%20Podemos%20conversar?`;

  const Section = ({ icon: Icon, title, children, id }) => (
    <section id={id} style={{ marginBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(204, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
          <Icon size={22} />
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{title}</h2>
      </div>
      {children}
    </section>
  );

  return (
    <div style={{ background: '#050507', color: 'var(--text-main)', minHeight: '100vh', paddingTop: '6rem' }}>
      {/* HERO SECTION */}
      <div style={{ 
        padding: '4rem 1rem 6rem', textAlign: 'center', position: 'relative',
        background: 'radial-gradient(circle at 10% 20%, rgba(204, 255, 0, 0.05) 0%, transparent 40%)'
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.2rem', background: 'rgba(204, 255, 0, 0.1)', borderRadius: '100px', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
            <Award size={16} /> PROGRAMA DE EMBAIXADORES 2026/2027
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            VISTA AS CORES DO TIME E <span style={{ color: 'var(--accent-color)' }}>LUCRE COM A PAIXÃO</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
            Ganhe comissões agressivas promovendo camisas de futebol premium para a maior comunidade brasileira no Canadá. Seja o rosto da iFooty na sua cidade.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            <a href={waLink} className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              QUERO ME INSCREVER <ChevronRight size={20} />
            </a>
            <button onClick={() => document.getElementById('comissoes').scrollIntoView({ behavior: 'smooth' })} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
              VER PLANO DE GANHOS
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1000px', display: 'grid', gridTemplateColumns: '1fr', gap: '4rem', paddingBottom: '8rem' }}>
        
        {/* VISÃO GERAL */}
        <Section icon={Terminal} title="Visão Geral do Programa" id="geral">
          <div className="glass-panel" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modelo</div>
              <div style={{ fontWeight: 700, color: '#fff' }}>Comissão por venda + Bônus</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking (Cookie)</div>
              <div style={{ fontWeight: 700, color: '#fff' }}>30 Dias de validade</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pagamento</div>
              <div style={{ fontWeight: 700, color: '#fff' }}>Todo dia 05 (Mensal)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mínimo Saque</div>
              <div style={{ fontWeight: 700, color: '#fff' }}>CA$ 50</div>
            </div>
          </div>
        </Section>

        {/* ESTRUTURA DE COMISSÕES */}
        <Section icon={DollarSign} title="Tabela de Comissões Progressivas" id="comissoes">
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Quanto mais você divulga, maior é a sua fatia. Seus ganhos acompanham seu nível de influência.</p>
          <div className="table-responsive" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={{ padding: '1.5rem' }}>Nível</th>
                  <th style={{ padding: '1.5rem' }}>Vendas/Mês</th>
                  <th style={{ padding: '1.5rem' }}>Comissão</th>
                  <th style={{ padding: '1.5rem' }}>Exemplo Ganho*</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700 }}>🥉 Bronze</td>
                  <td style={{ padding: '1.5rem' }}>1 - 10</td>
                  <td style={{ padding: '1.5rem', color: 'var(--accent-color)', fontWeight: 800 }}>10%</td>
                  <td style={{ padding: '1.5rem' }}>CA$ 80 - 800</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700 }}>🥈 Prata</td>
                  <td style={{ padding: '1.5rem' }}>11 - 25</td>
                  <td style={{ padding: '1.5rem', color: 'var(--accent-color)', fontWeight: 800 }}>12%</td>
                  <td style={{ padding: '1.5rem' }}>CA$ 1.056 - 2.400</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1.5rem', fontWeight: 700 }}>🥇 Ouro</td>
                  <td style={{ padding: '1.5rem' }}>26 - 50</td>
                  <td style={{ padding: '1.5rem', color: 'var(--accent-color)', fontWeight: 800 }}>15%</td>
                  <td style={{ padding: '1.5rem' }}>CA$ 3.120 - 6.000</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.5rem', fontWeight: 700 }}>💎 Diamante</td>
                  <td style={{ padding: '1.5rem' }}>51+</td>
                  <td style={{ padding: '1.5rem', color: 'var(--accent-color)', fontWeight: 800 }}>20%</td>
                  <td style={{ padding: '1.5rem' }}>CA$ 8.160+</td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              *Cálculo baseado em um ticket médio de CA$ 80 por pedido.
            </div>
          </div>
        </Section>

        {/* BÔNUS E INCENTIVOS */}
        <Section icon={Gift} title="Bônus e Incentivos" id="bonus">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Meta Mensal */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <TrendingUp size={20} color="var(--accent-color)" />
                <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>Bônus Mensal (Vendas)</h4>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CA$ 2.000 em vendas</span> <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>+CA$ 100</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CA$ 4.000 em vendas</span> <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>+CA$ 250</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CA$ 6.000 em vendas</span> <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>+CA$ 500</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CA$ 10.000 em vendas</span> <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>+CA$ 1.000</span>
                </li>
              </ul>
            </div>

            {/* Outros Incentivos */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <Award size={20} color="var(--accent-color)" />
                <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>Incentivos Progressivos</h4>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primeira venda</span> <span style={{ fontWeight: 700 }}>+CA$ 25</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>5 Primeiras vendas</span> <span style={{ fontWeight: 700 }}>+CA$ 50 total</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>10 Primeiras vendas</span> <span style={{ fontWeight: 700 }}>+CA$ 100 total</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cada novo cliente</span> <span style={{ fontWeight: 700 }}>+CA$ 5 fixo</span>
                </li>
              </ul>
            </div>

            {/* Sazonais */}
            <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <Calendar size={20} color="var(--accent-color)" />
                <h4 style={{ color: '#fff', fontSize: '1.1rem' }}>Bônus Sazonais (Turbo)</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Copa do Mundo</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.2rem' }}>+10%</span> <span style={{ fontSize: '0.7rem' }}>nas camisas de seleção</span>
                </div>
                <div style={{ padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Black Friday / Cyber</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.2rem' }}>+5%</span> <span style={{ fontSize: '0.7rem' }}>em todo o catálogo</span>
                </div>
                <div style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Brasileirão (Início)</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.2rem' }}>+5%</span> <span style={{ fontSize: '0.7rem' }}>nos clubes BR</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* RASTREAMENTO */}
        <Section icon={Rocket} title="Rastreamento e Cookies" id="rastreamento">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={18} color="var(--accent-color)" /> Cookie de 30 Dias</h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Se o cliente clicar no seu link e comprar qualquer coisa nos próximos 30 dias, a comissão é sua. Valorizamos o "Último Clique" para garantir sua recompensa.</p>
            </div>
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} color="var(--accent-color)" /> Links Dinâmicos</h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Você pode criar links para o catálogo geral ou para categorias específicas (ex: Flamengo ou Brasil).</p>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ifooty.ca/brasil?ref=você
              </div>
            </div>
          </div>
        </Section>

        {/* REGRAS */}
        <Section icon={Shield} title="Regras de Conduta (Compliance)" id="regras">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'rgba(74, 222, 128, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
              <h4 style={{ color: '#4ADE80', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle2 size={22} /> PODE Fazer</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                <li>✅ Unboxing e reviews em vídeo.</li>
                <li>✅ Posts orgânicos em Instagram/TikTok.</li>
                <li>✅ Divulgar em listas de e-mail próprias.</li>
                <li>✅ Anúncios pagos (com aprovação).</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(248, 113, 113, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(248, 113, 113, 0.1)' }}>
              <h4 style={{ color: '#F87171', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><AlertCircle size={22} /> É PROIBIDO</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                <li>❌ Spam em grupos ou fóruns.</li>
                <li>❌ Auto-referral (comprar no próprio link).</li>
                <li>❌ Fraude de cliques ou bots.</li>
                <li>❌ Anúncios usando "iFooty" sem autorização.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* CASE DE SUCESSO */}
        <Section icon={BarChart3} title="Casos Reais de Ganhos" id="casos">
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '1.2rem' }}>Bruno - Comunidade BR</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Foco no Instagram + WhatsApp</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.4rem' }}>CA$ 1.779,00</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mês de Copa do Mundo</div>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Nível Diamante (20%) com 67 vendas no mês. Foram CA$ 1.072 de comissão base + CA$ 500 de bônus meta + bônus sazonal Copa.</p>
          </div>
        </Section>

        {/* CTA FINAL */}
        <div style={{ padding: '5rem 2rem', background: 'var(--accent-color)', borderRadius: '32px', textAlign: 'center', color: '#000' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>PRONTO PARA SER UM EMBAIXADOR?</h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, maxWidth: '600px', margin: '0 auto 3rem', opacity: 0.8 }}>
            André analisa todas as inscrições pessoalmente em até 24h. O seu sucesso é o nosso sucesso.
          </p>
          <a 
            href={waLink} 
            className="btn-primary" 
            style={{ background: '#000', color: '#fff', padding: '1.2rem 3.5rem', fontSize: '1.2rem', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '1rem', borderRadius: '100px' }}
          >
            <MessageSquare size={22} /> INICIAR ENTREVISTA NO WHATSAPP
          </a>
          <div style={{ marginTop: '3rem', fontSize: '0.9rem', fontWeight: 700, opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> afiliados@ifooty.ca</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={16} /> iFooty.ca</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AffiliateProgram;
