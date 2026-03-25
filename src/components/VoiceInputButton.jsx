// ============================================================
// VoiceInputButton — Componente de entrada por voz
// Usa Web Speech API (nativa do navegador, 100% gratuita)
// Compatível com Chrome, Edge e Safari (requer HTTPS ou localhost)
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";

const VoiceInputButton = ({ onTranscript, lang = 'pt-BR', size = 'md', className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | starting | listening | error
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  // Detectar suporte à API
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  // Auto-limpar mensagem de erro
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setErrorMsg('Navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
      setStatus('error');
      return;
    }

    // Verificar se estamos em contexto seguro (HTTPS ou localhost)
    const isSecure = window.isSecureContext;
    if (!isSecure) {
      setErrorMsg('Reconhecimento de voz requer HTTPS. Acesse via https:// ou use Chrome com localhost.');
      setStatus('error');
      return;
    }

    setStatus('starting');
    setErrorMsg('');

    try {
      const recognition = new SpeechRecognitionAPI();

      recognition.lang = lang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      recognition.onstart = () => {
        console.log('🎙️ Reconhecimento de voz iniciado');
        setIsListening(true);
        setStatus('listening');
        setInterimText('');
      };

      recognition.onend = () => {
        console.log('🎙️ Reconhecimento de voz finalizado');
        setIsListening(false);
        setStatus('idle');
        setInterimText('');
      };

      recognition.onerror = (e) => {
        console.error('🎙️ Erro no reconhecimento:', e.error, e);
        setIsListening(false);
        setInterimText('');

        switch (e.error) {
          case 'not-allowed':
          case 'permission-denied':
            setErrorMsg('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o microfone.');
            setStatus('error');
            break;
          case 'no-speech':
            setErrorMsg('Nenhuma fala detectada. Tente novamente.');
            setStatus('idle');
            break;
          case 'audio-capture':
            setErrorMsg('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
            setStatus('error');
            break;
          case 'network':
            setErrorMsg('Erro de rede. Verifique sua conexão com a internet.');
            setStatus('error');
            break;
          case 'service-not-allowed':
            setErrorMsg('Serviço de voz não disponível. Verifique se está usando HTTPS.');
            setStatus('error');
            break;
          case 'aborted':
            setStatus('idle');
            break;
          default:
            setErrorMsg(`Erro: ${e.error}. Tente novamente.`);
            setStatus('error');
        }
      };

      recognition.onresult = (e) => {
        let interim = '';
        let finalText = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }

        if (finalText) {
          console.log('🎙️ Texto reconhecido:', finalText);
          onTranscript(finalText);
          setInterimText('');
        } else {
          setInterimText(interim);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      console.log('🎙️ recognition.start() chamado');

    } catch (err) {
      console.error('🎙️ Exceção ao iniciar reconhecimento:', err);
      setErrorMsg(`Erro ao iniciar: ${err.message}`);
      setStatus('error');
      setIsListening(false);
    }
  }, [SpeechRecognitionAPI, lang, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) {
        console.error('Erro ao parar reconhecimento:', e);
      }
    }
    setIsListening(false);
    setStatus('idle');
    setInterimText('');
  }, []);

  // Se o navegador nem suporta, mostrar botão desabilitado com explicação
  const sizes = {
    sm: { btn: 30, icon: 13, font: 10 },
    md: { btn: 38, icon: 15, font: 11 },
    lg: { btn: 44, icon: 18, font: 12 },
  };
  const s = sizes[size] || sizes.md;

  const isActive = isListening || status === 'listening';
  const isStarting = status === 'starting';
  const hasError = status === 'error';

  // Cor do botão baseada no estado
  const getBtnStyle = () => {
    if (isActive) return {
      border: '2px solid #EF4444',
      background: '#FEE2E2',
      color: '#EF4444',
    };
    if (isStarting) return {
      border: '2px solid #F59E0B',
      background: '#FEF3C7',
      color: '#F59E0B',
    };
    if (hasError) return {
      border: '1px solid #EF4444',
      background: '#FEF2F2',
      color: '#EF4444',
    };
    return {
      border: '1px solid #E5E7EB',
      background: '#F9FAFB',
      color: '#6B7280',
    };
  };

  const btnStyle = getBtnStyle();

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} className={className}>
      <button
        type="button"
        onClick={isActive ? stopListening : startListening}
        disabled={isStarting}
        title={
          !SpeechRecognitionAPI ? 'Navegador não suporta voz (use Chrome/Edge)' :
          isActive ? 'Parar gravação' :
          isStarting ? 'Iniciando...' :
          'Falar por voz'
        }
        style={{
          width: s.btn,
          height: s.btn,
          borderRadius: '50%',
          ...btnStyle,
          cursor: isStarting ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          animation: isActive ? 'voicePulse 1.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
          outline: 'none',
          position: 'relative',
          opacity: !SpeechRecognitionAPI ? 0.4 : 1,
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
          {isActive ? (
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
          ) : (
            <>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </>
          )}
        </svg>
      </button>

      {/* Tooltip de status/interim/erro */}
      {(isActive && interimText) || isStarting || errorMsg ? (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: errorMsg ? '#991B1B' : isStarting ? '#92400E' : '#1F2937',
          color: '#fff',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: s.font,
          whiteSpace: 'nowrap',
          maxWidth: 280,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}>
          {errorMsg || (isStarting ? 'Solicitando microfone...' : `${interimText}...`)}
        </div>
      ) : null}

      {/* Indicador de escuta ativo */}
      {isActive && !interimText && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#DC2626',
          color: '#fff',
          borderRadius: 8,
          padding: '4px 10px',
          fontSize: s.font,
          marginBottom: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#fff',
            animation: 'voicePulse 1s ease-in-out infinite',
          }}/>
          Ouvindo...
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
