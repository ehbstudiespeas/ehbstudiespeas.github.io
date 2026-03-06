(function () {
  const stage = document.getElementById("pea-stage");
  const svgRoot = document.querySelector("#interactive-svg svg");
  const interactionPrompt = document.getElementById("interaction-prompt");

  if (!stage || !svgRoot) {
    return;
  }

  const state = {
    hotspotsByTopic: {},
    hasInteracted: false,
    hintTimerId: null
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
    });
  }

  function dismissPrompt() {
    if (!interactionPrompt) {
      return;
    }
    interactionPrompt.classList.add("is-dismissed");
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

  function goToResearchTopic(topicId) {
    window.location.href = "research.html#" + topicId;
  }

  function activateTopic(topicId) {
    const hotspot = state.hotspotsByTopic[topicId];
    if (!hotspot) {
      return;
    }

    clearActiveStyles();
    hotspot.classList.add("is-active");
    hotspot.classList.add("is-pressing");

    state.hasInteracted = true;
    dismissPrompt();
    if (state.hintTimerId) {
      window.clearTimeout(state.hintTimerId);
      state.hintTimerId = null;
    }

    window.setTimeout(() => {
      goToResearchTopic(topicId);
    }, 130);
  }

  function wireHotspot(el) {
    const topicId = el.getAttribute("data-topic-id");
    if (!topicId) {
      return;
    }

    state.hotspotsByTopic[topicId] = el;

    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "link");
    el.setAttribute("aria-label", "Open " + topicId + " section on research page");

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

  normalizeSvg(svgRoot);
  svgRoot.querySelectorAll(".pea-hotspot").forEach(wireHotspot);

  if (interactionPrompt) {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    interactionPrompt.textContent = isTouch ? "Tap a pea to open Research" : "Click a pea to open Research";
  }

  runIntroPulse();
  state.hintTimerId = window.setTimeout(nudgeHintPea, 2300);
})();
