
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Usuario, PerfilAcesso } from '../types';
import { 
  ensureDefaultClasses, 
  ensureDefaultRequisitos, 
  ensureDefaultCargos,
  ensureDefaultUnidades,
  ensureDefaultInstructorTypes
} from '../services/firestoreDb';

interface AuthContextType {
  currentUser: Usuario | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, nome: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PENDING_CLUB_NAME_KEY = 'pendingClubName';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const profile = userDoc.data() as Usuario;
            setCurrentUser(profile);
            
            // Seeds Idempotentes
            await ensureDefaultClasses(profile.clubeId);
            await ensureDefaultRequisitos(profile.clubeId);
            await ensureDefaultCargos(profile.clubeId);
            await ensureDefaultUnidades(profile.clubeId);
            await ensureDefaultInstructorTypes(profile.clubeId);
          } else {
            const newClubId = `clube-${Math.random().toString(36).slice(2, 11)}`;
            const pendingClubName = localStorage.getItem(PENDING_CLUB_NAME_KEY);
            const clubName =
              pendingClubName?.trim() ||
              firebaseUser.displayName ||
              `Clube de ${firebaseUser.email?.split('@')[0]}`;

            await setDoc(doc(db, 'clubs', newClubId), {
              id: newClubId,
              nome: clubName,
              createdAt: serverTimestamp()
            });

            await ensureDefaultClasses(newClubId);
            await ensureDefaultRequisitos(newClubId);
            await ensureDefaultCargos(newClubId);
            await ensureDefaultUnidades(newClubId);
            await ensureDefaultInstructorTypes(newClubId);

            const newProfile: Usuario = {
              id: firebaseUser.uid,
              nome: firebaseUser.email?.split('@')[0] || 'Novo Líder',
              email: firebaseUser.email || '',
              perfil: PerfilAcesso.DIRETORIA,
              cargo: 'Diretor(a)',
              clubeId: newClubId,
              ativo: true
            };

            await setDoc(userRef, newProfile);
            setCurrentUser(newProfile);
            if (pendingClubName) {
              localStorage.removeItem(PENDING_CLUB_NAME_KEY);
            }
          }
        } catch (err) {
          console.error("Erro no carregamento:", err);
          setError("Erro ao carregar perfil.");
        }
      } else {
        setCurrentUser(null);
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const targetEmail = email.includes('@') ? email : `${email.toLowerCase().trim()}@desbravahub.local`;
      await signInWithEmailAndPassword(auth, targetEmail, pass);
    } catch (err: any) {
      setError("Credenciais inválidas.");
      throw err;
    }
  };

  const register = async (email: string, pass: string, nome: string) => {
    setError(null);
    try {
      const targetEmail = email.includes('@') ? email : `${email.toLowerCase().trim()}@desbravahub.local`;
      localStorage.setItem(PENDING_CLUB_NAME_KEY, nome.trim());
      await createUserWithEmailAndPassword(auth, targetEmail, pass);
    } catch (err: any) {
      setError(err.message);
      localStorage.removeItem(PENDING_CLUB_NAME_KEY);
      throw err;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, isInitializing, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
