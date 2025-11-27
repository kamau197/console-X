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

  const page1 = document.getElementById('page1');
  const page2 = document.getElementById('page2');
  const navArrow = document.getElementById('navArrow');
  const bubble1 = document.getElementById('bubble1');
  const bubble2 = document.getElementById('bubble2');
  let currentPage = 1;

  function showPage(pageNumber) {
    if (pageNumber === 1) {
      page1.classList.add('active');
      page2.classList.remove('active');
      navArrow.style.right = '20px';
      navArrow.style.left = '';
      navArrow.textContent = '→';
      bubble1.classList.add('active');
      bubble2.classList.remove('active');
      if (typeof initPage1 === 'function') initPage1();
    } else {
      page2.classList.add('active');
      page1.classList.remove('active');
      navArrow.style.left = '20px';
      navArrow.style.right = '';
      navArrow.textContent = '←';
      bubble2.classList.add('active');
      bubble1.classList.remove('active');
      if (typeof initPage2 === 'function') {
        initPage2();
        // Resize charts once visible
        setTimeout(() => {
          if (window.Chart && Chart.instances) {
            Object.values(Chart.instances).forEach(inst => inst.resize());
          }
        }, 300);
      }
    }
    currentPage = pageNumber;
  }

/* FIX ✅ Continuous page toggle */
navArrow.addEventListener('click', () => {
  currentPage = currentPage === 1 ? 2 : 1;
  showPage(currentPage);
});

document.addEventListener('DOMContentLoaded', () => showPage(1));
  document.addEventListener('DOMContentLoaded', () => showPage(1));
