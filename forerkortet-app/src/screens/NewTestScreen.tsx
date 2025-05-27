import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import { RootStackParamList } from "../types";
import { AppDispatch } from "../store";
import { startTest } from "../store/testSlice";
import supabaseQuestionService from "../services/supabaseQuestionService";

type NewTestScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "NewTest"
>;

interface Props {
  navigation: NewTestScreenNavigationProp;
}

export default function NewTestScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = React.useState(false);

  const startQuickTest = async () => {
    try {
      setLoading(true);
      const selectedQuestions =
        await supabaseQuestionService.getRandomQuestions(10);

      if (selectedQuestions.length === 0) {
        Alert.alert(
          "Feil",
          "Kunne ikke laste spørsmål. Sjekk internettforbindelsen."
        );
        return;
      }

      dispatch(startTest(selectedQuestions));
      navigation.navigate("Question");
    } catch (error) {
      console.error("Error starting quick test:", error);
      Alert.alert("Feil", "Kunne ikke starte test. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  const startFullTest = async () => {
    try {
      setLoading(true);
      const allQuestions = await supabaseQuestionService.getAllQuestions();

      if (allQuestions.length === 0) {
        Alert.alert(
          "Feil",
          "Kunne ikke laste spørsmål. Sjekk internettforbindelsen."
        );
        return;
      }

      // Shuffle questions for the full test
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

      dispatch(startTest(shuffled));
      navigation.navigate("Question");
    } catch (error) {
      console.error("Error starting full test:", error);
      Alert.alert("Feil", "Kunne ikke starte test. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Laster spørsmål...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Velg testtype</Text>

        <TouchableOpacity style={styles.testOption} onPress={startQuickTest}>
          <View style={styles.testHeader}>
            <Text style={styles.testTitle}>Hurtigtest</Text>
            <Text style={styles.testBadge}>10 spørsmål</Text>
          </View>
          <Text style={styles.testDescription}>
            Perfekt for en rask øvingsøkt. Test dine kunnskaper med 10 tilfeldig
            valgte spørsmål.
          </Text>
          <View style={styles.testInfo}>
            <Text style={styles.testInfoText}>⏱ Ca. 5 minutter</Text>
            <Text style={styles.testInfoText}>📊 Rask tilbakemelding</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testOption} onPress={startFullTest}>
          <View style={styles.testHeader}>
            <Text style={styles.testTitle}>Full test</Text>
            <Text style={styles.testBadge}>Alle spørsmål</Text>
          </View>
          <Text style={styles.testDescription}>
            Omfattende test som dekker alle tilgjengelige spørsmål. Få en
            grundig vurdering av dine kunnskaper.
          </Text>
          <View style={styles.testInfo}>
            <Text style={styles.testInfoText}>⏱ Ca. 15-20 minutter</Text>
            <Text style={styles.testInfoText}>📊 Detaljert analyse</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips før du starter:</Text>
          <Text style={styles.tipText}>• Les hvert spørsmål nøye</Text>
          <Text style={styles.tipText}>• Ta deg god tid til å tenke</Text>
          <Text style={styles.tipText}>
            • Du kan ikke gå tilbake til tidligere spørsmål
          </Text>
          <Text style={styles.tipText}>• Fokuser og unngå distraksjoner</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 24,
  },
  testOption: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  testTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  testBadge: {
    backgroundColor: "#dbeafe",
    color: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  testDescription: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 22,
  },
  testInfo: {
    flexDirection: "row",
    gap: 20,
  },
  testInfoText: {
    fontSize: 14,
    color: "#6b7280",
  },
  tips: {
    marginTop: 32,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#92400e",
    marginBottom: 6,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 20,
  },
});
