import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import useEditor, { EditorCanvas } from '../components/Editor'
import EditorToolbar from '../components/EditorToolbar'
import InviteUser from './Invite'
import { debounce } from 'lodash'
import { getPageSize } from '../utils/pageSizes'
import PageList from '../components/PageList'
import useEditor, { EditorCanvas } from '../components/Editor';
import EditorToolbar from '../components/EditorToolbar';
import InviteUser from './Invite';
import ThemeToggle from '../components/ThemeToggle';
import { debounce } from 'lodash';
import { getPageSize } from '../utils/pageSizes';

import './EditorPage.css'

export default function EditorPage() {
  const { docId } = useParams()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeFormats, setActiveFormats] = useState([])
  const [pageSize, setPageSize] = useState('a4')
  const [isReordering, setIsReordering] = useState(false)
  const [reorderToast, setReorderToast] = useState(null)

  const updateActiveFormats = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    let node = selection.anchorNode
    if (!node) return
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode
    }

    const formats = new Set()
    while (node && node !== document.body) {
      const tag = node.tagName?.toLowerCase()
      if (tag === 'b' || tag === 'strong') formats.add('bold')
      if (tag === 'i' || tag === 'em') formats.add('italic')
      if (tag === 'u') formats.add('underline')
      if (tag === 's' || tag === 'strike') formats.add('strikeThrough')
      if (tag === 'sub') formats.add('subscript')
      if (tag === 'sup') formats.add('superscript')
      if (['h1', 'h2', 'h3'].includes(tag)) formats.add(tag)
      if (tag === 'ul') formats.add('insertUnorderedList')
      if (tag === 'ol') formats.add('insertOrderedList')
      if (tag === 'pre') formats.add('pre')

      const style = node.style
      if (
        style &&
        style.textDecoration &&
        style.textDecoration.includes('line-through')
      ) {
        formats.add('strikeThrough')
      }

      node = node.parentNode
    }
    setActiveFormats(Array.from(formats))
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)

    localStorage.setItem('preferredPageSize', newSize)
  }

  useEffect(() => {
    const savedPageSize = localStorage.getItem('preferredPageSize')
    if (savedPageSize && getPageSize(savedPageSize)) {
      setPageSize(savedPageSize)
    }
  }, [])

  const navigate = useNavigate()

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
    updatePagesOrder,
    reorderPages,
  } = useEditor(docId)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener('selectionchange', updateActiveFormats)
      editorRef.current.addEventListener('keyup', updateActiveFormats)
      editorRef.current.addEventListener('applySyntaxHighlighting', (e) => {
        const { language, codeBlock } = e.detail
        let highlightedCode = codeBlock.textContent

        switch (language) {
          case 'javascript':
            highlightedCode = highlightJavaScript(codeBlock.textContent)
            break
          case 'python':
            highlightedCode = highlightPython(codeBlock.textContent)
            break
          case 'html':
            highlightedCode = highlightHTML(codeBlock.textContent)
            break
          case 'css':
            highlightedCode = highlightCSS(codeBlock.textContent)
            break
          case 'react':
            highlightedCode = highlightReact(codeBlock.textContent)
            break
          case 'sql':
            highlightedCode = highlightSQL(codeBlock.textContent)
            break
          default:
            // For unknown languages, just escape HTML
            highlightedCode = codeBlock.textContent.replace(
              /[<>&]/g,
              (match) => {
                switch (match) {
                  case '<':
                    return '&lt;'
                  case '>':
                    return '&gt;'
                  case '&':
                    return '&amp;'
                  default:
                    return match
                }
              }
            )
        }

        codeBlock.innerHTML = highlightedCode
      })
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener(
          'selectionchange',
          updateActiveFormats
        )
        editorRef.current.removeEventListener('keyup', updateActiveFormats)
        editorRef.current.removeEventListener(
          'applySyntaxHighlighting',
          () => {}
        )
      }
    }
  }, [editorRef])

  const saveTitle = async (newTitle) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3000/api/documents/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      console.log('✅ Title auto-saved:', newTitle)
    } catch (err) {
      console.error('🚨 Auto-save failed:', err)
    }
  }

  const debouncedSaveTitle = useRef(
    debounce((newTitle) => saveTitle(newTitle), 800)
  ).current

  const formatCodeBlock = () => {
    const codeHTML = `<pre><code>function example() {
  console.log("Hello World");
  return true;
}

// This is a multiline comment
const result = example();
console.log(result);</code></pre>`
    document.execCommand('insertHTML', false, codeHTML)
    editorRef.current?.focus()
  }

  const insertMultilineCode = (language = 'javascript') => {
    // Create a template based on the selected language
    let codeTemplate = ''
    switch (language) {
      case 'javascript':
        codeTemplate = `function example() {
  console.log("Hello World");
  return true;
}

// This is a multiline comment
const result = example();
console.log(result);`
        break
      case 'python':
        codeTemplate = `def example():
    print("Hello World")
    return True

# This is a multiline comment
result = example()
print(result)`
        break
      case 'react':
        codeTemplate = `import React, { useState, useEffect } from 'react';

function ExampleComponent() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Component mounted');
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default ExampleComponent;`
        break
      case 'html':
        codeTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is an example HTML page.</p>
</body>
</html>`
        break
      case 'css':
        codeTemplate = `/* Example CSS styles */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.button:hover {
    background-color: #0056b3;
}`
        break
      case 'sql':
        codeTemplate = `-- Example SQL queries
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.active = true
GROUP BY u.id, u.name, u.email
HAVING COUNT(p.id) > 0
ORDER BY post_count DESC;`
        break
      case 'plain':
        codeTemplate = `// Plain text code block
// Add your code here
// No specific language template`
        break
      default:
        codeTemplate = `// Code block
// Add your code here`
    }

    const codeHTML = `<pre data-language="${language}"><code class="language-${language}">${codeTemplate}</code></pre>`

    const editor = editorRef.current
    if (!editor) {
      console.error('❌ Editor ref is null')
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      console.log('⚠️ No selection found, inserting at end of editor')
      // If no selection, focus the editor and create a selection at the end
      editor.focus()
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    const range = selection.getRangeAt(0)
    console.log('🔧 Inserting code block at selection:', range)

    // Create the code block element
    const temp = document.createElement('div')
    temp.innerHTML = codeHTML
    const pre = temp.firstChild
    const code = pre.querySelector('code')

    console.log('🔧 Created code block:', pre)
    console.log('🔧 Code element:', code)

    // Insert the code block at the caret
    range.deleteContents()
    range.insertNode(pre)
    console.log('🔧 Code block inserted into DOM')

    // Ensure the code element has proper content for editing
    if (!code.textContent.trim()) {
      code.textContent = '\n' // Add a newline so cursor can be positioned
    }

    // Move caret inside the code block, at the end
    selection.removeAllRanges()
    const newRange = document.createRange()

    // Ensure the code element has a text node for cursor positioning
    if (!code.firstChild || code.firstChild.nodeType !== Node.TEXT_NODE) {
      code.textContent = '\n'
    }

    if (code.childNodes.length > 0 && code.lastChild.nodeType === 3) {
      newRange.setStart(code.lastChild, code.lastChild.length)
    } else {
      newRange.selectNodeContents(code)
      newRange.collapse(false)
    }
    selection.addRange(newRange)

    // Focus editor and apply syntax highlighting
    editor.focus()

    // Apply syntax highlighting after a short delay to ensure DOM is updated
    setTimeout(() => {
      applySyntaxHighlighting()
    }, 10)

    // Add a small help text to the code block
    const helpText = document.createElement('div')
    helpText.style.cssText = `
      position: absolute;
      top: 8px;
      left: 12px;
      font-size: 11px;
      color: #858585;
      background: rgba(45, 45, 45, 0.8);
      padding: 2px 6px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 10;
    `
    helpText.textContent = 'Ctrl+Enter or Shift+Enter to exit'
    pre.style.position = 'relative'
    pre.appendChild(helpText)

    // Remove help text after 3 seconds
    setTimeout(() => {
      if (helpText.parentNode) {
        helpText.remove()
      }
    }, 3000)
  }

  const applySyntaxHighlighting = () => {
    const codeBlocks = editorRef.current?.querySelectorAll('pre code')
    if (!codeBlocks) return

    codeBlocks.forEach((codeBlock) => {
      const language = codeBlock.className.replace('language-', '')
      const code = codeBlock.textContent

      // If code is empty or just whitespace, don't apply highlighting
      if (!code.trim()) {
        // Ensure empty code blocks still have a text node for cursor positioning
        if (
          !codeBlock.firstChild ||
          codeBlock.firstChild.nodeType !== Node.TEXT_NODE
        ) {
          codeBlock.textContent = '\n'
        }
        return
      }

      let highlightedCode = code

      switch (language) {
        case 'javascript':
          highlightedCode = highlightJavaScript(code)
          break
        case 'python':
          highlightedCode = highlightPython(code)
          break
        case 'html':
          highlightedCode = highlightHTML(code)
          break
        case 'css':
          highlightedCode = highlightCSS(code)
          break
        case 'react':
          highlightedCode = highlightReact(code)
          break
        case 'sql':
          highlightedCode = highlightSQL(code)
          break
        case 'typescript':
          highlightedCode = highlightJavaScript(code) // Use JS highlighting for TS
          break
        case 'json':
          highlightedCode = highlightJavaScript(code) // Use JS highlighting for JSON
          break
        case 'xml':
          highlightedCode = highlightHTML(code) // Use HTML highlighting for XML
          break
        case 'bash':
        case 'shell':
          highlightedCode = highlightBash(code)
          break
        case 'markdown':
          highlightedCode = highlightMarkdown(code)
          break
        case 'plain':
        case 'text':
          // No highlighting for plain text
          highlightedCode = code.replace(/[<>&]/g, (match) => {
            switch (match) {
              case '<':
                return '&lt;'
              case '>':
                return '&gt;'
              case '&':
                return '&amp;'
              default:
                return match
            }
          })
          break
        default:
          // For unknown languages, just escape HTML
          highlightedCode = code.replace(/[<>&]/g, (match) => {
            switch (match) {
              case '<':
                return '&lt;'
              case '>':
                return '&gt;'
              case '&':
                return '&amp;'
              default:
                return match
            }
          })
      }

      codeBlock.innerHTML = highlightedCode
    })
  }

  // Function to convert selected text to inline code
  const convertToInlineCode = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    // Create inline code element
    const codeElement = document.createElement('code')
    codeElement.textContent = selectedText
    codeElement.style.cssText = `
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      font-size: 14px;
      background-color: #f1f3f4;
      padding: 2px 6px;
      border-radius: 4px;
      color: #d73a49;
      border: 1px solid #e1e4e8;
    `

    // Replace only the selected text with inline code
    range.deleteContents()
    range.insertNode(codeElement)

    // Clear selection
    selection.removeAllRanges()
  }

  const highlightJavaScript = (code) => {
    return code
      .replace(
        /\b(const|let|var|function|class|if|else|for|while|try|catch|async|await|return|import|export|from|default)\b/g,
        '<span class="keyword">$1</span>'
      )
      .replace(
        /\b(console|fetch|JSON|Promise|Error|Date|Math|Array|Object|String|Number|Boolean)\b/g,
        '<span class="function">$1</span>'
      )
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
      .replace(
        /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(
        /([+\-*/%=<>!&|^~?:,;.()[\]{}])/g,
        '<span class="operator">$1</span>'
      )
  }

  const highlightPython = (code) => {
    return code
      .replace(
        /\b(def|class|if|else|elif|for|while|try|except|finally|with|import|from|as|return|True|False|None|async|await)\b/g,
        '<span class="keyword">$1</span>'
      )
      .replace(
        /\b(print|len|str|int|float|list|dict|set|tuple|range|enumerate|zip|map|filter|reduce)\b/g,
        '<span class="function">$1</span>'
      )
      .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
      .replace(/("""[\s\S]*?""")/g, '<span class="comment">$1</span>')
      .replace(/('''[\s\S]*?''')/g, '<span class="comment">$1</span>')
      .replace(
        /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(/(@\w+)/g, '<span class="decorator">$1</span>')
  }

  const highlightHTML = (code) => {
    return code
      .replace(
        /(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)([^&]*?)(&gt;)/g,
        '<span class="tag">$1$2$3$4</span>'
      )
      .replace(/(\s[a-zA-Z-]+)=/g, '<span class="attribute">$1</span>=')
      .replace(
        /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>')
  }

  const highlightCSS = (code) => {
    return code
      .replace(
        /([.#]?[a-zA-Z][a-zA-Z0-9_-]*)\s*{/g,
        '<span class="selector">$1</span> {'
      )
      .replace(/([a-zA-Z-]+):/g, '<span class="property">$1</span>:')
      .replace(
        /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(
        /\b(url|rgb|rgba|hsl|hsla|calc|var)\b/g,
        '<span class="function">$1</span>'
      )
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
  }

  const highlightReact = (code) => {
    return code
      .replace(
        /\b(const|let|var|function|class|if|else|for|while|try|catch|async|await|return|import|export|from|default|useState|useEffect|useCallback|useMemo|React)\b/g,
        '<span class="keyword">$1</span>'
      )
      .replace(
        /\b(console|fetch|JSON|Promise|Error|Date|Math|Array|Object|String|Number|Boolean|createPortal|memo)\b/g,
        '<span class="function">$1</span>'
      )
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
      .replace(
        /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(
        /(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)([^&]*?)(&gt;)/g,
        '<span class="jsx-tag">$1$2$3$4</span>'
      )
      .replace(/(\s[a-zA-Z-]+)=/g, '<span class="jsx-attribute">$1</span>=')
  }

  const highlightSQL = (code) => {
    return code
      .replace(
        /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|PRIMARY|FOREIGN|KEY|REFERENCES|UNIQUE|NOT|NULL|DEFAULT|CHECK|CONSTRAINT|WITH|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MAX|MIN|CASE|WHEN|THEN|ELSE|END|AND|OR|IN|EXISTS|BETWEEN|LIKE|IS|CASCADE|RESTRICT|SET|NULL|TRUE|FALSE|CURRENT_TIMESTAMP|IDENTITY|BIGINT|VARCHAR|TEXT|BOOLEAN|TIMESTAMP|TIMEZONE|DECIMAL|ROUND|ROW_NUMBER|OVER|PARTITION|BY)\b/gi,
        '<span class="keyword">$1</span>'
      )
      .replace(
        /\b(COUNT|SUM|AVG|MAX|MIN|ROUND|ROW_NUMBER|OVER|PARTITION|BY)\b/gi,
        '<span class="function">$1</span>'
      )
      .replace(/(--.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
      .replace(
        /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(
        /([+\-*/%=<>!&|^~?:,;.()[\]{}])/g,
        '<span class="operator">$1</span>'
      )
  }

  const highlightBash = (code) => {
    return code
      .replace(
        /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|echo|printf|read|export|source|\.|cd|ls|cp|mv|rm|mkdir|rmdir|chmod|chown|grep|sed|awk|sort|uniq|head|tail|cat|less|more|nano|vim|git|npm|node|python|bash|sh|zsh)\b/g,
        '<span class="keyword">$1</span>'
      )
      .replace(
        /\b(echo|printf|read|export|source|cd|ls|cp|mv|rm|mkdir|rmdir|chmod|chown|grep|sed|awk|sort|uniq|head|tail|cat|less|more|nano|vim|git|npm|node|python|bash|sh|zsh)\b/g,
        '<span class="function">$1</span>'
      )
      .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
      .replace(
        /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      )
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>')
      .replace(
        /(\$[a-zA-Z_][a-zA-Z0-9_]*)/g,
        '<span class="variable">$1</span>'
      )
      .replace(/([|&;<>(){}[\]]+)/g, '<span class="operator">$1</span>')
  }

  const highlightMarkdown = (code) => {
    return code
      .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="heading">$1 $2</span>')
      .replace(/\*\*(.+?)\*\*/g, '<span class="bold">**$1**</span>')
      .replace(/\*(.+?)\*/g, '<span class="italic">*$1*</span>')
      .replace(/`([^`]+)`/g, '<span class="code">`$1`</span>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="link">[$1]($2)</span>')
      .replace(/^[-*+]\s+(.+)$/gm, '<span class="list">- $1</span>')
      .replace(/^\d+\.\s+(.+)$/gm, '<span class="list">1. $1</span>')
      .replace(/^>\s+(.+)$/gm, '<span class="quote">> $1</span>')
      .replace(/^```(\w+)?$/gm, '<span class="codeblock">```$1</span>')
      .replace(/^---$/gm, '<span class="separator">---</span>')
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        const selection = window.getSelection()
        if (!selection.rangeCount) return

        const range = selection.getRangeAt(0)
        const node = range.startContainer

        // More robust detection of code block - check multiple levels up
        let pre = null
        let currentNode = node

        // Check if we're inside a pre element (code block)
        while (currentNode && currentNode !== document.body) {
          if (
            currentNode.nodeType === Node.ELEMENT_NODE &&
            currentNode.tagName === 'PRE'
          ) {
            pre = currentNode
            break
          }
          currentNode = currentNode.parentNode
        }

        // If inside <pre> block
        if (pre) {
          const isCtrl = e.ctrlKey || e.metaKey // Support both Ctrl and Cmd (Mac)
          const isShift = e.shiftKey

          console.log('🔧 Inside code block - Ctrl:', isCtrl, 'Shift:', isShift)

          // Exit code block on Ctrl+Enter or Shift+Enter
          if (isCtrl || isShift) {
            e.preventDefault()
            console.log('🔧 Exiting code block with shortcut')

            // Create a new paragraph after the pre block
            const newParagraph = document.createElement('p')
            newParagraph.innerHTML = '<br>' // so it's visible/clickable

            pre.parentNode.insertBefore(newParagraph, pre.nextSibling)

            // Move caret to the new paragraph
            const newRange = document.createRange()
            newRange.setStart(newParagraph, 0)
            newRange.collapse(true)

            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(newRange)

            editorRef.current?.focus()
          } else {
            // Allow normal Enter to create new line within code block
            console.log('🔧 Normal Enter inside code block - allowing new line')
            // Don't prevent default - let the browser handle it naturally
            // But ensure we reapply syntax highlighting after the change
            setTimeout(() => {
              applySyntaxHighlighting()
            }, 10)
          }
        } else {
          console.log('🔧 Not inside code block - normal Enter behavior')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/documents`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        const docs = await res.json()
        const doc = docs.find((d) => d.id === docId)

        if (!doc) {
          alert('No document found. Please create or select one.')
          return
        }

        setTitle(doc.title)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch document:', err)
      }
    }

    fetchTitle()
  }, [docId])

  // Add these handlers to update activeFormats on selection and focus events
  const handleEditorFocus = () => {
    console.log('🔧 Editor focused')
    document.addEventListener('selectionchange', updateActiveFormats)
    updateActiveFormats()
  }
  const handleEditorBlur = () => {
    console.log('🔧 Editor blurred')
    document.removeEventListener('selectionchange', updateActiveFormats)
    setActiveFormats([]) // Optionally clear highlights on blur
  }
  const handleEditorMouseUp = () => {
    updateActiveFormats()
  }
  const handleEditorKeyUp = () => {
    updateActiveFormats()
  }

  // Wrap the format function to update formats and refocus editor
  const formatAndUpdate = (command, value = null) => {
    format(command, value)
    if (editorRef.current) editorRef.current.focus()
    setTimeout(updateActiveFormats, 10) // ensure DOM updates first
  }

  // Clear all formatting: inline, block, lists, code blocks
  const clearAllFormatting = () => {
    format('removeFormat') // Remove inline styles
    format('formatBlock', 'p') // Convert to paragraph
    format('insertOrderedList') // Toggle off ordered list if in one
    format('insertUnorderedList') // Toggle off unordered list if in one
    // Remove code block: if selection is in <pre>, replace with <p>
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode
      const pre = node && node.closest && node.closest('pre')
      if (pre) {
        const p = document.createElement('p')
        p.innerHTML = pre.innerHTML
        pre.parentNode.replaceChild(p, pre)
      }
    }
    if (editorRef.current) editorRef.current.focus()
    setTimeout(updateActiveFormats, 0)
  }

  // Handler for drag-and-drop page reordering
  const handlePageReorder = async (newOrder) => {
    setIsReordering(true)
    setReorderToast('Updating page order...')
    try {
      // Optimistically reorder pages
      const idToPage = Object.fromEntries(pages.map((p) => [p.id, p]))
      const newPages = newOrder.map((id, idx) => ({
        ...idToPage[id],
        pageIndex: idx,
      }))
      if (newPages.length === pages.length) {
        reorderPages(newPages)
      }
      const token = localStorage.getItem('token')
      const res = await fetch(
        `http://localhost:3000/api/documents/${docId}/pages/reorder`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order: newOrder }),
        }
      )
      if (res.ok) {
        setReorderToast('Page order updated!')
      } else {
        const msg = (await res.json()).error || 'Error updating order'
        setReorderToast(msg)
      }
    } catch (err) {
      setReorderToast('Failed to update order')
    }
    setTimeout(() => setReorderToast(null), 2000)
    setIsReordering(false)
  }

  if (loading) {
    return (
      <div className='editor-container'>
        <div className='editor-loading'>
          <div className='loading-spinner'></div>
          <p>Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='editor-container'>
      <header className='editor-header'>
        <div className='editor-header-left'>
          <button
            className='back-button'
            onClick={() => navigate('/dashboard')}
          >
            ← Back
          </button>
          <input
            className='editor-title-input'
            type='text'
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value
              setTitle(newTitle)
              debouncedSaveTitle(newTitle)
            }}
            placeholder='Untitled Document'
          />
        </div>
        <div className='editor-header-right'>
        <div className="editor-header-right">
          <ThemeToggle />
          <InviteUser documentId={docId} />
        </div>
      </header>

      <div className='floating-toolbar-container'>
        <EditorToolbar
          format={formatAndUpdate}
          undo={undo}
          redo={redo}
          addPage={addPage}
          insertCodeBlock={insertMultilineCode}
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
        />
      </div>

      <main className='editor-main'>
        <div style={{ width: 340, float: 'left', marginRight: 32 }}>
          <h3 className='font-semibold mb-3'>Reorder Pages</h3>
          <PageList pages={pages} onReorder={handlePageReorder} />
          {reorderToast && (
            <div className='mt-2 px-3 py-2 rounded bg-blue-100 text-blue-700 text-center text-sm'>
              {reorderToast}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 380 }}>
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
          />
        </div>
      </main>
    </div>
  )
}
