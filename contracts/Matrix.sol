// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Matrix is ERC20 {
    // State variables
    
    uint claimAmount = 10 * 10**18;

    constructor (
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public ERC20(name, symbol) {
        _mint(msg.sender,initialSupply);
    }

    function burn(uint256 amount) public {
        console.log(tx.origin);
        _burn(tx.origin,amount);
    }
}