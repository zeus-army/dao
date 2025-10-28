// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WrappedZEUSVotesSimple
 * @dev Non-upgradeable wrapped version of ZEUS token with voting capabilities
 *
 * This contract wraps the original ZEUS token (0x0f7dc5d02cc1e1f5ee47854d534d332a1081ccc8)
 * and adds voting power, delegation, and checkpointing features required for
 * on-chain governance with OpenZeppelin Governor.
 *
 * Features:
 * - 1:1 wrapping ratio with ZEUS token
 * - ERC20Votes for voting power and delegation
 * - ERC20Permit for gasless approvals
 * - Non-upgradeable (immutable)
 *
 * Security:
 * - Only governance (via Timelock) can transfer ownership
 * - Wrapping/unwrapping has no fees (ZEUS has 0% tax)
 * - All voting power changes are checkpointed
 */
contract WrappedZEUSVotesSimple is ERC20, ERC20Wrapper, ERC20Permit, ERC20Votes, Ownable {
    /**
     * @dev Initializes the wrapped token
     * @param underlyingToken The ZEUS token address to wrap
     */
    constructor(IERC20 underlyingToken)
        ERC20("Wrapped ZEUS", "wZEUS")
        ERC20Wrapper(underlyingToken)
        ERC20Permit("Wrapped ZEUS")
        Ownable(msg.sender)
    {}

    /**
     * @dev Returns the number of decimals used (same as ZEUS: 9)
     */
    function decimals() public pure override(ERC20, ERC20Wrapper) returns (uint8) {
        return 9;
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
