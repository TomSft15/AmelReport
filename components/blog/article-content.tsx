interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div
      className="prose md:prose-lg max-w-none
        prose-headings:font-bold
        prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4
        prose-h2:text-3xl prose-h2:mt-6 prose-h2:mb-3
        prose-h3:text-2xl prose-h3:mt-4 prose-h3:mb-2
        prose-p:text-foreground prose-p:leading-7
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-semibold
        prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-muted prose-pre:border prose-pre:border-border
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:text-foreground prose-li:my-1
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
        prose-img:rounded-lg prose-img:shadow-md"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
