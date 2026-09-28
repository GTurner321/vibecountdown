// Vibe Coding Club countdown: behaviour
(() => {
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, '0');
  const store = {
    get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  };

  /* ---------------- state ---------------- */
  let mode = 'duration';
  let target = 0, total = 1, remaining = 0;
  let running = false, paused = false, done = false;
  let soundOn = true, lastShownSec = null, lastMin = null;
  let tickTimer = null, hypeTimer = null;

  /* ---------------- hype lines ---------------- */
  const hypeLines = [
    "Warming up the servers", "Stretching those typing fingers", "Loading big ideas…",
    "Compiling creativity", "Charging the vibes to 100%", "Grab a seat, boot up",
    "Prompts at the ready", "Brainstorm something weird", "Bugs: prepare to be squashed",
    "npm install good-vibes", "git commit -m \"let's go\"", "Hydrate. Caffeinate. Create.",
    "Tell your AI it's about to get busy", "Today's the day you ship it"
  ];
  const finalLines = ["FINAL MINUTE! Laptops open!", "Log in NOW", "Here we gooooo", "Get your first prompt ready"];

  const ideas = [
    "Build a snake game with AI 🐍", "Make a personal portfolio website ✨",
    "Create a random excuse generator 🙃", "Code a quiz game about your favourite topic 🧠",
    "Build a pixel-art drawing app 🎨", "Make a weather mood dashboard 🌦️",
    "Build a Wordle clone 🟩", "Create a virtual pet that needs feeding 🐣",
    "Code a reaction-time tester ⚡", "Build a to-do list with sound effects ✅",
    "Make a meme generator 😂", "Build a Flappy-style game 🐦", "Create a music beat maker 🥁"
  ];

  /* ---------------- audio ---------------- */
  let actx = null;
  function ensureAudio(){
    if(!actx){ try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if(actx && actx.state === 'suspended') actx.resume();
  }
  function tone(freq, dur, type='sine', vol=.18, when=0){
    if(!soundOn || !actx) return;
    const t = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + .05);
  }
  function fanfare(){
    [523,659,784,1047].forEach((f,i) => tone(f, .25, 'square', .12, i*.12));
    [523,659,784,1047,1319].forEach(f => tone(f, 1.6, 'sawtooth', .06, .55));
    tone(80, .8, 'sine', .3, .55);
  }

  /* ---------------- background code particles ---------------- */
  const bg = $('bg'), bctx = bg.getContext('2d');
  const glyphs = ['{ }','</>','=>','()',';','[ ]','&&','++','#','//','fn','AI','$','*','!=','<3'];
  const colors = ['#ff3cac','#8a4dff','#2bd2ff','#b8ff3c'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let parts = [], speedBoost = 1;
  function sizeCanvas(c){ const dpr = Math.min(devicePixelRatio||1, 2); c.width = innerWidth*dpr; c.height = innerHeight*dpr; c.getContext('2d').setTransform(dpr,0,0,dpr,0,0); }
  function makePart(y){
    return { x: Math.random()*innerWidth, y: y ?? innerHeight + 20, vy: .3 + Math.random()*.9,
      s: 12 + Math.random()*20, g: glyphs[Math.random()*glyphs.length|0],
      c: colors[Math.random()*colors.length|0], a: .15 + Math.random()*.35, sway: Math.random()*Math.PI*2 };
  }
  function initParts(){ parts = []; const n = reduced ? 12 : Math.min(70, Math.round(innerWidth/22)); for(let i=0;i<n;i++) parts.push(makePart(Math.random()*innerHeight)); }
  function drawBg(){
    bctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of parts){
      p.y -= p.vy * speedBoost; p.sway += .01;
      if(p.y < -30) Object.assign(p, makePart());
      bctx.globalAlpha = p.a; bctx.fillStyle = p.c;
      bctx.font = `700 ${p.s}px "JetBrains Mono", monospace`;
      bctx.fillText(p.g, p.x + Math.sin(p.sway)*12, p.y);
    }
    bctx.globalAlpha = 1;
    requestAnimationFrame(drawBg);
  }

  /* ---------------- confetti ---------------- */
  const cf = $('confetti'), cctx = cf.getContext('2d');
  let confetti = [], cfRunning = false;
  const cfColors = ['#ff3cac','#8a4dff','#2bd2ff','#b8ff3c','#ffd23c','#ffffff'];
  function burst(x, y, n, spread=Math.PI/2.2, angle=-Math.PI/2, power=16){
    for(let i=0;i<n;i++){
      const a = angle + (Math.random()-.5)*spread, v = power*(.5 + Math.random()*.7);
      confetti.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, r: Math.random()*6.3, vr: (Math.random()-.5)*.4,
        w: 6 + Math.random()*8, h: 8 + Math.random()*10, c: cfColors[Math.random()*cfColors.length|0],
        life: 1, shape: Math.random() < .25 ? 'circle' : 'rect' });
    }
    if(!cfRunning){ cfRunning = true; requestAnimationFrame(drawConfetti); }
  }
  function rain(n){ for(let i=0;i<n;i++) burst(Math.random()*innerWidth, -20, 1, .6, Math.PI/2, 3); }
  function drawConfetti(){
    cctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of confetti){
      p.vy += .35; p.vx *= .985; p.vy *= .985;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if(p.y > innerHeight + 40) p.life = 0;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.r);
      cctx.fillStyle = p.c;
      if(p.shape === 'circle'){ cctx.beginPath(); cctx.arc(0,0,p.w/2,0,Math.PI*2); cctx.fill(); }
      else { cctx.scale(1, Math.cos(p.r*2)); cctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); }
      cctx.restore();
    }
    confetti = confetti.filter(p => p.life > 0);
    if(confetti.length) requestAnimationFrame(drawConfetti);
    else { cfRunning = false; cctx.clearRect(0,0,innerWidth,innerHeight); }
  }

  /* ---------------- countdown ---------------- */
  function getRemaining(){ return paused ? remaining : Math.max(0, target - Date.now()); }

  function render(rem){
    const totalSec = Math.ceil(rem / 1000);
    const m = Math.floor(totalSec / 60), s = totalSec % 60;
    const minEl = $('min'), secEl = $('sec');
    if(lastMin !== m){ minEl.textContent = pad(m); $('minLbl').textContent = m === 1 ? 'min' : 'mins'; lastMin = m; popEl(minEl); }
    if(lastShownSec !== totalSec){
      secEl.textContent = pad(s); popEl(secEl);
      $('secLbl').textContent = s === 1 ? 'sec' : 'secs';
      if(!paused && totalSec > 0 && totalSec <= 5) tone(totalSec === 1 ? 988 : 660, .15, 'square', .12);
      lastShownSec = totalSec;
      document.title = `${pad(m)}:${pad(s)} · Vibe Coding Club`;
    }
    document.body.classList.toggle('final-minute', totalSec <= 60 && totalSec > 10);
    document.body.classList.toggle('final-ten', totalSec <= 10 && totalSec > 0);
    speedBoost = totalSec <= 10 ? 4 : totalSec <= 60 ? 2 : 1;
    $('tagText').textContent = totalSec <= 10 ? 'Vibe Coding Club · Ignition' : totalSec <= 60 ? 'Vibe Coding Club · Final minute' : 'Vibe Coding Club · Live countdown';
    $('bar').style.width = Math.min(100, (1 - rem / total) * 100) + '%';
  }
  function popEl(el){ el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }

  function tick(){
    if(!running) return;
    const rem = getRemaining();
    render(rem);
    if(rem <= 0 && !paused) celebrate();
  }

  function setHype(){
    const rem = getRemaining();
    const list = rem <= 60000 ? finalLines : hypeLines;
    const el = $('hype');
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = list[Math.random()*list.length|0]; el.style.opacity = 1; }, 400);
  }

  function setMission(text){
    const has = !!text.trim();
    $('missionText').textContent = text.trim();
    $('launchMissionText').textContent = text.trim();
    $('missionBox').hidden = !has;
    $('launchMissionBox').hidden = !has;
  }

  function startCountdown(ms, mission){
    clearInterval(tickTimer); clearInterval(hypeTimer);
    total = ms; target = Date.now() + ms; remaining = ms;
    running = true; paused = false; done = false; lastShownSec = null; lastMin = null;
    document.body.classList.remove('paused','launched','final-minute','final-ten');
    setMission(mission);
    $('setup').hidden = true;
    $('launch').hidden = true;
    $('stage').hidden = false;
    $('controls').hidden = false;
    $('pauseBtn').textContent = '⏸';
    $('bar').style.width = '0%';
    tick();
    tickTimer = setInterval(tick, 100);
    setHype(); hypeTimer = setInterval(setHype, 4500);
  }

  function celebrate(){
    done = true; running = false;
    clearInterval(tickTimer); clearInterval(hypeTimer);
    document.body.classList.remove('final-minute','final-ten');
    document.body.classList.add('launched');
    speedBoost = 6; setTimeout(() => speedBoost = 1.5, 4000);
    $('stage').hidden = true;
    $('launch').hidden = false;
    $('bar').style.width = '100%';
    document.title = '🚀 Vibe Coding has begun!';
    fanfare();
    const W = innerWidth, H = innerHeight;
    burst(W/2, H/2, 180, Math.PI*2, 0, 22);
    setTimeout(() => { burst(0, H, 120, Math.PI/3, -Math.PI/3, 26); burst(W, H, 120, Math.PI/3, -2*Math.PI/3, 26); }, 350);
    setTimeout(() => { burst(W*.25, H, 90, Math.PI/4, -Math.PI/2, 24); burst(W*.75, H, 90, Math.PI/4, -Math.PI/2, 24); }, 900);
    let r = 0; const rainTimer = setInterval(() => { rain(14); if(++r > 40) clearInterval(rainTimer); }, 150);
  }

  function togglePause(){
    if(!running || done) return;
    if(paused){ target = Date.now() + remaining; paused = false; }
    else { remaining = Math.max(0, target - Date.now()); paused = true; }
    document.body.classList.toggle('paused', paused);
    $('pauseBtn').textContent = paused ? '▶' : '⏸';
    lastShownSec = null; tick();
  }
  function adjust(ms){
    if(!running || done) return;
    const now = Date.now();
    if(paused) remaining = Math.max(1000, remaining + ms);
    else target = Math.max(now + 1000, target + ms);
    total = Math.max(total, getRemaining());
    lastShownSec = null; lastMin = null; tick();
  }

  /* ---------------- setup popup ---------------- */
  function openSetup(){
    $('err').textContent = '';
    $('setup').hidden = false;
    setTimeout(() => $('inMission').focus(), 50);
  }
  function closeSetup(){ if(running || done) $('setup').hidden = true; }

  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    $('durationPane').hidden = mode !== 'duration';
    $('clockPane').hidden = mode !== 'clock';
    if(mode === 'clock' && !$('inTime').value){
      const d = new Date(Date.now() + 10*60000);
      $('inTime').value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }));

  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
    const minI = $('inMin'), secI = $('inSec');
    let total = (parseInt(minI.value)||0)*60 + (parseInt(secI.value)||0);
    total += (b.dataset.step === 'min' ? 60 : 1) * parseInt(b.dataset.d);
    total = Math.max(0, Math.min(total, 999*60 + 59));
    minI.value = Math.floor(total/60); secI.value = total % 60;
  }));
  document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
    $('inMin').value = b.dataset.preset; $('inSec').value = 0;
  }));
  $('surprise').addEventListener('click', () => {
    let pick; do { pick = ideas[Math.random()*ideas.length|0]; } while(pick === $('inMission').value && ideas.length > 1);
    $('inMission').value = pick;
  });

  $('goBtn').addEventListener('click', () => {
    let ms;
    if(mode === 'duration'){
      const m = Math.max(0, parseInt($('inMin').value)||0);
      const s = Math.max(0, Math.min(59, parseInt($('inSec').value)||0));
      ms = (m*60 + s) * 1000;
      if(ms <= 0){ $('err').textContent = 'Give the timer at least 1 second!'; return; }
    } else {
      const v = $('inTime').value;
      if(!v){ $('err').textContent = 'Pick a start time first.'; return; }
      const [h, mi] = v.split(':').map(Number);
      const t = new Date(); t.setHours(h, mi, 0, 0);
      if(t.getTime() <= Date.now()) t.setDate(t.getDate() + 1);
      ms = t.getTime() - Date.now();
    }
    soundOn = $('inSound').checked;
    $('soundBtn').textContent = soundOn ? '🔊' : '🔇';
    ensureAudio();
    const mission = $('inMission').value;
    store.set('vcc-mission', mission);
    store.set('vcc-min', $('inMin').value);
    startCountdown(ms, mission);
  });
  ['inMin','inSec'].forEach(id => $(id).addEventListener('keydown', e => { if(e.key === 'Enter') $('goBtn').click(); }));

  /* ---------------- controls ---------------- */
  $('pauseBtn').addEventListener('click', togglePause);
  $('plusBtn').addEventListener('click', () => adjust(60000));
  $('minusBtn').addEventListener('click', () => adjust(-60000));
  $('editBtn').addEventListener('click', openSetup);
  $('soundBtn').addEventListener('click', toggleSound);
  $('fsBtn').addEventListener('click', toggleFs);
  function toggleSound(){ soundOn = !soundOn; $('soundBtn').textContent = soundOn ? '🔊' : '🔇'; $('inSound').checked = soundOn; if(soundOn) ensureAudio(); }
  function toggleFs(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>{});
    else document.exitFullscreen?.();
  }

  document.addEventListener('keydown', e => {
    if(e.target.matches('input, textarea')) { if(e.key === 'Escape') closeSetup(); return; }
    if(!$('setup').hidden){ if(e.key === 'Escape') closeSetup(); return; }
    const k = e.key.toLowerCase();
    if(k === ' '){ e.preventDefault(); togglePause(); }
    else if(k === 'f') toggleFs();
    else if(k === 'm') toggleSound();
    else if(k === 'e') openSetup();
    else if(k === 'arrowup') adjust(60000);
    else if(k === 'arrowdown') adjust(-60000);
  });
  $('setup').addEventListener('click', e => { if(e.target.id === 'setup') closeSetup(); });

  // hide controls + cursor when idle (great on a projector)
  let idleT;
  function wake(){ document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if($('setup').hidden) document.body.classList.add('idle'); }, 3000); }
  ['mousemove','touchstart','keydown'].forEach(ev => addEventListener(ev, wake, {passive:true}));

  /* ---------------- init ---------------- */
  // Optional URL presets, e.g. index.html?min=10&mission=Build%20a%20game
  const q = new URLSearchParams(location.search);
  $('inMission').value = q.get('mission') ?? store.get('vcc-mission') ?? '';
  if(q.get('min')) $('inMin').value = q.get('min');
  else if(store.get('vcc-min')) $('inMin').value = store.get('vcc-min');
  if(q.get('sec')) $('inSec').value = q.get('sec');

  addEventListener('resize', () => { sizeCanvas(bg); sizeCanvas(cf); initParts(); });
  sizeCanvas(bg); sizeCanvas(cf); initParts(); drawBg();
  openSetup();
})();
