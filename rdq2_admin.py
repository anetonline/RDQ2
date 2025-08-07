#!/usr/bin/env python2
# -*- coding: utf-8 -*-

# Red Dragon Quest Admin Editor v2.0 - Mystic BBS Version
# Cross-platform compatible (Windows/Linux)
# Updated with all v2.0 features to match the Synchronet JavaScript version

import os
import sys
import pickle
import datetime
import shutil
import platform

script_dir = os.path.dirname(os.path.abspath(__file__))

# Cross-platform screen clearing
def clear_screen():
    if platform.system() == 'Windows':
        os.system('cls')
    else:
        os.system('clear')

def get_date_string():
    now = datetime.date.today()
    return "{}-{}-{}".format(now.year, now.month, now.day)

def get_current_datetime():
    now = datetime.datetime.utcnow()
    return now.strftime("%Y-%m-%d %H:%M:%S")

# Import game classes if available
def import_game_classes():
    """Import the real classes from your game file"""
    game_file = os.path.join(script_dir, "RDQ2.py")
    if os.path.exists(game_file):
        try:
            import imp
            game_module = imp.load_source('game', game_file)
            return game_module.Player, game_module.Item, getattr(game_module, 'heal', None)
        except Exception as e:
            print("Warning: Could not import from game file:", str(e))
    return None, None, None

RealPlayer, RealItem, real_heal = import_game_classes()

# Fallback classes if import fails
if not RealPlayer:
    print("Creating fallback classes...")
    
    CLASSES = ['Good', 'Evil', 'Beast', 'Thief', 'Magical', 'Demon']
    
    def select_class():
        """Dummy select_class function for fallback"""
        return 'Good'
    
    class Player(object):
        def __init__(self, name, chosen_class=None):
            self.name = name
            self.chosen_class = chosen_class if chosen_class else 'Good'
            self.level = 1
            self.experience = 0
            self.next_level_exp = 100
            self.medals = 0
            self.gold = 100
            self.bank_balance = 0
            self.mastered_classes = []
            self.top_dragon = False
            self.last_igm_visit = None
            self.health = 100
            self.strength = 10
            self.inventory = []
            self.is_online = False
            self.special_attacks_used = 0
            self.last_mystic_mountains_visit = None
            self.special_fighting_area_accesses = 0
            self.last_special_fighting_area_access = None
            self.daily_fights = 0
            self.last_fight_date = None
            self.daily_resurrections = 0
            self.last_restriction_date = None
            self.daily_pvp_fights = 0
            self.last_pvp_fight_date = None
            self.retroactive_mastery_checked = False
            self.boss_victories = 0
            self.hero_points = 0
            self.current_round = 1
            self.hero_title = ""
            self.last_boss_fight_date = None
            self.daily_pvp_targets = {}
            self.last_pvp_target_reset = None
            self.permanent_bonuses = {
                'health_bonus': 0,
                'strength_bonus': 0,
                'experience_multiplier': 1.0,
                'gold_multiplier': 1.0
            }

        def reset_health(self):
            self.health = 100 + self.level * 10 + self.permanent_bonuses['health_bonus']
            
        def save_game(self):
            file_path = os.path.join(script_dir, "{}.sav".format(self.name))
            with open(file_path, 'wb') as f:
                pickle.dump(self, f)

        @classmethod
        def load_game(cls, name):
            file_path = os.path.join(script_dir, "{}.sav".format(name))
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'rb') as f:
                        player = pickle.load(f)

                    # Ensure all new v2.0 properties exist (backward compatibility)
                    defaults = {
                        'bank_balance': 0, 'special_attacks_used': 0,
                        'last_mystic_mountains_visit': None, 'special_fighting_area_accesses': 0,
                        'last_special_fighting_area_access': None, 'daily_fights': 0,
                        'last_fight_date': None, 'daily_resurrections': 0,
                        'last_restriction_date': None, 'daily_pvp_fights': 0,
                        'last_pvp_fight_date': None, 'retroactive_mastery_checked': False,
                        'boss_victories': 0, 'hero_points': 0, 'current_round': 1,
                        'hero_title': "", 'last_boss_fight_date': None,
                        'daily_pvp_targets': {}, 'last_pvp_target_reset': None,
                        'permanent_bonuses': {
                            'health_bonus': 0, 'strength_bonus': 0,
                            'experience_multiplier': 1.0, 'gold_multiplier': 1.0
                        }
                    }
                    
                    for attr, default in defaults.items():
                        if not hasattr(player, attr):
                            setattr(player, attr, default)
                    return player
                except Exception:
                    return None
            return None

    class Item(object):
        def __init__(self, name, effect):
            self.name = name
            self.effect = effect

        def use(self, player):
            self.effect(player)

    def heal(player):
        player.health = min(player.health + 20, 150)
        return "You used a health potion and recovered 20 health."

    RealPlayer = Player
    RealItem = Item
    real_heal = heal

