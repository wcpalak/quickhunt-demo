import React, {Fragment} from 'react';
import {brandingURL} from "../../utils/constent";
import {useSelector} from "react-redux";

const Branding = ({className = '', isPolaris = false}) => {
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    return (
        <Fragment>
            {(allStatusAndTypes?.setting?.isBranding === 0 && projectDetailsReducer.plan > 0) ? null : (
                <h6 className={`text-xs font-medium ml-auto px-2 bg-muted text-gray-900 ${className}`}>
                    Powered by{" "}
                    <a
                        className={`${isPolaris ? "" : "text-primary"} underline`}
                        href={brandingURL}
                        target="_blank"
                    >
                        quickhunt
                    </a>
                </h6>
            )}
        </Fragment>
    );
};

export default Branding;