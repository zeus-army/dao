const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

/**
 * Generates a new Ethereum wallet for deployment
 * IMPORTANT: Store the private key securely!
 */
async function main() {
  console.log("====================================");
  console.log("WALLET GENERATOR FOR DEPLOYMENT");
  console.log("====================================\n");

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("🔐 New Wallet Generated:\n");
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);
  console.log("Mnemonic:    ", wallet.mnemonic.phrase);

  console.log("\n" + "=".repeat(50));
  console.log("⚠️  SECURITY WARNINGS");
  console.log("=".repeat(50));
  console.log("\n1. NEVER share your private key with anyone");
  console.log("2. Store the mnemonic in a secure location (password manager, hardware wallet)");
  console.log("3. Add the private key to your .env file:");
  console.log(`   DEPLOYER_PRIVATE_KEY=${wallet.privateKey.slice(2)}`);
  console.log("4. Send ETH to this address for deployment gas:");
  console.log(`   ${wallet.address}`);

  console.log("\n" + "=".repeat(50));
  console.log("💰 GAS COST ESTIMATION");
  console.log("=".repeat(50));
  console.log("\nEstimated gas costs for Ethereum Mainnet deployment:");
  console.log("\nAt 30 gwei gas price:");
  console.log("  Deploy TimelockController:    ~2,500,000 gas  ≈ 0.075 ETH");
  console.log("  Deploy wZEUS (Proxy + Impl):  ~3,500,000 gas  ≈ 0.105 ETH");
  console.log("  Deploy Governor (Proxy+Impl): ~5,000,000 gas  ≈ 0.150 ETH");
  console.log("  Configure Timelock roles:     ~250,000 gas    ≈ 0.008 ETH");
  console.log("  Transfer ownership:           ~100,000 gas    ≈ 0.003 ETH");
  console.log("  " + "-".repeat(45));
  console.log("  TOTAL:                       ~11,350,000 gas  ≈ 0.341 ETH");

  console.log("\nAt 50 gwei gas price:");
  console.log("  TOTAL:                                       ≈ 0.568 ETH");

  console.log("\nAt 100 gwei gas price (congested network):");
  console.log("  TOTAL:                                       ≈ 1.135 ETH");

  console.log("\n⚠️  Recommendation: Have at least 0.6 ETH in the wallet");
  console.log("   Current ETH price: Check https://coinmarketcap.com/");

  console.log("\n" + "=".repeat(50));
  console.log("📝 NEXT STEPS");
  console.log("=".repeat(50));
  console.log("\n1. Send ETH to:", wallet.address);
  console.log("2. Add private key to .env file");
  console.log("3. Get Etherscan API key from https://etherscan.io/myapikey");
  console.log("4. Run deployment: npm run deploy:mainnet");
  console.log("5. Verify contracts: npm run verify:mainnet");
  console.log("6. Register on Tally: https://www.tally.xyz/add-a-dao");

  // Save wallet info to file (for backup)
  const walletsDir = path.join(__dirname, "../.wallets");
  if (!fs.existsSync(walletsDir)) {
    fs.mkdirSync(walletsDir);
  }

  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    createdAt: new Date().toISOString(),
    purpose: "ZEUS DAO Deployment",
  };

  const filename = `wallet-${Date.now()}.json`;
  const filepath = path.join(walletsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(walletInfo, null, 2));

  console.log("\n💾 Wallet info saved to:", filepath);
  console.log("⚠️  Keep this file secure and delete after deployment!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
