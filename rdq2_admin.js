// Red Dragon Quest Admin Editor - Synchronet BBS Version v2.0
// Converted from Python2 to JavaScript/Synchronet BBS
// Original by StingRay - A-Net Online BBS

load("sbbsdefs.js");

// Constants
var SAVE_DIR = js.exec_dir + "saves/";
var MESSAGE_DB_FILE = js.exec_dir + "message_db.json";
var CLASSES = ['Good', 'Evil', 'Beast', 'Thief', 'Magical', 'Demon'];

// Utility Functions
function clearScreen() {
    console.clear();
}

function printColor(text, color) {
    var colorMap = {
        "1;31": "\x01r\x01h",  // bright red
        "1;32": "\x01g\x01h",  // bright green
        "1;33": "\x01y\x01h",  // bright yellow
        "1;34": "\x01b\x01h",  // bright blue
        "1;35": "\x01m\x01h",  // bright magenta
        "1;36": "\x01c\x01h",  // bright cyan
        "1;37": "\x01w\x01h"   // bright white
    };
    
    var syncColor = colorMap[color] || "\x01w";
    console.print(syncColor + text + "\x01n\r\n");
}

function repeatChar(char, count) {
    var result = "";
    for (var i = 0; i < count; i++) result += char;
    return result;
}

function getCurrentDateTime() {
    var now = new Date();
    return now.getFullYear() + "-" + 
           String(now.getMonth() + 1).padStart(2, '0') + "-" + 
           String(now.getDate()).padStart(2, '0') + " " +
           String(now.getHours()).padStart(2, '0') + ":" + 
           String(now.getMinutes()).padStart(2, '0') + ":" + 
           String(now.getSeconds()).padStart(2, '0');
}

function getDateString() {
    var now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
}

// String.padStart polyfill for older JS engines
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length > targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

// Player Management Functions
function listPlayers() {
    clearScreen();
    printColor("\n=== Player List ===", "1;34");
    
    var players = [];
    var saveFiles = directory(SAVE_DIR + "*.json");
    
    if (!saveFiles || saveFiles.length === 0) {
        printColor("No player save files found!", "1;31");
        return [];
    }
    
    for (var i = 0; i < saveFiles.length; i++) {
        var filename = file_getname(saveFiles[i]);
        var playerName = filename.replace('.json', '');
        players.push(playerName);
    }
    
    // Sort players alphabetically
    players.sort();
    
    for (var i = 0; i < players.length; i++) {
        printColor((i + 1) + ". " + players[i], "1;37");
    }
    
    return players;
}

function loadPlayer(username) {
    var saveFile = SAVE_DIR + username + ".json";
    
    if (!file_exists(saveFile)) {
        printColor("Save file does not exist.", "1;31");
        return null;
    }
    
    var file = new File(saveFile);
    if (!file.open("r")) {
        printColor("Error opening save file.", "1;31");
        return null;
    }
    
    try {
        var rawData = JSON.parse(file.readAll().join(""));
        file.close();
        
        var player = {
            username: username,
            attributes: {
                // Basic Stats
                gold: rawData.gold || 0,
                bankBalance: rawData.bankBalance || 0,
                level: rawData.level || 1,
                experience: rawData.experience || 0,
                nextLevelExp: rawData.nextLevelExp || 100,
                strength: rawData.strength || 10,
                health: rawData.health || 100,
                playerClass: rawData.chosenClass || 'Good',
                
                // Advanced Stats
                bossVictories: rawData.bossVictories || 0,
                heroPoints: rawData.heroPoints || 0,
                heroTitle: rawData.heroTitle || "",
                currentRound: rawData.currentRound || 1,
                topDragon: rawData.topDragon || false,
                
                // Daily Restrictions
                dailyFights: rawData.dailyFights || 0,
                dailyPvpFights: rawData.dailyPvpFights || 0,
                dailyResurrections: rawData.dailyResurrections || 0,
                specialAttacksUsed: rawData.specialAttacksUsed || 0,
                specialFightingAreaAccesses: rawData.specialFightingAreaAccesses || 0,
                
                // Permanent Bonuses
                healthBonus: (rawData.permanentBonuses && rawData.permanentBonuses.healthBonus) || 0,
                strengthBonus: (rawData.permanentBonuses && rawData.permanentBonuses.strengthBonus) || 0,
                experienceMultiplier: (rawData.permanentBonuses && rawData.permanentBonuses.experienceMultiplier) || 1.0,
                goldMultiplier: (rawData.permanentBonuses && rawData.permanentBonuses.goldMultiplier) || 1.0,
                
                // Mastered Classes
                masteredClasses: (rawData.masteredClasses && rawData.masteredClasses.join(", ")) || "None"
            },
            rawData: rawData
        };
        
        return player;
    } catch (e) {
        file.close();
        printColor("Error loading player: " + e.toString(), "1;31");
        return null;
    }
}

