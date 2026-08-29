const tabs = [
  { id: "dashboard", label: "Today" },
  { id: "loop", label: "Loop Map" },
  { id: "practice", label: "Practice" },
  { id: "review", label: "Review" },
  { id: "errors", label: "Errors" },
  { id: "assets", label: "Assets" },
  { id: "report", label: "Weekly" },
];

const loopSteps = [
  ["01", "AI conversation", "Answer a real interview, meeting, or AI product question."],
  ["02", "Capture errors", "Find sentence collapse, literal translation, weak logic, and grammar drift."],
  ["03", "Repair structure", "Rewrite as standard English, simple spoken English, and a reusable pattern."],
  ["04", "Extract assets", "Save high-value words, phrases, sentence frames, and PM/AI expressions."],
  ["05", "Next-day review", "Turn yesterday's mistakes into mandatory speaking repair tasks."],
  ["06", "Reuse under pressure", "Use target expressions in a new conversation and check recurrence."],
];

const tasks = [
  { id: "sentence-rebuild", title: "Sentence collapse rebuild", meta: "4 items", status: "Practicing", value: 72 },
  { id: "phrase-review", title: "Phrase review", meta: "10 phrases", status: "Not started", value: 0 },
  { id: "vocabulary-review", title: "Vocabulary review", meta: "8 words", status: "Improved", value: 48 },
  { id: "reuse-mission", title: "Conversation reuse mission", meta: "5 expressions", status: "Locked", value: 0 },
];

const errors = [
  {
    id: "seed_sentence_collapse",
    type: "Sentence Collapse",
    level: "High priority",
    original:
      "Large language models hallucinate because the models are trained to predict the information, the output, and they cannot know the fact.",
    issue:
      "The answer starts with a clear cause, then stretches into a long translated sentence and loses the main contrast.",
    standard:
      "Large language models hallucinate because they are trained to predict the next likely token, not to verify facts.",
    simple:
      "LLMs hallucinate because they predict words. They do not truly check facts.",
    pattern: "X happens because Y, not because Z.",
    status: "Recurring Error",
  },
  {
    id: "seed_logic_bridge",
    type: "Logic Bridge",
    level: "Medium priority",
    original:
      "If the product manager only cares about the feature, the user maybe cannot understand the value, so the product is failed.",
    issue:
      "The logic is useful, but the sentence needs a cleaner conditional structure and a more natural verb choice.",
    standard:
      "If a product manager focuses only on features, users may fail to understand the real value of the product.",
    simple:
      "Features are not enough. Users need to understand the value.",
    pattern: "If X focuses only on Y, users may fail to understand Z.",
    status: "Improved",
  },
];

const expressions = [
  ["grounding", "AI term", "linking a model's answer to reliable external information", "Learning"],
  ["balance trade-offs", "PM phrase", "compare benefits, costs, and risks before making a choice", "Active"],
  ["decision latency", "Business phrase", "the delay between identifying a problem and making a decision", "New"],
  ["structure the answer", "Speaking pattern", "organize an idea before expanding it", "Familiar"],
  ["verify facts", "AI term", "check whether information is accurate", "Learning"],
  ["push back respectfully", "Meeting language", "disagree without damaging the relationship", "Active"],
];

const contextCaptureSource = {
  title: "Andrew Ng — AI Agents and the Future of Work",
  type: "YouTube · current tab",
  url: "https://www.youtube.com/",
};

const contextCaptureMoments = [
  {
    id: "underestimate",
    expression: "underestimate",
    pronunciation: "/ˌʌndərˈestɪmeɪt/",
    partOfSpeech: "verb",
    meaningZh: "低估",
    contextSentence:
      "Many companies underestimate the amount of work required to deploy AI systems reliably in production.",
    align: "left",
  },
  {
    id: "deploy-reliably",
    expression: "deploy AI systems reliably",
    pronunciation: "",
    partOfSpeech: "phrase",
    meaningZh: "可靠地部署 AI 系统",
    contextSentence:
      "Many companies underestimate the amount of work required to deploy AI systems reliably in production.",
    align: "right",
  },
  {
    id: "decision-latency",
    expression: "decision latency",
    pronunciation: "/dɪˈsɪʒən ˈleɪtənsi/",
    partOfSpeech: "noun phrase",
    meaningZh: "决策延迟",
    contextSentence:
      "The real cost is not only model latency, but also the decision latency across the product team.",
    align: "right",
  },
];

const metrics = [
  ["Fixed Speaking Errors", "18", "+6 this week"],
  ["Reused Expressions", "42", "68% reuse rate"],
  ["Recurring Error Rate", "21%", "-14%"],
  ["Longest Stable Answer", "2m 40s", "+35s"],
];

const defaultModels = [
  "gpt-5.4-mini",
  "gpt-5.5",
];
const userPlans = ["free", "basic", "pro", "premium"];
const taskTypes = [
  "realtime_speaking_coach",
  "live_transcription",
  "immediate_correction",
  "follow_up_question",
  "advanced_expression",
  "post_session_report",
  "tomorrow_review_planner",
  "vocabulary_phrase_extractor",
  "pronunciation_shadowing",
];
const providerOptions = ["openai"];
const nativeVoiceOptions = [
  { id: "Samantha", label: "OpenAI · Native US English" },
  { id: "Daniel", label: "OpenAI · Native UK English" },
];
const correctionModes = [
  { id: "strict", label: "Strict", description: "Stop and repair every meaningful error." },
  { id: "balanced", label: "Balanced", description: "Repair errors that affect natural speech." },
  { id: "fluency", label: "Fluency", description: "Interrupt only when meaning or flow breaks." },
];

function coachSystemPrompt(mode = "strict") {
  return `You are SpeakLoop Coach, an English speaking coach for intermediate Chinese-speaking learners.
Your job is not to make sentences fancy. Make them correct, natural, short, and speakable.
The current correction mode is ${mode}.

Return strict JSON only, with exactly these keys:
{
  "answerToUser": "Briefly answer any direct question the learner asked before continuing.",
  "correctedSentence": "One natural spoken correction that preserves the intended meaning.",
  "simpleSpokenVersion": "The easiest short version to repeat.",
  "advancedExpression": "A reusable advanced expression only for business, interview, meeting, or presentation contexts; otherwise use an empty string.",
  "errorType": "A short label such as Question Formation, Word Choice, Grammar, Sentence Structure, Logic, or Naturalness.",
  "explanation": "One short practical explanation.",
  "wrongFragment": "The smallest incorrect or unnatural fragment from the learner.",
  "correctFragment": "The matching corrected fragment.",
  "followUpQuestion": "Exactly one short conversational question that continues the learner's actual topic.",
  "needsRepeat": true
}

Rules:
- Correct only the most important issue.
- Do not add unnecessary meaning, random words, poetic language, or ideas the learner did not express.
- Keep the correction and explanation to one or two short sentences.
- The learner should speak more than the coach.
- First understand the learner's meaning. Never continue with an unrelated stock question.
- If the learner asks who you are or how to address you, answer: "You can call me SpeakLoop Coach. I'm your AI speaking coach."
- Preserve positive and negative meaning carefully, especially can/can't and do/don't.
- correctedSentence is natural spoken grammar. simpleSpokenVersion is easier and shorter.
- advancedExpression is optional. Use it only for business, interviews, debates, presentations, or AI/PM professional discussion.
- For casual conversation, advancedExpression must be an empty string.
- In strict mode, needsRepeat is true for every meaningful correction.
- In balanced mode, needsRepeat is false only for tiny errors that do not affect naturalness.
- In fluency mode, needsRepeat is true only when meaning, structure, or conversational flow breaks.
- Keep every value concise. Do not include Markdown, code fences, commentary, or extra keys.`;
}

const demoFollowUps = [
  "Good. Now answer again with this pattern: The main risk is that X, because Y. Keep it under 25 seconds.",
  "Try a product-manager version: explain the user risk, the business risk, and one mitigation.",
  "Now make it simpler. Use two short sentences instead of one long translated sentence.",
  "Good direction. Add one example from an AI product or interview scenario.",
];

const app = document.querySelector("#app");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canRecordAudio = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
const canVoiceInput = Boolean(SpeechRecognition || canRecordAudio);
let mediaRecorder = null;
let mediaStream = null;
let recordedAudioChunks = [];
let liveRecognition = null;
let liveRecognitionActive = false;
let liveRecognitionRestartTimer = null;
let liveBaseTranscript = "";
let liveFinalTranscript = "";
let liveHeardAudio = false;
let activeSpeechAudio = null;
let activeSpeechAudioUrl = "";
let captureClockTimer = null;
if ("speechSynthesis" in window) {
  window.speechSynthesis.cancel();
}

const isHttpPreview = location.protocol === "http:" || location.protocol === "https:";
const initialParams = new URLSearchParams(location.search);
const initialTab = tabs.some((tab) => tab.id === initialParams.get("tab"))
  ? initialParams.get("tab")
  : "dashboard";

const ERROR_STATUS_CYCLE = ["Recurring Error", "Practicing", "Improved"];
const ERROR_STATUS_STORAGE_KEY = "speakloop.errorStatus.v1";

