/* ==========================================================
   config.js — v17
   إعدادات Nexora — ملف واحد فيه كل الحساس
   ✅ v17: إزالة التكرار في __COURSE_LIBRARY_MAP__
   ========================================================== */

'use strict';

window.__OWNER_PASSWORD__ = '01096295395mo';

window.__FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
  authDomain: "gymzone-f53f1.firebaseapp.com",
  projectId: "gymzone-f53f1",
  storageBucket: "gymzone-f53f1.firebasestorage.app",
  messagingSenderId: "138864850130",
  appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
};

window.__OWNER_EMAIL__ = 'owner@gymzone.com';

/* ربط كورسات المنصة المدفوعة بكورسات Drive في المكتبة
   (عشان لما طالب يشترك في كورس مدفوع، كورس الـ Drive المقابل يفتح له) */
window.__COURSE_LIBRARY_MAP__ = {
  'frontend-diploma':  'Front End 2026',
  'backend-course':    'Back End 2025',
  'uiux-course':       'UI/UX',
  'mobile-app-course': 'Mobile App 2026',
  'data-diploma':      'Data Analysis 2026',
  'ai-ds-ml':          'AI Data Science / ML',
  'cyber-course':      'Cyber Security',
  'media-buying':      'Media Buying Course',
  'fullstack-diploma': 'Front End 2026',
  'git-github':        null
};