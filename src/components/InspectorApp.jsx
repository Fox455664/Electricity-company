import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

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
  }, [])

  const getGeo = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
      () => alert('فشل تحديد الموقع')
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
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.4));
        };
      };
    });
  };

  const handleFileChange = (qIdx, files) => {
    setAnswers(prev => ({
      ...prev,
      [qIdx]: { ...prev[qIdx], files: [...(prev[qIdx]?.files || []), ...Array.from(files)] }
    }))
  }

  const handleAnswerChange = (qIdx, field, value) => {
    setAnswers(prev => ({
      ...prev,
      [qIdx]: { ...prev[qIdx], [field]: value }
    }))
  }

  const handleSubmit = async () => {
    if (!geo) return alert('يرجى تحديد الموقع');
    if (!formData.contractor) return alert('يرجى كتابة اسم المقاول');

    setLoading(true);
    setBtnText('جاري المعالجة...');

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
        if (currentAns.files) {
          for (let file of currentAns.files) {
            const compressed = await compressImage(file);
            compressedPhotos.push(compressed);
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

  return (
    <div className="app-container" style={{ direction: 'rtl', fontFamily: 'Cairo', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px', backgroundColor: '#f8fafc' }}>
      <style>{`
        .premium-header { background: linear-gradient(135deg, #005a8f 0%, #004269 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; border-radius: 0 0 20px 20px; }
        .premium-card { background: white; border-radius: 16px; padding: 20px; margin: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .section-title { font-size: 18px; font-weight: 700; color: #005a8f; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
        .input-wrapper { margin-bottom: 15px; }
        .input-label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 5px; }
        .premium-input { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; font-family: 'Cairo'; background: #f8fafc; }
        .question-card { background: white; border-radius: 12px; padding: 15px; margin: 15px; border-right: 4px solid #005a8f; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .options-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 5px; margin-top: 10px; }
        .option-btn { flex: 1; padding: 10px; text-align: center; border-radius: 8px; font-size: 13px; cursor: pointer; color: #64748b; font-weight: bold; }
        .option-btn.active.yes { background: #10b981; color: white; }
        .option-btn.active.no { background: #ef4444; color: white; }
        .option-btn.active.na { background: #64748b; color: white; }
        .floating-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px; box-shadow: 0 -5px 15px rgba(0,0,0,0.05); display: flex; justify-content: center; }
        .submit-btn { background: #f28b00; color: white; border: none; padding: 15px 40px; border-radius: 50px; font-weight: bold; font-family: 'Cairo'; width: 90%; cursor: pointer; }
      `}</style>

      <div className="premium-header" ref={topRef}>
        <div style={{ fontWeight: 'bold' }}>مجموعة السلامة إدارة ضواحي الرياض</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{user.username}</span>
          <button onClick={() => { sessionStorage.clear(); navigate('/'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>خروج</button>
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        <h2 style={{ color: '#1e293b' }}>نظام التفتيش الميداني</h2>
        
        {/* GPS */}
        <div className="premium-card" onClick={getGeo} style={{ textAlign: 'center', cursor: 'pointer' }}>
          <div className="section-title">الموقع الجغرافي</div>
          <div style={{ color: geo ? '#10b981' : '#64748b' }}>
            {geo ? '✅ تم تحديد الموقع' : '📍 اضغط لتحديد الموقع الجغرافي'}
          </div>
        </div>

        {/* Form Data */}
        <div className="premium-card">
          <div className="section-title">بيانات التقرير</div>
          <div className="input-wrapper">
            <label className="input-label">اسم المقاول</label>
            <input className="premium-input" value={formData.contractor} onChange={e => setFormData({...formData, contractor: e.target.value})} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">رقم أمر العمل / المهمة</label>
            <input className="premium-input" value={formData.work_order_no} onChange={e => setFormData({...formData, work_order_no: e.target.value})} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">وصف العمل</label>
            <input className="premium-input" value={formData.work_desc} onChange={e => setFormData({...formData, work_desc: e.target.value})} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">فريق الزيارة</label>
            <input className="premium-input" value={formData.visit_team} onChange={e => setFormData({...formData, visit_team: e.target.value})} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">اسم الاستشاري</label>
            <input className="premium-input" value={formData.consultant} onChange={e => setFormData({...formData, consultant: e.target.value})} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">وصف مكان العمل</label>
            <input className="premium-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>
          <div className="input-wrapper">
            <label className="input-label">المستلم</label>
            <input className="premium-input" value={formData.receiver} onChange={e => setFormData({...formData, receiver: e.target.value})} />
          </div>
        </div>

        {/* Questions */}
        {qList.map((q, i) => {
          const qIdx = i + 1;
          const current = answers[qIdx]?.val || 'N/A';
          return (
            <div key={i} className="question-card">
              <div style={{ fontWeight: 'bold' }}>{qIdx}. {q}</div>
              <div className="options-container">
                {['نعم', 'لا', 'N/A'].map(opt => (
                  <div key={opt} className={`option-btn ${current === opt ? 'active ' + (opt==='نعم'?'yes':opt==='لا'?'no':'na') : ''}`} onClick={() => handleAnswerChange(qIdx, 'val', opt)}>
                    {opt === 'N/A' ? 'لا ينطبق' : opt}
                  </div>
                ))}
              </div>
              <input type="file" multiple accept="image/*" capture="environment" style={{ marginTop: '10px', fontSize: '12px' }} onChange={e => handleFileChange(qIdx, e.target.files)} />
              {answers[qIdx]?.files?.length > 0 && <div style={{ fontSize: '11px', color: '#10b981' }}>تم اختيار {answers[qIdx].files.length} صور</div>}
              <textarea className="premium-input" style={{ marginTop: '10px', height: '50px' }} placeholder="ملاحظات..." onChange={e => handleAnswerChange(qIdx, 'note', e.target.value)} />
            </div>
          )
        })}

        {/* Signature */}
        <div className="premium-card">
          <div className="section-title">توقيع المستلم</div>
          <div style={{ border: '1px solid #ddd', background: 'white' }}>
            <SignatureCanvas ref={sigPad} canvasProps={{ width: 500, height: 150, className: 'sig-canvas' }} />
          </div>
          <button onClick={() => sigPad.current.clear()} style={{ color: 'red', border: 'none', background: 'none', marginTop: '10px', cursor: 'pointer' }}>مسح</button>
        </div>
      </div>

      <div className="floating-footer">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>{btnText}</button>
      </div>
    </div>
  )
}
export default InspectorApp
