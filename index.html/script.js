"use strict";
/* ---------- Data ---------- */
const STATES = {
  "Andhra Pradesh":["Visakhapatnam","Vijayawada","Tirupati"],
  "Arunachal Pradesh":["Itanagar","Tawang"],
  "Assam":["Guwahati","Jorhat","Dibrugarh"],
  "Bihar":["Patna","Gaya","Bodh Gaya"],
  "Chhattisgarh":["Raipur","Bilaspur"],
  "Goa":["Panaji","Margao","Calangute"],
  "Gujarat":["Ahmedabad","Surat","Vadodara","Dwarka"],
  "Haryana":["Gurugram","Faridabad"],
  "Himachal Pradesh":["Shimla","Manali","Dharamshala"],
  "Jharkhand":["Ranchi","Jamshedpur"],
  "Karnataka":["Bengaluru","Mysuru","Hampi"],
  "Kerala":["Kochi","Munnar","Thiruvananthapuram"],
  "Madhya Pradesh":["Bhopal","Indore","Ujjain"],
  "Maharashtra":["Mumbai","Pune","Nagpur","Nashik","Chhatrapati Sambhajinagar","Solapur","Kolhapur","Amravati","Nanded","Sangli","Jalgaon","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Parbhani","Jalna","Thane","Navi Mumbai","Panvel","Bhiwandi","Lonavala","Mahabaleshwar","Satara","Ratnagiri","Alibag","Shirdi","Pandharpur","Yavatmal","Wardha","Gondia","Beed","Dharashiv","Nandurbar","Buldhana","Washim","Hingoli","Bhandara","Gadchiroli","Sindhudurg","Malvan","Igatpuri"],
  "Manipur":["Imphal"],
  "Meghalaya":["Shillong","Cherrapunji"],
  "Mizoram":["Aizawl"],
  "Nagaland":["Kohima","Dimapur"],
  "Odisha":["Bhubaneswar","Puri"],
  "Punjab":["Amritsar","Ludhiana"],
  "Rajasthan":["Jaipur","Udaipur","Jodhpur","Jaisalmer"],
  "Sikkim":["Gangtok","Pelling"],
  "Tamil Nadu":["Chennai","Madurai","Ooty"],
  "Telangana":["Hyderabad","Warangal"],
  "Tripura":["Agartala"],
  "Uttar Pradesh":["Lucknow","Varanasi","Agra"],
  "Uttarakhand":["Dehradun","Rishikesh","Nainital"],
  "West Bengal":["Kolkata","Darjeeling"],
  "Andaman & Nicobar":["Port Blair","Havelock"],
  "Chandigarh":["Chandigarh"],
  "Dadra & Nagar Haveli and Daman & Diu":["Daman","Silvassa"],
  "Delhi":["New Delhi","Dwarka"],
  "Jammu & Kashmir":["Srinagar","Jammu"],
  "Ladakh":["Leh","Kargil"],
  "Lakshadweep":["Kavaratti"],
  "Puducherry":["Puducherry"]
};
// [type, base price, guests per room, base rating]
const TYPES = [["Budget Lodge",900,2,3.8],["Inn",1800,3,4.0],["Residency",2800,3,4.2],["Suites",4500,4,4.4],["Heritage Stay",5500,4,4.5],["Grand Palace",6500,4,4.7]];
const AMEN = ["Free WiFi","Breakfast","Parking","AC Rooms","Swimming Pool","Restaurant","24h Front Desk"];
const BANKS = ["State Bank of India","HDFC Bank","ICICI Bank","Axis Bank","Punjab National Bank","Bank of Maharashtra","Kotak Mahindra Bank"];
const GST = 0.12, ADV = 0.25;

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const fmt = n => "₹" + Math.round(n).toLocaleString("en-IN");
const iso = d => d.toISOString().slice(0, 10);
const nightsBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const hash = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) % 100003; return x; };
const load = () => { try { return JSON.parse(localStorage.getItem("stayindia_bookings") || "[]"); } catch { return []; } };
const save = a => { try { localStorage.setItem("stayindia_bookings", JSON.stringify(a)); } catch {} };
const hoursToCheckin = b => (new Date(b.ci + "T14:00") - new Date()) / 36e5;
const refundPct = b => { const h = hoursToCheckin(b); return h >= 48 ? 1 : h >= 24 ? 0.5 : 0; };
let LIST = [], PENDING = null;

