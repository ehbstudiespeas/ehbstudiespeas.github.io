(function () {
  const stage = document.getElementById("pea-stage");
  const svgRoot = document.querySelector("#interactive-svg svg");
  const bubble = document.getElementById("thought-bubble");
  const bubbleContent = document.getElementById("bubble-content");
  const closeBtn = document.getElementById("bubble-close");
  const dataScript = document.getElementById("topic-data");
  const interactionPrompt = document.getElementById("interaction-prompt");

  if (!stage || !svgRoot || !bubble || !bubbleContent || !closeBtn || !dataScript) {
    return;
  }

  const state = {
    activeTopicId: null,
    topicsById: {},
    hotspotsByTopic: {},
    hasInteracted: false,
    hintTimerId: null,
    bubbleCloseTimerId: null
  };

  function normalizeSvg(svgEl) {
    const width = svgEl.getAttribute("width");
    const height = svgEl.getAttribute("height");

    if (!svgEl.getAttribute("viewBox") && width && height) {
      svgEl.setAttribute("viewBox", "0 0 " + width + " " + height);
    }

    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }

  function clearActiveStyles() {
    Object.values(state.hotspotsByTopic).forEach((el) => {
      el.classList.remove("is-active");
      el.classList.remove("is-pressing");
      el.setAttribute("aria-pressed", "false");
    });
  }

  function finishHideBubble() {
    bubble.hidden = true;
    bubble.classList.remove("is-open");
    bubble.classList.remove("is-closing");
    bubbleContent.innerHTML = "";
    state.activeTopicId = null;
    stage.classList.remove("has-bubble");
    clearActiveStyles();
    restorePrompt();
  }

  function setBubbleOrigin(anchorEl) {
    const stageRect = stage.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();
    const centerX = anchorRect.left - stageRect.left + (anchorRect.width / 2);
    const pct = (centerX / stageRect.width) * 100;
    const clamped = Math.min(90, Math.max(10, pct));
    bubble.style.setProperty("--bubble-origin-x", clamped.toFixed(2) + "%");
  }

  function hideBubble(immediate) {
    if (state.bubbleCloseTimerId) {
      window.clearTimeout(state.bubbleCloseTimerId);
      state.bubbleCloseTimerId = null;
    }

    if (immediate || bubble.hidden) {
      finishHideBubble();
      return;
    }

    state.activeTopicId = null;
    stage.classList.remove("has-bubble");
    clearActiveStyles();

    bubble.classList.remove("is-open");
    bubble.classList.add("is-closing");
    state.bubbleCloseTimerId = window.setTimeout(() => {
      finishHideBubble();
      state.bubbleCloseTimerId = null;
    }, 720);
  }

  function showTopic(topicId, anchorEl) {
    const topic = state.topicsById[topicId];
    if (!topic || !anchorEl) {
      hideBubble();
      return;
    }

    state.activeTopicId = topicId;
    clearActiveStyles();

    anchorEl.classList.add("is-active");
    anchorEl.setAttribute("aria-pressed", "true");

    bubbleContent.innerHTML = topic.bubbleHtml;

    setBubbleOrigin(anchorEl);
    stage.classList.add("has-bubble");

    if (state.bubbleCloseTimerId) {
      window.clearTimeout(state.bubbleCloseTimerId);
      state.bubbleCloseTimerId = null;
    }

    bubble.hidden = false;
    bubble.classList.remove("is-closing");
    bubble.classList.remove("is-open");
    window.requestAnimationFrame(() => {
      bubble.classList.add("is-open");
      setBubbleOrigin(anchorEl);
    });
  }

  function dismissPrompt() {
    if (!interactionPrompt) {
      return;
    }
    interactionPrompt.classList.add("is-dismissed");
  }

  function restorePrompt() {
    if (!interactionPrompt) {
      return;
    }
    interactionPrompt.classList.remove("is-dismissed");
  }

  function nudgeHintPea() {
    if (state.hasInteracted) {
      return;
    }
    const hotspots = Object.values(state.hotspotsByTopic);
    if (hotspots.length === 0) {
      return;
    }
    const hotspot = hotspots[Math.floor(Math.random() * hotspots.length)];
    hotspot.classList.add("is-pressing");
    window.setTimeout(() => {
      hotspot.classList.remove("is-pressing");
    }, 280);
  }

  function runIntroPulse() {
    const order = ["policy", "ecology", "agriculture", "social"];
    stage.classList.add("intro-running");
    order.forEach((topicId, i) => {
      const hotspot = state.hotspotsByTopic[topicId];
      if (!hotspot) {
        return;
      }
      window.setTimeout(() => {
        hotspot.classList.add("intro-pop");
        window.setTimeout(() => hotspot.classList.remove("intro-pop"), 600);
      }, i * 320);
    });
    window.setTimeout(() => {
      stage.classList.remove("intro-running");
    }, (order.length * 320) + 650);
  }

  function activateTopic(topicId) {
    const hotspot = state.hotspotsByTopic[topicId];
    if (!hotspot) {
      return;
    }

    if (state.activeTopicId === topicId) {
      hideBubble(false);
      return;
    }

    hotspot.classList.add("is-pressing");
    window.setTimeout(() => {
      hotspot.classList.remove("is-pressing");
      showTopic(topicId, hotspot);
    }, 130);

    state.hasInteracted = true;
    dismissPrompt();
    if (state.hintTimerId) {
      window.clearTimeout(state.hintTimerId);
      state.hintTimerId = null;
    }
  }

  function wireHotspot(el, topicId) {
    state.hotspotsByTopic[topicId] = el;

    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-pressed", "false");
    el.setAttribute("aria-label", "Open " + state.topicsById[topicId].label + " thought bubble");

    el.addEventListener("focus", () => el.classList.add("is-focused"));
    el.addEventListener("blur", () => el.classList.remove("is-focused"));

    el.addEventListener("click", (event) => {
      event.preventDefault();
      activateTopic(topicId);
    });

    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateTopic(topicId);
      }
    });
  }

  function initData() {
    const parsed = JSON.parse(dataScript.textContent || "{}");
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];

    topics.forEach((topic) => {
      state.topicsById[topic.id] = topic;
    });

    topics.forEach((topic) => {
      const hotspot = document.getElementById(topic.primaryPeaId);
      if (hotspot) {
        wireHotspot(hotspot, topic.id);
      }
    });
  }

  function wireGlobalDismiss() {
    closeBtn.addEventListener("click", () => hideBubble(false));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.activeTopicId) {
        hideBubble(false);
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!state.activeTopicId) {
        return;
      }

      const clickedHotspot = event.target.closest && event.target.closest(".pea-hotspot");
      const clickedBubble = bubble.contains(event.target);

      if (!clickedHotspot && !clickedBubble) {
        hideBubble(false);
      }
    });

    window.addEventListener("resize", () => {
      if (!state.activeTopicId) {
        return;
      }
      const hotspot = state.hotspotsByTopic[state.activeTopicId];
      if (hotspot) {
        setBubbleOrigin(hotspot);
      }
    });
  }

  normalizeSvg(svgRoot);
  initData();
  wireGlobalDismiss();
  hideBubble(true);

  if (interactionPrompt) {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    interactionPrompt.textContent = isTouch ? "Tap a pea to explore" : "Click a pea to explore";
  }

  runIntroPulse();
  state.hintTimerId = window.setTimeout(nudgeHintPea, 2300);
})();
