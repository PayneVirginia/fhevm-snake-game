// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEVM Snake Game Contract
/// @notice Privacy-preserving snake game with encrypted scores and leaderboards
/// @dev Implements encrypted score storage, ranking comparison, and game history
contract SnakeGame is SepoliaConfig {
    // ========== Data Structures ==========
    
    struct GameRecord {
        uint256 gameId;
        address player;
        euint32 score;
        uint256 timestamp;
        uint32 duration;
    }
    
    struct PlayerStats {
        uint256 totalGames;
        euint32 maxScore;
        euint32 totalScore;
        uint256 firstPlayTime;
        uint256 lastPlayTime;
    }
    
    struct LeaderboardEntry {
        address player;
        euint32 score;
        uint256 timestamp;
    }
    
    // ========== State Variables ==========
    
    uint256 public totalGamesPlayed;
    
    mapping(address => GameRecord[]) private playerRecords;
    mapping(address => PlayerStats) public playerStats;
    mapping(address => euint32) public playerMaxScores;
    mapping(address => euint32) public playerTotalScores;
    mapping(address => bool) public isPublicProfile;
    
    address[] public activePlayers;
    mapping(address => bool) private isActivePlayer;
    
    // Leaderboards (Top 10)
    uint256 public constant LEADERBOARD_SIZE = 10;
    LeaderboardEntry[] private singleGameLeaderboard;
    LeaderboardEntry[] private totalScoreLeaderboard;
    mapping(address => uint256) private singleGameRank; // 0 means not in leaderboard, 1-10 are ranks
    mapping(address => uint256) private totalScoreRank;
    
    // ========== Events ==========
    
    event GameSubmitted(
        address indexed player,
        uint256 indexed gameId,
        uint256 timestamp,
        uint32 duration
    );
    
    event NewHighScore(
        address indexed player,
        uint256 timestamp
    );
    
    event ProfileVisibilityChanged(
        address indexed player,
        bool isPublic
    );
    
    event LeaderboardUpdated(
        address indexed player,
        uint256 rank,
        bool isSingleGame
    );
    
    // ========== Errors ==========
    
    error GameTooShort();
    error InvalidIndex();
    error OffsetOutOfBounds();
    
    // ========== Core Functions ==========
    
    /// @notice Submit encrypted game score
    /// @param inputEuint32 Encrypted score input
    /// @param inputProof Input proof for encryption
    /// @param duration Game duration in seconds
    /// @return gameId The ID of the submitted game
    function submitScore(
        externalEuint32 inputEuint32,
        bytes calldata inputProof,
        uint32 duration
    ) external returns (uint256 gameId) {
        // Validate game duration (at least 10 seconds)
        if (duration < 10) revert GameTooShort();
        
        // Convert external encrypted input to encrypted type
        euint32 score = FHE.fromExternal(inputEuint32, inputProof);
        
        // Authorize player and contract to access the score
        FHE.allow(score, msg.sender);
        FHE.allowThis(score);
        
        // Create game record
        gameId = totalGamesPlayed++;
        GameRecord memory record = GameRecord({
            gameId: gameId,
            player: msg.sender,
            score: score,
            timestamp: block.timestamp,
            duration: duration
        });
        
        playerRecords[msg.sender].push(record);
        
        // Update player statistics
        PlayerStats storage stats = playerStats[msg.sender];
        
        if (stats.totalGames == 0) {
            // First game for this player
            stats.firstPlayTime = block.timestamp;
            if (!isActivePlayer[msg.sender]) {
                activePlayers.push(msg.sender);
                isActivePlayer[msg.sender] = true;
            }
        }
        
        stats.totalGames++;
        stats.lastPlayTime = block.timestamp;
        
        // Update max score using FHE.max
        euint32 currentMax = playerMaxScores[msg.sender];
        euint32 newMax;
        
        if (FHE.isInitialized(currentMax)) {
            newMax = FHE.max(currentMax, score);
        } else {
            newMax = score;
        }
        
        playerMaxScores[msg.sender] = newMax;
        stats.maxScore = newMax;
        
        FHE.allowThis(newMax);
        FHE.allow(newMax, msg.sender);
        
        // Update total score using FHE.add
        euint32 currentTotal = playerTotalScores[msg.sender];
        euint32 newTotal;
        
        if (FHE.isInitialized(currentTotal)) {
            newTotal = FHE.add(currentTotal, score);
        } else {
            newTotal = score;
        }
        
        playerTotalScores[msg.sender] = newTotal;
        stats.totalScore = newTotal;
        
        FHE.allowThis(newTotal);
        FHE.allow(newTotal, msg.sender);
        
        emit GameSubmitted(msg.sender, gameId, block.timestamp, duration);
        emit NewHighScore(msg.sender, block.timestamp);
        
        return gameId;
    }
    
    // ========== Comparison Functions (for Leaderboard) ==========
    
    /// @notice Compare max scores of two players
    /// @param player1 First player address
    /// @param player2 Second player address
    /// @return result Encrypted boolean indicating if player1 > player2
    function compareMaxScores(address player1, address player2) 
        external 
        returns (ebool result) 
    {
        euint32 score1 = playerMaxScores[player1];
        euint32 score2 = playerMaxScores[player2];
        
        if (!FHE.isInitialized(score1)) {
            result = FHE.asEbool(false);
        } else if (!FHE.isInitialized(score2)) {
            result = FHE.asEbool(true);
        } else {
            result = FHE.gt(score1, score2);
        }
        
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        return result;
    }
    
    /// @notice Compare total scores of two players
    /// @param player1 First player address
    /// @param player2 Second player address
    /// @return result Encrypted boolean indicating if player1 > player2
    function compareTotalScores(address player1, address player2) 
        external 
        returns (ebool result) 
    {
        euint32 total1 = playerTotalScores[player1];
        euint32 total2 = playerTotalScores[player2];
        
        if (!FHE.isInitialized(total1)) {
            result = FHE.asEbool(false);
        } else if (!FHE.isInitialized(total2)) {
            result = FHE.asEbool(true);
        } else {
            result = FHE.gt(total1, total2);
        }
        
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        return result;
    }
    
    /// @notice Batch compare caller's max score with multiple players (OPTIMIZED)
    /// @param otherPlayers Array of player addresses to compare with
    /// @dev This function performs all comparisons in ONE transaction, reducing signatures from N to 1
    /// @dev Caller must use staticCall after this to get all comparison results
    function batchCompareMaxScores(address[] calldata otherPlayers) 
        external 
    {
        euint32 myScore = playerMaxScores[msg.sender];
        
        for (uint256 i = 0; i < otherPlayers.length; i++) {
            euint32 otherScore = playerMaxScores[otherPlayers[i]];
            ebool result;
            
            if (!FHE.isInitialized(myScore)) {
                result = FHE.asEbool(false);
            } else if (!FHE.isInitialized(otherScore)) {
                result = FHE.asEbool(true);
            } else {
                result = FHE.gt(myScore, otherScore);
            }
            
            // Allow both contract and caller to access result
            FHE.allowThis(result);
            FHE.allow(result, msg.sender);
        }
    }
    
    /// @notice Batch compare caller's total score with multiple players (OPTIMIZED)
    /// @param otherPlayers Array of player addresses to compare with
    /// @dev This function performs all comparisons in ONE transaction, reducing signatures from N to 1
    function batchCompareTotalScores(address[] calldata otherPlayers) 
        external 
    {
        euint32 myTotal = playerTotalScores[msg.sender];
        
        for (uint256 i = 0; i < otherPlayers.length; i++) {
            euint32 otherTotal = playerTotalScores[otherPlayers[i]];
            ebool result;
            
            if (!FHE.isInitialized(myTotal)) {
                result = FHE.asEbool(false);
            } else if (!FHE.isInitialized(otherTotal)) {
                result = FHE.asEbool(true);
            } else {
                result = FHE.gt(myTotal, otherTotal);
            }
            
            // Allow both contract and caller to access result
            FHE.allowThis(result);
            FHE.allow(result, msg.sender);
        }
    }
    
    // ========== Query Functions ==========
    
    /// @notice Get player's game record count
    /// @param player Player address
    /// @return Number of games played
    function getPlayerRecordCount(address player) 
        external 
        view 
        returns (uint256) 
    {
        return playerRecords[player].length;
    }
    
    /// @notice Get specific game record
    /// @param player Player address
    /// @param index Record index
    /// @return GameRecord struct
    function getGameRecord(address player, uint256 index) 
        external 
        view 
        returns (GameRecord memory) 
    {
        if (index >= playerRecords[player].length) revert InvalidIndex();
        return playerRecords[player][index];
    }
    
    /// @notice Get player's encrypted max score
    /// @param player Player address
    /// @return Encrypted max score
    function getPlayerMaxScore(address player) 
        external 
        view 
        returns (euint32) 
    {
        return playerMaxScores[player];
    }
    
    /// @notice Get player's encrypted total score
    /// @param player Player address
    /// @return Encrypted total score
    function getPlayerTotalScore(address player) 
        external 
        view 
        returns (euint32) 
    {
        return playerTotalScores[player];
    }
    
    /// @notice Get total number of active players
    /// @return Number of players who have played at least once
    function getActivePlayersCount() 
        external 
        view 
        returns (uint256) 
    {
        return activePlayers.length;
    }
    
    /// @notice Get active players list (paginated)
    /// @param offset Starting index
    /// @param limit Number of players to return
    /// @return Array of player addresses
    function getActivePlayers(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 total = activePlayers.length;
        
        // Return empty array if no players or offset is beyond array
        if (total == 0 || offset >= total) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = activePlayers[i];
        }
        
        return result;
    }
    
    // ========== Settings Functions ==========
    
    /// @notice Set profile visibility for leaderboard
    /// @param _isPublic True to show in leaderboard, false to hide
    function setProfileVisibility(bool _isPublic) external {
        isPublicProfile[msg.sender] = _isPublic;
        emit ProfileVisibilityChanged(msg.sender, _isPublic);
    }
}

