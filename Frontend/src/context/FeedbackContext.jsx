import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import FeedbackToast from '../components/FeedbackToast';
import { FeedbackContext } from './FeedbackContext';

function FeedbackProvider({ children }) {
  const [toast, setToast] = useState({
    id: 0,
    message: '',
    type: 'success',
  });

  const showFeedback = useCallback((message, type = 'success') => {
    if (!message) {
      return;
    }

    setToast((actual) => ({
      id: actual.id + 1,
      message: String(message),
      type,
    }));
  }, []);

  const clearFeedback = useCallback(() => {
    setToast((actual) => ({
      ...actual,
      message: '',
    }));
  }, []);

  const value = useMemo(() => ({
    showFeedback,
    clearFeedback,
  }), [showFeedback, clearFeedback]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <FeedbackToast
        toastId={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={clearFeedback}
      />
    </FeedbackContext.Provider>
  );
}

FeedbackProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default FeedbackProvider;
