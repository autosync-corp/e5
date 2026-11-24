const DROP_WITH_CONTENT = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'link',
  'meta',
  'base',
  'style',
  'noscript',
  'svg',
  'math',
  'textarea',
  'input',
  'button',
  'select',
  'option',
  'video',
  'audio',
  'canvas',
]);

const VOID_TAGS = new Set(['br', 'img', 'hr', 'source', 'col', 'wbr']);

const STRICT_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'a',
  'ul',
  'ol',
  'li',
  'img',
  'br',
  'blockquote',
  'code',
  'pre',
  'hr',
  'figure',
  'figcaption',
]);

const PRESERVE_TAGS = new Set([
  ...STRICT_TAGS,
  'div',
  'span',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'nav',
  'aside',
  'picture',
  'source',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'col',
  'colgroup',
  'h5',
  'h6',
  'small',
  'sub',
  'sup',
  'u',
  's',
  'mark',
  'abbr',
  'cite',
  'q',
  'dl',
  'dt',
  'dd',
]);

const PRESERVE_ATTR = new Set([
  'href',
  'src',
  'alt',
  'title',
  'class',
  'id',
  'width',
  'height',
  'style',
  'rel',
  'target',
  'datetime',
  'colspan',
  'rowspan',
  'role',
  'aria-hidden',
  'aria-label',
  'loading',
  'decoding',
  'sizes',
  'srcset',
  'itemprop',
  'itemscope',
  'itemtype',
]);

export type SanitizeMode = 'strict' | 'preserve';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decode entities and drop WordPress's trailing [&hellip;] / [...] marker. Public pages keep the raw excerpt. */
export function cleanEditorExcerpt(raw: string): string {
  return decodeEntities(stripTags(raw || ''))
    .replace(/\s*\[\s*(?:\u2026|\.{3}|hellip)\s*\]\s*$/iu, '')
    .trim();
}

