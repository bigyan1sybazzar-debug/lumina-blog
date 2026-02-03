# HTTP Stream Proxy Solution

## Problem
Modern browsers block **Mixed Content** - loading HTTP resources on HTTPS pages. This causes errors like:
```
Mixed Content: The page at 'https://bigyann.com.np/tools/live-tv' was loaded over HTTPS, 
but requested an insecure frame 'http://138.2.160.168:8080/fetch?COSMOTESPORT1'
```

## Solution
We've implemented a **server-side proxy** that:
1. Accepts HTTPS requests from the frontend
2. Fetches HTTP streams server-side (where mixed content rules don't apply)
3. Returns the stream content over HTTPS to the browser

## How It Works

### 1. Proxy API Endpoint
**File:** `pages/api/stream-proxy.ts`

This Next.js API route:
- Receives requests like: `https://bigyann.com.np/api/stream-proxy?url=http://138.2.160.168:8080/stream`
- Fetches the HTTP stream server-side
- Rewrites M3U8 playlist URLs to also go through the proxy
- Returns the content over HTTPS

**Security Features:**
- Only allows specific IP patterns (138.2.160.168:8080, etc.)
- Validates URLs before proxying
- Sets proper CORS headers

### 2. Frontend Integration
**File:** `components/LiveSection.tsx`

The `upgradeToHttps()` helper function:
```typescript
const upgradeToHttps = (url: string): string => {
    if (url.startsWith('http://')) {
        return `/api/stream-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};
```

This automatically routes all HTTP URLs through the proxy.

### 3. HLS Player Support
**File:** `components/HLSPlayer.tsx`

The HLS player:
- Detects HTTP URLs and routes them through the proxy
- Rewrites segment URLs in M3U8 playlists
- Handles both master playlists and media segments

## Usage

No changes needed in your database! The system automatically:
1. Detects HTTP URLs
2. Routes them through the proxy
3. Serves them securely over HTTPS

## Example Flow

**Original URL in Database:**
```
http://138.2.160.168:8080/fetch?COSMOTESPORT1
```

**Automatically Converted To:**
```
https://bigyann.com.np/api/stream-proxy?url=http%3A%2F%2F138.2.160.168%3A8080%2Ffetch%3FCOSMOTESPORT1
```

**Result:**
✅ Stream loads successfully on HTTPS page
✅ No mixed content errors
✅ Works with HLS streams and iframes

## Adding More Allowed Domains

Edit `pages/api/stream-proxy.ts` and add patterns to the `allowedPatterns` array:

```typescript
const allowedPatterns = [
    /^http:\/\/138\.2\.160\.168:8080\//,
    /^http:\/\/your-new-domain\.com\//,  // Add new patterns here
];
```

## Troubleshooting

### Stream Still Not Loading?
1. Check browser console for errors
2. Verify the stream works in VLC with the HTTP URL
3. Check if the server supports range requests
4. Try accessing the proxy URL directly: `https://bigyann.com.np/api/stream-proxy?url=YOUR_HTTP_URL`

### CORS Errors?
The proxy sets CORS headers automatically. If you still see CORS errors, the stream server might be blocking requests.

### Performance Issues?
The proxy adds a small overhead. For better performance:
- Ask the stream provider to support HTTPS
- Use a CDN with HTTPS support
- Consider caching frequently accessed streams
