// Lightweight parser and helper for Markdown rendering and block editing

export interface MarkdownBlockItem {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'todo' | 'bullet' | 'numbered' | 'quote' | 'code' | 'callout' | 'divider' | 'table';
  text: string;
  checked?: boolean;
  codeLang?: string;
  tableRows?: string[][];
}

export function parseMarkdownToBlocks(markdown: string): MarkdownBlockItem[] {
  const lines = markdown.split('\n');
  const blocks: MarkdownBlockItem[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let inTable = false;
  let tableBuffer: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block detection
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({
          id: `b_${i}_code`,
          type: 'code',
          text: codeBuffer.join('\n'),
          codeLang: codeLang || 'typescript',
        });
        inCode = false;
        codeBuffer = [];
        codeLang = '';
        continue;
      } else {
        inCode = true;
        codeLang = line.trim().slice(3).trim();
        continue;
      }
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      // Skip separator row like |---|---|
      const isSep = cells.every((c) => /^:?-+:?$/.test(c));
      if (!isSep) {
        if (!inTable) {
          inTable = true;
          tableBuffer = [cells];
        } else {
          tableBuffer.push(cells);
        }
      }
      continue;
    } else if (inTable) {
      blocks.push({
        id: `b_${i}_table`,
        type: 'table',
        text: '',
        tableRows: tableBuffer,
      });
      inTable = false;
      tableBuffer = [];
    }

    // Dividers
    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push({
        id: `b_${i}_div`,
        type: 'divider',
        text: '',
      });
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({
        id: `b_${i}_h1`,
        type: 'h1',
        text: line.slice(2),
      });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({
        id: `b_${i}_h2`,
        type: 'h2',
        text: line.slice(3),
      });
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({
        id: `b_${i}_h3`,
        type: 'h3',
        text: line.slice(4),
      });
      continue;
    }

    // Todo item
    const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
    if (todoMatch) {
      blocks.push({
        id: `b_${i}_todo`,
        type: 'todo',
        checked: todoMatch[1].toLowerCase() === 'x',
        text: todoMatch[2],
      });
      continue;
    }

    // Bullet item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        id: `b_${i}_bullet`,
        type: 'bullet',
        text: line.slice(2),
      });
      continue;
    }

    // Numbered item
    const numMatch = line.match(/^\d+\.\s*(.*)$/);
    if (numMatch) {
      blocks.push({
        id: `b_${i}_num`,
        type: 'numbered',
        text: numMatch[1],
      });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({
        id: `b_${i}_quote`,
        type: 'quote',
        text: line.slice(2),
      });
      continue;
    }

    // Callout (e.g. 💡 or 📌)
    if (line.startsWith(':::callout') || line.startsWith('📌 ') || line.startsWith('💡 ')) {
      blocks.push({
        id: `b_${i}_callout`,
        type: 'callout',
        text: line.replace(':::callout', '').trim(),
      });
      continue;
    }

    // Standard paragraph or empty spacer
    blocks.push({
      id: `b_${i}_p`,
      type: 'paragraph',
      text: line,
    });
  }

  // Flush table if open at end
  if (inTable && tableBuffer.length > 0) {
    blocks.push({
      id: `b_table_end`,
      type: 'table',
      text: '',
      tableRows: tableBuffer,
    });
  }

  return blocks;
}

export function formatInlineMarkdown(text: string): string {
  // Bold **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code `code`
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-200/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
  );
  return formatted;
}
