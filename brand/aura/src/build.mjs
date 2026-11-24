// AURA | أورا — brand book generator.
// Run: node brand/aura/src/build.mjs
// Outputs brand/aura/brand-book.html plus the SVG logo/icon files in brand/aura/.
// The wordmark paths in logo-paths.json are a vector trace of the approved logo
// artwork; they are used as-is everywhere (never redrawn).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..");
const P = JSON.parse(readFileSync(join(here, "logo-paths.json"), "utf8"));

const C = { black: "#101112", white: "#FFFFFF", green: "#78B83F", gray: "#F3F4F2" };

/* ---------- logo primitives ---------- */
const LOGO_VB = "-1 -1 302 86.5";
const SYM_VB = "-1 -1 112 86";
const logo = (fill = "currentColor", cls = "", label = "AURA") =>
  `<svg class="${cls}" viewBox="${LOGO_VB}" role="img" aria-label="${label}"><path d="${P.A}${P.ura}" fill="${fill}" fill-rule="evenodd"/></svg>`;
const sym = (fill = "currentColor", cls = "") =>
  `<svg class="${cls}" viewBox="${SYM_VB}" aria-hidden="true"><path d="${P.A}" fill="${fill}"/></svg>`;
// symbol group placed inside another svg: x,y = top-left, h = height
const symG = (x, y, h, fill) => {
  const s = h / 85;
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${P.A}" fill="${fill}"/></g>`;
};
const logoG = (x, y, w, fill) => {
  const s = w / 301;
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${P.A}${P.ura}" fill="${fill}" fill-rule="evenodd"/></g>`;
};
// App icon: Λ symbol with the green "you are here" dot sheltered under it.
const appIcon = (bg = C.black, fg = C.white, dot = C.green, r = 230) => `
<svg viewBox="0 0 1024 1024" aria-label="AURA app icon"><rect width="1024" height="1024" rx="${r}" fill="${bg}"/>
${symG(512 - 55.5 * 4.6, 300, 85 * 4.6, fg)}
<circle cx="${512}" cy="${300 + 71 * 4.6}" r="${9.5 * 4.6}" fill="${dot}"/></svg>`;

/* ---------- write standalone asset files ---------- */
const file = (name, body) => writeFileSync(join(out, name), body.trim() + "\n");
const svgDoc = (vb, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;
file("aura-logo-black.svg", svgDoc(LOGO_VB, `<path d="${P.A}${P.ura}" fill="${C.black}" fill-rule="evenodd"/>`));
file("aura-logo-white.svg", svgDoc(LOGO_VB, `<path d="${P.A}${P.ura}" fill="${C.white}" fill-rule="evenodd"/>`));
file("aura-logo-on-black.svg", svgDoc("-60 -50 422 186.5", `<rect x="-60" y="-50" width="422" height="186.5" fill="${C.black}"/><path d="${P.A}${P.ura}" fill="${C.white}" fill-rule="evenodd"/>`));
file("aura-logo-on-white.svg", svgDoc("-60 -50 422 186.5", `<rect x="-60" y="-50" width="422" height="186.5" fill="${C.white}"/><path d="${P.A}${P.ura}" fill="${C.black}" fill-rule="evenodd"/>`));
file("aura-symbol-black.svg", svgDoc(SYM_VB, `<path d="${P.A}" fill="${C.black}"/>`));
file("aura-symbol-white.svg", svgDoc(SYM_VB, `<path d="${P.A}" fill="${C.white}"/>`));
file("aura-app-icon.svg", appIcon().replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
file("aura-app-icon-light.svg", appIcon(C.white, C.black).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));

/* ---------- color math ---------- */
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return ((x + 0.05) / (y + 0.05)).toFixed(1); };
// Print values are set by hand (rich black, coated stock), not derived from RGB.
const CMYK_PRINT = { "#101112": "75 68 67 90", "#FFFFFF": "0 0 0 0", "#F3F4F2": "3 2 4 0", "#78B83F": "57 3 100 0" };
const cmyk = (h) => {
  if (CMYK_PRINT[h]) return CMYK_PRINT[h];
  const [r, g, b] = hex2rgb(h).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return "0 0 0 100";
  return [r, g, b].map((v) => Math.round(((1 - v - k) / (1 - k)) * 100)).concat(Math.round(k * 100)).join(" ");
};

/* ---------- i18n ---------- */
const T = (ar, en) => `<x-ar>${ar}</x-ar><x-en>${en}</x-en>`;

/* ---------- icons (24px line set, 1.8 stroke, round) ---------- */
const IC = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  home: '<path d="M4 11l8-6.5 8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
  work: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5h6v2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  shield: '<path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>',
  chat: '<path d="M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z"/>',
  share: '<circle cx="18" cy="6" r="2.3"/><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8 11l8-4M8 13l8 4"/>',
  chev: '<path d="M9.5 6l6 6-6 6"/>',
  back: '<path d="M14.5 6l-6 6 6 6"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5S14.5 18 12 20.5C9.5 18 8.5 15 8.5 12S9.5 6 12 3.5z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.5a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .8-1 1.5v.6M12 16.4v.2"/>',
  logout: '<path d="M14 4.5H6.5v15H14"/><path d="M10.5 12H20M17 8.5l3.5 3.5-3.5 3.5"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11M12 9c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  car: '<path d="M4 17.5v-5l2-5.2c.3-.8 1-1.3 1.9-1.3h8.2c.9 0 1.6.5 1.9 1.3l2 5.2v5z"/><path d="M4 12.5h16"/><path d="M7.5 15h1M15.5 15h1"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  nav: '<path d="M12 3l7 17-7-4-7 4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  seat: '<circle cx="9" cy="7" r="2.5"/><circle cx="16" cy="8" r="2"/><path d="M4.5 19c.6-3.5 2.2-5.5 4.5-5.5s3.9 2 4.5 5.5M14 13.8c1.8 0 3.6 1.6 4.2 4.8"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
};
const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

