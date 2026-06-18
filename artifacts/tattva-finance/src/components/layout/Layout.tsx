import React, { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { QuickExpenseSheet } from "@/components/shared/QuickExpenseSheet";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useFinance } from "@/context/FinanceContext";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();
  const { settings } = useFinance();

  useEffect(() => {
    document.title = settings.appName;
  }, [settings.appName]);

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground selection:bg-primary/20">
      <Sidebar />
      <main className="flex-1 flex flex-col relative w-full overflow-x-hidden">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav />
      <QuickExpenseSheet />
    </div>
  );
};
