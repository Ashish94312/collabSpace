// components/LatexRenderer.js
import { useEffect } from 'react';
import katex from 'katex';

const renderLatex = (container) => {
  if (!container) return;
  const nodes = container.querySelectorAll('.latex-block');
  nodes.forEach((node) => {
    try {
      katex.render(node.textContent, node, {
        throwOnError: false,
        displayMode: node.classList.contains('display'),
      });
    } catch (err) {
      console.error('KaTeX render error:', err);
    }
  });
};

export default function LatexRenderer({ contentRef }) {
  useEffect(() => {
    renderLatex(contentRef.current);
  }, [contentRef.current?.innerHTML]);

  return null;
}
