import re

with open('src/rebrand/pages/RebrandAdmin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_tbody = """          <tbody>
            {currentItems.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #1A1D20', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                      {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{c.name || 'Sem nome'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{c.orders === 0 ? 'Sem pedidos' : `${c.orders} pedido${c.orders > 1 ? 's' : ''}`}</div>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{c.email || '—'}</td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{c.phone || '—'}</td>
                <td style={{ padding: '1rem' }}>
                  {c.orders > 0 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{c.orders}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: c.spent > 0 ? 700 : 400, color: c.spent > 0 ? '#10B981' : 'rgba(255,255,255,0.3)' }}>
                  ${c.spent.toFixed(2)}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                  {c.lastOrder ? new Intl.DateTimeFormat('pt-BR').format(new Date(c.lastOrder)) : '—'}
                </td>
              </tr>
            ))}
          </tbody>"""

new_tbody = """          <tbody>
            {currentItems.map((c, idx) => {
              const isExpanded = expandedClient === c.id;
              const hasCart = c.cart && c.cart.length > 0;
              const sentAt1 = sentRecoveryEmails[c.id];
              const sentAt2 = sentRecoveryEmails2[c.id];

              return (
                <React.Fragment key={c.id || idx}>
                  <tr 
                    onClick={() => setExpandedClient(isExpanded ? null : c.id)}
                    style={{ 
                      borderBottom: isExpanded ? 'none' : '1px solid #1A1D20', 
                      background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                      transition: 'background 0.2s', 
                      cursor: 'pointer' 
                    }}
                  >
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                          {c.name ? c.name.charAt(0).toUpperCase() : (c.email ? c.email.charAt(0).toUpperCase() : '?')}
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{c.name || 'Sem nome'}</span>
                          {hasCart && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: '#FF4D4D', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              Sacola Ativa ({c.cart.reduce((sum, item) => sum + (item.quantity || 1), 0)})
                            </span>
                          )}
                          {hasCart && sentAt2 && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              📧 2º Enviado
                            </span>
                          )}
                          {hasCart && sentAt1 && !sentAt2 && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              📧 1º Enviado
                            </span>
                          )}
                          {hasCart && !sentAt1 && !sentAt2 && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              ⏳ Não Enviado
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{c.orders === 0 ? 'Sem pedidos' : `${c.orders} pedido${c.orders > 1 ? 's' : ''}`}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{c.email || '—'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      {c.orders > 0 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{c.orders}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: c.spent > 0 ? 700 : 400, color: c.spent > 0 ? '#10B981' : 'rgba(255,255,255,0.3)' }}>
                      ${c.spent.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{c.lastOrder ? new Intl.DateTimeFormat('pt-BR').format(new Date(c.lastOrder)) : '—'}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid #1A1D20' }}>
                      <td colSpan="6" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                          
                          {/* Endereço Registrado */}
                          <div style={{ flex: '1', minWidth: '250px' }}>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Endereço Registrado</p>
                            {c.street ? (
                              <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.5' }}>
                                <div>{c.street}{c.apartment ? `, Apt ${c.apartment}` : ''}</div>
                                <div>{c.city}, {c.province} {c.postal_code}</div>
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Nenhum endereço cadastrado.</p>
                            )}
                          </div>

                          {/* Sacola / Carrinho Ativo */}
                          <div style={{ flex: '2', minWidth: '350px' }}>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Sacola / Carrinho Ativo</p>
                            {hasCart ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {c.cart.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                      <img src={item.image || '/camisas/placeholder.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = '/camisas/placeholder.png'; }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{item.name}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                        Tam: <span style={{ color: '#D6FF00', fontWeight: 700 }}>{item.size}</span> | Qtd: {item.quantity} | Preço: ${item.price?.toFixed(2)}
                                        {item.addedAt && ` | Add: ${formatCartItemDate(item.addedAt).split(' às ')[0]}`}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>Carrinho vazio.</p>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                          
                          {/* Ações de Email só mostram se tiver carrinho */}
                          {hasCart && (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem' }}>
                              
                              {/* 1º Email */}
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  onClick={() => toggleRecoveryEmailStatus(c, 1)}
                                  style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  {sentAt1 ? 'Desmarcar 1º' : 'Marcar 1º'}
                                </button>
                                <button
                                  onClick={() => handleSendAbandonedCartEmail(c, 1)}
                                  style={{ background: sentAt1 ? 'rgba(16, 185, 129, 0.1)' : '#D6FF00', color: sentAt1 ? '#10B981' : '#000', border: sentAt1 ? '1px solid rgba(16, 185, 129, 0.3)' : 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {sentAt1 ? `1º Enviado` : 'Enviar 1º E-mail'}
                                </button>
                              </div>

                              {/* 2º Email */}
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  onClick={() => toggleRecoveryEmailStatus(c, 2)}
                                  style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  {sentAt2 ? 'Desmarcar 2º' : 'Marcar 2º'}
                                </button>
                                <button
                                  onClick={() => handleSendAbandonedCartEmail(c, 2)}
                                  style={{ background: sentAt2 ? 'rgba(59, 130, 246, 0.1)' : '#3B82F6', color: sentAt2 ? '#3B82F6' : '#fff', border: sentAt2 ? '1px solid rgba(59, 130, 246, 0.3)' : 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {sentAt2 ? `2º Enviado` : 'Enviar 2º (5% OFF)'}
                                </button>
                              </div>
                            </div>
                          )}

                          {hasCart && (
                            <button
                              onClick={() => handlePrintCartInvoice(c)}
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              📄 Gerar Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>"""

content = content.replace(old_tbody, new_tbody)

with open('src/rebrand/pages/RebrandAdmin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched tbody!")
