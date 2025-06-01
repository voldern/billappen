import firestore from "@react-native-firebase/firestore";
import crashlytics from "@react-native-firebase/crashlytics";
import { Question, Category, TestResult } from "../types";

class FirebaseQuestionService {
  async getAllQuestions(): Promise<Question[]> {
    try {
      const snapshot = await firestore().collection("questions").get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to ISO strings
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as Question[];
    } catch (error) {
      console.error("Error fetching questions:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
    try {
      const snapshot = await firestore()
        .collection("questions")
        .where("category", "==", categoryId)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to ISO strings
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as Question[];
    } catch (error) {
      console.error("Error fetching questions by category:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getRandomQuestions(
    count: number,
    categoryId?: string
  ): Promise<Question[]> {
    try {
      let questions: Question[];

      if (categoryId) {
        questions = await this.getQuestionsByCategory(categoryId);
      } else {
        questions = await this.getAllQuestions();
      }

      // Shuffle and slice
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (error) {
      console.error("Error fetching random questions:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const snapshot = await firestore()
        .collection("categories")
        .orderBy("order", "asc")
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert any timestamps if they exist
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async testFirebaseConnection(userId: string): Promise<void> {
    try {
      console.log("Testing Firebase connection for user:", userId);

      // Test 1: Can we read the user progress document?
      const userProgressRef = firestore()
        .collection("userProgress")
        .doc(userId);
      const doc = await userProgressRef.get();
      console.log("User progress document exists:", doc.exists());

      // Test 2: Can we write to the user progress document?
      await userProgressRef.set(
        {
          testField: "test",
          timestamp: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log("Successfully wrote to user progress document");

      // Test 3: Can we create a document in a subcollection?
      const testSubRef = userProgressRef
        .collection("testSubcollection")
        .doc("testDoc");
      await testSubRef.set({
        test: true,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      console.log("Successfully created document in subcollection");

      // Clean up
      await testSubRef.delete();
      console.log("Test completed successfully");
    } catch (error) {
      console.error("Firebase connection test failed:", error);
      throw error;
    }
  }

  async ensureUserProgressExists(userId: string): Promise<void> {
    try {
      const userProgressRef = firestore()
        .collection("userProgress")
        .doc(userId);
      const userProgressDoc = await userProgressRef.get();

      if (!userProgressDoc.exists()) {
        // Create the user progress document
        await userProgressRef.set({
          userId,
          totalTests: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageScore: 0,
          lastTestDate: null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error ensuring user progress exists:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async saveTestResult(
    userId: string,
    result: Omit<TestResult, "id" | "userId">
  ): Promise<string> {
    let testResultId = "";

    try {
      console.log("Starting saveTestResult for user:", userId);
      console.log("Result categories:", result.categories);

      // Ensure user progress document exists first
      try {
        await this.ensureUserProgressExists(userId);
        console.log("User progress document ensured");
      } catch (error) {
        console.error("Failed to ensure user progress exists:", error);
        throw error;
      }

      // Save test result
      try {
        console.log("Saving test result to subcollection...");
        const testResultRef = await firestore()
          .collection("userProgress")
          .doc(userId)
          .collection("testResults")
          .add({
            ...result,
            completedAt: firestore.FieldValue.serverTimestamp(),
          });
        testResultId = testResultRef.id;
        console.log("Test result saved with ID:", testResultId);
      } catch (error) {
        console.error("Failed to save test result:", error);
        throw error;
      }

      // Update user progress
      try {
        console.log("Updating user progress document...");
        const userProgressRef = firestore()
          .collection("userProgress")
          .doc(userId);
        const userProgressDoc = await userProgressRef.get();

        if (userProgressDoc.exists()) {
          // Update existing progress
          console.log("Updating existing user progress...");
          const currentData = userProgressDoc.data() || {};
          const newTotalTests = (currentData.totalTests || 0) + 1;
          const newTotalQuestions =
            (currentData.totalQuestions || 0) + result.totalQuestions;
          const newCorrectAnswers =
            (currentData.correctAnswers || 0) + result.correctAnswers;
          const newAverageScore = (newCorrectAnswers / newTotalQuestions) * 100;

          await userProgressRef.update({
            totalTests: newTotalTests,
            totalQuestions: newTotalQuestions,
            correctAnswers: newCorrectAnswers,
            averageScore: newAverageScore,
            lastTestDate: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
          console.log("User progress updated");
        } else {
          console.error(
            "User progress document doesn't exist after ensureUserProgressExists!"
          );
        }
      } catch (error) {
        console.error("Failed to update user progress:", error);
        throw error;
      }

      // Update category progress
      console.log("Updating category progress...");
      for (const [categoryId, categoryData] of Object.entries(
        result.categories || {}
      )) {
        try {
          console.log(`Processing category: ${categoryId}`, categoryData);
          const categoryProgressRef = firestore()
            .collection("userProgress")
            .doc(userId)
            .collection("categoryProgress")
            .doc(categoryId);

          console.log(
            `Checking if category progress exists for: ${categoryId}`
          );
          const categoryProgressDoc = await categoryProgressRef.get();

          if (categoryProgressDoc.exists()) {
            console.log(
              `Updating existing category progress for: ${categoryId}`
            );
            await categoryProgressRef.update({
              questionsAnswered: firestore.FieldValue.increment(
                categoryData.total
              ),
              correctAnswers: firestore.FieldValue.increment(
                categoryData.correct
              ),
              lastAttempt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
          } else {
            console.log(`Creating new category progress for: ${categoryId}`);
            await categoryProgressRef.set({
              categoryId,
              questionsAnswered: categoryData.total,
              correctAnswers: categoryData.correct,
              lastAttempt: firestore.FieldValue.serverTimestamp(),
              createdAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
          }
          console.log(`Category progress updated for: ${categoryId}`);
        } catch (error) {
          console.error(
            `Failed to update category progress for ${categoryId}:`,
            error
          );
          // Don't throw here, continue with other categories
        }
      }

      console.log("All saves completed successfully");
      return testResultId;
    } catch (error) {
      console.error("Error in saveTestResult:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
        console.error("Error message:", error.message);
      }
      if (error && typeof error === "object" && "code" in error) {
        console.error("Error code:", error.code);
      }
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getUserTestResults(userId: string): Promise<TestResult[]> {
    try {
      const snapshot = await firestore()
        .collection("userProgress")
        .doc(userId)
        .collection("testResults")
        .orderBy("completedAt", "desc")
        .limit(50)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId,
          ...data,
          // Convert Firestore timestamp to ISO string
          completedAt: data.completedAt?.toDate?.()?.toISOString?.() || null,
          date: data.completedAt?.toDate?.()?.toISOString?.() || null,
        };
      }) as TestResult[];
    } catch (error) {
      console.error("Error fetching user test results:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      const userProgressDoc = await firestore()
        .collection("userProgress")
        .doc(userId)
        .get();
      if (userProgressDoc.exists()) {
        return userProgressDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching user progress:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async getCategoryProgress(userId: string, categoryId: string) {
    try {
      const categoryProgressDoc = await firestore()
        .collection("userProgress")
        .doc(userId)
        .collection("categoryProgress")
        .doc(categoryId)
        .get();
      if (categoryProgressDoc.exists()) {
        return categoryProgressDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching category progress:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }

  async saveUserAnswer(
    userId: string,
    answer: {
      questionId: string;
      selectedAnswer: number;
      isCorrect: boolean;
      testId: string;
    }
  ) {
    try {
      await firestore()
        .collection("userAnswers")
        .doc(userId)
        .collection("answers")
        .add({
          ...answer,
          answeredAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error saving user answer:", error);
      crashlytics().recordError(error as Error);
      throw error;
    }
  }
}

export default new FirebaseQuestionService();
