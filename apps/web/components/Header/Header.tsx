import { cn } from "@workspace/ui/lib/utils";
import { Droplets } from "lucide-react";
import AvatarSetting from "./AvatarSetting";

export default function Header({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-4 md:py-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 opacity-90">
        <Droplets className="size-6 md:size-7 lg:size-8 opacity-75" />
        <span className="text-2xl md:text-3xl font-semibold text-shadow-lg opacity-75">
          Lagoon
        </span>
      </div>

      {/* User setting */}
      <div className="flex gap-2 md:gap-3 items-center">
        <AvatarSetting />
      </div>
    </header>
  );
}
