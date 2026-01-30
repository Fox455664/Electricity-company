import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
// import { supabase } from '../supabaseClient' // تأكد من تفعيل هذا السطر عند الربط الفعلي

// --- 1. قائمة الأسئلة المعدلة (بعد الحذف وإعادة التسمية) ---
const categories = {
  "التصاريح والمستندات": [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل",
    "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل",
    "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة – وصف العمل – رقم التصريح – توقيع مشرف الكهرب والشركة)",
    "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة",
    "إلمام المستلم وفريق العمل بإجراءات العمل الآمن وتقييم المخاطر للمهمة",
    "بطاقة تعميد المصدر والمستلم والعامل المشارك سارية وبصلاحيات مناسبة للعمل",
    "تأهيل سائق المعدات (سائق ونش – سلة هوائية -........)",
    "المستلم متواجد بموقع العمل"
  ],
  "إجراءات العزل والسلامة الكهربائية": [
    "وضع أقفال السلامة و البطاقات التحذيرية و إكتمال بيانات التواصل",
    "التأكد من تركيب الأرضي المتنقل من الجهتين",
    "التأكد من فعالية جهاز كشف الجهد التستر",
    "التأكد من تركيب الأرضي للسيارات"
  ],
  "المركبات والمعدات": [
    // تم حذف 13 و 14
    "نموذج فحص المركبة",
    // تم حذف 16
    "شهادة المسعف",
    "شهادة المكافح",
    "TUV السائق", // تعديل المسمى (سابقاً 19)
    // تم حذف 20 (QR Code)
    "TUV المعدات", // تعديل المسمى (سابقاً 21)
    "التأكد من مطابقة السلات للمواصفات ( كفرات – زيوت – كسور – حزام الأمان – تكدس مواد .. الخ)",
    "التأكد من سلامة خطاف الونش واحبال الرفع",
    "الحمل الأقصى محدد بوضوح على جميع معدات الرفع",
    "وجود شعار المقاول على المركبات والمعدات"
  ],
  "مهمات الوقاية والطوارئ": [
    "طفاية حريق سليمة ومفحوصة وسلامة استكر الفحص",
    "شنطة إسعافات مكتملة ومفحوصة",
    "مهام الوقاية الشخصية سليمة (بسؤال الموظف والتفتيش علية) خوذة - ملابس – حذاء",
    "التفتيش على القفاز المطاطي (33000 – 13000 – 1000) ك.ف.أ",
    "الخوذة الكهربائية مزودة بحامى وجة",
    "أحزمة السلامة مرقمة وسليمة"
  ],
  "بيئة العمل والخطط": [
    "ملاحظات",
    "استخدام حواجز حماية سليمة وكافية و شريط تحذيري",
    "كفاية اللوحات الإرشادية المرورية",
    "الترميز بالألوان حسب الشهر للعدد والأدوات وأدوات السلامة",
    "تخزين أسطوانات الغاز وأسطوانات الاكسجين واللحام وترميزها",
    "وجود أغطية الحماية لأسطوانات الغاز والأكسجين",
    "ليات الاوكسي استيلين لا يوجد بها تشققات او تالفة",
    "سلامة المنظم والعدادات",
    "تم ازالة المخلفات بعد الانتهاء من العمل",
    // تم حذف 38 (خطط متعلقة)
    "خطة الطوارئ",
    // تم حذف 41 (خطة المنع من السقوط)
    "خطة الإنقاذ في العمل على المرتفعات",
    "خطة رفع الأحمال الحرجة",
    "إجراء وملصقات حماية السمع",
    "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة" // (سابقاً 46 أو الأخير)
  ]
};

const flatQList = Object.values(categories).flat();

