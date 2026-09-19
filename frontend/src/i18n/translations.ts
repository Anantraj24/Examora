export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'vi';

export interface LanguageOption {
  code: SupportedLanguage;
  shortCode: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', shortCode: 'ENG', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', shortCode: 'ESP', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', shortCode: 'FRA', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', shortCode: 'DEU', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', shortCode: 'ZHO', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'vi', shortCode: 'VIE', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Nav Items
    'nav.dashboard': 'Dashboard',
    'nav.schedule': 'Schedule',
    'nav.assessments': 'Exams & Tests',
    'nav.scorecard': 'My Scorecard',
    'nav.materials': 'Materials',
    'nav.forum': 'Forum',
    'nav.settings': 'Settings',
    'nav.grading': 'Examiner Studio',
    'nav.proctor': 'Live Proctoring',
    'nav.builder': 'Exam Builder',
    'nav.questions': 'Question Bank',
    'nav.results': 'Cohort Analytics',
    'nav.student_view': 'Student View',

    // Top Bar & Controls
    'topbar.search': 'Search examinations, lessons, question banks...',
    'topbar.dark_mode': 'Dark mode',
    'topbar.light_mode': 'Light mode',
    'topbar.messages': 'Messages',
    'topbar.notifications': 'Notifications',
    'topbar.switch_role': 'Switch Role',
    'topbar.role_student': 'Student Candidate',
    'topbar.role_examiner': 'Faculty Examiner',
    'topbar.role_admin': 'System Administrator',
    'topbar.logout': 'Sign Out',
    'topbar.live': 'Online',
    'topbar.offline': 'Offline',

    // Common Buttons & Actions
    'action.start_exam': 'Start Proctored Exam',
    'action.launch': 'Launch & Start Exam',
    'action.view_scorecard': 'View Scorecard',
    'action.download': 'Download Handbook',
    'action.search': 'Search',
    'action.clear': 'Clear',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.submit': 'Submit',
    'action.delete': 'Delete',
    'action.reply': 'Reply',
    'action.back': 'Back',

    // Schedule & Exams
    'schedule.title': 'Academic & Examination Schedule',
    'schedule.subtitle': 'Unified schedule source of truth. Synchronized across candidate portals and examiner desks.',
    'schedule.all': 'All Scheduled',
    'schedule.today': 'Today',
    'schedule.upcoming': 'Upcoming',
    'schedule.completed': 'Completed',
    'schedule.ready_to_launch': 'READY TO LAUNCH',
    'schedule.opens_at': 'Opens at',

    // Materials
    'materials.title': 'Course Learning Materials & Reference Guides',
    'materials.subtitle': 'Browse and search curated academic textbooks, algorithmic cheat-sheets, and syllabus guidelines.',
    'materials.search_placeholder': 'Search by handbook title, topic, algorithm, keyword, or description...',

