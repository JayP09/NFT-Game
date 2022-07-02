const { hexZeroPad } = require("ethers/lib/utils");

const main = async () => {
  const [deployer,addr1] = await ethers.getSigners();

  const matrix = await hre.ethers.getContractFactory('Matrix');
  const matrixTokenContract = await matrix.deploy("Matrix","MAT",ethers.utils.parseEther("1000000"));
  await matrixTokenContract.deployed();

  const game = await hre.ethers.getContractFactory("Game");
  const gameContract = await game.deploy(
      ["Neo","Morpheus","Trinity"],
      ["QmV9BobumM4qUfvtzF5TFfrasNfFza17vniew9VvDTe9W5",
      "QmdrHxaWuBnnZJNCaikHjLS4BdtkHq8MsYSjjVXP3oYkzP",
      "QmX7aAa4nvjtxTQ7BnYhzutnxnihQpioY1d6RiMu8hCZxp"],
      [300,250,200],
      [25,50,100],
      [1,1,1],
      [ethers.utils.parseEther("100"),ethers.utils.parseEther("100"),ethers.utils.parseEther("100")],
      ["Agent Smith","Agent Smith","Agent Smith"],
      ["https://i.imgur.com/QLIu41k.jpeg","https://i.imgur.com/QLIu41k.jpeg","https://i.imgur.com/QLIu41k.jpeg"],
      [500,400,300],
      [25,50,100],
      matrixTokenContract.address
  );
  await gameContract.deployed();

  console.log("deployer Address:",deployer.address)
  console.log("Game contract address: ", gameContract.address)
  console.log("MatrixToken contract address: ",matrixTokenContract.address);

  txn = await matrixTokenContract.transfer(gameContract.address,ethers.utils.parseEther("1000000"));
  console.log("deployer balance", txn);
  console.log("-------------------------------------");
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