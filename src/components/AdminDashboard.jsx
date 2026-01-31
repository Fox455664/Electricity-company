import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
// لاحظ إضافة .jsx هنا لحل المشكلة
import { DownloadPDFButton } from './SafetyReportPDF.jsx'

// --- قائمة الأسئلة الموحدة ---
const fullQuestionsList = [
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
    "سلامة المنظم والعدادات", 
    "وجود شعار المقاول على المركبات والمعدات", 
    "خطط متعلقة بتصاريح العمل", 
    "خطة المنع من السقوط",
    "خطة الإنقاذ في العمل على المرتفعات", 
    "خطة رفع الأحمال الحرجة", 
    "ملصقات العمل على مرتفعات اوملصق أغراض متساقطة",
    "صور البطاقات"
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

  // --- Styles Injection ---
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
    }
    body { background-color: var(--bg-color); font-family: 'Cairo', sans-serif; color: var(--text-main); }
    .dashboard-header { background: linear-gradient(to right, #005a8f, #004269); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0, 90, 143, 0.2); position: sticky; top: 0; z-index: 100; color: white; }
    .title-container { font-weight: 800; font-size: 18px; }
    .header-actions { display: flex; gap: 10px; }
    .action-btn { border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; font-family: 'Cairo'; }
    .btn-inspector { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); }
    .btn-logout { background: #fee2e2; color: #b91c1c; }
    .dashboard-container { max-width: 1000px; margin: 20px auto; padding: 0 15px; }
    .tabs-wrapper { background: white; padding: 8px; border-radius: 16px; display: flex; gap: 10px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    .tab-item { flex: 1; padding: 12px; border: none; border-radius: 12px; background: transparent; color: var(--text-light); font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 10px; font-family: 'Cairo'; }
    .tab-item.active { background: var(--main-blue); color: white; box-shadow: 0 4px 12px rgba(0, 90, 143, 0.3); }
    .search-wrapper { position: relative; margin-bottom: 25px; }
    .search-input { width: 100%; padding: 16px 50px 16px 20px; border: 1px solid #e2e8f0; border-radius: 16px; font-size: 15px; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.03); font-family: 'Cairo'; transition: 0.3s; box-sizing: border-box; }
    .search-icon { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 18px; }
    .report-card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; position: relative; overflow: hidden; transition: transform 0.2s; border-right: 5px solid; }
    .report-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .report-card.safe { border-right-color: var(--success); }
    .report-card.violation { border-right-color: var(--danger); }
    .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
    .serial-number { font-size: 18px; font-weight: 800; color: var(--main-blue); display: flex; align-items: center; gap: 10px; }
    .status-badge { padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }
    .status-safe { background: #dcfce7; color: #166534; }
    .status-danger { background: #fee2e2; color: #991b1b; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 12px; color: var(--text-light); margin-bottom: 4px; font-weight: 600; }
    .info-value { font-size: 14px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; }
    .action-grid { display: flex; gap: 10px; margin-top: 20px; }
    .btn-action-card { flex: 1; padding: 12px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Cairo'; font-size: 14px; }
    .btn-view { background: #eff6ff; color: var(--main-blue); }
    .btn-pdf { background: var(--main-blue); color: white; }
    .btn-delete { background: white; border: 1px solid #fee2e2; color: #dc2626; }
    .inspector-card { background: white; padding: 15px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
    .add-inspector-box { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; }
    .input-row { display: flex; gap: 15px; margin-bottom: 15px; }
    .form-input { flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-family: 'Cairo'; background: #f8fafc; }
    .btn-add { width: 100%; padding: 12px; background: var(--success); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-family: 'Cairo'; }
    #imgModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    #imgModal img { max-width: 95%; max-height: 80vh; border-radius: 8px; }
    .close-modal { position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer; }
    .details-panel { background: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 15px; border: 1px solid #e2e8f0; }
    .q-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    @media (max-width: 768px) {
      .header-actions span { display: none; }
      .info-grid { grid-template-columns: 1fr; }
      .input-row { flex-direction: column; }
    }
  `;

  // --- Logic Setup ---
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

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setReports(data || [])
    } catch (err) { alert('خطأ: ' + err.message) } finally { setLoading(false) }
  }

  const fetchInspectors = async () => {
    try {
      const { data } = await supabase.from('users').select('*').neq('role', 'admin')
      setInspectorsList(data || [])
    } catch (err) { console.error(err) }
  }

  const addInspector = async () => {
    if (!newInspectorName || !newInspectorPass) return alert('أكمل البيانات')
    try {
      await supabase.from('users').insert([{ username: newInspectorName, password: newInspectorPass, role: 'inspector' }])
      alert('تمت الإضافة بنجاح'); setNewInspectorName(''); setNewInspectorPass(''); fetchInspectors()
    } catch (err) { alert('خطأ في الإضافة') }
  }

  const deleteInspector = async (username) => {
    if (!window.confirm('هل أنت متأكد؟')) return
    await supabase.from('users').delete().eq('username', username)
    fetchInspectors()
  }

  const deleteReport = async (id) => {
    if (!window.confirm('حذف التقرير؟')) return
    await supabase.from('reports').delete().eq('id', id)
    setReports(reports.filter(r => r.id !== id))
  }

  const togglePassVisibility = (username) => {
    setShowPassword(prev => ({ ...prev, [username]: !prev[username] }))
  }

  // --- Filtering ---
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
        <div className="title-container">
            مجموعة السلامة ادارة ضواحي الرياض
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
            <div className="search-wrapper">
              <input type="text" className="search-input" placeholder="🔍 بحث برقم التقرير، المفتش، اسم المقاول..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                        <div className="serial-number"><i className="fa-solid fa-hashtag"></i> {r.serial}</div>
                        <div style={{fontSize:'12px', color:'#94a3b8', marginTop:'5px'}}><i className="fa-regular fa-clock"></i> {r.timestamp}</div>
                      </div>
                      <div className={`status-badge ${hasViolations ? 'status-danger' : 'status-safe'}`}>
                         {hasViolations ? `${r.violations.length} ملاحظات` : 'سليم ✅'}
                      </div>
                    </div>

                    <div className="info-grid">
                      <div className="info-item"><span className="info-label">المفتش</span><span className="info-value"><i className="fa-solid fa-user-shield" style={{color:'#005a8f'}}></i> {r.inspector}</span></div>
                      <div className="info-item"><span className="info-label">المقاول</span><span className="info-value"><i className="fa-solid fa-hard-hat" style={{color:'#f59e0b'}}></i> {r.contractor}</span></div>
                      <div className="info-item"><span className="info-label">فريق الزيارة</span><span className="info-value">{r.visit_team || '-'}</span></div>
                      <div className="info-item"><span className="info-label">الموقع</span><span className="info-value">
                           {r.google_maps_link ? 
                             <a href={r.google_maps_link} target="_blank" rel="noreferrer" style={{color:'#2563eb', textDecoration:'none', display:'flex', alignItems:'center', gap:'5px'}}>
                               <i className="fa-solid fa-location-dot"></i> {r.location || 'الخريطة'}
                             </a> 
                             : <span style={{color:'red'}}>غير محدد</span>}
                        </span>
                      </div>
                    </div>

                    <div className="action-grid">
                      <button className="btn-action-card btn-view" onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}>
                        <i className={`fa-solid ${expandedReport === r.id ? 'fa-chevron-up' : 'fa-eye'}`}></i> التفاصيل
                      </button>
                      <DownloadPDFButton reportData={r} fullQuestionsList={fullQuestionsList} />
                      <button className="btn-action-card btn-delete" onClick={() => deleteReport(r.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>

                    {expandedReport === r.id && (
                      <div className="details-panel">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px solid #ddd', fontSize:'13px'}}>
                             <div><b>الاستشاري:</b> {r.consultant || '-'}</div>
                             <div><b>المستلم:</b> {r.receiver || '-'}</div>
                             <div><b>وصف العمل:</b> {r.work_desc || '-'}</div>
                        </div>
                        <div style={{maxHeight:'300px', overflowY:'auto'}}>
                          {fullQuestionsList.map((q, i) => {
                            const answerObj = r.answers ? r.answers[i+1] : null;
                            const ans = answerObj ? (answerObj.val || answerObj) : "N/A";
                            const isViolation = r.violations?.some(v => v.q === q);
                            const displayAns = isViolation ? "لا" : (ans === "N/A" || ans === "لا ينطبق" ? "لا ينطبق" : ans);
                            return (
                              <div className="q-row" key={i}>
                                <div style={{flex:1, paddingLeft:'10px'}}>{q}</div>
                                <div style={{fontWeight:'bold', color: displayAns==='نعم'?'#16a34a': displayAns==='لا'?'#dc2626':'#64748b', background: displayAns==='نعم'?'#dcfce7': displayAns==='لا'?'#fee2e2':'#f1f5f9', padding: '2px 8px', borderRadius:'4px', fontSize:'11px', whiteSpace:'nowrap'}}>
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
                <input className="form-input" placeholder="اسم المفتش" value={newInspectorName} onChange={(e) => setNewInspectorName(e.target.value)} />
                <div style={{position:'relative', flex:1}}>
                  <input type={showPassword['new'] ? "text" : "password"} className="form-input" placeholder="كلمة المرور" style={{width:'100%'}} value={newInspectorPass} onChange={(e) => setNewInspectorPass(e.target.value)} />
                  <i className={`fa-regular ${showPassword['new'] ? "fa-eye-slash" : "fa-eye"}`} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#94a3b8'}} onClick={() => togglePassVisibility('new')}></i>
                </div>
              </div>
              <button className="btn-add" onClick={addInspector}>حفظ البيانات</button>
            </div>

            <div style={{background:'white', padding:'20px', borderRadius:'16px'}}>
              <h3 style={{ color: 'var(--main-blue)', marginBottom: '15px' }}>👥 فريق المفتشين الحالي</h3>
              {inspectorsList.map((insp) => (
                <div className="inspector-card" key={insp.id}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'40px', height:'40px', background:'#e0f2fe', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#0284c7'}}><i className="fa-solid fa-user"></i></div>
                    <div><div style={{fontWeight:'bold'}}>{insp.username}</div><div style={{fontSize:'11px', color:'#64748b'}}>Safety Inspector</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{background:'#f8fafc', padding:'5px 10px', borderRadius:'6px', display:'flex', alignItems:'center', gap:'5px', border:'1px solid #e2e8f0'}}>
                      <input type={showPassword[insp.username] ? "text" : "password"} value={insp.password} readOnly style={{ border: 'none', background: 'none', width: '80px', textAlign: 'center', fontSize:'13px', color:'#475569' }} />
                      <i className={`fa-regular ${showPassword[insp.username] ? "fa-eye-slash" : "fa-eye"}`} style={{ cursor: 'pointer', color: '#94a3b8', fontSize:'13px' }} onClick={() => togglePassVisibility(insp.username)}></i>
                    </div>
                    <button onClick={() => deleteInspector(insp.username)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width:'35px', height:'35px', borderRadius: '8px', cursor: 'pointer' }}><i className="fa-solid fa-trash-can"></i></button>
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
