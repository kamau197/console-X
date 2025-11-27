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


/* ---------- Tab Switching ---------- */
function showTab(id, event) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

/* ---------- Avatar Upload ---------- */
document.getElementById('uploadPic').addEventListener('change', function(e){
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(){
      document.getElementById('profilePic').src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

/* ---------- Generic Modal Functions ---------- */
function openModal(id){ document.getElementById(id).style.display='flex'; }
function closeModal(id){ document.getElementById(id).style.display='none'; }

/* ---------- Achievement Modal ---------- */
function addAchievement() {
  const text = document.getElementById('achievementText').value.trim();
  const fileInput = document.getElementById('achievementFile');
  const file = fileInput.files[0];

  if (!text) {
    alert("Please enter an achievement title.");
    return;
  }

  if (!file) {
    alert("Please attach a file for the achievement.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const li = document.createElement('li');
    li.classList.add("achievement-item");

    // Store achievement details in dataset
    li.dataset.title = text;
    li.dataset.file = e.target.result;

    li.innerHTML = `${text}`;

    // Make it clickable
    li.onclick = () => openAchievementView(li.dataset.title, li.dataset.file);

    document.getElementById('achievementList').appendChild(li);

    // reset fields
    document.getElementById('achievementText').value = "";
    fileInput.value = "";

    closeModal('achievementModal');
    showToast("Achievement added!");
  };

  reader.readAsDataURL(file);
}
function openAchievementView(title, imageSrc) {
  document.getElementById('viewAchTitle').textContent = title;
  document.getElementById('viewAchImage').src = imageSrc;

  openModal('viewAchievementModal');
}


/* ---------- Verification Modal ---------- */
function closeVerifyModal(){
  document.getElementById('verifyModal').style.display='none';
  const placeholder = document.getElementById('verifyPlaceholder');
  if(!placeholder.innerHTML){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3 class="section-title">Verification Details</h3><p><!-- User to fill this manually later --></p>`;
    placeholder.appendChild(card);
  }
}

/* ---------- Security Logic ---------- */
function toggleEmailRecovery() {
  const toggle = document.getElementById('emailRecovery');
  showToast(toggle.checked ? 'Email recovery enabled' : 'Email recovery disabled');
}

function setRecoveryEmail() {
  const email = document.getElementById('recoveryEmail').value.trim();
  if (email) {
    const hash = btoa(email).slice(0, 10);
    document.getElementById('hashedValue').textContent = hash + '•••';
    document.getElementById('hashedEmail').style.display = 'block';
    showToast('Recovery email set');
  }
}

function changeRecoveryEmail() {
  showToast('Recovery email updated successfully');
  closeModal('changeEmailModal');
}

function changeVaultPassword() {
  showToast('Vault password changed successfully');
  closeModal('changeVaultModal');
}

function sendVaultReset() {
  showToast('New vault password sent to email');
  closeModal('forgotVaultModal');
}

function changeKeyCode() {
  showToast('Key code updated successfully');
  closeModal('changeKeyModal');
}

function sendKeyReset() {
  showToast('New key code sent to email');
  closeModal('forgotKeyModal');
}

function saveSecurityControls() {
  showToast('Security settings updated');
}

/* ---------- Toast Utility ---------- */
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position = 'fixed';
  t.style.bottom = '30px';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.background = 'var(--sky)';
  t.style.color = '#000';
  t.style.padding = '10px 16px';
  t.style.borderRadius = '10px';
  t.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
  t.style.zIndex = 9999;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add('fadeOut'), 2500);
  setTimeout(()=> t.remove(), 3000);
}

/* ---------- Hash Utility ---------- */
function hashKey(seed) {
  let str = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return ('ref-' + (h >>> 0).toString(36)).slice(0, 16);
}
function nowTs() { return new Date().toLocaleString(); }

/* ---------- Withdrawal Logic ---------- */
function showWithdrawalFields() {
  const method = document.getElementById("withdrawMethod").value;
  document.querySelectorAll(".withdraw-fields").forEach(f => f.style.display = "none");
  if (method === "bank") document.getElementById("bankFields").style.display = "block";
  if (method === "phone") document.getElementById("phoneFields").style.display = "block";
  if (method === "paypal") document.getElementById("paypalFields").style.display = "block";
}
function saveWithdrawalMethod(){
  const m = document.getElementById("withdrawMethod").value;
  if(!m){ alert("Choose a withdrawal method first"); return; }
  showToast("Withdrawal method saved (frontend)");
}

/* ---------- Keys System (Referral + Subscription) ---------- */
const keysStore = [];
let lastReferralDate = null;

function renderKeys() {
  const body = document.getElementById("keyTableBody");
  if(!body) return;
  body.innerHTML = keysStore.map(k => {
    const statusHtml = k.type === "Subscription"
      ? `<span class="status ${k.status === 'Used' ? 'used' : 'active'}" data-key="${k.key}">${k.status}</span>`
      : `<button class="small-btn" onclick="useReferral('${k.key}')">Use</button>`;
    const usedBy = k.usedBy || '-';
    return `<tr data-keyrow="${k.key}">
      <td style="padding:10px;">${k.key}</td>
      <td style="padding:10px;">${k.type}</td>
      <td style="padding:10px;">${k.uses}</td>
      <td style="padding:10px;">${k.ts}</td>
      <td style="padding:10px;">${usedBy}</td>
      <td style="padding:10px;">${statusHtml}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="padding:12px;text-align:center;color:#777;">No keys yet</td></tr>`;
}

function generateReferralKey(){
  const now = new Date();
  if (lastReferralDate && (now - lastReferralDate) < 30*24*60*60*1000) {
    showToast("Referral can only be generated once per month.");
    return;
  }
  lastReferralDate = now;
  const key = hashKey("ref-"+now.getTime());
  keysStore.unshift({ key, type: "Referral", uses: 0, ts: nowTs(), usedBy: null, status: "Active", linkedSubscription: null });
  renderKeys();
  showToast("Referral key generated");
}

function useReferral(refKey){
  const username = prompt("Enter username who used this referral (simulate):");
  if(!username) return;
  const ref = keysStore.find(k => k.key === refKey && k.type === "Referral");
  if(!ref) return;
  ref.uses += 1;
  ref.usedBy = username;
  if(!ref.linkedSubscription){
    const now = new Date();
    const subKey = hashKey("sub-"+now.getTime()+refKey);
    const subObj = { key: subKey, type: "Subscription", uses: 0, ts: nowTs(), usedBy: null, status: "Active", parentReferral: refKey };
    keysStore.unshift(subObj);
    ref.linkedSubscription = subKey;
    showToast("Subscription key auto-generated for this referral use");
  } else {
    showToast("Referral used again — subscription already issued");
  }
  renderKeys();
}

document.addEventListener('click', (e) => {
  if(e.target.classList.contains('status')){
    const key = e.target.getAttribute('data-key');
    const k = keysStore.find(k => k.key === key && k.type === "Subscription");
    if(!k) return;
    if(k.status === "Used"){
      showToast("This subscription key is already used");
      return;
    }
    k.status = "Used";
    k.uses = (k.uses || 0) + 1;
    k.usedBy = prompt("Enter username who used this subscription key (simulate):") || k.usedBy || "unknown";
    renderKeys();
    showToast("Subscription key marked as used (one-time)");
  }
});

/* ---------- Initialize Data ---------- */
document.addEventListener('DOMContentLoaded', ()=> {
  renderKeys();
});

/* ---------- Permissions & Encryption ---------- */
const priorityNotif = document.getElementById('priorityNotif');
const priorityBadge = document.getElementById('priorityBadge');
const encModal = document.getElementById('encModal');

priorityNotif.addEventListener('change', () => {
  priorityBadge.style.display = priorityNotif.checked ? 'inline-block' : 'none';
});

// Dedicated Encryption Modal (no ID conflicts)
function openEncModal() { encModal.style.display = 'flex'; }
function closeEncModal() { encModal.style.display = 'none'; }

function saveNotif() {
  showToast('Notification preferences saved!');
}

/* ---------- Feedback Page Logic ---------- */
const dropZone = document.getElementById('dropZone');
const feedbackFile = document.getElementById('feedbackFile');
const dropText = document.getElementById('dropText');

dropZone.addEventListener('click', () => feedbackFile.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--mint)';
  dropZone.style.background = 'color-mix(in oklab, var(--mint) 30%, white)';
});
dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = 'var(--sky)';
  dropZone.style.background = '#f9f9f9';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  feedbackFile.files = e.dataTransfer.files;
  dropText.innerText = feedbackFile.files.length + " file(s) selected";
  dropZone.style.borderColor = 'var(--sky)';
  dropZone.style.background = '#f9f9f9';
});

feedbackFile.addEventListener('change', () => {
  dropText.innerText = feedbackFile.files.length + " file(s) selected";
});

function submitFeedback() {
  const type = document.getElementById('issueType').value;
  const message = document.getElementById('feedbackText').value.trim();
  if (!type || !message) {
    alert("⚠️ Please select an issue type and describe your feedback.");
    return;
  }
  console.log("Feedback Submitted:", {
    issueType: type,
    feedbackText: message,
    files: feedbackFile.files
  });
  alert("✅ Feedback submitted successfully!");
  document.getElementById('issueType').value = '';
  document.getElementById('feedbackText').value = '';
  dropText.innerText = "📁 Drag & Drop proof files here or click to upload";
  closeModal('feedbackModal');
}

/* ---------- Profile Milestones ---------- */
const milestones = document.querySelectorAll('.milestone');
const progressFill = document.getElementById('progressFill');
let completedSteps = 2;
function updateProgress() {
  milestones.forEach((m, i) => {
    if (i < completedSteps) m.classList.add('active');
    else m.classList.remove('active');
  });
  progressFill.style.width = `${(completedSteps / milestones.length) * 100}%`;
}
updateProgress();
 
function submitVerification() {
  const name = document.getElementById('verName').value.trim();
  const cxid = document.getElementById('verCXID').value.trim();
  const email = document.getElementById('verEmail').value.trim();
  const idF = document.getElementById('verIDFront').files.length;
  const idB = document.getElementById('verIDBack').files.length;
  const perf = document.getElementById('verPerf').value.trim();
  const agree = document.getElementById('verAgree').checked;

  if (!name || !cxid || !email || !idF || !idB || !perf) {
    alert("⚠️ All fields are mandatory.");
    return;
  }

  if (!agree) {
    alert("⚠️ You must agree to the Terms & Conditions.");
    return;
  }

  showToast("Verification Submitted Successfully!");

  // Close both modals (in case the Process modal is still open)
  
  closeModal('verifyModal');
}
