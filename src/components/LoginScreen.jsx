import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, BookOpen, Package, ChefHat, Users, MessageSquare, Truck, Bot, Plus, Bell, Search, TrendingUp, TrendingDown, AlertTriangle, ShoppingCart, DollarSign, UserPlus, Activity, ChevronRight, ChevronDown, ChevronUp, X, Check, Edit, Trash2, Eye, EyeOff, MapPin, Phone, Calendar, Clock, ArrowUpRight, ArrowDownRight, FileText, CreditCard, Wallet, Send, RefreshCw, Flame, Package2, Target, MessageCircle, CheckCircle, XCircle, Circle, Settings, Layers, AlertCircle, Filter, Star, Archive, Loader, Home, Instagram, Route, Navigation, Wheat, Coffee, Pizza, ChevronLeft, Info, BarChart2, Building, PieChart as PieIcon, Menu, Receipt, ArrowLeft, Map, GripVertical, LogOut } from "lucide-react";
import { supabase, sbInsert, sbUpdate, sbDelete, sbUpsertSettings } from "../utils/supabase.js";
import { fmtCurrency, fmtDate, fmtDateTime, daysUntil, isLowStock, isExpiringSoon, NOW } from "../utils/helpers.js";
import { sbFetchOlderMessages } from "../utils/dataLoader.js";
import { C, s, Btn, Badge, Modal, FormField, Input, Select, Textarea, Divider, ImageUpload, processarImagem, logActivity, useIsMobile } from "../components/ui.jsx";

import { TabocaLogo } from "../components/ui.jsx";

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (bloqueado && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (countdown === 0 && bloqueado) {
      setBloqueado(false);
      setTentativas(0);
      setErro('');
    }
  }, [bloqueado, countdown]);

  const handleLogin = async () => {
    if (bloqueado) return;
    if (!email.trim() || !password.trim()) {
      setErro('Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);
        if (novasTentativas >= 3) {
          setBloqueado(true);
          setCountdown(30);
          setErro('Muitas tentativas incorretas. Aguarde 30 segundos.');
        } else {
          setErro(`Email ou senha incorretos. Tentativa ${novasTentativas}/3.`);
        }
      } else {
        setErro('');
        onLogin();
      }
    } catch (e) {
      setErro('Erro ao conectar. Tente novamente.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #FAF7F4 0%, #F0E8DE 50%, #FAF7F4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:`${C.primary}08`,top:-100,right:-100,pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:`${C.amber}10`,bottom:-80,left:-80,pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:200,height:200,borderRadius:'50%',background:`${C.primary}06`,top:'40%',left:'10%',pointerEvents:'none'}}/>

      <div style={{
        width: '100%', maxWidth: 400, margin: '0 16px',
        background: '#fff', borderRadius: 20,
        boxShadow: '0 20px 60px rgba(123,58,16,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
          padding: '36px 32px 28px', textAlign: 'center',
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: 20,
            background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <img src="/Logomarca_Taboca.png" alt="Taboca" style={{width:70,height:70,objectFit:'contain',filter:'brightness(10)'}}/>
          </div>
          <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-0.02em'}}>Taboca Gestão</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',marginTop:4,fontWeight:500}}>Sistema de Gestão Empresarial</div>
        </div>

        <div style={{padding: '32px'}}>
          <div style={{fontSize:15,fontWeight:700,color:C.navy,marginBottom:6}}>Bem-vindo, Tiba! 👋</div>
          <div style={{fontSize:12,color:C.navyLight,marginBottom:24}}>Faça login para acessar o painel.</div>

          <div style={{marginBottom:16}}>
            <label style={{...s.label}}>Email</label>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}>
                <Users size={16} color={C.navyLight}/>
              </div>
              <input
                type="email"
                value={email}
                onChange={e=>{setEmail(e.target.value);setErro('');}}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                placeholder="seu@email.com"
                disabled={bloqueado}
                style={{
                  ...s.input, paddingLeft: 40,
                  border: `1.5px solid ${erro&&!loading?C.red:C.border}`,
                  opacity: bloqueado ? 0.5 : 1,
                }}
              />
            </div>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{...s.label}}>Senha</label>
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}>
                <Settings size={16} color={C.navyLight}/>
              </div>
              <input
                type={mostrarSenha?'text':'password'}
                value={password}
                onChange={e=>{setPassword(e.target.value);setErro('');}}
                onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                placeholder="Digite sua senha"
                disabled={bloqueado}
                style={{
                  ...s.input, paddingLeft: 40, paddingRight: 44,
                  border: `1.5px solid ${erro&&!loading?C.red:C.border}`,
                  opacity: bloqueado ? 0.5 : 1,
                }}
              />
              <button
                onClick={()=>setMostrarSenha(v=>!v)}
                style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',border:'none',background:'none',cursor:'pointer',padding:4}}
              >
                {mostrarSenha
                  ? <Eye size={16} color={C.navyLight}/>
                  : <EyeOff size={16} color={C.navyLight}/>}
              </button>
            </div>
          </div>

          {erro && (
            <div style={{
              background: C.redLight, border:`1px solid #FCA5A5`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} color={C.red}/>
              <span style={{fontSize:12,color:C.red,fontWeight:600}}>{erro}</span>
              {bloqueado && countdown > 0 && (
                <span style={{marginLeft:'auto',fontSize:12,fontWeight:700,color:C.red}}>{countdown}s</span>
              )}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || bloqueado}
            style={{
              width: '100%', padding: '13px',
              background: bloqueado ? C.navyLight : `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryLight} 100%)`,
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: bloqueado?'not-allowed':'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s', opacity: loading ? 0.8 : 1,
              boxShadow: bloqueado ? 'none' : `0 4px 14px ${C.primary}40`,
            }}
          >
            {loading ? (
              <><RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> Verificando...</>
            ) : bloqueado ? (
              <><AlertTriangle size={16}/> Aguarde {countdown}s</>
            ) : (
              <><Check size={16}/> Entrar no Sistema</>
            )}
          </button>

          <div style={{textAlign:'center',marginTop:20,fontSize:11,color:C.navyLight}}>
            © 2026 Taboca Pão & Pizza · Acesso restrito
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      
        @keyframes loading { 0%{width:0%} 50%{width:100%} 100%{width:0%} }`}</style>
    </div>
  );
};


export default LoginScreen;
