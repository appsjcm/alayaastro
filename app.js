const VERSION = "7.1.0";
const STORE = { history: "alaya_v70_history", settings: "alaya_v70_settings", draft: "alaya_v70_draft" };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const signs = ["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"];
const signGlyph = ["♈︎","♉︎","♊︎","♋︎","♌︎","♍︎","♎︎","♏︎","♐︎","♑︎","♒︎","♓︎"];
const planetDefs = [
  ["sun","Sol","☉","Sun"],["moon","Luna","☽","Moon"],["mercury","Mercurio","☿","Mercury"],
  ["venus","Venus","♀","Venus"],["mars","Marte","♂","Mars"],["jupiter","Júpiter","♃","Jupiter"],
  ["saturn","Saturno","♄","Saturn"],["uranus","Urano","♅","Uranus"],["neptune","Neptuno","♆","Neptune"],
  ["pluto","Plutón","♇","Pluto"]
];
const aspectDefs = [
  { name:"Conjunción", angle:0, orb:8, symbol:"☌", tone:"neutral" },
  { name:"Sextil", angle:60, orb:5, symbol:"⚹", tone:"harmony" },
  { name:"Cuadratura", angle:90, orb:6, symbol:"□", tone:"tension" },
  { name:"Trígono", angle:120, orb:7, symbol:"△", tone:"harmony" },
  { name:"Oposición", angle:180, orb:8, symbol:"☍", tone:"tension" }
];

