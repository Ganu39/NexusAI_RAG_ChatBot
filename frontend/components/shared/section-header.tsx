"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "center",
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className={`mb-16 max-w-3xl ${
        align === "center" ? "mx-auto text-center" : ""
      }`}
    >
      {badge && (
        <Badge variant="default" className="mb-4">
          {badge}
        </Badge>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-text-primary">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
    </motion.div>
  );
}
