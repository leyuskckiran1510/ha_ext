document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab || !tab.url) return;

    const domain = new URL(tab.url).hostname;

    chrome.storage.local.get(domain, (res) => {
      const data = res[domain];

      if (!data) {
        document.getElementById("summary").textContent = "No summary available.";
        return;
      }

      // summary
      document.getElementById("summary").textContent = data.summary || "No summary available.";

      // notes
      const notesList = document.getElementById("notes");
      notesList.innerHTML = "";
      (data.notes || []).forEach(note => {
        const li = document.createElement("li");
        li.textContent = note;
        notesList.appendChild(li);
      });

      // references
      const refList = document.getElementById("references");
      refList.innerHTML = "";
      (data.references || []).forEach(ref => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = ref.url;
        link.target = "_blank";
        link.textContent = ref.title;
        li.appendChild(link);
        refList.appendChild(li);
      });

      // times
      document.getElementById("active-time").textContent = formatTime(data.activeTime || 0);
      document.getElementById("background-time").textContent = formatTime(data.backgroundTime || 0);
    });
  });
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}


document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab || !tab.url) return;

    const domain = new URL(tab.url).hostname;

    chrome.storage.local.get(domain, (res) => {
      const data = res[domain];

      if (!data || !data.summary) {
        document.getElementById("summary").textContent = "No summary available.";
        return;
      }

      // Display summary
      document.getElementById("summary").textContent = data.summary;

      // Add other fields like notes, references, etc. if required.
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const domain = new URL(tab.url).hostname;
    chrome.storage.local.get(domain, (data) => {
      const summary = data[domain]?.summary;
      document.getElementById("summary").textContent = summary || "No summary available.";
    });
  });
});
