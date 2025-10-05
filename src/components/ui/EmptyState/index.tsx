import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionText, actionHref }: EmptyStateProps) {
  return (
    <div style={{ 
      padding: '3rem 2rem', 
      textAlign: 'center', 
      color: 'var(--gray-alpha-500)',
      backgroundColor: 'white',
      borderRadius: 'var(--rounded-md)',
      border: '1px solid var(--gray-alpha-200)',
      margin: '2rem 0'
    }}>
      <h3 style={{ 
        color: 'var(--foreground)', 
        marginBottom: '1rem',
        fontSize: '1.25rem'
      }}>
        {title}
      </h3>
      <p style={{ marginBottom: '1.5rem' }}>{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref}>
          <button className="buttonPrimary">
            {actionText}
          </button>
        </Link>
      )}
    </div>
  );
}