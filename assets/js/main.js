(function () {
  "use strict";
  var C = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Menu móvel */
  var topo = $(".topo"), menu = $("#menu"), botaoMenu = $(".menu-botao");
  function fecharMenu() {
    menu.classList.remove("aberto"); topo.classList.remove("menu-aberto");
    botaoMenu.setAttribute("aria-expanded", "false");
  }
  botaoMenu.addEventListener("click", function () {
    var aberto = menu.classList.toggle("aberto");
    topo.classList.toggle("menu-aberto", aberto);
    botaoMenu.setAttribute("aria-expanded", String(aberto));
  });
  $$("#menu a").forEach(function (a) { a.addEventListener("click", fecharMenu); });

  /* Contagem regressiva */
  var alvo = new Date(C.dataCasamento || "2027-03-20T16:30:00-03:00").getTime();
  var campos = {};
  $$("[data-contagem]").forEach(function (el) { campos[el.dataset.contagem] = el; });
  function doisDigitos(n) { return n < 10 ? "0" + n : String(n); }
  function atualizarContagem() {
    var resta = Math.max(0, alvo - Date.now());
    var s = Math.floor(resta / 1000);
    campos.dias.textContent = Math.floor(s / 86400);
    campos.horas.textContent = doisDigitos(Math.floor(s % 86400 / 3600));
    campos.minutos.textContent = doisDigitos(Math.floor(s % 3600 / 60));
    campos.segundos.textContent = doisDigitos(s % 60);
    if (resta === 0) {
      $(".hero-rotulo").textContent = "Chegou o grande dia!";
      clearInterval(relogio);
    }
  }
  var relogio = setInterval(atualizarContagem, 1000);
  atualizarContagem();

  /* Links configuráveis */
  $$("[data-link]").forEach(function (a) { if (C[a.dataset.link]) a.href = C[a.dataset.link]; });
  var hosp = C.hospedagem || {};
  if (hosp.instagram) $$('[data-link="instagram"]').forEach(function (a) { a.href = hosp.instagram; });
  if (hosp.whatsapp) $$("[data-whatsapp]").forEach(function (a) {
    a.href = "https://wa.me/" + hosp.whatsapp + "?text=" +
      encodeURIComponent("Olá, Taís! Vou ao casamento de Carolina e Fernando e gostaria de informações sobre hospedagem.");
  });

  /* Mapa, rota e agenda */
  var local = C.local || {};
  var busca = encodeURIComponent(local.buscaMapa || "Hospedaria Casa de Campo");
  $$('[data-mapa="ver"]').forEach(function (a) {
    a.href = "https://www.google.com/maps/search/?api=1&query=" + busca;
  });
  var formRota = $("[data-rota]");
  if (formRota) formRota.addEventListener("submit", function (e) {
    e.preventDefault();
    var origem = encodeURIComponent(formRota.partida.value.trim());
    window.open("https://www.google.com/maps/dir/?api=1&origin=" + origem + "&destination=" + busca, "_blank", "noopener");
  });
  var agenda = $("[data-agenda]");
  if (agenda) {
    var inicio = new Date(alvo), fim = new Date(alvo + 7 * 3600 * 1000);
    var fmt = function (d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    agenda.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("Casamento de Carolina e Fernando") +
      "&dates=" + fmt(inicio) + "/" + fmt(fim) +
      "&location=" + encodeURIComponent(local.buscaMapa || local.nome || "") +
      "&details=" + encodeURIComponent("Cerimônia religiosa e festa. Contamos com você!");
  }

  /* Lista de presentes */
  var grade = $("[data-presentes]");
  if (grade && Array.isArray(C.presentes)) {
    var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    C.presentes.forEach(function (p) {
      var item = document.createElement("article");
      item.className = "presente revelar";
      item.innerHTML =
        '<div class="presente-icone" aria-hidden="true"></div><h3></h3>' +
        '<p class="presente-valor">a partir de<strong></strong></p>' +
        '<a class="botao" target="_blank" rel="noopener">Presentear</a>';
      $(".presente-icone", item).textContent = p.icone || "🎁";
      $("h3", item).textContent = p.nome;
      $("strong", item).textContent = moeda.format(p.valor);
      $("a", item).href = p.link || C.paginaPresentes || "#";
      grade.appendChild(item);
    });
  }

  /* Visualizador de fotos */
  var itens = $$(".galeria-item"), lb = $(".lightbox"), lbImg = $("img", lb), atual = 0;
  function mostrar(i) {
    atual = (i + itens.length) % itens.length;
    lbImg.src = itens[atual].href;
    lb.hidden = false; document.body.style.overflow = "hidden";
  }
  function fechar() { lb.hidden = true; lbImg.src = ""; document.body.style.overflow = ""; }
  itens.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); mostrar(i); }); });
  $(".lb-fechar").addEventListener("click", fechar);
  $(".lb-anterior").addEventListener("click", function () { mostrar(atual - 1); });
  $(".lb-proxima").addEventListener("click", function () { mostrar(atual + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) fechar(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") fechar();
    if (e.key === "ArrowLeft") mostrar(atual - 1);
    if (e.key === "ArrowRight") mostrar(atual + 1);
  });
  var toqueX = null;
  lb.addEventListener("touchstart", function (e) { toqueX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (toqueX === null) return;
    var dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) mostrar(atual + (dx < 0 ? 1 : -1));
    toqueX = null;
  });

  /* Formulários (confirmação e recados) */
  var formRsvp = $('[data-formulario="rsvp"]');
  var blocoSim = $(".so-se-sim");
  if (formRsvp) {
    blocoSim.hidden = true;
    $$('input[name="presenca"]', formRsvp).forEach(function (r) {
      r.addEventListener("change", function () { blocoSim.hidden = formRsvp.presenca.value !== "Sim"; });
    });
  }

  function enviar(form, tipo, sucesso) {
    var aviso = $(".aviso", form);
    aviso.className = "aviso";
    if (!form.checkValidity()) {
      aviso.textContent = "Preencha os campos obrigatórios, por favor.";
      aviso.classList.add("erro");
      var invalido = $(":invalid", form); if (invalido) invalido.focus();
      return;
    }
    if (!C.endpointFormularios) {
      aviso.textContent = "O envio ainda não foi ativado. Tente novamente em breve.";
      aviso.classList.add("erro");
      return;
    }
    var dados = new URLSearchParams(new FormData(form));
    dados.append("tipo", tipo);
    var botao = $('button[type="submit"]', form);
    botao.disabled = true; aviso.textContent = "Enviando…";
    fetch(C.endpointFormularios, { method: "POST", mode: "no-cors", body: dados })
      .then(function () {
        aviso.textContent = sucesso; aviso.classList.add("ok"); form.reset();
        if (blocoSim && form === formRsvp) blocoSim.hidden = true;
        if (tipo === "recado") carregarRecados();
      })
      .catch(function () {
        aviso.textContent = "Não foi possível enviar. Verifique sua conexão e tente de novo.";
        aviso.classList.add("erro");
      })
      .then(function () { botao.disabled = false; });
  }
  if (formRsvp) formRsvp.addEventListener("submit", function (e) {
    e.preventDefault();
    enviar(formRsvp, "rsvp", "Presença registrada. Obrigado pelo carinho! ♡");
  });
  var formRecado = $('[data-formulario="recado"]');
  if (formRecado) formRecado.addEventListener("submit", function (e) {
    e.preventDefault();
    enviar(formRecado, "recado", "Mensagem enviada. Ela aparece no mural após a nossa aprovação. ♡");
  });

  /* Mural de recados (somente mensagens aprovadas na planilha) */
  function carregarRecados() {
    var mural = $("[data-mural]");
    if (!mural || !C.endpointFormularios) return;
    fetch(C.endpointFormularios + "?tipo=recados")
      .then(function (r) { return r.json(); })
      .then(function (lista) {
        if (!Array.isArray(lista) || !lista.length) return;
        mural.innerHTML = "";
        lista.forEach(function (m) {
          var el = document.createElement("article");
          el.className = "recado";
          el.innerHTML = "<p></p><footer></footer>";
          $("p", el).textContent = m.mensagem;
          $("footer", el).textContent = "— " + m.nome;
          mural.appendChild(el);
        });
      })
      .catch(function () { /* mantém a mensagem padrão */ });
  }
  carregarRecados();

  /* Animação de entrada */
  var alvos = $$(".titulo-secao, .historia-texto, .historia-fotos, .cartao-local, .dicas-grade, .confirmar-cartao, .recados-grade, .versiculo blockquote");
  alvos.forEach(function (el) { el.classList.add("revelar"); });
  var revelaveis = $$(".revelar");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visivel"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revelaveis.forEach(function (el) { obs.observe(el); });
  } else {
    revelaveis.forEach(function (el) { el.classList.add("visivel"); });
  }
})();