/* ---------- Navigation ---------- */
function tab(n) {
  ["search", "manage", "policy"].forEach(k => {
    $("t-" + k).classList.toggle("hide", k !== n);
    $("n-" + k).classList.toggle("on", k === n);
  });
  $("hero").classList.toggle("hide", n !== "search");
  window.scrollTo({ top: 0 });
}
function openM(html) { $("mb").innerHTML = html; $("modal").style.display = "flex"; }
function closeM() { $("modal").style.display = "none"; }

/* ---------- Search ---------- */
function fillCities() {
  $("ct").innerHTML = '<option value="">All cities</option>' + STATES[$("st").value].map(c => `<option>${c}</option>`).join("");
}
function init() {
  $("st").innerHTML = Object.keys(STATES).map(s => `<option>${s}</option>`).join("");
  $("st").value = "Maharashtra";
  $("st").onchange = fillCities; fillCities();
  const today = new Date();
  $("ci").min = $("co").min = iso(today);
  $("ci").value = iso(new Date(+today + 864e5));
  $("co").value = iso(new Date(+today + 2 * 864e5));
}
function buildHotels(state, city) {
  const out = [];
  (city ? [city] : STATES[state]).forEach(c => TYPES.forEach((t, i) => {
    const k = hash(state + c + i), f = 0.85 + (k % 30) / 100;
    const am = AMEN.filter((_, j) => (k >> j) % 3 !== 0).slice(0, 4);
    out.push({
      name: `${i % 2 ? "The" : "Hotel"} ${c} ${t[0]}`, city: c, state,
      price: Math.round(t[1] * f / 50) * 50, cap: t[2],
      rating: Math.min(5, +(t[3] + (k % 5) / 10 - 0.2).toFixed(1)),
      dist: +(1 + (k % 90) / 10).toFixed(1), amen: am, free: (k % 4) !== 0
    });
  }));
  return out;
}
function price(h, guests, rooms, nights) {
  const r = Math.max(Math.ceil(guests / h.cap), rooms), base = h.price * r * nights;
  return { rooms: r, base, tax: base * GST, total: base * (1 + GST) };
}
function search() {
  const g = +$("gu").value, r = +$("rm").value, n = nightsBetween($("ci").value, $("co").value);
  if (!$("ci").value || !$("co").value || n < 1) return alert("Please choose valid check-in and check-out dates.");
  if (!(g >= 1) || !(r >= 1)) return alert("Guests and rooms must be at least 1.");
  LIST = buildHotels($("st").value, $("ct").value).map(h => ({ ...h, p: price(h, g, r, n) }));
  LIST.q = { g, n, ci: $("ci").value, co: $("co").value };
  renderList();
  $("res").scrollIntoView({ behavior: "smooth" });
}
function renderList() {
  const s = $("sort").value, q = LIST.q;
  const by = { price: (a, b) => a.p.total - b.p.total, priceD: (a, b) => b.p.total - a.p.total, rating: (a, b) => b.rating - a.rating, dist: (a, b) => a.dist - b.dist };
  LIST.sort(by[s]);
  $("toolbar").classList.remove("hide");
  $("count").textContent = `${LIST.length} hotels found • ${q.n} night${q.n > 1 ? "s" : ""} • ${q.g} guest${q.g > 1 ? "s" : ""}`;
  const best = [...LIST].sort((a, b) => a.p.total - b.p.total)[0];
  $("res").innerHTML = LIST.map((h, i) => `
    <article class="card">
      <div>
        <h3>${h.name}<span class="tag star">★ ${h.rating}</span>${h === best ? '<span class="tag">Best value</span>' : ""}</h3>
        <div class="meta">${h.city}, ${h.state} • ${h.dist} km from city centre</div>
        <div class="meta">Up to ${h.cap} guests per room • <b>${h.p.rooms} room${h.p.rooms > 1 ? "s" : ""}</b> recommended for ${q.g} guests</div>
        ${h.amen.map(a => `<span class="chip">${a}</span>`).join("")}${h.free ? '<span class="chip" style="background:#e5f6ee;color:#0f7a55">Free cancellation</span>' : ""}
      </div>
      <div class="price"><b>${fmt(h.p.total)}</b><div class="meta">${fmt(h.price)} / room / night + GST</div><br><button class="btn sm" onclick="startBooking(${i})">Book Now</button></div>
    </article>`).join("");
}

