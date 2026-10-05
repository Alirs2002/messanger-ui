// src/services/db.ts
import Dexie, { type Table } from 'dexie';
import type { ConversationItem } from '../types/chat';
import type { Message } from '../types/messenger';

// 1. Define what the cache actually holds: the raw API Message + conversationId
export interface CachedMessage extends Message {
  conversationId: string;
}

export class MessengerDB extends Dexie {
  conversations!: Table<ConversationItem, string | number>;
  
  // 2. Change the table type from MessageItem to CachedMessage
  messages!: Table<CachedMessage, string | number>;

  constructor() {
    super('MessengerDB');
    this.version(1).stores({
      conversations: 'id, lastMessageTime, type',
      // We index conversationId so we can quickly load a specific chat's history
      messages: 'id, conversationId, timestamp' 
    });
  }
}

export const db = new MessengerDB();
