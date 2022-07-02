import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import Game from '../../artifacts/contracts/Game.sol/Game.json';
import LoadingIndicator from '../LoadingIndicator';
import image1 from "./assets/1.jpg"
import image2 from "./assets/2.png"
import image3 from "./assets/3.jpg"

const SelectCharacter = ({ setCharacterNFT }) => {
    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);

    const [mintingCharacter, setMintingCharacter] = useState(false);

    useEffect(() => {
        const { ethereum } = window;

        if(ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                Game.abi,
                signer
            );

            setGameContract(gameContract);
        } else {
            console.log("Ethereum object not found");
        }
    },[]);

    useEffect(() => {
        const getCharacters = async () => {
            try {
                console.log('Getting contract characters to mint');
                // call contract to get all mint-able characters
                const charactersTxn = await gameContract.getAlllDefaultCharacters();
                console.log('charactersTxn:',charactersTxn);

                const characters = charactersTxn.map((characterData) => 
                    transformCharacterData(characterData)
                );

                // set all mintable characters in state
                setCharacters(characters);
            } catch (error) {
                console.error("Something went wrong fetching characters:",error);
            }
        };

        // Add a callback method that will fire when this event is received
        const onCharacterMint = async (sender, tokenId, characterIndex) => {
            console.log(
                `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
            );

            // once characternft is minted we ca fetch the metadata from our contract and set it in state to move onto the arena
            if(gameContract) {
                const characterNFT = await gameContract.checkIfUserHasNFT();
                console.log('CharacterNFT:',characterNFT);
                setCharacterNFT(transformCharacterData(characterNFT));
            }
        };

        if(gameContract) {
            getCharacters();
            gameContract.on('CharacterNFTMinted', onCharacterMint);
        }

        return () => {
            if(gameContract){
                gameContract.off('CharacterNFTMinted',onCharacterMint);
            }
        }
    },[gameContract]);

    const mintCharacterNFTAction = (characterId) => async () => {
        try {
            if(gameContract) {
                console.log('Minting character in progress...');
                const mintTxn = await gameContract.mintCharacterNFT(characterId);
                await mintTxn.wait();
                console.log('mintTxn:',mintTxn);

                setMintingCharacter(false);
            }
        } catch (error) {
            console.warn("MintCharacterAction Error",error);
            setMintingCharacter(false);
        }
    }
    const choseImage = (index) => {
        if (index === 0){
            return image1
        } else if(index === 1){
            return image2
        } else {
            return image3
        }
    }

    const renderCharacters = () => (
        characters.map((character, index) => (
            <div className="character-item" key={character.name}>
                <div className='name-container'>
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
        ))
    )

    return (
        <div className="select-character-container">
            <h2>Mint Your Hero. Choose wisely.</h2>
            {/* Only show this when there are characters in state */}
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
    )
}

export default SelectCharacter;