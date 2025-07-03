import { User } from '../types';

const AUTH_KEY = 'edusphere_auth';
const USERS_KEY = 'edusphere_users';

export const saveUser = (user: User) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(AUTH_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const getAllUsers = (): User[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const saveAllUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const login = (email: string, password: string): User | null => {
  const users = getAllUsers();
  const user = users.find(u => u.email === email);
  
  if (user && password === 'password123') { // Mock authentication
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    saveUser(updatedUser);
    
    // Update user in the users list
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveAllUsers(updatedUsers);
    
    return updatedUser;
  }
  
  return null;
};

export const changePassword = (userId: string, newPassword: string): boolean => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex].isFirstLogin = false;
    saveAllUsers(users);
    
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      saveUser({ ...currentUser, isFirstLogin: false });
    }
    
    return true;
  }
  
  return false;
};