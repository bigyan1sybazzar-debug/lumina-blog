'use client';

import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, Clock } from 'lucide-react';

export default function EmicalculatorPage() {
    const [principal, setPrincipal] = useState(1000000);
    const [annualRate, setAnnualRate] = useState(10);
    const [years, setYears] = useState(5);

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
                <div className="space-y-6">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Principal (P)</label>
                        <div className="flex items-center">
                            <DollarSign className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Interest Rate (%)</label>
                        <div className="flex items-center">
                            <Percent className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input type="number" step="0.1" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Term (Years)</label>
                        <div className="flex items-center">
                            <Clock className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border space-y-4 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">EMI Summary</h2>
                    <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-lg font-semibold">Monthly EMI:</span>
                        <span className="text-3xl font-extrabold text-green-600">{emi.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-base font-medium">Total Payment:</span>
                        <span className="text-xl font-bold">{(principal + totalInterest).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}