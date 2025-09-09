import React, { Fragment, useCallback, useEffect, useRef, useState, } from "react";
import { Button } from "../ui/button";
import { ChevronDown, ChevronRight, ChevronUp, Circle, CirclePlus, CircleX, CornerDownLeft, Dot, Ellipsis, EllipsisVertical, Link, Loader2, Mail, MessageCircleMore, Paperclip, Trash2, User, } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../ui/table";
import { useToast } from "../ui/use-toast";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { DropdownMenu, DropdownMenuTrigger, } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import ReactQuillEditor from "../Comman/ReactQuillEditor";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "../ui/skeleton";
import CommonBreadCrumb from "../Comman/CommonBreadCrumb";
import ImageUploader from "../Comman/ImageUploader";
import { ActionButtons, CommentEditor, SaveCancelButton, UploadButton, UserAvatar, } from "../Comman/CommentEditor";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from "../ui/command";
import { debounce } from "lodash";
import EmptyData from "../Comman/EmptyData";
import Pagination from "../Comman/Pagination";
import { inboxMarkReadAction } from "../../redux/action/InboxMarkReadAction";
import { apiService, baseUrl, DO_SPACES_ENDPOINT, gitHubIntImg, handleImageOpen, HubSpotImg, isContentEmpty, isEmpty, JiraImg, onKeyFire, restoreImagePaths, slackIntImg, zapierIntImg, } from "../../utils/constent";
import PlanBadge from "../Comman/PlanBadge";
import GtiHubCreateIssue from "../Integrations/Modals/GtiHubCreateIssue";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip.jsx";
import CreateHubspotTicket from "../Integrations/Modals/CreateHubspotTicket";
import LinkExistingHubspotTicket from "../Integrations/Modals/LinkExistingHubspotTicket";
import CreateJiraTicket from "../Integrations/Modals/CreateJiraTicket";
import LinkExistingJiraTicket from "../Integrations/Modals/LinkExistingJiraTicket";
import { Icon } from "../../utils/Icon";
import { Badge } from "../ui/badge";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import DeleteDialog from "../Comman/DeleteDialog";
import { ReadMoreText } from "../Comman/ReadMoreText";
import { Card } from "../ui/card";
import ProPlanModal from "../Comman/ProPlanModal";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import { useImagePreview } from "../Comman/ImagePreviewProvider";
import GenerateSummaryModal from "./AI/GenerateSummaryModal";
import { useTheme } from "../theme-provider";

dayjs.extend(utc);
dayjs.extend(relativeTime);



const perPageLimit = 10;

const initialStateError = {
    title: "",
    description: "",
    boardId: "",
};

const initialUserError = {
    email: "",
    name: "",
};

const initialStateUser = {
    projectId: "",
    name: "",
    email: "",
    emailNotification: false,
    firstSeen: "",
    lastSeen: "",
    browser: "",
    ipAddress: "",
};

