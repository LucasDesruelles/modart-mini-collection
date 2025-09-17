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



// --- Lookbook hotspots avec panneau ---
const hotspots = document.querySelectorAll(".hotspot");
const panel = document.getElementById("lookbookPanel");
const panelTitle = document.getElementById("panelTitle");
const panelDescription = document.getElementById("panelDescription");
const closePanel = document.getElementById("closePanel");

const itemsData = {
  "Veste en cuir": "Veste en cuir véritable, coupe oversize, disponible en noir et camel.",
  "Pantalon oversize": "Pantalon fluide en lin, parfait pour un style casual chic.",
  "Bottes montantes": "Bottes en cuir avec semelle crantée, confort et style garantis."
};

hotspots.forEach(h => {
  h.addEventListener("click", () => {
    const item = h.dataset.item;
    panelTitle.textContent = item;
    panelDescription.textContent = itemsData[item] || "Description à venir.";
    panel.classList.add("active");
  });
});

closePanel.addEventListener("click", () => {
  panel.classList.remove("active");
});

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



