// src/pages/My-phone-price.tsx (Updated with Header and Footer)

import React, { useState, useMemo, useCallback } from 'react';
import { Header } from '../components/Header'; // Imported Header
import { Footer } from '../components/Footer'; // Imported Footer
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
import { Link } from 'react-router-dom';

// --- Expanded Data Definitions ---

// Core Brands (Global focus)
const BRANDS = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi/Redmi', 'Oppo/Realme', 'Vivo', 'Motorola', 'Other/Local'];

// Expanded Models List grouped by tier and popularity
const MODELS = {
    Apple: [
        // Premium/Recent Flagships
        'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
        'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14',
        // Midrange/Older Flagships
        'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12 Pro', 'iPhone 12',
        // Budget/SE
        'iPhone SE (3rd Gen)', 'iPhone 11', 'iPhone XR',
    ],
    Samsung: [
        // Premium Flagships (S Ultra, Fold, Flip)
        'Galaxy S24 Ultra', 'Galaxy S23 Ultra', 'Galaxy S22 Ultra', 
        'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 
        // Midrange Flagships (S/Note Series)
        'Galaxy S21 FE', 'Galaxy Note 20',
        // Midrange (A Series - high sales in India/Nepal/USA)
        'Galaxy A54', 'Galaxy A34', 'Galaxy M34', 
        // Budget (A Series)
        'Galaxy A14', 'Galaxy A05',
    ],
    'Google': [
        // Premium/Flagship
        'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel Fold',
        // Midrange (A Series)
        'Pixel 7a', 'Pixel 6a', 'Pixel 5',
    ],
    OnePlus: [
        // Premium/Flagship
        'OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro',
        // Midrange (Nord Series - Popular in India/Nepal)
        'OnePlus Nord 3', 'OnePlus Nord 2T', 'OnePlus Nord CE 3',
    ],
    'Xiaomi/Redmi': [
        // Flagship (Xiaomi/Poco F/GT)
        'Xiaomi 14 Pro', 'Xiaomi 13 Ultra', 'Poco F5',
        // Midrange (Redmi Note/K Series - huge in China/India/Nepal)
        'Redmi Note 13 Pro', 'Redmi Note 12 Pro', 'Redmi K60 Ultra',
        // Budget
        'Redmi 12', 'Redmi 10 Power',
    ],
    'Oppo/Realme': [
        // Flagship (Find Series)
        'Oppo Find X6 Pro', 'Realme GT 5 Pro',
        // Midrange (Reno/Number Series)
        'Oppo Reno 10', 'Realme 11 Pro+', 'Realme 10',
        // Budget
        'Oppo A58', 'Realme C55',
    ],
    Vivo: [
        // Premium (X Series)
        'Vivo X100 Pro', 'Vivo X90 Pro',
        // Midrange (V/iQOO Series - high presence in India/China)
        'Vivo V29', 'iQOO 12', 'Vivo Y100',
    ],
    Motorola: [
        // Flagship (Edge Series)
        'Motorola Edge + (2023)', 'Motorola Razr+',
        // Midrange (G/E Series)
        'Moto G54', 'Moto G84',
    ],
    'Other/Local': ['Generic Flagship Android', 'Generic Midrange Android', 'Generic Budget Android', 'Generic Feature Phone'],
};

