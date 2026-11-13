import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, FilePlus2, Link2 } from 'lucide-react';
import {
  DocItem,
  DocPriority,
  DocStatus,
  ProjectDetailData,
  ProjectDocLink,
  ProjectTask,
  ProjectToolLink,
} from '../types';

interface ProjectOverviewEditModalProps {
  isOpen: boolean;
  domainLabel: string;
  docTitle: string;
  docStatus: DocStatus;
  docPriority: DocPriority;
  docDeadline?: string;
  projectData: ProjectDetailData;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    status: DocStatus;
    priority: DocPriority;
    deadline?: string;
    projectDataPatch: Partial<ProjectDetailData>;
  }) => void;
}

export const ProjectOverviewEditModal: React.FC<ProjectOverviewEditModalProps> = ({
  isOpen,
  domainLabel,
  docTitle,
  docStatus,
  docPriority,
  docDeadline,
  projectData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(docTitle);
  const [categoryLabel, setCategoryLabel] = useState(projectData.categoryLabel || '');
  const [tagline, setTagline] = useState(projectData.tagline || '');
  const [focusObjective, setFocusObjective] = useState(projectData.focusObjective || '');
  const [aboutText, setAboutText] = useState(projectData.aboutText || '');
  const [status, setStatus] = useState<DocStatus>(docStatus);
  const [priority, setPriority] = useState<DocPriority>(docPriority);
  const [deadline, setDeadline] = useState(docDeadline || '');
  const [ownerName, setOwnerName] = useState(projectData.ownerName || '');
  const [collaboratorsText, setCollaboratorsText] = useState(projectData.collaboratorsText || '');
  const [visibilityLabel, setVisibilityLabel] = useState(
    projectData.visibilityLabel || 'Anggota workspace'
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(docTitle);
      setCategoryLabel(projectData.categoryLabel || '');
      setTagline(projectData.tagline || '');
      setFocusObjective(projectData.focusObjective || '');
      setAboutText(projectData.aboutText || '');
      setStatus(docStatus);
      setPriority(docPriority);
      setDeadline(docDeadline || '');
      setOwnerName(projectData.ownerName || '');
      setCollaboratorsText(projectData.collaboratorsText || '');
      setVisibilityLabel(projectData.visibilityLabel || 'Anggota workspace');
    }
  }, [isOpen, docTitle, docStatus, docPriority, docDeadline, projectData]);

  if (!isOpen) return null;

  const statusLabelMap: Record<DocStatus, string> = {
    not_started: 'Belum mulai',
    in_progress: 'Dikerjakan',
    completed: 'Selesai',
    archived: 'Diarsipkan',
  };

  const priorityLabelMap: Record<DocPriority, 'Rendah' | 'Sedang' | 'Tinggi'> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim() || docTitle;
    onSave({
      title: trimmedTitle,
      status,
      priority,
      deadline: deadline || undefined,
      projectDataPatch: {
        categoryLabel: categoryLabel.trim() || projectData.categoryLabel,
        tagline: tagline.trim(),
        focusObjective: focusObjective.trim(),
        aboutText: aboutText.trim(),
        statusLabel: statusLabelMap[status] || 'Dikerjakan',
        priorityLabel: priorityLabelMap[priority] || 'Sedang',
        ownerName: ownerName.trim() || 'Tim Workspace',
        collaboratorsText: collaboratorsText.trim() || '-',
        visibilityLabel: visibilityLabel.trim() || 'Anggota workspace',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#E6E7E1] dark:border-[#2B2B28] rounded-[8px] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6E7E1] dark:border-[#2B2B28] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
              Sunting Fokus & Detail {domainLabel}
            </h3>
            <p className="text-[11px] text-[#777973] dark:text-[#A1A29B]">
              Sesuaikan judul, konsep yang dibuat, serta target agar seluruh tim terarah dan tersinkron.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#777973] hover:text-[#282925] dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Judul Proyek
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Website Toko Kopi / Aplikasi Kasir"
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Label Kategori
              </label>
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="WEBSITE · E-COMMERCE"
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Subjudul / Deskripsi Singkat Header
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ringkasan singkat tujuan proyek ini..."
              className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Fokus Utama yang Mau Dibuat
            </label>
            <input
              type="text"
              value={focusObjective}
              onChange={(e) => setFocusObjective(e.target.value)}
              placeholder="Contoh: Platform pemesanan & katalog produk dengan checkout cepat"
              className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Tentang Proyek (Penjelasan Lengkap)
            </label>
            <textarea
              rows={3}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Jelaskan ruang lingkup, target pengguna, dan arahan pengerjaan..."
              className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocStatus)}
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              >
                <option value="not_started">Belum mulai</option>
                <option value="in_progress">Dikerjakan</option>
                <option value="completed">Selesai</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DocPriority)}
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Tenggat Proyek
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Penanggung Jawab
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Kolaborator
              </label>
              <input
                type="text"
                value={collaboratorsText}
                onChange={(e) => setCollaboratorsText(e.target.value)}
                placeholder="Andi, Nadia, Rafi"
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Visibilitas
              </label>
              <input
                type="text"
                value={visibilityLabel}
                onChange={(e) => setVisibilityLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6E7E1] dark:border-[#2B2B28]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-[6px] border border-[#E6E7E1] dark:border-[#333] text-xs text-[#777973] hover:text-[#282925] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-[6px] bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium hover:bg-[#3D3E3A] cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProjectTaskEditorModalProps {
  isOpen: boolean;
  editingTask: ProjectTask | null;
  defaultAssignee: string;
  defaultDueDate: string;
  onClose: () => void;
  onSave: (task: {
    id?: string;
    title: string;
    assignee: string;
    priority: 'Tinggi' | 'Sedang' | 'Rendah';
    dueDate: string;
  }) => void;
  onDelete?: (taskId: string) => void;
}