# Set up module globals
import __main__
__main__.Player = RealPlayer
__main__.Item = RealItem
__main__.heal = real_heal

# Constants
CLASSES = ['Good', 'Evil', 'Beast', 'Thief', 'Magical', 'Demon']

def load_player_safe(username):
    save_file = os.path.join(script_dir, username + ".sav")
    print("Attempting to load:", save_file)
    
    if not os.path.exists(save_file):
        print("Save file does not exist!")
        return None
    
    file_size = os.path.getsize(save_file)
    print("File size:", file_size, "bytes")
    
    if file_size < 50:
        print("File appears corrupted (too small)")
        return None
    
    try:
        player_obj = RealPlayer.load_game(username)
        
        if player_obj is None:
            print("Game's load_game method returned None - file may be corrupted")
            return None
        
        print("Successfully loaded player object using game's method")
        print("Player name:", getattr(player_obj, 'name', 'Unknown'))
        print("Player class:", getattr(player_obj, 'chosen_class', 'Unknown'))
        print("Player level:", getattr(player_obj, 'level', 'Unknown'))
        print("Player gold:", getattr(player_obj, 'gold', 'Unknown'))
        
        return player_obj
        
    except Exception as e:
        print("Error loading player:", str(e))
        import traceback
        traceback.print_exc()
        return None

def save_player_safe(player_obj, username):
    save_file = os.path.join(script_dir, username + ".sav")
    backup_file = save_file + ".backup"
    
    try:
        if os.path.exists(save_file):
            shutil.copy2(save_file, backup_file)
            print("Created backup:", backup_file)
        
        # Ensure all required v2.0 attributes exist
        required_attrs = {
            'name': username,
            'chosen_class': 'Good',
            'level': 1,
            'experience': 0,
            'next_level_exp': 100,
            'medals': 0,
            'gold': 100,
            'bank_balance': 0,
            'mastered_classes': [],
            'top_dragon': False,
            'last_igm_visit': None,
            'health': 100,
            'strength': 10,
            'inventory': [],
            'is_online': False,
            'special_attacks_used': 0,
            'last_mystic_mountains_visit': None,
            'special_fighting_area_accesses': 0,
            'last_special_fighting_area_access': None,
            'daily_fights': 0,
            'last_fight_date': None,
            'daily_resurrections': 0,
            'last_restriction_date': None,
            'daily_pvp_fights': 0,
            'last_pvp_fight_date': None,
            'retroactive_mastery_checked': False,
            'boss_victories': 0,
            'hero_points': 0,
            'current_round': 1,
            'hero_title': "",
            'last_boss_fight_date': None,
            'daily_pvp_targets': {},
            'last_pvp_target_reset': None,
            'permanent_bonuses': {
                'health_bonus': 0,
                'strength_bonus': 0,
                'experience_multiplier': 1.0,
                'gold_multiplier': 1.0
            }
        }
        
        for attr, default_value in required_attrs.items():
            if not hasattr(player_obj, attr):
                setattr(player_obj, attr, default_value)
                print("Added missing attribute:", attr, "=", default_value)
        
        # Fix inventory if needed
        if hasattr(player_obj, 'inventory') and player_obj.inventory:
            new_inventory = []
            for item in player_obj.inventory:
                if not isinstance(item, RealItem):
                    name = getattr(item, 'name', 'Health Potion')
                    effect = real_heal
                    new_item = RealItem(name, effect)
                    new_inventory.append(new_item)
                else:
                    new_inventory.append(item)
            player_obj.inventory = new_inventory
        elif not hasattr(player_obj, 'inventory') or not player_obj.inventory:
            player_obj.inventory = [RealItem("Health Potion", real_heal)]
        
        player_obj.save_game()
        
        print("Successfully saved player data using game's method")
        
        try:
            test_player = RealPlayer.load_game(username)
            if test_player is not None:
                print("Save verification successful!")
                print("Verified player name:", getattr(test_player, 'name', 'Unknown'))
                print("Verified player class:", getattr(test_player, 'chosen_class', 'Unknown'))
            else:
                print("Warning: Save verification failed - load_game returned None")
        except Exception as e:
            print("Warning: Save verification failed:", str(e))
        
        return True
        
    except Exception as e:
        print("Error saving player:", str(e))
        import traceback
        traceback.print_exc()
        return False

