(function () {
  const dataUrl = "assets/data/farm-talk-episodes.json";
  const eastern = "America/New_York";
  const liveState = document.getElementById("live-state");
  const liveEpisode = document.getElementById("live-episode");
  const streamPanel = document.getElementById("stream-panel");
  const countdown = document.getElementById("countdown");
  const episodeGrid = document.getElementById("episode-grid");

  function parts(date) {
    return new Intl.DateTimeFormat("en-US", { timeZone: eastern, weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(date).reduce(function (all, part) { all[part.type] = part.value; return all; }, {});
  }

  function currentEastern() { return parts(new Date()); }
  function easternDateIso(date) { const p = parts(date); return p.year + "-" + p.month.padStart(2, "0") + "-" + p.day.padStart(2, "0"); }
  function episodeDateLabel(value) { return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(value + "T12:00:00Z")); }
  function nextWednesday(now) {
    const p = currentEastern();
    const date = new Date(Date.UTC(Number(p.year), new Date(Date.parse(p.month + " 1, 2000")).getUTCMonth(), Number(p.day), 16));
    const days = (3 - date.getUTCDay() + 7) % 7;
    date.setUTCDate(date.getUTCDate() + days);
    if (days === 0 && Number(p.hour) >= 13) date.setUTCDate(date.getUTCDate() + 7);
    return date.toISOString().slice(0, 10);
  }
  function easternNoonUtc(dateString) {
    const fields = dateString.split("-").map(Number);
    const candidate = new Date(Date.UTC(fields[0], fields[1] - 1, fields[2], 16));
    const local = parts(candidate);
    const localAsUtc = Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), Number(local.hour));
    const offset = candidate.getTime() - localAsUtc;
    return new Date(Date.UTC(fields[0], fields[1] - 1, fields[2], 12) + offset);
  }
  function stateFor(episode, now) {
    const today = easternDateIso(now);
    const p = currentEastern();
    const hour = Number(p.hour) + (p.dayPeriod === "PM" && Number(p.hour) !== 12 ? 12 : p.dayPeriod === "AM" && Number(p.hour) === 12 ? -12 : 0);
    if (episode.date > today) return "up-next";
    if (episode.date === today && p.weekday === "Wednesday" && hour >= 12 && hour < 13) return "live";
    return episode.audioUrl ? "listen-now" : "coming-soon";
  }
  function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value || ""; return div.innerHTML; }
  function topicMarkup(topics) { return topics && topics.length ? '<ul class="topic-list">' + topics.slice(0, 4).map(function (topic) { return "<li>" + escapeHtml(topic) + "</li>"; }).join("") + "</ul>" : ""; }
  function statusLabel(state) { return ({ "listen-now": "Listen now", "coming-soon": "Coming soon", "up-next": "Up next", "live": "Live now" })[state]; }
  function cardMarkup(episode, state) {
    const audio = episode.audioUrl ? '<div class="audio-wrap"><audio controls preload="none"><source src="' + encodeURI(episode.audioUrl) + '" type="audio/mpeg" />Your browser does not support audio playback.</audio><a class="audio-link" href="' + encodeURI(episode.audioUrl) + '" download>Download episode</a></div>' : '<p class="recording-note">' + (episode.boxAudioId ? "Recording is being prepared for the archive." : "Episode details are coming soon.") + "</p>";
    return '<article class="episode-card ' + (state === "live" ? "featured" : "") + '"><div class="episode-meta"><time datetime="' + episode.date + '">' + episodeDateLabel(episode.date) + '</time><span class="status status-' + state + '">' + statusLabel(state) + '</span></div><h3>' + escapeHtml(episode.guest) + '</h3><p class="episode-title">' + escapeHtml(episode.title) + '</p><p class="episode-summary">' + escapeHtml(episode.summary) + '</p>' + topicMarkup(episode.topics) + audio + '</article>';
  }
  function renderLive(data) {
    const now = new Date();
    const nextDate = nextWednesday(now);
    const episode = data.episodes.find(function (entry) { return entry.date === nextDate; }) || data.episodes.find(function (entry) { return stateFor(entry, now) === "live"; });
    const hasLive = episode && stateFor(episode, now) === "live";
    liveState.textContent = hasLive ? "On air now" : "Next broadcast";
    if (episode) {
      liveEpisode.innerHTML = '<h3>' + escapeHtml(episode.guest) + '</h3><p>' + escapeHtml(episode.title) + '</p><p>' + escapeHtml(episode.summary) + '</p>' + topicMarkup(episode.topics);
    } else {
      liveEpisode.innerHTML = "<p>The next Farm Talk episode is being prepared.</p>";
    }
    if (hasLive && data.streamEmbedUrl) {
      streamPanel.innerHTML = '<h3>Listen live on WTBQ</h3><iframe title="WTBQ live stream" src="' + encodeURI(data.streamEmbedUrl) + '" allow="autoplay"></iframe>';
    } else if (hasLive) {
      streamPanel.innerHTML = '<h3>Farm Talk is live</h3><p>Listen through WTBQ’s live stream.</p><a class="btn" href="' + data.streamFallbackUrl + '" target="_blank" rel="noopener noreferrer">Open WTBQ live stream</a>';
    } else {
      streamPanel.innerHTML = '<h3>Join us live</h3><p>The WTBQ player appears here during Farm Talk, Wednesdays from noon to 1:00 p.m. Eastern.</p><a class="btn" href="' + data.streamFallbackUrl + '" target="_blank" rel="noopener noreferrer">Visit WTBQ</a>';
    }
    function updateCountdown() {
      if (hasLive) { countdown.textContent = "Farm Talk is on air now — Wednesdays, 12:00–1:00 p.m. Eastern."; return; }
      const target = easternNoonUtc(nextDate);
      const difference = Math.max(0, target.getTime() - new Date().getTime());
      const days = Math.floor(difference / 86400000); const hours = Math.floor((difference % 86400000) / 3600000); const minutes = Math.floor((difference % 3600000) / 60000);
      countdown.textContent = "Next live broadcast in " + days + "d " + hours + "h " + minutes + "m.";
    }
    updateCountdown(); window.setInterval(updateCountdown, 60000);
  }
  fetch(dataUrl).then(function (response) { if (!response.ok) throw new Error("Episode data could not be loaded."); return response.json(); }).then(function (data) {
    const now = new Date();
    const episodes = data.episodes.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    renderLive(data);
    episodeGrid.innerHTML = episodes.map(function (episode) { return cardMarkup(episode, stateFor(episode, now)); }).join("");
  }).catch(function () { episodeGrid.innerHTML = '<p class="loading">The episode archive is temporarily unavailable. Please visit <a href="https://wtbq.com/">WTBQ</a> to listen live.</p>'; liveState.textContent = "Farm Talk"; liveEpisode.innerHTML = "<p>Wednesdays, 12:00–1:00 p.m. Eastern.</p>"; streamPanel.innerHTML = '<a class="btn" href="https://wtbq.com/" target="_blank" rel="noopener noreferrer">Visit WTBQ</a>'; });
}());
