import React, {Fragment} from 'react';
import {Input} from '../../ui/input';
import {Label} from '../../ui/label';
import {Button} from '../../ui/button';
import {Eye, EyeOff} from 'lucide-react';

const FormInput = ({
                       label,
                       name,
                       type = 'text',
                       placeholder,
                       value,
                       onChange,
                       onBlur,
                       error,
                       showToggle = false,
                       toggleVisibility,
                       isLogin,
                       onClick,
                       formError,
                       onKeyDown,
                       className,
                   }) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const handleToggle = () => {
        setIsVisible(!isVisible);
        if (toggleVisibility) toggleVisibility();
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <Label htmlFor={name} className="font-medium">{label}</Label>
            <div className="relative">
                <Input
                    id={name}
                    type={showToggle && isVisible ? 'text' : type}
                    placeholder={placeholder}
                    value={value}
                    name={name}
                    onChange={onChange}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className={className}
                />
                {showToggle && (
                    <Button
                        variant="ghost hover:none"
                        onClick={handleToggle}
                        className="absolute h-full top-0 right-0"
                    >
                        {isVisible ? (<Eye size={16}/>) : (<EyeOff size={16}/>)}
                    </Button>
                )}
            </div>
            {
                isLogin ? "" : <Fragment>{error && <span className="text-destructive text-sm">{error}</span>}</Fragment>
            }
            {
                isLogin ? <div className={"flex justify-between"}>
                    {formError && <span className="text-destructive text-sm">{formError}</span>}
                    <Button variant={"link"}
                            className="inline-block text-sm p-0 h-auto hover:no-underline"
                            onClick={onClick}
                    >
                        <span className={"text-primary"}>Forgot your password?</span>
                    </Button>
                </div> : ''
            }
        </div>
    );
};

export default FormInput;