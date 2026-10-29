(() => {

  const languageButtons = document.querySelectorAll("[data-language]");
  const setLanguage = language => {
    document.documentElement.lang = language;
    document.querySelectorAll("[data-tr][data-en]").forEach(el => { el.innerHTML = el.dataset[language]; });
    document.querySelectorAll("[data-bio-language]").forEach(el => { el.hidden = el.dataset.bioLanguage !== language; });
    languageButtons.forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const menu = document.querySelector(".menu-toggle");
    if (menu) menu.setAttribute("aria-label", language === "tr" ? "Menüyü aç" : "Open menu");
    document.querySelector(".desktop-nav")?.setAttribute("aria-label", language === "tr" ? "Ana navigasyon" : "Main navigation");
    document.title = language === "tr" ? "Umut Kayapınar — Sanat · Araştırma · Biyografi" : "Umut Kayapınar — Art · Research · Biography";
  };
  languageButtons.forEach(button => button.addEventListener("click", () => setLanguage(button.dataset.language)));

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".desktop-nav");
  const closeMenu = () => {
    nav?.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Menüyü aç");
  };
  menuButton?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("open");
    document.body.classList.toggle("menu-open", Boolean(isOpen));
    menuButton.setAttribute("aria-expanded", String(Boolean(isOpen)));
    menuButton.setAttribute("aria-label", isOpen ? "Menüyü kapat" : "Menüyü aç");
  });
  nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 600) closeMenu();
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = (Math.min(index % 4, 3) * 70) + "ms";
      observer.observe(item);
    });
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  const glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
    window.addEventListener("pointermove", event => {
      glow.style.left = event.clientX + "px";
      glow.style.top = event.clientY + "px";
      glow.style.opacity = "1";
    }, { passive: true });
    document.addEventListener("pointerleave", () => { glow.style.opacity = "0"; });
  }

  const heroArt = document.querySelector(".hero-art");
  if (heroArt && window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
    let frame = null;
    window.addEventListener("pointermove", event => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 8;
        const y = (event.clientY / window.innerHeight - 0.5) * 8;
        heroArt.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
      });
    }, { passive: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });
  
  // Interactive year archive: filter existing artwork cards without relying on Wix links.
  const yearButtons = document.querySelectorAll(".year-button");
  const artworkCards = document.querySelectorAll(".work-card");
  const yearStatus = document.querySelector(".year-status");
  const yearEmpty = document.querySelector(".year-empty");
  const selectYear = selectedYear => {
    let visibleCount = 0;
    const selectedButton = [...yearButtons].find(button => button.dataset.year === String(selectedYear));
    const selectedLabel = selectedButton?.textContent.trim() || String(selectedYear);
    artworkCards.forEach(card => {
      const stamp = card.querySelector(".image-index")?.textContent.trim() || "";
      const matches = selectedYear === "small-things"
        ? stamp.startsWith("Küçük Şeyler ·")
        : stamp.startsWith(String(selectedYear) + " ·");
      card.classList.toggle("year-hidden", !matches);
      if (matches) {
        visibleCount++;
        card.classList.remove("is-visible");
        requestAnimationFrame(() => card.classList.add("is-visible"));
      }
    });
    yearButtons.forEach(button => {
      const active = button.dataset.year === String(selectedYear);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (yearStatus) yearStatus.innerHTML = selectedLabel + ' <span>' + (document.documentElement.lang === "en" ? "selected" : "seçildi") + '</span>';
    if (yearEmpty) yearEmpty.hidden = visibleCount > 0;
  };
  yearButtons.forEach(button => button.addEventListener("click", () => selectYear(button.dataset.year)));
  if (yearButtons.length) selectYear("2014");

  // Full-screen artwork viewer: tap a work to inspect it without leaving the archive.
  const lightbox = document.createElement("div");
  lightbox.className = "art-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Eser görüntüleyici");
  lightbox.innerHTML = '<div class="art-lightbox-top"><span>UMUT KAYAPINAR · ARŞİV</span><button type="button" class="art-lightbox-close" aria-label="Kapat">×</button></div><div class="art-lightbox-image-wrap"><img class="art-lightbox-image" alt=""></div><div class="art-lightbox-bottom"><span class="art-lightbox-title"></span><small class="art-lightbox-year"></small></div>';
  document.body.appendChild(lightbox);
  const lightboxImage = lightbox.querySelector(".art-lightbox-image");
  const lightboxTitle = lightbox.querySelector(".art-lightbox-title");
  const lightboxYear = lightbox.querySelector(".art-lightbox-year");
  const lightboxClose = lightbox.querySelector(".art-lightbox-close");
  let previousFocus = null;
  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.classList.remove("lightbox-open");
    lightboxImage.removeAttribute("src");
    previousFocus?.focus();
  };
  artworkCards.forEach(card => {
    card.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const image = card.querySelector("img");
      if (!image) return;
      previousFocus = card;
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightboxTitle.textContent = card.querySelector("h3")?.textContent.trim() || image.alt;
      lightboxYear.textContent = card.querySelector(".image-index")?.textContent.trim() || "";
      lightbox.classList.add("open");
      document.body.classList.add("lightbox-open");
      lightboxClose.focus();
    });
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", event => { if (event.target === lightbox || event.target.classList.contains("art-lightbox-image-wrap")) closeLightbox(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
  });

})();
