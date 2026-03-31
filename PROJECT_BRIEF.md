# GymBro — AI-Powered Real-Time Fitness Coach

## Project Summary

GymBro is a mobile fitness coaching application that uses **Google's Gemini 2.5 Flash Native Audio Live API** to create a real-time, voice-interactive running companion. Unlike traditional fitness apps that display dashboards and metrics, GymBro's primary interface is a natural voice conversation — the AI acts as a running buddy jogging beside you, providing coaching, navigation, and casual conversation through bidirectional audio streaming.

Built as a solo project for the **Google AI Hackathon** (Gemini Live Agent theme), the app demonstrates advanced integration of Gemini's multimodal capabilities, Google Maps Platform APIs, and device sensors within a React Native mobile application.

**GitHub:** https://github.com/bhaveshgupta01/GybBuddy  
**Stitch Design:** https://stitch.withgoogle.com/projects/708063407586643500

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────┐
│              React Native (Expo SDK 54)          │
│                                                  │
│  ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Map View │ │Stats Panel│ │  Voice Orb UI  │  │
│  └────┬─────┘ └─────┬─────┘ └───────┬────────┘  │
│       │             │               │            │
│  ┌────┴─────────────┴───────────────┴────────┐   │
│  │          Custom React Hooks Layer          │   │
│  │  useRunTracker · useVoiceChat · useCoaching│   │
│  └────┬─────────────┬───────────────┬────────┘   │
│       │             │               │            │
│  ┌────┴──┐  ┌───────┴──────┐  ┌─────┴────────┐  │
│  │ GPS & │  │ Gemini Live  │  │Google Maps   │  │
│  │Sensors│  │  WebSocket   │  │ APIs         │  │
│  └───────┘  └──────┬───────┘  └──────────────┘  │
└─────────────────────┼────────────────────────────┘
                      │ WSS (bidirectional audio)
                      ▼
        ┌─────────────────────────┐
        │  Gemini 2.5 Flash       │
        │  Native Audio Latest    │
        │  + Function Calling     │
        │  + Voice Activity Det.  │
        │  + Tonal Awareness      │
        └─────────────────────────┘
```

### Core Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React Native 0.81 + Expo SDK 54 | Cross-platform mobile app |
| **Navigation** | Expo Router v6 | File-based routing with tabs |
| **AI/Voice** | Gemini 2.5 Flash Native Audio (Live API) | Real-time bidirectional voice conversation |
| **AI/Text** | Gemini 2.5 Flash (REST) | Text fallback + context updates |
| **Maps** | Google Maps SDK + Directions + Places API | Route generation, navigation, POI search |
| **Location** | expo-location | GPS tracking, geofencing |
| **Sensors** | expo-sensors | Pedometer, accelerometer (treadmill detection) |
| **Audio** | expo-av | Microphone recording (PCM 16kHz) + audio playback |
| **Storage** | AsyncStorage | Run history, user profile persistence |
| **Backend** | Firebase (Auth, Firestore) | User accounts, cloud data sync |
| **Cloud** | Google Cloud Platform | API hosting, billing, credentials |
| **Testing** | Jest + ts-jest | 65 unit tests across 5 suites |

---

## Key Technical Implementations

### 1. Gemini Live API — Bidirectional Audio Streaming

The centerpiece of the application. Establishes a persistent WebSocket connection to Google's Generative AI service for real-time voice interaction.

**Connection Protocol:**
- WebSocket endpoint: `wss://generativelanguage.googleapis.com/ws/.../BidiGenerateContent`
- Authentication via API key query parameter
- Setup message configures model, voice, system instruction, and function declarations
- Server confirms with `setupComplete` before accepting audio/text input

**Audio Pipeline:**
- **Input:** Microphone → PCM 16kHz mono 16-bit → chunked recording (2-second clips) → base64 encoded → WebSocket
- **Output:** WebSocket → base64 PCM 24kHz → WAV header construction → expo-av playback
- **Transcription:** Both `inputAudioTranscription` and `outputAudioTranscription` enabled for UI display

**Voice Personalization:**
Four distinct character voices mapped to Gemini's prebuilt voice models:
- Coach Drill → Orus (deep, commanding)
- Chill Charlie → Aoede (warm, smooth)
- Hype Queen → Zephyr (bright, energetic)
- Sensei → Puck (calm, measured)

