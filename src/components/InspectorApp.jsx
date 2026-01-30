import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// قائمة الأسئلة
const qList = [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل", 
    "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", 
    "نموذج فريق العمل متواجد بموقع العمل", 
    "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", 
    "إلمام المستلم وفريق العمل بإجراءات العمل الآمن", 
    "ملاحظات", 
    "بطاقة تعميد المصدر والمستلم والعامل المشارك سارية", 
    "تأهيل سائق المعدات", 
    "المستلم متواجد بموقع العمل", 
    "وضع أقفال السلامة و البطاقات التحذيرية", 
    "التأكد من تركيب الأرضي المتنقل من الجهتين", 
    "التأكد من فعالية جهاز كشف الجهد التستر", 
    "نموذج فحص المركبة", 
    "شهادة المسعف", 
    "شهادة المكافح", 
    "شهادة TUV السائق", 
    "فحص TUV المعدات", 
    "التأكد من مطابقة السلات للمواصفات", 
    "التأكد من سلامة خطاف الونش واحبال الرفع", 
    "طفاية حريق سليمة ومفحوصة", 
    "شنطة إسعافات مكتملة ومفحوصة", 
    "التأكد من تركيب الأرضي للسيارات", 
    "الحمل الأقصى محدد بوضوح على معدات الرفع", 
    "مهام الوقاية الشخصية سليمة (خوذة - ملابس – حذاء)", 
    "التفتيش على القفاز المطاطي", 
    "الخوذة الكهربائية مزودة بحامى وجة", 
    "أحزمة السلامة مرقمة وسليمة", 
    "استخدام حواجز حماية سليمة وشريط تحذيري", 
    "كفاية اللوحات الإرشادية المرورية", 
    "الترميز بالألوان حسب الشهر", 
    "تخزين أسطوانات الغاز واللحام وترميزها", 
    "وجود أغطية الحماية لأسطوانات الغاز", 
    "ليات الاوكسي استيلين سليمة", 
    "وجود شعار المقاول على المركبات والمعدات", 
    "تم ازالة المخلفات بعد الانتهاء من العمل", 
    "خطة الطوارئ", 
    "خطة المنع من السقوط", 
    "خطة الإنقاذ في العمل على المرتفعات", 
    "خطة رفع الأحمال الحرجة", 
    "ملصقات العمل على مرتفعات",
    "صور البطاقات"
];

