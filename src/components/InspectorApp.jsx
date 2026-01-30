import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// قائمة الأسئلة
const qList = [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل", "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة – وصف العمل – رقم التصريح – توقيع مشرف الكهرب والشركة)", "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", "إلمام المستلم وفريق العمل بإجراءات العمل الآمن وتقييم المخاطر للمهمة", "ملاحظات", "بطاقة تعميد المصدر والمستلم والعامل المشارك سارية وبصلاحيات مناسبة للعمل", "تأهيل سائق المعدات (سائق ونش – سلة هوائية -........)", "المستلم متواجد بموقع العمل", "وضع أقفال السلامة و البطاقات التحذيرية و إكتمال بيانات التواصل", "التأكد من تركيب الأرضي المتنقل من الجهتين", "التأكد من فعالية جهاز كشف الجهد التستر", "التأكد من تواجد نموذج فحص المركبة والعدد والادوات متواجد شهادة المسعف والمكافح وفحص المركبة والباركود الخاص بالخطط", "نماذج الفحص", "نموذج فحص المركبة", "نموذج فحص العدد والادوات", "شهادة المسعف", "شهادة المكافح", "شهادة tuv", "QR Code", "فحص معدات الرفع و الحفر من قبل طرف ثالث (تى يو فى)", "التأكد من مطابقة السلات للمواصفات ( كفرات – زيوت – كسور – حزام الأمان – تكدس مواد .. الخ)", "التأكد من سلامة خطاف الونش واحبال الرفع", "طفاية حريق سليمة ومفحوصة وسلامة استكر الفحص", "شنطة إسعافات مكتملة ومفحوصة", "التأكد من تركيب الأرضي للسيارات", "الحمل الأقصى محدد بوضوح على جميع معدات الرفع", "مهام الوقاية الشخصية سليمة (بسؤال الموظف والتفتيش علية) خوذة - ملابس – حذاء", "التفتيش على القفاز المطاطي (33000 – 13000 – 1000) ك.ف.أ", "الخوذة الكهربائية مزودة بحامى وجة", "أحزمة السلامة مرقمة وسليمة", "استخدام حواجز حماية سليمة وكافية و شريط تحذيري", "كفاية اللوحات الإرشادية المرورية", "الترميز بالألوان حسب الشهر للعدد والأدوات وأدوات السلامة", "تخزين أسطوانات الغاز وأسطوانات الاكسجين واللحام وترميزها", "وجود أغطية الحماية لأسطوانات الغاز والأكسجين", "ليات الاوكسي استيلين لا يوجد بها تشققات او تالفة", "سلامة المنظم والعدادات", "وجود شعار المقاول على المركبات والمعدات", "تم ازالة المخلفات بعد الانتهاء من العمل", "خطط متعلقة بتصاريح العمل", "خطة الطوارئ", "خطة المنع من السقوط", "خطة الإنقاذ في العمل على المرتفعات", "خطة رفع الأحمال الحرجة", "إجراء وملصقات حماية السمع", "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة"
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
    date: new Date().toISOString().split('T')[0], // القيمة الافتراضية تاريخ اليوم
    consultant: '',
    contractor: '',
    location: '',
    district: '',
    visit_team: '',
    supervisor: '',
    work_order_no: '',
    work_description: '',
    receiver: '',
  })

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) navigate('/')
    else setUser(JSON.parse(userData))

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

  const handleAnswerChange = (qIdx, field, value) => setAnswers(prev => ({...prev, [qIdx]: { ...prev[qIdx], [field]: value }}));
  const handleFileChange = (qIdx, files) => setAnswers(prev => ({...prev, [qIdx]: { ...prev[qIdx], files: Array.from(files) }}));

  const handleSubmit = async () => {
    if (!geo) return alert('يرجى تحديد الموقع أولاً');
    
    // التحقق من تعبئة الحقول الأساسية
    if (!formData.contractor || !formData.work_order_no) {
        return alert('يرجى تعبئة الحقول الأساسية (المقاول، رقم العمل)');
    }

    setLoading(true);
    
    try {
        // هنا يتم استخراج صورة التوقيع
        // const signatureImage = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        
        // كود الإرسال إلى Supabase (مثال)
        // const { data, error } = await supabase.from('inspections').insert([{ ...formData, geo, answers, inspector: user.username }])
        
        console.log("Data to send:", { formData, geo, answers });
        
        setTimeout(() => { 
            setLoading(false); 
            alert('تم إرسال التقرير بنجاح ✅'); 
        }, 1500);
    } catch (error) {
        alert('حدث خطأ أثناء الإرسال');
        setLoading(false);
    }
  }

  if (!user) return null;

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
    }

    .app-header {
      background-color: var(--primary);
      padding: 15px 20px;
      border-bottom-left-radius: 30px;
      border-bottom-right-radius: 30px;
      display: flex; justify-content: space-between; align-items: center;
      color: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .logo-box { background: white; padding: 5px 10px; border-radius: 12px; color: var(--primary); font-weight: bold; font-size: 11px; }
    .user-pill { background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 50px; font-size: 13px; }

    .main-title-container { text-align: center; margin: 25px 0; }
    .main-title { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
    .sub-date { color: #64748b; font-size: 13px; margin-top: 5px; font-weight: 600; }

    .content-card {
      background: var(--card-bg);
      border-radius: 20px;
      padding: 20px;
      margin: 15px 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
    }
    .card-title { font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }

    .btn-location {
      width: 100%; background: #ecfdf5; border: 2px solid #10b981; color: #065f46;
      padding: 20px; border-radius: 16px; cursor: pointer; text-align: center; box-sizing: border-box;
    }
    .btn-location.pending { background: #f8fafc; border: 2px dashed #cbd5e1; color: #64748b; }
    .loc-icon { font-size: 30px; margin-bottom: 8px; }

    .input-group { position: relative; margin-bottom: 15px; }
    .input-icon { position: absolute; top: 15px; right: 15px; color: #94a3b8; }
    .modern-input {
      width: 100%; padding: 12px 40px 12px 15px;
      background: #f1f5f9; border: 1px solid transparent; border-radius: 12px;
      font-family: 'Cairo'; font-size: 14px; box-sizing: border-box; outline: none;
    }
    .modern-input:focus { background: #fff; border-color: var(--primary); }

    .q-item { border-bottom: 1px solid #f1f5f9; padding: 15px 0; }
    .q-text { font-weight: 700; font-size: 14px; color: #334155; margin-bottom: 10px; }
    .q-options { display: flex; gap: 8px; }
    .q-opt { 
        flex: 1; padding: 10px; border-radius: 10px; text-align: center; 
        background: #f1f5f9; color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .q-opt.active { background: var(--primary); color: white; }
    .camera-btn { background: #f1f5f9; padding: 0 15px; border-radius: 10px; display: flex; align-items: center; color: #64748b; cursor: pointer; }
    
    .floating-submit { position: fixed; bottom: 20px; left: 20px; right: 20px; z-index: 100; }
    .submit-btn {
      width: 100%; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white; border: none; padding: 16px; border-radius: 50px;
      font-family: 'Cairo'; font-weight: 800; font-size: 16px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
    }
    .sig-wrapper { background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; overflow:hidden; margin-top:10px; }
  `;

  return (
    <div style={{paddingBottom: '120px'}}>
      <style>{styles}</style>
      
      {/* Header */}
      <div className="app-header">
        <div className="logo-box">مجموعة السلامة ادارة ضواحي الرياض</div>
        <div className="user-pill">
           <i className="fa-solid fa-user-circle" style={{marginLeft: '5px'}}></i>
           <span>{user.username || 'المفتش'}</span>
        </div>
      </div>

      <div className="main-title-container">
        <h1 className="main-title">نظام السلامة الميداني</h1>
        <div className="sub-date">
            <i className="fa-regular fa-calendar-check" style={{marginLeft: '5px'}}></i>
            {hijriDate}
        </div>
      </div>

      {/* Location */}
      <div className="content-card">
        <div className="card-title">
            <i className="fa-solid fa-location-dot" style={{color: '#0ea5e9'}}></i>
            إثبات التواجد (GPS)
        </div>
        <div className={`btn-location ${geo ? '' : 'pending'}`} onClick={getGeo}>
            <i className={`fa-solid ${geo ? 'fa-map-location-dot' : 'fa-location-crosshairs'} loc-icon`}></i>
            <div style={{fontWeight:800}}>{geo ? 'تم تحديد الموقع بنجاح' : 'اضغط لتحديد الموقع'}</div>
            {geo && <div style={{fontSize:'11px', color:'#059669', marginTop:'5px'}}>إحداثيات دقيقة ومؤكدة ✅</div>}
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="content-card">
        <div className="card-title">
            <i className="fa-solid fa-file-contract" style={{color: '#0ea5e9'}}></i>
            بيانات التقرير الأساسية
        </div>

        <div className="form-container">
            <div className="input-group">
                <i className="fa-solid fa-calendar-days input-icon"></i>
                <input type="date" className="modern-input" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-user-tie input-icon"></i>
                <input className="modern-input" placeholder="اسم الاستشاري" value={formData.consultant} onChange={e=>setFormData({...formData, consultant: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-helmet-safety input-icon"></i>
                <input className="modern-input" placeholder="اسم المقاول" value={formData.contractor} onChange={e=>setFormData({...formData, contractor: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-map-pin input-icon"></i>
                <input className="modern-input" placeholder="موقع العمل" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-city input-icon"></i>
                <input className="modern-input" placeholder="اسم الحي" value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-users input-icon"></i>
                <input className="modern-input" placeholder="اسم فريق الزيارة" value={formData.visit_team} onChange={e=>setFormData({...formData, visit_team: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-user-check input-icon"></i>
                <input className="modern-input" placeholder="اسم المشرف" value={formData.supervisor} onChange={e=>setFormData({...formData, supervisor: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-list-check input-icon"></i>
                <input className="modern-input" placeholder="رقم الأمر / المهمة" value={formData.work_order_no} onChange={e=>setFormData({...formData, work_order_no: e.target.value})} />
            </div>

            <div className="input-group">
                <i className="fa-solid fa-pen-to-square input-icon" style={{top:'20px'}}></i>
                <textarea className="modern-input" placeholder="وصف العمل" value={formData.work_description} onChange={e=>setFormData({...formData, work_description: e.target.value})} rows="3" style={{paddingRight:'40px'}}></textarea>
            </div>

            <div className="input-group">
                <i className="fa-solid fa-signature input-icon"></i>
                <input className="modern-input" placeholder="اسم المستلم" value={formData.receiver} onChange={e=>setFormData({...formData, receiver: e.target.value})} />
            </div>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="content-card">
        <div className="card-title">
             <i className="fa-solid fa-clipboard-check" style={{color: '#0ea5e9'}}></i>
             بنود التفتيش والسلامة
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
                        <i className={`fa-solid ${answers[i+1]?.files ? 'fa-check-circle' : 'fa-camera'}`} style={{color: answers[i+1]?.files ? '#10b981' : 'inherit'}}></i>
                        <input type="file" id={`f-${i}`} hidden onChange={(e)=>handleFileChange(i+1, e.target.files)} capture="environment" />
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Signature Section */}
      <div className="content-card">
        <div className="card-title">
            <i className="fa-solid fa-pen-nib" style={{color: '#0ea5e9'}}></i>
            توقيع المستلم المسؤول
        </div>
        <div className="sig-wrapper">
            <SignatureCanvas ref={sigPad} canvasProps={{width: 320, height: 180, className: 'sig-canvas'}} />
        </div>
        <div style={{textAlign: 'left'}}>
            <button onClick={()=>sigPad.current.clear()} style={{marginTop:'12px', color:'#ef4444', background:'none', border:'none', fontWeight:'bold', cursor:'pointer'}}>
                <i className="fa-solid fa-trash-can"></i> مسح التوقيع
            </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="floating-submit">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? (
                <> <i className="fa-solid fa-spinner fa-spin"></i> جاري الإرسال... </>
            ) : (
                <> إعتماد وإرسال التقرير <i className="fa-regular fa-paper-plane" style={{marginRight: '8px'}}></i> </>
            )}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp;
