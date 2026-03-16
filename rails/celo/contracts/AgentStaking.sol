// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract AgentStaking {
    IERC20 public stakeToken; // cUSD
    
    uint256 public constant MIN_STAKE = 1e18; // 1 cUSD
    uint256 public constant SLASH_PERCENT = 20;
    
    mapping(bytes32 => uint256) public stakes;
    mapping(bytes32 => address) public stakeOwner;
    mapping(bytes32 => bool) public slashed;
    
    address public owner;
    
    event Staked(bytes32 indexed publicKeyHash, address indexed staker, uint256 amount);
    event Slashed(bytes32 indexed publicKeyHash, uint256 amount, string reason);
    event Unstaked(bytes32 indexed publicKeyHash, address indexed staker, uint256 amount);
    
    constructor(address _stakeToken) {
        stakeToken = IERC20(_stakeToken);
        owner = msg.sender;
    }
    
    function stake(bytes32 publicKeyHash, uint256 amount) external {
        require(amount >= MIN_STAKE, "Below minimum stake");
        require(stakeToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakes[publicKeyHash] += amount;
        stakeOwner[publicKeyHash] = msg.sender;
        emit Staked(publicKeyHash, msg.sender, amount);
    }
    
    function slash(bytes32 publicKeyHash, string calldata reason) external {
        require(msg.sender == owner, "Only owner");
        require(stakes[publicKeyHash] > 0, "No stake");
        uint256 slashAmount = (stakes[publicKeyHash] * SLASH_PERCENT) / 100;
        stakes[publicKeyHash] -= slashAmount;
        slashed[publicKeyHash] = true;
        emit Slashed(publicKeyHash, slashAmount, reason);
    }
    
    function unstake(bytes32 publicKeyHash) external {
        require(msg.sender == stakeOwner[publicKeyHash], "Not stake owner");
        require(!slashed[publicKeyHash], "Slashed agents cannot unstake");
        uint256 amount = stakes[publicKeyHash];
        require(amount > 0, "Nothing to unstake");
        stakes[publicKeyHash] = 0;
        require(stakeToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(publicKeyHash, msg.sender, amount);
    }
    
    function getStake(bytes32 publicKeyHash) external view returns (uint256) {
        return stakes[publicKeyHash];
    }
}
