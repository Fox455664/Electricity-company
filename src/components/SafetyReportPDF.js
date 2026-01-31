import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, PDFDownloadLink } from '@react-pdf/renderer';

// 1. تسجيل الخط العربي (Cairo) عشان العربي يظهر صح
Font.register({
  family: 'Cairo',
  src: 'https://fonts.gstatic.com/s/cairo/v20/SLXGc1nY6HkvangtZmpcMw.ttf'
});

// 2. ستايل التقرير (CSS خاص بالـ PDF)
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Cairo', backgroundColor: '#ffffff' },
  header: { 
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#005a8f', paddingBottom: 10, marginBottom: 15 
  },
  headerTitle: { fontSize: 20, color: '#005a8f', fontWeight: 'bold' },
  headerSub: { fontSize: 10, color: '#64748b' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
  infoBox: { 
    width: '30%', backgroundColor: '#f8fafc', padding: 8, borderRadius: 5, 
    borderWidth: 1, borderColor: '#e2e8f0', textAlign: 'right' 
  },
  label: { fontSize: 8, color: '#64748b', marginBottom: 2 },
  value: { fontSize: 10, color: '#334155', fontWeight: 'bold' },
  
  // الجدول
  table: { width: '100%', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  row: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center', minHeight: 25 },
  headerRow: { backgroundColor: '#005a8f', color: 'white' },
  cellId: { width: '8%', fontSize: 9, textAlign: 'center', padding: 5, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  cellQ: { width: '60%', fontSize: 9, textAlign: 'right', padding: 5, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  cellAns: { width: '12%', fontSize: 9, textAlign: 'center', padding: 5, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  cellNote: { width: '20%', fontSize: 8, textAlign: 'right', padding: 5, color: '#dc2626' },

  // الألوان
  green: { color: '#166534', backgroundColor: '#dcfce7' },
  red: { color: '#991b1b', backgroundColor: '#fee2e2' },
  gray: { color: '#475569' },
});

// 3. مكون الـ PDF
const MyDocument = ({ data, questionsList }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* الرأس */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>تقرير السلامة والصحة المهنية</Text>
          <Text style={styles.headerSub}>إدارة ضواحي الرياض</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, color: '#005a8f' }}>#{data.serial}</Text>
            <Text style={{ fontSize: 10, color: '#888' }}>{data.timestamp}</Text>
        </View>
      </View>

      {/* بيانات المشروع */}
      <View style={styles.grid}>
        <View style={styles.infoBox}><Text style={styles.label}>المفتش</Text><Text style={styles.value}>{data.inspector}</Text></View>
        <View style={styles.infoBox}><Text style={styles.label}>المقاول</Text><Text style={styles.value}>{data.contractor}</Text></View>
        <View style={styles.infoBox}><Text style={styles.label}>الموقع</Text><Text style={styles.value}>{data.location || '-'}</Text></View>
        <View style={styles.infoBox}><Text style={styles.label}>وصف العمل</Text><Text style={styles.value}>{data.work_desc || '-'}</Text></View>
        <View style={styles.infoBox}><Text style={styles.label}>الاستشاري</Text><Text style={styles.value}>{data.consultant || '-'}</Text></View>
      </View>

      {/* الجدول */}
      <View style={styles.table}>
        {/* رأس الجدول */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cellId, { borderLeftColor: '#004269' }]}>#</Text>
          <Text style={[styles.cellQ, { borderLeftColor: '#004269' }]}>البند</Text>
          <Text style={[styles.cellAns, { borderLeftColor: '#004269' }]}>الحالة</Text>
          <Text style={styles.cellNote}>ملاحظات</Text>
        </View>

        {/* الصفوف */}
        {questionsList.map((q, i) => {
          const violation = data.violations?.find(v => v.q === q);
          const raw = data.answers?.[i + 1];
          const val = raw?.val || raw || "لا ينطبق";
          const finalVal = violation ? "لا" : val;
          const note = violation ? violation.note : "";
          
          // تلوين الحالة
          const statusStyle = finalVal === 'نعم' ? { color: '#166534' } : finalVal === 'لا' ? { color: '#dc2626' } : { color: '#64748b' };

          return (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={styles.cellId}>{i + 1}</Text>
              <Text style={styles.cellQ}>{q}</Text>
              <Text style={[styles.cellAns, statusStyle]}>{finalVal}</Text>
              <Text style={styles.cellNote}>{note}</Text>
            </View>
          );
        })}
      </View>

      {/* صفحة الصور (لو موجودة) */}
      {data.violations?.some(v => v.photo || v.photos?.length) && (
        <View break>
            <Text style={[styles.headerTitle, {marginBottom: 20}]}>صور المخالفات</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {data.violations.map((v) => {
                    const imgs = v.photos || (v.photo ? [v.photo] : []);
                    return imgs.map((img, idx) => (
                        <View key={idx} style={{ width: '48%', marginBottom: 10 }}>
                           <Image src={img} style={{ width: '100%', height: 150, borderRadius: 5, objectFit: 'cover' }} />
                           <Text style={{ fontSize: 9, marginTop: 5, textAlign: 'center' }}>{v.q}</Text>
                        </View>
                    ));
                })}
            </View>
        </View>
      )}

      {/* الترقيم أسفل الصفحة */}
      <Text style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: 'grey' }} render={({ pageNumber, totalPages }) => (
        `صفحة ${pageNumber} من ${totalPages}`
      )} fixed />

    </Page>
  </Document>
);

// زر التحميل الجاهز
export const DownloadPDFButton = ({ reportData, fullQuestionsList }) => (
  <PDFDownloadLink document={<MyDocument data={reportData} questionsList={fullQuestionsList} />} fileName={`Report_${reportData.serial}.pdf`}>
    {({ loading }) => (
      <button className="btn-action-card btn-pdf" style={{width: '100%'}}>
        {loading ? 'جاري التجهيز...' : <span><i className="fa-solid fa-file-pdf"></i> تحميل PDF</span>}
      </button>
    )}
  </PDFDownloadLink>
);
