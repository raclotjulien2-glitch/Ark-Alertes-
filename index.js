const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// CONFIGURATION DES SERVEURS (OFFICIELS ARK ASCENDED)
const servers = [
    { name: "Lost Colony 2775", id: "24419994" },
    { name: "Scorched Earth 2367", id: "26857866" }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let lastPlayerCount = {};

client.once('ready', () => {
    console.log(`✅ Bot Ark Officiel Connecté !`);
    console.log(`Surveillance de : ${servers.map(s => s.name).join(', ')}`);
    
    // On vérifie toutes les 2 minutes (pour respecter les limites de l'API gratuite)
    setInterval(checkBattleMetrics, 120000);
    checkBattleMetrics();
});

async function checkBattleMetrics() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return;

    for (const server of servers) {
        try {
            // Appel à l'API publique de BattleMetrics
            const response = await axios.get(`https://api.battlemetrics.com/servers/${server.id}`);
            const data = response.data.data.attributes;
            
            const currentCount = data.players;
            const maxPlayers = data.maxPlayers;
            const serverName = data.name;

            // Si on a déjà une valeur en mémoire, on compare
            if (lastPlayerCount[server.id] !== undefined) {
                const diff = currentCount - lastPlayerCount[server.id];

                if (diff > 0) {
                    // Quelqu'un s'est connecté
                    channel.send(`📈 **[${server.name}]** +${diff} joueur(s) ! (Total: **${currentCount}/${maxPlayers}**)`);
                } else if (diff < 0) {
                    // Quelqu'un s'est déconnecté
                    channel.send(`📉 **[${server.name}]** ${diff} joueur(s). (Total: **${currentCount}/${maxPlayers}**)`);
                }
            }

            // Mise à jour de la mémoire
            lastPlayerCount[server.id] = currentCount;

        } catch (error) {
            console.log(`Erreur lors de la lecture du serveur ${server.name}`);
        }
    }
}

// Serveur HTTP pour maintenir Render éveillé
const http = require('http');
http.createServer((req, res) => {
    res.write('Le tracker Ark est en cours d\'execution.');
    res.end();
}).listen(process.env.PORT || 3000);

client.login(DISCORD_TOKEN);
