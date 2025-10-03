import { User } from "../types";

const USERS_STORAGE_KEY = 'accessibility_app_users';
const SESSION_STORAGE_KEY = 'accessibility_app_session';

// Simulação de banco de dados de usuários no localStorage
const getUsers = (): Record<string, string> => {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        return users ? JSON.parse(users) : {};
    } catch (e) {
        return {};
    }
};

const saveUsers = (users: Record<string, string>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const register = async (username: string, password_not_used: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simula a latência da rede
            const users = getUsers();
            if (users[username.toLowerCase()]) {
                return reject(new Error("Nome de usuário já existe."));
            }
            const newUser: User = { id: crypto.randomUUID(), username };
            // Não armazenamos a senha em um exemplo de frontend
            users[username.toLowerCase()] = newUser.id;
            saveUsers(users);
            resolve(newUser);
        }, 500);
    });
};

export const login = async (username: string, password_not_used: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simula a latência da rede
            const users = getUsers();
            const userId = users[username.toLowerCase()];
            if (userId) {
                const user: User = { id: userId, username };
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
                resolve(user);
            } else {
                reject(new Error("Nome de usuário ou senha inválidos."));
            }
        }, 500);
    });
};

export const logout = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

export const getCurrentUser = (): User | null => {
    try {
        const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
};
