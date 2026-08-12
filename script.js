document.addEventListener('DOMContentLoaded', () => {

  let habits = JSON.parse(localStorage.getItem('habit_king_data') || '[]');

  const habitListEl = document.getElementById('habit-list');
  const addModal = document.getElementById('add-modal');
  const openModalBtn = document.getElementById('open-add-modal');
  const closeModalBtn = document.getElementById('close-add-modal');
  const saveHabitBtn = document.getElementById('save-habit-btn');

  const alarmModal = document.getElementById('alarm-modal');
  const alarmText = document.getElementById('alarm-text');
  const dismissAlarmBtn = document.getElementById('dismiss-alarm-btn');

  let audioCtx = null;
  let alarmInterval = null;

  // Tarayıcı Bildirim İzni İsteme
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Modal Aç/Kapat
  openModalBtn.onclick = () => addModal.classList.remove('hidden');
  closeModalBtn.onclick = () => addModal.classList.add('hidden');

  // Web Audio API ile Sentetik Keskin Alarm Sesi
  function playAlarmSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Keskin Alarm Tonu
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio hatası:', e);
    }
  }

  function startContinuousAlarm() {
    playAlarmSound();
    if (!alarmInterval) {
      alarmInterval = setInterval(playAlarmSound, 800);
    }
  }

  function stopContinuousAlarm() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  // Dakikalık Saat & Alarm Kontrolü
  function checkHabitAlarms() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    habits.forEach(habit => {
      // Hedef saati geldiyse, tamamlanmadıysa ve o dakika henüz tetiklenmediyse
      if (habit.time === currentTimeStr && !habit.completedToday && habit.lastNotified !== currentTimeStr) {
        habit.lastNotified = currentTimeStr;
        localStorage.setItem('habit_king_data', JSON.stringify(habits));

        // Sesli Alarm & Kırmızı Pop-Up Tetikle
        alarmText.innerText = `"${habit.title.toUpperCase()}" vakti geldi! Hedef: ${habit.target}. Bahaneleri bırak, hemen görevi tamamla!`;
        alarmModal.classList.remove('hidden');
        startContinuousAlarm();

        // Tarayıcı/Sistem Bildirimi
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🚨 DİSİPLİN ALARMI!", {
            body: `${habit.title} vakti geldi! (${habit.target})`,
            icon: "📚"
          });
        }
      }
    });
  }

  // Her 5 saniyede bir saati kontrol et
  setInterval(checkHabitAlarms, 5000);

  dismissAlarmBtn.onclick = () => {
    stopContinuousAlarm();
    alarmModal.classList.add('hidden');
  };

  // Ekranı Çizme (Render)
  function renderHabits() {
    habitListEl.innerHTML = '';
    let completedCount = 0;
    let maxStreak = 0;

    if (habits.length === 0) {
      habitListEl.innerHTML = `<div class="glass-card" style="text-align:center; color:#9ca3af;">Henüz bir disiplin hedefi eklemedin. "+ Yeni Alışkanlık" butonuna tıkla!</div>`;
    }

    habits.forEach((habit, index) => {
      if (habit.completedToday) completedCount++;
      if (habit.streak > maxStreak) maxStreak = habit.streak;

      const card = document.createElement('div');
      card.className = `glass-card habit-card ${habit.completedToday ? 'completed' : ''}`;
      
      card.innerHTML = `
        <div class="habit-left">
          <div class="habit-icon">${habit.icon}</div>
          <div>
            <div class="habit-title">${habit.title}</div>
            <div class="habit-meta">🎯 ${habit.target} ${habit.time ? '• ⏰ ' + habit.time : ''} • 🔥 ${habit.streak} Gün</div>
          </div>
        </div>
        <div class="habit-right">
          <button class="check-btn" onclick="toggleHabit(${index})">${habit.completedToday ? '✓' : ''}</button>
          <button class="delete-btn" onclick="deleteHabit(${index})">✕</button>
        </div>
      `;
      habitListEl.appendChild(card);
    });

    const total = habits.length;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    document.getElementById('daily-progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-percent').innerText = `%${percent}`;
    document.getElementById('total-streak').innerText = maxStreak;

    localStorage.setItem('habit_king_data', JSON.stringify(habits));
  }

  // Görev Tamamla/Geri Al
  window.toggleHabit = (index) => {
    const habit = habits[index];
    habit.completedToday = !habit.completedToday;
    if (habit.completedToday) {
      habit.streak += 1;
      stopContinuousAlarm();
    } else {
      habit.streak = Math.max(0, habit.streak - 1);
    }
    renderHabits();
  };

  // Görev Sil
  window.deleteHabit = (index) => {
    if (confirm('Bu hedefi silmek istediğinden emin misin?')) {
      habits.splice(index, 1);
      renderHabits();
    }
  };

  // Yeni Hedef Kaydet
  saveHabitBtn.onclick = () => {
    const title = document.getElementById('habit-title-input').value.trim();
    const icon = document.getElementById('habit-icon-select').value;
    const target = document.getElementById('habit-target-input').value.trim() || 'Günlük';
    const time = document.getElementById('habit-time-input').value;

    if (!title) {
      alert('Lütfen bir alışkanlık adı girin!');
      return;
    }

    const newHabit = {
      title,
      icon,
      target,
      time,
      streak: 0,
      completedToday: false,
      lastNotified: ''
    };

    habits.push(newHabit);
    document.getElementById('habit-title-input').value = '';
    document.getElementById('habit-target-input').value = '';
    addModal.classList.add('hidden');
    renderHabits();
  };

  renderHabits();
});
