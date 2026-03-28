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

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    // Don't add empty or stats-only messages
    if (!content.trim() || content.startsWith('[STATS UPDATE')) return;

    const msg: ChatMessage = {
      id: `msg_${++messageIdRef.current}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Connect to Gemini Live API
  const connect = useCallback(() => {
    connectLive(sportMode, characterId, {
      onTranscript: (text, role) => {
        addMessage(role, text);
        if (role === 'assistant') {
          setOrbState('speaking');
          // Reset to idle/listening after a short delay
          setTimeout(() => {
            setOrbState(isListening ? 'listening' : 'idle');
          }, 2000);
        }
      },
      onAudioResponse: () => {
        setOrbState('speaking');
      },
      onConnectionChange: (connected) => {
        setIsConnected(connected);
        if (connected) {
          setOrbState('idle');
        }
      },
      onError: (error) => {
        console.error('[VoiceChat] Error:', error);
        setOrbState('idle');
      },
    });
  }, [sportMode, characterId, addMessage, isListening]);

  // Initialize connection on mount
  useEffect(() => {
    connect();
    return () => {
      disconnectLive();
    };
  }, [connect]);

  const sendTextMessage = useCallback((text: string) => {
    if (!isLiveConnected()) {
      addMessage('assistant', "Connecting to your buddy... try again in a sec!");
      return;
    }
    setOrbState('thinking');
    liveSendText(text);
  }, [addMessage]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

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
