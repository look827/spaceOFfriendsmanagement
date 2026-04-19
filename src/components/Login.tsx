import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Role, UserProfile } from '../types';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Shield, Loader2, Sparkles } from 'lucide-react';

interface LoginProps {
  onProfileLoad: (profile: UserProfile) => void;
}

const PREDEFINED_USERS: Record<string, { role: Role; name: string; pass: string }> = {
  'sehajdeep@sof.org': { role: 'CEO', name: 'Sehajdeep Singh Walia', pass: 'CEO_SPACE_2026' },
  'japtej@sof.org': { role: 'COO', name: 'Japtej Singh', pass: 'COO_SPACE_2026' },
  'naitik@sof.org': { role: 'Head of Science', name: 'Naitik Beri', pass: 'HOS_SPACE_2026' },
  'logistics@sof.org': { role: 'COO', name: 'Field Logistics', pass: 'LOG_SPACE_2026' },
  'science.depot@sof.org': { role: 'Head of Science', name: 'Research Depot', pass: 'SCI_SPACE_2026' }
};

export default function Login({ onProfileLoad }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillCredentials = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        
        // Assign role based on predefined list or default to COO for demo purposes?
        // Actually, strictly follow requirements.
        const predefined = PREDEFINED_USERS[email.toLowerCase()];
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          name: predefined?.name || 'New Member',
          role: predefined?.role || 'COO' // Default role for testing
        };

        await setDoc(doc(db, 'users', user.uid), profile);
        onProfileLoad(profile);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          onProfileLoad(userDoc.data() as UserProfile);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-bg-deep overflow-hidden">
      <div className="hidden md:flex flex-1 flex-col justify-center p-12 text-white relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-navy w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight uppercase italic text-white underline decoration-gold/50">spaceOFfriends</h1>
          </div>
          <h2 className="text-3xl font-light mb-8 max-w-md leading-tight text-white/90">
            Secure Management Portal for Organizational Growth.
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gold">
              <Shield className="w-5 h-5" />
              <p className="font-bold text-xs uppercase tracking-[0.2em]">Enterprise Grade Security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[450px] bg-bg-surface flex flex-col justify-center p-8 md:p-12 border-l border-border-subtle shadow-2xl z-20">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-sm mx-auto w-full"
        >
          <div className="mb-10">
            <h3 className="text-xl font-bold text-text-main mb-2 uppercase tracking-widest">
              {isRegistering ? 'Create Account' : 'Member Login'}
            </h3>
            <p className="text-text-dim text-xs font-bold uppercase tracking-widest">
              Authorized access only
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-text-dim mb-2 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold transition-all text-text-main text-sm"
                placeholder="email@sof.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-dim mb-2 uppercase tracking-widest">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-bg-deep border border-border-subtle rounded-lg focus:outline-none focus:border-gold transition-all text-text-main text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-400/10 text-red-400 text-xs rounded-lg border border-red-400/20 font-bold uppercase tracking-widest">
                Error: {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 gold-gradient text-navy font-bold rounded-lg shadow-lg hover:shadow-gold/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 group uppercase text-xs tracking-widest"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? 'Register Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-border-subtle">
            <p className="text-[10px] font-bold text-text-dim mb-4 uppercase tracking-widest text-center">Predefined Credentials</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(PREDEFINED_USERS).map(([email, data]) => (
                <button
                  key={email}
                  onClick={() => fillCredentials(email, data.pass)}
                  className="p-3 bg-bg-deep border border-border-subtle rounded-lg flex items-center justify-between group hover:border-gold/30 transition-all text-left"
                >
                  <div>
                    <p className="text-[10px] font-bold text-gold uppercase tracking-tight">{data.name}</p>
                    <p className="text-[9px] text-text-dim truncate max-w-[140px] mt-0.5">{email}</p>
                  </div>
                  <div className="text-[8px] font-bold text-text-dim group-hover:text-gold uppercase px-2 py-1 bg-white/5 rounded tracking-tighter transition-colors">
                    {data.role}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full mt-8 text-[10px] font-bold text-gold hover:text-white transition-colors uppercase tracking-widest text-center"
            >
              {isRegistering 
                ? 'Back to Login' 
                : 'Need an account? Register'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
