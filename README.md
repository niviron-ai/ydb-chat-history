# @dialogai/ydb-chat-history

YDB (Yandex Database) chat message history implementation for LangChain applications.

## Installation

```bash
npm install @dialogai/ydb-chat-history
```

## Description

This module provides a chat message history implementation for LangChain that uses YDB (Yandex Database) as the storage backend. It extends the `BaseListChatMessageHistory` class from `@langchain/core/chat_history` and provides methods for storing, retrieving, and managing chat messages in YDB.

## Features

- 🗂️ Store and retrieve chat messages in YDB
- 🔒 Read-only mode support
- 💾 Backup and restore functionality
- 🔄 Compatible with LangChain ecosystem
- 📝 TypeScript support
- ⚡ Efficient message handling

## Usage

```javascript
const { YdbChatMessageHistory } = require('@dialogai/ydb-chat-history');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');

// Option 1: Direct database path specification
const chatHistory1 = new YdbChatMessageHistory({
  sessionId: 'user-session-123',
  database: '/ru-central1/b1g..../etn...', // YDB database path
  table_name: 'chat_history_db', // optional, defaults to 'chat_history_db'
  readOnly: false // optional, defaults to false
});

// Option 2: Using environment variables
// Set CHAT_HISTORY_DB_ADDRESS or YDB_ADDRESS environment variable
const chatHistory2 = new YdbChatMessageHistory({
  sessionId: 'user-session-456'
  // database path will be taken from environment variables
});

// Add a message using LangChain BaseMessage objects
await chatHistory1.addMessage(new HumanMessage('Hello, how are you?'));

// Add AI response
await chatHistory1.addMessage(new AIMessage('I am doing well, thank you!'));

// Get all messages (returns BaseMessage[] array)
const messages = await chatHistory1.getMessages();
console.log(messages);

// Add multiple messages
await chatHistory1.addMessages([
  new HumanMessage('First message'),
  new AIMessage('Second message')
]);

// Create backup
await chatHistory1.backup();

// Restore from backup
await chatHistory1.restore();

// Clear all messages
await chatHistory1.clear();
```

## Configuration

The constructor accepts the following options:

- `sessionId` (required): Unique identifier for the chat session
- `database` (optional): YDB database path (e.g., `/ru-central1/b1g..../etn...`). See database connection priority below
- `table_name` (optional): Name of the table to store chat history. Defaults to `chat_history_db`
- `readOnly` (optional): If true, prevents adding new messages. Defaults to false

### Database Connection Priority

The YDB database address is determined in the following priority order:

1. **Constructor `database` field** - Direct specification in the constructor
2. **`CHAT_HISTORY_DB_ADDRESS` environment variable** - Fallback environment variable
3. **`YDB_ADDRESS` environment variable** - Global YDB address environment variable
4. **Error** - If none of the above are specified, an error will occur

### Database Requirements

The target YDB database must contain a table for storing chat message history. By default, the table name is `chat_history_db`, but it can be customized using the `table_name` parameter in the constructor.

## Environment Variables

- `CHAT_HISTORY_DB_ADDRESS`: YDB database address (higher priority)
- `YDB_ADDRESS`: Global YDB database address (lower priority)

## Dependencies

- `@dieugene/key-value-db`: YDB key-value database client
- `@langchain/core`: LangChain core library (peer dependency)

## License

ISC

## Author

Eugene Ditkovsky

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/niviron-ai/ydb-chat-history).
 
