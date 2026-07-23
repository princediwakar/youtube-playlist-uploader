import type { BlogPost } from './index'

export const trainAiBrandVoice: BlogPost = {
  slug: 'train-ai-brand-voice',
  title: 'How to Train AI to Sound Like Your Unique Brand Voice in Video Descriptions',
  description:
    'Most AI-generated descriptions sound generic because they are generic. Here is how to create prompts and reference libraries that make the AI write like you — every time.',
  date: '2026-06-14',
  category: 'AI in Content Creation',
  readingTime: '11 min read',
  published: true,
  coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  author: {
    name: 'Prince Diwakar',
    bio: 'Founder of YouTube Playlist Uploader. Helping creators automate their workflow and scale their channels without burning out.',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  },
  content: `
A creator friend tested an [AI description generator](/blog/generating-seo-descriptions). The grammar was perfect. The keywords were solid. And he couldn't use a single word of it. It sounded like a corporate marketing team wrote it, not a guy who calls his audience "nerds" in every intro.

AI isn't bad at writing. It just writes in a generic default voice. If your channel has actual personality, the default AI output will always suck. You don't need to quit using AI. You just need to teach it to sound like you.

## The Default Problem

AI trains on millions of boring corporate documents. Unless you tell it otherwise, it averages them all out and gives you a neutral, robotic tone. 

Test it right now. Tell an AI to write a YouTube title. It will spit out something formal, wordy, and totally void of personality. If your channel is super corporate, that's fine. But if you're funny, sarcastic, or super technical, it's going to miss entirely.

## Voice Capture: The Setup

You have to give the AI reference material. 

Grab ten of your best YouTube descriptions. If you don't have good descriptions, grab your video scripts. The AI needs to see your patterns.

Look at your examples and break down your voice:

**Vocabulary.** Do you use heavy jargon or keep it simple? What weird words do you use constantly? 

**Sentence structure.** Do you write short, punchy sentences? Huge paragraphs? Count how many sentences you usually put in a paragraph.

**Humor.** Are you sarcastic? Self-deprecating? If you're funny, you have to tell the AI exactly *how* you're funny.

**Punctuation.** Do you use tons of em-dashes? Capitalize random words? These tiny details make it sound like you.

**Personality.** Do you talk to the viewer like a student or a peer? Are you super opinionated? 

Write all this into one tight paragraph:

"My voice is direct and practical. I use heavy jargon and never explain it. I address the viewer as a peer. I use extremely short paragraphs. Never use the words 'dive into' or 'explore.'"

Put this paragraph in every single prompt you use.

## The Reference Library Approach

Don't rewrite your voice paragraph every time. Build a reference document with your best descriptions and your voice rules. 

When you prompt the AI, just say:

"Write a description for 'How to Fix a Stripped Screw' using the exact style guide in [reference document]. Assume the viewer is smart. Be direct."

If your AI tool has custom instructions or brand profiles, lock this in once and never touch it again. 

## Tone Parsing

If you want to get really specific, define your tone with numbers:

**Formality:** 1 (casual) to 5 (corporate). YouTube is mostly 1 or 2.
**Detail:** 1 (vague) to 5 (insane detail). Tutorials are 4 or 5.
**Energy:** 1 (chill) to 5 (screaming). Vlogs are 5.
**Humor:** 0 (none) to 3 (lots).

Give the AI these numbers in the prompt. "Formality: 1, Energy: 2, Humor: 1." It changes the output massively.

## Templates with Variables

If you use the same structure for every video, just build a template:

"Hi [audience], today we're covering [topic]. You'll learn [outcome 1] and [outcome 2]. We start with [section 1]."

The AI just fills in the brackets. It sounds exactly like you because you wrote the actual structure.

## Iterative Refinement

You won't get it right on the first try. Generate a description, read it, and yell at the AI about what's wrong.

"Too formal. Change 'utilize' to 'use.' Make the paragraphs way shorter. Add a sarcastic joke about Apple."

Keep tweaking. It gets better every time.

## The Limit

AI will never 100% sound like you. It doesn't know your inside jokes or your personal stories. 

But you don't need it to be perfect. You just need the first draft to be a 90% match. Fixing a 90% draft takes 30 seconds. Over 100 videos, you save 8 hours of typing. That's [how AI is changing the game for creators](/blog/ai-changing-game-creators). 

Let the AI do the heavy lifting. You add the final 10% of magic.
`.trim(),
}
