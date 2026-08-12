document.addEventListener('DOMContentLoaded', () => {

  let habits = JSON.parse(localStorage.getItem('habit_king_data') || '[]');

  const habitListEl = document.getElementById('habit-list');
  const addModal = document.getElementById('add-modal');
  const openModalBtn = document.getElementById('open-add-modal');
  const closeModalBtn = document.getElementById('close-add-modal');
  const saveHabitBtn = document.getElementById('save-habit-btn');

  // Modal Aç/Kapat
  openModalBtn.onclick = () => addModal.classList.remove('hidden');
  closeModalBtn.onclick = () => addModal.classList.add('hidden');

  // Güncelleme & Render İşlemi
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

    // İlerleme Hesabı
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
      completedToday: false
    };

    habits.push(newHabit);
    document.getElementById('habit-title-input').value = '';
    document.getElementById('habit-target-input').value = '';
    addModal.classList.add('hidden');
    renderHabits();
  };

  // Varsayılan İlkleme
  renderHabits();
});
