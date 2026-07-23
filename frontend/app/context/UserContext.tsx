import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  [key: string]: any; // Allow other properties
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AsyncStorage.getItem("user");
        if (data) {
          setUser(JSON.parse(data));
        }
      } catch (error) {
        console.error("Error loading user from AsyncStorage:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
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
