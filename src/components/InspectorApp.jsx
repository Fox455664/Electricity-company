import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة المحدثة بالكامل بناءً على طلبك
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

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إعتماد وإرسال التقرير')
  const [geo, setGeo] = useState(null)
  const [answers, setAnswers] = useState({})
  
  const [formData, setFormData] = useState({
    contractor: '',
    work_order_no: '',
    work_desc: '',
    visit_team: '',
    consultant: '',
    location: '',
    receiver: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) navigate('/')
    else setUser(JSON.parse(userData))
  }, [navigate])

  const getGeo = () => {
    if (!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع');
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
      () => alert('يرجى تفعيل GPS لتحديد الموقع')
    )
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const elem = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          elem.width = MAX_WIDTH;
          elem.height = img.height * scale;
          const ctx = elem.getContext('2d');
          ctx.drawImage(img, 0, 0, elem.width, elem.height);
          resolve(elem.toDataURL('image/jpeg', 0.4));
        };
      };
    });
  };

  const handleFileChange = (qIdx, files) => {
    const fileArray = Array.from(files);
    setAnswers(prev => ({
      ...prev,
      [qIdx]: { ...prev[qIdx], files: [...(prev[qIdx]?.files || []), ...fileArray] }
    }));
  };

  const handleAnswerChange = (qIdx, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [qIdx]: { ...prev[qIdx], [field]: value }
    }))
  }

  const handleSubmit = async () => {
    if (!geo) { alert('⚠️ يرجى تحديد الموقع أولاً'); topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!formData.contractor) { alert('⚠️ يرجى كتابة اسم المقاول'); return; }

    setLoading(true);
    setBtnText('جاري الإرسال...');

    try {
      const payload = {
        serial: Date.now(),
        inspector: user.username,
        timestamp: new Date().toLocaleString('ar-SA'),
        ...formData,
        google_maps_link: geo,
        signature_image: sigPad.current.isEmpty() ? null : sigPad.current.toDataURL('image/png', 0.5),
        answers: {},
        violations: []
      }

      for (let i = 0; i < qList.length; i++) {
        const qIdx = i + 1;
        const currentAns = answers[qIdx] || {};
        const val = currentAns.val || 'N/A';
        const note = currentAns.note || '';
        
        payload.answers[qIdx] = val === 'N/A' ? 'لا ينطبق' : val;

        let compressedPhotos = [];
        if (currentAns.files && currentAns.files.length > 0) {
          for (let file of currentAns.files) {
            const img = await compressImage(file);
            compressedPhotos.push(img);
          }
        }

        if (val === 'لا' || note || compressedPhotos.length > 0) {
          payload.violations.push({
            q: qList[i],
            ans: val === 'N/A' ? 'لا ينطبق' : val,
            note,
            photos: compressedPhotos
          });
        }
      }

      const { error } = await supabase.from('reports').insert([payload]);
      if (error) throw error;
      alert('✅ تم إرسال التقرير بنجاح!');
      window.location.reload();
    } catch (err) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
      setBtnText('إعتماد وإرسال التقرير');
    }
  }

  if (!user) return null;

  const styles = `
    :root { --primary: #005a8f; --accent: #f28b00; --bg: #f8fafc; --text: #1e293b; }
    body { background-color: var(--bg); font-family: 'Cairo', sans-serif; direction: rtl; margin:0; }
    .app-container { max-width: 800px; margin: 0 auto; padding-bottom: 120px; }
    .premium-header {
      background: linear-gradient(135deg, #005a8f 0%, #004269 100%);
      color: white; padding: 15px 20px; border-radius: 0 0 25px 25px;
      display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 1000; box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
    .header-logo { height: 40px; background: white; padding: 4px; border-radius: 6px; }
    .user-badge { background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 50px; display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .premium-card { background: white; border-radius: 18px; padding: 22px; margin: 20px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #eef2f6; }
    .section-title { font-size: 17px; font-weight: 700; color: var(--primary); margin-bottom: 18px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
    .verify-item { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 15px; padding: 25px; text-align: center; cursor: pointer; transition: 0.3s; }
    .verify-item.done { border-color: #10b981; background: #ecfdf5; }
    .input-wrapper { margin-bottom: 18px; position: relative; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
    .premium-input { width: 100%; padding: 12px 15px; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Cairo'; background: #f8fafc; box-sizing: border-box; }
    .question-card { background: white; border-radius: 15px; padding: 20px; margin: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border-right: 5px solid var(--primary); }
    .options-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 5px; margin-top: 15px; }
    .option-btn { flex: 1; padding: 12px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; color: #64748b; }
    .option-btn.active.yes { background: #10b981; color: white; }
    .option-btn.active.no { background: #ef4444; color: white; }
    .option-btn.active.na { background: #64748b; color: white; }
    .floating-footer { position: fixed; bottom: 20px; left: 20px; right: 20px; z-index: 1000; }
    .submit-main-btn {
      background: linear-gradient(135deg, #f28b00 0%, #e67e00 100%);
      color: white; border: none; padding: 16px; border-radius: 50px;
      width: 100%; font-weight: 700; font-family: 'Cairo'; cursor: pointer;
      box-shadow: 0 10px 25px rgba(242, 139, 0, 0.3);
    }
    .logout-btn { background: #ef4444; border: none; color: white; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; margin-right: 10px; }
  `;

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {/* Header (Same as Screenshot 1) */}
      <div className="premium-header" ref={topRef}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <img src="/imge.jpg" alt="SEC" className="header-logo" />
            <div className="user-badge">
                <i className="fa-solid fa-user-circle"></i>
                <span>{user.username}</span>
            </div>
        </div>
        <div>
           <button className="logout-btn" onClick={() => {sessionStorage.clear(); navigate('/');}}>خروج</button>
           <span style={{fontSize:'12px', fontWeight:'bold'}}>مجموعة السلامة إدارة ضواحي الرياض</span>
        </div>
      </div>

      <div style={{padding: '20px 15px'}}>
        <h2 style={{margin: '0 0 5px 0', color: '#0f172a'}}>نظام التفتيش الميداني</h2>
        <p style={{margin: '0 0 20px 0', color: '#64748b', fontSize: '13px'}}>
          <i className="fa-regular fa-calendar-check"></i> {new Date().toLocaleDateString('ar-SA')}
        </p>

        {/* Verification - GPS Only */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-location-dot"></i> إثبات التواجد</div>
          <div className={`verify-item ${geo ? 'done' : ''}`} onClick={getGeo}>
            <i className={`fa-solid ${geo ? 'fa-map-check' : 'fa-location-crosshairs'}`} style={{fontSize:'35px', color: geo ? '#10b981' : '#94a3b8', marginBottom:'10px'}}></i>
            <div style={{fontWeight:'800'}}>{geo ? 'تم تحديد الموقع بنجاح' : 'اضغط لتحديد موقع العمل الفعلي'}</div>
            {geo && <div style={{fontSize:'11px', color:'#10b981', marginTop:'5px'}}>إحداثيات دقيقة ✅</div>}
          </div>
        </div>

        {/* Basic Info Form */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-file-invoice"></i> بيانات التقرير</div>
          
          <div className="input-wrapper">
            <label className="input-label">اسم المقاول</label>
            <input className="premium-input" placeholder="اكتب اسم الشركة المنفذة..." value={formData.contractor} onChange={e => setFormData({...formData, contractor: e.target.value})} />
          </div>

          <div className="input-wrapper">
            <label className="input-label">رقم أمر العمل / المهمة</label>
            <input className="premium-input" placeholder="رقم المهمة..." value={formData.work_order_no} onChange={e => setFormData({...formData, work_order_no: e.target.value})} />
          </div>

          <div className="input-wrapper">
            <label className="input-label">وصف العمل</label>
            <input className="premium-input" placeholder="مثال: صيانة محولات، تمديد كابلات..." value={formData.work_desc} onChange={e => setFormData({...formData, work_desc: e.target.value})} />
          </div>

          <div className="input-wrapper">
            <label className="input-label">فريق الزيارة</label>
            <input className="premium-input" placeholder="أسماء المشاركين..." value={formData.visit_team} onChange={e => setFormData({...formData, visit_team: e.target.value})} />
          </div>

          <div className="input-wrapper">
            <label className="input-label">اسم الاستشاري</label>
            <input className="premium-input" placeholder="اسم الاستشاري (إن وجد)..." value={formData.consultant} onChange={e => setFormData({...formData, consultant: e.target.value})} />
          </div>

          <div className="input-wrapper">
            <label className="input-label">وصف مكان العمل</label>
            <input className="premium-input" placeholder="الحي / الشارع / المحطة..." value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>

          <div className="input-wrapper">
            <label className="input-label">المستلم</label>
            <input className="premium-input" placeholder="اسم مستلم العمل..." value={formData.receiver} onChange={e => setFormData({...formData, receiver: e.target.value})} />
          </div>
        </div>

        {/* Questions */}
        {qList.map((q, i) => {
          const qIdx = i + 1;
          const currentVal = answers[qIdx]?.val || 'N/A';
          const fileCount = answers[qIdx]?.files?.length || 0;

          return (
            <div key={i} className="question-card">
              <div style={{fontWeight:'700', lineHeight:'1.5'}}>{qIdx}. {q}</div>
              
              <div className="options-container">
                {['نعم', 'لا', 'N/A'].map(opt => (
                  <div key={opt} className={`option-btn ${opt==='نعم'?'yes':opt==='لا'?'no':'na'} ${currentVal === opt ? 'active' : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', opt)}>
                    {opt === 'N/A' ? 'لا ينطبق' : opt}
                  </div>
                ))}
              </div>

              <div style={{marginTop:'15px'}}>
                <input type="file" multiple accept="image/*" capture="environment" id={`file-${qIdx}`} style={{display:'none'}} onChange={e => handleFileChange(qIdx, e.target.files)} />
                <button onClick={() => document.getElementById(`file-${qIdx}`).click()} style={{width:'100%', padding:'10px', background:'#fff', border:'1px dashed #cbd5e1', borderRadius:'8px', cursor:'pointer', color:'#005a8f', fontSize:'13px'}}>
                   <i className="fa-solid fa-camera"></i> {fileCount > 0 ? `تم إرفاق (${fileCount}) صور` : 'إرفاق صور المخالفة/البند'}
                </button>
              </div>

              <textarea className="premium-input" style={{marginTop:'10px', height:'60px'}} placeholder="أضف ملاحظاتك هنا..." onChange={e => handleAnswerChange(qIdx, 'note', e.target.value)} />
            </div>
          )
        })}

        {/* Signature */}
        <div className="premium-card">
          <div className="section-title"><i className="fa-solid fa-file-signature"></i> توقيع المستلم</div>
          <div style={{border:'2px solid #e2e8f0', borderRadius:'12px', background:'white'}}>
            <SignatureCanvas ref={sigPad} canvasProps={{ width: 600, height: 200, className: 'sig-canvas' }} />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{marginTop:'10px', color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}><i className="fa-solid fa-eraser"></i> مسح التوقيع</button>
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
