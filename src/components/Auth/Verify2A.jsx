import React, {useEffect, useState} from 'react';
import {Button} from "../ui/button"
import {useNavigate} from "react-router-dom"
import {apiService, baseUrl, getTwoAuthTokenVerify, TOKEN_KEY, preserveSearchParamsWithoutUTM} from "../../utils/constent";
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import AuthLayout from "./CommonAuth/AuthLayout";
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot} from "@/components/ui/input-otp.jsx";
import {Checkbox} from "@/components/ui/checkbox.jsx";
import { Icon } from '../../utils/Icon';

const Verify2A = () => {
    let navigate = useNavigate();
    const {toast} = useToast();
    const [otp, setOtp] = useState('');
    const [remember, setRemember] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onChange = (field, value) => {
        if (field === 'otp') {
            setOtp(value);
        } else if (field === 'remember') {
            setRemember(!!value);
        }
    };

    useEffect(() => {
        if(!getTwoAuthTokenVerify()){
            navigate(`${baseUrl}/login`, { replace: true });
            return;
        }
    },[])

    const handleTFAContinue = async () => {
        if (!otp || otp.length !== 6) {
            toast({ title: 'Invalid code', description: 'Please enter a valid 6-digit code.', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const response = await apiService.verifyAuth({ otp: otp, remember }, { Authorization: `Bearer ${getTwoAuthTokenVerify()}`});
        setIsLoading(false);
        if (response.success) {
            navigate(preserveSearchParamsWithoutUTM(`${baseUrl}/dashboard`))
            localStorage.setItem(TOKEN_KEY, response?.data?.token);
        } else {
            toast({  description: response?.error?.message , variant: 'destructive' });
        }
    };

    return (
        <AuthLayout>
            <div className=" flex flex-column justify-center items-end w-full items-center h-full flex justify-center">
                <div className="flex flex-col gap-8 mb-10">
                    <div className="flex flex-col items-center justify-center">
                        <div className='pb-6'>{Icon.blueLogo}</div>
                        <InputOTP maxLength={6} value={otp} onChange={(value) => onChange("otp", value)} id={'code'}>
                            <InputOTPGroup>
                                {Array.from(Array(3)).map((_, index) => (
                                    <InputOTPSlot key={index} index={index} value={otp[index] || ''}/>
                                ))}
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                {Array.from(Array(3)).map((_, index) => (
                                    <InputOTPSlot key={index + 3} index={index + 3} value={otp[index + 3] || ''}/>
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <div className="flex flex-col justify-center gap-4">
                        <div className="items-top flex space-x-2 justify-center">
                            <Checkbox id="remember" checked={remember} onCheckedChange={(value) => onChange("remember", value)}/>
                            <div className="grid gap-1.5 leading-none">
                                <label htmlFor="remember" className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Remember me for 30 days for this browser
                                </label>
                            </div>
                        </div>

                        <Button onClick={handleTFAContinue} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Continue
                        </Button>

                        <Button variant={"secondary"} onClick={() => navigate(`${baseUrl}/login`)}>
                            Return to login
                        </Button>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Verify2A;