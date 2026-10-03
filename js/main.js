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

const videoCategories = ["All", "Sports", "Travel"];
const sportsCategories = [
    "Swimming",
    "Soccer",
    "Wrestling",
    "Baseball",
    "Volleyball",
    "Hockey"
];

const photoGrid = document.getElementById("photo-grid");
const videoGrid = document.getElementById("video-grid");
const photoFilters = document.getElementById("photo-filters");
const videoFilters = document.getElementById("video-filters");
const scrollProgress = document.querySelector(".scroll-progress");
const scrollProgressFill = document.querySelector(".scroll-progress-fill");
const backToTopButton = document.getElementById("back-to-top");

let media = { photos: [], videos: [] };
let activePhotoCategory = "All";
let activeVideoCategory = "All";
let browsingPhotos = false;
let browsingVideos = false;

/* SAFE CONTENT / HELPERS */
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function photoMatchesCategory(photo, category) {
    if (category === "All") return true;
    if (category === "Sports") return sportsCategories.includes(photo.category);
    return photo.category === category;
}

function getPhotosForCategory(category) {
    return media.photos.filter(photo => photoMatchesCategory(photo, category));
}

function videoMatchesCategory(video, category) {
    return category === "All" || video.category === category;
}

function getVideosForCategory(category) {
    return media.videos.filter(video => videoMatchesCategory(video, category));
}

/* SCROLL TO SECTION */
function scrollToSection(section) {
    if (!section) return;

    requestAnimationFrame(() => {
        const top = section.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
            top: Math.max(0, top),
            behavior: "smooth"
        });
    });
}

/* UNIQUE PHOTO THUMBNAILS */
const usedPhotoThumbnails = new Set();

function photoThumbnailFor(category) {
    const photos = getPhotosForCategory(category);

    /*
     * The All Photos collection always uses the LAST photo
     * in the Travel category as its thumbnail.
     *
     * Because this reads directly from the Travel array,
     * changing the order of Travel photos automatically
     * changes the All Photos thumbnail.
     */
    if (category === "All") {
        const travelPhotos = getPhotosForCategory("Travel");
        const lastTravelPhoto = travelPhotos[travelPhotos.length - 1];

        if (lastTravelPhoto?.src) {
            return lastTravelPhoto.src;
        }
    }

    for (const photo of photos) {
        if (!photo?.src) continue;

        if (!usedPhotoThumbnails.has(photo.src)) {
            usedPhotoThumbnails.add(photo.src);
            return photo.src;
        }
    }

    return photos[0]?.src || "";
}

/* UNIQUE VIDEO THUMBNAILS */
const usedVideoThumbnails = new Set();

function getVideoThumbnail(video) {
    if (!video) return "";

    if (video.thumb) {
        return video.thumb;
    }

    if (video.id) {
        return `https://img.youtube.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`;
    }

    return "";
}

function videoThumbnailFor(category) {
    const videos = getVideosForCategory(category);

    for (const video of videos) {
        const thumbnail = getVideoThumbnail(video);

        if (!thumbnail) continue;

        if (!usedVideoThumbnails.has(thumbnail)) {
            usedVideoThumbnails.add(thumbnail);
            return thumbnail;
        }
    }

    return getVideoThumbnail(videos[0]);
}

function imageMarkup(src, alt, className) {
    if (!src) {
        return `<span class="collection-card-placeholder" aria-hidden="true"></span>`;
    }

    return `<img class="${className}" src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy">`;
}

function wireImageFallbacks(container) {
    container.querySelectorAll("img").forEach(image => {
        image.addEventListener("error", () => {
            const placeholder = document.createElement("span");
            placeholder.className = "collection-card-placeholder";
            placeholder.setAttribute("aria-hidden", "true");
            image.replaceWith(placeholder);
        }, { once: true });
    });
}

