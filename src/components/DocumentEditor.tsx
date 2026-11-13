import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Trash2, 
  Calendar, 
  Clock, 
  Tag, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Edit3, 
  Columns, 
  Plus, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  CheckSquare, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  SplitSquareVertical, 
  X,
  AlertCircle,
  History,
  KeyRound
} from 'lucide-react';
import { DocItem, DocStatus, DocPriority, Language, Collaborator } from '../types';
import { translations } from '../utils/i18n';
import { parseMarkdownToBlocks, formatInlineMarkdown } from '../utils/markdown';
import { formatTimeAgo } from '../utils/formatTime';
import { CoverPickerModal } from './CoverPickerModal';

interface DocumentEditorProps {
  doc: DocItem;
  subPages: DocItem[];
  lang: Language;
  collaborators: Collaborator[];
  isVaultUnlocked: boolean;
  isDocUnlocked?: boolean;
  unlockedContent?: string;
  onUpdateDoc: (updated: Partial<DocItem>) => void;
  onSelectDoc: (id: string) => void;
  onCreateSubPage: (parentId: string) => void;
  onSendCursor: (cursor: { blockIndex?: number; text?: string }) => void;
  onUnlockVault: (passphrase: string) => Promise<boolean>;
  onLockWithPassword: (passphrase: string) => Promise<boolean>;
  onUnlockWithPassword: (passphrase: string, permanent?: boolean) => Promise<boolean>;
  onRelockDoc: () => Promise<void>;
}

