import type { DocItem } from '../types/index.ts';

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

export const INITIAL_DOCS: DocItem[] = [
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
