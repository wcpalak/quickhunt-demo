import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, Files, KeyRound, Loader2 } from 'lucide-react';
import { toast } from '../../../ui/use-toast';

const TwoFactorAuthentication = ({ enabled, onToggle, isLoading, userDetails }) => {
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShowSecret = () => setShowSecret(prev => !prev);

    const handleCopy = () => {
        if (userDetails?.secrets2fa) {
            navigator.clipboard.writeText(userDetails.secrets2fa);
            setCopied(true);
            toast({ description: "Copied!", variant: "success" });

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    };

    return (
        <Card>
            <CardHeader className="gap-1 border-b p-4 sm:px-5 sm:py-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-base" />
                    2FA (Two-Factor Authentication)
                    <span className={`ml-3 px-2 py-1 rounded text-xs font-semibold ${userDetails.enabled2fa == "1" ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {userDetails.enabled2fa == "1" ? 'Enabled' : 'Disabled'}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="py-4 px-4 sm:px-5 sm:py-4">
                <div className="flex flex-col gap-2 items-start">
                    <span className="text-sm text-muted-foreground">
                        Secure your account with two-factor authentication, adding an extra layer of protection to your login process.
                    </span>

                    {userDetails?.qrCode && userDetails.enabled2fa == "1" && (
                        <div className="mt-6 flex flex-col gap-4 items-start w-full">
                            <div className="flex flex-col items-start gap-2">
                                <span className="font-semibold text-sm">Scan the QR code with your authenticator app</span>
                                <img
                                    src={userDetails.qrCode}
                                    alt="2FA QR Code"
                                    className="w-36 h-36 border rounded bg-white"
                                />
                            </div>

                            <div className="flex flex-col items-start w-full">
                                <div
                                    className="flex items-center justify-start w-full cursor-pointer"
                                    onClick={handleShowSecret}
                                >
                                    <h5 className="text-sm font-semibold">Show code for manual configuration</h5>
                                    <Button variant="link" size="icon" className={'h-auto w-auto p-2 text-gray-900'}>
                                        {showSecret ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                </div>

                                {showSecret && (
                                    <div className="flex items-center gap-1 border p-1 rounded">
                                        <span className="font-mono text-base px-1 rounded select-all">
                                            {userDetails.secrets2fa}
                                        </span>
                                        <Button variant="ghost" size="icon" onClick={handleCopy}>
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Files className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex items-center p-4 sm:px-5 sm:pt-0 justify-start md:pt-0">
                <Button
                    onClick={onToggle}
                    disabled={isLoading}
                    variant="outline"
                    className={
                        (userDetails.enabled2fa == "1"
                            ? "text-red-600 border-red-600 hover:bg-red-50 hover:text-red-600"
                            : "text-[#7c3aed] border-[#7c3aed] hover:bg-[#ede9fe] hover:text-[#7c3aed] hover:border-[#7c3aed]")
                        + " font-semibold"
                    }
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading
                        ? userDetails.enabled2fa == "1"
                            ? "Disabling..."
                            : "Setting up..."
                        : userDetails.enabled2fa == "1"
                            ? "Disable"
                            : "Set Up"}
                </Button>
            </CardFooter>

        </Card>
    );
};

export default TwoFactorAuthentication;
