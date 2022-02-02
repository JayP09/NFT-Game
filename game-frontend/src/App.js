import React, { useEffect,useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import Game from './artifacts/contracts/Game.sol/Game.json';
import { ethers } from 'ethers';

// Components
import LoadingIndicator from './Components/LoadingIndicator';
import SelectCharacter from './Components/SelectCharacter';
import Arena from './Components/Arena';


// Constants
const TWITTER_HANDLE = 'JayPanchalTwts';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);

  const [characterNFT, setCharacterNFT] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const checkIfWalletIsConnected = async() => {
    try {
      const { ethereum } = window;

      if(!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);

        const accounts = await ethereum.request({method: 'eth_accounts'});

        if(accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:",account);
          setCurrentAccount(account);
        } else {
          console.log("No authorized account found")
        }
      }
    } catch (error) {
      console.log(error);
    }

    setIsLoading(false);
  };

  // Render methods
  const renderContent = () => {
    // If the app is currently loading, just render out loadingIndicator
    if(isLoading) {
      return <LoadingIndicator />;
    }

    if(!currentAccount) {
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
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />
    }
  };

  const connectWallet = async() => {
    try {
      const {ethereum} = window;

      if(!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      if(ethereum.networkVersion !== '4' && ethereum.networkVersion !== "31337") {
        alert("Please connect to Rinkeby");
        return;
      } else {
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        });
        console.log("Connected", accounts[0]);
        setCurrentAccount(accounts[0]);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=> {
    setIsLoading(true);
    checkIfWalletIsConnected();
  },[]);

  useEffect(() => {
    // this function will interacts with our smart contract
   
    const fetchNFTMetadata = async() => {
      console.log('Checking for Character NFT on address:',currentAccount);

      let provider = new ethers.providers.Web3Provider(window.ethereum);
      let signer = provider.getSigner();
      let gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        Game.abi,
        signer
      );

      const characterNFT = await gameContract.checkIfUserHasNFT();
      if(characterNFT.name) {
        console.log('User has character NFT');
        setCharacterNFT(transformCharacterData(characterNFT));
      }
      
      setIsLoading(false);
    };

    if(currentAccount) {
      console.log('CurrentAccount:',currentAccount);
      fetchNFTMetadata();
    }
  },[currentAccount]);

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