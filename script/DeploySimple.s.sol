// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../contracts/WrappedZEUSVotesSimple.sol";
import "../contracts/ZEUSGovernorSimple.sol";

/**
 * @title DeploySimple
 * @dev Foundry script to deploy ZEUS DAO without UUPS (non-upgradeable)
 *
 * This script deploys all contracts as simple, immutable contracts:
 * - TimelockController
 * - WrappedZEUSVotesSimple
 * - ZEUSGovernorSimple
 * - Configure roles and ownership
 */
contract DeploySimple is Script {
    // Configuration
    address constant ZEUS_TOKEN = 0x0f7dC5D02CC1E1f5Ee47854d534D332A1081cCC8;
    uint48 constant VOTING_DELAY = 1;
    uint32 constant VOTING_PERIOD = 50400;
    uint256 constant PROPOSAL_THRESHOLD = 4_206_900_000_000 * 10**9; // 4.2T * 10^9 decimals
    uint256 constant QUORUM_NUMERATOR = 1;
    uint256 constant TIMELOCK_MIN_DELAY = 86400; // 1 day

    // Role constants
    bytes32 constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 constant DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY_SIMPLE");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("====================================");
        console.log("ZEUS DAO DEPLOYMENT (SIMPLE - NO UUPS)");
        console.log("====================================\n");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH\n");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy TimelockController
        console.log("Step 1: Deploying TimelockController...");
        address[] memory proposers = new address[](0); // Will be set later to Governor
        address[] memory executors = new address[](0); // Will be set later to Governor
        TimelockController timelock = new TimelockController(
            TIMELOCK_MIN_DELAY,
            proposers,
            executors,
            deployer // Admin initially
        );
        console.log("  TimelockController deployed at:", address(timelock));

        // Step 2: Deploy WrappedZEUSVotesSimple
        console.log("\nStep 2: Deploying WrappedZEUSVotesSimple...");
        WrappedZEUSVotesSimple wZEUS = new WrappedZEUSVotesSimple(IERC20(ZEUS_TOKEN));
        console.log("  wZEUS deployed at:", address(wZEUS));

        // Step 3: Deploy ZEUSGovernorSimple
        console.log("\nStep 3: Deploying ZEUSGovernorSimple...");
        ZEUSGovernorSimple governor = new ZEUSGovernorSimple(
            IVotes(address(wZEUS)),
            timelock,
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_NUMERATOR
        );
        console.log("  Governor deployed at:", address(governor));

        // Step 4: Configure Timelock roles
        console.log("\nStep 4: Configuring Timelock roles...");

        console.log("  Granting PROPOSER_ROLE to Governor...");
        timelock.grantRole(PROPOSER_ROLE, address(governor));
        console.log("    PROPOSER_ROLE granted");

        console.log("  Granting EXECUTOR_ROLE to Governor...");
        timelock.grantRole(EXECUTOR_ROLE, address(governor));
        console.log("    EXECUTOR_ROLE granted");

        console.log("  Granting ADMIN_ROLE to Timelock (self-admin)...");
        timelock.grantRole(DEFAULT_ADMIN_ROLE, address(timelock));
        console.log("    ADMIN_ROLE granted to Timelock");

        console.log("  Revoking ADMIN_ROLE from deployer...");
        timelock.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
        console.log("    Deployer admin role renounced");

        // Step 5: Transfer ownership to Timelock
        console.log("\nStep 5: Transferring ownership to Timelock...");

        console.log("  Transferring wZEUS ownership...");
        wZEUS.transferOwnership(address(timelock));
        console.log("    wZEUS ownership transferred");

        console.log("  Transferring Governor ownership...");
        governor.transferOwnership(address(timelock));
        console.log("    Governor ownership transferred");

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n");
        console.log("==================================================");
        console.log("DEPLOYMENT COMPLETED SUCCESSFULLY (NO UUPS)");
        console.log("==================================================\n");

        console.log("Contract Addresses:\n");
        console.log("ZEUS Token (Original):", ZEUS_TOKEN);
        console.log("wZEUS (Simple):       ", address(wZEUS));
        console.log("Governor (Simple):    ", address(governor));
        console.log("Timelock Controller:  ", address(timelock));

        console.log("\nConfiguration:\n");
        console.log("Voting Delay:         ", VOTING_DELAY, "blocks");
        console.log("Voting Period:        ", VOTING_PERIOD, "blocks (~1 week)");
        console.log("Proposal Threshold:   ", PROPOSAL_THRESHOLD / 10**9, "wZEUS");
        console.log("Quorum:               ", QUORUM_NUMERATOR, "%");
        console.log("Timelock Delay:        86400 seconds (1 day)");

        console.log("\nOwnership:\n");
        console.log("wZEUS Owner:     ", wZEUS.owner());
        console.log("Governor Owner:  ", governor.owner());
        console.log("(Both should be Timelock address)");

        console.log("\nKey Differences from UUPS version:");
        console.log("- NO proxies - these are the final contracts");
        console.log("- NOT upgradeable - code is immutable");
        console.log("- Standard OpenZeppelin contracts");
        console.log("- Compatible with Tally (no premium needed)");

        console.log("\nNext Steps:\n");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Register DAO on Tally: https://www.tally.xyz/add-a-dao");
        console.log("3. Use Governor address:", address(governor));
        console.log("\n==================================================\n");
    }
}
