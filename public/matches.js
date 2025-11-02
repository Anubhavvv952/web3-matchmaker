// public/matches.js
(async function () {
  const $ = sel => document.querySelector(sel);
  const meEl = $("#me");
  const listEl = $("#matchList");
  const walletInput = $("#wallet");
  const btnLoad = $("#btnLoad");
  const btnClear = $("#btnClear");
  const log = new LogPanel($("#logs"));

  // helper
  function scoreClass(s) {
    if (s >= 75) return "good";
    if (s >= 45) return "mid";
    return "bad";
  }

  async function fetchJSON(url, data) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {})
    });
    return resp.json();
  }

  function renderMatches(items) {
    listEl.innerHTML = "";
    if (!items || !items.length) {
      listEl.innerHTML = `<div class="muted">No matches found. Make sure you've submitted your profile and quiz answers.</div>`;
      return;
    }
    for (const m of items) {
      const card = document.createElement("div");
      card.className = "match-card";
      const who = m.profile?.username || m.wallet.slice(0, 6) + "…" + m.wallet.slice(-4);
      card.innerHTML = `
        <div>
          <div class="who">${who}</div>
          <div class="muted tiny">${m.profile?.bio || ""}</div>
        </div>
        <div class="score ${scoreClass(m.score)}">${m.score}%</div>
      `;
      listEl.appendChild(card);
    }
  }

  async function loadMatches(wallet) {
    log.write(`Begin loading matches for ${wallet}`);
    btnLoad.disabled = true;

    // Ask the backend to be verbose so we can show Zama/FHE steps.
    const data = await fetchJSON("/api/matches", { wallet, verbose: true });

    if (Array.isArray(data.logs)) {
      data.logs.forEach(line => log.write(line));
    } else {
      log.write("No verbose logs returned (that’s okay).");
    }

    renderMatches(data.matches || data); // supports both shapes
    btnLoad.disabled = false;
    log.write("Finished loading matches.");
  }

  // UI wiring
  btnLoad.addEventListener("click", () => {
    const wallet = (walletInput.value || "").trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      alert("Please paste a valid wallet (0x...)");
      return;
    }
    meEl.textContent = wallet;
    log.write("---------");
    loadMatches(wallet).catch(e => {
      console.error(e);
      log.write("Error loading matches: " + (e?.message || e));
      btnLoad.disabled = false;
    });
  });

  btnClear.addEventListener("click", () => log.clear());

  // Optional: pre-fill wallet if saved in localStorage by your other pages
  const saved = localStorage.getItem("my_wallet");
  if (saved) {
    walletInput.value = saved;
    meEl.textContent = saved;
  }
})();
