import { useTranslations } from 'next-intl';

interface UIDividerProps {
  text?: string;
  className?: string;
}

export function UIDivider({ text, className }: UIDividerProps) {
  const tAuthTerms = useTranslations('AuthTerms');
  const displayText = text || tAuthTerms('createAccountWithEmail');

  return (
    <div className={`flex items-center gap-4${className ? ` ${className}` : ''}`}>
      <hr className='flex-1 border-white/20' />
      <span className='text-sm text-white/60'>{displayText}</span>
      <hr className='flex-1 border-white/20' />
    </div>
  );
}
