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

  // Subtle page progress indicator and polished scrolled-header state.
  const readingProgress = document.createElement("div");
  readingProgress.className = "reading-progress";
  readingProgress.setAttribute("aria-hidden", "true");
  document.body.appendChild(readingProgress);
  let scrollTicking = false;
  const updateScrollChrome = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    readingProgress.style.transform = "scaleX(" + Math.min(1, Math.max(0, window.scrollY / maxScroll)) + ")";
    document.querySelector(".site-header")?.classList.toggle("is-scrolled", window.scrollY > 24);
    scrollTicking = false;
  };
  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollChrome);
  }, { passive: true });
  updateScrollChrome();

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
    window.refreshUmut3DGallery?.();
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


  // Three.js immersive gallery: paintings mounted around a circular exhibition room.
  const open3DButton = document.querySelector("#open-3d-gallery");
  const close3DButton = document.querySelector("#close-3d-gallery");
  const reset3DButton = document.querySelector("#gallery-3d-reset");
  const previous3DButton = document.querySelector("#gallery-3d-left");
  const next3DButton = document.querySelector("#gallery-3d-right");
  const gallery3D = document.querySelector("#gallery-3d");
  const gallery3DStage = document.querySelector("#gallery-3d-stage");
  const gallery3DStatus = document.querySelector("#gallery-3d-status");
  const gallery3DCaption = document.querySelector("#gallery-3d-caption");
  let threeModule = null;
  let orbitModule = null;
  let galleryRenderer = null;
  let galleryScene = null;
  let galleryCamera = null;
  let galleryControls = null;
  let galleryRaycaster = null;
  let galleryPointer = null;
  let galleryResizeObserver = null;
  let galleryAnimation = 0;
  let galleryIsOpen = false;
  let galleryRoomRadius = 6;
  let galleryArtMeshes = [];
  let galleryFrameId = 0;
  let galleryCameraTween = null;
  let galleryPointerDown = null;
  let galleryDragged = false;
  let galleryDust = null;
  let galleryCentralLight = null;
  let galleryYearMarkers = [];
  let galleryYearOverlay = null;
  galleryYearOverlay = document.createElement("div");
  galleryYearOverlay.className = "gallery-year-overlay";
  galleryYearOverlay.setAttribute("aria-live", "polite");
  galleryYearOverlay.textContent = "— 2014 —";
  gallery3DStage?.appendChild(galleryYearOverlay);

  const galleryText = (tr, en) => document.documentElement.lang === "en" ? en : tr;
  const setGalleryStatus = message => {
    if (!gallery3DStatus) return;
    gallery3DStatus.hidden = false;
    gallery3DStatus.innerHTML = "";
    const label = document.createElement("span");
    label.textContent = message;
    gallery3DStatus.appendChild(label);
  };
  const updateGalleryCaption = (title, yearLabel) => {
    if (!gallery3DCaption) return;
    gallery3DCaption.innerHTML = "";
    const titleNode = document.createElement("span");
    titleNode.textContent = title || galleryText("Bir esere tıklayarak yakından incele", "Click a painting to inspect it");
    gallery3DCaption.appendChild(titleNode);
    if (yearLabel) {
      const yearNode = document.createElement("small");
      yearNode.textContent = yearLabel;
      gallery3DCaption.appendChild(yearNode);
    }
  };
  const disposeGalleryScene = () => {
    if (!galleryScene || !threeModule) return;
    galleryScene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      }
    });
    galleryArtMeshes = [];
  };
  const animateGalleryCamera = (position, target, duration = 900) => {
    if (!galleryCamera || !galleryControls || !threeModule) return;
    galleryCameraTween = {
      started: performance.now(),
      duration,
      fromPosition: galleryCamera.position.clone(),
      toPosition: position.clone(),
      fromTarget: galleryControls.target.clone(),
      toTarget: target.clone()
    };
  };
  const resetGalleryView = () => {
    if (!galleryControls || !galleryCamera || !threeModule) return;
    galleryControls.minDistance = 1.5;
    galleryControls.maxDistance = 18;
    animateGalleryCamera(new threeModule.Vector3(0, 2.25, 4.5), new threeModule.Vector3(0, 2.1, -3));
    updateGalleryCaption();
  };
  const rotateGalleryView = direction => {
    if (!galleryCamera || !galleryControls || !threeModule) return;
    const offset = galleryCamera.position.clone().sub(galleryControls.target);
    const angle = direction * Math.PI / 4;
    offset.applyAxisAngle(new threeModule.Vector3(0, 1, 0), angle);
    animateGalleryCamera(galleryControls.target.clone().add(offset), galleryControls.target.clone(), 650);
  };
  const buildGalleryScene = () => {
    if (!threeModule || !galleryRenderer || !gallery3DStage) return;
    const THREE = threeModule;
    disposeGalleryScene();
    galleryScene = new THREE.Scene();
    galleryScene.background = new THREE.Color("#050914");
    galleryScene.fog = new THREE.Fog("#050914", 18, 48);
    const allCards = [...document.querySelectorAll(".work-card")];
    const items = allCards.map(card => {
      const image = card.querySelector("img");
      return image ? {
        card, image,
        title: card.querySelector("h3")?.textContent.trim() || image.alt || "Artwork",
        year: card.querySelector(".image-index")?.textContent.trim() || "",
        yearKey: (card.querySelector(".image-index")?.textContent.trim() || "").match(/\d{4}/)?.[0] || "Arşiv",
        src: image.getAttribute("src")
      } : null;
    }).filter(Boolean).sort((a, b) => Number(a.yearKey) - Number(b.yearKey));
    if (!items.length) {
      setGalleryStatus(galleryText("Bu yıl için henüz eser yok. Önce başka bir yıl seç.", "No artworks for this year yet. Choose another year first."));
      return;
    }
    galleryRoomRadius = Math.max(5.2, items.length * 2.65 / (Math.PI * 2));
    galleryYearMarkers = [];
    galleryCamera = new THREE.PerspectiveCamera(68, gallery3DStage.clientWidth / Math.max(1, gallery3DStage.clientHeight), 0.1, 120);
    galleryCamera.position.set(0, 2.25, 4.5);
    galleryScene.add(new THREE.HemisphereLight(0xbdd8f0, 0x17110c, 2.0));
    const centralLight = new THREE.PointLight(0xf4e4c8, 34, galleryRoomRadius * 3.4, 1.8);
    centralLight.position.set(0, 4.2, 0);
    galleryScene.add(centralLight);
    galleryCentralLight = centralLight;

    // Tiny floating dust catches the gallery lights for a living, museum-like atmosphere.
    const dustCount = 180;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * galleryRoomRadius * 2.1;
      dustPositions[i * 3 + 1] = Math.random() * 4.8 + 0.15;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * galleryRoomRadius * 2.1;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    galleryDust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({ color: 0xe5cf9f, size: 0.035, transparent: true, opacity: 0.72, depthWrite: false, sizeAttenuation: true })
    );
    galleryScene.add(galleryDust);
    const blueLight = new THREE.PointLight(0x69afe8, 18, galleryRoomRadius * 2.6, 2);
    blueLight.position.set(-galleryRoomRadius * 0.5, 3, -1);
    galleryScene.add(blueLight);
    // Long museum corridor with a real walking axis, paintings on both walls, and year groups.
    const corridorLength = Math.max(30, items.length * 3.65 + 10);
    const corridorWidth = 10.5;
    const corridorEnd = -corridorLength;
    galleryScene.fog = new THREE.Fog("#090b0e", 18, corridorLength + 12);
    galleryCamera.far = corridorLength + 30;
    galleryCamera.updateProjectionMatrix();
    galleryRoomRadius = corridorLength / 2;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(corridorWidth, corridorLength),
      new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.72, metalness: 0.12 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.04, corridorEnd / 2);
    galleryScene.add(floor);
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(corridorWidth, corridorLength),
      new THREE.MeshStandardMaterial({ color: 0x080d19, roughness: 0.95, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 5.4, corridorEnd / 2);
    galleryScene.add(ceiling);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x101a2b, roughness: 0.9, side: THREE.DoubleSide });
    [-corridorWidth / 2, corridorWidth / 2].forEach(x => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(corridorLength, 5.4), wallMaterial);
      wall.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      wall.position.set(x, 2.68, corridorEnd / 2);
      galleryScene.add(wall);
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, corridorLength),
        new THREE.MeshStandardMaterial({ color: 0xc9a96e, metalness: 0.72, roughness: 0.3 })
      );
      rail.position.set(x < 0 ? x + 0.03 : x - 0.03, 4.95, corridorEnd / 2);
      galleryScene.add(rail);
    });
    const endWall = new THREE.Mesh(
      new THREE.PlaneGeometry(corridorWidth, 5.4),
      new THREE.MeshStandardMaterial({ color: 0x24241f, roughness: 0.9, side: THREE.DoubleSide })
    );
    endWall.position.set(0, 2.68, corridorEnd);
    galleryScene.add(endWall);
    const startWall = new THREE.Mesh(
      new THREE.PlaneGeometry(corridorWidth, 5.4),
      new THREE.MeshStandardMaterial({ color: 0x101a2b, roughness: 0.9, side: THREE.DoubleSide })
    );
    startWall.position.set(0, 2.68, 6.2);
    galleryScene.add(startWall);
    const ceilingLights = [];
    for (let z = -3; z > corridorEnd; z -= 7) {
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.06, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xe8d5ae })
      );
      fixture.position.set(0, 5.28, z);
      galleryScene.add(fixture);
      const light = new THREE.PointLight(0xffe4b2, 13, 9, 2);
      light.position.set(0, 4.95, z);
      galleryScene.add(light);
      ceilingLights.push(light);
    }

    const loader = new THREE.TextureLoader();
    let loaded = 0;
    const yearGroups = new Map();
    items.forEach((item, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const z = -3.2 - index * 2.65;
      const x = side * (corridorWidth / 2 - 0.45);
      const imageAspectHint = item.image.naturalWidth && item.image.naturalHeight
        ? item.image.naturalWidth / item.image.naturalHeight
        : 1;
      const frameHeight = Math.min(2.65, 3.25 / imageAspectHint);
      const frameWidth = frameHeight * imageAspectHint;
      if (!yearGroups.has(item.yearKey)) yearGroups.set(item.yearKey, z);
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, frameHeight + 0.16, frameWidth + 0.16),
        new THREE.MeshStandardMaterial({ color: 0x9b8053, metalness: 0.72, roughness: 0.32 })
      );
      frame.position.set(x, 2.35, z);
      galleryScene.add(frame);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false });
      const placeholder = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth, frameHeight), mat);
      placeholder.position.set(side * (corridorWidth / 2 - 0.56), 2.35, z);
      placeholder.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      placeholder.userData.artwork = item;
      placeholder.userData.z = z;
      galleryScene.add(placeholder);
      galleryArtMeshes.push(placeholder);
      loader.load(new URL(item.src, document.baseURI).href, texture => {
        if (!galleryScene || !galleryScene.children.includes(placeholder)) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, galleryRenderer.capabilities.getMaxAnisotropy());
        const imageAspect = texture.image.width / Math.max(1, texture.image.height);
        const maxAspect = frameWidth / frameHeight;
        let w = frameWidth, h = frameHeight;
        if (imageAspect > maxAspect) h = frameWidth / imageAspect;
        else w = frameHeight * imageAspect;
        placeholder.geometry.dispose();
        placeholder.geometry = new THREE.PlaneGeometry(w, h);
        placeholder.material.map = texture;
        placeholder.material.color.set(0xffffff);
        placeholder.material.needsUpdate = true;
        loaded++;
        if (loaded === items.length && gallery3DStatus) gallery3DStatus.hidden = true;
      }, undefined, () => {
        loaded++;
        if (loaded === items.length && gallery3DStatus) gallery3DStatus.hidden = true;
      });
    });
    galleryYearMarkers = [...yearGroups.entries()].map(([year, z]) => ({ year, z }));
    galleryYearMarkers.sort((a, b) => b.z - a.z);
    if (gallery3DStatus) {
      gallery3DStatus.hidden = false;
      gallery3DStatus.innerHTML = '<span class="gallery-3d-loader"></span><span>' + galleryText("Eserler yükleniyor...", "Loading artworks...") + '</span>';
    }
    galleryRaycaster = new THREE.Raycaster();
    galleryPointer = new THREE.Vector2();
    if (galleryControls) galleryControls.dispose();
    galleryControls = new orbitModule.OrbitControls(galleryCamera, galleryRenderer.domElement);
    galleryControls.enableDamping = true;
    galleryControls.enableRotate = false;
    galleryControls.dampingFactor = 0.06;
    galleryControls.enablePan = false;
    galleryControls.enableZoom = false;
    galleryControls.rotateSpeed = 0.48;
    galleryControls.zoomSpeed = 0.75;
    galleryControls.minDistance = 2.2;
    galleryControls.maxDistance = 18;
    galleryControls.target.set(0, 2.1, -3);
    galleryControls.update();
    galleryRenderer.render(galleryScene, galleryCamera);
    updateGalleryCaption();
  };
  const ensureGalleryRenderer = async () => {
    if (galleryRenderer) return;
    const status = galleryText("Three.js yükleniyor...", "Loading Three.js...");
    setGalleryStatus(status);
    try {
      [threeModule, orbitModule] = await Promise.all([
        import("three"),
        import("three/addons/controls/OrbitControls.js")
      ]);
      const THREE = threeModule;
      galleryRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      galleryRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      galleryRenderer.outputColorSpace = THREE.SRGBColorSpace;
      galleryRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      galleryRenderer.toneMappingExposure = 1.12;
      galleryRenderer.domElement.setAttribute("aria-label", "Drag to look around the 3D art gallery");
      galleryRenderer.domElement.tabIndex = 0;
      gallery3DStage.appendChild(galleryRenderer.domElement);
      galleryRenderer.setSize(gallery3DStage.clientWidth, gallery3DStage.clientHeight, false);
      galleryResizeObserver = new ResizeObserver(() => {
        if (!galleryRenderer || !galleryCamera || !gallery3DStage.clientWidth) return;
        galleryCamera.aspect = gallery3DStage.clientWidth / Math.max(1, gallery3DStage.clientHeight);
        galleryCamera.updateProjectionMatrix();
        galleryRenderer.setSize(gallery3DStage.clientWidth, gallery3DStage.clientHeight, false);
      });
      galleryResizeObserver.observe(gallery3DStage);
      galleryRenderer.domElement.addEventListener("wheel", event => {
        if (!galleryIsOpen || !galleryCamera || !galleryControls) return;
        event.preventDefault();
        const step = Math.sign(event.deltaY) * 2.2;
        const nextZ = Math.max(-Math.max(24, document.querySelectorAll(".work-card").length * 3.65 + 10) + 3, Math.min(5.5, galleryCamera.position.z - step));
        const dz = nextZ - galleryCamera.position.z;
        galleryCamera.position.z = nextZ;
        galleryControls.target.z += dz;
      }, { passive: false });
      galleryRenderer.domElement.addEventListener("pointerdown", event => {
        galleryPointerDown = { x: event.clientX, y: event.clientY };
        galleryDragged = false;
      });
      galleryRenderer.domElement.addEventListener("pointermove", event => {
        if (!galleryPointerDown) return;
        if (Math.hypot(event.clientX - galleryPointerDown.x, event.clientY - galleryPointerDown.y) > 6) galleryDragged = true;
      });
      galleryRenderer.domElement.addEventListener("pointerup", () => {
        galleryPointerDown = null;
      });
      galleryRenderer.domElement.addEventListener("click", event => {
        if (galleryDragged) { galleryDragged = false; return; }
        if (!galleryRaycaster || !galleryCamera || !galleryArtMeshes.length) return;
        const rect = galleryRenderer.domElement.getBoundingClientRect();
        galleryPointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        galleryRaycaster.setFromCamera(galleryPointer, galleryCamera);
        const hit = galleryRaycaster.intersectObjects(galleryArtMeshes, false)[0];
        if (!hit) return;
        const mesh = hit.object;
        const art = mesh.userData.artwork;
        const side = mesh.position.x < 0 ? -1 : 1;
        const target = new threeModule.Vector3(mesh.position.x, 2.35, mesh.position.z);
        const destination = new threeModule.Vector3(-side * 1.5, 2.55, mesh.position.z + 0.7);
        galleryControls.minDistance = 1.2;
        galleryControls.maxDistance = 18;
        animateGalleryCamera(destination, target, 1050);
        updateGalleryCaption(art.title, art.year);
      });
    } catch (error) {
      console.error("3D gallery could not load:", error);
      setGalleryStatus(galleryText("3D galeri yüklenemedi. İnternet bağlantısını kontrol edip tekrar dene.", "The 3D gallery could not load. Check your connection and try again."));
      throw error;
    }
  };
  const galleryAnimate = () => {
    if (!galleryIsOpen || !galleryRenderer || !galleryScene || !galleryCamera) return;
    galleryAnimation = requestAnimationFrame(galleryAnimate);
    if (galleryCameraTween && threeModule) {
      const tween = galleryCameraTween;
      const progress = Math.min(1, (performance.now() - tween.started) / tween.duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      galleryCamera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
      galleryControls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
      if (progress >= 1) galleryCameraTween = null;
    }
    galleryControls?.update();
    if (galleryDust && threeModule) {
      const positions = galleryDust.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        positions.array[i * 3 + 1] += 0.0025 + (i % 4) * 0.00035;
        if (positions.array[i * 3 + 1] > 5.2) positions.array[i * 3 + 1] = 0.12;
      }
      positions.needsUpdate = true;
    }
    if (galleryCentralLight) galleryCentralLight.intensity = 32 + Math.sin(performance.now() * 0.0007) * 2.2;
    if (galleryYearOverlay && galleryCamera && galleryYearMarkers.length) {
      const z = galleryCamera.position.z;
      let current = galleryYearMarkers[0];
      for (const marker of galleryYearMarkers) {
        if (z <= marker.z + 1.1) current = marker;
      }
      const yearLabel = "— " + current.year + " —";
      if (galleryYearOverlay.textContent !== yearLabel) {
        galleryYearOverlay.textContent = yearLabel;
        galleryYearOverlay.classList.remove("year-change");
        void galleryYearOverlay.offsetWidth;
        galleryYearOverlay.classList.add("year-change");
      }
    }
    galleryRenderer.render(galleryScene, galleryCamera);
  };
  const openGallery3D = async (shouldScroll = true) => {
    if (!gallery3D || !gallery3DStage) return;
    gallery3D.hidden = false;
    galleryIsOpen = true;
    open3DButton?.setAttribute("aria-expanded", "true");
    setGalleryStatus(galleryText("Galeri hazırlanıyor...", "Preparing the gallery..."));
    try {
      await ensureGalleryRenderer();
      buildGalleryScene();
      cancelAnimationFrame(galleryAnimation);
      galleryAnimate();
      if (shouldScroll) gallery3D.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    } catch (_) {
      // The status inside the viewer explains the loading failure.
    }
  };
  const closeGallery3D = () => {
    galleryIsOpen = false;
    gallery3D.hidden = true;
    open3DButton?.setAttribute("aria-expanded", "false");
    cancelAnimationFrame(galleryAnimation);
  };
  window.refreshUmut3DGallery = () => {
    if (galleryIsOpen && galleryRenderer) buildGalleryScene();
  };
  open3DButton?.addEventListener("click", openGallery3D);
  close3DButton?.addEventListener("click", closeGallery3D);
  reset3DButton?.addEventListener("click", resetGalleryView);
  previous3DButton?.addEventListener("click", () => rotateGalleryView(-1));
  next3DButton?.addEventListener("click", () => rotateGalleryView(1));
  // Start directly in the immersive gallery; no separate 2D gallery view.
  openGallery3D(false);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && galleryIsOpen) closeGallery3D();
  });


})();