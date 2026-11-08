import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Smile, 
  Trash2, 
  Calendar, 
  Clock, 
  Tag, 
  Lock, 
  Unlock, 
  Eye, 
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
  AlertCircle
} from 'lucide-react';
import { DocItem, DocStatus, DocPriority, Language, Collaborator } from '../types';
import { translations } from '../utils/i18n';
import { COVER_PRESETS } from '../utils/seedData';
import { parseMarkdownToBlocks, formatInlineMarkdown } from '../utils/markdown';

interface DocumentEditorProps {
  doc: DocItem;
  subPages: DocItem[];
  lang: Language;
  collaborators: Collaborator[];
  isVaultUnlocked: boolean;
  onUpdateDoc: (updated: Partial<DocItem>) => void;
  onSelectDoc: (id: string) => void;
  onCreateSubPage: (parentId: string) => void;
  onSendCursor: (cursor: { blockIndex?: number; text?: string }) => void;
  onUnlockVault: (passphrase: string) => Promise<boolean>;
}

const EMOJI_PRESETS = ['📄', '🚀', '📋', '💡', '⚙️', '📝', '🎯', '🌿', '☕', '🔒', '📚', '⚡', '💻', '🎨', '🔥', '✨'];

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  doc,
  subPages,
  lang,
  collaborators,
  isVaultUnlocked,
  onUpdateDoc,
  onSelectDoc,
  onCreateSubPage,
  onSendCursor,
  onUnlockVault,
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('edit');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize title & content
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateDoc({ title: e.target.value, updatedAt: Date.now() });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onUpdateDoc({ content: newContent, updatedAt: Date.now() });
    onSendCursor({ text: newContent.slice(0, 30) });
  };

  // Insert markdown syntax helper
  const insertMarkdown = (before: string, after = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${before}${selected}${after}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);

    onUpdateDoc({ content: newText, updatedAt: Date.now() });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  // Toggle todo item in markdown preview
  const handleToggleTodo = (blockIndex: number, currentText: string, currentChecked: boolean) => {
    const lines = doc.content.split('\n');
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
    if (!passphraseInput) return;
    setIsDecrypting(true);
    setDecryptError('');
    try {
      const ok = await onUnlockVault(passphraseInput);
      if (!ok) {
        setDecryptError(t.wrongPassphrase);
      }
    } catch {
      setDecryptError(t.wrongPassphrase);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Check if locked
  const isDocumentLocked = doc.isEncrypted && !isVaultUnlocked;

  const parsedBlocks = parseMarkdownToBlocks(doc.content || '');

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative select-text">
      {/* Document Cover Banner */}
      {doc.coverImage ? (
        <div className="relative group w-full h-44 sm:h-56 shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-800">
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

          <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-slate-900/70 backdrop-blur-md p-1 rounded-md text-xs text-white">
            <button
              onClick={() => setShowCoverPicker(true)}
              className="px-2 py-1 hover:bg-white/20 rounded flex items-center gap-1 transition-colors"
            >
              <ImageIcon size={12} />
              <span>{t.changeCover}</span>
            </button>
            <button
              onClick={() => onUpdateDoc({ coverImage: undefined })}
              className="px-2 py-1 hover:bg-rose-500/40 text-rose-300 rounded flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              <span>{t.removeCover}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-6 w-full flex items-center justify-end px-8 group">
          <button
            onClick={() => setShowCoverPicker(true)}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ImageIcon size={12} />
            <span>{t.changeCover}</span>
          </button>
        </div>
      )}

      {/* Cover Picker Modal */}
      {showCoverPicker && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.changeCover}
              </h3>
              <button
                onClick={() => setShowCoverPicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onUpdateDoc({ coverImage: preset.url });
                    setShowCoverPicker(false);
                  }}
                  className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group hover:ring-2 hover:ring-indigo-500 transition-all text-left"
                >
                  <div className="h-20 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                  <div className="p-2 text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Document Content Container */}
      <div className="max-w-4xl w-full mx-auto px-6 sm:px-12 py-6 flex-1 flex flex-col">
        {/* Document Icon & Title Header */}
        <div className="mb-4">
          <div className="relative inline-block mb-3">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title={t.changeIcon}
              className="text-4xl p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {doc.icon || '📄'}
            </button>

            {showEmojiPicker && (
              <div 
                onMouseLeave={() => setShowEmojiPicker(false)}
                className="absolute left-0 top-14 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl grid grid-cols-8 gap-1.5 z-40 text-xl"
              >
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onUpdateDoc({ icon: emoji });
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editable Document Title */}
          <input
            type="text"
            value={doc.title}
            onChange={handleTitleChange}
            placeholder={t.emptyTitle}
            className="w-full text-3xl sm:text-4xl font-bold tracking-tight bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
          />
        </div>

        {/* Metadata Strip: Status, Priority, Deadline, Reminders, Tags, E2EE */}
        <div className="flex flex-wrap items-center gap-3 py-3 border-y border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 mb-6">
          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{t.status}:</span>
            <select
              value={doc.status}
              onChange={(e) => onUpdateDoc({ status: e.target.value as DocStatus, updatedAt: Date.now() })}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="not_started">{t.notStarted}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="completed">{t.completed}</option>
              <option value="archived">{t.archived}</option>
            </select>
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{t.priority}:</span>
            <select
              value={doc.priority}
              onChange={(e) => onUpdateDoc({ priority: e.target.value as DocPriority, updatedAt: Date.now() })}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="low">{t.low}</option>
              <option value="medium">{t.medium}</option>
              <option value="high">{t.high}</option>
            </select>
          </div>

          {/* Deadline date picker */}
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <input
              type="date"
              value={doc.deadline || ''}
              onChange={(e) => onUpdateDoc({ deadline: e.target.value || undefined, updatedAt: Date.now() })}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Time Reminder picker */}
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-amber-500" />
            <input
              type="datetime-local"
              value={doc.reminderTime ? new Date(doc.reminderTime).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const val = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                onUpdateDoc({ reminderTime: val, reminderNotified: false, updatedAt: Date.now() });
              }}
              title={t.reminder}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Tags list */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag size={13} className="text-slate-400" />
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500"
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
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                  autoFocus
                />
                <button onClick={handleAddTag} className="text-indigo-500 hover:text-indigo-600">
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          {/* E2EE indicator button */}
          <button
            onClick={() => onUpdateDoc({ isEncrypted: !doc.isEncrypted, updatedAt: Date.now() })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              doc.isEncrypted
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {doc.isEncrypted ? <Lock size={12} /> : <Unlock size={12} />}
            <span>{doc.isEncrypted ? t.e2eeActive : t.lockDocument}</span>
          </button>
        </div>

        {/* Locked Document Vault Guard */}
        {isDocumentLocked ? (
          <div className="my-12 p-8 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {t.unlockDocument}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              {t.passphraseDesc}
            </p>

            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                placeholder={t.enterPassphrase}
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {decryptError && (
                <div className="text-xs text-rose-500 flex items-center justify-center gap-1">
                  <AlertCircle size={12} />
                  <span>{decryptError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isDecrypting}
                className="w-full py-2 px-4 rounded-lg bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {isDecrypting ? t.syncing : t.unlockDocument}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Markdown Editor Toolbar & Mode Switcher */}
            <div className="flex items-center justify-between gap-2 mb-3 bg-slate-50 dark:bg-slate-900/70 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              {/* Markdown insertion tools */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  onClick={() => insertMarkdown('# ')}
                  title={t.blockHeading1}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('## ')}
                  title={t.blockHeading2}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <Heading2 size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('### ')}
                  title={t.blockHeading3}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  <Heading3 size={14} />
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  title="Bold"
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  title="Italic"
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Italic size={14} />
                </button>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => insertMarkdown('- [ ] ')}
                  title={t.blockTodo}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <CheckSquare size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('- ')}
                  title={t.blockBullet}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('1. ')}
                  title="Numbered List"
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <ListOrdered size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('> ')}
                  title={t.blockQuote}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Quote size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('```typescript\n', '\n```')}
                  title={t.blockCode}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Code size={14} />
                </button>
                <button
                  onClick={() => insertMarkdown('\n---\n')}
                  title={t.blockDivider}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <SplitSquareVertical size={14} />
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setViewMode('edit')}
                  title={t.editMarkdown}
                  className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Edit3 size={13} />
                  <span className="hidden sm:inline">{t.editMarkdown}</span>
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  title={t.bothMarkdown}
                  className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                    viewMode === 'split'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Columns size={13} />
                  <span className="hidden sm:inline">{t.bothMarkdown}</span>
                </button>

                <button
                  onClick={() => setViewMode('preview')}
                  title={t.previewMarkdown}
                  className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Eye size={13} />
                  <span className="hidden sm:inline">{t.previewMarkdown}</span>
                </button>
              </div>
            </div>

            {/* Editor & Preview Viewport */}
            <div className="flex-1 grid grid-cols-1 gap-4 min-h-[350px]">
              {/* Split Mode / Side-by-side or Single View */}
              <div className={`grid ${viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6 flex-1`}>
                {/* Editor Textarea */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className="flex flex-col flex-1">
                    <textarea
                      ref={textareaRef}
                      value={doc.content}
                      onChange={handleContentChange}
                      placeholder={t.writePlaceholder}
                      className="w-full flex-1 min-h-[350px] p-4 text-sm font-mono leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                )}

                {/* Rendered Markdown Preview with Interactive Checklists */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-lg flex-1 overflow-y-auto space-y-3 prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm">
                    {parsedBlocks.map((block, idx) => {
                      switch (block.type) {
                        case 'h1':
                          return (
                            <h1 key={block.id} className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                              {block.text}
                            </h1>
                          );
                        case 'h2':
                          return (
                            <h2 key={block.id} className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white pt-2">
                              {block.text}
                            </h2>
                          );
                        case 'h3':
                          return (
                            <h3 key={block.id} className="text-base font-semibold text-slate-900 dark:text-white pt-1">
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
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className={block.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}>
                                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                              </span>
                            </div>
                          );
                        case 'bullet':
                          return (
                            <li key={block.id} className="ml-5 list-disc text-slate-700 dark:text-slate-300">
                              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                            </li>
                          );
                        case 'numbered':
                          return (
                            <div key={block.id} className="ml-5 list-decimal text-slate-700 dark:text-slate-300">
                              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }} />
                            </div>
                          );
                        case 'quote':
                          return (
                            <blockquote key={block.id} className="border-l-2 border-indigo-500 pl-4 py-1 italic text-slate-600 dark:text-slate-400 my-2">
                              {block.text}
                            </blockquote>
                          );
                        case 'callout':
                          return (
                            <div key={block.id} className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-indigo-900 dark:text-indigo-200 text-xs">
                              {block.text}
                            </div>
                          );
                        case 'code':
                          return (
                            <div key={block.id} className="my-2 rounded-lg bg-slate-900 dark:bg-slate-950 p-3 text-xs text-slate-100 font-mono overflow-x-auto">
                              <div className="text-[10px] text-slate-400 uppercase mb-1">
                                {block.codeLang || 'code'}
                              </div>
                              <pre>{block.text}</pre>
                            </div>
                          );
                        case 'divider':
                          return <hr key={block.id} className="my-4 border-slate-200 dark:border-slate-800" />;
                        case 'table':
                          return (
                            <div key={block.id} className="overflow-x-auto my-3">
                              <table className="w-full text-left text-xs border-collapse">
                                <tbody>
                                  {block.tableRows?.map((row, rIdx) => (
                                    <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : 'border-t border-slate-200 dark:border-slate-800'}>
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-2 border border-slate-200 dark:border-slate-700">
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

            {/* Hierarchical Sub-pages section */}
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.subPages} ({subPages.length})
                </h4>
                <button
                  onClick={() => onCreateSubPage(doc.id)}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
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
                      className="p-3 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{sub.icon || '📄'}</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {sub.title || t.emptyTitle}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        →
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
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
