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

const API = {
  base:'/api',
  chats:'/chats.php',
  messages:'/messages.php',
  sendMessage:'/send_message.php',
  createChat:'/create_chat.php',
  markRead:'/mark_read.php',
  getUser:'/get_user.php' // new endpoint for fetching user avatar
};

const me={id:'u_mario',name:'Mario'};

const chatsList=document.getElementById('chatsList');
const messagesEl=document.getElementById('messages');
const chatHeader=document.getElementById('chatHeader');
const chatTitle=document.getElementById('chatTitle');
const chatSub=document.getElementById('chatSub');
const chatAvatar=document.getElementById('chatAvatar');
const composer=document.getElementById('composer');
const composerInput=document.getElementById('messageInput');
const sendBtn=document.getElementById('sendBtn');
const blankState=document.getElementById('blankState');
const createChatBtn=document.getElementById('createChatBtn');
const createChatModal=document.getElementById('createChatModal');
const createChatConfirm=document.getElementById('createChatConfirm');
const createChatCancel=document.getElementById('createChatCancel');
const newChatUserId=document.getElementById('newChatUserId');
const myAvatar=document.getElementById('myAvatar');
const myName=document.getElementById('myName');

let chats=[], activeChat=null, messages=[], pollInterval=null;

// ------------------ helpers ------------------
function fetchJSON(url, opts){return fetch(url, opts).then(r=>{if(!r.ok)throw new Error('Network error');return r.json();});}
function escapeHtml(s){if(s==null)return'';return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function escapeAttr(s){return escapeHtml(s).replace(/"/g,'&quot;');}
function formatTime(ts){if(!ts)return'';const d=new Date(ts*1000);const now=new Date();return d.toDateString()===now.toDateString()?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):d.toLocaleString();}

// ------------------ init ------------------
function init(){
  myName.textContent=me.name;
  myAvatar.textContent=me.name[0].toUpperCase();

  document.getElementById('searchInput')?.addEventListener('input', onSearch);
  sendBtn?.addEventListener('click', sendMessage);
  composerInput?.addEventListener('keydown', e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}});
  createChatBtn?.addEventListener('click', ()=>createChatModal.style.display='flex');
  createChatCancel?.addEventListener('click', ()=>{createChatModal.style.display='none';newChatUserId.value='';});
  createChatConfirm?.addEventListener('click', createNewChatHandler);

  setupAvatarPreview();   // new
  setupNotificationsListener(); // new

  loadChats();
}

// ------------------ chat list ------------------
function loadChats(){
  fetchJSON(`${API.base}${API.chats}`)
    .then(data=>{chats = Array.isArray(data)? data.map(normalizeChat) : []; renderChats();})
    .catch(()=>renderChats());
}

function normalizeChat(c){
  return {
    id:c.id,
    title:c.title||c.name||('Chat '+c.id),
    name:c.name||c.title||null,
    avatar:c.avatar||'',
    last_body:c.last_body||'',
    last_timestamp:c.last_timestamp||0,
    unread:c.unread===1||c.unread===true,
    raw:c
  };
}

function renderChats(){
  if(!chatsList) return;
  chatsList.innerHTML='';
  chats.sort((a,b)=>((b.unread?1:0)-(a.unread?1:0))||((b.last_timestamp||0)-(a.last_timestamp||0)));
  chats.forEach(c=>{
    const node=document.createElement('div');
    node.className='chat-item';
    node.dataset.id=c.id;
    node.dataset.title=c.title;
    node.dataset.snippet=c.last_body;

    const initial=(c.title||c.name||'C')[0].toUpperCase();
    const avatarHtml=c.avatar?`<img src="${escapeAttr(c.avatar)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover">`:`<div class="avatar" style="width:44px;height:44px;font-size:14px;background:#f0e8ff;border:1px solid rgba(16,42,67,0.04);display:flex;align-items:center;justify-content:center">${initial}</div>`;

    node.innerHTML=`<div style="display:flex;gap:10px;align-items:center;width:100%">
      <div style="flex-shrink:0">${avatarHtml}</div>
      <div class="chat-meta" style="flex:1;min-width:0">
        <div class="chat-title">${escapeHtml(c.title)}</div>
        <div class="chat-snippet">${escapeHtml(c.last_body||'')}</div>
      </div>
      ${c.unread?'<span class="dot"></span>':''}
      <div class="chat-time" style="margin-left:8px">${c.last_timestamp?formatTime(c.last_timestamp):''}</div>
    </div>`;

    node.addEventListener('click', ()=>openChat(c));
    chatsList.appendChild(node);
  });
}

// ------------------ create chat ------------------
function createNewChatHandler(){
  const entered=(newChatUserId.value||'').trim();
  if(!entered){alert('Enter a platform ID'); return;}

  const localChat={id:'local_'+Date.now(),title:entered,name:entered,avatar:'',last_body:'',last_timestamp:Math.floor(Date.now()/1000),unread:true};

  fetch(`${API.base}${API.createChat}`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({participant_id:entered})
  })
  .then(r=>r.ok?r.json():Promise.reject())
  .then(serverChat=>{chats.push(normalizeChat(serverChat)); renderChats();})
  .catch(()=>{chats.push(localChat); renderChats();})
  .finally(()=>{createChatModal.style.display='none'; newChatUserId.value=''; newChatAvatarPreview.textContent='?';});
}

