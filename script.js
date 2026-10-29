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
    galleryControls.minDistance = 2.2;
    galleryControls.maxDistance = galleryRoomRadius + 3;
    animateGalleryCamera(
      new threeModule.Vector3(0, 2.15, Math.max(2.2, galleryRoomRadius * 0.48)),
      new threeModule.Vector3(0, 1.9, 0)
    );
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
    galleryScene.background = new THREE.Color("#090b0e");
    galleryScene.fog = new THREE.Fog("#090b0e", 15, 42);
    const visibleCards = [...document.querySelectorAll(".work-card:not(.year-hidden)")];
    const items = visibleCards.map(card => {
      const image = card.querySelector("img");
      return image ? {
        card, image,
        title: card.querySelector("h3")?.textContent.trim() || image.alt || "Artwork",
        year: card.querySelector(".image-index")?.textContent.trim() || "",
        src: image.getAttribute("src")
      } : null;
    }).filter(Boolean);
    if (!items.length) {
      setGalleryStatus(galleryText("Bu yıl için henüz eser yok. Önce başka bir yıl seç.", "No artworks for this year yet. Choose another year first."));
      return;
    }
    galleryRoomRadius = Math.max(5.2, items.length * 2.65 / (Math.PI * 2));
    galleryCamera = new THREE.PerspectiveCamera(48, gallery3DStage.clientWidth / Math.max(1, gallery3DStage.clientHeight), 0.1, 100);
    galleryCamera.position.set(0, 2.15, galleryRoomRadius * 0.48);
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
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(galleryRoomRadius + 3, 96),
      new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.8, metalness: 0.15 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.035;
    galleryScene.add(floor);
    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(galleryRoomRadius * 0.36, galleryRoomRadius * 0.36 + 0.018, 96),
      new THREE.MeshBasicMaterial({ color: 0x42647b, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.005;
    galleryScene.add(floorRing);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(galleryRoomRadius + 0.75, galleryRoomRadius + 0.75, 5.4, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x202329, roughness: 0.92, metalness: 0.08, side: THREE.BackSide })
    );
    wall.position.y = 2.65;
    galleryScene.add(wall);
    const topLine = new THREE.Mesh(
      new THREE.TorusGeometry(galleryRoomRadius + 0.73, 0.018, 6, 100),
      new THREE.MeshBasicMaterial({ color: 0x4c7793, transparent: true, opacity: 0.8 })
    );
    topLine.position.y = 5.18;
    galleryScene.add(topLine);

    const loader = new THREE.TextureLoader();
    let loaded = 0;
    items.forEach((item, index) => {
      const angle = (index / items.length) * Math.PI * 2;
      const frameWidth = 2.0;
      const frameHeight = 2.55;
      const x = Math.sin(angle) * galleryRoomRadius;
      const z = Math.cos(angle) * galleryRoomRadius;
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(frameWidth + 0.18, frameHeight + 0.18, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x9b8053, metalness: 0.72, roughness: 0.32 })
      );
      frame.position.set(x, 2.15, z);
      frame.rotation.y = angle + Math.PI;
      galleryScene.add(frame);
      const mat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.82 });
      const placeholder = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth, frameHeight), mat);
      placeholder.position.set(Math.sin(angle) * (galleryRoomRadius - 0.09), 2.15, Math.cos(angle) * (galleryRoomRadius - 0.09));
      placeholder.rotation.y = angle + Math.PI;
      placeholder.userData.artwork = item;
      placeholder.userData.angle = angle;
      galleryScene.add(placeholder);
      galleryArtMeshes.push(placeholder);
      loader.load(encodeURI(item.src), texture => {
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
    if (gallery3DStatus) {
      gallery3DStatus.hidden = false;
      gallery3DStatus.innerHTML = '<span class="gallery-3d-loader"></span><span>' + galleryText("Eserler yükleniyor...", "Loading artworks...") + '</span>';
    }
    galleryRaycaster = new THREE.Raycaster();
    galleryPointer = new THREE.Vector2();
    if (galleryControls) galleryControls.dispose();
    galleryControls = new orbitModule.OrbitControls(galleryCamera, galleryRenderer.domElement);
    galleryControls.enableDamping = true;
    galleryControls.dampingFactor = 0.06;
    galleryControls.enablePan = false;
    galleryControls.rotateSpeed = 0.48;
    galleryControls.zoomSpeed = 0.75;
    galleryControls.minDistance = 2.2;
    galleryControls.maxDistance = galleryRoomRadius + 3;
    galleryControls.target.set(0, 1.9, 0);
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
        const a = mesh.userData.angle;
        const target = new threeModule.Vector3(mesh.position.x, 2.15, mesh.position.z);
        const destination = new threeModule.Vector3(
          mesh.position.x - Math.sin(a) * 2.75,
          2.45,
          mesh.position.z - Math.cos(a) * 2.75
        );
        galleryControls.minDistance = 1.4;
        galleryControls.maxDistance = galleryRoomRadius + 3;
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