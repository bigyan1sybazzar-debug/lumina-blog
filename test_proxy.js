const fetch = require('node-fetch');

async function test() {
    const res = await fetch('http://localhost:3000/api/sports/proxy?sport=football');
    const data = await res.json();
    console.log("Found Events:", data.events?.length);
    if (data.events?.[0]) {
        const ev = data.events[0];
        console.log("First Event Path Test:");
        console.log("ID:", ev.id);
        console.log("Home:", ev.homeTeam?.name);
        console.log("Tournament:", ev.tournament?.name);
        console.log("Status:", ev.status?.type);
    }
}
test();
