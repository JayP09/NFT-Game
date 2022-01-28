const { hexZeroPad } = require("ethers/lib/utils");

const main = async () => {
    const game = await hre.ethers.getContractFactory("Game");
    const gameContract = await game.deploy(
        ["Neo","Morpheus","Trinity"],
        ["https://i.imgur.com/OCXEh4z.png",
        "https://i.imgur.com/KjxsdOg.jpeg",
        "https://i.imgur.com/Grw5gbj.jpeg"],
        [300,250,200],
        [15,50,100],
        "Agent Smith", // boss Name
        "https://i.imgur.com/QLIu41k.jpeg", // Boss image
        10000, // Boss hp
        25 // Boss attack damage
    );
    await gameContract.deployed();

    console.log("Game contract address: ", gameContract.address)

    let txn;
    txn = await gameContract.mintCharacterNFT(2);
    await txn.wait();

    txn = await gameContract.attackBoss();
    await txn.wait();

    txn = await gameContract.attackBoss();
    await txn.wait();
}


const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };

  runMain();