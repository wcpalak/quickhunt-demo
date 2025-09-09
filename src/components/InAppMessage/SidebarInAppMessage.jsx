import React, { Fragment, useEffect, useState } from 'react';
import { Label } from "../ui/label";
import { Select, SelectGroup, SelectValue } from "@radix-ui/react-select";
import { SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import ColorInput from "../Comman/ColorPicker";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CalendarIcon, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import dayjs from "dayjs";
import { Calendar } from "../ui/calendar";
import { useSelector } from "react-redux";
import { baseUrl, isColorDark, WIDGET_DOMAIN } from "../../utils/constent";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "../ui/checkbox";
import PlanBadge from "../Comman/PlanBadge";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import CopyCode from '../Comman/CopyCode';
import partyPopper from "../../assets/PartyPopper.png";

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

const SidebarInAppMessage = ({
    type,
    inAppMsgSetting,
    setInAppMsgSetting,
    id,
    selectedStepIndex,
    formValidate,
    selectedStep,
    setSelectedStep,
    handleMessage, saving,
    formError, setFormError
}) => {
    const navigate = useNavigate();
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const date = [new Date(), addDays(new Date(), 4)];
    const [openCopyCode, setOpenCopyCode] = useState(false);
    const [selectedId, setSelectedId] = useState("");

    const handleInputChange = (e, callback) => {
        const value = e.target.value.trimStart();
        if (value.trim() !== '' || value === '') {
            callback(value);
        }
    };

    const onChange = (name, value) => {
        const update = { ...inAppMsgSetting, [name]: value };

        if (name === "bgColor" && type === '2') {
            const isDark = isColorDark(value);
            update.textColor = isDark ? "#ffffff" : "#000000";
            update.btnColor = isDark ? "#ffffff" : "#000000";
        }

        if (name === "showSender" && value === false) {
            update.from = null;
        }
        setInAppMsgSetting(update);
        setFormError(prev => ({
            ...prev,
            [name]: formValidate(name, value)
        }));
    };

    const onChangeAddOption = (index, value) => {
        if (value === '' || value.trim() !== '') {
            const clone = [...selectedStep.options];
            clone[index] = { ...clone[index], title: value };
            const obj = { ...selectedStep, options: clone };
            setSelectedStep(obj);
            updateStepRecord(obj);
        }
    };

    const addOption = () => {
        const clone = [...selectedStep.options];
        clone.push({ id: "", title: "" })
        const obj = { ...selectedStep, options: clone, }
        setSelectedStep(obj);
        updateStepRecord(obj)
    };

    const removeOption = (index) => {
        const clone = [...selectedStep.options];
        clone.splice(index, 1)
        const obj = { ...selectedStep, options: clone, }
        setSelectedStep(obj);
        updateStepRecord(obj)
    };

    const handleTimeChange = (time, type) => {
        if (!time || !inAppMsgSetting[type]) {
            return;
        }

        const currentDateTime = dayjs(inAppMsgSetting[type]);
        const [hours, minutes] = time.split(':').map(Number);

        // Create new datetime with updated time
        const newDateTime = currentDateTime
            .hour(hours)
            .minute(minutes)
            .second(0)
            .millisecond(0);

        const now = dayjs();
        const isFutureDateTime = newDateTime.isAfter(now);

        let updatedSetting = {
            ...inAppMsgSetting,
            [type]: newDateTime.toISOString(),
        };

        if (type === "startAt") {
            updatedSetting = {
                ...updatedSetting,
                status: isFutureDateTime ? 2 : 1
            };
        }

        setInAppMsgSetting(updatedSetting);
        setFormError(formError => ({
            ...formError,
            [type]: formValidate(type, newDateTime.toISOString())
        }));
    };

    const handleDateChange = (date, type) => {
        if (!date) {
            const updatedSetting = {
                ...inAppMsgSetting,
                [type]: null
            };
            setInAppMsgSetting(updatedSetting);
            setFormError(formError => ({
                ...formError,
                [type]: formValidate(type, null)
            }));
            return;
        }

        const newDateTime = dayjs(date);
        const now = dayjs();
        const isFutureDateTime = newDateTime.isAfter(now);

        let updatedSetting = {
            ...inAppMsgSetting,
            [type]: newDateTime.toISOString(),
        };

        if (type === "startAt") {
            updatedSetting = {
                ...updatedSetting,
                status: isFutureDateTime ? 2 : 1
            };
        }

        setInAppMsgSetting(updatedSetting);
        setFormError(formError => ({
            ...formError,
            [type]: formValidate(type, newDateTime.toISOString())
        }));
    };

    const updateStepRecord = (record) => {
        let clone = [...inAppMsgSetting.steps];
        clone[selectedStepIndex] = record;
        setInAppMsgSetting(prevState => ({
            ...prevState,
            steps: clone
        }));
    }

    const onChangeQuestion = (name, value) => {
        const trimmedValue = name === "endLabel" || name === "startLabel" ? value.trimStart() : value;
        setInAppMsgSetting((prev) => {
            const updatedSteps = [...prev.steps];
            updatedSteps[selectedStepIndex] = {
                ...updatedSteps[selectedStepIndex],
                [name]: trimmedValue,
            };
            return {
                ...prev,
                steps: updatedSteps,
            };
        });
        setFormError(prev => {
            const newErrors = { ...prev };
            delete newErrors[`step_${selectedStep.stepId}_${name}`];
            return newErrors;
        });
        if (name === "startNumber" || name === "endNumber") {
            const currentStep = inAppMsgSetting.steps[selectedStepIndex];
            const startNum = name === "startNumber" ? trimmedValue : currentStep.startNumber;
            const endNum = name === "endNumber" ? trimmedValue : currentStep.endNumber;
            if (startNum && endNum) {
                setFormError(prev => ({
                    ...prev,
                    [`step_${selectedStep.stepId}_endNumber`]: formValidate(
                        "endNumber",
                        endNum,
                        { startNumber: startNum }
                    )
                }));
            }
        }
    };

    const onChangeChecklist = (name, value) => {
        const obj = { ...selectedStep, [name]: value, }
        setSelectedStep(obj);
        let clone = [...inAppMsgSetting.checklists];
        clone[selectedStepIndex] = obj;
        setInAppMsgSetting(prevState => ({
            ...prevState,
            checklists: clone
        }));
    }

    const handleCancel = () => {
        setInAppMsgSetting(inAppMsgSetting);
        if (id === "new") {
            navigate(`${baseUrl}/app-message/type`)
        } else {
            navigate(`${baseUrl}/app-message`)
        }
    }

    const publishDate = inAppMsgSetting?.startAt ? new Date(inAppMsgSetting?.startAt) : null;
    const isDateDisabled = (date) => {
        return publishDate && date < publishDate;
    };

    useEffect(() => {
        const isDark = isColorDark(inAppMsgSetting.bgColor);
        if (isDark !== isColorDark(inAppMsgSetting.textColor) && type === '2') {
            setInAppMsgSetting(prev => ({
                ...prev,
                textColor: isDark ? "#ffffff" : "#000000",
                btnColor: isDark ? "#ffffff" : "#000000",
            }));
        }
    }, [inAppMsgSetting.bgColor]);

    const getCodeCopy = (uuid) => {
        setSelectedId(uuid);
        setOpenCopyCode(true);
    };

    const handleCopyCode = (codeString) => {
        navigator.clipboard.writeText(codeString).then(() => {
            toast({ description: "Copied to clipboard" })
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const codeString = `
<script>
    window.quickhuntSettings = {
        name: "", // The name of the logged-in user or visitor
        email: "", // The user's email address for personalization or targeting
        uniqueId: "", // A unique identifier for the user (e.g., user ID or email). This must be unique per user.
   };
</script>
<script>
    window.Quickhunt_In_App_Message_Config = window.Quickhunt_In_App_Message_Config || [];
    window.Quickhunt_In_App_Message_Config.push({ Quickhunt_In_App_Message_Key: 
     "${selectedId}"});
</script>
<script src="${WIDGET_DOMAIN}/widgetScript.js"></script>`;

    const typeNames = {
        1: "Post",
        2: "Banner",
        3: "Survey",
        4: "Checklist"
    };

    return (
        <Fragment>
            {openCopyCode &&
                <CopyCode
                    open={openCopyCode}
                    title={<div className={"flex items-center gap-2"}><img className={"w-[20px] h-[20px]"} src={partyPopper} alt={"partyPopper"} /> {`Your ${typeNames[inAppMsgSetting?.type] || 'Message'} is Live!`}</div>}
                    description={"Let's set up the message in your project"}
                    onClick={() => setOpenCopyCode(false)}
                    onOpenChange={setOpenCopyCode}
                    codeString={codeString}
                    handleCopyCode={() => handleCopyCode(codeString)}
                    isCancelBtn={false}
                />
            }
            <div className={"border-b"}>
                <div className='border-b px-4 py-3 flex gap-2 justify-between items-center'>
                    <h5 className={"text-base font-medium"}>Content</h5>
                    {/* {id !== "new" && inAppMsgSetting?.status !== 3 && (
                        <Button
                            className="py-[6px] px-3 h-auto text-xs font-medium hover:bg-primary"
                            onClick={() => getCodeCopy(inAppMsgSetting?.uuid)}
                        >
                            <Copy size={14} className='mr-1' />
                            Get code
                        </Button>
                    )} */}
                </div>
                <div className={"px-4 py-3 space-y-4"}>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="title" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                        <Input className={"h-9"} id="title" placeholder="Title" value={inAppMsgSetting.title}
                            onChange={(e) => handleInputChange(e, (value) => onChange("title", value))}
                        />
                        {formError.title && <span className="text-red-500 text-sm">{formError.title}</span>}
                    </div>

                    <div className={'space-y-0.5'}>
                        <Label className={"font-medium"}>In-app Message Layout</Label>
                        <Select value={inAppMsgSetting.viewType}
                            onValueChange={(value) => onChange("viewType", value)}
                        >
                            <SelectTrigger><SelectValue placeholder={'Select Layout'} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={1}>ShadCN UI</SelectItem>
                                <SelectItem value={2}>Polaris UI</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <div className="flex items-center gap-2">
                            <Checkbox id="showSender" disabled={projectDetailsReducer.plan === 0}
                                checked={inAppMsgSetting.showSender}
                                onCheckedChange={(checked) => onChange("showSender", checked)}
                            />
                            <Label htmlFor="showSender" className={"font-medium cursor-pointer peer-disabled:opacity-100"}>Show Sender {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                        </div>
                    </div>

                    {
                        inAppMsgSetting.showSender &&
                        <div className="grid w-full items-center gap-1.5">
                            <Label className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>From {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                            <Select
                                value={Number(inAppMsgSetting.from)}
                                name={"from"} disabled={projectDetailsReducer.plan === 0}
                                onValueChange={(value) => onChange("from", value)}
                            >
                                <SelectTrigger className="w-full h-9">
                                    {inAppMsgSetting.from ? (
                                        <SelectValue>
                                            {allStatusAndTypes.members.find((x) => Number(x.userId) === Number(inAppMsgSetting.from))?.firstName}{" "}
                                            {allStatusAndTypes.members.find((x) => Number(x.userId) === Number(inAppMsgSetting.from))?.lastName}
                                        </SelectValue>
                                    ) : (<span className="text-muted-foreground">Select a sender</span>)}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {allStatusAndTypes.members.map((x) => (
                                            <SelectItem key={Number(x.userId)} value={Number(x.userId)}>{x.firstName} {x.lastName}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            {(inAppMsgSetting.showSender && formError?.from) && (<p className="text-red-500 text-sm">{formError.from}</p>)}
                        </div>
                    }
                    {
                        type === "1" &&
                        <Fragment>
                            <div className="grid w-full items-center gap-1.5">
                                <Label className={"font-medium"}>Reply Type</Label>
                                <Select onValueChange={(value) => onChange("replyType", value)} value={inAppMsgSetting.replyType}>
                                    <SelectTrigger><SelectValue placeholder={"Select reply type"} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={1}>Text</SelectItem>
                                        <SelectItem value={2}>Reaction</SelectItem>
                                        <SelectItem value={null}>None</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Fragment>
                    }
                    {
                        type === "2" &&
                        <div className="grid w-full items-center gap-1.5">
                            <Label className={"font-medium"}>Action</Label>
                            <Select value={Number(inAppMsgSetting?.actionType)} onValueChange={(value) => onChange("actionType", value)}>
                                <SelectTrigger className="w-full h-9"><SelectValue placeholder="" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={0}>None</SelectItem>
                                    <SelectItem value={1}>Open URL</SelectItem>
                                    <SelectItem value={2}>Ask for Reaction</SelectItem>
                                    <SelectItem value={3}>Collect visitor email</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                    {
                        type === "4" &&
                        <Fragment>
                            <div className="grid w-full items-center gap-1.5">
                                <Label className={"font-medium"}>Action</Label>
                                <Select value={Number(selectedStep?.actionType)} onValueChange={(value) => onChangeChecklist("actionType", value)}>
                                    <SelectTrigger className="w-full h-9"><SelectValue placeholder="" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={0}>None</SelectItem>
                                        <SelectItem value={1}>Open URL</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>
                            {
                                selectedStep?.actionType === 1 &&
                                <Fragment>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="actionText" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Action Text</Label>
                                        <Input className={"h-9"} id="actionText" placeholder="Enter action text" value={selectedStep?.actionText}
                                            onChange={(e) => {
                                                onChangeChecklist("actionText", e.target.value);
                                                setFormError(prev => ({
                                                    ...prev,
                                                    [`checklist_${selectedStep.checklistId}_actionText`]: formValidate("actionText", e.target.value, { actionType: selectedStep.actionType })
                                                }));
                                            }} />
                                        {formError[`checklist_${selectedStep.checklistId}_actionText`] && (
                                            <p className="text-red-500 text-sm">{formError[`checklist_${selectedStep.checklistId}_actionText`]}</p>
                                        )}
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="actionUrl" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Action URL</Label>
                                        <Input className={"h-9"} id="actionUrl" placeholder="Enter URL address" value={selectedStep?.actionUrl}
                                            onChange={(e) => {
                                                const value = e.target.value.trimStart();
                                                onChangeChecklist("actionUrl", value)
                                                setFormError(prev => ({
                                                    ...prev,
                                                    [`checklist_${selectedStep.checklistId}_actionUrl`]: formValidate("actionUrl", value, { actionType: selectedStep.actionType })
                                                }));
                                            }} />
                                        {formError[`checklist_${selectedStep.checklistId}_actionUrl`] && (
                                            <p className="text-red-500 text-sm">{formError[`checklist_${selectedStep.checklistId}_actionUrl`]}</p>
                                        )}
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <Checkbox id="isRedirect"
                                                checked={selectedStep.isRedirect}
                                                onCheckedChange={(checked) => onChangeChecklist("isRedirect", checked)}
                                            />
                                            <Label htmlFor="isRedirect" className={"font-medium cursor-pointer"}>Open URL in a new tab</Label>
                                        </div>
                                    </div>
                                </Fragment>
                            }
                        </Fragment>
                    }
                    {
                        (type === "2" && inAppMsgSetting.actionType == 1) && <Fragment>
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="actionText" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Action Text</Label>
                                <Input className={"h-9"} id="actionText" placeholder="Enter action text" value={inAppMsgSetting.actionText}
                                    onChange={(e) => handleInputChange(e, (value) => {
                                        onChange("actionText", value);
                                        setFormError(prev => ({
                                            ...prev,
                                            actionText: formValidate("actionText", value, { actionType: inAppMsgSetting.actionType })
                                        }));
                                    })}
                                />
                                {formError.actionText && (<p className="text-red-500 text-sm">{formError.actionText}</p>)}
                            </div>

                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="actionUrl" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Action URL</Label>
                                <Input className={"h-9"} id="actionUrl" placeholder="Enter URL address" value={inAppMsgSetting.actionUrl}
                                    onChange={(e) => {
                                        const value = e.target.value.trimStart();
                                        onChange("actionUrl", value);
                                        setFormError(prev => ({
                                            ...prev,
                                            actionUrl: formValidate("actionUrl", value, { actionType: inAppMsgSetting.actionType })
                                        }));
                                    }}

                                />
                                {formError?.actionUrl && (<p className="text-red-500 text-sm">{formError.actionUrl}</p>)}
                            </div>

                            <div className="grid w-full items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="isRedirect" checked={inAppMsgSetting.isRedirect}
                                        onCheckedChange={(checked) => onChange("isRedirect", checked)}
                                    />
                                    <Label htmlFor="isRedirect" className={"font-medium cursor-pointer"}>Open URL in a new tab</Label>
                                </div>
                            </div>
                        </Fragment>
                    }
                    {/*{*/}
                    {/*    type === "2" && (inAppMsgSetting.actionType == 2 || inAppMsgSetting.actionType == 3) &&*/}
                    {/*    <div className="grid w-full items-center gap-1.5">*/}
                    {/*        <div className="flex items-center gap-2">*/}
                    {/*            <Checkbox id="isBannerCloseButton"*/}
                    {/*                      checked={inAppMsgSetting.isBannerCloseButton}*/}
                    {/*                      onCheckedChange={(checked) => onChange("isBannerCloseButton", checked)}*/}
                    {/*            />*/}
                    {/*            <Label htmlFor="isBannerCloseButton" className={"font-medium cursor-pointer"}>Dismiss*/}
                    {/*                the banner on click</Label>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*}*/}
                </div>
            </div>

            {
                (selectedStep?.questionType !== 4 && selectedStep?.questionType !== 8) &&
                <Fragment>
                    {(inAppMsgSetting.viewType === 2 && selectedStep?.questionType === 3) ? null : type === "3" &&
                        <div className={"border-b px-4 py-6 space-y-4"}>
                            <h5 className={"text-base font-medium"}>Question Setting</h5>
                            {
                                selectedStep?.questionType === 5 &&
                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium text-sm after:ml-1 after:content-['*'] after:text-destructive"}>Answer Options</Label>
                                    <div>
                                        <div className={"space-y-[6px]"}>
                                            {(selectedStep?.options || []).map((option, index) => (
                                                <div key={index} className="relative mt-2">
                                                    <Input className="h-9 pr-10" placeholder={`Option ${index + 1}`} value={option.title}
                                                        onChange={(e) => onChangeAddOption(index, e.target.value)}
                                                    />
                                                    <Button variant="ghost hover:none" className="absolute top-0 right-0" onClick={() => removeOption(index)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={"flex justify-end mt-[6px]"}>
                                            <Button variant="outline" className="h-9" onClick={addOption}>
                                                <Plus size={16} className="mr-2" /> Add Option
                                            </Button>
                                        </div>
                                    </div>

                                </div>
                            }

                            {(selectedStep?.questionType === 5 || selectedStep?.questionType === 6 || selectedStep?.questionType === 7) && (
                                <div className="grid w-full items-center gap-1.5 mt-2">
                                    <Label className="font-medium text-sm" htmlFor="placeholderText">Placeholder Text</Label>
                                    <Input
                                        value={inAppMsgSetting?.steps[selectedStepIndex]?.placeholderText || ''}
                                        onChange={(e) => handleInputChange(e, (value) => onChangeQuestion("placeholderText", value, selectedStep?.questionType))}
                                        type="text"
                                        className="h-9"
                                        id="placeholderText"
                                        placeholder={`${selectedStep?.questionType === 5 ? "Select one..." : "Enter text..."}`}
                                    />
                                    {formError[`step_${selectedStep?.stepId || selectedStep?.step}_placeholderText`] && (
                                        <span className="text-red-500 text-sm">
                                            {formError[`step_${selectedStep?.stepId || selectedStep?.step}_placeholderText`]}
                                        </span>
                                    )}
                                </div>
                            )}

                            {(selectedStep?.questionType === 3) && (
                                <div className="grid w-full items-center gap-1.5 mt-2">
                                    <Label className="font-medium text-sm" htmlFor="ratingStarColor">Rating Color</Label>
                                    <div className={"w-full text-sm"}>
                                        <ColorInput name={"ratingStarColor"}
                                            value={inAppMsgSetting?.steps[selectedStepIndex]?.ratingStarColor || ''}
                                            onChange={(value) => onChangeQuestion("ratingStarColor", value, selectedStep?.questionType)}
                                        />
                                    </div>
                                </div>
                            )}

                            {
                                (selectedStep?.questionType === 1 || selectedStep?.questionType === 2) &&
                                <div className={"space-y-3"}>
                                    {
                                        selectedStep?.questionType === 2 &&
                                        <div>
                                            <div className={"flex gap-4"}>
                                                <div className="grid w-full gap-1.5">
                                                    <div className="w-full space-y-1.5">
                                                        <Label className={"font-medium text-sm"} htmlFor="startNumber">Start Number</Label>
                                                        <Input
                                                            value={inAppMsgSetting?.steps?.[selectedStepIndex]?.startNumber ?? ''}
                                                            name={"startNumber"}
                                                            type="number" id="startNumber" min={1}
                                                            onChange={(e) => onChangeQuestion("startNumber", e.target.value)}
                                                            placeholder="0" className={"h-8"} />
                                                    </div>
                                                    {formError[`step_${selectedStep.stepId}_startNumber`] && (
                                                        <span className="text-red-500 text-sm">{formError[`step_${selectedStep.stepId}_startNumber`]}</span>
                                                    )}
                                                </div>

                                                <div className="grid w-full gap-1.5">
                                                    <div className="w-full space-y-1.5">
                                                        <Label className={"font-medium text-sm"} htmlFor="endNumber">End Number</Label>
                                                        <Input
                                                            value={inAppMsgSetting?.steps?.[selectedStepIndex]?.endNumber ?? ''}
                                                            name={"endNumber"}
                                                            onChange={(e) => onChangeQuestion("endNumber", e.target.value)}
                                                            type="number" id="endNumber" min={1} max={10}
                                                            placeholder="10" className={"h-8"} />
                                                    </div>
                                                    {formError[`step_${selectedStep.stepId}_endNumber`] && (<span className="text-red-500 text-sm">{formError[`step_${selectedStep.stepId}_endNumber`]}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                    }

                                    <div className="grid w-full items-center gap-1.5">
                                        <Label className={"font-medium text-sm"} htmlFor="startLabel">Start Label</Label>
                                        <Input value={inAppMsgSetting?.steps?.[selectedStepIndex]?.startLabel || ''}
                                            onChange={(e) => onChangeQuestion("startLabel", e.target.value)}
                                            type="text"
                                            id="startLabel" placeholder="Very bad" className={"h-8"} />
                                        {formError[`step_${selectedStep?.stepId || selectedStep?.step}_startLabel`] && (
                                            <span className="text-red-500 text-sm">
                                                {formError[`step_${selectedStep?.stepId || selectedStep?.step}_startLabel`]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid w-full items-center gap-1.5">
                                        <Label className={"font-medium text-sm"} htmlFor="endLabel">End Label</Label>
                                        <Input value={inAppMsgSetting?.steps?.[selectedStepIndex]?.endLabel || ''}
                                            onChange={(e) => onChangeQuestion("endLabel", e.target.value)}
                                            type="text"
                                            id="endLabel" placeholder="Very good" className={"h-8"} />
                                        {formError[`step_${selectedStep?.stepId || selectedStep?.step}_endLabel`] && (
                                            <span className="text-red-500 text-sm">
                                                {formError[`step_${selectedStep?.stepId || selectedStep?.step}_endLabel`]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            }
                        </div>
                    }
                </Fragment>
            }

            {
                (inAppMsgSetting.viewType === 2 && type === "4") ? "" :
                    <div className={"border-b px-4 py-6 space-y-4"}>
                        <h5 className={"text-base font-medium"}>Style</h5>
                        {
                            (type === "1" || type === "3") ?
                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Width</Label>
                                    <Input value={inAppMsgSetting?.width || ''} type={'number'} min={350}
                                        onChange={(e) => onChange("width", e.target.value)}
                                        id="width" placeholder="Enter width" />
                                    {formError?.width && (<p className="text-red-500 text-sm">{formError.width}</p>)}
                                    <p className="text-xs font-normal text-muted-foreground">Min width (350px)</p>

                                </div> : ""
                        }

                        {
                            type === "2" && <Fragment>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium"}>Banner position</Label>
                                    <Select
                                        value={inAppMsgSetting.position}
                                        onValueChange={(value) => onChange("position", value,)}
                                    >
                                        <SelectTrigger className="w-full h-9">
                                            <SelectValue placeholder={"Select position"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={"top"}>Top</SelectItem>
                                            <SelectItem value={"bottom"}>Bottom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium"}>Content Alignment</Label>
                                    <Select
                                        value={inAppMsgSetting.alignment}
                                        onValueChange={(value) => onChange("alignment", value,)}
                                    >
                                        <SelectTrigger className="w-full h-9">
                                            <SelectValue placeholder={"Select alignment"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={"left"}>Left</SelectItem>
                                            <SelectItem value={"right"}>Right</SelectItem>
                                            <SelectItem value={"center"}>Center</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </Fragment>
                        }

                        {inAppMsgSetting.viewType === 1 && (inAppMsgSetting.replyType === 1 || inAppMsgSetting.replyType === 2) && (
                            <div className="grid w-full items-center gap-1.5">
                                <Label className={"font-medium"}>Background Color</Label>
                                <div className={"w-full text-sm"}>
                                    <ColorInput name={"bgColor"}
                                        value={inAppMsgSetting.bgColor}
                                        onChange={(value) => onChange("bgColor", value)}
                                    />
                                </div>
                            </div>
                        )}

                        {
                            inAppMsgSetting.viewType === 1 && (type === "4" || type === "3") &&
                            <div className="grid w-full items-center gap-1.5">
                                <Label className={"font-medium"}>Text Color</Label>
                                <div className={"w-full text-sm widget-color-picker space-y-2"}>
                                    <ColorInput name={"textColor"}
                                        value={inAppMsgSetting.textColor}
                                        onChange={(value) => onChange("textColor", value)}
                                    />
                                </div>
                            </div>
                        }

                        {
                            inAppMsgSetting.viewType === 1 && (type === "3" && (selectedStep?.questionType === 5 || selectedStep?.questionType === 6 || selectedStep?.questionType === 7)) &&
                            <div className="grid w-full items-center gap-1.5">
                                <Label className={"font-medium"}>Forward Button Color</Label>
                                <div className={"w-full text-sm widget-color-picker space-y-2"}>
                                    <ColorInput name={"forwardBtnBgColor"}
                                        value={inAppMsgSetting.forwardBtnBgColor}
                                        onChange={(value) => onChange("forwardBtnBgColor", value)}
                                    />
                                </div>
                            </div>
                        }

                        {
                            inAppMsgSetting.viewType === 1 && ((type === "1" && inAppMsgSetting?.replyType == 1) || (type === "4" && inAppMsgSetting?.checklists[selectedStepIndex]?.actionType == 1)) &&
                            <div className="grid w-full items-center gap-1.5">
                                <Label className={"font-medium"}>{type === "4" ? "Button Text Color" : "Text Color"}</Label>
                                <div className={"w-full text-sm widget-color-picker space-y-2"}>
                                    <ColorInput name={"btnTextColor"}
                                        value={type === "4" ? inAppMsgSetting.btnTextColor : inAppMsgSetting.textColor}
                                        onChange={(value) => onChange(type === "4" ? "btnTextColor" : "textColor", value)}
                                    />
                                </div>
                            </div>
                        }

                        {/*{(type === "1" && inAppMsgSetting.replyType === 1) &&*/}
                        {/*<div className="grid w-full items-center gap-1.5">*/}
                        {/*    <Label className={"font-medium "}>Icon Color </Label>*/}
                        {/*    <div className={"w-full text-sm widget-color-picker space-y-2"}>*/}
                        {/*        <ColorInput name={"iconColor"}*/}
                        {/*            value={inAppMsgSetting.iconColor}*/}
                        {/*            onChange={(value) => onChange("iconColor", value)}*/}
                        {/*        />*/}
                        {/*    </div>*/}
                        {/*</div>}*/}

                        {
                            inAppMsgSetting.viewType === 1 && ((type === "3" && inAppMsgSetting.isCloseButton) || (type === "4" && inAppMsgSetting?.checklists[selectedStepIndex]?.actionType == 1)) &&
                            <div className="grid w-full items-center gap-1.5">
                                <Label
                                    className={"font-medium"}>{type === "4" ? "Button Background Color" : "Close Button Color"} </Label>
                                <div className={"w-full text-sm widget-color-picker space-y-2"}>
                                    <ColorInput name={"btnColor"}
                                        value={inAppMsgSetting.btnColor}
                                        onChange={(value) => onChange("btnColor", value)}
                                    />
                                </div>
                            </div>
                        }
                    </div>
            }

            {
                type !== "1" &&
                <div className={"border-b px-4 py-6 space-y-4"}>
                    <h5 className={"text-base font-medium"}>Advanced</h5>
                    {
                        (type === "2" || type === "3" || type === "4") &&
                        <div className="grid w-full items-center gap-1.5">
                            <div className="flex items-center gap-2">
                                <Checkbox id="isCloseButton" checked={inAppMsgSetting.isCloseButton}
                                    onCheckedChange={(checked) => onChange("isCloseButton", checked)} />
                                <Label htmlFor="isCloseButton" className={"font-medium cursor-pointer"}>{type === "4" ? "Show Close Button" : "Show Dismiss Button"} </Label>
                            </div>
                        </div>
                    }

                    {
                        (type === "4") &&
                        <Fragment>
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="isTriggerIcon" className={"font-medium cursor-pointer"}>Trigger Type</Label>
                                <Select value={inAppMsgSetting.isTriggerIcon} onValueChange={(value) => onChange("isTriggerIcon", value)}>
                                    <SelectTrigger className="w-full h-9">
                                        <SelectValue defaultValue={true} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={true}>Icon</SelectItem>
                                        <SelectItem value={false}>Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {
                                inAppMsgSetting.isTriggerIcon === false &&
                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium text-sm after:ml-1 after:content-['*'] after:text-destructive"} htmlFor="triggerText">Trigger Text</Label>
                                    <Input value={inAppMsgSetting?.triggerText || ''}
                                        onChange={(e) => onChange("triggerText", e.target.value)}
                                        id="triggerText" placeholder="Enter trigger text" />
                                </div>
                            }

                            <div className="grid w-full items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="isShowProgress" checked={inAppMsgSetting.isShowProgress}
                                        onCheckedChange={(checked) => onChange("isShowProgress", checked)} />
                                    <Label htmlFor="isShowProgress" className={"font-medium cursor-pointer"}>Show Progress Bar</Label>
                                </div>
                            </div>

                            {
                                inAppMsgSetting.viewType === 1 && inAppMsgSetting.isShowProgress &&
                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium text-sm"} htmlFor="progressColor">Progress Bar Active Color</Label>
                                    <div className={"w-full text-sm widget-color-picker space-y-2"}>
                                        <ColorInput name={"progressColor"}
                                            value={inAppMsgSetting.progressColor}
                                            onChange={(value) => onChange("progressColor", value)}
                                        />
                                    </div>
                                </div>
                            }

                            {inAppMsgSetting.viewType === 1 && (
                                <div className="grid w-full items-center gap-1.5">
                                    <Label className={"font-medium text-sm"} htmlFor="activeColor">Active Color</Label>
                                    <div className={"w-full text-sm widget-color-picker space-y-2"}>
                                        <ColorInput name={"activeColor"}
                                            value={inAppMsgSetting.activeColor}
                                            onChange={(value) => onChange("activeColor", value)}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid w-full items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="isDismiss" checked={inAppMsgSetting.isDismiss}
                                        onCheckedChange={(checked) => onChange("isDismiss", checked)} />
                                    <Label htmlFor="isDismiss" className={"font-medium cursor-pointer"}>Show 'dismiss it' action</Label>
                                </div>
                            </div>
                        </Fragment>
                    }
                </div>
            }

            <div className={"border-b px-4 py-6 space-y-4"}>
                <h5 className={"text-base font-medium"}>Trigger Setting</h5>
                <div className="grid w-full items-center gap-1.5">
                    <Label className={"font-medium"}>Add Delay</Label>
                    <Select value={inAppMsgSetting.delay} onValueChange={(value) => onChange("delay", value,)}>
                        <SelectTrigger className="w-full h-9">
                            <SelectValue defaultValue={1} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={1}>1 sec</SelectItem>
                            <SelectItem value={2}>2 sec</SelectItem>
                            <SelectItem value={3}>3 sec</SelectItem>
                            <SelectItem value={4}>4 sec</SelectItem>
                            <SelectItem value={5}>5 sec</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label className={"font-medium"}>Start Sending {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                    <div className={"flex flex-col gap-4"}>
                        <div className={"flex gap-4 flex-wrap sm:flex-nowrap"}>
                            <div className={"flex flex-col w-full"}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="startAt"
                                            variant={"outline"} disabled={projectDetailsReducer.plan === 0}
                                            className={`h-9 justify-start hover:bg-card bg-card text-left font-normal ${!date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            <Fragment>
                                                {(id === 'new' && inAppMsgSetting?.startAt === '') ? 'Select date' : `${inAppMsgSetting?.startAt ? dayjs(inAppMsgSetting?.startAt).format('D MMM, YYYY') : "Select a date"}`}
                                            </Fragment>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            captionLayout="dropdown"
                                            selected={inAppMsgSetting?.startAt ? new Date(inAppMsgSetting?.startAt) : new Date()}
                                            onSelect={(date) => handleDateChange(date, "startAt")}
                                            startMonth={new Date(2024, 0)}
                                            endMonth={new Date(2050, 12)}
                                            defaultMonth={
                                                inAppMsgSetting?.startAt
                                                    ? new Date(inAppMsgSetting?.startAt)
                                                    : publishDate || new Date()
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className={"flex flex-col w-full"}>
                                <div className="custom-time-picker ">
                                    <Input
                                        className={"h-9"}
                                        type={"time"} disabled={projectDetailsReducer.plan === 0}
                                        value={dayjs(inAppMsgSetting.startAt).format("HH:mm")}
                                        onChange={(e) => handleTimeChange(e.target.value, 'startAt')}
                                    />
                                </div>
                            </div>
                            {inAppMsgSetting?.startAt && (
                                <div className={"flex flex-col w-full"}>
                                    <Button
                                        variant="outline"
                                        className=""
                                        disabled={projectDetailsReducer.plan === 0}
                                        onClick={() => {
                                            onChange("startAt", null);
                                            setFormError(prev => ({
                                                ...prev,
                                                startAt: formValidate("startAt", null)
                                            }));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label className={"font-medium"}>Stop Sending {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                    <div className={"flex flex-col gap-1"}>
                        <div className={"flex gap-4 flex-wrap sm:flex-nowrap"}>
                            <div className={"flex flex-col w-full"}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="endAt" disabled={projectDetailsReducer.plan === 0}
                                            variant={"outline"}
                                            className={`h-9 justify-start hover:bg-card bg-card text-left font-normal ${!date && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            <Fragment>
                                                {(id === 'new' && inAppMsgSetting?.endAt === '') ? 'Select date' : `${inAppMsgSetting?.endAt ? dayjs(inAppMsgSetting?.endAt).format('D MMM, YYYY') : "Select a date"}`}
                                            </Fragment>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            captionLayout="dropdown"
                                            selected={inAppMsgSetting?.endAt ? new Date(inAppMsgSetting?.endAt) : null}
                                            onSelect={(date) => handleDateChange(date, "endAt")}
                                            endMonth={new Date(2050, 12)}
                                            startMonth={publishDate || new Date()}
                                            disabled={isDateDisabled}
                                            defaultMonth={inAppMsgSetting?.endAt ? new Date(inAppMsgSetting?.endAt) : publishDate || new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className={"flex flex-col w-full"}>
                                <div className="custom-time-picker ">
                                    <Input
                                        className={"h-9"}
                                        type={"time"} disabled={projectDetailsReducer.plan === 0}
                                        value={dayjs(inAppMsgSetting.endAt).format("HH:mm")}
                                        onChange={(e) => handleTimeChange(e.target.value, 'endAt')}
                                    />
                                </div>
                            </div>
                            {inAppMsgSetting?.endAt && (
                                <div className={"flex flex-col w-full"}>
                                    <Button
                                        variant="outline"
                                        className=""
                                        disabled={projectDetailsReducer.plan === 0}
                                        onClick={() => {
                                            onChange("endAt", null);
                                            setFormError(prev => ({
                                                ...prev,
                                                endAt: formValidate("endAt", null)
                                            }));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={"px-4 py-6 flex justify-between gap-2"}>
                <Button
                    className={`w-[130px] font-medium hover:bg-primary`}
                    onClick={
                        id === "new"
                            ? () => handleMessage("create", "createdByTop")
                            : () => handleMessage("update", "updatedByTop")
                    }
                    disabled={saving === "createdByTop" || saving === "updatedByTop"}
                >
                    {saving === "createdByTop" || saving === "updatedByTop" ?
                        (<Loader2 size={16} className={"animate-spin"} />) :
                        (id === "new" ? "Create Message" : "Update Message")
                    }
                </Button>
                <Button variant={"ghost hover-none"} className={`font-medium border border-primary text-primary ${id !== "new" ? "hidden" : ""}`}
                    onClick={handleCancel}>Cancel</Button>
            </div>
        </Fragment>
    );
};

export default SidebarInAppMessage;