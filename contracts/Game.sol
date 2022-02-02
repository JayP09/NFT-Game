// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/// NFT contract from openzeppelin
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Helper functions OpenZeppelin provides
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Helper functions to encode in Base64
import "./libraries/Base64.sol";

import "hardhat/console.sol";
import "./Matrix.sol";

// Our Contract inherits from ERC721, which is the standard NFT contract!
contract Game is ERC721{
    // hold your character's attributes in a struct
    mapping(address => bool) claimed;

    struct BigBoss {
        string name;
        string imageURI;
        uint hp;
        uint maxHp;
        uint attackDamage;
    }

    BigBoss public bigBoss;

    struct CharacterAttributes {
        uint characterIndex;
        string name;
        string imageURI;
        uint hp;
        uint maxHp;
        uint attackDamage;
        uint characterLevel;
        uint tokenAirdropAmount;
        BigBoss boss;
    }

    // The tokenId is the NFTs unique identifier, it's just a number that goes 0,1,2,3 .. etc.
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    Matrix public matrixToken;

    CharacterAttributes[] defaultCharacters;

    // Mapping from the nft's tokenId => that NFTs attributes.
    mapping(uint256 => CharacterAttributes) public nftHolderAttributes;

    // Mapping to store Address => the NFTs tokenID
    mapping(address => uint256) public nftHolders;
    

    // Events
    event CharacterNFTMinted(address minter, uint256 tokenId, uint256 characterIndex);
    event AttackComplete(uint newBossHp, uint newPlayerHp);
    event ClaimToken(address user, uint amount);
    event ReviveComplete(uint bossHp, uint newPlayerHp);
    event ClaimRewards(uint newBossHp, uint bossAttackDamage, uint newPlayerHp, uint playerAttackDamage, uint tokenAirdropAmount);

    constructor(
        string[] memory characterNames,
        string[] memory characterImageURIs,
        uint[] memory characterHp,
        uint[] memory characterAttackDmg,
        uint[] memory characterLevel,
        uint[] memory tokenAirdropAmount,
        string[] memory bossName,
        string[] memory bossImageURI,
        uint[] memory bossHp,
        uint[] memory bossAttackDamage,
        Matrix _matrixToken
        // Below, you can also see I added some special identifier symbols for our NFT.
        // This is the name and symbol for our token, ex Ethereum and ETH. I just call mine
        // Heroes and HERO. Remember, an NFT is just a token!
    ) ERC721 ("Heroes of The Matrix Resurrections","HERO"){
        matrixToken = _matrixToken;
        console.log("Done initializing boss %s w/ HP %s, img %s", bigBoss.name, bigBoss.hp, bigBoss.imageURI);

        // Loop through all the characters and save their values in our contract.
        for(uint i=0; i< characterNames.length;i+=1){
            bigBoss = BigBoss({
                name: bossName[i],
                imageURI: bossImageURI[i],
                hp: bossHp[i],
                maxHp: bossHp[i],
                attackDamage: bossAttackDamage[i]
            });
            defaultCharacters.push(
                CharacterAttributes({
                    characterIndex: i,
                    name: characterNames[i],
                    imageURI: characterImageURIs[i],
                    hp: characterHp[i],
                    maxHp: characterHp[i],
                    attackDamage: characterAttackDmg[i],
                    characterLevel: characterLevel[i],
                    tokenAirdropAmount: tokenAirdropAmount[i],
                    boss: bigBoss
                })
            );

            CharacterAttributes memory c = defaultCharacters[i];
            console.log("Done initializing %s w/ Hp %s, imp %s", c.name, c.hp, c.imageURI);
        }
        // Increment _tokenIds here so that nft has ID of 1
        _tokenIds.increment();
    }

    function checkIfUserHasNFT() public view returns (CharacterAttributes memory) {
        // Get the tokenId of the user's character NFT
        uint256 userNftTokenId = nftHolders[msg.sender];

        //IF the suer has a tokenId in the mapping, return their character
        if(userNftTokenId > 0) {
            return nftHolderAttributes[userNftTokenId];
        } else {
            CharacterAttributes memory emptyStruct;
            return emptyStruct;
        }
    }

    function getAlllDefaultCharacters() public view returns (CharacterAttributes[] memory) {
        return defaultCharacters;
    }

    function getBigBoss() public view returns (BigBoss memory) {
        uint256 nftTokenOfPlayer =  nftHolders[msg.sender];
        CharacterAttributes storage player = nftHolderAttributes[nftTokenOfPlayer];
        return player.boss;
    }

    function tokenAirdrop(uint amount) private {
        require(claimed[msg.sender] != true);
        matrixToken.transfer(msg.sender, amount);
        claimed[msg.sender] = false;
        emit ClaimToken(msg.sender,amount);
    }

    // users would be able to hit this function and get their NFT based on the characterId they send in!
    function mintCharacterNFT(uint _characterIndex) external {
        uint256 newItemId = _tokenIds.current();

        // Assigns the tokenId to the caller's wallet address
        _safeMint(msg.sender, newItemId);

        // tokenId => their character attributes
        nftHolderAttributes[newItemId] = CharacterAttributes({
            characterIndex: _characterIndex,
            name: defaultCharacters[_characterIndex].name,
            imageURI: defaultCharacters[_characterIndex].imageURI,
            hp: defaultCharacters[_characterIndex].hp,
            maxHp: defaultCharacters[_characterIndex].maxHp,
            attackDamage: defaultCharacters[_characterIndex].attackDamage,
            characterLevel: defaultCharacters[_characterIndex].characterLevel,
            tokenAirdropAmount: defaultCharacters[_characterIndex].tokenAirdropAmount,
            boss: defaultCharacters[_characterIndex].boss
        });

        console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);


        // NFT owner
        nftHolders[msg.sender] = newItemId;

        _tokenIds.increment();

        tokenAirdrop(defaultCharacters[_characterIndex].tokenAirdropAmount);

        emit CharacterNFTMinted(msg.sender, newItemId, _characterIndex);
    }

    function tokenURI(uint _tokenId) public view override returns (string memory) {
        CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];

        string memory strHp = Strings.toString(charAttributes.hp);
        string memory strMaxHp = Strings.toString(charAttributes.maxHp);
        string memory strAttackDamage = Strings.toString(charAttributes.attackDamage);
        string memory characterLevel = Strings.toString(charAttributes.characterLevel);

        string memory json = Base64.encode(
        bytes(
            string(
            abi.encodePacked(
                '{"name": "',
                charAttributes.name,
                ' -- NFT #: ',
                Strings.toString(_tokenId),
                '", "description": "An epic NFT", "image": "ipfs://',
                charAttributes.imageURI,
                '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'},{ "trait_type": "Character Level", "value": ',characterLevel,', "max_value":"10"},{ "trait_type": "Attack Damage", "value": ',
                strAttackDamage,'}]}'
            )
            )
        )
        );

        string memory output = string(
            abi.encodePacked("data:application/json;base64,",json)
        );
        return output;
    }

    function attackBoss() public {
        // Get the state of the player's NFT.
        uint256 nftTokenOfPlayer =  nftHolders[msg.sender];
        CharacterAttributes storage player = nftHolderAttributes[nftTokenOfPlayer];
        BigBoss storage boss = player.boss;

        console.log("\n Player w/ character %s about to attack. Has %s HP and %s AD", player.name, player.hp, player.attackDamage);
        console.log("Boss %s has %s HP and %s AD",boss.name, boss.hp, boss.attackDamage);

        // Make sure the player has more than 0 HP
        require(
            player.hp > 0,
            "Error: character must have HP to attack boss."
        );

        // Make sure the boss has more than 0 HP.
        require(
            boss.hp > 0,
            "Error: boss must have HP to attack boss."
        );

        // Allow player to attack boss.
        if (boss.hp < player.attackDamage) {
            boss.hp = 0;
        } else {
            boss.hp = boss.hp - player.attackDamage;
        }

        // Allow boss to attack player
        if (player.hp < boss.attackDamage) {
            player.hp = 0;
        } else {
            player.hp = player.hp - boss.attackDamage;
        }

        // Console for ease.
        console.log("Player Attacked boss. New boss hp: %s", boss.hp);
        console.log("Boss attacked player. New player hp: %s\n",player.hp);

        emit AttackComplete(boss.hp, player.hp);
    }   

    function claimWinningRewards() public{
        uint256 nftTokenOfPlayer =  nftHolders[msg.sender];
        CharacterAttributes storage playerData = nftHolderAttributes[nftTokenOfPlayer];
        BigBoss storage boss = playerData.boss;
        require(boss.hp == 0);
        matrixToken.transfer(msg.sender, playerData.tokenAirdropAmount);
        playerData.characterLevel += 1;
        playerData.hp = playerData.maxHp * 2;
        playerData.maxHp = playerData.maxHp * 2;
        boss.hp = boss.maxHp * 2;
        playerData.attackDamage += 25;
        boss.attackDamage += 25;
        emit ClaimRewards(boss.hp , boss.attackDamage, playerData.hp, playerData.attackDamage, playerData.tokenAirdropAmount );
    }

    function reviveCharacterNFT(uint _amount) public{
        // retrive player character NFT
        uint256 nftTokenOfPlayer =  nftHolders[msg.sender];
        CharacterAttributes storage playerData = nftHolderAttributes[nftTokenOfPlayer];
        require(playerData.hp <= 0,"error");
        playerData.hp += playerData.maxHp;
        matrixToken.burn(_amount);
        emit ReviveComplete(playerData.boss.hp, playerData.hp);
    }
}