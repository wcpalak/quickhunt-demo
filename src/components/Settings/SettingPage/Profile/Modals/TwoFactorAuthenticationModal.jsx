import React, { Fragment, useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { toast } from '../../../../ui/use-toast';
import { isEmpty } from '../../../../../utils/constent';

const TwoFactorAuthenticationModal = ({ open, onClose, onSave, isLoading: externalLoading }) => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");

   
 useEffect(() => {
        if (open) {
            setPassword("");
            setFormError("");
            setShowPassword(false);
        }
    }, [open]);

    const handleSave = async () => {
        if (!password) {
            setFormError("Password is required.");
            toast("Password is required.");
            return;
        }
        if (onSave) {
            const result = await onSave(password);
            if (result === false) return; 
        }
        if (onClose) onClose();
    };


    return (
        <Fragment>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-lg p-0 gap-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle className={"text-md flex font-medium items-center gap-2"}>
                            <KeyRound className="w-5 h-5 text-base" />
                            2FA (Two-Factor Authentication)
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900"}>
                        <div className={"grid gap-5"}>
                            <div className="grid w-full place-items-start gap-1.5">
                                <Label htmlFor="currentPassword" className={"font-normal"}>Current Password</Label>
                                <div className={"relative w-full"}>
                                    <Input
                                        id="currentPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant={"ghost hover:none"}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className={"absolute top-0 right-0 h-10"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <Eye size={16} stroke={`black`} /> : <EyeOff size={16} stroke={`black`} />}
                                    </Button>
                                </div>
                                {formError && (
                                    <span className="text-destructive text-sm">{formError}</span>
                                )}
                            </div>
                        </div>
                    </DialogDescription>
                    <DialogFooter className="p-4 border-t flex-nowrap flex-row gap-2 md:justify-start sm:justify-start">
                        <Button variant="outline" onClick={onClose} disabled={externalLoading}>Cancel</Button>
                        <Button onClick={handleSave} disabled={externalLoading || isEmpty(password)} className="min-w-16 bg-primary hover:bg-primary">
                            {externalLoading ? (
                                <span className="flex items-center gap-1"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Save</span>
                            ) : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default TwoFactorAuthenticationModal;