const UpdateIdea = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const { toast } = useToast();
    const { id } = useParams();
    const dispatch = useDispatch();
    const { openPreview } = useImagePreview();
    const { onProModal } = useTheme()
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const inboxMarkReadReducer = useSelector((state) => state.inboxMarkRead);
    const userDetailsReducer = useSelector((state) => state.userDetailsReducer);

    const [commentLimit, setCommentLimit] = useState(10);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [totalRecord, setTotalRecord] = useState(0);
    const [formError, setFormError] = useState(initialStateError);
    const [userDetailError, setUserDetailError] = useState(initialUserError);
    const [topicLists, setTopicLists] = useState([]);
    const [commentFiles, setCommentFiles] = useState([]);
    const [subCommentFiles, setSubCommentFiles] = useState([]);
    const [deletedCommentImage, setDeletedCommentImage] = useState([]);
    const [deletedSubCommentImage, setDeletedSubCommentImage] = useState([]);
    const [roadmapStatus, setRoadmapStatus] = useState([]);
    const [selectedIdea, setSelectedIdea] = useState({}); // update Feedback
    const [oldSelectedIdea, setOldSelectedIdea] = useState({});
    const [commentText, setCommentText] = useState("");
    const [subCommentText, setSubCommentText] = useState([]);
    const [subCommentTextEditIdx, setSubCommentTextEditIdx] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingIdeaVoteList, setIsLoadingIdeaVoteList] = useState(false);
    const [isLoadingCreateIdea, setIsLoadingCreateIdea] = useState('');
    const [isLoadingArchive, setIsLoadingArchive] = useState(false);
    const [isLoadingBug, setIsLoadingBug] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);
    const [selectedSubComment, setSelectedSubComment] = useState(null);
    const [selectedCommentIndex, setSelectedCommentIndex] = useState(null);
    const [selectedSubCommentIndex, setSelectedSubCommentIndex] = useState(null);
    const [isEditComment, setIsEditComment] = useState(false);
    const [isEditIdea, setIsEditIdea] = useState(false);
    const [ideaComment, setIdeaComment] = useState([]);
    const [isSaveComment, setIsSaveComment] = useState(false);
    const [isSaveUpdateComment, setIsSaveUpdateComment] = useState(false);
    const [isSaveUpdateSubComment, setIsSaveUpdateSubComment] = useState(false);
    const [isSaveSubComment, setIsSaveSubComment] = useState(false);
    const [filter, setFilter] = useState({ search: "", projectId: projectDetailsReducer.id, });
    const [usersDetails, setUsersDetails] = useState(initialStateUser);
    const [ideasVoteList, setIdeasVoteList] = useState([]);
    const [getAllUsersList, setGetAllUsersList] = useState([]);
    const [addUserDialog, setAddUserDialog] = useState({ addUser: false, viewUpvote: false, });
    const [imageSizeError, setImageSizeError] = useState("");

    const [isLinkedIssue, setIsLinkedIssue] = useState(false);
    const [open, setOpen] = useState(false);

    const [searchIssue, setSearchIssue] = useState("");
    const [isSearchIssueLoading, setIsSearchIssueLoading] = useState(false);
    const [gitHubLinkedIssue, setGitHubLinkedIssue] = useState([]);
    const [isOpenGHRepo, setIsOpenGHRepo] = useState(false);
    const [isGHRepoCreate, setIsGHRepoCreate] = useState(false);
    const [gitHubAllRepo, setGitHubAllRepo] = useState([]);
    const [gitHubRepoData, setGitHubRepoData] = useState({ issueDescription: "", issueTitle: "", repoName: "", githubIssueDetails: [], });
    const [linkIssueIndex, setLinkIssueIndex] = useState(null);
    const [integrationIncludes, setIntegrationIncludes] = useState([]);

    const [isOpenHPCT, setIsOpenHPCT] = useState(false);
    const [hpCTData, setHPCTData] = useState({ title: "", description: "", ticketPipeline: "0", ticketStage: "" });
    const [isHPCTCreate, setIsHPCTCCreate] = useState(false);
    const [isOpenLEHPT, setIsOpenLEHPT] = useState(false);
    const [lEHPTIndex, setLEHPTIndex] = useState(null);
    const [lEHPTRemoveIndex, setLEHPTRemoveIndex] = useState(null);
    const [hubSpotTickets, setHubSpotTickets] = useState([]);
    const [hubSpotTicketsShow, setHubSpotTicketsShow] = useState([]);

    // Jira ticket states
    const [isOpenJiraTicket, setIsOpenJiraTicket] = useState(false);
    const [jiraTicketData, setJiraTicketData] = useState({
        jiraProjectKey: "",
        issueType: "",
        issueTitle: "",
        issueDesc: ""
    });

    const [isJiraTicketCreate, setIsJiraTicketCreate] = useState(false);
    const [jiraIssuesShow, setJiraIssuesShow] = useState([]);
    const [isOpenLinkJiraTicket, setIsOpenLinkJiraTicket] = useState(false);
    const [linkJiraIndex, setLinkJiraIndex] = useState(null);
    const [jiraDeleteDialog, setJiraDeleteDialog] = useState({ isOpen: false, issueUrl: null, index: null });
    const [isJiraDeleteLoading, setIsJiraDeleteLoading] = useState(false);
    const [showAllJiraIssues, setShowAllJiraIssues] = useState(false);
    const [showAllHubSpotTickets, setShowAllHubSpotTickets] = useState(false);

    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [openBoardPopover, setOpenBoardPopover] = useState(false);
    const [openTopics, setOpenTopics] = useState(false);

    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, ticketId: null, index: null });
    const [githubDeleteDialog, setGithubDeleteDialog] = useState({ isOpen: false, url: null, index: null });
    const [deleteVoteDialog, setDeleteVoteDialog] = useState({ isOpen: false, userId: null, index: null });
    const listRef = useRef(null);
    const boardListRef = useRef(null);
    const topicListRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const [deleteIdeaDialog, setDeleteIdeaDialog] = useState({
        isOpen: false,
        ideaId: null,
    });
    const [isDeletingIdea, setIsDeletingIdea] = useState(false);

    const [mergedIdeas, setMergedIdeas] = useState([]);
    const [isUnmerging, setIsUnmerging] = useState(false);
    const [unmergeDialog, setUnmergeDialog] = useState({
        isOpen: false,
        ideaId: null,
        ideaTitle: ""
    });

    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [activeTab, setActiveTab] = useState("comment");
    const [openGenerateSummary, setOpenGenerateSummary] = useState(false);

    const integrationsImg = [
        { img: slackIntImg, imgClass: "w-8 h-8" },
        { img: gitHubIntImg, imgClass: "w-8 h-8" },
        { img: zapierIntImg, imgClass: "w-8 h-8" },
        { img: HubSpotImg, imgClass: "w-8 h-8" },
    ]

    const deleteIdea = async () => {
        setIsDeletingIdea(true);
        const data = await apiService.onDeleteIdea(deleteIdeaDialog.ideaId);
        setIsDeletingIdea(false);
        if (data.success) {
            toast({ description: data.message });
            navigate(`${baseUrl}/feedback?pageNo=${getPageNo}`);
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleWheelScroll = (ref) => (event) => {
        if (ref.current) {
            event.preventDefault();
            ref.current.scrollBy({ top: event.deltaY, behavior: 'smooth' });
        }
    };

    const handleTouchScroll = (e) => {
        e.stopPropagation();
    };

    const onToggleLinkIssue = () => {
        setIsLinkedIssue(!isLinkedIssue);
        setSearchIssue("");
    };

    const debouncedGetGitHubLinkedIssue = useCallback(
        debounce((val, projectId) => {
            if (!projectId) return;

            const payload = {
                projectId: projectId,
                keyword: val,
            };

            setIsSearchIssueLoading(true);
            apiService.getGitHubLinkedIssue(payload).then((data) => {
                setIsSearchIssueLoading(false);
                if (data.success) {
                    const results = data.data || [];
                    setGitHubLinkedIssue(results);
                    setOpen(true);
                } else {
                    toast({ variant: "destructive", description: data?.error?.message });
                }
            });
        }, 1000),
        [projectDetailsReducer.id]
    );

    const onChangeSearchIssue = (val) => {
        setSearchIssue(val);
        debouncedGetGitHubLinkedIssue(val, projectDetailsReducer.id);
    };

    useEffect(() => {
        return () => {
            debouncedGetGitHubLinkedIssue.cancel();
        };
    }, []);

    const openDialogs = (name, value) => {
        setAddUserDialog((prev) => ({ ...prev, [name]: value }));
        handlePopoverOpenChange();
    };

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllIntegrations();
        }
    }, [projectDetailsReducer.id]);

    useEffect(() => {
        if (projectDetailsReducer.id && integrationIncludes?.includes(2)) {
            getGitHubAllRepo();
        }
    }, [projectDetailsReducer.id, integrationIncludes]);

    const getGitHubAllRepo = async () => {
        const data = await apiService.getGitHubAllRepo({ projectId: projectDetailsReducer.id, });
        if (data.success) {
            setGitHubAllRepo(data.data.formattedRepos);
        }
    };

    const getAllIntegrations = async () => {
        const data = await apiService.getAllIntegrations(projectDetailsReducer.id);
        if (data.success) {
            setIntegrationIncludes(data?.data);
        }
    };

    const onSelectIssueUrl = async (url) => {
        const payload = {
            url: url,
            ideaId: id,
        };
        const data = await apiService.gitHubCreateLinkIssue(payload);
        if (data.success) {
            setSearchIssue("");
            setGitHubRepoData({
                ...gitHubRepoData,
                githubIssueDetails: [...(gitHubRepoData?.githubIssueDetails || []), data.data,],
            });
            setOpen(false);
            toast({ description: data?.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const deleteIssue = async (url, index) => {
        const payload = {
            ideaId: id,
            url: url,
        };
        setLinkIssueIndex(index);
        const data = await apiService.gitHubDeleteIssue(payload);
        setLinkIssueIndex(null);
        setGithubDeleteDialog({ isOpen: false, url: null, index: null });
        if (data.success) {
            let clone = [...gitHubRepoData?.githubIssueDetails];
            clone.splice(index, 1);
            setGitHubRepoData((prev) => ({ ...prev, githubIssueDetails: clone }));
            toast({ description: data?.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const openGithubDeleteDialog = (url, index) => {
        setGithubDeleteDialog({ isOpen: true, url, index });
    };

    const onCloseModal = () => {
        setIsOpenGHRepo(false);
        setGitHubRepoData({
            ...gitHubRepoData,
            issueTitle: selectedIdea?.title,
            issueDescription: selectedIdea?.slugUrl,
            repoName: "",
        });
    };

    const onCreateIssue = async () => {
        setIsGHRepoCreate(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            ideaId: id,
            issueDescription: gitHubRepoData?.issueDescription,
            issueTitle: gitHubRepoData?.issueTitle,
            repoName: gitHubRepoData?.repoName,
        };
        const data = await apiService.gitHubCreateIssue(payload);
        setIsGHRepoCreate(false);
        if (data.success) {
            onCloseModal();
            window.open(data?.data?.issueUrl, "_blank");
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const getAllComments = async () => {
        setIsLoadingComments(true);
        const data = await apiService.getIdeaComments({
            ideaId: id,
            page: 1,
            limit: commentLimit,
        });
        if (data.success) {
            setIsLoadingComments(false);
            const commentsWithShowReply = data.data.comments.map((comment) => ({
                ...comment,
                showReply: comment.showReply ?? false,
                reply: comment.reply
                    ? comment.reply.map((subComment) => ({
                        ...subComment,
                        isEdited: subComment.isEdited ?? false,
                        images: Array.isArray(subComment.images) ? subComment.images : [],
                    }))
                    : [],
            }));
            setIdeaComment({ ...data.data, comments: commentsWithShowReply });
            setHasMoreComments(data.data.comments.length < data.data.total);
        }
    };

    const loadMoreComments = () => {
        setCommentLimit((prevLimit) => prevLimit + 10);
    };

    const handlePopoverOpenChange = (isOpen) => {
        if (!isOpen) {
            setGetAllUsersList([]);
            setUsersDetails(initialStateUser);
            setUserDetailError(initialUserError);
            setFilter({ search: "", projectId: null });
        }
    };

    const getIdeaVotes = async (type = "", clone = [], preserveUserVote = undefined) => {
        setIsLoadingIdeaVoteList(true);
        const payload = {
            ideaId: selectedIdea.id,
            page: pageNo,
            limit: perPageLimit,
        };
        const data = await apiService.getIdeaVote(payload);
        if (data.success) {
            setIdeasVoteList(data.data.data);
            setTotalRecord(data.data.total);
            setSelectedIdea({
                ...selectedIdea,
                vote: data.data.vote,
                voteLists:
                    type === "delete"
                        ? pageNo === 1 ? clone : selectedIdea.voteLists
                        : type === "add" ? [...data.data.data] : [...selectedIdea.voteLists],
                userVote: preserveUserVote !== undefined ? preserveUserVote : selectedIdea.userVote
            });
            setIsLoadingIdeaVoteList(false);
        }
    };

    useEffect(() => {
        if (addUserDialog.viewUpvote) {
            getIdeaVotes();
        }
    }, [addUserDialog.viewUpvote, pageNo]);

    const totalPages = Math.ceil(totalRecord / perPageLimit);

    const handlePaginationClick = async (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setIsLoading(true);
            setPageNo(newPage);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getSingleIdea();
        }
    }, [projectDetailsReducer.id, getPageNo]);

    useEffect(() => {
        if (allStatusAndTypes.topics || allStatusAndTypes.roadmapStatus) {
            setTopicLists(allStatusAndTypes.topics);
            setRoadmapStatus(allStatusAndTypes.roadmapStatus);
        }
    }, [allStatusAndTypes]);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllComments();
        }
    }, [projectDetailsReducer.id, commentLimit]);

    useEffect(() => {
        if (addUserDialog.viewUpvote && projectDetailsReducer?.id) {
            getAllUsers("", projectDetailsReducer.id, 1, false);
        }
    }, [addUserDialog.viewUpvote, projectDetailsReducer?.id]);

    const getAllUsers = async (value, projectId, pageNo = 1, append = false) => {
        setIsLoadingUsers(true);
        const payload = {
            projectId,
            search: value,
            page: pageNo,
        };
        const data = await apiService.getAllUsers(payload);

        if (data.success) {
            setHasNext(data.data.next);
            setPage(pageNo);

            setGetAllUsersList((prev) => {
                if (append && prev?.customers) {
                    return {
                        ...data.data,
                        customers: [...prev.customers, ...data.data.customers],
                    };
                } else {
                    return data.data;
                }
            });
        }
        setIsLoadingUsers(false);
    };

    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || isLoadingUsers || !hasNext) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            getAllUsers(filter?.search || "", projectDetailsReducer.id, page + 1, true);
        }
    }, [isLoadingUsers, hasNext, page, filter?.search, projectDetailsReducer?.id]);

    const handleSearchChange = (value) => {
        const trimmedValue = value.trim();
        if (trimmedValue || value === "") {
            setFilter((prev) => ({
                ...prev,
                search: value,
                projectId: projectDetailsReducer.id,
            }));
            throttledDebouncedSearch(trimmedValue, projectDetailsReducer.id);
        }
    };

    const throttledDebouncedSearch = useCallback(
        debounce((value, projectId) => {
            if (value || value === "") {
                getAllUsers(value, projectId);
            }
        }, 500),
        []
    );

    const addUser = async () => {
        let validationErrors = {};
        Object.keys(usersDetails).forEach((name) => {
            const error = formValidate(name, usersDetails[name], "addUser");
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setUserDetailError(validationErrors);
            return;
        }
        setIsLoading(true);
        const payload = {
            ...usersDetails,
            projectId: projectDetailsReducer.id,
            firstSeen: new Date(),
            lastSeen: new Date(),
        };
        const data = await apiService.createUsers(payload);
        setIsLoading(false);
        if (data.success) {
            const newUser = {
                id: data.data.id,
                name: data.data.name,
                email: data.data.email,
                profileImage: null,
            };
            setIdeasVoteList((prev) => {
                const clone = [...prev];
                const filterEmail = clone.some((x) => x.email === newUser.email);
                if (filterEmail) {
                    toast({ description: "User with this email already exists.", variant: "destructive", });
                    return prev;
                }
                return [newUser, ...clone];
            });
            setSelectedIdea((prev) => ({
                ...prev,
                vote: prev.vote + 1,
                voteLists: [newUser, ...(prev.voteLists || [])],
            }));
            const upvoteResponse = await apiService.userManualUpVote({
                ideaId: selectedIdea.id,
                userId: data.data.id,
            });
            if (upvoteResponse.success) {
                toast({ description: upvoteResponse.message });
                await getIdeaVotes("add");
            } else {
                setIdeasVoteList((prev) => prev.filter((x) => x.id !== newUser.id));
                setSelectedIdea((prev) => ({
                    ...prev,
                    vote: prev.vote - 1,
                    voteLists: prev.voteLists.filter((x) => x.id !== newUser.id),
                }));
                toast({ description: upvoteResponse.error.message, variant: "destructive", });
            }
            setUserDetailError(initialUserError);
            openDialogs("addUser", false);
        } else {
            toast({ description: data.error.message, variant: "destructive" });
        }
    };

    const onDeleteUserConfirm = async (id, index) => {
        if (isLoading) {
            return;
        }
        setIsLoading(true);
        const payload = {
            id: id,
            ideaId: selectedIdea.id,
        };
        const data = await apiService.removeUserVote(payload);
        let clone = [...ideasVoteList];
        if (data.success) {
            setDeleteVoteDialog({ isOpen: false });
            const isCurrentUser = userDetailsReducer?.id == selectedIdea?.userId;
            clone.splice(index, 1);
            setIdeasVoteList(clone);
            toast({ description: data.message });
            const filterData = (selectedIdea?.voteLists || []).filter((x) => x.id !== id);

            setSelectedIdea((prev) => ({
                ...prev,
                voteLists: pageNo === 1 ? filterData : prev.voteLists,
                vote: filterData.length,
                userVote: isCurrentUser ? null : prev.userVote
            }));

            if (clone.length === 0 && pageNo > 1) {
                setPageNo(pageNo - 1);
            } else {
                await getIdeaVotes("delete", clone, isCurrentUser ? null : selectedIdea.userVote);
            }
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handleUserClick = async (user) => {
        const selectedUser = getAllUsersList?.customers?.find((u) => u.name === user.name);
        if (selectedUser) {
            const updatedVoteList = [...ideasVoteList];
            const existingUserIndex = updatedVoteList.findIndex((u) => u.name === selectedUser.name);

            if (existingUserIndex !== -1) {
                toast({ description: "User already exists in the upvote list.", variant: "destructive", });
                return;
            }

            if (existingUserIndex === -1) {
                const newUserPayload = {
                    name: selectedUser.name,
                    id: "",
                    profileImage: "",
                    email: selectedUser.email,
                };
                updatedVoteList.push(newUserPayload);
                const upvoteResponse = await apiService.userManualUpVote({ ideaId: selectedIdea.id, userId: selectedUser.id, });
                if (upvoteResponse.success) {
                    toast({ description: upvoteResponse.message });
                    setPageNo(1);
                } else {
                    toast({ description: upvoteResponse?.error?.message, variant: "destructive", });
                }
            } else {
                updatedVoteList.splice(existingUserIndex, 1);
            }
            setIdeasVoteList(updatedVoteList);
            getIdeaVotes("add");
        }
    };

    const onDeleteUser = (id, index) => {
        setDeleteVoteDialog({ isOpen: true, userId: id, index });
    };

    const getSingleIdea = async () => {
        setIsLoading(true);
        const data = await apiService.getSingleIdea(id);
        setIsLoading(false);
        if (data.success) {
            const ideaData = {
                ...data.data,
                isRead: 1,
                descriptionImages: Array.isArray(data.data.descriptionImages) ? data.data.descriptionImages : [],
            };
            setGitHubRepoData({
                ...gitHubRepoData,
                issueTitle: data.data?.title,
                issueDescription: data.data?.slugUrl,
                githubIssueDetails: data.data?.githubIssueDetails || [],
            });
            setHPCTData({
                ...hpCTData,
                title: data.data?.title,
                description: data.data?.slugUrl
            })
            setSelectedIdea(ideaData);
            setOldSelectedIdea(ideaData);

            if (data.data?.mergedIdeas && Array.isArray(data.data.mergedIdeas)) {
                setMergedIdeas(data.data.mergedIdeas);
            }

            const updateInbox = inboxMarkReadReducer.map((item) => {
                if (
                    (item.source === "feature_idea_comments" ||
                        item.source === "feature_ideas" ||
                        item.source === "feature_idea_votes") &&
                    item.id === data.data.id
                ) {
                    return { ...item, isRead: 1 };
                }
                return item;
            });
            setHubSpotTicketsShow(data.data?.hubSpotTickets)
            setJiraIssuesShow(data.data?.jiraIssueDetails)
            dispatch(inboxMarkReadAction(updateInbox));
        }
    };

    const handleChangeTopic = (id) => {
        const clone = [...selectedIdea.topic];
        const index = clone.findIndex((item) => item.id === id);
        if (index !== -1) {
            clone.splice(index, 1);
        } else {
            const topicToAdd = topicLists.find((item) => item.id === id);
            if (topicToAdd) {
                clone.push(topicToAdd);
            }
        }
        setSelectedIdea({ ...selectedIdea, topic: clone });
    };

    const giveVote = async (type) => {
        const payload = {
            ideaId: selectedIdea.id,
            type: type,
        };
        const data = await apiService.giveVote(payload);
        if (data.success) {
            const clone = { ...selectedIdea };
            let newVoteCount = clone.vote;
            newVoteCount = data?.data?.removeVote ? newVoteCount - 1 : newVoteCount + 1;
            let voteLists = [...clone.voteLists];
            const voterName = data.data.name || data.data?.firstname;
            if (data.data.removeVote) {
                voteLists = voteLists.filter(
                    (x) => (x.name || x?.firstname) !== voterName
                );
            } else {
                const alreadyExists = voteLists.some((x) => (x.name || x?.firstname) === voterName);
                if (!alreadyExists) {
                    voteLists.push(data.data);
                }
            }
            setSelectedIdea({
                ...clone,
                vote: newVoteCount,
                userVote: !data.data.removeVote,
                voteLists,
            });
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data.error?.message });
        }
    };

    const onChangeTextSubComment = (e) => {
        let selectedSubCommentObj = { ...selectedSubComment, comment: e.target.value, };
        setSelectedSubComment(selectedSubCommentObj);
        let index = ((selectedComment && selectedComment.reply) || []).findIndex((x) => x.id === selectedSubComment.id);
        if (index !== -1) {
            const cloneReplay = [...selectedComment.reply];
            cloneReplay[index] = selectedSubCommentObj;
            setSelectedComment({ ...selectedComment, reply: cloneReplay });
        }
    };

    const onCreateComment = async () => {
        setIsSaveComment(true);
        let formData = new FormData();
        for (let i = 0; i < commentFiles.length; i++) {
            formData.append(`images`, commentFiles[i]);
        }
        formData.append("comment", commentText);
        formData.append("ideaId", selectedIdea.id);
        formData.append("parentId", "");
        const data = await apiService.createComment(formData);
        if (data.success) {
            const newComment = {
                ...data.data,
                createdAt: data.data.createdAt || new Date().toISOString(),
                userId: data.data.userId || 1,
                name: data.data.name || userDetailsReducer?.name || "Anonymous",
                profileImage: data.data.profileImage || null,
                reply: [],
                showReply: false,
                isEdited: false,
            };
            setIdeaComment((prev) => ({ ...prev, comments: [newComment, ...(prev.comments || [])], }));
            setSelectedIdea((prev) => ({ ...prev, comments: [newComment, ...(prev.comments || [])], }));
            toast({ description: data.message });
            setCommentText("");
            setCommentFiles([]);
            setIsSaveComment(false);
        } else {
            setIsSaveComment(false);
            toast({ variant: "destructive", description: data.error.message });
        }
    };

    const onCreateSubComment = async (record, index) => {
        setIsSaveSubComment(true);
        let formData = new FormData();
        for (let i = 0; i < subCommentFiles.length; i++) {
            formData.append(`images`, subCommentFiles[i]);
        }
        const commentText = subCommentText[index] || "";
        formData.append("comment", commentText);
        formData.append("ideaId", selectedIdea.id);
        formData.append("parentId", record.id);
        const data = await apiService.createComment(formData);
        setIsSaveSubComment(false);
        if (data.success) {
            const newSubComment = {
                ...data.data,
                createdAt: data.data.createdAt || new Date().toISOString(),
                userId: data.data.userId || userDetailsReducer?.id || 1,
                name: data.data.name || userDetailsReducer?.name || "Anonymous",
                profileImage: data.data.profileImage || null,
                isEdited: false,
                images: Array.isArray(data.data.images) ? data.data.images : [],
            };
            setIdeaComment((prev) => {
                const comments = prev.comments || [];
                if (!comments[index]) {
                    return prev;
                }
                const updatedComments = [...comments];
                updatedComments[index] = {
                    ...updatedComments[index],
                    reply: [...(updatedComments[index].reply || []), newSubComment],
                    showReply: true,
                };
                return { ...prev, comments: updatedComments };
            });
            setSelectedIdea((prev) => {
                const comments = prev.comments || [];
                if (!comments[index]) {
                    return prev;
                }
                const updatedComments = [...comments];
                updatedComments[index] = {
                    ...updatedComments[index],
                    reply: [...(updatedComments[index].reply || []), newSubComment],
                    showReply: true,
                };
                return { ...prev, comments: updatedComments };
            });
            setSubCommentText((prev) => {
                const newText = [...prev];
                newText[index] = "";
                return newText;
            });
            setSubCommentFiles([]);
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleFeatureImgUpload = async (event) => {
        const file = event.target?.files[0];
        if (!file) return;
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setFormError((prev) => ({ ...prev, coverImage: "Featured image must be less than 5MB", }));
            event.target.value = "";
            return;
        }
        setFormError((prev) => ({ ...prev, coverImage: "" }));
        setSelectedIdea({ ...selectedIdea, coverImage: file });
        let formData = new FormData();
        formData.append("coverImage", file);
        const data = await apiService.updateIdea(formData, selectedIdea.id);
        if (data.success) {
            setSelectedIdea({ ...data.data });
            setIsLoading(false);
            setIsEditIdea(false);
            toast({ description: data.message });
        } else {
            setIsLoading(false);
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleAddCommentImg = (event, isEdit = false) => {
        const files = Array.from(event.target.files);
        const existingImages = isEdit && selectedComment && selectedComment.images ? selectedComment.images.length : commentFiles.length;
        const remainingSlots = 5 - existingImages;
        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024).filter(file => file.type.includes("image")).slice(0, remainingSlots);

        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast({ variant: "destructive", description: "Some files exceeded the 5MB limit." });
        }

        const invalidTypeFiles = files.filter(file => !file.type.includes("image"));
        if (invalidTypeFiles.length > 0) {
            toast({ variant: "destructive", description: "Only image files are allowed." });
        }

        if (isEdit && selectedComment && selectedComment.id) {
            const images = Array.isArray(selectedComment.images) ? selectedComment.images : [];
            const clone = [...images, ...validFiles];
            setSelectedComment({ ...selectedComment, images: clone });
        } else {
            setCommentFiles([...commentFiles, ...validFiles]);
        }
        event.target.value = "";
    };

    const handleSubCommentUploadImg = (event) => {
        const files = Array.from(event.target.files);
        const existingImages = (selectedSubComment && selectedSubComment.images) ? selectedSubComment.images.length : subCommentFiles.length;
        const remainingSlots = 5 - existingImages;
        const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024).filter(file => file.type.includes("image")).slice(0, remainingSlots);
        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast({ variant: "destructive", description: "Some files exceeded the 5MB limit." });
        }

        const invalidTypeFiles = files.filter(file => !file.type.includes("image"));
        if (invalidTypeFiles.length > 0) {
            toast({ variant: "destructive", description: "Only image files are allowed." });
        }
        if (selectedSubComment && selectedSubComment.id && selectedComment && selectedComment.id) {
            const currentImages = Array.isArray(selectedSubComment.images) ? selectedSubComment.images : [];
            const clone = [...currentImages, ...validFiles];
            let selectedSubCommentObj = { ...selectedSubComment, images: clone };
            setSelectedSubComment(selectedSubCommentObj);
            let index = ((selectedComment && selectedComment.reply) || []).findIndex((x) => x.id === selectedSubComment.id);
            if (index !== -1) {
                const cloneReplay = [...selectedComment.reply];
                cloneReplay[index] = selectedSubCommentObj;
                setSelectedComment({ ...selectedComment, reply: cloneReplay });
            }
        } else {
            setSubCommentFiles([...subCommentFiles, ...validFiles]);
        }
        event.target.value = "";
    };

    const onChangeStatus = async (name, value) => {
        if (name === "isActive") {
            setIsLoadingBug(true);
        } else if (name === "isArchive") {
            setIsLoadingArchive(true);
        }
        if (name === "removeCoverImage") {
            setSelectedIdea({ ...selectedIdea, coverImage: "" });
        } else {
            setSelectedIdea({ ...selectedIdea, [name]: value });
        }
        let formData = new FormData();
        if (name === "roadmapStatusId" && value === null) {
            value = "";
        }
        formData.append(name, value);
        const data = await apiService.updateIdea(formData, selectedIdea.id);
        if (data.success) {
            setIsLoading(false);
            setIsLoadingBug(false);
            setIsLoadingArchive(false);
            setIsEditIdea(false);
            toast({ description: data.message });
        } else {
            setIsLoading(false);
            setIsLoadingBug(false);
            setIsLoadingArchive(false);
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const onShowSubComment = (index) => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
        setIsEditComment(false);
        setCommentFiles([]);
        setIdeaComment((prev) => {
            const updatedComments = (prev.comments || []).map((comment, i) => ({
                ...comment,
                showReply: i === index ? !comment.showReply : false,
                reply: comment.reply || [],
            }));
            return { ...prev, comments: updatedComments };
        });
        setIdeaComment((prev) => {
            if (prev.comments[index]?.showReply) {
                setSubCommentText((prevText) => {
                    const newText = [...prevText];
                    newText[index] = "";
                    return newText;
                });
                setSubCommentTextEditIdx(index);
            } else {
                setSubCommentText((prevText) => {
                    const newText = [...prevText];
                    newText[index] = "";
                    return newText;
                });
                setSubCommentTextEditIdx(null);
            }
            return prev;
        });
        setSelectedIdea((prev) => {
            const updatedComments = (prev.comments || []).map((comment, i) => ({
                ...comment,
                showReply: i === index ? !comment.showReply : false,
                reply: comment.reply || [],
            }));
            return { ...prev, comments: updatedComments };
        });
    };

    const onEditComment = (record, index) => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
        setIsEditComment(false);
        setIdeaComment((prev) => {
            const updatedComments = (prev.comments || []).map((comment, i) => ({
                ...comment,
                showReply: i === index ? comment.showReply : false,
                reply: comment.reply || [],
            }));
            return { ...prev, comments: updatedComments };
        });

        setSelectedIdea((prev) => {
            const updatedComments = (prev.comments || []).map((comment, i) => ({
                ...comment,
                showReply: i === index ? comment.showReply : false,
                reply: comment.reply || [],
            }));
            return { ...prev, comments: updatedComments };
        });
        setSubCommentText((prev) => {
            const newText = [...prev];
            return newText.map((text, i) => (i === index ? text : ""));
        });
        setSubCommentTextEditIdx((prev) => (prev === index ? prev : null));
        setSelectedComment(record);
        setSelectedCommentIndex(index);
        setIsEditComment(true);
        setDeletedCommentImage([]);
        setCommentFiles([]);
        setSubCommentFiles([]);
    };

    const onEditSubComment = (record, subRecord, index, subIndex) => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
        setSelectedComment(record);
        setSelectedCommentIndex(index);
        setSelectedSubComment(subRecord);
        setSelectedSubCommentIndex(subIndex);
        setIsEditComment(false);
        setCommentFiles([]);
        setSubCommentFiles([]);
    };

    const onCancelComment = () => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setIsEditComment(false);
    };

    const onCancelSubComment = () => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
    };

    const onDeleteCommentImage = (index, isOld) => {
        if (isOld) {
            const cloneImages = [...selectedComment.images];
            const cloneDeletedImages = [...deletedCommentImage];

            const imageToDelete = cloneImages[index];
            if (typeof imageToDelete === "string") {
                cloneDeletedImages.push(imageToDelete);
            } else if (imageToDelete instanceof File) {
            }

            cloneImages.splice(index, 1);
            setSelectedComment({ ...selectedComment, images: cloneImages, });
            setDeletedCommentImage(cloneDeletedImages);
        } else {
            const cloneNewImages = [...selectedComment.images];
            cloneNewImages.splice(index, 1);
            setSelectedComment({ ...selectedComment, images: cloneNewImages, });
        }
    };

    const onDeleteSubCommentImage = (index, isOld) => {
        if (isOld) {
            const cloneImages = [...selectedSubComment.images];
            const cloneDeletedImages = [...deletedSubCommentImage];
            cloneDeletedImages.push(cloneImages[index]);
            cloneImages.splice(index, 1);
            setSelectedSubComment({ ...selectedSubComment, images: cloneImages, });
            setDeletedSubCommentImage(cloneDeletedImages);
        } else {
            const cloneNewImages = [...selectedSubComment.images];
            cloneNewImages.splice(index, 1);
            setSelectedSubComment({ ...selectedSubComment, images: cloneNewImages, });
        }
    };

    const onUpdateComment = async () => {
        setIsSaveUpdateComment(true);
        let formData = new FormData();
        if (
            selectedComment &&
            selectedComment.images &&
            selectedComment.images.length
        ) {
            for (let i = 0; i < selectedComment.images.length; i++) {
                formData.append(`images`, selectedComment.images[i]);
            }
        }

        const currentImageFilenames = selectedComment?.images.map((img) => {
            if (typeof img === "string") {
                return img;
            } else if (img instanceof File) {
                return img.name;
            }
            return "";
        });

        const validDeletedImages = deletedCommentImage.filter((deletedImg) => {
            return !currentImageFilenames.includes(deletedImg);
        });

        for (let i = 0; i < validDeletedImages.length; i++) {
            formData.append(`removeImages[${i}]`, validDeletedImages[i]);
        }

        formData.append("comment", selectedComment.comment);
        const data = await apiService.updateComment(selectedComment.id, formData);
        setIsSaveUpdateComment(false);
        if (data.success) {
            const updatedComment = {
                ...selectedComment,
                ...data.data,
                images: Array.isArray(data.data.images) ? data.data.images : [],
                isEdited: true,
                showReply: selectedComment.showReply || false,
                reply: selectedComment.reply || [],
            };
            setIdeaComment((prev) => {
                const updatedComments = [...(prev.comments || [])];
                updatedComments[selectedCommentIndex] = updatedComment;
                return { ...prev, comments: updatedComments };
            });
            setSelectedIdea((prev) => {
                const updatedComments = [...(prev.comments || [])];
                updatedComments[selectedCommentIndex] = updatedComment;
                return { ...prev, comments: updatedComments };
            });
            setSelectedCommentIndex(null);
            setSelectedComment(null);
            setIsEditComment(false);
            setDeletedCommentImage([]);
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const onUpdateSubComment = async () => {
        setIsSaveUpdateSubComment(true);
        let formData = new FormData();
        if (
            selectedSubComment &&
            selectedSubComment.images &&
            selectedSubComment.images.length
        ) {
            for (let i = 0; i < selectedSubComment.images.length; i++) {
                formData.append(`images`, selectedSubComment.images[i]);
            }
        }
        for (let i = 0; i < deletedSubCommentImage.length; i++) {
            formData.append(`removeImages[${i}]`, deletedSubCommentImage[i]);
        }
        formData.append("comment", selectedSubComment.comment);
        const data = await apiService.updateComment(selectedSubComment.id, formData);
        if (data.success) {
            setIdeaComment((prev) => {
                const updatedComments = [...(prev.comments || [])];
                const parentCommentIndex = updatedComments.findIndex((comment) => comment.id === selectedComment.id);
                if (parentCommentIndex !== -1) {
                    const subCommentIndex = updatedComments[parentCommentIndex].reply.findIndex((reply) => reply.id === selectedSubComment.id);
                    if (subCommentIndex !== -1) {
                        const updatedReplies = [...updatedComments[parentCommentIndex].reply,];
                        updatedReplies[subCommentIndex] = {
                            ...updatedReplies[subCommentIndex],
                            ...data.data,
                            isEdited: true,
                            images: Array.isArray(data.data.images) ? data.data.images : [],
                        };
                        updatedComments[parentCommentIndex] = { ...updatedComments[parentCommentIndex], reply: updatedReplies, };
                    }
                }
                return { ...prev, comments: updatedComments };
            });
            setSelectedIdea((prev) => {
                const updatedComments = [...(prev.comments || [])];
                const parentCommentIndex = updatedComments.findIndex((comment) => comment.id === selectedComment.id);
                if (parentCommentIndex !== -1) {
                    const subCommentIndex = updatedComments[parentCommentIndex].reply.findIndex((reply) => reply.id === selectedSubComment.id);
                    if (subCommentIndex !== -1) {
                        const updatedReplies = [...updatedComments[parentCommentIndex].reply,];
                        updatedReplies[subCommentIndex] = {
                            ...updatedReplies[subCommentIndex],
                            ...data.data,
                            isEdited: true,
                            images: Array.isArray(data.data.images) ? data.data.images : [],
                        };
                        updatedComments[parentCommentIndex] = { ...updatedComments[parentCommentIndex], reply: updatedReplies, };
                    }
                }
                return { ...prev, comments: updatedComments };
            });
            setSelectedComment(null);
            setSelectedCommentIndex(null);
            setSelectedSubComment(null);
            setSelectedSubCommentIndex(null);
            setDeletedSubCommentImage([]);
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
        setIsSaveUpdateSubComment(false);
    };

    const deleteComment = async (id, indexs) => {
        const data = await apiService.deleteComment(id);
        if (data.success) {
            setIdeaComment((prev) => {
                const updatedComments = [...(prev.comments || [])];
                updatedComments.splice(indexs, 1);
                const updatedIdeaComment = { ...prev, comments: updatedComments };
                return updatedIdeaComment;
            });
            setSelectedIdea((prev) => {
                const updatedComments = [...(prev.comments || [])];
                updatedComments.splice(indexs, 1);
                const updatedSelectedIdea = { ...prev, comments: updatedComments };
                return updatedSelectedIdea;
            });

            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const deleteSubComment = async (id, record, index, subIndex) => {
        const data = await apiService.deleteComment(id);
        if (data.success) {
            setIdeaComment((prev) => {
                const updatedComments = [...(prev.comments || [])];
                if (!updatedComments[index]) {
                    return prev;
                }
                const updatedReplies = [...(updatedComments[index].reply || [])];
                if (!updatedReplies[subIndex]) {
                    return prev;
                }
                updatedReplies.splice(subIndex, 1);
                updatedComments[index] = {
                    ...updatedComments[index],
                    reply: updatedReplies,
                    showReply: updatedReplies.length > 0 ? true : false,
                };
                const updatedIdeaComment = { ...prev, comments: updatedComments };
                return updatedIdeaComment;
            });
            setSelectedIdea((prev) => {
                const updatedComments = [...(prev.comments || [])];
                if (!updatedComments[index]) {
                    return prev;
                }
                const updatedReplies = [...(updatedComments[index].reply || [])];
                if (!updatedReplies[subIndex]) {
                    return prev;
                }
                updatedReplies.splice(subIndex, 1);
                updatedComments[index] = {
                    ...updatedComments[index],
                    reply: updatedReplies,
                    showReply: updatedReplies.length > 0 ? true : false,
                };
                const updatedSelectedIdea = { ...prev, comments: updatedComments };
                return updatedSelectedIdea;
            });
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const formValidate = (name, value, type) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Title is required";
                } else {
                    return "";
                }
            case "boardId":
                if (!value || value?.toString()?.trim() === "") {
                    return "Board is required";
                } else {
                    return "";
                }
            case "name":
                if (type === "addUser") {
                    if (!value || value.trim() === "") {
                        return "User name is required";
                    }
                }
                return "";
            case "email":
                if (type === "addUser") {
                    if (value.trim() === "") return "User email is required";
                    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value))
                        return "Enter a valid email address";
                }
                return "";
            default: {
                return "";
            }
        }
    };

    const onChangeText = (event) => {
        const { name, value } = event.target;
        const trimmedValue = name === "title" || name === "description" ? value.trimStart() : value;
        setSelectedIdea((prev) => ({ ...prev, [name]: trimmedValue }));
        setUsersDetails((prev) => ({ ...prev, [name]: trimmedValue }));
        setFormError((prev) => ({ ...prev, [name]: formValidate(name, trimmedValue), }));
        setUserDetailError((prev) => ({ ...prev, [name]: formValidate(name, trimmedValue, "addUser"), }));
        if (name === "description" && imageSizeError) {
            setImageSizeError("");
        }
    };
    const plan = projectDetailsReducer?.plan; // Adjust if the plan property is named differently

    let filteredBoards = allStatusAndTypes?.boards || [];
    if (plan === 0) {
        filteredBoards = filteredBoards.slice(0, 1);
    } else if (plan === 1) {
        filteredBoards = filteredBoards.slice(0, 5);
    } else if (plan === 2) {
        filteredBoards = filteredBoards.slice(0, 10);
    }

    const generateImageKey = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "#";
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const transformDescription = (description, descriptionImages) => {
        if (!description) return { transformedHtml: description, keysToDelete: [], updatedImages: [] };

        const parser = new DOMParser();
        const doc = parser.parseFromString(description, "text/html");
        const images = doc.getElementsByTagName("img");
        const updatedImages = [...descriptionImages];
        const currentImageKeys = [];
        const keysToDelete = [];

        for (let img of images) {
            const imageUrl = img.src;
            if (imageUrl.startsWith('#')) {
                currentImageKeys.push(imageUrl);
                const existingImg = descriptionImages.find(imgObj => imgObj.key === imageUrl);
                if (existingImg) {
                    updatedImages.push(existingImg);
                }
            } else if (imageUrl.includes(DO_SPACES_ENDPOINT)) {
                const filename = imageUrl.split('/').pop();
                const existingImg = descriptionImages.find(imgObj => imgObj.path.includes(filename) || imgObj.fullPath?.includes(filename));
                if (existingImg) {
                    img.src = existingImg.key;
                    currentImageKeys.push(existingImg.key);
                } else {
                    const newKey = generateImageKey();
                    img.src = newKey;
                    updatedImages.push({
                        key: newKey,
                        path: filename,
                        fullPath: `feature-idea/${projectDetailsReducer.id}/${filename}`
                    });
                    currentImageKeys.push(newKey);
                }
            }
        }
        const deletedImages = descriptionImages.filter(img => !currentImageKeys.includes(img.key));
        keysToDelete.push(...deletedImages.map(img => img.fullPath));
        return {
            transformedHtml: doc.body.innerHTML,
            keysToDelete,
            updatedImages: descriptionImages.filter(img => currentImageKeys.includes(img.key))
        };
    };

    const deleteImages = async (keysToDelete) => {
        const payload = { keys: keysToDelete.map(key => key?.fullPath ? key?.fullPath : key?.path).filter(path => path) };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {

        } else {
            toast({ description: response.error?.message || 'Failed to delete images', variant: "destructive" });
        }
    };

    const handleUnmergeClick = (ideaId, ideaTitle) => {
        setUnmergeDialog({
            isOpen: true,
            ideaId: ideaId,
            ideaTitle: ideaTitle
        });
    };

    const confirmUnmergeIdea = async () => {
        setIsUnmerging(true);
        try {
            const payload = {
                mainIdeaId: selectedIdea.id,
                duplicateIdeaId: unmergeDialog.ideaId
            };

            const data = await apiService.unmergeIdeas(payload);

            if (data.success) {
                toast({ description: data.message || "Feedback unmerged successfully" });
                setMergedIdeas(prev => prev.filter(idea => idea.id !== unmergeDialog.ideaId));
                getSingleIdea();
                setUnmergeDialog({ isOpen: false, ideaId: null, ideaTitle: "" });
            } else {
                toast({ description: data?.error?.message || "Failed to unmerge Feedback", variant: "destructive" });
            }
        } catch (error) {
            toast({ description: "Failed to unmerge Feedback", variant: "destructive" });
        } finally {
            setIsUnmerging(false);
        }
    };

    const onCreateIdea = async (load) => {
        const trimmedTitle = selectedIdea.title ? selectedIdea.title.trim() : "";
        const trimmedDescription = selectedIdea.description ? selectedIdea.description.trim() : "";
        const updatedIdea = {
            ...selectedIdea,
            title: trimmedTitle,
            description: trimmedDescription,
        };
        setSelectedIdea(updatedIdea);
        let validationErrors = {};
        Object.keys(selectedIdea).forEach((name) => {
            const error = formValidate(name, selectedIdea[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (imageSizeError) {
            validationErrors.imageSizeError = imageSizeError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        setIsLoadingCreateIdea(load);
        let formData = new FormData();
        let topics = (selectedIdea.topic || []).map((x) => x.id).filter((id) => id != null);
        formData.append("title", selectedIdea.title);
        formData.append("boardId", selectedIdea.boardId);
        const { transformedHtml, keysToDelete } = transformDescription(selectedIdea.description, selectedIdea.descriptionImages || []);
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete])].filter(
            (key) => key !== null && key !== undefined && key !== ""
        );
        formData.append("description", transformedHtml);
        if (topics.length > 0) {
            topics.forEach((id) => formData.append("topicId[]", id));
        } else {
            formData.append("topicId[]", "");
        }
        // if (selectedIdea.descriptionImages?.length > 0) {
        const imagesToSend = selectedIdea.descriptionImages?.map((img) => ({
            key: img.key,
            path: img.path.includes("/") ? img.path.split("/").pop() : img.path,
        }));
        formData.append("descriptionImages", JSON.stringify(imagesToSend));
        // }
        if (selectedIdea.image) {
            const resizedImage = await resizeImage(selectedIdea.image);
            formData.append("image", resizedImage);
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.updateIdea(formData, selectedIdea.id);
        setIsLoadingCreateIdea('');
        if (data.success) {
            setImagesToDelete([]);
            setOldSelectedIdea({ ...selectedIdea });
            setIsEditIdea(false);
            setImageSizeError("");
            toast({ description: data.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    };

    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => { resolve(blob); }, "image/jpeg", 0.7);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleOnCreateCancel = () => {
        setSelectedIdea(oldSelectedIdea);
        setFormError(initialStateError);
        setIsEditIdea(false);
        setImageSizeError("");
        setSelectedComment(null);
        setDeletedCommentImage([]);
        setCommentFiles([]);
    };

    const onDeleteImageComment = (index) => {
        const clone = [...commentFiles];
        clone.splice(index, 1);
        setCommentFiles(clone);
    };

    const onDeleteSubCommentImageOld = (index) => {
        const clone = [...subCommentFiles];
        clone.splice(index, 1);
        setSubCommentFiles(clone);
    };

    const fromCreateSheet = location.state?.fromCreateSheet === true;
    const links = [{
        label: "Feedback",
        path: fromCreateSheet ? `/feedback?opensheet=open` : `/feedback?pageNo=${getPageNo}`
    }];

    const handleSubCommentTextChange = (e, index) => {
        setSubCommentText((prev) => {
            const newSubCommentText = [...prev];
            newSubCommentText[index] = e.target.value;
            return newSubCommentText;
        });
    };

    const setImages = (updater) => {
        setSelectedIdea((prev) => {
            const updatedImages = typeof updater === "function" ? updater(prev) : updater;
            return { ...prev, ...updatedImages };
        });
    };

    const onCloseModalCHT = () => {
        setIsOpenHPCT(false)
        setHPCTData({
            ...hpCTData,
            ticketStage: '',
            title: selectedIdea?.title,
            description: selectedIdea?.slugUrl
        })
    }

    const onCreateHPTicket = async () => {
        const payload = {
            ...hpCTData,
            ideaId: id
        }
        setIsHPCTCCreate(true)
        const data = await apiService.createHubSpotTicket(payload);
        setIsHPCTCCreate(false)
        if (data.success) {
            onCloseModalCHT()
            if (data?.data) {
                setHubSpotTicketsShow([...hubSpotTicketsShow, data.data]);
            }
            toast({ description: data?.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    }

    const onCloseModalLEHPT = () => {
        setIsOpenLEHPT(false)
    }

    const onCreateLEHPT = async (ticketId, index) => {
        const payload = {
            ticketId: ticketId,
            ideaId: id,
        }
        setLEHPTIndex(ticketId)
        const data = await apiService.hubSpotLinkTicket(payload);
        setLEHPTIndex(null)
        if (data.success) {
            let clone = [...hubSpotTickets]
            clone.splice(index, 1)
            setHubSpotTickets(clone)
            if (data?.data?.ticket) {
                setHubSpotTicketsShow([...hubSpotTicketsShow, data.data.ticket]);
            }
            toast({ description: data?.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    }

    const onHubSpotRemoveTicket = async (ticketId, index) => {
        const payload = {
            ticketId: ticketId,
            ideaId: id,
        }
        setLEHPTRemoveIndex(ticketId)
        const data = await apiService.hubSpotRemoveTicket(payload);
        setLEHPTRemoveIndex(null)
        setDeleteDialog({ isOpen: false, ticketId: null, index: null });
        if (data.success) {
            let clone = [...hubSpotTicketsShow]
            clone.splice(index, 1)
            setHubSpotTicketsShow(clone)
            toast({ description: data?.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    }

    const onCloseJiraTicketModal = () => {
        setIsOpenJiraTicket(false);
        setJiraTicketData({
            jiraProjectKey: "",
            issueType: "",
            issueTitle: selectedIdea?.title || "",
            issueDesc: selectedIdea?.description || ""
        });
    }

    const onCreateJiraTicket = async () => {
        const payload = {
            projectId: projectDetailsReducer.id,
            jiraProjectKey: jiraTicketData.jiraProjectKey,
            issueType: jiraTicketData.issueType,
            issueTitle: jiraTicketData.issueTitle,
            issueDesc: jiraTicketData.issueDesc,
            ideaId: id
        }

        setIsJiraTicketCreate(true);
        const data = await apiService.createJiraIssue(payload);
        setIsJiraTicketCreate(false);
        if (data.success) {
            onCloseJiraTicketModal();
            if (data?.data?.issueDetails) {
                setJiraIssuesShow((prev) => [...prev, data.data.issueDetails]);
            }

            toast({ description: data?.message || "Jira issue created successfully!" });
        } else {
            toast({ description: data?.error?.message || "Failed to create Jira ticket", variant: "destructive" });
        }
    }

    const onCloseLinkJiraTicketModal = () => {
        setIsOpenLinkJiraTicket(false);
        setLinkJiraIndex(null);
    }

    const onLinkJiraTicket = async (issueKey, index) => {

        const payload = {
            ideaId: id,
            issueKey: issueKey
        }
        setLinkJiraIndex(index);
        setIsJiraTicketCreate(true);

        const data = await apiService.linkJiraIssue(payload);
        setLinkJiraIndex(null);
        setIsJiraTicketCreate(false);
        if (data.success) {
            if (data?.data?.issueDetails) {
                setJiraIssuesShow((prev) => [...prev, data.data.issueDetails]);
            }
            toast({ description: data?.message || "Jira issue linked successfully!" });

            // Return success status so LinkExistingJiraTicket can update its state
            return { success: true, index };
        } else {
            toast({ description: data?.error?.message || "Failed to link Jira issue", variant: "destructive" });
            return { success: false };
        }
    }

    const openJiraDeleteDialog = (issueUrl, index) => {
        setJiraDeleteDialog({ isOpen: true, issueUrl, index });
    };

    const onDeleteJiraIssue = async () => {
        const payload = {
            ideaId: id,
            issueUrl: jiraDeleteDialog.issueUrl
        }
        setIsJiraDeleteLoading(true);
        const data = await apiService.unlinkJiraIssue(payload);
        setIsJiraDeleteLoading(false);
        if (data.success) {
            let clone = [...jiraIssuesShow];
            clone.splice(jiraDeleteDialog.index, 1);
            setJiraIssuesShow(clone);
            setJiraDeleteDialog({ isOpen: false, issueUrl: null, index: null });
            toast({ description: data?.message || "Jira issue unlinked successfully!" });
        } else {
            toast({ description: data?.error?.message || "Failed to unlink Jira issue", variant: "destructive" });
        }
    }

    const openDeleteDialog = (ticketId, index) => {
        setDeleteDialog({ isOpen: true, ticketId, index });
    };

    const onRedirectToUser = () => {
        if (selectedIdea?.createdBy !== 1) {
            navigate(`${baseUrl}/user?search=${encodeURIComponent(selectedIdea?.name || selectedIdea?.userName || '')}`);
        }
    }

    const isOwner = userDetailsReducer?.id == projectDetailsReducer?.userId;
    const userPlan = isOwner ? userDetailsReducer?.plan : projectDetailsReducer?.plan;

    // Handler to show ProPlanModal
    const handleShowProModal = () => onProModal(true);

    const handleImagePreview = useCallback((imageOrImages, index = 0) => {
        if (Array.isArray(imageOrImages)) {
            openPreview(imageOrImages, index);
        } else {
            // For single image, convert to array
            const imgSrc = imageOrImages.name ?
                URL.createObjectURL(imageOrImages) :
                `${DO_SPACES_ENDPOINT}/${imageOrImages}`;
            openPreview([imgSrc], 0);
        }
    }, [openPreview]);


    const handleOpenGenerateSummary = () => {
        if (projectDetailsReducer.plan === 3 && projectDetailsReducer.stripeStatus === 'active' && id !== "new") {
            setOpenGenerateSummary(true);
        } else {
            onProModal(true);
        }
    }

    return (
        <Fragment>
            <Fragment>
                {
                    projectDetailsReducer.plan === 3 && projectDetailsReducer.stripeStatus === 'active' && id !== "new" && (
                        <Fragment>
                            <GenerateSummaryModal openGenerateSummary={openGenerateSummary} setOpenGenerateSummary={setOpenGenerateSummary} />
                        </Fragment>
                    )
                }
                <DeleteDialog
                    isOpen={unmergeDialog.isOpen}
                    onOpenChange={(isOpen) => setUnmergeDialog(prev => ({ ...prev, isOpen }))}
                    onDelete={confirmUnmergeIdea}
                    isDeleteLoading={isUnmerging}
                    title={`Are you sure you want to unmerge ${unmergeDialog.ideaTitle}?`}
                    description="All of the upvoters and comments will be moved back to the original feedback."
                    deleteText="Unmerge Feedback"
                    redBtn="bg-red-500 hover:bg-red-600"
                />

                <ProPlanModal setIsProModal={onProModal} />

                <DeleteDialog
                    isOpen={deleteIdeaDialog.isOpen}
                    onOpenChange={(isOpen) => setDeleteIdeaDialog(prev => ({ ...prev, isOpen }))}
                    onDelete={deleteIdea}
                    isDeleteLoading={isDeletingIdea}
                    deleteRecord={deleteIdeaDialog.ideaId}
                    title="Delete Feedback"
                    description="Are you sure you want to delete this feedback?"
                    deleteText={isDeletingIdea ? "Deleting..." : "Delete"}
                />
                <DeleteDialog
                    isOpen={deleteVoteDialog.isOpen}
                    onOpenChange={(isOpen) => setDeleteVoteDialog(prev => ({ ...prev, isOpen }))}
                    onDelete={() => onDeleteUserConfirm(deleteVoteDialog.userId, deleteVoteDialog.index)}
                    isDeleteLoading={isLoading}
                    deleteRecord={deleteVoteDialog.userId}
                    title="Remove Vote"
                    description="Are you sure you want to remove this user's vote from the feedback?"
                    deleteText={isLoading ? "Deleting..." : "Delete"}
                />
                <DeleteDialog
                    isOpen={deleteDialog.isOpen}
                    onOpenChange={(isOpen) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
                    onDelete={() => onHubSpotRemoveTicket(deleteDialog.ticketId, deleteDialog.index)}
                    isDeleteLoading={lEHPTRemoveIndex === deleteDialog.ticketId}
                    deleteRecord={deleteDialog.ticketId}
                    title="Delete HubSpot Ticket"
                    description="Are you sure you want to remove this HubSpot ticket?"
                    deleteText={lEHPTRemoveIndex === deleteDialog.ticketId ? "Deleting..." : "Delete"}
                />
                <DeleteDialog
                    isOpen={githubDeleteDialog.isOpen}
                    onOpenChange={(isOpen) => setGithubDeleteDialog(prev => ({ ...prev, isOpen }))}
                    onDelete={() => deleteIssue(githubDeleteDialog.url, githubDeleteDialog.index)}
                    isDeleteLoading={linkIssueIndex === githubDeleteDialog.index}
                    deleteRecord={githubDeleteDialog.url}
                    title="Delete GitHub Issue Link"
                    description="Are you sure you want to remove this GitHub issue link?"
                    deleteText={linkIssueIndex === githubDeleteDialog.index ? "Deleting..." : "Delete"}
                />
                <DeleteDialog
                    isOpen={jiraDeleteDialog.isOpen}
                    onOpenChange={(isOpen) => setJiraDeleteDialog(prev => ({ ...prev, isOpen }))}
                    onDelete={onDeleteJiraIssue}
                    isDeleteLoading={isJiraDeleteLoading}
                    deleteRecord={jiraDeleteDialog.issueUrl}
                    title="Delete Jira Issue"
                    description="Are you sure you want to delete this Jira issue?"
                    deleteText={isJiraDeleteLoading ? "Deleting..." : "Delete"}
                />
                {
                    isOpenGHRepo &&
                    <GtiHubCreateIssue
                        {...{
                            open: isOpenGHRepo,
                            gitHubAllRepo,
                            gitHubRepoData,
                            setGitHubRepoData,
                            onCloseModal,
                            onCreateIssue,
                            isGHRepoCreate,
                        }}
                    />
                }
                {
                    isOpenHPCT &&
                    <CreateHubspotTicket {...{
                        open: isOpenHPCT,
                        onCloseModalCHT,
                        hpCTData,
                        setHPCTData,
                        onCreateHPTicket,
                        isHPCTCreate,
                        userPlan,
                        onShowProModal: handleShowProModal,
                    }} />
                }
                {
                    isOpenLEHPT &&
                    <LinkExistingHubspotTicket {...{
                        open: isOpenLEHPT,
                        onCloseModalLEHPT,
                        onCreateLEHPT,
                        lEHPTIndex,
                        hubSpotTickets,
                        setHubSpotTickets,
                        userPlan,
                        onShowProModal: handleShowProModal,
                    }} />
                }
                {
                    isOpenJiraTicket &&
                    <CreateJiraTicket {...{
                        open: isOpenJiraTicket,
                        onCloseModal: onCloseJiraTicketModal,
                        jiraTicketData,
                        setJiraTicketData,
                        onCreateJiraTicket,
                        isJiraTicketCreate,
                    }} />
                }
                {
                    isOpenLinkJiraTicket &&
                    <LinkExistingJiraTicket {...{
                        open: isOpenLinkJiraTicket,
                        onCloseModal: onCloseLinkJiraTicketModal,
                        onLinkJiraTicket,
                        linkJiraIndex,
                        ideaId: id,
                    }} />
                }

                {addUserDialog.addUser && (
                    <Dialog
                        open={addUserDialog.addUser}
                        onOpenChange={(value) => openDialogs("addUser", value)}
                    >
                        <DialogContent className={"max-w-[576px]"}>
                            <DialogHeader className={"flex-row gap-2 justify-between space-y-0 items-center"}>
                                <DialogTitle>Add new user</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="font-medium">Email</Label>
                                    <Input
                                        id="name"
                                        value={usersDetails.email}
                                        name="email"
                                        onChange={onChangeText}
                                        placeholder="john@example.com"
                                        className="col-span-3"
                                    />
                                    {userDetailError.email && (<span className="text-red-500 text-sm">{userDetailError.email}</span>)}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="userName" className="font-medium">Name</Label>
                                    <Input
                                        id="userName"
                                        value={usersDetails.name}
                                        name="name"
                                        onChange={onChangeText}
                                        placeholder="Enter upvoter name"
                                        className="col-span-3"
                                    />
                                    {userDetailError.name && (<span className="text-red-500 text-sm">{userDetailError.name}</span>)}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button className={"font-medium w-[83px]"} onClick={addUser}>
                                    {isLoading ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("Add User")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
                {addUserDialog.viewUpvote && (
                    <Dialog
                        open={addUserDialog.viewUpvote}
                        onOpenChange={(value) => openDialogs("viewUpvote", value)}
                    >
                        <DialogContent className={"max-w-[1022px] p-0 gap-0"}>
                            <DialogHeader className={"flex-row justify-between gap-2 p-3 lg:p-6 space-y-0"}>
                                <div className={"flex flex-col gap-2"}>
                                    <DialogTitle className={"font-medium"}>View & add upvoters</DialogTitle>
                                    <DialogDescription>
                                        Upvoters will receive notifications by email when you make changes to the post.
                                    </DialogDescription>
                                </div>
                            </DialogHeader>
                            <div className={"overflow-y-auto h-full flex-1"}>
                                <Table>
                                    <TableHeader className={`bg-muted`}>
                                        <TableRow>
                                            {["Name", "Email", "Action"].map((x, i) => {
                                                const icons = [<User className="w-4 h-4" />, <Mail className="w-4 h-4" />,];
                                                return (
                                                    <TableHead
                                                        className={`font-medium text-card-foreground px-2 py-[10px] md:px-3 ${i > 0 ? "max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap" : ""
                                                            }`}
                                                        key={i}
                                                    >
                                                        <div className={`flex gap-2 items-center ${i === 2 ? "justify-center" : ""}`}>
                                                            {icons[i]}{x}
                                                        </div>
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className={"overflow-y-auto"}>
                                        {isLoadingIdeaVoteList ? (
                                            [...Array(10)].map((_, index) => {
                                                return (
                                                    <TableRow key={index}>
                                                        {[...Array(3)].map((_, i) => {
                                                            return (
                                                                <TableCell key={i} className={"px-2 py-[10px] md:px-3"}>
                                                                    <Skeleton className={"rounded-md w-full h-7"} />
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                );
                                            })
                                        ) : ideasVoteList?.length > 0 ? (
                                            <>
                                                {(ideasVoteList || []).map((x, index) => {
                                                    return (
                                                        <TableRow key={index} className={"font-normal"}>
                                                            <TableCell className={`px-2 py-[10px] md:px-3 max-w-[140px] cursor-pointer truncate text-ellipsis overflow-hidden whitespace-nowrap`}>
                                                                {x.name ? x.name : "-"}
                                                            </TableCell>
                                                            <TableCell className={`px-2 py-[10px] md:px-3 max-w-[140px] cursor-pointer truncate text-ellipsis overflow-hidden whitespace-nowrap`}>
                                                                {x?.email ? x?.email : "-"}
                                                            </TableCell>
                                                            <TableCell className={`px-2 py-[10px] md:px-3 text-center`}>
                                                                <Button disabled={isLoading}
                                                                    onClick={() => onDeleteUser(x.id, index)}
                                                                    variant={"outline hover:bg-transparent"}
                                                                    className={`p-1 border w-[30px] h-[30px]`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={6}><EmptyData /></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                {ideasVoteList?.length > 0 ? (
                                    <Pagination
                                        pageNo={pageNo}
                                        totalPages={totalPages}
                                        isLoading={isLoading}
                                        handlePaginationClick={handlePaginationClick}
                                        stateLength={ideasVoteList?.length}
                                    />
                                ) : ("")}
                            </div>
                            <DialogFooter className={"p-3 lg:p-6 gap-3 border-t"}>
                                <Button
                                    variant={"outline hover:none"}
                                    className={"font-medium border bg-muted-foreground/5"}
                                    onClick={() => {
                                        const recipients = selectedIdea?.voteLists?.map((x) => x.email).join(",");
                                        window.location.href = `mailto:${recipients}`;
                                    }}
                                >
                                    <Mail size={18} className={"mr-2"} strokeWidth={2} />Email all upvoters
                                </Button>
                                <Popover onOpenChange={handlePopoverOpenChange}>
                                    <PopoverTrigger asChild>
                                        <Button role="combobox" className={"font-medium"}>
                                            <CirclePlus size={18} className={"mr-2"} strokeWidth={2} />{" "}
                                            Add new upvoter
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search users..."
                                                name={"search"}
                                                value={filter?.search}
                                                onValueChange={handleSearchChange}
                                            />
                                            <CommandList
                                                ref={listRef}
                                                onWheel={handleWheelScroll(listRef)}
                                                onTouchMove={handleTouchScroll}
                                                onScroll={handleScroll}
                                            >
                                                <CommandEmpty>No User found.</CommandEmpty>
                                                <CommandGroup className={"p-0"}>
                                                    {getAllUsersList?.customers?.length > 0 &&
                                                        (getAllUsersList?.customers?.filter((user) => !ideasVoteList?.some((upvoter) => upvoter.email === user.email)) || []).map((x, i) => {
                                                            return (
                                                                <Fragment key={i}>
                                                                    <CommandItem value={`${x.name} ${x.email}`}>
                                                                        <span
                                                                            className={"flex justify-between items-center w-full text-sm font-medium cursor-pointer"}
                                                                            onClick={() => handleUserClick(x)}
                                                                        >
                                                                            {x.name}
                                                                        </span>
                                                                    </CommandItem>
                                                                </Fragment>
                                                            );
                                                        })}
                                                </CommandGroup>
                                                {isLoadingUsers && (
                                                    <div className="p-2 flex justify-center items-center">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    </div>
                                                )}
                                                <div className={"border-t"}>
                                                    <Button variant="ghost" className={"w-full font-medium"}
                                                        onClick={() => openDialogs("addUser", true)}
                                                    >
                                                        <CirclePlus size={16} className={"mr-2"} />Add a brand new user
                                                    </Button>
                                                </div>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </Fragment>
            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                {/*<div className={"px-4 py-3 lg:p-5 border-b flex justify-between gap-2 items-center"}>*/}
                <div className={"flex justify-between items-center flex-wrap gap-2"}>
                    <CommonBreadCrumb links={links} currentPage={selectedIdea?.title} truncateLimit={30} />
                    <div className={"flex items-center gap-2"}>
                        {
                            isEditIdea &&
                            <SaveCancelButton className={"p-0 justify-end"} classBtnSave={"h-[30px]"}
                                classBtnCancel={"h-[30px]"}
                                onClickSave={() => onCreateIdea("createdByTop")}
                                load={isLoadingCreateIdea === "createdByTop"}
                                onClickCancel={handleOnCreateCancel} />
                        }
                    </div>
                </div>
                <Card className={"mt-4"}>
                    {/*<div className={`flex lg:flex-nowrap flex-wrap lg:h-[calc(100%_-_79px)] overflow-y-auto`}>*/}
                    <div className={`flex lg:flex-nowrap flex-wrap`}>
                        <div className={`lg:max-w-[407px] w-full h-full border-r-none md:border-r overflow-y-auto`}>
                            {isLoading ? (
                                [...Array(22)].map((_, index) => {
                                    return (
                                        <Fragment key={index}>
                                            {[...Array(1)].map((_, i) => {
                                                return (
                                                    <div key={i} className={"w-full px-2 py-[8px] md:px-3"}>
                                                        <Skeleton className={"rounded-md w-full h-5"} />
                                                    </div>
                                                );
                                            })}
                                        </Fragment>
                                    );
                                })
                            ) : (
                                // <div className={"lg:h-[calc(100vh_-_156px)] md:overflow-y-hidden md:hover:overflow-y-auto"}>
                                <div className="lg:h-[calc(100vh_-_156px)] overflow-y-auto">
                                    <div className="py-3 px-4 md:py-5 md:px-6 w-full space-y-1.5 border-b">
                                        <Label htmlFor="picture" className={"font-medium capitalize"}>Featured image</Label>
                                        <div className="flex gap-1">
                                            <ImageUploader
                                                imageWidth={"w-full"}
                                                className={"w-full"}
                                                image={selectedIdea?.coverImage}
                                                onDelete={() =>
                                                    onChangeStatus(
                                                        "removeCoverImage",
                                                        selectedIdea &&
                                                            selectedIdea?.coverImage &&
                                                            selectedIdea.coverImage?.name ? "" : [selectedIdea.coverImage]
                                                    )
                                                }
                                                onUpload={handleFeatureImgUpload}
                                                altText="Cover Image"
                                            />
                                        </div>
                                        {formError.coverImage && (<span className="text-red-500 text-sm">{formError.coverImage}</span>)}
                                    </div>

                                    <div className="py-3 px-4 md:py-5 md:px-6 w-full space-y-4 border-b">
                                        <div className={"flex gap-4 items-center"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Upvoters</Label>
                                            <div className={"flex gap-2 items-center justify-normal lg:justify-between w-full"}>
                                                <div className={"flex gap-1 items-center"}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button className={"w-[30px] h-[30px] border"} variant={"plain"} onClick={() => giveVote(1)}>
                                                                <span className={`inline-block w-5 h-5`}
                                                                    style={{
                                                                        fill: selectedIdea?.userVote ? "#7c3aed" : "#6b7280",
                                                                        color: selectedIdea?.userVote ? "#7c3aed" : "#6b7280",
                                                                    }}
                                                                >{Icon.caretUp}</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className={"font-normal text-sm"}>
                                                            Vote
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <p className={"text-sm font-normal"}>{selectedIdea?.vote}</p>
                                                </div>
                                                {selectedIdea && selectedIdea?.voteLists && selectedIdea?.voteLists.length ? (
                                                    <Button variant={"link"}
                                                        className={"h-auto p-0 text-card-foreground font-normal text-sm text-wrap"}
                                                        onClick={() => openDialogs("viewUpvote", true)}
                                                    >
                                                        View upvoters
                                                    </Button>
                                                ) : ("")}
                                            </div>
                                        </div>
                                        <div className={"flex gap-4 items-center"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Status</Label>
                                            <Select
                                                onValueChange={(value) => onChangeStatus("roadmapStatusId", value)}
                                                value={selectedIdea?.roadmapStatusId}
                                            >
                                                <SelectTrigger className="w-full min-w-[80px] max-w-[224px] h-[28px] px-3 py-1">
                                                    <SelectValue className="truncate" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value={null}>
                                                            <div className={"flex items-center gap-2"}>Unassigned</div>
                                                        </SelectItem>
                                                        {(roadmapStatus || []).map((x, i) => {
                                                            return (
                                                                <SelectItem key={i} value={x.id}>
                                                                    <div className="flex items-center gap-2 w-full max-w-[100px] truncate whitespace-nowrap">
                                                                        <span>
                                                                            <Circle
                                                                                fill={x.colorCode}
                                                                                stroke={x.colorCode}
                                                                                className={` w-[10px] h-[10px]`}
                                                                            />
                                                                        </span>
                                                                        {x.title ? x.title : "Unassigned"}
                                                                    </div>
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className={"flex gap-4"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Tags</Label>
                                            <div className="flex gap-1 flex-wrap">
                                                {selectedIdea?.topic?.length > 0 ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant={"ghost hover:none"} className={"p-0 h-[24px]"}>
                                                                <div className={"flex justify-between items-center gap-0.5"}>
                                                                    <div className={"text-sm text-center"}>
                                                                        <div className={`text-xs bg-[#FBFBFF] border-gray-[#dee1ea80] border truncate py-1 px-2 font-medium text-[#5b678f] rounded-md`}>
                                                                            {selectedIdea?.topic[0]?.title}
                                                                        </div>
                                                                    </div>
                                                                    {selectedIdea?.topic?.length > 1 && (
                                                                        <div className={"update-idea text-sm rounded-full border text-center"}>
                                                                            <Avatar>
                                                                                <AvatarFallback>+{selectedIdea?.topic?.length - 1}</AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="p-0" align={"start"}>
                                                            <div>
                                                                <div className={"py-3 px-4"}>
                                                                    <h4 className="font-normal leading-none text-sm">{`Topics (${selectedIdea?.topic?.length})`}</h4>
                                                                </div>
                                                                <div className="border-t px-4 py-3 space-y-2 max-h-[200px] overflow-y-auto">
                                                                    {selectedIdea?.topic && selectedIdea?.topic.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            {selectedIdea?.topic.map((y, i) => (
                                                                                <div className="text-sm font-normal" key={i}>{y?.title}</div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (<span className="text-sm text-muted-foreground">No tags</span>)}
                                            </div>
                                        </div>
                                        <div className={"flex gap-4 items-center"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Convert to Feedback</Label>
                                            <div className={"w-full"}>
                                                <Button
                                                    variant={"link"}
                                                    className={"h-auto p-0 text-card-foreground font-normal text-sm"}
                                                    onClick={() =>
                                                        onChangeStatus(
                                                            "isActive",
                                                            selectedIdea?.isActive === false
                                                        )
                                                    }
                                                >
                                                    {/*{isLoadingBug ? (<Loader2 className="h-4 w-4 animate-spin"/>) : selectedIdea?.isActive === false ? ("Convert to Feedback") : ("Mark as bug")}*/}
                                                    {selectedIdea?.isActive === false ? ("Convert to Feedback") : ("Confirm as Bug")}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className={"flex gap-4 items-center"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Archive</Label>
                                            <div className={"w-full"}>
                                                <Button
                                                    variant={"link"}
                                                    className={"h-auto p-0 text-card-foreground font-normal text-sm"}
                                                    onClick={() =>
                                                        onChangeStatus(
                                                            "isArchive",
                                                            selectedIdea?.isArchive !== true
                                                        )
                                                    }
                                                >
                                                    {/*{isLoadingBug ? (<Loader2 className="h-4 w-4 animate-spin"/>) : selectedIdea?.isArchive ? ("Unarchive") : ("Archive")}*/}
                                                    {selectedIdea?.isArchive ? ("Unarchive") : ("Archive")}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className={"flex gap-4 items-center"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Author</Label>
                                            <div className={"flex items-center gap-4 md:flex-nowrap flex-wrap w-full"}>
                                                <div className={"flex items-center gap-2"}>

                                                    {
                                                        (selectedIdea?.name ? selectedIdea?.name : selectedIdea?.userName) ?
                                                            <div className={"flex items-center"}>
                                                                <Fragment>
                                                                    <Button variant={"link"}
                                                                        className={"h-auto p-0 text-card-foreground font-normal text-sm"}
                                                                        onClick={onRedirectToUser}
                                                                    >
                                                                        {(selectedIdea?.name ? selectedIdea?.name : selectedIdea?.userName) || "Unknown"}
                                                                    </Button>
                                                                </Fragment>
                                                            </div> : <span className="font-normal text-sm">Unknown</span>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <div className={"flex gap-4 items-center"}>
                                            <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Date</Label>
                                            <span className={"text-sm font-normal"}>{dayjs(selectedIdea?.createdAt).format("MMM DD, YYYY")}</span>
                                        </div>
                                    </div>


                                    {/* {
                                        integrationIncludes.length > 0 &&
                                        <div className={"pt-3 px-4 md:pt-4 md:px-6 "}>
                                            <h4 className={"text-md font-medium "}>
                                                Integrations
                                            </h4>
                                        </div>} */}
                                        <div className={"pt-3 px-4 md:pt-4 md:px-6 "}>
                                            {integrationIncludes.length > 0 ? (
                                                <h4 className={"text-md font-medium "}>
                                                Integrations
                                                </h4>
                                            ) : (
                                                <h4 className={"text-md font-medium "}>
                                                Connect Integrations
                                                </h4>
                                            )}
                                        </div>

                                        {
                                            integrationIncludes.length === 0 && (
                                                <div className={"p-4 px-4 md:px-6 border-b lg:border-b-none"}>
                                                <div className={"space-y-4"}>
                                                    <div>
                                                    <h2 className={"font-medium text-[14px]"}>Do you gather feedback elsewhere?</h2>
                                                    <p className={"text-[13px]"}>Connect with your current tools to capture feedback.</p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4">
                                                    {integrationsImg.map((x, i) => (
                                                        <div key={i} className="rounded-xl border w-10 h-10 flex justify-center items-center cursor-pointer" onClick={() => navigate(`${baseUrl}/integrations`)}>
                                                        <img className={x.imgClass} src={x.img} alt="Integration logo" />
                                                        </div>
                                                    ))}
                                                    </div>
                                                </div>
                                                </div>
                                            )
                                        }

                                    {
                                        (integrationIncludes?.includes(4)) &&
                                        <div className={"py-3 px-4 md:py-4 md:px-6 border-b lg:border-b-none"}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className={"text-sm font-medium flex gap-2"}>
                                                    <img className={`max-w-5`} src={HubSpotImg} /> Hubspot Tickets{" "}
                                                    {projectDetailsReducer?.plan < 2 ? (<PlanBadge title={"Growth"} />) : ""}
                                                </h4>
                                                {
                                                    integrationIncludes?.includes(4) ?
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger className={'p-1 pr-0 h-8 hover:bg-secondary/50 rounded-md focus-visible:ring-0 focus-visible:outline-none'}>
                                                                <EllipsisVertical size={18} />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align={"end"}>
                                                                <DropdownMenuItem className={"cursor-pointer flex gap-2"} onClick={() => {
                                                                    if (userPlan < 2) { handleShowProModal(); return; }
                                                                    setIsOpenHPCT(true);
                                                                }}>
                                                                    <CirclePlus size={15} /> Create new ticket
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className={"cursor-pointer flex gap-2"} onClick={() => {
                                                                    if (userPlan < 2) { handleShowProModal(); return; }
                                                                    setIsOpenLEHPT(true);
                                                                }}>
                                                                    <Link size={15} /> Link to existing ticket
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu> : null
                                                }
                                            </div>

                                            {
                                                (showAllHubSpotTickets ? hubSpotTicketsShow : (hubSpotTicketsShow || []).slice(0, 5)).map((x, i) => {
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="mb-2 last:mb-0 border-b last:border-b-0 pb-2 last:pb-0"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <Button
                                                                    className="min-w-0 h-auto px-0 text-gray-800 whitespace-pre-wrap truncate"
                                                                    disabled={projectDetailsReducer?.plan < 2}
                                                                    variant="link"
                                                                    onClick={() => window.open(x.hubspotUrl, "_blank")}
                                                                >
                                                                    {x.subject}
                                                                </Button>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="secondary"
                                                                            className="h-6 w-6 flex-shrink-0"
                                                                            disabled={projectDetailsReducer?.plan < 2}
                                                                            onClick={() => openDeleteDialog(x.hs_object_id, i)}
                                                                        >
                                                                            {lEHPTRemoveIndex === i ? (
                                                                                <Loader2 className="text-destructive animate-spin" size={16} />
                                                                            ) : (
                                                                                <Trash2 className="text-destructive" size={16} />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="font-normal text-sm">Delete</TooltipContent>
                                                                </Tooltip>
                                                            </div>

                                                            <div className="flex">
                                                                <Badge variant="secondary" className="mt-2">
                                                                    {x.hs_pipeline_stage_label}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                    )
                                                })
                                            }

                                            {hubSpotTicketsShow.length > 5 && (
                                                <div className="text-center mt-3">
                                                    {!showAllHubSpotTickets ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                                                            onClick={() => setShowAllHubSpotTickets(true)}
                                                        >
                                                            <ChevronDown size={14} className="mr-1" />
                                                            View All ({hubSpotTicketsShow.length})
                                                        </Button>

                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-4 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                                                            onClick={() => setShowAllHubSpotTickets(false)}
                                                        >
                                                            <ChevronUp size={14} className="mr-1" />
                                                            View Less
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    }

                                    {integrationIncludes?.includes(2) && (
                                        <div className={"py-3 px-4 md:py-4 md:px-6 border-b lg:border-b-none"}>
                                            <div className={"flex justify-between items-center"}>
                                                <h4 className={"text-sm font-medium flex gap-2"}>
                                                    <img className={`max-w-5`} src={gitHubIntImg} /> GitHub Issues{" "}
                                                    {projectDetailsReducer?.plan < 2 ? (<PlanBadge title={"Growth"} />) : ""}
                                                </h4>
                                                <Button variant={"link"} className={"max-w-max h-auto px-0"}
                                                    disabled={projectDetailsReducer?.plan < 2}
                                                    onClick={onToggleLinkIssue}
                                                >
                                                    Link issue
                                                </Button>
                                            </div>

                                            {isLinkedIssue && (
                                                <div className="relative">
                                                    <div className={"relative mt-4"}>
                                                        <Input value={searchIssue} autoFocus
                                                            placeholder={"Search for an issue"} className={"pr-8"}
                                                            disabled={projectDetailsReducer?.plan < 2}
                                                            onChange={(e) => onChangeSearchIssue(e.target.value)}
                                                        />
                                                        {isSearchIssueLoading && (
                                                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Popover open={open} onOpenChange={setOpen}>
                                                        <PopoverTrigger asChild>
                                                            <span className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 absolute top-0 z-[-1]" />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="p-1 w-full sm:min-w-[353px] min-w-[200px]">
                                                            <Command>
                                                                <CommandList>
                                                                    <CommandEmpty>No issue found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {(gitHubLinkedIssue || []).map((x, i) => {
                                                                            const isAlreadyLinked = gitHubRepoData?.githubIssueDetails?.some((issue) => issue.url === x.url);
                                                                            return (
                                                                                <Fragment key={i}>
                                                                                    <CommandItem className={`cursor-pointer justify-between gap-0.5 p-0`} value={x.url}>
                                                                                        <span
                                                                                            title={x.title}
                                                                                            onClick={() =>
                                                                                                isAlreadyLinked ?
                                                                                                    toast({
                                                                                                        variant: "destructive", description: 'Already issue linked'
                                                                                                    }) : onSelectIssueUrl(x.url)
                                                                                            }
                                                                                            className={`w-full text-sm font-medium  max-w-[320px] truncate text-ellipsis overflow-hidden whitespace-nowrap px-2 py-1.5`}
                                                                                        >
                                                                                            {x.title}
                                                                                        </span>
                                                                                    </CommandItem>
                                                                                </Fragment>
                                                                            );
                                                                        })}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            )}

                                            {(gitHubRepoData?.githubIssueDetails || [])?.map((x, i) => {
                                                return (
                                                    <div key={i}
                                                        className={`flex gap-2 justify-between mb-1.5 last:mb-0 ${i === 0 ? "mt-4" : ""}`}
                                                    >
                                                        <Button variant={"link"}
                                                            className={`max-w-[320px] h-auto px-0 block text-gray-800 text-left whitespace-pre-wrap`}
                                                            disabled={projectDetailsReducer?.plan < 2}
                                                            onClick={() => window.open(x.url, "_blank")}
                                                        >
                                                            #{x.number}: {x.title}
                                                        </Button>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size={"icon"}
                                                                    className={"bg-white hover:bg-secondary/80 h-6 w-6"}
                                                                    disabled={projectDetailsReducer?.plan < 2}
                                                                    onClick={() => openGithubDeleteDialog(x.url, i)}
                                                                >
                                                                    {linkIssueIndex === i ? (
                                                                        <Loader2 className={"text-destructive animate-spin"} size={16} />
                                                                    ) : (<Trash2 className={"text-destructive"} size={16} />)}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className={"font-normal text-sm"}>Delete issue</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                );
                                            })}

                                            <div className={"mt-4 flex flex-col gap-3"}>
                                                <Button variant={"secondary"} className={"max-w-max"}
                                                    disabled={projectDetailsReducer?.plan < 2}
                                                    onClick={() => setIsOpenGHRepo(true)}
                                                >
                                                    Create new issue
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    {integrationIncludes?.includes(5) && (
                                        <div className={"py-3 px-4 md:py-4 md:px-6 border-b lg:border-b-none"}>
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className={"text-sm font-medium flex gap-2"}>
                                                    <img className={`max-w-5`} src={JiraImg} /> Jira Issues{" "}
                                                    {projectDetailsReducer?.plan < 2 ? (<PlanBadge title={"Growth"} />) : ""}
                                                </h4>
                                                {
                                                    integrationIncludes?.includes(5) ?
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger className={'p-1 pr-0 h-8 hover:bg-secondary/50 rounded-md focus-visible:ring-0 focus-visible:outline-none'}>
                                                                <EllipsisVertical size={18} />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align={"end"}>
                                                                <DropdownMenuItem className={"cursor-pointer flex gap-2"} onClick={() => {
                                                                    if (userPlan < 2) { handleShowProModal(); return; }
                                                                    setIsOpenJiraTicket(true);
                                                                }}>
                                                                    <CirclePlus size={15} /> Create new issues
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className={"cursor-pointer flex gap-2"} onClick={() => {
                                                                    if (userPlan < 2) { handleShowProModal(); return; }
                                                                    setIsOpenLinkJiraTicket(true);
                                                                }}>
                                                                    <Link size={15} /> Link to existing issues
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu> : null
                                                }
                                            </div>

                                            {jiraIssuesShow && jiraIssuesShow.length > 0 ? (
                                                <div className="mt-4">

                                                    <div className="space-y-2">
                                                        {(showAllJiraIssues ? jiraIssuesShow : jiraIssuesShow.slice(0, 5)).map((x, i) => {
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="mb-2 last:mb-0 border-b last:border-b-0 pb-2 last:pb-0"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <Button
                                                                            className="min-w-0 h-auto px-0 text-gray-800 truncate"
                                                                            disabled={projectDetailsReducer?.plan < 2}
                                                                            variant="link"
                                                                            onClick={() => window.open(x.url, "_blank")}
                                                                        >
                                                                            {x.title}
                                                                        </Button>

                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="secondary"
                                                                                    className="h-6 w-6 flex-shrink-0"
                                                                                    disabled={projectDetailsReducer?.plan < 2}
                                                                                    onClick={() => openJiraDeleteDialog(x.url || x.jiraUrl || x.issueUrl, i)}
                                                                                >
                                                                                    <Trash2 className="text-destructive" size={16} />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="font-normal text-sm">Delete</TooltipContent>
                                                                        </Tooltip>
                                                                    </div>

                                                                    <div className="flex">
                                                                        <Badge variant="secondary" className="mt-2">
                                                                            {x.issueType || x.issuetype || 'Issue'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {jiraIssuesShow.length > 5 && (
                                                        <div className="text-center mt-3">
                                                            {!showAllJiraIssues ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                                                                    onClick={() => setShowAllJiraIssues(true)}
                                                                >
                                                                    <ChevronDown size={14} className="mr-1" />
                                                                    View All ({jiraIssuesShow.length})
                                                                </Button>

                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 px-4 text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                                                                    onClick={() => setShowAllJiraIssues(false)}
                                                                >
                                                                    <ChevronUp size={14} className="mr-1" />
                                                                    View Less
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-500">
                                                    <div className="text-sm">No Jira issues linked yet</div>
                                                    <div className="text-xs mt-1">
                                                        Use the menu above to create or link issues
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}


                        </div>
                        <div className={"update-idea-right-side w-full lg:h-[calc(100vh_-_156px)] overflow-y-auto"} ref={scrollContainerRef}>
                            {isEditIdea ? (
                                <Fragment>
                                    <div className={"p-4 md:p-6 flex flex-col gap-4 ld:gap-6 border-b "}>
                                        <div className="space-y-2">
                                            <Label htmlFor="text" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                                            <Input type="text" id="text" placeholder="" value={selectedIdea?.title} name={"title"} onChange={onChangeText} />
                                            {formError.title && (<span className="text-red-500 text-sm">{formError.title}</span>)}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className={"font-medium"}>Description</Label>
                                            <ReactQuillEditor
                                                value={restoreImagePaths(selectedIdea?.description, selectedIdea?.descriptionImages)}
                                                name={"description"}
                                                onChange={onChangeText}
                                                setImageSizeError={setImageSizeError}
                                                descriptionImages={selectedIdea?.descriptionImages}
                                                setImages={setImages}
                                                title={selectedIdea?.title}
                                                uploadFolder={"feature-idea"}
                                                moduleName={"idea"}
                                                setImagesToDelete={setImagesToDelete}
                                                scrollContainerRef={scrollContainerRef}
                                                preventAutoScroll={true}
                                            />
                                            {(formError.imageSizeError || imageSizeError) && (
                                                <span className="text-red-500 text-sm">{formError.imageSizeError || imageSizeError}</span>
                                            )}
                                        </div>
                                        <div className={"space-y-2"}>
                                            <div className={`flex gap-2 justify-between items-center`}>
                                                <Label className={"font-medium"}>Choose Board for this Feedback</Label>
                                                <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/board`)}>Manage Boards</Button>
                                            </div>
                                            <Popover open={openBoardPopover} onOpenChange={setOpenBoardPopover} className="w-full p-0">
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox"
                                                        className="w-full justify-between bg-card focus-visible:ring-0 focus-visible:ring-transparent"
                                                    >
                                                        <span className="text-left w-11/12 block truncate">
                                                            {selectedIdea.boardId ? (
                                                                filteredBoards.find(board => board.id === selectedIdea.boardId)?.title
                                                            ) : ("Select board")}
                                                        </span>
                                                        {Icon.popoverChevronsUpDown}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command className="w-full">
                                                        <CommandInput placeholder="Search boards..." className="h-8" />
                                                        <CommandList>
                                                            <CommandEmpty>No boards found.</CommandEmpty>
                                                            <CommandGroup className={'max-h-[200px] overflow-y-auto smooth-scroll'} ref={boardListRef} onWheel={handleWheelScroll(boardListRef)} onTouchMove={handleTouchScroll}>
                                                                {filteredBoards.length > 0 ? (
                                                                    filteredBoards.map((board) => (
                                                                        <Fragment key={board.id}>
                                                                            <CommandItem value={board.id}
                                                                                className="p-0 flex gap-1 items-center cursor-pointer"
                                                                                onSelect={(e) => e.preventDefault()}
                                                                            >
                                                                                <RadioGroup>
                                                                                    <RadioGroupItem className="m-2"
                                                                                        checked={selectedIdea.boardId === board.id}
                                                                                        onClick={() => {
                                                                                            onChangeText({
                                                                                                target: { name: "boardId", value: board.id, },
                                                                                            });
                                                                                            setOpenBoardPopover(false);
                                                                                        }}
                                                                                    />
                                                                                </RadioGroup>
                                                                                <span
                                                                                    onClick={() => {
                                                                                        onChangeText({
                                                                                            target: { name: "boardId", value: board.id, },
                                                                                        });
                                                                                        setOpenBoardPopover(false);
                                                                                    }}
                                                                                    className="text-sm font-medium cursor-pointer w-full"
                                                                                >{board.title}</span>
                                                                            </CommandItem>
                                                                        </Fragment>
                                                                    ))
                                                                ) : (
                                                                    <CommandEmpty>No boards available</CommandEmpty>
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {formError.boardId && (<span className="text-red-500 text-sm">{formError.boardId}</span>)}
                                        </div>
                                    </div>
                                    <div className={"p-4 md:p-6 border-b space-y-2"}>
                                        <div className={`flex gap-2 justify-between items-center`}>
                                            <Label className={"font-medium"}>Choose tags for this Feedback (optional)</Label>
                                            <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/tags`)}>Manage Tags</Button>
                                        </div>
                                        <Popover open={openTopics} onOpenChange={setOpenTopics} className="w-full p-0">
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openTopics}
                                                    className="w-full justify-between bg-card focus-visible:ring-0 focus-visible:ring-transparent"
                                                >
                                                    <div className="flex gap-1 overflow-hidden">
                                                        {(selectedIdea.topic || []).length === 0 ? (
                                                            <span className="text-muted-foreground">Select topic</span>
                                                        ) : (
                                                            (selectedIdea.topic || []).map((x, index) => {
                                                                const findObj = (topicLists || []).find((y) => y.id === x?.id);
                                                                return (
                                                                    <div key={index} className={`text-xs flex gap-[2px] bg-slate-300 items-center rounded py-0 px-2`}>
                                                                        <span className="max-w-[85px] truncate">{findObj?.title}</span>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                    {Icon.popoverChevronsUpDown}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command className="w-full">
                                                    <CommandInput placeholder="Search topics..." className="h-8" />
                                                    <CommandList>
                                                        <CommandEmpty>No topics found.</CommandEmpty>
                                                        <CommandGroup className={'max-h-[200px] overflow-y-auto smooth-scroll'} ref={topicListRef} onWheel={handleWheelScroll(topicListRef)} onTouchMove={handleTouchScroll}>
                                                            {(topicLists || []).length > 0 ? (
                                                                (topicLists || []).map((topic) => (
                                                                    <Fragment key={topic.id}>
                                                                        <CommandItem
                                                                            onSelect={(e) => { e.preventDefault(); }}
                                                                            value={topic.id}
                                                                            className="p-0 flex gap-1 items-center cursor-pointer"
                                                                        >
                                                                            <Checkbox className="m-2"
                                                                                checked={(selectedIdea.topic || []).some(t => t.id === topic.id)}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleChangeTopic(topic.id);
                                                                                    setOpenTopics(true);
                                                                                }}
                                                                            />
                                                                            <span
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleChangeTopic(topic.id);
                                                                                    setOpenTopics(true);
                                                                                }}
                                                                                className="text-sm font-medium cursor-pointer w-full"
                                                                            >{topic.title}</span>
                                                                        </CommandItem>
                                                                    </Fragment>
                                                                ))
                                                            ) : (
                                                                <CommandEmpty>No topics available</CommandEmpty>
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <SaveCancelButton className={"p-4 md:p-6"} onClickSave={() => onCreateIdea("createdByBottom")} load={isLoadingCreateIdea === "createdByBottom"} onClickCancel={handleOnCreateCancel} />
                                </Fragment>
                            ) : (
                                <Fragment>
                                    {isLoading ? (
                                        [...Array(22)].map((_, index) => {
                                            return (
                                                <Fragment key={index}>
                                                    {[...Array(1)].map((_, i) => {
                                                        return (
                                                            <div key={i} className={"w-full px-2 py-[8px] md:px-3"}>
                                                                <Skeleton className={"rounded-md w-full h-5"} />
                                                            </div>
                                                        );
                                                    })}
                                                </Fragment>
                                            );
                                        })
                                    ) : (
                                        <Fragment>
                                            <div className={"px-4 py-3 lg:py-6 lg:px-8"}>
                                                <div className={"flex flex-col gap-2"}>
                                                    <div className={"flex justify-between items-start gap-4"}>
                                                        <div className={"flex gap-5 items-start"}>
                                                            <div className={"flex items-center gap-2"}>
                                                                <h2 className={"text-xl font-normal truncate text-wrap"}>{selectedIdea?.title}</h2>
                                                            </div>
                                                        </div>

                                                        <div className={"flex gap-2 items-center"}>
                                                            <div className={"hidden md:block"}>
                                                                <ActionButtons
                                                                    isEditable={selectedIdea?.createdBy == 1}
                                                                    onEdit={() => setIsEditIdea(true)}
                                                                    onPinChange={(newPinState) =>
                                                                        onChangeStatus("pinToTop", newPinState ? 1 : 0)
                                                                    }
                                                                    isPinned={selectedIdea?.pinToTop == 1}
                                                                />
                                                            </div>
                                                            <div className={"flex gap-4 items-center hidden md:block"}>
                                                                <Button
                                                                    className={'h-[25px] w-[25px]'}
                                                                    variant={"outline"}
                                                                    size={"icon"}
                                                                    onClick={() => setDeleteIdeaDialog({
                                                                        isOpen: true,
                                                                        ideaId: selectedIdea?.id
                                                                    })}
                                                                >
                                                                    <Trash2 size={13} className={"text-destructive"} />
                                                                </Button>
                                                            </div>

                                                            <div className={"md:hidden"}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger><Ellipsis size={16} /></DropdownMenuTrigger>
                                                                    <DropdownMenuContent align={"end"}>
                                                                        {selectedIdea?.createdBy == 1 &&
                                                                            <DropdownMenuItem className={"cursor-pointer"} onClick={() => setIsEditIdea(true)}>
                                                                                Edit
                                                                            </DropdownMenuItem>
                                                                        }
                                                                        <DropdownMenuItem className={"cursor-pointer"}
                                                                            onClick={() =>
                                                                                onChangeStatus("pinToTop", selectedIdea?.pinToTop === 0 ? 1 : 0)
                                                                            }
                                                                        >
                                                                            {selectedIdea?.pinToTop == 0 ? "Pinned" : "Unpinned"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem className={"cursor-pointer"}
                                                                            onClick={() => setDeleteIdeaDialog({
                                                                                isOpen: true,
                                                                                ideaId: selectedIdea?.id
                                                                            })}
                                                                        >
                                                                            Delete
                                                                        </DropdownMenuItem>

                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={"flex flex-col gap-6"}>
                                                        {isContentEmpty(selectedIdea?.description) || isEmpty(selectedIdea?.description) ? ("") : (
                                                            <div className={"flex flex-col gap-4"}>
                                                                <div className=" pt-3 description-container">
                                                                    <ReadMoreText alldata={selectedIdea} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <Fragment>
                                                            {selectedIdea && selectedIdea?.images && selectedIdea?.images?.length > 0 ? (
                                                                <div className={"flex gap-3 flex-wrap"}>
                                                                    <Fragment>
                                                                        {(selectedIdea?.images || []).map((x, i) => {
                                                                            return (
                                                                                <Fragment key={i}>
                                                                                    {x && (
                                                                                        <div
                                                                                            className="w-[50px] h-[50px] md:w-[100px] md:h-[100px] border p-[3px] relative"
                                                                                            // onClick={() => handleImageOpen(x.name ? URL.createObjectURL(x) : x)}
                                                                                            onClick={() => handleImagePreview(x)}
                                                                                        >
                                                                                            <img
                                                                                                className="upload-img cursor-pointer"
                                                                                                src={x.name ? URL.createObjectURL(x) : `${DO_SPACES_ENDPOINT}/${x}`}
                                                                                                alt=""
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </Fragment>
                                                                            );
                                                                        })}
                                                                    </Fragment>
                                                                </div>
                                                            ) : ("")}
                                                        </Fragment>


                                                        <div className={"flex flex-col gap-2"}>
                                                            <div className="w-full flex flex-col gap-2">
                                                                <Label htmlFor="message" className={"font-medium capitalize"}>Add comment</Label>
                                                                <Fragment>
                                                                    <Textarea placeholder="Start writing..." id="message" value={commentText} className={"h-[100px]"}
                                                                        onChange={(e) => setCommentText(e.target.value)}
                                                                        onKeyDown={(e) => onKeyFire(e, (isEmpty(commentText) || isSaveComment) ? null : () => onCreateComment())}
                                                                    />
                                                                    {commentFiles && commentFiles.length ? (
                                                                        <div className={"flex flex-wrap gap-3 mt-1"}>
                                                                            {(commentFiles || []).map((x, i) => {
                                                                                const allImageUrls = commentFiles.map(file =>
                                                                                    file.name ? URL.createObjectURL(file) : `${DO_SPACES_ENDPOINT}/${file}`
                                                                                );
                                                                                return (
                                                                                    <Fragment key={i}>
                                                                                        {x && (
                                                                                            <div className="border rounded relative w-full max-w-[50px] max-h-[50px] h-full">
                                                                                                <AspectRatio ratio={10 / 10} className="bg-muted">
                                                                                                    <img className="upload-img cursor-pointer"
                                                                                                        // onClick={() => handleImageOpen(x.name ? URL.createObjectURL(x) : x)}
                                                                                                        onClick={() => handleImagePreview(allImageUrls, i)}
                                                                                                        src={x.name ? URL.createObjectURL(x) : `${DO_SPACES_ENDPOINT}/${x}`}
                                                                                                        alt={x.name || x}
                                                                                                    />
                                                                                                    <CircleX size={20}
                                                                                                        className="stroke-gray-500 cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                                                                                        onClick={() => onDeleteImageComment(i, false)}
                                                                                                    />
                                                                                                </AspectRatio>
                                                                                            </div>
                                                                                        )}
                                                                                    </Fragment>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : ("")}
                                                                </Fragment>
                                                            </div>
                                                            {commentFiles.length >= 5 && (<span className="text-xs text-red-500 whitespace-nowrap">Max 5 images can be uploaded.</span>)}
                                                            <div className={""}>
                                                                <div className={"flex gap-2 items-center"}>
                                                                    <Button
                                                                        className={"w-[117px] text-sm font-medium"}
                                                                        onClick={onCreateComment}
                                                                        disabled={isEmpty(commentText) || isSaveComment}
                                                                    >
                                                                        {isSaveComment ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("Post Comment")}
                                                                    </Button>
                                                                    <div className="p-2 max-w-sm relative w-[36px] h-[36px]">
                                                                        <input id="commentFile" type="file" className="hidden"
                                                                            onChange={(e) => handleAddCommentImg(e, false)}
                                                                            accept={"image/*"} multiple={true}
                                                                            disabled={commentFiles.length >= 5 || isSaveComment}
                                                                        />
                                                                        <label htmlFor="commentFile"
                                                                            className={`absolute inset-0 flex items-center justify-center bg-white border rounded cursor-pointer ${(commentFiles.length >= 5 || isSaveComment)
                                                                                ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                                                                                : "border-primary"
                                                                                }`}
                                                                        >
                                                                            <Paperclip size={16} className={(commentFiles.length >= 5 || isSaveComment) ? "stroke-gray-400" : "stroke-primary"} stroke={(commentFiles.length >= 5 || isSaveComment) ? "stroke-gray-400" : "stroke-primary"} />
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={"tabs"}>
                                                <Tabs value={activeTab} onValueChange={(value) => {
                                                    if (value === "merge" && !(projectDetailsReducer.plan === 3 && projectDetailsReducer.stripeStatus === "active")) {
                                                        onProModal(true);
                                                        return;
                                                    }
                                                    setActiveTab(value);
                                                }}>
                                                    <div className={"px-4 lg:px-8 border-b"}>
                                                        <TabsList className={"bg-transparent rounded-none h-auto p-0 gap-0 justify-between w-full gap-2"}>
                                                           <div className="inline-flex items-center justify-center gap-2 flex-wrap">
                                                           <TabsTrigger className={"ideas-tab-comm-bgCol data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent rounded-none pb-3"} value="comment">
                                                                Comments
                                                            </TabsTrigger>
                                                            {
                                                                mergedIdeas && mergedIdeas.length > 0 ? (
                                                                    <TabsTrigger
                                                                        className={"ideas-tab-comm-bgCol data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent rounded-none pb-3"}
                                                                        value="merge"
                                                                    >
                                                                        Merge Feedbacks
                                                                    </TabsTrigger>
                                                                ) : ""
                                                            }

                                                           </div>
                                                            {
                                                                id !== "new" && ideaComment?.comments?.length > 0 && (
                                                                    <Fragment>
                                                                        <Button className="shadow-[0_0_50px_1px_#7c3aed70] gap-1.5 h-8"
                                                                            onClick={handleOpenGenerateSummary}>{Icon.AIWhiteIcon} Summarize with AI 
                                                                        </Button>
                                                                    </Fragment>
                                                                )
                                                            }
                                                        </TabsList>
                                                    </div>

                                                    {ideaComment?.comments?.length > 0 ? (
                                                        <TabsContent value="comment" className={``}>
                                                            <Fragment>
                                                                {ideaComment && ideaComment?.comments && ideaComment?.comments.length > 0
                                                                    ? (ideaComment?.comments || []).map((x, i) => {
                                                                        return (
                                                                            <Fragment key={i}>
                                                                                    <div className="p-2 lg:px-8">
                                                                                <div className={"flex gap-2 overflow-x-auto bg-[#f8fafc] p-[15px] rounded-[10px] border border-[#A3BCD5] border-opacity-10"}>
                                                                                    <div>
                                                                                        <div className={"update-idea text-sm rounded-full text-center"}>
                                                                                            <UserAvatar
                                                                                                userPhoto={x?.profileImage}
                                                                                                userName={x?.name && x.name !== "null" ? x.name : x?.userName}
                                                                                                initialStyle={"text-sm"}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className={"w-full flex flex-col space-y-2"}>
                                                                                        <div className={"flex gap-1 flex-wrap justify-between"}>
                                                                                            <div className={"flex flex-wrap items-start"}>
                                                                                                <h4 className={"text-sm font-normal"}>
                                                                                                    {x?.name && x.name !== "null" ? x.name : x?.userName}
                                                                                                </h4>
                                                                                                <p className={"text-sm font-normal flex items-center text-muted-foreground"}>
                                                                                                    <Dot size={20} className={"fill-text-card-foreground stroke-text-card-foreground"} />
                                                                                                    {dayjs.utc(x?.createdAt).local().startOf("seconds").fromNow()}
                                                                                                    {x.isEdited && (
                                                                                                        <span className={"text-sm font-normal text-muted-foreground ml-1"}>
                                                                                                            (edited)
                                                                                                        </span>
                                                                                                    )}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div className={"flex gap-2"}>

                                                                                                {(selectedCommentIndex === i && isEditComment) ? ("") : (
                                                                                                    <Fragment>
                                                                                                        <ActionButtons
                                                                                                            isEditable={true}
                                                                                                            onEdit={() => onEditComment(x, i)}
                                                                                                            onDelete={() => deleteComment(x.id, i)}
                                                                                                        />
                                                                                                    </Fragment>)}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Fragment>
                                                                                                {selectedCommentIndex === i && isEditComment ? (
                                                                                                    <CommentEditor
                                                                                                        isEditMode={selectedCommentIndex === i && isEditComment}
                                                                                                        comment={selectedComment?.comment}
                                                                                                        images={selectedComment?.images}
                                                                                                        onUpdateComment={onUpdateComment}
                                                                                                        onCancelComment={onCancelComment}
                                                                                                        onDeleteImage={(i) => onDeleteCommentImage(i, true)}
                                                                                                        onImageUpload={(e) => handleAddCommentImg(e, true)}
                                                                                                        onCommentChange={(e) => setSelectedComment({ ...selectedComment, comment: e.target.value, })}
                                                                                                        isSaving={isSaveUpdateComment}
                                                                                                        idImageUpload={"selectedCommentImg"}
                                                                                                        maxImages={5}
                                                                                                    />
                                                                                                ) : (
                                                                                                    <CommentEditor
                                                                                                        comment={x.comment}
                                                                                                        images={x.images}
                                                                                                        onImageClick={(index) => {
                                                                                                            const allImageUrls = (x.images || []).map((img) =>
                                                                                                                img.name ? URL.createObjectURL(img) : `${DO_SPACES_ENDPOINT}/${img}`
                                                                                                            );
                                                                                                            handleImagePreview(allImageUrls, index);
                                                                                                        }}
                                                                                                    />
                                                                                                )}
                                                                                            </Fragment>
                                                                                        </div>

                                                                                        {selectedCommentIndex === i ? ("") : (
                                                                                            <div className={"flex justify-between"}>
                                                                                                <Button
                                                                                                    className="p-0 text-sm h-auto font-medium text-primary"
                                                                                                    variant={"ghost hover-none"}
                                                                                                    onClick={() => { onShowSubComment(i); }}
                                                                                                    key={`comment-nested-reply-to-${i}`}
                                                                                                >
                                                                                                    Reply
                                                                                                </Button>
                                                                                                <div className={"flex items-center gap-2 cursor-pointer"}
                                                                                                    onClick={() => onShowSubComment(i)}
                                                                                                >
                                                                                                    <span>
                                                                                                        <MessageCircleMore className={"stroke-primary w-[16px] h-[16px]"} />
                                                                                                    </span>
                                                                                                    <p className={"text-base font-normal"}>{x?.reply?.length}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        {x.showReply ? (
                                                                                            <div className={"space-y-3"}>
                                                                                                {(x?.reply || []).map((y, j) => {
                                                                                                    return (
                                                                                                        <Fragment key={j}>
                                                                                                            <div className={"flex gap-2"}>
                                                                                                                <div>
                                                                                                                    <div className={"update-idea text-sm rounded-full text-center"}>
                                                                                                                        <UserAvatar
                                                                                                                            userPhoto={y.profileImage}
                                                                                                                            initialStyle={"text-sm"}
                                                                                                                            userName={y?.name && y.name !== "null" ? y.name : y?.userName}
                                                                                                                        />
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                                <div className={"w-full space-y-2"}>
                                                                                                                    <div className={"flex flex-wrap justify-between"}>
                                                                                                                        <div className={"flex flex-wrap items-start"}>
                                                                                                                            <h4 className={"text-sm font-normal"}>
                                                                                                                                {y?.name && y.name !== "null" ? y.name : y?.userName}
                                                                                                                            </h4>
                                                                                                                            <p className={"text-sm font-normal flex items-center text-muted-foreground"}>
                                                                                                                                <Dot size={20}
                                                                                                                                    className={"fill-text-card-foreground stroke-text-card-foreground"}
                                                                                                                                />
                                                                                                                                {dayjs.utc(y.createdAt).local().startOf("seconds").fromNow()}
                                                                                                                                {y.isEdited && (
                                                                                                                                    <span className={"text-sm font-normal text-muted-foreground ml-1"}>
                                                                                                                                        (edited)
                                                                                                                                    </span>
                                                                                                                                )}
                                                                                                                            </p>
                                                                                                                        </div>

                                                                                                                        {selectedCommentIndex === i && selectedSubCommentIndex === j ? ("")
                                                                                                                            : (<Fragment>
                                                                                                                                <ActionButtons
                                                                                                                                    isEditable={true}
                                                                                                                                    onEdit={() => onEditSubComment(x, y, i, j)}
                                                                                                                                    onDelete={() => deleteSubComment(y.id, x, i, j)}
                                                                                                                                />
                                                                                                                            </Fragment>)}
                                                                                                                    </div>
                                                                                                                    <div>
                                                                                                                        {selectedCommentIndex === i && selectedSubCommentIndex === j ? (
                                                                                                                            <CommentEditor
                                                                                                                                isEditMode={selectedCommentIndex === i && selectedSubCommentIndex === j}
                                                                                                                                comment={selectedSubComment?.comment}
                                                                                                                                images={selectedSubComment?.images}
                                                                                                                                onUpdateComment={onUpdateSubComment}
                                                                                                                                onCancelComment={onCancelSubComment}
                                                                                                                                onDeleteImage={(i) => onDeleteSubCommentImage(i, true)}
                                                                                                                                onImageUpload={handleSubCommentUploadImg}
                                                                                                                                onCommentChange={(e) => onChangeTextSubComment(e)}
                                                                                                                                isSaving={isSaveUpdateSubComment}
                                                                                                                                idImageUpload={"commentFileInput"}
                                                                                                                                maxImages={5}
                                                                                                                            />
                                                                                                                        ) : (
                                                                                                                            <CommentEditor
                                                                                                                                comment={y.comment}
                                                                                                                                images={y.images}
                                                                                                                                onImageClick={(img) => handleImageOpen(img)}
                                                                                                                            />
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </Fragment>
                                                                                                    );
                                                                                                })}

                                                                                                <div className={"space-y-2"}>
                                                                                                    {subCommentTextEditIdx === i && (
                                                                                                        <Textarea autoFocus
                                                                                                            value={subCommentText[i] || ""}
                                                                                                            placeholder={'Add a reply…'}
                                                                                                            onChange={(e) => handleSubCommentTextChange(e, i)}
                                                                                                            onKeyDown={(e) => onKeyFire(e, (isEmpty(subCommentText[i]) || isSaveSubComment && subCommentTextEditIdx === i) ? null : () => onCreateSubComment(x, i))}
                                                                                                        />
                                                                                                    )}
                                                                                                    {subCommentFiles && subCommentFiles.length ? (
                                                                                                        <div className={"flex gap-3 flex-wrap mt-1"}>
                                                                                                            {(subCommentFiles || []).map((z, i) => {
                                                                                                                const allImageUrls = subCommentFiles.map(file =>
                                                                                                                    file.name ? URL.createObjectURL(file) : `${DO_SPACES_ENDPOINT}/${file}`
                                                                                                                );
                                                                                                                return (
                                                                                                                    <Fragment key={i}>
                                                                                                                        {z && (
                                                                                                                            <div className="border rounded relative w-full max-w-[50px] max-h-[50px] h-full">
                                                                                                                                <AspectRatio ratio={10 / 10} className="bg-white">
                                                                                                                                    <img className="upload-img cursor-pointer"
                                                                                                                                        src={z.name ? URL.createObjectURL(z) : `${DO_SPACES_ENDPOINT}/${z}`}
                                                                                                                                        alt={z.name || z}
                                                                                                                                        onClick={() => handleImageOpen(z.name ? URL.createObjectURL(z) : z)}
                                                                                                                                    />
                                                                                                                                    <CircleX size={20}
                                                                                                                                        className="stroke-gray-500 cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                                                                                                                        onClick={() => onDeleteSubCommentImageOld(i, false)}
                                                                                                                                    />
                                                                                                                                </AspectRatio>
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </Fragment>
                                                                                                                );
                                                                                                            })}
                                                                                                        </div>
                                                                                                    ) : ("")}
                                                                                                    {subCommentTextEditIdx === i && (
                                                                                                        <div>
                                                                                                            <div className={"flex gap-2"}>
                                                                                                                <Button
                                                                                                                    className={`${isSaveSubComment === true ? "py-2 px-6" : "py-2 px-6"} w-[86px] h-[30px] text-sm font-medium`}
                                                                                                                    disabled={isEmpty(subCommentText[i]) || isSaveSubComment && subCommentTextEditIdx === i}
                                                                                                                    onClick={() => onCreateSubComment(x, i)}
                                                                                                                >
                                                                                                                    {isSaveSubComment && subCommentTextEditIdx === i ? (<Loader2 size={16} className="animate-spin" />) : ("Reply")}
                                                                                                                </Button>
                                                                                                                <UploadButton
                                                                                                                    onChange={handleSubCommentUploadImg}
                                                                                                                    disabled={isSaveSubComment && subCommentTextEditIdx === i}
                                                                                                                    currentImages={subCommentFiles}
                                                                                                                    onClick={() => {
                                                                                                                        setSelectedComment(null);
                                                                                                                        setSelectedCommentIndex(null);
                                                                                                                        setSelectedSubComment(null);
                                                                                                                        setSelectedSubCommentIndex(null);
                                                                                                                    }}
                                                                                                                />
                                                                                                            </div>
                                                                                                            {subCommentFiles.length >= 5 && (<span className="text-xs text-red-500 whitespace-nowrap">
                                                                                                                Max 5 images can be uploaded.
                                                                                                            </span>)}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : ("")}
                                                                                    </div>
                                                                                </div>
                                                                                    </div>
                                                                            </Fragment>
                                                                        );
                                                                    }) : ""}
                                                                {ideaComment?.comments?.length > 0 ? (hasMoreComments ? (
                                                                    <div className="flex justify-center py-4">
                                                                        <Button onClick={loadMoreComments} disabled={isLoadingComments} className="font-medium">
                                                                            {isLoadingComments ? (<Loader2 className="h-4 w-4 animate-spin mr-2" />) : null}
                                                                            Load More
                                                                        </Button>
                                                                    </div>) : ("")) : ("")}
                                                            </Fragment>
                                                        </TabsContent>
                                                    ) : (
                                                        <TabsContent value="comment">
                                                            <div className="py-10 flex flex-col justify-center items-center">
                                                                {Icon.commentEmpty}
                                                                <p className={"text-muted-foreground text-sm"}>No comments yet, be the first to share your thoughts!</p>
                                                            </div>
                                                        </TabsContent>
                                                    )}

                                                    {mergedIdeas && mergedIdeas.length > 0 ? (
                                                        <TabsContent value="merge" className={`bg-muted`}>
                                                            {mergedIdeas.map((idea, index) => (
                                                                <div key={idea.id} className={"flex gap-2 p-4 lg:px-8 border-b last:border-b-0"}>
                                                                    <div className={"w-full flex flex-col space-y-2"}>
                                                                        <div className={"flex gap-1 flex-wrap justify-between items-start"}>
                                                                            <div className={"flex-1"}>
                                                                                <h4 className={"text-sm font-semibold mb-2  max-w-[278px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-wrap"}>
                                                                                    {idea.title}
                                                                                </h4>
                                                                                <div
                                                                                    className="text-sm text-muted-foreground prose prose-sm max-w-[278px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-wrap"
                                                                                    dangerouslySetInnerHTML={{ __html: idea.description }}
                                                                                />
                                                                                <p className={"text-xs text-muted-foreground mt-2"}>
                                                                                    Created: {dayjs.utc(idea.createdAt).local().format("MMM DD, YYYY")}
                                                                                </p>
                                                                            </div>
                                                                            <div className={"flex gap-2"}>
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                            <Ellipsis className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="end">
                                                                                        <DropdownMenuItem
                                                                                            onClick={() => handleUnmergeClick(idea.id, idea.title)}
                                                                                            disabled={isUnmerging}
                                                                                            className="text-primary focus:text-primary cursor-pointer"
                                                                                        >
                                                                                            {isUnmerging ? (
                                                                                                <Fragment>
                                                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                                                    Unmerging...
                                                                                                </Fragment>
                                                                                            ) : (
                                                                                                <Fragment>
                                                                                                    <CornerDownLeft size={16} className="mr-2 text-black" />
                                                                                                    <span>Unmerge Feedback</span>
                                                                                                </Fragment>
                                                                                            )}
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </TabsContent>
                                                    ) : (
                                                        ""
                                                    )}

                                                </Tabs>
                                            </div>
                                        </Fragment>
                                    )}
                                </Fragment>
                            )}

                        </div>
                    </div>
                </Card>
            </div>
        </Fragment>
    );
};

export default UpdateIdea;
