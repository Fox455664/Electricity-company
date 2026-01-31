import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../supabaseClient'

// القائمة الكاملة والنهائية المكونة من 41 بنداً
const qList = [
    "1. تصريح العمل الأساسي والثانوي متواجد بموقع العمل", 
    "2. اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", 
    "3. نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة - وصف العمل - رقم التصريح - توقيع مسئول شركة الكهرباء)", 
    "4. إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", 
    "5. إلمام المستلم وفريق العمل بإجراءات العمل الآمن وتقييم المخاطر للمهمة", 
    "6. ملاحظات", 
    "7. بطاقة تعميد المصدر والمستلم والعامل المشارك سارية وبصلاحيات مناسبة للعمل", 
    "8. تأهيل سائق المعدات (سائق ونش – سلة هوائية -........)", 
    "9. المستلم متواجد بموقع العمل", 
    "10. وضع أقفال السلامة و البطاقات التحذيرية و إكتمال بيانات التواصل", 
    "11. التأكد من تركيب الأرضي المتنقل من الجهتين", 
    "12. التأكد من فعالية جهاز كشف الجهد التستر", 
    "13. نموذج فحص المركبة", 
    "14. شهادة المسعف", 
    "15. شهادة المكافح", 
    "16. شهادة TUV السائق", 
    "17. فحص TUV المعدات", 
    "18. التأكد من مطابقة السلات للمواصفات ( كفرات – زيوت – كسور – حزام الأمان – تكدس مواد .. الخ)", 
    "19. التأكد من سلامة خطاف الونش واحبال الرفع", 
    "20. طفاية حريق سليمة ومفحوصة وسلامة استكر الفحص", 
    "21. شنطة إسعافات مكتملة ومفحوصة", 
    "22. التأكد من تركيب الأرضي للسيارات", 
    "23. الحمل الأقصى محدد بوضوح على جميع معدات الرفع", 
    "24. مهام الوقاية الشخصية سليمة (بسؤال الموظف والتفتيش علية) خوذة - ملابس – حذاء", 
    "25. التفتيش على القفاز المطاطي (33000 – 13000 – 1000) ك.ف.أ", 
    "26. الخوذة الكهربائية مزودة بحامى وجة", 
    "27. أحزمة السلامة مرقمة وسليمة", 
    "28. استخدام حواجز حماية سليمة وكافية و شريط تحذيري", 
    "29. كفاية اللوحات الإرشادية المرورية", 
    "30. الترميز بالألوان حسب الشهر للعدد والأدوات وأدوات السلامة", 
    "31. تخزين أسطوانات الغاز وأسطوانات الاكسجين واللحام وترميزها", 
    "32. وجود أغطية الحماية لأسطوانات الغاز والأكسجين", 
    "33. ليات الاوكسي استيلين لا يوجد بها تشققات او تالفة", 
    "34. سلامة المنظم والعدادات", 
    "35. وجود شعار المقاول على المركبات والمعدات", 
    "36. خطط متعلقة بتصاريح العمل", 
    "37. خطة المنع من السقوط",
    "38. خطة الإنقاذ في العمل على المرتفعات", 
    "39. خطة رفع الأحمال الحرجة", 
    "40. ملصقات العمل على مرتفعات اوملصق أغراض متساقطة",
    "41. صور البطاقات"
];

