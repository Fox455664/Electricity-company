import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { supabase } from '../supabaseClient'

// قائمة الأسئلة الموحدة (41 بند)
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
    .violations-container { background: #fff1f2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px; margin: 15px 0; }
    .v-item { background: white; padding: 12px; border-radius: 8px; border: 1px solid #fcd34d; margin-bottom: 8px; font-size: 13px; }
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

  // --- PDF Generation Logic (تعديل: منع التقطيع وتلوين البنود) ---
  // --- PDF Generation Logic (ملونة + فخمة + بدون تقطيع) ---
  // --- PDF Generation Logic (Professional & Smart Page Breaks) ---
const generatePDF = (r) => {
    // 1. التأكد من وجود البيانات والقائمة
    if (!r || !fullQuestionsList) {
        alert("بيانات التقرير غير مكتملة");
        return;
    }

    // 2. إنشاء الحاوية (Hidden Container)
    const container = document.createElement('div');
    // نجعل الحاوية بعرض ثابت يحاكي A4 لضمان تطابق التصميم
    container.style.width = '210mm'; 
    
    // 3. تصميم CSS (محسن للطباعة وعدم التقطيع)
    const pdfStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        body, html { 
            font-family: 'Cairo', sans-serif; 
            direction: rtl; 
            margin: 0; padding: 0;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
        }

        /* تنسيق الهيدر */
        .header-section { 
            text-align: center; 
            border-bottom: 3px solid #f28b00; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
        }
        .header-title { color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; }
        .header-sub { color: #005a8f; font-size: 14px; margin-top: 5px; font-weight: 700; letter-spacing: 1px; }

        /* شبكة المعلومات */
        .info-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 12px; 
            background: #f8fafc; 
            padding: 15px; 
            border: 1px solid #cbd5e1; 
            border-radius: 8px; 
            margin-bottom: 25px;
            font-size: 12px;
        }
        .info-cell { border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
        .info-label { color: #64748b; font-size: 10px; font-weight: bold; display: block; }
        .info-val { color: #334155; font-weight: 700; font-size: 12px; margin-top: 2px; }

        /* كروت الملاحظات - مصممة لعدم التقطيع */
        .observation-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
            
            /* خصائص منع التقطيع */
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }

        .q-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .q-title { font-weight: 700; font-size: 13px; color: #1e293b; max-width: 80%; }
        
        .q-note { 
            font-size: 11px; 
            background: #fffbe6; /* لون أصفر فاتح للملاحظة */
            color: #b45309; 
            padding: 8px; 
            border-radius: 6px; 
            border: 1px solid #fde68a; 
            margin-top: 8px; 
        }

        /* الصور */
        .photos-container { display: flex; gap: 8px; margin-top: 8px; overflow: hidden; }
        .evidence-img { 
            width: 140px; height: 100px; object-fit: cover; 
            border-radius: 6px; border: 1px solid #cbd5e1; 
            background-color: #f1f5f9;
        }

        /* جدول القائمة الكاملة */
        .checklist-section { margin-top: 30px; }
        .checklist-table { 
            width: 100%; border-collapse: collapse; 
            font-size: 11px; border: 1px solid #e2e8f0;
        }
        
        /* تكرار رأس الجدول في الصفحة الجديدة */
        thead { display: table-header-group; } 
        
        .checklist-table th { 
            background: #005a8f; color: white; padding: 10px; 
            text-align: right; border: 1px solid #004269;
        }
        .checklist-table td { 
            border: 1px solid #e2e8f0; padding: 6px 10px; vertical-align: middle; 
        }
        /* منع تقطيع الصفوف */
        .checklist-table tr { 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
        }
        .checklist-table tr:nth-child(even) { background-color: #f8fafc; }

        /* الشارات Status Badges */
        .status-badge { 
            display: inline-block; padding: 4px 8px; border-radius: 4px; 
            font-size: 10px; font-weight: 800; min-width: 50px; text-align: center;
        }

        /* الفوتر */
        .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 2px solid #e2e8f0; 
            display: flex; 
            justify-content: space-between;
            page-break-inside: avoid;
        }
      </style>
    `;

    // --- 4. معالجة البيانات وبناء HTML --- //

    let observationsHTML = '';
    let hasObservations = false;

    // دالة الألوان
    const getStatusStyle = (ans) => {
        if (ans === 'نعم') return 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;';
        if (ans === 'لا') return 'background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;';
        return 'background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;';
    };

    fullQuestionsList.forEach((q, i) => {
        const violationData = r.violations?.find(v => v.q === q);
        const normalAns = r.answers && r.answers[i+1];
        let finalAns = violationData ? violationData.ans : (normalAns ? (normalAns.val || normalAns) : "لا ينطبق");
        if (finalAns === 'N/A') finalAns = 'لا ينطبق';

        const hasPhotos = violationData && (violationData.photos?.length > 0 || violationData.photo);
        const hasNote = violationData && violationData.note;
        const isDanger = finalAns === 'لا';

        // عرض الملاحظات فقط للعناصر التي بها (صور، ملاحظة نصية، أو حالة خطر/لا)
        if (hasPhotos || hasNote || isDanger) {
            hasObservations = true;
            let photosHTML = '';
            
            // معالجة الصور (سواء كانت مصفوفة أو نص مفرد)
            let photosArr = [];
            if (violationData?.photos && Array.isArray(violationData.photos)) photosArr = violationData.photos;
            else if (violationData?.photo) photosArr = [violationData.photo];

            if (photosArr.length > 0) {
                photosHTML = `<div class="photos-container">`;
                photosArr.forEach(src => {
                    // إضافة crossOrigin لتفادي مشاكل الصور الخارجية
                    photosHTML += `<img src="${src}" class="evidence-img" crossorigin="anonymous" />`;
                });
                photosHTML += `</div>`;
            }

            let borderSide = isDanger ? '6px solid #ef4444' : (finalAns === 'نعم' ? '6px solid #22c55e' : '6px solid #94a3b8');

            observationsHTML += `
                <div class="observation-card" style="border-right: ${borderSide};">
                    <div class="q-header">
                        <div class="q-title">#${i+1} - ${q}</div>
                        <span class="status-badge" style="${getStatusStyle(finalAns)}">${finalAns}</span>
                    </div>
                    ${hasNote ? `<div class="q-note"><strong>📝 ملاحظة:</strong> ${violationData.note}</div>` : ''}
                    ${photosHTML}
                </div>
            `;
        }
    });

    // بناء صفوف الجدول الكامل
    let fullListRows = '';
    fullQuestionsList.forEach((q, i) => {
        const violationData = r.violations?.find(v => v.q === q);
        const normalAns = r.answers && r.answers[i+1];
        let finalAns = violationData ? violationData.ans : (normalAns ? (normalAns.val || normalAns) : "لا ينطبق");
        if (finalAns === 'N/A') finalAns = 'لا ينطبق';

        fullListRows += `
            <tr>
                <td style="text-align:center; font-weight:bold; width: 40px;">${i+1}</td>
                <td>${q}</td>
                <td style="text-align:center; width: 90px;">
                    <span class="status-badge" style="${getStatusStyle(finalAns)}">${finalAns}</span>
                </td>
            </tr>
        `;
    });

    const content = `
      ${pdfStyles}
      <div style="padding: 20px;">
        
        <!-- Header -->
        <div class="header-section">
            <h1 class="header-title">مجموعة السلامة إدارة ضواحي الرياض</h1>
            <div class="header-sub">International Safety Inspection Report</div>
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
             <div class="info-cell"><span class="info-label">المقاول (Contractor)</span><span class="info-val">${r.contractor || '-'}</span></div>
             <div class="info-cell"><span class="info-label">رقم الأمر / التسلسل</span><span class="info-val">${r.work_order_number || r.serial || '-'}</span></div>
             <div class="info-cell" style="grid-column: span 2;"><span class="info-label">وصف العمل (Description)</span><span class="info-val">${r.work_desc || '-'}</span></div>
             <div class="info-cell"><span class="info-label">الموقع (Location)</span><span class="info-val">${r.location || '-'}</span></div>
             <div class="info-cell"><span class="info-label">التاريخ (Date)</span><span class="info-val">${r.timestamp || new Date().toLocaleDateString('ar-EG')}</span></div>
             <div class="info-cell"><span class="info-label">المفتش (Inspector)</span><span class="info-val">${r.inspector || '-'}</span></div>
             <div class="info-cell"><span class="info-label">رابط GPS</span>${r.google_maps_link ? `<a href="${r.google_maps_link}" style="font-size:10px;">الموقع على الخريطة</a>` : '-'}</div>
        </div>

        <!-- Observations Section -->
        ${hasObservations ? `
            <div style="margin-bottom: 30px;">
                <h3 style="color:#b91c1c; border-bottom:1px solid #fee2e2; padding-bottom:5px; margin-bottom:15px; font-size:16px;">
                    📸 الملاحظات والتوثيق (Observations)
                </h3>
                ${observationsHTML}
            </div>
        ` : `
            <div style="text-align:center; padding:20px; background:#f0fdf4; border:1px dashed #4ade80; border-radius:8px; margin: 20px 0;">
                <h3 style="margin:0; color:#166534;">✅ تقرير نظيف (Clean Report)</h3>
                <p style="margin:5px 0 0 0; font-size:12px; color:#15803d;">لا توجد مخالفات مرصودة</p>
            </div>
        `}

        <!-- Full Checklist Section -->
        <div class="checklist-section">
            <h3 style="background:#0f172a; color:white; padding:8px 12px; border-radius:6px 6px 0 0; margin-bottom:0; font-size:14px;">
                📋 قائمة الفحص الشاملة (Full Checklist)
            </h3>
            <table class="checklist-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>البند (Item)</th>
                        <th>الحالة (Status)</th>
                    </tr>
                </thead>
                <tbody>
                    ${fullListRows}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div style="text-align: center;">
                <div style="font-size:11px; color:#64748b; margin-bottom:5px;">المفتش (Inspector)</div>
                <div style="font-weight:bold; font-size:13px;">${r.inspector}</div>
            </div>
            ${r.signature_image ? `
            <div style="text-align: center;">
                <div style="font-size:11px; color:#64748b; margin-bottom:5px;">المستلم (Receiver)</div>
                <img src="${r.signature_image}" style="height:50px; border-bottom:1px solid #ccc;">
            </div>` : ''}
        </div>
      </div>
    `;

    container.innerHTML = content;

    // --- 5. إعدادات التصدير (الحل الجذري للتقطيع) --- //
    const opt = {
      margin:       [10, 10, 10, 10], // هوامش (أعلى، يسار، أسفل، يمين)
      filename:     `Safety_Report_${r.serial || Date.now()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 }, 
      html2canvas:  { 
          scale: 2, // دقة عالية
          useCORS: true, // للسماح بتحميل الصور الخارجية
          scrollY: 0,
          logging: false
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // أهم جزء: منع التقطيع داخل العناصر المهمة
      pagebreak:    { 
          mode: ['css', 'legacy'], 
          avoid: ['.observation-card', 'tr', '.info-grid', '.header-section'] 
      }
    };

    // التنفيذ
    // ملاحظة: html2pdf يعمل بشكل أفضل عندما يكون العنصر جزء من DOM أحياناً لتحميل الصور
    // لكنه يعمل أيضاً مع container في الذاكرة. إذا لم تظهر الصور، جرب إضافة container للـ body وإخفاءه.
    html2pdf().set(opt).from(container).save().then(() => {
        // تنظيف (اختياري)
        // container.remove(); 
    });
 };

  
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
                      <button className="btn-action-card btn-pdf" onClick={() => generatePDF(r)}>
                        <i className="fa-solid fa-file-pdf"></i> PDF
                      </button>
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
