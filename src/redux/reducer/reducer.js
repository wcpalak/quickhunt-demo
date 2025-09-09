import { combineReducers } from "redux";
import projectDetailsReducer from "./ProjectDetailsReducer";
import userDetailsReducer from "./UserDetailsReducer";
import allStatusAndTypesReducer from "./AllStatusAndTypesReducer";
import allProjectReducer from "./AllProjectReducer";
import inboxMarkReadReducer from "./InboxMarkReadReducer";
import createSheetReducer from "./CreateSheetReducer";

const reducer = combineReducers({
  projectDetailsReducer: projectDetailsReducer,
  userDetailsReducer: userDetailsReducer,
  allStatusAndTypes: allStatusAndTypesReducer,
  allProjectReducer: allProjectReducer,
  inboxMarkRead: inboxMarkReadReducer,
  createSheet: createSheetReducer,
});

export default reducer;
