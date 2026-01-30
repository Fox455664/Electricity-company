import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const Login = () => {
  const [uid, setUid] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    if (e) e.preventDefault() // لمنع إعادة تحميل الصفحة عند ضغط Enter

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
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } catch (err) {
      alert('خطأ في الاتصال: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Styles (CSS-in-JS) ---
  const styles = `
    :root {
      --sec-blue: #005a8f;
      --sec-dark-blue: #003f63;
      --sec-orange: #f28b00;
      --sec-orange-hover: #d97b00;
    }

    body {
      margin: 0;
      font-family: 'Cairo', sans-serif;
      background: linear-gradient(135deg, var(--sec-blue) 0%, var(--sec-dark-blue) 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .login-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .login-card {
      background: white;
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      padding: 40px 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      text-align: center;
      position: relative;
      overflow: hidden;
      border-top: 8px solid var(--sec-orange);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-container {
      margin-bottom: 25px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 20px;
    }

    .sec-logo {
      height: 80px;
      object-fit: contain;
      margin-bottom: 10px;
    }

    .titles-container {
      margin-bottom: 30px;
    }

    .main-title {
      color: var(--sec-blue);
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 5px 0;
    }

    .sub-title {
      color: var(--sec-orange);
      font-size: 18px;
      font-weight: 700;
      margin: 5px 0;
    }

    .desc-text {
      color: var(--sec-blue);
      font-size: 14px;
      font-weight: 600;
      margin-top: 5px;
      opacity: 0.9;
    }

    .input-group {
      position: relative;
      margin-bottom: 15px;
      text-align: right;
    }

    .input-icon {
      position: absolute;
      top: 50%;
      right: 15px;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 18px;
    }

    .modern-input {
      width: 100%;
      padding: 14px 45px 14px 15px; /* مسافة للأيقونة يمين */
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      font-family: 'Cairo', sans-serif;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .modern-input:focus {
      outline: none;
      border-color: var(--sec-blue);
      background: white;
      box-shadow: 0 0 0 4px rgba(0, 90, 143, 0.1);
    }

    .login-btn {
      width: 100%;
      padding: 15px;
      background: linear-gradient(to right, var(--sec-orange), #ffaa33);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Cairo', sans-serif;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-top: 10px;
      box-shadow: 0 4px 15px rgba(242, 139, 0, 0.3);
    }

    .login-btn:hover {
      background: linear-gradient(to right, var(--sec-orange-hover), var(--sec-orange));
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(242, 139, 0, 0.4);
    }

    .login-btn:active {
      transform: translateY(0);
    }

    .login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
    }

    .footer-info {
      margin-top: 25px;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #f0f0f0;
      padding-top: 15px;
    }
  `

  return (
    <div className="login-wrapper">
      <style>{styles}</style>
      
      <div className="login-card">
        {/* Logo Section */}
        <div className="logo-container">
          <img src="/imge.jpg" alt="SEC Logo" className="sec-logo" />
        </div>

        {/* Titles Section (From Image) */}
        <div className="titles-container">
          <h1 className="main-title">الشركة السعودية للكهرباء</h1>
          <h2 className="sub-title">نظام تفتيش السلامة الميداني</h2>
          <p className="desc-text">( أرشفة زيارات الاستشاريين لبرامج العمل )</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <i className="fa-regular fa-user input-icon"></i>
            <input
              className="modern-input"
              placeholder="اسم المستخدم"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="input-group">
            <i className="fa-solid fa-lock input-icon"></i>
            <input
              className="modern-input"
              type="password"
              placeholder="كلمة المرور"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span><i className="fa-solid fa-spinner fa-spin"></i> جاري الدخول...</span>
            ) : (
              <span>تسجيل الدخول <i className="fa-solid fa-arrow-left" style={{marginRight:'8px'}}></i></span>
            )}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="footer-info">
          <p style={{marginBottom:'5px'}}>بيانات الدخول التجريبية:</p>
          <div style={{display:'flex', justifyContent:'center', gap:'15px', color:'#64748b'}}>
             <span><i className="fa-solid fa-user-shield"></i> admin / admin2025</span>
             <span><i className="fa-solid fa-helmet-safety"></i> fox / 12</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
