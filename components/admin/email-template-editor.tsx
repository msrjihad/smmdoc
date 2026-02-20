'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table/kit';
import { useRef, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Columns2,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  PilcrowLeft,
  Quote,
  RectangleHorizontal,
  RemoveFormatting,
  Rows2,
  Strikethrough,
  Table,
  Trash2,
  Underline,
  Unlink,
  Type,
} from 'lucide-react';

type EditorMode = 'visual' | 'code';

function prettyPrintHtml(html: string): string {
  if (!html || !html.trim()) return html;
  const voidTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
  const parts = html.replace(/></g, '>\n<').split('\n');
  let depth = 0;
  const lines: string[] = [];
  for (const raw of parts) {
    const line = raw.trim();
    if (!line) continue;
    const isClose = line.startsWith('</');
    const tagMatch = line.match(/^<\s*\/?(\w+)/);
    const tagName = tagMatch?.[1]?.toLowerCase();
    const isSelfClose = /\/\s*>$/.test(line) || (tagName && voidTags.has(tagName));
    if (isClose && depth > 0) depth--;
    lines.push('  '.repeat(depth) + line);
    if (!isClose && !isSelfClose) depth++;
  }
  return lines.join('\n');
}

interface EmailTemplateEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  isDarkMode?: boolean;
  editorKey?: string;
}

const btnClass = (active: boolean) =>
  `rounded p-2 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center ${
    active ? 'bg-gray-200 dark:bg-gray-600 text-[var(--primary)]' : 'text-gray-700 dark:text-gray-300'
  }`;

function Toolbar({
  editor,
  isDarkMode,
}: {
  editor: Editor | null;
  isDarkMode: boolean;
}) {
  const [blockOpen, setBlockOpen] = useState(false);
  const linkUrl = editor?.getAttributes('link').href ?? '';

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt('Enter URL:', linkUrl || 'https://');
    if (url != null) {
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    }
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:', 'https://');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    if (!editor) return;
    const rows = window.prompt('Rows (default 3):', '3');
    const cols = window.prompt('Columns (default 3):', '3');
    const r = Math.min(Math.max(parseInt(rows || '3', 10) || 3, 1), 10);
    const c = Math.min(Math.max(parseInt(cols || '3', 10) || 3, 1), 10);
    editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
  };

  const insertButton = () => {
    if (!editor) return;
    const url = window.prompt('Button URL:', 'https://');
    const label = window.prompt('Button text:', 'Click here');
    if (url != null && label != null && (url || label)) {
      const href = (url || '#').replace(/"/g, '&quot;');
      const text = (label || 'Button').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const html = `<p style="margin: 1em 0;"><a href="${href}" class="email-cta-button" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">${text}</a></p>`;
      editor.chain().focus().insertContent(html).run();
    }
  };

  if (!editor) return null;

  const blockLabel =
    editor.isActive('heading', { level: 1 })
      ? 'Heading 1'
      : editor.isActive('heading', { level: 2 })
        ? 'Heading 2'
        : editor.isActive('heading', { level: 3 })
          ? 'Heading 3'
          : editor.isActive('blockquote')
            ? 'Blockquote'
            : 'Paragraph';

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setBlockOpen((o) => !o)}
          className={`${btnClass(false)} flex items-center gap-1 min-w-[120px]`}
          title="Block type"
        >
          <PilcrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate text-left flex-1">{blockLabel}</span>
          <span className="text-xs opacity-70">▼</span>
        </button>
        {blockOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setBlockOpen(false)} aria-hidden />
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg">
              <button
                type="button"
                onClick={() => { editor.chain().focus().setParagraph().run(); setBlockOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Paragraph
              </button>
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => { editor.chain().focus().toggleHeading({ level }).run(); setBlockOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Heading {level}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { editor.chain().focus().toggleBlockquote().run(); setBlockOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Blockquote
              </button>
            </div>
          </>
        )}
      </div>
      <span className="mx-0.5 h-5 w-px bg-gray-300 dark:bg-gray-500" aria-hidden />
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
        <Underline className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Strikethrough">
        <Strikethrough className="h-4 w-4" />
      </button>
      <span className="mx-0.5 h-5 w-px bg-gray-300 dark:bg-gray-500" aria-hidden />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet list">
        <List className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered list">
        <ListOrdered className="h-4 w-4" />
      </button>
      <span className="mx-0.5 h-5 w-px bg-gray-300 dark:bg-gray-500" aria-hidden />
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align left">
        <AlignLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align center">
        <AlignCenter className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Align right">
        <AlignRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btnClass(editor.isActive({ textAlign: 'justify' }))} title="Justify">
        <AlignJustify className="h-4 w-4" />
      </button>
      <span className="mx-0.5 h-5 w-px bg-gray-300 dark:bg-gray-500" aria-hidden />
      <button type="button" onClick={setLink} className={btnClass(editor.isActive('link'))} title="Link">
        <Link className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btnClass(false)} title="Unlink">
        <Unlink className="h-4 w-4" />
      </button>
      <span className="mx-0.5 h-5 w-px bg-gray-300 dark:bg-gray-500" aria-hidden />
      <button type="button" onClick={addImage} className={btnClass(false)} title="Insert image">
        <ImageIcon className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Blockquote">
        <Quote className="h-4 w-4" />
      </button>
      <span className="mx-0.5 h-5 w-px bg-gray-300 dark:bg-gray-500" aria-hidden />
      <button type="button" onClick={insertButton} className={btnClass(false)} title="Insert button">
        <RectangleHorizontal className="h-4 w-4" />
      </button>
      <button type="button" onClick={insertTable} className={btnClass(editor.isActive('table'))} title="Insert table">
        <Table className="h-4 w-4" />
      </button>
      {editor.isActive('table') && (
        <>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className={btnClass(false)} title="Add row after">
            <Rows2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className={btnClass(false)} title="Add column after">
            <Columns2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className={btnClass(false)} title="Delete row">
            —
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className={btnClass(false)} title="Delete column">
            |
          </button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className={btnClass(false)} title="Delete table">
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
      <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={btnClass(false)} title="Clear formatting">
        <RemoveFormatting className="h-4 w-4" />
      </button>
    </div>
  );
}

