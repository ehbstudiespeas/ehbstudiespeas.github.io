#!/usr/bin/env node

/**
 * Syncs Farm Talk episode data from Box into this static GitHub Pages site.
 *
 * Required secrets: BOX_CLIENT_ID, BOX_CLIENT_SECRET, BOX_REFRESH_TOKEN.
 * The Box OAuth app should have least-privilege access to the Farm Talk folder.
 * Set FARM_TALK_AUDIO_MODE=repository to copy MP3s to assets/audio/farm-talk.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const rootFolderId = process.env.BOX_FARM_TALK_FOLDER_ID || "388261523128";
const outputPath = "assets/data/farm-talk-episodes.json";
const audioDirectory = "assets/audio/farm-talk";
const audioMode = process.env.FARM_TALK_AUDIO_MODE || "metadata";
const streamEmbedUrl = process.env.WTBQ_STREAM_EMBED_URL || "";
const streamFallbackUrl = process.env.WTBQ_STREAM_FALLBACK_URL || "https://das-edge14-live365-dal02.cdnstream.com/a00215";
const existingPayload = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, "utf8")) : { episodes: [] };
const existingByDate = new Map(existingPayload.episodes.map((episode) => [episode.date, episode]));

for (const key of ["BOX_CLIENT_ID", "BOX_CLIENT_SECRET", "BOX_REFRESH_TOKEN"]) {
  if (!process.env[key]) throw new Error(`Missing required ${key} secret.`);
}

function cleanText(value) {
  return value.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&apos;/g, "'").trim();
}

function xmlToText(xml) {
  return xml.replace(/<w:p[^>]*>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
}

function parseDate(folderName) {
  const named = folderName.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})[,]?\s+(\d{4})\b/i);
  if (named) {
    const month = new Date(`${named[1]} 1, 2000`).getMonth() + 1;
    return `${named[3]}-${String(month).padStart(2, "0")}-${String(named[2]).padStart(2, "0")}`;
  }
  const numeric = folderName.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\b/);
  if (!numeric) return null;
  const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
  return `${year}-${String(numeric[1]).padStart(2, "0")}-${String(numeric[2]).padStart(2, "0")}`;
}

function guestFromFolder(name) {
  return cleanText(name
    .replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}[,]?\s+\d{4}\b/i, "")
    .replace(/\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}\b/, "")
    .replace(/\s+$/, ""));
}

function slugify(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function docxText(buffer) {
  const temporary = mkdtempSync(join(tmpdir(), "farm-talk-"));
  const input = join(temporary, "notes.docx");
  try {
    writeFileSync(input, buffer);
    return xmlToText(execFileSync("unzip", ["-p", input, "word/document.xml"], { encoding: "utf8" }));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

function extractDetails(text, guest, previous = {}) {
  const paragraphs = text.split(/\n+/).map(cleanText).filter(Boolean);
  const opening = paragraphs.find((paragraph) => /this week|today|devoting|speaking with/i.test(paragraph)) || paragraphs[0] || "";
  const sentences = opening.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const summary = cleanText(sentences.slice(0, 2).join(" ")).slice(0, 360) || previous.summary || `A Farm Talk conversation with ${guest}.`;
  const titleMatch = text.match(/\b(?:is|serves as|works as)\s+(?:now\s+)?(?:an?\s+)?(Assistant Professor|Associate Professor|Professor|CEO|Director|Owner|Educator|Researcher)[^.]{0,170}/i);
  const derivedTitle = titleMatch ? cleanText(titleMatch[0].replace(/^\b(?:is|serves as|works as)\s+(?:now\s+)?/i, "")) : "";
  const title = previous.title && !/^Farm Talk guests?$/i.test(previous.title) ? previous.title : (derivedTitle || previous.title || "Farm Talk guest");
  const topics = paragraphs.filter((paragraph) => /^Topic\s*\d+/i.test(paragraph)).map((paragraph) => cleanText(paragraph.replace(/^Topic\s*\d+\s*[:.]?\s*/i, "").split(/[?.]/)[0])).filter(Boolean).slice(0, 4);
  return { summary, title: title.slice(0, 180), topics: topics.length ? topics : (previous.topics || []) };
}

