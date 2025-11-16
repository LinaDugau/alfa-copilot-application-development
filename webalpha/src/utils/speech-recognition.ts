export async function transcribeAudioWithWebSpeech(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Web Speech API доступен только на веб-платформе'))
        return
      }
  
      if (!('webkitSpeechRecognition' in (window as any)) && !('SpeechRecognition' in (window as any))) {
        reject(new Error('Speech Recognition API не поддерживается в этом браузере'))
        return
      }
  
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'ru-RU'
      recognition.continuous = false
      recognition.interimResults = false
  
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }
  
      recognition.onerror = (event: any) => {
        reject(new Error('Ошибка распознавания речи: ' + event.error))
      }
  
      recognition.onend = () => {
      }
  
      recognition.start()
    })
  }