const { Client, GatewayIntentBits } = require('discord.js');
const Gamedig = require('gamedig');

// CONFIGURATION DES SERVEURS AVEC LES IPS BATTLEMETRICS
const servers = [
    { name: "Lost Colony", host: "5.62.115.4", port: 7777 },
    { name: "Scorched Earth", host: "5.62.112.246", port: 7781 }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
let lastPlayerList = {}; 

client.once('ready', () => {
    console.log(`Bot Ark Tracker en ligne ! Surveillance de ${servers.length} serveurs.`);
    setInterval(checkServers, 60000); // Vérification toutes les minutes
    checkServers(); 
});

async function checkServers() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return;

    for (const server of servers) {
        try {
            // On tente de récupérer les infos du serveur
            const state = await Gamedig.query({
                type: 'arksa', 
                host: server.host,
                port: server.port,
                maxRetries: 3
            });

            const currentPlayers = state.players.map(p => p.name);
            const serverId = `${server.host}:${server.port}`;

            if (lastPlayerList[serverId]) {
                const joined = currentPlayers.filter(p => !lastPlayerList[serverId].includes(p));
                const left = lastPlayerList[serverId].filter(p => !currentPlayers.includes(p));

                if (joined.length > 0) {
                    channel.send(`✅ **[${server.name}]** Connexion : \`${joined.join(', ')}\` (${currentPlayers.length}/${state.maxplayers})`);
                }
                if (left.length > 0) {
                    channel.send(`❌ **[${server.name}]** Déconnexion : \`${left.join(', ')}\``);
                }
            }
            lastPlayerList[serverId] = currentPlayers;

        } catch (e) {
            console.log(`Impossible de joindre ${server.name} (${server.host}:${server.port}). Vérifiez si le Query Port est différent.`);
        }
    }
}

// Maintenir Render actif
const http = require('http');
http.createServer((req, res) => { res.write('Bot Ark Running'); res.end(); }).listen(process.env.PORT || 3000);

client.login(DISCORD_TOKEN);
