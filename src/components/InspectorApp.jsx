import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة الموحدة (تمت إضافة البند 43)
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
    "شهادة TUV السائق", 
    "فحص TUV المعدات", 
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
    "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة",
    "صور البطاقات",
    "الإجراءات المتخذة حيال الملاحظات المرصودة" // البند الجديد
];

const InspectorApp = () => {
  const navigate = useNavigate()
  const sigPad = useRef(null)
  const topRef = useRef(null)
  const sigContainerRef = useRef(null)
  const warningRef = useRef(null)
  
  // Camera Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // States
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إعتماد وإرسال التقرير')
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  
  // Custom Camera States
  const [showCamera, setShowCamera] = useState(false)
  const [currentCameraQ, setCurrentCameraQ] = useState(null)
  const [cameraStream, setCameraStream] = useState(null)
  const [tempPhotos, setTempPhotos] = useState([]) 

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
  
  const [geo, setGeo] = useState(null)
  const [answers, setAnswers] = useState({})

  // --- Styles ---
  const styles = `
    :root { --primary: #005a8f; --accent: #f28b00; --bg-color: #f8fafc; --card-bg: #ffffff; --text-main: #1e293b; --text-light: #64748b; --success: #10b981; --danger: #ef4444; --border-radius: 16px; }
    body { background-color: var(--bg-color); font-family: 'Cairo', sans-serif; margin: 0; padding: 0; }
    .app-container { width: 100%; max-width: 900px; margin: 0 auto; padding-bottom: 120px; }
    .premium-header { background: linear-gradient(135deg, #005a8f 0%, #004269 100%); color: white; padding: 20px; border-radius: 0 0 25px 25px; box-shadow: 0 10px 30px rgba(0, 90, 143, 0.15); position: sticky; top: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; }
    .inspector-badge { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(5px); padding: 8px 16px; border-radius: 50px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .main-title { text-align: center; margin: 0 0 5px 0; color: #0f172a; font-size: 20px; font-weight: 800; }
    .premium-card { background: var(--card-bg); border-radius: var(--border-radius); padding: 20px; margin: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
    .warning-card { background: #fef2f2; border: 2px solid #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.15); animation: pulse-border 2s infinite; margin-top: 30px; }
    @keyframes pulse-border { 0% { border-color: #ef4444; } 50% { border-color: #f87171; } 100% { border-color: #ef4444; } }
    .warning-title { color: #b91c1c; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; }
    .warning-text { color: #b91c1c; font-weight: 700; font-size: 15px; line-height: 1.8; text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #fca5a5; padding-bottom: 15px; }
    .ack-label { display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; padding: 10px; background: white; border-radius: 10px; border: 1px solid #fca5a5; transition: all 0.3s; }
    .ack-checkbox { width: 22px; height: 22px; accent-color: #dc2626; cursor: pointer; }
    .ack-text-label { font-weight: bold; color: #991b1b; font-size: 14px; user-select: none; }
    .section-title { font-size: 18px; font-weight: 700; color: var(--primary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
    .verify-item { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; }
    .verify-item.done { border-style: solid; border-color: var(--success); background: #ecfdf5; }
    .verify-icon { font-size: 30px; margin-bottom: 10px; color: var(--text-light); }
    .verify-item.done .verify-icon { color: var(--success); }
    .input-wrapper { margin-bottom: 15px; position: relative; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-light); margin-bottom: 6px; }
    .premium-input { width: 100%; padding: 14px 16px; padding-right: 40px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-family: 'Cairo', sans-serif; background: #f8fafc; box-sizing: border-box; }
    .input-icon { position: absolute; top: 38px; left: 15px; color: #94a3b8; }
    .question-card { background: white; border-radius: 12px; padding: 20px; margin: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-right: 4px solid transparent; }
    .question-card.answered { border-right-color: var(--primary); }
    .q-text { font-weight: 700; color: var(--text-main); margin-bottom: 15px; line-height: 1.5; }
    .options-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 5px; }
    .option-btn { flex: 1; padding: 10px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-light); }
    .option-btn.yes.active { background: #10b981; color: white; }
    .option-btn.no.active { background: #ef4444; color: white; }
    .option-btn.na.active { background: #64748b; color: white; }
    .actions-row { display: flex; gap: 10px; margin-top: 15px; }
    .action-btn { flex: 1; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; background: #f8fafc; color: var(--text-main); transition:0.2s; }
    .action-btn:active { background: #e2e8f0; transform: scale(0.98); }
    .img-grid { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .img-thumb { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 2px solid #e2e8f0; position: relative; }
    .del-btn { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; border: none; }
    .note-input { width: 100%; margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Cairo'; font-size: 13px; resize: none; box-sizing: border-box; }
    .floating-footer { position: fixed; bottom: 20px; left: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); z-index: 100; display: flex; justify-content: center; }
    .submit-main-btn { background: linear-gradient(135deg, var(--accent) 0%, #e67e00 100%); color: white; border: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; width: 100%; box-shadow: 0 4px 15px rgba(242, 139, 0, 0.4); cursor: pointer; font-family: 'Cairo', sans-serif; transition: all 0.3s; }
    .submit-main-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; opacity: 0.7; }
    .sig-canvas { width: 100% !important; height: 200px !important; border-radius: 8px; }

    /* --- Custom Camera Modal Styles Updated --- */
    .camera-modal {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: black; z-index: 99999;
      display: flex; flex-direction: column;
      width: 100vw; height: 100vh;
    }
    .camera-video {
      width: 100%; height: 100%; 
      object-fit: cover; /* يجعل الصورة تملأ الشاشة بالكامل */
      flex: 1;
    }
    .camera-controls {
      position: absolute; bottom: 30px; left: 0; right: 0;
      display: flex; justify-content: space-around; align-items: center;
      padding: 20px;
      z-index: 100000;
    }
    .snap-btn {
      width: 80px; height: 80px; border-radius: 50%;
      background: white; border: 5px solid #ccc;
      cursor: pointer;
    }
    .snap-btn:active { transform: scale(0.95); background: #eee; }
    
    .done-btn-cam {
      background: #10b981; color: white; padding: 12px 25px; border-radius: 30px; border:none; font-weight:bold; cursor:pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px;
    }
    .close-btn-cam {
      background: rgba(255,255,255,0.2); color: white; padding: 12px 25px; border-radius: 30px; border:none; cursor:pointer;
      backdrop-filter: blur(4px); font-size: 16px;
    }
    .camera-counter {
      position: absolute; top: 40px; left: 30px;
      background: rgba(0,0,0,0.6); color: white; padding: 8px 20px; border-radius: 20px;
      font-weight: bold; font-size: 16px; z-index: 100000;
    }
    .temp-thumbs {
      position: absolute; bottom: 120px; left: 0; right: 0;
      display: flex; gap: 10px; padding: 15px; overflow-x: auto;
      background: rgba(0,0,0,0.4); z-index: 100000;
    }
    .temp-img { width: 60px; height: 60px; border-radius: 8px; border: 2px solid white; object-fit: cover; }
  `;

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) { navigate('/') } else { setUser(JSON.parse(userData)) }
  }, [])

  // --- Helpers ---
  const getGeo = () => {
    if (!navigator.geolocation) return alert('المتصفح لا يدعم GPS')
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
      () => alert('فشل تحديد الموقع')
    )
  }

  // --- Custom Camera Logic ---
  const startCamera = async (qIndex) => {
    try {
      setCurrentCameraQ(qIndex)
      setTempPhotos([])
      setShowCamera(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1920 }, // محاولة لطلب دقة عالية
            height: { ideal: 1080 }
        } 
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      alert('لا يمكن فتح الكاميرا: ' + err.message)
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
    }
    setShowCamera(false)
    setCameraStream(null)
  }

  const takeSnap = () => {
    if (videoRef.current && canvasRef.current) {
      const vid = videoRef.current
      const canvas = canvasRef.current
      canvas.width = vid.videoWidth
      canvas.height = vid.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setTempPhotos(prev => [...prev, file])
      }, 'image/jpeg', 0.8)
    }
  }

  const savePhotosFromCamera = () => {
    if (tempPhotos.length > 0) {
      handleAddPhoto(currentCameraQ, tempPhotos)
    }
    stopCamera()
  }

  // --- Handling Answers ---
  const handleAnswerChange = (qIndex, field, value) => {
    setAnswers(prev => ({ ...prev, [qIndex]: { ...prev[qIndex], [field]: value } }))
  }

  const handleAddPhoto = (qIndex, newFiles) => {
      if (!newFiles || newFiles.length === 0) return;
      const fileArray = Array.from(newFiles);
      setAnswers(prev => {
          const existingFiles = prev[qIndex]?.files || [];
          return {
              ...prev,
              [qIndex]: { ...prev[qIndex], files: [...existingFiles, ...fileArray] }
          }
      });
  }

  const removePhoto = (qIndex, fileIdx) => {
      setAnswers(prev => {
          const files = [...(prev[qIndex]?.files || [])];
          files.splice(fileIdx, 1);
          return { ...prev, [qIndex]: { ...prev[qIndex], files } }
      });
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
          const MAX_WIDTH = 800 // زيادة الدقة قليلاً
          const scaleFactor = MAX_WIDTH / img.width
          elem.width = MAX_WIDTH
          elem.height = img.height * scaleFactor
          const ctx = elem.getContext('2d')
          ctx.drawImage(img, 0, 0, elem.width, elem.height)
          resolve(elem.toDataURL('image/jpeg', 0.6))
        }
      }
    })
  }

  // --- Submission ---
  const handleSubmit = async () => {
    if (!isAcknowledged) {
        alert('⛔ يجب الموافقة على التعهد.');
        warningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (!geo) { 
        alert('⚠️ يرجى تحديد الموقع'); 
        topRef.current?.scrollIntoView(); 
        return; 
    }

    // --- التحقق من الحقول الإجبارية (Required Fields Check) ---
    const requiredFields = [
        { key: 'location', label: 'موقع العمل' },
        { key: 'visit_team', label: 'فريق الزيارة' },
        { key: 'consultant', label: 'اسم الاستشاري' },
        { key: 'contractor', label: 'اسم المقاول' },
        { key: 'order_number', label: 'رقم المقايسة / أمر العمل' },
        { key: 'work_desc', label: 'وصف العمل' },
        { key: 'receiver', label: 'المستلم' },
    ];

    for (const field of requiredFields) {
        if (!formData[field.key] || formData[field.key].trim() === '') {
            alert(`⚠️ حقل "${field.label}" مطلوب، لا يمكن ترك الحقول فارغة.`);
            topRef.current?.scrollIntoView();
            return;
        }
    }

    if (sigPad.current.isEmpty()) { 
        alert('⚠️ التوقيع مطلوب'); 
        sigContainerRef.current?.scrollIntoView(); 
        return; 
    }

    setLoading(true)
    setBtnText('جاري المعالجة...')

    try {
      const serial = Date.now()
      const payload = {
        serial,
        inspector: user.username,
        timestamp: new Date().toLocaleString('ar-SA'),
        ...formData,
        google_maps_link: geo,
        signature_image: sigPad.current.toDataURL('image/png', 0.5),
        answers: {},
        violations: []
      }

      for (let i = 0; i < qList.length; i++) {
        const qKey = i + 1
        const currentAns = answers[qKey] || {}
        const val = currentAns.val || 'N/A'
        
        payload.answers[qKey] = val === 'N/A' ? 'لا ينطبق' : val

        let processedPhotos = []
        if (currentAns.files && currentAns.files.length > 0) {
            setBtnText(`رفع صور بند ${qKey}...`)
            for (const file of currentAns.files) {
                const compressed = await compressImage(file);
                processedPhotos.push(compressed);
            }
        }

        // إذا كانت الإجابة لا، أو يوجد ملاحظات، أو يوجد صور، يتم إضافتها للمخالفات
        if (val === 'لا' || currentAns.note || processedPhotos.length > 0) {
          payload.violations.push({
            q: qList[i],
            ans: val === 'N/A' ? 'لا ينطبق' : val,
            note: currentAns.note || '',
            photos: processedPhotos
          })
        }
      }

      setBtnText('إرسال...')
      const { error } = await supabase.from('reports').insert([payload])
      if (error) throw error

      alert('✅ تم الإرسال بنجاح!')
      window.location.reload()

    } catch (err) {
      alert('خطأ: ' + err.message)
    } finally {
      setLoading(false)
      setBtnText('إعتماد وإرسال التقرير')
    }
  }

  if (!user) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontFamily:'Cairo'}}>تحميل...</div>

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {/* --- Custom Camera Overlay --- */}
      {showCamera && (
        <div className="camera-modal">
          <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
          <canvas ref={canvasRef} style={{display:'none'}}></canvas>
          
          <div className="camera-counter">الصور الملتقطة: {tempPhotos.length}</div>
          
          {tempPhotos.length > 0 && (
            <div className="temp-thumbs">
              {tempPhotos.map((f, i) => <img key={i} src={URL.createObjectURL(f)} className="temp-img" alt="" />)}
            </div>
          )}

          <div className="camera-controls">
            <button className="close-btn-cam" onClick={stopCamera}>إلغاء</button>
            <button className="snap-btn" onClick={takeSnap}></button>
            <button className="done-btn-cam" onClick={savePhotosFromCamera}>
              إتمام <i className="fa-solid fa-check"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="premium-header" ref={topRef}>
        <div className="inspector-badge"><i className="fa-solid fa-user-shield"></i><span>{user.username}</span></div>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            {user.role === 'admin' && (
                <button onClick={() => navigate('/admin')} style={{background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', padding:'5px 10px', fontSize:'14px'}}>
                    <i className="fa-solid fa-chart-line"></i> مدير
                </button>
            )}
            <button onClick={() => { sessionStorage.clear(); navigate('/'); }} style={{background:'none', border:'none', color:'rgba(255,255,255,0.7)', fontSize:'18px'}}><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
        </div>
      </div>

      <div style={{padding: '20px 15px'}}>
        <h2 className="main-title">مجموعة السلامة ادارة ضواحي الرياض</h2>
        
        {/* GPS Section */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-location-dot"></i>إثبات الموقع</div>
          <div className={`verify-item ${geo ? 'done' : ''}`} onClick={getGeo}>
            <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'} verify-icon`}></i>
            <div style={{fontWeight:'bold'}}>{geo ? 'تم تحديد الموقع' : 'تحديد الموقع GPS'}</div>
          </div>
        </div>

        {/* Info Section */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-file-contract"></i>بيانات التقرير</div>
          <div className="input-wrapper"><label className="input-label">موقع العمل (الحي / الشارع) *</label><input className="premium-input" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-map-pin input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">فريق الزيارة *</label><input className="premium-input" value={formData.visit_team} onChange={(e) => setFormData({...formData, visit_team: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-users input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">اسم الاستشاري *</label><input className="premium-input" value={formData.consultant} onChange={(e) => setFormData({...formData, consultant: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-user-tie input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">اسم المقاول *</label><input className="premium-input" value={formData.contractor} onChange={(e) => setFormData({...formData, contractor: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-hard-hat input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">رقم المقايسة / أمر العمل *</label><input className="premium-input" value={formData.order_number} onChange={(e) => setFormData({...formData, order_number: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-file-invoice input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">وصف العمل *</label><input className="premium-input" value={formData.work_desc} onChange={(e) => setFormData({...formData, work_desc: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-briefcase input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">المستلم *</label><input className="premium-input" value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} placeholder="مطلوب" /><i className="fa-solid fa-user-check input-icon"></i></div>
        </div>

        {/* Questions */}
        <h3 style={{margin:'20px 15px 10px', textAlign:'right'}}>قائمة الفحص</h3>
        {qList.map((q, i) => {
          const qIdx = i + 1
          const currentVal = answers[qIdx]?.val || 'N/A'
          const currentFiles = answers[qIdx]?.files || []
          const isAnswered = answers[qIdx]?.val && answers[qIdx]?.val !== 'N/A'

          return (
            <div key={i} className={`question-card ${isAnswered ? 'answered' : ''}`}>
              <div className="q-text">{qIdx}. {q}</div>
              
              <div className="options-container">
                <div className={`option-btn yes ${currentVal === 'نعم' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'نعم')}>نعم</div>
                <div className={`option-btn no ${currentVal === 'لا' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'لا')}>لا</div>
                <div className={`option-btn na ${currentVal === 'N/A' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'N/A')}>لا ينطبق</div>
              </div>

              <div className="actions-row">
                  {/* زر الكاميرا الخاصة فقط */}
                  <div className="action-btn" onClick={() => startCamera(qIdx)}>
                    <i className="fa-solid fa-camera" style={{color:'var(--primary)'}}></i> تصوير متعدد
                  </div>
              </div>

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
              
              <textarea className="note-input" placeholder="ملاحظات..." rows="1" onChange={(e) => handleAnswerChange(qIdx, 'note', e.target.value)} />
            </div>
          )
        })}

        {/* Warning */}
        <div className="premium-card warning-card" ref={warningRef}>
            <div className="warning-title"><i className="fa-solid fa-triangle-exclamation"></i>تعهد</div>
            <div className="warning-text">نؤكد بشكل قاطع أن دورك كمهندس مشرف  لا يقتصر على رصد الملاحظات وإعداد التقارير فقط، 

بل يشمل المتابعة المباشرة والفعلية للأخطاء التي تم رصدها، والتأكد من تصحيحها فورًا، واتخاذ الإجراءات اللازمة لضمان عدم تكرارها مستقبلًا، مع تحمل المسؤولية النظامية كاملة حيال أي تقصير في ذلك</div>
            <label className="ack-label">
                <input type="checkbox" className="ack-checkbox" checked={isAcknowledged} onChange={(e) => setIsAcknowledged(e.target.checked)} />
                <span className="ack-text-label">أقر بأنني قرأت وفهمت وألتزم بما ورد أعلاه</span>
            </label>
        </div>

        {/* Signature */}
        <div className="premium-card" ref={sigContainerRef}>
          <div className="section-title">توقيع المستلم</div>
          <div className="sig-wrapper" style={{border: '2px solid #e2e8f0', borderRadius: '12px'}}>
            <SignatureCanvas ref={sigPad} canvasProps={{ className: 'sig-canvas' }} backgroundColor="rgb(255, 255, 255)" />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{marginTop:'10px', color:'#ef4444', background:'none', border:'none', fontWeight:'bold'}}>مسح التوقيع</button>
        </div>
      </div>

      <div className="floating-footer">
        <button className="submit-main-btn" onClick={handleSubmit} disabled={loading || !isAcknowledged}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paper-plane"></i>} {btnText}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp
