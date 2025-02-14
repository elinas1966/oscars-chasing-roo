import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative h-[80vh] flex items-center justify-center text-center px-4 bg-gradient-to-b from-black/60 to-background"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl mb-6 text-white bg-clip-text">
          Chasing Roo
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
          Academy Award® Shortlisted Documentary
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-medium">
            2024 Oscar® Shortlist
          </span>
          <span className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-medium">
            Documentary Short Film
          </span>
        </div>
      </div>
    </motion.section>
  );
};