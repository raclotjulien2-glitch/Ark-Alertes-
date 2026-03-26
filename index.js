const { Client, GatewayIntentBits } = require('discord.js');
const Gamedig = require('gamedig');

const servers = [
    { name: "Serveur 2367", host: "5.62.112.246", port: 7781 },
    { name: "Nouveau Serveur", host: "5.62.115.4", port: 7777 }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
let lastPlayerList = {}; 

client.once('ready', () => {
    console.log(`Bot Ark Connecté !`);
    setInterval(checkServers, 60000); // Vérifie chaque minute
    checkServers(); 
});

async function checkServers() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return;

    for (const server of servers) {
        try {
            const state = await Gamedig.query({
                type: 'arksa', // 'arksa' pour Ascended
                host: server.host,
                port: server.port
            });
            const currentPlayers = state.players.map(p => p.name);
            const serverId = `${server.host}:${server.port}`;
            if (lastPlayerList[serverId]) {
                const joined = currentPlayers.filter(p => !lastPlayerList[serverId].includes(p));
                const left = lastPlayerList[serverId].filter(p => !currentPlayers.includes(p));
                if (joined.length > 0) channel.send(`✅ **[${server.name}]** Connexion : \`${joined.join(', ')}\` (${currentPlayers.length}/${state.maxplayers})`);
                if (left.length > 0) channel.send(`❌ **[${server.name}]** Déconnexion : \`${left.join(', ')}\``);
            }
            lastPlayerList[serverId] = currentPlayers;
        } catch (e) { console.log(`Erreur sur ${server.name}`); }
    }
}
const http = require('http');
http.createServer((req, res) => { res.write('OK'); res.end(); }).listen(process.env.PORT || 3000);
client.login(DISCORD_TOKEN);
