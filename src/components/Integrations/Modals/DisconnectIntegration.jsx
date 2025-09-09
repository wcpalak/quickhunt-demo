import React, {Fragment, useState} from 'react';
import {Loader2, Unplug} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.jsx";
import {Button} from "@/components/ui/button.jsx";
import {isEmpty} from "../../../utils/constent";

const DisconnectIntegration = ({allModal, onCloseAllModal, loading, onDisconnect, integrationExistsId, disconnectId}) => {

    const [step, setStep] = useState("confirm"); // "confirm" | "instructions"
    const [instructionsData, setInstructionsData] = useState(null);

    const titleOfIntegration = () => {
        const integrationTitles = {
            '6': {
                title: "Are you sure you want to disconnect Slack from this form?",
                description: "This will stop Slack notifications for this form, but the integration will remain active for other forms.",
            },
        };

        return integrationTitles[disconnectId?.toString()] || {
            title: "Disconnect Integration",
            description: "Are you sure you want to disconnect?",
        };
    };

    const handleDisconnect = async () => {
        await onDisconnect(
            integrationExistsId(disconnectId),
            disconnectId,
            (apiResponse) => {
                // if (apiResponse?.data) {
                //     setInstructionsData(apiResponse.data);
                // }
                // setStep("instructions");
                if (apiResponse?.data && apiResponse?.data?.nextSteps?.length) {
                    setInstructionsData(apiResponse.data);
                    setStep("instructions");
                } else {
                    onCloseAllModal(true);
                }
            }
        );
    };

    const handleInstructionsClose = () => {
        setStep("confirm");
        setInstructionsData(null);
        onCloseAllModal(true);
    };

    return (
        <Fragment>
            <Dialog
                open={allModal === 'disconnectModalOpen'}
                onOpenChange={loading == disconnectId ? null : onCloseAllModal}
            >
                <DialogContent className="sm:max-w-xl p-0 gap-0">
                    {step === "confirm" && (
                        <Fragment>
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle className="text-md flex gap-2 items-center">
                                    <Unplug size={17} className="mt-1" /> {titleOfIntegration().title}
                                </DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="p-4 text-gray-900 space-y-6">
                                {titleOfIntegration().description}
                            </DialogDescription>
                            <DialogFooter className="p-4 border-t flex-nowrap flex-row gap-2 sm:gap-0 justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={loading == disconnectId ? null : onCloseAllModal}
                                    disabled={loading == disconnectId}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    onClick={handleDisconnect}
                                    disabled={loading == disconnectId || isEmpty(disconnectId)}
                                >
                                    {loading == disconnectId && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Disconnect
                                </Button>
                            </DialogFooter>
                        </Fragment>
                    )}

                    {step === "instructions" && instructionsData && (
                        <Fragment>
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle className="text-md">Next Steps</DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="p-4 text-gray-900 space-y-6">
                                <p className="font-medium">Please follow these steps after disconnecting:</p>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                    {instructionsData.nextSteps?.map((step, idx) => (
                                        <li
                                            key={idx}
                                            className="break-words"
                                            dangerouslySetInnerHTML={{ __html: step }}
                                        />
                                    ))}
                                </ol>

                                {instructionsData.uninstallUrl && (
                                    <div className="mt-4">
                                        <a
                                            href={instructionsData.uninstallUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline"
                                        >
                                            Go to uninstall page
                                        </a>
                                    </div>
                                )}
                            </DialogDescription>
                            <DialogFooter className="p-4 border-t flex-nowrap flex-row justify-end">
                                <Button type="button" onClick={handleInstructionsClose}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </Fragment>
                    )}
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default DisconnectIntegration;