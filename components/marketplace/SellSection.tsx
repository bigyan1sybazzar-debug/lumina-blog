'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPhoneListing } from '../../services/marketplaceService';
import { Loader2, Upload, X, CheckCircle } from 'lucide-react';

export const SellSection: React.FC = () => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        brand: 'Apple',
        model: '',
        storage: '',
        condition: 'Used',
        price: '',
        location: '',
        contactInfo: '',
        description: ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !imageFile) {
            alert("Please login and select an image.");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload Image to Vercel Blob
            const filename = `phone-${Date.now()}-${imageFile.name}`;
            const uploadRes = await fetch(`/api/upload?filename=${filename}`, {
                method: 'POST',
                body: imageFile,
            });

            if (!uploadRes.ok) throw new Error('Image upload failed');
            const blobData = await uploadRes.json();
            const imageUrl = blobData.url;

            // 2. Create Listing
            await createPhoneListing({
                sellerId: user.id,
                sellerName: user.name,
                sellerAvatar: user.avatar,
                brand: formData.brand,
                model: formData.model,
                storage: formData.storage,
                condition: formData.condition as any,
                price: Number(formData.price),
                currency: 'NPR',
                images: [imageUrl],
                location: formData.location,
                contactInfo: formData.contactInfo,
                description: formData.description,
                status: 'pending'
            });

            setSuccess(true);
            setFormData({ brand: 'Apple', model: '', storage: '', condition: 'Used', price: '', location: '', contactInfo: '', description: '' });
            setImageFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error("Failed to post listing:", error);
            alert("Failed to post listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-200">
                <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Listing Posted!</h2>
                <p className="text-gray-500 mb-6">Your phone is now live on the marketplace.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                    Sell Another Phone
                </button>
            </div>
        );
    }

    if (!user) {
        return <div className="text-center py-20">Please login to sell phones.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Sell Your Phone</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                        <select
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="Apple">Apple</option>
                            <option value="Samsung">Samsung</option>
                            <option value="OnePlus">OnePlus</option>
                            <option value="Xiaomi">Xiaomi</option>
                            <option value="Google">Google</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. iPhone 13 Pro"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Storage / RAM</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. 128GB / 8GB"
                            value={formData.storage}
                            onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                        <select
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="New">Brand New (Sealed)</option>
                            <option value="Like New">Like New</option>
                            <option value="Used">Used</option>
                            <option value="Refurbished">Refurbished</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (NPR)</label>
                        <input
                            required
                            type="number"
                            placeholder="e.g. 50000"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Kathmandu, Baneshwor"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                        rows={3}
                        placeholder="Any defects? Accesories included?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone/WhatsApp</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g. 98XXXXXXXX"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Device Photo (Cover)</label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                        {previewUrl ? (
                            <div className="relative w-full h-48">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Click to upload photo</p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : 'Post Listing'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">By posting, you agree to our marketplace terms.</p>
                </div>
            </form>
        </div>
    );
};
