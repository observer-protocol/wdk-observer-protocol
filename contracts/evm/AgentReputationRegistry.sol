// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentReputationRegistry {
    struct ReputationRecord {
        uint256 verificationCount;
        uint256 paymentCount;
        uint256 totalAmountVerified;
        uint256 reputationScore;
        uint256 lastUpdated;
    }
    
    mapping(bytes32 => ReputationRecord) public reputation;
    address public owner;
    
    event ReputationUpdated(bytes32 indexed publicKeyHash, uint256 newScore, uint256 timestamp);
    
    constructor() {
        owner = msg.sender;
    }
    
    function recordVerification(bytes32 publicKeyHash) external {
        reputation[publicKeyHash].verificationCount++;
        _recalcScore(publicKeyHash);
        emit ReputationUpdated(publicKeyHash, reputation[publicKeyHash].reputationScore, block.timestamp);
    }
    
    function recordPayment(bytes32 publicKeyHash, uint256 amount) external {
        reputation[publicKeyHash].paymentCount++;
        reputation[publicKeyHash].totalAmountVerified += amount;
        _recalcScore(publicKeyHash);
        emit ReputationUpdated(publicKeyHash, reputation[publicKeyHash].reputationScore, block.timestamp);
    }
    
    function _recalcScore(bytes32 publicKeyHash) internal {
        ReputationRecord storage r = reputation[publicKeyHash];
        uint256 score = 10 + (r.verificationCount * 5) + (r.paymentCount * 3);
        r.reputationScore = score > 100 ? 100 : score;
        r.lastUpdated = block.timestamp;
    }
    
    function getReputation(bytes32 publicKeyHash) external view returns (ReputationRecord memory) {
        return reputation[publicKeyHash];
    }
}
