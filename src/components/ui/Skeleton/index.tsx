import styles from './skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  count?: number;
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '4px', 
  className = '',
  count = 1 
}: SkeletonProps) {
  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${styles.skeleton} ${className}`}
          style={skeletonStyle}
        />
      ))}
    </>
  );
}

// Componentes específicos para diferentes tipos de conteúdo
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '75%' : '100%'}
          height="1rem"
          className={styles.textLine}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.cardHeader}>
        <SkeletonAvatar size={48} />
        <div className={styles.cardInfo}>
          <Skeleton width="60%" height="1.2rem" />
          <Skeleton width="40%" height="1rem" className={styles.subtitle} />
        </div>
      </div>
      <div className={styles.cardContent}>
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}

export function SkeletonPost({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.post} ${className}`}>
      <div className={styles.postHeader}>
        <SkeletonAvatar size={40} />
        <div className={styles.postInfo}>
          <Skeleton width="30%" height="1rem" />
          <Skeleton width="20%" height="0.8rem" className={styles.subtitle} />
        </div>
      </div>
      <div className={styles.postContent}>
        <SkeletonText lines={2} />
        <Skeleton width="100%" height="200px" borderRadius="8px" className={styles.postImage} />
      </div>
      <div className={styles.postActions}>
        <Skeleton width="60px" height="32px" borderRadius="16px" />
        <Skeleton width="60px" height="32px" borderRadius="16px" />
        <Skeleton width="60px" height="32px" borderRadius="16px" />
      </div>
    </div>
  );
}