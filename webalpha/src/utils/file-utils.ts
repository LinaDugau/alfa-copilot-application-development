const MAX_FILE_TEXT = 10000

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let content = ''

    if (file.name.endsWith('.docx')) {
      const mammothResult = await import('mammoth/mammoth.browser.js')
      const result = await mammothResult.extractRawText({ arrayBuffer })
      content = result.value.trim()
    }
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(bytes, { type: 'array' })
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName]
        const csv = XLSX.utils.sheet_to_csv(sheet)
        content += csv + '\n\n'
      })
      content = content.trim()
    }
    else {
      content = new TextDecoder().decode(bytes)
    }

    if (content.length > MAX_FILE_TEXT) {
      content = content.slice(0, MAX_FILE_TEXT) + '\n\n[Текст обрезан: файл слишком длинный. Прикреплён фрагмент.]'
    }

    return content
  } catch (error) {
    console.error('Error extracting text:', error)
    return `[Не удалось извлечь текст из файла "${file.name}"]`
  }
}