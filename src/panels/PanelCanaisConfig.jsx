import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";
import { supabase, supabaseUrl, sbInsert, sbUpdate, sbDelete, sbUpsertSettings } from "../utils/supabase.js";
import { fmtCurrency, fmtDate, fmtDateTime, daysUntil, isLowStock, isExpiringSoon, NOW } from "../utils/helpers.js";
import { sbFetchOlderMessages } from "../utils/dataLoader.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload, processarImagem, logActivity, useIsMobile } from "../components/ui.jsx";

const PanelCanaisConfig = ({data, setData}) => {
  const [waForm, setWaForm] = useState(data.whatsapp_config||{});
  const [igForm, setIgForm] = useState(data.instagram_config||{});
  const [saved, setSaved] = useState('');

  const saveWA = async () => {
    try {
      const { data: result } = await supabase.from('whatsapp_config').upsert({id:1,...waForm}).select().single();
      setData(prev=>({...prev, whatsapp_config: result||waForm}));
      setSaved('whatsapp'); setTimeout(()=>setSaved(''),2000);
    } catch(e) { console.error(e); }
  };

  const saveIG = async () => {
    try {
      const { data: result } = await supabase.from('instagram_config').upsert({id:1,...igForm}).select().single();
      setData(prev=>({...prev, instagram_config: result||igForm}));
      setSaved('instagram'); setTimeout(()=>setSaved(''),2000);
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{padding:20}}>
      <div style={s.sectionTitle}>Integração de Canais</div>

      {/* WhatsApp */}
      <div style={{...s.card, marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>💬</span>
          <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy}}>WhatsApp Business API</div><div style={{fontSize:11,color:C.navyLight}}>Configuração da API oficial Meta</div></div>
          {saved==='whatsapp'&&<Badge color='green'>Salvo!</Badge>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Phone Number ID"><Input value={waForm.phone_number_id||''} onChange={e=>setWaForm(f=>({...f,phone_number_id:e.target.value}))} placeholder="Ex: 123456789012345"/></FormField>
          <FormField label="Número de Telefone"><Input value={waForm.phone_number||''} onChange={e=>setWaForm(f=>({...f,phone_number:e.target.value}))} placeholder="5573999990000"/></FormField>
          <FormField label="Access Token"><Input value={waForm.api_token||''} onChange={e=>setWaForm(f=>({...f,api_token:e.target.value}))} placeholder="EAAx..."/></FormField>
          <FormField label="Webhook Verify Token"><Input value={waForm.webhook_secret||''} onChange={e=>setWaForm(f=>({...f,webhook_secret:e.target.value}))} placeholder="Token de verificação"/></FormField>
        </div>
        <div style={{marginTop:10,padding:'8px 12px',background:'#F9F6F4',borderRadius:8,fontSize:11,color:C.navyLight}}>
          <strong>URL do Webhook:</strong> {supabaseUrl}/functions/v1/whatsapp-webhook
        </div>
        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <input type="checkbox" checked={waForm.auto_reply||false} onChange={e=>setWaForm(f=>({...f,auto_reply:e.target.checked}))} style={{accentColor:C.green}}/>
            Atendimento automático ativo
          </label>
          <div style={{marginLeft:'auto'}}><Btn onClick={saveWA}><Check size={13}/>Salvar WhatsApp</Btn></div>
        </div>
      </div>

      {/* Instagram */}
      <div style={{...s.card}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>📷</span>
          <div style={{flex:1}}><div style={{fontWeight:700,color:C.navy}}>Instagram Graph API</div><div style={{fontSize:11,color:C.navyLight}}>Configuração de DMs do Instagram</div></div>
          {saved==='instagram'&&<Badge color='green'>Salvo!</Badge>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Page ID"><Input value={igForm.page_id||''} onChange={e=>setIgForm(f=>({...f,page_id:e.target.value}))} placeholder="ID da página Facebook"/></FormField>
          <FormField label="IG User ID"><Input value={igForm.ig_user_id||''} onChange={e=>setIgForm(f=>({...f,ig_user_id:e.target.value}))} placeholder="ID do usuário Instagram"/></FormField>
          <FormField label="Access Token"><Input value={igForm.access_token||''} onChange={e=>setIgForm(f=>({...f,access_token:e.target.value}))} placeholder="Token de acesso"/></FormField>
          <FormField label="Webhook Verify Token"><Input value={igForm.webhook_verify_token||''} onChange={e=>setIgForm(f=>({...f,webhook_verify_token:e.target.value}))} placeholder="Token de verificação"/></FormField>
        </div>
        <div style={{marginTop:10,padding:'8px 12px',background:'#F9F6F4',borderRadius:8,fontSize:11,color:C.navyLight}}>
          <strong>URL do Webhook:</strong> {supabaseUrl}/functions/v1/instagram-webhook
        </div>
        <div style={{display:'flex',gap:10,marginTop:12,alignItems:'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,cursor:'pointer'}}>
            <input type="checkbox" checked={igForm.auto_reply||false} onChange={e=>setIgForm(f=>({...f,auto_reply:e.target.checked}))} style={{accentColor:C.green}}/>
            Atendimento automático ativo
          </label>
          <div style={{marginLeft:'auto'}}><Btn onClick={saveIG}><Check size={13}/>Salvar Instagram</Btn></div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MODAL: DEFINIR META
// ═══════════════════════════════════════════════════


export default PanelCanaisConfig;
