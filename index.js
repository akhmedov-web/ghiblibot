const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Store user's photo temporarily (userId => fileId)
const userPhotoMap = new Map();

// /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "<b>👋 Welcome!</b> \n\nPlease send your photo🖼️ so we will convert it into a Ghibli style for you. <b>ONLY 1 PHOTO!</b>", {parse_mode:"HTML"});
});

// Handle user photo (only in private chat)
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;

  // ❌ Ignore group/channel messages
  if (chatId.toString() === process.env.ADMIN_GROUP_ID) return;
  if (msg.chat.type !== "private") return;

  const photoArray = msg.photo;

  if (!photoArray || photoArray.length === 0) {
    return bot.sendMessage(chatId, "⚠️ Please send a valid photo.");
  }

  const fileId = photoArray[photoArray.length - 1].file_id;
  userPhotoMap.set(chatId, fileId); // Save photo

  const channelButtons = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔗 Channel 1", url: `https://t.me/${process.env.CHANNEL_1.replace("@", "")}` },
          { text: "🔗 Channel 2", url: `https://t.me/${process.env.CHANNEL_2.replace("@", "")}` },
        ],
        [{ text: "✅ Check Subscription", callback_data: "check_subscription" }],
      ],
    },
  };

  await bot.sendMessage(
    chatId,
    "To continue, please subscribe to our channels. Support us by subscribing, then click '✅ Check subscription'.",
    channelButtons
  );
});

// Handle subscription check button
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (query.data === "check_subscription") {
    try {
      const member1 = await bot.getChatMember(process.env.CHANNEL_1, userId);
      const member2 = await bot.getChatMember(process.env.CHANNEL_2, userId);

      const isSubbed1 = ["member", "administrator", "creator"].includes(member1.status);
      const isSubbed2 = ["member", "administrator", "creator"].includes(member2.status);

      if (isSubbed1 && isSubbed2) {
        const fileId = userPhotoMap.get(chatId);

        if (fileId) {
          await bot.sendPhoto(process.env.ADMIN_GROUP_ID, fileId, {
            caption: `🖼️ New photo from @${query.from.username || query.from.first_name} (ID: ${chatId})`,
          });

          await bot.sendMessage(chatId, "<b>✅ We got your order</b>\n\n🕒 It will take up to 5–10 minutes to generate your photo. Please DO NOT block or stop the bot.", {parse_mode:"HTML"});
        } else {
          await bot.sendMessage(chatId, "⚠️ No photo found. Please send your photo again.");
        }
      } else {
        await bot.sendMessage(chatId, "❌ You're not subscribed yet. Please subscribe first to continue.");
      }
    } catch (error) {
      console.error("Subscription check error:", error.response?.body || error);
      await bot.sendMessage(chatId, "❌ Something went wrong. Please try again.");
    }
  }
});

// Handle admin reply with drawn photo
bot.on("message", async (msg) => {
  const isFromAdminGroup = msg.chat.id.toString() === process.env.ADMIN_GROUP_ID;

  // ✅ Make sure it's a reply to a photo message with (ID: <userId>)
  if (
    isFromAdminGroup &&
    msg.reply_to_message &&
    msg.reply_to_message.caption?.includes("ID:")
  ) {
    const caption = msg.reply_to_message.caption;
    const userId = caption.match(/ID: (\d+)/)?.[1];

    if (userId) {
      // ✅ If it's a photo
      if (msg.photo) {
        const photo = msg.photo[msg.photo.length - 1].file_id;
        await bot.sendPhoto(userId, photo, {
          caption: `🎉 Here’s your animated photo! Hayao Miyazaki himself drew it for you 😊`,
        });
      }

      // ✅ If it's a text message
      if (msg.text) {
        await bot.sendMessage(
          userId,
          `✉️ Message from admin:\n\n${msg.text}`
        );
      }

      // ✅ Thank-you message
      await bot.sendMessage(
        userId,
        `If you want more photos animated in Ghibli style, please run this bot:\n👉 @animeghibli_bot\n\nThanks for using our service! 💌`
      );
    }
  }
});

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Express server is running on port ${PORT}`);
});