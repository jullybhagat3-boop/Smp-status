
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const util = require("minecraft-server-util");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const JAVA_HOST = "rec-4.flashcloud.site";
const JAVA_PORT = 19111;

// Set these in your hosting service's environment variables
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.STATUS_CHANNEL_ID;

let statusMessage;

async function updateStatus() {
  let online = false;
  let players = 0;
  let maxPlayers = 0;
  let description = "🔴 OFFLINE";

  try {
    const result = await util.status(JAVA_HOST, JAVA_PORT, {
      timeout: 5000
    });

    online = true;
    players = result.players.online;
    maxPlayers = result.players.max;
    description = "🟢 ONLINE";
  } catch {
    description = "🔴 OFFLINE";
  }

  const embed = new EmbedBuilder()
    .setTitle("Radiation SMP Status")
    .setColor(online ? 0x22c55e : 0xef4444)
    .addFields(
      { name: "Server", value: description, inline: true },
      {
        name: "Players",
        value: online ? `${players}/${maxPlayers}` : "Unavailable",
        inline: true
      },
      { name: "Java IP", value: `${JAVA_HOST}:${JAVA_PORT}` }
    )
    .setFooter({ text: "Updates every 60 seconds" })
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    if (statusMessage) {
      await statusMessage.edit({ embeds: [embed] });
    } else {
      const messages = await channel.messages.fetch({ limit: 10 });
      statusMessage = messages.find(
        message => message.author.id === client.user.id &&
          message.embeds[0]?.title === "Radiation SMP Status"
      );
      if (statusMessage) {
        await statusMessage.edit({ embeds: [embed] });
      } else {
        statusMessage = await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error("Status update failed:", error.message);
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateStatus();
  setInterval(updateStatus, 60_000);
});

if (!TOKEN || !CHANNEL_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or STATUS_CHANNEL_ID");
  process.exit(1);
}

client.login(TOKEN);
