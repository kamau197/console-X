
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

const people=[
  {name:'Natalia C.',location:'Bariloche, AR',rate:'$75/hr',score:'98%',year:2022,skills:['Illustrator','Branding','Landing Pages']},
  {name:'Alejandro B.',location:'London, UK',rate:'$82/hr',score:'99%',year:2023,skills:['Logos','Graphics','Presentations']},
  {name:'Marit G.',location:'Nervada, US',rate:'$65/hr',score:'96%',year:2021,skills:['Product Design','Prototypes','Figma']},
  {name:'Nazeem D.',location:'Boston, US',rate:'$71/hr',score:'97%',year:2024,skills:['Animations','Webflow','After Effects']},
  {name:'Kori H.',location:'Berlin, DE',rate:'$60/hr',score:'94%',year:2020,skills:['Posters','Illustration','Packaging']},
  {name:'Lisa T.',location:'Dublin, IE',rate:'$78/hr',score:'99%',year:2023,skills:['React','TypeScript','Design Systems']},
];

const $$=(sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));
const $=(sel,ctx=document)=>ctx.querySelector(sel);

const toast=(msg)=>{const t=document.createElement('div');t.className='item';t.textContent=msg;$('#toast').appendChild(t);setTimeout(()=>t.remove(),2800);};

function renderPeople(targetId,list){const row=$(targetId);row.innerHTML='';list.forEach(p=>{const col=document.createElement('div');col.className='col-3';col.innerHTML=`
      <article class="card">
        <div class="row" style="align-items:center">
          <div class="avatar" style="width:44px;height:44px">${p.name.split(' ')[0][0]}${p.name.split(' ')[1]?.[0]||''}</div>
          <div><div style="font-weight:800">${p.name} <span class="subtle">• ${p.rate}</span></div><div class="meta">${p.location} • ${p.score} success</div></div>
          <div class="spacer"></div>
          <button class="btn secondary" title="Save">♡</button>
        </div>
        <div style="margin-top:8px">${p.skills.map(s=>`<span class="badge">${s}</span>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn secondary" data-invite="${p.name}">Invite to job</button><button class="btn ">Available now</button></div>
      </article>`;row.appendChild(col);});}

document.addEventListener('click',e=>{const target=e.target;if(target.matches('[data-invite]')){toast(`Request sent to ${target.dataset.invite} 🎉`);} if(target.id==='refreshAgain'){toast('Recommendations refreshed ♻️');renderPeople('#againRow',people.sort(()=>Math.random()-0.5).slice(0,4));}});

$('#searchInput').addEventListener('input',(e)=>{const q=e.target.value.toLowerCase().trim();const filtered=people.filter(p=>p.name.toLowerCase().includes(q)||p.skills.join(' ').toLowerCase().includes(q)||p.location.toLowerCase().includes(q));renderPeople('#personalRow',filtered.slice(0,6));});

$('#GetListed').addEventListener('click',()=>{$('#onboardModal').style.display='flex';});
$('#closeModal').addEventListener('click',()=>{$('#onboardModal').style.display='none';});

// Enable/disable submit button based on checkboxes
const grantAccess=$('#grantAccess');
const terms=$('#terms');
const submitBtn=$('#submitBtn');
function toggleSubmit(){submitBtn.disabled=!(grantAccess.checked && terms.checked);}
grantAccess.addEventListener('change',toggleSubmit);
terms.addEventListener('change',toggleSubmit);

renderPeople('#againRow',people.slice(0,4));
renderPeople('#personalRow',people.slice(2));

// === Filter Modal Logic ===
const filterModal = document.getElementById('filterModal');
const openFilterBtn = document.getElementById('filterToggle');
const closeFilterBtn = document.getElementById('closeFilter');

openFilterBtn.addEventListener('click', () => filterModal.style.display = 'flex');
closeFilterBtn.addEventListener('click', () => filterModal.style.display = 'none');
filterModal.addEventListener('click', (e) => { if (e.target === filterModal) filterModal.style.display = 'none'; });

// Toggle active buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => btn.classList.toggle('active'));
});

// Apply Filters
document.getElementById('applyFilter').addEventListener('click', () => {
  const filters = {};
  document.querySelectorAll('.filter-section').forEach(section => {
    const key = section.dataset.filter;
    const active = [...section.querySelectorAll('.filter-btn.active')].map(b => b.dataset.value);
    if (active.length > 0) filters[key] = active;
  });

  let filtered = people.filter(p => {
    let match = true;
    if (filters.year) {
      if (filters.year.includes('old')) match &&= p.year >= 2011 && p.year <= 2017;
      if (filters.year.includes('new')) match &&= p.year >= 2018;
    }
    if (filters.type) match &&= filters.type.includes(p.type?.toLowerCase());
    if (filters.contract) match &&= filters.contract.includes(p.contract);
    if (filters.niche) match &&= filters.niche.includes(p.niche?.toLowerCase());
    return match;
  });

  renderPeople('#personalRow', filtered.slice(0, 6));
  toast('Filter applied ✅');
  filterModal.style.display = 'none';
});