def create_new_player_with_defaults(username):
    """Create a new player with reasonable default stats"""
    player = RealPlayer(username, 'Good')
    
    player.gold = 150
    player.chosen_class = 'Good'
    player.strength = 10
    player.top_dragon = False
    player.mastered_classes = []
    player.health = 100
    player.bank_balance = 0
    player.medals = 0
    player.daily_resurrections = 0
    player.special_fighting_area_accesses = 0
    player.last_mystic_mountains_visit = None
    player.last_special_fighting_area_access = None
    player.next_level_exp = 100
    player.special_attacks_used = 0
    player.is_online = False
    player.level = 1
    player.daily_fights = 0
    player.experience = 0
    player.last_fight_date = None
    player.last_restriction_date = datetime.date.today()
    player.last_igm_visit = None
    player.daily_pvp_fights = 0
    player.last_pvp_fight_date = None
    player.retroactive_mastery_checked = False
    player.boss_victories = 0
    player.hero_points = 0
    player.current_round = 1
    player.hero_title = ""
    player.last_boss_fight_date = None
    player.daily_pvp_targets = {}
    player.last_pvp_target_reset = None
    player.permanent_bonuses = {
        'health_bonus': 0,
        'strength_bonus': 0,
        'experience_multiplier': 1.0,
        'gold_multiplier': 1.0
    }
    
    health_potion = RealItem("Health Potion", real_heal)
    player.inventory = [health_potion]
    
    return player

def list_players():
    clear_screen()
    print("\n=== Player List ===")
    players = []
    for file in os.listdir(script_dir):
        if file.endswith(".sav"):
            username = file[:-4]
            players.append(username)
            file_path = os.path.join(script_dir, file)
            file_size = os.path.getsize(file_path)
            print("Found save file: {} ({} bytes)".format(file, file_size))
    
    if not players:
        print("No player save files found!")
        return []
    
    print("\nAvailable players:")
    players.sort()  # Sort alphabetically like JavaScript version
    for i, player in enumerate(players, 1):
        print("{}. {}".format(i, player))
    return players

def display_player_info(player_obj):
    print("\n" + "=" * 60)
    print("=== PLAYER INFORMATION: {} ===".format(player_obj.name.upper()))
    print("=" * 60)
    
    # Basic Stats
    print("\n--- BASIC STATS ---")
    print("Gold: {:,}".format(getattr(player_obj, 'gold', 0)))
    print("Bank Balance: {:,}".format(getattr(player_obj, 'bank_balance', 0)))
    print("Level: {}".format(getattr(player_obj, 'level', 1)))
    print("Experience: {:,}".format(getattr(player_obj, 'experience', 0)))
    print("Next Level Exp: {:,}".format(getattr(player_obj, 'next_level_exp', 100)))
    print("Strength: {}".format(getattr(player_obj, 'strength', 10)))
    print("Health: {}".format(getattr(player_obj, 'health', 100)))
    print("Class: {}".format(getattr(player_obj, 'chosen_class', 'Good')))
    
    # Hero Status
    boss_victories = getattr(player_obj, 'boss_victories', 0)
    if boss_victories > 0:
        print("\n--- HERO STATUS ---")
        print("Boss Victories: {}".format(boss_victories))
        print("Hero Points: {}".format(getattr(player_obj, 'hero_points', 0)))
        print("Hero Title: {}".format(getattr(player_obj, 'hero_title', 'None')))
        print("Current Round: {}".format(getattr(player_obj, 'current_round', 1)))
    
    print("Top Dragon: {}".format("Yes" if getattr(player_obj, 'top_dragon', False) else "No"))
    
    # Daily Restrictions
    print("\n--- DAILY RESTRICTIONS ---")
    print("Daily Fights Used: {}/20".format(getattr(player_obj, 'daily_fights', 0)))
    print("Daily PvP Fights Used: {}/10".format(getattr(player_obj, 'daily_pvp_fights', 0)))
    print("Daily Resurrections Used: {}/3".format(getattr(player_obj, 'daily_resurrections', 0)))
    print("Special Attacks Used: {}".format(getattr(player_obj, 'special_attacks_used', 0)))
    print("Special Area Accesses: {}/4".format(getattr(player_obj, 'special_fighting_area_accesses', 0)))
    
    # Permanent Bonuses
    permanent_bonuses = getattr(player_obj, 'permanent_bonuses', {})
    if any(v != 0 and v != 1.0 for v in permanent_bonuses.values()):
        print("\n--- PERMANENT BONUSES ---")
        print("Health Bonus: +{}".format(permanent_bonuses.get('health_bonus', 0)))
        print("Strength Bonus: +{}".format(permanent_bonuses.get('strength_bonus', 0)))
        print("Experience Multiplier: {:.1f}x".format(permanent_bonuses.get('experience_multiplier', 1.0)))
        print("Gold Multiplier: {:.1f}x".format(permanent_bonuses.get('gold_multiplier', 1.0)))
    
    # Mastered Classes
    mastered_classes = getattr(player_obj, 'mastered_classes', [])
    print("\n--- MASTERED CLASSES ---")
    if mastered_classes:
        print("Mastered: {}".format(", ".join(mastered_classes)))
    else:
        print("Mastered: None")
    
    # Status
    print("\n--- STATUS ---")
    print("Online: {}".format("Yes" if getattr(player_obj, 'is_online', False) else "No"))
    print("Medals: {}".format(getattr(player_obj, 'medals', 0)))

