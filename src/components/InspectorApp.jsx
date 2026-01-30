import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة الكاملة للأسئلة كما في الملف الأصلي
const qList = [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل", "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة – وصف العمل – رقم التصريح – توقيع مشرف الكهرب والشركة)", "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", "إلمام المستلم وفريق العمل بإجراءات العمل الآمن وتقييم المخاطر للمهمة", "ملاحظات", "بطاقة تعميد المصدر والمستلم والعامل المشارك سارية وبصلاحيات مناسبة للعمل", "تأهيل سائق المعدات (سائق ونش – سلة هوائية -........)", "المستلم متواجد بموقع العمل", "وضع أقفال السلامة و البطاقات التحذيرية و إكتمال بيانات التواصل", "التأكد من تركيب الأرضي المتنقل من الجهتين", "التأكد من فعالية جهاز كشف الجهد التستر", "التأكد من تواجد نموذج فحص المركبة والعدد والادوات متواجد شهادة المسعف والمكافح وفحص المركبة والباركود الخاص بالخطط", "نماذج الفحص", "نموذج فحص المركبة", "نموذج فحص العدد والادوات", "شهادة المسعف", "شهادة المكافح", "شهادة tuv", "QR Code", "فحص معدات الرفع و الحفر من قبل طرف ثالث (تى يو فى)", "التأكد من مطابقة السلات للمواصفات ( كفرات – زيوت – كسور – حزام الأمان – تكدس مواد .. الخ)", "التأكد من سلامة خطاف الونش واحبال الرفع", "طفاية حريق سليمة ومفحوصة وسلامة استكر الفحص", "شنطة إسعافات مكتملة ومفحوصة", "التأكد من تركيب الأرضي للسيارات", "الحمل الأقصى محدد بوضوح على جميع معدات الرفع", "مهام الوقاية الشخصية سليمة (بسؤال الموظف والتفتيش علية) خوذة - ملابس – حذاء", "التفتيش على القفاز المطاطي (33000 – 13000 – 1000) ك.ف.أ", "الخوذة الكهربائية مزودة بحامى وجة", "أحزمة السلامة مرقمة وسليمة", "استخدام حواجز حماية سليمة وكافية و شريط تحذيري", "كفاية اللوحات الإرشادية المرورية", "الترميز بالألوان حسب الشهر للعدد والأدوات وأدوات السلامة", "تخزين أسطوانات الغاز وأسطوانات الاكسجين واللحام وترميزها", "وجود أغطية الحماية لأسطوانات الغاز والأكسجين", "ليات الاوكسي استيلين لا يوجد بها تشققات او تالفة", "سلامة المنظم والعدادات", "وجود شعار المقاول على المركبات والمعدات", "تم ازالة المخلفات بعد الانتهاء من العمل", "خطط متعلقة بتصاريح العمل", "خطة الطوارئ", "خطة المنع من السقوط", "خطة الإنقاذ في العمل على المرتفعات", "خطة رفع الأحمال الحرجة", "إجراء وملصقات حماية السمع", "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة"
];