</script>


  <!-- ========= PAGE 1 JS ========= -->
  <script>
    // DROP YOUR PAGE 1 JS HERE
 let pageInitialized = false; 
 function initPage1() {
function initpage1() {
 if (page1Initialzed) return;//prevents multiple set up
     page1Initialzed = true;
      console.log("Page 1 initialized");
 }
      /* ---------- Data (demo) ---------- */
  const contracts = [
    {id:1, tab:'active', title:'Build and design a SaaS landing page', by:'Alexander Heifner', status:'Active contract', statusColor:'var(--mint)', next:'Payment requested on Jul 18', cta:'Review & pay'},
    {id:2, tab:'active', title:'Modifications to TypeScript Gatsby site', by:'Lisa Taylor', status:'Active contract', statusColor:'var(--mint)', next:'Fund a new milestone for Lisa', cta:'Fund & create milestone'},
    {id:3, tab:'active', title:'UI/Web Design Export for PSD', by:'Manuel Jurik', status:'Active contract', statusColor:'var(--mint)', next:'1.30 hrs logged this week ($35.00)', cta:'See contract'},
    {id:4, tab:'open', title:'Hire illustrator for packaging', by:'Draft', status:'Open post', statusColor:'var(--sky)', next:'3 proposals pending', cta:'View proposals'},
    {id:5, tab:'disputed', title:'Bug fix sprint #7', by:'System', status:'Dispute in review', statusColor:'var(--pink)', next:'Awaiting mediator update', cta:'View details'},
    {id:6, tab:'pending', title:'Figma to responsive site', by:'Pending', status:'Awaiting payment', statusColor:'var(--lav)', next:'Payment queued', cta:'Manage'},
    {id:7, tab:'drafts', title:'Brand identity kit', by:'Draft', status:'Draft', statusColor:'var(--lav)', next:'Not published', cta:'Continue draft'},
  ];

  const people = [
    {name:'Natalia C.', location:'Bariloche, AR', rate:'$75/hr', score:'98%', skills:['Illustrator','Branding','Landing Pages']},
    {name:'Alejandro B.', location:'London, UK', rate:'$82/hr', score:'99%', skills:['Logos','Graphics','Presentations']},
    {name:'Marit G.', location:'San Francisco, US', rate:'$65/hr', score:'96%', skills:['Product Design','Prototypes','Figma']},
    {name:'Nazeem D.', location:'Boston, US', rate:'$71/hr', score:'97%', skills:['Animations','Webflow','After Effects']},
    {name:'Kori H.', location:'Berlin, DE', rate:'$60/hr', score:'94%', skills:['Posters','Illustration','Packaging']},
    {name:'Lisa T.', location:'Dublin, IE', rate:'$78/hr', score:'99%', skills:['React','TypeScript','Design Systems']},
  ];

  /* ---------- Utilities ---------- */
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const $ = (sel, ctx=document) => ctx.querySelector(sel);

  const toast = (msg) => {
    const t = document.createElement('div');
    t.className = 'item';
    t.textContent = msg;
    $('#toast').appendChild(t);
    setTimeout(()=> t.remove(), 2800);
  };

  /* ---------- Render functions ---------- */
  function renderCounts(){
    const tabs = ['active','open','disputed','pending','drafts'];
    tabs.forEach(tab=>{
      const n = contracts.filter(c=>c.tab===tab).length;
      const el = document.getElementById(`count-${tab}`);
      if(el) el.textContent = n;
    });
  }

  function renderContracts(activeTab='active'){
    const grid = $('#contractsGrid');
    grid.innerHTML = '';
    const items = contracts.filter(c => activeTab==='priority' ? ['active','open'].includes(c.tab) : c.tab===activeTab);
    if(items.length===0){
      grid.innerHTML = `<div class="card col-4" style="grid-column:1/-1;text-align:center">No items in <b>${activeTab}</b> yet.</div>`;
      return;
    }
    items.forEach(item=>{
      const col = document.createElement('div');
      col.className = 'col-4';
      col.innerHTML = `
        <article class="card">
          <div class="row">
            <span class="chip" style="background: color-mix(in oklab, ${item.statusColor} 50%, white); border-color: color-mix(in oklab, ${item.statusColor} 45%, #e5e7eb)">
              ${item.status}
            </span>
            <div class="spacer"></div>
            <button class="btn secondary">⋯</button>
          </div>
          <h3>${item.title}</h3>
          <div class="subtle">by ${item.by}</div>
          <div class="row" style="margin-top:10px">
            <span class="badge" style="background: color-mix(in oklab, var(--sky) 40%, white); border-color: color-mix(in oklab, var(--sky) 45%, #e5e7eb)">ℹ</span>
            <span class="subtle">${item.next}</span>
          </div>
          <div class="row" style="margin-top:12px">
            <button class="btn" data-action="primary" data-id="${item.id}">${item.cta}</button>
            <button class="btn secondary">Message</button>
          </div>
        </article>`;
      grid.appendChild(col);
    });
  }

  function renderPeople(targetId, list){
    const row = $(targetId);
    row.innerHTML = '';
    list.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'talent';
      card.innerHTML = `
        <div class="row" style="align-items:center">
          <div class="avatar" style="width:44px;height:44px">${p.name.split(' ')[0][0]}${p.name.split(' ')[1]?.[0]||''}</div>
          <div>
            <div style="font-weight:800">${p.name} <span class="subtle">• ${p.rate}</span></div>
            <div class="meta">${p.location} • ${p.score} success</div>
          </div>
          <div class="spacer"></div>
          <button class="btn secondary" title="Save">♡</button>
        </div>
        <div style="margin-top:8px">${p.skills.map(s=>`<span class="badge">${s}</span>`).join('')}</div>
        <div class="row" style="margin-top:12px">
          <button class="btn" data-invite="${p.name}">Invite to job</button>
        </div>
      `;
      row.appendChild(card);
    });
  }

  /* ---------- Event wiring ---------- */
  function setupTabs(){
    $$('#tabs .tab').forEach(tab=>{
      tab.addEventListener('click', ()=>{
        $$('#tabs .tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        renderContracts(tab.dataset.tab);
      });
    });
  }

  function setupActions(){
    document.body.addEventListener('click', (e)=>{
      const target = e.target;

      // Primary contract CTA -> open modal
      if(target.matches('[data-action="primary"]')){
        const id = +target.dataset.id;
        const item = contracts.find(c=>c.id===id);
        $('#modalTitle').textContent = item.cta;
        $('#modalBody').textContent = item.next;
        $('#modalBackdrop').style.display = 'flex';
        $('#note').focus();
      }

      // Invite talent
      if(target.matches('[data-invite]')){
        toast(`Invitation sent to ${target.dataset.invite} 🎉`);
      }

      if(target.id === 'cancelModal'){
        $('#modalBackdrop').style.display = 'none';
      }
      if(target.id === 'confirmPay'){
        $('#modalBackdrop').style.display = 'none';
        toast('Milestone approved and paid 💸');
      }
      if(target.id === 'postJobBtn'){
        toast('Job post wizard opening…');
      }
      if(target.id === 'refreshAgain'){
        toast('Recommendations refreshed ♻️');
        renderPeople('#againRow', people.sort(()=>Math.random()-0.5).slice(0,4));
      }
      if(target.id === 'browseTalent'){
        window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'});
      }
    });

    // Search filter
    $('#searchInput').addEventListener('input', (e)=>{
      const q = e.target.value.toLowerCase().trim();
      const filtered = people.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.skills.join(' ').toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
      renderPeople('#personalRow', filtered.slice(0,6));
    });

    // Close modal with ESC / backdrop
    $('#modalBackdrop').addEventListener('click', (e)=>{
      if(e.target.id==='modalBackdrop') e.currentTarget.style.display='none';
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key==='Escape') $('#modalBackdrop').style.display='none';
    });
  }

  /* ---------- Init ---------- */
  renderCounts();
  renderContracts('active');
  renderPeople('#againRow', people.slice(0,4));
  renderPeople('#personalRow', people.slice(2));

  setupTabs();
  setupActions();
    }
  </script>

  <!-- ========= PAGE 2 JS ========= -->
  <script>
    // DROP YOUR PAGE 2 JS HERE
