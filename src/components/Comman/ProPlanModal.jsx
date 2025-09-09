import React, { Fragment } from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { CircleChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../utils/constent";
import { DialogDescription } from '../ui/dialog';

const ProPlanModal = ({ isProModal, setIsProModal, setOpen }) => {
    const navigate = useNavigate();

    const onRedirect = () => {
        setIsProModal(false);
        navigate(`${baseUrl}/pricing`);
    };

    return (
        <Fragment>
            <Dialog open={isProModal} onOpenChange={() => setIsProModal(false)}>
                <DialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden">
                    <DialogDescription className="px-6 pt-4 text-gray-900">
                        <div className="flex flex-col md:flex-row gap-6 items-center text-left">
                            <div className="space-y-3 text-gray-800">
                                <div className="text-xl font-semibold text-primary pt-2">
                                    Upgrade your plan to build a stronger, smarter product.
                                </div>
                                <p className="text-gray-700 pt-2 pb-4">
                                    The feature you're trying to access isn't available on your current plan - or you've reached its limit.
                                </p>
                                <ul className="space-y-4 list-none">
                                    {[{
                                        text: "Higher limits on In-App Messages, Feedback Boards, and Help Articles",
                                        bold: ["Higher limits"],
                                    }, {
                                        text: "Customer Email Notifications to keep users engaged",
                                        bold: ["Customer Email Notifications"],
                                    }, {
                                        text: "Increased Project Limits to manage more products in one place",
                                        bold: ["Project Limits"],
                                    }, {
                                        text: "Access to advanced Integrations",
                                        bold: ["Integrations"],
                                    }, {
                                        text: "Invite more Team Members for seamless collaboration",
                                        bold: ["Team Members"],
                                    }, {
                                        text: "Gain visibility with detailed Analytics",
                                        bold: ["Analytics"],
                                    }, {
                                        text: "Access Powerful AI Features",
                                        bold: ["AI Features"],

                                    }].map(({ text, bold }, i) => {
                                        const parts = bold.length
                                            ? text.split(new RegExp(`(${bold.join("|")})`, "gi"))
                                            : [text];

                                        return (
                                            <li key={i} className="flex gap-2 items-start">
                                                <CircleChevronRight className="w-5 h-5 text-purple-600 mt-0.5" />
                                                <span>
                                                    {parts.map((part, index) =>
                                                        bold.includes(part) ? (
                                                            <strong key={index} className="font-medium">
                                                                {part}
                                                            </strong>
                                                        ) : (
                                                            <span key={index} className="font-medium text-gray-600">{part}</span>
                                                        )
                                                    )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <p className="text-md text-gray-500 py-5">
                                    Keep building, launching, and growing - without limits.
                                </p>
                            </div>
                            {/* <img src={UpgradePayment} className="w-40 h-40 md:w-48 md:h-48" alt="Upgrade illustration" /> */}
                        </div>
                    </DialogDescription>
                    <DialogFooter className=" px-4 py-2 border-t flex-nowrap flex-row gap-2 md:justify-between sm:justify-between items-center">
                        <div className="flex gap-2">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setIsProModal(false);
                                    if (typeof setOpen === "function") {
                                        setOpen(true);
                                    }

                                }}
                            >
                                Stay on Current Plan
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onRedirect}
                                className="text-primary"
                            >

                                Upgrade Now

                            </Button>
                        </div>
                        <div className="text-xs">
                            Need help? <a href="https://calendly.com/quickhunt/30min" target="_blank" className="text-primary hover:underline">Let’s talk.</a>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default ProPlanModal;
