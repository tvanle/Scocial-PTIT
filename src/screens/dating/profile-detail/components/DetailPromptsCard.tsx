import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.campus;

interface Prompt {
  question: string;
  answer: string;
}

interface DetailPromptsCardProps {
  prompts?: Prompt[];
}

export const DetailPromptsCard = React.memo<DetailPromptsCardProps>(({ prompts }) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <View style={styles.container}>
      {prompts.map((prompt, index) => (
        <View
          key={`${prompt.question}-${index}`}
          style={[
            styles.card,
            { borderRadius: layout.radius, padding: layout.padding },
          ]}
        >
          <View style={styles.questionRow}>
            <MaterialIcons name="format-quote" size={18} color={DATING_COLORS.primary} />
            <Text style={styles.question}>{prompt.question}</Text>
          </View>
          <Text style={styles.answer}>{prompt.answer}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.campusBg,
    borderWidth: 1,
    borderColor: colors.campusBorder,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: DATING_COLORS.primary,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.bioText,
  },
});
