type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <img
      src="/assets/UPD_Vertical%20Logo.png"
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
    />
  );
}
