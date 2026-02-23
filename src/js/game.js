console.log('Yahtzee game initializing...');

// Constants
const CATEGORIES = {
    UPPER: [
        { id: 'ones', name: 'Ones', description: 'Total of ones' },
        { id: 'twos', name: 'Twos', description: 'Total of twos' },
        { id: 'threes', name: 'Threes', description: 'Total of threes' },
        { id: 'fours', name: 'Fours', description: 'Total of fours' },
        { id: 'fives', name: 'Fives', description: 'Total of fives' },
        { id: 'sixes', name: 'Sixes', description: 'Total of sixes' },
    ],
    LOWER: [
        { id: 'three_of_kind', name: '3 of a Kind', description: 'Total of all dice' },
        { id: 'four_of_kind', name: '4 of a Kind', description: 'Total of all dice' },
        { id: 'full_house', name: 'Full House', description: '25 points' },
        { id: 'small_straight', name: 'Small Straight', description: '30 points' },
        { id: 'large_straight', name: 'Large Straight', description: '40 points' },
        { id: 'yahtzee', name: 'Yahtzee', description: '50 points' },
        { id: 'chance', name: 'Chance', description: 'Total of all dice' },
    ]
};

class YahtzeeGame {
    constructor() {
        this.players = [];
        this.currentPlayerIdx = 0;
        this.dice = [1, 1, 1, 1, 1];
        this.held = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.round = 1;
        this.history = JSON.parse(localStorage.getItem('yahtzee_history') || '[]');
        this.canAddPlayers = true;
        this.pendingScore = null;

        this.init();
    }

    init() {
        this.loadState() || this.setupNewGame();
        this.setupTheme();
        this.render();
        this.bindEvents();
    }

    setupNewGame() {
        this.players = [
            this.createPlayer('P1'),
            this.createPlayer('P2')
        ];
        this.currentPlayerIdx = 0;
        this.canAddPlayers = true;
        this.isWaitingForNext = false;
        this.selectedCategory = null;
        this.pendingScore = null;
        this.rollsLeft = 3;
        this.round = 1;
        this.dice = [1, 1, 1, 1, 1];
        this.held = [false, false, false, false, false];
        this.saveState();
    }

    createPlayer(name) {
        const scores = {};
        [...CATEGORIES.UPPER, ...CATEGORIES.LOWER].forEach(cat => scores[cat.id] = null);
        return { name, scores };
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('yahtzee_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    bindEvents() {
        document.getElementById('theme-btn').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('yahtzee_theme', next);
        });

        document.getElementById('add-player-btn').addEventListener('click', () => {
            if (this.canAddPlayers && this.players.length < 4) {
                this.players.push(this.createPlayer(`P${this.players.length + 1}`));
                this.render();
                this.saveState();
            }
        });

        document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
        document.getElementById('next-btn').addEventListener('click', () => this.nextTurn());
        document.getElementById('abandon-btn').addEventListener('click', () => this.abandonGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    }

    abandonGame() {
        if (confirm('Are you sure you want to abandon this game? Current scores will be saved to history.')) {
            this.endGame();
        }
    }

    restartGame() {
        if (confirm('Are you sure you want to discard this game and start over?')) {
            localStorage.removeItem('yahtzee_state');
            this.setupNewGame();
            this.render();
        }
    }

    resignPlayer(idx) {
        if (this.players.length <= 2) {
            alert('A game must have at least 2 players. You can abandon the game instead.');
            return;
        }

        if (confirm(`Are you sure ${this.players[idx].name} wants to resign?`)) {
            this.players.splice(idx, 1);
            if (this.currentPlayerIdx >= this.players.length) {
                this.currentPlayerIdx = 0;
            }
            this.render();
            this.saveState();
        }
    }

