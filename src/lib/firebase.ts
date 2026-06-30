import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyARUFEV7vlId_vdXtV9L99WAQ0998fMOPA",
  authDomain: "firm-doodad-2sjh2.firebaseapp.com",
  projectId: "firm-doodad-2sjh2",
  storageBucket: "firm-doodad-2sjh2.firebasestorage.app",
  messagingSenderId: "724930915152",
  appId: "1:724930915152:web:d8d6a8898e5bc863a25a55"
};

const databaseId = "ai-studio-alwaqfmedicaldir-f5866b8c-fa92-4d67-be7d-07821ab0a22e";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
