import { motion } from "framer-motion";
import CaseFrame from "../components/CaseFrame";
import { caseClosed } from "../data/memories";

export default function CompleteRoom() {
  return (
    <CaseFrame theme="cream">
      
      <div className="archive-content flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 text-center">
        <span className="archive-endnote">CASE #2711 / TO BE CONTINUED IN PERSON</span>
        <h1 className="archive-endmark">Case closed.<br /><em>For now.</em></h1>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-ink-soft">
          {caseClosed.footer}
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-2xl">
          {caseClosed.heart}
        </motion.p>
      </div>
    </CaseFrame>
  );
}
