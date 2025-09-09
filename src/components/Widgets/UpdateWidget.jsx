import React, {useState, Fragment, useEffect} from "react";
import {BarChart, Loader2, Trash2} from "lucide-react";
import {Label} from "../ui/label";
import {Input} from "../ui/input";
import {Checkbox} from "../ui/checkbox";
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,} from "../ui/breadcrumb";
import {SelectTrigger, SelectContent, SelectItem, Select, SelectValue, SelectGroup,} from "../ui/select";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {apiService, baseUrl, WIDGET_DOMAIN} from "../../utils/constent";
import ColorInput from "../Comman/ColorPicker";
import {Button} from "../ui/button";
import {useToast} from "../ui/use-toast";
import {useSelector} from "react-redux";
import {ToggleGroup, ToggleGroupItem} from "../ui/toggle-group";
import WidgetPreview from "./WidgetPreview/WidgetPreview";
import {useTheme} from "../theme-provider";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger,} from "@/components/ui/accordion"
import DeleteDialog from "../Comman/DeleteDialog";
import CopyCode from "../Comman/CopyCode";
import partyPopper from "../../assets/PartyPopper.png";

const initialState = {
    projectId: "",
    type: "embed",
    popoverWidth: "380",
    popoverHeight: "620",
    launcherIcon: "bolt",
    launcherPosition: 2,
    launcherIconBgColor: "#7c3aed",
    launcherIconColor: "#ffffff",
    launcherRightSpacing: "20",
    launcherLeftSpacing: "20",
    launcherBottomSpacing: "90",
    isIdea: true,
    isRoadmap: true,
    isAnnouncement: true,
    isLauncherIcon: true,
    isShowRoadmapDescription: true,
    headerBgColor: "#ffffff",
    headerTextColor: "#000000",
    headerBtnBackgroundColor: "#7c3aed",
    headerActiveTabColor: "#7C3AED",
    headerBtnTextColor: "#FFFFFF",
    btnBackgroundColor: "#7c3aed",
    btnTextColor: "#FFFFFF",
    popoverOffset: "20",
    modalWidth: "800",
    modalHeight: "800",
    name: "My new widget",
    sidebarPosition: 2,
    sidebarWidth: "450",
    ideaTitle: "Feedback",
    ideaDisplay: 1,
    ideaButtonLabel: "Add an Feedback",
    roadmapTitle: "Roadmap",
    roadmapDisplay: 1,
    changelogTitle: "Changelog",
    changelogDisplay: 1,
    changelogReaction: true,
    hideHeader: false,
    announcementDescription: true,
    announcementImage: true,
    ideaDescription: true,
    roadmapImage: true,
    isComment: true,
    isShowAnnouncementFeedback: false,
    isselectedRoadmapId: null,
    roadmapId: null,
    isRoadmapDescription: true,
    isRoadmapTags: true,
    isRoadmapComments: true,
    ideaDescriptionText: "",
    roadmapDescription: "",
    announcementDescriptionText: "",
    documentDescription: "",
    isDocument: true,
    documentTitle: "Docs",
    documentDisplay: 1,
    headerProjectTitleColor: '#000000',
    viewType: 1,
};
const initialStateError = {
    name: "",
    ideaTitle: "",
    roadmapTitle: "",
    changelogTitle: "",
    documentTitle: "",
    ideaButtonLabel: "",
    launcherRightSpacing: "",
    launcherBottomSpacing: "",
    popoverWidth: "",
    popoverHeight: "",
};

