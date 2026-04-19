import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { UserProfile, Project, ProjectStatus } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  LayoutGrid, 
  List as ListIcon,
  Tag,
  Loader2,
  Briefcase,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectManagerProps {
  profile: UserProfile;
}

export default function ProjectManager({ profile }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (sn) => {
      setProjects(sn.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.role !== 'CEO') return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        title,
        description,
        status: 'Backlog',
        deadline,
        createdBy: profile.uid,
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setDescription('');
      setDeadline('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (profile.role !== 'CEO') return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: Record<ProjectStatus, string> = {
    'Backlog': 'bg-slate-800 text-slate-400',
    'In Progress': 'status-active',
    'Review': 'status-pending',
    'Completed': 'bg-green-500/20 text-green-400'
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim w-4 h-4" />
            <input 
            type="text" 
            placeholder="Search projects..." 
            className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border-subtle rounded-xl focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold transition-all text-text-main text-sm"
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {profile.role === 'CEO' && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 gold-gradient text-navy rounded-lg shadow-lg hover:shadow-gold/20 hover:scale-[1.01] transition-all font-bold uppercase text-[10px] tracking-widest"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateProject} className="sleek-card mb-8 space-y-6 border-gold/20 shadow-2xl">
              <h3 className="text-lg font-bold text-gold flex items-center gap-2 uppercase tracking-widest">
                <Briefcase className="w-5 h-5" />
                Create New Project
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Project Name</label>
                  <input 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Website Overhaul"
                    className="w-full px-4 py-3 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Completion Date</label>
                  <input 
                    type="date"
                    required
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Description</label>
                  <textarea 
                    rows={3}
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe project goals and scope..."
                    className="w-full px-4 py-3 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main resize-none text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 text-[10px] font-bold text-text-dim hover:text-white transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting}
                  className="px-8 py-2.5 gold-gradient text-navy rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-bg-surface h-52 rounded-xl animate-pulse" />
          ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <motion.div
              key={project.id}
              layout
              className="sleek-card overflow-hidden hover:border-gold/30 transition-all flex flex-col group h-full cursor-default"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", statusColors[project.status])}>
                    {project.status}
                  </span>
                  <div className="flex gap-1">
                    {profile.role === 'CEO' && (
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-text-dim hover:text-red-400 transition-colors p-1"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button className="text-text-dim hover:text-gold transition-colors p-1">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-text-main mb-3 line-clamp-1 group-hover:text-gold transition-colors tracking-tight">
                  {project.title}
                </h4>
                <p className="text-sm text-text-dim/70 line-clamp-3 mb-6 min-h-[60px] leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="pt-6 border-t border-border-subtle flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider mb-1">Target Date</span>
                  <div className="flex items-center gap-2 text-xs text-text-main font-bold tracking-tight">
                    <Calendar className="w-4 h-4 text-gold" />
                    {project.deadline ? formatDate(project.deadline) : 'Ongoing'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-bg-deep flex items-center justify-center text-[10px] text-gold border border-border-subtle font-bold">
                  SOF
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-text-dim sleek-card border-dashed border-border-subtle">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="font-medium italic">No active projects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