export const ProjectTaskEditorModal: React.FC<ProjectTaskEditorModalProps> = ({
  isOpen,
  editingTask,
  defaultAssignee,
  defaultDueDate,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [priority, setPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [dueDate, setDueDate] = useState(defaultDueDate);

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title);
        setAssignee(editingTask.assignee);
        setPriority(editingTask.priority);
        setDueDate(editingTask.dueDate);
      } else {
        setTitle('');
        setAssignee(defaultAssignee);
        setPriority('Sedang');
        setDueDate(defaultDueDate);
      }
    }
  }, [isOpen, editingTask, defaultAssignee, defaultDueDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingTask?.id,
      title: title.trim(),
      assignee: assignee.trim() || defaultAssignee,
      priority,
      dueDate: dueDate.trim() || defaultDueDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#E6E7E1] dark:border-[#2B2B28] rounded-[8px] shadow-2xl max-w-md w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
            {editingTask ? 'Sunting Tugas Proyek' : 'Tambah Tugas Proyek'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777973] hover:text-[#282925] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Nama Tugas
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rancang komponen navigasi utama"
              className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Penanggung Jawab
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Tinggi' | 'Sedang' | 'Rendah')}
                className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              >
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Tenggat Waktu
            </label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="Contoh: 18 Nov / Besok"
              className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {editingTask && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingTask.id);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-[#E6E7E1] dark:border-[#333] text-xs text-[#777973] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium cursor-pointer"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProjectToolsEditorModalProps {
  isOpen: boolean;
  projectTitle: string;
  toolLinks: ProjectToolLink[];
  onClose: () => void;
  onSave: (tools: ProjectToolLink[]) => void;
}

export const ProjectToolsEditorModal: React.FC<ProjectToolsEditorModalProps> = ({
  isOpen,
  projectTitle,
  toolLinks,
  onClose,
  onSave,
}) => {
  const [draftTools, setDraftTools] = useState<ProjectToolLink[]>(toolLinks);

  useEffect(() => {
    if (isOpen) {
      setDraftTools(toolLinks.map((t) => ({ ...t })));
    }
  }, [isOpen, toolLinks]);

  if (!isOpen) return null;

  const handleAddTool = () => {
    setDraftTools((prev) => [
      ...prev,
      {
        id: `tool-${Date.now()}`,
        name: 'Alat Baru',
        description: 'Kegunaan alat pada proyek',
        url: 'https://',
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftTools
      .filter((t) => t.name.trim())
      .map((t) => ({
        ...t,
        name: t.name.trim(),
        description: t.description.trim() || 'Alat pendukung proyek',
        url: t.url.trim() || 'https://',
      }));
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#E6E7E1] dark:border-[#2B2B28] rounded-[8px] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#E6E7E1] dark:border-[#2B2B28] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
              Kelola Alat Kerja · {projectTitle}
            </h3>
            <p className="text-[11px] text-[#777973]">
              Tambah, sunting, atau perbarui tautan alat sesuai kebutuhan proyek.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777973] hover:text-[#282925] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 flex-1">
          {draftTools.map((tool, idx) => (
            <div
              key={tool.id}
              className="p-3 rounded-[6px] border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#181816] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={tool.name}
                  onChange={(e) => {
                    const next = [...draftTools];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setDraftTools(next);
                  }}
                  placeholder="Nama alat (mis. Figma, GitHub)"
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setDraftTools(draftTools.filter((_, i) => i !== idx))}
                  className="p-1.5 text-[#777973] hover:text-rose-500 cursor-pointer"
                  title="Hapus alat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                type="text"
                value={tool.description}
                onChange={(e) => {
                  const next = [...draftTools];
                  next[idx] = { ...next[idx], description: e.target.value };
                  setDraftTools(next);
                }}
                placeholder="Deskripsi fungsi alat..."
                className="w-full px-2.5 py-1.5 text-[11px] rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
              <input
                type="url"
                value={tool.url}
                onChange={(e) => {
                  const next = [...draftTools];
                  next[idx] = { ...next[idx], url: e.target.value };
                  setDraftTools(next);
                }}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 text-[11px] font-mono rounded border border-[#E6E7E1] dark:border-[#333] bg-white dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddTool}
            className="w-full py-2 rounded-[6px] border border-dashed border-[#C8CBC1] dark:border-[#444] text-xs text-[#777973] hover:text-[#282925] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={13} />
            <span>Tambah Alat Kerja</span>
          </button>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E6E7E1] dark:border-[#2B2B28]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-[#E6E7E1] dark:border-[#333] text-xs text-[#777973] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium cursor-pointer"
            >
              Simpan & Sinkronkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProjectDocEditorModalProps {
  isOpen: boolean;
  editingDoc: ProjectDocLink | null;
  workspaceDocs: DocItem[];
  onClose: () => void;
  onSave: (item: ProjectDocLink) => void;
  onDelete?: (id: string) => void;
  onCreateLinkedWorkspaceDoc?: (parentProjectDocId?: string) => void;
}

export const ProjectDocEditorModal: React.FC<ProjectDocEditorModalProps> = ({
  isOpen,
  editingDoc,
  workspaceDocs,
  onClose,
  onSave,
  onDelete,
  onCreateLinkedWorkspaceDoc,
}) => {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('Noverse');
  const [category, setCategory] = useState('Dokumen');
  const [description, setDescription] = useState('');
  const [linkedDocId, setLinkedDocId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingDoc) {
        setTitle(editingDoc.title);
        setSource(editingDoc.source);
        setCategory(editingDoc.category);
        setDescription(editingDoc.description || '');
        setLinkedDocId(editingDoc.linkedDocId || '');
      } else {
        setTitle('');
        setSource('Noverse');
        setCategory('Dokumen');
        setDescription('');
        setLinkedDocId('');
      }
    }
  }, [isOpen, editingDoc]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingDoc?.id || `pdoc-${Date.now()}`,
      title: title.trim(),
      source: source.trim() || 'Noverse',
      category: category.trim() || 'Dokumen',
      updatedLabel: 'Diperbarui hari ini',
      description: description.trim() || undefined,
      linkedDocId: linkedDocId || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E1C] border border-[#E6E7E1] dark:border-[#2B2B28] rounded-[8px] shadow-2xl max-w-md w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#282925] dark:text-[#EDEDE8]">
            {editingDoc ? 'Sunting Dokumen Proyek' : 'Tambah Dokumen Proyek'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#777973] hover:text-[#282925] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Judul Dokumen
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Spesifikasi Fitur Checkout"
              className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Sumber / Alat
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Noverse / Figma / GitHub"
                className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#777973] mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Dokumen / Desain / Panduan"
                className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#777973] mb-1">
              Ringkasan Isi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan singkat tentang dokumen ini..."
              className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] font-medium text-[#777973] mb-1">
              <Link2 size={11} />
              <span>Hubungkan ke Halaman Catatan Workspace (opsional)</span>
            </label>
            <select
              value={linkedDocId}
              onChange={(e) => setLinkedDocId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-[#E6E7E1] dark:border-[#333] bg-[#F8F8F6] dark:bg-[#121211] text-[#282925] dark:text-[#EDEDE8] focus:outline-none"
            >
              <option value="">— Buka pengelola alat / ringkasan —</option>
              {workspaceDocs.map((wd) => (
                <option key={wd.id} value={wd.id}>
                  {wd.icon || '📄'} {wd.title}
                </option>
              ))}
            </select>
          </div>

          {onCreateLinkedWorkspaceDoc && !editingDoc && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateLinkedWorkspaceDoc();
              }}
              className="w-full py-2 px-3 rounded border border-dashed border-[#C8CBC1] dark:border-[#444] text-[11px] text-[#567561] dark:text-[#8CA796] hover:bg-[#EEF2EB] dark:hover:bg-[#1E2720] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 size={13} />
              <span>Atau buat Halaman Catatan Baru untuk proyek ini</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-2">
            {editingDoc && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingDoc.id);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-[#E6E7E1] dark:border-[#333] text-xs text-[#777973] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#282925] dark:bg-[#EDEDE8] text-white dark:text-[#282925] text-xs font-medium cursor-pointer"
              >
                Simpan Dokumen
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
