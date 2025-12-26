/**
 * Mood & Journal Types
 */

export type MoodType =
  | "energized" // High energy, ready to tackle anything
  | "focused" // Calm, concentrated
  | "creative" // Inspired, idea-flowing
  | "tired" // Low energy, need breaks
  | "stressed" // Anxious, overwhelmed
  | "neutral"; // Normal, balanced

export type EnergyLevel = 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very high

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodType;
  energyLevel: EnergyLevel;
  note?: string;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  mood?: MoodType;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mood Configuration
 * Different moods suggest different work patterns
 */
export interface MoodConfig {
  mood: MoodType;
  icon: string;
  color: string;
  label: string;
  description: string;
  // Suggested timer settings
  suggestedWorkDuration: number; // minutes
  suggestedBreakDuration: number; // minutes
  suggestedSessionsBeforeBreak: number;
  // UI effects
  auraColor: string; // CSS color for app aura
  motivationalQuote: string;
  backgroundSuggestion?: string;
  musicSuggestion?: string;
}

/**
 * Productivity Insights
 * Based on mood patterns
 */
export interface ProductivityInsight {
  date: Date;
  mood: MoodType;
  energyLevel: EnergyLevel;
  totalFocusTime: number; // minutes
  completedSessions: number;
  tasksCompleted: number;
  mostProductiveTime?: "morning" | "afternoon" | "evening" | "night";
}

/**
 * Smart Suggestions
 * AI-powered recommendations based on mood history
 */
export interface SmartSuggestion {
  type: "timer" | "break" | "task" | "motivation";
  title: string;
  description: string;
  action?: {
    type: "apply_timer_preset" | "take_break" | "switch_task";
    data?: any;
  };
  reason: string; // Why this suggestion?
}

/**
 * Mood Presets
 */
export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  energized: {
    mood: "energized",
    icon: "⚡",
    color: "#EAB308", // yellow-500
    label: "Energized",
    description: "High energy, ready to conquer!",
    suggestedWorkDuration: 50,
    suggestedBreakDuration: 10,
    suggestedSessionsBeforeBreak: 3,
    auraColor: "rgba(234, 179, 8, 0.2)",
    motivationalQuote:
      "Your energy is unstoppable! Let's crush those goals! 💪",
    musicSuggestion: "Upbeat, fast-paced music",
  },
  focused: {
    mood: "focused",
    icon: "🎯",
    color: "#3B82F6", // blue-500
    label: "Focused",
    description: "Deep work mode activated",
    suggestedWorkDuration: 45,
    suggestedBreakDuration: 15,
    suggestedSessionsBeforeBreak: 4,
    auraColor: "rgba(59, 130, 246, 0.2)",
    motivationalQuote: "You're in the zone. Stay focused, stay brilliant. 🎯",
    musicSuggestion: "Lo-fi, ambient music",
  },
  creative: {
    mood: "creative",
    icon: "🎨",
    color: "#A855F7", // purple-500
    label: "Creative",
    description: "Ideas are flowing!",
    suggestedWorkDuration: 60,
    suggestedBreakDuration: 20,
    suggestedSessionsBeforeBreak: 2,
    auraColor: "rgba(168, 85, 247, 0.2)",
    motivationalQuote:
      "Your creativity knows no bounds! Create something amazing. ✨",
    musicSuggestion: "Instrumental, inspiring music",
  },
  tired: {
    mood: "tired",
    icon: "😴",
    color: "#6B7280", // gray-500
    label: "Tired",
    description: "Low energy, take it easy",
    suggestedWorkDuration: 25,
    suggestedBreakDuration: 10,
    suggestedSessionsBeforeBreak: 2,
    auraColor: "rgba(107, 114, 128, 0.15)",
    motivationalQuote:
      "Be gentle with yourself. Small progress is still progress. 🌙",
    musicSuggestion: "Gentle, calming music",
  },
  stressed: {
    mood: "stressed",
    icon: "😰",
    color: "#EF4444", // red-500
    label: "Stressed",
    description: "Take a breath, you got this",
    suggestedWorkDuration: 20,
    suggestedBreakDuration: 10,
    suggestedSessionsBeforeBreak: 2,
    auraColor: "rgba(239, 68, 68, 0.15)",
    motivationalQuote: "Breathe. One step at a time. You're doing great. 🌸",
    musicSuggestion: "Nature sounds, meditation music",
  },
  neutral: {
    mood: "neutral",
    icon: "😊",
    color: "#10B981", // green-500
    label: "Neutral",
    description: "Balanced and steady",
    suggestedWorkDuration: 25,
    suggestedBreakDuration: 5,
    suggestedSessionsBeforeBreak: 4,
    auraColor: "rgba(16, 185, 129, 0.2)",
    motivationalQuote: "Steady progress wins the race. Keep going! 🌟",
    musicSuggestion: "Your usual favorites",
  },
};

/**
 * Get smart suggestions based on current mood and time
 */
export function getSmartSuggestions(
  mood: MoodType,
  energyLevel: EnergyLevel,
  currentHour: number,
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const config = MOOD_CONFIGS[mood];

  // Timer suggestions
  if (mood === "tired" && energyLevel <= 2) {
    suggestions.push({
      type: "timer",
      title: "Shorter Focus Sessions",
      description: `Try ${config.suggestedWorkDuration} min work / ${config.suggestedBreakDuration} min break`,
      action: {
        type: "apply_timer_preset",
        data: {
          workDuration: config.suggestedWorkDuration,
          breakDuration: config.suggestedBreakDuration,
        },
      },
      reason: "Your energy is low. Shorter sessions prevent burnout.",
    });
  }

  if (mood === "energized" && energyLevel >= 4) {
    suggestions.push({
      type: "timer",
      title: "Extended Focus Time",
      description: `Try ${config.suggestedWorkDuration} min sessions to match your energy!`,
      action: {
        type: "apply_timer_preset",
        data: {
          workDuration: config.suggestedWorkDuration,
          breakDuration: config.suggestedBreakDuration,
        },
      },
      reason: "Your energy is high! Take advantage of it.",
    });
  }

  if (mood === "stressed") {
    suggestions.push({
      type: "break",
      title: "Take a Mindful Break",
      description: "5 minutes of deep breathing or meditation",
      reason: "Stress reduces productivity. Reset your mind first.",
    });
  }

  // Time-based suggestions
  if (currentHour >= 22 || currentHour <= 6) {
    suggestions.push({
      type: "motivation",
      title: "Late Night Session",
      description:
        "Consider resting. Your brain needs sleep to consolidate learning.",
      reason: "Working late reduces next-day productivity by 25%.",
    });
  }

  if (currentHour >= 14 && currentHour <= 16 && energyLevel <= 3) {
    suggestions.push({
      type: "break",
      title: "Post-Lunch Energy Dip",
      description: "Take a 20-min power nap or short walk",
      reason:
        "This is a natural energy low. A break will help more than pushing through.",
    });
  }

  return suggestions;
}
