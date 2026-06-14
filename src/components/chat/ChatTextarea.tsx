/**
 * ChatTextarea.tsx
 *
 * Ô nhập chat auto-resize theo phong cách Zalo / Messenger:
 *  - Tự động tăng từ 1 dòng (40px) → tối đa 5 dòng (120px)
 *  - Sau khi vượt max → scroll nội bộ (không đẩy layout)
 *  - Smooth transition height 150ms
 *  - Border pill (rounded-2xl) như Zalo
 *  - Character counter xuất hiện khi > 400 / 500 ký tự
 *  - Hint "Shift+Enter để xuống dòng" khi đang focus
 */
import { useRef, useEffect, useState, useCallback, forwardRef } from 'react'
import { cn } from '~/utils/lib'

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_HEIGHT = 40    // px — 1 dòng
const MAX_HEIGHT = 120   // px — ~5 dòng
const MAX_CHARS  = 500
const WARN_CHARS = 400   // Bắt đầu hiện counter khi vượt ngưỡng này

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ChatTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'style'> {
  /** Callback khi nhấn Enter (không Shift) — thường dùng để gửi tin nhắn */
  onSend?: () => void
  /** Ẩn hint "Shift+Enter để xuống dòng" */
  hideHint?: boolean
  /** Wrapper class name */
  wrapperClassName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────
export const ChatTextarea = forwardRef<HTMLTextAreaElement, ChatTextareaProps>(
  ({ className, wrapperClassName, onSend, hideHint = false, value, onChange, onKeyDown, disabled, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null)
    // Merge forwarded ref + inner ref
    const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || innerRef

    const [isFocused, setIsFocused] = useState(false)
    const charCount = typeof value === 'string' ? value.length : 0
    const showCounter = charCount >= WARN_CHARS

    // ── Auto-resize ──────────────────────────────────────────────────────────
    const adjustHeight = useCallback(() => {
      const el = textareaRef.current
      if (!el) return
      // Reset về min để tính lại scrollHeight đúng
      el.style.height = `${MIN_HEIGHT}px`
      const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT)
      el.style.height = `${newHeight}px`
      // Cho phép scroll nội bộ khi vượt max
      el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
    }, [textareaRef])

    // Adjust khi value thay đổi
    useEffect(() => {
      adjustHeight()
    }, [value, adjustHeight])

    // Adjust lần đầu mount
    useEffect(() => {
      adjustHeight()
    }, [adjustHeight])

    // ── Keyboard handler ─────────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter (không Shift) → gửi
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault()
        onSend?.()
        return
      }
      // Chặn vượt MAX_CHARS (Shift+Enter, ký tự thường)
      if (
        charCount >= MAX_CHARS &&
        e.key !== 'Backspace' &&
        e.key !== 'Delete' &&
        !e.metaKey &&
        !e.ctrlKey &&
        e.key.length === 1
      ) {
        e.preventDefault()
        return
      }
      onKeyDown?.(e)
    }

    // ── Change handler ───────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Cắt nếu paste vượt giới hạn
      if (e.target.value.length > MAX_CHARS) {
        e.target.value = e.target.value.slice(0, MAX_CHARS)
      }
      onChange?.(e)
    }

    const counterColor =
      charCount >= MAX_CHARS
        ? 'text-red-500'
        : charCount >= WARN_CHARS
          ? 'text-amber-500'
          : 'text-gray-400'

    return (
      <div className={cn('flex flex-col flex-1', wrapperClassName)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={cn(
            // Base layout
            'flex-1 w-full resize-none outline-none',
            // Typography
            'text-sm text-gray-900 placeholder:text-gray-400',
            // Spacing + shape — pill như Zalo
            'px-4 py-2.5 rounded-2xl',
            // Border
            'border border-gray-200 bg-gray-50',
            'transition-[border-color,box-shadow,height] duration-150 ease-out',
            // Focus ring
            isFocused
              ? 'border-blue-400 bg-white ring-[3px] ring-blue-500/15 shadow-sm'
              : 'hover:border-gray-300',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Scrollbar styling (webkit)
            '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
            '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
            className,
          )}
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT, overflowY: 'hidden' }}
          {...props}
        />

        {/* Bottom row: hint + character counter */}
        <div className='flex items-center justify-between px-1 mt-0.5 min-h-[16px]'>
          {/* Hint "Shift+Enter = xuống dòng" — chỉ hiện khi focus và không ẩn */}
          {!hideHint && isFocused && charCount === 0 && (
            <span className='text-[10px] text-gray-400 select-none leading-none animate-in fade-in duration-200'>
              Shift+Enter để xuống dòng
            </span>
          )}

          {/* Character counter — chỉ hiện khi gần giới hạn */}
          {showCounter && (
            <span className={cn('text-[10px] leading-none ml-auto tabular-nums', counterColor)}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>
      </div>
    )
  },
)

ChatTextarea.displayName = 'ChatTextarea'
