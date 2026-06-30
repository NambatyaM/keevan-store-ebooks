import Image from "next/image";

export function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="https://i.ibb.co/v6h94WVG/keevan-favicon.jpg"
      alt="Keevan Store"
      width={size}
      height={size}
      className="rounded"
    />
  );
}
