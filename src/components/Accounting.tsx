import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { UserProfile, AccountingRecord, AccountingType } from '../types';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  DollarSign, 
  Plus, 
  Loader2,
  FileText,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AccountingProps {
  profile: UserProfile;
}

export default function Accounting({ profile }: AccountingProps) {
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<AccountingType>('Debit');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'accounting'), orderBy('date', 'desc'), limit(50));
    const unsub = onSnapshot(q, (sn) => {
      setRecords(sn.docs.map(d => ({ id: d.id, ...d.data() } as AccountingRecord)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'accounting'), {
        title,
        amount: parseFloat(amount),
        type,
        date: new Date().toISOString(),
        employeeId: profile.uid,
        status: 'Pending',
        description: ''
      });
      setTitle('');
      setAmount('');
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (profile.role !== 'CEO') return;
    try {
      await deleteDoc(doc(db, 'accounting', id));
    } catch (err) {
      console.error(err);
    }
  };

  const totalBalance = records.reduce((acc, curr) => {
    return curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="sleek-card flex items-center justify-between border-gold/10">
          <div>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Available Balance</p>
            <h4 className={`text-4xl font-bold tracking-tight ${totalBalance >= 0 ? 'text-text-main' : 'text-red-400'}`}>
              ${Math.abs(totalBalance).toLocaleString()}
            </h4>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gold/10 border border-gold/20`}>
            <Wallet className={`w-8 h-8 text-gold`} />
          </div>
        </div>
        
        <div className="sleek-card bg-bg-surface border-blue-primary/20 flex items-center justify-between overflow-hidden relative group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Financial Actions</p>
            <button 
              onClick={() => setShowAdd(!showAdd)}
              className="mt-3 px-6 py-2 gold-gradient text-navy font-bold rounded-lg text-xs uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Add Transaction
            </button>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-primary/10 flex items-center justify-center shrink-0 border border-blue-primary/20 text-gold">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sleek-card border-gold/20 max-w-2xl"
          >
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Transaction Label</label>
                  <input 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Office Supplies"
                    className="w-full px-4 py-2.5 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Amount (USD)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold text-text-main text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-8 bg-bg-deep p-4 rounded-lg border border-border-subtle">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="type" 
                    checked={type === 'Debit'} 
                    onChange={() => setType('Debit')}
                    className="w-4 h-4 accent-red-400" 
                  />
                  <span className="text-xs font-bold text-text-dim uppercase tracking-widest group-hover:text-red-400 transition-colors">Expense (Debit)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="type" 
                    checked={type === 'Credit'} 
                    onChange={() => setType('Credit')}
                    className="w-4 h-4 accent-green-400" 
                  />
                  <span className="text-xs font-bold text-text-dim uppercase tracking-widest group-hover:text-green-400 transition-colors">Income (Credit)</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-2.5 text-[10px] font-bold text-text-dim hover:text-white transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting}
                  className="px-8 py-2.5 gold-gradient text-navy rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Transaction'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sleek-card p-0 overflow-hidden">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-bg-deep/50">
          <h4 className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-gold">
            <History className="w-4 h-4" />
            Transaction History
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-deep/20 border-b border-border-subtle">
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest text-right">Date</th>
                {profile.role === 'CEO' && <th className="px-6 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border border-border-subtle",
                          record.type === 'Credit' ? "bg-green-500/10 text-green-500" : "bg-red-400/10 text-red-500"
                        )}>
                          {record.type === 'Credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-text-main tracking-tight">{record.title}</p>
                          <p className="text-[9px] text-text-dim opacity-50 uppercase tracking-widest mt-0.5">ID: {record.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                        record.type === 'Credit' ? "bg-green-500/10 text-green-500" : "bg-red-400/10 text-red-400"
                      )}>
                        {record.type}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-5 text-right font-bold",
                      record.type === 'Credit' ? "text-green-500" : "text-red-400"
                    )}>
                      {record.type === 'Credit' ? '+' : '-'}${record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right text-text-dim opacity-70">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    {profile.role === 'CEO' && (
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-text-dim hover:text-red-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-dim opacity-40 italic">
                    <p>No transactions found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
