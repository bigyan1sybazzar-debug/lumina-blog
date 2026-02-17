import { put as putVercel, list as listVercel, type PutBlobResult, type ListBlobResult } from '@vercel/blob';
import { S3Client, PutObjectCommand, ListObjectsV2Command, type S3ClientConfig } from '@aws-sdk/client-s3';

// Configuration check
const USE_R2 = !!process.env.R2_ACCOUNT_ID && !!process.env.R2_ACCESS_KEY_ID;
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'static';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

let r2: S3Client | null = null;
if (USE_R2) {
    const config: S3ClientConfig = {
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
    };
    r2 = new S3Client(config);
}

export type StoragePutOptions = {
    access: 'public';
    addRandomSuffix?: boolean;
    contentType?: string;
    token?: string; // Vercel specific
    allowOverwrite?: boolean; // Vercel specific
};

export type StorageListOptions = {
    prefix?: string;
    limit?: number;
    token?: string;
};

// Helper to generate random suffix like Vercel Blob
function generateRandomSuffix() {
    return Math.random().toString(36).slice(2, 10);
}

export const storage = {
    async put(path: string, body: any, options: StoragePutOptions): Promise<{ url: string }> {
        if (USE_R2 && r2) {
            try {
                let key = path;
                if (options.addRandomSuffix) {
                    const lastDotIndex = path.lastIndexOf('.');
                    if (lastDotIndex !== -1) {
                        const name = path.substring(0, lastDotIndex);
                        const ext = path.substring(lastDotIndex);
                        key = `${name}-${generateRandomSuffix()}${ext}`;
                    } else {
                        key = `${path}-${generateRandomSuffix()}`;
                    }
                }

                // Handle ReadableStream if needed (Browser vs Node)
                let uploadBody = body;
                if (body instanceof ReadableStream && typeof Buffer !== 'undefined') {
                    // In Node.js environment, we might need to convert it or use chunks
                    // But AWS SDK v3 should handle it if nodejs_compat is on
                }

                await r2.send(new PutObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: key,
                    Body: uploadBody,
                    ContentType: options.contentType || 'application/octet-stream',
                }));

                const baseUrl = R2_PUBLIC_DOMAIN.endsWith('/') ? R2_PUBLIC_DOMAIN.slice(0, -1) : R2_PUBLIC_DOMAIN;
                return { url: `${baseUrl}/${key}` };
            } catch (error) {
                console.error('R2 Put Error:', error);
                throw error;
            }
        } else {
            // Vercel Blob Fallback
            return await putVercel(path, body, options);
        }
    },

    async list(options: StorageListOptions = {}): Promise<{ blobs: { url: string; pathname: string; uploadedAt: Date }[] }> {
        if (USE_R2 && r2) {
            try {
                const command = new ListObjectsV2Command({
                    Bucket: R2_BUCKET,
                    Prefix: options.prefix,
                    MaxKeys: options.limit
                });
                const response = await r2.send(command);

                const baseUrl = R2_PUBLIC_DOMAIN.endsWith('/') ? R2_PUBLIC_DOMAIN.slice(0, -1) : R2_PUBLIC_DOMAIN;
                const blobs = (response.Contents || []).map(item => ({
                    url: `${baseUrl}/${item.Key}`,
                    pathname: item.Key || '',
                    uploadedAt: item.LastModified || new Date(),
                }));

                return { blobs };
            } catch (error) {
                console.error('R2 List Error:', error);
                throw error;
            }
        } else {
            return await listVercel(options);
        }
    },

    isR2Configured(): boolean {
        return USE_R2;
    }
};

