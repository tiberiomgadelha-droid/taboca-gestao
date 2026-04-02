import { sbInsert } from "./supabase.js";

export const logActivity = (setData, tipo, descricao, operador='Tiberio') => {
  const entry = { tipo, descricao, data: new Date().toISOString(), operador, icon: tipo };
  setData(prev => ({
    ...prev,
    activityLog: [{id: Date.now(), ...entry}, ...prev.activityLog]
  }));
  sbInsert('activity_log', entry).catch(e => console.error('logActivity error:', e));
};
