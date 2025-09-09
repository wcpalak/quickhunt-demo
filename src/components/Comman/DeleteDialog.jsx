import React, {Fragment} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "../ui/dialog";
import {Button} from "../ui/button";
import {Loader2} from "lucide-react";

const DeleteDialog = ({
                          isOpen,
                          onOpenChange,
                          onDelete,
                          isDeleteLoading,
                          deleteRecord,
                          title = "",
                          description = "This action can't be undone.",
                          deleteText = 'Delete',
                          redBtn,
                          actionBtnPosition,
                      }) => {

    return (
        <Fragment>
            <Dialog open={isOpen} onOpenChange={isDeleteLoading ? null : onOpenChange}>
                <DialogContent className="sm:max-w-lg p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>{title}</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900"}>
                        {description}
                    </DialogDescription>
                    {/*<DialogFooter className={`p-4 border-t flex-nowrap flex-row gap-2 sm:gap-0 ${actionBtnPosition ? actionBtnPosition : "justify-end"}`}>*/}
                    <DialogFooter className={`p-4 border-t flex-nowrap flex-row gap-2 sm:gap-0 sm:justify-start`}>
                        {/*<Button type="button" variant={"secondary"} onClick={isDeleteLoading ? null : onOpenChange} disabled={isDeleteLoading}>*/}
                        <Button type="button" variant={"secondary"} onClick={() => !isDeleteLoading && onOpenChange(false)} disabled={isDeleteLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant={"destructive"} onClick={() => onDelete(deleteRecord)} disabled={isDeleteLoading} className={`min-w-16 ${redBtn}`}>
                            {isDeleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {deleteText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default DeleteDialog;