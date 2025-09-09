import React, {Fragment} from 'react';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Loader2} from "lucide-react";

const DowngradeModal = ({isDownGradeModal, setIsDownGradeModal}) => {
    return (
        <Fragment>
            <Dialog open={isDownGradeModal}>
                <DialogContent className="sm:max-w-lg p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle>💡 Downgrading Your Plan?</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900"}>
                        <div className="grid gap-4 py-4">
                            <h3 className={"text-md font-semibold"}>❌ Features you’ll lose:</h3>
                        </div>
                    </DialogDescription>
                    <DialogFooter className={"p-4 border-t flex-nowrap flex-row gap-2 sm:gap-0 justify-end"}>
                        <Button type="button" variant={"secondary"}
                                onClick={() => {}} disabled={false}>
                            Cancel
                        </Button>
                        <Button type="submit" onClick={() => {}} disabled={false}>
                            {/*{loading === 'updateProfile' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}*/}
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default DowngradeModal;