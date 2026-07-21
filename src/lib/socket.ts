// socket.ts
import { io } from "socket.io-client";
import { supabase } from "./supabaseClient";
import { BACKEND_URL } from "./axiosInstance";

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  auth: async (callback) => {
    const { data } = await supabase.auth.getSession();
    callback({ token: data.session?.access_token ?? "" });
  },
});
