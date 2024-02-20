//Bsc chain

/** This file is for Listen token
 * USDT = 0x55d398326f99059fF775485246999027B3197955
 * BFI = 0xAFa4f3D72f0803B50C99663B3E90806d9D290770
 * MCOIN = 0x51610A14955e0233C815efc7ba4BD89592939c1e
 * BNB token
 * Etherium token = 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
 **/
const { default: BigNumber } = require("bignumber.js");
const { Web3 } = require("web3");
const web3 = new Web3(
  "wss://go.getblock.io/ad19cd42722e411b8ba0d8c1d368962e" //bsc mainnet
);
const { abi } = require("./abi.json");

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

//subscribe token transaction logs
const subscribe = async () => {
  const subscription = await web3.eth.subscribe("logs", {
    address: [
      "0x55d398326f99059fF775485246999027B3197955", //usdt
      "0xAFa4f3D72f0803B50C99663B3E90806d9D290770", // BFI
      "0x51610A14955e0233C815efc7ba4BD89592939c1e", //M-coin
      "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", //ETH
    ],
  });
  console.log("Websocket connected : ", subscription.id);
  subscription.on("data", async (data) => {
    try {
      // console.log(data);
      await decodeLogs(data);
    } catch (error) {
      console.log("subscribe error ", error);
    }
  });
};

//decode token transaction logs
const decodeLogs = async (log) => {
  // console.log(log)
  try {
    let topic0 =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"; //transfer log
    if (topic0 == log.topics[0]) {
      let decode = web3.eth.abi.decodeLog(erc20, log.data, [
        log.topics[1],
        log.topics[2],
      ]);
      let info = searchTokenByAddress(log.address);
      let txn = await web3.eth.getTransaction(log.transactionHash);
      let receipt = await web3.eth.getTransactionReceipt(log.transactionHash);
      let fees = new BigNumber(txn.gasPrice).times(receipt.gasUsed).toFixed();
      // console.log(receipt)
      console.log({
        hash:log.transactionHash,
        tokenName: info.name,
        tokenSymbol: info.symbol,
        tokenAddress: log.address,
        fromAddress: decode.from,
        toAddress: decode.to,
        amount: web3.utils.fromWei(decode.value, "ether"),
        fees: new BigNumber(fees).dividedBy(10 ** 18).toFixed(),
      });
    }
  } catch (error) {
    console.log("decodeLogs error ", error);
  }
};

//get token name and symbol
let tokendetails = [
    { name: "Ethereum Token", symbol: "ETH", address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" },
    { name: "USDT", symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955" },
    { name: "M-coin", symbol: "M-coin", address: "0x51610A14955e0233C815efc7ba4BD89592939c1e" },
    { name: "BFis.Finance", symbol: "BFI", address: "0xAFa4f3D72f0803B50C99663B3E90806d9D290770"}
];

function searchTokenByAddress(address) {
  for (let i = 0; i < tokendetails.length; i++) {
      if (tokendetails[i].address.toLowerCase() === address.toLowerCase()) {
          return tokendetails[i];
      }
  }
  return null; // Token not found
}

subscribe();



