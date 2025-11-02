/**
 * Run:
 *   node generateMetadata.js
 *
 * This creates:
 *   metadata/0.json
 *   metadata/1.json
 *   ...
 *   metadata/50.json
 */

const fs = require("fs");
const path = require("path");

// ✅ REPLACE THIS WITH YOUR PNG CID
const IMAGES_CID = "bafybeihbxtmhxp7legvfgfj2pr632vyz6rg3cim6zicodautxhdxkww5mq";

const TOTAL_NFTS = 51; // 0 to 50 (51 images)

// Output folder
const outDir = path.join(process.cwd(), "metadata");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

console.log(`Generating ${TOTAL_NFTS} metadata files into /metadata...`);

for (let i = 0; i < TOTAL_NFTS; i++) {
  const metadata = {
    name: `Web3 Matchmaker Pass #${i}`,
    description: "Exclusive membership NFT for the ZAMA Web3 Matchmaker.",
    image: `ipfs://${IMAGES_CID}/${i}.png`,
    attributes: [
      {
        trait_type: "Access Level",
        value: "Member"
      }
    ]
  };

  const filePath = path.join(outDir, `${i}.json`);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
}

console.log("✅ Metadata generated!");
console.log("➡️ Upload /metadata folder to Pinata and use CID as:");
console.log("   ipfs://<METADATA_CID>/{id}.json");
