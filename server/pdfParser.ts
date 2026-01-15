// Use dynamic import to avoid loading pdfjs-dist in test environment
let pdfjsLib: any = null;

async function getPdfjsLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Set up the worker for Node.js environment
    if (typeof window === 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }
  return pdfjsLib;
}

export interface ParsedVocabulary {
  word: string;
  meaning: string;
}

/**
 * Parse PDF file and extract vocabulary items in the format "word: meaning" or "word\tmeaning"
 * @param pdfBuffer - Buffer containing PDF file data
 * @returns Array of parsed vocabulary items
 */
export async function parsePdfVocabulary(pdfBuffer: Buffer): Promise<ParsedVocabulary[]> {
  try {
    const pdfjsLib = await getPdfjsLib();
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Split text into lines and parse each line
    const lines = fullText.split(/\r?\n/).filter((line: string) => line.trim() !== "");
    const vocabularyItems: ParsedVocabulary[] = [];

    lines.forEach((line: string) => {
      let parts: string[] = [];

      // Try different separators: tab, colon, comma
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(":")) {
        parts = line.split(":");
      } else if (line.includes(",")) {
        parts = line.split(",");
      } else {
        // Try to split by first space
        const firstSpaceIndex = line.indexOf(" ");
        if (firstSpaceIndex !== -1) {
          parts = [
            line.substring(0, firstSpaceIndex),
            line.substring(firstSpaceIndex + 1),
          ];
        } else {
          parts = [line];
        }
      }

      // Only add if we have both word and meaning
      if (parts.length >= 2) {
        const word = parts[0].trim();
        const meaning = parts.slice(1).join(" ").trim();

        if (word && meaning) {
          vocabularyItems.push({
            word,
            meaning,
          });
        }
      }
    });

    return vocabularyItems;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF file. Please ensure it contains valid text.");
  }
}
