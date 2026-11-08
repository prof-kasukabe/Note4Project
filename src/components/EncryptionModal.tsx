import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            {isUnlocked ? <Unlock size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.encryptedVault}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isUnlocked ? t.e2eeUnlocked : t.e2eeLocked}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
          {t.passphraseDesc}
        </p>

        {isUnlocked ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>Brankas aktif dan dapat membaca seluruh catatan rahasia yang terenkripsi.</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={onExportEncryptedVault}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={14} />
                <span>Unduh Cadangan Brankas Terenkripsi (.json)</span>
              </button>

              <button
                onClick={() => {
                  onLock();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Lock size={14} />
                <span>{t.lockAll}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.enterPassphrase}
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Masukkan frasa sandi (contoh demo: noverse2026)"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Tips demo: gunakan frasa <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">noverse2026</code>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-500 flex items-center gap-1.5">
                <AlertCircle size={13} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
