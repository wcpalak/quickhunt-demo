import React, { Fragment } from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { CircleChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { DialogDescription } from '../ui/dialog';
import {useSelector} from "react-redux";
import Party from "@/assets/PartyPopper.png";
import { useNavigate } from "react-router-dom";
import {baseUrl} from "../../utils/constent";
import { useTour } from "../Comman/TourProvider";

const WelcomeModal = ({open, onOpenChange}) => {
    let navigate = useNavigate();
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const userId = userDetailsReducer?.id;
    const { setTourStep } = useTour();

    const handleClose = () => {
        document.cookie = `welcomeModalShown_${userId}=true; path=/; max-age=2147483647`;
        navigate(`${baseUrl}/feedback`);
        onOpenChange(false);
    };

    const handleRedirectToMigration = () => {
        onOpenChange(false);
        localStorage.setItem(`hasVisitedMigration_${userId}`, 'true');
        navigate(`${baseUrl}/settings/import-export/import`);
        setTimeout(() => {
            const startTourOnClick = (event) => {
                // Check if the click is outside the main container
                const mainContainer = document.querySelector('main');
                
                if (!mainContainer || !mainContainer.contains(event.target)) {
                    // Click is outside main container - start the tour
                    setTourStep(0);
                    localStorage.removeItem(`hasVisitedMigration_${userId}`);
                    navigate(`${baseUrl}/feedback`);
                    document.removeEventListener('click', startTourOnClick);
                }
                // If click is inside main container, do nothing (don't start tour)
            };
            document.addEventListener('click', startTourOnClick);
        }, 500);
    };

    return (
        <Fragment>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent showCloseButton={false} className="max-w-[600px] p-0 gap-0 overflow-hidden">
                    <DialogDescription className="px-6 pt-4 text-gray-900">
                        <div className="flex flex-col md:flex-row gap-6 items-center text-left">
                            <div className="space-y-3 text-gray-800">
                                <div className="flex gap-1 items-center text-xl font-semibold text-primary pt-2">
                                    <img className={`w-[20px] h-[20px]`} src={Party}/>
                                    <span>Welcome to Quickhunt, {userDetailsReducer?.firstName}!</span>
                                </div>
                                <p className="text-[16px] text-gray-700 pt-2 pb-2">
                                    You’ve unlocked <strong className="font-medium text-primary">7 days</strong> of <strong className="font-medium text-primary">free Premium access</strong> — no limits, all features included.
                                </p>

                                    <div className="text-[16px] text-md text-card-foreground">
                                        Here’s what you can do with your Premium trial:
                                    </div>

                                    <ul className="space-y-4 list-none">
                                        {[{
                                            text: "Create up to 20 projects",
                                            bold: ["projects"],
                                        }, {
                                            text: "Invite up to 20 team members",
                                            bold: ["team members"],
                                        }, {
                                            text: "Build and embed custom widgets",
                                            bold: ["custom widgets"],
                                        }, {
                                            text: "Create and share help docs",
                                            bold: ["help docs"],
                                        }, {
                                            text: "Connect with all integrations",
                                            bold: ["all integrations"],
                                        }, {
                                            text: "Access advanced analytics",
                                            bold: ["advanced analytics"],
                                        },{
                                            text: "Remove Quickhunt branding for a clean, professional look",
                                            bold: ["Quickhunt branding"],
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

                                <p className="text-md text-card-foreground py-5">
                                    Explore all the premium features for the next 7 days for Free!
                                </p>
                            </div>
                        </div>
                    </DialogDescription>
                    <DialogFooter className=" px-4 py-2 border-t flex-nowrap flex-row gap-2 md:justify-between sm:justify-between items-center">
                        <div className="flex gap-2">
                            <Button
                                variant="default"
                                onClick={handleClose}
                            >
                                Get Started
                            </Button>
                        </div>
                        <div className="text-sm">
                            Migrate from another platform? <a href={`javascript:void(0)`} onClick={handleRedirectToMigration} className="text-primary hover:underline">Let’s migrate</a>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default WelcomeModal;
