import React, { type ReactNode } from 'react'
import { Search, FileX } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { StatsCardGrid, type StatCardConfig } from '../../utils/useStatsCards'
import { PaginationComponent } from './PaginationComponent'
import { EmptyState } from './EmptyState'

/**
 * Column Configuration for Table
 */
export interface ColumnConfig<T = Record<string, unknown>> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

/**
 * Filter Configuration
 */
export interface FilterConfig {
  key: string
  label: string
  placeholder: string
  options: { value: string; label: string }[]
}

/**
 * Action Button Configuration
 */
export interface ActionButtonConfig {
  label: string
  icon: React.ElementType
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

/**
 * Management Page Props
 */
export interface ManagementPageTemplateProps<T = Record<string, unknown>> {
  // Header
  title: string
  description?: string
  icon?: React.ElementType

  // Stats
  stats?: StatCardConfig[]

  // Actions
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ElementType
  }
  secondaryActions?: ActionButtonConfig[]

  // Search & Filters
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: FilterConfig[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void

  // Table
  columns: ColumnConfig<T>[]
  data: T[]
  loading?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  renderRow?: (item: T, index: number) => ReactNode

  // Pagination
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  totalItems?: number

  // Bulk actions
  selectable?: boolean
  selectedItems?: string[]
  onSelectionChange?: (ids: string[]) => void
  bulkActions?: ActionButtonConfig[]

  // Custom content
  headerExtra?: ReactNode
  beforeTable?: ReactNode
  afterTable?: ReactNode

  // Layout wrapper (AdminLayout, PharmacistLayout, etc)
  layout?: React.ComponentType<{ children: ReactNode }>
}

/**
 * Management Page Template Component
 */
export function ManagementPageTemplate<T extends { id: string }>({
  title,
  description,
  icon: Icon,
  stats,
  primaryAction,
  secondaryActions,
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  columns,
  data,
  loading,
  emptyStateTitle = 'Chưa có dữ liệu',
  emptyStateDescription = 'Hãy thêm mục mới để bắt đầu',
  renderRow,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  selectable,
  selectedItems = [],
  onSelectionChange,
  bulkActions,
  headerExtra,
  beforeTable,
  afterTable,
  layout: Layout,
}: ManagementPageTemplateProps<T>) {
  // Wrap content in layout if provided
  const content = (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {Icon && (
            <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] flex items-center justify-center'>
              <Icon className='w-6 h-6 text-white' />
            </div>
          )}
          <div>
            <h1 className='text-3xl bg-gradient-to-r from-[#0066CC] to-[#4A90E2] bg-clip-text text-transparent'>
              {title}
            </h1>
            {description && <p className='text-gray-600 mt-1'>{description}</p>}
          </div>
        </div>

        <div className='flex gap-2'>
          {secondaryActions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              onClick={action.onClick}
              className={action.className || 'gap-2'}
            >
              <action.icon className='w-4 h-4' />
              {action.label}
            </Button>
          ))}

          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className='bg-gradient-to-r from-[#0066CC] to-[#4A90E2] hover:from-[#0052A3] hover:to-[#3A7BC8] gap-2'
            >
              {primaryAction.icon && <primaryAction.icon className='w-4 h-4' />}
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {/* Header Extra */}
      {headerExtra}

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <StatsCardGrid>
          {stats.map((stat, index) => (
            <div key={index}>{/* Render individual stat card here */}</div>
          ))}
        </StatsCardGrid>
      )}

      {/* Filters & Search */}
      <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            {/* Search */}
            {onSearchChange && (
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className='pl-10 border-2 border-blue-200 focus:border-blue-500'
                  />
                </div>
              </div>
            )}

            {/* Filters */}
            {filters &&
              filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={filterValues?.[filter.key] || 'all'}
                  onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                  <SelectTrigger className='w-full md:w-[200px] border-2 border-blue-200 focus:border-blue-500'>
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
          </div>

          {/* Bulk Actions */}
          {bulkActions && selectedItems.length > 0 && (
            <div className='mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <span className='text-sm text-gray-600'>Đã chọn {selectedItems.length} mục</span>
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  size='sm'
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className={action.className}
                >
                  <action.icon className='w-4 h-4 mr-1' />
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Before Table */}
      {beforeTable}

      {/* Data Table */}
      <Card className='bg-white backdrop-blur-lg shadow-lg rounded-2xl border border-blue-100'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow className='bg-gradient-to-r from-blue-50 to-cyan-50'>
                  {selectable && (
                    <TableHead className='w-12'>
                      <input
                        type='checkbox'
                        checked={selectedItems.length === data.length && data.length > 0}
                        onChange={(e) => {
                          if (onSelectionChange) {
                            onSelectionChange(e.target.checked ? data.map((item) => item.id) : [])
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      style={{ width: column.width }}
                      className={
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                      }
                    >
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className='text-center py-12'>
                      <div className='flex items-center justify-center gap-2'>
                        <div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
                        <span className='text-gray-600'>Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className='text-center py-12'>
                      <EmptyState icon={<FileX />} title={emptyStateTitle} description={emptyStateDescription} />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) =>
                    renderRow ? (
                      renderRow(item, index)
                    ) : (
                      <TableRow key={item.id}>
                        {selectable && (
                          <TableCell>
                            <input
                              type='checkbox'
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => {
                                if (onSelectionChange) {
                                  if (e.target.checked) {
                                    onSelectionChange([...selectedItems, item.id])
                                  } else {
                                    onSelectionChange(selectedItems.filter((id) => id !== item.id))
                                  }
                                }
                              }}
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={
                              column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                            }
                          >
                            {column.render
                              ? column.render(item)
                              : String((item as Record<string, unknown>)[column.key] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* After Table */}
      {afterTable}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )

  // Return with or without layout wrapper
  return Layout ? <Layout>{content}</Layout> : content
}
