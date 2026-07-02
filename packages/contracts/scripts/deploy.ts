import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // EOA address untuk treasury & operator (bisa disesuaikan di env)
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const operatorAddress = process.env.CONTRACT_OWNER_ADDRESS || deployer.address;

  console.log("Setting treasury to:", treasuryAddress);
  console.log("Setting operator to:", operatorAddress);

  const PawnPool = await ethers.getContractFactory("PawnPool");
  const pawnPool = await PawnPool.deploy(deployer.address, operatorAddress, treasuryAddress);

  await pawnPool.waitForDeployment();
  const contractAddress = await pawnPool.getAddress();

  console.log("PawnPool deployed successfully at:", contractAddress);

  // Simpan artifacts ke packages/contracts/artifacts-export
  const exportDir = path.join(__dirname, "../artifacts-export");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  // Ambil ABI dari build artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PawnPool.sol/PawnPool.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Simpan ABI JSON
    fs.writeFileSync(
      path.join(exportDir, "PawnPool.abi.json"),
      JSON.stringify(artifact.abi, null, 2)
    );

    // Simpan address
    const addresses = {
      baseSepolia: contractAddress,
      localhost: contractAddress
    };
    fs.writeFileSync(
      path.join(exportDir, "addresses.json"),
      JSON.stringify(addresses, null, 2)
    );

    console.log("ABI and addresses exported successfully to artifacts-export!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
