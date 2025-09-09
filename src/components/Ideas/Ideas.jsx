import React, { Fragment, useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ChevronLeft, Circle, Dot, Ellipsis, Filter, Pin, Plus, X, Waypoints, GitMerge, } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import { Checkbox } from "../ui/checkbox";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { apiService, baseUrl, DO_SPACES_ENDPOINT, isContentEmpty, isEmpty, } from "../../utils/constent";
import dayjs from "dayjs";
import { useToast } from "../ui/use-toast";
import { ReadMoreText } from "../Comman/ReadMoreText";
import { commonLoad } from "../Comman/CommSkel";
import EmptyData from "../Comman/EmptyData";
import CreateIdea from "./CreateIdea";
import { DropdownMenu, DropdownMenuTrigger, } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Pagination from "../Comman/Pagination";
import DeleteDialog from "../Comman/DeleteDialog";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { debounce } from "lodash";
import { EmptyDataContent } from "../Comman/EmptyDataContent";
import { CommSearchBar } from "../Comman/CommentEditor";
import { EmptyIdeaContent } from "../Comman/EmptyContentForModule";
import { Icon } from "../../utils/Icon";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import AIanimation2 from "../../assets/AIAnimation.gif";
import partyPopper from "../../assets/PartyPopper.png";
import ProPlanModal from "../Comman/ProPlanModal";


const filterByStatus = [
    { name: "Archived", value: "isArchive", actionType: "archive" },
    { name: "Bugs", value: "isActive", actionType: "markAsBug" }
];

const perPageLimit = 10;

const initialStateFilter = {
    all: "",
    roadmapStatusId: [],
    search: "",
    tagId: [],
    status: [],
    isArchive: "",
    isActive: "",
    noStatus: "",
};

