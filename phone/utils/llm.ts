import Constants from "expo-constants";

const { LLM_API_URL, LLM_MODEL } = Constants.expoConfig.extra;

export async function askLLM(messages: any[]): Promise<string> {
  try {
    const response = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 4096,
        temperature: 0.6,
        stream: false,  
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("LLM HTTP Error:", response.status, text);
      return "Ошибка: HTTP " + response.status + ". Проверьте LM Studio.";
    }

    const json = await response.json();

    if (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) {
      return json.choices[0].message.content.trim();
    }

    if (json.output_text) {
      return json.output_text.trim();
    }

    console.error("LLM Unexpected Response:", json);
    return "Ошибка: неожиданный формат ответа от LM Studio.";
  } catch (error) {
    console.error("LLM error:", error);
    return "Ошибка: не удалось связаться с ИИ. Проверьте LM Studio (IP: 192.168.31.211:1234, модель загружена?).";
  }
}

export async function askLLMStream(
  messages: any[],
  onChunk: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      let fullText = "";
      let lastProcessedLength = 0;
      let partialLine = "";

      xhr.open("POST", LLM_API_URL, true);
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onprogress = () => {
        if (xhr.readyState === XMLHttpRequest.LOADING) {
          const newData = xhr.responseText.slice(lastProcessedLength);
          lastProcessedLength = xhr.responseText.length;

          if (newData) {
            const lines = (partialLine + newData).split("\n");
            partialLine = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") {
                  continue;
                }

                if (data) {
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || "";
                    if (content) {
                      fullText += content;
                      onChunk(content);
                    }
                  } catch (e) {
                  }
                }
              }
            }
          }
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (partialLine) {
            const lines = partialLine.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data && data !== "[DONE]") {
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || "";
                    if (content) {
                      fullText += content;
                      onChunk(content);
                    }
                  } catch (e) {
                  }
                }
              }
            }
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(fullText.trim());
          } else {
            console.error("LLM HTTP Error:", xhr.status, xhr.responseText);
            reject(new Error("Ошибка: HTTP " + xhr.status + ". Проверьте LM Studio."));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Ошибка: не удалось связаться с ИИ. Проверьте LM Studio."));
      };

      xhr.ontimeout = () => {
        reject(new Error("Ошибка: таймаут запроса к LM Studio."));
      };

      xhr.timeout = 120000;

      xhr.send(
        JSON.stringify({
          model: LLM_MODEL,
          messages,
          max_tokens: 4096,
          temperature: 0.4,
          stream: true,
        })
      );
    } catch (error: any) {
      console.error("LLM stream error:", error);
      reject(error);
    }
  });
}