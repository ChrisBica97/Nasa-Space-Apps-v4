/* js/core/engine.js — Motor fisiológico: evalúa parámetros, estados y alertas. */
"use strict";

/* ---------- PhysiologyEngine ---------- */
const Engine = {
  ev(z, c = C(), cid = S.crew) {
    const rec = Store.get(cid, S.day),
          rows = z.p.map(p => {
            const k = z.id + "." + p.id,
                  real = !!(rec && rec.v && rec.v[k] != null),
                  v = real ? rec.v[k] : p.v(c);
            return { p, v, real, s: stat(p, v), sv: sev(p, v) };
          });
    return { rows, st: rows.length ? Math.max(...rows.map(r => r.s)) : 3, real: rows.some(r => r.real) };
  },
  alerts(cr = crewOf()) {
    const o = [];
    ZONES.forEach(z => this.ev(z, C(S.day, cr), cr.id).rows.forEach(r => { if (r.s > 0) o.push({ z, r }); }));
    return o;
  },
  summary(cr) {
    const n = [0, 0, 0];
    ZONES.forEach(z => { const s = this.ev(z, C(S.day, cr), cr.id).st; if (s < 3) n[s]++; });
    return { n, w: n[2] ? 2 : n[1] ? 1 : 0 };
  },
  cross(al) {
    const g = id => al.find(a => a.z.id + "." + a.r.p.id === id),
          m = [];
    if (g("sueno.sq") && g("cognicion.cog")) m.push("Deterioro cognitivo por déficit de sueño: siesta estratégica de 25 min y luz azul enriquecida antes de reevaluar.");
    if (g("reaccion.rt")) m.push("Fatiga neuroconductual: reevaluar o descansar 20 min antes de autorizar tareas de precisión; EVA sin habilitar si el puntaje es 4 o menos.");
    if (g("cognicion.lat") && (g("cognicion.lap") || g("esfuerzo.co2"))) m.push("Posible hipercapnia de cabina: revisar los depuradores de CO₂ antes de atribuirlo a fatiga del tripulante.");
    return m;
  },
  gam(cr = crewOf()) {
    const days = Store.days(cr.id);
    let xp = 0, tests = 0, cog = 0, rs = 0;
    Object.values(days).forEach(r => {
      xp += Object.keys(r.v || {}).length * 5 + Object.keys(r.t || {}).length * 20;
      tests += Object.keys(r.t || {}).length;
      cog = Math.max(cog, (r.v || {})["cognicion.cog"] || 0);
      rs = Math.max(rs, (r.v || {})["reaccion.rs"] || 0);
    });
    let st = 0;
    for (let d = S.day; d >= 0 && days[d]; d--) st++;
    const b = [
      ["🚀", "Primer registro", xp > 0],
      ["🔥", "Racha de 3 días", st >= 3],
      ["🧠", "Cerebro de acero (≥ 85)", cog >= 85],
      ["⚡", "Reflejos (≥ 8)", rs >= 8],
      ["🏅", "5 pruebas completadas", tests >= 5]
    ];
    return { xp, lv: Math.floor(xp / 100) + 1, pct: xp % 100, st, b };
  }
};
