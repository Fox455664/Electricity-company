import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة المحدثة حسب طلبك
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
    "وجود شعار المقاول على المركبات والمعدات", 
    "تم ازالة المخلفات بعد الانتهاء من العمل", 
    "خطة الطوارئ", 
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
    work_order_no: '',
    visit_team: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  // Verification
  const [geo, setGeo] = useState(null)

  // Answers Store (Changed to store multiple files)
  const [answers, setAnswers] = useState({})

  // --- Premium Styles ---
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
    body { background-color: var(--bg-color); font-family: 'Cairo', sans-serif; direction: rtl; }
    .app-container { max-width: 800px; margin: 0 auto; padding-bottom: 100px; }
    .premium-header {
      background: linear-gradient(135deg, #005a8f 0%, #004269 100%);
      color: white; padding: 20px; border-radius: 0 0 25px 25px;
      box-shadow: 0 10px 30px rgba(0, 90, 143, 0.15);
      position: sticky; top: 0; z-index: 1000;
      display: flex; justify-content: space-between; align-items: center;
    }
    .inspector-badge { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(5px); padding: 8px 16px; border-radius: 50px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
    .premium-card { background: var(--card-bg); border-radius: var(--border-radius); padding: 24px; margin: 20px 15px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
    .section-title { font-size: 18px; font-weight: 700; color: var(--primary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
    .verify-item { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: all 0.3s ease; }
    .verify-item.done { border-color: var(--success); background: #ecfdf5; }
    .input-wrapper { margin-bottom: 15px; position: relative; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-light); margin-bottom: 6px; }
    .premium-input { width: 100%; padding: 14px 40px 14px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-family: 'Cairo', sans-serif; background: #f8fafc; box-sizing: border-box; }
    .input-icon { position: absolute; top: 38px; right: 15px; color: #94a3b8; }
    .question-card { background: white; border-radius: 12px; padding: 20px; margin: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-right: 4px solid transparent; }
    .question-card.answered { border-right-color: var(--primary); }
    .options-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 5px; margin-top: 10px; }
    .option-btn { flex: 1; padding: 10px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-light); }
    .option-btn.active { color: white; }
    .option-btn.yes.active { background: #10b981; }
    .option-btn.no.active { background: #ef4444; }
    .option-btn.na.active { background: #64748b; }
    .photo-btn { margin-top: 15px; background: #fff; border: 1px dashed #cbd5e1; color: var(--primary); width: 100%; padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .floating-footer { position: fixed; bottom: 20px; left: 20px; right: 20px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 15px; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); z-index: 100; }
    .submit-main-btn { background: linear-gradient(135deg, var(--accent) 0%, #e67e00 100%); color: white; border: none; padding: 16px; border-radius: 50px; font-weight: 700; width: 100%; cursor: pointer; font-family: 'Cairo'; }
    .sig-wrapper { border: 2px solid #e2e8f0; border-radius: 12px; background: white; }
    .file-counter { font-size: 11px; color: var(--success); margin-top: 5px; font-weight: bold; }
  `;

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) navigate('/')
    else setUser(JSON.parse(userData))
  }, [navigate])

  const getGeo = () => {
    if (!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع')
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
      () => alert('فشل تحديد الموقع. تأكد من تفعيل GPS')
    )
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
          const MAX_WIDTH = 800 // Reduced for faster upload
          const scaleFactor = MAX_WIDTH / img.width
          elem.width = MAX_WIDTH
          elem.height = img.height * scaleFactor
          const ctx = elem.getContext('2d')
          ctx.drawImage(img, 0, 0, elem.width, elem.height)
          resolve(elem.toDataURL('image/jpeg', 0.3)) // Quality 0.3 for weight reduction
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

  const handleFileChange = (qIndex, files) => {
    const fileArray = Array.from(files);
    setAnswers(prev => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], files: [...(prev[qIndex]?.files || []), ...fileArray] }
    }))
  }

  const handleSubmit = async () => {
    if (!geo) { alert('⚠️ يرجى تحديد الموقع أولاً'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!formData.contractor) { alert('⚠️ يرجى كتابة اسم المقاول'); return; }

    setLoading(true)
    setBtnText('جاري تجهيز البيانات...')

    try {
      const serial = Date.now()
      const payload = {
        serial,
        inspector: user.username,
        timestamp: new Date().toLocaleString('ar-SA'),
        ...formData,
        google_maps_link: geo,
        signature_image: sigPad.current.isEmpty() ? null : sigPad.current.toDataURL('image/png', 0.5),
        answers: {},
        violations: []
      }

      for (let i = 0; i < qList.length; i++) {
        const qKey = i + 1
        setBtnText(`معالجة البند (${i + 1}/${qList.length})`)

        const currentAns = answers[qKey] || {}
        const val = currentAns.val || 'N/A'
        const note = currentAns.note || ''
        
        payload.answers[qKey] = val === 'N/A' ? 'لا ينطبق' : val

        let compressedImages = []
        if (currentAns.files && currentAns.files.length > 0) {
            for(let file of currentAns.files) {
                const img = await compressImage(file)
                compressedImages.push(img)
            }
        }

        if (val === 'لا' || note || compressedImages.length > 0) {
          payload.violations.push({
            q: qList[i],
            ans: val === 'N/A' ? 'لا ينطبق' : val,
            note,
            photos: compressedImages // Multiple photos stored here
          })
        }
      }

      setBtnText('جاري الإرسال النهائي...')
      const { error } = await supabase.from('reports').insert([payload])
      if (error) throw error

      alert('✅ تم إرسال التقرير بنجاح!')
      window.location.reload()

    } catch (err) {
      alert('خطأ أثناء الإرسال: ' + err.message)
      setBtnText('إعادة المحاولة')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div style={{textAlign:'center', padding:'50px'}}>جاري التحميل...</div>

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      <div className="premium-header" ref={topRef}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
           <div className="inspector-badge">
             <i className="fa-solid fa-user-shield"></i>
             <span>{user.username}</span>
           </div>
        </div>
        <div style={{fontWeight:'bold', fontSize:'14px'}}>مجموعة السلامة إدارة ضواحي الرياض</div>
      </div>

      <div style={{padding: '20px 15px'}}>
        <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>نظام التفتيش الميداني</h2>
        <p style={{margin: '0 0 20px 0', color: '#64748b', fontSize: '14px'}}>
          <i className="fa-regular fa-calendar"></i> {new Date().toLocaleDateString('ar-SA')}
        </p>

        {/* GPS Section */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-location-dot"></i> الموقع الجغرافي</div>
          <div className={`verify-item ${geo ? 'done' : ''}`} onClick={getGeo}>
            <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'}`} style={{fontSize:'30px', marginBottom:'10px', color: geo ? '#10b981' : '#64748b'}}></i>
            <div style={{fontWeight:'bold'}}>{geo ? 'تم تحديد الموقع بنجاح' : 'اضغط لتحديد موقع العمل الفعلي'}</div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-file-lines"></i> بيانات التقرير</div>
          
          {[
            { label: 'اسم المقاول', field: 'contractor', icon: 'fa-hard-hat', placeholder: 'اسم الشركة المنفذة' },
            { label: 'رقم أمر العمل / المهمة', field: 'work_order_no', icon: 'fa-hashtag', placeholder: 'أدخل الرقم' },
            { label: 'وصف العمل', field: 'work_desc', icon: 'fa-briefcase', placeholder: 'مثال: صيانة شبكة، تركيب محول' },
            { label: 'فريق الزيارة', field: 'visit_team', icon: 'fa-users', placeholder: 'أسماء فريق العمل' },
            { label: 'اسم الاستشاري', field: 'consultant', icon: 'fa-user-tie', placeholder: 'إن وجد' },
            { label: 'وصف مكان العمل', field: 'location', icon: 'fa-map-pin', placeholder: 'الحي / الشارع' },
            { label: 'المستلم', field: 'receiver', icon: 'fa-user-check', placeholder: 'اسم مستلم العمل' },
          ].map((item, idx) => (
            <div className="input-wrapper" key={idx}>
              <label className="input-label">{item.label}</label>
              <input 
                className="premium-input" 
                placeholder={item.placeholder} 
                value={formData[item.field]} 
                onChange={(e) => setFormData({...formData, [item.field]: e.target.value})} 
              />
              <i className={`fa-solid ${item.icon} input-icon`}></i>
            </div>
          ))}
        </div>

        {/* Questions */}
        <h3 style={{margin:'20px 15px 10px'}}>قائمة الفحص</h3>
        {qList.map((q, i) => {
          const qIdx = i + 1
          const currentVal = answers[qIdx]?.val || 'N/A'
          const filesCount = answers[qIdx]?.files?.length || 0

          return (
            <div key={i} className={`question-card ${currentVal !== 'N/A' ? 'answered' : ''}`}>
              <div style={{fontWeight:'700', lineHeight:'1.5'}}>{qIdx}. {q}</div>
              
              <div className="options-container">
                {['نعم', 'لا', 'N/A'].map(opt => (
                  <div 
                    key={opt}
                    className={`option-btn ${opt === 'نعم' ? 'yes' : opt === 'لا' ? 'no' : 'na'} ${currentVal === opt ? 'active' : ''}`}
                    onClick={() => handleAnswerChange(qIdx, 'val', opt)}
                  >
                    {opt === 'N/A' ? 'لا ينطبق' : opt}
                  </div>
                ))}
              </div>

              <button className="photo-btn" onClick={() => document.getElementById(`file-${qIdx}`).click()}>
                <i className="fa-solid fa-camera"></i> 
                إرفاق صور (كاميرا/ألبوم)
              </button>
              {filesCount > 0 && <div className="file-counter">تم إرفاق ({filesCount}) صور</div>}
              
              <input 
                type="file" id={`file-${qIdx}`} style={{display:'none'}} accept="image/*" multiple capture="environment"
                onChange={(e) => handleFileChange(qIdx, e.target.files)}
              />
              
              <textarea
                className="premium-input" style={{marginTop:'10px', height:'60px', paddingRight:'15px'}}
                placeholder="ملاحظات إضافية..."
                onChange={(e) => handleAnswerChange(qIdx, 'note', e.target.value)}
              />
            </div>
          )
        })}

        {/* Signature */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-signature"></i> توقيع المستلم</div>
          <div className="sig-wrapper">
            <SignatureCanvas ref={sigPad} canvasProps={{ width: 600, height: 200, className: 'sig-canvas' }} />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{marginTop:'10px', color:'red', background:'none', border:'none', cursor:'pointer'}}>مسح التوقيع</button>
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
