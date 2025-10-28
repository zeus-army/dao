// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../contracts/WrappedZEUSVotes.sol";
import "../contracts/ZEUSGovernor.sol";

/**
 * @title Deploy
 * @dev Foundry script to complete ZEUS DAO deployment
 *
 * This script continues from the partial Hardhat deployment:
 * - TimelockController: 0x0b2047c0afe116e59556597aacab7937a19e16b6
 * - wZEUS Implementation: 0xb6a50ee5cd0a105c16774b11d275ef0cfa57f501
 *
 * Steps to complete:
 * 1. Deploy wZEUS Proxy
 * 2. Deploy Governor Implementation
 * 3. Deploy Governor Proxy
 * 4. Configure Timelock roles
 * 5. Transfer ownership to Timelock
 */
contract Deploy is Script {
    // Existing deployed contracts
    address constant TIMELOCK_ADDRESS = 0x0B2047c0AfE116e59556597aAcab7937A19E16B6;
    address constant WZEUS_IMPLEMENTATION = 0xb6A50eE5cD0A105c16774b11d275ef0cFA57f501;

    // Configuration
    address constant ZEUS_TOKEN = 0x0f7dC5D02CC1E1f5Ee47854d534D332A1081cCC8;
    uint48 constant VOTING_DELAY = 1;
    uint32 constant VOTING_PERIOD = 50400;
    uint256 constant PROPOSAL_THRESHOLD = 4_206_900_000_000 * 10**9; // 4.2T * 10^9 decimals
    uint256 constant QUORUM_NUMERATOR = 1;

    // Role constants
    bytes32 constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 constant DEFAULT_ADMIN_ROLE = 0x0000000000000000000000000000000000000000000000000000000000000000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("====================================");
        console.log("ZEUS DAO DEPLOYMENT (FOUNDRY)");
        console.log("====================================\n");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH\n");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy wZEUS Proxy
        console.log("Step 1: Deploying wZEUS Proxy...");
        bytes memory wZEUSInitData = abi.encodeWithSelector(
            WrappedZEUSVotes.initialize.selector,
            ZEUS_TOKEN
        );
        ERC1967Proxy wZEUSProxy = new ERC1967Proxy(WZEUS_IMPLEMENTATION, wZEUSInitData);
        address wZEUSAddress = address(wZEUSProxy);
        console.log("  wZEUS Proxy deployed at:", wZEUSAddress);

        // Step 2: Deploy Governor Implementation
        console.log("\nStep 2: Deploying Governor Implementation...");
        ZEUSGovernor governorImpl = new ZEUSGovernor();
        console.log("  Governor Implementation deployed at:", address(governorImpl));

        // Step 3: Deploy Governor Proxy
        console.log("\nStep 3: Deploying Governor Proxy...");
        bytes memory governorInitData = abi.encodeWithSelector(
            ZEUSGovernor.initialize.selector,
            wZEUSAddress,
            TIMELOCK_ADDRESS,
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_NUMERATOR
        );
        ERC1967Proxy governorProxy = new ERC1967Proxy(address(governorImpl), governorInitData);
        address governorAddress = address(governorProxy);
        console.log("  Governor Proxy deployed at:", governorAddress);

        // Step 4: Configure Timelock roles
        console.log("\nStep 4: Configuring Timelock roles...");
        TimelockController timelock = TimelockController(payable(TIMELOCK_ADDRESS));

        console.log("  Granting PROPOSER_ROLE to Governor...");
        timelock.grantRole(PROPOSER_ROLE, governorAddress);
        console.log("    PROPOSER_ROLE granted");

        console.log("  Granting EXECUTOR_ROLE to Governor...");
        timelock.grantRole(EXECUTOR_ROLE, governorAddress);
        console.log("    EXECUTOR_ROLE granted");

        console.log("  Granting ADMIN_ROLE to Timelock (self-admin)...");
        timelock.grantRole(DEFAULT_ADMIN_ROLE, TIMELOCK_ADDRESS);
        console.log("    ADMIN_ROLE granted to Timelock");

        console.log("  Revoking ADMIN_ROLE from deployer...");
        timelock.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
        console.log("    Deployer admin role renounced");

        // Step 5: Transfer ownership to Timelock
        console.log("\nStep 5: Transferring ownership to Timelock...");

        console.log("  Transferring wZEUS ownership...");
        WrappedZEUSVotes wZEUS = WrappedZEUSVotes(wZEUSAddress);
        wZEUS.transferOwnership(TIMELOCK_ADDRESS);
        console.log("    wZEUS ownership transferred");

        console.log("  Transferring Governor ownership...");
        ZEUSGovernor governor = ZEUSGovernor(payable(governorAddress));
        governor.transferOwnership(TIMELOCK_ADDRESS);
        console.log("    Governor ownership transferred");

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n" );
        console.log("==================================================");
        console.log("DEPLOYMENT COMPLETED SUCCESSFULLY");
        console.log("==================================================\n");

        console.log("Contract Addresses:\n");
        console.log("ZEUS Token (Original):", ZEUS_TOKEN);
        console.log("wZEUS Proxy:          ", wZEUSAddress);
        console.log("wZEUS Implementation: ", WZEUS_IMPLEMENTATION);
        console.log("Governor Proxy:       ", governorAddress);
        console.log("Governor Implementation:", address(governorImpl));
        console.log("Timelock Controller:  ", TIMELOCK_ADDRESS);

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

        console.log("\nNext Steps:\n");
        console.log("1. Verify contracts on Etherscan");
        console.log("2. Register DAO on Tally: https://www.tally.xyz/add-a-dao");
        console.log("3. Create test proposal to verify functionality");
        console.log("\n==================================================\n");
    }
}
