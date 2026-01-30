import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { supabase } from '../supabaseClient'

// قائمة الأسئلة الكاملة
const fullQuestionsList = [
  "تصريح العمل الأساسي والثانوي متواجد بموقع العمل", "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة – وصف العمل – رقم التصريح – توقيع مشرف الكهرب والشركة)", "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", "إلمام المستلم وفريق العمل بإجراءات العمل الآمن وتقييم المخاطر للمهمة", "ملاحظات", "بطاقة تعميد المصدر والمستلم والعامل المشارك سارية وبصلاحيات مناسبة للعمل", "تأهيل سائق المعدات (سائق ونش – سلة هوائية -........)", "المستلم متواجد بموقع العمل", "وضع أقفال السلامة و البطاقات التحذيرية و إكتمال بيانات التواصل", "التأكد من تركيب الأرضي المتنقل من الجهتين", "التأكد من فعالية جهاز كشف الجهد التستر", "التأكد من تواجد نموذج فحص المركبة والعدد والادوات متواجد شهادة المسعف والمكافح وفحص المركبة والباركود الخاص بالخطط", "نماذج الفحص", "نموذج فحص المركبة", "نموذج فحص العدد والادوات", "شهادة المسعف", "شهادة المكافح", "شهادة tuv", "QR Code", "فحص معدات الرفع و الحفر من قبل طرف ثالث (تى يو فى)", "التأكد من مطابقة السلات للمواصفات ( كفرات – زيوت – كسور – حزام الأمان – تكدس مواد .. الخ)", "التأكد من سلامة خطاف الونش واحبال الرفع", "طفاية حريق سليمة ومفحوصة وسلامة استكر الفحص", "شنطة إسعافات مكتملة ومفحوصة", "التأكد من تركيب الأرضي للسيارات", "الحمل الأقصى محدد بوضوح على جميع معدات الرفع", "مهام الوقاية الشخصية سليمة (بسؤال الموظف والتفتيش علية) خوذة - ملابس – حذاء", "التفتيش على القفاز المطاطي (33000 – 13000 – 1000) ك.ف.أ", "الخوذة الكهربائية مزودة بحامى وجة", "أحزمة السلامة مرقمة وسليمة", "استخدام حواجز حماية سليمة وكافية و شريط تحذيري", "كفاية اللوحات الإرشادية المرورية", "الترميز بالألوان حسب الشهر للعدد والأدوات وأدوات السلامة", "تخزين أسطوانات الغاز وأسطوانات الاكسجين واللحام وترميزها", "وجود أغطية الحماية لأسطوانات الغاز والأكسجين", "ليات الاوكسي استيلين لا يوجد بها تشققات او تالفة", "سلامة المنظم والعدادات", "وجود شعار المقاول على المركبات والمعدات", "تم ازالة المخلفات بعد الانتهاء من العمل", "خطط متعلقة بتصاريح العمل", "خطة الطوارئ", "خطة المنع من السقوط", "خطة الإنقاذ في العمل على المرتفعات", "خطة رفع الأحمال الحرجة", "إجراء وملصقات حماية السمع", "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة"
];

