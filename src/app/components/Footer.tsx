export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full text-gray-500 font-sans text-sm pb-8 z-0 pointer-events-none">
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ">
        
        <div className="flex flex-col">
          <img src="/logo/90r.png" className="w-25 opacity-20 mt-[37] mb-[-50]" />
        </div>

        {/* <div className="flex flex-col space-y-2 ml-15 mt-30">
          <div className="flex space-x-4">
            <img src="/logo/fb.png" className="w-10 h-10 opacity-70" />
            <img src="/logo/yt.png" className="w-10 h-10 opacity-70" />
          </div>
          <p className="text-xs ml-2">@ Scan_now</p>
          <p className="ml-2 text-xs underline decoration-double">
            Private Policy
          </p>
        </div> */}

        <img
          src="/logo/angkorwat.png"
          alt="Angkor Wat silhouette"
          className="w-full opacity-20 max-w-xl mr-[-18] mb-[-32]"
        />

        

        <div className="flex flex-col">
          <img src="/logo/90l.png" className="w-25 opacity-20 mt-[37] mb-[-50]"  />
        </div>
      </div>
    </footer>
  );
}


     