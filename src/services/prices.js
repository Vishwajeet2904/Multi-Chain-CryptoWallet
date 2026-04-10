const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=usd&include_24hr_change=true';

export async function getLivePrices() {
  try {
    const response = await fetch(COINGECKO_URL);
    if (!response.ok) throw new Error('Failed to fetch prices');
    
    const data = await response.json();
    
    return {
      ethereum: {
        usd: data.ethereum.usd,
        change: data.ethereum.usd_24h_change
      },
      solana: {
        usd: data.solana.usd,
        change: data.solana.usd_24h_change
      },
      bitcoin: {
        usd: data.bitcoin.usd,
        change: data.bitcoin.usd_24h_change
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Price fetch error:', error);
    // Fallback to mock prices if API fails
    return {
      ethereum: { usd: 2500, change: 0 },
      solana: { usd: 100, change: 0 },
      bitcoin: { usd: 45000, change: 0 },
      lastUpdated: new Date().toISOString(),
      isFallback: true
    };
  }
}
