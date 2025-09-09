import React, { useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../ui/card";
import { Label } from "../../../ui/label";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { AlertTriangle, CircleX, Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { userDetailsAction } from "../../../../redux/action/UserDetailAction";
import { toast } from "../../../ui/use-toast";
import { apiService, baseUrl, DO_SPACES_ENDPOINT, isEmpty } from "../../../../utils/constent";
import PasswordFactory from "./Modals/PasswordFactory";
import { useNavigate } from 'react-router';
import DeleteAccountModal from "@/components/Settings/SettingPage/Profile/Modals/DeleteAccountModal.jsx";
import TwoFactorAuthentication from "./TwoFactorAuthentication";
import TwoFactorAuthenticationModal from "./Modals/TwoFactorAuthenticationModal";
import GoogleConnect from './GoogleConnect';
import { useImagePreview } from '../../../Comman/ImagePreviewProvider';

const initialState = {
    id: "",
    email: "",
    firstName: "",
    lastName: "",
    profileImage: "",
}

const initialStateError = {
    firstName: '',
    lastName: ''
}

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { openPreview } = useImagePreview();

    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const [userDetails, setUserDetails] = useState(initialState);
    const [formError, setFormError] = useState(initialStateError);
    const [isLoading, setIsLoading] = useState(false);
    const [isChangePassword, setIsChangePassword] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [twoFAMode, setTwoFAMode] = useState('enable');

    useEffect(() => {
        if (userDetails && (userDetails.enabled2fa === "1" || userDetails.enabled2fa === 1)) {
            setIs2FAEnabled(true);
        } else {
            setIs2FAEnabled(false);
        }
    }, [userDetails.enabled2fa]);

    useEffect(() => {
        setUserDetails({ ...userDetailsReducer });
    }, [userDetailsReducer]);


    const handle2FASubmit = (mode, passwordOrCode = "") => {
        setIs2FALoading(true);

        const isGoogleUser = userDetailsReducer?.isGoogleConnect || userDetailsReducer?.loginType === 2;

        const payload = isGoogleUser
            ? { socialUid: userDetailsReducer?.socialUid }
            : { password: passwordOrCode };

        const apiCall = mode === "disable"
            ? apiService.disableAuth(payload)
            : apiService.enableAuth(payload);

        return apiCall
            .then((res) => {
                if (res?.success) {
                    toast({ description: res.message });
                    dispatch(userDetailsAction({
                        ...userDetailsReducer,
                        qrCode: res?.data?.qrCode,
                        secrets2fa: res?.data?.secrets2fa,
                        enabled2fa: userDetailsReducer.enabled2fa == "1" ? "0" : "1"
                    }));
                } else {
                    toast({
                        description: res?.error?.message,
                        variant: "destructive",
                    });
                    return false;
                }
            })
            .catch((error) => {
                toast({
                    description: error?.message,
                    variant: "destructive",
                });
                return false;
            })
            .finally(() => {
                setIs2FALoading(false);
            });
    };

    const handle2FAToggle = () => {
        const mode = is2FAEnabled ? "disable" : "enable";
        setTwoFAMode(mode);

        if (userDetailsReducer?.loginType === 2) {
            handle2FASubmit(mode);
        } else {
            setIs2FAModalOpen(true);
        }
    };

    const handle2FAModalSave = (passwordOrCode) => {
        return handle2FASubmit(twoFAMode, passwordOrCode);
    };

    const onChange = (event) => {
        const { name, value } = event.target;
        const trimmedValue = (name === "firstName" || name === "lastName") ? value.trimStart() : value;
        setUserDetails(prev => ({ ...prev, [name]: trimmedValue }));
        setFormError(prev => ({
            ...prev,
            [name]: formValidate(name, trimmedValue)
        }));
    };

    const onBlur = (event) => {
        const { name, value } = event.target;
        setFormError({
            ...formError,
            [name]: formValidate(name, value)
        });
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "firstName":
                if (!value || value.trim() === "") {
                    return "First name is required";
                } else {
                    return "";
                }
            case "lastName":
                if (!value || value.trim() === "") {
                    return "Last name is required";
                } else {
                    return "";
                }
            case "currentPassword":
                if (!value || value.trim() === "") {
                    return "Current password is required";
                } else {
                    return "";
                }
            case "password":
                if (!value || value.trim() === "") {
                    return "New password is required";
                }
                else {
                    return "";
                }
            case "profileImage":
                if (value && value.size > 5 * 1024 * 1024) {
                    return "Image size must be less than 5 MB.";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };


    const handleFileChange = (file) => {
        const selectedFile = file.target.files[0];
        setUserDetails({
            ...userDetails,
            profileImage: selectedFile
        });
        setFormError(formError => ({
            ...formError,
            'profileImage': formValidate('profileImage', selectedFile)
        }));
    };

    const onDeleteImg = async (name, value) => {
        if (userDetails && userDetails?.profileImage && userDetails.profileImage?.name) {
            setUserDetails({ ...userDetails, profileImage: "" })
        } else {
            setUserDetails({ ...userDetails, [name]: value, profileImage: "" })
        }
    }

    const onUpdateUser = async () => {
        const trimmedFirstName = userDetails.firstName ? userDetails.firstName.trim() : "";
        const trimmedLastName = userDetails.lastName ? userDetails.lastName.trim() : "";
        const updatedIdea = {
            ...userDetails,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
        };
        setUserDetails(updatedIdea);
        let validationErrors = {};
        Object.keys(userDetails).forEach(name => {
            const error = formValidate(name, userDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        let formData = new FormData();
        const obj = {
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            profileImage: userDetails.profileImage,
            deleteImage: userDetails?.deleteImage || '',
        }
        Object.keys(obj).forEach((key) => {
            if (key === "deleteImage") {
                if (obj[key]) {
                    formData.append(key, obj[key]);
                }
            } else {
                formData.append(key, obj[key]);
            }
        });
        setIsLoading(true)
        const data = await apiService.updateLoginUserDetails(formData, userDetailsReducer.id);
        setIsLoading(false);
        if (data.success) {
            dispatch(userDetailsAction({ ...data.data }));
            toast({ description: data.message, });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    }


    const handleDeleteAccount = async () => {
        setIsDeleteLoading(true);
        const isGoogleUser = userDetails?.isGoogleConnect && userDetails?.loginType === 2;
        const payload = {
            password: isGoogleUser ? "" : deletePassword,
            googleId: isGoogleUser ? userDetails?.socialUid : ""
        };
        const res = await apiService.deleteAccount(payload);
        setIsDeleteLoading(false);
        if (res?.success) {
            setIsDeleteDialogOpen(false);
            localStorage.clear();
            toast({ description: res?.message });
            navigate(`${baseUrl}/login`);
        } else {
            toast({ description: res?.error?.message, variant: "destructive" });
        }
    };


    const profileImg = userDetails?.profileImage?.name ? URL.createObjectURL(userDetails?.profileImage) : userDetails?.profileImage ? `${DO_SPACES_ENDPOINT}/${userDetails?.profileImage}` : null;

    return (
        <Fragment>
            <PasswordFactory {...{ isChangePassword, setIsChangePassword, setUserDetails, userDetails }} />

            <div className={"flex flex-col gap-6"}>
                <Card>
                    <CardHeader className={"gap-1 border-b p-4 sm:px-5 sm:py-4"}>
                        <CardTitle className={"font-medium text-xl lg:text-2xl capitalize"}>Edit Profile</CardTitle>
                        <CardDescription className={" text-sm text-muted-foreground p-0"}>Manage your account
                            settings.</CardDescription>
                    </CardHeader>
                    <CardContent className={"py-4 px-4 sm:px-5 sm:py-4 border-b"}>
                        <div className={"flex gap-4 flex-wrap lg:flex-nowrap md:flex-nowrap sm:flex-wrap"}>
                            <div className="relative mt-0 md:mt-3">
                                {
                                    !isEmpty(profileImg) ?
                                        <div className="w-[80px] h-[80px] sm:w-[132px] sm:h-[128px] relative border">
                                            <img
                                                className="h-full w-full rounded-md object-cover cursor-pointer"
                                                src={profileImg}
                                                alt="profile"
                                                onClick={() => openPreview([profileImg], 0)}
                                            />
                                            <CircleX
                                                size={20}
                                                className="stroke-gray-500 cursor-pointer absolute top-0 left-full translate-x-[-50%] translate-y-[-50%] z-10"
                                                onClick={() => onDeleteImg('deleteImage', userDetails?.profileImage?.name ? "" : userDetails?.profileImage)}
                                            />
                                        </div> :
                                        <div>
                                            <input
                                                id="pictureInput"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <label
                                                htmlFor="pictureInput"
                                                className="flex w-[80px] h-[80px] sm:w-[132px] sm:h-[128px] justify-center items-center border-dashed border border-gray-300 rounded cursor-pointer"
                                            >
                                                <Upload className="h-4 w-4 text-muted-foreground" />
                                            </label>
                                        </div>
                                }
                                {formError.profileImage &&
                                    <div className={"text-xs text-destructive"}>{formError.profileImage}</div>}
                            </div>

                            <div className={"grid sm:grid-cols-2 sm:gap-x-3 gap-x-2 gap-y-2 basis-full"}>
                                <div className={"space-y-0.5"}>
                                    <Label htmlFor="firstName" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>First Name</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="First name"
                                        value={userDetails.firstName}
                                        name={'firstName'}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                        className={"bg-card"}
                                    />
                                    {
                                        formError.firstName &&
                                        <span className="text-destructive text-sm">{formError.firstName}</span>
                                    }

                                </div>
                                <div className={"space-y-0.5"}>
                                    <Label htmlFor="lastName" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Last Name</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Last name"
                                        value={userDetails.lastName}
                                        name={'lastName'}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                        className={"bg-card"}
                                    />
                                    {
                                        formError.lastName &&
                                        <span className="text-destructive text-sm">{formError.lastName}</span>
                                    }
                                </div>
                                <div className={"space-y-0.5"}>
                                    <Label htmlFor="email" className={"font-medium"}>Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={userDetails.email}
                                        name={'email'}
                                        className={"bg-card"}
                                        disabled
                                    />
                                </div>
                                <div className={"space-y-0.5"}>
                                    <Label htmlFor="password" className={"font-medium"}>Password</Label>
                                    <div className={'relative w-full'}>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={'************'}
                                            name={'password'}
                                            className={"bg-card"}
                                            disabled
                                        />
                                        <Button variant={"ghost"}
                                            className={"absolute right-[4px] top-[4px] h-8 font-normal"}
                                            onClick={() => setIsChangePassword(true)}
                                        >
                                            {(userDetails?.isGoogleConnect && !userDetails?.isPasswordCreated) ? "Set" : "Change"} Password
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className={"flex items-center p-4 sm:px-5 sm:py-4 justify-start"}>
                        <Button onClick={onUpdateUser} disabled={isLoading}
                            className={`w-[111px] text-sm font-medium hover:bg-primary`}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
                    </CardFooter>
                </Card>

                <GoogleConnect
                    userDetails={userDetails}
                    setUserDetails={setUserDetails}
                />

                <TwoFactorAuthentication
                    enabled={is2FAEnabled}
                    onToggle={handle2FAToggle}
                    isLoading={is2FALoading}
                    userDetails={userDetailsReducer}
                />

                <TwoFactorAuthenticationModal
                    open={is2FAModalOpen}
                    onClose={() => setIs2FAModalOpen(false)}
                    onSave={handle2FAModalSave}
                    isLoading={is2FALoading}
                    userDetails={userDetailsReducer}
                    mode={twoFAMode}
                />

                <Card>
                    <CardHeader className={"gap-1 border-b p-4 sm:px-5 sm:py-4"}>
                        <CardTitle className={"text-base font-medium flex items-center gap-2"}>
                            <AlertTriangle className="w-5 h-5 text-base" />
                            <span className={"text-base font-medium"}>Danger Zone</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={"py-4 px-4 sm:px-5 sm:py-4"}>
                        <div className={"flex flex-col gap-4"}>
                            <div className={"space-y-1"}>
                                <CardDescription className={"text-sm"}>
                                    Deleting your account will permanently erase all your Quickhunt data, including all projects you own. This action cannot be undone.
                                </CardDescription>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className={"flex items-center p-4 sm:px-5 sm:py-4 justify-start"}>
                        <Button variant={"destructive"} className={`w-[134px] text-sm font-medium hover:bg-destructive`} onClick={() => setIsDeleteDialogOpen(true)}>
                            Delete Account
                        </Button>
                    </CardFooter>
                </Card>

                <DeleteAccountModal
                    isChangePassword={isDeleteDialogOpen}
                    setIsChangePassword={setIsDeleteDialogOpen}
                    userDetails={userDetails}
                    isDeleteLoading={isDeleteLoading}
                    deletePassword={deletePassword}
                    setDeletePassword={setDeletePassword}
                    deletePasswordVisible={deletePasswordVisible}
                    setDeletePasswordVisible={setDeletePasswordVisible}
                    onDeleteAccount={handleDeleteAccount}
                    isPasswordChange={false}
                />

            </div>
        </Fragment>
    );
};

export default Profile;