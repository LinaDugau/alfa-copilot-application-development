const LLM_API_URL = import.meta.env.VITE_LLM_API_URL
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'meta-llama-3.1-8b-instruct'

export async function askLLM(messages: any[]): Promise<string> {
  if (!LLM_API_URL) {
    console.error('LLM_API_URL is not set. Please set VITE_LLM_API_URL in your environment variables.')
    return 'Ошибка: URL API не настроен. Проверьте настройки.'
  }

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.6,
        stream: false,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('LLM HTTP Error:', response.status, text)
      return 'Ошибка: HTTP ' + response.status + '. Проверьте LM Studio.'
    }

    const json = await response.json()

    if (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) {
      return json.choices[0].message.content.trim()
    }

    if (json.output_text) {
      return json.output_text.trim()
    }

    console.error('LLM Unexpected Response:', json)
    return 'Ошибка: неожиданный формат ответа от LM Studio.'
  } catch (error) {
    console.error('LLM error:', error)
    return 'Ошибка: не удалось связаться с ИИ. Проверьте LM Studio.'
  }
}

export async function askLLMStream(messages: any[], onChunk: (chunk: string) => void): Promise<string> {
  if (!LLM_API_URL) {
    console.error('LLM_API_URL is not set. Please set VITE_LLM_API_URL in your environment variables.')
    return Promise.reject(new Error('URL API не настроен. Проверьте настройки.'))
  }

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.6,
        stream: true,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('LLM HTTP Error:', response.status, text)
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          continue
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6) 
            const json = JSON.parse(jsonStr)
            const content = json.choices?.[0]?.delta?.content || ''
            if (content) {
              fullText += content
              onChunk(content)
            }
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', trimmedLine, e)
          }
        }
      }
    }

    if (buffer.trim()) {
      const trimmedLine = buffer.trim()
      if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
        try {
          const jsonStr = trimmedLine.slice(6)
          const json = JSON.parse(jsonStr)
          const content = json.choices?.[0]?.delta?.content || ''
          if (content) {
            fullText += content
            onChunk(content)
          }
        } catch (e) {
        }
      }
    }

    return fullText.trim()
  } catch (error) {
    console.error('Stream error:', error)
    throw error instanceof Error ? error : new Error('Stream error')
  }
}