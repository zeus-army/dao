# ZEUS DAO - Quick Start Guide

## Overview

This guide provides step-by-step instructions to deploy the ZEUS Pepes Dog CTO DAO on **Ethereum Mainnet**.

---

## 💰 Cost Estimation

### Gas Costs Breakdown

| Operation | Gas Estimate | Cost @ 30 gwei | Cost @ 50 gwei | Cost @ 100 gwei |
|-----------|--------------|----------------|----------------|-----------------|
| Deploy TimelockController | ~2,500,000 | 0.075 ETH | 0.125 ETH | 0.250 ETH |
| Deploy wZEUS (Proxy + Impl) | ~3,500,000 | 0.105 ETH | 0.175 ETH | 0.350 ETH |
| Deploy Governor (Proxy + Impl) | ~5,000,000 | 0.150 ETH | 0.250 ETH | 0.500 ETH |
| Configure Timelock Roles | ~250,000 | 0.008 ETH | 0.013 ETH | 0.025 ETH |
| Transfer Ownership | ~100,000 | 0.003 ETH | 0.005 ETH | 0.010 ETH |
| **TOTAL** | **~11,350,000** | **≈ 0.341 ETH** | **≈ 0.568 ETH** | **≈ 1.135 ETH** |

### Current ETH Prices (Reference)

- At $3,000/ETH → $1,023 - $3,405 USD
- At $3,500/ETH → $1,194 - $3,973 USD
- At $4,000/ETH → $1,364 - $4,540 USD

**💡 Recommendation:** Have at least **0.6 ETH** (~$1,800-$2,400) in your deployer wallet to be safe.

---

## 🚀 Deployment Steps

### Step 1: Setup Project

```bash
cd /Users/albertogomeztoribio/git/zeus-dao
npm install
```

### Step 2: Generate Deployment Wallet

```bash
node scripts/generate-wallet.js
```

This will:
- Generate a new Ethereum wallet
- Display the address, private key, and mnemonic
- Save wallet info to `.wallets/` (backup)
- Show gas cost estimates

**⚠️ IMPORTANT:**
1. Save the mnemonic phrase in a secure location (password manager)
2. Copy the wallet address
3. Send **0.6 ETH** to the address for deployment gas

### Step 3: Configure Environment

Edit `.env` file and add:

```bash
# Add the private key (WITHOUT 0x prefix)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Add Etherscan API key (get from https://etherscan.io/myapikey)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

The Alchemy RPC URL is already configured.

### Step 4: Check Gas Price

Before deploying, check current Ethereum gas prices:
- https://etherscan.io/gastracker
- https://www.blocknative.com/gas-estimator

If gas is >100 gwei, consider waiting for lower prices to save money.

### Step 5: Deploy to Mainnet

```bash
npm run deploy:mainnet
```

This will:
1. Deploy TimelockController
2. Deploy WrappedZEUSVotes (wZEUS) with UUPS proxy
3. Deploy ZEUSGovernor with UUPS proxy
4. Configure all Timelock roles
5. Transfer ownership to Timelock
6. Save deployment info to `deployments/`

**Deployment takes ~5-10 minutes.** Monitor the terminal for progress.

### Step 6: Verify Contracts on Etherscan

```bash
npm run verify:mainnet
```

This will verify all contracts on Etherscan so users can:
- Read the source code
- Interact with the contracts directly
- See the DAO on Tally

### Step 7: Register on Tally

1. Go to https://www.tally.xyz/add-a-dao
2. Select "Ethereum Mainnet"
3. Enter the Governor Proxy address (from deployment output)
4. Fill in DAO information:
   - **Name:** ZEUS Pepes Dog CTO
   - **Description:** ZEUS Pepes Dog Community Take Over is a DAO that governs the community's resources and decides on the initiatives that the Zeus Army carries out for the ZEUS project
   - **Website:** [Your website]
   - **Twitter:** [Your Twitter handle]
   - **Discord:** [Your Discord invite]
5. Upload logo
6. Submit

**Indexing takes 5-15 minutes.** Your DAO will then be live on Tally!

---

## 📋 Post-Deployment Checklist

After successful deployment:

- [ ] ✅ All contracts deployed
- [ ] ✅ All contracts verified on Etherscan
- [ ] ✅ DAO registered on Tally
- [ ] ✅ Contract addresses saved
- [ ] ✅ Deployment wallet backed up
- [ ] ✅ Community announced deployment
- [ ] 📝 Update README with DAO URL
- [ ] 📝 Create announcement post
- [ ] 📝 Write user guide for community

---

## 🔗 Important Links (Fill After Deployment)

```
ZEUS Token: 0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8
wZEUS Proxy: [TO_BE_FILLED]
Governor Proxy: [TO_BE_FILLED]
Timelock: [TO_BE_FILLED]

Tally DAO Page: https://www.tally.xyz/gov/[YOUR_DAO]
Etherscan: https://etherscan.io/address/[GOVERNOR_ADDRESS]
```

---

## 📚 Additional Documentation

- **Full Deployment Plan:** [docs/DEPLOYMENT_PLAN.md](./docs/DEPLOYMENT_PLAN.md)
- **README:** [README.md](./README.md)
- **Contracts:** [contracts/](./contracts/)
- **Scripts:** [scripts/](./scripts/)

---

## 🎯 DAO Configuration Summary

| Parameter | Value |
|-----------|-------|
| **Voting Delay** | 1 block (~12 seconds) |
| **Voting Period** | 50,400 blocks (~1 week) |
| **Proposal Threshold** | 4,206,900,000,000 wZEUS (1% of supply) |
| **Quorum** | 1% of wZEUS supply |
| **Timelock Delay** | 86,400 seconds (1 day) |

---

## ❓ Common Issues

### "Insufficient funds"
→ Send more ETH to the deployer wallet

### "Gas estimation failed"
→ Check if the ZEUS token address is correct in the config

### "Already deployed"
→ Deployment creates proxy contracts, re-running is safe but may fail

### "Verification failed"
→ Wait a few minutes and retry. Etherscan can be slow.

---

## 🆘 Need Help?

- Check [docs/DEPLOYMENT_PLAN.md](./docs/DEPLOYMENT_PLAN.md) for detailed information
- Review [OpenZeppelin Governor Docs](https://docs.openzeppelin.com/contracts/governance)
- Visit [Tally Documentation](https://docs.tally.xyz)

---

**Good luck with your deployment! 🚀**
