# 🎙️ Plano de Implementação — Voz no Taboca Gestão (Fase 5)

> **Versão:** 1.0 — Março 2026
> **Autor:** Plano gerado para Tiberio Gadelha
> **Sistema:** Taboca Gestão (gestao.tabocapaoepizza.com.br)
> **Custo adicional:** R$ 0,00

---

## Visão Geral

Este plano cobre a implementação de **reconhecimento de voz (STT)** e **síntese de voz (TTS)** em dois agentes do sistema:

| Funcionalidade | Agent Gestão | Agent Atendente |
|---|:---:|:---:|
| Entrada por voz (microfone no app) | ✅ | ✅ |
| Transcrever áudios recebidos via WhatsApp/Instagram | ❌ | ✅ |
| Responder clientes em áudio | ❌ | ✅ |

---

## 1. Tecnologias Escolhidas (Custo Zero)

### 1.1 STT no Frontend — Web Speech API

| Atributo | Detalhe |
|---|---|
| **Tecnologia** | Web Speech API (nativa do navegador) |
| **Custo** | R$ 0,00 — embutida no Chrome/Edge/Safari |
| **Configuração** | Nenhuma — sem cadastro, sem API key |
| **Qualidade** | Excelente para pt-BR |
| **Compatibilidade** | Chrome ✅ Edge ✅ Safari ✅ Firefox ❌ |
| **Uso** | Microfone do gestor no PanelIA + PanelAtendimento |

**Por que escolhemos:** É a opção mais simples e direta possível. Zero dependências externas, zero latência de autenticação, funciona offline em parte. Como o sistema roda em navegador (SPA React), é a escolha natural.

### 1.2 STT no Servidor — Groq Whisper API

| Atributo | Detalhe |
|---|---|
| **Tecnologia** | Groq Cloud — modelo `whisper-large-v3-turbo` |
| **Custo** | R$ 0,00 no plano gratuito |
| **Limite gratuito** | 7.200 segundos de áudio/hora (≈ 120 min/hora) |
| **Velocidade** | Mais rápido do mundo em inferência Whisper |
| **Idiomas** | Português brasileiro incluído |
| **Formato suportado** | MP3, OGG, OGA, FLAC, WAV, M4A, MP4, OPUS |
| **Cadastro** | Gratuito em console.groq.com |
| **Uso** | Transcrever áudios enviados por clientes via WhatsApp/Instagram |

**Por que escolhemos:** Para uma padaria com 50–200 clientes ativos, o limite de 120 min/hora é mais do que suficiente. O Groq é a implementação mais rápida do modelo Whisper disponível publicamente — respostas em ~1 segundo. Não exige cartão de crédito para criar conta.

**Alternativas consideradas:**
- OpenAI Whisper self-hosted: requer servidor com GPU/CPU dedicado — custo
- AssemblyAI: 100h/mês grátis, mas exige configuração mais complexa
- Deepgram: free tier menor (45 min/mês)

### 1.3 TTS no Servidor — ElevenLabs (free) + HuggingFace (backup)

| Atributo | ElevenLabs (primário) | HuggingFace MMS-TTS (backup) |
|---|---|---|
| **Custo** | R$ 0,00 (plano gratuito) | R$ 0,00 (sem limite prático) |
| **Limite** | 10.000 caracteres/mês | Sem limite (rate limiting leve) |
| **Qualidade** | ⭐⭐⭐⭐⭐ (natural, humano) | ⭐⭐⭐ (robótico leve) |
| **Voz pt-BR** | Excelente (várias opções) | Funcional |
| **Formato saída** | MP3 | WAV |
| **Latência** | ~1–2 segundos | ~3–5 segundos |
| **Cadastro** | elevenlabs.io (grátis) | huggingface.co (grátis) |

**Lógica de uso:** ElevenLabs como serviço primário (melhor qualidade). Se atingir o limite mensal, HuggingFace como fallback automático. Para ~500–800 respostas em áudio/mês com mensagens curtas (média 15 palavras = ~90 chars), os 10.000 chars/mês cobrirão bem.

