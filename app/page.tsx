"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Stethoscope, LogIn } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("SANA");
  const [selectedRole, setSelectedRole] = useState("");

  const tabs = [
    "Obligații de plată",
    "ANAF",
    "SANA",
    "HUB MAI(Cazier)",
    "Rovinietă",
    "Utilități",
    "Amenzi",
    "Alte taxe",
    "Asigurare locuințe",
    "Titluri de stat",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/images/logo_ghiseul_orizontal.svg"
                alt="Ghișeul.ro"
                width={160}
                height={40}
                className="h-12 w-auto"
                priority
              />
            </div>
            <div className="flex items-start gap-6">
              <nav className="hidden md:flex gap-6">
                <a
                  href="#"
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                >
                  Acasă
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Instituții înrolate
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Legislație
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Întrebări frecvente
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </nav>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Contul meu
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Info Section */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 border-2 border-gray-300">
              <AvatarFallback className="bg-gray-100 text-gray-400">
                <User className="size-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-h-[64px] flex flex-col justify-center">
              <div className="flex items-baseline gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  GEORGESCU ANDREI
                </h2>
                <span className="text-sm text-gray-600">1901213254491</span>
              </div>
              <p className="text-sm text-gray-700">
                Sector 6, Mun.Bucureşti, Str.Dezrobirii, nr. 25, bl. 1, sc. 2,
                et. 7, ap. 91
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const isDisabled = tab !== "SANA";
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      if (!isDisabled) {
                        setActiveTab(tab);
                      }
                    }}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "SANA" && (
              <div className="space-y-6">
                <div>
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-semibold text-blue-700 mt-6 mb-2">
                      ANA - Asistentul Neuro-Artificial
                    </h2>
                    <p className="text-base text-gray-600">
                      Selectați tipul de utilizator pentru a continua
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <label
                      className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRole === "Pacient"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="Pacient"
                        checked={selectedRole === "Pacient"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                          selectedRole === "Pacient"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <User className="size-8" />
                      </div>
                      <span
                        className={`text-lg font-semibold ${
                          selectedRole === "Pacient"
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        Pacient
                      </span>
                      <span className="text-sm text-gray-600 mt-1 text-center">
                        Accesați serviciile medicale
                      </span>
                    </label>
                    <label
                      className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRole === "Medic"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="Medic"
                        checked={selectedRole === "Medic"}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                          selectedRole === "Medic"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Stethoscope className="size-8" />
                      </div>
                      <span
                        className={`text-lg font-semibold ${
                          selectedRole === "Medic"
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        Medic
                      </span>
                      <span className="text-sm text-gray-600 mt-1 text-center">
                        Accesați panoul medical
                      </span>
                    </label>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        if (selectedRole === "Pacient") {
                          window.open("/pacient", "_blank");
                        } else if (selectedRole === "Medic") {
                          window.open("/medic", "_blank");
                        }
                      }}
                      className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        selectedRole
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={!selectedRole}
                    >
                      <LogIn className="size-5" />
                      Login
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab !== "SANA" && (
              <div className="text-gray-500 text-center py-8">
                Conținut pentru {activeTab}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
