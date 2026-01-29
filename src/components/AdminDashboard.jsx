import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { supabase } from '../supabaseClient'

const AdminDashboard = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) {
      navigate('/')
    } else {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'admin') {
        navigate('/inspector')
      } else {
        setUser(parsedUser)
        fetchReports()
      }
    }
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setReports(data || [])
    } catch (err) {
      alert('خطأ في تحميل التقارير: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = (r) => {
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="direction: rtl; font-family: Cairo; padding: 20px; max-width: 800px;">
        <h1 style="color: #004a99; text-align: center; margin-bottom: 30px;">تقرير سلامة #${r.serial}</h1>

        <div style="background: #f5f7fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>المفتش:</strong> ${r.inspector}</p>
          <p><strong>التاريخ والوقت:</strong> ${r.timestamp}</p>
          <p><strong>المقاول:</strong> ${r.contractor || 'N/A'}</p>
          <p><strong>الموقع:</strong> ${r.location || 'N/A'}</p>
          <p><strong>الاستشاري:</strong> ${r.consultant || 'N/A'}</p>
          <p><strong>المستقبل:</strong> ${r.receiver || 'N/A'}</p>
        </div>

        <div style="margin: 20px 0; text-align: center;">
          ${r.verification_photo ? `<img src="${r.verification_photo}" style="width: 150px; height: 150px; border-radius: 50%; border: 3px solid #0066cc; object-fit: cover;" />` : ''}
        </div>

        ${
          r.violations && r.violations.length > 0
            ? `
          <div style="background: #ffeaea; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc3545; margin-top: 0;">المخالفات المسجلة (${r.violations.length})</h3>
            ${r.violations
              .map(
                (v, idx) => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-right: 4px solid #dc3545; border-radius: 4px;">
                <p><strong>${idx + 1}. ${v.q}</strong></p>
                <p><strong>الإجابة:</strong> <span style="color: ${v.ans === 'نعم' ? 'green' : 'red'}">${v.ans}</span></p>
                ${v.note ? `<p><strong>الملاحظة:</strong> ${v.note}</p>` : ''}
                ${v.photo ? `<div><img src="${v.photo}" style="width: 100%; max-width: 400px; margin-top: 10px; border-radius: 4px;" /></div>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        `
            : '<p style="color: green;"><strong>✅ لا توجد مخالفات مسجلة</strong></p>'
        }

        ${
          r.signature_image
            ? `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
            <p><strong>التوقيع:</strong></p>
            <img src="${r.signature_image}" style="width: 200px; border: 1px solid #ddd; border-radius: 4px;" />
          </div>
        `
            : ''
        }

        <div style="margin-top: 30px; color: #999; font-size: 12px; text-align: center;">
          <p>تم إنشاء هذا التقرير بواسطة نظام السلامة الميداني</p>
          <p>${new Date().toLocaleString('ar-SA')}</p>
        </div>
      </div>
    `

    html2pdf()
      .set({
        margin: 10,
        filename: `Report_${r.serial}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      })
      .from(element)
      .save()
  }

  if (loading) return <div className="container"><h2>جاري التحميل...</h2></div>

  return (
    <div className="container" style={{ display: 'block' }}>
      <div className="header">
        <h2>لوحة المدير</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '14px' }}>المسؤول: {user?.username}</span>
          <button
            onClick={() => {
              sessionStorage.clear()
              navigate('/')
            }}
            style={{ background: 'var(--danger)' }}
          >
            خروج
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📊 إحصائيات</h3>
        <p>
          <strong>إجمالي التقارير:</strong> {reports.length}
        </p>
        <p>
          <strong>التقارير بمخالفات:</strong> {reports.filter((r) => r.violations && r.violations.length > 0).length}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '16px' }}>لا توجد تقارير حتى الآن</p>
        </div>
      ) : (
        <div id="reportsList">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>التقرير #{r.serial}</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>{r.timestamp}</p>
                </div>
                <span
                  style={{
                    background: r.violations && r.violations.length > 0 ? '#dc3545' : '#28a745',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {r.violations && r.violations.length > 0 ? `⚠️ ${r.violations.length} مخالفة` : '✅ آمن'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', fontSize: '14px' }}>
                <div>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>المفتش:</strong> {r.inspector}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>المقاول:</strong> {r.contractor || 'N/A'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>الموقع:</strong> {r.location || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>التاريخ:</strong> {r.date || 'N/A'}
                  </p>
                </div>
              </div>

              {r.verification_photo && (
                <div style={{ marginBottom: '15px' }}>
                  <img src={r.verification_photo} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} alt="التحقق" />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => generatePDF(r)}
                  style={{
                    flex: 1,
                    background: 'var(--primary-blue)',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontFamily: 'Cairo, sans-serif'
                  }}
                >
                  📥 تحميل PDF
                </button>
                {r.google_maps_link && (
                  <a
                    href={r.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: '#6f42c1',
                      color: 'white',
                      padding: '10px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontFamily: 'Cairo, sans-serif'
                    }}
                  >
                    📍 الموقع
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
