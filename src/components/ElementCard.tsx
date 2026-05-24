// Single periodic table cell.
import { memo } from "react";
import { categoryStyle, type PTElement } from "@/lib/periodic-table-data";

type Props = {
  element: PTElement;
  selected?: boolean;
  onClick?: (el: PTElement) => void;
};

function ElementCardImpl({ element, selected, onClick }: Props) {
  const s = categoryStyle(element.category);
  return (
    <button
      type="button"
      onClick={() => onClick?.(element)}
      className={`group relative aspect-square w-full rounded-md md:rounded-lg p-1 md:p-1.5 text-left transition-all duration-300
        ${s.bg} ${s.text} ring-1 ${s.ring} backdrop-blur-sm
        hover:scale-[1.08] hover:z-10 hover:shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:ring-primary/50
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${selected ? "scale-[1.1] z-10 ring-2 ring-primary shadow-[0_0_20px_rgba(45,212,191,0.4)]" : "shadow-sm"}`}
      title={`${element.name} — ${element.category}`}
    >
      <div className="absolute top-0.5 left-1 text-[7px] md:text-[8px] opacity-70 font-mono">
        {element.number}
      </div>
      <div className="flex h-full w-full flex-col items-center justify-center pt-2 md:pt-2.5">
        <div className="text-[11px] md:text-sm font-bold leading-none font-display">
          {element.symbol}
        </div>
        <div className="hidden md:block text-[6px] md:text-[7px] mt-0.5 opacity-80 truncate w-full text-center px-0.5">
          {element.name}
        </div>
      </div>
    </button>
  );
}

const ElementCard = memo(ElementCardImpl);
export default ElementCard;
