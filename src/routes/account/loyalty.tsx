import { Navigate } from 'react-router'

export default function LoyaltyRedirectRoute() {
  return <Navigate to='/account/rewards' replace />
}
