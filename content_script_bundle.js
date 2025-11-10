// Bundled version - all in one file
console.log("Devpost Auto-Filler: Content Script Laddad.");

// Gemini API function (inline)
async function generateSubmissionContent(projectIdea) {
  const result = await chrome.storage.local.get(['geminiApiKey']);
  const API_KEY = result.geminiApiKey;
  
  if (!API_KEY) {
    throw new Error("API_KEY not found. Please set it in chrome.storage.local");
  }

  const masterPrompt = `Based on the following project idea for the Cloud Run Hackathon, generate a complete project submission.

Project Idea:
---
${projectIdea}
---

Your response MUST be a single, valid JSON object with the following 4 keys and nothing else:
1. "description": A detailed, well-structured project story. Use Markdown for formatting (headings, lists, bold text).
2. "diagram": A Mermaid diagram in "graph LR" format that visualizes the project's architecture on Google Cloud, focusing on Cloud Run.
3. "script": A script for a 3-minute video demo. Format it clearly with scenes or speaker notes.
4. "social": A concise and engaging social media post for platforms like Twitter or LinkedIn to promote the project. This post MUST include the hashtag #CloudRunHackathon.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: masterPrompt }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate content from AI.");
  }
}

function injectButton() {
  const targetHeader = document.querySelector('h1') || document.querySelector('.page-header');
  if (!targetHeader) {
    console.log("Auto-Filler: Kunde inte hitta H1-tagg att fästa knappen på.");
    return;
  }

  if (document.getElementById('auto-fill-button')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'auto-fill-button';
  button.textContent = '🚀 Auto-Fill with AI';
  button.style.backgroundColor = '#673AB7';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '10px 15px';
  button.style.fontSize = '14px';
  button.style.fontWeight = 'bold';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.marginLeft = '20px';

  targetHeader.appendChild(button);
  console.log("Auto-Filler: Knappen injicerad.");

  button.addEventListener('click', handleAutoFill);
}

async function handleAutoFill() {
  const button = document.getElementById('auto-fill-button');
  console.log("Auto-Filler: Knappen klickad.");

  try {
    const storyTextarea = document.querySelector('textarea[name="project[story]"]');
    if (!storyTextarea) {
      alert("Kunde inte hitta 'Project Story'-rutan.");
      return;
    }

    const projectIdea = storyTextarea.value;
    if (projectIdea.length < 10) {
      alert("Skriv minst 10 tecken i 'Project Story' först.");
      return;
    }

    button.textContent = '🧠 Tänker...';
    button.disabled = true;

    const artifacts = await generateSubmissionContent(projectIdea);

    fillField('textarea[name="project[story]"]', artifacts.description);
    fillField('textarea[id*="submission_custom_field_answers_attributes_"][id*="_value"]', artifacts.diagram);
    fillField('input[id*="submission_links_attributes_"][id*="_url"]', artifacts.social);

    console.log("Demo script:", artifacts.script);
    alert("Auto-Fill är klar! Glöm inte att spara.");
  } catch (error) {
    console.error("Auto-Fill Fel:", error);
    alert("Ett fel inträffade: " + error.message);
  } finally {
    button.textContent = '🚀 Auto-Fill with AI';
    button.disabled = false;
  }
}

function fillField(selector, value) {
  const field = document.querySelector(selector);
  if (field) {
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`Auto-Filler: Fyllde i fältet: ${selector}`);
  } else {
    console.warn(`Auto-Filler: Kunde inte hitta fältet: ${selector}`);
  }
}

injectButton();
