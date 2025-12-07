// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VaultRegistry {
    enum VaultType { Personal, DAO, xAI }

    struct Vault {
        uint256 id;
        address owner;
        string xHandle;
        VaultType vaultType;
        string[] assetSymbols;
        uint16[] targetWeightsBps; // Sum must be 10000 (100%)
    }

    uint256 public nextVaultId;
    mapping(uint256 => Vault) public vaults;

    event VaultCreated(uint256 indexed vaultId, address indexed owner, string xHandle, VaultType vaultType);
    event StrategyUpdated(uint256 indexed vaultId, string[] assetSymbols, uint16[] targetWeightsBps);

    constructor() {
        nextVaultId = 1;
    }

    function createVault(
        string memory _xHandle,
        VaultType _vaultType,
        string[] memory _assetSymbols,
        uint16[] memory _targetWeightsBps
    ) external returns (uint256) {
        require(_assetSymbols.length == _targetWeightsBps.length, "Arrays length mismatch");
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < _targetWeightsBps.length; i++) {
            totalWeight += _targetWeightsBps[i];
        }
        require(totalWeight == 10000, "Weights must sum to 10000");

        uint256 vaultId = nextVaultId++;
        
        vaults[vaultId] = Vault({
            id: vaultId,
            owner: msg.sender,
            xHandle: _xHandle,
            vaultType: _vaultType,
            assetSymbols: _assetSymbols,
            targetWeightsBps: _targetWeightsBps
        });

        emit VaultCreated(vaultId, msg.sender, _xHandle, _vaultType);
        emit StrategyUpdated(vaultId, _assetSymbols, _targetWeightsBps);

        return vaultId;
    }

    function updateStrategy(
        uint256 _vaultId,
        string[] memory _assetSymbols,
        uint16[] memory _targetWeightsBps
    ) external {
        Vault storage vault = vaults[_vaultId];
        require(vault.id != 0, "Vault does not exist");
        require(vault.owner == msg.sender, "Not vault owner");
        require(_assetSymbols.length == _targetWeightsBps.length, "Arrays length mismatch");

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < _targetWeightsBps.length; i++) {
            totalWeight += _targetWeightsBps[i];
        }
        require(totalWeight == 10000, "Weights must sum to 10000");

        vault.assetSymbols = _assetSymbols;
        vault.targetWeightsBps = _targetWeightsBps;

        emit StrategyUpdated(_vaultId, _assetSymbols, _targetWeightsBps);
    }

    function getVault(uint256 _vaultId) external view returns (Vault memory) {
        return vaults[_vaultId];
    }
}
