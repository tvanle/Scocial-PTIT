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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { DATING_SPACING } from '../../../../../constants/dating/tokens';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

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
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customQuestion, setCustomQuestion] = useState('');

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

    const handleCustomQuestion = useCallback(() => {
      if (!customQuestion.trim() || pickerIndex === null) return;
      const next = [...prompts];
      if (pickerIndex < next.length) {
        next[pickerIndex] = { ...next[pickerIndex], question: customQuestion.trim() };
      } else {
        next.push({ question: customQuestion.trim(), answer: '' });
      }
      onChange(next);
      setCustomQuestion('');
      setShowCustomInput(false);
      setPickerIndex(null);
    }, [customQuestion, pickerIndex, prompts, onChange]);

    const handleCloseModal = useCallback(() => {
      setPickerIndex(null);
      setShowCustomInput(false);
      setCustomQuestion('');
    }, []);

    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <MaterialIcons name="chat-bubble-outline" size={20} color={BRAND.primary} />
            <Text style={styles.sectionTitle}>Conversation Starters</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{prompts.length}/{MAX_PROMPTS}</Text>
          </View>
        </View>
        <Text style={styles.sectionHint}>
          Add prompts to help others start a conversation with you
        </Text>

        {prompts.map((prompt, index) => (
          <View key={`prompt-${index}`} style={styles.promptCard}>
            <View style={styles.questionRow}>
              <TouchableOpacity
                style={styles.questionBtn}
                onPress={() => setPickerIndex(index)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="format-quote" size={18} color={BRAND.primary} />
                <Text style={styles.questionText} numberOfLines={2}>
                  {prompt.question || 'Select a prompt...'}
                </Text>
                <MaterialIcons name="expand-more" size={20} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemove(index)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <MaterialIcons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.answerInput}
              value={prompt.answer}
              onChangeText={(text) => handleAnswerChange(index, text)}
              placeholder="Write your answer here..."
              placeholderTextColor="#999"
              multiline
              maxLength={200}
            />
            <View style={styles.charCounter}>
              <Text style={styles.charCountText}>{prompt.answer.length}/200</Text>
            </View>
          </View>
        ))}

        {prompts.length < MAX_PROMPTS && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setPickerIndex(prompts.length)}
            activeOpacity={0.7}
          >
            <View style={styles.addIconWrap}>
              <MaterialIcons name="add" size={20} color={BRAND.primary} />
            </View>
            <Text style={styles.addBtnText}>Add a prompt</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={pickerIndex !== null}
          transparent
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showCustomInput ? 'Viết câu hỏi của bạn' : 'Chọn câu hỏi'}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {showCustomInput ? (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customInput}
                    value={customQuestion}
                    onChangeText={setCustomQuestion}
                    placeholder="Nhập câu hỏi của bạn..."
                    placeholderTextColor="#999"
                    maxLength={100}
                    autoFocus
                  />
                  <View style={styles.customInputActions}>
                    <TouchableOpacity
                      style={styles.customBackBtn}
                      onPress={() => setShowCustomInput(false)}
                    >
                      <Text style={styles.customBackBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.customSubmitBtn,
                        !customQuestion.trim() && styles.customSubmitBtnDisabled,
                      ]}
                      onPress={handleCustomQuestion}
                      disabled={!customQuestion.trim()}
                    >
                      <Text style={styles.customSubmitBtnText}>Xác nhận</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <FlatList
                  data={availableQuestions}
                  keyExtractor={(item) => item}
                  ListHeaderComponent={
                    <TouchableOpacity
                      style={[styles.modalRow, styles.customOptionRow]}
                      onPress={() => setShowCustomInput(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.modalRowIcon, styles.customOptionIcon]}>
                        <MaterialIcons name="edit" size={16} color="#fff" />
                      </View>
                      <Text style={[styles.modalRowText, styles.customOptionText]}>
                        Tự viết câu hỏi của bạn...
                      </Text>
                    </TouchableOpacity>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalRow}
                      onPress={() => handleSelectQuestion(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalRowIcon}>
                        <MaterialIcons name="format-quote" size={16} color={BRAND.primary} />
                      </View>
                      <Text style={styles.modalRowText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                />
              )}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: BRAND.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.primary,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  questionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.primaryMuted,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.primary,
    lineHeight: 18,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerInput: {
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    lineHeight: 22,
  },
  charCounter: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  charCountText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: BRAND.primaryMuted,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND.primary,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modalRowText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    lineHeight: 22,
  },
  customOptionRow: {
    backgroundColor: BRAND.primaryMuted,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.primary,
  },
  customOptionIcon: {
    backgroundColor: BRAND.primary,
  },
  customOptionText: {
    color: BRAND.primary,
    fontWeight: '700',
  },
  customInputContainer: {
    padding: 20,
  },
  customInput: {
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 50,
  },
  customInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  customBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  customBackBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  customSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BRAND.primary,
  },
  customSubmitBtnDisabled: {
    opacity: 0.5,
  },
  customSubmitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