    rollDice() {
        if (this.rollsLeft === 0 || this.isRolling || this.isWaitingForNext) return;

        const baseDuration = 800;
        const sequentialDelay = 300;

        this.isRolling = true;
        this.rollingIndices = [];
        this.dice.forEach((_, i) => {
            if (!this.held[i]) this.rollingIndices.push(i);
        });

        if (this.rollingIndices.length === 0) {
            this.isRolling = false;
            this.rollsLeft--;
            this.render();
            return;
        }

        this.render();

        const diceEls = document.querySelectorAll('.die');
        let rollIndex = 0;

        this.rollingIndices.forEach((diceIdx) => {
            const el = diceEls[diceIdx];

            const flickerInterval = setInterval(() => {
                el.dataset.value = Math.floor(Math.random() * 6) + 1;
            }, 100);

            const stopDelay = baseDuration + (rollIndex * sequentialDelay);
            rollIndex++;

            setTimeout(() => {
                clearInterval(flickerInterval);
                const newVal = Math.floor(Math.random() * 6) + 1;
                this.dice[diceIdx] = newVal;

                // Remove from rolling set
                this.rollingIndices = this.rollingIndices.filter(idx => idx !== diceIdx);

                if (this.rollingIndices.length === 0) {
                    // Slight delay before final render to let the last die "settle" visually
                    setTimeout(() => {
                        this.isRolling = false;
                        this.rollsLeft--;
                        this.saveState();
                        this.render();
                    }, 150);
                } else {
                    el.dataset.value = newVal;
                    el.classList.remove('rolling');
                }
            }, stopDelay);
        });
    }

    toggleDie(idx) {
        if (this.rollsLeft === 3 || this.isRolling || this.isWaitingForNext) return;
        this.held[idx] = !this.held[idx];
        this.render();
    }

