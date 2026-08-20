import Image from 'next/image';
import Link from 'next/link';

export default function SCMarketingAbout() {
  return (
    <>
      <section id='sc_about-hero'>
        <div className='relative isolate pt-12'>
          <div className='mx-auto max-w-7xl px-6 py-12 sm:py-5 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-16'>
            <div className='mx-auto max-w-2xl lg:mx-0 lg:flex-auto'>
              <h1 className='text-primary mt-10 text-5xl font-semibold tracking-tight sm:text-7xl'>
                The complete community platform
              </h1>
              <p className='font-mediu mt-8 text-pretty sm:text-xl/8'>
                Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet
                fugiat veniam occaecat fugiat aliqua. Anim aute id magna aliqua ad ad non deserunt sunt.
              </p>
              <div className='mt-10'>
                <Link className='btn bg-primary' href='account/create'>
                  Create a free account
                </Link>
              </div>
            </div>
            <div className='mt-16 sm:mt-24 lg:mt-0 lg:shrink-0 lg:grow'>
              <Image
                src='/images/sc_demo/sc-marketing-app-single.webp'
                alt=''
                className='max-h-[60vh] w-auto'
                width='600'
                height='1000'
              />
            </div>
          </div>
        </div>
      </section>

      <section id='sc_about-apps'>
        <div className='relative mb-16'>
          <div className=''>
            <div className='mx-auto max-w-7xl px-6 lg:px-8'>
              <div className='mt-16 flow-root sm:mt-24'>
                <div className='-m-2 rounded-xl bg-gray-900/5 lg:-m-4 lg:rounded-2xl lg:p-4'>
                  <Image
                    alt='App screenshot'
                    className='rounded-md'
                    height={1440}
                    src='/images/sc_demo/sc-marketing-hero.webp'
                    width={2432}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
