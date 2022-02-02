
const main = async () => {
  const [deployer,addr1] = await ethers.getSigners();

  const matrix = await hre.ethers.getContractFactory('Matrix');
  const matrixTokenContract = await matrix.deploy("Matrix","MAT",ethers.utils.parseEther("1000000"));
  await matrixTokenContract.deployed();

  const game = await hre.ethers.getContractFactory("Game");
  const gameContract = await game.deploy(
      ["Neo","Morpheus","Trinity"],
      ["QmdzYNDaHMVUiAVuX4qmpzBx9S9uN4AXPG3kPPhJF1GY3w",
      "QmVs5MdW3qTT6DGXAZJAgtkh1ifR6fJrC8HZ8DE7XoxJMA",
      "QmTkVhe82yTeK4eg1d8rvSeYEQYNKFT3YMD7wbr5o77MME"],
      [500,250,200],
      [25,50,100],
      [1,1,1],
      [ethers.utils.parseEther("100"),ethers.utils.parseEther("100"),ethers.utils.parseEther("100")],
      ["Agent Smith","Agent Smith","Agent Smith"],
      ["https://i.imgur.com/QLIu41k.jpeg","https://i.imgur.com/QLIu41k.jpeg","https://i.imgur.com/QLIu41k.jpeg"],
      [50,50,50],
      [25,25,25],
      matrixTokenContract.address
  );
  await gameContract.deployed();

  console.log("deployer Address:",deployer.address)
  console.log("Game contract address: ", gameContract.address)
  console.log("MatrixToken contract address: ",matrixTokenContract.address);

  let txn = ethers.utils.formatEther(await matrixTokenContract.balanceOf(deployer.address));
  console.log("deployer balance", txn);
  console.log("-------------------------------------");

  txn = await matrixTokenContract.transfer(gameContract.address,ethers.utils.parseEther("900000"));
  console.log("GameContract token transfer", txn);
  console.log("-------------------------------------");

  txn = ethers.utils.formatEther(await matrixTokenContract.balanceOf(gameContract.address));
  console.log("game contract balance", txn)
  console.log("-------------------------------------");

  txn = await gameContract.connect(addr1).mintCharacterNFT(0);
  await txn.wait();
  console.log("-------------------------------------");

  txn = ethers.utils.formatEther(await matrixTokenContract.balanceOf(addr1.address));
  console.log("user balance", txn)
  console.log("-------------------------------------");

  txn = await gameContract.connect(addr1).checkIfUserHasNFT();

  console.log("User NFT data: ", txn);

  console.log("-------------------------------------");

  txn = await gameContract.connect(addr1).attackBoss();
  await txn.wait()

  txn = await gameContract.connect(addr1).attackBoss();
  await txn.wait()

  txn = await gameContract.connect(addr1).checkIfUserHasNFT();
  console.log("user NFT data after attack: ",txn);

  console.log("-------------------------------------");

  // txn = await gameContract.connect(addr1).reviveCharacterNFT(ethers.utils.parseEther("10"));
  // await txn.wait();

  // console.log("-------------------------------------");

  // txn = await gameContract.connect(addr1).checkIfUserHasNFT();
  // console.log("user NFT data after revive: ",txn);

  // console.log("-------------------------------------");

  txn = ethers.utils.formatEther(await matrixTokenContract.balanceOf(addr1.address));
  console.log("user balance before rewards", txn)
  console.log("-------------------------------------");

  // txn = ethers.utils.formatEther(await matrixTokenContract.balanceOf(gameContract.address));
  // console.log("game contract balance", txn)
  // console.log("-------------------------------------");

  txn = await gameContract.connect(addr1).claimWinningRewards();
  await txn.wait();

  console.log("-------------------------------------");

  txn = await gameContract.connect(addr1).checkIfUserHasNFT();
  console.log("user NFT data after Levelup: ",txn);

  console.log("-------------------------------------");

  txn = ethers.utils.formatEther(await matrixTokenContract.balanceOf(addr1.address));
  console.log("user balance", txn)
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