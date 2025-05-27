import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { premiumTheme as theme } from "../constants/premiumTheme";
import { TestResult } from "../types";

const { width } = Dimensions.get("window");

interface ProgressChartProps {
  results: TestResult[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ results }) => {
  // Prepare data for the chart
  const prepareChartData = () => {
    if (!results || results.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [0] }],
      };
    }

    // Take last 7 results for the chart
    const recentResults = results.slice(-7);
    
    const labels = recentResults.map((_, index) => {
      if (index === 0) return "Første";
      if (index === recentResults.length - 1) return "Siste";
      return `Test ${index + 1}`;
    });

    const scores = recentResults.map(
      (result) => Math.round((result.score / result.totalQuestions) * 100)
    );

    return {
      labels,
      datasets: [
        {
          data: scores,
          color: (opacity = 1) => theme.colors.primary[600],
          strokeWidth: 3,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  if (results.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fremgang Over Tid</Text>
      <LineChart
        data={chartData}
        width={width - theme.spacing.lg * 2}
        height={220}
        yAxisLabel=""
        yAxisSuffix="%"
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: theme.colors.background.primary,
          backgroundGradientFrom: theme.colors.background.primary,
          backgroundGradientTo: theme.colors.background.primary,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.colors.primary[600],
          labelColor: (opacity = 1) => theme.colors.text.secondary,
          style: {
            borderRadius: theme.borderRadius.lg,
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: theme.colors.primary[600],
            fill: theme.colors.background.primary,
          },
          propsForBackgroundLines: {
            strokeDasharray: "5, 5",
            stroke: theme.colors.neutral[200],
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        fromZero
        withInnerLines
        withOuterLines={false}
        withHorizontalLabels
        withVerticalLabels
        segments={4}
      />
      {results.length >= 2 && (
        <View style={styles.trendContainer}>
          <Text style={styles.trendText}>
            {getTrendAnalysis(results)}
          </Text>
        </View>
      )}
    </View>
  );
};

const getTrendAnalysis = (results: TestResult[]): string => {
  if (results.length < 2) return "";
  
  const recent = results.slice(-3);
  const recentScores = recent.map((r) => (r.score / r.totalQuestions) * 100);
  const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  
  const older = results.slice(-6, -3);
  if (older.length === 0) return "Fortsett å øve for å se fremgang! 📈";
  
  const olderScores = older.map((r) => (r.score / r.totalQuestions) * 100);
  const avgOlder = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
  
  const improvement = avgRecent - avgOlder;
  
  if (improvement > 10) {
    return "Fantastisk fremgang! Du forbedrer deg raskt! 🚀";
  } else if (improvement > 5) {
    return "Bra fremgang! Fortsett slik! 📈";
  } else if (improvement > 0) {
    return "Jevn fremgang. Du er på rett vei! 👍";
  } else if (improvement < -5) {
    return "Ikke gi opp! Øvelse gjør mester! 💪";
  } else {
    return "Stabil prestasjon. Prøv nye kategorier! 🎯";
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  trendContainer: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  trendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    fontWeight: "600",
    textAlign: "center",
  },
});