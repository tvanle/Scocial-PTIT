import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { DATING_SPACING } from '../../../../../constants/dating/tokens';

const colors = DATING_COLORS.profileSetup;
const promptStrings = DATING_STRINGS.prompts;

export interface PromptValue {
  question: string;
  answer: string;
}

interface ProfileSetupPromptsSectionProps {
  prompts: PromptValue[];
  onChange: (prompts: PromptValue[]) => void;
}

const MAX_PROMPTS = 3;

export const ProfileSetupPromptsSection = React.memo<ProfileSetupPromptsSectionProps>(
  ({ prompts, onChange }) => {
    const [pickerIndex, setPickerIndex] = useState<number | null>(null);

    const usedQuestions = prompts.map((p) => p.question);
    const availableQuestions = promptStrings.questions.filter(
      (q) => !usedQuestions.includes(q),
    );

    const handleSelectQuestion = useCallback(
      (question: string) => {
        if (pickerIndex === null) return;
        const next = [...prompts];
        if (pickerIndex < next.length) {
          next[pickerIndex] = { ...next[pickerIndex], question };
        } else {
          next.push({ question, answer: '' });
        }
        onChange(next);
        setPickerIndex(null);
      },
      [pickerIndex, prompts, onChange],
    );

    const handleAnswerChange = useCallback(
      (index: number, answer: string) => {
        const next = [...prompts];
        next[index] = { ...next[index], answer };
        onChange(next);
      },
      [prompts, onChange],
    );

    const handleRemove = useCallback(
      (index: number) => {
        const next = prompts.filter((_, i) => i !== index);
        onChange(next);
      },
      [prompts, onChange],
    );

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{promptStrings.sectionTitle}</Text>
        <Text style={styles.sectionHint}>{promptStrings.sectionHint}</Text>

        {prompts.map((prompt, index) => (
          <View key={`prompt-${index}`} style={styles.promptCard}>
            <View style={styles.questionRow}>
              <TouchableOpacity
                style={styles.questionBtn}
                onPress={() => setPickerIndex(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.questionText} numberOfLines={1}>
                  {prompt.question || promptStrings.selectQuestion}
                </Text>
                <MaterialIcons name="expand-more" size={20} color={colors.sectionHint} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemove(index)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.sectionHint} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.answerInput}
              value={prompt.answer}
              onChangeText={(text) => handleAnswerChange(index, text)}
              placeholder={promptStrings.answerPlaceholder}
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              maxLength={200}
            />
          </View>
        ))}

        {prompts.length < MAX_PROMPTS && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setPickerIndex(prompts.length)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add" size={20} color={DATING_COLORS.primary} />
            <Text style={styles.addBtnText}>Thêm câu hỏi</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={pickerIndex !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerIndex(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setPickerIndex(null)}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>{promptStrings.selectQuestion}</Text>
              <FlatList
                data={availableQuestions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalRow}
                    onPress={() => handleSelectQuestion(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalRowText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  section: {
    gap: DATING_SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.sectionTitle,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.sectionHint,
    lineHeight: 18,
  },
  promptCard: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: DATING_SPACING.md,
    gap: DATING_SPACING.sm,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DATING_SPACING.sm,
  },
  questionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: DATING_COLORS.primary,
  },
  answerInput: {
    fontSize: 14,
    color: colors.sectionTitle,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: DATING_SPACING.sm,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: DATING_COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingTop: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.xxl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.sectionTitle,
    paddingHorizontal: DATING_SPACING.lg,
    marginBottom: DATING_SPACING.md,
  },
  modalRow: {
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.md,
  },
  modalRowText: {
    fontSize: 15,
    color: colors.sectionTitle,
  },
});
