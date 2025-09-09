import React, { Fragment, useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const DeleteAccountModal = ({
    isChangePassword,
    setIsChangePassword,
    userDetails,
    isDeleteLoading,
    deletePassword,
    setDeletePassword,
    deletePasswordVisible,
    setDeletePasswordVisible,
    onDeleteAccount,
    isPasswordChange = false,
}) => {
    const [isLoader, setIsLoader] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleClose = () => {
        if (!isLoader) {
            setIsChangePassword(false);
            setDeletePassword("");
            setDeletePasswordVisible(false);
            setIsSubmitted(false);
        }
    };
    const handleDelete = async () => {
        setIsSubmitted(true);
        if (!deletePassword && !isGoogleUser) return;
        setIsLoader(true);
        try {
            await onDeleteAccount();
        } catch (error) {
            toast({
                variant: "destructive", description: error?.message,
            });
        } finally {
            setIsLoader(false);
        }
    };
    const isGoogleUser = userDetails?.isGoogleConnect && userDetails?.loginType === 2;

    return (<Fragment>
        <Dialog open={isChangePassword} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className={"text-base font-medium flex items-center gap-2"}>

                        <AlertTriangle className="w-5 h-5 text-base" />
                        <span className={"text-base font-medium"}>Delete Account</span>

                    </DialogTitle>
                </DialogHeader>

                <DialogDescription className={"p-4 text-gray-900"}>
                    <div className="grid gap-1">
                        <div className="space-y-2">
                            <p>Are you sure you want to delete your account?</p>
                            <p className="pt-4 text-sm text-muted-foreground">
                                This action is irreversible. All your data — including projects, feedback, and
                                workspace content — will be permanently deleted and cannot be recovered. </p>
                        </div>


                        {!isGoogleUser && (<div className="mt-2">
                            <Label
                                htmlFor="password"
                                className="font-medium after:ml-1 after:content-['*'] after:text-destructive"
                            >
                                Password
                            </Label>
                            <div className="relative mt-1">
                                <Input
                                    id="password"
                                    type={deletePasswordVisible ? "text" : "password"}
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    disabled={isLoader || isDeleteLoading}
                                    className="bg-card pr-10"
                                />

                                <Button
                                    variant={"ghost hover:none"}
                                    type="button"
                                    className={"absolute top-0 right-0 h-full"}
                                    onClick={() => setDeletePasswordVisible((prev) => !prev)}
                                    tabIndex={-1}
                                >
                                    {deletePasswordVisible ? (<Eye className={"w-[16px] h-[16px]"} />) : (
                                        <EyeOff className={"w-[16px] h-[16px]"} />)}
                                </Button>
                            </div>
                        </div>)}

                        {!isGoogleUser && isSubmitted && !deletePassword && (
                            <div className="text-sm text-red-500">Password is required</div>)}
                    </div>
                </DialogDescription>

                <DialogFooter className="p-4 border-t flex-nowrap flex-row gap-2 md:justify-start sm:justify-start">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isLoader}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        onClick={handleDelete}
                        className={`min-w-16 ${isPasswordChange ? "bg-primary hover:bg-primary" : "bg-destructive hover:bg-destructive"}`}
                        disabled={isLoader}
                    >
                        {isLoader && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}
                        Yes, I want to delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Fragment>);
};

export default DeleteAccountModal;
