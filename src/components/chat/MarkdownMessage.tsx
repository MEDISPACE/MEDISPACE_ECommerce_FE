/**
 * MarkdownMessage.tsx
 * Lightweight markdown renderer cho AI chat — không cần thư viện ngoài.
 *
 * Hỗ trợ:
 *   **bold**, *italic*, `code`
 *   ## Heading, --- (divider)
 *   - unordered list, 1. ordered list
 *   WARNING block
 *   numbered medicine items (1. TEN THUOC)
 */

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  content: string
  className?: string
}

const WARNING_PREFIX = '\u26A0\uFE0F'

// ── Inline formatter: **bold**, *italic*, `code` ───────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Regex matches **bold**, *italic*, `code` in order
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index} className='font-semibold text-gray-900'>{match[2]}</strong>)
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index} className='italic text-gray-700'>{match[3]}</em>)
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={match.index} className='px-1.5 py-0.5 bg-[#F0F6FF] border border-[#BFDBFE] text-[#0A2463] text-[0.82em] rounded font-mono'>
          {match[4]}
        </code>
      )
    }
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}

// ── Line-level block classifier ────────────────────────────────────────────
type LineBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'hr' }
  | { type: 'warning'; text: string }
  | { type: 'li'; ordered: boolean; index?: number; text: string }
  | { type: 'blank' }
  | { type: 'paragraph'; text: string }

function classifyLine(line: string): LineBlock {
  const trimmed = line.trim()
  if (trimmed === '') return { type: 'blank' }
  if (/^---+$/.test(trimmed)) return { type: 'hr' }

  // Headings ## / ###
  const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)/)
  if (headingMatch) {
    const level = headingMatch[1].length >= 3 ? 3 : 2
    return { type: 'heading', level: level as 2 | 3, text: headingMatch[2] }
  }

  // warning line
  if (trimmed.startsWith(WARNING_PREFIX)) {
    return { type: 'warning', text: trimmed.replace(new RegExp(`^${WARNING_PREFIX}\\s*`), '') }
  }

  // Unordered list: - item or * item
  const ulMatch = trimmed.match(/^[-*•]\s+(.+)/)
  if (ulMatch) {
    return { type: 'li', ordered: false, text: ulMatch[1] }
  }

  // Ordered list: 1. item
  const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
  if (olMatch) {
    return { type: 'li', ordered: true, index: parseInt(olMatch[1]), text: olMatch[2] }
  }

  return { type: 'paragraph', text: trimmed }
}

// ── Render blocks into React elements ──────────────────────────────────────
function renderBlocks(lines: string[]): React.ReactNode[] {
  const blocks = lines.map((l) => classifyLine(l))
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    // --- horizontal rule ---
    if (block.type === 'hr') {
      elements.push(
        <div key={i} className='my-3 border-t border-[#BFDBFE]' />
      )
      i++
      continue
    }

    // --- heading ---
    if (block.type === 'heading') {
      if (block.level === 2) {
        elements.push(
          <h4 key={i} className='text-sm font-bold text-[#0A2463] mt-3 mb-1.5 flex items-center gap-1.5'>
            {renderInline(block.text)}
          </h4>
        )
      } else {
        elements.push(
          <h5 key={i} className='text-xs font-semibold text-[#1E40AF] uppercase tracking-wide mt-2 mb-1'>
            {renderInline(block.text)}
          </h5>
        )
      }
      i++
      continue
    }

    // --- warning block ---
    if (block.type === 'warning') {
      elements.push(
        <div key={i} className='flex gap-2 my-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl'>
          <AlertTriangle className='w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600' />
          <p className='text-xs text-amber-800 leading-relaxed font-medium'>
            {renderInline(block.text)}
          </p>
        </div>
      )
      i++
      continue
    }

    // --- blank ---
    if (block.type === 'blank') {
      i++
      continue
    }

    // --- collect consecutive list items ---
    if (block.type === 'li') {
      const isOrdered = block.ordered
      const listItems: LineBlock[] = []

      while (i < blocks.length && blocks[i].type === 'li' && (blocks[i] as any).ordered === isOrdered) {
        listItems.push(blocks[i])
        i++
      }

      if (isOrdered) {
        elements.push(
          <ol key={`ol-${i}`} className='space-y-2 my-2 pl-1'>
            {listItems.map((item, idx) => {
              const li = item as { type: 'li'; ordered: true; index?: number; text: string }
              const num = li.index ?? idx + 1
              return (
                <li key={idx} className='flex gap-2.5 items-start'>
                  <span className='flex-shrink-0 w-5 h-5 bg-[#0A2463] text-white text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5'>
                    {num}
                  </span>
                  <span className='text-sm text-gray-800 leading-relaxed'>
                    {renderInline(li.text)}
                  </span>
                </li>
              )
            })}
          </ol>
        )
      } else {
        elements.push(
          <ul key={`ul-${i}`} className='space-y-1.5 my-1.5 pl-1'>
            {listItems.map((item, idx) => {
              const li = item as { type: 'li'; ordered: false; text: string }
              return (
                <li key={idx} className='flex gap-2 items-start'>
                  <span className='flex-shrink-0 w-1.5 h-1.5 bg-[#1E40AF] rounded-full mt-2' />
                  <span className='text-sm text-gray-800 leading-relaxed'>
                    {renderInline(li.text)}
                  </span>
                </li>
              )
            })}
          </ul>
        )
      }
      continue
    }

    // --- paragraph ---
    if (block.type === 'paragraph') {
      elements.push(
        <p key={i} className='text-sm text-gray-800 leading-relaxed mb-1.5'>
          {renderInline(block.text)}
        </p>
      )
      i++
      continue
    }

    i++
  }

  return elements
}

// ── Main Component ──────────────────────────────────────────────────────────
export function MarkdownMessage({ content, className = '' }: Props) {
  if (!content) return null
  const lines = content.split('\n')
  const nodes = renderBlocks(lines)
  return <div className={`space-y-0.5 ${className}`}>{nodes}</div>
}
