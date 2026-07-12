import React from 'react';

/**
 * Renderizador de um subconjunto seguro de Markdown para o chat: títulos,
 * listas, negrito, itálico, código inline, blocos de código e links http(s).
 * Constrói nós React (nunca injeta HTML), então não há superfície de XSS.
 */

const INLINE_RE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const key = `${keyBase}-${i++}`;
    if (t.startsWith('`')) {
      out.push(
        <code key={key} className="rounded bg-void/70 px-1 py-0.5 font-mono text-[12px] text-pulse">
          {t.slice(1, -1)}
        </code>,
      );
    } else if (t.startsWith('**')) {
      out.push(<strong key={key}>{t.slice(2, -2)}</strong>);
    } else if (t.startsWith('[')) {
      const mm = LINK_RE.exec(t)!;
      out.push(
        <a key={key} href={mm[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline">
          {mm[1]}
        </a>,
      );
    } else {
      out.push(<em key={key}>{t.slice(1, -1)}</em>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function textBlock(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lines = text.split('\n');
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let k = 0;

  const flushPara = () => {
    if (!para.length) return;
    out.push(
      <p key={`${keyBase}-p${k++}`} className="my-1 first:mt-0 last:mb-0">
        {para.map((ln, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {inline(ln, `${keyBase}-p${k}l${j}`)}
          </React.Fragment>
        ))}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    out.push(
      <Tag key={`${keyBase}-l${k++}`} className={`my-1 space-y-0.5 pl-4 ${list.ordered ? 'list-decimal' : 'list-disc'}`}>
        {list.items.map((it, j) => (
          <li key={j}>{inline(it, `${keyBase}-l${k}i${j}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const head = /^\s*#{1,4}\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((ul || ol)![1]);
    } else if (head) {
      flushPara();
      flushList();
      out.push(
        <p key={`${keyBase}-h${k++}`} className="mb-1 mt-2 font-semibold first:mt-0">
          {inline(head[1], `${keyBase}-h${k}`)}
        </p>,
      );
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out;
}

export function Markdown({ text }: { text: string }) {
  // separa blocos de código cercados; o split com grupos intercala [txt, lang, código, txt, ...]
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const mod = i % 3;
    if (mod === 0) {
      if (parts[i]) out.push(...textBlock(parts[i], `t${i}`));
    } else if (mod === 2) {
      out.push(
        <pre
          key={`c${i}`}
          className="my-1.5 overflow-x-auto rounded-lg border border-border bg-void/70 p-2.5 font-mono text-[11.5px] leading-relaxed"
        >
          <code>{parts[i]}</code>
        </pre>,
      );
    }
  }
  return <div className="break-words">{out}</div>;
}
