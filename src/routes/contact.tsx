import { ContactUsPage } from '~/components/info'

export function meta() {
  return [{ title: 'Liên hệ | MEDISPACE' }, { name: 'description', content: 'Thông tin liên hệ và hỗ trợ khách hàng' }]
}

export default function ContactRoute() {
  return <ContactUsPage />
}
