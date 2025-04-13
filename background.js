import {
    BACKEND_URL,
    SPECIAL_DOMAINS
} from "./constants.js";

function authenticate(deviceId) {
    fetch(`${BACKEND_URL}/authenticate_or_identify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                hash: deviceId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                chrome.storage.sync.set({
                    access_token: data.access_token
                }, () => {
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


function summarizeInPage(BACKEND_URL, jwt, SPECIAL_DOMAINS) {
    function render_summary(loader, cached) {
        
        loader.innerHTML = "";

        loader.style.cssText = `
    position: fixed;
    top: 0vh;
    right: 0vw;
    width: max(25vw,350px);
    height: 90vh;
    background: linear-gradient(135deg, #1a1a1a, #222);
    color: #e0e0e0;
    padding: 15px;
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
    justify-content: flex-end;
    border: 1px solid #80808033;
    padding: 5px;
  `;

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x MuiBox-root popup-css-10s948j"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
        closeBtn.style.cssText = `
            background: transparent;
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
  `;
        closeBtn.onclick = () => loader.remove();



        const expandBtn = document.createElement("button");
        expandBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize2 MuiBox-root popup-css-10s948j"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" x2="14" y1="3" y2="10"></line><line x1="3" x2="10" y1="21" y2="14"></line></svg>
        `;
        expandBtn.style.cssText = `
            background: transparent;
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
  `;;
        let expanded = false;
        expandBtn.onclick = () => {
            expanded = !expanded;
            loader.style.width = expanded ? "80vw" : "25vw";
        };

        const premiumBtn = document.createElement("button");
        premiumBtn.addEventListener("click", () => {
            window.open("http://localhost:5000", "_blank");
          });
        premiumBtn.className = "recall_ai_premium_button_no_external"
        premiumBtn.id = "watchedDiv";
        premiumBtn.innerText = "💎 Premium"
        premiumBtn.style.cssText = `
    background: linear-gradient(135deg, #ffafcc, #9d4edd);
    color: white;
    font-weight: bold;
    font-family: 'Segoe UI', sans-serif;
    font-size: 14px;
    padding: 10px 18px;
    border: none;
    border-radius: 30px;
    box-shadow: 0 4px 12px rgba(157, 78, 221, 0.4);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  `
        const premium_style = document.createElement("style");
        premium_style.innerHTML = `
      .recall_ai_premium_button_no_external:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(157, 78, 221, 0.6);
      }
      .recall_ai_premium_button_no_external:active {
        transform: scale(0.98);
        box-shadow: 0 2px 6px rgba(157, 78, 221, 0.3);
      }
    `;
        document.head.appendChild(premium_style);

        const app_name = document.createElement("div");
        app_name.innerText = "Echo Me";
        app_name.style.cssText = `
    flex: 1;
    align-self: anchor-center;
    font-weight: bold;
    font-size: 1.8rem;
    padding-left: 0.5rem;
    text-decoration-line: grammar-error;
    `;

        controls.appendChild(app_name);
        controls.appendChild(premiumBtn);
        controls.appendChild(premium_style);
        controls.appendChild(expandBtn);
        controls.appendChild(closeBtn);


        const actionButtons = document.createElement("div");
        actionButtons.style.cssText = `
      position: -webkit-sticky;
      position: sticky;
      bottom: 0px;
      background: #1e1e1eed;
      padding-bottom: 0.5rem;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid rgba(128,128,128,0.2);
      display: flex;
      justify-content: space-between;
      gap: 10px;
  `
        const discradAction = document.createElement("button");
        discradAction.style.cssText = `
    flex: 1;
   background: #444;
   color: white;
   border: none;
   border-radius: 20px;
   padding: 10px;
   cursor: pointer;
  
  `;
        discradAction.innerText = "Discard";
        discradAction.onclick = () => {
            chrome.storage.local.remove(fullUrl, () => {});
            loader.remove();

            fetch(`${BACKEND_URL}/discard`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    of: fullUrl
                })
            });
        }
        const mindAction = document.createElement("button");
        mindAction.style.cssText = `
    flex: 1;
   background: #444;
   color: white;
   border: none;
   border-radius: 20px;
   padding: 10px;
   cursor: pointer;
  
  `;
        mindAction.innerText = "Mind Map"
        mindAction.onclick = ()=>{
            const mapDiv= document.createElement("div");
            mapDiv.className = "recall_ai_mind_graph";
        mapDiv.style.cssText = `
            position: fixed;
            top: 0vh;
            right: 0vw;
            width: 90vw;
            height: 90vh;
            background: linear-gradient(135deg, #1a1a1a, #222);
            color: #e0e0e0;
            padding: 15px;
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
          const title_div  = document.createElement("div");
          title_div.style.cssText =`
    display: flex;
    flex-direction: row;
`;
          const title  = document.createElement("div");
          title.innerText = "Mind Map"; 
          title.style.cssText=`
    flex: 1;
    font-size: 20px;
    font-weight: bold;
`;
          const closeBtn = document.createElement("button");
            closeBtn.innerText = "✖";
            closeBtn.style.cssText = `
                background: transparent;
                color: white;
                border: none;
                font-size: 20px;
                cursor: pointer;
                align-self: end;`;
            closeBtn.onclick = () => mapDiv.remove();
          
          title_div.appendChild(title)
          title_div.appendChild(closeBtn)
          mapDiv.appendChild(title_div)

          //  <canvas id="graph-canvas"></canvas>
          const canvas = document.createElement("canvas");
          canvas.style.cssText=`
            flex: 1;
            border: 1px solid #242222;
          `;
          canvas.id = "recall_ai_graph_canvas";

          const random_div = document.createElement("div")
          random_div.style.cssText = `
            height:0px;
            width:0px;
            display:none;
          `;
          random_div.innerHTML = `
             <div class="container">
        <div class="header">
            <h1>Futuristic Graph Visualization</h1>
            <div class="zoom-controls">
                <button id="zoom-in">Zoom In</button>
                <button id="zoom-out">Zoom Out</button>
                <button id="reset-zoom">Reset</button>
            </div>
        </div>
        </div>

    <div class="modal" id="modal">
        <div class="modal-content">
            <div class="modal-header" id="modal-header">Content ID</div>
            <div class="modal-body" id="modal-body">Details will appear here.</div>
        </div>
        <button class="close-btn" id="close-modal">Close</button>
    </div>

    <div class="tooltip" id="tooltip"></div>
          `;
          mapDiv.appendChild(random_div);

          const whole_day_button = document.createElement("button");
          whole_day_button.className = "recall_ai_whole_day_summary";
          whole_day_button.style.cssText = `            
        width: auto;
        height: 5vh;
        padding:1rem;
        align-self: anchor-center;
          `;
          whole_day_button.innerText = "summarize my day"
          mapDiv.appendChild(canvas);
          mapDiv.appendChild(whole_day_button);
          document.body.appendChild(mapDiv);
        
        }

        actionButtons.appendChild(discradAction);
        actionButtons.appendChild(mindAction);

        loader.appendChild(controls);

        // If there's no cached data, show a skeleton UI
        if (!cached || site_is_disabled) {
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

            loader.appendChild(actionButtons);
            return site_is_disabled ? -1 : 0;
        }

        // --- Below: normal rendering when cached exists ---

        // Title: Summary
        const summaryTitle = document.createElement("h2");
        summaryTitle.innerText = "📄 Summary";
        summaryTitle.style.marginBottom = "0.5rem";
        loader.appendChild(summaryTitle);

        const summaryText = document.createElement("p");
        summaryText.innerText = cached.summary || "No summary available.";
        loader.appendChild(summaryText);

        const notesTitle = document.createElement("h3");
        notesTitle.innerText = "📝 Notes";
        loader.appendChild(notesTitle);

        const notesList = document.createElement("ul");
        (cached.notes || []).forEach(note => {
            const li = document.createElement("li");
            li.innerText = note;
            li.style.cssText = `
    list-style: disc;
    margin-left: 1rem;`;
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

            li.style.cssText = `
    list-style: disc;
    margin-left: 1rem;`;
            li.appendChild(a);
            refList.appendChild(li);
        });
        loader.appendChild(refList);

        const timeBox = document.createElement("div");
        timeBox.style.marginTop = "1rem";
        const active = cached.activeTime ? `${cached.activeTime} sec` : "N/A";
        const background = cached.backgroundTime ? `${cached.backgroundTime} sec` : "N/A";
        timeBox.className = "recall_ai_time_box";
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


        loader.appendChild(actionButtons);

        const target = document.getElementById('watchedDiv');

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    target.classList.add('__oov');
                } else {
                    target.classList.remove('__oov');
                }
            }, {
                threshold: 0.5
            }
        );

        observer.observe(target);
        return 1;
    }

    var text = document.body.innerText;
    const fullUrl = window.location.href;
    const domain = new URL(fullUrl).hostname;
    if (SPECIAL_DOMAINS.includes(domain)) {
        text = fullUrl;
    }
    var __elms = document.querySelectorAll(".quantum-summary-panel");
    if (__elms.length) {
        __elms.forEach(x => x.outerHTML = "");
        return;
    };
    var __elms = document.querySelectorAll(".recall_ai_mind_graph");
    if (__elms.length) {
        __elms.forEach(x => x.outerHTML = "");
        return;
    };

    let site_is_disabled = false;
    // Show loading UI
    const loader = document.createElement("div");
    loader.className = "quantum-summary-panel";
    site_is_disabled = render_summary(loader, null) < 0;

    document.body.appendChild(loader);
    if (site_is_disabled) return;
    chrome.storage.local.get(fullUrl, (data) => {
        const cached = data[fullUrl];

        if (cached && cached.summary && cached.summary.length>0) {
            site_is_disabled = render_summary(loader, cached) < 0;
            return;
        }
        // No cached summary, fetch it
        fetch(`${BACKEND_URL}/summarize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    content: text,
                    url: domain,
                    full: fullUrl
                })
            })
            .then(res => res.json())
            .then(result => {
                function sumAndRound(a, b) {
                    return Math.round((a || 0) + (b || 0));
                }
                console.log(result,cached)
                var newact = sumAndRound(result?result.activeTime:0, cached?cached.activeTime:0);
                var newbckt = sumAndRound(result?result.backgroundTime:0, cached?cached.backgroundTime:0);
                var updated_data = {
                    ...result,
                activeTime:newact,
                backgroundTime: newbckt,
            
                } 
                chrome.storage.local.set({
                    [fullUrl]: updated_data
                });
                chrome.storage.local.get(fullUrl, (data) => {
                    const cached = data[fullUrl];
                    if (cached) {
                        render_summary(loader, cached)
                        return;
                    }
                })
            })
            .catch(err => {
                loader.innerText = "❌ Error summarizing page";
                console.error("Error summarizing:", err);
            });
    });
}



chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['device_id'], (result) => {
        if (!result.device_id) {
            const id = crypto.randomUUID();
            chrome.storage.sync.set({
                device_id: id
            }, () => {
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
        chrome.storage.sync.get("access_token", (result) => {
            const token = result.access_token;
            if (!token) return console.warn("No token found");
            chrome.scripting.executeScript({
                target: {
                    tabId: tab.id
                },
                func: summarizeInPage,
                args: [BACKEND_URL, token, SPECIAL_DOMAINS]
            });

            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "JWT_TOKEN",
                    payload: {api:BACKEND_URL,token:token}
                });
            });
        });
    }
});

