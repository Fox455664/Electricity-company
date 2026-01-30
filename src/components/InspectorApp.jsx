import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// --- القائمة المعدلة (تم تعديل السؤال الثالث) ---
const qList = [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل",
    "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل",
    "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة - وصف العمل - رقم التصريح - توقيع مسئول شركة الكهرباء)",
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
    "TUV السائق", 
    "TUV المعدات",
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
    "تم ازالة المخلفات بعد الانتهاء من العمل",
    "خطة الطوارئ",
    "خطة المنع من السقوط",
    "خطة رفع الأحمال الحرجة",
    "إجراء وملصقات حماية السمع",
    "ملصق أغراض متساقطة"
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
    work_order_number: '', 
    visit_team: '',
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

  // Answers Store
  const [answers, setAnswers] = useState({})

  // --- Styles ---
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
      padding: 25px 20px;
      border-radius: 0 0 25px 25px;
      box-shadow: 0 10px 30px rgba(0, 90, 143, 0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .header-title-box {
        text-align: center;
        background: rgba(255,255,255,0.1);
        padding: 10px;
        border-radius: 12px;
        backdrop-filter: blur(5px);
        margin-top: 5px;
    }

    .inspector-badge {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(5px);
      padding: 5px 12px;
      border-radius: 50px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* Cards Styling */
    .premium-card {
      background: var(--card-bg);
      border-radius: var(--border-radius);
      padding: 24px;
      margin: 20px 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
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

    /* Verification Grid */
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
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 140px;
    }

    .verify-item.done {
      border-style: solid;
      border-color: var(--success);
      background: #ecfdf5;
    }

    .verify-icon { font-size: 30px; margin-bottom: 10px; color: var(--text-light); }
    .verify-item.done .verify-icon { color: var(--success); }

    /* Inputs Styling */
    .input-wrapper {
      margin-bottom: 15px;
      position: relative;
    }

    .input-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-light);
      margin-bottom: 6px;
    }

    .premium-input {
      width: 100%;
      padding: 14px 16px;
      padding-right: 40px; 
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      font-family: 'Cairo', sans-serif;
      background: #f8fafc;
    }

    .input-icon {
      position: absolute;
      top: 38px;
      left: 15px;
      color: #94a3b8;
    }

    /* Question Card */
    .question-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
      border-right: 4px solid transparent;
    }

    .question-card.answered { border-right-color: var(--primary); }

    .q-text {
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 15px;
      line-height: 1.5;
    }

    .options-container {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 10px;
      gap: 5px;
    }

    .option-btn {
      flex: 1;
      padding: 10px;
      text-align: center;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-light);
    }

    .option-btn.yes.active { background: #10b981; color: white; }
    .option-btn.no.active { background: #ef4444; color: white; }
    .option-btn.na.active { background: #64748b; color: white; }

    /* File Upload */
    .photo-btn {
      margin-top: 15px;
      background: #fff;
      border: 1px dashed #cbd5e1;
      color: var(--primary);
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .file-counter {
        background: var(--accent);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        margin-right: 5px;
    }

    .note-input {
      width: 100%;
      margin-top: 10px;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-family: 'Cairo';
      font-size: 13px;
      resize: none;
    }

    /* Footer */
    .floating-footer {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      z-index: 100;
    }

    .submit-main-btn {
      background: linear-gradient(135deg, var(--accent) 0%, #e67e00 100%);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 50px;
      font-weight: 700;
      width: 100%;
      font-family: 'Cairo', sans-serif;
      box-shadow: 0 4px 15px rgba(242, 139, 0, 0.4);
    }
  `;

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) {
      navigate('/')
    } else {
      setUser(JSON.parse(userData))
    }
  }, [])

  // --- Functions ---

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
    if (video.srcObject) video.srcObject.getTracks().forEach((t) => t.stop())
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
          const MAX_WIDTH = 600 
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

  const handleFilesChange = async (qIndex, files) => {
    if (!files.length) return
    const compressedFiles = []
    
    for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i])
        compressedFiles.push(compressed)
    }

    setAnswers(prev => {
        const existingFiles = prev[qIndex]?.files || []
        return {
            ...prev,
            [qIndex]: { ...prev[qIndex], files: [...existingFiles, ...compressedFiles] }
        }
    })
  }

  const handleAnswerChange = (qIndex, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], [field]: value }
    }))
  }

  const handleSubmit = async () => {
    if (!geo) { alert('⚠️ يرجى تحديد الموقع أولاً'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!photo) { alert('⚠️ يرجى التقاط صورة سيلفي للتحقق'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!formData.contractor) { alert('⚠️ يرجى كتابة اسم المقاول'); return; }

    setLoading(true)
    setBtnText('جاري تحضير الصور...')

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
        setBtnText(`معالجة البند (${qKey}/${qList.length})`)

        const currentAns = answers[qKey] || {}
        const val = currentAns.val || 'N/A'
        const note = currentAns.note || ''
        const files = currentAns.files || []
        
        payload.answers[qKey] = val === 'N/A' ? 'لا ينطبق' : val

        if (val === 'لا' || note || files.length > 0) {
          payload.violations.push({
            q: qList[i],
            ans: val === 'N/A' ? 'لا ينطبق' : val,
            note,
            photos: files 
          })
        }
      }

      setBtnText('جاري الرفع للخادم...')
      const { error } = await supabase.from('reports').insert([payload])
      if (error) throw error

      alert('✅ تم إرسال التقرير بنجاح!')
      window.location.reload()

    } catch (err) {
      console.error(err)
      alert('خطأ في الإرسال: حاول تقليل عدد الصور.')
      setBtnText('إعادة المحاولة')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontFamily:'Cairo'}}>جاري التحميل...</div>

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="premium-header" ref={topRef}>
        <div className="header-top">
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
        <div className="header-title-box">
             <h3 style={{margin:0, fontSize:'16px'}}>مجموعة السلامة ادارة ضواحي الرياض</h3>
        </div>
      </div>

      <div style={{padding: '20px 15px'}}>
        
        {/* Verification */}
        <div className="premium-card">
          <div className="section-title">
            <i className="fa-solid fa-fingerprint"></i>
            إثبات التواجد
          </div>
          <div className="verify-grid">
            <div className={`verify-item ${geo ? 'done' : ''}`} onClick={getGeo}>
              <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'} verify-icon`}></i>
              <div>{geo ? 'تم تحديد الموقع' : 'تحديد الموقع'}</div>
            </div>
            <div className={`verify-item ${photo ? 'done' : ''}`} onClick={photo ? null : startCam}>
              {isCamOpen ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'8px', transform:'scaleX(-1)'}} />
                  <button onClick={(e) => { e.stopPropagation(); takeSnap(); }} style={{marginTop:'5px', background:'#ef4444', color:'white', border:'none', borderRadius:'5px', padding:'5px'}}>التقاط</button>
                </>
              ) : (
                <>
                  {photo ? <img src={photo} style={{width:'80px', height:'80px', borderRadius:'50%'}} alt="Selfie" /> : <i className="fa-solid fa-camera verify-icon"></i>}
                  <div>{photo ? 'تمت الصورة' : 'صورة سيلفي'}</div>
                  {photo && <button onClick={() => setPhoto(null)} style={{color:'#ef4444', background:'none', border:'none', fontSize:'11px'}}>إعادة</button>}
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
            <label className="input-label">اسم المقاول</label>
            <input className="premium-input" placeholder="اسم الشركة المنفذة" value={formData.contractor} onChange={(e) => setFormData({...formData, contractor: e.target.value})} />
            <i className="fa-solid fa-hard-hat input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">رقم أمر العمل / المهمة</label>
            <input className="premium-input" placeholder="رقم الأمر" value={formData.work_order_number} onChange={(e) => setFormData({...formData, work_order_number: e.target.value})} />
            <i className="fa-solid fa-hashtag input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">اسم فريق الزيارة</label>
            <input className="premium-input" placeholder="أسماء الفريق" value={formData.visit_team} onChange={(e) => setFormData({...formData, visit_team: e.target.value})} />
            <i className="fa-solid fa-users input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">وصف مكان العمل</label>
            <input className="premium-input" placeholder="الموقع / المحطة" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            <i className="fa-solid fa-map-pin input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">اسم الاستشاري</label>
            <input className="premium-input" value={formData.consultant} onChange={(e) => setFormData({...formData, consultant: e.target.value})} />
            <i className="fa-solid fa-user-tie input-icon"></i>
          </div>

          <div className="input-wrapper">
            <label className="input-label">المستلم</label>
            <input className="premium-input" value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} />
            <i className="fa-solid fa-user-check input-icon"></i>
          </div>
          
          <div className="input-wrapper">
            <label className="input-label">وصف العمل</label>
            <input className="premium-input" placeholder="صيانة / تركيب..." value={formData.work_desc} onChange={(e) => setFormData({...formData, work_desc: e.target.value})} />
            <i className="fa-solid fa-briefcase input-icon"></i>
          </div>
        </div>

        {/* Questions List */}
        <h3 style={{margin:'20px 15px 10px', color:'#0f172a'}}>بنود الفحص ({qList.length})</h3>
        {qList.map((q, i) => {
          const qIdx = i + 1
          const currentVal = answers[qIdx]?.val || 'N/A'
          const filesCount = answers[qIdx]?.files?.length || 0

          return (
            <div key={i} className={`question-card ${currentVal !== 'N/A' ? 'answered' : ''}`}>
              <div className="q-text">{qIdx}. {q}</div>
              
              <div className="options-container">
                <div className={`option-btn yes ${currentVal === 'نعم' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'نعم')}>نعم</div>
                <div className={`option-btn no ${currentVal === 'لا' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'لا')}>لا</div>
                <div className={`option-btn na ${currentVal === 'N/A' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'N/A')}>لا ينطبق</div>
              </div>

              <button className="photo-btn" onClick={() => document.getElementById(`file-${qIdx}`).click()}>
                <i className="fa-solid fa-camera"></i> 
                {filesCount > 0 ? <span style={{display:'flex', alignItems:'center'}}><span className="file-counter">{filesCount}</span> صور مرفقة</span> : 'التقاط صورة (كاميرا فقط)'}
              </button>
              
              {/* Force Camera Logic */}
              <input 
                type="file" 
                id={`file-${qIdx}`} 
                style={{display:'none'}} 
                accept="image/*" 
                capture="environment" /* هذا الكود يجبر فتح الكاميرا الخلفية */
                onChange={(e) => handleFilesChange(qIdx, e.target.files)}
              />
              
              <textarea
                className="note-input"
                placeholder="ملاحظات..."
                rows="1"
                onChange={(e) => handleAnswerChange(qIdx, 'note', e.target.value)}
              />
            </div>
          )
        })}

        {/* Signature Updated to "Receiver Signature" */}
        <div className="premium-card">
          <div className="section-title">
            <i className="fa-solid fa-file-signature"></i>
            توقيع المستلم
          </div>
          <div style={{border:'2px solid #e2e8f0', borderRadius:'12px', overflow:'hidden'}}>
            <SignatureCanvas ref={sigPad} canvasProps={{ width: 600, height: 200, className: 'sig-canvas' }} backgroundColor="white"/>
          </div>
          <button onClick={() => sigPad.current.clear()} style={{marginTop:'10px', color:'#ef4444', background:'none', border:'none', cursor:'pointer'}}>
              <i className="fa-solid fa-eraser"></i> مسح التوقيع
          </button>
        </div>
      </div>

      <div className="floating-footer">
        <button className="submit-main-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paper-plane"></i>} {btnText}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp
