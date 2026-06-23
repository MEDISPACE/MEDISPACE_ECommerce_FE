export const users = {
  standard: {
    id: 'user-standard',
    email: 'standard.account@medispace.test',
    password: 'Password!123',
    name: 'Tran Bao',
    firstName: 'Tran',
    lastName: 'Bao',
    phone: '0901234567',
    dob: '1995-01-15',
    gender: 'male',
    token: 'standard-account-token',
  },
  other: {
    id: 'user-other',
    email: 'other.account@medispace.test',
    password: 'Password!123',
    name: 'Other User',
    token: 'other-account-token',
  },
  socialOnly: {
    id: 'user-social',
    email: 'social.account@medispace.test',
    name: 'Social User',
    provider: 'google',
  },
}

export type AccountFixtureUser = typeof users.standard
