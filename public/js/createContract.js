// Generate unique contract ID globally once
const generatedContractId = "CX-" + Math.floor(Math.random() * 1000000000);
const qs = s => document.querySelector(s);
const milestoneList = qs('#milestoneList');
const contractTypeSelect = qs('#contractType');
const publishingFeeInput = qs('#publishingFee');
const rentalFeeInput = qs('#rentalFee');
const rentalCommissionInput = qs('#rentalCommission');
const escrowAccount = qs('#escrowAccount');
const escrowLedger = qs('#escrowLedger');
const startDate = qs('#startDate');
const endDate = qs('#endDate');
const upfrontInput = qs('#upfrontAmount');
const finalizeBtn = qs('#finalizeBtn');
const downloadBtn = qs('#downloadPreview');

// NEW auto email field refs
const partyAEmailField = qs('#partyAEmail');
const partyBEmailField = qs('#partyBEmail');

let milestoneCount = 0;

// ---------- NEW LOGIC STARTS HERE -----------

// Fake DB lookup simulation
async function fetchUserEmailById(userId) {
  // In real deployment we will run:
  // const res = await fetch(`/api/user-email?userId=${userId}`);
  // const data = await res.json();
  // return data.email;

  // Simulation values for now
  if (!userId) return "";
  return "account-" + userId + "@example.com";
}

async function autofillEmails() {
  const userAId = qs('#userId').value;
  const userBId = qs('#partyBId').value;

  partyAEmailField.value = await fetchUserEmailById(userAId);
  partyBEmailField.value = await fetchUserEmailById(userBId);
}

// Fake "confirm identity" verification simulation
let verificationStatus = false;

async function triggerEmailOwnershipCheck(email) {
  console.log("Sending identity verification to:", email);

  // Real system: pushes to consoleX mobile/desktop logged in account  
  // and updates DB entry.

  // We simulate them confirming after 3 seconds:
  setTimeout(() => {
    verificationStatus = true;
    console.log("User verified:", email);
    qs('#emailVerifyStatus').innerText = "Verified ✔";
  }, 3000);
}

// Runs every 10 minutes until verified — placeholder worker
setInterval(async () => {
  if (!verificationStatus && partyBEmailField.value) {
    console.log("re-checking account verification...");
    // Here a real API will check DB:
    // /check-verification-status?email=x
  }
}, 10 * 60 * 1000);

// ------------- NEW LOGIC ENDS HERE ----------

function parseNum(v){const n=parseFloat(v);return Number.isFinite(n)?n:0;}
function monthsBetween(s,e){
  if(!s||!e)return 1;
  const d1=new Date(s),d2=new Date(e);
  let m=(d2.getFullYear()-d1.getFullYear())*12+(d2.getMonth()-d1.getMonth());
  m+=(d2.getDate()>=d1.getDate())?1:0;
  return Math.max(1,m);
}
function sanitizeNumberInput(i){
  const v=parseFloat(i.value);
  if(Number.isFinite(v)&&v>=0)i.value=v;
  else if(i.value!=='')i.value='';
}
function recalcUpfront(){
  const up=parseNum(publishingFeeInput.value)+(parseNum(rentalFeeInput.value)/2);
  upfrontInput.value=up.toFixed(2);
}
function ensureCompleteAtBottom(){
  const items=[...milestoneList.querySelectorAll('.ms-item')];
  const complete=items.find(i=>(i.querySelector('.ms-title')?.value||'').toLowerCase().includes('complete contract'));
  if(complete)milestoneList.appendChild(complete);
}
function addMilestone({title='New milestone',extra='',locked=false}={}){
  milestoneCount++;
  const div=document.createElement('div');
  div.className='ms-item'+(locked?' locked':'');
  div.innerHTML=`
    <div>
      <input type="text" class="ms-title" value="${title}" ${locked?'readonly':''}>
      ${extra}
    </div>
    <div></div>
    <div style="text-align:center">
      <input type="checkbox" class="ms-done" ${locked?'disabled':''}>
    </div>`;
  milestoneList.appendChild(div);
  ensureCompleteAtBottom();
  renderPreview();
}