// --- مكون السؤال (يدعم صور متعددة) ---
const QuestionRow = React.memo(({ qText, index, answer, onAnswerChange }) => {
  const currentVal = answer?.val || 'N/A';
  const filesCount = answer?.files?.length || 0;
  
  return (
    <div className={`question-card ${answer?.val && answer.val !== 'N/A' ? 'answered' : ''}`}>
      <div className="q-text">{index + 1}. {qText}</div>
      
      {/* أزرار نعم / لا */}
      <div className="options-container">
        <div className={`option-btn yes ${currentVal === 'نعم' ? 'active' : ''}`} onClick={() => onAnswerChange('val', 'نعم')}>
          <i className="fa-solid fa-check"></i> نعم
        </div>
        <div className={`option-btn no ${currentVal === 'لا' ? 'active' : ''}`} onClick={() => onAnswerChange('val', 'لا')}>
          <i className="fa-solid fa-xmark"></i> لا
        </div>
        <div className={`option-btn na ${currentVal === 'N/A' ? 'active' : ''}`} onClick={() => onAnswerChange('val', 'N/A')}>
          لا ينطبق
        </div>
      </div>

      {/* المرفقات والملاحظات */}
      <div style={{marginTop: '10px'}}>
        <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
          {/* زر رفع الصور (يقبل المتعدد + الكاميرا) */}
          <button className="photo-btn" onClick={() => document.getElementById(`file-${index}`).click()}>
            <i className={`fa-solid ${filesCount > 0 ? 'fa-images' : 'fa-camera'}`}></i>
            {filesCount > 0 ? ` تم إرفاق ${filesCount}` : ' إضافة صور'}
          </button>
          
          <input 
            type="file" 
            id={`file-${index}`} 
            style={{display:'none'}} 
            accept="image/*"
            multiple // للسماح بأكثر من صورة
            onChange={(e) => onAnswerChange('files', e.target.files)}
          />

          <textarea
            className="note-input"
            placeholder="ملاحظات..."
            value={answer?.note || ''}
            onChange={(e) => onAnswerChange('note', e.target.value)}
          />
        </div>
        
        {/* عرض مصغرات للصور المرفقة (اختياري لتحسين العرض) */}
        {filesCount > 0 && (
          <div style={{fontSize: '11px', color: '#10b981'}}>
            تم اختيار {filesCount} صورة سيتم ضغطها وإرسالها مع التقرير.
          </div>
        )}
      </div>
    </div>
  );
});

