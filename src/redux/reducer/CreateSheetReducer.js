
import {
  SET_CREATE_SHEET_FORM_STATE,
  SET_CREATE_SHEET_SIMILAR_IDEAS,
  CLEAR_CREATE_SHEET_STATE,
} from "../action/CreateSheetAction";

const initialState = {
  formState: null, 
  similarIdeas: [], 
  showAllSimilarIdeas: false, 
};


const createSheetReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_CREATE_SHEET_FORM_STATE:
      return {
        ...state,
        formState: action.payload,
      };

    case SET_CREATE_SHEET_SIMILAR_IDEAS:
      return {
        ...state,
        similarIdeas: action.payload.similarIdeas || [],
        showAllSimilarIdeas: action.payload.showAllSimilarIdeas || false,
      };

    case CLEAR_CREATE_SHEET_STATE:
      return {
        ...initialState,
      };

    default:
      return state;
  }
};

export default createSheetReducer;
