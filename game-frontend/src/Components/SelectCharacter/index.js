import React, { useEffect, useState } from "react";
import "./SelectCharacter.css";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import Game from "../../artifacts/contracts/Game.sol/Game.json";
import LoadingIndicator from "../LoadingIndicator";
import image1 from "./assets/1.jpg";
import image2 from "./assets/2.png";
import image3 from "./assets/3.jpg";

const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingCharacter, setMintingCharacter] = useState(false);

  useEffect(() => {
    const initializeGameContract = async () => {
      try {
        const { ethereum } = window;
        if (!ethereum) {
          console.log("Ethereum object not found");
          return;
        }

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const gameContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Game.abi,
          signer
        );

        setGameContract(gameContract);
      } catch (error) {
        console.error("Error initializing game contract:", error);
      }
    };

    initializeGameContract();
  }, []);

  useEffect(() => {
    const getCharacters = async () => {
      try {
        if (!gameContract) return;
        console.log("Getting contract characters to mint");
        const charactersTxn = await gameContract.getAlllDefaultCharacters();
        const characters = charactersTxn.map(transformCharacterData);
        setCharacters(characters);
      } catch (error) {
        console.error("Something went wrong fetching characters:", error);
      }
    };

    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      try {
        console.log(
          `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
        );

        if (gameContract) {
          const characterNFT = await gameContract.checkIfUserHasNFT();
          console.log("CharacterNFT:", characterNFT);
          setCharacterNFT(transformCharacterData(characterNFT));
        }
      } catch (error) {
        console.error("Error handling CharacterNFTMinted event:", error);
      }
    };

    if (gameContract) {
      getCharacters();
      gameContract.on("CharacterNFTMinted", onCharacterMint);
    }

    return () => {
      if (gameContract) {
        gameContract.off("CharacterNFTMinted", onCharacterMint);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameContract]);

  const mintCharacterNFTAction = (characterId) => async () => {
    try {
      if (!gameContract) {
        console.error("Game contract not initialized");
        return;
      }

      console.log("Minting character in progress...");
      setMintingCharacter(true);
      const mintTxn = await gameContract.mintCharacterNFT(characterId);
      await mintTxn.wait();
      console.log("mintTxn:", mintTxn);
      setMintingCharacter(false);
    } catch (error) {
      console.warn("MintCharacterAction Error", error);
      setMintingCharacter(false);
    }
  };

  const choseImage = (index) => {
    switch (index) {
      case 0:
        return image1;
      case 1:
        return image2;
      default:
        return image3;
    }
  };

  const renderCharacters = () =>
    characters.map((character, index) => (
      <div className="character-item" key={character.name}>
        <div className="name-container">
          <p>{character.name}</p>
        </div>
        <img src={choseImage(index)} alt={character.name} />
        <button
          type="button"
          className="character-mint-button"
          onClick={mintCharacterNFTAction(index)}
        >
          {`Mint ${character.name}`}
        </button>
      </div>
    ));

  return (
    <div className="select-character-container">
      <h2>Mint Your Hero. Choose wisely.</h2>
      {characters.length > 0 && (
        <div className="character-grid">{renderCharacters()}</div>
      )}
      {mintingCharacter && (
        <div className="loading">
          <div className="indicator">
            <LoadingIndicator />
            <p>Minting In Progress...</p>
          </div>
          <img
            src="https://media2.giphy.com/media/61tYloUgq1eOk/giphy.gif?cid=ecf05e47dg95zbpabxhmhaksvoy8h526f96k4em0ndvx078s&rid=giphy.gif&ct=g"
            alt="Minting loading indicator"
          />
        </div>
      )}
    </div>
  );
};

export default SelectCharacter;
