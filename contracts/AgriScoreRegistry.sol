// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgriScoreRegistry {
    struct Anchor {
        address farmer;
        uint256 score;
        bytes32 scoreHash;
        uint256 timestamp;
    }

    event AgriScoreAnchored(
        address indexed farmer,
        uint256 indexed score,
        bytes32 indexed scoreHash,
        uint256 timestamp
    );

    mapping(address => Anchor[]) public anchorsByFarmer;

    function anchorAgriScore(uint256 score, bytes32 scoreHash) external {
        Anchor memory anchor = Anchor({
            farmer: msg.sender,
            score: score,
            scoreHash: scoreHash,
            timestamp: block.timestamp
        });

        anchorsByFarmer[msg.sender].push(anchor);
        emit AgriScoreAnchored(msg.sender, score, scoreHash, block.timestamp);
    }

    function getAnchorCount(address farmer) external view returns (uint256) {
        return anchorsByFarmer[farmer].length;
    }
}
