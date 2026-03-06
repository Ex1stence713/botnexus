/**
 * Setup error handling for the Discord bot
 * @param {Client} client - Discord.js client
 */
export function setupErrorHandling(client) {
  // Handle client errors
  client.on('error', error => {
    console.error('❌ Client error:', error);
  });

  // Handle warnings
  client.on('warn', warning => {
    console.warn('⚠️ Warning:', warning);
  });

  // Handle uncaught promise rejections
  process.on('unhandledRejection', reason => {
    console.error('❌ Unhandled rejection:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('❌ Uncaught exception:', error);
  });

  console.log('✅ Error handling setup complete');
}
