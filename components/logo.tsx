import Image from "next/image";

export function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/logo.svg"
      alt="Keevan Store"
      width={size}
      height={size}
      className="rounded"
    />
  );
}
