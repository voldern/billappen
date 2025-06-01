import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
  console.log('Please set it to the path of your Firebase service account JSON file');
  console.log('Example: GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json npm run import:questions');
  process.exit(1);
}

const serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account file not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string | null;
  signId?: string | null;
}

interface QuestionFile {
  questions: QuestionData[];
}

async function importQuestionsToFirebase() {
  try {
    const questionsDir = path.join(__dirname, '../../../questions-generator/forerkortet-tools/data/output/questions');
    const files = fs.readdirSync(questionsDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} question files to import`);
    
    let totalQuestions = 0;
    let totalImported = 0;
    
    // Process each file
    for (const file of files) {
      const filePath = path.join(questionsDir, file);
      console.log(`\nProcessing file: ${file}`);
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const questionFile: QuestionFile = JSON.parse(fileContent);
        
        if (!questionFile.questions || !Array.isArray(questionFile.questions)) {
          console.log(`Skipping ${file}: No questions array found`);
          continue;
        }
        
        totalQuestions += questionFile.questions.length;
        console.log(`Found ${questionFile.questions.length} questions in ${file}`);
        
        // Import each question
        for (const question of questionFile.questions) {
          try {
            // Check if question already exists
            const existingQuestion = await db.collection('questions').doc(question.id).get();
            
            if (existingQuestion.exists) {
              console.log(`Question ${question.id} already exists, skipping`);
              continue;
            }
            
            // Validate question data
            if (!question.question || !question.options || question.options.length === 0) {
              console.log(`Invalid question data for ID ${question.id}, skipping`);
              continue;
            }
            
            // Parse category from filename if needed
            let category = question.category || 'Generelt';
            
            // Map some Norwegian categories to English for consistency
            const categoryMapping: Record<string, string> = {
              'Trafikkregler': 'Trafikkregler',
              'Sikkerhet': 'Sikkerhet',
              'Kjøreteknikk': 'Kjøreteknikk',
              'Miljø': 'Miljø',
              'Førerkort': 'Førerkort',
              'Bil og utstyr': 'Bil og utstyr',
              'Generelt': 'Generelt',
            };
            
            // Try to extract category from filename
            if (!question.category || question.category === 'Generelt') {
              if (file.includes('Fareskilt') || file.includes('skilt')) {
                category = 'Trafikkskilt';
              } else if (file.includes('Vikeplikt') || file.includes('forkjør')) {
                category = 'Vikeplikt';
              } else if (file.includes('Forbud')) {
                category = 'Forbudsskilt';
              } else if (file.includes('Påbud')) {
                category = 'Påbudsskilt';
              } else if (file.includes('Opplysning')) {
                category = 'Opplysningsskilt';
              } else if (file.includes('Motorvei')) {
                category = 'Motorvei';
              } else if (file.includes('Miljø')) {
                category = 'Miljø';
              } else if (file.includes('Sikkerhet') || file.includes('Førstehjelp')) {
                category = 'Sikkerhet';
              } else if (file.includes('Bil') || file.includes('utstyr')) {
                category = 'Bil og utstyr';
              } else if (file.includes('Førerkort') || file.includes('Øvelseskjøring')) {
                category = 'Førerkort';
              }
            } else {
              category = categoryMapping[question.category] || question.category;
            }
            
            // Prepare question data for Firestore
            const questionData = {
              id: question.id,
              text: question.question,
              options: question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation || '',
              category: category,
              difficulty: question.difficulty || 'medium',
              signId: question.signId || null,
              imageUrl: question.imageUrl || null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            
            // Save to Firestore
            await db.collection('questions').doc(question.id).set(questionData);
            totalImported++;
            
            console.log(`✓ Imported question: ${question.id} (${category})`);
            
          } catch (questionError) {
            console.error(`Error importing question ${question.id}:`, questionError);
          }
        }
        
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    }
    
    console.log(`\n=== Import Summary ===`);
    console.log(`Total questions found: ${totalQuestions}`);
    console.log(`Total questions imported: ${totalImported}`);
    console.log(`Files processed: ${files.length}`);
    
    // Update categories collection
    await updateCategoriesCollection();
    
  } catch (error) {
    console.error('Error importing questions:', error);
  } finally {
    // Close the admin app
    admin.app().delete();
  }
}

async function updateCategoriesCollection() {
  try {
    console.log('\nUpdating categories collection...');
    
    // Get all unique categories from questions
    const questionsSnapshot = await db.collection('questions').get();
    const categories = new Set<string>();
    
    questionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    // Create/update category documents
    for (const categoryName of Array.from(categories)) {
      const categoryRef = db.collection('categories').doc(categoryName);
      const categoryDoc = await categoryRef.get();
      
      if (!categoryDoc.exists) {
        await categoryRef.set({
          name: categoryName,
          displayName: categoryName,
          description: `Spørsmål om ${categoryName.toLowerCase()}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✓ Created category: ${categoryName}`);
      }
    }
    
    console.log(`Categories updated: ${categories.size} total categories`);
    
  } catch (error) {
    console.error('Error updating categories:', error);
  }
}

// Run the import
if (require.main === module) {
  importQuestionsToFirebase()
    .then(() => {
      console.log('Import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export { importQuestionsToFirebase };