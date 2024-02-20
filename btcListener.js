const axios = require('axios');

// Your Bitcoin address to monitor for deposits
const bitcoinAddress = 'bc1qmdmrtsr6yyu2792gs7dhm7ynxg5ca9j9wfuuwy';

// Bitcore API endpoint
const bitcoreAPI = 'https://api.bitcore.io/api/BTC/mainnet/';

// Function to fetch transactions for a given address
async function fetchTransactions(address) {
    try {
        const response = await axios.get(`${bitcoreAPI}address/${address}/txs`);
        // console.log('response ', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Function to monitor for new transactions
async function monitorDeposits() {
    console.log('Monitoring Bitcoin deposits for address:', bitcoinAddress);
    
    let latestTxId = ''; // Track the latest transaction ID to avoid processing duplicates
    
    setInterval(async () => {
        const transactions = await fetchTransactions(bitcoinAddress);
        if (transactions.length > 0) {
            const latestTx = transactions[0];
            console.log('latestTx ', latestTx.mintTxid);
            if (latestTx.mintTxid !== latestTxId) {
                // New transaction detected
                console.log('New transaction detected:', latestTx.mintTxid);
                const transactionDetails = await getTransactionDetails(latestTx.mintTxid); 
                console.log({
                    chain: latestTx.chain,
                    network: latestTx.network,
                    hash: latestTx.mintTxid,
                    value: Number(latestTx.value)/ 100000000,
                    address: latestTx.address,
                    fee: transactionDetails.fee + " Shatoshi",
                });
                
                latestTxId = latestTx.mintTxid;
            }
        }
    }, 5000); // Check every 10 seconds (adjust as needed)
}

// Start monitoring for deposits
monitorDeposits();

async function getTransactionDetails(transactionHash) {
    try {
        const response = await axios.get(`https://blockchain.info/rawtx/${transactionHash}`);
        const transactionDetails = response.data;
        return transactionDetails;
    } catch (error) {
        console.error("Error fetching transaction details:", error.response ? error.response.data : error.message);
        return null;
    }
}
