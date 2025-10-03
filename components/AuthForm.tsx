import React, { useState } from 'react';

interface AuthFormProps {
    onLogin: (user: string, pass: string) => void;
    onRegister: (user: string, pass: string) => void;
    isLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister, isLoading, error, setError }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username || !password) {
            setError("Por favor, preencha todos os campos.");
            return;
        }
        if (isLoginMode) {
            onLogin(username, password);
        } else {
            onRegister(username, password);
        }
    };
    
    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError(null);
        setUsername('');
        setPassword('');
    }

    return (
        <main className="h-screen w-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8">
                <h1 className="text-3xl font-bold text-center text-cyan-400 mb-2">
                    {isLoginMode ? "Login" : "Cadastro"}
                </h1>
                <p className="text-center text-slate-400 mb-8">
                    {isLoginMode ? "Acesse sua conta para continuar" : "Crie uma conta para colaborar"}
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-slate-300 text-sm font-bold mb-2">Nome de Usuário</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            placeholder="seu_usuario"
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password"className="block text-slate-300 text-sm font-bold mb-2">Senha</label>
                         <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            placeholder="••••••••"
                            required
                            autoComplete={isLoginMode ? "current-password" : "new-password"}
                        />
                    </div>
                    
                    {error && (
                        <p className="text-red-500 text-center text-sm mb-4">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-4 rounded-full transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Processando..." : (isLoginMode ? "Entrar" : "Registrar")}
                    </button>
                </form>

                <p className="text-center text-slate-400 mt-6 text-sm">
                    {isLoginMode ? "Não tem uma conta?" : "Já tem uma conta?"}
                    <button onClick={toggleMode} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2 focus:outline-none">
                        {isLoginMode ? "Cadastre-se" : "Faça login"}
                    </button>
                </p>
            </div>
        </main>
    );
};

export default AuthForm;