function monthsToRevenueMilestones(){
  const m=monthsBetween(startDate.value,endDate.value);
  let mult=0,type='';
  if(escrowAccount.checked){mult=1;type='Escrow Account';}
  else if(escrowLedger.checked){mult=4;type='Escrow Ledger';}
  return Array.from({length:m*mult},(_,i)=>({title:`Revenue Release ${i+1}`,type}));
}

function addBaseMilestones(type){
  milestoneList.innerHTML='';
  milestoneCount=0;
  const rev=monthsToRevenueMilestones();
  if(type==='GA'){
    addMilestone({title:'Party B makes upfront payment',extra:'<button class="btn ghost">Send Payment Link</button>',locked:true});

    // <<<<<< NEW FIELD DISPLAYED TO PARTY B
    addMilestone({
      title:'Grant access milestone',
      extra:`<div>Email to grant access to: <strong>${partyAEmailField.value}</strong></div>`,
      locked:true
    });

    rev.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
    addMilestone({title:'Complete contract milestone',locked:true});
  }
  else if(type==='SA'){
    addMilestone({title:'Pay upfront milestone',extra:'<button class="btn ghost">Make Payment</button>',locked:true});
    addMilestone({title:'Party B uploads APK',locked:true});
    rev.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
    addMilestone({title:'Complete contract milestone',locked:true});
  }
  else if(type==='TA'){
    addMilestone({title:'Party B uploads transfer asset (image/form)',extra:'<input type="file" accept="image/*,.pdf"/>',locked:true});

    const div=document.createElement('div');div.className='ms-item locked';
    div.innerHTML=`
      <div>
        <input type="text" class="ms-title" value="Choose format for remaining milestones" readonly/>
        <select class="ta-format">
          <option value="">-- Select --</option>
          <option value="GA">GA</option>
          <option value="SA">SA</option>
        </select>
      </div>
      <div></div><div></div>`;
    milestoneList.appendChild(div);
    const sel=div.querySelector('.ta-format');

    sel.addEventListener('change',()=>{
      if(!sel.value)return;
      sel.disabled=true;
      const val=sel.value;
      const rev2=monthsToRevenueMilestones();
      if(val==='GA'){
        addMilestone({title:'Party B makes upfront payment',locked:true});
        addMilestone({
          title:'Grant access milestone',
          extra:`<div>Email: <strong>${partyAEmailField.value}</strong></div>`,
          locked:true
        });
        rev2.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
        addMilestone({title:'Complete contract milestone',locked:true});
      } else if(val==='SA'){
        addMilestone({title:'Pay upfront milestone',locked:true});
        addMilestone({title:'Party B uploads APK',locked:true});
        rev2.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
        addMilestone({title:'Complete contract milestone',locked:true});
      }
      ensureCompleteAtBottom();
      renderPreview();
    });
    addMilestone({title:'Complete contract milestone',locked:true});
  }
  ensureCompleteAtBottom();
  renderPreview();
}

function gatherMilestones(){
  return [...milestoneList.querySelectorAll('.ms-item')].map(n=>{
    const t=n.querySelector('.ms-title')?.value||'';
    const d=n.querySelector('.ms-done')?.checked||false;
    return {title:t,done:d};
  });
}

