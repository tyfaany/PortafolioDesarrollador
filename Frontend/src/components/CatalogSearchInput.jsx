import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiMagnify, mdiClose } from '@mdi/js';
import CatalogSuggestionDropdown from './CatalogSuggestionDropdown';
import '../styles/CatalogSearchInput.css';

function getDefaultOptionLabel(option) {
  if (typeof option === 'string') {
    return option.trim();
  }

  if (option && typeof option === 'object') {
    return String(option.name ?? option.label ?? option.title ?? option.value ?? '').trim();
  }

  return '';
}

function getDefaultOptionKey(option, index) {
  if (option && typeof option === 'object') {
    const rawKey = option.id ?? option.value ?? option.name ?? option.label ?? index;
    return String(rawKey);
  }

  return `${String(option ?? '').trim() || 'option'}-${index}`;
}

function normalizeQuery(value) {
  return String(value ?? '').trim().toLowerCase();
}

function CatalogSearchInput({
  label,
  catalog,
  value,
  onChange,
  onSelect,
  placeholder = 'Buscar o escribir...',
  helperText = '',
  error = '',
  maxResults = 6,
  disabled = false,
  required = false,
  id = undefined,
  name = undefined,
  autoComplete = 'off',
  getOptionLabel = getDefaultOptionLabel,
  getOptionKey = getDefaultOptionKey,
  emptyText = 'No hay coincidencias en el catalogo.',
  clearLabel = 'Limpiar busqueda',
  onFocus = undefined,
  onBlur = undefined,
}) {
  const generatedId = useId();
  const inputId = id || `catalog-search-${generatedId.replace(/:/g, '')}`;
  const listId = `${inputId}-list`;
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const suppressNextOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(catalog)) {
      return [];
    }

    return catalog
      .map((option, index) => {
        const labelValue = getOptionLabel(option, index);
        const normalizedLabel = String(labelValue ?? '').trim();

        if (!normalizedLabel) {
          return null;
        }

        return {
          key: getOptionKey(option, index),
          label: normalizedLabel,
          labelLower: normalizedLabel.toLowerCase(),
          raw: option,
        };
      })
      .filter(Boolean);
  }, [catalog, getOptionKey, getOptionLabel]);

  const filteredOptions = useMemo(() => {
    const query = normalizeQuery(value);

    if (!query) {
      return [];
    }

    return normalizedOptions
      .filter((option) => option.labelLower.includes(query))
      .filter((option) => option.labelLower !== query)
      .sort((optionA, optionB) => {
        const aStarts = optionA.labelLower.startsWith(query);
        const bStarts = optionB.labelLower.startsWith(query);

        if (aStarts !== bStarts) {
          return aStarts ? -1 : 1;
        }

        return optionA.label.localeCompare(optionB.label, 'es', { sensitivity: 'base' });
      })
      .slice(0, Math.max(1, maxResults));
  }, [maxResults, normalizedOptions, value]);

  const hasExactMatch = useMemo(() => {
    const query = normalizeQuery(value);

    if (!query) {
      return false;
    }

    return normalizedOptions.some((option) => option.labelLower === query);
  }, [normalizedOptions, value]);

  useEffect(() => {
    if (suppressNextOpenRef.current) {
      suppressNextOpenRef.current = false;
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!normalizeQuery(value) || hasExactMatch) {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setIsOpen(filteredOptions.length > 0);
    setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions.length, hasExactMatch, value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const selectOption = (option) => {
    suppressNextOpenRef.current = true;
    onChange(option.label);
    onSelect?.(option.raw, option);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (event) => {
    onChange(event.target.value);

    if (normalizeQuery(event.target.value)) {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }

    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (!filteredOptions.length) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % filteredOptions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current <= 0 ? filteredOptions.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter') {
      if (isOpen && filteredOptions[activeIndex]) {
        event.preventDefault();
        selectOption(filteredOptions[activeIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const hasValue = normalizeQuery(value) !== '';
  const showDropdown = isOpen && filteredOptions.length > 0;

  return (
    <div className="softsave-catalog-search" ref={wrapperRef}>
      <label className="softsave-catalog-search__label" htmlFor={inputId}>
        {label}
        {required ? (
          <span
            className="softsave-catalog-search__required"
            aria-hidden="true"
          >
            {" "}
            *
          </span>
        ) : null}
      </label>

      <div className="softsave-catalog-search__control">
        <span className="softsave-catalog-search__icon" aria-hidden="true">
          <Icon path={mdiMagnify} size={0.82} />
        </span>

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="search"
          className="softsave-input softsave-catalog-search__input"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={(event) => {
            if (suppressNextOpenRef.current) {
              onFocus?.(event);
              return;
            }

            if (normalizeQuery(value) && filteredOptions.length > 0 && !hasExactMatch) {
              setIsOpen(true);
            }
            onFocus?.(event);
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={
            showDropdown && activeIndex >= 0
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
        />

        {hasValue ? (
          <button
            type="button"
            className="softsave-catalog-search__clear"
            onClick={() => {
              onChange("");
              setIsOpen(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label={clearLabel}
          >
            <Icon path={mdiClose} size={0.72} />
          </button>
        ) : null}

        {showDropdown || (normalizeQuery(value) && !filteredOptions.length && !hasExactMatch) ? (
          <CatalogSuggestionDropdown
            listId={listId}
            options={filteredOptions}
            activeIndex={activeIndex}
            onSelect={selectOption}
            onOptionHover={setActiveIndex}
            emptyText={emptyText}
            showEmpty={Boolean(
              normalizeQuery(value) && !filteredOptions.length && !hasExactMatch,
            )}
            optionActionText=""
          />
        ) : null}
      </div>

      {helperText ? (
        <p className="softsave-catalog-search__helper">{helperText}</p>
      ) : null}
      {error ? (
        <span className="error-text" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

CatalogSearchInput.propTypes = {
  label: PropTypes.string.isRequired,
  catalog: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.string,
  maxResults: PropTypes.number,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  autoComplete: PropTypes.string,
  getOptionLabel: PropTypes.func,
  getOptionKey: PropTypes.func,
  emptyText: PropTypes.string,
  clearLabel: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

export default CatalogSearchInput;
