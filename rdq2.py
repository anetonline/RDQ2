## A-Net Online BBSs
## Telnet:a-net.online 
## Telnet:mystic-anet.online
## https://a-net-online.lol
## Brought to you by StingRay
import pickle
import random
import bisect
import itertools
import os
import mystic_bbs as bbs
import datetime
import sys
import codecs

CLASSES = ['Good', 'Evil', 'Beast', 'Thief', 'Magical', 'Demon']

script_dir = os.path.dirname(os.path.abspath(__file__))

if script_dir not in sys.path:
    sys.path.append(script_dir)

def clear_screen():

    print "\033[2J\033[H"

class IGM:
    def __init__(self, name, description):
        self.name = name
        self.description = description

    def enter(self, player):
        raise NotImplementedError("This method should be overridden by subclasses")

class CasinoIGM(IGM):
    def __init__(self):
        IGM.__init__(self, "Dragon Casino", "Try your luck at various games of chance!")  # Fixed: removed super()
        
    def enter(self, player):
        while True:
            bbs.write("|CL")
            
            bbs.write("|02" + "-" * 45 + "\r\n")
            bbs.write("|04        Dragon Casino IGM|07\r\n")
            bbs.write("|02" + "-" * 45 + "\r\n")
            bbs.write("|10(1) |02Slot Machine   |10(Bet 100-1000 gold)\r\n")
            bbs.write("|10(2) |02Roulette       |10(Bet 500-5000 gold)\r\n")
            bbs.write("|10(3) |02Dragon Dice    |10(Bet 200-2000 gold)\r\n")
            bbs.write("|10(4) |02Check Balance  |10(Gold: {:,})\r\n".format(player.gold))
            bbs.write("|10(5) |02Leave Casino\r\n")
            bbs.write("|02" + "-" * 45 + "\r\n")
            
            bbs.write("|02Choose your game|10: ")
            choice = bbs.getstr(1, 1, 1, "")
            
            if choice is None or choice.strip() == "":
                continue
                
            if choice == '1':
                self._play_slots(player)
            elif choice == '2':
                self._play_roulette(player)
            elif choice == '3':
                self._play_dice(player)
            elif choice == '4':
                bbs.write("|02Your current balance is |10{:,} |02gold.\r\n".format(player.gold))
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            elif choice == '5':
                bbs.write("|02Thank you for visiting the Dragon Casino!\r\n")
                break
            else:
                bbs.write("|04Invalid choice!\r\n")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
    
    def _get_bet(self, player, min_bet, max_bet):
        while True:
            if player.gold < min_bet:
                bbs.write("|04You don't have enough gold for minimum bet! Minimum needed: |10{:,}\r\n".format(min_bet))
                bbs.write("|04Your current gold: |10{:,}\r\n".format(player.gold))
                bbs.write("Press Enter to return...")
                bbs.getstr(1, 1, 1, "")
                return None
            
            bbs.write("|02Enter bet amount |10({}-{} gold) |02or |10'X' |02to exit|10: ".format(min_bet, max_bet))
            try:
                input_str = bbs.getstr(1, 5, 5, "")
                if input_str is None or input_str.strip() == "":
                    bbs.write("|04Invalid input!\r\n")
                    continue
                
                if input_str.upper() == 'X':
                    return None
                
                bet = int(input_str)
                if min_bet <= bet <= max_bet:
                    if bet <= player.gold:
                        return bet
                    else:
                        bbs.write("|04You don't have enough gold!\r\n")
                        bbs.write("|04Your current gold: |10{:,}\r\n".format(player.gold))
                else:
                    bbs.write("|04Bet must be between |10{} |04and |10{} |04gold.\r\n".format(min_bet, max_bet))
            except ValueError:
                bbs.write("|04Invalid bet amount!\r\n")

    def _play_slots(self, player):
        symbols = ["D", "G", "C", "S", "A"]  # Changed to single letters like Linux version
        bet = self._get_bet(player, 100, 1000)
        
        if bet is None:  # Fixed: check for None instead of truthy
            return
            
        player.gold -= bet
        bbs.write("|14\r\nSpinning the slots...\r\n")
        bbs.write("Press Enter to stop the reels...")
        bbs.getstr(1, 1, 1, "")
        
        reels = [random.choice(symbols) for _ in range(3)]
        bbs.write("|10[ |02{} |10][ |02{} |10][ |02{} |10]\r\n".format(reels[0], reels[1], reels[2]))
        
        if all(r == reels[0] for r in reels):  # All symbols match
            winnings = bet * 5
            bbs.write("|12JACKPOT! You won |10{:,} |12gold!\r\n".format(winnings))
            player.gold += winnings
        elif reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]:  # Two match
            winnings = bet * 2
            bbs.write("|02Winner! You won |10{:,} |02gold!\r\n".format(winnings))
            player.gold += winnings
        else:
            bbs.write("|04Better luck next time!\r\n")
        
        player.save_game()  # Added save like Linux version
        bbs.write("Press Enter to continue...")
        bbs.getstr(1, 1, 1, "")

casino_igm = CasinoIGM()
igms = [casino_igm]

def select_class():
    bbs.write("|02\nChoose your class:\r\n")  # Fixed: use bbs.write instead of print_color
    for idx, cls in enumerate(CLASSES, 1):
        bbs.write("|10{}. |02{}\r\n".format(idx, cls))
    while True:
        bbs.write("\nEnter the number of your chosen class (1-{}): ".format(len(CLASSES)))
        choice_str = bbs.getstr(1, 1, 1, "")
        if choice_str is None or choice_str.strip() == "":
            bbs.write("|04Invalid input. Please enter a number.\r\n")
            continue
        try:
            choice = int(choice_str)
            if 1 <= choice <= len(CLASSES):
                return CLASSES[choice - 1]
            else:
                bbs.write("|04Invalid choice. Please choose between 1 and {}.\r\n".format(len(CLASSES)))
        except ValueError:
            bbs.write("|04Invalid input. Please enter a number.\r\n")

