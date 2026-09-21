(function(){

  /* ---------------- Theme (light / dark) ---------------- */
  const SUN_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';
  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-toggle-btn').innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    localStorage.setItem('circle_theme', theme);
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(localStorage.getItem('circle_theme') || (prefersDark ? 'dark' : 'light'));
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ======================================================================
     REAL-TIME LAYER
     A production build of this app would open a native WebSocket (or a
     Socket.io connection) to a backend server, which persists data in a
     database and pushes events to every connected client, e.g.:

         const socket = new WebSocket("wss://api.circle.app/socket");
         socket.onmessage = (e) => applyEvent(JSON.parse(e.data));
         socket.send(JSON.stringify({ type: "like", postId }));

     This deliverable runs entirely in the browser with no backend, so the
     same publish/subscribe contract is implemented with BroadcastChannel
     (a native browser API for real, low-latency messaging between tabs of
     the same origin) and localStorage as the shared "database". Every
     mutation is written to localStorage, then broadcast to every other
     open tab, which reloads the data and re-renders instantly — the same
     event-driven flow a WebSocket server would drive. Open this file in
     two browser tabs, "view as" two different people, and like/comment/
     send a friend request in one tab to see it update the other in
     real time.
     ====================================================================== */
  function RealtimeSocket(channelName){
    const bc = ('BroadcastChannel' in window) ? new BroadcastChannel(channelName) : null;
    const listeners = {};
    if (bc){
      bc.onmessage = (e) => {
        const { type, payload } = e.data || {};
        (listeners[type] || []).forEach(cb => cb(payload));
      };
    }
    return {
      on(type, cb){ (listeners[type] = listeners[type] || []).push(cb); },
      emit(type, payload){ if (bc) bc.postMessage({ type, payload }); }
    };
  }
  const socket = RealtimeSocket('circle-realtime');

  /* ---------------- "Database" (localStorage) ---------------- */
  const DB_KEY = 'circle_db_v4';
  const AUTH_KEY = 'circle_auth_user_id';
  const PALETTE = ['#1F6F54', '#C98A2C', '#C0546B', '#55647A', '#B06A45'];

  function illustrationDashboard(){
    return 'images/dashboard.png';
  }

  function illustrationDesk(){
    return 'images/desk.png';
  }

  function seedDB(){
    const now = Date.now();
    const users = [
      { id:'u1', name:'Mahzil Sohail', handle:'@mahzilsohail', email:'mahzil@example.com', password:'password123', bio:'Building things on the internet, one small ship at a time. 🌱', friends:['u2','u3'], savedPosts:[], privacy:{ profile:'public', defaultPost:'public' }, color:'#1F6F54' },
      { id:'u2', name:'Zara Malik', handle:'@zara.codes', email:'zara@example.com', password:'password123', bio:'Product designer. Coffee-powered. Currently obsessed with grid systems.', friends:['u1','u3'], savedPosts:[], privacy:{ profile:'public', defaultPost:'friends' }, color:'#C98A2C' },
      { id:'u3', name:'Hamza Iqbal', handle:'@hamzadev', email:'hamza@example.com', password:'password123', bio:'Backend engineer. I speak fluent SQL and mild sarcasm.', friends:['u1','u2'], savedPosts:[], privacy:{ profile:'friends', defaultPost:'public' }, color:'#C0546B' },
      { id:'u4', name:'Sana Tariq', handle:'@sana.t', email:'sana@example.com', password:'password123', bio:'Photographer & tea enthusiast. Always looking for good light.', friends:[], savedPosts:[], privacy:{ profile:'public', defaultPost:'public' }, color:'#55647A' },
      { id:'u5', name:'Bilal Ahmed', handle:'@bilal.a', email:'bilal@example.com', password:'password123', bio:'Marketing lead, ex-founder, full-time dad joke supplier.', friends:[], savedPosts:[], privacy:{ profile:'public', defaultPost:'friends' }, color:'#B06A45' },
    ];

    const posts = [
      { id:'p1', authorId:'u2', text:'Finally shipped the redesign 🎉 six weeks, four rounds of feedback, and a lot of coffee.', image: illustrationDashboard(), visibility:'friends', ts: now - 1000*60*40, likes:['u3'], comments:[ { id:'c1', authorId:'u3', text:'Looks incredible! That grid is so clean.', ts: now - 1000*60*30 } ] },
      { id:'p2', authorId:'u3', text:'Debugging is just being the detective in a crime movie where you are also the murderer.', image:null, visibility:'public', ts: now - 1000*60*60*3, likes:['u1','u2'], comments:[] },
      { id:'p3', authorId:'u1', text:'Excited to start building more in public this month. New project, new lessons, probably new bugs too.', image:null, visibility:'public', ts: now - 1000*60*60*6, likes:[], comments:[ { id:'c2', authorId:'u2', text:"Let's gooo 🚀", ts: now - 1000*60*60*5 } ] },
      { id:'p4', authorId:'u4', text:'Coffee, laptop, and a to-do list longer than my arm ☕ good morning, circle.', image: illustrationDesk(), visibility:'public', ts: now - 1000*60*60*20, likes:[], comments:[] },
      { id:'p5', authorId:'u5', text:'Friends-only thought: is anyone else\'s inbox a warzone on Mondays or is it just me.', image:null, visibility:'friends', ts: now - 1000*60*60*30, likes:[], comments:[] },
    ];

    const friendRequests = [
      { id:'fr1', from:'u4', to:'u1', ts: now - 1000*60*50 }
    ];

    const notifications = [
      { id:'n1', userId:'u1', type:'friend_request', fromUserId:'u4', postId:null, text:'Sana Tariq sent you a friend request', ts: now - 1000*60*50, read:false },
      { id:'n2', userId:'u1', type:'comment', fromUserId:'u2', postId:'p3', text:'Zara Malik commented on your post', ts: now - 1000*60*60*5, read:false },
    ];

    const messages = [
      { id:'m1', from:'u2', to:'u1', text:"Hey! Did you get a chance to look at the new grid system?", ts: now - 1000*60*60*2, read:true },
      { id:'m2', from:'u1', to:'u2', text:"Yes! It's really clean, love the spacing.", ts: now - 1000*60*60*2 + 1000*60*3, read:true },
      { id:'m3', from:'u2', to:'u1', text:"Glad you like it 🎉 let me know if anything looks off on your end.", ts: now - 1000*60*45, read:false },
    ];

    return { users, posts, friendRequests, notifications, messages, seq: 100 };
  }

  function loadDB(){
    let data;
    try{
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) throw new Error('empty');
      data = JSON.parse(raw);
    }catch(e){
      data = seedDB();
    }
    // defensive migration in case of a partially-shaped or older record
    if (!Array.isArray(data.messages)) data.messages = [];
    if (!Array.isArray(data.friendRequests)) data.friendRequests = [];
    if (!Array.isArray(data.notifications)) data.notifications = [];
    if (!Array.isArray(data.posts)) data.posts = [];
    if (!Array.isArray(data.users)) data.users = [];
    
    data.users.forEach((u, idx) => {
      if (!Array.isArray(u.savedPosts)) u.savedPosts = [];
      if (!Array.isArray(u.friends)) u.friends = [];
      if (!u.privacy) u.privacy = { profile:'public', defaultPost:'public' };
      if (!u.email) u.email = u.handle ? u.handle.replace('@', '') + '@example.com' : `user${idx+1}@example.com`;
      if (!u.password) u.password = 'password123';
      if (!u.color) u.color = PALETTE[idx % PALETTE.length];
    });
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return data;
  }
  function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  function nextId(db, prefix){ db.seq += 1; return prefix + db.seq; }

  let db = loadDB();
  let currentUserId = localStorage.getItem(AUTH_KEY) || null;
  if (currentUserId && !db.users.find(u => u.id === currentUserId)){
    currentUserId = null;
    localStorage.removeItem(AUTH_KEY);
  }

  let openMenuPostId = null;
  let feedFilter = 'all'; // 'all' | 'saved'
  let activeChatWith = null; // userId of open chat thread, or null
  const openComments = new Set();
  const seenMessageIds = new Set(currentUserId ? db.messages.filter(m => m.to === currentUserId).map(m => m.id) : []);
  const onlineHeartbeats = new Map(); // userId -> last-seen timestamp (in-memory presence)
  const seenNotifIds = new Set(currentUserId ? db.notifications.filter(n => n.userId === currentUserId).map(n => n.id) : []);

  function currentUser(){ return currentUserId ? db.users.find(u => u.id === currentUserId) : null; }
  function userById(id){ return db.users.find(u => u.id === id); }
  function colorFor(id){
    const u = userById(id);
    if (u && u.color) return u.color;
    const i = db.users.findIndex(x => x.id === id);
    return PALETTE[Math.max(i,0) % PALETTE.length];
  }
  function initials(name){ return (name || '?').split(' ').filter(Boolean).map(p => p[0]).slice(0,2).join('').toUpperCase() || '?'; }
  function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  function timeAgo(ts){
    const diff = Math.max(0, Date.now() - ts);
    const m = Math.floor(diff/60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m/60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h/24);
    return d + 'd ago';
  }

  function visIcon(vis){
    if (vis === 'public') return '<svg class="vis-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>';
    if (vis === 'friends') return '<svg class="vis-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>';
    return '<svg class="vis-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V8a5 5 0 0110 0v3"/></svg>';
  }
  function visLabel(vis){ return vis === 'public' ? 'Public' : vis === 'friends' ? 'Friends' : 'Only me'; }

  function areFriends(a, b){ const u = userById(a); return !!(u && u.friends.includes(b)); }

  function canSeePost(post, viewerId){
    if (post.authorId === viewerId) return true;
    if (post.visibility === 'public') return true;
    if (post.visibility === 'friends') return areFriends(post.authorId, viewerId);
    return false;
  }

  function avatarEl(userId, size){
    const u = userById(userId);
    const cls = size === 'mini' ? 'mini-avatar' : 'avatar';
    return `<div class="${cls}" style="background:${colorFor(userId)}" data-profile="${userId}">${initials(u.name)}</div>`;
  }

  /* ---------------- Notifications ---------------- */
  function addNotification(recipientId, type, fromUserId, postId, text){
    if (recipientId === fromUserId) return;
    const n = { id: nextId(db,'n'), userId: recipientId, type, fromUserId, postId, text, ts: Date.now(), read: false };
    db.notifications.unshift(n);
    return n;
  }

  function notifIcon(type){
    if (type === 'like') return '❤️';
    if (type === 'comment') return '💬';
    if (type === 'friend_request') return '👥';
    if (type === 'friend_accept') return '✅';
    return '🔔';
  }

  /* ---------------- Mutations ---------------- */
  function persistAndBroadcast(){ saveDB(db); socket.emit('sync', {}); }

  function toggleLike(postId){
    const post = db.posts.find(p => p.id === postId);
    if (!post) return;
    const uid = currentUserId;
    const i = post.likes.indexOf(uid);
    if (i === -1){
      post.likes.push(uid);
      addNotification(post.authorId, 'like', uid, postId, `${currentUser().name} liked your post`);
    } else {
      post.likes.splice(i, 1);
    }
    persistAndBroadcast();
    renderAll();
  }

  function addComment(postId, text){
    const post = db.posts.find(p => p.id === postId);
    if (!post || !text.trim()) return;
    const c = { id: nextId(db,'c'), authorId: currentUserId, text: text.trim(), ts: Date.now() };
    post.comments.push(c);
    addNotification(post.authorId, 'comment', currentUserId, postId, `${currentUser().name} commented on your post`);
    persistAndBroadcast();
    openComments.add(postId);
    renderAll();
  }

  function deleteComment(postId, commentId){
    const post = db.posts.find(p => p.id === postId);
    if (!post) return;
    post.comments = post.comments.filter(c => c.id !== commentId);
    persistAndBroadcast();
    renderAll();
  }

  function deletePost(postId){
    if (!confirm('Delete this post? This cannot be undone.')) return;
    db.posts = db.posts.filter(p => p.id !== postId);
    db.users.forEach(u => { u.savedPosts = u.savedPosts.filter(id => id !== postId); });
    persistAndBroadcast();
    renderAll();
  }

  function editPost(postId){
    const post = db.posts.find(p => p.id === postId);
    if (!post || post.authorId !== currentUserId) return;
    const val = prompt('Edit your post', post.text);
    if (val == null) return;
    post.text = val.trim();
    post.edited = true;
    persistAndBroadcast();
    renderAll();
  }

  function toggleSave(postId){
    const u = currentUser();
    const i = u.savedPosts.indexOf(postId);
    if (i === -1) u.savedPosts.push(postId);
    else u.savedPosts.splice(i, 1);
    persistAndBroadcast();
    renderFeed();
  }

  function createPost(text, image, visibility){
    const p = { id: nextId(db,'p'), authorId: currentUserId, text: text.trim(), image: image || null, visibility, ts: Date.now(), likes:[], comments:[] };
    db.posts.unshift(p);
    persistAndBroadcast();
    renderAll();
  }

  function sendFriendRequest(toId){
    const exists = db.friendRequests.find(r => (r.from === currentUserId && r.to === toId) || (r.from === toId && r.to === currentUserId));
    if (exists) return;
    const r = { id: nextId(db,'fr'), from: currentUserId, to: toId, ts: Date.now() };
    db.friendRequests.push(r);
    addNotification(toId, 'friend_request', currentUserId, null, `${currentUser().name} sent you a friend request`);
    persistAndBroadcast();
    renderAll();
  }

  function cancelFriendRequest(reqId){
    db.friendRequests = db.friendRequests.filter(r => r.id !== reqId);
    persistAndBroadcast();
    renderAll();
  }

  function acceptFriendRequest(reqId){
    const r = db.friendRequests.find(x => x.id === reqId);
    if (!r) return;
    const a = userById(r.from), b = userById(r.to);
    if (!a.friends.includes(b.id)) a.friends.push(b.id);
    if (!b.friends.includes(a.id)) b.friends.push(a.id);
    db.friendRequests = db.friendRequests.filter(x => x.id !== reqId);
    addNotification(r.from, 'friend_accept', currentUserId, null, `${currentUser().name} accepted your friend request`);
    persistAndBroadcast();
    renderAll();
  }

  function declineFriendRequest(reqId){
    db.friendRequests = db.friendRequests.filter(x => x.id !== reqId);
    persistAndBroadcast();
    renderAll();
  }

  function updateBio(){
    const u = currentUser();
    const val = prompt('Update your bio', u.bio);
    if (val == null) return;
    u.bio = val.trim();
    persistAndBroadcast();
    renderAll();
  }

  /* ---------------- Direct messages ---------------- */
  function sendMessage(toId, text){
    if (!text.trim()) return;
    if (!areFriends(currentUserId, toId)) return;
    const m = { id: nextId(db,'m'), from: currentUserId, to: toId, text: text.trim(), ts: Date.now(), read: false };
    db.messages.push(m);
    persistAndBroadcast();
    renderMessagesDropdown();
    if (activeChatWith === toId) renderChatModal();
  }

  function conversationsFor(userId){
    const partnerIds = new Set();
    db.messages.forEach(m => {
      if (m.from === userId) partnerIds.add(m.to);
      if (m.to === userId) partnerIds.add(m.from);
    });
    return Array.from(partnerIds).map(pid => {
      const thread = db.messages.filter(m => (m.from === userId && m.to === pid) || (m.from === pid && m.to === userId));
      const last = thread.slice().sort((a,b) => b.ts - a.ts)[0];
      const unread = thread.filter(m => m.to === userId && !m.read).length;
      return { partnerId: pid, last, unread };
    }).sort((a,b) => b.last.ts - a.last.ts);
  }

  function unreadMessagesCount(userId){
    return db.messages.filter(m => m.to === userId && !m.read).length;
  }

  function openChat(withUserId){
    activeChatWith = withUserId;
    db.messages.forEach(m => { if (m.from === withUserId && m.to === currentUserId) m.read = true; });
    saveDB(db);
    renderChatModal();
    renderMessagesDropdown();
    document.getElementById('msg-dropdown').classList.remove('open');
    document.getElementById('profile-modal-overlay').classList.remove('open');
    document.getElementById('chat-modal-overlay').classList.add('open');
  }

  function closeChat(){
    activeChatWith = null;
    document.getElementById('chat-modal-overlay').classList.remove('open');
  }

  function renderChatModal(){
    if (!activeChatWith) return;
    const partner = userById(activeChatWith);
    const thread = db.messages.filter(m => (m.from === currentUserId && m.to === activeChatWith) || (m.from === activeChatWith && m.to === currentUserId)).sort((a,b) => a.ts - b.ts);
    const content = document.getElementById('chat-modal-content');
    content.innerHTML = `
      <div class="chat-header">
        ${avatarEl(partner.id,'mini')}
        <div>
          <div class="name">${escapeHtml(partner.name)}</div>
          <div class="sub">${escapeHtml(partner.handle)}</div>
        </div>
        <button id="chat-close-btn" title="Close">&times;</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        ${thread.length ? thread.map(m => `
          <div class="chat-bubble-row ${m.from === currentUserId ? 'mine' : ''}">
            <div>
              <div class="chat-bubble">${escapeHtml(m.text)}</div>
              <div class="chat-bubble-time">${timeAgo(m.ts)}</div>
            </div>
          </div>
        `).join('') : '<div class="chat-empty">Say hello 👋</div>'}
      </div>
      <div class="chat-input-row">
        <input type="text" id="chat-input" placeholder="Message ${escapeHtml(partner.name.split(' ')[0])}…">
        <button id="chat-send-btn" title="Send"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
      </div>
    `;
    document.getElementById('chat-close-btn').addEventListener('click', closeChat);
    const send = () => {
      const input = document.getElementById('chat-input');
      if (input.value.trim()){ sendMessage(activeChatWith, input.value); input.value = ''; }
    };
    document.getElementById('chat-send-btn').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    const box = document.getElementById('chat-messages');
    box.scrollTop = box.scrollHeight;
  }

  function renderMessagesDropdown(){
    if (!currentUserId){
      const badge = document.getElementById('msg-badge');
      if (badge) badge.style.display = 'none';
      const listEl = document.getElementById('msg-list');
      if (listEl) listEl.innerHTML = '<div class="dropdown-empty">Please log in.</div>';
      return;
    }
    const unread = unreadMessagesCount(currentUserId);
    const badge = document.getElementById('msg-badge');
    badge.style.display = unread ? 'flex' : 'none';
    badge.textContent = unread > 9 ? '9+' : unread;

    const convos = conversationsFor(currentUserId).filter(c => areFriends(currentUserId, c.partnerId));
    const listEl = document.getElementById('msg-list');
    listEl.innerHTML = convos.length ? convos.map(c => {
      const p = userById(c.partnerId);
      if (!p) return '';
      const mine = c.last.from === currentUserId;
      return `<div class="msg-row ${c.unread ? 'unread' : ''}" data-open-chat="${p.id}">
        ${avatarEl(p.id,'mini')}
        <div class="m-meta">
          <div class="m-name">${escapeHtml(p.name)}${c.unread ? '<span class="msg-unread-dot"></span>' : ''}</div>
          <div class="m-preview">${mine ? 'You: ' : ''}${escapeHtml(c.last.text)}</div>
        </div>
        <div class="m-time">${timeAgo(c.last.ts)}</div>
      </div>`;
    }).join('') : '<div class="dropdown-empty">No conversations yet — message a friend to start one.</div>';
  }

  /* ---------------- Online presence (heartbeat over the real-time layer) ---------------- */
  function markOnline(userId){
    onlineHeartbeats.set(userId, Date.now());
  }
  function isOnline(userId){
    const last = onlineHeartbeats.get(userId);
    return !!last && (Date.now() - last < 8000);
  }

  function removeFriend(friendId){
    if (!confirm('Remove this friend? You can send a new request later.')) return;
    const u = currentUser(), f = userById(friendId);
    u.friends = u.friends.filter(id => id !== friendId);
    f.friends = f.friends.filter(id => id !== currentUserId);
    persistAndBroadcast();
    renderAll();
  }

  /* ---------------- Auth & Session Management ---------------- */
  function showAuthOverlay(tab = 'login'){
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    switchAuthTab(tab);
    renderDemoChips();
  }

  function hideAuthOverlay(){
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function switchAuthTab(tab){
    const isLogin = tab === 'login';
    document.getElementById('tab-login-btn').classList.toggle('active', isLogin);
    document.getElementById('tab-signup-btn').classList.toggle('active', !isLogin);
    document.getElementById('login-panel').classList.toggle('active', isLogin);
    document.getElementById('signup-panel').classList.toggle('active', !isLogin);

    const lErr = document.getElementById('login-error');
    const sErr = document.getElementById('signup-error');
    if (lErr){ lErr.style.display = 'none'; lErr.textContent = ''; }
    if (sErr){ sErr.style.display = 'none'; sErr.textContent = ''; }
  }

  function renderDemoChips(){
    const list = document.getElementById('demo-chips-list');
    if (!list) return;
    list.innerHTML = db.users.map(u => `
      <button type="button" class="demo-chip" data-demo-login="${u.id}" title="Log in as ${escapeHtml(u.name)}">
        <div class="mini-avatar" style="background:${colorFor(u.id)}">${initials(u.name)}</div>
        <span>${escapeHtml(u.name.split(' ')[0])}</span>
      </button>
    `).join('');
  }

  function login(userId, showWelcomeToast = true){
    const u = userById(userId);
    if (!u) return;
    currentUserId = userId;
    localStorage.setItem(AUTH_KEY, userId);

    openComments.clear();
    seenNotifIds.clear();
    db.notifications.filter(n => n.userId === currentUserId).forEach(n => seenNotifIds.add(n.id));
    seenMessageIds.clear();
    db.messages.filter(m => m.to === currentUserId).forEach(m => seenMessageIds.add(m.id));

    hideAuthOverlay();
    renderAll();
    resetComposerVisibility();
    markOnline(currentUserId);
    socket.emit('presence', { userId: currentUserId });

    if (showWelcomeToast){
      showToast(`Welcome back, ${u.name}! 👋`, '✨');
    }
  }

  function logout(){
    if (currentUserId){
      socket.emit('presence_leave', { userId: currentUserId });
    }
    currentUserId = null;
    localStorage.removeItem(AUTH_KEY);

    // Close all open dialogs & menus
    closeChat();
    document.getElementById('profile-modal-overlay').classList.remove('open');
    document.getElementById('user-dropdown').classList.remove('open');
    document.getElementById('user-menu-wrap').classList.remove('open');
    document.getElementById('notif-dropdown').classList.remove('open');
    document.getElementById('msg-dropdown').classList.remove('open');

    renderAll();
    showAuthOverlay('login');
    showToast('You have been logged out.', '🚪');
  }

  function registerUser(name, handle, email, password, bio, color){
    let cleanHandle = handle.trim();
    if (!cleanHandle.startsWith('@')) cleanHandle = '@' + cleanHandle;

    const cleanEmail = email.trim().toLowerCase();
    const existingHandle = db.users.find(u => u.handle.toLowerCase() === cleanHandle.toLowerCase());
    if (existingHandle){
      throw new Error(`Username ${cleanHandle} is already taken.`);
    }
    const existingEmail = db.users.find(u => (u.email || '').toLowerCase() === cleanEmail);
    if (existingEmail){
      throw new Error(`An account with email ${cleanEmail} already exists.`);
    }

    const newUser = {
      id: nextId(db, 'u'),
      name: name.trim(),
      handle: cleanHandle,
      email: cleanEmail,
      password: password,
      bio: bio.trim() || 'Building things & sharing with my circle. 🌱',
      friends: [],
      savedPosts: [],
      privacy: { profile: 'public', defaultPost: 'public' },
      color: color || PALETTE[0]
    };

    db.users.push(newUser);
    persistAndBroadcast();
    login(newUser.id, false);
    showToast(`Welcome to Circle, ${newUser.name}! 🎉`, '✨');
  }

  /* ---------------- Rendering ---------------- */
  function renderUserMenu(){
    const authBtns = document.getElementById('topbar-auth-btns');
    const userWrap = document.getElementById('user-menu-wrap');

    if (!currentUserId || !currentUser()){
      if (authBtns) authBtns.style.display = 'flex';
      if (userWrap) userWrap.style.display = 'none';
      return;
    }

    if (authBtns) authBtns.style.display = 'none';
    if (userWrap) userWrap.style.display = 'flex';

    const u = currentUser();
    const av = document.getElementById('viewer-avatar');
    if (av){
      av.style.background = colorFor(u.id);
      av.textContent = initials(u.name);
    }

    const nm = document.getElementById('user-menu-name');
    if (nm) nm.textContent = u.name.split(' ')[0];

    const bigAv = document.getElementById('user-menu-big-avatar');
    if (bigAv){
      bigAv.style.background = colorFor(u.id);
      bigAv.textContent = initials(u.name);
    }

    const fullNameEl = document.getElementById('user-menu-full-name');
    if (fullNameEl) fullNameEl.textContent = u.name;

    const handleEl = document.getElementById('user-menu-handle');
    if (handleEl) handleEl.textContent = u.handle;
  }

  function renderProfileCard(){
    const u = currentUser();
    if (!u){
      document.getElementById('profile-name').textContent = 'Circle';
      document.getElementById('profile-handle').textContent = '@community';
      document.getElementById('profile-bio').textContent = 'Please log in to share posts and connect.';
      document.getElementById('stat-friends').textContent = '0';
      document.getElementById('stat-posts').textContent = '0';
      return;
    }
    document.getElementById('profile-cover').style.background = `linear-gradient(135deg, ${colorFor(u.id)}, ${colorFor(db.users[(db.users.indexOf(u)+2)%db.users.length].id)})`;
    const av = document.getElementById('profile-avatar');
    av.style.background = colorFor(u.id);
    av.textContent = initials(u.name);
    av.removeAttribute('data-profile');
    document.getElementById('profile-name').textContent = u.name;
    document.getElementById('profile-handle').textContent = u.handle;
    document.getElementById('profile-bio').textContent = u.bio || 'No bio yet.';
    document.getElementById('stat-friends').textContent = u.friends.length;
    document.getElementById('stat-posts').textContent = db.posts.filter(p => p.authorId === u.id).length;
    document.getElementById('profile-visibility').value = u.privacy.profile;
    document.getElementById('default-post-visibility').value = u.privacy.defaultPost;
    document.getElementById('composer-avatar').style.background = colorFor(u.id);
    document.getElementById('composer-avatar').textContent = initials(u.name);
  }

  function resetComposerVisibility(){
    if (!currentUser()) return;
    document.getElementById('composer-visibility').value = currentUser().privacy.defaultPost;
  }

  function renderFeed(){
    const feedEl = document.getElementById('feed');
    if (!currentUserId || !currentUser()){
      feedEl.innerHTML = `<div class="panel empty-feed"><div class="glyph">◐</div>Please log in or sign up to view and interact with posts.</div>`;
      return;
    }
    const query = (document.getElementById('search-input').value || '').trim().toLowerCase();
    let list = db.posts.filter(p => canSeePost(p, currentUserId));
    if (feedFilter === 'saved'){
      const saved = new Set(currentUser().savedPosts || []);
      list = list.filter(p => saved.has(p.id));
    }
    if (query){
      list = list.filter(p => {
        const author = userById(p.authorId);
        return p.text.toLowerCase().includes(query) || (author && (author.name.toLowerCase().includes(query) || author.handle.toLowerCase().includes(query)));
      });
    }
    list = list.slice().sort((a,b) => b.ts - a.ts);

    if (list.length === 0){
      feedEl.innerHTML = `<div class="panel empty-feed"><div class="glyph">◐</div>${query ? 'No posts match your search.' : (feedFilter === 'saved' ? 'Nothing saved yet — tap the bookmark on a post to save it.' : 'No posts to show yet.')}</div>`;
      return;
    }

    feedEl.innerHTML = list.map(p => {
      const author = userById(p.authorId) || { id: 'unknown', name: 'Unknown User', handle: '@unknown' };
      const liked = p.likes.includes(currentUserId);
      const saved = (currentUser().savedPosts || []).includes(p.id);
      const commentsOpen = openComments.has(p.id);
      const mine = p.authorId === currentUserId;
      return `
      <div class="panel post-card" data-post="${p.id}">
        <div class="post-head">
          ${avatarEl(author.id)}
          <div class="post-head-meta">
            <div class="post-name-row">
              <span class="post-name" data-profile="${author.id}">${escapeHtml(author.name)}</span>
            </div>
            <div class="post-sub">${escapeHtml(author.handle)} · ${timeAgo(p.ts)}${p.edited ? ' · edited' : ''} · ${visIcon(p.visibility)} ${visLabel(p.visibility)}</div>
          </div>
          ${mine ? `<button class="post-menu-btn" data-edit="${p.id}" title="Edit post">✎</button><button class="post-menu-btn" data-delete="${p.id}" title="Delete post">&times;</button>` : ''}
        </div>
        ${p.text ? `<div class="post-text">${escapeHtml(p.text)}</div>` : ''}
        ${p.image ? `<div class="post-image"><img src="${p.image}" alt="" data-lightbox="${p.image}"></div>` : ''}
        <div class="post-actions">
          <button class="action-btn ${liked ? 'liked' : ''}" data-like="${p.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg>
            ${p.likes.length ? p.likes.length : ''} Like${p.likes.length===1?'':'s'}
          </button>
          <button class="action-btn" data-comment-toggle="${p.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            ${p.comments.length ? p.comments.length : ''} Comment${p.comments.length===1?'':'s'}
          </button>
          <button class="action-btn action-right ${saved ? 'saved' : ''}" data-save="${p.id}" title="${saved ? 'Remove from saved' : 'Save post'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </button>
        </div>
        <div class="comments-wrap ${commentsOpen ? 'open' : ''}">
          ${p.comments.map(c => {
            const cu = userById(c.authorId) || { id: 'unknown', name: 'Unknown User' };
            const canDelete = c.authorId === currentUserId || mine;
            return `<div class="comment-row">${avatarEl(cu.id,'mini')}<div class="comment-bubble"><span class="c-name" data-profile="${cu.id}">${escapeHtml(cu.name)}</span>${escapeHtml(c.text)}</div>${canDelete ? `<button class="comment-del" data-delete-comment="${p.id}|${c.id}" title="Delete comment">&times;</button>` : ''}</div>`;
          }).join('')}
          <div class="comment-row" style="align-items:center;">
            ${avatarEl(currentUserId,'mini')}
            <div class="comment-input-row" style="flex:1;">
              <input type="text" placeholder="Write a comment…" data-comment-input="${p.id}">
              <button data-comment-send="${p.id}" title="Send"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderRightPanel(){
    const u = currentUser();
    if (!u){
      document.getElementById('incoming-requests').innerHTML = '<div class="empty-mini">Please log in.</div>';
      document.getElementById('suggestions').innerHTML = '<div class="empty-mini">Please log in.</div>';
      document.getElementById('friends-list').innerHTML = '<div class="empty-mini">Please log in.</div>';
      return;
    }
    const incoming = db.friendRequests.filter(r => r.to === u.id);
    const sent = db.friendRequests.filter(r => r.from === u.id);
    const connectedIds = new Set([...u.friends, ...incoming.map(r=>r.from), ...sent.map(r=>r.to), u.id]);
    const suggestions = db.users.filter(x => !connectedIds.has(x.id));

    const incEl = document.getElementById('incoming-requests');
    incEl.innerHTML = incoming.length ? incoming.map(r => {
      const from = userById(r.from);
      return `<div class="req-row">${avatarEl(from.id,'mini')}<div class="req-meta"><div class="name" data-profile="${from.id}">${escapeHtml(from.name)}</div><div class="sub">${timeAgo(r.ts)}</div></div>
        <div class="row-actions">
          <button class="btn-sm btn-accept" data-accept="${r.id}">Accept</button>
          <button class="btn-sm btn-decline" data-decline="${r.id}">Decline</button>
        </div></div>`;
    }).join('') : '<div class="empty-mini">No pending requests.</div>';

    const suggEl = document.getElementById('suggestions');
    suggEl.innerHTML = suggestions.length ? suggestions.map(s => {
      return `<div class="sugg-row">${avatarEl(s.id,'mini')}<div class="req-meta"><div class="name" data-profile="${s.id}">${escapeHtml(s.name)}</div><div class="sub">${escapeHtml(s.handle)}</div></div>
        <div class="row-actions"><button class="btn-sm btn-add" data-addfriend="${s.id}">Add</button></div></div>`;
    }).join('') : '<div class="empty-mini">No suggestions right now.</div>';

    const friendsEl = document.getElementById('friends-list');
    const friendsHtml = u.friends.map(fid => {
      const f = userById(fid);
      if (!f) return '';
      return `<div class="friend-row">${avatarEl(f.id,'mini')}<div class="req-meta"><div class="name" data-profile="${f.id}"><span class="presence-dot ${isOnline(f.id) ? 'online' : ''}"></span> ${escapeHtml(f.name)}</div><div class="sub">${isOnline(f.id) ? 'Active now' : escapeHtml(f.handle)}</div></div>
        <div class="row-actions"><button class="btn-sm msg-btn" data-open-chat="${f.id}" title="Message">💬</button><button class="btn-sm btn-decline" data-remove-friend="${f.id}" title="Remove friend">&times;</button></div></div>`;
    }).join('');
    const sentHtml = sent.map(r => {
      const to = userById(r.to);
      if (!to) return '';
      return `<div class="friend-row" style="opacity:.7;">${avatarEl(to.id,'mini')}<div class="req-meta"><div class="name">${escapeHtml(to.name)}</div><div class="sub">Request sent</div></div>
        <div class="row-actions"><button class="btn-sm btn-requested" data-cancel="${r.id}">Cancel</button></div></div>`;
    }).join('');
    friendsEl.innerHTML = (friendsHtml + sentHtml) || '<div class="empty-mini">No friends yet — send a request!</div>';
  }

  function renderNotifications(){
    if (!currentUserId){
      const badge = document.getElementById('notif-badge');
      if (badge) badge.style.display = 'none';
      const listEl = document.getElementById('notif-list');
      if (listEl) listEl.innerHTML = '<div class="dropdown-empty">Please log in.</div>';
      return;
    }
    const list = db.notifications.filter(n => n.userId === currentUserId).sort((a,b) => b.ts - a.ts);
    const unread = list.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    badge.style.display = unread ? 'flex' : 'none';
    badge.textContent = unread > 9 ? '9+' : unread;

    const listEl = document.getElementById('notif-list');
    listEl.innerHTML = list.length ? list.map(n => `
      <div class="notif-row ${n.read ? '' : 'unread'}">
        <div class="n-icon">${notifIcon(n.type)}</div>
        <div><div class="n-text">${escapeHtml(n.text)}</div><div class="n-time">${timeAgo(n.ts)}</div></div>
      </div>
    `).join('') : '<div class="dropdown-empty">You\'re all caught up.</div>';
  }

  function renderAll(){
    renderUserMenu();
    renderProfileCard();
    renderFeed();
    renderRightPanel();
    renderNotifications();
    renderMessagesDropdown();
  }

  /* ---------------- Toasts ---------------- */
  function showToast(text, icon){
    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="t-icon">${icon || '🔔'}</span><span>${escapeHtml(text)}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4500);
  }

  /* ---------------- Profile modal ---------------- */
  /* ---------------- Lightbox ---------------- */
  function openLightbox(src){
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-overlay').classList.add('open');
  }
  function closeLightbox(){
    document.getElementById('lightbox-overlay').classList.remove('open');
    document.getElementById('lightbox-img').src = '';
  }

  function openProfileModal(userId){
    const u = userById(userId);
    const viewer = currentUserId;
    const overlay = document.getElementById('profile-modal-overlay');
    const content = document.getElementById('profile-modal-content');

    let allowed = true;
    if (u.id !== viewer){
      if (u.privacy.profile === 'onlyme') allowed = false;
      if (u.privacy.profile === 'friends' && !areFriends(u.id, viewer)) allowed = false;
    }

    if (!allowed){
      content.innerHTML = `
        <div class="modal-cover" style="background:linear-gradient(135deg, ${colorFor(u.id)}, #999)"></div>
        <div class="modal-body">
          <button class="modal-close" id="modal-close-btn">&times;</button>
          <div style="clear:both;"></div>
          <div class="modal-locked">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V8a5 5 0 0110 0v3"/></svg>
            <div><b>${escapeHtml(u.name)}</b>'s profile is private.</div>
            <div>${u.privacy.profile === 'onlyme' ? 'Only they can view it.' : 'Only friends can view it.'}</div>
          </div>
        </div>`;
    } else {
      const theirPosts = db.posts.filter(p => p.authorId === u.id && canSeePost(p, viewer)).sort((a,b)=>b.ts-a.ts).slice(0,3);
      content.innerHTML = `
        <div class="modal-cover" style="background:linear-gradient(135deg, ${colorFor(u.id)}, ${colorFor(db.users[(db.users.indexOf(u)+2)%db.users.length].id)})"></div>
        <div class="modal-body">
          <button class="modal-close" id="modal-close-btn">&times;</button>
          <div style="clear:both;"></div>
          <div class="avatar" style="background:${colorFor(u.id)}">${initials(u.name)}</div>
          <div class="profile-name">${escapeHtml(u.name)}</div>
          <div class="profile-handle">${escapeHtml(u.handle)}</div>
          <div class="profile-bio">${escapeHtml(u.bio || 'No bio yet.')}</div>
          <div class="profile-stats"><div><b>${u.friends.length}</b> friends</div><div><b>${db.posts.filter(p=>p.authorId===u.id).length}</b> posts</div></div>
          ${u.id !== viewer && areFriends(u.id, viewer) ? `<button class="msg-btn" style="margin-top:10px;" data-open-chat="${u.id}">💬 Message</button>` : ''}
          ${theirPosts.length ? `<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px;">
            ${theirPosts.map(p => `<div style="font-size:12.5px;color:var(--muted);padding:6px 0;border-bottom:1px solid var(--line);">${escapeHtml(p.text.slice(0,90))}${p.text.length>90?'…':''}</div>`).join('')}
          </div>` : ''}
        </div>`;
    }
    overlay.classList.add('open');
    document.getElementById('modal-close-btn').addEventListener('click', () => overlay.classList.remove('open'));
  }

  /* ---------------- Event delegation ---------------- */
  document.addEventListener('click', (e) => {
    const profileTrigger = e.target.closest('[data-profile]');
    if (profileTrigger){ openProfileModal(profileTrigger.getAttribute('data-profile')); return; }

    const likeBtn = e.target.closest('[data-like]');
    if (likeBtn){ toggleLike(likeBtn.getAttribute('data-like')); return; }

    const cToggle = e.target.closest('[data-comment-toggle]');
    if (cToggle){
      const id = cToggle.getAttribute('data-comment-toggle');
      openComments.has(id) ? openComments.delete(id) : openComments.add(id);
      renderFeed();
      return;
    }

    const cSend = e.target.closest('[data-comment-send]');
    if (cSend){
      const id = cSend.getAttribute('data-comment-send');
      const input = document.querySelector(`[data-comment-input="${id}"]`);
      if (input && input.value.trim()){ addComment(id, input.value); }
      return;
    }

    const delBtn = e.target.closest('[data-delete]');
    if (delBtn){ deletePost(delBtn.getAttribute('data-delete')); return; }

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn){ editPost(editBtn.getAttribute('data-edit')); return; }

    const saveBtn = e.target.closest('[data-save]');
    if (saveBtn){ toggleSave(saveBtn.getAttribute('data-save')); return; }

    const delCommentBtn = e.target.closest('[data-delete-comment]');
    if (delCommentBtn){
      const [postId, commentId] = delCommentBtn.getAttribute('data-delete-comment').split('|');
      deleteComment(postId, commentId);
      return;
    }

    const feedChip = e.target.closest('[data-feed-filter]');
    if (feedChip){
      feedFilter = feedChip.getAttribute('data-feed-filter');
      document.querySelectorAll('.feed-chip').forEach(c => c.classList.toggle('active', c === feedChip));
      renderFeed();
      return;
    }

    const lightboxImg = e.target.closest('[data-lightbox]');
    if (lightboxImg){ openLightbox(lightboxImg.getAttribute('data-lightbox')); return; }
    if (e.target.closest('#lightbox-overlay') && e.target.id !== 'lightbox-img'){ closeLightbox(); return; }

    const acceptBtn = e.target.closest('[data-accept]');
    if (acceptBtn){ acceptFriendRequest(acceptBtn.getAttribute('data-accept')); return; }

    const declineBtn = e.target.closest('[data-decline]');
    if (declineBtn){ declineFriendRequest(declineBtn.getAttribute('data-decline')); return; }

    const addBtn = e.target.closest('[data-addfriend]');
    if (addBtn){ sendFriendRequest(addBtn.getAttribute('data-addfriend')); return; }

    const cancelBtn = e.target.closest('[data-cancel]');
    if (cancelBtn){ cancelFriendRequest(cancelBtn.getAttribute('data-cancel')); return; }

    const removeFriendBtn = e.target.closest('[data-remove-friend]');
    if (removeFriendBtn){ removeFriend(removeFriendBtn.getAttribute('data-remove-friend')); return; }

    const openChatTrigger = e.target.closest('[data-open-chat]');
    if (openChatTrigger){ openChat(openChatTrigger.getAttribute('data-open-chat')); return; }

    const demoBtn = e.target.closest('[data-demo-login]');
    if (demoBtn){
      const uid = demoBtn.getAttribute('data-demo-login');
      login(uid);
      return;
    }

    const tabBtn = e.target.closest('.auth-tab');
    if (tabBtn){
      if (tabBtn.id === 'tab-login-btn') switchAuthTab('login');
      else if (tabBtn.id === 'tab-signup-btn') switchAuthTab('signup');
      return;
    }

    const togglePwd = e.target.closest('.toggle-pwd-btn');
    if (togglePwd){
      const targetId = togglePwd.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input){
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        togglePwd.style.color = isPwd ? 'var(--forest)' : 'var(--muted)';
      }
      return;
    }

    const colorPickDot = e.target.closest('.auth-color-picker .color-dot');
    if (colorPickDot){
      document.querySelectorAll('.auth-color-picker .color-dot').forEach(d => d.classList.remove('active'));
      colorPickDot.classList.add('active');
      return;
    }

    const userMenuTrigger = e.target.closest('#user-menu-btn');
    if (userMenuTrigger){
      e.stopPropagation();
      document.getElementById('notif-dropdown').classList.remove('open');
      document.getElementById('msg-dropdown').classList.remove('open');
      const uDropdown = document.getElementById('user-dropdown');
      const uWrap = document.getElementById('user-menu-wrap');
      const isOpen = uDropdown.classList.toggle('open');
      uWrap.classList.toggle('open', isOpen);
      return;
    }

    if (e.target.closest('#menu-view-profile')){
      document.getElementById('user-dropdown').classList.remove('open');
      document.getElementById('user-menu-wrap').classList.remove('open');
      if (currentUserId) openProfileModal(currentUserId);
      return;
    }

    if (e.target.closest('#menu-edit-bio')){
      document.getElementById('user-dropdown').classList.remove('open');
      document.getElementById('user-menu-wrap').classList.remove('open');
      if (currentUserId) updateBio();
      return;
    }

    if (e.target.closest('#menu-saved-posts')){
      document.getElementById('user-dropdown').classList.remove('open');
      document.getElementById('user-menu-wrap').classList.remove('open');
      feedFilter = 'saved';
      document.querySelectorAll('.feed-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-feed-filter') === 'saved'));
      renderFeed();
      return;
    }

    if (e.target.closest('#menu-theme-toggle')){
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      return;
    }

    if (e.target.closest('#menu-logout-btn')){
      logout();
      return;
    }

    if (e.target.closest('#profile-modal-overlay') === document.getElementById('profile-modal-overlay') && e.target.id === 'profile-modal-overlay'){
      document.getElementById('profile-modal-overlay').classList.remove('open');
    }
    if (e.target.id === 'chat-modal-overlay'){ closeChat(); }

    if (!e.target.closest('#user-menu-wrap')){
      document.getElementById('user-dropdown').classList.remove('open');
      document.getElementById('user-menu-wrap').classList.remove('open');
    }

    if (!e.target.closest('.bell-wrap:not(#user-menu-wrap)')){
      document.getElementById('notif-dropdown').classList.remove('open');
      document.getElementById('msg-dropdown').classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('[data-comment-input]') && e.key === 'Enter'){
      const id = e.target.getAttribute('data-comment-input');
      if (e.target.value.trim()) addComment(id, e.target.value);
    }
    if (e.key === 'Escape'){
      closeLightbox();
      document.getElementById('profile-modal-overlay').classList.remove('open');
      document.getElementById('chat-modal-overlay')?.classList.remove('open');
      document.getElementById('user-dropdown')?.classList.remove('open');
      document.getElementById('user-menu-wrap')?.classList.remove('open');
    }
  });
  document.getElementById('lightbox-close-btn').addEventListener('click', closeLightbox);

  /* typing indicator: broadcast while composing a comment, show it in other tabs */
  let typingThrottle = 0;
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-comment-input]')){
      const postId = e.target.getAttribute('data-comment-input');
      const now = Date.now();
      if (now - typingThrottle > 800 && currentUser()){
        typingThrottle = now;
        socket.emit('typing', { postId, name: currentUser().name });
      }
    }
  });
  socket.on('typing', ({ postId, name }) => {
    const card = document.querySelector(`.post-card[data-post="${postId}"]`);
    if (!card) return;
    const wrap = card.querySelector('.comments-wrap');
    if (!wrap || !wrap.classList.contains('open')) return;
    let el = wrap.querySelector('.typing-indicator');
    if (!el){
      el = document.createElement('div');
      el.className = 'typing-indicator';
      wrap.appendChild(el);
    }
    el.textContent = `${name} is typing…`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.remove(), 2200);
  });

  document.getElementById('bell-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('user-dropdown').classList.remove('open');
    document.getElementById('user-menu-wrap').classList.remove('open');
    document.getElementById('msg-dropdown').classList.remove('open');
    document.getElementById('notif-dropdown').classList.toggle('open');
  });
  document.getElementById('msg-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('user-dropdown').classList.remove('open');
    document.getElementById('user-menu-wrap').classList.remove('open');
    document.getElementById('notif-dropdown').classList.remove('open');
    document.getElementById('msg-dropdown').classList.toggle('open');
  });
  document.getElementById('mark-all-read').addEventListener('click', () => {
    if (!currentUserId) return;
    db.notifications.filter(n => n.userId === currentUserId).forEach(n => n.read = true);
    persistAndBroadcast();
    renderNotifications();
  });

  document.getElementById('edit-bio-btn').addEventListener('click', () => {
    if (currentUserId) updateBio();
  });

  document.getElementById('profile-visibility').addEventListener('change', (e) => {
    if (!currentUser()) return;
    currentUser().privacy.profile = e.target.value;
    persistAndBroadcast();
  });
  document.getElementById('default-post-visibility').addEventListener('change', (e) => {
    if (!currentUser()) return;
    currentUser().privacy.defaultPost = e.target.value;
    document.getElementById('composer-visibility').value = e.target.value;
    persistAndBroadcast();
  });

  document.getElementById('search-input').addEventListener('input', renderFeed);

  /* composer */
  let composerImage = null;
  document.getElementById('composer-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      composerImage = reader.result;
      document.getElementById('composer-preview-img').src = composerImage;
      document.getElementById('composer-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('composer-remove-image').addEventListener('click', () => {
    composerImage = null;
    document.getElementById('composer-file').value = '';
    document.getElementById('composer-preview').style.display = 'none';
  });
  document.getElementById('composer-post-btn').addEventListener('click', () => {
    if (!currentUserId){
      showAuthOverlay('login');
      return;
    }
    const textEl = document.getElementById('composer-text');
    const text = textEl.value;
    if (!text.trim() && !composerImage) return;
    const vis = document.getElementById('composer-visibility').value;
    createPost(text, composerImage, vis);
    textEl.value = '';
    composerImage = null;
    document.getElementById('composer-file').value = '';
    document.getElementById('composer-preview').style.display = 'none';
  });

  /* mobile tabs */
  document.querySelectorAll('.mobile-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mobile-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.getAttribute('data-tab');
      document.getElementById('col-left').classList.toggle('mobile-show', tab === 'left');
      document.getElementById('col-center').classList.toggle('mobile-show', tab === 'feed');
      document.getElementById('col-right').classList.toggle('mobile-show', tab === 'right');
    });
  });

  /* ---------------- Auth Form Listeners ---------------- */
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const idVal = (document.getElementById('login-identifier').value || '').trim().toLowerCase();
    const pwdVal = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');

    const user = db.users.find(u =>
      (u.email || '').toLowerCase() === idVal ||
      (u.handle || '').toLowerCase() === idVal ||
      (u.handle || '').toLowerCase() === (idVal.startsWith('@') ? idVal : '@' + idVal)
    );

    if (!user || user.password !== pwdVal){
      errEl.textContent = 'Invalid email/username or password. Please check your credentials or try a demo account.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    login(user.id);
  });

  document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const handle = document.getElementById('signup-handle').value;
    const email = document.getElementById('signup-email').value;
    const pwd = document.getElementById('signup-password').value;
    const bio = document.getElementById('signup-bio').value;
    const errEl = document.getElementById('signup-error');

    try {
      const activeDot = document.querySelector('.auth-color-picker .color-dot.active');
      const color = activeDot ? activeDot.getAttribute('data-color') : PALETTE[0];
      registerUser(name, handle, email, pwd, bio, color);
      errEl.style.display = 'none';
      document.getElementById('signup-form').reset();
    } catch(err) {
      errEl.textContent = err.message || 'Error creating account.';
      errEl.style.display = 'block';
    }
  });

  /* ---------------- Real-time incoming events ---------------- */
  socket.on('sync', () => {
    db = loadDB();
    renderAll();
    if (activeChatWith) renderChatModal();
    if (currentUserId){
      const mine = db.notifications.filter(n => n.userId === currentUserId);
      mine.forEach(n => {
        if (!seenNotifIds.has(n.id)){
          seenNotifIds.add(n.id);
          showToast(n.text, notifIcon(n.type));
        }
      });
      const myMsgs = db.messages.filter(m => m.to === currentUserId);
      myMsgs.forEach(m => {
        if (!seenMessageIds.has(m.id)){
          seenMessageIds.add(m.id);
          if (activeChatWith !== m.from) showToast(`${userById(m.from).name}: ${m.text}`, '💬');
        }
      });
    }
  });

  socket.on('presence', ({ userId }) => {
    markOnline(userId);
    renderRightPanel();
  });

  /* ---------------- Init ---------------- */
  if (currentUserId && currentUser()){
    renderAll();
    resetComposerVisibility();
    markOnline(currentUserId);
    socket.emit('presence', { userId: currentUserId });
  } else {
    renderAll();
    showAuthOverlay('login');
  }

  setInterval(() => {
    if (currentUserId){
      socket.emit('presence', { userId: currentUserId });
      markOnline(currentUserId);
      renderRightPanel();
    }
  }, 4000);

})();
