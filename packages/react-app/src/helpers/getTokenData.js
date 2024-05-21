
const chains = {
    10: 'optimism',
    534352: 'scroll'
}

const chainsAddresses = {
    'optimism': '0x5d470270e889b61c08C51784cDC73442c4554011',
    'scroll': '0x2bC16Bf30435fd9B3A3E73Eb759176C77c28308D'
}

const cache = {}

export async function getTokenData(chainId, id) {
    id = parseInt(id)
   let result
    if (cache[chainId + ' ' + id]) {
        result = cache[chainId + ' ' + id]
    }
    
    
    if (!result) {
        try {
            console.log('getTokenData', id)
            result = await fetch(`https://remix-reward-api.vercel.app/api-${chains[chainId]}/${id}`)
            console.log('getTokenData response', id)
            result = await result.json()
            cache[chainId + ' ' + id] = result
        } catch (e) {
            return {
                tokenType: `token type ${id}`,
                payload: `payload ${id}`,
                hash: null
            }
        }
    }
    result.data.push(result.image)
    return result.data
}

export async function getEnsName(address) {
    let result
    if (cache['ens_' + address]) {
        result = cache['ens_' + address]
    } else {
        try {
            result = await fetch(`https://remix-reward-api.vercel.app/ens/${address}`)
            result = await result.json()
            cache['ens_' + address] = result            
        } catch (e) {
            return undefined
        }
    }
    return result.name
}
  