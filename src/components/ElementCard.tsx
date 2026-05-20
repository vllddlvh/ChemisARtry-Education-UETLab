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
      className={`group relative aspect-square w-full rounded-md md:rounded-lg p-1 md:p-1.5 text-left transition
        ${s.bg} ${s.text} ring-1 ${s.ring}
        hover:scale-[1.08] hover:z-10 hover:shadow-lg
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${selected ? "scale-[1.1] z-10 ring-2 ring-primary shadow-xl" : ""}`}
      title={`${element.name} — ${element.category}`}
    >
      <div className="absolute top-0.5 left-1 text-[8px] md:text-[10px] opacity-70 font-mono">
        {element.number}
      </div>
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="text-sm md:text-lg font-bold leading-none font-display">
            {element.symbol}
          </div>
          <div className="hidden md:block text-[8px] mt-0.5 opacity-80 truncate max-w-[3.5rem]">
            {element.name}
          </div>
        </div>
      </div>
    </button>
  );
}

const ElementCard = memo(ElementCardImpl);
export default ElementCard;
