# Firebase Migration Guide

## Data Structure Migration

### Firestore Collections

#### 1. `users` Collection
```
/users/{userId}
{
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. `questions` Collection
```
/questions/{questionId}
{
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  imageUrl?: string
  signImageUrl?: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 3. `categories` Collection
```
/categories/{categoryId}
{
  id: string
  name: string
  description: string
  questionCount: number
  order: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 4. `userProgress` Collection
```
/userProgress/{userId}
{
  userId: string
  totalQuestions: number
  correctAnswers: number
  totalTests: number
  averageScore: number
  lastTestDate: timestamp
  updatedAt: timestamp
}

// Subcollections:
/userProgress/{userId}/testResults/{resultId}
{
  id: string
  score: number
  totalQuestions: number
  correctAnswers: number
  percentage: number
  categories: {
    [categoryId]: {
      correct: number
      total: number
    }
  }
  completedAt: timestamp
}

/userProgress/{userId}/categoryProgress/{categoryId}
{
  categoryId: string
  questionsAnswered: number
  correctAnswers: number
  lastAttempt: timestamp
}
```

#### 5. `userAnswers` Collection
```
/userAnswers/{userId}/answers/{answerId}
{
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  testId: string
  answeredAt: timestamp
}
```

## Migration Steps

### 1. Set up Firebase Project
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage (if needed for images)
5. Get your configuration keys and add them to your `.env` file

### 2. Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 3. Migrate Questions Data
Use the migration script in `scripts/migrateToFirebase.ts` to import questions from your existing data source.

### 4. Update Application Code
- Replace Supabase imports with Firebase
- Update authentication flows
- Update data fetching logic
- Update state management

## Authentication Migration

### From Supabase Auth to Firebase Auth

#### Sign Up
```typescript
// Before (Supabase)
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

// After (Firebase)
const user = await firebaseAuthService.signUp(email, password, displayName);
```

#### Sign In
```typescript
// Before (Supabase)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// After (Firebase)
const user = await firebaseAuthService.signIn(email, password);
```

#### Sign Out
```typescript
// Before (Supabase)
await supabase.auth.signOut();

// After (Firebase)
await firebaseAuthService.signOut();
```

## Data Fetching Migration

### Questions
```typescript
// Before (Supabase)
const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('category', categoryId);

// After (Firebase)
const q = query(
  collection(db, 'questions'),
  where('category', '==', categoryId)
);
const snapshot = await getDocs(q);
const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

## Environment Variables

Update your `.env` file:
```
# Remove these
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Add these
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```