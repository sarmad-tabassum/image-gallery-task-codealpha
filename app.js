/* ---------- 1. Data & Configuration ---------- */
// Ye humara main data hai jisme tasveeron ki details hain
const photosData = [
  {
    imageId: "dk-coast-01",
    category: "coast",
    title: "mom's favourite",
    details: "01 · PORTRA 400",
  },
  {
    imageId: "dk-city-04",
    category: "city",
    title: "it rained 3 min later",
    details: "02 · TRI-X",
  },
  {
    imageId: "dk-people-02",
    category: "people",
    title: "chacha, tea stall",
    details: "03 · PORTRA 400",
  },
  {
    imageId: "dk-coast-07",
    category: "coast",
    title: "waited 40 mins for this",
    details: "04 · GOLD 200",
  },
  {
    imageId: "dk-city-11",
    category: "city",
    title: "purple hour, no edits",
    details: "05 · TRI-X",
  },
  {
    imageId: "dk-people-09",
    category: "people",
    title: "she wasn't posing",
    details: "06 · PORTRA 400",
  },
  {
    imageId: "dk-coast-12",
    category: "coast",
    title: "wind, cold hands",
    details: "07 · GOLD 200",
  },
  {
    imageId: "dk-city-15",
    category: "city",
    title: "the pink scooter guy",
    details: "08 · TRI-X",
  },
  {
    imageId: "dk-people-18",
    category: "people",
    title: "my whole camera roll is this kid",
    details: "09 · PORTRA 400",
  },
  {
    imageId: "dk-coast-21",
    category: "coast",
    title: "film got stuck here",
    details: "10 · GOLD 200",
  },
  {
    imageId: "dk-city-23",
    category: "city",
    title: "smell of old paper",
    details: "11 · TRI-X",
  },
  {
    imageId: "dk-people-26",
    category: "people",
    title: "last frame on the roll",
    details: "12 · PORTRA 400",
  },
];

// Image ka URL generate karne ka function
const getImageUrl = (photo, width = 760, height = 950) => {
  return `https://picsum.photos/seed/${photo.imageId}/${width}/${height}.jpg`;
};

// Tasveeron ko thora sa tehra (rotate) dikhane ke liye angles
const rotationAngles = [-1.8, 1.4, -0.9, 2, -1.3, 0.8];

/* ---------- 2. Hero Words Animation ---------- */
// Ye function text ko words mein tod kar unpar animation apply karta hai
(function animateHeroText() {
  const heroTextElement = document.getElementById("big");
  let delayCounter = 0;

  const wrapWordsInSpans = (node) => {
    // Har child node ko check karein
    [...node.childNodes].forEach((childNode) => {
      if (childNode.nodeType === 3) {
        // Agar ye Text Node hai
        const fragment = document.createDocumentFragment();

        // Text ko spaces se alag karein aur har word ko span mein daal dein
        childNode.textContent
          .split(/\s+/)
          .filter(Boolean)
          .forEach((word) => {
            const wordWrapper = document.createElement("span");
            wordWrapper.className = "w";

            const italicTag = document.createElement("i");
            italicTag.textContent = word;
            // Har word ko thori der baad animate hone ke liye delay set karein
            italicTag.style.setProperty("--d", delayCounter++ * 70 + "ms");

            wordWrapper.appendChild(italicTag);
            fragment.appendChild(wordWrapper);
          });
        // Puraane text ko naye spans se replace karein
        node.replaceChild(fragment, childNode);
      } else if (childNode.nodeType === 1) {
        // Agar tag (element) hai, toh uske andar bhi check karein
        wrapWordsInSpans(childNode);
      }
    });
  };

  wrapWordsInSpans(heroTextElement);
})();

/* ---------- 3. Tape Marquee (Scrolling Text) ---------- */
// Marquee mein chalne wale jumlay (texts)
const filmNames = [
  "kodak portra 400",
  "ilford tri-x 400",
  "kodak gold 200",
  "expired film is a gamble",
  "shoot less, keep more",
];

// In texts ko HTML mein daal kar 2 dafa repeat kar rahe hain taake loop chalta rahe
const marqueeHTML = filmNames
  .map((filmName) => `<span>${filmName}</span><b>✦</b>`)
  .join("");
document.getElementById("mqt").innerHTML = marqueeHTML.repeat(2);

/* ---------- 4. Build Gallery Wall ---------- */
const wallElement = document.getElementById("wall");

// Har photo ke liye ek <figure> element banayen aur screen par show karein
const photoElements = photosData.map((photo, index) => {
  const figure = document.createElement("figure");
  figure.className = "print";

  // Array se ek rotation angle nikal kar apply karein
  figure.style.setProperty(
    "--r",
    rotationAngles[index % rotationAngles.length] + "deg",
  );

  // HTML set karein
  figure.innerHTML = `
    <img src="${getImageUrl(photo)}" alt="${photo.title}" loading="lazy" draggable="false">
    <figcaption>
      <span class="note">${photo.title}</span>
      <span class="no">${photo.details}</span>
    </figcaption>`;

  // Tasveer par click hone par Lightbox open karein
  figure.addEventListener("click", () =>
    openLightbox(visiblePhotos.indexOf(index), figure),
  );

  wallElement.appendChild(figure);
  return figure;
});

