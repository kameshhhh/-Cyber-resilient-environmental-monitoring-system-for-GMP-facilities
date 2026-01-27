import React from "react";
import RoomCard from "../RoomCard";
import { useDashboard } from "../../contexts/DashboardContext";

const RoomGrid = () => {
  const { rooms, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg h-72 animate-pulse"
          >
            <div className="h-14 bg-gray-200 rounded-t-xl"></div>
            <div className="p-4 space-y-4">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
              <div className="h-16 bg-gray-200 rounded-lg"></div>
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-gray-500 text-sm mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
};

export default RoomGrid;
