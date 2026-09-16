type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  variant?: 'mark' | 'lockup';
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

const markSizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9 md:h-10 md:w-10',
  lg: 'h-14 w-14 md:h-16 md:w-16',
  hero: 'h-20 w-20 md:h-24 md:w-24'
};

const lockupSizes = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16 md:h-[4.5rem] md:w-[4.5rem]',
  lg: 'h-24 w-24 md:h-28 md:w-28',
  hero: 'h-36 w-36 md:h-48 md:w-48'
};

export default function BrandMark({
  size = 'md',
  variant = 'mark',
  showWordmark,
  wordmarkClassName = ''
}: BrandMarkProps) {
  const includeWordmark = showWordmark ?? variant === 'mark';
  const src = variant === 'lockup' ? '/logo.png' : '/logo-mark.png';
  const box = variant === 'lockup' ? lockupSizes[size] : markSizes[size];
  const radius = variant === 'lockup' ? 'rounded-2xl md:rounded-3xl' : 'rounded-xl';

  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src={src}
        alt="RwaStocks"
        className={`${box} ${radius} object-cover shadow-lg shadow-blue-500/20`}
      />
      {includeWordmark && (
        <span className={`font-extrabold tracking-tight ${wordmarkClassName}`}>
          RwaStocks
        </span>
      )}
    </span>
  );
}
