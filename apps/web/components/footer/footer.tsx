import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Wallpaper } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface FooterProps {
  setBgType: Dispatch<SetStateAction<"video" | "image">>;
  setBgLink: Dispatch<SetStateAction<string>>;
}
export default function Footer({ setBgType, setBgLink }: FooterProps) {
  const [openBgSetting, setOpenBgSetting] = useState<boolean>(false);
  const [backgrounds, setBackgrounds] = useState<{
    images: string[];
    videos: string[];
  }>({
    images: [],
    videos: [],
  });

  useEffect(() => {
    fetch("/backgrounds.json")
      .then((res) => res.json())
      .then((data) => {
        setBackgrounds(data);
      })
      .catch((err) => {
        console.log("Failed to fetch backgrounds: ", err);
      });
  }, []);

  const handleSelect = (type: "video" | "image", link: string) => {
    setBgType(type);
    setBgLink(link);
  };

  return (
    <>
      <footer className="fixed bottom-0 w-full flex items-center justify-start gap-4 px-4 py-4">
        Lagoon Footer
        <Button
          variant={"outline"}
          onClick={() => {
            setOpenBgSetting((prev) => !prev);
          }}
        >
          <Wallpaper />
        </Button>
        <Dialog open={openBgSetting} onOpenChange={setOpenBgSetting}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose your Background</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* IMAGE SECTION */}
              <div>
                <h3 className="font-semibold mb-2">Images</h3>
                <div className="grid grid-cols-3 gap-3">
                  {backgrounds.images.map((img) => (
                    <div
                      key={img}
                      className="cursor-pointer border rounded-md overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
                      onClick={() => handleSelect("image", img)}
                    >
                      <Image
                        src={`/${img}`}
                        alt={img}
                        width={150}
                        height={100}
                        className="object-cover w-full h-24"
                      />
                      <div className="text-xs text-center p-1">
                        {img.split("/").pop()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VIDEO SECTION */}
              <div>
                <h3 className="font-semibold mb-2">Videos</h3>
                <div className="grid grid-cols-3 gap-3">
                  {backgrounds.videos.map((vid) => (
                    <div
                      key={vid}
                      className="cursor-pointer border rounded-md overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
                      onClick={() => handleSelect("video", vid)}
                    >
                      <video
                        src={`/${vid}`}
                        muted
                        loop
                        playsInline
                        className="object-cover w-full h-24"
                      />
                      <div className="text-xs text-center p-1">
                        {vid.split("/").pop()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </footer>
    </>
  );
}
