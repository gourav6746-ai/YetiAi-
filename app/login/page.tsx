'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';

function LoginPageContent() {
  const auth = getFirebaseAuth();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Domain not authorized. Please add the current URL to your Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        alert("Login failed: " + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-pulse text-accent">
          <div className="relative w-12 h-12">
            <Image 
              src="/logo.png" 
              alt="Loading..." 
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#151515] p-8 rounded-2xl border border-white/5 shadow-2xl text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative w-20 h-20">
            <Image 
              src="/logo.png" 
              alt="YetiAI Logo" 
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-4xl font-display font-bold mb-2 tracking-tight">
          Yeti<span className="text-accent">AI</span>
        </h1>
        <p className="text-gray-400 mb-8">Nepal&apos;s first AI Assistant. 🏔️</p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
        >
          <LogIn size={20} />
          Continue with Google
        </button>

        <p className="mt-8 text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <LoginPageContent />;
}
