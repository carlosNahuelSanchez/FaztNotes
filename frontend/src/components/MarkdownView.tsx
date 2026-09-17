import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content || '') as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`markdown-preview text-nexo-200 text-sm overflow-y-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
