"use client";
import { useState, useRef, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';
import styles from './locationPicker.module.css';
import { searchLocations } from '@/services/location';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

interface Location {
  id: string;
  name: string;
  address: string;
  type: 'recent' | 'popular' | 'search';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Localizações populares (simuladas)
const popularLocations: Location[] = [
  {
    id: '1',
    name: 'Shopping Iguatemi',
    address: 'Av. Iguatemi, 777 - Vila Brandina, Campinas - SP',
    type: 'popular'
  },
  {
    id: '2',
    name: 'Parque Taquaral',
    address: 'R. Heitor Penteado, s/n - Taquaral, Campinas - SP',
    type: 'popular'
  },
  {
    id: '3',
    name: 'UNICAMP',
    address: 'R. Monteiro Lobato, s/n - Cidade Universitária, Campinas - SP',
    type: 'popular'
  },
  {
    id: '4',
    name: 'Centro de Campinas',
    address: 'Centro, Campinas - SP',
    type: 'popular'
  },
  {
    id: '5',
    name: 'Cambuí',
    address: 'Cambuí, Campinas - SP',
    type: 'popular'
  }
];

// Localizações recentes (simuladas - em um app real viria do localStorage ou API)
const recentLocations: Location[] = [
  {
    id: 'r1',
    name: 'Casa',
    address: 'Minha residência',
    type: 'recent'
  },
  {
    id: 'r2',
    name: 'Trabalho',
    address: 'Escritório',
    type: 'recent'
  }
];

export function LocationPicker({ isOpen, onClose, onLocationSelect, buttonRef }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fechar quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Buscar localmente (populares/recentes) e por Nominatim (proxy) com debounce
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setFilteredLocations([]);
      setIsSearching(false);
      return;
    }

    let mounted = true;
    setIsSearching(true);

    const timeout = setTimeout(async () => {
      try {
        // start with local matches
        const local = [...popularLocations, ...recentLocations]
          .filter(l =>
            l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.address.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(l => ({ ...l }));

        // query remote proxy for partial matches
        const remote = await searchLocations(searchTerm);

        const remoteMapped: Location[] = remote.map(r => ({
          id: `nominatim-${r.place_id || r.osm_id}-${r.type || r.class}`,
          name: (r.display_name || '').split(',')[0].trim(),
          address: r.display_name || '',
          type: 'search',
          coordinates: r.lat && r.lon ? { lat: parseFloat(r.lat), lng: parseFloat(r.lon) } : undefined
        }));

        // merge keeping local first (dedupe by name+address)
        const combined: Location[] = [];
        const seen = new Set<string>();

        for (const it of [...local, ...remoteMapped]) {
          const key = `${it.name}||${it.address}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(it);
          }
        }

        if (mounted) {
          setFilteredLocations(combined);
        }
      } catch (err) {
        console.error('Location search error', err);
        if (mounted) setFilteredLocations([]);
      } finally {
        if (mounted) setIsSearching(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  const handleLocationClick = (location: Location) => {
    onLocationSelect(location);
    onClose();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredLocations([]);
  };

  if (!isOpen) return null;

  const showRecent = searchTerm.length === 0;
  const showPopular = searchTerm.length === 0;
  const showFiltered = searchTerm.length > 0;

  return (
    <div ref={pickerRef} className={styles.locationPicker}>
      <div className={styles.header}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className={styles.clearButton}
              type="button"
            >
              <FaTimes />
            </button>
          )}
        </div>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          title="Fechar seletor de localização"
          type="button"
        >
          ✕
        </button>
      </div>

      <div className={styles.content}>
        {showRecent && recentLocations.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Recentes</h4>
            {recentLocations.map((location) => (
              <button
                key={location.id}
                className={styles.locationItem}
                onClick={() => handleLocationClick(location)}
                type="button"
              >
                <FaMapMarkerAlt className={styles.locationIcon} />
                <div className={styles.locationInfo}>
                  <span className={styles.locationName}>{location.name}</span>
                  <span className={styles.locationAddress}>{location.address}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showPopular && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Locais Populares</h4>
            {popularLocations.map((location) => (
              <button
                key={location.id}
                className={styles.locationItem}
                onClick={() => handleLocationClick(location)}
                type="button"
              >
                <FaMapMarkerAlt className={styles.locationIcon} />
                <div className={styles.locationInfo}>
                  <span className={styles.locationName}>{location.name}</span>
                  <span className={styles.locationAddress}>{location.address}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showFiltered && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Localizações Encontradas</h4>
            {isSearching && (
              <div className={styles.loading}><p>Buscando...</p></div>
            )}

            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <button
                  key={location.id}
                  className={styles.locationItem}
                  onClick={() => handleLocationClick(location)}
                  type="button"
                >
                  <FaMapMarkerAlt className={styles.locationIcon} />
                  <div className={styles.locationInfo}>
                    <span className={styles.locationName}>{location.name}</span>
                    <span className={styles.locationAddress}>{location.address}</span>
                  </div>
                </button>
              ))
            ) : !isSearching ? (
              <div className={styles.noResults}>
                <p>Nenhuma localização encontrada para "{searchTerm}"</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}