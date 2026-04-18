// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract SkarbnikBadges is ERC1155, Ownable {
    error InvalidBadgeId(uint256 badgeId);
    error BadgeAlreadyOwned(address user, uint256 badgeId);
    error BadgeIsSoulbound(uint256 badgeId);

    uint256 public constant FIRST_QUEST_COMPLETED = 1;
    uint256 public constant SILVER_TREASURER = 2;
    uint256 public constant GOLDEN_TREASURER = 3;
    uint256 public constant TRIAL_PASSED = 4;
    uint256 public constant TREASURE_GUARDIAN = 5;
    uint256 public constant BLOCKCHAIN_WALLET_SCHOLAR = 6;
    uint256 public constant STABLECOIN_TOKEN_KEEPER = 7;
    uint256 public constant DEX_PATHFINDER = 8;
    uint256 public constant YIELD_STAKING_STRATEGIST = 9;
    uint256 public constant SMART_CONTRACT_ARTISAN = 10;
    uint256 public constant SAFETY_SENTINEL = 11;
    uint256 public constant QUEST_L1_BLOCKCHAIN = 12;
    uint256 public constant QUEST_L1_WALLET = 13;
    uint256 public constant QUEST_L1_USDC = 14;
    uint256 public constant QUEST_L1_TRANSACTION = 15;
    uint256 public constant QUEST_L1_GAS = 16;
    uint256 public constant QUEST_L2_DEFI = 17;
    uint256 public constant QUEST_L2_DEX = 18;
    uint256 public constant QUEST_L2_YIELD = 19;
    uint256 public constant QUEST_L2_LIQUIDITY = 20;
    uint256 public constant QUEST_L2_SMART = 21;
    uint256 public constant QUEST_L3_IL = 22;
    uint256 public constant QUEST_L3_RWA = 23;
    uint256 public constant QUEST_L3_RISK = 24;
    uint256 public constant QUEST_L3_RUG = 25;
    uint256 public constant QUEST_L3_BOSS = 26;
    uint256 public constant LEVEL_1_MASTER = 27;
    uint256 public constant LEVEL_2_MASTER = 28;
    uint256 public constant LEVEL_3_MASTER = 29;
    uint256 public constant MAX_BADGE_ID = LEVEL_3_MASTER;

    string public constant CONTRACT_NAME = "Skarbnik Badges";

    string private _baseMetadataURI;
    mapping(uint256 => string) private _badgeNames;

    event BadgeMinted(address indexed user, uint256 indexed badgeId);

    constructor(string memory baseMetadataURI_) ERC1155("") Ownable(msg.sender) {
        _baseMetadataURI = baseMetadataURI_;

        _badgeNames[FIRST_QUEST_COMPLETED] = unicode"Początkujący Skarbnik";
        _badgeNames[SILVER_TREASURER] = "Srebrny Skarbnik";
        _badgeNames[GOLDEN_TREASURER] = unicode"Złoty Skarbnik";
        _badgeNames[TRIAL_PASSED] = unicode"Próba Zdana";
        _badgeNames[TREASURE_GUARDIAN] = unicode"Strażnik Skarbu";
        _badgeNames[BLOCKCHAIN_WALLET_SCHOLAR] = "Blockchain i Portfel";
        _badgeNames[STABLECOIN_TOKEN_KEEPER] = "Stablecoiny i Tokeny";
        _badgeNames[DEX_PATHFINDER] = "Nawigator DEX";
        _badgeNames[YIELD_STAKING_STRATEGIST] = "Yield i Staking";
        _badgeNames[SMART_CONTRACT_ARTISAN] = "Smart Kontrakty";
        _badgeNames[SAFETY_SENTINEL] = unicode"Strażnik Bezpieczeństwa";
        _badgeNames[QUEST_L1_BLOCKCHAIN] = "Quest: Blockchain";
        _badgeNames[QUEST_L1_WALLET] = "Quest: Portfel";
        _badgeNames[QUEST_L1_USDC] = "Quest: USDC";
        _badgeNames[QUEST_L1_TRANSACTION] = "Quest: Transakcja";
        _badgeNames[QUEST_L1_GAS] = "Quest: Gas Fee";
        _badgeNames[QUEST_L2_DEFI] = "Quest: DeFi";
        _badgeNames[QUEST_L2_DEX] = "Quest: DEX vs CEX";
        _badgeNames[QUEST_L2_YIELD] = "Quest: Yield";
        _badgeNames[QUEST_L2_LIQUIDITY] = "Quest: Plynnosc";
        _badgeNames[QUEST_L2_SMART] = "Quest: Smart Kontrakty";
        _badgeNames[QUEST_L3_IL] = "Quest: Impermanent Loss";
        _badgeNames[QUEST_L3_RWA] = "Quest: RWA";
        _badgeNames[QUEST_L3_RISK] = "Quest: Ryzyko";
        _badgeNames[QUEST_L3_RUG] = "Quest: Rug Pull";
        _badgeNames[QUEST_L3_BOSS] = "Quest: Proba Skarbnika";
        _badgeNames[LEVEL_1_MASTER] = "Mistrz Poziomu 1";
        _badgeNames[LEVEL_2_MASTER] = "Mistrz Poziomu 2";
        _badgeNames[LEVEL_3_MASTER] = "Mistrz Poziomu 3";
    }

    function mintBadge(address to, uint256 badgeId) external onlyOwner {
        _requireValidBadgeId(badgeId);

        if (balanceOf(to, badgeId) > 0) {
            revert BadgeAlreadyOwned(to, badgeId);
        }

        _mint(to, badgeId, 1, "");
        emit BadgeMinted(to, badgeId);
    }

    function hasBadge(address user, uint256 badgeId) external view returns (bool) {
        _requireValidBadgeId(badgeId);
        return balanceOf(user, badgeId) > 0;
    }

    function badgeName(uint256 badgeId) external view returns (string memory) {
        _requireValidBadgeId(badgeId);
        return _badgeNames[badgeId];
    }

    function setBaseMetadataURI(string calldata newBaseMetadataURI) external onlyOwner {
        _baseMetadataURI = newBaseMetadataURI;
    }

    function uri(uint256 badgeId) public view override returns (string memory) {
        _requireValidBadgeId(badgeId);
        return string.concat(_baseMetadataURI, Strings.toString(badgeId), ".json");
    }

    function _requireValidBadgeId(uint256 badgeId) internal pure {
        if (badgeId < FIRST_QUEST_COMPLETED || badgeId > MAX_BADGE_ID) {
            revert InvalidBadgeId(badgeId);
        }
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        // Achievement badges are soulbound: minting is allowed, transfers are blocked.
        if (from != address(0) && to != address(0)) {
            revert BadgeIsSoulbound(ids.length > 0 ? ids[0] : 0);
        }

        super._update(from, to, ids, values);

        if (to == address(0)) {
            return;
        }

        uint256 idsLength = ids.length;
        for (uint256 i = 0; i < idsLength; ++i) {
            if (values[i] > 0 && balanceOf(to, ids[i]) > 1) {
                revert BadgeAlreadyOwned(to, ids[i]);
            }
        }
    }
}
