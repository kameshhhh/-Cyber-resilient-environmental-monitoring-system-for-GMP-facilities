import React, { createContext, useContext } from "react";
import { useSensorData } from "../hooks/useSensorData";
import { useSupabase } from "../hooks/useSupabase";

const DashboardContext = createContext(null);

// Feature flag to enable/disable Supabase
// Set to true to use Supabase cloud database
// Set to false to use local storage (offline mode)
const USE_SUPABASE = true;

export const DashboardProvider = ({ children }) => {
  // Use Supabase hook for cloud database or local hook for offline mode
  const supabaseData = useSupabase(true);
  const localData = useSensorData(true);

  // Select data source based on feature flag
  const sensorData = USE_SUPABASE ? supabaseData : localData;

  return (
    <DashboardContext.Provider value={sensorData}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

export default DashboardContext;
