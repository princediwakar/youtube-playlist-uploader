function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const KEYWORD_LINKS = [
  { regex: /\b(title generat(?:ion|or)s?)\b/gi, url: '/tools/title-generator' },
  { regex: /\b(description generat(?:ion|or)s?)\b/gi, url: '/tools/description-generator' },
  { regex: /\b(tag generat(?:ion|or)s?)\b/gi, url: '/tools/tag-generator' },
  { regex: /\b(idea generat(?:ion|or)s?)\b/gi, url: '/tools/idea-generator' },
  { regex: /\b(gaming|gamers?)\b/gi, url: '/use-cases/bulk-upload-gaming-videos' },
  { regex: /\b(podcast(?:ers?)?)\b/gi, url: '/use-cases/bulk-upload-for-podcasters' },
]

function autoLinkText(text: string): string {
  // We want to avoid replacing text inside existing markdown links [text](url) or code blocks `code`
  // A simple way is to tokenize by existing links and code blocks, and only replace in plain text parts.
  
  // Regex to match markdown links or code blocks
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  const parts = text.split(tokenRegex);
  
  for (let i = 0; i < parts.length; i++) {
    // Even indices are plain text, odd indices are matched tokens
    if (i % 2 === 0) {
      let part = parts[i];
      for (const { regex, url } of KEYWORD_LINKS) {
        // Only replace the first occurrence in the part to avoid over-linking, or replace all?
        // Usually replacing all is fine, but we replace with a markdown link.
        // Wait, if a keyword is "gaming", and we replace with `[gaming](/use-cases/...)`, 
        // we must make sure we don't recursively replace it again if the regex matches.
        // But since we only run each regex once, it's fine.
        // However, if one regex matches a word that gets put into a link, and a subsequent regex matches something inside that new link?
        // Our KEYWORD_LINKS are distinct enough, but to be safe, we can build the tokens dynamically.
        part = part.replace(regex, (match) => `[${match}](${url})`);
      }
      parts[i] = part;
    }
  }
  
  return parts.join('');
}

function inlineToHtml(text: string): string {
  // First, apply our automated internal linking
  const autoLinkedText = autoLinkText(text);

  return escapeHtml(autoLinkedText)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-yt-red hover:underline">$1</a>',
    )
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const blocks: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(`<h3 class="heading-md mt-10 mb-4">${inlineToHtml(line.slice(4))}</h3>`)
      i++
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push(`<h2 class="heading-lg mt-12 mb-4">${inlineToHtml(line.slice(3))}</h2>`)
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        `<blockquote class="border-l-4 border-yt-red pl-4 italic text-slate my-6">${inlineToHtml(quoteLines.join('\n'))}</blockquote>`,
      )
      continue
    }

    if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(`<li>${inlineToHtml(lines[i].slice(2))}</li>`)
        i++
      }
      blocks.push(`<ul class="list-disc pl-6 space-y-2 my-4">${listItems.join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(`<li>${inlineToHtml(lines[i].replace(/^\d+\.\s/, ''))}</li>`)
        i++
      }
      blocks.push(`<ol class="list-decimal pl-6 space-y-2 my-4">${listItems.join('')}</ol>`)
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push(
        `<pre class="bg-charcoal text-pearl rounded-lg p-4 overflow-x-auto my-6 text-sm"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`,
      )
      continue
    }

    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '') {
      paraLines.push(lines[i])
      i++
    }
    blocks.push(`<p class="body-lg mb-4 leading-relaxed">${inlineToHtml(paraLines.join(' '))}</p>`)
  }

  return blocks.join('\n')
}
