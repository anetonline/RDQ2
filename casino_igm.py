import random
import mystic_bbs as bbs
import os
import sys

if os.path.dirname(os.path.abspath(__file__)) not in sys.path:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from RDQ2 import IGM, print_color

class CasinoIGM(IGM):
    def __init__(self):
        super(CasinoIGM, self).__init__("Dragon Casino", "Try your luck at various games of chance!")
        
    def enter(self, player):
        while True:
            menu = """
               |02--------------------------------------------------
                            |04Dragon Casino IGM|07
               |02--------------------------------------------------
                  |10(1) |02Slot Machine   |10(Bet 100-1000 gold)
                  |10(2) |02Roulette       |10(Bet 500-5000 gold)
                  |10(3) |02Dragon Dice    |10(Bet 200-2000 gold)
                  |10(4) |02Check Balance  |10(Gold: {:,})
                  |10(5) |02Leave Casino
               |02--------------------------------------------------
            """.format(player.gold)
            
            print_color(menu, "1;33")
            bbs.write("|02Choose your game|10: ")
            choice = bbs.getstr(1, 1, 1, "")
            
            if choice == '1':
                self._play_slots(player)
            elif choice == '2':
                self._play_roulette(player)
            elif choice == '3':
                self._play_dice(player)
            elif choice == '4':
                print_color("Your current balance is {:,} gold.".format(player.gold), "1;32")
                bbs.write("Press Enter to continue...")
                bbs.getstr(1, 1, 1, "")
            elif choice == '5':
                print_color("Thank you for visiting the Dragon Casino!", "1;32")
                break
            else:
                print_color("Invalid choice!", "1;31")

    def _get_bet(self, player, min_bet, max_bet):
        while True:
            print_color("Enter bet amount ({}-{} gold): ".format(min_bet, max_bet), "1;32")
            try:
                bet = int(bbs.getstr(1, 5, 5, ""))
                if min_bet <= bet <= max_bet:
                    if bet <= player.gold:
                        return bet
                    else:
                        print_color("You don't have enough gold!", "1;31")
                else:
                    print_color("Bet must be between {} and {} gold.".format(min_bet, max_bet), "1;31")
            except ValueError:
                print_color("Invalid bet amount!", "1;31")

    def _play_slots(self, player):
        symbols = ["🐉", "💎", "👑", "⚔️", "🛡️"]
        bet = self._get_bet(player, 100, 1000)
        
        if bet:
            player.gold -= bet
            print_color("\nSpinning the slots...", "1;35")
            bbs.write("Press Enter to stop the reels...")
            bbs.getstr(1, 1, 1, "")
            
            reels = [random.choice(symbols) for _ in range(3)]
            print_color("".join(reels), "1;33")
            
            if all(r == reels[0] for r in reels):  # All symbols match
                winnings = bet * 5
                print_color("JACKPOT! You won {:,} gold!".format(winnings), "1;32")
                player.gold += winnings
            elif reels[0] == reels[1] or reels[1] == reels[2]:  # Two symbols match
                winnings = bet * 2
                print_color("Winner! You won {:,} gold!".format(winnings), "1;32")
                player.gold += winnings
            else:
                print_color("Better luck next time!", "1;31")
            
            player.save_game()

    def _play_roulette(self, player):
        bet = self._get_bet(player, 500, 5000)
        if bet:
            print_color("\nRoulette Options:", "1;34")
            print_color("1. Red or Black (2x payout)", "1;32")
            print_color("2. Single Number (35x payout)", "1;32")
            print_color("3. Even or Odd (2x payout)", "1;32")
            
            bbs.write("Choose your bet type: ")
            bet_type = bbs.getstr(1, 1, 1, "")
            
            if bet_type == '1':
                bbs.write("Choose [R]ed or [B]lack: ")
                choice = bbs.getstr(1, 1, 1, "").upper()
                if choice in ['R', 'B']:
                    player.gold -= bet
                    result = random.choice(['R', 'B'])
                    if choice == result:
                        winnings = bet * 2
                        print_color("Winner! You won {:,} gold!".format(winnings), "1;32")
                        player.gold += winnings
                    else:
                        print_color("Better luck next time!", "1;31")
            
            elif bet_type == '2':
                bbs.write("Choose a number (0-36): ")
                try:
                    number = int(bbs.getstr(1, 2, 2, ""))
                    if 0 <= number <= 36:
                        player.gold -= bet
                        result = random.randint(0, 36)
                        if number == result:
                            winnings = bet * 35
                            print_color("JACKPOT! You won {:,} gold!".format(winnings), "1;32")
                            player.gold += winnings
                        else:
                            print_color("Better luck next time! Number was: {}".format(result), "1;31")
                except ValueError:
                    print_color("Invalid number!", "1;31")
            
            elif bet_type == '3':
                bbs.write("Choose [E]ven or [O]dd: ")
                choice = bbs.getstr(1, 1, 1, "").upper()
                if choice in ['E', 'O']:
                    player.gold -= bet
                    result = random.randint(1, 36)
                    if (result % 2 == 0 and choice == 'E') or (result % 2 == 1 and choice == 'O'):
                        winnings = bet * 2
                        print_color("Winner! You won {:,} gold!".format(winnings), "1;32")
                        player.gold += winnings
                    else:
                        print_color("Better luck next time! Number was: {}".format(result), "1;31")
            
            player.save_game()

    def _play_dice(self, player):
        bet = self._get_bet(player, 200, 2000)
        if bet:
            print_color("\nDragon Dice - Roll two dice and beat the house!", "1;34")
            print_color("7 or 11 on first roll: Win 2x", "1;32")
            print_color("2, 3, or 12 on first roll: Lose", "1;31")
            print_color("Other numbers: That's your point, roll it again to win!", "1;32")
            
            bbs.write("\nPress Enter to roll the dice...")
            bbs.getstr(1, 1, 1, "")
            
            player.gold -= bet
            dice1 = random.randint(1, 6)
            dice2 = random.randint(1, 6)
            total = dice1 + dice2
            
            print_color("You rolled: {} + {} = {}".format(dice1, dice2, total), "1;33")
            
            if total in [7, 11]:
                winnings = bet * 2
                print_color("Winner! You won {:,} gold!".format(winnings), "1;32")
                player.gold += winnings
            elif total in [2, 3, 12]:
                print_color("Craps! Better luck next time!", "1;31")
            else:
                point = total
                print_color("Your point is {}. Roll again!".format(point), "1;34")
                while True:
                    bbs.write("\nPress Enter to roll again...")
                    bbs.getstr(1, 1, 1, "")
                    dice1 = random.randint(1, 6)
                    dice2 = random.randint(1, 6)
                    new_total = dice1 + dice2
                    print_color("You rolled: {} + {} = {}".format(dice1, dice2, new_total), "1;33")
                    
                    if new_total == point:
                        winnings = bet * 2
                        print_color("Winner! You made your point! You won {:,} gold!".format(winnings), "1;32")
                        player.gold += winnings
                        break
                    elif new_total == 7:
                        print_color("Seven out! Better luck next time!", "1;31")
                        break
            
            player.save_game()
