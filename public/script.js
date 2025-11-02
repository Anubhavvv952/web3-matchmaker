// public/script.js  — DEMO MODE (no backend upload)
// Requires ethers UMD in index.html:
// <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>

const E = window.ethers;

/* ================= CONFIG ================= */
const REQUIRED_CHAIN_ID = "0xaa36a7"; // Sepolia
const NFT_CONTRACT_ADDRESS = "0xFCd271B5AFc9e219B78bd221c6aC01CdB2bB47a2";
const THIRDWEB_CLAIM_URL =
  "https://thirdweb.com/sepolia/0xFCd271B5AFc9e219B78bd221c6aC01CdB2bB47a2";

/* ================= DOM HELPERS ================= */
const $ = (id) => document.getElementById(id);

const connectionArea = $("connectionArea");
const connectButton = $("connectButton");
const statusMessage = $("statusMessage");

const stepQuizArea = $("stepQuizArea");
const stepQuestion = $("stepQuestion");
const stepOptionsEl = $("stepOptions");
const stepNextBtn = $("stepNext");
const stepHint = $("stepHint");
const progressBar = $("progressBar");
const progressDots = $("progressDots");

const hubArea = $("hubArea");
const hubStatusMessage = $("hubStatusMessage");

const resultArea = $("resultArea");
const resultUsernames = $("resultUsernames");
const scoreDisplay = $("scoreDisplay");

const chatArea = $("chatArea");
const chatPartnerName = $("chatPartnerName");
const chatHistory = $("chatHistory");
const chatInput = $("chatInput");
const chatNowButton = $("chatNowButton");
const backToHubButton = $("backToHubButton");
const backToHubFromChatButton = $("backToHubFromChatButton");
const sendMessageButton = $("sendMessageButton");
const compatibilityButtons = document.querySelectorAll(".compatibilityButton");

/* ================= UI HELPERS ================= */
function showSection(el) {
  [connectionArea, stepQuizArea, hubArea, resultArea, chatArea].forEach(
    (x) => (x.style.display = "none")
  );
  el.style.display = el === chatArea ? "flex" : "block";
}

function setGauge(pct) {
  const safe = Math.max(0, Math.min(100, Number(pct) || 0));
  const angle = (safe / 100) * 360;
  const fill =
    document.getElementById("gaugeFill") ||
    document.querySelector(".gauge-fill");
  if (fill) {
    fill.style.transition = "all .8s ease-out";
    fill.style.setProperty("--gauge-angle", `${angle}deg`);
    fill.style.background = `conic-gradient(#ffd54d 0deg ${angle}deg, #333 ${angle}deg 360deg)`;
  }
  if (scoreDisplay) scoreDisplay.textContent = `${safe}%`;
}

function setProgress(stepIndex, total) {
  const pct = Math.round(((stepIndex + 1) / total) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressDots) {
    progressDots.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const d = document.createElement("div");
      d.className = "dot" + (i <= stepIndex ? " active" : "");
      progressDots.appendChild(d);
    }
  }
}

function setStatus(text) {
  if (statusMessage) statusMessage.textContent = text;
  else console.log("[status]", text);
}

