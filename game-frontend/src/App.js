import React, { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { ethers } from "ethers";
import Game from "./json/game.json";

// Components
import LoadingIndicator from "./Components/LoadingIndicator";
import SelectCharacter from "./Components/SelectCharacter";
import Arena from "./Components/Arena";

// Constants
import { CONTRACT_ADDRESS, transformCharacterData } from "./constants";
const TWITTER_HANDLE = "JayPTwts";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        setIsLoading(false);
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }

      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      // Update the network check for Goerli (network ID: 5)
      if (
        ethereum.networkVersion !== "5" &&
        ethereum.networkVersion !== "31337"
      ) {
        alert("Please connect to Goerli");
        return;
      } else {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("Connected", accounts[0]);
        setCurrentAccount(accounts[0]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      const fetchNFTMetadata = async () => {
        try {
          console.log("Checking for Character NFT on address:", currentAccount);

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const gameContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            Game.abi,
            signer
          );

          const characterNFT = await gameContract.checkIfUserHasNFT();
          if (characterNFT.name) {
            console.log("User has character NFT");
            setCharacterNFT(transformCharacterData(characterNFT));
          }

          setIsLoading(false);
        } catch (error) {
          console.log(error);
          setIsLoading(false);
        }
      };

      fetchNFTMetadata();
    }
  }, [currentAccount]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (!currentAccount) {
      return (
        <div className="connect-wallet-container">
          <img
            src="https://i.makeagif.com/media/7-20-2016/XyHsaq.gif"
            alt="Monty Python Gif"
          />
          <button
            className="cta-button connect-wallet-button"
            onClick={connectWallet}
          >
            Connect Wallet to Start Battle
          </button>
        </div>
      );
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    } else if (currentAccount && characterNFT) {
      return (
        <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />
      );
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Matrix Slayer ⚔️</p>
          <p className="sub-text">Team up to protect the Matrix!</p>
          {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
