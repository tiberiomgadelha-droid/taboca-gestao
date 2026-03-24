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

// Direct REST fetch — bypasses Supabase JS client which can hang on auth
export const _restFetch = async (path) => {
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`REST ${res.status}: ${path}`);
  return res.json();
};

export const sbFetchTables = async (tableConfigs) => {
  const results = {};
  const settled = await Promise.allSettled(
    tableConfigs.map(async ({ name, restPath }) => {
      const path = restPath || `${name}?select=*&order=id.asc`;
      const data = await _restFetch(path);
      return { name, data: data || [] };
    })
  );
  settled.forEach(r => {
    if (r.status === 'fulfilled') results[r.value.name] = r.value.data;
    else results[r.reason?.name || 'unknown'] = [];
  });
  return results;
};
