function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineToHtml(text: string): string {
  return escapeHtml(text)
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