def edit_basic_stats(player_obj):
    while True:
        clear_screen()
        print("\n=== Edit Basic Stats for: {} ===".format(player_obj.name))
        
        print("1. Gold: {:,}".format(getattr(player_obj, 'gold', 0)))
        print("2. Bank Balance: {:,}".format(getattr(player_obj, 'bank_balance', 0)))
        print("3. Level: {}".format(getattr(player_obj, 'level', 1)))
        print("4. Experience: {:,}".format(getattr(player_obj, 'experience', 0)))
        print("5. Next Level Exp: {:,}".format(getattr(player_obj, 'next_level_exp', 100)))
        print("6. Strength: {}".format(getattr(player_obj, 'strength', 10)))
        print("7. Health: {}".format(getattr(player_obj, 'health', 100)))
        print("8. Class: {}".format(getattr(player_obj, 'chosen_class', 'Good')))
        print("9. Return to main menu")
        
        try:
            choice = raw_input("\nEnter choice: ")
            
            if choice in ['1', '2', '3', '4', '5', '6', '7']:
                attr_map = {
                    '1': 'gold',
                    '2': 'bank_balance',
                    '3': 'level',
                    '4': 'experience',
                    '5': 'next_level_exp',
                    '6': 'strength',
                    '7': 'health'
                }
                
                attr = attr_map[choice]
                current_value = getattr(player_obj, attr, 0)
                print("Current {}: {}".format(attr, current_value))
                
                try:
                    new_value = int(raw_input("Enter new {} value: ".format(attr)))
                    if new_value >= 0:
                        setattr(player_obj, attr, new_value)
                        print("{} updated from {} to {}!".format(attr.capitalize(), current_value, new_value))
                    else:
                        print("{} cannot be negative!".format(attr.capitalize()))
                except ValueError:
                    print("Invalid input! Please enter a number.")
                    
            elif choice == '8':
                edit_player_class(player_obj)
            elif choice == '9':
                return
            else:
                print("Invalid choice!")
                
            if choice != '8':
                raw_input("\nPress Enter to continue...")
            
        except KeyboardInterrupt:
            return
        except Exception as e:
            print("Error:", str(e))
            raw_input("\nPress Enter to continue...")

def edit_player_class(player_obj):
    clear_screen()
    print("\n=== Change Class for: {} ===".format(player_obj.name))
    print("Current class: {}".format(getattr(player_obj, 'chosen_class', 'Good')))
    
    print("\nAvailable classes:")
    for i, cls in enumerate(CLASSES, 1):
        print("{}. {}".format(i, cls))
    
    try:
        cls_choice = int(raw_input("\nEnter class number (or 0 to cancel): "))
        if 1 <= cls_choice <= len(CLASSES):
            new_class = CLASSES[cls_choice-1]
            old_class = getattr(player_obj, 'chosen_class', 'Good')
            setattr(player_obj, 'chosen_class', new_class)
            print("Class updated from {} to {}!".format(old_class, new_class))
        elif cls_choice != 0:
            print("Invalid class number!")
    except ValueError:
        print("Invalid input! Please enter a number.")
    
    raw_input("\nPress Enter to continue...")

