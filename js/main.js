const canvas = document.getElementById("sequence");
const context = canvas.getContext("2d");

const frameCount = 137;
const currentFrame = (i) =>
  `./assets/sequence/frame${i.toString().padStart(3, "0")}.png`;

const images = [];
let currentImageIndex = 0;

// Resize canvas to wrapper size
function resizeCanvas() {
  const wrapper = document.querySelector(".sequence-wrapper");
  canvas.width = wrapper.offsetWidth;
  canvas.height = wrapper.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Draw image cover style
function drawImageCover(img) {
  if (!img) return;
  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.width / img.height;
  let renderWidth, renderHeight, xStart, yStart;

  if (canvasRatio > imgRatio) {
    renderWidth = canvas.width;
    renderHeight = renderWidth / imgRatio;
    xStart = 0;
    yStart = (canvas.height - renderHeight) / 2;
  } else {
    renderHeight = canvas.height;
    renderWidth = renderHeight * imgRatio;
    xStart = (canvas.width - renderWidth) / 2;
    yStart = 0;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, xStart, yStart, renderWidth, renderHeight);
}

// Preload
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  img.onload = () => {
    images[i] = img;
    if (i === 0) drawImageCover(img);
  };
}



// Scroll logic
window.addEventListener("scroll", () => {
  const vidSection = document.querySelector("section.vid");
  const sectionHeight = vidSection.offsetHeight - window.innerHeight;
  let progress = (window.scrollY - vidSection.offsetTop) / sectionHeight;
  progress = Math.min(Math.max(progress, 0), 1);

  // --- scale de 1 à 0.5 ---
  const minScale = 0.5;
  const scale = 1 - (1 - minScale) * progress;
  canvas.style.transform = `scale(${scale})`;

  // --- frame index ---
  const frameIndex = Math.min(
    frameCount - 1,
    Math.floor(progress * frameCount)
  );

  if (images[frameIndex] && frameIndex !== currentImageIndex) {
    currentImageIndex = frameIndex;
    requestAnimationFrame(() => drawImageCover(images[frameIndex]));
  }
});





// Init Lenis pour scroll inertiel
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  smoothTouch: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);



// === Lookbook Panel + Overlay + Model 3D ===
const hotspots = document.querySelectorAll(".hotspot");
const panel = document.getElementById("lookbookPanel");
const overlay = document.getElementById("lookbookOverlay"); // déjà créé auparavant
const closePanel = document.getElementById("closePanel");

const panelTitle = document.getElementById("panelTitle");
const panelDescription = document.getElementById("panelDescription");
const panelModel = document.getElementById("panelModel");

// Même modèle pour chaque pièce (pour l’instant)
const MODEL_URL = "https://c88w6athycyjuf8o.public.blob.vercel-storage.com/SAC%20A%CC%80%20MAIN.glb";

// Données pièces (exemples en FR)
const itemsData = {
  "Béret en laine": {
    desc: "Béret en laine mérinos, lignes nettes et finitions main. Pièce essentielle du vestiaire ModArt.",
  },
  "Haut plissé beige": {
    desc: "Top plissé en soie végétale, volume graphique et texture aérienne. Élégance minimaliste.",
  },
  "Jupe en cuir marron": {
    desc: "Jupe en cuir de champignon, taille haute, tombé structuré. Innovation durable, caractère éditorial.",
  }
};

// Ouvrir le panneau
hotspots.forEach(h => {
  h.addEventListener("click", () => {
    const item = h.dataset.item;
    const data = itemsData[item] || { desc: "Détails à venir." };

    panelTitle.textContent = item || "Pièce";
    panelDescription.textContent = data.desc;

    // assigner / réassigner le modèle 3D
    if (panelModel) {
      // orientation initiale : on montre la face avant (ajuste au besoin)
      panelModel.setAttribute("src", MODEL_URL);
      panelModel.setAttribute("camera-orbit", "180deg auto auto");
      panelModel.setAttribute("camera-target", "auto");
      panelModel.setAttribute("shadow-intensity", "1");
      panelModel.style.background = "transparent";
    }

    panel.classList.add("active");
    overlay.classList.add("active");
  });
});

// Fermer panneau + overlay
function closeLookbook() {
  panel.classList.remove("active");
  overlay.classList.remove("active");
}
closePanel.addEventListener("click", closeLookbook);
overlay.addEventListener("click", closeLookbook);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && panel.classList.contains("active")) closeLookbook();
});

// ===== Lookbook panel — micro interactions 3D stage =====
(() => {
  const wrap = document.getElementById('panelModelWrap');
  const hint = wrap ? wrap.querySelector('.panel-hint') : null;
  if (!wrap || !window.matchMedia('(pointer:fine)').matches) return;

  let hideHintTimer;

  const setSpot = (ev) => {
    const r = wrap.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * 100;
    const y = ((ev.clientY - r.top)  / r.height) * 100;
    wrap.style.setProperty('--mx', `${x}%`);
    wrap.style.setProperty('--my', `${y}%`);
    if (hint) {
      hint.style.opacity = '0';
      clearTimeout(hideHintTimer);
      hideHintTimer = setTimeout(() => hint.remove(), 600);
    }
  };

  wrap.addEventListener('mousemove', setSpot);
  wrap.addEventListener('mouseenter', setSpot);
})();



