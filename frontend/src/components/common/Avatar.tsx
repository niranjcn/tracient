import React from 'react';
import { cn } from '@/utils/helpers';
import { getInitials } from '@/utils/helpers';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-gray-400',
    busy: 'bg-error-500',
    away: 'bg-warning-500',
  };

  const initials = name ? getInitials(name) : '??';
  const showImage = src && !imageError;

  return (
    <div className={cn('relative inline-flex', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setImageError(true)}
          className={cn(
            'rounded-full object-cover ring-2 ring-white',
            sizes[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-primary-100 text-primary-700 ring-2 ring-white',
            sizes[size]
          )}
          aria-label={name || 'User avatar'}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusSizes[size],
            statusColors[status]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
};

// Avatar Group
export interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  className,
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapSizes = {
    xs: '-ml-2',
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-3',
    xl: '-ml-4',
  };

  return (
    <div className={cn('flex', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(index > 0 && overlapSizes[size])}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn(overlapSizes[size])} style={{ zIndex: 0 }}>
          <div
            className={cn(
              'rounded-full flex items-center justify-center font-medium bg-gray-200 text-gray-600 ring-2 ring-white',
              {
                xs: 'h-6 w-6 text-xs',
                sm: 'h-8 w-8 text-xs',
                md: 'h-10 w-10 text-sm',
                lg: 'h-12 w-12 text-sm',
                xl: 'h-16 w-16 text-base',
              }[size]
            )}
          >
            +{remaining}
          </div>
        </div>
      )}
    </div>
  );
};

export default Avatar;
