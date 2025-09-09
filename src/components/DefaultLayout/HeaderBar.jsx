import React, { Fragment, useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import {
    Bell,
    ChevronsUpDown, CircleX,
    CreditCard,
    Info,
    Loader2,
    LogOut,
    Menu,
    Plus,
    Trash2, Upload,
    User,
    UserPlus2,
    X,
} from "lucide-react";
import { Input } from "../ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useTheme } from "../theme-provider";
import {
    apiService,
    baseUrl, DO_SPACES_ENDPOINT,
    getProjectDetails,
    logout,
    PROJECT_LIMITS,
    setProjectDetails, urlRegExp,
} from "../../utils/constent";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../utils/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../ui/command";
import { Label } from "../ui/label";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../ui/use-toast";
import { projectDetailsAction } from "../../redux/action/ProjectDetailsAction";
import { allProjectAction } from "../../redux/action/AllProjectAction";
import { allStatusAndTypesAction } from "../../redux/action/AllStatusAndTypesAction";
import DeleteDialog from "../Comman/DeleteDialog";
import TimezoneSelector from "../Comman/TimezoneSelector";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip.jsx";
import ProjectLimitErrorDialog from '../Comman/ProjectLimitErrorDialog';
import { useTour } from "../Comman/TourProvider";

const initialState = {
    id: "",
    browser: null,
    createdAt: "",
    email: "",
    firstName: "",
    ipAddress: null,
    jobTitle: "",
    lastName: "",
    profileImage: "",
    status: "1",
    updatedAt: "",
};

const initialStateProject = {
    name: "",
    website: "",
    languageId: "3",
    timezoneId: "90",
    logo: "",
    favicon: "",
    apiKey: "",
    status: "1",
    browser: "",
    ipAddress: "",
    domain: "",
    timezone: "",
};

const initialStateErrorProject = {
    name: "",
};

const HeaderBar = ({ setIsMobile }) => {
    const { onProModal, setIsOwnerLimit } = useTheme();
    let navigate = useNavigate();
    const dispatch = useDispatch();
    const { toast } = useToast();
    const { tourStep } = useTour();
    const userDetailsReducer = useSelector((state) => state.userDetailsReducer);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const allProjectReducer = useSelector((state) => state.allProjectReducer);
    const [userDetails, setUserDetails] = useState(initialState);
    const [createProjectDetails, setCreateProjectDetails] = useState(initialStateProject);
    const [formError, setFormError] = useState(initialStateErrorProject);
    const [projectList, setProjectList] = useState([]);
    const [open, setOpen] = useState(false);
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [scrollingDown, setScrollingDown] = useState(false);
    const [isOpenDeleteAlert, setIsOpenDeleteAlert] = useState(false);
    const [isDeleteLoading, setDeleteIsLoading] = useState(false);
    const [deleteProjectId, setDeleteProjectId] = useState(null);
    const [isCreateLoading, setIsCreateLoading] = useState(false);
    const [showProjectLimitDialog, setShowProjectLimitDialog] = useState(false);
    const [projectLimitDialogData, setProjectLimitDialogData] = useState({ userProjects: [], requiredDelete: 0 });
    const [selectedProjectsToDelete, setSelectedProjectsToDelete] = useState([]);
    const [deleteProjectsLoading, setDeleteProjectsLoading] = useState(false);
    const isTourActive = tourStep !== null && tourStep < 7;

    const userProjects =
        projectList?.filter((p) => p.userId == userDetailsReducer?.id) || [];

    const viewLink = () => {
        window.open(`https://${projectDetailsReducer.domain}/feedback`, "_blank");
    };

    const openSheet = () => {
        const userPlan = userDetailsReducer.plan;
        const projectLimit = PROJECT_LIMITS[userPlan ?? 0];
        const currentCount = userProjects.length;

        if (currentCount < projectLimit) {
            setSheetOpen(true);
            onProModal(false);
            setIsOwnerLimit(false);
        } else {
            onProModal(true);
            setIsOwnerLimit(true);
        }
    };

    const closeSheet = () => {
        if (projectList.length === 0) {
            return;
        }
        setSheetOpen(false);
        setCreateProjectDetails(initialStateProject);
        setFormError(initialStateErrorProject);
    };

    useEffect(() => {
        setUserDetails(userDetailsReducer);
    }, [userDetailsReducer]);

    useEffect(() => {
        getAllProjects();
    }, []);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllStatusAndTypes();
        }
    }, [projectDetailsReducer.id]);

    useEffect(() => {
        if (allProjectReducer.projectList) {
            setProjectList(allProjectReducer.projectList);
        }
    }, [allProjectReducer.projectList]);

    const getAllStatusAndTypes = async () => {
        if (projectDetailsReducer.id) {
            const data = await apiService.getAllStatusAndTypes(
                projectDetailsReducer.id
            );
            if (data.success) {
                dispatch(allStatusAndTypesAction({ ...data.data }));
            }
        }
    };

    const getAllProjects = async () => {
        const data = await apiService.getAllProjects();
        if (data.success) {
            const projects = data.data || [];
            if (projects.length > 0) {
                const projectsWithPlan = projects.map(project => ({
                    ...project,
                    plan: project.plan
                }));

                const localProject = getProjectDetails("");
                const projectFromAPI = projectsWithPlan.find((p) => p.id === localProject?.id);
                let selectedProject;
                if (projectFromAPI) {
                    selectedProject = projectFromAPI;
                } else {
                    selectedProject = projectsWithPlan[0];
                    setProjectDetails(selectedProject);
                }
                dispatch(projectDetailsAction(selectedProject));
                dispatch(allProjectAction({ projectList: projectsWithPlan }));
                const array = projectsWithPlan.map((x) => ({
                    ...x,
                }));
                setProjectList(array);
            } else {
                setSheetOpen(true);
            }
        }
    };

    const onRedirect = (link) => {
        navigate(`${baseUrl}${link}`);
    };

    const onLogout = async () => {
        document.querySelectorAll(".quickhunt").forEach((x) => {
            x.innerHTML = "";
        });
        logout();
        navigate(`${baseUrl}/login`);
    };

    const onChangeText = (name, value) => {
        const trimmedValue =
            name === "name" || name === "website" ? value.trimStart() : value;
        if (name === "name" || name === "domain") {
            const cleanDomain = (name) =>
                name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const sanitizedProjectName = cleanDomain(value);
            setCreateProjectDetails({
                ...createProjectDetails,
                [name]: trimmedValue,
                domain: sanitizedProjectName,
            });
        } else {
            setCreateProjectDetails({
                ...createProjectDetails,
                [name]: trimmedValue,
            });
        }
        setFormError((formError) => ({
            ...formError,
            [name]: "",
        }));
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "name":
                if (!value || value.trim() === "") {
                    return "Project name is required";
                } else if (value.length > 250) {
                    return "Project name must be less than or equal to 250 characters.";
                } else {
                    return "";
                }
            case "timezone":
                if (!value || value.trim() === "") {
                    return "Time zone is required";
                } else {
                    return "";
                }
            case "website":
                if (value && !value.match(urlRegExp)) {
                    return "Project URL is invalid";
                } else {
                    return "";
                }
            case "logo":
                if (value && value.size > 5 * 1024 * 1024) { // 5 MB
                    return "Image size must be less than 5 MB.";
                } else {
                    return "";
                }
            case "domain":
                if (!value || value.trim() === "") {
                    return "Project domain is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onCreateProject = async () => {
        setIsCreateLoading(true);
        let validationErrors = {};
        Object.keys(createProjectDetails).forEach((name) => {
            const error = formValidate(name, createProjectDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            setIsCreateLoading(false);
            return;
        }

        const cleanDomain = (name) => name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const sanitizedProjectName = cleanDomain(createProjectDetails.name);
        const domain = `${cleanDomain(createProjectDetails.domain || sanitizedProjectName)}.quickhunt.app`;

        const payload = {
            ...createProjectDetails,
            domain,
        };

        const data = await apiService.createProjects(payload, {}, true);
        setIsCreateLoading(false);
        if (data.success) {
            const clone = [...projectList];
            let obj = {
                ...data.data,
            };
            clone.push(obj);
            setProjectList(clone);
            dispatch(allProjectAction({ projectList: clone }));
            setProjectDetails(obj);
            dispatch(projectDetailsAction(obj));
            toast({ description: data.message });
            setCreateProjectDetails(initialStateProject);
            navigate(`${baseUrl}/dashboard`);
            setSheetOpen(false);
            closeSheet();
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const getPlanProjectLimit = (plan) => {
        const planLimits = { 0: 1, 1: 3, 2: 10, 3: 20 };
        return planLimits[plan] || 1;
    };

    const checkAndHandleProjectLimit = (nextProjectId = null) => {
        const userId = userDetailsReducer?.id;
        const allProjects = allProjectReducer.projectList || [];
        const userOwnedProjects = allProjects.filter(p => p.userId === userId);
        const plan = userDetailsReducer?.plan ?? 0;
        const limit = getPlanProjectLimit(plan);

        if (userOwnedProjects.length > limit) {
            const requiredDelete = userProjects.length - limit;
            setProjectLimitDialogData({
                userProjects: userOwnedProjects,
                message: `<div class="block text-sm font-normal text-gray-700 mt-1">You're downgrading to a plan that allows <strong>${limit} active projects.</strong><br />Currently, you have <strong>${userProjects.length} active projects.</strong> To proceed, please select <strong>${requiredDelete} projects to delete.</strong></div>`,
                requiredDelete,
            });
            setShowProjectLimitDialog(true);
            return false;
        }
        setShowProjectLimitDialog(false);
        return true;
    };

    const onChangeProject = (projectId) => {
        const allProjects = allProjectReducer.projectList || [];
        const selectedProject = allProjects.find(proj => proj.id === projectId);
        if (selectedProject) {
            if (userDetailsReducer?.id === selectedProject.userId) {
                const ok = checkAndHandleProjectLimit(projectId);
                if (!ok) return;
            }
            const projectWithPlan = {
                ...selectedProject,
                plan: selectedProject.plan
            };
            setProjectDetails(projectWithPlan);
            dispatch(projectDetailsAction(projectWithPlan));
        }
        navigate(`${baseUrl}/dashboard`);
    };

    const onProjectClick = (x) => {
        onChangeProject(x.id);
        setOpen(false);
    };

    const onCancel = () => {
        setCreateProjectDetails(initialStateProject);
        setFormError(initialStateErrorProject);
        closeSheet();
    };

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
            setScrollingDown(scrollTop > 5);
        };
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const deleteAlert = (proId) => {
        setIsOpenDeleteAlert(true);
        setDeleteProjectId(proId);
    };

    const onDelete = async () => {
        if (!deleteProjectId) return;
        setDeleteIsLoading(true);
        const data = await apiService.deleteProjects(deleteProjectId);
        setDeleteIsLoading(false);
        if (data.success) {
            const updatedProjects = allProjectReducer.projectList.filter(
                (project) => project.id != deleteProjectId
            );
            const nextProject = updatedProjects[0] || null;
            if (nextProject) {
                setProjectDetails(nextProject);
                dispatch(projectDetailsAction(nextProject));
            } else {
                setProjectDetails(null);
                dispatch(projectDetailsAction(null));
            }
            dispatch(allProjectAction({ projectList: updatedProjects }));
            setProjectList(updatedProjects);
            setIsOpenDeleteAlert(false);
            setDeleteProjectId(null);
            // setSheetOpen(true)
            navigate(`${baseUrl}/dashboard`);
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const dropDownItem = [
        {
            title: "Profile",
            onClick: () => navigate(`${baseUrl}/settings/profile`),
            icon: <User size={16} />,
        },
        {
            title: "Pricing",
            onClick: () => navigate(`${baseUrl}/pricing`),
            icon: <CreditCard size={16} />,
        },
        {
            title: "New Project",
            onClick: openSheet,
            icon: <Plus size={16} />,
        },
        {
            title: "Logout",
            onClick: onLogout,
            icon: <LogOut size={16} />,
        },
    ];

    const sheetCommInput = [
        {
            title: "Project Name",
            placeholder: "Enter your project name",
            className: `placeholder:text-muted-foreground/75`,
            name: "name",
        },
        {
            title: "Project Website",
            placeholder: "https://yourapp.com",
            className: `placeholder:text-muted-foreground/75`,
            name: "website",
        },
        {
            title: "Project Domain",
            placeholder: "Project domain",
            className: `placeholder:text-muted-foreground/75 pr-[115px]`,
            name: "domain",
            span: ".quickhunt.app",
        },
        {
            title: "Time Zone",
            name: "timezone",
            type: "select",
            tooltip: "Adjust your project’s time zone for proper scheduling and reports.",
        },
    ];

    const onDeleteImgLogo = async (name, value) => {
        setCreateProjectDetails({ ...createProjectDetails, [name]: value })
        setFormError(formError => ({ ...formError, logo: '' }));
    }

    const handleFileChange = (file) => {
        const selectedFile = file.target.files[0];
        setCreateProjectDetails({ ...createProjectDetails, logo: selectedFile });
        setFormError(formError => ({ ...formError, 'logo': formValidate('logo', selectedFile) }));
    };

    return (
        <header className={`z-50 sticky top-0 bg-primary ${scrollingDown ? "bg-background" : ""}`}>
            {isOpenDeleteAlert && (
                <DeleteDialog
                    title={"You really want to delete this Project ?"}
                    isOpen={isOpenDeleteAlert}
                    onOpenChange={() => setIsOpenDeleteAlert(false)}
                    onDelete={onDelete}
                    isDeleteLoading={isDeleteLoading}
                />
            )}

            <ProjectLimitErrorDialog
                open={showProjectLimitDialog}
                onClose={() => {
                    setShowProjectLimitDialog(false);
                    setSelectedProjectsToDelete([]);
                }} userProjects={projectLimitDialogData.userProjects}
                requiredDelete={projectLimitDialogData.requiredDelete}
                selectedProjects={selectedProjectsToDelete}
                setSelectedProjects={setSelectedProjectsToDelete}
                loading={deleteProjectsLoading}
                onDeleteProjects={async () => {
                    setDeleteProjectsLoading(true);
                    try {
                        await apiService.multiDeleteProjects({ projectIds: selectedProjectsToDelete });
                        const updatedProjects = projectList.filter(p => !selectedProjectsToDelete.includes(p.id));
                        setProjectList(updatedProjects);
                        dispatch(allProjectAction({ projectList: updatedProjects }));
                        setSelectedProjectsToDelete([]);

                        setShowProjectLimitDialog(false);
                        toast({ description: 'Selected projects deleted successfully.' });
                    } catch (e) {
                        toast({ variant: 'destructive', description: 'Failed to delete projects.' });
                    }
                    setDeleteProjectsLoading(false);
                }}
                message={projectLimitDialogData.message}
            />

            <div className={"w-full flex justify-between xl:justify-end items-center h-[56px] px-3"}>
                <div className={"flex justify-between items-center w-full h-full gap-2"}>
                    <div className={"flex gap-3 items-center"}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 xl:hidden"
                            onClick={() => setIsMobile(true)}
                        >
                            <Menu size={20} />
                        </Button>
                        <div className="flex h-11 items-center hidden xl:block">
                            <div
                                className={"app-logo cursor-pointer h-[45px]"}
                                onClick={() => onRedirect("/dashboard")}
                            >
                                {Icon.whiteLogo}
                            </div>
                        </div>
                    </div>

                    <div className={"flex gap-4 md:gap-6"}>
                        <div className={"flex gap-6 items-center"}>
                            <div className={"drop-option z-[999999]"}>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={open} className="min-w-[100px] sm:min-w-[150px] md:w-[222px] h-[36px] justify-between bg-card">
                                            <span className={"max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}>
                                                {projectDetailsReducer.id ? projectDetailsReducer.name : "Select project"}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="min-w-[100px] sm:min-w-[150px] w-[150x] sm:w-[222px] p-0 z-[999999]">
                                        <Command>
                                            <CommandInput placeholder="Search project" />
                                            <CommandList>
                                                <CommandEmpty>No project found.</CommandEmpty>
                                                <CommandGroup>
                                                    {(projectList || []).map((x, i) => {
                                                        return (
                                                            <Fragment key={i}>
                                                                <CommandItem className={`${projectDetailsReducer.id === x.id ? `text-card hov-primary bg-primary` : "bg-card"} justify-between gap-0.5`} value={x.id}>
                                                                    <span title={x.name} className={`w-full text-sm font-medium cursor-pointer max-w-[159px] truncate text-ellipsis overflow-hidden whitespace-nowrap`} onClick={() => onProjectClick(x)}>
                                                                        {x.name}
                                                                    </span>
                                                                    {userDetailsReducer?.id !== x?.userId && (
                                                                        <span className="px-1" title="Shared"><UserPlus2 size={16} /></span>    
                                                                    )}
                                                                    {userDetailsReducer?.id == x?.userId &&
                                                                        userProjects.length > 1 && (
                                                                            <Button variant={"plain"} className={"h-[20px] w-auto px-1"} onClick={() => deleteAlert(x.id)}>
                                                                                <Trash2 className={"cursor-pointer"} size={16} />
                                                                            </Button>
                                                                        )}
                                                                </CommandItem>
                                                            </Fragment>
                                                        );
                                                    })}
                                                    <Button variant={"plain"} disabled={userDetailsReducer?.stripeStatus === null && projectDetailsReducer.userId === userDetailsReducer.id} className={"w-full gap-2 items-center justify-start cursor-pointer py-[6px] px-3"} onClick={openSheet}>
                                                        <Plus size={16} />
                                                        <h4 className={"text-sm font-medium"}>New Project</h4>
                                                    </Button>
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className={"flex gap-2 md:gap-[10px] items-center"}>
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                <Button id={"preview-icon-btn"} variant="ghost" size="icon" className={"h-8 w-8 hover:bg-secondary/30"} onClick={viewLink}>
                                    {Icon.previewIcon}
                                </Button>
                                </TooltipTrigger>
                                <TooltipContent className={`${isTourActive ? "hidden" : ""}`}>
                                    <p>View Live Feedback Portal</p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                            
                            <Button variant="ghost" size="icon" className={"h-8 w-8 hover:bg-secondary/30"}
                                onClick={() => window.Quickhunt("Q212OHkwSW9HdGx3MGEveTJwTy9EUT09OjppOGJZdVdIcWZyVXVGQWxsSy9aNWtBPT0=")}
                            >
                                <Bell size={19} className={"stroke-white"} />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="rounded-full w-[30px] h-[30px]">
                                        <Avatar className={"w-[30px] h-[30px]"}>
                                            <AvatarImage
                                                src={userDetails?.profileImage ? `${DO_SPACES_ENDPOINT}/${userDetails?.profileImage}` : null}
                                                alt={`${userDetails &&
                                                    userDetails?.firstName?.substring(0, 1)?.toUpperCase()
                                                    }${userDetails?.lastName
                                                        ?.substring(0, 1)
                                                        ?.toUpperCase()}`}
                                            />
                                            <AvatarFallback>
                                                {userDetails?.firstName?.substring(0, 1)?.toUpperCase()}
                                                {userDetails?.lastName?.substring(0, 1)?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className={"w-56 rounded-md shadow z-[99999]"}>
                                    <DropdownMenuLabel className={"text-sm font-medium"}>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {dropDownItem.map((x, i) => (
                                        <DropdownMenuItem key={i} className={"text-sm font-medium flex gap-2 cursor-pointer"} onClick={x.onClick}>
                                            <span className={`profile-menu-icon`}>{x.icon}</span>
                                            {x.title}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {isSheetOpen && (
                        <Sheet open={isSheetOpen} onOpenChange={isSheetOpen ? closeSheet : openSheet}>
                            <SheetContent className={"max-w-[500px] p-0"}>
                                <SheetHeader className={"px-4 py-3 md:py-5 lg:px-8 lg:py-[20px] border-b flex flex-row justify-between items-center space-y-0"}>
                                    <SheetTitle className={"text-xl font-medium flex justify-between items-center"}>Create New Project</SheetTitle>
                                    <span className={"max-w-[24px]"}><X className={`cursor-pointer m-0 ${projectList.length === 0 ? 'opacity-50 pointer-events-none' : ''}`} onClick={closeSheet} /></span>
                                </SheetHeader>
                                <div className="overflow-auto h-[calc(100vh_-_69px)]">
                                    <div className="space-y-6 px-4 py-3 md:py-5 lg:px-8 lg:py-[20px]">
                                        <div className="space-y-1">
                                            <Label htmlFor="name" className={`font-medium`}>Project Logo</Label>
                                            <div className="w-full h-[120px] relative rounded-md">
                                                {
                                                    createProjectDetails?.logo ?
                                                        <div className="w-full h-full relative border rounded-md flex justify-center items-center">
                                                            <img
                                                                className="max-w-full max-h-full rounded-md object-contain"
                                                                src={createProjectDetails.logo?.name ? URL.createObjectURL(createProjectDetails.logo) : `${DO_SPACES_ENDPOINT}/${createProjectDetails.logo}`}
                                                                alt="logo"
                                                            />
                                                            <CircleX
                                                                size={20}
                                                                className="stroke-gray-500 cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                                                onClick={() => onDeleteImgLogo("logo", "")}
                                                            />
                                                        </div>
                                                        :
                                                        <div className={'h-full w-full'}>
                                                            <input id="logo" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                            <label htmlFor="logo" className={`flex h-full w-full py-0 justify-center items-center flex-shrink-0 bg-white rounded border border-input cursor-pointer`}>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Upload className="h-4 w-4 text-muted-foreground" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="font-normal text-sm max-w-80">
                                                                            Select project logo
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </label>
                                                        </div>
                                                }
                                            </div>
                                            {formError.logo && <span className="text-destructive text-sm">{formError.logo}</span>}
                                        </div>
                                        {sheetCommInput.map((x, i) => (
                                            <div className="space-y-1" key={i}>
                                                <div className={'flex items-center gap-1'}>
                                                    <Label htmlFor="name" className={`text-right font-medium ${(i !== 1) ? "after:ml-1 after:content-['*'] after:text-destructive" : ""}`}>{x.title}</Label>
                                                    {
                                                        x?.tooltip ?
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger><Info size={15} /></TooltipTrigger>
                                                                    <TooltipContent>{x?.tooltip}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider> : ""
                                                    }
                                                </div>
                                                {
                                                    x.type === 'select' ?
                                                        <TimezoneSelector {...{ timezone: createProjectDetails[x.name], onChange: onChangeText, }} />
                                                        :
                                                        <Fragment>
                                                            {x.name === "domain" ? (
                                                                <div className="relative">
                                                                    <Input
                                                                        id={x.name}
                                                                        placeholder={x.placeholder}
                                                                        className={`${x.className} pr-[110px]`} // Ensure enough padding for the span
                                                                        value={createProjectDetails[x.name]}
                                                                        name={x.name}
                                                                        onChange={(e) => onChangeText(x.name, e.target.value)}
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                                                                        {x.span}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Input
                                                                    id={x.name}
                                                                    placeholder={x.placeholder}
                                                                    className={x.className}
                                                                    value={createProjectDetails[x.name]}
                                                                    name={x.name}
                                                                    onChange={(e) => onChangeText(x.name, e.target.value)}
                                                                />
                                                            )}
                                                        </Fragment>
                                                }
                                                {formError[x.name] && (<span className="text-destructive text-sm">{formError[x.name]}</span>)}
                                            </div>
                                        ))}
                                        <div className={"gap-4 flex sm:justify-start"}>
                                            <Button
                                                className={`bg-primary text-card hover:bg-primary w-[129px] font-medium`}
                                                onClick={onCreateProject}
                                                disabled={isCreateLoading}
                                            >
                                                {isCreateLoading ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("New Project")}
                                            </Button>
                                            <Button
                                                className={`text-primary text-sm font-medium hover:bg-card border border-primary bg-card`}
                                                type="submit"
                                                disabled={projectList.length === 0}
                                                onClick={onCancel}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>
            </div>
        </header>
    );
};

export default HeaderBar;