// ------------------ open chat ------------------
function openChat(chat){
  if(typeof chat==='string'||typeof chat==='number') chat = chats.find(c=>String(c.id)===String(chat));
  if(!chat) return;

  activeChat=chat;
  Array.from(chatsList.children).forEach(n=>n.classList.toggle('active', n.dataset.id==chat.id));
  chatHeader.style.display=''; composer.style.display=''; blankState.style.display='none';
  chatTitle.textContent=chat.title;
  chatSub.textContent='Chat ID: '+chat.id;
  chatAvatar.textContent=chat.title[0].toUpperCase();

  if(chat.unread){chat.unread=false; renderChats(); fetch(`${API.base}${API.markRead}?chat_id=${encodeURIComponent(chat.id)}`).catch(()=>{});}
  loadMessages(chat.id);

  if(pollInterval) clearInterval(pollInterval);
  pollInterval=setInterval(()=>{
    if(!activeChat) return;
    fetchJSON(`${API.base}${API.messages}?chat_id=${encodeURIComponent(activeChat.id)}`)
      .then(data=>{messages=data; renderMessages();})
      .catch(()=>{});
  },3000);
}

// ------------------ messages ------------------
function loadMessages(chat_id){
  fetchJSON(`${API.base}${API.messages}?chat_id=${encodeURIComponent(chat_id)}`)
    .then(data=>{messages=data; renderMessages();})
    .catch(()=>{messagesEl.innerHTML='<div class="muted">Failed to load messages</div>';});
}

function renderMessages(){
  messagesEl.innerHTML='';
  messages.forEach(m=>{
    const div=document.createElement('div');
    div.className='msg '+(m.sender_id===me.id?'me':'other');
    const senderName=m.sender_name||m.sender_id;
    let avatarHtml='';
    if(m.sender_id!==me.id){
      avatarHtml=m.sender_avatar?`<img src="${escapeAttr(m.sender_avatar)}" style="width:26px;height:26px;border-radius:50%;margin-right:8px">`:`<span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#f3eaf6;color:#4b2b55;font-size:12px;line-height:26px;text-align:center;margin-right:8px">${escapeHtml((senderName||'?')[0])}</span>`;
    }
    div.innerHTML=`<div style="display:flex;align-items:flex-end;gap:8px">
      ${m.sender_id!==me.id?avatarHtml:''}
      <div>
        <div style="font-size:14px">${escapeHtml(m.body)}</div>
        <div class="msg-meta">${formatTime(m.timestamp)} ${m.sender_id===me.id?'• You':'• '+escapeHtml(senderName)}</div>
      </div>
    </div>`;
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop=messagesEl.scrollHeight;
}

// ------------------ send ------------------
function sendMessage(){
  if(!activeChat) return;
  const body=(composerInput.value||'').trim(); if(!body) return;
  sendBtn.disabled=true;
  fetch(`${API.base}${API.sendMessage}`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:activeChat.id,sender_id:me.id,body})
  })
  .then(r=>r.json())
  .then(newMsg=>{
    messages.push(newMsg);
    renderMessages();
    composerInput.value='';
    const ch=chats.find(c=>c.id===activeChat.id);
    if(ch){ ch.last_body=newMsg.body||body; ch.last_timestamp=newMsg.timestamp||Math.floor(Date.now()/1000); ch.unread=false;}
    renderChats();
  })
  .catch(()=>{})
  .finally(()=>sendBtn.disabled=false);
}

// ------------------ search ------------------
function onSearch(e){
  const q=(e.target.value||'').toLowerCase();
  Array.from(chatsList.children).forEach(node=>{
    const title=node.dataset.title.toLowerCase();
    const snippet=node.dataset.snippet.toLowerCase();
    node.style.display=(title.includes(q)||snippet.includes(q))?'':'none';
  });
}

// ------------------ NEW: avatar preview ------------------
let newChatAvatarPreview;
function setupAvatarPreview(){
  newChatAvatarPreview = document.createElement('div');
  newChatAvatarPreview.className='avatar';
  newChatAvatarPreview.style.width='44px';
  newChatAvatarPreview.style.height='44px';
  newChatAvatarPreview.style.fontSize='14px';
  newChatAvatarPreview.style.display='flex';
  newChatAvatarPreview.style.alignItems='center';
  newChatAvatarPreview.style.justifyContent='center';
  newChatAvatarPreview.style.borderRadius='50%';
  newChatAvatarPreview.style.background='#f0e8ff';
  newChatAvatarPreview.style.marginBottom='8px';
  createChatModal.querySelector('.modal-box').insertBefore(newChatAvatarPreview, createChatModal.querySelector('h2'));

  newChatUserId.addEventListener('input', async ()=>{
    const id = newChatUserId.value.trim();
    if(!id){ newChatAvatarPreview.textContent='?'; return; }
    try{
      const res = await fetch(`${API.base}${API.getUser}?id=${encodeURIComponent(id)}`);
      if(!res.ok) throw new Error('No user');
      const data = await res.json();
      if(data.avatar) newChatAvatarPreview.innerHTML = `<img src="${data.avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover">`;
      else newChatAvatarPreview.textContent=(id[0]||'?').toUpperCase();
    }catch{
      newChatAvatarPreview.textContent=(id[0]||'?').toUpperCase();
    }
  });
}

// ------------------ NEW: notifications listener ------------------
function setupNotificationsListener(){
  window.addEventListener('message', e=>{
    if(e.data?.action==='openCreateChat' && e.data.id){
      createChatModal.style.display='flex';
      newChatUserId.value=e.data.id;
      newChatUserId.dispatchEvent(new Event('input')); // fetch avatar
    }
  });
}

init();
</script>
