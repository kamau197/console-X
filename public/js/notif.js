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


const $ = (s, ctx=document)=>ctx.querySelector(s);
const $$ = (s, ctx=document)=>Array.from(ctx.querySelectorAll(s));

const userId = "UA001"; // current user

/* ========== NOTIFICATION ACCESS ========= */
function getMyNotifications() {
  const all = JSON.parse(localStorage.getItem("notifications") || "{}");
  const raw = all[userId] || [];
  return raw.map(n => normalizeNotification(n));
}

/* ========== CHAT STORAGE ========= */
function getChats() {
  return JSON.parse(localStorage.getItem("chats") || "[]");
}
function saveChats(chats) {
  localStorage.setItem("chats", JSON.stringify(chats));
}

/* ========== RENDER NORMAL TABS ========= */
function renderStandardList(tab) {
  const list = $("#notifList");
  list.innerHTML = "";

  const items = getMyNotifications().filter(n => tab === "all" || n.tab === tab);

  if (items.length === 0) {
    list.innerHTML = '<div class="card">No notifications in this category.</div>';
    return;
  }

  items.forEach(n => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row">
        <h3>${n.title}</h3>
        <button class="btn primary" data-id="${n.id}">${n.cta}</button>
      </div>
      <div class="meta">${n.time} — ${n.msg}</div>
    `;
    list.appendChild(card);
  });
}

/* ========== RENDER CONTRACT SUBTABS ========= */
function renderContractSubtab(which) {
  const body = $("#contractSubBody");
  body.innerHTML = "";

  const items = getMyNotifications().filter(n => n.tab === "contracts");
  const requests = items.filter(n => n.type === "request");
  const approvals = items.filter(n => n.type === "approval");

  if (which === "req") {
    if (requests.length === 0) {
      body.innerHTML = `<div class="card">No new requests.</div>`;
      return;
    }
    requests.forEach(n => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="row">
          <h3>${n.title}</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn secondary" data-view="${n.sender_id}">View Profile</button>
            <button class="btn primary" data-startchat="${n.sender_id}" data-contract="${n.contract_id}">Start Chat</button>
          </div>
        </div>
        <div class="meta">${n.time} — ${n.msg}</div>
      `;
      body.appendChild(card);
    });
  }

  if (which === "app") {
    if (approvals.length === 0) {
      body.innerHTML = `<div class="card">No approvals yet.</div>`;
      return;
    }
    approvals.forEach(n => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="row">
          <h3>${n.title}</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn primary" data-approve="${n.id}">Approve</button>
            <button class="btn secondary" data-deny="${n.id}">Deny</button>
          </div>
        </div>
        <div class="meta">${n.time} — ${n.msg}</div>
      `;
      body.appendChild(card);
    });
  }
}

/* ========== MAIN TAB SWITCH ========= */
function switchTab(tab) {
  $("#notifList").style.display = "none";
  $("#contractsSection").style.display = "none";

  if (tab === "contracts") {
    $("#contractsSection").style.display = "block";
    renderContractSubtab("req"); // default
  } else {
    $("#notifList").style.display = "block";
    renderStandardList(tab);
  }
}

/* ========== MAIN TAB CLICK HANDLER ========= */
$$('#tabs .tab').forEach(tab => {
  tab.addEventListener("click", () => {
    $$('#tabs .tab').forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    switchTab(tab.dataset.tab);
  });
});

/* ========== SUBTAB CLICK HANDLER ========= */
$$(".subtab").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".subtab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderContractSubtab(btn.dataset.sub);
  });
});

/* ========== GLOBAL CLICK ACTIONS ========= */
document.body.addEventListener("click", e => {

  /* Generic notification buttons */
  if (e.target.matches("[data-id]")) {
    const id = e.target.dataset.id;
    const n = getMyNotifications().find(x => x.id == id);
    toast(n.cta + " clicked");
  }

  /* View profile */
  if (e.target.matches("[data-view]")) {
    const senderId = e.target.dataset.view;
    toast("Opening profile of " + senderId);
    window.location.href = `profile.php?user_id=${senderId}`;
  }

  /* Start chat (contract 4.16) */
  if (e.target.matches("[data-startchat]")) {
    const senderId = e.target.dataset.startchat;
    const contractId = e.target.dataset.contract;
    const chatId = `CONTRACT_${contractId}_${userId}_${senderId}`;

    const chats = getChats();
    if (!chats.find(c => c.chat_id === chatId)) {
      chats.push({
        chat_id: chatId,
        name: senderId,
        contract: contractId,
        last_message: "",
        timestamp: new Date().toISOString()
      });
      saveChats(chats);
    }

    toast("Chat started with " + senderId);

    setTimeout(() => {
      window.location.href = `contract4.16.php?chat_id=${chatId}`;
    }, 700);
  }

  /* Approve / Deny */
  if (e.target.matches("[data-approve]")) {
    toast("Approved request " + e.target.dataset.approve);
  }
  if (e.target.matches("[data-deny]")) {
    toast("Denied request " + e.target.dataset.deny);
  }
});

/* ========== TOAST ========== */
function toast(msg) {
  const t = document.createElement("div");
  t.className = "item";
  t.textContent = msg;
  $("#toast").appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/* ========== AUTO REFRESH ========== */
setInterval(() => {
  const active = $(".tab.active").dataset.tab;
  switchTab(active);
}, 3000);

/* Initial load */
switchTab("all");