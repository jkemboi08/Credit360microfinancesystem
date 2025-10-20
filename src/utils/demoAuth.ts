// Demo authentication system for when Supabase is not available
export interface DemoUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'staff' | 'client' | 'manager' | 'admin';
}

export const demoUsers: DemoUser[] = [
  {
    id: 'demo-1',
    email: 'md@stairway.co.tz',
    first_name: 'MD',
    last_name: 'Stairway',
    role: 'staff'
  },
  {
    id: 'demo-2',
    email: 'admin@demo.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin'
  }
];

export const demoSignIn = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: DemoUser }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find user by email
  const user = demoUsers.find(u => u.email === email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  // Demo password check (accept any password for demo)
  if (password.length < 3) {
    return { success: false, error: 'Password too short' };
  }
  
  return { success: true, user };
};

export const demoSignOut = async (): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
};

