import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { ProfileCard } from "./ProfileCard";
import { UserRole } from "@/lib/types/enums";
import { useState } from "react";

interface UserAvatarProps {
    user?: {
        id?: string;
        name?: string;
        email?: string;
        role?: UserRole;
        profileImage?: string;
        createdAt?: string;
    } | null;
    size?: "sm" | "default" | "lg" | "xl";
    className?: string;
    fallbackClassName?: string;
    showProfileCard?: boolean;
    onProfileClick?: () => void;
}

const sizeClasses = {
    sm: "h-6 w-6",
    default: "h-9 w-9",
    lg: "h-10 w-10",
    xl: "h-28 w-28",
};

const fallbackTextSizes = {
    sm: "text-xs",
    default: "text-xs",
    lg: "text-sm",
    xl: "text-3xl",
};

/**
 * UserAvatar Component
 * 
 * A wrapper around shadcn/ui Avatar that handles user profile images
 * with automatic fallback to user initials.
 * 
 * @param showProfileCard - When true, clicking the avatar shows a ProfileCard in a modal
 * @param onProfileClick - Optional callback when avatar is clicked (only if showProfileCard is true)
 * 
 * @example
 * ```tsx
 * // Simple avatar
 * <UserAvatar user={user} size="default" />
 * 
 * // Avatar with profile card modal
 * <UserAvatar 
 *   user={user} 
 *   size="default" 
 *   showProfileCard={true}
 *   className="border border-gray-200"
 * />
 * ```
 */
export function UserAvatar({
    user,
    size = "default",
    className,
    fallbackClassName,
    showProfileCard = false,
    onProfileClick,
}: UserAvatarProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const userName = user?.name || "User";
    const userImage = user?.profileImage;

    // Get first letter of name for fallback
    const fallbackText = userName.charAt(0).toUpperCase();

    const handleClick = () => {
        if (showProfileCard && user?.id && user?.email && user?.role && user?.createdAt) {
            setIsProfileOpen(true);
        }
        onProfileClick?.();
    };

    return (
        <>
            <Avatar
                className={cn(
                    sizeClasses[size],
                    showProfileCard && "cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500/50 hover:ring-offset-2 dark:hover:ring-indigo-400/50 hover:scale-105",
                    className
                )}
                size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
                onClick={handleClick}
            >
                <AvatarImage
                    src={getImageUrl(userImage)}
                    alt={`${userName} Avatar`}
                />
                <AvatarFallback
                    className={cn(
                        fallbackTextSizes[size],
                        fallbackClassName
                    )}
                >
                    {fallbackText}
                </AvatarFallback>
            </Avatar>

            {/* Profile Card Modal */}
            {showProfileCard && user?.id && user?.email && user?.role && user?.createdAt && (
                <ProfileCard
                    user={{
                        id: user.id,
                        name: user.name || "User",
                        email: user.email,
                        role: user.role,
                        profileImage: user.profileImage,
                        createdAt: user.createdAt,
                    }}
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />
            )}
        </>
    );
}
