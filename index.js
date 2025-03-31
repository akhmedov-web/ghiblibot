const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Replace this with your real bot token from BotFather
const token = '7201880244:AAHzNZ8VLmJzQ00bBdtT2hAY4M3FxDyKlOk';

const bot = new TelegramBot(token, { polling: true });

// Your custom reply message
const replyText = `<b>⚠️ Attention!</b>
\nOur free bot @ghibliStyleAI_bot is currently in high demand – with over 100 image requests in the queue!
\n🎨 Want to get your image faster? Switch to our premium bot 👉 @animeghibli_bot  
\n✅ For just 5,000 USZ (~$0.50), you'll get priority service with no waiting!
\nThank you for your support! 💖✨`;

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Send your reply regardless of what the user types
  bot.sendMessage(chatId, replyText, {parse_mode:"HTML"});
});

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 The server is running on port ${PORT}`);
});