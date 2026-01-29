import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

const qList = [
  'تصريح العمل الأساسي والثانوي متواجد بموقع العمل',
  'اجتماع ما قبل البدء بالعمل متواجد بموقع العمل',
  'نموذج فريق العمل متواجد',
  'إجراءات العمل الآمن وتقييم المخاطر',
  'معدات الحماية الشخصية موجودة وسارية',
  'لافتات التحذير والتنبيهات موجودة',
  'مسارات الطوارئ واضحة ومفتوحة',
  'أجهزة الإطفاء متاحة وجاهزة',
  'العمال مدربون على إجراءات الأمان',
  'تقييم المخاطر تم تنفيذه بشكل صحيح'
]

const InspectorApp = () => {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const sigPad = useRef(null)

  const [formData, setFormData] = useState({
    contractor: '',
    location: '',
    consultant: '',
    receiver: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [answers, setAnswers] = useState({})
  const [geo, setGeo] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [isCamOpen, setIsCamOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) {
      navigate('/')
    } else {
      setUser(JSON.parse(userData))
    }
  }, [])

  const getGeo = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        setGeo(link)
      },
      () => alert('فشل تحديد الموقع')
    )
  }

  const startCam = async () => {
    setIsCamOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      alert('فشل الوصول للكاميرا')
      setIsCamOpen(false)
    }
  }

  const takeSnap = () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = (video.videoHeight / video.videoWidth) * 300
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/jpeg', 0.5))

    video.srcObject.getTracks().forEach((t) => t.stop())
    setIsCamOpen(false)
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          const elem = document.createElement('canvas')
          const scaleFactor = 600 / img.width
          elem.width = 600
          elem.height = img.height * scaleFactor
          elem.getContext('2d').drawImage(img, 0, 0, elem.width, elem.height)
          resolve(elem.toDataURL('image/jpeg', 0.4))
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!geo || !photo) {
      alert('⚠️ الموقع والسيلفي إجباري!')
      return
    }

    setLoading(true)
    try {
      const serial = Date.now()
      const payload = {
        serial,
        inspector: user.username,
        timestamp: new Date().toLocaleString('ar-SA'),
        ...formData,
        google_maps_link: geo,
        verification_photo: photo,
        signature_image: sigPad.current.isEmpty() ? null : sigPad.current.toDataURL(),
        violations: []
      }

      for (let i = 0; i < qList.length; i++) {
        const qKey = i + 1
        const ans = answers[qKey]?.val || 'N/A'
        const note = answers[qKey]?.note || ''
        let imgBase64 = ''

        if (answers[qKey]?.file) {
          imgBase64 = await compressImage(answers[qKey].file)
        }

        if (ans === 'لا' || note || imgBase64) {
          payload.violations.push({
            q: qList[i],
            ans,
            note,
            photo: imgBase64
          })
        }
      }

      const { error } = await supabase.from('reports').insert([payload])

      if (error) throw error

      alert('✅ تم الإرسال!')
      window.location.reload()
    } catch (err) {
      alert('خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div>جاري التحميل...</div>

  return (
    <div className="container" style={{ display: 'block' }}>
      <div className="header">
        <div>
          <span>المفتش: {user.username}</span>
        </div>
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

      <div className="card" style={{ borderRightColor: 'var(--danger)' }}>
        <h3>🛑 إثبات التواجد</h3>
        <div style={{ marginBottom: '15px' }}>
          {!geo ? (
            <button className="btn-action" onClick={getGeo}>
              📍 تحديد الموقع
            </button>
          ) : (
            <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>✅ تم تحديد الموقع</div>
          )}
        </div>

        <div>
          {!isCamOpen && !photo && (
            <button className="btn-action" onClick={startCam}>
              📷 سيلفي
            </button>
          )}
          {isCamOpen && <video ref={videoRef} autoPlay style={{ width: '100%', borderRadius: '10px' }} />}
          {isCamOpen && (
            <button className="btn-action" style={{ background: 'var(--danger)' }} onClick={takeSnap}>
              التقاط
            </button>
          )}
          {photo && <img src={photo} style={{ width: 100, borderRadius: '50%', marginTop: '10px' }} alt="Selfie" />}
        </div>
      </div>

      <div className="card">
        <h3>📝 البيانات</h3>
        <input
          placeholder="اسم المقاول"
          value={formData.contractor}
          onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
        />
        <input
          placeholder="الموقع"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
        <input
          placeholder="اسم الاستشاري"
          value={formData.consultant}
          onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
        />
        <input
          placeholder="المستقبل"
          value={formData.receiver}
          onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
        />
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      {qList.map((q, i) => (
        <div key={i} className="card">
          <h4>
            {i + 1}. {q}
          </h4>
          <div className="opt-grid">
            {['نعم', 'لا', 'N/A'].map((opt) => (
              <label key={opt} className="opt-btn">
                <input
                  type="radio"
                  name={`q${i}`}
                  onChange={() =>
                    setAnswers({
                      ...answers,
                      [i + 1]: { ...answers[i + 1], val: opt }
                    })
                  }
                />
                {opt}
              </label>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setAnswers({
                ...answers,
                [i + 1]: { ...answers[i + 1], file: e.target.files[0] }
              })
            }
          />
          <textarea
            placeholder="ملاحظة"
            rows="2"
            onChange={(e) =>
              setAnswers({
                ...answers,
                [i + 1]: { ...answers[i + 1], note: e.target.value }
              })
            }
          />
        </div>
      ))}

      <div className="card">
        <h3>✍️ التوقيع</h3>
        <SignatureCanvas ref={sigPad} canvasProps={{ className: 'sig-pad' }} />
        <button onClick={() => sigPad.current.clear()} style={{ background: '#6c757d' }}>
          مسح التوقيع
        </button>
      </div>

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'جاري الإرسال...' : 'إرسال التقرير 🚀'}
      </button>
    </div>
  )
}

export default InspectorApp