// === Jeu concours flottant (Desktop + Mobile) ===
(() => {
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  const floating = document.getElementById("jeuFloating");
  const overlay  = document.getElementById("jeuOverlay");
  const card     = document.getElementById("jeuCard");
  const closeBtn = document.getElementById("closeCard");
  const form     = document.getElementById("jeuForm");
  const hero     = document.querySelector("section.hero");
  const heroLinks = document.querySelectorAll(".hero-link");

  // Variables Desktop
  let targetX=0, targetY=0, currentX=0, currentY=0;
  const LAG=0.15, ARM_DELAY=0;
  let rafId=null, armTimer=null;
  let hideForced = false; // <--- pour savoir si on cache à cause d'un hero-link

  const arm=()=>floating.classList.add("armed");
  const disarm=()=>floating.classList.remove("armed");
  const show=()=>{ if (!hideForced) floating.classList.remove("is-hidden"); };
  const hide=()=>{ floating.classList.add("is-hidden"); disarm(); clearTimeout(armTimer); };

  // Animation desktop
  function animate(){
    currentX+=(targetX-currentX)*LAG;
    currentY+=(targetY-currentY)*LAG;
    floating.style.left=currentX+"px";
    floating.style.top=currentY+"px";
    rafId=requestAnimationFrame(animate);
  }

  function onMouseMove(e){
    if(!hero.contains(e.target)){ hide(); return; }
    targetX=e.clientX; targetY=e.clientY;
    show();
    disarm();
    clearTimeout(armTimer);
    armTimer=setTimeout(arm,ARM_DELAY);
    if(!rafId) rafId=requestAnimationFrame(animate);
  }

  // Carte
  function openCard(){ 
    overlay.classList.add("active"); 
    card.classList.add("active"); 
    hide(); 
  }
  function closeCard(){ 
    overlay.classList.remove("active"); 
    card.classList.remove("active"); 
    if(!isMobile()) show(); 
    if(isMobile()) show();  
  }
  function submitForm(e){ 
    e.preventDefault(); 
    closeCard(); 
    floating.remove(); 
    alert("Merci pour ta participation !"); 
  }

  floating.addEventListener("click",openCard);
  overlay.addEventListener("click",closeCard);
  closeBtn.addEventListener("click",closeCard);
  form.addEventListener("submit",submitForm);

  // Desktop
  if(!isMobile()){
    document.addEventListener("mousemove",onMouseMove);
    document.addEventListener("mouseleave",hide);

    // Cache quand on passe sur un hero-link
    heroLinks.forEach(link => {
      link.addEventListener("mouseenter", () => {
        hideForced = true;
        hide();
      });
      link.addEventListener("mouseleave", () => {
        hideForced = false;
        show();
      });
    });
  } else {
    // Mobile : FAB toujours visible
    floating.classList.remove("is-hidden");
    floating.classList.add("armed");
  }
})();




// === Intersection Observer pour Collection ===
const collectionSection = document.querySelector(".collection");
if (collectionSection) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        collectionSection.classList.add("in-view");
      }
    });
  }, { threshold: 0.3 });
  observer.observe(collectionSection);
}

// ===== La pièce phare : reveal + tilt image + spotlight 3D =====
(() => {
  const section = document.querySelector(".highlight-piece");
  if (!section) return;

  // Reveal au scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) section.classList.add("in-view");
    });
  }, { threshold: 0.25 });
  io.observe(section);

  // Tilt léger sur la photo
  const tilt = section.querySelector(".tilt");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (tilt && !prefersReduced) {
    const maxTilt = 6; // degrés
    let raf;
    function onMove(ev) {
      const rect = tilt.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top)  / rect.height;
      const rx = (y - 0.5) * -maxTilt;
      const ry = (x - 0.5) *  maxTilt;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        tilt.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    }
    function onLeave() {
      cancelAnimationFrame(raf);
      tilt.style.transform = `rotateX(0deg) rotateY(0deg)`;
    }
    tilt.addEventListener("mousemove", onMove);
    tilt.addEventListener("mouseleave", onLeave);
  }

  // Spotlight doux sur la scène 3D (souris uniquement)
  const stage = section.querySelector("#hpStage");
  const hint  = section.querySelector("#hpHint");
  if (stage && window.matchMedia("(pointer:fine)").matches) {
    let hideHintTimer;
    function setSpotlight(ev) {
      const rect = stage.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top)  / rect.height) * 100;
      stage.style.setProperty("--mx", `${x}%`);
      stage.style.setProperty("--my", `${y}%`);
      // cacher l'indication après la première interaction
      if (hint) {
        hint.style.opacity = "0";
        clearTimeout(hideHintTimer);
        hideHintTimer = setTimeout(() => hint.remove(), 600);
      }
    }
    stage.addEventListener("mousemove", setSpotlight);
    stage.addEventListener("mouseenter", setSpotlight);
  }
})();