const EMOJI_PRESETS = ['📄', '🚀', '📋', '💡', '⚙️', '📝', '🎯', '🌿', '☕', '🔒', '📚', '⚡', '💻', '🎨', '🔥', '✨'];

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  doc,
  subPages,
  lang,
  collaborators,
  isVaultUnlocked,
  isDocUnlocked,
  unlockedContent,
  onUpdateDoc,
  onSelectDoc,
  onCreateSubPage,
  onSendCursor,
  onUnlockVault,
  onLockWithPassword,
  onUnlockWithPassword,
  onRelockDoc,
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('edit');
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [showInlinePassword, setShowInlinePassword] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Per-document lock/unlock modal state (triggered by the lock button)
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [lockModalError, setLockModalError] = useState('');
  const [isLockProcessing, setIsLockProcessing] = useState(false);
  const [removeLockOnUnlock, setRemoveLockOnUnlock] = useState(false);

  useEffect(() => {
    setPassphraseInput('');
    setDecryptError('');
    setShowLockModal(false);
    setLockPasswordInput('');
    setLockModalError('');
    setRemoveLockOnUnlock(false);
  }, [doc.id]);

  // Slash command menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize title & content
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDoc({ title: e.target.value, updatedAt: Date.now() });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onUpdateDoc({ content: newContent, updatedAt: Date.now() });
    onSendCursor({ text: newContent.slice(0, 30) });

    // Check for slash command at caret
    const caret = e.target.selectionStart;
    const textBeforeCaret = newContent.slice(0, caret);
    const lastSlash = textBeforeCaret.lastIndexOf('/');
    if (lastSlash >= 0 && (lastSlash === 0 || textBeforeCaret[lastSlash - 1] === '\n' || textBeforeCaret[lastSlash - 1] === ' ')) {
      const query = textBeforeCaret.slice(lastSlash + 1);
      if (!query.includes('\n')) {
        setShowSlashMenu(true);
        setSlashQuery(query.toLowerCase());
        setSlashIndex(0);
        return;
      }
    }
    setShowSlashMenu(false);
  };

  // Insert markdown syntax helper
  const insertMarkdown = (before: string, after = '', replaceSlash = false) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    let actualStart = start;
    if (replaceSlash) {
      const textBefore = text.slice(0, start);
      const lastSlash = textBefore.lastIndexOf('/');
      if (lastSlash >= 0) {
        actualStart = lastSlash;
      }
    }

    const selected = text.substring(actualStart, end);
    const replacement = `${before}${after ? selected + after : ''}`;
    const newText = text.substring(0, actualStart) + replacement + text.substring(end);

    onUpdateDoc({ content: newText, updatedAt: Date.now() });
    setShowSlashMenu(false);

    setTimeout(() => {
      textarea.focus();
      const pos = actualStart + replacement.length;
      textarea.setSelectionRange(pos, pos);
    }, 10);
  };

  const slashOptions = [
    { label: t.blockHeading1, prefix: '# ', icon: <Heading1 size={14} />, desc: 'Judul bagian besar' },
    { label: t.blockHeading2, prefix: '## ', icon: <Heading2 size={14} />, desc: 'Sub-judul tingkat 2' },
    { label: t.blockHeading3, prefix: '### ', icon: <Heading3 size={14} />, desc: 'Sub-judul kecil' },
    { label: t.blockTodo, prefix: '- [ ] ', icon: <CheckSquare size={14} />, desc: 'Daftar tugas dengan kotak centang' },
    { label: t.blockBullet, prefix: '- ', icon: <List size={14} />, desc: 'Daftar poin terorganisir' },
    { label: 'Numbered List', prefix: '1. ', icon: <ListOrdered size={14} />, desc: 'Daftar angka urut' },
    { label: t.blockQuote, prefix: '> ', icon: <Quote size={14} />, desc: 'Kutipan inspiratif atau sorotan' },
    { label: t.blockCode, prefix: '```typescript\n', suffix: '\n```', icon: <Code size={14} />, desc: 'Blok kode dengan penyorotan' },
    { label: t.blockDivider, prefix: '\n---\n', icon: <SplitSquareVertical size={14} />, desc: 'Garis pemisah visual' },
  ].filter((opt) => opt.label.toLowerCase().includes(slashQuery) || opt.desc.toLowerCase().includes(slashQuery));

  const isDocumentLocked = Boolean(
    doc.isEncrypted && !(isDocUnlocked ?? isVaultUnlocked)
  );
  const effectiveContent =
    doc.isEncrypted && !isDocumentLocked && unlockedContent !== undefined
      ? unlockedContent
      : doc.content || '';

  // Toggle todo item in markdown preview
  const handleToggleTodo = (blockIndex: number, _currentText: string, currentChecked: boolean) => {
    const lines = effectiveContent.split('\n');
    let todoCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^-\s*\[([ xX])\]/)) {
        if (todoCount === blockIndex) {
          const newStatus = currentChecked ? ' ' : 'x';
          lines[i] = lines[i].replace(/^-\s*\[([ xX])\]/, `- [${newStatus}]`);
          break;
        }
        todoCount++;
      }
    }
    onUpdateDoc({ content: lines.join('\n'), updatedAt: Date.now() });
  };

  const handleAddTag = () => {
    if (newTagText.trim() && !doc.tags.includes(newTagText.trim())) {
      onUpdateDoc({
        tags: [...doc.tags, newTagText.trim()],
        updatedAt: Date.now(),
      });
      setNewTagText('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateDoc({
      tags: doc.tags.filter((t) => t !== tagToRemove),
      updatedAt: Date.now(),
    });
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphraseInput) {
      setDecryptError(
        lang === 'id' ? 'Masukkan password terlebih dahulu.' : 'Please enter the password first.'
      );
      return;
    }
    setIsDecrypting(true);
    setDecryptError('');
    try {
      const ok = onUnlockWithPassword
        ? await onUnlockWithPassword(passphraseInput, false)
        : await onUnlockVault(passphraseInput);
      if (!ok) {
        setDecryptError(
          lang === 'id'
            ? 'Password salah! Gunakan password yang sama dengan saat mengunci dokumen.'
            : 'Incorrect password! Enter the same password used when locking.'
        );
      } else {
        setPassphraseInput('');
      }
    } catch {
      setDecryptError(t.wrongPassphrase);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleOpenLockModal = () => {
    setLockPasswordInput('');
    setLockModalError('');
    setShowModalPassword(false);
    setRemoveLockOnUnlock(false);
    setShowLockModal(true);
  };

  const handleSubmitLockModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockPasswordInput) {
      setLockModalError(
        lang === 'id' ? 'Masukkan password terlebih dahulu.' : 'Please enter a password first.'
      );
      return;
    }
    setIsLockProcessing(true);
    setLockModalError('');
    try {
      if (!doc.isEncrypted) {
        const ok = await onLockWithPassword(lockPasswordInput);
        if (ok) {
          setLockPasswordInput('');
          setShowLockModal(false);
        } else {
          setLockModalError(
            lang === 'id' ? 'Gagal mengunci dokumen.' : 'Failed to lock document.'
          );
        }
      } else if (isDocumentLocked) {
        const ok = await onUnlockWithPassword(lockPasswordInput, removeLockOnUnlock);
        if (ok) {
          setLockPasswordInput('');
          setShowLockModal(false);
        } else {
          setLockModalError(
            lang === 'id'
              ? 'Password salah! Masukkan password yang sama saat mengunci.'
              : 'Wrong password! Enter the same password used to lock.'
          );
        }
      } else {
        // Already unlocked in session -> permanently disable lock after verifying password
        const ok = await onUnlockWithPassword(lockPasswordInput, true);
        if (ok) {
          setLockPasswordInput('');
          setShowLockModal(false);
        } else {
          setLockModalError(
            lang === 'id'
              ? 'Password salah! Masukkan password yang sama untuk menonaktifkan kunci.'
              : 'Wrong password! Enter the matching password to disable lock.'
          );
        }
      }
    } catch {
      setLockModalError(t.wrongPassphrase);
    } finally {
      setIsLockProcessing(false);
    }
  };

  const handleQuickRelock = async () => {
    setIsLockProcessing(true);
    setLockModalError('');
    try {
      await onRelockDoc();
      setLockPasswordInput('');
      setShowLockModal(false);
    } finally {
      setIsLockProcessing(false);
    }
  };

  // Word and character stats
  const wordCount = isDocumentLocked ? 0 : effectiveContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = isDocumentLocked ? 0 : effectiveContent.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const parsedBlocks = parseMarkdownToBlocks(effectiveContent);

  const getStatusBadgeStyle = (status: DocStatus) => {
    switch (status) {
      case 'in_progress':
        return 'bg-[#EBF0F5] text-[#5D748B] dark:bg-[#242A32] dark:text-[#9AB3CC]';
      case 'completed':
        return 'bg-[#EDF3EE] text-[#567561] dark:bg-[#1E2B22] dark:text-[#93BFA1]';
      case 'not_started':
        return 'bg-[#F4F4F0] text-[#777973] dark:bg-[#252522] dark:text-[#A1A29B]';
      case 'archived':
        return 'bg-[#F4F4F0] text-[#A1A29B]';
      default:
        return 'bg-[#F4F4F0] text-[#777973]';
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] flex flex-col relative select-text font-sans">
      {/* Document Cover Banner */}
      {doc.coverImage ? (
        <div className="relative group w-full h-40 sm:h-52 shrink-0 overflow-hidden bg-[#F8F8F6] dark:bg-[#181816]">
          {doc.coverImage.startsWith('linear-gradient') ? (
            <div className="w-full h-full" style={{ background: doc.coverImage }} />
          ) : (
            <img
              src={doc.coverImage}
              alt="Cover"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute bottom-3 right-4 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-[#282925]/90 backdrop-blur-md p-1.5 rounded-[6px] text-xs text-white shadow-md">
            <button
              onClick={() => setShowCoverModal(true)}
              className="px-2.5 py-1 hover:bg-white/10 rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ImageIcon size={13} />
              <span>{t.changeCover}</span>
            </button>
            <button
              onClick={() => onUpdateDoc({ coverImage: undefined, updatedAt: Date.now() })}
              className="px-2 py-1 hover:bg-rose-500/30 text-rose-300 rounded-[4px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">{t.removeCover}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-end px-6 sm:px-12 pt-3">
          <button
            onClick={() => setShowCoverModal(true)}
            className="text-xs text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] flex items-center gap-1.5 bg-[#F8F8F6] dark:bg-[#181816] hover:bg-[#EAEAE5] border border-[#EAEAE5] dark:border-[#2B2B28] px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer font-medium"
          >
            <ImageIcon size={13} />
            <span>{t.changeCover}</span>
          </button>
        </div>
      )}

      {/* Cover Picker Modal */}
      <CoverPickerModal
        isOpen={showCoverModal}
        currentCover={doc.coverImage}
        lang={lang}
        onClose={() => setShowCoverModal(false)}
        onSelectCover={(newCover) => onUpdateDoc({ coverImage: newCover, updatedAt: Date.now() })}
      />

      {/* Main Document Content Container */}
      <div className="max-w-4xl w-full mx-auto px-6 sm:px-10 md:px-12 py-5 flex-1 flex flex-col">
        {/* Document Icon & Title Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="relative inline-block">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title={t.changeIcon}
                className="w-12 h-12 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-center text-3xl hover:bg-[#EAEAE5] transition-colors cursor-pointer"
              >
                {doc.icon || '📄'}
              </button>

              {showEmojiPicker && (
                <div 
                  onMouseLeave={() => setShowEmojiPicker(false)}
                  className="absolute left-0 top-14 p-2 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] shadow-2xl grid grid-cols-8 gap-1.5 z-40 text-xl"
                >
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onUpdateDoc({ icon: emoji, updatedAt: Date.now() });
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 rounded hover:bg-[#F8F8F6] dark:hover:bg-[#252522] transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Pill Buttons */}
            <div className="flex items-center gap-2 text-xs text-[#777973]">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-2 py-1 rounded-[4px] hover:bg-[#F8F8F6] dark:hover:bg-[#181816] transition-colors cursor-pointer"
              >
                <span>{t.changeIcon}</span>
              </button>
              <span className="text-[#A1A29B]">•</span>
              <button
                onClick={() => setShowCoverModal(true)}
                className="px-2 py-1 rounded-[4px] hover:bg-[#F8F8F6] dark:hover:bg-[#181816] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ImageIcon size={13} className="text-[#777973]" />
                <span>{doc.coverImage ? t.changeCover : 'Tambah Sampul / Latar'}</span>
              </button>
            </div>
          </div>

          {/* Editable Document Title */}
          <input
            type="text"
            value={doc.title}
            onChange={handleTitleChange}
            placeholder={t.emptyTitle}
            className="w-full text-2xl sm:text-3xl font-semibold tracking-tight bg-transparent text-[#282925] dark:text-[#EDEDE8] placeholder-[#A1A29B] focus:outline-none"
          />
        </div>

        {/* Metadata Strip: Status, Priority, Deadline, Reminders, Tags, E2EE (Figma border #EAEAE5) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-3 border-y border-[#EAEAE5] dark:border-[#2B2B28] text-xs text-[#777973] mb-6">
          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#A1A29B]">{t.status}:</span>
            <select
              value={doc.status}
              onChange={(e) => onUpdateDoc({ status: e.target.value as DocStatus, updatedAt: Date.now() })}
              className={`rounded-[4px] px-2.5 py-1 text-xs font-medium border border-[#EAEAE5] dark:border-[#2B2B28] focus:outline-none cursor-pointer ${getStatusBadgeStyle(doc.status)}`}
            >
              <option value="not_started">{t.notStarted}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="completed">{t.completed}</option>
              <option value="archived">{t.archived}</option>
            </select>
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#A1A29B]">{t.priority}:</span>
            <select
              value={doc.priority}
              onChange={(e) => onUpdateDoc({ priority: e.target.value as DocPriority, updatedAt: Date.now() })}
              className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] px-2 py-1 text-[#282925] dark:text-[#EDEDE8] focus:outline-none cursor-pointer text-xs"
            >
              <option value="low">{t.low}</option>
              <option value="medium">{t.medium}</option>
              <option value="high">{t.high}</option>
            </select>
          </div>

          {/* Deadline date picker */}
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-[#A1A29B] shrink-0" />
            <input
              type="date"
              value={doc.deadline || ''}
              onChange={(e) => onUpdateDoc({ deadline: e.target.value || undefined, updatedAt: Date.now() })}
              className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] px-2 py-0.5 text-[#282925] dark:text-[#EDEDE8] focus:outline-none text-xs"
            />
          </div>

          {/* Time Reminder picker */}
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-[#8CA796] shrink-0" />
            <input
              type="datetime-local"
              value={doc.reminderTime ? new Date(doc.reminderTime).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const val = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                onUpdateDoc({ reminderTime: val, reminderNotified: false, updatedAt: Date.now() });
              }}
              title={t.reminder}
              className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] px-2 py-0.5 text-[#282925] dark:text-[#EDEDE8] focus:outline-none text-xs"
            />
          </div>

          {/* Tags list */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag size={13} className="text-[#A1A29B] shrink-0" />
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#F4F4F0] dark:bg-[#252522] text-[#777973] dark:text-[#A1A29B] text-[11px]"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {showTagInput ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Tag baru..."
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-20 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[4px] px-1.5 py-0.5 text-[11px] focus:outline-none text-[#282925] dark:text-[#EDEDE8]"
                  autoFocus
                />
                <button onClick={handleAddTag} className="text-[#282925] dark:text-[#EDEDE8]">
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="p-1 rounded text-[#777973] hover:text-[#282925] cursor-pointer"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          {/* E2EE Lock / Unlock Password Button */}
          <button
            onClick={handleOpenLockModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium border border-[#EAEAE5] dark:border-[#2B2B28] transition-colors cursor-pointer ${
              doc.isEncrypted
                ? isDocumentLocked
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-[#F8F8F6] dark:bg-[#181816] text-[#777973] hover:text-[#282925]'
            }`}
          >
            {doc.isEncrypted && isDocumentLocked ? <Lock size={12} /> : doc.isEncrypted ? <Unlock size={12} /> : <Lock size={12} />}
            <span>
              {doc.isEncrypted
                ? isDocumentLocked
                  ? (lang === 'id' ? 'Terkunci · Buka' : 'Locked · Unlock')
                  : (lang === 'id' ? 'Terbuka · Kunci' : 'Unlocked · Lock')
                : t.lockDocument}
            </span>
          </button>

          {/* Last Modified By (Status & Progress Audit Pill) */}
          {doc.lastModifiedBy && (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-[11px] text-[#777973]"
              title={`${doc.lastModifiedBy.action || 'Diperbarui'} (${new Date(doc.lastModifiedBy.timestamp).toLocaleString()})`}
            >
              <div
                style={{ backgroundColor: doc.lastModifiedBy.color || '#6366F1' }}
                className="w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
              >
                {doc.lastModifiedBy.name.charAt(0).toUpperCase()}
              </div>
              <span>
                <span className="text-[#A1A29B] mr-1">{lang === 'id' ? 'Diubah oleh:' : 'Updated by:'}</span>
                <span className="font-semibold text-[#282925] dark:text-[#EDEDE8]">{doc.lastModifiedBy.name}</span>
                <span className="text-[#A1A29B] ml-1">· {formatTimeAgo(doc.lastModifiedBy.timestamp, lang)}</span>
              </span>
            </div>
          )}

          {/* Progress Audit Trail Modal Trigger */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] text-[11px] font-medium hover:bg-[#EAEAE5] transition-colors cursor-pointer"
            title="Lihat riwayat siapa yang mengubah status dokumen ini"
          >
            <History size={12} />
            <span>{lang === 'id' ? 'Riwayat Progres' : 'Progress Audit'}</span>
            {doc.statusHistory && doc.statusHistory.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-[#EAEAE5] dark:bg-[#252522] text-[10px] font-mono">
                {doc.statusHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Audit Trail Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-[#282925] dark:text-[#EDEDE8] flex items-center justify-center">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                      {lang === 'id' ? 'Riwayat Perubahan Progres & Status' : 'Progress & Status Audit Trail'}
                    </h3>
                    <p className="text-[11px] text-[#777973]">
                      {doc.title || 'Dokumen'} · {doc.statusHistory?.length || 0} catatan perubahan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded text-[#777973] hover:text-[#282925] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
                {doc.statusHistory && doc.statusHistory.length > 0 ? (
                  doc.statusHistory.map((item, idx) => {
                    const statusLabel = (st: DocStatus) => {
                      switch (st) {
                        case 'completed': return { text: t.completed, color: 'text-[#567561] bg-[#EDF3EE] dark:bg-[#1E2B22]' };
                        case 'in_progress': return { text: t.inProgress, color: 'text-[#5D748B] bg-[#EBF0F5] dark:bg-[#242A32]' };
                        case 'archived': return { text: t.archived, color: 'text-[#777973] bg-[#F4F4F0]' };
                        default: return { text: t.notStarted, color: 'text-[#777973] bg-[#F4F4F0]' };
                      }
                    };

                    const fromSt = statusLabel(item.fromStatus);
                    const toSt = statusLabel(item.toStatus);

                    return (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] flex items-start gap-3"
                      >
                        <div
                          style={{ backgroundColor: item.changedBy.color || '#6366F1' }}
                          className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                        >
                          {item.changedBy.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8]">
                              {item.changedBy.name}
                            </span>
                            <span className="text-[10px] text-[#A1A29B] font-mono">
                              {formatTimeAgo(item.timestamp, lang)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${fromSt.color}`}>
                              {fromSt.text}
                            </span>
                            <span className="text-[#A1A29B]">➔</span>
                            <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${toSt.color}`}>
                              {toSt.text}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#A1A29B] mt-1">
                            {new Date(item.timestamp).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-[#A1A29B] text-xs">
                    {lang === 'id' ? 'Belum ada riwayat perubahan status pada dokumen ini.' : 'No status change history for this document yet.'}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-3.5 py-1.5 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] hover:bg-[#EAEAE5] text-[#282925] dark:text-[#EDEDE8] text-xs font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Lock / Unlock Modal */}
        {showLockModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[8px] shadow-2xl max-w-md w-full p-5 relative">
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className="p-1 rounded text-[#777973] hover:text-[#282925] dark:hover:text-[#EDEDE8] absolute top-4 right-4 cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] text-amber-600 flex items-center justify-center shrink-0">
                  {doc.isEncrypted && !isDocumentLocked ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
                    {!doc.isEncrypted
                      ? (lang === 'id' ? 'Kunci Dokumen dengan Password' : 'Lock Document with Password')
                      : isDocumentLocked
                        ? (lang === 'id' ? 'Buka Dokumen Terkunci' : 'Unlock Document')
                        : (lang === 'id' ? 'Kelola Kunci Dokumen' : 'Manage Document Lock')}
                  </h3>
                  <p className="text-[11px] text-[#777973]">
                    {doc.title || 'Dokumen'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#777973] mb-4 leading-relaxed">
                {!doc.isEncrypted
                  ? (lang === 'id'
                      ? 'Masukkan password terlebih dahulu sebelum mengunci. Saat ingin membuka dokumen ini kembali, Anda harus memasukkan password yang sama.'
                      : 'Enter a password before locking. You will need the same password to open this document again.')
                  : isDocumentLocked
                    ? (lang === 'id'
                        ? 'Masukkan password yang sama seperti saat Anda mengunci dokumen ini.'
                        : 'Enter the exact same password used when locking this document.')
                    : (lang === 'id'
                        ? 'Dokumen sedang terbuka di sesi Anda. Anda bisa menguncinya kembali sekarang atau memasukkan password yang sama untuk menonaktifkan kunci secara permanen.'
                        : 'This document is currently unlocked in your session. Re-lock it now or enter the matching password to permanently remove the lock.')}
              </p>

              {doc.isEncrypted && !isDocumentLocked && (
                <button
                  type="button"
                  onClick={handleQuickRelock}
                  disabled={isLockProcessing}
                  className="w-full mb-4 py-2 px-4 rounded-[6px] bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Lock size={13} />
                  <span>{lang === 'id' ? 'Kunci Kembali Sekarang' : 'Lock Document Again Now'}</span>
                </button>
              )}

              <form onSubmit={handleSubmitLockModal} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#282925] dark:text-[#EDEDE8] mb-1">
                    {!doc.isEncrypted
                      ? (lang === 'id' ? 'Buat Password Kunci' : 'Create Lock Password')
                      : isDocumentLocked
                        ? (lang === 'id' ? 'Password Dokumen' : 'Document Password')
                        : (lang === 'id' ? 'Masukkan Password untuk Hapus Kunci Permanen' : 'Enter Password to Permanently Remove Lock')}
                  </label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      placeholder={
                        !doc.isEncrypted
                          ? (lang === 'id' ? 'Masukkan password untuk mengunci...' : 'Enter password to lock...')
                          : (lang === 'id' ? 'Masukkan password yang sama...' : 'Enter the same password...')
                      }
                      value={lockPasswordInput}
                      onChange={(e) => {
                        setLockPasswordInput(e.target.value);
                        if (lockModalError) setLockModalError('');
                      }}
                      autoFocus
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777973] hover:text-[#282925] cursor-pointer"
                      tabIndex={-1}
                    >
                      {showModalPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {doc.isEncrypted && isDocumentLocked && (
                  <label className="flex items-center gap-2 text-[11px] text-[#777973] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={removeLockOnUnlock}
                      onChange={(e) => setRemoveLockOnUnlock(e.target.checked)}
                      className="rounded border-[#EAEAE5] accent-[#282925]"
                    />
                    <span>
                      {lang === 'id'
                        ? 'Nonaktifkan kunci secara permanen setelah terbuka'
                        : 'Permanently remove lock after unlocking'}
                    </span>
                  </label>
                )}

                {lockModalError && (
                  <div className="text-xs text-rose-500 flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{lockModalError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLockModal(false)}
                    className="px-3 py-1.5 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] text-xs font-medium text-[#777973] hover:text-[#282925] cursor-pointer"
                  >
                    {lang === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isLockProcessing}
                    className="px-4 py-1.5 rounded-[6px] bg-[#282925] hover:bg-[#3E3F3B] text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <KeyRound size={13} />
                    <span>
                      {isLockProcessing
                        ? t.syncing
                        : !doc.isEncrypted
                          ? (lang === 'id' ? 'Kunci Dokumen' : 'Lock Document')
                          : isDocumentLocked
                            ? (lang === 'id' ? 'Buka Kunci' : 'Unlock')
                            : (lang === 'id' ? 'Hapus Kunci Permanen' : 'Remove Lock Permanently')}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Locked Document Vault Guard */}
        {isDocumentLocked ? (
          <div className="my-12 p-8 rounded-[8px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-[6px] bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Lock size={22} />
            </div>
            <h4 className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8] mb-1">
              {t.unlockDocument}
            </h4>
            <p className="text-xs text-[#777973] mb-4">
              {lang === 'id'
                ? 'Dokumen ini terkunci. Masukkan password yang sama seperti saat Anda menguncinya.'
                : t.passphraseDesc}
            </p>

            <form onSubmit={handleUnlock} className="space-y-3">
              <div className="relative">
                <input
                  type={showInlinePassword ? 'text' : 'password'}
                  placeholder={lang === 'id' ? 'Masukkan password dokumen...' : t.enterPassphrase}
                  value={passphraseInput}
                  onChange={(e) => {
                    setPassphraseInput(e.target.value);
                    if (decryptError) setDecryptError('');
                  }}
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-white dark:bg-[#1E1E1C] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowInlinePassword(!showInlinePassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777973] hover:text-[#282925] cursor-pointer"
                  tabIndex={-1}
                >
                  {showInlinePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {decryptError && (
                <div className="text-xs text-rose-500 flex items-center justify-center gap-1">
                  <AlertCircle size={12} />
                  <span>{decryptError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDecrypting}
                className="w-full py-2 px-4 rounded-[6px] bg-[#282925] text-white font-medium text-xs hover:bg-[#3E3F3B] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDecrypting ? t.syncing : t.unlockDocument}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Markdown Editor Toolbar & Mode Switcher (Figma style) */}
            <div className="flex items-center justify-between gap-2 mb-3 bg-[#F8F8F6] dark:bg-[#181816] p-1.5 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] overflow-x-auto">
              {/* Markdown insertion tools */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => insertMarkdown('# ')}
                  title={t.blockHeading1}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('## ')}
                  title={t.blockHeading2}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Heading2 size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('### ')}
                  title={t.blockHeading3}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Heading3 size={14} />
                </button>
                <div className="w-px h-4 bg-[#EAEAE5] dark:bg-[#2B2B28] mx-1" />
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  title="Bold"
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  title="Italic"
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Italic size={14} />
                </button>
                <div className="w-px h-4 bg-[#EAEAE5] dark:bg-[#2B2B28] mx-1" />
                <button
                  onClick={() => insertMarkdown('- [ ] ')}
                  title={t.blockTodo}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <CheckSquare size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('- ')}
                  title={t.blockBullet}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('1. ')}
                  title="Numbered List"
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <ListOrdered size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('> ')}
                  title={t.blockQuote}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Quote size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('```typescript\n', '\n```')}
                  title={t.blockCode}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <Code size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('\n---\n')}
                  title={t.blockDivider}
                  className="p-1.5 rounded hover:bg-[#EAEAE5] dark:hover:bg-[#252522] text-[#777973] hover:text-[#282925]"
                >
                  <SplitSquareVertical size={14} />
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#1E1E1C] p-0.5 rounded-[4px] border border-[#EAEAE5] dark:border-[#2B2B28] text-xs shrink-0">
                <button
                  onClick={() => setViewMode('edit')}
                  title={t.editMarkdown}
                  className={`px-2 py-1 rounded-[3px] flex items-center gap-1 transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-[#EAEAE5] dark:bg-[#252522] text-[#282925] dark:text-[#EDEDE8] font-medium'
                      : 'text-[#777973] hover:text-[#282925]'
                  }`}
                >
                  <Edit3 size={13} />
                  <span className="hidden sm:inline">{t.editMarkdown}</span>
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  title={t.bothMarkdown}
                  className={`hidden md:flex px-2 py-1 rounded-[3px] items-center gap-1 transition-colors ${
                    viewMode === 'split'
                      ? 'bg-[#EAEAE5] dark:bg-[#252522] text-[#282925] dark:text-[#EDEDE8] font-medium'
                      : 'text-[#777973] hover:text-[#282925]'
                  }`}
                >
                  <Columns size={13} />
                  <span>{t.bothMarkdown}</span>
                </button>

                <button
                  onClick={() => setViewMode('preview')}
                  title={t.previewMarkdown}
                  className={`px-2 py-1 rounded-[3px] flex items-center gap-1 transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-[#EAEAE5] dark:bg-[#252522] text-[#282925] dark:text-[#EDEDE8] font-medium'
                      : 'text-[#777973] hover:text-[#282925]'
                  }`}
                >
                  <Eye size={13} />
                  <span className="hidden sm:inline">{t.previewMarkdown}</span>
                </button>
              </div>
            </div>

            {/* Editor & Preview Viewport */}
            <div className="flex-1 grid grid-cols-1 gap-4 min-h-[350px] relative">
              {/* Floating Notion Slash Command Popup */}
              {showSlashMenu && (
                <div className="absolute left-4 top-4 z-30 w-72 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] shadow-2xl overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A1A29B] border-b border-[#EAEAE5] dark:border-[#2B2B28] flex items-center justify-between">
                    <span>Perintah Dasar (Slash Command)</span>
                    <button onClick={() => setShowSlashMenu(false)}>
                      <X size={12} />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {slashOptions.map((opt, i) => (
                      <button
                        key={opt.label}
                        onClick={() => insertMarkdown(opt.prefix, opt.suffix || '', true)}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors ${
                          i === slashIndex
                            ? 'bg-[#F8F8F6] dark:bg-[#252522] text-[#282925] dark:text-[#EDEDE8] font-medium'
                            : 'hover:bg-[#F8F8F6] dark:hover:bg-[#252522] text-[#777973]'
                        }`}
                      >
                        <span className="p-1 rounded bg-[#F4F4F0] dark:bg-[#2B2B28] text-[#282925] dark:text-[#EDEDE8]">
                          {opt.icon}
                        </span>
                        <div>
                          <div className="text-xs font-medium">{opt.label}</div>
                          <div className="text-[10px] text-[#A1A29B]">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Split Mode / Side-by-side or Single View */}
              <div className={`grid ${viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4 flex-1`}>
                {/* Editor Textarea */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className="flex flex-col flex-1">
                    <textarea
                      ref={textareaRef}
                      value={effectiveContent}
                      onChange={handleContentChange}
                      placeholder={t.writePlaceholder}
                      className="w-full flex-1 min-h-[380px] p-4 text-sm font-mono leading-relaxed bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] text-[#282925] dark:text-[#EDEDE8] placeholder-[#A1A29B] focus:outline-none resize-none"
                    />
                  </div>
                )}

                {/* Rendered Markdown Preview with Interactive Checklists */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="p-5 sm:p-6 bg-white dark:bg-[#1E1E1C] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] flex-1 overflow-y-auto space-y-3 max-w-none text-[#282925] dark:text-[#EDEDE8] text-sm">
                    {parsedBlocks.map((block, idx) => {
                      switch (block.type) {
                        case 'h1':
                          return (
                            <h1 key={block.id} className="text-2xl font-bold tracking-tight text-[#282925] dark:text-[#EDEDE8] pt-2 pb-1 border-b border-[#EAEAE5] dark:border-[#2B2B28]">
                              {block.text}
                            </h1>
                          );
                        case 'h2':
                          return (
                            <h2 key={block.id} className="text-xl font-semibold tracking-tight text-[#282925] dark:text-[#EDEDE8] pt-2">
                              {block.text}
                            </h2>
                          );
                        case 'h3':
                          return (
                            <h3 key={block.id} className="text-base font-semibold text-[#282925] dark:text-[#EDEDE8] pt-1">
                              {block.text}
                            </h3>
                          );
                        case 'todo':
                          return (
                            <div key={block.id} className="flex items-start gap-2.5 my-1">
                              <input
                                type="checkbox"
                                checked={block.checked}
                                onChange={() => handleToggleTodo(idx, block.text, !!block.checked)}
                                className="mt-1 w-4 h-4 rounded border-[#EAEAE5] accent-[#282925] cursor-pointer"
                              />
                              <span className={block.checked ? 'line-through text-[#A1A29B]' : 'text-[#282925] dark:text-[#EDEDE8]'}>
                                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                              </span>
                            </div>
                          );
                        case 'bullet':
                          return (
                            <li key={block.id} className="ml-5 list-disc text-[#777973] dark:text-[#A1A29B]">
                              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                            </li>
                          );
                        case 'numbered':
                          return (
                            <div key={block.id} className="ml-5 list-decimal text-[#777973] dark:text-[#A1A29B]">
                              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                            </div>
                          );
                        case 'quote':
                          return (
                            <blockquote key={block.id} className="border-l-2 border-[#282925] dark:border-[#EDEDE8] pl-3 py-1 italic text-[#777973] my-2">
                              {block.text}
                            </blockquote>
                          );
                        case 'callout':
                          return (
                            <div key={block.id} className="p-3 bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px] text-[#282925] dark:text-[#EDEDE8] text-xs">
                              {block.text}
                            </div>
                          );
                        case 'code':
                          return (
                            <div key={block.id} className="my-2 rounded-[6px] bg-[#181816] border border-[#2B2B28] p-3 text-xs text-[#EDEDE8] font-mono overflow-x-auto">
                              <div className="text-[10px] text-[#A1A29B] uppercase mb-1">
                                {block.codeLang || 'code'}
                              </div>
                              <pre>{block.text}</pre>
                            </div>
                          );
                        case 'divider':
                          return <hr key={block.id} className="my-4 border-[#EAEAE5] dark:border-[#2B2B28]" />;
                        case 'table':
                          return (
                            <div key={block.id} className="overflow-x-auto my-3 border border-[#EAEAE5] dark:border-[#2B2B28] rounded-[6px]">
                              <table className="w-full text-left text-xs border-collapse">
                                <tbody>
                                  {block.tableRows?.map((row, rIdx) => (
                                    <tr key={rIdx} className={rIdx === 0 ? 'bg-[#F8F8F6] dark:bg-[#181816] font-semibold text-[#282925] dark:text-[#EDEDE8]' : 'border-t border-[#EAEAE5] dark:border-[#2B2B28]'}>
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-2 border-r last:border-r-0 border-[#EAEAE5] dark:border-[#2B2B28]">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        default:
                          return block.text.trim() ? (
                            <p key={block.id} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                          ) : (
                            <div key={block.id} className="h-2" />
                          );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Document Word Stats Footer */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#A1A29B] font-mono">
              <div className="flex items-center gap-2">
                <span>{wordCount} kata</span>
                <span>·</span>
                <span>{charCount} karakter</span>
                <span>·</span>
                <span>~{readTimeMin} mnt baca</span>
              </div>
              <div className="hidden sm:block">
                <span>Ketik <code className="bg-[#F8F8F6] dark:bg-[#181816] border border-[#EAEAE5] dark:border-[#2B2B28] px-1 rounded">/</code> untuk perintah cepat</span>
              </div>
            </div>

            {/* Hierarchical Sub-pages section */}
            <div className="mt-10 pt-6 border-t border-[#EAEAE5] dark:border-[#2B2B28]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A29B]">
                  {t.subPages} ({subPages.length})
                </h4>
                <button
                  onClick={() => onCreateSubPage(doc.id)}
                  className="flex items-center gap-1 text-xs text-[#282925] dark:text-[#EDEDE8] hover:underline font-medium cursor-pointer"
                >
                  <Plus size={13} />
                  <span>{t.newSubDoc}</span>
                </button>
              </div>

              {subPages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {subPages.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => onSelectDoc(sub.id)}
                      className="p-3 rounded-[6px] border border-[#EAEAE5] dark:border-[#2B2B28] bg-[#F8F8F6] dark:bg-[#181816] hover:bg-[#EAEAE5] cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{sub.icon || '📄'}</span>
                        <span className="text-xs font-semibold text-[#282925] dark:text-[#EDEDE8] truncate">
                          {sub.title || t.emptyTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#777973] group-hover:text-[#282925]">
                        →
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A1A29B] italic">
                  {t.noSubPages}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
