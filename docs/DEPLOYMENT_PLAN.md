# ZEUS Pepes Dog CTO - DAO Deployment Plan

## Executive Summary

This document provides a complete deployment plan for the **ZEUS Pepes Dog Community Take Over (CTO) DAO**, a governance system that will manage community resources and decide on initiatives for the ZEUS Army project.

**Network:** Ethereum Mainnet
**Architecture:** OpenZeppelin Governor + ERC20Wrapper + TimelockController (Upgradeable)
**Documentation Date:** 2025-10-20

---

## Table of Contents

1. [DAO Overview](#dao-overview)
2. [Technical Architecture](#technical-architecture)
3. [Governance Parameters](#governance-parameters)
4. [Smart Contracts](#smart-contracts)
5. [Deployment Process](#deployment-process)
6. [Verification & Registration](#verification--registration)
7. [User Guide](#user-guide)
8. [Security Considerations](#security-considerations)
9. [Testing Plan](#testing-plan)

---

## 1. DAO Overview

### Name
**ZEUS Pepes Dog CTO**

### Purpose
ZEUS Pepes Dog Community Take Over is a DAO that governs the community's resources and decides on the initiatives that the Zeus Army carries out for the ZEUS project.

### Governance Token
- **Original Token:** ZEUS (Pepes Dog)
- **Address:** `0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8`
- **Type:** ERC20 Standard (no voting extension)
- **Decimals:** 9
- **Total Supply:** 420,690,000,000,000 ZEUS

### Voting Token (Wrapped)
- **Name:** Wrapped ZEUS (wZEUS)
- **Type:** ERC20Wrapper + ERC20Votes + UUPS Upgradeable
- **Ratio:** 1:1 (1 ZEUS = 1 wZEUS)

---

## 2. Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      ZEUS DAO System                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   ZEUS Token     │  Original ERC20 token
│   (0x0f7d...cc8) │  No voting capabilities
└────────┬─────────┘
         │
         │ wrap/unwrap (1:1)
         │
         ▼
┌──────────────────┐
│  wZEUS Wrapper   │  ERC20Wrapper + ERC20Votes
│   (Upgradeable)  │  Checkpointing & Delegation
└────────┬─────────┘
         │
         │ voting power
         │
         ▼
┌──────────────────┐
│  Governor        │  Proposal management
│   (Upgradeable)  │  Voting logic
└────────┬─────────┘
         │
         │ successful proposals
         │
         ▼
┌──────────────────┐
│  Timelock        │  Root of authority
│  Controller      │  1-day execution delay
└──────────────────┘
         │
         ▼
   ┌────────────┐
   │  Protocol  │
   │   Assets   │
   └────────────┘
```

### Contract Interactions Flow

1. **Wrapping:** User deposits ZEUS → receives wZEUS
2. **Delegation:** User delegates wZEUS voting power (to self or others)
3. **Proposal Creation:** User with >4.2T wZEUS creates proposal
4. **Voting:** Users vote during 1-week period
5. **Queuing:** Successful proposals queue in Timelock (1-day delay)
6. **Execution:** Anyone can execute after delay expires

---

## 3. Governance Parameters

### Core Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Voting Delay** | 1 block | Time before voting starts after proposal creation |
| **Voting Period** | 50,400 blocks | ~1 week - Time voting remains open |
| **Quorum** | 1% | Minimum % of supply that must vote YES for validity |
| **Proposal Threshold** | 4,206,900,000,000 wZEUS | Minimum voting power to create proposals (1% of total supply) |
| **Timelock Delay** | 86,400 seconds | 1 day - Delay between approval and execution |

### Calculated Values

**Voting Period Calculation:**
- 1 week = 7 days × 24 hours × 60 minutes × 60 seconds = 604,800 seconds
- Ethereum block time ≈ 12 seconds
- 604,800 ÷ 12 = **50,400 blocks**

**Proposal Threshold Calculation:**
- Total Supply: 420,690,000,000,000 ZEUS
- 1% = 420,690,000,000,000 × 0.01 = **4,206,900,000,000 ZEUS**
- In wei (9 decimals): 4,206,900,000,000 × 10^9 = 4,206,900,000,000,000,000,000

**Quorum Calculation:**
- Quorum Fraction: 1% = 1/100 (numerator = 1, denominator = 100)
- Dynamic: Adjusts based on current wZEUS supply

### Voting Options

- **For:** Vote in favor of the proposal
- **Against:** Vote against the proposal
- **Abstain:** Vote to participate in quorum without supporting or opposing

### Updatable Settings

Via governance proposals, the DAO can update:
- ✅ Voting Delay
- ✅ Voting Period
- ✅ Proposal Threshold
- ✅ Quorum Percentage

### Clock Mode

**Block Number** - Voting power and timing based on Ethereum block numbers (standard for Tally compatibility)

---

## 4. Smart Contracts

### 4.1 Wrapped ZEUS Token (wZEUS)

**Contract:** `WrappedZEUSVotes.sol`

**Features:**
- ERC20Wrapper (wraps ZEUS 1:1)
- ERC20Votes (voting power + delegation)
- ERC20Permit (gasless approvals)
- UUPSUpgradeable (upgradeable logic)

**Key Functions:**
```solidity
// Wrapping
depositFor(address account, uint256 amount) → uint256
withdrawTo(address account, uint256 amount) → uint256

// Voting Power
delegate(address delegatee)
getVotes(address account) → uint256
getPastVotes(address account, uint256 blockNumber) → uint256

// Permit (Gasless)
permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
```

### 4.2 Governor Contract

**Contract:** `ZEUSGovernor.sol`

**Extensions:**
- Governor (core logic)
- GovernorSettings (updatable parameters)
- GovernorCountingSimple (For/Against/Abstain voting)
- GovernorVotes (voting power from wZEUS)
- GovernorVotesQuorumFraction (dynamic quorum)
- GovernorTimelockControl (timelock integration)
- UUPSUpgradeable (upgradeable logic)

**Key Functions:**
```solidity
// Proposal Management
propose(address[] targets, uint256[] values, bytes[] calldatas, string description) → uint256
castVote(uint256 proposalId, uint8 support) → uint256
castVoteWithReason(uint256 proposalId, uint8 support, string reason) → uint256
queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) → uint256
execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) → uint256

// Views
state(uint256 proposalId) → ProposalState
proposalVotes(uint256 proposalId) → (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
hasVoted(uint256 proposalId, address account) → bool
```

### 4.3 Timelock Controller

**Contract:** `TimelockController.sol` (OpenZeppelin standard)

**Configuration:**
- Min Delay: 86,400 seconds (1 day)
- Proposer Role: Governor contract only
- Executor Role: Governor contract only
- Admin Role: Timelock itself (self-administered)

**Key Functions:**
```solidity
schedule(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, uint256 delay)
execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt)
cancel(bytes32 id)
```

---

## 5. Deployment Process

### Prerequisites

1. **Node.js & npm** (v18+)
2. **Hardhat** or **Foundry**
3. **Deployer Wallet** with ETH for gas
4. **Environment Variables:**
   - `DEPLOYER_PRIVATE_KEY`
   - `ETHERSCAN_API_KEY`
   - `MAINNET_RPC_URL`

### Deployment Order

**IMPORTANT:** Contracts must be deployed in this specific order due to dependencies.

```
1. Deploy TimelockController
   ├─ Set minDelay = 86400
   ├─ Proposers: [ZERO_ADDRESS] (will be updated)
   ├─ Executors: [ZERO_ADDRESS] (will be updated)
   └─ Admin: deployer (temporary)

2. Deploy WrappedZEUSVotes (Proxy + Implementation)
   ├─ Initialize with ZEUS token address
   └─ Set name: "Wrapped ZEUS", symbol: "wZEUS"

3. Deploy ZEUSGovernor (Proxy + Implementation)
   ├─ Initialize with:
   │  ├─ token: wZEUS address
   │  ├─ timelock: Timelock address
   │  ├─ votingDelay: 1
   │  ├─ votingPeriod: 50400
   │  ├─ proposalThreshold: 4206900000000000000000 (4.2T * 10^9)
   │  └─ quorumNumerator: 1 (1%)
   └─ Set name: "ZEUS Pepes Dog CTO"

4. Configure Timelock Roles
   ├─ Grant PROPOSER_ROLE to Governor
   ├─ Grant EXECUTOR_ROLE to Governor
   ├─ Grant TIMELOCK_ADMIN_ROLE to Timelock (self-admin)
   └─ Revoke TIMELOCK_ADMIN_ROLE from deployer

5. Transfer Ownership (if applicable)
   └─ Transfer any admin rights to Timelock
```

### Gas Estimates (Ethereum Mainnet)

| Operation | Estimated Gas | Cost @ 30 gwei |
|-----------|---------------|----------------|
| Deploy TimelockController | ~2,500,000 | ~0.075 ETH |
| Deploy wZEUS (Proxy + Impl) | ~3,000,000 | ~0.09 ETH |
| Deploy Governor (Proxy + Impl) | ~4,500,000 | ~0.135 ETH |
| Configure Timelock Roles | ~200,000 | ~0.006 ETH |
| **TOTAL** | **~10,200,000** | **~0.306 ETH** |

**Recommendation:** Have at least **0.5 ETH** in deployer wallet for safety margin.

---

## 6. Verification & Registration

### 6.1 Etherscan Verification

After deployment, verify all contracts on Etherscan:

```bash
# Verify Timelock
npx hardhat verify --network mainnet <TIMELOCK_ADDRESS> \
  86400 [] [] <DEPLOYER_ADDRESS>

# Verify wZEUS Implementation
npx hardhat verify --network mainnet <WZEUS_IMPL_ADDRESS>

# Verify wZEUS Proxy
npx hardhat verify --network mainnet <WZEUS_PROXY_ADDRESS> \
  <WZEUS_IMPL_ADDRESS> <ENCODED_INIT_DATA>

# Verify Governor Implementation
npx hardhat verify --network mainnet <GOVERNOR_IMPL_ADDRESS>

# Verify Governor Proxy
npx hardhat verify --network mainnet <GOVERNOR_PROXY_ADDRESS> \
  <GOVERNOR_IMPL_ADDRESS> <ENCODED_INIT_DATA>
```

### 6.2 Tally Registration

**Steps to register on Tally.xyz:**

1. Go to https://www.tally.xyz/add-a-dao
2. Select "Ethereum Mainnet"
3. Enter Governor contract address
4. Fill DAO information:
   - Name: ZEUS Pepes Dog CTO
   - Description: ZEUS Pepes Dog Community Take Over is a DAO that governs the community's resources and decides on the initiatives that the Zeus Army carries out for the ZEUS project
   - Website: [Your website]
   - Twitter: [Your Twitter]
   - Discord: [Your Discord]
5. Upload logo/avatar
6. Submit for indexing

**Indexing Time:** 5-15 minutes
**Note:** First proposal may take up to 8 minutes to appear

---

## 7. User Guide

### 7.1 Wrapping ZEUS Tokens

**Why wrap?** Only wrapped ZEUS (wZEUS) has voting power. The original ZEUS token must be wrapped to participate in governance.

**Steps:**

1. **Approve wZEUS contract to spend ZEUS:**
   ```javascript
   // On Etherscan or via Web3
   ZEUS.approve(wZEUS_ADDRESS, AMOUNT_TO_WRAP)
   ```

2. **Deposit ZEUS to receive wZEUS:**
   ```javascript
   wZEUS.depositFor(YOUR_ADDRESS, AMOUNT_TO_WRAP)
   ```

3. **Verify wZEUS balance:**
   ```javascript
   wZEUS.balanceOf(YOUR_ADDRESS)
   ```

**Example:**
- You have: 10,000,000,000,000 ZEUS
- You wrap: 10,000,000,000,000 ZEUS
- You receive: 10,000,000,000,000 wZEUS (1:1 ratio)

### 7.2 Unwrapping wZEUS

To convert wZEUS back to ZEUS:

```javascript
wZEUS.withdrawTo(YOUR_ADDRESS, AMOUNT_TO_UNWRAP)
```

**Note:** You can unwrap at any time. Unwrapping removes your voting power.

### 7.3 Delegating Voting Power

**CRITICAL:** You must delegate voting power to activate it. Even if you want to vote yourself, you must delegate to your own address.

**Delegate to yourself:**
```javascript
wZEUS.delegate(YOUR_ADDRESS)
```

**Delegate to another address:**
```javascript
wZEUS.delegate(DELEGATE_ADDRESS)
```

**Check your voting power:**
```javascript
wZEUS.getVotes(YOUR_ADDRESS)
```

**Via Tally UI:**
1. Go to your DAO page on Tally
2. Click "Delegate"
3. Enter address (or select "Delegate to self")
4. Sign transaction

### 7.4 Creating a Proposal

**Requirements:**
- Hold ≥4,206,900,000,000 wZEUS voting power (delegated)
- Have delegated before the proposal block

**Via Tally UI:**
1. Click "Create Proposal"
2. Add title and description (supports Markdown)
3. Add executable actions (optional):
   - Target contract address
   - Function to call
   - Parameters
   - ETH value (if sending funds)
4. Submit proposal
5. Wait 1 block for voting to begin

**Via Smart Contract:**
```javascript
governor.propose(
  [target1, target2, ...],      // Array of target addresses
  [value1, value2, ...],         // Array of ETH values (in wei)
  [calldata1, calldata2, ...],   // Array of encoded function calls
  "# Proposal Title\n\nDescription..."  // Markdown description
)
```

### 7.5 Voting on Proposals

**Requirements:**
- Hold wZEUS with delegated voting power at proposal snapshot block
- Voting period must be active (after voting delay, before voting ends)

**Via Tally UI:**
1. Go to proposal page
2. Click "Vote"
3. Select: For / Against / Abstain
4. (Optional) Add voting reason
5. Sign transaction

**Via Smart Contract:**
```javascript
// Simple vote
governor.castVote(proposalId, support)  // 0=Against, 1=For, 2=Abstain

// Vote with reason
governor.castVoteWithReason(proposalId, support, "My reason...")
```

**Voting Power:**
- Your voting power is snapshotted at the proposal creation block
- Tokens acquired after proposal creation don't count
- You cannot change your vote once cast

### 7.6 Proposal Lifecycle

```
Proposal Created
    ↓
[Voting Delay: 1 block]
    ↓
Voting Active ← Users vote here
    ↓
[Voting Period: 50,400 blocks / ~1 week]
    ↓
Voting Ends
    ↓
    ├─→ DEFEATED (more Against than For, or didn't reach quorum)
    │
    └─→ SUCCEEDED (majority For + quorum reached)
         ↓
    Queue in Timelock
         ↓
    [Timelock Delay: 1 day]
         ↓
    Execute ← Anyone can execute
         ↓
    EXECUTED
```

### 7.7 Queuing and Executing Proposals

**After a proposal succeeds:**

1. **Queue the proposal:**
   ```javascript
   governor.queue(targets, values, calldatas, descriptionHash)
   ```
   - Must wait 1 day before execution

2. **Execute the proposal:**
   ```javascript
   governor.execute(targets, values, calldatas, descriptionHash)
   ```
   - Can be called by anyone after timelock delay

**Via Tally UI:**
- "Queue" and "Execute" buttons appear automatically when available

---

## 8. Security Considerations

### 8.1 Wrapping Safety

- ✅ **No Fees:** ZEUS token has 0% tax on transfers (confirmed)
- ✅ **1:1 Ratio:** Guaranteed by ERC20Wrapper
- ✅ **Audited Code:** Using OpenZeppelin audited contracts
- ⚠️ **Wrapped Tokens:** Only wZEUS can vote, not original ZEUS

### 8.2 Timelock Protection

- ✅ **1-Day Delay:** Community can exit protocol before execution
- ✅ **Self-Administered:** Timelock controls itself (no external admin)
- ✅ **Transparent:** All queued transactions visible on-chain

### 8.3 Quorum & Threshold Risks

- ⚠️ **Low Quorum (1%):** Makes it easier to pass proposals
  - **Risk:** Low participation could allow small group to control DAO
  - **Mitigation:** Active community engagement and proposal monitoring

- ⚠️ **High Proposal Threshold (1%):** Requires 4.2T tokens to propose
  - **Risk:** Hard for individual to create proposals alone
  - **Mitigation:** Community can delegate voting power to trusted proposers

### 8.4 Upgradability Risks

- ✅ **UUPS Pattern:** Upgrade logic in implementation (more gas efficient)
- ⚠️ **Upgrade Power:** Governor (via Timelock) can upgrade contracts
  - **Risk:** Malicious upgrade could change contract behavior
  - **Mitigation:** 1-day timelock delay allows community to verify upgrades

### 8.5 Best Practices

1. **For Users:**
   - Only wrap tokens when you want to participate in governance
   - Unwrap when not actively voting to maintain full liquidity
   - Verify proposal details on Etherscan before voting
   - Monitor Discord/Twitter for security alerts

2. **For Proposers:**
   - Test proposal transactions on testnet first
   - Provide detailed descriptions and rationale
   - Allow adequate discussion time before proposal
   - Respond to community questions

3. **For DAO:**
   - Consider requiring multi-sig co-sign for high-value proposals
   - Implement proposal templates for common actions
   - Maintain emergency pause procedures
   - Regular security audits after upgrades

---

## 9. Testing Plan

### 9.1 Pre-Deployment Testing (Testnet)

**Deploy to Sepolia/Goerli first:**

1. **Contract Deployment Test:**
   - ✅ All contracts deploy successfully
   - ✅ Initialization parameters correct
   - ✅ Role configuration complete

2. **Wrapping Test:**
   - ✅ Deploy mock ZEUS token on testnet
   - ✅ Wrap tokens (1:1 ratio verified)
   - ✅ Unwrap tokens (full amount recovered)
   - ✅ Balance tracking accurate

3. **Delegation Test:**
   - ✅ Self-delegation works
   - ✅ Delegate to another address works
   - ✅ Voting power updates correctly
   - ✅ Historical voting power queryable

4. **Proposal Test:**
   - ✅ Create proposal with threshold amount
   - ✅ Proposal creation fails without threshold
   - ✅ Voting delay works (can't vote immediately)
   - ✅ Voting period active at correct block

5. **Voting Test:**
   - ✅ Vote For/Against/Abstain all work
   - ✅ Voting power calculated correctly
   - ✅ Cannot vote twice
   - ✅ Cannot vote with tokens acquired after snapshot

6. **Quorum Test:**
   - ✅ Proposal succeeds with >50% For votes and 1% quorum
   - ✅ Proposal fails with majority but <1% quorum
   - ✅ Abstain votes count toward quorum

7. **Timelock Test:**
   - ✅ Successful proposal can be queued
   - ✅ Cannot execute before delay expires
   - ✅ Can execute after delay expires
   - ✅ Anyone can execute (not just proposer)

8. **Upgrade Test:**
   - ✅ Upgrade wZEUS via governance proposal
   - ✅ Upgrade Governor via governance proposal
   - ✅ Data persists after upgrade

### 9.2 Post-Deployment Testing (Mainnet)

**After mainnet deployment:**

1. **Verification:**
   - ✅ All contracts verified on Etherscan
   - ✅ Contract addresses match documentation
   - ✅ Parameters match specification

2. **Basic Operations:**
   - ✅ Wrap small amount of ZEUS
   - ✅ Delegate to test address
   - ✅ Check voting power on Etherscan

3. **Tally Integration:**
   - ✅ DAO appears on Tally
   - ✅ Token shows correct name/symbol
   - ✅ Parameters display correctly
   - ✅ Voting power shows for test address

4. **First Proposal (Test):**
   - ✅ Create simple test proposal (e.g., update quorum)
   - ✅ Proposal appears on Tally within 8 minutes
   - ✅ Voting works on Tally UI
   - ✅ Proposal lifecycle completes successfully

### 9.3 Security Audit Checklist

**Before handling significant funds:**

- [ ] Code review by experienced Solidity developers
- [ ] Formal audit by reputable firm (OpenZeppelin, Trail of Bits, etc.)
- [ ] Bug bounty program on Immunefi
- [ ] Timelock on all privileged operations tested
- [ ] Emergency pause mechanism tested
- [ ] Upgrade mechanism tested and documented

---

## 10. Contract Addresses (To Be Filled After Deployment)

```
Network: Ethereum Mainnet (Chain ID: 1)

Deployed by: [DEPLOYER_ADDRESS]
Deployment Date: [DATE]
Deployment Transaction: [TX_HASH]

═══════════════════════════════════════════════════════════

Token Contracts:
├─ ZEUS (Original):     0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8
├─ wZEUS Proxy:         [TO_BE_FILLED]
└─ wZEUS Implementation: [TO_BE_FILLED]

Governance Contracts:
├─ Governor Proxy:         [TO_BE_FILLED]
├─ Governor Implementation: [TO_BE_FILLED]
└─ TimelockController:     [TO_BE_FILLED]

═══════════════════════════════════════════════════════════

Tally Page: https://www.tally.xyz/gov/[DAO_NAME]
```

---

## 11. Support & Resources

### Official Links
- **Tally Documentation:** https://docs.tally.xyz
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/contracts/
- **Governor Guide:** https://wizard.openzeppelin.com/#governor

### Community Support
- Discord: [Your Discord Link]
- Twitter: [Your Twitter]
- Telegram: [Your Telegram]

### Emergency Contacts
- Core Team: [Contact Info]
- Security: [Security Email]

---

## Appendix A: Technical Specifications

### wZEUS Token Interface

```solidity
interface IWrappedZEUS is IERC20, IERC20Permit, IVotes {
    // Wrapping
    function depositFor(address account, uint256 amount) external returns (bool);
    function withdrawTo(address account, uint256 amount) external returns (bool);
    function underlying() external view returns (IERC20);

    // Voting
    function delegate(address delegatee) external;
    function getVotes(address account) external view returns (uint256);
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);

    // Upgrades
    function upgradeTo(address newImplementation) external;
    function upgradeToAndCall(address newImplementation, bytes memory data) external payable;
}
```

### Governor Interface

```solidity
interface IZEUSGovernor is IGovernor, IGovernorTimelock {
    // Settings
    function votingDelay() external view returns (uint256);
    function votingPeriod() external view returns (uint256);
    function proposalThreshold() external view returns (uint256);
    function quorum(uint256 blockNumber) external view returns (uint256);

    // Proposals
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId);

    function castVote(uint256 proposalId, uint8 support) external returns (uint256);
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) external returns (uint256);

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256);

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256);

    // Views
    function state(uint256 proposalId) external view returns (ProposalState);
    function proposalSnapshot(uint256 proposalId) external view returns (uint256);
    function proposalDeadline(uint256 proposalId) external view returns (uint256);
    function proposalVotes(uint256 proposalId) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes);

    // Upgrades
    function upgradeTo(address newImplementation) external;
    function upgradeToAndCall(address newImplementation, bytes memory data) external payable;
}
```

---

**End of Deployment Plan**

*This document should be kept updated as the DAO evolves and new features are added.*
