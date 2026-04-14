import { useEffect, useRef, useState } from "react";
import "./character-menu.css";
import { MoreHorizontal } from "lucide-react";
import { RaiderioProfile } from "@/features/views/api/raiderio.ts";
import raiderio2 from "@/assets/raiderio.png";
import summoned from "@/assets/summoned.png";

interface CharacterMenuProps {
  character: RaiderioProfile;
}

export function CharacterMenu({ character }: Readonly<CharacterMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openRaiderIO = () => {
    const realm = character.realm.replace(/\s+/g, "-");
    const name = character.name.toLowerCase();
    const region = character.region.toLowerCase();
    window.open(
      `https://raider.io/characters/${region}/${realm}/${name}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openSummonedIO = () => {
    const realm = character.realm.replace(/\s+/g, "-");
    const name = character.name.toLowerCase();
    const region = character.region.toLowerCase();
    window.open(
      `https://summoned.io/${region}/${realm}/${name}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="char-menu-wrapper" ref={menuRef}>
      <button
        className="char-menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreHorizontal className="chevron-icon" />
      </button>
      {isOpen && (
        <div className="char-menu-dropdown">
          <button
            className="char-menu-item"
            onClick={(e) => {
              e.stopPropagation();
              openRaiderIO();
              setIsOpen(false);
            }}
          >
            <img
              src={raiderio2}
              alt=""
              aria-hidden={true}
              className="char-menu-icon"
            />
            Raider.io
          </button>
          <button
            className="char-menu-item"
            onClick={(e) => {
              e.stopPropagation();
              openSummonedIO();
              setIsOpen(false);
            }}
          >
            <img
              src={summoned}
              alt=""
              aria-hidden={true}
              className="char-menu-icon"
            />
            Summoned.io
          </button>
        </div>
      )}
    </div>
  );
}
