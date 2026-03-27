const API_URL = "http://localhost:3000/api/sports/sync";
const DETAILS_API_URL = "http://localhost:3000/api/sports/sync/details";

// 🏆 1. CUSTOM LIVE SCORES
// Format: "Home Name  [Home Score] - [Away Score]  Away Name | Time | League"
const customMatchStrings = [
    "Real Madrid 3 - 2 Atlético Madrid | FT | La Liga",
    "Arsenal 2 - 0 Barcelona | 75' | Champions League",
    "Manchester City 3 - 3 Real Madrid | FT | Champions League",
    "Liverpool 0 - 0 Chelsea | 15:00 | Premier League"
];

// 📊 2. CUSTOM ANALYTICS (Stats, Lineups, Details)
// Map these to the indexes of the matches above (0, 1, 2, 3...)
const customAnalytics = {
    0: { // Real Madrid vs Atlético Madrid
        statistics: [
            {
                groupName: "Match Statistics",
                statisticsItems: [
                    { name: "Ball Possession", home: "58%", away: "42%" },
                    { name: "Total Shots", home: "18", away: "9" },
                    { name: "Shots on Target", home: "7", away: "4" },
                    { name: "Corners", home: "9", away: "3" },
                    { name: "Fouls", home: "11", away: "14" },
                    { name: "Yellow Cards", home: "2", away: "3" },
                    { name: "Red Cards", home: "0", away: "0" }
                ]
            },
            {
                groupName: "Expected Goals (xG)",
                statisticsItems: [
                    { name: "xG", home: "2.4", away: "1.1" }
                ]
            }
        ],
        lineups: {
            home: {
                team: "Real Madrid",
                formation: "4-3-3",
                players: [
                    { player: { name: "Courtois", position: "GK" } },
                    { player: { name: "Carvajal", position: "RB" } },
                    { player: { name: "Rüdiger", position: "CB" } },
                    { player: { name: "Militão", position: "CB" } },
                    { player: { name: "Mendy", position: "LB" } },
                    { player: { name: "Valverde", position: "CM" } },
                    { player: { name: "Tchouaméni", position: "CM" } },
                    { player: { name: "Bellingham", position: "CM" } },
                    { player: { name: "Rodrygo", position: "RW" } },
                    { player: { name: "Mbappé", position: "ST" } },
                    { player: { name: "Vinícius Júnior", position: "LW" } }
                ]
            },
            away: {
                team: "Atlético Madrid",
                formation: "5-4-1",
                players: [
                    { player: { name: "Oblak", position: "GK" } },
                    { player: { name: "Llorente", position: "RWB" } },
                    { player: { name: "Giménez", position: "CB" } },
                    { player: { name: "Witsel", position: "CB" } },
                    { player: { name: "Le Normand", position: "CB" } },
                    { player: { name: "Reinildo", position: "LWB" } },
                    { player: { name: "Koke", position: "CM" } },
                    { player: { name: "De Paul", position: "CM" } },
                    { player: { name: "Barrios", position: "CM" } },
                    { player: { name: "Griezmann", position: "AM" } },
                    { player: { name: "Álvarez", position: "ST" } }
                ]
            }
        }
    },
    1: { // Man City vs Real Madrid
        statistics: [
            {
                groupName: "Match Statistics",
                statisticsItems: [
                    { name: "Ball Possession", home: "65%", away: "35%" },
                    { name: "Total Shots", home: "25", away: "12" }
                ]
            }
        ]
    }
};

// We automatically convert your simple strings into the complex format the site needs!
const mappedFootballScores = customMatchStrings.map((item, index) => {
    const parts = item.split('|').map(p => p.trim());
    const matchStr = parts[0];
    const timeStr = parts[1] || "FT";
    const compStr = parts[2] || "Custom League";

    const statusCat = timeStr === "FT" ? "finished" : (timeStr.includes("'") ? "inprogress" : "notstarted");

    const splitDashboard = matchStr.split('-');

    const homeWords = splitDashboard[0].trim().split(' ');
    const homeScore = parseInt(homeWords.pop());
    const homeTeamName = homeWords.join(' ');

    const awayWords = splitDashboard[1].trim().split(' ');
    const awayScore = parseInt(awayWords.shift());
    const awayTeamName = awayWords.join(' ');

    const matchId = 999000 + index;

    return {
        id: matchId,
        homeTeam: { name: homeTeamName, shortName: homeTeamName.substring(0, 3).toUpperCase() },
        awayTeam: { name: awayTeamName, shortName: awayTeamName.substring(0, 3).toUpperCase() },
        homeScore: { display: isNaN(homeScore) ? 0 : homeScore },
        awayScore: { display: isNaN(awayScore) ? 0 : awayScore },
        status: { type: statusCat, description: timeStr },
        tournament: { name: compStr },
        lastPeriod: timeStr
    };
});

