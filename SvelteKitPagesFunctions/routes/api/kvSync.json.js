// Hacky approach to save CloudFlare KVs locally for setup of 
// in Wrangler2 pages functions dev.  This must be saved to Cloudflare Pages
// via the GitHub pages process first.  Deploy .svelte-kit\cloudflare\
// This is the method for use with SvelteKit JSON API
// SvelteKit passes the env data via the context.platform.env
// Change the deployed site name below in the code.

// Update the "nameOfTheKV" to match what is setup in the pages function setup
//   npm run build
//   npx wrangler@beta pages dev .svelte-kit\cloudflare\ -k nameOfTheKV

export async function get(context) {
	try {
		if (context?.clientAddress === "127.0.0.1") {
			// Running locally, get the remote kvs and store locally
			console.log("Local")
			// Update this to the deployed site!
			const url = "https://deployedSiteName.pages.dev/api/kvSync.json"
			const remoteKVs = await getRemoteData(url)
			saveToLocalKVs(remoteKVs, context?.platform?.env)
			return {
				status: 200,
				body: remoteKVs
			}
		} else {
			// running in CloudFlare - list the KVs
			let allKVs = []
			// dymanically look for databases in env
			// note that platform is defined via SvelteKit
			// context.env would be used generically
			let envKeys = Object.keys(context?.platform?.env)
			for (let i = 0; i < envKeys.length; i++) {
				const dbName = envKeys[i]
				if (typeof context.platform.env[dbName]?.list === "function") {
					console.log("db " + dbName)
					allKVs.push({
						"name": dbName,
						"KV": await getKVData(context.platform.env[dbName])
					})
				}
			}

			return {
				status: 200,
				body: { allKVs }
			}
		}
	}
	catch (error) {
		return {
			status: 500,
			body: {
				error: 'Could not fetch KV. ' + error
			}
		}
	}
}

function getKVData(aKV) {
	return aKV.list().then(aKeyList => {
		const allKVData = aKeyList.keys.map(aKey => {
			return aKV.get(aKey.name).then(aValue => {
				return { key: aKey, value: aValue }
			})
		})
		return Promise.all(allKVData)
	})
}

async function getRemoteData(url) {
	const response = await fetch(url);
	const someJSON = await response.json()
	return someJSON
}

function saveToLocalKVs(remoteKVs, env) {
	remoteKVs?.allKVs?.forEach(db => {
		console.log("save db " + db.name)
		db.KV.forEach(aKV => {
			console.log("  kv " + aKV.key.name + " - " + aKV.value)
			env[db.name]?.put?.(aKV.key.name, aKV.value)
		})
	})
}
