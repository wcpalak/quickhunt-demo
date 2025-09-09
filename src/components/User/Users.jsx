import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Button } from "../ui/button";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    GalleryVerticalEnd,
    Lightbulb,
    Loader2,
    Mail,
    MapPin,
    MessageSquare,
    MessagesSquare,
    Plus,
    Trash2,
    Vote,
    X,
    Zap
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useSelector } from "react-redux";
import { useToast } from "../ui/use-toast";
import { Skeleton } from "../ui/skeleton";
import EmptyData from "../Comman/EmptyData";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import Pagination from "../Comman/Pagination";
import DeleteDialog from "../Comman/DeleteDialog";
import { apiService, baseUrl } from "../../utils/constent";
import { useNavigate } from "react-router";
import { EmptyDataContent } from "../Comman/EmptyDataContent";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import { TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tabs } from "@radix-ui/react-tabs";
import { Avatar, AvatarImage } from "../ui/avatar";
import { UserAvatar } from "../Comman/CommentEditor";
import { Icon } from "../../utils/Icon";
import { EmptyUserContent } from "../Comman/EmptyContentForModule";
import { Checkbox } from "../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
dayjs.extend(utc);
dayjs.extend(relativeTime);
const perPageLimit = 10;

const initialState = {
    projectId: '',
    name: '',
    email: '',
    emailNotification: false,
    firstSeen: '',
    lastSeen: '',
    browser: '',
    ipAddress: '',
}
const initialStateError = {
    name: "",
    email: "",
}