// --- Base Prices (Simulated USD/Fair Condition) ---
// Note: These are simplified relative values for trade-in estimation
const BASE_PRICES: { [key: string]: number } = {
    // Apple Premium
    'iPhone 15 Pro Max': 1000, 'iPhone 15 Pro': 900, 'iPhone 15 Plus': 750, 'iPhone 15': 650,
    'iPhone 14 Pro Max': 800, 'iPhone 14 Pro': 700, 'iPhone 14': 550,
    // Apple Midrange/Budget
    'iPhone 13 Pro Max': 550, 'iPhone 13': 450, 'iPhone 12 Pro': 350, 'iPhone 12': 300,
    'iPhone SE (3rd Gen)': 150, 'iPhone 11': 180, 'iPhone XR': 100,

    // Samsung Premium
    'Galaxy S24 Ultra': 950, 'Galaxy S23 Ultra': 800, 'Galaxy S22 Ultra': 650, 
    'Galaxy Z Fold 5': 1100, 'Galaxy Z Flip 5': 650, 
    // Samsung Midrange
    'Galaxy S21 FE': 280, 'Galaxy Note 20': 250, 'Galaxy A54': 150, 'Galaxy A34': 100, 
    // Samsung Budget
    'Galaxy M34': 80, 'Galaxy A14': 60, 'Galaxy A05': 40,

    // Google
    'Pixel 8 Pro': 750, 'Pixel 8': 600, 'Pixel 7 Pro': 500, 'Pixel Fold': 850,
    'Pixel 7a': 250, 'Pixel 6a': 180, 'Pixel 5': 150,

    // OnePlus
    'OnePlus 12': 700, 'OnePlus 11': 550, 'OnePlus 10 Pro': 400,
    'OnePlus Nord 3': 200, 'OnePlus Nord 2T': 150, 'OnePlus Nord CE 3': 100,

    // Xiaomi/Redmi
    'Xiaomi 14 Pro': 600, 'Xiaomi 13 Ultra': 550, 'Poco F5': 300,
    'Redmi Note 13 Pro': 150, 'Redmi Note 12 Pro': 100, 'Redmi K60 Ultra': 250,
    'Redmi 12': 70, 'Redmi 10 Power': 50,
    
    // Oppo/Realme
    'Oppo Find X6 Pro': 500, 'Realme GT 5 Pro': 450,
    'Oppo Reno 10': 180, 'Realme 11 Pro+': 150, 'Realme 10': 90,
    'Oppo A58': 70, 'Realme C55': 50,

    // Vivo
    'Vivo X100 Pro': 600, 'Vivo X90 Pro': 500,
    'Vivo V29': 180, 'iQOO 12': 300, 'Vivo Y100': 100,
    
    // Motorola
    'Motorola Edge + (2023)': 450, 'Motorola Razr+': 550,
    'Moto G54': 100, 'Moto G84': 120,
    
    // Generic/Other
    'Generic Flagship Android': 300, 'Generic Midrange Android': 80, 'Generic Budget Android': 40, 'Generic Feature Phone': 10,
};

// Condition multipliers (Based on your three tiers)
const CONDITION_MULTIPLIERS: { [key: string]: number } = {
    'Like New': 1.1,
    'Fair': 1.0,
    'Poor': 0.7,
};

