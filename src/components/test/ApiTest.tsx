import React, { useState } from 'react'
import { authService } from '~/services/authService'

const ApiTest: React.FC = () => {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await authService.login({
        email: 'test@example.com',
        password: 'Test123!@#',
      })
      setResult('Login Success: ' + JSON.stringify(response, null, 2))
    } catch (error) {
      setResult('Login Error: ' + JSON.stringify(error, null, 2))
    }
    setLoading(false)
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const response = await authService.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'test' + Date.now() + '@example.com',
        password: 'Test123!@#',
        confirm_password: 'Test123!@#',
        phoneNumber: '0123456789',
        gender: 0,
      })
      setResult('Register Success: ' + JSON.stringify(response, null, 2))
    } catch (error) {
      setResult('Register Error: ' + JSON.stringify(error, null, 2))
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>API Test Component</h2>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testLogin} disabled={loading} style={{ marginRight: '10px', padding: '10px 20px' }}>
          {loading ? 'Loading...' : 'Test Login'}
        </button>

        <button onClick={testRegister} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Loading...' : 'Test Register'}
        </button>
      </div>

      <div>
        <h3>API Response:</h3>
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflowX: 'auto',
          }}
        >
          {result || 'Click a button to test API'}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Backend API Status:</h4>
        <p>
          Make sure your backend is running at: <code>http://localhost:4000</code>
        </p>
        <p>Set REACT_APP_API_URL in your .env file if different.</p>
      </div>
    </div>
  )
}

export default ApiTest
