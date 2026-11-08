import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Check, 
  Sparkles, 
  Link2,
  Trash2,
  HardDrive
} from 'lucide-react';
import { COVER_PRESETS } from '../utils/seedData';
import { Language } from '../types';
import { translations } from '../utils/i18n';

interface CoverPickerModalProps {
  isOpen: boolean;
  currentCover?: string;
  lang: Language;
  onClose: () => void;
  onSelectCover: (coverUrl?: string) => void;
}

const GRADIENT_PRESETS = [
  { id: 'grad-twilight', name: 'Twilight Blue', value: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { id: 'grad-indigo', name: 'Deep Indigo', value: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' },
  { id: 'grad-emerald', name: 'Emerald Forest', value: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' },
  { id: 'grad-sunset', name: 'Sunset Glow', value: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' },
  { id: 'grad-noir', name: 'Minimalist Slate', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { id: 'grad-rose', name: 'Rose Petal', value: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)' },
];

export const CoverPickerModal: React.FC<CoverPickerModalProps> = ({
  isOpen,
  currentCover,
  lang,
  onClose,
  onSelectCover,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'gradients' | 'url'>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(lang === 'id' ? 'Silakan pilih berkas gambar.' : 'Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUploaded = () => {
    if (previewImage) {
      onSelectCover(previewImage);
      onClose();
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onSelectCover(urlInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'id' ? 'Ganti Sampul & Latar Belakang' : 'Change Cover & Background'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'id' ? 'Unggah dari perangkat atau pilih preset estetik' : 'Upload from your device or pick a preset'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 gap-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <HardDrive size={14} />
            <span>{lang === 'id' ? 'Pilih dari Perangkat' : 'From Device'}</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles size={14} />
            <span>{lang === 'id' ? 'Preset Galeri' : 'Presets Gallery'}</span>
          </button>

          <button
            onClick={() => setActiveTab('gradients')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'gradients'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Palette size={14} />
            <span>{lang === 'id' ? 'Gradien Minimalis' : 'Gradients'}</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Link2 size={14} />
            <span>{lang === 'id' ? 'Tautan Gambar' : 'Image Link'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: UPLOAD FROM DEVICE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {lang === 'id'
                      ? 'Klik untuk memilih foto dari perangkat Anda'
                      : 'Click to select photo from your device'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'id'
                      ? 'Mendukung format PNG, JPG, GIF, WebP dari galeri ponsel atau laptop'
                      : 'Supports PNG, JPG, GIF, WebP from phone camera roll or computer'}
                  </p>
                </div>
              </div>

              {/* Preview of Selected Device Image */}
              {previewImage && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{lang === 'id' ? 'Pratinjau Gambar Terpilih:' : 'Selected Image Preview:'}</span>
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="text-rose-500 hover:text-rose-600 text-[11px]"
                    >
                      {lang === 'id' ? 'Batal' : 'Clear'}
                    </button>
                  </div>
                  <div className="h-32 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleApplyUploaded}
                    className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check size={14} />
                    <span>{lang === 'id' ? 'Terapkan Sebagai Sampul' : 'Apply as Cover'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRESETS GALLERY */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectCover(preset.url);
                    onClose();
                  }}
                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-left group hover:ring-2 hover:ring-indigo-500 transition-all"
                >
                  <div className="h-24 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {preset.url.startsWith('linear-gradient') ? (
                      <div className="w-full h-full" style={{ background: preset.url }} />
                    ) : (
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="p-2 text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: GRADIENTS */}
          {activeTab === 'gradients' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GRADIENT_PRESETS.map((grad) => (
                <button
                  key={grad.id}
                  onClick={() => {
                    onSelectCover(grad.value);
                    onClose();
                  }}
                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-left group hover:ring-2 hover:ring-indigo-500 transition-all"
                >
                  <div className="h-20 w-full" style={{ background: grad.value }} />
                  <div className="p-2 text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {grad.name}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 4: DIRECT URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'id' ? 'Masukkan URL Gambar Langsung:' : 'Enter Direct Image URL:'}
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/wallpaper.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
              >
                {lang === 'id' ? 'Gunakan Gambar Tautan' : 'Use Linked Image'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer: Remove Cover Option */}
        {currentCover && (
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'id' ? 'Sampul aktif digunakan' : 'Cover is currently set'}
            </span>
            <button
              onClick={() => {
                onSelectCover(undefined);
                onClose();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
            >
              <Trash2 size={13} />
              <span>{lang === 'id' ? 'Hapus Sampul' : 'Remove Cover'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
