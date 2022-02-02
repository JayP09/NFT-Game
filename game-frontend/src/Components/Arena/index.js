import React,{useEffect, useState} from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import Game from '../../artifacts/contracts/Game.sol/Game.json';
import './Arena.css';
import LoadingIndicator from "../LoadingIndicator";

const Arena = ({ characterNFT, setCharacterNFT }) => {
    // State 
    const [gameContract, setGameContract] = useState(null);
    const [boss, setBoss] = useState(null);

    const [attackState, setAttackState] = useState('');

    const [showToast, setShowToast] = useState(false);

    // UseEffects
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
            console.log('Ethereum object not found');
        }
    },[]);
    

    // UseEffects
    useEffect(() => {
        // Async function that will get the boss from our contract and sets in state
        const fetchBoss = async () => {
            const bossTxn = await gameContract.getBigBoss();
            console.log('Boss:',bossTxn);
            setBoss(transformCharacterData(bossTxn));
        }

        // Setup logic when this event is fired off
        const onAttackComplete = (newBossHp, newPlayerHp) => {
            const bossHp = newBossHp.toNumber();
            const playerHp = newPlayerHp.toNumber();

            console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

            // Update both player and boss Hp
            if(bossHp == 0){
                setAttackState("herowins")
            }

            if(playerHp == 0) {
                setAttackState("revivehero")
            }

            setBoss((prevState) => {
                return {...prevState, hp: bossHp};
            });

            setCharacterNFT((prevState) => {
                return {...prevState, hp: playerHp};
            });
        };

        const onReviveComplete = (newBossHp, newPlayerHp) => {
            const bossHp = newBossHp.toNumber();
            const playerHp = newPlayerHp.toNumber();

            console.log(`ReviveComplete : Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

            setBoss((prevState) => {
                return {...prevState, hp: bossHp};
            });

            setCharacterNFT((prevState) => {
                return {...prevState, hp: playerHp};
            });
        }

        const onClaimRewards = (newBossHp,bossAttackDamage, newPlayerHp, playerAttackDamage, tokenAirdropAmount) => {
            let bossHp = newBossHp.toNumber();
            let playerHp = newPlayerHp.toNumber();
            let bossAttackDamageAmount = bossAttackDamage.toNumber();
            let playerAttackDamageAmount = playerAttackDamage.toNumber();
            let tokenAirdrop = tokenAirdropAmount.toNumber();

            console.log(`Hero Level And boss level Upgraded: bossHp ${bossHp} player Hp: ${playerHp} player Attackdamage : ${playerAttackDamageAmount} 
            boss Attackdamage : ${bossAttackDamageAmount} token Airdrop Amount: ${tokenAirdrop}
            `);

            setBoss((prevState) => {
                return {...prevState, hp: bossHp, attackDamage: bossAttackDamage};
            });

            setCharacterNFT((prevState) => {
                return {...prevState, hp: playerHp, attackDamage: playerAttackDamage};
            });
        }

        if(gameContract) {
            // fetch our boss
            fetchBoss();
            gameContract.on('AttackComplete', onAttackComplete);
            gameContract.on('ReviveComplete',onReviveComplete);
            gameContract.on('ClaimRewards',onClaimRewards);
        }
        
        return () => {
            if(gameContract) {
                gameContract.off('AttackComplete', onAttackComplete);
                gameContract.off('ReviveComplete',onReviveComplete);
                gameContract.on('ClaimRewards',onClaimRewards);
            }
        }

    },[gameContract]);

    // Actions 
    const runAttackAction = async () => {
        try {
            if(gameContract) {
                setAttackState('attacking');
                console.log('Attacking boss...');
                const attackTxn = await gameContract.attackBoss();
                await attackTxn.wait();
                console.log('attackTxn:',attackTxn);
                setAttackState('hit');

                // Set your toast state to true and then false 5 second later
                setShowToast(true);
                setTimeout(() => {
                    setShowToast(false);
                },5000);
            }
        } catch (error) {
            console.error('Error attacking boss:',error);
            setAttackState('');
        }
    };

    const reviveHeroAction = async () => {
        try {
            if(gameContract) {
                console.log("Reviving Hero..");
                const reviveTxn = await gameContract.reviveCharacterNFT(ethers.utils.parseEther("75"));
                await reviveTxn.wait();
                console.log("revive Txn: ", reviveTxn);
                setAttackState('hit');
            }
        } catch (error) {
            console.error('Error reviving hero',error);
        }
    }

    const claimRewardsAction = async () => {
        try {
            if(gameContract) {
                console.log("Claim Reward...")
                const claimRewardTxn =  await gameContract.claimWinningRewards();
                await claimRewardTxn.wait();
                console.log("Claim Reward Txn: ",claimRewardTxn);
                setAttackState('claim');
            }
        } catch (error) {
            console.error("Error claiming rewards",error);
        }
    }

    return (
        <div className="arena-container">
            {boss && characterNFT && (
            <div id="toast" className={showToast ? 'show' : ''}>
                <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
            </div>
            )}
            {boss && (
                <div className="boss-container">
                <div className={`boss-content ${attackState}`}>
                    <h2>🔥 {boss.name} 🔥</h2>
                    <div className="image-content">
                        <img src={boss.imageURI} alt={`Boss ${boss.name}`}/>
                        <div className="health-bar">
                            <progress value={boss.hp} max={boss.maxHp} />
                            <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
                        </div>
                    </div>
                </div>
                <div className="attack-container">
                    {(boss.hp>0 && attackState !== 'revivehero') && (
                        <button className="cta-button" onClick={runAttackAction}>
                        {`💥 Attack ${boss.name}`}
                        </button>
                    )}
                </div>
                <div className="attack-container">
                    {(characterNFT.hp === 0 && attackState ==='revivehero') && (
                        <button className="cta-button" onClick={reviveHeroAction}>
                        {`Revive ${characterNFT.name}`}
                        </button>
                    )}
                </div>
                <div className="attack-container">
                    {(boss.hp === 0 && attackState === "herowins") && (
                        <button className="cta-button" onClick={claimRewardsAction}>
                        {`💥 ${characterNFT.name} Wins Claim Rewards`}
                        </button>
                    )}
                </div>
                {attackState === 'attacking' && (
                    <div className="loading-indicator">
                        <LoadingIndicator />
                        <p>Attacking ⚔️</p>
                    </div>
                )}
            </div>
            )}
            {/* Character NFT */}
            {characterNFT && (
                <div className="players-container">
                <div className="player-container">
                    <h2>Your Character</h2>
                    <div className="player">
                        <div className="image-content">
                            <h2>{characterNFT.name}</h2>
                            <img 
                                src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
                                alt={`Character ${characterNFT.name}`}
                            />
                            <div className="health-bar">
                                <progress value={characterNFT.hp} max={characterNFT.maxHp}/>
                                <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                            </div>
                        </div>
                        <div className="stats">
                            <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default Arena;