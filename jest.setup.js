// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  User: 'User',
  Mail: 'Mail',
  Award: 'Award',
  Flame: 'Flame',
  Dumbbell: 'Dumbbell',
  Star: 'Star',
  Target: 'Target',
  Trophy: 'Trophy',
  Lock: 'Lock',
  Bell: 'Bell',
  Palette: 'Palette',
  Ruler: 'Ruler',
  ShieldCheck: 'ShieldCheck',
  Info: 'Info',
  ChevronRight: 'ChevronRight',
  ChevronLeft: 'ChevronLeft',
  LogOut: 'LogOut',
  Crown: 'Crown',
  Zap: 'Zap',
  Edit2: 'Edit2',
  X: 'X',
  Plus: 'Plus',
  Download: 'Download',
  Trash2: 'Trash2',
  FileText: 'FileText',
  Check: 'Check',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        in: jest.fn(() => ({
          single: jest.fn(),
        })),
        lte: jest.fn(() => ({
          lt: jest.fn(() => ({
            select: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