/* ================= WALLET / NFT GATE ================= */
async function switchToSepolia(provider) {
  const eth = provider?.provider || window.ethereum;
  if (!eth) return false;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: REQUIRED_CHAIN_ID }],
    });
    return true;
  } catch (e) {
    if (e && e.code === 4902) {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: REQUIRED_CHAIN_ID,
              chainName: "Sepolia",
              nativeCurrency: { name: "SepoliaETH", symbol: "SEP", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org/"],
              blockExplorerUrls: ["https://sepolia.etherscan.io/"],
            },
          ],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

async function getProviderAndSigner() {
  if (!E) {
    alert("Ethers failed to load");
    return null;
  }
  if (!window.ethereum) {
    alert("Install MetaMask");
    return null;
  }

  const provider = new E.providers.Web3Provider(window.ethereum, "any");
  const net = await provider.getNetwork();
  const chainHex = "0x" + net.chainId.toString(16);

  if (chainHex.toLowerCase() !== REQUIRED_CHAIN_ID.toLowerCase()) {
    const ok = await switchToSepolia(provider);
    if (!ok) {
      alert("Please switch MetaMask to Sepolia.");
      return null;
    }
  }

  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  return { provider, signer, userAddress };
}

async function hasMembership(provider, addr) {
  try {
    const abi = ["function balanceOf(address) view returns (uint256)"];
    const c = new E.Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    const bal = await c.balanceOf(addr);
    return bal && typeof bal.gt === "function" && bal.gt(0);
  } catch (e) {
    console.warn("balanceOf failed:", e);
    return false;
  }
}

/* ================= QUIZ ================= */
const stepQuestions = [
  {
    title: "What’s your primary skill in Web3?",
    options: ["Development", "Design", "Community/Marketing"],
  },
  {
    title: "In collaboration, what matters most?",
    options: ["Speed & Action", "Quality & Detail", "Creativity & Innovation", "Harmony & Consensus"],
  },
  {
    title: "Which time zone describes you best?",
    options: ["Americas", "Europe/Africa", "Asia/Oceania", "Flexible / 24x7"],
  },
  {
    title: "Which part of Web3 excites you most?",
    options: ["DeFi", "NFT/Metaverse", "Infrastructure / ZK", "DAOs/Governance"],
  },
  {
    title: "How do you prefer to contribute?",
    options: ["Leading", "Building", "Connecting", "Supporting"],
  },
];

let stepIndex = 0;
const stepAnswers = [];
let userAddress = null;

/* ================= ENCRYPTION (local/demo) ================= */
async function encryptAnswers(answersArr) {
  const payload = { a: answersArr, ts: Date.now() };
  return "sim:" + btoa(JSON.stringify(payload)); // simple base64
}

/* ================= DEMO SUBMIT (NO BACKEND) ================= */
async function submitQuizToBackend() {
  // IMPORTANT: No fetch here — demo mode only.
  console.log("✅ Demo mode: No backend upload. Skipping.");
  return true;
}

/* ================= FLOW ================= */
function renderStep() {
  const s = stepQuestions[stepIndex];
  if (!s) return;

  stepQuestion.textContent = s.title;

  stepOptionsEl.innerHTML = "";
  stepNextBtn.disabled = true;

  s.options.forEach((label, value) => {
    const b = document.createElement("button");
    b.className = "pill fade-in";
    b.textContent = label;
    b.dataset.value = value;
    b.addEventListener("click", () => {
      stepOptionsEl.querySelectorAll(".pill").forEach((p) =>
        p.classList.remove("active")
      );
      b.classList.add("active");
      stepAnswers[stepIndex] = value;
      stepNextBtn.disabled = false;
    });
    stepOptionsEl.appendChild(b);
  });

  stepNextBtn.textContent =
    stepIndex === stepQuestions.length - 1 ? "Finish" : "Next";
  setProgress(stepIndex, stepQuestions.length);
}

/* ================= RESULT / CHAT ================= */
let currentChatTarget = null;

function showResultScreen(user) {
  currentChatTarget = user;
  const cipher = sessionStorage.getItem("quizCipher") || "";
  const score = (cipher.length + user.length * 17) % 100;
  resultUsernames.textContent = `You & ${user}`;
  setGauge(score);
  showSection(resultArea);
}

function showHub() {
  showSection(hubArea);
}
function showChat() {
  chatPartnerName.textContent = `Chatting with ${currentChatTarget}`;
  chatHistory.innerHTML =
    '<div class="message received"><p>Hi! (Simulated)</p></div>';
  showSection(chatArea);
}
function sendMessage() {
  const txt = chatInput.value.trim();
  if (!txt) return;
  chatHistory.innerHTML += `<div class="message sent"><p>${txt}</p></div>`;
  chatInput.value = "";
}

/* ================= BOOT ================= */
document.addEventListener("DOMContentLoaded", () => {
  showSection(connectionArea);

  connectButton.addEventListener("click", async () => {
    try {
      setStatus("Connecting…");
      const w = await getProviderAndSigner();
      if (!w) return;

      userAddress = w.userAddress;

      const ok = await hasMembership(w.provider, w.userAddress);
      if (!ok) {
        setStatus("No NFT membership — redirecting to mint…");
        location.href = THIRDWEB_CLAIM_URL;
        return;
      }

      stepIndex = 0;
      renderStep();
      showSection(stepQuizArea);
      setStatus("Connected. Membership verified.");
    } catch (e) {
      console.error(e);
      setStatus("Connect failed.");
    }
  });

  stepNextBtn.addEventListener("click", async () => {
    if (stepIndex < stepQuestions.length - 1) {
      stepIndex++;
      renderStep();
      return;
    }

    stepHint.textContent = "Encrypting…";
    const ciphertext = await encryptAnswers(stepAnswers);
    sessionStorage.setItem("quizCipher", ciphertext);

    stepHint.textContent = "Saving profile…";
    await submitQuizToBackend(); // DEMO: no network call

    if (hubStatusMessage)
      hubStatusMessage.textContent = "Profile saved. Explore matches.";
    showSection(hubArea);
  });

  compatibilityButtons.forEach((b) =>
    b.addEventListener("click", (e) => {
      const t = e.currentTarget.dataset.target;
      if (t) showResultScreen(t);
    })
  );

  backToHubButton.addEventListener("click", showHub);
  chatNowButton.addEventListener("click", showChat);
  backToHubFromChatButton.addEventListener("click", showHub);
  sendMessageButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
