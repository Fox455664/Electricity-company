import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة المعدلة
const qList = [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل", 
    "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", 
    "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة – وصف العمل – رقم التصريح – توقيع مشرف الكهرب والشركة)", 
    "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", 
    "إلمام المستلم وفريق العمل بإجراءات العمل الآمن وتقييم المخاطر للمهمة", 
    "ملاحظات", 
    "بطاقة تعميد المصدر والمستلم والعامل المشارك سارية وبصلاحيات مناسبة للعمل", 
    "تأهيل سائق المعدات (سائق ونش – سلة هوائية -........)", 
    "المستلم متواجد بموقع العمل", 
    "وضع أقفال السلامة و البطاقات التحذيرية و إكتمال بيانات التواصل", 
    "التأكد من تركيب الأرضي المتنقل من الجهتين", 
    "التأكد من فعالية جهاز كشف الجهد التستر", 
    "نموذج فحص المركبة", 
    "شهادة المسعف", 
    "شهادة المكافح", 
    "شهادة tuv", 
    "فحص معدات الرفع و الحفر من قبل طرف ثالث (تى يو فى)", 
    "التأكد من مطابقة السلات للمواصفات ( كفرات – زيوت – كسور – حزام الأمان – تكدس مواد .. الخ)", 
    "التأكد من سلامة خطاف الونش واحبال الرفع", 
    "طفاية حريق سليمة ومفحوصة وسلامة استكر الفحص", 
    "شنطة إسعافات مكتملة ومفحوصة", 
    "التأكد من تركيب الأرضي للسيارات", 
    "الحمل الأقصى محدد بوضوح على جميع معدات الرفع", 
    "مهام الوقاية الشخصية سليمة (بسؤال الموظف والتفتيش علية) خوذة - ملابس – حذاء", 
    "التفتيش على القفاز المطاطي (33000 – 13000 – 1000) ك.ف.أ", 
    "الخوذة الكهربائية مزودة بحامى وجة", 
    "أحزمة السلامة مرقمة وسليمة", 
    "استخدام حواجز حماية سليمة وكافية و شريط تحذيري", 
    "كفاية اللوحات الإرشادية المرورية", 
    "الترميز بالألوان حسب الشهر للعدد والأدوات وأدوات السلامة", 
    "تخزين أسطوانات الغاز وأسطوانات الاكسجين واللحام وترميزها", 
    "وجود أغطية الحماية لأسطوانات الغاز والأكسجين", 
    "ليات الاوكسي استيلين لا يوجد بها تشققات او تالفة", 
    "سلامة المنظم والعدادات", 
    "وجود شعار المقاول على المركبات والمعدات", 
    "خطط متعلقة بتصاريح العمل", 
    "خطة المنع من السقوط",
    "خطة الإنقاذ في العمل على المرتفعات", 
    "خطة رفع الأحمال الحرجة", 
    "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة"
];

