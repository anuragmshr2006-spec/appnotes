const qs = (sel) => document.querySelector(sel);
let user = "";
let notes = JSON.parse(localStorage.getItem("notes") || "[]");
let currentNote = null;

// LOGIN
qs("#loginBtn").addEventListener("click", () => {
  const name = qs("#usernameInput").value.trim();
  if (!name) return alert("Please enter your name or email!");
  user = name;
  localStorage.setItem("user", name);
  qs("#userDisplay").textContent = `Hi, ${name}`;
  qs("#loginModal").classList.remove("show");
  renderNotes();
});

window.addEventListener("DOMContentLoaded", () => {
  qs("#loginModal").classList.add("show"); // always ask username
  renderNotes();
});


// THEME TOGGLE
qs("#toggleThemeBtn").addEventListener("click", () => {
  const html = document.documentElement;
  html.setAttribute("data-theme", html.dataset.theme === "dark" ? "light" : "dark");
});

// CREATE NOTE
qs("#addCategoryBtn").addEventListener("click", () => {
  const catInput = qs("#newCategoryInput");
  const cat = catInput.value.trim();
  if (!cat) return;
  const newNote = {
    id: Date.now(),
    title: "Untitled",
    content: "",
    category: cat,
    pinned: false,
    color: "#ffffff",
    image: "",
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
  };
  notes.push(newNote);
  saveNotes();
  renderNotes();
  catInput.value = "";
});

// SAVE NOTES
function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

// RENDER NOTES
function renderNotes() {
  const pinnedArea = qs("#pinnedNotes");
  const notesArea = qs("#notesList");
  pinnedArea.innerHTML = "";
  notesArea.innerHTML = "";

  const search = qs("#searchBar").value.toLowerCase();
  const sortType = qs("#sortSelect").value;
  let sorted = [...notes];

  if (sortType === "alpha") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortType === "modified-asc") {
    sorted.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
  } else {
    sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  sorted
    .filter(
      (n) =>
        n.title.toLowerCase().includes(search) ||
        n.content.toLowerCase().includes(search) ||
        n.updatedAt.toLowerCase().includes(search)
    )
    .forEach((note) => {
      const card = document.createElement("div");
      card.className = "note";
      card.style.background = note.color;
      if (note.image) card.style.backgroundImage = `url(${note.image})`;
      card.setAttribute("draggable", "true");

      card.innerHTML = `
        <button class="pin-btn" aria-label="Pin note">📌</button>
        <div class="title">${note.title || "(untitled)"}</div>
        <div class="meta">Last edited: ${note.updatedAt}</div>
      `;

      card.querySelector(".pin-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        note.pinned = !note.pinned;
        saveNotes();
        renderNotes();
      });

      card.addEventListener("click", () => openEditor(note));
      if (note.pinned) pinnedArea.appendChild(card);
      else notesArea.appendChild(card);

      enableDrag(card, note);
    });
}

// DRAG & DROP
function enableDrag(card, note) {
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", note.id);
  });
  card.addEventListener("dragover", (e) => e.preventDefault());
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedIndex = notes.findIndex((n) => n.id == draggedId);
    const targetIndex = notes.findIndex((n) => n.id == note.id);
    const [draggedNote] = notes.splice(draggedIndex, 1);
    notes.splice(targetIndex, 0, draggedNote);
    saveNotes();
    renderNotes();
  });
}

// EDIT NOTE
function openEditor(note) {
  currentNote = note;
  qs("#noteTitle").value = note.title;
  qs("#noteContent").value = note.content;
  qs("#noteColor").value = note.color;
  qs("#createdAt").textContent = `Created: ${note.createdAt}`;
  qs("#updatedAt").textContent = `Last edited: ${note.updatedAt}`;
  qs("#editor").classList.add("show");
}

// SAVE NOTE
qs("#saveNoteBtn").addEventListener("click", () => {
  if (!currentNote) return;
  currentNote.title = qs("#noteTitle").value;
  currentNote.content = qs("#noteContent").value;
  currentNote.color = qs("#noteColor").value;
  currentNote.updatedAt = new Date().toLocaleString();
  saveNotes();
  renderNotes();
  qs("#editor").classList.remove("show");
});

// DELETE NOTE
qs("#deleteNoteBtn").addEventListener("click", () => {
  if (!currentNote) return;
  notes = notes.filter((n) => n.id !== currentNote.id);
  saveNotes();
  renderNotes();
  qs("#editor").classList.remove("show");
});

// CLOSE EDITOR
qs("#closeEditorBtn").addEventListener("click", () => {
  qs("#editor").classList.remove("show");
});

// BACKGROUND IMAGE
qs("#noteImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      currentNote.image = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// SEARCH + SORT
qs("#searchBar").addEventListener("input", renderNotes);
qs("#sortSelect").addEventListener("change", renderNotes);

// CLEAR ALL NOTES
qs("#clearNotesBtn").addEventListener("click", () => {
  if (confirm("Delete all notes?")) {
    notes = [];
    saveNotes();
    renderNotes();
  }
});
