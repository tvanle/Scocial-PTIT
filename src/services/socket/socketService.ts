import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../constants/api';

type MessageHandler = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) return;

    this.disconnect();
    this.userId = userId;

    this.socket = io(API_CONFIG.BASE_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join', userId);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  onNewMessage(handler: MessageHandler) {
    this.socket?.on('newMessage', handler);
    return () => {
      this.socket?.off('newMessage', handler);
    };
  }

  onTyping(handler: MessageHandler) {
    this.socket?.on('userTyping', handler);
    return () => {
      this.socket?.off('userTyping', handler);
    };
  }

  emitTyping(conversationId: string, userId: string) {
    this.socket?.emit('typing', { conversationId, userId });
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;