def edit_hero_status(player_obj):
    while True:
        clear_screen()
        print("\n=== Edit Hero Status for: {} ===".format(player_obj.name))
        
        print("1. Boss Victories: {}".format(getattr(player_obj, 'boss_victories', 0)))
        print("2. Hero Points: {}".format(getattr(player_obj, 'hero_points', 0)))
        print("3. Hero Title: {}".format(getattr(player_obj, 'hero_title', 'None')))
        print("4. Current Round: {}".format(getattr(player_obj, 'current_round', 1)))
        print("5. Top Dragon Status: {}".format("Yes" if getattr(player_obj, 'top_dragon', False) else "No"))
        print("6. Return to main menu")
        
        try:
            choice = raw_input("\nEnter choice: ")
            
            if choice in ['1', '2', '4']:
                attr_map = {'1': 'boss_victories', '2': 'hero_points', '4': 'current_round'}
                attr = attr_map[choice]
                current_value = getattr(player_obj, attr, 0)
                print("Current {}: {}".format(attr, current_value))
                
                try:
                    new_value = int(raw_input("Enter new {} value: ".format(attr)))
                    if new_value >= 0:
                        setattr(player_obj, attr, new_value)
                        print("{} updated from {} to {}!".format(attr.capitalize(), current_value, new_value))
                    else:
                        print("{} cannot be negative!".format(attr.capitalize()))
                except ValueError:
                    print("Invalid input! Please enter a number.")
                    
            elif choice == '3':
                current_title = getattr(player_obj, 'hero_title', '')
                print("Current hero title: {}".format(current_title or 'None'))
                new_title = raw_input("Enter new hero title (or blank for none): ")
                setattr(player_obj, 'hero_title', new_title)
                print("Hero title updated!")
                
            elif choice == '5':
                current_status = getattr(player_obj, 'top_dragon', False)
                new_status = not current_status
                setattr(player_obj, 'top_dragon', new_status)
                print("Top Dragon status toggled to: {}".format("Yes" if new_status else "No"))
                
            elif choice == '6':
                return
            else:
                print("Invalid choice!")
                
            raw_input("\nPress Enter to continue...")
            
        except KeyboardInterrupt:
            return
        except Exception as e:
            print("Error:", str(e))
            raw_input("\nPress Enter to continue...")

def reset_daily_restrictions(player_obj):
    clear_screen()
    print("\n=== Reset Daily Restrictions for: {} ===".format(player_obj.name))
    
    print("This will reset all daily counters to 0:")
    print("- Daily Fights (currently: {}/20)".format(getattr(player_obj, 'daily_fights', 0)))
    print("- Daily PvP Fights (currently: {}/10)".format(getattr(player_obj, 'daily_pvp_fights', 0)))
    print("- Daily Resurrections (currently: {}/3)".format(getattr(player_obj, 'daily_resurrections', 0)))
    print("- Special Attacks Used (currently: {})".format(getattr(player_obj, 'special_attacks_used', 0)))
    print("- Special Area Accesses (currently: {}/4)".format(getattr(player_obj, 'special_fighting_area_accesses', 0)))
    
    confirm = raw_input("\nAre you sure? Type (yes/no): ")
    
    if confirm and confirm.lower() == 'yes':
        # Reset daily counters
        setattr(player_obj, 'daily_fights', 0)
        setattr(player_obj, 'daily_pvp_fights', 0)
        setattr(player_obj, 'daily_resurrections', 0)
        setattr(player_obj, 'special_attacks_used', 0)
        setattr(player_obj, 'special_fighting_area_accesses', 0)
        
        # Reset daily dates
        setattr(player_obj, 'last_fight_date', None)
        setattr(player_obj, 'last_pvp_fight_date', None)
        setattr(player_obj, 'last_restriction_date', None)
        setattr(player_obj, 'last_special_fighting_area_access', None)
        setattr(player_obj, 'last_pvp_target_reset', None)
        setattr(player_obj, 'daily_pvp_targets', {})
        
        print("All daily restrictions have been reset!")
    else:
        print("Reset cancelled.")
    
    raw_input("\nPress Enter to continue...")

