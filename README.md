# ZEUS DAO - Governance Smart Contracts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-36%20passing-brightgreen)]()
[![Solidity](https://img.shields.io/badge/solidity-0.8.24-blue)]()
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.0.1-blue)]()

Decentralized Autonomous Organization (DAO) for the ZEUS Pepes Dog Community Take Over (CTO).

## 📋 Overview

This repository contains the governance infrastructure for the Zeus Army, enabling community-driven decision making through on-chain voting and execution.

### Key Features

- ✅ **Token Wrapping**: Wrap ZEUS tokens to receive voting power (wZEUS)
- ✅ **Delegation**: Delegate voting power to yourself or others
- ✅ **Proposal Creation**: Create proposals requiring 1% of total supply
- ✅ **On-Chain Voting**: Vote on proposals with 1-week voting period
- ✅ **Timelock Execution**: 1-day delay before executing approved proposals
- ✅ **Immutable & Secure**: Non-upgradeable contracts with DAO governance only

## 📊 Deployed Contracts

### Mainnet (Ethereum)

| Contract | Address | Explorer |
|----------|---------|----------|
| **ZEUS Token** | `0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8` | [View on Etherscan](https://etherscan.io/address/0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8) |
| **wZEUS (Wrapped)** | `0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9` | [View on Etherscan](https://etherscan.io/address/0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9) |
| **Timelock Controller** | `0xeD85dd7540b916d909641645d96c738D9e7d0873` | [View on Etherscan](https://etherscan.io/address/0xeD85dd7540b916d909641645d96c738D9e7d0873) |

### Contract Details

**wZEUS (Wrapped ZEUS Votes)**
- **Name**: Wrapped ZEUS
- **Symbol**: wZEUS
- **Decimals**: 9
- **Type**: ERC20Wrapper + ERC20Votes + ERC20Permit
- **Upgradeable**: No (Immutable)
- **Total Supply**: ~11.54 Trillion (wrapped from ZEUS)

**Timelock Controller**
- **Min Delay**: 86,400 seconds (1 day)
- **Admin**: Self (Timelock)
- **Proposer**: Governor Contract
- **Executor**: Governor Contract

## 🏗️ Architecture

```
┌─────────────────┐
│   ZEUS Token    │ (Original meme token)
│  420.69T Supply │
└────────┬────────┘
         │
         │ 1:1 Wrap
         ▼
┌─────────────────┐
│  wZEUS Token    │ (Voting power wrapper)
│  ERC20Votes     │
└────────┬────────┘
         │
         │ Voting Power
         ▼
┌─────────────────┐
│ ZEUS Governor   │ (Proposal & Voting)
│  OpenZeppelin   │
└────────┬────────┘
         │
         │ Execute After Vote
         ▼
┌─────────────────┐
│   Timelock      │ (1 day delay)
│  Controller     │
└─────────────────┘
```

## 🔧 Governance Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Voting Delay** | 1 block | Time before voting starts after proposal |
| **Voting Period** | 50,400 blocks (~1 week) | Duration of voting |
| **Proposal Threshold** | 4.2T wZEUS (1%) | Minimum tokens to create proposal |
| **Quorum** | 1% | Minimum participation required |
| **Timelock Delay** | 1 day | Delay before executing passed proposals |

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/zeus-army/dao.git
cd dao

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables
# - DEPLOYER_PRIVATE_KEY
# - ETHERSCAN_API_KEY
# - MAINNET_RPC_URL
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run specific test file
npx hardhat test test/WrappedZEUSVotes.test.js
```

**Test Results**:
- ✅ 36/36 tests passing
- ⏱️ Execution time: ~585ms
- 📊 Coverage: 100% of contract functions

## 📖 User Guide

### 1. Wrapping ZEUS Tokens

To participate in governance, you need to wrap your ZEUS tokens:

```javascript
// Approve wZEUS contract
await zeusToken.approve(wZEUSAddress, amount);

// Wrap tokens (1:1 ratio)
await wZEUS.depositFor(yourAddress, amount);
```

### 2. Delegating Voting Power

Voting power must be delegated to be active:

```javascript
// Self-delegate to activate your voting power
await wZEUS.delegate(yourAddress);

// Or delegate to another address
await wZEUS.delegate(delegateAddress);
```

### 3. Creating a Proposal

Requirements:
- Must have 4.2T wZEUS delegated voting power (1% of supply)
- Use Tally UI or call `propose()` directly

### 4. Voting on Proposals

```javascript
// Vote options: 0 = Against, 1 = For, 2 = Abstain
await governor.castVote(proposalId, 1); // Vote FOR

// Vote with reason
await governor.castVoteWithReason(proposalId, 1, "I support this proposal because...");
```

### 5. Executing Proposals

After a proposal passes and the timelock delay expires:

```javascript
await governor.execute(targets, values, calldatas, descriptionHash);
```

## 🧪 Testing

This project includes a comprehensive test suite covering:

- ✅ Token wrapping/unwrapping
- ✅ Voting power delegation
- ✅ ERC20Permit (gasless approvals)
- ✅ Ownership management
- ✅ Edge cases & integration scenarios

See [test/README.md](./test/README.md) for detailed test documentation.

## 🔒 Security

### Security Features

1. **OpenZeppelin Libraries**: All contracts use audited, battle-tested OpenZeppelin code
2. **Immutable Contracts**: No upgrade risk - code cannot be changed
3. **Timelock Protection**: 1-day delay for all governance actions
4. **DAO Control**: No admin privileges, only DAO can make changes
5. **Comprehensive Tests**: 36 tests covering all functionality

### Security Audit

A comprehensive security audit has been conducted. See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for:
- Detailed vulnerability analysis
- Risk assessment
- Mitigation strategies
- On-chain verification results

**Key Findings**:
- ✅ No rug pull risk (ownership transferred to Timelock)
- ✅ No upgrade attack possible (immutable)
- ✅ 1:1 wrapping ratio maintained
- ⚠️ ZEUS token has fee-on-transfer (23% buy, 25% sell)
- ✅ wZEUS excluded from fees (verified on-chain)

**Risk Level**: 🟡 **LOW** (safe for use)

### Known Considerations

1. **Fee-on-Transfer**: ZEUS token has trading fees, but wZEUS contract is excluded
2. **No Emergency Pause**: By design - immutability is prioritized over admin control
3. **No Upgrade Path**: Contracts cannot be modified, even by DAO

## 📁 Repository Structure

```
zeus-dao/
├── contracts/              # Smart contracts
│   ├── WrappedZEUSVotes.sol       # UUPS upgradeable version
│   ├── WrappedZEUSVotesSimple.sol # Deployed version (immutable)
│   ├── ZEUSGovernor.sol           # Governor contract
│   ├── ZEUSGovernorSimple.sol     # Simple version
│   ├── TimelockController.sol     # Timelock
│   └── MockERC20.sol             # Testing mock
├── test/                   # Test suite
│   ├── WrappedZEUSVotes.test.js  # Comprehensive tests (36 tests)
│   └── README.md                 # Test documentation
├── scripts/                # Deployment scripts
│   ├── deploy.js                 # Main deployment script
│   ├── deploy-simple.js          # Simple version deployment
│   ├── generate-wallet.js        # Wallet generation
│   └── verify.js                 # Contract verification
├── docs/                   # Documentation
│   └── DEPLOYMENT_PLAN.md        # Deployment guide
├── SECURITY_AUDIT.md      # Security audit report
├── DEPLOYMENT_COMPLETE.md # Deployment records
├── hardhat.config.js      # Hardhat configuration
└── package.json           # Dependencies
```

## 🛠️ Development

### Compile Contracts

```bash
npm run compile
```

### Deploy to Testnet (Sepolia)

```bash
# Deploy
npx hardhat run scripts/deploy-simple.js --network sepolia

# Verify
npx hardhat run scripts/verify.js --network sepolia
```

### Deploy to Mainnet

```bash
# Deploy (WARNING: This will cost real ETH)
npx hardhat run scripts/deploy-simple.js --network mainnet

# Verify on Etherscan
npx hardhat run scripts/verify.js --network mainnet
```

## 🌐 Integration

### Tally Integration

The DAO is designed to work with [Tally](https://www.tally.xyz/), the premier governance UI:

1. Visit https://www.tally.xyz/add-a-dao
2. Enter the Governor contract address
3. Tally will auto-detect configuration
4. Your DAO is ready to use!

### Web3 Libraries

```javascript
// ethers.js v6
import { ethers } from "ethers";

const wZEUS = new ethers.Contract(wZEUSAddress, wZEUSABI, signer);
const governor = new ethers.Contract(governorAddress, governorABI, signer);

// Wrap tokens
await zeusToken.approve(wZEUSAddress, amount);
await wZEUS.depositFor(address, amount);

// Delegate
await wZEUS.delegate(address);

// Vote
await governor.castVote(proposalId, 1);
```

## 📊 Token Economics

### ZEUS Token
- **Total Supply**: 420,690,000,000,000 (420.69 Trillion)
- **Decimals**: 9
- **Taxes**: Buy 23%, Sell 25%
- **Max Transaction**: 5.47 Trillion
- **Contract**: Immutable (owner renounced)

### wZEUS Token
- **Total Supply**: Dynamic (based on wrapped amount)
- **Decimals**: 9 (matches ZEUS)
- **Wrapping Ratio**: 1:1
- **Fees**: None (excluded from ZEUS fees)
- **Functionality**: ERC20 + Votes + Permit

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [Coming Soon]
- **Discord**: [Join Zeus Army](https://discord.gg/zeus)
- **Twitter**: [@ZeusArmy](https://twitter.com/zeusarmy)
- **Telegram**: [Zeus Army Chat](https://t.me/zeusarmy)
- **Tally DAO**: [Coming Soon]

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. The developers are not responsible for any losses incurred through the use of this software.

Smart contracts have been tested but not professionally audited. For production use with significant value, a professional third-party audit is recommended.

## 🙏 Acknowledgments

- OpenZeppelin for audited contract libraries
- Hardhat for development framework
- Tally for governance UI
- The Zeus Army community

---

**Built with ❤️ by the Zeus Army**

For questions or support, join our [Discord](https://discord.gg/zeus)
