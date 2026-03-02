'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { localChat } from '@/lib/localChat';
import Image from 'next/image';

function HomePageContent() {
  const auth = getFirebaseAuth();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        const createNewChat = () => {
          if (!user?.uid) return;
          const newChat = localChat.createChat(user.uid);
          router.push(`/chat/${newChat.id}`);
        };
        createNewChat();
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen theme-bg">
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

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <HomePageContent />;
}
