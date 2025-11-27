let appeals = [
  {appealId:"A-001", vaultId:"V-993", userId:"UA001", contractId:"C001", otherParty:"UA002", comment:"He mislabeled the device."},
  {appealId:"A-002", vaultId:"V-121", userId:"UA003", contractId:"C005", otherParty:"UA004", comment:"Payment dispute."}
];

let reviewHistory = [];

function renderAppeals(){
  const list=document.getElementById("appealsList");
  list.innerHTML="";
  appeals.forEach(a=>{
    const li=document.createElement("li");
    li.innerHTML=`${a.appealId} &mdash; User ${a.userId}`;
    const b=document.createElement("button");
    b.textContent="Review";
    b.className="review-btn";
    b.onclick=()=>openReview(a.appealId);
    li.appendChild(b);
    list.appendChild(li);
  });
}

function openReview(id){
  const a = appeals.find(x=>x.appealId===id);
  if(!a) return;
  document.getElementById("reviewContent").innerHTML = `
    <p><b>Vault Proof ID:</b> ${a.vaultId}</p>
    <p><b>Primary User:</b> ${a.userId}</p>
    <p><b>Contract:</b> ${a.contractId}</p>
    <p><b>Counterparty:</b> ${a.otherParty}</p>
    <p><b>Statement:</b></p>
    <div style="background:#f5f5f5;padding:1rem;border-radius:8px;border:1px solid #ddd;">${a.comment}</div>
  `;
  window.currentAppeal = a;
  document.getElementById("reviewModal").style.display="flex";
}

function closeReview(){ document.getElementById("reviewModal").style.display="none"; }

document.getElementById("composeEmailBtn")?.addEventListener("click",()=>{
  document.getElementById("emailBody").value = `Case Ref: ${window.currentAppeal.appealId}
Contract: ${window.currentAppeal.contractId}
User: ${window.currentAppeal.userId}

Legal Assessment:
`;
  document.getElementById("emailModal").style.display="flex";
});

function closeEmail(){ document.getElementById("emailModal").style.display="none"; }

function sendEmail(){
  let body=document.getElementById("emailBody").value;
  reviewHistory.push({ ...window.currentAppeal, emailBody:body, timestamp:new Date().toLocaleString() });
  updateSummary();
  alert("Recorded — final email send will be routed to Google Legal API.");
  closeEmail(); closeReview();
}

function updateSummary(){
  const box=document.getElementById("summaryCard");
  if(reviewHistory.length===0){ box.innerHTML="No items reviewed yet."; return; }
  box.innerHTML = reviewHistory.map(r=>`
    <div style="border-bottom:1px solid #ddd;padding:.6rem 0;">
      <b>${r.appealId}</b> — ${r.timestamp}
      <br>Contract: ${r.contractId} — User: ${r.userId}
      <br><i>${r.emailBody.substring(0,120)}...</i>
    </div>
  `).join("");
}

document.getElementById("printBtn").onclick = ()=>window.print();

renderAppeals();
updateSummary();