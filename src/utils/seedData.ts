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

export const MOBILE_PROJECT_DOC_ID = 'doc-habit-tracker';

export const DEFAULT_MOBILE_PROJECT_DATA: ProjectDetailData = {
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
  content: `# 📱 Aplikasi habit tracker

**Kategori:** Aplikasi mobile · Produk digital  
**Penanggung Jawab:** Andi Darma  
**Tenggat:** 16 November 2026  

Aplikasi mobile untuk mencatat kebiasaan harian, menjaga konsistensi, dan melihat progres. Fokus pada alur sederhana dan pengingat yang membantu.

---

### 🎯 Hasil yang Dituju
- [ ] Onboarding & daftar kebiasaan
- [ ] Pengingat harian
- [x] Statistik progres mingguan

### 📝 Catatan untuk Tim
Pengingat harus bisa diatur per kebiasaan. Gunakan pola navigasi yang konsisten di Android dan iOS.
`,
});

export const DESIGN_PROJECT_DOC_ID = 'doc-kopi-sore';

export const DEFAULT_DESIGN_PROJECT_DATA: ProjectDetailData = {
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
  content: `# 🎨 Identitas Kopi Sore

**Kategori:** Desain · Identitas merek  
**Penanggung Jawab:** Nadia Putri  
**Tenggat:** 20 November 2026  

Merancang identitas visual Kopi Sore yang hangat, bersahaja, dan dekat. Mencakup logo, warna, tipografi, kemasan, serta panduan penggunaan merek.

---

### 🎯 Hasil yang Dituju
- [ ] Logo utama & variasi
- [x] Palet warna & tipografi
- [ ] Panduan merek & kemasan

### 📝 Catatan untuk Tim
Pertahankan nuansa hangat dan natural. Pastikan logo tetap terbaca pada ukuran kecil serta versi satu warna.
`,
});

export const INITIAL_DOCS: DocItem[] = [
  {
    id: 'doc-portfolio-web',
    title: 'Website portofolio',
    icon: '🌐',
    parentId: null,
    tags: ['Website', 'Desain & Pengembangan'],
    status: 'in_progress',
    priority: 'medium',
    deadline: '2026-11-13',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 1800000,
    isFavorite: true,
    lastModifiedBy: {
      userId: 'u_andi',
      name: 'Andi Darma',
      color: '#6366F1',
      timestamp: Date.now() - 1800000,
      action: 'Memperbarui dokumen Website Portofolio',
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
    content: `# 🌐 Website Portofolio

**Kategori:** Website · Desain & Pengembangan  
**Penanggung Jawab:** Andi Darma  
**Tenggat:** 13 November 2026  

Ruang untuk menampilkan karya, cerita, dan hal yang kamu kerjakan. Fokus pada pengalaman yang ringan, responsif, dan mudah diperbarui.

---

### 🎯 Hasil yang Dituju
- [ ] Halaman utama & profil
- [ ] Studi kasus & kontak
- [x] Website responsif di seluruh perangkat

### 🛠️ Alat Kerja Terhubung
- **Figma**: Desain UI & prototipe
- **GitHub**: Repositori & review perubahan
- **Vercel**: Preview & publikasi website
`,
  },
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

