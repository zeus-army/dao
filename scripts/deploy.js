const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deployment Configuration
const CONFIG = {
  zeusTokenAddress: "0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8",
  votingDelay: 1, // 1 block
  votingPeriod: 50400, // ~1 week
  proposalThreshold: ethers.parseUnits("4206900000000", 9), // 4.2T tokens with 9 decimals
  quorumNumerator: 1, // 1%
  timelockMinDelay: 86400, // 1 day in seconds
};

async function main() {
  console.log("====================================");
  console.log("ZEUS DAO DEPLOYMENT SCRIPT");
  console.log("====================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // ==========================================
  // STEP 1: Deploy TimelockController
  // ==========================================
  console.log("📝 Step 1: Deploying TimelockController...");

  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(
    CONFIG.timelockMinDelay, // minDelay
    [], // proposers (empty, will be set later)
    [], // executors (empty, will be set later)
    deployer.address // admin (temporary)
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();

  console.log("✅ TimelockController deployed to:", timelockAddress);
  deployment.contracts.timelock = {
    address: timelockAddress,
    minDelay: CONFIG.timelockMinDelay,
  };

  // ==========================================
  // STEP 2: Deploy WrappedZEUSVotes (Proxy + Implementation)
  // ==========================================
  console.log("\n📝 Step 2: Deploying WrappedZEUSVotes (UUPS Proxy)...");

  const WrappedZEUSVotes = await ethers.getContractFactory("WrappedZEUSVotes");
  const wZEUS = await upgrades.deployProxy(
    WrappedZEUSVotes,
    [CONFIG.zeusTokenAddress],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );
  await wZEUS.waitForDeployment();
  const wZEUSAddress = await wZEUS.getAddress();
  const wZEUSImplAddress = await upgrades.erc1967.getImplementationAddress(wZEUSAddress);

  console.log("✅ wZEUS Proxy deployed to:", wZEUSAddress);
  console.log("   wZEUS Implementation at:", wZEUSImplAddress);
  deployment.contracts.wZEUS = {
    proxy: wZEUSAddress,
    implementation: wZEUSImplAddress,
    underlyingToken: CONFIG.zeusTokenAddress,
  };

  // ==========================================
  // STEP 3: Deploy ZEUSGovernor (Proxy + Implementation)
  // ==========================================
  console.log("\n📝 Step 3: Deploying ZEUSGovernor (UUPS Proxy)...");

  const ZEUSGovernor = await ethers.getContractFactory("ZEUSGovernor");
  const governor = await upgrades.deployProxy(
    ZEUSGovernor,
    [
      wZEUSAddress, // token
      timelockAddress, // timelock
      CONFIG.votingDelay,
      CONFIG.votingPeriod,
      CONFIG.proposalThreshold,
      CONFIG.quorumNumerator,
    ],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  const governorImplAddress = await upgrades.erc1967.getImplementationAddress(governorAddress);

  console.log("✅ ZEUSGovernor Proxy deployed to:", governorAddress);
  console.log("   ZEUSGovernor Implementation at:", governorImplAddress);
  deployment.contracts.governor = {
    proxy: governorAddress,
    implementation: governorImplAddress,
    parameters: {
      votingDelay: CONFIG.votingDelay,
      votingPeriod: CONFIG.votingPeriod,
      proposalThreshold: ethers.formatUnits(CONFIG.proposalThreshold, 9),
      quorumNumerator: CONFIG.quorumNumerator,
    },
  };

  // ==========================================
  // STEP 4: Configure Timelock Roles
  // ==========================================
  console.log("\n📝 Step 4: Configuring Timelock roles...");

  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  // Grant PROPOSER_ROLE to Governor
  console.log("   Granting PROPOSER_ROLE to Governor...");
  let tx = await timelock.grantRole(PROPOSER_ROLE, governorAddress);
  await tx.wait();
  console.log("   ✅ PROPOSER_ROLE granted");

  // Grant EXECUTOR_ROLE to Governor
  console.log("   Granting EXECUTOR_ROLE to Governor...");
  tx = await timelock.grantRole(EXECUTOR_ROLE, governorAddress);
  await tx.wait();
  console.log("   ✅ EXECUTOR_ROLE granted");

  // Grant ADMIN_ROLE to Timelock itself (self-admin)
  console.log("   Granting ADMIN_ROLE to Timelock (self-admin)...");
  tx = await timelock.grantRole(ADMIN_ROLE, timelockAddress);
  await tx.wait();
  console.log("   ✅ ADMIN_ROLE granted to Timelock");

  // Revoke ADMIN_ROLE from deployer
  console.log("   Revoking ADMIN_ROLE from deployer...");
  tx = await timelock.renounceRole(ADMIN_ROLE, deployer.address);
  await tx.wait();
  console.log("   ✅ Deployer admin role renounced");

  // ==========================================
  // STEP 5: Transfer Ownership to Timelock
  // ==========================================
  console.log("\n📝 Step 5: Transferring ownership to Timelock...");

  // Transfer wZEUS ownership
  console.log("   Transferring wZEUS ownership...");
  tx = await wZEUS.transferOwnership(timelockAddress);
  await tx.wait();
  console.log("   ✅ wZEUS ownership transferred");

  // Transfer Governor ownership
  console.log("   Transferring Governor ownership...");
  tx = await governor.transferOwnership(timelockAddress);
  await tx.wait();
  console.log("   ✅ Governor ownership transferred");

  // ==========================================
  // STEP 6: Save Deployment Info
  // ==========================================
  console.log("\n📝 Step 6: Saving deployment information...");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `deployment-${deployment.chainId}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  console.log("✅ Deployment info saved to:", filepath);

  // Also save latest deployment
  const latestPath = path.join(deploymentsDir, `latest-${deployment.chainId}.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deployment, null, 2));

  // ==========================================
  // DEPLOYMENT SUMMARY
  // ==========================================
  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT COMPLETED SUCCESSFULLY");
  console.log("=".repeat(50));
  console.log("\n📋 Contract Addresses:\n");
  console.log("ZEUS Token (Original):", CONFIG.zeusTokenAddress);
  console.log("wZEUS Proxy:          ", wZEUSAddress);
  console.log("wZEUS Implementation: ", wZEUSImplAddress);
  console.log("Governor Proxy:       ", governorAddress);
  console.log("Governor Implementation:", governorImplAddress);
  console.log("Timelock Controller:  ", timelockAddress);

  console.log("\n📊 Configuration:\n");
  console.log("Voting Delay:         ", CONFIG.votingDelay, "blocks");
  console.log("Voting Period:        ", CONFIG.votingPeriod, "blocks (~1 week)");
  console.log("Proposal Threshold:   ", ethers.formatUnits(CONFIG.proposalThreshold, 9), "wZEUS");
  console.log("Quorum:               ", CONFIG.quorumNumerator, "%");
  console.log("Timelock Delay:       ", CONFIG.timelockMinDelay, "seconds (1 day)");

  console.log("\n🔐 Ownership:\n");
  console.log("wZEUS Owner:     ", await wZEUS.owner());
  console.log("Governor Owner:  ", await governor.owner());
  console.log("(Both should be Timelock address)");

  console.log("\n📝 Next Steps:\n");
  console.log("1. Verify contracts on Etherscan:");
  console.log("   npm run verify:mainnet");
  console.log("\n2. Register DAO on Tally:");
  console.log("   https://www.tally.xyz/add-a-dao");
  console.log("\n3. Update .env file with contract addresses");
  console.log("\n4. Test wrapping and delegation");

  console.log("\n" + "=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
