function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(text: string) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function renderMarkdown(source: string | null) {
  if (!source) {
    return "";
  }

  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    listItems = [];
  }

  function flushCode() {
    if (!inCode) return;
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    inCode = false;
    codeLines = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      html.push("<hr />");
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const segmentHeading = /^\[(\d{3})\]\s+(#{1,6})\s+(.*)$/.exec(line);
    if (segmentHeading) {
      flushParagraph();
      flushList();
      const level = segmentHeading[2].length;
      html.push(
        `<h${level} class="ol-segment-heading"><span class="ol-segment-id">[${segmentHeading[1]}]</span>${renderInline(segmentHeading[3])}</h${level}>`
      );
      continue;
    }

    const segmentLine = /^\[(\d{3})\]\s+(.*)$/.exec(line);
    if (segmentLine) {
      flushParagraph();
      flushList();
      html.push(
        `<p class="ol-segment-line"><span class="ol-segment-id">[${segmentLine[1]}]</span>${renderInline(segmentLine[2])}</p>`
      );
      continue;
    }

    const footnote = /^\[\^([^\]]+)\]:\s*(.*)$/.exec(line);
    if (footnote) {
      flushParagraph();
      flushList();
      html.push(
        `<p class="ol-footnote-line"><span class="ol-footnote-id">[^${escapeHtml(footnote[1])}]</span>${renderInline(footnote[2])}</p>`
      );
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      html.push(`<blockquote><p>${renderInline(quote[1])}</p></blockquote>`);
      continue;
    }

    const list = /^[-*]\s+(.*)$/.exec(line);
    if (list) {
      flushParagraph();
      listItems.push(list[1]);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushCode();

  return html.join("\n");
}
