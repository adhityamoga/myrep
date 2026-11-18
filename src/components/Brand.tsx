import brandLogo from "@/assets/logo.png";

export function Brand() {
  return (
    <a href="/#home" className="flex shrink-0 items-center" aria-label="MyRepublic Purwokerto">
      <img src={brandLogo} alt="MyRepublic Purwokerto" className="h-9 sm:h-10 w-auto object-contain drop-shadow-sm" />
    </a>
  );
}
