import React, {Fragment} from 'react';
import {Button} from "../../../ui/button";
import {Progress} from "@/components/ui/progress.jsx";
import {Label} from "@/components/ui/label.jsx";
import {ArrowRight} from "lucide-react";
import wavingHand from "../../../../assets/WavingHand.png";

const Step1 = ({setStep ,progress ,step}) => {

    const onStep = (stepCount) => {
        setStep(stepCount)
    }

    return (
        <Fragment>
            <div className={"flex flex-col justify-center gap-4"}>
                <h1 className={"font-semibold text-[35px] flex items-center gap-2"}>
                    <img className={"w-[40px] h-[40px]"} src={wavingHand} alt={"wavingHand"} />
                    Welcome to Quickhunt!
                </h1>
                <div className={""}>
                    <h3 className="text-2xl font-semibold mb-2 text-[#6806E1]">
                        Start Your Journey
                    </h3>
                    <p className={"text-base font-normal"}>Collect feedback, share changelogs and roadmaps, and engage users with in-app messages—all with Quickhunt.</p>
                </div>
            </div>
            <div className="flex flex-row items-center gap-3 w-full whitespace-nowrap">
                <Progress value={progress} className="h-2 bg-muted-foreground/20 flex-1" />
                <Label className="ml-2">Step {step}/3</Label>
            </div>
            <div className="flex justify-start w-full">
                <Button
                    className="font-semibold px-[29px] hover:bg-primary flex items-center gap-2"
                    onClick={() => onStep(2)}
                >
                    Let’s Get Started
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

        </Fragment>
    );
};

export default Step1;