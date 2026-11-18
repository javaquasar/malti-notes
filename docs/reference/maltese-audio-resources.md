# Maltese Audio Resources

## Text-to-speech with `edge-tts`

**Homonyms and Synonyms → Listen for the clue** includes four short clips with synthetic Maltese speech. The exact voice used for these clips is unknown. Select **Play audio**, use the context to work out the word’s meaning, then open **Read transcript** to check the sentence and its English translation. [Listen for the clue](https://javaquasar.github.io/malti-notes/homonyms_synonyms.html#listening)

To make your own audio, open PowerShell in the folder where you want to save the MP3. `edge-tts` uses Microsoft Edge’s online text-to-speech service. [edge-tts documentation](https://github.com/rany2/edge-tts)

1. Install the package and list the available Maltese voices.

   ```powershell
   py -m pip install edge-tts
   py -m edge_tts --list-voices | Select-String 'mt-MT'
   ```

2. Generate an MP3. This example uses `mt-MT-GraceNeural`. To use `mt-MT-JosephNeural`, pass that name to `--voice`. [Microsoft voice list](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts#text-to-speech)

   ```powershell
   py -m edge_tts --voice mt-MT-GraceNeural --text 'Pawlu daq is-soppa.' --write-media '.\daq-is-soppa.mp3'
   ```

3. Open `daq-is-soppa.mp3`. To create a slower version, add `--rate=-15%` to the command and give the output file a different name. [edge-tts speed settings](https://github.com/rany2/edge-tts#changing-rate-volume-and-pitch)

## Google FLEURS recordings

In **B3 Revision → Listen for a weekday**, select **Play phrase** and try to identify the day. Open **Check and read the phrase** to check your answer. The exercise uses `nhar it-Tlieta`, which means “on Tuesday”. [Weekday listening exercise](https://javaquasar.github.io/malti-notes/b3_revision.html#b3-calendar-audio)

To find other phrases, open the **Dataset Viewer** and select the Maltese subset `mt_mt`. Use the `audio` and `transcription` columns to match the speech to the written text. [Google FLEURS](https://huggingface.co/datasets/google/fleurs)

Download and extract the `mt_mt` archive to get the original WAV. The exercise uses `audio/dev/3205230329642468311.wav`, sentence ID `1530`. The clip spans 3.137 to 4.018625 seconds of the original recording and was amplified by 15 dB. [`mt_mt` archive](https://storage.googleapis.com/xtreme_translations/FLEURS102/mt_mt.tar.gz) · [Recording source and edits](https://github.com/javaquasar/malti-notes/blob/main/docs/analysis/b3-practice.md#calendar-audio-excerpt)

The dataset is available under CC BY 4.0. When publishing an excerpt, credit the creator, identify the source, link to the licence and describe any changes. [Google FLEURS](https://huggingface.co/datasets/google/fleurs) · [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/)

> Google FLEURS, Conneau et al. (2022), `mt_mt`, `dev`, sentence `1530`. The recording was trimmed and amplified. [Source](https://huggingface.co/datasets/google/fleurs) · [Paper](https://arxiv.org/abs/2205.12446) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Route Game sound effects

In the game, open **Game settings** and set **Sound effects** to **On**. Start a route and select the next point on the map to hear the step sound. [Maltese Route Game](https://javaquasar.github.io/malti-notes/route_game.html)

The browser generates the short sound effects using the Web Audio API. [`game-audio.js` source](https://github.com/javaquasar/malti-notes/blob/main/assets/js/game-audio.js) · [W3C Web Audio API](https://www.w3.org/TR/webaudio/)
