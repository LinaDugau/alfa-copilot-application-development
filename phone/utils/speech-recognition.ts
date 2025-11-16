import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export async function transcribeAudioWithWebSpeech(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web') {
      reject(new Error('Web Speech API доступен только на веб-платформе'));
      return;
    }

    const windowObj = typeof window !== 'undefined' ? window : (global as any).window;
    
    if (!windowObj || (!('webkitSpeechRecognition' in windowObj) && !('SpeechRecognition' in windowObj))) {
      reject(new Error('Speech Recognition API не поддерживается в этом браузере'));
      return;
    }

    const SpeechRecognition = (windowObj as any).SpeechRecognition || (windowObj as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      reject(new Error('Ошибка распознавания речи: ' + event.error));
    };

    recognition.onend = () => {
    };

    recognition.start();
  });
}

export async function audioToBase64(audioUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error reading audio file:', error);
    throw error;
  }
}

export async function transcribeWithGoogleAPI(
  audioUri: string,
  apiKey?: string
): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error('API ключ не предоставлен');
    }

    const audioData = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'ru-RU',
          },
          audio: {
            content: audioData,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    if (result.results && result.results.length > 0) {
      return result.results[0].alternatives[0].transcript;
    }

    throw new Error('Не удалось распознать речь');
  } catch (error: any) {
    console.error('Google Speech API error:', error);
    throw error;
  }
}