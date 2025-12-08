import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, Clock } from 'lucide-react';

// Function to calculate EMI
const calculateEMI = (principal: number, annualRate: number, years: number): number => {
    // Edge case: if any required value is zero or missing, return 0
    if (principal <= 0 || annualRate < 0 || years <= 0) {
        return 0;
    }

    // Monthly Interest Rate (r): annualRate / 12 / 100
    const monthlyRate = annualRate / 12 / 100;
    
    // Total Number of Payments (n): years * 12
    const totalPayments = years * 12;

    // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
    if (monthlyRate === 0) {
        // Simple case if interest rate is effectively 0
        return principal / totalPayments; 
    }

    const powerFactor = Math.pow(1 + monthlyRate, totalPayments);

    const emi = principal * monthlyRate * powerFactor / (powerFactor - 1);
    
    return emi;
};

export const Emicalculator: React.FC = () => {
    const [principal, setPrincipal] = useState(1000000); // Default: 1,000,000
    const [annualRate, setAnnualRate] = useState(10);     // Default: 10%
    const [years, setYears] = useState(5);               // Default: 5 years

    // Use useMemo to only recalculate EMI when the dependencies change
    const emi = useMemo(() => {
        return calculateEMI(principal, annualRate, years);
    }, [principal, annualRate, years]);

    const totalInterest = useMemo(() => {
        if (emi === 0) return 0;
        const totalPayments = years * 12;
        const totalAmount = emi * totalPayments;
        return totalAmount - principal;
    }, [emi, principal, years]);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white dark:bg-gray-800 shadow-xl rounded-xl transition-colors duration-200 mt-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 border-b pb-3 border-gray-200 dark:border-gray-700">
                Loan EMI Calculator
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Input Form */}
                <div className="space-y-6">
                    {/* Principal Input */}
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g., 1500000"
                                min="1000"
                            />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Enter the total amount borrowed.
                        </span>
                    </div>

                    {/* Rate Input */}
                    <div className="relative">
                        <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Annual Interest Rate (R)
                        </label>
                        <div className="flex items-center">
                            <Percent className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="rate"
                                type="number"
                                step="0.1"
                                value={annualRate}
                                onChange={(e) => setAnnualRate(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g., 8.5"
                                min="0"
                            />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            The yearly interest percentage (e.g., 10 for 10%).
                        </span>
                    </div>

                    {/* Term Input */}
                    <div className="relative">
                        <label htmlFor="years" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Loan Term in Years (N)
                        </label>
                        <div className="flex items-center">
                            <Clock className="absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                id="years"
                                type="number"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g., 10"
                                min="1"
                            />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            The duration of the loan in years.
                        </span>
                    </div>
                </div>

                {/* 2. Results Section */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 space-y-4 flex flex-col justify-center">
                    <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-4">
                        EMI Calculation Summary
                    </h2>
                    
                    {/* Calculated EMI */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Monthly EMI:
                        </span>
                        <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                            {emi.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Total Interest Payable */}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                            Total Interest Payable:
                        </span>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                            {totalInterest.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Total Payment (Principal + Interest) */}
                    <div className="flex justify-between items-center py-2">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                            Total Payment:
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {(principal + totalInterest).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    
                    <div className="pt-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Calculated for a loan of {principal.toLocaleString()} at an annual rate of {annualRate}% over {years} years.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};