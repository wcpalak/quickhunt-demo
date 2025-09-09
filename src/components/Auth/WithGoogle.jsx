import React from 'react'
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    apiService, baseUrl, GOOGLE_CLIENT_ID, TOKEN_KEY, USER_DETAILS_KEY, identifyUser,
    trackEvent, preserveSearchParams, preserveSearchParamsWithoutUTM
} from "../../utils/constent";
import { Icon } from "../../utils/Icon";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { userDetailsAction } from "../../redux/action/UserDetailAction";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";

const WithGoogle = ({ title, isLoading, isGoogleLoading, setIsGoogleLoading }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const utmSource = searchParams.get("utm_source") || '';

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
                        setIsGoogleLoading(true);

                        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: {
                                Authorization: `Bearer ${tokenResponse.access_token}`,
                            },
                        });

                        const profile = await userInfo.json();

                        const payload = {
                            firstName: profile.given_name,
                            lastName: profile.family_name,
                            email: profile.email?.toLowerCase(),
                            password: profile.sub,
                            profileImage: profile.picture,
                            loginType: '2',
                            utmSource: utmSource,
                        };

                        const data = await apiService.login(payload);

                        if (data.success) {
                            toast({ description: data.message })
                            const urlParams = new URLSearchParams(window.location.search);
                            const token = urlParams.get('token');
                            let userDetails = { ...data.data };
                            const distinctId = userDetails.id || userDetails.userId || userDetails.email;
                            if (userDetails.isNewUser) {
                                identifyUser(distinctId, {
                                    $email: userDetails.email,
                                    $first_name: userDetails.firstName,
                                    $last_name: userDetails.lastName,
                                    name: userDetails.name,
                                    userId: distinctId,
                                });
                                trackEvent("WithGoogle", {
                                    email: userDetails.email,
                                    firstName: userDetails.firstName,
                                    lastName: userDetails.lastName,
                                    userId: distinctId,
                                });

                            }
                            if (token) {
                                navigate(preserveSearchParams(`${baseUrl}/invitation`, `?token=${token}`));
                            } else {
                                if (data?.data?.onboarding == 0) {
                                    delete userDetails?.token;
                                    delete userDetails?.onboarding;
                                    dispatch(userDetailsAction(userDetails))
                                    localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(userDetails));
                                    localStorage.setItem("token-verify-onboard", data.data?.token);
                                    navigate(preserveSearchParamsWithoutUTM(`${baseUrl}/onboarding`));
                                } else if (data?.data?.requires2fa) {
                                    toast({ description: data.message });
                                    localStorage.setItem("token-verify-2fa", data.data?.token);
                                    navigate(preserveSearchParamsWithoutUTM(`${baseUrl}/verify-2fa`), { state: { email: data.data.email } });
                                } else {
                                    localStorage.setItem(TOKEN_KEY, data.data?.token);
                                    navigate(preserveSearchParamsWithoutUTM(`${baseUrl}/dashboard`));
                                }
                            }
                        } else {
                            toast({ variant: "destructive", description: data?.error?.message || "Login failed" });
                        }
                    } catch (err) {
                        toast({ variant: "destructive", description: "Google login failed" });
                    } finally {
                        setIsGoogleLoading(false);
                    }
                },
            });

            client.requestAccessToken();
        } catch (error) {
            toast({ variant: "destructive", description: "Failed to initialize Google login" });
        }
    };

    return (
        <Button onClick={isLoading ? null : handleGoogleLogin} variant="outline hover:none" disabled={isGoogleLoading}
            className="w-full border border-primary font-medium text-primary gap-2">
            {isGoogleLoading ? <Loader2 className={"h-4 w-4 animate-spin"} /> : Icon.googleIcon}
            {title}
        </Button>
    );
};

export default WithGoogle;