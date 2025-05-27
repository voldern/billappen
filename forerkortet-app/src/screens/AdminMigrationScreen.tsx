import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import firebaseQuestionService from '../services/firebaseQuestionService';
import firestore from '@react-native-firebase/firestore';
import questionsData from '../assets/data/questions.json';

// This is a temporary admin screen for migrating data
// Remove this after migration is complete
export default function AdminMigrationScreen() {
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
  };

  const categories = [
    { id: 'traffic-rules', name: 'Trafikkregler', description: 'Lær om viktige trafikkregler', order: 1 },
    { id: 'speed-rules', name: 'Fartsregler', description: 'Forstå fartsgrenser og regler', order: 2 },
    { id: 'signs-signals', name: 'Skilt og signaler', description: 'Kjenn igjen alle trafikkskilt', order: 3 },
    { id: 'driving-behavior', name: 'Atferd i trafikken', description: 'Riktig oppførsel på veien', order: 4 },
    { id: 'vehicle-tech', name: 'Kjøretøyteknologi', description: 'Forstå din bil', order: 5 },
    { id: 'safety', name: 'Sikkerhet', description: 'Sikkerhetsutstyr og prosedyrer', order: 6 },
    { id: 'environment', name: 'Miljø', description: 'Miljøvennlig kjøring', order: 7 },
    { id: 'first-aid', name: 'Førstehjelp', description: 'Grunnleggende førstehjelp', order: 8 },
  ];

  const migrateData = async () => {
    if (!user) {
      addLog('Error: User not authenticated');
      return;
    }

    setMigrating(true);
    addLog('Starting migration...');

    try {
      const questions = questionsData.questions;
      addLog(`Found ${questions.length} questions to migrate`);

      // Batch operations
      const batch = firestore().batch();
      
      // Migrate categories
      addLog('Migrating categories...');
      const categoryCount: Record<string, number> = {};
      
      for (const category of categories) {
        categoryCount[category.id] = 0;
        const categoryRef = firestore().collection('categories').doc(category.id);
        batch.set(categoryRef, {
          ...category,
          questionCount: 0,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      // Map category names to IDs
      const categoryMap: Record<string, string> = {
        'Trafikkregler': 'traffic-rules',
        'Fartsregler': 'speed-rules',
        'Skilt og signaler': 'signs-signals',
        'Atferd i trafikken': 'driving-behavior',
        'Kjøretøyteknologi': 'vehicle-tech',
        'Sikkerhet': 'safety',
        'Miljø': 'environment',
        'Førstehjelp': 'first-aid',
        'Lysbruk': 'traffic-rules',
        'Trafikklys': 'signs-signals',
        'Bremselengde': 'driving-behavior',
        'Vikeplikt': 'traffic-rules',
        'Promille': 'traffic-rules',
      };

      // Migrate questions
      addLog('Migrating questions...');
      questions.forEach((question: any, index: number) => {
        const categoryId = categoryMap[question.category] || 'traffic-rules';
        categoryCount[categoryId]++;
        
        const questionRef = firestore().collection('questions').doc(`question-${index + 1}`);
        const questionData: any = {
          id: `question-${index + 1}`,
          text: question.question || question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          category: categoryId,
          difficulty: question.difficulty || 'medium',
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        
        if (question.signId) questionData.signId = question.signId;
        if (question.imageUrl) questionData.imageUrl = question.imageUrl;
        if (question.signImageUrl) questionData.signImageUrl = question.signImageUrl;
        
        batch.set(questionRef, questionData);
      });

      // Commit the batch
      await batch.commit();
      addLog('Questions migrated successfully!');

      // Update category counts
      addLog('Updating category counts...');
      for (const [categoryId, count] of Object.entries(categoryCount)) {
        await firestore().collection('categories').doc(categoryId).update({
          questionCount: count
        });
      }

      addLog('Migration completed successfully!');
      addLog(`Total questions: ${questions.length}`);
      
      for (const [categoryId, count] of Object.entries(categoryCount)) {
        const category = categories.find(c => c.id === categoryId);
        addLog(`${category?.name}: ${count} questions`);
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      console.error('Migration error:', error);
    } finally {
      setMigrating(false);
    }
  };

  // For development/migration purposes, allow any authenticated user
  // In production, you should check for specific admin emails
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Please log in to access migration tool.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Admin Migration Tool</Text>
        
        <TouchableOpacity
          style={[styles.button, migrating && styles.buttonDisabled]}
          onPress={migrateData}
          disabled={migrating}
        >
          {migrating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Start Migration</Text>
          )}
        </TouchableOpacity>

        <View style={styles.logContainer}>
          {log.map((entry, index) => (
            <Text key={index} style={styles.logEntry}>{entry}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    minHeight: 200,
  },
  logEntry: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
  error: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});