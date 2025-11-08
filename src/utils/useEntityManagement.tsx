/**
 * ============================================================================
 * useEntityManagement Hook - Universal CRUD Management for Admin Pages
 * ============================================================================
 *
 * Reusable hook for managing entities (Users, Products, Categories, Pharmacists, etc.)
 * Handles all CRUD operations, dialog/sheet states, form data, and validation
 *
 * Features:
 * - Generic type support for any entity
 * - Add/Edit/Delete operations
 * - Form state management
 * - Dialog and Sheet (Drawer) support
 * - Validation with custom validators
 * - Toast notifications
 * - Auto ID generation
 * - Bulk operations support
 *
 * Usage Example:
 * ```tsx
 * const {
 *   entities,
 *   formState,
 *   dialogState,
 *   handleAdd,
 *   handleEdit,
 *   handleDelete,
 *   EntityFormDialog
 * } = useEntityManagement({
 *   initialEntities: mockUsers,
 *   entityName: 'User',
 *   entityNameVi: 'Người dùng',
 *   fields: USER_FORM_FIELDS,
 *   validator: validateUser
 * });
 * ```
 *
 * @module useEntityManagement
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

/**
 * Generic Entity with required ID field
 */
export interface BaseEntity {
  id: string | number
  // Allow any additional properties without strict typing
  // This makes BaseEntity flexible for use with various entity types
}

/**
 * Form field configuration for EntityFormFields component
 */
export interface FormField {
  name: string
  label: string
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'textarea'
    | 'select'
    | 'number'
    | 'date'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'multi-select'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  accept?: string
  multiple?: boolean
  rows?: number
  defaultValue?: unknown
  description?: string
  disabled?: boolean
  hidden?: boolean
  validation?: (value: unknown) => string | null
}

/**
 * Dialog/Sheet state management
 */
export interface DialogState<T> {
  isOpen: boolean
  mode: 'add' | 'edit' | 'view' | 'delete'
  entity: T | null
}

/**
 * Form state management
 */
export interface FormState<T> {
  data: Partial<T>
  errors: Record<string, string>
  isSubmitting: boolean
}

/**
 * Hook configuration options
 */
export interface UseEntityManagementOptions<T extends BaseEntity> {
  initialEntities: T[]
  entityName: string
  entityNameVi: string
  fields: FormField[]
  validator?: (data: Partial<T>) => Record<string, string>
  onAdd?: (entity: T) => void | Promise<void>
  onEdit?: (entity: T) => void | Promise<void>
  onDelete?: (id: string | number) => void | Promise<void>
  generateId?: () => string | number
}

/**
 * Hook return type
 */
export interface UseEntityManagementReturn<T extends BaseEntity> {
  // State
  entities: T[]
  setEntities: React.Dispatch<React.SetStateAction<T[]>>
  dialogState: DialogState<T>
  formState: FormState<T>

  // Dialog actions
  openAddDialog: () => void
  openEditDialog: (entity: T) => void
  openDeleteDialog: (entity: T) => void
  openViewDialog: (entity: T) => void
  closeDialog: () => void

  // CRUD operations
  handleAdd: (data: Partial<T>) => Promise<boolean>
  handleEdit: (data: Partial<T>) => Promise<boolean>
  handleDelete: (id: string | number) => Promise<boolean>

  // Form actions
  updateFormData: (field: string, value: unknown) => void
  setFormErrors: (errors: Record<string, string>) => void
  resetForm: () => void

  // Bulk operations
  handleBulkDelete: (ids: (string | number)[]) => Promise<boolean>

  // Configuration
  config: {
    entityName: string
    entityNameVi: string
    fields: FormField[]
  }
}

/**
 * Main hook for entity management
 */
