import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function normalizeOption(option, index) {
  if (typeof option === 'string' || typeof option === 'number') {
    const value = String(option);
    return {
      key: `${value}-${index}`,
      value,
      label: value,
      disabled: false,
    };
  }

  if (option && typeof option === 'object') {
    const value = String(option.value ?? option.id ?? option.label ?? option.name ?? index);
    return {
      key: String(option.key ?? value ?? index),
      value,
      label: String(option.label ?? option.name ?? option.value ?? option.id ?? value),
      disabled: Boolean(option.disabled),
    };
  }

  const value = String(index);
  return {
    key: value,
    value,
    label: value,
    disabled: false,
  };
}

function getFirstEnabledIndex(options) {
  return options.findIndex((option) => !option.disabled);
}

function DropdownSelect({
  id = undefined,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  disabled = false,
  ariaLabel = undefined,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  highlightSelected = true,
}) {
  const generatedId = useId();
  const controlId = id || `dropdown-select-${generatedId.replace(/:/g, '')}`;
  const listId = `${controlId}-listbox`;
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedOptions = useMemo(
    () => (Array.isArray(options) ? options.map(normalizeOption) : []),
    [options],
  );

  const selectedIndex = useMemo(
    () => normalizedOptions.findIndex((option) => String(option.value) === String(value)),
    [normalizedOptions, value],
  );

  const selectedLabel = selectedIndex >= 0
    ? normalizedOptions[selectedIndex]?.label
    : placeholder;
  const accessibleLabel = ariaLabel
    ? `${ariaLabel}. ${selectedLabel}`
    : undefined;

  const setOpenWithIndex = (nextOpen, nextIndex = -1) => {
    setIsOpen(nextOpen);
    setActiveIndex(nextOpen ? nextIndex : -1);
  };

  const getNextIndex = (currentIndex, direction) => {
    if (!normalizedOptions.length) {
      return -1;
    }

    let nextIndex = currentIndex;

    for (let step = 0; step < normalizedOptions.length; step += 1) {
      nextIndex = (nextIndex + direction + normalizedOptions.length) % normalizedOptions.length;
      if (!normalizedOptions[nextIndex]?.disabled) {
        return nextIndex;
      }
    }

    return currentIndex;
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpenWithIndex(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const firstEnabledIndex = getFirstEnabledIndex(normalizedOptions);

    if (highlightSelected && selectedIndex >= 0 && !normalizedOptions[selectedIndex]?.disabled) {
      setActiveIndex(selectedIndex);
      return;
    }

    if (!highlightSelected && normalizedOptions.length > 1) {
      const nextIndex = selectedIndex >= 0
        ? getNextIndex(selectedIndex, 1)
        : firstEnabledIndex;
      setActiveIndex(nextIndex >= 0 ? nextIndex : -1);
      return;
    }

    setActiveIndex(firstEnabledIndex >= 0 ? firstEnabledIndex : -1);
  }, [highlightSelected, isOpen, normalizedOptions, selectedIndex]);

  const openMenu = () => {
    if (disabled || normalizedOptions.length === 0) {
      return;
    }

    const firstEnabledIndex = selectedIndex >= 0 && !normalizedOptions[selectedIndex]?.disabled
      ? selectedIndex
      : getFirstEnabledIndex(normalizedOptions);

    setOpenWithIndex(true, firstEnabledIndex >= 0 ? firstEnabledIndex : -1);
  };

  const closeMenu = () => setOpenWithIndex(false);

  const handleSelect = (option) => {
    if (option?.disabled) {
      return;
    }

    onChange(option.value);
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }

      setActiveIndex((currentIndex) => getNextIndex(currentIndex < 0 ? selectedIndex : currentIndex, 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }

      setActiveIndex((currentIndex) => getNextIndex(currentIndex < 0 ? selectedIndex : currentIndex, -1));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
        return;
      }

      const option = normalizedOptions[activeIndex];
      if (option) {
        handleSelect(option);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((currentIndex) => getNextIndex(currentIndex, 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((currentIndex) => getNextIndex(currentIndex, -1));
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = normalizedOptions[activeIndex];
      if (option) {
        handleSelect(option);
      }
    }
  };

  return (
    <div className={`softsave-dropdown-select ${className}`.trim()} ref={wrapperRef}>
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        className={`softsave-input softsave-input--select softsave-dropdown-select__trigger ${triggerClassName}`.trim()}
        onClick={() => {
          if (isOpen) {
            closeMenu();
            return;
          }

          openMenu();
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={accessibleLabel}
        disabled={disabled}
      >
        <span className="softsave-dropdown-select__value">{selectedLabel}</span>
      </button>

      {isOpen && normalizedOptions.length > 0 ? (
        <div className={`softsave-dropdown__panel ${menuClassName}`.trim()} onKeyDown={handleMenuKeyDown}>
          <ul className="softsave-dropdown__list custom-scrollbar" id={listId} role="listbox" aria-labelledby={controlId}>
            {normalizedOptions.map((option, index) => (
              <li key={option.key} role="presentation">
                <button
                  type="button"
                  className={`softsave-dropdown__item ${index === activeIndex ? 'is-active' : ''}`.trim()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={index === activeIndex}
                  disabled={option.disabled}
                >
                  <span className="softsave-dropdown__item-label">{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

DropdownSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      name: PropTypes.string,
      disabled: PropTypes.bool,
    }),
  ])).isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  triggerClassName: PropTypes.string,
  menuClassName: PropTypes.string,
  highlightSelected: PropTypes.bool,
};

export default DropdownSelect;