/* SCROLL PROGRESS */
function updateScrollProgress() {
    if (!scrollProgress || !scrollProgressFill || !backToTopButton) return;

    const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

    const scrollPosition = window.scrollY;

    const progress = scrollableHeight > 0
        ? Math.min(100, Math.max(0, (scrollPosition / scrollableHeight) * 100))
        : 0;

    scrollProgressFill.style.width = `${progress}%`;

    scrollProgress.setAttribute(
        "aria-valuenow",
        String(Math.round(progress))
    );

    backToTopButton.hidden = scrollPosition <= 20;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

/* BACK TO TOP */
if (backToTopButton) {
    backToTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

/* LOAD MEDIA */
async function loadMedia() {
    try {
        const response = await fetch("media.json");

        if (!response.ok) {
            throw new Error("Could not load media.json");
        }

        const loadedMedia = await response.json();

        media = {
            photos: Array.isArray(loadedMedia.photos)
                ? loadedMedia.photos
                : [],

            videos: Array.isArray(loadedMedia.videos)
                ? loadedMedia.videos
                : []
        };

        usedPhotoThumbnails.clear();
        usedVideoThumbnails.clear();

        renderPhotoFilters();
        renderVideoFilters();
        renderPhotos();
        renderVideos();
        setBrowsingVisibility();

    } catch (error) {
        console.error(error);

        if (photoFilters) {
            photoFilters.innerHTML =
                '<p class="empty-message">Photo collections could not be loaded.</p>';
        }

        if (videoFilters) {
            videoFilters.innerHTML =
                '<p class="empty-message">Video collections could not be loaded.</p>';
        }

        if (photoGrid) {
            photoGrid.innerHTML =
                '<p class="empty-message">No photos have been added yet.</p>';
        }

        if (videoGrid) {
            videoGrid.innerHTML =
                '<p class="empty-message">No videos have been added yet.</p>';
        }
    }
}

function setBrowsingVisibility() {
    if (photoFilters) photoFilters.hidden = false;
    if (photoGrid) photoGrid.hidden = !browsingPhotos;

    if (videoFilters) videoFilters.hidden = false;
    if (videoGrid) videoGrid.hidden = !browsingVideos;
}

/* PHOTO COLLECTION SELECTOR */
function renderPhotoFilters() {
    if (!photoFilters) return;

    usedPhotoThumbnails.clear();

    photoFilters.classList.add("collection-selector");

    photoFilters.innerHTML = photoCategories.map(category => {
        const title = category === "All"
            ? "All Photos"
            : category;

        const thumbnail = photoThumbnailFor(category);
        const count = getPhotosForCategory(category).length;

        const mediaMarkup = imageMarkup(
            thumbnail,
            "",
            "collection-card-image"
        );

        return `
            <button
                class="collection-card photo-collection-card${thumbnail ? " has-image" : " is-empty"}"
                type="button"
                data-category="${escapeHTML(category)}"
                aria-label="Open ${escapeHTML(title)} collection${count ? `, ${count} photos` : ", no photos yet"}"
            >
                ${mediaMarkup}
                <span class="collection-card-shade" aria-hidden="true"></span>
                <span class="collection-card-title">${escapeHTML(title)}</span>
                <span class="collection-card-count">${count} ${count === 1 ? "photo" : "photos"}</span>
            </button>`;
    }).join("");

    photoFilters
        .querySelectorAll(".photo-collection-card")
        .forEach(button => {
            button.addEventListener("click", () => {
                activePhotoCategory = button.dataset.category;
                browsingPhotos = true;

                renderPhotoNavigation();
                renderPhotos();
                setBrowsingVisibility();

                scrollToSection(document.getElementById("photos"));
            });
        });

    wireImageFallbacks(photoFilters);
}

function renderPhotoNavigation() {
    if (!photoFilters) return;

    const title = activePhotoCategory === "All"
        ? "All Photos"
        : activePhotoCategory;

    photoFilters.classList.remove("collection-selector");

    photoFilters.innerHTML = `
        <div class="collection-navigation">
            <button
                class="all-collections-button"
                type="button"
                data-action="all-photos"
            >← All collections</button>

            <span class="collection-current-title">
                ${escapeHTML(title)}
            </span>
        </div>`;

    photoFilters
        .querySelector("[data-action='all-photos']")
        .addEventListener("click", () => {
            browsingPhotos = false;
            activePhotoCategory = "All";

            renderPhotoFilters();
            setBrowsingVisibility();

            scrollToSection(document.getElementById("photos"));
        });
}

/* VIDEO COLLECTION SELECTOR */
function renderVideoFilters() {
    if (!videoFilters) return;

    usedVideoThumbnails.clear();

    videoFilters.classList.add(
        "collection-selector",
        "video-collection-selector"
    );

    videoFilters.innerHTML = videoCategories.map(category => {
        const title = category === "All"
            ? "All Videos"
            : category;

        const thumbnail = videoThumbnailFor(category);
        const count = getVideosForCategory(category).length;

        const mediaMarkup = imageMarkup(
            thumbnail,
            "",
            "collection-card-image"
        );

        return `
            <button
                class="collection-card video-collection-card${thumbnail ? " has-image" : " is-empty"}"
                type="button"
                data-category="${escapeHTML(category)}"
                aria-label="Open ${escapeHTML(title)} collection${count ? `, ${count} videos` : ", no videos yet"}"
            >
                ${mediaMarkup}
                <span class="collection-card-shade" aria-hidden="true"></span>
                <span class="collection-card-title">${escapeHTML(title)}</span>
                <span class="collection-card-count">${count} ${count === 1 ? "video" : "videos"}</span>
            </button>`;
    }).join("");

    videoFilters
        .querySelectorAll(".video-collection-card")
        .forEach(button => {
            button.addEventListener("click", () => {
                activeVideoCategory = button.dataset.category;
                browsingVideos = true;

                renderVideoNavigation();
                renderVideos();
                setBrowsingVisibility();

                scrollToSection(document.getElementById("videos"));
            });
        });

    wireImageFallbacks(videoFilters);
}

function renderVideoNavigation() {
    if (!videoFilters) return;

    const title = activeVideoCategory === "All"
        ? "All Videos"
        : activeVideoCategory;

    videoFilters.classList.remove(
        "collection-selector",
        "video-collection-selector"
    );

    videoFilters.innerHTML = `
        <div class="collection-navigation">
            <button
                class="all-collections-button"
                type="button"
                data-action="all-videos"
            >← All collections</button>

            <span class="collection-current-title">
                ${escapeHTML(title)}
            </span>
        </div>`;

    videoFilters
        .querySelector("[data-action='all-videos']")
        .addEventListener("click", () => {
            browsingVideos = false;
            activeVideoCategory = "All";

            renderVideoFilters();
            setBrowsingVisibility();

            scrollToSection(document.getElementById("videos"));
        });
}

/* PHOTOS */
function renderPhotos() {
    if (!photoGrid) return;

    const photos = getPhotosForCategory(activePhotoCategory);

    if (photos.length === 0) {
        const title = activePhotoCategory === "All"
            ? "photos"
            : `${escapeHTML(activePhotoCategory)} photos`;

        photoGrid.innerHTML =
            `<p class="empty-message">No ${title} have been added yet.</p>`;

        return;
    }

    photoGrid.innerHTML = photos.map(photo => `
        <article class="card">
            <img
                class="card-art"
                src="${escapeHTML(photo.src || "")}"
                alt="${escapeHTML(photo.title || "Portfolio photograph")}"
                loading="lazy"
            >

            <div class="card-meta">
                <span class="card-title">
                    ${escapeHTML(photo.title || "")}
                </span>

                <span class="card-type">
                    ${escapeHTML(photo.type || photo.category || "")}
                </span>
            </div>
        </article>
    `).join("");

    photoGrid.querySelectorAll(".card img").forEach(image => {
        image.addEventListener("error", () => {
            image.alt = "Photograph unavailable";
            image.classList.add("image-unavailable");
            image.removeAttribute("src");
        }, { once: true });
    });
}

/* VIDEOS */
function renderVideos() {
    if (!videoGrid) return;

    const videos = getVideosForCategory(activeVideoCategory);

    if (videos.length === 0) {
        const title = activeVideoCategory === "All"
            ? "videos"
            : `${escapeHTML(activeVideoCategory)} videos`;

        videoGrid.innerHTML =
            `<p class="empty-message">No ${title} have been added yet.</p>`;

        return;
    }

    videoGrid.innerHTML = videos.map(video => {
        const thumbnail = getVideoThumbnail(video);

        return `
            <article
                class="card video${thumbnail ? "" : " video-no-thumbnail"}"
                data-video-id="${escapeHTML(video.id || "")}"
                tabindex="0"
                role="button"
                aria-label="Play ${escapeHTML(video.title || "video")}"
            >
                ${
                    thumbnail
                        ? `<img
                            class="card-art"
                            src="${escapeHTML(thumbnail)}"
                            alt="${escapeHTML(video.title || "Video thumbnail")}"
                            loading="lazy"
                            draggable="false"
                        >`
                        : '<span class="video-thumbnail-placeholder" aria-hidden="true"></span>'
                }

                <span
                    class="video-play-icon"
                    aria-hidden="true"
                ></span>

                <div class="card-meta">
                    <span class="card-title">
                        ${escapeHTML(video.title || "Untitled video")}
                    </span>

                    <span class="card-type">
                        Video · ${escapeHTML(video.category || "")}
                    </span>
                </div>
            </article>`;
    }).join("");

    videoGrid.querySelectorAll(".card.video img").forEach(image => {
        image.addEventListener("error", () => {
            const placeholder = document.createElement("span");
            placeholder.className = "video-thumbnail-placeholder";
            placeholder.setAttribute("aria-hidden", "true");
            image.replaceWith(placeholder);
        }, { once: true });
    });
}

/*
 * Keep event delegation so video cards continue to work
 * after every filter change.
 */
if (videoGrid) {
    videoGrid.addEventListener("click", event => {
        const card = event.target.closest(".video[data-video-id]");

        if (!card || !videoGrid.contains(card)) return;

        const videoId = card.dataset.videoId;

        if (!videoId) return;

        openYouTubeVideo(videoId);
    });

    videoGrid.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;

        const card = event.target.closest(".video[data-video-id]");

        if (!card || !videoGrid.contains(card)) return;

        const videoId = card.dataset.videoId;

        if (!videoId) return;

        event.preventDefault();
        openYouTubeVideo(videoId);
    });
}