def edit_permanent_bonuses(player_obj):
    while True:
        clear_screen()
        print("\n=== Edit Permanent Bonuses for: {} ===".format(player_obj.name))
        
        permanent_bonuses = getattr(player_obj, 'permanent_bonuses', {
            'health_bonus': 0, 'strength_bonus': 0,
            'experience_multiplier': 1.0, 'gold_multiplier': 1.0
        })
        
        print("1. Health Bonus: +{}".format(permanent_bonuses.get('health_bonus', 0)))
        print("2. Strength Bonus: +{}".format(permanent_bonuses.get('strength_bonus', 0)))
        print("3. Experience Multiplier: {:.1f}x".format(permanent_bonuses.get('experience_multiplier', 1.0)))
        print("4. Gold Multiplier: {:.1f}x".format(permanent_bonuses.get('gold_multiplier', 1.0)))
        print("5. Return to main menu")
        
        try:
            choice = raw_input("\nEnter choice: ")
            
            if choice in ['1', '2']:
                bonus_map = {'1': 'health_bonus', '2': 'strength_bonus'}
                bonus = bonus_map[choice]
                current_value = permanent_bonuses.get(bonus, 0)
                print("Current {}: {}".format(bonus, current_value))
                
                try:
                    new_value = int(raw_input("Enter new {} value: ".format(bonus)))
                    if new_value >= 0:
                        permanent_bonuses[bonus] = new_value
                        setattr(player_obj, 'permanent_bonuses', permanent_bonuses)
                        print("{} updated from {} to {}!".format(bonus.capitalize(), current_value, new_value))
                    else:
                        print("{} cannot be negative!".format(bonus.capitalize()))
                except ValueError:
                    print("Invalid input! Please enter a number.")
                    
            elif choice in ['3', '4']:
                multiplier_map = {'3': 'experience_multiplier', '4': 'gold_multiplier'}
                multiplier = multiplier_map[choice]
                current_value = permanent_bonuses.get(multiplier, 1.0)
                print("Current {}: {:.1f}".format(multiplier, current_value))
                
                try:
                    new_value = float(raw_input("Enter new {} value (e.g., 1.5): ".format(multiplier)))
                    if 0.1 <= new_value <= 10.0:
                        permanent_bonuses[multiplier] = new_value
                        setattr(player_obj, 'permanent_bonuses', permanent_bonuses)
                        print("{} updated from {:.1f} to {:.1f}!".format(multiplier.capitalize(), current_value, new_value))
                    else:
                        print("{} must be between 0.1 and 10.0!".format(multiplier.capitalize()))
                except ValueError:
                    print("Invalid input! Please enter a decimal number.")
                    
            elif choice == '5':
                return
            else:
                print("Invalid choice!")
                
            raw_input("\nPress Enter to continue...")
            
        except KeyboardInterrupt:
            return
        except Exception as e:
            print("Error:", str(e))
            raw_input("\nPress Enter to continue...")

def advanced_options(player_obj):
    while True:
        clear_screen()
        print("\n=== Advanced Options for: {} ===".format(player_obj.name))
        
        print("1. Make Top Dragon (master all classes)")
        print("2. Reset to Level 1 (keep bonuses)")
        print("3. Grant Boss Victory Rewards")
        print("4. Clear All Mastered Classes")
        print("5. Set Online Status")
        print("6. Return to main menu")
        
        try:
            choice = raw_input("\nEnter choice: ")
            
            if choice == '1':
                confirm = raw_input("Make this player Top Dragon? Type (yes/no): ")
                if confirm and confirm.lower() == 'yes':
                    setattr(player_obj, 'mastered_classes', CLASSES[:])  # Copy all classes
                    setattr(player_obj, 'top_dragon', True)
                    print("Player is now Top Dragon with all classes mastered!")
                    
            elif choice == '2':
                confirm = raw_input("Reset player to level 1? Type (yes/no): ")
                if confirm and confirm.lower() == 'yes':
                    permanent_bonuses = getattr(player_obj, 'permanent_bonuses', {})
                    setattr(player_obj, 'level', 1)
                    setattr(player_obj, 'experience', 0)
                    setattr(player_obj, 'next_level_exp', 100)
                    setattr(player_obj, 'health', 110 + permanent_bonuses.get('health_bonus', 0))
                    setattr(player_obj, 'strength', 10 + permanent_bonuses.get('strength_bonus', 0))
                    print("Player reset to level 1 (permanent bonuses kept)!")
                    
            elif choice == '3':
                confirm = raw_input("Grant boss victory rewards? Type (yes/no): ")
                if confirm and confirm.lower() == 'yes':
                    boss_victories = getattr(player_obj, 'boss_victories', 0) + 1
                    setattr(player_obj, 'boss_victories', boss_victories)
                    setattr(player_obj, 'hero_points', boss_victories * 250)
                    
                    permanent_bonuses = getattr(player_obj, 'permanent_bonuses', {})
                    permanent_bonuses['health_bonus'] = permanent_bonuses.get('health_bonus', 0) + 50
                    permanent_bonuses['strength_bonus'] = permanent_bonuses.get('strength_bonus', 0) + 10
                    permanent_bonuses['experience_multiplier'] = permanent_bonuses.get('experience_multiplier', 1.0) + 0.1
                    permanent_bonuses['gold_multiplier'] = permanent_bonuses.get('gold_multiplier', 1.0) + 0.1
                    setattr(player_obj, 'permanent_bonuses', permanent_bonuses)
                    
                    print("Boss victory rewards granted!")
                    
            elif choice == '4':
                confirm = raw_input("Clear all mastered classes? Type (yes/no): ")
                if confirm and confirm.lower() == 'yes':
                    setattr(player_obj, 'mastered_classes', [])
                    setattr(player_obj, 'top_dragon', False)
                    print("All mastered classes cleared!")
                    
            elif choice == '5':
                current_status = getattr(player_obj, 'is_online', False)
                new_status = not current_status
                setattr(player_obj, 'is_online', new_status)
                print("Online status toggled to: {}".format("Online" if new_status else "Offline"))
                
            elif choice == '6':
                return
            else:
                print("Invalid choice!")
                
            raw_input("\nPress Enter to continue...")
            
        except KeyboardInterrupt:
            return
        except Exception as e:
            print("Error:", str(e))
            raw_input("\nPress Enter to continue...")

