# Pricing Strategy: YouTube Playlist Uploader

This document outlines the finalized pricing model for the YouTube Playlist Uploader application. Based on the current architecture (single-channel NextAuth session limits) and the goal of capturing high-value users, we are utilizing a two-tier "Locked Grid" model.

## 🏆 The "Locked Grid" V1 Model

### 1. The Free Trial (The Locked Grid)
*   **Limit:** Users can drag-and-drop an **unlimited** number of videos into the app to test the ingestion speed and experience the UI.
*   **The Hook:** The AI metadata engine only processes the **first 3 videos**.
*   **The Paywall:** The rest of the batch is locked in the grid. If they want the other 47 videos in their batch optimized and uploaded, they hit a hard paywall. 
*   **Why this works:** It provides a visceral demonstration of value without cannibalizing paid usage. They see exactly what the tool can do, but to execute their workflow, they must pay.

### 2. Creator Pro (The Core Offering)
*   **Price:** **$49 / year** (or $9 / month)
*   **Limits:** Unlimited uploads, restricted to **1 Connected YouTube Channel**.
*   **Features:** Unlimited AI title/description generation, scheduling features.
*   **Why this works:** For consistent creators, $49/year is a trivial business expense. For others, the $9/month plan acts as an anchor price, making the $49 yearly option look like an absolute steal. 

