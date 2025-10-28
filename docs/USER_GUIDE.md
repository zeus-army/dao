# wZEUS User Guide - How to Participate in Governance

This guide explains how to wrap your ZEUS tokens, delegate voting power, and participate in the Zeus Army DAO.

## Table of Contents

1. [What is wZEUS?](#what-is-wzeus)
2. [Why Wrap ZEUS?](#why-wrap-zeus)
3. [How to Wrap ZEUS](#how-to-wrap-zeus)
4. [How to Delegate Voting Power](#how-to-delegate-voting-power)
5. [How to Vote on Proposals](#how-to-vote-on-proposals)
6. [How to Unwrap wZEUS](#how-to-unwrap-wzeus)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

---

## What is wZEUS?

**wZEUS (Wrapped ZEUS)** is a wrapped version of the ZEUS token that adds governance capabilities. It maintains a 1:1 ratio with ZEUS and allows you to:

- **Vote** on DAO proposals
- **Delegate** your voting power to others
- **Create proposals** (if you have enough tokens)
- **Use gasless approvals** with EIP-2612 Permit

**Key Properties**:
- ✅ 1:1 ratio with ZEUS (no fees)
- ✅ Fully backed by ZEUS tokens
- ✅ ERC20 compatible
- ✅ Can be unwrapped anytime
- ✅ No transfer fees

---

## Why Wrap ZEUS?

The original ZEUS token doesn't have built-in governance features. By wrapping your ZEUS into wZEUS, you:

1. **Gain voting power** for DAO governance
2. **Keep full control** - unwrap anytime
3. **Participate** in community decisions
4. **Delegate** if you don't want to vote directly
5. **Use gasless approvals** for better UX

---

## How to Wrap ZEUS

### Prerequisites

- ZEUS tokens in your wallet
- ETH for gas fees (small amount)
- MetaMask or compatible Web3 wallet

### Step-by-Step Process

#### Option 1: Using Etherscan (Web Interface)

1. **Go to the wZEUS contract on Etherscan**
   - Visit: https://etherscan.io/address/0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9
   - Click "Contract" tab
   - Click "Write Contract"

2. **Connect your wallet**
   - Click "Connect to Web3"
   - Approve MetaMask connection

3. **Approve wZEUS to spend your ZEUS**
   - Go to ZEUS token contract: https://etherscan.io/address/0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8
   - Click "Contract" → "Write Contract"
   - Find function `approve`
   - Enter:
     - `spender`: `0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9`
     - `amount`: Amount in smallest units (9 decimals)
       - Example: For 1,000 ZEUS, enter: `1000000000000` (1000 + 9 zeros)
   - Click "Write" and confirm transaction

4. **Wrap your ZEUS**
   - Return to wZEUS contract
   - Find function `depositFor`
   - Enter:
     - `account`: Your wallet address (0x...)
     - `amount`: Same amount as approved (in smallest units)
   - Click "Write" and confirm transaction

5. **Verify you received wZEUS**
   - Add wZEUS to MetaMask:
     - Token Address: `0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9`
     - Symbol: `wZEUS`
     - Decimals: `9`
   - Check your balance

#### Option 2: Using Web3 Code

```javascript
// Using ethers.js v6
import { ethers } from "ethers";

// Contract addresses
const ZEUS_ADDRESS = "0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8";
const WZEUS_ADDRESS = "0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9";

// ABIs (simplified)
const ZEUS_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const WZEUS_ABI = [
  "function depositFor(address account, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

async function wrapZEUS(amountToWrap) {
  // Connect to wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  // Connect to contracts
  const zeusToken = new ethers.Contract(ZEUS_ADDRESS, ZEUS_ABI, signer);
  const wZEUS = new ethers.Contract(WZEUS_ADDRESS, WZEUS_ABI, signer);

  // Amount with 9 decimals
  const amount = ethers.parseUnits(amountToWrap.toString(), 9);

  console.log("Step 1: Approving wZEUS contract...");
  const approveTx = await zeusToken.approve(WZEUS_ADDRESS, amount);
  await approveTx.wait();
  console.log("✅ Approved");

  console.log("Step 2: Wrapping ZEUS...");
  const wrapTx = await wZEUS.depositFor(userAddress, amount);
  await wrapTx.wait();
  console.log("✅ Wrapped successfully!");

  // Check balance
  const balance = await wZEUS.balanceOf(userAddress);
  console.log(`Your wZEUS balance: ${ethers.formatUnits(balance, 9)}`);
}

// Example: Wrap 1000 ZEUS
wrapZEUS(1000);
```

### Understanding the Amounts

ZEUS and wZEUS use **9 decimals**. This means:

| Display Amount | Actual Value (with decimals) |
|----------------|-------------------------------|
| 1 ZEUS | 1000000000 (1 + 9 zeros) |
| 100 ZEUS | 100000000000 (100 + 9 zeros) |
| 1,000 ZEUS | 1000000000000 (1000 + 9 zeros) |
| 1,000,000 ZEUS | 1000000000000000 (1M + 9 zeros) |

**Calculator**: `Display Amount × 10^9 = Actual Value`

---

## How to Delegate Voting Power

After wrapping, you must delegate your voting power to activate it.

### Why Delegate?

- Voting power is **NOT active** by default
- You must delegate to yourself OR someone else
- Delegation is free (only gas cost)
- You can change delegation anytime

### Self-Delegation (Vote Yourself)

#### Using Etherscan

1. Go to wZEUS contract: https://etherscan.io/address/0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9
2. Click "Contract" → "Write Contract"
3. Connect wallet
4. Find function `delegate`
5. Enter your own wallet address
6. Click "Write" and confirm

#### Using Web3 Code

```javascript
const wZEUS = new ethers.Contract(WZEUS_ADDRESS, [
  "function delegate(address delegatee)"
], signer);

const userAddress = await signer.getAddress();
await wZEUS.delegate(userAddress);
console.log("✅ Self-delegated! You can now vote.");
```

### Delegate to Someone Else

Same process, but enter the delegatee's address instead of yours.

```javascript
const delegateeAddress = "0x..."; // Address of person you trust
await wZEUS.delegate(delegateeAddress);
```

### Check Your Voting Power

```javascript
const wZEUS = new ethers.Contract(WZEUS_ADDRESS, [
  "function getVotes(address account) view returns (uint256)"
], provider);

const votes = await wZEUS.getVotes(userAddress);
console.log(`Your voting power: ${ethers.formatUnits(votes, 9)} votes`);
```

---

## How to Vote on Proposals

### Using Tally (Recommended)

1. Visit **Tally**: https://www.tally.xyz
2. Search for "Zeus Army DAO" (once registered)
3. Connect your wallet
4. Browse active proposals
5. Click on a proposal
6. Click "Vote" and select:
   - **For** - Support the proposal
   - **Against** - Oppose the proposal
   - **Abstain** - Counted in quorum but no preference
7. Optionally add a comment
8. Sign and submit transaction

### Using Etherscan

1. Go to Governor contract on Etherscan
2. Find function `castVote`
3. Enter:
   - `proposalId`: The proposal ID (uint256)
   - `support`: 0 (Against), 1 (For), 2 (Abstain)
4. Submit transaction

### Using Web3 Code

```javascript
const GOVERNOR_ABI = [
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)"
];

const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer);

// Vote FOR a proposal
await governor.castVote(proposalId, 1);

// Or vote with a reason
await governor.castVoteWithReason(
  proposalId,
  1,
  "I support this proposal because..."
);
```

---

## How to Unwrap wZEUS

You can unwrap your wZEUS back to ZEUS anytime (1:1 ratio).

### Using Etherscan

1. Go to wZEUS contract: https://etherscan.io/address/0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9
2. Click "Contract" → "Write Contract"
3. Connect wallet
4. Find function `withdrawTo`
5. Enter:
   - `account`: Your wallet address
   - `amount`: Amount to unwrap (with 9 decimals)
6. Click "Write" and confirm

### Using Web3 Code

```javascript
const wZEUS = new ethers.Contract(WZEUS_ADDRESS, [
  "function withdrawTo(address account, uint256 amount) returns (bool)"
], signer);

const userAddress = await signer.getAddress();
const amount = ethers.parseUnits("1000", 9); // Unwrap 1000 wZEUS

await wZEUS.withdrawTo(userAddress, amount);
console.log("✅ Unwrapped successfully!");
```

**Note**: After unwrapping, you lose voting power for those tokens.

---

## Security Considerations

### ✅ Safe Practices

1. **Always verify contract addresses**
   - wZEUS: `0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9`
   - ZEUS: `0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8`

2. **Use hardware wallets** for large amounts
   - Ledger or Trezor recommended

3. **Test with small amounts first**
   - Wrap/unwrap 1 token to verify process

4. **Check gas fees**
   - Monitor gas prices on https://etherscan.io/gastracker
   - Wait for lower gas if not urgent

5. **Verify transactions**
   - Always check Etherscan after transactions
   - Confirm correct amounts received

### ⚠️ Things to Know

1. **No transfer fees**
   - ZEUS has 0% transfer fees
   - wZEUS has 0% transfer fees
   - Only standard gas costs apply

2. **1:1 ratio guaranteed**
   - Always receive exactly 1 wZEUS per 1 ZEUS
   - Always receive exactly 1 ZEUS per 1 wZEUS

3. **Voting power requires delegation**
   - Wrapping alone doesn't give voting power
   - Must delegate to self or others

4. **Delegation doesn't transfer tokens**
   - You keep full ownership
   - Can unwrap anytime
   - Can change delegation anytime

5. **Immutable contract**
   - No one can upgrade the contract
   - No admin privileges
   - Code cannot be changed

### 🚨 Warnings

- ❌ **Never share your private key**
- ❌ **Never approve unlimited amounts** (use exact amounts)
- ❌ **Don't trust DMs** about the contract
- ❌ **Verify all addresses** before transactions
- ❌ **Don't use unknown frontends** - stick to Etherscan or verified dApps

---

## Troubleshooting

### Problem: Transaction Failed

**Possible Causes**:
1. **Insufficient gas** - Increase gas limit
2. **Insufficient ZEUS balance** - Check your ZEUS balance
3. **Insufficient approval** - Approve more tokens
4. **Slippage** - Try again (rare for wrapping)

**Solution**: Check error message on Etherscan and retry with correct parameters.

### Problem: Don't See wZEUS in Wallet

**Solution**: Add token manually to MetaMask:
- Token Address: `0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9`
- Symbol: `wZEUS`
- Decimals: `9`

### Problem: Voting Power Shows Zero

**Causes**:
1. Haven't delegated yet
2. Delegated to someone else

**Solution**:
- Check delegation: Call `delegates(yourAddress)` on contract
- Self-delegate if needed

### Problem: Can't Create Proposal

**Cause**: Need 4.2 Trillion wZEUS (1% of supply)

**Solution**:
- Wrap more tokens OR
- Ask someone with enough tokens to create it OR
- Get delegation from other holders

### Problem: High Gas Fees

**Solution**:
- Wait for lower gas times (check https://etherscan.io/gastracker)
- Typically lower on weekends or late at night UTC
- Consider batching operations

---

## Quick Reference

### Contract Addresses

| Contract | Address |
|----------|---------|
| **ZEUS** | `0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8` |
| **wZEUS** | `0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9` |
| **Timelock** | `0xeD85dd7540b916d909641645d96c738D9e7d0873` |

### Key Functions

| Action | Function | Parameters |
|--------|----------|------------|
| **Approve** | `approve()` | spender, amount |
| **Wrap** | `depositFor()` | account, amount |
| **Unwrap** | `withdrawTo()` | account, amount |
| **Delegate** | `delegate()` | delegatee |
| **Vote** | `castVote()` | proposalId, support |

### Support Values for Voting

| Value | Meaning |
|-------|---------|
| `0` | Against |
| `1` | For |
| `2` | Abstain |

---

## Additional Resources

- **Etherscan**: https://etherscan.io/address/0xA56B06AA7Bfa6cbaD8A0b5161ca052d86a5D88E9
- **GitHub Repository**: https://github.com/zeus-army/dao
- **Security Audit**: [SECURITY_AUDIT.md](../SECURITY_AUDIT.md)
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/contracts/governance
- **Tally Docs**: https://docs.tally.xyz

---

## Summary

1. ✅ **Wrap ZEUS** → Get wZEUS (1:1 ratio)
2. ✅ **Delegate** → Activate voting power
3. ✅ **Vote** → Participate in governance
4. ✅ **Unwrap** → Get ZEUS back anytime

**Remember**: You always maintain full control of your tokens!

---

*Need help? Check the repository issues or reach out to the community.*