/* ---------- Booking panel: step 1 (guest details) ---------- */
function startBooking(i) {
  const h = LIST[i], q = LIST.q;
  PENDING = { h, ci: q.ci, co: q.co, guests: q.g, rooms: h.p.rooms, total: h.p.total, base: h.p.base, tax: h.p.tax, n: q.n };
  openM(`<h3>${h.name}</h3>
    <div class="meta">${h.city}, ${h.state} • ${q.ci} to ${q.co}</div>
    <div class="sum">
      <div><span>${h.p.rooms} room × ${q.n} night${q.n > 1 ? "s" : ""}</span><span>${fmt(h.p.base)}</span></div>
      <div><span>GST (12%)</span><span>${fmt(h.p.tax)}</span></div>
      <div class="tot"><span>Total</span><span>${fmt(h.p.total)}</span></div>
    </div>
    <div class="f"><label for="bn">Full name</label><input id="bn" autocomplete="name"></div>
    <div class="row2"><div class="f"><label for="bp">Mobile number</label><input id="bp" maxlength="10" inputmode="numeric"></div>
    <div class="f"><label for="be">Email</label><input id="be" type="email"></div></div>
    <div class="err" id="err"></div>
    <div class="actions"><button class="btn" onclick="toPayment()">Continue to Payment</button><button class="btn ghost" onclick="closeM()">Cancel</button></div>`);
}
function toPayment() {
  const nm = $("bn").value.trim(), ph = $("bp").value.trim(), em = $("be").value.trim();
  if (nm.length < 2) return $("err").textContent = "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(ph)) return $("err").textContent = "Enter a valid 10-digit Indian mobile number.";
  if (!/^\S+@\S+\.\S+$/.test(em)) return $("err").textContent = "Enter a valid email address.";
  Object.assign(PENDING, { name: nm, phone: ph, email: em, plan: "full", method: "upi" });
  renderPayment();
}