export function useEntityManagement<T extends { id: string | number }>(
  options: UseEntityManagementOptions<T>,
): UseEntityManagementReturn<T> {
  const {
    initialEntities,
    entityName,
    entityNameVi,
    fields,
    validator,
    onAdd,
    onEdit,
    onDelete,
    generateId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  } = options

  // State
  const [entities, setEntities] = useState<T[]>(initialEntities)
  const [dialogState, setDialogState] = useState<DialogState<T>>({
    isOpen: false,
    mode: 'add',
    entity: null,
  })
  const [formState, setFormState] = useState<FormState<T>>({
    data: {},
    errors: {},
    isSubmitting: false,
  })

  // Dialog actions
  const openAddDialog = useCallback(() => {
    setDialogState({ isOpen: true, mode: 'add', entity: null })
    setFormState({ data: {}, errors: {}, isSubmitting: false })
  }, [])

  const openEditDialog = useCallback((entity: T) => {
    setDialogState({ isOpen: true, mode: 'edit', entity })
    setFormState({ data: entity, errors: {}, isSubmitting: false })
  }, [])

  const openDeleteDialog = useCallback((entity: T) => {
    setDialogState({ isOpen: true, mode: 'delete', entity })
  }, [])

  const openViewDialog = useCallback((entity: T) => {
    setDialogState({ isOpen: true, mode: 'view', entity })
    setFormState({ data: entity, errors: {}, isSubmitting: false })
  }, [])

  const closeDialog = useCallback(() => {
    setDialogState({ isOpen: false, mode: 'add', entity: null })
    setFormState({ data: {}, errors: {}, isSubmitting: false })
  }, [])

  // Form actions
  const updateFormData = useCallback((field: string, value: unknown) => {
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' }, // Clear error when field is updated
    }))
  }, [])

  const setFormErrors = useCallback((errors: Record<string, string>) => {
    setFormState((prev) => ({ ...prev, errors }))
  }, [])

  const resetForm = useCallback(() => {
    setFormState({ data: {}, errors: {}, isSubmitting: false })
  }, [])

  // Validation
  const validateForm = useCallback(
    (data: Partial<T>): boolean => {
      if (!validator) return true

      const errors = validator(data)
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return false
      }
      return true
    },
    [validator, setFormErrors],
  )

  // CRUD operations
  const handleAdd = useCallback(
    async (data: Partial<T>): Promise<boolean> => {
      try {
        setFormState((prev) => ({ ...prev, isSubmitting: true }))

        // Validate
        if (!validateForm(data)) {
          setFormState((prev) => ({ ...prev, isSubmitting: false }))
          return false
        }

        // Create new entity
        const newEntity = {
          ...data,
          id: generateId(),
        } as T

        // Call custom onAdd handler if provided
        if (onAdd) {
          await onAdd(newEntity)
        }

        // Update state
        setEntities((prev) => [...prev, newEntity])

        // Show success toast
        toast.success(`Thêm ${entityNameVi.toLowerCase()} thành công!`, {
          description: `${entityName} đã được thêm vào hệ thống.`,
        })

        // Close dialog and reset form
        closeDialog()
        return true
      } catch (error) {
        toast.error(`Không thể thêm ${entityNameVi.toLowerCase()}`, {
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        })
        return false
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [validateForm, generateId, onAdd, entityName, entityNameVi, closeDialog],
  )

  const handleEdit = useCallback(
    async (data: Partial<T>): Promise<boolean> => {
      try {
        setFormState((prev) => ({ ...prev, isSubmitting: true }))

        // Validate
        if (!validateForm(data)) {
          setFormState((prev) => ({ ...prev, isSubmitting: false }))
          return false
        }

        // Ensure we have an ID
        if (!data.id) {
          throw new Error('Entity ID is required for edit operation')
        }

        // Create updated entity
        const updatedEntity = {
          ...dialogState.entity,
          ...data,
        } as T

        // Call custom onEdit handler if provided
        if (onEdit) {
          await onEdit(updatedEntity)
        }

        // Update state
        setEntities((prev) => prev.map((entity) => (entity.id === data.id ? updatedEntity : entity)))

        // Show success toast
        toast.success(`Cập nhật ${entityNameVi.toLowerCase()} thành công!`, {
          description: `Thông tin ${entityName} đã được cập nhật.`,
        })

        // Close dialog and reset form
        closeDialog()
        return true
      } catch (error) {
        toast.error(`Không thể cập nhật ${entityNameVi.toLowerCase()}`, {
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        })
        return false
      } finally {
        setFormState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [validateForm, onEdit, dialogState.entity, entityName, entityNameVi, closeDialog],
  )

  const handleDelete = useCallback(
    async (id: string | number): Promise<boolean> => {
      try {
        // Call custom onDelete handler if provided
        if (onDelete) {
          await onDelete(id)
        }

        // Update state
        setEntities((prev) => prev.filter((entity) => entity.id !== id))

        // Show success toast
        toast.success(`Xóa ${entityNameVi.toLowerCase()} thành công!`, {
          description: `${entityName} đã được xóa khỏi hệ thống.`,
        })

        // Close dialog
        closeDialog()
        return true
      } catch (error) {
        toast.error(`Không thể xóa ${entityNameVi.toLowerCase()}`, {
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        })
        return false
      }
    },
    [onDelete, entityName, entityNameVi, closeDialog],
  )

  const handleBulkDelete = useCallback(
    async (ids: (string | number)[]): Promise<boolean> => {
      try {
        // Call onDelete for each ID if provided
        if (onDelete) {
          await Promise.all(ids.map((id) => onDelete(id)))
        }

        // Update state
        setEntities((prev) => prev.filter((entity) => !ids.includes(entity.id)))

        // Show success toast
        toast.success(`Xóa ${ids.length} ${entityNameVi.toLowerCase()} thành công!`, {
          description: `Các ${entityName} đã được xóa khỏi hệ thống.`,
        })

        return true
      } catch (error) {
        toast.error(`Không thể xóa ${entityNameVi.toLowerCase()}`, {
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        })
        return false
      }
    },
    [onDelete, entityName, entityNameVi],
  )

  return {
    // State
    entities,
    setEntities,
    dialogState,
    formState,

    // Dialog actions
    openAddDialog,
    openEditDialog,
    openDeleteDialog,
    openViewDialog,
    closeDialog,

    // CRUD operations
    handleAdd,
    handleEdit,
    handleDelete,

    // Form actions
    updateFormData,
    setFormErrors,
    resetForm,

    // Bulk operations
    handleBulkDelete,

    // Configuration
    config: {
      entityName,
      entityNameVi,
      fields,
    },
  }
}