const Ideas = () => {
    const navigate = useNavigate();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const getNavOpenSheet = UrlParams.get("opensheet") || false;
    const { toast } = useToast();
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

    const [ideasList, setIdeasList] = useState([]);
    const [topicLists, setTopicLists] = useState([]);
    const [roadmapStatus, setRoadmapStatus] = useState([]);
    const [filter, setFilter] = useState({ ...initialStateFilter });
    const [openFilter, setOpenFilter] = useState("");
    const [openFilterType, setOpenFilterType] = useState("");
    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [totalRecord, setTotalRecord] = useState(0);
    const [isSheetOpenCreate, setSheetOpenCreate] = useState(false);
    const [isDeleteLoading, setDeleteIsLoading] = useState(false);
    const [load, setLoad] = useState("list");
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [emptyContentBlock, setEmptyContentBlock] = useState(true);
    const [selectedIdeas, setSelectedIdeas] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [bulkStatusValue, setBulkStatusValue] = useState("");
    const [openBulkType, setOpenBulkType] = useState("");
    const [selectedBugAction, setSelectedBugAction] = useState(null);
    const [selectedArchiveAction, setSelectedArchiveAction] = useState(null);
    const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
    const [duplicateIdeas, setDuplicateIdeas] = useState([]);
    const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
    const [selectedDuplicateIds, setSelectedDuplicateIds] = useState([]);
    const [isMerging, setIsMerging] = useState(false);
    const [showMergeDropdown, setShowMergeDropdown] = useState(false);
    const [mergeSearchTerm, setMergeSearchTerm] = useState("");
    const [activeMergeGroupIndex, setActiveMergeGroupIndex] = useState(null);
    const [isProModal, setIsProModal] = useState(false);

    const emptyContent = (status) => {
        setEmptyContentBlock(status);
    };

    const openCreateIdea = () => {
        setSheetOpenCreate(true);
        setSelectedIdeas([]);
        setShowCheckboxes(false);
        navigate(`${baseUrl}/feedback`);
    };

    useEffect(() => {
        if (getNavOpenSheet === "open") {
            openCreateIdea();
        }
    }, [getNavOpenSheet]);

    const closeCreateIdea = () => {
        setSheetOpenCreate(false);
    };

    useEffect(() => {
        setTopicLists(allStatusAndTypes.topics);
        setRoadmapStatus(allStatusAndTypes.roadmapStatus);
        if (getNavOpenSheet) {
            navigate(`${baseUrl}/feedback?opensheet=${getNavOpenSheet}&pageNo=${pageNo}`);
        } else {
            navigate(`${baseUrl}/feedback?pageNo=${pageNo}`);
        }
    }, [pageNo, allStatusAndTypes]);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllIdea(filter);
        }
    }, [projectDetailsReducer.id, pageNo]);

    const getAllIdea = async (getFilter = {}) => {
        setLoad("list");
        const data = await apiService.getAllIdea({
            projectId: projectDetailsReducer.id,
            page: pageNo,
            limit: perPageLimit,
            search: getFilter?.search,
            tagId: getFilter?.tagId,
            roadmapStatusId: getFilter?.roadmapStatusId,
            isArchive: getFilter?.isArchive,
            isActive: getFilter?.isActive,
        });
        if (data.success) {
            setIdeasList(data?.data?.ideas);
            setTotalRecord(data.data.total);
            setLoad("");
            if (!data.data.ideas || data.data.ideas.length === 0) {
                emptyContent(true);
            } else {
                emptyContent(false);
            }
        } else {
            setLoad("");
            emptyContent(true);
        }
    };

    const throttledDebouncedSearch = useCallback(
        debounce((value) => {
            const trimmedValue = value.trim();
            if (trimmedValue || value === "") {
                const updatedFilter = { ...filter, search: trimmedValue, page: 1, };
                getAllIdea(updatedFilter);
            }
        }, 500),
        [projectDetailsReducer.id]
    );

    const onChangeSearch = (e) => {
        const value = e.target.value;
        const trimmedValue = value.trim();
        if (trimmedValue || value === "") {
            setFilter((prev) => ({ ...prev, search: value }));
            throttledDebouncedSearch(value);
        }
    };

    const clearSearchFilter = () => {
        const updatedFilter = { ...filter, search: "", page: 1, };
        setFilter(updatedFilter);
        getAllIdea(updatedFilter);
    };

    const openDetailsSheet = (record) => {
        setIdeasList((prevIdeas) =>
            prevIdeas.map((idea) =>
                idea.id === record.id ? { ...idea, isRead: 1, comments: idea.comments.map((comment) => ({ ...comment, isRead: 1, })), } : idea
            )
        );
        navigate(`${baseUrl}/feedback/${record.id}`);
    };

    const handleChange = (e) => {
        let payload = {
            ...filter,
            page: 1,
            limit: perPageLimit,
        };
        if (e.name === "tagId") {
            if (e.value !== null) {
                const clone = [...payload.tagId];
                const index = clone.findIndex((item) => item === e.value);
                if (index !== -1) {
                    clone.splice(index, 1);
                } else {
                    clone.push(e.value);
                }
                payload.tagId = clone;
            } else {
                payload.tagId = [];
            }
        } else if (e.name === "roadmapStatusId") {
            if (e.value !== null) {
                const clone = [...payload.roadmapStatusId];
                const index = clone.findIndex((item) => item === e.value);
                if (index !== -1) {
                    clone.splice(index, 1);
                } else {
                    clone.push(e.value);
                }
                payload.roadmapStatusId = clone;
            } else {
                payload.roadmapStatusId = [];
            }
        } else if (e.name === "status") {
            if (e.value === "isActive") {
                payload.isActive = payload.isActive === false ? "" : false;
                payload.isArchive = "";
                payload.all = "";
            } else if (e.value === "isArchive") {
                payload.isArchive = payload.isArchive !== true;
                payload.isActive = "";
                payload.all = "";
            } else if (e.value === null) {
                payload.isArchive = "";
                payload.isActive = "";
                payload.all = "";
            }
        }
        setFilter(payload);
        getAllIdea(payload);
    };

    const toggleSelectIdea = (ideaId) => {
        setSelectedIdeas((prev) => {
            const updatedSelection = prev.includes(ideaId) ? prev.filter((id) => id !== ideaId) : [...prev, ideaId];
            if (updatedSelection.length === 0) {
                setShowCheckboxes(false);
                setSelectAll(false);
            }
            return updatedSelection;
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIdeas([]);
        } else {
            setSelectedIdeas(ideasList.map((idea) => idea.id));
        }
        setSelectAll(!selectAll);
        setShowCheckboxes(false);
    };

    const deleteSelectedIdeas = async () => {
        if (selectedIdeas.length === 0) return;
        setDeleteIsLoading(true);
        const payload = {
            ideaIds: selectedIdeas,
            projectId: projectDetailsReducer.id,
            actionType: "delete",
            actionValue: 2,
        };
        const data = await apiService.ideaBulkUpdate(payload);
        if (data.success) {
            setDeleteIsLoading(false);
            setIdeasList((prev) => prev.filter((idea) => !selectedIdeas.includes(idea.id)));
            setTotalRecord((prev) => prev - selectedIdeas.length);
            setSelectedIdeas([]);
            setSelectAll(false);
            setOpenDelete(false);
            getAllIdea();
            toast({ description: data.message });
            if (ideasList.length === selectedIdeas.length && pageNo > 1) {
                setPageNo(pageNo - 1);
            }
        } else {
            toast({ description: data.error.message, variant: "destructive" });
        }
    };

    const handleBulkStatusUpdate = async (ids, statusValue) => {
        if (selectedIdeas.length === 0) return;
        const payload = {
            ideaIds: ids,
            projectId: projectDetailsReducer.id,
            actionType: "status",
            actionValue: Number(statusValue),
        };
        const data = await apiService.ideaBulkUpdate(payload);
        if (data.success) {
            toast({ description: data.message });
            setIdeasList((prev) =>
                prev.map((idea) =>
                    selectedIdeas.includes(idea.id) ? { ...idea, roadmapStatusId: Number(statusValue) } : idea
                )
            );
            setSelectedIdeas([]);
            setSelectAll(false);
            setOpenBulkType("");
            setBulkStatusValue("");
            setShowCheckboxes(false);
        } else {
            toast({ description: data.error.message, variant: "destructive" });
        }
    };

    const handleBulkStatussUpdate = async (ids, actionType, actionValue) => {
        if (selectedIdeas.length === 0) return;
        const payload = {
            ideaIds: ids,
            projectId: projectDetailsReducer.id,
            actionType: actionType,
            actionValue: actionValue,
        };
        const data = await apiService.ideaBulkUpdate(payload);
        if (data.success) {
            toast({ description: data.message });
            setIdeasList((prev) =>
                prev.map((idea) =>
                    selectedIdeas.includes(idea.id)
                        ? {
                            ...idea,
                            ...(actionType === "markAsBug" && { isActive: actionValue }),
                            ...(actionType === "archive" && { isArchive: actionValue })
                        } : idea
                )
            );
            setSelectedIdeas([]);
            setSelectAll(false);
            setBulkStatusValue("");
            setShowCheckboxes(false);
            setOpenBulkType("");
            setSelectedBugAction(null);
            setSelectedArchiveAction(null);
        } else {
            toast({ description: data.error.message, variant: "destructive" });
        }
    };

    const cancelMultiDelete = () => {
        setSelectedIdeas([]);
        setSelectAll(false);
        setShowCheckboxes(false);
    };

    const giveVote = async (record, type) => {
        const payload = {
            ideaId: record.id,
            type: type,
        };
        const data = await apiService.giveVote(payload);
        if (data.success) {
            const clone = [...ideasList];
            const index = clone.findIndex((x) => x.id === record.id);
            if (index !== -1) {
                let newVoteCount = clone[index].vote;
                // newVoteCount =
                //     type == 1
                //         ? newVoteCount + 1
                //         : newVoteCount >= 1
                //             ? newVoteCount - 1
                //             : 0;
                // clone[index].vote = newVoteCount;
                // clone[index].userVote = type == 1;
                newVoteCount = data?.data?.removeVote ? newVoteCount - 1 : newVoteCount + 1;
                clone[index].vote = newVoteCount;
                clone[index].userVote = !data?.data?.removeVote;
                setIdeasList(clone);
                toast({ description: data.message });
            }
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const totalPages = Math.ceil(totalRecord / perPageLimit);

    const handlePaginationClick = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setLoad("search");
            setLoad("list");
            setPageNo(newPage);
            setSelectedIdeas([]);
            setShowCheckboxes(false);
        }
    };

    const handleStatusUpdate = async (name, value, index, record) => {
        const formData = new FormData();
        if (name === "roadmapStatusId" && value === null) {
            value = "";
        }
        formData.append(name, value);
        const data = await apiService.updateIdea(formData, record?.id);
        if (data.success) {
            const clone = [...ideasList];
            if (name === "isArchive" || name === "isActive") {
                clone[index][name] = value;
                const removeStatus =
                    (filter.isActive === false && clone[index].isActive === false) ||
                    (filter.isArchive && clone[index]?.isArchive === false);
                if (removeStatus) {
                    clone.splice(index, 1);
                    setTotalRecord(clone.length);
                }
                setIdeasList(clone);
            } else if (name === "roadmapStatusId") {
                clone[index].roadmapStatusId = value;
                // let filteredClone = [];
                // if (filter.roadmapStatusId) {
                //     filteredClone = clone.filter(item => {
                //             filter.roadmapStatusId.includes(item.roadmapStatusId)
                //         }
                //     );
                // } else {
                //     filteredClone = clone.filter(item =>
                //         item.roadmapStatusId == filter.roadmapStatusId
                //     );
                // }
                // setIdeasList(filteredClone);
                // setTotalRecord(filteredClone.length);
                if (filter.roadmapStatusId && filter.roadmapStatusId.length > 0) {
                    const filteredClone = clone.filter((item) => filter.roadmapStatusId.includes(item.roadmapStatusId));
                    setIdeasList(filteredClone);
                    setTotalRecord(filteredClone.length);
                } else {
                    setIdeasList(clone);
                }
            }
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const onDeleteIdea = async (id) => {
        if (id) {
            setDeleteIsLoading(true);
            const data = await apiService.onDeleteIdea(id);
            if (data.success) {
                const filteredIdeas = ideasList.filter((idea) => idea.id !== id);
                setIdeasList(filteredIdeas);
                setTotalRecord(Number(totalRecord) - 1);
                if (filteredIdeas.length === 0 && pageNo > 1) {
                    setPageNo(pageNo - 1);
                    getAllIdea(pageNo - 1);
                } else {
                    getAllIdea(pageNo);
                }
                setOpenDelete(false);
                setDeleteIsLoading(false);
                setDeleteRecord(null);
                toast({ description: data.message });
            } else {
                toast({ variant: "destructive", description: data?.error?.message });
            }
        }
    };

    const deleteIdea = (record) => {
        setDeleteRecord(record.id);
        setOpenDelete(!openDelete);
    };

    const handlePopoverClose = () => {
        setSelectedBugAction(null);
        setSelectedArchiveAction(null);
    };

    const getDuplicateIdeas = async (idea) => {
        setOpenDuplicateDialog(true);
        setIsLoadingDuplicates(true);

        try {
            const data = await apiService.getDuplicateIdeas({
                projectId: projectDetailsReducer.id
            });
            if (data.success) {
                const enrichedGroups = await Promise.all(
                    (data.data || []).map(async (group) => {
                        const enrichedIdeas = await Promise.all(
                            group.ideas.map(async (duplicateIdea) => {
                                const completeIdea = ideasList.find(idea => idea.id === duplicateIdea.id);
                                if (completeIdea) {
                                    return {
                                        ...duplicateIdea,
                                        vote: completeIdea.vote,
                                        commentCount: completeIdea.commentCount,
                                        createdAt: completeIdea.createdAt,
                                        userVote: completeIdea.userVote,
                                        tags: completeIdea.tags,
                                        roadmapStatusId: completeIdea.roadmapStatusId
                                    };
                                }
                                try {
                                    const singleIdeaData = await apiService.getSingleIdea(duplicateIdea.id);
                                    if (singleIdeaData.success) {
                                        return {
                                            ...duplicateIdea,
                                            vote: singleIdeaData.data.vote || 0,
                                            commentCount: singleIdeaData.data.commentCount || 0,
                                            createdAt: singleIdeaData.data.createdAt,
                                            userVote: singleIdeaData.data.userVote,
                                            tags: singleIdeaData.data.tags,
                                            roadmapStatusId: singleIdeaData.data.roadmapStatusId
                                        };
                                    }
                                } catch (error) {
                                    console.error("Error fetching single idea:", error);
                                }
                                return {
                                    ...duplicateIdea,
                                    vote: 0,
                                    commentCount: 0,
                                    createdAt: duplicateIdea.createdAt || new Date().toISOString()
                                };
                            })
                        );
                        return {
                            ...group,
                            ideas: enrichedIdeas
                        };
                    })
                );

                setDuplicateIdeas(enrichedGroups);

                // Default selection: For each group, leave the first idea unchecked, select the rest
                const preselectedIds = enrichedGroups.flatMap(group =>
                    (group.ideas || []).slice(1).map(idea => idea.id)
                );
                setSelectedDuplicateIds(preselectedIds);
            } else {
                toast({ description: data?.error?.message || "Failed to fetch duplicates", variant: "destructive" });
            }
        } catch (error) {
            toast({ description: "Failed to fetch duplicates", variant: "destructive" });
        } finally {
            setIsLoadingDuplicates(false);
        }
    };

    const closeDuplicateDialog = () => {
        setOpenDuplicateDialog(false);
        setDuplicateIdeas([]);
        setSelectedDuplicateIds([]);
        setShowMergeDropdown(false);
        setMergeSearchTerm("");
    };

    const handleDuplicateSelect = (ideaId) => {
        setSelectedDuplicateIds(prev => {
            if (prev.includes(ideaId)) {
                return prev.filter(id => id !== ideaId);
            } else {
                return [...prev, ideaId];
            }
        });
    };

    const showMergeDropdownHandler = (groupIndex) => {
        if (selectedDuplicateIds.length === 0) {
            toast({ description: "Please select at least one feedback to merge", variant: "destructive" });
            return;
        }
        setActiveMergeGroupIndex(groupIndex);
        setShowMergeDropdown(true);
        setMergeSearchTerm("");
    };

    const mergeSelectedIdeas = async (mainIdeaId) => {
        if (!mainIdeaId || selectedDuplicateIds.length === 0) {
            toast({ description: "Please select a main idea and at least one duplicate to merge", variant: "destructive" });
            return;
        }

        // Limit to current group's selected ideas if a group is active
        const currentGroupIdeaIds = activeMergeGroupIndex !== null
            ? (duplicateIdeas[activeMergeGroupIndex]?.ideas || []).map(i => i.id)
            : null;

        // Ensure the main idea is not part of the duplicates payload
        let duplicateIdsToMerge = selectedDuplicateIds.filter((id) => id !== mainIdeaId);
        if (currentGroupIdeaIds) {
            duplicateIdsToMerge = duplicateIdsToMerge.filter(id => currentGroupIdeaIds.includes(id));
        }
        if (duplicateIdsToMerge.length === 0) {
            toast({ description: "Select at least one feedback (other than the main) to merge", variant: "destructive" });
            return;
        }

        setIsMerging(true);
        try {
            const payload = {
                mainIdeaId: mainIdeaId,
                duplicateIdeaIds: duplicateIdsToMerge
            };

            const data = await apiService.mergeIdeas(payload);

            if (data.success) {
                toast({ description: data.message || "Feedbacks merged successfully" });
                closeDuplicateDialog();
                getAllIdea(filter);
            } else {
                toast({ description: data?.error?.message || "Failed to merge Feedbacks", variant: "destructive" });
            }
        } catch (error) {
            toast({ description: "Failed to merge Feedbacks", variant: "destructive" });
        } finally {
            setIsMerging(false);
            setShowMergeDropdown(false);
            setActiveMergeGroupIndex(null);
        }
    };

    const bulkActions = [
        {
            label: "Mark As Bug",
            action: () => {
                handleBulkStatussUpdate(selectedIdeas, "markAsBug", false);
                setSelectedBugAction("bug");
                setSelectedArchiveAction(null);
            },
            checked: selectedBugAction === "bug",
        },
        {
            label: "Convert To Feedback",
            action: () => {
                handleBulkStatussUpdate(selectedIdeas, "markAsBug", true);
                setSelectedBugAction("idea");
                setSelectedArchiveAction(null);
            },
            checked: selectedBugAction === "idea",
        },
        {
            label: "Archive",
            action: () => {
                handleBulkStatussUpdate(selectedIdeas, "archive", true);
                setSelectedArchiveAction("archive");
                setSelectedBugAction(null);
            },
            checked: selectedArchiveAction === "archive",
        },
        {
            label: "Unarchive",
            action: () => {
                handleBulkStatussUpdate(selectedIdeas, "archive", false);
                setSelectedArchiveAction("unarchive");
                setSelectedBugAction(null);
            },
            checked: selectedArchiveAction === "unarchive",
        },
    ];

    const clearAllFilters = () => {
        setFilter({ ...initialStateFilter });
        getAllIdea(initialStateFilter);
    };

    return (
        <Fragment>
            {openDelete && (
                <DeleteDialog
                    title={deleteRecord ? "You really want to delete this Feedback?" : `You really want to delete ${selectedIdeas.length} feedback?`}
                    isOpen={openDelete}
                    onOpenChange={() => setOpenDelete(false)}
                    onDelete={async () => {
                        if (deleteRecord) {
                            await onDeleteIdea(deleteRecord);
                        } else {
                            await deleteSelectedIdeas();
                        }
                        setShowCheckboxes(false);
                    }}
                    isDeleteLoading={isDeleteLoading}
                    deleteRecord={deleteRecord || selectedIdeas}
                />
            )}
            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                {isSheetOpenCreate && (
                    <CreateIdea
                        isOpen={isSheetOpenCreate}
                        onOpen={openCreateIdea}
                        onClose={closeCreateIdea}
                        closeCreateIdea={closeCreateIdea}
                        setIdeasList={setIdeasList}
                        ideasList={ideasList}
                        getAllIdea={getAllIdea}
                        pageNo={pageNo}
                    />
                )}

                <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className={"flex flex-col flex-1 gap-y-0.5"}>
                        <h1 className="text-2xl font-normal flex-initial w-auto">Feedback ({totalRecord})</h1>
                        <p className={"text-sm text-muted-foreground"}>
                            Create and display your feedback on your website and encourage users
                            to upvote and comment with their feedback.
                        </p>
                    </div>
                    <div className="w-full lg:w-auto flex sm:flex-nowrap flex-wrap gap-2 items-center">
                        <div className={"flex gap-2 items-center w-full lg:w-auto"}>
                            <CommSearchBar value={filter.search} onChange={onChangeSearch} onClear={clearSearchFilter} placeholder="Search..." />
                            <Popover
                                open={openFilter}
                                onOpenChange={() => {
                                    setOpenFilter(!openFilter);
                                    setOpenFilterType("");
                                }}
                                className="w-full p-0"
                            >
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className={"min-w-9 w-9 h-9 "}><Filter fill="true" className="w-4 -h4" /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="end">
                                    <Command className="w-full">
                                        <CommandList className="w-full min-w-[250px]">
                                            {openFilterType === "tagId" ? (
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => { setOpenFilterType(""); }}
                                                        className={" flex gap-2 items-center cursor-pointer p-1"}
                                                    >
                                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                                        <span className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}>Back</span>
                                                    </CommandItem>
                                                    {(topicLists || []).map((x, i) => {
                                                        return (
                                                            <CommandItem key={i} value={x.id} className={"p-0 flex gap-1 items-center cursor-pointer"}>
                                                                <Checkbox className={"m-2"} checked={filter.tagId.includes(x.id)}
                                                                    onClick={() => {
                                                                        handleChange({ name: "tagId", value: x.id, });
                                                                        setOpenFilter(true);
                                                                        setOpenFilterType("tagId");
                                                                    }}
                                                                />
                                                                <span
                                                                    onClick={() => {
                                                                        handleChange({ name: "tagId", value: x.id, });
                                                                        setOpenFilter(true);
                                                                        setOpenFilterType("tagId");
                                                                    }}
                                                                    className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}
                                                                >
                                                                    {x.title}
                                                                </span>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            ) : openFilterType === "roadmapStatusId" ? (
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => { setOpenFilterType(""); }}
                                                        className={" flex gap-2 items-center cursor-pointer p-1"}
                                                    >
                                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                                        <span className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}>Back</span>
                                                    </CommandItem>
                                                    {(roadmapStatus || []).map((x, i) => {
                                                        return (
                                                            <CommandItem key={i} value={x.value} className={"p-0 flex gap-1 items-center cursor-pointer"}>
                                                                <Checkbox className={"m-2"}
                                                                    checked={filter.roadmapStatusId.includes(x.id)}
                                                                    onClick={() => {
                                                                        handleChange({ name: "roadmapStatusId", value: x.id, });
                                                                        setOpenFilter(true);
                                                                        setOpenFilterType("roadmapStatusId");
                                                                    }}
                                                                />
                                                                <span
                                                                    onClick={() => {
                                                                        handleChange({ name: "roadmapStatusId", value: x.id, });
                                                                        setOpenFilter(true);
                                                                        setOpenFilterType("roadmapStatusId");
                                                                    }}
                                                                    className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center capitalize"}
                                                                >
                                                                    <span className={"w-2.5 h-2.5 rounded-full"} style={{ backgroundColor: x.colorCode }} />
                                                                    {x.title}
                                                                </span>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            ) : openFilterType === "status" ? (
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => { setOpenFilterType(""); }}
                                                        className={"flex gap-2 items-center cursor-pointer p-1"}
                                                    >
                                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                                        <span className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}>
                                                            Back
                                                        </span>
                                                    </CommandItem>
                                                    <RadioGroup value={filter.status} className={"gap-0.5"}
                                                        onValueChange={(value) => {
                                                            handleChange({ name: "status", value });
                                                            setOpenFilter(true);
                                                            setOpenFilterType("status");
                                                        }}
                                                    >
                                                        {(filterByStatus || []).map((x, i) => {
                                                            return (
                                                                <CommandItem key={i} value={x.value} className={"p-0 flex gap-1 items-center cursor-pointer"}>
                                                                    <RadioGroupItem id={x.value} value={x.value} className="m-2"
                                                                        checked={x.value === "isActive" ? filter[x.value] === false : filter[x.value]}
                                                                    />
                                                                    <span onClick={() => {
                                                                        handleChange({ name: "status", value: x.value, });
                                                                        setOpenFilter(true);
                                                                        setOpenFilterType("status");
                                                                    }}
                                                                        className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}
                                                                    >{x.name}</span>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </RadioGroup>
                                                </CommandGroup>
                                            ) : (
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => { setOpenFilterType("status"); }}>
                                                        <span className={"text-sm font-normal cursor-pointer"}>Status</span>
                                                    </CommandItem>{" "}
                                                    <CommandItem onSelect={() => { setOpenFilterType("tagId"); }}>
                                                        <span className={"text-sm font-normal cursor-pointer"}>Topics</span>
                                                    </CommandItem>
                                                    <CommandItem onSelect={() => { setOpenFilterType("roadmapStatusId"); }}>
                                                        <span className={"text-sm font-normal cursor-pointer"}>Roadmap</span>
                                                    </CommandItem>
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            variant="outline"
                            className={"gap-2 font-medium"}
                            onClick={() => {
                                if (projectDetailsReducer.plan === 3 && projectDetailsReducer.stripeStatus === "active") {
                                    getDuplicateIdeas(null);
                                } else {
                                    setIsProModal(true);
                                }
                            }}
                        >
                            {Icon.AIIcon}
                            <span className={"text-xs md:text-sm font-medium"}>AI Duplicate Finder</span>
                        </Button>


                        <Button className={"gap-2 font-medium hover:bg-primary"} onClick={openCreateIdea}>
                            <Plus size={20} strokeWidth={3} />
                            <span className={"text-xs md:text-sm font-medium"}>Create Feedback</span>
                        </Button>
                    </div>
                </div>
                {(filter?.tagId?.length > 0 || filter?.roadmapStatusId?.length > 0 || filter?.isArchive || filter?.isActive === false) && (
                    <div className="flex flex-wrap gap-2 my-6">
                        {(filter.tagId || []).map((data) => {
                            const findTopic = (topicLists || []).find((tagId) => tagId.id === data);
                            return (
                                <Badge key={`selected-${findTopic.id}`} variant="outline" className="rounded p-0 font-medium">
                                    <span className="px-3 py-1.5 border-r">{findTopic.title}</span>
                                    <span className="w-7 h-7 flex items-center justify-center cursor-pointer"
                                        onClick={() => handleChange({ name: "tagId", value: data })}
                                    ><X className="w-4 h-4" /></span>
                                </Badge>
                            );
                        })}
                        {(filter.roadmapStatusId || []).map((data, index) => {
                            const findRoadmap = (roadmapStatus || []).find((roadmapStatusId) => roadmapStatusId.id === data);
                            return (
                                <Fragment key={index}>
                                    <Badge key={`selected-${findRoadmap.id}`} variant="outline" className="rounded p-0 font-medium">
                                        <span className="px-3 py-1.5 border-r flex gap-2 items-center">
                                            <span className={"w-2.5 h-2.5  rounded-full"} style={{ backgroundColor: findRoadmap.colorCode }} />
                                            {findRoadmap.title}</span>
                                        <span className="w-7 h-7 flex items-center justify-center cursor-pointer" onClick={() => handleChange({ name: "roadmapStatusId", value: data })}>
                                            <X className="w-4 h-4" />
                                        </span>
                                    </Badge>
                                </Fragment>
                            );
                        })}
                        {filter.isArchive && (
                            <Badge key={`selected-${filter.isArchive}`} variant="outline" className="rounded p-0 font-medium">
                                <span className="px-3 py-1.5 border-r">Archived</span>
                                <span className="w-7 h-7 flex items-center justify-center cursor-pointer"
                                    onClick={() => handleChange({ name: "status", value: "isArchive" })}
                                >
                                    <X className="w-4 h-4" />
                                </span>
                            </Badge>
                        )}
                        {filter.isActive === false && (
                            <Badge key={`selected-${filter.isActive === false}`} variant="outline" className="rounded p-0 font-medium">
                                <span className="px-3 py-1.5 border-r">Bugs</span>
                                <span className="w-7 h-7 flex items-center justify-center cursor-pointer"
                                    onClick={() => handleChange({ name: "status", value: "isActive" })}
                                >
                                    <X className="w-4 h-4" />
                                </span>
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-primary hover:text-primary ml-2"
                            onClick={clearAllFilters}
                        >
                            Clear all
                        </Button>
                    </div>
                )}

                {selectedIdeas.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="flex items-center space-x-4">
                            <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                            <span>{selectedIdeas.length} selected</span>
                        </div>
                        <div className="flex gap-2">
                            <Popover onOpenChange={(open) => !open && handlePopoverClose()}>
                                <PopoverTrigger asChild><Button variant="outline" className={""}>Bulk Update</Button></PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="end">
                                    <Command className="w-full">
                                        <CommandList className="w-full min-w-[250px]">
                                            {
                                                openBulkType === "status" ? (
                                                    <CommandGroup>
                                                        <CommandItem className={"flex gap-2 items-center cursor-pointer p-1"}
                                                            onSelect={() => {
                                                                setOpenBulkType("");
                                                                handlePopoverClose();
                                                            }}
                                                        >
                                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                                            <span className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}>Back</span>
                                                        </CommandItem>
                                                        {bulkActions.map(({ label, action, checked }) => (
                                                            <CommandItem key={label} onSelect={action}
                                                                className="p-0 flex gap-1 items-center cursor-pointer"
                                                            >
                                                                <Checkbox className="m-2" checked={checked} onCheckedChange={() => { }} />
                                                                <span className="flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center">{label}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                ) : openBulkType === "roadmapStatusId" ? (
                                                    <CommandGroup>
                                                        <CommandItem onSelect={() => { setOpenBulkType(""); }}
                                                            className={" flex gap-2 items-center cursor-pointer p-1"}
                                                        >
                                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                                            <span className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center"}>Back</span>
                                                        </CommandItem>
                                                        <RadioGroup value={bulkStatusValue} className={"gap-0.5"}
                                                            onValueChange={(value) => {
                                                                setBulkStatusValue(value);
                                                                handleBulkStatusUpdate(selectedIdeas, value);
                                                            }}
                                                        >
                                                            {(roadmapStatus || []).map((x, i) => {
                                                                return (
                                                                    <CommandItem key={i} value={x.id.toString()}
                                                                        className={"p-0 flex gap-1 items-center cursor-pointer"}
                                                                    >
                                                                        <RadioGroupItem id={`bulk-status-${x.id}`} value={x.id.toString()} className="m-2" />
                                                                        <Label htmlFor={`bulk-status-${x.id}`} className={"flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center capitalize"}>
                                                                            <span className={"w-2.5 h-2.5 rounded-full"} style={{ backgroundColor: x.colorCode }} />
                                                                            {x.title}
                                                                        </Label>
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </RadioGroup>
                                                    </CommandGroup>
                                                ) : (
                                                    <CommandGroup>
                                                        <CommandItem onSelect={() => { setOpenBulkType("status"); }}>
                                                            <span className={"text-sm font-normal cursor-pointer w-full"}>Status</span>
                                                        </CommandItem>{" "}
                                                        <CommandItem onSelect={() => { setOpenBulkType("roadmapStatusId"); }}>
                                                            <span className={"text-sm font-normal cursor-pointer w-full"}>Roadmap</span>
                                                        </CommandItem>
                                                    </CommandGroup>
                                                )
                                            }
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <Button className={"h-auto"} variant="outline" onClick={cancelMultiDelete}>Cancel</Button>
                            <Button className={"h-auto"} variant="destructive" onClick={() => setOpenDelete(true)} disabled={isDeleteLoading}>
                                {isDeleteLoading ? "Deleting..." : "Delete Selected"}
                            </Button>
                        </div>
                    </div>
                )}

                <Card className={"my-6"}>
                    {load === "search" || load === "list" ? (commonLoad.commonParagraphFourIdea) : ideasList.length > 0 ? (
                        <CardContent className={"p-0 divide-y"}>
                            {(ideasList || []).map((x, i) => {
                                return (
                                    <Fragment key={x.id || i}>
                                        <div className={"flex gap-[5px] md:gap-8 p-2 sm:p-3 lg:py-4 lg:px-5"}>
                                            {(showCheckboxes || selectedIdeas.length > 0) && (
                                                <div className={"m-auto"}>
                                                    <Checkbox checked={selectedIdeas.includes(x.id)}
                                                        onCheckedChange={() => toggleSelectIdea(x.id)}
                                                        className="mr-2"
                                                    />
                                                </div>
                                            )}
                                            <div className={"flex gap-1 md:gap-2"}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button className={"w-[30px] h-[30px] border"} variant={"plain"} onClick={() => giveVote(x, 1)}>
                                                            <span className={`inline-block w-5 h-5`}
                                                                style={{ fill: x?.userVote ? "#7c3aed" : "#6b7280", color: x?.userVote ? "#7c3aed" : "#6b7280", }}
                                                            >{Icon.caretUp}</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className={"font-normal text-sm"}>
                                                        Vote
                                                    </TooltipContent>
                                                </Tooltip>
                                                <p className={"!text-[16px] md:text-xl font-normal"}>{x.vote}</p>
                                            </div>
                                            <div className={"flex flex-col w-full gap-3 max-w-[1045px]"}>
                                                <div className={"flex flex-col gap-3"}>
                                                    <div className={"flex flex-wrap items-center justify-between gap-3"}>
                                                        <div className={"flex flex-wrap items-center gap-1 cursor-pointer xl:gap-3"}
                                                            onClick={() => openDetailsSheet(x)}
                                                        >
                                                            <h3 className={"text-base font-normal max-w-[278px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-wrap sm:text-nowrap"}>
                                                                {x.title}
                                                            </h3>
                                                            <div className={"flex gap-2 items-center"}>
                                                                {!isEmpty(x.name) || !isEmpty(x.userName) ? (
                                                                    <h4 className={"text-xs font-normal text-muted-foreground"}>
                                                                        {x.name ? x.name : x?.userName}
                                                                    </h4>
                                                                ) : ("")}
                                                                <p className={"text-xs font-normal flex items-center text-muted-foreground"}>
                                                                    <Dot size={20} className={"fill-text-card-foreground stroke-text-card-foreground"} />
                                                                    {dayjs(x.createdAt).format("D MMM")}
                                                                </p>
                                                            </div>
                                                            <div className={"flex items-center gap-1 sm:gap-2 cursor-pointer"} onClick={() => openDetailsSheet(x)}>
                                                                <span className={"mt-0.5"}>{Icon.chatbuble}</span>
                                                                <p className={"text-base font-normal"}>{x?.commentCount}</p>
                                                            </div>
                                                        </div>
                                                        <div className={"flex flex-wrap gap-2 items-center"}>
                                                            {x && x?.tags && x?.tags?.length ? (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant={"ghost hove:none"} className={"p-0 h-[24px]"}>
                                                                            <div className={"flex justify-between items-center gap-0.5"}>
                                                                                <div className={"text-sm text-center"}>
                                                                                    <div className={`text-xs bg-[#FBFBFF] border-gray-[#dee1ea80] border truncate py-1 px-2 font-medium text-[#5b678f] rounded-md`}>
                                                                                        {x?.tags?.slice(0, 1).map((tagId, i) => (<div key={i}>{tagId?.title}</div>))}
                                                                                    </div>
                                                                                </div>
                                                                                {x?.tags?.length > 1 && (
                                                                                    <div className={"update-idea text-sm rounded-full border text-center"}>
                                                                                        <Avatar>
                                                                                            <AvatarFallback>+{x?.tags?.length - 1}</AvatarFallback>
                                                                                        </Avatar>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="p-0" align={"start"}>
                                                                        <div>
                                                                            <div className={"py-3 px-4"}>
                                                                                <h4 className="font-normal leading-none text-sm">{`Topics (${x?.tags?.length})`}</h4>
                                                                            </div>
                                                                            <div className="border-t px-4 py-3 space-y-2 max-h-[200px] overflow-y-auto">
                                                                                {x.tags && x.tags.length > 0 && (
                                                                                    <div className="space-y-2">
                                                                                        {x.tags.map((y, i) => (<div className="text-sm font-normal" key={i}>{y?.title}</div>))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            ) : ("")}
                                                            <Select value={x.roadmapStatusId !== "" ? x.roadmapStatusId : null}
                                                                onValueChange={(value) => handleStatusUpdate("roadmapStatusId", value, i, x)}
                                                            >
                                                                <SelectTrigger className="md:w-[200px] w-[170px] h-8 bg-card">
                                                                    <SelectValue>
                                                                        {x.roadmapStatusId ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <Circle
                                                                                    fill={allStatusAndTypes.roadmapStatus.find((status) => status.id === x.roadmapStatusId)?.colorCode}
                                                                                    stroke={allStatusAndTypes.roadmapStatus.find((status) => status.id === x.roadmapStatusId)?.colorCode}
                                                                                    className="w-[10px] h-[10px]"
                                                                                />
                                                                                <span className={"max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}>
                                                                                    {allStatusAndTypes.roadmapStatus.find((status) => status.id === x.roadmapStatusId)?.title ?? "Unassigned"}
                                                                                </span>
                                                                            </div>
                                                                        ) : (<span className="text-gray-500">Unassigned</span>)}
                                                                    </SelectValue>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectItem value={null}>
                                                                            <div className={"flex items-center gap-2"}>Unassigned</div>
                                                                        </SelectItem>
                                                                        {(allStatusAndTypes.roadmapStatus || []).map((x, i) => {
                                                                            return (
                                                                                <SelectItem key={i} value={x.id}>
                                                                                    <div className={"flex capitalize items-center gap-2 truncate text-ellipsis overflow-hidden whitespace-nowrap"}>
                                                                                        <Circle fill={x.colorCode} stroke={x.colorCode} className={` w-[10px] h-[10px]`} />
                                                                                        {x.title || "Unassigned"}
                                                                                    </div>
                                                                                </SelectItem>
                                                                            );
                                                                        })}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                            {x.isActive === false && (
                                                                <Badge variant={"outline"} className={`border border-red-500 text-red-500 bg-red-100 `}>
                                                                    Bug
                                                                </Badge>
                                                            )}
                                                            {x?.isArchive && (
                                                                <Badge variant={"outline"} className={`border border-green-500 text-green-500 bg-green-100`}>
                                                                    Archive
                                                                </Badge>
                                                            )}
                                                            {x.pinToTop == 1 && (<Pin size={16} className={`fill-card-foreground`} />)}
                                                            {!(showCheckboxes || selectedIdeas.length > 0) && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger><Ellipsis size={16} /></DropdownMenuTrigger>
                                                                    <DropdownMenuContent align={"end"}>
                                                                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => openDetailsSheet(x)}>Edit</DropdownMenuItem>
                                                                        <DropdownMenuItem className={"cursor-pointer"}
                                                                            onClick={() => handleStatusUpdate("isArchive", x?.isArchive !== true, i, x)}
                                                                        >
                                                                            {x?.isArchive ? "Unarchive" : "Archive"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className={"cursor-pointer"}
                                                                            onClick={() => handleStatusUpdate("isActive", x.isActive === false, i, x)}
                                                                        >
                                                                            {x.isActive === false ? "Convert To Feedback" : "Mark As Bug"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className={"cursor-pointer"}
                                                                            onClick={() => {
                                                                                setShowCheckboxes(true);
                                                                                setSelectedIdeas([x.id]);
                                                                            }}
                                                                        >
                                                                            Bulk Select
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => deleteIdea(x)}>Delete</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isContentEmpty(x.description) || isEmpty(x.description) ? ("") : (
                                                        <div className="description-container">
                                                            <ReadMoreText alldata={x} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Fragment>
                                );
                            })}
                        </CardContent>
                    ) : (<div className={"p-4"}>
                        <EmptyData 
                            emptyIcon={Icon.ideaEmpty}
                            children={<div className="space-y-4 text-center mt-[15px]">
                                <div>
                                <h2 className="text-xl font-bold">No Feedback Yet</h2>
                                <p>Build better with feedback, Create your first widget to start collecting insights.</p>
                                </div>
                                <Button onClick={() => navigate(`${baseUrl}/widget/type`)} className={`font-medium`}>
                                    Create Feedback Widget
                                </Button>
                            </div>}
                        />
                        </div>
                    )}

                    {ideasList.length > 0 ? (
                        <Pagination
                            pageNo={pageNo}
                            totalPages={totalPages}
                            isLoading={load === "search" || load === "list"}
                            handlePaginationClick={handlePaginationClick}
                            stateLength={ideasList.length}
                        />
                    ) : ("")}
                </Card>
                {load === "search" || load === "list" || !emptyContentBlock ? ("") : (
                    <EmptyDataContent
                        data={EmptyIdeaContent}
                        onClose={() => emptyContent(false)}
                        setSheetOpenCreate={openCreateIdea}
                        cookieName="hideIdeasEmptyContent"
                    />
                )}
            </div>

            <Dialog open={openDuplicateDialog} onOpenChange={closeDuplicateDialog}>
                <DialogContent className="sm:max-w-3xl p-0 gap-0 max-h-[80vh] overflow-y-auto">
                    {!isLoadingDuplicates && (
                        <DialogHeader className="p-4 border-b">
                            <DialogTitle className="text-md flex items-center gap-2">
                                {Icon.AIIcon}
                                AI Duplicate Finder
                            </DialogTitle>
                        </DialogHeader>
                    )}

                    <DialogDescription className="p-4 text-gray-900">
                        {isLoadingDuplicates ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <img src={AIanimation2} alt="AIanimation" className={"w-[200px] h-[200px]"} />
                                <p className="text-[18px] text-gray-800 mb-2 animate-pulse">AI is checking for duplicate patterns and similarities.</p>
                                <p className="text-xs text-gray-500 pt-2"> The first scan may take up to 30 seconds—thanks for bearing with us!</p>
                            </div>
                        ) : duplicateIdeas.length > 0 ? (
                            <div className="space-y-6 p-4">
                                {duplicateIdeas.map((group, groupIndex) => (
                                    <div key={groupIndex} className="border-[1px] border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3 relative">
                                        {duplicateIdeas.length > 1 && (
                                            <Badge variant="outline" className="bg-primary text-white border-primary font-semibold">
                                                Group #{groupIndex + 1}
                                            </Badge>
                                        )}
                                        <div className="flex items-center gap-3 border-b pb-2">
                                            <h3 className="font-semibold text-base text-gray-800 max-w-[calc(100%-80px)] truncate">
                                                {group.groupTitle}
                                            </h3>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto space-y-2 pb-4 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            {group.ideas.map((idea) => (

                                                <div key={idea.id} className="border rounded-lg p-3 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex flex-col gap-2 pt-1">
                                                            <div className="flex  gap-1">
                                                                <Checkbox
                                                                    checked={selectedDuplicateIds.includes(idea.id)}
                                                                    onCheckedChange={() => handleDuplicateSelect(idea.id)}
                                                                    className="w-4 h-4"
                                                                />
                                                                <span className="inline-block w-3 h-3 " style={{ fill: idea.userVote ? "#7c3aed" : "#6b7280", color: idea.userVote ? "#7c3aed" : "#6b7280" }}>
                                                                    {Icon.caretUp}
                                                                </span>
                                                                <span className="pl-1">{idea.vote || 0}</span>
                                                            </div>

                                                        </div>
                                                        <div className="flex-1 pl-2 max-w-[100%] truncate">
                                                            <h4 className="text-md text-black font-semibold mb-1 cursor-pointer max-w-[100%] truncate" onClick={() => openDetailsSheet(idea)}>{idea.title}</h4>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-3">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="mt-0.5">{Icon.chatbuble}</span>
                                                                    <span>{idea.commentCount || 0}</span>
                                                                </div>
                                                                <span>Created: {dayjs(idea.createdAt).format("D MMM")}</span>
                                                            </div>
                                                        </div>

                                                        <div className="ml-auto flex items-center gap-2">
                                                            {selectedDuplicateIds.includes(idea.id) ? (
                                                                <Badge variant="secondary" className="text-[10px]">Selected</Badge>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => mergeSelectedIdeas(idea.id)}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    <GitMerge className="w-3.5 h-3.5 mr-1" /> Set as Main
                                                                </Button>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {(() => {
                                            const groupSelectedCount = (group.ideas || []).filter(i => selectedDuplicateIds.includes(i.id)).length;
                                            const allSelectedInGroup = groupSelectedCount === (group.ideas || []).length && groupSelectedCount > 0;
                                            return (
                                                <div className="flex justify-end items-center gap-2">
                                                    <Button
                                                        onClick={() => showMergeDropdownHandler(groupIndex)}
                                                        disabled={groupSelectedCount === 0 || isMerging || allSelectedInGroup}
                                                        className="bg-primary hover:bg-primary/90"
                                                    >
                                                        {isMerging ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                Merging...
                                                            </>
                                                        ) : allSelectedInGroup ? (
                                                            "Cannot Merge All Feedbacks"
                                                        ) : (
                                                            `Merge selected feedbacks (${groupSelectedCount})`
                                                        )}
                                                    </Button>

                                                    {showMergeDropdown && activeMergeGroupIndex === groupIndex && (
                                                        <div className="absolute -bottom-2 right-0 translate-y-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label className="text-sm font-medium text-gray-700">Select Main Feedback</Label>
                                                                    <p className="text-xs text-gray-500 mt-1">Choose which feedback will be the main one (others will be merged into it)</p>
                                                                </div>

                                                                <Input
                                                                    placeholder="Search feedback titles..."
                                                                    value={mergeSearchTerm}
                                                                    onChange={(e) => setMergeSearchTerm(e.target.value)}
                                                                    className="w-full"
                                                                />

                                                                <div className="max-h-48 overflow-y-auto space-y-1">
                                                                    {(() => {
                                                                        const unselectedIdeas = (group.ideas || []).filter(idea => !selectedDuplicateIds.includes(idea.id));
                                                                        const filteredIdeas = unselectedIdeas.filter(idea => idea.title.toLowerCase().includes(mergeSearchTerm.toLowerCase()));

                                                                        if (filteredIdeas.length === 0) {
                                                                            return (
                                                                                <div className="text-center py-4 text-gray-500 text-sm">
                                                                                    {mergeSearchTerm ? "No matching feedback found" : "No unselected feedback available"}
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return filteredIdeas.map(idea => (
                                                                            <div
                                                                                key={idea.id}
                                                                                className="p-1 border rounded cursor-pointer hover:bg-gray-50 transition-colors bg-muted"
                                                                                onClick={() => mergeSelectedIdeas(idea.id)}
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[278px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-wrap">{idea.title}</h4>
                                                                                </div>
                                                                            </div>
                                                                        ));
                                                                    })()}
                                                                </div>

                                                                <div className="flex justify-end gap-2 pt-2 border-t">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setShowMergeDropdown(false)}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}

                                {(() => {
                                    const totalIdeas = duplicateIdeas.reduce((total, group) => total + group.ideas.length, 0);
                                    const allSelected = selectedDuplicateIds.length === totalIdeas;

                                    if (allSelected) {
                                        return (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                <p className="text-sm text-red-500">
                                                    <strong>No unselected feedback found</strong>
                                                    <p className="pt-1">You must leave at least one feedback unselected to serve as the main feedback.</p>
                                                </p>
                                            </div>
                                        );
                                    } else if (selectedDuplicateIds.length > 0) {
                                        return (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-sm text-blue-800">
                                                    <strong>Selected for merge:</strong> {selectedDuplicateIds.length} feedback(s) will be merged into the main feedback.
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2 flex-col">
                                <img className={"w-[35px] h-[35px]"} src={partyPopper} alt={"partyPopper"} />
                                <p className="text-[15px] text-gray-800 pt-3">No duplicate feedback found for this project.</p>
                            </div>
                        )}
                    </DialogDescription>
                    <DialogFooter className="p-4 border-t flex justify-end">
                        <Button variant="outline" onClick={closeDuplicateDialog}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProPlanModal
                isProModal={isProModal}
                setIsProModal={setIsProModal}
                setOpen={setOpenDuplicateDialog}
            />
        </Fragment>
    );
};

export default Ideas;
