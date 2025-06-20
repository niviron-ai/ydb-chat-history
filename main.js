const db = require("@dieugene/key-value-db");
const { BaseListChatMessageHistory } = require("@langchain/core/chat_history");
const {
    BaseMessage,
    StoredMessage,
    mapChatMessagesToStoredMessages,
    mapStoredMessagesToChatMessages
} = require("@langchain/core/messages");

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
        const { sessionId, readOnly, database, table_name } = fields;

        this.client = db.init('CHAT_HISTORY', {
            table_name: table_name || 'chat_history_db',
            database: database || process.env.CHAT_HISTORY_DB_ADDRESS
        });
        this.sessionId = sessionId;
        if (typeof readOnly === 'boolean') this.readOnly = readOnly;
        this.getMessages.raw = async () => await this.client.get(this.sessionId) ?? [];
    }

    /**
     * Retrieves the chat messages from the YDB database.
     * @returns {Promise<BaseMessage[]>} An array of BaseMessage instances representing the chat history.
     */
    async getMessages() {
        let rawStoredMessages =
            await this.client.get(this.sessionId, []);
        if (!rawStoredMessages) rawStoredMessages = [];
        const orderedMessages = rawStoredMessages.reverse();
        const previousMessages = orderedMessages.filter(
            x => x.type !== undefined && x.data.content !== undefined
        );
        return mapStoredMessagesToChatMessages(previousMessages);
    }

    /**
     * Adds a new message to the chat history in the YDB database.
     * @param message {BaseMessage} The message to be added to the chat history.
     * @returns Promise resolving to void.
     */
    async addMessage(message) {
        if (this.readOnly) return;
        let messages = [...await this.getMessages(), message].reverse();
        const messagesToAdd = mapChatMessagesToStoredMessages(messages);
        await this.client.set(this.sessionId, messagesToAdd);
    }

    async addMessages(messages = []) {
        if (this.readOnly) return;
        messages = [ ...await this.getMessages(), ...messages ].reverse();
        const messagesToAdd = mapChatMessagesToStoredMessages(messages);
        await this.client.set(this.sessionId, messagesToAdd);
    }

    /**
     * Deletes all messages from the chat history in the Redis database.
     * @returns Promise resolving to void.
     */
    async clear() {
        await this.client.del(this.sessionId);
    }

    async backup() {
        await this.client.copy(this.sessionId, this.sessionId + '::backup', []);
    }

    async restore() {
        await this.client.copy(this.sessionId + '::backup', this.sessionId, [])
    }
}

module.exports = { YdbChatMessageHistory };