import * as admin from 'firebase-admin';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as path from 'path';

// Initialize Firebase Admin
// You'll need to download a service account key from Firebase Console
// and either set GOOGLE_APPLICATION_CREDENTIALS env var or use the key directly
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.error('Download service account key from Firebase Console > Project Settings > Service Accounts');
  console.error('Then run: export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"');
  process.exit(1);
}

admin.initializeApp();
const db = admin.firestore();

interface SignQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category?: string;
  imageUrl?: string;
  signId?: string;
  difficulty?: string;
}

interface QuestionData {
  questions: SignQuestion[];
}

function loadSignQuestions(outputDir: string): SignQuestion[] {
  const allQuestions: SignQuestion[] = [];
  
  try {
    // Read all JSON files in the output directory
    const files = readdirSync(outputDir).filter(file => file.startsWith('sign_') && file.endsWith('.json'));
    
    for (const file of files) {
      try {
        const filePath = join(outputDir, file);
        const fileContent = readFileSync(filePath, 'utf-8');
        const data: QuestionData = JSON.parse(fileContent);
        
        if (data.questions && Array.isArray(data.questions)) {
          allQuestions.push(...data.questions);
        }
      } catch (error) {
        console.error(`Error loading ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return allQuestions;
}

async function importQuestions(questions: SignQuestion[]) {
  const totalQuestions = questions.length;
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  console.log(`Starting import of ${totalQuestions} questions...`);
  
  // Process in batches
  const batchSize = 50;
  
  for (let i = 0; i < totalQuestions; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(totalQuestions / batchSize);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches}...`);
    
    const firestoreBatch = db.batch();
    
    for (const question of batch) {
      try {
        // Check if question already exists
        const existingQuery = await db.collection('questions')
          .where('sourceQuestionId', '==', question.id)
          .limit(1)
          .get();
        
        if (!existingQuery.empty) {
          console.log(`  Skipping duplicate: ${question.id}`);
          skippedCount++;
          continue;
        }
        
        // Create a unique ID for the question
        const questionId = `sign-${question.id}`;
        const questionRef = db.collection('questions').doc(questionId);
        
        // Prepare question data
        const questionData = {
          id: questionId,
          text: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          category: question.category || 'Skilt og signaler',
          difficulty: question.difficulty || 'medium',
          imageUrl: question.imageUrl,
          signId: question.signId,
          signImageUrl: question.signId ? `/assets/signs/sign_${question.signId}.gif` : null,
          sourceQuestionId: question.id, // To prevent duplicates
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        // Remove undefined values
        Object.keys(questionData).forEach(key => {
          if (questionData[key as keyof typeof questionData] === undefined) {
            delete questionData[key as keyof typeof questionData];
          }
        });
        
        firestoreBatch.set(questionRef, questionData);
        importedCount++;
        console.log(`  ✓ Prepared: ${question.id} - ${question.question.substring(0, 50)}...`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error preparing ${question.id}:`, error);
      }
    }
    
    // Commit the batch
    try {
      await firestoreBatch.commit();
      console.log(`  Batch ${batchNum} committed successfully`);
    } catch (error) {
      console.error(`  Error committing batch ${batchNum}:`, error);
      errorCount += batch.length;
      importedCount -= batch.length;
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Import Summary:');
  console.log(`  Total questions: ${totalQuestions}`);
  console.log(`  Successfully imported: ${importedCount}`);
  console.log(`  Skipped (duplicates): ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log('='.repeat(60));
}

async function updateCategoryCount() {
  console.log('\nUpdating category counts...');
  
  try {
    // Get all questions grouped by category
    const questionsSnapshot = await db.collection('questions').get();
    const categoryCount: Record<string, number> = {};
    
    questionsSnapshot.forEach(doc => {
      const category = doc.data().category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Update or create category documents
    const batch = db.batch();
    
    for (const [categoryName, count] of Object.entries(categoryCount)) {
      const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
      const categoryRef = db.collection('categories').doc(categoryId);
      
      batch.set(categoryRef, {
        id: categoryId,
        name: categoryName,
        description: `Spørsmål om ${categoryName.toLowerCase()}`,
        questionCount: count,
        order: categoryName === 'Skilt og signaler' ? 3 : 99,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    
    await batch.commit();
    
    console.log('\nQuestions by category:');
    for (const [cat, count] of Object.entries(categoryCount)) {
      console.log(`  ${cat}: ${count}`);
    }
    
    // Count questions with sign images
    const signQuestionsSnapshot = await db.collection('questions')
      .where('signId', '!=', null)
      .get();
    
    console.log(`\nQuestions with sign images: ${signQuestionsSnapshot.size}`);
    
  } catch (error) {
    console.error('Error updating category counts:', error);
  }
}

async function main() {
  // Path to the output directory with sign questions
  const outputDir = path.resolve(__dirname, '../../../questions-generator/forerkortet-tools/data/output/signs');
  
  console.log(`Looking for sign questions in: ${outputDir}`);
  
  // Load all questions
  const questions = loadSignQuestions(outputDir);
  
  if (questions.length === 0) {
    console.log('No questions found to import.');
    console.log('Make sure you have generated sign questions first.');
    return;
  }
  
  console.log(`Found ${questions.length} questions to import.`);
  
  // Import the questions
  await importQuestions(questions);
  
  // Update category counts
  await updateCategoryCount();
  
  console.log('\nImport completed!');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