/* ---------- Step 2: payment ---------- */
function renderPayment() {
  const P = PENDING, adv = Math.ceil(P.total * ADV), pay = P.plan === "full" ? P.total : adv;
  const form = {
    upi: `<div class="f"><label for="u1">UPI ID</label><input id="u1" placeholder="name@bank"></div>`,
    card: `<div class="f"><label for="c1">Card number</label><input id="c1" maxlength="19" inputmode="numeric" placeholder="1234 5678 9012 3456"></div>
           <div class="row2"><div class="f"><label for="c2">Expiry (MM/YY)</label><input id="c2" maxlength="5" placeholder="MM/YY"></div><div class="f"><label for="c3">CVV</label><input id="c3" type="password" maxlength="3" inputmode="numeric"></div></div>`,
    net: `<div class="f"><label for="nb">Select bank</label><select id="nb"><option value="">Choose your bank</option>${BANKS.map(b => `<option>${b}</option>`).join("")}</select></div>`
  };
  openM(`<h3>Payment</h3><div class="meta">Booking for ${P.h.name}</div>
    <label class="opt ${P.plan === "full" ? "sel" : ""}"><input type="radio" name="plan" ${P.plan === "full" ? "checked" : ""} onchange="setPlan('full')"><span><b>Pay full amount now</b><br><span class="meta">${fmt(P.total)} • nothing to pay at the hotel</span></span></label>
    <label class="opt ${P.plan === "adv" ? "sel" : ""}"><input type="radio" name="plan" ${P.plan === "adv" ? "checked" : ""} onchange="setPlan('adv')"><span><b>Pay 25% advance</b><br><span class="meta">${fmt(adv)} now • ${fmt(P.total - adv)} at check-in</span></span></label>
    <div class="pm">${[["upi", "UPI"], ["card", "Card"], ["net", "Net Banking"]].map(m => `<button class="${P.method === m[0] ? "on" : ""}" onclick="setMethod('${m[0]}')">${m[1]}</button>`).join("")}</div>
    ${form[P.method]}
    <div class="err" id="err"></div>
    <div class="actions"><button class="btn" onclick="pay()">Pay ${fmt(pay)}</button><button class="btn ghost" onclick="startBooking(LIST.indexOf(PENDING.h))">Back</button></div>
    <p class="meta">Demo mode: no real money is charged.</p>`);
}
const setPlan = p => { PENDING.plan = p; renderPayment(); };
const setMethod = m => { PENDING.method = m; renderPayment(); };
function pay() {
  const P = PENDING, m = P.method, e = t => $("err").textContent = t;
  if (m === "upi" && !/^[\w.\-]{2,}@[a-z]{2,}$/i.test($("u1").value.trim())) return e("Enter a valid UPI ID, e.g. name@okbank.");
  if (m === "card") {
    if (!/^\d{16}$/.test($("c1").value.replace(/\s/g, ""))) return e("Enter a valid 16-digit card number.");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test($("c2").value)) return e("Enter expiry as MM/YY.");
    if (!/^\d{3}$/.test($("c3").value)) return e("Enter the 3-digit CVV.");
  }
  if (m === "net" && !$("nb").value) return e("Please select your bank.");
  const paid = P.plan === "full" ? P.total : Math.ceil(P.total * ADV);
  const b = { id: "SI-" + Math.random().toString(36).slice(2, 8).toUpperCase(), hotel: { name: P.h.name, city: P.h.city, state: P.h.state, cap: P.h.cap, price: P.h.price },
    name: P.name, phone: P.phone, email: P.email, ci: P.ci, co: P.co, guests: P.guests, rooms: P.rooms, total: P.total, paid, method: m, status: "Confirmed" };
  const a = load(); a.push(b); save(a);
  openM(`<div style="text-align:center"><div class="ok-ic">✓</div><h3>Booking confirmed</h3></div>
    <div class="sum"><div><span>Booking ID</span><b>${b.id}</b></div><div><span>Hotel</span><span>${b.hotel.name}</span></div><div><span>Stay</span><span>${b.ci} to ${b.co}</span></div>
    <div><span>Paid now</span><span>${fmt(paid)}</span></div><div class="tot"><span>Due at hotel</span><span>${fmt(b.total - paid)}</span></div></div>
    <p class="meta">Save your Booking ID and mobile number to manage this booking.</p>
    <div class="actions"><button class="btn" onclick="closeM();tab('manage');$('lid').value='${b.id}';$('lph').value='${b.phone}';lookup()">View Booking</button></div>`);
}

