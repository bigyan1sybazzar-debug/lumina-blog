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
    addRandomSuffix?: boolean; // Vercel specific, ignored for R2 (we use direct path)
    contentType?: string;
    token?: string; // Vercel specific
    allowOverwrite?: boolean; // Vercel specific
};

export type StorageListOptions = {
    prefix?: string;
    limit?: number;
    token?: string;
};

export const storage = {
    async put(path: string, body: string | Buffer | ReadableStream, options: StoragePutOptions): Promise<{ url: string }> {
        if (USE_R2 && r2) {
            try {
                // For R2, if addRandomSuffix is false (default intent for overwrites), we use key directly.
                // If it were true, we'd need to append random chars. Assuming false for migration consistency.
                const key = path;

                // Convert body if needed. S3 client accepts string, buffer, stream.
                // TextEncoder for string to ensure correct length measurement if needed, but aws-sdk handles strings.

                await r2.send(new PutObjectCommand({
                    Bucket: R2_BUCKET,
                    Key: key,
                    Body: body as any,
                    ContentType: options.contentType || 'application/json',
                    // ACL is often not supported on R2 depending on bucket settings, omitting for safety
                }));

                return { url: `${R2_PUBLIC_DOMAIN}/${key}` };
            } catch (error) {
                console.error('R2 Put Error:', error);
                throw error;
            }
        } else {
            // Vercel Blob Fallback
            return await putVercel(path, body, options); // options are compatible
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

                const blobs = (response.Contents || []).map(item => ({
                    url: `${R2_PUBLIC_DOMAIN}/${item.Key}`,
                    pathname: item.Key || '',
                    uploadedAt: item.LastModified || new Date(),
                }));

                return { blobs };
            } catch (error) {
                console.error('R2 List Error:', error);
                // Fail gracefully or throw? Vercel list throws.
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
