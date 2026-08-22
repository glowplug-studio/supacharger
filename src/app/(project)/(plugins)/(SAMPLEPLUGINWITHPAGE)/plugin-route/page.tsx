"use client";

import Link from "next/link";

import SCSiteLogo from "@/components/sc_demo/sc_site-logo";

export default function samplePluginRoute() {

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow-sm sm:rounded-lg sm:px-12">
          <div className="mb-3 block">
            <SCSiteLogo showSiteTitle={false} darkMode={false} />
          </div>
          <h1 className="mb-8 text-2xl/9 font-bold tracking-tight text-gray-700">
            Hello this is a sample plugin rotue
          </h1>
        </div>
      </div>
    </div>
  );
}