class Player(object):
    def __init__(self, name, chosen_class=None):
        self.name = name
        self.chosen_class = chosen_class if chosen_class else select_class()
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
        self.last_name_change_date = None
        self.daily_resurrections = 0
        self.last_restriction_date = None

    def reset_health(self):
        self.health = self.level * 10
        
    def save_game(self):
        file_path = os.path.join(script_dir, "%s.sav" % self.name)
        with open(file_path, 'wb') as f:
            pickle.dump(self, f)
    
    def gain_medals(self, amount):
        self.medals += amount
        print_color("%s gained %d medals." % (self.name, amount), "1;32")

    def visit_igm(self, igm):
        today = datetime.date.today()
        if self.last_igm_visit == today:
            print_color("You have already visited an IGM today. Come back tomorrow!", "1;31")
        else:
            igm.enter(self)
            self.last_igm_visit = today

    def check_level_up(self):
        if self.experience >= self.next_level_exp:
            self.level += 1
            self.experience -= self.next_level_exp
            self.next_level_exp = int(self.next_level_exp * 1.5)
            print_color("{} leveled up! Now at level {}".format(self.name, self.level), "1;32")
            if self.level >= 10:
                self.level = 10
                print_color("You have reached maximum level with {}! Time to master this class!".format(self.chosen_class), "1;32")
                self.master_class()

    def attack(self, enemy):
        base_damage = random.randint(1, self.strength)
        level_bonus = self.level * 0.5
        total_damage = int(base_damage + level_bonus)
        enemy.health -= total_damage
        return total_damage

    def special_attack(self, enemy):
        if self.special_attacks_used < self.level * 2:
            damage = random.randint(self.strength, self.strength * 2)
            enemy.health -= damage
            self.special_attacks_used += 1
            return damage
        else:
            print_color("No special attacks remaining for today.", "1;31")
            return 0

    @classmethod
    def load_game(cls, name):
        file_path = os.path.join(script_dir, "%s.sav" % name)
        if os.path.exists(file_path):
            try:
                with open(file_path, 'rb') as f:
                    player = pickle.load(f)
                for attr, default in [
                    ('bank_balance', 0), ('special_attacks_used', 0),
                    ('last_mystic_mountains_visit', None), ('special_fighting_area_accesses', 0),
                    ('last_special_fighting_area_access', None), ('daily_fights', 0),
                    ('last_fight_date', None), ('last_name_change_date', None),
                    ('daily_resurrections', 0), ('last_restriction_date', None)
                ]:
                    if not hasattr(player, attr):
                        setattr(player, attr, default)
                return player
            except Exception:
                print_color("Failed to load the save file. Starting a new game.", "1;31")
                return None
        return None

    def gain_experience(self, amount):
        self.experience += amount
        print_color("{} gained {} experience points.".format(self.name, amount), "1;32")
        while self.experience >= self.next_level_exp:
            self.level_up()

    def level_up(self):
        self.experience -= self.next_level_exp
        self.level += 1
        self.next_level_exp = int(self.next_level_exp * 1.5)
        self.reset_health()
        self.strength += 2
        print_color("{} leveled up! Now at level {}.".format(self.name, self.level), "1;32")
        if self.level >= 10:
            self.level = 10
            print_color("You have reached maximum level with {}! Time to master this class!".format(self.chosen_class), "1;32")
            self.master_class()

    def check_class_status(self):
        print_color("\nCurrent Class: {}".format(self.chosen_class), "1;32")
        print_color("Level: {}".format(self.level), "1;32")
        print_color("Experience: {}/{}".format(self.experience, self.next_level_exp), "1;32")
        if self.mastered_classes:
            print_color("\nMastered Classes:", "1;34")
            for cls in self.mastered_classes:
                print_color("- {}".format(cls), "1;32")
        else:
            print_color("\nNo classes mastered yet", "1;31")

    def can_level_up(self):
        return self.experience >= self.next_level_exp

    def experience_needed(self):
        return self.next_level_exp - self.experience

    def master_class(self):
        if self.chosen_class not in self.mastered_classes:
            self.mastered_classes.append(self.chosen_class)
            print_color("{} has mastered the {} class!".format(self.name, self.chosen_class), "1;32")
            if len(self.mastered_classes) == len(CLASSES):
                self.top_dragon = True
                print_color("Congratulations! {} is now the Top Dragon!".format(self.name), "1;32")
            else:
                self.choose_new_class()

    def choose_new_class(self):
        print_color("\nChoose a new class to master:", "1;34")
        available_classes = [cls for cls in CLASSES if cls not in self.mastered_classes]
        if not available_classes:
            print_color("You have mastered all classes!", "1;32")
            return
        for idx, cls in enumerate(available_classes, 1):
            print_color("{}. {}".format(idx, cls), "1;32")
        while True:
            bbs.write("\nEnter the number of your chosen class (1-{}): ".format(len(available_classes)))
            try:
                choice = int(bbs.getstr(1, 1, 1, ""))
                if 1 <= choice <= len(available_classes):
                    self.chosen_class = available_classes[choice - 1]
                    self.level = 1
                    self.experience = 0
                    self.next_level_exp = 100
                    self.reset_health()
                    print_color("You are now a level 1 {}!".format(self.chosen_class), "1;32")
                    return
                else:
                    print_color("Invalid choice. Please choose between 1 and {}.".format(len(available_classes)), "1;31")
            except ValueError:
                print_color("Invalid input. Please enter a number.", "1;31")

    def reset_special_attacks(self):
        self.special_attacks_used = 0

    def is_alive(self):
        return self.health > 0

    def heal(self, amount):
        if self.gold >= amount and amount > 0:
            self.gold -= amount
            self.health += amount
            self.health = min(self.health, 100 + self.level * 10)
            print_color("You healed for {} hitpoints. Health: {}, Gold: {}".format(
                amount, self.health, self.gold), "1;32")
        else:
            print_color("Not enough gold to heal or invalid amount!", "1;31")

    def use_item(self):
        if not self.inventory:
            print_color("You have no items.", "1;31")
            return
        print_color("Inventory:", "1;34")
        for idx, item in enumerate(self.inventory):
            print_color("[{}] {}".format(idx, item.name), "1;34")
        bbs.write("Choose an item to use: ")
        try:
            choice = int(bbs.getstr(1, 2, 2, "0"))
            if 0 <= choice < len(self.inventory):
                item = self.inventory.pop(choice)
                item.use(self)
            else:
                print_color("Invalid choice!", "1;31")
        except Exception:
            print_color("Invalid input!", "1;31")

