const axios = require('axios');

function satoshisToBTC(satoshis) {
    return satoshis / 100000000; // 1 BTC = 100,000,000 satoshis
}

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

async function main() {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question("Enter BTC transaction hash: ", async (transactionHash) => {
        const transactionDetails = await getTransactionDetails(transactionHash);
        if (transactionDetails) {
            // console.log(transactionDetails);
            let data = {
                hash: transactionDetails.hash,
                Amount: satoshisToBTC(transactionDetails.inputs[0].prev_out.value) + " BTC",
                fee: transactionDetails.fee + " Shatoshi",
                fromAddress: transactionDetails.inputs[0].prev_out.addr,
                toAddress: transactionDetails.out[0].addr
            }
            console.log(data);
        }
        readline.close();
    });
}

main();
