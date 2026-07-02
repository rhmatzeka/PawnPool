const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const operatorAddress = process.env.CONTRACT_OWNER_ADDRESS || deployer.address;

  console.log("Setting treasury to:", treasuryAddress);
  console.log("Setting operator to:", operatorAddress);

  const PawnPool = await hre.ethers.getContractFactory("PawnPool");
  const pawnPool = await PawnPool.deploy(deployer.address, operatorAddress, treasuryAddress);

  await pawnPool.waitForDeployment();
  const contractAddress = await pawnPool.getAddress();

  console.log("PawnPool deployed successfully at:", contractAddress);

  const exportDir = path.join(__dirname, "../artifacts-export");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  const artifactPath = path.join(__dirname, "../artifacts/contracts/PawnPool.sol/PawnPool.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    fs.writeFileSync(
      path.join(exportDir, "PawnPool.abi.json"),
      JSON.stringify(artifact.abi, null, 2)
    );

    const addresses = {
      baseSepolia: contractAddress,
      localhost: contractAddress
    };
    fs.writeFileSync(
      path.join(exportDir, "addresses.json"),
      JSON.stringify(addresses, null, 2)
    );

    console.log("ABI and addresses exported successfully!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