class Enemy:
    def __init__(self, level):
        self.name = random.choice([
            "Dragon Bussey Eater", "John the Golden Dragon", "Dragon Naomi", "Dragon Pete", "Dragon Lauren",
            "Hairy Monster", "Evil Troll", "Ghost", "Skunk", "Buffalo", "Deer",
            "Vampire", "Bat", "Rugaru", "ShapeShifter"
        ])
        self.level = level
        self.health = level * 10
        self.strength = level * 2

    def reset_health(self):
        self.health = self.level * 10

    def attack(self, player):
        damage = random.randint(1, self.strength)
        player.health -= damage
        return damage

    def special_attack(self, player):
        damage = random.randint(self.strength, self.strength * 2)
        player.health -= damage
        return damage

class Item:
    def __init__(self, name, effect):
        self.name = name
        self.effect = effect

    def use(self, player):
        result = self.effect(player)
        if result:
            print_color(result, "1;32")

def heal(player):
    player.health = min(player.health + 20, 150)
    return "You used a health potion and recovered 20 health."

def print_color(text, color_code):
    # Just write the text directly - it should already contain pipe codes
    bbs.write(text + "\r\n")

class PressYourLuck(IGM):
    def __init__(self):
        super(PressYourLuck, self).__init__("Press Your Luck", "Try your luck and see what you win!")

    def enter(self, player):
        print "Welcome to Press Your Luck!"
        print "You can choose to bet gold or pick at random."
        print "Choose an option:"
        print "1. Bet gold"
        print "2. Pick at random"
        choice = int(raw_input("> "))

        if choice == 1:
            self.bet_gold(player)
        elif choice == 2:
            self.pick_random(player)
        else:
            print "Invalid choice. Returning to main game."

    def bet_gold(self, player):
        print "Enter the amount of gold you want to bet:"
        bet = int(raw_input("> "))
        if bet > player.gold:
            print "You don't have enough gold to bet that amount."
            return

        player.gold -= bet
        outcome = random.choice(["win", "lose"])
        if outcome == "win":
            winnings = bet * 2
            player.gold += winnings
            print "You won {} gold!".format(winnings)
        else:
            print "You lost your bet. Better luck next time!"

    def pick_random(self, player):
        outcome = random.choice(["gain_gold", "lose_gold", "gain_experience", "lose_experience"])
        if outcome == "gain_gold":
            amount = random.randint(10, 50)
            player.gold += amount
            print "You found {} gold!".format(amount)
        elif outcome == "lose_gold":
            amount = random.randint(10, 50)
            player.gold -= amount
            if player.gold < 0:
                player.gold = 0
            print "You lost {} gold.".format(amount)
        elif outcome == "gain_experience":
            amount = random.randint(10, 50)
            player.gain_experience(amount)
        elif outcome == "lose_experience":
            amount = random.randint(10, 50)
            player.experience -= amount
            if player.experience < 0:
                player.experience = 0
            print "You lost {} experience points.".format(amount)

def display_welcome_screen():
    ans_file = os.path.join(script_dir, "RedDragonQuest.ans")
    try:
        with open(ans_file, "rb") as file:
            content = file.read()
            # Convert bytes to string, replacing problematic characters
            if isinstance(content, str):
                # Python 2: content is already a string
                decoded_content = content
            else:
                # Shouldn't happen in Python 2, but just in case
                decoded_content = str(content)
            
            # Write the content directly to BBS, let it handle the encoding
            bbs.write(decoded_content)
            
    except (IOError, OSError):
        # If file doesn't exist or can't be read, show a simple text welcome
        print_color("Welcome to Red Dragon Quest!", "1;32")
        print_color("=" * 50, "1;32")
    except Exception as e:
        # Log any other errors and show fallback
        with open(os.path.join(script_dir, "ansi_error.log"), "w") as log:
            log.write("ANSI display error: " + str(e) + "\n")
        print_color("Welcome to Red Dragon Quest!", "1;32")
        print_color("=" * 50, "1;32")

def custom_accumulate(iterable):
    total = 0
    for value in iterable:
        total += value
        yield total

def weighted_random_choice(weights):
    total = sum(weights)
    cum_weights = list(custom_accumulate(weights))
    x = random.random() * total
    return bisect.bisect(cum_weights, x)

def change_player_name(player):
    current_date = datetime.date.today()
    if player.last_name_change_date is not None and (current_date - player.last_name_change_date).days < 30:
        print_color("You can only change your name once every 30 days. Please try again later.", "1;31")
        return

    bbs.write("Enter your new name: ")
    new_name = bbs.getstr(1, 20, 20, "").strip()

    if new_name:
        old_name = player.name
        player.name = new_name
        player.last_name_change_date = current_date

        new_file = os.path.join(script_dir, "{}.sav".format(new_name))
        with open(new_file, 'wb') as f:
            pickle.dump(player, f)

        old_file = os.path.join(script_dir, "{}.sav".format(old_name))
        if os.path.exists(old_file):
            os.remove(old_file)

        print_color("Your name has been changed to {}.".format(new_name), "1;32")
    else:
        print_color("Invalid name. Name change aborted.", "1;31")

def trigger_random_event(player):
    event_chance = random.randint(1, 100)

    if event_chance <= 5:
        event_type = random.choice(['lottery', 'wizard', 'protection'])

        if event_type == 'lottery':
            win_amount = weighted_random_choice([x for x in range(1, 1000001)])
            player.gold += win_amount
            print_color("You won the lottery and received {} gold!".format(win_amount), "1;32")
            # Add pause after lottery win
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")

        elif event_type == 'wizard':
            bbs.write("A Wizard asks if you want to join him on a quest. [Y]es or [N]o? ")
            response = bbs.getstr(1, 1, 1, "").upper()
            if response == 'Y':
                print_color("You embark on a journey with the Wizard to a mythical region.", "1;34")
                reward_type = random.choice(['health', 'gold'])
                if reward_type == 'health':
                    health_reward = random.randint(10, 100)
                    player.health += health_reward
                    print_color("You gained {} health!".format(health_reward), "1;32")
                else:
                    gold_reward = random.randint(100, 1000)
                    player.gold += gold_reward
                    print_color("You gained {} gold!".format(gold_reward), "1;32")
                # Add pause after wizard quest reward
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            else:
                print_color("The Wizard seems disappointed.", "1;31")
                # Add pause after declining wizard quest
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")

        elif event_type == 'protection':
            if random.randint(1, 20) == 1:
                bbs.write("Do you want to buy 24-hour protection for 500,000 gold? [Y]es or [N]o? ")
                response = bbs.getstr(1, 1, 1, "").upper()
                if response == 'Y':
                    if player.gold >= 500000:
                        player.gold -= 500000
                        print_color("You bought 24-hour protection.", "1;32")
                    else:
                        print_color("You don't have enough gold!", "1;31")
                else:
                    print_color("Your loss!", "1;31")
                # Add pause after protection event
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")