function toggleApp(el){
    el.classList.toggle('open');
    setTimeout(()=> window.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' }), 250);
  }
function initPage2() {
  console.log("Page 2 initialized");

  

  const pastel = { mint:'#AAF0D1', sky:'#87CEEB', pink:'#FFC1CC', lav:'#E6E6FA', ink:'#1f2937' };
  const chartConfig = (ctx, type, labels, data, color, extra={}) =>
    new Chart(ctx, {
      type,
      data: { labels, datasets:[{ data, borderColor:color, backgroundColor:color, borderWidth:2, tension:0.35, fill:type!=='line' }] },
      options: Object.assign({
        plugins:{ legend:{ display:false } },
        animation:{ duration:800, easing:'easeOutQuart' },
        scales:{
          x:{ ticks:{ color:pastel.ink }, grid:{ color:'#f2f4f7' } },
          y:{ ticks:{ color:pastel.ink }, grid:{ color:'#f2f4f7' } }
        }
      }, extra)
    });

  // Render all charts fresh
  const sets = [
    ['installsChart1','line',['Mon','Tue','Wed','Thu','Fri','Sat'],[120,190,260,300,420,460],pastel.sky],
    ['revenueChart1','bar',['W1','W2','W3','W4'],[400,520,600,1280],pastel.mint],
    ['ratingChart1','line',['Mon','Tue','Wed','Thu','Fri','Sat'],[4.1,4.2,4.3,4.25,4.4,4.45],pastel.pink],
    ['installsChart2','line',['Mon','Tue','Wed','Thu','Fri','Sat'],[80,110,160,200,240,280],pastel.sky],
    ['revenueChart2','bar',['W1','W2','W3','W4'],[150,260,300,400],pastel.mint],
    ['ratingChart2','line',['Mon','Tue','Wed','Thu','Fri','Sat'],[3.9,4.0,4.05,4.1,4.15,4.2],pastel.pink],
  ];
  sets.forEach(([id,t,l,d,c])=>{
    const el = document.getElementById(id);
    if (el) chartConfig(el,t,l,d,c);
  });
}