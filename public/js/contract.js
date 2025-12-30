<!-- AUTH GUARD -->
<script type="module">
  import { supabase } from "/js/supabaseClient.js";

  async function enforceAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const allowedRoles = ["basic_user", "vendor", "admin", "legal"];

    if (!profile || !allowedRoles.includes(profile.role)) {
      window.location.href = "/unauthorized.html";
      return;
    }

    window.currentUser = session.user;
    window.currentRole = profile.role;
  }

  enforceAuth();
</script>

<script>
  /* -----------------------------
       Sidebar Logic
  ----------------------------- */
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const overlay = document.getElementById("overlay");
  const mainContent = document.getElementById("mainContent");

  function openSidebar() {
    sidebar.style.left = "0";
    mainContent.style.marginLeft = "250px";
    document.body.classList.add("sidebar-open");
    sidebarToggle.style.display = "none";
    if (window.innerWidth <= 768) overlay.style.display = "block";
  }

  function closeSidebar() {
    sidebar.style.left = "-250px";
    mainContent.style.marginLeft = "0";
    document.body.classList.remove("sidebar-open");
    sidebarToggle.style.display = "block";
    if (window.innerWidth <= 768) overlay.style.display = "none";
  }

  sidebarToggle.addEventListener("click", openSidebar);
  closeSidebarBtn.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", () => { if (window.innerWidth <= 768) closeSidebar(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 768) overlay.style.display = "none"; });

  /* -----------------------------
       Contract Logic
  ----------------------------- */
  const API_BASE = '/api'; // Adjust to your backend
  const contractList = document.getElementById('contract-list');
  const toastEl = document.getElementById('toast');
  const modalOverlay = document.getElementById('modalOverlay');

  // Modals
  const reviewModal = document.getElementById('reviewModal');
  const reviewText = document.getElementById('reviewText');
  const reviewCancelBtn = document.getElementById('reviewCancelBtn');
  const reviewSubmitBtn = document.getElementById('reviewSubmitBtn');

  const terminateModal = document.getElementById('terminateModal');
  const terminateReason = document.getElementById('terminateReason');
  const terminateCancelBtn = document.getElementById('terminateCancelBtn');
  const terminateSubmitBtn = document.getElementById('terminateSubmitBtn');

  const reportModal = document.getElementById('reportModal');
  const reportText = document.getElementById('reportText');
  const reportCancelBtn = document.getElementById('reportCancelBtn');
  const reportSubmitBtn = document.getElementById('reportSubmitBtn');

  let modalContext = { contractId: null, action: null };

  // Helper
  const showToast = (msg, ms = 3000) => {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.style.display = 'none', ms);
  };

  const openModal = modalEl => { modalOverlay.style.display = 'block'; modalEl.style.display = 'block'; };
  const closeModal = modalEl => { modalOverlay.style.display = 'none'; modalEl.style.display = 'none'; };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  };

  // ---------- Fetch all contracts ----------
  async function fetchAllContracts(userId) {
    try {
      const url = `${API_BASE}/contracts/all?userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url, { headers: Object.assign({ 'Content-Type':'application/json' }, getAuthHeaders()) });
      if (!res.ok) throw new Error('Failed to fetch contracts');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch(err) {
      console.error(err);
      showToast('Error loading contracts');
      return [];
    }
  }

  function sortContracts(contracts) {
    const sorted = { requests: [], active: [], terminated: [], completed: [], archived: [] };
    contracts.forEach(c => { const s = (c.status||'').toLowerCase(); if(sorted[s]) sorted[s].push(c); });
    return sorted;
  }

  function renderContracts(contracts = [], filter = 'requests') {
    contractList.innerHTML = '';
    if(!contracts.length) { contractList.innerHTML = '<p>No contracts in this tab.</p>'; return; }

    contracts.forEach(c => {
      const card = createContractCard(c);
      contractList.appendChild(card);
    });
  }

  function createContractCard(contract) {
    const card = document.createElement('div');
    card.className = 'contract';
    card.dataset.id = contract.id;
    card.dataset.status = contract.status;
    card.style.border = '1px solid rgba(0,0,0,0.06)';
    card.style.borderRadius = '12px';
    card.style.padding = '12px';
    card.style.marginBottom = '10px';
    card.style.background = '#fff';

    // Header
    const header = document.createElement('div');
    header.className = 'contract-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.cursor = 'pointer';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = `${contract.partyA || '[Party A]'} ↔ ${contract.partyB || '[Party B]'}`;
    title.style.margin = '0 0 4px 0';
    const meta = document.createElement('div');
    meta.style.fontSize = '12px';
    meta.style.color = '#666';
    meta.textContent = `Milestones: ${contract.milestonesCompleted||0} • Created: ${new Date(contract.createdAt||Date.now()).toLocaleDateString()}`;
    titleWrap.appendChild(title); titleWrap.appendChild(meta);

    const rightSide = document.createElement('div');
    rightSide.style.display = 'flex'; rightSide.style.gap='8px'; rightSide.style.alignItems='center';

    const statusSpan = document.createElement('span');
    statusSpan.className = `status ${contract.status}`;
    statusSpan.textContent = contract.status==='requests'?'Request':contract.status;
    statusSpan.style.fontSize='12px'; statusSpan.style.padding='6px 8px'; statusSpan.style.borderRadius='999px'; statusSpan.style.background='rgba(0,0,0,0.05)';

    // Dots menu
    const dotsBtn = document.createElement('button');
    dotsBtn.innerHTML = '&#8942;'; dotsBtn.style.border='none'; dotsBtn.style.background='transparent'; dotsBtn.style.cursor='pointer'; dotsBtn.style.fontSize='18px'; dotsBtn.style.padding='6px';
    const menu = document.createElement('div');
    menu.style.position='absolute'; menu.style.display='none'; menu.style.flexDirection='column'; menu.style.background='#fff';
    menu.style.border='1px solid rgba(0,0,0,0.08)'; menu.style.boxShadow='0 6px 20px rgba(0,0,0,0.08)'; menu.style.borderRadius='8px';
    menu.style.right='12px'; menu.style.padding='6px 4px'; menu.style.zIndex='50';
    const reportItem = document.createElement('button'); reportItem.textContent='Report'; reportItem.style.cssText='border:none; padding:8px 12px; background:transparent; cursor:pointer; width:100%; text-align:left;';
    const terminateItem = document.createElement('button'); terminateItem.textContent='Terminate'; terminateItem.style.cssText='border:none; padding:8px 12px; background:transparent; cursor:pointer; width:100%; text-align:left;';
    menu.appendChild(reportItem); menu.appendChild(terminateItem);
    const menuWrapper = document.createElement('div'); menuWrapper.style.position='relative'; menuWrapper.appendChild(dotsBtn); menuWrapper.appendChild(menu);
    rightSide.appendChild(statusSpan); rightSide.appendChild(menuWrapper);

    header.appendChild(titleWrap); header.appendChild(rightSide);
    card.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className='contract-body'; body.style.display='none'; body.style.marginTop='10px';
    body.innerHTML=`
      <div class="contract-preview" style="margin-bottom:10px;">${contract.preview || contract.details || 'No preview available'}</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${contract.paymentReceived ? `<button class="btn-pay" disabled>Paid</button>` : `<button class="btn-pay">Pay Now</button>`}
        <button class="btn-milestone">Complete Milestone</button>
        <button class="btn-expand">View Details</button>
      </div>
    `;
    card.appendChild(body);

    // Header toggle
    header.addEventListener('click', e=>{ if(!e.target.closest('.dotsBtn') && !e.target.closest('.dotsMenu')) body.style.display=body.style.display==='none'?'block':'none'; });

    // Dots toggle
    dotsBtn.addEventListener('click', ev=>{ ev.stopPropagation(); menu.style.display = menu.style.display==='flex'?'none':'flex'; document.querySelectorAll('.dotsMenu').forEach(m=>{if(m!==menu)m.style.display='none';}); });

    // Menu actions
    reportItem.addEventListener('click', ev=>{ ev.stopPropagation(); menu.style.display='none'; openReportModal(contract.id); });
    terminateItem.addEventListener('click', ev=>{ ev.stopPropagation(); menu.style.display='none'; openTerminateModal(contract.id); });

    // Pay Now
    body.querySelector('.btn-pay')?.addEventListener('click', async ev=>{
      ev.stopPropagation(); await handlePayNow(contract.id, card);
    });

    // Milestone
    body.querySelector('.btn-milestone')?.addEventListener('click', async ev=>{
      ev.stopPropagation(); await handleCompleteMilestone(contract.id, card);
    });

    // close menu when clicking outside
    document.addEventListener('click', e=>{ if(!e.target.closest('.dotsMenu') && !e.target.closest('.dotsBtn')) document.querySelectorAll('.dotsMenu').forEach(m=>m.style.display='none'); });

    return card;
  }

  // ---------- Actions ----------
  async function handlePayNow(contractId, cardEl){
    try{
      showToast('Processing payment...');
      const url = `${API_BASE}/contracts/${encodeURIComponent(contractId)}/pay`;
      const res = await fetch(url,{method:'POST', headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders())});
      if(!res.ok) throw new Error('Payment failed');
      cardEl.querySelector('.btn-pay').textContent='Paid'; cardEl.querySelector('.btn-pay').disabled=true;
      const statusEl = cardEl.querySelector('.status'); if(statusEl) statusEl.textContent='Active';
      showToast('Payment received ✅');
    }catch(err){ console.error(err); showToast('Payment failed'); }
  }

  async function handleCompleteMilestone(contractId, cardEl){
    try{
      showToast('Completing milestone...');
      const url = `${API_BASE}/contracts/${encodeURIComponent(contractId)}/milestone`;
      const res = await fetch(url,{method:'POST', headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()), body: JSON.stringify({action:'complete'})});
      if(!res.ok) throw new Error('Failed to complete milestone');
      const updated = await res.json();
      const headerMeta = cardEl.querySelector('.contract-header div > div');
      if(headerMeta) headerMeta.textContent=`Milestones: ${updated.milestonesCompleted||0} • Created: ${new Date(updated.createdAt||Date.now()).toLocaleDateString()}`;
      showToast('Milestone completed');

      const m = updated.milestonesCompleted||0;
      if(m>0 && m%3===0) openReviewModal(contractId);
    }catch(err){ console.error(err); showToast('Could not complete milestone'); }
  }

  // Terminate
  function openTerminateModal(contractId){ modalContext={contractId,action:'terminate'}; terminateReason.value=''; openModal(terminateModal);}
  terminateCancelBtn.addEventListener('click',()=>closeModal(terminateModal));
  terminateSubmitBtn.addEventListener('click',async ()=>{
    const reason = terminateReason.value.trim(); if(!reason) return showToast('Please provide a reason');
    try{
      showToast('Terminating contract...');
      const url = `${API_BASE}/contracts/${encodeURIComponent(modalContext.contractId)}/terminate`;
      const res = await fetch(url,{method:'POST', headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()), body:JSON.stringify({reason})});
      if(!res.ok) throw new Error('Terminate failed');
      await res.json();
      closeModal(terminateModal);
      showToast('Contract terminated');
      const card = document.querySelector(`.contract[data-id="${modalContext.contractId}"]`);
      if(card) card.remove();
    }catch(err){ console.error(err); showToast('Termination failed'); }
  });

  // Report
  function openReportModal(contractId){ modalContext={contractId,action:'report'}; reportText.value=''; openModal(reportModal);}
  reportCancelBtn.addEventListener('click',()=>closeModal(reportModal));
  reportSubmitBtn.addEventListener('click',async ()=>{
    const text = reportText.value.trim(); if(!text) return showToast('Please describe the issue');
    try{
      showToast('Sending report...');
      const url = `${API_BASE}/contracts/${encodeURIComponent(modalContext.contractId)}/report`;
      const res = await fetch(url,{method:'POST', headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()), body:JSON.stringify({report:text})});
      if(!res.ok) throw new Error('Report failed');
      await res.json();
      closeModal(reportModal); showToast('Report submitted');
    }catch(err){ console.error(err); showToast('Report failed');}
  });

  // Review
  function openReviewModal(contractId){ modalContext={contractId,action:'review'}; reviewText.value=''; openModal(reviewModal);}
  reviewCancelBtn.addEventListener('click',()=>closeModal(reviewModal));
  reviewSubmitBtn.addEventListener('click',async ()=>{
    const text = reviewText.value.trim();
    try{
      showToast('Submitting review...');
      const url = `${API_BASE}/contracts/${encodeURIComponent(modalContext.contractId)}/review`;
      const res = await fetch(url,{method:'POST', headers:Object.assign({'Content-Type':'application/json'},getAuthHeaders()), body:JSON.stringify({review:text})});
      if(!res.ok) throw new Error('Review failed');
      await res.json();
      closeModal(reviewModal); showToast('Review submitted');
    }catch(err){ console.error(err); showToast('Could not submit review');}
  });

  modalOverlay.addEventListener('click',()=>{
    [terminateModal,reportModal,reviewModal].forEach(m=>{if(m.style.display==='block')closeModal(m);});
  });

  // ---------- Tabs ----------
  document.querySelectorAll('.tab').forEach(tab=>{
    tab.addEventListener('click', async ()=>{
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      const userId = localStorage.getItem('userId');
      const allContracts = await fetchAllContracts(userId);
      const sorted = sortContracts(allContracts);
      renderContracts(sorted[tab.dataset.tab]||[], tab.dataset.tab);
    });
  });

  // Init
  (async function init(){
    const activeTab = document.querySelector('.tab.active');
    const tab = activeTab ? activeTab.dataset.tab : 'requests';
    const userId = localStorage.getItem('userId');
    const allContracts = await fetchAllContracts(userId);
    const sorted = sortContracts(allContracts);
    renderContracts(sorted[tab]||[], tab);
  })();

})();
   </script>

