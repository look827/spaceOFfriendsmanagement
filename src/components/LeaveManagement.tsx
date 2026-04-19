import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, orderBy, deleteDoc } from 'firebase/firestore';
import { UserProfile, LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { 
  Calendar, 
  Stethoscope, 
  UserCircle, 
  Check, 
  X, 
  Clock,
  Plus,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LeaveManagementProps {
  profile: UserProfile;
}

export default function LeaveManagement({ profile }: LeaveManagementProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  
  // Form state
  const [type, setType] = useState<LeaveType>('Sick Leave');
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'leave_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (sn) => {
      setRequests(sn.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leave_requests'), {
        employeeId: profile.uid,
        employeeName: profile.name,
        type,
        reason,
        startDate: start,
        endDate: end,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      setShowApply(false);
      setReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: LeaveStatus) => {
    if (profile.role !== 'CEO' && profile.role !== 'COO') return;
    await updateDoc(doc(db, 'leave_requests', id), { status });
  };

  const handleDeleteRequest = async (id: string) => {
    if (profile.role !== 'CEO') return;
    try {
      await deleteDoc(doc(db, 'leave_requests', id));
    } catch (err) {
      console.error(err);
    }
  };

  const myRequests = requests.filter(r => r.employeeId === profile.uid);
  const pendingRequests = requests.filter(r => r.status === 'Pending' && r.employeeId !== profile.uid);

  return (
    <div className="space-y-8 max-w-5xl pb-20">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold" />
          Leave Management
        </h3>
        <button 
          onClick={() => setShowApply(!showApply)}
          className="flex items-center gap-2 px-5 py-2 den gold-gradient text-navy rounded-lg font-bold text-xs uppercase shadow-lg hover:scale-[1.02] transition-all"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      <AnimatePresence>
        {showApply && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="sleek-card border-gold/20"
          >
            <form onSubmit={handleApply} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Leave Type</label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value as LeaveType)}
                    className="w-full px-4 py-2.5 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  >
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Start Date</label>
                  <input 
                    type="date"
                    required
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">End Date</label>
                  <input 
                    type="date"
                    required
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="w-full px-4 py-2 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Reason</label>
                <textarea 
                  required
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Provide details for your leave request..."
                  className="w-full px-4 py-3 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main resize-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
                <button 
                  type="button" 
                  onClick={() => setShowApply(false)}
                  className="px-6 py-2.5 text-[10px] font-bold text-text-dim hover:text-white transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting}
                  className="px-8 py-2.5 gold-gradient text-navy rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {(profile.role === 'CEO' || profile.role === 'COO') && pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5" />
            Pending Approvals
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="sleek-card border-gold/10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg-deep flex items-center justify-center shrink-0 border border-border-subtle">
                  <UserCircle className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-text-main leading-none mb-1 text-sm">{req.employeeName}</h5>
                  <p className="text-[10px] text-gold font-bold uppercase mb-2">{req.type}</p>
                  <p className="text-xs text-text-dim italic mb-4 line-clamp-2">"{req.reason}"</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'Approved')}
                      className="flex-1 py-1.5 bg-blue-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                      className="flex-1 py-1.5 bg-red-400/10 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-400/20 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sleek-card p-0 overflow-hidden">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-bg-deep/50">
          <h4 className="text-gold font-bold text-[10px] uppercase tracking-widest">My Requests</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-deep/20 border-b border-border-subtle">
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Reason</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Status</th>
                {profile.role === 'CEO' && <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {myRequests.length > 0 ? (
                myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-main whitespace-nowrap">
                      {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        req.type === 'Sick Leave' ? "bg-red-400/10 text-red-400" : "bg-blue-primary/20 text-blue-400"
                      )}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-dim max-w-[200px] truncate">{req.reason}</td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded-full",
                        req.status === 'Approved' ? "text-green-500 bg-green-500/10" : 
                        req.status === 'Rejected' ? "text-red-400 bg-red-400/10" : "text-gold bg-gold/10"
                      )}>
                        {req.status}
                      </div>
                    </td>
                    {profile.role === 'CEO' && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteRequest(req.id)}
                          className="text-text-dim hover:text-red-400 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-dim opacity-40 italic">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
