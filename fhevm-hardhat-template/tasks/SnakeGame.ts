import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact with SnakeGame
 * =============================================
 *
 * Local (--network localhost):
 * 1. npx hardhat node
 * 2. npx hardhat --network localhost deploy
 * 3. npx hardhat --network localhost task:snake:submit --score 120 --duration 60
 * 4. npx hardhat --network localhost task:snake:decrypt-max
 * 5. npx hardhat --network localhost task:snake:stats
 *
 * Sepolia (--network sepolia):
 * 1. npx hardhat --network sepolia deploy
 * 2. npx hardhat --network sepolia task:snake:submit --score 150 --duration 45
 * 3. npx hardhat --network sepolia task:snake:decrypt-max
 */

/**
 * Example:
 *   npx hardhat --network localhost task:snake:address
 */
task("task:snake:address", "Prints the SnakeGame contract address").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;
    const snakeGame = await deployments.get("SnakeGame");
    console.log("SnakeGame address:", snakeGame.address);
  }
);

/**
 * Example:
 *   npx hardhat --network localhost task:snake:submit --score 120 --duration 60
 */
task("task:snake:submit", "Submit encrypted game score")
  .addOptionalParam("address", "Optionally specify the SnakeGame contract address")
  .addParam("score", "The game score")
  .addParam("duration", "Game duration in seconds")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const score = parseInt(taskArguments.score);
    const duration = parseInt(taskArguments.duration);

    if (!Number.isInteger(score)) {
      throw new Error(`Argument --score is not an integer`);
    }
    if (!Number.isInteger(duration)) {
      throw new Error(`Argument --duration is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const SnakeGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SnakeGame");

    console.log(`SnakeGame: ${SnakeGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const snakeGameContract = await ethers.getContractAt("SnakeGame", SnakeGameDeployment.address);

    // Encrypt the score
    const encryptedScore = await fhevm
      .createEncryptedInput(SnakeGameDeployment.address, signers[0].address)
      .add32(score)
      .encrypt();

    console.log(`Submitting score ${score} with duration ${duration}s...`);

    const tx = await snakeGameContract
      .connect(signers[0])
      .submitScore(encryptedScore.handles[0], encryptedScore.inputProof, duration);

    console.log(`Wait for tx: ${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    // Get total games
    const totalGames = await snakeGameContract.totalGamesPlayed();
    console.log(`Total games played: ${totalGames}`);

    console.log("✅ Score submitted successfully!");
  });

/**
 * Example:
 *   npx hardhat --network localhost task:snake:decrypt-max
 */
task("task:snake:decrypt-max", "Decrypt player's max score")
  .addOptionalParam("address", "Optionally specify the SnakeGame contract address")
  .addOptionalParam("player", "Player address (defaults to deployer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SnakeGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SnakeGame");

    console.log(`SnakeGame: ${SnakeGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const snakeGameContract = await ethers.getContractAt("SnakeGame", SnakeGameDeployment.address);

    const playerAddress = taskArguments.player || signers[0].address;
    console.log(`Player: ${playerAddress}`);

    const encryptedMaxScore = await snakeGameContract.getPlayerMaxScore(playerAddress);

    if (encryptedMaxScore === ethers.ZeroHash) {
      console.log("No games played yet");
      return;
    }

    const clearMaxScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedMaxScore,
      SnakeGameDeployment.address,
      signers[0]
    );

    console.log(`Encrypted max score: ${encryptedMaxScore}`);
    console.log(`Clear max score: ${clearMaxScore}`);
  });

/**
 * Example:
 *   npx hardhat --network localhost task:snake:decrypt-total
 */
task("task:snake:decrypt-total", "Decrypt player's total score")
  .addOptionalParam("address", "Optionally specify the SnakeGame contract address")
  .addOptionalParam("player", "Player address (defaults to deployer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SnakeGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SnakeGame");

    console.log(`SnakeGame: ${SnakeGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const snakeGameContract = await ethers.getContractAt("SnakeGame", SnakeGameDeployment.address);

    const playerAddress = taskArguments.player || signers[0].address;
    console.log(`Player: ${playerAddress}`);

    const encryptedTotalScore = await snakeGameContract.getPlayerTotalScore(playerAddress);

    if (encryptedTotalScore === ethers.ZeroHash) {
      console.log("No games played yet");
      return;
    }

    const clearTotalScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotalScore,
      SnakeGameDeployment.address,
      signers[0]
    );

    console.log(`Encrypted total score: ${encryptedTotalScore}`);
    console.log(`Clear total score: ${clearTotalScore}`);
  });

/**
 * Example:
 *   npx hardhat --network localhost task:snake:stats
 */
task("task:snake:stats", "Get player statistics")
  .addOptionalParam("address", "Optionally specify the SnakeGame contract address")
  .addOptionalParam("player", "Player address (defaults to deployer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const SnakeGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SnakeGame");

    console.log(`SnakeGame: ${SnakeGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const snakeGameContract = await ethers.getContractAt("SnakeGame", SnakeGameDeployment.address);

    const playerAddress = taskArguments.player || signers[0].address;
    console.log(`Player: ${playerAddress}`);

    const stats = await snakeGameContract.playerStats(playerAddress);
    const recordCount = await snakeGameContract.getPlayerRecordCount(playerAddress);
    const isPublic = await snakeGameContract.isPublicProfile(playerAddress);

    console.log("\n📊 Player Statistics:");
    console.log(`Total games: ${stats.totalGames}`);
    console.log(`Record count: ${recordCount}`);
    console.log(`First play time: ${new Date(Number(stats.firstPlayTime) * 1000).toISOString()}`);
    console.log(`Last play time: ${new Date(Number(stats.lastPlayTime) * 1000).toISOString()}`);
    console.log(`Profile public: ${isPublic}`);
  });

/**
 * Example:
 *   npx hardhat --network localhost task:snake:compare --player1 0x... --player2 0x...
 */
task("task:snake:compare", "Compare max scores of two players")
  .addOptionalParam("address", "Optionally specify the SnakeGame contract address")
  .addParam("player1", "First player address")
  .addParam("player2", "Second player address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const SnakeGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SnakeGame");

    console.log(`SnakeGame: ${SnakeGameDeployment.address}`);

    const signers = await ethers.getSigners();
    const snakeGameContract = await ethers.getContractAt("SnakeGame", SnakeGameDeployment.address);

    const player1 = taskArguments.player1;
    const player2 = taskArguments.player2;

    console.log(`Comparing:`);
    console.log(`Player 1: ${player1}`);
    console.log(`Player 2: ${player2}`);

    const comparison = await snakeGameContract.compareMaxScores(player1, player2);

    const isPlayer1Higher = await fhevm.userDecryptEbool(
      comparison,
      SnakeGameDeployment.address,
      signers[0]
    );

    console.log(`\nResult: Player 1 ${isPlayer1Higher ? ">" : "<="} Player 2`);
  });

