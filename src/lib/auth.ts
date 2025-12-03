// Authentication utility functions

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: 'admin' | 'brand' | 'owner';
  passwordHash: string;
  createdAt: string;
  onboardingComplete: boolean;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  isAdmin?: boolean; // Additional flag for admin privileges
}

// Simple hash function (in production, use bcrypt or similar)
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Generate unique ID
export const generateId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Local storage keys
const USERS_KEY = 'ngventures_users';
const SESSION_KEY = 'ngventures_session';

// Get all users from storage
export const getAllUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Save users to storage
const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Find user by email
export const findUserByEmail = (email: string): User | null => {
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

// Create new user
export const createUser = async (
  email: string,
  password: string,
  name: string,
  userType: 'admin' | 'brand' | 'owner',
  phone?: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Check if user already exists
    if (findUserByEmail(email)) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user object
    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      phone,
      userType,
      passwordHash,
      createdAt: new Date().toISOString(),
      onboardingComplete: userType === 'admin', // Admins don't need onboarding
      subscriptionTier: userType === 'admin' ? 'enterprise' : 'free',
      isAdmin: userType === 'admin'
    };

    // Save to storage
    const users = getAllUsers();
    users.push(newUser);
    saveUsers(users);

    // Remove password hash from returned user
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Create session
    setSession(user);

    return { success: true, user };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Failed to login' };
  }
};

// Session management
export const setSession = (user: User): void => {
  if (typeof window === 'undefined') return;
  const session = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
    name: user.name,
    isAdmin: user.isAdmin || user.userType === 'admin',
    timestamp: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): {
  userId: string;
  email: string;
  userType: 'admin' | 'brand' | 'owner';
  name: string;
  isAdmin?: boolean;
} | null => {
  if (typeof window === 'undefined') return null;
  const sessionJson = localStorage.getItem(SESSION_KEY);
  if (!sessionJson) return null;
  
  const session = JSON.parse(sessionJson);
  
  // Check if session is expired (24 hours)
  const now = Date.now();
  const sessionAge = now - session.timestamp;
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  if (sessionAge > twentyFourHours) {
    clearSession();
    return null;
  }
  
  return session;
};

export const clearSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
};

export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

export const getCurrentUser = (): User | null => {
  const session = getSession();
  if (!session) return null;
  
  return findUserByEmail(session.email);
};

export const logout = (): void => {
  clearSession();
};

// Update user
export const updateUser = (userId: string, updates: Partial<User>): boolean => {
  try {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return false;
    
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    
    // Update session if current user
    const session = getSession();
    if (session && session.userId === userId) {
      setSession(users[userIndex]);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

// Google OAuth Integration
export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export const loginWithGoogle = async (
  googleUserInfo: GoogleUserInfo,
  userType: 'admin' | 'brand' | 'owner'
): Promise<{ success: boolean; user?: User; error?: string; isNewUser?: boolean }> => {
  try {
    // Check if user exists
    let user = findUserByEmail(googleUserInfo.email);
    
    if (user) {
      // Existing user - log them in
      setSession(user);
      return { success: true, user, isNewUser: false };
    }
    
    // New user - create account with Google
    const newUser: User = {
      id: generateId(),
      email: googleUserInfo.email.toLowerCase(),
      name: googleUserInfo.name,
      userType,
      passwordHash: '', // No password for OAuth users
      createdAt: new Date().toISOString(),
      onboardingComplete: userType === 'admin',
      subscriptionTier: userType === 'admin' ? 'enterprise' : 'free',
      isAdmin: userType === 'admin'
    };
    
    // Save to storage
    const users = getAllUsers();
    users.push(newUser);
    saveUsers(users);
    
    // Create session
    setSession(newUser);
    
    return { success: true, user: newUser, isNewUser: true };
  } catch (error) {
    console.error('Error with Google login:', error);
    return { success: false, error: 'Failed to login with Google' };
  }
};

// Admin Helper Functions
export const isAdmin = (user: User | null): boolean => {
  return user?.userType === 'admin' || user?.isAdmin === true;
};

export const checkAdminAccess = (): boolean => {
  const user = getCurrentUser();
  return isAdmin(user);
};

// Create default admin account if doesn't exist
export const initializeAdminAccount = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const adminEmail = 'admin@ngventures.com';
  const existingAdmin = findUserByEmail(adminEmail);
  
  if (!existingAdmin) {
    // Create default admin account
    await createUser(
      adminEmail,
      'admin123', // Default password - should be changed
      'System Administrator',
      'admin'
    );
    console.log('✅ Default admin account created: admin@ngventures.com / admin123');
  }
};

// Get all users (Admin only)
export const getAllUsersAdmin = (): User[] => {
  if (!checkAdminAccess()) {
    console.error('Unauthorized: Admin access required');
    return [];
  }
  return getAllUsers();
};

// Get user statistics (Admin only)
export const getUserStatistics = (): {
  total: number;
  admins: number;
  brands: number;
  owners: number;
  freeUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
} | null => {
  if (!checkAdminAccess()) {
    console.error('Unauthorized: Admin access required');
    return null;
  }
  
  const users = getAllUsers();
  
  return {
    total: users.length,
    admins: users.filter(u => u.userType === 'admin').length,
    brands: users.filter(u => u.userType === 'brand').length,
    owners: users.filter(u => u.userType === 'owner').length,
    freeUsers: users.filter(u => u.subscriptionTier === 'free').length,
    premiumUsers: users.filter(u => u.subscriptionTier === 'premium').length,
    enterpriseUsers: users.filter(u => u.subscriptionTier === 'enterprise').length
  };
};

// Delete user (Admin only)
export const deleteUser = (userId: string): boolean => {
  if (!checkAdminAccess()) {
    console.error('Unauthorized: Admin access required');
    return false;
  }
  
  try {
    const users = getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (users.length === filteredUsers.length) {
      return false; // User not found
    }
    
    saveUsers(filteredUsers);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};
