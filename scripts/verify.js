const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  console.log("====================================");
  console.log("ZEUS DAO VERIFICATION SCRIPT");
  console.log("====================================\n");

  // Load latest deployment
  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();
  const deploymentPath = path.join(__dirname, "../deployments", `latest-${chainId}.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ No deployment found for chain ID:", chainId);
    console.error("Please run deployment first: npm run deploy:mainnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📂 Loaded deployment from:", deploymentPath);
  console.log("Network:", deployment.network);
  console.log("Chain ID:", deployment.chainId, "\n");

  const CONFIG = {
    zeusTokenAddress: "0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8",
    votingDelay: 1,
    votingPeriod: 50400,
    proposalThreshold: hre.ethers.parseUnits("4206900000000", 9),
    quorumNumerator: 1,
    timelockMinDelay: 86400,
  };

  // ==========================================
  // VERIFY TIMELOCK CONTROLLER
  // ==========================================
  console.log("📝 Verifying TimelockController...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.timelock.address,
      constructorArguments: [
        CONFIG.timelockMinDelay,
        [], // proposers
        [], // executors
        deployment.deployer, // admin
      ],
    });
    console.log("✅ TimelockController verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("⚠️  TimelockController already verified\n");
    } else {
      console.error("❌ Error verifying TimelockController:", error.message, "\n");
    }
  }

  // ==========================================
  // VERIFY WRAPPED ZEUS IMPLEMENTATION
  // ==========================================
  console.log("📝 Verifying wZEUS Implementation...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.wZEUS.implementation,
      constructorArguments: [],
    });
    console.log("✅ wZEUS Implementation verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("⚠️  wZEUS Implementation already verified\n");
    } else {
      console.error("❌ Error verifying wZEUS Implementation:", error.message, "\n");
    }
  }

  // Note: Proxy verification is automatic with Hardhat

  // ==========================================
  // VERIFY GOVERNOR IMPLEMENTATION
  // ==========================================
  console.log("📝 Verifying Governor Implementation...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.governor.implementation,
      constructorArguments: [],
    });
    console.log("✅ Governor Implementation verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("⚠️  Governor Implementation already verified\n");
    } else {
      console.error("❌ Error verifying Governor Implementation:", error.message, "\n");
    }
  }

  // ==========================================
  // VERIFICATION SUMMARY
  // ==========================================
  console.log("=".repeat(50));
  console.log("VERIFICATION COMPLETED");
  console.log("=".repeat(50));
  console.log("\n📋 Verified Contracts:\n");
  console.log("TimelockController:");
  console.log(`  https://etherscan.io/address/${deployment.contracts.timelock.address}#code`);
  console.log("\nwZEUS Proxy:");
  console.log(`  https://etherscan.io/address/${deployment.contracts.wZEUS.proxy}#code`);
  console.log("wZEUS Implementation:");
  console.log(`  https://etherscan.io/address/${deployment.contracts.wZEUS.implementation}#code`);
  console.log("\nGovernor Proxy:");
  console.log(`  https://etherscan.io/address/${deployment.contracts.governor.proxy}#code`);
  console.log("Governor Implementation:");
  console.log(`  https://etherscan.io/address/${deployment.contracts.governor.implementation}#code`);
  console.log("\n" + "=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
