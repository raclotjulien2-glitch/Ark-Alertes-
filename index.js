const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const axios = require('axios');
const http = require('http');

const servers = [
    { name: "Lost Colony 2775", id: "24419994" },
    { name: "Scorched Earth 2367", id: "26857866" }
];

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 10000; // On force le port 10000 pour Render

let lastPlayerCount = {};

client.once('ready', async (c) => {
    console.log(`✅ Bot Ark Officiel Connecté : ${c.user.tag}`);
    
    client.user.setPresence({
        activities: [{ name: 'Défense Ark 🦖', type: ActivityType.Watching }],
        status: 'online',
    });

    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (channel) {
        console.log("Salon de défense trouvé !");
    }

    setInterval(checkBattleMetrics, 120000);
    checkBMFirstTime();
});

async function checkBMFirstTime() {
    for (const server of servers) {
        try {
            const response = await axios.get(`https://api.battlemetrics.com/servers/${server.id}`);
            lastPlayerCount[server.id] = response.data.data.attributes.players;
            console.log(`Initialisation ${server.name} : ${lastPlayerCount[server.id]} joueurs.`);
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

// SERVEUR HTTP CORRIGÉ POUR RENDER (PORT 10000)
http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Bot Ark Actif sur le port ' + PORT);
    res.end();
}).listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur de maintien actif sur le port ${PORT}`);
});

client.login(DISCORD_TOKEN);
