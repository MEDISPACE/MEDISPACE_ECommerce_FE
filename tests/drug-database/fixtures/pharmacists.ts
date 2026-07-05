export const pharmacistUsers = {
  pharmacistA: {
    _id: '65f900000000000000000901',
    email: 'pharmacist.a@medispace.test',
    password: 'Test@123456',
    role: 1,
    firstName: 'Pharma',
    lastName: 'A',
    accessToken: 'test-pharmacist-a-token',
  },
  pharmacistB: {
    _id: '65f900000000000000000902',
    email: 'pharmacist.b@medispace.test',
    password: 'Test@123456',
    role: 1,
    firstName: 'Pharma',
    lastName: 'B',
    accessToken: 'test-pharmacist-b-token',
  },
  customer: {
    _id: '65f900000000000000000903',
    email: 'customer@medispace.test',
    password: 'Test@123456',
    role: 0,
    firstName: 'Customer',
    lastName: 'User',
    accessToken: 'test-customer-token',
  },
  admin: {
    _id: '65f900000000000000000904',
    email: 'admin@medispace.test',
    password: 'Test@123456',
    role: 2,
    firstName: 'Admin',
    lastName: 'User',
    accessToken: 'test-admin-token',
  },
}

export default pharmacistUsers
