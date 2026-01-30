import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const Login = () => {
  const [uid, setUid] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!uid || !pass) {
      alert('⚠️ أدخل اسم المستخدم وكلمة السر')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', uid)
        .eq('password', pass)
        .maybeSingle()

      if (error) throw error

      if (data) {
        sessionStorage.setItem('user', JSON.stringify(data))
        if (data.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/inspector')
        }
      } else {
        alert('❌ بيانات خاطئة')
      }
    } catch (err) {
      alert('خطأ في الاتصال: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <div className="login-card">
        <h1 style={{ color: 'var(--sec-blue)', fontSize: '24px', marginBottom: '20px' }}>نظام السلامة الميداني 🛡️</h1>
        <input
          className="login-input"
          placeholder="اسم المستخدم"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <input
          className="login-input"
          type="password"
          placeholder="كلمة السر"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button className="login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'جاري الدخول...' : 'دخول 🚀'}
        </button>

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f4ff', borderRadius: '6px', fontSize: '12px' }}>
          <p style={{ marginBottom: '8px' }}>بيانات الاختبار:</p>
          <p>👤 admin / admin2025</p>
          <p>👷 fox / 12 </p>
        </div>
      </div>
    </div>
  )
}

export default Login
