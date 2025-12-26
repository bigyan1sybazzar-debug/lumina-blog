'use client';

import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, Clock } from 'lucide-react';

/**
 * EMI Calculator Page
 * Next.js requires the page component to be the default export.
 */
export default function EmicalculatorPage() {
    const [principal, setPrincipal] = useState(1000000);
    const [annualRate, setAnnualRate] = useState(10);
    const [years, setYears] = useState(5);

    // Calculation logic placed inside useMemo for performance
    const emi = useMemo(() => {
        if (principal <= 0 || annualRate < 0 || years <= 0) return 0;
        const monthlyRate = annualRate / 12 / 100;
        const totalPayments = years * 12;
        
        if (monthlyRate === 0) return principal / totalPayments;

        const powerFactor = Math.pow(1 + monthlyRate, totalPayments);
        return (principal * monthlyRate * powerFactor) / (powerFactor - 1);
    }, [principal, annualRate, years]);

    const totalInterest = useMemo(() => {
        if (emi === 0) return 0;
        return (emi * years * 12) - principal;
    }, [emi, principal, years]);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-gray-800 shadow-xl rounded-xl transition-colors duration-200 mt-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 border-b pb-3 border-gray-200 dark:border-gray-700">
                Loan EMI Calculator
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Input Form */}
                <div className="space-y-6">
                    <div className="relative">
                        <label htmlFor="principal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Loan Principal (P)
                        </label>
                        <div className="flex items-center">
                            <DollarSign className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="principal"
                                type="number"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g., 1500000"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Annual Interest Rate (%)
                        </label>
                        <div className="flex items-center">
                            <Percent className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="rate"
                                type="number"
                                step="0.1"
                                value={annualRate}
                                onChange={(e) => setAnnualRate(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="years" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Loan Term (Years)
                        </label>
                        <div className="flex items-center">
                            <Clock className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="years"
                                type="number"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Results Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 space-y-4 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                        EMI Summary
                    </h2>

                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Monthly EMI:</span>
                        <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                            {emi.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Total Interest:</span>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                            {totalInterest.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Total Payment:</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {(principal + totalInterest).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
