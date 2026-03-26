const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const axios = require('axios');
const http = require('http');

// CONFIGURATION DES SERVEURS (OFFICIELS ARK ASCENDED)
const servers = [
    { name: "Lost Colony 2775", id: "24419994" },
    { name: "Scorched Earth 2367", id: "26857866" }
];

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let lastPlayerCount = {};

// Correction pour forcer le statut "En ligne" (Vert)
client.once('ready', (c) => {
    console.log(`✅ Bot Ark Officiel Connecté en tant que ${c.user.tag} !`);
    
    // Définit le statut en ligne et l'activité
    client.user.setPresence({
        activities: [{ name: 'Surveillance Ark 🦖', type: ActivityType.Watching }],
        status: 'online',
    });

    console.log(`Surveillance de : ${servers.map(s => s.name).join(', ')}`);
    
    // Vérification toutes les 2 minutes
    setInterval(checkBattleMetrics, 120000);
    checkBattleMetrics();
});

async function checkBattleMetrics() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) {
        console.log("⚠️ Erreur : Salon Discord introuvable. Vérifiez CHANNEL_ID.");
        return;
    }

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
                    channel.send(`📉 **[${server.name}]** ${diff} joueur(s). (Total: **${currentCount}/${maxPlayers}**)`);
                }
            }

            lastPlayerCount[server.id] = currentCount;

        } catch (error) {
            console.log(`❌ Erreur API BattleMetrics pour ${server.name}`);
        }
    }
}

// Serveur HTTP pour maintenir Render éveillé
http.createServer((req, res) => {
    res.write('Bot Ark Operationnel');
    res.end();
}).listen(process.env.PORT || 3000);

client.login(DISCORD_TOKEN);
