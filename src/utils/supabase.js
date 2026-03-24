import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const sbInsert = async (table, record) => {
  const clean = {...record};
  delete clean.id;
  const { data, error } = await supabase.from(table).insert(clean).select().single();
  if (error) { console.error(`sbInsert ${table}:`, error); throw error; }
  return data;
};

export const sbUpdate = async (table, id, updates) => {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) { console.error(`sbUpdate ${table}:`, error); throw error; }
  return data;
};

export const sbDelete = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { console.error(`sbDelete ${table}:`, error); throw error; }
};

export const sbUpsertSettings = async (settings) => {
  const { data, error } = await supabase.from('settings').upsert({id: 1, ...settings}).select().single();
  if (error) { console.error('sbUpsertSettings:', error); throw error; }
  return data;
};

export const sbFetchTables = async (tableConfigs) => {
  const results = {};
  const settled = await Promise.allSettled(
    tableConfigs.map(async ({ name, query }) => {
      const q = query || supabase.from(name).select('*').order('id', { ascending: true });
      const { data, error } = await q;
      if (error) { console.error(`fetch ${name}:`, error); return { name, data: [] }; }
      return { name, data };
    })
  );
  settled.forEach(r => {
    if (r.status === 'fulfilled') results[r.value.name] = r.value.data;
    else results[r.reason?.name || 'unknown'] = [];
  });
  return results;
};