/* ---------- Manage booking ---------- */
function lookup() {
  const a = load().filter(b => b.id === $("lid").value.trim().toUpperCase() && b.phone === $("lph").value.trim());
  showBookings(a, "No booking found. Please check the Booking ID and mobile number.");
}
function listAll() {
  const p = $("lph").value.trim();
  if (!/^\d{10}$/.test(p)) return alert("Enter your 10-digit mobile number first.");
  showBookings(load().filter(b => b.phone === p), "No bookings found for this number.");
}
function showBookings(a, empty) {
  $("bk").innerHTML = a.length ? a.map(b => `<article class="card"><div>
    <h3>${b.hotel.name}<span class="tag ${b.status === "Cancelled" ? "bad" : ""}">${b.status}</span></h3>
    <div class="meta">ID ${b.id} • ${b.hotel.city}, ${b.hotel.state}</div>
    <div class="meta">${b.ci} to ${b.co} • ${b.guests} guests • ${b.rooms} room${b.rooms > 1 ? "s" : ""} • Guest: ${b.name}</div>
    <div class="meta">Total ${fmt(b.total)} • Paid ${fmt(b.paid)}${b.total - b.paid > 0 && b.status === "Confirmed" ? ` • Due at hotel ${fmt(b.total - b.paid)}` : ""}</div>
    ${b.refund != null ? `<div class="meta"><b>Refund: ${fmt(b.refund)}</b> (5–7 working days)</div>` : ""}</div>
    ${b.status === "Confirmed" ? `<div class="price"><button class="btn ghost sm" onclick="adjust('${b.id}')">Modify</button> <button class="btn danger sm" onclick="cancelAsk('${b.id}')">Cancel</button></div>` : ""}
    </article>`).join("") : `<div class="panel">${empty}</div>`;
}
function cancelAsk(id) {
  const b = load().find(x => x.id === id), p = refundPct(b);
  openM(`<h3>Cancel this booking?</h3><div class="meta">${b.hotel.name} • ${b.ci} to ${b.co}</div>
    <div class="sum"><div><span>Amount paid</span><span>${fmt(b.paid)}</span></div><div><span>Refund (${p * 100}%)</span><span>${fmt(b.paid * p)}</span></div></div>
    <div class="actions"><button class="btn danger" onclick="cancelDo('${id}')">Yes, cancel booking</button><button class="btn ghost" onclick="closeM()">Keep booking</button></div>`);
}
function cancelDo(id) {
  const a = load(), b = a.find(x => x.id === id);
  b.refund = b.paid * refundPct(b); b.status = "Cancelled"; save(a); closeM(); showBookings([b], "");
}
function adjust(id) {
  const b = load().find(x => x.id === id);
  openM(`<h3>Modify booking</h3><div class="meta">${b.hotel.name} • ${b.id}</div>
    <div class="row2"><div class="f"><label for="ac">Check-in</label><input type="date" id="ac" value="${b.ci}" min="${iso(new Date())}"></div><div class="f"><label for="ao">Check-out</label><input type="date" id="ao" value="${b.co}"></div></div>
    <div class="row2"><div class="f"><label for="ag">Guests</label><input type="number" id="ag" min="1" value="${b.guests}"></div><div class="f"><label for="ar">Rooms</label><input type="number" id="ar" min="1" value="${b.rooms}"></div></div>
    <p class="meta">Rooms are adjusted automatically to fit guests (${b.hotel.cap} per room).</p><div class="err" id="err"></div>
    <div class="actions"><button class="btn" onclick="adjustDo('${id}')">Update Booking</button><button class="btn ghost" onclick="closeM()">Close</button></div>`);
}
function adjustDo(id) {
  const a = load(), b = a.find(x => x.id === id), ci = $("ac").value, co = $("ao").value, n = nightsBetween(ci, co);
  if (n < 1) return $("err").textContent = "Please choose valid dates.";
  const c = price(b.hotel, +$("ag").value, +$("ar").value, n), refund = Math.max(0, b.paid - c.total);
  if (!confirm(`New total: ${fmt(c.total)}\n` + (refund ? `Refund of ${fmt(refund)} will be issued.` : `Amount due at hotel: ${fmt(c.total - b.paid)}`) + "\nConfirm changes?")) return;
  Object.assign(b, { ci, co, guests: +$("ag").value, rooms: c.rooms, total: c.total, paid: Math.min(b.paid, c.total) });
  save(a); closeM(); showBookings([b], "");
}

init();
