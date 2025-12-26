import React from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'

export interface FormFieldProps {
  label: string
  id?: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, id, required, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </Label>
      {children}
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  )
}

export interface TextFieldProps {
  label: string
  id?: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number'
  disabled?: boolean
  className?: string
}

export function TextField({
  label,
  id,
  required,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  className = '',
}: TextFieldProps) {
  return (
    <FormField label={label} id={id} required={required} error={error} className={className}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className='border-2 border-blue-200 focus:border-blue-500'
      />
    </FormField>
  )
}

export interface TextAreaFieldProps {
  label: string
  id?: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  className?: string
}

export function TextAreaField({
  label,
  id,
  required,
  error,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
  className = '',
}: TextAreaFieldProps) {
  return (
    <FormField label={label} id={id} required={required} error={error} className={className}>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className='border-2 border-blue-200 focus:border-blue-500'
      />
    </FormField>
  )
}

export interface SelectFieldProps {
  label: string
  id?: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SelectField({
  label,
  id,
  required,
  error,
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  disabled,
  className = '',
}: SelectFieldProps) {
  return (
    <FormField label={label} id={id} required={required} error={error} className={className}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className='border-2 border-blue-200'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className='max-h-[300px] overflow-y-auto'>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}

export interface SwitchFieldProps {
  label: string
  id?: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function SwitchField({
  label,
  id,
  description,
  checked,
  onCheckedChange,
  disabled,
  className = '',
}: SwitchFieldProps) {
  return (
    <div className={`flex items-center justify-between space-x-4 p-4 border-2 border-blue-100 rounded-lg ${className}`}>
      <div className='flex-1'>
        <Label htmlFor={id} className='cursor-pointer'>
          {label}
        </Label>
        {description && <p className='text-sm text-gray-500 mt-1'>{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

export interface FormGridProps {
  cols?: 1 | 2 | 3
  gap?: number
  children: React.ReactNode
  className?: string
}

export function FormGrid({ cols = 2, gap = 4, children, className = '' }: FormGridProps) {
  const gridClass = cols === 1 ? '' : cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
  return <div className={`grid grid-cols-1 ${gridClass} gap-${gap} ${className}`}>{children}</div>
}

export interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className='space-y-1'>
          {title && <h3 className='text-lg font-medium text-gray-900'>{title}</h3>}
          {description && <p className='text-sm text-gray-500'>{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// Export upload components
export { ImageUploadField } from './ImageUploadField'
export { MultipleImageUploadField } from './MultipleImageUploadField'
