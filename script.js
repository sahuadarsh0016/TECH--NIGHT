(() => {
  // Subtle particle background
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    });
  }

  function animateBg() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animateBg);
  }
  animateBg();

  // Quiz State
  let selectedTrack = 'mixed';
  let playerName = 'Knight';
  let pool = [];
  let idx = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let correctCount = 0;
  let logs = [];
  let timer = null;
  let timeLeft = 15;

  const lobbyScreen = document.getElementById('screen-lobby');
  const quizScreen = document.getElementById('screen-quiz');
  const resultScreen = document.getElementById('screen-result');
  const statusEl = document.getElementById('arena-status');

  document.querySelectorAll('.track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTrack = btn.dataset.track;
    });
  });

  function buildPool(track) {
    let raw = track === 'mixed'
      ? [...QUESTION_BANK.web, ...QUESTION_BANK.cs]
      : [...QUESTION_BANK[track]];
    return raw.sort(() => Math.random() - 0.5).slice(0, 10);
  }

  document.getElementById('start-btn').addEventListener('click', () => {
    const input = document.getElementById('player-name').value.trim();
    playerName = input || 'CyberKnight';
    pool = buildPool(selectedTrack);
    idx = 0;
    score = 0;
    streak = 0;
    bestStreak = 0;
    correctCount = 0;
    logs = [];

    lobbyScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    statusEl.textContent = 'LIVE BATTLE';
    loadQuestion();
  });

  function loadQuestion() {
    if (idx >= pool.length) return finishQuiz();
    const item = pool[idx];
    document.getElementById('q-num').textContent = idx + 1;
    document.getElementById('streak-val').textContent = streak;
    document.getElementById('score-val').textContent = score;
    document.getElementById('question-text').textContent = item.q;

    const optsBox = document.getElementById('options-list');
    optsBox.innerHTML = '';
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'opt-btn';
      b.textContent = opt;
      b.onclick = () => handleAnswer(i);
      optsBox.appendChild(b);
    });

    startTimer();
  }

  function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    const bar = document.getElementById('timer-bar');
    bar.style.width = '100%';

    timer = setInterval(() => {
      timeLeft -= 0.1;
      bar.style.width = Math.max(0, (timeLeft / 15) * 100) + '%';
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleAnswer(-1);
      }
    }, 100);
  }

  function handleAnswer(choice) {
    clearInterval(timer);
    const item = pool[idx];
    const buttons = document.querySelectorAll('.opt-btn');
    buttons.forEach(b => b.disabled = true);

    const isRight = choice === item.a;
    if (buttons[item.a]) buttons[item.a].classList.add('correct');
    if (!isRight && choice >= 0 && buttons[choice]) {
      buttons[choice].classList.add('wrong');
    }

    if (isRight) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      correctCount++;
      const mult = streak >= 3 ? 2 : 1;
      score += (100 + Math.round(timeLeft * 5)) * mult;
    } else {
      streak = 0;
    }

    logs.push({
      q: item.q,
      ok: isRight,
      ans: item.opts[item.a]
    });

    setTimeout(() => {
      idx++;
      loadQuestion();
    }, 850);
  }

  function finishQuiz() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    statusEl.textContent = 'COMPLETED';

    const acc = Math.round((correctCount / pool.length) * 100);
    let rank = 'APPRENTICE KNIGHT';
    let emoji = '🛡️';
    if (acc >= 80) { rank = 'GRAND TECHKNIGHT'; emoji = '👑'; }
    else if (acc >= 50) { rank = 'CYBER PALADIN'; emoji = '⚔️'; }

    document.getElementById('rank-emoji').textContent = emoji;
    document.getElementById('rank-title').textContent = rank;
    document.getElementById('result-greeting').textContent = `Victory Report: ${playerName}`;
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-acc').textContent = acc + '%';
    document.getElementById('final-streak').textContent = bestStreak + 'x';

    const rev = document.getElementById('review-list');
    rev.innerHTML = logs.map(l => `
      <div class="rev-item ${l.ok ? '' : 'bad'}">
        <strong>${l.ok ? '✅' : '❌'} ${l.q}</strong><br/>
        <span>Answer: ${l.ans}</span>
      </div>
    `).join('');
  }

  document.getElementById('retry-btn').addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');
    statusEl.textContent = 'STANDBY';
  });

  document.getElementById('share-btn').addEventListener('click', () => {
    const txt = `⚔️ TechKnight — Quiz Arena | Knight: ${playerName} | Score: ${score} | Rank: ${document.getElementById('rank-title').textContent}`;
    navigator.clipboard.writeText(txt);
    const btn = document.getElementById('share-btn');
    btn.textContent = 'Copied! ✅';
    setTimeout(() => btn.textContent = 'Copy Rank Card 📋', 2000);
  });
})();
