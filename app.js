/* Application Core State */
const appState = {
  photos: [],
  likedPhotos: [], 
  viewMode: "feed",
  selectedAspect: "all",
  searchQuery: "",
  page: 1,
  limit: 30,
  isLoading: false,
  hasMore: true,
  currentLightboxIndex: -1,
};

/* DOM References */
const galleryFeed = document.getElementById("galleryFeed");
const scrollSentinel = document.getElementById("scrollSentinel");
const loadingSpinner = document.getElementById("loadingSpinner");
const savedToggleBtn = document.getElementById("savedToggleBtn");
const backToFeedBtn = document.getElementById("backToFeedBtn");
const savedCountBadge = document.getElementById("savedCountBadge");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const filterChips = document.getElementById("filterChips");
const feedStatusLabel = document.getElementById("feedStatusLabel");
const statusText = document.getElementById("statusText");
const brandLogo = document.getElementById("brandLogo");

/* Lightbox DOM References */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxAuthor = document.getElementById("lightboxAuthor");
const lightboxMeta = document.getElementById("lightboxMeta");
const lightboxIndex = document.getElementById("lightboxIndex");
const lightboxSaveBtn = document.getElementById("lightboxSaveBtn");
const lightboxOriginalLink = document.getElementById("lightboxOriginalLink");
const lightboxCloseBtn = document.getElementById("lightboxCloseBtn");
const prevPhotoBtn = document.getElementById("prevPhotoBtn");
const nextPhotoBtn = document.getElementById("nextPhotoBtn");
const downloadBtn = document.getElementById("downloadBtn");

/* Helper: Determine Aspect Ratio Category */
function getAspectCategory(width, height) {
  const ratio = width / height;
  if (ratio > 1.2) return "landscape";
  if (ratio < 0.85) return "portrait";
  return "square";
}

