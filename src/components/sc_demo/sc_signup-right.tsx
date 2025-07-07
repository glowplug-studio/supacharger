import Carousel, { type Slide } from '@/components/sc_demo/sc_carousel';

const slides: Slide[] = [
  {
    id: 1,
    title: 'Member benefits',
    slideClasses: 'bg-gre-200 bg-center bg-cover',
    slideStyle: {
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6)), url(https://images.unsplash.com/photo-1606492707206-bd0841bb6332?q=70&w=1000)',
    },
    content: `
      <p class="text-xl mb-4">Praesent pulvinar ligula a venenatis varius. Sed et ligula arcu. Class aptent taciti sociosqu.</p>
      <ul class="list-disc list-inside space-y-2">
        <li>Seamless Integration</li>
        <li>Advanced Features</li>
        <li>Professional Support</li>
      </ul>
    `,
  },
  {
    id: 2,
    title: 'Did you know...',
    slideStyle: {
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.6)), url(https://images.unsplash.com/photo-1688236043405-f0382db8ad3e?w=2000)',
    },
    slideClasses: 'bg-gre-200 bg-center bg-cover',
    content: `
      <p class="text-xl mb-4">Phasellus eleifend lorem at urna suscipit luctus. Mauris dapibus purus quis felis aliquet, at egestas odio tempus.</p>
      <div class="grid grid-cols-2 gap-4">
      </div>
    `,
  },
  {
    id: 3,
    title: 'Get a Year Free',
    slideClasses: 'bg-green-700',
    content: `
      <p class="text-xl mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam feugiat mauris quis quam tempus cursus. Sed vulputate euismod est, nec elementum orci pharetra ut.</p>
      <div class="grid grid-cols-2 gap-5">
        <div>
          <h3 class="font-semibold mb-2">Etiam Orci</h3>
          <p>Nunc eu finibus mauris. Phasellus eleifend lorem at urna suscipit luctus. </p>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Donec et Turpis</h3>
          <p>Cras velit augue, sagittis et orci ut, hendrerit mattis nibh.</p>
        </div>
      </div>
    `,
  },
  {
    id: 4,
    title: 'Take Off Today!',
    slideStyle: {
      backgroundImage:
        'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.6)), url(https://images.unsplash.com/photo-1727602483165-f9327b007a91?w=2500)',
    },
    slideClasses: 'bg-gre-200 bg-center bg-cover',
    content: `
      <p class="text-xl mb-4">Join thousands of users who trust our platform.</p>
    `,
  },
];



export function SignupRight() {
  return (
    <div className='flex h-full w-full items-center justify-center rounded-md bg-gray-200 text-white border'>
      <Carousel slides={slides} autoScrollInterval={5000} transitionDuration={0.5} />
      {/* <h3 className='text-2xl mb-3 font-bold'>Lorem Ipsum Dolor</h3>
    <p className="md:w-1/2">REPLACE ME. Ut dignissim sapien et varius feugiat. Praesent purus sapien, bibendum quis ipsum ac, pharetra ultricies magna. </p> */}
    </div>
  );
}
