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

/* -----------------------------
   Storage & Utilities
   ----------------------------- */
const STORAGE_KEY = "consolex_vaults_v1";
let vaults = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); // object keyed by vaultId
let activeVaultId = null;
let simulatedOTP = null;

const saveAll = ()=>localStorage.setItem(STORAGE_KEY, JSON.stringify(vaults));
const nowISO = ()=>new Date().toISOString();
const formatDate = iso=> new Date(iso).toLocaleString();
const genVaultId = ()=> "VX-" + Math.random().toString(16).slice(2,10).toUpperCase();

/* SHA-256 helper */
async function sha256Hex(msg){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* DOM refs */
const vaultsTableBody = document.querySelector("#vaultsTable tbody");
const createVaultBtn = document.getElementById("createVaultBtn");
const editorSection = document.getElementById("editorSection");
const editorVaultId = document.getElementById("editorVaultId");
const editorCreatedAt = document.getElementById("editorCreatedAt");
const searchInput = document.getElementById("searchInput");

/* inputs mapping for autosave */
const textFieldIds = [
  "field_appName","field_pkgName","field_storeUrl","field_publisherName",
  "field_repoLink","field_designFiles","field_planningNotes","field_projScreens",
  "field_signingNotes","field_lawyerContact","field_plannerNotes","field_backupApks",
  "field_paymentProof","field_brandFiles","field_ipDocs","field_promoVideos",
  "field_sourceZip","field_earlyBuilds","field_communicationProof","field_adminProof",
  "field_hostingProof","field_keystore","field_lawyerLetter","field_idDocs","field_contracts",
  "field_timelineScreens","field_folderMeta","field_publishProof","field_repoLink"
];

/* file inputs we store minimal metadata (name + size + lastModified) to avoid storing files in localStorage */
const fileFieldIds = [
  "field_appMedia","field_sourceZip","field_projScreens","field_designFiles","field_earlyBuilds",
  "field_communicationProof","field_adminProof","field_hostingProof","field_keystore","field_lawyerLetter",
  "field_idDocs","field_contracts","field_timelineScreens","field_folderMeta","field_publishProof",
  "field_backupApks","field_brandFiles","field_ipDocs","field_promoVideos","field_paymentProof"
];

/* -----------------------------
   Render vault list
   ----------------------------- */
function renderVaults(filter=""){
  vaultsTableBody.innerHTML = "";
  const items = Object.values(vaults).sort((a,b)=> (a.createdAt||"") < (b.createdAt||"") ? 1:-1);
  items.forEach(v=>{
    const name = (v.data && v.data.field_appName) ? v.data.field_appName : (v.data && v.data.field_repoLink) ? v.data.field_repoLink : "—";
    if(filter && !v.id.includes(filter) && !name.toLowerCase().includes(filter.toLowerCase())) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${v.id}</td>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml((v.data && v.data.field_publisherName) || "—")}</td>
      <td>${v.createdAt?formatDate(v.createdAt):"—"}</td>
      <td>
        <button data-act="update" data-id="${v.id}">Update</button>
        <button data-act="download" data-id="${v.id}" class="ghost">Export</button>
        <button data-act="remove" data-id="${v.id}" class="ghost">Delete</button>
      </td>`;
    vaultsTableBody.appendChild(tr);
  });
}

/* escape to avoid HTML injection from inputs */
function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

/* initial render */
renderVaults();

/* -----------------------------
   Create Vault
   ----------------------------- */
createVaultBtn.addEventListener("click", async ()=>{
  const id = genVaultId();
  vaults[id] = {
    id,
    createdAt: nowISO(),
    data: {},
    pinHash: null,
    recoveryEmailHash: null
  };
  saveAll();
  renderVaults();
  // Immediately open SET PIN modal for this new vault (set active)
  activeVaultId = id;
  openPinModal({mode:"set", title:"Set PIN for vault " + id});
});

/* -----------------------------
   Table actions (Update / Export / Delete)
   ----------------------------- */
vaultsTableBody.addEventListener("click", e=>{
  const btn = e.target.closest("button");
  if(!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if(act==="update"){
    // require PIN
    activeVaultId = id;
    openPinModal({mode:"unlock", title:"Unlock Vault " + id});
  } else if(act==="download"){
    exportVault(id);
  } else if(act==="remove"){
    if(confirm("Delete vault "+id+"? This will remove local data.")){
      delete vaults[id];
      saveAll();
      renderVaults();
      if(activeVaultId === id){ closeEditor(); }
    }
  }
});

/* -----------------------------
   Export vault JSON
   ----------------------------- */
function exportVault(id){
  const v = vaults[id];
  if(!v) return alert("Vault not found");
  const blob = new Blob([JSON.stringify(v, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${id}_vault.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* -----------------------------
   Editor open / close / load
   ----------------------------- */
function openEditor(id){
  activeVaultId = id;
  const v = vaults[id];
  if(!v) return alert("Missing vault");
  document.getElementById("editorVaultId").innerText = v.id;
  document.getElementById("editorCreatedAt").innerText = v.createdAt ? formatDate(v.createdAt) : "—";
  // load text fields
  const fields = [
    "field_appName","field_pkgName","field_storeUrl","field_publisherName","field_repoLink",
    "field_planningNotes","field_designFiles","field_signingNotes","field_lawyerContact","field_plannerNotes",
    "field_repoLink","field_planningNotes"
  ];
  // set values from v.data
  document.querySelectorAll("input,textarea").forEach(inp=>{
    if(inp.id && v.data && v.data[inp.id] !== undefined){
      if(inp.type !== "file") inp.value = v.data[inp.id];
    } else {
      // do not overwrite file inputs
      if(inp.type !== "file" && inp.id && !v.data[inp.id]) inp.value = "";
    }
  });
  editorSection.style.display = "block";
  window.scrollTo({top:0,behavior:"smooth"});
}

function closeEditor(){
  activeVaultId = null;
  editorSection.style.display = "none";
}

/* -----------------------------
   PIN modal / Set PIN / Unlock
   ----------------------------- */
const pinModal = document.getElementById("pinModal");
const pinInput = document.getElementById("pinInput");
const pinSubmitBtn = document.getElementById("pinSubmitBtn");
const setPinBtn = document.getElementById("setPinBtn");
const forgotPinBtn = document.getElementById("forgotPinBtn");
const modalDoor = document.getElementById("modalDoor");
let pinMode = "unlock"; // "unlock" or "set"

function openPinModal({mode="unlock", title=""}={}){
  pinMode = mode;
  document.getElementById("pinModalTitle").innerText = title || (mode==="set" ? "Set PIN" : "Enter PIN");
  pinInput.value = "";
  if(mode==="set"){
    setPinBtn.style.display = "inline-block";
    pinSubmitBtn.style.display = "none";
  } else {
    setPinBtn.style.display = "none";
    pinSubmitBtn.style.display = "inline-block";
  }
  pinModal.style.display = "flex";
  pinInput.focus();
}

/* Set PIN flow */
setPinBtn.addEventListener("click", async ()=>{
  const pin = pinInput.value.trim();
  if(!/^\d{4}$/.test(pin)) return alert("Please enter a 4-digit PIN");
  const h = await sha256Hex(pin);
  if(!activeVaultId) return alert("No active vault");
  vaults[activeVaultId].pinHash = h;
  saveAll();
  pinModal.style.display = "none";
  openEditor(activeVaultId);
});

/* Submit PIN (unlock) flow */
pinSubmitBtn.addEventListener("click", async ()=>{
  const pin = pinInput.value.trim();
  if(!/^\d{4}$/.test(pin)) return alert("Please enter a 4-digit PIN");
  const h = await sha256Hex(pin);
  const v = vaults[activeVaultId];
  if(!v) { pinModal.style.display="none"; return alert("Vault missing"); }
  if(!v.pinHash){
    // first time: accept and set
    v.pinHash = h;
    saveAll();
    pinModal.style.display = "none";
    openEditor(activeVaultId);
    return;
  }
  if(h === v.pinHash){
    // unlock animation then open
    modalDoor.classList.add("locking");
    setTimeout(()=>{ modalDoor.classList.remove("locking"); pinModal.style.display="none"; openEditor(activeVaultId); }, 700);
  } else {
    alert("Incorrect PIN");
  }
});

/* Forgot PIN -> OTP modal */
forgotPinBtn.addEventListener("click", ()=>{
  pinModal.style.display = "none";
  openOtpModal();
});

/* close pin modal if clicked outside */
pinModal.addEventListener("click", e=>{ if(e.target===pinModal) pinModal.style.display="none"; });

/* -----------------------------
   OTP Modal (local simulation; replace send logic later)
   ----------------------------- */
const otpModal = document.getElementById("otpModal");
const otpStage1 = document.getElementById("otpStage1");
const otpStage2 = document.getElementById("otpStage2");
const otpStage3 = document.getElementById("otpStage3");
const otpEmail = document.getElementById("otpEmail");
const otpInput = document.getElementById("otpInput");
const otpNewPin = document.getElementById("otpNewPin");

function openOtpModal(){
  otpStage1.style.display="block"; otpStage2.style.display="none"; otpStage3.style.display="none";
  otpModal.style.display = "flex";
  otpEmail.value = "";
  otpInput.value = "";
  otpNewPin.value = "";
}

/* Send OTP (simulate) */
document.getElementById("sendOtpBtn").addEventListener("click", async ()=>{
  const email = (otpEmail.value || "").trim().toLowerCase();
  if(!email) return alert("Enter recovery email");
  const v = vaults[activeVaultId];
  if(!v) return alert("Active vault missing");
  if(!v.recoveryEmailHash) return alert("No recovery email set for this vault");
  const emailHash = await sha256Hex(email);
  if(emailHash !== v.recoveryEmailHash) return alert("Email does not match vault recovery email");

  // generate simulated OTP and "send" it (we simply alert it; later call real API)
  simulatedOTP = ("" + Math.floor(100000 + Math.random()*900000));
  alert("SIMULATED OTP (for now): " + simulatedOTP);
  otpStage1.style.display="none"; otpStage2.style.display="block";
});

/* Verify OTP */
document.getElementById("verifyOtpBtn").addEventListener("click", ()=>{
  if(otpInput.value === simulatedOTP){
    otpStage2.style.display="none"; otpStage3.style.display="block";
  } else alert("Invalid OTP");
});

/* Save new PIN after OTP */
document.getElementById("saveNewPinBtn").addEventListener("click", async ()=>{
  const newPin = otpNewPin.value.trim();
  if(!/^\d{4}$/.test(newPin)) return alert("Enter 4-digit PIN");
  vaults[activeVaultId].pinHash = await sha256Hex(newPin);
  saveAll();
  otpModal.style.display = "none";
  alert("PIN reset successfully");
});

/* cancel OTP stages */
document.getElementById("otpCancel1").addEventListener("click", ()=>otpModal.style.display="none");
document.getElementById("otpCancel2").addEventListener("click", ()=>otpModal.style.display="none");
document.getElementById("otpCancel3").addEventListener("click", ()=>otpModal.style.display="none");

/* hide OTP on outside click */
otpModal.addEventListener("click", e=>{ if(e.target===otpModal) otpModal.style.display="none"; });

/* -----------------------------
   Editor autosave logic (including file metadata handling & recovery email hashing)
   ----------------------------- */
const fileToMeta = (file)=> ({ name:file.name, size:file.size, lastModified:file.lastModified });

function attachAutosave(){
  // text inputs and textareas
  document.querySelectorAll("#editorSection input[type='text'], #editorSection input[type='email'], #editorSection textarea").forEach(inp=>{
    inp.addEventListener("input", async (e)=>{
      if(!activeVaultId) return;
      const id = e.target.id;
      vaults[activeVaultId].data[id] = e.target.value;
      // special: if recovery email (we used field name 'field_lawyerContact' earlier to store lawyer contact; add a dedicated recovery field)
      if(id === "field_lawyerContact"){ /* keep lawyer contact separate */ }
      // also if a recoveryEmail field exists inside data (to keep compatibility)
      if(id === "field_recoveryEmail" || id === "field_lawyerContact_recoveryEmail"){
        vaults[activeVaultId].recoveryEmailHash = await sha256Hex((e.target.value||"").toLowerCase());
      }
      saveAll();
      renderVaults(searchInput.value.trim());
    });
  });

  // specific mapped fields (many)
  const mappedTextIds = ["field_appName","field_pkgName","field_storeUrl","field_publisherName","field_repoLink","field_planningNotes","field_designFiles","field_signingNotes","field_lawyerContact","field_plannerNotes"];
  mappedTextIds.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("input", async (e)=>{
      if(!activeVaultId) return;
      vaults[activeVaultId].data[id] = e.target.value;
      // special: if user set recovery email inside "field_lawyerContact" (we allow them to put recovery email) attempt to store if looks like email
      if(id==="field_lawyerContact" && e.target.value && /\S+@\S+\.\S+/.test(e.target.value)){
        vaults[activeVaultId].recoveryEmailHash = await sha256Hex(e.target.value.toLowerCase());
      }
      saveAll();
      renderVaults(searchInput.value.trim());
    });
  });

  // file inputs: store metadata array
  fileFieldIds.forEach(fid=>{
    const el = document.getElementById(fid);
    if(!el) return;
    el.addEventListener("change", (e)=>{
      if(!activeVaultId) return;
      const list = Array.from(el.files || []).map(fileToMeta);
      vaults[activeVaultId].data[fid] = list;
      saveAll();
      renderVaults(searchInput.value.trim());
    });
  });
}

/* run attach autosave */
attachAutosave();

/* -----------------------------
   Lock Now button: lock and animate vault door
   ----------------------------- */
document.getElementById("lockNowBtn").addEventListener("click", ()=>{
  if(!activeVaultId) { closeEditor(); return; }
  // animate full screen vault door
  const overlay = document.createElement("div");
  overlay.style = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#111;z-index:80";
  const door = document.createElement("div");
  door.style = "width:220px;height:220px;border-radius:50%;border:14px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:44px;background:#fafafa;box-shadow:inset 0 -10px 30px rgba(0,0,0,0.2)";
  door.innerText = "🔒";
  overlay.appendChild(door);
  document.body.appendChild(overlay);
  setTimeout(()=>{ overlay.remove(); },900);
  // close editor
  closeEditor();
});

/* -----------------------------
   Close editor button
   ----------------------------- */
document.getElementById("closeEditorBtn").addEventListener("click", ()=>{ closeEditor(); });

/* -----------------------------
   Save button explicit (in addition to autosave)
   ----------------------------- */
document.getElementById("saveBtn").addEventListener("click", ()=>{
  if(activeVaultId){
    saveAll();
    alert("Vault saved");
  }
});

/* -----------------------------
   Search filtering
   ----------------------------- */
searchInput.addEventListener("input", (e)=> renderVaults(e.target.value.trim()) );

/* -----------------------------
   Export all (simple JSON)
   ----------------------------- */
document.getElementById("exportAllBtn").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(vaults,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download = "consolex_vaults_export.json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

/* -----------------------------
   Utilities to set recovery email field (UI)
   We'll accept recovery email inside field_lawyerContact or a dedicated field if you later add it.
   ----------------------------- */

/* -----------------------------
   Initialize: if no vaults, make an example placeholder (optional)
   ----------------------------- */
if(Object.keys(vaults).length === 0){
  // leave empty — user will create vaults
}

/* -----------------------------
   Helper: When editor visible, ensure fields map to data actively
   ----------------------------- */
function syncEditorToData(){
  if(!activeVaultId) return;
  const v = vaults[activeVaultId];
  // map many known fields
  const ids = [
    "field_appName","field_pkgName","field_storeUrl","field_publisherName","field_repoLink",
    "field_planningNotes","field_signingNotes","field_lawyerContact"
  ];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.value = (v.data && v.data[id]) ? v.data[id] : "";
  });
}

/* On load, render table */
renderVaults();

/* -----------------------------
   Utility: load vault when open by unlock flow
   ----------------------------- */
function loadAfterUnlock(id){
  openEditor(id);
  syncEditorToData();
}

/* -----------------------------
   Extra: support setting recovery email explicitly
   We provide the owner a way: if they enter an email into lawyer contact field, it's used.
   ----------------------------- */
