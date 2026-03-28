import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, VoiceOrbState, CharacterId, SportMode } from '../types';
import {
  connectLive,
  disconnectLive,
  startMicrophone,
  stopMicrophone,
  sendTextMessage as liveSendText,
  isLiveConnected,
} from '../services/geminiLive';

interface UseVoiceChatReturn {
  messages: ChatMessage[];
  orbState: VoiceOrbState;
  isListening: boolean;
  isConnected: boolean;
  sendTextMessage: (text: string) => void;
  toggleMicrophone: () => void;
  latestMessage: ChatMessage | null;
}

export function useVoiceChat(
  characterId: CharacterId,
  sportMode: SportMode
): UseVoiceChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [orbState, setOrbState] = useState<VoiceOrbState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messageIdRef = useRef(0);
  const connectedOnceRef = useRef(false);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    if (!content.trim() || content.startsWith('[STATS')) return;
    const msg: ChatMessage = {
      id: `msg_${++messageIdRef.current}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Connect ONCE on mount — no dependencies that change
  useEffect(() => {
    if (connectedOnceRef.current) return;
    connectedOnceRef.current = true;

    connectLive(sportMode, characterId, {
      onTranscript: (text, role) => {
        addMessage(role, text);
        if (role === 'assistant') {
          setOrbState('speaking');
          setTimeout(() => setOrbState('idle'), 3000);
        }
      },
      onAudioResponse: () => {
        setOrbState('speaking');
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected);
      },
      onError: (error) => {
        console.error('[VoiceChat] Error:', error);
      },
    });

    return () => {
      disconnectLive();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendTextMessage = useCallback((text: string) => {
    setOrbState('thinking');
    liveSendText(text);
  }, []);

  const toggleMicrophone = useCallback(async () => {
    if (isListening) {
      await stopMicrophone();
      setIsListening(false);
      setOrbState('idle');
    } else {
      await startMicrophone();
      setIsListening(true);
      setOrbState('listening');
    }
  }, [isListening]);

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return {
    messages,
    orbState,
    isListening,
    isConnected,
    sendTextMessage,
    toggleMicrophone,
    latestMessage,
  };
}
