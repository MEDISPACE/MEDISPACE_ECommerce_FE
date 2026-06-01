import apiClient from '../apiClient'

/**
 * Helper to download Blob data
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Universal Export Function that calls Backend API
 */
export const downloadExportFile = async (
  format: 'excel' | 'pdf',
  timeRange: string,
  startDate?: string,
  endDate?: string,
) => {
  try {
    const response = await apiClient.get<Blob>('/admin/reports/export', {
      params: { format, timeRange, startDate, endDate },
      responseType: 'blob',
    })

    // Lấy lại Content-Disposition nếu có
    const contentDisposition = response.headers['content-disposition']
    let filename = `MEDISPACE_BaoCao_${timeRange}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch && filenameMatch.length === 2) {
        filename = decodeURIComponent(filenameMatch[1])
      }
    }

    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data as BlobPart], {
            type:
              format === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })

    downloadBlob(blob, filename)
  } catch (error) {
    console.error(`Export ${format.toUpperCase()} failed:`, error)
    throw error
  }
}

// Preserve these exports as zombies for any old imports, they just throw error
export const exportToExcel = () => {
  throw new Error("exportToExcel is deprecated on FE, use downloadExportFile('excel', ...)")
}
export const exportToPDF = () => {
  throw new Error("exportToPDF is deprecated on FE, use downloadExportFile('pdf', ...)")
}
export const getTimeRangeLabel = () => ''
export const getTimeRangeLabelVi = () => ''
