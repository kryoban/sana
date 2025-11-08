"use client";

import { useState } from "react";
import Image from "next/image";
import { User, Stethoscope, LogIn, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("ANA");
  const [selectedRole, setSelectedRole] = useState("");

  const tabs = [
    "Obligații de plată",
    "ANA",
    "ANAF",
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
                  className="cursor-pointer text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                >
                  Acasă
                </a>
                <a
                  href="#"
                  className="cursor-pointer text-gray-600 hover:text-gray-900"
                >
                  Instituții înrolate
                </a>
                <a
                  href="#"
                  className="cursor-pointer text-gray-600 hover:text-gray-900"
                >
                  Legislație
                </a>
                <a
                  href="#"
                  className="cursor-pointer text-gray-600 hover:text-gray-900"
                >
                  Întrebări frecvente
                </a>
                <a
                  href="#"
                  className="cursor-pointer text-gray-600 hover:text-gray-900"
                >
                  Contact
                </a>
              </nav>
              <a
                href="#"
                className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium"
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
                const isDisabled = tab !== "ANA";
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      if (!isDisabled) {
                        setActiveTab(tab);
                      }
                    }}
                    className={`cursor-pointer px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                    disabled={isDisabled}
                  >
                    <span className="flex items-center gap-1.5">
                      {!isDisabled && <Heart className="size-4" />} {tab}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-8">
            {activeTab === "ANA" && (
              <div className="space-y-6">
                <div>
                  <div className="text-center mb-6">
                    <div className="flex justify-center mt-6 mb-4">
                      <Image
                        src="/images/logo_ana.svg"
                        alt="ANA - Asistentul Neuro-Artificial"
                        width={105}
                        height={46}
                        className="h-auto w-auto max-w-full"
                        priority
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <label
                      className={`relative flex flex-col items-center p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRole === "Pacient"
                          ? "border-[#FF008C] bg-[#FF008C]/10"
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
                            ? "bg-[#FF008C] text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <User className="size-8" />
                      </div>
                      <span
                        className={`text-lg font-semibold ${
                          selectedRole === "Pacient"
                            ? "text-[#FF008C]"
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
                          ? "border-[#FF008C] bg-[#FF008C]/10"
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
                            ? "bg-[#FF008C] text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Stethoscope className="size-8" />
                      </div>
                      <span
                        className={`text-lg font-semibold ${
                          selectedRole === "Medic"
                            ? "text-[#FF008C]"
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
                          ? "cursor-pointer bg-[#FF008C] text-white hover:bg-[#E6007A] shadow-sm"
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
            {activeTab !== "ANA" && (
              <div className="text-gray-500 text-center py-8">
                Conținut pentru {activeTab}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-shrink-0">
              <div className="inline-block">
                <Image
                  src="/images/logo_aadr.png"
                  alt="Autoritatea pentru Digitalizarea României"
                  width={200}
                  height={80}
                  className="h-auto"
                />
              </div>
            </div>
            <div className="space-y-4">
              <ul className="flex flex-wrap gap-4 md:gap-6">
                <li>
                  <span className="text-gray-600 text-sm">
                    Termeni și condiții
                  </span>
                </li>
                <li>
                  <span className="text-gray-600 text-sm">
                    Protecția datelor personale
                  </span>
                </li>
              </ul>
              <ul>
                <li className="text-sm text-gray-600">
                  <span className="hidden">GVP-09 3797</span>
                  <abbr title="Sistemul Național Electronic de Plată Online">
                    SNEP
                  </abbr>{" "}
                  este dedicat în acest moment{" "}
                  <abbr title="Persoană fizică">PF</abbr>,{" "}
                  <abbr title="Persoană fizică autorizată">PFA</abbr> şi{" "}
                  <abbr title="Persoană juridică">PJ</abbr>.
                </li>
              </ul>
              <ul>
                <li className="text-sm text-gray-600 flex items-center gap-2">
                  Proiect susținut de{" "}
                  <span className="inline-block" title="APERO">
                    <Image
                      src="/images/logo_apero.png"
                      alt="APERO"
                      width={80}
                      height={30}
                      className="h-auto"
                    />
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
