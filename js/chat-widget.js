// chat-widget.js - плавающий чат-помощник с ИИ

(function() {
  // Стили для виджета
  const style = document.createElement('style');
  style.innerHTML = `
    .chat-widget-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      cursor: pointer;
      font-size: 24px;
      z-index: 1001;
      transition: transform 0.2s;
    }
    .chat-widget-button:hover {
      transform: scale(1.1);
    }
    .chat-widget-panel {
      position: fixed;
      bottom: 100px;
      right: 30px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      z-index: 1002;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }
    .chat-widget-panel.open {
      display: flex;
    }
    .chat-header {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-header h3 {
      margin: 0;
      font-size: 1rem;
    }
    .chat-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    }
    .chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: #f9fafb;
    }
    .message {
      margin-bottom: 12px;
      max-width: 80%;
    }
    .user-message {
      align-self: flex-end;
      background: #10b981;
      color: white;
      border-radius: 18px 18px 4px 18px;
      padding: 8px 14px;
      margin-left: auto;
    }
    .bot-message {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 18px 18px 18px 4px;
      padding: 8px 14px;
      margin-right: auto;
    }
    .chat-input-area {
      padding: 15px;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
    .model-select {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      font-size: 0.8rem;
    }
    .input-row {
      display: flex;
      gap: 8px;
    }
    .chat-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      outline: none;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .chat-input:focus {
      border-color: #10b981;
    }
    .send-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #10b981;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .send-button:hover {
      background: #059669;
    }

    .mic-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ffffff;
      color: #111827;
      border: 1px solid #d1d5db;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s, background 0.2s, border-color 0.2s;
    }
    .mic-button:hover { transform: scale(1.05); }
    .mic-button.recording {
      background: #fee2e2;
      border-color: #ef4444;
      color: #ef4444;
    }
    .mic-hint {
      margin-top: 8px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.25;
    }
    .status-badge {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 5px;
    }
    .status-online { background: #10b981; }
    .status-offline { background: #ef4444; }
  `;
  document.head.appendChild(style);

  // HTML-структура
  const button = document.createElement('button');
  button.className = 'chat-widget-button';
  button.innerHTML = '<i class="fas fa-robot"></i>';
  document.body.appendChild(button);

  const panel = document.createElement('div');
  panel.className = 'chat-widget-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div>
        <span class="status-badge" id="chat-status"></span>
        <h3 style="display: inline;">ИИ-помощник</h3>
      </div>
      <button class="chat-close">&times;</button>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-input-area">
      <select id="chat-model" class="model-select">
        <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
        <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
      </select>
      <div class="input-row">
        <input type="text" id="chat-input" class="chat-input" placeholder="Напишите сообщение...">
        <button id="chat-mic" class="mic-button" title="Диктовка (в текст)"><i class="fas fa-microphone"></i></button>
        <button id="chat-send" class="send-button">➤</button>
      </div>
      <div class="mic-hint" id="mic-hint">🎙️ Нажми микрофон — речь попадёт в поле ввода. Сообщение отправится только после кнопки ➤.</div>
    </div>
  `;
  document.body.appendChild(panel);

  // Элементы
  const messagesDiv = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const micBtn = document.getElementById('chat-mic');
  const modelSelect = document.getElementById('chat-model');
  const statusBadge = document.getElementById('chat-status');
  const closeBtn = panel.querySelector('.chat-close');
  const micHint = document.getElementById('mic-hint');

  // Состояние
  let isOpen = false;
  let isOnline = false;

  // --- Голос в текст (Web Speech API) ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;
  let baseTextAtStart = '';

  function setRecordingUi(on) {
    isRecording = on;
    if (on) micBtn.classList.add('recording');
    else micBtn.classList.remove('recording');
    micBtn.title = on ? 'Остановить диктовку' : 'Диктовка (в текст)';
  }

  function initRecognitionIfNeeded() {
    if (!SpeechRecognition) {
      micHint.textContent = '🎙️ Диктовка недоступна в этом браузере. Попробуй Chrome/Edge на ПК.';
      micBtn.disabled = true;
      micBtn.style.opacity = '0.5';
      return false;
    }
    if (recognition) return true;

    recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      // Не отправляем автоматически — только заполняем поле
      const combined = (baseTextAtStart + ' ' + finalText + ' ' + interimText).replace(/\s+/g, ' ').trim();
      input.value = combined;
    };

    recognition.onerror = () => {
      setRecordingUi(false);
      addMessage('🎙️ Не удалось включить диктовку. Проверь разрешение на микрофон в браузере.', false);
    };

    recognition.onend = () => {
      // onend может случиться сам — аккуратно обновляем UI
      if (isRecording) setRecordingUi(false);
    };

    return true;
  }

  // Проверка доступности сервера
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        isOnline = true;
        statusBadge.className = 'status-badge status-online';
      } else {
        throw new Error();
      }
    } catch {
      isOnline = false;
      statusBadge.className = 'status-badge status-offline';
    }
  }
  checkHealth();
  setInterval(checkHealth, 30000); // каждые 30 сек

  // Добавление сообщения
  function addMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    msgDiv.textContent = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Отправка сообщения
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || !isOnline) return;

    addMessage(text, true);
    input.value = '';

    const model = modelSelect.value;
    addMessage('⏳ Думаю...', false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model })
      });
      const data = await res.json();
      // Удаляем "Думаю..."
      messagesDiv.lastChild.remove();
      addMessage((data && data.text) ? data.text : 'Не получилось получить ответ. Попробуй переформулировать вопрос.', false);
    } catch (err) {
      messagesDiv.lastChild.remove();
      addMessage('Ошибка соединения', false);
    }
  }

  // Обработчики
  button.addEventListener('click', () => {
    panel.classList.toggle('open');
    isOpen = panel.classList.contains('open');
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
  });

  // По требованию: отправка только по кнопке ➤ (Enter не отправляет).
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Если хочется быстрый режим — можно включить Ctrl+Enter:
      // if (e.ctrlKey || e.metaKey) sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Микрофон: старт/стоп. В текст — без авто-отправки.
  micBtn.addEventListener('click', () => {
    if (!initRecognitionIfNeeded()) return;

    if (!isRecording) {
      baseTextAtStart = input.value.trim();
      setRecordingUi(true);
      try {
        recognition.start();
      } catch {
        // Иногда start кидает, если уже стартанул
      }
    } else {
      setRecordingUi(false);
      try {
        recognition.stop();
      } catch {}
    }
  });

  // Приветственное сообщение при первом открытии
  let firstOpen = true;
  panel.addEventListener('transitionend', () => {
    if (panel.classList.contains('open') && firstOpen) {
      addMessage('Здравствуйте! Я помощник по городской инфраструктуре. Спрашивайте о строительстве, экологии, транспорте.', false);
      firstOpen = false;
    }
  });
})();