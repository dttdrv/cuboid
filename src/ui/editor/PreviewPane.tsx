import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
    content: string;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ content }) => {
    return (
        <div className="prose prose-sm max-w-none h-full bg-white text-black font-serif">
            <ReactMarkdown
                children={content}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4 mt-6 border-b pb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
                }}
            />
        </div>
    );
};

export default PreviewPane;
