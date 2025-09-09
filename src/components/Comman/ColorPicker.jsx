import {useState, Fragment, useEffect} from "react";
import { Label } from "@/components/ui/label.jsx";
import { Input } from "@/components/ui/input.jsx";

const ColorPicker = ({ name, value, onChange, label, disabled }) => {
    const [inputValue, setInputValue] = useState(value || "");
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        setInputValue(value)
    },[value])

    const handleTextInputChange = (e) => {
        const inputValue = e.target.value;
        if (/^#[0-9A-Fa-f]{0,6}$/.test(inputValue) || inputValue === "") {
            setInputValue(inputValue);
            const valid = /^#[0-9A-Fa-f]{6}$/.test(inputValue);
            setIsValid(valid);
            if (valid) {
                onChange(inputValue, valid); // Pass validity to parent
            } else {
                onChange(inputValue, false); // Pass invalidity to parent
            }
        }
    };

    const handleColorInputChange = (e) => {
        const colorValue = e.target.value;
        setInputValue(colorValue);
        setIsValid(true);
        onChange(colorValue, true);
    };

    return (
        <Fragment>
            <div className="grid gap-1.5 w-full">
                {label && (
                    <Label htmlFor={`color${name}picker`} className="font-normal w-fit">
                        {label}
                    </Label>
                )}
                <Label className="cursor-pointer relative h-9 w-full rounded-md border border-input p-2 text-sm">
                    <Input
                        type="color"
                        name={name}
                        id={`color${name}picker`}
                        className={`cursor-pointer w-[20px] h-[23px] p-0 bg-transparent border-0 absolute top-1/2 -translate-y-1/2 left-2`}
                        value={inputValue}
                        onChange={handleColorInputChange}
                        disabled={disabled}
                    />
                    <Input
                        type="text"
                        className={`pl-8 pr-2 w-full h-full bg-transparent border-0 text-sm text-foreground font-normal ${
                            isValid ? "" : "border-red-500"
                        }`}
                        value={inputValue}
                        onChange={handleTextInputChange}
                        disabled={disabled}
                        placeholder="Enter #RRGGBB"
                    />
                </Label>
                {!isValid && (
                    <span className="text-sm font-normal text-red-500">
                        Please enter a valid color code (e.g., #FF5733).
                    </span>
                )}
            </div>
        </Fragment>
    );
};

export default ColorPicker;
