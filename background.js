import {
    BACKEND_URL,SPECIAL_DOMAINS
} from "./constants.js";

function authenticate(deviceId){
  fetch(`${BACKEND_URL}/authenticate_or_identify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ hash: deviceId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.access_token) {
      chrome.storage.sync.set({ access_token: data.access_token }, () => {
        console.log("Token stored.");
      });
    } else {
      console.error("No token received:", data);
    }
  })
  .catch(error => {
    console.error("Auth request failed:", error);
  });
}


chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['device_id'], (result) => {
    if (!result.device_id) {
      const id = crypto.randomUUID();
      chrome.storage.sync.set({ device_id: id }, () => {
        console.log("New synced device_id:", id);
      });

    } else {
      console.log("Restored synced device_id:", result.device_id);
    }
    authenticate(result.device_id);
  });
});


chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Get token first
    chrome.storage.sync.get("access_token", (result) => {
      const token = result.access_token;
      if (!token) return console.warn("No token found");

      // Inject the summarization logic into the tab
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: summarizeInPage,
        args: [BACKEND_URL, token,SPECIAL_DOMAINS]
      });
    });
  }
});


function summarizeInPage(BACKEND_URL, jwt,SPECIAL_DOMAINS) {
    function getImageBeforeSummary(summaryContainer) {
  // Try to get the first image in the body
  const firstImage = document.querySelector('body img');
  
  let imageUrl = '';
  
  // If an image is found, use its source
  if (firstImage) {
    imageUrl = firstImage.src;
  } else {
    // If no image is found, fallback to favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      imageUrl = favicon.href;
    }
  }
  
  // If we have an image URL, create an img element and insert it before the summary
  if (imageUrl) {
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.style.cssText = `
      width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
    `;
    
    if (summaryContainer) {
      summaryContainer.insertAdjacentElement('beforebegin', imageElement);
    }
  }
}


   function render_summary(loader, cached) {
  loader.innerHTML = "";

  loader.style.cssText = `
    position: fixed;
    top: 2vh;
    right: 2vw;
    width: 25vw;
    height: 80vh;
    background: linear-gradient(135deg, #1a1a1a, #222);
    color: #e0e0e0;
    padding: 20px;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    overflow-y: auto;
    z-index: 999999;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
    border-radius: 20px;
    border: 1px solid #333;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(6px);
    transition: all 0.3s ease-in-out;
    scrollbar-width: none;
    -ms-overflow-style: none;
  `;

  loader.style.overflow = "auto";
  loader.classList.add("no-scrollbar");

  const style = document.createElement("style");
  style.innerHTML = `.no-scrollbar::-webkit-scrollbar { display: none; }`;
  document.head.appendChild(style);

  // Common: Close + Expand
  const controls = document.createElement("div");
  controls.style.cssText = `
    display: flex;
    justify-content: space-between;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerText = "✖";
  closeBtn.style.cssText = `
    background: transparent; color: white;
    border: none; font-size: 20px; cursor: pointer;
  `;
  closeBtn.onclick = () => loader.remove();

  const expandBtn = document.createElement("button");
  expandBtn.innerText = "⛶";
  expandBtn.style.cssText = closeBtn.style.cssText;
  let expanded = false;
  expandBtn.onclick = () => {
    expanded = !expanded;
    loader.style.width = expanded ? "80vw" : "25vw";
  };

  controls.appendChild(closeBtn);
  controls.appendChild(expandBtn);
  loader.appendChild(controls);

  // If there's no cached data, show a skeleton UI
  if (!cached) {
    const skeleton = document.createElement("div");
    skeleton.innerHTML = `
      <div style="background:#333;height:20px;width:50%;margin-bottom:15px;border-radius:5px;animation:pulse 1.5s infinite;"></div>
      <div style="background:#333;height:12px;width:90%;margin-bottom:8px;border-radius:5px;animation:pulse 1.5s infinite;"></div>
      <div style="background:#333;height:12px;width:85%;margin-bottom:8px;border-radius:5px;animation:pulse 1.5s infinite;"></div>
      <div style="background:#333;height:12px;width:80%;margin-bottom:8px;border-radius:5px;animation:pulse 1.5s infinite;"></div>
      <div style="background:#333;height:12px;width:60%;margin-bottom:8px;border-radius:5px;animation:pulse 1.5s infinite;"></div>
    `;
    const pulseStyle = document.createElement("style");
    pulseStyle.innerHTML = `
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    `;
    document.head.appendChild(pulseStyle);
    loader.appendChild(skeleton);
    return;
  }

  // --- Below: normal rendering when cached exists ---

  // Title: Summary
  const summaryTitle = document.createElement("h2");
  summaryTitle.innerText = "📄 Summary";
  summaryTitle.style.marginBottom = "0.5rem";
  loader.appendChild(summaryTitle);

  const summaryText = document.createElement("p");
  summaryText.innerText = cached.summary || "No summary available.";
  getImageBeforeSummary(summaryText);
  loader.appendChild(summaryText);

  const notesTitle = document.createElement("h3");
  notesTitle.innerText = "📝 Notes";
  loader.appendChild(notesTitle);

  const notesList = document.createElement("ul");
  (cached.notes || []).forEach(note => {
    const li = document.createElement("li");
    li.innerText = note;
    notesList.appendChild(li);
  });
  loader.appendChild(notesList);

  const refTitle = document.createElement("h3");
  refTitle.innerText = "🔗 References";
  loader.appendChild(refTitle);

  const refList = document.createElement("ul");
  (cached.references || []).forEach(ref => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = ref.link;
    a.target = "_blank";
    a.innerText = ref.name;
    a.style.color = "#4ea1ff";
    li.appendChild(a);
    refList.appendChild(li);
  });
  loader.appendChild(refList);

  const timeBox = document.createElement("div");
  timeBox.style.marginTop = "1rem";
  const active = cached.activeTime ? `${cached.activeTime} sec` : "N/A";
  const background = cached.backgroundTime ? `${cached.backgroundTime} sec` : "N/A";
  timeBox.innerHTML = `
    <h3>⏱ Activity Time</h3>
    <p>🟢 Active: ${active}</p>
    <p>⚫️ Background: ${background}</p>
  `;
  loader.appendChild(timeBox);

  summaryTitle.style.fontSize = "18px";
  notesTitle.style.fontSize = "16px";
  refTitle.style.fontSize = "16px";
  summaryText.style.fontSize = "14px";
  notesList.style.fontSize = "13px";
  refList.style.fontSize = "13px";
  timeBox.style.fontSize = "13px";
}

  var text = document.body.innerText;
  const fullUrl = window.location.href;
  const domain = new URL(fullUrl).hostname;
  if(SPECIAL_DOMAINS.includes(domain)){
    text = fullUrl;
  }
  var __elms =document.querySelectorAll(".quantum-summary-panel"); 
  if(__elms.length){
    __elms.forEach(x=>x.outerHTML="");
    return;
};

  // Show loading UI
  const loader = document.createElement("div");
  loader.className = "quantum-summary-panel";
  render_summary(loader,null);

  document.body.appendChild(loader);
  chrome.storage.local.get(fullUrl, (data) => {
    const cached = data[fullUrl];

    if (cached) {
        render_summary(loader,cached)
      return;
    }
    // No cached summary, fetch it
    fetch(`${BACKEND_URL}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify({ content: text, url: domain, full: fullUrl })
    })
      .then(res => res.json())
      .then(result => {
        chrome.storage.local.set({ [fullUrl]: result });
        chrome.storage.local.get(fullUrl, (data) => {
            const cached = data[fullUrl];
            if (cached) {
                render_summary(loader,cached)
              return;
            }
          }
          )
      }
      )
      .catch(err => {
        loader.innerText = "❌ Error summarizing page";
        console.error("Error summarizing:", err);
      });
  });
}


let activeTabId = null;
let tabStartTime = null;
let tabDomain = null;
let isWindowFocused = true;

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

function updateTime(active = true) {
  if (!tabStartTime || !tabDomain) return;

  const timeSpent = Math.floor((Date.now() - tabStartTime) / 1000);

  chrome.storage.local.get([tabDomain], (res) => {
    const data = res[tabDomain] || {
      summary: "",
      notes: [],
      references: [],
      activeTime: 0,
      backgroundTime: 0
    };

    if (active) data.activeTime += timeSpent;
    else data.backgroundTime += timeSpent;

    chrome.storage.local.set({ [tabDomain]: data });
  });

  tabStartTime = Date.now();
}

// track tab change
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateTime(isWindowFocused); // save old tab time
  activeTabId = activeInfo.tabId;

  const tab = await chrome.tabs.get(activeTabId);
  tabDomain = getDomainFromUrl(tab.url);
  tabStartTime = Date.now();
});

// track tab URL change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    updateTime(isWindowFocused);
    tabDomain = getDomainFromUrl(changeInfo.url);
    tabStartTime = Date.now();
  }
});

// track window focus/blur
chrome.windows.onFocusChanged.addListener((windowId) => {
  const wasFocused = isWindowFocused;
  isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  if (tabStartTime) updateTime(wasFocused);
});
