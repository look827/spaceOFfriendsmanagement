import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { UserProfile, Project, Task } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Clock, AlertCircle, CheckCircle2, 
  ArrowUpRight, Users, Briefcase, Activity, Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  profile: UserProfile;
}

const COLORS = ['#001f3f', '#D4AF37', '#FF8C00', '#22C55E'];

export default function Dashboard({ profile }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pQuery = query(collection(db, 'projects'));
    const tQuery = query(collection(db, 'tasks'));

    const unsubP = onSnapshot(pQuery, (sn) => {
      setProjects(sn.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });

    const unsubT = onSnapshot(tQuery, (sn) => {
      setTasks(sn.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });

    return () => {
      unsubP();
      unsubT();
    };
  }, []);

  const stats = [
    { label: 'Active Projects', value: projects.length, icon: Briefcase, color: 'text-navy', bg: 'bg-navy/5' },
    { label: 'Total Tasks', value: tasks.length, icon: Activity, iconColor: 'text-gold', iconBg: 'bg-gold/10' },
    { label: 'Pending Tasks', value: tasks.filter(t => t.status !== 'Done').length, icon: Clock, iconColor: 'text-orange-500', iconBg: 'bg-orange-50' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'Done').length, icon: CheckCircle2, iconColor: 'text-green-600', iconBg: 'bg-green-50' },
  ];

  const projectStatusData = [
    { name: 'Backlog', value: projects.filter(p => p.status === 'Backlog').length },
    { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length },
    { name: 'Review', value: projects.filter(p => p.status === 'Review').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length },
  ];

  const myTasks = tasks.filter(t => t.assignedTo === profile.uid);

  return (
    <div className="space-y-8 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="sleek-card flex items-center gap-5 hover:border-gold/30 transition-all cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-blue-primary/10 border border-blue-primary/20 shadow-sm`}>
              <stat.icon className={`w-6 h-6 text-gold`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-0.5">{stat.label}</p>
              <p className="text-2xl font-bold text-text-main tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="sleek-card border-t-2 border-t-gold">
          <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-4">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Project Breakdown
            </h3>
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">All Sectors</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161c2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {projectStatusData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-bg-deep rounded-lg border border-border-subtle group transition-colors hover:border-gold/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-text-main">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sleek-card border-t-2 border-t-gold flex flex-col">
          <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-main">
              <Sparkles className="w-5 h-5 text-gold" />
              Recent Tasks
            </h3>
            <div className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
              Assigned
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {myTasks.length > 0 ? (
              myTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="p-4 bg-bg-deep border border-border-subtle rounded-xl hover:bg-white/5 hover:border-gold/20 transition-all cursor-pointer group flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-text-main group-hover:text-gold transition-colors tracking-tight">{task.title}</h4>
                    <p className="text-[10px] text-text-dim mt-1.5 flex items-center gap-2 font-bold uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-orange-action" />
                      Due: <span className="text-text-main">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}</span>
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-dim group-hover:text-gold transition-colors" />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-text-dim opacity-40 space-y-3">
                <CheckCircle2 className="w-12 h-12" />
                <p className="text-[11px] font-bold uppercase tracking-widest">No pending tasks</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
              Profile: <span className="text-gold">{profile.name}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
