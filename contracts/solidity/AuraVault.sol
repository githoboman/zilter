// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuraToken {
    function mint(address to, uint256 amount) external returns (bool);
    function burn(address from, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title AuraVault
 * @notice Core CDP Vault for Aura Finance on BOT Chain (Chain ID: 968)
 * @dev Accepts native BOT tokens as collateral, mints aBTC synthetic tokens up to 50% LTV
 */
contract AuraVault {
    address public owner;
    IAuraToken public auraToken;

    // Protocol parameters
    uint256 public constant LTV_BPS = 5000;          // 50.00% Loan to Value
    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public constant BOT_PRICE_USD = 2e18;     // Mock Oracle: 1 BOT = $2.00 USD (18 decimals)
    uint256 public constant ABTC_PRICE_USD = 100000e18;// Mock Oracle: 1 aBTC = $100,000 USD (18 decimals)

    // User positions
    mapping(address => uint256) public botDeposits;
    mapping(address => uint256) public debt; // in aBTC (18 decimals)

    // Protocol metrics
    uint256 public totalBotDeposited;
    uint256 public totalDebt;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Minted(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event OwnershipTransferred(address indexed prevOwner, address indexed newOwner);
    event TokenSet(address indexed token);

    modifier onlyOwner() {
        require(msg.sender == owner, "AuraVault: caller is not owner");
        _;
    }

    constructor(address _auraToken) {
        owner = msg.sender;
        if (_auraToken != address(0)) {
            auraToken = IAuraToken(_auraToken);
        }
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function setAuraToken(address _auraToken) external onlyOwner {
        require(_auraToken != address(0), "Invalid token address");
        auraToken = IAuraToken(_auraToken);
        emit TokenSet(_auraToken);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Deposit native BOT coins as collateral into the vault
     */
    function deposit() external payable {
        require(msg.value > 0, "Deposit must be > 0");

        botDeposits[msg.sender] += msg.value;
        totalBotDeposited += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Mint aBTC against deposited BOT collateral
     * @param amountToMint Amount of aBTC to mint (18 decimals)
     */
    function mint(uint256 amountToMint) external {
        require(address(auraToken) != address(0), "AuraToken not set");
        require(amountToMint > 0, "Mint amount must be > 0");
        require(botDeposits[msg.sender] > 0, "No collateral deposited");

        uint256 maxAllowed = calculateMaxBorrowable(msg.sender);
        uint256 newDebt = debt[msg.sender] + amountToMint;
        require(newDebt <= maxAllowed, "Exceeds 50% LTV borrowing capacity");

        debt[msg.sender] = newDebt;
        totalDebt += amountToMint;

        require(auraToken.mint(msg.sender, amountToMint), "Token mint failed");
        emit Minted(msg.sender, amountToMint);
    }

    /**
     * @notice Repay aBTC debt to unlock collateral
     * @param amountToRepay Amount of aBTC to repay (18 decimals)
     */
    function repay(uint256 amountToRepay) external {
        require(address(auraToken) != address(0), "AuraToken not set");
        require(amountToRepay > 0, "Repay amount must be > 0");
        require(debt[msg.sender] >= amountToRepay, "Repay exceeds debt");

        debt[msg.sender] -= amountToRepay;
        totalDebt -= amountToRepay;

        require(auraToken.burn(msg.sender, amountToRepay), "Token burn failed");
        emit Repaid(msg.sender, amountToRepay);
    }

    /**
     * @notice Withdraw deposited BOT collateral while maintaining minimum LTV
     * @param amount Amount of BOT to withdraw (in wei)
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be > 0");
        require(botDeposits[msg.sender] >= amount, "Insufficient deposited collateral");

        uint256 remainingDeposit = botDeposits[msg.sender] - amount;
        
        // If user has active debt, ensure remaining deposit maintains >= 50% LTV
        if (debt[msg.sender] > 0) {
            uint256 remainingCollateralUsd = (remainingDeposit * BOT_PRICE_USD) / 1e18;
            uint256 maxDebtAllowedUsd = (remainingCollateralUsd * LTV_BPS) / BPS_DIVISOR;
            uint256 currentDebtUsd = (debt[msg.sender] * ABTC_PRICE_USD) / 1e18;
            require(currentDebtUsd <= maxDebtAllowedUsd, "Withdrawal would violate minimum 50% LTV");
        }

        botDeposits[msg.sender] = remainingDeposit;
        totalBotDeposited -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "BOT transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // --- View Functions ---

    function getBalance(address user) external view returns (uint256) {
        return botDeposits[user];
    }

    function getDebt(address user) external view returns (uint256) {
        return debt[user];
    }

    function calculateMaxBorrowable(address user) public view returns (uint256) {
        uint256 depositAmount = botDeposits[user];
        if (depositAmount == 0) return 0;

        uint256 collateralValueUsd = (depositAmount * BOT_PRICE_USD) / 1e18;
        uint256 maxBorrowValueUsd = (collateralValueUsd * LTV_BPS) / BPS_DIVISOR;
        return (maxBorrowValueUsd * 1e18) / ABTC_PRICE_USD;
    }

    function getMaxBorrowable(address user) external view returns (uint256) {
        uint256 totalMax = calculateMaxBorrowable(user);
        uint256 currentDebt = debt[user];
        if (totalMax <= currentDebt) return 0;
        return totalMax - currentDebt;
    }

    function getCollateralValueUsd(address user) external view returns (uint256) {
        return (botDeposits[user] * BOT_PRICE_USD) / 1e18;
    }

    function getVaultStats() external view returns (
        uint256 _totalBotDeposited,
        uint256 _totalDebt,
        uint256 _ltvBps,
        uint256 _botPriceUsd,
        uint256 _abtcPriceUsd
    ) {
        return (totalBotDeposited, totalDebt, LTV_BPS, BOT_PRICE_USD, ABTC_PRICE_USD);
    }

    receive() external payable {
        if (msg.value > 0) {
            botDeposits[msg.sender] += msg.value;
            totalBotDeposited += msg.value;
            emit Deposited(msg.sender, msg.value);
        }
    }
}
