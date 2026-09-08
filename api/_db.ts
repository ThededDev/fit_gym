import { hashPassword } from './_lib';
import { randomUUID } from 'crypto';

// Общее хранилище данных для всех API функций
// В продакшене нужно заменить на реальную базу данных (PostgreSQL, MongoDB, и т.д.)
export const db = {
  users: [
    {
      id: 'client-1',
      email: 'ivan@example.com',
      passwordHash: hashPassword('demo'),
      name: 'Иван Петров',
      role: 'client',
      phone: '+7 916 420-18-34',
      avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      createdAt: '2024-01-15T00:00:00Z',
      locale: 'ru'
    },
    {
      id: 'client-2',
      email: 'anna@example.com',
      passwordHash: hashPassword('demo'),
      name: 'Анна Козлова',
      role: 'client',
      phone: '+7 903 118-42-07',
      avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      createdAt: '2024-02-10T00:00:00Z',
      locale: 'ru'
    },
    {
      id: 'client-3',
      email: 'dmitry@example.com',
      passwordHash: hashPassword('demo'),
      name: 'Дмитрий Волков',
      role: 'client',
      phone: '+7 925 603-74-19',
      avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
      createdAt: '2024-03-05T00:00:00Z',
      locale: 'ru'
    },
    {
      id: 'coach-1',
      email: 'maria@example.com',
      passwordHash: hashPassword('demo'),
      name: 'Мария Смирнова',
      role: 'coach',
      phone: '+7 985 712-50-16',
      avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      createdAt: '2023-06-01T00:00:00Z',
      locale: 'ru'
    }
  ],
  
  exercises: [],
  workoutTemplates: [],
  scheduledWorkouts: [],
  goals: [],
  nutritionPlans: [],
  foodItems: [],
  mealEntries: [],
  comments: [],
  
  getUserByEmail(email: string) {
    return this.users.find(u => u.email === email);
  },
  
  addUser(user: any) {
    this.users.push(user);
    return user;
  },
  
  userExists(email: string) {
    return this.users.some(u => u.email === email);
  },
  
  getCollection(collectionName: string) {
    return this[collectionName] || [];
  },
  
  addToCollection(collectionName: string, item: any) {
    if (!this[collectionName]) {
      this[collectionName] = [];
    }
    this[collectionName].push(item);
    return item;
  },
  
  updateInCollection(collectionName: string, id: string, updates: any) {
    const collection = this[collectionName];
    if (!collection) return null;
    
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    collection[index] = { ...collection[index], ...updates, id };
    return collection[index];
  },
  
  deleteFromCollection(collectionName: string, id: string) {
    const collection = this[collectionName];
    if (!collection) return false;
    
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    collection.splice(index, 1);
    return true;
  }
};