export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-0 pointer-events-none overflow-hidden">
      <div className="w-full flex items-end justify-center sm:justify-between">
        {/* Left decorative image: hidden on mobile */}
        <img
          src="/logo/90r.png"
          alt=""
          className="hidden sm:block w-16 sm:w-20 opacity-20"
        />

        {/* Center Angkor Wat: always visible */}
        <img
          src="/logo/angkorwat.png"
          alt="Angkor Wat silhouette"
          className="opacity-20 max-w-[300px] sm:max-w-md w-full"
        />

        {/* Right decorative image: hidden on mobile */}
        <img
          src="/logo/90l.png"
          alt=""
          className="hidden sm:block w-16 sm:w-20 opacity-20"
        />
      </div>
    </footer>
  );
}