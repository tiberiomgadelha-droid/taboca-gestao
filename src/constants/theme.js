export const C = {
  primary: '#7B3A10', primaryHover: '#5C2A0A', primaryLight: '#A0522D',
  amber: '#D4884A', cream: '#FFF8F0', bg: '#FAF7F4', card: '#FFFFFF',
  border: '#EAE0D5', borderLight: '#F0E8DE',
  navy: '#1E2A4A', navyMid: '#374260', navyLight: '#6B7280',
  green: '#059669', greenLight: '#D1FAE5',
  red: '#DC2626', redLight: '#FEE2E2',
  yellow: '#D97706', yellowLight: '#FEF3C7',
  blue: '#2563EB', blueLight: '#DBEAFE',
  purple: '#7C3AED', purpleLight: '#EDE9FE',
};

export const s = {
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 },
  cardSm: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 },
  btn: { background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  btnSm: { background: C.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 },
  btnOutline: { background: 'transparent', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  input: { border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  label: { fontSize: 11, fontWeight: 700, color: C.navyLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 14 },
};