const InspectorApp = () => {
  const navigate = useNavigate()
  const sigPad = useRef(null)
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [geo, setGeo] = useState(null)
  const [hijriDate, setHijriDate] = useState('')
  const [answers, setAnswers] = useState({})
  
  const [formData, setFormData] = useState({
    contractor: '',
    work_order_no: '',
    work_desc: '',
    consultant: '',
    location: '',
  })

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) navigate('/')
    else setUser(JSON.parse(userData))

    // تنسيق التاريخ الهجري
    const date = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', calendar: 'islamic-umalqura' };
    setHijriDate(new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options).format(date));
  }, [navigate])

  const getGeo = () => {
    if (!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع');
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
      () => alert('الرجاء تفعيل GPS')
    )
  }

  // دوال المعالجة
  const handleAnswerChange = (qIdx, field, value) => setAnswers(prev => ({...prev, [qIdx]: { ...prev[qIdx], [field]: value }}));
  const handleFileChange = (qIdx, files) => setAnswers(prev => ({...prev, [qIdx]: { ...prev[qIdx], files: Array.from(files) }}));

  const handleSubmit = async () => {
    if (!geo) return alert('يرجى تحديد الموقع أولاً');
    setLoading(true);
    // كود الإرسال هنا (supabase)
    setTimeout(() => { setLoading(false); alert('تم الإرسال (محاكاة)'); }, 1500);
  }

  if (!user) return null;

  // ------------------------------------------
  // Styles CSS
  // ------------------------------------------
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    
    :root {
      --primary: #004d7a;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #1f2937;
      --accent-green: #10b981;
    }

    body {
      background-color: var(--bg);
      font-family: 'Cairo', sans-serif;
      margin: 0; padding: 0; direction: rtl;
      -webkit-tap-highlight-color: transparent;
    }

    /* Header */
    .app-header {
      background-color: var(--primary);
      padding: 15px 20px;
      border-bottom-left-radius: 30px;
      border-bottom-right-radius: 30px;
      display: flex; justify-content: space-between; align-items: center;
      color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .logo-box { background: white; padding: 5px 10px; border-radius: 12px; height: 35px; display: flex; align-items: center; color: var(--primary); font-weight: bold; font-size: 12px; }
    .user-pill { background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 50px; display: flex; align-items: center; gap: 8px; font-size: 13px; backdrop-filter: blur(5px); }

    /* Title Section */
    .main-title-container { text-align: center; margin: 25px 0; }
    .main-title { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
    .sub-date { color: #64748b; font-size: 13px; margin-top: 5px; font-weight: 600; }

    /* Cards Common */
    .content-card {
      background: var(--card-bg);
      border-radius: 20px;
      padding: 20px;
      margin: 15px 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
    }
    .card-title { font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }

    /* Location Button (Full Width) */
    .btn-location {
      width: 100%;
      background: #ecfdf5;
      border: 2px solid #10b981;
      color: #065f46;
      padding: 25px;
      border-radius: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: 0.2s;
      box-sizing: border-box;
    }
    .btn-location.pending {
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        color: #64748b;
    }
    .loc-icon { font-size: 35px; margin-bottom: 10px; }
    .loc-text { font-weight: 800; font-size: 16px; margin-bottom: 5px; }
    .loc-sub { font-size: 12px; opacity: 0.8; }

    /* Inputs */
    .input-group { position: relative; margin-bottom: 12px; }
    .input-icon { position: absolute; top: 50%; right: 15px; transform: translateY(-50%); color: #94a3b8; font-size: 16px; }
    .modern-input {
      width: 100%; padding: 14px 45px 14px 15px;
      background: #f1f5f9; border: 1px solid transparent; border-radius: 12px;
      font-family: 'Cairo'; font-size: 14px; box-sizing: border-box; outline: none; color: #334155;
    }
    .modern-input:focus { background: #fff; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0, 77, 122, 0.1); }

    /* Questions List */
    .q-item { border-bottom: 1px solid #f1f5f9; padding: 15px 0; }
    .q-text { font-weight: 700; font-size: 14px; color: #334155; margin-bottom: 10px; }
    .q-options { display: flex; gap: 8px; }
    .q-opt { 
        flex: 1; padding: 10px; border-radius: 10px; text-align: center; 
        background: #f1f5f9; color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s;
    }
    .q-opt.active { background: var(--primary); color: white; transform: scale(0.98); }
    .camera-btn { 
        background: #f1f5f9; padding: 0 15px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer;
    }
    
    /* Submit Btn */
    .floating-submit { position: fixed; bottom: 25px; left: 20px; right: 20px; z-index: 100; }
    .submit-btn {
      width: 100%; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white; border: none; padding: 16px; border-radius: 50px;
      font-family: 'Cairo'; font-weight: 800; font-size: 16px;
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3); cursor: pointer;
      display: flex; justify-content: center; align-items: center; gap: 10px;
    }
  `;

  return (
    <div style={{paddingBottom: '100px'}}>
      <style>{styles}</style>
      
      {/* Header */}
      <div className="app-header">
        <div className="logo-box">مجموعة السلامة ادارة ضواحي الرياض</div>
        <div className="user-pill">
           <span>{user.username || 'Admin'}</span>
           <i className="fa-solid fa-user-circle"></i>
        </div>
      </div>

      {/* Title */}
      <div className="main-title-container">
        <h1 className="main-title">نظام السلامة الميداني</h1>
        <div className="sub-date">
            <i className="fa-regular fa-calendar-check" style={{marginLeft: '5px'}}></i>
            {hijriDate}
        </div>
      </div>

      {/* Verification Card (Location Only) */}
      <div className="content-card">
        <div className="card-title">
            <i className="fa-solid fa-location-dot" style={{color: '#0ea5e9'}}></i>
            إثبات التواجد
        </div>
        
        {/* زر الموقع الكبير */}
        <div className={`btn-location ${geo ? '' : 'pending'}`} onClick={getGeo}>
            <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'} loc-icon`}></i>
            <div className="loc-text">{geo ? 'تم تحديد الموقع بنجاح' : 'اضغط لتحديد موقع العمل'}</div>
            <div className="loc-sub">
                {geo ? <span style={{color:'#059669'}}>إحداثيات دقيقة ومؤكدة ✅</span> : 'مطلوب للمتابعة'}
            </div>
        </div>
      </div>

      {/* Form Data */}
      <div className="content-card">
        <div className="card-title">
            <i className="fa-solid fa-file-contract" style={{color: '#0ea5e9'}}></i>
            بيانات التقرير
        </div>

        <div className="form-container">
    {/* حقل التاريخ - يظهر في الصورة الثانية */}
    <div className="input-group">
        <i className="fa-solid fa-calendar-days input-icon"></i>
        <input type="date" className="modern-input" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} />
    </div>

    {/* اسم الاستشاري */}
    <div className="input-group">
        <i className="fa-solid fa-user-tie input-icon"></i>
        <input className="modern-input" placeholder="اسم الاستشاري" value={formData.consultant} onChange={e=>setFormData({...formData, consultant: e.target.value})} />
    </div>

    {/* اسم المقاول */}
    <div className="input-group">
        <i className="fa-solid fa-helmet-safety input-icon"></i>
        <input className="modern-input" placeholder="اسم المقاول" value={formData.contractor} onChange={e=>setFormData({...formData, contractor: e.target.value})} />
    </div>

    {/* موقع العمل */}
    <div className="input-group">
        <i className="fa-solid fa-map-pin input-icon"></i>
        <input className="modern-input" placeholder="موقع العمل" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} />
    </div>

    {/* --- الإضافات الجديدة بناءً على الصور --- */}

    {/* اسم الحي */}
    <div className="input-group">
        <i className="fa-solid fa-city input-icon"></i>
        <input className="modern-input" placeholder="اسم الحي" value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} />
    </div>

    {/* اسم فريق الزيارة */}
    <div className="input-group">
        <i className="fa-solid fa-users input-icon"></i>
        <input className="modern-input" placeholder="اسم فريق الزيارة" value={formData.visit_team} onChange={e=>setFormData({...formData, visit_team: e.target.value})} />
    </div>

    {/* اسم المشرف */}
    <div className="input-group">
        <i className="fa-solid fa-user-check input-icon"></i>
        <input className="modern-input" placeholder="اسم المشرف" value={formData.supervisor} onChange={e=>setFormData({...formData, supervisor: e.target.value})} />
    </div>

    {/* رقم الأمر / المهمة */}
    <div className="input-group">
        <i className="fa-solid fa-list-check input-icon"></i>
        <input className="modern-input" placeholder="رقم ( المقايسة / امر العمل / المهمة )" value={formData.work_order_no} onChange={e=>setFormData({...formData, work_order_no: e.target.value})} />
    </div>

    {/* وصف العمل */}
    <div className="input-group">
        <i className="fa-solid fa-pen-to-square input-icon"></i>
        <textarea className="modern-input" placeholder="وصف العمل" value={formData.work_description} onChange={e=>setFormData({...formData, work_description: e.target.value})} rows="3"></textarea>
    </div>

    {/* اسم المستلم (يظهر في أسفل الصورة الثانية) */}
    <div className="input-group">
        <i className="fa-solid fa-signature input-icon"></i>
        <input className="modern-input" placeholder="اسم المستلم" value={formData.receiver} onChange={e=>setFormData({...formData, receiver: e.target.value})} />
    </div>
</div>

      {/* Questions */}
      <div className="content-card">
        <div className="card-title">
             <i className="fa-solid fa-clipboard-check" style={{color: '#0ea5e9'}}></i>
             بنود التفتيش
        </div>
        {qList.map((q, i) => (
            <div key={i} className="q-item">
                <div className="q-text">{i+1}. {q}</div>
                <div className="q-options">
                    {['نعم', 'لا', 'N/A'].map(opt => (
                        <div key={opt} 
                             className={`q-opt ${answers[i+1]?.val === opt ? 'active' : ''}`}
                             onClick={() => handleAnswerChange(i+1, 'val', opt)}>
                             {opt === 'N/A' ? 'لا ينطبق' : opt}
                        </div>
                    ))}
                    <div className="camera-btn" onClick={()=>document.getElementById(`f-${i}`).click()}>
                        <i className="fa-solid fa-camera"></i>
                        <input type="file" id={`f-${i}`} hidden onChange={(e)=>handleFileChange(i+1, e.target.files)} />
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Signature */}
      <div className="content-card">
        <div className="card-title">توقيع المستلم</div>
        <div style={{background:'#f8fafc', borderRadius:'12px', border:'1px dashed #cbd5e1', overflow:'hidden'}}>
            <SignatureCanvas ref={sigPad} canvasProps={{width:320, height:160, className:'sig-canvas'}} />
        </div>
        <button onClick={()=>sigPad.current.clear()} style={{marginTop:'12px', color:'#ef4444', background:'transparent', border:'none', fontSize:'13px', fontWeight:'bold', cursor:'pointer'}}>
            <i className="fa-solid fa-trash-can"></i> مسح التوقيع
        </button>
      </div>

      {/* Floating Button */}
      <div className="floating-submit">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'إعتماد وإرسال التقرير'}
            {!loading && <i className="fa-regular fa-paper-plane"></i>}
        </button>
      </div>

    </div>
  )
}

export default InspectorApp