async function boxToken() {
  const form = new URLSearchParams({ grant_type: "refresh_token", refresh_token: process.env.BOX_REFRESH_TOKEN, client_id: process.env.BOX_CLIENT_ID, client_secret: process.env.BOX_CLIENT_SECRET });
  const response = await fetch("https://api.box.com/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) throw new Error(`Box OAuth refresh failed: ${response.status}`);
  return (await response.json()).access_token;
}

async function boxFetch(token, path, options = {}) {
  const response = await fetch(`https://api.box.com/2.0${path}`, { ...options, headers: { authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Box API ${path} failed: ${response.status}`);
  return response;
}

async function listItems(token, folderId) {
  const entries = [];
  let offset = 0;
  do {
    const response = await boxFetch(token, `/folders/${folderId}/items?limit=100&offset=${offset}&fields=id,name,type,extension`);
    const page = await response.json();
    entries.push(...page.entries);
    offset += page.entries.length;
    if (offset >= page.total_count || page.entries.length === 0) break;
  } while (true);
  return entries;
}

async function download(token, fileId) {
  const response = await boxFetch(token, `/files/${fileId}/content`, { redirect: "follow" });
  return Buffer.from(await response.arrayBuffer());
}

async function syncEpisode(token, folder) {
  const date = parseDate(folder.name);
  if (!date) {
    console.warn(`Skipping folder without a recognizable broadcast date: ${folder.name}`);
    return null;
  }
  const previous = existingByDate.get(date) || {};
  // Keep a curated multi-guest name when a folder name only lists part of the program.
  const guest = previous.guest || guestFromFolder(folder.name);
  const contents = await listItems(token, folder.id);
  const showNotes = contents.find((item) => item.type === "file" && item.extension === "docx" && /show notes/i.test(item.name));
  const audio = contents.find((item) => item.type === "file" && item.extension === "mp3");
  let details = { title: previous.title || "Farm Talk guest", summary: previous.summary || `A Farm Talk conversation with ${guest}.`, topics: previous.topics || [] };
  if (showNotes) details = extractDetails(docxText(await download(token, showNotes.id)), guest, previous);
  else console.warn(`No show notes found for ${folder.name}; retaining existing episode details where available.`);
  let audioUrl = "";
  if (audio && audioMode === "repository") {
    mkdirSync(audioDirectory, { recursive: true });
    const filename = `${date}-${slugify(guest)}.mp3`;
    const destination = join(audioDirectory, filename);
    if (!existsSync(destination) || previous.boxAudioId !== audio.id) writeFileSync(destination, await download(token, audio.id));
    audioUrl = destination;
  }
  return { date, guest, ...details, audioUrl, boxFolderId: folder.id, boxShowNotesId: showNotes?.id || "", boxAudioId: audio?.id || "" };
}

async function main() {
  const token = await boxToken();
  const folders = (await listItems(token, rootFolderId)).filter((item) => item.type === "folder" && item.name !== "Farm Talk Eps");
  const seenDates = new Set();
  const episodes = [];
  for (const folder of folders) {
    const episode = await syncEpisode(token, folder);
    if (!episode) continue;
    if (seenDates.has(episode.date)) throw new Error(`More than one Farm Talk folder resolves to ${episode.date}.`);
    seenDates.add(episode.date);
    episodes.push(episode);
  }
  episodes.sort((a, b) => b.date.localeCompare(a.date));
  const payload = { streamEmbedUrl, streamFallbackUrl, timezone: "America/New_York", episodes };
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Synced ${episodes.length} Farm Talk episodes from Box.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
