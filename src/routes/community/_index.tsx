import { CommunityRoomsPage } from '~/components/community/CommunityRoomsPage'

export function meta() {
  return [{ title: 'Cộng đồng | MEDISPACE' }, { name: 'description', content: 'Phòng cộng đồng theo nhóm bệnh' }]
}

export default function CommunityRoomsRoute() {
  return <CommunityRoomsPage />
}
