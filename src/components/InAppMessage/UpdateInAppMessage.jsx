import React, { useEffect, useState, Fragment, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";
import { BarChart, Loader2, Trash2, Settings, Copy } from "lucide-react";
import {
    apiService,
    baseUrl,
    isEditorContentEmpty,
    isEmpty,
    WIDGET_DOMAIN,
} from "../../utils/constent";
import { Card } from "../ui/card";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import Post from "./Post";
import Banners from "./Banners";
import Surveys from "./Surveys";
import Checklist from "./Checklist";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, } from "../ui/breadcrumb";
import SidebarInAppMessage from "./SidebarInAppMessage";
import { useToast } from "../ui/use-toast";
import { Skeleton } from "../ui/skeleton";
import DeleteDialog from "../Comman/DeleteDialog";
import CopyCode from "../Comman/CopyCode";
import InAppSettingsDialog from "./InAppConditionlLogicDialog";
import partyPopper from "../../assets/PartyPopper.png";
import { transformGroupForApi } from "./conditions/utils";

const initialState = {
    projectId: null,
    title: "In app message",
    type: 1,
    bodyText: null,
    from: null,
    replyTo: null,
    bgColor: "#EEE4FF",
    textColor: "#000000",
    iconColor: "#FD6B65",
    btnColor: "#7c3aed",
    btnTextColor: "#ffffff",
    delay: 1,
    startAt: dayjs().toISOString(),
    endAt: null,
    position: "top",
    alignment: "left",
    isCloseButton: false,
    replyType: 1,
    isOpen: 0,
    showSender: false,
    actionType: 0,
    actionText: null,
    actionUrl: null,
    isRedirect: false,
    isBannerCloseButton: false,
    bannerStyle: null,
    reactions: [],
    status: 1,
    steps: [],
    checklistTitle: null,
    checklistDescription: null,
    checklists: [],
    isDismiss: false,
    isTriggerIcon: true,
    triggerText: "Get Started",
    isShowProgress: true,
    progressColor: "#7C3AED",
    activeColor: "#7C3AED",
    width: 650,
    forwardBtnBgColor: `#DAC5FF`,
    viewType: 1,
};

const reactionPost = [
    {
        id: "",
        emoji: "👌",
        emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44c.png",
        isActive: true,
    },
    {
        id: "",
        emoji: "🙏",
        emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f64f.png",
        isActive: true,
    },
    {
        id: "",
        emoji: "👍",
        emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44d.png",
        isActive: true,
    },
    {
        id: "",
        emoji: "😀",
        emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f600.png",
        isActive: true,
    },
    // {
    //     id: "",
    //     emoji: "❤️",
    //     emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2764-fe0f.png",
    //     isActive: true,
    // },
];

const reactionBanner = [
    {
        id: "",
        emoji: "👍",
        emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44d.png",
        isActive: true,
    },
    {
        id: "",
        emoji: "👎",
        emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f44e.png",
        isActive: true,
    },
];

const stepBoj = {
    questionType: 1,
    text: "How likely are you to recommend us to family and friends?",
    placeholderText: "",
    startNumber: "1",
    endNumber: "5",
    startLabel: "Not likely",
    endLabel: "Very likely",
    isAnswerRequired: true,
    step: 1,
    options: [],
    reactions: [],
    stepId: "",
    ratingStarColor: '#ffd700'
};

const checkListObj = {
    title: "",
    description: '',
    actionType: 0,
    actionText: "Open",
    actionUrl: "",
    isRedirect: false,
    checklistId: "",
};

const initialStateError = {
    startAt: undefined,
    endAt: undefined,
    from: "",
    actionUrl: "",
    actionText: "",
    width: null
};

