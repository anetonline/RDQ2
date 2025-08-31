// Red Dragon Quest - Synchronet BBS Door Game
// Converted from Python2/Mystic BBS to JavaScript/Synchronet BBS
// Original by StingRay - A-Net Online BBS
// Telnet: bbs.a-net.online:1337
// http://a-net.fyi

load("sbbsdefs.js");

// Game constants
var CLASSES = ['Good', 'Evil', 'Beast', 'Thief', 'Magical', 'Demon'];
var SAVE_DIR = js.exec_dir + "saves/";
var MESSAGE_DB_FILE = js.exec_dir + "message_db.json";

// Ensure save directory exists
function ensureSaveDir() {
    if (!file_exists(SAVE_DIR)) mkdir(SAVE_DIR);
}

function clearScreen() {
    console.clear();
}

function printColor(text, color) {
    // Convert color codes and print
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

function getAttackType(player) {
    var maxSpecial = player.level * 2;
    var remaining = maxSpecial - player.specialAttacksUsed;
    // Show remaining instead of used/total
    console.print("\r\nChoose attack type: [N]ormal or [S]pecial (" + remaining + " remaining)?\r\n");
    var subAction = console.getstr(1);
    if (!subAction || subAction.trim() === "") {
        return 'N';
    }
    return subAction.trim().toUpperCase();
}

function battleEvent(player, enemy) {
    var eventRoll = Math.random();
    if (eventRoll < 0.3) {
        // Healing spring
        var heal = Math.floor(Math.random() * 20) + 10;
        player.health += heal;
        printColor("You stumble upon a healing spring and recover " + heal + " health!", "1;32");
    } else if (eventRoll < 0.6) {
        // Gold find
        var gold = Math.floor(Math.random() * 100) + 20;
        player.gold += gold;
        printColor("You find a hidden stash and gain " + gold + " gold!", "1;33");
    } else if (eventRoll < 0.8) {
        // Enemy enrages
        enemy.strength += 2;
        printColor("The enemy becomes enraged and its strength increases!", "1;31");
    } else {
        // Player is inspired
        player.strength += 2;
        printColor("You feel a surge of courage! Your strength increases!", "1;36");
    }
}

// IGM Base Class
function IGM(name, description) {
    this.name = name;
    this.description = description;
}

IGM.prototype.enter = function(player) {
    throw new Error("This method should be overridden by subclasses");
};
// FortuneTeller IGM
function FortuneTellerIGM() {
    IGM.call(this, "Fortune Teller's Tent", "Seek your fortune... for a price!");
}
FortuneTellerIGM.prototype = Object.create(IGM.prototype);
FortuneTellerIGM.prototype.constructor = FortuneTellerIGM;

FortuneTellerIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;33");
    printColor("         FORTUNE TELLER'S TENT", "1;33");
    printColor(repeatChar("-", 50), "1;33");
    var cost = 40;
    printColor("The mysterious fortune teller will reveal your destiny for " + cost + " gold.", "1;32");
    printColor("Do you wish to proceed? [Y]es/[N]o", "1;36");
    var ans = console.getstr(1);
    if (!ans || ans.toUpperCase() !== "Y") {
        printColor("You leave the tent, your future still uncertain.", "1;34");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    if (player.gold < cost) {
        printColor("You do not have enough gold!", "1;31");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    player.gold -= cost;

    var fortunes = [
        function(p) { printColor("Beware the next castle you enter...", "1;31"); },
        function(p) { printColor("Good luck follows you! (+15 gold)", "1;32"); p.gold += 15; },
        function(p) { printColor("A lost friend will return. (+10 health)", "1;33"); p.health += 10; },
        function(p) { printColor("A shadowy figure steals from you. (-10 gold)", "1;31"); p.gold = Math.max(0, p.gold - 10); },
        function(p) { printColor("You will soon find a rare treasure.", "1;32"); if (!p.inventory) p.inventory = []; p.inventory.push("Mystery Scroll"); },
        function(p) { printColor("You feel stronger! (+1 strength)", "1;33"); p.strength += 1; },
        function(p) { printColor("You are cursed! (-5 health)", "1;31"); p.health = Math.max(1, p.health - 5); }
    ];
    var chosen = fortunes[Math.floor(Math.random() * fortunes.length)];
    chosen(player);

    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// AlchemistIGM
function AlchemistLabIGM() {
    IGM.call(this, "Alchemist's Lab", "Mix potions for random effects!");
}
AlchemistLabIGM.prototype = Object.create(IGM.prototype);
AlchemistLabIGM.prototype.constructor = AlchemistLabIGM;

AlchemistLabIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;35");
    printColor("                ALCHEMIST'S LAB", "1;35");
    printColor(repeatChar("-", 50), "1;35");
    printColor("The mad alchemist offers to mix you a potion for 25 gold. Proceed? [Y]es/[N]o", "1;36");
    var ans = console.getstr(1);
    if (!ans || ans.toUpperCase() !== "Y") {
        printColor("You step back from the bubbling cauldrons.", "1;34");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    if (player.gold < 25) {
        printColor("You do not have enough gold!", "1;31");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    player.gold -= 25;
    var effects = [
        function(p){ p.health += 18; printColor("You feel much better! (+18 health)", "1;32"); },
        function(p){ p.strength += 2; printColor("You feel powerful! (+2 strength)", "1;33"); },
        function(p){ p.gold += 30; printColor("Gold bubbles up from the flask! (+30 gold)", "1;32"); },
        function(p){ p.health = Math.max(1, p.health - 12); printColor("Uh oh! You feel sick. (-12 health)", "1;31"); },
        function(p){ printColor("Nothing seems to happen...", "1;34"); },
        function(p){ p.experience += 15; printColor("Wisdom floods your mind. (+15 exp)", "1;32"); }
    ];
    var chosen = effects[Math.floor(Math.random() * effects.length)];
    chosen(player);

    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// WishingWell IGM
function WishingWellIGM() {
    IGM.call(this, "Wishing Well", "Toss gold for a magical wish!");
}
WishingWellIGM.prototype = Object.create(IGM.prototype);
WishingWellIGM.prototype.constructor = WishingWellIGM;

WishingWellIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;34");
    printColor("                  WISHING WELL", "1;34");
    printColor(repeatChar("-", 50), "1;34");
    printColor("Toss in 20 gold and make a wish? [Y]es/[N]o", "1;36");
    var ans = console.getstr(1);
    if (!ans || ans.toUpperCase() !== "Y") {
        printColor("You decide not to tempt fate.", "1;33");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    if (player.gold < 20) {
        printColor("You don't have enough gold!", "1;31");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    player.gold -= 20;
    var wishes = [
        function(p){ p.gold += 50; printColor("A wind blows. +50 gold!", "1;33"); },
        function(p){ p.health += 10; printColor("You feel refreshed! +10 health.", "1;32"); },
        function(p){ p.strength += 1; printColor("You feel stronger! +1 strength.", "1;33"); },
        function(p){ p.experience += 8; printColor("You feel wiser. +8 experience.", "1;32"); },
        function(p){ printColor("Nothing happens. The magic is fickle...", "1;34"); },
        function(p){ var loss = 10 + Math.floor(Math.random() * 20); p.gold = Math.max(0, p.gold - loss); printColor("A cold breeze... you lose " + loss + " gold!", "1;31"); }
    ];
    var chosen = wishes[Math.floor(Math.random() * wishes.length)];
    chosen(player);
    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// ThievesGuild IGM
function ThievesGuildIGM() {
    IGM.call(this, "Thieves' Guild", "Risk a heist for gold!");
}
ThievesGuildIGM.prototype = Object.create(IGM.prototype);
ThievesGuildIGM.prototype.constructor = ThievesGuildIGM;

ThievesGuildIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;31");
    printColor("                 THIEVES' GUILD", "1;31");
    printColor(repeatChar("-", 50), "1;31");
    printColor("Attempt a risky heist? [Y]es/[N]o", "1;36");
    var ans = console.getstr(1);
    if (!ans || ans.toUpperCase() !== "Y") {
        printColor("You slip away quietly...", "1;34");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    var chance = Math.random();
    if (chance < 0.4) {
        var gold = 30 + Math.floor(Math.random() * 70);
        printColor("Success! You steal " + gold + " gold!", "1;33");
        player.gold += gold;
    } else {
        var penalty = 20 + Math.floor(Math.random() * 30);
        printColor("Caught! You pay a fine of " + penalty + " gold.", "1;31");
        player.gold = Math.max(0, player.gold - penalty);
    }
    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// Lost&Found IGM
function LostAndFoundIGM() {
    IGM.call(this, "Lost & Found", "Check for or turn in lost items.");
}
LostAndFoundIGM.prototype = Object.create(IGM.prototype);
LostAndFoundIGM.prototype.constructor = LostAndFoundIGM;

LostAndFoundIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;34");
    printColor("                  LOST & FOUND", "1;34");
    printColor(repeatChar("-", 50), "1;34");
    printColor("Do you want to [1] Check for lost items or [2] Turn in a found item? (3 to leave)", "1;36");
    var ans = console.getstr(1);
    if (ans === "1") {
        var foundItems = [
            { name: "Old Coin", reward: 10 },
            { name: "Silver Ring", reward: 25 },
            { name: "Dragon Scale", reward: 45 },
            { name: "Potion Vial", reward: 15 }
        ];
        var item = foundItems[Math.floor(Math.random() * foundItems.length)];
        printColor("You rummage and find a " + item.name + "!", "1;32");
        printColor("You turn it in and receive " + item.reward + " gold.", "1;33");
        player.gold += item.reward;
    } else if (ans === "2") {
        if (player.inventory && player.inventory.length > 0) {
            printColor("Your inventory:", "1;36");
            for (var i = 0; i < player.inventory.length; i++) {
                printColor("  (" + (i + 1) + ") " + player.inventory[i], "1;32");
            }
            printColor("  (0) Cancel", "1;31");
            console.print("Select an item to turn in: ");
            var sellStr = console.getstr(2);
            var idx = parseInt(sellStr);
            if (!isNaN(idx) && idx > 0 && idx <= player.inventory.length) {
                var chosen = player.inventory[idx - 1];
                var reward = 12 + Math.floor(Math.random() * 25);
                printColor("You turn in " + chosen + " and receive " + reward + " gold.", "1;33");
                player.gold += reward;
                player.inventory.splice(idx - 1, 1);
            }
        } else {
            printColor("You have nothing to turn in.", "1;31");
        }
    } else {
        printColor("You leave the Lost & Found.", "1;34");
        return;
    }
    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// PuzzelRoom IGM
function PuzzleRoomIGM() {
    IGM.call(this, "Puzzle Room", "Solve a riddle for a reward!");
}
PuzzleRoomIGM.prototype = Object.create(IGM.prototype);
PuzzleRoomIGM.prototype.constructor = PuzzleRoomIGM;

PuzzleRoomIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;36");
    printColor("                   PUZZLE ROOM", "1;36");
    printColor(repeatChar("-", 50), "1;36");

    // One puzzle per visit - can randomize more
    var riddles = [
        { q: "What walks on four legs in the morning, two legs at noon, and three legs in the evening?", a: "man" },
        { q: "I speak without a mouth and hear without ears. What am I?", a: "echo" },
        { q: "What has keys but can't open locks?", a: "piano" },
        { q: "I am not alive, but I can grow; I don't have lungs, but I need air. What am I?", a: "fire" }
    ];
    var puzzle = riddles[Math.floor(Math.random() * riddles.length)];
    printColor("Riddle:", "1;33");
    printColor(puzzle.q, "1;33");
    console.print("Your answer: ");
    var answer = console.getstr(20);
    if (answer && answer.trim().toLowerCase() === puzzle.a) {
        printColor("Correct! You receive a reward.", "1;32");
        var reward = Math.random();
        if (reward < 0.33) { player.gold += 30; printColor("+30 gold!", "1;33"); }
        else if (reward < 0.66) { player.health += 10; printColor("+10 health!", "1;33"); }
        else { player.experience += 10; printColor("+10 experience!", "1;33"); }
    } else {
        printColor("Incorrect. The spirits remain silent.", "1;31");
    }
    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// Arena IGM
function ArenaIGM() {
    IGM.call(this, "Dragon Arena", "Fight for glory and gold in the Arena!");
}
ArenaIGM.prototype = Object.create(IGM.prototype);
ArenaIGM.prototype.constructor = ArenaIGM;

ArenaIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;31");
    printColor("                  DRAGON ARENA", "1;31");
    printColor(repeatChar("-", 50), "1;31");
    printColor("Do you wish to face a random champion? [Y]es/[N]o", "1;36");
    var ans = console.getstr(1);
    if (!ans || ans.toUpperCase() !== "Y") {
        printColor("You leave the arena stands.", "1;34");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }
    var championNames = ["Fangor the Bold", "Mira the Swift", "Gronk the Destroyer", "Elira the Serpent", "Shadowclaw"];
    var champion = {
        name: championNames[Math.floor(Math.random() * championNames.length)],
        level: player.level + Math.floor(Math.random() * 4) - 2,
        health: 60 + player.level * 9 + Math.floor(Math.random() * 50),
        strength: 8 + player.level + Math.floor(Math.random() * 5)
    };
    printColor("You face " + champion.name + "!", "1;33");
    printColor("Level: " + champion.level + ", Health: " + champion.health + ", Strength: " + champion.strength, "1;32");
    console.print("Press Enter to begin battle...");
    console.getstr();

    // Simple battle loop
    while (champion.health > 0 && player.health > 0 && bbs.online && !js.terminated) {
        printColor("Your HP: " + player.health + "   " + champion.name + " HP: " + champion.health, "1;36");
        console.print("[A]ttack, [H]eal, [R]un: ");
        var action = console.getstr(1);
        if (!action) continue;
        action = action.toUpperCase();
        if (action === "A") {
            var dmg = Math.floor(Math.random() * (player.strength + 2)) + 5;
            champion.health -= dmg;
            printColor("You strike for " + dmg + " damage!", "1;32");
        } else if (action === "H") {
            if (player.gold >= 10) {
                player.gold -= 10;
                player.health += 18;
                printColor("You heal for 18 HP.", "1;32");
            } else {
                printColor("Not enough gold to heal!", "1;31");
            }
        } else if (action === "R") {
            printColor("You flee the arena!", "1;34");
            break;
        } else {
            printColor("Invalid action!", "1;31");
            continue;
        }
        if (champion.health > 0) {
            var champDmg = Math.floor(Math.random() * (champion.strength + 1)) + 4;
            player.health -= champDmg;
            printColor(champion.name + " hits you for " + champDmg + " damage!", "1;31");
        }
    }
    if (player.health <= 0) {
        printColor("You are defeated and carried from the arena!", "1;31");
        player.health = 1;
    } else if (champion.health <= 0) {
        var goldPrize = 70 + Math.floor(Math.random() * 60);
        printColor("Victory! You win " + goldPrize + " gold!", "1;33");
        player.gold += goldPrize;
        player.experience += 25;
    }
    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// Tavern IGM
function TavernIGM() {
    IGM.call(this, "Dragon Tavern", "Relax, hear rumors, or share a drink.");
}
TavernIGM.prototype = Object.create(IGM.prototype);
TavernIGM.prototype.constructor = TavernIGM;

TavernIGM.prototype.enter = function(player) {
    while (bbs.online && !js.terminated) {
        clearScreen();
        var menu =
            "\r\n" + repeatChar("-", 50) + "\r\n" +
            "                  Dragon Tavern\r\n" +
            repeatChar("-", 50) + "\r\n" +
            "  (1) Hear a Rumor\r\n" +
            "  (2) Tell a Joke\r\n" +
            "  (3) Have a Drink (Cost 15 gold)\r\n" +
            "  (4) Leave Tavern\r\n" +
            repeatChar("-", 50) + "\r\n";
        console.print(menu);
        var choice = console.getstr(1);

        if (choice === '1') {
            printColor("You overhear: 'The castle is haunted by a golden ghost!'", "1;33");
        } else if (choice === '2') {
            printColor("You tell a joke. Everyone groans.", "1;32");
        } else if (choice === '3') {
            if (player.gold >= 15) {
                player.gold -= 15;
                player.health += 5;
                printColor("You enjoy a drink and gain 5 health.", "1;32");
            } else {
                printColor("Not enough gold!", "1;31");
            }
        } else if (choice === '4') {
            printColor("You leave the tavern.", "1;32");
            return;
        } else {
            printColor("Invalid choice!", "1;31");
        }
        console.print("Press Enter to continue...");
        console.getstr();
    }
};
// Market IGM
function MarketIGM() {
    IGM.call(this, "Dragon Market", "Buy and sell rare and useful items!");
}
MarketIGM.prototype = Object.create(IGM.prototype);
MarketIGM.prototype.constructor = MarketIGM;

MarketIGM.prototype.enter = function(player) {
    var itemsForSale = [
        {name: "Healing Potion", price: 50, effect: function(p) { p.health += 30; printColor("You feel rejuvenated! (+30 health)", "1;32"); }},
        {name: "Strength Elixir", price: 120, effect: function(p) { p.strength += 3; printColor("You feel stronger! (+3 strength)", "1;33"); }},
        {name: "Mystery Gem", price: 200, effect: function(p) {
            var rand = Math.random();
            if (rand < 0.5) {
                var gold = Math.floor(Math.random() * 200) + 50;
                p.gold += gold;
                printColor("The gem shimmers and you find " + gold + " gold inside!", "1;33");
            } else {
                p.health += 10;
                p.strength += 1;
                printColor("The gem pulses with energy (+10 health, +1 strength)", "1;32");
            }
        }}
    ];

    while (bbs.online && !js.terminated) {
        clearScreen();
        printColor("\n" + repeatChar("-", 50), "1;34");
        printColor("          DRAGON MARKET", "1;34");
        printColor(repeatChar("-", 50), "1;34");
        printColor("Gold on hand: " + player.gold.toLocaleString() + "\n", "1;33");
        printColor("Items for sale:", "1;32");
        for (var i = 0; i < itemsForSale.length; i++) {
            printColor("  (" + (i + 1) + ") " + itemsForSale[i].name + " - " + itemsForSale[i].price + " gold", "1;32");
        }
        printColor("  (" + (itemsForSale.length + 1) + ") Sell an item from your inventory", "1;36");
        printColor("  (" + (itemsForSale.length + 2) + ") Leave the market", "1;31");
        printColor(repeatChar("-", 50), "1;34");
        console.print("Choose an option: ");
        var choiceStr = console.getstr(1);
        var choice = parseInt(choiceStr);

        if (isNaN(choice) || choice < 1 || choice > itemsForSale.length + 2) {
            printColor("Invalid choice!", "1;31");
            continue;
        }
        if (choice >= 1 && choice <= itemsForSale.length) {
            var item = itemsForSale[choice - 1];
            if (player.gold >= item.price) {
                player.gold -= item.price;
                if (!player.inventory) player.inventory = [];
                player.inventory.push(item.name);
                printColor("You bought a " + item.name + "!", "1;32");
                // Auto-use certain items on purchase (optional)
                if (item.effect) item.effect(player);
            } else {
                printColor("You don't have enough gold!", "1;31");
            }
        } else if (choice === itemsForSale.length + 1) {
            // Sell from inventory
            if (!player.inventory || player.inventory.length === 0) {
                printColor("You have no items to sell!", "1;31");
                console.print("Press Enter to continue...");
                console.getstr();
                continue;
            }
            printColor("Your inventory:", "1;36");
            for (var j = 0; j < player.inventory.length; j++) {
                printColor("  (" + (j + 1) + ") " + player.inventory[j], "1;32");
            }
            printColor("  (0) Cancel", "1;31");
            console.print("Select an item to sell: ");
            var sellStr = console.getstr(2);
            var sellIdx = parseInt(sellStr);
            if (isNaN(sellIdx) || sellIdx < 0 || sellIdx > player.inventory.length) {
                printColor("Invalid choice!", "1;31");
                continue;
            }
            if (sellIdx === 0) continue;
            var sellItem = player.inventory[sellIdx - 1];
            var sellPrice = 0;
            // Set a sell price based on item type
            for (var k = 0; k < itemsForSale.length; k++) {
                if (itemsForSale[k].name === sellItem) {
                    sellPrice = Math.floor(itemsForSale[k].price * 0.7); // 70% of buy price
                    break;
                }
            }
            if (sellPrice === 0) sellPrice = 20; // Default for unknown items
            player.gold += sellPrice;
            printColor("You sold " + sellItem + " for " + sellPrice + " gold.", "1;33");
            player.inventory.splice(sellIdx - 1, 1);
        } else if (choice === itemsForSale.length + 2) {
            printColor("You leave the Dragon Market.", "1;32");
            player.saveGame();
            break;
        }
        player.saveGame();
        console.print("Press Enter to continue...");
        console.getstr();
    }
};
// Adoption IGM
function BabyDragonAdoptionIGM() {
    IGM.call(this, "Baby Dragon Adoption", "Adopt a magical baby dragon companion!");
}
BabyDragonAdoptionIGM.prototype = Object.create(IGM.prototype);
BabyDragonAdoptionIGM.prototype.constructor = BabyDragonAdoptionIGM;

BabyDragonAdoptionIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;34");
    printColor("         BABY DRAGON ADOPTION CENTER", "1;34");
    printColor(repeatChar("-", 50), "1;34");

    if (player.pet) {
        printColor("You already have a pet: " + player.pet.name, "1;33");
        printColor("You must release your current pet before adopting another.", "1;31");
        console.print("Press Enter to return...");
        console.getstr();
        return;
    }

    var babyDragons = [
        {name: "Ruby", color: "Red", damage: 12, ability: "heal"},
        {name: "Ember", color: "Orange", damage: 14, ability: "burn"},
        {name: "Mist", color: "Blue", damage: 10, ability: "dodge"},
        {name: "Thorn", color: "Green", damage: 11, ability: "poison"},
        {name: "Shadow", color: "Black", damage: 13, ability: "stealth"}
    ];

    printColor("Available baby dragons for adoption:", "1;32");
    for (var i = 0; i < babyDragons.length; i++) {
        printColor("  (" + (i + 1) + ") " + babyDragons[i].name + " (" + babyDragons[i].color + 
            ") - Damage: " + babyDragons[i].damage + ", Special: " + babyDragons[i].ability, "1;36");
    }
    printColor("  (0) Return to Inn", "1;31");
    printColor(repeatChar("-", 50), "1;34");
    console.print("Select a dragon to adopt (1-" + babyDragons.length + "): ");
    var choiceStr = console.getstr(1);
    var choice = parseInt(choiceStr);
    if (isNaN(choice) || choice < 0 || choice > babyDragons.length) {
        printColor("Invalid choice!", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    if (choice === 0) return;

    var selected = babyDragons[choice - 1];
    player.pet = {name: selected.name + " the " + selected.color + " Dragon", damage: selected.damage, ability: selected.ability};
    printColor("Congratulations! You adopted " + player.pet.name + "!", "1;32");
    printColor("It will now help you in battle with its ability: " + selected.ability, "1;33");
    player.saveGame();
    console.print("Press Enter to return...");
    console.getstr();
};
// Graveyard IGM
function GraveyardIGM() {
    IGM.call(this, "Graveyard", "Visit the resting place of fallen dragons.");
}
GraveyardIGM.prototype = Object.create(IGM.prototype);
GraveyardIGM.prototype.constructor = GraveyardIGM;

GraveyardIGM.prototype.enter = function(player) {
    clearScreen();
    printColor("\n" + repeatChar("-", 50), "1;34");
    printColor("                THE GRAVEYARD", "1;34");
    printColor(repeatChar("-", 50), "1;34");
    printColor("Here lie the names of dragons who have fallen in battle.", "1;32");

    // List dead players from save files
    var fallen = [];
    var saveFiles = directory(SAVE_DIR + "*.json");
    if (saveFiles) {
        for (var i = 0; i < saveFiles.length; i++) {
            var filename = saveFiles[i];
            var p = Player.loadGame(file_getname(filename).replace('.json',''));
            if (p && p.health <= 0) {
                fallen.push(p.name + " - " + (p.chosenClass || "Unknown Class") + " (Level " + (p.level || "?") + ")");
            }
        }
    }
    if (fallen.length === 0) {
        printColor("No dragons rest here... yet.", "1;33");
    } else {
        for (var j = 0; j < fallen.length && j < 20; j++) {
            printColor((j+1) + ". " + fallen[j], "1;31");
        }
    }
    printColor(repeatChar("-", 50), "1;34");
    console.print("Press Enter to return...");
    console.getstr();
};

// Casino IGM
function CasinoIGM() {
    IGM.call(this, "Dragon Casino", "Try your luck at various games of chance!");
}

CasinoIGM.prototype = Object.create(IGM.prototype);
CasinoIGM.prototype.constructor = CasinoIGM;

CasinoIGM.prototype.enter = function(player) {
    while (bbs.online && !js.terminated) {
        clearScreen();
        var menu = format(
            "\r\n\x01b" + repeatChar("-", 50) + "\x01n\r\n" +
            "                    \x01r\x01hDragon Casino IGM\x01n\r\n" +
            "\x01b" + repeatChar("-", 50) + "\x01n\r\n" +
            "  \x01w(1)\x01n \x01gSlot Machine   \x01w(Bet 100-1000 gold)\x01n\r\n" +
            "  \x01w(2)\x01n \x01gRoulette       \x01w(Bet 500-5000 gold)\x01n\r\n" +
            "  \x01w(3)\x01n \x01gDragon Dice    \x01w(Bet 200-2000 gold)\x01n\r\n" +
            "  \x01w(4)\x01n \x01gCheck Balance  \x01w(Gold: %s)\x01n\r\n" +
            "  \x01w(5)\x01n \x01gLeave Casino\x01n\r\n" +
            "\x01b" + repeatChar("-", 50) + "\x01n\r\n",
            player.gold.toLocaleString()
        );
        
        console.print(menu);
        console.print("\x01gChoose your game: \x01n");
        var choice = console.getstr(1);
        
        if (!choice) continue;
        
        switch(choice) {
            case '1':
                this._playSlots(player);
                break;
            case '2':
                this._playRoulette(player);
                break;
            case '3':
                this._playDice(player);
                break;
            case '4':
                printColor("Your current balance is " + player.gold.toLocaleString() + " gold.", "1;32");
                console.print("Press Enter to continue...");
                console.getstr();
                break;
            case '5':
                printColor("Thank you for visiting the Dragon Casino!", "1;32");
                return;
            default:
                printColor("Invalid choice!", "1;31");
        }
    }
};

CasinoIGM.prototype._getBet = function(player, minBet, maxBet) {
    while (bbs.online && !js.terminated) {
        if (player.gold < minBet) {
            printColor("You don't have enough gold for minimum bet! Minimum needed: " + minBet.toLocaleString(), "1;31");
            printColor("Your current gold: " + player.gold.toLocaleString(), "1;31");
            console.print("Press Enter to return...");
            console.getstr();
            return null;
        }
        
        console.print("Enter bet amount (" + minBet + "-" + maxBet + " gold) or 'X' to exit: ");
        var inputStr = console.getstr(10);
        
        if (!inputStr || inputStr.toUpperCase() === 'X') {
            return null;
        }
        
        var bet = parseInt(inputStr);
        if (isNaN(bet)) {
            printColor("Invalid bet amount!", "1;31");
            continue;
        }
        
        if (bet >= minBet && bet <= maxBet) {
            if (bet <= player.gold) {
                return bet;
            } else {
                printColor("You don't have enough gold!", "1;31");
                printColor("Your current gold: " + player.gold.toLocaleString(), "1;31");
            }
        } else {
            printColor("Bet must be between " + minBet + " and " + maxBet + " gold.", "1;31");
        }
    }
    return null;
};

CasinoIGM.prototype._playSlots = function(player) {
    var symbols = ["D", "G", "C", "S", "A"];  // Dragon, Gold, Crown, Sword, Armor
    var bet = this._getBet(player, 100, 1000);
    
    if (bet === null) return;
    
    player.gold -= bet;
    printColor("\nSpinning the slots...", "1;35");
    console.print("Press Enter to stop the reels...");
    console.getstr();
    
    var reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    printColor(reels.join(" "), "1;33");
    
    if (reels[0] === reels[1] && reels[1] === reels[2]) {  // All symbols match
        var winnings = bet * 5;
        printColor("JACKPOT! You won " + winnings.toLocaleString() + " gold!", "1;32");
        player.gold += winnings;
    } else if (reels[0] === reels[1] || reels[1] === reels[2]) {  // Two symbols match
        var winnings = bet * 2;
        printColor("Winner! You won " + winnings.toLocaleString() + " gold!", "1;32");
        player.gold += winnings;
    } else {
        printColor("Better luck next time!", "1;31");
    }
    
    player.saveGame();
    console.print("Press Enter to continue...");
    console.getstr();
};

CasinoIGM.prototype._playRoulette = function(player) {
    var bet = this._getBet(player, 500, 5000);
    if (bet === null) return;
    
    printColor("\nRoulette Options:", "1;34");
    printColor("1. Red or Black (2x payout)", "1;32");
    printColor("2. Single Number (35x payout)", "1;32");
    printColor("3. Even or Odd (2x payout)", "1;32");
    
    console.print("Choose your bet type: ");
    var betType = console.getstr(1);
    if (!betType) return;
    
    if (betType === '1') {
        console.print("Choose [R]ed or [B]lack: ");
        var choice = console.getstr(1);
        if (!choice) return;
        choice = choice.toUpperCase();
        if (choice === 'R' || choice === 'B') {
            player.gold -= bet;
            var result = Math.random() < 0.5 ? 'R' : 'B';
            if (choice === result) {
                var winnings = bet * 2;
                printColor("Winner! You won " + winnings.toLocaleString() + " gold!", "1;32");
                player.gold += winnings;
            } else {
                printColor("Better luck next time!", "1;31");
            }
        }
    } else if (betType === '2') {
        console.print("Choose a number (0-36): ");
        var numberStr = console.getstr(2);
        if (!numberStr) return;
        var number = parseInt(numberStr);
        if (!isNaN(number) && number >= 0 && number <= 36) {
            player.gold -= bet;
            var result = Math.floor(Math.random() * 37);
            if (number === result) {
                var winnings = bet * 35;
                printColor("JACKPOT! You won " + winnings.toLocaleString() + " gold!", "1;32");
                player.gold += winnings;
            } else {
                printColor("Better luck next time! Number was: " + result, "1;31");
            }
        } else {
            printColor("Invalid number!", "1;31");
        }
    } else if (betType === '3') {
        console.print("Choose [E]ven or [O]dd: ");
        var choice = console.getstr(1);
        if (!choice) return;
        choice = choice.toUpperCase();
        if (choice === 'E' || choice === 'O') {
            player.gold -= bet;
            var result = Math.floor(Math.random() * 36) + 1;
            if ((result % 2 === 0 && choice === 'E') || (result % 2 === 1 && choice === 'O')) {
                var winnings = bet * 2;
                printColor("Winner! You won " + winnings.toLocaleString() + " gold!", "1;32");
                player.gold += winnings;
            } else {
                printColor("Better luck next time! Number was: " + result, "1;31");
            }
        }
    }
    
    player.saveGame();
    console.print("Press Enter to continue...");
    console.getstr();
};

CasinoIGM.prototype._playDice = function(player) {
    var bet = this._getBet(player, 200, 2000);
    if (bet === null) return;
    
    printColor("\nDragon Dice - Roll two dice and beat the house!", "1;34");
    printColor("7 or 11 on first roll: Win 2x", "1;32");
    printColor("2, 3, or 12 on first roll: Lose", "1;31");
    printColor("Other numbers: That's your point, roll it again to win!", "1;32");
    
    console.print("\nPress Enter to roll the dice...");
    console.getstr();
    
    player.gold -= bet;
    var dice1 = Math.floor(Math.random() * 6) + 1;
    var dice2 = Math.floor(Math.random() * 6) + 1;
    var total = dice1 + dice2;
    
    printColor("You rolled: " + dice1 + " + " + dice2 + " = " + total, "1;33");
    
    if (total === 7 || total === 11) {
        var winnings = bet * 2;
        printColor("Winner! You won " + winnings.toLocaleString() + " gold!", "1;32");
        player.gold += winnings;
    } else if (total === 2 || total === 3 || total === 12) {
        printColor("Craps! Better luck next time!", "1;31");
    } else {
        var point = total;
        printColor("Your point is " + point + ". Roll again!", "1;34");
        while (bbs.online && !js.terminated) {
            console.print("\nPress Enter to roll again...");
            console.getstr();
            dice1 = Math.floor(Math.random() * 6) + 1;
            dice2 = Math.floor(Math.random() * 6) + 1;
            var newTotal = dice1 + dice2;
            printColor("You rolled: " + dice1 + " + " + dice2 + " = " + newTotal, "1;33");
            
            if (newTotal === point) {
                var winnings = bet * 2;
                printColor("Winner! You made your point! You won " + winnings.toLocaleString() + " gold!", "1;32");
                player.gold += winnings;
                break;
            } else if (newTotal === 7) {
                printColor("Seven out! Better luck next time!", "1;31");
                break;
            }
        }
    }
    
    player.saveGame();
    console.print("Press Enter to continue...");
    console.getstr();
};

function showHallOfHeroes() {
    var heroes = [];
    var saveFiles = directory(SAVE_DIR + "*.json");
    
    if (saveFiles) {
        for (var i = 0; i < saveFiles.length; i++) {
            var filename = saveFiles[i];
            var player = Player.loadGame(file_getname(filename).replace('.json', ''));
            if (player && player.bossVictories > 0) {
                heroes.push({
                    name: player.name,
                    victories: player.bossVictories,
                    points: player.heroPoints,
                    title: player.heroTitle,
                    round: player.currentRound
                });
            }
        }
    }
    
    // Sort by hero points (descending)
    heroes.sort(function(a, b) { return b.points - a.points; });
    
    clearScreen();
    printColor("*********************************************************", "1;33");
    printColor("                 HALL OF HEROES", "1;33");
    printColor("*********************************************************", "1;33");
    printColor("", "1;37");
    
    if (heroes.length === 0) {
        printColor("No heroes have yet defeated the Ancient Dragon Lord...", "1;31");
        printColor("Will you be the first legendary champion?", "1;33");
    } else {
        for (var i = 0; i < Math.min(heroes.length, 10); i++) {
            var hero = heroes[i];
            var rank = i + 1;
            var rankStr = rank + ".";
            if (rank === 1) rankStr = "1st";
            else if (rank === 2) rankStr = "2nd";
            else if (rank === 3) rankStr = "3rd";
            
            printColor(rankStr + " " + hero.name + " - " + hero.title, "1;32");
            printColor("    Boss Victories: " + hero.victories + " | Hero Points: " + hero.points + " | Round: " + hero.round, "1;36");
            
            if (hero.points >= 1000) {
                printColor("    *** LEGENDARY HERO STATUS ***", "1;33");
            }
            printColor("", "1;37");
        }
    }
    
    console.print("Press Enter to continue...");
    console.getstr();
}

// Death and Resurrection System
Player.prototype.isDead = function() {
    return this.health <= 0;
};

Player.prototype.handlePlayerDeath = function() {
    printColor("\n" + repeatChar("=", 50), "1;31");
    printColor("YOU HAVE DIED!", "1;31");
    printColor(repeatChar("=", 50), "1;31");
    
    var currentDate = getDateString();
    if (this.lastRestrictionDate !== currentDate) {
        this.dailyResurrections = 0;
        this.lastRestrictionDate = currentDate;
    }
    
    this.health = 0;
    this.saveGame();
    
    return this.offerResurrection();
};

Player.prototype.offerResurrection = function() {
    var resurrectionsLeft = 3 - this.dailyResurrections;
    
    if (resurrectionsLeft <= 0) {
        printColor("You have no resurrections left for today.", "1;31");
        printColor("You are dead. Game over.", "1;31");
        console.print("Press Enter to exit...");
        console.getstr();
        return false; // Player is permanently dead for today
    }
    
    printColor("You have " + resurrectionsLeft + " resurrection(s) remaining today.", "1;33");
    console.print("Do you want to use a resurrection? [Y]es or [N]o: ");
    var choice = console.getstr(1);
    
    if (choice && choice.toUpperCase() === 'Y') {
        this.dailyResurrections++;
        this.health = Math.floor((100 + this.level * 10 + this.permanentBonuses.healthBonus) * 0.5); // Resurrect with 50% health
        this.saveGame();
        
        printColor("You have been resurrected with " + this.health + " health!", "1;32");
        printColor("Resurrections remaining today: " + (3 - this.dailyResurrections), "1;33");
        console.print("Press Enter to continue...");
        console.getstr();
        return true; // Player resurrected successfully
    } else {
        printColor("You chose not to resurrect.", "1;31");
        printColor("You are dead. Game over.", "1;31");
        console.print("Press Enter to exit...");
        console.getstr();
        return false; // Player chose to stay dead
    }
};

Player.prototype.checkDeadPlayerOnEntry = function() {
    if (this.isDead()) {
        var currentDate = getDateString();
        if (this.lastRestrictionDate !== currentDate) {
            // New day, reset resurrections and health
            this.dailyResurrections = 0;
            this.lastRestrictionDate = currentDate;
            this.health = 100 + this.level * 10 + this.permanentBonuses.healthBonus;
            this.saveGame();
            printColor("A new day has dawned! You have been restored to life!", "1;32");
            return true; // Player can continue
        } else {
            // Same day, still dead
            printColor("You are still dead from your previous session.", "1;31");
            return this.offerResurrection();
        }
    }
    return true; // Player is alive
};

// IGMs
var casinoIGM = new CasinoIGM();
var tavernIGM = new TavernIGM();
var marketIGM = new MarketIGM();
var babyDragonAdoptionIGM = new BabyDragonAdoptionIGM();
var graveyardIGM = new GraveyardIGM();
var fortuneTellerIGM = new FortuneTellerIGM();
var arenaIGM = new ArenaIGM();
var puzzleRoomIGM = new PuzzleRoomIGM();
var alchemistLabIGM = new AlchemistLabIGM();
var lostAndFoundIGM = new LostAndFoundIGM();
var thievesGuildIGM = new ThievesGuildIGM();
var wishingWellIGM = new WishingWellIGM();
var igms = [arenaIGM, graveyardIGM, casinoIGM, tavernIGM, marketIGM, wishingWellIGM, puzzleRoomIGM, alchemistLabIGM, fortuneTellerIGM, thievesGuildIGM, lostAndFoundIGM, babyDragonAdoptionIGM];

// Player Class
function Player(name, chosenClass) {
    this.name = name;
    this.chosenClass = chosenClass || this.selectClass();
    this.level = 1;
    this.experience = 0;
    this.nextLevelExp = 100;
    this.medals = 0;
    this.gold = 100;
    this.bankBalance = 0;
    this.masteredClasses = [];
    this.topDragon = false;
    this.lastIgmVisit = null;
    this.health = 100;
    this.strength = 10;
    this.inventory = [];
    this.skills = ['Heal', 'Fireball', 'Defend'];
    this.statusEffects = []; // [{type: 'poison', turns: 2, amount: 5}]
    this.achievements = [];
    this.pet = null;
    this.winStreak = 0;
    this.isOnline = false;
    this.specialAttacksUsed = 0;
    this.lastMysticMountainsVisit = null;
    this.specialFightingAreaAccesses = 0;
    this.lastSpecialFightingAreaAccess = null;
    this.dailyFights = 0;
    this.lastFightDate = null;
    this.dailyResurrections = 0;
    this.lastRestrictionDate = null;
    this.dailyPvpFights = 0;
    this.lastPvpFightDate = null;
    this.retroactiveMasteryChecked = false;
    this.bossVictories = 0;
    this.heroPoints = 0;
    this.currentRound = 1;
    this.heroTitle = "";
    this.lastBossFightDate = null;
    this.dailyPvpTargets = {};
    this.lastPvpTargetReset = null;
    this.permanentBonuses = {
        healthBonus: 0,
        strengthBonus: 0,
        experienceMultiplier: 1.0,
        goldMultiplier: 1.0
    };
}

Player.prototype.selectClass = function() {
    printColor("\nChoose your class:", "1;34");
    for (var i = 0; i < CLASSES.length; i++) {
        printColor((i + 1) + ". " + CLASSES[i], "1;32");
    }
    
    while (bbs.online && !js.terminated) {
        console.print("\nEnter the number of your chosen class (1-" + CLASSES.length + "): ");
        var choiceStr = console.getstr(1);
        if (!choiceStr) {
            printColor("Invalid input. Please enter a number.", "1;31");
            continue;
        }
        var choice = parseInt(choiceStr);
        if (!isNaN(choice) && choice >= 1 && choice <= CLASSES.length) {
            return CLASSES[choice - 1];
        } else {
            printColor("Invalid choice. Please choose between 1 and " + CLASSES.length + ".", "1;31");
        }
    }
    return CLASSES[0]; // Default fallback
};

Player.prototype.resetHealth = function() {
    this.health = 100 + this.level * 10 + this.permanentBonuses.healthBonus;
};

Player.prototype.saveGame = function() {
    ensureSaveDir();
    var filePath = SAVE_DIR + this.name + ".json";
    var file = new File(filePath);
    if (file.open("w")) {
        file.write(JSON.stringify(this, null, 2));
        file.close();
    }
};

Player.loadGame = function(name) {
    var filePath = SAVE_DIR + name + ".json";
    if (!file_exists(filePath)) return null;
    
    var file = new File(filePath);
    if (!file.open("r")) return null;
    
    try {
        var data = JSON.parse(file.readAll().join(""));
        file.close();
        
        var player = new Player(data.name, data.chosenClass);
        // Copy all properties
        for (var prop in data) {
            if (data.hasOwnProperty(prop)) {
                player[prop] = data[prop];
            }
        }
        
        // Ensure all new properties exist (backward compatibility)
        var defaults = {
            bankBalance: 0, specialAttacksUsed: 0, lastMysticMountainsVisit: null,
            specialFightingAreaAccesses: 0, lastSpecialFightingAreaAccess: null,
            dailyFights: 0, lastFightDate: null, dailyResurrections: 0, 
            lastRestrictionDate: null, dailyPvpFights: 0, lastPvpFightDate: null,
            retroactiveMasteryChecked: false, bossVictories: 0, heroPoints: 0,
            currentRound: 1, heroTitle: "", lastBossFightDate: null,
            dailyPvpTargets: {}, lastPvpTargetReset: null,
            permanentBonuses: { healthBonus: 0, strengthBonus: 0, experienceMultiplier: 1.0, goldMultiplier: 1.0 }
        };
        
        for (var prop in defaults) {
            if (typeof player[prop] === 'undefined') {
                player[prop] = defaults[prop];
            }
        }
        
        return player;
    } catch (e) {
        file.close();
        printColor("Failed to load save file. Starting new game.", "1;31");
        return null;
    }
};

Player.prototype.gainMedals = function(amount) {
    this.medals += amount;
    printColor(this.name + " gained " + amount + " medals.", "1;32");
};

Player.prototype.gainExperience = function(amount) {
    this.experience += amount;
    printColor(this.name + " gained " + amount + " experience points.", "1;32");
    while (this.experience >= this.nextLevelExp) {
        this.levelUp();
    }
};

Player.prototype.levelUp = function() {
    this.experience -= this.nextLevelExp;
    this.level += 1;

    if (this.level >= 200) {
        printColor("You have reached the maximum level! Ascend for extra bonuses!", "1;33");
    }

    this.nextLevelExp = Math.floor(this.nextLevelExp * 1.5);
    if (this.nextLevelExp > 2000000000) this.nextLevelExp = 2000000000; // 2 billion max, or pick a sensible cap
    this.health = 100 + this.level * 10 + this.permanentBonuses.healthBonus;
    this.strength += 2;
    printColor(this.name + " leveled up! Now at level " + this.level + ".", "1;32");

    // Check for class mastery at level 10
    if (this.level >= 10) {
        printColor("You have reached maximum level with " + this.chosenClass + "! Time to master this class!", "1;32");
        this.masterClass();
    }
};

Player.prototype.masterClass = function() {
    // Check if this class is already mastered
    if (this.masteredClasses.indexOf(this.chosenClass) === -1) {
        // Add current class to mastered classes
        this.masteredClasses.push(this.chosenClass);
        printColor(this.name + " has mastered the " + this.chosenClass + " class!", "1;32");
        
        // Check if all classes are mastered
        if (this.masteredClasses.length === CLASSES.length) {
            this.topDragon = true;
            printColor("Congratulations! " + this.name + " is now the Top Dragon!", "1;32");
            printColor("You have mastered all classes and achieved the ultimate status!", "1;32");
            console.print("Press Enter to continue...");
            console.getstr();
        } else {
            // Show what you've accomplished and choose new class
            printColor("Classes mastered so far: " + this.masteredClasses.join(", "), "1;33");
            printColor("You can now choose a new class to master!", "1;32");
            console.print("Press Enter to choose your new class...");
            console.getstr();
            this.chooseNewClass();
        }
    } else {
        printColor("You have already mastered the " + this.chosenClass + " class!", "1;33");
    }
    
    // Save the game after mastering
    this.saveGame();
};

Player.prototype.chooseNewClass = function() {
    var availableClasses = [];
    for (var i = 0; i < CLASSES.length; i++) {
        if (this.masteredClasses.indexOf(CLASSES[i]) === -1) {
            availableClasses.push(CLASSES[i]);
        }
    }
    
    if (availableClasses.length === 0) {
        printColor("You have mastered all classes! You are the Top Dragon!", "1;32");
        this.topDragon = true;
        return;
    }
    
    clearScreen();
    printColor("\n" + repeatChar("=", 50), "1;34");
    printColor("CHOOSE YOUR NEW CLASS TO MASTER", "1;34");
    printColor(repeatChar("=", 50), "1;34");
    printColor("Classes you have mastered: " + this.masteredClasses.join(", "), "1;32");
    printColor("\nAvailable classes to master:", "1;33");
    
    for (var i = 0; i < availableClasses.length; i++) {
        printColor((i + 1) + ". " + availableClasses[i], "1;32");
    }
    printColor(repeatChar("=", 50), "1;34");
    
    while (bbs.online && !js.terminated) {
        console.print("\nEnter the number of your chosen class (1-" + availableClasses.length + "): ");
        var choiceStr = console.getstr(1);
        var choice = parseInt(choiceStr);
        
        if (!isNaN(choice) && choice >= 1 && choice <= availableClasses.length) {
            var newClass = availableClasses[choice - 1];
            this.chosenClass = newClass;
            this.level = 1;
            this.experience = 0;
            this.nextLevelExp = 100;
            this.health = 110 + this.permanentBonuses.healthBonus;
            this.specialAttacksUsed = 0; // Reset daily special attacks for new class
            
            printColor("\nYou are now a level 1 " + this.chosenClass + "!", "1;32");
            printColor("Work your way to level 10 to master this class too!", "1;33");
            console.print("Press Enter to continue...");
            console.getstr();
            return;
        } else {
            printColor("Invalid choice. Please choose between 1 and " + availableClasses.length + ".", "1;31");
        }
    }
};

Player.prototype.checkRetroactiveMastery = function() {
    // Only run this check once per character
    if (this.retroactiveMasteryChecked) {
        return;
    }
    
    // If character is above level 10 but has no mastered classes, fix it
    if (this.level >= 10 && this.masteredClasses.length === 0) {
        printColor("=== RETROACTIVE CLASS MASTERY CHECK ===", "1;33");
        printColor("Your character has reached a high level but hasn't properly", "1;33");
        printColor("registered class mastery. Fixing this now...", "1;33");
        
        // Calculate how many classes should be mastered based on level
        var classesToMaster = Math.min(Math.floor(this.level / 10), CLASSES.length);
        
        // Start with current class
        if (this.masteredClasses.indexOf(this.chosenClass) === -1) {
            this.masteredClasses.push(this.chosenClass);
            printColor("Mastered: " + this.chosenClass, "1;32");
        }
        
        // Add additional classes if level warrants it
        for (var i = 1; i < classesToMaster; i++) {
            for (var j = 0; j < CLASSES.length; j++) {
                if (this.masteredClasses.indexOf(CLASSES[j]) === -1) {
                    this.masteredClasses.push(CLASSES[j]);
                    printColor("Mastered: " + CLASSES[j], "1;32");
                    break;
                }
            }
        }
        
        // Check for Top Dragon status
        if (this.masteredClasses.length >= CLASSES.length) {
            this.topDragon = true;
            printColor("[DrAgOn] TOP DRAGON STATUS ACHIEVED! [DrAgOn]", "1;33");
        }
        
        printColor("=== MASTERY CHECK COMPLETE ===", "1;33");
        this.retroactiveMasteryChecked = true;
        this.saveGame();
        
        console.print("Press Enter to continue...");
        console.getstr();
    } else {
        // Mark as checked even if no fix was needed
        this.retroactiveMasteryChecked = true;
        this.saveGame();
    }
};

Player.prototype.attack = function(enemy) {
    // Miss chance
    if (Math.random() < 0.05) {
        printColor("You swing and miss!", "1;36");
        return 0;
    }
    // Crit chance
    var crit = Math.random() < 0.1;
    var baseDamage = Math.floor(Math.random() * (this.strength + this.permanentBonuses.strengthBonus)) + 1;
    var levelBonus = this.level * 0.5;
    var totalDamage = Math.floor(baseDamage + levelBonus);
    if (crit) {
        totalDamage *= 2;
        printColor("Critical hit!", "1;33");
    }
    enemy.health -= totalDamage;

    // Chance to inflict status effect (if you want)
    if (Math.random() < 0.05) {
        enemy.statusEffects.push({type: 'poison', turns: 3, amount: 5});
        printColor("You poisoned the enemy!", "1;32");
    }

    return totalDamage;
};

Player.prototype.specialAttack = function(enemy) {
    if (this.specialAttacksUsed < this.level * 2) {
        var totalStrength = this.strength + this.permanentBonuses.strengthBonus;
        var damage = Math.floor(Math.random() * totalStrength) + totalStrength;
        enemy.health -= damage;
        this.specialAttacksUsed += 1;
        return damage;
    } else {
        printColor("No special attacks remaining for today.", "1;31");
        return 0;
    }
};

Player.prototype.isAlive = function() {
    return this.health > 0;
};

Player.prototype.heal = function(amount) {
    if (this.gold >= amount && amount > 0) {
        this.gold -= amount;
        this.health += amount;
        var maxHealth = 100 + this.level * 10 + this.permanentBonuses.healthBonus;
        this.health = Math.min(this.health, maxHealth);
        printColor("You healed for " + amount + " hitpoints. Health: " + this.health + ", Gold: " + this.gold, "1;32");
    } else {
        printColor("Not enough gold to heal or invalid amount!", "1;31");
    }
};

// Enemy Class
function Enemy(level) {
    var names = [
        "Dragon Sting", "John the Golden Dragon", "Dragon Naomi", "Dragon Pete", "Death Dragon",
        "Hairy Monster", "Evil Troll", "Ghost", "Skunk", "Buffalo", "Zombie",
        "Vampire", "Bat", "Rugaru", "ShapeShifter", "Vampire xbit", "Dragon Cozmo", "Dragon Code", "Dragon C64"
    ];
    this.name = names[Math.floor(Math.random() * names.length)];
    this.level = level;
    this.health = level * 10;
    this.strength = level * 2;
    this.statusEffects = [];
    // Randomly assign special type
    var types = [null, 'poisonous', 'stunning', 'burning'];
    this.specialType = types[Math.floor(Math.random() * types.length)];
}

Enemy.prototype.resetHealth = function() {
    this.health = this.level * 10;
};

Enemy.prototype.attack = function(player) {
    if (Math.random() < 0.05) {
        printColor("The enemy misses!", "1;36");
        return 0;
    }
    var crit = Math.random() < 0.1;
    var damage = Math.floor(Math.random() * this.strength) + 1;
    if (crit) {
        damage *= 2;
        printColor("Enemy lands a critical hit!", "1;31");
    }
    player.health -= damage;

    // Special enemy abilities
    if (this.specialType === 'poisonous' && Math.random() < 0.2) {
        player.statusEffects.push({type: 'poison', turns: 2, amount: 5});
        printColor("You are poisoned!", "1;31");
    }
    if (this.specialType === 'stunning' && Math.random() < 0.15) {
        player.statusEffects.push({type: 'stun', turns: 1, amount: 0});
        printColor("You are stunned and lose your next turn!", "1;31");
    }
    return damage;
};

// Player Skill Usage
function playerUseSkill(player, enemy) {
    printColor("Choose a skill to use:", "1;33");
    for (var i = 0; i < player.skills.length; i++) {
        printColor((i+1) + ". " + player.skills[i], "1;36");
    }
    console.print("Select skill number: ");
    var choice = parseInt(console.getstr(1));
    if (isNaN(choice) || choice < 1 || choice > player.skills.length) {
        printColor("Invalid skill!", "1;31");
        return;
    }
    var skill = player.skills[choice-1];
    switch (skill) {
        case 'Heal':
            var healAmount = 30 + player.level * 2;
            player.health += healAmount;
            printColor("You cast Heal and recover " + healAmount + " HP!", "1;32");
            break;
        case 'Fireball':
            var dmg = 25 + Math.floor(Math.random() * 20) + player.level;
            enemy.health -= dmg;
            printColor("You hurl a Fireball for " + dmg + " damage!", "1;33");
            if (Math.random() < 0.2) {
                enemy.statusEffects.push({type: 'burn', turns: 2, amount: 8});
                printColor("The enemy is burned!", "1;31");
            }
            break;
        case 'Defend':
            player.statusEffects.push({type: 'defend', turns: 1, amount: 0});
            printColor("You brace for incoming attacks! (Damage halved next enemy turn)", "1;36");
            break;
        default:
            printColor("Skill not implemented.", "1;31");
    }
}

Enemy.prototype.specialAttack = function(player) {
    var damage = Math.floor(Math.random() * this.strength) + this.strength;
    player.health -= damage;
    return damage;
};

// Status Effect Handler
function processStatusEffects(entity) {
    var stillActive = [];
    for (var i = 0; i < entity.statusEffects.length; i++) {
        var eff = entity.statusEffects[i];
        switch (eff.type) {
            case 'poison':
                entity.health -= eff.amount;
                printColor("Poison deals " + eff.amount + " damage!", "1;31");
                break;
            case 'burn':
                entity.health -= eff.amount;
                printColor("Burn deals " + eff.amount + " damage!", "1;31");
                break;
            case 'stun':
                printColor(entity.name + " is stunned and skips a turn!", "1;31");
                eff.turns--;
                if (eff.turns > 0) stillActive.push(eff);
                continue; // Don't process other effects this turn
            case 'defend':
                printColor(entity.name + " is defending (damage halved)!", "1;36");
                break;
        }
        eff.turns--;
        if (eff.turns > 0) stillActive.push(eff);
    }
    entity.statusEffects = stillActive;
}

// Utility Functions
function getDateString() {
    var now = new Date();
    return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
}

function triggerRandomEvent(player) {
    var eventChance = Math.floor(Math.random() * 100) + 1;
    
    if (eventChance <= 5) {
        var eventTypes = ['lottery', 'wizard', 'protection'];
        var eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        if (eventType === 'lottery') {
            var winAmount = Math.floor(Math.random() * 1000000) + 1;
            player.gold += winAmount;
            printColor("You won the lottery and received " + winAmount.toLocaleString() + " gold!", "1;32");
            console.getstr();
        } else if (eventType === 'wizard') {
            console.print("A Wizard asks if you want to join him on a quest. [Y]es or [N]o? ");
            var response = console.getstr(1);
            if (response && response.toUpperCase() === 'Y') {
                printColor("You embark on a journey with the Wizard to a mythical region.", "1;34");
                var rewardTypes = ['health', 'gold'];
                var rewardType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
                if (rewardType === 'health') {
                    var healthReward = Math.floor(Math.random() * 91) + 10;
                    player.health += healthReward;
                    printColor("You gained " + healthReward + " health!", "1;32");
                } else {
                    var goldReward = Math.floor(Math.random() * 901) + 100;
                    player.gold += goldReward;
                    printColor("You gained " + goldReward + " gold!", "1;32");
                }
            } else {
                printColor("The Wizard seems disappointed.", "1;31");
            }
        } else if (eventType === 'protection') {
            if (Math.floor(Math.random() * 20) + 1 === 1) {
                console.print("Do you want to buy 24-hour protection for 500,000 gold? [Y]es or [N]o? ");
                var response = console.getstr(1);
                if (response && response.toUpperCase() === 'Y') {
                    if (player.gold >= 500000) {
                        player.gold -= 500000;
                        printColor("You bought 24-hour protection.", "1;32");
                    } else {
                        printColor("You don't have enough gold!", "1;31");
                    }
                } else {
                    printColor("Your loss!", "1;31");
                }
            }
        }
    }
}

// Get available players for PvP
function getAvailablePlayersForPvP(currentPlayer) {
    var availablePlayers = [];
    var saveFiles = directory(SAVE_DIR + "*.json");
    
    // Reset daily PvP targets if new day
    var currentDate = getDateString();
    if (currentPlayer.lastPvpTargetReset !== currentDate) {
        currentPlayer.dailyPvpTargets = {};
        currentPlayer.lastPvpTargetReset = currentDate;
    }
    
    if (saveFiles) {
        for (var i = 0; i < saveFiles.length; i++) {
            var filename = saveFiles[i];
            var playerName = file_getname(filename).replace('.json', '');
            
            // Skip current player
            if (playerName === currentPlayer.name) continue;
            
            // Skip players already fought today
            if (currentPlayer.dailyPvpTargets[playerName] === currentDate) continue;
            
            var player = Player.loadGame(playerName);
            if (player && player.level >= 5) {
                // Add level range check - can only fight players within reasonable range
                var levelDifference = Math.abs(currentPlayer.level - player.level);
                var maxLevelDifference = Math.max(10, Math.floor(currentPlayer.level * 0.25)); // 25% of level or minimum 10
                
                if (levelDifference <= maxLevelDifference) {
                    availablePlayers.push(player);
                }
            }
        }
    }
    return availablePlayers;
}

function BossEnemy(playerLevel) {
    this.name = "Ancient Dragon Lord Vorthak";
    this.title = "The Eternal Flame";
    this.level = playerLevel + 50; // Always 50 levels higher than player
    this.health = this.level * 25; // Much more health than regular enemies
    this.maxHealth = this.health;
    this.strength = this.level * 4; // Much stronger
    this.phase = 1; // Boss has different phases
    this.specialCooldown = 0;
}

BossEnemy.prototype.attack = function(player) {
    var damage = Math.floor(Math.random() * this.strength) + Math.floor(this.strength * 0.5);
    player.health -= damage;
    return damage;
};

BossEnemy.prototype.specialAttack = function(player) {
    var attacks = [
        "Dragon's Inferno", "Soul Crushing Roar", "Ancient Curse", "Lightning Storm"
    ];
    var attackName = attacks[Math.floor(Math.random() * attacks.length)];
    var damage = Math.floor(this.strength * 1.5) + Math.floor(Math.random() * this.strength);
    player.health -= damage;
    
    printColor("[sKull] " + this.name + " uses " + attackName + "! [sKull]", "1;31");
    return damage;
};

BossEnemy.prototype.phaseTransition = function() {
    if (this.health <= this.maxHealth * 0.5 && this.phase === 1) {
        this.phase = 2;
        printColor("[FIRE] " + this.name + " enters RAGE MODE! [FIRE]", "1;31");
        printColor("The Ancient Dragon Lord's eyes glow with fury!", "1;31");
        this.strength = Math.floor(this.strength * 1.3);
        return true;
    }
    return false;
};

// Function to check if boss fight is available
function canFightBoss(player) {
    if (player.level < 200) {
        return { canFight: false, reason: "You must be at least level 200 to challenge the Ancient Dragon Lord." };
    }
    
    var currentDate = getDateString();
    if (player.lastBossFightDate === currentDate) {
        return { canFight: false, reason: "You can only challenge the Ancient Dragon Lord once per day." };
    }
    
    return { canFight: true, reason: "" };
}

// Hero title calculation
function calculateHeroTitle(bossVictories) {
    if (bossVictories >= 4) return "Dragon Legend IV";
    if (bossVictories >= 3) return "Dragon Legend III";
    if (bossVictories >= 2) return "Dragon Legend II";
    if (bossVictories >= 1) return "Dragon Legend I";
    return "";
}

// Reset choice after boss victory
function offerResetChoice(player) {
    clearScreen();
    printColor("*** CONGRATULATIONS! ***", "1;33");
    printColor("You have defeated the Ancient Dragon Lord!", "1;33");
    printColor("You have completed Round " + player.currentRound + "!", "1;33");
    
    // Calculate rewards
    player.bossVictories++;
    player.heroPoints = player.bossVictories * 250;
    player.heroTitle = calculateHeroTitle(player.bossVictories);
    
    // Apply permanent bonuses
    player.permanentBonuses.healthBonus += 50;
    player.permanentBonuses.strengthBonus += 10;
    player.permanentBonuses.experienceMultiplier += 0.1;
    player.permanentBonuses.goldMultiplier += 0.1;
    
    printColor("[TroPhy] PERMANENT BONUSES GAINED:", "1;32");
    printColor("+ 50 Max Health Bonus", "1;32");
    printColor("+ 10 Strength Bonus", "1;32");
    printColor("+ 10% Experience Multiplier", "1;32");
    printColor("+ 10% Gold Multiplier", "1;32");
    
    if (player.heroTitle) {
        printColor("[StAr] Hero Title: " + player.heroTitle + " [StAr]", "1;33");
    }
    
    if (player.heroPoints >= 1000) {
        printColor("[StAr] HALL OF HEROES STATUS ACHIEVED! [StAr]", "1;33");
    }
    
    console.print("\nPress Enter to choose what to keep for your new journey...");
    console.getstr();
    
    // Reset choice
    clearScreen();
    printColor("=== NEW ROUND PREPARATION ===", "1;34");
    printColor("You will start Round " + (player.currentRound + 1) + " at level 1.", "1;32");
    printColor("Choose what you want to keep:", "1;33");
    printColor("", "1;37");
    
    var currentGold = player.gold;
    var currentBank = player.bankBalance;
    var currentStrength = player.strength;
    var currentLevel = player.level;
    
    printColor("Current Stats:", "1;36");
    printColor("Gold on Hand: " + currentGold.toLocaleString(), "1;36");
    printColor("Gold in Bank: " + currentBank.toLocaleString(), "1;36");
    printColor("Weapon Level (Strength): " + currentStrength, "1;36");
    printColor("Armor Level: " + currentLevel, "1;36");
    
    // Choice 1: Keep wealth or equipment
    printColor("\n=== CHOICE 1: Wealth vs Equipment ===", "1;34");
    printColor("(1) Keep all your GOLD (hand + bank)", "1;32");
    printColor("(2) Keep your WEAPONS & ARMOR (strength + level)", "1;32");
    printColor("(3) Keep HALF of both", "1;33");
    
    while (bbs.online && !js.terminated) {
        console.print("\nChoose (1-3): ");
        var choice = console.getstr(1);
        
        if (choice === '1') {
            // Keep gold, reset equipment
            player.strength = 10 + player.permanentBonuses.strengthBonus;
            printColor("You chose to keep your wealth! Starting new round with all gold but basic equipment.", "1;32");
            break;
        } else if (choice === '2') {
            // Keep equipment, reset gold
            player.gold = 100;
            player.bankBalance = 0;
            printColor("You chose to keep your equipment! Starting new round with powerful gear but little gold.", "1;32");
            break;
        } else if (choice === '3') {
            // Keep half of both
            player.gold = Math.floor(currentGold * 0.5) + 100;
            player.bankBalance = Math.floor(currentBank * 0.5);
            player.strength = Math.floor((currentStrength + 10 + player.permanentBonuses.strengthBonus) * 0.5);
            printColor("You chose balance! Starting new round with half your wealth and half your equipment power.", "1;32");
            break;
        } else {
            printColor("Invalid choice! Please choose 1, 2, or 3.", "1;31");
        }
    }
    
    // Reset other stats for new round
    player.currentRound++;
    player.level = 1;
    player.experience = 0;
    player.nextLevelExp = 100;
    player.health = 110 + player.permanentBonuses.healthBonus; // Base + permanent bonus
    player.specialAttacksUsed = 0;
    
    // Keep mastered classes and hero progress
    // masteredClasses, bossVictories, heroPoints, heroTitle all stay
    
    player.saveGame();
    
    console.print("\nPress Enter to begin your new legendary journey...");
    console.getstr();
}

// Boss fight function
function fightAncientDragonLord(player) {
    player.lastBossFightDate = getDateString();
    player.saveGame();
    
    clearScreen();
    printColor("[FIRE]", "1;31");
    printColor("      ANCIENT DRAGON LORD VORTHAK APPROACHES!", "1;31");
    printColor("              'The Eternal Flame'", "1;33");
    printColor("[FIRE]", "1;31");
    printColor("", "1;37");
    printColor("The ground trembles as the Ancient Dragon Lord emerges!", "1;31");
    printColor("This legendary beast has terrorized the realm for millennia.", "1;31");
    printColor("Only the most powerful heroes dare challenge it!", "1;31");
    printColor("", "1;37");
    
    var boss = new BossEnemy(player.level);
    
    printColor("Boss Stats:", "1;34");
    printColor("Level: " + boss.level, "1;34");
    printColor("Health: " + boss.health, "1;34");
    printColor("Strength: " + boss.strength, "1;34");
    
    console.print("\nPress Enter to begin the legendary battle...");
    console.getstr();
    
    var round = 1;
    
    while (boss.health > 0 && player.isAlive() && bbs.online && !js.terminated) {
        clearScreen();
        
        // Check for phase transition
        boss.phaseTransition();
        
        printColor("\n=== BOSS BATTLE - Round " + round + " ===", "1;31");
        printColor("[DrAgOn] " + boss.name + " (Phase " + boss.phase + ")", "1;31");
        printColor("Boss Health: " + boss.health + " / " + boss.maxHealth, "1;31");
        printColor("Your Health: " + player.health, "1;32");
        printColor("", "1;37");
        
        // Player turn
        console.print("Choose your action: [A]ttack, [H]eal, or [R]un? ");
        var action = console.getstr(1);
        
        if (!action) continue;
        action = action.toUpperCase();
        
        if (action === 'A') {
            var subAction = getAttackType(player);
            var damage = 0;
            
            if (subAction === 'N') {
                damage = player.attack(boss);
                printColor("[sWoRd] You strike the Ancient Dragon Lord for " + damage + " damage!", "1;32");
            } else if (subAction === 'S') {
                damage = player.specialAttack(boss);
                if (damage > 0) {
                    printColor("[sPaRkLe] Your special attack hits for " + damage + " damage!", "1;33");
                }
            } else {
                printColor("Invalid attack type!", "1;31");
                continue;
            }
            
            if (boss.health <= 0) {
                break; // Boss defeated!
            }
            
        } else if (action === 'H') {
            console.print("Enter the amount to heal (1 gold per hitpoint): ");
            var healAmountStr = console.getstr(4);
            var healAmount = parseInt(healAmountStr) || 0;
            player.heal(healAmount);
            
        } else if (action === 'R') {
            printColor("You attempt to flee from the Ancient Dragon Lord!", "1;31");
            if (Math.random() < 0.1) { // Only 10% chance to escape boss
                printColor("You barely escape with your life!", "1;31");
                return;
            } else {
                printColor("The Ancient Dragon Lord blocks your escape! You must fight!", "1;31");
            }
        } else {
            printColor("Invalid action!", "1;31");
            continue;
        }
        
        // Boss turn
        if (boss.health > 0) {
            console.print("\nPress Enter for the boss's turn...");
            console.getstr();
            
            var bossAction = Math.random();
            var damage = 0;
            
            if (bossAction < 0.4 || boss.specialCooldown > 0) {
                // Normal attack
                damage = boss.attack(player);
                printColor("[FIRE] " + boss.name + " breathes fire at you for " + damage + " damage!", "1;31");
                if (boss.specialCooldown > 0) boss.specialCooldown--;
            } else {
                // Special attack
                damage = boss.specialAttack(player);
                printColor("You take " + damage + " devastating damage!", "1;31");
                boss.specialCooldown = 3; // Cooldown before next special
            }
            
            // Check if player died
            if (player.health <= 0) {
                if (!player.handlePlayerDeath()) {
                    return;
                }
                break;
            }
        }
        
        round++;
        
        // Prevent infinite battle
        if (round > 100) {
            printColor("The battle rages on for too long! The Ancient Dragon Lord retreats for now...", "1;33");
            printColor("You survived the encounter but did not defeat the boss.", "1;33");
            return;
        }
    }
    
    // Check victory
    if (boss.health <= 0 && player.isAlive()) {
        clearScreen();
        printColor("[***][***][***][***][***][***][***][***][***][***]", "1;33");
        printColor("    LEGENDARY VICTORY!", "1;33");
        printColor("[***][***][***][***][***][***][***][***][***][***]", "1;33");
        printColor("", "1;37");
        printColor("The Ancient Dragon Lord falls before your might!", "1;32");
        printColor("The realm celebrates your incredible achievement!", "1;32");
        printColor("Legends will be told of this day for generations!", "1;32");
        
        // Immediate rewards
        var expReward = Math.floor(player.level * 100 * player.permanentBonuses.experienceMultiplier);
        var goldReward = Math.floor(player.level * 1000 * player.permanentBonuses.goldMultiplier);
        
        player.experience += expReward;
        player.gold += goldReward;
        
        printColor("\nImmediate Rewards:", "1;32");
        printColor("Experience: " + expReward.toLocaleString(), "1;32");
        printColor("Gold: " + goldReward.toLocaleString(), "1;32");
        
        console.print("\nPress Enter to continue...");
        console.getstr();
        
        // Offer reset choice
        offerResetChoice(player);
    }
}
// Fight Other Players (PvP) Function
function fightOtherPlayers(player) {
    if (player.level < 5) {
        printColor("You must be at least level 5 to fight other players.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    // Check daily PvP limits
    var currentDate = getDateString();
    if (player.lastPvpFightDate !== currentDate) {
        player.dailyPvpFights = 0;
        player.lastPvpFightDate = currentDate;
    }
    
    if (player.dailyPvpFights >= 10) {
        printColor("You have reached the maximum number of PvP fights for today (10). Try again tomorrow.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    var availablePlayers = getAvailablePlayersForPvP(player);
    
    if (availablePlayers.length === 0) {
        printColor("No players available for PvP combat at this time.", "1;31");
        printColor("Players must be level 5 or higher, within your level range,", "1;33");
        printColor("and you can only fight each player once per day.", "1;33");
        printColor("", "1;37");
        printColor("Your PvP level range: " + Math.max(1, player.level - Math.max(10, Math.floor(player.level * 0.25))) + 
                 " to " + (player.level + Math.max(10, Math.floor(player.level * 0.25))), "1;36");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    while (bbs.online && !js.terminated) {
        clearScreen();
        printColor("\n----- Available Players for PvP Combat -----", "1;34");
        printColor("PvP Fights Remaining Today: " + (10 - player.dailyPvpFights), "1;33");
        printColor("Note: You can only fight each player once per day", "1;36");
        printColor("Level Range: " + Math.max(1, player.level - Math.max(10, Math.floor(player.level * 0.25))) + 
                 " to " + (player.level + Math.max(10, Math.floor(player.level * 0.25))), "1;36");
        printColor(repeatChar("-", 45), "1;34");
        
        for (var i = 0; i < availablePlayers.length; i++) {
            var targetPlayer = availablePlayers[i];
            var status = "";
            
            // Add alive/dead status
            if (targetPlayer.isDead()) {
                status += "\x01r(Dead)\x01n ";
            } else {
                status += "\x01g(Alive)\x01n ";
            }
            
            // Add online/offline status
            if (targetPlayer.isOnline) {
                status += "\x01g(Online)\x01n";
            } else {
                status += "\x01r(Offline)\x01n";
            }
            
            printColor((i + 1) + ". " + targetPlayer.name + " - Level " + targetPlayer.level + 
                     " " + targetPlayer.chosenClass + " " + status, "1;32");
        }
        
        printColor((availablePlayers.length + 1) + ". Return to main menu", "1;31");
        printColor(repeatChar("-", 45), "1;34");
        
        console.print("Choose a player to fight (1-" + (availablePlayers.length + 1) + "): ");
        var choiceStr = console.getstr(2);
        
        if (!choiceStr) continue;
        
        var choice = parseInt(choiceStr);
        if (isNaN(choice)) {
            printColor("Invalid input! Please enter a number.", "1;31");
            console.print("Press Enter to continue...");
            console.getstr();
            continue;
        }
        
        if (choice === availablePlayers.length + 1) {
            return; // Return to main menu
        }
        
        if (choice >= 1 && choice <= availablePlayers.length) {
            var targetPlayer = availablePlayers[choice - 1];
            
            // Check if target is dead and warn player
            if (targetPlayer.isDead()) {
                printColor("\nWarning: " + targetPlayer.name + " is currently dead!", "1;31");
                printColor("You can still fight them, but they may not fight back effectively.", "1;33");
                console.print("Do you still want to challenge this dead player? [Y]es or [N]o: ");
                var deadConfirm = console.getstr(1);
                
                if (!deadConfirm || deadConfirm.toUpperCase() !== 'Y') {
                    continue; // Go back to player selection
                }
            }
            
            // Check for significant level difference and warn
            var levelDifference = player.level - targetPlayer.level;
            if (Math.abs(levelDifference) > 15) {
                if (levelDifference > 15) {
                    printColor("\nNotice: " + targetPlayer.name + " is much weaker than you!", "1;33");
                    printColor("Level " + targetPlayer.level + " vs your Level " + player.level, "1;33");
                    printColor("Victory may provide reduced satisfaction and rewards.", "1;36");
                } else {
                    printColor("\nWarning: " + targetPlayer.name + " is much stronger than you!", "1;31");
                    printColor("Level " + targetPlayer.level + " vs your Level " + player.level, "1;31");
                    printColor("This will be a very challenging fight!", "1;33");
                }
                console.print("Do you still want to proceed with this fight? [Y]es or [N]o: ");
                var levelConfirm = console.getstr(1);
                
                if (!levelConfirm || levelConfirm.toUpperCase() !== 'Y') {
                    continue; // Go back to player selection
                }
            }
            
            // Confirm the fight
            printColor("\nYou have chosen to fight: " + targetPlayer.name + 
                     " (Level " + targetPlayer.level + " " + targetPlayer.chosenClass + ")", "1;33");
            console.print("Are you sure you want to challenge this player? [Y]es or [N]o: ");
            var confirm = console.getstr(1);
            
            if (confirm && confirm.toUpperCase() === 'Y') {
                // Start PvP combat
                startPvPCombat(player, targetPlayer);
                return;
            }
        } else {
            printColor("Invalid choice! Please choose between 1 and " + (availablePlayers.length + 1) + ".", "1;31");
            console.print("Press Enter to continue...");
            console.getstr();
        }
    }
}

// PvP Combat System
function startPvPCombat(attacker, defender) {
    // Increment daily PvP fight counter
    attacker.dailyPvpFights++;
    
    // Mark this player as fought today
    var currentDate = getDateString();
    if (!attacker.dailyPvpTargets) attacker.dailyPvpTargets = {};
    attacker.dailyPvpTargets[defender.name] = currentDate;
    
    // Create a copy of defender for combat (so we don't modify the original until the end)
    var combatDefender = JSON.parse(JSON.stringify(defender));
    
    // Manually restore the Player prototype methods for the copy
    combatDefender.attack = function(target) {
        var baseDamage = Math.floor(Math.random() * (this.strength + (this.permanentBonuses ? this.permanentBonuses.strengthBonus : 0))) + 1;
        var levelBonus = this.level * 0.5;
        var totalDamage = Math.floor(baseDamage + levelBonus);
        target.health -= totalDamage;
        return totalDamage;
    };
    
    combatDefender.specialAttack = function(target) {
        if (this.specialAttacksUsed < this.level * 2) {
            var totalStrength = this.strength + (this.permanentBonuses ? this.permanentBonuses.strengthBonus : 0);
            var damage = Math.floor(Math.random() * totalStrength) + totalStrength;
            target.health -= damage;
            this.specialAttacksUsed += 1;
            return damage;
        } else {
            return 0;
        }
    };
    
    combatDefender.isAlive = function() {
        return this.health > 0;
    };
    
    combatDefender.isDead = function() {
        return this.health <= 0;
    };
    
    var originalAttackerHealth = attacker.health;
    var originalDefenderHealth = combatDefender.health;
    
    printColor("\n" + repeatChar("=", 60), "1;31");
    printColor("PvP COMBAT: " + attacker.name + " vs " + combatDefender.name, "1;31");
    printColor(repeatChar("=", 60), "1;31");
    printColor(attacker.name + " (Level " + attacker.level + " " + attacker.chosenClass + ") - Health: " + attacker.health, "1;32");
    printColor(combatDefender.name + " (Level " + combatDefender.level + " " + combatDefender.chosenClass + ") - Health: " + combatDefender.health, "1;32");
    printColor(repeatChar("=", 60), "1;31");
    
    console.print("Press Enter to begin combat...");
    console.getstr();
    
    var round = 1;
    
    while (attacker.isAlive() && combatDefender.health > 0 && bbs.online && !js.terminated) {
        printColor("\n--- Round " + round + " ---", "1;34");
        printColor(attacker.name + " Health: " + attacker.health + " | " + 
                  combatDefender.name + " Health: " + combatDefender.health, "1;34");
        
        // Attacker's turn
        console.print("\n" + attacker.name + "'s turn - Do you want to [A]ttack, [H]eal, or [R]un? ");
        var action = console.getstr(1);
        
        if (!action) continue;
        action = action.toUpperCase();
        
        if (action === 'A') {
            var subAction = getAttackType(attacker);
            var damage = 0;
            
            if (subAction === 'N') {
                damage = attacker.attack(combatDefender);
                printColor(attacker.name + " attacks " + combatDefender.name + " for " + damage + " damage!", "1;32");
            } else if (subAction === 'S') {
                damage = attacker.specialAttack(combatDefender);
                if (damage > 0) {
                    printColor(attacker.name + " uses a special attack on " + combatDefender.name + " for " + damage + " damage!", "1;33");
                }
            } else {
                printColor("Invalid attack type!", "1;31");
                continue;
            }
            
            if (combatDefender.health <= 0) {
                break; // Combat ends, defender is defeated
            }
            
        } else if (action === 'H') {
            console.print("Enter the amount to heal (1 gold per hitpoint): ");
            var healAmountStr = console.getstr(3);
            var healAmount = parseInt(healAmountStr) || 0;
            attacker.heal(healAmount);
            
        } else if (action === 'R') {
            printColor(attacker.name + " attempts to run away from the fight!", "1;31");
            if (Math.random() < 0.3) { // 30% chance to successfully run
                printColor(attacker.name + " successfully escaped!", "1;31");
                attacker.saveGame();
                console.print("Press Enter to continue...");
                console.getstr();
                return;
            } else {
                printColor(attacker.name + " failed to escape and must continue fighting!", "1;31");
            }
        } else {
            printColor("Invalid action!", "1;31");
            continue;
        }
        
        // Check if attacker died during healing or other actions
        if (attacker.health <= 0) {
            if (!attacker.handlePlayerDeath()) {
                // Attacker is dead and chose not to resurrect
                return;
            }
            // Attacker resurrected, break out of this fight
            break;
        }
        
        // Defender's turn (AI controlled)
        if (combatDefender.health > 0) {
            console.print("\nPress Enter for " + combatDefender.name + "'s turn...");
            console.getstr();
            
            // Simple AI: 70% chance to attack, 20% chance to heal (if low health), 10% chance to special attack
            var defenderAction = Math.random();
            
            if (combatDefender.health < (100 + combatDefender.level * 10) * 0.3 && combatDefender.gold >= 20 && defenderAction < 0.2) {
                // Heal if health is low and has gold
                var healAmount = Math.min(20, combatDefender.gold);
                combatDefender.gold -= healAmount;
                combatDefender.health += healAmount;
                combatDefender.health = Math.min(combatDefender.health, 100 + combatDefender.level * 10);
                printColor(combatDefender.name + " heals for " + healAmount + " hitpoints! Health: " + combatDefender.health, "1;36");
                
            } else if (defenderAction < 0.85) {
                // Normal attack
                var damage = combatDefender.attack(attacker);
                printColor(combatDefender.name + " attacks " + attacker.name + " for " + damage + " damage!", "1;31");
                
            } else {
                // Special attack (if available)
                var damage = combatDefender.specialAttack(attacker);
                if (damage > 0) {
                    printColor(combatDefender.name + " uses a special attack on " + attacker.name + " for " + damage + " damage!", "1;35");
                } else {
                    // Fallback to normal attack if no special attacks available
                    var damage = combatDefender.attack(attacker);
                    printColor(combatDefender.name + " attacks " + attacker.name + " for " + damage + " damage!", "1;31");
                }
            }
            
            // Check if attacker died
            if (attacker.health <= 0) {
                if (!attacker.handlePlayerDeath()) {
                    // Attacker is dead and chose not to resurrect
                    return;
                }
                // Attacker resurrected, break out of this fight
                break;
            }
        }
        
        round++;
        
        // Prevent infinite combat
        if (round > 50) {
            printColor("The battle has gone on too long! Both fighters collapse from exhaustion.", "1;33");
            attacker.health = Math.max(1, Math.floor(attacker.health * 0.5));
            combatDefender.health = Math.max(1, Math.floor(combatDefender.health * 0.5));
            break;
        }
    }
    
    // Determine winner and handle rewards/penalties
    if (combatDefender.health <= 0 && attacker.isAlive()) {
        // Attacker wins
        printColor("\n" + repeatChar("=", 50), "1;32");
        printColor("VICTORY! " + attacker.name + " defeats " + combatDefender.name + "!", "1;32");
        printColor(repeatChar("=", 50), "1;32");
        
        // Calculate rewards
        var expReward = combatDefender.level * 15;
        var goldReward = Math.floor(combatDefender.gold * 0.1); // 10% of defender's gold
        goldReward = Math.min(goldReward, combatDefender.level * 50); // Cap the reward
        
        attacker.experience += expReward;
        attacker.gold += goldReward;
        
        printColor("You gained " + expReward + " experience points!", "1;32");
        printColor("You gained " + goldReward + " gold!", "1;32");
        
        // Update defender (reduce their gold, but don't kill them)
        defender.gold = Math.max(0, defender.gold - goldReward);
        defender.health = Math.max(1, Math.floor(originalDefenderHealth * 0.5)); // Leave them with some health
        
    } else if (attacker.health <= 0 && combatDefender.health > 0) {
        // Defender wins (this case is handled by the death system above)
        printColor("\n" + repeatChar("=", 50), "1;31");
        printColor("DEFEAT! " + combatDefender.name + " has defeated you!", "1;31");
        printColor(repeatChar("=", 50), "1;31");
        
    } else {
        // Draw or both collapsed
        printColor("\n" + repeatChar("=", 50), "1;33");
        printColor("The battle ends in a draw! Both fighters are exhausted.", "1;33");
        printColor(repeatChar("=", 50), "1;33");
    }
    
    // Save both players
    attacker.saveGame();
    defender.saveGame();
    
    // Send message to defender about the fight
    var message = "You were challenged by " + attacker.name + " in PvP combat! ";
    if (combatDefender.health <= 0) {
        message += "You were defeated and lost " + goldReward + " gold.";
    } else if (attacker.health <= 0) {
        message += "You emerged victorious!";
    } else {
        message += "The battle ended in a draw.";
    }
    sendMessageToPlayer(defender.name, "PvP System", message);
    
    console.print("Press Enter to continue...");
    console.getstr();
}

// Inn Function
function inn(player) {
    while (bbs.online && !js.terminated) {
        clearScreen();
        var roomCost = 100 * player.level;
        var menu = format(
            "\r\n\x01b" + repeatChar("-", 49) + "\x01n\r\n" +
            "                   \x01r\x01hDragon Inn\x01n\r\n" +
            "\x01b" + repeatChar("-", 49) + "\x01n\r\n" +
            "  \x01w(1)\x01n \x01gHave a drink \x01w(Cost 5, Heals 10)\x01n\r\n" +
            "  \x01w(2)\x01n \x01gView Your Dragon Stats Here\x01n\r\n" +
            "  \x01w(3)\x01n \x01gSleep with someone \x01w(Cost 50, Heals 75)\x01n\r\n" +
            "  \x01w(4)\x01n \x01gTest your skills at robbing someone\x01n\r\n" +
            "  \x01w(5)\x01n \x01gGet a room \x01w(Cost %s, Safe, Game Saved)\x01n\r\n" +
            "  \x01w(6)\x01n \x01gHead over to other areas\x01n\r\n" +
            "  \x01w(7)\x01n \x01gRelease your pet into the wild\x01n\r\n" +
            "  \x01w(8)\x01n \x01gLeave the inn\x01n\r\n" +
            "\x01b" + repeatChar("-", 49) + "\x01n\r\n",
            roomCost.toLocaleString()
        );
        
        console.print(menu);
        console.print("\x01gChoose an action: \x01n");
        var choice = console.getstr(1);
        
        if (!choice) continue;
        
        switch(choice) {
            case '1':
                if (player.gold >= 5) {
                    player.gold -= 5;
                    player.health += 10;
                    var maxHealth = 100 + player.level * 10 + player.permanentBonuses.healthBonus;
                    player.health = Math.min(player.health, maxHealth);
                    printColor("You have a drink and feel refreshed! Health: " + player.health + " - Gold: " + player.gold.toLocaleString() + "", "1;32");
                } else {
                    printColor("You don't have enough gold!", "1;31");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '2':
                var maxHealth = 100 + player.level * 10 + player.permanentBonuses.healthBonus;
                var effectiveStrength = player.strength + player.permanentBonuses.strengthBonus;
                printColor("Player Stats", "1;34");
                printColor("Health: " + player.health + " / " + maxHealth, "1;32");
                printColor("Experience: " + player.experience, "1;32");
                printColor("Gold on Hand: " + player.gold.toLocaleString(), "1;32");
                printColor("Gold in Bank: " + player.bankBalance.toLocaleString(), "1;32");
                printColor("Armor Level: " + player.level, "1;32");
                printColor("Weapon Level: " + Math.floor(effectiveStrength / 2), "1;32");
                if (player.pet) {
                    printColor("Pet: " + player.pet.name +
                        " (Damage: " + player.pet.damage +
                        (player.pet.ability ? ", Ability: " + player.pet.ability : "") +
                        ")", "1;36");
                }
                
                // Show boss victory info if any
                if (player.bossVictories > 0) {
                    printColor("", "1;37");
                    printColor("[TroPhy] HERO STATUS [TroPhy]", "1;33");
                    printColor("Boss Victories: " + player.bossVictories, "1;33");
                    printColor("Hero Points: " + player.heroPoints, "1;33");
                    printColor("Hero Title: " + player.heroTitle, "1;33");
                    printColor("Current Round: " + player.currentRound, "1;33");
                    printColor("", "1;37");
                    printColor("Permanent Bonuses:", "1;36");
                    printColor("+ " + player.permanentBonuses.healthBonus + " Max Health", "1;36");
                    printColor("+ " + player.permanentBonuses.strengthBonus + " Strength", "1;36");
                    printColor("+ " + Math.round((player.permanentBonuses.experienceMultiplier - 1) * 100) + "% Experience", "1;36");
                    printColor("+ " + Math.round((player.permanentBonuses.goldMultiplier - 1) * 100) + "% Gold", "1;36");
                }
                
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '3':
                if (player.gold >= 50) {
                    player.gold -= 50;
                    player.health += 75;
                    var maxHealth = 100 + player.level * 10 + player.permanentBonuses.healthBonus;
                    player.health = Math.min(player.health, maxHealth);
                    printColor("You found a companion to spend the night with. Health: " + player.health + " Gold: " + player.gold.toLocaleString() + "", "1;32");
                } else {
                    printColor("You don't have enough gold!", "1;31");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '4':
                printColor("You attempt to rob someone while they are sleeping.", "1;31");
                var success = Math.random() < 0.5;
                if (success) {
                    var goldStolen = Math.floor(Math.random() * 41) + 10;
                    // Apply gold multiplier to stolen gold
                    goldStolen = Math.floor(goldStolen * player.permanentBonuses.goldMultiplier);
                    player.gold += goldStolen;
                    printColor("You successfully stole " + goldStolen.toLocaleString() + " gold! You now have " + player.gold.toLocaleString() + " gold.", "1;32");
                } else {
                    printColor("You got caught and had to run away!", "1;31");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '5':
                if (player.gold >= roomCost) {
                    player.gold -= roomCost;
                    player.health = 100 + player.level * 10 + player.permanentBonuses.healthBonus;
                    player.isOnline = false;
                    player.saveGame();
                    printColor("You rest in a room and regain your strength. Game saved. You are safe.", "1;32");
                    console.print("Press Enter to continue...");
                    console.getstr();
                    return;
                } else {
                    printColor("You don't have enough gold!", "1;31");
                    console.print("Press Enter to continue...");
                    console.getstr();
                }
                break;
                
            case '6':
                visitIGMs(player);
                break;

            case '7':
                if (player.pet) {
                    printColor("Your current pet is: " + player.pet.name, "1;33");
                    console.print("Do you want to release your pet? [Y]es/[N]o: ");
                    var rel = console.getstr(1);
                    if (rel && rel.toUpperCase() === 'Y') {
                        printColor("You released " + player.pet.name + " back into the wild.", "1;31");
                        player.pet = null;
                    }
                } else {
                    printColor("You don't have a pet.", "1;31");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '8':
                return;
                
            default:
                printColor("Invalid choice!", "1;31");
        }
    }
}

// Journey Function
function journey(player) {
    while (bbs.online && !js.terminated) {
        clearScreen();
        var menu = 
            "\r\n\x01b" + repeatChar("-", 42) + "\x01n\r\n" +
            "             \x01r\x01hDragon Journey\x01n\r\n" +
            "\x01b" + repeatChar("-", 42) + "\x01n\r\n" +
            "  \x01w(1)\x01n \x01gDark Forest\x01n\r\n" +
            "  \x01w(2)\x01n \x01gMystic Mountains\x01n\r\n" +
            "  \x01w(3)\x01n \x01gAbandoned Castle\x01n\r\n" +
            "  \x01w(4)\x01n \x01gCheck Level and Experience\x01n\r\n" +
            "  \x01w(5)\x01n \x01gView Class Status\x01n\r\n" +
            "  \x01w(6)\x01n \x01gLevel Up (if ready)\x01n\r\n" +
            "  \x01w(7)\x01n \x01gReturn to main menu\x01n\r\n" +
            "\x01b" + repeatChar("-", 42) + "\x01n\r\n";
        
        console.print(menu);
        console.print("\x01gChoose an action: \x01n");
        var choice = console.getstr(1);

        if (!choice) continue;

        switch(choice) {
            case '1':
                printColor("You venture into the Dark Forest and encounter a wild enemy!", "1;31");
                if (!specialFightingArea(player)) {
                    player.isOnline = false;
                    player.saveGame();
                    return;
                }
                break;

            case '2':
                var currentDate = getDateString();
                if (player.lastMysticMountainsVisit === currentDate) {
                    printColor("You can only visit the Mystic Mountains once per day. Try again tomorrow.", "1;31");
                } else {
                    printColor("You climb the Mystic Mountains and find hidden treasures!", "1;32");
                    var goldReward = Math.floor(50 * player.permanentBonuses.goldMultiplier);
                    player.gold += goldReward;
                    printColor("You found " + goldReward + " gold!", "1;32");
                    player.lastMysticMountainsVisit = currentDate;
                    player.saveGame();
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;

            case '3':
                printColor("You explore the Abandoned Castle and fight a ghost!", "1;31");
                if (!specialFightingArea(player)) {
                    player.isOnline = false;
                    player.saveGame();
                    return;
                }
                break;

            case '4':
                printColor("Your current level is " + player.level + " and you have " + player.experience + " experience.", "1;32");
                var expNeeded = player.nextLevelExp - player.experience;
                if (expNeeded <= 0) {
                    printColor("You are ready to level up!", "1;32");
                } else {
                    printColor("You need " + expNeeded + " experience to reach the next level.", "1;32");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;

            case '5':
                clearScreen();
                printColor("\n" + repeatChar("=", 50), "1;34");
                printColor("CLASS STATUS", "1;34");
                printColor(repeatChar("=", 50), "1;34");
                printColor("Current Class: " + player.chosenClass + " (Level " + player.level + ")", "1;32");
                printColor("Experience: " + player.experience + " / " + player.nextLevelExp, "1;32");
                if (player.level < 10) {
                    var expNeeded = player.nextLevelExp - player.experience;
                    if (expNeeded <= 0) {
                        printColor("You are ready to level up or master this class!", "1;33");
                    } else {
                        printColor("Experience needed to master this class: " + expNeeded, "1;33");
                    }
                } else {
                    printColor("This class is ready to be mastered!", "1;32");
                }
                printColor("\nMastered Classes (" + player.masteredClasses.length + "/" + CLASSES.length + "):","1;34");
                if (player.masteredClasses.length > 0) {
                    for (var i = 0; i < player.masteredClasses.length; i++) {
                        printColor("+ " + player.masteredClasses[i], "1;32");
                    }
                } else {
                    printColor("None yet - reach level 10 to master your first class!", "1;31");
                }
                if (player.topDragon) {
                    printColor("\n[DrAgOn] TOP DRAGON STATUS ACHIEVED! [DrAgOn]", "1;33");
                    printColor("You have mastered all classes!", "1;33");
                } else {
                    printColor("\nClasses still to master:", "1;36");
                    for (var i = 0; i < CLASSES.length; i++) {
                        if (player.masteredClasses.indexOf(CLASSES[i]) === -1 && CLASSES[i] !== player.chosenClass) {
                            printColor("- " + CLASSES[i], "1;36");
                        }
                    }
                }
                printColor(repeatChar("=", 50), "1;34");
                console.print("\nPress Enter to continue...");
                console.getstr();
                break;

            case '6':
                if (player.experience >= player.nextLevelExp) {
                    var prevLevel = player.level;
                    var prevExp = player.experience;
                    player.levelUp();
                    printColor("You have leveled up to level " + player.level + "!", "1;32");
                    printColor("Experience carried over: " + player.experience + " / " + player.nextLevelExp, "1;32");
                    player.saveGame();
                } else {
                    printColor("You do not have enough experience to level up.", "1;31");
                    var expNeeded = player.nextLevelExp - player.experience;
                    printColor("You need " + expNeeded + " more experience.", "1;33");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;

            case '7':
                return;

            default:
                printColor("Invalid choice!", "1;31");
        }
    }
}

// Special Fighting Area
function specialFightingArea(player) {
    if (player.level < 5) {
        printColor("You must be at least level 5 to fight other players.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }

    var currentDate = getDateString();
    if (player.lastSpecialFightingAreaAccess !== currentDate) {
        player.specialFightingAreaAccesses = 0;
        player.lastSpecialFightingAreaAccess = currentDate;
    }

    if (player.specialFightingAreaAccesses >= 4) {
        printColor("You can only access the Special Fighting Area 4 times per day. Try again tomorrow.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }

    player.specialFightingAreaAccesses += 1;
    player.saveGame();

    printColor("\nWelcome to the Special Fighting Area!", "1;31");
    var enemy = new Enemy(player.level + 2);
    enemy.resetHealth();

    // --- Enhanced Battle Loop with RPG Features ---
    while (enemy.health > 0 && player.isAlive() && bbs.online && !js.terminated) {
        // Process player status effects
        processStatusEffects(player);
        if (player.statusEffects && player.statusEffects.some(function(e) { return e.type === 'stun'; })) {
            printColor("You are stunned and lose your turn!", "1;31");
        } else {
            printColor("Player Health: " + player.health + ", Enemy Health: " + enemy.health, "1;34");
            console.print("Do you want to [A]ttack, [S]kill, [P] Special Attack, [H]eal, or [R]un? ");
            var action = console.getstr(1);
            if (!action) continue;
            action = action.toUpperCase();
            if (action === 'A') {
                var damage = player.attack(enemy);
                printColor("You attacked the enemy for " + damage + " damage. Enemy Health: " + enemy.health, "1;32");
            } else if (action === 'S') {
                playerUseSkill(player, enemy);
            } else if (action === 'P') {
                var damage = player.specialAttack(enemy);
                if (damage > 0) {
                    printColor("You used a special attack for " + damage + " damage!", "1;33");
                }
            } else if (action === 'H') {
                console.print("Enter the amount to heal (1 gold per hitpoint): ");
                var healAmountStr = console.getstr(3);
                var healAmount = parseInt(healAmountStr) || 0;
                player.heal(healAmount);
            } else if (action === 'R') {
                printColor("You ran away!", "1;31");
                break;
            } else {
                printColor("Invalid action!", "1;31");
            }
        }
        // Random battle event
        if (Math.random() < 0.07) battleEvent(player, enemy);

        // Enemy turn
        if (enemy.health > 0) {
            processStatusEffects(enemy);
            if (enemy.statusEffects && enemy.statusEffects.some(function(e) { return e.type === 'stun'; })) {
                printColor("Enemy is stunned and skips a turn!", "1;31");
                continue;
            }
            var enemyDamage = enemy.attack(player);
            if (player.statusEffects && player.statusEffects.some(function(e) { return e.type === 'defend'; })) {
                enemyDamage = Math.floor(enemyDamage / 2);
            }
            printColor("The enemy attacked you for " + enemyDamage + " damage. Your Health: " + player.health, "1;31");
        }

        if (player.pet && Math.random() < 0.4) {
            var petDamage = player.pet.damage + Math.floor(Math.random() * 5);
            enemy.health -= petDamage;
            printColor("Your pet " + player.pet.name + " attacks and deals " + petDamage + " damage!", "1;36");
            if (player.pet.ability === "heal" && Math.random() < 0.15) {
                var heal = 10 + Math.floor(Math.random() * 10);
                player.health += heal;
                printColor("Your pet " + player.pet.name + " heals you for " + heal + " HP!", "1;32");
            }
            if (player.pet.ability === "burn" && Math.random() < 0.1) {
                enemy.statusEffects.push({type: 'burn', turns: 2, amount: 8});
                printColor("Your pet's fire burns the enemy!", "1;31");
            }
            if (player.pet.ability === "dodge" && Math.random() < 0.1) {
                player.statusEffects.push({type: 'defend', turns: 1, amount: 0});
                printColor("Your pet helps you dodge—damage halved next attack!", "1;36");
            }
        }

        // Check if player died
        if (player.health <= 0) {
            if (!player.handlePlayerDeath()) {
                // Player is dead and chose not to resurrect or has no resurrections
                return false; // Signal to main function that player is dead
            }
            // Player resurrected, break out of this fight
            break;
        }
    }

    if (player.isAlive() && enemy.health <= 0) {
        printColor("You defeated the enemy!", "1;32");
        var expReward = Math.floor(player.level * 10 * player.permanentBonuses.experienceMultiplier);
        var goldReward = Math.floor(player.level * 5 * player.permanentBonuses.goldMultiplier);
        player.experience += expReward;
        player.gold += goldReward;
        player.winStreak = (player.winStreak || 0) + 1;
        printColor("Current win streak: " + player.winStreak, "1;36");
        if (player.winStreak === 5) {
            printColor("Achievement unlocked: 5-win streak!", "1;33");
            if (!player.achievements) player.achievements = [];
            player.achievements.push("5-win streak");
        }
        // Random item drop
        if (Math.random() < 0.2) {
            var items = ["Healing Potion", "Strength Elixir", "Gemstone"];
            var drop = items[Math.floor(Math.random() * items.length)];
            if (!player.inventory) player.inventory = [];
            player.inventory.push(drop);
            printColor("You found a " + drop + "!", "1;33");
        }
        // --- Pet Acquisition ---
        if (!player.pet && Math.random() < 0.05) {
            var petList = [
                {name: "Baby Dragon", damage: 12, ability: "heal"},
                {name: "Fire Lizard", damage: 15, ability: "burn"},
                {name: "Battle Hamster", damage: 8, ability: null},
                {name: "Shadow Cat", damage: 10, ability: "dodge"}
            ];
            var chosenPet = petList[Math.floor(Math.random() * petList.length)];
            player.pet = chosenPet;
            printColor("Congratulations! You befriended a pet: " + chosenPet.name + "!", "1;33");
            printColor("It will now help you in battle.", "1;33");
        }

        player.saveGame();
    } else {
        player.winStreak = 0;
    }

    console.print("Press Enter to continue...");
    console.getstr();
    return true;
}

// Bank Function
function bank(player) {
    while (bbs.online && !js.terminated) {
        clearScreen();
        var menu = format(
            "\r\n\x01b" + repeatChar("-", 41) + "\x01n\r\n" +
            "               \x01r\x01hDragon Bank\x01n\r\n" +
            "\x01b" + repeatChar("-", 41) + "\x01n\r\n" +
            "  \x01w(1)\x01n \x01gDeposit Gold \x01w(On hand: %s)\x01n\r\n" +
            "  \x01w(2)\x01n \x01gWithdraw Gold \x01w(In bank: %s)\x01n\r\n" +
            "  \x01w(3)\x01n \x01gTransfer Gold to another Player\x01n\r\n" +
            "  \x01w(4)\x01n \x01gLeave Dragon bank\x01n\r\n" +
            "\x01b" + repeatChar("-", 41) + "\x01n\r\n",
            player.gold.toLocaleString(),
            player.bankBalance.toLocaleString()
        );
        
        console.print(menu);
        console.print("\x01gChoose an action: \x01n");
        var choice = console.getstr(1);
        
        if (!choice) continue;
        
        switch(choice) {
            case '1':
                printColor("You have " + player.gold.toLocaleString() + " gold on hand.", "1;32");
                console.print("Enter amount to deposit or press 1 to deposit all: ");
                var amountStr = console.getstr(10);
                
                if (!amountStr) {
                    printColor("Invalid input!", "1;31");
                    continue;
                }
                
                var amount;
                if (amountStr === '1') {
                    amount = player.gold;
                } else {
                    amount = parseInt(amountStr);
                    if (isNaN(amount) || amount <= 0) {
                        printColor("Invalid input! Please enter a valid number.", "1;31");
                        continue;
                    }
                }
                
                if (amount <= player.gold) {
                    player.gold -= amount;
                    player.bankBalance += amount;
                    printColor("You deposited " + amount.toLocaleString() + " gold. Your balance is now " + player.bankBalance.toLocaleString() + " gold.", "1;32");
                } else {
                    printColor("You don't have that much gold!", "1;31");
                }
                player.saveGame();
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '2':
                printColor("Your bank balance is " + player.bankBalance.toLocaleString() + " gold.", "1;32");
                console.print("Enter amount to withdraw or press 1 to withdraw all: ");
                var amountStr = console.getstr(10);
                
                var amount;
                if (amountStr === '1') {
                    amount = player.bankBalance;
                } else {
                    amount = parseInt(amountStr);
                    if (isNaN(amount) || amount <= 0) {
                        printColor("Invalid input! Please enter a valid number.", "1;31");
                        continue;
                    }
                }
                
                if (amount <= player.bankBalance) {
                    player.bankBalance -= amount;
                    player.gold += amount;
                    printColor("You withdrew " + amount.toLocaleString() + " gold. Your balance is now " + player.bankBalance.toLocaleString() + " gold.", "1;32");
                } else {
                    printColor("You don't have that much gold in the bank!", "1;31");
                }
                player.saveGame();
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '3':
                console.print("Enter the name of the player to transfer gold to: ");
                var recipientName = console.getstr(20);
                
                if (!recipientName || !recipientName.trim()) {
                    printColor("Invalid input! Please enter a valid player name.", "1;31");
                    continue;
                }
                
                console.print("Enter amount to transfer: ");
                var amountStr = console.getstr(10);
                var amount = parseInt(amountStr);
                
                if (isNaN(amount) || amount <= 0) {
                    printColor("Invalid input! Please enter a valid number.", "1;31");
                    continue;
                }
                
                if (amount <= player.bankBalance) {
                    var recipient = Player.loadGame(recipientName.trim());
                    if (recipient) {
                        player.bankBalance -= amount;
                        recipient.bankBalance += amount;
                        recipient.saveGame();
                        player.saveGame();
                        printColor("You transferred " + amount.toLocaleString() + " gold to " + recipientName + ". Your balance is now " + player.bankBalance.toLocaleString() + " gold.", "1;32");
                        
                        // Send message to recipient
                        var recipientMessage = "You received " + amount.toLocaleString() + " gold from " + player.name + ". Your new balance is " + recipient.bankBalance.toLocaleString() + " gold.";
                        sendMessageToPlayer(recipientName.trim(), player.name, recipientMessage);
                    } else {
                        printColor("Player does not exist!", "1;31");
                    }
                } else {
                    printColor("You don't have that much gold in the bank!", "1;31");
                }
                console.print("Press Enter to continue...");
                console.getstr();
                break;
                
            case '4':
                return;
                
            default:
                printColor("Invalid choice!", "1;31");
        }
    }
}

// Messaging Functions
function getMessageCount(playerName) {
    if (!file_exists(MESSAGE_DB_FILE)) return 0;
    
    var file = new File(MESSAGE_DB_FILE);
    if (!file.open("r")) return 0;
    
    try {
        var messageDb = JSON.parse(file.readAll().join(""));
        file.close();
        
        if (messageDb[playerName]) {
            return messageDb[playerName].length;
        }
        return 0;
    } catch (e) {
        file.close();
        return 0;
    }
}

function sendMessage() {
    console.print("Enter the name of the player to message: ");
    var recipient = console.getstr(20);
    if (!recipient) return;
    
    console.print("Enter your message: ");
    var message = console.getstr(100);
    if (!message) return;
    
    sendMessageToPlayer(recipient, user.alias, message);
    printColor("Message sent to " + recipient + ".", "1;32");
    console.print("Press Enter to continue...");
    console.getstr();
}

function sendMessageToPlayer(recipientName, senderName, message) {
    var messageDb = {};
    
    if (file_exists(MESSAGE_DB_FILE)) {
        var file = new File(MESSAGE_DB_FILE);
        if (file.open("r")) {
            try {
                messageDb = JSON.parse(file.readAll().join(""));
            } catch (e) {
                messageDb = {};
            }
            file.close();
        }
    }
    
    if (!messageDb[recipientName]) {
        messageDb[recipientName] = [];
    }
    messageDb[recipientName].push([senderName, message]);
    
    var file = new File(MESSAGE_DB_FILE);
    if (file.open("w")) {
        file.write(JSON.stringify(messageDb, null, 2));
        file.close();
    }
}

function readMessages() {
    var playerName = user.alias;
    
    if (!file_exists(MESSAGE_DB_FILE)) {
        printColor("No messages found.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    var file = new File(MESSAGE_DB_FILE);
    if (!file.open("r")) {
        printColor("No messages found.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    var messageDb;
    try {
        messageDb = JSON.parse(file.readAll().join(""));
    } catch (e) {
        file.close();
        printColor("No messages found.", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    file.close();
    
    if (!messageDb[playerName] || messageDb[playerName].length === 0) {
        printColor("No messages found for " + playerName + ".", "1;31");
        console.print("Press Enter to continue...");
        console.getstr();
        return;
    }
    
    printColor("\nReading messages for " + playerName + ":", "1;34");
    var messages = messageDb[playerName];
    var updatedMessages = [];
    
    for (var i = 0; i < messages.length; i++) {
        var sender = messages[i][0];
        var message = messages[i][1];
        
        printColor("Message " + (i + 1) + ":", "1;32");
        printColor("From: " + sender, "1;32");
        printColor("Message: " + message, "1;32");
        printColor(repeatChar("-", 50), "1;32");
        
        while (bbs.online && !js.terminated) {
            console.print("Options: [D]elete, [S]ave, [N]ext message: ");
            var action = console.getstr(1);
            if (!action) continue;
            
            action = action.toUpperCase();
            if (action === 'D') {
                printColor("Message deleted.", "1;31");
                break;
            } else if (action === 'S') {
                updatedMessages.push([sender, message]);
                printColor("Message saved.", "1;32");
                break;
            } else if (action === 'N') {
                updatedMessages.push([sender, message]);
                break;
            } else {
                printColor("Invalid choice! Please choose [D]elete, [S]ave, or [N]ext.", "1;31");
            }
        }
    }
    
    messageDb[playerName] = updatedMessages;
    var file = new File(MESSAGE_DB_FILE);
    if (file.open("w")) {
        file.write(JSON.stringify(messageDb, null, 2));
        file.close();
    }
}

// Weapon and Armor shops
function dragonWeapons(player) {
    printColor("Welcome to the Dragon Weapons Shop!", "1;33");
    printColor("Purchase a weapon to increase your attack power.", "1;32");
    var weaponCost = player.level * 150;
    printColor("Weapon Cost: " + weaponCost + " gold", "1;32");
    console.print("Do you want to purchase a weapon? [Y]es or [N]o: ");
    var choice = console.getstr(1);
    
    if (choice && choice.toUpperCase() === 'Y' && player.gold >= weaponCost) {
        player.gold -= weaponCost;
        player.strength += player.level * 2;
        printColor("You purchased a weapon! Your strength is now " + player.strength + ".", "1;32");
        player.saveGame();
    } else {
        printColor("You don't have enough gold or chose not to purchase.", "1;31");
    }
    console.print("Press Enter to continue...");
    console.getstr();
}

function dragonArmor(player) {
    printColor("Welcome to the Dragon Armor Shop!", "1;33");
    printColor("Purchase armor to increase your defense.", "1;32");
    var armorCost = player.level * 150;
    printColor("Armor Cost: " + armorCost + " gold", "1;32");
    console.print("Do you want to purchase armor? [Y]es or [N]o: ");
    var choice = console.getstr(1);
    
    if (choice && choice.toUpperCase() === 'Y' && player.gold >= armorCost) {
        player.gold -= armorCost;
        player.level += 1;
        printColor("You purchased armor! Your armor level is now " + player.level + ".", "1;32");
        player.saveGame();
    } else {
        printColor("You don't have enough gold or chose not to purchase.", "1;31");
    }
    console.print("Press Enter to continue...");
    console.getstr();
}

// Online players and high scores
function getOnlinePlayers() {
    var onlinePlayers = [];
    var saveFiles = directory(SAVE_DIR + "*.json");
    
    if (saveFiles) {
        for (var i = 0; i < saveFiles.length; i++) {
            var filename = saveFiles[i];
            var player = Player.loadGame(file_getname(filename).replace('.json', ''));
            if (player && player.isOnline) {
                onlinePlayers.push(player);
            }
        }
    }
    return onlinePlayers;
}

function listPlayersOnline() {
    printColor("\n----- Dragons Currently Online -----", "1;34");
    var onlinePlayers = getOnlinePlayers();
    for (var i = 0; i < onlinePlayers.length; i++) {
        printColor(onlinePlayers[i].name, "1;34");
    }
    console.print("Press Enter to continue...");
    console.getstr();
}

function showHighScores() {
    printColor("\nHigh Scores", "1;32");
    var highScores = [];
    var saveFiles = directory(SAVE_DIR + "*.json");
    
    if (saveFiles) {
        for (var i = 0; i < saveFiles.length; i++) {
            var filename = saveFiles[i];
            var player = Player.loadGame(file_getname(filename).replace('.json', ''));
            if (player) {
                highScores.push([player.name, player.level, player.experience]);
            }
        }
    }
    
    // Sort by experience
    highScores.sort(function(a, b) { return b[2] - a[2]; });
    
    for (var i = 0; i < Math.min(highScores.length, 10); i++) {
        printColor("Name: " + highScores[i][0] + ", Level: " + highScores[i][1] + ", Experience: " + highScores[i][2], "1;32");
    }
    console.print("Press Enter to continue...");
    console.getstr();
}

// Visit IGMs
function visitIGMs(player) {
    while (bbs.online && !js.terminated) {
        clearScreen();
        var menu = 
            "\r\n\x01b" + repeatChar("-", 50) + "\x01n\r\n" +
            "            \x01r\x01hMore areas to discover\x01n\r\n" +
            "\x01b" + repeatChar("-", 50) + "\x01n\r\n";
        for (var i = 0; i < igms.length; i++) {
            var n = (i + 1);
            var nStr = n < 10 ? " " + n : n; // Adds a space for single digits
            menu += " \x01w(" + nStr + ")\x01n \x01g" + igms[i].name + "\x01n\r\n";
        }
        var retNum = igms.length + 1;
        var retStr = retNum < 10 ? " " + retNum : retNum;
        menu += " \x01w(" + retStr + ")\x01n \x01gReturn to Main Menu\x01n\r\n";
        menu += "\x01b" + repeatChar("-", 50) + "\x01n\r\n";
        console.print(menu);
        console.print("\x01gChoose an IGM to visit: \x01n");
        var choiceStr = console.getstr(4);
        var choice = parseInt(choiceStr);
        if (isNaN(choice) || choice < 1 || choice > igms.length + 1) {
            printColor("Invalid choice!", "1;31");
            continue;
        }
        if (choice === igms.length + 1) break;
        igms[choice - 1].enter(player);
    }
}

// Display welcome screen
function displayWelcomeScreen() {
    var welcomeFile = js.exec_dir + "rdq2.ans";
    if (file_exists(welcomeFile)) {
        console.printfile(welcomeFile);
    } else {
        printColor("=== RED DRAGON QUEST ===", "1;32");
        printColor("Welcome to the realm of dragons!", "1;33");
        printColor("", "1;37");
        printColor("(E) Enter the Realm", "1;32");
        printColor("(Q) Quit", "1;31");
    }
    
    var choice = console.getstr(1);
    
    if (!choice) {
        // If no key pressed or Enter, default to enter the realm
        return true;
    }
    
    choice = choice.toUpperCase();
    
    if (choice === 'Q') {
        printColor("\nFarewell, brave adventurer! The realm will await your return.", "1;33");
        return false; // Player chose to quit
    } else {
        // Any other key (including 'E') enters the realm
        return true; // Player chose to enter
    }
}

// Display main menu
function displayMainMenu(numMessages, player) {
    var maxSpecialAttacks = player.level * 2;
    var remainingSpecialAttacks = maxSpecialAttacks - player.specialAttacksUsed;
    var currentDate = getDateString();
    
    if (player.lastFightDate !== currentDate) {
        player.dailyFights = 0;
        player.lastFightDate = currentDate;
    }
    
    var remainingFights = 20 - player.dailyFights;
    var resurrectionsLeft = 3 - player.dailyResurrections;
    
    // Calculate centering (assuming 80 column terminal)
    var menuWidth = 50;
    var centerOffset = Math.floor((80 - menuWidth) / 2);
    var spaces = repeatChar(" ", centerOffset);
    
    var menu = format(
        "\r\n%s\x01b" + repeatChar("-", 50) + "\x01n\r\n" +
        "%s        \x01r\x01hRed Dragon Quest\x01n \x01b-\x01n \x01r\x01hMain Menu\x01n    \x01bv.2.0\x01n\r\n" +
        "%s\x01b" + repeatChar("-", 50) + "\x01n\r\n" +
        "%s  \x01w(1)\x01n \x01gFind a Fight \x01y%2d\x01n\x01b/\x01n\x01y20\x01n    \x01w(7)\x01n \x01gSend Message\x01n\r\n" +
        "%s  \x01w(2)\x01n \x01gGo to the Inn\x01n         \x01w(8)\x01n \x01gRead Messages \x01y%3d\x01n\r\n" +
        "%s  \x01w(3)\x01n \x01gFight Other Players\x01n   \x01w(9)\x01n \x01gDragon Bank\x01n\r\n" +
        "%s  \x01w(4)\x01n \x01gDragons Online\x01n       \x01w(10)\x01n \x01gDragon Weapons\x01n\r\n" +
        "%s  \x01w(5)\x01n \x01gDragon Scores\x01n        \x01w(11)\x01n \x01gDragon Armory\x01n\r\n" +
        "%s  \x01w(6)\x01n \x01gDragon Journey\x01n       \x01w(12)\x01n \x01gSave and Exit\x01n\r\n" +
        "%s\x01b" + repeatChar("-", 50) + "\x01n\r\n",
        spaces, spaces, spaces, spaces, remainingFights, spaces, numMessages, 
        spaces, spaces, spaces, spaces, spaces
    );
    
    console.print(menu);
    
    // Split the status into two shorter lines to prevent wrapping
    var status = format(
        "%s           Gold on Hand\x01g:\x01n \x01w%s\x01n\r\n" +
        "%s           Special Attacks\x01g:\x01n \x01w%2d\x01n \x01r|\x01n \x01wResurrections\x01g:\x01n \x01w%1d\x01n\r\n" +
        "\r\n%s\x01gChoose an action\x01g:\x01n ",
        spaces, player.gold.toLocaleString(), 
        spaces, remainingSpecialAttacks, resurrectionsLeft,
        spaces
    );
    
    console.print(status);
}

// Main game function
function main() {
    // Show welcome screen and check if player wants to continue
    if (!displayWelcomeScreen()) {
        // Player chose to quit from welcome screen
        return;
    }

    var playerName = user.alias;
    var player = Player.loadGame(playerName);

    if (!player) {
        printColor("Welcome! Creating a new game for " + playerName + ".", "1;32");
        player = new Player(playerName);
        player.saveGame();
    }

    // Check if player is dead from previous session
    if (!player.checkDeadPlayerOnEntry()) {
        // Player is dead and chose not to resurrect or has no resurrections
        player.isOnline = false;
        player.saveGame();
        return;
    }

    player.checkRetroactiveMastery();

    player.isOnline = true;
    player.saveGame();

    // Main game loop
    while (bbs.online && !js.terminated) {
        clearScreen();
        var currentDate = getDateString();
        if (player.lastRestrictionDate !== currentDate) {
            player.dailyResurrections = 0;
            player.lastRestrictionDate = currentDate;
        }

        if (player.dailyResurrections >= 3) {
            printColor("You have reached the maximum number of resurrections for today. Try again tomorrow.", "1;31");
            player.isOnline = false;
            player.saveGame();
            break;
        }

        var numMessages = getMessageCount(playerName);
        displayMainMenu(numMessages, player);
        var choice = console.getstr(2);

        if (!choice) continue;

        // Trigger random events
        triggerRandomEvent(player);

        switch(choice) {
            case '1':
                // Find a Fight
                var currentDate = getDateString();
                if (player.lastFightDate !== currentDate) {
                    player.dailyFights = 0;
                    player.lastFightDate = currentDate;
                }

                // Check if boss fight is available
                var bossCheck = canFightBoss(player);

                if (bossCheck.canFight) {
                    // Show boss option
                    clearScreen();
                    printColor("=== DRAGON FIGHTING OPTIONS ===", "1;34");
                    printColor("(1) Find a regular enemy to fight", "1;32");
                    printColor("(2) Challenge the ANCIENT DRAGON LORD! [DrAgOn]", "1;31");
                    printColor("(3) Return to main menu", "1;36");
                    printColor("", "1;37");
                    printColor("Regular fights remaining today: " + (20 - player.dailyFights), "1;33");

                    console.print("Choose your battle: ");
                    var fightChoice = console.getstr(1);

                    if (fightChoice === '2') {
                        fightAncientDragonLord(player);
                        break;
                    } else if (fightChoice === '3') {
                        break;
                    } else if (fightChoice !== '1') {
                        printColor("Invalid choice!", "1;31");
                        break;
                    }
                    // If choice is '1', continue to regular fight below
                } else if (player.level >= 200) {
                    // Boss not available today but player is high enough level
                    printColor("ANCIENT DRAGON LORD: " + bossCheck.reason, "1;31");
                    console.print("Press Enter to continue to regular fights...");
                    console.getstr();
                }

                // Regular fight logic
                if (player.dailyFights >= 20) {
                    printColor("You have reached the maximum number of fights for today. Try again tomorrow.", "1;31");
                    console.print("Press Enter to continue...");
                    console.getstr();
                } else {
                    player.dailyFights += 1;
                    player.saveGame();

                    var enemy = new Enemy(player.level);
                    enemy.resetHealth();
                    printColor("You are fighting " + enemy.name + "!", "1;34");

                    // --- Enhanced Battle Loop with RPG Features ---
                    while (enemy.health > 0 && player.isAlive() && bbs.online && !js.terminated) {
                        // Process player status effects
                        processStatusEffects(player);
                        if (player.statusEffects && player.statusEffects.some(function(e) { return e.type === 'stun'; })) {
                            printColor("You are stunned and lose your turn!", "1;31");
                        } else {
                            printColor("Player Health: " + player.health + ", Enemy Health: " + enemy.health, "1;34");
                            console.print("Do you want to [A]ttack, [S]kill, [P] Special Attack, [H]eal, or [R]un? ");
                            var action = console.getstr(1);
                            if (!action) continue;
                            action = action.toUpperCase();
                            if (action === 'A') {
                                var damage = player.attack(enemy);
                                printColor("You attacked the enemy for " + damage + " damage. Enemy Health: " + enemy.health, "1;32");
                            } else if (action === 'S') {
                                playerUseSkill(player, enemy);
                            } else if (action === 'P') {
                                var damage = player.specialAttack(enemy);
                                if (damage > 0) {
                                    printColor("You used a special attack for " + damage + " damage!", "1;33");
                                }
                            } else if (action === 'H') {
                                console.print("Enter the amount to heal (1 gold per hitpoint): ");
                                var healAmountStr = console.getstr(3);
                                var healAmount = parseInt(healAmountStr) || 0;
                                player.heal(healAmount);
                            } else if (action === 'R') {
                                printColor("You ran away!", "1;31");
                                break;
                            } else {
                                printColor("Invalid action!", "1;31");
                            }
                        }
                        // Random battle event
                        if (Math.random() < 0.07) battleEvent(player, enemy);

                        // Enemy turn
                        if (enemy.health > 0) {
                            processStatusEffects(enemy);
                            if (enemy.statusEffects && enemy.statusEffects.some(function(e) { return e.type === 'stun'; })) {
                                printColor("Enemy is stunned and skips a turn!", "1;31");
                                continue;
                            }
                            var enemyDamage = enemy.attack(player);
                            if (player.statusEffects && player.statusEffects.some(function(e) { return e.type === 'defend'; })) {
                                enemyDamage = Math.floor(enemyDamage / 2);
                            }
                            printColor("The enemy attacked you for " + enemyDamage + " damage. Your Health: " + player.health, "1;31");
                        }

                        if (player.pet && Math.random() < 0.4) {
                            var petDamage = player.pet.damage + Math.floor(Math.random() * 5);
                            enemy.health -= petDamage;
                            printColor("Your pet " + player.pet.name + " attacks and deals " + petDamage + " damage!", "1;36");
                            if (player.pet.ability === "heal" && Math.random() < 0.15) {
                                var heal = 10 + Math.floor(Math.random() * 10);
                                player.health += heal;
                                printColor("Your pet " + player.pet.name + " heals you for " + heal + " HP!", "1;32");
                            }
                            if (player.pet.ability === "burn" && Math.random() < 0.1) {
                                enemy.statusEffects.push({type: 'burn', turns: 2, amount: 8});
                                printColor("Your pet's fire burns the enemy!", "1;31");
                            }
                            if (player.pet.ability === "dodge" && Math.random() < 0.1) {
                                player.statusEffects.push({type: 'defend', turns: 1, amount: 0});
                                printColor("Your pet helps you dodge—damage halved next attack!", "1;36");
                            }
                        }

                        // Check for player death
                        if (player.health <= 0) {
                            if (!player.handlePlayerDeath()) {
                                player.isOnline = false;
                                player.saveGame();
                                return;
                            }
                            break;
                        }
                    }

                    if (player.isAlive() && enemy.health <= 0) {
                        printColor("You defeated the enemy!", "1;32");
                        var expReward = Math.floor(player.level * 10 * player.permanentBonuses.experienceMultiplier);
                        var goldReward = Math.floor(player.level * 5 * player.permanentBonuses.goldMultiplier);
                        player.experience += expReward;
                        player.gold += goldReward;
                        player.winStreak = (player.winStreak || 0) + 1;
                        printColor("Current win streak: " + player.winStreak, "1;36");
                        if (player.winStreak === 5) {
                            printColor("Achievement unlocked: 5-win streak!", "1;33");
                            if (!player.achievements) player.achievements = [];
                            player.achievements.push("5-win streak");
                        }
                        // Random item drop
                        if (Math.random() < 0.2) {
                            var items = ["Healing Potion", "Strength Elixir", "Gemstone"];
                            var drop = items[Math.floor(Math.random() * items.length)];
                            if (!player.inventory) player.inventory = [];
                            player.inventory.push(drop);
                            printColor("You found a " + drop + "!", "1;33");
                        }
                        // --- Pet Acquisition ---
                        if (!player.pet && Math.random() < 0.05) {
                            var petList = [
                                {name: "Baby Dragon", damage: 12, ability: "heal"},
                                {name: "Fire Lizard", damage: 15, ability: "burn"},
                                {name: "Battle Hamster", damage: 8, ability: null},
                                {name: "Shadow Cat", damage: 10, ability: "dodge"}
                            ];
                            var chosenPet = petList[Math.floor(Math.random() * petList.length)];
                            player.pet = chosenPet;
                            printColor("Congratulations! You befriended a pet: " + chosenPet.name + "!", "1;33");
                            printColor("It will now help you in battle.", "1;33");
                        }
                        player.saveGame();
                        console.print("Press Enter to continue...");
                        console.getstr();
                    } else {
                        player.winStreak = 0;
                    }
                }
                break;

            case '2':
                // Go to Inn
                inn(player);
                break;

            case '3':
                // Fight Other Players - NOW CALLS THE PROPER PvP FUNCTION
                fightOtherPlayers(player);
                break;

            case '4':
                // Dragons Online
                listPlayersOnline();
                break;

            case '5':
                // Dragon Scores
                clearScreen();
                printColor("=== SCORING OPTIONS ===", "1;34");
                printColor("(1) Regular High Scores", "1;32");
                printColor("(2) Hall of Heroes", "1;33");
                printColor("(3) Return to main menu", "1;36");

                console.print("Choose display: ");
                var scoreChoice = console.getstr(1);

                if (scoreChoice === '1') {
                    showHighScores();
                } else if (scoreChoice === '2') {
                    showHallOfHeroes();
                }
                break;

            case '6':
                // Dragon Journey
                journey(player);
                break;

            case '7':
                // Send Message
                sendMessage();
                break;

            case '8':
                // Read Messages
                readMessages();
                break;

            case '9':
                // Dragon Bank
                bank(player);
                break;

            case '10':
                // Dragon Weapons
                dragonWeapons(player);
                break;

            case '11':
                // Dragon Armory
                dragonArmor(player);
                break;

            case '12':
                // Save and Exit
                player.isOnline = false;
                player.saveGame();
                printColor("Game saved. Goodbye!", "1;32");
                return;

            default:
                printColor("Invalid choice! Returning to main menu.", "1;31");
        }
    }

    // Cleanup on exit
    player.isOnline = false;
    player.saveGame();
}

// Initialize and run the game
ensureSaveDir();
main();
