import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useLocation } from "react-router-dom";

const enterTransition: Transition = { duration: 0.35, ease: "easeOut" };
const exitTransition: Transition = { duration: 0.2, ease: "easeIn" };

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: enterTransition }}
        exit={{ opacity: 0, y: -8, transition: exitTransition }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
