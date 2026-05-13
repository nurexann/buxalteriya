"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

export function TelegramBootstrap() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const initData = webApp?.initData;

    webApp?.ready?.();
    webApp?.expand?.();

    if (!initData || sessionStorage.getItem("telegram-auth-tried") === initData) {
      return;
    }

    sessionStorage.setItem("telegram-auth-tried", initData);

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ initData })
    }).then((response) => {
      if (response.ok && window.location.pathname === "/login") {
        window.location.href = "/";
      }
    });
  }, []);

  return null;
}
