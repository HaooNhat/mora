import { Button } from "@workspace/ui/components/button";
import { FoldersIcon } from "@workspace/ui/components/lucide-animated-icons";
import { cn } from "@workspace/ui/lib/utils";
import { FolderPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface TasksHeaderProps {
  onCreateProject: () => void;
  className?: string;
}

export function TasksHeader({ onCreateProject, className }: TasksHeaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      style={{ borderRadius: 24 }}
      className={cn(
        "p-3 flex items-center justify-between gap-3 border-2 hover:bg-card cursor-pointer bg-card/80 transition-colors",
        className,
      )}
    >
      <motion.div
        layout
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="flex gap-2 items-center"
      >
        <FoldersIcon isHovered={isHovered} size={20} />
        <h2 className="text-lg font-semibold">Tasks</h2>
      </motion.div>

      <Button
        asChild
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onCreateProject();
        }}
      >
        <motion.button layout="position" style={{ borderRadius: "24px" }}>
          <FolderPlus className="w-4 h-4" />
        </motion.button>
      </Button>
    </motion.div>
  );
}
