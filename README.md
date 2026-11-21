# नेपाल सरकारको शाखा अधिकृत (रा.प. तृतीय) — English Language Competence Test (20 Marks)

A static, offline study website for **Nepal officer-level English** preparation (PSC Section Officer / शाखा अधिकृत, Nepal Army Officer Cadet, APF Inspector and similar exams).

## Highlights

- **1,355 questions** with answers and explanations — every item has an explanation.
- Category tabs: Grammar, Parts of Speech, Vocabulary, Sentence Completion, Error Detection, Reading Comprehension, Translation, Essay & Writing, Current Affairs, Letters & Notes, Historical Questions, All Questions.
- Historical questions transcribed from PSC Section Officer English 2083, Nepal Army Officer Cadet model papers, and APF / officer-level sources, with model answers.
- Interactive MCQs: click an option to see correct/incorrect marking and the explanation.
- **Section-wise Practice** mode: choose a section (or All Sections), click an answer and the correct option turns green while the other options turn red; the next question loads automatically. Includes shuffle, live score, progress bar and session summary. Yellow header styling highlights the title and subtitle.
- Revealable model answers for essays, translations, letters and notes.
- Search, random question, and previous/next navigation with keyboard arrows.
- Expandable syllabus & exam-pattern panel and source references.

## Files

- `index.html` — page structure, syllabus panel and source notes.
- `style.css` — responsive styling.
- `app.js` — combines all data sources, filtering, tabs, search, navigation and answer checking. `window.QUESTION_BANK` is exposed for debugging.
- `data.js` — curated grammar, vocabulary, sentence-completion, historical and current-affairs questions.
- `data2.js` — reading passages, translations, historical writing tasks and systematic practice sets.

The older 20-mark practice project still exists in `questions.js`, `styles.css`, `deploy/` and `Loksewa_Section_Officer_English_Practice/` and is untouched.

## Run it

Open `index.html` in a browser. No server, build step, account or internet connection is required.

## Sources

- PSC Section Officer English Language paper 2083 — HaakimSaab (`https://haakimsaab.com/psc-past-questions/2083/english-language`)
- Nepal Army Officer Cadet English syllabus and model questions
- APF Inspector syllabus (CollegeNP)
- EducateNepal officer-level past-paper listings

This is an independent study resource, not an official publication.
