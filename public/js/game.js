(function () {
  const gameState = {
    currentPage: 'cover',
    players: [],
    currentPlayerIndex: 0,
    scores: {},
    energy: 65,
    timeIndex: 2,
    weatherIndex: 1,
    currentCard: null,
    correctAnswer: null,
    displayedAnswers: [],
    selectedAnswer: null,
    timerInterval: null,
    timeLeft: 10,
    roundCount: 0,
    gameMode: 'family',
    specialEvent: null
  };

  const timeNames = ['Dawn', 'Morning', 'Midday', 'Afternoon', 'Sunset', 'Evening', 'Night'];
  const timeIcons = ['🌅', '☀️', '☀️', '☀️', '🧡', '🌙', '🌚'];
  const timeClasses = ['dawn', 'morning', 'midday', 'afternoon', 'sunset', 'evening', 'night'];

  const weatherNames = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy', 'Foggy'];
  const weatherIcons = ['☀️', '☁️', '🌧️', '💨', '❄️', '🌫️'];

  const energyStatuses = [
    { name: 'Exhausted', icon: '💤', range: [0, 20] },
    { name: 'Lazy', icon: '😴', range: [21, 40] },
    { name: 'Normal', icon: '😐', range: [41, 60] },
    { name: 'Playful', icon: '🎾', range: [61, 80] },
    { name: 'ZOOMIES', icon: '⚡', range: [81, 100] }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
  });

  function setupEventListeners() {
    const startTrigger = document.getElementById('start-game-trigger');
    if (startTrigger) {
      startTrigger.addEventListener('click', function () {
        showPage('setup');
      });
    }

    const backToCover = document.getElementById('back-to-cover');
    if (backToCover) {
      backToCover.addEventListener('click', function () {
        showPage('cover');
      });
    }

    const backToCoverVictory = document.getElementById('back-to-cover-victory');
    if (backToCoverVictory) {
      backToCoverVictory.addEventListener('click', function () {
        showPage('cover');
      });
    }

    const addPlayerBtn = document.getElementById('add-player-btn');
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener('click', function () {
        addPlayerRow();
      });
    }

    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', function () {
        startNewGame();
      });
    }

    document.querySelectorAll('.answer-box').forEach((box) => {
      box.addEventListener('click', function () {
        selectAnswer(this.dataset.answer);
      });
    });

    const lockGuessBtn = document.getElementById('lock-guess');
    if (lockGuessBtn) {
      lockGuessBtn.addEventListener('click', function () {
        submitGuess();
      });
    }

    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', function () {
        resetGame();
        startNewGame();
      });
    }

    const newPlayersBtn = document.getElementById('new-players-btn');
    if (newPlayersBtn) {
      newPlayersBtn.addEventListener('click', function () {
        showPage('setup');
      });
    }
  }

  function showPage(pageName) {
    document.querySelectorAll('.page').forEach((page) => {
      page.classList.remove('active');
    });

    const pageEl = document.getElementById(`page-${pageName}`);
    if (pageEl) pageEl.classList.add('active');

    gameState.currentPage = pageName;

    if (pageName === 'game') {
      initializeGameRound();
    }
  }

  function addPlayerRow() {
    const visibleRows = document.querySelectorAll('.player-input-row:not(.hidden)').length;
    if (visibleRows < 4) {
      const nextRow = document.getElementById(`player${visibleRows + 1}-row`);
      if (nextRow) nextRow.classList.remove('hidden');
    }

    if (visibleRows + 1 >= 4) {
      const addPlayerBtn = document.getElementById('add-player-btn');
      if (addPlayerBtn) addPlayerBtn.style.display = 'none';
    }
  }

  function startNewGame() {
    const players = [];
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`player${i}`);
      const row = document.getElementById(`player${i}-row`);
      if (input && row && !row.classList.contains('hidden') && input.value.trim()) {
        players.push({
          id: i,
          name: input.value.trim(),
          avatar: getAvatarClass(i)
        });
      }
    }

    if (players.length === 0) {
      players.push({ id: 1, name: 'Cat Friend', avatar: 'tabby' });
    }

    const selectedMode = document.querySelector('input[name="gamemode"]:checked');
    const gameMode = selectedMode ? selectedMode.value : 'family';

    gameState.players = players;
    gameState.scores = {};
    players.forEach((p) => {
      gameState.scores[p.id] = 0;
    });
    gameState.currentPlayerIndex = 0;
    gameState.gameMode = gameMode;

    gameState.energy = Math.floor(Math.random() * 40) + 30;
    gameState.timeIndex = Math.floor(Math.random() * 3) + 1;
    gameState.weatherIndex = Math.floor(Math.random() * 4);
    gameState.roundCount = 0;
    gameState.specialEvent = null;

    updateScores();
    updateEnergyMeter();
    updateTimeWeather();
    updateBackground();

    showPage('game');
  }

  function initializeGameRound() {
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }

    const cards = Array.isArray(window.wonderCards) ? window.wonderCards : [];
    if (cards.length === 0) {
      showResultMessage('No cards loaded', 'fail');
      return;
    }

    const randomIndex = Math.floor(Math.random() * cards.length);
    gameState.currentCard = cards[randomIndex];

    const cardText = document.getElementById('card-text');
    const cardImage = document.getElementById('card-image');
    if (cardText) cardText.innerText = gameState.currentCard.title;
    if (cardImage) cardImage.innerHTML = gameState.currentCard.imageIcon || '🐱';

    const matchClues = Math.random() > 0.5;
    let possibleAnswers = gameState.currentCard.answers || [];

    if (matchClues) {
      possibleAnswers = possibleAnswers.filter((answer) => answerMatchesClues(answer));
    }

    if (possibleAnswers.length === 0) {
      possibleAnswers = gameState.currentCard.answers || [];
    }

    const correctIndex = Math.floor(Math.random() * possibleAnswers.length);
    gameState.correctAnswer = possibleAnswers[correctIndex];

    const otherAnswers = (gameState.currentCard.answers || []).filter((a) => a !== gameState.correctAnswer);
    const shuffled = shuffleArray(otherAnswers.slice());
    const decoys = shuffled.slice(0, 2);

    const allDisplayAnswers = [gameState.correctAnswer, ...decoys];
    gameState.displayedAnswers = shuffleArray(allDisplayAnswers.slice());

    setAnswerBox('a', gameState.displayedAnswers[0]);
    setAnswerBox('b', gameState.displayedAnswers[1]);
    setAnswerBox('c', gameState.displayedAnswers[2]);

    const correctIndexInDisplay = gameState.displayedAnswers.findIndex((a) => a === gameState.correctAnswer);
    const answerA = document.getElementById('answer-a');
    const answerB = document.getElementById('answer-b');
    const answerC = document.getElementById('answer-c');
    if (answerA) answerA.dataset.correct = (correctIndexInDisplay === 0).toString();
    if (answerB) answerB.dataset.correct = (correctIndexInDisplay === 1).toString();
    if (answerC) answerC.dataset.correct = (correctIndexInDisplay === 2).toString();

    gameState.selectedAnswer = null;
    document.querySelectorAll('.answer-box').forEach((box) => box.classList.remove('selected'));

    gameState.timeLeft = gameState.gameMode === 'chaos' ? 5 : 10;
    const timerText = document.getElementById('timer-text');
    const timerBar = document.getElementById('timer-bar');
    if (timerText) timerText.innerText = String(gameState.timeLeft);
    if (timerBar) timerBar.style.width = '100%';

    const maxTime = gameState.gameMode === 'chaos' ? 5 : 10;

    gameState.timerInterval = setInterval(function () {
      gameState.timeLeft = Math.max(0, gameState.timeLeft - 0.1);
      const percent = (gameState.timeLeft / maxTime) * 100;

      const timerBarEl = document.getElementById('timer-bar');
      const timerTextEl = document.getElementById('timer-text');
      if (timerBarEl) timerBarEl.style.width = Math.max(0, percent) + '%';
      if (timerTextEl) timerTextEl.innerText = String(Math.ceil(gameState.timeLeft));

      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.timerInterval);
        handleTimeout();
      }
    }, 100);
  }

  function setAnswerBox(letter, answer) {
    const textEl = document.getElementById(`answer-${letter}-text`);
    const iconEl = document.getElementById(`answer-${letter}-icon`);
    if (textEl) textEl.innerText = answer?.text || '';
    if (iconEl) iconEl.innerText = answer?.icon || '';
  }

  function answerMatchesClues(answer) {
    const energyMatch = answer.energyRange
      ? gameState.energy >= answer.energyRange[0] && gameState.energy <= answer.energyRange[1]
      : true;

    const timeMatch = answer.bestTime === 'any' || answer.bestTime === timeNames[gameState.timeIndex].toLowerCase();
    const weatherMatch =
      answer.bestWeather === 'any' || answer.bestWeather === weatherNames[gameState.weatherIndex].toLowerCase();

    return energyMatch && timeMatch && weatherMatch;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function selectAnswer(answerLetter) {
    if (!answerLetter) return;
    gameState.selectedAnswer = answerLetter;

    document.querySelectorAll('.answer-box').forEach((box) => {
      box.classList.remove('selected');
    });

    const selectedEl = document.getElementById(`answer-${answerLetter.toLowerCase()}`);
    if (selectedEl) selectedEl.classList.add('selected');
  }

  function submitGuess() {
    if (!gameState.selectedAnswer) {
      if (gameState.gameMode === 'family') {
        selectAnswer('A');
      } else {
        return;
      }
    }

    clearInterval(gameState.timerInterval);

    const selectedBox = document.getElementById(`answer-${gameState.selectedAnswer.toLowerCase()}`);
    const isCorrect = selectedBox?.dataset.correct === 'true';

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (isCorrect) {
      const matchedClues = answerMatchesClues(gameState.correctAnswer);
      const points = matchedClues ? 2 : 4;
      gameState.scores[currentPlayer.id] += points;
      showResultMessage(`✓ Correct! +${points} points`, 'success');
    } else {
      showResultMessage('✗ Not this time!', 'fail');
    }

    if (gameState.correctAnswer && typeof gameState.correctAnswer.energyEffect === 'number') {
      gameState.energy += gameState.correctAnswer.energyEffect;
    }
    gameState.energy = Math.max(0, Math.min(100, gameState.energy));

    gameState.roundCount++;
    if (gameState.roundCount % 2 === 0) {
      gameState.timeIndex = (gameState.timeIndex + 1) % 7;
    }

    if (Math.random() < 0.2) {
      gameState.weatherIndex = Math.floor(Math.random() * weatherNames.length);
    }

    updateScores();
    updateEnergyMeter();
    updateTimeWeather();
    updateBackground();

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    const winner = checkWinner();
    if (winner) {
      showVictory(winner);
    } else {
      setTimeout(function () {
        initializeGameRound();
      }, 1200);
    }
  }

  function handleTimeout() {
    showResultMessage("⏰ Time's up!", 'timeout');

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    setTimeout(function () {
      initializeGameRound();
    }, 900);
  }

  function showResultMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `result-message ${type}`;
    msgDiv.innerHTML = message;
    msgDiv.style.position = 'fixed';
    msgDiv.style.top = '50%';
    msgDiv.style.left = '50%';
    msgDiv.style.transform = 'translate(-50%, -50%)';
    msgDiv.style.background = 'white';
    msgDiv.style.border = '3px solid #4A4A4A';
    msgDiv.style.borderRadius = '30px';
    msgDiv.style.padding = '1rem 2rem';
    msgDiv.style.fontSize = '2rem';
    msgDiv.style.zIndex = '1000';
    msgDiv.style.boxShadow = '8px 8px 0 rgba(0,0,0,0.1)';

    document.body.appendChild(msgDiv);

    setTimeout(function () {
      msgDiv.remove();
    }, 1200);
  }

  function updateScores() {
    const container = document.getElementById('players-score-container');
    if (!container) return;

    container.innerHTML = '';

    gameState.players.forEach((player, index) => {
      const scoreDiv = document.createElement('div');
      scoreDiv.className = `player-score-item ${index === gameState.currentPlayerIndex ? 'current-turn' : ''}`;
      scoreDiv.innerHTML = `
        <div class="score-circle">${gameState.scores[player.id] ?? 0}</div>
        <span class="handwritten">${escapeHtml(player.name)}</span>
      `;
      container.appendChild(scoreDiv);
    });
  }

  function updateEnergyMeter() {
    const bar = document.getElementById('energy-bar');
    const pct = document.getElementById('energy-percentage');

    if (bar) bar.style.height = gameState.energy + '%';
    if (pct) pct.innerText = gameState.energy + '%';

    let status = energyStatuses[0];
    for (let i = 0; i < energyStatuses.length; i++) {
      if (gameState.energy >= energyStatuses[i].range[0] && gameState.energy <= energyStatuses[i].range[1]) {
        status = energyStatuses[i];
        break;
      }
    }

    const statusEl = document.getElementById('energy-status');
    if (statusEl) {
      const iconEl = statusEl.querySelector('.status-icon');
      const textEl = statusEl.querySelector('.status-text');
      if (iconEl) iconEl.innerText = status.icon;
      if (textEl) textEl.innerText = status.name;
    }
  }

  function updateTimeWeather() {
    const timeIcon = document.getElementById('time-icon');
    const timeText = document.getElementById('time-text');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherText = document.getElementById('weather-text');

    if (timeIcon) timeIcon.innerText = timeIcons[gameState.timeIndex];
    if (timeText) timeText.innerText = timeNames[gameState.timeIndex];
    if (weatherIcon) weatherIcon.innerText = weatherIcons[gameState.weatherIndex];
    if (weatherText) weatherText.innerText = weatherNames[gameState.weatherIndex];
  }

  function updateBackground() {
    const bg = document.getElementById('background-window');
    if (!bg) return;
    bg.className = 'background-window ' + timeClasses[gameState.timeIndex];
  }

  function checkWinner() {
    const winningScore = gameState.gameMode === 'chaos' ? 30 : 20;

    for (let i = 0; i < gameState.players.length; i++) {
      const player = gameState.players[i];
      if ((gameState.scores[player.id] ?? 0) >= winningScore) return player;
    }
    return null;
  }

  function showVictory(winner) {
    const winnerName = document.getElementById('winner-name');
    if (winnerName) winnerName.innerText = `${winner.name} wins!`;

    const scoresContainer = document.getElementById('final-scores');
    if (scoresContainer) {
      scoresContainer.innerHTML = '';
      gameState.players.forEach((player) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'final-score-item handwritten';
        scoreItem.innerText = `${player.name}: ${gameState.scores[player.id] ?? 0}`;
        scoresContainer.appendChild(scoreItem);
      });
    }

    showPage('victory');
  }

  function resetGame() {
    gameState.currentPage = 'cover';
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.scores = {};
    gameState.energy = 65;
    gameState.timeIndex = 2;
    gameState.weatherIndex = 1;
    gameState.currentCard = null;
    gameState.correctAnswer = null;
    gameState.displayedAnswers = [];
    gameState.selectedAnswer = null;
    gameState.timeLeft = 10;
    gameState.roundCount = 0;
    gameState.gameMode = 'family';
    gameState.specialEvent = null;

    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
    }
  }

  function getAvatarClass(playerId) {
    const avatars = ['tabby', 'ginger', 'tuxedo', 'calico'];
    return avatars[playerId - 1] || 'tabby';
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
