(function () {
  // Cada laje tem pontos próprios na lateral, na quina e na frente.
  var lajes = [[132, 80, 95], [168, 116, 133], [202, 151, 169], [237, 190, 206], [271, 233, 243], [306, 268, 279], [341, 304, 316], [375, 341, 352], [409, 377, 388], [443, 413, 424], [478, 450, 460], [512, 486, 496], [545, 524, 533], [577, 560, 568], [610, 598, 604], [644, 635, 640], [676, 672, 676], [711, 708, 711], [745, 743, 745], [780, 778, 780]];
  var N = lajes.length - 1;
  var SOLD = [2,5,9,13,17], RES = [8,14,19];
  // Pontos na planta de 1448 × 1086, em coordenadas da imagem.
  var PW = 1448, PH = 1086;
  var ROOMS = [
    { n: "Living e jantar", x: 860, y: 558, photo: "assets/living.webp" },
    { n: "Cozinha com ilha", x: 1052, y: 330, photo: "assets/cozinha.webp" },
    { n: "Suíte master", x: 215, y: 600, photo: "assets/suite-master.webp" },
    { n: "Banho master", x: 145, y: 350, photo: "assets/banho.webp" },
    { n: "Suíte 2", x: 468, y: 345, photo: "assets/suite-2.webp" },
    { n: "Suíte 3", x: 681, y: 305, photo: "assets/suite-3.webp" },
    { n: "Home office", x: 825, y: 320, photo: "assets/escritorio.webp" },
    { n: "Varanda gourmet", x: 960, y: 745, photo: "assets/varanda.webp" }
  ];
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (id) { return document.getElementById(id); };
  var g = $("floors"), card = $("card"), fs = $("fsvg"), body = document.body;
  var mobile = matchMedia("(hover:none),(max-width:700px)");
  var touch = matchMedia("(hover:none)");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var active = 0, lastFloor = 0, busy = false, cur = 0;
  var zoomTimer = 0, roomTimer = 0, roomReturn = null, fromGallery = false;

  function info(f) {
    var cob = f === N;
    var st = SOLD.indexOf(f) > -1 ? "vendido" : RES.indexOf(f) > -1 ? "reservado" : "disponível";
    var price = cob ? 14.8 : 9.2 + f * 0.12;
    return { f: f, cob: cob, st: st, label: cob ? "Cobertura" : f + "º",
      apt: cob ? "Cobertura" : "Apartamento " + (f * 10 + 1),
      area: cob ? 310 : 248, suites: cob ? 4 : 3, vagas: cob ? 5 : 4,
      price: "R$ " + price.toFixed(1).replace(".", ",") + " mi" };
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function contorno(i) {
    var topo = lajes[i], base = lajes[i + 1];
    var vertices = [[678, topo[0]], [710, topo[1]], [970, topo[2]],
      [970, base[2]], [710, base[1]], [678, base[0]]];
    return vertices.map(function (p) { return p.join(","); }).join(" ");
  }
  function build() {
    for (var i = 0; i < N; i++) {
      var f = N - i, d = info(f), p = document.createElementNS(NS, "polygon");
      p.setAttribute("points", contorno(i));
      p.setAttribute("class", "floor" + (d.st === "vendido" ? " sold" : ""));
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", d.label + " andar, " + d.st);
      p.setAttribute("aria-disabled", d.st === "vendido");
      p.dataset.f = f;
      g.appendChild(p);
    }
  }

  function show(p) {
    var d = info(+p.dataset.f);
    var o = g.querySelector(".act"); if (o) o.classList.remove("act");
    p.classList.add("act"); active = lastFloor = d.f;
    $("recorte-luz").setAttribute("points", p.getAttribute("points"));
    $("luz").classList.add("acesa");
    $("cs").textContent = cap(d.st); $("cs").className = "badge " + d.st;
    $("cn").textContent = d.label;
    $("ct").textContent = (d.cob ? "Cobertura · " : "Tipo · ") + d.suites + " suítes · " + d.area + " m²";
    $("cp").textContent = d.price;
    $("cc").textContent = d.st === "vendido" ? "Unidade vendida" : (touch.matches ? "Toque aqui para ver a planta" : "Clique para ver a planta");
    card.classList.add("on");
    if (mobile.matches) return;
    var r = p.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
    var left = Math.min(r.right + 30, innerWidth - w - 24), cy = r.top + r.height / 2;
    card.style.left = left + "px";
    card.style.top = Math.max(84, Math.min(cy - h / 2, innerHeight - h - 60)) + "px";

  }
  function hide() {
    if (busy) return;
    card.classList.remove("on"); $("luz").classList.remove("acesa");
    var o = g.querySelector(".act"); if (o) o.classList.remove("act");
    active = 0;
  }

  // 1) zoom no andar escolhido, 2) abre o projeto
  function pick(f) {
    if (!Number.isInteger(f) || f < 1 || f > N || busy) return;
    var d = info(f); if (d.st === "vendido") return;
    var p = g.querySelector('[data-f="' + f + '"]');
    if (reduce) { open(f); return; }
    busy = true; show(p);
    body.classList.add("travado");
    var r = p.getBoundingClientRect(), quadro = fs.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var k = Math.min(6, Math.max(2.2, innerWidth * 0.72 / r.width));
    fs.style.transformOrigin = (cx - quadro.left) + "px " + (cy - quadro.top) + "px";
    fs.style.transform = "translate(" + (innerWidth / 2 - cx) + "px," + (innerHeight / 2 - cy) + "px) scale(" + k + ")";
    body.classList.add("zooming");
    zoomTimer = setTimeout(function () { open(f); }, 1170);
  }
  function open(f) {
    var d = info(f); lastFloor = f;
    $("pa").textContent = d.cob ? "Cobertura" : d.label + " andar";
    $("ps").textContent = cap(d.st); $("ps").className = "badge " + d.st;
    $("pt").textContent = d.apt;
    $("pm").textContent = d.area + " m²"; $("pq").textContent = d.suites; $("pv").textContent = d.vagas;
    $("pp").textContent = d.price;
    busy = false;
    $("plan-desc").textContent = d.cob
      ? "Explore os ambientes do apartamento tipo. A planta específica da cobertura depende da apresentação comercial."
      : "Um apartamento por andar. Selecione um ponto branco para visitar o ambiente.";
    $("plano").scrollTop = 0;
    body.classList.add("v-plano", "travado");
    $("site").inert = true;
    card.classList.remove("on");
    $("back").focus({ preventScroll: true });
  }
  function close() {
    clearTimeout(zoomTimer);
    clearTimeout(roomTimer);
    clearTimeout(swap);
    busy = false;
    fromGallery = false;
    $("site").inert = false;
    $("plano").inert = false;
    body.classList.remove("v-room", "v-plano", "zooming", "pzoom", "travado");
    fs.style.transform = ""; pw.style.transform = "";
    hide();
    var p = lastFloor && g.querySelector('[data-f="' + lastFloor + '"]');
    if (p) p.focus({ preventScroll: true });
  }

  // planta: pontos e lista de ambientes
  var pw = $("pw"), list = $("rooms"), hs = [];
  ROOMS.forEach(function (r, i) {
    var b = document.createElement("button");
    b.className = "hs"; b.style.left = (r.x / PW * 100) + "%"; b.style.top = (r.y / PH * 100) + "%";
    b.setAttribute("aria-label", "Ver " + r.n);
    var s = document.createElement("span"); s.textContent = r.n; b.appendChild(s);
    b.addEventListener("click", function () { roomPick(i); });
    pw.appendChild(b); hs.push(b);
    var li = document.createElement("li"), lb = document.createElement("button");
    lb.innerHTML = "<span></span><i>Ver ambiente</i>"; lb.firstChild.textContent = r.n;
    lb.addEventListener("click", function () { roomPick(i); });
    li.appendChild(lb); list.appendChild(li);
  });

  function roomPick(i) {
    if (busy) return;
    roomReturn = document.activeElement;
    if (pw.getBoundingClientRect().bottom < 90) $("plano").scrollTop = 0;
    var preview = new Image();
    preview.src = ROOMS[i].photo;
    if (reduce) { showRoom(i); return; }
    busy = true;
    var r = hs[i].getBoundingClientRect(), pr = pw.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    pw.style.transformOrigin = (cx - pr.left) + "px " + (cy - pr.top) + "px";
    pw.style.transform = "translate(" + (innerWidth / 2 - cx) + "px," + (innerHeight / 2 - cy) + "px) scale(3.4)";
    body.classList.add("pzoom");
    roomTimer = setTimeout(function () { busy = false; showRoom(i); }, 820);
  }
  var swap = 0;
  function showRoom(i) {
    var first = !body.classList.contains("v-room");
    cur = (i + ROOMS.length) % ROOMS.length;
    var r = ROOMS[cur], ph = $("rphoto");
    $("rback").textContent = fromGallery ? "Voltar à galeria" : "Voltar à planta";
    $("rn").textContent = r.n; $("rc").textContent = "Ambiente " + (cur + 1) + " de " + ROOMS.length;
    ph.alt = r.n; clearTimeout(swap);
    if (first) { ph.src = r.photo; ph.style.opacity = 1; }
    else { ph.style.opacity = 0; swap = setTimeout(function () { ph.src = r.photo; ph.style.opacity = 1; }, 250); }
    body.classList.add("v-room", "travado");
    $("plano").inert = true;
    $("site").inert = true;
    $("rback").focus({ preventScroll: true });
  }
  function closeRoom() {
    clearTimeout(roomTimer);
    clearTimeout(swap);
    busy = false;
    body.classList.remove("v-room", "pzoom");
    $("plano").inert = false;
    pw.style.transform = "";
    if (fromGallery) {
      body.classList.remove("travado");
      $("site").inert = false;
      fromGallery = false;
    }
    if (roomReturn) roomReturn.focus({preventScroll:true});
    roomReturn = null;
  }

  g.addEventListener("pointerover", function (e) {
    if (busy || e.pointerType === "touch") return;
    var p = e.target.closest(".floor"); if (p) show(p);
  });
  g.addEventListener("pointerleave", function (e) { if (e.pointerType !== "touch") hide(); });
  g.addEventListener("focusin", function (e) { if (busy) return; var p = e.target.closest(".floor"); if (p) show(p); });
  g.addEventListener("focusout", hide);
  g.addEventListener("click", function (e) {
    var p = e.target.closest(".floor"); if (!p || busy) return;
    var f = +p.dataset.f;
    if (touch.matches && active !== f) { show(p); return; }
    pick(f);
  });
  g.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(+e.target.dataset.f); }
  });
  card.addEventListener("click", function () { if (active) pick(active); });
  $("back").addEventListener("click", close);
  $("rback").addEventListener("click", closeRoom);
  $("rprev").addEventListener("click", function () { showRoom(cur - 1); });
  $("rnext").addEventListener("click", function () { showRoom(cur + 1); });
  addEventListener("keydown", function (e) {
    var inRoom = body.classList.contains("v-room");
    if (e.key === "Escape") {
      if (inRoom || body.classList.contains("pzoom")) closeRoom();
      else if (body.classList.contains("v-plano") || busy) close();
    }
    else if (inRoom && e.key === "ArrowRight") showRoom(cur + 1);
    else if (inRoom && e.key === "ArrowLeft") showRoom(cur - 1);
  });
  document.querySelectorAll("[data-go]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (body.classList.contains("v-room")) closeRoom();
      if (body.classList.contains("v-plano") || busy) close();
      open(button.dataset.go === "cobertura" ? N : 12);
    });
  });
  document.querySelectorAll('a[href="#fachada"], a[href="#empreendimento"], a[href="#agendar"]').forEach(function (link) {
    link.addEventListener("click", function () {
      if (body.classList.contains("v-room")) closeRoom();
      if (body.classList.contains("v-plano") || busy) close();
    });
  });
  document.querySelectorAll("[data-room]").forEach(function (button) {
    button.addEventListener("click", function () {
      fromGallery = true;
      roomReturn = button;
      showRoom(Number(button.dataset.room));
    });
  });
  addEventListener("scroll", function () { if (active && !body.classList.contains("v-plano")) hide(); }, {passive:true});
  $("h1").textContent = touch.matches ? "Toque num andar" : "Passe o mouse num andar";

  build();
})();