const customData = {
    football: mappedFootballScores,

    // 2. CUSTOM STANDINGS
    // Edit these exactly how you want them to appear on your site
    standings: {
        "Premier League": [
            "1 | Arsenal | P:31 W:21 D:7 L:3 GD:+39 PTS:70",
            "2 | Manchester City | P:30 W:18 D:7 L:5 GD:+32 PTS:61",
            "3 | Manchester United | P:31 W:15 D:10 L:6 GD:+13 PTS:55",
            "4 | Aston Villa | P:31 W:16 D:6 L:9 GD:+5 PTS:54",
            "5 | Liverpool | P:31 W:14 D:7 L:10 GD:+8 PTS:49",
            "6 | Chelsea | P:31 W:13 D:9 L:9 GD:+15 PTS:48",
            "7 | Brentford | P:31 W:13 D:7 L:11 GD:+4 PTS:46",
            "8 | Everton | P:31 W:13 D:7 L:11 GD:+2 PTS:46",
            "9 | Fulham | P:31 W:13 D:5 L:13 GD:-1 PTS:44",
            "10 | Brighton and Hove Albion | P:31 W:11 D:10 L:10 GD:+4 PTS:43",
            "11 | Sunderland | P:31 W:11 D:10 L:10 GD:-4 PTS:43",
            "12 | Newcastle United | P:31 W:12 D:6 L:13 GD:-1 PTS:42",
            "13 | Bournemouth | P:31 W:9 D:15 L:7 GD:-2 PTS:42",
            "14 | Crystal Palace | P:30 W:10 D:9 L:11 GD:-2 PTS:39",
            "15 | Leeds United | P:31 W:7 D:12 L:12 GD:-11 PTS:33",
            "16 | Nottingham Forest | P:31 W:8 D:8 L:15 GD:-12 PTS:32",
            "17 | Tottenham Hotspur | P:31 W:7 D:9 L:15 GD:-10 PTS:30",
            "18 | West Ham United | P:31 W:7 D:8 L:16 GD:-21 PTS:29",
            "19 | Burnley | P:31 W:4 D:8 L:19 GD:-28 PTS:20",
            "20 | Wolverhampton Wanderers | P:31 W:3 D:8 L:20 GD:-30 PTS:17"
        ],
        "La Liga": [
            "1 | Barcelona | P:29 W:24 D:1 L:4 GD:+50 PTS:73",
            "2 | Real Madrid | P:29 W:22 D:3 L:4 GD:+37 PTS:69"
        ],
        "Serie A": [
            "1 | Inter Milan | P:30 W:22 D:3 L:5 GD:+42 PTS:69",
            "2 | AC Milan | P:30 W:18 D:9 L:3 GD:+24 PTS:63"
        ],
        "Bundesliga": [
            "1 | Bayern Munich | P:27 W:22 D:4 L:1 GD:+72 PTS:70",
            "2 | Borussia Dortmund | P:27 W:18 D:7 L:2 GD:+30 PTS:61",
        ],
        "Ligue 1": [
            "1 | Paris Saint-Germain | P:26 W:19 D:3 L:4 GD:+36 PTS:60",
            "2 | RC Lens | P:27 W:19 D:2 L:6 GD:+30 PTS:59"
        ],
        "Champions League": [
            "1 | Arsenal | P:8 W:8 D:0 L:0 GD:+19 PTS:24",
            "2 | Bayern Munich | P:8 W:7 D:0 L:1 GD:+14 PTS:21",
        ]
    }
};

async function updateCloudData() {
    console.log("🚀 Connecting to local sync server...");

    try {
        // 1. Push main scores and standings
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customData),
        });

        if (!response.ok) throw new Error(`Main sync failed: ${response.status}`);
        const result = await response.json();
        console.log("✅ Main Scoreboard updated.");

        // 2. Push Analytics (Statistics, Lineups)
        console.log("📊 Syncing match analytics...");
        for (const index in customAnalytics) {
            const matchId = 999000 + parseInt(index);
            const analytics = customAnalytics[index];

            const detailResponse = await fetch(DETAILS_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: matchId,
                    statistics: analytics.statistics || null,
                    lineups: analytics.lineups || null,
                    details: analytics.details || null
                }),
            });

            if (detailResponse.ok) {
                console.log(`   - Analytics synced for Match ${matchId}`);
            } else {
                console.warn(`   - Failed to sync analytics for Match ${matchId}`);
            }
        }

        console.log("\n🔥 ALL SYSTEMS GREEN. Cloud database overridden with custom analytics.");

    } catch (err) {
        console.error("❌ Failed to push to cloud:\n", err.message);
        console.error("Did you forget to start 'npm run dev'?");
    }
}

updateCloudData();
