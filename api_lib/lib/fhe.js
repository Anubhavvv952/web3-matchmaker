// api/_lib/fhe.js
// Minimal mocks so the app runs (swap with real Zama later)

export async function keygen() {
  console.log("[FHE] keygen (mock)");
  return { publicKey: "dev-public-key", privateKey: "dev-private-key" };
}

export async function encrypt(value) {
  console.log("[FHE] encrypt (mock)");
  return String(value);
}

export async function decrypt(value) {
  console.log("[FHE] decrypt (mock)");
  return String(value);
}
