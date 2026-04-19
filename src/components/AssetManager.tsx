import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { UserProfile, Asset } from '../types';
import { 
  UploadCloud, 
  FileCode, 
  Trash2, 
  Download, 
  Loader2, 
  AlertCircle,
  FileCheck,
  Boxes,
  X,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AssetManagerProps {
  profile: UserProfile;
}

export default function AssetManager({ profile }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'starting' | 'transferring' | 'indexing'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'assets'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, 
      (sn) => {
        setAssets(sn.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
      },
      (err) => {
        console.error("Firestore Listen error:", err);
        setError("Unable to connect to research repository.");
      }
    );
    return () => unsub();
  }, []);

  const handleFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Validating file type
    if (extension !== 'obj' && extension !== 'blend') {
      setError('Unsupported format. Only .obj and .blend mesh files are accepted.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadStatus('starting');
    setUploadProgress(0);

    try {
      const storagePath = `assets/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      // Upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setUploadStatus('transferring');
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (err) => {
          console.error("Upload error details:", err);
          let msg = `Transfer failed: ${err.code || err.message}`;
          if (err.code === 'storage/unauthorized') {
            msg = "Access Denied. Ensure Firebase Storage is enabled and rules allow access.";
          } else if (err.code === 'storage/canceled') {
            msg = "Upload was canceled.";
          } else if (err.code === 'storage/unknown') {
            msg = "An unknown error occurred. Check browser console for details.";
          }
          setError(msg);
          setIsUploading(false);
          setUploadStatus('idle');
        },
        async () => {
          setUploadStatus('indexing');
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'assets'), {
              name: file.name,
              type: extension,
              size: file.size,
              url: downloadURL,
              storagePath: storagePath,
              uploadedBy: profile.uid,
              uploaderName: profile.name,
              uploadedAt: new Date().toISOString()
            });
            setIsUploading(false);
            setUploadStatus('idle');
            setUploadProgress(0);
          } catch (docErr: any) {
            console.error("Indexing Error:", docErr);
            setError(`File saved, but indexing failed: ${docErr.message}`);
            setIsUploading(false);
            setUploadStatus('idle');
          }
        }
      );
    } catch (err: any) {
      console.error("Initial Upload Error:", err);
      setError(`Failed to initialize upload: ${err.message}`);
      setIsUploading(false);
      setUploadStatus('idle');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDelete = async (asset: Asset) => {
    // Avoid using window.confirm as it can be blocked in iframe
    setIsDeleting(asset.id);
    try {
      if (asset.storagePath) {
        const storageRef = ref(storage, asset.storagePath);
        await deleteObject(storageRef).catch(e => console.warn("Storage delete missed:", e));
      }
      await deleteDoc(doc(db, 'assets', asset.id));
    } catch (err) {
      console.error("Delete Error:", err);
      setError("Failed to remove asset from database.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sleek-card border-none bg-bg-surface/50">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-gold" />
            Research Repository
          </h2>
          <p className="text-xs text-text-dim mt-1">Manage and collaborate on technical 3D mesh assets.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 gold-gradient text-navy font-bold rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-gold/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-4 h-4" />
          Add Research Asset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upload & Info Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "sleek-card border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all h-[240px] text-center group",
              dragActive ? "border-gold bg-gold/5" : "border-border-subtle hover:border-gold/30",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".obj,.blend"
              onChange={handleChange}
            />
            
            <div className={cn(
              "w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-gold/10 transition-colors",
              isUploading && "animate-pulse"
            )}>
              {isUploading ? (
                <Loader2 className="w-7 h-7 text-gold animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7 text-text-dim group-hover:text-gold transition-colors" />
              )}
            </div>

            <p className="text-xs font-medium text-text-dim mb-1">Drag & Drop Files</p>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">OBJ or BLEND only</p>

            {isUploading && (
              <div className="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-center p-6 rounded-xl">
                <p className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-4">
                  {uploadStatus === 'starting' && 'Initializing...'}
                  {uploadStatus === 'transferring' && 'Transferring Mesh...'}
                  {uploadStatus === 'indexing' && 'Finalizing Entry...'}
                </p>
                <div className="w-full bg-bg-surface h-1.5 rounded-full overflow-hidden border border-border-subtle shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadStatus === 'indexing' ? 100 : uploadProgress}%` }}
                    className="h-full bg-gold shadow-[0_0_10px_rgba(197,160,40,0.5)]"
                  />
                </div>
                <p className="mt-3 text-[10px] font-mono text-gold/70">
                  {uploadStatus === 'transferring' ? `${Math.round(uploadProgress)}%` : 'Processing...'}
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Protocol Warning</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-3">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded font-bold text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" /> Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="sleek-card p-4 space-y-4">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.2em]">Guidelines</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <FileCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-[10px] text-text-dim leading-normal">Always include original material libraries with .obj files.</p>
              </div>
              <div className="flex gap-3">
                <FileCheck className="w-4 h-4 text-orange-400 shrink-0" />
                <p className="text-[10px] text-text-dim leading-normal">Pack resources into .blend files before uploading.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="lg:col-span-3">
          {assets.length === 0 ? (
            <div className="sleek-card py-24 text-center border-dashed border-2 border-border-subtle opacity-30 flex flex-col items-center">
              <Boxes className="w-12 h-12 mb-4 text-text-dim" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-dim">Repository Empty</p>
              <p className="text-[10px] text-text-dim/60 mt-1 capitalize leading-relaxed">No shared assets detected in organizational storage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <motion.div 
                  layout
                  key={asset.id}
                  className="sleek-card p-0 group flex flex-col border-white/5 hover:border-gold/20 overflow-hidden transition-all duration-300"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border border-border-subtle",
                        asset.type === 'blend' ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {asset.type === 'blend' ? <FileCode className="w-6 h-6" /> : <Boxes className="w-6 h-6" />}
                      </div>
                      <div className="flex items-center gap-1">
                        { (asset.uploadedBy === profile.uid || profile.role === 'CEO') && (
                          <button 
                            disabled={isDeleting === asset.id}
                            onClick={() => handleDelete(asset)}
                            className="p-2 text-text-dim hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {isDeleting === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <h5 className="font-bold text-white text-sm truncate uppercase tracking-tight mb-1" title={asset.name}>
                      {asset.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-text-dim font-bold uppercase tracking-widest">
                      <span className={asset.type === 'blend' ? "text-orange-400" : "text-blue-400"}>{asset.type}</span>
                      <span className="opacity-20">•</span>
                      <span>{formatSize(asset.size)}</span>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-white/[0.02] border-t border-border-subtle flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-text-dim uppercase tracking-tighter">Uploaded by</span>
                      <span className="text-[10px] font-bold text-white/80 truncate leading-tight mt-0.5">{asset.uploaderName}</span>
                    </div>
                    <a 
                      href={asset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-blue-primary text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-blue-primary/80 flex items-center gap-2 shadow-lg shadow-blue-primary/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Get File
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
