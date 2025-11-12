import { cn } from "@workspace/ui/lib/utils";
import { Droplets } from "lucide-react";
import AvatarSetting from "./AvatarSetting";

export default function Header({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-3 md:py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Droplets className="w-5 h-5 md:w-6 md:h-6" />
        <span className="text-lg md:text-xl font-semibold">Lagoon</span>
      </div>

      {/* User setting */}
      <div className="flex gap-2 md:gap-3 items-center">
        <AvatarSetting />
      </div>
    </header>
  );
}