def edit_player_stats(player_obj, username):
    while True:
        clear_screen()
        print("\n=== Editing Player: {} ===".format(username))
        print("Player object type:", type(player_obj))
        
        display_player_info(player_obj)
        
        print("\n" + "=" * 50)
        print("1. Edit Basic Stats")
        print("2. Edit Hero Status")
        print("3. Reset Daily Restrictions")
        print("4. Edit Permanent Bonuses")
        print("5. Advanced Options")
        print("6. Save Changes")
        print("7. Return Without Saving")
        print("8. DELETE PLAYER")
        
        try:
            choice = raw_input("\nEnter choice: ")
            
            if choice == '1':
                edit_basic_stats(player_obj)
            elif choice == '2':
                edit_hero_status(player_obj)
            elif choice == '3':
                reset_daily_restrictions(player_obj)
            elif choice == '4':
                edit_permanent_bonuses(player_obj)
            elif choice == '5':
                advanced_options(player_obj)
            elif choice == '6':
                if save_player_safe(player_obj, username):
                    print("Changes saved successfully!")
                    raw_input("Press Enter to continue...")
                    return
                else:
                    print("Failed to save changes!")
                    raw_input("Press Enter to continue...")
            elif choice == '7':
                confirm = raw_input("Are you sure you want to discard changes? (yes/no): ")
                if confirm.lower() == 'yes':
                    return
            elif choice == '8':
                delete_player(player_obj, username)
                return
            else:
                print("Invalid choice!")
                raw_input("Press Enter to continue...")
                
        except KeyboardInterrupt:
            return
        except Exception as e:
            print("Error:", str(e))
            raw_input("\nPress Enter to continue...")

def delete_player(player_obj, username):
    clear_screen()
    print("\n=== DELETE PLAYER: {} ===".format(username))
    print("WARNING: This action cannot be undone!")
    print("This will permanently delete all player data.")
    
    confirm = raw_input("\nType the player name exactly to confirm deletion: ")
    
    if confirm == username:
        save_file = os.path.join(script_dir, username + ".sav")
        try:
            os.remove(save_file)
            print("Player {} deleted successfully!".format(username))
        except Exception as e:
            print("Error deleting player file:", str(e))
    else:
        print("Player name did not match. Deletion cancelled.")
    
    raw_input("Press Enter to continue...")

def edit_player():
    while True:
        players = list_players()
        if not players:
            raw_input("\nPress Enter to return to main menu...")
            return

        print("\nEnter player number to edit (or 0 to return):")
        try:
            choice = raw_input("> ")
            if not choice:
                continue
            choice = int(choice)
            if choice == 0:
                return
            if 1 <= choice <= len(players):
                username = players[choice-1]
                print("Selected player:", username)
                
                print("Options:")
                print("1. Load existing save file")
                print("2. Create new player with default stats")
                option = raw_input("Choose option (1 or 2): ")
                
                if option == '2':
                    confirm = raw_input("Create new player '{}' with default stats? (yes/no): ".format(username))
                    if confirm.lower() == 'yes':
                        player_obj = create_new_player_with_defaults(username)
                        print("Created new player with defaults!")
                    else:
                        continue
                else:
                    player_obj = load_player_safe(username)
                
                if player_obj:
                    raw_input("Press Enter to continue...")
                    edit_player_stats(player_obj, username)
                else:
                    print("Failed to load player:", username)
                    raw_input("Press Enter to continue...")
            else:
                print("Invalid choice!")
                raw_input("Press Enter to continue...")
        except ValueError:
            print("Invalid input! Please enter a number.")
            raw_input("Press Enter to continue...")
        except KeyboardInterrupt:
            return
        except Exception as e:
            print("Error:", str(e))
            raw_input("Press Enter to continue...")

