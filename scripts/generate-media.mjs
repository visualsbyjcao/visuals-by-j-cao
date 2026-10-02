import fs from "fs";
import path from "path";

const root = process.cwd();

const sports = ["swimming", "soccer", "wrestling", "baseball", "volleyball", "hockey"];
const photoFolders = [...sports, "seniors", "travel"];
const photoExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function getFiles(folder) {
    if (!fs.existsSync(folder)) return [];
    return fs
        .readdirSync(folder)
        .filter(f => photoExtensions.includes(path.extname(f).toLowerCase()))
        .sort();
}

/* ---------- Photos ---------- */

const photos = [];

for (const category of photoFolders) {
    for (const file of getFiles(path.join(root, "photos", category))) {
        photos.push({
            category: cap(category),
            group: sports.includes(category) ? "Sports" : cap(category),
            alt: `${cap(category)} photograph by Visuals by J Cao`,
            src: `photos/${category}/${file}`
        });
    }
}

/* ---------- Videos (YouTube) ---------- */

const idPattern = /^[\w-]{11}$/;

function parseYouTubeId(input) {
    const s = String(input || "").trim();
    if (idPattern.test(s)) return s;
    try {
        const u = new URL(s);
        const host = u.hostname.replace(/^www\./, "");
        let id = null;
        if (host === "youtu.be") {
            id = u.pathname.slice(1).split("/")[0];
        } else if (host.endsWith("youtube.com")) {
            id =
                u.searchParams.get("v") ||
                u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
        }
        return idPattern.test(id || "") ? id : null;
    } catch {
        return null;
    }
}

// No API key needed. Returns null on any failure (offline, private/deleted video).
async function fetchTitle(id) {
    try {
        const watch = `https://www.youtube.com/watch?v=${id}`;
        const res = await fetch(
            `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) return null;
        return (await res.json()).title || null;
    } catch {
        return null;
    }
}

const videos = [];
const videoConfigPath = path.join(root, "videos", "videos.json");

if (fs.existsSync(videoConfigPath)) {
    const entries = JSON.parse(fs.readFileSync(videoConfigPath, "utf8"));

    for (const entry of entries) {
        const id = parseYouTubeId(entry.url || entry.id);

        if (!id) {
            console.warn(`Skipping video with invalid URL/ID: ${entry.url || entry.id}`);
            continue;
        }
        if (!entry.category) {
            console.warn(`Skipping video ${id}: missing "category".`);
            continue;
        }

        let title = entry.title || (await fetchTitle(id));
        if (!title) {
            console.warn(`Could not get a title for ${id}; using "Video". Add "title" in videos.json to override.`);
            title = "Video";
        }

        videos.push({
            id,
            title,
            category: entry.category,
            thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
        });
    }
}

fs.writeFileSync(
    path.join(root, "media.json"),
    JSON.stringify({ photos, videos }, null, 2) + "\n"
);

console.log(`Generated media.json: ${photos.length} photos, ${videos.length} videos.`);
