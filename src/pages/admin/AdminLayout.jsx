import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { useLanguage } from "../../context/LanguageContext";
import { t } from "../../i18n/translations";

export default function AdminLayout({ children, title = "Admin" }) {
  const { language } = useLanguage();
  // AdminLayout now uses the shared Header and Sidebar components so styling is consistent
  return (
    <div className="flex min-h-screen bg-gray-100 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <main className="p-3 sm:p-5 md:p-8">
          {title && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#77BEF0" }}>{title}</h1>
                <div className="text-sm text-gray-500 mt-1">
                  {t("adminLayout.systemAdmin", language)}
                </div>
              </div>
            </div>
          )}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