const InspectorApp = () => {
  const navigate = useNavigate()
  const sigPad = useRef(null)
  const topRef = useRef(null)

  // الحالة
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إعتماد وإرسال التقرير')
  const [activeTab, setActiveTab] = useState(Object.keys(categories)[0])
  
  // بيانات النموذج الجديدة
  const [formData, setFormData] = useState({
    contractor: '', 
    work_order: '', // رقم أمر العمل
    visit_team: '', // فريق الزيارة
    work_desc: '',  // وصف العمل
    location: '', 
    consultant: '', 
    receiver: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [geo, setGeo] = useState(null)
  const [answers, setAnswers] = useState({})

  // نسبة الإنجاز
  const progress = useMemo(() => {
    const answeredCount = Object.values(answers).filter(a => a.val && a.val !== 'N/A').length;
    return Math.round((answeredCount / flatQList.length) * 100);
  }, [answers]);

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    else setUser({ username: "مفتش السلامة" })
  }, [])

  // --- دالة ضغط الصور (مهمة جداً لحل مشكلة توقف التقرير) ---
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas')
          // تصغير الحجم إلى 600 بيكسل كحد أقصى لتقليل حجم البيانات
          const MAX_WIDTH = 600 
          const scaleFactor = MAX_WIDTH / img.width
          canvas.width = MAX_WIDTH
          canvas.height = img.height * scaleFactor
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          // تقليل الجودة إلى 0.5
          resolve(canvas.toDataURL('image/jpeg', 0.5))
        }
      }
    })
  }

  const getGeo = () => {
    if (!navigator.geolocation) return alert('غير مدعوم')
    setBtnText('جاري تحديد الموقع...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`)
        setBtnText('إعتماد وإرسال التقرير')
      },
      () => {
        alert('تأكد من تفعيل GPS')
        setBtnText('إعتماد وإرسال التقرير')
      }
    )
  }

  const handleAnswer = (qIndex, field, value) => {
    // إذا كانت ملفات، نضيفها للمصفوفة الحالية (أو نستبدلها حسب رغبتك)
    if (field === 'files') {
      // هنا نقوم بتحويل FileList إلى Array عادي
      const newFiles = Array.from(value);
      setAnswers(prev => ({
        ...prev,
        [qIndex]: { ...prev[qIndex], files: newFiles } // تخزين المصفوفة
      }))
    } else {
      setAnswers(prev => ({
        ...prev,
        [qIndex]: { ...prev[qIndex], [field]: value }
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.contractor) return alert('⚠️ اسم المقاول مطلوب');
    if (!formData.work_order) return alert('⚠️ رقم أمر العمل مطلوب');
    
    setLoading(true); 
    setBtnText('جاري معالجة الصور وضغطها...');

    try {
      const payload = {
        serial: Date.now(),
        inspector: user?.username,
        created_at: new Date().toLocaleString('ar-SA'),
        ...formData,
        location_url: geo || 'لم يحدد',
        signature: sigPad.current.isEmpty() ? null : sigPad.current.toDataURL(),
        violations: []
      }

      // معالجة المخالفات والصور
      for (let i = 0; i < flatQList.length; i++) {
        const qIdx = i;
        const ans = answers[qIdx] || {};
        
        // الشرط: إذا كان الجواب "لا" أو يوجد ملاحظة أو يوجد صور
        if (ans.val === 'لا' || ans.note || (ans.files && ans.files.length > 0)) {
           const processedImages = [];
           
           // ضغط جميع الصور المرفقة لهذا البند
           if (ans.files && ans.files.length > 0) {
             for (let file of ans.files) {
               try {
                 const compressed = await compressImage(file);
                 processedImages.push(compressed);
               } catch (e) { console.error('Image Error', e) }
             }
           }
           
           payload.violations.push({
             question: flatQList[i],
             answer: ans.val || 'N/A',
             note: ans.note || '',
             images: processedImages // إرسال مصفوفة الصور المضغوطة
           });
        }
      }

      console.log("البيانات الجاهزة للإرسال:", payload);
      
      // محاكاة الإرسال (استبدل هذا بالجزء الخاص بـ Supabase)
      // const { error } = await supabase.from('reports').insert([payload])
      // if (error) throw error
      
      await new Promise(r => setTimeout(r, 2000)); // محاكاة وقت الانتظار

      alert('✅ تم إرسال التقرير بنجاح!');
      window.location.reload();

    } catch (e) {
      alert('خطأ: ' + e.message);
    } finally {
      setLoading(false); 
      setBtnText('إعتماد وإرسال التقرير');
    }
  }

  // --- تنسيقات CSS ---
  const styles = `
    :root { --primary: #005a8f; --accent: #f28b00; --bg: #f8fafc; }
    body { background: var(--bg); font-family: 'Cairo', sans-serif; color: #334155; padding-bottom: 90px; margin: 0; }
    
    /* Header الجديد */
    .header { 
      background: linear-gradient(135deg, #005a8f 0%, #003855 100%); 
      color: white; 
      padding: 25px 20px; 
      border-radius: 0 0 30px 30px; 
      box-shadow: 0 10px 25px rgba(0,90,143,0.2);
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .header h2 { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.5; }
    .header-subtitle { font-size: 13px; opacity: 0.9; margin-top: 5px; color: #e0f2fe; }

    .card { background: white; border-radius: 16px; padding: 20px; margin: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
    .title { font-weight: 800; color: var(--primary); margin-bottom: 15px; font-size: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; display: flex; align-items: center; gap: 8px; }

    /* Inputs Grid */
    .grid-inputs { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .main-input { 
      width: 100%; padding: 12px 15px; border: 1px solid #e2e8f0; border-radius: 10px; 
      font-family: 'Cairo'; font-size: 14px; background: #f8fafc; transition: all 0.2s;
      box-sizing: border-box; /* مهم جداً لضبط الحواف */
    }
    .main-input:focus { border-color: var(--primary); background: white; outline: none; box-shadow: 0 0 0 3px rgba(0,90,143,0.1); }

    /* Tabs */
    .tabs-container { overflow-x: auto; white-space: nowrap; padding: 5px 15px; margin-bottom: 10px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .tab-pill { 
      display: inline-block; padding: 10px 18px; margin-left: 8px; 
      background: white; border: 1px solid #e2e8f0; border-radius: 25px; 
      color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; 
    }
    .tab-pill.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,90,143,0.2); }

    /* Question Card */
    .question-card { background: white; border-radius: 12px; padding: 16px; margin: 12px 15px; border: 1px solid #f1f5f9; border-right: 4px solid #cbd5e1; }
    .question-card.answered { border-right-color: #10b981; background: #fafffd; }
    .q-text { font-weight: 700; font-size: 14px; margin-bottom: 12px; line-height: 1.6; color: #1e293b; }
    
    .options-container { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 4px; }
    .option-btn { flex: 1; text-align: center; padding: 10px; font-size: 13px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 600; transition: all 0.2s; }
    .option-btn.yes.active { background: #10b981; color: white; }
    .option-btn.no.active { background: #ef4444; color: white; }
    .option-btn.na.active { background: #64748b; color: white; }

    .photo-btn { 
      padding: 10px; background: #fff; border: 1px dashed #cbd5e1; color: var(--primary); 
      border-radius: 8px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; flex: 1;
    }
    .note-input { 
      flex: 2; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; 
      font-family: 'Cairo'; font-size: 12px; resize: none; height: 42px; box-sizing: border-box; 
    }

    /* Footer */
    .footer-action { position: fixed; bottom: 20px; left: 20px; right: 20px; z-index: 900; }
    .submit-btn { 
      width: 100%; padding: 16px; background: linear-gradient(135deg, var(--accent) 0%, #d97706 100%); 
      color: white; border: none; border-radius: 50px; font-weight: 700; font-size: 16px; 
      box-shadow: 0 4px 20px rgba(242, 139, 0, 0.3); cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px;
    }
    .progress-bar { position: fixed; top: 0; left: 0; height: 4px; background: #10b981; z-index: 1100; transition: width 0.3s; }
  `;

  return (
    <div className="app-container">
      <style>{styles}</style>
      <div className="progress-bar" style={{width: `${progress}%`}}></div>

      {/* 1. الهيدر المعدل */}
      <div className="header" ref={topRef}>
        <h2 style={{fontSize: '17px', marginBottom: '4px'}}>مجموعة السلامة إدارة ضواحي الرياض</h2>
        <div className="header-subtitle">نظام الفحص الميداني</div>
      </div>

      {/* 2. بيانات التقرير (المعدلة) */}
      <div className="card">
        <div className="title"><i className="fa-solid fa-file-contract"></i> بيانات التقرير</div>
        <div className="grid-inputs">
          <input className="main-input" placeholder="اسم المقاول" value={formData.contractor} onChange={e => setFormData({...formData, contractor: e.target.value})} />
          
          <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
             <input className="main-input" placeholder="رقم أمر العمل / المهمة" value={formData.work_order} onChange={e => setFormData({...formData, work_order: e.target.value})} />
             <input className="main-input" placeholder="اسم فريق الزيارة" value={formData.visit_team} onChange={e => setFormData({...formData, visit_team: e.target.value})} />
          </div>

          <input className="main-input" placeholder="وصف العمل (مثال: صيانة كابلات...)" value={formData.work_desc} onChange={e => setFormData({...formData, work_desc: e.target.value})} />
          
          <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
             <input className="main-input" placeholder="المستلم" value={formData.receiver} onChange={e => setFormData({...formData, receiver: e.target.value})} />
             <input className="main-input" placeholder="الموقع" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
          </div>

          <button onClick={getGeo} style={{padding:'12px', background: geo ? '#ecfdf5' : '#f1f5f9', border:'1px dashed #10b981', borderRadius:'10px', color: geo ? '#047857' : '#64748b', fontWeight:'bold', cursor:'pointer'}}>
             <i className="fa-solid fa-location-dot"></i> {geo ? 'تم تسجيل الموقع بنجاح' : 'اضغط لتحديد الموقع الجغرافي'}
          </button>
        </div>
      </div>

      {/* التبويبات */}
      <div className="tabs-container">
        {Object.keys(categories).map(cat => (
          <div key={cat} className={`tab-pill ${activeTab === cat ? 'active' : ''}`} onClick={() => setActiveTab(cat)}>
            {cat}
          </div>
        ))}
      </div>

      {/* قائمة الأسئلة */}
      <div style={{paddingBottom: '20px'}}>
        {categories[activeTab].map((q, i) => {
          const flatIndex = flatQList.indexOf(q);
          return (
            <QuestionRow 
              key={flatIndex} 
              index={flatIndex} 
              qText={q} 
              answer={answers[flatIndex]} 
              onAnswerChange={(field, val) => handleAnswer(flatIndex, field, val)} 
            />
          )
        })}
      </div>

      {/* التوقيع المعدل */}
      <div className="card">
        <div className="title"><i className="fa-solid fa-signature"></i> توقيع مسؤول شركة الكهرباء</div>
        <div style={{border:'2px solid #e2e8f0', borderRadius:'12px', overflow:'hidden', touchAction:'none'}}>
          <SignatureCanvas ref={sigPad} canvasProps={{width: 600, height: 180, className: 'sigCanvas'}} />
        </div>
        <button onClick={() => sigPad.current.clear()} style={{marginTop:'12px', color:'#ef4444', background:'white', border:'1px solid #ef4444', padding:'8px 15px', borderRadius:'20px', fontSize:'12px'}}>
           <i className="fa-solid fa-eraser"></i> إعادة التوقيع
        </button>
      </div>

      {/* زر الإرسال */}
      <div className="footer-action">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-paper-plane"></i>}
          {btnText}
        </button>
      </div>
    </div>
  )
}

export default InspectorApp
