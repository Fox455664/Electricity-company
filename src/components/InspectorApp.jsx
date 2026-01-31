import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة الموحدة
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
    "خطة المنع من السقوط",
    "خطة الإنقاذ في العمل على المرتفعات", 
    "خطة رفع الأحمال الحرجة", 
    "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة",
    "صور البطاقات"
];

const InspectorApp = () => {
  const navigate = useNavigate()
  const sigPad = useRef(null)
  const topRef = useRef(null)
  const sigContainerRef = useRef(null)
  const warningRef = useRef(null)

  // States
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إعتماد وإرسال التقرير')
  
  // حالة التعهد (صح/خطأ)
  const [isAcknowledged, setIsAcknowledged] = useState(false)

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
  
  // Verification (GPS)
  const [geo, setGeo] = useState(null)

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
    body { background-color: var(--bg-color); font-family: 'Cairo', sans-serif; margin: 0; padding: 0; }
    .app-container { width: 100%; max-width: 900px; margin: 0 auto; padding-bottom: 120px; }
    .premium-header { background: linear-gradient(135deg, #005a8f 0%, #004269 100%); color: white; padding: 20px; border-radius: 0 0 25px 25px; box-shadow: 0 10px 30px rgba(0, 90, 143, 0.15); position: sticky; top: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; }
    .inspector-badge { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(5px); padding: 8px 16px; border-radius: 50px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .main-title { text-align: center; margin: 0 0 5px 0; color: #0f172a; font-size: 20px; font-weight: 800; }
    .premium-card { background: var(--card-bg); border-radius: var(--border-radius); padding: 20px; margin: 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
    
    /* --- ستايل التعهد --- */
    .warning-card {
        background: #fef2f2;
        border: 2px solid #ef4444;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.15);
        animation: pulse-border 2s infinite;
        margin-top: 30px; /* مسافة إضافية قبل التوقيع */
    }
    @keyframes pulse-border {
        0% { border-color: #ef4444; }
        50% { border-color: #f87171; }
        100% { border-color: #ef4444; }
    }
    .warning-title {
        color: #b91c1c;
        font-weight: 900;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 15px;
    }
    .warning-text {
        color: #b91c1c;
        font-weight: 700;
        font-size: 15px;
        line-height: 1.8;
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 1px dashed #fca5a5;
        padding-bottom: 15px;
    }
    .ack-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        cursor: pointer;
        padding: 10px;
        background: white;
        border-radius: 10px;
        border: 1px solid #fca5a5;
        transition: all 0.3s;
    }
    .ack-label:hover {
        background: #fff1f2;
    }
    .ack-checkbox {
        width: 22px;
        height: 22px;
        accent-color: #dc2626;
        cursor: pointer;
    }
    .ack-text-label {
        font-weight: bold;
        color: #991b1b;
        font-size: 14px;
        user-select: none;
    }
    /* ---------------- */

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
    .action-btn { flex: 1; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; background: #f8fafc; color: var(--text-main); }
    .img-grid { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .img-thumb { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 2px solid #e2e8f0; position: relative; }
    .del-btn { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; border: none; }
    .note-input { width: 100%; margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: 'Cairo'; font-size: 13px; resize: none; box-sizing: border-box; }
    .floating-footer { position: fixed; bottom: 20px; left: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); z-index: 100; display: flex; justify-content: center; }
    .submit-main-btn { background: linear-gradient(135deg, var(--accent) 0%, #e67e00 100%); color: white; border: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; width: 100%; box-shadow: 0 4px 15px rgba(242, 139, 0, 0.4); cursor: pointer; font-family: 'Cairo', sans-serif; transition: all 0.3s; }
    .submit-main-btn:disabled { background: #cbd5e1; cursor: not-allowed; box-shadow: none; opacity: 0.7; }
    .sig-canvas { width: 100% !important; height: 200px !important; border-radius: 8px; }
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
          resolve(elem.toDataURL('image/jpeg', 0.5))
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
          return {
              ...prev,
              [qIndex]: { ...prev[qIndex], files }
          }
      });
  }

  const handleSubmit = async () => {
    // --- 1. التحقق من التعهد (إجباري) ---
    if (!isAcknowledged) {
        alert('⛔ يجب الموافقة على التعهد الموجود أعلى خانة التوقيع قبل الإرسال.');
        warningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (!geo) { alert('⚠️ يرجى تحديد الموقع أولاً'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!formData.contractor) { alert('⚠️ يرجى كتابة اسم المقاول'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    
    if (sigPad.current.isEmpty()) {
        alert('⚠️ يجب توقيع المستلم قبل إرسال التقرير');
        sigContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

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
        signature_image: sigPad.current.toDataURL('image/png', 0.5),
        answers: {},
        violations: []
      }

      for (let i = 0; i < qList.length; i++) {
        const qKey = i + 1
        const currentAns = answers[qKey] || {}
        const val = currentAns.val || 'N/A'
        const note = currentAns.note || ''
        
        payload.answers[qKey] = val === 'N/A' ? 'لا ينطبق' : val

        let processedPhotos = []
        if (currentAns.files && currentAns.files.length > 0) {
            setBtnText(`جاري رفع ${currentAns.files.length} صور للبند ${qKey}...`)
            for (const file of currentAns.files) {
                try {
                    const compressed = await compressImage(file);
                    processedPhotos.push(compressed);
                } catch (e) { console.error("Compression error", e); }
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
      if ((jsonString.length / 1024 / 1024) > 5.5) {
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
        <div className="inspector-badge"><i className="fa-solid fa-user-shield"></i><span>{user.username}</span></div>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            {user.role === 'admin' && (
                <button 
                    onClick={() => navigate('/admin')} 
                    style={{background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:'8px', color:'white', padding:'5px 10px', cursor:'pointer', fontSize:'14px'}}
                >
                    <i className="fa-solid fa-chart-line"></i> مدير
                </button>
            )}
            <button onClick={() => { sessionStorage.clear(); navigate('/'); }} style={{background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'18px'}}><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
        </div>
      </div>

      <div style={{padding: '20px 15px'}}>
        <h2 className="main-title">مجموعة السلامة ادارة ضواحي الرياض</h2>
        <p style={{margin: '0 0 20px 0', color: '#64748b', fontSize: '14px', textAlign:'center'}}><i className="fa-regular fa-calendar"></i> {new Date().toLocaleDateString('ar-SA')}</p>

        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-location-dot"></i>إثبات الموقع</div>
          <div className={`verify-item ${geo ? 'done' : ''}`} onClick={getGeo}>
            <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'} verify-icon`}></i>
            <div style={{fontWeight:'bold', fontSize:'14px'}}>{geo ? 'تم تحديد الموقع' : 'تحديد الموقع GPS'}</div>
             <div style={{fontSize:'11px', color:'#94a3b8', marginTop:'5px'}}>{geo ? 'إحداثيات دقيقة ✅' : 'اضغط لتفعيل GPS'}</div>
          </div>
        </div>

        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-file-contract"></i>بيانات التقرير</div>
          <div className="input-wrapper"><label className="input-label">موقع العمل (الحي / الشارع)</label><input className="premium-input" placeholder="الحي / الشارع..." value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /><i className="fa-solid fa-map-pin input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">فريق الزيارة</label><input className="premium-input" placeholder="اسماء فريق الزيارة..." value={formData.visit_team} onChange={(e) => setFormData({...formData, visit_team: e.target.value})} /><i className="fa-solid fa-users input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">اسم الاستشاري</label><input className="premium-input" placeholder="اسم الاستشاري..." value={formData.consultant} onChange={(e) => setFormData({...formData, consultant: e.target.value})} /><i className="fa-solid fa-user-tie input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">اسم المقاول</label><input className="premium-input" placeholder="اكتب اسم الشركة المنفذة..." value={formData.contractor} onChange={(e) => setFormData({...formData, contractor: e.target.value})} /><i className="fa-solid fa-hard-hat input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">رقم المقايسة / أمر العمل</label><input className="premium-input" placeholder="رقم أمر العمل..." value={formData.order_number} onChange={(e) => setFormData({...formData, order_number: e.target.value})} /><i className="fa-solid fa-file-invoice input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">وصف العمل</label><input className="premium-input" placeholder="صيانة / تركيب / حفر..." value={formData.work_desc} onChange={(e) => setFormData({...formData, work_desc: e.target.value})} /><i className="fa-solid fa-briefcase input-icon"></i></div>
          <div className="input-wrapper"><label className="input-label">المستلم</label><input className="premium-input" placeholder="اسم مستلم العمل..." value={formData.receiver} onChange={(e) => setFormData({...formData, receiver: e.target.value})} /><i className="fa-solid fa-user-check input-icon"></i></div>
        </div>

        <h3 style={{margin:'20px 15px 10px', color:'#0f172a', textAlign:'right'}}>قائمة الفحص</h3>
        {qList.map((q, i) => {
          const qIdx = i + 1
          const currentVal = answers[qIdx]?.val || 'N/A'
          const isAnswered = answers[qIdx]?.val && answers[qIdx]?.val !== 'N/A'
          const currentFiles = answers[qIdx]?.files || []

          return (
            <div key={i} className={`question-card ${isAnswered ? 'answered' : ''}`}>
              <div className="q-text">{qIdx}. {q}</div>
              
              <div className="options-container">
                <div className={`option-btn yes ${currentVal === 'نعم' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'نعم')}><i className="fa-solid fa-check"></i> نعم</div>
                <div className={`option-btn no ${currentVal === 'لا' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'لا')}><i className="fa-solid fa-xmark"></i> لا</div>
                <div className={`option-btn na ${currentVal === 'N/A' ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', 'N/A')}>لا ينطبق</div>
              </div>

              <div className="actions-row">
                  <div className="action-btn" onClick={() => document.getElementById(`cam-${qIdx}`).click()}>
                    <i className="fa-solid fa-camera" style={{color:'var(--primary)'}}></i>التقاط صورة
                  </div>
              </div>

              <input type="file" id={`cam-${qIdx}`} style={{display:'none'}} accept="image/*" multiple capture="environment" onChange={(e) => handleAddPhoto(qIdx, e.target.files)} />

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
              
              <textarea className="note-input" placeholder="أضف ملاحظاتك هنا..." rows="1" onChange={(e) => handleAnswerChange(qIdx, 'note', e.target.value)} />
            </div>
          )
        })}

        {/* --- تم تغيير العنوان إلى "تعهد" هنا --- */}
        <div className="premium-card warning-card" ref={warningRef}>
            <div className="warning-title">
                <i className="fa-solid fa-triangle-exclamation fa-beat" style={{color:'#ef4444'}}></i>
                تعهد
            </div>
            <div className="warning-text">
                نؤكد بشكل قاطع أن دورك كمهندس مشرف لا يقتصر على رصد الملاحظات وإعداد التقارير فقط، بل يشمل المتابعة المباشرة والفعلية للأخطاء التي تم رصدها، والتأكد من تصحيحها فورًا، واتخاذ الإجراءات اللازمة لضمان عدم تكرارها مستقبلًا، مع تحمل المسؤولية النظامية كاملة حيال أي تقصير في ذلك.
            </div>
            <label className="ack-label">
                <input 
                    type="checkbox" 
                    className="ack-checkbox"
                    checked={isAcknowledged}
                    onChange={(e) => setIsAcknowledged(e.target.checked)}
                />
                <span className="ack-text-label">أقر بأنني قرأت وفهمت وألتزم بما ورد أعلاه</span>
            </label>
        </div>
        {/* -------------------------------------- */}

        <div className="premium-card" ref={sigContainerRef}>
          <div className="section-title">
            <i className="fa-solid fa-file-signature"></i>
            توقيع المستلم <span style={{color:'red', fontSize:'12px', marginRight:'5px'}}>(إجباري)</span>
          </div>
          <div className="sig-wrapper" style={{border: '2px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden'}}>
            <SignatureCanvas ref={sigPad} canvasProps={{ className: 'sig-canvas' }} backgroundColor="rgb(255, 255, 255)" />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{marginTop:'10px', color:'#ef4444', background:'none', border:'none', fontWeight:'bold', cursor:'pointer'}}><i className="fa-solid fa-eraser"></i> مسح التوقيع</button>
        </div>
      </div>

      <div className="floating-footer">
        {/* الزر الآن يتأثر بحالة التعهد */}
        <button 
            className="submit-main-btn" 
            onClick={handleSubmit} 
            disabled={loading || !isAcknowledged} 
            title={!isAcknowledged ? "يجب الموافقة على التعهد أعلاه أولاً" : ""}
        >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paper-plane"></i>} {btnText}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp
