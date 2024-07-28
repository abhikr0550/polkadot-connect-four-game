// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts@4.4.1/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.4.1/access/Ownable.sol";

contract PolkaFourInARow is ERC721, Ownable {
    uint256 private COST = 1 ether;
    mapping(address => uint256) private players;

    constructor() ERC721("PolkaFourInARow", "PFIR" ) {
    }

    function startPlay() external payable {
        require(msg.value >= COST, "Not enough");
        players[msg.sender] = 1;
    }

    function claimReward() public payable{
        require(players[msg.sender] == 1, "Player hasn't played");
        players[msg.sender] = 0;
        payable(msg.sender).transfer(COST*2);
    }

    function withdrawBalance() public onlyOwner
    {
        require(address(this).balance > 0, "Balance is 0");
        payable(owner()).transfer(address(this).balance);
    }
}