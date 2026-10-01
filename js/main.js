
const photoCategories = [
    "All",
    "Sports",
    "Swimming",
    "Soccer",
    "Wrestling",
    "Baseball",
    "Volleyball",
    "Hockey",
    "Seniors",
    "Travel"
];

const videoCategories = [
    "All",
    "Sports",
    "Travel"
];

const photoGrid = document.getElementById("photo-grid");
const videoGrid = document.getElementById("video-grid");
const photoFilters = document.getElementById("photo-filters");
const videoFilters = document.getElementById("video-filters");

const scrollProgress = document.querySelector(".scroll-progress");
const scrollProgressFill = document.querySelector(".scroll-progress-fill");
const backToTopButton = document.getElementById("back-to-top");

let media = {
    photos: [],
    videos: []
};

let activePhotoCategory = "All";
let activeVideoCategory = "All";


/* =========================
   SCROLL PROGRESS
========================= */

function updateScrollProgress() {
    const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

    const scrollPosition = window.scrollY;

    let progress = 0;

    if (scrollableHeight > 0) {
        progress = Math.min(
            100,
            Math.max(0, (scrollPosition / scrollableHeight) * 100)
        );
    }

    scrollProgressFill.style.width = `${progress}%`;

    scrollProgress.setAttribute(
        "aria-valuenow",
        String(Math.round(progress))
    );

    // Show the button only after leaving the top of the page.
    backToTopButton.hidden = scrollPosition <= 20;
}

window.addEventListener("scroll", updateScrollProgress, {
    passive: true
});

window.addEventListener("resize", updateScrollProgress);


/* =========================
   BACK TO TOP
========================= */

backToTopButton.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


/* =========================
   LOAD MEDIA
========================= */

async function loadMedia() {
    try {
        const response = await fetch("media.json");

        if (!response.ok) {
            throw new Error("Could not load media.json");
        }

        media = await response.json();

        renderPhotoFilters();
        renderVideoFilters();
        renderPhotos();
        renderVideos();

    } catch (error) {
        console.error(error);

        photoGrid.innerHTML =
            '<p class="empty-message">No photos have been added yet.</p>';

        videoGrid.innerHTML =
            '<p class="empty-message">No videos have been added yet.</p>';
    }
}


/* =========================
   PHOTO FILTERS
========================= */

function renderPhotoFilters() {
    photoFilters.innerHTML = photoCategories
        .map(category => `
            <button
                class="filter ${category === activePhotoCategory ? "active" : ""}"
                data-category="${category}"
                type="button"
            >
                ${category}
            </button>
        `)
        .join("");

    photoFilters.querySelectorAll(".filter").forEach(button => {
        button.addEventListener("click", () => {
            activePhotoCategory = button.dataset.category;

            renderPhotoFilters();
            renderPhotos();
        });
    });
}


/* =========================
   VIDEO FILTERS
========================= */

function renderVideoFilters() {
    videoFilters.innerHTML = videoCategories
        .map(category => `
            <button
                class="filter ${category === activeVideoCategory ? "active" : ""}"
                data-category="${category}"
                type="button"
            >
                ${category}
            </button>
        `)
        .join("");

    videoFilters.querySelectorAll(".filter").forEach(button => {
        button.addEventListener("click", () => {
            activeVideoCategory = button.dataset.category;

            renderVideoFilters();
            renderVideos();
        });
    });
}


/* =========================
   PHOTOS
========================= */

function renderPhotos() {
    let photos = media.photos;

    if (activePhotoCategory !== "All") {
        if (activePhotoCategory === "Sports") {
            photos = photos.filter(photo =>
                [
                    "Swimming",
                    "Soccer",
                    "Wrestling",
                    "Baseball",
                    "Volleyball",
                    "Hockey"
                ].includes(photo.category)
            );
        } else {
            photos = photos.filter(photo =>
                photo.category === activePhotoCategory
            );
        }
    }

    if (photos.length === 0) {
        photoGrid.innerHTML =
            '<p class="empty-message">No photos in this category yet.</p>';
        return;
    }

    photoGrid.innerHTML = photos
        .map(photo => `
            <article class="card">
                <img
                    class="card-art"
                    src="${photo.src}"
                    alt="${photo.title}"
                    loading="lazy"
                >

                <div class="card-meta"></div>
            </article>
        `)
        .join("");
}


/* =========================
   VIDEOS
========================= */

function renderVideos() {
    let videos = media.videos;

    if (activeVideoCategory !== "All") {
        videos = videos.filter(video =>
            video.category === activeVideoCategory
        );
    }

    if (videos.length === 0) {
        videoGrid.innerHTML =
            '<p class="empty-message">No videos in this category yet.</p>';
        return;
    }

    videoGrid.innerHTML = videos
        .map(video => `
            <article class="card video">
                <video
                    class="card-art"
                    controls
                    preload="metadata"
                    src="${video.src}"
                ></video>

                <div class="card-meta">
                    <span class="card-title">${video.title}</span>
                    <span class="card-type">${video.type}</span>
                </div>
            </article>
        `)
        .join("");
}


/* =========================
   INITIALIZE
========================= */

// Set the correct initial state before the user scrolls.
updateScrollProgress();

// Load the portfolio media and render its filters.
loadMedia();