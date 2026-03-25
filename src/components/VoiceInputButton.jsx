// ============================================================
// VoiceInputButton — Componente de entrada por voz
// Usa MediaRecorder (gravação local) + Groq Whisper (transcrição server-side)
// Funciona em TODOS os navegadores modernos com HTTPS
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const VoiceInputButton = ({ onTranscript, lang = 'pt-BR', size = 'md', className = '' }) => {
  const [status, setStatus] = useState('idle'); // idle | recording | transcribing | error
  const [errorMsg, setErrorMsg] = useState('');
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording(true);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-limpar mensagem de erro
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Timer de gravação
  useEffect(() => {
    if (status === 'recording') {
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [status]);

  const startRecording = useCallback(async () => {
    setErrorMsg('');

    // Verificar suporte a MediaRecorder
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Navegador não suporta gravação de áudio.');
      setStatus('error');
      return;
    }

    try {
      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Escolher formato suportado
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Parar todas as tracks do stream
        stream.getTracks().forEach(t => t.stop());

        if (chunksRef.current.length === 0) {
          setStatus('idle');
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        console.log(`🎙️ Gravação finalizada: ${audioBlob.size} bytes`);

        if (audioBlob.size < 1000) {
          setErrorMsg('Gravação muito curta. Tente novamente.');
          setStatus('idle');
          return;
        }

        // Enviar para transcrição
        await transcribeAudio(audioBlob, mimeType || 'audio/webm');
      };

      recorder.onerror = (e) => {
        console.error('Erro no MediaRecorder:', e);
        setErrorMsg('Erro durante gravação.');
        setStatus('error');
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(500); // Capturar chunks a cada 500ms
      setStatus('recording');
      console.log('🎙️ Gravação iniciada');

    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Permissão de microfone negada. Clique no cadeado na barra de endereços.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('Nenhum microfone encontrado. Conecte um microfone.');
      } else {
        setErrorMsg(`Erro: ${err.message}`);
      }
      setStatus('error');
    }
  }, []);

  const stopRecording = useCallback((silent = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (silent) {
      setStatus('idle');
    }
  }, []);

  const transcribeAudio = useCallback(async (audioBlob, mimeType) => {
    setStatus('transcribing');

    try {
      // Converter blob para base64
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

      const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          audio: base64,
          mimeType: mimeType,
          fileName: `recording.${ext}`,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (data.text && data.text.trim()) {
        console.log('🎙️ Transcrição recebida:', data.text);
        onTranscript(data.text.trim());
        setStatus('idle');
      } else {
        setErrorMsg('Nenhuma fala detectada. Tente novamente.');
        setStatus('idle');
      }
    } catch (err) {
      console.error('Erro na transcrição:', err);
      setErrorMsg(`Erro na transcrição: ${err.message}`);
      setStatus('error');
      // Auto-recover
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [onTranscript]);

  const handleClick = useCallback(() => {
    if (status === 'recording') {
      stopRecording();
    } else if (status === 'idle' || status === 'error') {
      startRecording();
    }
    // Se está transcrevendo, ignora clique
  }, [status, startRecording, stopRecording]);

  const sizes = {
    sm: { btn: 30, icon: 13, font: 10 },
    md: { btn: 38, icon: 15, font: 11 },
    lg: { btn: 44, icon: 18, font: 12 },
  };
  const s = sizes[size] || sizes.md;

  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';

  const getBtnStyle = () => {
    if (isRecording) return { border: '2px solid #EF4444', background: '#FEE2E2', color: '#EF4444' };
    if (isTranscribing) return { border: '2px solid #F59E0B', background: '#FEF3C7', color: '#F59E0B' };
    if (errorMsg) return { border: '1px solid #EF4444', background: '#FEF2F2', color: '#EF4444' };
    return { border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280' };
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const ss = secs % 60;
    return `${m}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isTranscribing}
        title={
          isRecording ? 'Parar gravação' :
          isTranscribing ? 'Transcrevendo...' :
          'Gravar áudio por voz'
        }
        style={{
          width: s.btn,
          height: s.btn,
          borderRadius: '50%',
          ...getBtnStyle(),
          cursor: isTranscribing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          animation: isRecording ? 'voicePulse 1.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
          outline: 'none',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isRecording ? (
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
          ) : isTranscribing ? (
            <>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="20 10" >
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
              </circle>
            </>
          ) : (
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </>
          )}
        </svg>
      </button>

      {/* Tooltip */}
      {(isRecording || isTranscribing || errorMsg) && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: errorMsg ? '#991B1B' : isRecording ? '#DC2626' : '#92400E',
          color: '#fff',
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: s.font,
          whiteSpace: 'nowrap',
          maxWidth: 300,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {errorMsg ? errorMsg :
           isRecording ? (
            <>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#fff',
                animation: 'voicePulse 1s ease-in-out infinite',
              }}/>
              {`Gravando ${formatTime(seconds)}... clique para parar`}
            </>
          ) : 'Transcrevendo...'}
        </div>
      )}

      <style>{`
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default VoiceInputButton;
