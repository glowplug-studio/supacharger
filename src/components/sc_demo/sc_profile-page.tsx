'use client';
import { useParams } from 'next/navigation';

export default function SCProfilePage() {
  const params = useParams();
  const username = params?.username;
  const avatarUrl = 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100';
  const bannerUrl = 'https://images.unsplash.com/photo-1688236043901-603c0e16f3ae?q=80&w=1600';
  const bio =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exer.';

  return (
    <>
      <div className='mx-auto w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-md'>
        {/* Banner Image */}
        <div className='relative h-48 w-full'>
          <img src={bannerUrl || '/placeholder.svg'} alt='Profile banner' className='h-full w-full object-cover' />
        </div>

        <div className='relative px-6 py-8 md:flex'>
          {/* Left Column - User Info */}
          <div className='-mt-20 flex flex-col items-center md:w-1/3 md:items-start md:pr-8'>
            <div className='h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg'>
              <img
                src={avatarUrl || '/placeholder.svg'}
                alt={`${username}'s avatar`}
                className='h-full w-full object-cover'
              />
            </div>
            <h1 className='mt-4 text-2xl font-bold text-gray-900'>{username}</h1>

            <div className='mt-6 w-full'>
              <div className='mb-4 flex items-center justify-around'>
                <div className='text-center'>
                  <span className='block text-xl font-bold'>2.4K</span>
                  <span className='text-sm text-gray-500'>Followers</span>
                </div>
                <div className='text-center'>
                  <span className='block text-xl font-bold'>164</span>
                  <span className='text-sm text-gray-500'>Following</span>
                </div>
              </div>

              <button className='btn w-full bg-primary text-white'>Follow</button>
            </div>
          </div>

          {/* Right Column - Bio */}
          <div className='mt-8 md:mt-0 md:w-2/3'>
            <h2 className='mb-4 text-xl font-semibold'>About Me</h2>
            <p className='leading-relaxed text-gray-700'>{bio}</p>
          </div>
        </div>
      </div>
    </>
  );
}
