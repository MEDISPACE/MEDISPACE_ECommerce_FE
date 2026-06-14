export type HealthNeedSeverity = 'selfcare' | 'pharmacist' | 'doctor'

export interface HealthNeedProductGroup {
  title: string
  query: string
  description: string
}

export interface HealthNeed {
  slug: string
  label: string
  shortLabel: string
  summary: string
  description: string
  icon: 'thermometer' | 'activity' | 'heartPulse' | 'bone' | 'leaf' | 'user' | 'droplets' | 'shield'
  searchQuery: string
  keywords: string[]
  productGroups: HealthNeedProductGroup[]
  caution: string
  whenToAsk: string[]
  severity: HealthNeedSeverity
}

export const healthNeeds: HealthNeed[] = [
  {
    slug: 'cam-cum',
    label: 'Cảm cúm',
    shortLabel: 'Cảm cúm',
    summary: 'Ho, sốt nhẹ, nghẹt mũi, đau họng',
    description: 'Gợi ý nhóm sản phẩm hỗ trợ chăm sóc triệu chứng cảm cúm thông thường và hướng dẫn khi nào nên hỏi dược sĩ.',
    icon: 'thermometer',
    searchQuery: 'cảm cúm ho sốt nghẹt mũi',
    keywords: ['cảm cúm', 'ho', 'sốt', 'nghẹt mũi', 'đau họng'],
    productGroups: [
      { title: 'Hạ sốt, giảm đau', query: 'hạ sốt paracetamol', description: 'Dùng đúng liều theo tuổi, cân nặng và tình trạng gan.' },
      { title: 'Ho, đau họng', query: 'ho đau họng', description: 'Ưu tiên sản phẩm phù hợp loại ho và độ tuổi.' },
      { title: 'Nghẹt mũi', query: 'nghẹt mũi nước muối sinh lý', description: 'Làm sạch mũi họng, hỗ trợ dễ thở hơn.' },
    ],
    caution: 'Không tự dùng kháng sinh hoặc phối hợp nhiều thuốc cảm cúm có cùng hoạt chất nếu chưa được tư vấn.',
    whenToAsk: ['Sốt cao hoặc kéo dài trên 2 ngày', 'Trẻ nhỏ, phụ nữ mang thai hoặc người có bệnh nền', 'Khó thở, đau ngực, lơ mơ hoặc mất nước'],
    severity: 'pharmacist',
  },
  {
    slug: 'dau-dau',
    label: 'Đau đầu',
    shortLabel: 'Đau đầu',
    summary: 'Đau đầu, đau cơ, căng thẳng nhẹ',
    description: 'Tìm sản phẩm hỗ trợ giảm đau thông thường và nhận biết các dấu hiệu cần thận trọng.',
    icon: 'activity',
    searchQuery: 'đau đầu giảm đau',
    keywords: ['đau đầu', 'giảm đau', 'đau cơ', 'paracetamol'],
    productGroups: [
      { title: 'Giảm đau thông thường', query: 'giảm đau đau đầu', description: 'Chọn theo tiền sử bệnh, thuốc đang dùng và chống chỉ định.' },
      { title: 'Dầu, gel xoa bóp', query: 'dầu xoa bóp đau đầu', description: 'Hỗ trợ thư giãn trong một số trường hợp đau căng cơ.' },
      { title: 'Bổ sung hỗ trợ', query: 'magie vitamin nhóm b', description: 'Phù hợp hơn với nhu cầu chăm sóc dài hạn.' },
    ],
    caution: 'Đau đầu dữ dội đột ngột, kèm yếu liệt, nôn ói hoặc rối loạn thị giác cần đi khám ngay.',
    whenToAsk: ['Đang dùng thuốc chống đông hoặc có bệnh gan thận', 'Đau đầu tái phát thường xuyên', 'Đau sau chấn thương hoặc kèm triệu chứng thần kinh'],
    severity: 'pharmacist',
  },
  {
    slug: 'tieu-duong',
    label: 'Tiểu đường',
    shortLabel: 'Tiểu đường',
    summary: 'Theo dõi đường huyết, chăm sóc bệnh nền',
    description: 'Tập trung vào sản phẩm hỗ trợ theo dõi, chăm sóc và bổ sung phù hợp cho người cần kiểm soát đường huyết.',
    icon: 'droplets',
    searchQuery: 'tiểu đường đường huyết máy đo đường huyết',
    keywords: ['tiểu đường', 'đường huyết', 'máy đo đường huyết', 'bệnh nền'],
    productGroups: [
      { title: 'Theo dõi đường huyết', query: 'máy đo đường huyết que thử', description: 'Thiết bị và vật tư theo dõi tại nhà.' },
      { title: 'Chăm sóc da chân', query: 'chăm sóc da chân tiểu đường', description: 'Hỗ trợ chăm sóc vùng da dễ khô, nứt.' },
      { title: 'Dinh dưỡng hỗ trợ', query: 'sữa tiểu đường đường huyết', description: 'Cần chọn theo mục tiêu dinh dưỡng cá nhân.' },
    ],
    caution: 'Không thay thế thuốc điều trị tiểu đường bằng thực phẩm bổ sung nếu chưa có chỉ định của bác sĩ.',
    whenToAsk: ['Đường huyết dao động bất thường', 'Có vết thương lâu lành hoặc tê bì chân tay', 'Đang dùng insulin hoặc nhiều thuốc điều trị cùng lúc'],
    severity: 'doctor',
  },
  {
    slug: 'huyet-ap',
    label: 'Huyết áp',
    shortLabel: 'Huyết áp',
    summary: 'Theo dõi huyết áp, chăm sóc tim mạch',
    description: 'Gợi ý thiết bị và sản phẩm hỗ trợ theo dõi huyết áp, kèm các cảnh báo cần đi khám.',
    icon: 'heartPulse',
    searchQuery: 'huyết áp máy đo huyết áp tim mạch',
    keywords: ['huyết áp', 'máy đo huyết áp', 'tim mạch', 'theo dõi tại nhà'],
    productGroups: [
      { title: 'Máy đo huyết áp', query: 'máy đo huyết áp', description: 'Theo dõi chỉ số đều đặn tại nhà.' },
      { title: 'Sức khỏe tim mạch', query: 'omega 3 tim mạch huyết áp', description: 'Sản phẩm hỗ trợ, không thay thuốc điều trị.' },
      { title: 'Theo dõi sức khỏe', query: 'nhiệt kế máy đo spo2', description: 'Thiết bị hữu ích cho gia đình có người bệnh nền.' },
    ],
    caution: 'Không tự ý ngưng hoặc đổi thuốc huyết áp. Đau ngực, khó thở, yếu liệt cần cấp cứu.',
    whenToAsk: ['Chỉ số huyết áp quá cao hoặc quá thấp bất thường', 'Đang dùng thuốc huyết áp, lợi tiểu hoặc thuốc tim mạch', 'Đau ngực, khó thở, choáng, yếu một bên người'],
    severity: 'doctor',
  },
  {
    slug: 'tim-mach',
    label: 'Tim mạch',
    shortLabel: 'Tim mạch',
    summary: 'Hỗ trợ sức khỏe tim, mạch máu',
    description: 'Tổng hợp nhóm sản phẩm hỗ trợ sức khỏe tim mạch và nhắc người dùng không tự thay đổi phác đồ điều trị.',
    icon: 'heartPulse',
    searchQuery: 'tim mạch omega 3 huyết áp cholesterol',
    keywords: ['tim mạch', 'omega 3', 'cholesterol', 'huyết áp'],
    productGroups: [
      { title: 'Omega 3 và dầu cá', query: 'omega 3 dầu cá tim mạch', description: 'Cần lưu ý khi dùng cùng thuốc chống đông.' },
      { title: 'Theo dõi tại nhà', query: 'máy đo huyết áp tim mạch', description: 'Hỗ trợ theo dõi chỉ số thường xuyên.' },
      { title: 'Dinh dưỡng hỗ trợ', query: 'cholesterol tim mạch', description: 'Kết hợp chế độ ăn và vận động phù hợp.' },
    ],
    caution: 'Người có bệnh tim mạch nên hỏi dược sĩ/bác sĩ trước khi dùng thêm sản phẩm bổ sung.',
    whenToAsk: ['Đang dùng thuốc chống đông, huyết áp hoặc tim mạch', 'Đau ngực, hồi hộp, khó thở', 'Có tiền sử đột quỵ hoặc nhồi máu cơ tim'],
    severity: 'doctor',
  },
  {
    slug: 'xuong-khop',
    label: 'Xương khớp',
    shortLabel: 'Xương khớp',
    summary: 'Đau nhức, vận động, bổ sung xương khớp',
    description: 'Gợi ý nhóm sản phẩm hỗ trợ vận động, giảm khó chịu và bổ sung dưỡng chất cho xương khớp.',
    icon: 'bone',
    searchQuery: 'xương khớp đau lưng canxi glucosamine',
    keywords: ['xương khớp', 'đau lưng', 'canxi', 'glucosamine'],
    productGroups: [
      { title: 'Gel, dầu xoa bóp', query: 'gel dầu xoa bóp xương khớp', description: 'Hỗ trợ giảm khó chịu tại chỗ.' },
      { title: 'Canxi, vitamin D', query: 'canxi vitamin d xương khớp', description: 'Phù hợp nhu cầu bổ sung theo độ tuổi.' },
      { title: 'Glucosamine', query: 'glucosamine xương khớp', description: 'Cần lưu ý bệnh nền và thuốc đang dùng.' },
    ],
    caution: 'Đau khớp sưng nóng đỏ, sau chấn thương hoặc kèm sốt cần đi khám thay vì tự xử trí kéo dài.',
    whenToAsk: ['Đau kéo dài, hạn chế vận động rõ', 'Đang dùng thuốc chống đông hoặc có bệnh dạ dày', 'Người cao tuổi, phụ nữ mang thai hoặc bệnh thận'],
    severity: 'pharmacist',
  },
  {
    slug: 'vitamin',
    label: 'Vitamin & khoáng chất',
    shortLabel: 'Vitamin',
    summary: 'Bổ sung dưỡng chất, miễn dịch, năng lượng',
    description: 'Đi theo nhu cầu bổ sung phổ biến, tránh chọn trùng lặp hoạt chất hoặc dùng quá liều.',
    icon: 'leaf',
    searchQuery: 'vitamin khoáng chất vitamin c vitamin d kẽm',
    keywords: ['vitamin', 'khoáng chất', 'vitamin c', 'vitamin d', 'kẽm'],
    productGroups: [
      { title: 'Vitamin C, kẽm', query: 'vitamin c kẽm miễn dịch', description: 'Hỗ trợ nhu cầu miễn dịch và phục hồi.' },
      { title: 'Vitamin D, canxi', query: 'vitamin d canxi', description: 'Phù hợp sức khỏe xương và nhu cầu thiếu hụt.' },
      { title: 'Multivitamin', query: 'multivitamin', description: 'Tiện lợi nhưng cần tránh trùng hoạt chất.' },
    ],
    caution: 'Vitamin không phải càng nhiều càng tốt. Một số loại có thể tương tác thuốc hoặc không phù hợp bệnh nền.',
    whenToAsk: ['Đang mang thai hoặc cho con bú', 'Có bệnh gan, thận hoặc sỏi thận', 'Đang dùng nhiều sản phẩm bổ sung cùng lúc'],
    severity: 'selfcare',
  },
  {
    slug: 'phu-nu',
    label: 'Sức khỏe phụ nữ',
    shortLabel: 'Phụ nữ',
    summary: 'Chăm sóc phụ nữ, thai kỳ, nội tiết',
    description: 'Gợi ý sản phẩm chăm sóc sức khỏe nữ giới với lưu ý riêng cho thai kỳ, cho con bú và bệnh nền.',
    icon: 'user',
    searchQuery: 'sức khỏe phụ nữ sắt acid folic vệ sinh phụ nữ',
    keywords: ['phụ nữ', 'sắt', 'acid folic', 'vệ sinh phụ nữ', 'thai kỳ'],
    productGroups: [
      { title: 'Sắt, acid folic', query: 'sắt acid folic phụ nữ', description: 'Cần chọn theo giai đoạn và nhu cầu cá nhân.' },
      { title: 'Vệ sinh phụ nữ', query: 'vệ sinh phụ nữ', description: 'Ưu tiên sản phẩm dịu nhẹ, phù hợp vùng nhạy cảm.' },
      { title: 'Chăm sóc thai kỳ', query: 'vitamin bà bầu thai kỳ', description: 'Nên hỏi dược sĩ trước khi dùng trong thai kỳ.' },
    ],
    caution: 'Phụ nữ mang thai, cho con bú hoặc có triệu chứng phụ khoa bất thường nên hỏi chuyên môn trước khi mua.',
    whenToAsk: ['Đang mang thai, cho con bú hoặc chuẩn bị mang thai', 'Ra huyết, đau bụng, khí hư bất thường', 'Đang dùng thuốc nội tiết hoặc điều trị bệnh nền'],
    severity: 'pharmacist',
  },
]

export const getHealthNeedBySlug = (slug?: string) => healthNeeds.find((need) => need.slug === slug)
