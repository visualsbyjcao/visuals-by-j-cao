import fs from "fs";
import path from "path";

const root = process.cwd();

const photoCategories = [
    "swimming",
    "soccer",
    "wrestling",
    "baseball",
    "volleyball",
    "hockey",
    "seniors",
    "travel"
];

const videoCategories = [
    "sports",
    "travel"
];

const photoExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const videoExtensions = [".mp4", ".webm", ".mov"];

function titleFromFilename(filename) {
    return path
        .parse(filename)
        .name
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function getFiles(folder, extensions) {
    if (!fs.existsSync(folder)) {
        return [];
    }

    return fs
        .readdirSync(folder)
        .filter(file => extensions.includes(path.extname(file).toLowerCase()))
        .sort();
}

const photos = [];

for (const category of photoCategories) {
    const folder = path.join(root, "photos", category);

    for (const file of getFiles(folder, photoExtensions)) {
        photos.push({
            category:
                category.charAt(0).toUpperCase() + category.slice(1),
            title: titleFromFilename(file),
            type: `Sports · ${category}`,
            src: `photos/${category}/${file}`
        });
    }
}

const videos = [];

for (const category of videoCategories) {
    const folder = path.join(root, "videos", category);

    for (const file of getFiles(folder, videoExtensions)) {
        videos.push({
            category:
                category.charAt(0).toUpperCase() + category.slice(1),
            title: titleFromFilename(file),
            type: `Video · ${category}`,
            src: `videos/${category}/${file}`
        });
    }
}

const media = {
    photos,
    videos
};

fs.writeFileSync(
    path.join(root, "media.json"),
    JSON.stringify(media, null, 2) + "\n"
);

console.log(
    `Generated media.json: ${photos.length} photos, ${videos.length} videos.`
);