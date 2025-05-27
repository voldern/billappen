import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList, TestResult } from '../types';
import { RootState, AppDispatch } from '../store';
import { setResults } from '../store/resultsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ResultsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResultsList'>;

interface Props {
  navigation: ResultsListScreenNavigationProp;
}

export default function ResultsListScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const results = useSelector((state: RootState) => state.results.results);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const savedResults = await AsyncStorage.getItem('testResults');
      if (savedResults) {
        dispatch(setResults(JSON.parse(savedResults)));
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const renderResult = ({ item }: { item: TestResult }) => {
    const percentage = Math.round((item.score / item.totalQuestions) * 100);
    const scoreColor = getScoreColor(item.score, item.totalQuestions);

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => navigation.navigate('TestResults', { testId: item.id })}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultDate}>{formatDate(item.date)}</Text>
          <Text style={styles.resultDuration}>{formatDuration(item.duration)}</Text>
        </View>
        <View style={styles.resultScore}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {item.score}/{item.totalQuestions}
          </Text>
          <Text style={[styles.percentageText, { color: scoreColor }]}>
            {percentage}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ingen testresultater ennå</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('NewTest')}
          >
            <Text style={styles.startButtonText}>Start din første test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContainer: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});