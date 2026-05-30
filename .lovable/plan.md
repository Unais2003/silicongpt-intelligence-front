## Goal
Replace the incorrect OpenAI/ChatGPT mark currently shown for SiliconGPT with the actual `silicongpt-logo.png` already used in the header/navbar.

## Changes

**`src/components/dashboard/ModelLogo.tsx`**
- Import `@/assets/silicongpt-logo.png`.
- Reorder the matchers so `silicon` is checked **before** `gpt` (otherwise "SiliconGPT" falls into the OpenAI branch — this is the current bug).
- For the `silicon` branch, render an `<img>` of the logo sized to `size × size` with `object-contain` inside the existing `Wrap` element (keeps alignment consistent with the SVG marks).
- Leave Gemini, GPT, Qwen, DeepSeek, Llama branches untouched.
- N-gram still returns `null` (no logo).

No other files change.
