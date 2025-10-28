import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SnakeGame, SnakeGame__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SnakeGame")) as SnakeGame__factory;
  const snakeGameContract = (await factory.deploy()) as SnakeGame;
  const snakeGameContractAddress = await snakeGameContract.getAddress();

  return { snakeGameContract, snakeGameContractAddress };
}

describe("SnakeGame", function () {
  let signers: Signers;
  let snakeGameContract: SnakeGame;
  let snakeGameContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ snakeGameContract, snakeGameContractAddress } = await deployFixture());
  });

  describe("Game Submission", function () {
    it("should submit encrypted score successfully", async function () {
      const clearScore = 120;
      const duration = 60; // 60 seconds

      // Encrypt score
      const encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(clearScore)
        .encrypt();

      const tx = await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, duration);

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check total games
      const totalGames = await snakeGameContract.totalGamesPlayed();
      expect(totalGames).to.eq(1n);

      // Check player stats
      const stats = await snakeGameContract.playerStats(signers.alice.address);
      expect(stats.totalGames).to.eq(1n);

      // Check active players
      const activeCount = await snakeGameContract.getActivePlayersCount();
      expect(activeCount).to.eq(1n);
    });

    it("should revert if game duration is too short", async function () {
      const clearScore = 100;
      const duration = 5; // Less than 10 seconds

      const encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(clearScore)
        .encrypt();

      await expect(
        snakeGameContract
          .connect(signers.alice)
          .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, duration)
      ).to.be.revertedWithCustomError(snakeGameContract, "GameTooShort");
    });

    it("should update max score correctly", async function () {
      // Submit first game with score 100
      const score1 = 100;
      let encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(score1)
        .encrypt();

      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      // Submit second game with score 150 (higher)
      const score2 = 150;
      encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(score2)
        .encrypt();

      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 45);

      // Decrypt and verify max score is 150
      const encryptedMaxScore = await snakeGameContract.getPlayerMaxScore(signers.alice.address);
      const decryptedMaxScore = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedMaxScore,
        snakeGameContractAddress,
        signers.alice
      );

      expect(decryptedMaxScore).to.eq(score2);
    });

    it("should not update max score if new score is lower", async function () {
      // Submit first game with score 200
      const score1 = 200;
      let encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(score1)
        .encrypt();

      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 60);

      // Submit second game with score 100 (lower)
      const score2 = 100;
      encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(score2)
        .encrypt();

      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      // Decrypt and verify max score is still 200
      const encryptedMaxScore = await snakeGameContract.getPlayerMaxScore(signers.alice.address);
      const decryptedMaxScore = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedMaxScore,
        snakeGameContractAddress,
        signers.alice
      );

      expect(decryptedMaxScore).to.eq(score1);
    });

    it("should accumulate total score correctly", async function () {
      const score1 = 100;
      const score2 = 150;
      const score3 = 200;

      // Submit three games
      for (const score of [score1, score2, score3]) {
        const encryptedInput = await fhevm
          .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
          .add32(score)
          .encrypt();

        await snakeGameContract
          .connect(signers.alice)
          .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);
      }

      // Decrypt and verify total score
      const encryptedTotalScore = await snakeGameContract.getPlayerTotalScore(signers.alice.address);
      const decryptedTotalScore = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedTotalScore,
        snakeGameContractAddress,
        signers.alice
      );

      expect(decryptedTotalScore).to.eq(score1 + score2 + score3);
    });
  });

  describe("Game Records", function () {
    it("should store game records correctly", async function () {
      const clearScore = 180;
      const duration = 45;

      const encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(clearScore)
        .encrypt();

      const tx = await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, duration);

      await tx.wait();

      // Get record count
      const recordCount = await snakeGameContract.getPlayerRecordCount(signers.alice.address);
      expect(recordCount).to.eq(1n);

      // Get specific record
      const record = await snakeGameContract.getGameRecord(signers.alice.address, 0);
      expect(record.player).to.eq(signers.alice.address);
      expect(record.gameId).to.eq(0n);
      expect(record.duration).to.eq(duration);
    });

    it("should allow decryption of own game record", async function () {
      const clearScore = 250;
      const duration = 75;

      const encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(clearScore)
        .encrypt();

      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, duration);

      // Get and decrypt record
      const record = await snakeGameContract.getGameRecord(signers.alice.address, 0);
      const decryptedScore = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        record.score,
        snakeGameContractAddress,
        signers.alice
      );

      expect(decryptedScore).to.eq(clearScore);
    });

    it("should track multiple games from same player", async function () {
      const scores = [100, 200, 150, 300];

      for (const score of scores) {
        const encryptedInput = await fhevm
          .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
          .add32(score)
          .encrypt();

        await snakeGameContract
          .connect(signers.alice)
          .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);
      }

      const recordCount = await snakeGameContract.getPlayerRecordCount(signers.alice.address);
      expect(recordCount).to.eq(scores.length);

      // Verify each record
      for (let i = 0; i < scores.length; i++) {
        const record = await snakeGameContract.getGameRecord(signers.alice.address, i);
        const decryptedScore = await fhevm.userDecryptEuint(
          FhevmType.euint32,
          record.score,
          snakeGameContractAddress,
          signers.alice
        );
        expect(decryptedScore).to.eq(scores[i]);
      }
    });
  });

  describe("Leaderboard Comparison", function () {
    it("should compare max scores of two players", async function () {
      // Alice: score 200
      let encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(200)
        .encrypt();
      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      // Bob: score 150
      encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.bob.address)
        .add32(150)
        .encrypt();
      await snakeGameContract
        .connect(signers.bob)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      // Compare: Alice should be higher
      // Need to call the function to authorize, then decrypt
      const tx = await snakeGameContract
        .connect(signers.alice)
        .compareMaxScores(signers.alice.address, signers.bob.address);
      await tx.wait();

      // Now get the result after authorization
      const comparisonResult = await snakeGameContract.compareMaxScores.staticCall(
        signers.alice.address,
        signers.bob.address
      );

      const isAliceHigher = await fhevm.userDecryptEbool(
        comparisonResult,
        snakeGameContractAddress,
        signers.alice
      );

      expect(isAliceHigher).to.be.true;
    });

    it("should compare total scores of two players", async function () {
      // Alice: 100 + 100 = 200 total
      for (let i = 0; i < 2; i++) {
        const encryptedInput = await fhevm
          .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
          .add32(100)
          .encrypt();
        await snakeGameContract
          .connect(signers.alice)
          .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);
      }

      // Bob: 300 total (one game)
      const encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.bob.address)
        .add32(300)
        .encrypt();
      await snakeGameContract
        .connect(signers.bob)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      // Compare: Bob should be higher in total
      // Need to call the function to authorize, then decrypt
      const tx = await snakeGameContract
        .connect(signers.bob)
        .compareTotalScores(signers.bob.address, signers.alice.address);
      await tx.wait();

      // Get the returned ebool from static call after authorization
      const comparisonResult = await snakeGameContract.compareTotalScores.staticCall(
        signers.bob.address,
        signers.alice.address
      );

      const isBobHigher = await fhevm.userDecryptEbool(
        comparisonResult,
        snakeGameContractAddress,
        signers.bob
      );

      expect(isBobHigher).to.be.true;
    });
  });

  describe("Active Players", function () {
    it("should track active players", async function () {
      // Initially no players
      let activeCount = await snakeGameContract.getActivePlayersCount();
      expect(activeCount).to.eq(0n);

      // Alice plays
      let encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(100)
        .encrypt();
      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      activeCount = await snakeGameContract.getActivePlayersCount();
      expect(activeCount).to.eq(1n);

      // Bob plays
      encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.bob.address)
        .add32(150)
        .encrypt();
      await snakeGameContract
        .connect(signers.bob)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      activeCount = await snakeGameContract.getActivePlayersCount();
      expect(activeCount).to.eq(2n);

      // Alice plays again (should not increase count)
      encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(200)
        .encrypt();
      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      activeCount = await snakeGameContract.getActivePlayersCount();
      expect(activeCount).to.eq(2n);
    });

    it("should return active players with pagination", async function () {
      // Three players play
      const players = [signers.alice, signers.bob, signers.charlie];

      for (const player of players) {
        const encryptedInput = await fhevm
          .createEncryptedInput(snakeGameContractAddress, player.address)
          .add32(100)
          .encrypt();
        await snakeGameContract
          .connect(player)
          .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);
      }

      // Get first 2 players
      const firstTwo = await snakeGameContract.getActivePlayers(0, 2);
      expect(firstTwo.length).to.eq(2);
      expect(firstTwo[0]).to.eq(signers.alice.address);
      expect(firstTwo[1]).to.eq(signers.bob.address);

      // Get last player
      const lastOne = await snakeGameContract.getActivePlayers(2, 10);
      expect(lastOne.length).to.eq(1);
      expect(lastOne[0]).to.eq(signers.charlie.address);
    });
  });

  describe("Profile Settings", function () {
    it("should set profile visibility", async function () {
      // Initially false
      let isPublic = await snakeGameContract.isPublicProfile(signers.alice.address);
      expect(isPublic).to.be.false;

      // Set to public
      await snakeGameContract.connect(signers.alice).setProfileVisibility(true);
      isPublic = await snakeGameContract.isPublicProfile(signers.alice.address);
      expect(isPublic).to.be.true;

      // Set back to private
      await snakeGameContract.connect(signers.alice).setProfileVisibility(false);
      isPublic = await snakeGameContract.isPublicProfile(signers.alice.address);
      expect(isPublic).to.be.false;
    });

    it("should emit ProfileVisibilityChanged event", async function () {
      await expect(snakeGameContract.connect(signers.alice).setProfileVisibility(true))
        .to.emit(snakeGameContract, "ProfileVisibilityChanged")
        .withArgs(signers.alice.address, true);
    });
  });

  describe("Player Statistics", function () {
    it("should track first and last play time", async function () {
      const encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(100)
        .encrypt();

      const tx = await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const stats = await snakeGameContract.playerStats(signers.alice.address);
      expect(stats.firstPlayTime).to.eq(block!.timestamp);
      expect(stats.lastPlayTime).to.eq(block!.timestamp);
    });

    it("should update last play time on subsequent games", async function () {
      // First game
      let encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(100)
        .encrypt();
      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 30);

      const statsAfterFirst = await snakeGameContract.playerStats(signers.alice.address);

      // Mine a new block to ensure different timestamp
      await ethers.provider.send("evm_mine", []);

      // Second game
      encryptedInput = await fhevm
        .createEncryptedInput(snakeGameContractAddress, signers.alice.address)
        .add32(150)
        .encrypt();
      await snakeGameContract
        .connect(signers.alice)
        .submitScore(encryptedInput.handles[0], encryptedInput.inputProof, 40);

      const statsAfterSecond = await snakeGameContract.playerStats(signers.alice.address);

      // First play time should not change
      expect(statsAfterSecond.firstPlayTime).to.eq(statsAfterFirst.firstPlayTime);

      // Last play time should be updated
      expect(statsAfterSecond.lastPlayTime).to.be.gt(statsAfterFirst.lastPlayTime);
    });
  });
});

