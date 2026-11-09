"use client";

import { siteConfig } from "@/config/site";
import { toast } from "./toast";

export function WhatsAppButton({ number }: { number?: string }) {
  const num = number || siteConfig.whatsappNumber;

  const onClick = () => {
    if (!num) {
      toast("WhatsApp numarası ayarlanmadı — yönetim panelinden girilebilir.");
      return;
    }
    window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(siteConfig.whatsappMessage), "_blank");
  };

  return (
    <button id="wa" aria-label="WhatsApp ile yazın" onClick={onClick} type="button">
      <svg className="i">
        <use href="#i-wa" />
      </svg>
    </button>
  );
}