function renderPreview(){
  const A=qs('#partyA').value||'[Party A]',
        B=qs('#partyB').value||'[Party B]',
        idA=qs('#userId').value||'[A-ID]',
        idB=qs('#partyBId').value||'[B-ID]',
        type=contractTypeSelect.value||'N/A',
        start=startDate.value||'[Start]',
        end=endDate.value||'[End]',
        pf=parseNum(publishingFeeInput.value).toFixed(2),
        rf=parseNum(rentalFeeInput.value).toFixed(2),
        rc=rentalCommissionInput.value||'0',
        up=upfrontInput.value||'0',
        revType=escrowAccount.checked?'Escrow Account':(escrowLedger.checked?'Escrow Ledger':'None'),
        disc=qs('#disclaimer').value||'',
        comment=qs('#comment').value||'',
        ms=gatherMilestones();

  const msHtml = ms.length
    ? '<ol>'+ms.map(m=>`<li><strong>${m.title}</strong> <input type='checkbox' ${m.done?'checked':''} disabled></li>`).join('')+'</ol>'
    : '<i>No milestones defined.</i>';

  const contractIdHtml = `<strong>Contract ID:</strong> ${generatedContractId}<br><br>`;

  qs('#previewContent').innerHTML=`
    <h2 style="margin-top:0">Agreement between ${A} and ${B}</h2>
    ${contractIdHtml}
    <div class="small">Party A ID: ${idA} | Party B ID: ${idB}</div>
    <div class="small">Contract Type: ${type}</div>
    <div class="small">Party A Email: ${partyAEmailField.value}</div>
    <div class="small">Party B Email: ${partyBEmailField.value}</div>
    <hr>
    <strong>Contract Duration:</strong> ${start} → ${end}<br>
    <strong>Publishing Fee:</strong> ${pf}<br>
    <strong>Rental Fee:</strong> ${rf}<br>
    <strong>Rental Commission (%):</strong> ${rc}<br>
    <strong>Upfront Payment:</strong> ${up}<br>
    <strong>Revenue Release Type:</strong> ${revType}
    <hr>
    <strong>Milestones</strong>${msHtml}
    <hr>
    <strong>Additional Comments</strong><br>
    ${comment ? `<em>${comment}</em>` : '<i>No comments provided.</i>'}
    <hr>
    <div class="small"><strong>Disclaimer:</strong> ${disc}</div>
    <a href="https://consolex.example.com/terms" target="_blank" style="color:#6a5acd;font-size:0.9em;text-decoration:none;">View full Terms & Conditions</a>`;
}

// === Event Listeners ===
contractTypeSelect.addEventListener('change',()=>{
  addBaseMilestones(contractTypeSelect.value);
});

// numeric listeners
[publishingFeeInput, rentalFeeInput, rentalCommissionInput].forEach(i =>
  i.addEventListener('input', () => { sanitizeNumberInput(i); recalcUpfront(); renderPreview(); })
);

// re-render milestone on date or escrow changes
[startDate, endDate, escrowAccount, escrowLedger].forEach(i =>
  i.addEventListener('change', () => {
    if(contractTypeSelect.value) addBaseMilestones(contractTypeSelect.value);
    renderPreview();
  })
);

qs('#comment').addEventListener('input', renderPreview);

qs('#addMilestone').addEventListener('click',()=>addMilestone());
qs('#clearMilestones').addEventListener('click',()=>{
  milestoneList.querySelectorAll('.ms-item').forEach(n=>{
    if(!n.classList.contains('locked')) n.remove();
  });
  ensureCompleteAtBottom();
  renderPreview();
});
finalizeBtn.addEventListener('click',()=>{
  alert('Contract finalized and sealed!');
  renderPreview();
});
downloadBtn.addEventListener('click',()=>{
  const c=qs('#previewContent').innerHTML;
  const b=new Blob([`<html><head><meta charset='utf-8'><title>Contract Preview</title></head><body>${c}</body></html>`],{type:'text/html'});
  const u=URL.createObjectURL(b);
  const a=document.createElement('a');
  a.href=u;a.download='ContractPreview.html';a.click();
  URL.revokeObjectURL(u);
});

renderPreview();
autofillEmails();  const items=[...milestoneList.querySelectorAll('.ms-item')];
  const complete=items.find(i=>(i.querySelector('.ms-title')?.value||'').toLowerCase().includes('complete contract'));
  if(complete)milestoneList.appendChild(complete);
}
function addMilestone({title='New milestone',extra='',locked=false}={}){
  milestoneCount++;
  const div=document.createElement('div');
  div.className='ms-item'+(locked?' locked':'');
  div.innerHTML=`
    <div>
      <input type="text" class="ms-title" value="${title}" ${locked?'readonly':''}>
      ${extra}
    </div>
    <div></div>
    <div style="text-align:center">
      <input type="checkbox" class="ms-done" ${locked?'disabled':''}>
    </div>`;
  milestoneList.appendChild(div);
  ensureCompleteAtBottom();
  renderPreview();
}

