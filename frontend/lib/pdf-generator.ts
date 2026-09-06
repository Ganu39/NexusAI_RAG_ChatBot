/**
 * NexusAI Zero-Dependency Client-Side PDF 1.4 Generator
 *
 * Generates a clean, print-friendly, multi-page vector PDF document
 * directly in the browser with 0 external dependencies and 0 backend requests.
 */

export interface ChatPdfSource {
  filename: string;
  page_number?: number | null;
  score: number;
  text_snippet?: string;
  chunk_id?: string;
}

export interface ChatPdfMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  userName?: string;
  feedback?: "great" | "bad";
  response?: {
    grounded?: boolean;
    retrieved_chunks?: number;
    sources?: ChatPdfSource[];
  };
}

export interface GenerateChatPdfOptions {
  messages: ChatPdfMessage[];
  userName?: string;
  title?: string;
  metadata?: {
    modelName?: string;
    indexInfo?: string;
    topK?: number;
  };
}

// PDF Constants (Standard A4 in points: 72 points/inch)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 48;
const MARGIN_RIGHT = 48;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 499.28 pt

// Escape text for PDF literal string
function escapePdfText(str: string): string {
  // Transliterate common unicode characters to safe ASCII
  const sanitized = str
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/\u2014/g, " -- ")      // em-dash
    .replace(/\u2013/g, " - ")       // en-dash
    .replace(/\u2026/g, "...")       // ellipsis
    .replace(/[\u2022\u25CF\u25E6]/g, "* ") // bullets
    .replace(/[\u2713\u2714]/g, "[OK]")     // checkmark
    .replace(/[\r\t]/g, " ")         // tabs/carriage returns
    .replace(/[^\x20-\x7E]/g, (char) => {
      // Safe fallback for unhandled unicode / emoji
      const code = char.charCodeAt(0);
      if (code === 160) return " ";
      return "";
    });

  // Escape PDF string delimiters
  return sanitized
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// Estimate character width for word wrapping
function estimateCharWidth(fontType: "/F1" | "/F2" | "/F3" | "/F4", fontSize: number): number {
  if (fontType === "/F3") {
    // Courier is strictly 0.6 * fontSize
    return 0.6 * fontSize;
  }
  if (fontType === "/F2") {
    // Helvetica-Bold is slightly wider
    return 0.54 * fontSize;
  }
  // Helvetica regular & oblique
  return 0.51 * fontSize;
}

// Wrap text to fit within a given width
function wrapText(
  text: string,
  maxWidth: number,
  fontType: "/F1" | "/F2" | "/F3" | "/F4",
  fontSize: number
): string[] {
  const charWidth = estimateCharWidth(fontType, fontSize);
  const maxCharsPerLine = Math.max(10, Math.floor(maxWidth / charWidth));

  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      if (!word) continue;

      // If a single word is longer than the whole line (e.g. huge URL), split it
      if (word.length > maxCharsPerLine) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          lines.push(word.slice(i, i + maxCharsPerLine));
        }
        continue;
      }

      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

class PdfDocumentBuilder {
  private pages: string[][] = [];
  private currentPageCommands: string[] = [];
  private currentY: number = PAGE_HEIGHT - MARGIN_TOP;
  private pageIndex: number = 0;

  constructor() {
    this.newPage(false);
  }

  public newPage(drawRunningHeader: boolean = true) {
    if (this.currentPageCommands.length > 0) {
      this.pages.push([...this.currentPageCommands]);
      this.currentPageCommands = [];
    }
    this.pageIndex++;
    this.currentY = PAGE_HEIGHT - MARGIN_TOP;

    if (drawRunningHeader && this.pageIndex > 1) {
      // Running top header for pages 2+
      const headerY = PAGE_HEIGHT - 32;
      this.currentPageCommands.push(
        `0.45 0.52 0.61 rg`, // Slate color
        `BT /F4 8 Tf ${MARGIN_LEFT} ${headerY} Td (${escapePdfText("NexusAI • RAG Knowledge Workspace — Conversation Export")}) Tj ET`,
        `0.88 0.91 0.94 RG 0.5 w`,
        `${MARGIN_LEFT} ${headerY - 6} m ${PAGE_WIDTH - MARGIN_RIGHT} ${headerY - 6} l S`
      );
      this.currentY = headerY - 22;
    }
  }

  public ensureSpace(neededHeight: number) {
    if (this.currentY - neededHeight < MARGIN_BOTTOM + 20) {
      this.newPage(true);
    }
  }