**Dual-Mode Architecture:**
- Primary: WebSocket Live API for voice-to-voice with tonal awareness
- Fallback: REST API (gemini-2.5-flash) + expo-speech TTS for text interactions
- `waitForSetup()` with 8-second timeout ensures Live API is prioritized

### 2. Agentic Function Calling (10 Custom Tools)

Gemini autonomously decides which tools to call based on conversation context — no hardcoded trigger logic.

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `get_current_stats` | Pace, distance, time, cadence, calories | GPS + pedometer |
| `get_route_info` | Next turn, distance remaining, ETA | Google Directions |
| `get_split_times` | Per-km pace breakdown | Run tracker |
| `find_nearby_places` | Cafes, restrooms, water, stores | Google Places API |
| `get_weather` | Temperature, conditions, forecast | Open-Meteo API |
| `web_search` | News, scores, trivia, any query | Web search |
| `get_location_context` | Neighborhood, landmarks | Reverse geocoding |
| `generate_route` | Shape/mood-based route creation | Directions + waypoint math |
| `get_training_plan` | Daily workout schedule | Firestore |
| `get_achievements` | Badges, XP, streak status | AsyncStorage |

**Tool Call Flow:**
1. Gemini sends `toolCall` with function name + args via WebSocket
2. Client executes the tool handler, gathering real-time device/API data
3. Client sends `toolResponse` back via WebSocket
4. Gemini incorporates the data into its voice response

### 3. Smart Environment Detection

**Gym Proximity Detection:**
- On app launch, queries Google Places API for gyms within 200m radius
- If detected, auto-prompts "Treadmill vs Outdoor" with gym name
- Adapts coaching mode, UI layout, and system prompt accordingly

**Treadmill Auto-Detection:**
- Monitors pedometer (accelerometer) + GPS simultaneously
- If step count increases but GPS position remains stationary (within 10m over 15 samples), auto-switches to treadmill mode
- Coaching adapts: incline suggestions, interval training, no navigation
- Auto-detects transition back to outdoor if GPS starts moving

**Weather-Aware Suggestions:**
- Fetches conditions via Open-Meteo API on app open
- Adjusts suggestions: rain → indoor workout, hot → hydration reminders, morning → "perfect conditions"

### 4. Creative Route Generation

**Shape Routes (Heart, Star, Circle):**
- Parametric equations generate waypoint coordinates for geometric shapes
- Heart: 16-point parametric curve `(16sin³t, 13cos t - 5cos 2t - ...)`
- Star: alternating inner/outer radius vertices
- Waypoints scaled to requested distance, centered on user's GPS position
- Passed to Google Directions API for walkable route snapping

**Route Preparation Flow:**
- Home screen → **Prepare Screen** (generates route, shows map preview with distance/turns/ETA) → Run Screen
- "Skip" option for free running without a planned route
- Pre-generated route serialized and passed via navigation params

**Off-Route Detection + Voice Rerouting:**
- During active run, continuously calculates minimum distance from runner to nearest polyline point
- If >50m off-route, Gemini proactively asks via voice: "Looks like you went off route. Want me to reroute?"

### 5. Proactive AI Coaching System

The coaching hook (`useCoaching`) runs on a 15-second interval, checking for conditions that warrant unprompted voice responses:

- **Km milestones:** Celebrates each kilometer with split time analysis
- **Pace drift:** Alerts if >10% deviation from target for sustained period
- **Treadmill intervals:** Suggests speed/incline changes every 5 minutes
- **Context updates:** Pushes current stats to Gemini every 60 seconds so it stays informed

All coaching goes through the Live API — Gemini decides whether the data warrants a voice comment or silence.

### 6. AI-Generated Runner Persona

Post-run, Gemini generates a unique identity for the user:
- Creative title (e.g., "The Dawn Strider", "Iron Gazelle")
- One-line motivational description
- Representative emoji avatar
- Accent color

Generated via structured JSON prompt to Gemini 2.5 Flash, based on total runs, distance, pace, streak, and preferred running time. Refreshable after each run.

---

## Design System: "The Ethereal Minimalist"

Designed in Google Stitch, implementing a wellness-inspired aesthetic that differentiates from typical dark/bold fitness apps:

