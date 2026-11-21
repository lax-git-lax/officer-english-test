(function () {
  'use strict';

  /* ============================================================
     NORMALISE ALL DATA SOURCES INTO ONE SHAPE
     data.js / data2.js use {c,t,q,o,a,e}; READINGS use {a,e};
     TRANSLATIONS use {a,e}; OFFICER_HISTORICAL uses {t,q,a,e}.
     ============================================================ */
  function normalize(raw, id) {
    if (!raw) return null;
    var opts = raw.opts || raw.o || null;
    if (opts && !Array.isArray(opts)) opts = null;
    var ans = raw.ans || raw.a || '';
    var exp = raw.exp || raw.e || '';
    var topic = raw.topic || raw.t || '';
    if (!exp) {
      exp = 'This item tests ' + (topic || 'English usage') +
        '. The correct answer is "' + ans +
        '". Revise the underlying rule and usage pattern for officer-level English.';
    }
    return {
      id: raw.id || id,
      cat: raw.cat || raw.c || 'grammar',
      topic: topic,
      q: raw.q || '',
      opts: opts,
      ans: ans,
      exp: exp,
      type: raw.type || (opts ? 'mcq' : 'subjective'),
      passage: raw.passage || ''
    };
  }

  var ALL = [];
  var seq = 0;

  if (typeof QUESTIONS !== 'undefined') {
    QUESTIONS.forEach(function (q) { var n = normalize(q, 'q' + (++seq)); if (n && n.q) ALL.push(n); });
  }
  if (typeof READINGS !== 'undefined') {
    READINGS.forEach(function (r, ri) {
      (r.questions || []).forEach(function (q, qi) {
        var n = normalize(q, 'rc' + (ri + 1) + '-' + (qi + 1));
        n.cat = q.cat || r.cat || 'reading-comprehension';
        n.passage = r.passage || '';
        n.type = q.type || 'subjective';
        if (n.q) ALL.push(n);
      });
    });
  }
  if (typeof TRANSLATIONS !== 'undefined') {
    TRANSLATIONS.forEach(function (q, i) {
      var n = normalize(q, 'tr' + (i + 1));
      n.cat = 'translation';
      n.type = 'translation';
      if (n.q) ALL.push(n);
    });
  }
  if (typeof OFFICER_HISTORICAL !== 'undefined') {
    OFFICER_HISTORICAL.forEach(function (q, i) {
      var n = normalize(q, 'hist' + (i + 1));
      n.cat = 'officer-level-historical';
      n.type = q.type || (n.opts ? 'mcq' : 'subjective');
      if (n.q) ALL.push(n);
    });
  }

  // Make every ID unique even if a source repeated one.
  var seen = {};
  ALL.forEach(function (q, i) {
    while (seen[q.id]) q.id = q.id + '_' + i;
    seen[q.id] = true;
  });

  // Expose for debugging / verification in the browser console.
  window.QUESTION_BANK = ALL;

  /* ============================================================
     CATEGORY META
     ============================================================ */
  var CAT_META = [
    { id: 'grammar', name: 'Grammar', desc: 'Articles, prepositions, tenses, voice, speech, conditionals and agreement.' },
    { id: 'parts-of-speech', name: 'Parts of Speech', desc: 'Nouns, pronouns, adjectives, verbs, adverbs, conjunctions and more.' },
    { id: 'vocabulary', name: 'Vocabulary', desc: 'Synonyms, antonyms, idioms, spelling, homophones and word usage.' },
    { id: 'sentence-completion', name: 'Sentence Completion', desc: 'Fill in the blanks and complete the meaning of sentences.' },
    { id: 'error-detection', name: 'Error Detection', desc: 'Find and correct common English mistakes.' },
    { id: 'reading-comprehension', name: 'Reading Comprehension', desc: 'Passages with questions, answers and explanations.' },
    { id: 'translation', name: 'Translation', desc: 'English ⇄ Nepali translation with model answers.' },
    { id: 'essay', name: 'Essay & Writing', desc: 'Essay writing, personal letters and note-making.' },
    { id: 'current-affairs', name: 'Current Affairs', desc: 'English general knowledge for officer-level exams.' },
    { id: 'note-making', name: 'Letters & Notes', desc: 'Formal letters, notes and Note Verbale writing.' },
    { id: 'officer-level-historical', name: 'Historical Questions', desc: 'Past PSC / Army / APF officer-level questions with answers.' }
  ];

  var SUBJECTIVE_TYPES = { essay: 1, translation: 1, note: 1, 'note-making': 1, subjective: 1 };

  /* ============================================================
     STATE
     ============================================================ */
  var state = { cat: 'all', pos: 0, search: '' };

  function filtered() {
    var s = state.search.toLowerCase();
    return ALL.filter(function (q) {
      if (state.cat !== 'all' && q.cat !== state.cat) return false;
      if (!s) return true;
      var hay = [q.topic, q.q, q.ans, q.exp, q.passage].join(' ').toLowerCase();
      return hay.indexOf(s) !== -1;
    });
  }

  function catName(id) {
    if (id === 'all') return 'All Questions';
    var m = CAT_META.filter(function (c) { return c.id === id; })[0];
    return m ? m.name : id;
  }

  function countCat(id) {
    return id === 'all' ? ALL.length : ALL.filter(function (q) { return q.cat === id; }).length;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function renderTabs() {
    var html = '<button type="button" class="' + (state.cat === 'all' ? 'active' : '') +
      '" data-cat="all">All Questions <span class="badge">' + ALL.length + '</span></button>';
    html += CAT_META.map(function (c) {
      return '<button type="button" class="' + (state.cat === c.id ? 'active' : '') +
        '" data-cat="' + c.id + '" title="' + escapeHtml(c.desc) + '">' +
        escapeHtml(c.name) + ' <span class="badge">' + countCat(c.id) + '</span></button>';
    }).join('');
    var nav = document.getElementById('catTabs');
    nav.innerHTML = html;
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        state.cat = b.getAttribute('data-cat');
        state.pos = 0;
        renderAll();
      });
    });
  }

  function renderCard() {
    var list = filtered();
    var card = document.getElementById('questionCard');

    if (!list.length) {
      card.innerHTML = '<div class="empty">No questions match this category or search. Try another filter.</div>';
      return;
    }
    if (state.pos >= list.length) state.pos = list.length - 1;
    if (state.pos < 0) state.pos = 0;
    var q = list[state.pos];
    var isSubjective = !!SUBJECTIVE_TYPES[q.type] && !(q.opts && q.opts.length);
    var html = '<article class="question">';

    html += '<div class="q-meta"><span class="badge">' + escapeHtml(catName(q.cat)) +
      '</span><span class="badge soft">' + escapeHtml(q.topic || 'General') + '</span>' +
      '<span class="badge soft">#' + escapeHtml(q.id) + '</span></div>';

    if (q.cat === 'reading-comprehension' && q.passage) {
      html += '<div class="passage"><h3>Passage</h3><p>' + escapeHtml(q.passage) + '</p></div>';
    }

    html += '<h2 class="qtext">' + (state.pos + 1) + '. ' + escapeHtml(q.q) + '</h2>';

    if (isSubjective) {
      html += '<button type="button" class="btn reveal" id="revealBtn">Show Answer &amp; Explanation</button>';
      html += '<div class="answer-box hidden" id="answerBox">' +
        '<h4>Model Answer</h4><div class="answer-text">' + escapeHtml(q.ans) + '</div>' +
        (q.exp ? '<p class="explanation"><strong>Explanation:</strong> ' + escapeHtml(q.exp) + '</p>' : '') +
        '</div>';
    } else if (q.opts && q.opts.length) {
      html += '<div class="options" role="group" aria-label="Answer options">';
      q.opts.forEach(function (o, i) {
        var letter = String.fromCharCode(65 + i);
        var text = (o && typeof o === 'object' && o.text) ? o.text : o;
        html += '<button type="button" class="option" data-letter="' + letter + '">' +
          '<span class="opt-letter">' + letter + '</span><span>' + escapeHtml(text) + '</span></button>';
      });
      html += '</div>';
      html += '<div class="answer-box hidden" id="answerBox">' +
        '<h4>Correct answer: <span class="answer-text-inline">' + escapeHtml(q.ans) + '</span></h4>' +
        (q.exp ? '<p class="explanation"><strong>Explanation:</strong> ' + escapeHtml(q.exp) + '</p>' : '') +
        '</div>';
      html += '<p class="hint">Click an option to check your answer.</p>';
    } else {
      html += '<div class="answer-box"><h4>Answer</h4><div class="answer-text">' +
        escapeHtml(q.ans) + '</div>' +
        (q.exp ? '<p class="explanation"><strong>Explanation:</strong> ' + escapeHtml(q.exp) + '</p>' : '') +
        '</div>';
    }

    html += '</article>';
    card.innerHTML = html;
    attachCardListeners(q, isSubjective);
  }

  function attachCardListeners(q, isSubjective) {
    var reveal = document.getElementById('revealBtn');
    if (reveal) {
      reveal.addEventListener('click', function () {
        var box = document.getElementById('answerBox');
        if (box) box.classList.remove('hidden');
        reveal.textContent = 'Answer shown';
        reveal.disabled = true;
      });
    }
    if (!isSubjective) {
      Array.prototype.forEach.call(document.querySelectorAll('.options .option'), function (btn) {
        btn.addEventListener('click', function () {
          var letter = btn.getAttribute('data-letter');
          var opts = q.opts || [];
          var chosenText = (opts[letter.charCodeAt(0) - 65] && typeof opts[letter.charCodeAt(0) - 65] === 'object')
            ? opts[letter.charCodeAt(0) - 65].text : opts[letter.charCodeAt(0) - 65];
          var correct = (q.ans === letter || q.ans === chosenText ||
            (typeof q.ans === 'string' && chosenText && chosenText.toLowerCase() === q.ans.toLowerCase()));

          Array.prototype.forEach.call(document.querySelectorAll('.options .option'), function (b) {
            var l = b.getAttribute('data-letter');
            var t = (opts[l.charCodeAt(0) - 65] && typeof opts[l.charCodeAt(0) - 65] === 'object')
              ? opts[l.charCodeAt(0) - 65].text : opts[l.charCodeAt(0) - 65];
            var isCorrect = (q.ans === l || q.ans === t ||
              (typeof q.ans === 'string' && t && t.toLowerCase() === q.ans.toLowerCase()));
            b.classList.add('answered');
            if (isCorrect) b.classList.add('correct');
            else b.classList.add('wrong');
          });
          btn.classList.toggle('correct', correct);
          btn.classList.toggle('wrong', !correct);
          var box = document.getElementById('answerBox');
          if (box) box.classList.remove('hidden');
          var hint = document.querySelector('.hint');
          if (hint) hint.textContent = correct ? '✓ Correct! Well done.' : '✗ Not quite — the correct answer is highlighted.';
        });
      });
    }
  }

  function renderNav() {
    var list = filtered();
    document.getElementById('prevBtn').disabled = state.pos <= 0;
    document.getElementById('nextBtn').disabled = state.pos >= list.length - 1;
    document.getElementById('posLabel').textContent = list.length
      ? (state.pos + 1) + ' / ' + list.length : '0 / 0';
  }

  function renderStats() {
    var list = filtered();
    var cat = CAT_META.filter(function (c) { return c.id === state.cat; })[0];
    var desc = state.cat === 'all' ? 'Browse every question in the bank.' : (cat ? cat.desc : '');
    document.getElementById('statsLine').innerHTML =
      '<strong>' + list.length.toLocaleString() + '</strong> question' + (list.length === 1 ? '' : 's') +
      ' in <strong>' + escapeHtml(catName(state.cat)) + '</strong>' +
      (state.search ? ' matching “' + escapeHtml(state.search) + '”' : '') +
      ' &nbsp;·&nbsp; ' + ALL.length.toLocaleString() + ' total in bank' +
      (desc ? '<br><span class="stats-desc">' + escapeHtml(desc) + '</span>' : '');
  }

  function renderAll() {
    renderTabs();
    renderCard();
    renderNav();
    renderStats();
  }

  /* ============================================================
     SECTION-WISE PRACTICE MODE
     Click an option → correct turns green, all others red,
     then the next question loads automatically.
     ============================================================ */
  var practice = {
    cat: 'all', queue: [], pos: 0, correct: 0, answered: 0,
    active: false, locked: false, timer: null
  };

  function isCorrectOption(q, opt, index) {
    var letter = String.fromCharCode(65 + index);
    var text = (opt && typeof opt === 'object' && opt.text) ? opt.text : opt;
    if (q.ans === letter || q.ans === text) return true;
    if (typeof q.ans === 'string' && typeof text === 'string' &&
        q.ans.toLowerCase() === text.toLowerCase()) return true;
    var clean = String(q.ans).replace(/^[A-E][.)\s]+/, '').trim().toLowerCase();
    return !!clean && clean === String(text).trim().toLowerCase();
  }

  function renderPracticeSections() {
    var nav = document.getElementById('practiceSections');
    var items = [{ id: 'all', name: 'All Sections', count: ALL.length }].concat(
      CAT_META.filter(function (c) { return countCat(c.id) > 0; }).map(function (c) {
        return { id: c.id, name: c.name, count: countCat(c.id) };
      })
    );
    nav.innerHTML = items.map(function (c) {
      return '<button type="button" class="practice-tab' + (practice.cat === c.id ? ' active' : '') +
        '" data-cat="' + c.id + '">' + escapeHtml(c.name) +
        ' <span class="badge">' + c.count.toLocaleString() + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(nav.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        practice.cat = b.getAttribute('data-cat');
        if (practice.active) startPractice(); else renderPracticeSections();
      });
    });
  }

  function startPractice() {
    if (practice.timer) clearTimeout(practice.timer);
    var pool = ALL.filter(function (q) {
      return practice.cat === 'all' || q.cat === practice.cat;
    });
    if (!pool.length) { alert('No questions in this section.'); return; }
    practice.queue = pool.slice();
    if (document.getElementById('shufflePractice').checked) {
      for (var i = practice.queue.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = practice.queue[i]; practice.queue[i] = practice.queue[j]; practice.queue[j] = t;
      }
    }
    practice.pos = 0;
    practice.correct = 0;
    practice.answered = 0;
    practice.active = true;
    practice.locked = false;
    document.getElementById('stopPracticeBtn').classList.remove('hidden');
    document.getElementById('startPracticeBtn').textContent = 'Restart Practice';
    renderPracticeSections();
    renderPracticeQuestion();
  }

  function renderPracticeQuestion() {
    var area = document.getElementById('practiceArea');
    if (!practice.active) return;
    if (practice.pos >= practice.queue.length) { renderPracticeSummary(); return; }
    practice.locked = false;
    var q = practice.queue[practice.pos];
    var opts = q.opts && q.opts.length >= 2 ? q.opts : null;

    var html = '<div class="practice-q">';
    html += '<div class="practice-progress"><span>Question <strong>' + (practice.pos + 1) +
      '</strong> of <strong>' + practice.queue.length + '</strong></span>' +
      '<span>Score: <strong>' + practice.correct + '</strong> / ' + practice.answered + '</span></div>';
    html += '<div class="practice-bar"><span style="width:' +
      ((practice.pos / practice.queue.length) * 100).toFixed(1) + '%"></span></div>';
    html += '<div class="q-meta"><span class="badge">' + escapeHtml(catName(q.cat)) +
      '</span><span class="badge soft">' + escapeHtml(q.topic || 'General') + '</span></div>';

    if (q.cat === 'reading-comprehension' && q.passage) {
      html += '<div class="passage"><h3>Passage</h3><p>' + escapeHtml(q.passage) + '</p></div>';
    }
    html += '<h3 class="qtext">' + escapeHtml(q.q) + '</h3>';

    if (opts) {
      html += '<div class="practice-options">';
      opts.forEach(function (o, i) {
        var letter = String.fromCharCode(65 + i);
        var text = (o && typeof o === 'object' && o.text) ? o.text : o;
        html += '<button type="button" class="practice-option" data-index="' + i + '">' +
          '<span class="opt-letter">' + letter + '</span><span>' + escapeHtml(text) + '</span></button>';
      });
      html += '</div>';
    } else {
      html += '<button type="button" class="btn" id="practiceRevealBtn">Show Answer &amp; Next Question</button>';
      html += '<div class="answer-box hidden" id="practiceAnswer">' +
        '<h4>Model Answer</h4><div class="answer-text">' + escapeHtml(q.ans) + '</div>' +
        '<p class="explanation"><strong>Explanation:</strong> ' + escapeHtml(q.exp) + '</p></div>';
    }
    html += '<div class="practice-feedback" id="practiceFeedback"></div>';
    html += '</div>';
    area.innerHTML = html;

    if (opts) {
      Array.prototype.forEach.call(area.querySelectorAll('.practice-option'), function (b) {
        b.addEventListener('click', function () {
          answerPractice(parseInt(b.getAttribute('data-index'), 10));
        });
      });
    } else {
      document.getElementById('practiceRevealBtn').addEventListener('click', function () {
        if (practice.locked) return;
        practice.locked = true;
        practice.answered++;
        var ansBox = document.getElementById('practiceAnswer');
        if (ansBox) ansBox.classList.remove('hidden');
        var fb = document.getElementById('practiceFeedback');
        if (fb) fb.innerHTML = '<span class="fb-info">Answer shown — next question loading…</span>';
        practice.timer = setTimeout(nextPracticeQuestion, 1800);
      });
    }
  }

  function answerPractice(index) {
    if (practice.locked) return;
    practice.locked = true;
    var q = practice.queue[practice.pos];
    var opts = q.opts || [];
    var correctIndex = -1;
    opts.forEach(function (o, i) { if (isCorrectOption(q, o, i)) correctIndex = i; });
    if (correctIndex < 0) correctIndex = opts.findIndex(function () { return true; });

    var isRight = index === correctIndex;
    if (isRight) practice.correct++;
    practice.answered++;

    Array.prototype.forEach.call(document.querySelectorAll('.practice-option'), function (b, i) {
      b.disabled = true;
      if (i === correctIndex) b.classList.add('correct');
      else b.classList.add('wrong');
    });

    var fb = document.getElementById('practiceFeedback');
    if (fb) {
      fb.innerHTML = (isRight
        ? '<span class="fb-right">✓ Correct! Well done.</span>'
        : '<span class="fb-wrong">✗ Correct answer is highlighted in green.</span>') +
        '<span class="fb-info"> Next question loading…</span>' +
        '<div class="fb-exp"><strong>Explanation:</strong> ' + escapeHtml(q.exp) + '</div>';
    }
    practice.timer = setTimeout(nextPracticeQuestion, 1100);
  }

  function nextPracticeQuestion() {
    practice.pos++;
    renderPracticeQuestion();
  }

  function renderPracticeSummary() {
    var area = document.getElementById('practiceArea');
    var pct = practice.answered ? Math.round((practice.correct / practice.answered) * 100) : 0;
    area.innerHTML = '<div class="practice-summary">' +
      '<h3>🎉 Practice session complete!</h3>' +
      '<p class="score-big">' + practice.correct + ' / ' + practice.answered + '</p>' +
      '<p>You scored <strong>' + pct + '%</strong> in <strong>' +
      escapeHtml(practice.cat === 'all' ? 'All Sections' : catName(practice.cat)) + '</strong>.</p>' +
      '<button type="button" class="btn" id="practiceAgainBtn">Practice Again</button> ' +
      '<button type="button" class="btn ghost" id="practiceChangeBtn">Change Section</button>' +
      '</div>';
    document.getElementById('practiceAgainBtn').addEventListener('click', startPractice);
    document.getElementById('practiceChangeBtn').addEventListener('click', stopPractice);
  }

  function stopPractice() {
    if (practice.timer) clearTimeout(practice.timer);
    practice.active = false;
    document.getElementById('practiceArea').innerHTML =
      '<p class="practice-idle">Select a section and press <strong>Start Practice</strong> to begin.</p>';
    document.getElementById('stopPracticeBtn').classList.add('hidden');
    document.getElementById('startPracticeBtn').textContent = 'Start Practice';
    renderPracticeSections();
  }

  function initPractice() {
    renderPracticeSections();
    document.getElementById('startPracticeBtn').addEventListener('click', startPractice);
    document.getElementById('stopPracticeBtn').addEventListener('click', stopPractice);
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function init() {
    document.getElementById('search').addEventListener('input', function (e) {
      state.search = e.target.value.trim();
      state.pos = 0;
      renderAll();
    });
    document.getElementById('randomBtn').addEventListener('click', function () {
      var list = filtered();
      if (!list.length) { alert('No questions match this filter.'); return; }
      state.pos = Math.floor(Math.random() * list.length);
      renderAll();
    });
    document.getElementById('nextBtn').addEventListener('click', function () {
      if (state.pos < filtered().length - 1) { state.pos++; renderAll(); }
    });
    document.getElementById('prevBtn').addEventListener('click', function () {
      if (state.pos > 0) { state.pos--; renderAll(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') document.getElementById('nextBtn').click();
      if (e.key === 'ArrowLeft') document.getElementById('prevBtn').click();
    });
    initPractice();
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
