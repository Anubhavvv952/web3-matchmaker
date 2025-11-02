/****************************************************
 * mint.js — FINAL (uses input box only)
 * - Requires you to paste the contract into #addrInput
 * - Saves to localStorage ("mint_contract")
 * - Shows the EXACT address being used
 ****************************************************/

const CHAIN_ID = 11155111; // Sepolia
const $ = (id) => document.getElementById(id);

function assertAddress(a) {
  const s = (a || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(s)) throw new Error(`Invalid address: ${s}`);
  return s.toLowerCase();
}

function getSavedAddress() {
  return (localStorage.getItem("mint_contract") || "").trim();
}
function setSavedAddress(a) {
  localStorage.setItem("mint_contract", a.trim());
}

let provider, signer, contract, userAddr, mode = "unknown";

const ABI = [
  "function mint(uint256 amount) payable",
  "function mintTo(address to, uint256 amount)",
  "function balanceOf(address owner) view returns(uint256)",
  "function saleActive() view returns(bool)",
  "function price() view returns(uint256)"
];

function log(...a) {
  const box = $("log");
  box.value += (box.value ? "\n" : "") + a.join(" ");
  box.scrollTop = box.scrollHeight;
}
function flash(msg, ok=false) {
  const el = $("flash");
  el.textContent = msg;
  el.className = ok ? "ok" : "err";
}
function fmt(a){ return a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—"; }
function extract(e){ return e?.error?.message || e?.reason || e?.message || String(e); }

function loadAddressIntoInput() {
  const saved = getSavedAddress();
  if (saved) $("addrInput").value = saved;
}

$("saveAddrBtn")?.addEventListener("click", () => {
  try {
    const fromInput = $("addrInput").value.trim();
    const addr = assertAddress(fromInput);
    setSavedAddress(addr);
    flash("Address saved: " + addr, true);
    log("Saved address:", addr);
  } catch (e) {
    flash(e.message);
  }
});

async function connect() {
  try {
    // ALWAYS take from input; if empty, fall back to saved; if still empty, error.
    let raw = $("addrInput").value.trim();
    if (!raw) raw = getSavedAddress();
    const CONTRACT = assertAddress(raw);
    $("addrInput").value = CONTRACT;      // reflect normalized
    setSavedAddress(CONTRACT);            // keep for next time

    if (!window.ethereum) throw new Error("Install MetaMask");
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const net = await provider.getNetwork();
    $("netName").textContent = "#" + net.chainId;
    if (net.chainId !== CHAIN_ID) throw new Error("Switch MetaMask to Sepolia");

    signer = provider.getSigner();
    userAddr = await signer.getAddress();
    $("user").textContent = fmt(userAddr);

    // Show exactly which address is used
    log("Using contract address:", CONTRACT);

    const code = await provider.getCode(CONTRACT);
    log("Deployed bytecode length:", code?.length || 0);
    if (!code || code === "0x") throw new Error("No contract at this address on Sepolia");

    contract = new ethers.Contract(CONTRACT, ABI, signer);

    if (contract.mint) { mode = "mint"; $("mode").textContent = "public mint (mint)"; }
    else if (contract.mintTo) { mode = "mintTo"; $("mode").textContent = "mintTo (admin)"; }
    else { $("mode").textContent = "unknown"; throw new Error("Mint function not found"); }

    // Pre-check sale + price (for nicer UX)
    const active = await contract.saleActive().catch(()=>true);
    const price  = await contract.price().catch(()=>ethers.BigNumber.from(0));
    log("Sale active:", String(active), "Price(wei):", price.toString());

    $("mintBtn").disabled = false;
    flash("Connected. Ready to mint.", true);
    log("Connected.");
  } catch (e) {
    flash(extract(e)); log("connect error:", extract(e));
  }
}

async function mintOne() {
  try {
    $("mintBtn").disabled = true;

    if (mode === "mint") {
      const active = await contract.saleActive().catch(()=>true);
      if (!active) throw new Error("Sale inactive");
      const price = await contract.price().catch(()=>ethers.BigNumber.from(0));
      const tx = await contract.mint(1, { value: price });
      flash("Submitting tx…");
      const r = await tx.wait();
      flash("Mint success", true);
      log("tx:", r.transactionHash);
      return;
    }

    if (mode === "mintTo") {
      const tx = await contract.mintTo(userAddr, 1);
      flash("Submitting tx…");
      const r = await tx.wait();
      flash("Mint success", true);
      log("tx:", r.transactionHash);
      return;
    }

    throw new Error("Unsupported mode");
  } catch (e) {
    flash("Mint failed: " + extract(e));
    log("error:", extract(e));
  } finally {
    $("mintBtn").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAddressIntoInput();
  $("connectBtn").addEventListener("click", connect);
  $("mintBtn").addEventListener("click", mintOne);
  flash("Paste address → Save Address → Connect → Mint");
  log("mint.html loaded. Click Connect → Mint.");
});
