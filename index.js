const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const axios = require('axios');
const http = require('http');

// CONFIGURATION DES SERVEURS (OFFICIELS ARK ASCENDED)
const servers = [
    { name: "Lost Colony 2775", id: "24419994" },
    { name: "Scorched Earth 2367", id: "26857866" }
];

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let lastPlayerCount = {};

client.once('ready', async (c) => {
    console.log(`✅ Bot Ark Connecté : ${c.user.tag}`);
    
    // Statut visuel sur Discord
    client.user.setPresence({
        activities: [{ name: 'Défense Ark 🦖', type: ActivityType.Watching }],
        status: 'online',
    });

    // TEST D'ENVOI IMMÉDIAT (Pour vérifier les permissions)
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (channel) {
        channel.send("🚀 **Système de surveillance activé !**\nLe bot est maintenant opérationnel sur les serveurs 2775 et 2367.");
    } else {
        console.log("⚠️ ERREUR : Salon introuvable. Vérifiez l'ID et les permissions.");
    }

    // Vérification toutes les 2 minutes
    setInterval(checkBattleMetrics, 120000);
    checkBMFirstTime(); // Initialise les compteurs sans envoyer de spam
});

// Fonction pour initialiser sans spammer au démarrage
async function checkBMFirstTime() {
    for (const server of servers) {
        try {
            const response = await axios.get(`https://api.battlemetrics.com/servers/${server.id}`);
            lastPlayerCount[server.id] = response.data.data.attributes.players;
        } catch (e) { console.log(`Erreur init ${server.name}`); }
    }
}

async function checkBattleMetrics() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return;

    for (const server of servers) {
        try {
            const response = await axios.get(`https://api.battlemetrics.com/servers/${server.id}`);
            const data = response.data.data.attributes;
            
            const currentCount = data.players;
            const maxPlayers = data.maxPlayers;

            if (lastPlayerCount[server.id] !== undefined) {
                const diff = currentCount - lastPlayerCount[server.id];

                if (diff > 0) {
                    channel.send(`📈 **[${server.name}]** +${diff} joueur(s) ! (Total: **${currentCount}/${maxPlayers}**)`);
                } else if (diff < 0) {
                    channel.send(`📉 **[${server.name}]** ${Math.abs(diff)} joueur(s) est parti. (Total: **${currentCount}/${maxPlayers}**)`);
                }
            }
            lastPlayerCount[server.id] = currentCount;
        } catch (error) {
            console.log(`Erreur API pour ${server.name}`);
        }
    }
}

// Maintien Render
http.createServer((req, res) => { res.write('OK'); res.end(); }).listen(process.env.PORT || 3000);

client.login(DISCORD_TOKEN);
