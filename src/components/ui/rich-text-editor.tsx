import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import './rich-text-editor.css'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  height?: number
}

export function RichTextEditor({ value, onChange, placeholder, height = 400 }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
    }),
    [],
  )

  // React-Quill uses specific formats names
  // 'list' covers both ordered and bullet lists in the formats array
  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'indent', // 'bullet' is not a separate format name in Quill, it's a value for 'list'
    'align',
    'link',
    'image',
  ]

  return (
    <div className='rich-text-editor' style={{ '--rich-text-editor-height': `${height}px` } as CSSProperties}>
      <ReactQuill
        theme='snow'
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Nhập nội dung bài viết...'}
      />
    </div>
  )
}
