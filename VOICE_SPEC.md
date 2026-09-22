# Indicraft Voice Agent Specification

**Version:** 1.0  
**Last Updated:** 2026-09-22  
**Status:** Ready for build  
**Scope:** Website sidebar only (Venmathi gets a mic)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Sarvam Voice APIs](#sarvam-voice-apis)
4. [Voice Flow (End to End)](#voice-flow-end-to-end)
5. [API Route: /api/agent/voice](#api-route-apiagentvoice)
6. [Frontend Changes](#frontend-changes)
7. [Audio Recording (Browser)](#audio-recording-browser)
8. [Audio Playback](#audio-playback)
9. [Language Detection & Routing](#language-detection--routing)
10. [Venmathi Voice Persona](#venmathi-voice-persona)
11. [Error Handling](#error-handling)
12. [File Structure (New & Modified)](#file-structure-new--modified)
13. [Build Phases](#build-phases)
14. [Testing](#testing)
15. [Deferred Items](#deferred-items)

---

## Overview

### What Changes

Venmathi's sidebar chat gains a **mic button**. User holds it, speaks in Tamil/English/Tanglish, releases. Their speech is transcribed, fed through the existing agent loop (same tools, same LLM, same cart/order pipeline), and the response is **spoken back** in Venmathi's voice while also displaying as text + UI blocks.

### What Stays the Same

- All existing text chat works unchanged
- Same agent tools (search, cart, addresses, orders, payment)
- Same Sarvam LLM (sarvam-105b) for reasoning + tool calling
- Same rate limiting, auth, streaming
- Same UI blocks (ProductCarousel, CartCard, etc.) — still rendered visually alongside voice

### Key Properties

| Property | Value |
|---|---|
| **STT Model** | `saaras:v3` (Sarvam Speech-to-Text) |
| **TTS Model** | `bulbul:v3` (Sarvam Text-to-Speech) |
| **STT API** | `POST https://api.sarvam.ai/speech-to-text` |
| **TTS API** | `POST https://api.sarvam.ai/text-to-speech` |
| **Auth Header** | `api-subscription-key: <SARVAM_API_KEY>` (same key as LLM) |
| **Languages** | Tamil (`ta-IN`), English (`en-IN`), Tanglish (auto-detected) |
| **Interaction** | Push-to-talk (tap/hold mic, speak, release) |
| **Max Audio** | 30 seconds per utterance (STT REST API limit) |
| **TTS Speaker** | One female Indian-English voice (see Section 10) |
| **Audio Format** | WebM/Opus (browser → server), WAV (server → browser) |

---

## Architecture

### Current (Text Only)

```
User types message
    │
    ▼
POST /api/agent/chat  { messages[] }
    │
    ▼
Agent loop: Sarvam LLM → tool calls → execute → repeat
    │
    ▼
Return { assistantText, blocks[] }
    │
    ▼
Render text + UI blocks in sidebar
```

### New (Text + Voice)

```
User holds mic → speaks → releases
    │
    ▼
Browser: MediaRecorder captures audio (WebM/Opus)
    │
    ▼
POST /api/agent/voice  { audio: Blob, conversationHistory[] }
    │
    ▼
Server Step 1: Sarvam STT (saaras:v3)
    │  audio → text (auto language detection)
    │
    ▼
Server Step 2: Existing agent loop (SAME as /api/agent/chat)
    │  text → Sarvam LLM → tool calls → execute → response text
    │
    ▼
Server Step 3: Sarvam TTS (bulbul:v3)
    │  response text → base64 audio (WAV)
    │
    ▼
Return { userTranscript, assistantText, assistantAudio, blocks[] }
    │
    ▼
Browser: show text + blocks, auto-play audio
```

### Key Insight

The voice route is a **wrapper** around the existing text agent. It adds STT before and TTS after. The middle (agent loop, tools, DB calls) is identical — imported directly from `lib/agent/loop.ts`.

---

## Sarvam Voice APIs

### Speech-to-Text (STT): saaras:v3

**Endpoint:** `POST https://api.sarvam.ai/speech-to-text`

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File (audio) | Yes | Audio file (WAV, WebM, MP3, OGG, FLAC, etc.) |
| `model` | string | Yes | `saaras:v3` |
| `mode` | string | No | `transcribe` (default), `translate`, `verbatim`, `translit`, `codemix` |
| `language_code` | string | No | Auto-detected if omitted. Options: `ta-IN`, `en-IN`, `hi-IN`, etc. |

**Response:**

```json
{
  "request_id": "...",
  "transcript": "I want to buy a blue saree under 2000 rupees",
  "language_code": "en-IN"
}
```

**Limits:**
- Max 30 seconds per request (REST API)
- Supported formats: WAV, MP3, AAC, AIFF, OGG, OPUS, FLAC, WebM (auto-detected)
- Auto language detection across 22 Indian languages + English

**For Indicraft:**
- Use `mode: "transcribe"` (default) — preserves original language
- Do NOT set `language_code` — let Sarvam auto-detect (handles Tamil/English/Tanglish switching)
- Audio format from browser: WebM/Opus (natively supported)

### Text-to-Speech (TTS): bulbul:v3

**Endpoint:** `POST https://api.sarvam.ai/text-to-speech`

**Request:** `application/json`

```json
{
  "text": "Oru blue saree 2000 rupees ku kidaikum!",
  "target_language_code": "ta-IN",
  "model": "bulbul:v3",
  "speaker": "<chosen_speaker>",
  "speech_sample_rate": 24000,
  "output_audio_codec": "wav"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | Text to speak (max 2500 chars for v3) |
| `target_language_code` | string | Yes | `ta-IN`, `en-IN`, etc. |
| `model` | string | Yes | `bulbul:v3` |
| `speaker` | string | No | Voice ID (30+ options). Default varies by language. |
| `speech_sample_rate` | number | No | 8000–48000 Hz. Default: 24000. |
| `pace` | number | No | 0.5–2.0. Default: 1.0. |
| `output_audio_codec` | string | No | `wav`, `mp3`, `opus`, `flac`, `aac`. Default: `wav`. |

**Response:**

```json
{
  "request_id": "...",
  "audios": [
    "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAA..."
  ]
}
```

- `audios[0]` is base64-encoded audio
- Decode with `Buffer.from(audios[0], 'base64')` on server or `atob()` in browser

**For Indicraft:**
- Use `output_audio_codec: "mp3"` (smaller than WAV, plays everywhere)
- Use `speech_sample_rate: 24000` (good quality, not too large)
- Use `pace: 1.0` (natural speed)
- Handles code-mixed text (Tanglish) natively — no preprocessing needed

---

## Voice Flow (End to End)

### Step-by-Step

```
1. User taps mic button in sidebar
   └─ Browser requests microphone permission (first time only)
   └─ MediaRecorder starts recording (WebM/Opus)
   └─ UI: mic button turns red, pulsing animation, "Listening..." text

2. User speaks (max 30 seconds)
   └─ Timer shows elapsed time
   └─ If 30s reached: auto-stop recording, show warning

3. User releases mic button (or taps again to stop)
   └─ MediaRecorder stops → produces audio Blob
   └─ UI: mic returns to normal, "Processing..." indicator

4. Browser sends POST /api/agent/voice
   └─ Body: FormData { audio: Blob, history: JSON string }
   └─ Headers: Content-Type: multipart/form-data

5. Server: STT
   └─ Forward audio to Sarvam STT (saaras:v3)
   └─ Get back: { transcript, language_code }
   └─ If transcript empty → return error "Couldn't hear you, try again"

6. Server: Agent Loop (REUSED)
   └─ Build messages: system prompt + history + new user message (transcript)
   └─ Run existing agent loop (lib/agent/loop.ts)
   └─ Get back: { assistantText, blocks[] }

7. Server: TTS
   └─ Detect language from STT response or agent response
   └─ Call Sarvam TTS (bulbul:v3) with assistantText
   └─ Get back: base64 audio
   └─ If assistantText > 2500 chars: chunk into parts, TTS each, concatenate

8. Server: Return response
   └─ { userTranscript, assistantText, assistantAudio (base64), blocks[] }

9. Browser: Render
   └─ Add user message (transcript) to chat as a text bubble
   └─ Add assistant message (text + blocks) to chat
   └─ Auto-play assistantAudio
   └─ Show speaker icon on assistant message (tap to replay)
```

### Latency Budget

| Step | Expected Time |
|---|---|
| STT (saaras:v3) | 500ms–1.5s |
| Agent loop (LLM + tools) | 1–3s |
| TTS (bulbul:v3) | 300ms–800ms |
| **Total** | **2–5s** (acceptable for push-to-talk) |

---

## API Route: /api/agent/voice

### New File: `app/api/agent/voice/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transcribeAudio } from "@/lib/agent/stt";
import { synthesizeSpeech } from "@/lib/agent/tts";
import { runAgentLoop } from "@/lib/agent/loop";
import { checkRateLimit } from "@/lib/agent/rateLimit";

export async function POST(req: NextRequest) {
  // 1. Auth check (same as /api/agent/chat)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  // 2. Rate limit (same bucket as chat — voice is more expensive, count as 2)
  const limited = await checkRateLimit(session.user.id, 2);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limited.retryAfter },
      { status: 429 }
    );
  }

  // 3. Parse FormData
  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;
  const historyJson = formData.get("history") as string | null;

  if (!audioFile) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  // Validate audio size (max 5MB)
  if (audioFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large (max 5MB)" }, { status: 400 });
  }

  const history = historyJson ? JSON.parse(historyJson) : [];

  try {
    // 4. STT: audio → text
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const sttResult = await transcribeAudio(audioBuffer, audioFile.type);

    if (!sttResult.transcript || sttResult.transcript.trim() === "") {
      return NextResponse.json({
        error: "empty_transcript",
        message: "Couldn't understand the audio. Please try again.",
      }, { status: 400 });
    }

    // 5. Agent loop: text → response (REUSE existing loop)
    const agentResult = await runAgentLoop({
      userId: session.user.id,
      userMessage: sttResult.transcript,
      history,
    });

    // 6. TTS: response text → audio
    let assistantAudio: string | null = null;
    if (agentResult.assistantText) {
      const ttsResult = await synthesizeSpeech(
        agentResult.assistantText,
        sttResult.languageCode || "en-IN"
      );
      assistantAudio = ttsResult.audioBase64;
    }

    // 7. Return everything
    return NextResponse.json({
      userTranscript: sttResult.transcript,
      detectedLanguage: sttResult.languageCode,
      assistantText: agentResult.assistantText,
      assistantAudio, // base64 MP3
      blocks: agentResult.blocks,
    });

  } catch (error) {
    console.error("Voice agent error:", error);
    return NextResponse.json(
      { error: "Voice processing failed. Try typing instead." },
      { status: 500 }
    );
  }
}
```

---

## Frontend Changes

### Modified Files

#### 1. `components/agent/ChatInput.tsx` — Add mic button

```
Current:
┌─────────────────────────────────────┐
│ Type a message...            [Send] │
└─────────────────────────────────────┘

New:
┌─────────────────────────────────────┐
│ Type a message...       [🎤] [Send] │
└─────────────────────────────────────┘

When recording:
┌─────────────────────────────────────┐
│ 🔴 Listening... (5s)        [Stop]  │
└─────────────────────────────────────┘
```

**Behavior:**
- Tap mic → start recording
- Tap again (or release if holding) → stop recording → send to /api/agent/voice
- Long press → record while held → release to send
- Max 30s → auto-stop
- While recording: red pulsing dot, elapsed timer, "Listening..." text
- While processing: spinner, "Venmathi is thinking..." (same typing indicators)

#### 2. `components/agent/MessageList.tsx` — Add audio playback

Each assistant message that has audio gets a small speaker icon:

```
┌──────────────────────────────────┐
│ 🔊 Venmathi:                     │
│ "Oru blue saree irukku! ₹1,850. │
│  Cart la add pannava?"           │
│  [▶ Play again]                  │
│                                  │
│  [Product Carousel]              │
└──────────────────────────────────┘
```

- Audio auto-plays when response arrives
- "Play again" button to replay
- Visual: small waveform animation while playing

#### 3. `components/agent/AgentSidebar.tsx` — Voice state management

Add state:
```typescript
const [isRecording, setIsRecording] = useState(false);
const [isProcessingVoice, setIsProcessingVoice] = useState(false);
const [voiceEnabled, setVoiceEnabled] = useState(true); // toggle
```

#### 4. New Component: `components/agent/VoiceButton.tsx`

Mic button with recording states:

```typescript
interface VoiceButtonProps {
  onAudioCaptured: (audioBlob: Blob) => void;
  isProcessing: boolean;
  maxDuration?: number; // default 30s
}
```

States:
- **Idle:** Mic icon (gray)
- **Recording:** Red pulsing mic, timer counting up
- **Processing:** Spinner (waiting for STT + agent + TTS)
- **Error:** Red mic with X, tooltip with error message
- **Disabled:** Grayed out mic (no microphone permission)

---

## Audio Recording (Browser)

### `lib/agent/useVoiceRecorder.ts` (React hook)

```typescript
import { useState, useRef, useCallback } from "react";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  duration: number;          // seconds elapsed
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export function useVoiceRecorder(maxDuration = 30): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,        // Mono
          sampleRate: 16000,       // 16kHz (good for STT)
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create MediaRecorder (WebM/Opus — natively supported by Sarvam)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);
      setError(null);

      // Timer: count up, auto-stop at maxDuration
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed++;
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow access.");
      } else {
        setError("Could not access microphone.");
      }
    }
  }, [maxDuration]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob());
        return;
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        // Stop all tracks (release mic)
        recorder.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  return { isRecording, duration, startRecording, stopRecording, error };
}
```

### Browser Compatibility

| Browser | MediaRecorder | WebM/Opus | Works? |
|---|---|---|---|
| Chrome (desktop + Android) | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari 14.1+ | ✅ | ❌ (use audio/mp4) | ✅ with fallback |
| Edge | ✅ | ✅ | ✅ |
| iOS Safari | ✅ (14.5+) | ❌ (use audio/mp4) | ✅ with fallback |

**Safari fallback:** If `audio/webm` not supported, use `audio/mp4` (AAC). Sarvam accepts both.

```typescript
const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  ? "audio/webm;codecs=opus"
  : "audio/mp4";
```

---

## Audio Playback

### Playing TTS Response

```typescript
// lib/agent/useAudioPlayer.ts

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((base64Audio: string, codec = "mp3") => {
    // Create audio from base64
    const audioSrc = `data:audio/${codec};base64,${base64Audio}`;
    const audio = new Audio(audioSrc);

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    // Stop previous audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    audioRef.current = audio;
    audio.play().catch(() => {
      // Auto-play blocked by browser — show play button instead
      setIsPlaying(false);
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return { play, stop, isPlaying };
}
```

### Auto-Play Considerations

- **First interaction:** Browser blocks auto-play until user has interacted with the page. Since user just tapped the mic button, auto-play is allowed.
- **Subsequent messages:** If user switches to text input mid-conversation, don't auto-play TTS responses.
- **Rule:** Auto-play only if the user's last input was voice.

---

## Language Detection & Routing

### How Language Flows

```
User speaks Tamil
    │
    ▼
STT returns: { transcript: "நான் ஒரு saree வேணும்", language_code: "ta-IN" }
    │
    ▼
Agent loop: LLM receives Tamil text, responds in Tamil/Tanglish
    │  (Venmathi's system prompt already handles this)
    │
    ▼
TTS: target_language_code = "ta-IN" (from STT detection)
    │  bulbul:v3 handles code-mixed text natively
    │
    ▼
Audio output: Venmathi speaks in Tamil/Tanglish
```

### Language Code Mapping

```typescript
// lib/agent/tts.ts

function getTTSLanguageCode(sttLanguageCode: string): string {
  // Map STT language codes to TTS language codes
  const mapping: Record<string, string> = {
    "ta-IN": "ta-IN",   // Tamil
    "en-IN": "en-IN",   // English (Indian)
    "en-US": "en-IN",   // English (US) → Indian English
    "hi-IN": "hi-IN",   // Hindi
    // Tanglish: STT may return "ta-IN" or "en-IN" — either works
    // bulbul:v3 handles code-mixed text regardless of language_code
  };
  return mapping[sttLanguageCode] || "en-IN"; // Default to Indian English
}
```

### Tanglish Handling

Sarvam's models handle Tanglish natively:
- **STT (saaras:v3):** Transcribes code-mixed speech correctly (e.g., "I want oru saree" → mixed output)
- **LLM (sarvam-105b):** Already trained for Tanglish responses (Venmathi persona)
- **TTS (bulbul:v3):** Speaks code-mixed text naturally (handles English words in Tamil context)

No special preprocessing needed.

---

## Venmathi Voice Persona

### Speaker Selection

Bulbul v3 offers 30+ speakers. For Venmathi (cheerful 24-year-old woman from Chennai):

**Recommended speakers to test:**

| Speaker ID | Gender | Description |
|---|---|---|
| `meera` | Female | Indian English, warm tone |
| `advika` | Female | Indian English, young voice |
| `amartya` | Female | Professional but friendly |

**How to choose:**
1. Test each speaker with a Tanglish sample: "Hi! Oru blue saree parthingala? ₹1,850 thaan! Cart la add pannava?"
2. Pick the one that sounds most like a cheerful young Chennai woman
3. Set as `VENMATHI_TTS_SPEAKER` in `.env.local`

### TTS Configuration

```typescript
// lib/agent/tts.ts

const VENMATHI_TTS_CONFIG = {
  model: "bulbul:v3",
  speaker: process.env.VENMATHI_TTS_SPEAKER || "meera",
  speech_sample_rate: 24000,
  pace: 1.0,                    // Natural speed
  output_audio_codec: "mp3",    // Smaller than WAV, plays everywhere
};
```

### Text Preprocessing for TTS

Before sending to TTS, clean the assistant's response:

```typescript
function preprocessForTTS(text: string): string {
  // Remove markdown formatting
  let clean = text
    .replace(/\*\*(.*?)\*\*/g, "$1")    // Bold
    .replace(/\*(.*?)\*/g, "$1")         // Italic
    .replace(/`(.*?)`/g, "$1")           // Code
    .replace(/#{1,6}\s/g, "")            // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links

  // Format prices for natural speech
  // "₹1,850" → "1850 rupees"
  clean = clean.replace(/₹([\d,]+)/g, (_, price) => {
    return price.replace(/,/g, "") + " rupees";
  });

  // Trim to 2500 chars (bulbul:v3 limit)
  if (clean.length > 2500) {
    clean = clean.substring(0, 2497) + "...";
  }

  return clean;
}
```

---

## Error Handling

### Error States

| Error | User Sees | Recovery |
|---|---|---|
| **Mic permission denied** | "Please allow microphone access in your browser settings" | Show browser-specific instructions |
| **No speech detected** | "Didn't catch that — try speaking a bit louder" | Mic button returns to idle |
| **STT failed** | "Couldn't process your voice. Try again or type instead" | Show text input |
| **Audio too long** | "Recording stopped at 30 seconds" + auto-send | Process the 30s of audio |
| **Audio too short (<0.5s)** | "That was too short — hold the mic and speak" | Mic button returns to idle |
| **TTS failed** | Show text response only (no audio) | Text always works as fallback |
| **Network error** | "Connection issue — check your internet" | Retry button |
| **Rate limited** | "Too many requests — try again in Xs" | Show countdown |

### Fallback Rule

**Text is ALWAYS the fallback.** If STT fails, show error. If TTS fails, show text response without audio. Voice is an enhancement, not a replacement.

---

## File Structure (New & Modified)

### New Files

```
lib/agent/
├── stt.ts               # Sarvam STT client (transcribeAudio)
├── tts.ts               # Sarvam TTS client (synthesizeSpeech)
├── useVoiceRecorder.ts  # React hook: mic recording
└── useAudioPlayer.ts    # React hook: audio playback

app/api/agent/voice/
└── route.ts             # Voice API route (STT → agent loop → TTS)

components/agent/
├── VoiceButton.tsx      # Mic button component (idle/recording/processing states)
└── AudioPlayback.tsx    # Speaker icon + replay button on messages
```

### Modified Files

```
components/agent/
├── ChatInput.tsx         # Add VoiceButton next to send button
├── MessageList.tsx       # Add AudioPlayback to assistant messages
└── AgentSidebar.tsx      # Add voice state (isRecording, voiceEnabled)

lib/agent/
└── loop.ts               # No changes (reused as-is by voice route)
```

### Environment Variables (New)

```bash
# .env.local (add to existing)
VENMATHI_TTS_SPEAKER=meera    # Or advika, amartya — test and pick
```

No new API keys needed — STT and TTS use the same `SARVAM_API_KEY`.

---

## Build Phases

### Phase 1: STT + TTS Clients (1–2 hours)

**Goal:** Sarvam voice API wrappers, tested via CLI.

**Deliverables:**
- [ ] `lib/agent/stt.ts` — `transcribeAudio(audioBuffer, mimeType) → { transcript, languageCode }`
- [ ] `lib/agent/tts.ts` — `synthesizeSpeech(text, languageCode) → { audioBase64 }`
- [ ] CLI test script: record audio → STT → print transcript → TTS → save audio file
- [ ] Test with Tamil, English, and Tanglish audio samples

**Acceptance Criteria:**
- STT transcribes Tamil audio correctly
- STT transcribes English audio correctly
- STT handles Tanglish (code-mixed) audio
- TTS produces audible, natural-sounding MP3
- TTS handles Tanglish text (e.g., "Cart la add pannava?")

### Phase 2: Voice API Route (1–2 hours)

**Goal:** `/api/agent/voice` endpoint, tested via curl/Postman.

**Deliverables:**
- [ ] `app/api/agent/voice/route.ts` — full pipeline (STT → loop → TTS)
- [ ] Auth check (session required)
- [ ] Rate limiting (voice costs 2x text)
- [ ] Error handling (empty transcript, audio too large, STT/TTS failures)
- [ ] Test: send audio file via curl → get back transcript + response text + audio

**Acceptance Criteria:**
- Send 5s Tamil audio → get Tamil text response + Tamil audio
- Send 5s English audio → get English text response + English audio
- Send >5MB audio → 400 error
- Send empty audio → 400 "Couldn't understand"
- Unauthenticated request → 401

### Phase 3: Mic Button UI (2–3 hours)

**Goal:** Mic button in sidebar with recording states.

**Deliverables:**
- [ ] `lib/agent/useVoiceRecorder.ts` — React hook (start/stop/duration/error)
- [ ] `components/agent/VoiceButton.tsx` — mic button (idle/recording/processing)
- [ ] Modified `ChatInput.tsx` — mic button next to send
- [ ] Safari fallback (audio/mp4 if WebM not supported)
- [ ] Microphone permission handling (first-time prompt, denied state)
- [ ] 30-second timer with auto-stop

**Acceptance Criteria:**
- Tap mic → recording starts (red indicator, timer)
- Tap again → stops, sends audio
- 30s limit → auto-stops
- Permission denied → clear error message
- Works on Chrome, Firefox, Safari, mobile

### Phase 4: Audio Playback + Integration (1–2 hours)

**Goal:** Full voice loop working end-to-end in the sidebar.

**Deliverables:**
- [ ] `lib/agent/useAudioPlayer.ts` — React hook (play/stop/isPlaying)
- [ ] `components/agent/AudioPlayback.tsx` — speaker icon + replay
- [ ] Modified `MessageList.tsx` — audio on assistant messages
- [ ] Auto-play when response arrives (only if user's input was voice)
- [ ] Text always shown alongside audio (never audio-only)

**Acceptance Criteria:**
- Speak Tamil → see transcript + hear Tamil response
- Speak English → see transcript + hear English response
- Speak Tanglish → handles correctly
- TTS fails → text still shows (graceful degradation)
- Tap "Play again" → replays audio
- Switch to text input → no auto-play on next response

### Phase 5: Testing & Polish (1–2 hours)

**Goal:** Full test pass, edge cases, UX polish.

**Deliverables:**
- [ ] Test all 3 languages (Tamil, English, Tanglish) in voice
- [ ] Test product search → add to cart → checkout flow entirely via voice
- [ ] Test mixed mode: voice search → text cart edit → voice checkout
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Error state testing (no mic, bad audio, network loss)
- [ ] Accessibility: screen reader announces recording state
- [ ] Performance: total voice round-trip < 5s

**Acceptance Criteria:**
- Full purchase flow via voice in Tamil
- Full purchase flow via voice in English
- Mixed voice/text flow works
- Mobile browsers work
- All error states handled gracefully
- Round-trip latency < 5s for typical utterances

---

## Testing

### Manual Test Script

```
Test 1: English voice search
1. Open sidebar
2. Tap mic
3. Say: "Show me sarees under two thousand rupees"
4. Release mic
5. Verify: transcript appears, products show, audio plays

Test 2: Tamil voice cart
1. Say: "Blue saree oru add pannu" (Tamil/Tanglish)
2. Verify: item added to cart, audio confirmation in Tamil

Test 3: Mixed mode
1. Voice: "What sarees do you have?"
2. Text: "Add the first one to my cart"
3. Voice: "Show me my cart"
4. Verify: all three work, audio only on voice responses

Test 4: Error handling
1. Deny mic permission → error message shown
2. Say nothing (silence) → "Didn't catch that" error
3. Tap mic and immediately stop (<0.5s) → "Too short" error

Test 5: Mobile
1. Open on phone (Chrome Android / Safari iOS)
2. Tap mic → speak → verify response
3. Check: no layout issues, audio plays, mic works
```

### Language Evaluation (Voice-Specific)

Test 10 utterances per language:

| Language | Sample Utterance | Expected Tool Call |
|---|---|---|
| English | "Find terracotta items" | search_products(query="terracotta") |
| Tamil | "சேலை வேணும்" | search_products(query="saree") |
| Tanglish | "Blue saree oru add pannu cart la" | add_to_cart(productId=...) |
| English | "What's in my cart?" | view_cart() |
| Tamil | "என் cart la enna irukku?" | view_cart() |
| Tanglish | "Remove that saree from cart" | remove_cart_item(productId=...) |
| English | "I want to buy these" | preview_order() |
| Tamil | "வாங்கணும், address solren" | list_addresses() / request_new_address() |
| Tanglish | "Chennai Adyar 600020 address add pannu" | request_new_address(city="Chennai"...) |
| English | "Place my order" | preview_order() → confirm |

**Target:** ≥80% correct tool calls via voice (lower than text target because STT adds noise).

---

## Deferred Items

1. **Continuous listening (always-on mode):** Requires WebSocket streaming STT (`saaras:v3-realtime`), VAD (Voice Activity Detection), and more complex state management. Build after push-to-talk is solid.

2. **Streaming TTS:** Currently waits for full response before speaking. Could stream TTS chunk-by-chunk as the agent generates text. Adds complexity, marginal UX gain for short responses.

3. **Voice in MCP:** MCP users (Claude/ChatGPT) already have their own voice features. No need to add voice to the MCP route.

4. **Voice cloning:** Custom Venmathi voice model. Requires Sarvam enterprise features or custom training. Deferred.

5. **Interrupt/barge-in:** User speaks while Venmathi is still talking (stops current audio, processes new input). Requires real-time streaming architecture. Deferred.

6. **Voice-only mode:** Hide text completely, pure voice UI. Niche use case, can add as a toggle later.

7. **Wake word:** "Hey Venmathi" to activate mic hands-free. Requires always-on audio processing. Privacy/battery concerns. Deferred.
