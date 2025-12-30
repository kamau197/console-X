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

  // Fetch user data from server
  async function loadUserData() {
    try {
      const res = await fetch('/api/user'); // replace with your server endpoint
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      document.getElementById('Name').textContent = data.name || '---';
      document.getElementById('profile-photo').src = data.photo || 'https://i.pravatar.cc/150?img=5';
      document.getElementById('console-id').textContent = data.consoleId || '---';
      document.getElementById('dev-id').textContent = data.devId || '---';
      document.getElementById('ov-rating').textContent = data.ovRating || '---';
      document.getElementById('skills').textContent = data.skills?.join(', ') || '---';
      document.getElementById('contracts').textContent = data.completedContracts || '---';
      document.getElementById('count-active').textContent = data.notifications?.length || 0;

      // Achievements
      const achievementsList = document.getElementById('achievements-list');
      achievementsList.innerHTML = '';
      if (data.achievements?.length) {
        data.achievements.forEach(a => {
          const li = document.createElement('li');
          li.textContent = a;
          achievementsList.appendChild(li);
        });
      } else {
        achievementsList.innerHTML = '<li>No achievements yet</li>';
      }

      // Badges
      if (data.verified) {
        const badge = document.getElementById('badge4');
        badge.classList.add('verified');
        badge.textContent = '✔';
      }

      // Progress
      let progress = 0;
      if (data.name && data.photo && data.location) progress += 33;
      if (data.preferencesSet) progress += 33;
      if (data.verified) progress += 34;
      const progressFill = document.getElementById('progressFill');
      const progressText = document.getElementById('progressText');
      setTimeout(() => {
        progressFill.style.width = progress + '%';
        progressText.textContent = 'Profile setup: ' + progress + '%';
      }, 200);

      // Reviews
      const reviewsList = document.getElementById('reviews-list');
      reviewsList.innerHTML = '';
      if (data.reviews?.length) {
        data.reviews.forEach(r => {
          const li = document.createElement('li');
          li.textContent = r;
          reviewsList.appendChild(li);
        });
      } else {
        reviewsList.innerHTML = '<li>No reviews yet</li>';
      }

        
        // Badges
    const badgeSlots = {
      verified: document.getElementById('badge4'),
      tier: document.getElementById('badge3') // assuming badge3 is tier
    };

    // Verification badge
    if (data.verified) {
      badgeSlots.verified.classList.add('verified');
      badgeSlots.verified.textContent = '✔'; // simple check mark
      badgeSlots.verified.title = 'Verified User';
    } else {
      badgeSlots.verified.classList.remove('verified');
      badgeSlots.verified.textContent = '';
    }

    // Tier badge
    if (data.tier) {
      badgeSlots.tier.classList.add('verified'); // reuse style for highlight
      badgeSlots.tier.textContent = data.tier.toUpperCase(); 
      badgeSlots.tier.title = `${data.tier} Tier`;
    } else {
      badgeSlots.tier.classList.remove('verified');
      badgeSlots.tier.textContent = '';
    }
      // Contracts
      const contractsList = document.getElementById('contracts-list');
      contractsList.innerHTML = '';
      if (data.closedContracts?.length) {
        data.closedContracts.forEach(c => {
          const li = document.createElement('li');
          li.textContent = c;
          contractsList.appendChild(li);
        });
      } else {
        contractsList.innerHTML = '<li>No closed contracts</li>';
      }

    } catch (err) {
      console.error('Error loading user data', err);
    }
  }

  loadUserData();

  // Tab switching
  document.querySelectorAll("#tabs button, #topTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.parentElement;
      parent.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Handle tab panes
      const tabName = btn.dataset.tab;
      if (tabName) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(tabName === 'contracts' ? 'contracts-tab' : tabName);
        if (pane) pane.classList.add('active');
      }
    });
  });

  // Avatar upload
  document.getElementById('fileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      document.getElementById('profile-photo').src = ev.target.result;
      // optionally send to server here
    };
    r.readAsDataURL(file);
  });

// PROFILE TAB SWITCHING (Reviews / Contracts)
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    // remove active from all buttons
    document.querySelectorAll(".tab-btn")
      .forEach(b => b.classList.remove("active"));

    // remove active from all panes
    document.querySelectorAll(".tab-pane")
      .forEach(pane => pane.classList.remove("active"));

    // activate clicked btn
    btn.classList.add("active");

    // activate related pane
    const paneID = btn.dataset.tab === "contracts"
                  ? "contracts-tab"   // matches your HTML
                  : btn.dataset.tab;   // "reviews"
                  
    document.getElementById(paneID).classList.add("active");
  });
});
</script>