    saveState() {
        const state = {
            players: this.players,
            currentPlayerIdx: this.currentPlayerIdx,
            dice: this.dice,
            held: this.held,
            rollsLeft: this.rollsLeft,
            round: this.round,
            canAddPlayers: this.canAddPlayers,
            isWaitingForNext: this.isWaitingForNext,
            pendingScore: this.pendingScore
        };
        localStorage.setItem('yahtzee_state', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('yahtzee_state');
        if (saved) {
            const state = JSON.parse(saved);
            Object.assign(this, state);
            this.rollingIndices = []; // Ensure fresh state
            return true;
        }
        return false;
    }

    render() {
        this.renderAvatars();
        this.renderDice();
        this.renderScoreboard();
        this.renderHistory();

        const rollBtn = document.getElementById('roll-btn');
        const nextBtn = document.getElementById('next-btn');

        if (this.isWaitingForNext) {
            rollBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
        } else {
            rollBtn.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            rollBtn.textContent = this.isRolling ? 'Rolling...' : `Roll Dice (${this.rollsLeft} left)`;
            rollBtn.disabled = this.rollsLeft === 0 || this.isRolling;
        }

        const addPlayerBtn = document.getElementById('add-player-btn');
        if (addPlayerBtn) {
            addPlayerBtn.style.display = (this.canAddPlayers && this.players.length < 4) ? 'flex' : 'none';
        }
    }

    renderAvatars() {
        const container = document.getElementById('player-avatars');
        const addBtn = document.getElementById('add-player-btn');
        container.innerHTML = '';

        this.players.forEach((p, i) => {
            const avatar = document.createElement('div');
            avatar.className = `avatar p${i + 1} ${i === this.currentPlayerIdx ? 'active' : ''}`;
            avatar.textContent = p.name;

            const resignX = document.createElement('div');
            resignX.className = 'resign-x';
            resignX.textContent = '×';
            resignX.title = 'Resign';
            resignX.addEventListener('click', (e) => {
                e.stopPropagation();
                this.resignPlayer(i);
            });

            avatar.appendChild(resignX);
            container.appendChild(avatar);
        });
        container.appendChild(addBtn);
    }

    renderDice() {
        const container = document.getElementById('dice-container');
        const pipsSvg = `
        <svg id="pips" width="114" height="114" viewBox="0 0 114 114" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="99" cy="99" r="15" data-pip="7"/>
        <circle cx="15" cy="99" r="15" data-pip="6"/>
        <circle cx="99" cy="57" r="15" data-pip="5"/>
        <circle cx="57" cy="57" r="15" data-pip="4"/>
        <circle cx="15" cy="57" r="15" data-pip="3"/>
        <circle cx="99" cy="15" r="15" data-pip="2"/>
        <circle cx="15" cy="15" r="15" data-pip="1"/>
        </svg>
        `;
        container.innerHTML = '';
        this.dice.forEach((val, i) => {
            const die = document.createElement('div');
            const isRolling = (this.rollingIndices || []).includes(i);
            die.className = `die ${this.held[i] ? 'held' : ''} ${isRolling ? 'rolling' : ''}`;
            die.dataset.value = val;
            die.innerHTML = pipsSvg;
            // die.textContent = val;
            die.addEventListener('click', () => this.toggleDie(i));
            container.appendChild(die);
        });
    }

    renderScoreboard() {
        const headerRow = document.getElementById('player-headers');
        headerRow.innerHTML = '<th>Category</th>';
        this.players.forEach((p, i) => {
            const th = document.createElement('th');
            th.className = `player-col ${i === this.currentPlayerIdx ? 'active' : ''}`;
            th.textContent = p.name;
            headerRow.appendChild(th);
        });

        const tbody = document.getElementById('score-rows');
        tbody.innerHTML = '';

        // Upper Section
        this.renderSection(tbody, "Upper Section", CATEGORIES.UPPER);
        this.renderTotalRow(tbody, "Upper Total", (p) => this.calculateUpperTotal(p.scores));
        this.renderTotalRow(tbody, "Bonus (63+)", (p) => this.calculateUpperBonus(p.scores) ? 35 : 0);

        // Lower Section
        this.renderSection(tbody, "Lower Section", CATEGORIES.LOWER);

        // Footer Totals
        const footerRow = document.getElementById('grand-total-row');
        footerRow.innerHTML = '<td>Grand Total</td>';
        this.players.forEach((p, i) => {
            const td = document.createElement('td');
            td.className = i === this.currentPlayerIdx ? 'active-col footer-cell' : '';
            td.textContent = this.calculateGrandTotal(p.scores);
            footerRow.appendChild(td);
        });
    }

    renderSection(tbody, title, categories) {
        const header = document.createElement('tr');
        header.className = 'section-header';
        header.innerHTML = `<td colspan="${this.players.length + 1}">${title}</td>`;
        tbody.appendChild(header);

        categories.forEach(cat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${cat.name}</td>`;
            this.players.forEach((p, i) => {
                const td = document.createElement('td');
                const score = p.scores[cat.id];
                td.className = `score-cell ${score !== null ? 'filled' : ''} ${i === this.currentPlayerIdx ? 'active-col' : ''}`;
                td.textContent = score !== null ? score : '-';

                if (i === this.currentPlayerIdx && score === null && this.rollsLeft < 3) {
                    const preview = this.calculatePotentialScore(cat.id, this.dice);

                    if (this.pendingScore && this.pendingScore.catId === cat.id) {
                        td.textContent = this.pendingScore.score;
                        td.classList.add('filled'); // Keep blue
                    } else {
                        td.textContent = preview;
                        td.classList.add('preview');
                    }

                    td.addEventListener('click', () => this.selectScore(cat.id, preview));
                }

                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    renderTotalRow(tbody, title, calcFn) {
        const tr = document.createElement('tr');
        tr.className = 'total-row';
        tr.innerHTML = `<td>${title}</td>`;
        this.players.forEach(p => {
            const td = document.createElement('td');
            td.textContent = calcFn(p);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }

    renderHistory() {
        const tbody = document.getElementById('history-rows');
        tbody.innerHTML = '';

        [...this.history].reverse().forEach((game, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>Game ${this.history.length - idx}</td>`;

            const maxScore = Math.max(...Object.values(game));

            this.players.forEach(p => {
                const td = document.createElement('td');
                const score = game[p.name] || 0;
                td.textContent = score;
                if (score === maxScore && score > 0) td.classList.add('winner');
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    selectScore(catId, score) {
        this.pendingScore = { catId, score };
        this.isWaitingForNext = true;
        this.saveState();
        this.render();
    }

    nextTurn() {
        if (this.pendingScore) {
            this.players[this.currentPlayerIdx].scores[this.pendingScore.catId] = this.pendingScore.score;
            this.pendingScore = null;
        }

        this.isWaitingForNext = false;
        this.held = [false, false, false, false, false];
        this.rollsLeft = 3;
        this.dice = [1, 1, 1, 1, 1];

        this.currentPlayerIdx++;
        if (this.currentPlayerIdx >= this.players.length) {
            this.currentPlayerIdx = 0;
            if (this.canAddPlayers) this.canAddPlayers = false; // Closed joining after first round
            this.round++;
        }

        if (this.round > 13) {
            this.endGame();
        } else {
            this.saveState();
            this.render();
        }
    }

    endGame() {
        const results = {};
        this.players.forEach(p => {
            results[p.name] = this.calculateGrandTotal(p.scores);
        });
        this.history.push(results);
        localStorage.setItem('yahtzee_history', JSON.stringify(this.history));

        alert('Game Over!');
        localStorage.removeItem('yahtzee_state');
        this.setupNewGame();
        this.render();
    }

    // Scoring Logic
    calculatePotentialScore(catId, dice) {
        const counts = this.getCounts(dice);
        switch (catId) {
            case 'ones': return counts[1] * 1;
            case 'twos': return counts[2] * 2;
            case 'threes': return counts[3] * 3;
            case 'fours': return counts[4] * 4;
            case 'fives': return counts[5] * 5;
            case 'sixes': return counts[6] * 6;
            case 'three_of_kind': return this.hasCount(counts, 3) ? this.sum(dice) : 0;
            case 'four_of_kind': return this.hasCount(counts, 4) ? this.sum(dice) : 0;
            case 'full_house': return (this.hasCount(counts, 3) && this.hasCount(counts, 2)) ? 25 : 0;
            case 'small_straight': return this.hasStraight(dice, 4) ? 30 : 0;
            case 'large_straight': return this.hasStraight(dice, 5) ? 40 : 0;
            case 'yahtzee': return this.hasCount(counts, 5) ? 50 : 0;
            case 'chance': return this.sum(dice);
            default: return 0;
        }
    }

    getCounts(dice) {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
        return counts;
    }

    hasCount(counts, n) {
        return Object.values(counts).some(c => c >= n);
    }

    sum(dice) {
        return dice.reduce((a, b) => a + b, 0);
    }

    hasStraight(dice, len) {
        const unique = [...new Set(dice)].sort();
        let currentLen = 1;
        let maxLen = 1;
        for (let i = 0; i < unique.length - 1; i++) {
            if (unique[i + 1] === unique[i] + 1) {
                currentLen++;
            } else {
                currentLen = 1;
            }
            maxLen = Math.max(maxLen, currentLen);
        }
        return maxLen >= len;
    }

    calculateUpperTotal(scores) {
        return CATEGORIES.UPPER.reduce((sum, cat) => sum + (scores[cat.id] || 0), 0);
    }

    calculateUpperBonus(scores) {
        return this.calculateUpperTotal(scores) >= 63;
    }

    calculateGrandTotal(scores) {
        const upper = this.calculateUpperTotal(scores);
        const bonus = upper >= 63 ? 35 : 0;
        const lower = CATEGORIES.LOWER.reduce((sum, cat) => sum + (scores[cat.id] || 0), 0);
        return upper + bonus + lower;
    }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
    window.game = new YahtzeeGame();
});
