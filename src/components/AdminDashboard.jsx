import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { supabase } from '../supabaseClient'

// القائمة الكاملة الموحدة (41 بنداً)
const fullQuestionsList = [
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

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [inspectorsList, setInspectorsList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('reports')
  const [loading, setLoading] = useState(true)
  const [expandedReport, setExpandedReport] = useState(null)
  const [modalImage, setModalImage] = useState(null)

  // بيانات إضافة مفتش جديد
  const [newInspectorName, setNewInspectorName] = useState('')
  const [newInspectorPass, setNewInspectorPass] = useState('')
  const [showPassword, setShowPassword] = useState({})

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user'))
    if (!user || user.role !== 'admin') navigate('/')
    else {
      fetchReports()
      fetchInspectors()
    }
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  const fetchInspectors = async () => {
    const { data } = await supabase.from('users').select('*').neq('role', 'admin')
    setInspectorsList(data || [])
  }

  const deleteReport = async (id) => {
    if (window.confirm('حذف هذا التقرير نهائياً؟')) {
      await supabase.from('reports').delete().eq('id', id)
      fetchReports()
    }
  }

  // --- دالة توليد الـ PDF المحدثة والمطورة ---
  const generatePDF = (r) => {
    const container = document.createElement('div')
    
    // 1. إعداد جدول البنود الكامل (41 بنداً)
    let tableRows = ''
    fullQuestionsList.forEach((q, i) => {
      let ans = "نعم"; let color = "#16a34a"
      const violation = r.violations?.find(v => v.q === q)
      if (violation) { ans = "لا"; color = "#dc2626" }
      else if (r.answers && r.answers[i+1]) {
          const val = r.answers[i+1].val || r.answers[i+1]
          ans = (val === 'N/A' || val === 'لا ينطبق') ? 'لا ينطبق' : val
          if(ans === 'لا') color = "#dc2626"
          if(ans === 'لا ينطبق') color = "#666"
      }
      tableRows += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:6px; font-size:10px; width:30px;">${i+1}</td>
          <td style="padding:6px; font-size:10px; text-align:right;">${q}</td>
          <td style="padding:6px; font-size:10px; color:${color}; font-weight:bold; width:70px;">${ans}</td>
        </tr>`
    })

    // 2. إعداد قسم الملاحظات والصور الميدانية
    let photosSection = ''
    if (r.violations && r.violations.length > 0) {
      let vCards = ''
      r.violations.forEach(v => {
        let imgs = ''
        if (v.photos) {
          v.photos.forEach(pic => {
            imgs += `<img src="${pic}" style="width:140px; height:140px; margin:5px; border-radius:8px; object-fit:cover; border:1px solid #ddd;">`
          })
        }
        vCards += `
          <div style="margin-bottom:15px; page-break-inside: avoid; border-bottom:1px dashed #eee; padding-bottom:10px;">
            <div style="color:#b91c1c; font-weight:bold; font-size:12px;">📍 ${v.q}</div>
            <div style="font-size:11px; margin:5px 0;"><b>الوصف:</b> ${v.note || 'لا توجد ملاحظات مكتوبة'}</div>
            <div>${imgs}</div>
          </div>`
      })
      photosSection = `
        <div style="margin-top:20px;">
          <h4 style="background:#fee2e2; color:#b91c1c; padding:10px; border-right:5px solid #b91c1c; margin-bottom:15px;">📸 الصور والملاحظات الميدانية</h4>
          ${vCards}
        </div>`
    }

    // 3. بناء التصميم الكامل (بيانات -> صور -> جدول)
    const content = `
      <div style="font-family:'Cairo',sans-serif; padding:30px; direction:rtl; color:#333;">
        <div style="border-bottom:4px solid #f28b00; padding-bottom:15px; margin-bottom:25px; text-align:center;">
            <h2 style="color:#005a8f; margin:0; font-size:22px;">مجموعة السلامة ادارة ضواحي الرياض</h2>
            <p style="margin:5px 0; color:#666;">تقرير تفتيش سلامة ميداني</p>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:12px; margin-bottom:20px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
             <div><b>رقم التقرير:</b> <span style="color:#005a8f; font-weight:bold;">#${r.serial}</span></div>
             <div><b>تاريخ التفتيش:</b> ${r.timestamp}</div>
             <div><b>المفتش المسئول:</b> ${r.inspector}</div>
             <div><b>المقاول المنفذ:</b> ${r.contractor}</div>
             <div><b>الاستشاري:</b> ${r.consultant || '-'}</div>
             <div><b>الموقع / الحي:</b> ${r.location || '-'}</div>
             <div><b>رقم أمر العمل:</b> <span style="font-weight:bold; color:#000; border-bottom:1px solid #000;">${r.order_number || '-'}</span></div>
             <div><b>اسم المستلم:</b> ${r.receiver || '-'}</div>
             <div style="grid-column: span 2;"><b>وصف العمل:</b> ${r.work_desc || '-'}</div>
             <div style="grid-column: span 2;"><b>فريق الزيارة:</b> ${r.visit_team || '-'}</div>
             <div style="grid-column: span 2;"><b>الموقع الجغرافي:</b> <a href="${r.google_maps_link}" style="color:#005a8f;">رابط الخريطة GPS</a></div>
        </div>

        <!-- أولاً: الصور والملاحظات -->
        ${photosSection}

        <!-- ثانياً: الجدول الكامل لكافة البنود -->
        <div style="margin-top:25px;">
          <h4 style="background:#005a8f; color:white; padding:10px; border-radius:5px 5px 0 0;">📋 قائمة التحقق الكاملة (Checklist)</h4>
          <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:8px; border:1px solid #ddd; width:30px;">#</th>
                <th style="padding:8px; border:1px solid #ddd; text-align:right;">البند</th>
                <th style="padding:8px; border:1px solid #ddd; width:80px;">الحالة</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>

        <div style="margin-top:50px; display:flex; justify-content:space-between; text-align:center; page-break-inside: avoid;">
            <div style="width:200px; border-top:2px solid #005a8f; padding-top:10px;">
                <b>توقيع المفتش</b><br><small>${r.inspector}</small>
            </div>
            <div style="width:200px; border-top:2px solid #005a8f; padding-top:10px;">
                <b>توقيع المستلم</b><br>
                ${r.signature_image ? `<img src="${r.signature_image}" style="max-height:60px;">` : '<br>---'}
            </div>
        </div>
      </div>
    `

    container.innerHTML = content
    html2pdf().set({
      margin: 10,
      filename: `Report_${r.serial}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container).save()
  }

  // --- الستايلات ---
  const styles = `
    :root { --primary: #005a8f; --bg: #f1f5f9; --danger: #ef4444; --success: #10b981; }
    body { background: var(--bg); font-family: 'Cairo', sans-serif; direction: rtl; }
    .header { background: linear-gradient(to right, #005a8f, #004269); color: white; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; }
    .container { max-width: 1100px; margin: 20px auto; padding: 0 15px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; background: white; padding: 8px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .tab-btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; background: transparent; color: #64748b; font-family: 'Cairo'; }
    .tab-btn.active { background: var(--primary); color: white; }
    
    .report-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0; position: relative; transition: 0.3s; }
    .report-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .card-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
    .status-badge { padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 700; }
    
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 15px; }
    .label { font-size: 11px; color: #94a3b8; display: block; }
    .value { font-size: 13px; font-weight: 700; color: #1e293b; }

    .actions { display: flex; gap: 10px; }
    .btn { padding: 10px 15px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-family: 'Cairo'; font-size: 13px; display: flex; align-items: center; gap: 5px; }
    .btn-pdf { background: var(--primary); color: white; }
    .btn-del { background: #fee2e2; color: #dc2626; }
    
    .search-input { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-family: 'Cairo'; }
    #imgModal { position: fixed; inset:0; background: rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center; cursor:pointer; }
    #imgModal img { max-width: 90%; max-height: 80%; border-radius: 10px; }
  `;

  const filteredReports = reports.filter(r => 
    r.inspector.includes(searchTerm) || r.contractor.includes(searchTerm) || String(r.serial).includes(searchTerm)
  )

  return (
    <>
      <style>{styles}</style>
      
      {modalImage && <div id="imgModal" onClick={() => setModalImage(null)}><img src={modalImage} alt="Preview" /></div>}

      <div className="header">
        <div style={{fontWeight: 800, fontSize: '18px'}}>لوحة تحكم المدير - ضواحي الرياض</div>
        <button className="btn" style={{background:'rgba(255,255,255,0.2)', color:'white'}} onClick={() => {sessionStorage.clear(); navigate('/')}}>خروج</button>
      </div>

      <div className="container">
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>التقارير الميدانية</button>
          <button className={`tab-btn ${activeTab === 'inspectors' ? 'active' : ''}`} onClick={() => setActiveTab('inspectors')}>إدارة المفتشين</button>
        </div>

        {activeTab === 'reports' && (
          <div>
            <input className="search-input" placeholder="🔍 بحث بالاسم أو رقم التقرير..." onChange={e => setSearchTerm(e.target.value)} />
            {filteredReports.map(r => {
              const hasV = r.violations && r.violations.length > 0
              return (
                <div key={r.id} className="report-card" style={{borderRight: hasV ? '5px solid #ef4444' : '5px solid #10b981'}}>
                  <div className="card-header">
                    <div>
                      <div style={{fontWeight: 800, color: '#005a8f'}}>#{r.serial}</div>
                      <div style={{fontSize: '11px', color: '#94a3b8'}}>{r.timestamp}</div>
                    </div>
                    <div className="status-badge" style={{background: hasV ? '#fee2e2':'#dcfce7', color: hasV ? '#dc2626':'#166534'}}>
                      {hasV ? `${r.violations.length} ملاحظات` : 'سليم ✅'}
                    </div>
                  </div>

                  <div className="info-grid">
                    <div><span className="label">المفتش</span><div className="value">{r.inspector}</div></div>
                    <div><span className="label">المقاول</span><div className="value">{r.contractor}</div></div>
                    <div><span className="label">رقم أمر العمل</span><div className="value" style={{color:'red'}}>{r.order_number || '-'}</div></div>
                    <div><span className="label">الموقع</span><div className="value">{r.location || '-'}</div></div>
                  </div>

                  <div className="actions">
                    <button className="btn btn-pdf" onClick={() => generatePDF(r)}><i className="fa-solid fa-file-pdf"></i> تحميل PDF</button>
                    <button className="btn" style={{background:'#f1f5f9'}} onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}>التفاصيل</button>
                    <button className="btn btn-del" onClick={() => deleteReport(r.id)}><i className="fa-solid fa-trash"></i></button>
                  </div>

                  {expandedReport === r.id && (
                    <div style={{marginTop:'20px', padding:'15px', background:'#f8fafc', borderRadius:'10px', fontSize:'13px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>
                            <div><b>الاستشاري:</b> {r.consultant || '-'}</div>
                            <div><b>المستلم:</b> {r.receiver || '-'}</div>
                            <div><b>وصف العمل:</b> {r.work_desc || '-'}</div>
                        </div>
                        {hasV && r.violations.map((v, idx) => (
                           <div key={idx} style={{marginTop:'10px'}}>
                              <div style={{color:'red', fontWeight:'bold'}}>{idx+1}. {v.q}</div>
                              <div style={{fontSize:'12px'}}>{v.note}</div>
                              {v.photos && v.photos.map((p, i) => <img key={i} src={p} style={{width:'50px', height:'50px', margin:'5px', cursor:'pointer'}} onClick={() => setModalImage(p)} />)}
                           </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'inspectors' && (
          <div style={{background:'white', padding:'25px', borderRadius:'16px'}}>
             <h3>إدارة المفتشين</h3>
             <div style={{display:'flex', gap:'10px', margin:'20px 0'}}>
                <input className="search-input" style={{margin:0}} placeholder="اسم المفتش الجديد" onChange={e => setNewInspectorName(e.target.value)} />
                <input className="search-input" style={{margin:0}} placeholder="كلمة المرور" onChange={e => setNewInspectorPass(e.target.value)} />
                <button className="btn btn-pdf" onClick={async () => {
                   await supabase.from('users').insert([{username: newInspectorName, password: newInspectorPass, role: 'inspector'}])
                   fetchInspectors()
                }}>إضافة</button>
             </div>
             {inspectorsList.map(insp => (
                <div key={insp.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}>
                   <div><b>{insp.username}</b> - {insp.password}</div>
                   <button className="btn btn-del" onClick={async () => {
                      if(window.confirm('حذف؟')) {
                         await supabase.from('users').delete().eq('id', insp.id)
                         fetchInspectors()
                      }
                   }}>حذف</button>
                </div>
             ))}
          </div>
        )}
      </div>
    </>
  )
}

export default AdminDashboard