    // Forum
    'forum.title': 'Academic Discussion Forum',
    'forum.subtitle': 'Engage with verified faculty mentors, proctoring supervisors, and peers.',
    'forum.search_placeholder': 'Search discussions by question title, concept, algorithm, or reply...',
    'forum.start_discussion': 'Start New Discussion',
    'forum.replies': 'replies',
    'forum.upvotes': 'upvotes',
  },

  es: {
    // Nav Items
    'nav.dashboard': 'Panel Principal',
    'nav.schedule': 'Horarios',
    'nav.assessments': 'Exámenes y Pruebas',
    'nav.scorecard': 'Mis Calificaciones',
    'nav.materials': 'Materiales',
    'nav.forum': 'Foro Académico',
    'nav.settings': 'Configuración',
    'nav.grading': 'Estudio del Evaluador',
    'nav.proctor': 'Supervisión en Vivo',
    'nav.builder': 'Creador de Exámenes',
    'nav.questions': 'Banco de Preguntas',
    'nav.results': 'Analítica de Cohorte',
    'nav.student_view': 'Vista de Estudiante',

    // Top Bar & Controls
    'topbar.search': 'Buscar exámenes, lecciones, banco de preguntas...',
    'topbar.dark_mode': 'Modo oscuro',
    'topbar.light_mode': 'Modo claro',
    'topbar.messages': 'Mensajes',
    'topbar.notifications': 'Notificaciones',
    'topbar.switch_role': 'Cambiar Rol',
    'topbar.role_student': 'Estudiante Candidato',
    'topbar.role_examiner': 'Profesor Evaluador',
    'topbar.role_admin': 'Administrador del Sistema',
    'topbar.logout': 'Cerrar Sesión',
    'topbar.live': 'En línea',
    'topbar.offline': 'Desconectado',

    // Common Buttons & Actions
    'action.start_exam': 'Iniciar Examen Supervisado',
    'action.launch': 'Lanzar e Iniciar Examen',
    'action.view_scorecard': 'Ver Boleta de Notas',
    'action.download': 'Descargar Manual',
    'action.search': 'Buscar',
    'action.clear': 'Limpiar',
    'action.cancel': 'Cancelar',
    'action.save': 'Guardar',
    'action.submit': 'Enviar',
    'action.delete': 'Eliminar',
    'action.reply': 'Responder',
    'action.back': 'Volver',

    // Schedule & Exams
    'schedule.title': 'Calendario Académico y de Exámenes',
    'schedule.subtitle': 'Fuente única y sincronizada de horarios de examen para estudiantes y evaluadores.',
    'schedule.all': 'Todos los Programados',
    'schedule.today': 'Hoy',
    'schedule.upcoming': 'Próximos',
    'schedule.completed': 'Completados',
    'schedule.ready_to_launch': 'LISTO PARA INICIAR',
    'schedule.opens_at': 'Abre a las',

    // Materials
    'materials.title': 'Materiales de Aprendizaje y Guías de Estudio',
    'materials.subtitle': 'Explora manuales académicos, hojas de fórmulas y temarios oficiales.',
    'materials.search_placeholder': 'Buscar por título de manual, tema, algoritmo o descripción...',

    // Forum
    'forum.title': 'Foro de Discusión Académica',
    'forum.subtitle': 'Interactúa con profesores mentores, supervisores y compañeros de clase.',
    'forum.search_placeholder': 'Buscar discusiones por título, concepto, algoritmo o respuesta...',
    'forum.start_discussion': 'Iniciar Nueva Discusión',
    'forum.replies': 'respuestas',
    'forum.upvotes': 'votos a favor',
  },

  fr: {
    // Nav Items
    'nav.dashboard': 'Tableau de bord',
    'nav.schedule': 'Calendrier',
    'nav.assessments': 'Examens & Tests',
    'nav.scorecard': 'Mes Résultats',
    'nav.materials': 'Supports de cours',
    'nav.forum': 'Forum Académique',
    'nav.settings': 'Paramètres',
    'nav.grading': 'Studio d\'évaluation',
    'nav.proctor': 'Surveillance en Direct',
    'nav.builder': 'Créateur d\'Examens',
    'nav.questions': 'Banque de Questions',
    'nav.results': 'Analyses de Cohorte',
    'nav.student_view': 'Vue Étudiant',

    // Top Bar & Controls
    'topbar.search': 'Rechercher des examens, leçons, banques de questions...',
    'topbar.dark_mode': 'Mode sombre',
    'topbar.light_mode': 'Mode clair',
    'topbar.messages': 'Messages',
    'topbar.notifications': 'Notifications',
    'topbar.switch_role': 'Changer de rôle',
    'topbar.role_student': 'Candidat Étudiant',
    'topbar.role_examiner': 'Professeur Évaluateur',
    'topbar.role_admin': 'Administrateur Système',
    'topbar.logout': 'Déconnexion',
    'topbar.live': 'En ligne',
    'topbar.offline': 'Hors ligne',

    // Common Buttons & Actions
    'action.start_exam': 'Démarrer l\'Examen Surveillé',
    'action.launch': 'Lancer l\'Examen',
    'action.view_scorecard': 'Voir le Bulletin',
    'action.download': 'Télécharger le Manuel',
    'action.search': 'Rechercher',
    'action.clear': 'Effacer',
    'action.cancel': 'Annuler',
    'action.save': 'Enregistrer',
    'action.submit': 'Soumettre',
    'action.delete': 'Supprimer',
    'action.reply': 'Répondre',
    'action.back': 'Retour',

    // Schedule & Exams
    'schedule.title': 'Calendrier Académique & Examens',
    'schedule.subtitle': 'Source unique synchronisée pour les créneaux d\'examens officiels.',
    'schedule.all': 'Tous Programmés',
    'schedule.today': 'Aujourd\'hui',
    'schedule.upcoming': 'À venir',
    'schedule.completed': 'Terminés',
    'schedule.ready_to_launch': 'PRÊT À DÉMARRER',
    'schedule.opens_at': 'Ouvre à',

    // Materials
    'materials.title': 'Supports Pédagogiques & Manuels de Référence',
    'materials.subtitle': 'Consultez manuels, fiches de révision et guides de cours.',
    'materials.search_placeholder': 'Rechercher par titre de manuel, sujet, algorithme ou mot-clé...',

    // Forum
    'forum.title': 'Forum de Discussion Académique',
    'forum.subtitle': 'Échangez avec les professeurs tuteurs, surveillants et étudiants.',
    'forum.search_placeholder': 'Rechercher des questions par titre, concept ou réponse...',
    'forum.start_discussion': 'Nouvelle Discussion',
    'forum.replies': 'réponses',
    'forum.upvotes': 'votes utiles',
  },

  de: {
    // Nav Items
    'nav.dashboard': 'Übersicht',
    'nav.schedule': 'Prüfungsplan',
    'nav.assessments': 'Prüfungen & Tests',
    'nav.scorecard': 'Mein Notenblatt',
    'nav.materials': 'Lernmaterialien',
    'nav.forum': 'Akademisches Forum',
    'nav.settings': 'Einstellungen',
    'nav.grading': 'Prüfer-Studio',
    'nav.proctor': 'Live-Aufsicht',
    'nav.builder': 'Prüfungs-Designer',
    'nav.questions': 'Fragenpool',
    'nav.results': 'Kohorten-Analysen',
    'nav.student_view': 'Studentenansicht',

    // Top Bar & Controls
    'topbar.search': 'Prüfungen, Lektionen und Fragenpool durchsuchen...',
    'topbar.dark_mode': 'Dunkelmodus',
    'topbar.light_mode': 'Hellmodus',
    'topbar.messages': 'Nachrichten',
    'topbar.notifications': 'Benachrichtigungen',
    'topbar.switch_role': 'Rolle wechseln',
    'topbar.role_student': 'Studentischer Kandidat',
    'topbar.role_examiner': 'Akademischer Prüfer',
    'topbar.role_admin': 'Systemadministrator',
    'topbar.logout': 'Abmelden',
    'topbar.live': 'Online',
    'topbar.offline': 'Offline',

    // Common Buttons & Actions
    'action.start_exam': 'Beaufsichtigte Prüfung starten',
    'action.launch': 'Prüfung beginnen',
    'action.view_scorecard': 'Notenblatt anzeigen',
    'action.download': 'Handbuch herunterladen',
    'action.search': 'Suchen',
    'action.clear': 'Löschen',
    'action.cancel': 'Abbrechen',
    'action.save': 'Speichern',
    'action.submit': 'Einreichen',
    'action.delete': 'Entfernen',
    'action.reply': 'Antworten',
    'action.back': 'Zurück',

    // Schedule & Exams
    'schedule.title': 'Akademischer & Prüfungszeitplan',
    'schedule.subtitle': 'Zentrale synchronisierte Quelle für alle offiziellen Prüfungstermine.',
    'schedule.all': 'Alle Termine',
    'schedule.today': 'Heute',
    'schedule.upcoming': 'Bevorstehend',
    'schedule.completed': 'Abgeschlossen',
    'schedule.ready_to_launch': 'BEREIT ZUM START',
    'schedule.opens_at': 'Öffnet um',

    // Materials
    'materials.title': 'Kurs-Lernmaterialien & Referenzhandbücher',
    'materials.subtitle': 'Fachliteratur, Spickzettel und Richtlinien durchsuchen.',
    'materials.search_placeholder': 'Nach Handbuchtitel, Thema, Algorithmus oder Stichwort suchen...',

    // Forum
    'forum.title': 'Akademisches Diskussionsforum',
    'forum.subtitle': 'Austausch mit Mentoren, Dozenten und Kommilitonen.',
    'forum.search_placeholder': 'Diskussionen nach Fragestellung, Begriff oder Antwort durchsuchen...',
    'forum.start_discussion': 'Diskussion starten',
    'forum.replies': 'Antworten',
    'forum.upvotes': 'Zustimmungen',
  },

  zh: {
    // Nav Items
    'nav.dashboard': '控制面板',
    'nav.schedule': '学术日程',
    'nav.assessments': '正式考核与测验',
    'nav.scorecard': '我的成绩单',
    'nav.materials': '课程学习资料',
    'nav.forum': '学术讨论社区',
    'nav.settings': '系统设置',
    'nav.grading': '考官阅卷工作台',
    'nav.proctor': '实时智能监考中心',
    'nav.builder': '试卷参数设计器',
    'nav.questions': '题库资源管理',
    'nav.results': '考生成绩数据分析',
    'nav.student_view': '切换学生视图',

    // Top Bar & Controls
    'topbar.search': '搜索考核项目、复习课程、题库条目...',
    'topbar.dark_mode': '暗黑主题',
    'topbar.light_mode': '明亮主题',
    'topbar.messages': '消息通知',
    'topbar.notifications': '重要提醒',
    'topbar.switch_role': '切换用户身份',
    'topbar.role_student': '在读考核考生',
    'topbar.role_examiner': '学术评审考官',
    'topbar.role_admin': '系统超级管理员',
    'topbar.logout': '安全登出',
    'topbar.live': '系统在线',
    'topbar.offline': '离线断开',

    // Common Buttons & Actions
    'action.start_exam': '启动智能监考',
    'action.launch': '立即开始考核',
    'action.view_scorecard': '查看答卷评估',
    'action.download': '下载讲义手册',
    'action.search': '执行搜索',
    'action.clear': '重置清除',
    'action.cancel': '取消操作',
    'action.save': '保存设置',
    'action.submit': '确认提交',
    'action.delete': '删除记录',
    'action.reply': '发表回复',
    'action.back': '返回上一页',

    // Schedule & Exams
    'schedule.title': '统一学术考核日程规划',
    'schedule.subtitle': '跨终端实时同步的考核时间表，确保师生信息完全一致。',
    'schedule.all': '全部日程',
    'schedule.today': '今日考核',
    'schedule.upcoming': '即将开考',
    'schedule.completed': '已完成考核',
    'schedule.ready_to_launch': '● 可以立即入场',
    'schedule.opens_at': '开放时间为',

    // Materials
    'materials.title': '精选核心教材与考前速查手册',
    'materials.subtitle': '查阅权威课程大纲、算法考点提纲与系统操作指导手册。',
    'materials.search_placeholder': '输入教材标题、知识点、算法名称或说明关键字...',

    // Forum
    'forum.title': '学术交流与答疑专区',
    'forum.subtitle': '与资深导师、助教及同行学子探讨学术难题与备考心得。',
    'forum.search_placeholder': '检索讨论主题、算法概念或导师解答...',
    'forum.start_discussion': '发起学术讨论',
    'forum.replies': '条解答回复',
    'forum.upvotes': '次学术赞同',
  },

  vi: {
    // Nav Items
    'nav.dashboard': 'Bảng Điều Khiển',
    'nav.schedule': 'Lịch Thi & Học',
    'nav.assessments': 'Kỳ Thi & Kiểm Tra',
    'nav.scorecard': 'Bảng Điểm Của Tôi',
    'nav.materials': 'Tài Liệu Học Tập',
    'nav.forum': 'Diễn Đàn Học Thuật',
    'nav.settings': 'Cài Đặt Hệ Thống',
    'nav.grading': 'Phòng Chấm Điểm',
    'nav.proctor': 'Giám Sát Trực Tuyến',
    'nav.builder': 'Tạo Đề & Ma Trận',
    'nav.questions': 'Ngân Hàng Câu Hỏi',
    'nav.results': 'Phân Tích Thống Kê',
    'nav.student_view': 'Xem Giao Diện Sinh Viên',

    // Top Bar & Controls
    'topbar.search': 'Tìm kiếm bài thi, bài giảng, câu hỏi...',
    'topbar.dark_mode': 'Chế độ tối',
    'topbar.light_mode': 'Chế độ sáng',
    'topbar.messages': 'Tin nhắn',
    'topbar.notifications': 'Thông báo',
    'topbar.switch_role': 'Đổi Vai Trò',
    'topbar.role_student': 'Thí Sinh',
    'topbar.role_examiner': 'Giảng Viên Chấm Thi',
    'topbar.role_admin': 'Quản Trị Viên',
    'topbar.logout': 'Đăng Xuất',
    'topbar.live': 'Trực tuyến',
    'topbar.offline': 'Ngoại tuyến',

    // Common Buttons & Actions
    'action.start_exam': 'Bắt Đầu Thi Có Giám Sát',
    'action.launch': 'Vào Phòng Thi Ngay',
    'action.view_scorecard': 'Xem Bảng Điểm Chi Tiết',
    'action.download': 'Tải Sổ Tay Học Tập',
    'action.search': 'Tìm kiếm',
    'action.clear': 'Xóa lọc',
    'action.cancel': 'Hủy',
    'action.save': 'Lưu lại',
    'action.submit': 'Gửi bài',
    'action.delete': 'Xóa',
    'action.reply': 'Phản hồi',
    'action.back': 'Quay lại',

    // Schedule & Exams
    'schedule.title': 'Lịch Thi & Kế Hoạch Học Tập',
    'schedule.subtitle': 'Đồng bộ hóa dữ liệu lịch thi thống nhất giữa sinh viên và giảng viên.',
    'schedule.all': 'Tất Cả Lịch Thi',
    'schedule.today': 'Hôm Nay',
    'schedule.upcoming': 'Sắp Diễn Ra',
    'schedule.completed': 'Đã Hoàn Thành',
    'schedule.ready_to_launch': '● SẴN SÀNG VÀO PHÒNG',
    'schedule.opens_at': 'Mở vào lúc',

    // Materials
    'materials.title': 'Tài Liệu Học Tập & Hướng Dẫn Ôn Thi',
    'materials.subtitle': 'Truy cập giáo trình, bảng tóm tắt thuật toán và đề cương chính thức.',
    'materials.search_placeholder': 'Tìm kiếm theo tên sách, chủ đề, thuật toán hoặc nội dung...',

    // Forum
    'forum.title': 'Diễn Đàn Thảo Luận Học Thuật',
    'forum.subtitle': 'Trao đổi cùng cố vấn, trợ giảng và các bạn cùng khóa.',
    'forum.search_placeholder': 'Tìm kiếm chủ đề câu hỏi, thuật toán hoặc giải đáp...',
    'forum.start_discussion': 'Tạo Thảo Luận Mới',
    'forum.replies': 'câu trả lời',
    'forum.upvotes': 'lượt đồng tình',
  }
};
