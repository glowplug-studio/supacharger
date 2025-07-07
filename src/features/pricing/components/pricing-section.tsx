import Image from 'next/image';

import { createCheckoutAction } from '@/features/pricing/actions/create-checkout-action';
import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const products = await getProducts();

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className='relative rounded-lg bg-black py-8'>
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-[140px]'>
        <HeadingLevel className='max-w-4xl bg-linear-to-br from-white to-neutral-200 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-6xl'>
          Subscription Plans
        </HeadingLevel>
        <p className='text-center text-xl'>
          Find a plan that fits you. Upgrade at any time to enable additional features.
        </p>
        <div className=''>
          {products.map((product) => {
            return <PricingCard key={product.id} product={product} createCheckoutAction={createCheckoutAction} />;
          })}
        </div>
      </div>
    </section>
  );
}
