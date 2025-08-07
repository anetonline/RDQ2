# Red Dragon Quest 2 v2.0 - Installation Guide

## Overview
Red Dragon Quest 2 is a complete fantasy RPG door game for Synchronet BBS systems. Players can fight monsters, gain experience, master multiple character classes, gamble in the casino, and interact with other players through messaging and banking systems. (LORD Inspired)

## System Requirements
- Synchronet BBS v3.17 or higher
- JavaScript support enabled
- Minimum 5MB free disk space for game files and player saves

## Files Included

rdq2.js              - Main game executable
rdq2_admin.js        - Admin/Player editor
RedDragonQuest.ans   - Optional ANSI welcome screen
installation.doc     - This installation guide
file_id.diz          - File description


## Installation Instructions

### Step 1: Create Game Directory
1. Create a new directory in your Synchronet `xtrn` folder:
   
   /sbbs/xtrn/rdq2/
   

2. Unzip game files to this directory:
   
   /sbbs/xtrn/rdq2/rdq2.js
   /sbbs/xtrn/rdq2/rdq2_admin.js
   /sbbs/xtrn/rdq2/RedDragonQuest.ans
   

### Step 2: Configure SCFG (Synchronet Configuration)
1. Run SCFG (Synchronet Configuration)
2. Navigate to: `External Programs` → `Online Programs (Doors)
3. Add a new entry with the following settings:


Name                    :   Red Dragon Quest 2
Internal Code           :   RDQ2
Start-up Directory      :   ../xtrn/rdq2
Command Line            :   ?rdq2.js
Clean-up Command Line   : 
Execution Cost          :   None
Access Requirements     : 
Execution Requirements  : 
Multiple Concurrent Users:  Yes
Intercept Standard I/O  :   No
Native (32-bit) Executable: No
Use Shell to Execute    :   No
Modify User Data        :   No
Execute on Event        :   No
BBS Drop File Type      :   None
Place Drop File In      :   Node Directory
Time Options            :   No


### Step 3: Configure Admin Access (Optional - I have mine in my Operator Menu)
To set up the admin editor, add another entry:


Name                    : RDQ2 Admin Editor
Internal Code           : RDQ2ADM
Start-up Directory      : ../xtrn/rdq2
Command Line            : ?rdq2_admin.js
Access Requirements     : LEVEL 90 (or appropriate sysop level)


### Step 4: Test Installation
1. Restart Synchronet BBS or reload the configuration
2. Log in and access the game through your door menu
3. Create a new character and verify the game works properly
4. Check that save files are created in `/sbbs/xtrn/rdq2/saves/`

## Game Features

### Player Features
- Character Classes: Good, Evil, Beast, Thief, Magical, Demon
- Combat System: Normal and special attacks with daily limits
- Resurrection System: 3 resurrections per day when defeated
- Experience & Leveling: Gain XP to level up and increase stats
- Class Mastery: Master all classes to become Top Dragon
- Dragon Inn: Healing, stats viewing, room rental
- Dragon Bank: Deposit, withdraw, transfer gold between players
- Dragon Casino: Slot machines, roulette, dice games
- Journey System: Explore Dark Forest, Mystic Mountains, Abandoned Castle
- Player vs Player: Special fighting areas (level 5+ required)
- Messaging System: Send and receive messages between players
- Shopping: Weapon and armor shops to increase stats

### Daily Limits
- Fights: 20 regular fights per day
- Special Fighting Areas: 4 access per day
- Resurrections: 3 per day when defeated
- Mystic Mountains: Once per day treasure hunt
- Player Name Changes: Once per 30 days

### Admin Features
- Player Editor: Modify gold, level, experience, health, class
- Message Management: View and delete player messages
- Player Deletion: Remove players from the game
- Backup System: Automatic backups when editing players

## File Structure
After installation and first run, the directory structure will be:

/sbbs/xtrn/rdq2/
├── rdq2.js
├── rdq2_admin.js
├── RedDragonQuest.ans      (Welcome Screen)
├── saves/                  (created automatically)
│   ├── player1.json
│   ├── player2.json
│   └── ...
└── message_db.json         (created automatically)


## Configuration Options

### Security Settings
- Regular players need no special access requirements
- Admin editor should be restricted to sysop level (LEVEL 90 or similar)
- Consider setting time limits if desired

** Troubleshooting

### Common Issues

Game won't start
- Verify JavaScript support is enabled in Synchronet
- Check file permissions on game directory
- Ensure `sbbsdefs.js` is available in Synchronet's `exec` directory

Save files not created
- Check write permissions on game directory
- Verify the `saves` directory can be created automatically
- Ensure sufficient disk space

Players can't fight/heal
- Check that gold values are reasonable (healing costs gold)
- Verify daily limits haven't been exceeded
- Ensure player level meets requirements for special areas

Admin editor access denied
- Verify user has appropriate access level
- Check SCFG configuration for admin door entry
- Ensure correct Internal Code is used

### Log Files
Monitor Synchronet's log files for any JavaScript errors:
- Check `data/logs/` directory for error messages
- Look for JavaScript runtime errors related to RDQ2

## Support and Credits

### Original Credits
- Original game by StingRay - A-Net Online BBS
- Converted to Synchronet JavaScript by A-Net Online BBS Team

### Support
For support or bug reports:
- Visit: A-Net Online BBS (telnet: bbs.a-net.online:1337 - http://a-net.fyi)
- Contact: StingRay or the A-Net Online BBS development team @ stingray@a-net-online.lol

### Version History
- v2.0: Complete Synchronet JavaScript conversion with enhanced features
- v1.x: Original Python/Mystic BBS version converted to JavaScript for Synchronet BBS

## License
This game is provided as-is for use on Synchronet BBS systems. Feel free to modify and redistribute with appropriate credits maintained.

---
*Installation complete! Your players can now enjoy Red Dragon Quest 2!*