function monthsToRevenueMilestones(){
  const m=monthsBetween(startDate.value,endDate.value);
  let mult=0,type='';
  if(escrowAccount.checked){mult=1;type='Escrow Account';}
  else if(escrowLedger.checked){mult=4;type='Escrow Ledger';}
  return Array.from({length:m*mult},(_,i)=>({title:`Revenue Release ${i+1}`,type}));
}

function addBaseMilestones(type){
  milestoneList.innerHTML='';
  milestoneCount=0;
  const rev=monthsToRevenueMilestones();
  if(type==='GA'){
    addMilestone({title:'Party B makes upfront payment',extra:'<button class="btn ghost">Send Payment Link</button>',locked:true});
    addMilestone({title:'Grant access milestone',locked:true});
    rev.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
    addMilestone({title:'Complete contract milestone',locked:true});
  }
  else if(type==='SA'){
    addMilestone({title:'Pay upfront milestone',extra:'<button class="btn ghost">Make Payment</button>',locked:true});
    addMilestone({title:'Party B uploads APK',locked:true});
    rev.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
    addMilestone({title:'Complete contract milestone',locked:true});
  }
  else if(type==='TA'){
    addMilestone({title:'Party B uploads transfer asset (image/form)',extra:'<input type="file" accept="image/*,.pdf"/>',locked:true});
    const div=document.createElement('div');div.className='ms-item locked';
    div.innerHTML=`
      <div>
        <input type="text" class="ms-title" value="Choose format for remaining milestones" readonly/>
        <select class="ta-format">
          <option value="">-- Select --</option>
          <option value="GA">GA</option>
          <option value="SA">SA</option>
        </select>
      </div>
      <div></div><div></div>`;
    milestoneList.appendChild(div);
    const sel=div.querySelector('.ta-format');
    sel.addEventListener('change',()=>{
      if(!sel.value)return;
      sel.disabled=true;
      const val=sel.value;
      const rev2=monthsToRevenueMilestones();
      if(val==='GA'){
        addMilestone({title:'Party B makes upfront payment',locked:true});
        addMilestone({title:'Grant access milestone',locked:true});
        rev2.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
        addMilestone({title:'Complete contract milestone',locked:true});
      } else if(val==='SA'){
        addMilestone({title:'Pay upfront milestone',locked:true});
        addMilestone({title:'Party B uploads APK',locked:true});
        rev2.forEach(r=>addMilestone({title:r.title,extra:`<div class='small'>${r.type}</div>`,locked:true}));
        addMilestone({title:'Complete contract milestone',locked:true});
      }
      ensureCompleteAtBottom();
      renderPreview();
    });
    addMilestone({title:'Complete contract milestone',locked:true});
  }
  ensureCompleteAtBottom();
  renderPreview();
}

function gatherMilestones(){
  return [...milestoneList.querySelectorAll('.ms-item')].map(n=>{
    const t=n.querySelector('.ms-title')?.value||'';
    const d=n.querySelector('.ms-done')?.checked||false;
    return {title:t,done:d};
  });
}

