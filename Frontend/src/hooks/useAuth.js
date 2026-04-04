import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Hook personalizado para autenticacion
const useAuth = () => useContext(AuthContext);

export default useAuth;
