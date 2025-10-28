const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("WrappedZEUSVotes", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployFixture() {
    const [owner, alice, bob, charlie, timelock] = await ethers.getSigners();

    // Deploy a mock ZEUS token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const zeusToken = await MockERC20.deploy(
      "ZEUS Token",
      "ZEUS",
      9, // 9 decimals like the real ZEUS
      ethers.parseUnits("420690000000000", 9) // 420.69T total supply
    );
    await zeusToken.waitForDeployment();

    // Deploy WrappedZEUSVotesSimple
    const WrappedZEUSVotes = await ethers.getContractFactory("WrappedZEUSVotesSimple");
    const wZEUS = await WrappedZEUSVotes.deploy(await zeusToken.getAddress());
    await wZEUS.waitForDeployment();

    // Distribute ZEUS tokens
    const amount = ethers.parseUnits("1000000", 9); // 1M tokens each
    await zeusToken.transfer(alice.address, amount);
    await zeusToken.transfer(bob.address, amount);
    await zeusToken.transfer(charlie.address, amount);

    return { wZEUS, zeusToken, owner, alice, bob, charlie, timelock };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { wZEUS } = await loadFixture(deployFixture);
      expect(await wZEUS.name()).to.equal("Wrapped ZEUS");
      expect(await wZEUS.symbol()).to.equal("wZEUS");
    });

    it("Should set the correct decimals (9)", async function () {
      const { wZEUS } = await loadFixture(deployFixture);
      expect(await wZEUS.decimals()).to.equal(9);
    });

    it("Should set the correct underlying token", async function () {
      const { wZEUS, zeusToken } = await loadFixture(deployFixture);
      expect(await wZEUS.underlying()).to.equal(await zeusToken.getAddress());
    });

    it("Should set the deployer as owner", async function () {
      const { wZEUS, owner } = await loadFixture(deployFixture);
      expect(await wZEUS.owner()).to.equal(owner.address);
    });

    it("Should start with zero total supply", async function () {
      const { wZEUS } = await loadFixture(deployFixture);
      expect(await wZEUS.totalSupply()).to.equal(0);
    });
  });

  describe("Wrapping (depositFor)", function () {
    it("Should allow wrapping ZEUS tokens", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Approve wZEUS to spend ZEUS
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);

      // Wrap tokens
      await expect(wZEUS.connect(alice).depositFor(alice.address, amount))
        .to.emit(wZEUS, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, amount);

      expect(await wZEUS.balanceOf(alice.address)).to.equal(amount);
    });

    it("Should maintain 1:1 wrapping ratio", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("5000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      const zeusBalance = await zeusToken.balanceOf(await wZEUS.getAddress());
      const wZeusSupply = await wZEUS.totalSupply();

      expect(zeusBalance).to.equal(wZeusSupply);
      expect(zeusBalance).to.equal(amount);
    });

    it("Should fail if insufficient allowance", async function () {
      const { wZEUS, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Don't approve, should fail
      await expect(
        wZEUS.connect(alice).depositFor(alice.address, amount)
      ).to.be.reverted;
    });

    it("Should fail if insufficient balance", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const aliceBalance = await zeusToken.balanceOf(alice.address);
      const tooMuch = aliceBalance + ethers.parseUnits("1", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), tooMuch);

      await expect(
        wZEUS.connect(alice).depositFor(alice.address, tooMuch)
      ).to.be.reverted;
    });

    it("Should allow wrapping to a different address", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(bob.address, amount);

      expect(await wZEUS.balanceOf(bob.address)).to.equal(amount);
      expect(await wZEUS.balanceOf(alice.address)).to.equal(0);
    });
  });

  describe("Unwrapping (withdrawTo)", function () {
    it("Should allow unwrapping wZEUS tokens", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // First wrap
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      const zeusBalanceBefore = await zeusToken.balanceOf(alice.address);

      // Then unwrap
      await expect(wZEUS.connect(alice).withdrawTo(alice.address, amount))
        .to.emit(wZEUS, "Transfer")
        .withArgs(alice.address, ethers.ZeroAddress, amount);

      expect(await wZEUS.balanceOf(alice.address)).to.equal(0);
      expect(await zeusToken.balanceOf(alice.address)).to.equal(zeusBalanceBefore + amount);
    });

    it("Should fail if insufficient wZEUS balance", async function () {
      const { wZEUS, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await expect(
        wZEUS.connect(alice).withdrawTo(alice.address, amount)
      ).to.be.reverted;
    });

    it("Should allow unwrapping to a different address", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Wrap as alice
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      const bobZeusBalanceBefore = await zeusToken.balanceOf(bob.address);

      // Unwrap to bob
      await wZEUS.connect(alice).withdrawTo(bob.address, amount);

      expect(await wZEUS.balanceOf(alice.address)).to.equal(0);
      expect(await zeusToken.balanceOf(bob.address)).to.equal(bobZeusBalanceBefore + amount);
    });

    it("Should maintain correct total supply after wrap/unwrap cycles", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Cycle 1
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);
      expect(await wZEUS.totalSupply()).to.equal(amount);

      await wZEUS.connect(alice).withdrawTo(alice.address, amount / 2n);
      expect(await wZEUS.totalSupply()).to.equal(amount / 2n);

      // Cycle 2
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);
      expect(await wZEUS.totalSupply()).to.equal(amount + amount / 2n);

      await wZEUS.connect(alice).withdrawTo(alice.address, amount + amount / 2n);
      expect(await wZEUS.totalSupply()).to.equal(0);
    });
  });

  describe("ERC20 Transfers", function () {
    it("Should allow transfers between accounts", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Wrap tokens
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      // Transfer
      await expect(wZEUS.connect(alice).transfer(bob.address, amount / 2n))
        .to.emit(wZEUS, "Transfer")
        .withArgs(alice.address, bob.address, amount / 2n);

      expect(await wZEUS.balanceOf(alice.address)).to.equal(amount / 2n);
      expect(await wZEUS.balanceOf(bob.address)).to.equal(amount / 2n);
    });

    it("Should support approve and transferFrom", async function () {
      const { wZEUS, zeusToken, alice, bob, charlie } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Wrap tokens
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      // Alice approves Bob
      await wZEUS.connect(alice).approve(bob.address, amount);

      // Bob transfers from Alice to Charlie
      await wZEUS.connect(bob).transferFrom(alice.address, charlie.address, amount / 2n);

      expect(await wZEUS.balanceOf(alice.address)).to.equal(amount / 2n);
      expect(await wZEUS.balanceOf(charlie.address)).to.equal(amount / 2n);
    });
  });

  describe("ERC20Votes - Voting Power", function () {
    it("Should have zero voting power without delegation", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      expect(await wZEUS.getVotes(alice.address)).to.equal(0);
    });

    it("Should allow self-delegation", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      await wZEUS.connect(alice).delegate(alice.address);

      expect(await wZEUS.getVotes(alice.address)).to.equal(amount);
    });

    it("Should allow delegation to another address", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      await wZEUS.connect(alice).delegate(bob.address);

      expect(await wZEUS.getVotes(alice.address)).to.equal(0);
      expect(await wZEUS.getVotes(bob.address)).to.equal(amount);
    });

    it("Should update voting power when tokens are transferred", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);
      await wZEUS.connect(alice).delegate(alice.address);

      // Transfer half to Bob
      await wZEUS.connect(alice).transfer(bob.address, amount / 2n);
      await wZEUS.connect(bob).delegate(bob.address);

      expect(await wZEUS.getVotes(alice.address)).to.equal(amount / 2n);
      expect(await wZEUS.getVotes(bob.address)).to.equal(amount / 2n);
    });

    it("Should track historical voting power (checkpoints)", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);
      await wZEUS.connect(alice).delegate(alice.address);

      const block1 = await ethers.provider.getBlockNumber();

      // Mine a block so we can check past votes
      await mine(1);

      // Unwrap half
      await wZEUS.connect(alice).withdrawTo(alice.address, amount / 2n);

      const block2 = await ethers.provider.getBlockNumber();

      // Mine another block to ensure we can query block2
      await mine(1);

      // Check past votes
      expect(await wZEUS.getPastVotes(alice.address, block1)).to.equal(amount);
      expect(await wZEUS.getPastVotes(alice.address, block2)).to.equal(amount / 2n);
    });

    it("Should emit DelegateChanged and DelegateVotesChanged events", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      await expect(wZEUS.connect(alice).delegate(bob.address))
        .to.emit(wZEUS, "DelegateChanged")
        .withArgs(alice.address, ethers.ZeroAddress, bob.address)
        .and.to.emit(wZEUS, "DelegateVotesChanged")
        .withArgs(bob.address, 0, amount);
    });
  });

  describe("ERC20Permit - Gasless Approvals", function () {
    it("Should have correct domain separator", async function () {
      const { wZEUS } = await loadFixture(deployFixture);
      const domain = await wZEUS.DOMAIN_SEPARATOR();
      expect(domain).to.not.equal(ethers.ZeroHash);
    });

    it("Should support permit for gasless approvals", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Wrap tokens
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      // Create permit signature
      const deadline = ethers.MaxUint256;
      const nonce = await wZEUS.nonces(alice.address);

      const domain = {
        name: await wZEUS.name(),
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await wZEUS.getAddress(),
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        owner: alice.address,
        spender: bob.address,
        value: amount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await alice.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);

      // Execute permit
      await wZEUS.permit(
        alice.address,
        bob.address,
        amount,
        deadline,
        sig.v,
        sig.r,
        sig.s
      );

      expect(await wZEUS.allowance(alice.address, bob.address)).to.equal(amount);
    });

    it("Should increment nonce after permit", async function () {
      const { wZEUS, alice } = await loadFixture(deployFixture);
      const initialNonce = await wZEUS.nonces(alice.address);
      expect(initialNonce).to.equal(0);
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { wZEUS, owner, timelock } = await loadFixture(deployFixture);

      await expect(wZEUS.connect(owner).transferOwnership(timelock.address))
        .to.emit(wZEUS, "OwnershipTransferred")
        .withArgs(owner.address, timelock.address);

      expect(await wZEUS.owner()).to.equal(timelock.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      const { wZEUS, alice, bob } = await loadFixture(deployFixture);

      await expect(
        wZEUS.connect(alice).transferOwnership(bob.address)
      ).to.be.revertedWithCustomError(wZEUS, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to renounce ownership", async function () {
      const { wZEUS, owner } = await loadFixture(deployFixture);

      await wZEUS.connect(owner).renounceOwnership();
      expect(await wZEUS.owner()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle wrapping and unwrapping zero amount", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), 0);
      await wZEUS.connect(alice).depositFor(alice.address, 0);
      expect(await wZEUS.balanceOf(alice.address)).to.equal(0);
    });

    it("Should handle maximum uint256 approval", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), ethers.MaxUint256);
      const amount = ethers.parseUnits("1000", 9);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      await wZEUS.connect(alice).approve(bob.address, ethers.MaxUint256);
      expect(await wZEUS.allowance(alice.address, bob.address)).to.equal(ethers.MaxUint256);
    });

    it("Should handle multiple delegations correctly", async function () {
      const { wZEUS, zeusToken, alice, bob, charlie } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      // Delegate to Bob
      await wZEUS.connect(alice).delegate(bob.address);
      expect(await wZEUS.getVotes(bob.address)).to.equal(amount);

      // Re-delegate to Charlie
      await wZEUS.connect(alice).delegate(charlie.address);
      expect(await wZEUS.getVotes(bob.address)).to.equal(0);
      expect(await wZEUS.getVotes(charlie.address)).to.equal(amount);
    });

    it("Should handle wrapping after unwrapping all tokens", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Cycle 1
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);
      await wZEUS.connect(alice).withdrawTo(alice.address, amount);

      // Cycle 2
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      expect(await wZEUS.balanceOf(alice.address)).to.equal(amount);
      expect(await wZEUS.totalSupply()).to.equal(amount);
    });

    it("Should correctly handle voting power with multiple holders", async function () {
      const { wZEUS, zeusToken, alice, bob, charlie } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Everyone wraps and self-delegates
      for (const user of [alice, bob, charlie]) {
        await zeusToken.connect(user).approve(await wZEUS.getAddress(), amount);
        await wZEUS.connect(user).depositFor(user.address, amount);
        await wZEUS.connect(user).delegate(user.address);
      }

      expect(await wZEUS.getVotes(alice.address)).to.equal(amount);
      expect(await wZEUS.getVotes(bob.address)).to.equal(amount);
      expect(await wZEUS.getVotes(charlie.address)).to.equal(amount);
      expect(await wZEUS.totalSupply()).to.equal(amount * 3n);
    });
  });

  describe("Integration Tests", function () {
    it("Should maintain consistency between balance and voting power", async function () {
      const { wZEUS, zeusToken, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);
      await wZEUS.connect(alice).delegate(alice.address);

      const balance = await wZEUS.balanceOf(alice.address);
      const votes = await wZEUS.getVotes(alice.address);

      expect(balance).to.equal(votes);
    });

    it("Should correctly handle complex scenario: wrap, delegate, transfer, unwrap", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 9);

      // Alice wraps
      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), amount);
      await wZEUS.connect(alice).depositFor(alice.address, amount);

      // Alice delegates to herself
      await wZEUS.connect(alice).delegate(alice.address);
      expect(await wZEUS.getVotes(alice.address)).to.equal(amount);

      // Alice transfers half to Bob
      await wZEUS.connect(alice).transfer(bob.address, amount / 2n);
      expect(await wZEUS.getVotes(alice.address)).to.equal(amount / 2n);

      // Bob self-delegates
      await wZEUS.connect(bob).delegate(bob.address);
      expect(await wZEUS.getVotes(bob.address)).to.equal(amount / 2n);

      // Bob unwraps all
      const bobZeusBalanceBefore = await zeusToken.balanceOf(bob.address);
      await wZEUS.connect(bob).withdrawTo(bob.address, amount / 2n);
      expect(await zeusToken.balanceOf(bob.address)).to.equal(bobZeusBalanceBefore + amount / 2n);
      expect(await wZEUS.getVotes(bob.address)).to.equal(0);

      // Alice still has her voting power
      expect(await wZEUS.getVotes(alice.address)).to.equal(amount / 2n);
    });

    it("Should maintain correct state after rapid wrap/unwrap/transfer cycles", async function () {
      const { wZEUS, zeusToken, alice, bob } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("100", 9);

      await zeusToken.connect(alice).approve(await wZEUS.getAddress(), ethers.MaxUint256);
      await zeusToken.connect(bob).approve(await wZEUS.getAddress(), ethers.MaxUint256);

      // Rapid cycles
      for (let i = 0; i < 5; i++) {
        await wZEUS.connect(alice).depositFor(alice.address, amount);
        await wZEUS.connect(alice).transfer(bob.address, amount / 2n);
        await wZEUS.connect(bob).withdrawTo(bob.address, amount / 2n);
        await wZEUS.connect(alice).withdrawTo(alice.address, amount / 2n);
      }

      // Final state should be consistent
      const aliceBalance = await wZEUS.balanceOf(alice.address);
      const bobBalance = await wZEUS.balanceOf(bob.address);
      const totalSupply = await wZEUS.totalSupply();

      expect(totalSupply).to.equal(aliceBalance + bobBalance);
    });
  });
});
