import DemoLogo01 from '@/components/sc_demo/assets/logos/demo-logo-01.svg';
import DemoLogo02 from '@/components/sc_demo/assets/logos/demo-logo-02.svg';
import DemoLogo03 from '@/components/sc_demo/assets/logos/demo-logo-03.svg';
import DemoLogo04 from '@/components/sc_demo/assets/logos/demo-logo-04.svg';
import DemoLogo05 from '@/components/sc_demo/assets/logos/demo-logo-05.svg';
import DemoLogo06 from '@/components/sc_demo/assets/logos/demo-logo-06.svg';
import DemoLogo07 from '@/components/sc_demo/assets/logos/demo-logo-07.svg';
import DemoLogo08 from '@/components/sc_demo/assets/logos/demo-logo-08.svg';
import DemoLogo09 from '@/components/sc_demo/assets/logos/demo-logo-09.svg';

const demoLogos = [
  DemoLogo01,
  DemoLogo02,
  DemoLogo03,
  DemoLogo04,
  DemoLogo05,
  DemoLogo06,
  DemoLogo07,
  DemoLogo08,
  DemoLogo09,
];

function DemoLogoSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div
      aria-hidden={duplicate ? 'true' : undefined}
      className='sc-logo-marquee-set flex shrink-0 items-center gap-12 px-6'
    >
      {demoLogos.map((Logo, index) => (
        <div className='flex h-[70px] w-[135px] shrink-0 items-center justify-center' key={index}>
          <Logo
            aria-hidden='true'
            className='h-[70px] w-[135px] opacity-70 grayscale dark:brightness-[1.55] dark:contrast-125'
            focusable='false'
          />
        </div>
      ))}
    </div>
  );
}

export default function SCLogoMarquee({ label }: { label: string }) {
  return (
    <div aria-labelledby='sc-logo-marquee-label' className='sc-logo-marquee mt-10 w-full' role='region'>
      <p className='text-muted-foreground text-xs font-medium' id='sc-logo-marquee-label'>
        {label}
      </p>
      <div className='mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]'>
        <div className='sc-logo-marquee-track flex w-max items-center'>
          <DemoLogoSet />
          <DemoLogoSet duplicate />
        </div>
      </div>
    </div>
  );
}
