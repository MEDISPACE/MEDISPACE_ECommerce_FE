import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import ReactQuill from 'react-quill-new'
import { toast } from 'sonner'

import { uploadImage } from '~/services/mediaService'
import 'react-quill-new/dist/quill.snow.css'
import './rich-text-editor.css'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  height?: number
}

const MAX_EDITOR_IMAGE_SIZE = 5 * 1024 * 1024

export function RichTextEditor({ value, onChange, placeholder, height = 400 }: RichTextEditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<ReactQuill | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editorImages, setEditorImages] = useState<Array<{ src: string; index: number }>>([])

  const syncEditorImages = useCallback(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return
    let index = 0
    const images: Array<{ src: string; index: number }> = []
    quill.getContents().ops?.forEach((op) => {
      if (typeof op.insert === 'string') {
        index += op.insert.length
        return
      }
      if (op.insert && typeof op.insert === 'object' && 'image' in op.insert) {
        images.push({ src: String(op.insert.image || ''), index })
        index += 1
      }
    })
    setEditorImages(images.filter((image) => image.src))
  }, [])

  const insertUploadedImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }
    if (file.size > MAX_EDITOR_IMAGE_SIZE) {
      toast.error('Ảnh không được vượt quá 5MB')
      return
    }

    const quill = quillRef.current?.getEditor()
    if (!quill) return
    const range = quill.getSelection(true)
    setUploadingImage(true)
    try {
      const imageUrl = await uploadImage(file)
      const insertAt = range?.index ?? quill.getLength()
      quill.insertEmbed(insertAt, 'image', imageUrl, 'user')
      quill.setSelection(insertAt + 1, 0, 'silent')
      window.setTimeout(syncEditorImages, 0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên')
    } finally {
      setUploadingImage(false)
    }
  }, [])

  const openImagePicker = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void insertUploadedImage(file)
    }
    input.click()
  }, [insertUploadedImage])

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: openImagePicker,
        },
      },
    }),
    [openImagePicker],
  )

  useEffect(() => {
    window.setTimeout(syncEditorImages, 0)
  }, [syncEditorImages, value])

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

  const isImageEmbedAt = useCallback((index: number) => {
    const quill = quillRef.current?.getEditor()
    if (!quill || index < 0 || index >= quill.getLength()) return false
    const [leaf] = quill.getLeaf(index)
    const node = leaf?.domNode as HTMLElement | undefined
    return node?.tagName === 'IMG'
  }, [])

  const deleteImageAt = useCallback((index: number) => {
    const quill = quillRef.current?.getEditor()
    if (!quill || !isImageEmbedAt(index)) return false
    quill.deleteText(index, 1, 'user')
    quill.setSelection(Math.max(index - 1, 0), 0, 'silent')
    window.setTimeout(syncEditorImages, 0)
    return true
  }, [isImageEmbedAt, syncEditorImages])

  const deleteImageBySrc = useCallback((src: string) => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return
    let index = 0
    const target = quill.getContents().ops?.find((op) => {
      if (typeof op.insert === 'string') {
        index += op.insert.length
        return false
      }
      const isMatch = Boolean(op.insert && typeof op.insert === 'object' && 'image' in op.insert && String(op.insert.image || '') === src)
      if (!isMatch) index += 1
      return isMatch
    })
    if (!target) return
    quill.deleteText(index, 1, 'user')
    quill.setSelection(Math.max(index - 1, 0), 0, 'silent')
    window.setTimeout(syncEditorImages, 0)
  }, [syncEditorImages])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return
    const quill = quillRef.current?.getEditor()
    const range = quill?.getSelection()
    if (!quill || !range) return

    if (range.length > 0) {
      const selectedContents = quill.getContents(range.index, range.length)
      const hasSelectedImage = selectedContents.ops?.some((op) => typeof op.insert === 'object' && op.insert && 'image' in op.insert)
      if (hasSelectedImage) {
        event.preventDefault()
        quill.deleteText(range.index, range.length, 'user')
        quill.setSelection(range.index, 0, 'silent')
        window.setTimeout(syncEditorImages, 0)
      }
      return
    }

    const imageIndex = event.key === 'Backspace' ? range.index - 1 : range.index
    if (deleteImageAt(imageIndex)) event.preventDefault()
  }, [deleteImageAt])

  const handlePasteCapture = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'))
    if (!file) return
    event.preventDefault()
    void insertUploadedImage(file)
  }, [insertUploadedImage])

  const handleChange = useCallback((content: string) => {
    onChange(content)
    window.setTimeout(syncEditorImages, 0)
  }, [onChange, syncEditorImages])

  const handleDropCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
    if (!file) return
    event.preventDefault()
    void insertUploadedImage(file)
  }, [insertUploadedImage])

  return (
    <div
      ref={wrapperRef}
      className='rich-text-editor'
      style={{ '--rich-text-editor-height': `${height}px` } as CSSProperties}
      onPasteCapture={handlePasteCapture}
      onDropCapture={handleDropCapture}
    >
      <ReactQuill
        ref={quillRef}
        theme='snow'
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Nhập nội dung bài viết...'}
      />
      {uploadingImage && <div className='rich-text-editor__uploading'>Đang tải ảnh...</div>}
      {editorImages.length > 0 && (
        <div className='rich-text-editor__image-tray'>
          {editorImages.map((image) => (
            <div key={`${image.src}-${image.index}`} className='rich-text-editor__image-preview'>
              <img src={image.src} alt='Ảnh trong editor' />
              <button
                type='button'
                className='rich-text-editor__image-preview-remove'
                onClick={() => deleteImageBySrc(image.src)}
                aria-label='Xóa ảnh trong editor'
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
