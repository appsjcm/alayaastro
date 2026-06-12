const VERSION = "7.5.0";
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
const pointDefs = [
  ["asc","Ascendente","ASC"],["mc","Medio Cielo","MC"],["northNode","Nodo Norte","☊"],
  ["southNode","Nodo Sur","☋"],["lilith","Lilith media","⚸"],["fortune","Parte de Fortuna","⊗"]
];
const aspectDefs = [
  { name:"Conjunción", angle:0, orb:8, symbol:"☌", tone:"neutral", major:true },
  { name:"Semisextil", angle:30, orb:2, symbol:"⚺", tone:"adjustment" },
  { name:"Semicuadratura", angle:45, orb:2, symbol:"∠", tone:"tension" },
  { name:"Sextil", angle:60, orb:5, symbol:"⚹", tone:"harmony", major:true },
  { name:"Quintil", angle:72, orb:2, symbol:"Q", tone:"creative" },
  { name:"Cuadratura", angle:90, orb:6, symbol:"□", tone:"tension", major:true },
  { name:"Trígono", angle:120, orb:7, symbol:"△", tone:"harmony", major:true },
  { name:"Sesquicuadratura", angle:135, orb:2, symbol:"⚼", tone:"tension" },
  { name:"Biquintil", angle:144, orb:2, symbol:"bQ", tone:"creative" },
  { name:"Quincuncio", angle:150, orb:3, symbol:"⚻", tone:"adjustment" },
  { name:"Oposición", angle:180, orb:8, symbol:"☍", tone:"tension", major:true }
];
let geoCities = [];
let selectedCity = null;

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
function searchKey(value){
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
function formatUtcOffset(value){
  const sign = value >= 0 ? "+" : "−";
  const totalMinutes = Math.round(Math.abs(value) * 60);
  return `UTC${sign}${String(Math.floor(totalMinutes / 60)).padStart(2,"0")}:${String(totalMinutes % 60).padStart(2,"0")}`;
}
function offsetAtInstant(timeZone, date){
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA",{
    timeZone, year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
  }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type,Number(part.value)]));
  const represented = Date.UTC(parts.year,parts.month - 1,parts.day,parts.hour,parts.minute,parts.second);
  return (represented - date.getTime()) / 3600000;
}
function historicalUtcOffset(timeZone, dateString, timeString){
  if(!timeZone || !dateString || !timeString) return null;
  const [year,month,day] = dateString.split("-").map(Number);
  const [hour,minute] = timeString.split(":").map(Number);
  const wallTime = Date.UTC(year,month - 1,day,hour,minute);
  let instant = wallTime;
  for(let i = 0; i < 3; i++) instant = wallTime - offsetAtInstant(timeZone,new Date(instant)) * 3600000;
  return round(offsetAtInstant(timeZone,new Date(instant)),4);
}
function updateLocationSummary(){
  const summary = $("#locationSummary");
  const city = $("#city").value.trim();
  const country = $("#country").value.trim();
  const lat = Number($("#lat").value), lon = Number($("#lon").value);
  const timezone = $("#timezone").value;
  const offset = historicalUtcOffset(timezone,$("#birthDate").value,$("#birthTime").value);
  if(offset !== null) $("#utcOffset").value = String(offset);
  if(city && country && Number.isFinite(lat) && Number.isFinite(lon) && timezone){
    summary.classList.add("ready");
    summary.innerHTML = `<span>✓</span><div><b>${escapeHtml(city)}, ${escapeHtml(country)}</b><small>${lat.toFixed(4)}, ${lon.toFixed(4)} · ${escapeHtml(timezone)}${offset === null ? " · añade fecha y hora" : ` · ${formatUtcOffset(offset)}`}</small></div>`;
  } else {
    summary.classList.remove("ready");
    summary.innerHTML = "<span>⌖</span><div><b>Selecciona país y ciudad</b><small>Las coordenadas y la zona horaria se completarán automáticamente.</small></div>";
  }
}
async function loadCountries(){
  const response = await fetch("data/countries.json");
  if(!response.ok) throw new Error("No se pudo cargar la lista de países");
  const countries = await response.json();
  $("#countryCode").innerHTML = `<option value="">Selecciona un país</option>${countries.map(([code,name]) => `<option value="${code}">${escapeHtml(name)}</option>`).join("")}`;
  $("#city").disabled = true;
}
async function loadCities(countryCode){
  geoCities = []; selectedCity = null; $("#cityResults").classList.add("hidden");
  if(!countryCode){ $("#city").disabled = true; return; }
  $("#city").disabled = true; $("#city").placeholder = "Cargando ciudades…";
  const response = await fetch(`data/cities/${countryCode}.json`);
  if(!response.ok) throw new Error("No se pudieron cargar las ciudades de este país");
  geoCities = await response.json();
  $("#city").disabled = false; $("#city").placeholder = "Escribe al menos 2 letras";
}
function renderCityResults(query){
  const key = searchKey(query);
  const box = $("#cityResults");
  if(key.length < 2){ box.classList.add("hidden"); box.innerHTML = ""; return; }
  const starts = [], contains = [];
  for(const row of geoCities){
    const name = searchKey(row[0]), ascii = searchKey(row[1]);
    if(name.startsWith(key) || ascii.startsWith(key)) starts.push(row);
    else if(name.includes(key) || ascii.includes(key)) contains.push(row);
    if(starts.length >= 30) break;
  }
  const results = starts.concat(contains).slice(0,30);
  box.innerHTML = results.length ? results.map((row,index) => `<button class="city-option" type="button" data-city-index="${index}"><span><b>${escapeHtml(row[0])}</b><small>${row[2] ? `Región ${escapeHtml(row[2])}` : escapeHtml($("#country").value)}</small></span><small>${row[6] ? Number(row[6]).toLocaleString("es-ES") : ""}</small></button>`).join("") : `<div class="city-option"><span><b>Sin resultados</b><small>Prueba otra escritura o usa la entrada manual.</small></span></div>`;
  box.dataset.results = JSON.stringify(results);
  box.classList.remove("hidden");
}
function selectGeoCity(row){
  selectedCity = row;
  $("#city").value = row[0];
  $("#lat").value = row[3];
  $("#lon").value = row[4];
  $("#timezone").value = row[5];
  $("#cityResults").classList.add("hidden");
  updateLocationSummary();
  saveDraft();
}
function requiredOk(){
  const data = formData();
  const fields = [
    ["name","nombre"],["birthDate","fecha"],["birthTime","hora"],["city","ciudad"],["country","país"],
    ["lat","latitud"],["lon","longitud"],["timezone","zona horaria"],["utcOffset","UTC"]
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
function calculateMidheaven(date, longitude){
  const radians = Math.PI / 180;
  const theta = normalize(greenwichSidereal(date) + longitude) * radians;
  const epsilon = meanObliquity(date) * radians;
  return normalize(Math.atan2(Math.sin(theta),Math.cos(theta) * Math.cos(epsilon)) / radians);
}
function calculateMeanNode(date){
  const t = (julianDate(date) - 2451545.0) / 36525;
  return normalize(125.04452 - 1934.136261 * t + 0.0020708 * t * t + t * t * t / 450000);
}
function calculateMeanLilith(date){
  const t = (julianDate(date) - 2451545.0) / 36525;
  return normalize(83.3532465 + 4069.0137287 * t - 0.01032 * t * t - t * t * t / 80053);
}
function parseImportedPositions(text){
  if(!text) return {};
  const aliases = {
    sun:["sol","sun","☉"],moon:["luna","moon","☽"],mercury:["mercurio","mercury","☿"],
    venus:["venus","♀"],mars:["marte","mars","♂"],jupiter:["júpiter","jupiter","♃"],
    saturn:["saturno","saturn","♄"],uranus:["urano","uranus","♅"],neptune:["neptuno","neptune","♆"],
    pluto:["plutón","pluton","pluto","♇"],asc:["ascendente","asc","ac"],mc:["medio cielo","mc"],
    northNode:["nodo norte","nodo verdadero","☊"],southNode:["nodo sur","☋"],lilith:["lilith","luna negra","⚸"],
    fortune:["parte de fortuna","fortuna","⊗"]
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
function divideArc(start, end){
  const span = normalize(end - start);
  return [start,normalize(start + span / 3),normalize(start + span * 2 / 3)];
}
function calculateHouses(ascendant, midheaven, system){
  if(system === "whole"){
    const first = Math.floor(ascendant / 30) * 30;
    return Array.from({ length:12 }, (_, index) => normalize(first + index * 30));
  }
  if(system === "porphyry"){
    const descendant = normalize(ascendant + 180);
    const imumCoeli = normalize(midheaven + 180);
    return [
      ...divideArc(ascendant,imumCoeli),
      ...divideArc(imumCoeli,descendant),
      ...divideArc(descendant,midheaven),
      ...divideArc(midheaven,ascendant)
    ];
  }
  return Array.from({ length:12 }, (_, index) => normalize(ascendant + index * 30));
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
  const keys = [...planetDefs.map(([key]) => key),"asc","mc","northNode","lilith","fortune"].filter(key => positions[key]);
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
function nameFor(key){ return planetDefs.find(([id]) => id === key)?.[1] || pointDefs.find(([id]) => id === key)?.[1] || key; }
function glyphFor(key){ return planetDefs.find(([id]) => id === key)?.[2] || pointDefs.find(([id]) => id === key)?.[2] || "•"; }
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
  const mcLongitude = imported.mc ?? calculateMidheaven(date,Number(data.lon));
  const northNodeLongitude = imported.northNode ?? calculateMeanNode(date);
  const southNodeLongitude = imported.southNode ?? normalize(northNodeLongitude + 180);
  const lilithLongitude = imported.lilith ?? calculateMeanLilith(date);
  const fortuneLongitude = imported.fortune ?? normalize(ascLongitude + positions.moon.longitude - positions.sun.longitude);
  positions.asc = { ...longitudeToPosition(ascLongitude), source:imported.asc !== undefined ? "importada" : "aproximada" };
  positions.mc = { ...longitudeToPosition(mcLongitude), source:imported.mc !== undefined ? "importada" : "calculada" };
  positions.northNode = { ...longitudeToPosition(northNodeLongitude), source:imported.northNode !== undefined ? "importada" : "calculada" };
  positions.southNode = { ...longitudeToPosition(southNodeLongitude), source:imported.southNode !== undefined ? "importada" : "calculada" };
  positions.lilith = { ...longitudeToPosition(lilithLongitude), source:imported.lilith !== undefined ? "importada" : "calculada" };
  positions.fortune = { ...longitudeToPosition(fortuneLongitude), source:imported.fortune !== undefined ? "importada" : "calculada" };
  const cusps = calculateHouses(ascLongitude,mcLongitude,data.houses);
  Object.values(positions).forEach(position => { position.house = houseFor(position.longitude, cusps); });
  const aspects = calculateAspects(positions);
  const element = dominantElement(positions);
  const houseLabels = { whole:"Signo completo",equal:"Casas iguales",porphyry:"Porfirio" };
  const houseLabel = houseLabels[data.houses] || "Casas iguales";
  const method = Object.keys(imported).length ? `${Object.keys(imported).length} posiciones revisadas` : "Cálculo astral local";
  const sections = [
    { title:`Sol en ${positions.sun.sign}`, text:`Tu identidad central se expresa con cualidades de ${positions.sun.sign}. En casa ${positions.sun.house}, el foco vital se dirige a los temas de esa área de experiencia.` },
    { title:`Luna en ${positions.moon.sign}`, text:`La Luna describe necesidades emocionales y formas de buscar seguridad. Su casa ${positions.moon.house} muestra dónde se activa con más facilidad.` },
    { title:`Ascendente en ${positions.asc.sign}`, text:`El Ascendente aproxima tu forma de entrar en las situaciones y organiza las casas. Si la hora no es exacta, esta posición puede cambiar.` },
    { title:`Medio Cielo en ${positions.mc.sign}`, text:`El Medio Cielo orienta la vocación, la visibilidad y la forma de construir una contribución pública. En ${positions.mc.sign}, esa dirección adopta su lenguaje particular.` },
    { title:`Lilith en ${positions.lilith.sign}`, text:`Lilith media señala una zona de autonomía, intensidad y emociones que no aceptan ser domesticadas. En casa ${positions.lilith.house}, pide reconocer deseo, límites y poder personal.` },
    { title:`Nodo Norte en ${positions.northNode.sign}`, text:`El eje nodal conecta hábitos conocidos con una dirección de crecimiento. El Nodo Norte en ${positions.northNode.sign}, casa ${positions.northNode.house}, describe cualidades que conviene desarrollar conscientemente.` },
    { title:`Fortuna en ${positions.fortune.sign}`, text:`La Parte de Fortuna combina Sol, Luna y Ascendente. En casa ${positions.fortune.house}, sugiere un ámbito donde coherencia interna y acción pueden fluir con mayor naturalidad.` },
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
function angularDistance(a,b){
  const distance = Math.abs(normalize(a) - normalize(b));
  return Math.min(distance,360 - distance);
}
function layoutMarkers(reading, keys, rotation){
  const tracks = [[],[],[]];
  return keys.map(key => ({ key, angle:normalize(rotation + reading.positions[key].longitude) }))
    .sort((a,b) => a.angle - b.angle)
    .map(item => {
      let track = tracks.findIndex(items => items.every(other => angularDistance(item.angle,other.angle) >= 13));
      if(track < 0) track = tracks.reduce((best,items,index) => items.length < tracks[best].length ? index : best,0);
      tracks[track].push(item.angle);
      return { ...item, radius:[175,204,146][track], track };
    });
}
function renderWheel(reading){
  const center = 350;
  const rotation = -reading.positions.asc.longitude;
  const line = (radiusA,radiusB,degree,className) => {
    const a = polar(center,center,radiusA,degree), b = polar(center,center,radiusB,degree);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${className}"/>`;
  };
  const zodiacLines = Array.from({ length:12 }, (_,i) => line(248,326,rotation + i * 30,"wheel-line")).join("");
  const degreeTicks = Array.from({ length:72 }, (_,i) => {
    const degree = i * 5;
    const inner = degree % 30 === 0 ? 248 : degree % 10 === 0 ? 316 : 321;
    return line(inner,326,rotation + degree,degree % 30 === 0 ? "degree-tick major" : "degree-tick");
  }).join("");
  const zodiacLabels = signs.map((_,i) => {
    const point = polar(center,center,290,rotation + i * 30 + 15);
    const namePoint = polar(center,center,316,rotation + i * 30 + 15);
    return `<text x="${point.x}" y="${point.y}" class="zodiac-glyph">${signGlyph[i]}</text><text x="${namePoint.x}" y="${namePoint.y}" class="zodiac-name">${signs[i].slice(0,3).toUpperCase()}</text>`;
  }).join("");
  const houseLines = reading.cusps.map(cusp => line(104,248,rotation + cusp,"house-line")).join("");
  const houseLabels = reading.cusps.map((cusp,i) => {
    const next = reading.cusps[(i + 1) % 12];
    const span = normalize(next - cusp) || 30;
    const point = polar(center,center,229,rotation + cusp + span / 2);
    return `<circle cx="${point.x}" cy="${point.y}" r="13" class="house-number-bg"/><text x="${point.x}" y="${point.y + 1}" class="house-number">${i + 1}</text>`;
  }).join("");
  const aspectLines = reading.aspects.slice(0,42).map(aspect => {
    const a = polar(center,center,96,rotation + reading.positions[aspect.from].longitude);
    const b = polar(center,center,96,rotation + reading.positions[aspect.to].longitude);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="aspect-line aspect-${aspect.tone}${aspect.major ? " aspect-major" : " aspect-minor"}"><title>${nameFor(aspect.from)} ${aspect.name} ${nameFor(aspect.to)}</title></line>`;
  }).join("");
  const markerKeys = [...planetDefs.map(([key]) => key),"northNode","southNode","lilith","fortune"];
  const markers = layoutMarkers(reading,markerKeys,rotation).map(({key,angle,radius,track}) => {
    const position = reading.positions[key];
    const anchor = polar(center,center,116,angle);
    const point = polar(center,center,radius,angle);
    return `<g class="planet-marker track-${track}"><line x1="${anchor.x}" y1="${anchor.y}" x2="${point.x}" y2="${point.y}" class="planet-guide"/><circle cx="${anchor.x}" cy="${anchor.y}" r="3" class="degree-dot"/><circle cx="${point.x}" cy="${point.y}" r="22" class="planet-dot"/><text x="${point.x}" y="${point.y - 5}" class="planet-glyph">${glyphFor(key)}</text><text x="${point.x}" y="${point.y + 12}" class="planet-degree">${position.degree}°</text><title>${nameFor(key)}: ${position.label}, casa ${position.house}</title></g>`;
  }).join("");
  const axes = [["ASC",0],["DSC",180],["MC",rotation + reading.positions.mc.longitude],["IC",rotation + reading.positions.mc.longitude + 180]].map(([label,angle]) => {
    const inside = polar(center,center,330,angle);
    return `<text x="${inside.x}" y="${inside.y}" class="axis-label">${label}</text>`;
  }).join("");
  return `<svg class="natal-wheel" viewBox="0 0 700 700" role="img" aria-label="Cosmograma completo de ${escapeHtml(reading.data.name)}">
    <circle cx="${center}" cy="${center}" r="334" class="wheel-bg"/><circle cx="${center}" cy="${center}" r="326" class="wheel-ring outer"/><circle cx="${center}" cy="${center}" r="248" class="wheel-ring"/><circle cx="${center}" cy="${center}" r="104" class="wheel-ring inner"/>
    ${degreeTicks}${zodiacLines}${zodiacLabels}${houseLines}${houseLabels}${aspectLines}${markers}
    ${axes}<circle cx="${center}" cy="${center}" r="7" class="wheel-center"/><text x="${center}" y="${center + 27}" class="wheel-center-label">ALAYA ASTRO</text>
  </svg><div class="wheel-legend"><span><i class="legend-line harmony"></i>Fluidez</span><span><i class="legend-line tension"></i>Tensión</span><span><i class="legend-line adjustment"></i>Ajuste</span><span><i class="legend-line creative"></i>Creatividad</span><span><b>☊</b>Nodo</span><span><b>⚸</b>Lilith</span><span><b>⊗</b>Fortuna</span></div>`;
}
function renderBigThree(reading){
  const trio = ["sun","moon","asc"];
  return `<div class="signature"><p class="kicker">Firma elemental</p><h2>${reading.element}</h2><p>${reading.houseLabel} · ${reading.method}</p></div>` + trio.map(key => {
    const position = reading.positions[key];
    return `<article class="big-three-card"><span>${glyphFor(key)}</span><div><b>${nameFor(key)}</b><small>Casa ${position.house}</small></div><strong>${position.sign}<small>${position.degree}° ${String(position.minutes).padStart(2,"0")}′</small></strong></article>`;
  }).join("");
}
function renderPositions(reading){
  const keys = [...planetDefs.map(([key]) => key),"asc","mc","northNode","southNode","lilith","fortune"];
  return `<div class="planet-row header"><span>Punto</span><span>Posición</span><span>Casa</span><span>Fuente</span></div>` + keys.map(key => {
    const position = reading.positions[key];
    return `<div class="planet-row"><span class="planet-name"><span>${glyphFor(key)}</span>${nameFor(key)}</span><span>${position.degree}° ${String(position.minutes).padStart(2,"0")}′ ${position.sign}</span><span>${position.house}</span><span>${position.source}</span></div>`;
  }).join("");
}
function renderHouseCusps(reading){
  return reading.cusps.map((cusp,index) => {
    const position = longitudeToPosition(cusp);
    const angle = index === 0 ? "ASC" : index === 3 ? "IC" : index === 6 ? "DSC" : index === 9 ? "MC" : "";
    return `<article class="house-cusp"><span>${index + 1}</span><div><b>Casa ${index + 1}${angle ? ` · ${angle}` : ""}</b><small>${position.degree}° ${String(position.minutes).padStart(2,"0")}′ ${position.sign}</small></div></article>`;
  }).join("");
}
function renderAspects(reading){
  if(!reading.aspects.length) return "<p>No se encontraron aspectos dentro de los orbes configurados.</p>";
  const major = reading.aspects.filter(aspect => aspect.major);
  const minor = reading.aspects.filter(aspect => !aspect.major);
  const cards = list => list.map(aspect => `<article class="aspect-card aspect-card-${aspect.tone}"><span><b>${nameFor(aspect.from)}</b><small>${reading.positions[aspect.from].sign}</small></span><span>${aspect.symbol}</span><span><b>${nameFor(aspect.to)}</b><small>${aspect.name} · orbe ${round(aspect.orb,1)}°</small></span></article>`).join("");
  return `<div class="aspect-group"><h3>Aspectos mayores <small>${major.length}</small></h3><div class="aspect-grid">${cards(major)}</div></div><div class="aspect-group"><h3>Aspectos menores <small>${minor.length}</small></h3><div class="aspect-grid">${cards(minor)}</div></div>`;
}
function renderMethod(reading){
  return `<b>Método y precisión</b><p>Posiciones tropicales geocéntricas calculadas para ${new Date(reading.utcDate).toLocaleString("es-ES",{ timeZone:"UTC" })} UTC. Ascendente y Medio Cielo se obtienen mediante tiempo sidéreo local; Nodo Norte y Lilith corresponden a sus posiciones medias. La Parte de Fortuna usa la fórmula diurna como aproximación. Sistema de casas: ${reading.houseLabel}. La exactitud depende especialmente de la hora, el desfase UTC y las coordenadas introducidas.</p>`;
}
function aiChartContext(reading){
  const positions = Object.entries(reading.positions)
    .map(([key,position]) => `${nameFor(key)}: ${position.label}, casa ${position.house}`)
    .join("\n");
  const aspects = reading.aspects.slice(0,24)
    .map(aspect => `${nameFor(aspect.from)} ${aspect.name} ${nameFor(aspect.to)}, orbe ${round(aspect.orb,1)}°`)
    .join("\n");
  return `Sistema de casas: ${reading.houseLabel}
Elemento dominante: ${reading.element}
Intención de la persona: ${reading.data.intention || "Comprender su carta natal"}

POSICIONES
${positions}

ASPECTOS MÁS PRECISOS
${aspects}`;
}
function aiResponseText(response){
  if(typeof response === "string") return response;
  const content = response?.message?.content;
  if(typeof content === "string") return content;
  if(Array.isArray(content)) return content.map(part => part?.text || "").join("");
  if(typeof response?.text === "string") return response.text;
  return "";
}
function renderAiText(text){
  return `<div class="ai-content">${escapeHtml(text).replace(/\n/g,"<br>")}</div>`;
}
async function generateAiReading(reading, article, button){
  const output = $('[data-field="ai"]',article);
  if(!window.puter?.ai?.chat){
    output.innerHTML = "<p>La conexión con la IA no está disponible. Comprueba internet y vuelve a intentarlo.</p>";
    return;
  }
  button.disabled = true;
  button.textContent = "Interpretando la carta…";
  output.classList.add("loading");
  output.innerHTML = "<p>Uniendo planetas, casas y aspectos…</p>";
  const messages = [
    {
      role:"system",
      content:"Eres la voz astrológica de Alaya Astro. Redacta en español una interpretación natal profunda, cálida y responsable. La astrología es una herramienta simbólica de reflexión, no una certeza científica ni una predicción fatalista. No diagnostiques salud, no anuncies sucesos inevitables y no inventes posiciones. Organiza la respuesta con estos títulos: ESENCIA Y MUNDO EMOCIONAL, VOCACIÓN Y CAMINO, VÍNCULOS, SOMBRAS Y CRECIMIENTO, TALENTOS, y ORIENTACIÓN PRÁCTICA. Integra los aspectos entre sí, evita repetir datos y termina con tres preguntas de reflexión. Extensión aproximada: 900 palabras."
    },
    { role:"user", content:aiChartContext(reading) }
  ];
  try {
    const response = await puter.ai.chat(messages,false,{ max_tokens:1800,temperature:.65 });
    const text = aiResponseText(response).trim();
    if(!text) throw new Error("Respuesta vacía");
    reading.aiInterpretation = text;
    reading.aiGenerated = new Date().toISOString();
    $("#resultSlot").dataset.reading = JSON.stringify(reading);
    output.innerHTML = renderAiText(text);
    button.textContent = "Regenerar interpretación";
    toast("Interpretación completada");
  } catch(error){
    console.error(error);
    output.innerHTML = "<p>No se pudo completar la interpretación. Puede ser necesario iniciar sesión o revisar la conexión antes de intentarlo de nuevo.</p>";
    button.textContent = "Reintentar interpretación";
  } finally {
    output.classList.remove("loading");
    button.disabled = false;
  }
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
  $('[data-field="houses"]',template).innerHTML = renderHouseCusps(reading);
  $('[data-field="method"]',template).innerHTML = renderMethod(reading);
  $('[data-field="aspects"]',template).innerHTML = renderAspects(reading);
  $('[data-field="sections"]',template).innerHTML = reading.sections.map(section => `<article class="reading-section"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.text)}</p></article>`).join("");
  $('[data-field="ai"]',template).innerHTML = reading.aiInterpretation ? renderAiText(reading.aiInterpretation) : "<p>La interpretación aparecerá aquí cuando pulses el botón.</p>";
  const slot = $("#resultSlot");
  slot.innerHTML = "";
  slot.append(template);
  slot.dataset.reading = JSON.stringify(reading);
  const article = $(".reading",slot);
  const aiButton = $('[data-action="ai"]',article);
  if(reading.aiInterpretation) aiButton.textContent = "Regenerar interpretación";
  aiButton.onclick = () => generateAiReading(JSON.parse(slot.dataset.reading),article,aiButton);
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
  const ai = reading.aiInterpretation ? `\n\nINTERPRETACIÓN CON IA\n${reading.aiInterpretation}` : "";
  return `${reading.title}\n${reading.subtitle}\n\n${positions}\n\n${sections}${ai}`;
}
function htmlDoc(reading){
  const ai = reading.aiInterpretation ? `<section class="card"><h2>Interpretación personalizada</h2><p>${escapeHtml(reading.aiInterpretation).replace(/\n/g,"<br>")}</p></section>` : "";
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(reading.title)}</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:auto;padding:32px;color:#303249;background:#fffefa}h1,h2{font-family:Georgia,serif;color:#496b96}.brand{letter-spacing:.18em;color:#a58035}.card{border:1px solid #ded7e8;border-radius:16px;padding:18px;margin:14px 0}.muted{color:#74758a}@media print{body{padding:0}}</style><p class="brand">ALAYA ASTRO</p><h1>${escapeHtml(reading.title)}</h1><p class="muted">${escapeHtml(reading.subtitle)}</p><div class="card"><h2>Posiciones</h2><pre>${escapeHtml(Object.entries(reading.positions).map(([key,p]) => `${nameFor(key)}: ${p.label}, casa ${p.house}`).join("\n"))}</pre></div>${reading.sections.map(section => `<section class="card"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p></section>`).join("")}${ai}</html>`;
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
async function loadDraft(){
  const draft = read(STORE.draft,null); if(!draft) return;
  Object.entries(draft).forEach(([key,value]) => {
    const controls = $$(`[name="${key}"]`);
    controls.forEach(control => { if(control.type === "radio") control.checked = control.value === value; else control.value = value; });
  });
  if(draft.countryCode){
    await loadCities(draft.countryCode);
    $("#city").value = draft.city || "";
  }
  updateLocationSummary();
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
  const demo = { name:"Atenea",birthDate:"1992-07-21",birthTime:"12:30",city:"Barcelona",country:"España",countryCode:"ES",lat:"41.3874",lon:"2.1686",timezone:"Europe/Madrid",utcOffset:"2",timeAccuracy:"exacta",houses:"whole",readingType:"natal",intention:"Comprender mis talentos y mi manera de relacionarme." };
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
  $("#countryCode").addEventListener("change",async event => {
    const option = event.target.selectedOptions[0];
    $("#country").value = option?.textContent || "";
    $("#city").value = ""; $("#lat").value = ""; $("#lon").value = ""; $("#timezone").value = ""; $("#utcOffset").value = "";
    updateLocationSummary();
    try { await loadCities(event.target.value); } catch(error){ toast(error.message); }
    saveDraft();
  });
  $("#city").addEventListener("input",event => {
    selectedCity = null;
    $("#lat").value = ""; $("#lon").value = ""; $("#timezone").value = ""; $("#utcOffset").value = "";
    updateLocationSummary();
    renderCityResults(event.target.value);
  });
  $("#cityResults").addEventListener("click",event => {
    const button = event.target.closest("[data-city-index]");
    if(!button) return;
    const results = JSON.parse($("#cityResults").dataset.results || "[]");
    selectGeoCity(results[Number(button.dataset.cityIndex)]);
  });
  document.addEventListener("click",event => {
    if(!event.target.closest(".city-field")) $("#cityResults").classList.add("hidden");
  });
  $("#birthDate").addEventListener("change",updateLocationSummary);
  $("#birthTime").addEventListener("change",updateLocationSummary);
  $("#manualLocationToggle").addEventListener("change",event => $("#manualLocationFields").classList.toggle("hidden",!event.target.checked));
  $("#applyManualLocation").addEventListener("click",() => {
    const lat = Number($("#manualLat").value), lon = Number($("#manualLon").value);
    const timezone = $("#manualTimezone").value.trim();
    try { new Intl.DateTimeFormat("es",{ timeZone:timezone }).format(new Date()); }
    catch { toast("La zona horaria no es válida"); return; }
    if(!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180){ toast("Revisa las coordenadas"); return; }
    if(!$("#city").value.trim() || !$("#country").value.trim()){ toast("Escribe ciudad y selecciona el país"); return; }
    $("#lat").value = lat; $("#lon").value = lon; $("#timezone").value = timezone;
    updateLocationSummary(); saveDraft(); toast("Ubicación manual aplicada");
  });
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
document.addEventListener("DOMContentLoaded",async () => {
  bind();
  try { await loadCountries(); await loadDraft(); } catch(error){ toast(error.message); }
  applySettings(); renderHome(); renderHistory(); updateChoices();
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
