/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const metadataBaseUri =
    process.env.BADGE_METADATA_BASE_URI ||
    "ipfs://QmSkarbnikBadgeMetadataPlaceholder/";

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "No deployer signer configured. Set PRIVATE_KEY in your environment before deploying."
    );
  }

  const factory = await hre.ethers.getContractFactory("SkarbnikBadges");
  const contract = await factory.deploy(metadataBaseUri);

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;

  console.log(`SkarbnikBadges deployed to ${address} on ${networkName}.`);

  const deploymentsPath = path.join(__dirname, "..", "deployments.json");

  let existingDeployments = {};
  if (fs.existsSync(deploymentsPath)) {
    existingDeployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  }

  existingDeployments[networkName] = {
    chainId,
    SkarbnikBadges: {
      address,
      deployedAt: new Date().toISOString(),
      metadataBaseUri,
    },
  };

  fs.writeFileSync(deploymentsPath, `${JSON.stringify(existingDeployments, null, 2)}\n`);
  console.log(`Saved deployment info to ${deploymentsPath}.`);

  const deploymentTx = contract.deploymentTransaction();
  if (!deploymentTx) {
    return;
  }

  if (!process.env.BASESCAN_API_KEY) {
    console.log("BASESCAN_API_KEY not set. Skipping verification.");
    return;
  }

  console.log("Waiting for confirmations before verification...");
  await deploymentTx.wait(6);

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: [metadataBaseUri],
    });
    console.log("Contract verified on Basescan.");
  } catch (error) {
    console.error("Verification failed:", error.message || error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
