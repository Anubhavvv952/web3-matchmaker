// Uses window.ethers (v5 UMD)
const E = window.ethers;

// ---- CONFIG ----
const CHAIN_ID_HEX = "0xaa36a7"; // Sepolia
const STORAGE_KEY = "mpass_contract_addr";

// Minimal ABI: balanceOf + mintBatch(to, amount)
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function isSaleActive() view returns (bool)",
  "function price() view returns (uint256)",
  "function mintBatch(address to, uint256 amount) payable"
];

function $(id){ return document.getElementById(id); }

document.addEventListener("DOMContentLoaded", () => {
  // Hook DOM elements (IDs MUST match mint.html)
  const contractInput   = $("contractInput");
  const saveAddressBtn  = $("saveAddressBtn");
  const connectButton   = $("connectButton");
  const mintOneBtn      = $("mintOneBtn");
  const logBox          = $("logBox");
  const netSpan         = $("netSpan");
  const walletSpan      = $("walletSpan");
  const modeSpan        = $("modeSpan");

  // Guard: if any element missing, stop (prevents addEventListener null error)
  const els = [contractInput, saveAddressBtn, connectButton, mintOneBtn, logBox, netSpan, walletSpan, modeSpan];
  if (els.some(el => !el)) {
    console.error("Mint wiring failed: missing element IDs. Check mint.html IDs match mint.js.");
    return;
  }

  // Load saved contract addr (if any)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    contractInput.value = saved;
    log(`Saved address: ${saved}`);
  }

  // Wallet state
  let provider = null;
  let signer   = null;

  // UI helpers
  function log(msg) {
    const time = new Date().toLocaleTimeString();
    logBox.textContent += `[${time}] ${msg}\n`;
    logBox.scrollTop = logBox.scrollHeight;
  }

  function setMode() {
    modeSpan.textContent = provider ? "connected" : "—";
  }

  // Read-only helpers
  async function mkRead() {
    if (!E || !window.ethereum) throw new Error("MetaMask not found");
    const rprov = new E.providers.Web3Provider(window.ethereum, "any");
    return rprov;
  }
  function getAddr() {
    const a = (contractInput.value || "").trim();
    if (!a || !E.utils.isAddress(a)) throw new Error("Invalid contract address");
    return a;
  }
  function contractRead(providerLike) {
    const addr = getAddr();
    return new E.Contract(addr, ABI, providerLike);
  }

  // Actions
  async function connect() {
    if (!window.ethereum) { log("Install MetaMask"); alert("MetaMask not detected"); return; }
    provider = new E.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const net = await provider.getNetwork();
    netSpan.textContent = `${net.name} (${net.chainId})`;
    const hex = "0x" + net.chainId.toString(16);
    if (hex.toLowerCase() !== CHAIN_ID_HEX) {
      log("Wrong network — prompting switch to Sepolia");
      try {
        await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
      } catch (e) {
        log("User/network switch failed.");
        return;
      }
    }
    signer = provider.getSigner();
    const addr = (await signer.getAddress()).toLowerCase();
    walletSpan.textContent = `${addr.slice(0,6)}…${addr.slice(-4)}`;
    setMode();
    log("Connected.");
  }

  async function sanityRead() {
    try {
      const r = await mkRead();
      const c = contractRead(r);
      const code = await r.getCode(c.address);
      log(`Deployed bytecode length: ${code?.length || 0}`);
      const sale = await c.isSaleActive().catch(()=>false);
      const p = await c.price().catch(()=>E.constants.Zero);
      log(`Sale active: ${sale} Price(wei): ${p.toString()}`);
      return { r, c, sale, price: p };
    } catch (e) {
      log("Sanity read failed: " + (e?.message || e));
      throw e;
    }
  }

  async function mintOne() {
    try {
      if (!signer) { await connect(); }
      // Re-check sale/price with read provider
      const { r, price } = await sanityRead();
      const addr = await signer.getAddress();
      const cW = contractRead(signer);

      const amount = 1;
      // IMPORTANT: external contract expects `mintBatch(to, amount)`
      log("Estimating gas for mintBatch(to, 1) …");
      const tx = await cW.mintBatch(addr, amount, { value: price.mul(amount) });
      log(`⏳ Sent. Tx hash: ${tx.hash}`);
      const rcpt = await tx.wait();
      log(`✅ Minted! in block ${rcpt.blockNumber}`);
    } catch (e) {
      console.error(e);
      log("❌ Mint failed: " + (e?.error?.message || e?.message || String(e)));
    }
  }

  // Wire events
  saveAddressBtn.addEventListener("click", () => {
    const val = (contractInput.value || "").trim();
    if (!val || !E.utils.isAddress(val)) { alert("Enter a valid contract address"); return; }
    localStorage.setItem(STORAGE_KEY, val);
    log("Saved address: " + val);
  });

  connectButton.addEventListener("click", connect);
  mintOneBtn.addEventListener("click", mintOne);

  // On load, do a quick read status if address present
  if (contractInput.value && E.utils.isAddress(contractInput.value)) {
    sanityRead().catch(()=>{});
  }

  setMode();
});
