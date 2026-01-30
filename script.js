// ===== Configuration =====
const API_URL = 'api/api.php';
const USE_API = true; // Auf false setzen für Offline-Modus mit LocalStorage

// ===== State Management =====
let allNames = [];
let usedNames = new Set();
let currentFilter = 'all';
let currentSearchTerm = '';
let currentSelectedName = null;
let editingName = null; // Name, der gerade bearbeitet wird

// ===== DOM Elements =====
const csvInput = document.getElementById('csvInput');
const uploadArea = document.getElementById('uploadArea');
const pickButton = document.getElementById('pickButton');
const searchInput = document.getElementById('searchInput');

const resultDisplay = document.getElementById('resultDisplay');
const namesList = document.getElementById('namesList');
const totalNamesEl = document.getElementById('totalNames');
const availableNamesEl = document.getElementById('availableNames');
const usedNamesEl = document.getElementById('usedNames');
const filterButtons = document.querySelectorAll('.filter-btn');
const decisionButtons = document.getElementById('decisionButtons');
const confirmButton = document.getElementById('confirmButton');
const rejectButton = document.getElementById('rejectButton');
const deleteButton = document.getElementById('deleteButton');
const newNameInput = document.getElementById('newNameInput');
const addNameBtn = document.getElementById('addNameBtn');

const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const glassMenu = document.getElementById('glassMenu');

// ===== LocalStorage Keys =====
const STORAGE_KEYS = {
    NAMES: 'namePicker_allNames',
    USED: 'namePicker_usedNames'
};

// ===== Initialization =====
async function init() {
    attachEventListeners();
    updateUI();

    if (USE_API) {
        await loadNamesFromAPI();
    } else {
        loadFromLocalStorage();
    }
    updateUI();
}

// ===== Event Listeners =====
function attachEventListeners() {
    // CSV Input
    csvInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Buttons
    pickButton.addEventListener('click', pickRandomName);

    confirmButton.addEventListener('click', confirmName);
    rejectButton.addEventListener('click', rejectName);
    if (deleteButton) {
        deleteButton.addEventListener('click', deleteSuggestedName);
    }

    // Add Name Button
    if (addNameBtn) {
        addNameBtn.addEventListener('click', addSingleName);
    }
    if (newNameInput) {
        newNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addSingleName();
        });
    }

    // Filter Buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderNamesList();
        });
    });

    // Search Input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.trim().toLowerCase();
            renderNamesList();
        });
    }
    // Menu Toggle
    if (menuBtn && glassMenu) {
        menuBtn.addEventListener('click', () => {
            glassMenu.classList.add('active');
        });
    }

    if (closeMenuBtn && glassMenu) {
        closeMenuBtn.addEventListener('click', () => {
            glassMenu.classList.remove('active');
        });
    }
}

// ===== File Handling =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        readCSVFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
        readCSVFile(file);
    } else {
        alert('Bitte laden Sie eine CSV-Datei hoch.');
    }
}

function readCSVFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        const content = e.target.result;
        parseCSV(content);
    };

    reader.onerror = function () {
        alert('Fehler beim Lesen der Datei.');
    };

    reader.readAsText(file);
}

async function parseCSV(content) {
    // Split by newlines and filter out empty lines
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    // Extract names (assuming one name per line, taking first column if comma-separated)
    const names = lines.map(line => {
        const parts = line.split(',');
        return parts[0].trim();
    }).filter(name => name !== '');

    if (names.length === 0) {
        alert('Keine Namen in der CSV-Datei gefunden.');
        return;
    }

    // Remove duplicates from imported names
    const uniqueImportedNames = [...new Set(names)];

    if (USE_API) {
        // Use API to add names
        const result = await addNamesToAPI(uniqueImportedNames);
        if (result) {
            await loadNamesFromAPI();
            showImportSummary(result.added, result.skipped);
        }
    } else {
        // LocalStorage fallback
        let addedCount = 0;
        let skippedCount = 0;

        uniqueImportedNames.forEach(name => {
            if (!allNames.includes(name)) {
                allNames.push(name);
                addedCount++;
            } else {
                skippedCount++;
            }
        });

        saveToLocalStorage();
        updateUI();
        showImportSummary(addedCount, skippedCount);
    }
}

