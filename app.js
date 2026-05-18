const STORAGE_KEY = "warmEnglishMvpState";

const todayKey = () => new Date().toISOString().slice(0, 10);

const words = [
  { id: "hello", word: "hello", sound: "/həˈləʊ/", meaning: "你好" },
  { id: "name", word: "name", sound: "/neɪm/", meaning: "名字" },
  { id: "water", word: "water", sound: "/ˈwɔːtər/", meaning: "水" },
  { id: "food", word: "food", sound: "/fuːd/", meaning: "食物" },
  { id: "home", word: "home", sound: "/hoʊm/", meaning: "家" },
  { id: "friend", word: "friend", sound: "/frend/", meaning: "朋友" },
  { id: "work", word: "work", sound: "/wɜːrk/", meaning: "工作；学习" },
  { id: "happy", word: "happy", sound: "/ˈhæpi/", meaning: "开心的" },
  { id: "small", word: "small", sound: "/smɔːl/", meaning: "小的" },
  { id: "today", word: "today", sound: "/təˈdeɪ/", meaning: "今天" }
];

const grammarLessons = [
  {
    title: "be 动词：am / is / are",
    body: "be 动词像中文里的“是 / 在 / 处于某种状态”。先记住：I 用 am，单数用 is，复数和 you 用 are。",
    examples: ["I am happy. 我很开心。", "She is my friend. 她是我的朋友。", "You are here. 你在这里。"]
  },
  {
    title: "一般现在时",
    body: "表达经常发生、习惯、事实。主语是 he / she / it 时，动词通常加 s。",
    examples: ["I like water. 我喜欢水。", "He likes tea. 他喜欢茶。", "We study English every day. 我们每天学英语。"]
  },
  {
    title: "简单疑问句",
    body: "想问“是不是”，把 am / is / are 放到句子最前面。回答可以用 Yes 或 No。",
    examples: ["Are you ready? 你准备好了吗？", "Is it small? 它小吗？", "Yes, I am. 是的。"]
  }
];

const speakingSentences = [
  { en: "Nice to meet you.", zh: "很高兴认识你。第一次见面很常用。" },
  { en: "Can you help me?", zh: "你能帮我吗？遇到困难时可以说。" },
  { en: "I don't understand.", zh: "我不明白。听不懂时直接说，很实用。" },
  { en: "Please speak slowly.", zh: "请说慢一点。适合英语基础弱时使用。" },
  { en: "How much is it?", zh: "这个多少钱？购物时常用。" },
  { en: "I am learning English.", zh: "我正在学英语。告诉别人你还在学习。" }
];

const defaultState = () => ({
  date: todayKey(),
  wordStatus: {},
  grammarDone: false,
  speakingDone: false,
  checkedInDates: [],
  streak: 0
});

function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (!saved || saved.date !== todayKey()) {
    return { ...defaultState(), checkedInDates: saved?.checkedInDates || [], streak: saved?.streak || 0 };
  }
  return { ...defaultState(), ...saved };
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getWordCounts() {
  return words.reduce(
    (counts, item) => {
      if (state.wordStatus[item.id] === "known") counts.known += 1;
      if (state.wordStatus[item.id] === "review") counts.review += 1;
      return counts;
    },
    { known: 0, review: 0 }
  );
}

function isWordsDone() {
  return words.every((item) => state.wordStatus[item.id]);
}

function isCheckedInToday() {
  return state.checkedInDates.includes(todayKey());
}

function calculateProgress() {
  const tasks = [isWordsDone(), state.grammarDone, state.speakingDone, isCheckedInToday()];
  return Math.round((tasks.filter(Boolean).length / tasks.length) * 100);
}

