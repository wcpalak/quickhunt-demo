import React, {Fragment, useState} from 'react';
import {Label} from "../../../ui/label";
import {Button} from "../../../ui/button";
import {apiService, getLSUserDetails, getTokenVerify,} from "../../../../utils/constent";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "../../../ui/select";
import {useSelector} from "react-redux";
import {Loader2} from "lucide-react";
import {Progress} from "@/components/ui/progress.jsx";

const create = [
    {name: "Collect Feedback", value: "collectFeedback"},
    {name: "Build a Roadmap", value: "buildRoadmap"},
    {name: "Post Changelogs", value: "postChangelogs"},
    {name: "Send In-App Messages", value: "sendInAppMessages"},
    {name: "Build a Help Center", value: "buildHelpCenter"},
];

const knowAbout = [
    {name: "Blog article", value: "blogArticle"},
    {name: "Search engine", value: "searchEngine"},
    {name: "Facebook post", value: "facebookPost"},
    {name: "Recommendation from a friend or colleague", value: "recommendation"},
    {name: "YouTube video", value: "youTubeVideo"},
    {name: "Reddit discussion", value: "redditDiscussion"},
    {name: "LinkedIn post", value: "linkedInPost"},
    {name: "Twitter mention", value: "TwitterMention"},
    {name: "Product Hunt feature", value: "productHuntFeature"},
    {name: "Email newsletter", value: "emailNewsletter"},
    {name: "Other", value: "other"},
];

const Step2 = ({
                   setStep,
                   progress,
                   step,
                   selectedCreate,
                   setSelectedCreate,
                   selectedKnowAbout,
                   setSelectedKnowAbout
               }) => {
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const [isLoading, setIsLoading] = useState(false);
    const userDetail = getLSUserDetails() ||  userDetailsReducer ;

    const onNextStep = async () => {
        setIsLoading(true);
        const payload = {
            wantTo: selectedCreate,
            knowFrom: selectedKnowAbout,
        }
        const data = await apiService.onBoardingFlow(payload, {Authorization: `Bearer ${getTokenVerify()}`});
        setIsLoading(false);
        if (data.success) {
            setStep(3);
        }
    }

    const handleCreateChange = (value) => {
        const selectedItem = create.find(item => item.value === value);
        // setSelectedCreate(selectedItem ? selectedItem.name : '');
        setSelectedCreate(value);
    };

    const handleKnowAboutChange = (value) => {
        const selectedItem = knowAbout.find(item => item.value === value);
        // setSelectedKnowAbout(selectedItem ? selectedItem.name : '');
        setSelectedKnowAbout(value);
    };

    const onStep = (stepCount) => {
        setStep(stepCount)
    }

    return (
        <Fragment>
            <div className={"flex flex-col justify-center gap-6"}>
                <div>
                    <h2 className={"font-semibold text-3xl "}> Let’s Get to Know You</h2>
                    <p className={"text-base pt-3 "}>We’d love to learn more about you so we can tailor your Quickhunt experience!</p>
                </div>
                <div className={`space-y-3`}>
                    <div className={"space-y-2"}>
                        <Label className={"text-sm font-normal mb-2"}> <span
                            className={"font-semibold capitalize"}>{userDetail?.firstName} {" "}</span>
                            What will you build with Quickhunt?</Label>
                        {/*<Select value={create.find(item => item.name === selectedCreate)?.value || ''} onValueChange={handleCreateChange}>*/}
                        <Select value={selectedCreate} onValueChange={handleCreateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Ex. Collect Feedback">
                                    {create.find(item => item.value === selectedCreate)?.name}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {create.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className={"space-y-3"}>
                    <div className={"space-y-2"}>
                        <Label className={"text-sm font-normal mb-2"}>How did you get to know about Quickhunt?</Label>
                        {/*<Select value={knowAbout.find(item => item.name === selectedKnowAbout)?.value || ''} onValueChange={handleKnowAboutChange}>*/}
                        <Select value={selectedKnowAbout} onValueChange={handleKnowAboutChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Ex. Blog article">
                                    {knowAbout.find(item => item.value === selectedCreate)?.name}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {knowAbout.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <div className="flex flex-row items-center gap-3 w-full whitespace-nowrap">
                <Progress value={progress} className="h-2 bg-muted-foreground/20 flex-1" />
                <Label className="ml-2">Step {step}/3</Label>
            </div>
            <div className={"flex gap-2 justify-start"}>
                <Button variant={"outline hover:bg-none"}
                        className={"border border-primary text-primary font-semibold px-[29px]"}
                        onClick={() => onStep(1)}>Back</Button>
                <Button className={"font-semibold px-[29px] hover:bg-primary min-w-[116px]"}
                        onClick={() => onNextStep(3)} disabled={isLoading}>{isLoading ?
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ""}Continue</Button>
            </div>
        </Fragment>
    );
};

export default Step2;
