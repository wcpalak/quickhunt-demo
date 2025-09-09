import React, { Fragment, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "../../../../ui/use-toast";
import partyPopper from "../../../../../assets/PartyPopper.png";
import unlocked from "../../../../../assets/Unlocked.png";
import { apiService } from '../../../../../utils/constent';

const initialStatePass = {
    currentPassword: "",
    newPassword: "",
    passwordConfirmation: "",
};

const PasswordFactory = ({
    isChangePassword,
    setIsChangePassword,
    setUserDetails,
    userDetails
}) => {

    const [formError, setErrors] = useState(initialStatePass);
    const [passDetails, setPassDetails] = useState(initialStatePass);
    const [isLoader, setLoader] = useState(false);
    const [isShowNewPass, setIsShowNewPass] = useState(false);
    const [isShowOldPass, setIsShowOldPass] = useState(false);
    const [isShowCFNewPass, setIsShowCFNewPass] = useState(false);

    const formValidate = (name, value) => {
        switch (name) {
            case "currentPassword":
                if (!value.trim()) {
                    return "Password is required.";
                } else {
                    return "";
                }
            case "newPassword":
                if (!value.trim()) {
                    return "New password is required.";
                } else if (value.length < 8) {
                    return "New password must be at least 8 characters.";
                } else {
                    return "";
                }
            case "passwordConfirmation":
                if (value !== passDetails.newPassword) {
                    return "Confirm password doesn't match new password.";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onPassword = async (type) => {
        let errorData = {};
        const isGoogleNoPassword = userDetails?.isGoogleConnect && !userDetails?.isPasswordCreated;
        const fieldsToValidate = isGoogleNoPassword
            ? ["newPassword", "passwordConfirmation"]
            : Object.keys(passDetails);
        fieldsToValidate.forEach((x) => {
            let error = formValidate(x, passDetails[x]);
            if (error && error.length > 0) {
                errorData[x] = error;
            }
        });
        if (Object.keys(errorData).length > 0) {
            setErrors(errorData);
            return;
        }

        let formData = new FormData();
        if (type === 'Change') {
            formData.append('currentPassword', passDetails.currentPassword);
            formData.append('password', passDetails.newPassword);
            formData.append('passwordConfirmation', passDetails.passwordConfirmation);
        } else {
            formData.append('password', passDetails.newPassword);
        }
        setLoader(true);
        let response;
        if (type === 'Change') {
            response = await apiService.updateLoginUserDetails(formData);
        } else {
            response = await apiService.createPassword(formData);
        }
        if (response.success) {
            setLoader(false);
            setUserDetails({ ...response?.data });
            if (type === 'Change') {
                toast({ description: <div className={"flex items-center gap-2"}>{`Password Created! You’re All Set!`} <img className={"w-[20px] h-[20px]"} src={unlocked} alt={"unlocked"}/></div> });
            } else {
                toast({ description: <div className={"flex items-center gap-2"}>{`Password Created! You’re All Set!`} <img className={"w-[20px] h-[20px]"} src={partyPopper} alt={"partyPopper"}/></div>});
            }
            onCloseModal();
        } else {
            setLoader(false);
            toast({ description: response?.error?.message, variant: "destructive" });
        }
    }

    const onCloseModal = () => {
        setIsChangePassword(false)
        setPassDetails(initialStatePass)
        setErrors(initialStatePass)
    }

    const onChange = useCallback((e) => {
        const { name, value } = e.target;
        setPassDetails((prev) => ({ ...prev, [name]: value, }));
        setErrors(formError => ({ ...formError, [name]: '', }));
    }, [passDetails]);

    const onBlur = ((e) => {
        const { name, value } = e.target;
        setErrors(formError => ({
            ...formError,
            [name]: formValidate(name, value),
        }));
    },
        [passDetails, formError]
    );

    const isGoogleNoPassword = userDetails?.isGoogleConnect && !userDetails?.isPasswordCreated;

    return (
        <Fragment>
            <Dialog open={isChangePassword} onOpenChange={isLoader ? null : onCloseModal}>
                <DialogContent className="max-w-md p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>
                            {isGoogleNoPassword ? "Set Account Password" : "Change Account Password"}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900"}>
                        <div className={"grid gap-5"}>
                            {!isGoogleNoPassword && (
                                <div className="grid w-full place-items-start gap-1.5">
                                    <Label htmlFor="currentPassword" className={"font-normal"}>Current Password</Label>
                                    <div className={"relative w-full"}>
                                        <Input className={"pr-10"} type={isShowOldPass ? "text" : "password"} id="currentPassword"
                                            placeholder="Enter current password"
                                            value={passDetails.currentPassword} name={"currentPassword"}
                                            onChange={onChange} onBlur={onBlur} />
                                        <Button variant={"ghost hover:none"}
                                            onClick={() => setIsShowOldPass(!isShowOldPass)}
                                            className={"absolute top-0 right-0 h-10"}>
                                            {!isShowOldPass ? <EyeOff size={16} stroke={`black`} /> :
                                                <Eye size={16} stroke={`black`} />}
                                        </Button>
                                    </div>
                                    {formError.currentPassword &&
                                        <span className="text-destructive text-sm">{formError.currentPassword}</span>}
                                </div>
                            )}
                            <div className="grid w-full place-items-start gap-1.5">
                                <Label htmlFor="newPassword" className={"font-normal"}>New Password</Label>
                                <div className={"relative w-full"}>
                                    <Input className={"pr-10"} type={isShowNewPass ? "text" : "password"} id="newPassword"
                                        placeholder="Enter new password"
                                        value={passDetails.newPassword} name={"newPassword"}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                    />
                                    <Button variant={"ghost hover:none"}
                                        onClick={() => setIsShowNewPass(!isShowNewPass)}
                                        className={"absolute top-0 right-0 h-10"}>
                                        {!isShowNewPass ? <EyeOff size={16} stroke={`black`} /> :
                                            <Eye size={16} stroke={`black`} />}
                                    </Button>
                                </div>
                                {formError.newPassword &&
                                    <span className="text-destructive text-sm">{formError.newPassword}</span>}
                            </div>
                            <div className="grid w-full place-items-start gap-1.5">
                                <Label htmlFor="passwordConfirmation" className={"font-normal"}>Password Confirmation</Label>
                                <div className={"relative w-full"}>
                                    <Input className={"pr-10"} type={isShowCFNewPass ? "text" : "password"} id="passwordConfirmation"
                                        placeholder="Re-enter your password"
                                        value={passDetails.passwordConfirmation} name={"passwordConfirmation"}
                                        onChange={onChange} onBlur={onBlur} />
                                    <Button variant={"ghost hover:none"}
                                        onClick={() => setIsShowCFNewPass(!isShowCFNewPass)}
                                        className={"absolute top-0 right-0 h-10"}>
                                        {!isShowCFNewPass ? <EyeOff size={16} stroke={`black`} /> :
                                            <Eye size={16} stroke={`black`} />}
                                    </Button>
                                </div>
                                {formError.passwordConfirmation &&
                                    <span className="text-destructive text-sm">{formError.passwordConfirmation}</span>}
                            </div>
                        </div>
                    </DialogDescription>
                    <DialogFooter className={"p-4 border-t flex-nowrap flex-row gap-2 sm:gap-0 md:justify-start sm:justify-start"}>
                        <Button type="button" variant={"secondary"} onClick={isLoader ? null : onCloseModal}
                            disabled={isLoader}>
                            Cancel
                        </Button>
                        <Button type="submit"
                            onClick={() => onPassword(isGoogleNoPassword ? "Create" : "Change")}
                            disabled={isLoader}>
                            {isLoader && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isGoogleNoPassword ? "Set Password" : "Update Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default PasswordFactory;