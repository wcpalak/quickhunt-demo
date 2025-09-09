import React, { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "../../ui/card";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Switch } from "../../ui/switch";
import { useToast } from "../../ui/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../ui/button";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";
import ColorInput from "../../Comman/ColorPicker";
import { Checkbox } from "../../ui/checkbox";
import { apiService } from "../../../utils/constent";
import PlanBadge from "../../Comman/PlanBadge";
import { allStatusAndTypesAction } from "../../../redux/action/AllStatusAndTypesAction";
import TimezoneSelector from "../../Comman/TimezoneSelector";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../ui/tooltip";

const initialState = {
    announcementTitle: "",
    docTitle: "",
    btnBackgroundColor: "#7c3aed",
    btnTextColor: "#ffffff",
    headerBgColor: "#FFFFFF",
    headerTextColor: "#030712",
    headerActiveTabColor: "#7C3AED",
    headerBtnBackgroundColor: "#7c3aed",
    headerBtnTextColor: "#FFFFFF",
    ideaTitle: "",
    isShowRoadmapDescription: 1,
    isAnnouncement: 1,
    isDoc: 1,
    isBranding: 1,
    isComment: 1,
    isIdea: 1,
    isReaction: 1,
    isRoadmap: 1,
    privateMode: 0,
    password: "",
    roadmapTitle: "",
    timezone: "Asia/Kolkata (GMT+05:30)",
};

