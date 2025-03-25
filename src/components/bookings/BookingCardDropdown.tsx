import { Calendar, X, ChevronDown } from "lucide-react";

interface BookingCardDropdownProps {
  bookingKey: string;
  bookingStatus: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function BookingCardDropdown({
  bookingKey,
  bookingStatus,
  isOpen,
  onToggle,
}: BookingCardDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`px-3 py-1 text-xs rounded-md flex items-center
        ${
          bookingStatus === "Pending"
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        Edit
        <ChevronDown
          size={14}
          className={`ml-1 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-48 bg-white rounded-md shadow-lg z-10 border">
          <div className="py-1">
            {bookingStatus === "Pending" && (
              <>
                <button className="flex items-center px-3 py-2 text-xs text-green-600 hover:bg-gray-100 w-full text-left">
                  <Calendar size={14} className="mr-2" />
                  Confirm booking
                </button>
                <button className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left">
                  <X size={14} className="mr-2" />
                  Deny booking
                </button>
                <div className="border-t my-1"></div>
              </>
            )}
            <button className="flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left">
              <Calendar size={14} className="mr-2" />
              Reschedule booking
            </button>
            {bookingStatus === "Confirmed" && (
              <button className="flex items-center px-3 py-2 text-xs text-red-600 hover:bg-gray-100 w-full text-left">
                <X size={14} className="mr-2" />
                Cancel booking
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}