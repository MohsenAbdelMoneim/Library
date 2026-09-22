/* ==========================================================
   roadmap.js — v20.2
   ✅ v20:   Smart stage matching بـ scoring/priority
   ✅ v20:   Level detection بـ position داخل المسار
   ✅ v20:   Current Step + Locking محسّن
   ✅ v20.1: Advanced Frontend stage في نهاية Frontend
   ✅ v20.1: Backend Sub-Paths (Node/Python/PHP/Java/.NET)
   ✅ v20.1: عرض المسارات البديلة تحت الـ Timeline
   ✅ v20.2: إصلاح dead code (getStageLevel, getCourseStatus مستخدمين فعليًا)
   ✅ v20.2: منع تكرار كورسات sub-paths في Timeline الأساسي
   ✅ v20.2: تحسين ARIA في sub-paths
   ✅ v20.2: عرض loadError في error state
   ✅ v20.2: عرض stageLabel في الـ step card
   ✅ v20.2: كل features v19 محفوظة (Auth, Firestore, Hash, ARIA, ...)
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Roadmap — v20.2 ', 'background:#2684fc;color:#fff;font-weight:bold');

  /* ---------- Firebase ---------- */
  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  if (typeof firebase === 'undefined') {
    console.error('[RM] Firebase SDK مش محمّل');
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ---------- Helpers ---------- */
  const qs  = (s, el) => (el || document).querySelector(s);
  const qsa = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function fmtNum(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '0';
    try { return v.toLocaleString('ar-EG-u-nu-latn'); }
    catch { return String(v); }
  }

  function waLinkFor(title) {
    const phone = (window.MCL && MCL.CONTACT_PHONE) || '01096295395';
    const intl = String(phone).replace(/^0/, '20');
    const text = `أهلاً 👋 عايز أشترك في كورس «${title}»`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
  }

  function normalizeText(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /* ---------- Level Detection ---------- */
  const LEVEL_PATTERNS = {
    advanced: [
      'advanced', 'متقدم', 'احتراف', 'pro ', 'expert', 'master', 'عميق',
      'deep dive', 'متقدمة', 'النطاق المتقدم', 'من الصفر للاحتراف المتقدم'
    ],
    intermediate: [
      'intermediate', 'متوسط', 'وسط', 'متوسطة', 'practical', 'تطبيقي'
    ],
    beginnerHint: [
      'complete course', 'from zero', 'from scratch', 'من الصفر',
      'دورة شاملة', 'كورس شامل', 'complete guide', 'basics', 'مقدمة',
      'intro', 'fundamentals', 'أساسيات'
    ]
  };

  function detectLevel(course) {
    if (course.level) {
      const l = normalizeText(course.level);
      if (['beginner', 'مبتدئ', 'مبتدئة', 'مبتدئين'].includes(l)) return 'beginner';
      if (['intermediate', 'متوسط', 'متوسطة'].includes(l)) return 'intermediate';
      if (['advanced', 'متقدم', 'متقدمة', 'احترافي'].includes(l)) return 'advanced';
    }
    const haystack = normalizeText((course.title || '') + ' ' + (course.description || ''));

    for (const k of LEVEL_PATTERNS.advanced) {
      if (haystack.includes(k)) return 'advanced';
    }
    for (const k of LEVEL_PATTERNS.intermediate) {
      if (haystack.includes(k)) return 'intermediate';
    }
    for (const k of LEVEL_PATTERNS.beginnerHint) {
      if (haystack.includes(k)) return 'beginner';
    }
    return 'beginner';
  }

  /* ✅ v20.2: مستخدمة فعليًا في mapCourseToStep */
  function getStageLevel(stageIndex, totalSteps, explicitLevel) {
    if (explicitLevel && explicitLevel !== 'beginner') return explicitLevel;
    if (!totalSteps || totalSteps < 3) return explicitLevel || 'beginner';
    const ratio = stageIndex / totalSteps;
    if (ratio >= 0.7) return 'advanced';
    if (ratio >= 0.35) return 'intermediate';
    return 'beginner';
  }

  const LEVEL_LABEL = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  };
  const LEVEL_COLOR = {
    beginner: 'var(--rm-lv-beginner, #22c55e)',
    intermediate: 'var(--rm-lv-intermediate, #f0b53e)',
    advanced: 'var(--rm-lv-advanced, #ef4444)'
  };

  /* ---------- Roadmap Definitions (Curriculum) ---------- */
  const ROADMAP_DEFINITIONS = [
    /* ===================== 1. Frontend ===================== */
    {
      id: 'frontend',
      icon: '🎨',
      title: 'Frontend Development',
      desc: 'من أساسيات الويب إلى بناء تطبيقات React احترافية',
      color: 'var(--rm-c-frontend, #4f7cff)',
      stages: [
        { id: 'html',         label: 'HTML',                    level: 'beginner',     keywords: ['html'],                                       categories: ['HTML'] },
        { id: 'css',          label: 'CSS',                     level: 'beginner',     keywords: ['css'],                                        categories: ['CSS'] },
        { id: 'responsive',   label: 'Responsive Web Design',   level: 'beginner',     keywords: ['responsive', 'متجاوب', 'web design'],         categories: [] },
        { id: 'js',           label: 'JavaScript',              level: 'beginner',     keywords: ['javascript', 'js basics', 'أساسيات جافاسكريبت', 'js fundamentals'], categories: ['JavaScript'] },
        { id: 'dom',          label: 'DOM & Browser APIs',      level: 'intermediate', keywords: ['dom', 'browser api', 'browser apis'],         categories: [] },
        { id: 'git',          label: 'Git & GitHub',            level: 'beginner',     keywords: ['git', 'github'],                              categories: [] },
        { id: 'css-fw',       label: 'Bootstrap / Tailwind',    level: 'intermediate', keywords: ['bootstrap', 'tailwind'],                      categories: ['Tailwind CSS', 'Bootstrap'] },
        { id: 'js-adv',       label: 'Advanced JavaScript',     level: 'advanced',     keywords: ['advanced javascript', 'javascript متقدم', 'js advanced', 'es6', 'modern javascript'], categories: [] },
        { id: 'react',        label: 'React',                   level: 'intermediate', keywords: ['react'],                                      categories: ['React'] },
        { id: 'react-router', label: 'React Router',            level: 'intermediate', keywords: ['react router'],                               categories: [] },
        { id: 'apis',         label: 'APIs & Async JavaScript', level: 'intermediate', keywords: ['api', 'async', 'fetch', 'ajax'],              categories: [] },
        { id: 'state',        label: 'State Management',        level: 'advanced',     keywords: ['state management', 'redux', 'zustand', 'context'], categories: [] },
        { id: 'nextjs',       label: 'Next.js',                 level: 'advanced',     keywords: ['next.js', 'nextjs'],                          categories: ['Next.js'] },
        { id: 'projects',     label: 'Frontend Projects',       level: 'advanced',     keywords: ['projects', 'مشاريع', 'portfolio', 'frontend project'], categories: [] },
        { id: 'adv-frontend', label: 'Advanced Frontend',       level: 'advanced',     keywords: ['advanced frontend', 'frontend متقدم', 'performance', 'optimization', 'web performance', 'pwa', 'testing frontend'], categories: [] }
      ]
    },

    /* ===================== 2. Backend ===================== */
    {
      id: 'backend',
      icon: '⚙️',
      title: 'Backend Development',
      desc: 'ابنِ الخدمات الخلفية وقواعد البيانات بشكل احترافي',
      color: 'var(--rm-c-backend, #22c55e)',
      subPaths: [
        {
          id: 'nodejs-track',
          label: 'Node.js Track',
          icon: '🟢',
          keywords: ['node.js', 'nodejs', 'node js', 'express', 'nestjs', 'nest.js'],
          stages: [
            { id: 'nodejs',  label: 'Node.js',    level: 'intermediate', keywords: ['node.js', 'nodejs'],    categories: ['Node.js'] },
            { id: 'express', label: 'Express.js', level: 'intermediate', keywords: ['express'],               categories: [] },
            { id: 'nestjs',  label: 'NestJS',     level: 'advanced',     keywords: ['nestjs', 'nest.js'],     categories: [] }
          ]
        },
        {
          id: 'python-track',
          label: 'Python Track',
          icon: '🐍',
          keywords: ['python', 'django', 'flask', 'fastapi'],
          stages: [
            { id: 'python',  label: 'Python',  level: 'beginner',     keywords: ['python', 'بايثون'],  categories: [] },
            { id: 'django',  label: 'Django',  level: 'intermediate', keywords: ['django'],            categories: [] },
            { id: 'fastapi', label: 'FastAPI', level: 'advanced',     keywords: ['fastapi', 'flask'],  categories: [] }
          ]
        },
        {
          id: 'php-track',
          label: 'PHP Track',
          icon: '🐘',
          keywords: ['php', 'laravel'],
          stages: [
            { id: 'php',     label: 'PHP',     level: 'beginner',     keywords: ['php'],      categories: [] },
            { id: 'laravel', label: 'Laravel', level: 'intermediate', keywords: ['laravel'],  categories: [] }
          ]
        },
        {
          id: 'java-track',
          label: 'Java Track',
          icon: '☕',
          keywords: ['java', 'spring', 'spring boot'],
          stages: [
            { id: 'java',   label: 'Java',        level: 'beginner',     keywords: ['java'],                  categories: [] },
            { id: 'spring', label: 'Spring Boot', level: 'intermediate', keywords: ['spring', 'spring boot'], categories: [] }
          ]
        },
        {
          id: 'dotnet-track',
          label: '.NET Track',
          icon: '🟣',
          keywords: ['.net', 'dotnet', 'c#', 'asp.net'],
          stages: [
            { id: 'csharp', label: 'C#',      level: 'beginner',     keywords: ['c#', 'csharp'],      categories: [] },
            { id: 'aspnet', label: 'ASP.NET', level: 'intermediate', keywords: ['asp.net', 'aspnet'], categories: [] }
          ]
        }
      ],
      stages: [
        { id: 'prog-basics', label: 'Programming Basics',    level: 'beginner',     keywords: ['programming basics', 'أساسيات البرمجة', 'programming fundamentals'], categories: [] },
        { id: 'git',         label: 'Git & GitHub',          level: 'beginner',     keywords: ['git', 'github'],                              categories: [] },
        { id: 'http',        label: 'HTTP & REST APIs',      level: 'beginner',     keywords: ['http', 'rest', 'restful'],                    categories: [] },
        { id: 'backend-fund',label: 'Backend Fundamentals',  level: 'beginner',     keywords: ['backend', 'back end', 'back-end', 'سيرفر'],   categories: ['Backend'] },
        { id: 'nodejs',      label: 'Node.js',               level: 'intermediate', keywords: ['node.js', 'nodejs', 'node js'],               categories: ['Node.js'] },
        { id: 'express',     label: 'Express.js',            level: 'intermediate', keywords: ['express'],                                    categories: [] },
        { id: 'databases',   label: 'Databases',             level: 'intermediate', keywords: ['database', 'databases', 'قواعد بيانات'],      categories: [] },
        { id: 'sql',         label: 'SQL',                   level: 'intermediate', keywords: ['sql', 'mysql', 'postgres'],                   categories: [] },
        { id: 'mongodb',     label: 'MongoDB',               level: 'intermediate', keywords: ['mongo', 'mongodb'],                           categories: [] },
        { id: 'auth',        label: 'Auth & Authorization',  level: 'intermediate', keywords: ['auth', 'authentication', 'jwt', 'oauth'],     categories: [] },
        { id: 'rest-dev',    label: 'REST API Development',  level: 'intermediate', keywords: ['rest api', 'api development'],                categories: [] },
        { id: 'security',    label: 'Security',              level: 'advanced',     keywords: ['security', 'أمان'],                           categories: [] },
        { id: 'testing',     label: 'Testing',               level: 'advanced',     keywords: ['testing', 'jest', 'unit test'],               categories: [] },
        { id: 'deploy',      label: 'Deployment',            level: 'advanced',     keywords: ['deployment', 'deploy', 'نشر'],                categories: [] },
        { id: 'backend-adv', label: 'Advanced Backend',      level: 'advanced',     keywords: ['advanced backend', 'microservices'],          categories: [] }
      ]
    },

    /* ===================== 3. Full Stack ===================== */
    {
      id: 'fullstack',
      icon: '🚀',
      title: 'Full Stack Development',
      desc: 'الواجهة والخلفية مع بعض — بناء تطبيقات كاملة',
      color: 'var(--rm-c-fullstack, #f0b53e)',
      stages: [
        { id: 'fe-fund',     label: 'Frontend Fundamentals',  level: 'beginner',     keywords: ['frontend', 'front end', 'front-end'],         categories: ['Frontend'] },
        { id: 'js',          label: 'JavaScript',             level: 'beginner',     keywords: ['javascript'],                                 categories: ['JavaScript'] },
        { id: 'react',       label: 'React',                  level: 'intermediate', keywords: ['react'],                                      categories: ['React'] },
        { id: 'be-fund',     label: 'Backend Fundamentals',   level: 'beginner',     keywords: ['backend', 'back end', 'back-end'],            categories: ['Backend'] },
        { id: 'nodejs',      label: 'Node.js / Backend Tech', level: 'intermediate', keywords: ['node.js', 'nodejs'],                          categories: ['Node.js'] },
        { id: 'db',          label: 'Database',               level: 'intermediate', keywords: ['database', 'mongodb', 'sql'],                 categories: [] },
        { id: 'auth',        label: 'Authentication',         level: 'intermediate', keywords: ['auth', 'jwt'],                                categories: [] },
        { id: 'apis',        label: 'APIs',                   level: 'intermediate', keywords: ['api', 'rest'],                                categories: [] },
        { id: 'fs-proj',     label: 'Full Stack Projects',    level: 'advanced',     keywords: ['full stack', 'fullstack', 'full-stack'],      categories: ['Full Stack'] },
        { id: 'deploy',      label: 'Deployment',             level: 'advanced',     keywords: ['deployment', 'deploy'],                       categories: [] }
      ]
    },

    /* ===================== 4. AI & GenAI ===================== */
    {
      id: 'ai',
      icon: '🤖',
      title: 'AI & Generative AI',
      desc: 'من أساسيات AI لحد بناء أنظمة ذكية بـGenerative AI',
      color: 'var(--rm-c-ai, #8b5cf6)',
      stages: [
        { id: 'prog-basics',   label: 'Programming Basics',    level: 'beginner',     keywords: ['programming basics', 'أساسيات البرمجة'],      categories: [] },
        { id: 'python',        label: 'Python',                level: 'beginner',     keywords: ['python', 'بايثون'],                           categories: [] },
        { id: 'math',          label: 'Mathematics / Logic',   level: 'beginner',     keywords: ['math', 'رياضيات', 'logic', 'إحصاء', 'statistics'], categories: [] },
        { id: 'data-handling', label: 'Data Handling',         level: 'intermediate', keywords: ['data handling', 'pandas', 'numpy'],           categories: [] },
        { id: 'ai-fund',       label: 'AI Fundamentals',       level: 'intermediate', keywords: ['ai fundamentals', 'أساسيات ai', 'artificial intelligence', 'machine learning basics'], categories: ['AI'] },
        { id: 'ml',            label: 'Machine Learning',      level: 'intermediate', keywords: ['machine learning', 'ml'],                     categories: [] },
        { id: 'dl',            label: 'Deep Learning',         level: 'advanced',     keywords: ['deep learning', 'neural network', 'cnn', 'rnn'], categories: [] },
        { id: 'genai',         label: 'Generative AI',         level: 'advanced',     keywords: ['generative', 'genai', 'llm', 'gpt', 'transformer'], categories: [] },
        { id: 'prompt',        label: 'Prompt Engineering',    level: 'advanced',     keywords: ['prompt', 'prompting'],                        categories: [] },
        { id: 'ai-tools',      label: 'AI Tools',              level: 'intermediate', keywords: ['ai tools', 'midjourney', 'openai'],           categories: [] },
        { id: 'ai-proj',       label: 'AI Projects',           level: 'advanced',     keywords: ['ai projects', 'مشاريع ai', 'portfolio ai'],   categories: [] }
      ]
    },

    /* ===================== 5. UI/UX Design ===================== */
    {
      id: 'design',
      icon: '🎨',
      title: 'UI/UX Design',
      desc: 'من مبادئ التصميم لحد إتقان Figma وبناء Portfolio',
      color: 'var(--rm-c-design, #ec4899)',
      stages: [
        { id: 'design-fund',   label: 'Design Fundamentals',      level: 'beginner',     keywords: ['design fundamentals', 'أساسيات التصميم', 'graphic design'], categories: ['Graphic Design'] },
        { id: 'color-typo',    label: 'Color & Typography',       level: 'beginner',     keywords: ['color', 'typography', 'ألوان', 'خطوط'],      categories: [] },
        { id: 'user-research', label: 'User Research',            level: 'intermediate', keywords: ['user research', 'research', 'أبحاث'],         categories: [] },
        { id: 'ux-fund',       label: 'UX Fundamentals',          level: 'intermediate', keywords: ['ux fundamental', 'ux basics', 'user experience'], categories: ['UI/UX'] },
        { id: 'wireframe',     label: 'Wireframing',              level: 'intermediate', keywords: ['wireframe', 'wireframing'],                   categories: [] },
        { id: 'user-flow',     label: 'User Flow',                level: 'intermediate', keywords: ['user flow', 'flow'],                          categories: [] },
        { id: 'ia',            label: 'Information Architecture', level: 'intermediate', keywords: ['information architecture', 'ia '],            categories: [] },
        { id: 'ui-design',     label: 'UI Design',                level: 'intermediate', keywords: ['ui design', 'واجهات'],                        categories: ['UI/UX'] },
        { id: 'figma',         label: 'Figma',                    level: 'intermediate', keywords: ['figma', 'فيجما'],                             categories: [] },
        { id: 'prototyping',   label: 'Prototyping',              level: 'intermediate', keywords: ['prototype', 'prototyping', 'نموذج'],          categories: [] },
        { id: 'design-sys',    label: 'Design Systems',           level: 'advanced',     keywords: ['design system', 'design systems'],            categories: [] },
        { id: 'responsive',    label: 'Responsive Design',        level: 'intermediate', keywords: ['responsive', 'متجاوب'],                       categories: [] },
        { id: 'case-study',    label: 'UX Case Study',            level: 'advanced',     keywords: ['case study', 'دراسة حالة'],                   categories: [] },
        { id: 'portfolio',     label: 'Portfolio',                level: 'advanced',     keywords: ['portfolio', 'بورتفوليو', 'معرض أعمال'],       categories: [] }
      ]
    },

    /* ===================== 6. Data Analysis ===================== */
    {
      id: 'data',
      icon: '📊',
      title: 'Data Analysis',
      desc: 'اتخذ قراراتك بالأرقام — من Excel لـPower BI',
      color: 'var(--rm-c-data, #06b6d4)',
      stages: [
        { id: 'excel',         label: 'Excel',                 level: 'beginner',     keywords: ['excel', 'إكسل'],                              categories: ['Excel'] },
        { id: 'excel-adv',     label: 'Advanced Excel',        level: 'intermediate', keywords: ['advanced excel', 'excel متقدم', 'pivot'],     categories: [] },
        { id: 'sql',           label: 'SQL',                   level: 'intermediate', keywords: ['sql', 'mysql', 'postgres'],                   categories: [] },
        { id: 'stats',         label: 'Statistics',            level: 'intermediate', keywords: ['statistics', 'إحصاء'],                        categories: [] },
        { id: 'data-clean',    label: 'Data Cleaning',         level: 'intermediate', keywords: ['data cleaning', 'تنظيف بيانات'],              categories: [] },
        { id: 'data-analysis', label: 'Data Analysis',         level: 'intermediate', keywords: ['data analysis', 'تحليل البيانات'],            categories: ['Data Analysis'] },
        { id: 'powerbi',       label: 'Power BI',              level: 'advanced',     keywords: ['power bi', 'powerbi'],                        categories: [] },
        { id: 'data-viz',      label: 'Data Visualization',    level: 'advanced',     keywords: ['data visualization', 'visualization', 'charts'], categories: [] },
        { id: 'dashboards',    label: 'Dashboard Projects',    level: 'advanced',     keywords: ['dashboard', 'لوحات'],                         categories: [] },
        { id: 'portfolio',     label: 'Portfolio',             level: 'advanced',     keywords: ['portfolio', 'بورتفوليو'],                     categories: [] }
      ]
    },

    /* ===================== 7. Programming / CS ===================== */
    {
      id: 'programming',
      icon: '💻',
      title: 'Programming & CS',
      desc: 'أساسيات البرمجة وعلوم الحاسب لأي لغة',
      color: 'var(--rm-c-prog, #a855f7)',
      stages: [
        { id: 'prog-basics', label: 'Programming Basics',     level: 'beginner',     keywords: ['programming basics', 'أساسيات البرمجة', 'intro to programming'], categories: [] },
        { id: 'vars',        label: 'Variables & Data Types', level: 'beginner',     keywords: ['variables', 'data types'],                    categories: [] },
        { id: 'conditions',  label: 'Conditions & Loops',     level: 'beginner',     keywords: ['conditions', 'loops', 'if', 'for'],          categories: [] },
        { id: 'functions',   label: 'Functions',              level: 'beginner',     keywords: ['functions', 'دوال'],                          categories: [] },
        { id: 'oop',         label: 'OOP',                    level: 'intermediate', keywords: ['oop', 'object oriented', 'كائنية'],           categories: [] },
        { id: 'ds',          label: 'Data Structures',        level: 'intermediate', keywords: ['data structures', 'هياكل بيانات'],            categories: [] },
        { id: 'algo',        label: 'Algorithms',             level: 'advanced',     keywords: ['algorithms', 'خوارزميات'],                    categories: [] },
        { id: 'problem',     label: 'Problem Solving',        level: 'advanced',     keywords: ['problem solving', 'حل مشكلات'],               categories: [] },
        { id: 'git',         label: 'Git & GitHub',           level: 'beginner',     keywords: ['git', 'github'],                              categories: [] },
        { id: 'projects',    label: 'Projects',               level: 'advanced',     keywords: ['projects', 'مشاريع'],                         categories: [] }
      ]
    },

    /* ===================== 8. DevOps & Cloud ===================== */
    {
      id: 'devops',
      icon: '☁️',
      title: 'DevOps & Cloud',
      desc: 'من Linux للـKubernetes والنشر السحابي',
      color: 'var(--rm-c-devops, #0ea5e9)',
      stages: [
        { id: 'linux',      label: 'Linux',              level: 'beginner',     keywords: ['linux', 'bash', 'shell'],                     categories: [] },
        { id: 'network',    label: 'Networking Basics',  level: 'beginner',     keywords: ['networking', 'network', 'شبكات'],             categories: [] },
        { id: 'git',        label: 'Git',                level: 'beginner',     keywords: ['git'],                                        categories: [] },
        { id: 'docker',     label: 'Docker',             level: 'intermediate', keywords: ['docker', 'container'],                        categories: [] },
        { id: 'cicd',       label: 'CI/CD',              level: 'intermediate', keywords: ['ci/cd', 'cicd', 'jenkins', 'github actions'], categories: [] },
        { id: 'cloud-fund', label: 'Cloud Fundamentals', level: 'intermediate', keywords: ['cloud fundamentals', 'cloud computing'],      categories: [] },
        { id: 'aws',        label: 'AWS / Azure',        level: 'advanced',     keywords: ['aws', 'azure', 'gcp'],                        categories: [] },
        { id: 'k8s',        label: 'Kubernetes',         level: 'advanced',     keywords: ['kubernetes', 'k8s'],                          categories: [] },
        { id: 'deploy',     label: 'Deployment',         level: 'advanced',     keywords: ['deployment', 'deploy'],                       categories: [] },
        { id: 'monitoring', label: 'Monitoring',         level: 'advanced',     keywords: ['monitoring', 'observability', 'prometheus'],  categories: [] }
      ]
    },

    /* ===================== 9. Cyber Security ===================== */
    {
      id: 'cyber',
      icon: '🔐',
      title: 'Cyber Security',
      desc: 'من أساسيات الشبكات إلى اختبار الاختراق',
      color: 'var(--rm-c-cyber, #ef4444)',
      stages: [
        { id: 'cs-fund',  label: 'Computer Fundamentals', level: 'beginner',     keywords: ['computer fundamentals', 'أساسيات الحاسب'],    categories: [] },
        { id: 'network',  label: 'Networking',            level: 'beginner',     keywords: ['networking', 'شبكات', 'ccna'],                categories: [] },
        { id: 'linux',    label: 'Linux',                 level: 'beginner',     keywords: ['linux', 'kali'],                              categories: [] },
        { id: 'sec-fund', label: 'Security Fundamentals', level: 'intermediate', keywords: ['security fundamental', 'أساسيات الأمن'],       categories: ['Cyber Security'] },
        { id: 'web-sec',  label: 'Web Security',          level: 'intermediate', keywords: ['web security', 'xss', 'sql injection'],       categories: [] },
        { id: 'ethical',  label: 'Ethical Hacking',       level: 'advanced',     keywords: ['ethical hacking', 'hacking', 'اختراق أخلاقي'], categories: [] },
        { id: 'owasp',    label: 'OWASP',                 level: 'advanced',     keywords: ['owasp', 'top 10'],                            categories: [] },
        { id: 'pentest',  label: 'Penetration Testing',   level: 'advanced',     keywords: ['penetration', 'pentest', 'اختبار اختراق'],     categories: [] },
        { id: 'sec-proj', label: 'Security Projects',     level: 'advanced',     keywords: ['security projects', 'مشاريع أمن'],            categories: [] }
      ]
    },

    /* ===================== 10. Mobile ===================== */
    {
      id: 'mobile',
      icon: '📱',
      title: 'Mobile Development',
      desc: 'تطوير تطبيقات الموبايل بـFlutter من الصفر للنشر',
      color: 'var(--rm-c-mobile, #a855f7)',
      stages: [
        { id: 'prog-basics', label: 'Programming Basics', level: 'beginner',     keywords: ['programming basics', 'أساسيات البرمجة'],      categories: [] },
        { id: 'mobile-fund', label: 'Mobile Fundamentals',level: 'beginner',     keywords: ['mobile fundamental', 'mobile basics'],        categories: ['Mobile App'] },
        { id: 'dart',        label: 'Dart',               level: 'beginner',     keywords: ['dart'],                                       categories: [] },
        { id: 'flutter',     label: 'Flutter',            level: 'intermediate', keywords: ['flutter'],                                    categories: [] },
        { id: 'ui-dev',      label: 'UI Development',     level: 'intermediate', keywords: ['ui development', 'widgets'],                  categories: [] },
        { id: 'state',       label: 'State Management',   level: 'advanced',     keywords: ['state management', 'provider', 'bloc', 'riverpod'], categories: [] },
        { id: 'apis',        label: 'APIs',               level: 'intermediate', keywords: ['api', 'rest'],                                categories: [] },
        { id: 'firebase',    label: 'Firebase',           level: 'intermediate', keywords: ['firebase', 'firestore'],                      categories: [] },
        { id: 'auth',        label: 'Authentication',     level: 'intermediate', keywords: ['auth', 'authentication'],                     categories: [] },
        { id: 'local',       label: 'Local Storage',      level: 'intermediate', keywords: ['local storage', 'sqflite', 'hive'],            categories: [] },
        { id: 'publish',     label: 'Publishing Apps',    level: 'advanced',     keywords: ['publish', 'app store', 'google play'],        categories: [] },
        { id: 'mobile-proj', label: 'Mobile Projects',    level: 'advanced',     keywords: ['mobile projects', 'مشاريع موبايل'],           categories: [] }
      ]
    },

    /* ===================== 11. Other / Misc ===================== */
    {
      id: 'misc',
      icon: '🎓',
      title: 'كورسات إضافية',
      desc: 'كورسات متنوعة في مجالات مختلفة',
      color: 'var(--rm-c-other, #64748b)',
      stages: []
    }
  ];

  /* ---------- Matching Engine (scored) ---------- */
  function scoreCourseStage(course, stage) {
    const title = normalizeText(course.title || '');
    const desc  = normalizeText(course.description || '');
    const cat   = String(course.category || '');
    let score = 0;

    if (Array.isArray(stage.categories) && stage.categories.length) {
      if (stage.categories.includes(cat)) score += 100;
    }

    if (Array.isArray(stage.keywords)) {
      for (const k of stage.keywords) {
        const kw = normalizeText(k);
        if (!kw) continue;
        const specificity = Math.min(kw.length * 4, 40);

        if (title === kw) {
          score += 90 + specificity;
        } else {
          /* ✅ v20.3: Word-boundary صارم بدل substring فضفاض.
             قبل كده "js advanced" كانت بتماتش جوه "node.js advanced" (النقطة مش boundary)،
             و"ml" (keyword قصير لمرحلة Machine Learning) كانت بتماتش جوه "html".
             شلنا الـ fallback اللي كان بيدي score عالي لأي substring حتى من غير boundary حقيقي —
             ده كان سبب رئيسي لتصنيف كورسات في مسار/مرحلة غلط. */
          const wordBoundary = new RegExp(`(^|\\s)${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
          if (wordBoundary.test(title)) {
            score += 75 + specificity;
          } else if (kw.length >= 5 && desc.includes(kw)) {
            score += 25 + specificity * 0.5;
          }
        }
      }
    }

    if (stage.level) {
      const courseLevel = detectLevel(course);
      if (courseLevel === stage.level) score += 15;
    }

    return score;
  }

  function findBestCourseForStage(courses, stage, usedIds) {
    let best = null;
    let bestScore = 0;
    for (const c of courses) {
      if (usedIds.has(c.id)) continue;
      const s = scoreCourseStage(c, stage);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (best && bestScore >= 25) return { course: best, score: bestScore };
    return null;
  }

  /* ---------- بناء المسارات من الـCatalog ---------- */
  let _catalogCacheKey = '';
  let _catalogCache = null;
  let _lastDebugInfo = null;

  /* ✅ v20.2: cache key أخف */
  function catalogCacheKey(courses) {
    return courses.length + '::' + courses.map((c) => c.id + ':' + (c.order ?? '')).join('|');
  }

  /* ✅ v20.1: بناء sub-paths منفصلة */
  function buildSubPathsFor(def, courses) {
    if (!def.subPaths || !def.subPaths.length) return { subPaths: [], courseIds: new Set() };

    const subPathCourseIds = new Set();

    const subPaths = def.subPaths.map((sp) => {
      const usedInSub = new Set();
      const steps = [];

      for (const stage of sp.stages) {
        const best = findBestCourseForStage(courses, stage, usedInSub);
        if (best) {
          usedInSub.add(best.course.id);
          subPathCourseIds.add(best.course.id);
          steps.push(mapCourseToStep(best.course, stage, steps.length, sp.stages.length));
        }
      }

      return {
        id: sp.id,
        label: sp.label,
        icon: sp.icon,
        steps
      };
    }).filter((sp) => sp.steps.length > 0);

    return { subPaths, courseIds: subPathCourseIds };
  }

  function buildRoadmapsFromCatalog() {
    const src = window.__NEXORA_CATALOG__ || { courses: [] };
    const courses = src.courses || [];
    if (!courses.length) return [];

    const key = catalogCacheKey(courses);
    if (key === _catalogCacheKey && _catalogCache) return _catalogCache;

    const usedGlobal = new Set();
    const debug = [];

    const result = ROADMAP_DEFINITIONS.map((def) => {
      const usedInThisPath = new Set();
      const steps = [];

      /* 1) أفضل match لكل stage في الـ Timeline الأساسي */
      for (const stage of def.stages) {
        const best = findBestCourseForStage(courses, stage, usedInThisPath);
        if (best) {
          usedInThisPath.add(best.course.id);
          usedGlobal.add(best.course.id);
          steps.push(mapCourseToStep(best.course, stage, steps.length, def.stages.length));
          debug.push({
            path: def.id,
            stage: stage.id,
            courseId: best.course.id,
            title: best.course.title,
            score: best.score
          });
        }
      }

      /* 2) sub-paths + مجموعة IDs بتاعتهم عشان نستثنيهم من leftovers */
      const { subPaths, courseIds: subPathCourseIds } = buildSubPathsFor(def, courses);
      subPathCourseIds.forEach((id) => usedGlobal.add(id));

      /* 3) leftovers: كورسات تابعة للمسار بس ماتمطّطتش ومش في sub-path */
      const leftovers = courses
        .filter((c) =>
          !usedInThisPath.has(c.id) &&
          !subPathCourseIds.has(c.id) &&   /* ✅ v20.2: منع التكرار */
          belongsToPathCategory(c, def)
        )
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      for (const c of leftovers) {
        usedInThisPath.add(c.id);
        usedGlobal.add(c.id);
        steps.push(mapCourseToStep(c, null, steps.length, def.stages.length));
        debug.push({ path: def.id, stage: '(leftover)', courseId: c.id, title: c.title, score: 0 });
      }

      return {
        id: def.id,
        icon: def.icon,
        title: def.title,
        desc: def.desc,
        color: def.color,
        steps,
        subPaths
      };
    }).filter((p) => p.steps.length > 0 || (p.subPaths && p.subPaths.length > 0));

    /* 4) orphans → misc */
    const orphans = courses.filter((c) => !usedGlobal.has(c.id));
    if (orphans.length) {
      orphans.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      const miscDef = ROADMAP_DEFINITIONS.find((d) => d.id === 'misc');
      const existing = result.find((r) => r.id === 'misc');
      const miscSteps = orphans.map((c, i) => mapCourseToStep(c, null, i, orphans.length));
      if (existing) {
        existing.steps.push(...miscSteps);
      } else {
        result.push({
          id: 'misc',
          icon: miscDef.icon,
          title: miscDef.title,
          desc: miscDef.desc,
          color: miscDef.color,
          steps: miscSteps,
          subPaths: []
        });
      }
    }

    _catalogCacheKey = key;
    _catalogCache = result;
    _lastDebugInfo = debug;
    console.info('[RM] ✅ اتبنى', result.length, 'مسار من',
      result.reduce((s, r) => s + r.steps.length, 0), 'كورس');
    return result;
  }

  function belongsToPathCategory(course, def) {
    const catMap = {
      frontend:    ['Frontend', 'HTML', 'CSS', 'JavaScript', 'Tailwind CSS', 'Bootstrap', 'React', 'Next.js'],
      backend:     ['Backend', 'Node.js'],
      fullstack:   ['Full Stack'],
      ai:          ['AI'],
      design:      ['UI/UX', 'Graphic Design', 'Video Editing'],
      data:        ['Data Analysis', 'Excel'],
      programming: ['Programming', 'Computer Science', 'CS'],
      devops:      ['DevOps', 'Cloud'],
      cyber:       ['Cyber Security'],
      mobile:      ['Mobile App'],
      misc:        []
    };
    const allowed = catMap[def.id] || [];
    return allowed.includes(String(course.category || ''));
  }

  /* ✅ v20.2: getStageLevel مستخدمة فعليًا */
  function mapCourseToStep(c, stage, stageIndex, totalSteps) {
    const title = c.title || '';
    const cat = c.category || '';
    const desc = c.description || '';
    const explicitLevel = detectLevel(c);
    const positionLevel = getStageLevel(stageIndex || 0, totalSteps || 0, explicitLevel);
    const level = stage && stage.level
      ? (explicitLevel !== 'beginner' ? explicitLevel : stage.level)
      : positionLevel;

    return {
      courseId: c.id,
      title,
      description: desc,
      category: cat,
      level,
      stageId: stage ? stage.id : null,
      stageLabel: stage ? stage.label : null,
      order: c.order ?? 999,
      cashPrice: c.cashPrice || 0,
      installmentAmount: c.installmentAmount || 0,
      installmentCount: c.installmentCount || 0,
      installmentTotal: c.installmentTotal || 0
    };
  }

  /* ✅ v20.2: بتقبل currentIdx كـ param اختياري لتجنب O(n²) */
  function getCourseStatus(rm, idx, currentIdx) {
    const p = progress[rm.id] || {};
    if (p[idx]) return 'completed';
    const ci = (typeof currentIdx === 'number') ? currentIdx : getCurrentStepIndex(rm);
    if (idx === ci) return 'current';
    if (ci !== -1 && idx > ci) return 'locked';
    return 'available';
  }

  /* ---------- حالة ---------- */
  let currentUser = null;
  let progress = {};
  let ROADMAPS = [];
  let activeTabId = null;
  let loadState = 'idle';
  let loadError = '';
  let authUnsub = null;

  /* ---------- أنماط ---------- */
  const STYLES = `
:root{
  --rm-c-frontend:#4f7cff; --rm-c-backend:#22c55e; --rm-c-fullstack:#f0b53e;
  --rm-c-design:#ec4899;   --rm-c-mobile:#a855f7;  --rm-c-data:#06b6d4;
  --rm-c-ai:#8b5cf6;       --rm-c-cyber:#ef4444;   --rm-c-other:#64748b;
  --rm-c-prog:#a855f7;     --rm-c-devops:#0ea5e9;
  --rm-lv-beginner:#22c55e; --rm-lv-intermediate:#f0b53e; --rm-lv-advanced:#ef4444;
}
.rm-wrap{max-width:1000px;margin:0 auto;padding-bottom:40px}
.rm-header{padding:4px 0 20px}
.rm-header h2{font-size:24px;font-weight:900;margin-bottom:6px}
.rm-header p{font-size:13.5px;color:var(--mut,#9c9cab);line-height:1.8}
.rm-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:24px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.rm-tab{white-space:nowrap;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:14px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.rm-tab:hover{color:var(--ink,#ececf1);border-color:#4f7cff66}
.rm-tab:focus-visible{outline:2px solid #4f7cff;outline-offset:2px}
.rm-tab.active{background:linear-gradient(135deg,#4f7cff,#7c5cff);border-color:transparent;color:#fff}
.rm-tab .rm-tab-count{font-size:10.5px;font-weight:700;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:999px}
.rm-hero{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:20px;padding:26px;margin-bottom:24px;position:relative;overflow:hidden}
.rm-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 100% 0%,var(--hero-color,#4f7cff)22,transparent 60%);pointer-events:none;opacity:.15}
.rm-hero-content{position:relative;z-index:1}
.rm-hero-icon{font-size:44px;margin-bottom:10px;line-height:1}
.rm-hero-title{font-size:24px;font-weight:900;margin-bottom:6px}
.rm-hero-desc{font-size:14px;color:var(--mut,#9c9cab);line-height:1.8;max-width:600px}
.rm-hero-meta{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.rm-chip{font-size:11.5px;font-weight:700;padding:5px 14px;border-radius:999px;display:inline-flex;align-items:center;gap:6px}
.rm-chip.prog{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.rm-chip.count{color:#7ea2ff;background:rgba(79,124,255,.1);border:1px solid rgba(79,124,255,.3)}
.rm-progress-bar{height:6px;background:var(--bg,#0a0a0d);border-radius:999px;overflow:hidden;margin-top:14px;border:1px solid var(--edge,#212129)}
.rm-progress-fill{height:100%;background:linear-gradient(90deg,#4ade80,#22c55e);border-radius:999px;transition:width .4s ease}

.rm-current{
  background:linear-gradient(135deg,rgba(79,124,255,.15),rgba(240,181,62,.1));
  border:1px solid rgba(79,124,255,.35);
  border-radius:18px;padding:18px 20px;margin-bottom:20px;
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;
  position:relative;overflow:hidden;
}
.rm-current::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 0% 0%,rgba(79,124,255,.2),transparent 60%);pointer-events:none}
.rm-current-content{position:relative;z-index:1;display:flex;align-items:center;gap:14px;flex-wrap:wrap;width:100%}
.rm-current-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#4f7cff,#7c5cff);display:grid;place-items:center;font-size:22px;flex-shrink:0;color:#fff}
.rm-current-text{flex-grow:1;min-width:200px}
.rm-current-label{font-size:11px;font-weight:700;color:#7ea2ff;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.rm-current-title{font-size:16px;font-weight:800;line-height:1.3}
.rm-current-actions{display:flex;gap:8px;flex-wrap:wrap}

.rm-complete{
  background:linear-gradient(135deg,rgba(74,222,128,.15),rgba(240,181,62,.1));
  border:1px solid rgba(74,222,128,.4);
  border-radius:20px;padding:28px 24px;margin-bottom:24px;
  text-align:center;position:relative;overflow:hidden;
  animation:rmPop .5s cubic-bezier(.34,1.56,.64,1);
}
@keyframes rmPop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
.rm-complete-icon{font-size:56px;line-height:1;margin-bottom:12px}
.rm-complete-title{font-size:22px;font-weight:900;margin-bottom:8px;background:linear-gradient(135deg,#4ade80,#f0b53e);-webkit-background-clip:text;background-clip:text;color:transparent}
.rm-complete-desc{font-size:13.5px;color:var(--mut,#9c9cab);line-height:1.7;margin-bottom:16px}
.rm-complete-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}

.rm-steps{position:relative;padding-inline-start:34px;list-style:none;margin:0}
.rm-steps::before{content:'';position:absolute;inset-inline-start:11px;top:24px;bottom:24px;width:2px;background:linear-gradient(180deg,var(--hero-color,#4f7cff)44,var(--edge,#212129))}
.rm-step{position:relative;margin-bottom:16px}
.rm-step-dot{position:absolute;inset-inline-start:-34px;top:24px;width:24px;height:24px;border-radius:50%;background:var(--bg,#0a0a0d);border:2px solid var(--edge2,#2e2e39);display:grid;place-items:center;font-size:11px;font-weight:800;color:var(--dim,#66666f);z-index:1;transition:.2s}
.rm-step.done .rm-step-dot{background:#4ade80;border-color:#4ade80;color:#052e12}
.rm-step.current .rm-step-dot{border-color:#4f7cff;background:rgba(79,124,255,.15);color:#4f7cff;animation:rmPulse 1.8s infinite}
@keyframes rmPulse{0%,100%{box-shadow:0 0 0 0 rgba(79,124,255,.5)}50%{box-shadow:0 0 0 6px rgba(79,124,255,0)}}
.rm-step.locked .rm-step-card{opacity:.55;filter:saturate(.6)}
.rm-step.locked .rm-step-dot{color:var(--dim,#66666f)}
.rm-step-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:16px;padding:18px 20px;transition:.2s;position:relative;overflow:hidden}
.rm-step-card:hover{border-color:var(--hero-color,#4f7cff)}
.rm-step.done .rm-step-card{border-color:rgba(74,222,128,.35)}
.rm-step.current .rm-step-card{border-color:rgba(79,124,255,.55);box-shadow:0 0 0 1px rgba(79,124,255,.2),0 8px 24px rgba(79,124,255,.1)}
.rm-step-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.rm-step-num{font-size:10.5px;font-weight:800;color:var(--dim,#66666f);text-transform:uppercase;letter-spacing:.5px}
.rm-step-status{font-size:10.5px;font-weight:800}
.rm-step-status.done{color:#4ade80}
.rm-step-status.current{color:#7ea2ff}
.rm-step-status.locked{color:var(--dim,#66666f)}
.rm-step-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.rm-step-cat{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);color:#7ea2ff}
.rm-step-stage{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.3);color:#a78bfa}
.rm-step-level{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.rm-step-title{flex:1;font-size:15px;font-weight:800;line-height:1.5;min-width:180px}
.rm-step-desc{font-size:12.5px;color:var(--mut,#9c9cab);line-height:1.7;margin-bottom:12px}
.rm-step-prices{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;font-size:12.5px;align-items:baseline}
.rm-price-cash{font-size:16px;font-weight:900;color:#4ade80}
.rm-price-inst{color:var(--mut,#9c9cab);font-size:11.5px}
.rm-step-actions{display:flex;gap:8px;flex-wrap:wrap}
.rm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;padding:0 16px;border-radius:11px;font-size:12.5px;font-weight:700;cursor:pointer;border:none;font-family:inherit;text-decoration:none;transition:.15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.rm-btn:focus-visible{outline:2px solid #4f7cff;outline-offset:2px}
.rm-btn.open{background:var(--hero-color,#4f7cff);color:#fff}
.rm-btn.open:hover{opacity:.9}
.rm-btn.open.is-locked{background:rgba(255,255,255,.06);color:var(--mut,#9c9cab)}
.rm-btn.done-btn{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.35);color:#4ade80}
.rm-btn.done-btn:hover{background:rgba(74,222,128,.2)}
.rm-btn.undone-btn{background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3);color:#f0b53e}
.rm-btn.wa{background:#25D366;color:#04310f}
.rm-btn[aria-busy="true"]{opacity:.6;pointer-events:none}
.rm-empty{text-align:center;padding:60px 20px;background:var(--panel,#101015);border:1px dashed var(--edge2,#2e2e39);border-radius:20px}
.rm-empty .rm-empty-icon{font-size:52px;margin-bottom:14px}
.rm-empty .rm-empty-title{font-size:18px;font-weight:800;margin-bottom:8px}
.rm-empty .rm-empty-desc{font-size:13.5px;color:var(--mut,#9c9cab);line-height:1.8;margin-bottom:16px}
.rm-empty .rm-empty-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dim,#66666f);background:var(--bg,#0a0a0d);padding:6px 10px;border-radius:8px;display:inline-block;margin-bottom:16px;border:1px solid var(--edge,#212129)}
.rm-state-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.rm-guest{background:rgba(79,124,255,.08);border:1px solid rgba(79,124,255,.3);color:#7ea2ff;padding:12px 16px;border-radius:12px;font-size:12.5px;font-weight:600;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rm-guest a{color:#7ea2ff;text-decoration:underline;font-weight:700}
.rm-skel{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:16px;padding:20px;margin-bottom:16px}
.rm-skel-line{height:12px;background:linear-gradient(90deg,var(--edge,#212129),var(--raise,#16161d),var(--edge,#212129));background-size:200% 100%;border-radius:6px;animation:rmShimmer 1.4s infinite}
.rm-skel-line.w-40{width:40%} .rm-skel-line.w-70{width:70%} .rm-skel-line.w-90{width:90%}
.rm-skel-line+.rm-skel-line{margin-top:10px}
@keyframes rmShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* ✅ v20.1/v20.2: Sub-Paths */
.rm-subpaths{margin-top:32px;padding-top:24px;border-top:1px solid var(--edge,#212129)}
.rm-subpaths-title{font-size:16px;font-weight:800;margin-bottom:4px}
.rm-subpaths-desc{font-size:12.5px;color:var(--mut,#9c9cab);margin-bottom:16px}
.rm-subpath{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:14px;padding:16px 18px;margin-bottom:12px}
.rm-subpath-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.rm-subpath-icon{font-size:22px;line-height:1}
.rm-subpath-label{font-size:14px;font-weight:800;flex:1;min-width:120px}
.rm-subpath-count{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);color:#7ea2ff}
.rm-subpath-steps{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.rm-substep{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);flex-wrap:wrap}
.rm-substep-num{font-size:11px;font-weight:800;color:var(--dim,#66666f);flex-shrink:0}
.rm-substep-title{flex:1;font-size:13px;font-weight:600;min-width:120px}
.rm-substep-btn{height:32px;padding:0 12px;font-size:11.5px;flex-shrink:0}

@media (max-width:640px){
  .rm-header h2{font-size:20px}
  .rm-hero{padding:20px}
  .rm-hero-title{font-size:19px}
  .rm-hero-icon{font-size:36px}
  .rm-current{padding:14px 16px}
  .rm-current-icon{width:42px;height:42px;font-size:20px}
  .rm-current-title{font-size:14.5px}
  .rm-current-actions{width:100%}
  .rm-current-actions .rm-btn{flex:1}
  .rm-complete{padding:22px 18px}
  .rm-complete-title{font-size:18px}
  .rm-complete-icon{font-size:44px}
  .rm-step-card{padding:14px 16px}
  .rm-step-title{font-size:14px}
  .rm-step-actions{flex-direction:column}
  .rm-btn{width:100%;min-height:44px}
  .rm-tab{padding:9px 14px;font-size:12px}
  .rm-substep-btn{width:100%;min-height:40px}
  .rm-substep-title{min-width:0;width:100%}
}
@media (prefers-reduced-motion:reduce){
  .rm-progress-fill,.rm-step-dot,.rm-step-card,.rm-tab,.rm-btn{transition:none!important}
  .rm-skel-line{animation:none}
  .rm-step.current .rm-step-dot{animation:none}
  .rm-complete{animation:none}
}
`;

  /* ---------- DOM Setup ---------- */
  function ensureRoadmapDOM() {
    if (qs('#view-roadmap')) return true;
    const main = qs('main#content') || qs('main');
    if (!main) { console.warn('[RM] main مش موجود — هستنى'); return false; }
    if (!document.getElementById('nexRoadmapStyles')) {
      const st = document.createElement('style');
      st.id = 'nexRoadmapStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }
    const section = document.createElement('section');
    section.id = 'view-roadmap';
    section.className = 'hidden';
    section.setAttribute('aria-label', 'خرائط التعلم');
    section.innerHTML = '<div class="rm-wrap" id="rmInner"></div>';
    main.appendChild(section);
    console.info('[RM] ✅ #view-roadmap اتعمل');
    return true;
  }

  /* ---------- Progress (Firestore) ---------- */
  async function loadProgress() {
    if (!currentUser) { progress = {}; loadState = 'ready'; return; }
    loadState = 'loading';
    loadError = '';
    try {
      const docSnap = await db.collection('roadmapProgress').doc(currentUser.uid).get();
      progress = (docSnap.exists && docSnap.data().steps) ? docSnap.data().steps : {};
      loadState = 'ready';
    } catch (e) {
      console.warn('[RM] تحميل التقدم:', e.code);
      progress = {};
      loadState = 'error';
      loadError = e.code || 'unknown';
    }
  }

  async function saveStep(roadmapId, idx, on) {
    progress[roadmapId] = progress[roadmapId] || {};
    progress[roadmapId][idx] = on;
    if (!currentUser) return { ok: false, reason: 'guest' };
    try {
      await db.collection('roadmapProgress').doc(currentUser.uid).set(
        { steps: progress }, { merge: true }
      );
      return { ok: true };
    } catch (e) {
      console.warn('[RM] حفظ التقدم:', e.code);
      return { ok: false, reason: e.code };
    }
  }

  function getPathProgress(rm) {
    const p = progress[rm.id] || {};
    const done = rm.steps.filter((_, i) => p[i]).length;
    const total = rm.steps.length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function getCurrentStepIndex(rm) {
    const p = progress[rm.id] || {};
    for (let i = 0; i < rm.steps.length; i++) {
      if (!p[i]) return i;
    }
    return -1;
  }

  /* ---------- Render: Tabs ---------- */
  function tabsHTML() {
    return '<div class="rm-tabs" role="tablist" aria-label="مسارات التعلم">' +
      ROADMAPS.map((rm) => {
        const pr = getPathProgress(rm);
        const selected = rm.id === activeTabId;
        return '<button type="button" class="rm-tab ' + (selected ? 'active' : '') + '"' +
          ' role="tab" aria-selected="' + selected + '"' +
          ' tabindex="' + (selected ? '0' : '-1') + '"' +
          ' data-rm-tab="' + esc(rm.id) + '"' +
          ' id="rmtab-' + esc(rm.id) + '"' +
          ' aria-controls="rmpanel-' + esc(rm.id) + '">' +
          '<span aria-hidden="true">' + rm.icon + '</span>' +
          '<span>' + esc(rm.title) + '</span>' +
          '<span class="rm-tab-count" aria-label="' + pr.done + ' من ' + pr.total + ' مكتمل">' + pr.done + '/' + pr.total + '</span>' +
        '</button>';
      }).join('') + '</div>';
  }

  /* ---------- Render: Hero ---------- */
  function heroHTML(rm) {
    const pr = getPathProgress(rm);
    return '<div class="rm-hero" style="--hero-color:' + rm.color + '">' +
      '<div class="rm-hero-content">' +
        '<div class="rm-hero-icon" aria-hidden="true">' + rm.icon + '</div>' +
        '<h2 class="rm-hero-title">' + esc(rm.title) + '</h2>' +
        '<p class="rm-hero-desc">' + esc(rm.desc) + '</p>' +
        '<div class="rm-hero-meta">' +
          '<span class="rm-chip count">📚 ' + rm.steps.length + ' كورس</span>' +
          '<span class="rm-chip prog" aria-live="polite">✅ تقدّمك: ' + pr.done + '/' + pr.total + ' (' + pr.pct + '%)</span>' +
        '</div>' +
        '<div class="rm-progress-bar" role="progressbar" aria-valuenow="' + pr.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="تقدّم المسار">' +
          '<div class="rm-progress-fill" style="width:' + pr.pct + '%"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Render: Current Step ---------- */
  function currentStepHTML(rm) {
    const idx = getCurrentStepIndex(rm);
    if (idx === -1) return '';

    const step = rm.steps[idx];
    return '<div class="rm-current">' +
      '<div class="rm-current-content">' +
        '<div class="rm-current-icon" aria-hidden="true"><i class="bi bi-play-fill"></i></div>' +
        '<div class="rm-current-text">' +
          '<div class="rm-current-label">🎯 الكورس التالي</div>' +
          '<div class="rm-current-title">' + esc(step.title) + '</div>' +
        '</div>' +
        '<div class="rm-current-actions">' +
          '<a class="rm-btn open" href="library.html" data-rm-open="' + esc(step.courseId) + '">' +
            '<i class="bi bi-play-circle" aria-hidden="true"></i>ابدأ الآن' +
          '</a>' +
          '<button type="button" class="rm-btn done-btn" data-rm-done="' + esc(rm.id) + '" data-rm-idx="' + idx + '">' +
            '<i class="bi bi-check2-circle" aria-hidden="true"></i>حدد كمكتمل' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Render: Completion Celebration ---------- */
  function completionHTML(rm) {
    return '<div class="rm-complete" role="status">' +
      '<div class="rm-complete-icon" aria-hidden="true">🎉</div>' +
      '<div class="rm-complete-title">مبروك! أكملت مسار ' + esc(rm.title) + '</div>' +
      '<p class="rm-complete-desc">خلصت كل الكورسات في المسار ده. جاهز للتحدي اللي بعده؟</p>' +
      '<div class="rm-complete-actions">' +
        '<a href="library.html" class="rm-btn open">' +
          '<i class="bi bi-grid-3x3-gap" aria-hidden="true"></i>تصفح كورسات تانية' +
        '</a>' +
        '<button type="button" class="rm-btn wa" data-rm-share="' + esc(rm.id) + '">' +
          '<i class="bi bi-whatsapp" aria-hidden="true"></i>شارك إنجازك' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  /* ---------- Render: Step ---------- */
  function stepHTML(rm, step, i, currentIdx) {
    /* ✅ v20.2: نستخدم getCourseStatus */
    const status = getCourseStatus(rm, i, currentIdx);
    const done = status === 'completed';
    const isCurrent = status === 'current';
    const isLocked = status === 'locked';

    let cls = '';
    if (done) cls = 'done';
    else if (isCurrent) cls = 'current';
    else if (isLocked) cls = 'locked';

    const dot = done ? '✓' : (i + 1);
    const num = String(i + 1).padStart(2, '0');

    const levelColor = LEVEL_COLOR[step.level] || 'var(--mut, #9c9cab)';
    const levelHTML = step.level
      ? '<span class="rm-step-level" style="color:' + levelColor + ';border-color:' + levelColor + '40;background:' + levelColor + '15;">'
        + esc(LEVEL_LABEL[step.level] || step.level) + '</span>'
      : '';

    /* ✅ v20.2: نعرض stageLabel لو موجودة */
    const stageHTML = step.stageLabel
      ? '<span class="rm-step-stage">' + esc(step.stageLabel) + '</span>'
      : '';

    /* ✅ v20.3: status label بجانب رقم المرحلة (مطابق للـ Expected UX) */
    const statusLabel = done
      ? '<span class="rm-step-status done">✓ مكتمل</span>'
      : (isCurrent
        ? '<span class="rm-step-status current">▶ ابدأ الآن</span>'
        : (isLocked
          ? '<span class="rm-step-status locked">🔒 لاحقًا</span>'
          : ''));

    const openLabel = done ? 'افتح تاني' : (isCurrent ? 'ابدأ الآن' : (isLocked ? '🔒 لاحقًا' : 'افتح الكورس'));

    const actions =
      '<a class="rm-btn open' + (isLocked ? ' is-locked' : '') + '" href="library.html" data-rm-open="' + esc(step.courseId) + '"' +
        (isLocked ? ' aria-label="' + esc(step.title) + ' — متاح بعد إكمال المرحلة السابقة، اضغط لفتحه الآن على أي حال"' : '') + '>' +
        '<i class="bi bi-play-circle" aria-hidden="true"></i>' + openLabel +
      '</a>' +
      '<a class="rm-btn wa" href="' + waLinkFor(step.title) + '" target="_blank" rel="noopener noreferrer">' +
        '<i class="bi bi-whatsapp" aria-hidden="true"></i>اشترك' +
      '</a>' +
      (done
        ? '<button type="button" class="rm-btn undone-btn" data-rm-undone="' + esc(rm.id) + '" data-rm-idx="' + i + '">' +
            '<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>إلغاء الإكمال' +
          '</button>'
        : '<button type="button" class="rm-btn done-btn" data-rm-done="' + esc(rm.id) + '" data-rm-idx="' + i + '">' +
            '<i class="bi bi-check2-circle" aria-hidden="true"></i>حدد كمكتمل' +
          '</button>'
      );

    const instText = step.installmentCount
      ? fmtNum(step.installmentAmount) + ' × ' + step.installmentCount + ' = ' + fmtNum(step.installmentTotal) + ' جنيه'
      : '';

    return '<li class="rm-step ' + cls + '">' +
      '<span class="rm-step-dot" aria-hidden="true">' + dot + '</span>' +
      '<div class="rm-step-card">' +
        '<div class="rm-step-head">' +
          '<span class="rm-step-num">' + num + ' — المرحلة</span>' +
          statusLabel +
          '<div class="rm-step-tags">' +
            stageHTML +
            (step.category ? '<span class="rm-step-cat">' + esc(step.category) + '</span>' : '') +
            levelHTML +
          '</div>' +
        '</div>' +
        '<h3 class="rm-step-title">' + esc(step.title) + '</h3>' +
        (step.description ? '<p class="rm-step-desc">' + esc(step.description) + '</p>' : '') +
        (step.cashPrice
          ? '<div class="rm-step-prices">' +
              '<span class="rm-price-cash">' + fmtNum(step.cashPrice) + ' جنيه</span>' +
              (instText ? '<span class="rm-price-inst">أو ' + instText + '</span>' : '') +
            '</div>'
          : '') +
        '<div class="rm-step-actions">' + actions + '</div>' +
      '</div>' +
    '</li>';
  }

  /* ---------- Render: Sub-Paths ---------- */
  /* ✅ v20.2: شيلنا isDone الوهمي + role="list" */
  function subPathsHTML(rm) {
    if (!rm.subPaths || !rm.subPaths.length) return '';

    return '<div class="rm-subpaths">' +
      '<h3 class="rm-subpaths-title">🔀 مسارات بديلة</h3>' +
      '<p class="rm-subpaths-desc">تقنيات Backend تانية — كل واحدة مسار مستقل</p>' +
      rm.subPaths.map((sp) => {
        return '<div class="rm-subpath">' +
          '<div class="rm-subpath-head">' +
            '<span class="rm-subpath-icon" aria-hidden="true">' + sp.icon + '</span>' +
            '<h4 class="rm-subpath-label">' + esc(sp.label) + '</h4>' +
            '<span class="rm-subpath-count">' + sp.steps.length + ' كورس</span>' +
          '</div>' +
          '<ol class="rm-subpath-steps" role="list">' +
            sp.steps.map((s, i) => {
              return '<li class="rm-substep">' +
                '<span class="rm-substep-num">' + String(i + 1).padStart(2, '0') + '</span>' +
                '<span class="rm-substep-title">' + esc(s.title) + '</span>' +
                '<a class="rm-btn open rm-substep-btn" href="library.html" data-rm-open="' + esc(s.courseId) + '">' +
                  '<i class="bi bi-play-circle" aria-hidden="true"></i>افتح' +
                '</a>' +
              '</li>';
            }).join('') +
          '</ol>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  /* ---------- Render: Roadmap ---------- */
  function renderRoadmap(rmId) {
    const rm = ROADMAPS.find((r) => r.id === rmId) || ROADMAPS[0];
    if (!rm) return;
    activeTabId = rm.id;

    try {
      const next = '#roadmap/' + rm.id;
      if (location.hash !== next) history.replaceState(null, '', next);
    } catch { /* Safari file:// */ }

    const inner = qs('#rmInner');
    if (!inner) return;
    const detail = qs('#rmDetail', inner) || inner;

    const currentIdx = getCurrentStepIndex(rm);
    const allDone = currentIdx === -1 && rm.steps.length > 0;

    detail.innerHTML =
      heroHTML(rm) +
      (allDone ? completionHTML(rm) : currentStepHTML(rm)) +
      /* ✅ v20.3: شلنا تكرار role (كان فيه role="list" و role="tabpanel" على نفس العنصر —
         الـ HTML بيتجاهل التاني فعليًا فالـ tabpanel role كان مش شغال أصلًا). <ol> أصلًا list بطبعه. */
      '<ol class="rm-steps" id="rmpanel-' + esc(rm.id) + '" role="tabpanel" aria-labelledby="rmtab-' + esc(rm.id) + '">' +
        rm.steps.map((s, i) => stepHTML(rm, s, i, currentIdx)).join('') +
      '</ol>' +
      subPathsHTML(rm);
  }

  /* ---------- Render: States ---------- */
  function skeletonHTML() {
    return '<div class="rm-skel"><div class="rm-skel-line w-40"></div><div class="rm-skel-line w-90"></div><div class="rm-skel-line w-70"></div></div>' +
           '<div class="rm-skel"><div class="rm-skel-line w-40"></div><div class="rm-skel-line w-90"></div><div class="rm-skel-line w-70"></div></div>' +
           '<div class="rm-skel"><div class="rm-skel-line w-40"></div><div class="rm-skel-line w-90"></div><div class="rm-skel-line w-70"></div></div>';
  }
  function emptyHTML() {
    return '<div class="rm-empty">' +
      '<div class="rm-empty-icon" aria-hidden="true">🗺️</div>' +
      '<p class="rm-empty-title">مفيش مسارات لسه</p>' +
      '<p class="rm-empty-desc">لما نضيف كورسات، المسارات هتظهر هنا تلقائيًا</p>' +
    '</div>';
  }
  /* ✅ v20.2: نعرض loadError */
  function errorHTML() {
    return '<div class="rm-empty" role="alert">' +
      '<div class="rm-empty-icon" aria-hidden="true">⚠️</div>' +
      '<p class="rm-empty-title">مش قادرين نحمّل تقدّمك</p>' +
      '<p class="rm-empty-desc">حصلت مشكلة في الاتصال. جرّب تاني — تقدّمك محفوظ على السحابة.</p>' +
      (loadError ? '<div class="rm-empty-code">' + esc(loadError) + '</div>' : '') +
      '<div class="rm-state-actions">' +
        '<button type="button" class="rm-btn open" data-rm-retry><i class="bi bi-arrow-clockwise"></i>حاول تاني</button>' +
      '</div>' +
    '</div>';
  }
  function guestBannerHTML() {
    if (currentUser) return '';
    return '<div class="rm-guest" role="status">' +
      '<i class="bi bi-info-circle" aria-hidden="true"></i>' +
      '<span>سجّل دخولك عشان تقدّمك يتحفظ وترجع تكمل من حيث ما وقفت.</span>' +
      '<a href="auth.html">تسجيل الدخول</a>' +
    '</div>';
  }

  /* ---------- Render: All ---------- */
  function renderAll() {
    const inner = qs('#rmInner');
    if (!inner) return;

    if (loadState === 'loading') {
      inner.innerHTML = '<div class="rm-header"><h2>خرائط التعلم 🗺️</h2><p>بنجهّز مساراتك…</p></div>' + skeletonHTML();
      return;
    }
    if (loadState === 'error') { inner.innerHTML = errorHTML(); return; }
    if (!ROADMAPS.length) { inner.innerHTML = emptyHTML(); return; }

    inner.innerHTML =
      '<div class="rm-header">' +
        '<h2>خرائط التعلم 🗺️</h2>' +
        '<p>مسارات مرتبة بخطوات واضحة — اختار مسارك وابدأ، وتقدّمك بيتحفظ معاك</p>' +
      '</div>' +
      guestBannerHTML() +
      tabsHTML() +
      '<div id="rmDetail"></div>';

    renderRoadmap(activeTabId || ROADMAPS[0].id);
  }

  /* ---------- Event Delegation ---------- */
  function bindInnerEvents() {
    const inner = qs('#rmInner');
    if (!inner || inner.__rmBound) return;
    inner.__rmBound = true;

    inner.addEventListener('click', async (e) => {
      const tab = e.target.closest('[data-rm-tab]');
      if (tab) {
        const id = tab.dataset.rmTab;
        if (id && id !== activeTabId) {
          activeTabId = id;
          qsa('[data-rm-tab]', inner).forEach((t) => {
            const sel = t.dataset.rmTab === id;
            t.classList.toggle('active', sel);
            t.setAttribute('aria-selected', String(sel));
            t.setAttribute('tabindex', sel ? '0' : '-1');
          });
          renderRoadmap(id);
          const detail = qs('#rmDetail', inner);
          if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      if (e.target.closest('[data-rm-retry]')) {
        loadState = 'loading';
        renderAll();
        await loadProgress();
        renderAll();
        return;
      }

      const doneBtn = e.target.closest('[data-rm-done]');
      if (doneBtn) {
        const rmId = doneBtn.dataset.rmDone;
        const idx = Number(doneBtn.dataset.rmIdx);
        doneBtn.setAttribute('aria-busy', 'true');
        const res = await saveStep(rmId, idx, true);
        if (!res.ok && res.reason === 'guest') {
          alert('سجّل دخولك الأول عشان نحفظ تقدّمك.');
        }
        /* ✅ v20.2: renderAll كفاية — مفيش استدعاء مكرر لـ renderRoadmap */
        renderAll();
        return;
      }

      const undoneBtn = e.target.closest('[data-rm-undone]');
      if (undoneBtn) {
        const rmId = undoneBtn.dataset.rmUndone;
        const idx = Number(undoneBtn.dataset.rmIdx);
        undoneBtn.setAttribute('aria-busy', 'true');
        const res = await saveStep(rmId, idx, false);
        if (!res.ok && res.reason === 'guest') {
          alert('سجّل دخولك الأول عشان نحفظ تقدّمك.');
        }
        renderAll();
        return;
      }

      const shareBtn = e.target.closest('[data-rm-share]');
      if (shareBtn) {
        const rm = ROADMAPS.find((r) => r.id === shareBtn.dataset.rmShare);
        if (rm) {
          const phone = (window.MCL && MCL.CONTACT_PHONE) || '01096295395';
          const intl = String(phone).replace(/^0/, '20');
          const text = `🎉 أكملت مسار ${rm.title} على Nexora Academy!`;
          window.open(`https://wa.me/${intl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      const openBtn = e.target.closest('[data-rm-open]');
      if (openBtn) {
        const courseId = openBtn.dataset.rmOpen;
        if (typeof window.openCourse === 'function') {
          e.preventDefault();
          try { window.openCourse(courseId); return; } catch (err) { console.warn('[RM] openCourse:', err); }
        }
      }
    });

    inner.addEventListener('keydown', (e) => {
      const tab = e.target.closest('[data-rm-tab]');
      if (!tab) return;
      const tabs = qsa('[data-rm-tab]', inner);
      const idx = tabs.indexOf(tab);
      if (idx === -1) return;
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else if (e.key === 'Enter' || e.key === ' ') { tab.click(); return; }
      if (next >= 0) { e.preventDefault(); tabs[next].focus(); }
    });
  }

  /* ---------- Sidebar ---------- */
  function ensureNavEntry() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:roadmap"]')) return;
    const cat = qs('[data-nav="view:catalog"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:roadmap';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-signpost-split text-[13.5px] w-4 text-center shrink-0" aria-hidden="true"></i>' +
                    '<span class="grow text-start truncate">خرائط التعلم</span>';
    if (cat) cat.after(btn);
    else nav.appendChild(btn);
  }

  function bindRoadmapNavOnce() {
    if (document.__rmNavBound) return;
    document.__rmNavBound = true;
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-nav="view:roadmap"]');
      if (!b) return;
      e.preventDefault();
      await activateRoadmapView();
    });
  }

  async function activateRoadmapView() {
    if (!qs('#view-roadmap')) ensureRoadmapDOM();
    qsa('main#content > section:not(#view-roadmap)').forEach((s) => s.classList.add('hidden'));
    const v = qs('#view-roadmap');
    if (v) v.classList.remove('hidden');
    const pt = qs('#pageTitle'); if (pt) pt.textContent = 'خرائط التعلم';
    const ps = qs('#pageSub');   if (ps) ps.textContent = 'اختار مسارك واتبع الخطوات';
    window.scrollTo(0, 0);
    const sb = qs('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = qs('#overlay'); if (ov) ov.classList.add('hidden');

    const hash = (location.hash || '').replace(/^#roadmap\//, '');
    if (hash && ROADMAPS.find((r) => r.id === hash)) activeTabId = hash;

    renderAll();
    await loadProgress();
    renderAll();
  }

  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__rmObserver) return;
    nav.__rmObserver = new MutationObserver(() => ensureNavEntry());
    nav.__rmObserver.observe(nav, { childList: true });
  }

  /* ---------- Boot ---------- */
  function rebuildRoadmaps() {
    const before = ROADMAPS.length;
    ROADMAPS = buildRoadmapsFromCatalog();
    if (!ROADMAPS.length) {
      console.info('[RM] مفيش كورسات — هستنى الكتالوج');
      return;
    }
    if (!activeTabId || !ROADMAPS.find((r) => r.id === activeTabId)) {
      activeTabId = ROADMAPS[0].id;
    }
    console.info('[RM] ✅ اتبنى', ROADMAPS.length, 'مسار (' + before + '→' + ROADMAPS.length + ') من',
                 ROADMAPS.reduce((s, r) => s + r.steps.length, 0), 'كورس');
  }

  function tryConsumeCatalog() {
    if (window.__NEXORA_CATALOG__ && (window.__NEXORA_CATALOG__.courses || []).length) {
      console.info('[RM] الكتالوج موجود مسبقًا — نبنيه فورًا');
      rebuildRoadmaps();
      if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) {
        renderAll();
      }
      return true;
    }
    return false;
  }

  function boot() {
    ensureRoadmapDOM();
    ensureNavEntry();
    bindInnerEvents();
    bindRoadmapNavOnce();
    observeSideNav();

    rebuildRoadmaps();
    tryConsumeCatalog();

    if (authUnsub) { try { authUnsub(); } catch {} }
    authUnsub = auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      ensureNavEntry();
      if (user) {
        loadState = 'loading';
        renderAll();
        await loadProgress();
        renderAll();
      } else {
        progress = {};
        loadState = 'ready';
        if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
      }
    });
  }

  /* Catalog events */
  window.addEventListener('nexora:catalog-ready', () => {
    console.info('[RM] الكتالوج جاهز — نعيد بناء المسارات');
    rebuildRoadmaps();
    if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
  });
  window.addEventListener('nexora:catalog-update', () => {
    rebuildRoadmaps();
    if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
  });

  /* Deep-link */
  window.addEventListener('hashchange', () => {
    const m = (location.hash || '').match(/^#roadmap\/(.+)$/);
    if (m && ROADMAPS.find((r) => r.id === m[1])) {
      if (!qs('#view-roadmap') || qs('#view-roadmap').classList.contains('hidden')) {
        activateRoadmapView();
      } else if (m[1] !== activeTabId) {
        activeTabId = m[1];
        renderAll();
      }
    }
  });

  function waitForDOM(retries = 50) {
    const main = qs('main#content') || qs('main');
    const nav = qs('#sideNav');
    if (main && nav) { console.info('[RM] DOM جاهز — boot'); boot(); return; }
    if (retries <= 0) { console.warn('[RM] DOM مش جاهز — boot'); boot(); return; }
    setTimeout(() => waitForDOM(retries - 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForDOM(), { once: true });
  } else {
    waitForDOM();
  }

  /* Public API */
  window.NexoraRoadmap = {
    reload: () => { rebuildRoadmaps(); renderAll(); },
    refresh: async () => { await loadProgress(); renderAll(); },
    go: (pathId) => { activeTabId = pathId; renderAll(); },
    getProgress: () => ({ ...progress }),
    getRoadmaps: () => ROADMAPS,
    getCurrentUser: () => currentUser,
    debug: () => ({
      roadmaps: ROADMAPS.map((r) => ({
        id: r.id,
        title: r.title,
        stepsCount: r.steps.length,
        subPathsCount: (r.subPaths || []).length
      })),
      matches: _lastDebugInfo,
      progress
    })
  };
})();