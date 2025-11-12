import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import useEditor, { EditorCanvas } from '../components/Editor';
import EditorToolbar from '../components/EditorToolbar';
import InviteUser from './Invite';
import ThemeToggle from '../components/ThemeToggle';
import { debounce } from 'lodash';
import { getPageSize } from '../utils/pageSizes';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';

import './EditorPage.css';

export default function EditorPage() {
  const { docId } = useParams();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFormats, setActiveFormats] = useState([]);
  const [pageSize, setPageSize] = useState('a4');
  const [headerEnabled, setHeaderEnabled] = useState(
    localStorage.getItem(`doc:${docId}:headerEnabled`) === 'true'
  );
  const [footerEnabled, setFooterEnabled] = useState(
    localStorage.getItem(`doc:${docId}:footerEnabled`) === 'true'
  );

  const [headerHTML, setHeaderHTML] = useState(
    localStorage.getItem(`doc:${docId}:headerHTML`) || ''
  );
  const [footerHTML, setFooterHTML] = useState(
    localStorage.getItem(`doc:${docId}:footerHTML`) || ''
  );

  const [headerHeight] = useState(72);
  const [footerHeight] = useState(56);

  const toggleHeader = () => {
    const next = !headerEnabled;
    setHeaderEnabled(next);
    localStorage.setItem(`doc:${docId}:headerEnabled`, String(next));
  };
  const toggleFooter = () => {
    const next = !footerEnabled;
    setFooterEnabled(next);
    localStorage.setItem(`doc:${docId}:footerEnabled`, String(next));
  };

  const handleHeaderInput = (html) => {
    setHeaderHTML(html);
    localStorage.setItem(`doc:${docId}:headerHTML`, html);
  };
  const handleFooterInput = (html) => {
    setFooterHTML(html);
    localStorage.setItem(`doc:${docId}:footerHTML`, html);
  };
  const updateActiveFormats = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let node = selection.anchorNode;
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    const formats = new Set();
    while (node && node !== document.body) {
      const tag = node.tagName?.toLowerCase();
      if (tag === 'b' || tag === 'strong') formats.add('bold');
      if (tag === 'i' || tag === 'em') formats.add('italic');
      if (tag === 'u') formats.add('underline');
      if (tag === 's' || tag === 'strike') formats.add('strikeThrough');
      if (tag === 'sub') formats.add('subscript');
      if (tag === 'sup') formats.add('superscript');
      if (['h1', 'h2', 'h3'].includes(tag)) formats.add(tag);
      if (tag === 'ul') formats.add('insertUnorderedList');
      if (tag === 'ol') formats.add('insertOrderedList');
      if (tag === 'pre') formats.add('pre');
      

      const style = node.style;
      if (style && style.textDecoration && style.textDecoration.includes('line-through')) {
        formats.add('strikeThrough');
      }
      
      node = node.parentNode;
    }
    setActiveFormats(Array.from(formats));
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);

    localStorage.setItem('preferredPageSize', newSize);
  };


  useEffect(() => {
    const savedPageSize = localStorage.getItem('preferredPageSize');
    if (savedPageSize && getPageSize(savedPageSize)) {
      setPageSize(savedPageSize);
    }
  }, []);

  const navigate = useNavigate();

  const {
    pages,
    currentPageIndex,
    switchPage,
    format,
    undo,
    redo,
    addPage,
    deletePage,
    editorRef,
    handleInput,
    insertImage,
    handleImageUpload,
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleEditorClick,
    columns,
    setColumns,
  } = useEditor(docId);


  const normalizeCodeElement = useMemo(() => (codeElement) => {
    if (!codeElement) return;
    
    let allText = '';
    const walker = document.createTreeWalker(
      codeElement,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let textNode;
    while ((textNode = walker.nextNode())) {
      allText += textNode.textContent;
    }
    
    while (codeElement.firstChild) {
      codeElement.removeChild(codeElement.firstChild);
    }
    
    if (allText || codeElement.childNodes.length === 0) {
      const textNode = document.createTextNode(allText);
      codeElement.appendChild(textNode);
    }
  }, []);

  const debouncedNormalizeCodeBlocks = useMemo(
    () => debounce(() => {
      if (!editorRef.current) return;
      
      const codeBlocks = editorRef.current.querySelectorAll('pre code');
      codeBlocks.forEach(codeElement => {
        const textNodes = [];
        const walker = document.createTreeWalker(
          codeElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let node;
        while ((node = walker.nextNode())) {
          textNodes.push(node);
        }
        
        if (textNodes.length > 1 || codeElement.children.length > 0) {
          normalizeCodeElement(codeElement);
        }
      });
    }, 300),
    [normalizeCodeElement]
  );

  useEffect(() => {

    const getTextOffsetInCode = (codeElement, container, containerOffset) => {
      try {
        const range = document.createRange();
        range.setStart(codeElement, 0);
        
        if (container.nodeType === Node.TEXT_NODE) {
          range.setEnd(container, Math.min(containerOffset, container.textContent.length));
        } else {
          const childCount = container.childNodes.length;
          const safeOffset = Math.min(containerOffset, childCount);
          range.setEnd(container, safeOffset);
        }
        
        return range.toString().length;
      } catch (error) {
        let offset = 0;
        const walker = document.createTreeWalker(
          codeElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let node;
        while ((node = walker.nextNode())) {
          if (node === container || container.contains(node)) {
            if (node === container && container.nodeType === Node.TEXT_NODE) {
              return offset + Math.min(containerOffset, container.textContent.length);
            }
            if (container.contains(node) && node !== container) {
              offset += node.textContent.length;
            }
          } else if (node.textContent) {
            offset += node.textContent.length;
          }
        }
        return offset;
      }
    };

    const findTextNodeAtOffset = (codeElement, targetOffset) => {
      let currentOffset = 0;
      const walker = document.createTreeWalker(
        codeElement,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while ((node = walker.nextNode())) {
        const nodeLength = node.textContent.length;
        if (currentOffset + nodeLength >= targetOffset) {
          return {
            node,
            offset: targetOffset - currentOffset
          };
        }
        currentOffset += nodeLength;
      }
      
      if (codeElement.lastChild && codeElement.lastChild.nodeType === Node.TEXT_NODE) {
        return {
          node: codeElement.lastChild,
          offset: codeElement.lastChild.textContent.length
        };
      }
      
      const newNode = document.createTextNode('');
      codeElement.appendChild(newNode);
      return { node: newNode, offset: 0 };
    };

    const handlePasteInCodeBlock = (e) => {
      if (!e.clipboardData) return;
      
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let node = range.startContainer;
      
      let pre = null;
      let codeElement = null;
      
      while (node && node !== document.body) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'PRE') {
            pre = node;
            codeElement = pre.querySelector('code');
            if (codeElement) break;
          }
          if (node.tagName === 'CODE') {
            const parentPre = node.closest('pre');
            if (parentPre) {
              pre = parentPre;
              codeElement = node;
              break;
            }
          }
        }
        node = node.parentNode;
      }
      
      if (!pre || !codeElement) {
        node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          let parent = node.parentNode;
          while (parent && parent !== document.body) {
            if (parent.tagName === 'CODE') {
              const parentPre = parent.closest('pre');
              if (parentPre) {
                pre = parentPre;
                codeElement = parent;
                break;
              }
            }
            parent = parent.parentNode;
          }
        }
      }

      if (!pre || !codeElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (items) {
        for (let item of items) {
          if (item.type.startsWith('image/')) {
            return;
          }
        }
      }

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      let text = e.clipboardData.getData('text/plain');
      
      if (!text) {
        const html = e.clipboardData.getData('text/html');
        if (html) {
          const temp = document.createElement('div');
          temp.innerHTML = html;
          text = temp.textContent || temp.innerText || '';
        }
      }
      
      if (!text) {
        return;
      }

      try {
        const startOffset = getTextOffsetInCode(codeElement, range.startContainer, range.startOffset);
        const endOffset = range.collapsed ? startOffset : getTextOffsetInCode(codeElement, range.endContainer, range.endOffset);
        
        normalizeCodeElement(codeElement);
        
        let targetNode = null;
        if (codeElement.firstChild && codeElement.firstChild.nodeType === Node.TEXT_NODE) {
          targetNode = codeElement.firstChild;
        } else {
          targetNode = document.createTextNode('');
          codeElement.appendChild(targetNode);
        }
        
        const currentText = targetNode.textContent || '';
        
        const beforeText = currentText.slice(0, Math.min(startOffset, currentText.length));
        const afterText = currentText.slice(Math.min(endOffset, currentText.length));
        targetNode.textContent = beforeText + text + afterText;

        const newRange = document.createRange();
        const newOffset = beforeText.length + text.length;
        newRange.setStart(targetNode, newOffset);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        if (editorRef.current) {
          const inputEvent = new Event('input', { bubbles: true });
          editorRef.current.dispatchEvent(inputEvent);
        }
      } catch (error) {
        console.warn('Code block paste error, using fallback:', error);
        normalizeCodeElement(codeElement);
        
        if (codeElement.firstChild && codeElement.firstChild.nodeType === Node.TEXT_NODE) {
          codeElement.firstChild.textContent += text;
          const newRange = document.createRange();
          newRange.setStart(codeElement.firstChild, codeElement.firstChild.textContent.length);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } else {
          const textNode = document.createTextNode(text);
          codeElement.appendChild(textNode);
          const newRange = document.createRange();
          newRange.setStart(textNode, text.length);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        if (editorRef.current) {
          const inputEvent = new Event('input', { bubbles: true });
          editorRef.current.dispatchEvent(inputEvent);
        }
      }
    };


    const handleInputForCodeBlocks = (e) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      let node = range.startContainer;
      
      while (node && node !== document.body) {
        if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'PRE' || node.tagName === 'CODE')) {
          if (node.tagName === 'CODE' && node.closest('pre')) {
            debouncedNormalizeCodeBlocks();
            break;
          }
        }
        node = node.parentNode;
      }
    };

    if (editorRef.current) {
      editorRef.current.addEventListener('selectionchange', updateActiveFormats);
      editorRef.current.addEventListener('keyup', updateActiveFormats);
      editorRef.current.addEventListener('input', handleInputForCodeBlocks);
      editorRef.current.addEventListener('paste', handlePasteInCodeBlock, true);
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('selectionchange', updateActiveFormats);
        editorRef.current.removeEventListener('keyup', updateActiveFormats);
        editorRef.current.removeEventListener('input', handleInputForCodeBlocks);
        editorRef.current.removeEventListener('paste', handlePasteInCodeBlock, true);
      }
    };
  }, [editorRef]);

  const saveTitle = async (newTitle) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/documents/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      console.log('✅ Title auto-saved:', newTitle);
    } catch (err) {
      console.error('🚨 Auto-save failed:', err);
    }
  };

  const debouncedSaveTitle = useRef(
    debounce((newTitle) => saveTitle(newTitle), 800)
  ).current;

  const insertCodeBlock = (language = 'plain') => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    let range;
    
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      editor.focus();
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      range = selection.getRangeAt(0);
    }

    const pre = document.createElement('pre');
    pre.className = `code-block language-${language}`;
    pre.setAttribute('data-language', language);
    pre.style.cssText = `
      position: relative;
      margin: 16px 0;
    `;
    
    const code = document.createElement('code');
    code.className = `language-${language}`;
    
    const textNode = document.createTextNode('');
    code.appendChild(textNode);
    
    pre.appendChild(code);
    
    range.deleteContents();
    range.insertNode(pre);
    
    if (pre.previousSibling && pre.previousSibling.nodeType === Node.TEXT_NODE) {
      const prevText = pre.previousSibling.textContent;
      if (prevText && !prevText.endsWith('\n')) {
        pre.previousSibling.textContent = prevText + '\n';
      }
    }
    
    const newRange = document.createRange();
    newRange.setStart(textNode, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    editor.focus();
    
    const hint = document.createElement('div');
    hint.textContent = '💡 Tip: Press Ctrl+Enter or Shift+Enter to exit code block';
    hint.style.cssText = `
      position: absolute;
      top: -28px;
      left: 0;
      font-size: 11px;
      color: #666;
      background: rgba(255, 255, 255, 0.9);
      padding: 4px 8px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 100;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    pre.style.position = 'relative';
    pre.appendChild(hint);
    
    setTimeout(() => {
      if (hint.parentNode) {
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.3s';
        setTimeout(() => hint.remove(), 300);
      }
    }, 3000);
  };

  const convertToInlineCode = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;

    const codeElement = document.createElement('code');
    codeElement.textContent = selectedText;
    codeElement.style.cssText = `
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      font-size: 14px;
      background-color: #f1f3f4;
      padding: 2px 6px;
      border-radius: 4px;
      color: #d73a49;
      border: 1px solid #e1e4e8;
    `;
    
    range.deleteContents();
    range.insertNode(codeElement);
    selection.removeAllRanges();
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
  
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        while (node && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'PRE') {
            e.preventDefault();
            
            const newParagraph = document.createElement('p');
            const br = document.createElement('br');
            newParagraph.appendChild(br);
            
            if (node.nextSibling) {
              node.parentNode.insertBefore(newParagraph, node.nextSibling);
            } else {
              node.parentNode.appendChild(newParagraph);
            }
  
            const newRange = document.createRange();
            newRange.setStart(newParagraph, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            editorRef.current?.focus();
            return;
          }
          node = node.parentNode;
        }
      }
      
      if (e.key === 'Tab') {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        while (node && node !== document.body) {
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'PRE') {
            e.preventDefault();
            
            const tab = e.shiftKey ? '' : '  ';
            if (tab) {
              document.execCommand('insertText', false, tab);
            }
            return;
          }
          node = node.parentNode;
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/documents`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const docs = await res.json();
        const doc = docs.find(d => d.id === docId);

        if (!doc) {
          alert('No document found. Please create or select one.');
          return;
        }

        setTitle(doc.title);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch document:', err);
      }
    };

    fetchTitle();
  }, [docId]);

  const handleEditorFocus = () => {
    console.log('🔧 Editor focused');
    document.addEventListener('selectionchange', updateActiveFormats);
    updateActiveFormats();
  };
  const handleEditorBlur = () => {
    console.log('🔧 Editor blurred');
    document.removeEventListener('selectionchange', updateActiveFormats);
    setActiveFormats([]);
  };
  const handleEditorMouseUp = () => {
    updateActiveFormats();
  };
  const handleEditorKeyUp = () => {
    updateActiveFormats();
  };
  const formatAndUpdate = (command, value = null) => {
    format(command, value);
    if (editorRef.current) editorRef.current.focus();
    setTimeout(updateActiveFormats, 10);
  };

  const clearAllFormatting = () => {
    format('removeFormat');
    format('formatBlock', 'p');
    format('insertOrderedList');
    format('insertUnorderedList');
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      
      let pre = node;
      while (pre && pre !== document.body) {
        if (pre.nodeType === Node.ELEMENT_NODE && pre.tagName === 'PRE') {
          break;
        }
        pre = pre.parentNode;
      }
      
      if (pre && pre.tagName === 'PRE') {
        const codeElement = pre.querySelector('code');
        const textContent = codeElement ? codeElement.textContent : pre.textContent;
        
        const p = document.createElement('p');
        p.textContent = textContent;
        
        pre.parentNode.replaceChild(p, pre);
        
        const newRange = document.createRange();
        newRange.selectNodeContents(p);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    if (editorRef.current) editorRef.current.focus();
    setTimeout(updateActiveFormats, 0);
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const originalContent = editorRef.current?.innerHTML || '';
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const pageContainer = document.querySelector('.editor-page');
        if (!pageContainer) continue;
        
        const tempContainer = pageContainer.cloneNode(true);
        tempContainer.style.visibility = 'visible';
        tempContainer.style.display = 'block';
        
        if (headerEnabled && tempContainer.querySelector('.page-header')) {
          const header = tempContainer.querySelector('.page-header');
          header.innerHTML = headerHTML || '';
        }
        
        const pageBody = tempContainer.querySelector('.page-body');
        if (pageBody) {
          const currentContent = pages[i]?.content || '';
          pageBody.innerHTML = currentContent;
        }
        
        if (footerEnabled && tempContainer.querySelector('.page-footer')) {
          const footer = tempContainer.querySelector('.page-footer');
          footer.innerHTML = footerHTML || '';
        }
        
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0px';
        tempContainer.style.width = '210mm';
        tempContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempContainer);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: tempContainer.offsetWidth,
          height: tempContainer.offsetHeight
        });
        
        document.body.removeChild(tempContainer);
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight > pageHeight) {
          const ratio = pageHeight / imgHeight;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, pageHeight);
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }
      }
      
      if (editorRef.current && originalContent) {
        editorRef.current.innerHTML = originalContent;
      }
      
      pdf.save(`${title || 'document'}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const exportToDOC = async () => {
    try {
      const paragraphs = [];
      
      for (let i = 0; i < pages.length; i++) {
        const pageContent = pages[i]?.content || '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pageContent;
        
        const processNode = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
              return new TextRun(text);
            }
            return null;
          }
          
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const children = Array.from(node.childNodes)
              .map(processNode)
              .filter(Boolean);
            
            if (children.length === 0) return null;
            
            if (tagName === 'p') {
              return new Paragraph({
                children: children
              });
            } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
              return new Paragraph({
                heading: tagName.toUpperCase(),
                children: children
              });
            } else if (tagName === 'strong' || tagName === 'b') {
              return children.map(child => 
                child instanceof TextRun 
                  ? new TextRun({ text: child.text, bold: true })
                  : child
              );
            } else if (tagName === 'em' || tagName === 'i') {
              return children.map(child =>
                child instanceof TextRun
                  ? new TextRun({ text: child.text, italics: true })
                  : child
              );
            } else if (tagName === 'u') {
              return children.map(child =>
                child instanceof TextRun
                  ? new TextRun({ text: child.text, underline: {} })
                  : child
              );
            } else if (tagName === 'br') {
              return new Paragraph({ children: [] });
            } else {
              return children;
            }
          }
          
          return null;
        };
        
        const processedNodes = Array.from(tempDiv.childNodes)
          .map(processNode)
          .filter(Boolean)
          .flat();
        
        if (processedNodes.length > 0) {
          processedNodes.forEach(node => {
            if (node instanceof Paragraph) {
              paragraphs.push(node);
            } else if (Array.isArray(node)) {
              node.forEach(n => {
                if (n instanceof Paragraph) {
                  paragraphs.push(n);
                } else {
                  paragraphs.push(new Paragraph({ children: [n] }));
                }
              });
            } else {
              paragraphs.push(new Paragraph({ children: [node] }));
            }
          });
        } else {
          paragraphs.push(new Paragraph({ children: [] }));
        }
        
        if (i < pages.length - 1) {
          paragraphs.push(new Paragraph({ children: [] }));
        }
      }
      
      if (paragraphs.length === 0) {
        paragraphs.push(new Paragraph({ children: [new TextRun('')] }));
      }
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'document'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to DOC:', error);
      alert('Failed to export DOC. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="editor-container">
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="editor-header-left">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <input
            className="editor-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setTitle(newTitle);
              debouncedSaveTitle(newTitle);
            }}
            placeholder="Untitled Document"
          />
        </div>
        <div className="editor-header-right">
          <ThemeToggle />
          <InviteUser documentId={docId} />
        </div>
      </header>

      <div className="floating-toolbar-container">
        <EditorToolbar
          format={formatAndUpdate}
          undo={undo}
          redo={redo}
          addPage={addPage}
          insertCodeBlock={insertCodeBlock}
          activeFormats={activeFormats}
          clearFormatting={clearAllFormatting}
          pages={pages}
          currentPageIndex={currentPageIndex}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          updateActiveFormats={updateActiveFormats}
          handleImageUpload={handleImageUpload}
          insertImage={insertImage}
          convertToInlineCode={convertToInlineCode}
          columns={columns}
          onChangeColumns={setColumns}
          headerEnabled={headerEnabled}
          footerEnabled={footerEnabled}
          onToggleHeader={toggleHeader}
          onToggleFooter={toggleFooter}
          exportToPDF={exportToPDF}
          exportToDOC={exportToDOC}
        />
      </div>

      

      <main className="editor-main">
        <EditorCanvas
          pages={pages}
          currentPageIndex={currentPageIndex}
          switchPage={switchPage}
          editorRef={editorRef}
          handleInput={handleInput}
          handleFocus={handleEditorFocus}
          handleBlur={handleEditorBlur}
          handleMouseUp={handleEditorMouseUp}
          handleKeyUp={handleEditorKeyUp}
          pageSize={pageSize}
          deletePage={deletePage}
          handlePaste={handlePaste}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleEditorClick={handleEditorClick}
          columns={columns}
          headerEnabled={headerEnabled}
          footerEnabled={footerEnabled}
          headerHTML={headerHTML}
          footerHTML={footerHTML}
          onHeaderInput={handleHeaderInput}
          onFooterInput={handleFooterInput}
          headerHeight={headerHeight}
          footerHeight={footerHeight}
        />
      </main>
    </div>
  );
}
