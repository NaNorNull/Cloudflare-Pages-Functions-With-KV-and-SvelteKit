# Cloudflare-Pages-Functions-With-KV-and-SvelteKit

Cloudflare Page Functions that also use KV (also for Sveltekit and Wrangler2)

These are two functioning examples of using KV with Cloudflare Page Functions

It also defines the command to use in Wrangler2 for local development

At this point Wrangler2 does not update the Cloudflare KV when running dev locally.
This example copies the KV values from the server to the local store to prepopulate it.
This is useful when developing locally.  The "kvName" should be the name in the binding
found in the Cloudflare Pages, Settings, Functions, KV namespace bindings.  This should 
not be run in production since it exposes all data.

Wrangler2 directly on a "public" directory:
```
npx wrangler@beta pages dev public -k kvName
```
Wrangler2 using SvelteKit:
```
npm run build
npx wrangler@beta pages dev .svelte-kit\cloudflare\ -k kvName
```

Make sure there is no "functions" directory when using SvelteKit.

This is based on beta features and may not work in the final release of Wrangler2
