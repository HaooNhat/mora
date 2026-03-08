import MainPageContainer from "@/components/features/main-page-container";

export default function MainPage() {
  return (
    <>
      {/* Background video */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 w-full h-full">
          <video
            width={1920}
            height={1080}
            autoPlay
            loop
            muted
            preload="none"
            playsInline
            className="w-full h-full object-cover"
          >
            <source
              src="/videos/town_city_time_slap_3840x2160.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag
          </video>
        </div>
      </div>

      {/* Main page content */}
      <div className="h-dvh md:h-screen p-0 md:p-4">
        <MainPageContainer className="h-full flex flex-col max-w-[1920px] max-h-[1080px] border-2 rounded-3xl backdrop-blur-xs" />
      </div>
    </>
  );
}