/* ---------- 5. Entrance Reveal Animation (Scroll par show hona) ---------- */
// Ye batata hai ke jab photo screen par nazar aaye toh usey fade-in karna hai
const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        scrollObserver.unobserve(entry.target); // Ek dafa show hone ke baad observe karna chhod dein
      }
    });
  },
  { threshold: 0.08 }, // Jab 8% tasveer nazar aa jaye toh trigger karein
);

photoElements.forEach((el, index) => {
  // 6 tasveeron ke batch mein delay set karein
  el.style.setProperty("--d", (index % 6) * 70 + "ms");
  scrollObserver.observe(el);
});

/* ---------- 6. 3D Tilt Effect (Sirf Mouse/Desktop ke liye) ---------- */
// Check karein ke user ke paas mouse hai (fine pointer)
if (matchMedia("(pointer:fine)").matches) {
  photoElements.forEach((figure) => {
    figure.addEventListener("mousemove", (event) => {
      const rect = figure.getBoundingClientRect();
      // Mouse ki position calculate karein -0.5 se 0.5 ke darmiyan
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      // Calculate kiye hue numbers ko 3D transform par apply karein
      figure.style.transform = `rotate(0deg) translateY(-8px) perspective(750px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
    });

    // Mouse hatne par photo wapis normal kar dein
    figure.addEventListener("mouseleave", () => {
      figure.style.transform = "";
    });
  });
}

/* ---------- 7. Custom Loupe Cursor ---------- */
if (matchMedia("(pointer:fine)").matches) {
  document.body.classList.add("cur");
  const customCursor = document.getElementById("cur");

  let targetX = 0,
    targetY = 0; // Mouse kahan hai
  let currentX = 0,
    currentY = 0; // Cursor ko kahan hona chahiye (smoothly move karne ke liye)

  // Mouse move hone par target values update karein
  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  // Cursor ko smoothly animate karne ka loop
  (function animateCursor() {
    currentX += (targetX - currentX) * 0.2;
    currentY += (targetY - currentY) * 0.2;
    customCursor.style.left = currentX + "px";
    customCursor.style.top = currentY + "px";
    requestAnimationFrame(animateCursor);
  })();

  // Jab mouse kisi tasveer par ho toh custom cursor show karein
  wallElement.addEventListener("mouseover", (event) => {
    const isHoveringPrint = !!event.target.closest(".print");
    customCursor.classList.toggle("show", isHoveringPrint);
  });

  wallElement.addEventListener("mouseleave", () =>
    customCursor.classList.remove("show"),
  );
}

/* ---------- 8. Filters & Animation (Gallery Sorting) ---------- */
// Pehle saari tasveerein visible hain (0, 1, 2, 3...)
let visiblePhotos = photosData.map((_, index) => index);
const visibleCountElement = document.getElementById("vis");
const filtersWrapper = document.getElementById("filters");

const categories = [
  ["all", "everything"],
  ["coast", "coast"],
  ["city", "city"],
  ["people", "people"],
];

// Filter buttons banayen
categories.forEach(([categoryId, label], index) => {
  const button = document.createElement("button");
  // Pehle button ko 'on' class dein
  button.className = "f" + (index === 0 ? " on" : "");

  // Button text aur tasveeron ki count set karein
  const count =
    categoryId === "all"
      ? photosData.length
      : photosData.filter((photo) => photo.category === categoryId).length;
  button.textContent = `${label} · ${count}`;

  // Filter button par click ka function
  button.addEventListener("click", () => {
    // Puraane active button se 'on' hatayen aur is par lagayen
    filtersWrapper.querySelector(".on").classList.remove("on");
    button.classList.add("on");

    // Check karein konsi tasveerein is category ki hain
    visiblePhotos = photosData
      .map((_, i) => i)
      .filter(
        (i) => categoryId === "all" || photosData[i].category === categoryId,
      );

    visibleCountElement.textContent = visiblePhotos.length;
    let delay = 0;

    // Tasveeron ko show ya hide karein smoothly
    photoElements.forEach((element, i) => {
      const isVisible = visiblePhotos.includes(i);

      if (isVisible) {
        element.classList.remove("hide");
        // Web Animations API ka use karke appear animation lagayen
        element.animate(
          [
            { opacity: 0, transform: "translateY(24px) scale(.95)" },
            {
              opacity: 1,
              transform: `rotate(${rotationAngles[i % rotationAngles.length]}deg)`,
            },
          ],
          {
            duration: 480,
            delay: delay++ * 55, // Har tasveer thori der baad aaye
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "backwards",
          },
        );
      } else {
        element.classList.add("hide");
      }
    });
  });

  filtersWrapper.appendChild(button);
});

/* ---------- 9. Lightbox (Fullscreen Image Viewer) ---------- */
const lightboxElement = document.getElementById("lb");
const lightboxImage = document.getElementById("lbImg");
const lightboxPrint = document.getElementById("lbPrint");
const lightboxStrip = document.getElementById("strip");

let currentIndex = 0; // Konsi tasveer khuli hai
let lastFocusedElement = null;

// Lightbox ke andar data load aur update karne ka function
function updateLightbox() {
  const photo = photosData[visiblePhotos[currentIndex]];

  // High quality image load karein
  lightboxImage.src = getImageUrl(photo, 1200, 1500);
  lightboxImage.alt = photo.title;

  // Animation ko dobara replay karne ka trick
  lightboxPrint.style.animation = "none";
  void lightboxPrint.offsetWidth; // DOM reflow
  lightboxPrint.style.animation = "";

  // Text details update karein
  document.getElementById("lbNote").textContent = photo.title;
  document.getElementById("lbNo").textContent = photo.details;

  // "FRAME 01 / 12" wala counter update karein
  document.getElementById("lbCount").textContent =
    `FRAME ${String(currentIndex + 1).padStart(2, "0")} / ${String(visiblePhotos.length).padStart(2, "0")}`;

  // Niche wali film strip mein active thumbnail update karein
  [...lightboxStrip.children].forEach((button, index) => {
    button.classList.toggle("on", index === currentIndex);
  });
}

// Lightbox kholne ka function
function openLightbox(clickedIndex, thumbnailElement) {
  currentIndex = clickedIndex;
  lastFocusedElement = document.activeElement;
  lightboxStrip.innerHTML = ""; // Purani thumbnails saaf karein

  // Niche strip (thumbnails) banayen
  visiblePhotos.forEach((photoIndex, arrayIndex) => {
    const thumbButton = document.createElement("button");
    thumbButton.innerHTML = `<img src="${getImageUrl(photosData[photoIndex], 108, 80)}" alt="">`;

    thumbButton.addEventListener("click", () => {
      currentIndex = arrayIndex;
      updateLightbox();
    });
    lightboxStrip.appendChild(thumbButton);
  });

  updateLightbox();

  // Lightbox show karein aur background scroll band karein
  lightboxElement.classList.add("on");
  document.body.style.overflow = "hidden";
  document.getElementById("lbX").focus();

  /* FLIP-style zoom animation: Choti tasveer ko center mein udta hua dikhayein */
  if (thumbnailElement) {
    const thumbnailImg = thumbnailElement.querySelector("img");
    const rect = thumbnailImg.getBoundingClientRect();

    // Tasveer ki ek copy banayen
    const clone = thumbnailImg.cloneNode();
    Object.assign(clone.style, {
      position: "fixed",
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      zIndex: 60,
      objectFit: "cover",
      pointerEvents: "none",
    });
    document.body.appendChild(clone);

    // Calculate karein ke is copy ko screen ke center mein kahan jana hai
    const translateX = (innerWidth - rect.width) / 2 - rect.left;
    const translateY = innerHeight * 0.42 - rect.height / 2;

    clone.animate(
      [
        { transform: "none", opacity: 1 },
        {
          transform: `translate(${translateX}px,${translateY}px) scale(.55)`,
          opacity: 0,
        },
      ],
      {
        duration: 430,
        easing: "cubic-bezier(.22,1,.36,1)",
        fill: "forwards",
      },
    );

    // Animation khatam hone ke baad copy ko delete kar dein
    setTimeout(() => clone.remove(), 440);
  }
}

// Lightbox band karne ka function
function closeLightbox() {
  lightboxElement.classList.remove("on");
  document.body.style.overflow = ""; // Background scroll wapis chalu karein
  if (lastFocusedElement) lastFocusedElement.focus();
}

// Next ya Previous photo par jane ka function
function changeSlide(direction) {
  currentIndex =
    (currentIndex + direction + visiblePhotos.length) % visiblePhotos.length;
  updateLightbox();
}

// Lightbox Controls ke Event Listeners (Clicks & Keyboard)
document.getElementById("lbX").addEventListener("click", closeLightbox);
document.getElementById("lbP").addEventListener("click", () => changeSlide(-1));
document.getElementById("lbN").addEventListener("click", () => changeSlide(1));

// Agar background dark area par click ho toh band kar dein
lightboxElement.addEventListener("click", (event) => {
  if (event.target === lightboxElement) closeLightbox();
});

// Keyboard Navigation
document.addEventListener("keydown", (event) => {
  if (!lightboxElement.classList.contains("on")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") changeSlide(1);
  if (event.key === "ArrowLeft") changeSlide(-1);
});

// Mobile Phones par Swipe Gesture Support
let startTouchX = 0;
lightboxElement.addEventListener(
  "touchstart",
  (event) => {
    startTouchX = event.touches[0].clientX;
  },
  { passive: true },
);

lightboxElement.addEventListener("touchend", (event) => {
  const swipeDistanceX = event.changedTouches[0].clientX - startTouchX;

  // Agar swipe ki length 50px se zyada ho toh slide change kar dein
  if (Math.abs(swipeDistanceX) > 50) {
    changeSlide(swipeDistanceX < 0 ? 1 : -1);
  }
});
