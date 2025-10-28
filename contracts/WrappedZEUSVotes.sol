// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20WrapperUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title WrappedZEUSVotes
 * @dev Wrapped version of ZEUS token with voting capabilities
 *
 * This contract wraps the original ZEUS token (0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8)
 * and adds voting power, delegation, and checkpointing features required for
 * on-chain governance with OpenZeppelin Governor.
 *
 * Features:
 * - 1:1 wrapping ratio with ZEUS token
 * - ERC20Votes for voting power and delegation
 * - ERC20Permit for gasless approvals
 * - UUPS upgradeable pattern
 *
 * Security:
 * - Only governance (via Timelock) can upgrade
 * - Wrapping/unwrapping has no fees (ZEUS has 0% tax)
 * - All voting power changes are checkpointed
 */
contract WrappedZEUSVotes is
    Initializable,
    ERC20Upgradeable,
    ERC20WrapperUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the wrapped token
     * @param underlyingToken The ZEUS token address to wrap
     */
    function initialize(IERC20 underlyingToken) public initializer {
        __ERC20_init("Wrapped ZEUS", "wZEUS");
        __ERC20Wrapper_init(underlyingToken);
        __ERC20Permit_init("Wrapped ZEUS");
        __ERC20Votes_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Returns the number of decimals used (same as ZEUS: 9)
     */
    function decimals() public pure override(ERC20Upgradeable, ERC20WrapperUpgradeable) returns (uint8) {
        return 9;
    }

    /**
     * @dev Authorization for upgrades - only owner (Timelock) can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20PermitUpgradeable, NoncesUpgradeable)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
