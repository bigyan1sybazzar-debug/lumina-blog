'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    ArrowRight,
    Calculator,
    Smartphone,
    CheckCircle,
    XCircle,
    Hash,
    BatteryCharging,
    Shield,
    Droplet,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// --- Data Definitions ---
const BRANDS = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi/Redmi', 'Oppo/Realme', 'Vivo', 'Motorola', 'Other/Local'];

const MODELS = {
    Apple: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12 Pro', 'iPhone 12', 'iPhone SE (3rd Gen)', 'iPhone 11', 'iPhone XR'],
    Samsung: ['Galaxy S24 Ultra', 'Galaxy S23 Ultra', 'Galaxy S22 Ultra', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy S21 FE', 'Galaxy Note 20', 'Galaxy A54', 'Galaxy A34', 'Galaxy M34', 'Galaxy A14', 'Galaxy A05'],
    Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel Fold', 'Pixel 7a', 'Pixel 6a', 'Pixel 5'],
    OnePlus: ['OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus Nord 3', 'OnePlus Nord 2T', 'OnePlus Nord CE 3'],
    'Xiaomi/Redmi': ['Xiaomi 14 Pro', 'Xiaomi 13 Ultra', 'Poco F5', 'Redmi Note 13 Pro', 'Redmi Note 12 Pro', 'Redmi K60 Ultra', 'Redmi 12', 'Redmi 10 Power'],
    'Oppo/Realme': ['Oppo Find X6 Pro', 'Realme GT 5 Pro', 'Oppo Reno 10', 'Realme 11 Pro+', 'Realme 10', 'Oppo A58', 'Realme C55'],
    Vivo: ['Vivo X100 Pro', 'Vivo X90 Pro', 'Vivo V29', 'iQOO 12', 'Vivo Y100'],
    Motorola: ['Motorola Edge + (2023)', 'Motorola Razr+', 'Moto G54', 'Moto G84'],
    'Other/Local': ['Generic Flagship Android', 'Generic Midrange Android', 'Generic Budget Android', 'Generic Feature Phone'],
};

const BASE_PRICES: { [key: string]: number } = {
    'iPhone 15 Pro Max': 1000, 'iPhone 15 Pro': 900, 'iPhone 15 Plus': 750, 'iPhone 15': 650,
    'iPhone 14 Pro Max': 800, 'iPhone 14 Pro': 700, 'iPhone 14': 550,
    'iPhone 13 Pro Max': 550, 'iPhone 13': 450, 'iPhone 12 Pro': 350, 'iPhone 12': 300,
    'iPhone SE (3rd Gen)': 150, 'iPhone 11': 180, 'iPhone XR': 100,
    'Galaxy S24 Ultra': 950, 'Galaxy S23 Ultra': 800, 'Galaxy S22 Ultra': 650,
    'Galaxy Z Fold 5': 1100, 'Galaxy Z Flip 5': 650,
    'Galaxy S21 FE': 280, 'Galaxy Note 20': 250, 'Galaxy A54': 150, 'Galaxy A34': 100,
    'Galaxy M34': 80, 'Galaxy A14': 60, 'Galaxy A05': 40,
    'Pixel 8 Pro': 750, 'Pixel 8': 600, 'Pixel 7 Pro': 500, 'Pixel Fold': 850,
    'Pixel 7a': 250, 'Pixel 6a': 180, 'Pixel 5': 150,
    'OnePlus 12': 700, 'OnePlus 11': 550, 'OnePlus 10 Pro': 400,
    'OnePlus Nord 3': 200, 'OnePlus Nord 2T': 150, 'OnePlus Nord CE 3': 100,
    'Xiaomi 14 Pro': 600, 'Xiaomi 13 Ultra': 550, 'Poco F5': 300,
    'Redmi Note 13 Pro': 150, 'Redmi Note 12 Pro': 100, 'Redmi K60 Ultra': 250,
    'Redmi 12': 70, 'Redmi 10 Power': 50,
    'Oppo Find X6 Pro': 500, 'Realme GT 5 Pro': 450,
    'Oppo Reno 10': 180, 'Realme 11 Pro+': 150, 'Realme 10': 90,
    'Oppo A58': 70, 'Realme C55': 50,
    'Vivo X100 Pro': 600, 'Vivo X90 Pro': 500,
    'Vivo V29': 180, 'iQOO 12': 300, 'Vivo Y100': 100,
    'Motorola Edge + (2023)': 450, 'Motorola Razr+': 550,
    'Moto G54': 100, 'Moto G84': 120,
    'Generic Flagship Android': 300, 'Generic Midrange Android': 80, 'Generic Budget Android': 40, 'Generic Feature Phone': 10,
};

const CONDITION_MULTIPLIERS: { [key: string]: number } = { 'Like New': 1.1, 'Fair': 1.0, 'Poor': 0.7 };

const YES_NO_MULTIPLIERS = {
    'turnsOn': [1.0, 0.2],
    'screenLightsUp': [1.0, 0.7],
    'freeOfCracks': [1.0, 0.75],
    'isUnlocked': [1.0, 0.6],
    'liquidDamage': [1.0, 0.4],
    'canCall': [1.0, 0.6],
    'boardRepaired': [1.0, 0.5],
    'wifiBluetoothFaceID': [1.0, 0.8],
    'cameraProblem': [1.0, 0.85],
    'speakersFlashlightMic': [1.0, 0.8],
};

const ACCESSORY_BONUS = 1.05;
const PURCHASE_DATE_BONUS = 1.1;

// --- Main Page Component ---
export default function MyPhonePricePage() {
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [turnsOn, setTurnsOn] = useState<0 | 1 | null>(null);
    const [screenLightsUp, setScreenLightsUp] = useState<0 | 1 | null>(null);
    const [freeOfCracks, setFreeOfCracks] = useState<0 | 1 | null>(null);
    const [isUnlocked, setIsUnlocked] = useState<0 | 1 | null>(null);
    const [liquidDamage, setLiquidDamage] = useState<0 | 1 | null>(null);
    const [canCall, setCanCall] = useState<0 | 1 | null>(null);
    const [boardRepaired, setBoardRepaired] = useState<0 | 1 | null>(null);
    const [wifiBluetoothFaceID, setWifiBluetoothFaceID] = useState<0 | 1 | null>(null);
    const [cameraProblem, setCameraProblem] = useState<0 | 1 | null>(null);
    const [speakersFlashlightMic, setSpeakersFlashlightMic] = useState<0 | 1 | null>(null);
    const [deviceCondition, setDeviceCondition] = useState<string>('');
    const [accessories, setAccessories] = useState<0 | 1 | null>(null);
    const [purchaseDate, setPurchaseDate] = useState<0 | 1 | null>(null);

    const [price, setPrice] = useState<number | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    const availableModels = useMemo(() => {
        return selectedBrand ? (MODELS as any)[selectedBrand] || [] : [];
    }, [selectedBrand]);

    const handleInputChange = useCallback((setter: any, value: any) => {
        setter(value);
        setShowResult(false);
        setError(null);
        if (setter === setSelectedBrand) setSelectedModel('');
    }, []);

    const calculatePrice = () => {
        if (!deviceCondition || accessories === null || purchaseDate === null) {
            setError("Please answer all questions.");
            return;
        }
        let finalPrice = BASE_PRICES[selectedModel] || 150;
        finalPrice *= CONDITION_MULTIPLIERS[deviceCondition] || 1.0;
        finalPrice *= YES_NO_MULTIPLIERS.turnsOn[turnsOn!];
        finalPrice *= YES_NO_MULTIPLIERS.screenLightsUp[screenLightsUp!];
        finalPrice *= YES_NO_MULTIPLIERS.freeOfCracks[freeOfCracks!];
        finalPrice *= YES_NO_MULTIPLIERS.isUnlocked[isUnlocked!];
        finalPrice *= YES_NO_MULTIPLIERS.canCall[canCall!];
        finalPrice *= YES_NO_MULTIPLIERS.boardRepaired[boardRepaired!];
        finalPrice *= YES_NO_MULTIPLIERS.wifiBluetoothFaceID[wifiBluetoothFaceID!];
        finalPrice *= YES_NO_MULTIPLIERS.speakersFlashlightMic[speakersFlashlightMic!];
        finalPrice *= (liquidDamage === 1 ? YES_NO_MULTIPLIERS.liquidDamage[1] : YES_NO_MULTIPLIERS.liquidDamage[0]);
        finalPrice *= (cameraProblem === 1 ? YES_NO_MULTIPLIERS.cameraProblem[1] : YES_NO_MULTIPLIERS.cameraProblem[0]);
        if (accessories === 0) finalPrice *= ACCESSORY_BONUS;
        if (purchaseDate === 0) finalPrice *= PURCHASE_DATE_BONUS;
        if (turnsOn === 1 || boardRepaired === 1 || liquidDamage === 1) finalPrice = Math.max(finalPrice, 50);

        setPrice(Math.round(finalPrice));
        setShowResult(true);
    };

    const RadioButton = ({ label, state, setState, value, icon }: any) => (
        <button
            type="button"
            onClick={() => handleInputChange(setState, value)}
            className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all border flex items-center justify-center gap-2 w-full
                ${state === value 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-lg' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 md:p-10 border dark:border-gray-800">
                <div className="text-center mb-8">
                    <Calculator className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <h1 className="text-3xl font-bold dark:text-white text-gray-900">Phone Resale Estimator</h1>
                    <p className="text-gray-500">Step {step} of 3</p>
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Brand</label>
                            <select value={selectedBrand} onChange={(e) => handleInputChange(setSelectedBrand, e.target.value)} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                <option value="">Select Brand</option>
                                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Model</label>
                            <select value={selectedModel} onChange={(e) => handleInputChange(setSelectedModel, e.target.value)} disabled={!selectedBrand} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:text-white dark:border-gray-700 disabled:opacity-50">
                                <option value="">Select Model</option>
                                {availableModels.map((m: string) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="pt-4 space-y-4">
                            <p className="text-sm font-medium dark:text-gray-300">Does it turn on?</p>
                            <div className="grid grid-cols-2 gap-4">
                                <RadioButton label="Yes" state={turnsOn} setState={setTurnsOn} value={0} />
                                <RadioButton label="No" state={turnsOn} setState={setTurnsOn} value={1} />
                            </div>
                            <button onClick={() => setStep(2)} disabled={!selectedModel || turnsOn === null} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <p className="text-sm font-medium dark:text-gray-300">Unlocked & EMI Free?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <RadioButton label="Yes" state={isUnlocked} setState={setIsUnlocked} value={0} />
                            <RadioButton label="No" state={isUnlocked} setState={setIsUnlocked} value={1} />
                        </div>
                        <p className="text-sm font-medium dark:text-gray-300">Any Liquid Damage?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <RadioButton label="No" state={liquidDamage} setState={setLiquidDamage} value={0} />
                            <RadioButton label="Yes" state={liquidDamage} setState={setLiquidDamage} value={1} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="w-1/2 border py-3 rounded-xl dark:text-white">Back</button>
                            <button onClick={() => setStep(3)} disabled={isUnlocked === null} className="w-1/2 bg-blue-600 text-white py-3 rounded-xl font-bold">Next</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <p className="text-sm font-medium dark:text-gray-300">Visual Condition</p>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(CONDITION_MULTIPLIERS).map(c => <RadioButton key={c} label={c} state={deviceCondition} setState={setDeviceCondition} value={c} />)}
                        </div>
                        <button onClick={calculatePrice} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg">Calculate Price</button>
                    </div>
                )}

                {showResult && price !== null && (
                    <div className="mt-8 p-8 bg-blue-50 dark:bg-blue-900/20 rounded-3xl text-center border-2 border-blue-200 dark:border-blue-800">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <h2 className="text-xl font-bold dark:text-white text-gray-900">Estimated Value</h2>
                        <p className="text-5xl font-black text-blue-700 dark:text-blue-400 my-4">${price}</p>
                        <Link href="/contact-us" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-bold">Sell Now</Link>
                    </div>
                )}
            </div>
        </div>
    );
}