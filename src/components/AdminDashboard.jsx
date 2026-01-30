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

  // --- Premium Styles Injection ---
  const styles = `
    :root { 
      --main-blue: #005a8f; 
      --dark-blue: #0f172a;
      --main-orange: #f28b00; 
      --bg-color: #f1f5f9; 
      --card-bg: #ffffff;
      --text-main: #334155; 
      --text-light: #64748b;
      --danger: #ef4444; 
      --success: #10b981;
      --border-radius: 12px;
    }

    body {
      background-color: var(--bg-color);
      font-family: 'Cairo', sans-serif;
      color: var(--text-main);
    }

    /* Header Styling */
    .dashboard-header {
      background: linear-gradient(to right, #005a8f, #004269);
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0, 90, 143, 0.2);
      position: sticky;
      top: 0;
      z-index: 100;
      color: white;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 15px;
      background: rgba(255, 255, 255, 0.1);
      padding: 8px 15px;
      border-radius: 50px;
      backdrop-filter: blur(5px);
    }

    .logo-img {
      height: 45px;
      background: white;
      padding: 2px;
      border-radius: 8px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      font-family: 'Cairo';
    }

    .btn-inspector { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); }
    .btn-inspector:hover { background: rgba(255,255,255,0.3); }

    .btn-logout { background: #fee2e2; color: #b91c1c; }
    .btn-logout:hover { background: #fecaca; }

    /* Container */
    .dashboard-container {
      max-width: 1000px;
      margin: 20px auto;
      padding: 0 15px;
    }

    /* Tabs */
    .tabs-wrapper {
      background: white;
      padding: 8px;
      border-radius: 16px;
      display: flex;
      gap: 10px;
      margin-bottom: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    }

    .tab-item {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: var(--text-light);
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: 'Cairo';
    }

    .tab-item.active {
      background: var(--main-blue);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 90, 143, 0.3);
    }

    /* Search Bar */
    .search-wrapper {
      position: relative;
      margin-bottom: 25px;
    }

    .search-input {
      width: 100%;
      padding: 16px 50px 16px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      font-size: 15px;
      background: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      font-family: 'Cairo';
      transition: 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--main-blue);
      box-shadow: 0 4px 20px rgba(0, 90, 143, 0.1);
    }

    .search-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 18px;
    }

    /* Report Cards */
    .report-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      border: 1px solid #f1f5f9;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      border-right: 5px solid; /* Status Indicator */
    }

    .report-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }

    .report-card.safe { border-right-color: var(--success); }
    .report-card.violation { border-right-color: var(--danger); }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #f1f5f9;
    }

    .serial-number {
      font-size: 18px;
      font-weight: 800;
      color: var(--main-blue);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-badge {
      padding: 5px 12px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 700;
    }

    .status-safe { background: #dcfce7; color: #166534; }
    .status-danger { background: #fee2e2; color: #991b1b; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 12px;
      color: var(--text-light);
      margin-bottom: 4px;
      font-weight: 600;
    }

    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Violations Section */
    .violations-container {
      background: #fff1f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 15px;
      margin: 15px 0;
    }

    .v-header {
      color: #991b1b;
      font-weight: 800;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .v-item {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #fcd34d;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .action-grid {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn-action-card {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: 'Cairo';
      font-size: 14px;
      transition: 0.2s;
    }

    .btn-view { background: #eff6ff; color: var(--main-blue); }
    .btn-view:hover { background: #dbeafe; }

    .btn-pdf { background: var(--main-blue); color: white; }
    .btn-pdf:hover { background: #004269; }

    .btn-delete { background: white; border: 1px solid #fee2e2; color: #dc2626; }
    .btn-delete:hover { background: #fee2e2; }

    /* Inspectors List */
    .inspector-card {
      background: white;
      padding: 15px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
    }

    .add-inspector-box {
      background: white;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      margin-bottom: 25px;
    }

    .input-row {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .form-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-family: 'Cairo';
      background: #f8fafc;
    }

    .btn-add {
      width: 100%;
      padding: 12px;
      background: var(--success);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Cairo';
    }

    /* Modal */
    #imgModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    #imgModal img { max-width: 95%; max-height: 80vh; border-radius: 8px; }
    .close-modal { position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer; }

    /* Details Panel */
    .details-panel {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      margin-top: 15px;
      border: 1px solid #e2e8f0;
    }

    .q-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    
    @media (max-width: 768px) {
      .header-actions span { display: none; }
      .info-grid { grid-template-columns: 1fr; }
      .input-row { flex-direction: column; }
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

  // --- PDF Generation ---
  const generatePDF = (r) => {
    const container = document.createElement('div')
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
                <div style={{fontWeight: '800', fontSize: '18px'}}>لوحة التحكم</div>
                <div style={{fontSize: '12px', opacity: '0.9'}}>إدارة ضواحي الرياض</div>
            </div>
        </div>
        
        <div className="header-actions">
            <button className="action-btn btn-inspector" onClick={() => navigate('/inspector')}>
                <i className="fa-solid fa-clipboard-check"></i>
                <span>تطبيق المفتش</span>
            </button>
            <button className="action-btn btn-logout" onClick={() => { sessionStorage.clear(); navigate('/'); }}>
                <i className="fa-solid fa-power-off"></i>
                <span>خروج</span>
            </button>
        </div>
      </div>

      <div className="dashboard-container">
        
        {/* Tabs */}
        <div className="tabs-wrapper">
          <button 
            className={`tab-item ${activeTab === 'reports' ? 'active' : ''}`} 
            onClick={() => setActiveTab('reports')}
          >
            <i className="fa-regular fa-file-lines"></i> التقارير
          </button>
          <button 
            className={`tab-item ${activeTab === 'inspectors' ? 'active' : ''}`} 
            onClick={() => setActiveTab('inspectors')}
          >
            <i className="fa-solid fa-users-gear"></i> المفتشين
          </button>
        </div>
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="section">
            <div className="search-wrapper">
              <input 
                type="text" 
                className="search-input" 
                placeholder="🔍 بحث برقم التقرير، المفتش، اسم المقاول..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fa-solid fa-filter search-icon"></i>
            </div>

            <div id="reportsList">
              {loading ? <p style={{textAlign:'center', color:'#666'}}>جاري تحميل البيانات...</p> : 
               filteredReports.length === 0 ? <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'16px'}}>📂 لا توجد تقارير مطابقة</div> :
               filteredReports.map(r => {
                 const hasViolations = r.violations && r.violations.length > 0;
                 return (
                  <div className={`report-card ${hasViolations ? 'violation' : 'safe'}`} key={r.id}>
                    
                    <div className="card-header">
                      <div>
                        <div className="serial-number">
                           <i className="fa-solid fa-hashtag"></i> {r.serial}
                        </div>
                        <div style={{fontSize:'12px', color:'#94a3b8', marginTop:'5px'}}>
                           <i className="fa-regular fa-clock"></i> {r.timestamp}
                        </div>
                      </div>
                      <div className={`status-badge ${hasViolations ? 'status-danger' : 'status-safe'}`}>
                         {hasViolations ? `${r.violations.length} مخالفات` : 'سليم ✅'}
                      </div>
                    </div>

                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">المفتش</span>
                        <span className="info-value"><i className="fa-solid fa-user-shield" style={{color:'#005a8f'}}></i> {r.inspector}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">المقاول</span>
                        <span className="info-value"><i className="fa-solid fa-hard-hat" style={{color:'#f59e0b'}}></i> {r.contractor}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">الموقع</span>
                        <span className="info-value">
                           {r.google_maps_link ? 
                             <a href={r.google_maps_link} target="_blank" rel="noreferrer" style={{color:'#2563eb', textDecoration:'none', display:'flex', alignItems:'center', gap:'5px'}}>
                               <i className="fa-solid fa-location-dot"></i> {r.location || 'عرض الخريطة'}
                             </a> 
                             : <span style={{color:'red'}}>غير محدد</span>}
                        </span>
                      </div>
                    </div>

                    {hasViolations && (
                      <div className="violations-container">
                        <div className="v-header">
                          <i className="fa-solid fa-triangle-exclamation"></i> أبرز الملاحظات:
                        </div>
                        {r.violations.map((v, idx) => (
                          <div className="v-item" key={idx}>
                            <div style={{fontWeight:'bold', marginBottom:'5px'}}>{idx+1}. {v.q}</div>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span style={{fontSize:'12px', color:'#ef4444', fontWeight:'bold'}}>{v.ans}</span>
                                {v.photo && <span style={{fontSize:'11px', color:'#2563eb', cursor:'pointer'}} onClick={()=>setModalImage(v.photo)}><i className="fa-solid fa-image"></i> صورة</span>}
                            </div>
                            {v.note && <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>📝 {v.note}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="action-grid">
                      <button className="btn-action-card btn-view" onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}>
                        <i className={`fa-solid ${expandedReport === r.id ? 'fa-chevron-up' : 'fa-eye'}`}></i> التفاصيل
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
                        <div style={{display:'flex', gap:'15px', marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px solid #ddd'}}>
                            {r.verification_photo && (
                              <div style={{textAlign:'center'}}>
                                <img src={r.verification_photo} style={{width:'80px', height:'80px', borderRadius:'50%', border:'3px solid #005a8f', objectFit:'cover'}} alt="verify" />
                                <div style={{fontSize:'10px', marginTop:'5px', fontWeight:'bold'}}>إثبات التواجد</div>
                              </div>
                            )}
                            <div style={{flex:1, fontSize:'13px'}}>
                               <div style={{marginBottom:'5px'}}><b>الاستشاري:</b> {r.consultant || '-'}</div>
                               <div style={{marginBottom:'5px'}}><b>المستلم:</b> {r.receiver || '-'}</div>
                               <div><b>وصف العمل:</b> {r.work_desc || '-'}</div>
                            </div>
                        </div>

                        <div style={{maxHeight:'300px', overflowY:'auto'}}>
                          {fullQuestionsList.map((q, i) => {
                            const answerObj = r.answers ? r.answers[i+1] : null;
                            const ans = answerObj ? (answerObj.val || answerObj) : "N/A";
                            const isViolation = r.violations?.some(v => v.q === q);
                            const displayAns = isViolation ? "لا" : (ans === "N/A" && !isViolation ? "نعم" : ans);
                            
                            return (
                              <div className="q-row" key={i}>
                                <div style={{flex:1, paddingLeft:'10px'}}>{q}</div>
                                <div style={{
                                    fontWeight:'bold', 
                                    color: displayAns==='نعم'?'#16a34a': displayAns==='لا'?'#dc2626':'#64748b',
                                    background: displayAns==='نعم'?'#dcfce7': displayAns==='لا'?'#fee2e2':'#f1f5f9',
                                    padding: '2px 8px', borderRadius:'4px', fontSize:'11px'
                                }}>
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
            <div className="add-inspector-box">
              <h3 style={{ color: 'var(--main-blue)', marginBottom: '15px' }}><i className="fa-solid fa-user-plus"></i> إضافة مفتش جديد</h3>
              <div className="input-row">
                <input 
                  className="form-input" 
                  placeholder="اسم المفتش (User ID)" 
                  value={newInspectorName}
                  onChange={(e) => setNewInspectorName(e.target.value)}
                />
                <div style={{position:'relative', flex:1}}>
                  <input 
                    type={showPassword['new'] ? "text" : "password"} 
                    className="form-input" 
                    placeholder="كلمة المرور" 
                    style={{width:'100%'}}
                    value={newInspectorPass}
                    onChange={(e) => setNewInspectorPass(e.target.value)}
                  />
                  <i 
                    className={`fa-regular ${showPassword['new'] ? "fa-eye-slash" : "fa-eye"}`} 
                    style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#94a3b8'}} 
                    onClick={() => togglePassVisibility('new')}
                  ></i>
                </div>
              </div>
              <button className="btn-add" onClick={addInspector}>حفظ البيانات</button>
            </div>

            <div style={{background:'white', padding:'20px', borderRadius:'16px'}}>
              <h3 style={{ color: 'var(--main-blue)', marginBottom: '15px' }}>👥 فريق المفتشين الحالي</h3>
              {inspectorsList.map((insp) => (
                <div className="inspector-card" key={insp.id}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'40px', height:'40px', background:'#e0f2fe', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#0284c7'}}>
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div>
                        <div style={{fontWeight:'bold'}}>{insp.username}</div>
                        <div style={{fontSize:'11px', color:'#64748b'}}>Safety Inspector</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{background:'#f8fafc', padding:'5px 10px', borderRadius:'6px', display:'flex', alignItems:'center', gap:'5px', border:'1px solid #e2e8f0'}}>
                      <input 
                        type={showPassword[insp.username] ? "text" : "password"} 
                        value={insp.password} 
                        readOnly 
                        style={{ border: 'none', background: 'none', width: '80px', textAlign: 'center', fontSize:'13px', color:'#475569' }} 
                      />
                      <i 
                        className={`fa-regular ${showPassword[insp.username] ? "fa-eye-slash" : "fa-eye"}`} 
                        style={{ cursor: 'pointer', color: '#94a3b8', fontSize:'13px' }} 
                        onClick={() => togglePassVisibility(insp.username)}
                      ></i>
                    </div>
                    <button 
                      onClick={() => deleteInspector(insp.username)} 
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width:'35px', height:'35px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
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
