'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, ThumbsUp } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const posts = [
  {
    id: 1,
    title: 'Prime Office Space Yielding 7% in Auckland CBD',
    author: 'Jane Smith',
    summary:
      'Secure a premium office investment in the heart of Auckland, offering stable returns and long-term tenancy.',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    views: 1200,
    upvotes: 34,
  },
  {
    id: 2,
    title: 'NZX Tech Stock: 30% Upside Potential',
    author: 'Mark Lee',
    summary:
      'Analysts predict strong growth for this under-the-radar tech stock listed on NZX. Find out why insiders are buying.',
    thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    views: 850,
    upvotes: 21,
  },
  {
    id: 3,
    title: 'Queenstown Lakeside Apartment Pre-Sale',
    author: 'Sophie Turner',
    summary: "Invest early in Queenstown's newest luxury lakeside apartments with exclusive pre-sale pricing.",
    thumbnail: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80',
    views: 670,
    upvotes: 15,
  },
  {
    id: 4,
    title: 'Diversified Investment Fund: Low Risk, Steady Growth',
    author: 'Alex Kim',
    summary:
      'Join a diversified fund focused on sustainable growth and risk management. Open to new investors this quarter.',
    thumbnail: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=400&q=80',
    views: 940,
    upvotes: 28,
  },
  {
    id: 5,
    title: 'Personal Finance App Launch: Early Access',
    author: 'Priya Patel',
    summary:
      'Get early access to a new app designed to help you manage your finances, track investments, and save smarter.',
    thumbnail: 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?auto=format&fit=crop&w=400&q=80',
    views: 510,
    upvotes: 12,
  },
  {
    id: 6,
    title: 'Commercial Property in Wellington: High Yield',
    author: 'Liam Brown',
    summary: "A rare opportunity to acquire a fully-leased commercial property in Wellington's business district.",
    thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    views: 780,
    upvotes: 19,
  },
  {
    id: 7,
    title: 'Green Energy Investment Bonds Open',
    author: 'Emily Green',
    summary: 'Support renewable energy and earn fixed returns with our new green bonds, now open for subscription.',
    thumbnail: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=400&q=80',
    views: 640,
    upvotes: 22,
  },
];

export default function SCUserDash() {
  /**
   *   Handle account confirmed param example
   **/
  const searchParams = useSearchParams();
  const accountConfirmed = searchParams.get('account_confirmed');
  const router = useRouter();

  useEffect(() => {
    if (accountConfirmed === '1') {
      toast.success('account confirmed');
      // Remove the query param from the URL
      const params = new URLSearchParams(window.location.search);
      params.delete('account_confirmed');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      router.replace(newUrl, { scroll: false });
    }
  }, [accountConfirmed, router]);

  return (
    <div className='container'>
      <div className='m-4 flex min-h-screen flex-col items-stretch rounded-md p-2 sm:m-8 sm:p-4 border border-border'>

      <h1 className='mt-4 mb-8 text-4xl font-semibold'>Updates from your Network</h1>

        <div className='flex flex-1 flex-col gap-6 lg:flex-row lg:items-start'>
          <div className='bg-muted mx-auto w-full rounded-lg p-6 lg:mx-0 lg:w-[400px]'>
            <h1 className='mb-4 text-lg font-bold'>Compose a new Post</h1>
            <div className='flex items-start gap-4'>
              <div className='flex-1'>
                <Textarea
                  className='mb-4 h-24 w-full resize-none rounded border p-2'
                  placeholder='Enter your post here'
                ></Textarea>
                <Button>Publish</Button>
              </div>
            </div>
          </div>
          {/* Right: Posts Container */}
          <div className='w-full flex-1'>
            <div className='space-y-6'>
              {posts.map((post) => (
                <div key={post.id} className='flex gap-4 rounded-lg bg-muted p-4 shadow-sm'>
                  {/* Thumbnail */}
                  <div className='flex-shrink-0'>
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      width={80}
                      height={80}
                      className='h-20 w-20 rounded-md object-cover'
                    />
                  </div>
                  {/* Content */}
                  <div className='flex flex-1 flex-col'>
                    <div>
                      <h3 className='text-base font-semibold sm:text-lg'>{post.title}</h3>
                      <div className='mb-1 text-xs sm:text-sm'>By {post.author}</div>
                      <p className='text-xs '>{post.summary}</p>
                    </div>
                    <div className='mt-2 flex flex-1 items-end justify-between'>
                      {/* View & Upvote counts */}
                      <div className='flex items-center gap-3 text-xs'>
                        <span className='flex items-center gap-1'>
                          <Eye size={16} className='inline' />
                          {post.views}
                        </span>
                        <span className='flex items-center gap-1'>
                          <ThumbsUp size={16} className='inline' />
                          {post.upvotes}
                        </span>
                      </div>
                      {/* View more link */}
                      <Link href='#' className='text-xs'>
                        View more &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}