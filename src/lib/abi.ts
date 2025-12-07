export const VaultRegistryABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_xHandle", "type": "string" },
            { "internalType": "uint8", "name": "_vaultType", "type": "uint8" },
            { "internalType": "string[]", "name": "_assetSymbols", "type": "string[]" },
            { "internalType": "uint16[]", "name": "_targetWeightsBps", "type": "uint16[]" }
        ],
        "name": "createVault",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_vaultId", "type": "uint256" },
            { "internalType": "string[]", "name": "_assetSymbols", "type": "string[]" },
            { "internalType": "uint16[]", "name": "_targetWeightsBps", "type": "uint16[]" }
        ],
        "name": "updateStrategy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "vaultId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "string", "name": "xHandle", "type": "string" },
            { "internalType": "uint8", "name": "vaultType", "type": "uint8" }
        ],
        "name": "VaultCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "vaultId", "type": "uint256" },
            { "internalType": "string[]", "name": "assetSymbols", "type": "string[]" },
            { "internalType": "uint16[]", "name": "targetWeightsBps", "type": "uint16[]" }
        ],
        "name": "StrategyUpdated",
        "type": "event"
    }
] as const;

// Replace with your deployed contract address
export const VAULT_REGISTRY_ADDRESS = "0x0000000000000000000000000000000000000000"; // Placeholder
