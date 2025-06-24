const db = require("@dieugene/key-value-db");
const { BaseListChatMessageHistory } = require("@langchain/core/chat_history");
const {
    BaseMessage,
    StoredMessage,
    mapChatMessagesToStoredMessages,
    mapStoredMessagesToChatMessages
} = require("@langchain/core/messages");

/**
 * Функция логирования для отладки операций с YDB
 */
function debugLog(...args) {
    const logEnv = process.env.LOG || '';
    if (logEnv.includes('CHAT_HISTORY')) {
        const serializedArgs = args.map(arg => 
            typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        console.log(`[YDB-CHAT-HISTORY] ${serializedArgs}`);
    }
}

/**
 * Сделано на основе:
 * https://github.com/langchain-ai/langchainjs/blob/66569b3359c6734ba845be49837b29bd77edfe56/libs/langchain-community/src/stores/message/upstash_redis.ts#L25
 */

class YdbChatMessageHistory extends BaseListChatMessageHistory {
    client;
    sessionId = '';
    readOnly = false;

    constructor(fields) {
        super(fields);
        debugLog('Constructor called with fields:', fields);
        const { sessionId, readOnly, database, table_name } = fields;

        debugLog('Initializing client with params:', { table_name: table_name || 'chat_history_db', database: database || process.env.CHAT_HISTORY_DB_ADDRESS });
        this.client = db.init('CHAT_HISTORY', {
            table_name: table_name || 'chat_history_db',
            database: database || process.env.CHAT_HISTORY_DB_ADDRESS
        });
        debugLog('Client initialized successfully');
        
        this.sessionId = sessionId;
        if (typeof readOnly === 'boolean') this.readOnly = readOnly;
        debugLog('Constructor completed:', { sessionId: this.sessionId, readOnly: this.readOnly });
        
        this.getMessages.raw = async () => {
            debugLog('getMessages.raw called for sessionId:', this.sessionId);
            const result = await this.client.get(this.sessionId) ?? [];
            debugLog('getMessages.raw result:', result);
            return result;
        };
    }

    /**
     * Retrieves the chat messages from the YDB database.
     * @returns {Promise<BaseMessage[]>} An array of BaseMessage instances representing the chat history.
     */
    async getMessages() {
        debugLog('getMessages called for sessionId:', this.sessionId);
        let rawStoredMessages =
            await this.client.get(this.sessionId, []);
        debugLog('Raw stored messages from DB:', rawStoredMessages);
        
        if (!rawStoredMessages) rawStoredMessages = [];
        debugLog('Processed rawStoredMessages:', rawStoredMessages);
        
        const orderedMessages = rawStoredMessages.reverse();
        debugLog('Ordered messages after reverse:', orderedMessages);
        
        const previousMessages = orderedMessages.filter(
            x => x.type !== undefined && x.data.content !== undefined
        );
        debugLog('Filtered previousMessages:', previousMessages);
        
        const result = mapStoredMessagesToChatMessages(previousMessages);
        debugLog('Final mapped messages:', result);
        return result;
    }

    /**
     * Adds a new message to the chat history in the YDB database.
     * @param message {BaseMessage} The message to be added to the chat history.
     * @returns Promise resolving to void.
     */
    async addMessage(message) {
        debugLog('addMessage called:', { sessionId: this.sessionId, readOnly: this.readOnly, message });
        if (this.readOnly) {
            debugLog('addMessage skipped - readOnly mode');
            return;
        }
        
        const existingMessages = await this.getMessages();
        debugLog('Existing messages retrieved:', existingMessages);
        
        let messages = [...existingMessages, message].reverse();
        debugLog('Messages array after adding new message and reverse:', messages);
        
        const messagesToAdd = mapChatMessagesToStoredMessages(messages);
        debugLog('Messages mapped for storage:', messagesToAdd);
        
        await this.client.set(this.sessionId, messagesToAdd);
        debugLog('addMessage completed successfully');
    }

    async addMessages(messages = []) {
        debugLog('addMessages called:', { sessionId: this.sessionId, readOnly: this.readOnly, messages });
        if (this.readOnly) {
            debugLog('addMessages skipped - readOnly mode');
            return;
        }
        
        const existingMessages = await this.getMessages();
        debugLog('Existing messages retrieved for addMessages:', existingMessages);
        
        messages = [ ...existingMessages, ...messages ].reverse();
        debugLog('Messages array after adding multiple messages and reverse:', messages);
        
        const messagesToAdd = mapChatMessagesToStoredMessages(messages);
        debugLog('Multiple messages mapped for storage:', messagesToAdd);
        
        await this.client.set(this.sessionId, messagesToAdd);
        debugLog('addMessages completed successfully');
    }

    /**
     * Deletes all messages from the chat history in the Redis database.
     * @returns Promise resolving to void.
     */
    async clear() {
        debugLog('clear called for sessionId:', this.sessionId);
        await this.client.del(this.sessionId);
        debugLog('clear completed successfully');
    }

    async backup() {
        debugLog('backup called for sessionId:', this.sessionId);
        await this.client.copy(this.sessionId, this.sessionId + '::backup', []);
        debugLog('backup completed successfully');
    }

    async restore() {
        debugLog('restore called for sessionId:', this.sessionId);
        await this.client.copy(this.sessionId + '::backup', this.sessionId, [])
        debugLog('restore completed successfully');
    }
}

module.exports = { YdbChatMessageHistory };