const InspectorApp = () => {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const sigPad = useRef(null)
  const topRef = useRef(null)

  // States
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إرسال التقرير النهائي 🚀')
  
  // Form Data
  const [formData, setFormData] = useState({
    contractor: '',
    location: '',
    consultant: '',
    receiver: '',
    work_desc: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  // Verification
  const [geo, setGeo] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [isCamOpen, setIsCamOpen] = useState(false)

  // Answers Store: { 1: { val: 'نعم', note: '', file: File }, ... }
  const [answers, setAnswers] = useState({})

  // Styles Injection
  const styles = `
    .verify-box { background: #eff6ff; border: 2px dashed #3b82f6; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 15px; }
    .btn-action { background: #0f766e; color: white; border: none; padding: 10px; width: 100%; border-radius: 8px; font-weight:bold; margin-top:5px; cursor: pointer; font-family: 'Cairo'; }
    .opt-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:8px; }
    .opt-btn { background:#f8fafc; padding:10px 2px; border-radius:6px; text-align:center; font-size:12px; font-weight:bold; cursor:pointer; border:1px solid #e2e8f0; transition:0.2s; display:block; }
    
    .opt-btn.ok.selected { background:#dcfce7; color:#166534; border-color:#22c55e; }
    .opt-btn.no.selected { background:#fee2e2; color:#991b1b; border-color:#ef4444; }
    .opt-btn.na.selected { background:#e2e8f0; color:#475569; border-color:#94a3b8; }
    
    .sig-pad { border: 2px solid #ddd; border-radius: 8px; width: 100%; height: 180px; background: #fafafa; }
    label { font-weight:bold; color:#333; font-size:13px; margin-top:8px; display:block; }
  `;

  // --- Auth Check ---
  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) {
      navigate('/')
    } else {
      setUser(JSON.parse(userData))
    }
  }, [])

  // --- Helpers ---
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
      () => alert('فشل تحديد الموقع. تأكد من تفعيل GPS')
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
    if (!video) return
    const canvas = document.createElement('canvas')
    // ضغط السيلفي (تصغير الحجم)
    const scale = 300 / video.videoWidth
    canvas.width = 300
    canvas.height = video.videoHeight * scale
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/jpeg', 0.5))

    if (video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop())
    }
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
          // ضغط صور المخالفات
          const MAX_WIDTH = 600
          const scaleFactor = MAX_WIDTH / img.width
          elem.width = MAX_WIDTH
          elem.height = img.height * scaleFactor
          const ctx = elem.getContext('2d')
          ctx.drawImage(img, 0, 0, elem.width, elem.height)
          resolve(elem.toDataURL('image/jpeg', 0.4))
        }
      }
    })
  }

  // --- Handling Answers ---
  const handleAnswerChange = (qIndex, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], [field]: value }
    }))
  }

  // --- Submit ---
  const handleSubmit = async () => {
    // 1. Validations
    if (!geo) {
      alert('⚠️ يرجى تحديد الموقع أولاً')
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!photo) {
      alert('⚠️ يرجى التقاط صورة سيلفي للتحقق')
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (!formData.contractor) {
      alert('⚠️ يرجى كتابة اسم المقاول')
      return
    }

    setLoading(true)
    setBtnText('جاري المعالجة... يرجى الانتظار')

    try {
      const serial = Date.now()
      const payload = {
        serial,
        inspector: user.username,
        timestamp: new Date().toLocaleString('ar-SA'),
        ...formData,
        google_maps_link: geo,
        verification_photo: photo,
        signature_image: sigPad.current.isEmpty() ? null : sigPad.current.toDataURL('image/png', 0.5),
        answers: {}, // لتخزين الإجابات "نعم/لا" لعرضها في الجدول
        violations: []
      }

      // 2. Processing Questions & Compressing Images
      for (let i = 0; i < qList.length; i++) {
        const qKey = i + 1
        setBtnText(`جاري ضغط الصور... (${i + 1}/${qList.length})`)

        const currentAns = answers[qKey] || {}
        const val = currentAns.val || 'N/A'
        const note = currentAns.note || ''
        
        // حفظ الإجابة للعرض في الجدول
        payload.answers[qKey] = val

        // معالجة المخالفة (صورة + ملاحظة)
        let imgBase64 = ''
        if (currentAns.file) {
          try {
            imgBase64 = await compressImage(currentAns.file)
          } catch (e) {
            console.error("Image error", e)
          }
        }

        if (val === 'لا' || note || imgBase64) {
          payload.violations.push({
            q: qList[i],
            ans: val,
            note,
            photo: imgBase64
          })
        }
      }

      setBtnText('جاري الإرسال للسيرفر... 🚀')

      const { error } = await supabase.from('reports').insert([payload])

      if (error) throw error

      alert('✅ تم إرسال التقرير بنجاح!')
      window.location.reload()

    } catch (err) {
      alert('خطأ: ' + err.message)
      setBtnText('إعادة المحاولة')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div style={{textAlign:'center', marginTop:'50px'}}>جاري التحميل...</div>

  return (
    <div className="container" style={{ display: 'block' }}>
      <style>{styles}</style>
      
      {/* Header */}
      <div className="header" ref={topRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/imge.jpg" height="40" alt="Logo" />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--sec-blue)' }}>
              المفتش: {user.username}
            </div>
            <div 
              onClick={() => { sessionStorage.clear(); navigate('/'); }} 
              style={{ color: 'red', fontSize: '10px', cursor: 'pointer' }}
            >
              تسجيل خروج
            </div>
          </div>
        </div>
        <div style={{ border: '1px solid var(--sec-blue)', padding: '4px 8px', borderRadius: '6px', color: 'var(--sec-blue)', fontSize: '10px', fontWeight: 'bold' }}>
          مجموعة السلامة
        </div>
      </div>

      {/* Verification Card */}
      <div className="card" style={{ borderRightColor: '#ef4444' }}>
        <h3 style={{ color: '#b91c1c', marginTop: 0, fontSize: '16px' }}>🛑 إثبات التواجد (إجباري)</h3>
        
        <div className="verify-box">
          {!geo ? (
            <button className="btn-action" onClick={getGeo}>
              📍 اضغط لتحديد موقعك
            </button>
          ) : (
            <div>
              <button className="btn-action" style={{ background: '#059669' }}>
                ✅ تم تحديد الموقع
              </button>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '5px', overflowWrap: 'anywhere' }}>
                {geo}
              </div>
            </div>
          )}
        </div>

        <div className="verify-box">
          {!isCamOpen && !photo && (
            <button className="btn-action" style={{ background: '#2563eb' }} onClick={startCam}>
              📷 التقاط سيلفي الآن
            </button>
          )}
          
          {isCamOpen && (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', maxWidth: '250px', borderRadius: '10px', transform: 'scaleX(-1)', background: '#000', display: 'block', margin: '10px auto' }} 
              />
              <button className="btn-action" style={{ background: '#dc2626' }} onClick={takeSnap}>
                التقاط الصورة
              </button>
            </>
          )}

          {photo && (
            <div style={{ textAlign: 'center' }}>
               <img src={photo} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #22c55e', margin: '10px auto' }} alt="Selfie" />
               <br />
               <button className="btn-action" style={{ background: '#666', width: 'auto', padding: '5px 15px', fontSize: '12px' }} onClick={() => setPhoto(null)}>
                 إعادة الالتقاط
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Basic Data Form */}
      <div className="card">
        <h3 style={{ color: 'var(--sec-blue)', marginTop: 0 }}>📝 بيانات التقرير</h3>
        <label>التاريخ</label>
        <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
        
        <label>الاستشاري</label>
        <input placeholder="اسم الاستشاري" value={formData.consultant} onChange={(e) => setFormData({...formData, consultant: e.target.value})} />
        
        <label>المقاول</label>
        <input placeholder="اسم المقاول" value={formData.contractor} onChange={(e) => setFormData({...formData, contractor: e.target.value})} />
        
        <label>المستلم</label>
        <input placeholder="اسم المستلم" value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} />
        
        <label>الموقع</label>
        <input placeholder="الموقع" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
        
        <label>وصف العمل</label>
        <input placeholder="وصف العمل" value={formData.work_desc} onChange={(e) => setFormData({...formData, work_desc: e.target.value})} />
      </div>

      {/* Questions Loop */}
      {qList.map((q, i) => {
        const qIdx = i + 1
        const currentVal = answers[qIdx]?.val || 'N/A' // الافتراضي إذا لم يتم الاختيار

        return (
          <div key={i} className="card">
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{qIdx}. {q}</div>
            
            <div className="opt-grid">
              <div 
                className={`opt-btn ok ${currentVal === 'نعم' ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(qIdx, 'val', 'نعم')}
              >
                نعم
              </div>
              <div 
                className={`opt-btn no ${currentVal === 'لا' ? 'selected' : ''}`}
                onClick={() => handleAnswerChange(qIdx, 'val', 'لا')}
              >
                لا
              </div>
              <div 
                className={`opt-btn na ${currentVal === 'N/A' ? 'selected' : ''}`} // عدلت "لا ينطبق" لـ N/A في الكود للتناسق
                onClick={() => handleAnswerChange(qIdx, 'val', 'N/A')}
              >
                N/A
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              style={{ marginTop: '10px' }}
              onChange={(e) => handleAnswerChange(qIdx, 'file', e.target.files[0])}
            />
            
            <textarea
              placeholder="ملاحظة..."
              rows="2"
              style={{ height: '40px' }}
              onChange={(e) => handleAnswerChange(qIdx, 'note', e.target.value)}
            />
          </div>
        )
      })}

      {/* Signature */}
      <div className="card">
        <h3 style={{ color: 'var(--sec-blue)', marginTop: 0 }}>✍️ التوقيع</h3>
        <SignatureCanvas 
            ref={sigPad} 
            canvasProps={{ className: 'sig-pad' }} 
            backgroundColor="rgb(255, 255, 255)"
        />
        <button 
            onClick={() => sigPad.current.clear()} 
            style={{ background: '#fee2e2', color: 'red', border: 'none', padding: '5px', width: '100%', marginTop: '5px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Cairo' }}
        >
            مسح التوقيع
        </button>
      </div>

      <div style={{ height: '60px' }}></div>
      
      <div className="footer" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '12px', boxShadow: '0 -2px 10px rgba(0,0,0,.1)', zIndex: 2000 }}>
        <button 
            className="submit-btn" 
            onClick={handleSubmit} 
            disabled={loading}
            style={{ background: loading ? '#9ca3af' : 'var(--primary-blue)' }}
        >
          {btnText}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp
