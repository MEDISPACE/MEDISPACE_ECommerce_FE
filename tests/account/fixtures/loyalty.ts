export const loyalty = {
  withHistory: {
    balance: 1250,
    tier: 'member',
    transactions: [
      {
        id: 'loyalty-1',
        type: 'earned',
        points: 500,
        balanceAfter: 500,
        description: 'Tích điểm đơn MS-1001',
        createdAt: '2026-06-20T09:00:00.000Z',
      },
      {
        id: 'loyalty-2',
        type: 'redeemed',
        points: -100,
        balanceAfter: 400,
        description: 'Đổi điểm đơn MS-1002',
        createdAt: '2026-06-21T09:00:00.000Z',
      },
      {
        id: 'loyalty-3',
        type: 'expired',
        points: -50,
        balanceAfter: 350,
        description: 'Điểm hết hạn',
        createdAt: '2026-06-22T09:00:00.000Z',
      },
    ],
  },
}