### 1.4 Armazenamento de Áudios Gerados — Supabase Storage

Os arquivos de áudio gerados pelo TTS precisam de uma URL pública temporária para envio via WhatsApp API.

| Atributo | Detalhe |
|---|---|
| **Tecnologia** | Supabase Storage (já usado no projeto) |
| **Custo** | R$ 0,00 (1 GB incluído no plano free) |
| **Limpeza** | Arquivos deletados após 24h (via cron Edge Function) |
| **Bucket** | `audio-responses` (novo, público) |

---

## 2. Arquitetura da Solução

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                  │
│  PanelIA (Agent Gestão)          PanelAtendimento                │
│  ┌─────────────────────┐         ┌────────────────────────────┐  │
│  │ [🎙️ Microfone] →   │         │ [🎙️ Microfone] →          │  │
│  │ Web Speech API      │         │ Web Speech API             │  │
│  │ Texto → Agent Gestão│         │ Texto → envio manual       │  │
│  └─────────────────────┘         └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    WEBHOOKS (Edge Functions)                     │
│                                                                  │
│  whatsapp-webhook / instagram-webhook                            │
│                                                                  │
│  Mensagem de TEXTO  ──────────────────────────→ agent-atendente  │
│                                                        ↓         │
│  Mensagem de ÁUDIO                            Resposta texto     │
│      ↓                                                ↓          │
│  Baixa áudio da API Meta            preferencia_audio = true?   │
│      ↓                              ou última msg foi áudio?     │
│  Groq Whisper API                         SIM ↓      NÃO ↓      │
│  (transcrição pt-BR)              ElevenLabs TTS  Envia texto    │
│      ↓                                    ↓                      │
│  Texto transcrito                 Supabase Storage               │
│      ↓                            (URL pública 24h)              │
│  agent-atendente                          ↓                      │
│                                   WhatsApp Audio API             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Plano de Implementação por Etapas

### Etapa 1 — Cadastros e API Keys (30 min)

**1.1 Criar conta Groq (STT servidor)**