def inn(player):
    while True:
        bbs.write("|CL")
        room_cost = 100 * player.level
        
        bbs.write("|02" + "-" * 45 + "\r\n")
        bbs.write("|04                Dragon Inn\r\n")
        bbs.write("|02" + "-" * 45 + "\r\n")
        bbs.write("|10(1) |02Have a drink |10(Cost 5, Heals 10)\r\n")
        bbs.write("|10(2) |02View Your Dragon Stats Here\r\n")
        bbs.write("|10(3) |02Sleep with someone |10(Cost 50, Heals 75)\r\n")
        bbs.write("|10(4) |02Test your skills at robbing someone\r\n")
        bbs.write("|10(5) |02Get a room |10(Cost {:,}, Safe, Game Saved)\r\n".format(room_cost))
        bbs.write("|10(6) |02Head over to other areas\r\n")
        bbs.write("|10(7) |02Leave the inn\r\n")
        bbs.write("|02" + "-" * 45 + "\r\n")
        
        bbs.write("|02Choose an action|10: ")
        choice = bbs.getstr(1, 1, 1, "")
        
        if choice == '1':
            if player.gold >= 5:
                player.gold -= 5
                player.health += 10
                print_color("You have a drink and feel refreshed! Your health is now {} and you have {:,} gold.".format(player.health, player.gold), "1;32")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            else:
                print_color("You don't have enough gold!", "1;31")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
        elif choice == '2':
            print_color("Player Stats", "1;34")
            print_color("Health: {}".format(player.health), "1;32")
            print_color("Experience: {}".format(player.experience), "1;32")
            print_color("Gold on Hand: {:,}".format(player.gold), "1;32")
            print_color("Gold in Bank: {:,}".format(player.bank_balance), "1;32")
            print_color("Armor Level: {}".format(player.level), "1;32")
            print_color("Weapon Level: {}".format(player.strength // 2), "1;32")
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")
        elif choice == '3':
            if player.gold >= 50:
                player.gold -= 50
                player.health += 75
                print_color("You found a companion to spend the night with. Your health is now {} and you have {:,} gold.".format(player.health, player.gold), "1;32")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            else:
                print_color("You don't have enough gold!", "1;31")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
        elif choice == '4':
            print_color("You attempt to rob someone while they are sleeping.", "1;31")
            success = random.choice([True, False])
            if success:
                gold_stolen = random.randint(10, 50)
                player.gold += gold_stolen
                print_color("You successfully stole {:,} gold! You now have {:,} gold.".format(gold_stolen, player.gold), "1;32")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            else:
                print_color("You got caught and had to run away!", "1;31")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
        elif choice == '5':
            if player.gold >= room_cost:
                player.gold -= room_cost
                player.health = 100 + player.level * 10
                player.is_online = False
                player.save_game()
                print_color("You rest in a room and regain your strength. Game saved. You are safe.", "1;32")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
                break
            else:
                print_color("You don't have enough gold!", "1;31")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
        elif choice == '6':
            visit_igms(player)  # Add the IGM menu option
        elif choice == '7':
            break
        else:
            print_color("Invalid choice!", "1;31")

def fight_other_players(player):
    online_players = get_online_players()
    eligible_players = [p for p in online_players if p.level >= 50 and p.name != player.name]

    if not eligible_players:
        print_color("No eligible players to fight at the moment.", "1;31")
        return

    print_color("Eligible players to fight:", "1;32")
    for idx, p in enumerate(eligible_players):
        print_color("[{}] {}".format(idx, p.name), "1;32")

    bbs.write("Choose a player to fight: ")
    choice = int(bbs.getstr(1, 2, 2, "0"))

    if 0 <= choice < len(eligible_players):
        opponent = eligible_players[choice]
        print_color("You are fighting {}!".format(opponent.name), "1;34")
        while opponent.is_alive() and player.is_alive():
            print_color("Player Health: {}, Opponent Health: {}".format(player.health, opponent.health), "1;34")
            bbs.write("Do you want to [A]ttack, use [I]tem, [H]eal, or [R]un? ")
            action = bbs.getstr(1, 1, 1, "").upper()
            if action == 'A':
                damage = player.attack(opponent)
                print_color("You attacked the opponent for {} damage. Opponent Health: {}".format(damage, opponent.health), "1;32")
                if opponent.is_alive():
                    damage = opponent.attack(player)
                    print_color("The opponent attacked you for {} damage. Your Health: {}".format(damage, player.health), "1;31")
            elif action == 'I':
                player.use_item()
            elif action == 'H':
                print_color("Enter the amount to heal (1 gold per hitpoint): ", "1;32")
                heal_amount = int(bbs.getstr(1, 3, 3, "0"))
                player.heal(heal_amount)
            elif action == 'R':
                print_color("You ran away!", "1;31")
                break
            else:
                print_color("Invalid action!", "1;31")

        if player.is_alive() and not opponent.is_alive():
            print_color("You defeated the opponent!", "1;32")
            player.experience += opponent.level * 10
            player.gold += opponent.level * 5
            player.save_game()
        elif not player.is_alive():
            print_color("You have been defeated!", "1;31")
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")   # <-- Add this pause
            player.health = 0
            player.daily_resurrections += 1
            player.save_game()
            return

def special_fighting_area(player):
    if player.level < 5:
        print_color("You must be at least level 5 to fight other players.", "1;31")
        # Add pause after level requirement message
        bbs.write("Press Enter to continue...")
        bbs.getstr(1, 1, 1, "")
        return

    current_date = datetime.date.today()
    if player.last_special_fighting_area_access != current_date:
        player.special_fighting_area_accesses = 0
        player.last_special_fighting_area_access = current_date

    if player.special_fighting_area_accesses >= 4:
        print_color("You can only access the Special Fighting Area 4 times per day. Please try again tomorrow.", "1;31")
        # Add pause after daily limit message
        bbs.write("Press Enter to continue...")
        bbs.getstr(1, 1, 1, "")
        return

    player.special_fighting_area_accesses += 1
    player.save_game()

    print_color("\nWelcome to the Special Fighting Area!", "1;31")
    enemy = Enemy(player.level + 2)
    enemy.reset_health()
    
    while enemy.health > 0 and player.is_alive():
        print_color("Player Health: {}, Enemy Health: {}".format(player.health, enemy.health), "1;34")
        bbs.write("Do you want to [A]ttack, use [I]tem, [H]eal, or [R]un? ")
        action = bbs.getstr(1, 1, 1, "")
        if not action:
            continue
        
        action = action.upper()
        if action == 'A':
            bbs.write("Choose attack type: [N]ormal or [S]pecial ({}/{} remaining)? ".format(
                player.special_attacks_used, player.level * 2))
            sub_action = bbs.getstr(1, 1, 1, "").upper()
            if not sub_action:
                continue
                
            if sub_action == 'N':
                damage = player.attack(enemy)
            elif sub_action == 'S':
                damage = player.special_attack(enemy)
            else:
                print_color("Invalid attack type!", "1;31")
                continue
                
            print_color("You attacked the enemy for {} damage. Enemy Health: {}".format(
                damage, enemy.health), "1;32")
                
            if enemy.health > 0:
                if random.choice([True, False]):
                    damage = enemy.attack(player)
                else:
                    damage = enemy.special_attack(player)
                print_color("The enemy attacked you for {} damage. Your Health: {}".format(
                    damage, player.health), "1;31")
        elif action == 'I':
            player.use_item()
        elif action == 'H':
            print_color("Enter the amount to heal (1 gold per hitpoint): ", "1;32")
            heal_amount = int(bbs.getstr(1, 3, 3, "0"))
            player.heal(heal_amount)
        elif action == 'R':
            print_color("You ran away!", "1;31")
            # Add pause after running away
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")
            break
        else:
            print_color("Invalid action!", "1;31")
            
        if player.health <= 0:
            print_color("You have been defeated!", "1;31")
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")   # <-- Add this pause
            player.health = 0
            player.daily_resurrections += 1
            player.save_game()
            return
            
    # After the while loop ends, check the final state
    if player.is_alive() and enemy.health <= 0:
        print_color("You defeated the enemy!", "1;32")
        exp_gained = player.level * 10
        gold_gained = player.level * 5
        player.experience += exp_gained
        player.gold += gold_gained
        print_color("You gained {} experience and {} gold!".format(exp_gained, gold_gained), "1;32")
        player.save_game()
        # Add pause after victory
        bbs.write("Press Enter to continue...")
        bbs.getstr(1, 1, 1, "")
    elif not player.is_alive():
            print_color("You have been defeated!", "1;31")
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")   # <-- Add this pause
            player.health = 0
            player.daily_resurrections += 1
            player.save_game()
            return

def list_players_online():
    print_color("\n----- Dragons Currently Online -----", "1;34")
    online_players = get_online_players()
    for player in online_players:
        print_color("{}".format(player.name), "1;34")

def get_online_players():
    online_players = []
    for filename in os.listdir(script_dir):
        if filename.endswith('.sav'):
            file_path = os.path.join(script_dir, filename)
            with open(file_path, 'rb') as f:
                player = pickle.load(f)
                if hasattr(player, 'is_online') and player.is_online:
                    online_players.append(player)
    return online_players

def get_message_count(player_handle):
    message_db_file = os.path.join(script_dir, "message_db.pkl")
    if os.path.exists(message_db_file):
        with open(message_db_file, 'rb') as f:
            message_db = pickle.load(f)
        if player_handle in message_db:
            return len(message_db[player_handle])
    return 0

def show_high_scores():
    print_color("\nHigh Scores", "1;32")
    high_scores = []
    for filename in os.listdir(script_dir):
        if filename.endswith('.sav'):
            file_path = os.path.join(script_dir, filename)
            with open(file_path, 'rb') as f:
                player = pickle.load(f)
                high_scores.append((player.name, player.level, player.experience))
    high_scores.sort(key=lambda x: x[2], reverse=True)
    for name, level, experience in high_scores[:10]:
        print_color("Name: {}, Level: {}, Experience: {}".format(name, level, experience), "1;32")

def journey(player):
    while True:
        bbs.write("|CL")
        
        bbs.write("|02" + "-" * 40 + "\r\n")
        bbs.write("|04          Dragon Journey\r\n")
        bbs.write("|02" + "-" * 40 + "\r\n")
        bbs.write("|10(1) |02Dark Forest\r\n")
        bbs.write("|10(2) |02Mystic Mountains\r\n")
        bbs.write("|10(3) |02Abandoned Castle\r\n")
        bbs.write("|10(4) |02Check Level and Experience\r\n")
        bbs.write("|10(5) |02Change Your Name (Once per 30 days)\r\n")
        bbs.write("|10(6) |02View Class Status\r\n")
        bbs.write("|10(7) |02Return to main menu\r\n")
        bbs.write("|02" + "-" * 40 + "\r\n")
        
        bbs.write("|02Choose an action|10: ")
        choice = bbs.getstr(1, 1, 1, "")
        if choice == '1':
            print_color("You venture into the Dark Forest and encounter a wild enemy!", "1;31")
            special_fighting_area(player)
        elif choice == '2':
            current_date = datetime.date.today()
            if player.last_mystic_mountains_visit == current_date:
                print_color("You can only visit the Mystic Mountains once per day. Please try again tomorrow.", "1;31")
                # Add pause after daily limit message
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            else:
                print_color("You climb the Mystic Mountains and find hidden treasures!", "1;32")
                player.gold += 50
                print_color("You found 50 gold! Your total gold is now {:,}.".format(player.gold), "1;32")
                player.last_mystic_mountains_visit = current_date
                player.save_game()
                # Add pause after finding treasures
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
        elif choice == '3':
            print_color("You explore the Abandoned Castle and fight a ghost!", "1;31")
            special_fighting_area(player)
        elif choice == '4':
            print_color("Your current level is {} and you have {} experience.".format(player.level, player.experience), "1;32")
            print_color("You need {} experience to reach the next level.".format(player.experience_needed()), "1;32")
            if player.can_level_up():
                print_color("You have enough experience to advance to the next level!", "1;32")
                bbs.write("Do you want to level up? [Y]es or [N]o: ")
                response = bbs.getstr(1, 1, 1, "").upper()
                if response == 'Y':
                    player.level += 1
                    player.experience += 1
                    player.reset_health()
                    print_color("Congratulations! You have advanced to level {}.".format(player.level), "1;32")
                    # Add pause after leveling up
                    bbs.write("Press Enter to continue...")
                    bbs.getstr(1, 1, 1, "")
                else:
                    print_color("You chose not to level up.", "1;31")
                    # Add pause after declining level up
                    bbs.write("Press Enter to continue...")
                    bbs.getstr(1, 1, 1, "")
            else:
                print_color("You do not have enough experience to level up.", "1;31")
                # Add pause after showing experience info
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
        elif choice == '5':
            change_player_name(player)
        elif choice == '6':
            print_color("\nCurrent Class: {}".format(player.chosen_class), "1;32")
            print_color("Current Level: {}".format(player.level), "1;32")
            print_color("\nMastered Classes:", "1;34")
            if player.mastered_classes:
                for cls in player.mastered_classes:
                    print_color("- {}".format(cls), "1;32")
            else:
                print_color("None yet", "1;31")
            bbs.write("\nPress Enter to continue...")
            bbs.getstr(1, 1, 1, "")
        elif choice == '7':
            return

def read_messages():
    user = bbs.getuser(0)
    player_handle = user["handle"]

    message_db_file = os.path.join(script_dir, "message_db.pkl")
    if os.path.exists(message_db_file):
        with open(message_db_file, 'rb') as f:
            message_db = pickle.load(f)
    else:
        print_color("No messages found.", "1;31")
        return

    if player_handle not in message_db or not message_db[player_handle]:
        print_color("No messages found for {}.".format(player_handle), "1;31")
        return

    print_color("\nReading messages for {}:".format(player_handle), "1;34")
    messages = message_db[player_handle]
    updated_messages = []

    for idx, (sender, message) in enumerate(messages):
        print_color("Message {}:".format(idx + 1), "1;32")
        print_color("From: {}".format(sender), "1;32")
        print_color("Message: {}".format(message), "1;32")
        print_color("-" * 50, "1;32")

        while True:
            bbs.write("Options: [D]elete, [S]ave, [N]ext message: ")
            action = bbs.getstr(1, 1, 1, "")
            if action:
                action = action.upper()
            if action == 'D':
                print_color("Message deleted.", "1;31")
                break
            elif action == 'S':
                updated_messages.append((sender, message))
                print_color("Message saved.", "1;32")
                break
            elif action == 'N':
                break
            else:
                print_color("Invalid choice! Please choose [D]elete, [S]ave, or [N]ext.", "1;31")

    message_db[player_handle] = updated_messages
    with open(message_db_file, 'wb') as f:
        pickle.dump(message_db, f)

def visit_igms(player):
    while True:
        bbs.write("|CL")
        
        bbs.write("|02" + "-" * 45 + "\r\n")
        bbs.write("|04        More areas to discover|07\r\n")
        bbs.write("|02" + "-" * 45 + "\r\n")
        bbs.write("|10(1) |02Dragon Casino\r\n")
        bbs.write("|10(2) |02Return to Main Menu\r\n")
        bbs.write("|02" + "-" * 45 + "\r\n")
        
        bbs.write("|02Choose an IGM to visit|10: ")
        choice = bbs.getstr(1, 1, 1, "")
        
        if choice == '1':
            casino_igm.enter(player)
        elif choice == '2':
            break
        else:
            bbs.write("|04Invalid choice!\r\n")
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")

def verify_player_exists(player_name):
    file_path = os.path.join(script_dir, "{0}.sav".format(player_name))
    return os.path.exists(file_path)

def bank(player):
    while True:
        bbs.write("|CL")
        
        bbs.write("|02" + "-" * 40 + "\r\n")
        bbs.write("|04            Dragon Bank\r\n")
        bbs.write("|02" + "-" * 40 + "\r\n")
        bbs.write("|10(1) |02Deposit Gold |10(On hand: {:,})\r\n".format(player.gold))
        bbs.write("|10(2) |02Withdraw Gold |10(In bank: {:,})\r\n".format(player.bank_balance))
        bbs.write("|10(3) |02Transfer Gold to another Player\r\n")
        bbs.write("|10(4) |02Leave Dragon bank\r\n")
        bbs.write("|02" + "-" * 40 + "\r\n")
        
        bbs.write("|02Choose an action|10: ")
        choice = bbs.getstr(1, 1, 1, "")
        
        if choice is None or choice.strip() == "":
            continue
            
        if choice == '1':
            print_color("You have {0:,} gold on hand.".format(player.gold), "1;32")
            print_color("Enter amount to deposit or press 1 to deposit all: ", "1;32")
            amount_str = bbs.getstr(1, 10, 10, "0")
            if amount_str is None or amount_str.strip() == "":
                print_color("Invalid input!", "1;31")
                continue
            if amount_str == '1':
                amount = player.gold
            else:
                try:
                    amount = int(amount_str)
                    if amount <= 0:
                        print_color("Amount must be positive", "1;31")
                        continue
                except ValueError:
                    print_color("Invalid input! Please enter a valid number.", "1;31")
                    continue
            if amount > 0 and amount <= player.gold:
                player.gold -= amount
                player.bank_balance += amount
                print_color("You deposited {0:,} gold. Your balance is now {1:,} gold.".format(
                    amount, player.bank_balance), "1;32")
            else:
                print_color("You don't have that much gold!", "1;31")
            player.save_game()
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")
        
        elif choice == '2':
            print_color("Your bank balance is {0:,} gold.".format(player.bank_balance), "1;32")
            print_color("Enter amount to withdraw or press 1 to withdraw all: ", "1;32")
            amount_str = bbs.getstr(1, 10, 10, "0")
            if amount_str == '1':
                amount = player.bank_balance
            else:
                try:
                    amount = int(amount_str)
                    if amount <= 0:
                        raise ValueError("Amount must be positive")
                except ValueError:
                    print_color("Invalid input! Please enter a valid number.", "1;31")
                    continue
            if amount <= player.bank_balance:
                player.bank_balance -= amount
                player.gold += amount
                print_color("You withdrew {0:,} gold. Your balance is now {1:,} gold.".format(
                    amount, player.bank_balance), "1;32")
            else:
                print_color("You don't have that much gold in the bank!", "1;31")
            player.save_game()
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")
        elif choice == '3':
            bbs.write("Enter the name of the player to transfer gold to: ")
            recipient_name = bbs.getstr(1, 20, 20, "")
            if not recipient_name or not recipient_name.strip():
                print_color("Invalid input! Please enter a valid player name.", "1;31")
                continue
                
            recipient_name = recipient_name.strip()
            bbs.write("Enter amount to transfer: ")
            amount_str = bbs.getstr(1, 10, 10, "0")
            try:
                amount = int(amount_str)
                if amount <= 0:
                    print_color("Amount must be positive", "1;31")
                    continue
            except ValueError:
                print_color("Invalid input! Please enter a valid number.", "1;31")
                continue
                
            if amount <= player.bank_balance:
                if verify_player_exists(recipient_name):
                    recipient = Player.load_game(recipient_name)
                    if recipient:
                        player.bank_balance -= amount
                        recipient.bank_balance += amount
                        recipient.save_game()
                        player.save_game()
                        print_color("You transferred {0:,} gold to {1}. Your balance is now {2:,} gold.".format(
                            amount, recipient_name, player.bank_balance), "1;32")
                        recipient_message = "You received {0:,} gold from {1}. Your new balance is {2:,} gold.".format(
                            amount, player.name, recipient.bank_balance)
                        send_message_to_player(recipient_name, recipient_message)
                    else:
                        print_color("Player does not exist!", "1;31")
                else:
                    print_color("Player does not exist!", "1;31")
            else:
                print_color("You don't have that much gold in the bank!", "1;31")
            
        elif choice == '4':
            break
        
        else:
            print_color("Invalid choice!", "1;31")

def send_message():
    bbs.write("Enter the name of the player to message: ")
    recipient = bbs.getstr(1, 20, 20, "")
    bbs.write("Enter your message: ")
    message = bbs.getstr(1, 100, 100, "")
    
    message_db_file = os.path.join(script_dir, "message_db.pkl")
    if os.path.exists(message_db_file):
        with open(message_db_file, 'rb') as f:
            message_db = pickle.load(f)
    else:
        message_db = {}

    if recipient not in message_db:
        message_db[recipient] = []
    message_db[recipient].append((bbs.getuser(0)["handle"], message))

    with open(message_db_file, 'wb') as f:
        pickle.dump(message_db, f)

    print_color("Message sent to {}.".format(recipient), "1;32")

def send_message_to_player(recipient_name, message):
    message_db_file = os.path.join(script_dir, "message_db.pkl")
    if os.path.exists(message_db_file):
        with open(message_db_file, 'rb') as f:
            message_db = pickle.load(f)
    else:
        message_db = {}

    if recipient_name not in message_db:
        message_db[recipient_name] = []
    message_db[recipient_name].append((bbs.getuser(0)["handle"], message))

    with open(message_db_file, 'wb') as f:
        pickle.dump(message_db, f)

    print_color("Message sent to {}.".format(recipient_name), "1;32")

def display_main_menu(num_messages):
    user = bbs.getuser(0)
    player_handle = user["handle"]
    player = Player.load_game(player_handle)

    max_special_attacks = player.level * 2
    remaining_special_attacks = max_special_attacks - player.special_attacks_used
    current_date = datetime.date.today()
    
    if player.last_fight_date != current_date:
        player.daily_fights = 0
        player.last_fight_date = current_date

    remaining_fights = 20 - player.daily_fights
    resurrections_left = 3 - player.daily_resurrections

    bbs.write("|CL")
    bbs.write("|02" + "-" * 50 + "\r\n")
    bbs.write("|04    Red Dragon Quest |07- |04Main Menu |07v.2.0\r\n")
    bbs.write("|02" + "-" * 50 + "\r\n")
    bbs.write("|10(1) |02Find a Fight |14{:2}|07/|1420    |10(7) |02Send Message\r\n".format(remaining_fights))
    bbs.write("|10(2) |02Go to the Inn         |10(8) |02Read Messages |14{:3}\r\n".format(num_messages))
    bbs.write("|10(3) |02Fight Other Players   |10(9) |02Dragon Bank\r\n")
    bbs.write("|10(4) |02Dragons Online       |10(10) |02Dragon Weapons\r\n")
    bbs.write("|10(5) |02Dragon Scores        |10(11) |02Dragon Armory\r\n")
    bbs.write("|10(6) |02Dragon Journey       |10(12) |02Save and Exit\r\n")
    bbs.write("|02" + "-" * 50 + "\r\n")
    bbs.write("|10Gold: |02{:,} |10Special: |02{:2} |10Lives: |02{:1}\r\n".format(
        player.gold, remaining_special_attacks, resurrections_left))
    bbs.write("|02" + "-" * 50 + "\r\n")

def dragon_weapons(player):
    print_color("Welcome to the Dragon Weapons Shop!", "1;33")
    print_color("Purchase a weapon to increase your attack power.", "1;32")
    weapon_cost = player.level * 150  
    print_color("Weapon Cost: {} gold".format(weapon_cost), "1;32")
    bbs.write("Do you want to purchase a weapon? [Y]es or [N]o: ")
    choice = bbs.getstr(1, 1, 1, "")
    if choice is None or choice.strip() == "":
        return
    choice = choice.upper()
    if choice == 'Y' and player.gold >= weapon_cost:
        player.gold -= weapon_cost
        player.strength += player.level * 2  
        print_color("You purchased a weapon! Your strength is now {}.".format(player.strength), "1;32")
    else:
        print_color("You don't have enough gold or chose not to purchase.", "1;31")
    
    bbs.write("Press Enter to continue...")
    bbs.getstr(1, 1, 1, "")

def dragon_armor(player):
    print_color("Welcome to the Dragon Armor Shop!", "1;33")
    print_color("Purchase armor to increase your defense.", "1;32")
    armor_cost = player.level * 150  
    print_color("Armor Cost: {} gold".format(armor_cost), "1;32")
    bbs.write("Do you want to purchase armor? [Y]es or [N]o: ")
    choice = bbs.getstr(1, 1, 1, "")
    if choice is None or choice.strip() == "":
        return
    choice = choice.upper()
    if choice == 'Y' and player.gold >= armor_cost:
        player.gold -= armor_cost
        player.level += 1  
        print_color("You purchased armor! Your armor level is now {}.".format(player.level), "1;32")
    else:
        print_color("You don't have enough gold or chose not to purchase.", "1;31")
    
    bbs.write("Press Enter to continue...")
    bbs.getstr(1, 1, 1, "")

casino_igm = CasinoIGM()
igms = [casino_igm]

def main():
    display_welcome_screen()
    user = bbs.getuser(0)
    player_handle = user["handle"]
    player_file = "%s.sav" % player_handle

    try:
        player = Player.load_game(player_handle)
        if player is None:
            print_color("Welcome! Creating a new game for %s." % player_handle, "1;32")
            player = Player(player_handle)  # This will prompt for class selection
            player.save_game()
    except Exception as e:
        print_color("Error loading game: %s. Creating new game." % str(e), "1;31")
        player = Player(player_handle)
        player.save_game()

    player.is_online = True
    player.save_game()

    player.inventory.append(Item("Health Potion", heal))

    while True:
        current_date = datetime.date.today()
        if player.last_restriction_date != current_date:
            player.daily_resurrections = 0
            player.last_restriction_date = current_date

        if player.daily_resurrections >= 3:
            print_color("You have reached the maximum number of resurrections for today. Please try again tomorrow.", "1;31")
            player.is_online = False
            player.save_game()
            break

        num_messages = get_message_count(player_handle)
        display_main_menu(num_messages)
        bbs.write("|02Choose an action|10: ")
        choice = bbs.getstr(1, 2, 2, "")
        if choice is None or choice.strip() == "":
            continue

        trigger_random_event(player)

        if choice == '1':
            current_date = datetime.date.today()
            if player.last_fight_date != current_date:
                player.daily_fights = 0
                player.last_fight_date = current_date

            if player.daily_fights >= 20:
                print_color("You have reached the maximum number of fights for today. Please try again tomorrow.", "1;31")
            else:
                player.daily_fights += 1
                player.save_game()
                enemy = Enemy(player.level)
                enemy.reset_health()
                print_color("You are fighting {}!".format(enemy.name), "1;34")
                while enemy.health > 0 and player.is_alive():
                    print_color("Player Health: {}, Enemy Health: {}".format(player.health, enemy.health), "1;34")
                    bbs.write("Do you want to [A]ttack, use [I]tem, [H]eal, or [R]un? ")
                    action = bbs.getstr(1, 1, 1, "")
                    if not action:
                        continue
                    action = action.upper()
                    if action == 'A':
                        bbs.write("Choose attack type: [N]ormal or [S]pecial ({}/{} remaining)? ".format(player.special_attacks_used, player.level * 2))
                        sub_action = bbs.getstr(1, 1, 1, "")
                        if not sub_action:
                            continue
                        sub_action = sub_action.upper()
                        if sub_action == 'N':
                            damage = player.attack(enemy)
                        elif sub_action == 'S':
                            damage = player.special_attack(enemy)
                        else:
                            print_color("Invalid attack type!", "1;31")
                            continue
                        print_color("You attacked the enemy for {} damage. Enemy Health: {}".format(damage, enemy.health), "1;32")
                        if enemy.health > 0:
                            if random.choice([True, False]):
                                damage = enemy.attack(player)
                            else:
                                damage = enemy.special_attack(player)
                            print_color("The enemy attacked you for {} damage. Your Health: {}".format(damage, player.health), "1;31")
                            if player.health <= 0:
                                print_color("You have been defeated!", "1;31")
                                bbs.write("Press Enter to continue...")
                                bbs.getstr(1, 1, 1, "")   # <-- Add this pause
                                player.health = 0
                                player.daily_resurrections += 1
                                player.save_game()
                                break
                    elif action == 'I':
                        player.use_item()
                    elif action == 'H':
                        print_color("Enter the amount to heal (1 gold per hitpoint): ", "1;32")
                        heal_amount = int(bbs.getstr(1, 3, 3, "0"))
                        player.heal(heal_amount)
                    elif action == 'R':
                        print_color("You ran away!", "1;31")
                        break
                    else:
                        print_color("Invalid action!", "1;31")

                if player.is_alive() and enemy.health <= 0:
                    print_color("You defeated the enemy!", "1;32")
                    player.experience += player.level * 10
                    player.gold += player.level * 5
                    player.save_game()
                elif not player.is_alive():
                    print_color("You have been defeated!", "1;31")
                    bbs.write("Press Enter to continue...")
                    bbs.getstr(1, 1, 1, "")   # <-- Add this pause
                    player.health = 0
                    player.daily_resurrections += 1
                    player.save_game()
                    break
        elif choice == '2':
            inn(player)
        elif choice == '3':
            if player.level >= 5:
                fight_other_players(player)
            else:
                print_color("You need to be at least level 5 to fight other players.", "1;31")
        elif choice == '4':
            list_players_online()
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")
        elif choice == '5':
            show_high_scores()
            bbs.write("Press Enter to continue...")
            bbs.getstr(1, 1, 1, "")
        elif choice == '6':
            journey(player)
        elif choice == '7':
            send_message()
        elif choice == '8':
            read_messages()
        elif choice == '9':
            bank(player)
        elif choice == '10':
            dragon_weapons(player)
        elif choice == '11':
            dragon_armor(player)
        elif choice == '12':
            player.is_online = False
            player.save_game()
            print_color("Game saved. Goodbye!", "1;32")
            break
        else:
            print_color("Invalid choice! Returning to main menu.", "1;31")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        # Defensive: Always open log file in script_dir!
        with open(os.path.join(script_dir, "casino_error.log"), "w") as log:
            log.write(traceback.format_exc())
        print_color("A Python error occurred. See casino_error.log for details.", "1;31")