// ===== Import Summary =====
function showImportSummary(added, skipped) {
    const total = added + skipped;
    let message = `Import abgeschlossen:\n\n`;
    message += `📊 Gesamt in CSV: ${total}\n`;
    message += `✅ Hinzugefügt: ${added}\n`;
    message += `⏭️ Übersprungen (bereits vorhanden): ${skipped}`;

    alert(message);
}

// ===== Random Name Picker =====
function pickRandomName() {
    const availableNames = allNames.filter(name => !usedNames.has(name));

    if (availableNames.length === 0) {
        showNotification('Alle Namen wurden bereits verwendet!', 'warning');
        return;
    }

    // Pick random name
    const randomIndex = Math.floor(Math.random() * availableNames.length);
    const selectedName = availableNames[randomIndex];

    // Store current selection (don't mark as used yet)
    currentSelectedName = selectedName;

    // Display result with animation
    displayResult(selectedName);

    // Show decision buttons and hide pick button
    pickButton.style.display = 'none';
    decisionButtons.style.display = 'grid';
}

function displayResult(name) {
    resultDisplay.innerHTML = `<div class="result-name">${name}</div>`;
}

// ===== Confirm/Reject Name =====
async function confirmName() {
    if (!currentSelectedName) return;

    if (USE_API) {
        // Use API to mark name as used
        const success = await markNameAsUsedAPI(currentSelectedName);
        if (success) {
            await loadNamesFromAPI();
            showNotification(`"${currentSelectedName}" wurde verwendet!`);
            resetPickerUI();
        }
    } else {
        // LocalStorage fallback
        usedNames.add(currentSelectedName);
        saveToLocalStorage();
        showNotification(`"${currentSelectedName}" wurde verwendet!`);
        resetPickerUI();
        updateUI();
    }
}

function rejectName() {
    if (!currentSelectedName) return;

    // Simply pick a new name
    showNotification('Neuer Name wird ausgewählt...');
    currentSelectedName = null;

    // Pick a new random name
    // Pick a new random name
    pickRandomName();
}

async function deleteSuggestedName() {
    console.log('Delete button clicked');
    console.log('Current selected name:', currentSelectedName);

    if (!currentSelectedName) {
        console.error('No name selected to delete');
        return;
    }

    const nameToDelete = currentSelectedName;

    if (!confirm(`Möchten Sie den Namen "${nameToDelete}" wirklich dauerhaft löschen?`)) {
        return;
    }

    if (USE_API) {
        const success = await deleteNameAPI(nameToDelete);
        if (success) {
            await loadNamesFromAPI();
            currentSelectedName = null;
            showNotification(`"${nameToDelete}" wurde gelöscht`, 'success');
            // Pick a new name automatically
            pickRandomName();
        }
    } else {
        // LocalStorage fallback
        allNames = allNames.filter(n => n !== nameToDelete);
        usedNames.delete(nameToDelete);
        saveToLocalStorage();

        currentSelectedName = null;
        updateUI();
        showNotification(`"${nameToDelete}" wurde gelöscht`, 'success');

        // Pick a new name automatically
        pickRandomName();
    }
}

async function deleteNameFromList(name) {
    if (!confirm(`Möchten Sie den Namen "${name}" wirklich dauerhaft löschen?`)) {
        return;
    }

    if (USE_API) {
        const success = await deleteNameAPI(name);
        if (success) {
            if (currentSelectedName === name) {
                resetPickerUI();
            }
            if (editingName === name) {
                editingName = null;
            }
            await loadNamesFromAPI();
            showNotification(`"${name}" wurde gelöscht`, 'success');
        }
    } else {
        // LocalStorage fallback
        allNames = allNames.filter(n => n !== name);
        usedNames.delete(name);

        if (currentSelectedName === name) {
            resetPickerUI();
        }
        if (editingName === name) {
            editingName = null;
        }

        saveToLocalStorage();
        updateUI();
        showNotification(`"${name}" wurde gelöscht`, 'success');
    }
}

function resetPickerUI() {
    currentSelectedName = null;
    resultDisplay.innerHTML = '<div class="result-placeholder">Klicken Sie auf den Button unten</div>';
    pickButton.style.display = 'inline-flex';
    decisionButtons.style.display = 'none';
}



