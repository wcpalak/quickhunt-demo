import { SET_MARK_AS_READ, SET_TRACK_ACTIVITY } from '../constent';

export const inboxMarkReadAction = (payload) => {
    return(
        {
            type: SET_MARK_AS_READ,
            payload
        }
    )
};

export const trackActivityAction = (payload) => {
    return(
        {
            type: SET_TRACK_ACTIVITY,
            payload
        }
    )
};
