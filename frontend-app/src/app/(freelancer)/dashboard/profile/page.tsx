'use client';

import { useEffect, useState } from 'react';
import { FreelancerProfile } from '@/features/freelancer-profile/types';
import { freelancerProfileApi } from '@/features/freelancer-profile/api';
import { ProfileForm } from './_components/ProfileForm';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function ProfilePage() {
    const [profile, setProfile] = useState<FreelancerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const profileData = await freelancerProfileApi.getProfile();
                setProfile(profileData);
            } catch (error) {
                console.error('Error loading profile data', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <DashboardShell>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight">Mi Perfil</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Configura la identidad visual de tu negocio.
                </p>
            </div>

            {/* Content — constrained width for form pages */}
            <div className="max-w-2xl">
                {isLoading ? (
                    <Skeleton className="h-[420px] w-full rounded-xl" />
                ) : (
                    <ProfileForm
                        initialData={profile}
                        onUpdate={(updatedData) => setProfile(updatedData)}
                    />
                )}
            </div>
        </DashboardShell>
    );
}
