import { useState, useEffect, useCallback } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseSpeechToTextReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  resetTranscript: () => void;
  error: string | null;
  isSupported: boolean;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Listen for speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      // Get the last result (most recent)
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.transcript) {
        setTranscript(lastResult.transcript);
      }
    }
  });

  // Listen for errors
  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    setError(event.error);
    setIsListening(false);
  });

  // Listen for end
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setError('Cần cấp quyền microphone để sử dụng tính năng này');
        return;
      }

      // Check if speech recognition is available
      const isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      if (!isAvailable) {
        setError('Thiết bị không hỗ trợ nhận dạng giọng nói');
        setIsSupported(false);
        return;
      }

      // Start listening
      setIsListening(true);
      setTranscript('');

      await ExpoSpeechRecognitionModule.start({
        lang: 'vi-VN', // Vietnamese
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Không thể bắt đầu nhận dạng giọng nói');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (err) {
      console.error('Failed to stop speech recognition:', err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported,
  };
};

export default useSpeechToText;
