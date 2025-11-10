import { generateSubmissionContent } from './services/geminiService';

console.log("Devpost Auto-Filler: Content Script Laddad (v3 - Fixed).");

function injectButton() {
  // Leta efter description textarea istället
  const descriptionField = document.querySelector('textarea[name="software[description]"]') as HTMLTextAreaElement;
  if (!descriptionField) {
    console.log("Auto-Filler: Kunde inte hitta description-fältet att fästa knappen vid.");
    return;
  }

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
    descriptionField.parentElement!.insertBefore(buttonContainer, descriptionField.nextSibling);
  }

  console.log("Auto-Filler: Knappen injicerad bredvid formulär.");

  button.addEventListener('click', handleAutoFill);
}

async function handleAutoFill() {
  const button = document.getElementById('auto-fill-button') as HTMLButtonElement;
  console.log("Auto-Filler: Knappen klickad.");

  try {
    const descriptionField = document.querySelector('textarea[name="software[description]"]') as HTMLTextAreaElement;
    if (!descriptionField) {
      alert("Kunde inte hitta 'Project Description'-rutan.");
      return;
    }

    const projectIdea = descriptionField.value;
    if (projectIdea.length < 10) {
      alert("Skriv minst 10 tecken i 'Project Description' först.");
      return;
    }

    button.textContent = '🧠 Tänker...';
    button.disabled = true;

    const artifacts = await generateSubmissionContent(projectIdea);

    descriptionField.value = artifacts.description;
    descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionField.dispatchEvent(new Event('change', { bubbles: true }));

    console.log("Diagram:", artifacts.diagram);
    console.log("Script:", artifacts.script);
    console.log("Social:", artifacts.social);

    alert("Auto-Fill är klar! Glöm inte att spara.");
  } catch (error) {
    console.error("Auto-Fill Fel:", error);
    alert("Ett fel inträffade: " + (error as Error).message);
  } finally {
    button.textContent = '🚀 Auto-Fill with AI';
    button.disabled = false;
  }
}

injectButton();
