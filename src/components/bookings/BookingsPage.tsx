"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import BookingList from "./BookingList";
import { Button } from "../ui/button";
import { addHours, startOfHour } from "date-fns";
import { Plus } from "lucide-react";
import { CreateBookingForm } from "../forms/CreateBookingForm";

// ===== TYPE DEFINITIONS =====
interface BookingDetail {
  id: string;
  project_id?: string;
  manager_id: string;
  subcontractor_id?: string;
  asset_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  asset?: {
    id: string;
    name: string;
    asset_code: string;
  };
  [key: string]: any;
}

interface BookingListResponse {
  bookings: BookingDetail[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// ===== HELPER FUNCTIONS =====

// Fixes Timezone/Midnight offset issue
const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
  try {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.split('T')[0];
    const cleanTime = timeStr ? timeStr.split('T').pop() : "00:00:00";
    // Construct ISO string for Local Time parsing
    return new Date(`${cleanDate}T${cleanTime}`);
  } catch (e) {
    return new Date();
  }
};

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 60;
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  return end - start;
};

const transformBookingToLegacyFormat = (booking: BookingDetail) => {
  const raw = booking._originalData || booking;
  
  // 1. Clean Strings
  const cleanStart = (raw.start_time || "00:00").split(':').slice(0, 2).join(':');
  const cleanEnd = (raw.end_time || "00:00").split(':').slice(0, 2).join(':');

  // 2. Date Objects
  const startDateObj = combineDateAndTime(raw.booking_date, raw.start_time);
  const endDateObj = combineDateAndTime(raw.booking_date, raw.end_time);

  const duration = calculateDuration(cleanStart, cleanEnd);
  
  // 3. Names
  const managerName = raw.manager 
    ? `${raw.manager.first_name} ${raw.manager.last_name}` 
    : "Unknown";
    
  const subName = raw.subcontractor?.company_name || 
                 (raw.subcontractor ? `${raw.subcontractor.first_name} ${raw.subcontractor.last_name}` : "");

  const bookedFor = raw.subcontractor_id ? subName : managerName;

  // 4. Assets
  let assetId = "unknown";
  let assetName = "Unknown Asset";
  let assetCode = "";

  if (raw.asset && typeof raw.asset === 'object') {
    assetId = raw.asset.id || raw.asset.asset_id || assetId;
    assetName = raw.asset.name || assetName;
    assetCode = raw.asset.asset_code || raw.asset.code || assetCode;
  } else if (raw.asset_id) {
    assetId = raw.asset_id;
    if (booking.assetName && booking.assetName !== "Unknown Asset") assetName = booking.assetName;
  }

  if (assetName === "Unknown Asset" && assetId !== "unknown") {
      if (assetCode) assetName = `Asset ${assetCode}`;
      else assetName = `Asset ${assetId.slice(0, 6)}...`;
  }

  return {
    bookingKey: raw.id,
    bookingTitle: raw.project?.name || "Booking",
    bookingDescription: raw.notes || "",
    bookingNotes: raw.notes || "",
    
    bookingTimeDt: raw.booking_date,
    bookingStartTime: cleanStart, 
    bookingEndTime: cleanEnd,     
    
    start: startDateObj,
    end: endDateObj,
    bookingStart: startDateObj,
    bookingEnd: endDateObj,
    
    bookingDurationMins: duration,
    bookingStatus: (raw.status || "pending").charAt(0).toUpperCase() + (raw.status || "pending").slice(1),
    bookingFor: bookedFor || "Unknown",
    
    bookedAssets: [assetName],
    assetId: assetId,
    assetName: assetName,
    assetCode: assetCode,
    
    subcontractorId: raw.subcontractor_id,
    subcontractorName: subName,
    
    _originalData: raw,
  };
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [bookings, setBookings] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const { user } = useAuth();
  const hasFetched = useRef(false);
  const userId = user?.id;
  
  // ✅ SHARED KEY V5
  const storageKey = `bookings_v5_${userId}`; 
  const projectStorageKey = `project_${userId}`;
  
  const now = new Date();
  const nextHour = startOfHour(addHours(now, 1));
  const endHour = addHours(nextHour, 1);

  const processRawBookings = (rawBookings: BookingDetail[]) => {
    const validBookings = rawBookings.filter(b => b && (b.id || b.bookingKey));
    return validBookings.map(transformBookingToLegacyFormat);
  };

  // ✅ UPDATED: Accepts isBackground flag
  const fetchBookings = async (isBackground = false) => {
    if (!user) return;

    // Only show spinner if this is a hard load AND we have no data
    if (!isBackground && bookings.length === 0) {
        setLoading(true);
    }

    const projectString = localStorage.getItem(projectStorageKey);
    if (!projectString) {
      console.error("No project found");
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) console.log("Fetching fresh bookings...");
      
      const project = JSON.parse(projectString);
      const response = await api.get<BookingListResponse>("/bookings/", {
        params: { project_id: project.id, limit: 1000, skip: 0 },
      });

      const rawBookings = response.data?.bookings || [];
      
      // Save & Update
      localStorage.setItem(storageKey, JSON.stringify(rawBookings));
      const uiBookings = processRawBookings(rawBookings);
      setBookings(uiBookings);
      hasFetched.current = true;
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
    } finally {
      // Always turn off loading when done
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    let hasCache = false;

    // 1. LOAD CACHE INSTANTLY
    const cachedData = localStorage.getItem(storageKey);
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log("⚡ Instant Load from Cache (List)");
            const uiBookings = processRawBookings(parsedData);
            setBookings(uiBookings);
            setLoading(false); // Hide spinner immediately
            hasCache = true;
        }
      } catch (error) {
        localStorage.removeItem(storageKey);
      }
    }

    // 2. FETCH FRESH DATA
    if (!hasFetched.current) {
      // If we found cache, fetch in background (true). If not, show spinner (false).
      fetchBookings(hasCache);
    }

    const interval = setInterval(() => fetchBookings(true), 300000);
    return () => clearInterval(interval);
  }, [user]);

  const handleActionComplete = () => fetchBookings(true);
  const handleOnClickButton = () => setIsBookingFormOpen(true);
  const handleSaveBooking = () => {
    setIsBookingFormOpen(false);
    fetchBookings(true); // Force refresh
  };

  return (
    <Card className="px-6 sm:my-8 mx-4 bg-stone-100">
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">See your scheduled events.</p>
          </div>
          <Button onClick={handleOnClickButton} className="hidden sm:flex mt-4 sm:mt-0 cursor-pointer">Create new booking</Button>
          <Button onClick={handleOnClickButton} className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-10" size="icon"><Plus size={24} /></Button>
        </div>
        {isBookingFormOpen && (
          <CreateBookingForm isOpen={isBookingFormOpen} onClose={() => setIsBookingFormOpen(false)} startTime={nextHour} endTime={endHour} onSave={handleSaveBooking} />
        )}
        <div className="mt-4 sm:mt-6 border-b overflow-x-auto pb-1">
          <div className="flex w-max min-w-full">
            {["Upcoming", "Pending", "Confirmed", "Completed", "Cancelled", "All"].map((tab) => (
              <button key={tab} className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium whitespace-nowrap ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab(tab)}>{tab}</button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <BookingList bookings={bookings} activeTab={activeTab} loading={loading} onActionComplete={handleActionComplete} />
        </div>
      </div>
    </Card>
  );
}