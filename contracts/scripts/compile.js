const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compileContracts() {
  const contractsDir = path.join(__dirname, '..', 'solidity');
  const tokenSource = fs.readFileSync(path.join(contractsDir, 'AuraToken.sol'), 'utf8');
  const vaultSource = fs.readFileSync(path.join(contractsDir, 'AuraVault.sol'), 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'AuraToken.sol': { content: tokenSource },
      'AuraVault.sol': { content: vaultSource },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  console.log('Compiling Solidity contracts with solc', solc.version(), '...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasErrors = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        hasErrors = true;
        console.error('Compilation Error:', error.formattedMessage);
      } else {
        console.warn('Compilation Warning:', error.formattedMessage);
      }
    }
    if (hasErrors) {
      process.exit(1);
    }
  }

  const buildDir = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const frontendContractsDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'contracts');
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const compiledArtifacts = {};

  // Extract AuraToken
  const auraTokenContract = output.contracts['AuraToken.sol']['AuraToken'];
  compiledArtifacts.AuraToken = {
    contractName: 'AuraToken',
    abi: auraTokenContract.abi,
    bytecode: auraTokenContract.evm.bytecode.object,
  };
  fs.writeFileSync(
    path.join(buildDir, 'AuraToken.json'),
    JSON.stringify(compiledArtifacts.AuraToken, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendContractsDir, 'AuraToken.json'),
    JSON.stringify(compiledArtifacts.AuraToken, null, 2)
  );

  // Extract AuraVault
  const auraVaultContract = output.contracts['AuraVault.sol']['AuraVault'];
  compiledArtifacts.AuraVault = {
    contractName: 'AuraVault',
    abi: auraVaultContract.abi,
    bytecode: auraVaultContract.evm.bytecode.object,
  };
  fs.writeFileSync(
    path.join(buildDir, 'AuraVault.json'),
    JSON.stringify(compiledArtifacts.AuraVault, null, 2)
  );
  fs.writeFileSync(
    path.join(frontendContractsDir, 'AuraVault.json'),
    JSON.stringify(compiledArtifacts.AuraVault, null, 2)
  );

  console.log('✅ Compilation successful!');
  console.log('  Saved artifacts to:');
  console.log('  - contracts/build/');
  console.log('  - frontend/src/contracts/');
}

compileContracts();
