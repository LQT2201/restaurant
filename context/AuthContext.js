import React, { createContext, useState, useEffect } from "react";
import { authenticateStaff } from "../database/staffOperations";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const user = await authenticateStaff(username, password);
      if (user) {
        // Store user information in secure storage
        const userString = JSON.stringify(user);
        await SecureStore.setItemAsync("userToken", userString);
        setUserToken(userString);
        setUserInfo(user);
        return user;
      } else {
        console.log("Authentication failed - no user returned");
        return null;
      }
    } catch (error) {
      console.error("Login error:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync("userToken");
      setUserToken(null);
      setUserInfo(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const userToken = await SecureStore.getItemAsync("userToken");
      if (userToken) {
        setUserToken(userToken);
        setUserInfo(JSON.parse(userToken));
      }
    } catch (error) {
      console.error("isLoggedIn error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userInfo,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
