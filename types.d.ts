import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";

export interface YdbChatMessageHistoryFields {
  sessionId: string;
  readOnly?: boolean;
  database?: string;
  table_name?: string;
}

export declare class YdbChatMessageHistory extends BaseListChatMessageHistory {
  client: any;
  sessionId: string;
  readOnly: boolean;

  constructor(fields: YdbChatMessageHistoryFields);

  /**
   * Retrieves the chat messages from the YDB database.
   * @returns An array of BaseMessage instances representing the chat history.
   */
  getMessages(): Promise<BaseMessage[]>;

  /**
   * Adds a new message to the chat history in the YDB database.
   * @param message The message to be added to the chat history.
   */
  addMessage(message: BaseMessage): Promise<void>;

  /**
   * Adds multiple messages to the chat history in the YDB database.
   * @param messages The messages to be added to the chat history.
   */
  addMessages(messages: BaseMessage[]): Promise<void>;

  /**
   * Deletes all messages from the chat history in the YDB database.
   */
  clear(): Promise<void>;

  /**
   * Creates a backup of the current chat history.
   */
  backup(): Promise<void>;

  /**
   * Restores chat history from backup.
   */
  restore(): Promise<void>;
} 