function renderDashboard() {
  const progress = calculateProgress();
  const counts = getWordCounts();
  const progressRing = document.querySelector(".progress-ring");

  document.getElementById("progressNumber").textContent = `${progress}%`;
  progressRing.style.setProperty("--progress", `${progress}%`);
  document.getElementById("streakDays").textContent = state.streak;
  document.getElementById("knownWords").textContent = counts.known;
  document.getElementById("reviewWords").textContent = counts.review;

  const tasks = [
    { title: "单词", text: "判断 10 个基础单词", done: isWordsDone() },
    { title: "语法", text: "读完 3 个语法点", done: state.grammarDone },
    { title: "口语", text: "跟读 6 个生活句子", done: state.speakingDone },
    { title: "打卡", text: "记录今天完成", done: isCheckedInToday() }
  ];

  document.getElementById("taskList").innerHTML = tasks
    .map(
      (task) => `
        <article class="task-item ${task.done ? "done" : ""}">
          <strong>${task.done ? "✅" : "○"} ${task.title}</strong>
          <span>${task.text}</span>
        </article>
      `
    )
    .join("");

  const grammarDoneButton = document.getElementById("grammarDoneBtn");
  grammarDoneButton.classList.toggle("done", state.grammarDone);
  grammarDoneButton.textContent = state.grammarDone ? "语法已完成 ✅" : "我已读完语法";

  const checkinButton = document.getElementById("checkinBtn");
  const checkinHint = document.getElementById("checkinHint");
  checkinButton.classList.toggle("completed", isCheckedInToday());
  checkinButton.textContent = isCheckedInToday() ? "今天已打卡 ✅" : "今日已完成";
  checkinHint.textContent = isCheckedInToday()
    ? "太棒了！今天的努力已经保存，明天继续保持。"
    : "完成学习后，点击下面按钮记录今天的努力。";
}

function renderWords() {
  document.getElementById("wordGrid").innerHTML = words
    .map((item) => {
      const status = state.wordStatus[item.id] || "";
      return `
        <article class="word-card ${status}">
          <h3>${item.word}</h3>
          <span class="sound">${item.sound}</span>
          <p>${item.meaning}</p>
          <div class="word-actions">
            <button type="button" data-word="${item.id}" data-status="known">认识</button>
            <button type="button" data-word="${item.id}" data-status="review">不认识</button>
            <button type="button" data-word="${item.id}" data-status="review">复习</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderGrammar() {
  document.getElementById("grammarList").innerHTML = grammarLessons
    .map(
      (lesson) => `
        <article class="grammar-item">
          <h3>${lesson.title}</h3>
          <p>${lesson.body}</p>
          <ul>${lesson.examples.map((example) => `<li>${example}</li>`).join("")}</ul>
        </article>
      `
    )
    .join("");
}

function renderSpeaking() {
  document.getElementById("speakingGrid").innerHTML = speakingSentences
    .map(
      (item, index) => `
        <article class="speaking-card">
          <p class="sentence">${item.en}</p>
          <button type="button" data-sentence="${index}">显示中文解释</button>
          <div class="translation">${item.zh}</div>
        </article>
      `
    )
    .join("");
}

function calculateStreak(dates) {
  const sortedDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const cursor = new Date(`${todayKey()}T00:00:00`);

  for (const date of sortedDates) {
    const expected = cursor.toISOString().slice(0, 10);
    if (date === expected) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  return streak;
}

function bindEvents() {
  document.getElementById("wordGrid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-word]");
    if (!button) return;
    state.wordStatus[button.dataset.word] = button.dataset.status;
    saveState();
    renderWords();
    renderDashboard();
  });

  document.getElementById("grammarDoneBtn").addEventListener("click", () => {
    state.grammarDone = true;
    saveState();
    renderDashboard();
  });

  document.getElementById("speakingGrid").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sentence]");
    if (!button) return;
    const card = button.closest(".speaking-card");
    card.classList.toggle("open");
    button.textContent = card.classList.contains("open") ? "隐藏中文解释" : "显示中文解释";
    state.speakingDone = true;
    saveState();
    renderDashboard();
  });

  document.getElementById("checkinBtn").addEventListener("click", () => {
    const today = todayKey();
    if (!state.checkedInDates.includes(today)) {
      state.checkedInDates.push(today);
    }
    state.streak = calculateStreak(state.checkedInDates);
    saveState();
    renderDashboard();
  });

  document.getElementById("resetTodayBtn").addEventListener("click", () => {
    const { checkedInDates, streak } = state;
    state = { ...defaultState(), checkedInDates, streak };
    saveState();
    renderWords();
    renderDashboard();
  });
}

function init() {
  renderWords();
  renderGrammar();
  renderSpeaking();
  renderDashboard();
  bindEvents();
}

init();
