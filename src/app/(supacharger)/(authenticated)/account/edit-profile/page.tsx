'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { Avatar } from '@/app/(supacharger)/(authenticated)/account/edit-profile/account-profile-edit-avatar';
import { Button } from '@/components/ui/button';
import { Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/seperator';
import { Textarea } from '@/components/ui/textarea';

interface Profile {
  firstName: string;
  lastName: string;
  aboutMe: string;
  avatarFile: File | null;
}

export default function EditProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    firstName: '',
    lastName: '',
    aboutMe: '',
    avatarFile: null,
  });

  // Simulate loading initial data
  useEffect(() => {
    const loadProfile = async () => {
      // In a real app, fetch from API
      const mockData = {
        firstName: 'J',
        lastName: 'Sharp',
        aboutMe: '',
        avatarFile: null,
      };

      setProfile(mockData);
    };

    loadProfile();
  }, []);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar image changes
  const handleAvatarChange = (file: File | null) => {
    setProfile((prev) => ({ ...prev, avatarFile: file }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success('Your profile has been successfully updated.');
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Edit Profile</h2>
        <Separator className='my-4' />
      </div>

      <div>

      <Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>

      <div>

</div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-[250px_1fr]'>
          {/* Avatar section */}
          <div className='rounded-lg bg-muted/40 p-4'>
            <Avatar
              initialImage='https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600'
              onImageChange={handleAvatarChange}
            />
          </div>

          {/* Profile form fields */}
          <div className='max-w-md space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>First name</Label>
                <Input id='firstName' name='firstName' value={profile.firstName} onChange={handleChange} />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last name</Label>
                <Input id='lastName' name='lastName' value={profile.lastName} onChange={handleChange} />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='aboutMe'>About Me</Label>
              <Textarea id='aboutMe' name='aboutMe' value={profile.aboutMe} onChange={handleChange} rows={6} />
            </div>

            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
