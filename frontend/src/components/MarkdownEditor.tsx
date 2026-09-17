import React, { useRef, useEffect, useMemo } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escriba contenido en formato Markdown...',
  maxLength
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => value.split('\n'), [value]);
  const lineCount = Math.max(lines.length, 1);

  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  useEffect(() => {
    handleScroll();
  }, [value]);

  // Syntax highlighting renderer
  const highlightedTokens = useMemo(() => {
    let inCodeBlock = false;

    return lines.map((line, lineIdx) => {
      const isLast = lineIdx === lines.length - 1;

      // Handle code block fences ```
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return (
          <div key={lineIdx} className="text-amber-400 font-bold min-h-[1.5rem]">
            {line || '\u00A0'}
          </div>
        );
      }

      if (inCodeBlock) {
        return (
          <div key={lineIdx} className="text-amber-200/80 min-h-[1.5rem]">
            {line || '\u00A0'}
          </div>
        );
      }

      // Headers: #, ##, ###
      const headerMatch = line.match(/^(#{1,6})(\s+)(.*)$/);
      if (headerMatch) {
        const [, hashes, spaces, rest] = headerMatch;
        return (
          <div key={lineIdx} className="min-h-[1.5rem]">
            <span className="text-emerald-400 font-bold">{hashes}</span>
            <span>{spaces}</span>
            <span className="text-emerald-300 font-bold">{rest}</span>
          </div>
        );
      }

      // Blockquotes >
      const quoteMatch = line.match(/^(\s*>\s*)(.*)$/);
      if (quoteMatch) {
        const [, marker, rest] = quoteMatch;
        return (
          <div key={lineIdx} className="min-h-[1.5rem]">
            <span className="text-emerald-500 font-bold">{marker}</span>
            <span className="text-zinc-400 italic">{rest}</span>
          </div>
        );
      }

      // Unordered lists: - item, * item
      const listMatch = line.match(/^(\s*[-*+]\s+)(.*)$/);
      if (listMatch) {
        const [, marker, rest] = listMatch;
        return (
          <div key={lineIdx} className="min-h-[1.5rem]">
            <span className="text-emerald-400 font-bold">{marker}</span>
            <span>{renderInlineStyles(rest)}</span>
          </div>
        );
      }

      // Ordered lists: 1. item
      const numListMatch = line.match(/^(\s*\d+\.\s+)(.*)$/);
      if (numListMatch) {
        const [, marker, rest] = numListMatch;
        return (
          <div key={lineIdx} className="min-h-[1.5rem]">
            <span className="text-emerald-400 font-bold">{marker}</span>
            <span>{renderInlineStyles(rest)}</span>
          </div>
        );
      }

      // Normal line with inline highlights
      return (
        <div key={lineIdx} className="text-zinc-200 min-h-[1.5rem]">
          {line ? renderInlineStyles(line) : (isLast ? '\u00A0' : '\u00A0')}
        </div>
      );
    });
  }, [lines]);

  return (
    <div className="relative flex-1 flex h-full overflow-hidden bg-nexo-950 font-mono text-xs">
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        className="w-12 shrink-0 py-3 pr-2 text-right text-zinc-600 bg-nexo-900 border-r border-nexo-850 select-none overflow-hidden font-mono text-xs leading-[1.5rem]"
      >
        {Array.from({ length: lineCount }).map((_, i) => (
          <div key={i} className="min-h-[1.5rem]">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Syntax highlight display layer */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-3 overflow-hidden pointer-events-none whitespace-pre font-mono text-xs leading-[1.5rem] select-none"
        >
          {highlightedTokens}
        </div>

        {/* Real typing textarea layer */}
        <textarea
          ref={textareaRef}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-emerald-400 font-mono text-xs leading-[1.5rem] whitespace-pre resize-none focus:outline-none selection:bg-emerald-950 selection:text-white"
        />
      </div>
    </div>
  );
};

// Helper for inline syntax rendering (bold, code, links)
function renderInlineStyles(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <span key={match.index} className="text-amber-300 bg-zinc-850 px-1 border border-zinc-700">
          {token}
        </span>
      );
    } else if (token.startsWith('**')) {
      parts.push(
        <span key={match.index} className="text-white font-bold">
          {token}
        </span>
      );
    } else if (token.startsWith('*')) {
      parts.push(
        <span key={match.index} className="text-zinc-300 italic">
          {token}
        </span>
      );
    } else if (token.startsWith('[')) {
      parts.push(
        <span key={match.index} className="text-cyan-400 underline">
          {token}
        </span>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
