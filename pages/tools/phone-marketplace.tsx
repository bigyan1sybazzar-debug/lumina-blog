import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { BuySection } from '../../components/marketplace/BuySection';
import { SellSection } from '../../components/marketplace/SellSection';
import { BuyerRequests } from '../../components/marketplace/BuyerRequests';
import { SellerOffers } from '../../components/marketplace/SellerOffers';
import Head from 'next/head';
import { ShoppingBag, Tag, Users, TrendingUp } from 'lucide-react';
import DirectChat from '../../components/DirectChat';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/chatService';
import { User, PhoneListing, BuyerRequest } from '../../types';

const PhoneMarketplace = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'requests' | 'offers'>('buy');
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

    const tabs = [
        { id: 'buy', label: 'Buy Phones', icon: ShoppingBag },
        { id: 'sell', label: 'Sell Phones', icon: Tag },
        { id: 'requests', label: 'Buyer Requests', icon: Users },
        { id: 'offers', label: 'Seller Offers', icon: TrendingUp },
    ];

    const handleContact = async (item: PhoneListing | BuyerRequest) => {
        if (!user) {
            alert("Please login to contact.");
            return;
        }

        const targetUserId = 'sellerId' in item ? item.sellerId : item.buyerId;

        if (targetUserId === user.id) {
            alert("You cannot chat with yourself.");
            return;
        }

        try {
            const contactUser = await getUserProfile(targetUserId);
            if (contactUser) {
                setSelectedFriend(contactUser);
            } else {
                alert("User profile not found.");
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            alert("Failed to start chat.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Head>
                <title>Phone Marketplace - Buy & Sell Second Hand Phones | Bigyann</title>
                <meta name="description" content="Nepal's best place to buy and sell used smartphones. Find great deals or sell your old phone instantly." />
            </Head>

            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
                            Smart Phone Marketplace
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Buy, Sell, or Exchange your smartphone with ease.</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center mb-8 gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-6 py-3 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'
                                }`}
                        >
                            <tab.icon size={18} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {activeTab === 'buy' && <BuySection onContact={handleContact} />}
                    {activeTab === 'sell' && <SellSection />}
                    {activeTab === 'requests' && <BuyerRequests onContact={handleContact} />}
                    {activeTab === 'offers' && <SellerOffers onContact={handleContact} />}
                </div>
            </main>

            {/* Chat Modal */}
            {selectedFriend && user && (
                <DirectChat
                    currentUser={user}
                    friend={selectedFriend}
                    onClose={() => setSelectedFriend(null)}
                />
            )}
        </div>
    );
};

export default PhoneMarketplace;
