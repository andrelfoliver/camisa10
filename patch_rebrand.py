import re

with open('src/rebrand/pages/RebrandAdmin.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update component signature
content = content.replace('const ClientesSection = () => {', 'const ClientesSection = ({ showToast }) => {')

# 2. Add state variables
state_vars = """  const [expandedClient, setExpandedClient] = useState(null);
  const [sentRecoveryEmails, setSentRecoveryEmails] = useState({});
  const [sentRecoveryEmails2, setSentRecoveryEmails2] = useState({});"""
content = content.replace('  const itemsPerPage = 10;', f'  const itemsPerPage = 10;\n{state_vars}')

# 3. Update Promise.all in load()
old_promise = """      const [{ data: profiles, error: pError }, { data: orders, error: oError }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, customer_email, customer_name, customer_phone, total_price, status, created_at'),
      ]);"""
new_promise = """      const [{ data: profiles, error: pError }, { data: orders, error: oError }, { data: settings }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, customer_email, customer_name, customer_phone, total_price, status, created_at'),
        supabase.from('store_settings').select('*').in('key', ['sent_recovery_emails', 'sent_recovery_emails_2'])
      ]);"""
content = content.replace(old_promise, new_promise)

# 4. Parse settings
old_diag = """      setDiagInfo({
        profiles: profiles?.length || 0,
        orders: orders?.length || 0,
        pError: pError?.message || null,
        oError: oError?.message || null
      });"""
new_diag = """      setDiagInfo({
        profiles: profiles?.length || 0,
        orders: orders?.length || 0,
        pError: pError?.message || null,
        oError: oError?.message || null
      });

      if (settings) {
        settings.forEach(s => {
          if (s.key === 'sent_recovery_emails') {
            try { setSentRecoveryEmails(JSON.parse(s.value)); } catch(e){}
          }
          if (s.key === 'sent_recovery_emails_2') {
            try { setSentRecoveryEmails2(JSON.parse(s.value)); } catch(e){}
          }
        });
      }"""
content = content.replace(old_diag, new_diag)

# 5. Update profile mapping
old_profile_map = """        return {
          name: p.full_name || p.name || '',
          email: p.email || '',
          phone: p.phone || stats.phone || '',
          avatar_url: p.avatar_url || '',
          orders: stats.count,
          spent: stats.spent,
          lastOrder: stats.lastOrder || p.created_at,
          registeredAt: p.created_at,
          source: 'profile',
        };"""
new_profile_map = """        return {
          id: p.id,
          name: p.full_name || p.name || '',
          email: p.email || '',
          phone: p.phone || stats.phone || '',
          avatar_url: p.avatar_url || '',
          orders: stats.count,
          spent: stats.spent,
          lastOrder: stats.lastOrder || p.created_at,
          registeredAt: p.created_at,
          source: 'profile',
          cart: p.cart || [],
          street: p.street || '',
          apartment: p.apartment || '',
          city: p.city || '',
          province: p.province || '',
          postal_code: p.postal_code || ''
        };"""
content = content.replace(old_profile_map, new_profile_map)

# 6. Update order map
old_order_map = """          profileList.push({
            name: o.customer_name || '',
            email: o.customer_email || '',
            phone: stats.phone || '',
            avatar_url: '',
            orders: stats.count,
            spent: stats.spent,
            lastOrder: stats.lastOrder,
            registeredAt: null,
            source: 'order',
          });"""
new_order_map = """          profileList.push({
            id: 'order-' + emailKey,
            name: o.customer_name || '',
            email: o.customer_email || '',
            phone: stats.phone || '',
            avatar_url: '',
            orders: stats.count,
            spent: stats.spent,
            lastOrder: stats.lastOrder,
            registeredAt: null,
            source: 'order',
            cart: [],
            street: '',
            apartment: '',
            city: '',
            province: '',
            postal_code: ''
          });"""
content = content.replace(old_order_map, new_order_map)

# 7. Update RebrandAdmin to pass showToast
content = content.replace('clientes:    <ClientesSection />', 'clientes:    <ClientesSection showToast={showToast} />')

with open('src/rebrand/pages/RebrandAdmin.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched basic structure!")
