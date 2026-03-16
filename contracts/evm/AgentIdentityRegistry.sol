// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentIdentityRegistry {
    struct AgentIdentity {
        bytes32 publicKeyHash;
        string agentAlias;
        string framework;
        uint256 registeredAt;
        bool active;
    }
    
    mapping(bytes32 => AgentIdentity) public agents;
    mapping(string => bytes32) public aliasToPubKeyHash;
    
    event AgentRegistered(bytes32 indexed publicKeyHash, string agentAlias, uint256 timestamp);
    event AgentVerified(bytes32 indexed publicKeyHash, uint256 timestamp);
    
    function register(bytes32 publicKeyHash, string calldata agentAlias, string calldata framework) external {
        require(!agents[publicKeyHash].active, "Already registered");
        agents[publicKeyHash] = AgentIdentity(publicKeyHash, agentAlias, framework, block.timestamp, true);
        aliasToPubKeyHash[agentAlias] = publicKeyHash;
        emit AgentRegistered(publicKeyHash, agentAlias, block.timestamp);
    }
    
    function verify(bytes32 publicKeyHash) external {
        require(agents[publicKeyHash].active, "Agent not registered");
        emit AgentVerified(publicKeyHash, block.timestamp);
    }
    
    function getAgent(bytes32 publicKeyHash) external view returns (AgentIdentity memory) {
        return agents[publicKeyHash];
    }
    
    function resolveAlias(string calldata agentAlias) external view returns (bytes32) {
        return aliasToPubKeyHash[agentAlias];
    }
}
