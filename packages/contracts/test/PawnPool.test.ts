import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PawnPool", function () {
  let pawnPool: any;
  let admin: SignerWithAddress;
  let operator: SignerWithAddress;
  let treasury: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;

  beforeEach(async function () {
    [admin, operator, treasury, player1, player2] = await ethers.getSigners();

    const PawnPoolFactory = await ethers.getContractFactory("PawnPool");
    pawnPool = await PawnPoolFactory.deploy(admin.address, operator.address, treasury.address);
  });

  describe("Deployment", function () {
    it("Should set correct roles and default prices", async function () {
      expect(await pawnPool.hasRole(await pawnPool.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await pawnPool.hasRole(await pawnPool.OPERATOR_ROLE(), operator.address)).to.be.true;
      expect(await pawnPool.treasury()).to.equal(treasury.address);
      
      const pawnPrice = await pawnPool.piecePrices(1); // Pawn = 1
      expect(pawnPrice).to.equal(ethers.parseEther("0.0001"));
    });
  });

  describe("Betting Rules", function () {
    const gameId = 12345;

    beforeEach(async function () {
      await pawnPool.connect(operator).createGame(gameId);
    });

    it("Should allow a player to place bet", async function () {
      const price = await pawnPool.piecePrices(1); // Pawn
      await expect(
        pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: price }) // gameId, turnNumber, team (1=White), piece (1=Pawn)
      ).to.emit(pawnPool, "BetPlaced");

      const game = await pawnPool.games(gameId);
      expect(game.totalPool).to.equal(price);
      expect(game.whitePool).to.equal(price);
    });

    it("Should reject bet with incorrect price", async function () {
      await expect(
        pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: ethers.parseEther("0.0005") })
      ).to.be.revertedWith("Incorrect piece price");
    });

    it("Should reject double bet on same turn", async function () {
      const price = await pawnPool.piecePrices(1);
      await pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: price });
      
      await expect(
        pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: price })
      ).to.be.revertedWith("Already bet this turn");
    });

    it("Should reject team switching", async function () {
      const price = await pawnPool.piecePrices(1);
      await pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: price }); // team White = 1

      // Coba bet team Black = 2 di turn berikutnya
      await expect(
        pawnPool.connect(player1).placeBet(gameId, 2, 2, 1, { value: price })
      ).to.be.revertedWith("Team already locked");
    });

    it("Should reject bet on locked turn", async function () {
      const price = await pawnPool.piecePrices(1);
      await pawnPool.connect(operator).lockTurn(gameId, 1);

      await expect(
        pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: price })
      ).to.be.revertedWith("Turn locked");
    });
  });

  describe("Settlement & Claims", function () {
    const gameId = 999;
    let pawnPrice: bigint;
    let knightPrice: bigint;

    beforeEach(async function () {
      pawnPrice = await pawnPool.piecePrices(1); // Pawn = 0.0001
      knightPrice = await pawnPool.piecePrices(2); // Knight = 0.0003
      await pawnPool.connect(operator).createGame(gameId);
    });

    it("Should resolve winner correctly and pay fee (10%) to treasury", async function () {
      // Player 1 bet White (Pawn)
      await pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: pawnPrice });
      // Player 2 bet Black (Knight)
      await pawnPool.connect(player2).placeBet(gameId, 1, 2, 2, { value: knightPrice });

      const totalBet = pawnPrice + knightPrice; // 0.0004 ETH
      const expectedFee = (totalBet * 1000n) / 10000n; // 10% = 0.00004 ETH

      const initialTreasuryBal = await ethers.provider.getBalance(treasury.address);

      // Operator resolve game (WhiteWin = 1)
      await expect(pawnPool.connect(operator).resolveGame(gameId, 1))
        .to.emit(pawnPool, "GameResolved");

      const finalTreasuryBal = await ethers.provider.getBalance(treasury.address);
      expect(finalTreasuryBal - initialTreasuryBal).to.equal(expectedFee);

      // Player 1 (winner) claim reward
      const initialPlayerBal = await ethers.provider.getBalance(player1.address);
      const tx = await pawnPool.connect(player1).claimReward(gameId);
      const receipt = await tx.wait();
      const gasUsed = receipt ? receipt.gasUsed * receipt.gasPrice : 0n;

      const finalPlayerBal = await ethers.provider.getBalance(player1.address);
      const expectedReward = totalBet - expectedFee; // 0.00036 ETH (karena player 1 satu-satunya bettor White)

      expect(finalPlayerBal - initialPlayerBal + gasUsed).to.equal(expectedReward);
    });

    it("Should process draw refund (90% return, 10% fee)", async function () {
      await pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: pawnPrice });
      await pawnPool.connect(player2).placeBet(gameId, 1, 2, 2, { value: knightPrice });

      await pawnPool.connect(operator).resolveGame(gameId, 3); // Draw = 3

      // Player 1 claim draw refund (90% of pawnPrice)
      const initialBal = await ethers.provider.getBalance(player1.address);
      const tx = await pawnPool.connect(player1).claimRefund(gameId);
      const receipt = await tx.wait();
      const gasUsed = receipt ? receipt.gasUsed * receipt.gasPrice : 0n;

      const finalBal = await ethers.provider.getBalance(player1.address);
      const expectedRefund = (pawnPrice * 90n) / 100n;

      expect(finalBal - initialBal + gasUsed).to.equal(expectedRefund);
    });

    it("Should process cancel refund (100% return, no fee)", async function () {
      await pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: pawnPrice });
      await pawnPool.connect(operator).cancelGame(gameId);

      // Player 1 claim refund (100% of pawnPrice)
      const initialBal = await ethers.provider.getBalance(player1.address);
      const tx = await pawnPool.connect(player1).claimRefund(gameId);
      const receipt = await tx.wait();
      const gasUsed = receipt ? receipt.gasUsed * receipt.gasPrice : 0n;

      const finalBal = await ethers.provider.getBalance(player1.address);
      expect(finalBal - initialBal + gasUsed).to.equal(pawnPrice);
    });

    it("Should process late refund (100% return, no fee) and adjust pools", async function () {
      await pawnPool.connect(player1).placeBet(gameId, 1, 1, 1, { value: pawnPrice });
      
      // Operator mark late
      await pawnPool.connect(operator).lockTurn(gameId, 1);
      await expect(pawnPool.connect(operator).markLateRefundable(gameId, 1, player1.address))
        .to.emit(pawnPool, "LateBetMarked");

      const game = await pawnPool.games(gameId);
      expect(game.totalPool).to.equal(0n);
      expect(game.whitePool).to.equal(0n);

      // Player 1 claim late refund
      const initialBal = await ethers.provider.getBalance(player1.address);
      const tx = await pawnPool.connect(player1).claimRefund(gameId);
      const receipt = await tx.wait();
      const gasUsed = receipt ? receipt.gasUsed * receipt.gasPrice : 0n;

      const finalBal = await ethers.provider.getBalance(player1.address);
      expect(finalBal - initialBal + gasUsed).to.equal(pawnPrice);
    });
  });
});