- **Light canvas:** Ice-white (#F4F7F9) with atmospheric gradients
- **Glassmorphism:** Cards at 45% white opacity with blur effect
- **Sage green primary:** Gradient from #A8D5C2 → #8BAF8E
- **Terracotta accent:** #D4917A → #C4785A for energy/warmth
- **No pure black:** Slate #2C3E4A as the darkest color
- **No borders:** Depth via tonal background shifts only
- **24px default radius:** Consistent soft, rounded feel
- **Floating tab bar:** Pill-shaped, translucent, with sage active indicator
- **Light map style:** Custom Google Maps styling matching the ethereal theme

---

## Application Features

### Run Experience
- Real-time GPS tracking with pace, distance, duration, cadence, calories, elevation gain
- Live Google Map with route polyline overlay (planned = dashed, completed = solid)
- Voice Orb UI with animated states (idle, listening, thinking, speaking)
- Countdown timer before run start
- Pause/resume/finish controls
- Automatic run saving to device storage

### Home Screen
- Time-aware greeting with weather context
- Smart gym detection with treadmill/outdoor toggle
- Character selection (4 AI personalities)
- Target pace input
- Selectable route chips (5K Loop, Heart Shape, Scenic, Surprise Me)

### Social (Pack)
- QR code generation for friend invitations (react-native-qrcode-svg)
- Weekly leaderboard table
- Pack statistics (members, total distance, weekly runs)
- Group challenges with progress tracking

### History
- Weekly summary (runs, distance, minutes)
- Day-of-week activity dots
- Individual run cards with distance, time, pace, calories

### Profile
- AI-generated persona with Gemini (title + description + emoji)
- Running statistics (total runs, distance, streak, level)
- Achievement system (First Steps, 5K Club, Heart Artist, Early Bird)

---

## Testing

**65 unit tests across 5 test suites**, all passing:

| Suite | Tests | Coverage |
|-------|-------|----------|
| `pace.test.ts` | 17 | Speed conversion, pace formatting, duration/distance formatting, pace zones, calories, cadence |
| `distance.test.ts` | 13 | Haversine formula, GPS distance totals, stationary detection, bearing calculation, elevation gain |
| `maps.test.ts` | 6 | Shape waypoint generation (heart/star/circle), scaling, geographic spread |
| `characters.test.ts` | 14 | Character data integrity, all 12 character×mode prompt combinations |
| `theme.test.ts` | 7 | Design system validation (light background, no black, sage primary, glass cards, 24px radius) |

---

## Google Cloud Integration

| Service | Usage |
|---------|-------|
| **Gemini API** | Live bidirectional audio + REST text generation + persona generation |
| **Maps SDK** | In-app map rendering with custom styling |
| **Directions API** | Route generation, turn-by-turn navigation data |
| **Places API** | Nearby gym detection, POI search (cafes, restrooms, water) |
| **Firebase** | Authentication, Cloud Firestore for user data |
| **Cloud billing** | Managed via gcloud CLI, linked to trial credits |

---

## Project Metrics

- **Codebase:** ~8,000 lines of TypeScript across 30+ files
- **Architecture:** Services layer (5) + Hooks layer (3) + Components (5) + Screens (7) + Constants (3) + Utils (2) + Tests (5)
- **APIs integrated:** 6 Google APIs + 1 weather API
- **AI models used:** Gemini 2.5 Flash (text), Gemini 2.5 Flash Native Audio (voice)
- **Function tools:** 10 custom tool declarations for agentic behavior
- **Character configs:** 4 personalities × 3 sport modes = 12 unique prompt combinations
- **Test coverage:** 65 tests, 5 suites, all passing

---

## Skills Demonstrated

- **AI/ML Integration:** Gemini Live API (WebSocket), function calling, structured prompting, multi-modal I/O
- **Mobile Development:** React Native, Expo SDK 54, native APIs (GPS, accelerometer, microphone)
- **Real-Time Systems:** WebSocket management, audio streaming pipeline, concurrent state management
- **API Design:** RESTful integration, Google Cloud Platform, OAuth/API key management via gcloud CLI
- **Geospatial Computing:** Haversine distance, GPS smoothing, parametric shape generation, route polyline math
- **UI/UX Design:** Custom design system, glassmorphism, responsive layouts, animation (Reanimated)
- **Audio Engineering:** PCM recording, WAV file construction, sample rate management (16kHz input → 24kHz output)
- **Testing:** Jest unit testing, mock configuration, utility function validation
- **DevOps:** Git workflow, CI-ready test suite, environment variable management, Google Cloud billing setup
