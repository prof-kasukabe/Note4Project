import type { DocItem, EvaluationData, ProjectDetailData } from '../types/index.ts';

export const COVER_PRESETS = [
  {
    id: 'minimal_workspace',
    name: 'Minimal Workspace',
    url: '/src/assets/images/cover_minimal_workspace_1794173839640.jpg',
  },
  {
    id: 'abstract_geometry',
    name: 'Abstract Prisms',
    url: '/src/assets/images/cover_abstract_geometry_1794173840807.jpg',
  },
  {
    id: 'nordic_nature',
    name: 'Nordic Mountain Pine',
    url: '/src/assets/images/cover_nordic_nature_1794173840170.jpg',
  },
  {
    id: 'gradient_indigo',
    name: 'Twilight Gradient',
    url: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  },
  {
    id: 'gradient_emerald',
    name: 'Emerald Forest',
    url: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  },
];

export const formatProjectDeadline = (isoDate?: string, fallback = '16 Nov 2026'): string => {
  if (!isoDate) return fallback;
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatProjectDeadlineLong = (isoDate?: string, fallback = '16 November 2026'): string => {
  if (!isoDate) return fallback;
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const buildProjectMarkdownContent = (
  title: string,
  icon: string,
  deadline: string | undefined,
  data: ProjectDetailData
): string => {
  const goalLines = (data.goals || [])
    .map((g) => `- [${g.done ? 'x' : ' '}] ${g.text}`)
    .join('\n');
  const taskLines = data.tasks
    .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.assignee} · ${t.dueDate})`)
    .join('\n');
  const toolLines = data.toolLinks
    .map((tl) => `- **${tl.name}**: ${tl.description}`)
    .join('\n');

  return `# ${icon || '📌'} ${title}

**Kategori:** ${data.categoryLabel || 'Proyek Workspace'}  
**Penanggung Jawab:** ${data.ownerName || 'Tim Workspace'}  
**Kolaborator:** ${data.collaboratorsText || '-'}  
**Tenggat:** ${formatProjectDeadlineLong(deadline, data.deadlineLabel || 'Belum ditetapkan')}  

${data.tagline || ''}

${data.aboutText || ''}

${data.focusObjective ? `> **Fokus Pengerjaan:** ${data.focusObjective}` : ''}

---

### 🎯 Hasil yang Dituju
${goalLines || '- [ ] Tetapkan target utama proyek'}

### ✅ Daftar Tugas Proyek
${taskLines || '- [ ] Belum ada tugas terdaftar'}

### 📝 Catatan untuk Tim
${data.teamNote || '-'}

### 🛠️ Alat Kerja Terhubung
${toolLines || '-'}
`;
};

export const WEB_PROJECT_DOC_ID = 'doc-portfolio-web';

export const DEFAULT_WEB_PROJECT_DATA: ProjectDetailData = {
  categoryLabel: 'WEBSITE · DESAIN & PENGEMBANGAN',
  tagline: 'Ruang untuk menampilkan karya, cerita, dan hal yang kamu kerjakan.',
  aboutText:
    'Website personal untuk menampilkan karya terpilih, profil, dan kontak. Fokus pada pengalaman yang ringan, responsif, dan mudah diperbarui.',
  focusObjective: 'Website portofolio & etalase karya interaktif yang ringan di desktop dan mobile.',
  ownerName: 'Andi Darma',
  collaboratorsText: 'Andi, Nadia, Rafi',
  visibilityLabel: 'Anggota workspace',
  deadlineLabel: '13 Nov 2026',
  priorityLabel: 'Sedang',
  statusLabel: 'Dikerjakan',
  teamNote:
    'Pastikan setiap studi kasus memuat konteks, proses, dan hasil. Tinjau versi mobile sebelum website dipublikasikan.',
  baseCompletedTasks: 17,
  baseTotalTasks: 19,
  tasks: [
    {
      id: 'task-pw-1',
      title: 'Finalisasi desain halaman utama',
      assignee: 'Nadia',
      priority: 'Tinggi',
      dueDate: 'Hari ini',
      completed: false,
    },
    {
      id: 'task-pw-2',
      title: 'Perbaiki navigasi versi mobile',
      assignee: 'Rafi',
      priority: 'Sedang',
      dueDate: 'Besok',
      completed: false,
    },
    {
      id: 'task-pw-3',
      title: 'Tambahkan studi kasus proyek',
      assignee: 'Andi',
      priority: 'Sedang',
      dueDate: '12 Nov',
      completed: false,
    },
    {
      id: 'task-pw-4',
      title: 'Uji responsivitas & aksesibilitas',
      assignee: 'Rafi',
      priority: 'Tinggi',
      dueDate: '13 Nov',
      completed: false,
    },
    {
      id: 'task-pw-5',
      title: 'Susun struktur halaman',
      assignee: 'Andi',
      priority: 'Sedang',
      dueDate: 'Selesai',
      completed: true,
    },
  ],
  discussions: [
    {
      id: 'disc-1',
      userName: 'Andi Darma',
      userColor: '#6366F1',
      text: 'Draft wireframe untuk studi kasus sudah diunggah di Figma. Silakan cek di tab Dokumen.',
      timestamp: Date.now() - 3600000 * 3,
    },
    {
      id: 'disc-2',
      userName: 'Nadia',
      userColor: '#EC4899',
      text: 'Navigasi mobile sudah saya revisi agar lebih responsif di layar di bawah 400px.',
      timestamp: Date.now() - 3600000 * 1,
    },
  ],
  toolLinks: [
    {
      id: 'tool-pw-figma',
      name: 'Figma',
      description: 'Desain UI & prototipe',
      url: 'https://figma.com/@portfolio-v2',
    },
    {
      id: 'tool-pw-github',
      name: 'GitHub',
      description: 'Repositori & review perubahan',
      url: 'https://github.com/noverse-workspace/portfolio-web',
    },
    {
      id: 'tool-pw-vercel',
      name: 'Vercel',
      description: 'Preview & publikasi website',
      url: 'https://portfolio-web.vercel.app',
    },
  ],
  goals: [
    { id: 'goal-pw-1', text: 'Halaman utama & profil', done: true },
    { id: 'goal-pw-2', text: 'Studi kasus & kontak', done: false },
    { id: 'goal-pw-3', text: 'Website responsif', done: true },
  ],
  projectDocs: [
    {
      id: 'pdoc-pw-1',
      title: 'Struktur & konten website',
      source: 'Noverse',
      updatedLabel: 'Diperbarui hari ini',
      category: 'Dokumen',
      description: 'Kerangka arsitektur informasi, copywriting halaman utama, dan daftar proyek.',
      linkedDocId: 'doc-portfolio-web',
    },
    {
      id: 'pdoc-pw-2',
      title: 'Desain antarmuka v2',
      source: 'Figma',
      updatedLabel: 'Diperbarui kemarin',
      category: 'Desain',
      description: 'Komponen UI, sistem tipografi, palet warna sage, dan prototipe responsif.',
    },
    {
      id: 'pdoc-pw-3',
      title: 'Panduan pengembangan',
      source: 'GitHub',
      updatedLabel: 'Diperbarui 8 Nov',
      category: 'Panduan',
      description: 'Standar deployment, optimasi aset, dan review pull request.',
    },
  ],
  webSections: [
    {
      id: 'wsec-1',
      title: 'Hero & Pengantar Profil',
      subtitle: 'Menampilkan fokus layanan, proposisi nilai, dan ajakan kontak langsung.',
      tag: 'Beranda',
    },
    {
      id: 'wsec-2',
      title: 'Etalase Karya & Studi Kasus',
      subtitle: 'Sorotan proyek pilihan lengkap dengan konteks, proses, dan hasil terukur.',
      tag: 'Portofolio',
    },
    {
      id: 'wsec-3',
      title: 'Tentang & Formulir Kontak',
      subtitle: 'Ringkasan pengalaman tim serta kanal kolaborasi cepat.',
      tag: 'Kontak',
    },
  ],
};

export const createDefaultWebProjectDoc = (): DocItem => ({
  id: WEB_PROJECT_DOC_ID,
  title: 'Website project',
  icon: '🌐',
  parentId: null,
  tags: ['Website', 'Desain & Pengembangan'],
  status: 'in_progress',
  priority: 'medium',
  deadline: '2026-11-13',
  createdAt: Date.now() - 86400000 * 7,
  updatedAt: Date.now() - 1800000,
  isFavorite: true,
  projectData: DEFAULT_WEB_PROJECT_DATA,
  lastModifiedBy: {
    userId: 'u_andi',
    name: 'Andi Darma',
    color: '#6366F1',
    timestamp: Date.now() - 1800000,
    action: 'Memperbarui dokumen Website project',
  },
  statusHistory: [
    {
      id: 'sh-pw-1',
      fromStatus: 'not_started',
      toStatus: 'in_progress',
      changedBy: { userId: 'u_andi', name: 'Andi Darma', color: '#6366F1' },
      timestamp: Date.now() - 86400000 * 3,
    },
  ],
  content: buildProjectMarkdownContent(
    'Website project',
    '🌐',
    '2026-11-13',
    DEFAULT_WEB_PROJECT_DATA
  ),
});

export const MOBILE_PROJECT_DOC_ID = 'doc-habit-tracker';

export const DEFAULT_MOBILE_PROJECT_DATA: ProjectDetailData = {
  categoryLabel: 'APLIKASI MOBILE · PRODUK DIGITAL',
  tagline: 'Membangun kebiasaan baik, satu langkah kecil setiap hari.',
  aboutText:
    'Aplikasi mobile untuk mencatat kebiasaan harian, menjaga konsistensi, dan melihat progres. Fokus pada alur sederhana dan pengingat yang membantu.',
  focusObjective: 'Aplikasi pelacak kebiasaan harian lintas Android & iOS dengan pengingat terjadwal.',
  ownerName: 'Andi Darma',
  collaboratorsText: 'Andi, Rafi',
  visibilityLabel: 'Anggota workspace',
  deadlineLabel: '16 Nov 2026',
  priorityLabel: 'Sedang',
  statusLabel: 'Dikerjakan',
  teamNote: 'Pengingat harus bisa diatur per kebiasaan. Gunakan pola navigasi yang konsisten di Android dan iOS.',
  baseCompletedTasks: 7,
  baseTotalTasks: 7,
  tasks: [
    {
      id: 'task-hm-1',
      title: 'Susun alur onboarding pengguna',
      assignee: 'Andi',
      priority: 'Sedang',
      dueDate: '11 Nov',
      completed: false,
    },
    {
      id: 'task-hm-2',
      title: 'Bangun pengingat kebiasaan',
      assignee: 'Rafi',
      priority: 'Tinggi',
      dueDate: '13 Nov',
      completed: false,
    },
    {
      id: 'task-hm-3',
      title: 'Tampilkan statistik mingguan',
      assignee: 'Rafi',
      priority: 'Sedang',
      dueDate: '14 Nov',
      completed: false,
    },
    {
      id: 'task-hm-4',
      title: 'Uji coba di Android & iOS',
      assignee: 'Andi',
      priority: 'Tinggi',
      dueDate: '16 Nov',
      completed: false,
    },
    {
      id: 'task-hm-5',
      title: 'Rancang layar catatan harian',
      assignee: 'Andi',
      priority: 'Sedang',
      dueDate: 'Selesai',
      completed: true,
    },
  ],
  discussions: [
    {
      id: 'disc-hm-1',
      userName: 'Andi Darma',
      userColor: '#6366F1',
      text: 'Wireframe alur onboarding dan layar catatan harian sudah masuk Figma. Tinggal sinkron jadwal pengingat.',
      timestamp: Date.now() - 3600000 * 4,
    },
    {
      id: 'disc-hm-2',
      userName: 'Rafi',
      userColor: '#10B981',
      text: 'Push notification Android sudah berjalan normal, sedang menyamakan perilaku izin notifikasi di iOS.',
      timestamp: Date.now() - 3600000 * 1.5,
    },
  ],
  toolLinks: [
    {
      id: 'tool-figma',
      name: 'Figma',
      description: 'Alur layar & prototipe',
      url: 'https://figma.com/@habit-tracker-mobile',
    },
    {
      id: 'tool-ide',
      name: 'Android Studio / Xcode',
      description: 'Build & uji Android / iOS',
      url: 'https://developer.android.com/studio',
    },
    {
      id: 'tool-firebase',
      name: 'Firebase',
      description: 'Autentikasi & sinkronisasi data',
      url: 'https://console.firebase.google.com',
    },
  ],
  goals: [
    { id: 'goal-hm-1', text: 'Onboarding & daftar kebiasaan', done: false },
    { id: 'goal-hm-2', text: 'Pengingat harian', done: false },
    { id: 'goal-hm-3', text: 'Statistik progres mingguan', done: true },
  ],
  projectDocs: [
    {
      id: 'pdoc-hm-1',
      title: 'Alur pengguna & wireframe',
      source: 'Figma',
      updatedLabel: 'Diperbarui hari ini',
      category: 'Desain',
      description: 'Sketsa alur pendaftaran hingga checklist kebiasaan harian.',
    },
    {
      id: 'pdoc-hm-2',
      title: 'Spesifikasi habit & pengingat',
      source: 'Noverse',
      updatedLabel: 'Diperbarui 9 Nov',
      category: 'Dokumen',
      description: 'Aturan penjadwalan pengingat, streak, dan penyimpanan offline.',
      linkedDocId: MOBILE_PROJECT_DOC_ID,
    },
    {
      id: 'pdoc-hm-3',
      title: 'Catatan pengujian aplikasi',
      source: 'Noverse',
      updatedLabel: 'Diperbarui 8 Nov',
      category: 'Pengujian',
      description: 'Laporan QA kompatibilitas notifikasi Android & iOS.',
      linkedDocId: 'doc-sprint',
    },
  ],
  mobileFeatures: [
    { id: 'h-1', name: 'Minum air 2 liter', schedule: '07:30 · Setiap hari', streak: 12, doneToday: true, reminderOn: true },
    { id: 'h-2', name: 'Baca buku 20 menit', schedule: '21:00 · Malam', streak: 9, doneToday: true, reminderOn: true },
    { id: 'h-3', name: 'Olahraga ringan', schedule: '06:30 · Sen, Rab, Jum', streak: 5, doneToday: false, reminderOn: true },
    { id: 'h-4', name: 'Jurnal refleksi harian', schedule: '22:00 · Setiap hari', streak: 7, doneToday: false, reminderOn: false },
  ],
};

export const createDefaultMobileProjectDoc = (): DocItem => ({
  id: MOBILE_PROJECT_DOC_ID,
  title: 'Aplikasi habit tracker',
  icon: '📱',
  parentId: null,
  tags: ['Aplikasi mobile', 'Produk digital'],
  status: 'in_progress',
  priority: 'medium',
  deadline: '2026-11-16',
  createdAt: Date.now() - 86400000 * 6,
  updatedAt: Date.now() - 1200000,
  isFavorite: true,
  projectData: DEFAULT_MOBILE_PROJECT_DATA,
  lastModifiedBy: {
    userId: 'u_andi',
    name: 'Andi Darma',
    color: '#6366F1',
    timestamp: Date.now() - 1200000,
    action: 'Memperbarui progres Aplikasi habit tracker',
  },
  statusHistory: [
    {
      id: 'sh-hm-1',
      fromStatus: 'not_started',
      toStatus: 'in_progress',
      changedBy: { userId: 'u_andi', name: 'Andi Darma', color: '#6366F1' },
      timestamp: Date.now() - 86400000 * 2,
    },
  ],
  content: buildProjectMarkdownContent(
    'Aplikasi habit tracker',
    '📱',
    '2026-11-16',
    DEFAULT_MOBILE_PROJECT_DATA
  ),
});

export const DESIGN_PROJECT_DOC_ID = 'doc-kopi-sore';

export const DEFAULT_DESIGN_PROJECT_DATA: ProjectDetailData = {
  categoryLabel: 'DESAIN · IDENTITAS MEREK',
  tagline: 'Identitas yang hangat untuk menemani setiap cerita di sore hari.',
  aboutText:
    'Merancang identitas visual Kopi Sore yang hangat, bersahaja, dan dekat. Mencakup logo, warna, tipografi, kemasan, serta panduan penggunaan merek.',
  focusObjective: 'Sistem identitas visual & panduan merek lengkap dari logomark, palet warna, hingga kemasan.',
  ownerName: 'Nadia Putri',
  collaboratorsText: 'Nadia, Salsa',
  visibilityLabel: 'Anggota workspace',
  deadlineLabel: '20 Nov 2026',
  priorityLabel: 'Sedang',
  statusLabel: 'Dikerjakan',
  teamNote: 'Pertahankan nuansa hangat dan natural. Pastikan logo tetap terbaca pada ukuran kecil serta versi satu warna.',
  baseCompletedTasks: 5,
  baseTotalTasks: 5,
  tasks: [
    {
      id: 'task-ks-1',
      title: 'Finalisasi alternatif logo utama',
      assignee: 'Nadia',
      priority: 'Tinggi',
      dueDate: '12 Nov',
      completed: false,
    },
    {
      id: 'task-ks-2',
      title: 'Susun panduan tipografi merek',
      assignee: 'Nadia',
      priority: 'Sedang',
      dueDate: '14 Nov',
      completed: false,
    },
    {
      id: 'task-ks-3',
      title: 'Terapkan identitas pada kemasan',
      assignee: 'Salsa',
      priority: 'Sedang',
      dueDate: '17 Nov',
      completed: false,
    },
    {
      id: 'task-ks-4',
      title: 'Review panduan merek bersama',
      assignee: 'Salsa',
      priority: 'Tinggi',
      dueDate: '20 Nov',
      completed: false,
    },
    {
      id: 'task-ks-5',
      title: 'Eksplorasi palet warna merek',
      assignee: 'Salsa',
      priority: 'Sedang',
      dueDate: 'Selesai',
      completed: true,
    },
  ],
  discussions: [
    {
      id: 'disc-ks-1',
      userName: 'Nadia Putri',
      userColor: '#EC4899',
      text: 'Tiga opsi logomark untuk Kopi Sore sudah masuk papan Figma. Versi monokrom paling aman di ukuran stempel cup 18mm.',
      timestamp: Date.now() - 3600000 * 5,
    },
    {
      id: 'disc-ks-2',
      userName: 'Salsa',
      userColor: '#F59E0B',
      text: 'Palet warna cokelat panggang dan krem gading sudah dipadukan dengan mockup kemasan sleeve & pouch 250g.',
      timestamp: Date.now() - 3600000 * 2,
    },
  ],
  toolLinks: [
    {
      id: 'tool-ks-figma',
      name: 'Figma',
      description: 'Moodboard & panduan merek',
      url: 'https://figma.com/@kopi-sore-brand',
    },
    {
      id: 'tool-ks-ai',
      name: 'Adobe Illustrator',
      description: 'Logo vektor & aset cetak',
      url: 'https://www.adobe.com/products/illustrator.html',
    },
    {
      id: 'tool-ks-drive',
      name: 'Google Drive',
      description: 'Arsip & berbagi aset final',
      url: 'https://drive.google.com',
    },
  ],
  goals: [
    { id: 'goal-ks-1', text: 'Logo utama & variasi', done: false },
    { id: 'goal-ks-2', text: 'Palet warna & tipografi', done: true },
    { id: 'goal-ks-3', text: 'Panduan merek & kemasan', done: false },
  ],
  projectDocs: [
    {
      id: 'pdoc-ks-1',
      title: 'Moodboard & arah visual',
      source: 'Figma',
      updatedLabel: 'Diperbarui hari ini',
      category: 'Referensi',
      description: 'Referensi fotografi senja hangat, tekstur kertas daur ulang, dan gaya minimalis.',
    },
    {
      id: 'pdoc-ks-2',
      title: 'Eksplorasi logo Kopi Sore',
      source: 'Illustrator',
      updatedLabel: 'Diperbarui 9 Nov',
      category: 'Desain',
      description: 'Variasi logomark primer, monokrom stempel cup, dan batas aman jarak logo.',
    },
    {
      id: 'pdoc-ks-3',
      title: 'Panduan identitas merek',
      source: 'Noverse',
      updatedLabel: 'Diperbarui 8 Nov',
      category: 'Panduan',
      description: 'Standar penggunaan warna, pasangan font, serta aplikasi pada kemasan.',
      linkedDocId: DESIGN_PROJECT_DOC_ID,
    },
  ],
  designPalette: [
    { id: 'pal-1', name: 'Espresso Panggang', hex: '#282925', role: 'Teks & monogram utama' },
    { id: 'pal-2', name: 'Tanah Terakota', hex: '#8B6935', role: 'Aksen hangat & stempel' },
    { id: 'pal-3', name: 'Sage Sore', hex: '#567561', role: 'Identitas alami & label' },
    { id: 'pal-4', name: 'Krem Gading', hex: '#F8F8F6', role: 'Permukaan kemasan' },
  ],
};

export const createDefaultDesignProjectDoc = (): DocItem => ({
  id: DESIGN_PROJECT_DOC_ID,
  title: 'Identitas Kopi Sore',
  icon: '🎨',
  parentId: null,
  tags: ['Desain', 'Identitas merek'],
  status: 'in_progress',
  priority: 'medium',
  deadline: '2026-11-20',
  createdAt: Date.now() - 86400000 * 5,
  updatedAt: Date.now() - 900000,
  isFavorite: true,
  projectData: DEFAULT_DESIGN_PROJECT_DATA,
  lastModifiedBy: {
    userId: 'u_nadia',
    name: 'Nadia Putri',
    color: '#EC4899',
    timestamp: Date.now() - 900000,
    action: 'Memperbarui progres Identitas Kopi Sore',
  },
  statusHistory: [
    {
      id: 'sh-ks-1',
      fromStatus: 'not_started',
      toStatus: 'in_progress',
      changedBy: { userId: 'u_nadia', name: 'Nadia Putri', color: '#EC4899' },
      timestamp: Date.now() - 86400000 * 2,
    },
  ],
  content: buildProjectMarkdownContent(
    'Identitas Kopi Sore',
    '🎨',
    '2026-11-20',
    DEFAULT_DESIGN_PROJECT_DATA
  ),
});

export const INITIAL_DOCS: DocItem[] = [
  createDefaultWebProjectDoc(),
  createDefaultMobileProjectDoc(),
  createDefaultDesignProjectDoc(),
  {
    id: 'doc-roadmap',
    title: 'Peta Jalan Produk 2026 (Product Roadmap)',
    icon: '🚀',
    coverImage: '/src/assets/images/cover_minimal_workspace_1794173839640.jpg',
    parentId: null,
    tags: ['Strategi', 'Q1-2026', 'Engineering'],
    status: 'in_progress',
    priority: 'high',
    deadline: '2026-11-20',
    reminderTime: '2026-11-15T09:00:00.000Z',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 3600000 * 2,
    isFavorite: true,
    isDatabase: true,
    lastModifiedBy: {
      userId: 'u_randye',
      name: 'Randye',
      color: '#6366F1',
      timestamp: Date.now() - 3600000 * 2,
      action: 'Mengubah status ke Sedang Dikerjakan',
    },
    statusHistory: [
      {
        id: 'sh-1',
        fromStatus: 'not_started',
        toStatus: 'in_progress',
        changedBy: { userId: 'u_randye', name: 'Randye', color: '#6366F1' },
        timestamp: Date.now() - 3600000 * 2,
      },
    ],
    content: `# 🚀 Peta Jalan Pengembangan Noverse 2026

Selamat datang di ruang kerja hierarkis **Noverse**. Dokumen ini merangkum strategi inti pengembangan ekosistem catatan kolaboratif offline-first dengan keamanan tinggi.

---

### 🎯 Tujuan Utama Kuartal Ini

- [x] Rancang sistem hierarki dokumen dengan kedalaman tak terbatas
- [x] Integrasi database fleksibel: Tampilan Tabel, Papan Kanban, dan Kalender
- [x] Editor Markdown kaya fitur dengan live formatting
- [ ] Stabilisasi protokol kolaborasi multi-pengguna via WebSocket
- [ ] Implementasi audit keamanan enkripsi end-to-end (AES-GCM 256-bit)
- [ ] Dasbor visual metrik produktivitas harian

> *"Kesederhanaan adalah puncak dari kecanggihan."* — Leonardo da Vinci

### 📦 Pilar Arsitektur

1. **Offline First & Auto-Sync**: Akses penuh tanpa koneksi internet dengan antrean mutasi cerdas.
2. **Privasi Tanpa Kompromi**: Opsi penguncian berkas secara lokal menggunakan standar Web Crypto API.
3. **Fleksibilitas Struktur**: Hubungkan dokumen, tugas, dan database secara mulus.
`,
  },
  {
    id: 'doc-roadmap-arch',
    title: 'Arsitektur Modular & Offline-First',
    icon: '⚙️',
    parentId: 'doc-roadmap',
    tags: ['Teknis', 'Arsitektur'],
    status: 'completed',
    priority: 'high',
    deadline: '2026-11-12',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
    lastModifiedBy: {
      userId: 'u_siti',
      name: 'Siti Rahma',
      color: '#10B981',
      timestamp: Date.now() - 3600000 * 4,
      action: 'Menyelesaikan dokumen arsitektur',
    },
    statusHistory: [
      {
        id: 'sh-2',
        fromStatus: 'in_progress',
        toStatus: 'completed',
        changedBy: { userId: 'u_siti', name: 'Siti Rahma', color: '#10B981' },
        timestamp: Date.now() - 3600000 * 4,
      },
    ],
    content: `# ⚙️ Arsitektur Modular & Offline-First

Dokumen sub-halaman ini menjelaskan mekanisme penyimpanan lokal dan rekonsiliasi data.

### Diagram Alur Data
\`\`\`
[Input Pengguna] 
      ↓
[Penyimpanan Lokal / Cache] ← (Bekerja 100% Offline)
      ↓ (Ketika Online)
[Antrean Sinkronisasi Cerdas]
      ↓
[WebSocket Broadcast Server] → [Klien Rekan / Multi-Tab]
\`\`\`

### Spesifikasi Kunci:
- **Penyimpanan Lokal**: Penyimpanan instan tanpa latensi jaringan.
- **Deteksi Konektivitas**: Memantau event \`online\` & \`offline\` secara otomatis.
- **Penanganan Konflik**: Strategi *Last-Write-Wins* dengan cap waktu presisi tinggi.
`,
  },
  {
    id: 'doc-roadmap-security',
    title: 'Audit Enkripsi End-to-End & Vault',
    icon: '🛡️',
    parentId: 'doc-roadmap',
    tags: ['Keamanan', 'Kriptografi'],
    status: 'in_progress',
    priority: 'high',
    deadline: '2026-11-25',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000 * 8,
    lastModifiedBy: {
      userId: 'u_budi',
      name: 'Budi Santoso',
      color: '#F59E0B',
      timestamp: Date.now() - 3600000 * 8,
      action: 'Memulai audit kriptografi E2EE',
    },
    statusHistory: [
      {
        id: 'sh-3',
        fromStatus: 'not_started',
        toStatus: 'in_progress',
        changedBy: { userId: 'u_budi', name: 'Budi Santoso', color: '#F59E0B' },
        timestamp: Date.now() - 3600000 * 8,
      },
    ],
    content: `# 🛡️ Audit Enkripsi End-to-End (E2EE)

Menjamin kerahasiaan catatan sensitif tanpa mengekspos teks biasa ke server perantara.

### Algoritma yang Digunakan:
- **Cipher**: AES-GCM 256-bit dengan IV acak 96-bit per dokumen.
- **Key Derivation**: PBKDF2 dengan 100.000 iterasi SHA-256 dan salt 128-bit unik.
- **Isolasi Memori**: Kunci hanya berada di memori sesi aktif dan dapat dikunci kembali kapan saja.

- [x] Verifikasi Web Crypto API compatibility
- [x] Proteksi terhadap serangan timing & padding
- [ ] Export file cadangan terenkripsi (.vault.json)
`,
  },
  {
    id: 'doc-sprint',
    title: 'Database Tugas & Sprint Mingguan',
    icon: '📋',
    coverImage: '/src/assets/images/cover_abstract_geometry_1794173840807.jpg',
    parentId: null,
    tags: ['Sprint', 'Manajemen Tugas'],
    status: 'in_progress',
    priority: 'medium',
    deadline: '2026-11-18',
    reminderTime: '2026-11-10T14:00:00.000Z',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000 * 1,
    isFavorite: true,
    isDatabase: true,
    lastModifiedBy: {
      userId: 'u_randye',
      name: 'Randye',
      color: '#6366F1',
      timestamp: Date.now() - 3600000 * 1,
      action: 'Memperbarui sprint mingguan',
    },
    content: `# 📋 Sprint Mingguan & Database Pelacak Tugas

Gunakan tombol tampilan di bagian atas untuk beralih antara:
- **Tabel**: Tinjau tenggat, tag, prioritas, dan status secara komprehensif.
- **Papan Kanban**: Geser tugas antar kolom status.
- **Kalender**: Pantau distribusi tenggat waktu tugas secara visual.

---

### Daftar Tugas Utama Sprint Ini:
1. Selesaikan implementasi visualizer kalender terintegrasi
2. Periksa performa render Markdown pada dokumen berukuran besar
3. Validasi notifikasi pengingat berbasis waktu dengan audio chime
`,
  },
  {
    id: 'task-1',
    title: 'Implementasi Editor Markdown & Split Preview',
    icon: '📝',
    parentId: 'doc-sprint',
    tags: ['Frontend', 'UI'],
    status: 'completed',
    priority: 'high',
    deadline: '2026-11-09',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 5,
    lastModifiedBy: {
      userId: 'u_randye',
      name: 'Randye',
      color: '#6366F1',
      timestamp: Date.now() - 3600000 * 5,
      action: 'Menyelesaikan implementasi Markdown editor',
    },
    statusHistory: [
      {
        id: 'sh-4',
        fromStatus: 'in_progress',
        toStatus: 'completed',
        changedBy: { userId: 'u_randye', name: 'Randye', color: '#6366F1' },
        timestamp: Date.now() - 3600000 * 5,
      },
    ],
    content: `Membuat editor fleksibel bergaya Notion dengan dukungan heading (#, ##, ###), todo checklist, kutipan, tabel, dan sintaks blok kode.`,
  },
  {
    id: 'task-2',
    title: 'Sinkronisasi Otomatis Antar Perangkat & Offline Queue',
    icon: '🔄',
    parentId: 'doc-sprint',
    tags: ['Backend', 'Sinkronisasi'],
    status: 'in_progress',
    priority: 'high',
    deadline: '2026-11-14',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 3,
    lastModifiedBy: {
      userId: 'u_alex',
      name: 'Alex Wijaya',
      color: '#8B5CF6',
      timestamp: Date.now() - 3600000 * 3,
      action: 'Mengubah status ke Sedang Dikerjakan',
    },
    statusHistory: [
      {
        id: 'sh-5',
        fromStatus: 'not_started',
        toStatus: 'in_progress',
        changedBy: { userId: 'u_alex', name: 'Alex Wijaya', color: '#8B5CF6' },
        timestamp: Date.now() - 3600000 * 3,
      },
    ],
    content: `Menguji kemampuan antrean offline saat jaringan terputus dan sinkronisasi otomatis kembali saat terhubung.`,
  },
  {
    id: 'task-3',
    title: 'Integrasi Kalender & Penjadwalan Tenggat',
    icon: '📅',
    parentId: 'doc-sprint',
    tags: ['Fitur', 'Kalender'],
    status: 'in_progress',
    priority: 'medium',
    deadline: '2026-11-16',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    lastModifiedBy: {
      userId: 'u_siti',
      name: 'Siti Rahma',
      color: '#10B981',
      timestamp: Date.now() - 3600000 * 1,
      action: 'Mengubah status ke Sedang Dikerjakan',
    },
    statusHistory: [
      {
        id: 'sh-6',
        fromStatus: 'not_started',
        toStatus: 'in_progress',
        changedBy: { userId: 'u_siti', name: 'Siti Rahma', color: '#10B981' },
        timestamp: Date.now() - 3600000 * 1,
      },
    ],
    content: `Tampilan kalender interaktif yang memetakan seluruh catatan bertenggat waktu ke dalam kisi bulanan yang jelas.`,
  },
  {
    id: 'task-4',
    title: 'Dasbor Metrik Produktivitas Visual',
    icon: '📊',
    parentId: 'doc-sprint',
    tags: ['Analitik', 'Dashboard'],
    status: 'not_started',
    priority: 'medium',
    deadline: '2026-11-22',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
    lastModifiedBy: {
      userId: 'u_dewi',
      name: 'Dewi Lestari',
      color: '#EC4899',
      timestamp: Date.now() - 3600000 * 12,
      action: 'Menetapkan prioritas dasbor produktivitas',
    },
    content: `Grafik visual rasio penyelesaian tugas, total kata yang diketik, dan heatmap produktivitas 7 hari terakhir.`,
  },
  {
    id: 'doc-brain',
    title: 'Second Brain & Basis Pengetahuan',
    icon: '💡',
    coverImage: '/src/assets/images/cover_nordic_nature_1794173840170.jpg',
    parentId: null,
    tags: ['Pengetahuan', 'Wiki'],
    status: 'not_started',
    priority: 'low',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 1,
    isFavorite: false,
    content: `# 💡 Second Brain & Basis Pengetahuan Pribadi

Kumpulan pemikiran, sintesis wawasan, dan catatan referensi jangka panjang.

### Kategori Catatan:
- 🧠 *Mental Models*: Cara pandang untuk memecahkan masalah kompleks
- 📚 *Reading Notes*: Esensi dari buku-buku teknologi & produktivitas
- 💻 *Code Snippets*: Pola desain perangkat lunak yang dapat digunakan ulang

> *"Pikiran Anda diciptakan untuk menghasilkan gagasan, bukan untuk menyimpannya."* — David Allen
`,
  },
  {
    id: 'doc-meeting',
    title: 'Catatan Rapat Sinkronisasi Tim & Action Items',
    icon: '☕',
    parentId: null,
    tags: ['Rapat', 'Kolaborasi'],
    status: 'in_progress',
    priority: 'medium',
    deadline: '2026-11-11',
    reminderTime: new Date(Date.now() + 60000 * 10).toISOString(), // reminder in 10 minutes for instant demo
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 1800000,
    lastModifiedBy: {
      userId: 'u_randye',
      name: 'Randye',
      color: '#6366F1',
      timestamp: Date.now() - 1800000,
      action: 'Mencatat hasil evaluasi sprint',
    },
    statusHistory: [
      {
        id: 'sh-7',
        fromStatus: 'not_started',
        toStatus: 'in_progress',
        changedBy: { userId: 'u_randye', name: 'Randye', color: '#6366F1' },
        timestamp: Date.now() - 1800000,
      },
    ],
    content: `# ☕ Rapat Sinkronisasi Mingguan Tim

**Tanggal:** 11 November 2026  
**Fasilitator:** Lead Product Designer  
**Agenda:** Evaluasi peluncuran beta dan umpan balik pengguna awal.

### 📌 Poin Pembahasan
- Diskusi kecepatan respon editor ketika membuka dokumen berskala 50 halaman.
- Pengujian audio chime untuk notifikasi pengingat waktu tenggat.
- Pengaturan skema warna: Mode Terang, Mode Gelap, Mode OLED, dan Sepia.

### 🎯 Tindak Lanjut (Action Items)
- [ ] Buat dokumentasi panduan pintasan keyboard Markdown
- [ ] Optimasi transisi animasi papan Kanban
`,
  },
  {
    id: 'doc-secure',
    title: 'Brankas Rahasia (Demo E2EE Terenkripsi)',
    icon: '🔒',
    parentId: null,
    tags: ['Rahasia', 'Enkripsi'],
    status: 'completed',
    priority: 'high',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 6,
    isEncrypted: true,
    lastModifiedBy: {
      userId: 'u_randye',
      name: 'Randye',
      color: '#6366F1',
      timestamp: Date.now() - 3600000 * 6,
      action: 'Mengamankan catatan dengan enkripsi',
    },
    // Pre-encrypted with passphrase 'noverse2026'
    encryptedPayload: {
      ciphertext: '0+XbY5i9qf8ZgTq8XwN8+G7h8sVf',
      iv: 'xYz123456789',
      salt: 'sAlT123456789012',
    },
    content: `# 🔒 Catatan Rahasia yang Terenkripsi

Catatan ini dilindungi dengan **End-to-End Encryption (E2EE)**.
Hanya pengguna dengan frasa sandi yang dapat membaca atau menyunting isi catatan ini.

Kunci sandi contoh untuk membuka demo ini: \`noverse2026\`
`,
  },
];