const InspectorApp = () => {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const sigPad = useRef(null)
  const topRef = useRef(null)

  // States
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إعتماد وإرسال التقرير')
  
  // Form Data
  const [formData, setFormData] = useState({
    contractor: '',
    location: '',
    consultant: '',
    receiver: '',
    work_desc: '',
    visit_team: '',
    order_number: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  // Verification
  const [geo, setGeo] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [isCamOpen, setIsCamOpen] = useState(false)

  // Answers Store
  const [answers, setAnswers] = useState({})

  // --- Premium Styles (CSS-in-JS) ---
  const styles = `
    :root {
      --primary: #005a8f;
      --accent: #f28b00;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #1e293b;
      --text-light: #64748b;
      --success: #10b981;
      --danger: #ef4444;
      --border-radius: 16px;
    }

    body {
      background-color: var(--bg-color);
      font-family: 'Cairo', sans-serif;
    }

    .app-container {
      max-width: 800px;
      margin: 0 auto;
      padding-bottom: 100px;
    }

    /* Header Styling */
    .premium-header {
      background: linear-gradient(135deg, #005a8f 0%, #004269 100%);
      color: white;
      padding: 20px;
      border-radius: 0 0 25px 25px;
      box-shadow: 0 10px 30px rgba(0, 90, 143, 0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-logo {
      height: 45px;
      background: white;
      padding: 5px 10px;
      border-radius: 8px;
    }

    .inspector-badge {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(5px);
      padding: 8px 16px;
      border-radius: 50px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Cards Styling */
    .premium-card {
      background: var(--card-bg);
      border-radius: var(--border-radius);
      padding: 24px;
      margin: 20px 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
      transition: transform 0.2s ease;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 10px;
    }

    /* Verify Grid */
    .verify-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .verify-item {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .verify-item.done {
      border-style: solid;
      border-color: var(--success);
      background: #ecfdf5;
    }
    .verify-icon { font-size: 30px; margin-bottom: 10px; color: var(--text-light); }
    .verify-item.done .verify-icon { color: var(--success); }

    /* Inputs */
    .input-wrapper { margin-bottom: 15px; position: relative; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-light); margin-bottom: 6px; }
    .premium-input {
      width: 100%; padding: 14px 16px; padding-right: 40px;
      border: 1px solid #e2e8f0; border-radius: 10px;
      font-size: 15px; font-family: 'Cairo', sans-serif; background: #f8fafc;
    }
    .input-icon { position: absolute; top: 38px; left: 15px; color: #94a3b8; }

    /* Questions */
    .question-card {
      background: white; border-radius: 12px; padding: 20px; margin: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-right: 4px solid transparent;
    }
    .question-card.answered { border-right-color: var(--primary); }
    .q-text { font-weight: 700; color: var(--text-main); margin-bottom: 15px; line-height: 1.5; }

    .options-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 5px; }
    .option-btn { flex: 1; padding: 10px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-light); }
    .option-btn.yes.active { background: #10b981; color: white; }
    .option-btn.no.active { background: #ef4444; color: white; }
    .option-btn.na.active { background: #64748b; color: white; }

    /* Action Buttons Area */
    .actions-row {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    .action-btn {
      flex: 1;
      border: 1px dashed #cbd5e1;
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      background: #f8fafc;
      color: var(--text-main);
    }
    .action-btn:active { transform: scale(0.98); background: #e2e8f0; }

    /* Image Grid */
    .img-grid {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        flex-wrap: wrap;
    }
    .img-thumb {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
        border: 2px solid #e2e8f0;
        position: relative;
    }
    .del-btn {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;
        border: none;
    }

    .note-input { width: 100%; margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Cairo'; font-size: 13px; resize: none; }

    /* Footer */
    .floating-footer {
      position: fixed; bottom: 20px; left: 20px; right: 20px;
      background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
      padding: 15px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      z-index: 100; display: flex; justify-content: center;
    }
    .submit-main-btn {
      background: linear-gradient(135deg, var(--accent) 0%, #e67e00 100%);
      color: white; border: none; padding: 16px 40px; border-radius: 50px;
      font-weight: 700; font-size: 16px; width: 100%;
      box-shadow: 0 4px 15px rgba(242, 139, 0, 0.4); cursor: pointer;
      font-family: 'Cairo', sans-serif;
    }
    .submit-main-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
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

  // --- Image Compression ---
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          const elem = document.createElement('canvas')
          const MAX_WIDTH = 500
          const scaleFactor = MAX_WIDTH / img.width
          elem.width = MAX_WIDTH
          elem.height = img.height * scaleFactor
          const ctx = elem.getContext('2d')
          ctx.drawImage(img, 0, 0, elem.width, elem.height)
          resolve(elem.toDataURL('image/jpeg', 0.3))
        }
      }
    })
  }

  const handleAnswerChange = (qIndex, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], [field]: value }
    }))
  }

  // Handle adding multiple photos
  const handleAddPhoto = (qIndex, newFiles) => {
      if (!newFiles || newFiles.length === 0) return;
      
      const fileArray = Array.from(newFiles);
      
      setAnswers(prev => {
          const existingFiles = prev[qIndex]?.files || [];
          return {
              ...prev,
              [qIndex]: { 
                  ...prev[qIndex], 
                  files: [...existingFiles, ...fileArray] 
              }
          }
      });
  }

  const removePhoto = (qIndex, fileIdx) => {
      setAnswers(prev => {
          const files = [...(prev[qIndex]?.files || [])];
          files.splice(fileIdx, 1);
          return {
              ...prev,
              [qIndex]: { ...prev[qIndex], files }
          }
      });
  }

  const handleSubmit = async () => {
    if (!geo) { alert('⚠️ يرجى تحديد الموقع أولاً'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!photo) { alert('⚠️ يرجى التقاط صورة سيلفي للتحقق'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!formData.contractor) { alert('⚠️ يرجى كتابة اسم المقاول'); return; }

    setLoading(true)
    setBtnText('جاري ضغط الصور والمعالجة...')

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
        answers: {},
        violations: []
      }

      for (let i = 0; i < qList.length; i++) {
        const qKey = i + 1
        const currentAns = answers[qKey] || {}
        const val = currentAns.val || 'N/A'
        const note = currentAns.note || ''
        
        payload.answers[qKey] = val === 'N/A' ? 'لا ينطبق' : val

        // Process Multiple Photos
        let processedPhotos = []
        if (currentAns.files && currentAns.files.length > 0) {
            setBtnText(`جاري رفع ${currentAns.files.length} صور للبند ${qKey}...`)
            for (const file of currentAns.files) {
                try {
                    const compressed = await compressImage(file);
                    processedPhotos.push(compressed);
                } catch (e) {
                    console.error("Image compression error", e);
                }
            }
        }

        if (val === 'لا' || note || processedPhotos.length > 0) {
          payload.violations.push({
            q: qList[i],
            ans: val === 'N/A' ? 'لا ينطبق' : val,
            note,
            photos: processedPhotos
          })
        }
      }

      setBtnText('جاري إرسال البيانات للسيرفر...')
      
      const jsonString = JSON.stringify(payload);
      const sizeInMB = jsonString.length / 1024 / 1024;
      if (sizeInMB > 5.5) {
          throw new Error("حجم الصور كبير جداً، يرجى تقليل عدد الصور أو جودتها");
      }

      const { error } = await supabase.from('reports').insert([payload])
      if (error) throw error

      alert('✅ تم إرسال التقرير بنجاح!')
      window.location.reload()

    } catch (err) {
      console.error(err)
      alert('خطأ في الإرسال: ' + err.message)
      setBtnText('إعادة المحاولة')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontFamily:'Cairo'}}>جاري تحميل النظام...</div>

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="premium-header" ref={topRef}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
           <div className="inspector-badge">
             <i className="fa-solid fa-user-shield"></i>
             <span>{user.username}</span>
           </div>
           <button 
             onClick={() => { sessionStorage.clear(); navigate('/'); }}
             style={{background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'18px'}}
           >
             <i className="fa-solid fa-arrow-right-from-bracket"></i>
           </button>
        </div>
        <img src="/imge.jpg" alt="SEC Logo" className="header-logo" />
      </div>

      <div style={{padding: '20px 15px'}}>
        <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>نظام السلامة الميداني</h2>
        <p style={{margin: '0 0 20px 0', color: '#64748b', fontSize: '14px'}}>
          <i className="fa-regular fa-calendar"></i> {new Date().toLocaleDateString('ar-SA')}
        </p>

        {/* Verification */}
        <div className="premium-card">
          <div className="section-title">
            <i className="fa-solid fa-fingerprint"></i>
            إثبات التواجد والتحقق
          </div>
          
          <div className="verify-grid">
            <div className={`verify-item ${geo ? 'done' : ''}`} onClick={getGeo}>
              <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'} verify-icon`}></i>
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{geo ? 'تم تحديد الموقع' : 'تحديد الموقع'}</div>
            </div>

            <div className={`verify-item ${photo ? 'done' : ''}`} onClick={photo ? null : startCam}>
              {isCamOpen ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'8px', transform:'scaleX(-1)'}} />
                  <button onClick={(e) => { e.stopPropagation(); takeSnap(); }} style={{marginTop:'5px', padding:'5px 10px', background:'#ef4444', color:'white', border:'none', borderRadius:'5px'}}>التقاط</button>
                </>
              ) : (
                <>
                  {photo ? (
                    <img src={photo} style={{width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover', border:'3px solid #10b981'}} alt="Selfie" />
                  ) : (
                    <i className="fa-solid fa-camera verify-icon"></i>
                  )}
                  <div style={{fontWeight:'bold', fontSize:'14px', marginTop:'10px'}}>
                    {photo ? 'تم التقاط الصورة' : 'صورة سيلفي'}
                  </div>
                  {photo && <button onClick={() => setPhoto(null)} style={{fontSize:'10px', color:'#ef4444', background:'none', border:'none', marginTop:'5px'}}>إعادة</button>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info Form */}
        <div className="premium-card">
          <div className="section-title">
            <i className="fa-solid fa-file-contract"></i>
            بيانات التقرير
          </div>
          
          <div className="input-wrapper">
            <label className="input-label">موقع العمل (الحي / الشارع)</label>
            <input className="premium-input" placeholder="الحي / الشارع / رقم المحطة..." value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            <i className="fa-solid fa-map-pin input-icon"></i>
          </div>

          <div className="input-wrapper">
             <label className="input-label">فريق الزيارة</label>
             <input className="premium-input" placeholder="اسماء فريق الزيارة..." value={formData.visit_team} onChange={(e) => setFormData({...formData, visit_team: e.target.value})} />
             <i className="fa-solid fa-users input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">اسم الاستشاري</label>
            <input className="premium-input" placeholder="اسم الاستشاري..." value={formData.consultant} onChange={(e) => setFormData({...formData, consultant: e.target.value})} />
            <i className="fa-solid fa-user-tie input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">اسم المقاول</label>
            <input className="premium-input" placeholder="اكتب اسم الشركة المنفذة..." value={formData.contractor} onChange={(e) => setFormData({...formData, contractor: e.target.value})} />
            <i className="fa-solid fa-hard-hat input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">رقم المقايسة / أمر العمل / المهمة</label>
            <input className="premium-input" placeholder="رقم أمر العمل..." value={formData.order_number} onChange={(e) => setFormData({...formData, order_number: e.target.value})} />
            <i className="fa-solid fa-file-invoice input-icon"></i>
          </div>
          
          <div className="input-wrapper">
            <label className="input-label">وصف العمل</label>
            <input className="premium-input" placeholder="صيانة / تركيب / حفر..." value={formData.work_desc} onChange={(e) => setFormData({...formData, work_desc: e.target.value})} />
            <i className="fa-solid fa-briefcase input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">المستلم</label>
            <input className="premium-input" placeholder="اسم مستلم العمل..." value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} />
            <i className="fa-solid fa-user-check input-icon"></i>
          </div>
        </div>

        {/* Questions List */}
        <h3 style={{margin:'20px 15px 10px', color:'#0f172a'}}>قائمة الفحص</h3>
        {qList.map((q, i) => {
          const qIdx = i + 1
          const currentVal = answers[qIdx]?.val || 'N/A'
          const isAnswered = answers[qIdx]?.val && answers[qIdx]?.val !== 'N/A'
          const currentFiles = answers[qIdx]?.files || []

          return (
            <div key={i} className={`question-card ${isAnswered ? 'answered' : ''}`}>
              <div className="q-text">{qIdx}. {q}</div>
              
              <div className="options-container">
                <div 
                  className={`option-btn yes ${currentVal === 'نعم' ? 'active' : ''}`}
                  onClick={() => handleAnswerChange(qIdx, 'val', 'نعم')}
                >
                  <i className="fa-solid fa-check"></i> نعم
                </div>
                <div 
                  className={`option-btn no ${currentVal === 'لا' ? 'active' : ''}`}
                  onClick={() => handleAnswerChange(qIdx, 'val', 'لا')}
                >
                  <i className="fa-solid fa-xmark"></i> لا
                </div>
                <div 
                  className={`option-btn na ${currentVal === 'N/A' ? 'active' : ''}`}
                  onClick={() => handleAnswerChange(qIdx, 'val', 'N/A')}
                >
                  لا ينطبق
                </div>
              </div>

              {/* Photo Actions - Only Camera Button */}
              <div className="actions-row">
                  <div className="action-btn" onClick={() => document.getElementById(`cam-${qIdx}`).click()}>
                    <i className="fa-solid fa-camera" style={{color:'var(--primary)'}}></i>
                    التقاط صورة (كاميرا)
                  </div>
              </div>

              {/* Hidden Inputs */}
              <input 
                type="file" 
                id={`cam-${qIdx}`} 
                style={{display:'none'}} 
                accept="image/*"
                capture="environment" // Forces Rear Camera
                onChange={(e) => handleAddPhoto(qIdx, e.target.files)}
              />

              {/* Images Grid */}
              {currentFiles.length > 0 && (
                  <div className="img-grid">
                      {currentFiles.map((file, idx) => (
                          <div key={idx} style={{position:'relative'}}>
                              <img src={URL.createObjectURL(file)} className="img-thumb" alt="preview" />
                              <button className="del-btn" onClick={() => removePhoto(qIdx, idx)}>×</button>
                          </div>
                      ))}
                  </div>
              )}
              
              <textarea
                className="note-input"
                placeholder="أضف ملاحظاتك هنا..."
                rows="1"
                onChange={(e) => handleAnswerChange(qIdx, 'note', e.target.value)}
              />
            </div>
          )
        })}

        {/* Signature */}
        <div className="premium-card">
          <div className="section-title">
            <i className="fa-solid fa-file-signature"></i>
            توقيع المستلم
          </div>
          <div className="sig-wrapper">
            <SignatureCanvas 
                ref={sigPad} 
                canvasProps={{ width: 600, height: 200, className: 'sig-canvas' }} 
                backgroundColor="rgb(255, 255, 255)"
            />
          </div>
          <button 
              onClick={() => sigPad.current.clear()} 
              style={{marginTop:'10px', color:'#ef4444', background:'none', border:'none', fontWeight:'bold', cursor:'pointer'}}
          >
              <i className="fa-solid fa-eraser"></i> مسح التوقيع
          </button>
        </div>
      </div>

      <div className="floating-footer">
        <button 
            className="submit-main-btn" 
            onClick={handleSubmit} 
            disabled={loading}
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paper-plane"></i>} {btnText}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp
