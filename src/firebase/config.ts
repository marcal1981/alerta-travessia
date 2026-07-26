import { initializeApp, getApps, FirebaseApp } from "firebase/app";

/**
 * Configuração do Firebase.
 * Preencher as variáveis NEXT_PUBLIC_FIREBASE_* em .env.local com os dados do projeto real
 * (Firestore para histórico/usuários, Cloud Functions para o job do MPT, Cloud Scheduler
 * para execução periódica, Cloud Messaging para push). Nada aqui funciona até isso ser feito
 * — é intencional: a Fase 1 não deve depender de um projeto Firebase específico para rodar.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isConfigured()) return null;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export { isConfigured as isFirebaseConfigured };
