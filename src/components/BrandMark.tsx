type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9 md:h-10 md:w-10',
  lg: 'h-14 w-14 md:h-16 md:w-16'
};

export default function BrandMark({
  size = 'md',
  showWordmark = true,
  wordmarkClassName = ''
}: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/logo.png"
        alt="RwaStocks"
        className={`${sizes[size]} rounded-xl object-cover shadow-lg shadow-blue-500/20`}
      />
      {showWordmark && (
        <span className={`font-extrabold tracking-tight ${wordmarkClassName}`}>
          RwaStocks
        </span>
      )}
    </span>
  );
}
