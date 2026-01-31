import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'

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
  const [reports, setReports] = useState([])
  const [inspectors, setInspectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('reports')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  // --- Styles ---
  const styles = `
    body { background: #f4f7fa; font-family: 'Cairo', sans-serif; direction: rtl; margin: 0; }
    .nav { background: #005a8f; color: white; padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .container { max-width: 1100px; margin: 20px auto; padding: 0 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; text-align: center; border-bottom: 4px solid #005a8f; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .stat-card h3 { margin: 10px 0 0; color: #005a8f; font-size: 28px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; background: #ddd; padding: 5px; border-radius: 8px; }
    .tab { flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; background: none; color: #555; }
    .tab.active { background: white; color: #005a8f; }
    .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-right: 6px solid #ccc; position: relative; }
    .card.danger { border-right-color: #ef4444; }
    .card.success { border-right-color: #10b981; }
    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; font-size: 14px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
    .btn { padding: 8px 15px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Cairo'; font-weight: bold; display: flex; align-items: center; gap: 5px; font-size: 13px; transition: 0.2s; }
    .btn-print { background: #005a8f; color: white; }
    .btn-whatsapp { background: #25d366; color: white; }
    .btn-excel { background: #1d6f42; color: white; }
    .btn-delete { background: #fee2e2; color: #dc2626; }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    @media print { .no-print { display: none !important; } }
  `;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: reps } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    const { data: insps } = await supabase.from('users').select('*').neq('role', 'admin');
    setReports(reps || []);
    setInspectors(insps || []);
    setLoading(false);
  };

  const deleteReport = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف التقرير؟')) {
      await supabase.from('reports').delete().eq('id', id);
      fetchData();
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reports.map(r => ({
      "رقم التقرير": r.serial, "المقاول": r.contractor, "المفتش": r.inspector, "الموقع": r.location, "المخالفات": r.violations?.length || 0, "التاريخ": r.timestamp
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SafetyReports");
    XLSX.writeFile(wb, `Reports_${new Date().toLocaleDateString()}.xlsx`);
  };

  // --- ميزة الطباعة الاحترافية (بديلة للـ PDF) ---
  const handlePrint = (r) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html dir="rtl">
      <head>
        <title>تقرير ${r.serial}</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 30px; }
          .h { text-align: center; border-bottom: 3px solid #005a8f; margin-bottom: 20px; }
          .g { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f0f0f0; padding: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: right; font-size: 12px; }
          th { background: #005a8f; color: white; }
        </style>
      </head>
      <body>
        <div class="h"><h1>تقرير السلامة الميداني</h1><p>إدارة ضواحي الرياض</p></div>
        <div class="g">
          <div><b>رقم التقرير:</b> ${r.serial}</div>
          <div><b>التاريخ:</b> ${r.timestamp}</div>
          <div><b>المفتش:</b> ${r.inspector}</div>
          <div><b>المقاول:</b> ${r.contractor}</div>
          <div><b>الموقع:</b> ${r.location || '-'}</div>
          <div><b>فريق العمل:</b> ${r.visit_team || '-'}</div>
          <div><b>الاستشاري:</b> ${r.consultant || '-'}</div>
          <div><b>وصف العمل:</b> ${r.work_desc || '-'}</div>
          <div><b>المستلم:</b> ${r.receiver || '-'}</div>
        </div>
        <table>
          <thead><tr><th>بند الفحص</th><th>الحالة</th></tr></thead>
          <tbody>
            ${fullQuestionsList.map((q, i) => {
              const isViol = r.violations?.some(v => v.q === q);
              return `<tr><td>${q}</td><td>${isViol ? '❌ غير مطابق' : '✅ مطابق'}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const shareWhatsApp = (r) => {
    const msg = `*تقرير سلامة جديد*%0A------------------%0A*الرقم:* ${r.serial}%0A*المقاول:* ${r.contractor}%0A*المفتش:* ${r.inspector}%0A*الحالة:* ${r.violations?.length > 0 ? '❌ مخالفات' : '✅ سليم'}%0A*الموقع:* ${r.location || 'غير محدد'}`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <>
      <style>{styles}</style>
      
      <div className="nav no-print">
        <div style={{fontWeight:'bold', fontSize:'18px'}}>🛡️ لوحة تحكم السلامة</div>
        <div style={{display:'flex', gap:'10px'}}>
           <button className="btn btn-excel" onClick={exportExcel}>💾 تصدير إكسل</button>
           <button className="btn" style={{background:'#eee'}} onClick={() => {sessionStorage.clear(); navigate('/')}}>خروج</button>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <div className="stats no-print">
          <div className="stat-card"><span>الإجمالي</span><h3>{reports.length}</h3></div>
          <div className="stat-card" style={{borderColor:'#10b981'}}><span>سليم</span><h3>{reports.filter(r => !r.violations?.length).length}</h3></div>
          <div className="stat-card" style={{borderColor:'#ef4444'}}><span>مخالفات</span><h3>{reports.filter(r => r.violations?.length > 0).length}</h3></div>
        </div>

        {/* Tabs */}
        <div className="tabs no-print">
          <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>📝 التقارير</button>
          <button className={`tab ${activeTab === 'inspectors' ? 'active' : ''}`} onClick={() => setActiveTab('inspectors')}>👥 المفتشين</button>
        </div>

        {activeTab === 'reports' ? (
          <>
            <input 
              className="no-print"
              type="text" 
              placeholder="🔍 بحث باسم المقاول أو المفتش..." 
              style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #ccc', marginBottom:'15px', boxSizing:'border-box'}}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {loading ? <p>جاري التحميل...</p> : 
             reports.filter(r => r.contractor?.includes(searchTerm) || r.inspector?.includes(searchTerm)).map(r => (
               <div key={r.id} className={`card ${r.violations?.length > 0 ? 'danger' : 'success'}`}>
                 <div style={{display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <b style={{color:'#005a8f', fontSize:'18px'}}>#{r.serial}</b>
                      <div style={{fontSize:'12px', color:'#777'}}>{r.timestamp}</div>
                    </div>
                    <div style={{display:'flex', gap:'5px'}} className="no-print">
                      <button className="btn btn-print" onClick={() => handlePrint(r)}>🖨️ طباعة</button>
                      <button className="btn btn-whatsapp" onClick={() => shareWhatsApp(r)}>📱 واتساب</button>
                      <button className="btn btn-delete" onClick={() => deleteReport(r.id)}>🗑️</button>
                    </div>
                 </div>

                 <div className="grid-info">
                   <div><b>المقاول:</b> {r.contractor}</div>
                   <div><b>المفتش:</b> {r.inspector}</div>
                   <div><b>الموقع:</b> {r.location || '-'}</div>
                   <div><b>المستلم:</b> {r.receiver || '-'}</div>
                 </div>

                 <button 
                  className="no-print"
                  style={{width:'100%', padding:'8px', border:'1px solid #ddd', background:'#fff', cursor:'pointer', borderRadius:'5px'}}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                 >
                   {expandedId === r.id ? '🔼 إخفاء التفاصيل' : '🔽 عرض كل البيانات والأسئلة'}
                 </button>

                 {expandedId === r.id && (
                   <div style={{marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'15px'}}>
                      <div className="grid-info" style={{background:'#fff', border:'1px solid #eee'}}>
                        <div><b>فريق الزيارة:</b> {r.visit_team || '-'}</div>
                        <div><b>الاستشاري:</b> {r.consultant || '-'}</div>
                        <div><b>وصف العمل:</b> {r.work_desc || '-'}</div>
                        <div><b>رقم المقايسة:</b> {r.serial || '-'}</div>
                      </div>
                      <table style={{width:'100%', marginTop:'10px', fontSize:'12px', borderCollapse:'collapse'}}>
                        <thead><tr style={{background:'#f4f4f4'}}><th>البند</th><th style={{width:'60px'}}>الحالة</th></tr></thead>
                        <tbody>
                          {fullQuestionsList.map((q, i) => {
                            const isViol = r.violations?.some(v => v.q === q);
                            return (
                              <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:'5px'}}>{q}</td>
                                <td style={{color: isViol ? 'red' : 'green', fontWeight:'bold', textAlign:'center'}}>
                                  {isViol ? '❌' : '✅'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                   </div>
                 )}
               </div>
             ))
            }
          </>
        ) : (
          <div className="card">
            <h3>إدارة المفتشين</h3>
            {inspectors.map(insp => (
              <div key={insp.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}>
                <span>👤 {insp.username}</span>
                <span style={{color:'#777'}}>كلمة المرور: {insp.password}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default AdminDashboard