/**
 * Example:
 *   npx hardhat --network localhost task:snake:leaderboard --limit 10
 */
task("task:snake:leaderboard", "Get active players for leaderboard")
  .addOptionalParam("address", "Optionally specify the SnakeGame contract address")
  .addOptionalParam("offset", "Starting offset (default: 0)", "0")
  .addOptionalParam("limit", "Number of players (default: 10)", "10")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const offset = parseInt(taskArguments.offset);
    const limit = parseInt(taskArguments.limit);

    const SnakeGameDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("SnakeGame");

    console.log(`SnakeGame: ${SnakeGameDeployment.address}`);

    const snakeGameContract = await ethers.getContractAt("SnakeGame", SnakeGameDeployment.address);

    const totalPlayers = await snakeGameContract.getActivePlayersCount();
    console.log(`\n🏆 Active Players: ${totalPlayers}`);

    if (totalPlayers > 0n) {
      const players = await snakeGameContract.getActivePlayers(offset, limit);

      console.log(`\nShowing ${players.length} players (offset: ${offset}):`);
      for (let i = 0; i < players.length; i++) {
        const stats = await snakeGameContract.playerStats(players[i]);
        console.log(`${offset + i + 1}. ${players[i]} - ${stats.totalGames} games`);
      }
    }
  });

