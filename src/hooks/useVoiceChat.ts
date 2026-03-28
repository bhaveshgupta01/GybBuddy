import { useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { ChatMessage, VoiceOrbState, CharacterId } from '../types';
import { CHARACTERS } from '../constants/characters';
import {
  sendMessage as geminiSendMessage,
  getGreeting,
  getRunSummary,
} from '../services/gemini';
import { RunStats, SportMode } from '../types';

interface UseVoiceChatReturn {
  messages: ChatMessage[];
  orbState: VoiceOrbState;
  isSpeaking: boolean;
  sendTextMessage: (text: string) => Promise<void>;
  requestGreeting: (sportMode: SportMode) => Promise<void>;
  requestSummary: (stats: RunStats) => Promise<void>;
  speakMessage: (text: string) => void;
  stopSpeaking: () => void;
  latestMessage: ChatMessage | null;
}

export function useVoiceChat(characterId: CharacterId): UseVoiceChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [orbState, setOrbState] = useState<VoiceOrbState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messageIdRef = useRef(0);

  const character = CHARACTERS[characterId];

  const addMessage = useCallback((role: 'user' | 'assistant', content: string): ChatMessage => {
    const msg: ChatMessage = {
      id: `msg_${++messageIdRef.current}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const speakMessage = useCallback((text: string) => {
    // Don't speak "ok" responses (context update acknowledgements)
    if (text.toLowerCase().trim() === 'ok') return;

    setIsSpeaking(true);
    setOrbState('speaking');

    Speech.speak(text, {
      pitch: character.voiceConfig.pitch,
      rate: character.voiceConfig.rate,
      onDone: () => {
        setIsSpeaking(false);
        setOrbState('idle');
      },
      onError: () => {
        setIsSpeaking(false);
        setOrbState('idle');
      },
    });
  }, [character]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    setOrbState('idle');
  }, []);

  const sendTextMessage = useCallback(async (text: string) => {
    addMessage('user', text);
    setOrbState('thinking');

    try {
      const response = await geminiSendMessage(text);
      const assistantMsg = addMessage('assistant', response);
      speakMessage(response);
    } catch (error) {
      const errorMsg = "Oops, lost you for a sec. Say that again?";
      addMessage('assistant', errorMsg);
      speakMessage(errorMsg);
    }
  }, [addMessage, speakMessage]);

  const requestGreeting = useCallback(async (sportMode: SportMode) => {
    setOrbState('thinking');
    try {
      const greeting = await getGreeting(sportMode);
      addMessage('assistant', greeting);
      speakMessage(greeting);
    } catch {
      const fallback = "Let's do this! Ready when you are.";
      addMessage('assistant', fallback);
      speakMessage(fallback);
    }
  }, [addMessage, speakMessage]);

  const requestSummary = useCallback(async (stats: RunStats) => {
    setOrbState('thinking');
    try {
      const summary = await getRunSummary(stats);
      addMessage('assistant', summary);
      speakMessage(summary);
    } catch {
      const fallback = "Great run! You crushed it out there!";
      addMessage('assistant', fallback);
      speakMessage(fallback);
    }
  }, [addMessage, speakMessage]);

  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return {
    messages,
    orbState,
    isSpeaking,
    sendTextMessage,
    requestGreeting,
    requestSummary,
    speakMessage,
    stopSpeaking,
    latestMessage,
  };
}
