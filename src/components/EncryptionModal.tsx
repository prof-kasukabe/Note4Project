import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Key, 
  X, 
  Download, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/i18n';

interface EncryptionModalProps {
  isOpen: boolean;
  isUnlocked: boolean;
  lang: Language;
  onClose: () => void;
  onUnlock: (passphrase: string) => Promise<boolean>;
  onLock: () => void;
  onExportEncryptedVault: () => void;
}

export const EncryptionModal: React.FC<EncryptionModalProps> = ({
  isOpen,
  isUnlocked,
  lang,
  onClose,
  onUnlock,
  onLock,
  onExportEncryptedVault,
}) => {
  const t = translations[lang];
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || passphrase.length < 4) {
      setError(t.passphraseRequired);
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const ok = await onUnlock(passphrase);
      if (ok) {
        setSuccessMsg(t.decryptSuccess);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(t.wrongPassphrase);
      }
    } catch {
      setError(t.wrongPassphrase);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none font-sans">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#777973] hover:text-[#282925] transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-amber-600 flex items-center justify-center">
            {isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8]">
              {t.encryptedVault}
            </h3>
            <span className="text-xs text-[#777973]">
              {isUnlocked ? t.e2eeUnlocked : t.e2eeLocked}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#777973] leading-relaxed mb-5">
          {t.passphraseDesc}
        </p>

        {isUnlocked ? (
          <div className="space-y-4">
            <div className="p-3 rounded-[6px] bg-[#EDF3EE] dark:bg-[#1E2B22] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#567561] text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Brankas aktif dan dapat membaca seluruh catatan rahasia yang terenkripsi.</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={onExportEncryptedVault}
                className="w-full py-2 px-3 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] hover:bg-[#EAEAE5] text-[#282925] dark:text-[#EDEDE8] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download size={14} />
                <span>Unduh Cadangan Brankas Terenkripsi (.json)</span>
              </button>

              <button
                onClick={() => {
                  onLock();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-[6px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lock size={14} />
                <span>{t.lockAll}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#282925] dark:text-[#EDEDE8] mb-1">
                {t.enterPassphrase}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Masukkan frasa sandi (contoh demo: noverse2026)"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="text-[11px] text-[#A1A29B] mt-1 font-mono">
                Tips demo: gunakan frasa <code className="bg-[#F8F8F6] dark:bg-[#181816] px-1 rounded border border-[#EAEAE5] dark:border-[#2B2B28]">noverse2026</code>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-500 flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-[#567561] flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-[6px] bg-[#282925] hover:bg-[#3E3F3B] text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Key size={14} />
              <span>{loading ? t.syncing : t.unlockDocument}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