function savePlayer(player) {
    var saveFile = SAVE_DIR + player.username + ".json";
    
    try {
        // Create backup
        var backupFile = saveFile + ".backup";
        if (file_exists(saveFile)) {
            file_copy(saveFile, backupFile);
        }
        
        // Update raw data with edited attributes
        var rawData = player.rawData;
        rawData.gold = player.attributes.gold;
        rawData.bankBalance = player.attributes.bankBalance;
        rawData.level = player.attributes.level;
        rawData.experience = player.attributes.experience;
        rawData.nextLevelExp = player.attributes.nextLevelExp;
        rawData.strength = player.attributes.strength;
        rawData.health = player.attributes.health;
        rawData.chosenClass = player.attributes.playerClass;
        rawData.bossVictories = player.attributes.bossVictories;
        rawData.heroPoints = player.attributes.heroPoints;
        rawData.heroTitle = player.attributes.heroTitle;
        rawData.currentRound = player.attributes.currentRound;
        rawData.topDragon = player.attributes.topDragon;
        rawData.dailyFights = player.attributes.dailyFights;
        rawData.dailyPvpFights = player.attributes.dailyPvpFights;
        rawData.dailyResurrections = player.attributes.dailyResurrections;
        rawData.specialAttacksUsed = player.attributes.specialAttacksUsed;
        rawData.specialFightingAreaAccesses = player.attributes.specialFightingAreaAccesses;
        
        // Handle permanent bonuses
        if (!rawData.permanentBonuses) {
            rawData.permanentBonuses = {};
        }
        rawData.permanentBonuses.healthBonus = player.attributes.healthBonus;
        rawData.permanentBonuses.strengthBonus = player.attributes.strengthBonus;
        rawData.permanentBonuses.experienceMultiplier = player.attributes.experienceMultiplier;
        rawData.permanentBonuses.goldMultiplier = player.attributes.goldMultiplier;
        
        var file = new File(saveFile);
        if (file.open("w")) {
            file.write(JSON.stringify(rawData, null, 2));
            file.close();
            printColor("Successfully saved player data", "1;32");
            return true;
        } else {
            printColor("Error opening file for writing", "1;31");
            return false;
        }
    } catch (e) {
        printColor("Error saving player: " + e.toString(), "1;31");
        return false;
    }
}