const UpdateWidget = () => {
    const [searchParams] = useSearchParams();
    const getPageNo = searchParams.get("pageNo") || 1;
    const navigate = useNavigate();
    const {onProModal} = useTheme();
    const {toast} = useToast();
    const {id, type} = useParams();
    const [widgetsSetting, setWidgetsSetting] = useState(initialState);
    const [roadmapdata, setRoadmapdata] = useState([]);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const [loading, setLoading] = useState("");
    const [selectedToggle, setSelectedToggle] = useState("feedback");
    const [toggle, setToggle] = useState(true);
    const [formError, setFormError] = useState(initialStateError);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [openCopyCode, setOpenCopyCode] = useState(false);
    const [selectedType, setSelectedType] = useState("script");
    const [newWidgetId, setNewWidgetId] = useState(null);

    const getNextAvailableSection = () => {
        if (widgetsSetting.isIdea) return "feedback";
        if (widgetsSetting.isRoadmap) return "roadmap";
        if (widgetsSetting.isAnnouncement) return "changelog";
        if (widgetsSetting.isDocument) return "documents";
        return "feedback";
    };

    const [selected, setSelected] = useState(getNextAvailableSection());

    useEffect(() => {
        if (!widgetsSetting.isIdea && selected === "feedback") {
            setSelected(getNextAvailableSection());
        } else if (!widgetsSetting.isRoadmap && selected === "roadmap") {
            setSelected(getNextAvailableSection());
        } else if (!widgetsSetting.isAnnouncement && selected === "changelog") {
            setSelected(getNextAvailableSection());
        } else if (!widgetsSetting.isDocument && selected === "documents") {
            setSelected(getNextAvailableSection());
        } 
    }, [
        widgetsSetting.isIdea,
        widgetsSetting.isRoadmap,
        widgetsSetting.isAnnouncement,
        widgetsSetting.isDocument,
    ]);

    useEffect(() => {
        if (widgetsSetting.isIdea && selectedToggle === "feedback") {
            setSelected("feedback");
        } else if (widgetsSetting.isRoadmap && selectedToggle === "roadmap") {
            setSelected("roadmap");
        } else if (widgetsSetting.isAnnouncement && selectedToggle === "changelog") {
            setSelected("changelog");
        } else if (widgetsSetting.isDocument && selectedToggle === "documents") {
            setSelected("documents");
        }
    }, [
        widgetsSetting.isIdea,
        widgetsSetting.isRoadmap,
        widgetsSetting.isAnnouncement,
        widgetsSetting.isDocument,
    ]);

    useEffect(() => {
        if (selectedToggle !== selected) {
            setSelectedToggle(selected);
        }
    }, [selected]);

    useEffect(() => {
        if (selectedToggle === selected) {
            setSelected(selected);
        }
    }, [selectedToggle]);

    const isAllowed = (v) => (
        (v === "feedback" && widgetsSetting.isIdea) ||
        (v === "roadmap" && widgetsSetting.isRoadmap) ||
        (v === "changelog" && widgetsSetting.isAnnouncement) ||
        (v === "documents" && widgetsSetting.isDocument)
    );

    const handleToggle = (value) => {
        if (!value) return;
        const next = isAllowed(value) ? value : getNextAvailableSection();
        setSelectedToggle(value);
        setSelected(next);
    };

    useEffect(() => {
        if (projectDetailsReducer?.id) {
            getRoadmaps();
        }
    }, [projectDetailsReducer?.id]);

    useEffect(() => {
        if (id !== "new") {
            getWidgetsSetting();
        }
    }, [id]);

    const getWidgetsSetting = async () => {
        const data = await apiService.getWidgets(id);
        if (data.success) {
            setWidgetsSetting(data.data);
        }
    };

    const getRoadmaps = async () => {
        const data = await apiService.getAllRoadmap(projectDetailsReducer?.id);
        if (data.success) {
            setRoadmapdata(data?.data || []);
            if (data?.data?.length > 0) {
                setWidgetsSetting((prev) => ({...prev, roadmapId: prev.roadmapId || data.data[0]?.id,}));
                const payload = {projectId: projectDetailsReducer?.id, roadmapId: data.data[0]?.id,};
                await apiService.UpdateRoadmap(payload);
            }
        }
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "name":
                if (!value || value.trim() === "") {
                    return "Title is required";
                }
                return "";
            case "ideaTitle":
                if (!value || value.trim() === "") {
                    return "Feedback title is required";
                }
                return "";
            case "roadmapTitle":
                if (!value || value.trim() === "") {
                    return "Roadmap title is required";
                }
                return "";
            case "changelogTitle":
                if (!value || value.trim() === "") {
                    return "Changelog title is required";
                }
                return "";
            case "documentTitle":
                if (!value || value.trim() === "") {
                    return "Document title is required";
                }
                return "";
            case "ideaButtonLabel":
                if (widgetsSetting.isIdea) {
                    if (!value || value.trim() === "") {
                        return "Button label text is required";
                    } else if (value.trim().length > 50) {
                        return "Button label can't have more than 50 characters";
                    }
                }
                return "";
            case "launcherRightSpacing":
                if (type === 'popover') {
                    const numericValue = Number(value);
                    // if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                    if (!value || isNaN(numericValue) || numericValue < 0) {
                        return "Right spacing is required";
                    }
                }
                return "";
            case "launcherBottomSpacing":
                if (type === 'popover') {
                    const numericValue = Number(value);
                    // if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                    if (!value || isNaN(numericValue) || numericValue < 0) {
                        return "Bottom spacing is required";
                    }
                }
                return "";
            case "popoverWidth":
                if (type === 'popover') {
                    const numericValue = Number(value);
                    if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                        return "Width is required";
                    }
                }
                return "";
            case "popoverHeight":
                if (type === 'popover') {
                    const numericValue = Number(value);
                    if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                        return "Height is required";
                    }
                }
                return "";
            case "modalWidth":
                if (type === 'modal') {
                    const numericValue = Number(value);
                    if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                        return "Width is required";
                    }
                }
                return "";
            case "modalHeight":
                if (type === 'modal') {
                    const numericValue = Number(value);
                    if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                        return "Height is required";
                    }
                }
                return "";
            case "sidebarWidth":
                if (type === 'sidebar') {
                    const numericValue = Number(value);
                    if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                        return "Width is required";
                    }
                }
                return "";
            case "sidebarHeight":
                if (type === 'sidebar') {
                    const numericValue = Number(value);
                    if (!value || value.trim() === "" || isNaN(numericValue) || numericValue < 0) {
                        return "Height is required";
                    }
                }
                return "";
            default: {
                return "";
            }
        }
    };

    const onChange = (name, value) => {
        const trimmedValue = typeof value === 'string' ? value.trimStart() : value;
        setWidgetsSetting((prev) => ({...prev, [name]: trimmedValue}));
        setFormError((prev) => ({...prev, [name]: formValidate(name, trimmedValue),}));
    };

    const onChangeCheckBox = async (name, value) => {
        if(name === 'isComment' && value === false){
            setWidgetsSetting({...widgetsSetting, [name]: value, isShowAnnouncementFeedback: false});
        } else{
            setWidgetsSetting({...widgetsSetting, [name]: value});
        }
        
        if (name === "isRoadmap" && widgetsSetting.roadmapId) {
            const payload = {projectId: projectDetailsReducer?.id, roadmapId: widgetsSetting.roadmapId,};
            const data = await apiService.UpdateRoadmap(payload);
            if (!data.success) {
                toast({variant: "destructive", description: data?.error?.message || "Failed to update roadmap",});
            }
        }
    };

    const handleRoadmapSelect = async (value) => {
        setWidgetsSetting((prev) => ({...prev, roadmapId: Number(value),}));
    };

    const handleEsc = (event) => {
        if (event.keyCode === 27) {
            setToggle(false);
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleEsc);
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const handleWidgetSave = async (loader) => {
        if (projectDetailsReducer?.plan === 0 && type === "embed") {
            onProModal(true);
        } else {
            const trimmedTitle = widgetsSetting.name ? widgetsSetting.name.trim() : "";
            const updatedIdea = {...widgetsSetting, name: trimmedTitle,};
            setWidgetsSetting(updatedIdea);

            const {isIdea, isRoadmap, isAnnouncement, isDocument} = updatedIdea;
            if (!isIdea && !isRoadmap && !isAnnouncement && !isDocument) {
                toast({variant: "destructive", description: "Please select at least one enable: Feedback, Roadmap,Document or Changelog.",});
                return;
            }

            let validationErrors = {};
            Object.keys(updatedIdea).forEach((name) => {
                const error = formValidate(name, updatedIdea[name]);
                if (error && error.length > 0) {
                    validationErrors[name] = error;
                }
            });

            if (Object.keys(validationErrors).length > 0) {
                setFormError(validationErrors);
                return;
            }

            setLoading(loader);

            const payload = {...updatedIdea, projectId: projectDetailsReducer.id, type,};

            let data;
            if (id === "new") {
                data = await apiService.createWidgets(payload);
            } else {
                data = await apiService.updateWidgets(payload, widgetsSetting.id);
            }
            setLoading("");
            if (data.success) {
                toast({description: data.message});
                if (id === "new") {
                    setNewWidgetId(data.data.id);
                    setOpenCopyCode(true);
                    navigate(`${baseUrl}/widget/${type}/${data.data.id}`, { replace: true });
                }
            } else {
                toast({variant: "destructive", description: data?.error?.message});
            }
        }
    };

    const deleteWidget = async () => {
        setIsDeleteLoading(true);
        const data = await apiService.onDeleteWidget(id);
        setIsDeleteLoading(false);

        if (data.success) {
            toast({ description: data.message });
            navigate(`${baseUrl}/widget?pageNo=${getPageNo}`);
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            toast({ description: "Copied to clipboard" });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const getCodeCopy = () => {
        setOpenCopyCode(!openCopyCode);
    };

    const getActiveLink = () => {
        const navList = [
            {
                link: "feedback",
                isCheck: widgetsSetting.isIdea !== false,
                isRedirect: widgetsSetting.ideaDisplay !== 2,
            },
            {
                link: "roadmap",
                isCheck: widgetsSetting.isRoadmap !== false,
                isRedirect: widgetsSetting.roadmapDisplay !== 2,
            },
            {
                link: "changelog",
                isCheck: widgetsSetting.isAnnouncement !== false,
                isRedirect: widgetsSetting.changelogDisplay !== 2,
            },
        ];

        const visibleTab = navList.find(item => item.isCheck && item.isRedirect);
        return visibleTab?.link || "feedback";
    };

    const getCodeStrings = () => {
        const activeLink = getActiveLink();
        const widgetId = widgetsSetting?.sortCode || newWidgetId;
        const roadmapId = widgetsSetting?.roadmapId;

        const embedLink = `https://${projectDetailsReducer.domain}/widget/${activeLink}?widget='${widgetId}'${roadmapId ? `&roadmapId=${roadmapId}` : ""}`;

        const iFrame = `<iframe src="${embedLink}" style="border: 0; outline: 0; width: 450px; height: 400px;"></iframe>`;

        const callback = `window.Quickhunt('${widgetId}')`;

        const script = `<script>
    window.Quickhunt_Config = window.Quickhunt_Config || [];
    window.Quickhunt_Config.push({ Quickhunt_Widget_Key: 
     "${widgetId}"});
</script>
<script src="${WIDGET_DOMAIN}/widgetScript.js"></script>`;

        return {
            script,
            embedLink,
            iFrame,
            callback: `${script}\n\n${callback}`
        };
    };

    const renderSidebarItems = () => {
        return (
            <div>
                <div className={"border-b p-4 space-y-6"}>
                    <div className={"space-y-4"}>
                        <div className={"space-y-2"}>
                            <Label className={"text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                            <Input
                                value={widgetsSetting?.name}
                                onChange={(e) => onChange("name", e.target.value)}
                                className={"text-sm font-normal w-full h-auto"}
                                autoFocus
                            />
                            {formError.name && (<span className="text-red-500 text-sm">{formError.name}</span>)}
                        </div>
                        {type !== "embed" && (
                            <div className={"flex gap-2"}>
                                {type !== "embed" && (
                                    <div className={"space-y-4 w-1/2"}>
                                        <div className={"space-y-2"}>
                                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive "}>Width</Label>
                                            {type === "popover" && (
                                                <Input
                                                    type={"number"}
                                                    value={widgetsSetting.popoverWidth}
                                                    min={0}
                                                    onChange={(e) => onChange("popoverWidth", e.target.value)}
                                                    className={"w-full"}
                                                />
                                            )}
                                            {type === "modal" && (
                                                <Input
                                                    type={"number"}
                                                    value={widgetsSetting.modalWidth}
                                                    min={0}
                                                    onChange={(e) => onChange("modalWidth", e.target.value)}
                                                    className={"w-full"}
                                                />
                                            )}
                                            {type === "sidebar" && (
                                                <Input
                                                    type={"number"}
                                                    value={widgetsSetting.sidebarWidth}
                                                    min={0}
                                                    onChange={(e) => onChange("sidebarWidth", e.target.value)}
                                                    className={"w-full"}
                                                />
                                            )}
                                            {type === "popover" && formError.popoverWidth && (<span className="text-red-500 text-sm">{formError.popoverWidth}</span>)}

                                            {type === "modal" && formError.modalWidth && (<span className="text-red-500 text-sm">{formError.modalWidth}</span>)}

                                            {type === "sidebar" && formError.sidebarWidth && (<span className="text-red-500 text-sm">{formError.sidebarWidth}</span>)}
                                        </div>
                                    </div>
                                )}
                                {(type === "popover" || type === "modal") && (
                                    <div className={"space-y-2 w-1/2"}>
                                        <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Height</Label>
                                        {type === "modal" && (
                                            <Input
                                                type={"number"}
                                                value={widgetsSetting.modalHeight}
                                                min={0}
                                                onChange={(e) => onChange("modalHeight", e.target.value)}
                                                className={"w-full"}
                                            />
                                        )}
                                        {type === "popover" && (
                                            <Input
                                                type={"number"}
                                                value={widgetsSetting.popoverHeight}
                                                min={0}
                                                onChange={(e) => onChange("popoverHeight", e.target.value)}
                                                className={"w-full"}
                                            />
                                        )}
                                        {type === "popover" && formError.popoverHeight && (<span className="text-red-500 text-sm">{formError.popoverHeight}</span>)}

                                        {type === "modal" && formError.modalHeight && (<span className="text-red-500 text-sm">{formError.modalHeight}</span>)}
                                    </div>
                                )}
                                {type === "sidebar" && (
                                    <div className={"space-y-2 w-1/2"}>
                                        <Label className={"font-medium"}>Position</Label>
                                        <Select onValueChange={(value) => onChange("sidebarPosition", value)} value={widgetsSetting.sidebarPosition}>
                                            <SelectTrigger><SelectValue placeholder={1}/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={1}>Left</SelectItem>
                                                <SelectItem value={2}>Right</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={"font-medium border-b px-4 py-3"}>Sections</div>
                <div className={"px-4 py-3 space-y-4 border-b"}>
                        <div className={'space-y-0.5'}>
                                <Label className={"font-medium"}>Widget Layout</Label>
                                <Select value={widgetsSetting.viewType}
                                    onValueChange={(value) => onChange("viewType", value)}
                                >
                                    <SelectTrigger><SelectValue placeholder={'Select Layout'}/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={1}>ShadCN UI</SelectItem>
                                        <SelectItem value={2}>Polaris UI</SelectItem>
                                    </SelectContent>
                                </Select>
                        </div>
                    <div className={"space-y-2"}>
                        <div className={"flex gap-2 items-center"}>
                            <Checkbox id={"hideHeader"} checked={widgetsSetting.hideHeader === false}
                                onCheckedChange={(checked) => onChangeCheckBox("hideHeader", !checked)}
                            />
                            <label htmlFor="hideHeader" className="text-sm font-medium">Show Header</label>
                        </div>
                    </div>

                    <ToggleGroup type="single" className={"justify-between gap-2"} value={selectedToggle} onValueChange={handleToggle}>
                        <ToggleGroupItem value="feedback" className={`w-full px-[9px] h-8 text-[12px] ${selectedToggle === "feedback" ? "bg-muted" : ""}`}>Feedback</ToggleGroupItem>
                        <ToggleGroupItem value="roadmap" className={`w-full px-[9px] h-8 text-[12px] ${selectedToggle === "roadmap" ? "bg-muted" : ""}`}>Roadmap</ToggleGroupItem>
                        <ToggleGroupItem value="changelog" className={`w-full px-[9px] h-8 text-[12px] ${selectedToggle === "changelog" ? "bg-muted" : ""}`}>Changelog</ToggleGroupItem>
                        <ToggleGroupItem value="documents" className={`w-full px-[9px] h-8 text-[12px] ${selectedToggle === "documents" ? "bg-muted" : ""}`}>Docs</ToggleGroupItem>
                    </ToggleGroup>

                    {/* Content for Ideas */}
                    {selectedToggle === "feedback" && (
                        <div className="space-y-2.5">
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isIdea"} checked={widgetsSetting.isIdea}
                                    onCheckedChange={(checked) => onChangeCheckBox("isIdea", checked)}
                                />
                                <label htmlFor="isIdea" className="text-sm font-medium">Show Feedback</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox disabled={widgetsSetting.isIdea !== true} id={"ideaDescription"}
                                          checked={widgetsSetting.ideaDescription}
                                          onCheckedChange={(checked) => onChangeCheckBox("ideaDescription", checked)}
                                />
                                <label htmlFor="ideaDescription" className="text-sm font-medium">Show Description</label>
                            </div>
                            <div className={'space-y-0.5'}>
                                <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                                <Input value={widgetsSetting.ideaTitle}
                                    disabled={widgetsSetting.isIdea !== true} placeholder={'Enter title'}
                                    onChange={(e) => onChange("ideaTitle", e.target.value)}
                                />
                                {formError.ideaTitle && (<span className="text-red-500 text-sm">{formError.ideaTitle}</span>)}
                            </div>

                            <div className={'space-y-0.5'}>
                                <Label className={"font-medium"} htmlFor={'ideaDescriptionText'}>Description</Label>
                                <Input id={'ideaDescriptionText'} value={widgetsSetting.ideaDescriptionText}
                                       disabled={widgetsSetting.isIdea !== true} placeholder={'Enter description'}
                                       onChange={(e) => onChange("ideaDescriptionText", e.target.value)}
                                />
                            </div>

                            <div className={'space-y-0.5'}>
                                <Label className={"font-medium"}>Display</Label>
                                <Select value={widgetsSetting.ideaDisplay} disabled={widgetsSetting.isIdea !== true}
                                    onValueChange={(value) => onChange("ideaDisplay", value)}
                                >
                                    <SelectTrigger><SelectValue placeholder={1}/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={1}>In Widget</SelectItem>
                                        <SelectItem value={2}>Link to Platform</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs font-normal text-muted-foreground pt-1">How should Feedback be displayed?</p>
                            </div>
                        </div>
                    )}

                    {/* Content for Announcement */}
                    {selectedToggle === "changelog" && (
                        <div className="space-y-2.5">
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isAnnouncement"} checked={widgetsSetting.isAnnouncement}
                                    onCheckedChange={(checked) => onChangeCheckBox("isAnnouncement", checked)}
                                />
                                <label htmlFor="isAnnouncement" className="text-sm font-medium">Show Changelog</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox disabled={widgetsSetting.isAnnouncement !== true} id={"announcementDescription"}
                                    checked={widgetsSetting.announcementDescription}
                                    onCheckedChange={(checked) => onChangeCheckBox("announcementDescription", checked)}
                                />
                                <label htmlFor="announcementDescription" className="text-sm font-medium">Show Description</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox disabled={widgetsSetting.isAnnouncement !== true} id={"announcementImage"}
                                    checked={widgetsSetting.announcementImage}
                                    onCheckedChange={(checked) => onChangeCheckBox("announcementImage", checked)}
                                />
                                <label htmlFor="announcementImage" className="text-sm font-medium">Show Image</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox disabled={widgetsSetting.isAnnouncement !== true} id={"changelogReaction"}
                                    checked={widgetsSetting.changelogReaction}
                                    onCheckedChange={(checked) => onChangeCheckBox("changelogReaction", checked)}
                                />
                                <label htmlFor="changelogReaction" className="text-sm font-medium">Show Reaction</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isComment"} disabled={widgetsSetting.isAnnouncement !== true}
                                    checked={widgetsSetting.isComment}
                                    onCheckedChange={(checked) => onChangeCheckBox("isComment", checked)}
                                />
                                <label htmlFor="isComment" className="text-sm font-medium">Show Feedback</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isShowAnnouncementFeedback"} disabled={widgetsSetting.isAnnouncement !== true || !widgetsSetting.isComment}
                                    checked={widgetsSetting.isShowAnnouncementFeedback}
                                    onCheckedChange={(checked) => onChangeCheckBox("isShowAnnouncementFeedback", checked)}
                                />
                                <label htmlFor="isShowAnnouncementFeedback" className="text-sm font-medium">Show Comment</label>
                            </div>
                            <div className="space-y-0.5">
                                <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                                <Input value={widgetsSetting.changelogTitle}
                                    disabled={widgetsSetting.isAnnouncement !== true} placeholder={'Enter title'}
                                    onChange={(e) => onChange("changelogTitle", e.target.value)}
                                />
                                {formError.changelogTitle && (<span className="text-red-500 text-sm">{formError.changelogTitle}</span>)}
                            </div>

                            <div className="space-y-0.5">
                                <Label className={"font-medium"}>Description</Label>
                                <Input value={widgetsSetting.announcementDescriptionText}
                                    disabled={widgetsSetting.isAnnouncement !== true} placeholder={'Enter description'}
                                    onChange={(e) => onChange("announcementDescriptionText", e.target.value)}
                                />
                            </div>

                            <div className="space-y-0.5">
                                <Label className={"font-medium"}>Display</Label>
                                <Select value={widgetsSetting.changelogDisplay} disabled={widgetsSetting.isAnnouncement !== true}
                                    onValueChange={(value) => onChange("changelogDisplay", value)}
                                >
                                    <SelectTrigger><SelectValue placeholder={1}/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={1}>In Widget</SelectItem>
                                        <SelectItem value={2}>Link to Platform</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs font-normal text-muted-foreground pt-1">How should Changelog be displayed?</p>
                            </div>
                        </div>
                    )}

                    {/* Content for Roadmap */}
                    {selectedToggle === "roadmap" && (
                        <div className="space-y-2.5">
                            {roadmapdata?.length ? (
                                <div className={"flex flex-col gap-2"}>
                                    <Label className={"font-medium"}>Choose Roadmap</Label>
                                    <Select value={widgetsSetting.roadmapId?.toString()} onValueChange={handleRoadmapSelect}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={'Select Roadmap'}>
                                                {roadmapdata?.find((item) => item.id === widgetsSetting.roadmapId)?.title || "Select Roadmap"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {roadmapdata?.map((item) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}
                                                        className="flex items-center gap-2  break-all md:w-[369px] w-[300px]"
                                                    >
                                                        {item.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isRoadmap"} checked={widgetsSetting.isRoadmap}
                                    onCheckedChange={(checked) => onChangeCheckBox("isRoadmap", checked)}
                                />
                                <label htmlFor="isRoadmap" className="text-sm font-medium">Show Roadmap</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isRoadmapDescription"} disabled={widgetsSetting.isRoadmap !== true}
                                    checked={widgetsSetting.isRoadmapDescription}
                                    onCheckedChange={(checked) => onChangeCheckBox("isRoadmapDescription", checked)}
                                />
                                <label htmlFor="isRoadmapDescription" className="text-sm font-medium">Show Description</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isRoadmapTags"} disabled={widgetsSetting.isRoadmap !== true}
                                    checked={widgetsSetting.isRoadmapTags}
                                    onCheckedChange={(checked) => onChangeCheckBox("isRoadmapTags", checked)}
                                />
                                <label htmlFor="isRoadmapTags" className="text-sm font-medium">Show Tags</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isRoadmapComments"} disabled={widgetsSetting.isRoadmap !== true}
                                    checked={widgetsSetting.isRoadmapComments}
                                    onCheckedChange={(checked) => onChangeCheckBox("isRoadmapComments", checked)}
                                />
                                <label htmlFor="isRoadmapComments" className="text-sm font-medium">Show Comments</label>
                            </div>
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox disabled={widgetsSetting.isRoadmap !== true} id={"roadmapImage"}
                                    checked={widgetsSetting.roadmapImage}
                                    onCheckedChange={(checked) => onChangeCheckBox("roadmapImage", checked)}
                                />
                                <label htmlFor="roadmapImage" className="text-sm font-medium">Show Image</label>
                            </div>
                            <div className="space-y-0.5">
                                <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                                <Input value={widgetsSetting.roadmapTitle}
                                    disabled={widgetsSetting.isRoadmap !== true} placeholder={'Enter title'}
                                    onChange={(e) => onChange("roadmapTitle", e.target.value)}
                                />
                                {formError.roadmapTitle && (<span className="text-red-500 text-sm">{formError.roadmapTitle}</span>)}
                            </div>
                            <div className="flex gap-2 items-center">
                                <Checkbox
                                    id={"isShowRoadmapDescription"}
                                    checked={widgetsSetting.isShowRoadmapDescription}
                                    onCheckedChange={(checked) => onChangeCheckBox("isShowRoadmapDescription", checked)}
                                />
                                <Label htmlFor={"isShowRoadmapDescription"} className={"font-medium"}>Show Roadmap Header Description</Label>
                                {/*<Input*/}
                                {/*    value={widgetsSetting.roadmapDescription}*/}
                                {/*    disabled={widgetsSetting.isRoadmap !== true} placeholder={'Enter description'}*/}
                                {/*    onChange={(e) => onChange("roadmapDescription", e.target.value)}*/}
                                {/*/>*/}
                            </div>
                            <div className="space-y-0.5">
                                <Label className={"font-medium"}>Display</Label>
                                <Select value={widgetsSetting.roadmapDisplay} disabled={widgetsSetting.isRoadmap !== true}
                                    onValueChange={(value) => onChange("roadmapDisplay", value)}
                                >
                                    <SelectTrigger><SelectValue placeholder={1}/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={1}>In Widget</SelectItem>
                                        <SelectItem value={2}>Link to Platform</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs font-normal text-muted-foreground pt-1">How should the Roadmap be displayed?</p>
                            </div>
                        </div>
                    )}

                    {/* Content for docs */}
                    {selectedToggle === "documents" && (
                        <div className="space-y-2.5">
                            <div className={"flex gap-2 items-center"}>
                                <Checkbox id={"isDocument"} checked={widgetsSetting.isDocument}
                                    onCheckedChange={(checked) => onChangeCheckBox("isDocument", checked)}
                                />
                                <label htmlFor="isDocument" className="text-sm font-medium">Show Documents</label>
                            </div>

                            <div className="space-y-0.5">
                                <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                                <Input value={widgetsSetting.documentTitle}
                                    disabled={widgetsSetting.isDocument !== true} placeholder={'Enter title'}
                                    onChange={(e) => onChange("documentTitle", e.target.value)}
                                />
                                {formError.documentTitle && (<span className="text-red-500 text-sm">{formError.documentTitle}</span>)}
                            </div>

                            <div className="space-y-0.5">
                                <Label className={"font-medium"}>Documents Header Title</Label>
                                <Input value={widgetsSetting.documentSubTitle} disabled={widgetsSetting.isDocument !== true}
                                    placeholder={'Enter header title'}
                                    onChange={(e) => onChange("documentSubTitle", e.target.value)}
                                />
                            </div>

                            <div className="space-y-0.5">
                                <Label className={"font-medium"}>Description</Label>
                                <Input value={widgetsSetting.documentDescription}
                                    disabled={widgetsSetting.isDocument !== true} placeholder={'Enter description'}
                                    onChange={(e) => onChange("documentDescription", e.target.value)}
                                />
                            </div>

                            <div className="space-y-0.5">
                                <Label className={"font-medium"}>Display</Label>
                                <Select value={widgetsSetting.documentDisplay} disabled={widgetsSetting.isDocument !== true}
                                    onValueChange={(value) => onChange("documentDisplay", value)}
                                >
                                    <SelectTrigger><SelectValue placeholder={1}/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={1}>In Widget</SelectItem>
                                        <SelectItem value={2}>Link to Platform</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs font-normal text-muted-foreground pt-1">How should Documents be displayed?</p>
                            </div>
                        </div>
                    )}
                </div>

                <Accordion type="multiple" collapsible={'true'} className="w-full">
                    {type !== "embed" && (
                        <Fragment>
                            <AccordionItem value="LauncherType">
                                <AccordionTrigger className={'px-4 w-full'} dropDownIcon>Launcher Type</AccordionTrigger>
                                <AccordionContent>
                                    <div className={"px-4"}>
                                        <div className={"flex flex-col gap-4"}>
                                            <div className={"flex gap-2 items-center"}>
                                                <Checkbox id={"isLauncherIcon"} checked={widgetsSetting.isLauncherIcon}
                                                    onCheckedChange={(checked) => onChangeCheckBox("isLauncherIcon", checked)}
                                                />
                                                <label htmlFor="isLauncherIcon" className="text-sm font-medium">Show Launcher Icon</label>
                                            </div>
                                            {widgetsSetting.isLauncherIcon && (
                                                <Fragment>
                                                    <div className={"flex gap-2"}>
                                                        <div className={"space-y-0.5 w-1/2"}>
                                                            <Label className={"font-medium"}>Icon</Label>
                                                            <Select
                                                                onValueChange={(value) => onChange("launcherIcon", value)}
                                                                value={widgetsSetting.launcherIcon}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={widgetsSetting?.launcherIcon}/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="bolt">Bolt</SelectItem>
                                                                    <SelectItem value="roadmap">Roadmap</SelectItem>
                                                                    <SelectItem value="idea">Feedback</SelectItem>
                                                                    <SelectItem value="announcement">Changelog</SelectItem>
                                                                    <SelectItem value="document">Document</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className={"space-y-0.5 w-1/2"}>
                                                            <Label className={"font-medium"}>Position</Label>
                                                            <Select value={widgetsSetting.launcherPosition}
                                                                onValueChange={(value) => onChange("launcherPosition", value)}
                                                            >
                                                                <SelectTrigger className=""><SelectValue placeholder={1}/></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={1}>Bottom Left</SelectItem>
                                                                    <SelectItem value={2}>Bottom Right</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    {widgetsSetting.launcherPosition === 1 && (
                                                        <div className={"space-y-0.5"}>
                                                            <Label className={"font-medium"}>Left Spacing</Label>
                                                            <Input value={widgetsSetting.launcherLeftSpacing}
                                                                type="number" min={0} placeholder="1 px"
                                                                onChange={(e) => onChange("launcherLeftSpacing", e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                    {widgetsSetting.launcherPosition === 2 && (
                                                        <div className={"space-y-0.5"}>
                                                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Right Spacing</Label>
                                                            <Input value={widgetsSetting.launcherRightSpacing}
                                                                type="number" min={0} placeholder="1 px"
                                                                onChange={(e) => onChange("launcherRightSpacing", e.target.value)}
                                                            />
                                                            {formError.launcherRightSpacing && (<span className="text-red-500 text-sm">{formError.launcherRightSpacing}</span>)}
                                                        </div>
                                                    )}
                                                    <div className={"space-y-0.5"}>
                                                        <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Bottom Spacing</Label>
                                                        <Input value={widgetsSetting.launcherBottomSpacing}
                                                            type="number" min={0} placeholder="1 px"
                                                            onChange={(e) => onChange("launcherBottomSpacing", e.target.value)}
                                                        />
                                                        {formError.launcherBottomSpacing && (<span className="text-red-500 text-sm">{formError.launcherBottomSpacing}</span>)}
                                                    </div>

                                                    <div className={"widget-color-picker space-y-0.5"}>
                                                        <Label className={"font-medium"}>Background Color</Label>
                                                        <ColorInput name={"launcherIconBgColor"}
                                                            value={widgetsSetting.launcherIconBgColor}
                                                            onChange={(value) => onChange("launcherIconBgColor", value)}
                                                        />
                                                    </div>

                                                    <div className={"widget-color-picker space-y-0.5"}>
                                                        <Label className={"font-medium"}>Icon Color</Label>
                                                        <ColorInput name={"launcherIconColor"}
                                                            value={widgetsSetting.launcherIconColor}
                                                            onChange={(value) => onChange("launcherIconColor", value)}
                                                        />
                                                    </div>
                                                </Fragment>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Fragment>
                    )}

                    {widgetsSetting.viewType === 1 ? (!widgetsSetting?.hideHeader) &&
                    <AccordionItem value="advanced">
                        <AccordionTrigger className={'px-4 w-full'} dropDownIcon>Advanced</AccordionTrigger>
                        <AccordionContent>
                            <div className={"px-4 space-y-4"}>
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Header Background Color</Label>
                                    <ColorInput name={"headerBgColor"}
                                        onChange={(value) => onChange("headerBgColor", value)}
                                        value={widgetsSetting.headerBgColor}
                                    />
                                </div>
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Header Text Color</Label>
                                    <ColorInput name={"headerTextColor"}
                                        onChange={(value) => onChange("headerTextColor", value)}
                                        value={widgetsSetting.headerTextColor}
                                    />
                                </div>
                                {
                                    (projectDetailsReducer && projectDetailsReducer?.logo) ? "" :
                                        <div className={"widget-color-picker space-y-0.5"}>
                                            <Label className={"font-medium"}>Project Title Color</Label>
                                            <ColorInput name={"headerProjectTitleColor"}
                                                onChange={(value) => onChange("headerProjectTitleColor", value)}
                                                value={widgetsSetting.headerProjectTitleColor}
                                            />
                                        </div>
                                }
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Active Tab Text Color</Label>
                                    <ColorInput name={"headerActiveTabColor"}
                                        onChange={(value) => onChange("headerActiveTabColor", value)}
                                        value={widgetsSetting.headerActiveTabColor}
                                    />
                                </div>
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Button Background Color</Label>
                                    <ColorInput name={"headerBtnBackgroundColor"}
                                        onChange={(value) => onChange("headerBtnBackgroundColor", value)}
                                        value={widgetsSetting.headerBtnBackgroundColor}
                                    />
                                </div>
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Button Text Color</Label>
                                    <ColorInput name={"headerBtnTextColor"}
                                        onChange={(value) => onChange("headerBtnTextColor", value)}
                                        value={widgetsSetting.headerBtnTextColor}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem> : ""
                    }

                    {
                        selectedToggle === "feedback" &&
                        <AccordionItem value="feedback">
                            <AccordionTrigger className={'px-4 w-full'} dropDownIcon>Add Feedback CTA</AccordionTrigger>
                            <AccordionContent>
                                <div className="px-4 space-y-0.5">
                                    <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Button Label</Label>
                                    <Input value={widgetsSetting.ideaButtonLabel}
                                        name="ideaButtonLabel"
                                        disabled={widgetsSetting.isIdea !== true}
                                        onChange={(e) => onChange("ideaButtonLabel", e.target.value)}
                                    />
                                    {formError.ideaButtonLabel && (<span className="text-red-500 text-sm">{formError.ideaButtonLabel}</span>)}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    }

                    {
                        widgetsSetting.viewType === 1 ?
                        <AccordionItem value="global-color">
                        <AccordionTrigger className={'px-4 w-full'} dropDownIcon>Global Color</AccordionTrigger>
                        <AccordionContent>
                            <div className={"px-4 space-y-3"}>
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Button Background Color</Label>
                                    <ColorInput name={"btnBackgroundColor"}
                                        onChange={(value) => onChange("btnBackgroundColor", value)}
                                        value={widgetsSetting.btnBackgroundColor}
                                    />
                                </div>
                                <div className={"widget-color-picker space-y-0.5"}>
                                    <Label className={"font-medium"}>Button Text Color</Label>
                                    <ColorInput name={"btnTextColor"}
                                        onChange={(value) => onChange("btnTextColor", value)}
                                        value={widgetsSetting.btnTextColor}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem> : ""
                    }
                    
                </Accordion>
            </div>
        );
    };

    useEffect(() => {
        if(openCopyCode){
            setToggle(false)
        }
    },[openCopyCode])

    const onToggle = () => {
        setToggle(!toggle);
    };

    const handleCancel = () => {
        setWidgetsSetting(initialState);
        navigate(`${baseUrl}/widget`);
    };

    const launcherIcon = {
        bolt: (
            <svg fill="#fff" width="20" height="20" viewBox="0 0 32 32">
                <path
                    d="m6.98592 18.5024h7.60558l-4.014 10.8001c-.5212 1.4026.9155 2.132 1.845.9959l12.2254-15.1623c.2394-.2946.3521-.5611.3521-.8696 0-.519-.3944-.9117-.9718-.9117h-7.6057l4.0141-10.80017c.5211-1.40262-.9296-2.131982-1.8451-.99586l-12.2253 15.16233c-.23944.2945-.3662.561-.3662.8696 0 .5189.40845.9117.98592.9117z"
                    fill={widgetsSetting?.launcherIconColor}
                />
            </svg>
        ),
        roadmap: (
            <svg width="20" height="20" viewBox="0 0 14 16" fill="none">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.743328 1.66619C0.855828 1.24514 1.11112 0.876257 1.46554 0.62263C1.81996 0.369002 2.25148 0.246389 2.68631 0.275761C3.12114 0.305133 3.53226 0.484665 3.84935 0.783651C4.16644 1.08264 4.36981 1.4825 4.42466 1.91486L11.018 3.68152C11.396 3.77801 11.751 3.94854 12.0626 4.18325C12.3742 4.41796 12.6361 4.71217 12.8331 5.04883C13.0301 5.38549 13.1584 5.75791 13.2105 6.14451C13.2625 6.53111 13.2373 6.92419 13.1364 7.30098C13.0354 7.67777 12.8607 8.03078 12.6223 8.33955C12.3839 8.64831 12.0866 8.90669 11.7476 9.09972C11.4086 9.29274 11.0347 9.41657 10.6475 9.46403C10.2603 9.51149 9.86756 9.48163 9.49199 9.37619L3.97866 7.89886C3.60524 7.79878 3.20735 7.85115 2.87254 8.04444C2.53772 8.23773 2.2934 8.5561 2.19333 8.92953C2.09325 9.30295 2.14562 9.70084 2.33891 10.0357C2.53219 10.3705 2.85057 10.6148 3.22399 10.7149L9.55866 12.4115C9.82827 12.0641 10.2111 11.8222 10.6407 11.7278C11.0702 11.6335 11.5192 11.6927 11.9096 11.8952C12.3 12.0977 12.607 12.4307 12.7773 12.8361C12.9476 13.2416 12.9703 13.6939 12.8416 14.1144C12.7128 14.5349 12.4407 14.897 12.0726 15.1376C11.7046 15.3783 11.2637 15.4823 10.8269 15.4315C10.3901 15.3807 9.98487 15.1784 9.68178 14.8598C9.37868 14.5412 9.19687 14.1263 9.16799 13.6875L2.87999 12.0022C2.16506 11.8106 1.55551 11.3429 1.18544 10.7019C0.815365 10.0609 0.715086 9.29913 0.906661 8.58419C1.09824 7.86926 1.56597 7.25971 2.20697 6.88963C2.84797 6.51956 3.60973 6.41928 4.32466 6.61086L9.83799 8.08819C10.0444 8.14821 10.2607 8.16642 10.4742 8.14175C10.6877 8.11709 10.8941 8.05004 11.0814 7.94454C11.2687 7.83905 11.433 7.69722 11.5647 7.52739C11.6965 7.35756 11.793 7.16313 11.8486 6.95552C11.9042 6.7479 11.9178 6.53127 11.8886 6.31833C11.8594 6.10539 11.7879 5.90042 11.6785 5.71545C11.569 5.53047 11.4237 5.36922 11.2511 5.24113C11.0785 5.11304 10.8821 5.0207 10.6733 4.96953L4.11333 3.21219C3.86279 3.57844 3.49082 3.84431 3.06318 3.96278C2.63554 4.08125 2.17978 4.04469 1.7765 3.85956C1.37321 3.67444 1.04838 3.35267 0.859431 2.95117C0.670483 2.54966 0.629594 2.09427 0.743994 1.66553L0.743328 1.66619Z"
                    fill={widgetsSetting?.launcherIconColor}
                />
            </svg>
        ),
        idea: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path
                    d="M11.19 1.64922L12.0133 0.309221C12.059 0.234503 12.119 0.169547 12.1898 0.118085C12.2607 0.0666235 12.341 0.0296712 12.4262 0.0093514C12.5114 -0.0109684 12.5998 -0.0142549 12.6862 -0.000319406C12.7727 0.0136161 12.8555 0.044499 12.93 0.0905545C13.0047 0.13629 13.0695 0.196308 13.121 0.26717C13.1724 0.338032 13.2093 0.418343 13.2296 0.503501C13.2499 0.588659 13.2532 0.676988 13.2393 0.763427C13.2254 0.849865 13.1946 0.932713 13.1487 1.00722L12.3253 2.34722C12.2797 2.42199 12.2198 2.48701 12.1489 2.53854C12.0781 2.59007 11.9978 2.62709 11.9126 2.64747C11.8274 2.66785 11.739 2.6712 11.6526 2.65731C11.5661 2.64342 11.4832 2.61258 11.4087 2.56656C11.334 2.52082 11.2691 2.4608 11.2177 2.38994C11.1663 2.31908 11.1294 2.23877 11.1091 2.15361C11.0888 2.06845 11.0854 1.98012 11.0993 1.89368C11.1132 1.80724 11.144 1.72373 11.19 1.64922ZM3.618 2.34656C3.66241 2.42379 3.72186 2.49134 3.79282 2.54521C3.86378 2.59909 3.94482 2.63819 4.03115 2.66021C4.11748 2.68223 4.20735 2.68672 4.29545 2.67342C4.38354 2.66012 4.46808 2.6293 4.54406 2.58278C4.62004 2.53625 4.68593 2.47497 4.73782 2.40255C4.78972 2.33013 4.82657 2.24804 4.84621 2.16114C4.86584 2.07423 4.86786 1.98427 4.85213 1.89658C4.83641 1.80888 4.80327 1.72523 4.75467 1.65056L3.93267 0.309888C3.83891 0.162083 3.69079 0.0570779 3.52028 0.017543C3.34978 -0.021992 3.17056 0.00711512 3.02133 0.09858C2.87209 0.190045 2.76482 0.33653 2.72266 0.506408C2.6805 0.676287 2.70684 0.855931 2.796 1.00655L3.618 2.34656ZM2.16067 3.81856L0.961999 3.24456C0.883129 3.20647 0.797503 3.18436 0.710052 3.17951C0.622602 3.17465 0.535055 3.18715 0.452454 3.21627C0.369853 3.24539 0.29383 3.29057 0.228763 3.3492C0.163696 3.40783 0.110872 3.47876 0.0733322 3.55789C0.0355152 3.63681 0.0136218 3.7224 0.00890339 3.80979C0.00418499 3.89717 0.0167341 3.98463 0.0458335 4.06716C0.0749328 4.14969 0.120012 4.22567 0.178494 4.29077C0.236976 4.35587 0.307714 4.40881 0.386666 4.44656L1.58533 5.02056C1.66419 5.05849 1.74976 5.08049 1.83714 5.0853C1.92452 5.09011 2.01198 5.07763 2.09453 5.04859C2.17708 5.01954 2.25309 4.9745 2.3182 4.91604C2.38332 4.85758 2.43626 4.78684 2.474 4.70789C2.51182 4.62897 2.53371 4.54338 2.53843 4.45599C2.54315 4.36861 2.5306 4.28115 2.5015 4.19862C2.4724 4.11609 2.42732 4.0401 2.36884 3.975C2.31036 3.9099 2.23962 3.8563 2.16067 3.81856ZM7.90933 2.66722C4.23333 2.72789 1.32 6.71189 3.316 10.5492C3.61933 11.1319 4.06933 11.6199 4.55267 12.0646C4.736 12.2332 4.878 12.4419 4.99933 12.6659H7.33333V9.20989C6.94451 9.07284 6.60763 8.81882 6.36891 8.4827C6.13018 8.14658 6.00132 7.74482 6 7.33256C6 7.15575 6.07024 6.98618 6.19526 6.86115C6.32029 6.73613 6.48985 6.66589 6.66667 6.66589C6.84348 6.66589 7.01305 6.73613 7.13807 6.86115C7.26309 6.98618 7.33333 7.15575 7.33333 7.33256C7.33333 7.50937 7.40357 7.67894 7.52859 7.80396C7.65362 7.92899 7.82319 7.99922 8 7.99922C8.17681 7.99922 8.34638 7.92899 8.4714 7.80396C8.59643 7.67894 8.66667 7.50937 8.66667 7.33256C8.66667 7.15575 8.7369 6.98618 8.86193 6.86115C8.98695 6.73613 9.15652 6.66589 9.33333 6.66589C9.51014 6.66589 9.67971 6.73613 9.80474 6.86115C9.92976 6.98618 10 7.15575 10 7.33256C9.99868 7.74482 9.86981 8.14658 9.63109 8.4827C9.39237 8.81882 9.05549 9.07284 8.66667 9.20989V12.6659H10.9787C11.1307 12.4052 11.3267 12.1592 11.5833 11.9452C12.0227 11.5786 12.436 11.1699 12.69 10.6572C13.848 8.31522 13.3887 5.81789 11.7393 4.19656C11.2354 3.6987 10.6369 3.30682 9.97913 3.04404C9.32133 2.78127 8.61755 2.65358 7.90933 2.66722ZM5.328 14.1852C5.27467 15.1626 6.00667 15.9999 6.98533 15.9999H8.99933C9.2182 15.9999 9.43493 15.9568 9.63714 15.873C9.83935 15.7893 10.0231 15.6665 10.1778 15.5117C10.3326 15.357 10.4554 15.1732 10.5391 14.971C10.6229 14.7688 10.666 14.5521 10.666 14.3332V13.9999H5.32067C5.32067 14.0626 5.332 14.1212 5.328 14.1852ZM15.942 3.53322C15.9062 3.45332 15.8549 3.38129 15.7912 3.32125C15.7275 3.26122 15.6525 3.21437 15.5706 3.1834C15.4887 3.15242 15.4015 3.13794 15.314 3.14077C15.2265 3.1436 15.1404 3.16369 15.0607 3.19989L13.7727 3.78122C13.6899 3.81521 13.6149 3.86551 13.552 3.92912C13.4891 3.99273 13.4396 4.06835 13.4065 4.15147C13.3735 4.23459 13.3575 4.32352 13.3595 4.41295C13.3615 4.50239 13.3815 4.5905 13.4183 4.67204C13.4551 4.75359 13.5079 4.82689 13.5736 4.88759C13.6393 4.94829 13.7166 4.99515 13.8008 5.02537C13.885 5.05558 13.9744 5.06855 14.0637 5.06348C14.153 5.05842 14.2404 5.03543 14.3207 4.99589L15.6087 4.41456C15.6885 4.37867 15.7605 4.32739 15.8205 4.26364C15.8804 4.19989 15.9273 4.12494 15.9582 4.04306C15.9892 3.96119 16.0037 3.87401 16.0009 3.78653C15.9981 3.69904 15.9781 3.61296 15.942 3.53322Z"
                    fill={widgetsSetting?.launcherIconColor}
                />
            </svg>
        ),
        announcement: (
            <svg width="20" height="20" viewBox="0 0 16 12" fill="none">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.15825 8.58002L5.47465 10.8601C5.66003 11.1812 5.549 11.5956 5.2279 11.781C4.90681 11.9663 4.49244 11.8553 4.30703 11.5342L2.81931 8.95739C3.26575 8.83255 3.71069 8.70092 4.15822 8.57999L4.15825 8.58002ZM13.4787 6.20083C13.461 6.19065 13.4454 6.17708 13.433 6.1609C13.4205 6.14471 13.4113 6.12623 13.406 6.10651C13.4007 6.08679 13.3993 6.06621 13.4019 6.04595C13.4045 6.02568 13.4111 6.00614 13.4213 5.98842C13.4315 5.97071 13.4451 5.95517 13.4612 5.9427C13.4774 5.93023 13.4959 5.92107 13.5156 5.91575C13.5354 5.91042 13.5559 5.90903 13.5762 5.91165C13.5965 5.91428 13.616 5.92087 13.6337 5.93105L15.0671 6.75861C15.0848 6.76879 15.1003 6.78236 15.1128 6.79854C15.1253 6.81473 15.1344 6.83321 15.1398 6.85293C15.1451 6.87266 15.1465 6.89324 15.1439 6.9135C15.1412 6.93376 15.1346 6.9533 15.1245 6.97102C15.1143 6.98873 15.1007 7.00427 15.0845 7.01674C15.0684 7.02921 15.0499 7.03837 15.0301 7.0437C15.0104 7.04902 14.9898 7.05041 14.9696 7.04779C14.9493 7.04516 14.9298 7.03857 14.9121 7.02839L13.4787 6.20083ZM12.7127 2.49189C12.7025 2.50961 12.6889 2.52514 12.6727 2.53761C12.6565 2.55008 12.6381 2.55924 12.6183 2.56457C12.5986 2.5699 12.578 2.57129 12.5578 2.56866C12.5375 2.56604 12.518 2.55945 12.5002 2.54927C12.4825 2.53909 12.467 2.52552 12.4545 2.50934C12.4421 2.49315 12.4329 2.47467 12.4276 2.45495C12.4222 2.43522 12.4209 2.41464 12.4235 2.39438C12.4261 2.37412 12.4327 2.35458 12.4429 2.33686L13.2704 0.903486C13.291 0.867711 13.3249 0.841568 13.3648 0.830808C13.4046 0.820048 13.4471 0.825553 13.4828 0.846111C13.5186 0.86667 13.5448 0.900598 13.5555 0.940432C13.5663 0.980266 13.5608 1.02274 13.5402 1.05852L12.7127 2.49189ZM13.8635 4.18827C13.8437 4.19356 13.8231 4.1949 13.8028 4.19221C13.7825 4.18952 13.7629 4.18286 13.7451 4.1726C13.7274 4.16234 13.7119 4.14869 13.6994 4.13242C13.6869 4.11616 13.6778 4.0976 13.6725 4.0778C13.6672 4.058 13.6659 4.03736 13.6686 4.01704C13.6712 3.99673 13.6779 3.97714 13.6882 3.9594C13.6984 3.94167 13.7121 3.92612 13.7283 3.91366C13.7446 3.90119 13.7632 3.89206 13.783 3.88677L15.3817 3.45839C15.4015 3.4531 15.4221 3.45176 15.4424 3.45445C15.4628 3.45714 15.4823 3.4638 15.5001 3.47406C15.5178 3.48432 15.5334 3.49797 15.5458 3.51424C15.5583 3.5305 15.5674 3.54906 15.5727 3.56886C15.578 3.58866 15.5793 3.6093 15.5767 3.62962C15.574 3.64993 15.5673 3.66952 15.557 3.68726C15.5468 3.70499 15.5331 3.72054 15.5169 3.733C15.5006 3.74547 15.482 3.7546 15.4622 3.75989L13.8635 4.18827ZM9.39394 0.149768C9.07569 0.235049 8.88506 0.565174 8.97034 0.883424L11.1975 9.19546C11.2828 9.51371 11.6129 9.7043 11.9312 9.61905C12.2494 9.53377 12.44 9.20361 12.3548 8.88539L10.1276 0.57333C10.0423 0.255111 9.71219 0.0645177 9.39394 0.149768ZM4.8765 8.07789L4.05494 5.01183C3.23087 5.26717 2.38594 5.45196 1.55244 5.67527C0.735904 5.89405 0.246842 6.74111 0.480404 7.61271C0.713967 8.4843 1.561 8.97333 2.37753 8.75455C3.21106 8.53121 4.03512 8.26877 4.8765 8.07789ZM4.35234 4.91583C6.63315 4.14852 8.12178 2.86549 8.86487 1.69714L10.6993 8.54349C9.47162 7.90324 7.5409 7.53642 5.18203 8.0123L4.35234 4.9158V4.91583ZM11.2901 3.70424L12.0903 3.71133C12.1615 3.71195 12.2214 3.75833 12.2398 3.82714L12.5572 5.01146C12.5756 5.08024 12.5469 5.15033 12.4856 5.18652L11.7961 5.59274L11.2901 3.70424Z"
                    fill={widgetsSetting?.launcherIconColor}
                />
            </svg>
        ),
        document: (
            <svg width="38" height="38" viewBox="0 0 60 60" fill="none">
                <rect width="60" height="60" rx="30" fill={widgetsSetting.viewType === 1 ? widgetsSetting.launcherIconBgColor : '#000'}/>
                <g clipPath="url(#clip0_539_1760)">
                    <path d="M29.4637 35.9624C28.463 35.9624 27.6528 36.7964 27.6528 37.7972C27.6528 38.7741 28.4392 39.6319 29.4637 39.6319C30.4883 39.6319 31.2985 38.7742 31.2985 37.7972C31.2985 36.7964 30.4646 35.9624 29.4637 35.9624Z" fill={widgetsSetting?.launcherIconColor} />
                    <path d="M29.7737 22.0706C26.5569 22.0706 25.0796 23.9768 25.0796 25.2635C25.0796 26.1928 25.8659 26.6217 26.5093 26.6217C27.7959 26.6217 27.2717 24.787 29.7022 24.787C30.8936 24.787 31.8468 25.3112 31.8468 26.4073C31.8468 27.6941 30.5124 28.4327 29.726 29.0999C29.0351 29.6956 28.1296 30.6726 28.1296 32.7218C28.1296 33.9608 28.4631 34.3182 29.4401 34.3182C30.6077 34.3182 30.8459 33.7941 30.8459 33.3413C30.8459 32.1022 30.8698 31.3874 32.1804 30.3628C32.8237 29.8624 34.8491 28.2421 34.8491 26.0022C34.8491 23.7624 32.8237 22.0706 29.7737 22.0706Z" fill={widgetsSetting?.launcherIconColor}/>
                    <path d="M30 12.5C20.3282 12.5 12.5 20.3269 12.5 30V46.1328C12.5 46.8879 13.1121 47.5 13.8672 47.5H30C39.6717 47.5 47.5 39.6731 47.5 30C47.5 20.3282 39.6731 12.5 30 12.5ZM30 44.7656H15.2344V30C15.2344 21.8395 21.8384 15.2344 30 15.2344C38.1605 15.2344 44.7656 21.8384 44.7656 30C44.7656 38.1605 38.1616 44.7656 30 44.7656Z" fill={widgetsSetting?.launcherIconColor}/>
                </g>
                <defs>
                    <clipPath id="clip0_539_1760">
                        <rect width="35" height="35" fill={widgetsSetting?.launcherIconColor} transform="translate(12.5 12.5)"/>
                    </clipPath>
                </defs>
            </svg>
        ),
    };

    return (
        <Fragment>
            {
                openCopyCode && (
                    <Fragment>
                        <CopyCode
                            open={openCopyCode}
                            title={<div className={"flex items-center gap-2"}><img className={"w-[20px] h-[20px]"} src={partyPopper} alt={"partyPopper"}/> {`Your Widget Is Live!`}</div>}
                            description={"Choose how you’d like to embed your widget, then copy and paste the code on your site to display it."}
                            onClick={() => getCodeCopy()}
                            onOpenChange={setOpenCopyCode}
                            codeString={
                                selectedType === "script" ? getCodeStrings().script :
                                    selectedType === "embedlink" ? getCodeStrings().embedLink :
                                        selectedType === "iframe" ? getCodeStrings().iFrame :
                                            getCodeStrings().callback
                            }
                            handleCopyCode={() => handleCopyCode(
                                selectedType === "script" ? getCodeStrings().script :
                                    selectedType === "embedlink" ? getCodeStrings().embedLink :
                                        selectedType === "iframe" ? getCodeStrings().iFrame :
                                            getCodeStrings().callback
                            )}
                            isWidget={true}
                            setSelectedType={setSelectedType}
                            selectedType={selectedType}
                            isCancelBtn={false}
                        />
                    </Fragment>
                )
            }
            <div className={"p-4 md:py-6 md:px-4 border-b flex items-center justify-between flex-wrap gap-2"}>
                <Breadcrumb>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className={"cursor-pointer"}>
                                <BreadcrumbLink>
                                    <span className={"font-medium"} onClick={id === "new" ? () => navigate(`${baseUrl}/widget/type`) : () => navigate(`${baseUrl}/widget?pageNo=${getPageNo}`)}>
                                        {type === "embed" && "Embed Widget"}
                                        {type === "popover" && "Popover Widget"}
                                        {type === "modal" && "Modal Widget"}
                                        {type === "sidebar" && "Sidebar Widget"}
                                    </span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem className={"cursor-pointer"}>
                                <BreadcrumbPage className={"font-medium"}>
                                    {widgetsSetting.name}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </Breadcrumb>
                <div className={"hidden md:flex justify-between gap-2 items-center"}>
                    {id !== "new" ? (
                        <Button
                            variant="outline"
                            className={"w-9 h-9"}
                            size="icon"
                            onClick={() =>
                                navigate(`${baseUrl}/widget/analytic-view/${widgetsSetting?.id}?title=${widgetsSetting?.name}&type=${widgetsSetting?.type}`)
                            }
                        >
                            <BarChart size={16}/>
                        </Button>
                    ) : ("")}
                    <Button disabled={loading === "head"} className={"font-medium w-[115px] hover:bg-primary"} onClick={() => handleWidgetSave("head")}>
                        {loading === "head" ? (<Loader2 className="h-4 w-4 animate-spin"/>) : id === "new" ? ("Create Widget") : ("Save Changes")}
                    </Button>
                    <Button variant={"ghost hover-none"} className={"font-medium border border-primary text-primary"} onClick={handleCancel}>
                        Cancel
                    </Button>
                    {
                        id !== "new" && (
                            <Fragment>
                                <Button variant={"ghost hover-none"} className={"font-medium border border-destructive text-destructive"} onClick={() => setOpenDelete(true)}>
                                    <Trash2 size={16} className="mr-2" />
                                    Delete
                                </Button>

                                <DeleteDialog
                                    title="You really want to delete this Widget?"
                                    isOpen={openDelete}
                                    onOpenChange={() => setOpenDelete(false)}
                                    onDelete={deleteWidget}
                                    isDeleteLoading={isDeleteLoading}
                                    deleteRecord={id}
                                />
                            </Fragment>
                        )
                    }
                </div>
            </div>
            <div className={"flex flex-wrap md:flex-nowrap h-[calc(100%_-_85px)] overflow-y-auto"}>
                <div className={"max-w-[407px] w-full border-r h-full overflow-y-auto"}>
                    {renderSidebarItems()}
                    <div className={"px-4 py-6 flex justify-between gap-2 sticky bottom-0 top-full"}>
                        <Button disabled={loading === "side"} className={"font-medium w-[115px] hover:bg-primary"} onClick={() => handleWidgetSave("side")}>
                            {loading === "side" ? (<Loader2 className="h-4 w-4 animate-spin"/>) : id === "new" ? ("Create Widget") : ("Save Changes")}
                        </Button>
                        <Button variant={"ghost hover-none"} className={"font-medium border border-primary text-primary"} onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                </div>
                <div className={"bg-muted w-full h-[100vh] md:h-full overflow-y-auto relative"}>
                    {type !== "embed" && widgetsSetting?.isLauncherIcon && (
                        <div
                            className={`QH-floating-trigger ${openCopyCode ? "!z-50" : "!z-[99999999]"}`}
                            onClick={onToggle}
                            style={{
                                backgroundColor: widgetsSetting.viewType === 1 ? widgetsSetting.launcherIconBgColor : '#000',
                                left: widgetsSetting.launcherPosition === 1 ? type === "popover" ? `${widgetsSetting.launcherLeftSpacing || 20}px` : `${widgetsSetting.launcherLeftSpacing || 690}px` : "inherit",
                                right: widgetsSetting.launcherPosition === 2 ? `${widgetsSetting.launcherRightSpacing || 20}px` : "inherit",
                                bottom: widgetsSetting.launcherBottomSpacing ? `${widgetsSetting.launcherBottomSpacing}` : "20px",
                                position: type === "popover" || type === "sidebar" || type === "modal" ? "absolute" : "fixed",
                            }}
                        >
                            {launcherIcon[widgetsSetting.launcherIcon]}
                        </div>
                    )}
                    <WidgetPreview
                        roadmapdata={roadmapdata}
                        widgetsSetting={widgetsSetting}
                        type={type}
                        toggle={toggle}
                        onToggle={onToggle}
                        selected={selected}
                        setSelected={setSelected}
                    />
                </div>
            </div>
        </Fragment>
    );
};

export default UpdateWidget;
