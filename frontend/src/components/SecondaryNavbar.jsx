"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SecondaryNavbar() {
  const [currentChain, setCurrentChain] = React.useState("");
  const pathname = usePathname();
  const isActive = (path) => pathname.endsWith(path);

  useEffect(() => {
    if (pathname) {
      const chain_name = pathname.split("/")[2];
      setCurrentChain(chain_name);
    }
  }, []);
  return (
    <div className="  w-fit  p-2 rounded-full flex  bg-white shadow-lg font-bold">
      <Link
        href={`/agent/${currentChain}/code`}
        className={` rounded-full px-4 py-2 transition-colors duration-200 ${
          isActive("code")
            ? "bg-theme-purple   font-bold"
            : "text-gray-600 hover:bg-theme-purple-light"
        }`}
      >
        Code
      </Link>
      <Link
        href={`/agent/${currentChain}/chat`}
        className={` rounded-full px-4 py-2 transition-colors duration-200 ${
          isActive("chat")
            ? "bg-theme-purple   font-bold"
            : "text-gray-600 hover:bg-theme-purple-light"
        }`}
      >
        Chat
      </Link>
    </div>
  );
}
