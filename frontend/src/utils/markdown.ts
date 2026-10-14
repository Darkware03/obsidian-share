import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const md = new MarkdownIt({
  html: false, // Disallow arbitrary HTML in markdown for safety
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        return `<pre class="hljs"><div class="code-header"><span class="lang">${lang}</span><button class="copy-btn" data-code="${encodeURIComponent(str)}">Copiar</button></div><code class="hljs">${highlighted}</code></pre>`;
      } catch (__) {}
    }
    // Default fallback
    // We cannot use md.utils inside the constructor if it's not fully initialized yet.
    // Instead we can use a basic escape or markdown-it's utils from the module.
    const escapeHtml = (s: string) => s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
    const escaped = escapeHtml(str);
    return `<pre class="hljs"><div class="code-header"><span class="lang"></span><button class="copy-btn" data-code="${encodeURIComponent(str)}">Copiar</button></div><code class="hljs">${escaped}</code></pre>`;
  }
});

// Configure linkify to only allow http and https
md.linkify.set({ fuzzyEmail: false, fuzzyLink: false });

// Safely render markdown
export function renderMarkdown(content: string): string {
  const rawHtml = md.render(content || '');
  
  // Sanitize generated HTML using DOMPurify
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span', 'button'
    ],
    ALLOWED_ATTR: ['href', 'name', 'target', 'src', 'alt', 'class'],
    ALLOW_DATA_ATTR: true, // We need data-code for copy functionality
  });

  // Modify links to open in new tab and have rel="noopener noreferrer"
  // Note: DOMPurify allows modifying tree after sanitization via hooks,
  // but it's simpler to do a quick pass if needed.
  // Actually, DOMPurify has an 'afterSanitizeAttributes' hook.
  
  return cleanHtml;
}

// Add hooks to DOMPurify for external links
DOMPurify.addHook('afterSanitizeAttributes', (node: any) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    const href = node.getAttribute('href');
    if (href && href.startsWith('http')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }
});
