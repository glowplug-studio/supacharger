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
      <hr className='flex-1 border-gray-300' />
      <span className='text-gray-400 text-sm'>{displayText}</span>
      <hr className='flex-1 border-gray-300' />
    </div>
  );
}
