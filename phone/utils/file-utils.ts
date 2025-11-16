import * as FileSystem from 'expo-file-system/legacy';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const MAX_FILE_TEXT = 10000;

export async function extractTextFromFile(
  uri: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryString = atob(fileContent);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let content = '';

    if (mimeType.includes('word') || fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
      content = result.value.trim();
    }
    else if (
      mimeType.includes('spreadsheet') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      const workbook = XLSX.read(bytes.buffer, { type: 'array' });
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        content += csv + '\n\n';
      });
      content = content.trim();
    }
    else {
      content = new TextDecoder().decode(bytes);
    }

    if (content.length > MAX_FILE_TEXT) {
      content =
        content.slice(0, MAX_FILE_TEXT) +
        '\n\n[Текст обрезан: файл слишком длинный. Прикреплён фрагмент.]';
    }

    return content;
  } catch (error) {
    console.error('Error extracting text:', error);
    return `[Не удалось извлечь текст из файла "${fileName}"]`;
  }
}