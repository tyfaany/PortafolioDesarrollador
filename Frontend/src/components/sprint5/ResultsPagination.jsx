import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';

const PAGES = [1, 2, 3];

function ResultsPagination({ activePage = 1 }) {
  return (
    <nav className="sprint5-pagination" aria-label="Paginacion de resultados">
      <button type="button" aria-label="Pagina anterior">
        <Icon path={mdiChevronLeft} size={0.82} />
      </button>
      {PAGES.map((page) => (
        <button
          key={page}
          type="button"
          className={page === activePage ? 'is-active bg-[#E67E22]' : ''}
          aria-current={page === activePage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
      <button type="button" aria-label="Pagina siguiente">
        <Icon path={mdiChevronRight} size={0.82} />
      </button>
    </nav>
  );
}

ResultsPagination.propTypes = {
  activePage: PropTypes.number,
};

export default ResultsPagination;
