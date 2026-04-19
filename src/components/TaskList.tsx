import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, orderBy, deleteDoc } from 'firebase/firestore';
import { UserProfile, Task, TaskStatus } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Search, 
  LayoutList, 
  Calendar,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TaskListProps {
  profile: UserProfile;
}

export default function TaskList({ profile }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // New task form
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Show all tasks for management roles, or just personal for non-management?
    // User request: "each employee should have a dedicated section to view and update their assigned tasks"
    let q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    // For now, let's allow seeing everything for coordination, but highlight own.
    const unsub = onSnapshot(q, (sn) => {
      setTasks(sn.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        status: 'Pending',
        assignedTo: profile.uid,
        deadline,
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setDeadline('');
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'Done' ? 'Pending' : 'Done';
    await updateDoc(doc(db, 'tasks', task.id), { status: nextStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (profile.role !== 'CEO') return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const myTasks = tasks.filter(t => t.assignedTo === profile.uid);
  const othersTasks = tasks.filter(t => t.assignedTo !== profile.uid);

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-gold" />
          Tasks
        </h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 gold-gradient text-navy rounded-lg shadow-lg hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sleek-card border-gold/20"
          >
            <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4">
              <input 
                required
                className="flex-1 px-4 py-2 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                placeholder="Task title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <input 
                type="date"
                required
                className="px-4 py-2 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
              <button 
                disabled={submitting}
                className="px-6 py-2 gold-gradient text-navy font-bold text-xs uppercase rounded-lg transition-all"
              >
                {submitting ? 'Adding...' : 'Add Task'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">My Assignments</h4>
        {myTasks.length > 0 ? (
          myTasks.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "group flex items-center gap-5 p-4 bg-bg-surface border border-border-subtle rounded-xl shadow-sm transition-all hover:border-gold/30",
                task.status === 'Done' && "opacity-50"
              )}
            >
              <button 
                onClick={() => toggleTaskStatus(task)}
                className={cn(
                  "shrink-0 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center",
                  task.status === 'Done' ? "bg-gold border-gold text-navy" : "border-text-dim/30 hover:border-gold"
                )}
              >
                {task.status === 'Done' && <CheckCircle2 className="w-4 h-4 font-bold" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <h5 className={cn("font-bold text-text-main text-sm tracking-tight", task.status === 'Done' && "line-through text-text-dim")}>
                  {task.title}
                </h5>
                <div className="flex items-center gap-4 mt-1.5 pb-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-dim font-bold uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    {task.deadline ? formatDate(task.deadline) : 'No deadline'}
                  </div>
                  {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Done' && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Overdue
                    </div>
                  )}
                </div>
              </div>
              
              {profile.role === 'CEO' && (
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-2 py-2 text-text-dim hover:text-red-400 transition-colors shrink-0"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-text-dim bg-bg-deep border border-dashed border-border-subtle rounded-xl italic text-xs">
            No pending tasks.
          </div>
        )}
      </div>

      {othersTasks.length > 0 && (
        <div className="space-y-4 mt-8">
          <h4 className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Team Overview</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {othersTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-bg-deep rounded-lg border border-border-subtle opacity-60">
                <Circle className="w-3 h-3 text-text-dim" />
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-text-main">{task.title}</p>
                </div>
                <div className="text-[8px] font-bold text-gold uppercase tracking-tighter bg-gold/10 px-1.5 py-0.5 rounded">
                  {task.status}
                </div>
                {profile.role === 'CEO' && (
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1 text-text-dim/40 hover:text-red-400 transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
