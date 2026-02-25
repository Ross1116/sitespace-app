"use client";

export function WatchVideoButton() {
  return (
    <button
      type="button"
      className="shine bg-transparent text-amber-500 border-2 border-amber-500 rounded-full px-[22px] py-[10px] text-[17px] font-semibold hover:bg-amber-500 hover:text-black transition-colors cursor-pointer"
      onClick={() => {
        // TODO: open video modal
      }}
    >
      Watch Video
    </button>
  );
}