const AdminDashboard = () => {
  const navigate = useNavigate()
  
  // State Variables
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('reports') // 'reports' or 'inspectors'
  const [reports, setReports] = useState([])
  const [inspectorsList, setInspectorsList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedReport, setExpandedReport] = useState(null) // ID of expanded report
  const [modalImage, setModalImage] = useState(null)
  const [loading, setLoading] = useState(true)

  // New Inspector Form
  const [newInspectorName, setNewInspectorName] = useState('')
  const [newInspectorPass, setNewInspectorPass] = useState('')
  const [showPassword, setShowPassword] = useState({}) // For toggling visibility in list

  // --- Styles Injection ---
  const styles = `
    :root { --main-blue: #005a8f; --main-orange: #f28b00; --bg: #f3f4f6; --text: #1f2937; --danger: #ef4444; }
    .header { background: white; padding: 15px 20px; border-bottom: 4px solid var(--main-orange); display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100; }
    .logo-box { display: flex; align-items: center; gap: 15px; }
    .dept-badge { border: 2px solid var(--main-blue); color: var(--main-blue); padding: 5px 15px; border-radius: 10px; font-weight: bold; font-size: 13px; text-align: center; background: #f0f9ff; line-height: 1.5; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .btn-logout { background: #fee2e2; color: #dc2626; border: none; padding: 10px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .nav-tabs { display: flex; gap: 10px; padding: 20px; max-width: 800px; margin: auto; }
    .tab-btn { flex: 1; padding: 14px; border: none; border-radius: 12px; background: white; color: #6b7280; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .tab-btn.active { background: var(--main-blue); color: white; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,90,143,0.2); }
    .section { animation: fadeIn 0.4s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #e5e7eb; position: relative; overflow: hidden; }
    .violations-box { background: #fff5f5; border: 1px solid #feb2b2; border-radius: 10px; padding: 15px; margin: 15px 0; }
    .v-item { background: white; padding: 10px; border-radius: 8px; border: 1px solid #fed7aa; margin-bottom: 8px; position: relative; }
    .v-note { font-size: 13px; color: #333; margin-top: 5px; background: #fffbeb; padding: 5px; border-radius: 5px; border-right: 3px solid var(--main-orange); }
    .v-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-top: 5px; cursor: pointer; border: 2px solid #eee; }
    .report-header { display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px; margin-bottom: 10px; }
    .data-row { font-size: 14px; margin-bottom: 6px; color: #4b5563; display: flex; align-items: center; gap: 6px; }
    .eye-btn { width: 100%; background: #f0f9ff; color: var(--main-blue); border: 1px solid #bae6fd; padding: 10px; margin-top: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
    .details-panel { background: #fafafa; padding: 15px; border-radius: 10px; margin-top: 15px; border: 1px solid #eee; }
    .ans-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; gap: 10px; }
    .q-val { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; min-width: 65px; text-align: center; }
    .val-yes { background: #dcfce7; color: #166534; }
    .val-no { background: #fee2e2; color: #991b1b; }
    .input-group { margin-bottom: 15px; position: relative; }
    .custom-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 10px; background: white; font-family: 'Cairo', sans-serif; }
    .eye-pos { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #6b7280; font-size: 18px; }
    .btn-save { width: 100%; background: var(--main-blue); color: white; padding: 12px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; font-family: 'Cairo', sans-serif;}
    .inspector-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-bottom: 1px solid #eee; }
    #imgModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    #imgModal img { max-width: 95%; max-height: 80vh; border-radius: 8px; }
    .close-modal { position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer; }
    
    /* Responsive tweaks for header */
    @media (max-width: 600px) {
      .header { flex-wrap: wrap; gap: 10px; justify-content: center; }
      .dept-badge { order: 3; width: 100%; }
    }
  `;

  // --- Auth & Initial Load ---
  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData) {
      navigate('/')
    } else {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'admin') {
        navigate('/inspector')
      } else {
        setUser(parsedUser)
        fetchReports()
        fetchInspectors()
      }
    }
  }, [])

  // --- Data Fetching ---
  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setReports(data || [])
    } catch (err) {
      alert('خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchInspectors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
      if (error) throw error
      setInspectorsList(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // --- Actions ---
  const addInspector = async () => {
    if (!newInspectorName || !newInspectorPass) return alert('أكمل البيانات')
    try {
      const { error } = await supabase
        .from('users')
        .insert([{ username: newInspectorName, password: newInspectorPass, role: 'inspector' }])
      
      if (error) throw error
      
      alert('تمت الإضافة بنجاح')
      setNewInspectorName('')
      setNewInspectorPass('')
      fetchInspectors()
    } catch (err) {
      alert('خطأ في الإضافة: ' + err.message)
    }
  }

  const deleteInspector = async (username) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المفتش؟')) return
    try {
      const { error } = await supabase.from('users').delete().eq('username', username)
      if (error) throw error
      fetchInspectors()
    } catch (err) {
      alert('خطأ: ' + err.message)
    }
  }

  const deleteReport = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف التقرير؟')) return
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id)
      if (error) throw error
      setReports(reports.filter(r => r.id !== id))
    } catch (err) {
      alert('خطأ: ' + err.message)
    }
  }

  const togglePassVisibility = (username) => {
    setShowPassword(prev => ({ ...prev, [username]: !prev[username] }))
  }

  // --- PDF Generation Logic ---
  const generatePDF = (r) => {
    const container = document.createElement('div')
    
    // استخدام الصورة المحلية في الـ PDF
    const logoUrl = "/imge.jpg";

    let tableRows = ''
    fullQuestionsList.forEach((q, i) => {
      let ans = "نعم" 
      let color = "#16a34a"

      const violation = r.violations?.find(v => v.q === q)
      if (violation) {
        ans = violation.ans
        color = "#dc2626"
      }
      
      if (r.answers && r.answers[i+1]) {
          ans = r.answers[i+1].val || r.answers[i+1]
          if(ans === 'لا') color = "#dc2626"
          else if (ans === 'N/A') color = "#666"
      }

      tableRows += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px; width:40px;">${i+1}</td>
          <td style="padding:8px; text-align:right;">${q}</td>
          <td style="padding:8px; color:${color}; font-weight:bold;">${ans}</td>
        </tr>`
    })

    let violationsHTML = ''
    if (r.violations && r.violations.length > 0) {
      let vCards = ''
      r.violations.forEach(v => {
        vCards += `
          <div style="background:#fff5f5; border:1px solid #feb2b2; margin-bottom:10px; padding:10px; font-size:12px;">
            ${v.photo ? `<img src="${v.photo}" style="width:80px; float:left; margin-right:10px; border-radius:5px;">` : ''}
            <div style="color:#b91c1c; font-weight:bold;">⚠️ ${v.q}</div>
            <div>الحالة: ${v.ans}</div>
            ${v.note ? `<div>ملاحظة: ${v.note}</div>` : ''}
            <div style="clear:both"></div>
          </div>`
      })
      violationsHTML = `<h4 style="color:#b91c1c; margin-top:15px;">🚩 المخالفات</h4>${vCards}`
    }

    const content = `
      <div style="font-family:'Cairo',sans-serif; padding:20px; direction:rtl; width:100%;">
        <div style="border-bottom:4px solid #f28b00; padding-bottom:15px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="color:#005a8f; margin:0;">تقرير تفتيش سلامة</h2>
                <p style="margin:5px 0;">إدارة ضواحي الرياض</p>
            </div>
            <img src="${logoUrl}" style="height:60px;">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; margin-bottom:20px;">
             <div><b>رقم التقرير:</b> ${r.serial}</div>
             <div><b>التاريخ:</b> ${r.timestamp}</div>
             <div><b>المفتش:</b> ${r.inspector}</div>
             <div><b>الاستشاري:</b> ${r.consultant || '-'}</div>
             <div><b>الموقع:</b> ${r.location}</div>
             <div><b>المقاول:</b> ${r.contractor}</div>
        </div>
        
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px; background:#f0f9ff; padding:10px; border-radius:8px;">
            ${r.verification_photo ? `<img src="${r.verification_photo}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #005a8f;">` : ''}
            <div>
                <div style="font-weight:bold; color:#005a8f;">✅ إثبات الحضور</div>
                <div style="font-size:11px;">تم التحقق من هوية المفتش وموقعه الجغرافي</div>
                ${r.google_maps_link ? `<a href="${r.google_maps_link}" style="font-size:10px;">رابط الموقع</a>` : ''}
            </div>
        </div>

        ${violationsHTML}

        <h4 style="background:#005a8f; color:white; padding:5px;">قائمة الفحص</h4>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">${tableRows}</table>

        <div style="margin-top:30px; display:flex; justify-content:space-between; text-align:center;">
            <div><b>المفتش</b><br>${r.inspector}</div>
            ${r.signature_image ? `<div><b>توقيع المستلم</b><br><img src="${r.signature_image}" style="max-height:50px;"></div>` : ''}
        </div>
      </div>
    `

    container.innerHTML = content
    html2pdf()
      .set({
        margin: 10,
        filename: `Report_${r.serial}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' }
      })
      .from(container)
      .save()
  }

  // --- Filtering ---
  const filteredReports = reports.filter(r => 
    (r.inspector || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (String(r.serial) || "").includes(searchTerm) ||
    (r.contractor || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // --- Render ---
  return (
    <>
      <style>{styles}</style>
      
      {/* Modal for Images */}
      {modalImage && (
        <div id="imgModal" onClick={() => setModalImage(null)}>
          <span className="close-modal">&times;</span>
          <img src={modalImage} alt="Large View" />
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="logo-box">
            {/* اللوجو المحلي */}
            <img 
                src="/imge.jpg" 
                alt="Saudi Electricity Company" 
                style={{ height: '60px', objectFit:'contain' }}
            />
            <div>
                <div style={{ fontWeight: 'bold', color: 'var(--main-blue)', fontSize: '18px' }}>لوحة الرقابة</div>
                <div style={{ fontSize: '12px', color: 'var(--main-orange)', fontWeight: 'bold' }}>إدارة ضواحي الرياض</div>
            </div>
        </div>
        
        <div className="dept-badge">
            مجموعة السلامة
            <br />
            إدارة ضواحي الرياض
        </div>

        <button 
          className="btn-logout" 
          onClick={() => {
            sessionStorage.clear()
            navigate('/')
          }}
        >
          <i className="fa-solid fa-power-off" style={{fontSize: '18px'}}></i> 
          <span>خروج</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reports')}
        >
          <i className="fa-regular fa-file-lines"></i> التقارير
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inspectors' ? 'active' : ''}`} 
          onClick={() => setActiveTab('inspectors')}
        >
          <i className="fa-solid fa-users-gear"></i> المفتشين
        </button>
      </div>

      <div className="container">
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="section">
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', right: '15px', top: '12px', color: '#999' }}></i>
              <input 
                type="text" 
                className="custom-input" 
                style={{ paddingRight: '40px' }} 
                placeholder="بحث برقم التقرير، المفتش، المقاول..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div id="reportsList">
              {loading ? <p style={{textAlign:'center'}}>جاري التحميل...</p> : 
               filteredReports.length === 0 ? <p style={{textAlign:'center'}}>لا توجد تقارير</p> :
               filteredReports.map(r => (
                <div className="card" key={r.id}>
                  <div className="report-header">
                    <div>
                      <div className="r-serial">#{r.serial}</div>
                      <div className="r-meta">{r.timestamp}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--main-blue)' }}>{r.inspector}</div>
                    </div>
                  </div>

                  <div className="data-row">👔 الاستشاري: <b>{r.consultant || 'غير محدد'}</b></div>
                  <div className="data-row">
                    📍 الموقع: <b>{r.location}</b> 
                    {r.google_maps_link ? 
                      <a href={r.google_maps_link} target="_blank" rel="noreferrer" style={{color:'#2563eb', fontWeight:'bold', textDecoration:'none', marginRight:'5px'}}>
                         (عرض الخريطة)
                      </a> : <span style={{color:'red'}}> ⚠️ لم يتم تحديد الموقع</span>
                    }
                  </div>
                  <div className="data-row">👷 المقاول: <b>{r.contractor}</b></div>
                  <div className="data-row">🏗️ العمل: <b>{r.work_desc || '-'}</b></div>

                  {/* Violations Section */}
                  {r.violations && r.violations.length > 0 && (
                    <div className="violations-box">
                      <div style={{ color: '#991b1b', fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
                        <i className="fa-solid fa-clipboard-list"></i> الملاحظات والمخالفات المرصودة:
                      </div>
                      {r.violations.map((v, idx) => (
                        <div className="v-item" key={idx}>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>🔹 {v.q}</div>
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                            background: v.ans === 'لا' ? '#fee2e2' : '#dcfce7',
                            color: v.ans === 'لا' ? '#991b1b' : '#166534'
                          }}>
                            {v.ans}
                          </span>
                          {v.note && <div className="v-note">📝 {v.note}</div>}
                          {v.photo && <br />}
                          {v.photo && <img src={v.photo} className="v-img" alt="violation" onClick={() => setModalImage(v.photo)} />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Toggle Details */}
                  <button className="eye-btn" onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}>
                    <i className="fa-regular fa-eye"></i> تفاصيل التقرير
                  </button>

                  {expandedReport === r.id && (
                    <div className="details-panel">
                      <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', background: '#fff' }}>
                        {r.verification_photo ? (
                          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <img src={r.verification_photo} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid var(--main-blue)', objectFit: 'cover' }} alt="verify" />
                            <br /><small style={{ color: '#005a8f', fontWeight: 'bold' }}>📸 صورة التحقق</small>
                          </div>
                        ) : <div style={{ color: 'red', textAlign: 'center' }}>⚠️ لا توجد صورة تحقق</div>}
                        <p><b>👔 الاستشاري: {r.consultant || '-'}</b></p>
                        <p>👷 المقاول: {r.contractor}</p>
                        <p>📥 المستلم: {r.receiver || '-'}</p>
                      </div>
                      
                      {/* Questions List Logic for Detail View */}
                      {fullQuestionsList.map((q, i) => {
                        const answerObj = r.answers ? r.answers[i+1] : null;
                        const ans = answerObj ? (answerObj.val || answerObj) : "N/A";
                        const isViolation = r.violations?.some(v => v.q === q);
                        const displayAns = isViolation ? "لا" : (ans === "N/A" && !isViolation ? "نعم" : ans);
                        
                        return (
                          <div className="ans-row" key={i}>
                            <div style={{ flex: 1 }}>{q}</div>
                            <div className={`q-val ${displayAns === 'نعم' ? 'val-yes' : displayAns === 'لا' ? 'val-no' : 'val-na'}`}>
                              {displayAns}
                            </div>
                          </div>
                        )
                      })}

                      {r.signature_image && (
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                          <p style={{ fontWeight: 'bold' }}>✍️ التوقيع:</p>
                          <img src={r.signature_image} style={{ maxWidth: '150px', border: '1px solid #ccc', padding: '5px' }} alt="sig" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button 
                      onClick={() => deleteReport(r.id)} 
                      style={{ flex: 1, background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Cairo' }}
                    >
                      <i className="fa-solid fa-trash-can"></i> حذف
                    </button>
                    <button 
                      onClick={() => generatePDF(r)} 
                      style={{ flex: 2, background: '#005a8f', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Cairo' }}
                    >
                      <i className="fa-solid fa-download"></i> تحميل PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspectors Tab */}
        {activeTab === 'inspectors' && (
          <div className="section">
            <div className="card">
              <h3 style={{ color: 'var(--main-blue)', marginBottom: '15px' }}>➕ إضافة مفتش جديد</h3>
              <div className="input-group">
                <input 
                  className="custom-input" 
                  placeholder="اسم المفتش" 
                  value={newInspectorName}
                  onChange={(e) => setNewInspectorName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <input 
                  type={showPassword['new'] ? "text" : "password"} 
                  className="custom-input" 
                  placeholder="كلمة السر" 
                  value={newInspectorPass}
                  onChange={(e) => setNewInspectorPass(e.target.value)}
                />
                <i 
                  className={`fa-regular ${showPassword['new'] ? "fa-eye-slash" : "fa-eye"} eye-pos`} 
                  onClick={() => togglePassVisibility('new')}
                ></i>
              </div>
              <button className="btn-save" onClick={addInspector}>حفظ المفتش</button>
            </div>

            <div className="card">
              <h3 style={{ color: 'var(--main-blue)', marginBottom: '15px' }}>👥 قائمة المفتشين</h3>
              <div>
                {inspectorsList.map((insp) => (
                  <div className="inspector-row" key={insp.id}>
                    <div><b>👤 {insp.username}</b></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type={showPassword[insp.username] ? "text" : "password"} 
                        value={insp.password} 
                        readOnly 
                        style={{ border: 'none', background: 'none', width: '80px', textAlign: 'center' }} 
                      />
                      <i 
                        className={`fa-regular ${showPassword[insp.username] ? "fa-eye-slash" : "fa-eye"}`} 
                        style={{ cursor: 'pointer', color: '#666' }} 
                        onClick={() => togglePassVisibility(insp.username)}
                      ></i>
                      <button 
                        onClick={() => deleteInspector(insp.username)} 
                        style={{ background: '#fee2e2', color: 'red', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Cairo' }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminDashboard
