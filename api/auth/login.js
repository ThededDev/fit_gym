import { supabase, verifyPassword, publicUser, hashPassword } from '../_supabase.js';

export async function POST(request) {
  try {
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { email, password } = payload;

    if (!email || !password) {
      return Response.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    // Try Supabase first
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.log('Supabase error, using fallback:', error.message);
      // Fallback to in-memory data
      const fallbackUsers = [
        {
          id: 'client-1',
          email: 'ivan@example.com',
          password_hash: hashPassword('demo'),
          name: 'Иван Петров',
          role: 'client',
          phone: '+7 916 420-18-34',
          avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          created_at: '2024-01-15T00:00:00Z',
          locale: 'ru'
        },
        {
          id: 'coach-1',
          email: 'maria@example.com',
          password_hash: hashPassword('demo'),
          name: 'Мария Смирнова',
          role: 'coach',
          phone: '+7 985 712-50-16',
          avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
          created_at: '2023-06-01T00:00:00Z',
          locale: 'ru'
        }
      ];
      
      const fallbackUser = fallbackUsers.find(u => u.email === email);
      if (!fallbackUser || !verifyPassword(password, fallbackUser.password_hash)) {
        return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });
      }
      
      return Response.json(publicUser(fallbackUser));
    }

    if (!user) {
      return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    return Response.json(publicUser(user));
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}