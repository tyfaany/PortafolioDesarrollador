import { useContext } from 'react';
import { FeedbackContext } from '../context/FeedbackContext';

function useFeedback() {
  return useContext(FeedbackContext);
}

export default useFeedback;
