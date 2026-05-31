import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';

function ProfilePagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="talent-board-pagination" aria-label="Paginacion de resultados">
      <button
        type="button"
        aria-label="Pagina anterior"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <Icon path={mdiChevronLeft} size={0.82} />
      </button>

      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          className={page === currentPage ? 'is-active' : ''}
          aria-current={page === currentPage ? 'page' : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        aria-label="Pagina siguiente"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <Icon path={mdiChevronRight} size={0.82} />
      </button>
    </nav>
  );
}

ProfilePagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default ProfilePagination;
