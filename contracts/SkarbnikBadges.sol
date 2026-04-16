// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract SkarbnikBadges is ERC1155, Ownable {
    error InvalidBadgeId(uint256 badgeId);
    error BadgeAlreadyOwned(address user, uint256 badgeId);

    uint256 public constant FIRST_QUEST_COMPLETED = 1;
    uint256 public constant SILVER_TREASURER = 2;
    uint256 public constant GOLDEN_TREASURER = 3;
    uint256 public constant TRIAL_PASSED = 4;
    uint256 public constant TREASURE_GUARDIAN = 5;

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
        if (badgeId < FIRST_QUEST_COMPLETED || badgeId > TREASURE_GUARDIAN) {
            revert InvalidBadgeId(badgeId);
        }
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
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
