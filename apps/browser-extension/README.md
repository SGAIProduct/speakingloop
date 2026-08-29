# SpeakingLook Global Capture Extension

1. Start SpeakingLook at `http://127.0.0.1:4173`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select this folder.
5. Reload the extension after updating its files.
6. Open a page with English video captions and hover any caption word to open the Context Card.
7. Use **+ Save Moment** inside the card to save the word together with its complete caption sentence.

Manual text selection is still supported: select English text, right-click, and choose **Add to SpeakingLook**.

The extension observes visible caption DOM only so it can make subtitle words hoverable. It does not read the clipboard, record audio, or send a word to SpeakingLook until the user hovers or saves it.

## Hover Card latency design

- The word, IPA, part of speech, pronunciation, basic Chinese definition, and original sentence render immediately from the bundled dictionary or the in-memory cache.
- New caption sentences preload dictionary entries in batches without calling GPT.
- Context-aware meaning and phrase detection start asynchronously after a 200 ms hover debounce.
- Moving the pointer away cancels the debounce or any in-flight context request.
- Context enrichment is cached by `lemma + context hash`; repeat hovers reuse the cached result.
- Saving a Moment returns immediately after capture and starts full GPT enrichment asynchronously.
