import ReactMarkdown from 'react-markdown';

type MarkdownContentProps = {
  content: string | undefined | null;
  className?: string;
  maxLines?: number;
};

/**
 * Renders content as Markdown if it contains Markdown syntax, otherwise renders as plain text.
 * This allows backward compatibility with plain text descriptions while supporting Markdown.
 */
export function MarkdownContent({ content, className = '', maxLines }: MarkdownContentProps) {
  if (!content) {
    return null;
  }

  // Check if content contains Markdown syntax
  const hasMarkdownSyntax = /[#*_`\[\]()]/.test(content) || 
                            content.includes('\n\n') || 
                            content.includes('**') || 
                            content.includes('*') ||
                            content.includes('`') ||
                            content.includes('#') ||
                            content.includes('- ') ||
                            content.includes('[');

  // Determine line clamp class based on maxLines
  const getLineClampClass = () => {
    if (!maxLines) return '';
    if (maxLines === 1) return 'line-clamp-1';
    if (maxLines === 2) return 'line-clamp-2';
    if (maxLines === 3) return 'line-clamp-3';
    return '';
  };

  const lineClampClass = getLineClampClass();

  if (hasMarkdownSyntax) {
    return (
      <div className={`prose prose-sm max-w-none ${className} ${lineClampClass}`}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-semibold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold mb-1">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="ml-2">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>,
            a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Plain text - render as-is with proper line breaks
  return (
    <div className={`${className} ${lineClampClass}`}>
      {content.split('\n').map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line || '\u00A0'}
        </p>
      ))}
    </div>
  );
}

