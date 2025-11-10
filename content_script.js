// VIKTIGT: Du måste skaffa en API-nyckel och klistra in den i `services/geminiService.ts`
// eller (ännu bättre) be Kiro att läsa den från `chrome.storage.local`.
// För nu, anta att `geminiService.ts` har nyckeln hårdkodad för snabbhet.
// Importera vår guldklimp.
// Notera: Beroende på din byggprocess kan du behöva en `importScripts`-lösning.
// Vi antar att Kiro kan hantera denna TypeScript-import.
import { generateSubmissionContent } from './services/geminiService';
console.log("Devpost Auto-Filler: Content Script Laddad.");
function injectButton() {
    // Leta efter description textarea istället
    const descriptionField = document.querySelector('textarea[name="software[description]"]');
    if (!descriptionField) {
        console.log("Auto-Filler: Kunde inte hitta description-fältet att fästa knappen vid.");
        return;
    }
    // Undvik att injicera knappen flera gånger
    if (document.getElementById('auto-fill-button')) {
        return;
    }

    // Skapa en wrapper för knappen
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.marginBottom = '10px';

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

    buttonContainer.appendChild(button);

    // Försök hitta rätt container och infoga knappen
    const formGroup = descriptionField.closest('.form-group') || descriptionField.closest('div');
    if (formGroup && formGroup.parentElement) {
        formGroup.parentElement.insertBefore(buttonContainer, formGroup.nextSibling);
    } else {
        // Fallback: lägg till efter textarea direkt
        descriptionField.parentElement.insertBefore(buttonContainer, descriptionField.nextSibling);
    }

    console.log("Auto-Filler: Knappen injicerad bredvid formulär.");
    button.addEventListener('click', handleAutoFill);
}
async function handleAutoFill() {
    const button = document.getElementById('auto-fill-button');
    console.log("Auto-Filler: Knappen klickad.");
    try {
        // 1. LÄS idéen
        const storyTextarea = document.querySelector('textarea[name="software[description]"]');
        if (!storyTextarea) {
            alert("Kunde inte hitta 'Project Description'-rutan.");
            return;
        }
        const projectIdea = storyTextarea.value;
        if (projectIdea.length < 10) {
            alert("Skriv minst 10 tecken i 'Project Description' först.");
            return;
        }
        button.textContent = '🧠 Tänker...';
        button.disabled = true;
        // 2. ANROPA API (Guldklimpen)
        // generateSubmissionContent returnerar redan ett JSON-objekt
        const artifacts = await generateSubmissionContent(projectIdea);
        // 4. SKRIV till fälten
        storyTextarea.value = artifacts.description;
        storyTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        storyTextarea.dispatchEvent(new Event('change', { bubbles: true }));

        console.log("Diagram:", artifacts.diagram);
        console.log("Script:", artifacts.script);
        console.log("Social:", artifacts.social);

        alert("Auto-Fill är klar! Glöm inte att spara.");
    }
    catch (error) {
        console.error("Auto-Fill Fel:", error);
        alert("Ett fel inträffade. Kontrollera konsolen.");
    }
    finally {
        button.textContent = '🚀 Auto-Fill with AI';
        button.disabled = false;
    }
}
function fillField(selector, value) {
    const field = document.querySelector(selector);
    if (field) {
        field.value = value;
        console.log(`Auto-Filler: Fyllde i fältet: ${selector}`);
    }
    else {
        console.warn(`Auto-Filler: Kunde inte hitta fältet: ${selector}`);
    }
}
// Kör!
injectButton();