  public drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    fillColor?: [number, number, number],
    strokeColor?: [number, number, number],
    lineWidth: number = 0.5
  ) {
    const cmds: string[] = ["q"];
    if (fillColor) {
      cmds.push(`${fillColor[0].toFixed(3)} ${fillColor[1].toFixed(3)} ${fillColor[2].toFixed(3)} rg`);
    }
    if (strokeColor) {
      cmds.push(
        `${strokeColor[0].toFixed(3)} ${strokeColor[1].toFixed(3)} ${strokeColor[2].toFixed(3)} RG`,
        `${lineWidth} w`
      );
    }
    cmds.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fillColor && strokeColor) {
      cmds.push("B");
    } else if (fillColor) {
      cmds.push("f");
    } else if (strokeColor) {
      cmds.push("S");
    }
    cmds.push("Q");
    this.currentPageCommands.push(...cmds);
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeColor: [number, number, number] = [0.88, 0.91, 0.94],
    lineWidth: number = 0.5
  ) {
    this.currentPageCommands.push(
      `q`,
      `${strokeColor[0].toFixed(3)} ${strokeColor[1].toFixed(3)} ${strokeColor[2].toFixed(3)} RG`,
      `${lineWidth} w`,
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
      `Q`
    );
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    fontType: "/F1" | "/F2" | "/F3" | "/F4",
    fontSize: number,
    color: [number, number, number] = [0.1, 0.1, 0.1]
  ) {
    const escaped = escapePdfText(text);
    this.currentPageCommands.push(
      `q`,
      `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`,
      `BT ${fontType} ${fontSize} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`,
      `Q`
    );
  }

  public getCurrentY(): number {
    return this.currentY;
  }

  public subtractY(amount: number) {
    this.currentY -= amount;
  }

  public finish(): Uint8Array {
    if (this.currentPageCommands.length > 0) {
      this.pages.push([...this.currentPageCommands]);
      this.currentPageCommands = [];
    }

    const totalPages = this.pages.length;

    // Second pass: append running footers on all pages
    for (let i = 0; i < totalPages; i++) {
      const footerY = 28;
      const pageNumText = `Page ${i + 1} of ${totalPages}`;
      const pageCommands = this.pages[i];

      pageCommands.push(
        `0.88 0.91 0.94 RG 0.5 w`,
        `${MARGIN_LEFT} 38 m ${PAGE_WIDTH - MARGIN_RIGHT} 38 l S`,
        `0.55 0.60 0.68 rg`,
        `BT /F1 8 Tf ${MARGIN_LEFT} ${footerY} Td (${escapePdfText("NexusAI • RAG Chatbot Conversation Document")}) Tj ET`,
        `BT /F1 8 Tf ${PAGE_WIDTH - MARGIN_RIGHT - 65} ${footerY} Td (${escapePdfText(pageNumText)}) Tj ET`
      );
    }

    return this.serializePdf(totalPages);
  }

  private serializePdf(totalPages: number): Uint8Array {
    const objects: Record<number, string> = {};

    // 1: Catalog
    objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;

    // 2: Pages
    const kids = Array.from({ length: totalPages }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
    objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${totalPages} >>`;

    // Standard 14 Fonts (Universal, zero-download, built into all PDF viewers)
    objects[101] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[102] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;
    objects[103] = `<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>`;
    objects[104] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`;

    // Page objects & content streams
    for (let i = 0; i < totalPages; i++) {
      const pageObjId = 3 + i * 2;
      const contentObjId = 4 + i * 2;
      const streamData = this.pages[i].join("\n") + "\n";
      const streamBytes = new TextEncoder().encode(streamData);

      objects[pageObjId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 101 0 R /F2 102 0 R /F3 103 0 R /F4 104 0 R >> >> /Contents ${contentObjId} 0 R >>`;
      objects[contentObjId] = `<< /Length ${streamBytes.length} >>\nstream\n${streamData}endstream`;
    }

    let headerStr = "%PDF-1.4\n%NexusAI-RAG-Chatbot\n";
    let byteLength = new TextEncoder().encode(headerStr).length;

    const sortedIds = Object.keys(objects)
      .map(Number)
      .sort((a, b) => a - b);
    const maxObjId = Math.max(...sortedIds);
    const offsets: Record<number, number> = {};

    let bodyStr = "";
    for (const id of sortedIds) {
      offsets[id] = byteLength;
      const objBody = `${id} 0 obj\n${objects[id]}\nendobj\n`;
      bodyStr += objBody;
      byteLength += new TextEncoder().encode(objBody).length;
    }

    const xrefOffset = byteLength;
    let xrefStr = `xref\n0 ${maxObjId + 1}\n0000000000 65535 f \r\n`;

    for (let i = 1; i <= maxObjId; i++) {
      if (offsets[i] !== undefined) {
        xrefStr += `${String(offsets[i]).padStart(10, "0")} 00000 n \r\n`;
      } else {
        xrefStr += `0000000000 65535 f \r\n`;
      }
    }

    const trailerStr = `trailer\n<< /Size ${maxObjId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const fullPdfString = headerStr + bodyStr + xrefStr + trailerStr;
    return new TextEncoder().encode(fullPdfString);
  }
}

/**
 * Main export function: parses chat messages, formats with NexusAI branding,
 * and triggers a client-side file download.
 */
export function generateChatPdf(options: GenerateChatPdfOptions): boolean {
  try {
    const { messages, userName, metadata } = options;

    if (!messages || messages.length === 0) {
      return false;
    }

    const doc = new PdfDocumentBuilder();

    // ──────────────────────────────────────────────
    // 1. BRAND HEADER (Page 1)
    // ──────────────────────────────────────────────
    // Top indigo accent bar (h = 3.5pt)
    doc.drawRect(MARGIN_LEFT, doc.getCurrentY() - 3.5, CONTENT_WIDTH, 3.5, [0.31, 0.27, 0.90]);
    doc.subtractY(16);

    // Stylized "N" Monogram Badge
    const badgeSize = 26;
    const badgeY = doc.getCurrentY() - badgeSize;
    doc.drawRect(MARGIN_LEFT, badgeY, badgeSize, badgeSize, [0.31, 0.27, 0.90]);
    doc.drawText("N", MARGIN_LEFT + 7, badgeY + 6, "/F2", 15, [1.0, 1.0, 1.0]);

    // Header Title
    doc.drawText("NexusAI", MARGIN_LEFT + 34, badgeY + 12, "/F2", 16, [0.06, 0.09, 0.16]);
    doc.drawText("RAG KNOWLEDGE WORKSPACE • CHAT EXPORT", MARGIN_LEFT + 34, badgeY + 2, "/F2", 7.5, [0.38, 0.44, 0.52]);

    // Metadata Right Column
    const now = new Date();
    const exportDateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) + " " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const metaRightX = MARGIN_LEFT + CONTENT_WIDTH - 190;
    doc.drawText(`Exported: ${exportDateStr}`, metaRightX, badgeY + 14, "/F1", 8, [0.35, 0.40, 0.48]);
    doc.drawText(`Messages: ${messages.length} total in session`, metaRightX, badgeY + 4, "/F1", 8, [0.35, 0.40, 0.48]);

    const modelName = metadata?.modelName || "Gemini 2.5 Flash";
    const indexInfo = metadata?.indexInfo || "FAISS 3072d";
    doc.drawText(`Engine: ${modelName} • ${indexInfo}`, metaRightX, badgeY - 6, "/F2", 7.5, [0.31, 0.27, 0.90]);

    doc.subtractY(badgeSize + 14);

    // Separator rule
    doc.drawLine(MARGIN_LEFT, doc.getCurrentY(), MARGIN_LEFT + CONTENT_WIDTH, doc.getCurrentY(), [0.88, 0.91, 0.94], 0.75);
    doc.subtractY(16);

    // ──────────────────────────────────────────────
    // 2. CONVERSATION MESSAGES
    // ──────────────────────────────────────────────
    for (let mIdx = 0; mIdx < messages.length; mIdx++) {
      const msg = messages[mIdx];
      const isUser = msg.sender === "user";

      // Ensure space for message header + initial lines
      doc.ensureSpace(60);

      // --- Message Header ---
      const senderName = isUser ? (userName || "You") : "Nexus_Bot (AI Assistant)";
      const senderColor: [number, number, number] = isUser ? [0.26, 0.22, 0.79] : [0.06, 0.09, 0.16];

      // Sender badge icon / indicator
      const avatarBoxY = doc.getCurrentY() - 12;
      doc.drawRect(MARGIN_LEFT, avatarBoxY, 14, 14, isUser ? [0.93, 0.95, 1.0] : [0.95, 0.96, 0.98], senderColor, 0.5);
      doc.drawText(isUser ? "U" : "AI", MARGIN_LEFT + 2.5, avatarBoxY + 3.5, "/F2", 7.5, senderColor);

      // Sender label + timestamp
      doc.drawText(senderName, MARGIN_LEFT + 20, avatarBoxY + 3.5, "/F2", 10, senderColor);
      doc.drawText(msg.timestamp || "", MARGIN_LEFT + 150, avatarBoxY + 3.5, "/F1", 8, [0.55, 0.60, 0.68]);

      // Grounded badge for assistant messages
      if (!isUser && msg.response) {
        if (msg.response.grounded) {
          doc.drawText("[Grounded Answer]", MARGIN_LEFT + 205, avatarBoxY + 3.5, "/F2", 8, [0.02, 0.59, 0.41]);
        } else {
          doc.drawText("[Insufficient Context]", MARGIN_LEFT + 205, avatarBoxY + 3.5, "/F2", 8, [0.85, 0.55, 0.05]);
        }
      }

      doc.subtractY(20);

      // --- Message Content Parsing & Rendering ---
      const text = msg.text || "";
      const textX = MARGIN_LEFT + 20;
      const textWidth = CONTENT_WIDTH - 20;

      // Check if message has code blocks
      const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      const segments: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];

      while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          segments.push({ type: "text", content: text.substring(lastIndex, match.index) });
        }
        segments.push({ type: "code", content: match[2], lang: match[1] });
        lastIndex = codeBlockRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        segments.push({ type: "text", content: text.substring(lastIndex) });
      }

      for (const seg of segments) {
        if (seg.type === "code") {
          // Render code block
          const codeLines = seg.content.split("\n");
          const codeFontSize = 8;
          const codeLineHeight = 11;
          const blockPadding = 8;

          // Wrap long code lines
          const wrappedCodeLines: string[] = [];
          for (const rawLine of codeLines) {
            const wrapped = wrapText(rawLine, textWidth - blockPadding * 2, "/F3", codeFontSize);
            if (wrapped.length === 0) wrappedCodeLines.push("");
            else wrappedCodeLines.push(...wrapped);
          }

          const blockHeight = wrappedCodeLines.length * codeLineHeight + blockPadding * 2;

          doc.ensureSpace(Math.min(blockHeight, 80));

          // Draw code block background
          const boxY = doc.getCurrentY() - blockHeight;
          doc.drawRect(
            textX,
            boxY,
            textWidth,
            blockHeight,
            [0.96, 0.97, 0.98], // light gray
            [0.85, 0.88, 0.92], // subtle border
            0.5
          );

          // Left border accent
          doc.drawLine(textX, boxY, textX, boxY + blockHeight, [0.31, 0.27, 0.90], 2);

          let codeY = doc.getCurrentY() - blockPadding - 8;
          for (const line of wrappedCodeLines) {
            if (codeY < MARGIN_BOTTOM + 20) {
              doc.newPage(true);
              codeY = doc.getCurrentY() - 10;
            }
            if (line.trim()) {
              doc.drawText(line, textX + blockPadding + 4, codeY, "/F3", codeFontSize, [0.12, 0.16, 0.23]);
            }
            codeY -= codeLineHeight;
          }

          doc.subtractY(blockHeight + 8);
        } else {
          // Render normal text / markdown paragraphs
          const rawLines = seg.content.split("\n");

          for (const rawLine of rawLines) {
            const trimmed = rawLine.trim();
            if (!trimmed) {
              doc.subtractY(6);
              continue;
            }

            // Headers
            if (trimmed.startsWith("### ")) {
              doc.ensureSpace(18);
              const headerText = trimmed.replace(/^###\s+/, "");
              doc.drawText(headerText, textX, doc.getCurrentY() - 10, "/F2", 10.5, [0.06, 0.09, 0.16]);
              doc.subtractY(16);
            } else if (trimmed.startsWith("## ")) {
              doc.ensureSpace(22);
              const headerText = trimmed.replace(/^##\s+/, "");
              doc.drawText(headerText, textX, doc.getCurrentY() - 12, "/F2", 11.5, [0.06, 0.09, 0.16]);
              doc.subtractY(18);
            } else if (trimmed.startsWith("# ")) {
              doc.ensureSpace(26);
              const headerText = trimmed.replace(/^#\s+/, "");
              doc.drawText(headerText, textX, doc.getCurrentY() - 14, "/F2", 13, [0.06, 0.09, 0.16]);
              doc.subtractY(20);
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
              // Bullet item
              const bulletContent = trimmed.replace(/^[-*•]\s+/, "");
              const bulletLines = wrapText(bulletContent, textWidth - 14, "/F1", 9.5);

              doc.ensureSpace(bulletLines.length * 13 + 4);

              // Draw bullet dot
              doc.drawText("•", textX + 2, doc.getCurrentY() - 9.5, "/F2", 10, [0.31, 0.27, 0.90]);

              for (let bIdx = 0; bIdx < bulletLines.length; bIdx++) {
                doc.ensureSpace(13);
                doc.drawText(bulletLines[bIdx], textX + 12, doc.getCurrentY() - 9.5, "/F1", 9.5, [0.18, 0.24, 0.32]);
                doc.subtractY(13);
              }
              doc.subtractY(2);
            } else if (/^\d+\.\s+/.test(trimmed)) {
              // Numbered list item
              const numMatch = trimmed.match(/^(\d+\.)\s+(.*)/);
              const numPrefix = numMatch ? numMatch[1] : "1.";
              const numContent = numMatch ? numMatch[2] : trimmed;
              const numLines = wrapText(numContent, textWidth - 18, "/F1", 9.5);

              doc.ensureSpace(numLines.length * 13 + 4);

              doc.drawText(numPrefix, textX + 2, doc.getCurrentY() - 9.5, "/F2", 9, [0.31, 0.27, 0.90]);

              for (let nIdx = 0; nIdx < numLines.length; nIdx++) {
                doc.ensureSpace(13);
                doc.drawText(numLines[nIdx], textX + 16, doc.getCurrentY() - 9.5, "/F1", 9.5, [0.18, 0.24, 0.32]);
                doc.subtractY(13);
              }
              doc.subtractY(2);
            } else {
              // Regular paragraph
              const paraLines = wrapText(trimmed, textWidth, "/F1", 9.5);
              doc.ensureSpace(paraLines.length * 13 + 4);

              for (const line of paraLines) {
                doc.ensureSpace(13);
                doc.drawText(line, textX, doc.getCurrentY() - 9.5, "/F1", 9.5, [0.15, 0.20, 0.28]);
                doc.subtractY(13);
              }
              doc.subtractY(4);
            }
          }
        }
      }

      // --- Citations / Sources (if present on assistant message) ---
      if (!isUser && msg.response?.sources && msg.response.sources.length > 0) {
        doc.ensureSpace(35);
        doc.subtractY(4);

        // Sources header
        doc.drawText(
          `Connected Sources (${msg.response.sources.length} citations):`,
          textX,
          doc.getCurrentY() - 8,
          "/F2",
          8.5,
          [0.31, 0.27, 0.90]
        );
        doc.subtractY(14);

        for (const src of msg.response.sources) {
          doc.ensureSpace(22);
          const scorePercent = (src.score * 100).toFixed(1);
          const pageStr = src.page_number ? ` • Page ${src.page_number}` : "";
          const sourceHeader = `* ${src.filename}${pageStr} (${scorePercent}% Match)`;

          doc.drawText(sourceHeader, textX + 6, doc.getCurrentY() - 8, "/F2", 8, [0.20, 0.25, 0.33]);
          doc.subtractY(11);

          if (src.text_snippet) {
            const cleanSnippet = src.text_snippet.replace(/\s+/g, " ").trim();
            const snippetLines = wrapText(cleanSnippet, textWidth - 20, "/F4", 7.5).slice(0, 3);
            doc.ensureSpace(snippetLines.length * 10);

            for (const sLine of snippetLines) {
              doc.drawText(`"${sLine}"`, textX + 14, doc.getCurrentY() - 7.5, "/F4", 7.5, [0.45, 0.50, 0.58]);
              doc.subtractY(10);
            }
          }
          doc.subtractY(3);
        }
      }

      // Divider line between messages
      doc.subtractY(8);
      if (mIdx < messages.length - 1) {
        doc.ensureSpace(16);
        doc.drawLine(MARGIN_LEFT, doc.getCurrentY(), MARGIN_LEFT + CONTENT_WIDTH, doc.getCurrentY(), [0.92, 0.94, 0.96], 0.5);
        doc.subtractY(12);
      }
    }

    // ──────────────────────────────────────────────
    // 3. FINALIZE & DOWNLOAD BLOB
    // ──────────────────────────────────────────────
    const pdfBytes = doc.finish();

    // Create file blob
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Filename format: NexusAI_Chat_YYYY-MM-DD.pdf
    const dateStamp = now.toISOString().slice(0, 10);
    const fileName = `NexusAI_Chat_${dateStamp}.pdf`;

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = fileName;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up object URL after download trigger
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);

    return true;
  } catch (error) {
    console.error("Failed to generate chat PDF:", error);
    return false;
  }
}