// --- Multipliers for the new questions ---
const YES_NO_MULTIPLIERS = {
    // 0 = Yes, 1 = No (The state value)
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

// Accessory and Purchase Date Multipliers
const ACCESSORY_BONUS = 1.05; // 5% bonus for original accessories
const PURCHASE_DATE_BONUS = 1.1; // 10% bonus for less than 9 months old

// --- Component ---

export const MyPhonePrice: React.FC = () => {
    // --- Form State ---
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    
    // New States for Detailed Checks (0 = Yes, 1 = No)
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

    // New States for Condition/Date/Accessories
    const [deviceCondition, setDeviceCondition] = useState<string>(''); 
    const [accessories, setAccessories] = useState<0 | 1 | null>(null);
    const [purchaseDate, setPurchaseDate] = useState<0 | 1 | null>(null); 

    // --- Display State ---
    const [price, setPrice] = useState<number | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1); 

    // --- Helper Functions ---
    
    const availableModels = useMemo(() => {
        return selectedBrand ? MODELS[selectedBrand as keyof typeof MODELS] || [] : [];
    }, [selectedBrand]);

    const handleInputChange = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setter(value);
        setShowResult(false);
        setError(null);
        if (setter === setSelectedBrand) {
            setSelectedModel(''); 
        }
    }, []);

    const validateStep1 = () => {
        if (!selectedModel || turnsOn === null || screenLightsUp === null || freeOfCracks === null) {
            setError("Please select a model and answer all initial questions.");
            return false;
        }
        setError(null);
        return true;
    };
    
    const validateStep2 = () => {
        if (isUnlocked === null || liquidDamage === null || canCall === null || boardRepaired === null || wifiBluetoothFaceID === null) {
            setError("Please answer all questions in this section.");
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep3 = () => {
        if (cameraProblem === null || speakersFlashlightMic === null || !deviceCondition || accessories === null || purchaseDate === null) {
            setError("Please answer all questions in this final section.");
            return false;
        }
        setError(null);
        return true;
    };

    // --- Main Calculation Logic ---
    const calculatePrice = () => {
        setError(null);
        setShowResult(false);
        setPrice(null);

        if (!validateStep3()) return;

        // 1. Get Base Price
        const modelKey = selectedModel;
        const initialBasePrice = BASE_PRICES[modelKey] || 150; // Fallback price
        
        let finalPrice = initialBasePrice;

        // 2. Apply Condition Multiplier
        const conditionMultiplier = CONDITION_MULTIPLIERS[deviceCondition] || 1.0;
        finalPrice *= conditionMultiplier;

        // 3. Apply Detailed Check Multipliers (Yes/No questions)
        
        // a. Simple Pass/Fail checks (0=Yes/Working, 1=No/Broken)
        finalPrice *= YES_NO_MULTIPLIERS.turnsOn[turnsOn!];
        finalPrice *= YES_NO_MULTIPLIERS.screenLightsUp[screenLightsUp!];
        finalPrice *= YES_NO_MULTIPLIERS.freeOfCracks[freeOfCracks!];
        finalPrice *= YES_NO_MULTIPLIERS.isUnlocked[isUnlocked!];
        finalPrice *= YES_NO_MULTIPLIERS.canCall[canCall!];
        finalPrice *= YES_NO_MULTIPLIERS.boardRepaired[boardRepaired!];
        finalPrice *= YES_NO_MULTIPLIERS.wifiBluetoothFaceID[wifiBluetoothFaceID!];
        finalPrice *= YES_NO_MULTIPLIERS.speakersFlashlightMic[speakersFlashlightMic!];
        
        // b. Inverted Logic Checks (1=Yes/Damage/Problem, 0=No)
        finalPrice *= (liquidDamage === 1 ? YES_NO_MULTIPLIERS.liquidDamage[1] : YES_NO_MULTIPLIERS.liquidDamage[0]);
        finalPrice *= (cameraProblem === 1 ? YES_NO_MULTIPLIERS.cameraProblem[1] : YES_NO_MULTIPLIERS.cameraProblem[0]);

        // 4. Apply Accessory Bonus
        if (accessories === 0) { 
            finalPrice *= ACCESSORY_BONUS;
        }

        // 5. Apply Purchase Date Bonus
        if (purchaseDate === 0) { 
            finalPrice *= PURCHASE_DATE_BONUS;
        }
        
        // Safety check: If any critical component is totally non-functional, cap the price low
        if (turnsOn === 1 || boardRepaired === 1 || liquidDamage === 1) {
            finalPrice = Math.max(finalPrice, 50); 
        }

        setPrice(Math.round(finalPrice)); 
        setShowResult(true);
    };
    
    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
            window.scrollTo(0, 0); 
        } else if (step === 2 && validateStep2()) {
            setStep(3);
            window.scrollTo(0, 0); 
        }
    };
    
    const handlePrev = () => {
        setStep(step - 1);
        setError(null);
        setShowResult(false);
        window.scrollTo(0, 0);
    };

    // --- Rendering Helpers ---
    const RadioButton = ({ label, state, setState, value, icon }: { label: string, state: any, setState: React.Dispatch<React.SetStateAction<any>>, value: any, icon?: React.ReactNode }) => (
        <button
            onClick={() => handleInputChange(setState, value)}
            className={`py-3 px-4 text-sm font-semibold rounded-xl transition-all border flex items-center justify-center gap-2 w-full text-center
                ${state === value 
                    ? 'bg-primary-600 text-white border-primary-700 shadow-lg shadow-primary-500/30' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        // Wrap the entire component content in a React fragment or div
        <>
            {/* 1. RENDER HEADER HERE */}
            <Header />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-10 md:p-12 border border-gray-100 dark:border-gray-800">
                    
                    {/* Header (Title Section inside the card) */}
                    <div className="text-center mb-10">
                        <Calculator className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Smartphone Resale Estimator
                        </h1>
                        <p className="mt-2 text-md text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                            Step {step} of 3: Detailed assessment for the most accurate trade-in value.
                        </p>
                    </div>

                    {/* --- STEP 1: DEVICE & SCREEN CONDITION --- */}
                    {step === 1 && (
                        <div className="space-y-8">
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <Smartphone className="w-6 h-6 text-primary-500" /> Device Identification
                            </div>
                            
                            {/* 1. Select Brand */}
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Device Brand
                                </label>
                                <select
                                    id="brand"
                                    value={selectedBrand}
                                    onChange={(e) => handleInputChange(setSelectedBrand, e.target.value)}
                                    className="mt-1 block w-full py-3 px-4 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                                >
                                    <option value="" disabled>Choose Phone Manufacturer</option>
                                    {BRANDS.map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Select Model */}
                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Device Model
                                </label>
                                <select
                                    id="model"
                                    value={selectedModel}
                                    onChange={(e) => handleInputChange(setSelectedModel, e.target.value)}
                                    disabled={!selectedBrand}
                                    className={`mt-1 block w-full py-3 px-4 border rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white 
                                        ${!selectedBrand 
                                            ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                                        }`}
                                >
                                    <option value="" disabled>
                                        {selectedBrand ? `Select model for ${selectedBrand}` : 'Select a brand first'}
                                    </option>
                                    {availableModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>

                            {/* --- Screen Checks --- */}
                            <div className="pt-4 space-y-4">
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <BatteryCharging className="w-5 h-5 text-purple-500" /> Power & Display Checks
                                </div>
                                
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Does it turn on?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <RadioButton label="Yes" state={turnsOn} setState={setTurnsOn} value={0} />
                                    <RadioButton label="No" state={turnsOn} setState={setTurnsOn} value={1} />
                                </div>

                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Do all parts of the screen light up correctly?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <RadioButton label="Yes" state={screenLightsUp} setState={setScreenLightsUp} value={0} />
                                    <RadioButton label="No" state={screenLightsUp} setState={setScreenLightsUp} value={1} />
                                </div>

                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Is it free of cracks and major scratches?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <RadioButton label="Yes" state={freeOfCracks} setState={setFreeOfCracks} value={0} />
                                    <RadioButton label="No" state={freeOfCracks} setState={setFreeOfCracks} value={1} />
                                </div>
                            </div>

                        </div>
                    )}

                    {/* --- STEP 2: LEGAL & INTERNAL DAMAGE --- */}
                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <Shield className="w-6 h-6 text-primary-500" /> Legal & Internal Status
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Is your phone factory unlocked, MDMS registered and EMI free?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="Yes" state={isUnlocked} setState={setIsUnlocked} value={0} />
                                <RadioButton label="No" state={isUnlocked} setState={setIsUnlocked} value={1} />
                            </div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2 flex items-center">
                                <Droplet className="w-4 h-4 mr-1 text-blue-500" />
                                Has your phone ever had liquid damage?
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="No" state={liquidDamage} setState={setLiquidDamage} value={0} />
                                <RadioButton label="Yes" state={liquidDamage} setState={setLiquidDamage} value={1} />
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Does your phone make or receive calls?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="Yes" state={canCall} setState={setCanCall} value={0} />
                                <RadioButton label="No" state={canCall} setState={setCanCall} value={1} />
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Have you ever repaired or replaced the main board?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="No" state={boardRepaired} setState={setBoardRepaired} value={0} />
                                <RadioButton label="Yes" state={boardRepaired} setState={setBoardRepaired} value={1} />
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Is your Wi-Fi, Bluetooth, and Face ID/Touch ID working?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="Yes" state={wifiBluetoothFaceID} setState={setWifiBluetoothFaceID} value={0} />
                                <RadioButton label="No" state={wifiBluetoothFaceID} setState={setWifiBluetoothFaceID} value={1} />
                            </div>
                        </div>
                    )}
                    
                    {/* --- STEP 3: FUNCTIONALITY & FINAL DETAILS --- */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <Hash className="w-6 h-6 text-primary-500" /> Final Assessment
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Is there a problem with your camera (focus, flash, lens)?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="No" state={cameraProblem} setState={setCameraProblem} value={0} />
                                <RadioButton label="Yes" state={cameraProblem} setState={setCameraProblem} value={1} />
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Are your speakers, flashlight, or microphone working?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="Yes" state={speakersFlashlightMic} setState={setSpeakersFlashlightMic} value={0} />
                                <RadioButton label="No" state={speakersFlashlightMic} setState={setSpeakersFlashlightMic} value={1} />
                            </div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">What overall visual condition is your device in?</label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.keys(CONDITION_MULTIPLIERS).map((cond) => (
                                    <RadioButton key={cond} label={cond} state={deviceCondition} setState={setDeviceCondition} value={cond} />
                                ))}
                            </div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Do you have an original power adapter and cable?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="Yes" state={accessories} setState={setAccessories} value={0} />
                                <RadioButton label="No" state={accessories} setState={setAccessories} value={1} />
                            </div>
                            
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">When did you purchase this phone?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <RadioButton label="Less than 9 months" state={purchaseDate} setState={setPurchaseDate} value={0} />
                                <RadioButton label="More than 9 months" state={purchaseDate} setState={setPurchaseDate} value={1} />
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl flex items-center gap-3 shadow-md">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                        </div>
                    )}
                    
                    {/* Navigation Buttons */}
                    <div className="pt-10 flex justify-between">
                        {step > 1 && (
                            <button
                                onClick={handlePrev}
                                className="py-3 px-6 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:shadow-md"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2 inline" /> Previous
                            </button>
                        )}
                        
                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                // Simplified disabled check to prevent infinite re-render loop
                                disabled={
                                    (step === 1 && (!selectedModel || turnsOn === null || screenLightsUp === null || freeOfCracks === null)) ||
                                    (step === 2 && (isUnlocked === null || liquidDamage === null || canCall === null || boardRepaired === null || wifiBluetoothFaceID === null))
                                }
                                className={`py-3.5 px-6 rounded-xl text-white font-semibold transition-all shadow-lg hover:-translate-y-0.5 
                                    ${step === 1 ? 'ml-auto' : ''}
                                    ${((step === 1 && (!selectedModel || turnsOn === null)) || (step === 2 && isUnlocked === null))
                                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-primary-500/30'
                                    }`}
                            >
                                Next <ArrowRight className="w-4 h-4 ml-2 inline" />
                            </button>
                        ) : (
                            <button
                                onClick={calculatePrice}
                                disabled={!deviceCondition || accessories === null || purchaseDate === null}
                                className="w-full inline-flex justify-center items-center py-3.5 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                            >
                                <Calculator className="w-5 h-5 mr-2" />
                                Get Estimated Price
                            </button>
                        )}
                    </div>


                    {/* Result Display */}
                    {showResult && price !== null && (
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
                            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Estimated Trade-in Value
                            </h2>
                            <div className="mt-6 p-6 sm:p-8 bg-primary-50 dark:bg-primary-900/30 rounded-2xl shadow-xl border border-primary-100 dark:border-primary-900/50">
                                <p className="text-5xl sm:text-6xl font-extrabold text-primary-700 dark:text-primary-400">
                                    ${price}
                                </p>
                                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                                    For a **{deviceCondition} {selectedModel}**. 
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Note: This is an automated estimate. The final price depends on physical inspection.
                                </p>
                            </div>
                            
                            <Link
                                to="/contact-us"
                                className="mt-8 inline-flex items-center gap-3 px-6 py-3 text-sm font-semibold bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                            >
                                Contact a dealer to sell <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                </div>
            </div>
            
            {/* 2. RENDER FOOTER HERE */}
            <Footer />
        </>
    );
};