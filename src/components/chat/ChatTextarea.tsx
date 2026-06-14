/**
 * ChatTextarea.tsx
 *
 * Ô nhập chat auto-resize theo phong cách Facebook Messenger / Zalo:
 *  - Tự động tăng từ 1 dòng (40px) → tối đa 5 dòng (120px)
 *  - Sau khi vượt max → scroll nội bộ
 *  - Smooth transition height 150ms
 *  - Border pill (rounded-2xl)
 *  - Character counter + hint nằm ABSOLUTE bên trong → không ảnh hưởng layout cao/thấp
 *  - Wrapper chỉ là relative container — dễ căn giữa với icons cùng hàng
 */
import { useRef, useEffect, useState, useCallback, forwardRef } from 'react'
import { cn } from '~/utils/lib'

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_HEIGHT = 40    // px — 1 dòng
const MAX_HEIGHT = 120   // px — ~5 dòng
const MAX_CHARS  = 500
const WARN_CHARS = 400

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ChatTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'style'> {
  onSend?: () => void
  wrapperClassName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────
export const ChatTextarea = forwardRef<HTMLTextAreaElement, ChatTextareaProps>(
  ({ className, wrapperClassName, onSend, value, onChange, onKeyDown, disabled, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null)
    const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || innerRef

    const [isFocused, setIsFocused] = useState(false)
    const charCount = typeof value === 'string' ? value.length : 0
    const showCounter = charCount >= WARN_CHARS

    // ── Auto-resize ──────────────────────────────────────────────────────────
    const adjustHeight = useCallback(() => {
      const el = textareaRef.current
      if (!el) return
      // Reset về 0px để đo chính xác scrollHeight thực tế của content (minHeight sẽ giữ nó không bị sập)
      el.style.height = '0px'
      const next = Math.max(MIN_HEIGHT, Math.min(el.scrollHeight, MAX_HEIGHT))
      el.style.height = `${next}px`
      el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
    }, [textareaRef])

    useEffect(() => { adjustHeight() }, [value, adjustHeight])
    useEffect(() => { adjustHeight() }, [adjustHeight])

    // ── Keyboard ─────────────────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault()
        onSend?.()
        return
      }
      if (
        charCount >= MAX_CHARS &&
        e.key !== 'Backspace' && e.key !== 'Delete' &&
        !e.metaKey && !e.ctrlKey && e.key.length === 1
      ) {
        e.preventDefault()
        return
      }
      onKeyDown?.(e)
    }

    // ── Change ───────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length > MAX_CHARS) {
        e.target.value = e.target.value.slice(0, MAX_CHARS)
      }
      onChange?.(e)
    }

    const counterColor =
      charCount >= MAX_CHARS ? 'text-red-500' :
      charCount >= WARN_CHARS ? 'text-amber-500' : 'text-gray-400'

    return (
      /*
       * QUAN TRỌNG: wrapper là `relative` và không có min-h / padding-bottom
       * → chiều cao wrapper = chiều cao textarea (không bị hint/counter đẩy)
       * → bên ngoài dùng items-center là đủ căn giữa đẹp như Messenger
       */
      <div className={cn('relative flex-1', wrapperClassName)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={cn(
            'block w-full resize-none outline-none',
            'text-sm text-gray-900 placeholder:text-gray-400',
            'px-4 py-2.5 rounded-2xl',
            'border border-gray-200 bg-gray-50',
            'transition-[border-color,box-shadow,height] duration-150 ease-out',
            isFocused
              ? 'border-blue-400 bg-white ring-[3px] ring-blue-500/15 shadow-sm'
              : 'hover:border-gray-300',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Ẩn scrollbar như Zalo/Messenger — vẫn scroll được, không hiển thị thanh cuộn
            '[&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
            // Padding-bottom nhường chỗ cho counter nằm absolute bên dưới
            showCounter ? 'pb-5' : 'pb-2.5',
            className,
          )}
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT, overflowY: 'hidden', scrollbarWidth: 'none' }}
          {...props}
        />

        {/* Counter — absolute bottom-right */}
        {showCounter && (
          <span className={cn(
            'absolute bottom-1.5 right-3 text-[10px] tabular-nums pointer-events-none leading-none',
            counterColor,
          )}>
            {charCount}/{MAX_CHARS}
          </span>
        )}
      </div>
    )
  },
)

ChatTextarea.displayName = 'ChatTextarea'
