const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin.json"); // You'll need to add this file

// Initialize admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function setupFirestore() {
  console.log("🚀 Starting Firestore setup...");

  try {
    // 1. Create sample categories if they don't exist
    console.log("\n📁 Setting up categories collection...");
    const categories = [
      {
        id: "trafikkregler",
        name: "Trafikkregler",
        description: "Grunnleggende trafikkregler og veitrafikkloven",
        icon: "book-outline",
        color: "#3B82F6",
        order: 1,
        questionCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        id: "fartsregler",
        name: "Fartsregler",
        description: "Fartsgrenser og fartstilpasning",
        icon: "speedometer-outline",
        color: "#10B981",
        order: 2,
        questionCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        id: "vikeplikt",
        name: "Vikeplikt",
        description: "Vikeplikt og høyreregelen",
        icon: "swap-horizontal-outline",
        color: "#F59E0B",
        order: 3,
        questionCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        id: "skilt",
        name: "Skilt",
        description: "Trafikkskilt og vegoppmerking",
        icon: "alert-circle-outline",
        color: "#EF4444",
        order: 4,
        questionCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        id: "trafikklys",
        name: "Trafikklys",
        description: "Lyssignaler og trafikklys",
        icon: "traffic-light-outline",
        color: "#8B5CF6",
        order: 5,
        questionCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    ];

    for (const category of categories) {
      const docRef = db.collection("categories").doc(category.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        const { id, ...categoryData } = category;
        await docRef.set(categoryData);
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name}`);
      }
    }

    // 2. Create a test user for development (optional)
    console.log("\n👤 Setting up test user progress...");
    const testUserId = "test-user-dev";
    const userProgressRef = db.collection("userProgress").doc(testUserId);
    const userProgressDoc = await userProgressRef.get();

    if (!userProgressDoc.exists) {
      await userProgressRef.set({
        userId: testUserId,
        totalTests: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
        lastTestDate: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✅ Created test user progress document");

      // Create empty subcollections by adding a dummy document
      // testResults subcollection
      const testResultRef = userProgressRef
        .collection("testResults")
        .doc("dummy");
      await testResultRef.set({
        _dummy: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await testResultRef.delete(); // Delete the dummy document
      console.log("✅ Created testResults subcollection");

      // categoryProgress subcollection
      const categoryProgressRef = userProgressRef
        .collection("categoryProgress")
        .doc("dummy");
      await categoryProgressRef.set({
        _dummy: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await categoryProgressRef.delete(); // Delete the dummy document
      console.log("✅ Created categoryProgress subcollection");
    } else {
      console.log("⏭️  Test user progress already exists");
    }

    // 3. Create sample questions (optional - just a few examples)
    console.log("\n❓ Setting up sample questions...");
    const sampleQuestions = [
      {
        question:
          "Hva er fartsgrensen i tettbygd strøk hvis ikke annet er skiltet?",
        options: ["30 km/t", "40 km/t", "50 km/t", "60 km/t"],
        correctAnswer: 2,
        explanation:
          "I tettbygd strøk er fartsgrensen 50 km/t hvis ikke annet er skiltet.",
        category: "fartsregler",
        difficulty: "easy",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        question: "Hvem har vikeplikt i et kryss uten skilt eller oppmerking?",
        options: [
          "Den som kommer fra venstre",
          "Den som kommer fra høyre",
          "Den som kommer først",
          "Den som kjører raskest",
        ],
        correctAnswer: 0,
        explanation:
          "I kryss uten regulering gjelder høyreregelen - du må vike for trafikk fra høyre.",
        category: "vikeplikt",
        difficulty: "medium",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    ];

    let questionsCreated = 0;
    for (const question of sampleQuestions) {
      const questionsSnapshot = await db
        .collection("questions")
        .where("question", "==", question.question)
        .limit(1)
        .get();

      if (questionsSnapshot.empty) {
        await db.collection("questions").add(question);
        questionsCreated++;

        // Update category question count
        await db
          .collection("categories")
          .doc(question.category)
          .update({
            questionCount: admin.firestore.FieldValue.increment(1),
          });
      }
    }

    if (questionsCreated > 0) {
      console.log(`✅ Created ${questionsCreated} sample questions`);
    } else {
      console.log("⏭️  Sample questions already exist");
    }

    console.log("\n🎉 Firestore setup completed successfully!");
    console.log("\n📝 Note: To fully populate your database, you should:");
    console.log("1. Run the question migration script to import all questions");
    console.log(
      "2. Deploy the security rules: firebase deploy --only firestore:rules"
    );
    console.log(
      "3. Deploy the indexes: firebase deploy --only firestore:indexes"
    );
  } catch (error) {
    console.error("❌ Error during setup:", error);
    process.exit(1);
  }
}

// Run the setup
setupFirestore().then(() => {
  console.log("\n✨ Setup script finished");
  process.exit(0);
});
