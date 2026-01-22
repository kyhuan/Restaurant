import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || "");
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const store = ref(JSON.parse(localStorage.getItem("store") || "null"));

  const setAuth = (payload) => {
    token.value = payload.token;
    user.value = payload.user;
    store.value = payload.store;
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    localStorage.setItem("store", JSON.stringify(payload.store));
  };

  const clearAuth = () => {
    token.value = "";
    user.value = null;
    store.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("store");
  };

  return {
    token,
    user,
    store,
    setAuth,
    clearAuth,
  };
});
