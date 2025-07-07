import { Check } from 'lucide-react';

import InlineLoader from '@/assets/images/ui/InlineLoader.svg';
import { Button } from '@/components/ui/button';

interface SaveButtonProps {
  isLoading: boolean;
  isSuccess: boolean;
  initialLabel: string;
  savingLabel: string;
  completeLabel: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

export default function SaveButton({
  isLoading,
  isSuccess,
  initialLabel,
  savingLabel,
  completeLabel,
  onClick,
  type = 'submit',
  disabled = false,
  className = 'btn ',
}: SaveButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={isLoading || isSuccess || disabled}
      className={`
        ${isSuccess ? 'bg-green-300 !opacity-100 transition-colors hover:bg-green-400 focus:bg-green-400' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <span className='flex items-center justify-center'>
          <InlineLoader className='-ml-1 mr-3 h-5 w-5' />
          {savingLabel}
        </span>
      ) : isSuccess ? (
        <span className='flex w-full items-center justify-center'>
          <Check className='mx-auto h-5 w-5 text-green-800' />
          <span className='ml-2 text-green-800'>{completeLabel}</span>
        </span>
      ) : (
        initialLabel
      )}
    </Button>
  );
}