const UserActionsList = ({ userActions, sourceTitle, isLoadingUserDetail, selectedTab, pageNoAction, totalPagesAction, handlePaginationClickAction }) => {
    const navigate = useNavigate();

    const emptyStates = {
        1: { children: "No notification yet", emptyIcon: Icon.inboxAllEmpty },
        2: { children: "No feedback received yet", emptyIcon: Icon.inboxAnnouncementFeedbackEmpty },
        3: { children: "No one reacted yet", emptyIcon: Icon.inboxAnnouncementReactionEmpty },
        4: { children: "No new feedback yet", emptyIcon: Icon.createIdeaEmpty },
        5: { children: "No comments yet", emptyIcon: Icon.ideaCommentEmpty },
        6: { children: "No upvotes yet", emptyIcon: Icon.inboxIdeaUpVoteEmpty },
        details: { children: "No notification yet", emptyIcon: Icon.inboxAllEmpty }
    };

    const currentEmptyState = emptyStates[selectedTab] || emptyStates.details;

    if (isLoadingUserDetail || !userActions.length) {
        return (
            <div className="divide-y h-[calc(100vh_-_204px)]">
                {isLoadingUserDetail ? (
                    Array.from({ length: 13 }).map((_, index) => (
                        <div key={index} className="px-2 py-[10px] md:px-3 flex justify-between gap-2">
                            <Skeleton className="rounded-md w-full h-7 bg-muted-foreground/[0.1]" />
                        </div>
                    ))
                ) : (
                    <EmptyData className={"h-full"} children={currentEmptyState.children} emptyIcon={currentEmptyState.emptyIcon} />
                )}
            </div>
        );
    }

    const navigateAction = async (id, source) => {
        if (source === "feature_ideas" || source === "feature_idea_comments" || source === "feature_idea_votes") {
            navigate(`/feedback/${id}`);
        } else if (source === "post_feedbacks" || source === "post_reactions") {
            navigate(`/changelog/analytic-view?id=${id}`);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh_-_140px)] justify-between">
            <div className="divide-y">
                {(userActions || []).map((x, index) => (
                    <Fragment key={index}>
                        {sourceTitle.map((y, i) => {
                            if (x.source === y.value) {
                                return (
                                    <div onClick={() => navigateAction(x?.id, x.source)} className="px-2 py-[10px] md:px-3 flex flex-wrap justify-between gap-2 cursor-pointer" key={i}>
                                        <div className="space-y-3">
                                            <h2 className="font-medium">{y.title}</h2>
                                            {y.value === "post_reactions" ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="rounded-none w-[20px] h-[20px]">
                                                        <AvatarImage src={x.emojiUrl} />
                                                    </Avatar>
                                                    <span className="text-sm text-wrap text-muted-foreground">{x.title}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-wrap text-muted-foreground">{x.title}</span>
                                            )}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {x?.createdAt ? dayjs(x?.createdAt).format('D MMM, YYYY') : "-"}
                                        </span>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </Fragment>
                ))}
            </div>

            {(selectedTab !== 1 && userActions?.length > 0) && (
                <div className="mt-auto">
                    <Pagination
                        justify={'justify-normal'}
                        className="!rounded-none"
                        pageNo={pageNoAction}
                        totalPages={totalPagesAction}
                        isLoading={isLoadingUserDetail}
                        handlePaginationClick={handlePaginationClickAction}
                        stateLength={userActions?.length}
                    />
                </div>
            )}
        </div>
    );
};

const Users = () => {
    const navigate = useNavigate();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const initialSearch = UrlParams.get('search') || '';
    const { toast } = useToast()
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const tabsListRef = useRef(null);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    const [formError, setFormError] = useState(initialStateError);
    const [customerDetails, setCustomerDetails] = useState(initialState);
    const [customerList, setCustomerList] = useState([]);
    const [userActions, setUserActions] = useState([]);
    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [pageNoAction, setPageNoAction] = useState(1);
    const [totalRecord, setTotalRecord] = useState(0);
    const [totalRecordAction, setTotalRecordAction] = useState(0);
    const [deleteId, setDeleteId] = useState(null);
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(true);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [isSave, setIsSave] = useState(false);
    const [emptyContentBlock, setEmptyContentBlock] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isDetailsSheetOpen, setDetailsSheetOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState(1);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('');
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedFilter, setSelectedFilter] = useState('');
    const [filterType, setFilterType] = useState('');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') {
                setIsShiftPressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') {
                setIsShiftPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const tabsElement = tabsListRef.current;

        const handleWheel = (e) => {
            if (isShiftPressed && tabsElement) {
                e.preventDefault(); // Valid because we're adding with passive: false
                tabsElement.scrollLeft += e.deltaY;
            }
        };

        // 👇 Add with passive: false to allow preventDefault
        tabsElement?.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            tabsElement?.removeEventListener('wheel', handleWheel);
        };
    }, [isShiftPressed]);

    const emptyContent = (status) => { setEmptyContentBlock(status); };

    useEffect(() => {
        if (projectDetailsReducer.id) {
            if (initialSearch) {
                setSearchTerm(initialSearch);
            }

            if (searchTerm) {
                setPageNo(1);
            }

            const debounceTimer = setTimeout(() => {
                getAllUsers();
            }, searchTerm ? 1000 : 0); // Debounce only for search terms

            return () => clearTimeout(debounceTimer);
        }

        navigate(`${baseUrl}/user?pageNo=${pageNo}`);
    }, [projectDetailsReducer.id, pageNo, initialSearch, selectedFilter, searchTerm]);

    const getAllUsers = async () => {
        setIsLoading(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            page: pageNo,
            limit: perPageLimit,
            search: searchTerm,
            ...(filterType === "sort" && { sortBy: selectedFilter }),
            ...(filterType === "activity" && { activityFilter: selectedFilter })
        }
        const data = await apiService.getAllUsers(payload);
        if (data.success) {
            setCustomerList(data.data);
            setTotalRecord(data?.data.total);
            setIsAdmin(data?.data.isAdmin);
            if (!data.data.customers || data.data.customers.length === 0) {
                emptyContent(true);
            } else {
                emptyContent(false);
            }
        } else {
            emptyContent(true);
        }
        setIsLoading(false)
    };

    const openUserDetails = (user) => {
        navigate(`${baseUrl}/user?${user?.id}&pageNo=${pageNo}`)
        setSelectedCustomer(user);
        setDetailsSheetOpen(true);
    }

    const onChangeText = (event) => {
        const { name, value } = event.target;
        const trimmedValue = (name === "name" || name === "email") ? value.trimStart() : value;
        setCustomerDetails(prev => ({ ...prev, [name]: trimmedValue }));
        setFormError(prev => ({
            ...prev,
            [name]: formValidate(name, trimmedValue)
        }));
    }

    const onBlur = (event) => {
        const { name, value } = event.target;
        const trimmedValue = (name === "name" || name === "email") ? value.trim() : value;
        setCustomerDetails(prev => ({ ...prev, [name]: trimmedValue }));
        setFormError({
            ...formError,
            [name]: formValidate(name, trimmedValue)
        });
    }

    const formValidate = (name, value) => {
        switch (name) {
            case "name":
                if (!value || value.trim() === "") {
                    return "User name is required.";
                } else {
                    return "";
                }
            case "email":
                if (!value || value.trim() === "") {
                    return "User e-mail is required.";
                } else if (!value.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
                    return "Enter a valid email address.";
                }
                else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const openSheet = () => {
        setSelectedIds([]);
        setSheetOpen(true)
    };

    const closeSheet = () => {
        setSheetOpen(false);
        setCustomerDetails(initialState);
        setFormError(initialStateError);
    };

    const closeUserDetails = () => {
        setDetailsSheetOpen(false)
        setSelectedTab(1)
        navigate(`${baseUrl}/user?pageNo=${pageNo}`)
    }

    const handleFilterChange = (value) => {
        if (value === selectedFilter) {
            setFilterType("");
            setSelectedFilter("");
        } else {
            if (value === "byIdeaCount") {
                setFilterType("sort");
            } else if (value === "byLastActivity") {
                setFilterType("activity");
            }
            setSelectedFilter(value);
        }
        setPageNo(1);
    };

    const handleDelete = async () => {
        setIsLoadingDelete(true);
        const data = await apiService.deleteUsers(deleteId);
        const clone = [...customerList?.customers];
        const indexToDelete = clone.findIndex((x) => x.id == deleteId);
        if (data.success) {
            clone.splice(indexToDelete, 1);
            setCustomerList(clone);
            if (clone.length === 0 && pageNo > 1) {
                navigate(`${baseUrl}/user?pageNo=${pageNo - 1}`);
                setPageNo((prev) => prev - 1);
            } else {
                getAllUsers();
            }
            toast({ description: data.message });
            setIsLoadingDelete(false);
        }
        else {
            toast({ description: data.error.message, variant: "destructive", });
            setIsLoadingDelete(false);
        }
        setOpenDelete(false);
        setDeleteId(null);
    };

    const addCustomer = async () => {
        const trimmedName = customerDetails.name ? customerDetails.name.trim() : "";
        const trimmedEmail = customerDetails.email ? customerDetails.email.trim() : "";
        const updatedIdea = {
            ...customerDetails,
            name: trimmedName,
            email: trimmedEmail,
        };
        setCustomerDetails(updatedIdea);
        let validationErrors = {};
        Object.keys(customerDetails).forEach(name => {
            const error = formValidate(name, customerDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        setIsSave(true);
        const payload = {
            ...customerDetails,
            projectId: projectDetailsReducer.id,
            firstSeen: new Date(),
            lastSeen: new Date(),
        }
        const data = await apiService.createUsers(payload)
        if (data.success) {
            setIsSave(false);
            setCustomerDetails(initialState);
            toast({ description: data.message, });
            const clone = Array.isArray(customerList) ? [...customerList] : [];
            clone.unshift(data.data);
            setCustomerList(clone);
            getAllUsers();
        } else {
            setIsSave(false);
            toast({ description: data.error.message, variant: "destructive", })
        }
        closeSheet();
    };

    const getUserActions = async () => {
        setIsLoadingUserDetail(true);
        const payload = {
            userId: selectedCustomer?.id,
            type: selectedTab,
            page: pageNoAction,
            limit: perPageLimit
        }
        const data = await apiService.userAction(payload);
        setIsLoadingUserDetail(false)
        if (data.success) {
            setUserActions(Array.isArray(data.data.data) ? data.data.data : []);
            setTotalRecordAction(data.data.total)
        }
    }

    useEffect(() => {
        if (selectedTab !== "details" && selectedCustomer?.id) {
            getUserActions();
        }
    }, [selectedTab, selectedCustomer?.id, pageNoAction]);

    const totalPages = Math.ceil(totalRecord / perPageLimit);
    const totalPagesAction = Math.ceil(totalRecordAction / perPageLimit);

    const handlePaginationClick = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setIsLoading(true);
            setPageNo(newPage);
            setSelectedIds([]);
            setIsLoading(false);
        }
    };

    const handlePaginationClickAction = (newPage) => {
        if (newPage >= 1 && newPage <= totalPagesAction) {
            setIsLoadingUserDetail(true);
            setPageNoAction(newPage);
        }
    };

    const sourceTitle = [
        { title: "Created a feedback", value: "feature_ideas" },
        { title: "Commented on feedback", value: "feature_idea_comments" },
        { title: "Upvoted on feedback", value: "feature_idea_votes" },
        { title: "Feedback on post", value: "post_feedbacks" },
        { title: "Reaction on post", value: "post_reactions" },
    ]

    const tabs = [
        { label: "Recent Activities", value: 1, icon: <Zap size={18} className={"mr-2"} /> },
        { label: "Changelog Feedback", value: 2, icon: <MessagesSquare size={18} className={"mr-2"} /> },
        { label: "Changelog Reaction", value: 3, icon: <GalleryVerticalEnd size={18} className={"mr-2"} /> },
        { label: "Create Feedback", value: 4, icon: <Lightbulb size={18} className={"mr-2"} /> },
        { label: "Feedback Comment", value: 5, icon: <MessageSquare size={18} className={"mr-2"} /> },
        { label: "Feedback Upvote", value: 6, icon: <Vote size={18} className={"mr-2"} /> },
    ];

    const tableHeader = ["Name", "Email", "Last Activity", "Comments", "Feedback",]
    if (isAdmin || isLoading) {
        tableHeader.push("Action")
    }

    const handleCheckboxChange = (id) => {
        setSelectedIds((prev) => {
            const newSelectedIds = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            if (newSelectedIds.length === 0) {
            }
            return newSelectedIds;
        });
    };

    const handleSelectAll = (isChecked) => {
        setAllSelectedDelete(0);
        if (isChecked) {
            const allIds = (customerList?.customers || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkDelete = async (ids) => {
        setIsLoadingDelete(true);
        const payload = {
            customerIds: ids,
            projectId: projectDetailsReducer.id,
        };

        const data = await apiService.userBatchUpdate(payload);
        if (data.success) {
            setIsLoadingDelete(false);
            setCustomerList(prev => ({
                ...prev,
                customers: prev.customers.filter(item => !ids.includes(item.id))
            }));
            setSelectedIds([]);
            setOpenDelete(false);
            getAllUsers();
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data.error.message });
        }
    };

    const deleteRow = (id, type = 'single') => {
        setDeleteId(id);
        setDeleteType(type);
        setOpenDelete(true);
    }

    const deleteParticularRow = async () => {
        if (deleteType === 'single') {
            await handleDelete();
        } else {
            await handleBulkDelete(selectedIds);
            setSelectedIds([]);
        }
        setOpenDelete(false);
    };

    const handleTabChange = (value) => {
        setSelectedTab(value);
        setPageNoAction(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        UrlParams.delete("search");
        navigate({
            pathname: location.pathname,
            search: UrlParams.toString(),
        });
    };

    return (
        <Fragment>

            {isSheetOpen && (
                <Dialog open={isSheetOpen} onOpenChange={isSheetOpen ? closeSheet : openSheet}>
                    <DialogContent className="sm:max-w-[500px] p-0 overflow-y-auto gap-0" showCloseButton={false}>
                        <DialogHeader className="p-4 flex flex-row justify-between items-center border-b space-y-0">
                            <DialogTitle className="text-lg md:text-xl font-medium">
                                Add New User
                            </DialogTitle>
                            <span className="max-w-[24px]">
                                <X onClick={closeSheet} className="cursor-pointer m-0" />
                            </span>
                        </DialogHeader>

                        <div className="p-4 border-b">
                            <div className="grid w-full gap-2">
                                <Label
                                    htmlFor="name"
                                    className="font-medium after:ml-1 after:content-['*'] after:text-destructive"
                                >
                                    Name
                                </Label>
                                <Input
                                    value={customerDetails.name}
                                    name="name"
                                    onChange={onChangeText}
                                    type="text"
                                    id="name"
                                    className="h-9"
                                    placeholder="Enter the full name of user..."
                                />
                                {formError.name && (
                                    <span className="text-sm text-red-500">{formError.name}</span>
                                )}
                            </div>

                            <div className="grid w-full gap-2 mt-6">
                                <Label
                                    htmlFor="email"
                                    className="font-medium after:ml-1 after:content-['*'] after:text-destructive"
                                >
                                    E-mail
                                </Label>
                                <Input
                                    value={customerDetails.email}
                                    name="email"
                                    onChange={onChangeText}
                                    onBlur={onBlur}
                                    type="email"
                                    id="email"
                                    className="h-9"
                                    placeholder="john@example.com"
                                />
                                {formError.email && (
                                    <span className="text-sm text-red-500">{formError.email}</span>
                                )}
                            </div>

                            <div className="announce-create-switch mt-6 flex items-center">
                                <Switch
                                    className="w-[38px] h-[20px]"
                                    id="switch"
                                    checked={customerDetails.emailNotification == 1}
                                    onCheckedChange={(checked) =>
                                        onChangeText({
                                            target: { name: "emailNotification", value: checked },
                                        })
                                    }
                                    htmlFor="switch"
                                />
                                <Label
                                    htmlFor="switch"
                                    className="ml-2.5 text-sm font-normal"
                                >
                                    Receive Notifications
                                </Label>
                            </div>
                        </div>

                        <div className="p-4">
                            <Button
                                onClick={addCustomer}
                                disabled={isSave}
                                className="border w-[117px] font-medium hover:bg-primary"
                            >
                                {isSave ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Add User"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}


            {isDetailsSheetOpen && (
                <Sheet open={isDetailsSheetOpen} onOpenChange={isDetailsSheetOpen ? closeUserDetails : openUserDetails}>
                    <SheetContent className={"sm:max-w-[1018px] p-0"}>
                        <SheetHeader className={"px-3 py-4 lg:px-8 lg:py-[20px] flex flex-row justify-between items-center border-b space-y-0"}>
                            <SheetTitle className={"text-lg md:text-xl font-normal"}>User Details</SheetTitle>
                            <span className={"max-w-[24px]"}><X onClick={closeUserDetails} className={"cursor-pointer m-0"} /></span>
                        </SheetHeader>
                        <div className={"divide-y"}>
                            <div className={"px-2 py-[10px] md:px-3 flex items-center flex-wrap gap-1 sm:gap-4"}>
                                <UserAvatar className={`text-xl w-[40px] h-[40px]`} userPhoto={selectedCustomer.profileImage} userName={selectedCustomer?.name && selectedCustomer?.name.substring(0, 1).toUpperCase()} />
                                <div className={"space-y-1"}>
                                    <div className={"flex items-center gap-1"}>
                                        <div className={"flex items-center gap-4"}>
                                            <h1 className={"text-sm md:text-base"}>{selectedCustomer?.name || "Unknown"}</h1>
                                        </div>
                                        {
                                            (selectedCustomer?.country) ?
                                                <span className={"flex items-center gap-2 text-sm"}><MapPin size={16} className={"light:stroke-muted-foreground"} />{selectedCustomer?.country}</span>
                                                : ""
                                        }
                                    </div>
                                    <div className={'flex flex-wrap items-center gap-4'}>
                                        <div className={"flex items-center gap-2"}>
                                            <div className={"text-sm"}><Mail size={16} className={"light:stroke-muted-foreground"} /></div>
                                            <Button
                                                variant={"link"}
                                                className={"text-sm h-auto p-0"}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (selectedCustomer?.email) {
                                                        window.open(`mailto:${selectedCustomer.email}`, '_blank');
                                                    }
                                                }}
                                            >
                                                {selectedCustomer?.email || "-"}
                                            </Button>
                                        </div>
                                        <div className={"flex items-center gap-2"}>
                                            <div className={"text-sm flex gap-2 items-center"}><Clock size={16} className={"light:stroke-muted-foreground"} /></div>
                                            <span className={"text-sm"}>
                                                {selectedCustomer?.lastActivity ? dayjs.utc(selectedCustomer?.lastActivity).local().startOf("seconds").fromNow() : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={"hidden md:block"}>
                                <div className={"flex w-full"}>
                                    <div className={"w-[25%] border-r p-3"}>
                                        <div className="flex flex-col space-y-2">
                                            {tabs.map((tab, i) => (
                                                <Button
                                                    key={i}
                                                    variant={selectedTab === tab.value ? "secondary" : "ghost"}
                                                    className={`justify-start ${selectedTab === tab.value ? "bg-[#e0d9f8] hover:bg-[#e0d9f8] text-primary" : ""}`}
                                                    onClick={() => handleTabChange(tab.value)}
                                                >
                                                    {tab.icon}
                                                    <span className="ml-2">{tab.label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={"w-[75%]"}>
                                        <div className={"w-full"}>
                                            <div className={"grid grid-cols-1 overflow-auto whitespace-nowrap h-[calc(100vh_-_197px)] md:h-[calc(100vh_-_130px)] lg:h-[calc(100vh_-_140px)]"}>
                                                <UserActionsList
                                                    setCustomerList={setCustomerList}
                                                    userActions={userActions}
                                                    sourceTitle={sourceTitle}
                                                    isLoadingUserDetail={isLoadingUserDetail}
                                                    selectedTab={selectedTab}
                                                    pageNoAction={pageNoAction}
                                                    totalPagesAction={totalPagesAction}
                                                    handlePaginationClickAction={handlePaginationClickAction}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={"block md:hidden"}>
                                <Tabs defaultValue={1} onValueChange={handleTabChange}>
                                    <div className={"border-b p-3"}>
                                        <TabsList
                                            ref={tabsListRef}
                                            className="w-full h-auto overflow-x-auto whitespace-nowrap justify-start bg-background"
                                        >
                                            {(tabs || []).map((tab, i) => (
                                                <TabsTrigger
                                                    key={i}
                                                    value={tab.value}
                                                    className={`text-sm font-medium team-tab-active team-tab-text-active text-slate-900`}
                                                >
                                                    {tab.icon}{tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>
                                    {
                                        (tabs || []).map((y, i) => (
                                            <TabsContent key={i} value={y.value} className={"mt-0"}>
                                                {/* <div className={"grid grid-cols-1 overflow-auto whitespace-nowrap h-[calc(100vh_-_197px)] md:h-[calc(100vh_-_196px)]"}> */}
                                                <div className={"grid grid-cols-1 overflow-auto whitespace-nowrap h-[calc(100vh_-_242px)] md:h-[calc(100vh_-_196px)]"}>
                                                    {
                                                        y.value === "details" ? y.component :
                                                            <UserActionsList
                                                                setCustomerList={setCustomerList}
                                                                userActions={userActions}
                                                                sourceTitle={sourceTitle}
                                                                isLoadingUserDetail={isLoadingUserDetail}
                                                                selectedTab={selectedTab}
                                                                pageNoAction={pageNoAction}
                                                                totalPagesAction={totalPagesAction}
                                                                handlePaginationClickAction={handlePaginationClickAction}
                                                            />
                                                    }
                                                </div>
                                            </TabsContent>
                                        ))
                                    }
                                </Tabs>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            )}

            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>

                {
                    (openDelete || deleteType === 'all') &&
                    <DeleteDialog
                        title={deleteType === 'single' ? "You really want to delete this User?" : `Delete ${selectedIds?.length > 1 ? 'Users' : 'User'}`}
                        description={"Deleting this user will permanently delete all associated data, including changelogs, feedback, reactions, comments, and upvotes."}
                        isOpen={openDelete}
                        onOpenChange={() => {
                            setOpenDelete(false);
                            setDeleteType('');
                        }}
                        onDelete={deleteParticularRow}
                        isDeleteLoading={isLoadingDelete}
                        deleteRecord={deleteType === 'single' ? deleteId : selectedIds}
                    />
                }

                <div>
                    <div className={"flex flex-row gap-x-4 flex-wrap justify-between gap-y-2 items-center"}>
                        <div className={"flex flex-col gap-y-0.5"}>
                            <h1 className="text-2xl font-normal flex-initial w-auto">Users ({totalRecord})</h1>
                            <h5 className={"text-sm text-muted-foreground"}>View all users who have registered through your program link, as well as those you’ve added manually.</h5>
                        </div>
                        <div className={"flex flex-wrap items-center gap-2"}>
                            <div className="relative w-[180px] sm:w-[250px] md:w-[300px]">
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedFilter('');
                                        setFilterType('');
                                    }}
                                    placeholder="Search by name or email..."
                                    className="pr-8 w-full h-9"
                                />
                                {searchTerm && (
                                    <X size={16}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                                        onClick={handleClearSearch}
                                    />
                                )}
                            </div>
                            <Button onClick={openSheet} className={"gap-2 font-medium hover:bg-primary"}><Plus size={20} strokeWidth={3} /><span className={"text-xs md:text-sm font-medium"}>New User</span></Button>
                        </div>
                    </div>
                    <div className={"my-6"}>
                        <Card>
                            <CardContent className={"p-0 overflow-auto"}>
                                <Table>
                                    <TableHeader className={"bg-muted"}>
                                        <TableRow className={"relative"}>
                                            <TableHead className={`font-semibold px-2 py-[6px] h-auto md:px-3 text-nowrap`}>
                                                <div className="items-center flex space-x-2">
                                                    {
                                                        customerList?.customers?.length > 0 ?
                                                            <Checkbox
                                                                id={"all"}
                                                                checked={customerList?.customers?.length > 0 && selectedIds.length === customerList?.customers?.length}
                                                                disabled={isLoading || !customerList?.customers?.length}
                                                                onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                                            /> : ""
                                                    }
                                                    {
                                                        (selectedIds.length > 0) &&
                                                        <div className={'absolute left-[20px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                            <div>
                                                                <label
                                                                    htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                                    className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                                    {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All users are selected`}
                                                                </label>
                                                            </div>

                                                            {selectedIds.length > 0 && (
                                                                <div className="flex items-center gap-2 sticky right-2">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                className={'h-8 w-8'}
                                                                                variant={"outline"}
                                                                                size={"icon"}
                                                                                disabled={isLoading || !customerList?.customers?.length || selectedIds.length === 0}
                                                                                onClick={() => deleteRow(null, 'all')}
                                                                            >
                                                                                <Trash2 size={15} className={"text-destructive"} />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className={"font-normal text-sm"}>
                                                                            Delete Selected {selectedIds?.length > 1 ? 'Users' : 'User'}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            )}
                                                        </div>
                                                    }
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-medium text-card-foreground px-2 py-[10px] md:px-3 bg-muted">Name</TableHead>
                                            <TableHead className="font-medium text-card-foreground px-2 py-[10px] md:px-3 bg-muted">Email</TableHead>
                                            <TableHead className="font-medium text-card-foreground px-2 py-[10px] md:px-3 bg-muted text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>Last Activity</span>
                                                    <div
                                                        className="transition-transform duration-200 ease-in-out cursor-pointer hover:text-primary"
                                                        onClick={() => handleFilterChange("byLastActivity")}
                                                    >
                                                        {
                                                            selectedFilter === "byLastActivity"
                                                                ? <ChevronUp size={14} />
                                                                : <ChevronDown size={14} />
                                                        }
                                                    </div>
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-medium text-card-foreground px-2 py-[10px] md:px-3 bg-muted text-center">
                                                <div className="flex items-center gap-4">
                                                    <span className={"flex-1"}>Comments</span>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span>Feedback</span>
                                                        <div
                                                            className="transition-transform duration-200 ease-in-out cursor-pointer hover:text-primary"
                                                            onClick={() => handleFilterChange("byIdeaCount")}
                                                        >
                                                            {
                                                                selectedFilter === "byIdeaCount"
                                                                    ? <ChevronUp size={14} />
                                                                    : <ChevronDown size={14} />
                                                            }
                                                        </div>
                                                    </div>
                                                    {isAdmin && <span className={"flex-1"}>Action</span>}
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {
                                            isLoading ? (
                                                [...Array(10)].map((_, index) => {
                                                    return (
                                                        <TableRow key={index}>
                                                            {
                                                                [...Array(5)].map((_, i) => {
                                                                    return (
                                                                        <TableCell key={i} className={`px-2 py-[10px] md:px-3 ${i === 0 ? "w-[16px] h-[16px]" : ""} ${i === 1 ? "w-[361px]" : ""} ${i === 2 ? "w-[191px]" : ""} ${i === 3 ? "w-[168px]" : ""} ${i === 4 ? "w-[93px]" : ""} ${isAdmin && (i === 5 ? "w-[119px]" : "")}`}>
                                                                            {i === 0 ? <Skeleton
                                                                                className={"rounded-md w-full h-4 w-4"} /> :
                                                                                <Skeleton
                                                                                    className={"rounded-md w-full h-8"} />
                                                                            }
                                                                        </TableCell>
                                                                    )
                                                                })
                                                            }
                                                        </TableRow>
                                                    )
                                                })
                                            )
                                                : customerList?.customers?.length > 0 ? <>
                                                    {
                                                        (customerList || [])?.customers?.map((x, index) => {
                                                            return (
                                                                <TableRow key={index} className={"font-normal"}>
                                                                    <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                                        <Checkbox
                                                                            checked={selectedIds.includes(x.id)}
                                                                            onCheckedChange={() => handleCheckboxChange(x.id)}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className={`px-2 py-[10px] md:px-3 cursor-pointer max-w-[170px] truncate text-ellipsis overflow-hidden whitespace-nowrap`} onClick={() => openUserDetails(x)}>{x.name ? x.name : "Unknown"}</TableCell>
                                                                    <TableCell className={`px-2 py-[10px] md:px-3 max-w-[170px] truncate text-ellipsis overflow-hidden whitespace-nowrap`}>{x?.email || "-"}</TableCell>
                                                                    <TableCell className={`px-2 py-[10px] md:px-3 text-center`}>{x?.lastActivity ? dayjs.utc(x?.lastActivity).local().startOf("seconds").fromNow() : "-"}</TableCell>
                                                                    <TableCell className={`px-2 py-[10px] md:px-3`}>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className={"flex-1 text-center"}>{x?.comments ? x?.comments : 0}</span>
                                                                            <span className={"flex-1 text-center"}>{x?.posts ? x?.posts : 0}</span>
                                                                            {isAdmin && (
                                                                                <div className={"flex-1 text-center"}>
                                                                                    <Button
                                                                                        disabled={selectedIds.length > 0}
                                                                                        onClick={() => deleteRow(x.id)}
                                                                                        variant={"outline hover:bg-transparent"}
                                                                                        className={`p-1 border w-[30px] h-[30px]`}
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })
                                                    }
                                                </> : <TableRow className={"hover:bg-transparent"}>
                                                    <TableCell colSpan={isAdmin ? 5 : 5}>
                                                        <EmptyData children={searchTerm ? "No user found" : "Waiting for your first user"} emptyIcon={Icon.UserEmpty} />
                                                    </TableCell>
                                                </TableRow>
                                        }
                                    </TableBody>
                                </Table>
                            </CardContent>
                            {
                                customerList?.customers?.length > 0 ?
                                    <Pagination
                                        pageNo={pageNo}
                                        totalPages={totalPages}
                                        isLoading={isLoading}
                                        handlePaginationClick={handlePaginationClick}
                                        stateLength={customerList?.customers?.length}
                                    /> : ""
                            }
                        </Card>
                    </div>
                    {
                        (isLoading || !emptyContentBlock) ? "" :
                            <EmptyDataContent
                                data={EmptyUserContent}
                                onClose={() => emptyContent(false)}
                                setSheetOpenCreate={openSheet}
                                cookieName="hideUsersEmptyContent"
                            />
                    }
                </div>
            </div>
        </Fragment>
    );
}

export default Users;