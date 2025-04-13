# 📚 Scholar Flow - Chrome Extension

Scholar Flow is a smart, decentralized, and visual content summarizer for researchers, students, and curious minds. It transforms online content into meaningful summaries, tracks your time on websites, and stores everything securely on IPFS.

## 🧩 Problem Statement

In the digital age, users consume a massive amount of online content across blogs, videos, and media platforms. However, organizing, summarizing, and retaining that information remains a challenge. There’s a need for a tool that can:

-   Summarize diverse content types efficiently.
-   Store information securely and accessibly.
-   Help users visualize and track their learning journey.

# Project Architecture

This document outlines the architecture and data flow of our Chrome extension system.

## System Architecture

```
 +------------------------+
 |      Chrome UI         |
 | (Vanilla JavaScript)   |
 +----------+-------------+
            |
            v
 +------------------------+    +---------------------------+
 |   Chrome Extension     | <---> |   Content Analyzer (JS)   |
 +------------------------+       +---------------------------+
            |
            v
 +------------------------+
 |  Python Backend Server |
 | (Uses Gemini API)      |
 +------------------------+
            |
            v
 +------------------------+
 |     IPFS Storage       |
 | (Decentralized Data)   |
 +------------------------+
```

## Component Overview

### Chrome UI (Vanilla JavaScript)

The user interface built with vanilla JavaScript that users interact with directly in their Chrome browser.

### Chrome Extension

The main extension component that integrates with the Chrome browser and coordinates between the UI and backend services.

### Content Analyzer (JavaScript)

JavaScript module responsible for analyzing web content, running within the context of the extension.

### Python Backend Server

Server-side component built with Python that processes data and communicates with the Gemini API for advanced analysis.

### IPFS Storage

Decentralized storage system utilizing IPFS (InterPlanetary File System) for secure and distributed data persistence.

## Data Flow

1. User interacts with the Chrome UI
2. Chrome Extension captures and processes these interactions
3. Content Analyzer examines web page content as needed
4. Data is sent to the Python Backend Server for processing via Gemini API
5. Processed data is stored in IPFS for decentralized access

## Integration Notes

This architecture diagram can be integrated into any Markdown-compatible documentation system. The diagram is created using plain text characters, ensuring compatibility with all Markdown renderers.

## 🛠️ Tech Stack

-   **Frontend**: Vanilla JavaScript (Chrome Extension UI & logic)
-   **Backend**: Python (interacts with Gemini API for summarization)
-   **Storage**: IPFS (for decentralized summary storage)
-   **APIs**: Gemini API (Google AI) for intelligent summarization

## 🚀 Features

-   🔹 **Smart Summarization**Summarizes page content into:

    -   **Summary** (short paragraph)
    -   **Notes** (key points to remember)
    -   **References** (additional reading/resources)

-   🔹 **Content-Agnostic Support**Works on:

    -   Webpages
    -   Blog articles
    -   Videos
    -   Images

-   🔹 **Graph-Based Visualization**Graphically represents all summaries using a **node view**, organized by:

    -   Date
    -   Domain name

-   🔹 **Decentralized Storage**All summaries are stored in **IPFS** to ensure accessibility and ownership.
-   🔹 **Time Tracker**Tracks time spent on specific websites both in the **foreground** and **background**.

## 👥 Team Name : Echo Innovators

### Roles:

-   **\[Prakash Gurung , Safal bhattarai\]** – Frontend Developer (Chrome Extension UI, IPFS integration , Graph visualization, Extension layout )
-   **\[Kiran Raj Dhakal , Subash Rimal\]** – Backend Developer (Python, Gemini API integration , Time tracker, feature validation)

## 1. Clone Repo or Download Zip

![Screenshot of a cloning a repo or downloading the zip](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fi%2F0mepmnsme5n2ladav5mp.png)

Use either technique to get the folder onto your local machine. Use whichever technique fits your workflow and comfort level.

If you clone or fork the repo, you'll only have to git pull every time you want changes. You will still have to manually "refresh" the extension to see the changes, explained later.

## 2. Visit chrome://extensions/ and turn on "Developer mode"

![Screenshot of a turning off developer mode](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fi%2F34fjjva60v7t8wmamwxp.png)

## 3. Click "Load unpacked" button and navivigate to the folder you downloaded from GitHub

![Screenshot of a "load unpacked"](https://cdnblog.webkul.com/blog/wp-content/uploads/2019/07/15065849/4-3.png)

![selecting the unpacked folder](https://cdnblog.webkul.com/blog/wp-content/uploads/2019/07/15065856/5-3.png)

[!NOTE]  
You need to select the folder in which the manifest file exists. In the screenshot, we have selected the installer folder inside Unzipped folder as it is the installer folder for chrome extension.

## 4. The extension will be installed now.

![](https://media.discordapp.net/attachments/1343856680324304896/1360866175416008885/extension_availability.png?ex=67fcace3&is=67fb5b63&hm=1962fb5c9b7fe9035c38f5043d3bba1cbea538265204f0ff7e0b55d97f614dec&=&format=webp&quality=lossless&width=1423&height=800)

# License MIT

MIT License
