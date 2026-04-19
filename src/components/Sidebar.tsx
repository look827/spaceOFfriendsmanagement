import React from 'react';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  FolderOpen,
  Calendar, 
  Wallet, 
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile;
}

export default function Sidebar({ activeTab, setActiveTab, profile }: SidebarProps) {
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'assets', label: 'Research Assets', icon: FolderOpen },
  ];

  const adminItems = [
    { id: 'leave', label: 'Personnel', icon: Calendar },
    { id: 'accounting', label: 'Accounting', icon: Wallet },
  ];

  const handleLogout = () => {
    signOut(auth);
  };

  const renderNavGroup = (items: typeof mainItems, groupLabel: string) => (
    <div className="space-y-1 mb-6">
      <div className="hidden md:flex px-4 mb-2 uppercase text-[10px] text-text-dim font-bold tracking-widest opacity-50">
        {groupLabel}
      </div>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group",
              isActive 
                ? "bg-blue-primary text-white shadow-md shadow-blue-primary/20" 
                : "text-text-dim hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive ? "text-gold" : "group-hover:text-gold transition-colors")} />
            <span className="hidden md:block font-medium tracking-tight text-sm">{item.label}</span>
            {isActive && <ChevronRight className="hidden md:block ml-auto w-4 h-4 opacity-50" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-20 md:w-64 bg-navy text-text-main flex flex-col h-screen shrink-0 relative z-30 border-r border-border-subtle shadow-xl">
      <div className="p-6 md:p-8 flex items-center gap-3">
        <div className="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center shrink-0 shadow-lg">
          <Sparkles className="text-navy w-6 h-6" />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="font-bold text-xl tracking-tighter text-white uppercase italic">spaceOFfriends</span>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-3">
        {renderNavGroup(mainItems, "Management")}
        {renderNavGroup(adminItems, "Administration")}
      </nav>

      <div className="p-4 md:p-6 mt-auto border-t border-border-subtle">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-text-dim hover:text-red-400 hover:bg-red-400/5 transition-all rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden md:block font-bold text-sm tracking-tight">Logout</span>
        </button>
      </div>
    </aside>
  );
}