export function decodeEntities(html: string): string {
  return html
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#8217;|&rsquo;/gi, '\u2019')
    .replace(/&#8216;|&lsquo;/gi, '\u2018')
    .replace(/&#8220;|&ldquo;/gi, '\u201c')
    .replace(/&#8221;|&rdquo;/gi, '\u201d')
    .replace(/&#8211;|&ndash;/gi, '\u2013')
    .replace(/&#8212;|&mdash;/gi, '\u2014')
    .replace(/&hellip;|&#8230;/gi, '\u2026')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function isAllowedHref(href: string): boolean {
  const value = href.trim();
  if (!value) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (value.startsWith('#') && !value.startsWith('#javascript')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:' || url.protocol === 'tel:';
  } catch {
    return false;
  }
}

export function isAllowedImageSrc(src: string): boolean {
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'www.e5wheels.com' || host === 'e5wheels.com') return true;
    if (host === 'post.e5wheels.com') return true;
    if (host.endsWith('.public.blob.vercel-storage.com') || host.endsWith('.blob.vercel-storage.com')) return true;
    return false;
  } catch {
    return false;
  }
}

function parseAttrs(raw: string): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  const re = /([:@]?[a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    out.push({ name: match[1], value: match[2] ?? match[3] ?? match[4] ?? '' });
  }
  return out;
}

function sanitizeStyle(value: string): string | null {
  const lower = value.toLowerCase();
  if (lower.includes('javascript') || lower.includes('expression') || lower.includes('url(')) return null;
  return value.slice(0, 2000);
}

function sanitizeAttrs(tag: string, raw: string, mode: SanitizeMode): string {
  const parts: string[] = [];
  for (const { name, value } of parseAttrs(raw)) {
    const key = name.toLowerCase();
    if (key.startsWith('on')) continue;
    if (key.startsWith('xmlns')) continue;
    if (key.includes(':') && !key.startsWith('data-') && !key.startsWith('aria-') && !key.startsWith('item')) continue;
    if (mode === 'strict') {
      if (tag === 'a' && key === 'href' && isAllowedHref(value)) {
        parts.push(`href="${escapeHtml(value.trim())}"`);
      } else if (tag === 'img' && key === 'src' && isAllowedImageSrc(value)) {
        parts.push(`src="${escapeHtml(value.trim())}"`);
      } else if (tag === 'img' && key === 'alt') {
        parts.push(`alt="${escapeHtml(value.slice(0, 160))}"`);
      }
      continue;
    }
    if (key.startsWith('data-') || key.startsWith('aria-') || PRESERVE_ATTR.has(key)) {
      if (key === 'href') {
        if (!isAllowedHref(value)) continue;
        parts.push(`href="${escapeHtml(value.trim())}"`);
        continue;
      }
      if (key === 'src' || key === 'srcset') {
        if (key === 'src' && !isAllowedImageSrc(value)) continue;
        if (key === 'srcset') {
          const ok = value.split(',').every((part) => {
            const url = part.trim().split(/\s+/)[0] || '';
            return !url || isAllowedImageSrc(url);
          });
          if (!ok) continue;
        }
        parts.push(`${key}="${escapeHtml(value.trim())}"`);
        continue;
      }
      if (key === 'style') {
        const safe = sanitizeStyle(value);
        if (!safe) continue;
        parts.push(`style="${escapeHtml(safe)}"`);
        continue;
      }
      if (key === 'target' && value !== '_blank') continue;
      parts.push(`${key}="${escapeHtml(value)}"`);
    }
  }
  if (tag === 'a' && parts.some((p) => p.startsWith('href=')) && parts.some((p) => p.startsWith('target='))) {
    if (!parts.some((p) => p.startsWith('rel='))) parts.push('rel="noopener noreferrer"');
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

export function sanitizeHtml(html: string, mode: SanitizeMode = 'strict'): string {
  if (!html) return '';
  const allowed = mode === 'strict' ? STRICT_TAGS : PRESERVE_TAGS;
  let input = html.replace(/\u0000/g, '').replace(/<!--[\s\S]*?-->/g, '');
  let out = '';
  let i = 0;
  const skipUntil: string[] = [];

  while (i < input.length) {
    const lt = input.indexOf('<', i);
    if (lt === -1) {
      out += input.slice(i);
      break;
    }
    if (skipUntil.length === 0) out += input.slice(i, lt);
    else {
      /* dropped content */
    }

    const rest = input.slice(lt);
    const comment = rest.match(/^<!\[CDATA\[[\s\S]*?\]\]>/);
    if (comment) {
      i = lt + comment[0].length;
      continue;
    }
    const tagMatch = rest.match(/^<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/);
    if (!tagMatch) {
      if (skipUntil.length === 0) out += '&lt;';
      i = lt + 1;
      continue;
    }

    const full = tagMatch[0];
    const name = tagMatch[1].toLowerCase();
    const closing = full.startsWith('</');
    const selfClosing = VOID_TAGS.has(name) || /\/\s*>$/.test(full);
    i = lt + full.length;

    if (skipUntil.length) {
      const waiting = skipUntil[skipUntil.length - 1];
      if (closing && name === waiting) skipUntil.pop();
      else if (!closing && name === waiting && !selfClosing) skipUntil.push(name);
      continue;
    }

    if (DROP_WITH_CONTENT.has(name)) {
      if (!closing && !selfClosing) skipUntil.push(name);
      continue;
    }

    if (!allowed.has(name)) continue;
    if (closing) {
      out += `</${name}>`;
      continue;
    }
    const attrs = sanitizeAttrs(name, tagMatch[2] || '', mode);
    if (name === 'img' && !/\ssrc=/.test(attrs)) continue;
    if (name === 'a' && !/\shref=/.test(attrs) && !selfClosing) {
      /* keep contents, drop the wrapper later by emitting no open tag? keep as span-less: emit nothing, contents still flow */
      continue;
    }
    out += `<${name}${attrs}${selfClosing || VOID_TAGS.has(name) ? '' : ''}>`;
    if (VOID_TAGS.has(name) || selfClosing) {
      if (out.endsWith('>')) {
        /* void */
      }
    }
  }

  return out;
}

function inlineMarkdown(text: string): string {
  let t = escapeHtml(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, url) => {
    return `<img src="${url}" alt="${alt}">`;
  });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, label, url) => {
    return `<a href="${url}">${label}</a>`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^\*])\*([^*]+)\*/g, '$1<em>$2</em>');
  return t;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inlineMarkdown(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    out.push(`</${list}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const ul = line.match(/^[-*]\s+(.+)$/);
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMarkdown(heading[2].trim())}</h${level}>`);
      continue;
    }
    if (ul) {
      flushPara();
      if (list !== 'ul') {
        flushList();
        out.push('<ul>');
        list = 'ul';
      }
      out.push(`<li>${inlineMarkdown(ul[1])}</li>`);
      continue;
    }
    if (ol) {
      flushPara();
      if (list !== 'ol') {
        flushList();
        out.push('<ol>');
        list = 'ol';
      }
      out.push(`<li>${inlineMarkdown(ol[1])}</li>`);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return out.join('\n');
}

export function renderMarkdown(markdown: string): string {
  return sanitizeHtml(markdownToHtml(markdown), 'strict');
}
