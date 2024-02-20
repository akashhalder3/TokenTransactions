const axios = require("axios");
const BigNumber = require("bignumber.js");
const TronWeb = require("tronweb");

const usdt_contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; //usdt
const m20_contract = "TL2eMDoxXCycU5FnEHBN1rMNyfqbZDHbJo"; //m20 token
const wallet = "TPHYJVpdhAvgembsoqwA5713AC5wqrxXKx"; //publicKey

const url_trc20_transfer =
  "https://api.trongrid.io/v1/accounts/" + wallet + "/transactions/trc20";
const url_trx_transfer =
  "https://api.trongrid.io/v1/accounts/" + wallet + "/transactions/";

const getTransactionInfoById = "https://api.trongrid.io/wallet/gettransactioninfobyid";

function hexToBase58(hexAddress) {
  const base58checkAddress = TronWeb.address.fromHex(hexAddress);
  return base58checkAddress;
}

async function getFees(transactionId) {
  try {
    const options = {
      method: "post",
      url: getTransactionInfoById,
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

async function getUsdtTransactions() {
  try {
    let txns_array = [];
    let trc20_response = await axios.get(url_trc20_transfer);
    let trx_response = await axios.get(url_trx_transfer);
    let trc20_transactions = trc20_response.data.data;
    let trx_transactions = trx_response.data.data;
    for (let i = 0; i < trc20_transactions.length; i++) {
      if (trc20_transactions[i].to == wallet) {
        // console.log(trc20_transactions[i]);
        if (trc20_transactions[i].to == wallet) {
          if (
            trc20_transactions[i].token_info.address == usdt_contract ||
            trc20_transactions[i].token_info == m20_contract
          ) {
            let fees = await getFees(trc20_transactions[i].transaction_id);
            let token_transfers = {
              hash: trc20_transactions[i].transaction_id,
              type: "trc20",
              token_name: trc20_transactions[i].token_info.name,
              token_symbol: trc20_transactions[i].token_info.symbol,
              token_address: trc20_transactions[i].token_info.address,
              token_decimals: trc20_transactions[i].token_info.decimals,
              fee: new BigNumber(fees).dividedBy(1000000).toFixed(),
              from: trc20_transactions[i].from,
              to: trc20_transactions[i].to,
              amount: new BigNumber(trc20_transactions[i].value)
                .dividedBy(1000000)
                .toFixed(),
            };
            // console.log(token_transfers);
            txns_array.push(token_transfers);
          }
        }
      }
    }
    for (let i = 0; i < trx_transactions.length; i++) {
      let fees = new BigNumber(trx_transactions[i].ret[0].fee)
        .dividedBy(1000000)
        .toFixed();
      let trx_amount = new BigNumber(
        trx_transactions[i].raw_data.contract[0].parameter.value.amount
      )
        .dividedBy(1000000)
        .toFixed();
      let from_address = hexToBase58(
        trx_transactions[i].raw_data.contract[0].parameter.value.owner_address
      );
      let to_address = hexToBase58(
        trx_transactions[i].raw_data.contract[0].parameter.value.to_address
      );
      let trx_transfers = {
        hash: trx_transactions[i].txID,
        type: "trx",
        fees: fees,
        amount: trx_amount,
        from: from_address,
        to: to_address,
      };
      txns_array.push(trx_transfers);
    }
    console.log(txns_array);
  } catch (error) {
    console.log(error);
  }
}

getUsdtTransactions();
