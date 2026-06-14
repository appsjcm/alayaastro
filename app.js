const VERSION = "7.9.0";
const STORE = { history: "alaya_v70_history", settings: "alaya_v70_settings", draft: "alaya_v70_draft" };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const signs = ["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"];
const signGlyph = ["♈︎","♉︎","♊︎","♋︎","♌︎","♍︎","♎︎","♏︎","♐︎","♑︎","♒︎","♓︎"];
const houseThemes = ["Identidad","Recursos","Comunicación","Hogar","Creatividad","Rutinas","Vínculos","Transformación","Sentido","Vocación","Comunidad","Mundo interior"];
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
let geoCities2 = [];
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
  const options = `<option value="">Selecciona un país</option>${countries.map(([code,name]) => `<option value="${code}">${escapeHtml(name)}</option>`).join("")}`;
  $("#countryCode").innerHTML = options;
  $("#countryCode2").innerHTML = options;
  $("#city").disabled = true;
  $("#city2").disabled = true;
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
async function loadCities2(countryCode){
  geoCities2 = []; $("#cityResults2").classList.add("hidden");
  if(!countryCode){ $("#city2").disabled = true; return; }
  $("#city2").disabled = true; $("#city2").placeholder = "Cargando ciudades…";
  const response = await fetch(`data/cities/${countryCode}.json`);
  if(!response.ok) throw new Error("No se pudieron cargar las ciudades de la segunda persona");
  geoCities2 = await response.json();
  $("#city2").disabled = false; $("#city2").placeholder = "Escribe al menos 2 letras";
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
function updateLocationSummary2(){
  const summary = $("#locationSummary2");
  const city = $("#city2").value.trim(), country = $("#country2").value.trim();
  const lat = Number($("#lat2").value), lon = Number($("#lon2").value), timezone = $("#timezone2").value;
  const offset = historicalUtcOffset(timezone,$("#birthDate2").value,$("#birthTime2").value);
  if(offset !== null) $("#utcOffset2").value = String(offset);
  if(city && country && Number.isFinite(lat) && Number.isFinite(lon) && timezone){
    summary.classList.add("ready");
    summary.innerHTML = `<span>✓</span><div><b>${escapeHtml(city)}, ${escapeHtml(country)}</b><small>${lat.toFixed(4)}, ${lon.toFixed(4)} · ${escapeHtml(timezone)}${offset === null ? " · añade fecha y hora" : ` · ${formatUtcOffset(offset)}`}</small></div>`;
  } else {
    summary.classList.remove("ready");
    summary.innerHTML = "<span>⌖</span><div><b>Selecciona país y ciudad</b><small>Coordenadas y zona horaria automáticas.</small></div>";
  }
}
function renderCityResults2(query){
  const key = searchKey(query), box = $("#cityResults2");
  if(key.length < 2){ box.classList.add("hidden"); box.innerHTML = ""; return; }
  const results = geoCities2.filter(row => searchKey(row[0]).includes(key) || searchKey(row[1]).includes(key)).slice(0,30);
  box.innerHTML = results.length ? results.map((row,index) => `<button class="city-option" type="button" data-city2-index="${index}"><span><b>${escapeHtml(row[0])}</b><small>${row[2] ? `Región ${escapeHtml(row[2])}` : escapeHtml($("#country2").value)}</small></span><small>${row[6] ? Number(row[6]).toLocaleString("es-ES") : ""}</small></button>`).join("") : `<div class="city-option"><span><b>Sin resultados</b><small>Prueba otra escritura.</small></span></div>`;
  box.dataset.results = JSON.stringify(results); box.classList.remove("hidden");
}
function selectGeoCity2(row){
  $("#city2").value = row[0]; $("#lat2").value = row[3]; $("#lon2").value = row[4]; $("#timezone2").value = row[5];
  $("#cityResults2").classList.add("hidden"); updateLocationSummary2(); saveDraft();
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
  if(data.readingType === "compatibilidad"){
    const partnerFields = [["name2","nombre de la segunda persona"],["birthDate2","fecha de la segunda persona"],["birthTime2","hora de la segunda persona"],["city2","ciudad de la segunda persona"],["country2","país de la segunda persona"],["lat2","latitud de la segunda persona"],["lon2","longitud de la segunda persona"],["utcOffset2","UTC de la segunda persona"]];
    const missingPartner = partnerFields.filter(([key]) => !String(data[key] || "").trim()).map(([,label]) => label);
    if(missingPartner.length){ toast(`Falta: ${missingPartner.join(", ")}`); return false; }
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
function calculateSynastry(first, second){
  const keys = [...planetDefs.map(([key]) => key),"asc","mc","northNode","lilith"];
  const definitions = aspectDefs.filter(definition => definition.major);
  const aspects = [];
  for(const from of keys){
    for(const to of keys){
      const raw = Math.abs(first.positions[from].longitude - second.positions[to].longitude);
      const separation = Math.min(raw,360 - raw);
      for(const definition of definitions){
        const allowedOrb = ["sun","moon","asc"].includes(from) || ["sun","moon","asc"].includes(to) ? Math.min(definition.orb,6) : Math.min(definition.orb,4);
        const orb = Math.abs(separation - definition.angle);
        if(orb <= allowedOrb){
          aspects.push({ ...definition,from,to,separation,orb });
          break;
        }
      }
    }
  }
  aspects.sort((a,b) => a.orb - b.orb);
  const areas = [
    { key:"Emoción",glyph:"☽",keys:["moon","sun","asc"] },
    { key:"Comunicación",glyph:"☿",keys:["mercury"] },
    { key:"Atracción",glyph:"♀",keys:["venus","mars","pluto","lilith"] },
    { key:"Crecimiento",glyph:"♃",keys:["jupiter","saturn","northNode","mc"] }
  ].map(area => {
    const matches = aspects.filter(aspect => area.keys.includes(aspect.from) || area.keys.includes(aspect.to));
    const harmony = matches.filter(aspect => aspect.tone === "harmony").length;
    const tension = matches.filter(aspect => aspect.tone === "tension").length;
    const neutral = matches.filter(aspect => aspect.tone === "neutral").length;
    const score = Math.max(25,Math.min(95,55 + harmony * 7 + neutral * 3 - tension * 3));
    return { ...area,score,count:matches.length,harmony,tension };
  });
  const overlayKeys = ["sun","moon","mercury","venus","mars","jupiter","saturn","northNode","lilith"];
  const overlays = {
    firstInSecond:overlayKeys.map(key => ({ key,house:houseFor(first.positions[key].longitude,second.cusps) })),
    secondInFirst:overlayKeys.map(key => ({ key,house:houseFor(second.positions[key].longitude,first.cusps) }))
  };
  const areaText = {
    "Emoción":{
      high:"Hay varios puentes naturales para reconocer necesidades, ritmos y maneras de expresar afecto.",
      medium:"La conexión emocional combina afinidad con diferencias que conviene nombrar con calma.",
      low:"Las necesidades emocionales pueden operar con códigos distintos; preguntar antes de interpretar será esencial."
    },
    "Comunicación":{
      high:"Las ideas encuentran vías ágiles de intercambio y existe facilidad para estimular la curiosidad mutua.",
      medium:"La conversación puede ser fértil cuando se aclaran intención, tono y expectativas.",
      low:"Conviene reducir suposiciones y comprobar qué quiso decir realmente cada persona."
    },
    "Atracción":{
      high:"La carta muestra una corriente intensa de interés, magnetismo y movilización creativa.",
      medium:"La atracción se alimenta tanto de coincidencias como de contrastes que despiertan movimiento.",
      low:"El deseo puede expresarse a ritmos diferentes; los límites y el consentimiento necesitan especial claridad."
    },
    "Crecimiento":{
      high:"El vínculo ofrece apoyos visibles para ampliar perspectivas y sostener aprendizajes compartidos.",
      medium:"Hay potencial de crecimiento si libertad, compromiso y responsabilidad se negocian de forma explícita.",
      low:"Las lecciones pueden sentirse exigentes; resulta útil separar acompañamiento de obligación."
    }
  };
  const insights = areas.map(area => {
    const level = area.score >= 72 ? "high" : area.score >= 50 ? "medium" : "low";
    const strongest = aspects.find(aspect => area.keys.includes(aspect.from) || area.keys.includes(aspect.to));
    return {
      key:area.key,
      score:area.score,
      text:areaText[area.key][level],
      evidence:strongest ? `${nameFor(strongest.from)} ${strongest.name.toLowerCase()} ${nameFor(strongest.to)} · orbe ${round(strongest.orb,1)}°` : "Sin contactos mayores dentro de los orbes configurados."
    };
  });
  return { aspects,areas,overlays,insights };
}
function partnerDataFrom(data){
  return {
    name:data.name2,birthDate:data.birthDate2,birthTime:data.birthTime2,city:data.city2,country:data.country2,
    countryCode:data.countryCode2,lat:data.lat2,lon:data.lon2,timezone:data.timezone2,utcOffset:data.utcOffset2,
    timeAccuracy:"exacta",houses:data.houses,readingType:"natal",intention:data.intention || "",astroText:""
  };
}
function calculateTransitSnapshot(reading, date = new Date()){
  const positions = {};
  for(const [key,, ,body] of planetDefs){
    const longitude = apparentLongitude(body,date);
    positions[key] = { ...longitudeToPosition(longitude),house:houseFor(longitude,reading.cusps) };
  }
  const nodeLongitude = calculateMeanNode(date);
  positions.northNode = { ...longitudeToPosition(nodeLongitude),house:houseFor(nodeLongitude,reading.cusps) };
  const transitKeys = [...planetDefs.map(([key]) => key),"northNode"];
  const natalKeys = [...planetDefs.map(([key]) => key),"asc","mc","northNode"];
  const definitions = aspectDefs.filter(definition => definition.major);
  const aspects = [];
  for(const transit of transitKeys){
    for(const natal of natalKeys){
      const raw = Math.abs(positions[transit].longitude - reading.positions[natal].longitude);
      const separation = Math.min(raw,360 - raw);
      for(const definition of definitions){
        const allowedOrb = ["sun","moon"].includes(transit) ? Math.min(definition.orb,4) : Math.min(definition.orb,3);
        const orb = Math.abs(separation - definition.angle);
        if(orb <= allowedOrb){
          aspects.push({ ...definition,transit,natal,separation,orb,transitHouse:positions[transit].house });
          break;
        }
      }
    }
  }
  aspects.sort((a,b) => a.orb - b.orb);
  return { date:date.toISOString(),positions,aspects };
}
function transitMeaning(aspect){
  const tone = {
    harmony:"facilita una expresión más fluida",
    tension:"plantea una fricción que pide conciencia y ajuste",
    neutral:"intensifica y concentra esta función"
  }[aspect.tone] || "activa este tema";
  return `${nameFor(aspect.transit)} en tránsito ${tone} al tocar tu ${nameFor(aspect.natal)} natal. La casa ${aspect.transitHouse} señala el área cotidiana donde puede sentirse con más claridad.`;
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
  const transits = data.readingType === "hoy" ? calculateTransitSnapshot({ positions,cusps },new Date()) : null;
  const reading = {
    id:`alaya-${Date.now()}`, created:new Date().toISOString(), version:VERSION,
    title:`Carta natal de ${data.name}`, subtitle:`${data.city}, ${data.country} · ${data.birthDate} · ${data.birthTime}`,
    data, utcDate:date.toISOString(), positions, cusps, aspects, element, houseLabel, method, sections, transits
  };
  if(data.readingType === "compatibilidad"){
    const partner = buildReading(partnerDataFrom(data));
    reading.partner = partner;
    reading.synastry = calculateSynastry(reading,partner);
    reading.title = `Sinastría de ${data.name} y ${partner.data.name}`;
    reading.subtitle = `${data.city}, ${data.country} · ${partner.data.city}, ${partner.data.country}`;
  }
  return reading;
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
    const next = reading.cusps[(index + 1) % 12];
    const span = normalize(next - cusp) || 30;
    const angle = index === 0 ? "ASC" : index === 3 ? "IC" : index === 6 ? "DSC" : index === 9 ? "MC" : "";
    return `<article class="house-cusp"><span>${index + 1}</span><div><b>Casa ${index + 1}${angle ? ` · ${angle}` : ""}</b><small class="house-theme">${houseThemes[index]}</small><small class="cusp-position">${position.degree}° ${String(position.minutes).padStart(2,"0")}′ ${position.sign}</small><small class="cusp-span">Amplitud ${round(span,1)}°</small></div></article>`;
  }).join("");
}
function renderHouseNote(reading){
  if(reading.data.houses === "whole") return `<b>Signo completo</b><p>Los 0° son correctos: este sistema hace comenzar cada casa exactamente al inicio de un signo. El Ascendente conserva su grado real en la tabla de posiciones.</p>`;
  if(reading.data.houses === "equal") return `<b>Casas iguales</b><p>Todas las cúspides comparten el mismo grado y minuto del Ascendente, avanzando un signo por casa. Cada sector mide exactamente 30°.</p>`;
  return `<b>Porfirio</b><p>Las cúspides son variables porque cada cuadrante se divide en tres partes. Por eso verás grados y amplitudes diferentes entre unas casas y otras.</p>`;
}
function renderAspects(reading){
  if(!reading.aspects.length) return "<p>No se encontraron aspectos dentro de los orbes configurados.</p>";
  const major = reading.aspects.filter(aspect => aspect.major);
  const minor = reading.aspects.filter(aspect => !aspect.major);
  const cards = list => list.map(aspect => `<article class="aspect-card aspect-card-${aspect.tone}"><span><b>${nameFor(aspect.from)}</b><small>${reading.positions[aspect.from].sign}</small></span><span>${aspect.symbol}</span><span><b>${nameFor(aspect.to)}</b><small>${aspect.name} · orbe ${round(aspect.orb,1)}°</small></span></article>`).join("");
  return `<div class="aspect-group"><h3>Aspectos mayores <small>${major.length}</small></h3><div class="aspect-grid">${cards(major)}</div></div><div class="aspect-group"><h3>Aspectos menores <small>${minor.length}</small></h3><div class="aspect-grid">${cards(minor)}</div></div>`;
}
function renderSynastryWheel(reading){
  const center = 350, rotation = -reading.positions.asc.longitude;
  const line = (r1,r2,degree,className) => {
    const a = polar(center,center,r1,degree), b = polar(center,center,r2,degree);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="${className}"/>`;
  };
  const zodiac = signs.map((sign,index) => {
    const p = polar(center,center,318,rotation + index * 30 + 15);
    return `${line(292,334,rotation + index * 30,"wheel-line")}<text x="${p.x}" y="${p.y}" class="zodiac-glyph">${signGlyph[index]}</text>`;
  }).join("");
  const keys = [...planetDefs.map(([key]) => key),"asc","northNode","lilith"];
  const markers = (chart,radius,className) => keys.map(key => {
    const angle = rotation + chart.positions[key].longitude;
    const p = polar(center,center,radius,angle);
    return `<g class="${className}"><circle cx="${p.x}" cy="${p.y}" r="15"/><text x="${p.x}" y="${p.y + 1}">${glyphFor(key)}</text><title>${chart.data.name}: ${nameFor(key)} ${chart.positions[key].label}</title></g>`;
  }).join("");
  const aspects = reading.synastry.aspects.slice(0,30).map(aspect => {
    const a = polar(center,center,198,rotation + reading.positions[aspect.from].longitude);
    const b = polar(center,center,250,rotation + reading.partner.positions[aspect.to].longitude);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="synastry-line aspect-${aspect.tone}"><title>${nameFor(aspect.from)} ${aspect.name} ${nameFor(aspect.to)}</title></line>`;
  }).join("");
  return `<svg class="synastry-wheel" viewBox="0 0 700 700" role="img" aria-label="Doble rueda de ${escapeHtml(reading.data.name)} y ${escapeHtml(reading.partner.data.name)}"><circle cx="350" cy="350" r="338" class="wheel-bg"/><circle cx="350" cy="350" r="292" class="wheel-ring outer"/><circle cx="350" cy="350" r="266" class="synastry-ring partner"/><circle cx="350" cy="350" r="222" class="synastry-ring primary"/><circle cx="350" cy="350" r="172" class="wheel-ring inner"/>${zodiac}${aspects}${markers(reading,210,"synastry-marker primary")}${markers(reading.partner,266,"synastry-marker partner")}<text x="350" y="344" class="synastry-center-name">${escapeHtml(reading.data.name)}</text><text x="350" y="365" class="synastry-center-name partner">${escapeHtml(reading.partner.data.name)}</text></svg>`;
}
function renderSynastry(reading){
  if(!reading.synastry) return "";
  const areas = reading.synastry.areas.map(area => `<article class="compatibility-card"><span>${area.glyph}</span><div><b>${area.key}</b><small>${area.count} contactos · ${area.harmony} fluidos · ${area.tension} tensos</small><div class="compatibility-bar"><i style="width:${area.score}%"></i></div></div><strong>${area.score}%</strong></article>`).join("");
  const insights = reading.synastry.insights.map(insight => `<article class="synastry-insight"><div><b>${escapeHtml(insight.key)}</b><span>${insight.score}%</span></div><p>${escapeHtml(insight.text)}</p><small>${escapeHtml(insight.evidence)}</small></article>`).join("");
  const overlayList = (items,owner,host) => items.map(item => `<article class="overlay-item"><span>${glyphFor(item.key)}</span><div><b>${nameFor(item.key)} de ${escapeHtml(owner)}</b><small>activa la casa ${item.house} de ${escapeHtml(host)} · ${houseThemes[item.house - 1]}</small></div><strong>${item.house}</strong></article>`).join("");
  const overlays = `<div class="overlay-columns"><section><h4>${escapeHtml(reading.data.name)} en la carta de ${escapeHtml(reading.partner.data.name)}</h4>${overlayList(reading.synastry.overlays.firstInSecond,reading.data.name,reading.partner.data.name)}</section><section><h4>${escapeHtml(reading.partner.data.name)} en la carta de ${escapeHtml(reading.data.name)}</h4>${overlayList(reading.synastry.overlays.secondInFirst,reading.partner.data.name,reading.data.name)}</section></div>`;
  const aspects = reading.synastry.aspects.slice(0,18).map(aspect => `<article class="synastry-aspect aspect-card-${aspect.tone}"><span><b>${reading.data.name}</b><small>${glyphFor(aspect.from)} ${nameFor(aspect.from)}</small></span><strong>${aspect.symbol}</strong><span><b>${reading.partner.data.name}</b><small>${glyphFor(aspect.to)} ${nameFor(aspect.to)} · ${aspect.name} ${round(aspect.orb,1)}°</small></span></article>`).join("");
  return `<div class="synastry-names"><span><i class="primary"></i>${escapeHtml(reading.data.name)}</span><span><i class="partner"></i>${escapeHtml(reading.partner.data.name)}</span></div><div class="synastry-wheel-wrap">${renderSynastryWheel(reading)}</div><div class="compatibility-grid">${areas}</div><h3 class="synastry-subtitle">Síntesis del vínculo</h3><div class="synastry-insights">${insights}</div><h3 class="synastry-subtitle">Superposición de casas</h3><p class="synastry-lead">Muestra en qué área vital de una persona se expresa cada planeta de la otra.</p>${overlays}<h3 class="synastry-subtitle">Aspectos entre ambas cartas</h3><div class="synastry-aspects">${aspects}</div><p class="synastry-disclaimer">Los porcentajes resumen la mezcla de contactos, no determinan el éxito de una relación. Las tensiones también pueden aportar atracción, conciencia y crecimiento.</p>`;
}
function renderTransits(reading){
  if(!reading.transits) return `<div class="transit-empty"><span>↻</span><div><b>Calcula el cielo de ahora</b><p>La carta natal permanece fija; los tránsitos se actualizan cuando tú lo decidas.</p></div></div>`;
  const date = new Date(reading.transits.date);
  const positionCards = ["sun","moon","mercury","venus","mars","jupiter","saturn"].map(key => {
    const position = reading.transits.positions[key];
    return `<article class="transit-position"><span>${glyphFor(key)}</span><div><b>${nameFor(key)}</b><small>${position.degree}° ${String(position.minutes).padStart(2,"0")}′ ${position.sign} · casa ${position.house}</small></div></article>`;
  }).join("");
  const aspectCards = reading.transits.aspects.slice(0,12).map(aspect => `<article class="transit-aspect aspect-card-${aspect.tone}"><div class="transit-aspect-title"><span>${glyphFor(aspect.transit)}</span><b>${nameFor(aspect.transit)} ${aspect.symbol} ${nameFor(aspect.natal)}</b><small>orbe ${round(aspect.orb,1)}°</small></div><p>${transitMeaning(aspect)}</p></article>`).join("");
  return `<div class="transit-date"><b>${date.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}</b><span>Calculado a las ${date.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</span></div><div class="transit-positions">${positionCards}</div><h3>Contactos más precisos</h3><div class="transit-aspects">${aspectCards || "<p>No hay aspectos mayores dentro de los orbes estrictos.</p>"}</div>`;
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
  const transits = reading.transits?.aspects?.length ? `\n\nTRÁNSITOS ACTUALES\n${reading.transits.aspects.slice(0,16).map(aspect => `${nameFor(aspect.transit)} en tránsito ${aspect.name} ${nameFor(aspect.natal)} natal, orbe ${round(aspect.orb,1)}°, por casa ${aspect.transitHouse}`).join("\n")}` : "";
  const synastry = reading.synastry ? `\n\nPOSICIONES DE LA PERSONA B\n${Object.entries(reading.partner.positions).map(([key,position]) => `${nameFor(key)}: ${position.label}, casa ${position.house}`).join("\n")}\n\nSINASTRÍA\n${reading.synastry.aspects.slice(0,24).map(aspect => `Persona A: ${nameFor(aspect.from)} ${aspect.name} Persona B: ${nameFor(aspect.to)}, orbe ${round(aspect.orb,1)}°`).join("\n")}\n\nSUPERPOSICIÓN DE CASAS\n${reading.synastry.overlays.firstInSecond.map(item => `Persona A: ${nameFor(item.key)} en casa ${item.house} de Persona B`).join("\n")}\n${reading.synastry.overlays.secondInFirst.map(item => `Persona B: ${nameFor(item.key)} en casa ${item.house} de Persona A`).join("\n")}` : "";
  return `Sistema de casas: ${reading.houseLabel}
Elemento dominante: ${reading.element}
Intención de la persona: ${reading.data.intention || "Comprender su carta natal"}

POSICIONES
${positions}

ASPECTOS MÁS PRECISOS
${aspects}${transits}${synastry}`;
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
      content:"Eres la voz astrológica de Alaya Astro. Redacta en español una interpretación profunda, cálida y responsable. La astrología es una herramienta simbólica de reflexión, no una certeza científica ni una predicción fatalista. No diagnostiques salud, no anuncies sucesos inevitables y no inventes posiciones. Si recibes sinastría, organiza la respuesta en CONEXIÓN EMOCIONAL, COMUNICACIÓN, ATRACCIÓN, DESAFÍOS, POTENCIAL DE CRECIMIENTO y ACUERDOS CONSCIENTES; habla de la dinámica entre ambas personas sin declarar que sean compatibles o incompatibles de forma absoluta. Si recibes tránsitos actuales, añade CLIMA DEL MOMENTO y diferencia lo natal de lo temporal. Integra los aspectos, evita repetir datos y termina con tres preguntas de reflexión. Extensión aproximada: 900 palabras."
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
  if(reading.synastry && reading.partner && (!reading.synastry.overlays || !reading.synastry.insights)){
    reading.synastry = calculateSynastry(reading,reading.partner);
    reading.version = VERSION;
  }
  setStep(3);
  const template = $("#readingTemplate").content.cloneNode(true);
  $('[data-field="title"]',template).textContent = reading.title;
  $('[data-field="subtitle"]',template).textContent = reading.subtitle;
  $(".reading-header .eyebrow",template).textContent = reading.synastry ? "Sinastría personal" : "Cosmograma personal";
  const badgeLabels = reading.synastry ? [`A · ${reading.element}`,`B · ${reading.partner.element}`,reading.houseLabel] : [reading.element,reading.houseLabel,reading.method];
  $('[data-field="badges"]',template).innerHTML = badgeLabels.map(label => `<span class="badge">${escapeHtml(label)}</span>`).join("");
  $('[data-field="wheel"]',template).innerHTML = renderWheel(reading);
  $('[data-field="bigThree"]',template).innerHTML = renderBigThree(reading);
  $('[data-field="positions"]',template).innerHTML = renderPositions(reading);
  $('[data-field="houses"]',template).innerHTML = renderHouseCusps(reading);
  $('[data-field="houseNote"]',template).innerHTML = renderHouseNote(reading);
  $('[data-field="method"]',template).innerHTML = renderMethod(reading);
  $('[data-field="aspects"]',template).innerHTML = renderAspects(reading);
  $('[data-field="synastry"]',template).innerHTML = renderSynastry(reading);
  $('[data-field="synastrySection"]',template).classList.toggle("hidden",!reading.synastry);
  $('[data-field="transits"]',template).innerHTML = renderTransits(reading);
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
  $('[data-action="transits"]',article).onclick = () => {
    const latest = JSON.parse(slot.dataset.reading);
    latest.transits = calculateTransitSnapshot(latest,new Date());
    slot.dataset.reading = JSON.stringify(latest);
    $('[data-field="transits"]',article).innerHTML = renderTransits(latest);
    toast("Tránsitos actualizados");
  };
  $('[data-action="edit-houses"]',article).onclick = () => {
    setStep(2);
    $(".step-page[data-page='2']")?.scrollIntoView({ behavior:"smooth",block:"start" });
  };
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
  const transits = reading.transits?.aspects?.length ? `\n\nTRÁNSITOS\n${reading.transits.aspects.slice(0,16).map(aspect => `${nameFor(aspect.transit)} ${aspect.name} ${nameFor(aspect.natal)} natal · orbe ${round(aspect.orb,1)}°`).join("\n")}` : "";
  const synastry = reading.synastry ? `\n\nSINASTRÍA CON ${reading.partner.data.name.toUpperCase()}\n\nSÍNTESIS\n${reading.synastry.insights.map(insight => `${insight.key} (${insight.score}%): ${insight.text} ${insight.evidence}`).join("\n")}\n\nSUPERPOSICIÓN DE CASAS\n${reading.synastry.overlays.firstInSecond.map(item => `${nameFor(item.key)} de ${reading.data.name}: casa ${item.house} de ${reading.partner.data.name} (${houseThemes[item.house - 1]})`).join("\n")}\n${reading.synastry.overlays.secondInFirst.map(item => `${nameFor(item.key)} de ${reading.partner.data.name}: casa ${item.house} de ${reading.data.name} (${houseThemes[item.house - 1]})`).join("\n")}\n\nASPECTOS\n${reading.synastry.aspects.slice(0,24).map(aspect => `${nameFor(aspect.from)} ${aspect.name} ${nameFor(aspect.to)} · orbe ${round(aspect.orb,1)}°`).join("\n")}` : "";
  const ai = reading.aiInterpretation ? `\n\nINTERPRETACIÓN CON IA\n${reading.aiInterpretation}` : "";
  return `${reading.title}\n${reading.subtitle}\n\n${positions}\n\n${sections}${synastry}${transits}${ai}`;
}
function htmlDoc(reading){
  const transits = reading.transits?.aspects?.length ? `<section class="card"><h2>Tránsitos actuales</h2>${reading.transits.aspects.slice(0,16).map(aspect => `<p><b>${nameFor(aspect.transit)} ${aspect.name} ${nameFor(aspect.natal)} natal</b> · orbe ${round(aspect.orb,1)}°</p>`).join("")}</section>` : "";
  const synastry = reading.synastry ? `<section class="card"><h2>Sinastría con ${escapeHtml(reading.partner.data.name)}</h2><h3>Síntesis del vínculo</h3>${reading.synastry.insights.map(insight => `<p><b>${escapeHtml(insight.key)} · ${insight.score}%</b><br>${escapeHtml(insight.text)} <span class="muted">${escapeHtml(insight.evidence)}</span></p>`).join("")}<h3>Superposición de casas</h3>${reading.synastry.overlays.firstInSecond.map(item => `<p>${nameFor(item.key)} de ${escapeHtml(reading.data.name)} en casa ${item.house} de ${escapeHtml(reading.partner.data.name)} · ${houseThemes[item.house - 1]}</p>`).join("")}${reading.synastry.overlays.secondInFirst.map(item => `<p>${nameFor(item.key)} de ${escapeHtml(reading.partner.data.name)} en casa ${item.house} de ${escapeHtml(reading.data.name)} · ${houseThemes[item.house - 1]}</p>`).join("")}<h3>Aspectos principales</h3>${reading.synastry.aspects.slice(0,24).map(aspect => `<p><b>${nameFor(aspect.from)} ${aspect.name} ${nameFor(aspect.to)}</b> · orbe ${round(aspect.orb,1)}°</p>`).join("")}</section>` : "";
  const ai = reading.aiInterpretation ? `<section class="card"><h2>Interpretación personalizada</h2><p>${escapeHtml(reading.aiInterpretation).replace(/\n/g,"<br>")}</p></section>` : "";
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(reading.title)}</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:auto;padding:32px;color:#303249;background:#fffefa}h1,h2{font-family:Georgia,serif;color:#496b96}.brand{letter-spacing:.18em;color:#a58035}.card{border:1px solid #ded7e8;border-radius:16px;padding:18px;margin:14px 0}.muted{color:#74758a}@media print{body{padding:0}}</style><p class="brand">ALAYA ASTRO</p><h1>${escapeHtml(reading.title)}</h1><p class="muted">${escapeHtml(reading.subtitle)}</p><div class="card"><h2>Posiciones</h2><pre>${escapeHtml(Object.entries(reading.positions).map(([key,p]) => `${nameFor(key)}: ${p.label}, casa ${p.house}`).join("\n"))}</pre></div>${reading.sections.map(section => `<section class="card"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p></section>`).join("")}${synastry}${transits}${ai}</html>`;
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
  if(draft.countryCode2){
    await loadCities2(draft.countryCode2);
    $("#city2").value = draft.city2 || "";
  }
  updateLocationSummary();
  updateLocationSummary2();
  updateChoices();
}
function updateChoices(){
  $$(".choice").forEach(choice => choice.classList.toggle("selected",$("input",choice)?.checked));
  $("#partnerFields").classList.toggle("hidden",$('input[name="readingType"]:checked')?.value !== "compatibilidad");
}
function applySettings(){
  const settings = read(STORE.settings,{});
  document.body.classList.toggle("comfort",!!settings.comfort);
  document.body.classList.toggle("contrast",!!settings.contrast);
  $("#comfortToggle").checked = !!settings.comfort; $("#contrastToggle").checked = !!settings.contrast;
}
function createDemo(){
  const demo = { name:"Atenea",birthDate:"1992-07-21",birthTime:"12:30",city:"Barcelona",country:"España",countryCode:"ES",lat:"41.3874",lon:"2.1686",timezone:"Europe/Madrid",utcOffset:"2",timeAccuracy:"exacta",houses:"porphyry",readingType:"natal",intention:"Comprender mis talentos y mi manera de relacionarme." };
  Object.entries(demo).forEach(([key,value]) => $$(`[name="${key}"]`).forEach(control => { if(control.type === "radio") control.checked = control.value === value; else control.value = value; }));
  updateChoices(); route("crear"); renderReading(buildReading(demo));
}
function createSynastryDemo(){
  const demo = {
    name:"Atenea",birthDate:"1992-07-21",birthTime:"12:30",city:"Barcelona",country:"España",countryCode:"ES",lat:"41.3874",lon:"2.1686",timezone:"Europe/Madrid",utcOffset:"2",
    timeAccuracy:"exacta",houses:"porphyry",readingType:"compatibilidad",intention:"Comprender la dinámica emocional, la comunicación y el crecimiento del vínculo.",
    name2:"Orión",birthDate2:"1989-11-03",birthTime2:"18:45",city2:"Madrid",country2:"España",countryCode2:"ES",lat2:"40.4168",lon2:"-3.7038",timezone2:"Europe/Madrid",utcOffset2:"1"
  };
  Object.entries(demo).forEach(([key,value]) => $$(`[name="${key}"]`).forEach(control => { if(control.type === "radio") control.checked = control.value === value; else control.value = value; }));
  updateChoices(); route("crear"); renderReading(buildReading(demo));
}
function openCurrentTransits(){
  const latest = read(STORE.history,[])[0];
  if(latest){
    latest.transits = calculateTransitSnapshot(latest,new Date());
    route("crear"); renderReading(latest);
    setTimeout(() => $("#transitos")?.scrollIntoView({ behavior:"smooth" }),250);
    return;
  }
  const demo = { name:"Atenea",birthDate:"1992-07-21",birthTime:"12:30",city:"Barcelona",country:"España",countryCode:"ES",lat:"41.3874",lon:"2.1686",timezone:"Europe/Madrid",utcOffset:"2",timeAccuracy:"exacta",houses:"porphyry",readingType:"hoy",intention:"Comprender el clima actual y cómo dialoga con mi carta." };
  route("crear"); renderReading(buildReading(demo));
  setTimeout(() => $("#transitos")?.scrollIntoView({ behavior:"smooth" }),250);
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
  $("#countryCode2").addEventListener("change",async event => {
    const option = event.target.selectedOptions[0];
    $("#country2").value = option?.textContent || "";
    $("#city2").value = ""; $("#lat2").value = ""; $("#lon2").value = ""; $("#timezone2").value = ""; $("#utcOffset2").value = "";
    updateLocationSummary2();
    try { await loadCities2(event.target.value); } catch(error){ toast(error.message); }
    saveDraft();
  });
  $("#city").addEventListener("input",event => {
    selectedCity = null;
    $("#lat").value = ""; $("#lon").value = ""; $("#timezone").value = ""; $("#utcOffset").value = "";
    updateLocationSummary();
    renderCityResults(event.target.value);
  });
  $("#city2").addEventListener("input",event => {
    $("#lat2").value = ""; $("#lon2").value = ""; $("#timezone2").value = ""; $("#utcOffset2").value = "";
    updateLocationSummary2(); renderCityResults2(event.target.value);
  });
  $("#cityResults").addEventListener("click",event => {
    const button = event.target.closest("[data-city-index]");
    if(!button) return;
    const results = JSON.parse($("#cityResults").dataset.results || "[]");
    selectGeoCity(results[Number(button.dataset.cityIndex)]);
  });
  $("#cityResults2").addEventListener("click",event => {
    const button = event.target.closest("[data-city2-index]");
    if(!button) return;
    const results = JSON.parse($("#cityResults2").dataset.results || "[]");
    selectGeoCity2(results[Number(button.dataset.city2Index)]);
  });
  document.addEventListener("click",event => {
    if(!event.target.closest(".city-field")){ $("#cityResults").classList.add("hidden"); $("#cityResults2").classList.add("hidden"); }
  });
  $("#birthDate").addEventListener("change",updateLocationSummary);
  $("#birthTime").addEventListener("change",updateLocationSummary);
  $("#birthDate2").addEventListener("change",updateLocationSummary2);
  $("#birthTime2").addEventListener("change",updateLocationSummary2);
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
  $$("[data-synastry-demo]").forEach(button => button.onclick = createSynastryDemo);
  $$("[data-transits]").forEach(button => button.onclick = openCurrentTransits);
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
