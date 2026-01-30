import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { supabase } from '../supabaseClient'

// --- القائمة المحدثة (مطابقة تماماً لتطبيق المفتش) ---
const fullQuestionsList = [
    "تصريح العمل الأساسي والثانوي متواجد بموقع العمل", 
    "اجتماع ما قبل البدء بالعمل متواجد بموقع العمل", 
    "نموذج فريق العمل متواجد بموقع العمل (مذكور رقم المقايسة - وصف العمل - رقم التصريح - توقيع مسئول شركة الكهرباء)", 
    "إجراءات العمل الآمن وتقييم المخاطر وتوفرها بلغات مناسبة", 
    "إلمام المستلم وفريق العمل بإإجراءات العمل الآمن وتقييم المخاطر للمهمة", 
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

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('reports')
  const [reports, setReports] = useState([])
  const [inspectorsList, setInspectorsList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedReport, setExpandedReport] = useState(null)
  const [modalImage, setModalImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newInspectorName, setNewInspectorName] = useState('')
  const [newInspectorPass, setNewInspectorPass] = useState('')
  const [showPassword, setShowPassword] = useState({})

  const styles = `
    :root { --main-blue: #005a8f; --main-orange: #f28b00; --bg-color: #f1f5f9; }
    body { background-color: var(--bg-color); font-family: 'Cairo', sans-serif; direction: rtl; margin:0; }
    .dashboard-header { background: linear-gradient(to right, #005a8f, #004269); padding: 20px; display: flex; justify-content: space-between; align-items: center; color: white; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .dashboard-container { max-width: 1100px; margin: 20px auto; padding: 0 15px; }
    .tabs-wrapper { background: white; padding: 8px; border-radius: 16px; display: flex; gap: 10px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .tab-item { flex: 1; padding: 12px; border: none; border-radius: 12px; background: transparent; font-weight: 700; cursor: pointer; font-family: 'Cairo'; transition: 0.3s; }
    .tab-item.active { background: var(--main-blue); color: white; }
    .report-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; border-right: 5px solid #10b981; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .report-card.violation { border-right-color: #ef4444; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 10px; }
    .info-label { font-size: 11px; color: #64748b; display: block; margin-bottom: 4px; }
    .info-value { font-size: 13px; font-weight: 700; color: #1e293b; }
    .violation-box { background: #fff1f2; border: 1px solid #fecaca; border-radius: 10px; padding: 15px; margin-top: 10px; }
    .img-thumb-group { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .thumb-img { width: 65px; height: 65px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 1px solid #ddd; transition: 0.2s; }
    .thumb-img:hover { transform: scale(1.05); }
    .btn-action { padding: 10px 18px; border-radius: 10px; border: none; cursor: pointer; font-family: 'Cairo'; font-weight: bold; display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .btn-pdf { background: var(--main-orange); color: white; }
    .btn-view { background: #e2e8f0; color: #475569; }
    #imgModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; justify-content: center; align-items: center; cursor: pointer; }
    .search-input { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 20px; box-sizing: border-box; font-family: 'Cairo'; }
  `;

  useEffect(() => {
    const userData = sessionStorage.getItem('user')
    if (!userData || JSON.parse(userData).role !== 'admin') navigate('/')
    else { setUser(JSON.parse(userData)); fetchReports(); fetchInspectors(); }
  }, [navigate])

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (!error) setReports(data)
    setLoading(false)
  }

  const fetchInspectors = async () => {
    const { data } = await supabase.from('users').select('*').neq('role', 'admin')
    if (data) setInspectorsList(data)
  }

  const deleteReport = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف التقرير نهائياً؟')) {
      await supabase.from('reports').delete().eq('id', id)
      fetchReports()
    }
  }

  const generatePDF = (r) => {
    const container = document.createElement('div')
    const logoUrl = "/imge.jpg"; // اللوجو هيظهر هنا فقط

    let rows = ''
    fullQuestionsList.forEach((q, i) => {
      const qKey = i + 1
      const ans = r.answers?.[qKey] || 'N/A'
      const color = ans === 'لا' ? '#dc2626' : (ans === 'نعم' ? '#16a34a' : '#64748b')
      rows += `
        <tr style="border-bottom:1px solid #eee; font-size: 10px;">
          <td style="padding:6px; width:30px;">${qKey}</td>
          <td style="padding:6px; text-align:right;">${q}</td>
          <td style="padding:6px; color:${color}; font-weight:bold;">${ans === 'N/A' ? 'لا ينطبق' : ans}</td>
        </tr>`
    })

    let violationsHtml = ''
    if (r.violations && r.violations.length > 0) {
      violationsHtml = '<h3 style="color:#dc2626; border-bottom:2px solid #dc2626; padding-bottom:5px;">الملاحظات والمخالفات المرصودة</h3>'
      r.violations.forEach(v => {
        let imgs = ''
        if (v.photos && v.photos.length > 0) {
          v.photos.forEach(p => {
            imgs += `<img src="${p}" style="width:110px; height:110px; object-fit:cover; margin:5px; border-radius:8px; border:1px solid #eee;">`
          })
        }
        violationsHtml += `
          <div style="margin-bottom:15px; background:#fff5f5; padding:12px; border-radius:8px; border:1px solid #fecaca;">
            <div style="font-weight:bold; font-size:13px; color:#b91c1c;">البند: ${v.q}</div>
            <div style="color:#dc2626; font-size:12px; margin:4px 0;">الحالة: ${v.ans}</div>
            ${v.note ? `<div style="font-size:12px; color:#444;">📝 الملاحظة: ${v.note}</div>` : ''}
            <div style="margin-top:8px;">${imgs}</div>
          </div>`
      })
    }

    container.innerHTML = `
      <div style="direction:rtl; font-family:'Cairo'; padding:25px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #005a8f; padding-bottom:15px; margin-bottom:20px;">
          <div style="text-align:right;">
            <h2 style="margin:0; color:#005a8f; font-size:20px;">تقرير التفتيش الميداني</h2>
            <p style="margin:5px 0; font-weight:bold; color:#475569;">مجموعة السلامة إدارة ضواحي الرياض</p>
          </div>
          <img src="${logoUrl}" style="height:70px;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; font-size:12px; background:#f8fafc; padding:15px; border-radius:10px;">
            <div><b>رقم التقرير:</b> ${r.serial}</div>
            <div><b>التاريخ والوقت:</b> ${r.timestamp}</div>
            <div><b>المفتش المسئول:</b> ${r.inspector}</div>
            <div><b>الشركة المنفذة (المقاول):</b> ${r.contractor}</div>
            <div><b>رقم أمر العمل / المهمة:</b> ${r.work_order_no || '-'}</div>
            <div><b>فريق الزيارة:</b> ${r.visit_team || '-'}</div>
            <div><b>وصف العمل:</b> ${r.work_desc || '-'}</div>
            <div><b>الموقع الجغرافي:</b> ${r.location || '-'}</div>
        </div>

        ${violationsHtml}

        <h3 style="background:#005a8f; color:white; padding:8px 12px; border-radius:6px; font-size:14px;">نتائج قائمة الفحص (Checklist)</h3>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead style="background:#f1f5f9;">
            <tr>
                <th style="padding:8px; text-align:right; font-size:11px; border-bottom:1px solid #ddd;">#</th>
                <th style="padding:8px; text-align:right; font-size:11px; border-bottom:1px solid #ddd;">بند الفحص</th>
                <th style="padding:8px; text-align:right; font-size:11px; border-bottom:1px solid #ddd;">النتيجة</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top:40px; display:flex; justify-content:space-between;">
          <div style="text-align:center; width:200px; border-top:1px solid #ccc; padding-top:10px;">
            <span style="font-size:12px; font-weight:bold;">توقيع المفتش</span><br>
            <span style="font-size:12px;">${r.inspector}</span>
          </div>
          ${r.signature_image ? `
          <div style="text-align:center; width:200px;">
            <span style="font-size:12px; font-weight:bold;">توقيع المستلم</span><br>
            <img src="${r.signature_image}" style="width:140px; margin-top:5px;">
          </div>` : ''}
        </div>
      </div>
    `

    html2pdf().set({ margin:10, filename:`Report_${r.serial}.pdf`, image:{type:'jpeg', quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm', format:'a4', orientation:'portrait'} }).from(container).save()
  }

  const filteredReports = reports.filter(r => 
    r.inspector.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.contractor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.serial).includes(searchTerm)
  )

  return (
    <>
      <style>{styles}</style>
      
      {modalImage && <div id="imgModal" onClick={()=>setModalImage(null)}><img src={modalImage} style={{maxWidth:'90%', maxHeight:'90%', borderRadius:'10px', boxShadow:'0 0 30px rgba(0,0,0,0.5)'}} /></div>}

      <div className="dashboard-header">
        {/* العنوان المطلوب بدون لوجو وبدون كلمة لوحة تحكم */}
        <div style={{fontWeight:'800', fontSize:'20px', letterSpacing:'0.5px'}}>
            مجموعة السلامة إدارة ضواحي الرياض
        </div>
        
        <div style={{display:'flex', gap:'10px'}}>
           <button className="btn-action" style={{background:'rgba(255,255,255,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.4)'}} onClick={()=>navigate('/inspector')}>
             <i className="fa-solid fa-clipboard-check"></i> تطبيق المفتش
           </button>
           <button className="btn-action" style={{background:'#fee2e2', color:'#dc2626'}} onClick={()=>{sessionStorage.clear(); navigate('/')}}>
             <i className="fa-solid fa-power-off"></i> خروج
           </button>
        </div>
      </div>

      <div className="dashboard-container">
        <div className="tabs-wrapper">
          <button className={`tab-item ${activeTab==='reports'?'active':''}`} onClick={()=>setActiveTab('reports')}>التقارير الميدانية</button>
          <button className={`tab-item ${activeTab==='inspectors'?'active':''}`} onClick={()=>setActiveTab('inspectors')}>إدارة المفتشين</button>
        </div>

        {activeTab === 'reports' ? (
          <>
            <input type="text" className="search-input" placeholder="🔍 بحث برقم التقرير، اسم المفتش، أو شركة المقاولات..." onChange={(e)=>setSearchTerm(e.target.value)} />
            
            {loading ? <p style={{textAlign:'center', padding:'20px'}}>جاري تحميل التقارير...</p> : filteredReports.map(r => (
              <div key={r.id} className={`report-card ${r.violations?.length > 0 ? 'violation' : ''}`}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f5f9', paddingBottom:'12px'}}>
                  <div style={{fontWeight:'800', color:'#005a8f', fontSize:'16px'}}>رقم التقرير: {r.serial}</div>
                  <div style={{fontSize:'12px', color:'#94a3b8'}}><i className="fa-regular fa-clock"></i> {r.timestamp}</div>
                </div>

                <div className="info-grid">
                  <div><span className="info-label">اسم المفتش</span><span className="info-value">{r.inspector}</span></div>
                  <div><span className="info-label">اسم المقاول</span><span className="info-value">{r.contractor}</span></div>
                  <div><span className="info-label">رقم أمر العمل</span><span className="info-value">{r.work_order_no || '-'}</span></div>
                  <div><span className="info-label">الموقع الجغرافي</span><a href={r.google_maps_link} target="_blank" rel="noreferrer" style={{fontSize:'11px', color:'#2563eb', fontWeight:'bold', textDecoration:'none'}}>عرض على الخريطة 📍</a></div>
                </div>

                {r.violations?.length > 0 && (
                  <div className="violation-box">
                    <div style={{fontWeight:'bold', color:'#dc2626', marginBottom:'12px', fontSize:'14px'}}>
                       <i className="fa-solid fa-triangle-exclamation"></i> الملاحظات والمخالفات ({r.violations.length})
                    </div>
                    {r.violations.map((v, idx) => (
                      <div key={idx} style={{marginBottom:'12px', borderBottom:'1px solid #fecaca', paddingBottom:'10px'}}>
                        <div style={{fontSize:'13px', fontWeight:'600'}}>• {v.q}</div>
                        <div className="img-thumb-group">
                          {v.photos?.map((p, pIdx) => (
                            <img key={pIdx} src={p} className="thumb-img" onClick={()=>setModalImage(p)} alt="violation" />
                          ))}
                        </div>
                        {v.note && <div style={{fontSize:'12px', color:'#475569', marginTop:'5px', background:'white', padding:'5px', borderRadius:'4px'}}>📝 {v.note}</div>}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{display:'flex', gap:'10px', marginTop:'18px'}}>
                  <button className="btn-action btn-view" onClick={()=>setExpandedReport(expandedReport === r.id ? null : r.id)}>
                    <i className={`fa-solid ${expandedReport === r.id ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    {expandedReport === r.id ? 'إخفاء الفحص الكامل' : 'عرض الفحص الكامل'}
                  </button>
                  <button className="btn-action btn-pdf" onClick={()=>generatePDF(r)}>
                    <i className="fa-solid fa-file-pdf"></i> تحميل PDF
                  </button>
                  <button className="btn-action" style={{background:'#fee2e2', color:'#dc2626', marginRight:'auto'}} onClick={()=>deleteReport(r.id)}>
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>

                {expandedReport === r.id && (
                  <div style={{marginTop:'15px', background:'#f8fafc', padding:'20px', borderRadius:'12px', border:'1px solid #e2e8f0', maxHeight:'400px', overflowY:'auto'}}>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'20px', fontSize:'13px', borderBottom:'2px solid #e2e8f0', paddingBottom:'15px'}}>
                       <div><b style={{color:'#64748b'}}>فريق الزيارة:</b> <span style={{fontWeight:'bold'}}>{r.visit_team || '-'}</span></div>
                       <div><b style={{color:'#64748b'}}>وصف العمل:</b> <span style={{fontWeight:'bold'}}>{r.work_desc || '-'}</span></div>
                       <div><b style={{color:'#64748b'}}>اسم الاستشاري:</b> <span style={{fontWeight:'bold'}}>{r.consultant || '-'}</span></div>
                       <div><b style={{color:'#64748b'}}>المستلم:</b> <span style={{fontWeight:'bold'}}>{r.receiver || '-'}</span></div>
                    </div>
                    {fullQuestionsList.map((q, i) => {
                      const ans = r.answers?.[i+1] || 'N/A'
                      return (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:'12px'}}>
                          <span style={{color:'#475569'}}>{i+1}. {q}</span>
                          <span style={{fontWeight:'bold', color: ans==='نعم'?'#10b981':ans==='لا'?'#ef4444':'#94a3b8', background: ans==='نعم'?'#ecfdf5':ans==='لا'?'#fef2f2':'#f8fafc', padding:'2px 8px', borderRadius:'4px'}}>
                             {ans === 'N/A' ? 'لا ينطبق' : ans}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          /* إدارة المفتشين */
          <div style={{background:'white', padding:'25px', borderRadius:'16px', boxShadow:'0 4px 15px rgba(0,0,0,0.05)'}}>
             <h3 style={{marginTop:0, color:'#1e293b', borderBottom:'2px solid #f1f5f9', paddingBottom:'10px'}}>
               <i className="fa-solid fa-user-plus"></i> إضافة مفتش جديد للنظام
             </h3>
             <div style={{display:'flex', gap:'10px', marginBottom:'30px', marginTop:'20px'}}>
               <input className="search-input" style={{margin:0, flex:1}} placeholder="اسم المفتش (Username)" value={newInspectorName} onChange={(e)=>setNewInspectorName(e.target.value)} />
               <input className="search-input" style={{margin:0, flex:1}} placeholder="كلمة المرور" value={newInspectorPass} onChange={(e)=>setNewInspectorPass(e.target.value)} />
               <button className="btn-action btn-pdf" style={{padding:'0 30px'}} onClick={async()=>{
                 if(!newInspectorName || !newInspectorPass) return alert('برجاء ملء جميع الحقول');
                 const {error} = await supabase.from('users').insert([{username:newInspectorName, password:newInspectorPass, role:'inspector'}])
                 if(!error) { setNewInspectorName(''); setNewInspectorPass(''); fetchInspectors(); alert('تمت الإضافة بنجاح'); }
               }}>حفظ المفتش</button>
             </div>
             
             <h3 style={{color:'#1e293b', borderBottom:'2px solid #f1f5f9', paddingBottom:'10px'}}>👥 قائمة المفتشين المسجلين</h3>
             {inspectorsList.map(insp => (
               <div key={insp.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px', borderBottom:'1px solid #f1f5f9'}}>
                 <div style={{fontWeight:'bold', color:'#005a8f'}}>{insp.username}</div>
                 <div style={{color:'#64748b', fontSize:'14px'}}>كلمة المرور: <b>{insp.password}</b></div>
                 <button style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'18px'}} onClick={async()=>{ if(window.confirm(`هل تريد حذف المفتش ${insp.username}؟`)){await supabase.from('users').delete().eq('id', insp.id); fetchInspectors();} }}>
                    <i className="fa-solid fa-trash-can"></i>
                 </button>
               </div>
             ))}
          </div>
        )}
      </div>
    </>
  )
}

export default AdminDashboard
