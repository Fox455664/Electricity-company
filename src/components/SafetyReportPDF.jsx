import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

export const DownloadPDFButton = ({ reportData, fullQuestionsList }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // تنسيق التاريخ والوقت
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const generatePDF = () => {
    setIsGenerating(true);

    // 1. تحديد العنصر المراد طباعته (الموجود مخفياً في الأسفل)
    const element = document.getElementById(`report-content-${reportData.id}`);

    // 2. إعدادات المكتبة لضمان دقة عالية وعدم قص النصوص
    const opt = {
      margin:       [10, 10, 10, 10], // هوامش الصفحة (ملم)
      filename:     `تقرير_سلامة_${reportData.serial || 'new'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, // دقة مضاعفة للنصوص الواضحة
        useCORS: true, // للسماح بتحميل الصور الخارجية
        scrollY: 0,
        logging: false
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } // منع قص العناصر
    };

    // 3. التنفيذ
    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
    }).catch(err => {
      console.error(err);
      alert("حدث خطأ أثناء إنشاء الملف");
      setIsGenerating(false);
    });
  };

  // --- دوال مساعدة للعرض ---
  const getAnswer = (index) => {
    if (!reportData.answers) return "N/A";
    const key = (index + 1).toString();
    const ans = reportData.answers[key];
    return typeof ans === 'object' ? ans.val : ans;
  };

  // استخراج الصور من الملاحظات أو حقل الصور العام
  const allImages = [
    ...(reportData.images || []),
    ...(reportData.violations?.map(v => v.img).filter(Boolean) || [])
  ];

  return (
    <>
      {/* زر التحميل الظاهر في لوحة التحكم */}
      <button 
        onClick={generatePDF} 
        className="btn-action-card btn-pdf" 
        disabled={isGenerating}
        style={{ background: isGenerating ? '#94a3b8' : 'var(--main-blue)', color: 'white' }}
      >
        {isGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
        <span>{isGenerating ? 'جاري التحضير...' : 'PDF'}</span>
      </button>

      {/* --- قالب التقرير المخفي (يظهر فقط أثناء التولدير داخلياً) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id={`report-content-${reportData.id}`} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '15mm', fontFamily: 'Cairo, sans-serif', direction: 'rtl', color: '#333' }}>
          
          {/* Header */}
          <div style={{ borderBottom: '3px solid #005a8f', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, color: '#005a8f', fontSize: '24px', fontWeight: '800' }}>تقرير الفحص الميداني للسلامة</h1>
              <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>إدارة ضواحي الرياض - قسم السلامة</p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>رقم التقرير</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>#{reportData.serial}</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>{formatDate(reportData.created_at)}</div>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <InfoRow label="المفتش" value={reportData.inspector} icon="👤" />
            <InfoRow label="المقاول" value={reportData.contractor} icon="🏗️" />
            <InfoRow label="الموقع" value={reportData.location} icon="📍" />
            <InfoRow label="فريق الزيارة" value={reportData.visit_team || '-'} icon="👥" />
            <InfoRow label="الاستشاري" value={reportData.consultant || '-'} icon="👔" />
            <InfoRow label="وصف العمل" value={reportData.work_desc || '-'} icon="📝" />
            <InfoRow label="المستلم" value={reportData.receiver || '-'} icon="📥" />
          </div>

          {/* Violations Summary (If any) */}
          {reportData.violations && reportData.violations.length > 0 && (
            <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
              <h3 style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 15px', borderRadius: '8px 8px 0 0', margin: 0, border: '1px solid #fecaca' }}>
                ⚠️ المخالفات المرصودة ({reportData.violations.length})
              </h3>
              <div style={{ border: '1px solid #fecaca', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '15px' }}>
                {reportData.violations.map((v, idx) => (
                  <div key={idx} style={{ marginBottom: '10px', borderBottom: '1px dashed #fecaca', paddingBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{idx + 1}. {v.q}</div>
                    {v.notes && <div style={{ fontSize: '13px', color: '#b91c1c', marginTop: '4px' }}>ملاحظة: {v.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Checklist Table */}
          <h3 style={{ color: '#005a8f', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>📋 قائمة التحقق التفصيلية</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '30px' }}>
            <thead>
              <tr style={{ background: '#005a8f', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'right', borderRadius: '0 8px 0 0' }}>#</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>السؤال / البند</th>
                <th style={{ padding: '10px', textAlign: 'center', borderRadius: '8px 0 0 0' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {fullQuestionsList.map((q, i) => {
                const answer = getAnswer(i);
                // تحديد اللون بناءً على الإجابة
                let bg = '#fff';
                let color = '#333';
                let icon = '';
                
                if (answer === 'نعم') { bg = '#dcfce7'; color = '#166534'; icon = '✅'; }
                else if (answer === 'لا') { bg = '#fee2e2'; color = '#991b1b'; icon = '❌'; }
                else { bg = '#f1f5f9'; color = '#64748b'; icon = '➖'; }

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', width: '30px', fontWeight: 'bold', color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ padding: '8px' }}>{q}</td>
                    <td style={{ padding: '8px', textAlign: 'center', width: '80px' }}>
                      <span style={{ background: bg, color: color, padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', display: 'inline-block', minWidth: '60px' }}>
                         {answer}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Photos Section */}
          {allImages.length > 0 && (
            <div style={{ pageBreakBefore: 'always' }}>
              <h3 style={{ color: '#005a8f', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>📷 الصور المرفقة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {allImages.map((img, idx) => (
                  <div key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', background: 'white' }}>
                    <img 
                      src={img} 
                      alt={`Evidence ${idx}`} 
                      style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '6px' }} 
                    />
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>صورة مرفقة #{idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
            <div>تم إنشاء هذا التقرير آلياً عبر نظام السلامة</div>
            <div>صفحة رقم <span className="pageNumber"></span></div>
          </div>

        </div>
      </div>
    </>
  );
};

// مكون مساعد لصفوف المعلومات
const InfoRow = ({ label, value, icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span>{icon}</span> {value}
    </span>
  </div>
);

export default DownloadPDFButton;
