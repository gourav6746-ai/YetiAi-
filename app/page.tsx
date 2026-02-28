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
        // Create a new chat using local storage and redirect
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
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="animate-pulse text-accent">
        <div className="relative w-12 h-12">
          <Image 
            src="https://drive.google.com/uc?export=download&id=16rY94DS5YoCQl0NgeFATB4HI1dATJTfq" 
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
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <HomePageContent />;
}