function read(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function normalize(deg){ return ((deg % 360) + 360) % 360; }
function round(value, places = 2){ const p = 10 ** places; return Math.round(value * p) / p; }
function escapeHtml(value = ""){ return String(value).replace(/[&<>"]/g, char => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[char])); }
function toast(message){ const el = document.createElement("div"); el.className = "toast"; el.textContent = message; document.body.append(el); setTimeout(() => el.remove(), 2600); }
function route(id){
  const target = document.getElementById(id) ? id : "inicio";
  $$(".screen").forEach(screen => screen.classList.toggle("active", screen.id === target));
  $$("[data-route]").forEach(link => link.classList.toggle("active", link.dataset.route === target));
  history.replaceState(null, "", `#${target}`);
  if(target === "historial") renderHistory();
  if(target === "inicio") renderHome();
  window.scrollTo({ top:0, behavior:"smooth" });
}
function setStep(step){
  $$(".step-page").forEach(page => page.classList.toggle("active", page.dataset.page === String(step)));
  $$(".step-pill").forEach(button => button.classList.toggle("active", button.dataset.step === String(step)));
}
function formData(){ return Object.fromEntries(new FormData($("#chartForm")).entries()); }
function setupUtcOptions(){
  const select = $("#utcOffset");
  const options = [];
  for(let half = -24; half <= 28; half++){
    const value = half / 2;
    const sign = value >= 0 ? "+" : "−";
    const abs = Math.abs(value);
    const label = `UTC${sign}${String(Math.floor(abs)).padStart(2,"0")}:${abs % 1 ? "30" : "00"}`;
    options.push(`<option value="${value}">${label}</option>`);
  }
  select.innerHTML = options.join("");
  select.value = String(-new Date().getTimezoneOffset() / 60);
}
function requiredOk(){
  const data = formData();
  const fields = [
    ["name","nombre"],["birthDate","fecha"],["birthTime","hora"],["city","ciudad"],["country","país"],
    ["lat","latitud"],["lon","longitud"],["utcOffset","UTC"]
  ];
  const missing = fields.filter(([key]) => data[key] === undefined || String(data[key]).trim() === "").map(([,label]) => label);
  if(missing.length){ toast(`Falta: ${missing.join(", ")}`); return false; }
  const lat = Number(data.lat), lon = Number(data.lon);
  if(!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180){
    toast("Revisa latitud y longitud"); return false;
  }
  return true;
}
function localBirthToUtc(data){
  const [year, month, day] = data.birthDate.split("-").map(Number);
  const [hour, minute] = data.birthTime.split(":").map(Number);
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - Number(data.utcOffset) * 3600000;
  return new Date(utcMillis);
}
function longitudeToPosition(longitude){
  const value = normalize(longitude);
  const signIndex = Math.floor(value / 30);
  const within = value % 30;
  const degree = Math.floor(within);
  const minutes = Math.floor((within - degree) * 60);
  return { longitude:value, sign:signs[signIndex], signIndex, degree, minutes, label:`${degree}° ${String(minutes).padStart(2,"0")}′ ${signs[signIndex]}` };
}
function apparentLongitude(bodyName, date){
  if(bodyName === "Moon") return normalize(Astronomy.EclipticGeoMoon(date).lon);
  const vector = Astronomy.GeoVector(Astronomy.Body[bodyName], date, true);
  return normalize(Astronomy.Ecliptic(vector).elon);
}
function julianDate(date){ return date.getTime() / 86400000 + 2440587.5; }
function meanObliquity(date){
  const t = (julianDate(date) - 2451545.0) / 36525;
  return 23.439291111 - 0.013004167 * t - 0.000000164 * t * t + 0.000000504 * t * t * t;
}
function greenwichSidereal(date){
  const jd = julianDate(date);
  const t = (jd - 2451545.0) / 36525;
  return normalize(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t * t - t * t * t / 38710000);
}
function calculateAscendant(date, latitude, longitude){
  const radians = Math.PI / 180;
  const theta = normalize(greenwichSidereal(date) + longitude) * radians;
  const phi = Math.max(-89.5, Math.min(89.5, latitude)) * radians;
  const epsilon = meanObliquity(date) * radians;
  const lambda = Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)) / radians + 180;
  return normalize(lambda);
}
function parseImportedPositions(text){
  if(!text) return {};
  const aliases = {
    sun:["sol","sun","☉"],moon:["luna","moon","☽"],mercury:["mercurio","mercury","☿"],
    venus:["venus","♀"],mars:["marte","mars","♂"],jupiter:["júpiter","jupiter","♃"],
    saturn:["saturno","saturn","♄"],uranus:["urano","uranus","♅"],neptune:["neptuno","neptune","♆"],
    pluto:["plutón","pluton","pluto","♇"],asc:["ascendente","asc","ac"]
  };
  const result = {};
  for(const [key, names] of Object.entries(aliases)){
    for(const name of names){
      const start = text.toLowerCase().indexOf(name.toLowerCase());
      if(start < 0) continue;
      const sample = text.slice(start, start + 90);
      const signIndex = signs.findIndex(sign => sample.toLowerCase().includes(sign.toLowerCase()));
      if(signIndex < 0) continue;
      const degreeMatch = sample.match(/(\d{1,2})(?:\s*°|\s+deg|\s+)/i);
      const minuteMatch = sample.match(/°\s*(\d{1,2})/);
      const degree = degreeMatch ? Math.min(29, Number(degreeMatch[1])) : 15;
      const minute = minuteMatch ? Math.min(59, Number(minuteMatch[1])) : 0;
      result[key] = signIndex * 30 + degree + minute / 60;
      break;
    }
  }
  return result;
}
function calculateHouses(ascendant, system){
  const first = system === "whole" ? Math.floor(ascendant / 30) * 30 : ascendant;
  return Array.from({ length:12 }, (_, index) => normalize(first + index * 30));
}
function houseFor(longitude, cusps){
  for(let index = 0; index < 12; index++){
    const span = normalize(cusps[(index + 1) % 12] - cusps[index]) || 30;
    const distance = normalize(longitude - cusps[index]);
    if(distance < span) return index + 1;
  }
  return 1;
}
function calculateAspects(positions){
  const keys = planetDefs.map(([key]) => key);
  const aspects = [];
  for(let i = 0; i < keys.length; i++){
    for(let j = i + 1; j < keys.length; j++){
      const separationRaw = Math.abs(positions[keys[i]].longitude - positions[keys[j]].longitude);
      const separation = Math.min(separationRaw, 360 - separationRaw);
      for(const definition of aspectDefs){
        const orb = Math.abs(separation - definition.angle);
        if(orb <= definition.orb){
          aspects.push({ ...definition, from:keys[i], to:keys[j], separation, orb });
          break;
        }
      }
    }
  }
  return aspects.sort((a,b) => a.orb - b.orb);
}
function dominantElement(positions){
  const elements = ["Fuego","Tierra","Aire","Agua"];
  const scores = [0,0,0,0];
  ["sun","moon","mercury","venus","mars","jupiter","saturn","asc"].forEach(key => {
    const signIndex = positions[key].signIndex;
    scores[signIndex % 4] += ["sun","moon","asc"].includes(key) ? 2 : 1;
  });
  return elements[scores.indexOf(Math.max(...scores))];
}
function nameFor(key){ return key === "asc" ? "Ascendente" : planetDefs.find(([id]) => id === key)?.[1] || key; }
function glyphFor(key){ return key === "asc" ? "ASC" : planetDefs.find(([id]) => id === key)?.[2] || "•"; }
function buildReading(data){
  if(typeof Astronomy === "undefined") throw new Error("El módulo de cálculo no se ha cargado.");
  const date = localBirthToUtc(data);
  const imported = parseImportedPositions(data.astroText);
  const positions = {};
  for(const [key,, ,body] of planetDefs){
    const longitude = imported[key] ?? apparentLongitude(body, date);
    positions[key] = { ...longitudeToPosition(longitude), source:imported[key] !== undefined ? "importada" : "calculada" };
  }
  const ascLongitude = imported.asc ?? calculateAscendant(date, Number(data.lat), Number(data.lon));
  positions.asc = { ...longitudeToPosition(ascLongitude), source:imported.asc !== undefined ? "importada" : "aproximada" };
  const cusps = calculateHouses(ascLongitude, data.houses);
  Object.values(positions).forEach(position => { position.house = houseFor(position.longitude, cusps); });
  const aspects = calculateAspects(positions);
  const element = dominantElement(positions);
  const houseLabel = data.houses === "whole" ? "Signo completo" : "Casas iguales";
  const method = Object.keys(imported).length ? `${Object.keys(imported).length} posiciones revisadas` : "Cálculo astral local";
  const sections = [
    { title:`Sol en ${positions.sun.sign}`, text:`Tu identidad central se expresa con cualidades de ${positions.sun.sign}. En casa ${positions.sun.house}, el foco vital se dirige a los temas de esa área de experiencia.` },
    { title:`Luna en ${positions.moon.sign}`, text:`La Luna describe necesidades emocionales y formas de buscar seguridad. Su casa ${positions.moon.house} muestra dónde se activa con más facilidad.` },
    { title:`Ascendente en ${positions.asc.sign}`, text:`El Ascendente aproxima tu forma de entrar en las situaciones y organiza las casas. Si la hora no es exacta, esta posición puede cambiar.` },
    { title:`Elemento ${element}`, text:`La distribución de los puntos personales da mayor peso a ${element.toLowerCase()}. Úsalo como una tendencia de lectura, no como una etiqueta cerrada.` }
  ];
  if(aspects[0]) sections.push({ title:`Aspecto dominante: ${aspects[0].name}`, text:`${nameFor(aspects[0].from)} y ${nameFor(aspects[0].to)} forman una ${aspects[0].name.toLowerCase()} con un orbe de ${round(aspects[0].orb,1)}°. Es uno de los vínculos geométricos más precisos de esta carta.` });
  return {
    id:`alaya-${Date.now()}`, created:new Date().toISOString(), version:VERSION,
    title:`Carta natal de ${data.name}`, subtitle:`${data.city}, ${data.country} · ${data.birthDate} · ${data.birthTime}`,
    data, utcDate:date.toISOString(), positions, cusps, aspects, element, houseLabel, method, sections
  };
}
function polar(cx, cy, radius, degrees){
  const angle = (degrees - 90) * Math.PI / 180;
  return { x:cx + radius * Math.cos(angle), y:cy + radius * Math.sin(angle) };
}
function svgLine(radiusA, radiusB, degree, className){
  const a = polar(300,300,radiusA,degree), b = polar(300,300,radiusB,degree);
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${className}"/>`;
}
function renderWheel(reading){
  const rotation = -reading.positions.asc.longitude;
  const zodiacLines = Array.from({ length:12 }, (_,i) => svgLine(210,274,rotation + i * 30,"wheel-line")).join("");
  const zodiacLabels = signs.map((_,i) => {
    const point = polar(300,300,242,rotation + i * 30 + 15);
    return `<text x="${point.x}" y="${point.y}" class="zodiac-glyph">${signGlyph[i]}</text>`;
  }).join("");
  const houseLines = reading.cusps.map(cusp => svgLine(72,210,rotation + cusp,"house-line")).join("");
  const houseLabels = reading.cusps.map((cusp,i) => {
    const next = reading.cusps[(i + 1) % 12];
    const span = normalize(next - cusp) || 30;
    const point = polar(300,300,192,rotation + cusp + span / 2);
    return `<text x="${point.x}" y="${point.y}" class="house-number">${i + 1}</text>`;
  }).join("");
  const aspectLines = reading.aspects.slice(0,18).map(aspect => {
    const a = polar(300,300,105,rotation + reading.positions[aspect.from].longitude);
    const b = polar(300,300,105,rotation + reading.positions[aspect.to].longitude);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="aspect-line aspect-${aspect.tone}"/>`;
  }).join("");
  const markerKeys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"];
  const markers = markerKeys.map((key,index) => {
    const position = reading.positions[key];
    const radius = 132 + (index % 2) * 25;
    const point = polar(300,300,radius,rotation + position.longitude);
    return `<g><circle cx="${point.x}" cy="${point.y}" r="15" class="planet-dot"/><text x="${point.x}" y="${point.y + 1}" class="planet-glyph">${glyphFor(key)}</text><title>${nameFor(key)}: ${position.label}, casa ${position.house}</title></g>`;
  }).join("");
  const ascPoint = polar(300,300,278,0);
  return `<svg class="natal-wheel" viewBox="0 0 600 600" role="img" aria-label="Rueda natal de ${escapeHtml(reading.data.name)}">
    <circle cx="300" cy="300" r="278" class="wheel-bg"/><circle cx="300" cy="300" r="210" class="wheel-ring"/><circle cx="300" cy="300" r="72" class="wheel-ring"/>
    ${zodiacLines}${zodiacLabels}${houseLines}${houseLabels}${aspectLines}${markers}
    <text x="${ascPoint.x - 16}" y="${ascPoint.y + 4}" class="axis-label">ASC</text>
  </svg>`;
}
function renderBigThree(reading){
  const trio = ["sun","moon","asc"];
  return `<div class="signature"><p class="kicker">Firma elemental</p><h2>${reading.element}</h2><p>${reading.houseLabel} · ${reading.method}</p></div>` + trio.map(key => {
    const position = reading.positions[key];
    return `<article class="big-three-card"><span>${glyphFor(key)}</span><div><b>${nameFor(key)}</b><small>Casa ${position.house}</small></div><strong>${position.sign}<small>${position.degree}° ${String(position.minutes).padStart(2,"0")}′</small></strong></article>`;
  }).join("");
}
function renderPositions(reading){
  const keys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","asc"];
  return `<div class="planet-row header"><span>Punto</span><span>Posición</span><span>Casa</span><span>Fuente</span></div>` + keys.map(key => {
    const position = reading.positions[key];
    return `<div class="planet-row"><span class="planet-name"><span>${glyphFor(key)}</span>${nameFor(key)}</span><span>${position.degree}° ${String(position.minutes).padStart(2,"0")}′ ${position.sign}</span><span>${position.house}</span><span>${position.source}</span></div>`;
  }).join("");
}
function renderAspects(reading){
  if(!reading.aspects.length) return "<p>No se encontraron aspectos mayores dentro de los orbes configurados.</p>";
  return reading.aspects.slice(0,12).map(aspect => `<article class="aspect-card"><span><b>${nameFor(aspect.from)}</b><small>${reading.positions[aspect.from].sign}</small></span><span>${aspect.symbol}</span><span><b>${nameFor(aspect.to)}</b><small>${aspect.name} · orbe ${round(aspect.orb,1)}°</small></span></article>`).join("");
}
function renderMethod(reading){
  return `<b>Método y precisión</b><p>Posiciones tropicales geocéntricas calculadas para ${new Date(reading.utcDate).toLocaleString("es-ES",{ timeZone:"UTC" })} UTC. El Ascendente se obtiene mediante tiempo sidéreo local. Sistema de casas: ${reading.houseLabel}. La exactitud depende especialmente de la hora, el desfase UTC y las coordenadas introducidas.</p>`;
}
function renderReading(reading){
  setStep(3);
  const template = $("#readingTemplate").content.cloneNode(true);
  $('[data-field="title"]',template).textContent = reading.title;
  $('[data-field="subtitle"]',template).textContent = reading.subtitle;
  $('[data-field="badges"]',template).innerHTML = [reading.element,reading.houseLabel,reading.method].map(label => `<span class="badge">${escapeHtml(label)}</span>`).join("");
  $('[data-field="wheel"]',template).innerHTML = renderWheel(reading);
  $('[data-field="bigThree"]',template).innerHTML = renderBigThree(reading);
  $('[data-field="positions"]',template).innerHTML = renderPositions(reading);
  $('[data-field="method"]',template).innerHTML = renderMethod(reading);
  $('[data-field="aspects"]',template).innerHTML = renderAspects(reading);
  $('[data-field="sections"]',template).innerHTML = reading.sections.map(section => `<article class="reading-section"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.text)}</p></article>`).join("");
  const slot = $("#resultSlot");
  slot.innerHTML = "";
  slot.append(template);
  slot.dataset.reading = JSON.stringify(reading);
  const article = $(".reading",slot);
  $('[data-action="save"]',article).onclick = () => saveReading(JSON.parse(slot.dataset.reading));
  $('[data-action="pdf"]',article).onclick = () => window.print();
  $('[data-action="copy"]',article).onclick = () => copyText(readingText(JSON.parse(slot.dataset.reading)));
  $('[data-action="html"]',article).onclick = () => {
    const latest = JSON.parse(slot.dataset.reading);
    download(`alaya-${latest.data.name.toLowerCase().replace(/\s+/g,"-")}.html`, htmlDoc(latest), "text/html");
  };
  slot.scrollIntoView({ behavior:"smooth", block:"start" });
}
function readingText(reading){
  const positions = Object.entries(reading.positions).map(([key,p]) => `${nameFor(key)}: ${p.label}, casa ${p.house}`).join("\n");
  const sections = reading.sections.map(section => `${section.title}\n${section.text}`).join("\n\n");
  return `${reading.title}\n${reading.subtitle}\n\n${positions}\n\n${sections}`;
}
function htmlDoc(reading){
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(reading.title)}</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:auto;padding:32px;color:#303249;background:#fffefa}h1,h2{font-family:Georgia,serif;color:#496b96}.brand{letter-spacing:.18em;color:#a58035}.card{border:1px solid #ded7e8;border-radius:16px;padding:18px;margin:14px 0}.muted{color:#74758a}@media print{body{padding:0}}</style><p class="brand">ALAYA ASTRO</p><h1>${escapeHtml(reading.title)}</h1><p class="muted">${escapeHtml(reading.subtitle)}</p><div class="card"><h2>Posiciones</h2><pre>${escapeHtml(Object.entries(reading.positions).map(([key,p]) => `${nameFor(key)}: ${p.label}, casa ${p.house}`).join("\n"))}</pre></div>${reading.sections.map(section => `<section class="card"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p></section>`).join("")}</html>`;
}
function download(name, content, type = "application/json"){
  const blob = new Blob([content],{ type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href),1000);
}
function copyText(text){ navigator.clipboard?.writeText(text).then(() => toast("Texto copiado")).catch(() => toast("No se pudo copiar")); }
function saveReading(reading){
  const history = read(STORE.history,[]);
  const index = history.findIndex(item => item.id === reading.id);
  if(index >= 0) history[index] = reading; else history.unshift(reading);
  write(STORE.history,history); renderHome(); renderHistory(); toast("Carta guardada");
}
function renderHome(){
  const latest = read(STORE.history,[])[0];
  $("#lastCard").innerHTML = latest
    ? `<p class="kicker">Última carta</p><h2>${escapeHtml(latest.title)}</h2><p>${escapeHtml(latest.subtitle)}</p><button class="text-link" id="openLast">Abrir carta <span>→</span></button>`
    : `<p class="kicker">Tu espacio</p><h2>Aún no hay cartas guardadas</h2><p>Tu próxima carta aparecerá aquí.</p>`;
  if($("#openLast")) $("#openLast").onclick = () => { route("crear"); renderReading(latest); };
}
function renderHistory(){
  const history = read(STORE.history,[]);
  $("#historyList").innerHTML = history.length ? history.map(reading => `<article class="history-item"><p class="kicker">${new Date(reading.created).toLocaleDateString("es-ES")}</p><h2>${escapeHtml(reading.title)}</h2><p>${escapeHtml(reading.subtitle)}<br>${reading.element} · ${reading.houseLabel}</p><div class="actions"><button class="button secondary small" data-open="${reading.id}">Abrir</button><button class="button quiet small" data-delete="${reading.id}">Borrar</button></div></article>`).join("") : `<article class="history-item"><h2>No hay cartas guardadas</h2><p>Crea una carta y pulsa Guardar.</p></article>`;
  $$("[data-open]").forEach(button => button.onclick = () => { const reading = read(STORE.history,[]).find(item => item.id === button.dataset.open); route("crear"); renderReading(reading); });
  $$("[data-delete]").forEach(button => button.onclick = () => { write(STORE.history,read(STORE.history,[]).filter(item => item.id !== button.dataset.delete)); renderHistory(); renderHome(); });
}
function saveDraft(){ write(STORE.draft,formData()); }
function loadDraft(){
  const draft = read(STORE.draft,null); if(!draft) return;
  Object.entries(draft).forEach(([key,value]) => {
    const controls = $$(`[name="${key}"]`);
    controls.forEach(control => { if(control.type === "radio") control.checked = control.value === value; else control.value = value; });
  });
  updateChoices();
}
function updateChoices(){ $$(".choice").forEach(choice => choice.classList.toggle("selected",$("input",choice)?.checked)); }
function applySettings(){
  const settings = read(STORE.settings,{});
  document.body.classList.toggle("comfort",!!settings.comfort);
  document.body.classList.toggle("contrast",!!settings.contrast);
  $("#comfortToggle").checked = !!settings.comfort; $("#contrastToggle").checked = !!settings.contrast;
}
function createDemo(){
  const demo = { name:"Atenea",birthDate:"1992-07-21",birthTime:"12:30",city:"Barcelona",country:"España",lat:"41.3874",lon:"2.1686",utcOffset:"2",timeAccuracy:"exacta",houses:"whole",readingType:"natal",intention:"Comprender mis talentos y mi manera de relacionarme." };
  Object.entries(demo).forEach(([key,value]) => $$(`[name="${key}"]`).forEach(control => { if(control.type === "radio") control.checked = control.value === value; else control.value = value; }));
  updateChoices(); route("crear"); renderReading(buildReading(demo));
}
function bind(){
  document.addEventListener("click",event => {
    const routeButton = event.target.closest("[data-route]");
    if(routeButton){ event.preventDefault(); route(routeButton.dataset.route); }
    const next = event.target.closest("[data-next]");
    if(next){ if(next.dataset.next === "2" && !requiredOk()) return; setStep(next.dataset.next); }
    const step = event.target.closest("[data-step]");
    if(step) setStep(step.dataset.step);
  });
  $("#chartForm").addEventListener("submit",event => {
    event.preventDefault(); if(!requiredOk()) return;
    try { const data = formData(); saveDraft(); renderReading(buildReading(data)); }
    catch(error){ console.error(error); toast(error.message || "No se pudo calcular la carta"); }
  });
  $("#chartForm").addEventListener("input",() => { saveDraft(); updateChoices(); });
  $$("[data-demo]").forEach(button => button.onclick = createDemo);
  $("#welcomeStart").onclick = () => {
    const name = $("#welcomeName").value.trim();
    if(name) $("#name").value = name;
    localStorage.setItem("alaya_welcome_seen","1");
    $("#welcomeModal").classList.add("hidden");
    if(name) saveDraft();
  };
  $("#welcomeSkip").onclick = () => {
    localStorage.setItem("alaya_welcome_seen","1");
    $("#welcomeModal").classList.add("hidden");
  };
  $("#clearHistoryBtn").onclick = () => { if(confirm("¿Borrar todas las cartas guardadas?")){ write(STORE.history,[]); renderHistory(); renderHome(); } };
  $("#exportBtn").onclick = () => download("alaya-cartas-v7.json",JSON.stringify(read(STORE.history,[]),null,2));
  $("#importFile").onchange = event => {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const data = JSON.parse(reader.result); if(!Array.isArray(data)) throw new Error(); write(STORE.history,data); renderHistory(); renderHome(); toast("Cartas importadas"); } catch { toast("Archivo no válido"); } };
    reader.readAsText(file);
  };
  $("#comfortToggle").onchange = event => { const settings = read(STORE.settings,{}); settings.comfort = event.target.checked; write(STORE.settings,settings); applySettings(); };
  $("#contrastToggle").onchange = event => { const settings = read(STORE.settings,{}); settings.contrast = event.target.checked; write(STORE.settings,settings); applySettings(); };
}
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt",event => { event.preventDefault(); deferredPrompt = event; $("#installBtn").classList.remove("hidden"); });
document.addEventListener("DOMContentLoaded",() => {
  setupUtcOptions(); bind(); loadDraft(); applySettings(); renderHome(); renderHistory(); updateChoices();
  route(location.hash.slice(1) || "inicio");
  const install = async () => {
    if(deferredPrompt){ deferredPrompt.prompt(); deferredPrompt = null; }
    else toast("La instalación aparecerá cuando el navegador la permita");
  };
  $("#installBtn").onclick = install;
  $("#installQuick").onclick = install;
  if(!localStorage.getItem("alaya_welcome_seen")) $("#welcomeModal").classList.remove("hidden");
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