export function EmailTemplateEditor({
  value,
  onChange,
  onBlur,
  placeholder = 'Write your email template content here. Header and footer are added automatically.',
  isDarkMode = false,
  editorKey = 'default',
}: EmailTemplateEditorProps) {
  const lastValueRef = useRef<string>(value);
  const modeRef = useRef<EditorMode>('visual');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [codeInput, setCodeInput] = useState(value || '');

  modeRef.current = mode;

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Image.configure({ inline: false, allowBase64: true }),
        TableKit.configure({
          table: { resizable: false },
        }),
      ],
      content: value || '',
      editorProps: {
        attributes: {
          class: 'min-h-[280px] max-h-[320px] overflow-y-auto px-4 py-3 text-gray-900 dark:text-white focus:outline-none prose prose-sm dark:prose-invert max-w-none',
        },
      },
      onBlur: () => {
        onBlur?.();
      },
      onUpdate: ({ editor: ed }) => {
        if (modeRef.current === 'code') return;
        const html = ed.getHTML();
        lastValueRef.current = html;
        onChange(html);
        setCodeInput(html);
      },
    },
    [editorKey]
  );

  useEffect(() => {
    if (!editor) return;
    if (value !== lastValueRef.current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      lastValueRef.current = value || '';
      if (mode !== 'code') setCodeInput(value || '');
    }
  }, [editor, value, mode]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      lastValueRef.current = value || '';
    }
    setCodeInput(value || '');
  }, [editor]);

  const handleCodeChange = (raw: string) => {
    setCodeInput(raw);
    onChange(raw);
    lastValueRef.current = raw;
  };

  const switchToVisual = () => {
    if (mode === 'code') {
      const html = codeInput;
      if (editor) editor.commands.setContent(html, { emitUpdate: false });
      lastValueRef.current = html;
    }
    setMode('visual');
  };

  const switchToCode = () => {
    if (mode === 'visual' && editor) setCodeInput(prettyPrintHtml(editor.getHTML()));
    setMode('code');
  };

  return (
    <div
      className={`email-template-tiptap rounded-lg overflow-hidden transition-all flex flex-col ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } ${isFullscreen ? 'fixed inset-4 z-50 rounded-lg shadow-2xl is-fullscreen' : ''}`}
      data-placeholder={placeholder}
    >
      <div className="flex items-center border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
        <button
          type="button"
          onClick={switchToVisual}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            mode === 'visual'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Type className="h-4 w-4" />
          Visual
        </button>
        <button
          type="button"
          onClick={switchToCode}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            mode === 'code'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Code2 className="h-4 w-4" />
          Code
        </button>
        {(mode === 'visual' || isFullscreen) && (
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="ml-auto mr-3 flex items-center justify-center p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className={isFullscreen ? 'flex-1 min-h-0 flex flex-col' : ''}>
        {mode === 'visual' ? (
          <>
            <Toolbar editor={editor} isDarkMode={isDarkMode} />
            <EditorContent editor={editor} />
          </>
        ) : (
          <div className="email-template-code-editor w-full min-h-[280px] flex flex-col">
            <textarea
              value={codeInput}
              onChange={(e) => handleCodeChange(e.target.value)}
              onBlur={() => onBlur?.()}
              placeholder="<p>Enter HTML here...</p>"
              className="email-template-code-textarea w-full min-h-[280px] box-border p-4 font-mono text-sm resize-y border-0 outline-none bg-transparent text-inherit"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
