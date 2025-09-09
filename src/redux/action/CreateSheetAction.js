
export const SET_CREATE_SHEET_FORM_STATE = "SET_CREATE_SHEET_FORM_STATE";
export const SET_CREATE_SHEET_SIMILAR_IDEAS = "SET_CREATE_SHEET_SIMILAR_IDEAS";
export const CLEAR_CREATE_SHEET_STATE = "CLEAR_CREATE_SHEET_STATE";


export const setCreateSheetFormState = (formState) => ({
  type: SET_CREATE_SHEET_FORM_STATE,
  payload: formState,
});


export const setCreateSheetSimilarIdeas = (similarIdeasData) => ({
  type: SET_CREATE_SHEET_SIMILAR_IDEAS,
  payload: similarIdeasData,
});


export const clearCreateSheetState = () => ({
  type: CLEAR_CREATE_SHEET_STATE,
});
