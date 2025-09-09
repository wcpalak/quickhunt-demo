import React, { useState, useRef, useEffect } from "react";
import {Icon} from "../../utils/Icon";
import {isEmpty} from "../../utils/constent";

const CustomSelect = ({ options, placeholder = "Please select a response..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative w-full">
            <div
                className="bg-white border text-gray-900 text-sm rounded-md rounded-r-none block w-full h-10 p-2.5 cursor-default flex items-center justify-between truncate max-w-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isEmpty(placeholder) ? "Please select a response..." : placeholder}
                {Icon.select}
            </div>

            {isOpen && (
                <ul className="absolute bg-white text-sm rounded mt-1 w-full overflow-auto z-50 max-h-96 rounded-md border text-popover-foreground shadow-md">
                    {(options || []).map((x) => (
                        <li
                            key={x.value}
                            className="px-4 py-2 hover:bg-gray-100 hover:bg-gray-100 cursor-pointer break-words"
                        >
                            {x.title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;