1. Acesse [console.groq.com](https://console.groq.com)
2. Crie conta gratuita (pode usar Google login)
3. Vá em **API Keys** → **Create API Key**
4. Copie a chave (começa com `gsk_...`)
5. No Supabase Dashboard → **Edge Functions → Secrets**
6. Adicione: `GROQ_API_KEY` = `gsk_...`

**1.2 Criar conta ElevenLabs (TTS servidor)**

1. Acesse [elevenlabs.io](https://elevenlabs.io)
2. Crie conta gratuita
3. Vá em **Profile → API Key**
4. Copie a chave
5. No Supabase: adicione `ELEVENLABS_API_KEY` = `xi_...`
6. Anote o ID da voz pt-BR preferida (ver seção 5.3)

**1.3 Criar bucket Supabase Storage**

Execute no SQL Editor do Supabase:

```sql
-- Criar bucket público para áudios gerados
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('audio-responses', 'audio-responses', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Policy: Edge Functions podem inserir
CREATE POLICY "service_role_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'audio-responses');

-- Policy: Leitura pública
CREATE POLICY "public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'audio-responses');
```

**1.4 Adicionar campo de preferência na tabela `clientes`**

```sql
-- Preferência de comunicação por áudio
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS preferencia_audio BOOLEAN DEFAULT false;

-- Rastrear tipo da última mensagem recebida (para detecção automática)
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'text';
-- Valores: 'text', 'audio', 'image', 'video', 'sticker'
```

---

### Etapa 2 — STT no Frontend (Agent Gestão + Painel Atendimento)

**Arquivo a modificar:** `src/App.jsx`

**2.1 Componente reutilizável `VoiceInputButton`**

Adicione este componente dentro do `App.jsx` (pode ser antes dos Panels):

```jsx
// ==========================================
// COMPONENTE: ENTRADA POR VOZ
// ==========================================
function VoiceInputButton({ onTranscript, lang = 'pt-BR', className = '' }) {
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef(null);

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = () => {
    if (!isSupported) {
      alert('Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error !== 'no-speech') console.error('Erro voz:', e.error);
    };
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`p-2 rounded-full transition-all ${
        isListening
          ? 'bg-red-500 text-white animate-pulse shadow-lg'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } ${className}`}
      title={isListening ? 'Parar gravação' : 'Falar (voz → texto)'}
    >
      {isListening ? (
        // Ícone microfone ativo (vermelho pulsando)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zm0 14a7 7 0 0 0 7-7H17a5 5 0 0 1-10 0H5a7 7 0 0 0 7 7zm0 2v2h-2v1h4v-1h-2v-2z"/>
        </svg>
      ) : (
        // Ícone microfone inativo
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}
```

**2.2 Integração no PanelIA (Agent Gestão)**

Localize o input de mensagem no `PanelIA` (~linha 3100+ em App.jsx) e adicione o botão:

```jsx
// ANTES (input existente):
<input
  value={iaMessage}
  onChange={e => setIaMessage(e.target.value)}
  placeholder="Pergunte algo ao assistente..."
  ...
/>

// DEPOIS (adicionar VoiceInputButton ao lado):
<div className="flex items-center gap-2">
  <input
    value={iaMessage}
    onChange={e => setIaMessage(e.target.value)}
    placeholder="Pergunte algo ao assistente..."
    ...
  />
  <VoiceInputButton
    onTranscript={(text) => setIaMessage(prev => prev + text)}
    lang="pt-BR"
  />
</div>
```

**2.3 Integração no PanelAtendimento (Operador)**

Localize o input de mensagem manual no chat (~linha 2750+) e adicione o botão:

```jsx
// Mesma lógica — adicionar VoiceInputButton ao lado do input de texto:
<VoiceInputButton
  onTranscript={(text) => setMensagemDigitada(prev => prev + text)}
  lang="pt-BR"
/>
```

---

### Etapa 3 — STT nos Webhooks (Áudios de Clientes)

**Arquivos a modificar:** `whatsapp-webhook/index.ts` e `instagram-webhook/index.ts`

**3.1 Função helper de transcrição com Groq**

Crie um novo arquivo `supabase/functions/_shared/groq-stt.ts`:

```typescript
// _shared/groq-stt.ts
// Transcrição de áudio usando Groq Whisper API (grátis)

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export async function transcribeAudio(
  audioUrl: string,
  mimeType: string = 'audio/ogg',
  groqApiKey: string
): Promise<string | null> {
  try {
    // 1. Baixar o arquivo de áudio da Meta
    const audioResponse = await fetch(audioUrl, {
      headers: { Authorization: `Bearer ${Deno.env.get('WHATSAPP_API_TOKEN')}` }
    });

    if (!audioResponse.ok) {
      console.error('Erro ao baixar áudio:', audioResponse.status);
      return null;
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: mimeType });

    // 2. Enviar para Groq Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${mimeType.split('/')[1] || 'ogg'}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'pt'); // Português
    formData.append('response_format', 'text');

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: formData
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      console.error('Erro Groq STT:', err);
      return null;
    }

    const transcript = await groqResponse.text();
    return transcript.trim();

  } catch (error) {
    console.error('Erro na transcrição:', error);
    return null;
  }
}

// Obtém a URL de download do arquivo de mídia da Meta API
export async function getMediaUrl(
  mediaId: string,
  accessToken: string
): Promise<{ url: string; mimeType: string } | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      url: data.url,
      mimeType: data.mime_type || 'audio/ogg'
    };
  } catch {
    return null;
  }
}
```

**3.2 Modificação no `whatsapp-webhook/index.ts`**

Localize a seção que processa mensagens e expanda para suportar áudio:

```typescript
// SUBSTITUIR o bloco de extração de conteúdo atual por:

let conteudoTexto = '';
let tipoMensagem = msg.type || 'text';

if (msg.type === 'text') {
  conteudoTexto = msg.text?.body || '';

} else if (msg.type === 'audio') {
  // Transcrever áudio com Groq
  const groqKey = Deno.env.get('GROQ_API_KEY');

  if (groqKey && msg.audio?.id) {
    const mediaInfo = await getMediaUrl(msg.audio.id, Deno.env.get('WHATSAPP_API_TOKEN')!);

    if (mediaInfo) {
      const transcript = await transcribeAudio(mediaInfo.url, mediaInfo.mimeType, groqKey);
      if (transcript) {
        conteudoTexto = `[Áudio transcrito]: ${transcript}`;
        // Guardar também a transcrição limpa para o agente
        conteudoTexto = transcript;
      } else {
        conteudoTexto = '[Áudio não pôde ser transcrito]';
      }
    }
  } else {
    conteudoTexto = '[Mensagem de áudio recebida]';
  }

} else {
  // Outros tipos: imagem, vídeo, sticker, documento
  console.log(`Tipo de mensagem não suportado: ${msg.type}`);
  return new Response('ok', { status: 200 });
}

if (!conteudoTexto) {
  return new Response('ok', { status: 200 });
}

// Salvar mensagem com tipo
await saveMensagem(clienteId, 'whatsapp', conteudoTexto, true, externalId, tipoMensagem);
```

**3.3 Atualizar `saveMensagem` para incluir tipo**

No helper existente:
```typescript
async function saveMensagem(
  clienteId: number,
  canal: string,
  conteudo: string,
  deCliente: boolean,
  externalId?: string,
  tipo: string = 'text'  // <-- novo parâmetro
) {
  await supabase.from('mensagens').insert({
    cliente_id: clienteId,
    canal,
    conteudo,
    de_cliente: deCliente,
    external_id: externalId,
    origem: deCliente ? 'cliente' : 'ia_automatico',
    tipo  // <-- salvar tipo
  });
}
```

---

### Etapa 4 — TTS nas Respostas (Clientes que preferem áudio)

**4.1 Função helper de TTS com ElevenLabs**

Crie `supabase/functions/_shared/elevenlabs-tts.ts`:

```typescript
// _shared/elevenlabs-tts.ts
// Síntese de voz com ElevenLabs (grátis: 10k chars/mês)
// Fallback: HuggingFace MMS-TTS

const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // "Adam" - funciona bem para pt-BR
// Alternativa pt-BR melhor: procure em elevenlabs.io/voice-library por "Portuguese"

export async function generateTTS(
  text: string,
  apiKey: string
): Promise<ArrayBuffer | null> {
  try {
    // Limitar texto a 500 chars para economizar quota
    const truncated = text.length > 500 ? text.substring(0, 497) + '...' : text;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: truncated,
          model_id: 'eleven_multilingual_v2', // Suporta pt-BR
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.log('ElevenLabs: limite atingido, usando fallback HuggingFace');
        return await generateTTSFallback(text);
      }
      console.error('Erro ElevenLabs TTS:', response.status);
      return null;
    }

    return await response.arrayBuffer();

  } catch (error) {
    console.error('Erro TTS:', error);
    return await generateTTSFallback(text);
  }
}

// FALLBACK: HuggingFace MMS-TTS (gratuito, sem limite)
async function generateTTSFallback(text: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/mms-tts-por',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text })
      }
    );

    if (!response.ok) return null;
    return await response.arrayBuffer();

  } catch {
    return null;
  }
}
```

**4.2 Função de upload para Supabase Storage**

Adicione em `_shared/supabase.ts` ou no próprio webhook:

```typescript
// Upload de áudio para Supabase Storage → retorna URL pública
export async function uploadAudioToStorage(
  audioBuffer: ArrayBuffer,
  fileName: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('audio-responses')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg', // MP3 do ElevenLabs
        upsert: true
      });

    if (error) {
      console.error('Erro upload storage:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('audio-responses')
      .getPublicUrl(fileName);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error);
    return null;
  }
}
```

**4.3 Função para enviar áudio via WhatsApp API**

```typescript
// Enviar mensagem de áudio via WhatsApp
async function sendWhatsAppAudio(
  to: string,
  audioUrl: string,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'audio',
          audio: { link: audioUrl }
        })
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
```

**4.4 Lógica de detecção de preferência de áudio no webhook**

No fluxo principal do `whatsapp-webhook`, após chamar o `agent-atendente`:

```typescript
// Após obter a resposta do agente:
const respostaTexto = agentResponse.resposta;

// Detectar se deve responder em áudio:
// Condição 1: última mensagem do cliente foi áudio
// Condição 2: cliente tem preferencia_audio = true
const { data: clienteData } = await supabase
  .from('clientes')
  .select('preferencia_audio')
  .eq('id', clienteId)
  .single();

const deveResponderEmAudio =
  tipoMensagem === 'audio' || clienteData?.preferencia_audio === true;

if (deveResponderEmAudio) {
  const elevenKey = Deno.env.get('ELEVENLABS_API_KEY');

  if (elevenKey) {
    const audioBuffer = await generateTTS(respostaTexto, elevenKey);

    if (audioBuffer) {
      const fileName = `resp_${clienteId}_${Date.now()}.mp3`;
      const audioUrl = await uploadAudioToStorage(audioBuffer, fileName);

      if (audioUrl) {
        await sendWhatsAppAudio(
          phoneNumber,
          audioUrl,
          Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!,
          Deno.env.get('WHATSAPP_API_TOKEN')!
        );
        // Também salvar no banco como mensagem enviada
        await saveMensagem(clienteId, 'whatsapp', respostaTexto, false, undefined, 'audio');
        return new Response('ok', { status: 200 });
      }
    }
  }
}

// Fallback: enviar como texto normal
await sendWhatsAppText(phoneNumber, respostaTexto, ...);
```

---

### Etapa 5 — Toggle de Preferência de Áudio no Frontend

No `PanelAtendimento` ou no cadastro do cliente, adicionar opção de preferência de áudio:

```jsx
// Na visualização do cliente no chat, adicionar toggle:
<div className="flex items-center gap-2 text-sm">
  <label className="text-gray-600">Responder em áudio:</label>
  <input
    type="checkbox"
    checked={clienteSelecionado?.preferencia_audio || false}
    onChange={async (e) => {
      await supabase
        .from('clientes')
        .update({ preferencia_audio: e.target.checked })
        .eq('id', clienteSelecionado.id);
    }}
    className="toggle"
  />
</div>
```

---

### Etapa 6 — Limpeza Automática de Áudios (Opcional)

Para evitar acúmulo no Supabase Storage, crie uma Edge Function de limpeza:

```typescript
// supabase/functions/cleanup-audio/index.ts
// Deletar áudios com mais de 24h (rodar via cron ou manualmente)

Deno.serve(async () => {
  const supabase = createClient(...);

  const { data: files } = await supabase.storage
    .from('audio-responses')
    .list();

  if (files) {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const toDelete = files
      .filter(f => new Date(f.created_at).getTime() < oneDayAgo)
      .map(f => f.name);

    if (toDelete.length > 0) {
      await supabase.storage.from('audio-responses').remove(toDelete);
    }
  }

  return new Response('cleanup done', { status: 200 });
});
```

---

## 4. Resumo de Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/App.jsx` | Modificar | Adicionar `VoiceInputButton` + integrar no PanelIA e PanelAtendimento |
| `supabase/functions/_shared/groq-stt.ts` | Criar | Helper transcrição Groq Whisper |
| `supabase/functions/_shared/elevenlabs-tts.ts` | Criar | Helper síntese de voz ElevenLabs + fallback HF |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar | Processar áudio incoming + responder em áudio |
| `supabase/functions/instagram-webhook/index.ts` | Modificar | Processar áudio incoming (DMs com áudio) |
| SQL (Supabase Editor) | Executar | Adicionar coluna `tipo` em `mensagens` + `preferencia_audio` em `clientes` + bucket Storage |

---

## 5. Ordem de Implementação Recomendada

```
Semana 1 — Setup e Frontend (mais simples, impacto imediato)
  ├─ Etapa 1.1: Criar conta Groq e obter API key
  ├─ Etapa 1.2: Criar conta ElevenLabs e obter API key
  ├─ Etapa 1.3: Criar bucket no Supabase Storage (SQL 5 min)
  ├─ Etapa 1.4: Rodar migration SQL (tipo + preferencia_audio)
  └─ Etapa 2: Adicionar VoiceInputButton no App.jsx ← Você sente o impacto imediatamente!

Semana 2 — Webhooks STT
  ├─ Etapa 3.1: Criar _shared/groq-stt.ts
  ├─ Etapa 3.2: Modificar whatsapp-webhook para áudio
  ├─ Etapa 3.3: Testar enviando áudio para o WhatsApp da padaria
  └─ Repetir para instagram-webhook

Semana 3 — TTS e Respostas em Áudio
  ├─ Etapa 4.1: Criar _shared/elevenlabs-tts.ts
  ├─ Etapa 4.2: Testar geração de TTS localmente
  ├─ Etapa 4.3: Integrar no webhook + testar envio de áudio pelo WhatsApp
  └─ Etapa 5: Toggle no frontend

```

---

## 6. Limites e Estimativas para a Taboca

| Recurso | Limite Gratuito | Estimativa de Uso Mensal | Status |
|---|---|---|---|
| Web Speech API | Ilimitado | 50–200 usos/mês (gestor) | ✅ Sobra muito |
| Groq Whisper | 7.200 seg/hora | 300–500 áudios × 15 seg = ~75 min | ✅ Dentro do limite |
| ElevenLabs TTS | 10.000 chars/mês | 200 respostas × 150 chars = ~30.000 chars | ⚠️ Pode exceder em pico |
| HuggingFace (fallback) | Sem limite prático | Quando ElevenLabs esgotar | ✅ Backup garantido |
| Supabase Storage | 1 GB | ~500 áudios × 50 KB = 25 MB | ✅ Sobra muito |

> **Nota sobre ElevenLabs:** Se o volume de respostas em áudio crescer, vale a pena considerar o plano Starter ($5/mês = 30.000 chars). Por enquanto o gratuito atende, especialmente combinado com o fallback HuggingFace.

---

## 7. Notas Importantes

### Permissão de Microfone no Browser
O Chrome pedirá permissão de microfone na primeira vez que o gestor usar a entrada por voz. Isso é normal. A permissão fica salva para o domínio `gestao.tabocapaoepizza.com.br`.

### Áudios do Instagram
O Instagram (Messenger API) também suporta mensagens de áudio em DMs. O tratamento é idêntico ao WhatsApp, mas a lógica de resposta em áudio precisa usar a Messenger API (não há um endpoint nativo de "audio" no Instagram como no WhatsApp — o envio é como arquivo/link). Verifique suporte atual na documentação Meta.

### Qualidade da Voz pt-BR no ElevenLabs
Para uma voz mais natural em português brasileiro, explore a **Voice Library** do ElevenLabs (gratuita para uso). Busque por "Portuguese Brazil" e use o ID da voz encontrada no lugar de `ELEVENLABS_VOICE_ID`.

### Tokens Temporários (Problema Existente)
Este plano assume que o problema crítico dos tokens temporários do WhatsApp/Instagram (seção 8.1 do PROMPT_BASE) já foi resolvido. Sem tokens permanentes, os webhooks de áudio também falharão.

---

*Documento gerado em Março 2026 — Sistema Taboca Gestão Fase 5*
