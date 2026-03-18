// ── Data ──────────────────────────────────────────────────────────────────
const STUDENTS = [
  { name: 'João',   course: 'Engenharia', hours: 10, avg: 7.5 },
  { name: 'Maria',  course: 'Matemática', hours: 3,  avg: 4.2 },
  { name: 'Carlos', course: 'Física',     hours: 8,  avg: 6.8 },
  { name: 'Ana',    course: 'Computação', hours: 12, avg: 8.9 },
  { name: 'Pedro',  course: 'Química',    hours: 2,  avg: 3.5 },
  { name: 'Lucia',  course: 'Engenharia', hours: 7,  avg: 6.1 },
  { name: 'Bruno',  course: 'Matemática', hours: 5,  avg: 5.4 },
  { name: 'Carla',  course: 'Física',     hours: 9,  avg: 7.8 },
];

const FILES = [
  { icon: '📋', name: 'logs_acesso.csv',  mb: 512 },
  { icon: '📝', name: 'notas.json',       mb: 64  },
  { icon: '🎬', name: 'video_aula.mp4',   mb: 1024},
  { icon: '💬', name: 'interacoes.log',   mb: 256 },
];

const NODES_NAMES = ['A','B','C','D','E','F','G','H','I','J','K','L'];

let state = { nodes: 30, ram: 32, week: 1, student: 'João', failedSet: new Set() };

// ── Hero live counter ─────────────────────────────────────────────────────
let dataGB = 0;
setInterval(() => {
  dataGB += +(Math.random() * 0.3).toFixed(1);
  document.getElementById('liveData').textContent = dataGB.toFixed(1);
  document.getElementById('liveStudents').textContent = (5000 + Math.floor(Math.random()*50)).toLocaleString('pt-BR');
}, 1800);

// ── Tabs ──────────────────────────────────────────────────────────────────
function switchTab(btn, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(id).classList.add('active');
  if (id === 'hdfs')  renderHDFS();
  if (id === 'mr')    renderMR();
  if (id === 'dash')  renderDash();
}

// ── Cluster ───────────────────────────────────────────────────────────────
function onNodes(v) {
  state.nodes = +v;
  document.getElementById('valNodes').textContent = v;
  document.getElementById('liveNodes').textContent = v;
  refreshTotals(); buildNodes();
}
function onRam(v) {
  state.ram = +v;
  document.getElementById('valRam').textContent = v + ' GB';
  refreshTotals();
}
function refreshTotals() {
  document.getElementById('tRam').textContent     = state.nodes * state.ram;
  document.getElementById('tStorage').textContent = state.nodes * 4;
  document.getElementById('tCores').textContent   = state.nodes * 16;
}
function buildNodes() {
  const wrap = document.getElementById('clusterNodes');
  wrap.innerHTML = '';
  for (let i = 0; i < state.nodes; i++) {
    const d = document.createElement('div');
    d.className = 'node' + (state.failedSet.has(i) ? ' failed' : '');
    d.id = 'n' + i;
    d.innerHTML = `<span class="node-icon">🖥️</span><span>N${i+1}</span>`;
    wrap.appendChild(d);
  }
}
function simulateFault() {
  const log = document.getElementById('faultLog');
  const avail = [...Array(state.nodes).keys()].filter(i => !state.failedSet.has(i));
  if (!avail.length) return;
  const idx = avail[Math.floor(Math.random() * avail.length)];
  state.failedSet.add(idx);
  const el = document.getElementById('n' + idx);
  if (el) el.className = 'node failed';

  const replicas = avail.filter(n => n !== idx).slice(0, 2).map(n => 'N'+(n+1));
  const now = () => new Date().toLocaleTimeString('pt-BR');

  log.innerHTML = [
    `<div class="log-line log-err">❌ [${now()}] Nó N${idx+1} não responde</div>`,
    `<div class="log-line log-warn">⚠️  [${now()}] NameNode detectou falha</div>`,
    `<div class="log-line log-ok">✅ [${now()}] Dados disponíveis em: ${replicas.join(', ')}</div>`,
    `<div class="log-line log-ok">✅ [${now()}] Sistema operacional — ${state.nodes - state.failedSet.size} nós ativos</div>`,
  ].join('') + log.innerHTML;

  setTimeout(() => {
    state.failedSet.delete(idx);
    const e = document.getElementById('n' + idx);
    if (e) { e.className = 'node ok'; setTimeout(() => { e.className = 'node'; }, 2000); }
    log.innerHTML = `<div class="log-line log-ok">🔄 [${now()}] N${idx+1} recuperado</div>` + log.innerHTML;
  }, 3000);
}

