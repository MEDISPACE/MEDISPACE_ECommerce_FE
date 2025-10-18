import { ContentManagementPage } from '~/components/admin'

export function meta() {
  return [
    { title: 'Quản lý nội dung | MEDISPACE Admin' },
    { name: 'description', content: 'Quản lý bài viết và nội dung website' },
  ]
}

export default function ContentRoute() {
  return <ContentManagementPage />
}
