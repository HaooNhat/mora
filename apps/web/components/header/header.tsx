import { Button } from "@workspace/ui/components/button";
import { Bubbles } from "lucide-react";
import AvatarSetting from "./AvatarSetting";

export default function Header() {
  return (
    <>
      <header className="absolute top-0 w-full flex items-center justify-between px-4 py-4 z-10">
        <div className="text-2xl italic">Lagoon</div>

        {/* User setting */}
        <div className="flex gap-4 md:gap-6 items-center">
          <Button variant={"outline"}>
            <Bubbles />0 days
          </Button>
          <AvatarSetting />
        </div>
      </header>
    </>
  );
}