const UpdateInAppMessage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id, type } = useParams();
    const [searchParams] = useSearchParams();
    const getPageNo = searchParams.get("pageNo") || 1;
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const [inAppMsgSetting, setInAppMsgSetting] = useState(initialState);
    const [oldInAppMsgSetting, setOldInAppMsgSetting] = useState(initialState);
    const [selectedStepIndex, setSelectedStepIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStep, setSelectedStep] = useState(null);
    const [saving, setSaving] = useState("");
    const [formError, setFormError] = useState(initialStateError);
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [openCopyCode, setOpenCopyCode] = useState(false);
    const hasInitializedStep = useRef(false);
    const [openSettingsModal, setOpenSettingsModal] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);

    const statusMap = {
        1: {
            label: "Live",
            color: "text-foreground bg-[#C7F1C6] border border-[#69CC66]"
        },
        2: {
            label: "Scheduled",
            color: "text-foreground bg-blue-100 border border-blue-400"
        },
        3: {
            label: "Draft",
            color: "text-foreground bg-red-100 border border-red-400"
        },
        4: {
            label: "Paused",
            color: "text-foreground bg-yellow-100 border border-yellow-400"
        }
    };

    const renderContent = (type) => {
        switch (type) {
            case "1":
                return isLoading ? (
                    <Fragment>
                        {[...Array(14)].map((_, i) => {
                            return (
                                <div key={i} className={"px-2 py-[10px] md:px-3"}>
                                    <Skeleton className={"rounded-md w-full h-4"} />
                                </div>
                            );
                        })}
                    </Fragment>
                ) : (
                    <Post inAppMsgSetting={inAppMsgSetting} setInAppMsgSetting={setInAppMsgSetting} isLoading={isLoading} onImageUpload={(imageUrl) => { setUploadedImages(prev => [...prev, imageUrl]); }} />
                );
            case "2":
                return isLoading ? (
                    <Fragment>
                        {[...Array(14)].map((_, i) => {
                            return (
                                <div key={i} className={"px-2 py-[10px] md:px-3"}>
                                    <Skeleton className={"rounded-md w-full h-4"} />
                                </div>
                            );
                        })}
                    </Fragment>
                ) : (
                    <Banners inAppMsgSetting={inAppMsgSetting} setInAppMsgSetting={setInAppMsgSetting} isLoading={isLoading} />
                );
            case "3":
                return isLoading ? (
                    <Fragment>
                        {[...Array(14)].map((_, i) => {
                            return (
                                <div key={i} className={"px-2 py-[10px] md:px-3"}>
                                    <Skeleton className={"rounded-md w-full h-4"} />
                                </div>
                            );
                        })}
                    </Fragment>
                ) : (
                    <Surveys
                        inAppMsgSetting={inAppMsgSetting}
                        setInAppMsgSetting={setInAppMsgSetting}
                        isLoading={isLoading}
                        selectedStepIndex={selectedStepIndex}
                        setSelectedStepIndex={setSelectedStepIndex}
                        selectedStep={selectedStep}
                        setSelectedStep={setSelectedStep}
                    />
                );
            case "4":
                return isLoading ? (
                    <Fragment>
                        {[...Array(14)].map((_, i) => {
                            return (
                                <div key={i} className={"px-2 py-[10px] md:px-3"}>
                                    <Skeleton className={"rounded-md w-full h-4"} />
                                </div>
                            );
                        })}
                    </Fragment>
                ) : (
                    <Checklist
                        inAppMsgSetting={inAppMsgSetting}
                        setInAppMsgSetting={setInAppMsgSetting}
                        isLoading={isLoading}
                        selectedStepIndex={selectedStepIndex}
                        setSelectedStepIndex={setSelectedStepIndex}
                        selectedStep={selectedStep}
                        setSelectedStep={setSelectedStep}
                        onImageUpload={(imageUrl) => { setUploadedImages(prev => [...prev, imageUrl]); }}
                    />
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        if (id === "new") {
            setInAppMsgSetting((prevState) => ({
                ...prevState,
                title: `${type === "1" ? "Post" : type === "2" ? "Banner" : type === "3" ? "Survey" : "Checklist"} in app message`,
                reactions: type === "1" ? reactionPost : type === "2" ? reactionBanner : [],
                bodyText: type === "1" ? "" : type === "2" ? "Edit message" : null,
                bgColor: type === "1" ? "#FAFBEE" : "#EEE4FF",
                textColor: "#000000",
                steps: type === "3" ? [stepBoj] : [],
                checklists: type === "4" ? [checkListObj] : [],
                width: type === '1' ? 650 : 680,
            }));
            setSelectedStep(type === "3" ? stepBoj : type === "4" ? checkListObj : {});
        }
    }, []);

    useEffect(() => {
        if (id !== "new" && projectDetailsReducer.id) {
            getSingleInAppMessages();
        }
    }, [projectDetailsReducer.id, getPageNo, id]);

    const updateInAppMsgSetting = (newData) => {
        const incomingInAppCondition = newData.inAppCondition || {};
        const normalizedConditions = Array.isArray(incomingInAppCondition.conditions)
            ? incomingInAppCondition.conditions
            : Array.isArray(newData.conditions)
                ? newData.conditions
                : [];

        const normalizedIsConditionApply =
            typeof incomingInAppCondition.isConditionApply !== "undefined"
                ? incomingInAppCondition.isConditionApply
                : typeof newData.isConditionApply !== "undefined"
                    ? newData.isConditionApply
                    : (inAppMsgSetting?.inAppCondition?.isConditionApply ?? inAppMsgSetting?.isConditionApply ?? false);

        const inAppCondition = {
            ...incomingInAppCondition,
            isConditionApply: normalizedIsConditionApply,
            conditions: normalizedConditions,
        };

        const payload = {
            ...newData,
            isConditionApply: normalizedIsConditionApply,
            conditions: normalizedConditions,
            inAppCondition,
            bodyText: newData.bodyText,
            triggerText: newData.triggerText ? newData.triggerText : "Get Started",
            activeColor: newData.activeColor ? newData.activeColor : "#7C3AED",
            progressColor: newData.progressColor ? newData.progressColor : "#7C3AED",
            isShowProgress: newData.isShowProgress ? newData.isShowProgress : true,
            isTriggerIcon: newData.isTriggerIcon ? newData.isTriggerIcon : true,
            isDismiss: newData.isDismiss ? newData.isDismiss : false,
        };
        setInAppMsgSetting(payload);
    };

    const getSingleInAppMessages = async (showLoading = true) => {
        if (showLoading) {
            setIsLoading(true);
        }
        const data = await apiService.getSingleInAppMessage(id);
        setIsLoading(false);
        if (data.success) {
            const payload = {
                ...data.data.data,
                bodyText: data.data.data.bodyText,
                triggerText: data?.data?.data?.triggerText ? data?.data?.data?.triggerText : "Get Started",
                activeColor: data?.data?.data?.activeColor ? data?.data?.data?.activeColor : "#7C3AED",
                progressColor: data?.data?.data?.progressColor ? data?.data?.data?.progressColor : "#7C3AED",
            };
            setInAppMsgSetting((prev) => {
                const next = { ...prev, ...payload };
                const pending = prev?.pendingInAppCondition;
                const realId = payload?.id;
                if (pending && realId) {
                    const apiPayload = transformGroupForApi(
                        pending.group,
                        pending.isConditionApply,
                        realId,
                        true
                    );
                    (async () => {
                        try {
                            const res = await apiService.inAppmessageCondition(apiPayload);
                            if (res && res.success) {
                                setInAppMsgSetting((latest) => ({
                                    ...latest,
                                    inAppCondition: {
                                        isConditionApply: res.data.isConditionApply,
                                        conditions: res.data.conditions,
                                    },
                                    pendingInAppCondition: null,
                                }));
                            }
                        } catch (e) {
                            // ignore toast here; user isn't actively saving now
                        }
                    })();
                }
                return next;
            });
            setOldInAppMsgSetting(payload);
            setOriginalContent(payload.bodyText);
            if (!hasInitializedStep.current) {
                if (type === "3" && payload.steps?.length > 0) {
                    setSelectedStep(payload.steps[0]);
                    setSelectedStepIndex(0)
                } else if (type === "4" && payload.checklists?.length > 0) {
                    setSelectedStep(payload.checklists[0]);
                    setSelectedStepIndex(0)
                }
                hasInitializedStep.current = true;
            }
        }
    };

    const formValidate = (name, value, context = {}) => {
        const trimmedValue =
            typeof value === "string" ? value.trim() : String(value || "").trim();
        switch (name) {
            case "title":
                if (!trimmedValue) {
                    return "Title is required";
                } else if (trimmedValue.length > 255) {
                    return "Title must be 255 characters or less";
                } else {
                    return "";
                }
            case "from":
                if (context.showSender && !trimmedValue) {
                    return "Sender is required.";
                }
                return "";
            case "startAt":
                if (!trimmedValue) {
                    return "Start date is required.";
                }
                return "";
            case "width":
                if (type === "1" || type === "3") {
                    if (!trimmedValue) {
                        return "Width is required.";
                    }
                    const numericWidth = Number(trimmedValue);
                    if (isNaN(numericWidth)) {
                        return "Width must be a number.";
                    } else if (numericWidth < 350) {
                        return "Width must be at least 350px.";
                    } else {
                        return "";
                    }
                }
                return "";
            case "actionUrl":
                if (context.actionType === 1) {
                    if (isEmpty(trimmedValue)) {
                        return "Action URL is required.";
                    }
                    if (/\s/.test(trimmedValue)) {
                        return "Enter a valid URL without spaces.";
                    }
                    try {
                        const url = new URL(trimmedValue);
                        if (url.protocol !== "http:" && url.protocol !== "https:") {
                            return "URL must start with http:// or https://.";
                        }
                        if (url.hostname.endsWith('.')) {
                            return "URL must not end with a dot.";
                        }
                    } catch (e) {
                        return "Please enter a valid URL.";
                    }
                }
                return "";
            case "actionText":
                if (context.actionType === 1 && isEmpty(trimmedValue)) {
                    return "Action text is required.";
                } else if (trimmedValue.length > 50) {
                    return "Action text must be 50 characters or less";
                }
                return "";
            case "startLabel":
                if (typeof value === "string" && value.length > 30) {
                    return "Start label must be 30 characters or less";
                }
                return "";
            case "endLabel":
                if (typeof value === "string" && value.length > 30) {
                    return "End label must be 30 characters or less";
                }
                return "";
            case "startNumber":
                if (value === "" || value === null || value === undefined) {
                    return "Start number is required";
                }
                if (isNaN(value)) {
                    return "Start number must be a number";
                }
                if (Number(value) < 1 || Number(value) > 10) {
                    return "Start number must be between 1 and 10";
                }
                return "";
            case "endNumber":
                if (value === "" || value === null || value === undefined) {
                    return "End number is required";
                }
                if (isNaN(value)) {
                    return "End number must be a number";
                }
                if (Number(value) < 1 || Number(value) > 10) {
                    return "End number must be between 1 and 10";
                }
                if (
                    context.startNumber !== "" &&
                    context.startNumber !== null &&
                    context.startNumber !== undefined &&
                    !isNaN(context.startNumber) &&
                    Number(value) <= Number(context.startNumber)
                ) {
                    return "End number must be greater than start number";
                }
                return "";
            case "text":
                if (!trimmedValue) {
                    return "Question text is required";
                } else if (trimmedValue.length > 255) {
                    return "Question text must be 255 characters or less";
                } else {
                    return "";
                }
            case "placeholderText":
                if (typeof value === "string" && value.length > 30) {
                    return "Placeholder must be 30 characters or less";
                }
                return "";
            default:
                return "";
        }
    };


    const extractImageUrls = (content) => {
        if (!content) return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const images = doc.querySelectorAll('img');

        return Array.from(images).map(img => {
            const src = img.getAttribute('src');
            // Extract the path part from the URL
            const url = new URL(src);
            return url.pathname.replace(/^\/media\//, ''); // Adjust based on your URL structure
        }).filter(url => url !== null);
    };

    const handleMessage = async (typeFunc, load) => {
        let validationErrors = {};
        let hasNumberRangeError = false;
        let hasStartEndLabelError = false;
        let hasTitleLengthError = false;
        let hasPlaceholderError = false;
        let hasQuestionTextError = false;

        Object.keys(inAppMsgSetting).forEach((name) => {
            const context = {
                showSender: inAppMsgSetting.showSender,
                actionType: inAppMsgSetting.actionType,
            };
            const error = formValidate(name, inAppMsgSetting[name], context);
            if (error) {
                validationErrors[name] = error;
            }
        });

        if (type === '1') {
            if (isEditorContentEmpty(inAppMsgSetting?.bodyText)) {
                toast({ variant: "destructive", description: "Please write a message." });
                return;
            }
            if (inAppMsgSetting?.replyType === 2 && (!inAppMsgSetting.reactions || inAppMsgSetting.reactions.length === 0)) {
                toast({
                    variant: "destructive",
                    description: "Please add at least one reaction emoji."
                });
                return;
            }
        }

        if (type === "2") {
            if (isEmpty(inAppMsgSetting?.bodyText)) {
                toast({ variant: "destructive", description: "Please write a message." });
                return;
            }

            if (inAppMsgSetting?.actionType === 2 && (!inAppMsgSetting.reactions || inAppMsgSetting.reactions.length === 0)) {
                toast({
                    variant: "destructive",
                    description: "Please add at least one reaction emoji."
                });
                return;
            }

            if (inAppMsgSetting.actionType === 1) {
                const textError = formValidate("actionText", inAppMsgSetting.actionText, { actionType: inAppMsgSetting.actionType });
                if (textError) {
                    validationErrors.actionText = textError;
                }
                const urlError = formValidate("actionUrl", inAppMsgSetting.actionUrl, { actionType: inAppMsgSetting.actionType });
                if (urlError) {
                    validationErrors.actionUrl = urlError;
                }
            }
        }

        if (type === "3") {
            const activeSteps = inAppMsgSetting.steps.filter((x) => x.questionType !== 8);
            if (activeSteps.length <= 0) {
                toast({ variant: "destructive", description: "Add minimum 1 step" });
                return;
            }
            for (const step of activeSteps) {
                const titleError = formValidate("text", step.text);
                if (titleError) {
                    validationErrors[`step_${step.stepId || step.step}_text`] = titleError;
                    hasQuestionTextError = true;
                }
                if (step.questionType === 5 || step.questionType === 6 || step.questionType === 7) {
                    const placeholderError = formValidate("placeholderText", step.placeholderText);
                    if (placeholderError) {
                        validationErrors[`step_${step.stepId || step.step}_placeholderText`] = placeholderError;
                        hasPlaceholderError = true;
                    }
                }
                if (step.questionType === 1 || step.questionType === 2) {
                    const startLabelError = formValidate("startLabel", step.startLabel);
                    if (startLabelError) {
                        validationErrors[`step_${step.stepId || step.step}_startLabel`] = startLabelError;
                        hasStartEndLabelError = true;
                    }
                    const endLabelError = formValidate("endLabel", step.endLabel);
                    if (endLabelError) {
                        validationErrors[`step_${step.stepId || step.step}_endLabel`] = endLabelError;
                        hasStartEndLabelError = true;
                    }
                }
                if (step.questionType === 2) {
                    if (
                        step.startNumber === null ||
                        step.startNumber === undefined ||
                        step.startNumber === ""
                    ) {
                        validationErrors[`step_${step.stepId}_startNumber`] = "Start number is required";
                        hasNumberRangeError = true;
                    } else if (
                        isNaN(step.startNumber) ||
                        parseInt(step.startNumber) < 1 ||
                        parseInt(step.startNumber) > 10
                    ) {
                        validationErrors[`step_${step.stepId}_startNumber`] = "Start number must be between 1 and 10";
                        hasNumberRangeError = true;
                    }

                    if (
                        step.endNumber === null ||
                        step.endNumber === undefined ||
                        step.endNumber === ""
                    ) {
                        validationErrors[`step_${step.stepId}_endNumber`] = "End number is required";
                        hasNumberRangeError = true;
                    } else if (
                        isNaN(step.endNumber) ||
                        parseInt(step.endNumber) < 1 ||
                        parseInt(step.endNumber) > 10
                    ) {
                        validationErrors[`step_${step.stepId}_endNumber`] = "End number must be between 1 and 10";
                        hasNumberRangeError = true;
                    } else if (
                        step.startNumber !== null &&
                        step.startNumber !== undefined &&
                        step.startNumber !== "" &&
                        !isNaN(step.startNumber) &&
                        parseInt(step.endNumber) <= parseInt(step.startNumber)
                    ) {
                        validationErrors[`step_${step.stepId}_endNumber`] = "End number must be greater than start number";
                        hasNumberRangeError = true;
                    }
                }
                if (step.questionType === 5) {
                    if (!step.options || step.options.length === 0) {
                        toast({ variant: "destructive", description: "At least one option is required." });
                        return;
                    }
                    const hasEmptyTitle = step.options.some((opt) => !opt.title?.trim());
                    if (hasEmptyTitle) {
                        toast({ variant: "destructive", description: "Option cannot be empty in dropdown / list." });
                        return;
                    }
                    const hasTooLongTitle = step.options.some((opt) => opt.title?.trim().length > 100);
                    if (hasTooLongTitle) {
                        toast({
                            variant: "destructive",
                            description: "Option cannot exceed 100 characters in dropdown / list.",
                        });
                        return;
                    }
                }
                if (step.actionType === 1) {
                    const error = formValidate("actionUrl", step.actionUrl, { actionType: step.actionType });
                    if (error) {
                        validationErrors[`step_${step.stepId}_actionUrl`] = error;
                    }
                }
            }

            if (hasQuestionTextError || hasPlaceholderError || hasNumberRangeError || hasStartEndLabelError) {
                Object.entries(validationErrors).forEach(([key, error], index) => {
                    if (key.includes('_text')) {
                        const stepId = key.match(/step_(\d+)_text/)?.[1];
                        if (stepId) {
                            toast({ variant: "destructive", description: `${error}` });
                        }
                    } else if (key.includes('_placeholderText')) {
                        const stepId = key.match(/step_(\d+)_placeholderText/)?.[1];
                        if (stepId) {
                            toast({ variant: "destructive", description: `${error}` });
                        }
                    } else if (key.includes('_startNumber')) {
                        const stepId = key.match(/step_([^_]+)_startNumber/)?.[1];
                        if (stepId) {
                            toast({ variant: "destructive", description: `${error}` });
                        }
                    } else if (key.includes('_endNumber')) {
                        const stepId = key.match(/step_([^_]+)_endNumber/)?.[1];
                        if (stepId) {
                            toast({ variant: "destructive", description: `${error}` });
                        }
                    } else if (key.includes('_startLabel')) {
                        const stepId = key.match(/step_([^_]+)_startLabel/)?.[1];
                        if (stepId) {
                            toast({ variant: "destructive", description: `${error}` });
                        }
                    } else if (key.includes('_endLabel')) {
                        const stepId = key.match(/step_([^_]+)_endLabel/)?.[1];
                        if (stepId) {
                            toast({ variant: "destructive", description: `${error}` });
                        }
                    }
                });
            }
            if (Object.keys(validationErrors).length > 0) {
                setFormError(validationErrors);
                return;
            }
        }

        if (type === "4") {
            const activeChecklists = inAppMsgSetting.checklists;
            const titles = activeChecklists.map((cl) => cl.title.trim().toLowerCase());
            const uniqueTitles = new Set(titles);
            if (uniqueTitles.size < titles.length) {
                toast({ variant: "destructive", description: "Duplicate step titles detected. Please ensure all step titles are unique." });
                return;
            }
            for (const checklist of activeChecklists) {
                if (checklist.title && checklist.title.length > 255) {
                    validationErrors[`checklist_${checklist.checklistId}_title`] = "Step title cannot exceed 255 characters.";
                    hasTitleLengthError = true;
                }
                if (checklist.actionType === 1) {
                    const textError = formValidate("actionText", checklist.actionText, { actionType: checklist.actionType });
                    if (textError) {
                        validationErrors[`checklist_${checklist.checklistId}_actionText`] = textError;
                    }
                    const urlError = formValidate("actionUrl", checklist.actionUrl, { actionType: checklist.actionType });
                    if (urlError) {
                        validationErrors[`checklist_${checklist.checklistId}_actionUrl`] = urlError;
                    }
                }
            }
            if (inAppMsgSetting.isTriggerIcon === false && isEmpty(inAppMsgSetting.triggerText)) {
                toast({ variant: "destructive", description: "Trigger text is required." });
                return;
            }
        }

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            Object.values(validationErrors).forEach((error) => {
                toast({ variant: "destructive", description: error });
            });
            return;
        }


        let imagesToDelete = [];
        if (typeFunc === "update") {
            // For post content
            if (type === "1" && inAppMsgSetting.bodyText) {
                const currentImageUrls = extractImageUrls(inAppMsgSetting.bodyText);
                const originalImageUrls = extractImageUrls(originalContent);
                imagesToDelete = originalImageUrls.filter(url => !currentImageUrls.includes(url));
            }


            // For checklist descriptions
            if (type === "4") {
                const currentChecklistImageUrls = inAppMsgSetting.checklists.flatMap(cl =>
                    extractImageUrls(cl.description)
                );
                const originalChecklistImageUrls = oldInAppMsgSetting.checklists.flatMap(cl =>
                    extractImageUrls(cl.description)
                );
                imagesToDelete = [
                    ...imagesToDelete,
                    ...originalChecklistImageUrls.filter(url =>
                        !currentChecklistImageUrls.includes(url)
                    )
                ];
            }

            // Also delete any uploaded images that were removed before saving
            const currentImageUrls = type === "1"
                ? extractImageUrls(inAppMsgSetting.bodyText)
                : type === "4"
                    ? inAppMsgSetting.checklists.flatMap(cl => extractImageUrls(cl.description))
                    : [];

            const removedUploads = uploadedImages.filter(url =>
                !currentImageUrls.includes(url)
            );
            imagesToDelete = [...imagesToDelete, ...removedUploads];
        }

        if (imagesToDelete.length > 0) {
            try {
                await apiService.mediaDeleteImage({ keys: imagesToDelete });
            } catch (error) {
                console.error("Error deleting images:", error);
                // Continue with the operation even if deletion fails
            }
        }

        const payloadSteps = inAppMsgSetting.steps;
        const startAt = inAppMsgSetting?.startAt ? dayjs(inAppMsgSetting.startAt).format("YYYY-MM-DD HH:mm:ss") : null;
        const endAt = inAppMsgSetting?.endAt && dayjs(inAppMsgSetting.endAt).isValid() ? dayjs(inAppMsgSetting.endAt).format("YYYY-MM-DD HH:mm:ss") : null;

        const payload = {
            ...inAppMsgSetting,
            steps: payloadSteps,
            startAt,
            endAt,
            type,
            projectId: projectDetailsReducer.id,
        };

        setSaving(load);
        let data;
        if (typeFunc === "create") {
            data = await apiService.createInAppMessage(payload);
        } else if (typeFunc === "update") {
            data = await apiService.updateInAppMessage(payload, inAppMsgSetting.id ?? id);
        }

        setSaving("");
        if (data?.success) {
            setUploadedImages([]);
            toast({ description: data.message });
            if (typeFunc === "create" && inAppMsgSetting?.pendingInAppCondition && data?.data?.id) {
                const realId = data.data.id;
                const { pendingInAppCondition } = inAppMsgSetting;
                const apiPayload = transformGroupForApi(
                    pendingInAppCondition.group,
                    pendingInAppCondition.isConditionApply,
                    realId,
                    true
                );
                try {
                    const condRes = await apiService.inAppmessageCondition(apiPayload);
                    if (condRes && condRes.success) {
                        setInAppMsgSetting((latest) => ({
                            ...latest,
                            inAppCondition: {
                                isConditionApply: condRes.data.isConditionApply,
                                conditions: condRes.data.conditions,
                            },
                            pendingInAppCondition: null,
                        }));
                    }
                } catch (e) {
                    // optional: could show a toast, but avoid noisy errors during create
                }
            }

            if (typeFunc === "create" && id === "new") {
                setOpenCopyCode(true);
                navigate(`${baseUrl}/app-message/${type}/${data.data.id}`, { replace: true });
            } else if (typeFunc === "update") {
                await getSingleInAppMessages(false);
            }
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleCancel = () => {
        setInAppMsgSetting(inAppMsgSetting);
        if (id === "new") {
            navigate(`${baseUrl}/app-message/type`);
        } else {
            navigate(`${baseUrl}/app-message?pageNo=${getPageNo}`);
        }
    };

    const deleteMessage = async () => {
        setIsDeleteLoading(true);
        const data = await apiService.deleteInAppMessage(inAppMsgSetting.id);
        setIsDeleteLoading(false);
        if (data.success) {
            toast({ description: data.message });
            navigate(`${baseUrl}/app-message?pageNo=${getPageNo}`);
        } else {
            toast({ variant: "destructive", description: data.error.message });
        }
        setOpenDelete(false);
    };

    const typeNames = {
        1: "Post",
        2: "Banner",
        3: "Survey",
        4: "Checklist",
    };

    const getCodeCopy = () => {
        setOpenCopyCode(!openCopyCode)
    }

    const handleCopyCode = (id) => {
        navigator.clipboard.writeText(id).then(() => {
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
     "${inAppMsgSetting?.uuid}"});
</script>
<script src="${WIDGET_DOMAIN}/widgetScript.js"></script>`;

    const typeName = typeNames[inAppMsgSetting?.type] || "Message";

    return (
        <Fragment>
            {
                openCopyCode &&
                <Fragment>
                    <CopyCode
                        open={openCopyCode}
                        title={<div className={"flex items-center gap-2"}><img className={"w-[20px] h-[20px]"} src={partyPopper} alt={"partyPopper"} /> {`Your ${typeName} is Live!`}</div>}
                        description={"Let’s set up the message in your project"}
                        onClick={() => getCodeCopy("")}
                        onOpenChange={setOpenCopyCode}
                        codeString={codeString}
                        handleCopyCode={() => handleCopyCode(codeString)}
                        isCancelBtn={false}
                    />
                </Fragment>
            }

            <InAppSettingsDialog type={type} open={openSettingsModal} setOpen={setOpenSettingsModal} id={id} inAppMsgSetting={inAppMsgSetting} updateInAppMsgSetting={updateInAppMsgSetting} // Pass the updater
            />
            <div className={"p-4 md:py-6 md:px-4 border-b flex items-center justify-between flex-wrap gap-2"}>
                <Breadcrumb>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className={"cursor-pointer"}>
                                <BreadcrumbLink>
                                    <span onClick={handleCancel} className={"font-medium"}>
                                        {type === "1" && "Post"}{type === "2" && "Banners"}
                                        {type === "3" && "Surveys"}{type === "4" && "Checklist"}
                                    </span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem className={"cursor-pointer"}>
                                <BreadcrumbPage className={`w-full font-medium ${inAppMsgSetting?.title?.length > 30 ? "max-w-[200px] truncate" : ""}`}>
                                    {isLoading && id !== "new" ? null : inAppMsgSetting?.title}
                                </BreadcrumbPage>
                            </BreadcrumbItem>

                            {(isLoading || id === "new") ? null : (inAppMsgSetting?.status && statusMap[inAppMsgSetting.status]) && (
                                <li className={`px-3 py-[1px] rounded-full text-[13px] ${statusMap[inAppMsgSetting.status].color}`}>
                                    {statusMap[inAppMsgSetting.status].label}
                                </li>
                            )}

                            <Fragment>
                                <BreadcrumbItem className={"cursor-pointer flex items-center gap-1"}>
                                    <span onClick={() => setOpenSettingsModal(true)} className="flex items-center font-medium hover:text-primary text-black">
                                        <Settings size={16} className="mr-1" /> Settings
                                    </span>
                                </BreadcrumbItem>
                            </Fragment>

                        </BreadcrumbList>
                    </Breadcrumb>
                </Breadcrumb>
                <div className={"flex flex-wrap items-center gap-2"}>
                    {id !== "new" ? (
                        <Button
                            variant="outline"
                            className={"w-9 h-9"}
                            size="icon"
                            onClick={() =>
                                navigate(`${baseUrl}/app-message/${inAppMsgSetting.type}/analytic/${inAppMsgSetting.id}?title=${inAppMsgSetting.title}`)
                            }
                        >
                            <BarChart size={16} />
                        </Button>
                    ) : ("")}
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
                    <Button variant={"ghost hover-none"} className={`font-medium border border-primary text-primary ${id !== "new" ? "hidden" : ""}`} onClick={handleCancel}>
                        Cancel
                    </Button>
                    {id !== "new" && inAppMsgSetting?.status !== 3 && (
                        <Button
                            className="font-medium hover:bg-primary"
                            onClick={() => getCodeCopy(inAppMsgSetting?.uuid)}
                        >
                            Get code
                        </Button>
                    )}
                    {id !== "new" && (
                        <Fragment>
                            <Button variant={"ghost hover-none"} onClick={() => setOpenDelete(true)} className={"font-medium border border-destructive text-destructive"}>
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </Button>
                            <DeleteDialog
                                title="You really want to delete this Message?"
                                isOpen={openDelete}
                                onOpenChange={() => setOpenDelete(false)}
                                onDelete={deleteMessage}
                                isDeleteLoading={isDeleteLoading}
                                deleteRecord={inAppMsgSetting.id}
                            />
                        </Fragment>
                    )}
                </div>
            </div>
            <div className={"flex flex-wrap md:flex-nowrap h-[calc(100%_-_85px)] overflow-y-auto"}>
                <div className={"w-full md:max-w-[407px] w-full border-r h-auto md:h-full overflow-y-auto"}>
                    <SidebarInAppMessage
                        id={id}
                        type={type}
                        inAppMsgSetting={inAppMsgSetting}
                        setInAppMsgSetting={setInAppMsgSetting}
                        selectedStepIndex={selectedStepIndex}
                        setSelectedStepIndex={setSelectedStepIndex}
                        selectedStep={selectedStep}
                        setSelectedStep={setSelectedStep}
                        formValidate={formValidate}
                        saving={saving}
                        formError={formError}
                        setFormError={setFormError}
                        handleMessage={handleMessage}
                    />
                </div>
                <div className={"bg-muted w-full h-[100vh] md:h-full overflow-y-auto"}>
                    <Card className={`my-6 mx-4 rounded-md px-4 pt-6 pb-8 h-[calc(100%_-_48px)] `}>
                        <Card className={`rounded-md border-b h-full ${isLoading ? "overflow-hidden" : ""}`}>
                            <div className={"p-4 flex gap-2 border-b"}>
                                <div className={"w-3 h-3 rounded-full border bg-[#FF5F57] border-[#FF5F57]"} />
                                <div className={"w-3 h-3 rounded-full border bg-[#FFBD2E] border-[#FFBD2E]"} />
                                <div className={"w-3 h-3 rounded-full border bg-[#28C840] border-[#28C840]"} />
                            </div>
                            {renderContent(type)}
                        </Card>
                    </Card>
                </div>
            </div>
        </Fragment>
    );
};

export default UpdateInAppMessage;
