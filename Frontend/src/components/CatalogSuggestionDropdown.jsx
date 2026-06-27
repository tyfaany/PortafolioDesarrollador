import PropTypes from 'prop-types';
import '../styles/CatalogSuggestionDropdown.css';

function CatalogSuggestionDropdown({
  listId,
  options,
  activeIndex = -1,
  onSelect,
  onOptionHover = undefined,
  emptyText = 'No hay coincidencias en el catalogo.',
  showEmpty = false,
  optionActionText = 'Seleccionar',
}) {
  if (showEmpty) {
    return (
      <div className="softsave-catalog-dropdown__panel">
        <div className="softsave-catalog-dropdown__empty" role="status" aria-live="polite">
          {emptyText}
        </div>
      </div>
    );
  }

  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  return (
    <div className="softsave-catalog-dropdown__panel">
      <ul className="softsave-catalog-dropdown__list custom-scrollbar" id={listId} role="listbox">
        {options.map((option, index) => (
          <li key={option.key} role="presentation">
            <button
              id={`${listId}-option-${index}`}
              type="button"
              className={`softsave-catalog-dropdown__option ${index === activeIndex ? 'is-active' : ''}`}
              onMouseEnter={() => onOptionHover?.(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(option)}
              role="option"
              aria-selected={index === activeIndex}
            >
              <span className="softsave-catalog-dropdown__option-label">{option.label}</span>
              {optionActionText ? (
                <span className="softsave-catalog-dropdown__option-action">{optionActionText}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

CatalogSuggestionDropdown.propTypes = {
  listId: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    raw: PropTypes.any,
  })),
  activeIndex: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  onOptionHover: PropTypes.func,
  emptyText: PropTypes.string,
  showEmpty: PropTypes.bool,
  optionActionText: PropTypes.string,
};

export default CatalogSuggestionDropdown;
