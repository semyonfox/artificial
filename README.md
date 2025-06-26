# Evolution Clicker 🌍

A civilization progression clicker game where you guide humanity through different historical eras, from the Paleolithic to the far future.

## 🚀 Quick Start

### Prerequisites

- A modern web browser that supports ES6 modules
- Python (for development server) or any other HTTP server

### Running the Game

1. **Clone or download this repository**

2. **Start a local server** (required for ES6 modules):

   ```bash
   # Using Python (recommended)
   npm run dev
   # or
   python -m http.server 8000

   # Using Node.js (if you have it installed)
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to:

   ```
   http://localhost:8000
   ```

4. **Enjoy the game!** 🎮

## 🎮 How to Play

### Starting Out

- Begin in the **Paleolithic Era** with basic survival mechanics
- **Forage for sticks** to gather your first resources
- **Research fire control** to unlock hunting and cooking
- **Hire workers** to automate resource production

### Core Mechanics

- **Click actions**: Forage, Hunt, Cook to gather resources manually
- **Workers**: Hire automated workers to produce resources over time
- **Upgrades**: Purchase improvements to increase efficiency
- **Era Progression**: Meet requirements to advance to new historical periods

### Resources

- 🪵 **Sticks**: Basic building material
- 🪨 **Stones**: Used for tools and construction
- 🥩 **Meat**: Food source (raw)
- 🍗 **Cooked Meat**: Processed food for workers
- 🦴 **Bones**: Crafting material
- 🧥 **Clothes**: Advanced crafting material

### Workers

- **Foragers**: Automatically gather sticks and occasionally stones
- **Hunters**: Hunt animals for meat, bones, and fur
- **Cooks**: Process raw meat into cooked meat

### Progression

- Complete era requirements to unlock new time periods
- Each era introduces new resources, workers, and technologies
- Balance resource production to support growing civilization

## 🏗️ Game Architecture

### Core Systems

- **GameManager**: Main game coordination and logic
- **CoreManager**: System initialization and management
- **GameState**: Persistent data management with auto-save
- **EraRegistry**: Historical period management
- **ResourceManager**: Resource gathering and processing
- **WorkerManager**: Automated worker systems
- **UIManager**: User interface updates and interactions

### File Structure

```
artificial/
├── game.js                 # Main entry point
├── index.html             # Game HTML structure
├── styles.css             # Complete styling
├── package.json           # Project configuration
└── js/
    ├── core/
    │   ├── config.js       # Game configuration
    │   └── coreManager.js  # Core system management
    ├── data/
    │   ├── eraRegistry.js  # Era management system
    │   └── eras/
    │       ├── paleolithic.js  # Stone age data
    │       └── mesolithic.js   # Middle stone age data
    ├── state/
    │   └── gameState.js    # Persistent game state
    ├── systems/
    │   ├── CutsceneManager.js  # Intro cutscenes
    │   ├── ResourceManager.js  # Resource handling
    │   ├── UIManager.js        # UI updates
    │   └── WorkerManager.js    # Worker automation
    ├── eraLoader.js       # Dynamic era loading
    └── GameManager.js     # Main game logic
```

## 🛠️ Development

### Building

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm run dev
```

### Adding New Content

#### New Eras

1. Create era data file in `js/data/eras/`
2. Define resources, workers, upgrades, and progression requirements
3. Register in `EraRegistry.js`

#### New Resources

1. Add to resource icons in `config.js`
2. Update game state structure if needed
3. Add production/consumption logic

#### New Workers

1. Define in era data files
2. Add automation logic in `WorkerManager.js`
3. Update UI for hiring interface

## 🎯 Features

### Implemented ✅

- **Core clicker mechanics** with button cooldowns
- **Worker automation system** with feeding requirements
- **Upgrade system** with era-specific technologies
- **Era progression** with unlock requirements
- **Persistent save system** with localStorage
- **Responsive UI** with modern styling
- **Notification system** for player feedback
- **Cutscene introduction** with skip option

### Planned 🚧

- More historical eras (Neolithic, Bronze Age, Iron Age, etc.)
- Random events and disasters
- Achievement system
- Prestige mechanics
- More complex resource chains
- Mini-games and special events

## 🐛 Troubleshooting

### Common Issues

**Game won't load:**

- Ensure you're running from an HTTP server (not file://)
- Check browser console for error messages
- Try refreshing the page

**Save data lost:**

- Check if localStorage is enabled in your browser
- Incognito/private mode may not persist saves
- Try exporting save data as backup

**Performance issues:**

- Close other browser tabs
- Check if multiple workers are running efficiently
- Restart the game if needed

### Browser Compatibility

- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅
- **IE**: Not supported ❌

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Feel free to contribute by:

- Reporting bugs
- Suggesting new features
- Adding new eras or content
- Improving documentation
- Optimizing performance

---

**Have fun evolving humanity! 🌟**
