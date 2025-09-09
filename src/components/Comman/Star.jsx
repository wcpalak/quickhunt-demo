import React from 'react';
import {Star} from "lucide-react";

const RatingStar = ({ filled, onClick, onMouseEnter, onMouseLeave, color = '#FFD700' }) => {
    return (
        <span
            style={{
                cursor: 'pointer',
                color: filled ? color : color,
                fontSize: '24px'
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={"flex flex-row"}
        >
            <Star style={{fill : filled ? color : ""}} className={`${filled ? `fill-[${color}]` : ""}`}  />
    </span>
    );
};

export default RatingStar;
