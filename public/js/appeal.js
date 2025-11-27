/* -----------------------------
   Sidebar JS (Refined)
----------------------------- */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const overlay = document.getElementById("overlay");
const mainContent = document.getElementById("mainContent");

// Open sidebar
function openSidebar() {
  sidebar.style.left = "0";
  mainContent.style.marginLeft = "250px"; // push content
  document.body.classList.add("sidebar-open");
  sidebarToggle.style.display = "none";

  // Only show overlay on small screens
  if (window.innerWidth <= 768) overlay.style.display = "block";
}

// Close sidebar
function closeSidebar() {
  sidebar.style.left = "-250px";
  mainContent.style.marginLeft = "0";
  document.body.classList.remove("sidebar-open");
  sidebarToggle.style.display = "block";

  if (window.innerWidth <= 768) overlay.style.display = "none";
}

// Toggle button
sidebarToggle.addEventListener("click", openSidebar);

// Close button inside sidebar
closeSidebarBtn.addEventListener("click", closeSidebar);

// Clicking overlay only works on mobile
overlay.addEventListener("click", () => {
  if (window.innerWidth <= 768) closeSidebar();
});

// Optional: handle window resize to hide overlay if resizing to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) overlay.style.display = "none";
});
function loadAppeals() {
  const appeals = JSON.parse(localStorage.getItem("appeals") || "[]");
  const table = document.getElementById("appealsTable");

  table.innerHTML = `
    <tr>
      <th>ID</th><th>Project</th><th>Vault</th>
      <th>Contract</th><th>App</th><th>Status</th><th>Action</th>
    </tr>
  `;

  appeals.forEach(a => {

    // AUTO UPDATE legal forwarding
    if (a.status === "Approved" || a.status === "Denied") {
      a.status = "Forwarded to Legal Team";

      // Save updated status
      localStorage.setItem("appeals", JSON.stringify(appeals));
    }

    let actionBtn = "";

    // If forwarded to legal team → show Take Down button
    if (a.status === "Forwarded to Legal Team") {
      actionBtn = `<button class='takeBtn' data-id='${a.id}'>Request Take Down</button>`;
    }

    table.innerHTML += `
      <tr>
        <td>${a.id}</td>
        <td>${a.project}</td>
        <td>${a.vault}</td>
        <td>${a.contract}</td>
        <td>${a.app}</td>
        <td>${a.status}</td>
        <td>${actionBtn}</td>
      </tr>
    `;
  });

  attachTakeDownButtons();
}

// Handle "Request Take Down"
function attachTakeDownButtons() {
  document.querySelectorAll(".takeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openModal(id);
    });
  });
}

/* ===== MODAL LOGIC ===== */
let currentAppealID = null;

function openModal(id) {
  currentAppealID = id;
  document.getElementById("kcPin").value = "";
  document.getElementById("modalBg").style.display = "flex";
}

document.getElementById("modalBg").addEventListener("click", e => {
  if (e.target.id === "modalBg") {
    document.getElementById("modalBg").style.display = "none";
  }
});

// Send PIN
document.getElementById("sendKcBtn").addEventListener("click", () => {
  const pin = document.getElementById("kcPin").value.trim();

  if (!pin) return alert("Please enter your KC PIN.");
  if (isNaN(pin)) return alert("KC PIN must be numbers only.");

  const appeals = JSON.parse(localStorage.getItem("appeals") || "[]");
  const target = appeals.find(a => a.id == currentAppealID);

  if (target) {
    target.takeDownRequest = "Submitted";
    localStorage.setItem("appeals", JSON.stringify(appeals));
  }

  alert("✔ Take down request sent.");
  document.getElementById("modalBg").style.display = "none";
});

document.getElementById("submitBtn").addEventListener("click", () => {
  const fields = ["projectID", "vaultID", "contractID", "appName", "details"];
  for (let f of fields) {
    if (!document.getElementById(f).value.trim())
      return alert("Please fill all required fields.");
  }

  const appeal = {
    id: Math.floor(Math.random() * 90000) + 10000,
    project: projectID.value.trim(),
    vault: vaultID.value.trim(),
    contract: contractID.value.trim(),
    partyB: partyB.value.trim(),
    app: appName.value.trim(),
    details: details.value.trim(),
    status: "Sent to Admin",
    takeDownRequest: null
  };

  const stored = JSON.parse(localStorage.getItem("appeals") || "[]");
  stored.push(appeal);
  localStorage.setItem("appeals", JSON.stringify(stored));

  loadAppeals();
  alert("✅ Appeal submitted to Admin.");
});

// FIRST LOAD
loadAppeals();


  fetch('sidebar9')
    .then(response => response.text())
    .then(data => {
      document.getElementById('sidebar-container').innerHTML = data;
    })
    .catch(err => console.error('Failed to load sidebar:', err));
