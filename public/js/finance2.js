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

  // Initial balances
  let currentBalance = 5000;
  let escrowBalance = 2000;
  let withdrawBalance = 3000;
  let transactions = [
    {date:"2025-08-01", type:"Deposit", amount:2000, balance:2000},
    {date:"2025-08-05", type:"Deposit", amount:3000, balance:5000},
    {date:"2025-08-10", type:"Escrow Hold", amount:2000, balance:3000},
  ];

  function updateBalances() {
    document.getElementById("currentBalance").innerText = `Ksh ${currentBalance.toFixed(2)}`;
    document.getElementById("escrowBalance").innerText = `Ksh ${escrowBalance.toFixed(2)}`;
    document.getElementById("withdrawBalance").innerText = `Ksh ${withdrawBalance.toFixed(2)}`;
    updateTransactionTable();
  }

  function updateTransactionTable() {
    const tbody = document.getElementById("transactionBody");
    tbody.innerHTML = "";
    transactions.slice().reverse().forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td style="padding:6px;">${tx.date}</td>
                      <td style="padding:6px;">${tx.type}</td>
                      <td style="padding:6px; text-align:right;">${tx.amount.toFixed(2)}</td>
                      <td style="padding:6px; text-align:right;">${tx.balance.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Withdrawal logic
  function processWithdrawal() {
    const amount = parseFloat(document.getElementById("withdrawAmount").value);
    if(isNaN(amount) || amount<=0){ showToast("Enter valid amount!", "error"); return;}
    if(amount>withdrawBalance){ showToast("Insufficient balance!", "error"); return;}
    withdrawBalance -= amount;
    currentBalance -= amount;
    transactions.push({date: new Date().toISOString().split("T")[0], type:"Withdrawal", amount:amount, balance:currentBalance});
    updateBalances();
    closeWithdrawModal();
    showToast(`Withdrawal of Ksh ${amount} successful!`, "success");
  }

  // Toast system
  function showToast(message,type){
    const container=document.getElementById("toastContainer");
    const toast=document.createElement("div");
    toast.className=`item animate-fade-in`;
    toast.style.backgroundColor = type==="success" ? "var(--mint)" : "var(--pink)";
    toast.innerText=message;
    container.appendChild(toast);
    setTimeout(()=>{toast.remove()},3000);
  }

  // Chart.js Transaction Progress
  const ctx = document.getElementById("financeChart").getContext("2d");
  const financeChart = new Chart(ctx,{
    type:"line",
    data:{
      labels: transactions.map(tx=>tx.date),
      datasets:[{
        label:"Balance (Ksh)",
        data: transactions.map(tx=>tx.balance),
        borderColor:"var(--sky)",
        backgroundColor:"rgba(135,206,235,0.2)",
        tension:0.3,
        fill:true
      }]
    },
    options:{responsive:true, plugins:{legend:{display:true}}}
  });

  updateBalances();

  // Track KYC status
  let kycVerified = false;

  // Open flow → check KYC before showing withdrawal modal
  function openWithdrawModal() {
    if(!kycVerified){
      document.getElementById("kycModal").style.display="flex";
    } else {
      document.getElementById("withdrawModal").style.display="flex";
    }
  }

  // Close modals
  function closeWithdrawModal() { document.getElementById("withdrawModal").style.display="none"; }
  function closeKycModal() { document.getElementById("kycModal").style.display="none"; }

  // Handle KYC submission
  function submitKyc(){
    const name = document.getElementById("kycName").value.trim();
    const idNum = document.getElementById("kycId").value.trim();
    const address = document.getElementById("kycAddress").value.trim();
    const file = document.getElementById("kycFile").files[0];

    if(!name || !idNum || !address || !file){
      showToast("Please fill in all KYC fields!", "error");
      return;
    }

    // Simulate KYC approval (would normally go to backend)
    kycVerified = true;
    showToast("KYC verified successfully!", "success");
    closeKycModal();

    // Now open the withdrawal modal
    document.getElementById("withdrawModal").style.display="flex";

  }
</script>
