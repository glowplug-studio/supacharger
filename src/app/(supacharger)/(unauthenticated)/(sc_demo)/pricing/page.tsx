
import SCFooter from '@/components/sc_demo/sc_footer';
import SCPricingOneTime from '@/components/sc_demo/sc_pricing-onetime';
import SCPricingSubscription from '@/components/sc_demo/sc_pricing-subscriptions';

export default function Pricing() {
  return (
    <>
      <section>
        <div className='relative isolate pt-24'>
          <div className='mx-auto mt-8 max-w-4xl sm:text-center'>
            <h2 className='mt-10 text-5xl font-semibold tracking-tight text-primary sm:text-7xl'>Pricing</h2>
            <p className='font-mediu mt-8 text-pretty sm:text-xl/8'>
              Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet
              fugiat veniam occaecat fugiat aliqua. Anim aute id magna aliqua ad ad non deserunt sunt.
            </p>
          </div>
          <div className='mx-auto max-w-7xl px-6 py-12 sm:py-5 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-16'>
            <div className='flex flex-col gap-4'>
              <div>
                <SCPricingSubscription />
              </div>
              <div>
                <SCPricingOneTime />
              </div>
            </div>
          </div>
        </div>
      </section>
      <SCFooter></SCFooter>
    </>
  );
}
