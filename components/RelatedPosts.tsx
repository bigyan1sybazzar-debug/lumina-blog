import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '../types';

interface RelatedPostsProps {
    posts: BlogPost[];
}

const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return url.startsWith('/');
    }
};

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts }) => {
    return (
        <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
                <h3 className="text-xl font-bold mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
                    Related Posts
                </h3>
                <div className="space-y-8">
                    {posts.map((rp) => (
                        <Link
                            key={rp.id}
                            href={`/${rp.slug || rp.id}`}
                            className="block group transition-transform hover:translate-x-1"
                        >
                            <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-md relative">
                                <Image
                                    src={isValidUrl(rp.coverImage) ? rp.coverImage : 'https://placehold.co/600x400/1F2937/F3F4F6?text=No+Image'}
                                    alt={rp.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="(max-width: 1024px) 100vw, 33vw"
                                />
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 line-clamp-2">
                                {rp.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {new Date(rp.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default RelatedPosts;
