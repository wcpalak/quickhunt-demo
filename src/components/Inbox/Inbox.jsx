import React, { Fragment, useEffect, useState } from 'react';
import { Check, Dot, Eye, EyeOff, GalleryVerticalEnd, Lightbulb, MessageCircleMore, MessageSquare, MessagesSquare, Vote, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import EmptyData from "../Comman/EmptyData";
import { useToast } from "../ui/use-toast";
import { useDispatch, useSelector } from "react-redux";
import dayjs from 'dayjs';
import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipTrigger, TooltipProvider, TooltipContent } from "../ui/tooltip";
import Pagination from "../Comman/Pagination";
import { useNavigate } from "react-router";
import { inboxMarkReadAction } from "../../redux/action/InboxMarkReadAction";
import { UserAvatar } from "../Comman/CommentEditor";
import { apiService } from "../../utils/constent";
import { Icon } from "../../utils/Icon";

const perPageLimit = 10;

const TabTitle = {
    1: "all",
    2: "post_feedbacks",
    3: "post_reactions",
    4: "feature_ideas",
    5: "feature_idea_comments",
    6: "feature_idea_votes",
}

const UserActionsList = ({ userActions, sourceTitle, isLoading, isEyeTabActive, currentTab }) => {
    const navigate = useNavigate();

    const filteredActions = isEyeTabActive ? userActions.filter(action => action?.isRead === 0) : userActions;

    if (isLoading) {
        return (
            <div className="divide-y">
                {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="px-2 py-[10px] md:px-3 flex justify-between gap-2">
                        <Skeleton className="rounded-md w-full h-7 bg-muted-foreground/[0.1]" />
                    </div>
                ))}
            </div>
        );
    }

    if (!filteredActions.length) {
        switch (currentTab) {
            case 1:
                return <EmptyData className={"p-[80px]"} children={"No notification yet"} emptyIcon={Icon.inboxAllEmpty} />;
            case 2:
                return <EmptyData className={"p-[80px]"} children={"No feedback received yet"} emptyIcon={Icon.inboxAnnouncementFeedbackEmpty} />;
            case 3:
                return <EmptyData className={"p-[80px]"} children={"No reactions yet"} emptyIcon={Icon.inboxAnnouncementReactionEmpty} />;
            case 4:
                return <EmptyData className={"p-[80px]"} children={"No new feedback yet"} emptyIcon={Icon.createIdeaEmpty} />;
            case 5:
                return <EmptyData className={"p-[80px]"} children={"No comments yet"} emptyIcon={Icon.ideaCommentEmpty} />;
            case 6:
                return <EmptyData className={"p-[80px]"} children={"No upvotes yet"} emptyIcon={Icon.inboxIdeaUpVoteEmpty} />;
            default:
                return <EmptyData className={"p-[80px]"} children={"No notification yet"} emptyIcon={Icon.inboxAllEmpty} />;
        }
    }

    const navigateAction = async (id, source) => {
        if (source === "feature_ideas" || source === "feature_idea_comments" || source === "feature_idea_votes") {
            navigate(`/feedback/${id}`);
        } else if (source === "post_feedbacks" || source === "post_reactions") {
            navigate(`/changelog/analytic-view?id=${id}`);
        }
    }

    return (
        <div className="divide-y">
            {(filteredActions || []).map((action, index) => (
                <Fragment key={index}>
                    {sourceTitle.map((source, i) => {
                        if (action.source === source.value) {
                            return (
                                <div
                                    onClick={() => navigateAction(action?.id, action.source)}
                                    className={`px-2 py-[10px] md:px-3 flex gap-4 cursor-pointer last:rounded-b-lg overflow-hidden ${
                                        action?.isRead === 0 ? "bg-muted/[0.6] hover:bg-card" : "bg-card"
                                    }`}
                                    key={i}
                                >
                                    <div className="flex-shrink-0">
                                        <UserAvatar
                                            userPhoto={action?.userPhoto}
                                            userName={
                                                action?.customerFirstName &&
                                                action?.customerFirstName.substring(0, 1).toUpperCase()
                                            }
                                            className="w-[30px] h-[30px]"
                                        />
                                    </div>
    
                                    <div className="w-full space-y-3 min-w-0 overflow-hidden">
                                        {/* Top section */}
                                        {/* <div className="flex items-center flex-wrap justify-between sm:gap-3 gap-2">
                                            <div
                                                className={`${
                                                    action?.isRead === 0 ? "font-medium" : "font-normal"
                                                } flex flex-wrap gap-2 md:gap-4 min-w-0 flex-1`}
                                            >
                                                <h2 className="truncate max-w-[150px] sm:max-w-[200px] text-md text-[15px]">
                                                    {action?.customerFirstName || action?.customerLastName
                                                        ? `${action?.customerFirstName || ""} ${action?.customerLastName || ""}`.trim()
                                                        : "Unknown"}
                                                </h2>
                                                <p className="flex gap-2 items-center min-w-0 text-sm">
                                                    <MessageCircleMore size={15} />
                                                    <span className="text-muted-foreground truncate">{source.title}</span>
                                                </p>
                                            </div>
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                {action?.createdAt
                                                    ? dayjs(action?.createdAt).format("D MMM, YYYY h:mm A")
                                                    : "-"}
                                            </span>
                                        </div> */}
    
                                        {/* Bottom section */}
                                        <div className="w-full space-y-2.5 min-w-0 overflow-hidden">
                                            <div className="min-w-0 flex items-center flex-wrap justify-between sm:gap-3 gap-2">
                                                {source.value === "post_reactions" ? (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Avatar className="rounded-none w-[20px] h-[20px] flex-shrink-0">
                                                            <AvatarImage src={action.emojiUrl} />
                                                        </Avatar>
                                                        <span className="text-base truncate">{action.title}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-base truncate block">{action.title}</span>
                                                )}
                                                <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                                                    {action?.createdAt
                                                        ? dayjs(action?.createdAt).format("D MMM, YYYY h:mm A")
                                                        : "-"}
                                                </span>
                                            </div>
    
                                            <div
                                                className={`${
                                                    action?.isRead === 0 ? "font-medium" : "font-normal"
                                                } flex flex-wrap gap-2 min-w-0 flex-1`}
                                            >
                                                <h2 className="truncate max-w-[150px] sm:max-w-[200px] text-sm">
                                                    {action?.customerFirstName || action?.customerLastName
                                                        ? `${action?.customerFirstName || ""} ${action?.customerLastName || ""}`.trim()
                                                        : "Unknown"}
                                                </h2>
                                                <p className="flex gap-0.5 items-center min-w-0">
                                                    <Dot size={15} />
                                                    <span className="text-muted-foreground truncate text-sm">
                                                        {source.title}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </Fragment>
            ))}
        </div>
    );
    
};

const Inbox = () => {
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const { toast } = useToast();
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [userActions, setUserActions] = useState([]);
    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(1);
    const [isEyeTabActive, setIsEyeTabActive] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [showMarkAllRead, setShowMarkAllRead] = useState(false);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getInboxNotification();
        }
    }, [projectDetailsReducer.id, pageNo, selectedTab, isEyeTabActive])

    useEffect(() => {
        const filteredActions = isEyeTabActive ? userActions.filter(action => action?.isRead === 0) : userActions;
        const hasUnread = filteredActions.some(action => action?.isRead === 0);
        setShowMarkAllRead(hasUnread);
    }, [userActions, isEyeTabActive]);

    const getInboxNotification = async () => {
        setIsLoading(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            type: selectedTab,
            page: pageNo,
            limit: perPageLimit,
            isRead: isEyeTabActive ? 1 : 0
        }
        const data = await apiService.inboxNotification(payload);
        if (data.success) {
            setUserActions(Array.isArray(data.data.data) ? data.data.data : []);
            const totalPage = Math.ceil(data.data.total / perPageLimit);
            setTotalPages(totalPage)
            setIsLoading(false)
        } else {
            setIsLoading(false);
        }
    }

    const markAsAllRead = async () => {
        setIsLoading(true);
        const data = await apiService.inboxMarkAllRead({ projectId: projectDetailsReducer.id, type: selectedTab });
        if (data.success) {
            const updatedActions = userActions.map((action) =>
                action.source === TabTitle[selectedTab] ? { ...action, isRead: 1 } : selectedTab === 1 ? {
                    ...action,
                    isRead: 1
                } : action
            );
            setUserActions(updatedActions);
            dispatch(inboxMarkReadAction(updatedActions));
            toast({ description: data.message, });
        } else {
            toast({ description: data?.error?.message, variant: "destructive", })
        }
        setIsLoading(false);
    }

    const onTabChange = (value) => {
        setSelectedTab(value);
        setPageNo(1);
        setTotalPages(1);
    }

    const handlePaginationClick = async (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPageNo(newPage);
        }
    };

    const sourceTitle = [
        { title: "Created an Feedback", value: "feature_ideas" },
        { title: "Commented on Feedback", value: "feature_idea_comments" },
        { title: "Upvoted on Feedback", value: "feature_idea_votes" },
        { title: "Feedback on Post", value: "post_feedbacks" },
        { title: "Reacted on Post", value: "post_reactions" },
    ]

    const tabs = [
        { label: "All", value: 1, icon: <Zap size={18} className={"mr-2"} />, },
        { label: "Changelog Feedback", value: 2, icon: <MessagesSquare size={18} className={"mr-2"} />, },
        { label: "Changelog Reactions", value: 3, icon: <GalleryVerticalEnd size={18} className={"mr-2"} />, },
        { label: "New Feedback Added", value: 4, icon: <Lightbulb size={18} className={"mr-2"} />, },
        { label: "Feedback Comments", value: 5, icon: <MessageSquare size={18} className={"mr-2"} />, },
        { label: "Feedback Upvotes", value: 6, icon: <Vote size={18} className={"mr-2"} />, },
    ];

    return (
        <Fragment>
            <div
                className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className={"flex flex-col gap-y-0.5"}>
                        <h1 className="text-2xl font-normal flex-initial w-auto">Inbox</h1>
                        <h5 className={"text-sm text-muted-foreground"}>Track changelog feedback and reactions, and
                            stay updated on feedback, their comments, and upvotes.</h5>
                    </div>
                    <div className={"flex gap-3"}>
                        {showMarkAllRead && (
                            <Button variant={"outline"} className={"flex gap-2 items-center"}
                                onClick={markAsAllRead}><Check size={18} />Mark All Read</Button>
                        )}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon"
                                        onClick={() => setIsEyeTabActive(!isEyeTabActive)} className={"h-9"}>
                                        {isEyeTabActive ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side={"bottom"}>
                                    {isEyeTabActive ? (<p>View all notifications</p>) : (<p>View unread notifications</p>)}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <Card className="my-6">
                    <CardContent className={"p-0"}>
                        <Tabs defaultValue={1} onValueChange={onTabChange}>
                            <div className={"border-b flex bg-background"}>
                                <TabsList
                                    className="w-full h-auto overflow-x-auto whitespace-nowrap justify-start last:rounded-t-lg">
                                    {(tabs || []).map((tab, i) => (
                                        <TabsTrigger key={i} value={tab.value}
                                            className={`border border-[#7c3aed26] mx-[6px] rounded-[8px] text-sm font-medium w-full team-tab-active team-tab-text-active text-slate-900`}
                                        >
                                            {tab.icon}{tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                            {
                                (tabs || []).map((y, i) => (
                                    <TabsContent key={i} value={y.value} className={"mt-0"}>
                                        <div className={"grid grid-cols-1 overflow-hidden"}>
                                            <UserActionsList
                                                userActions={userActions}
                                                sourceTitle={sourceTitle} isLoading={isLoading}
                                                isEyeTabActive={isEyeTabActive} currentTab={selectedTab} />
                                        </div>
                                    </TabsContent>
                                ))
                            }
                        </Tabs>
                    </CardContent>
                    {
                        (!isLoading && selectedTab !== 1 && userActions?.length > 0) ?
                            <Pagination
                                pageNo={pageNo}
                                totalPages={totalPages}
                                isLoading={isLoading}
                                handlePaginationClick={handlePaginationClick}
                                stateLength={userActions?.length}
                            /> : ""
                    }
                </Card>
            </div>
        </Fragment>
    );
};

export default Inbox;