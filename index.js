const { Client, GatewayIntentBits } = require('discord.js');
const Gamedig = require('gamedig');

// On teste les ports probables (Game Port, Game Port + 1, et le standard 27015)
const serverConfigs = [
    { name: "Lost Colony", host: "5.62.115.4", ports: [7777, 7778, 27015] },
    { name: "Scorched Earth", host: "5.62.112.246", ports: [7781, 7782, 27015] }
];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
let lastPlayerList = {}; 

client.once('ready', () => {
    console.log(`✅ Bot Ark en ligne : ${client.user.tag}`);
    setInterval(checkServers, 60000); // Vérification toutes les 60 secondes
    checkServers(); 
});

async function checkServers() {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
    if (!channel) return;

    for (const config of serverConfigs) {
        let success = false;
        
        // On boucle sur les ports jusqu'à ce qu'un réponde
        for (const port of config.ports) {
            if (success) break;
            
            try {
                const state = await Gamedig.query({
                    type: 'arksa', 
                    host: config.host,
                    port: port,
                    maxRetries: 2
                });

                success = true;
                const currentPlayers = state.players.map(p => p.name);
                const serverKey = `${config.host}:${config.name}`;

                if (lastPlayerList[serverKey]) {
                    const joined = currentPlayers.filter(p => !lastPlayerList[serverKey].includes(p));
                    const left = lastPlayerList[serverKey].filter(p => !currentPlayers.includes(p));

                    if (joined.length > 0) {
                        channel.send(`✅ **[${config.name}]** Connexion : \`${joined.join(', ')}\` (${currentPlayers.length}/${state.maxplayers})`);
                    }
                    if (left.length > 0) {
                        channel.send(`❌ **[${config.name}]** Déconnexion : \`${left.join(', ')}\``);
                    }
                }
                lastPlayerList[serverKey] = currentPlayers;

            } catch (e) {
                // On ignore l'erreur et on teste le port suivant
            }
        }
        
        if (!success) {
            console.log(`⚠️ Impossible de joindre ${config.name} sur aucun des ports testés.`);
        }
    }
}

// Petit serveur pour Render
require('http').createServer((req, res) => { res.write('OK'); res.end(); }).listen(process.env.PORT || 3000);

client.login(DISCORD_TOKEN);
