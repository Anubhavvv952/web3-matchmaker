# Web3 Matchmaker

Web3 Matchmaker is a small experimental dApp built for the Zama FHE developer program.  
The idea is simple: connect wallet → complete a short compatibility quiz → find potential matches in the community.  
User answers are stored using backend encryption logic (Zama FHE / mock in dev mode).

---

## Features

- Wallet connection (Metamask / Sepolia Testnet)
- NFT gated access  
  → only users holding a specific “Membership Pass” NFT can access the matchmaking flow
- Quiz with 5 questions
- Encrypted answer submission
- Basic match score preview + chat simulation

The flow feels like this:

> connect → quiz → encrypted submit → hub → view matches

---

## NFT Membership Pass

To access the dApp, users need an NFT from this contract:

**Contract Address:**  
`0xFCd271B5AFc9e219B78bd221c6aC01CdB2bB47a2`  
**Mint Page (Thirdweb):**  
https://thirdweb.com/sepolia/0xFCd271B5AFc9e219B78bd221c6aC01CdB2bB47a2
Web3-Matchmaker-  https://web3-matchmaker.vercel.app/

Mint → return back → refresh → quiz starts.

---

## Tech Stack

| Layer | Stack / Tools |
|-------|---------------|
Frontend (Client Layer)

HTML, CSS, Vanilla JavaScript

Ethers.js for wallet connection and NFT verification

Runs fully in browser (no frameworks, no build step)

Smart Contract Layer

NFT Membership Pass deployed on Ethereum Sepolia Testnet

Thirdweb Contract (ERC-1155)

Handles access control → only NFT holders can continue to quiz

Backend / API Layer

Serverless functions (Vercel /api/* routes)

Receives encrypted quiz submissions

Stores quiz cipher + minimal metadata

Designed to be compatible with FHE-based scoring logic

Encryption Layer (FHE-compatible design)

User answers are encrypted client-side before submitting

Backend works with encrypted payloads → doesn’t read quiz answers

Architecture allows future swap-in of Zama Fully Homomorphic Encryption SDK

Storage Layer

Temporary key-value store (KV or in-memory fallback)

Only stores wallet address + encrypted quiz data, no identity data

Deployment Layer

Vercel

Serves frontend from /public

Runs backend API as serverless functions

Handles routing / redirects

---

## Project Structure
/public → frontend (index.html, script.js, styles)
/api → backend endpoints (submit quiz, keygen, matches)
/server → optional server entry for local dev
vercel.json → routing + redirects
package.json

> **Disclaimer**
>
> This project runs on the **Ethereum Sepolia Testnet**.  
> Requirements to use the app:
> - MetaMask installed
> - Network set to **Sepolia**
> - A small amount of test ETH for gas
>
> If the app doesn’t move past the connection screen:
> - Refresh after connecting your wallet
> - Verify that MetaMask is on **Sepolia**, not Mainnet
> - If you don’t own the Membership Pass NFT, you'll be redirected to the mint page
>
> Quiz answers are encrypted before sending to the backend, designed to be compatible with FHE.  
> This application does **not** collect personal data — only wallet address and encrypted quiz results.

