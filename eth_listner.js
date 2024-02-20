const { default: BigNumber } = require("bignumber.js");
const { Web3 } = require("web3");
const web3 = new Web3(
  "wss://go.getblock.io/8469aee77e4b448e904023bd3fad2194" //bsc mainnet
);

const target_address = "0xfe94A38BC902A9E094F2a3bE369F33eEe6E57e60";

//subscribe token transaction blocks
const subscribe = async () => {
  const subscription = await web3.eth.subscribe("newHeads");
  console.log("Websocket connected : ", subscription.id);
  subscription.on("data", async (data) => {
    try {
      console.log("New Block:  ", data.number);
      await getBlocks(data.number);
    } catch (error) {
      console.log("subscribe error ", error);
    }
  });
};

const getBlocks = async (number) => {
  try {
    let block = await web3.eth.getBlock(number, true);
    console.log("New Block ", block.number);
    let transactions = block.transactions;
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].from == target_address.toLowerCase()) {
        let fees = new BigNumber(transactions[i].gasPrice).times(transactions[i].gas).toFixed();
        console.log({
          hash: transactions[i].hash,
          from: transactions[i].from,
          to: transactions[i].to,
          fees: new BigNumber(fees).dividedBy(10 ** 18).toFixed(),
          value: new BigNumber(transactions[i].value)
            .dividedBy(10 ** 18)
            .toFixed(),
        });
      }
    }
  } catch (error) {}
};

subscribe();
