import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, Role } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import ProjectManager from './components/ProjectManager';
import TaskList from './components/TaskList';
import AssetManager from './components/AssetManager';
import LeaveManagement from './components/LeaveManagement';
import Accounting from './components/Accounting';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // If profile doesn't exist, we might need to create it 
          // (Handle this in Login component or here if we have predefined emails)
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-navy">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Login onProfileLoad={(p) => setProfile(p)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard profile={profile} />;
      case 'projects':
        return <ProjectManager profile={profile} />;
      case 'tasks':
        return <TaskList profile={profile} />;
      case 'assets':
        return <AssetManager profile={profile} />;
      case 'leave':
        return <LeaveManagement profile={profile} />;
      case 'accounting':
        return <Accounting profile={profile} />;
      default:
        return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="flex bg-bg-deep min-h-screen overflow-hidden text-text-main">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        profile={profile} 
      />
      <main className="flex-1 h-screen overflow-y-auto px-6 py-8 md:px-10">
        <header className="mb-10 flex items-center justify-between border-b border-border-subtle pb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-1 h-8 gold-gradient rounded-full" />
              <h1 className="text-2xl font-bold text-text-main tracking-tight">
                {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
            </div>
            <p className="text-[11px] font-medium text-text-dim uppercase tracking-wider mt-2 ml-4">
              Organization Health: <span className="text-green-500 font-bold">Stable</span>
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-text-main">{profile.name}</p>
              <p className="text-[10px] text-gold uppercase font-bold tracking-widest leading-none mt-1">{profile.role}</p>
            </div>
            <div className="w-10 h-10 gold-gradient rounded-full flex items-center justify-center font-bold text-navy shadow-lg border border-white/10 uppercase">
              {profile.name.charAt(0)}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
