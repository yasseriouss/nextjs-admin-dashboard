"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="h-10 px-3 rounded-lg border border-card-border bg-card-background text-icon-primary text-xs font-semibold shadow-xs outline-none hover:bg-background-gray-primary focus-visible:border-input-primary-focus-border focus-visible:ring-4 focus-visible:ring-input-primary-focus-border/20 flex items-center gap-1.5 cursor-pointer transition-colors"
      title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe className="size-4 text-icon-tertiary" />
      <span>{lang === "ar" ? "EN" : "عربي"}</span>
    </button>
  );
}
