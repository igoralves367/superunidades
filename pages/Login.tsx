
import React from 'react';
import { LoginView } from './LoginView';

interface LoginProps {
  onLogin?: (user: any) => void;
}

/**
 * @deprecated Utilize LoginView para o fluxo real do Firebase.
 * Este componente foi mantido apenas para compatibilidade de rota e redirecionado para LoginView.
 */
export const Login: React.FC<LoginProps> = () => {
  return <LoginView onCreateClubClick={() => {}} />;
};
