// Setup script - kör detta en gång för att sätta API-nyckeln
// Detta körs automatiskt när tillägget installeras

const API_KEY = "AIzaSyCeFz5m_pndy0A4e7Jte1RCnElTvrPzoBo";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ geminiApiKey: API_KEY }, () => {
    console.log("Gemini API key saved to chrome.storage.local");
  });
});