/* LocalStorage Manager */
function loadSavedPhotos() {
  try {
    const saved = localStorage.getItem("grain_saved_photos");
    if (saved) {
      appState.likedPhotos = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load saved photos from LocalStorage", e);
  }
  updateSavedBadge();
}

function saveSavedPhotos() {
  try {
    localStorage.setItem(
      "grain_saved_photos",
      JSON.stringify(appState.likedPhotos),
    );
  } catch (e) {
    console.error("Failed to persist saved photos to LocalStorage", e);
  }
  updateSavedBadge();
}

function isPhotoSaved(id) {
  return appState.likedPhotos.some((p) => String(p.id) === String(id));
}

function toggleSavePhoto(photo) {
  const index = appState.likedPhotos.findIndex(
    (p) => String(p.id) === String(photo.id),
  );
  if (index > -1) {
    appState.likedPhotos.splice(index, 1);
  } else {
    appState.likedPhotos.push(photo);
  }
  saveSavedPhotos();
  renderGallery();
  updateLightboxHeart();
}

function updateSavedBadge() {
  savedCountBadge.textContent = appState.likedPhotos.length;
}

/* API Fetching */
async function fetchPhotos() {
  if (appState.isLoading || !appState.hasMore) return;
  appState.isLoading = true;
  loadingSpinner.style.display = "flex";

  try {
    const response = await fetch(
      `https://picsum.photos/v2/list?page=${appState.page}&limit=${appState.limit}`,
    );
    const data = await response.json();

    if (data.length === 0) {
      appState.hasMore = false;
    } else {
      // Process photos with aspect details & web urls
      const formatted = data.map((item) => {
        const aspect = getAspectCategory(item.width, item.height);
        // Optimizing thumbnail height based on screen proportions
        const thumbUrl = `https://picsum.photos/id/${item.id}/600/${Math.round(600 * (item.height / item.width))}`;
        return {
          id: item.id,
          author: item.author,
          width: item.width,
          height: item.height,
          url: item.url,
          download_url: item.download_url,
          thumb_url: thumbUrl,
          aspect: aspect,
        };
      });

      appState.photos = [...appState.photos, ...formatted];
      appState.page++;
      updateFilterCounts();
      renderGallery();
    }
  } catch (err) {
    console.error("Error fetching photos:", err);
  } finally {
    appState.isLoading = false;
    if (!appState.hasMore) {
      loadingSpinner.style.display = "none";
    }
  }
}

/* Calculate Filter Counts */
function updateFilterCounts() {
  const activeList =
    appState.viewMode === "saved" ? appState.likedPhotos : appState.photos;

  document.getElementById("count-all").textContent = activeList.length;
  document.getElementById("count-landscape").textContent = activeList.filter(
    (p) => p.aspect === "landscape",
  ).length;
  document.getElementById("count-portrait").textContent = activeList.filter(
    (p) => p.aspect === "portrait",
  ).length;
  document.getElementById("count-square").textContent = activeList.filter(
    (p) => p.aspect === "square",
  ).length;
}

/* Filter Photos for Active View */
function getDisplayPhotos() {
  let source =
    appState.viewMode === "saved" ? appState.likedPhotos : appState.photos;

  // Filter by aspect ratio
  if (appState.selectedAspect !== "all") {
    source = source.filter((p) => p.aspect === appState.selectedAspect);
  }

  // Filter by search query
  if (appState.searchQuery.trim() !== "") {
    const q = appState.searchQuery.toLowerCase();
    source = source.filter((p) => p.author.toLowerCase().includes(q));
  }

  return source;
}

/* Render Gallery Items */
function renderGallery() {
  const displayPhotos = getDisplayPhotos();
  updateFilterCounts();

  // If display is empty, remove CSS multi-column so empty state spans centered full width
  if (displayPhotos.length === 0) {
    galleryFeed.classList.add("is-empty");
    renderEmptyState();
    return;
  }

  // Restore masonry column layout when items are present
  galleryFeed.classList.remove("is-empty");

  galleryFeed.innerHTML = displayPhotos
    .map((photo) => {
      const saved = isPhotoSaved(photo.id);
      const heartFill = saved
        ? "fill-brand-accent text-brand-accent"
        : "fill-none text-white";

      return `
          <div class="gallery-item">
            <div class="gallery-card relative group rounded-xl overflow-hidden bg-brand-surface border border-brand-border/60 shadow-lg transition-all duration-300 hover:border-brand-border cursor-pointer">
              
              <!-- Image -->
              <img 
                src="${photo.thumb_url}" 
                alt="Photo by ${photo.author}"
                loading="lazy"
                class="w-full h-auto object-cover block bg-brand-surface"
                onclick="openLightbox('${photo.id}')"
              />

              <!-- Hover Overlay -->
              <div class="card-overlay absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                
                <!-- Top Right Save Button -->
                <div class="flex justify-between items-center w-full">
                  <span class="text-[10px] font-mono bg-black/60 backdrop-blur-md px-2 py-1 rounded text-brand-muted uppercase border border-white/10">
                    ${photo.aspect}
                  </span>
                  <button 
                    onclick="event.stopPropagation(); toggleSavePhotoById('${photo.id}')"
                    class="pointer-events-auto p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 hover:bg-brand-accent/90 hover:border-brand-accent transition-all active:scale-90"
                    title="${saved ? "Remove from saved" : "Save frame"}"
                  >
                    <svg class="w-4 h-4 transition-transform ${heartFill}" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                </div>

                <!-- Bottom Author Info -->
                <div class="pointer-events-auto flex items-end justify-between" onclick="openLightbox('${photo.id}')">
                  <div>
                    <h3 class="text-sm font-semibold text-white tracking-wide leading-tight group-hover:text-brand-accent transition-colors">
                      ${photo.author}
                    </h3>
                    <p class="text-[11px] font-mono text-brand-muted mt-0.5">${photo.width} × ${photo.height}px</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        `;
    })
    .join("");
}

/* Helper function for inline HTML event binding */
window.toggleSavePhotoById = function (id) {
  const photo =
    appState.photos.find((p) => String(p.id) === String(id)) ||
    appState.likedPhotos.find((p) => String(p.id) === String(id));
  if (photo) {
    toggleSavePhoto(photo);
  }
};

/* Render Clean Empty States */
function renderEmptyState() {
  if (appState.viewMode === "saved") {
    galleryFeed.innerHTML = `
          <div class="state-container max-w-md mx-auto my-12 text-center p-8 rounded-2xl bg-brand-surface border border-brand-border/80 shadow-2xl">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">No saved frames yet</h3>
            <p class="text-xs font-mono text-brand-muted leading-relaxed mb-6">
              Hover over any photo card in the gallery feed and click the heart icon to save it here.
            </p>
            <button 
              onclick="switchToFeedView()" 
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-accent text-white text-xs font-mono font-semibold hover:bg-brand-accentHover transition-all active:scale-95 shadow-lg shadow-brand-accent/20"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              <span>Explore Gallery Feed</span>
            </button>
          </div>
        `;
  } else {
    galleryFeed.innerHTML = `
          <div class="state-container max-w-md mx-auto my-12 text-center p-8 rounded-2xl bg-brand-surface border border-brand-border/80 shadow-2xl">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-border/40 flex items-center justify-center text-brand-muted">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">No matching frames</h3>
            <p class="text-xs font-mono text-brand-muted leading-relaxed mb-6">
              No photographs found matching your filter or search query "${appState.searchQuery}".
            </p>
            <button 
              onclick="resetFilters()" 
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-surfaceHover border border-brand-border text-white text-xs font-mono font-medium hover:border-brand-muted transition-all"
            >
              Reset Filters
            </button>
          </div>
        `;
  }
}

/* Switching Views */
function switchToSavedView() {
  appState.viewMode = "saved";
  savedToggleBtn.classList.add(
    "bg-brand-accent",
    "text-white",
    "border-brand-accent",
  );
  savedToggleBtn.classList.remove("bg-brand-surface", "text-brand-text");
  backToFeedBtn.classList.remove("hidden");
  statusText.textContent = "SAVED COLLECTION";
  scrollSentinel.style.display = "none";
  renderGallery();
}

function switchToFeedView() {
  appState.viewMode = "feed";
  savedToggleBtn.classList.remove(
    "bg-brand-accent",
    "text-white",
    "border-brand-accent",
  );
  savedToggleBtn.classList.add("bg-brand-surface", "text-brand-text");
  backToFeedBtn.classList.add("hidden");
  statusText.textContent = "LIVE FEED";
  scrollSentinel.style.display = "flex";
  renderGallery();
}

window.switchToFeedView = switchToFeedView;

function resetFilters() {
  appState.searchQuery = "";
  appState.selectedAspect = "all";
  searchInput.value = "";
  clearSearchBtn.classList.add("hidden");

  document.querySelectorAll(".filter-chip").forEach((btn) => {
    if (btn.dataset.aspect === "all") {
      btn.classList.add("bg-brand-text", "text-brand-bg", "font-semibold");
      btn.classList.remove("bg-brand-surface", "text-brand-muted", "border");
    } else {
      btn.classList.remove("bg-brand-text", "text-brand-bg", "font-semibold");
      btn.classList.add("bg-brand-surface", "text-brand-muted", "border");
    }
  });

  renderGallery();
}

window.resetFilters = resetFilters;

/* Lightbox Modal Logic */
window.openLightbox = function (id) {
  const displayPhotos = getDisplayPhotos();
  const idx = displayPhotos.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return;

  appState.currentLightboxIndex = idx;
  updateLightboxContent();

  lightbox.classList.remove("hidden");
  setTimeout(() => {
    lightbox.classList.remove("opacity-0");
  }, 10);
  document.body.style.overflow = "hidden";
};

function updateLightboxContent() {
  const displayPhotos = getDisplayPhotos();
  const photo = displayPhotos[appState.currentLightboxIndex];
  if (!photo) return;

  // High res full display url
  lightboxImg.src = photo.download_url;
  lightboxAuthor.textContent = photo.author;
  lightboxMeta.textContent = `${photo.width} × ${photo.height}px • ${photo.aspect.toUpperCase()}`;
  lightboxIndex.textContent = `FRAME ${appState.currentLightboxIndex + 1} OF ${displayPhotos.length}`;
  lightboxOriginalLink.href = photo.url;

  updateLightboxHeart();
}

function updateLightboxHeart() {
  const displayPhotos = getDisplayPhotos();
  const photo = displayPhotos[appState.currentLightboxIndex];
  if (!photo) return;

  const saved = isPhotoSaved(photo.id);
  const icon = lightboxSaveBtn.querySelector(".heart-icon");
  if (saved) {
    icon.setAttribute("fill", "#f24e1e");
    icon.setAttribute("stroke", "#f24e1e");
    lightboxSaveBtn.classList.add("border-brand-accent");
  } else {
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    lightboxSaveBtn.classList.remove("border-brand-accent");
  }
}

function closeLightbox() {
  lightbox.classList.add("opacity-0");
  setTimeout(() => {
    lightbox.classList.add("hidden");
    document.body.style.overflow = "auto";
  }, 300);
}

function nextLightboxPhoto() {
  const displayPhotos = getDisplayPhotos();
  if (displayPhotos.length === 0) return;
  appState.currentLightboxIndex =
    (appState.currentLightboxIndex + 1) % displayPhotos.length;
  updateLightboxContent();
}

function prevLightboxPhoto() {
  const displayPhotos = getDisplayPhotos();
  if (displayPhotos.length === 0) return;
  appState.currentLightboxIndex =
    (appState.currentLightboxIndex - 1 + displayPhotos.length) %
    displayPhotos.length;
  updateLightboxContent();
}

/* Download Image Helper */
async function downloadCurrentImage() {
  const displayPhotos = getDisplayPhotos();
  const photo = displayPhotos[appState.currentLightboxIndex];
  if (!photo) return;

  try {
    const response = await fetch(photo.download_url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `grain-${photo.id}-${photo.author.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    window.open(photo.download_url, "_blank");
  }
}

/* Setup Event Listeners */
function initEventListeners() {
  // Saved Mode Toggle
  savedToggleBtn.addEventListener("click", () => {
    if (appState.viewMode === "saved") {
      switchToFeedView();
    } else {
      switchToSavedView();
    }
  });

  backToFeedBtn.addEventListener("click", switchToFeedView);
  brandLogo.addEventListener("click", (e) => {
    e.preventDefault();
    switchToFeedView();
    resetFilters();
  });

  // Search input debouncing
  let searchTimeout = null;
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.length > 0) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      appState.searchQuery = val;
      renderGallery();
    }, 200);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    appState.searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    renderGallery();
  });

  // Aspect Filter Chips
  filterChips.addEventListener("click", (e) => {
    const target = e.target.closest(".filter-chip");
    if (!target) return;

    const aspect = target.dataset.aspect;
    appState.selectedAspect = aspect;

    document.querySelectorAll(".filter-chip").forEach((btn) => {
      if (btn === target) {
        btn.classList.add("bg-brand-text", "text-brand-bg", "font-semibold");
        btn.classList.remove("bg-brand-surface", "text-brand-muted", "border");
      } else {
        btn.classList.remove("bg-brand-text", "text-brand-bg", "font-semibold");
        btn.classList.add("bg-brand-surface", "text-brand-muted", "border");
      }
    });

    renderGallery();
  });

  // Lightbox Controls
  lightboxCloseBtn.addEventListener("click", closeLightbox);
  nextPhotoBtn.addEventListener("click", nextLightboxPhoto);
  prevPhotoBtn.addEventListener("click", prevLightboxPhoto);
  downloadBtn.addEventListener("click", downloadCurrentImage);

  lightboxSaveBtn.addEventListener("click", () => {
    const displayPhotos = getDisplayPhotos();
    const photo = displayPhotos[appState.currentLightboxIndex];
    if (photo) {
      toggleSavePhoto(photo);
    }
  });

  // Keyboard Shortcuts for Lightbox
  window.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextLightboxPhoto();
    if (e.key === "ArrowLeft") prevLightboxPhoto();
  });

  // Infinite Scroll Intersection Observer
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && appState.viewMode === "feed") {
        fetchPhotos();
      }
    },
    { rootMargin: "300px" },
  );

  observer.observe(scrollSentinel);
}

/* Initialize App */
window.onload = function () {
  loadSavedPhotos();
  initEventListeners();
  fetchPhotos();
};
