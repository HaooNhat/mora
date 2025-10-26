import AvatarSetting from "./header-avatar-setting";

export default function Header() {
  return (
    <>
      <header className="fixed w-full flex items-center justify-between px-4 py-4">
        <div className="text-2xl italic">Lagoon</div>

        {/* User setting */}
        <AvatarSetting />
      </header>
    </>
  );
}