function renderPreview(){
  const A=qs('#partyA').value||'[Party A]',
        B=qs('#partyB').value||'[Party B]',
        idA=qs('#userId').value||'[A-ID]',
        idB=qs('#partyBId').value||'[B-ID]',
        type=contractTypeSelect.value||'N/A',
        start=startDate.value||'[Start]',
        end=endDate.value||'[End]',
        pf=parseNum(publishingFeeInput.value).toFixed(2),
        rf=parseNum(rentalFeeInput.value).toFixed(2),
        rc=rentalCommissionInput.value||'0',
        up=upfrontInput.value||'0',
        revType=escrowAccount.checked?'Escrow Account':(escrowLedger.checked?'Escrow Ledger':'None'),
        disc=qs('#disclaimer').value||'',
        comment=qs('#comment').value||'',
        ms=gatherMilestones();

  const msHtml = ms.length
    ? '<ol>'+ms.map(m=>`<li><strong>${m.title}</strong> <input type='checkbox' ${m.done?'checked':''} disabled></li>`).join('')+'</ol>'
    : '<i>No milestones defined.</i>';

const contractIdHtml = `<strong>Contract ID:</strong> ${generatedContractId}<br><br>`;

qs('#previewContent').innerHTML=`
  <h2 style="margin-top:0">Agreement between ${A} and ${B}</h2>
  ${contractIdHtml}
  <div class="small">Party A ID: ${idA} | Party B ID: ${idB}</div>
  <div class="small">Contract Type: ${type}</div>
  <hr>
  <strong>Contract Duration:</strong> ${start} → ${end}<br>
  <strong>Publishing Fee:</strong> ${pf}<br>
  <strong>Rental Fee:</strong> ${rf}<br>
  <strong>Rental Commission (%):</strong> ${rc}<br>
  <strong>Upfront Payment:</strong> ${up}<br>
  <strong>Revenue Release Type:</strong> ${revType}
  <hr>
  <strong>Milestones</strong>${msHtml}
  <hr>
  <strong>Additional Comments</strong><br>
  ${comment ? `<em>${comment}</em>` : '<i>No comments provided.</i>'}
  <hr>
  <div class="small"><strong>Disclaimer:</strong> ${disc}</div>
  <a href="https://consolex.example.com/terms" target="_blank" style="color:#6a5acd;font-size:0.9em;text-decoration:none;">View full Terms & Conditions</a>`;
}

// === Event Listeners ===
contractTypeSelect.addEventListener('change',()=>addBaseMilestones(contractTypeSelect.value));

[publishingFeeInput, rentalFeeInput, rentalCommissionInput].forEach(i =>
  i.addEventListener('input', () => { sanitizeNumberInput(i); recalcUpfront(); renderPreview(); })
);

[startDate, endDate, escrowAccount, escrowLedger].forEach(i =>
  i.addEventListener('change', () => {
    if(contractTypeSelect.value) addBaseMilestones(contractTypeSelect.value);
    renderPreview();
  })
);

// Live update for comment field
qs('#comment').addEventListener('input', renderPreview);

qs('#addMilestone').addEventListener('click',()=>addMilestone());
qs('#clearMilestones').addEventListener('click',()=>{
  milestoneList.querySelectorAll('.ms-item').forEach(n=>{
    if(!n.classList.contains('locked')) n.remove();
  });
  ensureCompleteAtBottom();
  renderPreview();
});
finalizeBtn.addEventListener('click',()=>{
  alert('Contract finalized and sealed!');
  renderPreview();
});
downloadBtn.addEventListener('click',()=>{
  const c=qs('#previewContent').innerHTML;
  const b=new Blob([`<html><head><meta charset='utf-8'><title>Contract Preview</title></head><body>${c}</body></html>`],{type:'text/html'});
  const u=URL.createObjectURL(b);
  const a=document.createElement('a');
  a.href=u;a.download='ContractPreview.html';a.click();
  URL.revokeObjectURL(u);
});



renderPreview();

document.addEventListener("click", async e => {
  if (!e.target.classList.contains("sendLinkBtn")) return;

  let amount = upfrontInput.value;
  let contractId = generatedContractId;
  let emailReceiver = partyBEmailField.value;

  let url =
    `https://consolex.example.com/pay?contractId=${contractId}&amount=${amount}&role=B`;

  //  SEND TO SERVER
  await fetch('/api/send-payment-link', {
    method: 'POST',
    body: JSON.stringify({ link: url, email: emailReceiver }),
    headers: { "Content-Type": "application/json" }
  });

  alert("Payment link sent to: " + emailReceiver);
});

document.addEventListener("click", e => {
  if (!e.target.classList.contains("makePaymentBtn")) return;

  let amount = upfrontInput.value;
  let contractId = generatedContractId;

  openPaymentModal(amount, contractId);
});


