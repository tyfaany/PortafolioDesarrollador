import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiCheckCircleOutline, mdiClose, mdiAlertCircleOutline } from '@mdi/js';

function FeedbackToast({ toastId, message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [toastId, message, onClose]);

  if (!message) {
    return null;
  }

  const icono = type === 'error' ? mdiAlertCircleOutline : mdiCheckCircleOutline;

  return (
    <div className={`softsave-feedback-toast softsave-feedback-toast--${type}`} role="status" aria-live="polite">
      <Icon path={icono} size={0.9} className="softsave-feedback-toast__icon" />
      <span className="softsave-feedback-toast__text">{message}</span>
      <button
        type="button"
        className="softsave-feedback-toast__close"
        onClick={onClose}
        aria-label="Cerrar notificación"
      >
        <Icon path={mdiClose} size={0.7} />
      </button>
    </div>
  );
}

FeedbackToast.propTypes = {
  toastId: PropTypes.number,
  message: PropTypes.string,
  type: PropTypes.oneOf(['success', 'error']),
  onClose: PropTypes.func.isRequired,
};

FeedbackToast.defaultProps = {
  toastId: 0,
  message: '',
  type: 'success',
};

export default FeedbackToast;
