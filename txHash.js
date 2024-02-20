const { Web3 } = require("web3");
const { abi } = require("./abi.json");
const BigNumber = require('bignumber.js');
const axios = require('axios');
//erc20 token transfer abi
const erc20 = [
  {
    indexed: true,
    name: "from",
    type: "address",
  },
  {
    indexed: true,
    name: "to",
    type: "address",
  },
  {
    indexed: false,
    name: "value",
    type: "uint256",
  },
];
const erc20ABI = [
    // Read-only functions
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];

async function getTokenInfo(address, web3) {
    try {
        const erc20Contract = new web3.eth.Contract(erc20ABI, address);
        const name = await erc20Contract.methods.name().call();
        const symbol = await erc20Contract.methods.symbol().call();
        const decimals = await erc20Contract.methods.decimals().call();
        // console.log('Token Name:', name);
        // console.log('Token Symbol:', symbol);
        return {name, symbol, decimals}
    } catch (error) {
        console.error('Error:', error);
        
    }
}

//decode token transaction logs
const decodeLogs = async (fees, log, web3) => {
  try {
    let topic0 =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; //transfer log
    if (topic0 == log.topics[0]) {
      let decode = web3.eth.abi.decodeLog(erc20, log.data, [
        log.topics[1],
        log.topics[2],
      ]);
        let info = await getTokenInfo(log.address, web3);
        let block = await web3.eth.getBlock(log.blockNumber);
        let time = Number(block.timestamp) * 1000;
        console.log({
          hash: log.transactionHash,
          tokenName: info.name,
          tokenSymbol: info.symbol,
          tokenAddress: log.address,
          fromAddress: decode.from,
          toAddress: decode.to,
          amount: new BigNumber(decode.value).dividedBy(10 ** (String(info.decimals))).toFixed(),
          fees: new BigNumber(fees).dividedBy(10**18).toFixed(),
          time: new Date(time).toUTCString()
        });
    }
  } catch (error) {
    console.log("decodeLogs error ", error);
  }
};

async function getTransactionDetails(network, transactionHash) {
  let web3;
  switch (network.toLowerCase()) {
    case "polygon":
      web3 = new Web3("https://rpc-mainnet.maticvigil.com");
      break;
    case "eth":
      web3 = new Web3("https://go.getblock.io/74e831f4955e4ae59122864fa4c6a9c3");
      break;
    case "bsc":
      web3 = new Web3("https://bsc-dataseed.binance.org/");
      break;
    case "tron":
        await getTokenTransactionsInTron(transactionHash)
        break;
    default:
      throw new Error("Unsupported network");
  }
  let transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
  let transaction = await web3.eth.getTransaction(transactionHash);
  let fees = new BigNumber(transaction.gasPrice).times(transactionReceipt.gasUsed).toFixed();
  // console.log(transactionReceipt);
  if (!transactionReceipt) {
    throw new Error("Transaction not found");
  }
  for (let i = 0; i < transactionReceipt.logs.length; i++) {
    await decodeLogs(fees, transactionReceipt.logs[i], web3);
  }
}

async function getTokenTransactionsInTron(transactionHash) {
    try {
        const response = await axios.get(`https://apilist.tronscanapi.com/api/transaction-info?hash=${transactionHash}`);
        const transactionInfo = response.data.trc20TransferInfo;
        // console.log(response.data)
        for(let i=0; i<transactionInfo.length; i++) {
            let fees = await getTronFees(response.data.hash);
            let tx_obj = {
                hash: response.data.hash,
                time: new Date(response.data.timestamp).toUTCString(),
                contract_address: transactionInfo[i].contract_address,
                name: transactionInfo[i].name,
                symbol: transactionInfo[i].symbol,
                from_address: transactionInfo[i].from_address,
                to_address: transactionInfo[i].to_address,
                amount: new BigNumber(transactionInfo[i].amount_str).dividedBy(10 ** transactionInfo[i].decimals).toFixed(),
                fees: new BigNumber(fees).dividedBy(1000000).toFixed(),
            }
            console.log(tx_obj)
        }
    } catch (error) {
        throw new Error(`Error fetching transaction details: ${error.message}`);
    }
}

async function getTronFees(transactionId) {
  try {
    const options = {
      method: "post",
      url: "https://api.trongrid.io/wallet/gettransactioninfobyid",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      data: {
        value: transactionId,
      },
    };
    const response = await axios(options);
    // console.log(response.data)
    if(response.data.fee) {
      return response.data.fee;
    }
    else {
      return 0;
    }
  } catch (error) {
    throw error;
  }
}

const network = "tron"; //polygon,eth,bsc,tron
const transactionHash =
  "b4f84b49e7d5c7a822051af8a053f4391267ea4c1656173436bba48456e51291";
getTransactionDetails(network, transactionHash)
  .then(() => console.log("Transaction details fetched successfully"))
  .catch((error) => console.error("Error:", error.message));