/* YOUTUBE MODAL PLAYER */
function openYouTubeVideo(videoId) {
    let modal = document.getElementById("youtube-modal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "youtube-modal";

        modal.innerHTML = `
            <div class="youtube-modal-backdrop"></div>

            <div
                class="youtube-modal-content"
                role="dialog"
                aria-modal="true"
                aria-label="YouTube video player"
            >
                <button
                    class="youtube-modal-close"
                    type="button"
                    aria-label="Close video"
                >×</button>

                <div class="youtube-player-wrap"></div>
            </div>`;

        document.body.appendChild(modal);

        modal.querySelector(".youtube-modal-close")
            .addEventListener("click", closeYouTubeVideo);

        modal.querySelector(".youtube-modal-backdrop")
            .addEventListener("click", closeYouTubeVideo);
    }

    modal.querySelector(".youtube-player-wrap").innerHTML = `
        <iframe
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"
            title="YouTube video player"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowfullscreen
        ></iframe>`;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";

    modal.querySelector(".youtube-modal-close").focus();
}

function closeYouTubeVideo() {
    const modal = document.getElementById("youtube-modal");

    if (!modal) return;

    modal.querySelector(".youtube-player-wrap").innerHTML = "";

    modal.classList.remove("open");
    document.body.style.overflow = "";
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeYouTubeVideo();
    }
});

/* INITIALIZE */
updateScrollProgress();
loadMedia();
