# 🐍 FHEVM Snake Game

A privacy-preserving blockchain gaming application that combines classic Snake gameplay with cutting-edge **Fully Homomorphic Encryption (FHE)** technology. Players' scores are encrypted and stored on-chain using FHEVM's `euint32` types, enabling secure leaderboard rankings without revealing individual scores.

## ✨ Features

### 🎮 Game Features
- **Classic Snake Gameplay**: Nostalgic snake game with modern graphics
- **Dynamic Speed**: Game speed increases as you score more points
- **Combo System**: Bonus points for consecutive food eating
- **Multi-page Architecture**: Welcome, Game, Leaderboard, History, and Profile pages

### 🔐 Privacy Features (FHEVM)
- **Encrypted Scores**: All scores stored as encrypted `euint32` on-chain
- **Privacy-Preserving Leaderboards**: Rankings computed on encrypted data
- **Selective Decryption**: Only players can decrypt their own scores
- **Batch Comparisons**: Optimized encrypted comparisons (1 signature vs N)
- **Fair Competition**: No score manipulation or cheating possible

### 🌐 Dual-Network Support
- **Local Development**: Mock FHEVM environment with instant transactions
- **Sepolia Testnet**: Real FHEVM integration with true blockchain persistence

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.24, FHEVM 0.8.x, Hardhat |
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Blockchain** | ethers.js v6, EIP-6963 |
| **Encryption** | @fhevm/mock-utils, @zama-fhe/relayer-sdk |
| **Styling** | Tailwind CSS, Glassmorphism Design |
| **Game Engine** | Canvas 2D API |

## 🏗️ Project Structure

```
fhevm-snake-game/
├── fhevm-hardhat-template/           # Smart Contracts
│   ├── contracts/
│   │   ├── SnakeGame.sol            # Main game contract
│   │   └── FHECounter.sol           # Reference counter contract
│   ├── deploy/deploy.ts             # Deployment scripts
│   ├── test/SnakeGame.test.ts       # Contract tests
│   └── tasks/SnakeGame.ts           # CLI tasks
│
└── snake-game-frontend/             # Frontend Application
    ├── app/                         # Next.js pages
    │   ├── page.tsx                # Welcome page
    │   ├── game/page.tsx           # Game page
    │   ├── leaderboard/page.tsx    # Leaderboard page
    │   ├── history/page.tsx        # Game history
    │   └── profile/page.tsx        # Player profile
    ├── components/                  # React components
    ├── hooks/                       # Custom React hooks
    ├── fhevm/                      # FHEVM integration
    ├── lib/gameEngine.ts           # Snake game logic
    └── design-tokens.ts            # Design system
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Sepolia ETH (for testnet deployment)

### 1. Clone the Repository
```bash
   git clone https://github.com/PayneVirginia/fhevm-snake-game-updated.git
cd fhevm-snake-game-updated
```

### 2. Install Dependencies
```bash
# Install contract dependencies
cd fhevm-hardhat-template
npm install

# Install frontend dependencies
cd ../snake-game-frontend
npm install
```

### 3. Local Development Setup

#### Terminal 1: Start Hardhat Node
```bash
cd fhevm-hardhat-template
npx hardhat node
```

#### Terminal 2: Deploy Contracts
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network localhost
```

#### Terminal 3: Start Frontend (Mock Mode)
```bash
cd snake-game-frontend
npm run dev:mock
```

Visit `http://localhost:3000` to play! 🎮

### 4. Sepolia Testnet Setup

#### Configure Environment
```bash
cd fhevm-hardhat-template
npx hardhat vars set MNEMONIC "your twelve word mnemonic here"
npx hardhat vars set INFURA_API_KEY "your_infura_api_key"
```

#### Deploy to Sepolia
```bash
npx hardhat deploy --network sepolia
```

#### Start Frontend (Sepolia Mode)
```bash
cd snake-game-frontend
npm run dev
```

Connect MetaMask to Sepolia testnet and play with real blockchain persistence! 🌐

## 🎯 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Start Game**: Navigate to Game page and click "Start Game"
3. **Play Snake**: Use arrow keys or WASD to control the snake
4. **Score Points**: Eat food to grow and increase score
5. **Submit Score**: Play for at least 10 seconds, then submit your encrypted score
6. **View Rankings**: Check Leaderboard page and compare with other players
7. **Decrypt Scores**: View your personal stats in History and Profile pages

## 📊 Contract Addresses

### Sepolia Testnet
- **SnakeGame**: [`0x0F227846745CAAc4B4de31E2BFB7348Bb99e6817`](https://sepolia.etherscan.io/address/0x0F227846745CAAc4B4de31E2BFB7348Bb99e6817)
- **FHECounter**: [`0x254E3397AA7Ae8090EE003e4575cd49E3F9c786B`](https://sepolia.etherscan.io/address/0x254E3397AA7Ae8090EE003e4575cd49E3F9c786B)

### Local Hardhat Network
- Deployed addresses are automatically generated when running `npx hardhat deploy --network localhost`

## 🧪 Testing

### Contract Tests
```bash
cd fhevm-hardhat-template
npx hardhat test
```

### Frontend Build Verification
```bash
cd snake-game-frontend
npm run build
```

## 🔧 Development Commands

### Contract Operations
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to network
npx hardhat deploy --network <localhost|sepolia>

# Verify deployment
npx hardhat run scripts/verify.js --network sepolia
```

### Frontend Operations
```bash
# Generate ABI files from deployments
npm run genabi

# Start development server (mock mode)
npm run dev:mock

# Start development server (testnet mode)
npm run dev

# Build for production
npm run build
```

## 🔐 Privacy & Security

### FHEVM Integration
- **Encrypted Storage**: All player scores stored as `euint32` ciphertext
- **Access Control**: `FHE.allow()` and `FHE.allowThis()` manage decryption permissions
- **Selective Revelation**: Players choose when and what to decrypt
- **Computational Privacy**: Leaderboard rankings computed without revealing scores

### Security Features
- **Input Validation**: Game duration and score validation on both client and contract
- **Replay Protection**: Nonce-based transaction security
- **Type Safety**: Full TypeScript coverage for contract interactions

## 🎨 Design System

The UI implements a **Glassmorphism** design system with:
- **Deterministic Theming**: Seed-based color palette selection
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Dark Mode**: Full dark theme support
- **Accessibility**: WCAG AA compliant

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Zama Team** for FHEVM technology and SDKs
- **Ethereum Foundation** for Sepolia testnet
- **Next.js Team** for the amazing React framework
- **OpenZeppelin** for secure contract patterns

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the [FHEVM Documentation](https://docs.zama.ai/fhevm)
- Join the [Zama Community](https://discord.gg/zama)

---

**Happy Gaming! 🎮🐍✨**

Built with ❤️ using FHEVM and Next.js
