// --- PDF Generation Logic (المعدل والمحسن لمنع التقطيع) ---
  const generatePDF = (r) => {
    const container = document.createElement('div')
    
    // إعدادات CSS محسنة للطباعة
    const pdfStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body { font-family: 'Cairo', sans-serif; direction: rtl; color: #333; }
        
        /* رأس الصفحة */
        .header-section { text-align: center; border-bottom: 3px solid #f28b00; padding-bottom: 15px; margin-bottom: 20px; }
        .header-title { color: #005a8f; font-size: 24px; font-weight: 800; margin: 0; }
        .header-sub { color: #666; font-size: 14px; margin: 5px 0; }

        /* شبكة المعلومات */
        .info-grid { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 8px; 
            font-size: 12px; background: #f8fafc; padding: 15px; 
            border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; 
        }

        /* كارت الملاحظة */
        .observation-card {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
            /* هام جداً: نسمح للكارت بالانقسام، ولكن نمنع انقسام محتواه الداخلي بشكل عشوائي */
            page-break-inside: auto; 
        }

        /* نمنع القص داخل العنوان أو الحالة */
        .card-header-box {
            page-break-inside: avoid;
            margin-bottom: 8px;
        }

        /* ألوان الكارت */
        .card-danger { border-right: 5px solid #dc2626; background-color: #fff5f5; }
        .card-success { border-right: 5px solid #16a34a; background-color: #f0fdf4; }
        .card-neutral { border-right: 5px solid #64748b; background-color: #f8fafc; }

        .q-title { font-weight: 800; font-size: 13px; margin-bottom: 4px; color: #1e293b; }
        .q-status { font-size: 11px; font-weight: bold; }
        .q-note { font-size: 11px; color: #555; background: rgba(255,255,255,0.7); padding: 5px; border-radius: 4px; border: 1px dashed #ccc; margin-top: 5px; }

        /* حاوية الصور - تجعل الصور بجانب بعض */
        .photos-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }

        /* حاوية الصورة الواحدة - ممنوع القص داخلها */
        .photo-wrapper {
            width: 32%; /* عرض مناسب لظهور 3 صور بجانب بعض */
            border: 1px solid #ccc;
            padding: 2px;
            background: white;
            border-radius: 4px;
            page-break-inside: avoid; /* سحر المنع من القص */
            break-inside: avoid;
        }

        .evidence-img {
            width: 100%; 
            height: 150px; /* طول ثابت لتقليل استهلاك المساحة */
            object-fit: cover; 
            border-radius: 2px;
            display: block;
        }

        /* الجداول */
        .table-container { page-break-inside: avoid; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #005a8f; color: white; padding: 6px; text-align: right; }
        td { border-bottom: 1px solid #eee; padding: 5px; }
        tr { page-break-inside: avoid; }

        .footer { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
      </style>
    `

    let detailedItemsHTML = ''
    let simpleItemsRows = ''

    fullQuestionsList.forEach((q, i) => {
        const violationData = r.violations?.find(v => v.q === q);
        const normalAns = r.answers && r.answers[i+1];
        let finalAns = "لا ينطبق";

        if (violationData) finalAns = violationData.ans;
        else if (normalAns) finalAns = normalAns.val || normalAns;
        if (finalAns === 'N/A') finalAns = 'لا ينطبق';

        const hasPhotos = violationData && (violationData.photos?.length > 0 || violationData.photo);
        const hasNote = violationData && violationData.note;
        const isDanger = finalAns === 'لا';

        // نعرض الكارت التفصيلي فقط إذا كان هناك ملاحظة أو صور أو مخالفة
        if (isDanger || hasPhotos || hasNote) {
            let cardClass = 'card-neutral';
            let statusColor = '#64748b';
            
            if (isDanger) {
                cardClass = 'card-danger';
                statusColor = '#dc2626';
            } else if (finalAns === 'نعم') {
                cardClass = 'card-success';
                statusColor = '#16a34a';
            }

            // تجهيز الصور
            let photosHTML = '';
            if (hasPhotos) {
                photosHTML = `<div class="photos-grid">`;
                const photos = violationData.photos?.length > 0 ? violationData.photos : [violationData.photo];
                
                photos.forEach(src => {
                    // نضع كل صورة في حاوية خاصة تمنع القص
                    if(src) {
                        photosHTML += `
                            <div class="photo-wrapper">
                                <img src="${src}" class="evidence-img" />
                            </div>
                        `;
                    }
                });
                photosHTML += `</div>`;
            }

            detailedItemsHTML += `
                <div class="observation-card ${cardClass}">
                    <div class="card-header-box">
                        <div class="q-title">${i+1}. ${q}</div>
                        <div class="q-status">الحالة: <span style="color:${statusColor}">${finalAns}</span></div>
                        ${hasNote ? `<div class="q-note">📝 ${violationData.note}</div>` : ''}
                    </div>
                    ${photosHTML}
                </div>
            `;
        } else {
            // الجدول المختصر
            let rowColor = finalAns === 'نعم' ? '#16a34a' : '#64748b';
            simpleItemsRows += `
                <tr>
                    <td style="width:20px; text-align:center; color:#999;">${i+1}</td>
                    <td>${q}</td>
                    <td style="width:60px; font-weight:bold; color:${rowColor}; text-align:center;">${finalAns}</td>
                </tr>
            `;
        }
    });

    // محتوى التقرير النهائي
    const content = `
      ${pdfStyles}
      <div style="padding:10px; max-width: 100%;">
        
        <div class="header-section">
            <h1 class="header-title">مجموعة السلامة ادارة ضواحي الرياض</h1>
            <div class="header-sub">تقرير تفتيش سلامة ميداني</div>
        </div>
        
        <div class="info-grid">
             <div><b>رقم التقرير:</b> #${r.serial}</div>
             <div><b>التاريخ:</b> ${r.timestamp}</div>
             <div><b>المفتش:</b> ${r.inspector}</div>
             <div><b>المقاول:</b> ${r.contractor}</div>
             <div><b>الموقع:</b> ${r.location}</div>
             <div style="grid-column: span 2;"><b>الوصف:</b> ${r.work_desc || '-'}</div>
             <div style="grid-column: span 2;">
                <b>الخريطة:</b> 
                ${r.google_maps_link ? `<a href="${r.google_maps_link}" style="color:#005a8f;">رابط الموقع</a>` : 'غير متوفر'}
             </div>
        </div>

        ${detailedItemsHTML ? `
            <h3 style="color:#005a8f; border-bottom:2px solid #eee; padding-bottom:5px; margin-top:15px;">📸 الملاحظات الميدانية</h3>
            <div>
                ${detailedItemsHTML}
            </div>
        ` : ''}

        ${simpleItemsRows ? `
            <div class="table-container">
                <h3 style="background:#005a8f; color:white; padding:5px; border-radius:4px; font-size:12px;">✅ القائمة السريعة</h3>
                <table>
                    <tbody>${simpleItemsRows}</tbody>
                </table>
            </div>
        ` : ''}

        <div class="footer">
            <div style="text-align:center;">
                <p style="margin-bottom:5px; font-weight:bold; color:#005a8f;">المفتش</p>
                <p>${r.inspector}</p>
            </div>
            ${r.signature_image ? `
            <div style="text-align:center;">
                <p style="margin-bottom:5px; font-weight:bold; color:#005a8f;">توقيع المستلم</p>
                <img src="${r.signature_image}" style="height:60px;">
            </div>` : ''}
        </div>
      </div>
    `

    container.innerHTML = content

    // إعدادات التصدير - أهم جزء لمنع التقطيع
    const opt = {
      margin:       [10, 10, 10, 10], // هوامش للصفحة
      filename:     `Report_${r.contractor}_${r.serial}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 }, // جودة صور عالية
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // هذا السطر يمنع قص العناصر التي لديها كلاسات معينة
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['.photo-wrapper', '.card-header-box', '.info-grid', 'tr'] }
    };

    html2pdf().set(opt).from(container).save()
  }