const state = {
  activeTab: initialTab,
  recording: false,
  voiceEnabled: true,
  openAIConfigured: false,
  geminiConfigured: false,
  selectedVoiceURI: "Samantha",
  availableVoices: [],
  voiceStatus: canVoiceInput
    ? SpeechRecognition
      ? "Voice ready · live transcript appears while you speak"
      : "Voice ready · transcript appears after you stop"
    : "Voice input is not supported in this browser",
  voiceTone: canVoiceInput ? "success" : "warning",
  selectedModel: defaultModels[0],
  userPlan: "free",
  taskType: "realtime_speaking_coach",
  preferredProvider: "openai",
  lastRouteResult: null,
  modelCallLogs: [],
  customModel: "",
  availableModels: [...defaultModels],
  llmStatus: isHttpPreview
    ? "OpenAI connection: not checked"
    : "Open with the local server to call OpenAI securely",
  llmStatusTone: "neutral",
  chatLoading: false,
  chatInput: "",
  vocabularyCards: [],
  vocabularyLoading: true,
  assetFilter: "All",
  translatingCardIds: [],
  translationErrors: {},
  captureOpen: initialParams.get("capture") === "1",
  captureDraft: {
    expression: "",
    contextSentence: "",
    sourceTitle: "",
    privateMode: false,
  },
  captureSaving: false,
  captureToast: null,
  captureListening: false,
  captureTimeSeconds: 18 * 60 + 24,
  activeCaptureMomentId: "",
  savedCaptureMomentIds: [],
  focusedCardId: initialParams.get("card") || "",
  practiceTargets: [],
  reviewPreviewOpen: false,
  correctionMode: "strict",
  practicePhase: "answer",
  pendingCorrection: null,
  sessionErrors: [],
  errorStatuses: loadErrorStatuses(),
  errorFilter: "All",
  aiReview: null,
  aiReviewLoading: false,
  aiReviewError: "",
  chatMessages: [
    {
      role: "assistant",
      kind: "prompt",
      content:
        "Give me a product-manager answer, not a technical definition. Why are LLM hallucinations risky for users?",
    },
  ],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackVocabularyCards() {
  return expressions.map(([expression, type, meaning, mastery], index) => ({
    id: `demo_vocab_${index}`,
    expression,
    expressionType: type.toLowerCase().includes("pattern") ? "pattern" : expression.includes(" ") ? "phrase" : "word",
    meaningZh: "",
    meaningEn: meaning,
    exampleSentence: "",
    spokenExample: expression,
    sourceType: "manual",
    sourceTitle: "SpeakLoop starter library",
    tags: [type],
    masteryLevel: mastery.toLowerCase(),
    reviewCount: 0,
    usageCount: mastery === "Active" ? 4 : 0,
    nextReviewDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date(0).toISOString(),
  }));
}

function activeVocabularyTargets() {
  const selected = state.practiceTargets
    .map((id) => state.vocabularyCards.find((card) => card.id === id))
    .filter(Boolean);
  const defaults = state.vocabularyCards.filter((card) => card.masteryLevel !== "mastered");
  return [...selected, ...defaults.filter((card) => !state.practiceTargets.includes(card.id))].slice(0, 5);
}

const CAPTURED_SOURCE_TYPES = new Set(["webpage", "browser_video"]);

function isCapturedCard(card) {
  return CAPTURED_SOURCE_TYPES.has(card.sourceType);
}

function capturedCards() {
  return state.vocabularyCards.filter(isCapturedCard);
}

function captureSourceLabel(card) {
  if (card.sourceType === "browser_video") return "Video caption";
  if (card.sourceType === "webpage") return "Web page";
  return String(card.sourceType || "manual").replaceAll("_", " ");
}

function vocabularyTags() {
  const captured = capturedCards().length;
  return [
    "All",
    ...(captured ? [`Captured (${captured})`] : []),
    ...new Set(state.vocabularyCards.flatMap((card) => card.tags || []).filter(Boolean)),
  ];
}

function filteredVocabularyCards() {
  const cards = state.vocabularyCards;
  if (state.assetFilter === "All") return cards;
  if (state.assetFilter.startsWith("Captured")) {
    return capturedCards();
  }
  return cards.filter((card) => (card.tags || []).includes(state.assetFilter));
}

function sourceLabel(card) {
  if (card.sourceTitle) return card.sourceTitle;
  if (card.sourceFileName) return card.sourceFileName;
  return String(card.sourceType || "manual").replaceAll("_", " ");
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function cleanSpeechText(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[`*_#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFollowUp(text) {
  const source = String(text || "").trim();
  const labeledMatch = source.match(
    /(?:follow[- ]?up(?: question)?|next question)\s*:\s*([\s\S]*?)(?=\n\s*(?:correction|repair|advanced expression|reusable expression|simple spoken version)\s*:|$)/i,
  );
  if (labeledMatch?.[1]) {
    return cleanSpeechText(labeledMatch[1]);
  }

  const questions = cleanSpeechText(source).match(/[^.!?]*\?/g);
  return questions?.at(-1)?.trim() || "";
}

function lastAssistantFollowUp() {
  const message = [...state.chatMessages].reverse().find((item) => item.role === "assistant");
  return message?.followUp || message?.coach?.followUpQuestion || extractFollowUp(message?.content);
}

function sentenceCase(text) {
  const clean = String(text || "").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
}

function formatSpokenTranscript(text) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  if (!source) return "";
  if (/[.!?]/.test(source)) return sentenceCase(source);

  const chunks = source
    .replace(
      /\s+(?=(?:what|where|when|why|who|how)\b|(?:are|is|do|does|did|can|could|would|will|should|have|has)\s+(?:you|we|they|it|he|she)\b)/gi,
      "|||",
    )
    .split("|||")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks
    .map((chunk) => {
      const isQuestion =
        /^(?:what|where|when|why|who|how)\b/i.test(chunk) ||
        /^(?:are|is|do|does|did|can|could|would|will|should|have|has)\s+(?:you|we|they|it|he|she)\b/i.test(chunk);
      return `${sentenceCase(chunk)}${isQuestion ? "?" : "."}`;
    })
    .join(" ");
}

function extractJsonObject(text) {
  const source = String(text || "").replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

function parseLabeledSection(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(text || "").match(
    new RegExp(`${escaped}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*[A-Za-z][A-Za-z -]+\\s*:|$)`, "i"),
  );
  return cleanSpeechText(match?.[1] || "");
}

function normalizeCoachResult(raw, originalText) {
  const parsed = extractJsonObject(raw);
  const correctedFromLabel =
    parseLabeledSection(raw, "Correction") ||
    parseLabeledSection(raw, "Simple spoken version");
  const fallback = demoCoachResult(originalText);
  const result = {
    answerToUser: cleanSpeechText(parsed?.answerToUser || ""),
    correctedSentence: cleanSpeechText(
      parsed?.correctedSentence || correctedFromLabel || fallback.correctedSentence,
    ),
    simpleSpokenVersion: cleanSpeechText(
      parsed?.simpleSpokenVersion || parsed?.correctedSentence || fallback.simpleSpokenVersion,
    ),
    advancedExpression: cleanSpeechText(
      parsed?.advancedExpression ||
        parseLabeledSection(raw, "Advanced expression") ||
        fallback.advancedExpression,
    ),
    errorType: cleanSpeechText(parsed?.errorType || fallback.errorType),
    explanation: cleanSpeechText(parsed?.explanation || fallback.explanation),
    wrongFragment: cleanSpeechText(parsed?.wrongFragment || originalText),
    correctFragment: cleanSpeechText(
      parsed?.correctFragment || parsed?.correctedSentence || fallback.correctFragment,
    ),
    followUpQuestion: cleanSpeechText(
      parsed?.followUpQuestion || extractFollowUp(raw) || fallback.followUpQuestion,
    ),
    needsRepeat:
      typeof parsed?.needsRepeat === "boolean"
        ? parsed.needsRepeat
        : state.correctionMode !== "fluency",
  };

  if (!result.correctedSentence) result.correctedSentence = formatSpokenTranscript(originalText);
  if (!result.simpleSpokenVersion) result.simpleSpokenVersion = result.correctedSentence;
  if (!result.followUpQuestion) result.followUpQuestion = fallback.followUpQuestion;
  return result;
}

function normalizeRepeatWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function wordEditDistance(left, right) {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column;
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitution = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitution,
      );
    }
  }
  return matrix[left.length][right.length];
}

function repeatAccuracy(spoken, target) {
  const spokenWords = normalizeRepeatWords(spoken);
  const targetWords = normalizeRepeatWords(target);
  if (!spokenWords.length || !targetWords.length) return 0;
  const distance = wordEditDistance(spokenWords, targetWords);
  return Math.max(0, 1 - distance / Math.max(spokenWords.length, targetWords.length));
}

function repeatStatusLabel(status) {
  return {
    not_repeated: "Not repeated",
    repeated_with_errors: "Repeated with errors",
    repeated_successfully: "Repeated successfully",
    skipped: "Skipped",
  }[status] || "Not repeated";
}

function coachMessageContent(coach) {
  return [
    coach.answerToUser,
    coach.correctedSentence,
    coach.advancedExpression,
    coach.followUpQuestion,
  ]
    .filter(Boolean)
    .join("\n");
}

function demoCoachResult(userText) {
  const lower = userText.toLowerCase();
  const hasNegationIssue = /\b(can't|cannot|don't|doesn't|isn't|aren't)\b/.test(lower);
  const correctedSentence = hasNegationIssue
    ? "I hope you can answer my question."
    : "The main risk is that users may trust fluent output as verified facts.";
  const followUp = demoFollowUps[state.chatMessages.length % demoFollowUps.length];
  const asksIdentity = /\b(your name|who are you|address you|call you)\b/.test(lower);

  return {
    answerToUser: asksIdentity
      ? "You can call me SpeakLoop Coach. I'm your AI speaking coach."
      : "",
    correctedSentence,
    simpleSpokenVersion: correctedSentence,
    advancedExpression: "The main risk is that users may mistake fluent output for verified fact.",
    errorType: hasNegationIssue ? "Meaning and Negation" : "Sentence Structure",
    explanation: hasNegationIssue
      ? "Use can, not can't, when you are making a polite request."
      : "Make the main risk clear in one short sentence.",
    wrongFragment: hasNegationIssue ? "can't answer" : userText,
    correctFragment: hasNegationIssue ? "can answer" : correctedSentence,
    followUpQuestion: asksIdentity
      ? "Now ask me one more question in a clean sentence."
      : followUp,
    needsRepeat: true,
  };
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

// --- Error status tracking -------------------------------------------------
// Clicking the status chip on an error card walks it through the repair
// lifecycle. The choice is the learner's own record of progress, so it is kept
// in localStorage and survives a reload.

function loadErrorStatuses() {
  try {
    const raw = window.localStorage.getItem(ERROR_STATUS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveErrorStatuses(statuses) {
  try {
    window.localStorage.setItem(ERROR_STATUS_STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    // Private browsing or blocked storage: the status still works for this session.
  }
}

function errorStatusFor(error) {
  return state.errorStatuses[error.id] || error.status || ERROR_STATUS_CYCLE[0];
}

function cycleErrorStatus(errorId) {
  const all = [...state.sessionErrors, ...errors];
  const error = all.find((item) => item.id === errorId);
  if (!error) return;
  const current = errorStatusFor(error);
  const index = ERROR_STATUS_CYCLE.indexOf(current);
  const next = ERROR_STATUS_CYCLE[(index + 1) % ERROR_STATUS_CYCLE.length];
  state.errorStatuses = { ...state.errorStatuses, [errorId]: next };
  saveErrorStatuses(state.errorStatuses);
  render();
}

function practiceErrorRepair(errorId) {
  const all = [...state.sessionErrors, ...errors];
  const error = all.find((item) => item.id === errorId);
  if (!error) return;
  openPracticeTask({
    taskType: "immediate_correction",
    prompt: [
      `You previously said: "${error.original}"`,
      "",
      `The repaired version is: "${error.standard}"`,
      "",
      `Say the same idea again using the pattern "${error.pattern}". Use your own example, not this one.`,
    ].join("\n"),
  });
}

function progressRing(value, label) {
  return `
    <div class="ring" style="--value:${value}">
      <span>${value}%</span>
      <small>${label}</small>
    </div>
  `;
}

function shell(content) {
  return `
    <header class="app-header">
      <a class="brand" href="#" data-tab="dashboard" aria-label="SpeakLoop home">
        <span class="brand-mark">SL</span>
        <span>
          <strong>SpeakLoop</strong>
          <small>Personal speaking repair system</small>
        </span>
      </a>
      <nav class="top-nav" aria-label="Primary">
        ${tabs
          .map(
            (tab) => `
              <button class="${state.activeTab === tab.id ? "active" : ""}" data-tab="${tab.id}">
                ${tab.label}
              </button>
            `,
          )
          .join("")}
      </nav>
    </header>
    <main>
      ${content}
    </main>
    ${
      state.captureToast
        ? `
          <aside class="capture-toast" role="status">
            <div>
              <strong>${escapeHtml(state.captureToast.message)}</strong>
              <span>${escapeHtml(state.captureToast.expression)}</span>
            </div>
            <button type="button" data-view-captured>View Card</button>
            ${state.captureToast.cardId ? `<button type="button" data-undo-capture>Undo</button>` : ""}
          </aside>
        `
        : ""
    }
  `;
}

function dashboard() {
  return `
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="eyebrow">Fix yesterday's mistakes. Speak better today.</p>
        <h1>Today’s Speaking Repair Mission</h1>
        <p class="hero-lead">
          SpeakLoop turns every conversation into a repair loop: capture what broke, rebuild the sentence,
          review it tomorrow, then force the expression back into real speaking.
        </p>
        <div class="hero-actions">
          <button class="primary-action" data-tab="review">Start Today’s Review</button>
          <button class="secondary-action" data-tab="practice">Start New Conversation</button>
        </div>
      </div>
      <aside class="mission-panel" aria-label="Today mission">
        <div class="panel-topline">
          <span>Repair readiness</span>
          <strong>72%</strong>
        </div>
        ${progressRing(72, "Today")}
        <div class="mission-list">
          ${tasks
            .slice(0, 3)
            .map(
              (task) => `
                <article>
                  <span class="task-dot ${statusClass(task.status)}"></span>
                  <div>
                    <strong>${task.title}</strong>
                    <small>${task.meta} · ${task.status}</small>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </aside>
    </section>

    <section class="content-grid">
      <article class="wide-card">
        <div class="section-heading">
          <p class="eyebrow">Design system snapshot</p>
          <h2>Product Loop, Not Chat</h2>
        </div>
        <div class="mini-loop">
          ${loopSteps
            .slice(0, 5)
            .map(
              ([num, title]) => `
                <div>
                  <span>${num}</span>
                  <strong>${title}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </article>

      <article class="metric-card capture-inbox-card">
        <span class="metric-label">Captured from browser</span>
        <strong>${capturedCards().length}</strong>
        <p>Words and sentences you saved while reading or watching.</p>
        <button type="button" class="link-button" data-open-captured>Open capture inbox</button>
      </article>
      <article class="metric-card">
        <span class="metric-label">Streak</span>
        <strong>12 days</strong>
        <p>Review first, then start a new conversation.</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Error repair rate</span>
        <strong>64%</strong>
        <p>Recurring sentence collapse is down this week.</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Target reuse</span>
        <strong>31 / 45</strong>
        <p>Expressions used again in live answers.</p>
      </article>
    </section>
  `;
}

function loopMap() {
  return `
    <section class="page-section">
      <div class="section-heading center">
        <p class="eyebrow">Graphical product representation</p>
        <h1>SpeakLoop System Map</h1>
        <p>The product is built around one calm, repeated learning loop.</p>
      </div>
      <div class="loop-map">
        ${loopSteps
          .map(
            ([num, title, desc], index) => `
              <article class="loop-node node-${index + 1}">
                <span>${num}</span>
                <strong>${title}</strong>
                <p>${desc}</p>
              </article>
            `,
          )
          .join("")}
        <div class="loop-core">
          <strong>Speaking assets</strong>
          <span>Errors · Words · Phrases · Patterns</span>
        </div>
      </div>
      <div class="style-board">
        <article>
          <h3>Visual Tone</h3>
          <p>Calm, precise, intelligent, premium. Light surfaces, quiet borders, generous spacing.</p>
        </article>
        <article>
          <h3>Primary Action</h3>
          <p>Review before conversation. The UI should guide repair first, then fluency practice.</p>
        </article>
        <article>
          <h3>Information Shape</h3>
          <p>Every sentence can become an error card, a reusable pattern, and a next-day task.</p>
        </article>
      </div>
    </section>
  `;
}

function renderChatMessage(message, index) {
  if (message.role === "user") {
    return `
      <article class="bubble user">
        <span>You</span>
        <p>${escapeHtml(message.displayContent || message.content).replaceAll("\n", "<br>")}</p>
      </article>
    `;
  }

  if (message.kind === "correction" && message.coach) {
    const coach = message.coach;
    const practiceCount = Number(message.practiceCount || 0);
    const practiceGoal = Number(message.practiceGoal || 1);
    return `
      <article class="bubble coach correction-card">
        <div class="correction-heading">
          <div>
            <span>SpeakLoop Coach · ${escapeHtml(coach.errorType)}</span>
            <strong>Stop. Say it this way.</strong>
          </div>
          <span class="repeat-status ${escapeHtml(message.repeatStatus || "not_repeated")}">
            ${escapeHtml(repeatStatusLabel(message.repeatStatus))}
          </span>
        </div>
        ${
          coach.answerToUser
            ? `<p class="coach-direct-answer">${escapeHtml(coach.answerToUser)}</p>`
            : ""
        }
        <div class="sentence-comparison">
          <div>
            <span>Original</span>
            <p><del>${escapeHtml(message.original)}</del></p>
            ${
              coach.wrongFragment && coach.wrongFragment !== message.original
                ? `<small>Focus: <del>${escapeHtml(coach.wrongFragment)}</del></small>`
                : ""
            }
          </div>
          <div>
            <span>Natural correction</span>
            <p><mark>${escapeHtml(coach.correctedSentence)}</mark></p>
            ${
              coach.correctFragment && coach.correctFragment !== coach.correctedSentence
                ? `<small>Use: <mark>${escapeHtml(coach.correctFragment)}</mark></small>`
                : ""
            }
          </div>
        </div>
        <p class="correction-explanation">${escapeHtml(coach.explanation)}</p>
        ${
          coach.simpleSpokenVersion && coach.simpleSpokenVersion !== coach.correctedSentence
            ? `
              <div class="simple-spoken-line">
                <span>Simple spoken version</span>
                <strong>${escapeHtml(coach.simpleSpokenVersion)}</strong>
              </div>
            `
            : ""
        }
        <div class="repeat-instruction">
          <strong>Now repeat it.</strong>
          ${practiceGoal > 1 ? `<span>${practiceCount} / ${practiceGoal} successful repetitions</span>` : ""}
        </div>
        <div class="coach-actions">
          <button type="button" data-speak-correction="${index}">Listen</button>
          <button type="button" data-start-repeat="${index}">Repeat</button>
          <button type="button" data-skip-repeat="${index}">Skip</button>
          <button type="button" data-practice-three="${index}">Practice 3 times</button>
        </div>
      </article>
    `;
  }

  if (message.kind === "repeat-feedback") {
    return `
      <article class="bubble coach repeat-feedback ${message.success ? "success" : "retry"}">
        <span>${message.success ? "Repeat check" : "Try once more"}</span>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `;
  }

  if (message.kind === "provider-error") {
    return `
      <article class="bubble coach provider-error">
        <span>OpenAI connection</span>
        <p>${escapeHtml(message.content)}</p>
      </article>
    `;
  }

  if (message.kind === "continuation" && message.coach) {
    const coach = message.coach;
    return `
      <article class="bubble coach continuation-card">
        <span>${message.repeatPassed ? "Repeated successfully" : "AI Coach"}</span>
        ${coach.answerToUser ? `<p>${escapeHtml(coach.answerToUser)}</p>` : ""}
        ${
          coach.advancedExpression
            ? `
              <details class="advanced-note">
                <summary>After-practice expression</summary>
                <p>${escapeHtml(coach.advancedExpression)}</p>
              </details>
            `
            : ""
        }
        <div class="follow-up-block">
          <span>Continue conversation</span>
          <strong>${escapeHtml(coach.followUpQuestion)}</strong>
        </div>
        <button type="button" class="speak-follow-up" data-speak-follow-up="${index}" aria-label="Listen to follow-up question">
          Listen to follow-up
        </button>
      </article>
    `;
  }

  const followUp = message.followUp || extractFollowUp(message.content);
  return `
    <article class="bubble coach">
      <span>AI Coach</span>
      <p>${escapeHtml(message.content).replaceAll("\n", "<br>")}</p>
      ${
        followUp
          ? `<button type="button" class="speak-follow-up" data-speak-follow-up="${index}" aria-label="Listen to follow-up question">Listen to follow-up</button>`
          : ""
      }
    </article>
  `;
}

function formatCaptureClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function contextCaptureMoment(moment) {
  const saved =
    state.savedCaptureMomentIds.includes(moment.id) ||
    state.vocabularyCards.some(
      (card) =>
        card.captureMethod === "context_capture" &&
        String(card.expression || "").toLowerCase() === moment.expression.toLowerCase(),
    );
  const isOpen = state.activeCaptureMomentId === moment.id;
  return `
    <span class="capture-term ${moment.align === "right" ? "align-right" : ""} ${isOpen ? "is-open" : ""}">
      <button
        type="button"
        class="capture-term-trigger"
        data-open-capture-moment="${escapeHtml(moment.id)}"
        aria-expanded="${isOpen ? "true" : "false"}"
        aria-label="Open context card for ${escapeHtml(moment.expression)}"
      >${escapeHtml(moment.expression)}</button>
      <span class="capture-hover-card" role="group" aria-label="Context card for ${escapeHtml(moment.expression)}">
        <span class="capture-card-heading">
          <span>
            <strong>${escapeHtml(moment.expression)}</strong>
            <small>${escapeHtml([moment.pronunciation, moment.partOfSpeech].filter(Boolean).join(" · "))}</small>
          </span>
          <button type="button" class="capture-pronounce" data-speak-capture-moment="${escapeHtml(moment.id)}" aria-label="Pronounce ${escapeHtml(moment.expression)}">Listen</button>
        </span>
        <span class="capture-definition">
          <small>中文释义</small>
          <strong>${escapeHtml(moment.meaningZh)}</strong>
        </span>
        <span class="capture-context-sentence">
          <small>Original sentence</small>
          <span>${escapeHtml(moment.contextSentence)}</span>
        </span>
        <button
          type="button"
          class="capture-save-moment ${saved ? "saved" : ""}"
          data-save-capture-moment="${escapeHtml(moment.id)}"
          ${saved || state.captureSaving ? "disabled" : ""}
        >${saved ? "Saved to Moment Review" : state.captureSaving ? "Saving..." : "+ Save Moment"}</button>
      </span>
    </span>
  `;
}

function contextCapturePanel() {
  const underestimate = contextCaptureMoments[0];
  const deployReliably = contextCaptureMoments[1];
  const decisionLatency = contextCaptureMoments[2];
  return `
    <section class="context-capture" data-testid="context-capture">
      <div class="capture-intro">
        <div>
          <p class="eyebrow">Practice 2.0 · Context Capture</p>
          <h1>Capture the moment.<br />Then speak it.</h1>
          <p>Don’t save isolated words. Keep the sentence, the source, and the moment you met them.</p>
        </div>
        <div class="capture-loop-mark" aria-label="Capture learning loop">
          <span>Real input</span><i>→</i><span>Save moment</span><i>→</i><span>Speak</span>
        </div>
      </div>

      <div class="capture-studio ${state.captureListening ? "is-listening" : ""}">
        <div class="capture-toolbar">
          <div class="capture-status" aria-live="polite">
            <span class="capture-status-dot"></span>
            <div>
              <strong>${state.captureListening ? "Listening to current tab" : "Ready to listen"}</strong>
              <small>${state.captureListening ? "The video keeps playing while you capture." : "Start once. Keep watching without pausing."}</small>
            </div>
          </div>
          <button type="button" class="capture-listen-button" data-toggle-context-capture>
            ${state.captureListening ? "Stop listening" : "Start current tab"}
          </button>
        </div>

        <div class="capture-source-row">
          <div>
            <small>Now playing</small>
            <strong>${escapeHtml(contextCaptureSource.title)}</strong>
          </div>
          <time data-capture-time>${formatCaptureClock(state.captureTimeSeconds)}</time>
        </div>

        <div class="capture-transcript-shell">
          <div class="capture-transcript-heading">
            <span>Live transcript</span>
            <small>${state.captureListening ? "Hover any highlighted expression" : "Preview · start listening to make it live"}</small>
          </div>
          <div class="capture-live-lines">
            <p class="capture-live-line active">
              Many companies ${contextCaptureMoment(underestimate)} the amount of work required to
              ${contextCaptureMoment(deployReliably)} in production.
            </p>
            <p class="capture-live-line">
              The real cost is not only model latency, but also the ${contextCaptureMoment(decisionLatency)}
              across the product team.
            </p>
          </div>
          <div class="capture-hint">
            <span>Hover</span>
            <p>Meaning, pronunciation, context, and Save are all in one card.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function momentReviewPanel() {
  const capturedCards = state.vocabularyCards
    .filter((card) => card.captureMethod === "context_capture")
    .slice(0, 3);
  return `
    <section class="moment-review-panel" data-testid="moment-review">
      <div class="moment-review-heading">
        <div>
          <span>Moment Review</span>
          <h2>From real input to active language.</h2>
        </div>
        <strong>${capturedCards.length}</strong>
      </div>
      <div class="moment-review-loop" aria-label="Moment review flow">
        <span>Understand</span><i>→</i><span>Recall</span><i>→</i><span>Speak</span><i>→</i><span>Reuse</span>
      </div>
      ${
        capturedCards.length
          ? `<div class="captured-moment-list">${capturedCards
              .map(
                (card) => `
                  <article>
                    <small>${escapeHtml(card.sourceTitle || "Captured context")}</small>
                    <strong>${escapeHtml(card.expression)}</strong>
                    <p>${escapeHtml(card.contextSentence || card.exampleSentence || "Context saved for review.")}</p>
                    <button type="button" data-practice-capture="${escapeHtml(card.id)}">Use in speaking</button>
                  </article>
                `,
              )
              .join("")}</div>`
          : `
            <div class="moment-review-empty">
              <strong>Your next speaking prompt starts with a saved moment.</strong>
              <p>Hover a highlighted expression and save it without leaving the transcript.</p>
            </div>
          `
      }
    </section>
  `;
}

function practice() {
  return `
    <section class="practice-layout">
      <div class="conversation-pane">
        ${contextCapturePanel()}
        <div class="practice-section-divider">
          <span>Speaking practice</span>
          <p>Use captured moments in a real answer, then repair and repeat.</p>
        </div>
        <div class="practice-topbar">
          <div class="section-heading">
            <p class="eyebrow">AI speaking practice</p>
            <h2>Live AI Conversation</h2>
            <p>Speak naturally. When a sentence breaks, the coach stops, repairs it, and waits for your repeat before continuing.</p>
            <div class="correction-mode" aria-label="Correction mode">
              ${correctionModes
                .map(
                  (mode) => `
                    <button
                      type="button"
                      class="${state.correctionMode === mode.id ? "active" : ""}"
                      data-correction-mode="${mode.id}"
                      title="${escapeHtml(mode.description)}"
                    >
                      ${mode.label}
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
          <div class="model-switcher">
            <label for="model-select">Model Router</label>
            <div class="router-controls">
              <label>
                Plan
                <select data-plan-select>
                  ${userPlans
                    .map(
                      (plan) => `
                        <option value="${plan}" ${state.userPlan === plan ? "selected" : ""}>${plan}</option>
                      `,
                    )
                    .join("")}
                </select>
              </label>
              <label>
                Task
                <select data-task-type>
                  ${taskTypes
                    .map(
                      (task) => `
                        <option value="${task}" ${state.taskType === task ? "selected" : ""}>${task}</option>
                      `,
                    )
                    .join("")}
                </select>
              </label>
              <label>
                Provider
                <select data-provider-select disabled>
                  ${providerOptions
                    .map(
                      (provider) => `
                        <option value="${provider}" ${state.preferredProvider === provider ? "selected" : ""}>${provider}</option>
                      `,
                    )
                    .join("")}
                </select>
              </label>
            </div>
            <div class="selected-model">
              <span>OpenAI model</span>
              <strong>${escapeHtml(state.selectedModel)}</strong>
            </div>
            <select id="model-select" data-model-select>
              ${state.availableModels
                .map(
                  (model) => `
                    <option value="${escapeHtml(model)}" ${state.selectedModel === model ? "selected" : ""}>
                      ${escapeHtml(model)}
                    </option>
                  `,
                )
                .join("")}
            </select>
            <div class="custom-model">
              <input
                data-custom-model
                value="${escapeHtml(state.customModel)}"
                placeholder="Custom OpenAI model ID"
              />
              <button type="button" data-use-custom-model>Use</button>
            </div>
            <button type="button" data-refresh-models>Check OpenAI connection</button>
            <small class="${state.llmStatusTone}">${escapeHtml(state.llmStatus)}</small>
            <small>OpenAI when it has credit, otherwise the Gemini free tier. The panel above always names the provider that actually answered.</small>
          </div>
        </div>
        <div class="practice-phase ${state.practicePhase}">
          <span>${state.practicePhase === "repeat" ? "Repeat required" : "Conversation open"}</span>
          <strong>
            ${
              state.practicePhase === "repeat"
                ? "Repeat the corrected sentence before the coach sends the next question."
                : `${correctionModes.find((mode) => mode.id === state.correctionMode)?.label || "Strict"} correction mode`
            }
          </strong>
        </div>
        <div class="router-status">
          <article>
            <span>Current route</span>
            <strong>${escapeHtml(state.lastRouteResult?.provider || state.preferredProvider || "auto")} · ${escapeHtml(state.lastRouteResult?.model || state.selectedModel)}</strong>
            <p>${escapeHtml(state.lastRouteResult?.taskType || state.taskType)} · plan ${escapeHtml(state.userPlan)}${state.lastRouteResult?.fallbackUsed ? " · fallback used" : ""}</p>
          </article>
          <article>
            <span>Last cost</span>
            <strong>$${Number(state.lastRouteResult?.cost?.totalCostUsd || 0).toFixed(6)}</strong>
            <p>${Number(state.lastRouteResult?.latencyMs || 0)} ms · cached ${state.lastRouteResult?.cached ? "yes" : "no"}</p>
          </article>
        </div>
        ${
          activeVocabularyTargets().length
            ? `
              <section class="practice-vocabulary">
                <div>
                  <span>Speaking assets for this conversation</span>
                  <strong>Try to use these expressions today.</strong>
                </div>
                <div class="target-expression-list">
                  ${activeVocabularyTargets()
                    .map(
                      (card) => `
                        <button type="button" data-practice-expression="${escapeHtml(card.id)}">
                          ${escapeHtml(card.expression)}
                        </button>
                      `,
                    )
                    .join("")}
                </div>
              </section>
            `
            : ""
        }
        <div class="transcript" aria-live="polite">
          ${state.chatMessages.map(renderChatMessage).join("")}
          ${
            state.chatLoading
              ? `
                <article class="bubble coach thinking">
                  <span>AI Coach</span>
                  <p>Thinking with ${escapeHtml(state.selectedModel)}...</p>
                </article>
              `
              : ""
          }
        </div>
        <form class="chat-composer" data-chat-form>
          <textarea
            data-chat-input
            placeholder="${
              state.practicePhase === "repeat"
                ? "Repeat the corrected sentence here, or tap the microphone and say it aloud..."
                : "Type or speak your answer here..."
            }"
            rows="4"
          >${escapeHtml(state.chatInput)}</textarea>
          <div>
            <button type="button" class="secondary-action" data-seed-answer>
              ${state.practicePhase === "repeat" ? "Use correction" : "Use sample answer"}
            </button>
            <button type="submit" class="primary-action" ${state.chatLoading ? "disabled" : ""}>
              ${
                state.chatLoading
                  ? "Sending..."
                  : state.practicePhase === "repeat"
                    ? "Check my repeat"
                    : "Send to AI Coach"
              }
            </button>
          </div>
        </form>
        <div class="recorder ${state.recording ? "recording" : ""}">
          <button class="record-button" data-record aria-label="${state.recording ? "Stop voice input" : "Start voice input"}">
            <span></span>
          </button>
          <div>
            <strong>${state.recording ? "Listening..." : "Voice input"}</strong>
            <small class="${state.voiceTone}">${escapeHtml(state.voiceStatus)}</small>
          </div>
        </div>
      </div>
      <aside class="live-notes">
        ${momentReviewPanel()}
        <h2 class="aside-section-title">AI Coach</h2>
        <article class="note blue">
          <span>Routing principle</span>
          <p>Practice uses the strong route; reports, reviews and vocabulary cards use the cheaper one. Whichever provider is serving, the split is the same.</p>
        </article>
        <article class="note warning">
          <span>Fallback</span>
          <p>If OpenAI runs out of credit, SpeakLoop switches to Gemini and labels the reply as a fallback. Any other failure is shown as the real error rather than answered by a weaker model.</p>
        </article>
        <article class="note">
          <span>Setup</span>
          <p>Set OPENAI_API_KEY, or GEMINI_API_KEY for the free tier. Model IDs stay configurable through environment variables.</p>
        </article>
        <article class="note">
          <span>Last calls</span>
          ${
            state.modelCallLogs.length
              ? `<div class="call-log-list">${state.modelCallLogs
                  .slice(0, 3)
                  .map(
                    (log) => `
                      <div>
                        <strong>${escapeHtml(log.provider)} · ${escapeHtml(log.model)}</strong>
                        <small>${escapeHtml(log.taskType)} · $${Number(log.totalCostUsd || 0).toFixed(6)} · ${log.fallbackUsed ? "fallback" : "primary"}</small>
                      </div>
                    `,
                  )
                  .join("")}</div>`
              : "<p>No model calls yet.</p>"
          }
        </article>
        <article class="note warning">
          <span>Voice limitation</span>
          <p>Recording continues through pauses until you stop it. If it cannot start, allow microphone access or try Chrome/Safari at http://127.0.0.1:4173.</p>
        </article>
        <article class="note voice-controls">
          <span>Voice output</span>
          <label>
            <input type="checkbox" data-auto-read ${state.voiceEnabled ? "checked" : ""} />
            Auto-read follow-up questions
          </label>
          <select data-voice-select aria-label="Native voice selection">
            ${nativeVoiceOptions
              .map(
                (voice) => `
                  <option value="${voice.id}" ${state.selectedVoiceURI === voice.id ? "selected" : ""}>
                    ${voice.label}
                  </option>
                `,
              )
              .join("")}
          </select>
          <button type="button" data-read-last>Replay latest follow-up</button>
          <button type="button" data-stop-voice>Stop voice</button>
          <p>Key corrections and follow-ups use cached OpenAI speech WAV. Advanced expressions stay text-only.</p>
        </article>
        <article class="note">
          <span>Voice mode</span>
          <p>Browser recognition shows live text while you speak. The full recording is checked by OpenAI after you stop when an API key is configured.</p>
        </article>
        <article class="note">
          <span>Coach behavior</span>
          <p>The coach pauses after a correction, checks your repeat, then sends the next question as text and native-accent audio.</p>
        </article>
      </aside>
    </section>
  `;
}

function stopSpeechOutput() {
  if (activeSpeechAudio) {
    activeSpeechAudio.pause();
    activeSpeechAudio.currentTime = 0;
    activeSpeechAudio = null;
  }
  if (activeSpeechAudioUrl) {
    URL.revokeObjectURL(activeSpeechAudioUrl);
    activeSpeechAudioUrl = "";
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function speakText(text) {
  const cleanText = cleanSpeechText(text);
  if (!cleanText) return;
  stopSpeechOutput();

  if (isHttpPreview) {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          voice: state.selectedVoiceURI,
        }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail || detail.error || `OpenAI TTS returned ${response.status}`);
      }
      activeSpeechAudioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(activeSpeechAudioUrl);
      activeSpeechAudio = audio;
      audio.onended = () => {
        activeSpeechAudio = null;
        if (activeSpeechAudioUrl) {
          URL.revokeObjectURL(activeSpeechAudioUrl);
          activeSpeechAudioUrl = "";
        }
      };
      await audio.play();
      return;
    } catch (error) {
      stopSpeechOutput();
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "en-US";
        utterance.rate = 0.94;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
        state.voiceStatus = "Playing with browser voice";
        state.voiceTone = "success";
        render();
        return;
      }
      state.voiceStatus = `Voice unavailable · ${error.message}`;
      state.voiceTone = "warning";
      render();
    }
  }
}

function stopVoiceInput() {
  liveRecognitionActive = false;
  if (liveRecognitionRestartTimer) {
    window.clearTimeout(liveRecognitionRestartTimer);
    liveRecognitionRestartTimer = null;
  }
  if (liveRecognition) {
    liveRecognition.onend = null;
    try {
      liveRecognition.stop();
    } catch {
      // Recognition may already be stopping.
    }
    liveRecognition = null;
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    try {
      mediaRecorder.stop();
    } catch {
      // The recorder may already be stopping.
    }
  }
  state.recording = false;
  state.voiceStatus = (state.openAIConfigured || state.geminiConfigured) && mediaRecorder
    ? "Recording stopped · AI is checking the transcript..."
    : state.chatInput.trim()
      ? "Transcript ready · review it and send"
      : liveHeardAudio
        ? "Speech was detected, but no text was returned · try Chrome or Safari"
        : "Voice stopped · no microphone sound detected";
  state.voiceTone = state.chatInput.trim() ? "success" : liveHeardAudio ? "warning" : "neutral";
  render();
}

function updateLiveTranscript(interimTranscript = "") {
  state.chatInput = [liveBaseTranscript, liveFinalTranscript, interimTranscript]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const input = document.querySelector("[data-chat-input]");
  if (input) input.value = state.chatInput;
}

function startLiveRecognitionCycle() {
  if (!SpeechRecognition || !liveRecognitionActive) return;
  liveRecognition = new SpeechRecognition();
  liveRecognition.lang = "en-US";
  liveRecognition.continuous = true;
  liveRecognition.interimResults = true;
  liveRecognition.maxAlternatives = 1;

  liveRecognition.onaudiostart = () => {
    state.voiceStatus = "Microphone connected · listening for speech";
    state.voiceTone = "success";
    const status = document.querySelector(".recorder small");
    if (status) status.textContent = state.voiceStatus;
  };

  liveRecognition.onsoundstart = () => {
    liveHeardAudio = true;
    state.voiceStatus = "Sound detected · keep speaking";
    state.voiceTone = "success";
    const status = document.querySelector(".recorder small");
    if (status) status.textContent = state.voiceStatus;
  };

  liveRecognition.onspeechstart = () => {
    liveHeardAudio = true;
    state.voiceStatus = "Speech detected · converting to text";
    state.voiceTone = "success";
    const status = document.querySelector(".recorder small");
    if (status) status.textContent = state.voiceStatus;
  };

  liveRecognition.onresult = (event) => {
    let interimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (!transcript) continue;
      if (event.results[index].isFinal) {
        liveFinalTranscript = `${liveFinalTranscript} ${transcript}`.trim();
      } else {
        interimTranscript = `${interimTranscript} ${transcript}`.trim();
      }
    }
    updateLiveTranscript(interimTranscript);
    state.voiceStatus = state.chatInput
      ? "Listening · live transcript is updating"
      : "Listening · start speaking";
    state.voiceTone = "success";
    const status = document.querySelector(".recorder small");
    if (status) {
      status.textContent = state.voiceStatus;
      status.className = state.voiceTone;
    }
  };

  liveRecognition.onerror = (event) => {
    if (!liveRecognitionActive || event.error === "aborted") return;
    if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
      liveRecognitionActive = false;
      const recordingFallbackActive = Boolean(
        mediaRecorder && mediaRecorder.state !== "inactive",
      );
      if (!recordingFallbackActive) {
        state.recording = false;
      }
      state.voiceStatus = recordingFallbackActive
        ? "Live transcript unavailable · recording continues until you stop"
        : event.error === "audio-capture"
          ? "No microphone input is available"
          : "Live speech recognition is blocked · allow microphone and speech recognition";
      state.voiceTone = "warning";
      render();
      return;
    }
    state.voiceStatus =
      event.error === "no-speech"
        ? "No speech detected yet · keep speaking or stop and retry"
        : "Live recognition interrupted · reconnecting";
    state.voiceTone = event.error === "no-speech" ? "neutral" : "warning";
    const status = document.querySelector(".recorder small");
    if (status) {
      status.textContent = state.voiceStatus;
      status.className = state.voiceTone;
    }
  };

  liveRecognition.onend = () => {
    liveRecognition = null;
    if (!liveRecognitionActive || !state.recording) return;
    liveRecognitionRestartTimer = window.setTimeout(() => {
      liveRecognitionRestartTimer = null;
      startLiveRecognitionCycle();
    }, 200);
  };

  try {
    liveRecognition.start();
  } catch {
    liveRecognition = null;
  }
}

async function transcribeRecording(blob, browserTranscript = "") {
  if (!state.openAIConfigured && !state.geminiConfigured) {
    state.chatInput = browserTranscript || state.chatInput;
    state.voiceStatus = state.chatInput
      ? "Transcript ready · browser live recognition"
      : liveHeardAudio
        ? "Speech detected, but no text returned · stop and try once more"
        : "No microphone sound detected · check the selected input device";
    state.voiceTone = state.chatInput ? "success" : "warning";
    render();
    return;
  }

  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm" },
      body: blob,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || data.error || `Transcription returned ${response.status}`);
    }
    state.chatInput = String(data.text || "").trim() || browserTranscript;
    state.voiceStatus = state.chatInput
      ? `Transcript ready · ${data.provider} · ${data.model}`
      : "The transcription service returned an empty transcript";
    state.voiceTone = state.chatInput ? "success" : "warning";
  } catch (error) {
    state.chatInput = browserTranscript || state.chatInput;
    state.voiceStatus = state.chatInput
      ? "Transcript ready · browser recognition (server check unavailable)"
      : `AI transcription unavailable · ${error.message}`;
    state.voiceTone = state.chatInput ? "success" : "warning";
  } finally {
    render();
  }
}

async function startVoiceInput() {
  if (!canVoiceInput) {
    state.voiceStatus = "Voice input is not supported here. Try Chrome or Safari.";
    state.voiceTone = "warning";
    render();
    return;
  }

  if (state.recording) {
    stopVoiceInput();
    return;
  }

  try {
    state.recording = true;
    liveBaseTranscript = state.chatInput.trim();
    liveFinalTranscript = "";
    liveHeardAudio = false;
    liveRecognitionActive = Boolean(SpeechRecognition);
    if (liveRecognitionActive) startLiveRecognitionCycle();

    if (canRecordAudio && (state.openAIConfigured || state.geminiConfigured)) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      mediaRecorder = preferredType
        ? new MediaRecorder(mediaStream, { mimeType: preferredType })
        : new MediaRecorder(mediaStream);
      recordedAudioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size) recordedAudioChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const browserTranscript = state.chatInput.trim();
        const blob = new Blob(recordedAudioChunks, {
          type: mediaRecorder?.mimeType || preferredType || "audio/webm",
        });
        mediaStream?.getTracks().forEach((track) => track.stop());
        mediaStream = null;
        mediaRecorder = null;
        recordedAudioChunks = [];
        void transcribeRecording(blob, browserTranscript);
      };
      mediaRecorder.start(500);
    }

    state.voiceStatus = SpeechRecognition
      ? "Listening · speak naturally, then click again to stop"
      : state.openAIConfigured || state.geminiConfigured
        ? "Recording continuously · click again to stop"
        : "A model API key is required for voice input in this browser";
    state.voiceTone = "success";
  } catch (error) {
    if (!SpeechRecognition) {
      state.recording = false;
      liveRecognitionActive = false;
      state.voiceStatus = `Microphone unavailable · ${error.message}`;
      state.voiceTone = "warning";
    } else {
      state.voiceStatus = "Live transcript active · audio recording is unavailable";
      state.voiceTone = "success";
    }
  }
  render();
}

async function refreshOpenAIStatus() {
  state.llmStatus = "Checking OpenAI configuration...";
  state.llmStatusTone = "neutral";
  render();

  try {
    const response = await fetch("/api/ai/routing-config");
    if (!response.ok) {
      throw new Error(`Router config returned ${response.status}`);
    }
    const data = await response.json();
    const models = [
      data.modelEnv?.OPENAI_TEXT_MODEL_MID,
      data.modelEnv?.OPENAI_TEXT_MODEL_MINI,
      data.modelEnv?.OPENAI_TEXT_MODEL_STRONG,
      data.modelEnv?.GEMINI_TEXT_MODEL_MID,
      data.modelEnv?.GEMINI_TEXT_MODEL_MINI,
      data.modelEnv?.GEMINI_TEXT_MODEL_STRONG,
    ].filter(Boolean);
    state.availableModels = Array.from(new Set([...models, ...defaultModels]));
    if (!state.availableModels.includes(state.selectedModel)) {
      state.selectedModel = data.modelEnv?.OPENAI_TEXT_MODEL_MID || defaultModels[0];
    }
    state.openAIConfigured = Boolean(data.openAIConfigured);
    state.geminiConfigured = Boolean(data.providers?.gemini);
    state.preferredProvider = state.openAIConfigured ? "openai" : state.geminiConfigured ? "gemini" : "openai";
    state.llmStatus = state.openAIConfigured
      ? "OpenAI API key configured · GPT routing active"
      : state.geminiConfigured
        ? "Gemini API key configured · free-tier routing active"
        : "No model API key is configured on the server";
    state.llmStatusTone = state.openAIConfigured || state.geminiConfigured ? "success" : "warning";
  } catch (error) {
    state.availableModels = [...defaultModels];
    state.selectedModel = defaultModels[0];
    state.preferredProvider = "openai";
    state.openAIConfigured = false;
    state.geminiConfigured = false;
    state.llmStatus = "Model router unavailable · start the SpeakLoop server";
    state.llmStatusTone = "warning";
  }

  render();
}

function updateCorrectionMessage(correctionId, updates) {
  state.chatMessages = state.chatMessages.map((message) =>
    message.correctionId === correctionId ? { ...message, ...updates } : message,
  );
}

function updateSessionError(correctionId, updates) {
  state.sessionErrors = state.sessionErrors.map((error) =>
    error.id === correctionId ? { ...error, ...updates } : error,
  );
}

function createCorrectionCard(coach, original) {
  const correctionId = `correction_${Date.now()}`;
  const correction = {
    correctionId,
    coach,
    original,
    practiceGoal: 1,
    practiceCount: 0,
    repeatTarget: coach.correctedSentence,
  };
  state.pendingCorrection = correction;
  state.practicePhase = "repeat";
  state.sessionErrors = [
    {
      id: correctionId,
      type: coach.errorType,
      level: "Live correction",
      original,
      issue: coach.explanation,
      standard: coach.correctedSentence,
      simple: coach.simpleSpokenVersion,
      pattern: coach.advancedExpression || "Complete the repeat before continuing.",
      status: repeatStatusLabel("not_repeated"),
    },
    ...state.sessionErrors,
  ].slice(0, 12);
  state.chatMessages = [
    ...state.chatMessages,
    {
      role: "assistant",
      kind: "correction",
      correctionId,
      original,
      coach,
      repeatStatus: "not_repeated",
      practiceGoal: 1,
      practiceCount: 0,
      content: coachMessageContent(coach),
    },
  ];
}

function continueConversation(coach, repeatPassed = false) {
  state.practicePhase = "answer";
  state.pendingCorrection = null;
  state.chatMessages = [
    ...state.chatMessages,
    {
      role: "assistant",
      kind: "continuation",
      coach,
      followUp: coach.followUpQuestion,
      repeatPassed,
      content: coachMessageContent(coach),
    },
  ];
  if (state.voiceEnabled && coach.followUpQuestion) {
    void speakText(coach.followUpQuestion);
  }
}

function beginRepeat(messageIndex, practiceGoal = 1) {
  const message = state.chatMessages[Number(messageIndex)];
  if (!message?.coach || !message.correctionId) return;
  const practiceCount = practiceGoal > 1 ? 0 : Number(message.practiceCount || 0);
  state.pendingCorrection = {
    correctionId: message.correctionId,
    coach: message.coach,
    original: message.original,
    practiceGoal,
    practiceCount,
    repeatTarget: message.coach.correctedSentence,
  };
  state.practicePhase = "repeat";
  state.chatInput = "";
  state.voiceStatus = "Ready to repeat · tap the microphone, then stop it manually when finished";
  state.voiceTone = "neutral";
  updateCorrectionMessage(message.correctionId, {
    practiceGoal,
    practiceCount,
    repeatStatus: "not_repeated",
  });
  updateSessionError(message.correctionId, { status: repeatStatusLabel("not_repeated") });
  render();
  document.querySelector("[data-chat-input]")?.focus();
}

function skipRepeat(messageIndex) {
  const message = state.chatMessages[Number(messageIndex)];
  if (!message?.coach || !message.correctionId) return;
  updateCorrectionMessage(message.correctionId, { repeatStatus: "skipped" });
  updateSessionError(message.correctionId, { status: repeatStatusLabel("skipped") });
  state.voiceStatus = "Repeat skipped · continuing the conversation";
  state.voiceTone = "neutral";
  continueConversation(message.coach, false);
  render();
}

function processRepeat(text) {
  const pending = state.pendingCorrection;
  if (!pending) {
    state.practicePhase = "answer";
    return false;
  }

  const displayContent = formatSpokenTranscript(text);
  state.chatMessages = [...state.chatMessages, { role: "user", content: text, displayContent }];
  state.chatInput = "";
  const score = repeatAccuracy(
    text,
    pending.repeatTarget || pending.coach.correctedSentence,
  );
  const passed = score >= 0.78;

  if (!passed) {
    const retryTarget =
      pending.coach.simpleSpokenVersion || pending.coach.correctedSentence;
    state.pendingCorrection = { ...pending, repeatTarget: retryTarget };
    updateCorrectionMessage(pending.correctionId, {
      repeatStatus: "repeated_with_errors",
      practiceCount: pending.practiceCount,
    });
    updateSessionError(pending.correctionId, {
      status: repeatStatusLabel("repeated_with_errors"),
    });
    state.chatMessages = [
      ...state.chatMessages,
      {
        role: "assistant",
        kind: "repeat-feedback",
        success: false,
        content: `Try the simple version: ${retryTarget} Say it again.`,
      },
    ];
    state.voiceStatus = "Repeat needs another try · the conversation is still paused";
    state.voiceTone = "warning";
    render();
    if (state.voiceEnabled) {
      void speakText(`${retryTarget} Say it again.`);
    }
    return true;
  }

  const practiceCount = pending.practiceCount + 1;
  const completed = practiceCount >= pending.practiceGoal;
  updateCorrectionMessage(pending.correctionId, {
    repeatStatus: completed ? "repeated_successfully" : "not_repeated",
    practiceCount,
  });

  if (!completed) {
    state.pendingCorrection = { ...pending, practiceCount };
    state.chatMessages = [
      ...state.chatMessages,
      {
        role: "assistant",
        kind: "repeat-feedback",
        success: true,
        content: `Good. ${practiceCount} of ${pending.practiceGoal} complete. Say it again.`,
      },
    ];
    state.voiceStatus = `${practiceCount} of ${pending.practiceGoal} repetitions complete`;
    state.voiceTone = "success";
    render();
    if (state.voiceEnabled) {
      void speakText(`${pending.coach.correctedSentence} Say it again.`);
    }
    return true;
  }

  updateSessionError(pending.correctionId, {
    status: repeatStatusLabel("repeated_successfully"),
  });
  state.chatMessages = [
    ...state.chatMessages,
    {
      role: "assistant",
      kind: "repeat-feedback",
      success: true,
      content:
        pending.practiceGoal > 1
          ? `Good. All ${pending.practiceGoal} repetitions are complete.`
          : `Good. Your repeat matched ${Math.round(score * 100)}%.`,
    },
  ];
  state.voiceStatus = "Repeat passed · the conversation can continue";
  state.voiceTone = "success";
  continueConversation(pending.coach, true);
  render();
  return true;
}

async function sendChatMessage() {
  const text = state.chatInput.trim();
  if (!text || state.chatLoading) return;

  if (state.practicePhase === "repeat" && processRepeat(text)) {
    return;
  }

  const displayContent = formatSpokenTranscript(text);
  state.chatMessages = [...state.chatMessages, { role: "user", content: text, displayContent }];
  void recordUsedVocabulary(text);
  state.chatInput = "";
  state.chatLoading = true;
  state.llmStatus = `Calling OpenAI · ${state.selectedModel}...`;
  state.llmStatusTone = "neutral";
  render();

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskType: state.taskType,
        userPlan: state.userPlan,
        preferredProvider: state.preferredProvider,
        preferredModel: state.selectedModel,
        text,
        messages: [
          { role: "system", content: coachSystemPrompt(state.correctionMode) },
          ...state.chatMessages.map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          })),
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(
        detail.errorMessage ||
          detail.detail ||
          detail.error ||
          `OpenAI route returned ${response.status}`,
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errorMessage || "OpenAI request failed");
    }
    const reply = data.result || "The model router returned no text. Try another task or provider.";
    const coach = normalizeCoachResult(reply, text);
    state.lastRouteResult = data;
    state.modelCallLogs = [data.log, ...state.modelCallLogs].filter(Boolean).slice(0, 8);
    state.llmStatus = `${data.provider} · ${data.model}${data.fallbackUsed ? " · fallback" : ""}`;
    state.llmStatusTone = data.fallbackUsed ? "warning" : "success";
    if (coach.needsRepeat) {
      createCorrectionCard(coach, text);
      if (state.voiceEnabled) {
        void speakText(`${coach.correctedSentence} Now repeat it.`);
      }
    } else {
      continueConversation(coach);
    }
  } catch (error) {
    const failure = String(error.message || "");
    const isMissingKey = /No model provider is configured|OPENAI_API_KEY|GEMINI_API_KEY/.test(failure);
    const isOutOfCredit = /insufficient_quota|credit_balance_exhausted|no credits remaining|exceeded your current quota/i.test(failure);
    const providerMessage = isMissingKey
      ? "No model is connected yet. Add OPENAI_API_KEY — or GEMINI_API_KEY for the free tier — to the local .env file, restart SpeakLoop, then try again."
      : isOutOfCredit
        ? "Both providers are out of credit. Top up the OpenAI account, or add a GEMINI_API_KEY from Google AI Studio, which is free."
        : `The coaching request could not run: ${failure}`;
    state.chatMessages = [
      ...state.chatMessages,
      {
        role: "assistant",
        kind: "provider-error",
        content: providerMessage,
      },
    ];
    state.llmStatus = isMissingKey
      ? "No model provider configured on the server"
      : isOutOfCredit
        ? "Out of credit on every configured provider"
        : `Provider unavailable · ${failure}`;
    state.llmStatusTone = "warning";
    state.practicePhase = "answer";
    state.pendingCorrection = null;
  }

  state.chatLoading = false;
  render();
}

async function loadVocabularyCards() {
  if (!isHttpPreview) {
    state.vocabularyCards = fallbackVocabularyCards();
    state.vocabularyLoading = false;
    render();
    return;
  }
  try {
    const response = await fetch("/api/vocabulary");
    if (!response.ok) throw new Error(`Vocabulary API returned ${response.status}`);
    const data = await response.json();
    state.vocabularyCards = data.cards || [];
  } catch {
    state.vocabularyCards = fallbackVocabularyCards();
  }
  state.vocabularyLoading = false;
  render();
  if (state.focusedCardId) {
    document.querySelector(`#card-${CSS.escape(state.focusedCardId)}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
  void translatePendingCards();
}

// --- Live translation of saved cards --------------------------------------
// A card is saved the moment it is captured, before GPT has seen it. These
// helpers fill in the Chinese meaning, pronunciation and usage as soon as the
// card reaches the app, and expose a retry when the call fails.

function needsTranslation(card) {
  if (!card || card.id.startsWith("demo_")) return false;
  return card.enhanced !== true;
}

async function translateVocabularyCard(cardId, { rerender = true } = {}) {
  if (!isHttpPreview || state.translatingCardIds.includes(cardId)) return;
  state.translatingCardIds = [...state.translatingCardIds, cardId];
  state.translationErrors = { ...state.translationErrors, [cardId]: "" };
  if (rerender) render();

  try {
    const response = await fetch("/api/vocabulary/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Translation failed (${response.status})`);
    }
    state.vocabularyCards = state.vocabularyCards.map((card) =>
      card.id === cardId ? { ...card, ...data.card } : card,
    );
  } catch (error) {
    state.translationErrors = { ...state.translationErrors, [cardId]: error.message };
  } finally {
    state.translatingCardIds = state.translatingCardIds.filter((id) => id !== cardId);
    if (rerender) render();
  }
}

async function translatePendingCards() {
  const pending = state.vocabularyCards.filter(
    (card) => needsTranslation(card) && !state.translationErrors[card.id],
  );
  // Sequential so a freshly captured batch does not fire a burst of requests.
  for (const card of pending.slice(0, 8)) {
    await translateVocabularyCard(card.id, { rerender: false });
  }
  if (pending.length) render();
}

async function enhanceVocabularyCard(cardId) {
  try {
    const response = await fetch("/api/vocabulary/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
    if (!response.ok) return;
    const data = await response.json();
    if (!data.card) return;
    state.vocabularyCards = state.vocabularyCards.map((card) =>
      card.id === data.card.id ? data.card : card,
    );
    render();
  } catch {
    // The captured card remains available with heuristic content.
  }
}

async function captureVocabulary(payload) {
  if (!isHttpPreview || state.captureSaving) return null;
  state.captureSaving = true;
  render();
  try {
    const response = await fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        userId: "local_user",
        sourceType: payload.sourceType || "manual",
        captureMethod: payload.captureMethod || "manual",
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Capture failed");
    state.vocabularyCards = [
      data.card,
      ...state.vocabularyCards.filter((card) => card.id !== data.card.id),
    ];
    state.captureSaving = false;
    state.captureOpen = false;
    state.captureDraft = {
      expression: "",
      contextSentence: "",
      sourceTitle: "",
      privateMode: false,
    };
    state.captureToast = {
      message: data.message,
      expression: data.expression,
      cardId: data.duplicate ? "" : data.cardId,
    };
    state.focusedCardId = data.cardId;
    render();
    if (!data.duplicate) {
      void enhanceVocabularyCard(data.cardId);
    }
    return data.card;
  } catch (error) {
    state.captureSaving = false;
    state.captureToast = {
      message: "Could not add to SpeakLoop",
      expression: error.message,
      cardId: "",
    };
    render();
    return null;
  }
}

function toggleContextCapture() {
  state.captureListening = !state.captureListening;
  state.activeCaptureMomentId = "";
  if (captureClockTimer) {
    window.clearInterval(captureClockTimer);
    captureClockTimer = null;
  }
  if (state.captureListening) {
    captureClockTimer = window.setInterval(() => {
      state.captureTimeSeconds += 1;
      const clock = document.querySelector("[data-capture-time]");
      if (clock) clock.textContent = formatCaptureClock(state.captureTimeSeconds);
    }, 1000);
  }
  render();
}

async function saveContextCaptureMoment(momentId) {
  const moment = contextCaptureMoments.find((item) => item.id === momentId);
  if (!moment || state.savedCaptureMomentIds.includes(momentId)) return;
  const card = await captureVocabulary({
    expression: moment.expression,
    contextSentence: moment.contextSentence,
    sourceTitle: contextCaptureSource.title,
    sourceUrl: contextCaptureSource.url,
    sourceType: "browser_video",
    captureMethod: "context_capture",
    privateMode: false,
  });
  if (!card) return;
  state.savedCaptureMomentIds = [
    momentId,
    ...state.savedCaptureMomentIds.filter((id) => id !== momentId),
  ];
  state.activeCaptureMomentId = "";
  render();
}

async function deleteVocabularyCard(cardId) {
  if (!isHttpPreview || cardId.startsWith("demo_")) return;
  const response = await fetch(`/api/vocabulary/${encodeURIComponent(cardId)}`, {
    method: "DELETE",
  });
  if (!response.ok) return;
  state.vocabularyCards = state.vocabularyCards.filter((card) => card.id !== cardId);
  if (state.captureToast?.cardId === cardId) state.captureToast = null;
  render();
}

function useVocabularyInSpeaking(cardId) {
  const card = state.vocabularyCards.find((item) => item.id === cardId);
  if (!card) return;
  state.practiceTargets = [cardId, ...state.practiceTargets.filter((id) => id !== cardId)].slice(0, 5);
  state.chatInput = `I want to practice using "${card.expression}" naturally. `;
  state.activeTab = "practice";
  render();
  document.querySelector("[data-chat-input]")?.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function recordUsedVocabulary(text) {
  if (!isHttpPreview) return;
  const lower = text.toLowerCase();
  const usedCards = state.vocabularyCards.filter((card) =>
    lower.includes(card.expression.toLowerCase()),
  );
  await Promise.all(
    usedCards.map(async (card) => {
      try {
        const response = await fetch(`/api/vocabulary/${encodeURIComponent(card.id)}/usage`, {
          method: "POST",
        });
        if (!response.ok) return;
        const data = await response.json();
        state.vocabularyCards = state.vocabularyCards.map((item) =>
          item.id === data.card.id ? data.card : item,
        );
      } catch {
        // Usage tracking should never interrupt the speaking conversation.
      }
    }),
  );
}

async function openCaptureFromShortcut() {
  state.activeTab = "assets";
  state.captureOpen = true;
  try {
    if (navigator.clipboard?.readText) {
      const clipboardText = (await navigator.clipboard.readText()).trim();
      if (clipboardText && clipboardText.length <= 500) {
        state.captureDraft.expression = clipboardText;
      }
    }
  } catch {
    // Clipboard access is optional; the form remains available for manual paste.
  }
  render();
  document.querySelector("[data-capture-expression]")?.focus();
}

function openPracticeTask({ prompt, draft = "", taskType = "realtime_speaking_coach" }) {
  state.taskType = taskType;
  state.chatInput = draft;
  state.activeTab = "practice";
  state.practicePhase = "answer";
  state.pendingCorrection = null;
  state.chatMessages = [{ role: "assistant", kind: "prompt", content: prompt, followUp: prompt }];
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("[data-chat-input]")?.focus();
}

function startReviewTask(taskId) {
  if (taskId === "sentence-rebuild") {
    openPracticeTask({
      taskType: "immediate_correction",
      prompt:
        "Rebuild this sentence into two short, clear sentences. Keep the original meaning, then send it to the AI coach.",
      draft: errors[0].original,
    });
    return;
  }

  if (taskId === "phrase-review") {
    const phrases = expressions
      .filter(([expression]) => expression.includes(" "))
      .slice(0, 3)
      .map(([expression]) => expression);
    openPracticeTask({
      prompt: `Use at least one target phrase in a natural product-management answer: ${phrases.join(", ")}. What trade-off did you recently have to explain?`,
      draft: `The main trade-off is `,
    });
    return;
  }

  if (taskId === "vocabulary-review") {
    const today = new Date().toISOString().slice(0, 10);
    const dueCard = state.vocabularyCards.find(
      (card) =>
        card.masteryLevel !== "mastered" &&
        (card.masteryLevel === "new" || card.nextReviewDate <= today),
    ) || state.vocabularyCards[0];
    if (dueCard) {
      useVocabularyInSpeaking(dueCard.id);
    } else {
      state.activeTab = "assets";
      state.captureOpen = true;
      render();
      document.querySelector("[data-capture-expression]")?.focus();
    }
    return;
  }

  if (taskId === "reuse-mission") {
    state.reviewPreviewOpen = !state.reviewPreviewOpen;
    render();
  }
}

function startReuseMission() {
  const targets = activeVocabularyTargets();
  if (!targets.length) {
    state.activeTab = "assets";
    state.captureOpen = true;
    render();
    return;
  }
  state.practiceTargets = targets.map((card) => card.id);
  openPracticeTask({
    prompt: `Use at least two of these expressions in your answer: ${targets.map((card) => card.expression).join(", ")}. Describe a difficult product decision you made.`,
    draft: "",
  });
}

function review() {
  const today = new Date().toISOString().slice(0, 10);
  const dueCards = state.vocabularyCards
    .filter(
      (card) =>
        card.masteryLevel !== "mastered" &&
        (card.masteryLevel === "new" || card.nextReviewDate <= today),
    )
    .slice(0, 6);
  return `
    <section class="page-section">
      <div class="review-hero">
        <div>
          <p class="eyebrow">Daily review</p>
          <h1>Don’t learn more before you fix what broke yesterday.</h1>
        </div>
        ${progressRing(58, "Review")}
      </div>
      <div class="task-list">
        ${tasks
          .map(
            (task) => `
              <article class="task-row">
                <div>
                  <span class="task-dot ${statusClass(task.status)}"></span>
                  <strong>${task.title}</strong>
                  <small>${task.meta}</small>
                </div>
                <div class="progress-track"><span style="width:${task.value}%"></span></div>
                <button type="button" data-review-task="${task.id}">
                  ${task.id === "reuse-mission" ? (state.reviewPreviewOpen ? "Close" : "Preview") : "Practice"}
                </button>
              </article>
            `,
          )
          .join("")}
      </div>
      ${
        state.reviewPreviewOpen
          ? `
            <section class="reuse-preview" aria-live="polite">
              <div>
                <span>Conversation reuse mission</span>
                <h2>Use these expressions in one natural answer.</h2>
                <p>Speak for 30–60 seconds. SpeakLoop will detect successful reuse and update mastery.</p>
              </div>
              <div class="reuse-preview-expressions">
                ${
                  activeVocabularyTargets().length
                    ? activeVocabularyTargets()
                        .map((card) => `<span>${escapeHtml(card.expression)}</span>`)
                        .join("")
                    : `<span>Add vocabulary assets first</span>`
                }
              </div>
              <button type="button" class="primary-action" data-start-reuse-mission>
                Start reuse mission
              </button>
            </section>
          `
          : ""
      }
      <section class="vocabulary-review-band">
        <div class="section-heading">
          <p class="eyebrow">Vocabulary review</p>
          <h2>Turn captured words into active speaking.</h2>
          <p>Recognize, recall, make a sentence, shadow the spoken example, then reuse it in conversation.</p>
        </div>
        ${
          dueCards.length
            ? `
              <div class="review-vocabulary-list">
                ${dueCards
                  .map(
                    (card) => `
                      <article>
                        <div>
                          <span>${escapeHtml(card.expressionType)}</span>
                          <strong>${escapeHtml(card.expression)}</strong>
                          <p>${escapeHtml(card.meaningZh || card.meaningEn || "Enhancement pending")}</p>
                        </div>
                        <button type="button" data-use-vocabulary="${escapeHtml(card.id)}">Use in conversation</button>
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `<p class="empty-state">No vocabulary review is due yet. Capture a word from a webpage or add one manually.</p>`
        }
      </section>
    </section>
  `;
}

function errorLibrary() {
  const allErrors = [...state.sessionErrors, ...errors];
  const counts = ERROR_STATUS_CYCLE.reduce((totals, status) => {
    totals[status] = allErrors.filter((error) => errorStatusFor(error) === status).length;
    return totals;
  }, {});
  const filters = ["All", ...ERROR_STATUS_CYCLE];
  const visibleErrors =
    state.errorFilter === "All"
      ? allErrors
      : allErrors.filter((error) => errorStatusFor(error) === state.errorFilter);

  return `
    <section class="page-section">
      <div class="section-heading">
        <p class="eyebrow">Personal error library</p>
        <h1>High-frequency speaking repairs</h1>
        <p>Tap a status chip to move a repair forward: Recurring Error → Practicing → Improved.</p>
      </div>
      <div class="asset-toolbar">
        ${filters
          .map(
            (filter) => `
              <button type="button" class="${state.errorFilter === filter ? "active" : ""}" data-error-filter="${escapeHtml(filter)}">
                ${escapeHtml(filter)}${filter === "All" ? ` (${allErrors.length})` : ` (${counts[filter] || 0})`}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="error-grid">
        ${visibleErrors
          .map(
            (error) => `
              <article class="error-card">
                <div class="card-meta">
                  <span>${escapeHtml(error.type)}</span>
                  <strong>${escapeHtml(error.level)}</strong>
                </div>
                <section class="error-block original">
                  <span>Original Sentence</span>
                  <p>${escapeHtml(error.original)}</p>
                </section>
                <section class="error-block">
                  <span>What went wrong</span>
                  <p>${escapeHtml(error.issue)}</p>
                </section>
                <section class="error-block standard">
                  <span>Standard Version</span>
                  <p>${escapeHtml(error.standard)}</p>
                </section>
                <section class="error-block simple">
                  <span>Simple Spoken Version</span>
                  <p>${escapeHtml(error.simple)}</p>
                </section>
                <section class="error-block pattern">
                  <span>Reusable Pattern</span>
                  <p>${escapeHtml(error.pattern)}</p>
                </section>
                <div class="error-card-actions">
                  <button
                    type="button"
                    class="error-status ${statusClass(errorStatusFor(error))}"
                    data-cycle-error-status="${escapeHtml(error.id)}"
                    aria-label="Change status for this repair. Currently ${escapeHtml(errorStatusFor(error))}."
                  >${escapeHtml(errorStatusFor(error))}</button>
                  <button type="button" data-practice-error="${escapeHtml(error.id)}">Practice this repair</button>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      ${
        visibleErrors.length
          ? ""
          : `<p class="empty-state">No repairs marked "${escapeHtml(state.errorFilter)}" yet.</p>`
      }
    </section>
  `;
}

function translationBlock(card) {
  if (state.translatingCardIds.includes(card.id)) {
    return `<p class="meaning-zh translating">翻译中… · GPT is writing this card</p>`;
  }

  const failure = state.translationErrors[card.id];
  if (failure) {
    return `
      <div class="translation-failed">
        <p>翻译失败：${escapeHtml(failure)}</p>
        <button type="button" data-translate-card="${escapeHtml(card.id)}">Translate again</button>
      </div>
    `;
  }

  if (needsTranslation(card)) {
    return `
      <div class="translation-failed">
        <p>还没有释义。</p>
        <button type="button" data-translate-card="${escapeHtml(card.id)}">Translate now</button>
      </div>
    `;
  }

  return `
    ${card.meaningZh ? `<p class="meaning-zh">${escapeHtml(card.meaningZh)}</p>` : ""}
    ${card.meaningEn ? `<p>${escapeHtml(card.meaningEn)}</p>` : ""}
  `;
}

function assets() {
  const filteredCards = filteredVocabularyCards();
  const capturedCount = capturedCards().length;
  return `
    <section class="page-section">
      <div class="asset-heading-row">
        <div class="section-heading">
          <p class="eyebrow">Global vocabulary capture</p>
          <h1>Every new word becomes a speaking asset.</h1>
          <p>Double-click a word on any web page, hover a video caption, or right-click a selection. Everything you save from the browser lands here with its original sentence.</p>
          ${
            capturedCount
              ? `<p class="capture-inbox-note">${capturedCount} expression${capturedCount === 1 ? "" : "s"} captured from the browser.
                   <button type="button" class="link-button" data-asset-filter="Captured (${capturedCount})">Show only captured</button></p>`
              : `<p class="capture-inbox-note">Nothing captured from the browser yet. Install the extension in <code>apps/browser-extension</code>, then double-click a word on any page.</p>`
          }
        </div>
        <button type="button" class="primary-action" data-add-vocabulary>Add Word / Phrase</button>
      </div>
      ${
        state.captureOpen
          ? `
            <form class="capture-panel" data-capture-form>
              <div class="capture-panel-heading">
                <div>
                  <span>Manual capture</span>
                  <strong>Add to SpeakLoop</strong>
                </div>
                <button type="button" aria-label="Close capture form" data-close-capture>×</button>
              </div>
              <label>
                Expression
                <input
                  name="expression"
                  data-capture-expression
                  maxlength="500"
                  required
                  value="${escapeHtml(state.captureDraft.expression)}"
                  placeholder="grounding, trade-off, or a complete sentence"
                />
              </label>
              <label>
                Context sentence
                <textarea
                  name="contextSentence"
                  data-capture-context
                  rows="3"
                  placeholder="Optional context helps GPT generate a better meaning and example."
                >${escapeHtml(state.captureDraft.contextSentence)}</textarea>
              </label>
              <label>
                Source
                <input
                  name="sourceTitle"
                  data-capture-source
                  value="${escapeHtml(state.captureDraft.sourceTitle)}"
                  placeholder="Article title, PDF, meeting notes..."
                />
              </label>
              <label class="private-mode-control">
                <input type="checkbox" data-private-mode ${state.captureDraft.privateMode ? "checked" : ""} />
                Private Mode: save the expression without context or source
              </label>
              <div class="capture-actions">
                <span>Shortcut: Cmd/Ctrl + Shift + S</span>
                <button type="submit" class="primary-action" ${state.captureSaving ? "disabled" : ""}>
                  ${state.captureSaving ? "Adding..." : "Add to SpeakLoop"}
                </button>
              </div>
            </form>
          `
          : ""
      }
      <div class="asset-toolbar">
        ${vocabularyTags()
          .map(
            (tag) => `
              <button type="button" class="${state.assetFilter === tag ? "active" : ""}" data-asset-filter="${escapeHtml(tag)}">
                ${escapeHtml(tag)}
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="asset-grid">
        ${filteredCards
          .map(
            (card) => `
              <article class="asset-card ${state.focusedCardId === card.id ? "focused" : ""}" id="card-${escapeHtml(card.id)}">
                <div class="asset-card-meta">
                  <span>${escapeHtml(card.expressionType)}</span>
                  <small>${escapeHtml(card.masteryLevel || "new")}</small>
                </div>
                <h2>${escapeHtml(card.expression)}</h2>
                ${
                  card.pronunciation || card.partOfSpeech
                    ? `<p class="asset-pronunciation">${escapeHtml([card.pronunciation, card.partOfSpeech].filter(Boolean).join(" · "))}</p>`
                    : ""
                }
                ${translationBlock(card)}
                ${
                  card.contextSentence
                    ? `<section class="asset-context">
                         <small>Original sentence</small>
                         <p>${escapeHtml(card.contextSentence)}</p>
                       </section>`
                    : ""
                }
                ${
                  card.spokenExample
                    ? `<blockquote>${escapeHtml(card.spokenExample)}</blockquote>`
                    : ""
                }
                <div class="asset-tag-list">
                  ${(card.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
                </div>
                <p class="asset-source">
                  ${isCapturedCard(card) ? `<span class="source-chip">${escapeHtml(captureSourceLabel(card))}</span>` : "Source:"}
                  ${
                    safeHttpUrl(card.sourceUrl)
                      ? `<a href="${escapeHtml(safeHttpUrl(card.sourceUrl))}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel(card))}</a>`
                      : escapeHtml(sourceLabel(card))
                  }
                </p>
                <div class="asset-card-actions">
                  <button type="button" data-listen-vocabulary="${escapeHtml(card.id)}">Listen</button>
                  <button type="button" data-use-vocabulary="${escapeHtml(card.id)}">Use in speaking</button>
                  ${card.id.startsWith("demo_") ? "" : `<button type="button" class="danger-action" data-delete-vocabulary="${escapeHtml(card.id)}">Delete</button>`}
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      ${
        state.vocabularyLoading
          ? `<p class="empty-state">Loading vocabulary cards...</p>`
          : !filteredCards.length
            ? `<p class="empty-state">No expressions here yet. Add one manually or use the browser extension.</p>`
          : ""
      }
    </section>
  `;
}

function weeklyReport() {
  const aiReview = state.aiReview;
  return `
    <section class="page-section">
      <div class="section-heading">
        <p class="eyebrow">Weekly report</p>
        <h1>You fixed 18 speaking errors this week.</h1>
        <p>Your ideas are becoming easier to express because your sentence structures are becoming more stable.</p>
      </div>
      <div class="report-grid">
        ${metrics
          .map(
            ([label, value, detail]) => `
              <article class="metric-card">
                <span class="metric-label">${label}</span>
                <strong>${value}</strong>
                <p>${detail}</p>
              </article>
            `,
          )
          .join("")}
      </div>
      <article class="wide-card remaining">
        <h2>Top remaining problem</h2>
        <p>
          Long Chinese logic is still being translated into a single English sentence. Next week’s mission should
          force shorter clauses, clearer contrast, and active reuse of “X happens because Y, not because Z.”
        </p>
      </article>
      <article class="wide-card ai-review-card">
        <div>
          <p class="eyebrow">Next-day plan</p>
          <h2>Generate tomorrow's speaking plan</h2>
          <p>SpeakLoop sends the completed session to the mini GPT route and turns it into tomorrow's repair tasks. Live coaching stays on the faster route.</p>
        </div>
        <button type="button" class="primary-action" data-generate-ai-review ${state.aiReviewLoading ? "disabled" : ""}>
          ${state.aiReviewLoading ? "Generating..." : "Generate AI review"}
        </button>
        ${
          state.aiReviewError
            ? `<p class="empty-state">${escapeHtml(state.aiReviewError)}</p>`
            : ""
        }
        ${
          aiReview
            ? `
              <div class="ai-review-result" aria-live="polite">
                <span>${escapeHtml(aiReview.provider)} · ${escapeHtml(aiReview.model)} · ${Number(aiReview.latencyMs || 0)}ms</span>
                <h3>${escapeHtml(aiReview.review.summary)}</h3>
                <p><strong>Top issue:</strong> ${escapeHtml(aiReview.review.topIssue)}</p>
                <ol>
                  ${aiReview.review.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
                </ol>
                <p><strong>Tomorrow:</strong> ${escapeHtml(aiReview.review.practicePrompt)}</p>
              </div>
            `
            : ""
        }
      </article>
    </section>
  `;
}

async function generateAIReview() {
  if (!isHttpPreview || state.aiReviewLoading) return;
  state.aiReviewLoading = true;
  state.aiReviewError = "";
  render();

  const capturedSession = state.sessionErrors.length
    ? state.sessionErrors
        .map((item) => `Learner: ${item.original}\nCoach correction: ${item.standard || item.simple}`)
        .join("\n\n")
    : `Learner: I think our team underestimate how much time it need to deploy AI reliably.
Coach correction: I think our team underestimates how much time it takes to deploy AI reliably.

Learner: The main risk is users trust the output too much because it sounds confidently.
Coach correction: The main risk is that users trust the output too much because it sounds confident.`;

  try {
    const response = await fetch("/api/review/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: capturedSession, userPlan: state.userPlan }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.detail || data.errorMessage || data.error || "AI review is unavailable");
    }
    state.aiReview = data;
  } catch (error) {
    state.aiReviewError = error.message;
  } finally {
    state.aiReviewLoading = false;
    render();
  }
}

function render() {
  const screens = {
    dashboard,
    loop: loopMap,
    practice,
    review,
    errors: errorLibrary,
    assets,
    report: weeklyReport,
  };

  app.innerHTML = shell(screens[state.activeTab]());

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      state.activeTab = button.dataset.tab;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  const generateAIReviewButton = document.querySelector("[data-generate-ai-review]");
  if (generateAIReviewButton) {
    generateAIReviewButton.addEventListener("click", () => {
      void generateAIReview();
    });
  }

  document.querySelectorAll("[data-correction-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.correctionMode = button.dataset.correctionMode;
      state.llmStatus = `${button.textContent.trim()} correction mode selected`;
      state.llmStatusTone = "neutral";
      render();
    });
  });

  const contextCaptureToggle = document.querySelector("[data-toggle-context-capture]");
  if (contextCaptureToggle) {
    contextCaptureToggle.addEventListener("click", toggleContextCapture);
  }

  document.querySelectorAll("[data-open-capture-moment]").forEach((button) => {
    button.addEventListener("click", () => {
      const momentId = button.dataset.openCaptureMoment;
      state.activeCaptureMomentId = state.activeCaptureMomentId === momentId ? "" : momentId;
      render();
    });
  });

  document.querySelectorAll("[data-speak-capture-moment]").forEach((button) => {
    button.addEventListener("click", () => {
      const moment = contextCaptureMoments.find(
        (item) => item.id === button.dataset.speakCaptureMoment,
      );
      if (moment) void speakText(moment.expression);
    });
  });

  document.querySelectorAll("[data-save-capture-moment]").forEach((button) => {
    button.addEventListener("click", () => {
      void saveContextCaptureMoment(button.dataset.saveCaptureMoment);
    });
  });

  document.querySelectorAll("[data-practice-capture]").forEach((button) => {
    button.addEventListener("click", () => {
      useVocabularyInSpeaking(button.dataset.practiceCapture);
    });
  });

  document.querySelectorAll("[data-review-task]").forEach((button) => {
    button.addEventListener("click", () => {
      startReviewTask(button.dataset.reviewTask);
    });
  });

  document.querySelectorAll("[data-cycle-error-status]").forEach((button) => {
    button.addEventListener("click", () => {
      cycleErrorStatus(button.dataset.cycleErrorStatus);
    });
  });

  document.querySelectorAll("[data-practice-error]").forEach((button) => {
    button.addEventListener("click", () => {
      practiceErrorRepair(button.dataset.practiceError);
    });
  });

  document.querySelectorAll("[data-error-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.errorFilter = button.dataset.errorFilter;
      render();
    });
  });

  const startReuseMissionButton = document.querySelector("[data-start-reuse-mission]");
  if (startReuseMissionButton) {
    startReuseMissionButton.addEventListener("click", startReuseMission);
  }

  const addVocabularyButton = document.querySelector("[data-add-vocabulary]");
  if (addVocabularyButton) {
    addVocabularyButton.addEventListener("click", () => {
      state.captureOpen = true;
      render();
      document.querySelector("[data-capture-expression]")?.focus();
    });
  }

  const closeCaptureButton = document.querySelector("[data-close-capture]");
  if (closeCaptureButton) {
    closeCaptureButton.addEventListener("click", () => {
      state.captureOpen = false;
      render();
    });
  }

  const captureExpression = document.querySelector("[data-capture-expression]");
  if (captureExpression) {
    captureExpression.addEventListener("input", (event) => {
      state.captureDraft.expression = event.target.value;
    });
  }

  const captureContext = document.querySelector("[data-capture-context]");
  if (captureContext) {
    captureContext.addEventListener("input", (event) => {
      state.captureDraft.contextSentence = event.target.value;
    });
  }

  const captureSource = document.querySelector("[data-capture-source]");
  if (captureSource) {
    captureSource.addEventListener("input", (event) => {
      state.captureDraft.sourceTitle = event.target.value;
    });
  }

  const privateMode = document.querySelector("[data-private-mode]");
  if (privateMode) {
    privateMode.addEventListener("change", (event) => {
      state.captureDraft.privateMode = event.target.checked;
    });
  }

  const captureForm = document.querySelector("[data-capture-form]");
  if (captureForm) {
    captureForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void captureVocabulary({
        ...state.captureDraft,
        sourceType: "manual",
        captureMethod: "manual",
      });
    });
  }

  document.querySelectorAll("[data-asset-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.assetFilter = button.dataset.assetFilter;
      render();
    });
  });

  const openCapturedButton = document.querySelector("[data-open-captured]");
  if (openCapturedButton) {
    openCapturedButton.addEventListener("click", () => {
      const captured = capturedCards().length;
      state.activeTab = "assets";
      state.assetFilter = captured ? `Captured (${captured})` : "All";
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.querySelectorAll("[data-translate-card]").forEach((button) => {
    button.addEventListener("click", () => {
      void translateVocabularyCard(button.dataset.translateCard);
    });
  });

  document.querySelectorAll("[data-listen-vocabulary]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = state.vocabularyCards.find((item) => item.id === button.dataset.listenVocabulary)
        || fallbackVocabularyCards().find((item) => item.id === button.dataset.listenVocabulary);
      speakText(card?.spokenExample || card?.expression);
    });
  });

  document.querySelectorAll("[data-use-vocabulary]").forEach((button) => {
    button.addEventListener("click", () => {
      useVocabularyInSpeaking(button.dataset.useVocabulary);
    });
  });

  document.querySelectorAll("[data-delete-vocabulary]").forEach((button) => {
    button.addEventListener("click", () => {
      void deleteVocabularyCard(button.dataset.deleteVocabulary);
    });
  });

  document.querySelectorAll("[data-practice-expression]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = state.vocabularyCards.find((item) => item.id === button.dataset.practiceExpression);
      if (!card) return;
      state.chatInput = `${state.chatInput}${state.chatInput ? " " : ""}${card.expression}`;
      render();
      document.querySelector("[data-chat-input]")?.focus();
    });
  });

  const viewCapturedButton = document.querySelector("[data-view-captured]");
  if (viewCapturedButton) {
    viewCapturedButton.addEventListener("click", () => {
      state.activeTab = "assets";
      state.focusedCardId = state.captureToast?.cardId || state.focusedCardId;
      state.captureToast = null;
      render();
      if (state.focusedCardId) {
        document.querySelector(`#card-${CSS.escape(state.focusedCardId)}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  }

  const undoCaptureButton = document.querySelector("[data-undo-capture]");
  if (undoCaptureButton) {
    undoCaptureButton.addEventListener("click", () => {
      if (state.captureToast?.cardId) {
        void deleteVocabularyCard(state.captureToast.cardId);
      }
    });
  }

  const recordButton = document.querySelector("[data-record]");
  if (recordButton) {
    recordButton.addEventListener("click", startVoiceInput);
  }

  const modelSelect = document.querySelector("[data-model-select]");
  if (modelSelect) {
    modelSelect.addEventListener("change", (event) => {
      state.selectedModel = event.target.value;
      state.preferredProvider = "openai";
      state.llmStatus = `Selected ${state.selectedModel}`;
      state.llmStatusTone = "neutral";
      render();
    });
  }

  const planSelect = document.querySelector("[data-plan-select]");
  if (planSelect) {
    planSelect.addEventListener("change", (event) => {
      state.userPlan = event.target.value;
      state.lastRouteResult = null;
      state.llmStatus = `Plan set to ${state.userPlan}`;
      state.llmStatusTone = "neutral";
      render();
    });
  }

  const taskTypeSelect = document.querySelector("[data-task-type]");
  if (taskTypeSelect) {
    taskTypeSelect.addEventListener("change", (event) => {
      state.taskType = event.target.value;
      state.lastRouteResult = null;
      state.llmStatus = `Task set to ${state.taskType}`;
      state.llmStatusTone = "neutral";
      render();
    });
  }

  const providerSelect = document.querySelector("[data-provider-select]");
  if (providerSelect) {
    providerSelect.value = "openai";
  }

  const refreshModelsButton = document.querySelector("[data-refresh-models]");
  if (refreshModelsButton) {
    refreshModelsButton.addEventListener("click", refreshOpenAIStatus);
  }

  const autoReadToggle = document.querySelector("[data-auto-read]");
  if (autoReadToggle) {
    autoReadToggle.addEventListener("change", (event) => {
      state.voiceEnabled = event.target.checked;
      if (!state.voiceEnabled) stopSpeechOutput();
      render();
    });
  }

  const voiceSelect = document.querySelector("[data-voice-select]");
  if (voiceSelect) {
    voiceSelect.addEventListener("change", (event) => {
      state.selectedVoiceURI = event.target.value;
      stopSpeechOutput();
      render();
    });
  }

  const readLastButton = document.querySelector("[data-read-last]");
  if (readLastButton) {
    readLastButton.addEventListener("click", () => {
      speakText(lastAssistantFollowUp());
    });
  }

  document.querySelectorAll("[data-speak-follow-up]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = state.chatMessages[Number(button.dataset.speakFollowUp)];
      speakText(message?.followUp || extractFollowUp(message?.content));
    });
  });

  document.querySelectorAll("[data-speak-correction]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = state.chatMessages[Number(button.dataset.speakCorrection)];
      if (message?.coach?.correctedSentence) {
        void speakText(`${message.coach.correctedSentence} Now repeat it.`);
      }
    });
  });

  document.querySelectorAll("[data-start-repeat]").forEach((button) => {
    button.addEventListener("click", () => {
      beginRepeat(button.dataset.startRepeat, 1);
    });
  });

  document.querySelectorAll("[data-skip-repeat]").forEach((button) => {
    button.addEventListener("click", () => {
      skipRepeat(button.dataset.skipRepeat);
    });
  });

  document.querySelectorAll("[data-practice-three]").forEach((button) => {
    button.addEventListener("click", () => {
      beginRepeat(button.dataset.practiceThree, 3);
    });
  });

  const stopVoiceButton = document.querySelector("[data-stop-voice]");
  if (stopVoiceButton) {
    stopVoiceButton.addEventListener("click", () => {
      stopSpeechOutput();
    });
  }

  const customModelInput = document.querySelector("[data-custom-model]");
  if (customModelInput) {
    customModelInput.addEventListener("input", (event) => {
      state.customModel = event.target.value;
    });
  }

  const useCustomModelButton = document.querySelector("[data-use-custom-model]");
  if (useCustomModelButton) {
    useCustomModelButton.addEventListener("click", () => {
      const model = state.customModel.trim();
      if (!model) return;
      state.selectedModel = model;
      state.preferredProvider = "openai";
      state.availableModels = Array.from(new Set([model, ...state.availableModels]));
      state.llmStatus = `Selected custom model ${model}`;
      state.llmStatusTone = "neutral";
      render();
    });
  }

  const chatInput = document.querySelector("[data-chat-input]");
  if (chatInput) {
    chatInput.addEventListener("input", (event) => {
      state.chatInput = event.target.value;
    });
    chatInput.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
      }
    });
  }

  const seedButton = document.querySelector("[data-seed-answer]");
  if (seedButton) {
    seedButton.addEventListener("click", () => {
      state.chatInput =
        state.practicePhase === "repeat" && state.pendingCorrection
          ? state.pendingCorrection.coach.correctedSentence
          : "Hallucination is risky because users may trust fluent output as verified facts, especially in high-stakes product decisions.";
      render();
      document.querySelector("[data-chat-input]")?.focus();
    });
  }

  const chatForm = document.querySelector("[data-chat-form]");
  if (chatForm) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendChatMessage();
    });
  }
}

render();
void loadVocabularyCards();
if (isHttpPreview) {
  void refreshOpenAIStatus();
}

window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "s") {
    event.preventDefault();
    void openCaptureFromShortcut();
  }
});
