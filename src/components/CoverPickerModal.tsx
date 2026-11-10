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
  { id: 'grad-emerald', name: 'Sage & Emerald', value: 'linear-gradient(135deg, #8CA796 0%, #567561 100%)' },
  { id: 'grad-sunset', name: 'Warm Amber', value: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' },
  { id: 'grad-noir', name: 'Warm Minimalist', value: 'linear-gradient(135deg, #282925 0%, #121211 100%)' },
  { id: 'grad-rose', name: 'Dusty Rose', value: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)' },
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 select-none animate-in fade-in duration-150 font-sans">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] flex items-center justify-center">
              <ImageIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                {lang === 'id' ? 'Ganti Sampul & Latar Belakang' : 'Change Cover & Background'}
              </h3>
              <p className="text-[11px] text-[#777973]">
                {lang === 'id' ? 'Unggah dari perangkat atau pilih preset estetik' : 'Upload from your device or pick a preset'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#777973] hover:text-[#282925] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#EAEAE5] dark:border-[#2B2B28] px-5 gap-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'upload'
                ? 'border-[#282925] dark:border-[#EDEDE8] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                : 'border-transparent text-[#777973] hover:text-[#282925]'
            }`}
          >
            <HardDrive size={14} />
            <span>{lang === 'id' ? 'Pilih dari Perangkat' : 'From Device'}</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'presets'
                ? 'border-[#282925] dark:border-[#EDEDE8] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                : 'border-transparent text-[#777973] hover:text-[#282925]'
            }`}
          >
            <Sparkles size={14} />
            <span>{lang === 'id' ? 'Preset Galeri' : 'Presets Gallery'}</span>
          </button>

          <button
            onClick={() => setActiveTab('gradients')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'gradients'
                ? 'border-[#282925] dark:border-[#EDEDE8] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                : 'border-transparent text-[#777973] hover:text-[#282925]'
            }`}
          >
            <Palette size={14} />
            <span>{lang === 'id' ? 'Gradien Minimalis' : 'Gradients'}</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'url'
                ? 'border-[#282925] dark:border-[#EDEDE8] text-[#282925] dark:text-[#EDEDE8] font-semibold'
                : 'border-transparent text-[#777973] hover:text-[#282925]'
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
                className={`border-2 border-dashed rounded-[6px] p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-[#282925] bg-[#F8F8F6] dark:bg-[#181816]'
                    : 'border-[#EAEAE5] dark:border-[#2B2B28] hover:border-[#282925] hover:bg-[#F8F8F6] dark:hover:bg-[#181816]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    {lang === 'id'
                      ? 'Klik untuk memilih foto dari perangkat Anda'
                      : 'Click to select photo from your device'}
                  </p>
                  <p className="text-[11px] text-[#777973] mt-1">
                    {lang === 'id'
                      ? 'Mendukung format PNG, JPG, GIF, WebP dari galeri ponsel atau komputer'
                      : 'Supports PNG, JPG, GIF, WebP from phone or computer storage'}
                  </p>
                </div>
              </div>

              {/* Preview of Selected Device Image */}
              {previewImage && (
                <div className="mt-4 p-3 bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] space-y-3">
                  <div className="text-xs font-medium text-[#282925] dark:text-[#EDEDE8] flex items-center justify-between">
                    <span>{lang === 'id' ? 'Pratinjau Gambar Terpilih:' : 'Selected Image Preview:'}</span>
                    <button
                      onClick={() => setPreviewImage(null)}
                      className="text-rose-500 hover:underline text-[11px] cursor-pointer"
                    >
                      {lang === 'id' ? 'Batal' : 'Clear'}
                    </button>
                  </div>
                  <div className="h-32 w-full rounded-[4px] overflow-hidden border border-[#EAEAE5] dark:border-[#2B2B28]">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleApplyUploaded}
                    className="w-full py-2 px-4 rounded-[6px] bg-[#282925] hover:bg-[#3E3F3B] text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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
                  className="rounded-[6px] overflow-hidden border border-[#EAEAE5] dark:border-[#2B2B28] text-left group hover:border-[#282925] transition-colors cursor-pointer"
                >
                  <div className="h-24 w-full overflow-hidden bg-[#F8F8F6] dark:bg-[#181816]">
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
                  <div className="p-2 text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
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
                  className="rounded-[6px] overflow-hidden border border-[#EAEAE5] dark:border-[#2B2B28] text-left group hover:border-[#282925] transition-colors cursor-pointer"
                >
                  <div className="h-20 w-full" style={{ background: grad.value }} />
                  <div className="p-2 text-xs font-medium text-[#282925] dark:text-[#EDEDE8] truncate">
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
                <label className="block text-xs font-medium text-[#282925] dark:text-[#EDEDE8] mb-1.5">
                  {lang === 'id' ? 'Masukkan URL Gambar Langsung:' : 'Enter Direct Image URL:'}
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/wallpaper.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-[6px] bg-[#282925] hover:bg-[#3E3F3B] text-white font-medium text-xs transition-colors cursor-pointer"
              >
                {lang === 'id' ? 'Gunakan Gambar Tautan' : 'Use Linked Image'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer: Remove Cover Option */}
        {currentCover && (
          <div className="px-5 py-3 border-t border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] flex items-center justify-between">
            <span className="text-xs text-[#777973]">
              {lang === 'id' ? 'Sampul aktif digunakan' : 'Cover is currently set'}
            </span>
            <button
              onClick={() => {
                onSelectCover(undefined);
                onClose();
              }}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
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
