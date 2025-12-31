import { createPoll } from '../services/db';

const seedPolls = async () => {
    const polls = [
        {
            question: "Who should be the next Mayor of Kathmandu?",
            description: "Vote for the candidate you believe can bring the most positive change to the capital city.",
            category: 'election' as const,
            options: [
                { id: '1', text: 'Balen Shah', votes: 1200 },
                { id: '2', text: 'Srijana Singh', votes: 450 },
                { id: '3', text: 'Keshav Sthapit', votes: 300 }
            ],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            question: "Which movie are you most excited for in 2026?",
            description: "A selection of the most anticipated blockbusters coming to theaters.",
            category: 'movies' as const,
            options: [
                { id: '1', text: 'Avengers: Secret Wars', votes: 800 },
                { id: '2', text: 'Avatar 3', votes: 600 },
                { id: '3', text: 'Spider-Man 4', votes: 950 }
            ],
        },
        {
            question: "Best Smartphone of 2025?",
            description: "Which device dominated the market and offered the best experience?",
            category: 'gadgets' as const,
            options: [
                { id: '1', text: 'iPhone 17 Pro', votes: 1500 },
                { id: '2', text: 'Samsung Galaxy S25 Ultra', votes: 1400 },
                { id: '3', text: 'Google Pixel 10 Pro', votes: 900 }
            ],
        }
    ];

    console.log('Seeding polls...');
    for (const poll of polls) {
        try {
            const id = await createPoll(poll);
            console.log(`Created poll with ID: ${id}`);
        } catch (error) {
            console.error('Error seeding poll:', error);
        }
    }
    console.log('Seeding complete!');
};

seedPolls();