// ── HDFS ──────────────────────────────────────────────────────────────────
function pickStudent(btn, name) {
  document.querySelectorAll('.s-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.student = name;
  renderHDFS();
}
function renderHDFS() {
  const colors = [
    ['#1e3a5f','#3b82f6'], // blue
    ['#3b1a5f','#8b5cf6'], // purple
    ['#0a2a2a','#06b6d4'], // cyan
  ];
  const wrap = document.getElementById('hdfsDiagram');
  wrap.innerHTML = '';
  FILES.forEach(f => {
    const blocks = Math.ceil(f.mb / 256);
    const row = document.createElement('div');
    row.className = 'hdfs-file-row';
    let blocksHtml = '';
    for (let b = 0; b < blocks; b++) {
      colors.forEach(([bg, fg], r) => {
        const node = NODES_NAMES[(b * 3 + r) % NODES_NAMES.length];
        blocksHtml += `
          <div class="hdfs-block" style="background:${bg};border:1px solid ${fg}20;color:${fg}">
            <span class="blk-label">Bloco ${b+1} · Réplica ${r+1}</span>
            <span class="blk-nodes">Node ${node}</span>
          </div>`;
      });
    }
    row.innerHTML = `
      <div class="hdfs-file-label">
        ${f.icon} <strong>${state.student}/${f.name}</strong>
        <span style="margin-left:auto;color:#475569">${f.mb} MB · ${blocks} bloco${blocks>1?'s':''}</span>
      </div>
      <div class="hdfs-blocks-row">${blocksHtml}</div>`;
    wrap.appendChild(row);
  });
}

// ── MapReduce ─────────────────────────────────────────────────────────────
function pickWeek(btn, w) {
  document.querySelectorAll('.w-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.week = w;
}
function renderMR() { /* just clear */ clearMR(); }
function clearMR() {
  ['mrInput','mrMap','mrReduce'].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<div class="mr-col-title">${el.querySelector?.('.mr-col-title')?.textContent || ''}</div>`;
  });
  document.getElementById('mrResults').innerHTML = '';
}

function animateMR() {
  const w = state.week;
  const jitter = (base) => +(base + (Math.random() * 2 - 1)).toFixed(1);

  const records = STUDENTS.map(s => ({ ...s, nota: Math.max(2, Math.min(10, jitter(s.avg))) }));

  // Input col
  const inCol = document.getElementById('mrInput');
  inCol.innerHTML = '<div class="mr-col-title">📥 Dados de Entrada</div>';
  records.forEach((r, i) => {
    const chip = document.createElement('div');
    chip.className = 'mr-chip';
    chip.textContent = `${r.name} · ${r.course} · ${r.nota}`;
    inCol.appendChild(chip);
    setTimeout(() => chip.classList.add('show'), i * 80);
  });

  // Map col
  const mapCol = document.getElementById('mrMap');
  mapCol.innerHTML = '<div class="mr-col-title">🗺️ MAP</div>';
  records.forEach((r, i) => {
    const chip = document.createElement('div');
    chip.className = 'mr-chip';
    chip.textContent = `(${r.course}, S${w}) → ${r.nota}`;
    mapCol.appendChild(chip);
    setTimeout(() => chip.classList.add('show'), 600 + i * 80);
  });

  // Group by course
  const grouped = {};
  records.forEach(r => { (grouped[r.course] = grouped[r.course] || []).push(r.nota); });

  // Reduce col
  const redCol = document.getElementById('mrReduce');
  redCol.innerHTML = '<div class="mr-col-title">📉 REDUCE</div>';
  const results = Object.entries(grouped).map(([c, ns]) => ({
    course: c,
    avg: (ns.reduce((a,b)=>a+b,0)/ns.length).toFixed(1),
    count: ns.length
  }));
  results.forEach((r, i) => {
    const chip = document.createElement('div');
    chip.className = 'mr-chip';
    chip.textContent = `${r.course} → ${r.avg}`;
    redCol.appendChild(chip);
    setTimeout(() => chip.classList.add('show'), 1400 + i * 100);
  });

  // Result cards
  const resWrap = document.getElementById('mrResults');
  resWrap.innerHTML = '';
  results.forEach((r, i) => {
    const avg = +r.avg;
    const color = avg >= 7 ? '#22c55e' : avg >= 5 ? '#f59e0b' : '#ef4444';
    const card = document.createElement('div');
    card.className = 'mr-result-card';
    card.innerHTML = `
      <div class="course">${r.course}</div>
      <div class="avg" style="color:${color}">${r.avg}</div>
      <div class="week-label">Semana ${w} · ${r.count} aluno(s)</div>
      <div class="avg-bar" style="background:${color}20">
        <div style="height:4px;border-radius:2px;background:${color};width:${avg*10}%;transition:width .6s"></div>
      </div>`;
    resWrap.appendChild(card);
    setTimeout(() => card.classList.add('show'), 2000 + i * 100);
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function renderDash() {
  const total = 5000 + Math.floor(Math.random() * 200);
  const online = 1100 + Math.floor(Math.random() * 400);
  const avgAll = (STUDENTS.reduce((a,b)=>a+b.avg,0)/STUDENTS.length).toFixed(1);

  const kpis = [
    { v: total.toLocaleString('pt-BR'), l: 'Alunos', c: '#3b82f6' },
    { v: online.toLocaleString('pt-BR'), l: 'Online agora', c: '#22c55e' },
    { v: avgAll, l: 'Média geral', c: +avgAll>=7?'#22c55e':+avgAll>=5?'#f59e0b':'#ef4444' },
    { v: state.nodes, l: 'Nós ativos', c: '#06b6d4' },
    { v: (state.nodes*4)+' TB', l: 'Storage', c: '#8b5cf6' },
    { v: '3×', l: 'Replicação', c: '#f59e0b' },
  ];
  document.getElementById('kpiRow').innerHTML = kpis.map(k =>
    `<div class="kpi"><div class="kv" style="color:${k.c}">${k.v}</div><div class="kl">${k.l}</div></div>`
  ).join('');

  const atRisk = STUDENTS.filter(s => s.avg < 5).map(s => s.name);
  const lowHours = STUDENTS.filter(s => s.hours < 5).map(s => s.name);

  document.getElementById('l1body').innerHTML = [
    `${STUDENTS.filter(s=>s.avg>=7).length} alunos com média ≥ 7.0`,
    `Média geral da plataforma: ${avgAll}`,
    `${online.toLocaleString('pt-BR')} alunos online agora`,
  ].map(t=>`<div class="level-item">📌 ${t}</div>`).join('');

  document.getElementById('l2body').innerHTML = [
    `${lowHours.join(', ')} estudaram < 5h/semana`,
    `Alta reprovação em Matemática`,
    `Correlação horas × nota: r = 0.82`,
  ].map(t=>`<div class="level-item">🔎 ${t}</div>`).join('');

  document.getElementById('l3body').innerHTML = [
    ...atRisk.map(n=>`${n} tem risco de reprovação`),
    `Queda prevista em Química na S4`,
  ].map(t=>`<div class="level-item">🔮 ${t}</div>`).join('');

  document.getElementById('l4body').innerHTML = [
    ...atRisk.map(n=>`Monitoria urgente para ${n}`),
    `+2h de estudo em Matemática`,
    `Alertar professores de Química`,
  ].map(t=>`<div class="level-item">✅ ${t}</div>`).join('');

  // Student cards
  document.getElementById('studentsGrid').innerHTML = STUDENTS
    .sort((a,b)=>a.avg-b.avg)
    .map(s => {
      const color = s.avg>=7?'#22c55e':s.avg>=5?'#f59e0b':'#ef4444';
      const risk  = s.avg<5?['Alto','rb-high']:s.avg<6.5?['Médio','rb-med']:['OK','rb-low'];
      return `
        <div class="student-card">
          <div class="sc-name">${s.name}</div>
          <div class="sc-course">${s.course}</div>
          <div class="sc-avg" style="color:${color}">${s.avg}</div>
          <div class="sc-bar"><div class="sc-bar-fill" style="width:${s.avg*10}%;background:${color}"></div></div>
          <div class="sc-hours">⏱ ${s.hours}h/semana</div>
          <span class="risk-badge ${risk[1]}">${risk[0]}</span>
        </div>`;
    }).join('');
}

// ── Init ──────────────────────────────────────────────────────────────────
buildNodes();
refreshTotals();
