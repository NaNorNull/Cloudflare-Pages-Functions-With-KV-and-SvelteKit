// Hacky approach to save CloudFlare KVs locally for setup of 
// in Wrangler2 pages functions dev.  This must be saved to Cloudflare Pages
// via the GitHub pages process first.

// If you get a "Shimming" error make sure the functions directory is in the
// root of the project and not in the "public" or "dist" directory of the project
// Update the "nameOfTheKV" to match what is setup in the pages function setup
// and "public" to the distribution directory
//     npx wrangler@beta pages dev public -k nameOfTheKV

export async function onRequest(context) {

  try {
    if (context.request.url.includes("localhost")) {
      // Running locally, get the remote kvs and store locally
      console.log("Local")
      // Change this!
      const url = "https://nameOfTheSite.pages.dev/api/kvSync.json"
      const remoteKVs = await getRemoteData(url)
      saveToLocalKVs(remoteKVs, context?.env)
      return new Response(JSON.stringify(remoteKVs), {
        "status": 200, "headers": {
          'Content-Type': 'application/json' 
        }
      })
    } else {
      // running in CloudFlare - list the KVs
      let allKVs = []
      // dymanically look for databases in env
      // note that SvelteKit would define 
      // context.platform.env 
      let envKeys = Object.keys(context?.env)
      for (let i = 0; i < envKeys.length; i++) {
        const dbName = envKeys[i]
        if (typeof context.env[dbName]?.list === "function") {
          console.log("db " + dbName)
          allKVs.push({
            "name": dbName,
            "KV": await getKVData(context.env[dbName])
          })
        }
      }

      return new Response(JSON.stringify(allKVs), {
        "status": 200, "headers": {
          'Content-Type': 'application/json'
        }
      })
    }
  }
  catch (error) {
    return new Response('Could not fetch KV. ' + error, { "status": 500 })
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
