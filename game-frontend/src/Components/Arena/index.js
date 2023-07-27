import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import Game from "../../artifacts/contracts/Game.sol/Game.json";
import "./Arena.css";
import LoadingIndicator from "../LoadingIndicator";
import image1 from "./assets/1.jpg";
import image2 from "./assets/2.png";
import image3 from "./assets/3.jpg";

const Arena = ({ characterNFT, setCharacterNFT }) => {
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState("");
  const [showToast, setShowToast] = useState(false);

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
    const fetchBoss = async () => {
      try {
        const bossTxn = await gameContract.getBigBoss();
        setBoss(transformCharacterData(bossTxn));
      } catch (error) {
        console.error("Error fetching boss:", error);
      }
    };

    const onAttackComplete = (newBossHp, newPlayerHp) => {
      try {
        const bossHp = newBossHp.toNumber();
        const playerHp = newPlayerHp.toNumber();

        if (bossHp === 0) {
          setAttackState("herowins");
        }

        if (playerHp === 0) {
          setAttackState("revivehero");
        }

        setBoss((prevState) => ({ ...prevState, hp: bossHp }));
        setCharacterNFT((prevState) => ({ ...prevState, hp: playerHp }));
      } catch (error) {
        console.error("Error updating after attack complete:", error);
      }
    };

    const onReviveComplete = (newBossHp, newPlayerHp) => {
      try {
        const bossHp = newBossHp.toNumber();
        const playerHp = newPlayerHp.toNumber();

        setBoss((prevState) => ({ ...prevState, hp: bossHp }));
        setCharacterNFT((prevState) => ({ ...prevState, hp: playerHp }));
      } catch (error) {
        console.error("Error updating after revive complete:", error);
      }
    };

    const onClaimRewards = (
      newBossHp,
      bossAttackDamage,
      newPlayerHp,
      playerAttackDamage,
      tokenAirdropAmount
    ) => {
      try {
        let bossHp = newBossHp.toNumber();
        let playerHp = newPlayerHp.toNumber();
        let bossAttackDamageAmount = bossAttackDamage.toNumber();
        let playerAttackDamageAmount = playerAttackDamage.toNumber();

        setBoss((prevState) => ({
          ...prevState,
          hp: bossHp,
          attackDamage: bossAttackDamageAmount,
        }));

        setCharacterNFT((prevState) => ({
          ...prevState,
          hp: playerHp,
          attackDamage: playerAttackDamageAmount,
        }));
      } catch (error) {
        console.error("Error updating after claiming rewards:", error);
      }
    };

    if (gameContract) {
      fetchBoss();
      gameContract.on("AttackComplete", onAttackComplete);
      gameContract.on("ReviveComplete", onReviveComplete);
      gameContract.on("ClaimRewards", onClaimRewards);
    }

    return () => {
      if (gameContract) {
        gameContract.off("AttackComplete", onAttackComplete);
        gameContract.off("ReviveComplete", onReviveComplete);
        gameContract.on("ClaimRewards", onClaimRewards);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameContract]);

  const runAttackAction = async () => {
    try {
      if (!gameContract) {
        console.error("Game contract not initialized");
        return;
      }

      setAttackState("attacking");
      console.log("Attacking boss...");
      const attackTxn = await gameContract.attackBoss();
      await attackTxn.wait();
      console.log("attackTxn:", attackTxn);
      setAttackState("hit");

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } catch (error) {
      console.error("Error attacking boss:", error);
      setAttackState("");
    }
  };

  const reviveHeroAction = async () => {
    try {
      if (!gameContract) {
        console.error("Game contract not initialized");
        return;
      }

      console.log("Reviving Hero..");
      const reviveTxn = await gameContract.reviveCharacterNFT(
        ethers.utils.parseEther("75")
      );
      await reviveTxn.wait();
      console.log("revive Txn: ", reviveTxn);
      setAttackState("hit");
    } catch (error) {
      console.error("Error reviving hero", error);
    }
  };

  const claimRewardsAction = async () => {
    try {
      if (!gameContract) {
        console.error("Game contract not initialized");
        return;
      }

      console.log("Claim Reward...");
      const claimRewardTxn = await gameContract.claimWinningRewards();
      await claimRewardTxn.wait();
      console.log("Claim Reward Txn: ", claimRewardTxn);
      setAttackState("claim");
    } catch (error) {
      console.error("Error claiming rewards", error);
    }
  };

  const choseImage = (name) => {
    switch (name) {
      case "Neo":
        return image1;
      case "Morpheus":
        return image2;
      default:
        return image3;
    }
  };

  return (
    <div className="arena-container">
      {boss && characterNFT && (
        <div id="toast" className={showToast ? "show" : ""}>
          <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
      )}
      {boss && (
        <div className="boss-container">
          <div className={`boss-content ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className="image-content">
              <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className="attack-container">
            {boss.hp > 0 && attackState !== "revivehero" && (
              <button className="cta-button" onClick={runAttackAction}>
                {`💥 Attack ${boss.name}`}
              </button>
            )}
            {characterNFT.hp === 0 && attackState === "revivehero" && (
              <button className="cta-button" onClick={reviveHeroAction}>
                {`Revive ${characterNFT.name}`}
              </button>
            )}
            {boss.hp === 0 && attackState === "herowins" && (
              <button className="cta-button" onClick={claimRewardsAction}>
                {`💥 ${characterNFT.name} Wins Claim Rewards`}
              </button>
            )}
          </div>
          {attackState === "attacking" && (
            <div className="loading-indicator">
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
        </div>
      )}
      {characterNFT && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your Character</h2>
            <div className="player">
              <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img
                  src={choseImage(characterNFT.name)}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className="health-bar">
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
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
