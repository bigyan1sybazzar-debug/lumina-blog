'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, Smartphone, TrendingUp, DollarSign } from 'lucide-react';

export const ExchangeOffer: React.FC = () => {
    const [newPhonePrice, setNewPhonePrice] = useState(79999);
    const [oldPhoneResale, setOldPhoneResale] = useState(25000);
    const [tradeInBonus, setTradeInBonus] = useState(5000);

    // Calculate the total exchange value and the final price
    const { totalExchangeValue, finalEffectivePrice } = useMemo(() => {
        const totalValue = oldPhoneResale + tradeInBonus;
        const finalPrice = Math.max(0, newPhonePrice - totalValue); // Ensure price doesn't go negative

        return {
            totalExchangeValue: totalValue,
            finalEffectivePrice: finalPrice,
        };
    }, [newPhonePrice, oldPhoneResale, tradeInBonus]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-gray-800 shadow-xl rounded-xl transition-colors duration-200 mt-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 border-b pb-3 border-gray-200 dark:border-gray-700">
                Phone Exchange Offer Calculator
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Input Form */}
                <div className="space-y-6">

                    {/* New Phone Price Input */}
                    <div className="relative">
                        <label htmlFor="new-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price of New Phone
                        </label>
                        <div className="flex items-center">
                            <DollarSign className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="new-price"
                                type="number"
                                value={newPhonePrice}
                                onChange={(e) => setNewPhonePrice(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Price of the new phone"
                                min="1000"
                            />
                        </div>
                    </div>

                    {/* Old Phone Resale Value Input */}
                    <div className="relative">
                        <label htmlFor="resale-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Old Phone Resale/Buyback Value
                        </label>
                        <div className="flex items-center">
                            <Smartphone className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="resale-value"
                                type="number"
                                value={oldPhoneResale}
                                onChange={(e) => setOldPhoneResale(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Value offered for your old device"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Trade-in Bonus Input */}
                    <div className="relative">
                        <label htmlFor="bonus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Trade-in Bonus / Exchange Offer
                        </label>
                        <div className="flex items-center">
                            <TrendingUp className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="bonus"
                                type="number"
                                value={tradeInBonus}
                                onChange={(e) => setTradeInBonus(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Promotional bonus amount"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Results Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 space-y-4 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-4 flex items-center">
                        <RefreshCw size={20} className="mr-2" /> Exchange Summary
                    </h2>

                    {/* Total Exchange Value */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Total Exchange Value:
                        </span>
                        <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                            {formatCurrency(totalExchangeValue)}
                        </span>
                    </div>

                    {/* Final Effective Price */}
                    <div className="flex justify-between items-center py-2">
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Final Effective Price:
                        </span>
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                            {formatCurrency(finalEffectivePrice)}
                        </span>
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            This is the price of the new phone after deducting the exchange value.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExchangeOffer;