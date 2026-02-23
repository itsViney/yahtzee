# Yahtzee - Modern Pass & Play

A modern, responsive, and feature-rich Yahtzee game built for the web. This is a "Pass & Play" experience designed for local multiplayer (2-4 players).

## How to Play

1.  **Add Players**: At the start of the game, use the **+** button in the header to add up to 4 players.
2.  **Roll Dice**: Click the **Roll Dice** button to roll all non-held dice. You have up to 3 rolls per turn.
3.  **Hold Dice**: Click on individual dice to "hold" them between rolls (indicated by a blue border).
4.  **Score**: After your 1st, 2nd, or 3rd roll, click on an empty cell in the scoreboard to select a category.
5.  **End Turn**: Once a category is selected, click **End Turn** to finalize your score and pass the device to the next player.
6.  **Win**: The game lasts 13 rounds. The player with the highest total score at the end wins!

## Game Rules

### Upper Section
Score the sum of the dice matching the category:
- **Ones, Twos, Threes, Fours, Fives, Sixes**: Score the total of that specific number.
- **Bonus**: If the sum of your Upper Section scores is 63 or higher, you receive a **35-point bonus**.

### Lower Section
- **3 of a Kind**: Sum of all dice (requires at least 3 dice of the same value).
- **4 of a Kind**: Sum of all dice (requires at least 4 dice of the same value).
- **Full House**: 25 points (3 of one value and 2 of another).
- **Small Straight**: 30 points (4 sequential dice, e.g., 1-2-3-4).
- **Large Straight**: 40 points (5 sequential dice, e.g., 1-2-3-4-5).
- **Yahtzee**: 50 points (5 dice of the same value).
- **Chance**: Sum of all dice (no requirements).

## Features

- **Dark Mode**: Toggle between light and dark themes using the 🌓 button.
- **Game Persistence**: Your current game state and player list are saved automatically. You can refresh or return later without losing progress.
- **Game History**: Track your previous games and see who won at a glance in the history table below the main game area.
- **Responsive Design**: Playable on mobile, tablet, or desktop.
