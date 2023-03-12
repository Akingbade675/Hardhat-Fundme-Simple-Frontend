import { abi, contractAddress } from "./constants.js";

const fundBtn = document.getElementById("fundBtn");
const btnConn = document.getElementById("conn");
const balanceTxt = document.getElementById("bal");
const withdrawBtn = document.getElementById("withdrawBtn");
const statusTxt = document.getElementById("statusTxt");
fundBtn.onclick = fund;
btnConn.onclick = connect;
withdrawBtn.onclick = withdraw;
const { ethereum } = window;
await getBalance();

function connect() {
  if (ethereum && ethereum.isMetaMask) {
    ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        const account = accounts[0];
        btnConn.innerHTML = `${account.substr(0, 5)}...${account.substr(
          -4,
          5
        )}`;
        statusTxt.innerText = "Connected";
        document.getElementById("status").style.backgroundColor = "green";
        console.log(accounts);
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    alert("MetaMask is not installed!");
    console.log("MetaMask is not installed!");
  }
}

async function fund() {
  if (ethereum && ethereum.isMetaMask) {
    const ethAmount = document.getElementById("ethAmount").value;
    statusTxt.innerText = `Funding ${ethAmount} ETH...`;
    console.log(`Funding ${ethAmount} ETH...`);
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    console.log(signer);
    console.log(contractAddress);
    const contract = new ethers.Contract(contractAddress, abi, signer);
    document.getElementById("ethAmount").value = "";
    try {
      const txResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      await listenForTxMine(txResponse, provider);
      await getBalance();
      statusTxt.innerText = `Funded ${ethAmount} ETH...`;
      console.log("Done!");
    } catch (e) {
      statusTxt.innerText = `An Error Occurred`;
      document.getElementById("status").style.backgroundColor = "red";
      console.log(e);
    }
  }
}

async function getBalance() {
  if (ethereum) {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(`Contract Balance: ${ethers.utils.formatEther(balance)}`);
    balanceTxt.innerText = ethers.utils.formatEther(balance);
  }
}

async function withdraw() {
  if (ethereum) {
    statusTxt.innerText = `Withdrawing Funds...`;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const txResponse = await contract.withdraw();
      await listenForTxMine(txResponse, provider);
      statusTxt.innerText = `Withdraw Successful...`;
      document.getElementById("status").style.backgroundColor = "green";
      statusTxt.innerText = `Withdraw Successful...`;
      await getBalance();
    } catch (e) {
      if (e.data.message.includes("FundMe__NotOwner")) {
        statusTxt.innerText = `Only the Fund Me Owner can withdraw...`;
      }
      console.log(e.data.message);
      console.log("Encountered error while withdrawing", e);
    }
  }
}

function listenForTxMine(txResponse, provider) {
  console.log(`Mining ${txResponse.hash}...`);
  return new Promise((resolve, reject) => {
    provider.once(txResponse.hash, (txReceipt) => {
      console.log(`Completed with ${txReceipt.confirmations} confirmations`);
      resolve();
    });
  });
}
