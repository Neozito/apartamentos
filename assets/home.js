(function () {
  var lessMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if ("IntersectionObserver" in window && !lessMotion.matches) {
    document.documentElement.classList.add("reveal-ready");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    }, {threshold: .12});
    document.querySelectorAll(".reveal").forEach(function (element) {
      observer.observe(element);
    });
  }

  var form = document.getElementById("visit-form");
  var result = document.getElementById("visit-result");
  var message = document.getElementById("visit-message");
  var status = document.getElementById("visit-status");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var nome = data.get("nome").trim();
    var horario = data.get("horario").trim();
    if (!nome) {
      form.elements.nome.focus();
      return;
    }
    message.value = "Olá! Meu nome é " + nome + " e gostaria de agendar uma visita ao Aurora. Tenho interesse em: " +
      data.get("interesse").toLowerCase() + "." + (horario ? " Minha preferência de horário é " + horario + "." : "");
    result.hidden = false;
    status.textContent = "";
    message.focus();
  });
  document.getElementById("copy-visit").addEventListener("click", async function () {
    message.focus();
    message.select();
    try {
      await navigator.clipboard.writeText(message.value);
      status.textContent = "Mensagem copiada.";
    } catch (error) {
      status.textContent = "Mensagem selecionada. Use o comando de copiar do seu dispositivo.";
    }
  });
})();
