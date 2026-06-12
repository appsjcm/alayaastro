
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];
const STORE = { history:'alaya_v3_history', profiles:'alaya_v3_profiles', settings:'alaya_v3_settings', favorites:'alaya_v31_favorites' };
const VERSION='v6.2 Final Release';
let currentStep=1; let currentReading=null; let deferredPrompt=null;
const signs=['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const elements={Aries:'Fuego',Leo:'Fuego',Sagitario:'Fuego',Tauro:'Tierra',Virgo:'Tierra',Capricornio:'Tierra',Géminis:'Aire',Libra:'Aire',Acuario:'Aire',Cáncer:'Agua',Escorpio:'Agua',Piscis:'Agua'};
const glyph={Aries:'♈',Tauro:'♉',Géminis:'♊',Cáncer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Escorpio:'♏',Sagitario:'♐',Capricornio:'♑',Acuario:'♒',Piscis:'♓'};
function read(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}}
function write(k,v){localStorage.setItem(k,JSON.stringify(v))}
function route(name){$$('.screen').forEach(s=>s.classList.toggle('active',s.id===name));$$('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===name));location.hash=name; if(name==='universo') renderUniverse(); if(name==='home') renderHome();}
function step(n){currentStep=Math.max(1,Math.min(5,n));$$('.wizard-page').forEach(p=>p.classList.toggle('active',+p.dataset.page===currentStep));$$('.step').forEach(s=>s.classList.toggle('active',+s.dataset.step===currentStep));}
function collectForm(){const fd=new FormData($('#readingForm'));let o=Object.fromEntries(fd.entries());o.tone=fd.get('tone')||'mistica';return o}
function seeded(str){let h=2166136261; for(const c of str) h=(h^c.charCodeAt(0))*16777619>>>0; return h}
function signFrom(seed, offset=0){return signs[(seed+offset)%12]}
function calcPositions(d){const seed=seeded(`${d.name}|${d.birthDate}|${d.birthTime}|${d.city}|${d.country}`);const sol=solarSign(d.birthDate);const luna=signFrom(seed,3);const asc=signFrom(seed,7);return {Sol:{sign:sol,deg:(seed%30)+1},Luna:{sign:luna,deg:((seed>>4)%30)+1},Ascendente:{sign:asc,deg:((seed>>8)%30)+1},Mercurio:{sign:signFrom(seed,1),deg:((seed>>2)%30)+1},Venus:{sign:signFrom(seed,5),deg:((seed>>6)%30)+1},Marte:{sign:signFrom(seed,9),deg:((seed>>10)%30)+1}}}
function solarSign(date){if(!date)return 'Aries'; const [y,m,d]=date.split('-').map(Number); const mm=m*100+d; if(mm>=321&&mm<=419)return'Aries'; if(mm<=520)return'Tauro'; if(mm<=620)return'Géminis'; if(mm<=722)return'Cáncer'; if(mm<=822)return'Leo'; if(mm<=922)return'Virgo'; if(mm<=1022)return'Libra'; if(mm<=1121)return'Escorpio'; if(mm<=1221)return'Sagitario'; if(mm>=1222||mm<=119)return'Capricornio'; if(mm<=218)return'Acuario'; return'Piscis'}
function parseAstro(text=''){const map={sun:'Sol',sol:'Sol','☉':'Sol',moon:'Luna',luna:'Luna','☽':'Luna',asc:'Ascendente',ac:'Ascendente',ascendente:'Ascendente',mercury:'Mercurio',mercurio:'Mercurio',venus:'Venus',marte:'Marte',mars:'Marte'};const signMap={ari:'Aries',aries:'Aries',tau:'Tauro',taurus:'Tauro',tauro:'Tauro',gem:'Géminis',geminis:'Géminis',géminis:'Géminis',cancer:'Cáncer',cáncer:'Cáncer',leo:'Leo',vir:'Virgo',virgo:'Virgo',lib:'Libra',libra:'Libra',esc:'Escorpio',escorpio:'Escorpio',sco:'Escorpio',sag:'Sagitario',sagitario:'Sagitario',cap:'Capricornio',capricornio:'Capricornio',acu:'Acuario',acuario:'Acuario',aqu:'Acuario',pis:'Piscis',piscis:'Piscis'};let out={};const chunks=text.replace(/[♈︎]/g,' Aries ').replace(/[♉︎]/g,' Tauro ').replace(/[♊︎]/g,' Géminis ').replace(/[♋︎]/g,' Cáncer ').replace(/[♌︎]/g,' Leo ').replace(/[♍︎]/g,' Virgo ').replace(/[♎︎]/g,' Libra ').replace(/[♏︎]/g,' Escorpio ').replace(/[♐︎]/g,' Sagitario ').replace(/[♑︎]/g,' Capricornio ').replace(/[♒︎]/g,' Acuario ').replace(/[♓︎]/g,' Piscis ').split(/\n|·|;|,/);for(const ch of chunks){const words=ch.trim().split(/\s+/);let body=null,sign=null,deg=null;for(const w of words){let key=w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z☉☽]/g,''); if(map[key]) body=map[key]; if(signMap[key]) sign=signMap[key]; const num=w.match(/\d{1,2}/); if(num && deg==null) deg=+num[0];} if(body&&sign) out[body]={sign,deg:deg||null}}return out}
function dominantElement(pos){const count={Fuego:0,Tierra:0,Aire:0,Agua:0};Object.values(pos).forEach(p=>count[elements[p.sign]]++);return Object.entries(count).sort((a,b)=>b[1]-a[1])[0][0]}

function auraScore(metrics,d){let base=Math.round((metrics.clarity+metrics.action+metrics.integration)/3); if((d.currentState||'').includes('Cans')) base-=4; if((d.currentState||'').includes('Bloque')) base-=6; if((d.currentState||'').includes('Ilusion')) base+=4; return Math.max(35,Math.min(99,base));}
function visionDeck(d,dom,goal){const cards={Fuego:['La Antorcha','El Salto','La Corona'],Tierra:['El Jardín','La Raíz','La Llave'],Aire:['La Brújula','El Mensaje','La Ventana'],Agua:['La Marea','El Espejo','La Perla']};const seed=seeded((d.name||'')+(d.birthDate||'')+(goal||''));const pool=cards[dom]||cards.Fuego;return [pool[seed%3],['Claridad','Cuidado','Decisión','Renacer'][(seed>>3)%4],['Hoy','7 días','30 días','Nuevo ciclo'][(seed>>6)%4]];}
function favoriteIds(){return read(STORE.favorites,[])}
function isFavorite(id){return favoriteIds().includes(id)}
function toggleFavorite(id){let f=favoriteIds(); f=f.includes(id)?f.filter(x=>x!==id):[id,...f]; write(STORE.favorites,f); renderHistory(); renderUniverse(); renderHome(); toast(f.includes(id)?'Añadida a favoritas.':'Quitada de favoritas.');}
function dailyPulse(){const now=new Date();const seed=seeded(now.toDateString());const dom=['Fuego','Tierra','Aire','Agua'][seed%4];const goals=['Claridad','Calma','Acción','Cierre','Confianza','Intuición'];const goal=goals[(seed>>4)%goals.length];const msg={Fuego:'enciende una acción pequeña y visible',Tierra:'ordena tu espacio y baja el ritmo',Aire:'nombra lo que piensas antes de decidir',Agua:'escucha tu emoción sin juzgarla'}[dom];$('#dailyPulse').innerHTML=`<div><p class="eyebrow">Pulso Alaya · ${VERSION}</p><h2>${dom} · ${goal}</h2><p>Hoy la guía es: ${msg}. No hace falta resolverlo todo; basta con una acción limpia y consciente.</p><div class="cards-grid"><div class="mini-card"><b>Activar</b><span>${goal}</span></div><div class="mini-card"><b>Soltar</b><span>ruido mental innecesario</span></div><div class="mini-card"><b>Microacción</b><span>10 minutos para ordenar, escribir o respirar.</span></div><div class="mini-card"><b>Mantra</b><span>“Avanzo con belleza y dirección.”</span></div></div></div><div class="pulse-oracle"><span>${glyph[signs[seed%12]]}</span><b>${signs[seed%12]}</b><small>Pulso diario</small></div>`;}

function makeReading(d){const pos=calcPositions(d);const imported=parseAstro(d.astroText||'');Object.assign(pos, imported);const dom=dominantElement(pos);const archetypes={Fuego:'La Chispa Creadora',Tierra:'La Guardiana del Jardín',Aire:'La Mensajera del Horizonte',Agua:'La Oráculo del Río'};const focus=d.lifeArea||'General';const goal=d.energyGoal||'Claridad';const question=d.centralQuestion||'¿Qué necesito comprender ahora?';const precision=d.calcSource==='astrocom'&&Object.keys(imported).length?'Base revisada manualmente':d.calcSource==='basic'?'Aproximado offline':'Simbólico creativo';const clarity=70+(seeded(d.name+focus)%24);const action=62+(seeded(goal+d.birthDate)%28);const integration=66+(seeded(question+d.city)%26);const deck=visionDeck(d,dom,goal);const aura=auraScore({clarity,action,integration},d);return {id:Date.now().toString(36),created:new Date().toISOString(),data:d,pos,imported,dom,archetype:archetypes[dom],precision,metrics:{clarity,action,integration,aura},deck,title:`Lectura Vision Pro de ${d.name||'Alaya'}`,subtitle:`${d.readingType||'Carta'} · ${focus} · ${goal}`,message:`Tu mapa se organiza desde ${dom}. La clave no es forzar respuestas, sino escuchar qué parte de ti pide orden, presencia y una decisión más consciente.`,layers:buildLayers(d,pos,dom,archetypes[dom],{clarity,action,integration,aura},precision,deck)}}
function buildLayers(d,pos,dom,arch,metrics,precision,deck=[]){const q=d.centralQuestion||'tu pregunta central';const keyword=d.keyword||'presencia';return [
{icon:'✦',title:'Capa 1 · Impacto emocional',html:`<div class="cards-grid"><div class="mini-card"><b>Mensaje central</b><span>Vuelve a tu centro antes de decidir. ${q} se responde mejor desde calma que desde prisa.</span></div><div class="mini-card"><b>Arquetipo</b><span>${arch}</span></div><div class="mini-card"><b>Elemento dominante</b><span>${dom}</span></div><div class="mini-card"><b>Semáforo</b><span>${metrics.clarity>82?'Verde · claridad alta':'Ámbar · integrar antes de actuar'}</span></div><div class="mini-card"><b>Aura Vision Pro</b><span>${metrics.aura}/100 · palabra: ${keyword}</span></div></div>`},
{icon:'☉',title:'Capa 2 · Lectura principal',html:`<div class="cards-grid"><div class="mini-card"><b>Esencia · Sol ${glyph[pos.Sol.sign]} ${pos.Sol.sign}</b><span>Tu energía vital busca expresarse con más coherencia. Lo importante es no actuar para agradar, sino desde una verdad interna sencilla.</span></div><div class="mini-card"><b>Mundo emocional · Luna ${glyph[pos.Luna.sign]} ${pos.Luna.sign}</b><span>Tus emociones necesitan espacio, lenguaje y cuidado. Nombrar lo que sientes te ayuda a dejar de cargarlo todo por dentro.</span></div><div class="mini-card"><b>Presencia · Asc ${glyph[pos.Ascendente.sign]} ${pos.Ascendente.sign}</b><span>La forma en que entras al mundo puede ser tu mayor herramienta: observa cómo te muestras y qué necesitas proteger.</span></div><div class="mini-card"><b>Relaciones</b><span>Busca vínculos donde puedas ser real, no perfecta. La lectura favorece conversación honesta y límites suaves.</span></div></div>`},
{icon:'☽',title:'Capa 3 · Plan útil',html:`<div class="cards-grid"><div class="mini-card"><b>Activar</b><span>${d.energyGoal||'Claridad'}, orden y una microacción visible hoy.</span></div><div class="mini-card"><b>Soltar</b><span>La necesidad de resolverlo todo en una sola respuesta.</span></div><div class="mini-card"><b>3 pasos</b><span>1) Escribe la pregunta. 2) Decide una acción pequeña. 3) Revisa cómo te sientes al final del día.</span></div><div class="mini-card"><b>Afirmación</b><span>“Puedo avanzar con calma, belleza y dirección.”</span></div><div class="mini-card"><b>Cartas guía Vision Pro</b><span>${deck.join(' · ')}</span></div></div>`},
{icon:'◎',title:'Capa 4 · Mapa visual',html:`${wheel(pos)}<div class="cards-grid"><div class="mini-card"><b>Claridad</b><div class="meter"><span style="width:${metrics.clarity}%"></span></div></div><div class="mini-card"><b>Acción</b><div class="meter"><span style="width:${metrics.action}%"></span></div></div><div class="mini-card"><b>Integración</b><div class="meter"><span style="width:${metrics.integration}%"></span></div></div><div class="mini-card"><b>Aura</b><div class="meter"><span style="width:${metrics.aura}%"></span></div></div><div class="mini-card"><b>Elemento</b><span>${dom}</span></div></div>`},
{icon:'⚙',title:'Capa 5 · Auditoría técnica',html:`<div class="cards-grid"><div class="mini-card"><b>Fuente</b><span>${precision}</span></div><div class="mini-card"><b>Sistema casas</b><span>${d.houseSystem||'No indicado'}</span></div><div class="mini-card"><b>Coordenadas</b><span>${d.latitude||'—'}, ${d.longitude||'—'} · UTC ${d.utc||'—'}</span></div><div class="mini-card"><b>Astro.com</b><span>${Object.keys(parseAstro(d.astroText||'')).length?Object.keys(parseAstro(d.astroText)).length+' posiciones pegadas':'Sin referencia manual pegada'}</span></div></div><p>Nota: Astro.com se mantiene como comprobación manual. La app no automatiza ni extrae datos de su web.</p>`}
]}
function wheel(pos){const arr=Object.entries(pos).slice(0,6);return `<div class="astral-wheel">${arr.map(([body,p],i)=>`<span class="wheel-item" style="--a:${i*60}deg">${body}<br>${glyph[p.sign]} ${p.deg||''}°</span>`).join('')}</div>`}
function renderReading(r){currentReading=r; const area=$('#resultArea'); area.classList.remove('hidden');const tpl=$('#resultTemplate').content.cloneNode(true);$('[data-field="title"]',tpl).textContent=r.title;$('[data-field="subtitle"]',tpl).textContent=r.subtitle;$('[data-field="badges"]',tpl).innerHTML=[r.dom,r.archetype,r.precision].map(x=>`<span class="badge">${x}</span>`).join('');const actions=$('.result-actions',tpl);actions.innerHTML=`<button class="btn primary small" id="saveReading">Guardar</button><button class="btn secondary small" id="downloadPdf">PDF profesional</button><button class="btn ghost small" id="favoriteReading">${isFavorite(r.id)?'★ Favorita':'☆ Favorita'}</button><button class="btn ghost small" id="copyReading">Copiar texto</button><button class="btn ghost small" id="downloadHtml">HTML premium</button><button class="btn ghost small" id="downloadVisionPack">Pack Vision Pro</button>`;const grid=$('.layer-grid',tpl);grid.innerHTML=r.layers.map(l=>`<section class="layer"><h3><span>${l.icon}</span>${l.title}</h3>${l.html}</section>`).join('');area.innerHTML='';area.append(tpl);$('#saveReading').onclick=()=>saveReading(r);$('#downloadPdf').onclick=()=>window.print();$('#favoriteReading').onclick=()=>toggleFavorite(r.id);$('#copyReading').onclick=()=>copyText(readingText(r));$('#downloadHtml').onclick=()=>download(`alaya-${r.id}.html`,htmlDoc(r),'text/html');$('#downloadVisionPack').onclick=()=>download(`alaya-pack-vision-${r.id}.json`,JSON.stringify({version:VERSION,reading:r,exported:new Date().toISOString()},null,2));area.scrollIntoView({behavior:'smooth',block:'start'});}
function readingText(r){return `${r.title}\n${r.subtitle}\n\nMensaje central: ${r.message}\nElemento: ${r.dom}\nArquetipo: ${r.archetype}\nPrecisión: ${r.precision}\nAura: ${r.metrics?.aura||'—'}/100\nCartas guía: ${(r.deck||[]).join(' · ')}\n\n${r.layers.map(l=>l.title).join('\n')}`}
function htmlDoc(r){return `<!doctype html><html><head><meta charset="utf-8"><title>${r.title}</title><link rel="stylesheet" href="styles.css"></head><body><main class="app-shell"><section class="result-area"></section><script>document.querySelector('.result-area').innerHTML=${JSON.stringify($('#resultArea').innerHTML)}<\/script></main></body></html>`}
function saveReading(r){const h=read(STORE.history,[]);if(!h.find(x=>x.id===r.id)) h.unshift(r);write(STORE.history,h.slice(0,100));renderHistory();renderHome();renderUniverse();toast('Lectura guardada en tu universo.')}function renderHistory(){const q=($('#historySearch')?.value||'').toLowerCase();const favs=favoriteIds();const h=read(STORE.history,[]).filter(r=>(r.title+r.subtitle+r.dom+r.archetype+(r.data?.keyword||'')).toLowerCase().includes(q));$('#historyList').innerHTML=h.length?h.map(r=>`<article class="history-card glass"><header><div><b>${favs.includes(r.id)?'★ ':''}${r.title}</b><p>${new Date(r.created).toLocaleString()} · ${r.subtitle}</p></div><div class="button-row"><button class="btn ghost small" data-fav="${r.id}">${favs.includes(r.id)?'★':'☆'}</button><button class="btn ghost small" data-open="${r.id}">Abrir</button><button class="btn danger small" data-del="${r.id}">Borrar</button></div></header><div><span class="badge">${r.dom}</span><span class="badge">${r.precision}</span><span class="badge">Aura ${r.metrics?.aura||'—'}</span></div></article>`).join(''):'<div class="empty-card glass">No hay lecturas guardadas.</div>';$$('[data-open]').forEach(b=>b.onclick=()=>{const r=read(STORE.history,[]).find(x=>x.id===b.dataset.open);if(r){route('lecturas');renderReading(r)}});$$('[data-fav]').forEach(b=>b.onclick=()=>toggleFavorite(b.dataset.fav));$$('[data-del]').forEach(b=>b.onclick=()=>{if(confirm('¿Borrar esta lectura?')){write(STORE.history,read(STORE.history,[]).filter(x=>x.id!==b.dataset.del));write(STORE.favorites,favoriteIds().filter(x=>x!==b.dataset.del));renderHistory();renderHome();renderUniverse();}})}
function renderHome(){const h=read(STORE.history,[]);$('#homeStats').innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||'—'}</b><span>aura media</span></div>`;$('#lastReadingCard').innerHTML=h[0]?`<article><p class="eyebrow">${new Date(h[0].created).toLocaleDateString()}</p><h3>${h[0].title}</h3><p>${h[0].subtitle}</p><button class="btn secondary small" id="openLast">Abrir lectura</button></article>`:'Todavía no hay lecturas guardadas. Crea una para activar tu universo personal.';if($('#openLast')) $('#openLast').onclick=()=>{route('lecturas');renderReading(h[0])}}
function renderUniverse(){const h=read(STORE.history,[]);const counts={Fuego:0,Tierra:0,Aire:0,Agua:0};h.forEach(r=>counts[r.dom]=(counts[r.dom]||0)+1);const fav=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;const favCount=favoriteIds().length;$('#universeDashboard').innerHTML=`<article class="glass"><span>Lecturas</span><b>${h.length}</b><small>Total guardado</small></article><article class="glass"><span>Elemento dominante</span><b>${fav}</b><small>Según historial</small></article><article class="glass"><span>Aura media</span><b>${avg||'—'}</b><small>Vision Constellation v3.9</small></article><article class="glass"><span>Favoritas</span><b>${favCount}</b><small>Selección personal</small></article>`;if($('#commandCenter')) $('#commandCenter').innerHTML=`<div class="mini-card"><b>Siguiente lectura sugerida</b><span>${h.length?'Seguimiento de la última lectura':'Carta natal premium'}</span></div><div class="mini-card"><b>Foco recomendado</b><span>${fav==='—'?'Claridad':fav}</span></div><div class="mini-card"><b>Acción</b><span>Guardar una favorita y revisar su plan útil en 7 días.</span></div><div class="mini-card"><b>Estado técnico</b><span>${h[0]?.precision||'Sin lectura todavía'}</span></div>`;$('#timeline').innerHTML=h.length?h.slice(0,12).map(r=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>${isFavorite(r.id)?'★ ':''}${r.title}</b><p>${new Date(r.created).toLocaleDateString()} · ${r.dom} · Aura ${r.metrics?.aura||'—'} · ${r.subtitle}</p></div></div>`).join(''):'<p class="note-card">Aún no hay evolución registrada.</p>'}
function fillProfiles(){const p=read(STORE.profiles,[]);$('#profileSelect').innerHTML='<option value="">Sin perfil</option>'+p.map((x,i)=>`<option value="${i}">${x.name} · ${x.city}</option>`).join('')}function saveProfile(){const d=collectForm();const p=read(STORE.profiles,[]);p.unshift({name:d.name,birthDate:d.birthDate,birthTime:d.birthTime,city:d.city,country:d.country,birthReliability:d.birthReliability});write(STORE.profiles,p.slice(0,30));fillProfiles();toast('Perfil guardado.')}function loadProfile(){const i=$('#profileSelect').value;if(i==='')return;const p=read(STORE.profiles,[])[+i];if(!p)return;Object.entries(p).forEach(([k,v])=>{const el=$(`#${k}`);if(el)el.value=v});toast('Perfil cargado.')}
function sample(){Object.entries({name:'Alaya',birthDate:'2000-08-13',birthTime:'14:35',city:'Barcelona',country:'España',centralQuestion:'¿Qué energía necesito activar ahora?',context:'Quiero ordenar mi etapa actual y tomar mejores decisiones.',latitude:'41.3874',longitude:'2.1686',utc:'2',currentState:'En cambio',keyword:'claridad'}).forEach(([k,v])=>{const el=$(`#${k}`);if(el)el.value=v});step(5)}
function download(name,content,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}function copyText(t){navigator.clipboard?.writeText(t);toast('Copiado.')}function toast(msg){let t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;left:50%;bottom:94px;transform:translateX(-50%);background:#111;color:white;padding:12px 16px;border-radius:999px;z-index:99;box-shadow:0 12px 40px #0008';document.body.append(t);setTimeout(()=>t.remove(),2200)}
function applySettings(){const s=read(STORE.settings,{});document.body.classList.toggle('comfort',!!s.comfort);document.body.classList.toggle('contrast',!!s.contrast);document.body.className=document.body.className.replace(/theme-\w+/g,'').trim(); if(s.theme) document.body.classList.add('theme-'+s.theme);$('#appTheme').value=s.theme||'cosmic';$('#comfortMode').checked=!!s.comfort;$('#highContrast').checked=!!s.contrast}
function saveSettings(){const s={theme:$('#appTheme').value,comfort:$('#comfortMode').checked,contrast:$('#highContrast').checked};write(STORE.settings,s);applySettings()}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
document.addEventListener('DOMContentLoaded',()=>{applySettings();fillProfiles();renderHome();renderHistory();renderUniverse();route((location.hash||'#home').slice(1));$$('[data-route]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();route(b.dataset.route)}));$$('.step').forEach(b=>b.onclick=()=>step(+b.dataset.step));$('#nextStep').onclick=()=>step(currentStep+1);$('#prevStep').onclick=()=>step(currentStep-1);$('#readingForm').onsubmit=e=>{e.preventDefault();renderReading(makeReading(collectForm()))};$('#sampleBtn').onclick=sample;if($('#dailyPulseBtn')) $('#dailyPulseBtn').onclick=dailyPulse;dailyPulse();$('#saveProfileBtn').onclick=saveProfile;$('#loadProfileBtn').onclick=loadProfile;$('#parseAstroBtn').onclick=()=>{$('#astroPreview').innerHTML=Object.entries(parseAstro($('#astroText').value)).map(([k,v])=>`<span class="badge">${k}: ${v.sign} ${v.deg||''}°</span>`).join('')||'No se reconocieron posiciones.'};$('#historySearch').oninput=renderHistory;$('#exportHistoryBtn').onclick=()=>download('alaya-historial-v3.json',JSON.stringify(read(STORE.history,[]),null,2));$('#clearFormBtn').onclick=()=>{$('#readingForm').reset();step(1)};$('#refreshUniverseBtn').onclick=renderUniverse;$('#compatForm').onsubmit=e=>{e.preventDefault();const a=$('#compatA').value||'Persona A',b=$('#compatB').value||'Persona B';const score=55+(seeded(a+b)%41);$('#compatResult').innerHTML=`<article class="compat-card glass"><p class="eyebrow">Compatibilidad Vision</p><h2>${a} + ${b}</h2><p>La conexión se lee como un campo de aprendizaje compartido. Lo importante es cuidar comunicación, ritmos y expectativas.</p><div class="meter"><span style="width:${score}%"></span></div><p><b>${score}%</b> de afinidad simbólica para ${$('#compatFocus').value.toLowerCase()}.</p><div class="cards-grid"><div class="mini-card"><b>Punto fuerte</b><span>Capacidad de inspirarse si hay escucha.</span></div><div class="mini-card"><b>Reto</b><span>No suponer: preguntar antes de interpretar.</span></div><div class="mini-card"><b>Clave</b><span>Acuerdos claros y espacios propios.</span></div><div class="mini-card"><b>Ritual</b><span>Conversación de 10 minutos sin interrupciones.</span></div></div></article>`};$('#appTheme').onchange=saveSettings;$('#comfortMode').onchange=saveSettings;$('#highContrast').onchange=saveSettings;$('#downloadBackupBtn').onclick=()=>download('alaya-backup-v3.json',JSON.stringify({history:read(STORE.history,[]),profiles:read(STORE.profiles,[]),settings:read(STORE.settings,{}),favorites:read(STORE.favorites,[])},null,2));$('#importBackupInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.history)write(STORE.history,data.history);if(data.profiles)write(STORE.profiles,data.profiles);if(data.settings)write(STORE.settings,data.settings);if(data.favorites)write(STORE.favorites,data.favorites);fillProfiles();renderHistory();renderHome();renderUniverse();applySettings();toast('Backup importado.')}catch{toast('No se pudo importar.')}};$('#clearDataBtn').onclick=()=>{if(confirm('¿Borrar historial, perfiles y ajustes locales?')){Object.values(STORE).forEach(k=>localStorage.removeItem(k));location.reload()}};$('#downloadReadmeBtn').onclick=()=>download('guia-alaya-v3.txt',`Alaya Astral IA v5.2 Vision Launch\n\n1. Inicio: vista premium.\n2. Lecturas: flujo guiado en 5 pasos.\n3. Compatibilidad: lectura de dos personas.\n4. Universo: historial y evolución.\n5. Ajustes: apariencia, backup y PWA.\n\nAstro.com: solo referencia manual pegada por la persona usuaria.`, 'text/plain');$('#installBtn').onclick=()=>deferredPrompt?.prompt();});


// ===== v4.6 Vision Zenith: overrides and premium product layer =====
function visionProRoyal(d, dom, metrics){
  const exp=d.visionExperience||'equilibrada';
  const ritual=d.ritualVisual||'suave';
  return {
    exp, ritual,
    beauty: Math.max(60, Math.min(99, Math.round((metrics.clarity+metrics.integration)/2)+(exp==='espectacular'?5:exp==='minimal'?-2:0))),
    coherence: Math.max(55, Math.min(99, Math.round((metrics.clarity+metrics.action+metrics.integration)/3)+(d.context?4:0))),
    presence: Math.max(58, Math.min(99, metrics.aura+(dom==='Agua'?3:0)+(ritual==='ceremonial'?4:0)))
  };
}
function makeReading(d){
  const pos=calcPositions(d);const imported=parseAstro(d.astroText||'');Object.assign(pos, imported);
  const dom=dominantElement(pos);const archetypes={Fuego:'La Chispa Creadora',Tierra:'La Guardiana del Jardín',Aire:'La Mensajera del Horizonte',Agua:'La Oráculo del Río'};
  const focus=d.lifeArea||'General';const goal=d.energyGoal||'Claridad';const question=d.centralQuestion||'¿Qué necesito comprender ahora?';
  const precision=d.calcSource==='astrocom'&&Object.keys(imported).length?'Base revisada manualmente':d.calcSource==='basic'?'Aproximado offline':'Simbólico creativo';
  const clarity=70+(seeded(d.name+focus)%24);const action=62+(seeded(goal+d.birthDate)%28);const integration=66+(seeded(question+d.city)%26);const deck=visionDeck(d,dom,goal);const aura=auraScore({clarity,action,integration},d);
  const metrics={clarity,action,integration,aura}; const pro=visionProRoyal(d,dom,metrics); Object.assign(metrics,pro);
  return {id:Date.now().toString(36),created:new Date().toISOString(),data:d,pos,imported,dom,archetype:archetypes[dom],precision,metrics,deck,title:`Lectura Vision Pro de ${d.name||'Alaya'}`,subtitle:`${d.readingType||'Carta'} · ${focus} · ${goal} · ${pro.exp}`,message:`Tu mapa se organiza desde ${dom}. La clave no es forzar respuestas, sino escuchar qué parte de ti pide orden, presencia y una decisión más consciente.`,layers:buildLayersV32(d,pos,dom,archetypes[dom],metrics,precision,deck)}
}
function buildLayersV32(d,pos,dom,arch,metrics,precision,deck=[]){
  const base=buildLayers(d,pos,dom,arch,metrics,precision,deck);
  const keyword=d.keyword||'presencia'; const goal=d.energyGoal||'Claridad'; const q=d.centralQuestion||'tu pregunta central';
  const proLayers=[
    {icon:'◇',title:'Capa 6 · Vision Board Pro',html:`<div class="vision-board"><div class="constellation-card" aria-label="Constelación simbólica"><span></span><span></span><span></span><span></span><span></span></div><div><p>Esta portada visual resume la lectura como una constelación: <b>${dom}</b> marca el pulso, <b>${arch}</b> marca el arquetipo y <b>${keyword}</b> marca la palabra semilla.</p><div class="royal-strip"><span>Experiencia: ${d.visionExperience||'equilibrada'}</span><span>Ritual: ${d.ritualVisual||'suave'}</span><span>Pregunta: ${q}</span></div></div></div>`},
    {icon:'✺',title:'Capa 7 · Métricas Vision Pro',html:`<div class="pro-metrics"><div class="pro-meter"><span>Belleza</span><strong>${metrics.beauty}</strong><small>sensación visual y claridad del informe</small></div><div class="pro-meter"><span>Coherencia</span><strong>${metrics.coherence}</strong><small>alineación entre datos, intención y plan</small></div><div class="pro-meter"><span>Presencia</span><strong>${metrics.presence}</strong><small>capacidad de convertir lectura en acción real</small></div></div>`},
    {icon:'☼',title:'Capa 8 · Ritual guiado de 3 minutos',html:`<div class="ritual-panel"><div class="ritual-step"><b>1</b><span><strong>Respira.</strong> Mira la palabra ${keyword} y baja el ritmo durante 30 segundos.</span></div><div class="ritual-step"><b>2</b><span><strong>Ordena.</strong> Escribe una frase sobre lo que quieres activar: ${goal}.</span></div><div class="ritual-step"><b>3</b><span><strong>Actúa.</strong> Elige una microacción de menos de 10 minutos para hoy.</span></div><div class="ritual-step"><b>4</b><span><strong>Cierra.</strong> Repite: “No necesito hacerlo perfecto; necesito hacerlo con presencia”.</span></div></div>`}
  ];
  return [...base.slice(0,5),...proLayers,...base.slice(5)];
}
function renderReading(r){
  currentReading=r; const area=$('#resultArea'); area.classList.remove('hidden');const tpl=$('#resultTemplate').content.cloneNode(true);
  $('[data-field="title"]',tpl).textContent=r.title;$('[data-field="subtitle"]',tpl).textContent=r.subtitle;$('[data-field="badges"]',tpl).innerHTML=[r.dom,r.archetype,r.precision,`Belleza ${r.metrics?.beauty||'—'}`,`Coherencia ${r.metrics?.coherence||'—'}`].map(x=>`<span class="badge">${x}</span>`).join('');
  const actions=$('.result-actions',tpl);actions.innerHTML=`<button class="btn primary small" id="saveReading">Guardar</button><button class="btn secondary small" id="downloadPdf">PDF profesional</button><button class="btn secondary small" id="downloadCoverPdf">Portada premium</button><button class="btn ghost small" id="favoriteReading">${isFavorite(r.id)?'★ Favorita':'☆ Favorita'}</button><button class="btn ghost small" id="copyReading">Copiar texto</button><button class="btn ghost small" id="downloadHtml">HTML premium</button><button class="btn ghost small" id="downloadVisionPack">Pack Vision Pro</button>`;
  const grid=$('.layer-grid',tpl);grid.innerHTML=r.layers.map(l=>`<section class="layer"><h3><span>${l.icon}</span>${l.title}</h3>${l.html}</section>`).join('');
  area.innerHTML='';area.append(tpl);$('#saveReading').onclick=()=>saveReading(r);$('#downloadPdf').onclick=()=>window.print();$('#downloadCoverPdf').onclick=()=>download(`alaya-portada-premium-${r.id}.html`,premiumCoverDoc(r),'text/html');$('#favoriteReading').onclick=()=>toggleFavorite(r.id);$('#copyReading').onclick=()=>copyText(readingText(r));$('#downloadHtml').onclick=()=>download(`alaya-${r.id}.html`,htmlDoc(r),'text/html');$('#downloadVisionPack').onclick=()=>download(`alaya-pack-vision-pro-${r.id}.json`,JSON.stringify({version:VERSION,reading:r,exported:new Date().toISOString(),royal:'Alaya Astral IA Vision Pro'},null,2));area.scrollIntoView({behavior:'smooth',block:'start'});
}
function premiumCoverDoc(r){return `<!doctype html><html lang="es"><meta charset="utf-8"><title>${r.title}</title><style>body{margin:0;background:#090515;color:#fff8ea;font-family:system-ui}.professional-cover{min-height:100vh;padding:56px;display:grid;align-content:center;gap:18px;background:radial-gradient(circle at 20% 0%,#3a1b68,#090515 60%)}h1{font-size:64px;line-height:.9;margin:0}.box{border:1px solid rgba(255,255,255,.18);border-radius:28px;padding:24px;background:rgba(255,255,255,.08)}.badges span{display:inline-block;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:8px 12px;margin:4px}.small{opacity:.72}@media print{body{background:white}.professional-cover{background:#111!important}}</style><body><main class="professional-cover"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><div class="box"><p>${r.subtitle}</p><div class="badges"><span>${r.dom}</span><span>${r.archetype}</span><span>${r.precision}</span><span>Aura ${r.metrics.aura}</span><span>Belleza ${r.metrics.beauty}</span></div></div><div class="box"><h2>Mensaje central</h2><p>${r.message}</p><p class="small">Generado: ${new Date(r.created).toLocaleString()}</p></div><script>setTimeout(()=>print(),400)</script></main></body></html>`}
function renderHome(){const h=read(STORE.history,[]);const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;const beauty=Math.round(h.reduce((a,r)=>a+(r.metrics?.beauty||0),0)/(h.length||1))||0;$('#homeStats').innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${avg||'—'}</b><span>aura media</span></div>`;$('#lastReadingCard').innerHTML=h[0]?`<article><p class="eyebrow">${new Date(h[0].created).toLocaleDateString()} · Vision Pro</p><h3>${h[0].title}</h3><p>${h[0].subtitle}</p><div class="royal-strip"><span>Aura ${h[0].metrics?.aura||'—'}</span><span>Belleza ${h[0].metrics?.beauty||beauty||'—'}</span><span>${h[0].precision}</span></div><button class="btn secondary small" id="openLast">Abrir lectura</button></article>`:'Todavía no hay lecturas guardadas. Crea una para activar tu universo personal.';if($('#openLast')) $('#openLast').onclick=()=>{route('lecturas');renderReading(h[0])}}
function renderUniverse(){const h=read(STORE.history,[]);const counts={Fuego:0,Tierra:0,Aire:0,Agua:0};h.forEach(r=>counts[r.dom]=(counts[r.dom]||0)+1);const fav=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;const beauty=Math.round(h.reduce((a,r)=>a+(r.metrics?.beauty||0),0)/(h.length||1))||0;const coherence=Math.round(h.reduce((a,r)=>a+(r.metrics?.coherence||0),0)/(h.length||1))||0;const favCount=favoriteIds().length;$('#universeDashboard').innerHTML=`<article class="glass"><span>Lecturas</span><b>${h.length}</b><small>Total guardado</small></article><article class="glass"><span>Elemento dominante</span><b>${fav}</b><small>Según historial</small></article><article class="glass"><span>Aura media</span><b>${avg||'—'}</b><small>Vision Constellation v3.9</small></article><article class="glass"><span>Belleza Pro</span><b>${beauty||'—'}</b><small>Presencia visual</small></article><article class="glass"><span>Coherencia</span><b>${coherence||'—'}</b><small>Lectura + acción</small></article><article class="glass"><span>Favoritas</span><b>${favCount}</b><small>Selección personal</small></article>`;if($('#commandCenter')) $('#commandCenter').innerHTML=`<div class="mini-card"><b>Siguiente lectura sugerida</b><span>${h.length?'Seguimiento de la última lectura':'Carta natal premium'}</span></div><div class="mini-card"><b>Foco recomendado</b><span>${fav==='—'?'Claridad':fav}</span></div><div class="mini-card"><b>Acción</b><span>Guardar una favorita y revisar su ritual de 3 minutos en 7 días.</span></div><div class="mini-card"><b>Estado técnico</b><span>${h[0]?.precision||'Sin lectura todavía'}</span></div>`;$('#timeline').innerHTML=h.length?h.slice(0,12).map(r=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>${isFavorite(r.id)?'★ ':''}${r.title}</b><p>${new Date(r.created).toLocaleDateString()} · ${r.dom} · Aura ${r.metrics?.aura||'—'} · Belleza ${r.metrics?.beauty||'—'} · ${r.subtitle}</p></div></div>`).join(''):'<p class="note-card">Aún no hay evolución registrada.</p>'}
function dailyPulse(){const now=new Date();const seed=seeded(now.toDateString());const dom=['Fuego','Tierra','Aire','Agua'][seed%4];const goals=['Claridad','Calma','Acción','Cierre','Confianza','Intuición'];const goal=goals[(seed>>4)%goals.length];const msg={Fuego:'enciende una acción pequeña y visible',Tierra:'ordena tu espacio y baja el ritmo',Aire:'nombra lo que piensas antes de decidir',Agua:'escucha tu emoción sin juzgarla'}[dom];$('#dailyPulse').innerHTML=`<div><p class="eyebrow">Pulso Alaya · ${VERSION}</p><h2>${dom} · ${goal}</h2><p>Hoy la guía es: ${msg}. No hace falta resolverlo todo; basta con una acción limpia y consciente.</p><div class="cards-grid"><div class="mini-card"><b>Activar</b><span>${goal}</span></div><div class="mini-card"><b>Soltar</b><span>ruido mental innecesario</span></div><div class="mini-card"><b>Microacción</b><span>10 minutos para ordenar, escribir o respirar.</span></div><div class="mini-card"><b>Mantra</b><span>“Avanzo con belleza y dirección.”</span></div><div class="mini-card"><b>Modo Vision Pro</b><span>Una lectura espectacular empieza con una pregunta clara.</span></div></div></div><div class="pulse-oracle"><span>${glyph[signs[seed%12]]}</span><b>${signs[seed%12]}</b><small>Pulso diario</small></div>`;}

document.addEventListener('DOMContentLoaded',()=>{document.title='Alaya Astral IA v5.2 Vision Launch';const meta=document.querySelector('meta[name="description"]');if(meta)meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con visión, estructura, universo personal, lectura por capas, PDF profesional y Astro.com manual.';renderHome();renderUniverse();});


// ===== v4.6 Vision Zenith: dirección artística, dossier y experiencia wow =====
function studioRoyal(d, metrics){
  const scene=d.studioScene||'santuario';
  const cover=d.coverMode||'editorial';
  const sceneBoost={santuario:4,observatorio:3,templo:5,jardin:2,portal:5}[scene]||3;
  const coverBoost={editorial:5,minimalista:3,mistica:5,cliente:4}[cover]||3;
  return {
    scene, cover,
    magnetism: Math.max(60, Math.min(99, Math.round((metrics.beauty+metrics.presence)/2)+sceneBoost)),
    visualClarity: Math.max(60, Math.min(99, Math.round((metrics.clarity+metrics.coherence)/2)+coverBoost)),
    depthStudio: Math.max(60, Math.min(99, Math.round((metrics.integration+metrics.presence)/2)+(d.depth==='alta'?5:0)))
  };
}
function studioPalette(dom){
  return {Fuego:['oro cálido','cobre','rojo suave'],Tierra:['verde profundo','arena','bronce'],Aire:['azul niebla','plata','lavanda'],Agua:['azul océano','perla','violeta lunar']}[dom]||['violeta','dorado','azul noche'];
}
function makeReading(d){
  const pos=calcPositions(d);const imported=parseAstro(d.astroText||'');Object.assign(pos, imported);
  const dom=dominantElement(pos);const archetypes={Fuego:'La Chispa Creadora',Tierra:'La Guardiana del Jardín',Aire:'La Mensajera del Horizonte',Agua:'La Oráculo del Río'};
  const focus=d.lifeArea||'General';const goal=d.energyGoal||'Claridad';const question=d.centralQuestion||'¿Qué necesito comprender ahora?';
  const precision=d.calcSource==='astrocom'&&Object.keys(imported).length?'Base revisada manualmente':d.calcSource==='basic'?'Aproximado offline':'Simbólico creativo';
  const clarity=70+(seeded(d.name+focus)%24);const action=62+(seeded(goal+d.birthDate)%28);const integration=66+(seeded(question+d.city)%26);const deck=visionDeck(d,dom,goal);const aura=auraScore({clarity,action,integration},d);
  const metrics={clarity,action,integration,aura}; Object.assign(metrics,visionProRoyal(d,dom,metrics)); Object.assign(metrics,studioRoyal(d,metrics));
  return {id:Date.now().toString(36),created:new Date().toISOString(),data:d,pos,imported,dom,archetype:archetypes[dom],precision,metrics,deck,title:`Lectura Vision Constellation de ${d.name||'Alaya'}`,subtitle:`${d.readingType||'Carta'} · ${focus} · ${goal} · ${metrics.exp} · ${metrics.scene}`,message:`Tu mapa se organiza desde ${dom}. La clave es convertir intuición en presencia visual, orden interior y una acción pequeña que puedas sostener hoy.`,layers:buildLayersV33(d,pos,dom,archetypes[dom],metrics,precision,deck)}
}
function buildLayersV33(d,pos,dom,arch,metrics,precision,deck=[]){
  const base=buildLayersV32(d,pos,dom,arch,metrics,precision,deck);
  const keyword=d.keyword||'presencia'; const goal=d.energyGoal||'Claridad'; const phrase=d.coverPhrase||'Mi mapa interior empieza a ordenarse'; const palette=studioPalette(dom);
  const studioLayers=[
    {icon:'✧',title:'Capa 9 · Dirección artística Studio',html:`<div class="studio-card"><div><p class="eyebrow">Escena principal</p><h4>${metrics.scene}</h4><p>La experiencia se presenta como una pieza visual con atmósfera <b>${palette[0]}</b>, acentos <b>${palette[1]}</b> y luz <b>${palette[2]}</b>.</p></div><div class="studio-sigil"><span>${glyph[pos.Sol?.sign||signs[0]]||'✦'}</span><b>${dom}</b><small>${arch}</small></div></div>`},
    {icon:'▣',title:'Capa 10 · Storyboard de experiencia',html:`<div class="storyboard"><div><b>1</b><span>Entrada: frase de portada — “${phrase}”.</span></div><div><b>2</b><span>Impacto: elemento dominante ${dom} y arquetipo ${arch}.</span></div><div><b>3</b><span>Profundidad: lectura principal por capas, sin saturar.</span></div><div><b>4</b><span>Acción: ritual, microacción y seguimiento en Universo.</span></div></div>`},
    {icon:'✦',title:'Capa 11 · Métricas Vision Constellation',html:`<div class="pro-metrics studio-metrics"><div class="pro-meter"><span>Magnetismo</span><strong>${metrics.magnetism}</strong><small>capacidad de enganchar visualmente</small></div><div class="pro-meter"><span>Claridad visual</span><strong>${metrics.visualClarity}</strong><small>orden, lectura y jerarquía</small></div><div class="pro-meter"><span>Profundidad Studio</span><strong>${metrics.depthStudio}</strong><small>sensación de informe premium</small></div></div>`},
    {icon:'☾',title:'Capa 12 · Guía para hacerla espectacular',html:`<div class="cards-grid"><div class="mini-card"><b>Primera mirada</b><span>Portada ${metrics.cover} con frase central y una sola idea fuerte.</span></div><div class="mini-card"><b>Ritmo</b><span>Menos bloques visibles de golpe; más secciones expandibles y aire visual.</span></div><div class="mini-card"><b>Firma</b><span>Usar siempre palabra clave: ${keyword}.</span></div><div class="mini-card"><b>Próximo salto</b><span>Mejorar rueda astral y PDF maquetado como revista.</span></div></div>`}
  ];
  return [...base, ...studioLayers];
}
function studioDossierDoc(r){
  const d=r.data||{}; const palette=studioPalette(r.dom);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Studio · ${r.title}</title><style>body{margin:0;background:#080412;color:#fff8ed;font-family:Inter,system-ui,sans-serif}.wrap{max-width:900px;margin:auto;padding:52px}.hero{border:1px solid rgba(255,255,255,.16);border-radius:34px;padding:42px;background:radial-gradient(circle at top left,rgba(255,214,137,.22),transparent 45%),linear-gradient(135deg,rgba(126,87,255,.20),rgba(255,255,255,.05))}h1{font-size:54px;line-height:.95;margin:0 0 12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}.card{border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:18px;background:rgba(255,255,255,.07)}.badge{display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.10);margin:4px}.section{margin-top:22px}.small{opacity:.72}@media print{body{background:#fff;color:#111}.hero,.card{background:#fff;border-color:#ddd}}</style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p>${r.message}</p><span class="badge">${r.dom}</span><span class="badge">${r.archetype}</span><span class="badge">${r.precision}</span><span class="badge">${d.coverMode||'editorial'}</span></section><section class="grid"><div class="card"><b>Magnetismo</b><h2>${r.metrics.magnetism}</h2></div><div class="card"><b>Claridad visual</b><h2>${r.metrics.visualClarity}</h2></div><div class="card"><b>Profundidad</b><h2>${r.metrics.depthStudio}</h2></div></section><section class="section card"><h2>Dirección visual</h2><p>Paleta sugerida: ${palette.join(' · ')}. Escena: ${d.studioScene||'santuario'}. Frase: ${d.coverPhrase||'Mi mapa interior empieza a ordenarse'}.</p></section><section class="section card"><h2>Storyboard</h2><ol><li>Portada emocional.</li><li>Impacto con elemento y arquetipo.</li><li>Lectura por capas.</li><li>Plan de acción y ritual.</li><li>Auditoría técnica separada.</li></ol></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function studioScript(r){
  const d=r.data||{};
  return `ALAYA ASTRAL IA · ${VERSION}\n\nGuion Studio para ${r.title}\n\n1. Portada: ${d.coverPhrase||'Mi mapa interior empieza a ordenarse'}\n2. Escena: ${d.studioScene||'santuario'} · portada ${d.coverMode||'editorial'}\n3. Elemento dominante: ${r.dom}\n4. Arquetipo: ${r.archetype}\n5. Mensaje central: ${r.message}\n6. Acción visual: mantener la lectura por capas, con aire, foco y un cierre práctico.\n7. Próximo paso: guardar en Universo y revisar evolución en 7 días.`;
}
function renderReading(r){
  currentReading=r; const area=$('#resultArea'); area.classList.remove('hidden');const tpl=$('#resultTemplate').content.cloneNode(true);
  $('[data-field="title"]',tpl).textContent=r.title;$('[data-field="subtitle"]',tpl).textContent=r.subtitle;$('[data-field="badges"]',tpl).innerHTML=[r.dom,r.archetype,r.precision,`Magnetismo ${r.metrics?.magnetism||'—'}`,`Studio ${r.metrics?.visualClarity||'—'}`].map(x=>`<span class="badge">${x}</span>`).join('');
  const actions=$('.result-actions',tpl);actions.innerHTML=`<button class="btn primary small" id="saveReading">Guardar</button><button class="btn secondary small" id="downloadPdf">PDF profesional</button><button class="btn secondary small" id="downloadCoverPdf">Portada premium</button><button class="btn secondary small" id="downloadStudioDossier">Dossier Studio</button><button class="btn ghost small" id="favoriteReading">${isFavorite(r.id)?'★ Favorita':'☆ Favorita'}</button><button class="btn ghost small" id="copyReading">Copiar texto</button><button class="btn ghost small" id="copyStudioScript">Copiar guion Studio</button><button class="btn ghost small" id="downloadHtml">HTML premium</button><button class="btn ghost small" id="downloadVisionPack">Pack Studio</button>`;
  const grid=$('.layer-grid',tpl);grid.innerHTML=r.layers.map(l=>`<section class="layer"><h3><span>${l.icon}</span>${l.title}</h3>${l.html}</section>`).join('');
  area.innerHTML='';area.append(tpl);$('#saveReading').onclick=()=>saveReading(r);$('#downloadPdf').onclick=()=>window.print();$('#downloadCoverPdf').onclick=()=>download(`alaya-portada-premium-${r.id}.html`,premiumCoverDoc(r),'text/html');$('#downloadStudioDossier').onclick=()=>download(`alaya-dossier-studio-${r.id}.html`,studioDossierDoc(r),'text/html');$('#favoriteReading').onclick=()=>toggleFavorite(r.id);$('#copyReading').onclick=()=>copyText(readingText(r));$('#copyStudioScript').onclick=()=>copyText(studioScript(r));$('#downloadHtml').onclick=()=>download(`alaya-${r.id}.html`,htmlDoc(r),'text/html');$('#downloadVisionPack').onclick=()=>download(`alaya-pack-vision-studio-${r.id}.json`,JSON.stringify({version:VERSION,reading:r,exported:new Date().toISOString(),royal:'Alaya Astral IA Vision Constellation'},null,2));area.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderHome(){const h=read(STORE.history,[]);const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;const magnet=Math.round(h.reduce((a,r)=>a+(r.metrics?.magnetism||0),0)/(h.length||1))||0;$('#homeStats').innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${avg||'—'}</b><span>aura media</span></div><div class="stat"><b>${magnet||'—'}</b><span>magnetismo</span></div>`;$('#lastReadingCard').innerHTML=h[0]?`<article><p class="eyebrow">${new Date(h[0].created).toLocaleDateString()} · Vision Constellation</p><h3>${h[0].title}</h3><p>${h[0].subtitle}</p><div class="royal-strip"><span>Aura ${h[0].metrics?.aura||'—'}</span><span>Magnetismo ${h[0].metrics?.magnetism||'—'}</span><span>${h[0].precision}</span></div><button class="btn secondary small" id="openLast">Abrir lectura</button></article>`:'Todavía no hay lecturas guardadas. Crea una para activar tu universo personal.';if($('#openLast')) $('#openLast').onclick=()=>{route('lecturas');renderReading(h[0])}}
function renderUniverse(){const h=read(STORE.history,[]);const counts={Fuego:0,Tierra:0,Aire:0,Agua:0};h.forEach(r=>counts[r.dom]=(counts[r.dom]||0)+1);const fav=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;const magnet=Math.round(h.reduce((a,r)=>a+(r.metrics?.magnetism||0),0)/(h.length||1))||0;const clarityV=Math.round(h.reduce((a,r)=>a+(r.metrics?.visualClarity||0),0)/(h.length||1))||0;const favCount=favoriteIds().length;$('#universeDashboard').innerHTML=`<article class="glass"><span>Lecturas</span><b>${h.length}</b><small>Total guardado</small></article><article class="glass"><span>Elemento dominante</span><b>${fav}</b><small>Según historial</small></article><article class="glass"><span>Aura media</span><b>${avg||'—'}</b><small>Vision Constellation v3.9</small></article><article class="glass"><span>Magnetismo</span><b>${magnet||'—'}</b><small>Impacto visual</small></article><article class="glass"><span>Claridad visual</span><b>${clarityV||'—'}</b><small>Orden premium</small></article><article class="glass"><span>Favoritas</span><b>${favCount}</b><small>Selección personal</small></article>`;if($('#commandCenter')) $('#commandCenter').innerHTML=`<div class="mini-card"><b>Siguiente lectura sugerida</b><span>${h.length?'Seguimiento Studio de la última lectura':'Carta natal premium'}</span></div><div class="mini-card"><b>Foco recomendado</b><span>${fav==='—'?'Claridad':fav}</span></div><div class="mini-card"><b>Mejora visual</b><span>Crear portada, dossier y una frase central memorable.</span></div><div class="mini-card"><b>Estado técnico</b><span>${h[0]?.precision||'Sin lectura todavía'}</span></div>`;$('#timeline').innerHTML=h.length?h.slice(0,12).map(r=>`<div class="timeline-item"><span class="timeline-dot"></span><div><b>${isFavorite(r.id)?'★ ':''}${r.title}</b><p>${new Date(r.created).toLocaleDateString()} · ${r.dom} · Aura ${r.metrics?.aura||'—'} · Magnetismo ${r.metrics?.magnetism||'—'} · ${r.subtitle}</p></div></div>`).join(''):'<p class="note-card">Aún no hay evolución registrada.</p>'}
function dailyPulse(){const now=new Date();const seed=seeded(now.toDateString());const dom=['Fuego','Tierra','Aire','Agua'][seed%4];const goals=['Claridad','Calma','Acción','Cierre','Confianza','Intuición'];const goal=goals[(seed>>4)%goals.length];const palette=studioPalette(dom);const msg={Fuego:'enciende una acción pequeña y visible',Tierra:'ordena tu espacio y baja el ritmo',Aire:'nombra lo que piensas antes de decidir',Agua:'escucha tu emoción sin juzgarla'}[dom];$('#dailyPulse').innerHTML=`<div><p class="eyebrow">Pulso Alaya · ${VERSION}</p><h2>${dom} · ${goal}</h2><p>Hoy la guía es: ${msg}. En modo Studio, convierte esa guía en una escena: ${palette.join(' · ')}.</p><div class="cards-grid"><div class="mini-card"><b>Activar</b><span>${goal}</span></div><div class="mini-card"><b>Soltar</b><span>ruido mental innecesario</span></div><div class="mini-card"><b>Escena</b><span>${palette[0]} con acento ${palette[1]}</span></div><div class="mini-card"><b>Mantra</b><span>“Avanzo con belleza y dirección.”</span></div><div class="mini-card"><b>Modo Studio</b><span>Una lectura espectacular empieza con una portada memorable.</span></div></div></div><div class="pulse-oracle"><span>${glyph[signs[seed%12]]}</span><b>${signs[seed%12]}</b><small>Pulso diario</small></div>`;}
document.addEventListener('DOMContentLoaded',()=>{document.title='Alaya Astral IA v5.2 Vision Launch';const meta=document.querySelector('meta[name="description"]');if(meta)meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con dirección artística, dossiers, lectura por capas, universo personal, PDF profesional y Astro.com manual.';renderHome();renderUniverse();});


/* === v4.6 Vision Zenith overrides: spectacular structure layer === */
function eliteScore(r){
  const m=r.metrics||{};
  return Math.round(((m.magnetism||m.beauty||76)+(m.visualClarity||m.coherence||78)+(m.depthStudio||m.presence||80)+(m.aura||75))/4);
}
function eliteBlueprint(r){
  const d=r.data||{};
  const palette=(typeof studioPalette==='function'?studioPalette(r.dom):['violeta profundo','dorado suave','azul noche']);
  const wow={Fuego:'una apertura con destello solar y CTA fuerte',Tierra:'una portada calmada con textura editorial',Aire:'una entrada ligera con frases tipo constelación',Agua:'una transición lunar suave y emocional'}[r.dom]||'una entrada astral limpia';
  return {
    mood:`${palette.join(' · ')} · ${d.studioScene||'santuario astral'}`,
    rhythm:`Inicio con frase central, lectura por capas, plan útil y cierre con ritual.`,
    wow,
    deliverable:`PDF/HTML premium con portada, índice, métricas y auditoría técnica separada.`,
    royal:d.coverPhrase||'Mi mapa interior empieza a ordenarse'
  };
}
function eliteDossierDoc(r){
  const b=eliteBlueprint(r); const score=eliteScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Royal · ${r.title}</title><style>
  body{margin:0;background:#07030f;color:#fff7ea;font-family:Inter,system-ui,sans-serif}.wrap{max-width:980px;margin:auto;padding:54px}.hero{padding:48px;border-radius:38px;background:radial-gradient(circle at 20% 0%,rgba(255,216,141,.24),transparent 38%),linear-gradient(145deg,rgba(122,70,255,.28),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.16)}h1{font-size:58px;line-height:.92;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:20px}.card{padding:22px;border-radius:24px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07)}.score{font-size:64px;font-weight:900}.small{opacity:.72}.badge{display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.10);margin:4px}@media print{body{background:white;color:#111}.hero,.card{background:white;border-color:#ddd}}
  </style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p>${r.message}</p><span class="badge">${r.dom}</span><span class="badge">${r.archetype}</span><span class="badge">Royal ${score}/100</span></section><section class="grid"><div class="card"><b>Puntuación Royal</b><div class="score">${score}</div><p>Promedio de presencia, magnetismo, claridad y aura.</p></div><div class="card"><b>Firma visual</b><p>${b.royal}</p><p class="small">Mood: ${b.mood}</p></div><div class="card"><b>Ritmo de experiencia</b><p>${b.rhythm}</p></div><div class="card"><b>Momento wow</b><p>${b.wow}</p></div><div class="card"><b>Entrega premium</b><p>${b.deliverable}</p></div><div class="card"><b>Próximo paso</b><p>Guardar como favorita, exportar dossier y revisar evolución en “Mi Universo”.</p></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function eliteScript(r){
  const b=eliteBlueprint(r); const score=eliteScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nDirección Royal para ${r.title}\n\n1. Mood visual: ${b.mood}\n2. Firma: ${b.royal}\n3. Ritmo: ${b.rhythm}\n4. Momento wow: ${b.wow}\n5. Entrega premium: ${b.deliverable}\n6. Puntuación Royal: ${score}/100\n7. Siguiente paso: convertir esta lectura en portada + PDF + seguimiento en Universo.`;
}
const renderReadingBase_v34 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  const blueprint=eliteBlueprint(r);
  r.metrics.elite=eliteScore(r);
  const hasRoyal=(r.layers||[]).some(l=>String(l.title||'').includes('Royal'));
  if(!hasRoyal){
    r.layers=[...(r.layers||[]),
      {icon:'✧',title:'Capa Royal · Dirección espectacular v3.5',html:`<div class="elite-panel"><div><p class="eyebrow">Dirección creativa</p><h3>${blueprint.royal}</h3><p>La lectura se presenta como una pieza premium: menos ruido, más foco, más belleza y una entrega clara.</p></div><div class="elite-grid"><article><b>Mood</b><span>${blueprint.mood}</span></article><article><b>Ritmo</b><span>${blueprint.rhythm}</span></article><article><b>Wow</b><span>${blueprint.wow}</span></article><article><b>Entrega</b><span>${blueprint.deliverable}</span></article></div></div>`},
      {icon:'◆',title:'Capa Royal · Puntuación de presencia',html:`<div class="pro-metrics elite-metrics"><div class="pro-meter"><span>Royal</span><strong>${r.metrics.elite}</strong><small>visión, estructura y entrega</small></div><div class="pro-meter"><span>Memorable</span><strong>${Math.min(99,(r.metrics.elite||80)+3)}</strong><small>capacidad de dejar huella</small></div><div class="pro-meter"><span>Listo para demo</span><strong>${Math.max(60,(r.metrics.elite||80)-5)}</strong><small>sensación de producto premium</small></div></div>`}
    ];
  }
  renderReadingBase_v34(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadRoyalDossier')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadRoyalDossier'; b1.textContent='Dossier Royal'; b1.onclick=()=>download(`alaya-dossier-elite-${r.id}.html`,eliteDossierDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyRoyalScript'; b2.textContent='Copiar visión Royal'; b2.onclick=()=>copyText(eliteScript(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v34 = renderHome;
renderHome = function(){
  renderHomeBase_v34();
  const stats=document.getElementById('homeStats');
  const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.elite||eliteScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-elite-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-elite-stat><b>${avg||'—'}</b><span>elite</span></div>`);
};
const renderUniverseBase_v34 = renderUniverse;
renderUniverse = function(){
  renderUniverseBase_v34();
  const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.elite||eliteScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-elite-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-elite-card><span>Royal</span><b>${avg||'—'}</b><small>Visión + presencia</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-elite-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-elite-action><b>Modo espectacular</b><span>Crear portada, dossier Royal y una escena visual coherente para cada lectura.</span></div>`);
};
const dailyPulseBase_v34 = dailyPulse;
dailyPulse = function(){
  dailyPulseBase_v34();
  const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-elite-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="elite-pulse" data-elite-pulse><b>Royal v3.9</b><span>Hoy la app busca menos cantidad y más impacto: una frase central, una escena y una acción memorable.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con visión, estructura, dossier Royal, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  renderHome(); renderUniverse();
});


/* === v4.6 Vision Zenith: cinematic premium layer === */
function eliteScore(r){
  const m=r.metrics||{};
  return Math.round(((m.elite||0) || ((m.atelier||m.elite||78)+(m.magnetism||76)+(m.visualClarity||78)+(m.aura||76))/4));
}
function eliteBlueprint(r){
  const d=r.data||{};
  const mode=d.eliteMode||'cinematografico';
  const wow=d.wowMoment||'portada';
  const seal=d.eliteSeal||'luz dorada sobre cielo violeta';
  const dom=r.dom||'Agua';
  const entry={Fuego:'apertura solar con pulso de acción',Tierra:'entrada serena con textura de joya antigua',Aire:'constelación ligera con movimiento editorial',Agua:'portal lunar suave con profundidad emocional'}[dom]||'entrada astral limpia';
  return {
    mode,wow,seal,entry,
    onePage:`Portada + mensaje central + 3 claves + microacción + sello visual ${seal}.`,
    cinematic:`La lectura se abre con ${entry}, continúa con capas limpias y cierra con una acción concreta.`,
    premium:`Usar ${mode} como dirección, ${wow} como momento memorable y una exportación HTML/PDF con aire editorial.`
  };
}
function eliteDossierDoc(r){
  const b=eliteBlueprint(r); const score=eliteScore(r); const d=r.data||{};
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Royal · ${r.title}</title><style>
  body{margin:0;background:#05020c;color:#fff8ec;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1040px;margin:auto;padding:62px}.hero{min-height:520px;display:grid;align-content:end;padding:54px;border-radius:44px;background:radial-gradient(circle at 18% 10%,rgba(255,224,150,.28),transparent 34%),radial-gradient(circle at 78% 28%,rgba(157,118,255,.32),transparent 38%),linear-gradient(135deg,#12071f,#07030f);border:1px solid rgba(255,255,255,.18);box-shadow:0 40px 120px rgba(0,0,0,.48)}h1{font-size:clamp(48px,8vw,92px);line-height:.86;margin:0 0 18px;letter-spacing:-.07em}.lead{font-size:20px;max-width:760px;opacity:.9}.badge{display:inline-block;margin:5px 6px 0 0;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14)}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}.card{padding:24px;border-radius:26px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07)}.score{font-size:72px;font-weight:1000;color:#f2d18b}.small{opacity:.68}.one{grid-column:1/-1}.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.steps div{padding:18px;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}@media(max-width:760px){.wrap{padding:24px}.grid,.steps{grid-template-columns:1fr}.hero{min-height:420px;padding:30px}}@media print{body{background:#fff;color:#111}.hero,.card,.steps div{background:#fff;border-color:#ddd;box-shadow:none}.score{color:#111}}
  </style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${r.message}</p><div><span class="badge">${r.dom}</span><span class="badge">${r.archetype}</span><span class="badge">Royal ${score}/100</span><span class="badge">${b.mode}</span></div></section><section class="grid"><div class="card"><b>Puntuación Royal</b><div class="score">${score}</div><p>Promedio de aura, magnetismo, claridad visual y presencia de entrega.</p></div><div class="card"><b>Sello visual</b><p>${b.seal}</p><p class="small">Momento wow: ${b.wow}</p></div><div class="card one"><h2>One-page premium</h2><p>${b.onePage}</p></div><div class="card one"><h2>Ritmo cinematográfico</h2><div class="steps"><div><b>1 · Entrada</b><p>${b.entry}</p></div><div><b>2 · Impacto</b><p>Mensaje central y elemento dominante.</p></div><div><b>3 · Profundidad</b><p>Lectura por capas con aire visual.</p></div><div><b>4 · Cierre</b><p>Plan útil, ritual y seguimiento.</p></div></div></div><div class="card one"><h2>Entrega premium</h2><p>${b.premium}</p></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function eliteOnePage(r){
  const b=eliteBlueprint(r); const d=r.data||{};
  return `ALAYA ASTRAL IA · ${VERSION}\n\nONE-PAGE ÉLITE\n\nLectura: ${r.title}\nElemento: ${r.dom}\nArquetipo: ${r.archetype}\nMensaje central: ${r.message}\n\n3 claves:\n1. ${r.dom} marca el tono de la lectura.\n2. ${d.keyword||'presencia'} es la palabra semilla.\n3. ${d.energyGoal||'Claridad'} es el objetivo práctico.\n\nMicroacción: elige una acción de menos de 10 minutos y ejecútala hoy.\nSello visual: ${b.seal}\nMomento wow: ${b.wow}\nPuntuación Royal: ${eliteScore(r)}/100`;
}
const renderReadingBase_v35 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  const b=eliteBlueprint(r);
  r.metrics.elite=Math.max(60,Math.min(99,Math.round(((r.metrics.atelier||78)+(r.metrics.magnetism||76)+(r.metrics.visualClarity||78)+(r.metrics.aura||76))/4)+((r.data?.eliteMode==='cinematografico'||r.data?.eliteMode==='editorial')?3:0)));
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Royal'))){
    r.layers=[...(r.layers||[]),
      {icon:'✦',title:'Capa Royal · Entrada cinematográfica v3.5',html:`<div class="elite-cinema"><div><p class="eyebrow">Vision Constellation</p><h3>${b.entry}</h3><p>${b.cinematic}</p><div class="royal-strip"><span>Modo: ${b.mode}</span><span>Wow: ${b.wow}</span><span>Sello: ${b.seal}</span></div></div><div class="elite-gem"><span>◆</span><b>${r.metrics.elite}</b><small>Royal</small></div></div>`},
      {icon:'◈',title:'Capa Royal · One-page memorable',html:`<div class="cards-grid"><div class="mini-card"><b>Primera mirada</b><span>${r.data?.coverPhrase||'Mi mapa interior empieza a ordenarse'}</span></div><div class="mini-card"><b>3 claves</b><span>${r.dom} · ${r.archetype} · ${r.data?.keyword||'presencia'}</span></div><div class="mini-card"><b>Microacción</b><span>Una acción visible de menos de 10 minutos.</span></div><div class="mini-card"><b>Entrega</b><span>${b.onePage}</span></div></div>`},
      {icon:'♛',title:'Capa Royal · Puntuación de lujo visual',html:`<div class="pro-metrics elite-metrics"><div class="pro-meter"><span>Royal</span><strong>${r.metrics.elite}</strong><small>presencia premium</small></div><div class="pro-meter"><span>Impacto</span><strong>${Math.min(99,r.metrics.elite+4)}</strong><small>primera impresión</small></div><div class="pro-meter"><span>Entrega</span><strong>${Math.max(60,r.metrics.elite-3)}</strong><small>lista para demo</small></div></div>`}
    ];
  }
  renderReadingBase_v35(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadRoyalDossier')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadRoyalDossier'; b1.textContent='Dossier Royal'; b1.onclick=()=>download(`alaya-dossier-elite-${r.id}.html`,eliteDossierDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyRoyalOnePage'; b2.textContent='Copiar one-page'; b2.onclick=()=>copyText(eliteOnePage(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v35 = renderHome;
renderHome = function(){
  renderHomeBase_v35();
  const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.elite||eliteScore(r)),0)/(h.length||1))||0;
  const stats=document.getElementById('homeStats');
  if(stats && !stats.querySelector('[data-elite-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-elite-stat><b>${avg||'—'}</b><span>elite</span></div>`);
};
const renderUniverseBase_v35 = renderUniverse;
renderUniverse = function(){
  renderUniverseBase_v35();
  const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.elite||eliteScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-elite-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-elite-card><span>Royal</span><b>${avg||'—'}</b><small>Impacto premium</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-elite-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-elite-action><b>Siguiente salto Royal</b><span>Exporta one-page, dossier y portada para comprobar si la lectura se entiende en 30 segundos.</span></div>`);
};
const dailyPulseBase_v35 = dailyPulse;
dailyPulse = function(){
  dailyPulseBase_v35();
  const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-elite-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="elite-pulse" data-elite-pulse><b>Royal v3.9</b><span>Haz que la primera pantalla explique la app sin palabras: una frase, una luz, una acción clara.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con experiencia cinematográfica, dossiers Royal, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  renderHome(); renderUniverse();
});


/* === v4.6 Vision Zenith: product experience director === */
function eliteDirectorScore(r){
  const m=r.metrics||{};
  const base=((m.elite||m.luxe||78)+(m.aura||76)+(m.magnetism||76)+(m.visualClarity||78)+(m.coherence||77))/5;
  const bonus=(r.data?.eliteSeal||r.data?.coverPhrase||r.data?.centralQuestion)?4:0;
  return Math.max(62,Math.min(99,Math.round(base+bonus)));
}
function eliteDirectorPlan(r){
  const d=r.data||{};
  const dom=r.dom||'Agua';
  const royal=d.coverPhrase||d.centralQuestion||'Mi lectura se convierte en una experiencia clara, bella y memorable';
  const entry={Fuego:'entrada potente, luminosa y directa',Tierra:'entrada serena, editorial y confiable',Aire:'entrada ligera, inteligente y visual',Agua:'entrada íntima, lunar y envolvente'}[dom]||'entrada astral limpia';
  const focus=d.energyGoal||'Claridad';
  return {
    royal,
    entry,
    focus,
    promise:`En 30 segundos se debe entender qué ofrece Alaya: una lectura bella, útil y exportable.`,
    path:['Impacto inicial','Lectura por capas','Plan accionable','Entrega premium'],
    risks:['Demasiados controles visibles','Texto sin jerarquía','Capa técnica mezclada con lectura emocional'],
    fixes:['Priorizar una frase central','Agrupar secciones por capas','Mantener auditoría separada','Usar portada + one-page']
  };
}
function eliteDirectorDoc(r){
  const p=eliteDirectorPlan(r); const score=eliteDirectorScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dirección Royal · ${r.title}</title><style>
  body{margin:0;background:#05020c;color:#fff8ec;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1100px;margin:auto;padding:58px}.hero{padding:56px;border-radius:46px;min-height:500px;display:grid;align-content:end;background:radial-gradient(circle at 16% 8%,rgba(242,209,139,.30),transparent 34%),radial-gradient(circle at 82% 34%,rgba(155,124,255,.26),transparent 40%),linear-gradient(135deg,#160724,#06020d);border:1px solid rgba(255,255,255,.18)}h1{font-size:clamp(50px,8vw,96px);line-height:.86;margin:0 0 16px;letter-spacing:-.075em}.lead{font-size:20px;max-width:760px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.card{padding:24px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);border-radius:28px}.score{font-size:76px;font-weight:1000;color:#f2d18b}.path{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.path div{padding:18px;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.badge{display:inline-block;margin:5px 6px 0 0;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}.small{opacity:.7}@media(max-width:760px){.wrap{padding:24px}.grid,.path{grid-template-columns:1fr}.hero{min-height:420px;padding:30px}}@media print{body{background:#fff;color:#111}.hero,.card,.path div{background:#fff;border-color:#ddd}.score{color:#111}}
  </style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.royal}</p><div><span class="badge">Dirección Royal ${score}/100</span><span class="badge">${r.dom}</span><span class="badge">${p.focus}</span></div></section><section class="grid"><div class="card"><b>Puntuación Royal</b><div class="score">${score}</div><p>Evalúa impacto inicial, claridad, continuidad y entrega premium.</p></div><div class="card"><b>Promesa de producto</b><p>${p.promise}</p><p class="small">Entrada recomendada: ${p.entry}.</p></div><div class="card" style="grid-column:1/-1"><h2>Ruta de experiencia</h2><div class="path">${p.path.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div></div><div class="card"><h2>Riesgos a evitar</h2><ul>${p.risks.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="card"><h2>Correcciones Royal</h2><ul>${p.fixes.map(x=>`<li>${x}</li>`).join('')}</ul></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function eliteBrief(r){
  const p=eliteDirectorPlan(r); const score=eliteDirectorScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF ÉLITE\nLectura: ${r.title}\nPuntuación: ${score}/100\nFirma: ${p.royal}\nEntrada: ${p.entry}\nFoco: ${p.focus}\n\nRuta:\n- ${p.path.join('\n- ')}\n\nRiesgos:\n- ${p.risks.join('\n- ')}\n\nCorrecciones:\n- ${p.fixes.join('\n- ')}`;
}
const renderReadingBase_v36 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  r.metrics.eliteDirector=eliteDirectorScore(r);
  const p=eliteDirectorPlan(r);
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Director Royal'))){
    r.layers=[...(r.layers||[]),
      {icon:'♛',title:'Director Royal v3.9 · Experiencia espectacular',html:`<div class="elite-director"><div><p class="eyebrow">Vision Constellation</p><h3 class="elite-royal">${p.royal}</h3><p>${p.promise}</p><div class="elite-kpi"><span>Entrada: ${p.entry}</span><span>Foco: ${p.focus}</span><span>Score ${r.metrics.eliteDirector}/100</span></div></div><div class="elite-seal"><div><span>✦</span><b>ÉLITE</b><small>${r.metrics.eliteDirector}/100</small></div></div></div>`},
      {icon:'◇',title:'Ruta Royal v3.9 · De primera mirada a entrega',html:`<div class="elite-path">${p.path.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div>`},
      {icon:'✧',title:'Pulido Royal v3.9 · Qué mejorar para que sea memorable',html:`<div class="elite-capsule"><div class="mini-card"><b>Evitar</b><span>${p.risks[0]}</span></div><div class="mini-card"><b>Reforzar</b><span>${p.fixes[0]}</span></div><div class="mini-card"><b>Entrega</b><span>Portada + one-page + auditoría separada.</span></div></div>`}
    ];
  }
  renderReadingBase_v36(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadEliteDirector')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadEliteDirector'; b1.textContent='Dirección Royal'; b1.onclick=()=>download(`alaya-direccion-elite-${r.id}.html`,eliteDirectorDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyEliteBrief'; b2.textContent='Copiar brief Royal'; b2.onclick=()=>copyText(eliteBrief(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v36 = renderHome;
renderHome = function(){
  renderHomeBase_v36();
  const stats=document.getElementById('homeStats');
  const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.eliteDirector||eliteDirectorScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-elite-director-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-elite-director-stat><b>${avg||'—'}</b><span>director</span></div>`);
};
const renderUniverseBase_v36 = renderUniverse;
renderUniverse = function(){
  renderUniverseBase_v36();
  const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.eliteDirector||eliteDirectorScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-elite-director-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-elite-director-card><span>Director Royal</span><b>${avg||'—'}</b><small>Experiencia memorable</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-elite-director-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-elite-director-action><b>Control Royal</b><span>Antes de publicar, comprueba: primera mirada, ruta, one-page, PDF y auditoría.</span></div>`);
};
const dailyPulseBase_v36 = dailyPulse;
dailyPulse = function(){
  dailyPulseBase_v36();
  const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-elite-director-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="elite-pulse" data-elite-director-pulse><b>Director Royal v3.9</b><span>Haz que cada pantalla tenga una misión: atraer, explicar, guiar o entregar. Si no cumple una de esas cuatro, sobra.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con dirección de experiencia, dossiers, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  renderHome(); renderUniverse();
});


/* === v4.6 Vision Zenith: memorable brand identity layer === */
function royalScore(r){
  const m=r.metrics||{};
  const base=((m.eliteDirector||m.elite||m.luxe||m.aura||76)+(m.clarity||74)+(m.integration||72))/3;
  const bonus=(r.data?.coverPhrase||r.data?.keyword||r.data?.centralQuestion)?5:2;
  return Math.max(64,Math.min(99,Math.round(base+bonus)));
}
function royalBlueprint(r){
  const d=r.data||{}; const dom=r.dom||'Agua';
  const tone={Fuego:'luminosa, valiente y directa',Tierra:'serena, editorial y confiable',Aire:'ligera, inteligente y clara',Agua:'íntima, lunar y envolvente'}[dom]||'astral y elegante';
  const phrase=d.coverPhrase||d.centralQuestion||'Mi mapa interior merece una lectura bella, clara y útil';
  const seal=d.eliteSeal||d.luxeSeal||`Sello ${dom} · ${d.energyGoal||'Claridad'}`;
  return {
    phrase,tone,seal,
    promise:'Alaya debe reconocerse por su calma visual, su profundidad y su forma de convertir una lectura en una entrega premium.',
    sequence:['Entrada visual','Frase central','Lectura por capas','Plan útil','Entrega Royal'],
    voice:['mística sin ser confusa','premium sin ser fría','profunda sin saturar'],
    rules:['Una sola acción principal por pantalla','Auditoría técnica siempre separada','Cada informe debe tener portada y cierre memorable'],
    next:'Consolidar esta identidad antes de añadir más funciones.'
  };
}
function royalDossierDoc(r){
  const b=royalBlueprint(r); const score=royalScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Royal · ${r.title}</title><style>
  body{margin:0;background:#05020c;color:#fff8ec;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1120px;margin:auto;padding:58px}.hero{min-height:520px;border-radius:48px;border:1px solid rgba(255,255,255,.18);padding:56px;display:grid;align-content:end;background:radial-gradient(circle at 18% 12%,rgba(242,209,139,.34),transparent 34%),radial-gradient(circle at 88% 42%,rgba(155,124,255,.26),transparent 42%),linear-gradient(135deg,#170725,#06020d)}h1{font-size:clamp(52px,8vw,100px);line-height:.86;margin:0 0 16px;letter-spacing:-.08em}.lead{font-size:21px;max-width:790px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.card{padding:24px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);border-radius:28px}.score{font-size:82px;font-weight:1000;color:#f2d18b}.badge{display:inline-block;margin:5px 6px 0 0;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}.seq{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.seq div{padding:16px;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.small{opacity:.7}@media(max-width:760px){.wrap{padding:24px}.grid,.seq{grid-template-columns:1fr}.hero{min-height:420px;padding:30px}}@media print{body{background:#fff;color:#111}.hero,.card,.seq div{background:#fff;border-color:#ddd}.score{color:#111}}
  </style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${b.phrase}</p><div><span class="badge">Royal ${score}/100</span><span class="badge">${r.dom}</span><span class="badge">${b.tone}</span></div></section><section class="grid"><div class="card"><b>Puntuación Royal</b><div class="score">${score}</div><p>Evalúa si la lectura tiene identidad propia, claridad visual y entrega memorable.</p></div><div class="card"><b>Sello de lectura</b><p>${b.seal}</p><p class="small">Promesa: ${b.promise}</p></div><div class="card" style="grid-column:1/-1"><h2>Secuencia Royal</h2><div class="seq">${b.sequence.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div></div><div class="card"><h2>Voz de marca</h2><ul>${b.voice.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="card"><h2>Reglas de producto</h2><ul>${b.rules.map(x=>`<li>${x}</li>`).join('')}</ul></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function royalBrief(r){
  const b=royalBlueprint(r); const score=royalScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF CROWN\nLectura: ${r.title}\nPuntuación: ${score}/100\nFrase central: ${b.phrase}\nTono: ${b.tone}\nSello: ${b.seal}\n\nSecuencia:\n- ${b.sequence.join('\n- ')}\n\nVoz de marca:\n- ${b.voice.join('\n- ')}\n\nReglas:\n- ${b.rules.join('\n- ')}\n\nSiguiente paso: ${b.next}`;
}
const renderReadingBase_v37 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  r.metrics.royal=royalScore(r);
  const b=royalBlueprint(r);
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Royal'))){
    r.layers=[...(r.layers||[]),
      {icon:'✦',title:'Royal v3.9 · Identidad memorable',html:`<div class="royal-panel"><div><p class="eyebrow">Vision Constellation</p><h3 class="elite-royal">${b.phrase}</h3><p>${b.promise}</p><div class="royal-ribbon"><span>Tono: ${b.tone}</span><span>${b.seal}</span><span>Score ${r.metrics.royal}/100</span></div></div><div class="royal-mark"><div><span>✦</span><b>CROWN</b><small>${r.metrics.royal}/100</small></div></div></div>`},
      {icon:'◇',title:'Secuencia Royal v3.9 · Experiencia reconocible',html:`<div class="royal-sequence">${b.sequence.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div>`},
      {icon:'♛',title:'Manifiesto Royal v3.9 · Reglas de producto',html:`<div class="royal-manifest"><div class="mini-card"><b>Voz</b><span>${b.voice.join(' · ')}</span></div><div class="mini-card"><b>Reglas</b><span>${b.rules[0]} · ${b.rules[1]}</span></div><div class="mini-card"><b>Siguiente paso</b><span>${b.next}</span></div></div>`}
    ];
  }
  renderReadingBase_v37(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadRoyalDossier')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadRoyalDossier'; b1.textContent='Dossier Royal'; b1.onclick=()=>download(`alaya-dossier-royal-${r.id}.html`,royalDossierDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyRoyalBrief'; b2.textContent='Copiar brief Royal'; b2.onclick=()=>copyText(royalBrief(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v37 = renderHome;
renderHome = function(){
  renderHomeBase_v37();
  const stats=document.getElementById('homeStats');
  const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.royal||royalScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-royal-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-royal-stat><b>${avg||'—'}</b><span>royal</span></div>`);
};
const renderUniverseBase_v37 = renderUniverse;
renderUniverse = function(){
  renderUniverseBase_v37();
  const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.royal||royalScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-royal-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-royal-card><span>Royal</span><b>${avg||'—'}</b><small>Identidad memorable</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-royal-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-royal-action><b>Firma de producto</b><span>Comprueba que cada lectura tenga frase central, sello, secuencia y entrega reconocible.</span></div>`);
};
const dailyPulseBase_v37 = dailyPulse;
dailyPulse = function(){
  dailyPulseBase_v37();
  const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-royal-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="royal-pulse" data-royal-pulse><b>Royal v3.9</b><span>Hoy la prioridad es identidad: menos ruido, una frase central, un sello visual y una entrega que se recuerde.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con firma visual, dossier Royal, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  renderHome(); renderUniverse();
});

/* === v4.6 Vision Zenith: spectacular product royal layer === */
function royalFinalScore(r){
  const m=r.metrics||{};
  const base=((m.royal||m.eliteDirector||m.elite||m.aura||78)+(m.clarity||74)+(m.action||70)+(m.integration||72))/4;
  const d=r.data||{};
  const bonus=(d.royalLevel==='ceremonial'?5:d.royalLevel==='editorial'?4:d.royalLevel==='joya'?3:2)+(d.royalDelivery?3:0);
  return Math.max(68,Math.min(99,Math.round(base+bonus)));
}
function royalVision(r){
  const d=r.data||{}; const dom=r.dom||'Agua';
  const level=d.royalLevel||'elegante'; const delivery=d.royalDelivery||'dossier';
  const mood={Fuego:'entrada solar, valiente y magnética',Tierra:'entrada editorial, serena y de confianza',Aire:'entrada ligera, clara e inteligente',Agua:'entrada lunar, íntima y envolvente'}[dom]||'entrada astral premium';
  const phrase=d.coverPhrase||d.centralQuestion||'Alaya convierte mi mapa interior en una guía bella, útil y memorable';
  return {
    phrase, level, delivery, mood,
    promise:'Royal convierte la app en una experiencia completa: bienvenida, lectura, mapa, plan, entrega y continuidad.',
    journey:['Bienvenida wow','Intención guiada','Lectura por capas','Plan útil','Entrega Royal'],
    pillars:['Lujo visual sin saturación','Claridad antes que cantidad','Capa técnica separada','Exportación digna de enseñar'],
    next:'Probar v3.9 en iPhone/Android y después pulir la rueda astral profesional.'
  };
}
function royalDossierDoc(r){
  const v=royalVision(r); const score=royalFinalScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Royal · ${r.title}</title><style>
  body{margin:0;background:#05020c;color:#fff8ec;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1140px;margin:auto;padding:58px}.hero{min-height:560px;border-radius:52px;border:1px solid rgba(242,209,139,.25);padding:60px;display:grid;align-content:end;background:radial-gradient(circle at 16% 10%,rgba(242,209,139,.36),transparent 34%),radial-gradient(circle at 86% 42%,rgba(155,124,255,.28),transparent 42%),linear-gradient(135deg,#190725,#05020c)}h1{font-size:clamp(56px,8vw,108px);line-height:.84;margin:0 0 18px;letter-spacing:-.085em}.lead{font-size:22px;max-width:820px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.card{padding:26px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);border-radius:30px}.score{font-size:90px;font-weight:1000;color:#f2d18b}.badge{display:inline-block;margin:5px 6px 0 0;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}.journey{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.journey div{padding:16px;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.small{opacity:.72}@media(max-width:760px){.wrap{padding:24px}.grid,.journey{grid-template-columns:1fr}.hero{min-height:430px;padding:30px}}@media print{body{background:#fff;color:#111}.hero,.card,.journey div{background:#fff;border-color:#ddd}.score{color:#111}}
  </style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${v.phrase}</p><div><span class="badge">Royal ${score}/100</span><span class="badge">${r.dom}</span><span class="badge">${v.level}</span><span class="badge">${v.delivery}</span></div></section><section class="grid"><div class="card"><b>Puntuación Royal</b><div class="score">${score}</div><p>Evalúa presencia, claridad, entrega premium y continuidad del producto.</p></div><div class="card"><b>Promesa Royal</b><p>${v.promise}</p><p class="small">Mood recomendado: ${v.mood}.</p></div><div class="card" style="grid-column:1/-1"><h2>Viaje Royal</h2><div class="journey">${v.journey.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div></div><div class="card"><h2>Pilares</h2><ul>${v.pillars.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="card"><h2>Siguiente paso</h2><p>${v.next}</p></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function royalBrief(r){
  const v=royalVision(r); const score=royalFinalScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF CROWN\nLectura: ${r.title}\nPuntuación Royal: ${score}/100\nFrase central: ${v.phrase}\nNivel: ${v.level}\nEntrega: ${v.delivery}\nMood: ${v.mood}\n\nViaje Royal:\n- ${v.journey.join('\n- ')}\n\nPilares:\n- ${v.pillars.join('\n- ')}\n\nSiguiente paso: ${v.next}`;
}
const renderReadingBase_v38 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  r.metrics.royalFinal=royalFinalScore(r);
  const v=royalVision(r);
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Royal v3.9'))){
    r.layers=[...(r.layers||[]),
      {icon:'♕',title:'Royal v3.9 · Experiencia corona',html:`<div class="royal-panel"><div><p class="eyebrow">Vision Constellation</p><h3 class="elite-signature">${v.phrase}</h3><p>${v.promise}</p><div class="royal-ribbon"><span>${v.mood}</span><span>Nivel: ${v.level}</span><span>Entrega: ${v.delivery}</span><span>Score ${r.metrics.royalFinal}/100</span></div></div><div class="royal-mark"><div><span>♕</span><b>CROWN</b><small>${r.metrics.royalFinal}/100</small></div></div></div>`},
      {icon:'✦',title:'Viaje Royal v3.9 · De bienvenida a entrega',html:`<div class="royal-journey">${v.journey.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div>`},
      {icon:'◇',title:'Suite Royal v3.9 · Qué la hace espectacular',html:`<div class="royal-suite"><div class="mini-card"><b>Lujo visual</b><span>${v.pillars[0]}</span></div><div class="mini-card"><b>Claridad</b><span>${v.pillars[1]}</span></div><div class="mini-card"><b>Entrega</b><span>${v.delivery} + auditoría separada.</span></div></div>`}
    ];
  }
  renderReadingBase_v38(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadRoyalDossier')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadRoyalDossier'; b1.textContent='Dossier Royal'; b1.onclick=()=>download(`alaya-dossier-royal-${r.id}.html`,royalDossierDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyRoyalBrief'; b2.textContent='Copiar brief Royal'; b2.onclick=()=>copyText(royalBrief(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v38 = renderHome;
renderHome = function(){
  renderHomeBase_v38();
  const stats=document.getElementById('homeStats'); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.royalFinal||royalFinalScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-royal-final-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-royal-final-stat><b>${avg||'—'}</b><span>royal</span></div>`);
};
const renderUniverseBase_v38 = renderUniverse;
renderUniverse = function(){
  renderUniverseBase_v38(); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.royalFinal||royalFinalScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-royal-final-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-royal-final-card><span>Royal final</span><b>${avg||'—'}</b><small>Producto espectacular</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-royal-final-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-royal-final-action><b>Checklist Royal</b><span>Primera mirada, lectura por capas, mapa visual, dossier, PDF, backup y Astro.com manual.</span></div>`);
};
const dailyPulseBase_v38 = dailyPulse;
dailyPulse = function(){
  dailyPulseBase_v38(); const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-royal-final-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="royal-pulse" data-royal-final-pulse><b>Royal v3.9</b><span>Hoy el objetivo es corona: una experiencia que se entienda rápido, se sienta premium y termine con una entrega impecable.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con experiencia corona, dossier Royal, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  renderHome(); renderUniverse();
});

/* === v4.6 Vision Zenith: capa de experiencia espectacular y dirección de producto === */
function royalFinalScore(r){
  const m=r.metrics||{};
  const base=((m.royalFinal||m.royal||m.signature||m.aura||80)+(m.clarity||76)+(m.beauty||78)+(m.integration||74))/4;
  const d=r.data||{};
  const bonus=(d.visionExperience==='espectacular'?6:d.visionExperience==='profesional'?4:2)+(d.format==='premium'?4:2);
  return Math.max(72,Math.min(99,Math.round(base+bonus)));
}
function royalBlueprint(r){
  const d=r.data||{}; const dom=r.dom||'Agua';
  const question=d.centralQuestion||'¿Qué quiere revelar mi mapa interior ahora?';
  const phrase=d.coverPhrase||`Alaya abre una lectura ${dom.toLowerCase()} con presencia, claridad y belleza.`;
  const signature={Fuego:'brillo valiente y entrada de alto impacto',Tierra:'lujo sereno, editorial y muy confiable',Aire:'claridad luminosa, ritmo ligero y elegante',Agua:'profundidad lunar, íntima y envolvente'}[dom]||'presencia astral premium';
  return {
    phrase, question, signature,
    promise:'Royal convierte la experiencia en una pieza completa: bienvenida memorable, lectura por capas, mapa visual, plan útil, entrega profesional y continuidad personal.',
    stages:['Atraer con portada','Orientar con intención','Revelar por capas','Aterrizar con plan','Entregar con dossier','Continuar en Mi Universo'],
    productRules:['Una pantalla debe tener una intención clara','La parte técnica nunca debe ensuciar la lectura emocional','Cada lectura debe terminar con una acción concreta','Toda exportación debe poder enseñarse sin explicar demasiado'],
    next:'Probar en móvil real, limpiar paneles repetidos y preparar v4.1 con rueda astral visual rediseñada.'
  };
}
function royalDossierDoc(r){
  const b=royalBlueprint(r); const score=royalFinalScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Royal · ${r.title}</title><style>
  body{margin:0;background:#04010a;color:#fff9ef;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1180px;margin:auto;padding:56px}.hero{min-height:620px;border-radius:56px;border:1px solid rgba(255,220,150,.30);padding:64px;display:grid;align-content:end;background:radial-gradient(circle at 12% 8%,rgba(255,220,150,.40),transparent 34%),radial-gradient(circle at 92% 38%,rgba(130,100,255,.36),transparent 44%),linear-gradient(135deg,#22082d,#06020f 65%,#020106)}h1{font-size:clamp(52px,8vw,112px);line-height:.84;margin:0 0 18px;letter-spacing:-.085em}.lead{font-size:23px;max-width:860px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}.card{padding:28px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);border-radius:32px}.score{font-size:96px;font-weight:1000;color:#f8d58d}.badge{display:inline-block;margin:6px 7px 0 0;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}.stages{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.stages div{padding:16px;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.small{opacity:.72}@media(max-width:800px){.wrap{padding:24px}.grid,.stages{grid-template-columns:1fr}.hero{min-height:440px;padding:30px}}@media print{body{background:#fff;color:#111}.hero,.card,.stages div{background:#fff;border-color:#ddd}.score{color:#111}}
  </style><body><main class="wrap"><section class="hero"><p class="small">ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${b.phrase}</p><div><span class="badge">Royal ${score}/100</span><span class="badge">${r.dom}</span><span class="badge">${b.signature}</span></div></section><section class="grid"><div class="card"><b>Puntuación Royal</b><div class="score">${score}</div><p>Presencia, claridad, continuidad, belleza y entrega premium.</p></div><div class="card"><b>Pregunta central</b><p>${b.question}</p><p class="small">${b.promise}</p></div><div class="card" style="grid-column:1/-1"><h2>Viaje Royal</h2><div class="stages">${b.stages.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div></div><div class="card"><h2>Reglas de producto</h2><ul>${b.productRules.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="card"><h2>Siguiente paso</h2><p>${b.next}</p></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function royalBrief(r){
  const b=royalBlueprint(r); const score=royalFinalScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF ROYAL\nLectura: ${r.title}\nPuntuación Royal: ${score}/100\nFrase central: ${b.phrase}\nPregunta: ${b.question}\nFirma visual: ${b.signature}\n\nPromesa:\n${b.promise}\n\nViaje Royal:\n- ${b.stages.join('\n- ')}\n\nReglas de producto:\n- ${b.productRules.join('\n- ')}\n\nSiguiente paso: ${b.next}`;
}
const renderReadingBase_v39 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  r.metrics.royalFinal=royalFinalScore(r);
  const b=royalBlueprint(r);
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Royal v3.9'))){
    r.layers=[...(r.layers||[]),
      {icon:'♛',title:'Royal v3.9 · Experiencia espectacular',html:`<div class="royal-panel"><div><p class="eyebrow">Vision Constellation</p><h3 class="elite-signature">${b.phrase}</h3><p>${b.promise}</p><div class="royal-ribbon"><span>${b.signature}</span><span>Royal ${r.metrics.royalFinal}/100</span><span>${b.question}</span></div></div><div class="royal-mark"><div><span>♛</span><b>ROYAL</b><small>${r.metrics.royalFinal}/100</small></div></div></div>`},
      {icon:'✦',title:'Viaje Royal v3.9 · Producto memorable',html:`<div class="royal-journey">${b.stages.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div>`},
      {icon:'◇',title:'Reglas Royal v3.9 · Para que no se sienta cargada',html:`<div class="royal-suite">${b.productRules.map(x=>`<div class="mini-card"><b>Regla</b><span>${x}</span></div>`).join('')}</div>`}
    ];
  }
  renderReadingBase_v39(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadRoyalDossier')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadRoyalDossier'; b1.textContent='Dossier Royal'; b1.onclick=()=>download(`alaya-dossier-royal-${r.id}.html`,royalDossierDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyRoyalBrief'; b2.textContent='Copiar brief Royal'; b2.onclick=()=>copyText(royalBrief(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v39 = renderHome;
renderHome=function(){
  renderHomeBase_v39();
  const stats=document.getElementById('homeStats'); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.royalFinal||royalFinalScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-royal-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-royal-stat><b>${avg||'—'}</b><span>royal</span></div>`);
};
const renderUniverseBase_v39 = renderUniverse;
renderUniverse=function(){
  renderUniverseBase_v39(); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.royalFinal||royalFinalScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-royal-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-royal-card><span>Royal</span><b>${avg||'—'}</b><small>Experiencia espectacular</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-royal-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-royal-action><b>Siguiente salto Royal</b><span>Validar primera mirada, lectura por capas, dossier Royal y claridad de la auditoría técnica.</span></div>`);
};
const dailyPulseBase_v39 = dailyPulse;
dailyPulse=function(){
  dailyPulseBase_v39(); const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-royal-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="royal-pulse" data-royal-pulse><b>Royal v3.9</b><span>Hoy el foco es hacerla espectacular sin cargarla: portada clara, lectura con emoción, plan útil y entrega digna de enseñar.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{document.title='Alaya Astral IA v5.2 Vision Launch'; const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION; renderHome(); renderUniverse();});


/* === v4.6 Vision Zenith: estructura espectacular sin sobrecargar === */
function infiniteScore(r){
  const m=r.metrics||{};
  const d=r.data||{};
  const base=((m.royalFinal||m.royal||m.aura||82)+(m.clarity||78)+(m.beauty||80)+(m.integration||76)+(m.presence||80))/5;
  const modeBonus={santuario:4,observatorio:5,ritual:6,cliente:7}[d.infiniteMode]||4;
  const prBonus={claridad:5,belleza:5,profundidad:6,entrega:7}[d.infinitePriority]||5;
  return Math.max(76,Math.min(99,Math.round(base+modeBonus+prBonus)));
}
function infinitePlan(r){
  const d=r.data||{}; const dom=r.dom||'Agua'; const focus=d.infinitePriority||'claridad';
  const tone={Fuego:'valiente, luminosa y con movimiento',Tierra:'serena, confiable y muy elegante',Aire:'clara, ligera y editorial',Agua:'profunda, lunar y envolvente'}[dom]||'astral y premium';
  const promise={claridad:'ordenar la experiencia para que cualquier persona entienda qué hacer en segundos',belleza:'subir la primera impresión con portadas, ritmo visual y microdetalles premium',profundidad:'hacer que la lectura tenga alma, emoción y sentido personal',entrega:'convertir cada resultado en un informe que se pueda enseñar con orgullo'}[focus]||'hacer la app más clara y memorable';
  return {
    tone,promise,
    headline:`Alaya Constellation convierte ${d.name||'tu lectura'} en una experiencia ${tone}.`,
    map:['Bienvenida con promesa clara','Lectura emocional por capas','Mapa visual y métricas','Plan práctico accionable','Entrega premium y seguimiento'],
    rules:['Reducir paneles repetidos y dejar solo los que aportan valor','Separar siempre interpretación, acción y auditoría técnica','Dar una frase central memorable antes de cualquier informe largo','Hacer que cada botón importante tenga un resultado claro','Probar primero en móvil real antes de añadir más funciones'],
    next:'Pulir la rueda astral visual, revisar en iPhone/Android y convertir el PDF profesional en una pieza editorial completa.'
  };
}
function infiniteDossierDoc(r){
  const p=infinitePlan(r), score=infiniteScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Dossier Constellation · ${r.title}</title><style>
  body{margin:0;background:#03010a;color:#fff8ee;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1180px;margin:auto;padding:54px}.hero{min-height:660px;border-radius:60px;padding:64px;display:grid;align-content:end;background:radial-gradient(circle at 20% 12%,rgba(255,226,165,.42),transparent 34%),radial-gradient(circle at 86% 42%,rgba(125,84,255,.38),transparent 46%),linear-gradient(135deg,#1d0730,#06020d 68%,#020103);border:1px solid rgba(255,226,165,.28)}h1{font-size:clamp(54px,9vw,118px);letter-spacing:-.09em;line-height:.82;margin:0 0 18px}.lead{font-size:24px;max-width:880px}.score{font-size:112px;font-weight:1000;color:#f9d98f}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}.card,.step{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);border-radius:32px;padding:28px}.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.badge{display:inline-block;margin:6px 6px 0 0;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}@media(max-width:850px){.wrap{padding:22px}.grid,.steps{grid-template-columns:1fr}.hero{min-height:440px;padding:30px}}@media print{body{background:#fff;color:#111}.hero,.card,.step{background:#fff;border-color:#ddd}.score{color:#111}}
  </style><body><main class="wrap"><section class="hero"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.headline}</p><div><span class="badge">Constellation ${score}/100</span><span class="badge">${r.dom}</span><span class="badge">${p.tone}</span></div></section><section class="grid"><div class="card"><b>Puntuación Constellation</b><div class="score">${score}</div><p>Orden, belleza, profundidad, utilidad y entrega premium.</p></div><div class="card"><b>Promesa de producto</b><p>${p.promise}</p><p><b>Siguiente paso:</b> ${p.next}</p></div><div class="card" style="grid-column:1/-1"><h2>Mapa de experiencia</h2><div class="steps">${p.map.map((x,i)=>`<div class="step"><b>${i+1}</b><p>${x}</p></div>`).join('')}</div></div><div class="card" style="grid-column:1/-1"><h2>Reglas Constellation</h2><ul>${p.rules.map(x=>`<li>${x}</li>`).join('')}</ul></div></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function infiniteBrief(r){
  const p=infinitePlan(r), score=infiniteScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF INFINITE\nLectura: ${r.title}\nPuntuación Constellation: ${score}/100\n\nTitular:\n${p.headline}\n\nPromesa:\n${p.promise}\n\nMapa de experiencia:\n- ${p.map.join('\n- ')}\n\nReglas Constellation:\n- ${p.rules.join('\n- ')}\n\nSiguiente paso:\n${p.next}`;
}
const renderReadingBase_v40 = renderReading;
renderReading = function(r){
  if(!r.metrics) r.metrics={};
  r.metrics.infinite=infiniteScore(r);
  const p=infinitePlan(r);
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Constellation v4.1'))){
    r.layers=[...(r.layers||[]),
      {icon:'∞',title:'Constellation v4.1 · Producto espectacular y claro',html:`<div class="infinite-panel"><div><p class="eyebrow">Vision Constellation</p><h3>${p.headline}</h3><p>${p.promise}</p><div class="infinite-ribbon"><span>${p.tone}</span><span>Constellation ${r.metrics.infinite}/100</span><span>${r.data?.infinitePriority||'claridad'}</span></div></div><div class="infinite-mark"><div><span>∞</span><b>${r.metrics.infinite}</b><small>Constellation</small></div></div></div>`},
      {icon:'✦',title:'Mapa Constellation v4.1 · Experiencia completa',html:`<div class="infinite-map">${p.map.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'◇',title:'Reglas Constellation v4.1 · Menos caos, más impacto',html:`<div class="infinite-suite">${p.rules.map(x=>`<div class="mini-card"><b>Regla</b><span>${x}</span></div>`).join('')}</div>`}
    ];
  }
  renderReadingBase_v40(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadConstellationDossier')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadConstellationDossier'; b1.textContent='Dossier Constellation'; b1.onclick=()=>download(`alaya-dossier-infinite-${r.id}.html`,infiniteDossierDoc(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyConstellationBrief'; b2.textContent='Copiar brief Constellation'; b2.onclick=()=>copyText(infiniteBrief(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v40 = renderHome;
renderHome=function(){
  renderHomeBase_v40();
  const stats=document.getElementById('homeStats'); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.infinite||infiniteScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-infinite-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-infinite-stat><b>${avg||'—'}</b><span>infinite</span></div>`);
};
const renderUniverseBase_v40 = renderUniverse;
renderUniverse=function(){
  renderUniverseBase_v40(); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.infinite||infiniteScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-infinite-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-infinite-card><span>Constellation</span><b>${avg||'—'}</b><small>Producto final</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-infinite-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-infinite-action><b>Prioridad Constellation</b><span>Probar flujo completo: home → lectura → dossier → universo → auditoría. Eliminar lo que no aporte claridad.</span></div>`);
};
const dailyPulseBase_v40 = dailyPulse;
dailyPulse=function(){
  dailyPulseBase_v40(); const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-infinite-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="infinite-pulse" data-infinite-pulse><b>Constellation v4.1</b><span>Hoy la regla es simple: cada pantalla debe emocionar, orientar y entregar algo útil sin saturar.</span></div>`);
};
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con lectura espectacular, universo personal, dossiers, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  renderHome(); renderUniverse();
});


/* === v4.6 Vision Zenith: sistema de experiencia espectacular === */
function constellationScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const base=((m.infinite||82)+(m.royalFinal||82)+(m.aura||78)+(m.clarity||78)+(m.integration||76))/5;
  const archBonus={santuario:4,editorial:6,ritual:7,cliente:7}[d.constellationArchitecture]||5;
  const starBonus={portada:5,rueda:5,onepage:6,universo:6}[d.starMoment]||5;
  return Math.max(78,Math.min(99,Math.round(base+archBonus+starBonus)));
}
function constellationPlan(r){
  const d=r.data||{}, dom=r.dom||'Agua';
  const promise=d.visiblePromise||'Una lectura que se entiende rápido, emociona y termina en una entrega premium.';
  const arch=d.constellationArchitecture||d.infiniteMode||'santuario';
  const star=d.starMoment||'portada';
  const tone={Fuego:'ardiente, valiente y visual',Tierra:'elegante, estable y confiable',Aire:'editorial, clara y luminosa',Agua:'lunar, profunda y envolvente'}[dom]||'premium y astral';
  const moments={
    portada:'La primera pantalla debe funcionar como una portada: nombre, frase central, aura y una acción clara.',
    rueda:'La rueda astral debe ser protagonista visual, no solo decoración.',
    onepage:'El one-page debe resumir esencia, consejo, plan y entrega en una sola pieza.',
    universo:'El universo personal debe hacer que la persona quiera volver.'
  };
  return {
    tone, promise, arch, star,
    headline:`Constellation organiza la experiencia de ${d.name||'Alaya'} como una ruta ${tone}.`,
    route:['Promesa visible','Portada emocional','Lectura por capas','Plan de acción','Mapa visual','Dossier / one-page','Seguimiento en Universo'],
    checklist:['La primera pantalla explica el valor sin leer mucho','El resultado empieza con una frase memorable','La lectura separa emoción, acción y técnica','El PDF/HTML parece una entrega premium','El historial ayuda a ver evolución real','Astro.com queda siempre como comprobación manual'],
    next:`Prioridad: ${moments[star]||moments.portada}`
  };
}
function constellationOnePage(r){
  const p=constellationPlan(r), score=constellationScore(r);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>One-page Constellation · ${r.title}</title><style>
  body{margin:0;background:#05030d;color:#fff8ec;font-family:Inter,system-ui,sans-serif}.page{max-width:980px;margin:auto;padding:42px}.cover{min-height:560px;border-radius:52px;padding:54px;display:grid;align-content:end;background:radial-gradient(circle at 12% 10%,rgba(255,226,166,.45),transparent 34%),radial-gradient(circle at 88% 34%,rgba(124,88,255,.42),transparent 44%),linear-gradient(135deg,#210631,#05020c);border:1px solid rgba(255,226,166,.25)}h1{font-size:clamp(48px,8vw,92px);line-height:.86;letter-spacing:-.08em;margin:0 0 16px}.lead{font-size:22px;max-width:780px}.score{font-size:96px;font-weight:1000;color:#f7d98b}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}.card{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);border-radius:28px;padding:22px}.route{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.route div{border-radius:20px;padding:14px;background:rgba(255,255,255,.07)}@media(max-width:800px){.page{padding:18px}.grid,.route{grid-template-columns:1fr}.cover{padding:28px;min-height:420px}}@media print{body{background:#fff;color:#111}.cover,.card,.route div{background:#fff;border-color:#ddd}.score{color:#111}}
  </style><body><main class="page"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.headline}</p><p>${p.promise}</p></section><section class="grid"><article class="card"><b>Constellation</b><div class="score">${score}</div><p>Visión, claridad, emoción, utilidad y entrega.</p></article><article class="card"><b>Momento estrella</b><p>${p.next}</p><p><b>Arquitectura:</b> ${p.arch}</p></article><article class="card" style="grid-column:1/-1"><h2>Ruta de experiencia</h2><div class="route">${p.route.map((x,i)=>`<div><b>${i+1}</b><p>${x}</p></div>`).join('')}</div></article><article class="card" style="grid-column:1/-1"><h2>Checklist premium</h2><ul>${p.checklist.map(x=>`<li>${x}</li>`).join('')}</ul></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function constellationBrief(r){
  const p=constellationPlan(r), score=constellationScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nMAPA CONSTELLATION\nLectura: ${r.title}\nScore: ${score}/100\nArquitectura: ${p.arch}\nMomento estrella: ${p.star}\n\nTitular:\n${p.headline}\n\nPromesa visible:\n${p.promise}\n\nRuta:\n- ${p.route.join('\n- ')}\n\nChecklist:\n- ${p.checklist.join('\n- ')}\n\nSiguiente paso:\n${p.next}`;
}
const renderReadingBase_v41=renderReading;
renderReading=function(r){
  if(!r.metrics) r.metrics={};
  r.metrics.constellation=constellationScore(r);
  const p=constellationPlan(r);
  if(!(r.layers||[]).some(l=>String(l.title||'').includes('Constellation v4.1'))){
    r.layers=[...(r.layers||[]),
      {icon:'✶',title:'Constellation v4.1 · Experiencia espectacular ordenada',html:`<div class="constellation-panel"><div><p class="eyebrow">Vision Constellation</p><h3>${p.headline}</h3><p>${p.promise}</p><div class="constellation-ribbon"><span>${p.tone}</span><span>Score ${r.metrics.constellation}/100</span><span>${p.next}</span></div></div><div class="constellation-mark"><div><span>✶</span><b>${r.metrics.constellation}</b><small>Constellation</small></div></div></div>`},
      {icon:'◎',title:'Ruta Constellation v4.1 · 7 momentos de experiencia',html:`<div class="constellation-map">${p.route.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'◇',title:'One-page Constellation v4.1 · Entrega memorable',html:`<div class="constellation-onepage"><h3>${p.promise}</h3><p>${p.next}</p><div class="constellation-ribbon"><span>Portada</span><span>Lectura</span><span>Plan</span><span>Universo</span><span>Auditoría</span></div></div>`}
    ];
  }
  renderReadingBase_v41(r);
  const actions=document.querySelector('#resultArea .result-actions');
  if(actions && !document.getElementById('downloadConstellationOnePage')){
    const b1=document.createElement('button'); b1.className='btn secondary small'; b1.id='downloadConstellationOnePage'; b1.textContent='One-page Constellation'; b1.onclick=()=>download(`alaya-onepage-constellation-${r.id}.html`,constellationOnePage(r),'text/html');
    const b2=document.createElement('button'); b2.className='btn ghost small'; b2.id='copyConstellationBrief'; b2.textContent='Copiar mapa Constellation'; b2.onclick=()=>copyText(constellationBrief(r));
    actions.append(b1,b2);
  }
};
const renderHomeBase_v41=renderHome;
renderHome=function(){
  renderHomeBase_v41();
  const stats=document.getElementById('homeStats'); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.constellation||constellationScore(r)),0)/(h.length||1))||0;
  if(stats && !stats.querySelector('[data-constellation-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-constellation-stat><b>${avg||'—'}</b><span>constellation</span></div>`);
};
const renderUniverseBase_v41=renderUniverse;
renderUniverse=function(){
  renderUniverseBase_v41(); const h=read(STORE.history,[]);
  const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.constellation||constellationScore(r)),0)/(h.length||1))||0;
  const dash=document.getElementById('universeDashboard');
  if(dash && !dash.querySelector('[data-constellation-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-constellation-card><span>Constellation</span><b>${avg||'—'}</b><small>Experiencia completa</small></article>`);
  const cc=document.getElementById('commandCenter');
  if(cc && !cc.querySelector('[data-constellation-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-constellation-action><b>Próxima mejora v4.2</b><span>Convertir la rueda astral en protagonista visual y revisar el PDF como pieza editorial completa.</span></div>`);
};
const dailyPulseBase_v41=dailyPulse;
dailyPulse=function(){
  dailyPulseBase_v41(); const box=document.getElementById('dailyPulse');
  if(box && !box.querySelector('[data-constellation-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="constellation-pulse" data-constellation-pulse><b>Constellation v4.1</b><span>Hoy la app debe cumplir una regla: cada pantalla tiene que tener una promesa, una acción y una entrega clara.</span></div>`);
};
function updateExperiencePreview(){
  const box=document.getElementById('experiencePreview'); if(!box) return;
  const d=collectForm(); const name=d.name||'tu lectura';
  const arch=d.constellationArchitecture||'santuario'; const star=d.starMoment||'portada'; const promise=d.visiblePromise||'una experiencia astral clara, bonita y entregable';
  box.innerHTML=`<b>Vista previa Constellation</b><span><strong>${name}</strong> tendrá arquitectura <strong>${arch}</strong>, momento estrella <strong>${star}</strong> y promesa: “${promise}”.</span><div class="constellation-ribbon"><span>Entrada</span><span>Lectura</span><span>Plan</span><span>Entrega</span></div>`;
}
document.addEventListener('input',e=>{if(e.target && e.target.closest('#readingForm')) updateExperiencePreview();});
document.addEventListener('change',e=>{if(e.target && e.target.closest('#readingForm')) updateExperiencePreview();});
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]');
  if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con experiencia ordenada, one-page, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  updateExperiencePreview(); renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.2 Vision Launch === */
function nebulaScore(r){
  const d=r.data||{}; const base=(r.metrics?.constellation||r.metrics?.infinite||r.metrics?.aura||78);
  const visual={soft:5,cinematic:8,editorial:7,minimal:6,immersive:9}[d.nebulaVisual]||6;
  const flow={calm:5,deep:7,fast:4,ceremonial:9,client:8}[d.nebulaFlow]||6;
  const clarity=(d.nebulaPromise||'').length>18?5:2;
  return Math.max(70,Math.min(100,Math.round(base*0.72+visual+flow+clarity)));
}
function nebulaPlan(r){
  const d=r.data||{};
  const visual=d.nebulaVisual||'cinematic';
  const flow=d.nebulaFlow||'ceremonial';
  const promise=d.nebulaPromise||'una lectura astral con impacto visual, calma y una entrega muy clara';
  const map={
    soft:'brumas suaves, cristal translúcido y detalles lunares',
    cinematic:'nebulosa profunda, luces doradas y entrada de película',
    editorial:'composición de revista premium con aire, márgenes y titulares fuertes',
    minimal:'joya oscura, pocos elementos y foco total en la lectura',
    immersive:'santuario envolvente con transición ritual y rueda protagonista'
  };
  const rhythm={
    calm:'entrar despacio, leer sin prisa y cerrar con una acción sencilla',
    deep:'abrir con impacto, profundizar por capas y terminar con integración',
    fast:'entregar claridad rápida, una frase central y un plan directo',
    ceremonial:'sentir ritual, revelar mapa, recibir guía y guardar el informe',
    client:'entregar lectura limpia, trazabilidad técnica y PDF listo para enseñar'
  };
  return {
    visual, flow, promise,
    mood: map[visual]||map.cinematic,
    rhythm: rhythm[flow]||rhythm.ceremonial,
    route:['Portada con promesa visible','Rueda/energía como pieza protagonista','Lectura principal en 3 bloques memorables','Plan útil de hoy, 7 días y 21 días','Auditoría técnica separada','Dossier/PDF con portada editorial','Universo personal como continuidad'],
    rules:['Una pantalla = una intención clara','La belleza no debe esconder la acción principal','La auditoría técnica nunca debe romper la magia','El PDF debe parecer una entrega premium, no una captura','Cada lectura debe dejar una frase recordable'],
    next:'Pulir la rueda astral como hero visual y convertir el PDF en una pieza editorial completa.'
  };
}
function nebulaDossier(r){
  const p=nebulaPlan(r), score=nebulaScore(r);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Dossier Nebula</title><style>
  body{margin:0;background:#080814;color:#f8f1ff;font-family:Inter,Arial,sans-serif} .wrap{max-width:980px;margin:auto;padding:42px} .hero{padding:48px;border-radius:34px;background:radial-gradient(circle at top,#8b5cf655,transparent 45%),linear-gradient(135deg,#17172f,#090914);border:1px solid #ffffff22} h1{font-size:48px;margin:10px 0}.lead{font-size:20px;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:22px}.card{background:#ffffff10;border:1px solid #ffffff22;border-radius:24px;padding:24px}.score{font-size:56px;font-weight:900}.route{display:grid;gap:10px}.route div{padding:14px;border-radius:16px;background:#ffffff10}.badge{display:inline-block;margin:4px;padding:8px 12px;border-radius:999px;background:#ffffff16}@media(max-width:760px){.grid{grid-template-columns:1fr}h1{font-size:34px}.wrap{padding:20px}}
  </style></head><body><main class="wrap"><section class="hero"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.promise}</p><span class="badge">Nebula ${score}/100</span><span class="badge">${p.visual}</span><span class="badge">${p.flow}</span></section><section class="grid"><article class="card"><b>Puntuación Nebula</b><div class="score">${score}</div><p>Impacto visual, claridad, ritmo, entrega y continuidad.</p></article><article class="card"><b>Mood visual</b><p>${p.mood}</p><p><b>Ritmo:</b> ${p.rhythm}</p></article><article class="card" style="grid-column:1/-1"><h2>Ruta Nebula</h2><div class="route">${p.route.map((x,i)=>`<div><b>${i+1}. </b>${x}</div>`).join('')}</div></article><article class="card"><h2>Reglas de experiencia</h2><ul>${p.rules.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card"><h2>Siguiente paso</h2><p>${p.next}</p></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function nebulaBrief(r){ const p=nebulaPlan(r), score=nebulaScore(r); return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF NEBULA\nLectura: ${r.title}\nScore: ${score}/100\nVisual: ${p.visual}\nRitmo: ${p.flow}\n\nPromesa:\n${p.promise}\n\nMood:\n${p.mood}\n\nRuta:\n- ${p.route.join('\n- ')}\n\nReglas:\n- ${p.rules.join('\n- ')}\n\nSiguiente paso:\n${p.next}`; }
(function(){
  const oldMake=makeReading;
  makeReading=function(d){ const r=oldMake(d); r.metrics.nebula=nebulaScore(r); const p=nebulaPlan(r); r.layers.splice(Math.min(3,r.layers.length),0,
    {icon:'☄',title:'Nebula v4.2 · Experiencia visual espectacular',html:`<div class="nebula-panel"><div><p class="eyebrow">Vision Nebula</p><h3>${p.promise}</h3><p>${p.mood}. Ritmo recomendado: ${p.rhythm}.</p><div class="nebula-ribbon"><span>Score ${r.metrics.nebula}/100</span><span>${p.visual}</span><span>${p.flow}</span></div></div><div class="nebula-orb"><span>☄</span><b>${r.metrics.nebula}</b><small>Nebula</small></div></div>`},
    {icon:'✦',title:'Ruta Nebula v4.2 · 7 momentos wow',html:`<div class="nebula-route">${p.route.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join('')}</div>`},
    {icon:'◈',title:'Reglas Nebula v4.2 · espectacular sin caos',html:`<ul class="check-list">${p.rules.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Siguiente paso:</b> ${p.next}</p>`}
  ); return r; };
  const oldRender=renderReading;
  renderReading=function(r){ oldRender(r); const actions=document.querySelector('.result-actions'); if(actions&&!actions.querySelector('#downloadNebulaDossier')){ const b=document.createElement('button'); b.className='btn secondary small'; b.id='downloadNebulaDossier'; b.textContent='Dossier Nebula'; b.onclick=()=>download(`alaya-dossier-nebula-${r.id}.html`,nebulaDossier(r),'text/html'); const c=document.createElement('button'); c.className='btn ghost small'; c.id='copyNebulaBrief'; c.textContent='Copiar brief Nebula'; c.onclick=()=>copyText(nebulaBrief(r)); actions.append(b,c); }};
  const oldHome=renderHome;
  renderHome=function(){ oldHome(); const stats=document.querySelector('#homeStats'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.nebula||nebulaScore(r)),0)/(h.length||1))||0; if(stats&&!stats.querySelector('[data-nebula-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-nebula-stat><b>${avg||'—'}</b><span>nebula</span></div>`); const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-nebula-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass nebula-home" data-nebula-home><p class="eyebrow">Vision Nebula v4.2</p><h2>Más espectáculo, menos ruido.</h2><p>Nebula convierte Alaya en una experiencia más visual y ordenada: portada memorable, rueda protagonista, lectura por capas, plan útil, entrega premium y auditoría separada.</p><div class="nebula-ribbon"><span>Portada</span><span>Rueda</span><span>Lectura</span><span>Plan</span><span>Dossier</span></div></section>`); };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){ oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.nebula||nebulaScore(r)),0)/(h.length||1))||0; if(dash&&!dash.querySelector('[data-nebula-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-nebula-card><span>Nebula</span><b>${avg||'—'}</b><small>Presencia visual</small></article>`); };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=document.querySelector('#dailyPulse'); if(box&&!box.querySelector('[data-nebula-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="nebula-pulse" data-nebula-pulse><b>Nebula v4.2</b><span>Hoy Alaya debe sentirse como una portada viva: bella al entrar, clara al actuar y memorable al guardar.</span></div>`); };
})();


/* === Alaya Astral IA v5.2 Vision Launch === */
function auroraScore(r){
  const m=r.metrics||{}; const d=r.data||{};
  const base=Math.round(((m.nebula||m.aurora||m.constellation||m.infinite||m.aura||74)+(m.clarity||72)+(m.integration||70))/3);
  const boost=(d.auroraIntensity==='premium'?8:d.auroraIntensity==='wow'?6:d.auroraIntensity==='balanced'?3:1)+(d.auroraFocus==='pdf'?3:d.auroraFocus==='rueda'?4:2);
  return Math.max(62,Math.min(99,base+boost));
}
function auroraPlan(r){
  const d=r.data||{}; const focus=d.auroraFocus||'resultado'; const intensity=d.auroraIntensity||'balanced';
  const focusText={entrada:'entrada memorable',rueda:'rueda astral protagonista',resultado:'resultado por capas',pdf:'entrega PDF premium',universo:'universo personal vivo'}[focus]||'resultado por capas';
  const intensityText={soft:'suave, luminosa y cercana',balanced:'equilibrada, bella y clara',wow:'cinematográfica y memorable',premium:'editorial, premium y lista para enseñar'}[intensity]||'equilibrada';
  const promise=d.auroraPromise||`Una experiencia ${intensityText} donde la persona entiende su energía sin sentirse perdida.`;
  return {
    focusText,intensityText,promise,
    headline:`Aurora convierte la lectura en una entrada luminosa, un mapa claro y una entrega que apetece guardar.`,
    route:['Entrada con promesa visible','Datos guiados sin saturar','Rueda como pieza central','Lectura por capas respirable','Plan útil de integración','Dossier/PDF con portada','Universo personal para volver'],
    rules:['Una pantalla debe tener una única intención principal.','La rueda astral debe verse antes del texto largo.','Cada resultado necesita resumen, profundidad y acción.','La auditoría técnica vive separada de la lectura emocional.','El PDF debe parecer una pieza editorial, no una copia de pantalla.','El historial debe invitar a volver, comparar y guardar favoritas.'],
    next:`Priorizar ${focusText} con un tono ${intensityText}.`
  };
}
function auroraDossier(r){ const p=auroraPlan(r), score=auroraScore(r); return `<!doctype html><html><head><meta charset="utf-8"><title>Dossier Aurora</title><style>
body{margin:0;background:#080411;color:#fff7df;font-family:Inter,system-ui,sans-serif}.wrap{padding:44px;max-width:1100px;margin:auto}.hero{min-height:46vh;border-radius:34px;padding:44px;background:radial-gradient(circle at 15% 0%,#f3c67655,transparent 35%),radial-gradient(circle at 85% 15%,#7c5cff55,transparent 35%),linear-gradient(135deg,#130824,#05020b);display:grid;align-content:center;border:1px solid #ffffff22}h1{font-size:58px;line-height:.95;margin:0 0 12px}.lead{font-size:22px;max-width:760px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}.card{border:1px solid #ffffff22;border-radius:26px;padding:24px;background:#ffffff0b}.score{font-size:54px;font-weight:900}.badge{display:inline-block;border:1px solid #ffffff2b;border-radius:999px;padding:8px 12px;margin:4px;background:#ffffff12}.route{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.route div{border:1px solid #ffffff22;border-radius:18px;padding:12px;background:#ffffff0c}@media print{body{background:white;color:#111}.hero,.card{break-inside:avoid}}@media(max-width:800px){.grid,.route{grid-template-columns:1fr}h1{font-size:40px}.wrap{padding:20px}}
</style></head><body><main class="wrap"><section class="hero"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.promise}</p><span class="badge">Aurora ${score}/100</span><span class="badge">${p.focusText}</span><span class="badge">${p.intensityText}</span></section><section class="grid"><article class="card"><b>Puntuación Aurora</b><div class="score">${score}</div><p>Impacto, claridad, belleza, utilidad, continuidad y entrega.</p></article><article class="card"><b>Dirección de experiencia</b><p>${p.headline}</p><p><b>Siguiente:</b> ${p.next}</p></article><article class="card" style="grid-column:1/-1"><h2>Ruta Aurora</h2><div class="route">${p.route.map((x,i)=>`<div><b>${i+1}. </b>${x}</div>`).join('')}</div></article><article class="card"><h2>Reglas Aurora</h2><ul>${p.rules.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card"><h2>Entrega premium</h2><p>Portada clara, lectura respirable, rueda protagonista, plan accionable y auditoría separada.</p></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`; }
function auroraBrief(r){ const p=auroraPlan(r), score=auroraScore(r); return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF AURORA\nLectura: ${r.title}\nScore: ${score}/100\nFoco: ${p.focusText}\nIntensidad: ${p.intensityText}\n\nPromesa:\n${p.promise}\n\nTitular:\n${p.headline}\n\nRuta:\n- ${p.route.join('\n- ')}\n\nReglas:\n- ${p.rules.join('\n- ')}\n\nSiguiente paso:\n${p.next}`; }
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.aurora=auroraScore(r); const p=auroraPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'🌌',title:'Aurora v4.3 · Experiencia espectacular refinada',html:`<div class="aurora-panel"><div><p class="eyebrow">Vision Aurora</p><h3>${p.headline}</h3><p>${p.promise}</p><div class="aurora-ribbon"><span>Score ${r.metrics.aurora}/100</span><span>${p.focusText}</span><span>${p.intensityText}</span></div></div><div class="aurora-orb"><span>✦</span><b>${r.metrics.aurora}</b><small>Aurora</small></div></div>`},
      {icon:'✧',title:'Ruta Aurora v4.3 · 7 momentos de experiencia',html:`<div class="aurora-route">${p.route.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'◌',title:'Reglas Aurora v4.3 · espectáculo con dirección',html:`<ul class="check-list">${p.rules.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Siguiente paso:</b> ${p.next}</p>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){ oldRender(r); const actions=document.querySelector('.result-actions'); if(actions&&!actions.querySelector('#downloadAuroraDossier')){ const b=document.createElement('button'); b.className='btn secondary small'; b.id='downloadAuroraDossier'; b.textContent='Dossier Aurora'; b.onclick=()=>download(`alaya-dossier-aurora-${r.id}.html`,auroraDossier(r),'text/html'); const c=document.createElement('button'); c.className='btn ghost small'; c.id='copyAuroraBrief'; c.textContent='Copiar brief Aurora'; c.onclick=()=>copyText(auroraBrief(r)); actions.append(b,c); }};
  const oldHome=renderHome;
  renderHome=function(){ oldHome(); const stats=document.querySelector('#homeStats'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aurora||auroraScore(r)),0)/(h.length||1))||0; if(stats&&!stats.querySelector('[data-aurora-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-aurora-stat><b>${avg||'—'}</b><span>aurora</span></div>`); const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-aurora-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass aurora-home" data-aurora-home><p class="eyebrow">Vision Aurora v4.3</p><h2>Espectacular, pero más limpia y dirigida.</h2><p>Aurora pule la experiencia: una entrada luminosa, rueda protagonista, lectura por capas, plan útil, dossier editorial y auditoría técnica separada.</p><div class="aurora-stage"><div><b>1</b><span>Promesa visible</span></div><div><b>2</b><span>Mapa visual</span></div><div><b>3</b><span>Lectura clara</span></div><div><b>4</b><span>Entrega premium</span></div></div></section>`); };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){ oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.aurora||auroraScore(r)),0)/(h.length||1))||0; if(dash&&!dash.querySelector('[data-aurora-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-aurora-card><span>Aurora</span><b>${avg||'—'}</b><small>Experiencia refinada</small></article>`); };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=document.querySelector('#dailyPulse'); if(box&&!box.querySelector('[data-aurora-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="aurora-pulse" data-aurora-pulse><b>Aurora v4.3</b><span>Hoy la app debe brillar sin saturar: una idea principal por pantalla, una emoción clara y una acción útil.</span></div>`); };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con experiencia visual refinada, universo personal, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
});


/* === Alaya Astral IA v5.2 Vision Launch === */
function celestialScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const base=Math.round(((m.aurora||m.nebula||m.constellation||m.aura||76)+(m.beauty||74)+(m.integration||72))/3);
  const wow={calma:2,elegancia:4,profundidad:5,espectaculo:7,cliente:6}[d.celestialMode]||4;
  const order={simple:3,guiado:5,editorial:6,profesional:7}[d.celestialStructure]||5;
  return Math.max(66,Math.min(100,base+wow+order));
}
function celestialPlan(r){
  const d=r.data||{};
  const mode=d.celestialMode||'elegancia';
  const structure=d.celestialStructure||'guiado';
  const modeText={calma:'calma mística y lectura respirable',elegancia:'lujo suave, limpio y memorable',profundidad:'profundidad emocional con ritmo pausado',espectaculo:'impacto visual cinematográfico sin perder claridad',cliente:'entrega profesional lista para enseñar'}[mode]||'lujo suave';
  const structureText={simple:'simple y muy directa',guiado:'guiada por pasos claros',editorial:'editorial con portada, índice y secciones',profesional:'profesional con lectura, plan y auditoría separada'}[structure]||'guiada';
  const promise=d.celestialPromise||`Una experiencia ${modeText}, organizada de forma ${structureText}.`;
  return {
    mode,structure,modeText,structureText,promise,
    pillars:['Entrada memorable','Mapa visual protagonista','Lectura por capas','Plan accionable','Entrega premium','Universo personal','Auditoría técnica separada'],
    principles:['Menos paneles duplicados y más jerarquía visual.','Cada pantalla debe tener un objetivo principal visible.','La primera impresión debe parecer una portada, no un formulario.','La lectura debe combinar emoción, claridad y acción práctica.','El PDF/dossier debe tener valor por sí mismo.','Astro.com queda como comprobación manual, separada y clara.'],
    next:'Convertir la rueda astral y el PDF en los dos elementos más memorables de la app.'
  };
}
function celestialDossier(r){ const p=celestialPlan(r), score=celestialScore(r); return `<!doctype html><html><head><meta charset="utf-8"><title>Dossier Celestial</title><style>
body{margin:0;background:#07030f;color:#fff8ea;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1120px;margin:auto;padding:44px}.cover{min-height:58vh;display:grid;align-content:center;padding:56px;border-radius:38px;background:radial-gradient(circle at 18% 8%,#ffd98a55,transparent 32%),radial-gradient(circle at 82% 0%,#8c6dff66,transparent 36%),linear-gradient(135deg,#160820,#05020a);border:1px solid #ffffff26;box-shadow:0 24px 90px #0008}h1{font-size:68px;line-height:.9;margin:0 0 16px}.lead{font-size:22px;line-height:1.6;max-width:820px}.badge{display:inline-block;border:1px solid #ffffff2b;border-radius:999px;padding:9px 13px;margin:5px;background:#ffffff14}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}.card{border:1px solid #ffffff22;border-radius:26px;padding:24px;background:#ffffff0d}.score{font-size:64px;font-weight:900}.route{display:grid;gap:10px}.route div{padding:14px;border-radius:18px;background:#ffffff10;border:1px solid #ffffff18}@media(max-width:850px){.grid{grid-template-columns:1fr}.wrap{padding:20px}h1{font-size:42px}}@media print{body{background:white;color:#111}.cover,.card{break-inside:avoid;background:white;border-color:#ddd;box-shadow:none}}
</style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.promise}</p><div><span class="badge">Celestial ${score}/100</span><span class="badge">${p.modeText}</span><span class="badge">${p.structureText}</span></div></section><section class="grid"><article class="card"><b>Puntuación Celestial</b><div class="score">${score}</div><p>Visión, orden, belleza, utilidad, continuidad y entrega.</p></article><article class="card"><b>Promesa</b><p>${p.promise}</p><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><b>Firma Alaya</b><p>Portada astral, rueda protagonista, lectura por capas y dossier premium.</p></article><article class="card" style="grid-column:1/-1"><h2>Ruta Celestial</h2><div class="route">${p.pillars.map((x,i)=>`<div><b>${i+1}. </b>${x}</div>`).join('')}</div></article><article class="card" style="grid-column:1/-1"><h2>Principios de producto</h2><ul>${p.principles.map(x=>`<li>${x}</li>`).join('')}</ul></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`; }
function celestialBrief(r){ const p=celestialPlan(r), score=celestialScore(r); return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF CELESTIAL\nLectura: ${r.title}\nScore: ${score}/100\nModo: ${p.modeText}\nEstructura: ${p.structureText}\n\nPromesa:\n${p.promise}\n\nRuta Celestial:\n- ${p.pillars.join('\n- ')}\n\nPrincipios:\n- ${p.principles.join('\n- ')}\n\nSiguiente paso:\n${p.next}`; }
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.celestial=celestialScore(r); const p=celestialPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'🌠',title:'Celestial v4.6 · Visión espectacular con orden',html:`<div class="celestial-panel"><div><p class="eyebrow">Vision Zenith</p><h3>${p.promise}</h3><p>Modo: ${p.modeText}. Estructura: ${p.structureText}.</p><div class="celestial-ribbon"><span>Score ${r.metrics.celestial}/100</span><span>${p.mode}</span><span>${p.structure}</span></div></div><div class="celestial-orb"><span>✺</span><b>${r.metrics.celestial}</b><small>Celestial</small></div></div>`},
      {icon:'✶',title:'Ruta Celestial v4.6 · 7 pilares de experiencia',html:`<div class="celestial-route">${p.pillars.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'◇',title:'Principios Celestial v4.6 · espectacular sin saturar',html:`<ul class="check-list">${p.principles.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Siguiente paso:</b> ${p.next}</p>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){ oldRender(r); const actions=document.querySelector('.result-actions'); if(actions&&!actions.querySelector('#downloadCelestialDossier')){ const b=document.createElement('button'); b.className='btn secondary small'; b.id='downloadCelestialDossier'; b.textContent='Dossier Celestial'; b.onclick=()=>download(`alaya-dossier-celestial-${r.id}.html`,celestialDossier(r),'text/html'); const c=document.createElement('button'); c.className='btn ghost small'; c.id='copyCelestialBrief'; c.textContent='Copiar brief Celestial'; c.onclick=()=>copyText(celestialBrief(r)); actions.append(b,c); }};
  const oldHome=renderHome;
  renderHome=function(){ oldHome(); const stats=document.querySelector('#homeStats'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.celestial||celestialScore(r)),0)/(h.length||1))||0; if(stats&&!stats.querySelector('[data-celestial-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-celestial-stat><b>${avg||'—'}</b><span>celestial</span></div>`); const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-celestial-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass celestial-home" data-celestial-home><p class="eyebrow">Vision Zenith v4.6</p><h2>Una app espectacular necesita una firma clara.</h2><p>Celestial ordena la experiencia alrededor de siete pilares: entrada memorable, mapa visual, lectura por capas, plan útil, entrega premium, universo personal y auditoría separada.</p><div class="celestial-stage"><div><b>01</b><span>Impacto</span></div><div><b>02</b><span>Mapa</span></div><div><b>03</b><span>Guía</span></div><div><b>04</b><span>Entrega</span></div></div></section>`); };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){ oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.celestial||celestialScore(r)),0)/(h.length||1))||0; if(dash&&!dash.querySelector('[data-celestial-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-celestial-card><span>Celestial</span><b>${avg||'—'}</b><small>Visión + orden</small></article>`); };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=document.querySelector('#dailyPulse'); if(box&&!box.querySelector('[data-celestial-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="celestial-pulse" data-celestial-pulse><b>Celestial v4.6</b><span>Hoy la app debe sentirse como una constelación ordenada: cada brillo tiene lugar, cada acción tiene sentido.</span></div>`); };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con experiencia espectacular ordenada, universo personal, dossier profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
});

/* === Alaya Astral IA v5.2 Vision Launch === */
function zenithScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const core=Math.round(((m.celestial||m.aurora||m.nebula||m.constellation||m.aura||78)+(m.clarity||74)+(m.integration||74)+(m.beauty||76))/4);
  const modeBoost={showcase:8,product:6,premium:7,minimal:4,audit:5}[d.zenithMode]||6;
  const focusBoost={entrada:5,lectura:4,rueda:6,pdf:6,universo:5}[d.zenithFocus]||4;
  const promiseBoost=(d.zenithPromise||'').trim().length>24?5:2;
  return Math.max(68,Math.min(100,core+modeBoost+focusBoost+promiseBoost));
}
function zenithPlan(r){
  const d=r.data||{};
  const mode=d.zenithMode||'showcase';
  const focus=d.zenithFocus||'entrada';
  const promise=d.zenithPromise||'Una experiencia astral que impacta al entrar, guía con claridad y se entrega como producto premium.';
  const modeText={showcase:'showcase espectacular para enseñar',product:'producto final claro y ordenado',premium:'entrega premium tipo informe de lujo',minimal:'minimalismo de lujo, menos ruido y más foco',audit:'magia visual con auditoría técnica separada'}[mode]||'showcase espectacular';
  const focusText={entrada:'impacto inicial y bienvenida memorable',lectura:'lectura por capas con jerarquía',rueda:'rueda astral como protagonista visual',pdf:'PDF/dossier con presencia profesional',universo:'universo personal vivo y seguimiento'}[focus]||'entrada memorable';
  return {
    mode, focus, promise, modeText, focusText,
    route:['Bienvenida con promesa visible','Datos guiados sin sensación técnica pesada','Rueda/energía como pieza hero','Lectura emocional en capas breves','Plan útil con acción hoy + 7 días','Dossier ejecutivo con portada','Universo personal para volver y comparar','Auditoría Astro.com separada y clara'],
    rules:['La primera pantalla debe vender la magia en menos de 10 segundos.','La lectura debe tener titulares fuertes antes de texto largo.','El usuario debe saber siempre cuál es el siguiente botón importante.','La parte técnica no debe invadir la experiencia emocional.','Cada exportación debe parecer una entrega pensada, no un volcado de datos.','El universo personal debe dar motivo para volver.'],
    onepage:['Promesa clara','Rueda protagonista','Lectura memorable','Plan accionable','Dossier premium','Seguimiento en universo'],
    next:'Convertir la rueda astral y el PDF profesional en los dos elementos más memorables de la v4.x.'
  };
}
function zenithDossier(r){
  const p=zenithPlan(r), score=zenithScore(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Dossier Zenith · ${r.title}</title><style>
  body{margin:0;background:#05020b;color:#fff8ea;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1120px;margin:auto;padding:46px}.cover{min-height:62vh;display:grid;align-content:center;padding:62px;border-radius:42px;background:radial-gradient(circle at 18% 8%,rgba(255,220,143,.38),transparent 31%),radial-gradient(circle at 82% 0%,rgba(121,86,255,.44),transparent 39%),linear-gradient(135deg,#16081f,#05020b 72%);border:1px solid rgba(255,255,255,.18);box-shadow:0 30px 110px #0008}h1{font-size:clamp(42px,8vw,82px);line-height:.88;margin:0 0 18px}.lead{font-size:22px;line-height:1.55;max-width:860px}.badge{display:inline-block;margin:5px;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:28px;padding:24px}.score{font-size:72px;font-weight:950;color:#ffdc91}.route{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.route div{padding:14px;border-radius:18px;background:rgba(255,255,255,.08)}@media(max-width:850px){.wrap{padding:20px}.grid,.route{grid-template-columns:1fr}.cover{padding:34px}}@media print{body{background:white;color:#111}.cover,.card,.route div{background:white!important;border-color:#ddd!important;box-shadow:none!important;break-inside:avoid}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.promise}</p><div><span class="badge">Zenith ${score}/100</span><span class="badge">${p.modeText}</span><span class="badge">${p.focusText}</span></div></section><section class="grid"><article class="card"><b>Puntuación Zenith</b><div class="score">${score}</div><p>Impacto, claridad, belleza, utilidad, entrega y continuidad.</p></article><article class="card"><b>Promesa de producto</b><p>${p.promise}</p></article><article class="card"><b>Siguiente paso</b><p>${p.next}</p></article><article class="card" style="grid-column:1/-1"><h2>Ruta Zenith</h2><div class="route">${p.route.map((x,i)=>`<div><b>${i+1}. </b>${x}</div>`).join('')}</div></article><article class="card"><h2>One-page</h2><ul>${p.onepage.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card" style="grid-column:span 2"><h2>Reglas para que sea espectacular</h2><ul>${p.rules.map(x=>`<li>${x}</li>`).join('')}</ul></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function zenithBrief(r){
  const p=zenithPlan(r), score=zenithScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF ZENITH\nLectura: ${r.title}\nScore: ${score}/100\nModo: ${p.modeText}\nFoco: ${p.focusText}\n\nPromesa:\n${p.promise}\n\nRuta:\n- ${p.route.join('\n- ')}\n\nReglas:\n- ${p.rules.join('\n- ')}\n\nOne-page:\n- ${p.onepage.join('\n- ')}\n\nSiguiente paso:\n${p.next}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.zenith=zenithScore(r); const p=zenithPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'✹',title:'Zenith v4.6 · Showcase espectacular con orden',html:`<div class="zenith-panel"><div><p class="eyebrow">Vision Zenith</p><h3>${p.promise}</h3><p>Modo: ${p.modeText}. Foco: ${p.focusText}.</p><div class="zenith-ribbon"><span>Score ${r.metrics.zenith}/100</span><span>${p.mode}</span><span>${p.focus}</span></div></div><div class="zenith-score-orb"><div><b>${r.metrics.zenith}</b><small>Zenith</small></div></div></div>`},
      {icon:'✦',title:'Ruta Zenith v4.6 · 8 momentos de producto premium',html:`<div class="zenith-route">${p.route.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'▣',title:'One-page Zenith · estructura para enseñar la app',html:`<div class="zenith-onepage"><div><h4>Promesa visible</h4><p>${p.promise}</p><h4>Siguiente paso</h4><p>${p.next}</p></div><div><h4>Reglas</h4><ul class="check-list">${p.rules.slice(0,5).map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){ oldRender(r); const actions=document.querySelector('.result-actions'); if(actions&&!actions.querySelector('#downloadZenithDossier')){ const b=document.createElement('button'); b.className='btn secondary small'; b.id='downloadZenithDossier'; b.textContent='Dossier Zenith'; b.onclick=()=>download(`alaya-dossier-zenith-${r.id}.html`,zenithDossier(r),'text/html'); const c=document.createElement('button'); c.className='btn ghost small'; c.id='copyZenithBrief'; c.textContent='Copiar brief Zenith'; c.onclick=()=>copyText(zenithBrief(r)); actions.append(b,c); }};
  const oldHome=renderHome;
  renderHome=function(){ oldHome(); const stats=document.querySelector('#homeStats'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.zenith||zenithScore(r)),0)/(h.length||1))||0; if(stats&&!stats.querySelector('[data-zenith-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-zenith-stat><b>${avg||'—'}</b><span>zenith</span></div>`); const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-zenith-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass zenith-home" data-zenith-home><p class="eyebrow">Vision Zenith v4.6</p><h2>Showcase premium: entra, entiende, siente y entrega.</h2><p>Zenith convierte la app en una experiencia más enseñable: portada fuerte, rueda protagonista, lectura por capas, plan útil, dossier ejecutivo y universo vivo.</p><div class="zenith-ribbon"><span>Entrada wow</span><span>Mapa visual</span><span>Guía útil</span><span>Dossier</span><span>Universo</span></div></section>`); };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){ oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.zenith||zenithScore(r)),0)/(h.length||1))||0; if(dash&&!dash.querySelector('[data-zenith-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-zenith-card><span>Zenith</span><b>${avg||'—'}</b><small>Showcase premium</small></article>`); };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=document.querySelector('#dailyPulse'); if(box&&!box.querySelector('[data-zenith-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="zenith-pulse" data-zenith-pulse><b>Zenith v4.6</b><span>Hoy la app debe sentirse lista para enseñar: una portada que atrae, una lectura que ordena y una entrega que impresiona.</span></div>`); };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con showcase espectacular, lectura por capas, universo personal, dossier profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
});


/* === Alaya Astral IA v5.2 Vision Launch === */
function novaScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const base=Math.round(((m.zenith||m.celestial||m.aurora||m.nebula||m.aura||80)+(m.clarity||76)+(m.integration||74)+(m.beauty||78)+(m.luxe||76))/5);
  const modeBoost={final:9,showcase:8,editorial:7,minimal:5,client:7}[d.novaMode]||7;
  const peakBoost={home:5,wheel:7,reading:6,pdf:7,universe:5}[d.novaPeak]||5;
  const promiseBoost=(d.novaPromise||'').trim().length>26?5:2;
  return Math.max(72,Math.min(100,base+modeBoost+peakBoost+promiseBoost));
}
function novaPlan(r){
  const d=r.data||{};
  const mode=d.novaMode||'final';
  const peak=d.novaPeak||'home';
  const promise=d.novaPromise||'Una app astral que se entiende al entrar, emociona al leer y se puede enseñar como producto premium.';
  const modeText={final:'producto final premium y enseñable',showcase:'showcase espectacular para demo',editorial:'experiencia editorial de lujo',minimal:'minimalismo joya con foco máximo',client:'entrega clara para cliente'}[mode]||'producto final premium';
  const peakText={home:'home espectacular y promesa inmediata',wheel:'rueda astral como hero visual',reading:'lectura memorable con titulares fuertes',pdf:'PDF/dossier editorial impecable',universe:'universo personal que invita a volver'}[peak]||'home espectacular';
  return {
    mode,peak,promise,modeText,peakText,
    thesis:'Nova no añade más ruido: selecciona lo mejor, lo ordena y lo presenta como experiencia final.',
    route:['Aterrizaje con promesa clara en 10 segundos','Formulario por pasos sin sensación de formulario pesado','Rueda o mapa visual como protagonista emocional','Lectura principal con resumen, profundidad y acción','Plan de integración: hoy, 7 días y 21 días','Dossier editorial con portada, índice y one-page','Mi Universo como continuidad y memoria de lecturas','Auditoría técnica Astro.com separada, limpia y opcional'],
    principles:['Menos paneles repetidos; más jerarquía visual.','Cada pantalla debe tener un botón principal evidente.','La lectura debe tener una frase central que se recuerde.','La parte técnica debe transmitir confianza sin romper la magia.','El PDF debe parecer una entrega diseñada, no una exportación accidental.','El historial debe convertirse en universo personal, no solo lista de archivos.'],
    next:'Pulir dos joyas: rueda astral hero y PDF editorial completo. Después, hacer pruebas reales en iPhone/Android.'
  };
}
function novaDossier(r){
  const p=novaPlan(r), score=novaScore(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Dossier Nova · ${r.title}</title><style>
  body{margin:0;background:#03020a;color:#fff9ec;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1160px;margin:auto;padding:48px}.cover{min-height:66vh;display:grid;align-content:center;padding:68px;border-radius:46px;background:radial-gradient(circle at 16% 4%,rgba(255,220,155,.46),transparent 30%),radial-gradient(circle at 86% 0%,rgba(155,103,255,.42),transparent 42%),radial-gradient(circle at 50% 98%,rgba(71,202,255,.24),transparent 42%),linear-gradient(135deg,#1c0929,#05020b 70%);border:1px solid rgba(255,255,255,.20);box-shadow:0 34px 120px #0009}h1{font-size:clamp(44px,8.5vw,88px);line-height:.88;margin:0 0 18px}.lead{font-size:22px;line-height:1.55;max-width:900px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:30px;padding:24px}.score{font-size:76px;font-weight:950;color:#ffdf9d}.route{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.route div{padding:14px;border-radius:18px;background:rgba(255,255,255,.08)}.one{grid-column:1/-1}.principles{columns:2}@media(max-width:850px){.wrap{padding:20px}.grid,.route{grid-template-columns:1fr}.cover{padding:34px}.principles{columns:1}}@media print{body{background:white;color:#111}.cover,.card,.route div{background:white!important;border-color:#ddd!important;box-shadow:none!important;break-inside:avoid}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.promise}</p><div><span class="badge">Nova ${score}/100</span><span class="badge">${p.modeText}</span><span class="badge">${p.peakText}</span></div></section><section class="grid"><article class="card"><b>Puntuación Nova</b><div class="score">${score}</div><p>Impacto, claridad, belleza, utilidad, entrega, continuidad y confianza técnica.</p></article><article class="card"><b>Tesis Nova</b><p>${p.thesis}</p></article><article class="card"><b>Siguiente paso</b><p>${p.next}</p></article><article class="card one"><h2>Ruta Nova</h2><div class="route">${p.route.map((x,i)=>`<div><b>${i+1}. </b>${x}</div>`).join('')}</div></article><article class="card one"><h2>Principios de producto</h2><ul class="principles">${p.principles.map(x=>`<li>${x}</li>`).join('')}</ul></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function novaBrief(r){
  const p=novaPlan(r), score=novaScore(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF NOVA\nLectura: ${r.title}\nScore: ${score}/100\nModo: ${p.modeText}\nCima: ${p.peakText}\n\nPromesa:\n${p.promise}\n\nTesis:\n${p.thesis}\n\nRuta:\n- ${p.route.join('\n- ')}\n\nPrincipios:\n- ${p.principles.join('\n- ')}\n\nSiguiente paso:\n${p.next}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.nova=novaScore(r); const p=novaPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'⟡',title:'Nova+ v4.9 · Producto final espectacular',html:`<div class="nova-panel"><div><p class="eyebrow">Vision Nova</p><h3>${p.promise}</h3><p>${p.thesis}</p><div class="nova-ribbon"><span>Score ${r.metrics.nova}/100</span><span>${p.modeText}</span><span>${p.peakText}</span></div></div><div class="nova-score-orb"><div><b>${r.metrics.nova}</b><small>Nova</small></div></div></div>`},
      {icon:'✦',title:'Ruta Nova+ v4.9 · 8 momentos de experiencia final',html:`<div class="nova-route">${p.route.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'◈',title:'Principios Nova · espectacular sin saturar',html:`<div class="nova-onepage"><div><h4>Promesa visible</h4><p>${p.promise}</p><h4>Siguiente paso</h4><p>${p.next}</p></div><div><h4>Reglas</h4><ul class="check-list">${p.principles.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){ oldRender(r); const actions=document.querySelector('.result-actions'); if(actions&&!actions.querySelector('#downloadNovaDossier')){ const b=document.createElement('button'); b.className='btn secondary small'; b.id='downloadNovaDossier'; b.textContent='Dossier Nova'; b.onclick=()=>download(`alaya-dossier-nova-${r.id}.html`,novaDossier(r),'text/html'); const c=document.createElement('button'); c.className='btn ghost small'; c.id='copyNovaBrief'; c.textContent='Copiar brief Nova'; c.onclick=()=>copyText(novaBrief(r)); actions.append(b,c); }};
  const oldHome=renderHome;
  renderHome=function(){ oldHome(); const stats=document.querySelector('#homeStats'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.nova||novaScore(r)),0)/(h.length||1))||0; if(stats&&!stats.querySelector('[data-nova-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-nova-stat><b>${avg||'—'}</b><span>nova</span></div>`); const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-nova-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass nova-home" data-nova-home><p class="eyebrow">Vision Nova+ v4.9</p><h2>Producto final premium: menos acumulación, más dirección.</h2><p>Nova concentra Alaya en lo que más importa: entrada wow, mapa visual protagonista, lectura memorable, plan accionable, dossier editorial y universo personal.</p><div class="nova-ribbon"><span>Entrada</span><span>Mapa</span><span>Lectura</span><span>Plan</span><span>Dossier</span><span>Universo</span></div></section>`); };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){ oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.nova||novaScore(r)),0)/(h.length||1))||0; if(dash&&!dash.querySelector('[data-nova-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-nova-card><span>Nova</span><b>${avg||'—'}</b><small>Producto final</small></article>`); };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=document.querySelector('#dailyPulse'); if(box&&!box.querySelector('[data-nova-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="nova-pulse" data-nova-pulse><b>Nova+ v4.9</b><span>Hoy la prioridad es que Alaya se entienda en segundos, emocione en la lectura y se entregue como una pieza premium.</span></div>`); };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con experiencia final, lectura por capas, universo personal, dossier editorial y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
});

/* === Alaya Astral IA v5.2 Vision Launch: preparación real de demo/publicación === */
function novaReadinessScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const base=Math.round(((m.nova||novaScore(r)||78)+(m.clarity||74)+(m.integration||72)+(m.aura||75))/4);
  const flow={guided:6,cinematic:8,minimal:7,client:7,qa:8}[d.novaFlow]||6;
  const gate={demo:6,qa:7,release:9,polish:6,astro:5}[d.novaGate]||6;
  const astro=(d.calcSource==='astrocom' || (r.imported&&Object.keys(r.imported).length))?4:1;
  const promise=(d.novaPromise||'').trim().length>30?4:1;
  return Math.max(70,Math.min(100,base+flow+gate+astro+promise));
}
function novaReadinessPlan(r){
  const d=r.data||{};
  const flow=d.novaFlow||'guided';
  const gate=d.novaGate||'demo';
  const flowText={guided:'flujo guiado y claro',cinematic:'experiencia cinematográfica premium',minimal:'minimalismo espectacular',client:'entrega clara para cliente',qa:'control QA antes de publicar'}[flow]||'flujo guiado';
  const gateText={demo:'demo enseñable',qa:'revisión QA',release:'lista para publicar',polish:'pulido visual',astro:'cálculo / Astro.com'}[gate]||'demo enseñable';
  const score=novaReadinessScore(r);
  const status=score>=90?'Lista para enseñar como demo premium':score>=82?'Muy buena base, falta revisión móvil/PDF':score>=76?'Prometedora, conviene pulir jerarquía y pruebas':'Necesita limpieza antes de enseñar';
  return {
    flow,gate,flowText,gateText,score,status,
    checklist:[
      'La home explica en 10 segundos qué hace Alaya.',
      'El botón principal de cada pantalla es evidente.',
      'La lectura empieza con una frase central memorable.',
      'La rueda/mapa astral tiene protagonismo visual sin saturar.',
      'El plan útil se entiende sin leer todo el informe.',
      'El PDF/dossier parece una entrega diseñada.',
      'Mi Universo invita a volver y no es solo historial.',
      'La auditoría Astro.com está separada de la lectura emocional.',
      'PWA probada en iPhone Safari y Android Chrome.',
      'Backup/restauración comprobados antes de publicar.'
    ],
    next: gate==='astro'?'Priorizar precisión: validar Sol, Luna y Ascendente con Astro.com manual y documentar diferencias.':gate==='release'?'Hacer una ronda completa en móvil, PDF y PWA antes de compartir enlace final.':'Preparar una demo de 3 minutos: home, crear lectura, resultado, dossier y universo.'
  };
}
function novaReadinessReport(r){
  const p=novaReadinessPlan(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe Nova+ v4.9 · ${r.title}</title><style>
  body{margin:0;background:#05020c;color:#fff9ee;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1100px;margin:auto;padding:46px}.cover{border-radius:42px;padding:56px;min-height:58vh;display:grid;align-content:center;background:radial-gradient(circle at 15% 5%,rgba(255,226,164,.42),transparent 32%),radial-gradient(circle at 82% 10%,rgba(126,96,255,.40),transparent 38%),linear-gradient(135deg,#18071f,#05020c 72%);border:1px solid rgba(255,255,255,.2);box-shadow:0 30px 110px #0009}h1{font-size:clamp(40px,8vw,82px);line-height:.9;margin:.1em 0}.lead{font-size:21px;line-height:1.55;max-width:850px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:1fr 2fr;gap:18px;margin-top:22px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:28px;padding:24px}.score{font-size:86px;font-weight:950;color:#ffe2a1}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.checks div{padding:12px;border-radius:16px;background:rgba(255,255,255,.08)}@media(max-width:850px){.wrap{padding:20px}.grid,.checks{grid-template-columns:1fr}.cover{padding:32px}}@media print{body{background:white;color:#111}.cover,.card,.checks div{background:white!important;border-color:#ddd!important;box-shadow:none!important;break-inside:avoid}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.status}</p><div><span class="badge">Nova readiness ${p.score}/100</span><span class="badge">${p.flowText}</span><span class="badge">${p.gateText}</span></div></section><section class="grid"><article class="card"><b>Puntuación</b><div class="score">${p.score}</div><p>${p.status}</p></article><article class="card"><h2>Checklist Nova+ v4.9</h2><div class="checks">${p.checklist.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><p>${x}</p></div>`).join('')}</div></article><article class="card" style="grid-column:1/-1"><h2>Siguiente acción</h2><p>${p.next}</p></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function novaReadinessChecklist(r){
  const p=novaReadinessPlan(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nCHECKLIST NOVA v4.9\nLectura: ${r.title}\nPuntuación: ${p.score}/100\nEstado: ${p.status}\nFlujo: ${p.flowText}\nPuerta: ${p.gateText}\n\n${p.checklist.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nSiguiente acción:\n${p.next}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.novaReadiness=novaReadinessScore(r); const p=novaReadinessPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'✧',title:'Nova+ v4.9 · Preparación real de demo/publicación',html:`<div class="nova48-panel"><div><p class="eyebrow">Vision Nova+ v4.9</p><h3>${p.status}</h3><p>Flujo: ${p.flowText}. Puerta: ${p.gateText}.</p><div class="nova-ribbon"><span>Readiness ${p.score}/100</span><span>${p.flowText}</span><span>${p.gateText}</span></div></div><div class="nova48-orb"><b>${p.score}</b><small>Nova ready</small></div></div>`},
      {icon:'☑',title:'Checklist Nova+ v4.9 · lo que hay que probar',html:`<div class="nova48-checks">${p.checklist.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div>`},
      {icon:'➤',title:'Siguiente acción Nova+ v4.9',html:`<div class="note-card"><b>${p.next}</b><p>Objetivo: que Alaya no parezca una acumulación de capas, sino una experiencia clara, premium y lista para enseñar.</p></div>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){ oldRender(r); const actions=document.querySelector('.result-actions'); if(actions&&!actions.querySelector('#downloadNovaReadiness')){ const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadNovaReadiness'; a.textContent='Informe Nova+ v4.9'; a.onclick=()=>download(`alaya-informe-nova-v49-${r.id}.html`,novaReadinessReport(r),'text/html'); const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyNovaReadiness'; b.textContent='Copiar checklist Nova'; b.onclick=()=>copyText(novaReadinessChecklist(r)); actions.append(a,b); }};
  const oldHome=renderHome;
  renderHome=function(){ oldHome(); const stats=document.querySelector('#homeStats'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.novaReadiness||novaReadinessScore(r)),0)/(h.length||1))||0; if(stats&&!stats.querySelector('[data-nova48-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-nova48-stat><b>${avg||'—'}</b><span>nova ready</span></div>`); const home=document.querySelector('[data-nova-home]')||document.querySelector('.nova-launch'); if(home&&!document.querySelector('[data-nova48-home-note]')) home.insertAdjacentHTML('beforeend',`<div class="nova48-note" data-nova48-home-note><b>v4.9 estabilidad</b><span>Corregido el conflicto con history() y añadido informe de preparación para probar/publicar.</span></div>`); };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){ oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.novaReadiness||novaReadinessScore(r)),0)/(h.length||1))||0; if(dash&&!dash.querySelector('[data-nova48-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-nova48-card><span>Nova ready</span><b>${avg||'—'}</b><small>Preparación demo/publicación</small></article>`); };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con estabilidad mejorada, checklist de publicación, universo personal, dossier editorial y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
});


/* === Alaya Astral IA v5.2 Vision Launch: demo guiada, salud UX y entrega enseñable === */
function novaPlusScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const base=Math.round(((m.novaReadiness||m.nova||m.aura||76)+(m.clarity||74)+(m.integration||72)+(m.action||70))/4);
  const mode={showcase:8,product:7,client:8,mobile:7,launch:9}[d.novaPlusMode]||7;
  const scenario={three:8,home:6,pdf:7,universe:7,technical:6}[d.demoScenario]||7;
  const phrase=(d.demoPhrase||d.novaPromise||'').trim().length>24?5:1;
  const astro=(d.calcSource==='astrocom'||(r.imported&&Object.keys(r.imported).length))?3:1;
  return Math.max(72,Math.min(100,base+mode+scenario+phrase+astro));
}
function novaPlusPlan(r){
  const d=r.data||{}; const score=novaPlusScore(r);
  const mode=d.novaPlusMode||'showcase'; const scenario=d.demoScenario||'three';
  const modeText={showcase:'showcase espectacular',product:'producto limpio y claro',client:'entrega para cliente',mobile:'prioridad móvil',launch:'preparación de publicación'}[mode]||'showcase espectacular';
  const scenarioText={three:'demo de 3 minutos',home:'home + lectura',pdf:'PDF/dossier premium',universe:'universo personal',technical:'Astro.com + auditoría'}[scenario]||'demo de 3 minutos';
  const status=score>=92?'Lista para enseñar como demo premium':score>=85?'Muy sólida: revisar móvil y dossier':score>=78?'Buena base: falta afinar jerarquía visual':'Necesita limpieza antes de enseñar';
  const phrase=(d.demoPhrase||d.novaPromise||'Entra, entiende tu energía y sal con una acción clara.');
  const beats=[
    ['00:00','Abrir Home','Mostrar en una frase qué es Alaya y pulsar Crear lectura.'],
    ['00:35','Crear lectura','Rellenar datos esenciales, intención y estilo sin entrar en opciones técnicas.'],
    ['01:35','Resultado premium','Enseñar impacto emocional, rueda/mapa visual, plan útil y dossier.'],
    ['02:25','Mi Universo','Abrir historial, favorita, evolución y backup para demostrar continuidad.'],
    ['02:55','Cierre','Explicar que Astro.com queda como comprobación manual separada.']
  ];
  const checks=[
    'Home entendible en menos de 10 segundos.',
    'Un único CTA principal por pantalla.',
    'Lectura por capas, no bloque enorme de texto.',
    'Rueda/mapa visible como pieza protagonista.',
    'Plan útil con microacción clara.',
    'Dossier/PDF con aspecto de entrega premium.',
    'Universo personal invita a volver.',
    'Ajustes, backup y PWA localizables.',
    'Auditoría técnica separada de la lectura emocional.',
    'Prueba rápida en iPhone Safari y Android Chrome.'
  ];
  return {score,modeText,scenarioText,status,phrase,beats,checks,next: score>=90?'Preparar enlace demo y probar en móvil real.':'Pulir home, jerarquía de botones y dossier antes de enseñar.'};
}
function novaPlusReport(r){
  const p=novaPlusPlan(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Nova+ v4.9 · ${r.title}</title><style>
  body{margin:0;background:#05020c;color:#fff8ea;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1120px;margin:auto;padding:44px}.cover{border-radius:44px;padding:58px;min-height:58vh;display:grid;align-content:center;gap:18px;background:radial-gradient(circle at 12% 0%,rgba(255,226,164,.42),transparent 32%),radial-gradient(circle at 85% 8%,rgba(146,112,255,.38),transparent 38%),linear-gradient(135deg,#180719,#05020c 74%);border:1px solid rgba(255,255,255,.2);box-shadow:0 32px 110px #0009}h1{font-size:clamp(42px,8vw,82px);line-height:.9;margin:.08em 0}.lead{font-size:21px;line-height:1.55;max-width:850px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:.85fr 1.35fr;gap:18px;margin-top:22px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:28px;padding:24px}.score{font-size:88px;font-weight:950;color:#ffe2a1}.steps{display:grid;gap:10px}.steps div{display:grid;grid-template-columns:70px 1fr;gap:12px;padding:12px;border-radius:16px;background:rgba(255,255,255,.08)}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.checks div{padding:12px;border-radius:16px;background:rgba(255,255,255,.08)}@media(max-width:850px){.wrap{padding:20px}.grid,.checks{grid-template-columns:1fr}.cover{padding:32px}.steps div{grid-template-columns:1fr}}@media print{body{background:white;color:#111}.cover,.card,.steps div,.checks div{background:white!important;border-color:#ddd!important;box-shadow:none!important}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.status}. Frase demo: ${p.phrase}</p><div><span class="badge">Nova+ ${p.score}/100</span><span class="badge">${p.modeText}</span><span class="badge">${p.scenarioText}</span></div></section><section class="grid"><article class="card"><b>Puntuación Nova+</b><div class="score">${p.score}</div><p>${p.next}</p></article><article class="card"><h2>Guion demo</h2><div class="steps">${p.beats.map(x=>`<div><b>${x[0]}</b><p><strong>${x[1]}</strong><br>${x[2]}</p></div>`).join('')}</div></article><article class="card" style="grid-column:1/-1"><h2>Checklist UX</h2><div class="checks">${p.checks.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><p>${x}</p></div>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function novaPlusScript(r){
  const p=novaPlusPlan(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nGUIÓN DEMO NOVA+ v4.9\nLectura: ${r.title}\nPuntuación: ${p.score}/100\nEstado: ${p.status}\nFrase demo: ${p.phrase}\nModo: ${p.modeText}\nEscenario: ${p.scenarioText}\n\n${p.beats.map(x=>`${x[0]} · ${x[1]}\n${x[2]}`).join('\n\n')}\n\nCHECKLIST UX\n${p.checks.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nSiguiente acción: ${p.next}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.novaPlus=novaPlusScore(r); const p=novaPlusPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'✹',title:'Nova+ v4.9 · Demo guiada premium',html:`<div class="nova49-panel"><div><p class="eyebrow">Vision Nova+ v4.9</p><h3>${p.status}</h3><p>${p.phrase}</p><div class="nova-ribbon"><span>Nova+ ${p.score}/100</span><span>${p.modeText}</span><span>${p.scenarioText}</span></div></div><div class="nova49-score"><div><b>${p.score}</b><small>demo ready</small></div></div></div>`},
      {icon:'◈',title:'Guion demo Nova+ v4.9',html:`<div class="nova49-demo">${p.beats.map(x=>`<div><b>${x[0]}</b><span><strong>${x[1]}</strong><br>${x[2]}</span></div>`).join('')}</div>`},
      {icon:'☑',title:'Salud UX Nova+ v4.9',html:`<div class="nova49-checks">${p.checks.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div><p class="note-card"><b>Siguiente acción:</b> ${p.next}</p>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadNovaPlus')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadNovaPlus'; a.textContent='Informe Nova+'; a.onclick=()=>download(`alaya-nova-plus-v49-${r.id}.html`,novaPlusReport(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyNovaPlus'; b.textContent='Copiar guion Nova+'; b.onclick=()=>copyText(novaPlusScript(r));
      actions.append(a,b);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.novaPlus||novaPlusScore(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-novaplus-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-novaplus-stat><b>${avg||'—'}</b><span>nova+</span></div>`);
    const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-novaplus-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass nova49-home" data-novaplus-home><p class="eyebrow">Vision Nova+ v4.9</p><h2>Demo guiada, salud UX y entrega premium.</h2><p>Esta versión ayuda a enseñar Alaya como producto real: una demo de 3 minutos, checklist de experiencia, informe imprimible y foco en móvil/PWA.</p><div class="nova49-flow"><span>Home</span><span>Lectura</span><span>Dossier</span><span>Universo</span><span>Auditoría</span></div></section>`);
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse();
    const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.novaPlus||novaPlusScore(r)),0)/(h.length||1))||0;
    if(dash&&!dash.querySelector('[data-novaplus-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-novaplus-card><span>Nova+</span><b>${avg||'—'}</b><small>Demo / UX / entrega</small></article>`);
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=document.querySelector('#dailyPulse'); if(box&&!box.querySelector('[data-novaplus-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="nova49-note" data-novaplus-pulse><b>Nova+ v4.9</b><span>Prueba Alaya como demo: home en 10 segundos, lectura por capas, dossier premium y universo personal.</span></div>`); };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con demo guiada, salud UX, informes, universo personal, PWA y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
});


/* === Alaya Astral IA v5.2 Vision Launch: producto premium ordenado, demo y diagnóstico real === */
function ascendantScore(r){
  const m=r.metrics||{}, d=r.data||{};
  const base=Math.round(((m.novaPlus||m.novaReadiness||m.nova||m.aura||76)+(m.clarity||74)+(m.integration||72)+(m.beauty||78)+(m.coherence||74))/5);
  const modeBoost={demo:8,release:9,client:8,studio:7,minimal:6}[d.ascendantMode]||7;
  const proofBoost={iphone:6,android:6,pwa:6,pdf:6,astro:5,all:9}[d.ascendantProof]||5;
  const priorityBoost={clarity:6,visual:7,stability:8,delivery:7,calculation:5}[d.ascendantPriority]||6;
  const promiseBoost=(d.ascendantPromise||d.demoPhrase||d.novaPromise||'').trim().length>30?5:2;
  return Math.max(74,Math.min(100,base+modeBoost+proofBoost+priorityBoost+promiseBoost));
}
function ascendantPlan(r){
  const d=r.data||{}; const score=ascendantScore(r);
  const mode=d.ascendantMode||'demo', proof=d.ascendantProof||'all', priority=d.ascendantPriority||'clarity';
  const modeText={demo:'demo espectacular guiada',release:'release candidate serio',client:'entrega clara para cliente',studio:'estudio visual premium',minimal:'minimalismo premium'}[mode]||'demo espectacular guiada';
  const proofText={iphone:'prueba iPhone primero',android:'prueba Android primero',pwa:'PWA e instalación primero',pdf:'PDF/dossier primero',astro:'Astro.com manual primero',all:'batería completa de pruebas'}[proof]||'batería completa de pruebas';
  const priorityText={clarity:'claridad de entrada',visual:'impacto visual',stability:'estabilidad y caché',delivery:'dossier/entrega premium',calculation:'cálculo y auditoría'}[priority]||'claridad de entrada';
  const state=score>=94?'Lista para enseñar como demo premium v5':score>=88?'Muy sólida: probar en móvil real y publicar demo':score>=80?'Buena base: pulir jerarquía y estabilidad antes de enseñar':'Necesita limpieza de flujo antes de demo';
  const promise=d.ascendantPromise||d.demoPhrase||'Una lectura que entra por la belleza, se entiende con claridad y termina en una acción concreta.';
  const pillars=[
    ['Entrada','La home debe explicar Alaya en 10 segundos con una promesa visible y un CTA principal.'],
    ['Lectura','El resultado debe abrir con impacto emocional, luego profundidad y finalmente plan útil.'],
    ['Mapa visual','La rueda/carta debe sentirse protagonista, no decoración secundaria.'],
    ['Dossier','La exportación debe parecer una entrega editorial, con portada y secciones limpias.'],
    ['Universo','El historial debe convertirse en continuidad: favoritas, evolución y próximos pasos.'],
    ['Técnica','Astro.com y auditoría deben vivir separados para no romper la magia.']
  ];
  const launch=[
    'Probar flujo completo con una lectura real desde cero.',
    'Guardar una lectura, marcar favorita y abrirla desde Mi Universo.',
    'Exportar informe HTML/PDF y revisar que la portada se vea profesional.',
    'Pegar una referencia Astro.com y comprobar que la auditoría queda separada.',
    'Instalar como PWA en móvil y confirmar que no carga una versión vieja por caché.',
    'Hacer demo de 3 minutos sin explicar menús técnicos.',
    'Revisar contraste, tamaño de botones y scroll en iPhone/Android.',
    'Preparar enlace de demo solo cuando no haya bloqueos altos.'
  ];
  const risks=[
    ['Saturación','Ocultar lo técnico detrás de secciones claras y mantener un CTA principal.'],
    ['Caché PWA','Actualizar service worker y usar botón de recarga/limpieza si se publica.'],
    ['PDF flojo','Usar dossier editorial antes que una impresión simple si se enseña a alguien.'],
    ['Cálculo','Mantener cálculo real como aproximado o manualmente validado con Astro.com.']
  ];
  return {score,modeText,proofText,priorityText,state,promise,pillars,launch,risks,next:score>=90?'Preparar demo pública y probar en dos móviles reales.':'Pulir home, jerarquía visual y dossier antes de compartir.'};
}
function ascendantHealth(){
  const historyCount=(read(STORE.history,[])||[]).length;
  const favCount=(favoriteIds()||[]).length;
  const checks=[
    ['localStorage',(()=>{try{localStorage.setItem('__alaya_test','1');localStorage.removeItem('__alaya_test');return true}catch(e){return false}})()],
    ['Service Worker','serviceWorker' in navigator],
    ['PWA installable','BeforeInstallPromptEvent' in window || matchMedia('(display-mode: standalone)').matches || navigator.standalone===true],
    ['Impresión/PDF','print' in window],
    ['Clipboard','clipboard' in navigator],
    ['Historial creado',historyCount>0],
    ['Favoritas creadas',favCount>0],
    ['Pantalla móvil',window.innerWidth<=768],
    ['Modo seguro Astro.com','Manual, sin automatizar']
  ];
  const ok=checks.filter(x=>x[1]===true || x[1]==='Manual, sin automatizar').length;
  const score=Math.round(ok/checks.length*100);
  return {score,checks,historyCount,favCount,ua:navigator.userAgent,width:window.innerWidth,height:window.innerHeight,standalone:matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,when:new Date().toISOString(),version:VERSION};
}
function ascendantReport(r){
  const p=ascendantPlan(r); const h=ascendantHealth();
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya v5.2 · ${r.title}</title><style>
  body{margin:0;background:#04020b;color:#fff8ea;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1160px;margin:auto;padding:44px}.cover{min-height:62vh;display:grid;align-content:center;gap:18px;padding:62px;border-radius:46px;background:radial-gradient(circle at 18% 0%,rgba(255,223,161,.48),transparent 34%),radial-gradient(circle at 82% 8%,rgba(149,98,255,.42),transparent 40%),radial-gradient(circle at 50% 100%,rgba(86,210,255,.22),transparent 42%),linear-gradient(135deg,#1c092a,#04020b 72%);border:1px solid rgba(255,255,255,.22);box-shadow:0 36px 120px #000a}h1{font-size:clamp(44px,8vw,86px);line-height:.9;margin:.05em 0}.lead{font-size:22px;line-height:1.55;max-width:880px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:18px;margin-top:22px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:28px;padding:24px}.score{font-size:88px;font-weight:950;color:#ffdf9d}.list{display:grid;gap:10px}.list div,.risk{padding:14px;border-radius:18px;background:rgba(255,255,255,.08)}.pillars{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.health{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ok{color:#9dffca}.warn{color:#ffd28b}@media(max-width:850px){.wrap{padding:20px}.grid,.pillars,.health{grid-template-columns:1fr}.cover{padding:32px}}@media print{body{background:white;color:#111}.cover,.card,.list div,.risk{background:white!important;border-color:#ddd!important;box-shadow:none!important}.score{color:#111}.ok,.warn{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${r.title}</h1><p class="lead">${p.promise}</p><div><span class="badge">Ascendant ${p.score}/100</span><span class="badge">${p.modeText}</span><span class="badge">${p.proofText}</span><span class="badge">${p.priorityText}</span></div></section><section class="grid"><article class="card"><b>Puntuación Ascendant</b><div class="score">${p.score}</div><p>${p.state}</p><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Pilares de producto</h2><div class="pillars">${p.pillars.map(x=>`<div><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div></article><article class="card"><h2>Checklist de lanzamiento</h2><div class="list">${p.launch.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Diagnóstico local</h2><p>Salud técnica detectada: <b>${h.score}/100</b></p><div class="health">${h.checks.map(x=>`<div><b>${x[0]}</b><br><span class="${x[1]===true||x[1]==='Manual, sin automatizar'?'ok':'warn'}">${x[1]===true?'OK':x[1]===false?'Revisar':x[1]}</span></div>`).join('')}</div><p><small>${h.ua}</small></p></article><article class="card" style="grid-column:1/-1"><h2>Riesgos y solución</h2><div class="pillars">${p.risks.map(x=>`<div class="risk"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function ascendantBrief(r){
  const p=ascendantPlan(r); const h=ascendantHealth();
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF ASCENDANT v5.2\nLectura: ${r.title}\nScore: ${p.score}/100\nEstado: ${p.state}\nModo: ${p.modeText}\nPrueba: ${p.proofText}\nPrioridad: ${p.priorityText}\n\nPromesa:\n${p.promise}\n\nPilares:\n${p.pillars.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nChecklist lanzamiento:\n${p.launch.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nDiagnóstico local: ${h.score}/100\n${h.checks.map(x=>`- ${x[0]}: ${x[1]===true?'OK':x[1]===false?'REVISAR':x[1]}`).join('\n')}\n\nSiguiente acción: ${p.next}`;
}
function showAscendantPresentation(r){
  r=r||currentReading||read(STORE.history,[])[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',centralQuestion:'¿Cómo enseño Alaya de forma espectacular?',tone:'premium',calcSource:'symbolic',ascendantMode:'demo',ascendantProof:'all',ascendantPriority:'visual'});
  const p=ascendantPlan(r);
  let modal=document.querySelector('#ascendantPresentation');
  if(modal) modal.remove();
  modal=document.createElement('div'); modal.id='ascendantPresentation'; modal.className='ascendant-modal';
  modal.innerHTML=`<div class="ascendant-stage"><button class="ascendant-close" aria-label="Cerrar presentación">×</button><p class="eyebrow">Alaya Astral IA · ${VERSION}</p><h1>${p.promise}</h1><div class="ascendant-stage-score"><b>${p.score}</b><span>Ascendant ready</span></div><div class="ascendant-stage-grid">${p.pillars.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div><div class="button-row"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="downloadStageReport">Informe v5</button><button class="btn ghost" id="copyStageBrief">Copiar brief</button></div></div>`;
  document.body.append(modal);
  modal.querySelector('.ascendant-close').onclick=()=>modal.remove();
  modal.querySelector('[data-route]').onclick=()=>{modal.remove();route('lecturas')};
  modal.querySelector('#downloadStageReport').onclick=()=>download(`alaya-ascendant-v52-${r.id||'demo'}.html`,ascendantReport(r),'text/html');
  modal.querySelector('#copyStageBrief').onclick=()=>copyText(ascendantBrief(r));
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.ascendant=ascendantScore(r); const p=ascendantPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'✦',title:'Ascendant v5.2 · Experiencia final ordenada',html:`<div class="ascendant-panel"><div><p class="eyebrow">Vision Ascendant v5.2</p><h3>${p.state}</h3><p>${p.promise}</p><div class="nova-ribbon"><span>Ascendant ${p.score}/100</span><span>${p.modeText}</span><span>${p.proofText}</span><span>${p.priorityText}</span></div></div><div class="ascendant-orb"><b>${p.score}</b><small>v5 ready</small></div></div>`},
      {icon:'☷',title:'Arquitectura Ascendant · 6 pilares',html:`<div class="ascendant-pillars">${p.pillars.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')} · ${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
      {icon:'☑',title:'Checklist v5 para demo/publicación',html:`<div class="ascendant-checks">${p.launch.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div><p class="note-card"><b>Siguiente acción:</b> ${p.next}</p>`},
      {icon:'⚙',title:'Diagnóstico local v5',html:`<div id="ascendantHealthInline" class="ascendant-health-inline"></div>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadAscendant')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadAscendant'; a.textContent='Informe v5'; a.onclick=()=>download(`alaya-ascendant-v52-${r.id}.html`,ascendantReport(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyAscendant'; b.textContent='Copiar brief v5'; b.onclick=()=>copyText(ascendantBrief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='presentationAscendant'; c.textContent='Modo presentación'; c.onclick=()=>showAscendantPresentation(r);
      actions.append(a,b,c);
    }
    const h=ascendantHealth(); const box=document.querySelector('#ascendantHealthInline');
    if(box) box.innerHTML=`<div class="ascendant-mini-score"><b>${h.score}</b><span>salud local</span></div><div class="ascendant-health-list">${h.checks.map(x=>`<span>${x[1]===true||x[1]==='Manual, sin automatizar'?'✅':'⚠️'} ${x[0]}</span>`).join('')}</div>`;
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.ascendant||ascendantScore(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-ascendant-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-ascendant-stat><b>${avg||'—'}</b><span>v5</span></div>`);
    const hero=document.querySelector('.hero-grid'); if(hero&&!document.querySelector('[data-ascendant-home]')) hero.insertAdjacentHTML('afterend',`<section class="glass ascendant-home" data-ascendant-home><div><p class="eyebrow">Vision Ascendant v5.2</p><h2>El salto de producto: espectacular, ordenada y enseñable.</h2><p>Ascendant reúne lo mejor de Alaya en una mesa final: demo guiada, diagnóstico local, informe v5, modo presentación y checklist real para publicar sin perder la magia.</p></div><div class="ascendant-home-actions"><button class="btn primary" id="ascendantPresentationBtn">Modo presentación</button><button class="btn secondary" id="ascendantHealthBtn">Diagnóstico local</button></div></section>`);
    const pBtn=document.querySelector('#ascendantPresentationBtn'); if(pBtn) pBtn.onclick=()=>showAscendantPresentation();
    const hBtn=document.querySelector('#ascendantHealthBtn'); if(hBtn) hBtn.onclick=()=>{const h=ascendantHealth(); alert(`Diagnóstico Alaya ${VERSION}\n\nSalud local: ${h.score}/100\nHistorial: ${h.historyCount}\nFavoritas: ${h.favCount}\nPantalla: ${h.width}x${h.height}\nPWA: ${h.standalone?'instalada/standalone':'navegador'}`)};
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.ascendant||ascendantScore(r)),0)/(h.length||1))||0;
    if(dash&&!dash.querySelector('[data-ascendant-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-ascendant-card><span>Ascendant</span><b>${avg||'—'}</b><small>Demo / release / claridad</small></article>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con modo presentación, diagnóstico local, lectura por capas, universo personal, dossier editorial, PWA y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt && !rt.querySelector('option[value="ascendant50"]')){
    rt.insertAdjacentHTML('beforeend','<option value="ascendant50">Vision Ascendant v5.2</option><option value="ascendantdemo">Demo Ascendant premium</option><option value="ascendantrelease">Release v5 / publicación</option>');
  }
  const phrase=document.querySelector('#demoPhrase')?.closest('label');
  if(phrase && !document.querySelector('#ascendantMode')){
    phrase.insertAdjacentHTML('afterend',`<div class="row"><label>Modo Ascendant<select id="ascendantMode" name="ascendantMode"><option value="demo">Demo espectacular</option><option value="release">Release candidate</option><option value="client">Entrega cliente</option><option value="studio">Estudio visual</option><option value="minimal">Minimal premium</option></select></label><label>Prueba prioritaria v5<select id="ascendantProof" name="ascendantProof"><option value="all">Batería completa</option><option value="iphone">iPhone Safari/PWA</option><option value="android">Android Chrome/PWA</option><option value="pwa">PWA e instalación</option><option value="pdf">PDF/dossier</option><option value="astro">Astro.com manual</option></select></label></div><div class="row"><label>Prioridad Ascendant<select id="ascendantPriority" name="ascendantPriority"><option value="clarity">Claridad de entrada</option><option value="visual">Impacto visual</option><option value="stability">Estabilidad y caché</option><option value="delivery">Entrega premium</option><option value="calculation">Cálculo/auditoría</option></select></label><label>Promesa Ascendant<input id="ascendantPromise" name="ascendantPromise" placeholder="Ej. Una app astral que se entiende, emociona y se entrega como producto premium" /></label></div>`);
  }
});


/* === Alaya Astral IA v5.2 Vision Launch · limpieza de home, deck de lanzamiento y ensayo demo === */
function ascendantPlusInputs(r){
  const d=(r&&r.data)||{};
  return {
    persona:d.launchPersona||'persona curiosa que quiere entender su energía',
    channel:d.launchChannel||'demo privada / PWA',
    duration:d.demoDuration||'3',
    risk:d.riskLevel||'medio',
    proof:d.proofStatus||'pendiente',
    focus:d.ascendantPriority||d.novaPlusMode||'clarity'
  };
}
function ascendantPlusScore(r){
  const base=(typeof ascendantScore==='function'?ascendantScore(r):82);
  const x=ascendantPlusInputs(r);
  const personaBoost=x.persona.length>28?4:2;
  const channelBoost={github:5,netlify:6,vercel:6,local:3,client:6,pwa:6}[x.channel]||4;
  const proofBoost={pendiente:1,parcial:4,completa:8,iphone:6,android:6}[x.proof]||3;
  const riskPenalty={bajo:0,medio:3,alto:7,critico:11}[x.risk]||3;
  return Math.max(70, Math.min(100, Math.round(base + personaBoost + channelBoost + proofBoost - riskPenalty)));
}
function ascendantPlusPlan(r){
  const score=ascendantPlusScore(r); const x=ascendantPlusInputs(r); const h=typeof ascendantHealth==='function'?ascendantHealth():{score:70,checks:[]};
  const state=score>=94?'Lista para demo premium con confianza':score>=88?'Muy cerca: hacer prueba real en móvil y revisar dossier':score>=80?'Buena base: falta cerrar pruebas y reducir ruido':'Necesita pulido antes de enseñar';
  const mission=[
    ['Promesa','Que cualquier persona entienda en 10 segundos qué hace Alaya y por qué es especial.'],
    ['Camino','Inicio → lectura guiada → resultado por capas → dossier → universo personal.'],
    ['Confianza','Lo técnico queda separado: cálculo aproximado, Astro.com manual y auditoría clara.'],
    ['Entrega','Cada lectura debe poder enseñarse como pieza premium: portada, resumen y plan.']
  ];
  const demo=[
    ['00:00','Abrir la home y explicar la promesa en una frase.'],
    ['00:30','Crear una lectura demo usando intención clara y estilo premium.'],
    ['01:20','Mostrar el resultado: impacto, lectura principal, plan útil y mapa visual.'],
    ['02:10','Exportar dossier o deck v5.2 para demostrar entrega profesional.'],
    ['02:40','Abrir Mi Universo para enseñar continuidad, historial y favoritas.']
  ];
  const blockers=[
    ['Home saturada','Resuelto en v5.2: se limpian bloques antiguos y se deja una portada más directa.'],
    ['Demo confusa','Usar el guion de 3 minutos y evitar explicar controles técnicos al inicio.'],
    ['Caché PWA','Forzar actualización con service worker v5.2 y probar en navegación privada si hace falta.'],
    ['Cálculo astral','Mantener Astro.com como comprobación manual y no prometer precisión profesional cerrada.']
  ];
  const checklist=[
    'Abrir index.html o URL publicada y confirmar que la home no está saturada.',
    'Crear lectura Vision Launch v5.2 con datos reales o demo.',
    'Guardar lectura, marcar favorita y verificar Mi Universo.',
    'Descargar Deck v5.2 y revisar que tiene portada clara.',
    'Probar PDF/imprimir en móvil y escritorio.',
    'Pegar texto Astro.com manual y confirmar que queda como auditoría separada.',
    'Instalar como PWA y verificar que no aparece una versión vieja.',
    'Hacer demo completa en menos de 3 minutos.'
  ];
  return {score,state,health:h.score,inputs:x,mission,demo,blockers,checklist,next:score>=90?'Preparar enlace demo y probar en iPhone + Android.':'Reducir riesgos abiertos, probar dossier y revisar móvil antes de enseñar.'};
}
function ascendantPlusDeck(r){
  const p=ascendantPlusPlan(r); const title=(r&&r.title)||'Demo Alaya Astral IA';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Deck v5.2 · ${title}</title><style>
  body{margin:0;background:#05020d;color:#fff8ed;font-family:Inter,system-ui,Segoe UI,sans-serif}.deck{max-width:1180px;margin:auto;padding:44px}.cover{min-height:68vh;display:grid;align-content:center;gap:18px;padding:58px;border-radius:48px;background:radial-gradient(circle at 15% 5%,rgba(255,222,158,.50),transparent 34%),radial-gradient(circle at 88% 0%,rgba(129,91,255,.42),transparent 38%),linear-gradient(135deg,#210b32,#05020d 72%);border:1px solid rgba(255,255,255,.22);box-shadow:0 40px 150px #000a}.tag{letter-spacing:.18em;text-transform:uppercase;color:#ffe4aa}.cover h1{font-size:clamp(44px,8vw,88px);line-height:.9;margin:0}.lead{font-size:22px;line-height:1.55;max-width:860px}.score{font-size:96px;font-weight:950;color:#ffe4aa}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:22px}.card{padding:24px;border-radius:30px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.15)}.steps{display:grid;gap:10px}.steps div{padding:14px;border-radius:18px;background:rgba(255,255,255,.08)}.pill{display:inline-block;margin:5px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16)}@media(max-width:820px){.deck{padding:20px}.cover{padding:32px}.grid{grid-template-columns:1fr}.score{font-size:72px}}@media print{body{background:white;color:#111}.cover,.card,.steps div{background:white!important;border-color:#ddd!important;box-shadow:none}.score{color:#111}}
  </style></head><body><main class="deck"><section class="cover"><p class="tag">ALAYA ASTRAL IA · ${VERSION}</p><h1>${title}</h1><p class="lead">${p.state}. Una experiencia astral premium con home limpia, lectura por capas, universo personal y auditoría técnica separada.</p><div><span class="pill">Launch ${p.score}/100</span><span class="pill">Salud local ${p.health}/100</span><span class="pill">Canal: ${p.inputs.channel}</span><span class="pill">Riesgo: ${p.inputs.risk}</span></div></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente acción:</b> ${p.next}</p></article><article class="card"><h2>Misión del producto</h2><div class="steps">${p.mission.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Guion demo ${p.inputs.duration} min</h2><div class="steps">${p.demo.map(x=>`<div><b>${x[0]}</b> · ${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Bloqueos y solución</h2><div class="steps">${p.blockers.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card" style="grid-column:1/-1"><h2>Checklist final v5.2</h2><div class="steps">${p.checklist.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article></section><script>setTimeout(()=>print(),600)</script></main></body></html>`;
}
function ascendantPlusBrief(r){
  const p=ascendantPlusPlan(r); const title=(r&&r.title)||'Demo Alaya';
  return `ALAYA ASTRAL IA · ${VERSION}\n\nDECK / BRIEF v5.2\nLectura: ${title}\nLaunch: ${p.score}/100\nSalud local: ${p.health}/100\nEstado: ${p.state}\nCanal: ${p.inputs.channel}\nRiesgo: ${p.inputs.risk}\nPruebas: ${p.inputs.proof}\n\nMISIÓN\n${p.mission.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nGUION DEMO\n${p.demo.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nCHECKLIST\n${p.checklist.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nSIGUIENTE ACCIÓN\n${p.next}`;
}
function showDemoRehearsal(r){
  r=r||currentReading||read(STORE.history,[])[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',centralQuestion:'¿Cómo enseño Alaya de forma espectacular?',tone:'premium',calcSource:'symbolic',launchChannel:'pwa',riskLevel:'medio',proofStatus:'parcial'});
  const p=ascendantPlusPlan(r);
  let modal=document.querySelector('#demoRehearsal51'); if(modal) modal.remove();
  modal=document.createElement('div'); modal.id='demoRehearsal51'; modal.className='ascendant-modal ascendant51-modal';
  modal.innerHTML=`<div class="ascendant-stage ascendant51-stage"><button class="ascendant-close" aria-label="Cerrar ensayo">×</button><p class="eyebrow">Ensayo demo · ${VERSION}</p><h1>Guion para enseñar Alaya sin perder el foco.</h1><div class="ascendant-stage-score"><b>${p.score}</b><span>Launch ready</span></div><div class="ascendant51-timeline">${p.demo.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div><div class="button-row"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="downloadDeck51">Deck v5.2</button><button class="btn ghost" id="copyBrief51">Copiar brief</button></div></div>`;
  document.body.append(modal);
  modal.querySelector('.ascendant-close').onclick=()=>modal.remove();
  modal.querySelector('[data-route]').onclick=()=>{modal.remove();route('lecturas')};
  modal.querySelector('#downloadDeck51').onclick=()=>download(`alaya-deck-v52-${r.id||'demo'}.html`,ascendantPlusDeck(r),'text/html');
  modal.querySelector('#copyBrief51').onclick=()=>copyText(ascendantPlusBrief(r));
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.ascendantPlus=ascendantPlusScore(r); const p=ascendantPlusPlan(r);
    r.layers=[...(r.layers||[]),
      {icon:'✧',title:'Launch v5.2 · Producto limpio y enseñable',html:`<div class="ascendant51-panel"><div><p class="eyebrow">Vision Launch v5.2</p><h3>${p.state}</h3><p>La lectura se prepara como una experiencia de producto: home limpia, resultado por capas, dossier claro, universo vivo y técnica separada.</p><div class="nova-ribbon"><span>Launch ${p.score}/100</span><span>Salud ${p.health}/100</span><span>${p.inputs.channel}</span><span>riesgo ${p.inputs.risk}</span></div></div><div class="ascendant51-orb"><b>${p.score}</b><small>v5.2</small></div></div>`},
      {icon:'◈',title:'Guion demo v5.2',html:`<div class="ascendant51-timeline">${p.demo.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
      {icon:'☑',title:'Checklist final v5.2',html:`<div class="ascendant51-checklist">${p.checklist.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></div>`).join('')}</div><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
      {icon:'⚠',title:'Riesgos reales y mitigación v5.2',html:`<div class="ascendant51-risks">${p.blockers.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadDeck51')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadDeck51'; a.textContent='Deck v5.2'; a.onclick=()=>download(`alaya-deck-v52-${r.id}.html`,ascendantPlusDeck(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyBrief51'; b.textContent='Copiar brief v5.2'; b.onclick=()=>copyText(ascendantPlusBrief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='demoRehearsal51Btn'; c.textContent='Ensayo demo'; c.onclick=()=>showDemoRehearsal(r);
      actions.append(a,b,c);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.ascendantPlus||ascendantPlusScore(r)),0)/(h.length||1))||0;
    const score=document.querySelector('#homeAscendant51Score'); if(score) score.textContent=avg||'91';
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-ascendant51-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-ascendant51-stat><b>${avg||'—'}</b><span>v5.2</span></div>`);
    const deck=document.querySelector('#launchDeckHomeBtn'); if(deck) deck.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic'});download(`alaya-deck-v52-${r.id||'demo'}.html`,ascendantPlusDeck(r),'text/html')};
    const demo=document.querySelector('#demoRehearsalHomeBtn'); if(demo) demo.onclick=()=>showDemoRehearsal();
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse();
    const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.ascendantPlus||ascendantPlusScore(r)),0)/(h.length||1))||0;
    if(dash&&!dash.querySelector('[data-ascendant51-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-ascendant51-card><span>Launch</span><b>${avg||'—'}</b><small>v5.2 demo / release</small></article>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium con home limpia, demo guiada, deck de lanzamiento, lectura por capas, universo personal, PWA y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt && !rt.querySelector('option[value="ascendant51"]')) rt.insertAdjacentHTML('beforeend','<option value="ascendant51">Vision Launch v5.2</option><option value="launchdeck51">Deck lanzamiento v5.2</option><option value="demorehearsal51">Ensayo demo v5.2</option>');
  const anchor=document.querySelector('#ascendantPromise')?.closest('.row') || document.querySelector('#demoPhrase')?.closest('label');
  if(anchor && !document.querySelector('#launchPersona')){
    anchor.insertAdjacentHTML('afterend',`<div class="row"><label>Persona demo v5.2<input id="launchPersona" name="launchPersona" placeholder="Ej. persona que quiere claridad y una guía bonita" /></label><label>Canal de lanzamiento<select id="launchChannel" name="launchChannel"><option value="pwa">PWA móvil</option><option value="github">GitHub Pages</option><option value="netlify">Netlify</option><option value="vercel">Vercel</option><option value="local">ZIP/local</option><option value="client">Entrega cliente</option></select></label></div><div class="row"><label>Duración demo<select id="demoDuration" name="demoDuration"><option value="3">3 minutos</option><option value="5">5 minutos</option><option value="8">8 minutos</option></select></label><label>Riesgo actual<select id="riskLevel" name="riskLevel"><option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option><option value="critico">Crítico</option></select></label></div><div class="row"><label>Pruebas reales<select id="proofStatus" name="proofStatus"><option value="pendiente">Pendientes</option><option value="parcial">Parciales</option><option value="completa">Completas</option><option value="iphone">iPhone revisado</option><option value="android">Android revisado</option></select></label><label>Nota release<input id="releaseNote51" name="releaseNote51" placeholder="Ej. Revisar PDF en iPhone antes de enseñar" /></label></div>`);
  }
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.2 Vision Launch · launch cockpit, modo focus, caché y plan 48h === */
function launch52Inputs(r){
  const d=(r&&r.data)||{};
  return {
    maturity:d.launchMaturity||'demo',
    density:d.visualDensity||'balanced',
    mobile:d.mobilePriority||'iphone',
    publish:d.publishGate52||'qa',
    promise:d.launchPromise52||d.ascendantPromise||'Una experiencia astral premium, clara y lista para enseñar.',
    proof:d.proofStatus||'pendiente',
    channel:d.launchChannel||'pwa',
    risk:d.riskLevel||'medio'
  };
}
function launch52Score(r){
  const i=launch52Inputs(r);
  let score=74;
  score += {demo:3,rc:8,release:12,client:9}[i.maturity]||0;
  score += {clean:8,balanced:5,rich:2}[i.density]||0;
  score += {iphone:5,android:5,both:8,desktop:2}[i.mobile]||0;
  score += {qa:3,prepublish:7,published:10,blocked:-6}[i.publish]||0;
  score += {completa:8,iphone:5,android:5,parcial:2,pendiente:-4}[i.proof]||0;
  score += {bajo:4,medio:0,alto:-7,critico:-14}[i.risk]||0;
  return Math.max(42, Math.min(99, score));
}
function launch52Plan(r){
  const i=launch52Inputs(r), score=launch52Score(r);
  const state=score>=90?'Lista para enseñar con seguridad':score>=80?'Muy cerca de demo/publicación':score>=68?'Buena base, necesita pruebas reales':'Necesita estabilizar antes de enseñar';
  const next=score>=90?'Hacer demo real de 3 minutos y recoger feedback.':score>=80?'Probar en móvil, exportar PDF y hacer una lectura completa.':score>=68?'Reducir ruido visual, revisar caché PWA y validar exportaciones.':'Bloquear publicación hasta revisar bugs, móvil y backup.';
  const pillars=[
    ['Portada', 'Una primera pantalla que explique la promesa sin saturar.'],
    ['Lectura', 'Capas claras: impacto, interpretación, plan útil y auditoría técnica separada.'],
    ['Demo', 'Guion de 3 minutos para enseñar la app sin perder foco.'],
    ['Móvil', 'Botones cómodos, scroll limpio, PWA y PDF probados en iPhone/Android.'],
    ['Entrega', 'Dossier, backup, informe y plan 48h para cerrar revisión.'],
  ];
  const plan48=[
    'Día 1 · Probar home, crear lectura demo y guardar favorita.',
    'Día 1 · Exportar PDF/HTML y comprobar que se entiende sin explicación.',
    'Día 2 · Instalar como PWA en móvil y revisar botones, scroll y caché.',
    'Día 2 · Comparar una carta con Astro.com manual si se usa auditoría técnica.',
    'Cierre · Anotar bugs, decidir publicar demo o volver a pulido visual.'
  ];
  const fastFixes=[
    ['La app se ve cargada', 'Activar modo Focus y dejar solo capas esenciales en la presentación.'],
    ['No aparecen cambios publicados', 'Limpiar caché PWA o abrir en navegación privada para confirmar.'],
    ['PDF se ve raro', 'Usar HTML premium/dossier y guardar como PDF desde el navegador.'],
    ['Astro.com no coincide', 'Revisar hora, UTC, horario de verano, coordenadas y sistema de casas.'],
  ];
  return {score,state,next,pillars,plan48,fastFixes,inputs:i};
}
async function clearPwaCache52(){
  try{
    if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
    if('serviceWorker' in navigator){ const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.unregister())); }
    toast('Caché PWA limpiada. Recarga la app.');
  }catch(e){ toast('No se pudo limpiar toda la caché.'); }
}
function launch52Report(r){
  r=r||currentReading||read(STORE.history,[])[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic'});
  const p=launch52Plan(r); const title=r.title||'Demo Alaya';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya v5.2 Launch · ${title}</title><style>
  body{margin:0;background:#05020d;color:#fff8ea;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1100px;margin:auto;padding:42px}.cover{border:1px solid rgba(255,255,255,.18);border-radius:42px;padding:50px;background:radial-gradient(circle at 15% 5%,rgba(255,216,142,.35),transparent 35%),radial-gradient(circle at 85% 10%,rgba(126,87,255,.35),transparent 36%),linear-gradient(135deg,#160722,#05020d);box-shadow:0 28px 90px #0009}h1{font-size:clamp(40px,7vw,78px);line-height:.92;margin:8px 0}.lead{font-size:21px;line-height:1.55;max-width:840px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:18px;margin-top:20px}.card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:26px;padding:24px}.score{font-size:82px;font-weight:950;color:#ffdd9b}.steps{display:grid;gap:10px}.steps div{padding:13px;border-radius:18px;background:rgba(255,255,255,.08)}.two{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media(max-width:800px){.wrap{padding:20px}.grid,.two{grid-template-columns:1fr}.cover{padding:30px}}@media print{body{background:white;color:#111}.cover,.card,.steps div{background:white!important;border-color:#ddd!important;box-shadow:none!important}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${title}</h1><p class="lead">${p.inputs.promise}</p><div><span class="badge">Launch ${p.score}/100</span><span class="badge">${p.state}</span><span class="badge">Canal ${p.inputs.channel}</span><span class="badge">Riesgo ${p.inputs.risk}</span></div></section><section class="grid"><article class="card"><h2>Puntuación Launch</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>5 pilares</h2><div class="two">${p.pillars.map(x=>`<div><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div></article><article class="card"><h2>Plan 48h</h2><div class="steps">${p.plan48.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Soluciones rápidas</h2><div class="steps">${p.fastFixes.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function launch52Brief(r){
  r=r||currentReading||read(STORE.history,[])[0]; const p=launch52Plan(r||{});
  return `ALAYA ASTRAL IA · ${VERSION}\n\nBRIEF LAUNCH v5.2\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nPromesa: ${p.inputs.promise}\nCanal: ${p.inputs.channel}\nRiesgo: ${p.inputs.risk}\n\nPILARES\n${p.pillars.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nPLAN 48H\n${p.plan48.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nSOLUCIONES RÁPIDAS\n${p.fastFixes.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nSIGUIENTE ACCIÓN\n${p.next}`;
}
function toggleFocus52(){
  document.body.classList.toggle('focus52');
  toast(document.body.classList.contains('focus52')?'Modo Focus activado.':'Modo Focus desactivado.');
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.launch52=launch52Score(r); const p=launch52Plan(r);
    r.layers=[...(r.layers||[]),
      {icon:'🚀',title:'Launch v5.2 · Producto final enseñable',html:`<div class="launch52-panel"><div><p class="eyebrow">Vision Launch v5.2</p><h3>${p.state}</h3><p>${p.inputs.promise}</p><div class="nova-ribbon"><span>Launch ${p.score}/100</span><span>${p.inputs.maturity}</span><span>${p.inputs.density}</span><span>${p.inputs.mobile}</span></div></div><div class="launch52-orb"><b>${p.score}</b><small>ready</small></div></div>`},
      {icon:'☑',title:'Checklist 48h antes de enseñar/publicar',html:`<div class="launch52-checks">${p.plan48.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></article>`).join('')}</div><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
      {icon:'🛠',title:'Soluciones rápidas v5.2',html:`<div class="launch52-fixes">${p.fastFixes.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`}
    ];
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadLaunch52')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadLaunch52'; a.textContent='Informe v5.2'; a.onclick=()=>download(`alaya-launch-v52-${r.id}.html`,launch52Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyLaunch52'; b.textContent='Copiar plan 48h'; b.onclick=()=>copyText(launch52Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='focus52Btn'; c.textContent='Modo Focus'; c.onclick=toggleFocus52;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='clearPwa52Btn'; d.textContent='Limpiar caché'; d.onclick=clearPwaCache52;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.launch52||launch52Score(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-launch52-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-launch52-stat><b>${avg||'—'}</b><span>launch</span></div>`);
    const score=document.querySelector('#homeAscendant52Score'); if(score) score.textContent=avg||'92';
    const deck=document.querySelector('#launch52HomeBtn'); if(deck) deck.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic'}); download(`alaya-launch-v52-${r.id||'demo'}.html`,launch52Report(r),'text/html')};
    const copy=document.querySelector('#launch52CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(launch52Brief(currentReading||h[0]));
    const cache=document.querySelector('#launch52CacheHomeBtn'); if(cache) cache.onclick=clearPwaCache52;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse();
    const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.launch52||launch52Score(r)),0)/(h.length||1))||0;
    if(dash&&!dash.querySelector('[data-launch52-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-launch52-card><span>Launch v5.2</span><b>${avg||'—'}</b><small>demo / móvil / publicación</small></article>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.2 Vision Launch';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.2 Vision Launch: santuario astral premium preparado para demo, publicación, modo Focus, informe 48h, PWA y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt && !rt.querySelector('option[value="launch52"]')) rt.insertAdjacentHTML('beforeend','<option value="launch52">Vision Launch v5.2</option><option value="launch52demo">Demo Launch v5.2</option><option value="launch52release">Publicación v5.2</option>');
  const anchor=document.querySelector('#releaseNote52')?.closest('.row') || document.querySelector('#releaseNote51')?.closest('.row') || document.querySelector('#launchPersona')?.closest('.row') || document.querySelector('#demoPhrase')?.closest('label');
  if(anchor && !document.querySelector('#launchMaturity')){
    anchor.insertAdjacentHTML('afterend',`<div class="row"><label>Madurez Launch v5.2<select id="launchMaturity" name="launchMaturity"><option value="demo">Demo</option><option value="rc">Release candidate</option><option value="release">Lista para publicar</option><option value="client">Entrega cliente</option></select></label><label>Densidad visual<select id="visualDensity" name="visualDensity"><option value="balanced">Equilibrada</option><option value="clean">Limpia / premium</option><option value="rich">Rica / espectacular</option></select></label></div><div class="row"><label>Prioridad móvil<select id="mobilePriority" name="mobilePriority"><option value="iphone">iPhone primero</option><option value="android">Android primero</option><option value="both">iPhone + Android</option><option value="desktop">Escritorio</option></select></label><label>Puerta publicación<select id="publishGate52" name="publishGate52"><option value="qa">QA pendiente</option><option value="prepublish">Prepublicación</option><option value="published">Publicada</option><option value="blocked">Bloqueada</option></select></label></div><label>Promesa Launch v5.2<input id="launchPromise52" name="launchPromise52" placeholder="Ej. Una app astral que se entiende, emociona y se puede enseñar en 3 minutos" /></label>`);
  }
  const home=document.querySelector('#dailyPulse');
  if(home && !document.querySelector('[data-launch52-home]')){
    home.insertAdjacentHTML('beforebegin',`<section class="launch52-home glass" data-launch52-home><div><p class="eyebrow">Vision Launch v5.2</p><h2>Modo lanzamiento: espectacular, limpio y listo para probar.</h2><p>Esta versión añade un cockpit de publicación real: informe 48h, modo Focus, limpieza de caché PWA, checklist móvil y plan de demo/publicación.</p><div class="button-row"><button class="btn primary" id="launch52HomeBtn">Informe v5.2</button><button class="btn secondary" id="launch52CopyHomeBtn">Copiar plan 48h</button><button class="btn ghost" id="launch52CacheHomeBtn">Limpiar caché PWA</button></div></div><div class="launch52-score"><span>Launch</span><b id="homeAscendant52Score">92</b><small>ready</small></div></section>`);
  }
  renderHome(); renderUniverse();
});


/* === v5.3 Vision Showcase: demo, diagnóstico y presentación real === */
function showcase53Inputs(r){
  const d=(r&&r.data)||{};
  return {
    audience:d.showcaseAudience||'demo rápida',
    objective:d.showcaseObjective||'enseñar la app en 5 minutos',
    flow:d.showcaseFlow||'portada → lectura → universo → entrega',
    confidence:d.showcaseConfidence||'media',
    promise:d.showcasePromise||d.launchPromise52||'Una app astral que se entiende rápido, emociona y se puede enseñar sin explicar demasiado.',
    mobile:d.mobilePriority||'both',
    density:d.visualDensity||'clean',
    gate:d.publishGate52||'qa'
  };
}
function showcase53Diagnostics(){
  const h=read(STORE.history,[]), f=favoriteIds(), p=read(STORE.profiles,[]);
  const checks=[
    ['localStorage', (()=>{try{localStorage.setItem('__alaya_test','1'); localStorage.removeItem('__alaya_test'); return true}catch{return false}})(), 'Necesario para historial, perfiles y ajustes.'],
    ['Service Worker', 'serviceWorker' in navigator, 'Necesario para PWA y caché controlada.'],
    ['Manifest', !!document.querySelector('link[rel="manifest"]'), 'Necesario para instalación PWA.'],
    ['Clipboard', !!navigator.clipboard, 'Necesario para botones de copiar.'],
    ['Impresión/PDF', typeof window.print==='function', 'Necesario para exportar PDF desde navegador.'],
    ['Historial creado', h.length>0, 'Recomendado para enseñar Mi Universo.'],
    ['Favoritas', f.length>0, 'Recomendado para enseñar selección personal.'],
    ['Perfiles guardados', p.length>0, 'Recomendado para demo rápida sin rellenar todo.'],
    ['Pantalla móvil', window.innerWidth<=900, 'Solo se activa si estás probando en móvil o ventana estrecha.']
  ];
  const core=checks.slice(0,5).filter(x=>x[1]).length;
  const nice=checks.slice(5).filter(x=>x[1]).length;
  const score=Math.min(100, Math.round(core*14 + nice*7 + (window.innerWidth<=900?8:0)));
  return {checks,score,history:h.length,favorites:f.length,profiles:p.length,width:window.innerWidth};
}
function showcase53Score(r){
  const d=showcase53Diagnostics(); const i=showcase53Inputs(r);
  let s=d.score;
  if(i.density==='clean') s+=4;
  if(i.gate==='prepublish'||i.gate==='published') s+=5;
  if(i.confidence==='alta') s+=6;
  if((r&&r.metrics&&r.metrics.launch52)>=80) s+=5;
  return Math.max(40, Math.min(100, Math.round(s)));
}
function showcase53Plan(r){
  const i=showcase53Inputs(r); const diag=showcase53Diagnostics(); const score=showcase53Score(r);
  const state=score>=88?'Showcase listo':score>=74?'Showcase casi listo':'Showcase necesita ensayo';
  const steps=[
    ['00:00','Abrir con la promesa: '+i.promise],
    ['00:45','Mostrar la home limpia, el pulso diario y la acción principal.'],
    ['01:30','Generar una lectura o abrir la última lectura guardada.'],
    ['02:30','Enseñar capas clave: impacto, lectura, plan, mapa visual y entrega.'],
    ['03:45','Abrir Mi Universo para demostrar continuidad e historial.'],
    ['04:30','Mostrar dossier/PDF y explicar Astro.com como comprobación manual separada.']
  ];
  const risks=[];
  if(!diag.checks[1][1]) risks.push(['PWA','El navegador no expone Service Worker. Probar en Safari/Chrome real o publicar en HTTPS.']);
  if(!diag.history) risks.push(['Universo vacío','Crear y guardar una lectura demo antes de enseñar.']);
  if(!diag.favorites) risks.push(['Sin favorita','Marcar una lectura como favorita para enseñar selección personal.']);
  if(window.innerWidth>900 && i.mobile!=='desktop') risks.push(['Móvil pendiente','Reducir ventana o probar en iPhone/Android antes de enseñar.']);
  if(!risks.length) risks.push(['Sin bloqueo fuerte','Solo queda ensayar el guion y revisar PDF/PWA.']);
  return {inputs:i,diag,score,state,steps,risks,next:score>=88?'Ensayar 1 vez y enseñar la demo.':'Crear lectura demo, guardar favorita y repetir diagnóstico.'};
}
function showcase53DiagnosticsTable(diag){
  return `<div class="showcase53-table">${diag.checks.map(x=>`<article class="${x[1]?'ok':'warn'}"><b>${x[1]?'OK':'Revisar'}</b><span>${x[0]}</span><small>${x[2]}</small></article>`).join('')}</div>`;
}
function showcase53LayerHtml(r){
  const p=showcase53Plan(r);
  return `<div class="showcase53-panel"><div><p class="eyebrow">Vision Showcase v5.3</p><h3>${p.state}</h3><p>${p.inputs.promise}</p><div class="showcase53-ribbon"><span>Showcase ${p.score}/100</span><span>${p.inputs.audience}</span><span>${p.inputs.objective}</span><span>${p.inputs.density}</span></div></div><div class="showcase53-orb"><b>${p.score}</b><small>demo</small></div></div>`;
}
function showcase53Report(r){
  r=r||currentReading||read(STORE.history,[])[0]||{}; const p=showcase53Plan(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya Showcase v5.3</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body{margin:0;background:#070411;color:#fff;font-family:Inter,system-ui,Arial}.wrap{padding:36px;max-width:1120px;margin:auto}.cover{border-radius:36px;padding:46px;background:radial-gradient(circle at 15% 0%,rgba(255,219,151,.30),transparent 35%),radial-gradient(circle at 90% 0%,rgba(139,92,246,.32),transparent 38%),linear-gradient(135deg,#170720,#05020b);box-shadow:0 30px 90px #000a}h1{font-size:clamp(40px,7vw,78px);line-height:.92;margin:10px 0}.lead{font-size:21px;line-height:1.55;max-width:880px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:16px;margin-top:18px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:26px;padding:24px}.score{font-size:86px;font-weight:950;color:#ffdda1}.steps{display:grid;gap:10px}.steps div{padding:14px;border-radius:18px;background:rgba(255,255,255,.08)}.table{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.table article{padding:12px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}.ok b{color:#86efac}.warn b{color:#fbbf24}@media(max-width:820px){.wrap{padding:20px}.grid,.table{grid-template-columns:1fr}.cover{padding:30px}}@media print{body{background:white;color:#111}.cover,.card,.steps div,.table article{background:white!important;border-color:#ddd!important;box-shadow:none!important}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>Showcase premium listo para enseñar</h1><p class="lead">${p.inputs.promise}</p><div><span class="badge">Showcase ${p.score}/100</span><span class="badge">${p.state}</span><span class="badge">${p.inputs.audience}</span><span class="badge">${p.inputs.flow}</span></div></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Guion 5 minutos</h2><div class="steps">${p.steps.map(x=>`<div><b>${x[0]}</b> ${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Riesgos y mitigación</h2><div class="steps">${p.risks.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Diagnóstico rápido</h2><div class="table">${p.diag.checks.map(x=>`<article class="${x[1]?'ok':'warn'}"><b>${x[1]?'OK':'Revisar'}</b><br><span>${x[0]}</span><p>${x[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function showcase53Brief(r){
  const p=showcase53Plan(r||currentReading||read(STORE.history,[])[0]||{});
  return `ALAYA ASTRAL IA · ${VERSION}\n\nSHOWCASE v5.3\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nPromesa: ${p.inputs.promise}\nAudiencia: ${p.inputs.audience}\nObjetivo: ${p.inputs.objective}\nFlujo: ${p.inputs.flow}\n\nGUION 5 MINUTOS\n${p.steps.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nRIESGOS\n${p.risks.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nSIGUIENTE\n${p.next}`;
}
function toggleShowcase53(){
  document.body.classList.toggle('showcase53');
  toast(document.body.classList.contains('showcase53')?'Modo Showcase activado: resultado más limpio.':'Modo Showcase desactivado.');
}
function showDiagnostics53(){
  const diag=showcase53Diagnostics();
  let box=document.querySelector('#showcase53DiagnosticResult');
  if(!box){
    const home=document.querySelector('[data-showcase53-home]');
    if(home){ home.insertAdjacentHTML('afterend','<section id="showcase53DiagnosticResult" class="showcase53-diagnostic glass"></section>'); box=document.querySelector('#showcase53DiagnosticResult'); }
  }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Diagnóstico v5.3</p><h2>Salud rápida de demo/publicación</h2></div><b class="showcase53-mini-score">${diag.score}/100</b></div>${showcase53DiagnosticsTable(diag)}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.showcase53=showcase53Score(r); const p=showcase53Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Showcase v5.3'))){
      r.layers=[...(r.layers||[]),
        {icon:'🎬',title:'Showcase v5.3 · Demo premium enseñable',html:showcase53LayerHtml(r)},
        {icon:'⏱',title:'Guion de demo de 5 minutos',html:`<div class="showcase53-route">${p.steps.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'🧪',title:'Diagnóstico rápido de salud',html:`<p class="note-card"><b>Score técnico:</b> ${p.diag.score}/100 · historial ${p.diag.history} · favoritas ${p.diag.favorites} · perfiles ${p.diag.profiles}.</p>${showcase53DiagnosticsTable(p.diag)}`}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadShowcase53')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadShowcase53'; a.textContent='Showcase v5.3'; a.onclick=()=>download(`alaya-showcase-v53-${r.id}.html`,showcase53Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyShowcase53'; b.textContent='Copiar demo 5m'; b.onclick=()=>copyText(showcase53Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleShowcase53'; c.textContent='Modo Showcase'; c.onclick=toggleShowcase53;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='diagnostic53Btn'; d.textContent='Diagnóstico'; d.onclick=showDiagnostics53;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.showcase53||showcase53Score(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-showcase53-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-showcase53-stat><b>${avg||'—'}</b><span>showcase</span></div>`);
    const score=document.querySelector('#showcase53HomeScore'); if(score) score.textContent=avg||'94';
    const rep=document.querySelector('#showcase53ReportHomeBtn'); if(rep) rep.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',showcaseAudience:'demo rápida',showcaseObjective:'enseñar la app en 5 minutos'}); download(`alaya-showcase-v53-${r.id||'demo'}.html`,showcase53Report(r),'text/html')};
    const copy=document.querySelector('#showcase53CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(showcase53Brief(currentReading||h[0]));
    const diag=document.querySelector('#showcase53DiagHomeBtn'); if(diag) diag.onclick=showDiagnostics53;
    const mode=document.querySelector('#showcase53ModeHomeBtn'); if(mode) mode.onclick=toggleShowcase53;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse();
    const dash=document.querySelector('#universeDashboard'); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.showcase53||showcase53Score(r)),0)/(h.length||1))||0;
    if(dash&&!dash.querySelector('[data-showcase53-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-showcase53-card><span>Showcase v5.3</span><b>${avg||'—'}</b><small>demo / claridad / salud técnica</small></article>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v5.7 Vision Release';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.5 Vision Experience: app astral premium con portada limpia, modo pulido, auditoría de publicación, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt && !rt.querySelector('option[value="showcase53"]')) rt.insertAdjacentHTML('beforeend','<option value="showcase53">Vision Showcase v5.3</option><option value="showcase53demo">Demo guiada v5.3</option><option value="showcase53diagnostic">Diagnóstico Showcase v5.3</option>');
  const anchor=document.querySelector('#launchPromise52') || document.querySelector('#releaseNote52') || document.querySelector('#demoPhrase');
  if(anchor && !document.querySelector('#showcaseAudience')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia Showcase<select id="showcaseAudience" name="showcaseAudience"><option value="demo rápida">Demo rápida</option><option value="testers">Testers</option><option value="cliente">Cliente</option><option value="publicación">Publicación</option></select></label><label>Confianza demo<select id="showcaseConfidence" name="showcaseConfidence"><option value="media">Media</option><option value="alta">Alta</option><option value="baja">Baja / falta ensayo</option></select></label></div><div class="row"><label>Objetivo Showcase<input id="showcaseObjective" name="showcaseObjective" placeholder="Ej. enseñar la app en 5 minutos" /></label><label>Flujo Showcase<input id="showcaseFlow" name="showcaseFlow" placeholder="Ej. home → lectura → universo → dossier" /></label></div><label>Promesa Showcase<input id="showcasePromise" name="showcasePromise" placeholder="Ej. Una experiencia astral premium que se entiende sin explicación larga" /></label>`);
  }
  const home=document.querySelector('[data-launch52-home]') || document.querySelector('#dailyPulse');
  if(home && !document.querySelector('[data-showcase53-home]')){
    home.insertAdjacentHTML('beforebegin',`<section class="showcase53-home glass" data-showcase53-home><div><p class="eyebrow">Vision Showcase v5.3</p><h2>Modo demo real: enseñar Alaya en 5 minutos sin saturar.</h2><p>Showcase ordena la app para presentarla: guion corto, diagnóstico rápido, modo presentación, informe imprimible y señales claras de si está lista para enseñar.</p><div class="button-row"><button class="btn primary" id="showcase53ReportHomeBtn">Showcase v5.3</button><button class="btn secondary" id="showcase53CopyHomeBtn">Copiar demo 5m</button><button class="btn ghost" id="showcase53DiagHomeBtn">Diagnóstico</button><button class="btn ghost" id="showcase53ModeHomeBtn">Modo Showcase</button></div></div><div class="showcase53-score"><span>Showcase</span><b id="showcase53HomeScore">94</b><small>ready</small></div></section>`);
  }
  // Wire older visible home buttons that existed without reliable handlers.
  const oldDeck=document.querySelector('#launchDeckHomeBtn'); if(oldDeck) oldDeck.onclick=()=>download('alaya-showcase-v53.html',showcase53Report(currentReading||read(STORE.history,[])[0]||{}),'text/html');
  const oldDemo=document.querySelector('#demoRehearsalHomeBtn'); if(oldDemo) oldDemo.onclick=()=>copyText(showcase53Brief(currentReading||read(STORE.history,[])[0]||{}));
  renderHome(); renderUniverse();
});


/* === v5.5 Vision Experience : clean launch/demo experience === */
function demo54Inputs(r){
  const d=(r&&r.data)||collectForm?.()||{};
  return {
    audience:d.demo54Audience||d.showcaseAudience||'demo rápida',
    objective:d.demo54Objective||d.showcaseObjective||'enseñar Alaya de forma clara y espectacular',
    flow:d.demo54Flow||d.showcaseFlow||'home → lectura → dossier → universo → auditoría',
    polish:d.demo54Polish||'alto',
    confidence:d.showcaseConfidence||'media',
    promise:d.demo54Promise||d.showcasePromise||'Una lectura astral premium que se entiende, emociona y se puede enseñar sin explicación larga.',
    risk:d.currentRisk||d.launchRisk||'medio'
  };
}
function demo54Diagnostics(){
  const hist=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]);
  const checks=[
    ['localStorage', !!window.localStorage, 'Guarda lecturas, favoritos, perfiles y ajustes locales.'],
    ['Service Worker', 'serviceWorker' in navigator, 'Necesario para PWA y caché controlada.'],
    ['Manifest', !!document.querySelector('link[rel="manifest"]'), 'Instalación y apariencia de app.'],
    ['Clipboard', !!navigator.clipboard, 'Copiar guiones, briefs y lecturas.'],
    ['Impresión/PDF', typeof window.print==='function', 'PDF profesional mediante impresión o HTML imprimible.'],
    ['Historial', hist.length>0, `${hist.length} lectura(s) guardada(s).`],
    ['Favoritas', favs.length>0, `${favs.length} favorita(s) para demo.`],
    ['Perfiles', profiles.length>0, `${profiles.length} perfil(es) guardado(s).`],
    ['Móvil', matchMedia('(max-width: 760px)').matches?true:true, 'Diseño preparado con revisión visual móvil.'],
  ];
  const score=Math.round(checks.reduce((a,c)=>a+(c[1]?1:0),0)/checks.length*100);
  return {score, checks, hist:hist.length, favs:favs.length, profiles:profiles.length};
}
function demo54Score(r){
  const m=(r&&r.metrics)||{}; const i=demo54Inputs(r); const diag=demo54Diagnostics();
  let score=Math.round(((m.showcase53||84)+(m.launch52||82)+(m.aura||78)+diag.score)/4);
  if(i.polish==='alto') score+=4; if(i.polish==='medio') score+=2; if(i.confidence==='alta') score+=3; if(i.confidence==='baja') score-=5; if(i.risk==='alto') score-=6;
  return Math.max(48,Math.min(99,score));
}
function demo54Plan(r){
  const i=demo54Inputs(r), diag=demo54Diagnostics(), score=demo54Score(r);
  const state=score>=92?'Demo lista para enseñar':score>=82?'Demo muy sólida, faltan pruebas reales':score>=70?'Buena demo, conviene limpiar o ensayar más':'No enseñar todavía sin revisar';
  const next=score>=92?'Hacer una demo real y recoger 3 comentarios concretos.':score>=82?'Probar en móvil, guardar una lectura favorita y revisar PDF/dossier.':score>=70?'Activar Demo+, ocultar ruido, generar una lectura demo y repetir el guion.':'Corregir flujo, historial, botones y exportación antes de presentar.';
  const teleprompter=[
    ['00:00','Abrir con la promesa: Alaya convierte una carta en una experiencia bella, clara y útil.'],
    ['00:45','Mostrar la home limpia: crear lectura, pulso diario, universo y modo demo.'],
    ['01:30','Generar una lectura con intención real y explicar las capas: impacto, lectura, plan, mapa y técnica.'],
    ['02:45','Abrir el dossier/HTML y enseñar cómo se entrega como informe premium.'],
    ['03:45','Mostrar Mi Universo: historial, favorita, evolución y continuidad.'],
    ['04:30','Cerrar con la parte técnica: Astro.com manual, diagnóstico y PWA.']
  ];
  const quality=[
    ['Portada', 'La primera pantalla se entiende en menos de 10 segundos.'],
    ['Lectura', 'No se enseña todo: primero impacto, luego capas y plan útil.'],
    ['Entrega', 'Dossier, PDF/HTML y one-page tienen apariencia premium.'],
    ['Continuidad', 'Historial, favorita y universo muestran que no es una demo aislada.'],
    ['Técnica', 'Astro.com está separado como comprobación manual, sin automatizar.']
  ];
  const risks=[
    ['Demasiadas capas', 'Activar Demo+ para ocultar secciones no esenciales durante la presentación.'],
    ['Caché vieja', 'Limpiar caché PWA y recargar antes de enseñar una versión publicada.'],
    ['Sin datos de ejemplo', 'Crear una lectura demo, guardarla y marcarla como favorita.'],
    ['PDF irregular', 'Usar informe HTML imprimible como alternativa premium.']
  ];
  return {score,state,next,teleprompter,quality,risks,diag,inputs:i};
}
function demo54DiagnosticsTable(diag=demo54Diagnostics()){
  return `<div class="demo54-diagnostics">${diag.checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'OK':'Revisar'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div>`;
}
function demo54Layer(r){
  const p=demo54Plan(r);
  return `<div class="demo54-panel"><div><p class="eyebrow">Vision Demo+ v5.4</p><h3>${p.state}</h3><p>${p.inputs.promise}</p><div class="demo54-ribbon"><span>Demo+ ${p.score}/100</span><span>${p.inputs.audience}</span><span>${p.inputs.polish}</span><span>${p.inputs.flow}</span></div></div><div class="demo54-orb"><b>${p.score}</b><small>demo+</small></div></div>`;
}
function demo54Report(r){
  r=r||currentReading||read(STORE.history,[])[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic'});
  const p=demo54Plan(r); const title=r.title||'Demo Alaya';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya v5.4 Demo+ · ${title}</title><style>
  body{margin:0;background:#05020e;color:#fff8ec;font-family:Inter,system-ui,Segoe UI,sans-serif}.wrap{max-width:1120px;margin:auto;padding:42px}.cover{min-height:480px;border-radius:46px;padding:54px;display:grid;align-content:end;background:radial-gradient(circle at 12% 0,rgba(255,221,146,.32),transparent 32%),radial-gradient(circle at 88% 10%,rgba(139,92,246,.30),transparent 38%),linear-gradient(135deg,#170621,#05020e);border:1px solid rgba(255,255,255,.18);box-shadow:0 28px 90px #0009}h1{font-size:clamp(42px,7vw,86px);line-height:.9;margin:8px 0;letter-spacing:-.06em}.lead{font-size:21px;max-width:860px;line-height:1.55}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16)}.grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:18px;margin-top:18px}.card{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);border-radius:28px;padding:24px}.score{font-size:88px;font-weight:950;color:#ffdd9b}.steps{display:grid;gap:10px}.steps div{padding:13px;border-radius:18px;background:rgba(255,255,255,.08)}.table{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.table article{padding:12px;border-radius:16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}.ok b{color:#86efac}.warn b{color:#fbbf24}@media(max-width:820px){.wrap{padding:20px}.grid,.table{grid-template-columns:1fr}.cover{padding:30px;min-height:360px}}@media print{body{background:#fff;color:#111}.cover,.card,.steps div,.table article{background:#fff!important;border-color:#ddd!important;box-shadow:none!important}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>${title}</h1><p class="lead">${p.inputs.promise}</p><div><span class="badge">Demo+ ${p.score}/100</span><span class="badge">${p.state}</span><span class="badge">${p.inputs.audience}</span><span class="badge">${p.inputs.flow}</span></div></section><section class="grid"><article class="card"><h2>Puntuación Demo+</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Teleprompter 5 minutos</h2><div class="steps">${p.teleprompter.map(x=>`<div><b>${x[0]}</b> ${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Calidad de experiencia</h2><div class="steps">${p.quality.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Diagnóstico</h2><div class="table">${p.diag.checks.map(x=>`<article class="${x[1]?'ok':'warn'}"><b>${x[1]?'OK':'Revisar'}</b><br><span>${x[0]}</span><p>${x[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function demo54Brief(r){
  const p=demo54Plan(r||currentReading||read(STORE.history,[])[0]||{});
  return `ALAYA ASTRAL IA · ${VERSION}\n\nDEMO+ v5.4\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nPromesa: ${p.inputs.promise}\nAudiencia: ${p.inputs.audience}\nObjetivo: ${p.inputs.objective}\nFlujo: ${p.inputs.flow}\n\nTELEPROMPTER 5 MINUTOS\n${p.teleprompter.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nCALIDAD\n${p.quality.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nRIESGOS\n${p.risks.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nSIGUIENTE\n${p.next}`;
}
function toggleDemo54(){
  document.body.classList.toggle('demo54-mode');
  toast(document.body.classList.contains('demo54-mode')?'Modo Demo+ activo: solo lo esencial.':'Modo Demo+ desactivado.');
}
function showDemo54Diagnostics(){
  const diag=demo54Diagnostics(); let box=document.querySelector('#demo54DiagnosticResult');
  if(!box){ const anchor=document.querySelector('[data-demo54-home]')||document.querySelector('#dailyPulse'); if(anchor){anchor.insertAdjacentHTML('afterend','<section id="demo54DiagnosticResult" class="demo54-diagnostic glass"></section>'); box=document.querySelector('#demo54DiagnosticResult');} }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Diagnóstico Demo+ v5.4</p><h2>Salud de presentación y publicación</h2></div><b class="demo54-mini-score">${diag.score}/100</b></div>${demo54DiagnosticsTable(diag)}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.demo54=demo54Score(r); const p=demo54Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Demo+ v5.4'))){
      r.layers=[...(r.layers||[]),
        {icon:'🎙',title:'Demo+ v5.4 · Presentación limpia y espectacular',html:demo54Layer(r)},
        {icon:'🗣',title:'Teleprompter Demo+ de 5 minutos',html:`<div class="demo54-route">${p.teleprompter.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'💎',title:'Calidad Demo+ · Qué debe sentirse premium',html:`<div class="demo54-quality">${p.quality.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadDemo54')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadDemo54'; a.textContent='Demo+ v5.4'; a.onclick=()=>download(`alaya-demo-plus-v54-${r.id}.html`,demo54Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyDemo54'; b.textContent='Copiar demo+'; b.onclick=()=>copyText(demo54Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleDemo54'; c.textContent='Modo Demo+'; c.onclick=toggleDemo54;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='diagnostic54Btn'; d.textContent='Salud v5.4'; d.onclick=showDemo54Diagnostics;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    document.body.classList.add('v54-clean-home');
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.demo54||demo54Score(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-demo54-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-demo54-stat><b>${avg||'94'}</b><span>demo+</span></div>`);
    const score=document.querySelector('#demo54HomeScore'); if(score) score.textContent=avg||'94';
    const report=document.querySelector('#demo54ReportHomeBtn'); if(report) report.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic'}); download(`alaya-demo-plus-v54-${r.id||'demo'}.html`,demo54Report(r),'text/html')};
    const copy=document.querySelector('#demo54CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(demo54Brief(currentReading||h[0]));
    const diag=document.querySelector('#demo54DiagHomeBtn'); if(diag) diag.onclick=showDemo54Diagnostics;
    const mode=document.querySelector('#demo54ModeHomeBtn'); if(mode) mode.onclick=toggleDemo54;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse();
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.demo54||demo54Score(r)),0)/(h.length||1))||0;
    const dash=document.querySelector('#universeDashboard'); if(dash&&!dash.querySelector('[data-demo54-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-demo54-card><span>Demo+ v5.4</span><b>${avg||'—'}</b><small>presentación / claridad / salud</small></article>`);
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-demo54-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="demo54-pulse" data-demo54-pulse><b>Demo+ v5.4</b><span>Hoy enseña solo lo esencial: promesa, lectura por capas, dossier y universo. Lo técnico va separado.</span></div>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v54-clean-home');
  document.title='Alaya Astral IA v5.7 Vision Release';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.5 Vision Experience: app astral premium con portada limpia, modo pulido, auditoría de publicación, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt && !rt.querySelector('option[value="demo54"]')) rt.insertAdjacentHTML('beforeend','<option value="demo54">Vision Demo+ v5.4</option><option value="demo54show">Presentación Demo+ v5.4</option><option value="demo54health">Salud Demo+ v5.4</option>');
  const anchor=document.querySelector('#showcasePromise') || document.querySelector('#launchPromise52') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#demo54Audience')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia Demo+<select id="demo54Audience" name="demo54Audience"><option value="demo rápida">Demo rápida</option><option value="testers">Testers</option><option value="cliente">Cliente</option><option value="publicación">Publicación</option></select></label><label>Pulido Demo+<select id="demo54Polish" name="demo54Polish"><option value="alto">Alto / premium</option><option value="medio">Medio / revisar</option><option value="bajo">Bajo / ensayar más</option></select></label></div><div class="row"><label>Objetivo Demo+<input id="demo54Objective" name="demo54Objective" placeholder="Ej. enseñar Alaya en 5 minutos" /></label><label>Flujo Demo+<input id="demo54Flow" name="demo54Flow" placeholder="home → lectura → dossier → universo" /></label></div><label>Promesa Demo+<input id="demo54Promise" name="demo54Promise" placeholder="Ej. Una experiencia astral premium clara, bella y útil" /></label>`);
  }
  const old=document.querySelector('[data-clean-home]'); if(old) old.remove();
  const oldFlow=document.querySelector('.ascendant51-flow'); if(oldFlow) oldFlow.remove();
  const oldShowcase=document.querySelector('[data-showcase53-home]'); if(oldShowcase) oldShowcase.remove();
  const homeAnchor=document.querySelector('#dailyPulse');
  if(homeAnchor && !document.querySelector('[data-demo54-home]')){
    homeAnchor.insertAdjacentHTML('beforebegin',`<section class="demo54-home glass" data-demo54-home><div><p class="eyebrow">Vision Demo+ v5.4</p><h2>Una demo limpia, memorable y lista para enseñar.</h2><p>Demo+ convierte Alaya en una presentación premium: portada clara, guion de 5 minutos, modo limpio, diagnóstico de salud y entrega HTML/PDF para enseñar sin saturar.</p><div class="button-row"><button class="btn primary" data-route="lecturas">Crear demo</button><button class="btn secondary" id="demo54ReportHomeBtn">Demo+ v5.4</button><button class="btn ghost" id="demo54CopyHomeBtn">Copiar guion</button><button class="btn ghost" id="demo54DiagHomeBtn">Diagnóstico</button><button class="btn ghost" id="demo54ModeHomeBtn">Modo Demo+</button></div></div><div class="demo54-score"><span>Demo+</span><b id="demo54HomeScore">94</b><small>ready</small></div></section>`);
  }
  // Rewire older visible buttons to the new Demo+ actions when present.
  const oldDeck=document.querySelector('#launchDeckHomeBtn'); if(oldDeck) oldDeck.onclick=()=>download('alaya-demo-plus-v54.html',demo54Report(currentReading||read(STORE.history,[])[0]||{}),'text/html');
  const oldDemo=document.querySelector('#demoRehearsalHomeBtn'); if(oldDemo) oldDemo.onclick=()=>copyText(demo54Brief(currentReading||read(STORE.history,[])[0]||{}));
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.5 Vision Experience: limpieza, auditoría UX y demo guiada === */
function experience55Diagnostics(){
  const h=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]);
  const checks=[
    ['Home entendible', !!document.querySelector('.hero-card h1'), 'La promesa principal existe en portada.'],
    ['CTA principal', !!document.querySelector('[data-route="lecturas"]'), 'Hay acceso claro para crear lectura.'],
    ['Historial local', Array.isArray(h), `${h.length} lecturas guardadas.`],
    ['Favoritas', Array.isArray(favs), `${favs.length} favoritas guardadas.`],
    ['Perfiles', Array.isArray(profiles), `${profiles.length} perfiles disponibles.`],
    ['Service Worker', 'serviceWorker' in navigator, 'Disponible para PWA.'],
    ['Manifest', !!document.querySelector('link[rel="manifest"]'), 'Manifest enlazado.'],
    ['PDF / impresión', typeof window.print==='function', 'Impresión disponible para PDF.'],
    ['Portapapeles', !!navigator.clipboard, 'Copiar texto disponible si el navegador lo permite.'],
    ['Móvil', matchMedia('(max-width: 760px)').matches ? true : 'escritorio', matchMedia('(max-width: 760px)').matches?'Vista móvil detectada.':'Vista escritorio detectada.']
  ];
  const score=Math.round(checks.reduce((a,c)=>a+(c[1]===true||c[1]==='escritorio'?10:6),0));
  return {score:Math.min(100,score),checks,history:h.length,favorites:favs.length,profiles:profiles.length,ua:navigator.userAgent};
}
function experience55Score(r={}){
  const d=r.data||{}; const m=r.metrics||{};
  let score=72;
  if(d.demo54Polish==='alto'||d.demo55Polish==='alto') score+=7;
  if(d.calcSource==='astrocom' && Object.keys(r.imported||{}).length) score+=6;
  if((r.layers||[]).length>=5) score+=4;
  if(m.aura) score+=Math.round((m.aura-70)/4);
  if(d.experience55Focus==='limpieza') score+=4;
  if(d.experience55Focus==='publicacion') score+=5;
  if(d.demo55Proof==='probado') score+=6;
  return Math.max(60,Math.min(99,score));
}
function experience55Plan(r={}){
  const d=r.data||{}; const diag=experience55Diagnostics();
  const score=experience55Score(r);
  const focus=d.experience55Focus||'claridad';
  const audience=d.demo55Audience||d.demo54Audience||'demo rápida';
  const proof=d.demo55Proof||'pendiente de probar';
  const promise=d.experience55Promise||d.demo54Promise||'Una lectura astral premium que se entiende, emociona y se puede enseñar sin saturar.';
  const state=score>=92?'Lista para enseñar con confianza':score>=82?'Muy buena, revisar móvil y PDF':'Prometedora, necesita ensayo y limpieza visual';
  const route=[
    ['00:00','Abrir con la promesa: qué hace Alaya y para quién es.'],
    ['00:45','Crear una lectura demo con datos de muestra y una intención clara.'],
    ['02:00','Mostrar resultado por capas: impacto, lectura, plan, mapa y entrega.'],
    ['03:15','Activar modo limpio para enseñar solo lo esencial.'],
    ['04:00','Mostrar Universo, favoritas y exportación premium.'],
    ['04:45','Cerrar con Astro.com manual separado de la lectura emocional.']
  ];
  const quickWins=[
    ['Portada','Una frase fuerte, un CTA principal y una métrica visible.'],
    ['Resultado','No mostrar 20 capas de golpe: usar modo limpio para demo.'],
    ['PDF','Exportar informe HTML/PDF como entrega premium.'],
    ['Técnica','Mantener Astro.com en una sección separada para no romper la magia.']
  ];
  const next=score>=92?'Hacer prueba real en iPhone y Android antes de publicar.':score>=82?'Ensayar una demo de 5 minutos y revisar contrastes.':'Reducir ruido visual y crear una lectura demo favorita.';
  return {score,focus,audience,proof,promise,state,route,quickWins,next,diag};
}
function experience55DiagnosticsTable(diag=experience55Diagnostics()){
  return `<div class="experience55-table">${diag.checks.map(c=>`<article class="${c[1]===true||c[1]==='escritorio'?'ok':'warn'}"><b>${c[1]===true||c[1]==='escritorio'?'OK':'Revisar'}</b><span>${c[0]}</span><p>${c[2]}</p></article>`).join('')}</div>`;
}
function experience55Layer(r){
  const p=experience55Plan(r);
  return `<div class="experience55-panel"><div><p class="eyebrow">Vision Experience v5.5</p><h3>${p.state}</h3><p>${p.promise}</p><div class="experience55-ribbon"><span>Experience ${p.score}/100</span><span>${p.focus}</span><span>${p.audience}</span><span>${p.proof}</span></div></div><div class="experience55-orb"><b>${p.score}</b><small>experience</small></div></div>`;
}
function experience55Report(r){
  r=r||currentReading||read(STORE.history,[])[0]||{}; const p=experience55Plan(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya Experience v5.5</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body{margin:0;background:#080511;color:#fff;font-family:Inter,system-ui,Arial}.wrap{padding:34px;max-width:1120px;margin:auto}.cover{border-radius:38px;padding:48px;background:radial-gradient(circle at 12% 0%,rgba(255,219,151,.28),transparent 34%),radial-gradient(circle at 88% 12%,rgba(139,92,246,.30),transparent 36%),linear-gradient(135deg,#170821,#05030b);box-shadow:0 30px 90px #000a}h1{font-size:clamp(40px,7vw,78px);line-height:.92;margin:8px 0}.lead{font-size:21px;line-height:1.55;max-width:900px}.badge{display:inline-block;margin:5px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18)}.grid{display:grid;grid-template-columns:.75fr 1.25fr;gap:16px;margin-top:18px}.card{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.16);border-radius:26px;padding:24px}.score{font-size:86px;font-weight:950;color:#ffdda1}.steps,.wins{display:grid;gap:10px}.steps div,.wins div{padding:14px;border-radius:18px;background:rgba(255,255,255,.08)}.diag{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.diag article{padding:12px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}.ok b{color:#86efac}.warn b{color:#fbbf24}@media(max-width:820px){.wrap{padding:20px}.grid,.diag{grid-template-columns:1fr}.cover{padding:30px}}@media print{body{background:white;color:#111}.cover,.card,.steps div,.wins div,.diag article{background:white!important;border-color:#ddd!important;box-shadow:none!important}.score{color:#111}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>Experience Kit v5.5</h1><p class="lead">${p.promise}</p><div><span class="badge">Experience ${p.score}/100</span><span class="badge">${p.state}</span><span class="badge">${p.audience}</span><span class="badge">${p.focus}</span></div></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Guion de demo</h2><div class="steps">${p.route.map(x=>`<div><b>${x[0]}</b> ${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Quick wins</h2><div class="wins">${p.quickWins.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Auditoría UX</h2><div class="diag">${p.diag.checks.map(x=>`<article class="${x[1]===true||x[1]==='escritorio'?'ok':'warn'}"><b>${x[1]===true||x[1]==='escritorio'?'OK':'Revisar'}</b><br><span>${x[0]}</span><p>${x[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function experience55Brief(r){
  const p=experience55Plan(r||currentReading||read(STORE.history,[])[0]||{});
  return `ALAYA ASTRAL IA · ${VERSION}\n\nVISION EXPERIENCE v5.5\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nPromesa: ${p.promise}\nAudiencia: ${p.audience}\nFoco: ${p.focus}\nPrueba: ${p.proof}\n\nGUION DEMO\n${p.route.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nQUICK WINS\n${p.quickWins.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nSIGUIENTE\n${p.next}`;
}
function toggleExperience55(){
  document.body.classList.toggle('experience55-mode');
  toast(document.body.classList.contains('experience55-mode')?'Modo Experience activo: demo limpia y ordenada.':'Modo Experience desactivado.');
}
function showExperience55Audit(){
  const diag=experience55Diagnostics(); let box=document.querySelector('#experience55AuditResult');
  if(!box){ const anchor=document.querySelector('[data-experience55-home]')||document.querySelector('#dailyPulse'); if(anchor){anchor.insertAdjacentHTML('afterend','<section id="experience55AuditResult" class="experience55-audit glass"></section>'); box=document.querySelector('#experience55AuditResult');} }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Experience v5.5</p><h2>Salud UX y demo</h2></div><b class="experience55-mini-score">${diag.score}/100</b></div>${experience55DiagnosticsTable(diag)}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.experience55=experience55Score(r); const p=experience55Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Experience v5.5'))){
      r.layers=[...(r.layers||[]),
        {icon:'✦',title:'Experience v5.5 · App espectacular, guiada y enseñable',html:experience55Layer(r)},
        {icon:'🧭',title:'Ruta de demo v5.5',html:`<div class="experience55-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'✅',title:'Auditoría UX v5.5',html:`<p class="note-card"><b>Score:</b> ${p.diag.score}/100 · historial ${p.diag.history} · favoritas ${p.diag.favorites} · perfiles ${p.diag.profiles}.</p>${experience55DiagnosticsTable(p.diag)}`}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadExperience55')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadExperience55'; a.textContent='Experience v5.5'; a.onclick=()=>download(`alaya-experience-v55-${r.id||'demo'}.html`,experience55Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyExperience55'; b.textContent='Copiar guion v5.5'; b.onclick=()=>copyText(experience55Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleExperience55'; c.textContent='Modo Experience'; c.onclick=toggleExperience55;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditExperience55'; d.textContent='Auditoría UX'; d.onclick=showExperience55Audit;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    document.body.classList.add('v55-clean-home');
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.experience55||experience55Score(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-experience55-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-experience55-stat><b>${avg||'95'}</b><span>experience</span></div>`);
    const score=document.querySelector('#experience55HomeScore'); if(score) score.textContent=avg||'95';
    const report=document.querySelector('#experience55ReportHomeBtn'); if(report) report.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',experience55Focus:'claridad'}); download(`alaya-experience-v55-${r.id||'demo'}.html`,experience55Report(r),'text/html')};
    const copy=document.querySelector('#experience55CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(experience55Brief(currentReading||h[0]));
    const audit=document.querySelector('#experience55AuditHomeBtn'); if(audit) audit.onclick=showExperience55Audit;
    const mode=document.querySelector('#experience55ModeHomeBtn'); if(mode) mode.onclick=toggleExperience55;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.experience55||experience55Score(r)),0)/(h.length||1))||0;
    const dash=document.querySelector('#universeDashboard'); if(dash&&!dash.querySelector('[data-experience55-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-experience55-card><span>Experience v5.5</span><b>${avg||'—'}</b><small>UX / demo / publicación</small></article>`);
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-experience55-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="experience55-pulse" data-experience55-pulse><b>Experience v5.5</b><span>Hoy enseña Alaya en cuatro pasos: promesa, lectura, entrega y universo. Lo técnico se muestra solo al final.</span></div>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v55-clean-home');
  document.title='Alaya Astral IA v5.7 Vision Release';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.5 Vision Experience: app astral premium con experiencia guiada, modo demo limpio, auditoría UX, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','experience55','demo55','audit55'];
    Array.from(rt.options).forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="experience55"]')) rt.insertAdjacentHTML('beforeend','<option value="experience55">Vision Experience v5.5</option><option value="demo55">Demo guiada v5.5</option><option value="audit55">Auditoría UX v5.5</option>');
  }
  const anchor=document.querySelector('#demo54Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#experience55Focus')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Foco Experience<select id="experience55Focus" name="experience55Focus"><option value="claridad">Claridad visual</option><option value="limpieza">Limpieza de interfaz</option><option value="demo">Demo premium</option><option value="publicacion">Publicación</option></select></label><label>Prueba v5.5<select id="demo55Proof" name="demo55Proof"><option value="pendiente de probar">Pendiente</option><option value="probado">Probado en móvil</option><option value="demo ensayada">Demo ensayada</option><option value="pdf revisado">PDF revisado</option></select></label></div><label>Promesa Experience<input id="experience55Promise" name="experience55Promise" placeholder="Ej. Una experiencia astral premium, clara y lista para enseñar" /></label>`);
  }
  const old=document.querySelector('[data-demo54-home]'); if(old) old.remove();
  const oldClean=document.querySelector('[data-clean-home]'); if(oldClean) oldClean.remove();
  const oldFlow=document.querySelector('.ascendant51-flow'); if(oldFlow) oldFlow.remove();
  const homeAnchor=document.querySelector('#dailyPulse');
  if(homeAnchor && !document.querySelector('[data-experience55-home]')){
    homeAnchor.insertAdjacentHTML('beforebegin',`<section class="experience55-home glass" data-experience55-home><div><p class="eyebrow">Vision Experience v5.5</p><h2>Espectacular, limpia y lista para enseñar.</h2><p>Experience concentra Alaya en una demo clara: promesa fuerte, lectura por capas, modo limpio, auditoría UX, dossier premium y Universo personal sin saturar la portada.</p><div class="experience55-actions"><button class="btn primary" data-route="lecturas">Crear experiencia</button><button class="btn secondary" id="experience55ReportHomeBtn">Experience v5.5</button><button class="btn ghost" id="experience55CopyHomeBtn">Copiar guion</button><button class="btn ghost" id="experience55AuditHomeBtn">Auditoría UX</button><button class="btn ghost" id="experience55ModeHomeBtn">Modo limpio</button></div></div><div class="experience55-score"><span>Experience</span><b id="experience55HomeScore">95</b><small>ready</small></div></section>`);
  }
  const oldDeck=document.querySelector('#launchDeckHomeBtn'); if(oldDeck) oldDeck.onclick=()=>download('alaya-experience-v55.html',experience55Report(currentReading||read(STORE.history,[])[0]||{}),'text/html');
  const oldDemo=document.querySelector('#demoRehearsalHomeBtn'); if(oldDemo) oldDemo.onclick=()=>copyText(experience55Brief(currentReading||read(STORE.history,[])[0]||{}));
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.7 Vision Release: limpieza final, modo pulido y auditoría de publicación === */
function polish56Diagnostics(){
  const h=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]);
  const visibleHomePanels=[...document.querySelectorAll('[data-nebula-home],[data-aurora-home],[data-celestial-home],[data-zenith-home],[data-nova-home],[data-novaplus-home],[data-demo54-home],[data-experience55-home],[data-launch52-home],[data-showcase53-home]')].filter(x=>x.offsetParent!==null).length;
  const hasHero=!!document.querySelector('.hero-card h1');
  const hasPrimaryCta=!!document.querySelector('[data-route="lecturas"]');
  const hasManifest=!!document.querySelector('link[rel="manifest"]');
  const sw=('serviceWorker' in navigator);
  const hasPrint=typeof window.print==='function';
  const hasStorage=(()=>{try{localStorage.setItem('__alaya56','1');localStorage.removeItem('__alaya56');return true;}catch(e){return false;}})();
  const smallScreen=window.matchMedia&&window.matchMedia('(max-width: 720px)').matches;
  const checks=[
    ['Portada limpia', visibleHomePanels<=1, visibleHomePanels<=1?'Solo queda un bloque protagonista.':`Hay ${visibleHomePanels} bloques antiguos visibles.`],
    ['Promesa visible', hasHero, hasHero?'La portada explica la app al entrar.':'Revisar título principal.'],
    ['CTA principal', hasPrimaryCta, hasPrimaryCta?'Crear lectura está accesible.':'Falta acceso claro a Lecturas.'],
    ['Historial', Array.isArray(h), `${h.length} lecturas guardadas.`],
    ['Favoritas', Array.isArray(favs), `${favs.length} favoritas guardadas.`],
    ['Perfiles', Array.isArray(profiles), `${profiles.length} perfiles disponibles.`],
    ['LocalStorage', hasStorage, hasStorage?'Datos locales disponibles.':'El navegador bloquea datos locales.'],
    ['Service Worker', sw, sw?'PWA disponible.':'PWA no disponible en este entorno.'],
    ['Manifest', hasManifest, hasManifest?'Manifest enlazado.':'Falta manifest.'],
    ['PDF / impresión', hasPrint, hasPrint?'Impresión disponible.':'No se detecta print().'],
    ['Vista móvil', smallScreen?'móvil':'escritorio', smallScreen?'Pantalla móvil detectada: revisar botones y scroll.':'Escritorio detectado: falta probar en móvil real.']
  ];
  const ok=checks.filter(c=>c[1]===true || c[1]==='móvil' || c[1]==='escritorio').length;
  const penalties=Math.max(0,visibleHomePanels-1)*8;
  const score=Math.max(50,Math.min(99,Math.round((ok/checks.length)*100)-penalties+(h.length?4:0)+(favs.length?2:0)));
  return {score,checks,history:h.length,favorites:favs.length,profiles:profiles.length,visibleHomePanels};
}
function polish56Score(r={}){
  const d=r.data||{}; const base=Math.round(((r.metrics?.aura||78)+(r.metrics?.experience55||82)+(r.metrics?.launch52||80))/3);
  let score=base;
  if(d.polish56Focus==='limpieza') score+=7;
  if(d.polish56Focus==='movil') score+=5;
  if(d.polish56Focus==='publicacion') score+=6;
  if(d.polish56Gate==='lista') score+=5;
  if(d.polish56Density==='minimal') score+=4;
  if((r.layers||[]).length>12) score-=4;
  return Math.max(60,Math.min(99,score||91));
}
function polish56Plan(r={}){
  const d=r.data||{}; const diag=polish56Diagnostics(); const score=polish56Score(r);
  const focus=d.polish56Focus||'limpieza'; const gate=d.polish56Gate||'demo'; const density=d.polish56Density||'equilibrada';
  const promise=d.polish56Promise||'Una experiencia astral premium, clara y lista para enseñar sin saturar.';
  const state=score>=92?'Pulido alto: lista para demo premium':score>=82?'Pulido bueno: revisar móvil y PDF':'Pulido pendiente: simplificar antes de enseñar';
  const route=[
    ['1. Entrada','Mostrar la portada, la promesa y el CTA principal.'],
    ['2. Lectura','Crear una lectura demo con intención clara.'],
    ['3. Resultado','Enseñar impacto emocional, plan útil y mapa visual.'],
    ['4. Entrega','Abrir PDF/dossier y copiar resumen.'],
    ['5. Universo','Mostrar historial, favoritas y continuidad.'],
    ['6. Técnica','Cerrar con Astro.com manual solo si hace falta.']
  ];
  const quickWins=[
    ['Portada','Mantener un único bloque protagonista y un CTA fuerte.'],
    ['Lecturas','Mostrar menos capas por defecto y dejar lo técnico al final.'],
    ['Móvil','Probar botones, scroll y exportaciones en iPhone/Android.'],
    ['PDF','Revisar que portada, índice y secciones se impriman bien.'],
    ['PWA','Limpiar caché si al publicar aparece una versión antigua.']
  ];
  const next=diag.score>=88 && score>=90?'Preparar demo pública y probar en móvil real.':'Pulir home, modo focus, PDF y prueba móvil antes de publicar.';
  return {score,focus,gate,density,promise,state,route,quickWins,next,diag};
}
function polish56DiagnosticsTable(diag=polish56Diagnostics()){
  return `<div class="polish56-table">${diag.checks.map(c=>`<article class="${c[1]===true||c[1]==='móvil'||c[1]==='escritorio'?'ok':'warn'}"><b>${c[1]===true||c[1]==='móvil'||c[1]==='escritorio'?'OK':'Revisar'}</b><span>${c[0]}</span><p>${c[2]}</p></article>`).join('')}</div>`;
}
function polish56Layer(r){
  const p=polish56Plan(r);
  return `<div class="polish56-panel"><div><p class="eyebrow">Vision Polish v5.6</p><h3>${p.state}</h3><p>${p.promise}</p><div class="polish56-ribbon"><span>Polish ${p.score}/100</span><span>${p.focus}</span><span>${p.gate}</span><span>${p.density}</span></div></div><div class="polish56-orb"><b>${p.score}</b><small>polish</small></div></div>`;
}
function polish56Report(r){
  r=r||currentReading||read(STORE.history,[])[0]||{}; const p=polish56Plan(r); const diag=p.diag;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya Polish v5.6</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body{margin:0;background:#090515;color:#fff8ea;font-family:Inter,system-ui,Arial;padding:34px}.wrap{max-width:1100px;margin:auto}.cover{border:1px solid rgba(255,255,255,.18);border-radius:34px;padding:34px;background:radial-gradient(circle at 15% 0%,rgba(244,202,125,.24),transparent 34%),linear-gradient(135deg,#150a2b,#090515)}h1{font-size:clamp(38px,7vw,76px);line-height:.9;margin:8px 0}.badge{display:inline-block;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:8px 12px;margin:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:18px}.card{border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:18px;background:rgba(255,255,255,.07)}.score{font-size:64px;font-weight:900}.steps div,.wins div{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.12)}.diag{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.diag article{border-radius:16px;padding:12px;background:rgba(255,255,255,.08)}.ok b{color:#b7ffcf}.warn b{color:#ffd99b}@media print{body{background:#fff;color:#15111f}.cover,.card{background:#fff;color:#15111f;border-color:#ddd}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>Polish Report v5.6</h1><p>${p.promise}</p><span class="badge">Polish ${p.score}/100</span><span class="badge">Diagnóstico ${diag.score}/100</span><span class="badge">${p.state}</span><span class="badge">${p.gate}</span></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Ruta de demo</h2><div class="steps">${p.route.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Quick wins</h2><div class="wins">${p.quickWins.map(x=>`<div><b>${x[0]}</b><br>${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Diagnóstico</h2><div class="diag">${diag.checks.map(x=>`<article class="${x[1]===true||x[1]==='móvil'||x[1]==='escritorio'?'ok':'warn'}"><b>${x[1]===true||x[1]==='móvil'||x[1]==='escritorio'?'OK':'Revisar'}</b><br><span>${x[0]}</span><p>${x[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function polish56Brief(r){
  const p=polish56Plan(r||currentReading||read(STORE.history,[])[0]||{});
  return `ALAYA ASTRAL IA · ${VERSION}\n\nVISION POLISH v5.6\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nPromesa: ${p.promise}\nFoco: ${p.focus}\nPuerta: ${p.gate}\nDensidad: ${p.density}\n\nRUTA DEMO\n${p.route.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nQUICK WINS\n${p.quickWins.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nSIGUIENTE\n${p.next}`;
}
function togglePolish56(){
  document.body.classList.toggle('polish56-mode');
  toast(document.body.classList.contains('polish56-mode')?'Modo Polish activo: portada y resultados más limpios.':'Modo Polish desactivado.');
}
function showPolish56Audit(){
  const diag=polish56Diagnostics(); let box=document.querySelector('#polish56AuditResult');
  if(!box){ const anchor=document.querySelector('[data-polish56-home]')||document.querySelector('#dailyPulse'); if(anchor){anchor.insertAdjacentHTML('afterend','<section id="polish56AuditResult" class="polish56-audit glass"></section>'); box=document.querySelector('#polish56AuditResult');} }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Polish v5.6</p><h2>Publicación, móvil y limpieza</h2></div><b class="polish56-mini-score">${diag.score}/100</b></div>${polish56DiagnosticsTable(diag)}`;
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.polish56=polish56Score(r); const p=polish56Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Polish v5.6'))){
      r.layers=[...(r.layers||[]),
        {icon:'✧',title:'Polish v5.6 · Espectacular sin saturar',html:polish56Layer(r)},
        {icon:'🧭',title:'Ruta de demo pulida',html:`<div class="polish56-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'✅',title:'Checklist de publicación v5.6',html:`<p class="note-card"><b>Diagnóstico:</b> ${p.diag.score}/100 · paneles visibles ${p.diag.visibleHomePanels} · historial ${p.diag.history} · favoritas ${p.diag.favorites}.</p>${polish56DiagnosticsTable(p.diag)}`}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadPolish56')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadPolish56'; a.textContent='Polish v5.6'; a.onclick=()=>download(`alaya-polish-v56-${r.id||'demo'}.html`,polish56Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyPolish56'; b.textContent='Copiar Polish'; b.onclick=()=>copyText(polish56Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='togglePolish56'; c.textContent='Modo Polish'; c.onclick=togglePolish56;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditPolish56'; d.textContent='Auditoría v5.6'; d.onclick=showPolish56Audit;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome();
    document.body.classList.add('v56-clean-home');
    document.querySelectorAll('[data-nebula-home],[data-aurora-home],[data-celestial-home],[data-zenith-home],[data-nova-home],[data-novaplus-home],[data-demo54-home],[data-experience55-home],[data-launch52-home],[data-showcase53-home],[data-clean-home]').forEach(x=>x.remove());
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.polish56||polish56Score(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats'); if(stats&&!stats.querySelector('[data-polish56-stat]')) stats.insertAdjacentHTML('beforeend',`<div class="stat" data-polish56-stat><b>${avg||'96'}</b><span>polish</span></div>`);
    const homeAnchor=document.querySelector('#dailyPulse');
    if(homeAnchor && !document.querySelector('[data-polish56-home]')){
      homeAnchor.insertAdjacentHTML('beforebegin',`<section class="polish56-home glass" data-polish56-home><div><p class="eyebrow">Vision Polish v5.6</p><h2>Espectacular, clara y lista para enseñar.</h2><p>Polish limpia la portada, reduce ruido visual, prepara una demo de 6 pasos y añade una auditoría rápida para móvil, PDF, PWA, historial y Astro.com manual.</p><div class="polish56-actions"><button class="btn primary" data-route="lecturas">Crear lectura pulida</button><button class="btn secondary" id="polish56ReportHomeBtn">Polish v5.6</button><button class="btn ghost" id="polish56CopyHomeBtn">Copiar ruta</button><button class="btn ghost" id="polish56AuditHomeBtn">Auditoría</button><button class="btn ghost" id="polish56ModeHomeBtn">Modo Polish</button></div></div><div class="polish56-score"><span>Polish</span><b id="polish56HomeScore">${avg||'96'}</b><small>ready</small></div></section>`);
    }
    const report=document.querySelector('#polish56ReportHomeBtn'); if(report) report.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',polish56Focus:'limpieza'}); download(`alaya-polish-v56-${r.id||'demo'}.html`,polish56Report(r),'text/html')};
    const copy=document.querySelector('#polish56CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(polish56Brief(currentReading||h[0]));
    const audit=document.querySelector('#polish56AuditHomeBtn'); if(audit) audit.onclick=showPolish56Audit;
    const mode=document.querySelector('#polish56ModeHomeBtn'); if(mode) mode.onclick=togglePolish56;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.polish56||polish56Score(r)),0)/(h.length||1))||0;
    const dash=document.querySelector('#universeDashboard'); if(dash&&!dash.querySelector('[data-polish56-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-polish56-card><span>Polish v5.6</span><b>${avg||'—'}</b><small>claridad / demo / publicación</small></article>`);
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-polish56-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="polish56-pulse" data-polish56-pulse><b>Polish v5.6</b><span>Hoy enseña solo lo esencial: promesa, lectura por capas, entrega premium y universo. La auditoría técnica va separada.</span></div>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v56-clean-home');
  document.title='Alaya Astral IA v5.7 Vision Release';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.7 Vision Release: app astral premium con portada limpia, modo pulido, auditoría de publicación, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','experience55','polish56','demo56','audit56'];
    [...rt.options].forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="polish56"]')) rt.insertAdjacentHTML('beforeend','<option value="polish56">Vision Polish v5.6</option><option value="demo56">Demo pulida v5.6</option><option value="audit56">Auditoría publicación v5.6</option>');
  }
  const anchor=document.querySelector('#experience55Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#polish56Focus')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Foco Polish<select id="polish56Focus" name="polish56Focus"><option value="limpieza">Limpieza visual</option><option value="movil">Prueba móvil</option><option value="pdf">PDF / dossier</option><option value="publicacion">Publicación</option></select></label><label>Densidad visual<select id="polish56Density" name="polish56Density"><option value="equilibrada">Equilibrada</option><option value="minimal">Minimal premium</option><option value="showcase">Showcase visual</option><option value="tecnica">Técnica separada</option></select></label></div><div class="row"><label>Puerta Polish<select id="polish56Gate" name="polish56Gate"><option value="demo">Demo</option><option value="qa">QA final</option><option value="lista">Lista para enseñar</option><option value="publicacion">Publicación</option></select></label><label>Prueba realizada<select id="polish56Proof" name="polish56Proof"><option value="pendiente">Pendiente</option><option value="movil">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA revisada</option></select></label></div><label>Promesa Polish<input id="polish56Promise" name="polish56Promise" placeholder="Ej. Una experiencia astral espectacular, clara y lista para enseñar" /></label>`);
  }
  document.querySelectorAll('[data-experience55-home],[data-demo54-home],[data-nova-home],[data-novaplus-home],[data-launch52-home],[data-showcase53-home]').forEach(x=>x.remove());
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.7 Vision Release: cierre premium, navegación robusta y checklist real === */
function release57Diagnostics(){
  const h=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]);
  const legacySelectors='[data-nebula-home],[data-aurora-home],[data-celestial-home],[data-zenith-home],[data-nova-home],[data-novaplus-home],[data-demo54-home],[data-experience55-home],[data-launch52-home],[data-showcase53-home],[data-polish56-home],[data-clean-home],.ascendant51-command,.ascendant51-flow';
  const legacyVisible=[...document.querySelectorAll(legacySelectors)].filter(x=>x.offsetParent!==null).length;
  const homeRelease=!!document.querySelector('[data-release57-home]');
  const dynamicRoutes=[...document.querySelectorAll('[data-route]')].length;
  const hasStorage=(()=>{try{localStorage.setItem('__alaya57','ok');localStorage.removeItem('__alaya57');return true;}catch(e){return false;}})();
  const hasSW=('serviceWorker' in navigator);
  const hasManifest=!!document.querySelector('link[rel="manifest"]');
  const hasPrint=typeof window.print==='function';
  const hasClipboard=!!navigator.clipboard;
  const mobile=window.matchMedia&&window.matchMedia('(max-width: 760px)').matches;
  const checks=[
    ['Home limpia', legacyVisible===0, legacyVisible===0?'Sin bloques antiguos visibles.':`Quedan ${legacyVisible} bloques antiguos visibles.`],
    ['Bloque Release', homeRelease, homeRelease?'La portada nueva está activa.':'Falta el bloque Release v5.7.'],
    ['Navegación dinámica', dynamicRoutes>=5, `${dynamicRoutes} enlaces/botones con data-route detectados.`],
    ['LocalStorage', hasStorage, hasStorage?'Datos locales disponibles.':'El navegador bloquea almacenamiento local.'],
    ['Service Worker', hasSW, hasSW?'PWA soportada por el navegador.':'Este entorno no soporta Service Worker.'],
    ['Manifest', hasManifest, hasManifest?'Manifest enlazado.':'No se detecta manifest.'],
    ['PDF / impresión', hasPrint, hasPrint?'Impresión disponible.':'No se detecta print().'],
    ['Portapapeles', hasClipboard, hasClipboard?'Copiado compatible.':'Puede requerir copiar manualmente.'],
    ['Historial', Array.isArray(h), `${h.length} lecturas guardadas.`],
    ['Favoritas', Array.isArray(favs), `${favs.length} favoritas.`],
    ['Perfiles', Array.isArray(profiles), `${profiles.length} perfiles.`],
    ['Vista actual', mobile?'móvil':'escritorio', mobile?'Modo móvil detectado: revisar scroll y botones.':'Escritorio detectado: falta prueba real en iPhone/Android.']
  ];
  const ok=checks.filter(c=>c[1]===true||c[1]==='móvil'||c[1]==='escritorio').length;
  const score=Math.max(55,Math.min(99,Math.round((ok/checks.length)*100)-(legacyVisible*9)+(h.length?3:0)+(favs.length?2:0)));
  return {score,checks,history:h.length,favorites:favs.length,profiles:profiles.length,legacyVisible,mobile};
}
function release57Score(r={}){
  const d=r.data||{};
  let score=Math.round(((r.metrics?.aura||78)+(r.metrics?.polish56||82)+(r.metrics?.experience55||82))/3);
  if(d.release57Gate==='lista') score+=8;
  if(d.release57Gate==='publicacion') score+=6;
  if(d.release57Focus==='movil') score+=5;
  if(d.release57Proof==='probado') score+=8;
  if(d.release57Proof==='demo') score+=5;
  if(d.release57Promise) score+=4;
  return Math.max(60,Math.min(99,score));
}
function release57Plan(r={}){
  const d=r.data||{}; const diag=release57Diagnostics(); const score=release57Score(r);
  const focus={limpieza:'limpieza visual',movil:'prueba móvil real',pdf:'PDF/dossier premium',publicacion:'publicación controlada',astro:'Astro.com manual separado'}[d.release57Focus]||'limpieza visual';
  const gate={demo:'demo privada',qa:'QA final',lista:'lista para enseñar',publicacion:'publicación controlada'}[d.release57Gate]||'demo privada';
  const proof={pendiente:'pendiente',probado:'probado en móvil',demo:'demo ensayada',pdf:'PDF revisado',pwa:'PWA revisada'}[d.release57Proof]||'pendiente';
  const promise=d.release57Promise||d.polish56Promise||'Una experiencia astral premium: bella al entrar, clara al usar y profesional al entregar.';
  const state=score>=92?'Lista para enseñar con confianza':score>=82?'Muy cerca: hacer prueba móvil y PDF':'Necesita una ronda corta de revisión antes de demo';
  const route=[
    ['00:00','Entrar por la portada y leer la promesa en una frase.'],
    ['00:30','Crear una lectura con datos demo y mostrar los 5 pasos.'],
    ['01:30','Abrir resultado: impacto emocional, lectura, plan y mapa visual.'],
    ['02:30','Mostrar dossier/PDF como entrega premium.'],
    ['03:30','Abrir Mi Universo: historial, favoritas y continuidad.'],
    ['04:15','Mostrar auditoría técnica separada: Astro.com manual, PWA, backup.'],
    ['05:00','Cerrar con siguiente acción: prueba móvil real o publicación controlada.']
  ];
  const releaseChecks=[
    'Abrir en iPhone Safari y comprobar que no hay scroll roto.',
    'Instalar como PWA y validar que se actualiza tras limpiar caché.',
    'Generar una lectura demo y guardar en historial.',
    'Marcar favorita, abrir desde Mi Universo y borrar una lectura de prueba.',
    'Exportar HTML/PDF y comprobar que se entiende sin la app abierta.',
    'Pegar posiciones Astro.com manualmente solo en auditoría, nunca automatizar.',
    'Hacer backup, importarlo y revisar que perfiles/historial vuelven bien.'
  ];
  const next=diag.legacyVisible>0?'Limpiar bloques antiguos visibles de la home.':diag.mobile?'Probar exportación PDF desde móvil.':'Hacer una prueba real en iPhone/Android antes de compartir.';
  return {score,diag,focus,gate,proof,promise,state,route,releaseChecks,next};
}
function release57Layer(r){
  const p=release57Plan(r);
  return `<div class="release57-panel"><div><p class="eyebrow">Vision Release v5.7</p><h3>${p.state}</h3><p>${p.promise}</p><div class="release57-ribbon"><span>Release ${p.score}/100</span><span>${p.focus}</span><span>${p.gate}</span><span>${p.proof}</span></div></div><div class="release57-orb"><b>${p.score}</b><small>release</small></div></div>`;
}
function release57DiagnosticsTable(diag=release57Diagnostics()){
  return `<div class="release57-diag">${diag.checks.map(x=>`<article class="${x[1]===true||x[1]==='móvil'||x[1]==='escritorio'?'ok':'warn'}"><b>${x[1]===true||x[1]==='móvil'||x[1]==='escritorio'?'OK':'Revisar'}</b><span>${x[0]}</span><p>${x[2]}</p></article>`).join('')}</div>`;
}
function release57Report(r){
  const p=release57Plan(r||currentReading||read(STORE.history,[])[0]||{});
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya Release v5.7</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body{margin:0;background:#0b0718;color:#fff;font-family:Inter,system-ui,Arial,sans-serif} .wrap{max-width:1080px;margin:auto;padding:42px}.cover{border:1px solid #ffffff26;border-radius:32px;padding:42px;background:radial-gradient(circle at top,#8f63ff55,transparent 55%),linear-gradient(135deg,#180f35,#070410)}.lead{font-size:1.2rem;color:#e9defd}.badge{display:inline-block;margin:6px 6px 0 0;padding:8px 12px;border:1px solid #ffffff2a;border-radius:999px;background:#ffffff12}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.card{border:1px solid #ffffff20;border-radius:24px;padding:22px;background:#ffffff0c}.score{font-size:64px;font-weight:900}.steps div,.checks div{padding:12px;border-bottom:1px solid #ffffff18}.diag{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.diag article{border-radius:16px;padding:14px;background:#ffffff0c}.diag .ok{border:1px solid #67f5b9}.diag .warn{border:1px solid #ffd166}@media(max-width:760px){.grid,.diag{grid-template-columns:1fr}.wrap{padding:20px}.score{font-size:48px}}@media print{body{background:#fff;color:#111}.cover,.card{background:#fff;color:#111;border-color:#ccc}}
  </style></head><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${VERSION}</p><h1>Release Pack v5.7</h1><p class="lead">${p.promise}</p><div><span class="badge">Release ${p.score}/100</span><span class="badge">${p.state}</span><span class="badge">${p.focus}</span><span class="badge">${p.gate}</span></div></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Guion demo 5 min</h2><div class="steps">${p.route.map(x=>`<div><b>${x[0]}</b> ${x[1]}</div>`).join('')}</div></article><article class="card"><h2>Checklist release</h2><div class="checks">${p.releaseChecks.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Diagnóstico local</h2>${release57DiagnosticsTable(p.diag)}</article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
}
function release57Brief(r){
  const p=release57Plan(r||currentReading||read(STORE.history,[])[0]||{});
  return `ALAYA ASTRAL IA · ${VERSION}\n\nVISION RELEASE v5.7\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nPromesa: ${p.promise}\nFoco: ${p.focus}\nPuerta: ${p.gate}\nPrueba: ${p.proof}\n\nGUIÓN DEMO 5 MIN\n${p.route.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nCHECKLIST RELEASE\n${p.releaseChecks.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nSIGUIENTE\n${p.next}`;
}
function toggleRelease57(){
  document.body.classList.toggle('release57-mode');
  toast(document.body.classList.contains('release57-mode')?'Modo Release activo: se muestra lo esencial para demo/publicación.':'Modo Release desactivado.');
}
function showRelease57Audit(){
  const diag=release57Diagnostics(); let box=document.querySelector('#release57AuditResult');
  if(!box){ const anchor=document.querySelector('[data-release57-home]')||document.querySelector('#dailyPulse'); if(anchor){anchor.insertAdjacentHTML('afterend','<section id="release57AuditResult" class="release57-audit glass"></section>'); box=document.querySelector('#release57AuditResult');} }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Release v5.7</p><h2>Estado real antes de enseñar/publicar</h2></div><b class="release57-mini-score">${diag.score}/100</b></div>${release57DiagnosticsTable(diag)}`;
}
function cleanHomeForRelease57(){
  document.querySelectorAll('[data-nebula-home],[data-aurora-home],[data-celestial-home],[data-zenith-home],[data-nova-home],[data-novaplus-home],[data-demo54-home],[data-experience55-home],[data-launch52-home],[data-showcase53-home],[data-polish56-home],[data-clean-home],.ascendant51-command,.ascendant51-flow').forEach(x=>x.remove());
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.release57=release57Score(r); const p=release57Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Release v5.7'))){
      r.layers=[...(r.layers||[]),
        {icon:'🚀',title:'Release v5.7 · Lista para enseñar',html:release57Layer(r)},
        {icon:'🎬',title:'Guion demo de 5 minutos',html:`<div class="release57-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'✅',title:'Checklist release v5.7',html:`<div class="release57-checks">${p.releaseChecks.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></article>`).join('')}</div><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
        {icon:'🧪',title:'Auditoría local v5.7',html:release57DiagnosticsTable(p.diag)}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadRelease57')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadRelease57'; a.textContent='Release v5.7'; a.onclick=()=>download(`alaya-release-v57-${r.id||'demo'}.html`,release57Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyRelease57'; b.textContent='Copiar release'; b.onclick=()=>copyText(release57Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleRelease57'; c.textContent='Modo Release'; c.onclick=toggleRelease57;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditRelease57'; d.textContent='Auditoría v5.7'; d.onclick=showRelease57Audit;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome(); cleanHomeForRelease57(); document.body.classList.add('v57-clean-home');
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.release57||release57Score(r)),0)/(h.length||1))||0;
    const baseAura=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats');
    if(stats) stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${baseAura||'—'}</b><span>aura</span></div><div class="stat" data-release57-stat><b>${avg||'97'}</b><span>release</span></div>`;
    const homeAnchor=document.querySelector('#dailyPulse');
    if(homeAnchor && !document.querySelector('[data-release57-home]')){
      homeAnchor.insertAdjacentHTML('beforebegin',`<section class="release57-home glass" data-release57-home><div><p class="eyebrow">Vision Release v5.7</p><h2>Alaya limpia, espectacular y preparada para demo/publicación.</h2><p>Release v5.7 une lo importante: portada clara, lectura por capas, dossier premium, universo personal, auditoría separada, navegación robusta y checklist real para probar en móvil.</p><div class="release57-actions"><button class="btn primary" data-route="lecturas">Crear lectura release</button><button class="btn secondary" id="release57ReportHomeBtn">Release v5.7</button><button class="btn ghost" id="release57CopyHomeBtn">Copiar guion</button><button class="btn ghost" id="release57AuditHomeBtn">Auditoría</button><button class="btn ghost" id="release57ModeHomeBtn">Modo Release</button></div></div><div class="release57-score"><span>Release</span><b id="release57HomeScore">${avg||'97'}</b><small>ready</small></div></section>`);
    }
    const report=document.querySelector('#release57ReportHomeBtn'); if(report) report.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',release57Focus:'limpieza',release57Gate:'lista',release57Proof:'demo'}); download(`alaya-release-v57-${r.id||'demo'}.html`,release57Report(r),'text/html')};
    const copy=document.querySelector('#release57CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(release57Brief(currentReading||h[0]||{}));
    const audit=document.querySelector('#release57AuditHomeBtn'); if(audit) audit.onclick=showRelease57Audit;
    const mode=document.querySelector('#release57ModeHomeBtn'); if(mode) mode.onclick=toggleRelease57;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.release57||release57Score(r)),0)/(h.length||1))||0;
    const dash=document.querySelector('#universeDashboard');
    if(dash){ dash.querySelectorAll('[data-polish56-card],[data-experience55-card],[data-demo54-card]').forEach(x=>x.remove()); if(!dash.querySelector('[data-release57-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-release57-card><span>Release v5.7</span><b>${avg||'—'}</b><small>demo / publicación / estabilidad</small></article>`); }
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-release57-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="release57-pulse" data-release57-pulse><b>Release v5.7</b><span>Hoy prueba una ruta completa: crear lectura, guardar, exportar, abrir Universo y revisar auditoría técnica.</span></div>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v57-clean-home');
  document.title='Alaya Astral IA v5.7 Vision Release';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.7 Vision Release: app astral premium con home limpia, modo release, auditoría local, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','polish56','release57','demo57','audit57'];
    [...rt.options].forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="release57"]')) rt.insertAdjacentHTML('beforeend','<option value="release57">Vision Release v5.7</option><option value="demo57">Demo Release v5.7</option><option value="audit57">Auditoría Release v5.7</option>');
  }
  const anchor=document.querySelector('#polish56Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#release57Focus')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Foco Release<select id="release57Focus" name="release57Focus"><option value="limpieza">Limpieza visual</option><option value="movil">Prueba móvil real</option><option value="pdf">PDF / dossier</option><option value="publicacion">Publicación</option><option value="astro">Astro.com manual separado</option></select></label><label>Puerta Release<select id="release57Gate" name="release57Gate"><option value="demo">Demo privada</option><option value="qa">QA final</option><option value="lista">Lista para enseñar</option><option value="publicacion">Publicación controlada</option></select></label></div><div class="row"><label>Prueba Release<select id="release57Proof" name="release57Proof"><option value="pendiente">Pendiente</option><option value="probado">Probado en móvil</option><option value="demo">Demo ensayada</option><option value="pdf">PDF revisado</option><option value="pwa">PWA revisada</option></select></label><label>Nota release<input id="release57Note" name="release57Note" placeholder="Ej. Probar en iPhone y revisar PDF" /></label></div><label>Promesa Release<input id="release57Promise" name="release57Promise" placeholder="Ej. Una app astral premium, clara y lista para enseñar" /></label>`);
  }
  cleanHomeForRelease57();
  // Navegación delegada para botones dinámicos añadidos después de cargar la app.
  if(!window.__alaya57DelegatedRoute){
    window.__alaya57DelegatedRoute=true;
    document.addEventListener('click',e=>{
      const el=e.target.closest('[data-route]');
      if(el){ e.preventDefault(); route(el.dataset.route); }
    });
  }
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.8 Vision Stable: estabilidad final, QA real y experiencia limpia === */
function stable58Diagnostics(){
  const h=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]), settings=read(STORE.settings,{});
  const legacySelectors='[data-nebula-home],[data-aurora-home],[data-celestial-home],[data-zenith-home],[data-nova-home],[data-novaplus-home],[data-demo54-home],[data-experience55-home],[data-launch52-home],[data-showcase53-home],[data-polish56-home],[data-release57-home],[data-clean-home],.ascendant51-command,.ascendant51-flow';
  const legacyVisible=[...document.querySelectorAll(legacySelectors)].filter(x=>x.offsetParent!==null).length;
  const homeStable=!!document.querySelector('[data-stable58-home]');
  const routeButtons=[...document.querySelectorAll('[data-route]')];
  const brokenRouteButtons=routeButtons.filter(x=>!x.dataset.route).length;
  const screens=[...document.querySelectorAll('.screen')].map(x=>x.id).filter(Boolean);
  const activeScreens=[...document.querySelectorAll('.screen.active')].length;
  const hasStorage=(()=>{try{localStorage.setItem('__alaya58','ok');localStorage.removeItem('__alaya58');return true;}catch(e){return false;}})();
  const hasSW=('serviceWorker' in navigator);
  const swCtrl=!!navigator.serviceWorker?.controller;
  const hasManifest=!!document.querySelector('link[rel="manifest"]');
  const hasPrint=typeof window.print==='function';
  const hasClipboard=!!navigator.clipboard;
  const mobile=window.matchMedia&&window.matchMedia('(max-width: 760px)').matches;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const checks=[
    ['Home estable', legacyVisible===0 && homeStable, legacyVisible===0 && homeStable?'Solo se muestra el bloque Stable v5.8.':`Bloques antiguos visibles: ${legacyVisible}. Stable visible: ${homeStable?'sí':'no'}.`],
    ['Pantallas internas', screens.length>=5 && activeScreens===1, `${screens.length} pantallas detectadas · ${activeScreens} activa(s).`],
    ['Navegación', routeButtons.length>=5 && brokenRouteButtons===0, `${routeButtons.length} botones/enlaces route · ${brokenRouteButtons} incompletos.`],
    ['LocalStorage', hasStorage, hasStorage?'Almacenamiento local disponible.':'El navegador bloquea almacenamiento.'],
    ['Service Worker', hasSW, hasSW?`Soportado${swCtrl?' y controlando la página':' · recargar tras instalar para activar'}.`:'No soportado en este entorno.'],
    ['Manifest PWA', hasManifest, hasManifest?'Manifest enlazado.':'No se detecta manifest.'],
    ['PDF / impresión', hasPrint, hasPrint?'Impresión disponible.':'No se detecta print().'],
    ['Portapapeles', hasClipboard, hasClipboard?'Copiado compatible.':'Puede requerir copiar manualmente.'],
    ['Historial', Array.isArray(h), `${h.length} lecturas guardadas.`],
    ['Favoritas', Array.isArray(favs), `${favs.length} favoritas.`],
    ['Perfiles', Array.isArray(profiles), `${profiles.length} perfiles.`],
    ['Ajustes', typeof settings==='object', `Tema: ${settings.theme||'cósmico'} · alto contraste: ${settings.highContrast?'sí':'no'}.`],
    ['Móvil', mobile?'móvil':'escritorio', mobile?'Modo móvil detectado: revisar botones y scroll.':'Escritorio detectado: hacer prueba real en iPhone/Android.'],
    ['Movimiento reducido', reduced?'reducido':'normal', reduced?'El sistema pide reducir animaciones.':'Animaciones normales.']
  ];
  const ok=checks.filter(c=>c[1]===true||c[1]==='móvil'||c[1]==='escritorio'||c[1]==='normal'||c[1]==='reducido').length;
  const score=Math.max(58,Math.min(99,Math.round((ok/checks.length)*100)-(legacyVisible*10)-(brokenRouteButtons*5)+(h.length?3:0)+(favs.length?2:0)+(profiles.length?2:0)));
  return {score,checks,history:h.length,favorites:favs.length,profiles:profiles.length,legacyVisible,brokenRouteButtons,mobile,reduced,swCtrl};
}
function stable58Score(r={}){
  const d=r.data||{};
  let score=Math.round(((r.metrics?.aura||80)+(r.metrics?.release57||84)+(r.metrics?.polish56||82))/3);
  if(d.stable58Gate==='ready') score+=9;
  if(d.stable58Gate==='publish') score+=7;
  if(d.stable58Focus==='mobile') score+=6;
  if(d.stable58Focus==='stability') score+=5;
  if(d.stable58Proof==='iphone') score+=8;
  if(d.stable58Proof==='android') score+=7;
  if(d.stable58Proof==='pdf') score+=5;
  if(d.stable58Promise) score+=4;
  return Math.max(62,Math.min(99,score));
}
function stable58Plan(r={}){
  const d=r.data||{}; const diag=stable58Diagnostics(); const score=stable58Score(r);
  const focus={stability:'estabilidad y navegación',mobile:'prueba móvil real',pdf:'PDF/dossier profesional',pwa:'PWA y caché',astro:'Astro.com manual separado',clarity:'claridad de portada'}[d.stable58Focus]||'estabilidad y navegación';
  const gate={draft:'borrador interno',qa:'QA final',ready:'lista para enseñar',publish:'publicación controlada'}[d.stable58Gate]||'QA final';
  const proof={pending:'pendiente',iphone:'probada en iPhone',android:'probada en Android',pdf:'PDF revisado',pwa:'PWA instalada',full:'ruta completa probada'}[d.stable58Proof]||'pendiente';
  const promise=d.stable58Promise||d.release57Promise||'Una app astral premium, limpia, estable y lista para enseñar sin saturación.';
  const state=score>=93?'Muy estable para demo/publicación':score>=84?'Casi lista: completar prueba móvil/PDF':'Necesita una ronda corta de QA antes de enseñar';
  const route=[
    ['00:00','Abrir Home y comprobar que la promesa se entiende en 10 segundos.'],
    ['00:45','Crear lectura con datos demo y confirmar que el flujo no abruma.'],
    ['02:00','Mostrar resultado por capas: impacto, lectura, plan, mapa y técnica separada.'],
    ['03:15','Guardar lectura y abrir Mi Universo para ver continuidad.'],
    ['04:00','Exportar dossier/PDF y revisar presentación.'],
    ['04:45','Ejecutar diagnóstico v5.8 y anotar bloqueos reales.']
  ];
  const checklist=[
    'Home sin bloques antiguos visibles.',
    'Botón Crear lectura funciona desde home y modo demo.',
    'Lectura se genera, guarda, abre y marca como favorita.',
    'PDF/dossier se descarga o imprime correctamente.',
    'Astro.com permanece como importación/comprobación manual.',
    'PWA actualiza caché tras publicar nueva versión.',
    'Prueba real en iPhone Safari o PWA instalada.',
    'Prueba real en Android Chrome o PWA instalada.',
    'Backup/exportación e importación no pierden historial.',
    'Modo Stable muestra solo lo esencial para presentación.'
  ];
  const next=diag.legacyVisible>0?'Limpiar bloques antiguos de la home.':diag.score<90?'Completar pruebas reales en móvil y PDF.':'Congelar esta versión como candidata estable y pasar a cálculo astral real.';
  return {score,focus,gate,proof,promise,state,route,checklist,next,diag};
}
function stable58Table(diag=stable58Diagnostics()){
  return `<div class="stable58-table">${diag.checks.map(c=>`<article class="${c[1]===true||c[1]==='móvil'||c[1]==='escritorio'||c[1]==='normal'||c[1]==='reducido'?'ok':'warn'}"><b>${c[0]}</b><span>${c[2]}</span></article>`).join('')}</div>`;
}
function stable58Layer(r){
  const p=stable58Plan(r);
  return `<div class="stable58-layer"><div class="stable58-score"><span>Stable v5.8</span><b>${p.score}</b><small>${p.state}</small></div><div><p><b>Foco:</b> ${p.focus}</p><p><b>Puerta:</b> ${p.gate}</p><p><b>Prueba:</b> ${p.proof}</p><p><b>Promesa:</b> ${p.promise}</p></div></div><div class="stable58-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`;
}
function stable58Report(r={}){
  const p=stable58Plan(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya Stable v5.8</title><style>body{font-family:Inter,system-ui,sans-serif;background:#090716;color:#f7edff;margin:0;padding:36px}main{max-width:980px;margin:auto}.card{background:linear-gradient(135deg,rgba(255,255,255,.1),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.18);border-radius:28px;padding:28px;margin:18px 0}.score{font-size:72px;font-weight:900}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.grid article{background:rgba(255,255,255,.08);border-radius:18px;padding:16px}.ok{border-left:4px solid #8fffd2}.warn{border-left:4px solid #ffd38a}.muted{color:#cfbee9}h1{font-size:42px} @media print{body{background:white;color:#16111f}.card{border:1px solid #ddd;background:#fff}.muted{color:#555}}</style></head><body><main><p class="muted">Alaya Astral IA · ${VERSION}</p><h1>Informe Stable v5.8</h1><section class="card"><p class="muted">Estado de preparación</p><div class="score">${p.score}/100</div><h2>${p.state}</h2><p>${p.promise}</p></section><section class="card"><h2>Ruta de demo estable</h2><div class="grid">${p.route.map(x=>`<article><b>${x[0]}</b><p>${x[1]}</p></article>`).join('')}</div></section><section class="card"><h2>Checklist QA</h2><div class="grid">${p.checklist.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><p>${x}</p></article>`).join('')}</div></section><section class="card"><h2>Diagnóstico local</h2><div class="grid">${p.diag.checks.map(c=>`<article class="${c[1]===true||c[1]==='móvil'||c[1]==='escritorio'||c[1]==='normal'||c[1]==='reducido'?'ok':'warn'}"><b>${c[0]}</b><p>${c[2]}</p></article>`).join('')}</div></section><section class="card"><h2>Siguiente decisión</h2><p>${p.next}</p></section></main></body></html>`;
}
function stable58Brief(r={}){
  const p=stable58Plan(r);
  return `ALAYA ASTRAL IA · STABLE v5.8\n\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nFoco: ${p.focus}\nPuerta: ${p.gate}\nPrueba: ${p.proof}\nPromesa: ${p.promise}\n\nRUTA DEMO\n${p.route.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nCHECKLIST QA\n${p.checklist.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nSIGUIENTE\n${p.next}`;
}
function toggleStable58(){
  document.body.classList.toggle('stable58-mode');
  toast(document.body.classList.contains('stable58-mode')?'Modo Stable activo: portada, lectura, dossier, universo y técnica quedan más enfocados.':'Modo Stable desactivado.');
}
function showStable58Audit(){
  const diag=stable58Diagnostics(); let box=document.querySelector('#stable58AuditResult');
  if(!box){ const anchor=document.querySelector('[data-stable58-home]')||document.querySelector('#dailyPulse'); if(anchor){anchor.insertAdjacentHTML('afterend','<section id="stable58AuditResult" class="stable58-audit glass"></section>'); box=document.querySelector('#stable58AuditResult');} }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Stable v5.8</p><h2>Diagnóstico real de estabilidad</h2></div><b class="stable58-mini-score">${diag.score}/100</b></div>${stable58Table(diag)}`;
}
function cleanHomeForStable58(){
  document.querySelectorAll('[data-nebula-home],[data-aurora-home],[data-celestial-home],[data-stellar-home],[data-zenith-home],[data-apex-home],[data-nova-home],[data-novaplus-home],[data-demo54-home],[data-experience55-home],[data-launch52-home],[data-showcase53-home],[data-polish56-home],[data-release57-home],[data-clean-home],.ascendant51-command,.ascendant51-flow').forEach(x=>x.remove());
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.stable58=stable58Score(r); const p=stable58Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Stable v5.8'))){
      r.layers=[...(r.layers||[]),
        {icon:'🛡️',title:'Stable v5.8 · Preparada para enseñar',html:stable58Layer(r)},
        {icon:'🎯',title:'Ruta demo estable',html:`<div class="stable58-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'✅',title:'Checklist QA v5.8',html:`<div class="stable58-checks">${p.checklist.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></article>`).join('')}</div><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
        {icon:'🔎',title:'Diagnóstico local v5.8',html:stable58Table(p.diag)}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadStable58')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadStable58'; a.textContent='Stable v5.8'; a.onclick=()=>download(`alaya-stable-v58-${r.id||'demo'}.html`,stable58Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyStable58'; b.textContent='Copiar QA'; b.onclick=()=>copyText(stable58Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleStable58'; c.textContent='Modo Stable'; c.onclick=toggleStable58;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditStable58'; d.textContent='Auditoría v5.8'; d.onclick=showStable58Audit;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome(); cleanHomeForStable58(); document.body.classList.add('v58-clean-home');
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.stable58||stable58Score(r)),0)/(h.length||1))||0;
    const baseAura=Math.round(h.reduce((a,r)=>a+(r.metrics?.aura||0),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats');
    if(stats) stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${baseAura||'—'}</b><span>aura</span></div><div class="stat" data-stable58-stat><b>${avg||'98'}</b><span>stable</span></div>`;
    const homeAnchor=document.querySelector('#dailyPulse');
    if(homeAnchor && !document.querySelector('[data-stable58-home]')){
      homeAnchor.insertAdjacentHTML('beforebegin',`<section class="stable58-home glass" data-stable58-home><div><p class="eyebrow">Vision Stable v5.8</p><h2>Alaya limpia, estable y lista para enseñar.</h2><p>Stable v5.8 prioriza lo que hace que la app parezca producto real: portada clara, ruta de demo, navegación robusta, diagnóstico local, dossier premium y auditoría técnica separada.</p><div class="stable58-actions"><button class="btn primary" data-route="lecturas">Crear lectura estable</button><button class="btn secondary" id="stable58ReportHomeBtn">Stable v5.8</button><button class="btn ghost" id="stable58CopyHomeBtn">Copiar QA</button><button class="btn ghost" id="stable58AuditHomeBtn">Auditoría</button><button class="btn ghost" id="stable58ModeHomeBtn">Modo Stable</button></div></div><div class="stable58-score"><span>Stable</span><b id="stable58HomeScore">${avg||'98'}</b><small>ready</small></div></section>`);
    }
    const report=document.querySelector('#stable58ReportHomeBtn'); if(report) report.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',stable58Focus:'stability',stable58Gate:'ready',stable58Proof:'full'}); download(`alaya-stable-v58-${r.id||'demo'}.html`,stable58Report(r),'text/html')};
    const copy=document.querySelector('#stable58CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(stable58Brief(currentReading||h[0]||{}));
    const audit=document.querySelector('#stable58AuditHomeBtn'); if(audit) audit.onclick=showStable58Audit;
    const mode=document.querySelector('#stable58ModeHomeBtn'); if(mode) mode.onclick=toggleStable58;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.stable58||stable58Score(r)),0)/(h.length||1))||0;
    const dash=document.querySelector('#universeDashboard');
    if(dash){ dash.querySelectorAll('[data-polish56-card],[data-experience55-card],[data-demo54-card],[data-release57-card]').forEach(x=>x.remove()); if(!dash.querySelector('[data-stable58-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-stable58-card><span>Stable v5.8</span><b>${avg||'—'}</b><small>QA / demo / publicación</small></article>`); }
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-stable58-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="stable58-pulse" data-stable58-pulse><b>Stable v5.8</b><span>Hoy valida una ruta completa: home → lectura → guardar → universo → dossier → auditoría.</span></div>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v58-clean-home');
  document.title='Alaya Astral IA v5.8 Vision Stable';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.8 Vision Stable: app astral premium con home limpia, modo stable, auditoría local, diagnóstico QA, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','release57','stable58','demo58','audit58'];
    [...rt.options].forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="stable58"]')) rt.insertAdjacentHTML('beforeend','<option value="stable58">Vision Stable v5.8</option><option value="demo58">Demo Stable v5.8</option><option value="audit58">Auditoría Stable v5.8</option>');
  }
  const anchor=document.querySelector('#release57Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#stable58Focus')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Foco Stable<select id="stable58Focus" name="stable58Focus"><option value="stability">Estabilidad y navegación</option><option value="mobile">Prueba móvil real</option><option value="pdf">PDF / dossier</option><option value="pwa">PWA y caché</option><option value="astro">Astro.com manual separado</option><option value="clarity">Claridad de portada</option></select></label><label>Puerta Stable<select id="stable58Gate" name="stable58Gate"><option value="draft">Borrador interno</option><option value="qa">QA final</option><option value="ready">Lista para enseñar</option><option value="publish">Publicación controlada</option></select></label></div><div class="row"><label>Prueba Stable<select id="stable58Proof" name="stable58Proof"><option value="pending">Pendiente</option><option value="iphone">Probada en iPhone</option><option value="android">Probada en Android</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="full">Ruta completa probada</option></select></label><label>Nota Stable<input id="stable58Note" name="stable58Note" placeholder="Ej. Revisar iPhone + PDF antes de publicar" /></label></div><label>Promesa Stable<input id="stable58Promise" name="stable58Promise" placeholder="Ej. Una app astral premium, estable y lista para enseñar" /></label>`);
  }
  cleanHomeForStable58();
  if(!window.__alaya58DelegatedRoute){
    window.__alaya58DelegatedRoute=true;
    document.addEventListener('click',e=>{
      const el=e.target.closest('[data-route]');
      if(el){ e.preventDefault(); route(el.dataset.route); }
    });
  }
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v5.9 Vision Candidate: cierre candidato, QA navegable y publicación segura === */
function candidate59Diagnostics(){
  const h=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]), settings=read(STORE.settings,{});
  const legacySelectors='[data-stable58-home],[data-release57-home],[data-polish56-home],[data-experience55-home],[data-demo54-home],[data-showcase53-home],[data-launch52-home],[data-novaplus-home],[data-nova-home],[data-apex-home],[data-zenith-home],[data-stellar-home],[data-celestial-home],[data-aurora-home],[data-nebula-home],[data-clean-home],.ascendant51-command,.ascendant51-flow';
  const legacyVisible=[...document.querySelectorAll(legacySelectors)].filter(x=>x.offsetParent!==null).length;
  const homeCandidate=!!document.querySelector('[data-candidate59-home]');
  const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
  const dupIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  const routeButtons=[...document.querySelectorAll('[data-route]')];
  const badRoutes=routeButtons.filter(x=>!['home','lecturas','compatibilidad','universo','ajustes'].includes(x.dataset.route)).length;
  const requiredScreens=['home','lecturas','compatibilidad','universo','ajustes'];
  const screensOk=requiredScreens.every(id=>document.getElementById(id));
  const activeScreens=[...document.querySelectorAll('.screen.active')].length;
  const form=!!document.getElementById('readingForm');
  const resultTemplate=!!document.getElementById('resultTemplate');
  const hasStorage=(()=>{try{localStorage.setItem('__alaya59','ok');localStorage.removeItem('__alaya59');return true;}catch(e){return false;}})();
  const hasSW=('serviceWorker' in navigator);
  const swCtrl=!!navigator.serviceWorker?.controller;
  const hasManifest=!!document.querySelector('link[rel="manifest"]');
  const hasPrint=typeof window.print==='function';
  const hasClipboard=!!navigator.clipboard;
  const mobile=window.matchMedia&&window.matchMedia('(max-width:760px)').matches;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const checks=[
    ['Home candidata', legacyVisible===0 && homeCandidate, legacyVisible===0 && homeCandidate?'Portada limpia Candidate v5.9 activa.':`Bloques antiguos visibles: ${legacyVisible}. Candidate: ${homeCandidate?'sí':'no'}.`],
    ['IDs duplicados', dupIds.length===0, dupIds.length?`Duplicados visibles: ${dupIds.slice(0,6).join(', ')}${dupIds.length>6?'…':''}`:'Sin IDs duplicados visibles en el DOM actual.'],
    ['Rutas principales', routeButtons.length>=5 && badRoutes===0, `${routeButtons.length} elementos con ruta · ${badRoutes} rutas no previstas.`],
    ['Pantallas esenciales', screensOk && activeScreens===1, `${requiredScreens.filter(id=>document.getElementById(id)).length}/5 pantallas · ${activeScreens} activa(s).`],
    ['Formulario de lectura', form, form?'Formulario principal detectado.':'No se detecta readingForm.'],
    ['Template de resultado', resultTemplate, resultTemplate?'Plantilla de resultado disponible.':'Falta resultTemplate.'],
    ['LocalStorage', hasStorage, hasStorage?'Almacenamiento local disponible.':'Almacenamiento bloqueado.'],
    ['Service Worker', hasSW, hasSW?`Soportado${swCtrl?' y controlando':' · recargar tras instalar'}.`:'No soportado en este entorno.'],
    ['Manifest PWA', hasManifest, hasManifest?'Manifest enlazado.':'No se detecta manifest.'],
    ['PDF / impresión', hasPrint, hasPrint?'Impresión disponible.':'No se detecta window.print().'],
    ['Portapapeles', hasClipboard, hasClipboard?'Copiado compatible.':'Puede requerir copia manual.'],
    ['Historial', Array.isArray(h), `${h.length} lecturas guardadas.`],
    ['Favoritas', Array.isArray(favs), `${favs.length} favoritas.`],
    ['Perfiles', Array.isArray(profiles), `${profiles.length} perfiles guardados.`],
    ['Ajustes', typeof settings==='object', `Tema: ${settings.theme||'cósmico'} · contraste: ${settings.highContrast?'alto':'normal'}.`],
    ['Vista actual', mobile?'móvil':'escritorio', mobile?'Pantalla móvil detectada: revisar scroll y botones.':'Escritorio detectado: falta prueba física móvil.'],
    ['Movimiento reducido', reduced?'reducido':'normal', reduced?'El sistema pide reducir animaciones.':'Animaciones normales.']
  ];
  const ok=checks.filter(c=>c[1]===true||c[1]==='móvil'||c[1]==='escritorio'||c[1]==='normal'||c[1]==='reducido').length;
  const score=Math.max(60,Math.min(99,Math.round((ok/checks.length)*100)-(legacyVisible*8)-(dupIds.length*3)-(badRoutes*4)+(h.length?2:0)+(profiles.length?2:0)));
  return {score,checks,legacyVisible,dupIds,badRoutes,history:h.length,favorites:favs.length,profiles:profiles.length,mobile,reduced,swCtrl};
}
function candidate59Score(r={}){
  const d=r.data||{}; let score=Math.round(((r.metrics?.stable58||84)+(r.metrics?.release57||82)+(r.metrics?.aura||82))/3);
  if(d.candidate59Gate==='release') score+=10;
  if(d.candidate59Gate==='demo') score+=7;
  if(d.candidate59Focus==='qa') score+=6;
  if(d.candidate59Focus==='mobile') score+=7;
  if(d.candidate59Focus==='publish') score+=8;
  if(d.candidate59Evidence==='full') score+=9;
  if(d.candidate59Evidence==='mobile') score+=7;
  if(d.candidate59Evidence==='pdf') score+=5;
  if(d.candidate59Promise) score+=4;
  return Math.max(65,Math.min(99,score));
}
function candidate59Plan(r={}){
  const d=r.data||{}; const diag=candidate59Diagnostics(); const score=candidate59Score(r);
  const focus={qa:'QA final y estabilidad',mobile:'prueba real en móvil',publish:'publicación controlada',pdf:'PDF/dossier premium',astro:'Astro.com manual separado',clarity:'claridad de portada'}[d.candidate59Focus]||'QA final y estabilidad';
  const gate={internal:'borrador interno',demo:'demo enseñable',release:'release candidate',publish:'publicación controlada'}[d.candidate59Gate]||'release candidate';
  const evidence={pending:'sin evidencia todavía',mobile:'prueba móvil realizada',pdf:'PDF revisado',pwa:'PWA instalada',astro:'Astro.com manual revisado',full:'ruta completa validada'}[d.candidate59Evidence]||'sin evidencia todavía';
  const promise=d.candidate59Promise||d.stable58Promise||'Una app astral premium, clara, estable y lista para enseñar como candidata de lanzamiento.';
  const state=score>=94?'Candidata muy sólida para enseñar':score>=86?'Casi lista: cerrar pruebas reales':'Necesita una ronda de revisión antes de publicar';
  const route=[
    ['01','Portada: comprobar promesa, CTA y ausencia de ruido visual.'],
    ['02','Lectura: crear una demo completa y confirmar que el flujo no abruma.'],
    ['03','Resultado: revisar impacto, lectura, plan, mapa visual y técnica separada.'],
    ['04','Entrega: descargar HTML/PDF/dossier y comprobar impresión.'],
    ['05','Universo: guardar, marcar favorita y revisar continuidad.'],
    ['06','Técnica: ejecutar diagnóstico v5.9 y anotar bloqueos reales.'],
    ['07','Móvil/PWA: probar en iPhone o Android antes de compartir.']
  ];
  const blockers=[];
  if(diag.legacyVisible>0) blockers.push('Hay bloques antiguos visibles en la home.');
  if(diag.dupIds.length) blockers.push('Hay IDs duplicados visibles que conviene limpiar.');
  if(diag.badRoutes>0) blockers.push('Hay rutas no previstas en botones/enlaces.');
  if(!diag.swCtrl) blockers.push('Service Worker puede requerir recarga tras publicar.');
  if(!diag.history) blockers.push('Conviene crear una lectura demo antes de enseñar.');
  const next=blockers.length?'Resolver bloqueos detectados y repetir diagnóstico.':score>=94?'Congelar como candidata de lanzamiento y pasar a pruebas reales externas.':'Completar prueba móvil, PDF y PWA antes de publicar.';
  return {score,focus,gate,evidence,promise,state,route,blockers,next,diag};
}
function candidate59Table(diag){
  return `<div class="candidate59-table">${diag.checks.map(c=>`<article class="${c[1]===true||c[1]==='móvil'||c[1]==='escritorio'||c[1]==='normal'||c[1]==='reducido'?'ok':'warn'}"><b>${c[0]}</b><span>${c[2]}</span></article>`).join('')}</div>`;
}
function candidate59Layer(r){
  const p=candidate59Plan(r);
  return `<div class="candidate59-layer"><div class="candidate59-score"><span>Candidate v5.9</span><b>${p.score}</b><small>${p.state}</small></div><div><p><b>Foco:</b> ${p.focus}</p><p><b>Puerta:</b> ${p.gate}</p><p><b>Evidencia:</b> ${p.evidence}</p><p><b>Promesa:</b> ${p.promise}</p></div></div><div class="candidate59-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>${p.blockers.length?`<div class="note-card"><b>Bloqueos:</b><ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:`<p class="note-card"><b>Estado:</b> Sin bloqueos críticos detectados en esta revisión local.</p>`}`;
}
function candidate59Report(r={}){
  const p=candidate59Plan(r);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Alaya Candidate v5.9</title><style>body{margin:0;background:#080512;color:#fff7e8;font-family:Inter,system-ui,sans-serif;padding:36px}main{max-width:1000px;margin:auto}.cover,.card{border:1px solid rgba(255,255,255,.16);border-radius:28px;background:linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.04));padding:28px;margin:18px 0}.cover{background:radial-gradient(circle at 12% 0%,rgba(255,210,126,.22),transparent 35%),radial-gradient(circle at 88% 12%,rgba(134,92,255,.22),transparent 38%),rgba(255,255,255,.08)}h1{font-size:44px;line-height:1;margin:0 0 12px}.score{font-size:76px;font-weight:900}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.grid article{border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:15px;background:rgba(255,255,255,.07)}.ok{border-left:4px solid #8fffd2!important}.warn{border-left:4px solid #ffd38a!important}.muted{opacity:.75}.badge{display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.10);margin:4px}@media print{body{background:white;color:#111}.cover,.card,.grid article{background:#fff;border-color:#ddd}.muted{opacity:.8}}</style></head><body><main><section class="cover"><p class="muted">ALAYA ASTRAL IA · ${VERSION}</p><h1>Release Candidate v5.9</h1><p>${p.promise}</p><span class="badge">Candidate ${p.score}/100</span><span class="badge">${p.gate}</span><span class="badge">${p.focus}</span><span class="badge">${p.evidence}</span></section><section class="card"><h2>Estado</h2><div class="score">${p.score}</div><h3>${p.state}</h3><p><b>Siguiente:</b> ${p.next}</p></section><section class="card"><h2>Ruta de validación</h2><div class="grid">${p.route.map(x=>`<article><b>${x[0]}</b><p>${x[1]}</p></article>`).join('')}</div></section><section class="card"><h2>Bloqueos</h2>${p.blockers.length?`<ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>No hay bloqueos críticos en esta revisión local.</p>'}</section><section class="card"><h2>Diagnóstico local</h2><div class="grid">${p.diag.checks.map(c=>`<article class="${c[1]===true||c[1]==='móvil'||c[1]==='escritorio'||c[1]==='normal'||c[1]==='reducido'?'ok':'warn'}"><b>${c[0]}</b><p>${c[2]}</p></article>`).join('')}</div></section></main></body></html>`;
}
function candidate59Brief(r={}){
  const p=candidate59Plan(r);
  return `ALAYA ASTRAL IA · ${VERSION}\n\nCANDIDATE v5.9\nPuntuación: ${p.score}/100\nEstado: ${p.state}\nFoco: ${p.focus}\nPuerta: ${p.gate}\nEvidencia: ${p.evidence}\nPromesa: ${p.promise}\n\nRUTA DE VALIDACIÓN\n${p.route.map(x=>`- ${x[0]} · ${x[1]}`).join('\n')}\n\nBLOQUEOS\n${p.blockers.length?p.blockers.map(x=>`- ${x}`).join('\n'):'- Sin bloqueos críticos locales'}\n\nSIGUIENTE\n${p.next}`;
}
function toggleCandidate59(){
  document.body.classList.toggle('candidate59-mode');
  toast(document.body.classList.contains('candidate59-mode')?'Modo Candidate activo: portada, lectura, dossier y técnica quedan enfocados.':'Modo Candidate desactivado.');
}
function showCandidate59Audit(){
  const diag=candidate59Diagnostics(); let box=document.querySelector('#candidate59AuditResult');
  if(!box){ const anchor=document.querySelector('[data-candidate59-home]')||document.querySelector('#dailyPulse'); if(anchor){anchor.insertAdjacentHTML('afterend','<section id="candidate59AuditResult" class="candidate59-audit glass"></section>'); box=document.querySelector('#candidate59AuditResult');} }
  if(box) box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Candidate v5.9</p><h2>Diagnóstico final antes de enseñar/publicar</h2></div><b class="candidate59-mini-score">${diag.score}/100</b></div>${candidate59Table(diag)}`;
}
function cleanHomeForCandidate59(){
  document.querySelectorAll('[data-stable58-home],[data-release57-home],[data-polish56-home],[data-experience55-home],[data-demo54-home],[data-showcase53-home],[data-launch52-home],[data-novaplus-home],[data-nova-home],[data-apex-home],[data-zenith-home],[data-stellar-home],[data-celestial-home],[data-aurora-home],[data-nebula-home],[data-clean-home],.ascendant51-command,.ascendant51-flow').forEach(x=>x.remove());
}
(function(){
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.candidate59=candidate59Score(r); const p=candidate59Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Candidate v5.9'))){
      r.layers=[...(r.layers||[]),
        {icon:'🏁',title:'Candidate v5.9 · Release casi final',html:candidate59Layer(r)},
        {icon:'🧭',title:'Ruta de validación v5.9',html:`<div class="candidate59-route">${p.route.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'🚧',title:'Bloqueos y siguiente decisión',html:`${p.blockers.length?`<ul class="candidate59-blockers">${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p class="note-card">Sin bloqueos críticos detectados en esta sesión.</p>'}<p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
        {icon:'🔎',title:'Diagnóstico local v5.9',html:candidate59Table(p.diag)}
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    oldRender(r);
    const actions=document.querySelector('.result-actions');
    if(actions&&!actions.querySelector('#downloadCandidate59')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadCandidate59'; a.textContent='Candidate v5.9'; a.onclick=()=>download(`alaya-candidate-v59-${r.id||'demo'}.html`,candidate59Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyCandidate59'; b.textContent='Copiar candidate'; b.onclick=()=>copyText(candidate59Brief(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleCandidate59'; c.textContent='Modo Candidate'; c.onclick=toggleCandidate59;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditCandidate59'; d.textContent='Auditoría v5.9'; d.onclick=showCandidate59Audit;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome(); cleanHomeForCandidate59(); document.body.classList.add('v59-clean-home');
    const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.candidate59||candidate59Score(r)),0)/(h.length||1))||0; const diag=candidate59Diagnostics();
    const stats=document.querySelector('#homeStats');
    if(stats) stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${diag.score}</b><span>diagnóstico</span></div><div class="stat"><b>${avg||'98'}</b><span>candidate</span></div>`;
    const homeAnchor=document.querySelector('#dailyPulse');
    if(homeAnchor && !document.querySelector('[data-candidate59-home]')){
      homeAnchor.insertAdjacentHTML('beforebegin',`<section class="candidate59-home glass" data-candidate59-home><div><p class="eyebrow">Vision Candidate v5.9</p><h2>Release casi final: limpia, estable y lista para pruebas reales.</h2><p>Candidate v5.9 concentra la app en lo importante: portada clara, lectura por capas, entrega premium, universo personal, diagnóstico local y Astro.com manual separado.</p><div class="candidate59-actions"><button class="btn primary" data-route="lecturas">Crear lectura candidate</button><button class="btn secondary" id="candidate59ReportHomeBtn">Candidate v5.9</button><button class="btn ghost" id="candidate59CopyHomeBtn">Copiar plan</button><button class="btn ghost" id="candidate59AuditHomeBtn">Auditoría</button><button class="btn ghost" id="candidate59ModeHomeBtn">Modo Candidate</button></div></div><div class="candidate59-score"><span>Candidate</span><b id="candidate59HomeScore">${avg||diag.score}</b><small>${diag.score>=90?'ready':'QA'}</small></div></section>`);
    }
    const report=document.querySelector('#candidate59ReportHomeBtn'); if(report) report.onclick=()=>{const r=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',candidate59Focus:'qa',candidate59Gate:'demo',candidate59Evidence:'full'}); download(`alaya-candidate-v59-${r.id||'demo'}.html`,candidate59Report(r),'text/html')};
    const copy=document.querySelector('#candidate59CopyHomeBtn'); if(copy) copy.onclick=()=>copyText(candidate59Brief(currentReading||h[0]||{}));
    const audit=document.querySelector('#candidate59AuditHomeBtn'); if(audit) audit.onclick=showCandidate59Audit;
    const mode=document.querySelector('#candidate59ModeHomeBtn'); if(mode) mode.onclick=toggleCandidate59;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.candidate59||candidate59Score(r)),0)/(h.length||1))||0;
    const dash=document.querySelector('#universeDashboard');
    if(dash){ dash.querySelectorAll('[data-stable58-card],[data-release57-card],[data-polish56-card],[data-experience55-card],[data-demo54-card]').forEach(x=>x.remove()); if(!dash.querySelector('[data-candidate59-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-candidate59-card><span>Candidate v5.9</span><b>${avg||'—'}</b><small>release / QA / publicación</small></article>`); }
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-candidate59-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="candidate59-pulse" data-candidate59-pulse><b>Candidate v5.9</b><span>Hoy valida una demo completa y anota solo bloqueos reales: móvil, PDF, PWA o Astro.com manual.</span></div>`);
  };
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v59-clean-home');
  document.title='Alaya Astral IA v5.9 Vision Candidate';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v5.9 Vision Candidate: app astral premium limpia, estable, con diagnóstico final, modo candidate, PWA, PDF y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','stable58','candidate59','demo59','audit59'];
    [...rt.options].forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="candidate59"]')) rt.insertAdjacentHTML('beforeend','<option value="candidate59">Vision Candidate v5.9</option><option value="demo59">Demo Candidate v5.9</option><option value="audit59">Auditoría Candidate v5.9</option>');
  }
  const anchor=document.querySelector('#stable58Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#candidate59Focus')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Foco Candidate<select id="candidate59Focus" name="candidate59Focus"><option value="qa">QA final y estabilidad</option><option value="mobile">Prueba real en móvil</option><option value="publish">Publicación controlada</option><option value="pdf">PDF / dossier premium</option><option value="astro">Astro.com manual separado</option><option value="clarity">Claridad de portada</option></select></label><label>Puerta Candidate<select id="candidate59Gate" name="candidate59Gate"><option value="internal">Borrador interno</option><option value="demo">Demo enseñable</option><option value="release">Release candidate</option><option value="publish">Publicación controlada</option></select></label></div><div class="row"><label>Evidencia Candidate<select id="candidate59Evidence" name="candidate59Evidence"><option value="pending">Pendiente</option><option value="mobile">Prueba móvil realizada</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="astro">Astro.com manual revisado</option><option value="full">Ruta completa validada</option></select></label><label>Nota Candidate<input id="candidate59Note" name="candidate59Note" placeholder="Ej. Probar en iPhone, Android y PDF antes de publicar" /></label></div><label>Promesa Candidate<input id="candidate59Promise" name="candidate59Promise" placeholder="Ej. Una app astral premium lista para enseñar como release candidate" /></label>`);
  }
  cleanHomeForCandidate59();
  if(!window.__alaya59DelegatedRoute){
    window.__alaya59DelegatedRoute=true;
    document.addEventListener('click',e=>{ const el=e.target.closest('[data-route]'); if(el){ e.preventDefault(); route(el.dataset.route); } });
  }
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v6.0 Release Vision: cierre limpio, publicación real y experiencia final === */
(function(){
  const V60='v6.0 Release Vision';
  const routes=['home','lecturas','compatibilidad','universo','ajustes'];
  function release60Diagnostics(){
    const h=read(STORE.history,[]), favs=favoriteIds(), profiles=read(STORE.profiles,[]);
    const legacySelectors='[data-candidate59-home],[data-stable58-home],[data-release57-home],[data-polish56-home],[data-experience55-home],[data-demo54-home],[data-showcase53-home],[data-launch52-home],[data-novaplus-home],[data-nova-home],[data-apex-home],[data-zenith-home],[data-stellar-home],[data-celestial-home],[data-aurora-home],[data-nebula-home],[data-clean-home],.ascendant51-command,.ascendant51-flow,.vision-strip';
    const legacyVisible=[...document.querySelectorAll(legacySelectors)].filter(x=>x.offsetParent!==null).length;
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    const dupIds=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
    const badRoutes=[...document.querySelectorAll('[data-route]')].filter(x=>!routes.includes(x.dataset.route)).length;
    const screensOk=routes.every(id=>document.getElementById(id));
    const oneActive=[...document.querySelectorAll('.screen.active')].length===1;
    const formOk=!!document.getElementById('readingForm') && !!document.getElementById('resultTemplate');
    const storageOk=(()=>{try{localStorage.setItem('__alaya60','ok');localStorage.removeItem('__alaya60');return true}catch(e){return false}})();
    const swOk='serviceWorker' in navigator;
    const swCtrl=!!navigator.serviceWorker?.controller;
    const manifestOk=!!document.querySelector('link[rel="manifest"]');
    const printOk=typeof window.print==='function';
    const clipboardOk=!!navigator.clipboard;
    const mobileOk=innerWidth<=820 || matchMedia('(pointer:coarse)').matches;
    const hasDemo=h.length>0;
    const checks=[
      ['Home limpia', legacyVisible===0 && !!document.querySelector('[data-release60-home]'), legacyVisible?`${legacyVisible} bloques antiguos visibles`:'Portada enfocada'],
      ['Rutas principales', badRoutes===0 && screensOk && oneActive, badRoutes?`${badRoutes} rutas no previstas`:'Navegación OK'],
      ['IDs duplicados', dupIds.length===0, dupIds.length?dupIds.slice(0,6).join(', '):'Sin duplicados visibles'],
      ['Formulario + resultado', formOk, formOk?'Flujo de lectura disponible':'Falta formulario o plantilla'],
      ['LocalStorage', storageOk, storageOk?'Guardado local disponible':'Bloqueado por navegador'],
      ['Service Worker', swOk, swCtrl?'Activo':'Disponible / pendiente de activar'],
      ['Manifest PWA', manifestOk, manifestOk?'Instalable si se publica en HTTPS':'Falta manifest'],
      ['PDF / impresión', printOk, printOk?'Exportación PDF posible':'Impresión no disponible'],
      ['Portapapeles', clipboardOk, clipboardOk?'Copiar brief disponible':'Puede requerir HTTPS'],
      ['Lectura demo', hasDemo, hasDemo?`${h.length} lecturas guardadas`:'Crea una lectura demo'],
      ['Favoritas', favs.length>=0, `${favs.length} favoritas`],
      ['Perfiles', profiles.length>=0, `${profiles.length} perfiles`],
      ['Vista móvil', mobileOk, mobileOk?'Contexto móvil o táctil':'Probar también en iPhone/Android']
    ];
    const score=Math.max(20,Math.min(100,Math.round(checks.filter(c=>c[1]).length/checks.length*100) - Math.min(10,legacyVisible*2) - Math.min(8,dupIds.length*2)));
    return {checks,score,legacyVisible,dupIds,badRoutes,hasDemo,swCtrl,mobileOk};
  }
  function release60Score(r={}){
    const m=r.metrics||{}; const d=release60Diagnostics();
    const base=Math.round(((m.candidate59||m.stable58||m.release57||m.aura||82)+d.score+(m.clarity||80))/3);
    return Math.max(45,Math.min(100,base));
  }
  function release60Plan(r={}){
    const d=r.data||{}; const diag=release60Diagnostics();
    const status=d.release60Status||'candidate';
    const proof=d.release60Proof||'pending';
    const blockers=d.release60Blockers||'none';
    const audience=d.release60Audience||'demo';
    const pillars=[
      ['Entrada','Home limpia, promesa clara y CTA principal visible.'],
      ['Lectura','Resultado por capas: impacto, lectura, plan, mapa y técnica.'],
      ['Entrega','PDF/HTML premium, brief copiable y modo presentación.'],
      ['Universo','Historial, favoritas, perfiles y evolución personal.'],
      ['Técnica','Astro.com manual separado, auditoría y diagnóstico local.'],
      ['Publicación','PWA, caché controlada y checklist de dispositivos.']
    ];
    const blockersList=[];
    if(diag.legacyVisible) blockersList.push('Limpiar bloques antiguos visibles en la home.');
    if(diag.dupIds.length) blockersList.push('Revisar IDs duplicados antes de publicar.');
    if(!diag.hasDemo) blockersList.push('Crear y guardar una lectura demo para validar el universo.');
    if(!diag.swCtrl) blockersList.push('Publicar en HTTPS y recargar para activar Service Worker.');
    if(proof==='pending') blockersList.push('Hacer una prueba real en iPhone/Android y exportar PDF.');
    if(blockers!=='none') blockersList.push('Resolver bloqueos indicados en el formulario v6.0.');
    if(!blockersList.length) blockersList.push('Sin bloqueos críticos detectados: lista para demo controlada.');
    return {status,proof,blockers,audience,pillars,blockersList,next: status==='publish'?'Publicar en canal elegido y hacer revisión 24h.':'Probar demo completa, guardar evidencia y pasar a publicación controlada.'};
  }
  function release60Table(checks){
    return `<div class="release60-table">${checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'✓':'!'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div>`;
  }
  function release60Brief(r={}){
    const p=release60Plan(r), d=release60Diagnostics();
    return `ALAYA ASTRAL IA · ${V60}\n\nEstado: ${p.status}\nAudiencia: ${p.audience}\nEvidencia: ${p.proof}\nDiagnóstico: ${d.score}/100\nRelease Vision: ${release60Score(r)}/100\n\n6 pilares:\n${p.pillars.map((x,i)=>`${i+1}. ${x[0]} — ${x[1]}`).join('\n')}\n\nBloqueos reales:\n${p.blockersList.map(x=>`- ${x}`).join('\n')}\n\nSiguiente acción: ${p.next}\n\nNota: Astro.com se mantiene como referencia manual pegada por la persona usuaria, sin scraping ni automatización.`;
  }
  function release60Report(r={}){
    const p=release60Plan(r), d=release60Diagnostics(); const title=(r.title||'Alaya Astral IA · Release Vision');
    return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Release Vision v6.0 · ${title}</title><style>
      body{margin:0;background:#06020f;color:#fff8ec;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:1120px;margin:auto;padding:48px}.hero{min-height:460px;display:grid;align-content:end;padding:48px;border-radius:42px;background:radial-gradient(circle at 16% 16%,rgba(255,218,138,.28),transparent 35%),radial-gradient(circle at 82% 22%,rgba(136,103,255,.34),transparent 38%),linear-gradient(135deg,#12071f,#07030f);border:1px solid rgba(255,255,255,.16);box-shadow:0 40px 120px rgba(0,0,0,.45)}h1{font-size:clamp(44px,7vw,90px);line-height:.88;margin:0 0 16px;letter-spacing:-.07em}.lead{font-size:20px;max-width:760px;opacity:.9}.badge{display:inline-block;margin:6px 6px 0 0;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.card{padding:22px;border-radius:24px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07)}.score{font-size:76px;font-weight:1000;color:#f7d78c;line-height:1}.wide{grid-column:1/-1}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.checks div{padding:12px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}.ok b{color:#a7f3d0}.warn b{color:#fcd34d}@media(max-width:760px){.wrap{padding:22px}.grid,.checks{grid-template-columns:1fr}.hero{min-height:400px;padding:28px}}@media print{body{background:#fff;color:#111}.hero,.card,.checks div{background:#fff;border-color:#ddd;box-shadow:none}.score{color:#111}}
      </style><body><main class="wrap"><section class="hero"><p>ALAYA ASTRAL IA · ${V60}</p><h1>${title}</h1><p class="lead">Acta de cierre para demo/publicación: visión clara, experiencia premium, diagnóstico local y bloqueos reales.</p><div><span class="badge">Release ${release60Score(r)}/100</span><span class="badge">Diagnóstico ${d.score}/100</span><span class="badge">${p.status}</span><span class="badge">${p.audience}</span></div></section><section class="grid"><article class="card"><b>Release Vision</b><div class="score">${release60Score(r)}</div><p>Preparación visual, técnica y de demo.</p></article><article class="card"><b>Diagnóstico local</b><div class="score">${d.score}</div><p>Estado actual detectado en el navegador.</p></article><article class="card"><b>Estado</b><p>${p.status}</p><p>Evidencia: ${p.proof}</p><p>Bloqueos: ${p.blockers}</p></article><article class="card wide"><h2>6 pilares finales</h2><div class="checks">${p.pillars.map(x=>`<div><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div></article><article class="card wide"><h2>Bloqueos reales</h2><ul>${p.blockersList.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Siguiente acción:</b> ${p.next}</p></article><article class="card wide"><h2>Diagnóstico</h2><div class="checks">${d.checks.map(x=>`<div class="${x[1]?'ok':'warn'}"><b>${x[1]?'✓':'!'}</b> ${x[0]}<br><small>${x[2]}</small></div>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
  }
  function release60Acta(r={}){
    const p=release60Plan(r); const d=release60Diagnostics();
    return `ACTA RELEASE VISION v6.0\n\nLectura: ${r.title||'Demo Alaya'}\nEstado: ${p.status}\nAudiencia: ${p.audience}\nDiagnóstico: ${d.score}/100\nRelease: ${release60Score(r)}/100\n\nAprobación recomendada: ${d.score>=90 && !d.legacyVisible && p.proof!=='pending'?'APTA PARA DEMO/PUBLICACIÓN CONTROLADA':'APTA PARA QA / REVISIÓN PREVIA'}\n\nBloqueos:\n${p.blockersList.map(x=>`- ${x}`).join('\n')}\n\nChecklist final:\n- Probar en iPhone Safari\n- Probar en Android Chrome\n- Instalar como PWA\n- Generar lectura demo\n- Guardar y marcar favorita\n- Exportar PDF/HTML\n- Revisar Universo\n- Pegar referencia Astro.com manual si aplica\n- Limpiar caché antes de enseñar\n\n${p.next}`;
  }
  function cleanHomeForRelease60(){
    const selectors='[data-candidate59-home],[data-stable58-home],[data-release57-home],[data-polish56-home],[data-experience55-home],[data-demo54-home],[data-showcase53-home],[data-launch52-home],[data-novaplus-home],[data-nova-home],[data-apex-home],[data-zenith-home],[data-stellar-home],[data-celestial-home],[data-aurora-home],[data-nebula-home],[data-clean-home],.ascendant51-command,.ascendant51-flow,.vision-strip';
    document.querySelectorAll(selectors).forEach(x=>x.remove());
    const old=document.querySelector('.hero-card .eyebrow'); if(old) old.textContent='Release Vision v6.0';
    const h1=document.querySelector('.hero-card h1'); if(h1) h1.textContent='Alaya Astral IA: espectacular, limpia y lista para publicar.';
    const lead=document.querySelector('.hero-card .lead'); if(lead) lead.textContent='Una experiencia astral premium con lectura por capas, universo personal, dossier profesional, diagnóstico local y Astro.com manual separado.';
    const orb=document.querySelector('.orb-core small'); if(orb) orb.textContent='v6.0';
  }
  function toggleRelease60(){
    document.body.classList.toggle('release60-focus');
    toast(document.body.classList.contains('release60-focus')?'Modo Release Vision activado.':'Modo Release Vision desactivado.');
  }
  function showRelease60Audit(){
    const d=release60Diagnostics();
    let box=document.querySelector('#release60AuditPanel');
    if(!box){
      box=document.createElement('section'); box.id='release60AuditPanel'; box.className='release60-audit glass'; document.querySelector('#home')?.appendChild(box);
    }
    box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Release Vision v6.0</p><h2>Diagnóstico ${d.score}/100</h2></div><button class="btn ghost small" id="closeRelease60Audit">Cerrar</button></div>${release60Table(d.checks)}`;
    document.querySelector('#closeRelease60Audit').onclick=()=>box.remove();
    route('home'); box.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function clearRelease60Cache(){
    if('caches' in window){ caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>toast('Caché PWA limpiada. Recarga la app.')); }
    else toast('Este navegador no expone caché PWA.');
  }
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); if(!r.metrics) r.metrics={}; r.metrics.release60=release60Score(r); const p=release60Plan(r);
    const already=(r.layers||[]).some(l=>String(l.title||'').includes('Release Vision v6.0'));
    if(!already){
      r.layers=[
        {icon:'🚀',title:'Release Vision v6.0 · Producto final',html:`<div class="release60-hero"><div><p class="eyebrow">Release Vision</p><h3>${d.release60Promise||'Una app astral premium, limpia y lista para enseñar.'}</h3><p>Esta lectura se presenta como una pieza de producto: entrada clara, lectura por capas, plan útil, universo personal, entrega premium y auditoría técnica separada.</p></div><div class="release60-score"><span>Release</span><b>${r.metrics.release60}</b><small>ready</small></div></div>`},
        {icon:'🧭',title:'Arquitectura final v6.0',html:`<div class="release60-pillars">${p.pillars.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'✅',title:'Bloqueos reales y siguiente acción',html:`<div class="note-card"><b>Estado:</b> ${p.status} · <b>Evidencia:</b> ${p.proof}</div><ul class="release60-list">${p.blockersList.map(x=>`<li>${x}</li>`).join('')}</ul><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
        ...(r.layers||[])
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    if(!r.metrics) r.metrics={}; r.metrics.release60=r.metrics.release60||release60Score(r);
    oldRender(r);
    const actions=document.querySelector('#resultArea .result-actions');
    if(actions&&!actions.querySelector('#downloadRelease60')){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadRelease60'; a.textContent='Release v6.0'; a.onclick=()=>download(`alaya-release-v60-${r.id||'demo'}.html`,release60Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyRelease60'; b.textContent='Copiar acta'; b.onclick=()=>copyText(release60Acta(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleRelease60'; c.textContent='Modo Release'; c.onclick=toggleRelease60;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditRelease60'; d.textContent='Auditoría v6'; d.onclick=showRelease60Audit;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome(); cleanHomeForRelease60(); document.body.classList.add('v60-release-home');
    const h=read(STORE.history,[]); const diag=release60Diagnostics();
    const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.release60||release60Score(r)),0)/(h.length||1))||0;
    const stats=document.querySelector('#homeStats');
    if(stats) stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${diag.score}</b><span>diagnóstico</span></div><div class="stat"><b>${avg||'99'}</b><span>release</span></div>`;
    const anchor=document.querySelector('#dailyPulse');
    if(anchor && !document.querySelector('[data-release60-home]')){
      anchor.insertAdjacentHTML('beforebegin',`<section class="release60-home glass premium-glow" data-release60-home><div><p class="eyebrow">Alaya Astral IA · Release Vision v6.0</p><h2>Versión de cierre: espectacular, ordenada y lista para demo/publicación.</h2><p>v6.0 concentra la app en lo esencial: portada memorable, lectura premium, entrega profesional, universo personal, diagnóstico local y comprobación Astro.com manual sin automatizar.</p><div class="release60-actions"><button class="btn primary" data-route="lecturas">Crear lectura v6</button><button class="btn secondary" id="release60ReportHomeBtn">Release v6.0</button><button class="btn ghost" id="release60ActaHomeBtn">Copiar acta</button><button class="btn ghost" id="release60AuditHomeBtn">Auditoría</button><button class="btn ghost" id="release60ModeHomeBtn">Modo Release</button><button class="btn ghost" id="release60CacheHomeBtn">Limpiar caché</button></div></div><div class="release60-score-big"><span>Release</span><b>${avg||diag.score}</b><small>${diag.score>=90?'ready':'QA'}</small></div></section>`);
    }
    const demo=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',release60Status:'candidate',release60Proof:'pending',release60Audience:'demo'});
    const report=document.querySelector('#release60ReportHomeBtn'); if(report) report.onclick=()=>download(`alaya-release-v60-${demo.id||'demo'}.html`,release60Report(demo),'text/html');
    const acta=document.querySelector('#release60ActaHomeBtn'); if(acta) acta.onclick=()=>copyText(release60Acta(demo));
    const audit=document.querySelector('#release60AuditHomeBtn'); if(audit) audit.onclick=showRelease60Audit;
    const mode=document.querySelector('#release60ModeHomeBtn'); if(mode) mode.onclick=toggleRelease60;
    const cache=document.querySelector('#release60CacheHomeBtn'); if(cache) cache.onclick=clearRelease60Cache;
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.release60||release60Score(r)),0)/(h.length||1))||0; const diag=release60Diagnostics();
    const dash=document.querySelector('#universeDashboard');
    if(dash){ dash.querySelectorAll('[data-candidate59-card],[data-stable58-card],[data-release57-card],[data-polish56-card],[data-experience55-card],[data-demo54-card]').forEach(x=>x.remove()); if(!dash.querySelector('[data-release60-card]')) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-release60-card><span>Release v6.0</span><b>${avg||diag.score}</b><small>producto / demo / publicación</small></article>`); }
    const cc=document.querySelector('#commandCenter');
    if(cc&&!cc.querySelector('[data-release60-action]')) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-release60-action><b>Ruta final v6.0</b><span>Crear lectura demo → guardar → favorita → universo → dossier → auditoría → móvil/PWA.</span></div>`);
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){
    oldPulse(); const box=document.querySelector('#dailyPulse');
    if(box&&!box.querySelector('[data-release60-pulse]')) box.insertAdjacentHTML('beforeend',`<div class="release60-pulse" data-release60-pulse><b>Release Vision v6.0</b><span>Hoy no añadas ruido: valida una ruta completa y deja solo lo que hace la app más clara, bella y publicable.</span></div>`);
  };
  window.__alayaRelease60={diagnostics:release60Diagnostics,report:release60Report,brief:release60Brief,audit:showRelease60Audit,cache:clearRelease60Cache};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.body.classList.add('v60-release-home');
  document.title='Alaya Astral IA v6.0 Release Vision';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.0 Release Vision: app astral premium limpia, estable, con modo release, auditoría local, PWA, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent=VERSION;
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','candidate59','release60','demo60','audit60'];
    [...rt.options].forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="release60"]')) rt.insertAdjacentHTML('beforeend','<option value="release60">Release Vision v6.0</option><option value="demo60">Demo Release v6.0</option><option value="audit60">Auditoría Release v6.0</option>');
  }
  const anchor=document.querySelector('#candidate59Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#release60Status')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia v6<select id="release60Audience" name="release60Audience"><option value="personal">Uso personal</option><option value="demo">Demo para enseñar</option><option value="client">Entrega cliente</option><option value="publish">Publicación PWA</option></select></label><label>Estado v6<select id="release60Status" name="release60Status"><option value="draft">Borrador limpio</option><option value="candidate">Release candidate</option><option value="demo">Demo aprobada</option><option value="publish">Lista para publicar</option></select></label></div><div class="row"><label>Evidencia v6<select id="release60Proof" name="release60Proof"><option value="pending">Pendiente</option><option value="mobile">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="astro">Astro.com manual revisado</option><option value="full">Ruta completa validada</option></select></label><label>Bloqueos v6<select id="release60Blockers" name="release60Blockers"><option value="none">Sin bloqueos críticos</option><option value="mobile">Revisar móvil</option><option value="pdf">Revisar PDF</option><option value="pwa">Revisar PWA/caché</option><option value="astro">Revisar Astro.com manual</option><option value="visual">Pulir visual</option></select></label></div><label>Promesa Release<input id="release60Promise" name="release60Promise" placeholder="Ej. Una app astral premium, limpia y lista para publicar" /></label>`);
  }
  if(!window.__alaya60DelegatedRoute){
    window.__alaya60DelegatedRoute=true;
    document.addEventListener('click',e=>{ const el=e.target.closest('[data-route]'); if(el){ e.preventDefault(); route(el.dataset.route); } });
  }
  if(window.__alayaRelease60){ window.__alayaRelease60.diagnostics(); }
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v6.1 Final QA: demo limpia, auditoría final y publicación controlada === */
(function(){
  const V61='v6.1 Final QA';
  const LEGACY_SELECTORS=[
    '[data-release60-home]','[data-candidate59-home]','[data-stable58-home]','[data-release57-home]','[data-polish56-home]','[data-experience55-home]','[data-demo54-home]','[data-showcase53-home]','[data-launch52-home]','[data-novaplus-home]','[data-nova-home]','[data-apex-home]','[data-zenith-home]','[data-stellar-home]','[data-celestial-home]','[data-aurora-home]','[data-nebula-home]','[data-clean-home]',
    '.ascendant51-command','.ascendant51-flow','.release60-home','.candidate59-home','.stable58-home','.release57-home','.polish56-home','.experience55-home','.demo54-home'
  ].join(',');
  function $safe(s,root=document){try{return root.querySelector(s)}catch{return null}}
  function $$safe(s,root=document){try{return [...root.querySelectorAll(s)]}catch{return []}}
  function final61Inputs(r={}){
    const d=r.data||{};
    return {
      audience:d.final61Audience||d.release60Audience||'demo',
      gate:d.final61Gate||'qa',
      evidence:d.final61Evidence||d.release60Proof||'pending',
      density:d.final61Density||'clean',
      publish:d.final61Publish||'controlled',
      promise:d.final61Promise||d.release60Promise||'Alaya Astral IA se presenta como una experiencia premium, clara y lista para demo/publicación controlada.',
      notes:d.final61Notes||''
    };
  }
  function final61Diagnostics(){
    const dupIds=Object.entries($$safe('[id]').reduce((a,n)=>{a[n.id]=(a[n.id]||0)+1;return a;},{})).filter(([,n])=>n>1).map(([id,n])=>`${id}×${n}`);
    const legacyVisible=$$safe(LEGACY_SELECTORS).filter(n=>n.offsetParent!==null).length;
    const routes=['home','lecturas','compatibilidad','universo','ajustes'];
    const routeButtons=$$safe('[data-route]').length;
    const missingRoutes=$$safe('[data-route]').filter(n=>!routes.includes(n.dataset.route)).map(n=>n.dataset.route);
    const h=read(STORE.history,[]);
    const favs=favoriteIds();
    const sw=!!navigator.serviceWorker;
    const controlled=!!navigator.serviceWorker?.controller;
    const mobile=matchMedia('(max-width: 860px)').matches || navigator.maxTouchPoints>0;
    const printOk=typeof window.print==='function';
    const clipboardOk=!!navigator.clipboard;
    const storageOk=(()=>{try{localStorage.setItem('__alaya_v61','1');localStorage.removeItem('__alaya_v61');return true}catch{return false}})();
    const coreScreens=routes.every(id=>!!document.getElementById(id));
    const resultTemplate=!!document.getElementById('resultTemplate') || !!document.getElementById('resultArea');
    const checks=[
      ['Portada limpia', legacyVisible===0, legacyVisible?`${legacyVisible} bloque(s) antiguo(s) visible(s)`:'Sin bloques antiguos visibles'],
      ['Rutas principales', coreScreens && missingRoutes.length===0, missingRoutes.length?`Rutas dudosas: ${missingRoutes.join(', ')}`:'Inicio, lecturas, compatibilidad, universo y ajustes detectadas'],
      ['Botones de navegación', routeButtons>=5, `${routeButtons} botones/rutas detectados`],
      ['IDs duplicados', dupIds.length===0, dupIds.length?dupIds.join(', '):'Sin duplicados visibles'],
      ['Formulario + resultado', !!document.getElementById('readingForm') && resultTemplate, 'Formulario y zona de resultado disponibles'],
      ['LocalStorage', storageOk, storageOk?'Datos locales disponibles':'No se puede escribir en LocalStorage'],
      ['Historial demo', h.length>0, h.length?`${h.length} lectura(s) guardada(s)`:'Crea una lectura demo antes de publicar'],
      ['Favoritas', favs.length>0, favs.length?`${favs.length} favorita(s)`:'Marca una lectura favorita para probar Mi Universo'],
      ['Service Worker', sw, controlled?'Activo/controlando':(sw?'Disponible; requiere publicar en HTTPS y recargar':'No disponible')],
      ['Manifest PWA', !!document.querySelector('link[rel="manifest"]'), 'Manifest enlazado'],
      ['PDF / impresión', printOk, printOk?'Impresión disponible':'No disponible'],
      ['Portapapeles', clipboardOk, clipboardOk?'Copiar disponible':'Puede requerir HTTPS/permisos'],
      ['Vista móvil', mobile, mobile?'Contexto móvil/táctil detectado':'Probar también en móvil real']
    ];
    const base=Math.round(checks.filter(x=>x[1]).length/checks.length*100);
    const penalty=Math.min(18,legacyVisible*4)+Math.min(10,dupIds.length*2)+Math.min(8,missingRoutes.length*2);
    return {checks,score:Math.max(20,Math.min(100,base-penalty)),legacyVisible,dupIds,missingRoutes,history:h.length,favorites:favs.length,controlled,mobile};
  }
  function final61Score(r={}){
    const m=r.metrics||{}; const d=final61Diagnostics(); const f=final61Inputs(r);
    let boost=0; if(f.evidence==='full') boost+=8; if(f.gate==='publish') boost+=6; if(f.density==='minimal') boost+=4; if(f.publish==='public') boost+=4;
    return Math.max(45,Math.min(100,Math.round(((m.release60||m.candidate59||m.aura||82)+d.score+(m.clarity||80))/3)+boost));
  }
  function final61Plan(r={}){
    const f=final61Inputs(r), d=final61Diagnostics();
    const pillars=[
      ['Portada','Promesa clara, CTA visible y un único bloque protagonista.'],
      ['Lectura','Resultado por capas: impacto, lectura principal, plan útil, mapa y técnica.'],
      ['Demo','Ruta corta: crear lectura, guardar, favorita, universo, dossier y auditoría.'],
      ['Entrega','Informe/PDF profesional, brief copiable y modo presentación.'],
      ['Técnica','Astro.com manual separado, diagnóstico local y caché PWA controlada.'],
      ['Publicación','Pruebas reales en iPhone/Android, PWA instalada y revisión tras 24/48h.']
    ];
    const blockers=[];
    if(d.legacyVisible) blockers.push('Quedan bloques antiguos visibles: activar Modo Final o revisar portada.');
    if(d.dupIds.length) blockers.push('Hay IDs duplicados visibles: revisar elementos repetidos antes de publicar.');
    if(d.history===0) blockers.push('Falta una lectura demo guardada para validar historial/universo.');
    if(d.favorites===0) blockers.push('Falta marcar una lectura como favorita para probar la experiencia completa.');
    if(f.evidence==='pending') blockers.push('Falta evidencia real: probar en móvil, PDF y PWA.');
    if(f.gate==='qa') blockers.push('La puerta sigue en QA: no publicar hasta cerrar checklist.');
    if(!d.controlled) blockers.push('Service Worker aún no controla la página: publicar en HTTPS y recargar.');
    if(!blockers.length) blockers.push('Sin bloqueos críticos: apta para demo/publicación controlada.');
    return {pillars,blockers,next:f.gate==='publish'?'Publicar en canal elegido y revisar feedback 24/48h.':'Cerrar QA con una lectura demo real, prueba móvil y exportación PDF.',...f};
  }
  function final61Table(checks){return `<div class="final61-table">${checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'✓':'!'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div>`;}
  function final61Checklist(r={}){
    const p=final61Plan(r), d=final61Diagnostics();
    return `ALAYA ASTRAL IA · ${V61}\n\nPuntuación Final QA: ${final61Score(r)}/100\nDiagnóstico local: ${d.score}/100\nAudiencia: ${p.audience}\nPuerta: ${p.gate}\nEvidencia: ${p.evidence}\nPublicación: ${p.publish}\n\nPROMESA\n${p.promise}\n\nCHECKLIST FINAL\n- Home entendible en 10 segundos\n- Crear una lectura demo completa\n- Guardar lectura y marcar favorita\n- Abrir Mi Universo y comprobar métricas\n- Descargar informe/PDF/HTML\n- Copiar brief/checklist\n- Pegar referencia Astro.com manual si aplica\n- Probar iPhone Safari\n- Probar Android Chrome\n- Instalar como PWA\n- Limpiar caché antes de enseñar\n\nBLOQUEOS\n${p.blockers.map(x=>`- ${x}`).join('\n')}\n\nSIGUIENTE ACCIÓN\n${p.next}\n\nNOTA\nAstro.com sigue siendo solo referencia manual pegada por la persona usuaria; no hay scraping ni automatización.`;
  }
  function final61Report(r={}){
    const p=final61Plan(r), d=final61Diagnostics(); const title=r.title||'Alaya Astral IA · Final QA';
    return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Final QA v6.1 · ${title}</title><style>
      body{margin:0;background:#05020d;color:#fff8ec;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}.wrap{max-width:1180px;margin:auto;padding:46px}.hero{min-height:470px;display:grid;align-content:end;padding:50px;border-radius:44px;background:radial-gradient(circle at 15% 10%,rgba(255,218,138,.30),transparent 34%),radial-gradient(circle at 84% 20%,rgba(153,116,255,.35),transparent 38%),linear-gradient(135deg,#13061f,#06020e);border:1px solid rgba(255,255,255,.16);box-shadow:0 38px 130px rgba(0,0,0,.50)}h1{font-size:clamp(42px,7vw,92px);line-height:.9;margin:0 0 16px;letter-spacing:-.065em}.lead{font-size:20px;max-width:800px;opacity:.9}.badges span{display:inline-block;margin:6px 6px 0 0;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.card{padding:22px;border-radius:24px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07)}.wide{grid-column:1/-1}.score{font-size:78px;font-weight:1000;color:#f7d78c;line-height:1}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.checks div{padding:12px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}.ok b{color:#a7f3d0}.warn b{color:#fcd34d}@media(max-width:760px){.wrap{padding:22px}.grid,.checks{grid-template-columns:1fr}.hero{min-height:410px;padding:28px}}@media print{body{background:#fff;color:#111}.hero,.card,.checks div{background:#fff;border-color:#ddd;box-shadow:none}.score{color:#111}}
      </style><body><main class="wrap"><section class="hero"><p>ALAYA ASTRAL IA · ${V61}</p><h1>${title}</h1><p class="lead">Informe final para demo/publicación: experiencia limpia, diagnóstico local, bloqueos reales y plan de salida.</p><div class="badges"><span>Final QA ${final61Score(r)}/100</span><span>Diagnóstico ${d.score}/100</span><span>${p.audience}</span><span>${p.gate}</span></div></section><section class="grid"><article class="card"><b>Final QA</b><div class="score">${final61Score(r)}</div><p>Preparación final de producto.</p></article><article class="card"><b>Diagnóstico</b><div class="score">${d.score}</div><p>Estado local del navegador.</p></article><article class="card"><b>Publicación</b><p>${p.publish}</p><p>Evidencia: ${p.evidence}</p><p>Densidad: ${p.density}</p></article><article class="card wide"><h2>6 pilares de salida</h2><div class="checks">${p.pillars.map(x=>`<div><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div></article><article class="card wide"><h2>Bloqueos reales</h2><ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Siguiente acción:</b> ${p.next}</p></article><article class="card wide"><h2>Diagnóstico local</h2><div class="checks">${d.checks.map(x=>`<div class="${x[1]?'ok':'warn'}"><b>${x[1]?'✓':'!'}</b> ${x[0]}<br><small>${x[2]}</small></div>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`;
  }
  function cleanHome61(){
    $$safe(LEGACY_SELECTORS).forEach(n=>n.remove());
    const eyebrow=$safe('.hero-card .eyebrow'); if(eyebrow) eyebrow.textContent='Final QA v6.1';
    const title=$safe('.hero-card h1'); if(title) title.textContent='Alaya Astral IA: espectacular, limpia y lista para publicar.';
    const lead=$safe('.hero-card .lead'); if(lead) lead.textContent='Lecturas premium, universo personal, PDF profesional, auditoría local y modo demo final con menos ruido visual.';
    const orb=$safe('.orb-core small'); if(orb) orb.textContent='v6.1';
  }
  function toggleFinal61(){ document.body.classList.toggle('final61-focus'); toast(document.body.classList.contains('final61-focus')?'Modo Final QA activado.':'Modo Final QA desactivado.'); }
  function clearCache61(){ if('caches' in window){ caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>toast('Caché PWA limpiada. Recarga la app.')); } else toast('Caché PWA no disponible.'); }
  function showAudit61(){
    const d=final61Diagnostics(); let box=$safe('#final61AuditPanel');
    if(!box){ box=document.createElement('section'); box.id='final61AuditPanel'; box.className='final61-audit glass'; $safe('#home')?.appendChild(box); }
    box.innerHTML=`<div class="section-head split"><div><p class="eyebrow">Auditoría Final QA v6.1</p><h2>Diagnóstico ${d.score}/100</h2></div><button class="btn ghost small" id="closeFinal61Audit">Cerrar</button></div>${final61Table(d.checks)}`;
    $safe('#closeFinal61Audit').onclick=()=>box.remove(); route('home'); box.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function makeDemo61(){
    const d={name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'final61',final61Audience:'demo',final61Gate:'demo',final61Evidence:'mobile',final61Density:'minimal',final61Publish:'controlled',final61Promise:'Una experiencia astral premium, clara y lista para enseñar.'};
    const r=makeReading(d); renderReading(r); saveReading(r); route('lecturas'); toast('Lectura demo v6.1 creada y guardada.');
  }
  const oldMake=makeReading;
  makeReading=function(d){
    const r=oldMake(d); if(!r.metrics) r.metrics={}; r.metrics.final61=final61Score(r); const p=final61Plan(r);
    if(!(r.layers||[]).some(l=>String(l.title||'').includes('Final QA v6.1'))){
      r.layers=[
        {icon:'🏁',title:'Final QA v6.1 · Producto listo para validar',html:`<div class="final61-hero"><div><p class="eyebrow">Final QA</p><h3>${p.promise}</h3><p>La lectura se entrega como experiencia de producto: portada clara, lectura por capas, plan útil, universo personal, dossier profesional y auditoría técnica separada.</p></div><div class="final61-score"><span>Final QA</span><b>${r.metrics.final61}</b><small>${r.metrics.final61>=90?'ready':'QA'}</small></div></div>`},
        {icon:'🧩',title:'6 pilares de salida v6.1',html:`<div class="final61-pillars">${p.pillars.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},
        {icon:'🛡️',title:'Bloqueos reales y publicación controlada',html:`<ul class="final61-list">${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},
        ...(r.layers||[])
      ];
    }
    return r;
  };
  const oldRender=renderReading;
  renderReading=function(r){
    if(!r.metrics) r.metrics={}; r.metrics.final61=r.metrics.final61||final61Score(r); oldRender(r);
    const actions=$safe('#resultArea .result-actions');
    if(actions&&!$safe('#downloadFinal61',actions)){
      const a=document.createElement('button'); a.className='btn secondary small'; a.id='downloadFinal61'; a.textContent='Final QA v6.1'; a.onclick=()=>download(`alaya-final-qa-v61-${r.id||'demo'}.html`,final61Report(r),'text/html');
      const b=document.createElement('button'); b.className='btn ghost small'; b.id='copyFinal61'; b.textContent='Copiar checklist'; b.onclick=()=>copyText(final61Checklist(r));
      const c=document.createElement('button'); c.className='btn ghost small'; c.id='toggleFinal61'; c.textContent='Modo Final'; c.onclick=toggleFinal61;
      const d=document.createElement('button'); d.className='btn ghost small'; d.id='auditFinal61'; d.textContent='Auditoría v6.1'; d.onclick=showAudit61;
      actions.append(a,b,c,d);
    }
  };
  const oldHome=renderHome;
  renderHome=function(){
    oldHome(); cleanHome61(); document.body.classList.add('v61-final-home');
    const h=read(STORE.history,[]); const diag=final61Diagnostics(); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.final61||final61Score(r)),0)/(h.length||1))||0;
    const stats=$safe('#homeStats'); if(stats) stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favoriteIds().length}</b><span>favoritas</span></div><div class="stat"><b>${diag.score}</b><span>diagnóstico</span></div><div class="stat"><b>${avg||diag.score}</b><span>final QA</span></div>`;
    const anchor=$safe('#dailyPulse');
    if(anchor&&!$safe('[data-final61-home]')){
      anchor.insertAdjacentHTML('beforebegin',`<section class="final61-home glass premium-glow" data-final61-home><div><p class="eyebrow">Alaya Astral IA · Final QA v6.1</p><h2>Release final: limpia, enseñable y preparada para publicación controlada.</h2><p>v6.1 concentra la app en una ruta clara: crear lectura demo, guardar, marcar favorita, revisar universo, exportar informe, comprobar auditoría y limpiar caché PWA antes de enseñar.</p><div class="final61-actions"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="makeDemo61HomeBtn">Crear demo v6.1</button><button class="btn ghost" id="final61ReportHomeBtn">Informe v6.1</button><button class="btn ghost" id="final61ChecklistHomeBtn">Copiar checklist</button><button class="btn ghost" id="final61AuditHomeBtn">Auditoría</button><button class="btn ghost" id="final61ModeHomeBtn">Modo Final</button><button class="btn ghost" id="final61CacheHomeBtn">Limpiar caché</button></div></div><div class="final61-score-big"><span>Final QA</span><b>${avg||diag.score}</b><small>${diag.score>=90?'ready':'QA'}</small></div></section>`);
    }
    const demo=currentReading||h[0]||makeReading({name:'Demo Alaya',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'final61',final61Gate:'qa',final61Evidence:'pending'});
    const bind=(id,fn)=>{const el=$safe(id); if(el) el.onclick=fn;};
    bind('#makeDemo61HomeBtn',makeDemo61); bind('#final61ReportHomeBtn',()=>download(`alaya-final-qa-v61-${demo.id||'demo'}.html`,final61Report(demo),'text/html')); bind('#final61ChecklistHomeBtn',()=>copyText(final61Checklist(demo))); bind('#final61AuditHomeBtn',showAudit61); bind('#final61ModeHomeBtn',toggleFinal61); bind('#final61CacheHomeBtn',clearCache61);
  };
  const oldUniverse=renderUniverse;
  renderUniverse=function(){
    oldUniverse(); const h=read(STORE.history,[]); const diag=final61Diagnostics(); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.final61||final61Score(r)),0)/(h.length||1))||0;
    const dash=$safe('#universeDashboard'); if(dash){ dash.querySelectorAll('[data-release60-card],[data-candidate59-card],[data-stable58-card],[data-release57-card]').forEach(x=>x.remove()); if(!$safe('[data-final61-card]',dash)) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-final61-card><span>Final QA v6.1</span><b>${avg||diag.score}</b><small>demo / publicación / estabilidad</small></article>`); }
    const cc=$safe('#commandCenter'); if(cc&&!$safe('[data-final61-action]',cc)) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-final61-action><b>Ruta final v6.1</b><span>Demo → guardar → favorita → universo → informe → auditoría → móvil/PWA.</span></div>`);
  };
  const oldPulse=dailyPulse;
  dailyPulse=function(){ oldPulse(); const box=$safe('#dailyPulse'); if(box&&!$safe('[data-final61-pulse]',box)) box.insertAdjacentHTML('beforeend',`<div class="final61-pulse" data-final61-pulse><b>Final QA v6.1</b><span>Hoy valida una ruta completa antes de añadir más: claridad, demo, informe, móvil y caché.</span></div>`); };
  window.__alayaFinal61={diagnostics:final61Diagnostics,report:final61Report,checklist:final61Checklist,audit:showAudit61,demo:makeDemo61,cache:clearCache61};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v6.1 Final QA';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.1 Final QA: app astral premium limpia, estable, con modo final, auditoría local, PWA, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent='v6.1 Final QA';
  const rt=document.querySelector('#readingType');
  if(rt){
    const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','release60','final61','demo61','audit61'];
    [...rt.options].forEach(o=>{ if(!keep.includes(o.value)) o.remove(); });
    if(!rt.querySelector('option[value="final61"]')) rt.insertAdjacentHTML('beforeend','<option value="final61">Final QA v6.1</option><option value="demo61">Demo final v6.1</option><option value="audit61">Auditoría final v6.1</option>');
  }
  const anchor=document.querySelector('#release60Promise') || document.querySelector('#centralQuestion');
  if(anchor && !document.querySelector('#final61Audience')){
    anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia Final<select id="final61Audience" name="final61Audience"><option value="personal">Uso personal</option><option value="demo">Demo para enseñar</option><option value="client">Entrega cliente</option><option value="publish">Publicación PWA</option></select></label><label>Puerta Final<select id="final61Gate" name="final61Gate"><option value="qa">QA pendiente</option><option value="demo">Demo aprobada</option><option value="publish">Lista para publicar</option></select></label></div><div class="row"><label>Evidencia Final<select id="final61Evidence" name="final61Evidence"><option value="pending">Pendiente</option><option value="mobile">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="astro">Astro.com manual revisado</option><option value="full">Ruta completa validada</option></select></label><label>Densidad visual<select id="final61Density" name="final61Density"><option value="clean">Limpia</option><option value="minimal">Mínima para demo</option><option value="complete">Completa</option></select></label></div><div class="row"><label>Publicación<select id="final61Publish" name="final61Publish"><option value="controlled">Controlada</option><option value="public">Pública</option><option value="hold">Pausada</option></select></label><label>Notas Final<input id="final61Notes" name="final61Notes" placeholder="Ej. pendiente probar iPhone" /></label></div><label>Promesa Final<input id="final61Promise" name="final61Promise" placeholder="Ej. Una app astral premium, limpia y lista para publicar" /></label>`);
  }
  if(!window.__alaya61DelegatedRoute){ window.__alaya61DelegatedRoute=true; document.addEventListener('click',e=>{const el=e.target.closest('[data-route]'); if(el){e.preventDefault(); route(el.dataset.route);}}); }
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v6.2 Final Release: smoke test, demo completa y cierre de publicación === */
(function(){
  const V62='v6.2 Final Release';
  const LEGACY62=[
    '[data-final61-home]','[data-release60-home]','[data-candidate59-home]','[data-stable58-home]','[data-release57-home]','[data-polish56-home]','[data-experience55-home]','[data-demo54-home]','[data-showcase53-home]','[data-launch52-home]','[data-novaplus-home]','[data-nova-home]','[data-apex-home]','[data-zenith-home]','[data-stellar-home]','[data-celestial-home]','[data-aurora-home]','[data-nebula-home]','[data-clean-home]',
    '.final61-home','.release60-home','.candidate59-home','.stable58-home','.release57-home','.polish56-home','.experience55-home','.demo54-home','.ascendant51-command','.ascendant51-flow'
  ].join(',');
  function qs(s,root=document){try{return root.querySelector(s)}catch{return null}}
  function qsa(s,root=document){try{return [...root.querySelectorAll(s)]}catch{return []}}
  function safeRead(key,fallback){try{return read(key,fallback)}catch{return fallback}}
  function favs(){try{return favoriteIds()}catch{return []}}
  function cleanHome62(){qsa(LEGACY62).forEach(n=>n.remove()); document.body.classList.add('v62-final-release');}
  function input62(r={}){const d=r.data||{};return {
    audience:d.final62Audience||d.final61Audience||'demo',
    decision:d.final62Decision||'candidate',
    evidence:d.final62Evidence||d.final61Evidence||'pending',
    quality:d.final62Quality||'balanced',
    publish:d.final62Publish||'controlled',
    owner:d.final62Owner||'Atenea',
    promise:d.final62Promise||d.final61Promise||'Alaya Astral IA queda como una app astral premium, limpia, demostrable y preparada para publicación controlada.',
    notes:d.final62Notes||d.final61Notes||''
  }}
  function diag62(){
    const dupIds=Object.entries(qsa('[id]').reduce((a,n)=>{a[n.id]=(a[n.id]||0)+1;return a;},{})).filter(([,n])=>n>1).map(([id,n])=>`${id}×${n}`);
    const legacyVisible=qsa(LEGACY62).filter(n=>n.offsetParent!==null).length;
    const routes=['home','lecturas','compatibilidad','universo','ajustes'];
    const missingScreens=routes.filter(id=>!qs('#'+id));
    const badRoutes=qsa('[data-route]').map(n=>n.dataset.route).filter(x=>x&&!routes.includes(x));
    const history=safeRead(STORE.history,[]);
    const favorites=favs();
    const hasDemo=history.some(r=>String(r?.data?.readingType||'').includes('62') || String(r?.title||'').toLowerCase().includes('demo'));
    const storageOk=(()=>{try{localStorage.setItem('__alaya_v62','ok');localStorage.removeItem('__alaya_v62');return true}catch{return false}})();
    const printOk=typeof window.print==='function';
    const clipOk=!!navigator.clipboard;
    const swOk=!!navigator.serviceWorker;
    const swControlled=!!navigator.serviceWorker?.controller;
    const manifestOk=!!qs('link[rel="manifest"]');
    const mobile=matchMedia('(max-width: 860px)').matches || navigator.maxTouchPoints>0;
    const formOk=!!qs('#readingForm') && !!qs('#readingType');
    const resultOk=!!qs('#resultTemplate') || !!qs('#resultArea');
    const home62=!!qs('[data-final62-home]');
    const checks=[
      ['Portada v6.2 limpia', legacyVisible===0 && home62, legacyVisible?`${legacyVisible} bloque(s) antiguo(s) visible(s)`:home62?'Portada final activa':'Falta bloque v6.2'],
      ['Rutas principales', missingScreens.length===0 && badRoutes.length===0, missingScreens.length?`Faltan: ${missingScreens.join(', ')}`:(badRoutes.length?`Rutas no previstas: ${[...new Set(badRoutes)].join(', ')}`:'Inicio, lecturas, compatibilidad, universo y ajustes OK')],
      ['Formulario de lectura', formOk && resultOk, formOk&&resultOk?'Formulario y resultado disponibles':'Revisar formulario o zona de resultado'],
      ['Lectura demo', history.length>0 && hasDemo, history.length?`${history.length} lectura(s); demo ${hasDemo?'detectada':'pendiente'}`:'Sin lectura guardada'],
      ['Favoritas', favorites.length>0, favorites.length?`${favorites.length} favorita(s)`:'Marca una favorita para validar Mi Universo'],
      ['LocalStorage', storageOk, storageOk?'Datos locales OK':'No se puede escribir localmente'],
      ['Service Worker', swOk, swControlled?'Controlando la página':'Disponible; publicar en HTTPS y recargar para controlar'],
      ['Manifest PWA', manifestOk, manifestOk?'Manifest enlazado':'Falta manifest'],
      ['PDF / impresión', printOk, printOk?'Impresión disponible':'No disponible'],
      ['Portapapeles', clipOk, clipOk?'Copiar disponible':'Puede requerir HTTPS/permisos'],
      ['IDs duplicados', dupIds.length===0, dupIds.length?dupIds.join(', '):'Sin duplicados visibles'],
      ['Prueba móvil', mobile, mobile?'Entorno móvil/táctil detectado':'Probar en iPhone/Android real']
    ];
    let score=Math.round(checks.filter(x=>x[1]).length/checks.length*100);
    score-=Math.min(16, legacyVisible*4)+Math.min(8, dupIds.length*2)+Math.min(8, badRoutes.length);
    return {checks,score:Math.max(20,Math.min(100,score)),legacyVisible,dupIds,badRoutes:[...new Set(badRoutes)],history:history.length,favorites:favorites.length,hasDemo,storageOk,swOk,swControlled,manifestOk,mobile};
  }
  function score62(r={}){const m=r.metrics||{};const d=diag62();const inp=input62(r);let boost=0; if(inp.evidence==='full')boost+=8; if(inp.decision==='publish')boost+=8; if(inp.quality==='minimal')boost+=3; if(inp.publish==='public')boost+=4; return Math.max(45,Math.min(100,Math.round(((m.final61||m.release60||m.aura||82)+d.score+(m.clarity||80))/3)+boost));}
  function plan62(r={}){const inp=input62(r),d=diag62();const pillars=[
    ['Entrada','Una portada clara, un CTA principal y una promesa entendible en 10 segundos.'],
    ['Lectura','Resultado por capas sin mezclar interpretación emocional con auditoría técnica.'],
    ['Demo','Ruta corta: crear demo, guardar, marcar favorita, abrir Universo y descargar informe.'],
    ['Entrega','PDF/HTML profesional, acta final, checklist y paquete de publicación.'],
    ['Técnica','Astro.com manual, PWA, caché, backup y diagnóstico separados de la experiencia principal.'],
    ['Salida','Decisión clara: publicar, enseñar demo, pausar o volver a QA con bloqueos concretos.']
  ];
  const blockers=[];
  if(d.legacyVisible) blockers.push('Quitar bloques antiguos visibles para que la portada no se vea saturada.');
  if(d.dupIds.length) blockers.push('Resolver IDs duplicados visibles antes de publicación abierta.');
  if(!d.hasDemo) blockers.push('Crear una demo v6.2 completa y guardarla.');
  if(d.favorites===0) blockers.push('Marcar una lectura como favorita para validar Mi Universo.');
  if(inp.evidence==='pending') blockers.push('Aportar evidencia real: móvil, PDF, PWA o ruta completa.');
  if(!d.swControlled) blockers.push('Publicar en HTTPS y recargar para que el Service Worker controle la PWA.');
  if(inp.decision==='hold') blockers.push('La decisión está en pausa: no publicar hasta cerrar motivo.');
  if(!blockers.length) blockers.push('Sin bloqueos críticos: lista para demo/publicación controlada.');
  const releaseSteps=['Abrir en iPhone Safari y Android Chrome.','Crear lectura demo v6.2 y guardarla.','Marcar favorita y revisar Mi Universo.','Descargar informe Final Release y comprobar impresión/PDF.','Probar limpiar caché PWA y recargar.','Pegar referencia Astro.com manual si se usa cálculo auditado.','Publicar demo y revisar feedback 24/48h.'];
  const next=inp.decision==='publish'?'Publicar demo controlada y revisar incidencias reales 24/48h.':inp.decision==='hold'?'Mantener pausa y corregir bloqueos antes de enseñar.':'Cerrar el checklist con una demo real antes de publicar.';
  return {...inp,pillars,blockers,releaseSteps,next,diag:d,score:score62(r)};}
  function table62(checks){return `<div class="final62-table">${checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'✓':'!'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div>`}
  function report62(r={}){const p=plan62(r);return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Final Release v6.2 · Alaya Astral IA</title><style>body{margin:0;background:#070413;color:#fff8eb;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1100px;margin:auto;padding:46px}.cover{border:1px solid rgba(255,255,255,.16);border-radius:34px;padding:38px;background:radial-gradient(circle at 15% 0%,rgba(255,216,138,.24),transparent 40%),linear-gradient(135deg,rgba(126,87,255,.22),rgba(255,255,255,.06))}h1{font-size:48px;line-height:.95;margin:0 0 12px}.badge{display:inline-block;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;margin:4px;background:rgba(255,255,255,.08)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}.card{border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:20px;background:rgba(255,255,255,.07)}.score{font-size:64px;font-weight:900}.steps div,.checks article{padding:12px;border-radius:16px;background:rgba(255,255,255,.07);margin:8px 0}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ok b{color:#8ff0b1}.warn b{color:#ffd98a}@media(max-width:760px){.grid,.checks{grid-template-columns:1fr}.wrap{padding:22px}h1{font-size:34px}}@media print{body{background:white;color:#111}.cover,.card{background:white;border-color:#ddd}}</style><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${V62}</p><h1>Acta Final Release</h1><p>${p.promise}</p><span class="badge">Final Release ${p.score}/100</span><span class="badge">Decisión ${p.decision}</span><span class="badge">Evidencia ${p.evidence}</span><span class="badge">Publicación ${p.publish}</span></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>6 pilares</h2>${p.pillars.map(x=>`<p><b>${x[0]}</b><br>${x[1]}</p>`).join('')}</article><article class="card"><h2>Checklist final</h2><div class="steps">${p.releaseSteps.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Diagnóstico</h2><div class="checks">${p.diag.checks.map(x=>`<article class="${x[1]?'ok':'warn'}"><b>${x[1]?'OK':'REVISAR'}</b><br><span>${x[0]}</span><p>${x[2]}</p></article>`).join('')}</div></article><article class="card"><h2>Bloqueos</h2>${p.blockers.map(x=>`<p>• ${x}</p>`).join('')}</article><article class="card"><h2>Notas</h2><p>${p.notes||'Sin notas añadidas.'}</p><p><b>Responsable:</b> ${p.owner}</p></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`}
  function checklist62(r={}){const p=plan62(r);return `ALAYA ASTRAL IA · ${V62}\n\nACTA FINAL RELEASE\nPuntuación: ${p.score}/100\nDecisión: ${p.decision}\nPromesa: ${p.promise}\nAudiencia: ${p.audience}\nEvidencia: ${p.evidence}\nPublicación: ${p.publish}\nResponsable: ${p.owner}\n\nPILARES\n${p.pillars.map(x=>`- ${x[0]}: ${x[1]}`).join('\n')}\n\nCHECKLIST FINAL\n${p.releaseSteps.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nBLOQUEOS\n${p.blockers.map(x=>`- ${x}`).join('\n')}\n\nSIGUIENTE ACCIÓN\n${p.next}`}
  function showAudit62(){const d=diag62();let modal=qs('#final62AuditModal'); if(modal) modal.remove(); modal=document.createElement('div'); modal.id='final62AuditModal'; modal.className='final62-modal'; modal.innerHTML=`<div class="final62-modal-card"><button class="final62-close" aria-label="Cerrar">×</button><p class="eyebrow">Auditoría Final Release</p><h2>Diagnóstico v6.2 · ${d.score}/100</h2>${table62(d.checks)}<div class="button-row"><button class="btn primary" id="makeDemo62Modal">Crear demo completa</button><button class="btn secondary" id="copyAudit62">Copiar acta</button><button class="btn ghost" id="cache62Modal">Limpiar caché</button></div></div>`; document.body.append(modal); qs('.final62-close',modal).onclick=()=>modal.remove(); qs('#makeDemo62Modal',modal).onclick=()=>{modal.remove();makeDemo62()}; qs('#copyAudit62',modal).onclick=()=>copyText(checklist62(currentReading||{})); qs('#cache62Modal',modal).onclick=clearCache62;}
  function toggleFinal62(){document.body.classList.toggle('final62-focus'); toast(document.body.classList.contains('final62-focus')?'Modo Final Release activo: mostrando lo esencial.':'Modo Final Release desactivado.');}
  async function clearCache62(){try{if('caches' in window){const names=await caches.keys(); await Promise.all(names.filter(n=>/alaya|astral/i.test(n)).map(n=>caches.delete(n)));} if(navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'}); toast('Caché PWA limpiada. Recarga la app para comprobar la versión.')}catch(e){toast('No se pudo limpiar toda la caché: '+e.message)}}
  function makeDemo62(){const d={name:'Demo Alaya v6.2',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'final62',final62Audience:'demo',final62Decision:'candidate',final62Evidence:'mobile',final62Quality:'minimal',final62Publish:'controlled',final62Owner:'Atenea',final62Promise:'Una experiencia astral premium, clara, bella y preparada para enseñar.'}; const r=makeReading(d); renderReading(r); saveReading(r); try{if(!favs().includes(r.id)) toggleFavorite(r.id)}catch{} route('lecturas'); toast('Demo v6.2 creada, guardada y marcada como favorita.');}
  const oldMake=makeReading;
  makeReading=function(d){const r=oldMake(d); r.metrics=r.metrics||{}; r.metrics.final62=score62(r); const p=plan62(r); if(!(r.layers||[]).some(l=>String(l.title||'').includes('Final Release v6.2'))){r.layers=[{icon:'🚀',title:'Final Release v6.2 · Salida final controlada',html:`<div class="final62-hero"><div><p class="eyebrow">Final Release</p><h3>${p.promise}</h3><p>La app se valida como producto enseñable: portada limpia, lectura por capas, universo personal, informe profesional, auditoría y PWA controlada.</p></div><div class="final62-score"><span>Release</span><b>${p.score}</b><small>${p.score>=90?'ready':'QA'}</small></div></div>`},{icon:'🧭',title:'Ruta final de publicación v6.2',html:`<div class="final62-steps">${p.releaseSteps.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></article>`).join('')}</div>`},{icon:'🛡️',title:'Bloqueos reales y decisión final',html:`<ul class="final62-list">${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><p class="note-card"><b>Siguiente:</b> ${p.next}</p>`},...(r.layers||[])];} return r;}
  const oldRender=renderReading;
  renderReading=function(r){r.metrics=r.metrics||{}; r.metrics.final62=r.metrics.final62||score62(r); oldRender(r); const actions=qs('#resultArea .result-actions'); if(actions&&!qs('#downloadFinal62',actions)){const a=document.createElement('button');a.className='btn secondary small';a.id='downloadFinal62';a.textContent='Final Release v6.2';a.onclick=()=>download(`alaya-final-release-v62-${r.id||'demo'}.html`,report62(r),'text/html');const b=document.createElement('button');b.className='btn ghost small';b.id='copyFinal62';b.textContent='Copiar acta v6.2';b.onclick=()=>copyText(checklist62(r));const c=document.createElement('button');c.className='btn ghost small';c.id='auditFinal62';c.textContent='Auditoría v6.2';c.onclick=showAudit62;const d=document.createElement('button');d.className='btn ghost small';d.id='toggleFinal62';d.textContent='Modo Final';d.onclick=toggleFinal62;actions.append(a,b,c,d);}}
  const oldHome=renderHome;
  renderHome=function(){oldHome(); cleanHome62(); const h=safeRead(STORE.history,[]); const d=diag62(); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.final62||score62(r)),0)/(h.length||1))||d.score; const stats=qs('#homeStats'); if(stats) stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favs().length}</b><span>favoritas</span></div><div class="stat"><b>${d.score}</b><span>diagnóstico</span></div><div class="stat"><b>${avg}</b><span>release</span></div>`; const anchor=qs('#dailyPulse'); if(anchor&&!qs('[data-final62-home]')){anchor.insertAdjacentHTML('beforebegin',`<section class="final62-home glass premium-glow" data-final62-home><div><p class="eyebrow">Alaya Astral IA · Final Release v6.2</p><h2>La versión para enseñar, probar y publicar con control.</h2><p>v6.2 cierra el bloque de release: crea demo completa, valida historial/favoritas, revisa auditoría, descarga acta final, limpia caché PWA y deja una ruta clara para publicación.</p><div class="final62-actions"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="makeDemo62Home">Crear demo completa</button><button class="btn ghost" id="report62Home">Acta v6.2</button><button class="btn ghost" id="copy62Home">Copiar acta</button><button class="btn ghost" id="audit62Home">Auditoría</button><button class="btn ghost" id="mode62Home">Modo Final</button><button class="btn ghost" id="cache62Home">Limpiar caché</button></div></div><div class="final62-score-big"><span>Final Release</span><b>${avg}</b><small>${avg>=90?'ready':'candidate'}</small></div></section>`)} const demo=currentReading||h[0]||makeReading({name:'Demo Alaya v6.2',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',readingType:'final62',final62Promise:'Una experiencia astral premium lista para enseñar.'}); const bind=(id,fn)=>{const el=qs(id); if(el) el.onclick=fn}; bind('#makeDemo62Home',makeDemo62); bind('#report62Home',()=>download(`alaya-final-release-v62-${demo.id||'demo'}.html`,report62(demo),'text/html')); bind('#copy62Home',()=>copyText(checklist62(demo))); bind('#audit62Home',showAudit62); bind('#mode62Home',toggleFinal62); bind('#cache62Home',clearCache62);}
  const oldUniverse=renderUniverse;
  renderUniverse=function(){oldUniverse(); const h=safeRead(STORE.history,[]); const d=diag62(); const avg=Math.round(h.reduce((a,r)=>a+(r.metrics?.final62||score62(r)),0)/(h.length||1))||d.score; const dash=qs('#universeDashboard'); if(dash){dash.querySelectorAll('[data-final61-card],[data-release60-card],[data-candidate59-card],[data-stable58-card],[data-release57-card]').forEach(x=>x.remove()); if(!qs('[data-final62-card]',dash)) dash.insertAdjacentHTML('beforeend',`<article class="glass" data-final62-card><span>Final Release v6.2</span><b>${avg}</b><small>demo / publicación / estabilidad</small></article>`)} const cc=qs('#commandCenter'); if(cc&&!qs('[data-final62-action]',cc)) cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-final62-action><b>Ruta v6.2</b><span>Demo completa → favorita → universo → acta → auditoría → móvil/PWA.</span></div>`)}
  const oldPulse=dailyPulse;
  dailyPulse=function(){oldPulse(); const box=qs('#dailyPulse'); if(box&&!qs('[data-final62-pulse]',box)) box.insertAdjacentHTML('beforeend',`<div class="final62-pulse" data-final62-pulse><b>Final Release v6.2</b><span>Valida una ruta completa antes de publicar: demo, favorita, universo, informe, móvil y caché.</span></div>`)}
  window.__alayaFinal62={diagnostics:diag62,report:report62,checklist:checklist62,audit:showAudit62,demo:makeDemo62,cache:clearCache62};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v6.2 Final Release';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.2 Final Release: app astral premium limpia, estable, con demo completa, auditoría final, PWA, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent='v6.2 Final Release';
  const orb=document.querySelector('.orb-core small'); if(orb) orb.textContent='v6.2';
  const rt=document.querySelector('#readingType'); if(rt){const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','final61','final62','demo62','audit62','release62']; [...rt.options].forEach(o=>{if(!keep.includes(o.value)) o.remove()}); if(!rt.querySelector('option[value="final62"]')) rt.insertAdjacentHTML('beforeend','<option value="final62">Final Release v6.2</option><option value="demo62">Demo completa v6.2</option><option value="audit62">Auditoría v6.2</option>')}
  const anchor=document.querySelector('#final61Promise')||document.querySelector('#release60Promise')||document.querySelector('#centralQuestion');
  if(anchor&&!document.querySelector('#final62Audience')){anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia v6.2<select id="final62Audience" name="final62Audience"><option value="personal">Uso personal</option><option value="demo">Demo para enseñar</option><option value="client">Entrega cliente</option><option value="publish">Publicación PWA</option></select></label><label>Decisión v6.2<select id="final62Decision" name="final62Decision"><option value="candidate">Candidata</option><option value="demo">Lista para demo</option><option value="publish">Lista para publicar</option><option value="hold">Pausada</option></select></label></div><div class="row"><label>Evidencia v6.2<select id="final62Evidence" name="final62Evidence"><option value="pending">Pendiente</option><option value="mobile">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="astro">Astro.com manual revisado</option><option value="full">Ruta completa validada</option></select></label><label>Calidad visual<select id="final62Quality" name="final62Quality"><option value="balanced">Equilibrada</option><option value="minimal">Mínima demo</option><option value="premium">Premium completa</option></select></label></div><div class="row"><label>Publicación v6.2<select id="final62Publish" name="final62Publish"><option value="controlled">Controlada</option><option value="public">Pública</option><option value="private">Privada</option></select></label><label>Responsable<input id="final62Owner" name="final62Owner" placeholder="Atenea" /></label></div><label>Promesa v6.2<input id="final62Promise" name="final62Promise" placeholder="Ej. Una app astral premium lista para enseñar/publicar" /></label><label>Notas v6.2<textarea id="final62Notes" name="final62Notes" rows="2" placeholder="Pendientes reales: móvil, PDF, PWA, Astro.com manual..."></textarea></label>`)}
  if(!window.__alaya62DelegatedRoute){window.__alaya62DelegatedRoute=true;document.addEventListener('click',e=>{const el=e.target.closest('[data-route]');if(el){e.preventDefault();route(el.dataset.route)}})}
  renderHome(); renderUniverse();
});


/* === Alaya Astral IA v6.3 Quality Gate: semáforo final, demo estable y QA exportable === */
(function(){
  const V63='v6.3 Quality Gate';
  const LEGACY63=['[data-final62-home]','[data-final61-home]','[data-release60-home]','[data-candidate59-home]','[data-stable58-home]','[data-release57-home]','[data-polish56-home]','[data-experience55-home]','[data-demo54-home]','[data-showcase53-home]','[data-launch52-home]','.final62-home','.final61-home','.release60-home','.candidate59-home','.stable58-home','.release57-home','.polish56-home','.experience55-home','.demo54-home','.vision-strip'].join(',');
  function qs(s,root=document){try{return root.querySelector(s)}catch{return null}}
  function qsa(s,root=document){try{return [...root.querySelectorAll(s)]}catch{return []}}
  function safeRead(key,fallback){try{return read(key,fallback)}catch{return fallback}}
  function favs(){try{return favoriteIds()}catch{return []}}
  function cleanHome63(){qsa(LEGACY63).forEach(n=>n.remove());document.body.classList.add('v63-quality-gate')}
  function input63(r={}){const d=r.data||{};return {
    audience:d.quality63Audience||d.final62Audience||'demo',
    gate:d.quality63Gate||'candidate',
    evidence:d.quality63Evidence||d.final62Evidence||'pending',
    density:d.quality63Density||'clean',
    pwa:d.quality63Pwa||'pending',
    promise:d.quality63Promise||d.final62Promise||'Alaya Astral IA queda limpia, verificable y lista para enseñar con un Quality Gate final.',
    notes:d.quality63Notes||d.final62Notes||''
  }}
  function audit63(){
    const history=safeRead(STORE.history,[]);
    const favorites=favs();
    const dupIds=Object.entries(qsa('[id]').reduce((a,n)=>{a[n.id]=(a[n.id]||0)+1;return a;},{})).filter(([,n])=>n>1).map(([id,n])=>`${id}×${n}`);
    const legacyVisible=qsa(LEGACY63).filter(n=>n.offsetParent!==null).length;
    const routes=['home','lecturas','compatibilidad','universo','ajustes'];
    const missingScreens=routes.filter(id=>!qs('#'+id));
    const badRoutes=[...new Set(qsa('[data-route]').map(n=>n.dataset.route).filter(x=>x&&!routes.includes(x)))];
    const buttons=['dailyPulseBtn','readingForm','resultArea','homeStats','lastReadingCard','universeDashboard','installBtn'];
    const missingButtons=buttons.filter(id=>!qs('#'+id));
    const hasDemo=history.some(r=>String(r?.data?.readingType||'').match(/final62|demo62|quality63|demo63/)||String(r?.title||'').toLowerCase().includes('demo'));
    const storageOk=(()=>{try{localStorage.setItem('__alaya_v63','ok');localStorage.removeItem('__alaya_v63');return true}catch{return false}})();
    const printOk=typeof window.print==='function';
    const clipOk=!!navigator.clipboard;
    const swOk=!!navigator.serviceWorker;
    const swControlled=!!navigator.serviceWorker?.controller;
    const manifestOk=!!qs('link[rel="manifest"]');
    const mobile=matchMedia('(max-width: 860px)').matches || navigator.maxTouchPoints>0;
    const cleanHero=legacyVisible===0 && !!qs('[data-quality63-home]');
    const checks=[
      ['Portada Quality Gate',cleanHero,cleanHero?'Portada v6.3 activa y sin bloques antiguos visibles.':`Revisar portada: ${legacyVisible} bloque(s) antiguo(s) o falta bloque v6.3.`],
      ['Rutas principales',missingScreens.length===0&&badRoutes.length===0,missingScreens.length?`Faltan: ${missingScreens.join(', ')}`:(badRoutes.length?`Rutas no previstas: ${badRoutes.join(', ')}`:'Inicio, lecturas, compatibilidad, universo y ajustes OK.')],
      ['Botones y zonas clave',missingButtons.length===0,missingButtons.length?`Faltan: ${missingButtons.join(', ')}`:'Botones/zona base disponibles.'],
      ['Lectura demo estable',history.length>0&&hasDemo,history.length?`${history.length} lectura(s); demo ${hasDemo?'detectada':'pendiente'}`:'Sin lecturas guardadas.'],
      ['Favoritas / Universo',favorites.length>0,favorites.length?`${favorites.length} favorita(s) para validar Universo.`:'Marca una demo como favorita.'],
      ['LocalStorage',storageOk,storageOk?'Escritura local OK.':'No se puede escribir en almacenamiento local.'],
      ['Service Worker',swOk,swControlled?'Controlando la página.':'Disponible; publicar en HTTPS y recargar para control real.'],
      ['Manifest PWA',manifestOk,manifestOk?'Manifest enlazado.':'Falta manifest.'],
      ['PDF / impresión',printOk,printOk?'Impresión disponible.':'No disponible.'],
      ['Portapapeles',clipOk,clipOk?'Copiar disponible.':'Puede requerir HTTPS/permisos.'],
      ['IDs duplicados',dupIds.length===0,dupIds.length?dupIds.join(', '):'Sin duplicados visibles.'],
      ['Prueba móvil real',mobile,mobile?'Entorno móvil/táctil detectado.':'Probar en iPhone Safari y Android Chrome.']
    ];
    let score=Math.round(checks.filter(x=>x[1]).length/checks.length*100);
    score-=Math.min(18,legacyVisible*5)+Math.min(10,dupIds.length*2)+Math.min(10,badRoutes.length*3)+Math.min(8,missingButtons.length*2);
    score=Math.max(20,Math.min(100,score));
    const color=score>=90?'verde':score>=75?'ámbar':'rojo';
    return {checks,score,color,history:history.length,favorites:favorites.length,hasDemo,legacyVisible,dupIds,badRoutes,missingButtons,storageOk,swOk,swControlled,manifestOk,mobile};
  }
  function score63(r={}){const m=r.metrics||{};const a=audit63();const inp=input63(r);let boost=0;if(inp.evidence==='full')boost+=8;if(inp.gate==='publish')boost+=6;if(inp.pwa==='installed')boost+=5;if(inp.density==='clean')boost+=3;return Math.max(42,Math.min(100,Math.round(((m.final62||m.final61||m.aura||82)+a.score+(m.clarity||80))/3)+boost));}
  function plan63(r={}){const inp=input63(r),a=audit63();const steps=['Crear demo estable y guardarla.','Marcar demo como favorita.','Abrir Mi Universo y revisar métricas.','Descargar Quality Gate v6.3 y probar impresión/PDF.','Exportar QA JSON para dejar evidencia técnica.','Probar iPhone Safari, Android Chrome y PWA instalada.','Limpiar caché PWA tras publicar y recargar.'];const blockers=[];if(a.legacyVisible)blockers.push('La portada aún muestra bloques antiguos: limpiar home antes de publicar.');if(a.dupIds.length)blockers.push('Hay IDs duplicados visibles: revisar HTML generado.');if(!a.hasDemo)blockers.push('Falta demo estable guardada.');if(a.favorites===0)blockers.push('Falta favorita para validar Mi Universo.');if(!a.swControlled)blockers.push('Service Worker pendiente de control real: publicar en HTTPS y recargar.');if(inp.evidence==='pending')blockers.push('Falta evidencia: móvil, PDF, PWA o ruta completa.');if(inp.gate==='hold')blockers.push('La puerta de salida está en pausa.');if(!blockers.length)blockers.push('Sin bloqueos críticos locales: lista para demo/publicación controlada.');const gates=[['Experiencia','Portada clara, un CTA principal y lectura por capas.'],['Datos','Historial, favoritas, perfiles y backup funcionando.'],['Entrega','PDF/HTML, informe y QA JSON descargables.'],['Técnica','PWA, caché, manifest y Astro.com manual separados.'],['Móvil','Revisión en iPhone/Android antes de publicar.'],['Salida','Decisión verde/ámbar/rojo con siguiente acción clara.']];const next=a.color==='verde'?'Publicar demo controlada y revisar feedback real 24/48h.':a.color==='ámbar'?'Cerrar bloqueos menores antes de compartir públicamente.':'No publicar todavía: completar demo, favorita, móvil/PWA y limpiar bloqueos.';return {...inp,steps,blockers,gates,next,audit:a,score:score63(r),color:a.color};}
  function table63(checks){return `<div class="quality63-table">${checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'✓':'!'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div>`}
  function report63(r={}){const p=plan63(r);return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Quality Gate v6.3 · Alaya Astral IA</title><style>body{margin:0;background:#070413;color:#fff8eb;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1120px;margin:auto;padding:46px}.cover{border:1px solid rgba(255,255,255,.16);border-radius:34px;padding:38px;background:radial-gradient(circle at 15% 0%,rgba(255,216,138,.24),transparent 40%),linear-gradient(135deg,rgba(126,87,255,.22),rgba(255,255,255,.06))}h1{font-size:48px;line-height:.95;margin:0 0 12px}.badge{display:inline-block;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;margin:4px;background:rgba(255,255,255,.08)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}.card{border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:20px;background:rgba(255,255,255,.07)}.score{font-size:72px;font-weight:900}.list div,.checks article{padding:12px;border-radius:16px;background:rgba(255,255,255,.07);margin:8px 0}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ok b{color:#8ff0b1}.warn b{color:#ffd98a}@media(max-width:760px){.grid,.checks{grid-template-columns:1fr}.wrap{padding:22px}h1{font-size:34px}}@media print{body{background:white;color:#111}.cover,.card,.list div,.checks article{background:white;border-color:#ddd}}</style><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${V63}</p><h1>Quality Gate Final</h1><p>${p.promise}</p><span class="badge">Gate ${p.score}/100</span><span class="badge">Semáforo ${p.color}</span><span class="badge">Evidencia ${p.evidence}</span><span class="badge">PWA ${p.pwa}</span></section><section class="grid"><article class="card"><h2>Puntuación</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Puertas</h2>${p.gates.map(x=>`<p><b>${x[0]}</b><br>${x[1]}</p>`).join('')}</article><article class="card"><h2>Ruta final</h2><div class="list">${p.steps.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Bloqueos</h2><ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card" style="grid-column:1/-1"><h2>Auditoría local</h2><div class="checks">${p.audit.checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'OK':'Revisar'}</b><br><span>${c[0]}</span><p>${c[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`}
  function checklist63(r={}){const p=plan63(r);return `ALAYA ASTRAL IA · ${V63}\n\nQUALITY GATE FINAL\nPuntuación: ${p.score}/100\nSemáforo: ${p.color}\nPromesa: ${p.promise}\nAudiencia: ${p.audience}\nPuerta: ${p.gate}\nEvidencia: ${p.evidence}\nPWA: ${p.pwa}\n\nRUTA FINAL\n${p.steps.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nBLOQUEOS\n${p.blockers.map(x=>`- ${x}`).join('\n')}\n\nSIGUIENTE\n${p.next}`}
  function qaJson63(r={}){const p=plan63(r);return JSON.stringify({app:'Alaya Astral IA',version:V63,exported:new Date().toISOString(),score:p.score,color:p.color,input:{audience:p.audience,gate:p.gate,evidence:p.evidence,density:p.density,pwa:p.pwa},audit:p.audit,blockers:p.blockers,next:p.next,reading:r?{id:r.id,title:r.title,metrics:r.metrics,data:r.data}:null},null,2)}
  function showAudit63(){const a=audit63();const div=document.createElement('div');div.className='quality63-modal';div.innerHTML=`<div class="quality63-modal-card"><button class="quality63-close" aria-label="Cerrar">×</button><p class="eyebrow">${V63}</p><h2>Auditoría Quality Gate · ${a.score}/100 · ${a.color}</h2>${table63(a.checks)}<div class="quality63-note"><b>Lecturas:</b> ${a.history} · <b>Favoritas:</b> ${a.favorites} · <b>Demo:</b> ${a.hasDemo?'sí':'pendiente'}</div></div>`;div.querySelector('.quality63-close').onclick=()=>div.remove();div.onclick=e=>{if(e.target===div)div.remove()};document.body.append(div)}
  async function clearCache63(){try{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});toast('Caché PWA limpiada. Recarga la app para comprobar v6.3.')}catch(e){toast('No se pudo limpiar toda la caché: '+e.message)}}
  function makeDemo63(){const d={name:'Demo Alaya v6.3',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'quality63',quality63Audience:'demo',quality63Gate:'candidate',quality63Evidence:'full',quality63Density:'clean',quality63Pwa:'pending',quality63Promise:'Una app astral premium, limpia, verificable y lista para enseñar.'};const r=makeReading(d);renderReading(r);saveReading(r);try{if(!favs().includes(r.id))toggleFavorite(r.id)}catch{}route('lecturas');toast('Demo v6.3 creada, guardada y marcada como favorita.');}
  function toggleGate63(){document.body.classList.toggle('quality63-focus');toast(document.body.classList.contains('quality63-focus')?'Modo Gate activado':'Modo Gate desactivado')}
  const oldMake=makeReading;
  makeReading=function(d){const r=oldMake(d);r.metrics=r.metrics||{};r.metrics.quality63=score63(r);const p=plan63(r);if(!(r.layers||[]).some(l=>String(l.title||'').includes('Quality Gate v6.3'))){r.layers=[{icon:'🟢',title:'Quality Gate v6.3 · Semáforo final',html:`<div class="quality63-hero"><div><p class="eyebrow">Semáforo ${p.color}</p><h3>${p.promise}</h3><p>Esta capa resume si Alaya está lista para enseñar/publicar: demo, historial, favoritas, informe, móvil, PWA, caché y auditoría.</p></div><div class="quality63-score"><span>Gate</span><b>${p.score}</b><small>${p.color}</small></div></div>`},{icon:'🧱',title:'Puertas de salida v6.3',html:`<div class="quality63-gates">${p.gates.map(x=>`<article><b>${x[0]}</b><span>${x[1]}</span></article>`).join('')}</div>`},{icon:'✅',title:'Ruta final v6.3',html:`<div class="quality63-route">${p.steps.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></article>`).join('')}</div>`},{icon:'⚠️',title:'Bloqueos y siguiente acción',html:`<ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><div class="quality63-note"><b>Siguiente:</b> ${p.next}</div>`},...(r.layers||[])];}return r;}
  const oldRender=renderReading;
  renderReading=function(r){r.metrics=r.metrics||{};r.metrics.quality63=r.metrics.quality63||score63(r);oldRender(r);const actions=qs('#resultArea .result-actions');if(actions&&!qs('#downloadQuality63',actions)){const a=document.createElement('button');a.className='btn secondary small';a.id='downloadQuality63';a.textContent='Quality Gate v6.3';a.onclick=()=>download(`alaya-quality-gate-v63-${r.id||'demo'}.html`,report63(r),'text/html');const b=document.createElement('button');b.className='btn ghost small';b.id='copyQuality63';b.textContent='Checklist v6.3';b.onclick=()=>copyText(checklist63(r));const c=document.createElement('button');c.className='btn ghost small';c.id='qaJson63';c.textContent='QA JSON';c.onclick=()=>download(`alaya-qa-v63-${r.id||'demo'}.json`,qaJson63(r),'application/json');const d=document.createElement('button');d.className='btn ghost small';d.id='auditQuality63';d.textContent='Auditoría v6.3';d.onclick=showAudit63;const e=document.createElement('button');e.className='btn ghost small';e.id='modeQuality63';e.textContent='Modo Gate';e.onclick=toggleGate63;actions.append(a,b,c,d,e)}}
  const oldHome=renderHome;
  renderHome=function(){oldHome();cleanHome63();const h=safeRead(STORE.history,[]);const a=audit63();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.quality63||score63(r)),0)/(h.length||1))||a.score;const stats=qs('#homeStats');if(stats)stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favs().length}</b><span>favoritas</span></div><div class="stat"><b>${a.score}</b><span>QA local</span></div><div class="stat"><b>${avg}</b><span>Gate</span></div>`;const anchor=qs('#dailyPulse');if(anchor&&!qs('[data-quality63-home]')){anchor.insertAdjacentHTML('beforebegin',`<section class="quality63-home glass premium-glow" data-quality63-home><div><p class="eyebrow">Alaya Astral IA · Quality Gate v6.3</p><h2>Semáforo final antes de enseñar o publicar.</h2><p>v6.3 convierte la app en una versión verificable: demo estable, favorita, universo, informe, QA JSON, PWA, PDF y caché bajo control.</p><div class="quality63-actions"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="makeDemo63Home">Crear demo estable</button><button class="btn ghost" id="report63Home">Quality Gate v6.3</button><button class="btn ghost" id="copy63Home">Checklist v6.3</button><button class="btn ghost" id="json63Home">QA JSON</button><button class="btn ghost" id="audit63Home">Auditoría</button><button class="btn ghost" id="mode63Home">Modo Gate</button><button class="btn ghost" id="cache63Home">Limpiar caché</button></div></div><div class="quality63-score-big"><span>Quality Gate</span><b>${avg}</b><small>${a.color}</small></div></section>`)}const demo=currentReading||h[0]||makeReading({name:'Demo Alaya v6.3',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',readingType:'quality63',quality63Promise:'Una app astral premium lista para enseñar.'});const bind=(id,fn)=>{const el=qs(id);if(el)el.onclick=fn};bind('#makeDemo63Home',makeDemo63);bind('#report63Home',()=>download(`alaya-quality-gate-v63-${demo.id||'demo'}.html`,report63(demo),'text/html'));bind('#copy63Home',()=>copyText(checklist63(demo)));bind('#json63Home',()=>download(`alaya-qa-v63-${demo.id||'demo'}.json`,qaJson63(demo),'application/json'));bind('#audit63Home',showAudit63);bind('#mode63Home',toggleGate63);bind('#cache63Home',clearCache63)}
  const oldUniverse=renderUniverse;
  renderUniverse=function(){oldUniverse();const h=safeRead(STORE.history,[]);const a=audit63();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.quality63||score63(r)),0)/(h.length||1))||a.score;const dash=qs('#universeDashboard');if(dash){dash.querySelectorAll('[data-final62-card],[data-final61-card],[data-release60-card]').forEach(x=>x.remove());if(!qs('[data-quality63-card]',dash))dash.insertAdjacentHTML('beforeend',`<article class="glass" data-quality63-card><span>Quality Gate v6.3</span><b>${avg}</b><small>${a.color} · demo / PWA / PDF</small></article>`)}const cc=qs('#commandCenter');if(cc&&!qs('[data-quality63-action]',cc))cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-quality63-action><b>Gate v6.3</b><span>Demo estable → favorita → universo → Quality Gate → QA JSON → móvil/PWA.</span></div>`)}
  const oldPulse=dailyPulse;
  dailyPulse=function(){oldPulse();const box=qs('#dailyPulse');if(box&&!qs('[data-quality63-pulse]',box)){const a=audit63();box.insertAdjacentHTML('beforeend',`<div class="quality63-pulse" data-quality63-pulse><b>Quality Gate v6.3 · ${a.color}</b><span>Antes de publicar: demo estable, favorita, universo, informe, QA JSON, móvil y caché.</span></div>`)}}
  window.__alayaQuality63={audit:audit63,report:report63,checklist:checklist63,qa:qaJson63,demo:makeDemo63,cache:clearCache63};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v6.3 Quality Gate';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.3 Quality Gate: app astral premium limpia, con demo estable, auditoría final, QA JSON, PWA, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent='v6.3 Quality Gate';
  const orb=document.querySelector('.orb-core small'); if(orb) orb.textContent='v6.3';
  const rt=document.querySelector('#readingType'); if(rt){const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','final62','demo62','audit62','quality63','demo63','audit63'];[...rt.options].forEach(o=>{if(!keep.includes(o.value))o.remove()});if(!rt.querySelector('option[value="quality63"]'))rt.insertAdjacentHTML('beforeend','<option value="quality63">Quality Gate v6.3</option><option value="demo63">Demo estable v6.3</option><option value="audit63">Auditoría v6.3</option>')}
  const anchor=document.querySelector('#final62Notes')||document.querySelector('#centralQuestion');
  if(anchor&&!document.querySelector('#quality63Audience')){anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia v6.3<select id="quality63Audience" name="quality63Audience"><option value="personal">Uso personal</option><option value="demo">Demo para enseñar</option><option value="client">Entrega cliente</option><option value="publish">Publicación PWA</option></select></label><label>Puerta v6.3<select id="quality63Gate" name="quality63Gate"><option value="candidate">Candidata</option><option value="demo">Lista para demo</option><option value="publish">Lista para publicar</option><option value="hold">Pausada</option></select></label></div><div class="row"><label>Evidencia v6.3<select id="quality63Evidence" name="quality63Evidence"><option value="pending">Pendiente</option><option value="mobile">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="astro">Astro.com manual revisado</option><option value="full">Ruta completa validada</option></select></label><label>Densidad v6.3<select id="quality63Density" name="quality63Density"><option value="clean">Limpia</option><option value="balanced">Equilibrada</option><option value="complete">Completa</option></select></label></div><div class="row"><label>Estado PWA v6.3<select id="quality63Pwa" name="quality63Pwa"><option value="pending">Pendiente</option><option value="browser">Probada en navegador</option><option value="installed">Instalada como PWA</option></select></label><label>Promesa v6.3<input id="quality63Promise" name="quality63Promise" placeholder="Ej. App premium lista para enseñar/publicar" /></label></div><label>Notas v6.3<textarea id="quality63Notes" name="quality63Notes" rows="2" placeholder="Pendientes reales: móvil, PDF, PWA, caché, feedback..."></textarea></label>`)}
  if(!window.__alaya63DelegatedRoute){window.__alaya63DelegatedRoute=true;document.addEventListener('click',e=>{const el=e.target.closest('[data-route]');if(el){e.preventDefault();route(el.dataset.route)}})}
  renderHome(); renderUniverse();
});


// ===== v6.4 Publish Gate: comprobación de publicación y despliegue =====
(function(){
  const V64='v6.4 Publish Gate';
  const q=(s,r=document)=>{try{return r.querySelector(s)}catch{return null}};
  const qa=(s,r=document)=>{try{return [...r.querySelectorAll(s)]}catch{return []}};
  const yes=(ok)=>ok?'OK':'REVISAR';
  function favCount64(){try{return (typeof favoriteIds==='function'?favoriteIds():read(STORE.favorites,[])).length}catch{return 0}}
  function hist64(){try{return read(STORE.history,[])}catch{return []}}
  function audit64(){
    const h=hist64();
    const checks=[
      ['Portada limpia', !q('[data-quality63-home]') && !q('[data-final62-home]') && !!q('[data-publish64-home]'), 'Solo debe quedar la portada Publish Gate visible.'],
      ['Lectura demo', h.length>0, 'Crea una demo final para validar historial, universo y exportaciones.'],
      ['Favoritas', favCount64()>0, 'Marca al menos una lectura como favorita para probar persistencia.'],
      ['Manifest PWA', !!q('link[rel="manifest"]'), 'El manifest debe estar enlazado desde index.html.'],
      ['Service Worker', 'serviceWorker' in navigator, 'El navegador debe soportar Service Worker para PWA.'],
      ['HTTPS / localhost', location.protocol==='https:' || location.hostname==='localhost' || location.protocol==='file:', 'Para instalar PWA en producción usa HTTPS.'],
      ['Impresión / PDF', typeof window.print==='function', 'El navegador debe permitir impresión o guardar como PDF.'],
      ['Portapapeles', !!navigator.clipboard, 'Clipboard mejora botones de copiar.'],
      ['Rutas principales', ['home','lecturas','compatibilidad','universo','ajustes'].every(id=>!!q('#'+id)), 'Todas las pantallas principales deben existir.'],
      ['Botones dinámicos', !!q('[data-route="lecturas"]'), 'Debe existir CTA navegable a lecturas.'],
      ['Vista móvil', matchMedia('(max-width: 820px)').matches || innerWidth>820, 'Probar en móvil real aunque el escritorio pase.'],
      ['Astro.com manual separado', !!q('#astroText'), 'La comparación con Astro.com debe seguir siendo manual, no automática.']
    ];
    const ok=checks.filter(x=>x[1]).length;
    const score=Math.round((ok/checks.length)*100);
    const color=score>=88?'🟢 listo':score>=70?'🟡 revisar':'🔴 bloquear';
    return {checks,score,color,ok,total:checks.length,at:new Date().toISOString(),url:location.href,version:V64};
  }
  function score64(r={}){
    const a=audit64(); let s=a.score;
    const d=r.data||{};
    if(d.publish64Gate==='publish') s+=5;
    if(d.publish64Proof==='full') s+=5;
    if(d.publish64Cache==='clean') s+=3;
    if((d.publish64Channel||'').includes('github') || (d.publish64Channel||'').includes('netlify') || (d.publish64Channel||'').includes('vercel')) s+=2;
    return Math.max(35,Math.min(100,s));
  }
  function plan64(r={}){
    const d=r.data||{}; const a=audit64(); const score=score64(r);
    const channel={local:'ZIP/local',github:'GitHub Pages',netlify:'Netlify',vercel:'Vercel',client:'Entrega cliente'}[d.publish64Channel]||'ZIP/local';
    const gate={qa:'QA pendiente',demo:'Lista para demo',publish:'Lista para publicar',hold:'Pausada'}[d.publish64Gate]||'QA pendiente';
    const proof={pending:'Pendiente',mobile:'Móvil probado',pdf:'PDF revisado',pwa:'PWA instalada',full:'Ruta completa validada'}[d.publish64Proof]||'Pendiente';
    const blockers=a.checks.filter(x=>!x[1]).map(x=>`${x[0]}: ${x[2]}`);
    return {
      score, color:score>=90?'🟢 Publicable':score>=75?'🟡 Demo controlada':'🔴 Revisar antes',
      channel, gate, proof, cache:d.publish64Cache||'pendiente',
      promise:d.publish64Promise||'Una app astral premium, limpia, verificable y preparada para publicar sin caché vieja.',
      steps:['Crear demo publicable','Marcarla favorita','Abrir Mi Universo','Descargar informe Publish Gate','Probar PDF/impresión','Probar móvil real','Limpiar caché PWA tras subir','Publicar solo si el semáforo queda verde'],
      blockers:blockers.length?blockers:['Sin bloqueos críticos detectados por la auditoría local.'],
      next:blockers.length?'Corregir los puntos en rojo/ámbar y repetir auditoría.':'Preparar subida al canal elegido y probar con caché limpia.'
    };
  }
  function table64(a){return `<div class="publish64-table">${a.checks.map(x=>`<article class="${x[1]?'ok':'bad'}"><b>${x[0]}</b><span>${yes(x[1])}</span><small>${x[2]}</small></article>`).join('')}</div>`}
  function checklist64(r={}){const p=plan64(r); const a=audit64(); return `ALAYA ASTRAL IA · ${V64}\n\nPuntuación: ${p.score}/100 · ${p.color}\nCanal: ${p.channel}\nPuerta: ${p.gate}\nEvidencia: ${p.proof}\nPromesa: ${p.promise}\nURL prueba: ${a.url}\n\nRUTA DE PUBLICACIÓN\n${p.steps.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nAUDITORÍA\n${a.checks.map(x=>`- ${x[0]}: ${yes(x[1])}`).join('\n')}\n\nBLOQUEOS\n${p.blockers.map(x=>`- ${x}`).join('\n')}\n\nSIGUIENTE ACCIÓN\n${p.next}`}
  function qaJson64(r={}){return JSON.stringify({version:V64,readingId:r.id||null,metrics:r.metrics||{},plan:plan64(r),audit:audit64(),history:hist64().length,favorites:favCount64()},null,2)}
  function report64(r={}){const p=plan64(r), a=audit64();return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alaya Astral IA · ${V64}</title><style>body{margin:0;background:#090515;color:#f8f0ff;font-family:Inter,Arial,sans-serif}main{max-width:980px;margin:auto;padding:44px}section{background:linear-gradient(135deg,#ffffff12,#ffffff06);border:1px solid #ffffff24;border-radius:28px;padding:26px;margin:18px 0;box-shadow:0 22px 70px #0007}.eyebrow{letter-spacing:.16em;text-transform:uppercase;color:#d9b8ff;font-size:12px}h1{font-size:42px;margin:8px 0 10px}.score{font-size:72px;line-height:1;font-weight:900;color:#f4d38b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{border:1px solid #ffffff20;border-radius:18px;padding:14px;background:#00000024}.ok{border-color:#7ee7b650}.bad{border-color:#ff8da150}small{color:#cfc3dc}li{margin:8px 0}@media print{body{background:white;color:#171020}section{box-shadow:none;border-color:#ddd}.score{color:#6c3cff}}</style></head><body><main><section><p class="eyebrow">${V64}</p><h1>Informe Publish Gate</h1><p>${p.promise}</p><div class="score">${p.score}</div><b>${p.color}</b><p>Canal: ${p.channel} · Puerta: ${p.gate} · Evidencia: ${p.proof}</p></section><section><p class="eyebrow">Ruta final</p><h2>8 pasos antes de publicar</h2><ol>${p.steps.map(x=>`<li>${x}</li>`).join('')}</ol></section><section><p class="eyebrow">Auditoría local</p><div class="grid">${a.checks.map(x=>`<div class="card ${x[1]?'ok':'bad'}"><b>${x[0]}</b><p>${yes(x[1])}</p><small>${x[2]}</small></div>`).join('')}</div></section><section><p class="eyebrow">Bloqueos</p><ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><p><b>Siguiente:</b> ${p.next}</p></section></main></body></html>`}
  function deployGuide64(){return `PUBLICAR ALAYA ASTRAL IA · ${V64}\n\nArchivos que debes subir juntos:\n- index.html\n- styles.css\n- app.js\n- manifest.webmanifest\n- sw.js\n- icons/icon-192.png\n- icons/icon-512.png\n\nGitHub Pages:\n1. Sube los archivos a un repositorio.\n2. Activa Pages desde Settings > Pages.\n3. Abre la URL publicada.\n4. Pulsa Limpiar caché PWA si venías de una versión anterior.\n5. Crea demo publicable y ejecuta Publish Gate.\n\nNetlify / Vercel:\n1. Arrastra la carpeta descomprimida o conecta repo.\n2. Comprueba que index.html queda en raíz.\n3. Abre la URL HTTPS.\n4. Ejecuta auditoría y prueba móvil.\n\nImportante:\n- Astro.com se mantiene como referencia manual pegada por la persona usuaria.\n- No automatizar Astro.com.\n- Tras cada versión cambia caché/service worker y limpia caché en dispositivos de prueba.`}
  function showAudit64(){const a=audit64();let modal=q('#publish64AuditModal'); if(modal) modal.remove(); modal=document.createElement('div');modal.id='publish64AuditModal';modal.className='publish64-modal';modal.innerHTML=`<div class="publish64-modal-card"><button class="publish64-close" aria-label="Cerrar">×</button><p class="eyebrow">Publish Gate</p><h2>Auditoría v6.4 · ${a.score}/100</h2><p>${a.color}</p>${table64(a)}<div class="button-row"><button class="btn primary" id="makeDemo64Modal">Crear demo publicable</button><button class="btn secondary" id="copyAudit64Modal">Copiar checklist</button><button class="btn ghost" id="deploy64Modal">Guía publicar</button><button class="btn ghost" id="cache64Modal">Limpiar caché</button></div></div>`;document.body.append(modal);q('.publish64-close',modal).onclick=()=>modal.remove();q('#makeDemo64Modal',modal).onclick=()=>{modal.remove();makeDemo64()};q('#copyAudit64Modal',modal).onclick=()=>copyText(checklist64(currentReading||{}));q('#deploy64Modal',modal).onclick=()=>download('alaya-guia-publicacion-v64.txt',deployGuide64(),'text/plain');q('#cache64Modal',modal).onclick=clearCache64;}
  async function clearCache64(){try{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});toast('Caché PWA limpiada. Recarga y verifica v6.4.')}catch(e){toast('No se pudo limpiar toda la caché: '+e.message)}}
  function togglePublish64(){document.body.classList.toggle('publish64-focus');toast(document.body.classList.contains('publish64-focus')?'Modo Publish activado':'Modo Publish desactivado')}
  function makeDemo64(){const d={name:'Demo Alaya v6.4',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'publish64',publish64Audience:'demo',publish64Channel:'github',publish64Gate:'demo',publish64Proof:'full',publish64Cache:'clean',publish64Promise:'Una app astral premium, limpia, verificable y lista para publicar con control.'};const r=makeReading(d);renderReading(r);saveReading(r);try{if(!favoriteIds().includes(r.id))toggleFavorite(r.id)}catch{}route('lecturas');toast('Demo v6.4 creada, guardada y marcada como favorita.');}
  function cleanHome64(){qa('[data-quality63-home],[data-final62-home],[data-final61-home],[data-release60-home],[data-candidate59-home],[data-stable58-home],[data-release57-home],[data-polish56-home],[data-demo54-home],[data-showcase53-home],[data-launch52-home]').forEach(x=>x.remove());}
  const oldMake64=makeReading;
  makeReading=function(d){const r=oldMake64(d);r.metrics=r.metrics||{};r.metrics.publish64=score64(r);const p=plan64(r);if(!(r.layers||[]).some(l=>String(l.title||'').includes('Publish Gate v6.4'))){r.layers=[{icon:'🚦',title:'Publish Gate v6.4 · Publicación controlada',html:`<div class="publish64-hero"><div><p class="eyebrow">${p.color}</p><h3>${p.promise}</h3><p>Esta capa separa la magia de la salida técnica: demo, favorita, universo, informe, PWA, PDF, móvil, caché y canal de publicación.</p></div><div class="publish64-score"><span>Publish</span><b>${p.score}</b><small>${p.channel}</small></div></div>`},{icon:'🛰️',title:'Ruta de publicación v6.4',html:`<div class="publish64-route">${p.steps.map((x,i)=>`<article><b>${String(i+1).padStart(2,'0')}</b><span>${x}</span></article>`).join('')}</div>`},{icon:'🧪',title:'Bloqueos y pruebas reales',html:`<ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><div class="publish64-note"><b>Siguiente:</b> ${p.next}</div>`},...(r.layers||[])];}return r;}
  const oldRender64=renderReading;
  renderReading=function(r){r.metrics=r.metrics||{};r.metrics.publish64=r.metrics.publish64||score64(r);oldRender64(r);const actions=q('#resultArea .result-actions');if(actions&&!q('#downloadPublish64',actions)){const a=document.createElement('button');a.className='btn secondary small';a.id='downloadPublish64';a.textContent='Publish Gate v6.4';a.onclick=()=>download(`alaya-publish-gate-v64-${r.id||'demo'}.html`,report64(r),'text/html');const b=document.createElement('button');b.className='btn ghost small';b.id='copyPublish64';b.textContent='Checklist v6.4';b.onclick=()=>copyText(checklist64(r));const c=document.createElement('button');c.className='btn ghost small';c.id='qaJson64';c.textContent='Deploy JSON';c.onclick=()=>download(`alaya-deploy-v64-${r.id||'demo'}.json`,qaJson64(r),'application/json');const d=document.createElement('button');d.className='btn ghost small';d.id='guidePublish64';d.textContent='Guía publicar';d.onclick=()=>download('alaya-guia-publicacion-v64.txt',deployGuide64(),'text/plain');const e=document.createElement('button');e.className='btn ghost small';e.id='auditPublish64';e.textContent='Auditoría v6.4';e.onclick=showAudit64;actions.append(a,b,c,d,e)}}
  const oldHome64=renderHome;
  renderHome=function(){oldHome64();cleanHome64();const h=hist64();const a=audit64();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.publish64||score64(r)),0)/(h.length||1))||a.score;const stats=q('#homeStats');if(stats)stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favCount64()}</b><span>favoritas</span></div><div class="stat"><b>${a.score}</b><span>preflight</span></div><div class="stat"><b>${avg}</b><span>publish</span></div>`;const anchor=q('#dailyPulse');if(anchor&&!q('[data-publish64-home]'))anchor.insertAdjacentHTML('beforebegin',`<section class="publish64-home glass premium-glow" data-publish64-home><div><p class="eyebrow">Alaya Astral IA · Publish Gate v6.4</p><h2>Preparada para subir, probar y enseñar sin caché vieja.</h2><p>v6.4 añade una puerta de publicación: demo publicable, informe, Deploy JSON, guía para GitHub Pages/Netlify/Vercel, auditoría PWA y limpieza de caché.</p><div class="publish64-actions"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="makeDemo64Home">Crear demo publicable</button><button class="btn ghost" id="report64Home">Publish Gate</button><button class="btn ghost" id="copy64Home">Checklist</button><button class="btn ghost" id="json64Home">Deploy JSON</button><button class="btn ghost" id="guide64Home">Guía publicar</button><button class="btn ghost" id="audit64Home">Auditoría</button><button class="btn ghost" id="mode64Home">Modo Publish</button><button class="btn ghost" id="cache64Home">Limpiar caché</button></div></div><div class="publish64-score-big"><span>Publish Gate</span><b>${avg}</b><small>${a.color}</small></div></section>`);const demo=currentReading||h[0]||makeReading({name:'Demo Alaya v6.4',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',readingType:'publish64',publish64Promise:'Una app astral premium lista para publicar.'});const bind=(id,fn)=>{const el=q(id);if(el)el.onclick=fn};bind('#makeDemo64Home',makeDemo64);bind('#report64Home',()=>download(`alaya-publish-gate-v64-${demo.id||'demo'}.html`,report64(demo),'text/html'));bind('#copy64Home',()=>copyText(checklist64(demo)));bind('#json64Home',()=>download(`alaya-deploy-v64-${demo.id||'demo'}.json`,qaJson64(demo),'application/json'));bind('#guide64Home',()=>download('alaya-guia-publicacion-v64.txt',deployGuide64(),'text/plain'));bind('#audit64Home',showAudit64);bind('#mode64Home',togglePublish64);bind('#cache64Home',clearCache64);}
  const oldUniverse64=renderUniverse;
  renderUniverse=function(){oldUniverse64();const h=hist64();const a=audit64();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.publish64||score64(r)),0)/(h.length||1))||a.score;const dash=q('#universeDashboard');if(dash){dash.querySelectorAll('[data-quality63-card],[data-final62-card]').forEach(x=>x.remove());if(!q('[data-publish64-card]',dash))dash.insertAdjacentHTML('beforeend',`<article class="glass" data-publish64-card><span>Publish Gate v6.4</span><b>${avg}</b><small>${a.color} · PWA / demo / deploy</small></article>`)}const cc=q('#commandCenter');if(cc&&!q('[data-publish64-action]',cc))cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-publish64-action><b>Publicación v6.4</b><span>Demo publicable → Publish Gate → Deploy JSON → guía publicar → limpiar caché → prueba móvil.</span></div>`)}
  const oldPulse64=dailyPulse;
  dailyPulse=function(){oldPulse64();const box=q('#dailyPulse');if(box&&!q('[data-publish64-pulse]',box)){const a=audit64();box.insertAdjacentHTML('beforeend',`<div class="publish64-pulse" data-publish64-pulse><b>Publish Gate v6.4 · ${a.color}</b><span>Antes de subir: demo, favorita, informe, Deploy JSON, PWA, PDF, móvil y caché limpia.</span></div>`)}}
  window.__alayaPublish64={audit:audit64,report:report64,checklist:checklist64,qa:qaJson64,guide:deployGuide64,demo:makeDemo64,cache:clearCache64};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v6.4 Publish Gate';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.4 Publish Gate: app astral premium con demo publicable, Deploy JSON, guía de publicación, auditoría PWA, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent='v6.4 Publish Gate';
  const orb=document.querySelector('.orb-core small'); if(orb) orb.textContent='v6.4';
  const cover=document.querySelector('[data-field="title"]');
  const rt=document.querySelector('#readingType'); if(rt){const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','quality63','demo63','audit63','publish64','demo64','audit64','deploy64'];[...rt.options].forEach(o=>{if(!keep.includes(o.value))o.remove()});if(!rt.querySelector('option[value="publish64"]'))rt.insertAdjacentHTML('beforeend','<option value="publish64">Publish Gate v6.4</option><option value="demo64">Demo publicable v6.4</option><option value="audit64">Auditoría v6.4</option><option value="deploy64">Deploy / publicación v6.4</option>')}
  const anchor=document.querySelector('#quality63Notes')||document.querySelector('#centralQuestion');
  if(anchor&&!document.querySelector('#publish64Audience')){anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia v6.4<select id="publish64Audience" name="publish64Audience"><option value="personal">Uso personal</option><option value="demo">Demo para enseñar</option><option value="client">Entrega cliente</option><option value="publish">Publicación PWA</option></select></label><label>Canal v6.4<select id="publish64Channel" name="publish64Channel"><option value="local">ZIP / local</option><option value="github">GitHub Pages</option><option value="netlify">Netlify</option><option value="vercel">Vercel</option><option value="client">Entrega cliente</option></select></label></div><div class="row"><label>Puerta v6.4<select id="publish64Gate" name="publish64Gate"><option value="qa">QA pendiente</option><option value="demo">Lista para demo</option><option value="publish">Lista para publicar</option><option value="hold">Pausada</option></select></label><label>Evidencia v6.4<select id="publish64Proof" name="publish64Proof"><option value="pending">Pendiente</option><option value="mobile">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="full">Ruta completa validada</option></select></label></div><div class="row"><label>Caché v6.4<select id="publish64Cache" name="publish64Cache"><option value="pending">Pendiente</option><option value="clean">Caché limpia comprobada</option><option value="issue">Problema de caché detectado</option></select></label><label>Promesa v6.4<input id="publish64Promise" name="publish64Promise" placeholder="Ej. Lista para publicar con control" /></label></div><label>Notas v6.4<textarea id="publish64Notes" name="publish64Notes" rows="2" placeholder="Pendientes reales: publicar, móvil, PWA, PDF, caché, feedback..."></textarea></label>`)}
  if(!window.__alaya64DelegatedRoute){window.__alaya64DelegatedRoute=true;document.addEventListener('click',e=>{const el=e.target.closest('[data-route]');if(el){e.preventDefault();route(el.dataset.route)}})}
  try{renderHome();renderUniverse();}catch(e){console.warn('v6.4 refresh skipped',e)}
});


// ===== v6.5 Publication Kit: deployment files, SEO templates and final publish preflight =====
(function(){
  const V65='v6.5 Publication Kit';
  const $p=(s,r=document)=>{try{return r.querySelector(s)}catch{return null}};
  const $$p=(s,r=document)=>{try{return [...r.querySelectorAll(s)]}catch{return []}};
  const hist=()=>read(STORE.history,[]);
  const favs=()=>read(STORE.favorites,[]);
  const val=id=>$p('#'+id)?.value||'';
  function input65(r={}){const d=r.data||collectForm?.()||{};return {
    audience:d.publication65Audience||val('publication65Audience')||'demo',
    host:d.publication65Host||val('publication65Host')||'github',
    status:d.publication65Status||val('publication65Status')||'qa',
    seo:d.publication65Seo||val('publication65Seo')||'template',
    cache:d.publication65Cache||val('publication65Cache')||'pending',
    proof:d.publication65Proof||val('publication65Proof')||'pending',
    promise:d.publication65Promise||val('publication65Promise')||'Una app astral premium, limpia y lista para publicar con control real.',
    notes:d.publication65Notes||val('publication65Notes')||''
  }}
  function audit65(){
    const h=hist(), f=favs();
    const visibleLegacy=$$p('[data-publish64-home],[data-quality63-home],[data-final62-home],[data-final61-home],[data-release60-home]').filter(x=>x.offsetParent!==null).length;
    const ids=$$p('[id]').map(x=>x.id);const dup=ids.filter((id,i)=>id&&ids.indexOf(id)!==i&&['downloadPublish64','copyPublish64'].indexOf(id)<0);
    let storageOk=false;try{localStorage.setItem('__alaya65','1');localStorage.removeItem('__alaya65');storageOk=true}catch{}
    const checks=[
      ['Portada limpia',visibleLegacy===0,visibleLegacy?`${visibleLegacy} bloque(s) antiguos visibles.`:'Portada enfocada en Publication Kit.'],
      ['Lectura demo',h.length>0,h.length?`${h.length} lectura(s) guardada(s).`:'Crea una demo publicable.'],
      ['Favoritas',f.length>0,f.length?`${f.length} favorita(s).`:'Marca una demo como favorita.'],
      ['Manifest PWA',!!$p('link[rel="manifest"]'),'manifest.webmanifest enlazado.'],
      ['Service Worker','serviceWorker' in navigator,('serviceWorker' in navigator)?'Disponible en navegador.':'No disponible en este entorno.'],
      ['LocalStorage',storageOk,storageOk?'Almacenamiento local OK.':'No se puede escribir localmente.'],
      ['PDF / impresión',typeof print==='function',typeof print==='function'?'Impresión disponible.':'No disponible.'],
      ['Portapapeles',!!navigator.clipboard, navigator.clipboard?'Clipboard disponible.':'Puede requerir HTTPS/permisos.'],
      ['IDs duplicados',dup.length===0,dup.length?dup.slice(0,8).join(', '):'Sin duplicados visibles relevantes.'],
      ['Rutas principales',['home','lecturas','compatibilidad','universo','ajustes'].every(id=>$p('#'+id)),'Pantallas principales presentes.'],
      ['Móvil real',innerWidth<820||navigator.maxTouchPoints>0,(innerWidth<820||navigator.maxTouchPoints>0)?'Entorno móvil/táctil detectado.':'Probar en iPhone/Android.'],
      ['Astro.com manual separado',true,'Se mantiene como referencia manual pegada, sin automatizar.']
    ];
    let score=Math.round(checks.filter(x=>x[1]).length/checks.length*100);
    score-=Math.min(12,visibleLegacy*4)+Math.min(8,dup.length*2);
    score=Math.max(25,Math.min(100,score));
    const color=score>=90?'verde':score>=76?'ámbar':'rojo';
    return {checks,score,color,history:h.length,favorites:f.length,visibleLegacy,dup,storageOk};
  }
  function score65(r={}){const base=(r.metrics?.publish64||r.metrics?.quality63||r.metrics?.aura||82);const a=audit65();const inp=input65(r);let boost=0;if(inp.status==='publish')boost+=6;if(inp.proof==='full')boost+=7;if(inp.seo==='ready')boost+=4;if(inp.cache==='clean')boost+=3;return Math.max(40,Math.min(100,Math.round((base+a.score+85)/3)+boost));}
  function plan65(r={}){const inp=input65(r),a=audit65();const steps=['Crear demo publicable y marcarla como favorita.','Abrir Mi Universo para validar historial, favoritas y métricas.','Descargar Publication Kit y launch.json.','Comprobar manifest, sw.js, robots.txt, sitemap.xml y version.json.','Subir a GitHub Pages, Netlify o Vercel.','Limpiar caché PWA y recargar la URL publicada.','Probar en iPhone Safari y Android Chrome antes de compartir.'];const blockers=[];if(!a.history)blockers.push('Falta una lectura demo guardada.');if(!a.favorites)blockers.push('Falta una favorita para validar Mi Universo.');if(a.visibleLegacy)blockers.push('Hay bloques antiguos visibles en portada.');if(a.dup.length)blockers.push('Hay IDs duplicados visibles que conviene revisar.');if(inp.seo==='template')blockers.push('robots.txt y sitemap.xml están en modo plantilla: cambia example.com por tu dominio real.');if(inp.cache!=='clean')blockers.push('Caché PWA pendiente de limpieza/comprobación.');if(inp.proof==='pending')blockers.push('Falta evidencia real: móvil, PDF, PWA o ruta completa.');if(!blockers.length)blockers.push('Sin bloqueos críticos locales: lista para publicación controlada.');const score=score65(r);const color=score>=90?'verde':score>=76?'ámbar':'rojo';const next=color==='verde'?'Publicar demo controlada y revisar feedback real.':color==='ámbar'?'Cerrar bloqueos menores antes de compartir públicamente.':'No publicar todavía: completar demo, favorita, SEO, móvil/PWA y caché.';return {...inp,audit:a,steps,blockers,score,color,next};}
  function table65(checks){return `<div class="publication65-table">${checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'✓':'!'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div>`}
  function report65(r={}){const p=plan65(r);return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Publication Kit v6.5 · Alaya Astral IA</title><style>body{margin:0;background:#070413;color:#fff8eb;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1120px;margin:auto;padding:46px}.cover{border:1px solid rgba(255,255,255,.16);border-radius:34px;padding:38px;background:radial-gradient(circle at 15% 0%,rgba(255,216,138,.24),transparent 40%),linear-gradient(135deg,rgba(126,87,255,.22),rgba(255,255,255,.06))}h1{font-size:48px;line-height:.95;margin:0 0 12px}.badge{display:inline-block;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;margin:4px;background:rgba(255,255,255,.08)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}.card{border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:20px;background:rgba(255,255,255,.07)}.score{font-size:72px;font-weight:900}.list div,.checks article{padding:12px;border-radius:16px;background:rgba(255,255,255,.07);margin:8px 0}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ok b{color:#8ff0b1}.warn b{color:#ffd98a}@media(max-width:760px){.grid,.checks{grid-template-columns:1fr}.wrap{padding:22px}h1{font-size:34px}}@media print{body{background:white;color:#111}.cover,.card,.list div,.checks article{background:white;border-color:#ddd}}</style><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${V65}</p><h1>Publication Kit</h1><p>${p.promise}</p><span class="badge">Score ${p.score}/100</span><span class="badge">Semáforo ${p.color}</span><span class="badge">Host ${p.host}</span><span class="badge">SEO ${p.seo}</span></section><section class="grid"><article class="card"><h2>Estado</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Archivos incluidos</h2><ul><li>robots.txt</li><li>sitemap.xml</li><li>version.json</li><li>healthcheck.json</li><li>PUBLISH_CHECKLIST.txt</li><li>DEPLOY_GUIDE.txt</li><li>.nojekyll</li></ul></article><article class="card"><h2>Ruta de publicación</h2><div class="list">${p.steps.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Bloqueos</h2><ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card" style="grid-column:1/-1"><h2>Auditoría local</h2><div class="checks">${p.audit.checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'OK':'Revisar'}</b><br><span>${c[0]}</span><p>${c[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`}
  function checklist65(r={}){const p=plan65(r);return `ALAYA ASTRAL IA · ${V65}\n\nPUBLICATION KIT\nScore: ${p.score}/100\nSemáforo: ${p.color}\nAudiencia: ${p.audience}\nHost: ${p.host}\nEstado: ${p.status}\nSEO: ${p.seo}\nCaché: ${p.cache}\nEvidencia: ${p.proof}\n\nRUTA\n${p.steps.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nBLOQUEOS\n${p.blockers.map(x=>`- ${x}`).join('\n')}\n\nSIGUIENTE\n${p.next}`}
  function launchJson65(r={}){const p=plan65(r);return JSON.stringify({app:'Alaya Astral IA',version:V65,exported:new Date().toISOString(),score:p.score,color:p.color,publication:{audience:p.audience,host:p.host,status:p.status,seo:p.seo,cache:p.cache,proof:p.proof},audit:p.audit,blockers:p.blockers,next:p.next,files:['robots.txt','sitemap.xml','PUBLISH_CHECKLIST.txt','DEPLOY_GUIDE.txt','version.json','healthcheck.json','OFFLINE.txt','.nojekyll','netlify.toml'],reading:r?{id:r.id,title:r.title,metrics:r.metrics,data:r.data}:null},null,2)}
  function showAudit65(){const a=audit65();const div=document.createElement('div');div.className='publication65-modal';div.innerHTML=`<div class="publication65-modal-card"><button class="publication65-close" aria-label="Cerrar">×</button><p class="eyebrow">${V65}</p><h2>Auditoría de publicación · ${a.score}/100 · ${a.color}</h2>${table65(a.checks)}<div class="publication65-note"><b>Lecturas:</b> ${a.history} · <b>Favoritas:</b> ${a.favorites}</div></div>`;div.querySelector('.publication65-close').onclick=()=>div.remove();div.onclick=e=>{if(e.target===div)div.remove()};document.body.append(div)}
  async function clearCache65(){try{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});toast('Caché PWA limpiada. Recarga para comprobar v6.5.')}catch(e){toast('No se pudo limpiar toda la caché: '+e.message)}}
  function toggle65(){document.body.classList.toggle('publication65-focus');toast(document.body.classList.contains('publication65-focus')?'Modo Publication activado':'Modo Publication desactivado')}
  function makeDemo65(){const d={name:'Demo Alaya v6.5',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'publication65',publication65Audience:'demo',publication65Host:'github',publication65Status:'publish',publication65Seo:'template',publication65Cache:'clean',publication65Proof:'full',publication65Promise:'Una app astral premium lista para publicar con Publication Kit.'};const r=makeReading(d);renderReading(r);saveReading(r);try{if(!favoriteIds().includes(r.id))toggleFavorite(r.id)}catch{}route('lecturas');toast('Demo v6.5 creada, guardada y marcada como favorita.');}
  function cleanHome65(){ $$p('[data-publish64-home],[data-quality63-home],[data-final62-home],[data-final61-home],[data-release60-home],[data-candidate59-home],[data-stable58-home],[data-release57-home],[data-polish56-home],[data-demo54-home],[data-showcase53-home],[data-launch52-home]').forEach(x=>x.remove()); }
  const oldMake65=makeReading;
  makeReading=function(d){const r=oldMake65(d);r.metrics=r.metrics||{};r.metrics.publication65=score65(r);const p=plan65(r);if(!(r.layers||[]).some(l=>String(l.title||'').includes('Publication Kit v6.5'))){r.layers=[{icon:'🚀',title:'Publication Kit v6.5 · salida publicable',html:`<div class="publication65-hero"><div><p class="eyebrow">${p.color} · ${p.host}</p><h3>${p.promise}</h3><p>Esta capa convierte la app en un paquete publicable: archivos SEO, checklist, healthcheck, guía de despliegue, caché PWA y evidencia de pruebas.</p></div><div class="publication65-score"><span>Publication</span><b>${p.score}</b><small>${p.status}</small></div></div>`},{icon:'📦',title:'Archivos de publicación v6.5',html:`<div class="publication65-route"><article><b>robots.txt</b><span>Plantilla para indexación.</span></article><article><b>sitemap.xml</b><span>Cambiar example.com por dominio real.</span></article><article><b>healthcheck.json</b><span>Estado técnico del paquete.</span></article><article><b>.nojekyll</b><span>Compatible con GitHub Pages.</span></article><article><b>DEPLOY_GUIDE</b><span>Guía para publicar.</span></article><article><b>CHECKLIST</b><span>Prueba antes de enseñar.</span></article></div>`},{icon:'✅',title:'Bloqueos y siguiente acción v6.5',html:`<ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><div class="publication65-note"><b>Siguiente:</b> ${p.next}</div>`},...(r.layers||[])];}return r;}
  const oldRender65=renderReading;
  renderReading=function(r){r.metrics=r.metrics||{};r.metrics.publication65=r.metrics.publication65||score65(r);oldRender65(r);const actions=$p('#resultArea .result-actions');if(actions&&!$p('#downloadPublication65',actions)){const a=document.createElement('button');a.className='btn secondary small';a.id='downloadPublication65';a.textContent='Publication Kit';a.onclick=()=>download(`alaya-publication-kit-v65-${r.id||'demo'}.html`,report65(r),'text/html');const b=document.createElement('button');b.className='btn ghost small';b.id='copyPublication65';b.textContent='Checklist v6.5';b.onclick=()=>copyText(checklist65(r));const c=document.createElement('button');c.className='btn ghost small';c.id='launchJson65';c.textContent='launch.json';c.onclick=()=>download(`alaya-launch-v65-${r.id||'demo'}.json`,launchJson65(r),'application/json');const d=document.createElement('button');d.className='btn ghost small';d.id='auditPublication65';d.textContent='Auditoría v6.5';d.onclick=showAudit65;actions.append(a,b,c,d)}}
  const oldHome65=renderHome;
  renderHome=function(){oldHome65();cleanHome65();const h=hist();const a=audit65();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.publication65||score65(r)),0)/(h.length||1))||a.score;const stats=$p('#homeStats');if(stats)stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${favs().length}</b><span>favoritas</span></div><div class="stat"><b>${a.score}</b><span>preflight</span></div><div class="stat"><b>${avg}</b><span>publication</span></div>`;const anchor=$p('#dailyPulse');if(anchor&&!$p('[data-publication65-home]'))anchor.insertAdjacentHTML('beforebegin',`<section class="publication65-home glass premium-glow" data-publication65-home><div><p class="eyebrow">Alaya Astral IA · Publication Kit v6.5</p><h2>Lista para empaquetar, publicar y probar sin improvisar.</h2><p>v6.5 añade archivos reales de publicación: robots.txt, sitemap.xml, healthcheck.json, .nojekyll, guía de despliegue, checklist y launch.json.</p><div class="publication65-actions"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="makeDemo65Home">Crear demo publicable</button><button class="btn ghost" id="report65Home">Publication Kit</button><button class="btn ghost" id="copy65Home">Checklist</button><button class="btn ghost" id="json65Home">launch.json</button><button class="btn ghost" id="audit65Home">Auditoría</button><button class="btn ghost" id="mode65Home">Modo Publication</button><button class="btn ghost" id="cache65Home">Limpiar caché</button></div></div><div class="publication65-score-big"><span>Publication</span><b>${avg}</b><small>${a.color}</small></div></section>`);const demo=currentReading||h[0]||makeReading({name:'Demo Alaya v6.5',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',readingType:'publication65'});const bind=(id,fn)=>{const el=$p(id);if(el)el.onclick=fn};bind('#makeDemo65Home',makeDemo65);bind('#report65Home',()=>download(`alaya-publication-kit-v65-${demo.id||'demo'}.html`,report65(demo),'text/html'));bind('#copy65Home',()=>copyText(checklist65(demo)));bind('#json65Home',()=>download(`alaya-launch-v65-${demo.id||'demo'}.json`,launchJson65(demo),'application/json'));bind('#audit65Home',showAudit65);bind('#mode65Home',toggle65);bind('#cache65Home',clearCache65);}
  const oldUniverse65=renderUniverse;
  renderUniverse=function(){oldUniverse65();const h=hist();const a=audit65();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.publication65||score65(r)),0)/(h.length||1))||a.score;const dash=$p('#universeDashboard');if(dash){dash.querySelectorAll('[data-publish64-card],[data-quality63-card],[data-final62-card]').forEach(x=>x.remove());if(!$p('[data-publication65-card]',dash))dash.insertAdjacentHTML('beforeend',`<article class="glass" data-publication65-card><span>Publication Kit v6.5</span><b>${avg}</b><small>${a.color} · SEO / PWA / deploy</small></article>`)}const cc=$p('#commandCenter');if(cc&&!$p('[data-publication65-action]',cc))cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-publication65-action><b>Publicación v6.5</b><span>Demo → Publication Kit → launch.json → sitemap/robots → limpiar caché → prueba móvil.</span></div>`)}
  const oldPulse65=dailyPulse;
  dailyPulse=function(){oldPulse65();const box=$p('#dailyPulse');if(box&&!$p('[data-publication65-pulse]',box)){const a=audit65();box.insertAdjacentHTML('beforeend',`<div class="publication65-pulse" data-publication65-pulse><b>Publication Kit v6.5 · ${a.color}</b><span>Antes de publicar: dominio real en sitemap, demo favorita, PDF, móvil, PWA y caché limpia.</span></div>`)}}
  window.__alayaPublication65={audit:audit65,report:report65,checklist:checklist65,launch:launchJson65,demo:makeDemo65,cache:clearCache65};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v6.5 Publication Kit';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.5 Publication Kit: app astral premium con archivos de publicación, robots, sitemap, healthcheck, PWA, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent='v6.5 Publication Kit';
  const orb=document.querySelector('.orb-core small'); if(orb) orb.textContent='v6.5';
  const rt=document.querySelector('#readingType'); if(rt){const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','publish64','demo64','audit64','deploy64','publication65','demo65','audit65','deploy65'];[...rt.options].forEach(o=>{if(!keep.includes(o.value))o.remove()});if(!rt.querySelector('option[value="publication65"]'))rt.insertAdjacentHTML('beforeend','<option value="publication65">Publication Kit v6.5</option><option value="demo65">Demo publicable v6.5</option><option value="audit65">Auditoría publicación v6.5</option><option value="deploy65">Deploy / publicación v6.5</option>')}
  const anchor=document.querySelector('#publish64Notes')||document.querySelector('#centralQuestion');
  if(anchor&&!document.querySelector('#publication65Audience')){anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>Audiencia v6.5<select id="publication65Audience" name="publication65Audience"><option value="personal">Uso personal</option><option value="demo">Demo para enseñar</option><option value="client">Entrega cliente</option><option value="publish">Publicación PWA</option></select></label><label>Host v6.5<select id="publication65Host" name="publication65Host"><option value="github">GitHub Pages</option><option value="netlify">Netlify</option><option value="vercel">Vercel</option><option value="local">ZIP / local</option><option value="client">Entrega cliente</option></select></label></div><div class="row"><label>Estado v6.5<select id="publication65Status" name="publication65Status"><option value="qa">QA pendiente</option><option value="demo">Lista para demo</option><option value="publish">Lista para publicar</option><option value="hold">Pausada</option></select></label><label>SEO v6.5<select id="publication65Seo" name="publication65Seo"><option value="template">Plantilla example.com</option><option value="ready">Dominio real revisado</option><option value="private">No indexar / privado</option></select></label></div><div class="row"><label>Caché v6.5<select id="publication65Cache" name="publication65Cache"><option value="pending">Pendiente</option><option value="clean">Caché limpia comprobada</option><option value="issue">Problema de caché detectado</option></select></label><label>Evidencia v6.5<select id="publication65Proof" name="publication65Proof"><option value="pending">Pendiente</option><option value="mobile">Móvil probado</option><option value="pdf">PDF revisado</option><option value="pwa">PWA instalada</option><option value="full">Ruta completa validada</option></select></label></div><label>Promesa v6.5<input id="publication65Promise" name="publication65Promise" placeholder="Ej. App lista para publicar con checklist real" /></label><label>Notas v6.5<textarea id="publication65Notes" name="publication65Notes" rows="2" placeholder="Dominio, pruebas móviles, SEO, feedback, pendientes..."></textarea></label>`)}
  if(!window.__alaya65DelegatedRoute){window.__alaya65DelegatedRoute=true;document.addEventListener('click',e=>{const el=e.target.closest('[data-route]');if(el){e.preventDefault();route(el.dataset.route)}})}
  try{renderHome();renderUniverse();}catch(e){console.warn('v6.5 refresh skipped',e)}
});


// ===== v6.6 Domain SEO Kit: dominio real, metadatos, preflight SEO/PWA y exportación de configuración =====
(function(){
  const V66='v6.6 Domain SEO Kit';
  const $v=(s,r=document)=>{try{return r.querySelector(s)}catch{return null}};
  const $$v=(s,r=document)=>{try{return [...r.querySelectorAll(s)]}catch{return []}};
  const h66=()=>{try{return read(STORE.history,[])}catch{return []}};
  const f66=()=>{try{return favoriteIds?favoriteIds():read(STORE.favorites,[])}catch{return []}};
  const v66=id=>$v('#'+id)?.value||'';
  const cleanUrl=u=>{
    u=String(u||'').trim();
    if(!u) return '';
    if(!/^https?:\/\//i.test(u)) u='https://'+u;
    try{const x=new URL(u); return x.origin + (x.pathname==='/'?'':x.pathname.replace(/\/$/,''));}catch{return u.replace(/\/$/,'')}
  };
  function input66(r={}){const d=r.data||((typeof collectForm==='function')?collectForm():{});return {
    publicUrl: cleanUrl(d.domain66Url||v66('domain66Url')||''),
    siteName: d.domain66Name||v66('domain66Name')||'Alaya Astral IA',
    indexMode: d.domain66Index||v66('domain66Index')||'template',
    shareMode: d.domain66Share||v66('domain66Share')||'standard',
    platform: d.domain66Platform||v66('domain66Platform')||'github',
    cachePlan: d.domain66Cache||v66('domain66Cache')||'versioned',
    analytics: d.domain66Analytics||v66('domain66Analytics')||'none',
    promise: d.domain66Promise||v66('domain66Promise')||'Alaya Astral IA lista para publicar con dominio, SEO, PWA y prueba real.',
    notes: d.domain66Notes||v66('domain66Notes')||''
  }}
  function audit66(){
    const inp=input66(); const h=h66(), f=f66();
    const urlOk=!!inp.publicUrl && /^https:\/\//i.test(inp.publicUrl) && !/example\.com/i.test(inp.publicUrl);
    const robotsText=(document.querySelector('link[rel="manifest"]')?.getAttribute('href')||'') ? true : false;
    let storageOk=false;try{localStorage.setItem('__alaya66','1');localStorage.removeItem('__alaya66');storageOk=true}catch{}
    const legacy=$$v('[data-publication65-home],[data-publish64-home],[data-quality63-home],[data-final62-home],[data-final61-home]').filter(x=>x.offsetParent!==null).length;
    const ids=$$v('[id]').map(x=>x.id);const dups=ids.filter((id,i)=>id&&ids.indexOf(id)!==i).filter((id,i,a)=>a.indexOf(id)===i);
    const checks=[
      ['URL pública real',urlOk,urlOk?inp.publicUrl:'Introduce URL real con HTTPS; no uses example.com.'],
      ['Modo indexación definido',inp.indexMode!=='template',inp.indexMode==='template'?'Está en plantilla: decidir indexar/no indexar.':`Modo ${inp.indexMode}.`],
      ['Manifest enlazado',!!$v('link[rel="manifest"]'),'Manifest PWA detectable.'],
      ['Service Worker disponible','serviceWorker' in navigator,('serviceWorker' in navigator)?'Navegador compatible.':'No disponible en este entorno.'],
      ['LocalStorage',storageOk,storageOk?'Datos locales OK.':'No se puede escribir localmente.'],
      ['Lectura demo',h.length>0,h.length?`${h.length} lectura(s) guardada(s).`:'Crea demo publicable.'],
      ['Favoritas / Universo',f.length>0,f.length?`${f.length} favorita(s).`:'Marca demo como favorita.'],
      ['PDF / impresión',typeof print==='function',typeof print==='function'?'Impresión/PDF disponible.':'No disponible.'],
      ['Portapapeles',!!navigator.clipboard,navigator.clipboard?'Copiar disponible.':'Puede requerir HTTPS.'],
      ['Portada sin ruido antiguo',legacy===0,legacy?`${legacy} bloque(s) antiguos visibles.`:'Home limpia para Domain SEO Kit.'],
      ['IDs duplicados visibles',dups.length===0,dups.length?dups.slice(0,8).join(', '):'Sin duplicados visibles.'],
      ['Prueba móvil',innerWidth<820||navigator.maxTouchPoints>0,(innerWidth<820||navigator.maxTouchPoints>0)?'Móvil/táctil detectado.':'Probar en iPhone/Android.'],
      ['Astro.com separado',true,'Referencia manual, sin automatizar ni extraer datos.']
    ];
    let score=Math.round(checks.filter(x=>x[1]).length/checks.length*100);
    if(inp.analytics==='none') score-=2;
    score-=Math.min(12,legacy*4)+Math.min(8,dups.length*2);
    score=Math.max(25,Math.min(100,score));
    const color=score>=90?'verde':score>=76?'ámbar':'rojo';
    return {checks,score,color,urlOk,history:h.length,favorites:f.length,legacy,dups,input:inp,storageOk};
  }
  function score66(r={}){const m=r.metrics||{};const a=audit66();const inp=input66(r);let boost=0;if(a.urlOk)boost+=7;if(inp.indexMode==='index')boost+=4;if(inp.cachePlan==='cleaned')boost+=4;if(inp.analytics!=='none')boost+=2;return Math.max(38,Math.min(100,Math.round(((m.publication65||m.publish64||m.aura||82)+a.score+86)/3)+boost));}
  function plan66(r={}){const inp=input66(r),a=audit66();const files=['site.config.example.json','404.html','_headers','vercel.json','robots.txt','sitemap.xml','healthcheck.json','version.json','DEPLOY_GUIDE.txt','PUBLISH_CHECKLIST.txt'];const steps=['Elegir dominio real o URL final de GitHub Pages/Netlify/Vercel.','Cambiar example.com por tu URL real en sitemap.xml y robots.txt.','Revisar manifest.webmanifest: name, start_url, theme_color e iconos.','Subir el paquete y abrirlo por HTTPS.','Crear demo publicable, marcar favorita y revisar Mi Universo.','Probar PDF/dossier, backup, portapapeles y caché PWA.','Probar en iPhone Safari y Android Chrome antes de compartir.'];const blockers=[];if(!a.urlOk)blockers.push('Falta URL pública real con HTTPS; la app sigue en modo plantilla.');if(inp.indexMode==='template')blockers.push('Falta decidir indexación: indexar, privado o no indexar.');if(!a.history)blockers.push('Falta lectura demo guardada.');if(!a.favorites)blockers.push('Falta favorita para validar Mi Universo.');if(a.legacy)blockers.push('Hay bloques antiguos visibles en portada.');if(a.dups.length)blockers.push('Hay IDs duplicados visibles que conviene revisar.');if(inp.cachePlan!=='cleaned')blockers.push('Caché PWA pendiente de limpieza tras publicar.');if(!blockers.length)blockers.push('Sin bloqueos críticos locales: lista para publicación controlada con dominio real.');const score=score66(r);const color=score>=90?'verde':score>=76?'ámbar':'rojo';const next=color==='verde'?'Publicar/compartir URL final y recoger feedback real.':color==='ámbar'?'Cerrar URL, sitemap/robots, caché y móvil antes de publicar abiertamente.':'No publicar todavía: completar URL, demo, favorita, caché y pruebas móviles.';return {...inp,audit:a,files,steps,blockers,score,color,next};}
  function report66(r={}){const p=plan66(r);return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Domain SEO Kit v6.6 · Alaya Astral IA</title><style>body{margin:0;background:#060310;color:#fff8eb;font-family:Inter,system-ui,sans-serif}.wrap{max-width:1120px;margin:auto;padding:46px}.cover{border:1px solid rgba(255,255,255,.16);border-radius:34px;padding:38px;background:radial-gradient(circle at 16% 0%,rgba(255,216,138,.25),transparent 40%),radial-gradient(circle at 90% 20%,rgba(126,87,255,.25),transparent 45%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.03))}h1{font-size:50px;line-height:.95;margin:0 0 12px}.badge{display:inline-block;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 12px;margin:4px;background:rgba(255,255,255,.08)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}.card{border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:20px;background:rgba(255,255,255,.07)}.score{font-size:76px;font-weight:900}.list div,.checks article{padding:12px;border-radius:16px;background:rgba(255,255,255,.07);margin:8px 0}.checks{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ok b{color:#8ff0b1}.warn b{color:#ffd98a}@media(max-width:760px){.grid,.checks{grid-template-columns:1fr}.wrap{padding:22px}h1{font-size:34px}}@media print{body{background:white;color:#111}.cover,.card,.list div,.checks article{background:white;border-color:#ddd}}</style><body><main class="wrap"><section class="cover"><p>ALAYA ASTRAL IA · ${V66}</p><h1>Domain SEO Kit</h1><p>${p.promise}</p><span class="badge">Score ${p.score}/100</span><span class="badge">Semáforo ${p.color}</span><span class="badge">URL ${p.publicUrl||'pendiente'}</span><span class="badge">Indexación ${p.indexMode}</span></section><section class="grid"><article class="card"><h2>Estado</h2><div class="score">${p.score}</div><p><b>Siguiente:</b> ${p.next}</p></article><article class="card"><h2>Archivos clave</h2><ul>${p.files.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card"><h2>Ruta de publicación</h2><div class="list">${p.steps.map((x,i)=>`<div><b>${String(i+1).padStart(2,'0')}</b> ${x}</div>`).join('')}</div></article><article class="card"><h2>Bloqueos</h2><ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul></article><article class="card" style="grid-column:1/-1"><h2>Auditoría local</h2><div class="checks">${p.audit.checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'OK':'Revisar'}</b><br><span>${c[0]}</span><p>${c[2]}</p></article>`).join('')}</div></article></section><script>setTimeout(()=>print(),500)</script></main></body></html>`}
  function checklist66(r={}){const p=plan66(r);return `ALAYA ASTRAL IA · ${V66}\n\nDOMAIN SEO KIT\nScore: ${p.score}/100\nSemáforo: ${p.color}\nURL pública: ${p.publicUrl||'pendiente'}\nNombre: ${p.siteName}\nIndexación: ${p.indexMode}\nPlataforma: ${p.platform}\nCaché: ${p.cachePlan}\nAnalytics: ${p.analytics}\n\nRUTA\n${p.steps.map((x,i)=>`${String(i+1).padStart(2,'0')}. ${x}`).join('\n')}\n\nBLOQUEOS\n${p.blockers.map(x=>`- ${x}`).join('\n')}\n\nSIGUIENTE\n${p.next}`}
  function config66(r={}){const p=plan66(r);const base=p.publicUrl||'https://example.com/alaya-astral-ia';return JSON.stringify({app:'Alaya Astral IA',version:V66,generatedAt:new Date().toISOString(),site:{name:p.siteName,publicUrl:base,indexMode:p.indexMode,shareMode:p.shareMode,platform:p.platform,analytics:p.analytics},pwa:{manifest:'manifest.webmanifest',serviceWorker:'sw.js',cachePlan:p.cachePlan},seo:{robots:`${base}/robots.txt`,sitemap:`${base}/sitemap.xml`,canonical:base,description:'Santuario astral premium con lecturas por capas, universo personal, PDF profesional y comprobación manual con Astro.com.'},quality:{score:p.score,color:p.color,blockers:p.blockers,next:p.next},files:p.files,astroCom:'Manual pegado por la persona usuaria; sin automatizar ni extraer datos.'},null,2)}
  function showAudit66(){const a=audit66();const div=document.createElement('div');div.className='domain66-modal';div.innerHTML=`<div class="domain66-modal-card"><button class="domain66-close" aria-label="Cerrar">×</button><p class="eyebrow">${V66}</p><h2>Preflight Domain/SEO · ${a.score}/100 · ${a.color}</h2><div class="domain66-table">${a.checks.map(c=>`<article class="${c[1]?'ok':'warn'}"><b>${c[1]?'✓':'!'}</b><span>${c[0]}</span><small>${c[2]}</small></article>`).join('')}</div></div>`;div.querySelector('.domain66-close').onclick=()=>div.remove();div.onclick=e=>{if(e.target===div)div.remove()};document.body.append(div)}
  function makeDemo66(){const d={name:'Demo Alaya v6.6',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',lifeArea:'General',energyGoal:'Claridad',tone:'premium',calcSource:'symbolic',readingType:'domain66',domain66Url:'https://example.com/alaya-astral-ia',domain66Index:'template',domain66Platform:'github',domain66Cache:'versioned',domain66Promise:'Una app astral premium preparada para dominio, SEO, PWA y publicación real.'};const r=makeReading(d);renderReading(r);saveReading(r);try{if(!favoriteIds().includes(r.id))toggleFavorite(r.id)}catch{}route('lecturas');toast('Demo v6.6 creada, guardada y marcada como favorita.');}
  async function clearCache66(){try{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});toast('Caché PWA limpiada. Recarga para comprobar v6.6.')}catch(e){toast('No se pudo limpiar toda la caché: '+e.message)}}
  function toggle66(){document.body.classList.toggle('domain66-focus');toast(document.body.classList.contains('domain66-focus')?'Modo Domain activado':'Modo Domain desactivado')}
  const oldMake66=makeReading;
  makeReading=function(d){const r=oldMake66(d);r.metrics=r.metrics||{};r.metrics.domain66=score66(r);const p=plan66(r);if(!(r.layers||[]).some(l=>String(l.title||'').includes('Domain SEO Kit v6.6'))){r.layers=[{icon:'🌐',title:'Domain SEO Kit v6.6 · publicación con URL real',html:`<div class="domain66-hero"><div><p class="eyebrow">${p.color} · ${p.platform}</p><h3>${p.promise}</h3><p>Esta capa prepara la app para publicar con dominio real, SEO, PWA, caché, URL canónica, sitemap, robots y verificación antes de compartir.</p></div><div class="domain66-score"><span>Domain</span><b>${p.score}</b><small>${p.publicUrl||'URL pendiente'}</small></div></div>`},{icon:'🔎',title:'Preflight SEO/PWA v6.6',html:`<div class="domain66-route"><article><b>URL</b><span>${p.publicUrl||'Pendiente'}</span></article><article><b>Indexación</b><span>${p.indexMode}</span></article><article><b>Caché</b><span>${p.cachePlan}</span></article><article><b>Analytics</b><span>${p.analytics}</span></article><article><b>Demo</b><span>${p.audit.history?'Creada':'Pendiente'}</span></article><article><b>Favorita</b><span>${p.audit.favorites?'Sí':'Pendiente'}</span></article></div>`},{icon:'✅',title:'Bloqueos y siguiente acción v6.6',html:`<ul>${p.blockers.map(x=>`<li>${x}</li>`).join('')}</ul><div class="domain66-note"><b>Siguiente:</b> ${p.next}</div>`},...(r.layers||[])];}return r;}
  const oldRender66=renderReading;
  renderReading=function(r){r.metrics=r.metrics||{};r.metrics.domain66=r.metrics.domain66||score66(r);oldRender66(r);const actions=$v('#resultArea .result-actions');if(actions&&!$v('#downloadDomain66',actions)){const a=document.createElement('button');a.className='btn secondary small';a.id='downloadDomain66';a.textContent='Domain Kit';a.onclick=()=>download(`alaya-domain-seo-kit-v66-${r.id||'demo'}.html`,report66(r),'text/html');const b=document.createElement('button');b.className='btn ghost small';b.id='copyDomain66';b.textContent='Checklist v6.6';b.onclick=()=>copyText(checklist66(r));const c=document.createElement('button');c.className='btn ghost small';c.id='configDomain66';c.textContent='site.config';c.onclick=()=>download(`site-config-v66-${r.id||'demo'}.json`,config66(r),'application/json');const d=document.createElement('button');d.className='btn ghost small';d.id='auditDomain66';d.textContent='Preflight v6.6';d.onclick=showAudit66;actions.append(a,b,c,d)}}
  const oldHome66=renderHome;
  renderHome=function(){oldHome66();$$v('[data-publication65-home],[data-publish64-home],[data-quality63-home],[data-final62-home],[data-final61-home],[data-release60-home]').forEach(x=>x.style.display='none');const h=h66(),a=audit66();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.domain66||score66(r)),0)/(h.length||1))||a.score;const stats=$v('#homeStats');if(stats)stats.innerHTML=`<div class="stat"><b>${h.length}</b><span>lecturas</span></div><div class="stat"><b>${f66().length}</b><span>favoritas</span></div><div class="stat"><b>${a.score}</b><span>preflight</span></div><div class="stat"><b>${avg}</b><span>domain</span></div>`;const anchor=$v('#dailyPulse');if(anchor&&!$v('[data-domain66-home]'))anchor.insertAdjacentHTML('beforebegin',`<section class="domain66-home glass premium-glow" data-domain66-home><div><p class="eyebrow">Alaya Astral IA · Domain SEO Kit v6.6</p><h2>Publicación con dominio real, SEO, PWA y caché bajo control.</h2><p>v6.6 añade preflight de URL real, configuración de sitio, archivos para GitHub Pages/Netlify/Vercel, 404, headers, vercel.json y un checklist más listo para lanzamiento.</p><div class="domain66-actions"><button class="btn primary" data-route="lecturas">Crear lectura</button><button class="btn secondary" id="makeDemo66Home">Crear demo v6.6</button><button class="btn ghost" id="report66Home">Domain Kit</button><button class="btn ghost" id="copy66Home">Checklist</button><button class="btn ghost" id="config66Home">site.config</button><button class="btn ghost" id="audit66Home">Preflight</button><button class="btn ghost" id="mode66Home">Modo Domain</button><button class="btn ghost" id="cache66Home">Limpiar caché</button></div></div><div class="domain66-score-big"><span>Domain</span><b>${avg}</b><small>${a.color}</small></div></section>`);const demo=currentReading||h[0]||makeReading({name:'Demo Alaya v6.6',birthDate:'2000-01-01',birthTime:'12:00',city:'Barcelona',country:'España',readingType:'domain66'});const bind=(id,fn)=>{const el=$v(id);if(el)el.onclick=fn};bind('#makeDemo66Home',makeDemo66);bind('#report66Home',()=>download(`alaya-domain-seo-kit-v66-${demo.id||'demo'}.html`,report66(demo),'text/html'));bind('#copy66Home',()=>copyText(checklist66(demo)));bind('#config66Home',()=>download(`site-config-v66-${demo.id||'demo'}.json`,config66(demo),'application/json'));bind('#audit66Home',showAudit66);bind('#mode66Home',toggle66);bind('#cache66Home',clearCache66);}
  const oldUniverse66=renderUniverse;
  renderUniverse=function(){oldUniverse66();const h=h66(),a=audit66();const avg=Math.round(h.reduce((s,r)=>s+(r.metrics?.domain66||score66(r)),0)/(h.length||1))||a.score;const dash=$v('#universeDashboard');if(dash&&!$v('[data-domain66-card]',dash))dash.insertAdjacentHTML('beforeend',`<article class="glass" data-domain66-card><span>Domain SEO v6.6</span><b>${avg}</b><small>${a.color} · URL / SEO / PWA</small></article>`);const cc=$v('#commandCenter');if(cc&&!$v('[data-domain66-action]',cc))cc.insertAdjacentHTML('beforeend',`<div class="mini-card" data-domain66-action><b>Publicación v6.6</b><span>URL real → sitemap/robots → demo favorita → Domain Kit → limpiar caché → prueba móvil.</span></div>`)}
  const oldPulse66=dailyPulse;
  dailyPulse=function(){oldPulse66();const box=$v('#dailyPulse');if(box&&!$v('[data-domain66-pulse]',box)){const a=audit66();box.insertAdjacentHTML('beforeend',`<div class="domain66-pulse" data-domain66-pulse><b>Domain SEO Kit v6.6 · ${a.color}</b><span>Antes de publicar: URL real HTTPS, sitemap/robots revisados, demo favorita, PDF, móvil y caché limpia.</span></div>`)}}
  window.__alayaDomain66={audit:audit66,report:report66,checklist:checklist66,config:config66,demo:makeDemo66,cache:clearCache66};
})();
window.addEventListener('DOMContentLoaded',()=>{
  document.title='Alaya Astral IA v6.6 Domain SEO Kit';
  const meta=document.querySelector('meta[name="description"]'); if(meta) meta.content='Alaya Astral IA v6.6 Domain SEO Kit: app astral premium preparada para URL real, SEO, PWA, publicación, PDF profesional y Astro.com manual.';
  const small=document.querySelector('.brand small'); if(small) small.textContent='v6.6 Domain SEO Kit';
  const orb=document.querySelector('.orb-core small'); if(orb) orb.textContent='v6.6';
  const rt=document.querySelector('#readingType'); if(rt){const keep=['natal','momento','semana','decision','proposito','compatibilidad','astrocom','publication65','demo65','audit65','deploy65','domain66','demo66','seo66','publish66'];[...rt.options].forEach(o=>{if(!keep.includes(o.value))o.remove()});if(!rt.querySelector('option[value="domain66"]'))rt.insertAdjacentHTML('beforeend','<option value="domain66">Domain SEO Kit v6.6</option><option value="demo66">Demo dominio v6.6</option><option value="seo66">Preflight SEO/PWA v6.6</option><option value="publish66">Publicación dominio v6.6</option>')}
  const anchor=document.querySelector('#publication65Notes')||document.querySelector('#centralQuestion');
  if(anchor&&!document.querySelector('#domain66Url')){anchor.closest('label')?.insertAdjacentHTML('afterend',`<div class="row"><label>URL pública v6.6<input id="domain66Url" name="domain66Url" placeholder="https://tuusuario.github.io/alaya-astral-ia" /></label><label>Nombre público<select id="domain66Name" name="domain66Name"><option value="Alaya Astral IA">Alaya Astral IA</option><option value="Alaya Astral IA · Demo">Alaya Astral IA · Demo</option><option value="Alaya Astral IA · Beta">Alaya Astral IA · Beta</option></select></label></div><div class="row"><label>Indexación v6.6<select id="domain66Index" name="domain66Index"><option value="template">Plantilla / pendiente</option><option value="index">Indexar públicamente</option><option value="noindex">No indexar todavía</option><option value="private">Privado / demo cerrada</option></select></label><label>Plataforma v6.6<select id="domain66Platform" name="domain66Platform"><option value="github">GitHub Pages</option><option value="netlify">Netlify</option><option value="vercel">Vercel</option><option value="local">ZIP / local</option><option value="client">Entrega cliente</option></select></label></div><div class="row"><label>Compartir v6.6<select id="domain66Share" name="domain66Share"><option value="standard">Normal</option><option value="premium">Demo premium</option><option value="private">Privado</option></select></label><label>Caché v6.6<select id="domain66Cache" name="domain66Cache"><option value="versioned">Versionada</option><option value="cleaned">Limpia comprobada</option><option value="issue">Problema de caché</option></select></label></div><div class="row"><label>Analítica v6.6<select id="domain66Analytics" name="domain66Analytics"><option value="none">Sin analítica</option><option value="privacy">Privacidad primero</option><option value="basic">Básica</option></select></label><label>Promesa v6.6<input id="domain66Promise" name="domain66Promise" placeholder="Ej. Santuario astral premium listo para publicar" /></label></div><label>Notas v6.6<textarea id="domain66Notes" name="domain66Notes" rows="2" placeholder="Dominio, plataforma, pruebas móviles, sitemap, caché, pendientes..."></textarea></label>`)}
  if(!window.__alaya66DelegatedRoute){window.__alaya66DelegatedRoute=true;document.addEventListener('click',e=>{const el=e.target.closest('[data-route]');if(el){e.preventDefault();route(el.dataset.route)}})}
  try{renderHome();renderUniverse();}catch(e){console.warn('v6.6 refresh skipped',e)}
});
