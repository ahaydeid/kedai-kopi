import React from "react";
import { FiChevronRight } from "react-icons/fi";

export interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarMenuProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  menuItems: MenuItem[];
  trimToWord: (text: string, max: number) => string;
  showActive?: boolean;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  activeTab,
  setActiveTab,
  menuItems,
  trimToWord,
  showActive,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800/80 overflow-hidden">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = showActive !== false && activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="w-full flex items-center justify-between py-4 pl-4 pr-3 md:py-5 md:pl-5 md:pr-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 active:bg-zinc-100 dark:active:bg-zinc-800/60 text-left outline-none cursor-pointer group relative border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0"
          >
            {isActive && (
              <span className="absolute left-3 top-3 bottom-3 w-1 rounded-full bg-sky-600 dark:bg-zinc-200" />
            )}
            <div className="flex items-center gap-4.5 pl-1.5 min-w-0 flex-1 overflow-hidden">
              <Icon
                className={`w-6 h-6 flex-shrink-0 ${
                  isActive ? "text-sky-600 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                }`}
              />
              <div className="min-w-0 overflow-hidden">
                <h3
                  className={`text-[15px] font-semibold ${
                    isActive ? "text-sky-600 dark:text-zinc-200" : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-normal truncate">
                  {trimToWord(item.subtitle, 30)}
                </p>
              </div>
            </div>
            <FiChevronRight
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                isActive ? "text-sky-600 dark:text-zinc-200 translate-x-0.5" : "text-zinc-400 dark:text-zinc-500"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
