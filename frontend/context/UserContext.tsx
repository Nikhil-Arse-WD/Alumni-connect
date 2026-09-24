import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Configure Axios global interceptor
axios.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error fetching token:", error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface User {
  id?: number;
  email?: string;
  full_name?: string;
  profile_photo?: string;
  is_password_changed?: number;
  photo_updated_at?: string;
  designation?: string;
  organisation?: string;
  city?: string;
  country?: string;
  programme?: string;
  batch_year?: string;
  industry?: string;
  years_of_experience?: string;
  mobile?: string;
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      try {
        const [userData, adminData] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("admin")
        ]);
        
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          setUser(null);
        }

        if (adminData) {
          setIsAdminLoggedIn(true);
        } else {
          setIsAdminLoggedIn(false);
        }
      } catch (error) {
        console.error("Error loading user/admin from AsyncStorage:", error);
      } finally {
        setLoading(false);
      }
    };
    loadState();

    // Cross-tab session synchronization for Web
    if (Platform.OS === "web") {
      const syncTabState = (e: StorageEvent) => {
        // Trigger a reload of the user/admin state when localStorage is modified by another tab
        loadState();
      };
      window.addEventListener("storage", syncTabState);
      return () => window.removeEventListener("storage", syncTabState);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isAdminLoggedIn, setIsAdminLoggedIn, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserProvider;
