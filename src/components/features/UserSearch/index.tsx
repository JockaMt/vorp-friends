'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonAvatar, SkeletonText } from '@/components/ui/Skeleton';
import styles from './userSearch.module.css';
import { FaSearch, FaTimes, FaUser } from 'react-icons/fa';
import Image from 'next/image';

interface SearchUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string;
  emailAddress: string;
}

interface UserSearchProps {
  placeholder?: string;
  className?: string;
}

export function UserSearch({ placeholder = "Pesquisar usuários...", className }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce da pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers(query);
      } else {
        setResults([]);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  async function searchUsers(searchQuery: string) {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na pesquisa');
      }

      setResults(data.users || []);
      setIsOpen(true);
      
      if (data.users.length === 0 && searchQuery.trim().length >= 2) {
        setError('Nenhum usuário encontrado');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao pesquisar usuários');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleUserClick(user: SearchUser) {
    const identifier = user.username || user.id;
    router.push(`/profile/${identifier}`);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setError(null);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function getDisplayName(user: SearchUser) {
    return user.fullName || user.firstName || user.username || user.emailAddress?.split('@')[0] || 'Usuário';
  }

  function getSubtitle(user: SearchUser) {
    if (user.username) return `@${user.username}`;
    return user.emailAddress?.split('@')[0] || '';
  }

  return (
    <div className={`${styles.searchContainer} ${className}`} ref={searchRef}>
      <div className={styles.searchInputWrapper}>
        <FaSearch className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        {query && (
          <button 
            onClick={clearSearch}
            className={styles.clearButton}
            type="button"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {isOpen && (query.trim().length >= 2) && (
        <div className={styles.resultsDropdown}>
          {isLoading && (
            <>
              <div className={styles.resultsHeader}>
                Pesquisando...
              </div>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.resultItem}>
                  <SkeletonAvatar size={32} />
                  <div className={styles.userInfo}>
                    <SkeletonText lines={2} />
                  </div>
                </div>
              ))}
            </>
          )}

          {error && !isLoading && (
            <div className={styles.errorItem}>
              {error}
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              <div className={styles.resultsHeader}>
                Usuários encontrados ({results.length})
              </div>
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className={styles.resultItem}
                >
                  <div className={styles.userAvatar}>
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={getDisplayName(user)}
                        width={32}
                        height={32}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <FaUser className={styles.avatarPlaceholder} />
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {getDisplayName(user)}
                    </div>
                    <div className={styles.userSubtitle}>
                      {getSubtitle(user)}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}