def show_player_statistics():
    clear_screen()
    print("\n=== Player Statistics ===")
    
    save_files = [f for f in os.listdir(script_dir) if f.endswith('.sav')]
    if not save_files:
        print("No player save files found!")
        raw_input("Press Enter to continue...")
        return
    
    total_players = len(save_files)
    top_dragons = 0
    heroes_count = 0
    highest_level = 0
    total_gold = 0
    online_players = 0
    
    for filename in save_files:
        try:
            player_name = filename[:-4]
            player = RealPlayer.load_game(player_name)
            if player:
                if getattr(player, 'top_dragon', False):
                    top_dragons += 1
                if getattr(player, 'boss_victories', 0) > 0:
                    heroes_count += 1
                level = getattr(player, 'level', 1)
                if level > highest_level:
                    highest_level = level
                total_gold += getattr(player, 'gold', 0)
                total_gold += getattr(player, 'bank_balance', 0)
                if getattr(player, 'is_online', False):
                    online_players += 1
        except:
            # Skip corrupt files
            pass
    
    print("Total Players: {}".format(total_players))
    print("Top Dragons: {}".format(top_dragons))
    print("Heroes (Boss Victories): {}".format(heroes_count))
    print("Highest Level: {}".format(highest_level))
    print("Total Gold in Economy: {:,}".format(total_gold))
    print("Currently Online: {}".format(online_players))
    
    raw_input("\nPress Enter to continue...")

def load_messages():
    message_file = os.path.join(script_dir, "message_db.pkl")
    if os.path.exists(message_file):
        try:
            with open(message_file, 'rb') as f:
                return pickle.load(f)
        except:
            return {}
    return {}

def save_messages(messages):
    message_file = os.path.join(script_dir, "message_db.pkl")
    try:
        with open(message_file, 'wb') as f:
            pickle.dump(messages, f)
        return True
    except:
        return False

def view_delete_messages():
    while True:
        clear_screen()
        messages = load_messages()
        
        print("\n=== Users with Messages ===")
        users = list(messages.keys())
        if not users:
            print("No users have messages.")
            raw_input("\nPress Enter to return to main menu...")
            return
        
        for i, user in enumerate(users, 1):
            msg_count = len(messages[user])
            print("{}. {} ({} messages)".format(i, user, msg_count))
        
        print("\nEnter user number to view/delete messages (or 0 to return):")
        try:
            choice = raw_input("> ")
            if not choice or choice == "0":
                return
            
            choice_num = int(choice)
            if 1 <= choice_num <= len(users):
                username = users[choice_num - 1]
                edit_user_messages(messages, username)
            else:
                print("Invalid choice!")
                raw_input("Press Enter to continue...")
                
        except ValueError:
            print("Invalid input! Please enter a number.")
            raw_input("Press Enter to continue...")
        except KeyboardInterrupt:
            return

def edit_user_messages(messages, username):
    while True:
        clear_screen()
        user_messages = messages.get(username, [])
        print("\n=== Messages for {} ===".format(username))
        
        if not user_messages:
            print("No messages for this user.")
            raw_input("Press Enter to return...")
            return
        
        for i, (sender, message) in enumerate(user_messages, 1):
            print("\n{}. From: {}".format(i, sender))
            print("   Message: {}".format(message))
        
        print("\n1. Delete a message")
        print("2. Delete all messages for this user")
        print("3. Return to previous menu")
        
        try:
            choice = raw_input("\nEnter choice: ")
            
            if choice == '1':
                msg_num = int(raw_input("Enter message number to delete: "))
                if 1 <= msg_num <= len(user_messages):
                    user_messages.pop(msg_num - 1)
                    messages[username] = user_messages
                    save_messages(messages)
                    print("Message deleted!")
                else:
                    print("Invalid message number!")
                    
            elif choice == '2':
                confirm = raw_input("Are you sure you want to delete ALL messages for this user? Type (yes/no): ")
                if confirm and confirm.lower() == 'yes':
                    del messages[username]
                    save_messages(messages)
                    print("All messages deleted for user!")
                    raw_input("Press Enter to continue...")
                    return
                    
            elif choice == '3':
                return
            else:
                print("Invalid choice!")
                
            raw_input("Press Enter to continue...")
            
        except ValueError:
            print("Invalid input!")
            raw_input("Press Enter to continue...")
        except KeyboardInterrupt:
            return

def main_menu():
    while True:
        clear_screen()
        print("\n=== RDQ2 Universal Player Editor v2.0 ===")
        current_time = get_current_datetime()
        print("Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted):", current_time)
        print("Current User's Login: anetonline")
        
        if RealPlayer.__module__ == '__main__':
            print("Using imported Player class from game")
        else:
            print("Using fallback Player class")
        
        print("\n1. Edit Player")
        print("2. View/Delete Messages")
        print("3. Player Statistics")
        print("4. Exit")
        
        try:
            choice = raw_input("\nEnter choice: ")
            if choice == '1':
                edit_player()
            elif choice == '2':
                view_delete_messages()
            elif choice == '3':
                show_player_statistics()
            elif choice == '4':
                sys.exit(0)
            else:
                print("Invalid choice!")
                raw_input("Press Enter to continue...")
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