const InspectorApp = () => {
  const navigate = useNavigate()
  const sigPad = useRef(null)
  const topRef = useRef(null)

  // States
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [btnText, setBtnText] = useState('إعتماد وإرسال التقرير')
  const [pledged, setPledged] = useState(false) // حالة التعهد (الصح)

  const [formData, setFormData] = useState({
    contractor: '', location: '', consultant: '', receiver: '',
    work_desc: '', visit_team: '', order_number: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [geo, setGeo] = useState(null)
  const [answers, setAnswers] = useState({})

  // Styles
  const styles = `
    :root { --primary: #005a8f; --accent: #f28b00; --bg: #f8fafc; --danger: #ef4444; }
    body { background: var(--bg); font-family: 'Cairo', sans-serif; direction: rtl; margin:0; }
    .app-container { max-width: 800px; margin: 0 auto; padding-bottom: 120px; }
    .header { background: linear-gradient(135deg, #005a8f, #004269); color: white; padding: 15px; display: flex; justify-content: space-between; position: sticky; top: 0; z-index: 1000; }
    .card { background: white; border-radius: 16px; padding: 20px; margin: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .section-title { font-weight: 700; color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
    .input-wrapper { margin-bottom: 12px; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 5px; }
    .premium-input { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-family: 'Cairo'; box-sizing: border-box; background: #f8fafc; font-size: 14px; }
    
    /* ستايل رسالة التعهد والتحذير */
    .pledge-box { border: 2px solid var(--danger) !important; background: #fff1f2 !important; }
    .pledge-text { color: #b91c1c; font-weight: 700; font-size: 14px; line-height: 1.6; text-align: justify; }
    .checkbox-container { display: flex; align-items: center; gap: 12px; margin-top: 15px; background: white; padding: 12px; border-radius: 10px; cursor: pointer; border: 1px solid #fecaca; }
    .pledge-check { width: 24px; height: 24px; cursor: pointer; accent-color: var(--danger); }

    .q-card { background: white; border-radius: 12px; padding: 15px; margin: 15px; border-right: 5px solid transparent; transition: 0.3s; }
    .q-card.answered { border-right-color: var(--primary); }
    .opt-grid { display: flex; gap: 8px; margin-top: 12px; }
    .opt-btn { flex: 1; padding: 10px; text-align: center; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; background: #f1f5f9; color: #64748b; }
    .opt-btn.active.yes { background: #10b981; color: white; }
    .opt-btn.active.no { background: #ef4444; color: white; }
    .opt-btn.active.na { background: #64748b; color: white; }
    
    .footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px; box-shadow: 0 -5px 20px rgba(0,0,0,0.1); z-index: 1000; text-align: center; }
    .submit-btn { width: 100%; background: var(--accent); color: white; border: none; padding: 16px; border-radius: 50px; font-weight: 700; font-size: 16px; cursor: pointer; font-family: 'Cairo'; }
    .submit-btn:disabled { background: #cbd5e1; cursor: not-allowed; opacity: 0.7; }
    
    .sig-canvas { width: 100% !important; height: 180px !important; background: #fafafa; border-radius: 10px; border: 1px solid #eee; }
    .img-preview { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; margin: 5px; }
  `;

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) navigate('/')
    else setUser(JSON.parse(userData))
  }, [])

  const getGeo = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setGeo(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`)
    }, () => alert('يرجى تفعيل GPS للمتابعة'))
  }

  const handleAnswerChange = (qIdx, field, val) => {
    setAnswers(prev => ({ ...prev, [qIdx]: { ...prev[qIdx], [field]: val } }))
  }

  const handleAddPhoto = (qIdx, files) => {
    const fileArr = Array.from(files)
    setAnswers(prev => ({ ...prev, [qIdx]: { ...prev[qIdx], files: [...(prev[qIdx]?.files || []), ...fileArr] } }))
  }

  const compressImage = (file) => {
    return new Promise((res) => {
      const reader = new FileReader(); reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image(); img.src = e.target.result
        img.onload = () => {
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')
          const scale = 500 / img.width; canvas.width = 500; canvas.height = img.height * scale
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          res(canvas.toDataURL('image/jpeg', 0.5))
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!geo) { alert('يجب تحديد الموقع أولاً'); topRef.current.scrollIntoView(); return; }
    if (!formData.contractor) { alert('يرجى إدخال اسم المقاول'); return; }
    
    setLoading(true); setBtnText('جاري المعالجة والإرسال...')
    try {
      const payload = {
        serial: Date.now(), inspector: user.username, timestamp: new Date().toLocaleString('ar-SA'),
        ...formData, google_maps_link: geo, signature_image: sigPad.current.isEmpty() ? null : sigPad.current.toDataURL(),
        answers: {}, violations: []
      }

      for (let i = 1; i <= qList.length; i++) {
        const ans = answers[i] || {}; const val = ans.val || 'N/A'
        payload.answers[i] = val === 'N/A' ? 'لا ينطبق' : val
        
        let compressedPics = []
        if (ans.files) {
          for (const f of ans.files) compressedPics.push(await compressImage(f))
        }

        if (val === 'لا' || ans.note || compressedPics.length > 0) {
          payload.violations.push({ q: qList[i-1], ans: val, note: ans.note, photos: compressedPics })
        }
      }

      const { error } = await supabase.from('reports').insert([payload])
      if (error) throw error
      alert('تم إرسال التقرير بنجاح ✅'); window.location.reload()
    } catch (err) {
      alert('حدث خطأ أثناء الإرسال: ' + err.message); setLoading(false); setBtnText('إعادة المحاولة')
    }
  }

  if (!user) return null

  return (
    <div className="app-container">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="header" ref={topRef}>
        <span><i className="fa-solid fa-user-shield"></i> {user.username}</span>
        <button onClick={() => {sessionStorage.clear(); navigate('/')}} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}><i className="fa-solid fa-power-off"></i></button>
      </div>

      <div style={{paddingTop: '10px'}}>
        <h2 style={{textAlign:'center', color:'#005a8f', marginBottom:'0'}}>الشركة السعودية للكهرباء</h2>
        <p style={{textAlign:'center', color:'#666', fontSize:'12px'}}>نظام تفتيش السلامة الميداني - ضواحي الرياض</p>
        
        {/* GPS Section */}
        <div className="card">
          <div className="section-title"><i className="fa-solid fa-location-dot"></i> موقع العمل GPS</div>
          <button onClick={getGeo} className="premium-input" style={{background: geo?'#ecfdf5':'#fff', border: geo?'2px solid #10b981':'1px solid #ddd', cursor:'pointer'}}>
            {geo ? '✅ تم تحديد الموقع الجغرافي' : '📍 اضغط لتحديد الموقع الآن'}
          </button>
        </div>

        {/* Info Form */}
        <div className="card">
          <div className="section-title"><i className="fa-solid fa-file-invoice"></i> البيانات الأساسية</div>
          <div className="input-wrapper"><label className="input-label">الموقع (الحي / الشارع)</label>
          <input className="premium-input" placeholder="مثال: حي النرجس / طريق الملك فهد" onChange={e => setFormData({...formData, location: e.target.value})} /></div>
          
          <div className="input-wrapper"><label className="input-label">فريق الزيارة</label>
          <input className="premium-input" placeholder="أسماء المهندسين المشاركين" onChange={e => setFormData({...formData, visit_team: e.target.value})} /></div>

          <div className="input-wrapper"><label className="input-label">اسم الاستشاري</label>
          <input className="premium-input" placeholder="اسم الشركة الاستشارية" onChange={e => setFormData({...formData, consultant: e.target.value})} /></div>

          <div className="input-wrapper"><label className="input-label">اسم المقاول</label>
          <input className="premium-input" placeholder="اسم الشركة المنفذة للعمل" onChange={e => setFormData({...formData, contractor: e.target.value})} /></div>

          <div className="input-wrapper"><label className="input-label">رقم أمر العمل / المقايسة</label>
          <input className="premium-input" style={{borderColor: 'var(--accent)'}} placeholder="رقم أمر العمل الضروري" onChange={e => setFormData({...formData, order_number: e.target.value})} /></div>
          
          <div className="input-wrapper"><label className="input-label">وصف العمل الميداني</label>
          <input className="premium-input" placeholder="مثال: صيانة كابلات أرضية / تركيب محول" onChange={e => setFormData({...formData, work_desc: e.target.value})} /></div>

          <div className="input-wrapper"><label className="input-label">اسم مستلم العمل</label>
          <input className="premium-input" placeholder="اسم الشخص المسؤول في الموقع" onChange={e => setFormData({...formData, receiver: e.target.value})} /></div>
        </div>

        {/* Checklist */}
        <h3 style={{margin:'25px 20px 10px', color:'#333'}}>قائمة الفحص (41 بنداً)</h3>
        {qList.map((q, i) => (
          <div key={i} className={`q-card ${(answers[i+1]?.val) ? 'answered' : ''}`}>
            <div style={{fontWeight:'700', fontSize:'14px', lineHeight:'1.4'}}>{q}</div>
            <div className="opt-grid">
              {['نعم', 'لا', 'N/A'].map(opt => (
                <div key={opt} className={`opt-btn ${answers[i+1]?.val === opt ? 'active ' + (opt==='نعم'?'yes':opt==='لا'?'no':'na') : ''}`} onClick={() => handleAnswerChange(i+1, 'val', opt)}>
                  {opt === 'N/A' ? 'لا ينطبق' : opt}
                </div>
              ))}
            </div>
            <button className="opt-btn" style={{width:'100%', marginTop:'12px', background:'#f8fafc', border:'1px dashed #ccc'}} onClick={() => document.getElementById(`pic-${i}`).click()}>
              <i className="fa-solid fa-camera"></i> إضافة صور ميدانية
            </button>
            <input type="file" id={`pic-${i}`} hidden accept="image/*" multiple capture="environment" onChange={e => handleAddPhoto(i+1, e.target.files)} />
            
            {/* عرض مصغرات الصور المضافة */}
            {answers[i+1]?.files && (
              <div style={{display:'flex', flexWrap:'wrap', marginTop:'10px'}}>
                {answers[i+1].files.map((f, fi) => <img key={fi} src={URL.createObjectURL(f)} className="img-preview" />)}
              </div>
            )}

            <textarea className="premium-input" style={{marginTop:'10px', height:'45px', fontSize:'12px'}} placeholder="كتابة ملاحظة لهذا البند (اختياري)..." onChange={e => handleAnswerChange(i+1, 'note', e.target.value)} />
          </div>
        ))}

        {/* التعهد والتحذير (قبل التوقيع) */}
        <div className="card pledge-box">
          <div className="pledge-text">
            ⚠️ نؤكد بشكل قاطع أن دورك كمهندس مشرف لا يقتصر على رصد الملاحظات وإعداد التقارير فقط، بل يشمل المتابعة المباشرة والفعلية للأخطاء التي تم رصدها، والتأكد من تصحيحها فورًا، واتخاذ الإجراءات اللازمة لضمان عدم تكرارها مستقبلًا، مع تحمل المسؤولية النظامية كاملة حيال أي تقصير في ذلك.
          </div>
          <label className="checkbox-container" onClick={() => setPledged(!pledged)}>
            <input type="checkbox" className="pledge-check" checked={pledged} onChange={() => {}} />
            <span style={{fontWeight:'800', color:'#b91c1c', fontSize:'14px'}}>أقر وأتعهد بالالتزام بالمسؤوليات المذكورة أعلاه</span>
          </label>
        </div>

        {/* Signature */}
        <div className="card">
          <div className="section-title"><i className="fa-solid fa-signature"></i> توقيع مستلم العمل</div>
          <SignatureCanvas ref={sigPad} canvasProps={{className: 'sig-canvas'}} />
          <button onClick={() => sigPad.current.clear()} style={{color:'red', border:'none', background:'none', cursor:'pointer', marginTop:'10px', fontWeight:'700'}}>
            <i className="fa-solid fa-eraser"></i> مسح وإعادة التوقيع
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <button className="submit-btn" onClick={handleSubmit} disabled={loading || !pledged}>
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>} 
          {pledged ? ` ${btnText}` : ' يرجى الموافقة على التعهد لتفعيل الإرسال'}
        </button>
      </div>
    </div>
  )
}
export default InspectorApp
