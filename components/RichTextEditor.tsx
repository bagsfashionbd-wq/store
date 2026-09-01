'use client'

import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading3,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  RemoveFormatting
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write product description with formatting, bullet points, specifications...'
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3, 4]
        }
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-600 underline font-semibold hover:text-brand-700 transition'
        }
      })
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[140px] px-3 py-2 text-xs text-slate-800 leading-relaxed'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // If it's just empty paragraph <p></p>, pass empty string
      onChange(html === '<p></p>' ? '' : html)
    },
    immediatelyRender: false
  })

  // Sync external value changes (e.g. when opening edit modal)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (!value && editor.getHTML() === '<p></p>') return
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter link URL:', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run()
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-slate-100 bg-slate-50/80 text-slate-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('bold')
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('italic')
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('underline')
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Section Heading (H3)"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('bulletList')
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Bulleted List"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('orderedList')
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded text-xs transition ${
            editor.isActive('link')
              ? 'bg-slate-200 text-brand-700 font-bold shadow-xs'
              : 'hover:bg-slate-200 text-slate-600'
          }`}
          title="Add Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded text-xs hover:bg-slate-200 text-red-600 transition"
            title="Remove Link"
          >
            <Unlink className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded text-xs hover:bg-slate-200 text-slate-500 transition"
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded text-xs hover:bg-slate-200 text-slate-500 disabled:opacity-30 transition"
            title="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded text-xs hover:bg-slate-200 text-slate-500 disabled:opacity-30 transition"
            title="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[140px]">
        {editor.isEmpty && (
          <div className="absolute top-2 left-3 text-slate-400 pointer-events-none text-xs">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
