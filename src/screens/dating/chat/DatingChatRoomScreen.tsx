import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS } from '../../../constants/dating/theme';
import datingChatService from '../../../services/dating/datingChatService';
import datingService from '../../../services/dating/datingService';
import socketService from '../../../services/socket/socketService';
import { useAuthStore } from '../../../store/slices/authSlice';
import type { RootStackParamList } from '../../../types';
import type { DatingMessage } from '../../../types/dating';

type RouteParams = RouteProp<RootStackParamList, 'DatingChatRoom'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const P = DATING_COLORS.primary;
const { width: SW } = Dimensions.get('window');

// ─── Bubble ──────────────────────────────────────────────────────────
interface BubbleProps {
  message: DatingMessage;
  isMine: boolean;
  showAvatar: boolean;
  isLast: boolean;
}

const Bubble: React.FC<BubbleProps> = React.memo(({ message, isMine, showAvatar, isLast }) => {
  const time = new Date(message.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[s.row, isMine ? s.rowR : s.rowL, isLast ? s.rowGap : s.rowTight]}>
      {!isMine &&
        (showAvatar ? (
          message.sender?.avatar ? (
            <Image source={{ uri: message.sender.avatar }} style={s.ava} />
          ) : (
            <View style={[s.ava, s.avaFb]}>
              <Ionicons name="person" size={13} color="#ccc" />
            </View>
          )
        ) : (
          <View style={s.avaSpacer} />
        ))}

      <View style={{ maxWidth: '76%' }}>
        <View
          style={[
            s.bub,
            isMine ? s.bubM : s.bubO,
            isMine && isLast && s.bubMT,
            !isMine && isLast && s.bubOT,
          ]}
        >
          <Text style={[s.bubTxt, isMine && s.bubTxtM]}>{message.content}</Text>
        </View>
        {isLast && (
          <Text style={[s.ts, isMine ? s.tsR : s.tsL]}>{time}</Text>
        )}
      </View>
    </View>
  );
});

