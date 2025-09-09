import React from 'react';
import {Icon} from "../../utils/Icon";

const EmptyData = ({emptyIcon, children, className = ''}) => {
    return (
        <div className={`p-6 flex flex-col justify-center items-center w-full ${className} min-h-[220px]`}>
            {emptyIcon ?? Icon.emptyData}
            {children}
        </div>
    );
};

export default EmptyData;