const GeneralSettings = () => {
    const { toast } = useToast();
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(
        (state) => state.projectDetailsReducer
    );
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);

    let [generalSettingData, setGeneralSettingData] = useState(initialState);
    const [isSave, setIsSave] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState(initialState);
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        const getPortalSetting = async () => {
            const data = await apiService.getPortalSetting(projectDetailsReducer.id);
            if (data.success) {
                setGeneralSettingData({
                    ...data.data.data,
                    docTitle: data?.data?.docTitle || "Docs",
                });
            }
        };
        if (projectDetailsReducer.id) {
            getPortalSetting();
        }
    }, [projectDetailsReducer.id]);

    const formValidate = (name, value) => {
        switch (name) {
            case "password":
                if (generalSettingData?.privateMode === 1) {
                    if (!value || value.trim() === "") {
                        return "Password is required";
                    }
                    if (value.length < 8) {
                        return "Password must be at least 8 characters";
                    }
                }
                return "";
            case "announcementTitle":
                if (generalSettingData?.isAnnouncement === 1) {
                    if (!value || value.trim() === "") {
                        return "Changelog title is required";
                    }
                }
                return "";
            case "roadmapTitle":
                if (generalSettingData?.isRoadmap === 1) {
                    if (!value || value.trim() === "") {
                        return "Roadmap title is required";
                    }
                }
                return "";
            case "ideaTitle":
                if (generalSettingData?.isIdea === 1) {
                    if (!value || value.trim() === "") {
                        return "Feedback title is required";
                    }
                }
                return "";
            case "ideaButtonLabel":
                if (generalSettingData?.isIdea === 1) {
                    if (!value || value.trim() === "") {
                        return "Feedback button label is required";
                    } else if (value.trim().length > 50) {
                        return "Button label can't have more than 50 characters";
                    }
                }
                return "";
            case "docTitle":
                if (generalSettingData?.isDoc === 1) {
                    if (!value || value.trim() === "") {
                        return "Document title is required";
                    }
                }
                return "";
            default:
                return "";
        }
    };

    const onChange = (name, value) => {
        let updatedData = {
            ...generalSettingData,
            [name]: value,
        };
        let updatedErrors = { ...formError };

        if (name === "isComment" && value === 0) {
            updatedData.isShowAnnouncementFeedback = 0;
        }

        if (name === "privateMode" && value === 0) {
            updatedData.password = "";
            updatedErrors.password = "";
        }
        if (name === "password" && generalSettingData.privateMode !== 1) {
            updatedErrors[name] = "";
        } else {
            updatedErrors[name] = formValidate(name, value);
        }
        if (name === "isAnnouncement" && value === 0) {
            updatedErrors.announcementTitle = "";
        }
        if (name === "isIdea" && value === 0) {
            updatedErrors.ideaTitle = "";
        }
        if (name === "isRoadmap" && value === 0) {
            updatedErrors.roadmapTitle = "";
        }
        setGeneralSettingData(updatedData);
        setFormError(updatedErrors);
    };

    const onUpdatePortal = async (loader) => {
        if (
            generalSettingData.isAnnouncement === 0 &&
            generalSettingData.isRoadmap === 0 &&
            generalSettingData.isIdea === 0 &&
            generalSettingData.isDoc === 0
        ) {
            toast({ description: "At least one feature (Changelog, Roadmap, Feedback, or Documents) must be enabled", variant: "destructive", });
            return;
        }
        let validationErrors = {};
        Object.keys(generalSettingData).forEach((name) => {
            const error = formValidate(name, generalSettingData[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        const payload = {
            ...generalSettingData,
            projectId: projectDetailsReducer.id,
        };

        setIsSave(loader);
        const data = await apiService.updatePortalSetting(
            generalSettingData.id,
            payload
        );
        if (data.success) {
            dispatch(
                allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    setting: {
                        ...allStatusAndTypes?.setting,
                        isBranding: payload.isBranding,
                    },
                })
            );
            setIsSave('');
            toast({ description: data.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    };

    const initialStateFields = [
        {
            isIdeas: true,
            title: "Feedback",
            nameSwitch: "isIdea",
            tooltip: "Hide Feedback Menu / Show Feedback Menu",
            input: [
                {
                    field: "text",
                    label: "Title",
                    name: "ideaTitle",
                    placeholder: "e.g. Feature suggestions",
                    isRequire: true
                },
                { field: "text", label: "Button Label", name: "ideaButtonLabel", placeholder: "", isRequire: true },
                { field: "text", label: "Description", name: "ideaDescription", placeholder: "Enter description" },
            ],
        },
        {
            isRoadmap: true,
            title: "Roadmap",
            nameSwitch: "isRoadmap",
            tooltip: "Hide Roadmap Menu / Show Roadmap Menu",
            input: [
                {
                    field: "text",
                    label: "Title",
                    name: "roadmapTitle",
                    placeholder: "e.g. Feature plans",
                    isRequire: true
                },
                {
                    field: "checkbox",
                    label: "Show Roadmap Header Description",
                    name: "isShowRoadmapDescription"
                },
                // generalSettingData?.isShowRoadmapDescription === 1 ? {
                //     field: "text",
                //     label: "Description",
                //     name: "roadmapDescription",
                //     placeholder: "Enter description"
                // } : null,
            ].filter(Boolean),
        },
        {
            isAnnouncement: true,
            title: "Changelog",
            nameSwitch: "isAnnouncement",
            tooltip: "Show Changelog Menu / Hide Changelog Menu",
            input: [
                { field: "text", label: "Title", name: "announcementTitle", isRequire: true },
                {
                    field: "text",
                    label: "Description",
                    name: "announcementDescription",
                    placeholder: "Enter description"
                },
                { field: "checkbox", label: "Show Feedback", name: "isComment", },
                { field: "checkbox", label: "Reactions", name: "isReaction", },
                { field: "checkbox", label: "Show Comment", name: "isShowAnnouncementFeedback", },

            ],
        },
        {
            isDocuments: true,
            title: "Documents",
            nameSwitch: "isDoc",
            tooltip: "Hide Doc Menu / Show Doc Menu",
            input: [
                { field: "text", label: "Title", name: "docTitle", isRequire: true },
                { field: "text", label: "Documents Header Title", name: "docSubTitle", placeholder: "Enter header title" },
                { field: "text", label: "Description", name: "docDescription", placeholder: "Enter description" },
            ],
        },
        {
            isHeaderColor: true,
            title: "Header",
            input: [
                { field: "color", label: "Background Color", name: "headerBgColor", value: "headerBgColor", },
                { field: "color", label: "Text Color", name: "headerTextColor", },
                { field: "color", label: "Project title Color", name: "headerProjectTitleColor", },
                { field: "color", label: "Active Tab Text Color", name: "headerActiveTabColor", },
                { field: "color", label: "Button Background Color", name: "headerBtnBackgroundColor", },
                { field: "color", label: "Button Text Color", name: "headerBtnTextColor", },
            ],
        },
        {
            isGlobalColor: true,
            title: "Global Color",
            input: [
                { field: "color", label: "Button Background Color", name: "btnBackgroundColor", },
                { field: "color", label: "Button Text Color", name: "btnTextColor", },
            ],
        },
        {
            isTimeZone: true,
            title: "Time Zone",
            infoIcon: <Info size={15} />,
            tooltip: "Adjust your project’s time zone for proper scheduling and reports.",
            input: [{ field: "select", label: "Select Time", name: "timezone", },],
        },
        {
            title: (
                <Fragment>
                    Branding{" "}
                    {projectDetailsReducer.plan === 0 ? (<PlanBadge title={"Starter"} />) : ("")}
                </Fragment>
            ),
            input: [
                {
                    field: "switch",
                    label: "Hide Branding",
                    name: "isBranding",
                    disabled: projectDetailsReducer.plan === 0,
                    tooltip: projectDetailsReducer.plan === 0 ? "Branding toggle is disabled for Starter plan" : "Show or hide branding elements",
                },
            ],
        },
        {
            isPrivateOrg: true,
            title: "Private Organization",
            input: [
                {
                    field: "switch",
                    label: "Enable the option and set a password to make your organization private.",
                    name: "privateMode",
                    tooltip: "Enable to restrict access with a password",
                },
                { field: "password", label: "Password", name: "password", },
            ],
        },
    ];

    return (
        <Card className={"divide-y"}>
            <CardHeader className={"gap-2 flex-row items-center justify-between sm:flex-nowrap flex-wrap p-4 sm:px-5 sm:py-4"}>
                <div>
                    <CardTitle className={"text-xl lg:text-2xl font-medium capitalize"}>
                        Customize Feedback Portal
                    </CardTitle>
                    <CardDescription className={"text-sm text-muted-foreground p-0"}>
                        Customize section titles, colors, and branding elements to align with your product’s look and feel.
                    </CardDescription>
                </div>
                <Button className={`w-[54px] text-sm font-semibold hover:bg-primary capitalize`} onClick={() => onUpdatePortal("head")} disabled={isSave === "head"}>
                    {isSave === "head" ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("Save")}
                </Button>
            </CardHeader>
            <CardContent className={"p-0 divide-y"}>
                {initialStateFields.map((x, i) => {
                    return (
                        <div className={"space-y-3 p-4 sm:px-5 sm:py-4"} key={i}>
                            <div className={"flex justify-between items-center gap-2"}>
                                {x.title === "Time Zone" ? (
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium">{x.title}</h3>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info size={15} className="" />
                                            </TooltipTrigger>
                                            <TooltipContent>{x.tooltip}</TooltipContent>
                                        </Tooltip>
                                    </div>
                                ) : (
                                    <h3 className="font-medium">{x.isHeaderColor ? "Preview" : x.title}</h3>
                                )}
                                {x.nameSwitch ? (
                                    <div className="announce-create-switch flex gap-4">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Switch
                                                        className="w-[38px] h-[20px]"
                                                        checked={generalSettingData?.[x.nameSwitch] === 1}
                                                        onCheckedChange={(checked) => onChange(x.nameSwitch, checked ? 1 : 0)}
                                                    />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                className={"font-normal text-sm"}>{x.tooltip}</TooltipContent>
                                        </Tooltip>
                                    </div>
                                ) : ""}
                            </div>
                            {generalSettingData?.[x.nameSwitch] === undefined ||
                                generalSettingData?.[x.nameSwitch] === 1 ? (
                                <Fragment>
                                    {
                                        x.isHeaderColor &&
                                        <div className="hidden md:block border rounded-[10px]">
                                            {/* Live Preview Section */}
                                            <div className="rounded-sm shadow-sm rounded-[10px]" >
                                                <div className="flex items-center justify-between p-3 border-b rounded-t-[10px] overflow-x-auto whitespace-nowrap gap-4" style={{ backgroundColor: generalSettingData.headerBgColor, color: generalSettingData.headerTextColor, }}>
                                                    {/* Project Title */}
                                                    <h2 className="text-xl font-bold flex-shrink-0" style={{ color: generalSettingData.headerProjectTitleColor }}>Adam Project</h2>

                                                    {/* Tabs */}
                                                    <div className="flex gap-4 flex-shrink-0">
                                                        <span className="cursor-pointer" style={{ color: generalSettingData.headerActiveTabColor }}>Ideas</span>
                                                        <span className="cursor-pointer">Roadmap</span>
                                                        <span className="cursor-pointer">Announcements</span>
                                                        <span className="cursor-pointer">Docs</span>
                                                    </div>

                                                    {/* Search + Button */}
                                                    <div className="flex items-center gap-4 flex-shrink-0">
                                                        <div className="border h-[30px] w-[168px] bg-white text-muted-foreground rounded-md px-2 py-1 text-sm">Search</div>
                                                        <button className="rounded-lg px-4 py-1 font-medium"
                                                            style={{ backgroundColor: generalSettingData.headerBtnBackgroundColor, color: generalSettingData.headerBtnTextColor, }}
                                                        >Button</button>
                                                    </div>
                                                </div>
                                                {/* Content Section */}
                                                <div className="flex overflow-x-auto rounded-b-[10px]">
                                                    {/* Sidebar */}
                                                    <div className="w-1/5 min-w-[150px] border-r p-4 text-sm text-gray-600 flex-shrink-0">
                                                        <div className="mb-2 font-medium">All Feedbacks</div>
                                                        <div className="mb-1">Trending</div>
                                                        <div className="mb-1">Top</div>
                                                        <div className="mb-1">New</div>
                                                    </div>

                                                    {/* Main Content */}
                                                    <div className="w-4/5 min-w-[580px] p-6 flex-shrink-0">
                                                        {/* Global Button */}
                                                        <button
                                                            className="rounded-md p-2 font-medium mb-4 text-[14px] "
                                                            style={{
                                                                backgroundColor: generalSettingData.btnBackgroundColor,
                                                                color: generalSettingData.btnTextColor,
                                                            }}
                                                        >
                                                            Add an Idea
                                                        </button>

                                                        {/* Example Card */}
                                                        <div className="border rounded-lg p-4 mb-4">
                                                            <h3 className="font-semibold mb-2">Dolorum esse quas es</h3>
                                                            <p className="text-sm text-gray-500 mb-3">Consequatur. Voluptati.</p>

                                                            {/* Example Tags */}
                                                            <div className="flex gap-2 flex-wrap">
                                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 border">
                                                                    #High Priority
                                                                </span>
                                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 border">
                                                                    In Progress
                                                                </span>
                                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 border">
                                                                    Planned
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    <h3 className="font-medium">{x.isHeaderColor && x.title}</h3>
                                    <div className={"space-y-3"}>
                                        <div
                                            className={`${(x.isHeaderColor || x.isGlobalColor || x.isIdeas || x.isAnnouncement || x.isRoadmap || x.isDocuments)
                                                ? `grid ${x.isHeaderColor ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`
                                                : x.isPrivateOrg
                                                    ? "flex gap-4 w-full" : "space-y-3 w-full md:w-1/2"
                                                }`}
                                        >
                                            {x.input.map((y, inputIndex) => {
                                                return (
                                                    <Fragment key={inputIndex}>
                                                        {y.field === "text" ? (
                                                            <div className={"space-y-1"}>
                                                                <Label
                                                                    className={`text-sm font-medium ${y?.isRequire ? "after:ml-1 after:content-['*'] after:text-destructive" : ""}`}>
                                                                    {y.label}
                                                                </Label>
                                                                <Input
                                                                    placeholder={y.placeholder}
                                                                    value={generalSettingData?.[y.name]}
                                                                    onChange={(e) =>
                                                                        onChange(y.name, e.target.value)
                                                                    }
                                                                />
                                                                {formError[y.name] ? (
                                                                    <div className="grid gap-2 mt-[4px]">
                                                                        <span
                                                                            className="text-red-500 text-sm">{formError[y.name]}</span>
                                                                    </div>
                                                                ) : ("")}
                                                            </div>
                                                        ) : y.field === "checkbox" && !(y.name === "isShowAnnouncementFeedback" && generalSettingData?.isComment === 0) ? (
                                                            <div className="flex items-center gap-4">
                                                                <Checkbox
                                                                    id={y.name}
                                                                    checked={generalSettingData?.[y.name] === 1}
                                                                    onCheckedChange={(checked) => {
                                                                        onChange(y.name, checked ? 1 : 0);
                                                                        setGeneralSettingData(prev => ({
                                                                            ...prev,
                                                                            [y.name]: checked ? 1 : 0
                                                                        }));
                                                                    }}
                                                                />
                                                                <label
                                                                    htmlFor={y.name}
                                                                    className="text-sm text-muted-foreground font-medium"
                                                                >
                                                                    {y.label}
                                                                </label>
                                                            </div>
                                                        ) : y.field === "color" ? (
                                                            <div
                                                                className={"flex items-center gap-3 flex-wrap md:flex-nowrap"}>
                                                                <div className={"widget-color-picker space-y-1 w-full"}>
                                                                    <Label
                                                                        className={"text-sm font-medium"}>{y.label}</Label>
                                                                    <ColorInput
                                                                        name={y.name}
                                                                        value={generalSettingData?.[y.name]}
                                                                        onChange={(value) =>
                                                                            onChange(y.name, value)
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : y.field === "select" ? (
                                                            <div>
                                                                <TimezoneSelector
                                                                    {...{
                                                                        timezone: generalSettingData.timezone,
                                                                        onChange: onChange,
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : y.field === "switch" ? (
                                                            <Fragment>
                                                                <div className="space-y-3">
                                                                    <div className="announce-create-switch flex gap-4">
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <span>
                                                                                    <Switch
                                                                                        className="w-[38px] h-[20px]"
                                                                                        checked={y.name === 'isBranding' ? generalSettingData?.[y.name] === 0 : generalSettingData?.[y.name] === 1}
                                                                                        disabled={y.disabled}
                                                                                        onCheckedChange={(checked) => y.name === 'isBranding' ?
                                                                                            onChange(y.name, checked ? 0 : 1) :
                                                                                            onChange(y.name, checked ? 1 : 0)
                                                                                        }
                                                                                    />
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>{y.tooltip}</TooltipContent>
                                                                        </Tooltip>
                                                                        <p className="text-sm text-muted-foreground font-medium">{y.label}</p>
                                                                    </div>
                                                                    {y.name === "privateMode" && generalSettingData?.privateMode === 1 && (
                                                                        <div className={"w-3/4"}>
                                                                            <Label
                                                                                className="text-sm font-medium after:ml-0.5 after:content-['*'] after:text-destructive">
                                                                                Password
                                                                            </Label>
                                                                            <div className={"relative"}>
                                                                                <Input
                                                                                    type={showPassword ? "text" : "password"}
                                                                                    value={generalSettingData?.password || ""}
                                                                                    placeholder="Enter your password"
                                                                                    onChange={(e) =>
                                                                                        onChange(
                                                                                            "password",
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <Button
                                                                                    className={"absolute top-0 right-0"}
                                                                                    variant={"ghost hover:none"}
                                                                                    onClick={togglePasswordVisibility}>
                                                                                    {showPassword ? (
                                                                                        <Eye size={16} />) : (
                                                                                        <EyeOff size={16} />)}
                                                                                </Button>
                                                                                {formError.password && (<span
                                                                                    className="text-destructive text-sm">{formError.password}</span>)}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Fragment>
                                                        ) : ("")}
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Fragment>
                            ) : ("")}
                        </div>
                    );
                })}
            </CardContent>
            <CardFooter className={"p-4 sm:px-5 sm:py-4 justify-end"}>
                <Button className={`w-[54px] text-sm font-semibold hover:bg-primary capitalize`} onClick={() => onUpdatePortal("bottom")} disabled={isSave === "bottom"}>
                    {isSave === "bottom" ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("Save")}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default GeneralSettings;
