import React, {Fragment, useState} from 'react';
import {useSelector} from "react-redux";
import {Button} from "../ui/button";
import {Plus, Trash2, X} from "lucide-react";
import {Input} from "../ui/input";
import {Textarea} from "../ui/textarea";
import RatingStar from "../Comman/Star";
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger} from "../ui/dropdown-menu";
import {DropdownMenuGroup} from "@radix-ui/react-dropdown-menu";
import {Avatar, AvatarFallback, AvatarImage} from "../ui/avatar";
import {Popover, PopoverContent} from "../ui/popover";
import {PopoverTrigger} from "@radix-ui/react-popover";
import EmojiPicker from "emoji-picker-react";
import {DO_SPACES_ENDPOINT, hexToRGBA, isColorDark} from "../../utils/constent";
import Branding from "../Comman/Branding";
import {Icon} from "../../utils/Icon";
import {useToast} from "../ui/use-toast";
import CustomSelect from "./CustomSelect";

const Surveys = ({inAppMsgSetting, setInAppMsgSetting, selectedStepIndex, setSelectedStepIndex, setSelectedStep, selectedStep}) => {
    const {toast} = useToast();
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const userDetailsReducer = allStatusAndTypes.members.find((x) => x.userId == inAppMsgSetting.from);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [ratings, setRatings] = useState({});
    const isPolaris = inAppMsgSetting.viewType === 2;

    const renderNumber = (x) => {
        const numbers = [];
        for (let i = Number(x?.questionType === 1 ? "0" : x?.startNumber); i <= Number(x?.questionType === 1 ? "10" : x?.endNumber); i++) {
            numbers.push(i);
        }
        return numbers
    }

    const updateStepRecord = (record) => {
        let clone = [...inAppMsgSetting.steps];
        clone[selectedStepIndex] = record;
        setInAppMsgSetting(prevState => ({
            ...prevState,
            steps: clone
        }));
    }

    const onChangeQuestion = (name, value) => {
        const obj = {...selectedStep, [name]: value}
        setSelectedStep(obj);
        updateStepRecord(obj)
    }

    const reactionPost = [
        {
            "id": "",
            "emoji": "😣",
            "emojiUrl": "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/1f623.png",
        },
        {
            "id": "",
            "emoji": "😔",
            "emojiUrl": "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/1f614.png",
        },
        {
            "id": "",
            "emoji": "😑",
            "emojiUrl": "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/1f610.png",
        },
        {
            "id": "",
            "emoji": "🙂",
            "emojiUrl": "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/1f642.png",
        },
    ];

    const questionTypeOptions = [
        {label: "Net Promoter Score", value: 1, disabled: false},
        {label: "Numeric Scale", value: 2, disabled: false},
        {label: "Star Rating Scale", value: 3, disabled: false},
        {label: "Emoji Rating Scale", value: 4, disabled: false},
        {label: "Drop Down / List", value: 5, disabled: false},
        {label: "Short text entry", value: 6, disabled: false},
        {label: "Long text entry", value: 7, disabled: false},
        // {label: "Thank you", value: 8, disabled: inAppMsgSetting.steps?.filter((x) =>  x.questionType === 8).length > 0},
        {label: "Thank you", value: 8, disabled: inAppMsgSetting.steps?.some(x => x.questionType === 8)},
    ];

    const question = {
        1: "How likely are you to recommend us to family and friends?",
        2: "How satisfied are you with our product?",
        3: "How satisfied are you with our product?",
        4: "How satisfied are you with our product?",
        5: "Where are you located?",
        6: "What is your favorite feature in our product?",
        7: "What challenges did you face while using our product?",
        8: "Thanks for taking the survey!",
    }

    const handleSelectQuestionType = (value) => {
        let clone = [...inAppMsgSetting.steps];
        const nonType8Steps = clone.filter((x) => x.questionType !== 8);
        if (value !== 8 && nonType8Steps.length >= 10) {
            toast({
                variant: "destructive",
                description: "You can only add up to 10 steps.",
            });
            return;
        }
        let existingQuestionType8 = clone.find((x) => x.questionType === 8);
        if (existingQuestionType8) {
            clone = clone.filter((x) => x.questionType !== 8);
        }
        const nextStepNumber = clone.length > 0 ? Math.max(...clone.map((step) => step.step)) + 1 : 1;
        const stepBoj = {
            questionType: value,
            text: question[value],
            placeholderText: value == 5 ? "Select one..." : "Enter text...",
            startNumber: "1",
            endNumber: "5",
            startLabel: value == 2 ? "Not satisfied" : "Not likely",
            endLabel: value == 2 ? "Very satisfied" : "Very likely",
            isAnswerRequired: true,
            step: nextStepNumber,
            options: value == 5 ? [{ id: "", title: "" }] : [],
            reactions: value == 4 ? reactionPost : [],
            stepId: "",
            ratingStarColor: '#ffd700'
        };
        if (value !== 8) {
            clone.push(stepBoj);
        }
        if (existingQuestionType8 || value === 8) {
            const type8StepObj = existingQuestionType8 || {
                ...stepBoj,
                step: clone.length + 1,
            };
            type8StepObj.step = clone.length + 1;
            clone.push(type8StepObj);
        }
        setSelectedStep(stepBoj);
        const newStepIndex = clone.findIndex((x) => x.step === stepBoj.step);
        setSelectedStepIndex(newStepIndex);
        setInAppMsgSetting((prevState) => ({
            ...prevState,
            steps: clone
        }));
    };

    const onSelectStep = (stepBoj, i) => {
        setSelectedStep(stepBoj);
        setSelectedStepIndex(i);
    }

    const handleEmojiSelect = (event) => {
        const clone = [...selectedStep.reactions];
        if (clone.length >= 5) return;
        const obj = {
            // id: "",
            emoji: event.emoji,
            emojiUrl: event.imageUrl,
        }
        clone.push(obj)
        const objData = {...selectedStep,  reactions: clone}
        setSelectedStep(objData);
        updateStepRecord(objData)
    }

    const onDeleteReaction = (reaction, reactionIndex, stepIndex) => {
        setInAppMsgSetting(prevState => {
            const updatedSteps = [...prevState.steps];
            const step = { ...updatedSteps[stepIndex] };
            const updatedReactions = [...(step.reactions || [])];
            updatedReactions.splice(reactionIndex, 1);
            step.reactions = updatedReactions;
            updatedSteps[stepIndex] = step;
            return {
                ...prevState,
                steps: updatedSteps,
            };
        });
    };

    const onDeleteStep = (record, index) => {
        let clone = [...inAppMsgSetting.steps];
        const stepIndex = clone.findIndex(step =>
            record.stepId ? step.stepId === record.stepId : step === record
        );
        if (stepIndex !== -1) {
            clone.splice(stepIndex, 1);
        }

        let activeSteps = clone.filter(x => x.questionType !== 8);
        activeSteps = activeSteps.map((step, idx) => ({
            ...step,
            step: idx + 1,
        }));

        const questionType8Step = clone.find(x => x.questionType === 8);
        if (questionType8Step) {
            questionType8Step.step = activeSteps.length + 1;
            activeSteps.push(questionType8Step);
        }
        const updatedSteps = activeSteps;

        setInAppMsgSetting((prevState) => ({
            ...prevState,
            steps: updatedSteps,
        }));

        const activeStepsAfterDeletion = activeSteps.filter(x => x.questionType !== 8);
        if (activeStepsAfterDeletion.length === 0) {
            setSelectedStep(null);
            setSelectedStepIndex(-1);
            return;
        }
        const newSelectedIndex = index < activeStepsAfterDeletion.length ? index : activeStepsAfterDeletion.length - 1;
        setSelectedStep({ ...activeStepsAfterDeletion[newSelectedIndex] });
        setSelectedStepIndex(newSelectedIndex);
    };

    const forwardButton = (x, className = '') => {
        const isDark = isColorDark(inAppMsgSetting.forwardBtnBgColor);
        const iconColor =  isDark ? '#fff' : '#000';
        return (
            <button
                style={{backgroundColor: isPolaris ? '#000' : inAppMsgSetting.forwardBtnBgColor, color: isPolaris ? '#fff' : iconColor}}
                className={`flex h-10 items-center justify-center w-8 min-w-8 border rounded-r-md transition-all duration-200 ease-in-out ${className}`}
            >
                {Icon.forwardIcon}
            </button>
        );
    };

    return (
        <div className={"flex flex-col gap-4 py-8 px-[5px] md:px-0 bg-muted justify-start overflow-y-auto h-[calc(100%_-_94px)]"}>
            {
                inAppMsgSetting.steps.map((x, i) => {
                    return(
                        <div className={`flex sm:flex-nowrap flex-wrap items-center mx-auto gap-2 lg:gap-6 max-w-full`} key={i}>
                            <div className={"flex gap-1"}><span>Step</span> <span>{x.step}</span></div>

                            <div className={`w-full ${isPolaris ? `SC-Polaris-Box !p-0 ${selectedStepIndex === i ? "!border-solid" : ""}` : "rounded-[10px] shadow-md"}`}
                                 // style={{width:`${inAppMsgSetting?.width}px`,backgroundColor: selectedStep?.step === x.step ? inAppMsgSetting.bgColor : "#fff", color: selectedStep?.step === x.step ?inAppMsgSetting.textColor : "#000"}}
                                 style={{width:`${inAppMsgSetting?.width}px`,backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor, color: isPolaris ? '#000' : inAppMsgSetting.textColor, borderColor: selectedStepIndex === i ? "#00000066" : "transparent", borderWidth: selectedStepIndex === i ? "2px" : "0" }}
                            >
                                <div onClick={(e) => onSelectStep(x, i)} className={"relative p-5 cursor-pointer w-full"}>

                                    {projectDetailsReducer.plan === 0 ? null :
                                        (inAppMsgSetting.showSender && inAppMsgSetting.from) ?
                                            <div className={"flex gap-2 items-center flex-wrap pb-3 px-2"}>
                                                <Avatar className={"w-5 h-5 min-w-5"}>
                                                    <AvatarImage src={userDetailsReducer?.profileImage ? `${DO_SPACES_ENDPOINT}/${userDetailsReducer?.profileImage}` : null}
                                                                 alt={`${userDetailsReducer?.firstName}${userDetailsReducer?.lastName}`}/>
                                                    <AvatarFallback
                                                        className={`text-sm font-medium`} style={{color: isPolaris ? null : inAppMsgSetting.textColor}}>
                                                        {userDetailsReducer?.firstName?.substring(0, 1)?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={"flex flex-wrap gap-x-1"}>
                                                    <h5 className={"text-sm font-medium"}>{userDetailsReducer?.firstName} {userDetailsReducer?.lastName} {' '}
                                                        <span className={'text-muted-foreground font-normal'} style={{color: isPolaris ? '#00000080' : hexToRGBA(inAppMsgSetting.textColor, 0.5)}}>from</span></h5>
                                                    <h5 className={`text-sm font-medium`}> {projectDetailsReducer?.name}</h5>
                                                </div>
                                            </div>: ""
                                    }

                                    {inAppMsgSetting.isCloseButton ? <X size={16} stroke={isPolaris ? '#000' : inAppMsgSetting?.btnColor} className={"absolute top-2 right-2"}/> : ""}

                                    <div className={"flex gap-1 md:gap-3"}>
                                        <div className={`shrink w-full`}>
                                            {
                                                (selectedStep?.step === x.step) ? <Input
                                                    placeholder={x.questionType === 8 ? "Thank you message..." : "What's your question?"}
                                                    value={x?.text || ""}
                                                    onChange={(event) => onChangeQuestion("text", event.target.value)}
                                                    className={`w-full text-sm border-none rounded-none p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0 text-wrap text-center`}
                                                    style={{
                                                        backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor,
                                                        color: isPolaris ? null : inAppMsgSetting.textColor
                                                    }}
                                                /> : <span className={"text-wrap w-full inline-block text-sm text-center"}>{x.text ? x.text : (x.questionType === 8 ? "Thank you message..." : "What's your question?")}</span>
                                            }
                                            {
                                                x?.questionType === 1 && <Fragment>
                                                    <div className={"flex justify-center pt-4"}>
                                                        {
                                                            renderNumber(x).map(num => (
                                                                <Button key={num} variant={"outline"}
                                                                        style={{borderColor: isPolaris ? '#000' : hexToRGBA(inAppMsgSetting.textColor, 0.5)}}
                                                                        className={`w-full h-auto text-xs p-0 leading-[35px] rounded-none border-0 border-y first:rounded-tl-md first:rounded-bl-md last:rounded-tr-md last:rounded-br-md first:border-l border-r bg-transparent hover:text-gray hover:bg-transparent font-medium`}>{num}</Button>
                                                            ))
                                                        }
                                                    </div>
                                                    <div className={"mt-1"}>
                                                        <h5 className={"text-sm font-normal float-left"} style={{color: isPolaris ? '#000' : inAppMsgSetting.textColor}}>{x?.startLabel}</h5>
                                                        <h5 className={"text-sm font-normal float-right"} style={{color: isPolaris ? '#000' : inAppMsgSetting.textColor}}>{x?.endLabel}</h5>
                                                    </div>
                                                </Fragment>
                                            }
                                            {
                                                x?.questionType === 2 &&
                                                <Fragment>
                                                    <div className={'max-w-max m-auto pt-4'}>
                                                        <div
                                                            className={"flex justify-center flex-wrap gap-3"}>
                                                            {
                                                                renderNumber(x).map(num => (
                                                                    <Button key={num} variant={"outline"}
                                                                            style={{borderColor: isPolaris ? '#000' : hexToRGBA(inAppMsgSetting.textColor, 0.5)}}
                                                                            className={`w-8 h-8 p-0 text-sm font-medium rounded-md bg-transparent hover:bg-transparent hover:text-gray-`}>{num}</Button>
                                                                ))
                                                            }
                                                        </div>
                                                        <div className={"mt-1"}>
                                                            <h5 className={"text-sm font-normal float-left"} style={{color: isPolaris ? '#000' : inAppMsgSetting.textColor}}>{x?.startLabel}</h5>
                                                            <h5 className={"text-sm font-normal float-right"} style={{color: isPolaris ? '#000' : inAppMsgSetting.textColor}}>{x?.endLabel}</h5>
                                                        </div>
                                                    </div>
                                                </Fragment>
                                            }
                                            {
                                                x?.questionType === 3 &&
                                                <Fragment>
                                                    <div className={"flex gap-4 mt-4 justify-center"}>
                                                        {Array.from({ length: 1 }).map((_, groupIndex) => {
                                                            const currentRating = ratings[i] || { star: 0, hover: null };
                                                            return (
                                                                <div key={groupIndex} className="flex gap-4 mt-4 justify-center">
                                                                    {Array.from({ length: 5 }, (_, index) => (
                                                                        <RatingStar
                                                                            key={index}
                                                                            filled={index < (currentRating.hover ?? currentRating.star)}
                                                                            onClick={() => setRatings((prev) => ({ ...prev, [i]: {  ...currentRating,  star: index + 1, },}))}
                                                                            onMouseEnter={() => setRatings((prev) => ({...prev,[i]: {  ...currentRating, hover: index + 1,},}))}
                                                                            onMouseLeave={() => setRatings((prev) => ({...prev, [i]: { ...currentRating, hover: null,},}))}
                                                                            color={isPolaris ? "#000" : x?.ratingStarColor}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </Fragment>
                                            }
                                            {
                                                x?.questionType === 4 &&
                                                <Fragment>
                                                    <div className={"flex justify-center gap-5 mt-4 flex-wrap"}>
                                                        {
                                                            (x?.reactions || []).map((r, ind) => {
                                                                const activeReactionsCount = (x?.reactions || []).length;
                                                                return (
                                                                    <div className={"relative group hover:cursor-pointer"} key={ind}>
                                                                                <span
                                                                                    onClick={() => activeReactionsCount > 1 && onDeleteReaction(r, ind, i)}
                                                                                    className={`absolute hidden group-hover:inline-block py-0.5 leading-none right-[-11px] top-[-13px] border rounded shadow -top-1 text-[9px] font-bold tracking-wide px-0.5 text-background-accent bg-white ${activeReactionsCount <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <Trash2
                                                                                        size={16}
                                                                                        className={`${activeReactionsCount <= 1 ? 'stroke-gray-400' : ''} text-gray-900`}
                                                                                        disabled={activeReactionsCount <= 1}
                                                                                    />
                                                                                </span>
                                                                        <img key={ind} className={"h-6 w-6 cursor-pointer"} src={r.emojiUrl}/>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                        {
                                                            (x?.reactions || []).length < 5 &&
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant={"secondary"} className={"h-6 w-6 rounded-[100%] p-1"}><Plus size={16}/></Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-full p-0 border-none w-[310px]]">
                                                                <EmojiPicker height={350}
                                                                             autoFocusSearch={true} open={true} searchDisabled={false}
                                                                             onEmojiClick={handleEmojiSelect} skinTonesDisabled={true}/>
                                                            </PopoverContent>
                                                        </Popover>
                                                        }
                                                    </div>
                                                </Fragment>
                                            }
                                            {
                                                x?.questionType === 5 &&
                                                <Fragment>
                                                    <div className="mt-3 flex relative">
                                                        <CustomSelect
                                                            options={x?.options}
                                                            placeholder={x?.placeholderText}
                                                        />
                                                        {forwardButton(x, '')}
                                                    </div>
                                                </Fragment>
                                            }
                                            {
                                                x?.questionType === 6 &&
                                                <Fragment>
                                                    <div className="mt-3 flex">
                                                        <Input placeholder={x.placeholderText} value={""} readOnly className={'rounded-r-none'}/>
                                                        {forwardButton(x, '')}
                                                    </div>
                                                </Fragment>
                                            }
                                            {
                                                x?.questionType === 7 &&
                                                <Fragment>
                                                    <div className="mt-3 flex">
                                                        <Textarea placeholder={x.placeholderText} value={""} className={"bg-card rounded-r-none resize-none"} readOnly/>
                                                        {forwardButton(x,'h-[58px]')}
                                                    </div>
                                                </Fragment>
                                            }

                                        </div>
                                        <div>
                                            <Button variant={"outline"} className={`p-0 h-6 w-6 text-gray-900`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteStep(x, i)
                                                    }}>
                                                <Trash2 size={12}/>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <Branding className={'py-1 w-full rounded-br-[9px] rounded-bl-[9px] text-center'} isPolaris={isPolaris} />
                            </div>
                        </div>
                    )
                })
            }
            <div className={`flex justify-center mt-3`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className={"flex gap-[6px] font-semibold"}><Plus size={16} strokeWidth={3}/>Add Steps</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuGroup>
                            {questionTypeOptions.map(option => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    disabled={option.disabled}
                                    onCheckedChange={() => handleSelectQuestionType(option.value)}
                                >
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
export default Surveys;