// ─── Screen ──────────────────────────────────────────────────────────
const DatingChatRoomScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const qc = useQueryClient();
  const me = useAuthStore((st) => st.user);
  const listRef = useRef<FlatList>(null);
  const [txt, setTxt] = useState('');

  const { conversationId, otherUser } = route.params;
  const qk = ['dating', 'chat', 'messages', conversationId] as const;

  const { data, isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => datingChatService.getMessages(conversationId),
    enabled: !!conversationId,
  });
  const msgs = data?.messages ?? [];

  const enriched = useMemo(
    () =>
      msgs.map((m, i) => ({
        m,
        mine: m.senderId === me?.id,
        first: !msgs[i - 1] || msgs[i - 1].senderId !== m.senderId,
        last: !msgs[i + 1] || msgs[i + 1].senderId !== m.senderId,
      })),
    [msgs, me?.id],
  );

  useEffect(() => {
    const off = socketService.onNewMessage((inc: any) => {
      if (inc.conversationId !== conversationId || inc.senderId === me?.id) return;
      const nm: DatingMessage = {
        id: inc.id,
        content: inc.content,
        senderId: inc.senderId,
        createdAt: inc.createdAt,
        sender: inc.sender,
      };
      qc.setQueryData(qk, (old: any) => {
        const ex = old?.messages ?? [];
        if (ex.some((x: DatingMessage) => x.id === nm.id)) return old;
        return { ...old, messages: [...ex, nm] };
      });
      qc.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
    });
    return off;
  }, [conversationId, me?.id, qc]);

  const send = useMutation({
    mutationFn: (c: string) => datingChatService.sendMessage(conversationId, c),
    onMutate: async (c) => {
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData(qk);
      qc.setQueryData(qk, (old: any) => ({
        ...old,
        messages: [
          ...(old?.messages ?? []),
          {
            id: `t-${Date.now()}`,
            content: c,
            senderId: me?.id ?? '',
            createdAt: new Date().toISOString(),
            sender: { id: me?.id ?? '', fullName: me?.fullName ?? '', avatar: me?.avatar ?? null },
          },
        ],
      }));
      return { prev };
    },
    onError: (_e, _c, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk });
      qc.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
    },
  });

  const doSend = useCallback(() => {
    const t = txt.trim();
    if (!t || send.isPending) return;
    setTxt('');
    send.mutate(t);
  }, [txt, send]);

  const goProfile = useCallback(async () => {
    if (!otherUser?.id) return;
    try {
      const p = await datingService.getProfileByUserId(otherUser.id);
      nav.navigate('DatingProfileDetail', {
        profile: {
          userId: otherUser.id,
          bio: p.bio ?? '',
          photos: p.photos ?? [],
          prompts: p.prompts?.map((x: any) => ({ question: x.question, answer: x.answer })),
          user: {
            id: p.user?.id ?? otherUser.id,
            fullName: p.user?.fullName ?? otherUser.fullName,
            avatar: p.user?.avatar ?? otherUser.avatar,
            dateOfBirth: p.user?.dateOfBirth ?? '',
            gender: p.user?.gender ?? null,
          },
          lifestyle: p.lifestyle ?? null,
        } as any,
      });
    } catch {
      /* silent */
    }
  }, [nav, otherUser]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof enriched)[0] }) => (
      <Bubble message={item.m} isMine={item.mine} showAvatar={item.first} isLast={item.last} />
    ),
    [],
  );

  const empty = msgs.length === 0 && !isLoading;
  const name1 = otherUser?.fullName?.split(' ').pop() ?? 'bạn ấy';

  const icebreakers = useMemo(
    () => [
      `Chào ${name1}! 👋`,
      'Mình rất vui được match với bạn!',
      'Bạn đang học ngành gì vậy? 📚',
      'Cuối tuần này bạn có rảnh không? ☕',
    ],
    [name1],
  );

  return (
    <View style={s.wrap}>
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.hdr}>
          <TouchableOpacity style={s.hdrBack} onPress={() => nav.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={s.hdrMid} activeOpacity={0.7} onPress={goProfile}>
            <View style={s.hdrAvaWrap}>
              {otherUser?.avatar ? (
                <Image source={{ uri: otherUser.avatar }} style={s.hdrAva} />
              ) : (
                <View style={[s.hdrAva, s.hdrAvaFb]}>
                  <Ionicons name="person" size={18} color="#bbb" />
                </View>
              )}
              <View style={s.hdrDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.hdrName} numberOfLines={1}>
                {otherUser?.fullName ?? 'Người dùng'}
              </Text>
              <Text style={s.hdrSub}>Đang hoạt động</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.hdrAct} onPress={goProfile}>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <KeyboardAvoidingView
          style={s.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isLoading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={P} />
            </View>
          ) : empty ? (
            <View style={s.emWrap}>
              <TouchableOpacity activeOpacity={0.85} onPress={goProfile}>
                <View style={s.emAvaRing}>
                  {otherUser?.avatar ? (
                    <Image source={{ uri: otherUser.avatar }} style={s.emAva} />
                  ) : (
                    <View style={[s.emAva, s.emAvaFb]}>
                      <Ionicons name="person" size={40} color="#d1d5db" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View style={s.emMatchBadge}>
                <Ionicons name="heart" size={12} color="#fff" />
                <Text style={s.emMatchTxt}>Đã match</Text>
              </View>

              <Text style={s.emTitle}>Bắt đầu trò chuyện với {name1}</Text>
              <Text style={s.emSub}>
                Đừng ngại, hãy gửi lời chào đầu tiên nhé!
              </Text>

              <View style={s.emChips}>
                {icebreakers.map((ice) => (
                  <TouchableOpacity
                    key={ice}
                    style={s.chip}
                    activeOpacity={0.7}
                    onPress={() => setTxt(ice)}
                  >
                    <Text style={s.chipTxt}>{ice}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={enriched}
              keyExtractor={(i) => i.m.id}
              renderItem={renderItem}
              contentContainerStyle={s.msgList}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={s.chatTopBanner}>
                  <TouchableOpacity activeOpacity={0.85} onPress={goProfile}>
                    {otherUser?.avatar ? (
                      <Image source={{ uri: otherUser.avatar }} style={s.bannerAva} />
                    ) : (
                      <View style={[s.bannerAva, s.emAvaFb]}>
                        <Ionicons name="person" size={20} color="#ccc" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={s.bannerTxt}>
                    Bạn đã match với {otherUser?.fullName ?? 'người này'}
                  </Text>
                  <TouchableOpacity onPress={goProfile}>
                    <Text style={s.bannerLink}>Xem hồ sơ</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}

          {/* Input */}
          <View style={s.bar}>
            <View style={s.inputRow}>
              <TextInput
                style={s.inp}
                value={txt}
                onChangeText={setTxt}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#999"
                multiline
                maxLength={2000}
              />
              {txt.trim() ? (
                <TouchableOpacity
                  style={s.sendActive}
                  onPress={doSend}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={s.likeBtn}
                  onPress={() => setTxt('❤️')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart" size={20} color={P} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f5f5f7' },
  safe: { flex: 1 },

  // Header
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  hdrBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hdrMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 2 },
  hdrAvaWrap: { position: 'relative' },
  hdrAva: { width: 38, height: 38, borderRadius: 19 },
  hdrAvaFb: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  hdrDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#34d399',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hdrName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  hdrSub: { fontSize: 11, color: '#34d399', fontWeight: '500', marginTop: 1 },
  hdrAct: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Message list
  msgList: { paddingHorizontal: 12, paddingBottom: 8 },

  // Chat top banner
  chatTopBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  bannerAva: { width: 56, height: 56, borderRadius: 28, marginBottom: 10 },
  bannerTxt: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 4 },
  bannerLink: { fontSize: 13, color: P, fontWeight: '600' },

  // Bubble rows
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  rowL: { justifyContent: 'flex-start' },
  rowR: { justifyContent: 'flex-end' },
  rowGap: { marginBottom: 8 },
  rowTight: { marginBottom: 2 },

  ava: { width: 26, height: 26, borderRadius: 13, marginRight: 6 },
  avaFb: { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  avaSpacer: { width: 32 },

  // Bubbles
  bub: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22 },
  bubM: { backgroundColor: P },
  bubMT: { borderBottomRightRadius: 6 },
  bubO: { backgroundColor: '#fff' },
  bubOT: { borderBottomLeftRadius: 6 },
  bubTxt: { fontSize: 15, lineHeight: 21, color: '#1a1a1a' },
  bubTxtM: { color: '#fff' },

  ts: { fontSize: 10, color: '#aaa', marginTop: 3 },
  tsL: { marginLeft: 4 },
  tsR: { textAlign: 'right', marginRight: 4 },

  // Empty
  emWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emAvaRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: `${P}25`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emAva: { width: 94, height: 94, borderRadius: 47 },
  emAvaFb: { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  emMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  emMatchTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  emTitle: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 6 },
  emSub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  emChips: { width: '100%', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chipTxt: { fontSize: 14, color: '#444', textAlign: 'center' },

  // Input bar
  bar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    minHeight: 44,
    paddingLeft: 16,
    paddingRight: 5,
  },
  inp: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 100,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  sendActive: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: P,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DatingChatRoomScreen;
