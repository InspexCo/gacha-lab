import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { ethers } from 'ethers';

import Game from "./page/Game";

const gameConfig = {
  level1: {
    level: 1,
    gachaTicketAddress: "0xbBcFE716824e68140757AF340F3601C3d43Be0fD",
    gachaCapsuleAddress: "0x1401B8F0316E90B0e864d7FE31c691f2153EB074",
    gachaMachineAddress: "0x0460ccA088FfEEB4dba624112D5c1CbdF8825e34"
  },
  level2: {
    level: 2,
    gachaTicketAddress: "0xd278A7F636aA0CfeCC27C53B6475206FD9f128Fa",
    gachaCapsuleAddress: "0x33d9879E506a9F0Bd8dAD3a92Ffb65FedF40c8c5",
    gachaMachineAddress: "0xA882a1F41930758C86C26358a6a1bEEb0234CF40"
  },
  level3: {
    level: 3,
    gachaTicketAddress: "0xF01221EE8926ac8f6830110441543D753D494Fcf",
    gachaCapsuleAddress: "0x5966a6C06309fBaeD7E82C32c083B837F1EaFc7d",
    gachaMachineAddress: "0x4cCa783852C044394b35B34C03eaC36659A18491"
  }
}

function App() {
  const [currentAccount, setCurrentAccount] = useState<string>();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();

  const addNetwork = (id: Number) => {
    let networkData;
    switch (id) {
      case 97:
        networkData = [
          {
            chainId: "0x61",
            chainName: "BSCTESTNET",
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
            nativeCurrency: {
              name: "BINANCE COIN",
              symbol: "BNB",
              decimals: 18,
            },
            blockExplorerUrls: ["https://testnet.bscscan.com/"],
          },
        ];
        break;
      case 56:
        networkData = [
          {
            chainId: "0x38",
            chainName: "BSCMAINET",
            rpcUrls: ["https://bsc-dataseed1.binance.org"],
            nativeCurrency: {
              name: "BINANCE COIN",
              symbol: "BNB",
              decimals: 18,
            },
            blockExplorerUrls: ["https://bscscan.com/"],
          },
        ];
        break;
      default:
        return;
    }
  
    return provider?.send("wallet_addEthereumChain", networkData);
  }

  const checkWalletIsConnected = async () => {
    const ethereum = (window as any).ethereum;
    ethereum.on('accountsChanged', (accounts : any) => {
      checkWalletIsConnected();
    });
    
    ethereum.on('chainChanged', () => {
      // Handle the new chain.
      // Correctly handling chain changes can be complicated.
      // We recommend reloading the page unless you have good reason not to.
      window.location.reload();
    });
    if (!ethereum) {
      console.log("Make sure you have Metamask installed!");
      return;
    } else {
      console.log("Wallet exists! We're ready to go!")
    }

    const newProvider = new ethers.providers.Web3Provider(ethereum);
    const accounts = await newProvider.send("eth_accounts", []);

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      const { chainId } = await newProvider.getNetwork();
      if (chainId !== 97) {
        console.log("Switch to BSC Testnet: 0x61")
        await addNetwork(97);
        await newProvider.send('wallet_switchEthereumChain', [{chainId: '0x61'}]);
      }
      setProvider(newProvider)
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const newProvider = new ethers.providers.Web3Provider(ethereum);
      const { chainId } = await newProvider.getNetwork();
      if (chainId !== 97) await addNetwork(97);

      const accounts = await newProvider.send("eth_requestAccounts", []);
      console.log("Found an account! Address: ", accounts[0]);
      setProvider(newProvider);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err)
    }
  }

  const disconnectWalletHandler = () => {
    setCurrentAccount(undefined);
    setProvider(undefined);
  }

  const connectWalletButton = () => {
    return (
      <button className="btn btn-secondary" onClick={connectWalletHandler}>
        Connect Wallet
      </button>
    )
  }

  const connectedWalletButton = () => {
    if (currentAccount === null) checkWalletIsConnected();
    return (
      <button className="btn btn-secondary" onClick={disconnectWalletHandler}>
        { currentAccount ? (currentAccount as string).substring(0, 6)  + "..." + (currentAccount as string).substring((currentAccount as string).length-5, (currentAccount as string).length) : "Error" }
      </button>
    )
  }

  useEffect(() => {
    checkWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="App">
      <nav className="navbar navbar-expand-lg navbar-dark static-top">
        <div className="container">
          <a className="navbar-brand" href="https://inspex.co">
            <img src="https://inspex.co/images/logo.png" alt="..." height="32" />
          </a>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/level1">Level 1</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/level2">Level 2</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/level3">Level 3</Link>
              </li>
              <li className="nav-item ms-2">
                { !currentAccount ? connectWalletButton() : connectedWalletButton()}
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="jumbotron jumbotron-fluid bg-secondary p-4">
        <div className="container">
          <h1 className="display-6">Gacha Lab (BSC Testnet)</h1>
          <p className="lead">
            The hacking lab for <a className="link-light" href="https://www.meetup.com/blockchain-security-level-up/events/284040437/">Blockchain Security Level Up 0x00</a>
          </p>
        </div>
      </div>
      <div className="container mt-3">
        { currentAccount ? <Routes>
          <Route path="level1" element={<Game level={1} config={gameConfig.level1} currentAccount={currentAccount} provider={provider} />} />
          <Route path="level2" element={<Game level={2} config={gameConfig.level2} currentAccount={currentAccount} provider={provider} />} />
          <Route path="level3" element={<Game level={3} config={gameConfig.level3} currentAccount={currentAccount} provider={provider} />} />
          <Route path="" element={<Navigate to="/level1" />} />
        </Routes> : <div className="text-center mt-5">
          <h3>Please connect the wallet before hacking !</h3>
        </div> }
      </div>
    </div>
  );
}

export default App;
