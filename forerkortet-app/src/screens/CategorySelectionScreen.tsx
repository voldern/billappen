import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Category } from "../types";
import { theme } from "../constants/theme";
import { Card } from "../components/Card";
import Animated, { FadeInDown } from "react-native-reanimated";
import firebaseQuestionService from "../services/firebaseQuestionService";
import { useAuthGuard } from "../hooks/useAuthGuard";

type CategorySelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CategorySelection"
>;

interface Props {
  navigation: CategorySelectionScreenNavigationProp;
}

interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
  description: string;
}

// Category metadata with icons and descriptions
const categoryMetadata: Record<string, CategoryInfo> = {
  Fartsregler: {
    name: "Fartsregler",
    icon: "speedometer-outline",
    color: theme.colors.primary[600],
    description: "Fartsgrenser og hastighetskontroll",
  },
  Vikeplikt: {
    name: "Vikeplikt",
    icon: "stop-outline",
    color: theme.colors.semantic.error.main,
    description: "Vikepliktsregler og forkjørsrett",
  },
  Trafikklys: {
    name: "Trafikklys",
    icon: "traffic-cone-outline",
    color: theme.colors.semantic.warning.main,
    description: "Trafikklyssignaler og reguleringer",
  },
  Lysbruk: {
    name: "Lysbruk",
    icon: "bulb-outline",
    color: theme.colors.accent.main,
    description: "Bruk av lys på kjøretøy",
  },
  Avstand: {
    name: "Avstand",
    icon: "resize-outline",
    color: theme.colors.purple[600],
    description: "Følgeavstand og sikkerhetsmarginer",
  },
  Bremselengde: {
    name: "Bremselengde",
    icon: "hand-left-outline",
    color: theme.colors.semantic.error.dark,
    description: "Beregning av bremselengde",
  },
  Promille: {
    name: "Promille",
    icon: "wine-outline",
    color: theme.colors.semantic.error.light,
    description: "Alkoholgrenser og regler",
  },
  Ulykker: {
    name: "Ulykker",
    icon: "medical-outline",
    color: theme.colors.semantic.info.main,
    description: "Ulykkessituasjoner og førstehjælp",
  },
  "EU-kontroll": {
    name: "EU-kontroll",
    icon: "document-text-outline",
    color: theme.colors.neutral[600],
    description: "EU-kontroll og periodisk kontroll",
  },
};

export default function CategorySelectionScreen({ navigation }: Props) {
  const { user, loading: authLoading } = useAuthGuard();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await firebaseQuestionService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    navigation.push("NewTest", {
      selectedCategory: category.id,
      categoryName: category.name,
    });
  };

  const handleAllCategories = () => {
    navigation.push("NewTest", {
      selectedCategory: undefined,
      categoryName: "Alle kategorier",
    });
  };

  const renderCategoryCard = (category: Category, index: number) => {
    const metadata = categoryMetadata[category.name] || {
      name: category.name,
      icon: "help-outline",
      color: theme.colors.neutral[500],
      description:
        category.description || "Spørsmål om " + category.name.toLowerCase(),
    };

    return (
      <Animated.View
        key={category.id}
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.categoryCardWrapper}
      >
        <TouchableOpacity
          onPress={() => handleCategorySelect(category)}
          activeOpacity={0.8}
          style={styles.categoryTouchable}
        >
          <LinearGradient
            colors={[
              theme.colors.background.primary,
              theme.colors.background.elevated,
            ]}
            style={styles.categoryCard}
          >
            <View style={styles.categoryContent}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: metadata.color + "15" },
                ]}
              >
                <Ionicons
                  name={metadata.icon as any}
                  size={28}
                  color={metadata.color}
                />
              </View>
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>{metadata.name}</Text>
                <Text style={styles.categoryDescription}>
                  {metadata.description}
                </Text>
              </View>
              <View style={styles.categoryArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={metadata.color}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={theme.colors.background.gradient.background}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Velg kategori</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(
                insets.bottom + theme.spacing["2xl"],
                theme.spacing["3xl"]
              ),
            },
          ]}
        >
          {/* All Categories Option */}
          <Animated.View
            entering={FadeInDown.delay(50).springify()}
            style={styles.allCategoriesWrapper}
          >
            <TouchableOpacity
              onPress={handleAllCategories}
              activeOpacity={0.8}
              style={styles.allCategoriesTouchable}
            >
              <LinearGradient
                colors={[theme.colors.primary[400], theme.colors.primary[600]]}
                style={styles.allCategoriesCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.allCategoriesContent}>
                  <View style={styles.allCategoriesIcon}>
                    <Ionicons
                      name="apps"
                      size={28}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                  <View style={styles.allCategoriesText}>
                    <Text style={styles.allCategoriesTitle}>
                      Alle kategorier
                    </Text>
                    <Text style={styles.allCategoriesDescription}>
                      Øv deg på spørsmål fra alle kategorier
                    </Text>
                  </View>
                  <View style={styles.allCategoriesArrow}>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={theme.colors.text.inverse}
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Spesifikke kategorier</Text>

          {/* Categories List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary[600]}
              />
              <Text style={styles.loadingText}>Laster kategorier...</Text>
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {categories.map((category, index) =>
                renderCategoryCard(category, index)
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  allCategoriesWrapper: {
    marginBottom: theme.spacing["2xl"],
  },
  allCategoriesTouchable: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  allCategoriesCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  allCategoriesContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  allCategoriesIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.lg,
  },
  allCategoriesText: {
    flex: 1,
  },
  allCategoriesTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
  },
  allCategoriesDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    lineHeight: theme.typography.fontSize.base * 1.3,
  },
  allCategoriesArrow: {
    marginLeft: theme.spacing.md,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing["3xl"],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  categoriesContainer: {
    gap: theme.spacing.lg,
  },
  categoryCardWrapper: {
    marginBottom: theme.spacing.xs,
  },
  categoryTouchable: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  categoryCard: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.lg,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  categoryArrow: {
    marginLeft: theme.spacing.md,
    opacity: 0.7,
  },
});
