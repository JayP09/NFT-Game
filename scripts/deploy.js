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
        "Agent Smith",
        "https://i.imgur.com/QLIu41k.jpeg",
        10000,
        25
    );
    await gameContract.deployed();
    console.log("Game contract address: ", gameContract.address)
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