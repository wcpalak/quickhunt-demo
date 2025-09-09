import React, { Fragment, useEffect, useState } from "react";
import { Plus, } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Icon } from "../../../utils/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ReadMoreText } from "../../Comman/ReadMoreText";
import { apiService, cleanQuillHtml, DO_SPACES_ENDPOINT, getDateFormat, hexToRGBA, isContentEmpty, isEmpty, } from "../../../utils/constent";
import { useSelector } from "react-redux";

const IdeaWidgetPreview = ({ widgetsSetting, getBadgeStyle, isPolaris }) => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const [ideasList, setIdeasList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllIdea();
        }
    }, [projectDetailsReducer.id]);

    const getAllIdea = async () => {
        const data = await apiService.getAllIdea({
            projectId: projectDetailsReducer.id,
            page: 1,
            limit: 10,
        });
        setIsLoading(false);
        if (data.success) {
            setIdeasList(data.data?.ideas);
        }
    };

    const btnClass = `bg-white border-[#e2e8f0] text-black hover:bg-[#f8fafc] hover:text-black`;
    const cardClass = `bg-white text-black border-[#e2e8f0]`;

    return (
        <div className={"px-3 flex flex-col h-full"}>
            <div className={'flex flex-col gap-1 mb-2'}>
                <h1 className="text-[20px] font-medium">{widgetsSetting.ideaTitle || "Feedback"}</h1>
                {
                    !isEmpty(widgetsSetting.ideaDescriptionText) &&
                    <h6 className="text-[13px] text-[#52525B]">{widgetsSetting.ideaDescriptionText}</h6>
                }
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3 justify-between">
                <Button
                    className={`${isPolaris ? "SC-Polaris-Button SC-Primary" : `rounded-[9px]`}`}
                    style={isPolaris ? {} : { backgroundColor: widgetsSetting?.btnBackgroundColor, color: widgetsSetting?.btnTextColor, }}
                >
                    {widgetsSetting.ideaButtonLabel ? widgetsSetting.ideaButtonLabel : "Create Feedback"}
                </Button>
                <div className="flex gap-2 justify-start relative">
                    <Button size="icon" variant="outline" className={`w-9 h-9 flex ${btnClass}`}>
                        {Icon.filter}
                    </Button>
                    <Button size="sm" variant="outline" className="flex gap-2 rounded-[9px] text-[#52525B] bg-white hover:bg-[#f8fafc]">
                        {Icon.boardIcon} Board
                    </Button>
                </div>
            </div>

            <div className="block overflow-y-auto">
                {isLoading ? (
                    <Card className={cardClass}>
                        {Array.from(Array(8)).map((_, r) => {
                            return (
                                <div key={`idea_${r}`}
                                    className={`box-border flex flex-col gap-2 p-3 ${r != 0 ? "border-t border-zinc-200" : ""}`}
                                >
                                    <Skeleton className="h-2 w-full bg-[#f1f5f9]" />
                                    <Skeleton className="h-2 w-full bg-[#f1f5f9]" />
                                    <Skeleton className="h-2 w-6/12 bg-[#f1f5f9]" />
                                </div>
                            );
                        })}
                    </Card>
                ) : ideasList.length ? (
                    <Fragment>
                        <div className="space-y-[15px]">
                            {(ideasList || []).map((idea, index) => {
                                return (
                                    <div key={`idea_${idea.id}`}
                                        className={`${isPolaris ? "SC-Polaris-Box" : "box-border p-5 border border-[#F5F5FA] rounded-[15px] bg-[#FBFBFF]"}`}
                                    >
                                        <div className="flex flex-wrap justify-between sm:gap-4 gap-2 items-center">
                                            <div className="sm:w-auto w-full flex-initial flex gap-4 items-center">
                                                <h2 className="text-sm cursor-pointer font-medium">{idea.title}</h2>
                                            </div>
                                            <div className="flex flex-wrap gap-4 items-center justify-between">
                                                <div className="flex gap-1 flex-wrap">
                                                    {(idea?.tags || []).map((x) => {
                                                        return (
                                                            <div key={`x_topic_${x.id}`}
                                                                className={`${isPolaris ? "SC-Polaris-Badge" : "text-xs bg-[#f6f5ff] border-gray-[#dee1ea80] border truncate py-1 px-2 font-medium text-[#5b678f] rounded-md"}`}
                                                            >
                                                                {x.title}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {idea?.roadmapStatusId && idea?.roadmapTitle ? (
                                                    <div
                                                        className={`${getBadgeStyle('secondary')?.className}`} style={getBadgeStyle('secondary', { bg: hexToRGBA(idea?.roadmapColor, 0.1), clr: idea?.roadmapColor })?.style}
                                                    >
                                                        {idea?.roadmapTitle}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        {widgetsSetting?.ideaDescription && !isContentEmpty(idea?.description) ? (
                                            <Fragment>
                                                <div className="pt-3 description-container text-[#52525B]">
                                                    <ReadMoreText alldata={idea} isPolaris={isPolaris} />
                                                </div>
                                            </Fragment>
                                        ) : ("")}
                                        <div className={`flex flex-wrap items-center justify-between md:gap-6 gap-4 pt-3 mt-4 border-t`}>
                                            <div className="flex-initial w-auto flex items-center gap-2">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={idea?.profileImage ? `${DO_SPACES_ENDPOINT}/${idea?.profileImage}` : null}
                                                        alt={idea?.userName?.substring(0, 1)?.toUpperCase()}
                                                        className="size-[20px] object-cover border rounded-full"
                                                    />
                                                    <AvatarFallback
                                                        className="size-[20px] border object-cover flex justify-center items-center rounded-full text-sm font-bold bg-zinc-200 capitalize">
                                                        {idea?.userName ? idea?.userName?.substring(0, 1) : "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div
                                                    className="text-sm  border-r pe-3 text-[#262626] leading-5 truncate capitalize font-medium">
                                                    {idea.userName ? idea.userName : "Unknown"}
                                                </div>
                                                <div className="text-xs leading-5 text-[#262626]">{getDateFormat(idea.createdAt)}</div>
                                            </div>
                                            <div className="flex gap-4 items-center sm:justify-end justify-center ">
                                                <div className="flex gap-[5px] items-center justify-between">
                                                    <div className={`size-[20px] relative cursor-pointer`}
                                                        style={
                                                            idea?.userVote === 1 && !isPolaris ? {
                                                                color: "#7c3aed", fill: "#7c3aed",
                                                            } : {
                                                                color: "#6b7280", fill: "#6b7280",
                                                            }
                                                        }
                                                    >
                                                        {Icon.caretUp}
                                                    </div>
                                                    <div className="scroll-m-20 text-sm font-medium tracking-tight">
                                                        {idea?.vote}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    <span className={""}>{Icon.chatbuble}</span>
                                                    <div className="text-sm font-medium leading-none">
                                                        {idea?.commentCount}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Fragment>
                ) : (
                    <Card className={`${cardClass} px-6 py-3`}>
                        <div className="flex items-center justify-center bg-white py-6">
                            <div className="max-w-md w-full text-center">
                                {Icon.noData}
                                <h3 className="mt-2 text-xl font-normal text-gray-900">No Items Found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    It looks like you haven't added any items yet. Start by adding
                                    new items to see them here.
                                </p>
                                <div className="mt-6">
                                    <Button
                                        className={`${isPolaris ? "SC-Polaris-Button SC-Primary" : `rounded-[9px]`} gap-1.5`}
                                        style={isPolaris ? {} : { backgroundColor: widgetsSetting?.btnBackgroundColor, color: widgetsSetting?.btnTextColor, }}
                                    >
                                        <Plus size={18} /> {widgetsSetting.ideaButtonLabel ? widgetsSetting.ideaButtonLabel : "Add New Feedback"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default IdeaWidgetPreview;