export const EVALUATION_DOC_ID = 'doc-workspace-evaluasi';

export const DEFAULT_EVALUATION_DATA: EvaluationData = {
  period: 'November 2026',
  updatedLabel: 'Diperbarui 13 November 2026',
  attentionHighlight: 'Progres dan belanja relatif sejalan.',
  attentionSummary: '69% tugas selesai dengan 70,8% anggaran terpakai. Tinjau kebutuhan biaya untuk pekerjaan yang tersisa.',
  weeklyFocus: 'Tuntaskan uji mobile website dan validasi pengingat habit tracker sebelum rilis.',
  projects: [
    {
      id: 'eval-p-1',
      name: 'Website portofolio',
      status: 'in_progress',
      completedTasks: 18,
      totalTasks: 24,
      budget: 5000000,
      realization: 3600000,
      evaluationNote: 'Uji navigasi mobile',
      linkedDocId: 'doc-portfolio-web',
    },
    {
      id: 'eval-p-2',
      name: 'Aplikasi habit tracker',
      status: 'in_progress',
      completedTasks: 8,
      totalTasks: 12,
      budget: 8000000,
      realization: 5600000,
      evaluationNote: 'Validasi pengingat harian',
      linkedDocId: 'doc-habit-tracker',
    },
    {
      id: 'eval-p-3',
      name: 'Identitas Kopi Sore',
      status: 'in_progress',
      completedTasks: 6,
      totalTasks: 10,
      budget: 4000000,
      realization: 2800000,
      evaluationNote: 'Finalisasi logo & kemasan',
      linkedDocId: 'doc-kopi-sore',
    },
    {
      id: 'eval-p-4',
      name: 'Newsletter Minggu Pagi',
      status: 'not_started',
      completedTasks: 0,
      totalTasks: 8,
      budget: 1500000,
      realization: 0,
      evaluationNote: 'Tetapkan ruang lingkup',
    },
    {
      id: 'eval-p-5',
      name: 'Sistem desain mini',
      status: 'completed',
      completedTasks: 10,
      totalTasks: 10,
      budget: 2500000,
      realization: 2300000,
      evaluationNote: 'Pustaka komponen selesai',
    },
    {
      id: 'eval-p-6',
      name: 'Riset pengguna',
      status: 'completed',
      completedTasks: 6,
      totalTasks: 6,
      budget: 3000000,
      realization: 2700000,
      evaluationNote: 'Riset & strategi selesai',
    },
  ],
  issues: [
    {
      id: 'issue-1',
      code: '01',
      title: 'Navigasi mobile perlu diperbaiki',
      projectName: 'Website portofolio',
      priority: 'Tinggi',
      actionPlan: 'Perbaiki menu, lalu uji pada layar kecil.',
      owner: 'Rafi',
      targetDate: 'Target 13 Nov 2026',
      status: 'Terbuka',
    },
    {
      id: 'issue-2',
      code: '02',
      title: 'Pengingat belum konsisten',
      projectName: 'Aplikasi habit tracker',
      priority: 'Sedang',
      actionPlan: 'Validasi izin notifikasi dan jadwal pengingat.',
      owner: 'Rafi',
      targetDate: 'Target 14 Nov 2026',
      status: 'Terbuka',
    },
    {
      id: 'issue-3',
      code: '03',
      title: 'Pilihan logo belum disepakati',
      projectName: 'Identitas Kopi Sore',
      priority: 'Sedang',
      actionPlan: 'Review dua alternatif dan tetapkan logo utama.',
      owner: 'Nadia',
      targetDate: 'Target 16 Nov 2026',
      status: 'Terbuka',
    },
  ],
  learnings: [
    {
      id: 'learn-1',
      tag: '01 / PERTAHANKAN',
      title: 'Dokumentasi yang rapi',
      description: 'Gunakan hasil riset dan pustaka komponen sebagai acuan proyek berikutnya.',
    },
    {
      id: 'learn-2',
      tag: '02 / PERBAIKI',
      title: 'Review lebih awal',
      description: 'Jadwalkan review di tengah pengerjaan agar revisi tidak menumpuk menjelang tenggat.',
    },
    {
      id: 'learn-3',
      tag: '03 / LANGKAH BERIKUTNYA',
      title: 'Sepakati prioritas bersama',
      description: 'Tinjau tiga masalah terbuka pada 16 November, lalu perbarui progres dan kebutuhan biaya.',
    },
  ],
};