function editPlayer() {
    while (true) {
        var players = listPlayers();
        if (players.length === 0) {
            console.print("\nPress Enter to return to main menu...");
            console.getstr();
            return;
        }
        
        console.print("\nEnter player number to edit (or 0 to return): ");
        var choice = console.getstr(3);
        
        if (!choice || choice === "0") {
            return;
        }
        
        var choiceNum = parseInt(choice);
        if (isNaN(choiceNum)) {
            printColor("Invalid input! Please enter a number.", "1;31");
            console.print("Press Enter to continue...");
            console.getstr();
            continue;
        }
        
        if (choiceNum >= 1 && choiceNum <= players.length) {
            var username = players[choiceNum - 1];
            var player = loadPlayer(username);
            if (player) {
                editPlayerStats(player);
            } else {
                printColor("Failed to load player: " + username, "1;31");
                console.print("Press Enter to continue...");
                console.getstr();
            }
        } else {
            printColor("Invalid choice!", "1;31");
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

function editPlayerStats(player) {
    while (true) {
        clearScreen();
        printColor("\n=== Editing Player: " + player.username + " ===", "1;34");
        
        printColor("\n--- BASIC STATS ---", "1;36");
        printColor("Gold: " + player.attributes.gold.toLocaleString(), "1;32");
        printColor("Bank Balance: " + player.attributes.bankBalance.toLocaleString(), "1;32");
        printColor("Level: " + player.attributes.level, "1;32");
        printColor("Experience: " + player.attributes.experience.toLocaleString(), "1;32");
        printColor("Next Level Exp: " + player.attributes.nextLevelExp.toLocaleString(), "1;32");
        printColor("Strength: " + player.attributes.strength, "1;32");
        printColor("Health: " + player.attributes.health, "1;32");
        printColor("Class: " + player.attributes.playerClass, "1;32");
        
        printColor("\n--- HERO STATUS ---", "1;33");
        printColor("Boss Victories: " + player.attributes.bossVictories, "1;32");
        printColor("Hero Points: " + player.attributes.heroPoints, "1;32");
        printColor("Hero Title: " + (player.attributes.heroTitle || "None"), "1;32");
        printColor("Current Round: " + player.attributes.currentRound, "1;32");
        printColor("Top Dragon: " + (player.attributes.topDragon ? "Yes" : "No"), "1;32");
        
        printColor("\n--- DAILY RESTRICTIONS ---", "1;35");
        printColor("Daily Fights Used: " + player.attributes.dailyFights + "/20", "1;32");
        printColor("Daily PvP Fights Used: " + player.attributes.dailyPvpFights + "/10", "1;32");
        printColor("Daily Resurrections Used: " + player.attributes.dailyResurrections + "/3", "1;32");
        printColor("Special Attacks Used: " + player.attributes.specialAttacksUsed, "1;32");
        printColor("Special Area Accesses: " + player.attributes.specialFightingAreaAccesses + "/4", "1;32");
        
        printColor("\n--- PERMANENT BONUSES ---", "1;34");
        printColor("Health Bonus: +" + player.attributes.healthBonus, "1;32");
        printColor("Strength Bonus: +" + player.attributes.strengthBonus, "1;32");
        printColor("Experience Multiplier: " + player.attributes.experienceMultiplier.toFixed(1) + "x", "1;32");
        printColor("Gold Multiplier: " + player.attributes.goldMultiplier.toFixed(1) + "x", "1;32");
        
        printColor("\n--- MASTERED CLASSES ---", "1;37");
        printColor("Mastered: " + player.attributes.masteredClasses, "1;32");
        
        printColor("\n" + repeatChar("=", 50), "1;34");
        printColor("1. Edit Basic Stats", "1;37");
        printColor("2. Edit Hero Status", "1;37");
        printColor("3. Reset Daily Restrictions", "1;37");
        printColor("4. Edit Permanent Bonuses", "1;37");
        printColor("5. Advanced Options", "1;37");
        printColor("6. Save Changes", "1;32");
        printColor("7. Return Without Saving", "1;33");
        printColor("8. DELETE PLAYER", "1;31");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        switch(choice) {
            case '1':
                editBasicStats(player);
                break;
            case '2':
                editHeroStatus(player);
                break;
            case '3':
                resetDailyRestrictions(player);
                break;
            case '4':
                editPermanentBonuses(player);
                break;
            case '5':
                advancedOptions(player);
                break;
            case '6':
                if (savePlayer(player)) {
                    printColor("Changes saved successfully!", "1;32");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                return;
            case '7':
                console.print("Are you sure you want to discard changes? Type (yes/no): ");
                var confirm = console.getstr(3);
                if (confirm && confirm.toLowerCase() === 'yes') {
                    return;
                }
                break;
            case '8':
                deletePlayer(player);
                return;
            default:
                printColor("Invalid choice!", "1;31");
                console.print("Press Enter to continue...");
                console.getstr();
        }
    }
}

function editBasicStats(player) {
    while (true) {
        clearScreen();
        printColor("\n=== Edit Basic Stats for: " + player.username + " ===", "1;34");
        
        printColor("1. Gold: " + player.attributes.gold.toLocaleString(), "1;32");
        printColor("2. Bank Balance: " + player.attributes.bankBalance.toLocaleString(), "1;32");
        printColor("3. Level: " + player.attributes.level, "1;32");
        printColor("4. Experience: " + player.attributes.experience.toLocaleString(), "1;32");
        printColor("5. Next Level Exp: " + player.attributes.nextLevelExp.toLocaleString(), "1;32");
        printColor("6. Strength: " + player.attributes.strength, "1;32");
        printColor("7. Health: " + player.attributes.health, "1;32");
        printColor("8. Class: " + player.attributes.playerClass, "1;32");
        printColor("9. Return to main menu", "1;33");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        var attrs = ['', 'gold', 'bankBalance', 'level', 'experience', 'nextLevelExp', 'strength', 'health'];
        
        if (choice >= '1' && choice <= '7') {
            var attr = attrs[parseInt(choice)];
            console.print("Enter new " + attr + " value: ");
            var valueStr = console.getstr(15);
            var value = parseInt(valueStr);
            
            if (!isNaN(value) && value >= 0) {
                player.attributes[attr] = value;
                printColor(attr + " updated successfully!", "1;32");
            } else {
                printColor("Invalid input! Value must be a positive number.", "1;31");
            }
        } else if (choice === '8') {
            editPlayerClass(player);
        } else if (choice === '9') {
            return;
        } else {
            printColor("Invalid choice!", "1;31");
        }
        
        if (choice !== '8') {
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

function editPlayerClass(player) {
    clearScreen();
    printColor("\n=== Change Class for: " + player.username + " ===", "1;34");
    printColor("Current class: " + player.attributes.playerClass, "1;32");
    
    printColor("\nAvailable classes:", "1;36");
    for (var i = 0; i < CLASSES.length; i++) {
        printColor((i + 1) + ". " + CLASSES[i], "1;37");
    }
    
    console.print("\nEnter class number (or 0 to cancel): ");
    var choice = parseInt(console.getstr(1));
    
    if (choice >= 1 && choice <= CLASSES.length) {
        player.attributes.playerClass = CLASSES[choice - 1];
        printColor("Class updated to " + CLASSES[choice - 1] + "!", "1;32");
    } else if (choice !== 0) {
        printColor("Invalid class number!", "1;31");
    }
    
    console.print("Press Enter to continue...");
    console.getstr();
}

function editHeroStatus(player) {
    while (true) {
        clearScreen();
        printColor("\n=== Edit Hero Status for: " + player.username + " ===", "1;34");
        
        printColor("1. Boss Victories: " + player.attributes.bossVictories, "1;32");
        printColor("2. Hero Points: " + player.attributes.heroPoints, "1;32");
        printColor("3. Hero Title: " + (player.attributes.heroTitle || "None"), "1;32");
        printColor("4. Current Round: " + player.attributes.currentRound, "1;32");
        printColor("5. Top Dragon Status: " + (player.attributes.topDragon ? "Yes" : "No"), "1;32");
        printColor("6. Return to main menu", "1;33");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        switch(choice) {
            case '1':
            case '2':
            case '4':
                var attrs = ['', 'bossVictories', 'heroPoints', '', 'currentRound'];
                var attr = attrs[parseInt(choice)];
                console.print("Enter new " + attr + " value: ");
                var value = parseInt(console.getstr(10));
                if (!isNaN(value) && value >= 0) {
                    player.attributes[attr] = value;
                    printColor(attr + " updated successfully!", "1;32");
                } else {
                    printColor("Invalid input!", "1;31");
                }
                break;
            case '3':
                console.print("Enter new hero title (or blank for none): ");
                var title = console.getstr(30);
                player.attributes.heroTitle = title || "";
                printColor("Hero title updated!", "1;32");
                break;
            case '5':
                player.attributes.topDragon = !player.attributes.topDragon;
                printColor("Top Dragon status toggled to: " + (player.attributes.topDragon ? "Yes" : "No"), "1;32");
                break;
            case '6':
                return;
            default:
                printColor("Invalid choice!", "1;31");
        }
        
        if (choice !== '6') {
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

function resetDailyRestrictions(player) {
    clearScreen();
    printColor("\n=== Reset Daily Restrictions for: " + player.username + " ===", "1;34");
    
    printColor("This will reset all daily counters to 0:", "1;33");
    printColor("- Daily Fights (currently: " + player.attributes.dailyFights + "/20)", "1;37");
    printColor("- Daily PvP Fights (currently: " + player.attributes.dailyPvpFights + "/10)", "1;37");
    printColor("- Daily Resurrections (currently: " + player.attributes.dailyResurrections + "/3)", "1;37");
    printColor("- Special Attacks Used (currently: " + player.attributes.specialAttacksUsed + ")", "1;37");
    printColor("- Special Area Accesses (currently: " + player.attributes.specialFightingAreaAccesses + "/4)", "1;37");
    
    console.print("\nAre you sure? Type (yes/no): ");
    var confirm = console.getstr(3);
    
    if (confirm && confirm.toLowerCase() === 'yes') {
        player.attributes.dailyFights = 0;
        player.attributes.dailyPvpFights = 0;
        player.attributes.dailyResurrections = 0;
        player.attributes.specialAttacksUsed = 0;
        player.attributes.specialFightingAreaAccesses = 0;
        
        // Also reset daily dates in raw data
        var currentDate = getDateString();
        player.rawData.lastFightDate = null;
        player.rawData.lastPvpFightDate = null;
        player.rawData.lastRestrictionDate = null;
        player.rawData.lastSpecialFightingAreaAccess = null;
        player.rawData.lastPvpTargetReset = null;
        player.rawData.dailyPvpTargets = {};
        
        printColor("All daily restrictions have been reset!", "1;32");
    } else {
        printColor("Reset cancelled.", "1;33");
    }
    
    console.print("Press Enter to continue...");
    console.getstr();
}

function editPermanentBonuses(player) {
    while (true) {
        clearScreen();
        printColor("\n=== Edit Permanent Bonuses for: " + player.username + " ===", "1;34");
        
        printColor("1. Health Bonus: +" + player.attributes.healthBonus, "1;32");
        printColor("2. Strength Bonus: +" + player.attributes.strengthBonus, "1;32");
        printColor("3. Experience Multiplier: " + player.attributes.experienceMultiplier.toFixed(1) + "x", "1;32");
        printColor("4. Gold Multiplier: " + player.attributes.goldMultiplier.toFixed(1) + "x", "1;32");
        printColor("5. Return to main menu", "1;33");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        switch(choice) {
            case '1':
            case '2':
                var attrs = ['', 'healthBonus', 'strengthBonus'];
                var attr = attrs[parseInt(choice)];
                console.print("Enter new " + attr + " value: ");
                var value = parseInt(console.getstr(10));
                if (!isNaN(value) && value >= 0) {
                    player.attributes[attr] = value;
                    printColor(attr + " updated successfully!", "1;32");
                } else {
                    printColor("Invalid input!", "1;31");
                }
                break;
            case '3':
            case '4':
                var attrs = ['', '', '', 'experienceMultiplier', 'goldMultiplier'];
                var attr = attrs[parseInt(choice)];
                console.print("Enter new " + attr + " value (e.g., 1.5): ");
                var value = parseFloat(console.getstr(10));
                if (!isNaN(value) && value >= 0.1 && value <= 10.0) {
                    player.attributes[attr] = value;
                    printColor(attr + " updated successfully!", "1;32");
                } else {
                    printColor("Invalid input! Value must be between 0.1 and 10.0", "1;31");
                }
                break;
            case '5':
                return;
            default:
                printColor("Invalid choice!", "1;31");
        }
        
        if (choice !== '5') {
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

function advancedOptions(player) {
    while (true) {
        clearScreen();
        printColor("\n=== Advanced Options for: " + player.username + " ===", "1;34");
        
        printColor("1. Make Top Dragon (master all classes)", "1;32");
        printColor("2. Reset to Level 1 (keep bonuses)", "1;32");
        printColor("3. Grant Boss Victory Rewards", "1;32");
        printColor("4. Clear All Mastered Classes", "1;32");
        printColor("5. Set Online Status", "1;32");
        printColor("6. Return to main menu", "1;33");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        switch(choice) {
            case '1':
                console.print("Make this player Top Dragon? Type (yes/no): ");
                var confirm = console.getstr(3);
                if (confirm && confirm.toLowerCase() === 'yes') {
                    player.rawData.masteredClasses = CLASSES.slice(); // Copy all classes
                    player.attributes.topDragon = true;
                    player.attributes.masteredClasses = CLASSES.join(", ");
                    printColor("Player is now Top Dragon with all classes mastered!", "1;32");
                }
                break;
            case '2':
                console.print("Reset player to level 1? Type (yes/no): ");
                var confirm = console.getstr(3);
                if (confirm && confirm.toLowerCase() === 'yes') {
                    player.attributes.level = 1;
                    player.attributes.experience = 0;
                    player.attributes.nextLevelExp = 100;
                    player.attributes.health = 110 + player.attributes.healthBonus;
                    player.attributes.strength = 10 + player.attributes.strengthBonus;
                    printColor("Player reset to level 1 (permanent bonuses kept)!", "1;32");
                }
                break;
            case '3':
                console.print("Grant boss victory rewards? Type (yes/no): ");
                var confirm = console.getstr(3);
                if (confirm && confirm.toLowerCase() === 'yes') {
                    player.attributes.bossVictories++;
                    player.attributes.heroPoints = player.attributes.bossVictories * 250;
                    player.attributes.healthBonus += 50;
                    player.attributes.strengthBonus += 10;
                    player.attributes.experienceMultiplier += 0.1;
                    player.attributes.goldMultiplier += 0.1;
                    printColor("Boss victory rewards granted!", "1;32");
                }
                break;
            case '4':
                console.print("Clear all mastered classes? Type (yes/no): ");
                var confirm = console.getstr(3);
                if (confirm && confirm.toLowerCase() === 'yes') {
                    player.rawData.masteredClasses = [];
                    player.attributes.masteredClasses = "None";
                    player.attributes.topDragon = false;
                    printColor("All mastered classes cleared!", "1;32");
                }
                break;
            case '5':
                player.rawData.isOnline = !player.rawData.isOnline;
                printColor("Online status toggled to: " + (player.rawData.isOnline ? "Online" : "Offline"), "1;32");
                break;
            case '6':
                return;
            default:
                printColor("Invalid choice!", "1;31");
        }
        
        if (choice !== '6') {
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

function deletePlayer(player) {
    clearScreen();
    printColor("\n=== DELETE PLAYER: " + player.username + " ===", "1;31");
    printColor("WARNING: This action cannot be undone!", "1;31");
    printColor("This will permanently delete all player data.", "1;31");
    
    console.print("\nType the player name exactly to confirm deletion: ");
    var confirm = console.getstr(30);
    
    if (confirm === player.username) {
        var saveFile = SAVE_DIR + player.username + ".json";
        if (file_remove(saveFile)) {
            printColor("Player " + player.username + " deleted successfully!", "1;32");
        } else {
            printColor("Error deleting player file!", "1;31");
        }
    } else {
        printColor("Player name did not match. Deletion cancelled.", "1;33");
    }
    
    console.print("Press Enter to continue...");
    console.getstr();
}

// Message Management Functions (unchanged from original)
function loadMessages() {
    if (!file_exists(MESSAGE_DB_FILE)) {
        return {};
    }
    
    var file = new File(MESSAGE_DB_FILE);
    if (!file.open("r")) {
        return {};
    }
    
    try {
        var messages = JSON.parse(file.readAll().join(""));
        file.close();
        return messages;
    } catch (e) {
        file.close();
        return {};
    }
}

function saveMessages(messages) {
    var file = new File(MESSAGE_DB_FILE);
    if (file.open("w")) {
        file.write(JSON.stringify(messages, null, 2));
        file.close();
        return true;
    }
    return false;
}

function listMessageUsers(messages) {
    var users = Object.keys(messages);
    printColor("\n=== Users with Messages ===", "1;34");
    if (users.length === 0) {
        printColor("No users have messages.", "1;31");
        return users;
    }
    
    for (var i = 0; i < users.length; i++) {
        var msgCount = messages[users[i]].length;
        printColor((i + 1) + ". " + users[i] + " (" + msgCount + " messages)", "1;37");
    }
    return users;
}

function viewMessages() {
    while (true) {
        clearScreen();
        var messages = loadMessages();
        var users = listMessageUsers(messages);
        
        if (users.length === 0) {
            console.print("\nPress Enter to return to main menu...");
            console.getstr();
            return;
        }
        
        console.print("\nEnter user number to view/delete messages (or 0 to return): ");
        var choice = console.getstr(3);
        
        if (!choice || choice === "0") {
            return;
        }
        
        var choiceNum = parseInt(choice);
        if (isNaN(choiceNum)) {
            printColor("Invalid input! Please enter a number.", "1;31");
            console.print("Press Enter to continue...");
            console.getstr();
            continue;
        }
        
        if (choiceNum >= 1 && choiceNum <= users.length) {
            var user = users[choiceNum - 1];
            editUserMessages(messages, user);
        } else {
            printColor("Invalid choice!", "1;31");
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

function editUserMessages(messages, user) {
    while (true) {
        clearScreen();
        var userMessages = messages[user] || [];
        printColor("\n=== Messages for " + user + " ===", "1;34");
        
        if (userMessages.length === 0) {
            printColor("No messages for this user.", "1;31");
            console.print("Press Enter to return...");
            console.getstr();
            return;
        }
        
        for (var i = 0; i < userMessages.length; i++) {
            var msg = userMessages[i];
            printColor("\n" + (i + 1) + ". From: " + msg[0], "1;37");
            printColor("   Message: " + msg[1], "1;32");
        }
        
        printColor("\n1. Delete a message", "1;37");
        printColor("2. Delete all messages for this user", "1;37");
        printColor("3. Return to previous menu", "1;37");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        if (choice === '1') {
            console.print("Enter message number to delete: ");
            var msgNum = parseInt(console.getstr(3));
            
            if (!isNaN(msgNum) && msgNum >= 1 && msgNum <= userMessages.length) {
                userMessages.splice(msgNum - 1, 1);
                messages[user] = userMessages;
                saveMessages(messages);
                printColor("Message deleted!", "1;32");
            } else {
                printColor("Invalid message number!", "1;31");
            }
        } else if (choice === '2') {
            console.print("Are you sure you want to delete ALL messages for this user? Type (yes/no): ");
            var confirm = console.getstr(3);
            if (confirm && confirm.toLowerCase() === 'yes') {
                delete messages[user];
                saveMessages(messages);
                printColor("All messages deleted for user!", "1;32");
                console.print("Press Enter to continue...");
                console.getstr();
                return;
            }
        } else if (choice === '3') {
            return;
        } else {
            printColor("Invalid choice!", "1;31");
        }
        
        console.print("Press Enter to continue...");
        console.getstr();
    }
}

// Main Menu
function mainMenu() {
    while (true) {
        clearScreen();
        printColor("\n=== RDQ2 Admin Editor v2.0 ===", "1;34");
        printColor("Current Date and Time (UTC): " + getCurrentDateTime(), "1;37");
        printColor("Current User's Login: " + (user.alias || "sysop"), "1;37");
        
        printColor("\n1. Edit Player", "1;32");
        printColor("2. View/Delete Messages", "1;32");
        printColor("3. Player Statistics", "1;32");
        printColor("4. Exit", "1;32");
        
        console.print("\nEnter choice: ");
        var choice = console.getstr(1);
        
        switch(choice) {
            case '1':
                editPlayer();
                break;
            case '2':
                viewMessages();
                break;
            case '3':
                showPlayerStatistics();
                break;
            case '4':
                printColor("\nExiting admin editor...", "1;33");
                return;
            default:
                printColor("Invalid choice!", "1;31");
                console.print("Press Enter to continue...");
                console.getstr();
        }
    }
}

function showPlayerStatistics() {
    clearScreen();
    printColor("\n=== Player Statistics ===", "1;34");
    
    var saveFiles = directory(SAVE_DIR + "*.json");
    if (!saveFiles || saveFiles.length === 0) {
        printColor("No player save files found!", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    var totalPlayers = saveFiles.length;
    var topDragons = 0;
    var heroesCount = 0;
    var highestLevel = 0;
    var totalGold = 0;
    var onlinePlayers = 0;
    
    for (var i = 0; i < saveFiles.length; i++) {
        try {
            var file = new File(saveFiles[i]);
            if (file.open("r")) {
                var data = JSON.parse(file.readAll().join(""));
                file.close();
                
                if (data.topDragon) topDragons++;
                if (data.bossVictories > 0) heroesCount++;
                if (data.level > highestLevel) highestLevel = data.level;
                if (data.gold) totalGold += data.gold;
                if (data.bankBalance) totalGold += data.bankBalance;
                if (data.isOnline) onlinePlayers++;
            }
        } catch (e) {
            // Skip corrupt files
        }
    }
    
    printColor("Total Players: " + totalPlayers, "1;32");
    printColor("Top Dragons: " + topDragons, "1;32");
    printColor("Heroes (Boss Victories): " + heroesCount, "1;32");
    printColor("Highest Level: " + highestLevel, "1;32");
    printColor("Total Gold in Economy: " + totalGold.toLocaleString(), "1;32");
    printColor("Currently Online: " + onlinePlayers, "1;32");
    
    console.print("\nPress Enter to continue...");
    console.getstr();
}

// Ensure directories exist
function ensureDirectories() {
    if (!file_exists(SAVE_DIR)) {
        mkdir(SAVE_DIR);
    }
}

// Main execution
ensureDirectories();
mainMenu();
