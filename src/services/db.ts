// src/services/db.ts
import Dexie, { type Table } from 'dexie';
import type { ConversationItem, MessageItem } from '../types/chat';

export class MessengerDB extends Dexie {
  conversations!: Table<ConversationItem, string | number>;
  messages!: Table<MessageItem, string | number>;

  constructor() {
    super('MessengerDB');
    
    // Define schema: the first value is the Primary Key.
    // We also index other fields we might want to query by later.
    this.version(1).stores({
      conversations: 'id, lastMessageTime, type',
      messages: 'id, conversationId, timestamp'
    });
  }
}

export const db = new MessengerDB();
