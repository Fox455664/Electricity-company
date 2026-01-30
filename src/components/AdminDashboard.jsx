import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { supabase } from '../supabaseClient'

// --- 1. قائمة الأسئلة المحدثة (نفس ترتيب تطبيق المفتش تماماً) ---
// يجب أن تكون هذه القائمة متطابقة مع flatQList في تطبيق المفتش لضمان تطابق الإجابات
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
    "نموذج فحص المركبة",
    "شهادة المسعف",
    "شهادة المكافح",
    "TUV السائق",
    "TUV المعدات",
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
    "خطة الطوارئ",
    "خطة الإنقاذ في العمل على المرتفعات",
    "خطة رفع الأحمال الحرجة",
    "إجراء وملصقات حماية السمع",
    "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة"
  ]
};

const fullQuestionsList = Object.values(categories).flat();

const AdminDashboard = () => {
  const navigate = useNavigate()
  
  // State Variables
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('reports')
  const [reports, setReports] = useState([])
  const [inspectorsList, setInspectorsList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedReport, setExpandedReport] = useState(null)
  const [modalImage, setModalImage] = useState(null)
  const [loading, setLoading] = useState(true)

  // New Inspector Form
  const [newInspectorName, setNewInspectorName] = useState('')
  const [newInspectorPass, setNewInspectorPass] = useState('')
  const [showPassword, setShowPassword] = useState({})

  // --- Premium Styles ---
  const styles = `
    :root { 
      --main-blue: #005a8f; 
      --dark-blue: #0f172a;
      --main-orange: #f28b00; 
      --bg-color: #f1f5f9; 
      --text-main: #334155; 
      --text-light: #64748b;
      --danger: #ef4444; 
      --success: #10b981;
    }

    body { background-color: var(--bg-color); font-family: 'Cairo', sans-serif; color: var(--text-main); }

    .dashboard-header {
      background: linear-gradient(to right, #005a8f, #004269);
      padding: 15px 20px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 4px 20px rgba(0, 90, 143, 0.2);
      position: sticky; top: 0; z-index: 100; color: white;
    }

    .logo-container { display: flex; align-items: center; gap: 15px; background: rgba(255, 255, 255, 0.1); padding: 8px 15px; border-radius: 50px; backdrop-filter: blur(5px); }
    .logo-img { height: 45px; background: white; padding: 2px; border-radius: 8px; }

    .header-actions { display: flex; gap: 10px; }
    .action-btn { border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; font-family: 'Cairo'; }
    .btn-inspector { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); }
    .btn-logout { background: #fee2e2; color: #b91c1c; }

    .dashboard-container { max-width: 1000px; margin: 20px auto; padding: 0 15px; }

    .tabs-wrapper { background: white; padding: 8px; border-radius: 16px; display: flex; gap: 10px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    .tab-item { flex: 1; padding: 12px; border: none; border-radius: 12px; background: transparent; color: var(--text-light); font-weight: 700; cursor: pointer; transition: all 0.3s ease; font-family: 'Cairo'; }
    .tab-item.active { background: var(--main-blue); color: white; box-shadow: 0 4px 12px rgba(0, 90, 143, 0.3); }

    .search-input { width: 100%; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; font-size: 15px; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.03); font-family: 'Cairo'; margin-bottom: 20px; box-sizing: border-box; }

    .report-card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; border-right: 5px solid; transition: transform 0.2s; }
    .report-card.safe { border-right-color: var(--success); }
    .report-card.violation { border-right-color: var(--danger); }
    .report-card:hover { transform: translateY(-3px); }

    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
    .status-badge { padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }
    .status-safe { background: #dcfce7; color: #166534; }
    .status-danger { background: #fee2e2; color: #991b1b; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 12px; color: var(--text-light); font-weight: 600; }
    .info-value { font-size: 14px; font-weight: 700; color: var(--text-main); }

    .violations-container { background: #fff1f2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px; margin: 15px 0; }
    .v-item { background: white; padding: 12px; border-radius: 8px; border: 1px solid #fcd34d; margin-bottom: 8px; font-size: 13px; }
    
    .action-grid { display: flex; gap: 10px; margin-top: 20px; }
    .btn-action-card { flex: 1; padding: 12px; border-radius: 10px; border:none; font-weight: 700; cursor: pointer; font-family: 'Cairo'; display: flex; justify-content: center; align-items: center; gap: 5px; }
    .btn-view { background: #eff6ff; color: var(--main-blue); }
    .btn-pdf { background: var(--main-blue); color: white; }
    .btn-delete { background: white; border: 1px solid #fee2e2; color: #dc2626; }

    .inspector-card { background: white; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border: 1px solid #f1f5f9; }
    
    #imgModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    #imgModal img { max-width: 95%; max-height: 80vh; border-radius: 8px; }
    .close-modal { position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer; }

    .details-panel { background: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 15px; border: 1px solid #e2e8f0; }
    .q-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }

    .image-thumbnails { display: flex; gap: 5px; margin-top: 5px; overflow-x: auto; }
    .thumb-img { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; }
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
      setNewInspectorName(''); setNewInspectorPass(''); fetchInspectors();
    } catch (err) { alert('خطأ في الإضافة: ' + err.message) }
  }

  const deleteInspector = async (username) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المفتش؟')) return
    try {
      const { error } = await supabase.from('users').delete().eq('username', username)
      if (error) throw error
      fetchInspectors()
    } catch (err) { alert('خطأ: ' + err.message) }
  }

  const deleteReport = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف التقرير؟')) return
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id)
      if (error) throw error
      setReports(reports.filter(r => r.id !== id))
    } catch (err) { alert('خطأ: ' + err.message) }
  }

  const togglePassVisibility = (username) => {
    setShowPassword(prev => ({ ...prev, [username]: !prev[username] }))
  }

  // --- PDF Generation (المحدث لدعم الصور المتعددة والحقول الجديدة) ---
  const generatePDF = (r) => {
    const container = document.createElement('div')
    const logoUrl = "/imge.jpg";

    let tableRows = ''
    fullQuestionsList.forEach((q, i) => {
      let ans = "نعم" 
      let color = "#16a34a"

      const violation = r.violations?.find(v => v.question === q || v.q === q) // دعم التسمية القديمة والجديدة
      if (violation) {
        ans = violation.answer || violation.ans
        color = "#dc2626"
      }
      
      // محاولة جلب الإجابة من كائن الإجابات
      if (r.answers && r.answers[i]) { // استخدام الاندكس المباشر
          const val = r.answers[i].val
          if(val) ans = val;
          if(ans === 'لا') color = "#dc2626"
          else if (ans === 'N/A') { ans = "لا ينطبق"; color = "#666"; }
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
        // تجميع الصور (سواء كانت مصفوفة images أو حقل photo القديم)
        let imagesHtml = '';
        if (v.images && v.images.length > 0) {
           v.images.forEach(img => {
             imagesHtml += `<img src="${img}" style="width:70px; height:70px; object-fit:cover; margin-left:5px; border-radius:5px; border:1px solid #ccc;">`
           });
        } else if (v.photo) {
           imagesHtml = `<img src="${v.photo}" style="width:70px; height:70px; object-fit:cover; margin-left:5px; border-radius:5px;">`
        }

        vCards += `
          <div style="background:#fff5f5; border:1px solid #feb2b2; margin-bottom:10px; padding:10px; font-size:12px;">
             <div style="margin-bottom:5px;">${imagesHtml}</div>
            <div style="color:#b91c1c; font-weight:bold;">⚠️ ${v.question || v.q}</div>
            <div>الحالة: ${v.answer || v.ans}</div>
            ${v.note ? `<div>ملاحظة: ${v.note}</div>` : ''}
            <div style="clear:both"></div>
          </div>`
      })
      violationsHTML = `<h4 style="color:#b91c1c; margin-top:15px;">🚩 المخالفات والملاحظات</h4>${vCards}`
    }

    const content = `
      <div style="font-family:'Cairo',sans-serif; padding:20px; direction:rtl; width:100%;">
        <div style="border-bottom:4px solid #f28b00; padding-bottom:15px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="color:#005a8f; margin:0;">تقرير تفتيش سلامة</h2>
                <p style="margin:5px 0;">مجموعة السلامة إدارة ضواحي الرياض</p>
            </div>
            <img src="${logoUrl}" style="height:60px;">
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; margin-bottom:20px; background:#f8fafc; padding:15px; border-radius:10px;">
             <div><b>رقم التقرير:</b> ${r.serial}</div>
             <div><b>التاريخ:</b> ${r.created_at || r.timestamp}</div>
             <div><b>المفتش:</b> ${r.inspector}</div>
             <div><b>المقاول:</b> ${r.contractor}</div>
             <div><b>رقم أمر العمل:</b> ${r.work_order || '-'}</div>
             <div><b>فريق الزيارة:</b> ${r.visit_team || '-'}</div>
             <div><b>وصف العمل:</b> ${r.work_desc || '-'}</div>
             <div><b>الموقع:</b> ${r.location || '-'}</div>
        </div>
        
        ${r.location_url || r.google_maps_link ? `
        <div style="margin-bottom:15px; font-size:12px;">
           <b>📍 الموقع الجغرافي:</b> <a href="${r.location_url || r.google_maps_link}">اضغط لفتح الخريطة</a>
        </div>` : ''}

        ${violationsHTML}

        <h4 style="background:#005a8f; color:white; padding:8px; border-radius:5px;">قائمة الفحص التفصيلية</h4>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">${tableRows}</table>

        <div style="margin-top:40px; display:flex; justify-content:space-between; text-align:center;">
            <div>
              <b>مفتش السلامة</b><br>
              ${r.inspector}
              ${r.inspector_photo ? `<br><img src="${r.inspector_photo}" style="width:60px; height:60px; border-radius:50%; margin-top:5px; object-fit:cover;">` : ''}
            </div>
            ${r.signature || r.signature_image ? `<div><b>توقيع مسؤول شركة الكهرباء</b><br><img src="${r.signature || r.signature_image}" style="max-height:60px;"></div>` : ''}
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

  const filteredReports = reports.filter(r => 
    (r.inspector || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (String(r.serial) || "").includes(searchTerm) ||
    (r.contractor || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <style>{styles}</style>
      
      {modalImage && (
        <div id="imgModal" onClick={() => setModalImage(null)}>
          <span className="close-modal">&times;</span>
          <img src={modalImage} alt="Large View" />
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="logo-container">
            <img src="/imge.jpg" alt="SEC" className="logo-img" />
            <div style={{lineHeight: '1.2'}}>
                <div style={{fontWeight: '800', fontSize: '16px'}}>مجموعة السلامة</div>
                <div style={{fontSize: '12px', opacity: '0.9'}}>إدارة ضواحي الرياض</div>
            </div>
        </div>
        
        <div className="header-actions">
            <button className="action-btn btn-inspector" onClick={() => navigate('/inspector')}>
                <i className="fa-solid fa-clipboard-check"></i> <span>تطبيق المفتش</span>
            </button>
            <button className="action-btn btn-logout" onClick={() => { sessionStorage.clear(); navigate('/'); }}>
                <i className="fa-solid fa-power-off"></i> <span>خروج</span>
            </button>
        </div>
      </div>

      <div className="dashboard-container">
        
        {/* Tabs */}
        <div className="tabs-wrapper">
          <button className={`tab-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <i className="fa-regular fa-file-lines"></i> التقارير
          </button>
          <button className={`tab-item ${activeTab === 'inspectors' ? 'active' : ''}`} onClick={() => setActiveTab('inspectors')}>
            <i className="fa-solid fa-users-gear"></i> المفتشين
          </button>
        </div>
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="section">
            <input 
              type="text" 
              className="search-input" 
              placeholder="🔍 بحث برقم التقرير، المفتش، اسم المقاول..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div id="reportsList">
              {loading ? <p style={{textAlign:'center', color:'#666'}}>جاري تحميل البيانات...</p> : 
               filteredReports.length === 0 ? <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'16px'}}>📂 لا توجد تقارير مطابقة</div> :
               filteredReports.map(r => {
                 const hasViolations = r.violations && r.violations.length > 0;
                 return (
                  <div className={`report-card ${hasViolations ? 'violation' : 'safe'}`} key={r.id}>
                    
                    <div className="card-header">
                      <div>
                        <div style={{fontSize: '18px', fontWeight: '800', color: '#005a8f'}}>
                           <i className="fa-solid fa-hashtag"></i> {r.serial}
                        </div>
                        <div style={{fontSize:'12px', color:'#94a3b8', marginTop:'5px'}}>
                           <i className="fa-regular fa-clock"></i> {r.created_at || r.timestamp}
                        </div>
                      </div>
                      <div className={`status-badge ${hasViolations ? 'status-danger' : 'status-safe'}`}>
                         {hasViolations ? `${r.violations.length} مخالفات` : 'سليم ✅'}
                      </div>
                    </div>

                    <div className="info-grid">
                      <div className="info-item"><span className="info-label">المفتش</span><span className="info-value">{r.inspector}</span></div>
                      <div className="info-item"><span className="info-label">المقاول</span><span className="info-value">{r.contractor}</span></div>
                      <div className="info-item"><span className="info-label">رقم الأمر</span><span className="info-value">{r.work_order || '-'}</span></div>
                      <div className="info-item"><span className="info-label">الموقع</span>
                         {r.location_url || r.google_maps_link ? 
                           <a href={r.location_url || r.google_maps_link} target="_blank" rel="noreferrer" style={{color:'#2563eb', fontSize:'12px', textDecoration:'none'}}>عرض الخريطة 📍</a> 
                           : <span style={{fontSize:'12px'}}>غير محدد</span>}
                      </div>
                    </div>

                    {hasViolations && (
                      <div className="violations-container">
                        <div style={{color: '#991b1b', fontWeight: '800', marginBottom: '10px'}}>
                          <i className="fa-solid fa-triangle-exclamation"></i> الملاحظات:
                        </div>
                        {r.violations.map((v, idx) => (
                          <div className="v-item" key={idx}>
                            <div style={{fontWeight:'bold', marginBottom:'5px'}}>{idx+1}. {v.question || v.q}</div>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span style={{fontSize:'12px', color:'#ef4444', fontWeight:'bold'}}>{v.answer || v.ans}</span>
                            </div>
                            {/* عرض الصور المتعددة */}
                            <div className="image-thumbnails">
                                {v.images && v.images.map((img, i) => (
                                    <img key={i} src={img} className="thumb-img" onClick={()=>setModalImage(img)} alt="v-img" />
                                ))}
                                {v.photo && !v.images && <img src={v.photo} className="thumb-img" onClick={()=>setModalImage(v.photo)} alt="v-img" />}
                            </div>
                            {v.note && <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>📝 {v.note}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="action-grid">
                      <button className="btn-action-card btn-view" onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}>
                        <i className={`fa-solid ${expandedReport === r.id ? 'fa-chevron-up' : 'fa-eye'}`}></i> {expandedReport === r.id ? 'إخفاء' : 'التفاصيل'}
                      </button>
                      <button className="btn-action-card btn-pdf" onClick={() => generatePDF(r)}>
                        <i className="fa-solid fa-file-pdf"></i> PDF
                      </button>
                      <button className="btn-action-card btn-delete" onClick={() => deleteReport(r.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedReport === r.id && (
                      <div className="details-panel">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px', fontSize:'13px'}}>
                           <div><b>الاستشاري:</b> {r.consultant || '-'}</div>
                           <div><b>المستلم:</b> {r.receiver || '-'}</div>
                           <div><b>وصف العمل:</b> {r.work_desc || '-'}</div>
                           <div><b>فريق الزيارة:</b> {r.visit_team || '-'}</div>
                        </div>

                        <div style={{maxHeight:'300px', overflowY:'auto'}}>
                          {fullQuestionsList.map((q, i) => {
                            // منطق متوافق مع البيانات القديمة والجديدة
                            let ans = 'N/A';
                            let isViolation = false;

                            // البحث في المخالفات
                            const violation = r.violations?.find(v => v.question === q || v.q === q);
                            if (violation) {
                                isViolation = true;
                                ans = violation.answer || violation.ans;
                            } else if (r.answers && r.answers[i]) {
                                // البحث في الإجابات السليمة
                                ans = r.answers[i].val || 'N/A';
                            }
                            
                            // تحسين العرض
                            const displayAns = isViolation ? "لا" : (ans === "N/A" ? "لا ينطبق" : ans);
                            const bg = displayAns === 'نعم' ? '#dcfce7' : (displayAns === 'لا' ? '#fee2e2' : '#f1f5f9');
                            const color = displayAns === 'نعم' ? '#166534' : (displayAns === 'لا' ? '#991b1b' : '#64748b');

                            return (
                              <div className="q-row" key={i}>
                                <div style={{flex:1, paddingLeft:'10px'}}>{q}</div>
                                <div style={{fontWeight:'bold', color, background: bg, padding: '2px 8px', borderRadius:'4px', fontSize:'11px', whiteSpace:'nowrap'}}>
                                  {displayAns}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                 )
               })
              }
            </div>
          </div>
        )}

        {/* Inspectors Tab */}
        {activeTab === 'inspectors' && (
          <div className="section">
            <div style={{background:'white', padding:'25px', borderRadius:'16px', boxShadow:'0 4px 15px rgba(0,0,0,0.05)', marginBottom:'25px'}}>
              <h3 style={{ color: 'var(--main-blue)', marginBottom: '15px', marginTop:0 }}><i className="fa-solid fa-user-plus"></i> إضافة مفتش جديد</h3>
              <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                <input 
                  className="search-input" 
                  style={{flex:1, margin:0}} 
                  placeholder="اسم المفتش" 
                  value={newInspectorName}
                  onChange={(e) => setNewInspectorName(e.target.value)}
                />
                <input 
                  className="search-input" 
                  style={{flex:1, margin:0}} 
                  placeholder="كلمة المرور" 
                  type="password"
                  value={newInspectorPass}
                  onChange={(e) => setNewInspectorPass(e.target.value)}
                />
                <button className="btn-action-card btn-pdf" style={{flex:'0 0 100px', background: '#10b981'}} onClick={addInspector}>حفظ</button>
              </div>
            </div>

            <div style={{background:'white', padding:'20px', borderRadius:'16px'}}>
              <h3 style={{ color: 'var(--main-blue)', marginTop:0 }}>👥 المفتشين</h3>
              {inspectorsList.map((insp) => (
                <div className="inspector-card" key={insp.id}>
                  <div style={{fontWeight:'bold'}}>{insp.username}</div>
                  <div style={{display: 'flex', gap: '10px'}}>
                     <span style={{background:'#f1f5f9', padding:'5px 10px', borderRadius:'5px', fontSize:'12px'}}>
                        كلمة المرور: {showPassword[insp.username] ? insp.password : '••••••'}
                     </span>
                     <i className={`fa-regular ${showPassword[insp.username] ? "fa-eye-slash" : "fa-eye"}`} style={{cursor:'pointer', color:'#94a3b8'}} onClick={() => togglePassVisibility(insp.username)}></i>
                     <i className="fa-solid fa-trash-can" style={{color:'#ef4444', cursor:'pointer', marginLeft:'10px'}} onClick={() => deleteInspector(insp.username)}></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminDashboard
