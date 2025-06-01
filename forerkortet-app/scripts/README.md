# Firestore Setup Scripts

This directory contains scripts to set up the Firestore database structure for the Forerkortet app.

## Prerequisites

1. **Firebase Admin SDK Key**: You need to download a service account key from Firebase:

   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the file as `firebase-admin-key.json` in the `forerkortet-app` directory
   - ⚠️ **IMPORTANT**: Add `firebase-admin-key.json` to your `.gitignore` file!

2. **Firebase CLI**: Make sure you have Firebase CLI installed:
   ```bash
   npm install -g firebase-tools
   ```

## Setup Instructions

1. **Install dependencies**:

   ```bash
   cd forerkortet-app/scripts
   pnpm install
   ```

2. **Run the setup script**:

   ```bash
   pnpm setup
   ```

   This will:

   - Create the `categories` collection with 5 default categories
   - Create the `userProgress` collection structure
   - Add a few sample questions
   - Set up the required subcollections

3. **Deploy Firestore rules**:

   ```bash
   pnpm deploy-rules
   ```

4. **Deploy Firestore indexes**:
   ```bash
   pnpm deploy-indexes
   ```

## What the script creates

### Collections Structure:

```
firestore/
├── categories/
│   ├── trafikkregler
│   ├── fartsregler
│   ├── vikeplikt
│   ├── skilt
│   └── trafikklys
├── questions/
│   └── (sample questions)
└── userProgress/
    └── {userId}/
        ├── (user progress document)
        ├── testResults/
        │   └── (test results will be stored here)
        └── categoryProgress/
            └── (category-specific progress)
```

### Security Rules

The security rules ensure:

- Users can only read/write their own progress data
- Questions and categories are publicly readable
- Only authenticated users can access the data

## Next Steps

After running this setup:

1. You can start using the app - it will save test results to Firestore
2. Import more questions using a migration script
3. The collections will auto-expand as users take tests

## Troubleshooting

If you get a "document not found" error:

- Make sure you've run this setup script
- Check that your Firebase project is correctly configured
- Verify that the user is authenticated before saving results
