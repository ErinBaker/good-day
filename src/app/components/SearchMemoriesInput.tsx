import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useLazyQuery, gql } from '@apollo/client';

const SEARCH_MEMORIES = gql`
  query SearchMemories($text: String, $limit: Int) {
    searchMemories(text: $text, limit: $limit) {
      items {
        memory {
          id
          title
          description
          date
        }
        highlights {
          field
          value
          indices
        }
      }
    }
  }
`;

export type MemorySuggestion = {
  id: string;
  title: string;
  description: string;
  date: string;
};

type SearchMemoriesResponse = {
  searchMemories: {
    items: { memory: MemorySuggestion }[];
  };
};

type SearchMemoriesInputProps = {
  value: MemorySuggestion | null;
  onChange: (value: MemorySuggestion | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

// Custom debounce hook
function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  function debouncedFn(...args: Parameters<T>) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      cbRef.current(...args);
    }, delay);
  }

  // Cleanup on unmount
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return debouncedFn;
}

const SearchMemoriesInput: React.FC<SearchMemoriesInputProps> = ({
  value,
  onChange,
  label = 'Search Memories',
  placeholder = 'Type to search...',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [fetchSuggestions, { data: rawData, loading }] = useLazyQuery<SearchMemoriesResponse>(SEARCH_MEMORIES, {
    fetchPolicy: 'network-only',
  });
  const data = rawData as SearchMemoriesResponse | undefined;

  const debouncedFetch = useDebouncedCallback((text: string) => {
    fetchSuggestions({ variables: { text, limit: 7 } });
  }, 300);

  const handleInputChange = useCallback((event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    if (newInputValue.trim()) {
      debouncedFetch(newInputValue);
    }
  }, [debouncedFetch]);

  const suggestions: MemorySuggestion[] = useMemo(() => {
    return data?.searchMemories?.items?.map((item) => item.memory) || [];
  }, [data]);

  return (
    <Autocomplete
      disabled={disabled}
      options={suggestions}
      getOptionLabel={option => typeof option === 'string' ? option : option.title || ''}
      value={value}
      onChange={(_e, newValue) => onChange(newValue && typeof newValue !== 'string' ? newValue : null)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      filterOptions={x => x} // Don't filter client-side
      loading={loading}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={typeof option === 'string' ? option : option.id}>
          <strong>{typeof option === 'string' ? option : option.title}</strong>
          {typeof option !== 'string' && (
            <><br /><span style={{ color: '#888', fontSize: 13 }}>{option.description}</span></>
          )}
        </li>
      )}
      isOptionEqualToValue={(option, val) => {
        if (typeof option === 'string' || typeof val === 'string') return option === val;
        return option.id === val.id;
      }}
      noOptionsText={loading ? 'Loading...' : 'No matches found'}
      autoHighlight
      selectOnFocus
      clearOnBlur={false}
      handleHomeEndKeys
    />
  );
};

export default SearchMemoriesInput; 