// ===== UI Updates =====
function updateUI() {
    updateStats();
    renderNamesList();
    updatePickButton();
}

function updateStats() {
    const total = allNames.length;
    const used = usedNames.size;
    const available = total - used;

    totalNamesEl.textContent = total;
    availableNamesEl.textContent = available;
    usedNamesEl.textContent = used;
}

function updatePickButton() {
    const availableCount = allNames.length - usedNames.size;
    pickButton.disabled = availableCount === 0;
}

function renderNamesList() {
    if (allNames.length === 0) {
        namesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>Keine Namen geladen</p>
                <p class="empty-hint">Importieren Sie eine CSV-Datei, um zu beginnen</p>
            </div>
        `;
        return;
    }

    // Filter names based on current filter and search term
    let filteredNames = allNames;

    // 1. Filter by status
    if (currentFilter === 'available') {
        filteredNames = allNames.filter(name => !usedNames.has(name));
    } else if (currentFilter === 'used') {
        filteredNames = allNames.filter(name => usedNames.has(name));
    }

    // 2. Filter by search term
    if (currentSearchTerm) {
        filteredNames = filteredNames.filter(name => name.toLowerCase().includes(currentSearchTerm));
    }

    if (filteredNames.length === 0) {
        namesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>Keine Namen gefunden</p>
                <p class="empty-hint">Versuchen Sie einen anderen Filter oder Suchbegriff</p>
            </div>
        `;
        return;
    }

    // Render names
    const namesHTML = filteredNames.map(name => {
        const isUsed = usedNames.has(name);
        const statusClass = isUsed ? 'used' : 'available';
        const statusText = isUsed ? 'Verwendet' : 'Verfügbar';
        const isEditing = editingName === name;

        if (isEditing) {
            return `
                <div class="name-item editing">
                    <div class="name-content">
                        <input type="text" class="name-edit-input" value="${name}" id="editInput_${name}">
                    </div>
                    <div class="name-actions">
                        <button class="btn-save" onclick="saveNameChange('${name}')">Speichern</button>
                        <button class="btn-cancel" onclick="cancelEdit()">Abbrechen</button>
                        <button class="btn-delete" onclick="deleteNameFromList('${name}')" title="Namen löschen">🗑️</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="name-item ${statusClass}">
                    <div class="name-content">
                        <span class="name-text">${name}</span>
                        <span class="name-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="name-actions">
                        <button class="btn-edit" onclick="startEdit('${name}')">Bearbeiten</button>
                        <button class="btn-toggle-status" onclick="toggleStatus('${name}')">
                            ${isUsed ? 'Als verfügbar markieren' : 'Als verwendet markieren'}
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');

    namesList.innerHTML = namesHTML;
}

// ===== Edit Functions =====
function startEdit(name) {
    editingName = name;
    renderNamesList();
    // Focus input
    setTimeout(() => {
        const input = document.getElementById(`editInput_${name}`);
        if (input) input.focus();
    }, 50);
}

function cancelEdit() {
    editingName = null;
    renderNamesList();
}

async function saveNameChange(oldName) {
    const input = document.getElementById(`editInput_${oldName}`);
    if (!input) return;

    const newName = input.value.trim();
    if (!newName) {
        showNotification('Name darf nicht leer sein', 'warning');
        return;
    }

    if (newName === oldName) {
        cancelEdit();
        return;
    }

    if (USE_API) {
        const success = await updateNameAPI(oldName, newName);
        if (success) {
            editingName = null;
            await loadNamesFromAPI();
            showNotification('Name erfolgreich geändert');
        }
    } else {
        // LocalStorage fallback
        const index = allNames.indexOf(oldName);
        if (index !== -1) {
            allNames[index] = newName;
            if (usedNames.has(oldName)) {
                usedNames.delete(oldName);
                usedNames.add(newName);
            }
            saveToLocalStorage();
            editingName = null;
            updateUI();
            showNotification('Name erfolgreich geändert');
        }
    }
}

async function toggleStatus(name) {
    if (USE_API) {
        const success = await toggleStatusAPI(name);
        if (success) {
            await loadNamesFromAPI();
            // showNotification('Status geändert');
        }
    } else {
        // LocalStorage fallback
        if (usedNames.has(name)) {
            usedNames.delete(name);
        } else {
            usedNames.add(name);
        }
        saveToLocalStorage();
        updateUI();
    }
}


async function addSingleName() {
    const name = newNameInput.value.trim();
    if (!name) {
        showNotification('Bitte geben Sie einen Namen ein', 'warning');
        return;
    }

    if (allNames.includes(name)) {
        showNotification(`Der Name "${name}" existiert bereits`, 'warning');
        return;
    }

    if (USE_API) {
        const result = await addNamesToAPI([name]);
        if (result && result.added > 0) {
            await loadNamesFromAPI();
            newNameInput.value = '';
            showNotification(`"${name}" erfolgreich hinzugefügt`);
        } else if (result && result.skipped > 0) {
            showNotification(`Der Name "${name}" existiert bereits`, 'warning');
        }
    } else {
        allNames.push(name);
        saveToLocalStorage();
        updateUI();
        newNameInput.value = '';
        showNotification(`"${name}" erfolgreich hinzugefügt`);
    }
}

// ===== API Functions =====
async function loadNamesFromAPI() {
    try {
        const response = await fetch(`${API_URL}?action=getNames`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            allNames = data.data.names.map(n => n.name);
            usedNames = new Set(data.data.names.filter(n => n.is_used).map(n => n.name));
            updateUI();
        } else {
            console.error('API Error:', data.message);
            showNotification('Fehler beim Laden der Namen: ' + data.message, 'warning');
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Netzwerkfehler - Prüfen Sie die Server-Verbindung', 'warning');
        // Optional: Fallback to local storage if API fails completely
        // loadFromLocalStorage();
    }
}

async function addNamesToAPI(names) {
    try {
        const response = await fetch(`${API_URL}?action=addNames`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ names: names })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            console.error('API Error:', data.message);
            showNotification('Fehler beim Hinzufügen: ' + data.message, 'warning');
            return null;
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Netzwerkfehler beim Import', 'warning');
        return null;
    }
}

async function markNameAsUsedAPI(name) {
    try {
        const response = await fetch(`${API_URL}?action=markUsed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            console.error('API Error:', data.message);
            showNotification('Fehler: ' + data.message, 'warning');
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Netzwerkfehler', 'warning');
        return false;
    }
}

async function updateNameAPI(oldName, newName) {
    try {
        const response = await fetch(`${API_URL}?action=updateName`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oldName: oldName, newName: newName })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            console.error('API Error:', data.message);
            showNotification('Fehler: ' + data.message, 'warning');
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Netzwerkfehler beim Aktualisieren', 'warning');
        return false;
    }
}

async function toggleStatusAPI(name) {
    try {
        const response = await fetch(`${API_URL}?action=toggleStatus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            console.error('API Error:', data.message);
            showNotification('Fehler: ' + data.message, 'warning');
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Netzwerkfehler beim Status-Wechsel', 'warning');
        return false;
    }
}

async function deleteNameAPI(name) {
    try {
        const response = await fetch(`${API_URL}?action=deleteName`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            console.error('API Error:', data.message);
            showNotification('Fehler: ' + data.message, 'warning');
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Netzwerkfehler beim Löschen', 'warning');
        return false;
    }
}

// ===== LocalStorage (Fallback) =====
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.NAMES, JSON.stringify(allNames));
    localStorage.setItem(STORAGE_KEYS.USED, JSON.stringify([...usedNames]));
}

function loadFromLocalStorage() {
    const savedNames = localStorage.getItem(STORAGE_KEYS.NAMES);
    const savedUsed = localStorage.getItem(STORAGE_KEYS.USED);

    if (savedNames) {
        allNames = JSON.parse(savedNames);
    }

    if (savedUsed) {
        usedNames = new Set(JSON.parse(savedUsed));
    }
}

// ===== Notifications =====
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'hsl(145, 70%, 55%)' : type === 'warning' ? 'hsl(35, 95%, 60%)' : 'hsl(200, 90%, 60%)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add notification animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Initialize App =====
init();
