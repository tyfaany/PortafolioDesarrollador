import { useContext } from 'react';
import { FeedbackContext } from '../context/FeedbackContext.js';

function useFeedback() {
  return useContext(FeedbackContext);
}

export default useFeedback;
