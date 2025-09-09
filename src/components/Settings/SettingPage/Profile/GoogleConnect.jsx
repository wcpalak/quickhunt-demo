import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userDetailsAction } from '../../../../redux/action/UserDetailAction';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Icon } from '../../../../utils/Icon';
import { apiService, GOOGLE_CLIENT_ID, isEmpty, } from '../../../../utils/constent';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from '../../../ui/input';

const GoogleConnect = ({ userDetails, setUserDetails }) => {
    const dispatch = useDispatch();
    const [formError, setFormError] = useState("");
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const [isLoading, setIsLoading] = useState(false);
    const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
    const [password, setPassword] = useState("");
    const [setPasswordLoading, setSetPasswordLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleConnectToggle = async () => {
        const isConnected = userDetails?.isGoogleConnect;
        const isPasswordCreated = userDetails?.isPasswordCreated;

        if (!isPasswordCreated) {
            setShowSetPasswordDialog(true);
            return;
        }

        if (isConnected) {
            await disconnectGoogle();
        } else {
            await handleGoogleLogin();
        }
    };

    const handleGoogleLogin = async () => {
        if (!window.google) {
            toast({ variant: "destructive", description: "Google services not available" });
            return;
        }

        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'profile email openid',
                callback: async (tokenResponse) => {
                    try {
                        setIsLoading(true);

                        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: {
                                Authorization: `Bearer ${tokenResponse.access_token}`,
                            },
                        });

                        const profile = await userInfo.json();

                        const data = await apiService.connectGoogle({
                            googleId: userDetails?.isGoogleConnect ? null : profile.sub,
                            email: userDetails?.isGoogleConnect ? profile.email : profile.email,
                        });

                        if (data.success) {
                            toast({ description: data.message });

                            dispatch(userDetailsAction({
                                ...userDetailsReducer,
                                isGoogleConnect: !userDetails?.isGoogleConnect,
                                email: !userDetails?.isGoogleConnect ? profile.email : userDetails.email,
                            }));

                            if (!userDetails?.isGoogleConnect) {
                                setUserDetails(prev => ({
                                    ...prev,
                                    email: profile.email,
                                    isGoogleConnect: true,
                                }));
                            }
                        } else {
                            toast({ variant: "destructive", description: data?.error?.message });
                        }
                        setIsLoading(false)
                    } catch (err) {
                        toast({ variant: "destructive", description: "Google login failed" });
                        setIsLoading(false);
                    }
                },
            });

            client.requestAccessToken();
        } catch (error) {
            toast({ variant: "destructive", description: "Failed to initialize Google login" });
        }
    };

    const disconnectGoogle = async () => {
        setIsLoading(true);
        const data = await apiService.connectGoogle({
            googleId: null,
            email: userDetails.email,
        });
        setIsLoading(false);
        if (data.success) {
            toast({ description: data.message });

            dispatch(userDetailsAction({
                ...userDetailsReducer,
                isGoogleConnect: false,
            }));

            setUserDetails(prev => ({
                ...prev,
                isGoogleConnect: false,
            }));

        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleSetPasswordSave = async () => {
        if (!password) {
            setFormError("Please enter a password.");
            return;
        }

        if (password.length < 8) {
            setFormError("Password must be at least 8 characters long.");
            return;
        }

        setFormError("");
        setSetPasswordLoading(true);
        const response = await apiService.createPassword({ password });
        setShowSetPasswordDialog(false);
        if (response?.success) {
            dispatch(userDetailsAction({
                ...userDetailsReducer,
                isPasswordCreated: true
            }));
            setPassword("");
        } else {
            setFormError(response?.error?.message);
        }
    };

    const closeShowPass = () => {
        setShowSetPasswordDialog(false); 
        setPassword("");
        setFormError("");
    }

    return (
        <Card>
            <CardHeader className="gap-1 border-b p-4 sm:px-5 sm:py-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    {Icon.Pin}
                    Connected Accounts
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                    Enable Single Sign-On (SSO) for faster, secure, and more convenient access to your account.
                </span>
            </CardHeader>

            <CardContent className="py-4 px-4 sm:px-5 sm:py-4">
                <div className="flex flex-row items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        {Icon.Google}
                        <span className="font-medium text-base">Google</span>

                        {userDetails?.isGoogleConnect && (
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                                Connected
                            </span>
                        )}
                    </div>

                    <div>
                        <Button
                            onClick={handleGoogleConnectToggle}
                            disabled={isLoading}
                            variant="outline"
                            className={`font-semibold ${userDetails?.isGoogleConnect
                                ? "text-red-600 border-red-600 hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                                : "text-[#7c3aed] border-[#7c3aed] hover:bg-[#ede9fe] hover:text-[#7c3aed] hover:border-[#7c3aed]"
                                }`}
                        >
                            {(isLoading) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {userDetails?.isGoogleConnect ? "Disconnecting..." : "Connecting..."}
                                </>
                            ) : (
                                userDetails?.isGoogleConnect ? "Disconnect" : "Connect"
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
            {showSetPasswordDialog && (
                <Dialog open={showSetPasswordDialog} onOpenChange={closeShowPass}>
                    <DialogContent className="sm:max-w-lg p-0 gap-0">
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="text-md flex font-medium items-center gap-2">
                                Set Password
                            </DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="p-4 text-gray-900">
                            <div className="grid gap-5">
                                <div className="grid w-full place-items-start gap-1.5">
                                    <label htmlFor="currentPassword" className="font-normal">Set Password</label>
                                    <div className="relative w-full">
                                        <Input
                                            id="currentPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => {
                                                setPassword(e.target.value);
                                                if (formError) setFormError("");
                                            }}
                                            placeholder="Enter your password"
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute top-0 right-0 h-10"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <Eye size={16} stroke="black" /> : <EyeOff size={16} stroke="black" />}
                                        </Button>
                                    </div>
                                    {formError && <p className="text-sm text-red-600">{formError}</p>}

                                </div>
                            </div>
                        </DialogDescription>
                        <DialogFooter className="p-4 border-t flex-nowrap flex-row gap-2 md:justify-start sm:justify-start">
                            <Button variant="outline" onClick={() => { setShowSetPasswordDialog(false); setPassword(""); }} disabled={setPasswordLoading}>Cancel</Button>
                            <Button onClick={handleSetPasswordSave} disabled={setPasswordLoading || isEmpty(password)} className="min-w-16 bg-primary hover:bg-primary">
                                {setPasswordLoading ? (
                                    <span className="flex items-center gap-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</span>
                                ) : 'Save'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
};

export default GoogleConnect;