/* ---------- map ---------- */
// Abstract Riyadh-style grid: wide arterials, a diagonal, blocks, a park.
function map({ dark = false, route = null, cars = [], pickup = null, drop = null, rings = false, labels = true, pin = false, h = 640 } = {}) {
  const g = dark ? { bg: "#17191B", blk: "#1E2123", road: "#2A2E31", art: "#33383C", park: "#1D2A17", lbl: "#6E7479" }
                 : { bg: "#ECEEEA", blk: "#E4E7E1", road: "#FFFFFF", art: "#FFFFFF", park: "#DCEBCD", lbl: "#9AA098" };
  let s = `<svg class="map" viewBox="0 0 300 ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="300" height="${h}" fill="${g.bg}"/>`;
  // blocks
  for (let y = 0; y < h; y += 46) for (let x = -10; x < 300; x += 58)
    s += `<rect x="${x + 6}" y="${y + 6}" width="46" height="34" rx="3" fill="${g.blk}"/>`;
  s += `<rect x="186" y="236" width="104" height="80" rx="6" fill="${g.park}"/>`;
  s += `<rect x="12" y="420" width="92" height="68" rx="6" fill="${g.park}"/>`;
  // minor streets
  for (let y = 0; y < h; y += 46) s += `<rect x="0" y="${y}" width="300" height="6" fill="${g.road}"/>`;
  for (let x = -10; x < 300; x += 58) s += `<rect x="${x}" y="0" width="6" height="${h}" fill="${g.road}"/>`;
  // arterials (King Fahd Rd vertical, Olaya, a diagonal)
  s += `<rect x="104" y="0" width="16" height="${h}" fill="${g.art}"/>`;
  s += `<rect x="0" y="180" width="300" height="14" fill="${g.art}"/>`;
  s += `<rect x="0" y="502" width="300" height="12" fill="${g.art}"/>`;
  s += `<path d="M-20 ${h * 0.92} L320 ${h * 0.33}" stroke="${g.art}" stroke-width="12"/>`;
  if (labels) {
    s += `<text x="112" y="120" transform="rotate(-90 112 120)" font-size="7" fill="${g.lbl}" text-anchor="middle" font-family="Readex Pro, sans-serif" class="i-ar">طريق الملك فهد</text>`;
    s += `<text x="112" y="120" transform="rotate(-90 112 120)" font-size="6.5" fill="${g.lbl}" text-anchor="middle" font-family="Readex Pro, sans-serif" class="i-en">King Fahd Rd</text>`;
    s += `<text x="40" y="190" font-size="7" fill="${g.lbl}" font-family="Readex Pro, sans-serif" class="i-ar">العليا</text>`;
    s += `<text x="40" y="190" font-size="7" fill="${g.lbl}" font-family="Readex Pro, sans-serif" class="i-en">Olaya</text>`;
  }
  if (rings && pickup) {
    for (const [r, o] of [[70, 0.08], [46, 0.14], [26, 0.22]])
      s += `<circle cx="${pickup[0]}" cy="${pickup[1]}" r="${r}" fill="${C.green}" opacity="${o}" class="pulse"/>`;
  }
  if (route) {
    s += `<path d="${route}" fill="none" stroke="${dark ? "#0B0C0D" : "#FFFFFF"}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="${route}" fill="none" stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  for (const [x, y, r = 0] of cars)
    s += `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-5" y="-9" width="10" height="18" rx="3" fill="${C.black}"/><rect x="-3.6" y="-5" width="7.2" height="4" rx="1" fill="#5d6266"/><rect x="-3.6" y="3" width="7.2" height="2.5" rx="1" fill="#3a3e41"/></g>`;
  if (pickup) s += `<circle cx="${pickup[0]}" cy="${pickup[1]}" r="7" fill="${C.white}"/><circle cx="${pickup[0]}" cy="${pickup[1]}" r="4.5" fill="${C.black}"/>`;
  if (drop) s += `<rect x="${drop[0] - 7}" y="${drop[1] - 7}" width="14" height="14" rx="3" fill="${C.black}"/>${symG(drop[0] - 4, drop[1] - 4, 7, C.white)}`;
  if (pin) s += `<g transform="translate(150 ${h / 2 - 26})"><path d="M0 26 L0 14" stroke="${C.black}" stroke-width="2.5" stroke-linecap="round"/><circle cx="0" cy="0" r="15" fill="${C.black}"/>${symG(-6, -5.5, 10.5, C.white)}<ellipse cx="0" cy="28" rx="5" ry="2" fill="${C.black}" opacity=".25"/></g>`;
  return s + "</svg>";
}

/* ---------- phone frame + screens ---------- */
const status = (light = false) => `<div class="sb ${light ? "sb-l" : ""}"><b>9:41</b><i class="island"></i><span class="sb-r"><i class="sig"></i><i class="bat"></i></span></div>`;
const phone = (inner, label, cls = "") => `<figure class="ph-fig"><div class="phone ${cls}"><div class="scr">${inner}<i class="home-ind"></i></div></div>${label ? `<figcaption>${label}</figcaption>` : ""}</figure>`;
const btn = (t, cls = "") => `<div class="btn ${cls}">${t}</div>`;
const field = (lbl, val, icon = "", cls = "") => `<div class="fld ${cls}">${icon ? ic(icon) : ""}<div><small>${lbl}</small><span>${val}</span></div></div>`;
const row = (icon, t, end = "") => `<div class="row">${ic(icon)}<span>${t}</span><em>${end}</em>${ic("chev", "flip")}</div>`;
const topbar = (title, light = false) => `<div class="tb ${light ? "tb-l" : ""}">${ic("back", "flip back")}<b>${title}</b><span></span></div>`;

const R1 = "M150 470 L150 400 L112 400 L112 187 L210 187 L210 120";
const S = {};
S.splash = phone(`<div class="s-splash">${status(true)}
  <div class="splash-mid">${logo(C.white, "splash-logo")}<i class="splash-dot"></i></div>
  <div class="splash-foot">${T("تنقّل بثقة", "Move with confidence")}<small>${T("صُنع في المملكة العربية السعودية", "Made in Saudi Arabia")}</small></div></div>`,
  T("١ · شاشة البداية", "01 · Splash"));

S.login = phone(`<div class="s-pad">${status()}
  <div class="login-hero">${map({ labels: false, cars: [[60, 210, 90], [230, 340, 0], [150, 470, 0]], h: 640 })}<div class="login-logo">${logo(C.black)}</div></div>
  <div class="sheet-flat"><h4>${T("أهلاً بك في أورا", "Welcome to Aura")}</h4><p class="mut">${T("أدخل رقم جوالك للمتابعة", "Enter your mobile number to continue")}</p>
  <div class="tel"><span class="cc">🇸🇦 +966</span><span class="num">5X XXX XXXX</span></div>
  ${btn(T("متابعة", "Continue"))}
  <div class="or"><i></i>${T("أو", "or")}<i></i></div>
  <div class="alt"><span>${T("المتابعة عبر Apple", "Continue with Apple")}</span><span>${T("المتابعة عبر Google", "Continue with Google")}</span></div>
  <p class="fine">${T("بالمتابعة توافق على الشروط وسياسة الخصوصية", "By continuing you agree to the Terms and Privacy Policy")}</p></div></div>`,
  T("٢ · تسجيل الدخول", "02 · Sign in"));

S.signup = phone(`<div class="s-pad">${status()}${topbar(T("حساب جديد", "New account"))}
  <div class="pad"><h4>${T("لنبدأ رحلتك الأولى", "Let’s set up your first ride")}</h4>
  <div class="steps"><i class="on"></i><i class="on"></i><i></i></div>
  ${field(T("الاسم الكامل", "Full name"), T("سارة القحطاني", "Sarah Alqahtani"), "user")}
  ${field(T("البريد الإلكتروني", "Email"), "sarah@example.com", "mail")}
  ${field(T("رقم الجوال", "Mobile"), "+966 55 123 4567", "phone", "ok")}
  <small class="lbl">${T("رمز التحقق المرسل إلى جوالك", "Code sent to your phone")}</small>
  <div class="otp"><b>4</b><b>8</b><b>2</b><b class="cur"></b></div>
  <label class="chk"><i>${ic("check")}</i>${T("أوافق على الشروط والأحكام", "I agree to the Terms")}</label></div>
  <div class="dock">${btn(T("إنشاء الحساب", "Create account"))}</div></div>`,
  T("٣ · إنشاء حساب", "03 · Sign up"));

S.home = phone(`${map({ cars: [[60, 210, 90], [230, 330, 0], [180, 120, 90], [80, 360, 0]], pickup: [150, 300] })}${status()}
  <div class="hd-float"><i class="av">${ic("menu")}</i><div class="greet"><small>${T("مساء الخير", "Good evening")}</small><b>${T("سارة", "Sarah")}</b></div><i class="av">${ic("bell")}</i></div>
  <div class="sheet"><i class="grab"></i>
    <div class="where">${ic("search")}<span>${T("إلى أين؟", "Where to?")}</span><em>${ic("clock")}${T("الآن", "Now")}</em></div>
    <div class="saved">${row("home", T("المنزل", "Home"), T("حي النرجس", "Al Narjis"))}${row("work", T("العمل", "Work"), T("برج المملكة", "Kingdom Centre"))}</div>
    <div class="quick"><span class="on">${ic("car")}${T("رحلة", "Ride")}</span><span>${ic("clock")}${T("جدولة", "Schedule")}</span><span>${ic("seat")}${T("عائلي", "Family")}</span></div>
  </div>`, T("٤ · الرئيسية والخريطة", "04 · Home & map"));

S.pickup = phone(`${map({ pin: true, cars: [[60, 210, 90], [230, 360, 0]] })}${status()}
  <div class="hd-float">${`<i class="av">${ic("back", "flip")}</i>`}<span></span><i class="av">${ic("nav")}</i></div>
  <div class="tip">${T("حرّك الخريطة لضبط نقطة الالتقاء", "Drag the map to set your pickup")}</div>
  <div class="sheet"><i class="grab"></i><small class="lbl">${T("موقع الانطلاق", "Pickup point")}</small>
    <div class="addr"><i class="dot-o"></i><div><b>${T("طريق الملك فهد، العليا", "King Fahd Rd, Olaya")}</b><small>${T("بوابة ٣ · الرياض ١٢٢١٤", "Gate 3 · Riyadh 12214")}</small></div></div>
    ${btn(T("تأكيد موقع الانطلاق", "Confirm pickup"))}</div>`, T("٥ · تحديد موقع الانطلاق", "05 · Set pickup"));

S.dest = phone(`<div class="s-pad">${status()}${topbar(T("وجهتك", "Your trip"))}
  <div class="pad"><div class="ft"><div class="ft-line"><i class="dot-o"></i><i class="ln"></i><i class="sq"></i></div>
   <div class="ft-f"><div class="in">${T("طريق الملك فهد، العليا", "King Fahd Rd, Olaya")}</div><div class="in act">${T("مطار الملك خالد", "King Khalid Airp")}<i class="caret"></i></div></div></div>
  <small class="lbl">${T("نتائج البحث", "Results")}</small>
  <div class="res on">${ic("pin")}<div><b>${T("مطار الملك خالد الدولي", "King Khalid International Airport")}</b><small>${T("صالة ٥ · ٣٥ كم", "Terminal 5 · 35 km")}</small></div></div>
  <div class="res">${ic("clock")}<div><b>${T("بوليفارد رياض سيتي", "Boulevard Riyadh City")}</b><small>${T("حطين · ١٤ كم", "Hittin · 14 km")}</small></div></div>
  <div class="res">${ic("clock")}<div><b>${T("حي الطريف، الدرعية", "At-Turaif, Diriyah")}</b><small>${T("الدرعية · ٢١ كم", "Diriyah · 21 km")}</small></div></div>
  <div class="res">${ic("flag")}<div><b>${T("اختيار من الخريطة", "Choose on map")}</b><small>${T("ضع الدبوس بنفسك", "Drop a pin yourself")}</small></div></div></div></div>`,
  T("٦ · تحديد الوجهة", "06 · Destination"));

const cat = (name, sub, eta, price, on, seats) => `<div class="cat ${on ? "on" : ""}"><div class="car-th">${carSide(on ? "#101112" : "#2b2f33", 78)}</div><div class="cat-t"><b>${name}</b><small>${sub}</small></div><div class="cat-p"><b>${price}</b><small>${eta}</small></div></div>`;
S.cats = phone(`${map({ route: R1, pickup: [150, 470], drop: [210, 120], cars: [[60, 240, 90]] })}${status()}
  <div class="hd-float"><i class="av">${ic("back", "flip")}</i><span></span><span></span></div>
  <div class="sheet tall"><i class="grab"></i><h5>${T("اختر فئة السيارة", "Choose a ride")}</h5>
   ${cat("Aura Go", T("اقتصادية · ٤ مقاعد", "Everyday · 4 seats"), T("٣ د", "3 min"), "38 SAR", false)}
   ${cat("Aura Comfort", T("أوسع وأهدأ · ٤ مقاعد", "Roomier · 4 seats"), T("٤ د", "4 min"), "46 SAR", true)}
   ${cat("Aura Black", T("فاخرة · سائق محترف", "Premium · pro captain"), T("٦ د", "6 min"), "72 SAR", false)}
   ${cat("Aura XL", T("عائلية · ٧ مقاعد", "Family · 7 seats"), T("٨ د", "8 min"), "64 SAR", false)}
   ${btn(T("اختيار Aura Comfort", "Choose Aura Comfort"))}</div>`, T("٧ · اختيار فئة السيارة", "07 · Ride class"));

S.fare = phone(`<div class="s-pad">${status()}${topbar(T("تفاصيل السعر", "Fare details"))}
  <div class="pad"><div class="fare-hero"><small>${T("السعر المتوقع", "Estimated fare")}</small><b>46<span>SAR</span></b><em>${T("٢٢ دقيقة · ١٨.٤ كم", "22 min · 18.4 km")}</em></div>
  <div class="lines"><p><span>${T("رسوم فتح الرحلة", "Base fare")}</span><b>8.00</b></p><p><span>${T("المسافة · ١٨.٤ كم", "Distance · 18.4 km")}</span><b>27.60</b></p><p><span>${T("الوقت · ٢٢ دقيقة", "Time · 22 min")}</span><b>6.60</b></p><p><span>${T("ضريبة القيمة المضافة ١٥٪", "VAT 15%")}</span><b>3.80</b></p></div>
  <div class="pay">${ic("card")}<div><b>${T("مدى •••• 4821", "mada •••• 4821")}</b><small>${T("طريقة الدفع", "Payment method")}</small></div>${ic("chev", "flip")}</div>
  <div class="pay code-p">${ic("gift")}<div><b>AURA50</b><small>${T("خصم ٥٠٪ على أول رحلة", "50% off your first ride")}</small></div><em>−23</em></div></div>
  <div class="dock"><div class="tot"><span>${T("الإجمالي", "Total")}</span><b>23.00 SAR</b></div>${btn(T("تأكيد الطلب", "Request ride"))}</div></div>`,
  T("٨ · السعر المتوقع", "08 · Fare estimate"));

S.search = phone(`${map({ dark: true, pickup: [150, 300], rings: true, cars: [[60, 210, 90], [230, 330, 0], [180, 120, 90], [96, 410, 0]], labels: false })}${status(true)}
  <div class="sheet dk"><i class="grab"></i><div class="srch-t">${sym(C.green, "srch-sym")}<div><b>${T("نبحث عن أقرب كابتن", "Finding your captain")}</b><small>${T("٤ سيارات قريبة منك", "4 cars near you")}</small></div></div>
  <div class="bar"><i></i></div>
  <div class="mini"><span>${ic("pin")}${T("العليا", "Olaya")}</span><span>${ic("flag")}${T("المطار", "Airport")}</span><span>Aura Comfort</span></div>
  ${btn(T("إلغاء الطلب", "Cancel request"), "ghost-d")}</div>`, T("٩ · البحث عن سائق", "09 · Finding a captain"));

S.track = phone(`${map({ route: "M150 470 L150 400 L112 400 L112 300", pickup: [112, 300], cars: [[150, 455, 0]] })}${status()}
  <div class="eta-chip"><b>${T("٤ دقائق", "4 min")}</b>${T("الكابتن في الطريق إليك", "Captain on the way")}</div>
  <div class="sheet"><i class="grab"></i>
   <div class="drv"><div class="ph-av">${ic("user")}</div><div><b>${T("فيصل العتيبي", "Faisal Alotaibi")}</b><small>${ic("star", "st")} 4.96 · ${T("تويوتا كامري سوداء", "Black Toyota Camry")}</small></div><div class="plate"><span>١٢٣٤</span><span>ر ح ب</span><span>1234</span><span>RHB</span></div></div>
   <div class="acts"><span>${ic("phone")}${T("اتصال", "Call")}</span><span>${ic("chat")}${T("رسالة", "Message")}</span><span>${ic("share")}${T("مشاركة", "Share")}</span><span class="sos">${ic("shield")}${T("الأمان", "Safety")}</span></div>
   <div class="pin-code">${T("رمز التحقق للرحلة", "Ride PIN")}<b>7 3 9 1</b></div></div>`, T("١٠ · تتبع الرحلة مباشرة", "10 · Live tracking"));

S.rate = phone(`<div class="s-pad">${status()}
  <div class="pad center"><i class="done">${ic("check")}</i><h4>${T("وصلت بالسلامة", "You’ve arrived")}</h4><p class="mut">${T("مطار الملك خالد الدولي · ١٠:٠٣ م", "King Khalid Intl Airport · 10:03 PM")}</p>
  <div class="paid"><span>${T("تم الدفع عبر مدى", "Paid with mada")}</span><b>23.00 SAR</b></div>
  <div class="drv-r"><div class="ph-av">${ic("user")}</div><b>${T("كيف كانت رحلتك مع فيصل؟", "How was your ride with Faisal?")}</b></div>
  <div class="stars">${ic("star", "on").repeat(4)}${ic("star", "half")}</div>
  <div class="chips"><span class="on">${T("قيادة آمنة", "Safe driving")}</span><span class="on">${T("سيارة نظيفة", "Clean car")}</span><span>${T("دقة المواعيد", "On time")}</span><span>${T("لبق", "Friendly")}</span></div>
  <small class="lbl">${T("إكرامية للكابتن", "Tip your captain")}</small>
  <div class="tips"><span>5</span><span class="on">10</span><span>15</span><span>${T("أخرى", "Other")}</span></div></div>
  <div class="dock">${btn(T("إرسال التقييم", "Submit rating"))}</div></div>`, T("١١ · انتهاء الرحلة والتقييم", "11 · Trip end & rating"));

S.profile = phone(`<div class="s-pad">${status()}${topbar(T("حسابي", "Account"))}
  <div class="pad"><div class="prof"><div class="ph-av lg">${ic("user")}</div><div><b>${T("سارة القحطاني", "Sarah Alqahtani")}</b><small>${ic("star", "st")} 4.92 · ${T("عضو منذ ٢٠٢٦", "Member since 2026")}</small></div></div>
  <div class="stats"><p><b>48</b><small>${T("رحلة", "Rides")}</small></p><p><b>612</b><small>${T("نقطة أورا", "Aura points")}</small></p><p><b>Gold</b><small>${T("المستوى", "Tier")}</small></p></div>
  <div class="list">${row("card", T("طرق الدفع", "Payment"), "mada")}${row("home", T("الأماكن المحفوظة", "Saved places"), "3")}${row("shield", T("الأمان وجهات الطوارئ", "Safety & contacts"), "")}${row("bell", T("الإشعارات", "Notifications"), "")}
  <div class="row">${ic("globe")}<span>${T("اللغة", "Language")}</span><em class="seg"><i class="i-ar on-ar">عربي</i><i class="i-ar">EN</i><i class="i-en">عربي</i><i class="i-en on-ar">EN</i></em></div>
  ${row("help", T("المساعدة والدعم", "Help & support"), "")}</div>
  <div class="row out">${ic("logout")}<span>${T("تسجيل الخروج", "Sign out")}</span></div></div></div>`,
  T("١٢ · الملف الشخصي والإعدادات", "12 · Profile & settings"));

/* ---------- vehicle drawings ---------- */
function carSide(body = C.black, w = 640, opts = {}) {
  const { decal = false, decalFill = C.white, stripe = false, glass = "#1b1e21", wheelFill = "#0b0c0d" } = opts;
  const light = body.toUpperCase() === "#FFFFFF" || body === "#F7F8F6";
  const trim = light ? "#d9dcd6" : "#2a2e31";
  return `<svg class="car" viewBox="0 0 640 220" width="${w}" aria-hidden="true">
  <ellipse cx="322" cy="198" rx="300" ry="10" fill="#000" opacity=".18"/>
  <path d="M28 152 Q26 124 60 116 L156 101 Q196 62 262 52 L384 50 Q434 52 474 96 L560 106 Q604 112 610 138 L612 162 Q612 174 598 176 L544 176 A46 46 0 0 0 452 176 L200 176 A46 46 0 0 0 108 176 L44 176 Q28 174 28 152Z" fill="${body}"/>
  <path d="M180 101 Q212 68 264 61 L306 60 L306 101Z" fill="${glass}"/>
  <path d="M318 60 L384 59 Q420 61 452 99 L318 101Z" fill="${glass}"/>
  <path d="M312 58 L312 168 M182 104 L176 150 Q178 166 190 168 M452 102 L458 150" stroke="${trim}" stroke-width="1.6" fill="none"/>
  <path d="M60 118 L600 118" stroke="${trim}" stroke-width="1" opacity=".7"/>
  <rect x="262" y="124" width="22" height="4" rx="2" fill="${trim}"/><rect x="396" y="124" width="22" height="4" rx="2" fill="${trim}"/>
  <path d="M590 120 Q606 124 608 138 L584 134 Z" fill="${light ? "#cfd3cc" : "#e8eae5"}"/>
  <path d="M30 128 L48 124 L46 140 L30 142Z" fill="#6a1d1d"/>
  <path d="M446 96 L458 92 L466 100 L452 104Z" fill="${body}" stroke="${trim}"/>
  ${stripe ? `<path d="M118 160 L120 160 M196 160 L452 160 M548 160 L590 160" stroke="${C.green}" stroke-width="3" stroke-linecap="round"/>` : ""}
  ${decal ? logoG(336, 122, 96, decalFill) : ""}
  ${[154, 498].map((cx) => `<circle cx="${cx}" cy="176" r="38" fill="${wheelFill}"/><circle cx="${cx}" cy="176" r="24" fill="#3b3f43"/><circle cx="${cx}" cy="176" r="21" fill="none" stroke="#7d8287" stroke-width="2" stroke-dasharray="6 5"/><circle cx="${cx}" cy="176" r="6" fill="#9ca1a5"/>`).join("")}
  </svg>`;
}
function carRear(body = C.black) {
  const light = body.toUpperCase() === "#FFFFFF";
  return `<svg class="car" viewBox="0 0 320 250" aria-hidden="true">
  <ellipse cx="160" cy="236" rx="150" ry="8" fill="#000" opacity=".2"/>
  <path d="M60 70 Q70 34 112 28 L208 28 Q250 34 260 70 L292 104 Q304 112 304 128 L304 200 Q304 214 290 214 L30 214 Q16 214 16 200 L16 128 Q16 112 28 104Z" fill="${body}"/>
  <path d="M78 74 Q86 44 116 40 L204 40 Q234 44 242 74 L250 100 L70 100Z" fill="#16191b"/>
  ${logoG(124, 63, 72, C.white)}
  <rect x="26" y="120" width="70" height="12" rx="4" fill="#5e1a1a"/><rect x="224" y="120" width="70" height="12" rx="4" fill="#5e1a1a"/>
  <rect x="96" y="124" width="128" height="3" rx="1.5" fill="${light ? "#d0d3cd" : "#2c3033"}"/>
  <rect x="116" y="150" width="88" height="34" rx="3" fill="#fafaf8" stroke="#c9ccc6"/>
  <text x="140" y="164" font-size="11" text-anchor="middle" font-family="Readex Pro" fill="#101112">١٢٣٤</text><text x="182" y="164" font-size="11" text-anchor="middle" font-family="Readex Pro" fill="#101112">ر ح ب</text>
  <text x="140" y="179" font-size="10" text-anchor="middle" font-family="Readex Pro" fill="#101112">1234</text><text x="182" y="179" font-size="10" text-anchor="middle" font-family="Readex Pro" fill="#101112">RHB</text>
  <path d="M161 152 V182" stroke="#101112" stroke-width=".8"/>
  <rect x="24" y="200" width="46" height="26" rx="6" fill="#0b0c0d"/><rect x="250" y="200" width="46" height="26" rx="6" fill="#0b0c0d"/></svg>`;
}
const polo = () => `<svg viewBox="0 0 320 330" aria-hidden="true" class="polo">
  <path d="M110 30 L132 22 Q160 40 188 22 L210 30 L282 64 L304 150 L256 166 L246 128 L246 312 Q160 324 74 312 L74 128 L64 166 L16 150 L38 64Z" fill="${C.black}"/>
  <path d="M132 22 Q160 40 188 22 L178 58 L160 84 L142 58Z" fill="#1d2023"/>
  <path d="M132 22 L148 64 L160 84 L172 64 L188 22" fill="none" stroke="${C.green}" stroke-width="3"/>
  <path d="M160 84 L160 124" stroke="#2b2f33" stroke-width="2"/><circle cx="160" cy="98" r="2.5" fill="#3a3f43"/><circle cx="160" cy="114" r="2.5" fill="#3a3f43"/>
  <path d="M256 166 L304 150" stroke="${C.green}" stroke-width="3"/><path d="M16 150 L64 166" stroke="${C.green}" stroke-width="3"/>
  ${logoG(188, 112, 44, C.white)}</svg>`;

/* ---------- pattern svgs (built from the Λ) ---------- */
const patChevron = (bg, fg) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="pc${bg.slice(1)}" width="44" height="40" patternUnits="userSpaceOnUse">${symG(6, 6, 24, fg)}</pattern></defs><rect width="400" height="300" fill="${bg}"/><rect width="400" height="300" fill="url(#pc${bg.slice(1)})"/></svg>`;
const patRings = () => {
  let s = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="${C.black}"/>`;
  for (let i = 9; i >= 1; i--) {
    const h = i * 34, w = h * 1.27, x = 200 - w / 2, y = 250 - h;
    s += `<path d="M${x} 250 L${x + w / 2} ${y} L${x + w} 250" fill="none" stroke="${i === 1 ? C.green : "#FFFFFF"}" stroke-opacity="${i === 1 ? 1 : 0.9 - i * 0.08}" stroke-width="${i === 1 ? 7 : 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  return s + `<circle cx="200" cy="244" r="7" fill="${C.green}"/></svg>`;
};
const patHatch = () => {
  let s = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="${C.gray}"/>`;
  for (let x = -300; x < 500; x += 22) s += `<path d="M${x} 300 L${x + 186} 0" stroke="#d9dcd5" stroke-width="2"/>`;
  s += `<path d="M40 280 L130 130 L190 210 L270 60 L360 60" fill="none" stroke="${C.green}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="280" r="9" fill="${C.black}"/><rect x="351" y="51" width="18" height="18" rx="4" fill="${C.black}"/>`;
  return s + "</svg>";
};

/* ---------- QR-ish block (decorative, seeded) ---------- */
function pseudoQR(size = 21, seed = 7) {
  let s = `<svg viewBox="0 0 ${size} ${size}" class="qr" aria-hidden="true"><rect width="${size}" height="${size}" fill="#fff"/>`;
  let r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#101112"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#101112"/>`;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const inF = (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
    if (!inF && rnd() > 0.52) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="#101112"/>`;
  }
  return s + finder(0, 0) + finder(size - 7, 0) + finder(0, size - 7) + "</svg>";
}

/* ---------- color data ---------- */
const swatches = [
  { k: "black", hex: C.black, ar: "أسود أورا", en: "Aura Black", role: T("الأساس: الشعار، النصوص، الأزرار الرئيسية، المركبات", "Foundation: logo, text, primary buttons, fleet"), share: 45 },
  { k: "white", hex: C.white, ar: "أبيض", en: "White", role: T("المساحة والهدوء: الخلفيات والشعار المعكوس", "Space and calm: backgrounds, reversed logo"), share: 30 },
  { k: "gray", hex: C.gray, ar: "رمادي الطريق", en: "Road Gray", role: T("الأسطح الثانوية، الخرائط، الحقول", "Secondary surfaces, maps, inputs"), share: 17 },
  { k: "green", hex: C.green, ar: "أخضر الحركة", en: "Motion Green", role: T("الحركة فقط: المسارات، المواقع، الحالة الحية، التفاعل", "Motion only: routes, locations, live state, interaction"), share: 8 },
];

/* =====================================================================
   PAGE
   ===================================================================== */
const html = `<title>AURA Brand Identity</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap">
<style>
/* Layout: a board presentation — full-bleed chapters alternate Aura Black and White,
   each chapter a numbered brand-book section on a 12-col grid; mockups sit on Road Gray stages.
   Single deliberate look (brand palette), not theme-switched. */
:root{
  --black:${C.black}; --white:${C.white}; --green:${C.green}; --gray:${C.gray};
  --ink-2:#55595C;   /* secondary text on white (7.2:1) */
  --ink-3:#8A8E8B;   /* tertiary on black */
  --line:#E2E4DF;    /* hairlines on white */
  --line-d:#26292C;  /* hairlines on black */
  --f-display:"Readex Pro","IBM Plex Sans Arabic",system-ui,sans-serif;
  --f-body:"IBM Plex Sans Arabic","Readex Pro",system-ui,sans-serif;
  --r:20px;
  color-scheme:light;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--white);color:var(--black);font-family:var(--f-body);font-size:16px;line-height:1.75;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4,h5{font-family:var(--f-display);margin:0;line-height:1.25;text-wrap:balance;font-weight:600}
p{margin:0}
figure{margin:0}
svg{display:block}
[data-lang="ar"] .i-en,[data-lang="en"] .i-ar,[data-lang="ar"] x-en,[data-lang="en"] x-ar{display:none!important}
.wrap{max-width:1200px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.ltr{direction:ltr;unicode-bidi:isolate}
.num{font-variant-numeric:tabular-nums}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* top bar */
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:var(--black)}
.top{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:rgba(16,17,18,.94);backdrop-filter:blur(10px);color:var(--white);border-bottom:1px solid var(--line-d)}
.top .wrap{display:flex;align-items:center;gap:20px;height:58px}
.top .tl{width:74px;flex:none;color:var(--white)}
.top nav{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0}
.top nav::-webkit-scrollbar{display:none}
.top nav a{color:#B9BDB9;text-decoration:none;font-size:13px;padding:6px 10px;border-radius:99px;white-space:nowrap;font-family:var(--f-display)}
.top nav a:hover,.top nav a:focus-visible{color:var(--white);background:#1f2224;outline:none}
.lang{flex:none;display:flex;border:1px solid #3a3e41;border-radius:99px;padding:3px;font-family:var(--f-display);font-size:12px}
.lang button{all:unset;cursor:pointer;padding:4px 12px;border-radius:99px;color:#B9BDB9}
.lang button[aria-pressed="true"]{background:var(--white);color:var(--black)}
.lang button:focus-visible{outline:2px solid var(--green)}

/* chapters */
.ch{padding-block:96px}
.ch.dk{background:var(--black);color:var(--white)}
.ch.gy{background:var(--gray)}
.head{display:grid;grid-template-columns:120px 1fr;gap:24px;margin-bottom:48px;align-items:start}
.head .no{font-family:var(--f-display);font-size:13px;letter-spacing:.14em;color:var(--green);padding-top:10px;direction:ltr;text-align:start}
.head h2{font-size:clamp(30px,4.4vw,52px);font-weight:600;letter-spacing:-.01em}
.head p{max-width:62ch;color:var(--ink-2);margin-top:14px;font-size:17px}
.dk .head p{color:#A9ADAA}
@media(max-width:700px){.head{grid-template-columns:1fr;gap:6px}.ch{padding-block:64px}}
.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:20px}
.c3{grid-column:span 3}.c4{grid-column:span 4}.c5{grid-column:span 5}.c6{grid-column:span 6}.c7{grid-column:span 7}.c8{grid-column:span 8}.c12{grid-column:span 12}
@media(max-width:900px){.c3{grid-column:span 6}.c4,.c5,.c7,.c8{grid-column:span 12}.c6{grid-column:span 12}}
@media(max-width:520px){.c3{grid-column:span 12}}
.tile{border-radius:var(--r);position:relative;overflow:hidden;min-width:0}
.t-b{background:var(--black);color:var(--white)}
.t-w{background:var(--white);border:1px solid var(--line)}
.t-g{background:var(--gray)}
.t-gr{background:var(--green);color:var(--black)}
.cap{font-size:13px;color:var(--ink-2);margin-top:12px;font-family:var(--f-display)}
.dk .cap{color:var(--ink-3)}
.eyebrow{font-family:var(--f-display);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
.dk .eyebrow{color:var(--ink-3)}

/* cover */
.cover{background:var(--black);color:var(--white);margin-top:calc(-1 * env(safe-area-inset-top,0px));padding-top:env(safe-area-inset-top,0px);overflow:hidden;position:relative}
.cover .wrap{padding-block:clamp(64px,10vw,120px) 56px;position:relative}
.cover-meta{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-family:var(--f-display);font-size:13px;color:#9EA29F;border-bottom:1px solid var(--line-d);padding-bottom:18px}
.cover-logo{width:min(640px,86%);margin:clamp(56px,9vw,110px) auto 0;position:relative}
.cover-logo .lg{width:100%;height:auto;color:var(--white)}
.cover-route{position:absolute;inset:-8% -12% -30% -12%;width:124%;height:138%;pointer-events:none}
.cover-route path{stroke-dasharray:1400;stroke-dashoffset:0;animation:draw 2.4s cubic-bezier(.6,0,.2,1) both}
@keyframes draw{from{stroke-dashoffset:1400}to{stroke-dashoffset:0}}
.cover h1{font-size:clamp(22px,3vw,34px);font-weight:400;text-align:center;margin-top:clamp(40px,6vw,72px);color:#E7E9E5}
.cover h1 b{font-weight:600;color:var(--white)}
.cover .sub{text-align:center;color:#8E928F;margin-top:10px;font-family:var(--f-display);font-size:14px;letter-spacing:.06em}
.toc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line-d);border:1px solid var(--line-d);border-radius:16px;overflow:hidden;margin-top:72px}
.toc a{background:var(--black);color:#C9CCC8;text-decoration:none;padding:16px 18px;font-family:var(--f-display);font-size:14px;display:flex;gap:12px}
.toc a i{font-style:normal;color:var(--green);font-size:12px;direction:ltr}
.toc a:hover,.toc a:focus-visible{background:#17191b;color:var(--white);outline:none}
@media(max-width:800px){.toc{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* essence */
.thesis{font-family:var(--f-display);font-size:clamp(24px,3.2vw,40px);line-height:1.45;font-weight:400;max-width:28ch}
.thesis b{font-weight:600}
.thesis em{font-style:normal;color:var(--green)}
.vals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-top:56px}
.val{background:var(--white);padding:28px 26px;display:flex;flex-direction:column;gap:8px;min-width:0}
.val .ic{width:26px;height:26px;stroke:var(--black)}
.val h4{font-size:20px}
.val p{color:var(--ink-2);font-size:15px}
@media(max-width:800px){.vals{grid-template-columns:1fr}}
.voice{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.voice .tile{padding:28px}
.voice h5{font-size:15px;margin-bottom:12px}
.voice ul{margin:0;padding-inline-start:18px;display:grid;gap:6px;font-size:15px}
.voice .t-b ul{color:#D6D9D5}
@media(max-width:700px){.voice{grid-template-columns:1fr}}

/* logo chapter */
.stage{display:flex;align-items:center;justify-content:center;min-height:340px;padding:48px 32px}
.stage .lg{width:min(420px,80%);height:auto}
.stage.sm{min-height:240px}
.stage.sm .lg{width:min(260px,70%)}
.lock-bi{display:flex;align-items:center;gap:clamp(16px,3vw,32px);direction:ltr}
.lock-bi .lg{width:clamp(140px,22vw,240px);height:auto}
.lock-bi .bar{width:2px;height:clamp(48px,7vw,84px);background:currentColor;opacity:.3;display:block}
.lock-bi .ar{font-family:"Readex Pro";font-weight:600;font-size:clamp(46px,7vw,80px);line-height:1;letter-spacing:0;direction:rtl}
.spec{position:absolute;inset-inline-start:20px;top:16px;font-family:var(--f-display);font-size:12px;opacity:.6}

.constr{background:var(--gray);border-radius:var(--r);padding:clamp(20px,4vw,56px);overflow-x:auto}
.constr svg{min-width:560px;width:100%;height:auto}
.rules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:20px}
.rules .tile{padding:24px}
.rules h5{font-size:16px;margin-bottom:6px}
.rules p{font-size:14px;color:var(--ink-2)}
@media(max-width:800px){.rules{grid-template-columns:1fr}}
.donts{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;margin-top:20px}
.dont{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:12px;min-width:0}
.dont .bx{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--gray);overflow:hidden;position:relative}
.dont .bx .lg{width:70%;height:auto}
.dont .bx::after{content:"";position:absolute;inset:0;background:linear-gradient(to top right,transparent calc(50% - 1px),rgba(16,17,18,.55) 50%,transparent calc(50% + 1px))}
.dont p{font-size:12.5px;margin-top:8px;color:var(--ink-2);line-height:1.5}
@media(max-width:900px){.donts{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:480px){.donts{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* icon */
.icons-row{display:flex;align-items:flex-end;justify-content:center;gap:clamp(16px,4vw,48px);flex-wrap:wrap;padding:48px 24px}
.icons-row figure{display:flex;flex-direction:column;align-items:center;gap:10px;font-family:var(--f-display);font-size:12px;color:var(--ink-3)}
.icons-row svg{filter:drop-shadow(0 18px 30px rgba(0,0,0,.35))}
.homescreen{background:linear-gradient(160deg,#2b3a24 0%,#101112 55%,#0b0c0d 100%);border-radius:var(--r);padding:36px 24px;display:grid;grid-template-columns:repeat(4,64px);gap:22px 26px;justify-content:center;min-height:100%;align-content:center}
.homescreen span{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:10px;color:#cfd2ce;font-family:var(--f-display)}
.homescreen i{width:60px;height:60px;border-radius:14px;background:#2a2d30;display:block}
.homescreen i.mut2{background:#3a3e42}.homescreen i.mut3{background:#4a4d50}

/* color */
.sw{border-radius:var(--r);overflow:hidden;border:1px solid var(--line);display:flex;flex-direction:column;min-width:0;background:var(--white)}
.sw .chip{height:200px;padding:20px;display:flex;align-items:flex-end;font-family:var(--f-display);font-weight:600;font-size:22px}
.sw .meta{padding:18px 20px;display:grid;gap:4px;font-size:13px}
.sw .meta div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-block:4px}
.sw .meta div:last-child{border:0}
.sw .meta span{color:var(--ink-2)}
.sw .meta b{font-weight:500;font-family:var(--f-display);direction:ltr}
.sw .role{padding:0 20px 20px;font-size:14px;color:var(--ink-2)}
.prop{display:flex;height:64px;border-radius:14px;overflow:hidden;border:1px solid var(--line);margin-top:20px}
.prop div{display:flex;align-items:center;padding-inline:14px;font-family:var(--f-display);font-size:13px;white-space:nowrap;overflow:hidden}
.ctab{width:100%;border-collapse:collapse;font-size:14px}
.ctab td,.ctab th{padding:12px 10px;border-bottom:1px solid var(--line);text-align:start}
.ctab th{font-family:var(--f-display);font-weight:500;color:var(--ink-2);font-size:12.5px}
.ctab .pv{display:inline-flex;align-items:center;justify-content:center;width:64px;height:30px;border-radius:8px;font-family:var(--f-display);font-weight:600;font-size:13px}
.tag{font-family:var(--f-display);font-size:12px;padding:3px 10px;border-radius:99px;white-space:nowrap}
.tag.ok{background:#E9F3DF;color:#2E4D12}.tag.lim{background:var(--gray);color:var(--ink-2)}

/* type */
.spec-t{padding:clamp(24px,4vw,48px)}
.spec-t .big{font-family:var(--f-display);font-size:clamp(64px,10vw,132px);line-height:1;font-weight:600;letter-spacing:-.01em}
.spec-t .glyphs{font-family:var(--f-display);font-size:clamp(18px,2.2vw,24px);color:#A9ADAA;margin-top:18px;word-break:break-word;line-height:1.6}
.spec-t .wts{display:flex;gap:20px;flex-wrap:wrap;margin-top:24px;font-family:var(--f-display);font-size:20px}
.scale{display:grid;gap:0;margin-top:20px;border-top:1px solid var(--line)}
.scale div{display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:baseline;padding-block:16px;border-bottom:1px solid var(--line)}
.scale small{font-family:var(--f-display);color:var(--ink-2);font-size:12px;direction:ltr;text-align:start}
.scale div>span{min-width:0}
@media(max-width:600px){.scale div{grid-template-columns:1fr;gap:4px}}

/* patterns & elements */
.pat{aspect-ratio:4/3;max-width:100%}
.pat svg{width:100%;height:100%}
.el{padding:28px;display:flex;flex-direction:column;gap:18px}
.el svg{width:100%;height:auto}
.iconset{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:1px;background:var(--line);border-radius:var(--r);overflow:hidden;border:1px solid var(--line)}
.iconset div{background:var(--white);aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:11px;color:var(--ink-2);font-family:var(--f-display);min-width:0}
.iconset .ic{width:28px;height:28px;stroke:var(--black)}
@media(max-width:700px){.iconset{grid-template-columns:repeat(4,minmax(0,1fr))}}

/* icons general */
.ic{width:1.5em;height:1.5em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
[dir="rtl"] .flip{transform:scaleX(-1)}

/* ================= PHONE UI ================= */
.screens{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:40px 28px}
@media(max-width:1100px){.screens{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:820px){.screens{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){.screens{grid-template-columns:minmax(0,1fr);justify-items:center}}
.ph-fig{display:flex;flex-direction:column;align-items:center;gap:14px;min-width:0;width:100%}
.ph-fig figcaption{font-family:var(--f-display);font-size:13px;color:var(--ink-2);text-align:center}
.dk .ph-fig figcaption{color:var(--ink-3)}
.phone{width:100%;max-width:272px;aspect-ratio:9/19.5;background:#0A0B0C;border-radius:14% / 6.5%;padding:2.8%;box-shadow:0 30px 60px -20px rgba(16,17,18,.45),inset 0 0 0 1.5px #2c3033;container-type:inline-size}
.scr{position:relative;height:100%;overflow:hidden;border-radius:11.5% / 5.3%;background:var(--white);font-size:4.1cqw;line-height:1.45;color:var(--black);font-family:var(--f-body)}
.scr b{font-weight:600}
.scr .map{position:absolute;inset:0;width:100%;height:100%}
.scr small{font-size:.8em;color:#6B6F72;display:block}
.scr .ic{width:1.45em;height:1.45em}
.home-ind{position:absolute;bottom:1.6%;left:50%;transform:translateX(-50%);width:35%;height:.45em;border-radius:9em;background:var(--black);z-index:9}
.s-splash .home-ind,.dkui .home-ind{background:#fff}
.sb{position:absolute;top:0;inset-inline:0;height:9%;display:flex;align-items:center;justify-content:space-between;padding:0 9% 0 10%;z-index:8;font-family:var(--f-display);font-size:.95em;direction:ltr}
.sb-l{color:#fff}
.island{position:absolute;left:50%;top:22%;transform:translateX(-50%);width:32%;height:34%;background:#000;border-radius:9em}
.sb-r{display:flex;gap:.4em;align-items:center}
.sig{width:1.2em;height:.75em;background:linear-gradient(90deg,currentColor 0 18%,transparent 18% 27%,currentColor 27% 45%,transparent 45% 55%,currentColor 55% 73%,transparent 73% 82%,currentColor 82%);display:block;-webkit-mask:linear-gradient(to top,#000 100%,transparent);clip-path:polygon(0 100%,100% 0,100% 100%)}
.bat{width:1.7em;height:.8em;border:1.5px solid currentColor;border-radius:.25em;display:block;position:relative}
.bat::after{content:"";position:absolute;inset:1.5px;right:22%;background:currentColor;border-radius:1px}
/* splash */
.s-splash{position:absolute;inset:0;background:var(--black);color:#fff}
.splash-mid{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);width:56%;display:flex;flex-direction:column;align-items:center;gap:1.6em}
.splash-logo{width:100%;height:auto}
.splash-dot{width:.7em;height:.7em;border-radius:50%;background:var(--green);box-shadow:0 0 0 .5em rgba(120,184,63,.18),0 0 0 1.1em rgba(120,184,63,.08);animation:breathe 2.6s ease-in-out infinite}
@keyframes breathe{50%{box-shadow:0 0 0 .8em rgba(120,184,63,.2),0 0 0 1.7em rgba(120,184,63,.06)}}
.splash-foot{position:absolute;bottom:9%;inset-inline:0;text-align:center;font-family:var(--f-display);font-size:1.05em}
.splash-foot small{color:#8a8e8b;margin-top:.3em}
/* generic */
.s-pad{position:absolute;inset:0;display:flex;flex-direction:column;padding-top:12%}
.pad{padding:0 6.5%;display:flex;flex-direction:column;gap:.75em;flex:1;min-height:0}
.pad.center{align-items:center;text-align:center;padding-top:4%}
.scr h4{font-size:1.45em;font-weight:600}
.scr h5{font-size:1.1em;font-weight:600;margin-bottom:.2em}
.mut{color:#6B6F72;font-size:.92em}
.lbl{font-family:var(--f-display);margin-top:.4em}
.btn{background:var(--black);color:#fff;border-radius:.9em;padding:.95em;text-align:center;font-family:var(--f-display);font-weight:500;font-size:1em}
.btn.ghost-d{background:#1f2224;color:#fff}
.dock{padding:3% 6.5% 9%;display:flex;flex-direction:column;gap:.6em;border-top:1px solid #ECEEEA}
.tb{display:flex;align-items:center;justify-content:space-between;padding:1% 5% 3%;font-family:var(--f-display)}
.tb b{font-size:1.05em;font-weight:500}
.tb span{width:1.45em}
.fld{display:flex;align-items:center;gap:.7em;background:var(--gray);border-radius:.8em;padding:.6em .8em;border:1.5px solid transparent}
.fld.ok{border-color:var(--green)}
.fld .ic{color:#6B6F72}
.fld span{font-size:.95em;direction:inherit}
.steps{display:flex;gap:.3em}.steps i{height:.25em;flex:1;border-radius:9em;background:#E3E5E1}.steps i.on{background:var(--green)}
.otp{display:flex;gap:.5em;direction:ltr}
.otp b{flex:1;aspect-ratio:1;max-width:3.2em;background:var(--gray);border-radius:.7em;display:flex;align-items:center;justify-content:center;font-family:var(--f-display);font-size:1.3em;font-weight:500}
.otp b.cur{border:1.5px solid var(--black);position:relative}
.otp b.cur::after{content:"";width:1.5px;height:45%;background:var(--black);animation:blink 1s steps(2) infinite}
@keyframes blink{50%{opacity:0}}
.chk{display:flex;align-items:center;gap:.6em;font-size:.88em}
.chk i{width:1.4em;height:1.4em;border-radius:.35em;background:var(--black);color:#fff;display:flex;align-items:center;justify-content:center}
.chk i .ic{width:1em;height:1em}
/* login */
.login-hero{position:relative;height:38%;margin-top:-12%;overflow:hidden}
.login-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,.2),#fff 96%)}
.login-logo{position:absolute;z-index:2;bottom:16%;left:50%;transform:translateX(-50%);width:38%}
.login-logo svg{width:100%;height:auto}
.sheet-flat{padding:0 7%;display:flex;flex-direction:column;gap:.75em}
.tel{display:flex;align-items:center;gap:.7em;background:var(--gray);border-radius:.9em;padding:.85em;direction:ltr;font-family:var(--f-display)}
.tel .cc{padding-inline-end:.7em;border-inline-end:1px solid #D6D9D3}
.tel .num{color:#9a9e9b}
.or{display:flex;align-items:center;gap:.6em;color:#9a9e9b;font-size:.85em}.or i{flex:1;height:1px;background:#E3E5E1}
.alt{display:grid;gap:.5em}.alt span{border:1px solid #DFE1DC;border-radius:.9em;padding:.75em;text-align:center;font-family:var(--f-display);font-size:.92em}
.fine{font-size:.72em;color:#8a8e8b;text-align:center}
/* map screens */
.hd-float{position:absolute;top:10.5%;inset-inline:5%;display:flex;align-items:center;justify-content:space-between;z-index:5}
.av{width:2.6em;height:2.6em;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 .3em 1em rgba(16,17,18,.12);font-style:normal}
.greet{background:#fff;border-radius:9em;padding:.35em 1.2em;text-align:center;box-shadow:0 .3em 1em rgba(16,17,18,.12);font-family:var(--f-display)}
.greet small{font-size:.72em}
.sheet{position:absolute;bottom:0;inset-inline:0;background:#fff;border-radius:1.7em 1.7em 0 0;padding:.6em 6% 10%;display:flex;flex-direction:column;gap:.7em;box-shadow:0 -.5em 2em rgba(16,17,18,.12);z-index:6}
.sheet.dk{background:var(--black);color:#fff}
.sheet.dk small{color:#8a8e8b}
.grab{width:12%;height:.3em;border-radius:9em;background:#D6D9D3;align-self:center;display:block}
.dk .grab{background:#3a3e41}
.where{display:flex;align-items:center;gap:.6em;background:var(--gray);border-radius:.9em;padding:.85em;font-family:var(--f-display);font-size:1.05em}
.where span{flex:1}
.where em{font-style:normal;display:flex;align-items:center;gap:.3em;background:#fff;border-radius:9em;padding:.25em .7em;font-size:.75em}
.where em .ic{width:1.2em;height:1.2em}
.row{display:flex;align-items:center;gap:.75em;padding:.55em 0;border-bottom:1px solid #F0F1EE}
.row>span{flex:1;font-size:.95em}
.row em{font-style:normal;color:#8a8e8b;font-size:.82em}
.row .ic:last-child{width:1.1em;height:1.1em;color:#B5B8B4}
.row>.ic:first-child{color:var(--black)}
.saved .row:last-child{border:0}
.quick{display:flex;gap:.5em}
.quick span{flex:1;display:flex;flex-direction:column;align-items:center;gap:.25em;border-radius:.9em;background:var(--gray);padding:.6em 0;font-size:.8em;font-family:var(--f-display)}
.quick span.on{background:var(--black);color:#fff}
.quick span.on .ic{color:var(--green)}
.tip{position:absolute;top:21%;left:50%;transform:translateX(-50%);background:var(--black);color:#fff;border-radius:9em;padding:.45em 1em;font-size:.8em;white-space:nowrap;z-index:5;font-family:var(--f-display)}
.addr{display:flex;gap:.7em;align-items:center;background:var(--gray);border-radius:.9em;padding:.8em}
.dot-o{width:.9em;height:.9em;border-radius:50%;border:.28em solid var(--black);flex:none;background:#fff;display:block}
.ft{display:flex;gap:.7em;align-items:stretch;background:var(--gray);border-radius:1em;padding:.75em}
.ft-line{display:flex;flex-direction:column;align-items:center;padding-block:.75em}
.ft-line .ln{flex:1;width:2px;background:var(--green);margin-block:.2em;display:block}
.ft-line .sq{width:.75em;height:.75em;background:var(--black);border-radius:.15em;display:block}
.ft-f{flex:1;display:flex;flex-direction:column;gap:.45em;min-width:0}
.ft-f .in{background:#fff;border-radius:.7em;padding:.6em .7em;font-size:.9em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft-f .in.act{border:1.5px solid var(--black)}
.caret{display:inline-block;width:1.5px;height:1em;background:var(--green);vertical-align:middle;margin-inline-start:.1em;animation:blink 1s steps(2) infinite}
.res{display:flex;gap:.75em;align-items:center;padding:.6em .5em;border-radius:.8em}
.res .ic{color:#6B6F72}
.res.on{background:var(--gray)}.res.on .ic{color:var(--green)}
.res b{font-size:.93em;display:block}
.cat{display:flex;align-items:center;gap:.6em;padding:.35em .55em;border-radius:.9em;border:1.5px solid transparent}
.cat.on{border-color:var(--green);background:#F6FAF1}
.car-th{width:4.4em;flex:none}
.car-th svg{width:100%;height:auto}
.cat-t{flex:1;min-width:0}.cat-t b{font-family:var(--f-display);font-size:.95em;display:block}
.cat-p{text-align:end}.cat-p b{font-family:var(--f-display);font-size:.95em;direction:ltr;display:block}
.sheet.tall{gap:.35em}
.sheet.tall .btn{margin-top:.4em}
.fare-hero{background:var(--black);color:#fff;border-radius:1.2em;padding:1.1em 1.2em;display:flex;flex-direction:column;gap:.1em;position:relative;overflow:hidden}
.fare-hero small{color:#9EA29F}
.fare-hero b{font-family:var(--f-display);font-size:2.6em;font-weight:600;line-height:1.1;direction:ltr;text-align:start}
.fare-hero b span{font-size:.38em;color:var(--green);margin-inline-start:.3em;font-weight:500}
.fare-hero em{font-style:normal;font-size:.82em;color:#C9CCC8}
.lines{display:flex;flex-direction:column}
.lines p{display:flex;justify-content:space-between;padding:.45em 0;border-bottom:1px dashed #E3E5E1;font-size:.9em}
.lines b{font-family:var(--f-display);font-weight:500;direction:ltr}
.pay{display:flex;align-items:center;gap:.7em;border:1px solid #E3E5E1;border-radius:.9em;padding:.65em .8em}
.pay>div{flex:1}.pay b{font-size:.92em;display:block}
.pay .ic:last-child{width:1.1em;height:1.1em;color:#B5B8B4}
.pay.code-p{border-style:dashed;border-color:var(--green)}
.pay.code-p>.ic{color:var(--green)}
.pay em{font-style:normal;font-family:var(--f-display);color:#3f6e18;direction:ltr}
.tot{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--f-display)}
.tot b{font-size:1.2em;direction:ltr}
.srch-t{display:flex;gap:.8em;align-items:center}
.srch-sym{width:2.2em;height:auto;animation:breathe2 1.6s ease-in-out infinite}
@keyframes breathe2{50%{opacity:.5;transform:translateY(-.1em)}}
.bar{height:.3em;background:#26292c;border-radius:9em;overflow:hidden}
.bar i{display:block;height:100%;width:40%;background:var(--green);border-radius:9em;animation:slide 1.8s ease-in-out infinite}
@keyframes slide{from{transform:translateX(-110%)}to{transform:translateX(260%)}}
[dir="rtl"] .bar i{animation-name:slide-r}
@keyframes slide-r{from{transform:translateX(110%)}to{transform:translateX(-260%)}}
.mini{display:flex;gap:.4em;flex-wrap:wrap}
.mini span{display:flex;align-items:center;gap:.25em;background:#1f2224;border-radius:9em;padding:.25em .7em;font-size:.78em}
.mini .ic{width:1.1em;height:1.1em;color:var(--green)}
.pulse{transform-origin:center;transform-box:fill-box;animation:ring 2.4s ease-out infinite}
@keyframes ring{0%{transform:scale(.6);opacity:.35}100%{transform:scale(1.25);opacity:0}}
.eta-chip{position:absolute;top:11%;inset-inline:6%;background:var(--black);color:#fff;border-radius:1em;padding:.7em 1em;display:flex;align-items:center;gap:.7em;font-size:.88em;z-index:5}
.eta-chip b{background:var(--green);color:var(--black);border-radius:.6em;padding:.2em .6em;font-family:var(--f-display);white-space:nowrap}
.drv{display:flex;align-items:center;gap:.7em}
.drv>div:nth-child(2){flex:1;min-width:0}
.drv b{font-size:.95em}
.ph-av{width:2.8em;height:2.8em;border-radius:50%;background:var(--gray);display:flex;align-items:center;justify-content:center;flex:none;color:#6B6F72}
.ph-av.lg{width:3.8em;height:3.8em}
.ic.st{width:1em;height:1em;fill:var(--black);stroke:none;display:inline;vertical-align:-.12em}
.plate{display:grid;grid-template-columns:1fr 1fr;border:1px solid #101112;border-radius:.35em;font-family:var(--f-display);font-size:.62em;line-height:1.35;text-align:center;direction:ltr;flex:none}
.plate span{padding:0 .4em}
.plate span:nth-child(odd){border-inline-end:1px solid #101112}
.plate span:nth-child(-n+2){border-bottom:1px solid #101112}
.acts{display:grid;grid-template-columns:repeat(4,1fr);gap:.4em}
.acts span{display:flex;flex-direction:column;align-items:center;gap:.2em;background:var(--gray);border-radius:.8em;padding:.55em 0;font-size:.75em;font-family:var(--f-display)}
.acts .sos{background:var(--black);color:#fff}.acts .sos .ic{color:var(--green)}
.pin-code{display:flex;justify-content:space-between;align-items:center;font-size:.82em;border-top:1px solid #F0F1EE;padding-top:.6em}
.pin-code b{font-family:var(--f-display);letter-spacing:.15em;font-size:1.2em;direction:ltr}
.done{width:3.6em;height:3.6em;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center}
.done .ic{width:1.8em;height:1.8em;stroke-width:2.5}
.paid{display:flex;justify-content:space-between;width:100%;background:var(--gray);border-radius:.9em;padding:.7em .9em;font-size:.9em}
.paid b{font-family:var(--f-display);direction:ltr}
.drv-r{display:flex;flex-direction:column;align-items:center;gap:.4em;margin-top:.4em}
.stars{display:flex;gap:.3em;justify-content:center}
.stars .ic{width:2em;height:2em;stroke:none;fill:#E3E5E1}
.stars .ic.on{fill:var(--black)}
.stars .ic.half{fill:#E3E5E1}
.chips{display:flex;flex-wrap:wrap;gap:.35em;justify-content:center}
.chips span{border:1px solid #DFE1DC;border-radius:9em;padding:.25em .8em;font-size:.8em}
.chips span.on{background:var(--black);color:#fff;border-color:var(--black)}
.tips{display:grid;grid-template-columns:repeat(4,1fr);gap:.4em;width:100%}
.tips span{border:1px solid #DFE1DC;border-radius:.7em;padding:.45em 0;text-align:center;font-family:var(--f-display);font-size:.88em}
.tips span.on{border:1.5px solid var(--green);background:#F6FAF1}
.prof{display:flex;align-items:center;gap:.9em}
.prof b{font-size:1.1em}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.4em}
.stats p{background:var(--gray);border-radius:.8em;padding:.6em;text-align:center}
.stats b{font-family:var(--f-display);font-size:1.1em;display:block}
.list .row:last-child{border:0}
.seg{display:flex;background:var(--gray);border-radius:9em;padding:.15em;font-style:normal}
.seg i{font-style:normal;padding:.1em .6em;border-radius:9em;font-size:.95em}
.seg i.on-ar{background:var(--black);color:#fff}
.row.out{color:#6B6F72;border:0;margin-top:auto;margin-bottom:12%}
.row.out span{color:#6B6F72}
.ux-notes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-top:56px}
.ux-notes div{border-top:2px solid var(--black);padding-top:14px}
.ux-notes h5{font-size:16px;margin-bottom:6px}
.ux-notes p{font-size:14px;color:var(--ink-2)}
@media(max-width:900px){.ux-notes{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.ux-notes{grid-template-columns:1fr}}

/* fleet */
.fleet-stage{border-radius:var(--r);overflow:hidden;position:relative;padding:clamp(28px,5vw,64px) clamp(16px,4vw,48px) clamp(24px,4vw,40px);display:flex;flex-direction:column;gap:18px}
.fleet-stage .car{width:100%;height:auto}
.fs-dark{background:radial-gradient(120% 80% at 50% 0%,#2a2e31 0%,#151719 60%,#0d0e0f 100%);color:#fff}
.fs-light{background:radial-gradient(120% 80% at 50% 0%,#ffffff 0%,#eceee9 70%,#e2e5df 100%)}
.fs-label{display:flex;justify-content:space-between;gap:12px;font-family:var(--f-display);font-size:13px;opacity:.75;flex-wrap:wrap}
.detail{aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:24px}
.detail svg{width:100%;height:auto;max-height:100%}
.idcard{aspect-ratio:1.586;max-width:440px;width:100%;margin:auto;border-radius:18px;background:var(--black);color:#fff;padding:5% 6%;display:grid;grid-template-columns:30% 1fr;grid-template-rows:auto 1fr auto;gap:4% 6%;position:relative;overflow:hidden;box-shadow:0 30px 50px -20px rgba(0,0,0,.5);font-size:clamp(10px,1.4vw,13px)}
.idcard .pt{position:absolute;inset:0;opacity:.07}
.idcard .pt svg{width:100%;height:100%}
.idcard .hd{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;position:relative}
.idcard .hd svg{width:30%;height:auto}
.idcard .hd span{font-family:var(--f-display);font-size:.85em;color:var(--green);letter-spacing:.06em}
.idcard .photo{background:#2a2d30;border-radius:10px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;position:relative}
.idcard .photo svg{width:84%;height:auto;color:#55595c}
.idcard .info{display:flex;flex-direction:column;gap:.25em;position:relative;min-width:0}
.idcard .info b{font-family:var(--f-display);font-size:1.45em;font-weight:600}
.idcard .info small{color:#9EA29F;display:block;font-size:.8em}
.idcard .info .kv{display:grid;grid-template-columns:auto 1fr;gap:.1em 1em;margin-top:.5em;font-size:.92em}
.idcard .info .kv span{color:#9EA29F}
.idcard .ft2{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #2a2d30;padding-top:3%;position:relative;font-size:.85em}
.idcard .qr{width:3.8em;height:3.8em;border-radius:4px}
.idcard .vf{display:flex;align-items:center;gap:.4em;color:var(--green);font-family:var(--f-display)}
.idcard .vf .ic{width:1.3em;height:1.3em}

/* marketing */
.bcard{aspect-ratio:85/55;width:100%;border-radius:10px;box-shadow:0 24px 40px -18px rgba(16,17,18,.45);position:relative;overflow:hidden}
.bc-f{background:var(--black);display:flex;align-items:center;justify-content:center}
.bc-f svg.lg{width:44%;height:auto;color:#fff}
.bc-f .gl{position:absolute;bottom:12%;inset-inline-start:8%;width:5%;height:auto}
.bc-b{background:#fff;padding:7% 8%;display:flex;flex-direction:column;justify-content:space-between;font-size:clamp(9px,1.25vw,13px)}
.bc-b b{font-family:var(--f-display);font-size:1.5em;font-weight:600;display:block}
.bc-b .rl{color:var(--ink-2)}
.bc-b .ct{display:grid;gap:.25em;direction:ltr;text-align:start;font-family:var(--f-display)}
[dir="rtl"] .bc-b .ct{text-align:right}
.bc-b .sy{position:absolute;top:8%;inset-inline-end:8%;width:9%;height:auto}
.bc-b .ln{position:absolute;bottom:0;inset-inline:0;height:4%;background:var(--green)}
.cards-stage{background:var(--gray);border-radius:var(--r);padding:clamp(24px,5vw,64px);display:grid;grid-template-columns:1fr 1fr;gap:clamp(16px,3vw,40px);align-items:center}
@media(max-width:700px){.cards-stage{grid-template-columns:1fr}}
.post{aspect-ratio:1;border-radius:14px;overflow:hidden;position:relative;padding:8%;display:flex;flex-direction:column;justify-content:space-between;min-width:0;font-size:clamp(11px,1.3vw,15px)}
.post h3{font-size:2.1em;font-weight:600;line-height:1.2}
.post p{font-size:1em}
.post .lg{width:30%;height:auto}
.post .bg{position:absolute;inset:0}
.post .bg svg{width:100%;height:100%}
.post>*:not(.bg){position:relative}
.post .code{display:inline-block;border:2px dashed currentColor;border-radius:10px;padding:.3em .9em;font-family:var(--f-display);font-weight:600;font-size:1.4em;letter-spacing:.08em;direction:ltr}
.post .ph-sm{position:absolute;inset-inline-end:-6%;bottom:-24%;width:46%}
.post .ph-sm .phone{max-width:none}
.launch{border-radius:var(--r);background:var(--black);color:#fff;overflow:hidden;display:grid;grid-template-columns:1.1fr 1fr;min-height:420px;position:relative}
.launch .tx{padding:clamp(28px,5vw,64px);display:flex;flex-direction:column;justify-content:center;gap:18px;position:relative;z-index:2}
.launch h3{font-size:clamp(32px,4.6vw,60px);font-weight:600;line-height:1.15}
.launch h3 em{font-style:normal;color:var(--green)}
.launch .stores{display:flex;gap:10px;flex-wrap:wrap}
.launch .stores span{border:1px solid #3a3e41;border-radius:12px;padding:8px 16px;font-family:var(--f-display);font-size:13px;display:flex;flex-direction:column;line-height:1.3}
.launch .stores small{color:#8a8e8b;font-size:10px}
.launch .vis{position:relative;min-height:320px}
.launch .vis .map{position:absolute;inset:0;width:100%;height:100%;opacity:.95}
.launch .vis .ph{position:absolute;bottom:-30%;left:50%;transform:translateX(-50%) rotate(-6deg);width:min(240px,60%)}
@media(max-width:800px){.launch{grid-template-columns:1fr}.launch .vis{min-height:380px}}
.bb-scene{border-radius:var(--r);overflow:hidden;position:relative;aspect-ratio:16/8;min-height:300px;background:linear-gradient(to bottom,#0c1420 0%,#24303b 52%,#c58f5c 74%,#e7b47e 78%,#2d2a27 78.2%,#1c1b1a 100%)}
.bb-scene>svg.sky{position:absolute;inset:0;width:100%;height:100%}
.bb{position:absolute;left:50%;top:9%;transform:translateX(-50%);width:62%;aspect-ratio:3.2/1;background:var(--black);border:6px solid #2b2d2f;box-shadow:0 0 60px rgba(120,184,63,.18);display:flex;align-items:center;justify-content:space-between;padding:0 4%;gap:4%;font-size:clamp(8px,1.3vw,16px);color:#fff}
.bb .lg{width:26%;height:auto;flex:none}
.bb h3{font-size:2.3em;font-weight:600;line-height:1.15}
.bb h3 em{font-style:normal;color:var(--green)}
.bb p{font-size:.95em;color:#B9BDB9;margin-top:.3em}
.bb-legs{position:absolute;left:50%;transform:translateX(-50%);top:calc(9% + 62% / 3.2 * 1.6 + 2%);width:40%;height:30%;display:flex;justify-content:space-between}
.bb-legs i{width:3%;background:#2b2d2f}
@media(max-width:600px){.bb-scene{aspect-ratio:auto;height:300px}.bb{width:84%}.bb-legs{top:calc(9% + 84vw / 3.2 * .62)}}
.store{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
@media(max-width:900px){.store{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ss{aspect-ratio:1242/2688;border-radius:18px;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;padding:12% 8% 0;gap:6%;container-type:inline-size;min-width:0}
.ss h4{font-size:8.6cqw;line-height:1.2;text-align:center;font-weight:600}
.ss p{font-size:5cqw;text-align:center;opacity:.75;margin-top:-3%}
.ss .phone{width:84%;max-width:none;flex:none;box-shadow:0 20px 40px -16px rgba(0,0,0,.5)}
.ss-b{background:var(--black);color:#fff}.ss-w{background:var(--gray)}.ss-g{background:var(--green)}
.promo{border-radius:var(--r);overflow:hidden;position:relative;min-height:420px;background:linear-gradient(to bottom,#0f1b29 0%,#33302f 60%,#8a6446 82%,#191817 82.3%,#0e0e0e 100%);display:flex;flex-direction:column;justify-content:space-between;padding:clamp(24px,4vw,48px);color:#fff}
.promo .sky{position:absolute;inset:0;width:100%;height:100%}
.promo .car{position:relative;width:min(760px,100%);height:auto;margin:auto auto -2%}
.promo .tx{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.promo h3{font-size:clamp(26px,3.6vw,44px);font-weight:600;max-width:16ch}
.promo .lg{width:120px;height:auto}

/* close */
.close{background:var(--black);color:#fff;text-align:center}
.close .lg{width:min(320px,60%);height:auto;margin:0 auto}
.close p{color:#9EA29F;margin-top:24px;font-family:var(--f-display)}
.owner{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:36px;padding-top:28px;border-top:1px solid var(--line-d)}
.owner small{color:var(--green);font-family:var(--f-display);font-size:12px;letter-spacing:.08em}
.owner b{font-family:var(--f-display);font-size:22px;font-weight:600}
.owner span{color:#9EA29F;font-size:14px;font-family:var(--f-display)}
.files{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:28px}
.files code{font-size:12px;background:#1a1c1e;border:1px solid var(--line-d);border-radius:8px;padding:5px 10px;color:#C9CCC8;direction:ltr}
</style>

<div id="book" dir="rtl" data-lang="ar">
<header class="top"><div class="wrap">
  ${logo(C.white, "tl")}
  <nav aria-label="Sections">
    <a href="#essence">${T("الجوهر", "Essence")}</a><a href="#logo">${T("الشعار", "Logo")}</a><a href="#icon">${T("الأيقونة", "App icon")}</a><a href="#color">${T("الألوان", "Color")}</a><a href="#type">${T("الخطوط", "Type")}</a><a href="#pattern">${T("الأنماط", "Patterns")}</a><a href="#ui">${T("التطبيق", "App UI")}</a><a href="#fleet">${T("الأسطول", "Fleet")}</a><a href="#marketing">${T("التسويق", "Marketing")}</a>
  </nav>
  <div class="lang" role="group" aria-label="Language"><button type="button" data-l="ar" aria-pressed="true">عربي</button><button type="button" data-l="en" aria-pressed="false">EN</button></div>
</div></header>

<!-- COVER -->
<section class="cover"><div class="wrap">
  <div class="cover-meta"><span>${T("هوية العلامة التجارية · الإصدار ١٫٠", "Brand Identity · Version 1.0")}</span><span>${T("مقدَّم إلى مجلس الإدارة · نوفمبر ٢٠٢٦", "Prepared for the Board · November 2026")}</span><span>${T("صاحب الفكرة: صالح محمد الهمامي", "Concept owner: Saleh Mohammed Alhamami")}</span></div>
  <div class="cover-logo">
    <svg class="cover-route" viewBox="0 0 800 300" aria-hidden="true"><path d="M-20 290 C 120 290, 150 210, 230 210 S 330 240, 400 160" fill="none" stroke="${C.green}" stroke-width="3" stroke-linecap="round"/></svg>
    ${logo(C.white, "lg")}
  </div>
  <h1>${T("<b>أورا</b> منصة سعودية للتنقّل الذكي، بمعايير عالمية.", "<b>Aura</b> is Saudi smart mobility, built to a global standard.")}</h1>
  <p class="sub">${T("الشعار · النظام البصري · واجهات التطبيق · الأسطول · التسويق", "Logo · Visual system · App UI · Fleet · Marketing")}</p>
  <nav class="toc" aria-label="Contents">
    <a href="#essence"><i>01</i>${T("جوهر العلامة", "Brand essence")}</a><a href="#logo"><i>02</i>${T("الشعار وقواعده", "Logo & rules")}</a><a href="#icon"><i>03</i>${T("أيقونة التطبيق", "App icon")}</a><a href="#color"><i>04</i>${T("نظام الألوان", "Color system")}</a>
    <a href="#type"><i>05</i>${T("الخطوط", "Typography")}</a><a href="#pattern"><i>06</i>${T("الأنماط والعناصر", "Patterns & elements")}</a><a href="#ui"><i>07</i>${T("واجهات التطبيق", "App UI/UX")}</a><a href="#fleet"><i>08</i>${T("الأسطول والكباتن", "Fleet & captains")}</a>
  </nav>
</div></section>

<!-- 01 ESSENCE -->
<section class="ch" id="essence"><div class="wrap">
  <div class="head"><span class="no">01 — ESSENCE</span><div><h2>${T("جوهر العلامة", "Brand essence")}</h2><p>${T("«أورا» تعني الهالة: المساحة الهادئة التي تحيط بالراكب منذ أن يفتح التطبيق حتى يصل. هذه الفكرة تقود كل قرار بصري في الهوية.", "Aura means the calm space around a person. It surrounds the rider from the moment they open the app until they arrive, and it drives every visual decision in this identity.")}</p></div></div>
  <div class="grid">
    <div class="c7"><p class="thesis">${T("نحن لا ننقل الناس فقط. <b>نمنحهم مساحة من الثقة</b> تتحرك معهم في كل مشوار، <em>من الرياض إلى العالم.</em>", "We don’t just move people. <b>We give them a space of confidence</b> that travels with them on every ride, <em>from Riyadh to the world.</em>")}</p></div>
    <div class="c5" style="display:flex;flex-direction:column;justify-content:flex-end;gap:14px">
      <p class="eyebrow">${T("الوعد", "Promise")}</p><h3 style="font-size:26px">${T("تنقّل بثقة", "Move with confidence")}</h3>
      <p style="color:var(--ink-2)">${T("الشعار التسويقي المعتمد. يُكتب بالعربية أولاً، ويُستخدم بالإنجليزية في المطارات والوجهات الدولية.", "The approved tagline. Arabic leads; English is used at airports and international touchpoints.")}</p>
    </div>
  </div>
  <div class="vals">
    <div class="val">${ic("shield")}<h4>${T("الثقة والأمان", "Trust & safety")}</h4><p>${T("كباتن موثّقون، رمز تحقق لكل رحلة، ومشاركة مباشرة للمسار.", "Verified captains, a PIN on every ride, live route sharing.")}</p></div>
    <div class="val">${ic("clock")}<h4>${T("السرعة والسهولة", "Speed & ease")}</h4><p>${T("ثلاث نقرات من فتح التطبيق إلى طلب الرحلة.", "Three taps from opening the app to a booked ride.")}</p></div>
    <div class="val">${ic("route")}<h4>${T("التقنية والابتكار", "Technology")}</h4><p>${T("تسعير واضح مسبقاً، تتبع حي، ومطابقة ذكية مع أقرب كابتن.", "Upfront pricing, live tracking, smart matching to the nearest captain.")}</p></div>
    <div class="val">${ic("star")}<h4>${T("الفخامة والبساطة", "Premium simplicity")}</h4><p>${T("لونان وأخضر واحد للحركة. لا شيء زائد.", "Two colors and one green for motion. Nothing extra.")}</p></div>
    <div class="val">${ic("globe")}<h4>${T("سعودية بروح عالمية", "Saudi, globally fluent")}</h4><p>${T("عربية أولاً، ثنائية اللغة دائماً، وبجودة تنافس التطبيقات العالمية.", "Arabic first, always bilingual, built to global standards.")}</p></div>
    <div class="val">${ic("user")}<h4>${T("الإنسان في المركز", "People first")}</h4><p>${T("نسمّي السائق «كابتن» ونعامل كل رحلة كضيافة.", "Drivers are “captains”, and every ride is hospitality.")}</p></div>
  </div>
  <div class="voice">
    <div class="tile t-g"><h5>${T("نبرة الصوت: نقول", "Voice: we say")}</h5><ul><li>${T("«كابتنك في الطريق، ٤ دقائق»", "“Your captain is 4 minutes away”")}</li><li>${T("«السعر ٤٦ ريال، ولن يتغير»", "“46 SAR, and it won’t change”")}</li><li>${T("«وصلت بالسلامة»", "“You’ve arrived safely”")}</li></ul></div>
    <div class="tile t-b"><h5>${T("ونتجنب", "We avoid")}</h5><ul><li>${T("المبالغة والوعود العامة مثل «الأفضل على الإطلاق»", "Hype like “the best ever”")}</li><li>${T("المصطلحات التقنية مع الراكب", "Technical jargon with riders")}</li><li>${T("علامات التعجب المتتالية والرموز التعبيرية", "Stacked exclamation marks and emoji")}</li></ul></div>
  </div>
</div></section>

<!-- 02 LOGO -->
<section class="ch gy" id="logo"><div class="wrap">
  <div class="head"><span class="no">02 — LOGO</span><div><h2>${T("الشعار", "The logo")}</h2><p>${T("الشعار المعتمد كما هو، دون أي تعديل. حرف A المفتوح بلا خط أفقي هو توقيع العلامة: سقف يحمي الراكب، وطريق يرتفع نحو الوجهة. هذه الأشكال مأخوذة مباشرة من الملف الأصلي.", "The approved logo, unchanged. The open A without a crossbar is the signature: a roof over the rider and a road rising to the destination. These shapes are taken directly from the original artwork.")}</p></div></div>
  <div class="grid">
    <div class="tile t-w c12 stage"><span class="spec">${T("الشعار الأساسي", "Primary logo")}</span>${logo(C.black, "lg")}</div>
    <div class="tile t-b c6 stage sm"><span class="spec">${T("أبيض على أسود", "White on black")}</span>${logo(C.white, "lg")}</div>
    <div class="tile t-w c6 stage sm"><span class="spec">${T("أسود على أبيض", "Black on white")}</span>${logo(C.black, "lg")}</div>
    <div class="tile t-b c8 stage sm"><span class="spec">${T("الصيغة الثنائية اللغة", "Bilingual lockup")}</span><div class="lock-bi">${logo(C.white, "lg")}<i class="bar"></i><span class="ar">أورا</span></div></div>
    <div class="tile t-gr c4 stage sm"><span class="spec">${T("على الأخضر (حملات فقط)", "On green (campaigns only)")}</span>${logo(C.black, "lg")}</div>
  </div>

  <h3 style="font-size:24px;margin:72px 0 20px">${T("البناء والمساحة الآمنة", "Construction & clear space")}</h3>
  <div class="constr">
    <svg viewBox="-150 -110 601 306" aria-label="Clear space diagram">
      <rect x="-80" y="-61" width="461" height="208" fill="none" stroke="#B5B9B3" stroke-dasharray="4 4"/>
      <rect x="-1" y="-1" width="302" height="86.5" fill="none" stroke="${C.green}" stroke-width=".8"/>
      ${logoG(0, 0, 301, C.black)}
      <path d="M114 23.8 H300" stroke="${C.green}" stroke-width=".6" stroke-dasharray="2 2"/>
      <g font-family="Readex Pro" font-size="9" fill="#55595C">
        <path d="M-80 30 H-1" stroke="#55595C" stroke-width=".6"/><text x="-40" y="24" text-anchor="middle">X</text>
        <path d="M150 -61 V-1" stroke="#55595C" stroke-width=".6"/><text x="160" y="-28">X</text>
        <path d="M310 23.8 V85" stroke="#55595C" stroke-width=".6"/><path d="M306 23.8 H314 M306 85 H314" stroke="#55595C" stroke-width=".6"/><text x="318" y="58">X</text>
        <path d="M55 -18 L55 -6" stroke="${C.green}" stroke-width=".8"/><circle cx="55" cy="-20" r="1.6" fill="${C.green}"/>
        <text x="55" y="-26" text-anchor="middle" fill="${C.green}">${"Λ apex"}</text>
      </g>
      <text x="-80" y="178" font-family="Readex Pro" font-size="9" fill="#55595C" class="i-en">X = height of the “u” (x-height)</text><text x="381" y="178" font-family="Readex Pro" font-size="9" fill="#55595C" text-anchor="end" class="i-ar" direction="rtl">X = ارتفاع حرف u</text>
    </svg>
  </div>
  <div class="rules">
    <div class="tile t-w"><h5>${T("المساحة الآمنة", "Clear space")}</h5><p>${T("اترك حول الشعار مسافة لا تقل عن X من كل جانب، حيث X ارتفاع حرف u. لا يدخل هذه المساحة نص أو صورة أو حافة.", "Keep at least X clear on every side, where X is the height of the u. No text, image or edge enters this space.")}</p></div>
    <div class="tile t-w"><h5>${T("الحد الأدنى للحجم", "Minimum size")}</h5><p class="num">${T("رقمي: ٨٠ بكسل عرضاً. طباعة: ٢٥ ملم. تحت هذا الحجم استخدم الرمز Λ وحده (١٦ بكسل كحد أدنى).", "Digital: 80px wide. Print: 25mm. Below that, use the Λ symbol alone (16px minimum).")}</p></div>
    <div class="tile t-w"><h5>${T("الألوان المسموحة", "Allowed colors")}</h5><p>${T("أسود #101112 أو أبيض فقط. الأخضر لا يُستخدم للشعار نفسه، بل كخلفية في الحملات.", "Black #101112 or white only. Green is never the logo color; it may be a campaign background.")}</p></div>
  </div>
  <div class="donts">
    <div class="dont"><div class="bx"><span style="display:block;width:58%;transform:scaleX(1.35)">${logo(C.black, "lg")}</span></div><p>${T("لا تمطّ الشعار أو تضغطه", "Don’t stretch or squash")}</p></div>
    <div class="dont"><div class="bx"><svg class="lg" viewBox="${LOGO_VB}"><path d="${P.A}${P.ura}" fill="${C.black}" fill-rule="evenodd"/><rect x="26" y="52" width="58" height="9" fill="${C.black}"/></svg></div><p>${T("لا تضف خطاً أفقياً لحرف A", "Don’t add a crossbar to the A")}</p></div>
    <div class="dont"><div class="bx"><svg class="lg" viewBox="${LOGO_VB}"><path d="${P.A}${P.ura}" fill="none" stroke="${C.black}" stroke-width="2" fill-rule="evenodd"/></svg></div><p>${T("لا تحوّله إلى خط خارجي", "Don’t outline it")}</p></div>
    <div class="dont"><div class="bx"><span style="display:block;width:70%;transform:rotate(-12deg)">${logo(C.black, "lg")}</span></div><p>${T("لا تدوّره أو تميّله", "Don’t rotate or skew")}</p></div>
    <div class="dont"><div class="bx">${logo(C.green, "lg")}</div><p>${T("لا تلوّنه بالأخضر أو بألوان أخرى", "Don’t recolor it, green included")}</p></div>
    <div class="dont"><div class="bx" style="background:repeating-linear-gradient(45deg,#c9cdc5 0 6px,#8a8f86 6px 12px)"><span style="display:block;width:70%;filter:drop-shadow(3px 4px 2px rgba(0,0,0,.6))">${logo(C.white, "lg")}</span></div><p>${T("لا تضعه على خلفية مزدحمة أو بظل", "No busy backgrounds or shadows")}</p></div>
  </div>
</div></section>

<!-- 03 ICON -->
<section class="ch dk" id="icon"><div class="wrap">
  <div class="head"><span class="no">03 — APP ICON</span><div><h2>${T("أيقونة التطبيق", "App icon")}</h2><p>${T("الرمز Λ من الشعار، وتحته نقطة خضراء تمثّل الراكب في موقعه. الفكرة كلها في شكل واحد: الراكب داخل هالة أورا.", "The Λ from the logo with a green dot beneath it: the rider at their pickup point. The whole idea in one shape: the rider inside the Aura.")}</p></div></div>
  <div class="grid">
    <div class="tile c7" style="background:#17191b">
      <div class="icons-row">
        <figure><div style="width:clamp(120px,16vw,180px)">${appIcon()}</div><figcaption>${T("الأساسية", "Primary")}</figcaption></figure>
        <figure><div style="width:clamp(84px,10vw,120px)">${appIcon(C.white, C.black)}</div><figcaption>${T("فاتحة", "Light")}</figcaption></figure>
        <figure><div style="width:clamp(60px,7vw,80px)">${appIcon(C.green, C.black, C.white)}</div><figcaption>${T("حملات", "Campaign")}</figcaption></figure>
        <figure><div style="width:40px">${appIcon()}</div><figcaption>40</figcaption></figure>
        <figure><div style="width:24px">${appIcon()}</div><figcaption>24</figcaption></figure>
      </div>
    </div>
    <div class="c5"><div class="homescreen">
      <span><i></i>${T("الطقس", "Weather")}</span><span><i class="mut2"></i>${T("الصور", "Photos")}</span><span><i class="mut3"></i>${T("الخرائط", "Maps")}</span><span><i></i>${T("الملاحظات", "Notes")}</span>
      <span><i class="mut3"></i>${T("البنك", "Bank")}</span><span>${appIcon(C.black, C.white, C.green, 230).replace("<svg ", '<svg style="width:60px;height:60px;border-radius:14px" ')}Aura</span><span><i class="mut2"></i>${T("الكاميرا", "Camera")}</span><span><i></i>${T("الساعة", "Clock")}</span>
      <span><i class="mut2"></i>${T("البريد", "Mail")}</span><span><i></i>${T("الموسيقى", "Music")}</span><span><i class="mut3"></i>${T("المحفظة", "Wallet")}</span><span><i class="mut2"></i>${T("الإعدادات", "Settings")}</span>
    </div></div>
  </div>
</div></section>

<!-- 04 COLOR -->
<section class="ch" id="color"><div class="wrap">
  <div class="head"><span class="no">04 — COLOR</span><div><h2>${T("نظام الألوان", "Color system")}</h2><p>${T("الأسود والأبيض يحملان الهوية. الأخضر لون الحركة فقط: يظهر حين يتحرك شيء أو يمكن الضغط عليه، ولا يظهر للزينة.", "Black and white carry the identity. Green is the color of motion only: it appears where something moves or can be tapped, never as decoration.")}</p></div></div>
  <div class="grid">
    ${swatches.map((s) => `<div class="c3 sw"><div class="chip" style="background:${s.hex};color:${s.k === "black" ? "#fff" : "#101112"};${s.k === "white" ? "border-bottom:1px solid var(--line)" : ""}">${T(s.ar, s.en)}</div>
      <div class="meta"><div><span>HEX</span><b>${s.hex}</b></div><div><span>RGB</span><b>${hex2rgb(s.hex).join(" ")}</b></div><div><span>CMYK</span><b>${cmyk(s.hex)}</b></div></div>
      <p class="role">${s.role}</p></div>`).join("")}
  </div>
  <div class="prop" aria-label="Color proportion">${swatches.map((s) => `<div style="flex:${s.share};background:${s.hex};color:${s.k === "black" ? "#fff" : "#101112"}">${s.share}%</div>`).join("")}</div>
  <p class="cap">${T("نسب الاستخدام التقريبية في أي تصميم. الأخضر لا يتجاوز ١٠٪.", "Approximate share in any layout. Green never exceeds 10%.")}</p>
  <div style="overflow-x:auto;margin-top:48px"><table class="ctab num">
    <thead><tr><th>${T("المعاينة", "Preview")}</th><th>${T("التركيبة", "Pairing")}</th><th>${T("التباين", "Contrast")}</th><th>${T("الاستخدام", "Use")}</th></tr></thead>
    <tbody>
      <tr><td><span class="pv" style="background:${C.black};color:#fff">Aura</span></td><td>${T("أبيض على أسود", "White on black")}</td><td class="ltr">${contrast(C.white, C.black)}:1</td><td><span class="tag ok">${T("كل النصوص", "All text")}</span></td></tr>
      <tr><td><span class="pv" style="background:${C.gray};color:${C.black}">Aura</span></td><td>${T("أسود على رمادي", "Black on gray")}</td><td class="ltr">${contrast(C.black, C.gray)}:1</td><td><span class="tag ok">${T("كل النصوص", "All text")}</span></td></tr>
      <tr><td><span class="pv" style="background:${C.green};color:${C.black}">Aura</span></td><td>${T("أسود على أخضر", "Black on green")}</td><td class="ltr">${contrast(C.black, C.green)}:1</td><td><span class="tag ok">${T("أزرار وشارات", "Buttons, badges")}</span></td></tr>
      <tr><td><span class="pv" style="background:${C.black};color:${C.green}">Aura</span></td><td>${T("أخضر على أسود", "Green on black")}</td><td class="ltr">${contrast(C.green, C.black)}:1</td><td><span class="tag ok">${T("مؤشرات وأرقام", "Indicators, figures")}</span></td></tr>
      <tr><td><span class="pv" style="background:#fff;color:${C.green};border:1px solid var(--line)">Aura</span></td><td>${T("أخضر على أبيض", "Green on white")}</td><td class="ltr">${contrast(C.green, C.white)}:1</td><td><span class="tag lim">${T("خطوط ومسارات فقط، ليس نصاً", "Lines and routes only, never text")}</span></td></tr>
    </tbody></table></div>
</div></section>

<!-- 05 TYPE -->
<section class="ch gy" id="type"><div class="wrap">
  <div class="head"><span class="no">05 — TYPOGRAPHY</span><div><h2>${T("الخطوط", "Typography")}</h2><p>${T("عائلتان فقط. Readex Pro للعناوين والأرقام: هندسي ومفتوح ويحمل العربية واللاتينية بنفس الروح، مثل حروف الشعار. IBM Plex Sans Arabic للنصوص والواجهات: واضح في الأحجام الصغيرة.", "Two families only. Readex Pro for headlines and figures: geometric and open, with Arabic and Latin drawn in one spirit, like the logo letters. IBM Plex Sans Arabic for body and UI: clear at small sizes.")}</p></div></div>
  <div class="grid">
    <div class="tile t-b c7 spec-t"><p class="eyebrow">Display · Readex Pro</p><div class="big">أورا Aa</div><p class="glyphs">ابتثجحخدذرزسشصضطظعغفقكلمنهوي<br><span class="ltr" style="display:inline-block">ABCDEFGHIJKLM abcdefghijklm 0123456789</span></p>
      <div class="wts"><span style="font-weight:300">Light</span><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:600">SemiBold</span><span style="font-weight:700">Bold</span></div></div>
    <div class="tile t-w c5 spec-t" style="font-family:'IBM Plex Sans Arabic'"><p class="eyebrow">Text · IBM Plex Sans Arabic</p><div class="big" style="font-family:'IBM Plex Sans Arabic';font-size:clamp(56px,8vw,104px)">نص Aa</div>
      <p style="margin-top:20px;color:var(--ink-2);font-size:17px">${T("كابتنك فيصل في الطريق إليك. السيارة تويوتا كامري سوداء، رقم اللوحة ١٢٣٤ ر ح ب. شارك رحلتك مع من تحب.", "Your captain Faisal is on the way. Black Toyota Camry, plate 1234 RHB. Share your trip with someone you trust.")}</p></div>
  </div>
  <div class="scale">
    <div><small>Display · 56/64 · SemiBold</small><span style="font-family:var(--f-display);font-size:clamp(34px,5vw,56px);font-weight:600;line-height:1.15">${T("تنقّل بثقة", "Move with confidence")}</span></div>
    <div><small>H1 · 32/40 · SemiBold</small><span style="font-family:var(--f-display);font-size:32px;font-weight:600">${T("إلى أين اليوم؟", "Where to today?")}</span></div>
    <div><small>H2 · 22/30 · Medium</small><span style="font-family:var(--f-display);font-size:22px;font-weight:500">${T("اختر فئة السيارة", "Choose a ride")}</span></div>
    <div><small>Body · 16/26 · Regular</small><span style="font-size:16px">${T("السعر يظهر قبل الطلب ولا يتغير بعد التأكيد.", "The price shows before you book and stays fixed after.")}</span></div>
    <div><small>Figure · 40 · Readex</small><span style="font-family:var(--f-display);font-size:40px;font-weight:600" class="ltr num">46.00 <span style="font-size:16px;color:var(--ink-2)">SAR</span></span></div>
    <div><small>Caption · 13/18 · Regular</small><span style="font-size:13px;color:var(--ink-2)">${T("الأسعار شاملة ضريبة القيمة المضافة ١٥٪", "Prices include 15% VAT")}</span></div>
  </div>
</div></section>

<!-- 06 PATTERNS & ELEMENTS -->
<section class="ch" id="pattern"><div class="wrap">
  <div class="head"><span class="no">06 — PATTERNS</span><div><h2>${T("الأنماط والعناصر الرسومية", "Patterns & graphic elements")}</h2><p>${T("كل نمط مبني من حرف A نفسه أو من زاوية ساقه (٥٨°). العناصر الرسومية مأخوذة من لغة الخريطة: نقطة الانطلاق دائرة، والوجهة مربع، والمسار خط أخضر.", "Every pattern is built from the A itself or from the angle of its leg (58°). Graphic elements come from map language: pickup is a circle, destination a square, the route a green line.")}</p></div></div>
  <div class="grid">
    <figure class="c4"><div class="tile pat">${patChevron(C.black, "#1f2225")}</div><figcaption class="cap">${T("حقل Λ: خلفية للتغليف والزي والمطبوعات", "Λ field: packaging, uniform, print")}</figcaption></figure>
    <figure class="c4"><div class="tile pat">${patRings()}</div><figcaption class="cap">${T("الهالة: Λ متتالية حول الراكب، للحملات والشاشات", "The aura: nested Λ around the rider, for campaigns")}</figcaption></figure>
    <figure class="c4"><div class="tile pat">${patHatch()}</div><figcaption class="cap">${T("خطوط ٥٨° مع مسار: للخرائط التوضيحية", "58° lines with a route: for map illustrations")}</figcaption></figure>
  </div>
  <div class="grid" style="margin-top:20px">
    <div class="tile t-g c4 el"><p class="eyebrow">${T("علامات الخريطة", "Map markers")}</p>
      <svg viewBox="0 0 300 120" aria-hidden="true">
        <g transform="translate(50 50)"><circle r="20" fill="${C.white}"/><circle r="11" fill="${C.black}"/></g>
        <g transform="translate(150 50)"><rect x="-17" y="-17" width="34" height="34" rx="7" fill="${C.black}"/>${symG(-9, -8.5, 17, C.white)}</g>
        <g transform="translate(250 44)"><path d="M0 34 L0 20" stroke="${C.black}" stroke-width="3" stroke-linecap="round"/><circle r="20" fill="${C.black}"/>${symG(-8, -7.5, 14, C.white)}</g>
        <g font-family="Readex Pro" font-size="11" fill="#55595C" text-anchor="middle"><text x="50" y="106" class="i-ar">الانطلاق</text><text x="150" y="106" class="i-ar">الوجهة</text><text x="250" y="106" class="i-ar">دبوس أورا</text><text x="50" y="106" class="i-en">Pickup</text><text x="150" y="106" class="i-en">Destination</text><text x="250" y="106" class="i-en">Aura pin</text></g>
      </svg></div>
    <div class="tile t-b c4 el"><p class="eyebrow">${T("المسار", "Route line")}</p>
      <svg viewBox="0 0 300 120" aria-hidden="true"><path d="M20 96 H110 Q130 96 130 76 V44 Q130 24 150 24 H280" fill="none" stroke="${C.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="96" r="10" fill="${C.white}"/><circle cx="20" cy="96" r="5" fill="${C.black}"/><rect x="268" y="12" width="24" height="24" rx="5" fill="${C.white}"/>${symG(274, 18, 12, C.black)}</svg>
      <p style="font-size:13px;color:#A9ADAA">${T("سماكة ثابتة، زوايا مستديرة بنصف قطر ٢٠، ونهايات مستديرة.", "Constant weight, 20-radius corners, round caps.")}</p></div>
    <div class="tile t-w c4 el"><p class="eyebrow">${T("نبض البحث", "Search pulse")}</p>
      <svg viewBox="0 0 300 120" aria-hidden="true">${[54, 38, 22].map((r, i) => `<circle cx="150" cy="60" r="${r}" fill="${C.green}" opacity="${[0.1, 0.18, 0.3][i]}"/>`).join("")}<circle cx="150" cy="60" r="9" fill="${C.white}"/><circle cx="150" cy="60" r="6" fill="${C.black}"/></svg>
      <p style="font-size:13px;color:var(--ink-2)">${T("الهالة الخضراء تتنفس حول الراكب أثناء البحث عن كابتن.", "A green aura breathes around the rider while matching.")}</p></div>
  </div>
  <h3 style="font-size:20px;margin:56px 0 18px">${T("الأيقونات", "Iconography")}</h3>
  <div class="iconset">${[["pin", "موقع", "Location"], ["route", "مسار", "Route"], ["car", "سيارة", "Car"], ["clock", "وقت", "Time"], ["shield", "أمان", "Safety"], ["card", "دفع", "Payment"], ["star", "تقييم", "Rating"], ["user", "حساب", "Account"], ["home", "المنزل", "Home"], ["work", "العمل", "Work"], ["phone", "اتصال", "Call"], ["chat", "رسالة", "Message"], ["share", "مشاركة", "Share"], ["gift", "عروض", "Offers"], ["bell", "إشعار", "Alerts"], ["globe", "اللغة", "Language"]].map(([n, a, e]) => `<div>${ic(n)}${T(a, e)}</div>`).join("")}</div>
  <p class="cap">${T("خط واحد بسماكة ١٫٨، زوايا مستديرة، شبكة ٢٤ بكسل. لا أيقونات مصمتة إلا للتقييم.", "Single 1.8 stroke, round joins, 24px grid. Filled icons only for ratings.")}</p>
</div></section>

<!-- 07 UI -->
<section class="ch gy" id="ui"><div class="wrap">
  <div class="head"><span class="no">07 — APP UI/UX</span><div><h2>${T("واجهات التطبيق", "App interface")}</h2><p>${T("رحلة كاملة في ١٢ شاشة، عربية من اليمين لليسار. اضغط «EN» في الأعلى لترى الواجهات نفسها بالإنجليزية من اليسار لليمين. الخريطة تأخذ أكبر مساحة، والقرار التالي دائماً في زر أسود واحد أسفل الشاشة.", "A complete trip in 12 screens, Arabic right-to-left. Tap “عربي” above to see the same screens in Arabic RTL. The map gets the most room, and the next decision is always one black button at the bottom.")}</p></div></div>
  <div class="screens">${[S.splash, S.login, S.signup, S.home, S.pickup, S.dest, S.cats, S.fare, S.search, S.track, S.rate, S.profile].join("")}</div>
  <div class="ux-notes">
    <div><h5>${T("ثلاث نقرات", "Three taps")}</h5><p>${T("إلى أين ← اختيار الفئة ← تأكيد. الموقع الحالي يُحدد تلقائياً.", "Where to → class → confirm. Pickup is detected automatically.")}</p></div>
    <div><h5>${T("السعر أولاً", "Price first")}</h5><p>${T("السعر النهائي يظهر قبل الطلب، مع تفصيل كامل يشمل الضريبة.", "The final fare shows before booking, broken down including VAT.")}</p></div>
    <div><h5>${T("الأمان ظاهر", "Safety in view")}</h5><p>${T("زر الأمان ورمز التحقق ولوحة السيارة ظاهرة طوال الرحلة.", "Safety button, ride PIN and plate stay visible the whole trip.")}</p></div>
    <div><h5>${T("ثنائي اللغة", "Bilingual")}</h5><p>${T("الواجهة تنقلب بالكامل بين RTL وLTR، والأرقام والأسعار تبقى من اليسار لليمين.", "The layout mirrors fully between RTL and LTR; figures and prices stay LTR.")}</p></div>
  </div>
</div></section>

<!-- 08 FLEET -->
<section class="ch" id="fleet"><div class="wrap">
  <div class="head"><span class="no">08 — FLEET</span><div><h2>${T("الأسطول والكباتن", "Fleet & captains")}</h2><p>${T("علامة واحدة على الباب الخلفي، وخط أخضر رفيع على العتبة، وشعار على الزجاج الخلفي. السيارة تبقى أنيقة وتُعرف من بعيد.", "One mark on the rear door, a thin green line on the sill, and a logo on the rear glass. The car stays elegant and is recognizable from a distance.")}</p></div></div>
  <div class="grid">
    <div class="c12 fleet-stage fs-dark">${carSide(C.black, 640, { decal: true, decalFill: C.white, stripe: true })}<div class="fs-label"><span>Aura Black · ${T("سيدان سوداء", "Black sedan")}</span><span>${T("ملصق الباب: أبيض مطفي ٤٢ سم · خط العتبة: أخضر ٨ ملم", "Door decal: matte white 42cm · Sill line: green 8mm")}</span></div></div>
    <div class="c12 fleet-stage fs-light">${carSide("#F7F8F6", 640, { decal: true, decalFill: C.black, stripe: true, glass: "#22262a" })}<div class="fs-label"><span>Aura Go / Comfort · ${T("سيدان بيضاء", "White sedan")}</span><span>${T("ملصق الباب: أسود مطفي ٤٢ سم", "Door decal: matte black 42cm")}</span></div></div>
  </div>
  <div class="grid" style="margin-top:20px">
    <figure class="c4"><div class="tile t-g detail">${carRear(C.black)}</div><figcaption class="cap">${T("الزجاج الخلفي: شعار أبيض بعرض ٣٠ سم", "Rear glass: white logo, 30cm wide")}</figcaption></figure>
    <figure class="c4"><div class="tile t-g detail"><svg viewBox="0 0 300 300" aria-hidden="true"><rect width="300" height="300" fill="#F7F8F6"/><path d="M0 0 H300 V300 H0Z" fill="#F7F8F6"/><path d="M40 120 H290" stroke="#d9dcd6" stroke-width="2"/><rect x="236" y="150" width="34" height="8" rx="4" fill="#cfd3cc"/>${logoG(40, 160, 180, C.black)}<path d="M0 270 H300" stroke="${C.green}" stroke-width="6"/><text x="40" y="236" font-family="Readex Pro" font-size="13" fill="#55595C" class="i-ar">أورا · تنقّل بثقة</text><text x="40" y="236" font-family="Readex Pro" font-size="13" fill="#55595C" class="i-en">Move with confidence</text></svg></div><figcaption class="cap">${T("ملصق الباب عن قرب، مع الخط الأخضر", "Door decal close-up with the green line")}</figcaption></figure>
    <figure class="c4"><div class="tile t-g detail">${polo()}</div><figcaption class="cap">${T("زي الكابتن: بولو أسود، ياقة بحافة خضراء، شعار أبيض مطرّز", "Captain uniform: black polo, green-tipped collar, embroidered white logo")}</figcaption></figure>
  </div>
  <div class="grid" style="margin-top:20px">
    <div class="c12 tile t-g" style="padding:clamp(24px,5vw,56px)">
      <div class="idcard">
        <div class="pt">${patChevron(C.black, "#ffffff").replace(/id="pc101112"/, 'id="pcid"').replace(/url\(#pc101112\)/, "url(#pcid)")}</div>
        <div class="hd">${logo(C.white)}<span>${T("بطاقة كابتن", "CAPTAIN ID")}</span></div>
        <div class="photo"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="9" r="5"/><path d="M2 24c1-6 5-9 10-9s9 3 10 9z"/></svg></div>
        <div class="info"><b>${T("فيصل العتيبي", "Faisal Alotaibi")}</b><small>${T("كابتن Aura Black", "Aura Black Captain")}</small>
          <div class="kv num"><span>${T("رقم الكابتن", "Captain no.")}</span><b style="font-size:1em" class="ltr">AR-204718</b><span>${T("التقييم", "Rating")}</span><b style="font-size:1em">4.96 ★</b><span>${T("المركبة", "Vehicle")}</span><b style="font-size:1em">${T("كامري ٢٠٢٦", "Camry 2026")}</b></div></div>
        <div class="ft2"><span class="vf">${ic("shield")}${T("موثّق · صالحة حتى ١١/٢٠٢٧", "Verified · valid to 11/2027")}</span>${pseudoQR()}</div>
      </div>
      <p class="cap" style="text-align:center">${T("بطاقة تعريف الكابتن، مقاس CR80. رمز QR للتحقق من هوية الكابتن عبر التطبيق.", "Captain ID card, CR80 size. The QR verifies the captain in the app.")}</p>
    </div>
  </div>
</div></section>

<!-- 09 MARKETING -->
<section class="ch gy" id="marketing"><div class="wrap">
  <div class="head"><span class="no">09 — MARKETING</span><div><h2>${T("المواد التسويقية", "Marketing")}</h2><p>${T("نفس القاعدة في كل مكان: مساحة سوداء أو بيضاء واسعة، عنوان قصير، وأخضر واحد يشير إلى الحركة.", "The same rule everywhere: generous black or white space, a short headline, and one green that points to motion.")}</p></div></div>

  <p class="eyebrow" style="margin-bottom:14px">${T("بطاقة العمل · ٨٥ × ٥٥ ملم", "Business card · 85 × 55 mm")}</p>
  <div class="cards-stage">
    <div class="bcard bc-f">${logo(C.white, "lg")}${sym(C.green, "gl")}</div>
    <div class="bcard bc-b">${sym(C.black, "sy")}<div><b>${T("صالح محمد الهمامي", "Saleh Mohammed Alhamami")}</b><span class="rl">${T("صاحب الفكرة والمؤسس", "Founder & Concept Owner")}</span></div>
      <div class="ct"><span>+966 56 782 5999</span><span>boss.alhamami@gmail.com</span><span>aura.sa</span></div><i class="ln"></i></div>
  </div>

  <p class="eyebrow" style="margin:56px 0 14px">${T("منشورات التواصل الاجتماعي · ١:١", "Social posts · 1:1")}</p>
  <div class="grid">
    <div class="c4 post t-b"><div class="bg">${patRings()}</div>${logo(C.white, "lg")}<div><h3>${T("أورا وصلت<br>الرياض.", "Aura has<br>arrived.")}</h3><p style="color:#B9BDB9;margin-top:8px">${T("حمّل التطبيق الآن", "Download the app now")}</p></div></div>
    <div class="c4 post t-gr">${logo(C.black, "lg")}<div><h3>${T("أول رحلة<br>بنصف السعر", "Your first ride<br>at half price")}</h3><p style="margin:10px 0 12px">${T("استخدم الرمز", "Use code")}</p><span class="code">AURA50</span></div></div>
    <div class="c4 post t-w" style="overflow:hidden">${logo(C.black, "lg")}<div style="max-width:55%"><h3 style="font-size:1.7em">${T("تابع كابتنك لحظة بلحظة", "Follow your captain, live")}</h3><p style="color:var(--ink-2);margin-top:8px">${T("وشارك رحلتك مع من تحب.", "And share your trip.")}</p></div><div class="ph-sm">${S.track.replace(/<figcaption>.*?<\/figcaption>/, "")}</div></div>
  </div>

  <p class="eyebrow" style="margin:56px 0 14px">${T("إعلان الإطلاق · رقمي", "Launch ad · digital")}</p>
  <div class="launch">
    <div class="tx">${logo(C.white, "lg")}<h3>${T("مشوارك القادم<br><em>بثقة أكبر.</em>", "Your next ride,<br><em>with more confidence.</em>")}</h3>
      <p style="color:#A9ADAA;max-width:40ch">${T("أسعار واضحة قبل الطلب، كباتن موثّقون، وتتبع مباشر. متوفر الآن في الرياض وجدة والدمام.", "Clear prices before you book, verified captains, live tracking. Now in Riyadh, Jeddah and Dammam.")}</p>
      <div class="stores"><span><small>Download on the</small>App Store</span><span><small>GET IT ON</small>Google Play</span><span><small>EXPLORE IT ON</small>AppGallery</span></div></div>
    <div class="vis">${map({ dark: true, route: "M40 600 L112 520 L112 187 L210 187 L260 90", pickup: [40, 600], drop: [260, 90], cars: [[112, 330, 0], [180, 187, 90]], labels: false })}<div class="ph">${S.cats.replace(/<figcaption>.*?<\/figcaption>/, "")}</div></div>
  </div>

  <p class="eyebrow" style="margin:56px 0 14px">${T("لوحة إعلانية · طريق الملك فهد", "Billboard · King Fahd Road")}</p>
  <div class="bb-scene">
    <svg class="sky" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 197) % 1200}" cy="${(i * 53) % 220}" r="${i % 3 ? 0.8 : 1.4}" fill="#fff" opacity=".5"/>`).join("")}
      <g fill="#0a0d11">
        <path d="M80 470 V330 H130 V470Z M150 470 V380 H200 V470Z M880 470 V360 H930 V470Z M960 470 V300 H1000 V470Z M1030 470 V390 H1090 V470Z M230 470 V400 H280 V470Z"/>
        <path d="M760 470 L770 170 Q800 120 830 170 L840 470 H812 L808 260 Q800 230 792 260 L788 470Z"/>
        <path d="M330 470 V250 L350 210 L370 250 V470Z"/>
      </g>
      <rect x="0" y="468" width="1200" height="132" fill="#1c1b1a"/>
      <path d="M0 540 H1200" stroke="#3a3836" stroke-width="3" stroke-dasharray="40 30"/>
      ${[[160, 520], [520, 560], [960, 515]].map(([x, y]) => `<g opacity=".8"><rect x="${x}" y="${y}" width="90" height="22" rx="8" fill="#0d0e0f"/><circle cx="${x + 86}" cy="${y + 8}" r="3" fill="#fff8e0"/></g>`).join("")}
    </svg>
    <div class="bb-legs"><i></i><i></i></div>
    <div class="bb">${logo(C.white, "lg")}<div><h3>${T("الرياض تتحرك<br><em>بثقة.</em>", "Riyadh moves<br><em>with confidence.</em>")}</h3><p>${T("حمّل أورا · أول رحلة بنصف السعر", "Get Aura · first ride half price")}</p></div></div>
  </div>

  <p class="eyebrow" style="margin:56px 0 14px">${T("صور متجر التطبيقات · ٦٫٧ إنش", "App Store screenshots · 6.7 inch")}</p>
  <div class="store">
    <div class="ss ss-b"><h4>${T("مشوارك بثلاث نقرات", "Ride in three taps")}</h4><p>${T("حدد وجهتك واطلب فوراً", "Set where, book instantly")}</p>${S.home.replace(/<\/?figure[^>]*>|<figcaption>.*?<\/figcaption>/g, "")}</div>
    <div class="ss ss-w"><h4>${T("السعر واضح قبل الطلب", "Know the price upfront")}</h4><p>${T("بدون مفاجآت", "No surprises")}</p>${S.cats.replace(/<\/?figure[^>]*>|<figcaption>.*?<\/figcaption>/g, "")}</div>
    <div class="ss ss-g"><h4>${T("تتبع كابتنك مباشرة", "Track your captain live")}</h4><p>${T("وشارك رحلتك", "And share your trip")}</p>${S.track.replace(/<\/?figure[^>]*>|<figcaption>.*?<\/figcaption>/g, "")}</div>
    <div class="ss ss-b"><h4>${T("أمانك أولاً", "Your safety first")}</h4><p>${T("كباتن موثّقون ورمز لكل رحلة", "Verified captains, a PIN per ride")}</p>${S.search.replace(/<\/?figure[^>]*>|<figcaption>.*?<\/figcaption>/g, "")}</div>
  </div>

  <p class="eyebrow" style="margin:56px 0 14px">${T("صورة ترويجية للمركبات", "Vehicle promo")}</p>
  <div class="promo">
    <svg class="sky" viewBox="0 0 1200 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="#0b1119" opacity=".9"><path d="M60 410 V260 H120 V410Z M140 410 V300 H210 V410Z M980 410 V280 H1030 V410Z M1050 410 V330 H1130 V410Z"/><path d="M880 410 L888 160 Q912 120 936 160 L944 410 H922 L918 230 Q912 210 906 230 L902 410Z"/></g></svg>
    <div class="tx"><h3>${T("فخامة هادئة،<br>في كل مشوار.", "Quiet luxury,<br>on every ride.")}</h3>${logo(C.white, "lg")}</div>
    ${carSide(C.black, 760, { decal: true, decalFill: C.white, stripe: true })}
  </div>
</div></section>

<section class="ch close"><div class="wrap">
  ${logo(C.white, "lg")}
  <p>${T("تنقّل بثقة · الإصدار ١٫٠ · نوفمبر ٢٠٢٦", "Move with confidence · Version 1.0 · November 2026")}</p>
  <div class="owner"><small>${T("صاحب الفكرة", "Concept owner")}</small><b>${T("صالح محمد الهمامي", "Saleh Mohammed Alhamami")}</b><span class="ltr">0567825999 · boss.alhamami@gmail.com</span></div>
  <div class="files"><code>aura-logo-black.svg</code><code>aura-logo-white.svg</code><code>aura-logo-on-black.svg</code><code>aura-logo-on-white.svg</code><code>aura-symbol-black.svg</code><code>aura-symbol-white.svg</code><code>aura-app-icon.svg</code><code>aura-app-icon-light.svg</code></div>
  <p style="font-size:13px;margin-top:14px">${T("ملفات الشعار المتجهة في مجلد brand/aura في المستودع.", "Vector logo files are in the repository under brand/aura.")}</p>
</div></section>
</div>

<script>
(function(){
  var book=document.getElementById('book');
  var btns=document.querySelectorAll('.lang button');
  function set(l){
    book.setAttribute('data-lang',l);
    book.setAttribute('dir',l==='ar'?'rtl':'ltr');
    book.setAttribute('lang',l);
    btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.l===l))});
    try{localStorage.setItem('aura-lang',l)}catch(e){}
  }
  btns.forEach(function(b){b.addEventListener('click',function(){set(b.dataset.l)})});
  var saved=null;try{saved=localStorage.getItem('aura-lang')}catch(e){}
  if(saved==='en'||saved==='ar')set(saved);
})();
</script>
`;

writeFileSync(join(out, "brand-book.html"), html);
console.log("wrote brand-book.html", (html.length / 1024).toFixed(0) + "KB");
