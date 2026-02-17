'use server';

import {
    generateBlogOutline as serviceGenerateBlogOutline,
    generateFullPost as serviceGenerateFullPost,
    generateNewsPost as serviceGenerateNewsPost,
    generateBlogImage as serviceGenerateBlogImage
} from '../../services/geminiService';

export async function generateBlogOutline(topic: string) {
    return serviceGenerateBlogOutline(topic);
}

export async function generateFullPost(title: string, outline: string) {
    return serviceGenerateFullPost(title, outline);
}

export async function generateNewsPost(category: string) {
    return serviceGenerateNewsPost(category);
}

export async function generateBlogImage(prompt: string) {
    return serviceGenerateBlogImage(prompt);
}
