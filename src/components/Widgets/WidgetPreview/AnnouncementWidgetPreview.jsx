import React, {useState, useEffect, Fragment} from "react";
import {Card} from "../../ui/card";
import {Skeleton} from "../../ui/skeleton";
import {AspectRatio} from "../../ui/aspect-ratio";
import {apiService, DO_SPACES_ENDPOINT, hexToRGBA, isEmpty,} from "../../../utils/constent";
import dayjs from "dayjs";
import {Badge} from "../../ui/badge";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger,} from "../../ui/accordion";
import {Avatar, AvatarImage} from "../../ui/avatar";
import {Button} from "../../ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "../../ui/popover";
import {Bell, SmilePlus,} from "lucide-react";
import {Textarea} from "../../ui/textarea";
import {useSelector} from "react-redux";
import {Icon} from "../../../utils/Icon";
import {ReadMoreText} from "../../Comman/ReadMoreText";

const AnnouncementWidgetPreview = ({widgetsSetting, getBadgeStyle, isPolaris}) => {
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const [announcementsList, setAnnouncementsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllPosts();
        }
    }, [projectDetailsReducer.id]);

    const getAllPosts = async () => {
        const data = await apiService.getAllPosts({
            projectId: projectDetailsReducer.id,
            page: 1,
            limit: 10,
            status: 1,
        });
        setIsLoading(false);
        if (data.success) {
            setAnnouncementsList(data.data.data);
        }
    };

    const isLimitEmoji = 1;
    const btnClass = `bg-white border-[#e2e8f0] text-black hover:bg-[#f8fafc] hover:text-black`;
    const cardClass = `bg-white text-black border-[#e2e8f0]`;

    return (
        <div className={"px-3 flex flex-col h-full"}>
            <div className={'flex flex-col gap-1'}>
                <h1 className="text-[20px] font-medium">{widgetsSetting.changelogTitle || "Changelogs"}</h1>
                {
                    !isEmpty(widgetsSetting.announcementDescriptionText) &&
                    <h6 className="text-[13px] text-[#52525B]">{widgetsSetting.announcementDescriptionText}</h6>
                }
            </div>
            <div className="mt-2 mb-4 flex justify-between gap-1 flex-wrap">
                <Button 
                    className={`${isPolaris ? "SC-Polaris-Button SC-Primary" : `rounded-[9px]`} gap-1.5`}
                    style={isPolaris ? {} : {backgroundColor: widgetsSetting?.btnBackgroundColor, color: widgetsSetting?.btnTextColor,}}
                >
                    <Bell className={'sm:w-4 sm:h-4 w-[14px] h-[14px]'} stroke={isPolaris ? "#ffffff" : widgetsSetting?.btnTextColor}/>
                    Subscribe to updates
                </Button>
                <Button variant="outline" size="icon" className={`w-9 h-9 rounded-[7px] ${btnClass}`}>
                    {Icon.filter}
                </Button>
            </div>

            <div className={"block overflow-y-auto"}>
                {isLoading ? (
                    <Card className={cardClass}>
                        {Array.from(Array(8)).map((_, r) => {
                            return (
                                <div key={`idea_${r}`} className={`box-border flex flex-col gap-2 p-3 border-t border-zinc-200`}>
                                    <Skeleton className="h-2 w-full bg-[#f1f5f9]"/>
                                    <Skeleton className="h-2 w-full bg-[#f1f5f9]"/>
                                    <Skeleton className="h-2 w-6/12 bg-[#f1f5f9]"/>
                                </div>
                            );
                        })}
                    </Card>
                ) : announcementsList.length ? (
                    <Fragment>
                        <Card className={"bg-white text-black border-none"}>
                            {(announcementsList || []).map((x, index) => {
                                return (
                                    <div key={`announcement_${x.id}`} className={`box-border border-t border-zinc-200`}>
                                        <div className={`flex justify-between ${x?.labels.length > 5 ? "flex-col" : "items-center"} md:mb-3 mb-5 mt-3 gap-2`}>
                                            <div className="flex-initial w-auto flex items-center gap-2 ">
                                                <div className="text-xs text-nowrap border-r pe-3 leading-5 text-[#262626] font-medium capitalize">
                                                    {x?.contributors && x?.contributors?.firstName}{" "}
                                                    {x?.contributors && x?.contributors?.lastName}
                                                </div>
                                                <div className="text-xs text-nowrap leading-5 text-[#262626]">
                                                    {dayjs(x.publishedAt).format("MMM DD, YYYY")}
                                                </div>
                                            </div>
                                        </div>
                                        {x.featureImage && widgetsSetting?.announcementImage && (
                                            <AspectRatio ratio={10 / 5}
                                                className={`${isPolaris ? "bg-[#f7f7f7]" : "bg-muted"} mt-2 rounded-ss-md rounded-se-md mb-1`}
                                            >
                                                <img
                                                    src={`${DO_SPACES_ENDPOINT}/${x.featureImage}`}
                                                    alt={x.title}
                                                    className="w-full h-full object-contain object-center border border-[#0000001A] rounded-[10px]"
                                                />
                                            </AspectRatio>
                                        )}
                                        <div className="p-3">
                                            <div className="flex flex-wrap gap-2 items-center justify-between">
                                                <div className="flex-initial flex gap-4 items-center">
                                                    <h2 className="text-base cursor-pointer font-medium">{x.title}</h2>
                                                </div>
                                                <div className="flex flex-wrap gap-4 items-center justify-between">
                                                    {x?.labels.length || x?.categoryTitle ? (
                                                        <div className={`flex flex-wrap ${x?.labels.length > 5 ? "" : "justify-end"} gap-1`}>
                                                            {!isEmpty(x?.categoryTitle) && (
                                                                <Badge variant="outline" size={"small"}
                                                                    className={`${isPolaris ? "SC-Polaris-Badge" : "rounded-[7px] border-none bg-purple-100 text-[#7c3aed]"}`}
                                                                >
                                                                    {x.categoryTitle}
                                                                </Badge>
                                                            )}
                                                            {(x?.labels || []).map((y) => {
                                                                return (
                                                                    <div
                                                                        key={`badge-${index}-${y.colorCode}`}
                                                                        className={`${getBadgeStyle('secondary')?.className}`} style={getBadgeStyle('secondary', {bg: hexToRGBA(y.colorCode, 0.1), clr: y.colorCode})?.style}
                                                                    >
                                                                        {y.name}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : ("")}
                                                </div>
                                            </div>
                                            {widgetsSetting?.announcementDescription ? (
                                                <Fragment>
                                                    <ReadMoreText className={'inline-block pt-3 text-sm text-[#52525B]'} alldata={x} isPolaris={isPolaris}/>
                                                </Fragment>
                                            ) : ("")}

                                            {widgetsSetting?.changelogReaction || widgetsSetting?.isComment ? (
                                                <div className={"pt-4"}>
                                                    <Accordion className={"border-t border-b  rounded-lg border-[#e2e8f0]"}>
                                                        <AccordionItem value="item-1" className={"border-0 border-l border-r rounded-lg py-2 border-[#e2e8f0]"}>
                                                            <div className={"flex items-center justify-between gap-3 pl-2 pr-3"}>
                                                                {widgetsSetting?.changelogReaction ? (
                                                                    <div className={"flex gap-2.5 items-center"}>
                                                                        {(allStatusAndTypes.emoji || []).map(
                                                                            (e, i) => {
                                                                                const findEmoji = (x.reactions || []).find((r) => r.reactionId == e.id) || {count: 0,};
                                                                                return i <= isLimitEmoji ? (
                                                                                    <Button key={`emoji_${x.id}_${e.id}`} variant={"ghost"}
                                                                                        className={`${isPolaris ? "hover:bg-[#fafafa] bg-[#ffffff] border" : "bg-white hover:bg-muted border hover:border-transparent"} px-2 w-8 h-8 py-0 z-10 text-center items-center justify-center text-base rounded-lg relative `}
                                                                                    >
                                                                                        <span className={`absolute py-0.5 leading-none -right-1 border rounded shadow -top-1 text-[9px] font-bold tracking-wide  px-0.5 text-background-accent bg-white`}>
                                                                                            {findEmoji?.count}
                                                                                        </span>
                                                                                        <Avatar className="w-[22px] h-[22px]">
                                                                                            <AvatarImage src={e.emojiUrl}/>
                                                                                        </Avatar>
                                                                                    </Button>
                                                                                ) : ("");
                                                                            }
                                                                        )}
                                                                        <Button className={`${isPolaris ? "hover:bg-[#fafafa] bg-[#ffffff] border" : "bg-white hover:bg-muted border hover:border-transparent"} text-black relative w-8 h-8 px-1 z-10 text-center flex items-center justify-center text-base rounded-lg`}>
                                                                            <SmilePlus width={"22"} height={"22"}/>
                                                                        </Button>
                                                                        {/*<Popover>*/}
                                                                        {/*    <PopoverTrigger className={`${isPolaris ? "hover:bg-[#fafafa] bg-[#ffffff] border" : "bg-white hover:bg-muted border hover:border-transparent"} relative w-8 h-8 px-1 z-10 text-center flex items-center justify-center text-base rounded-lg`}>*/}
                                                                        {/*        <SmilePlus width={"22"} height={"22"}/>*/}
                                                                        {/*    </PopoverTrigger>*/}
                                                                        {/*    <PopoverContent className={`w-full p-2 ${cardClass}`}>*/}
                                                                        {/*        <div className="flex gap-2">*/}
                                                                        {/*            {(allStatusAndTypes.emoji || []).map(*/}
                                                                        {/*                (e, i) => {*/}
                                                                        {/*                    const findEmoji = (x.reactions || []).find((r) => r.reactionId == e.id) || {count: 0};*/}
                                                                        {/*                    return i > isLimitEmoji ? (*/}
                                                                        {/*                        <Button key={`emoji_${x.id}_${e.id}`} variant={"ghost"}*/}
                                                                        {/*                            className={`w-8 h-8 px-2 py-0 z-10 text-center items-center justify-center text-base rounded-lg border border-transparent relative hover:bg-white light:hover:text-card hover:border-gray-100 border-gray-100`}*/}
                                                                        {/*                        >*/}
                                                                        {/*                            <span className={`absolute py-0.5 leading-none -right-1 border rounded shadow -top-1 text-[9px] font-bold tracking-wide  px-0.5 text-background-accent bg-white`}>*/}
                                                                        {/*                                {findEmoji?.count}*/}
                                                                        {/*                            </span>*/}
                                                                        {/*                            <Avatar className="w-[22px] h-[22px]">*/}
                                                                        {/*                                <AvatarImage src={e.emojiUrl}/>*/}
                                                                        {/*                            </Avatar>*/}
                                                                        {/*                        </Button>*/}
                                                                        {/*                    ) : ("");*/}
                                                                        {/*                }*/}
                                                                        {/*            )}*/}
                                                                        {/*        </div>*/}
                                                                        {/*    </PopoverContent>*/}
                                                                        {/*</Popover>*/}
                                                                    </div>
                                                                ) : ("")}
                                                                {widgetsSetting?.isComment ? (
                                                                    <AccordionTrigger className={`flex w-full relative items-center justify-end no-underline hover:no-underline py-1 `}>
                                                                        <div
                                                                            className={`text-left ${widgetsSetting?.changelogReaction ? "border-l" : ""} text-left  px-3 text-xs leading-5 text-muted-foreground text-400 truncate absolute left-0 right-5`}
                                                                            style={{overflow: "visible"}}
                                                                        >
                                                                            Write a {widgetsSetting?.isShowAnnouncementFeedback ? "comment" : "feedback"}...
                                                                        </div>
                                                                    </AccordionTrigger>
                                                                ) : ("")}
                                                            </div>
                                                            {widgetsSetting?.isComment ? (
                                                                <AccordionContent className={"p-0"}>
                                                                    <div className="relative overflow-hidden  border-t mt-2 border-[#e2e8f0]">
                                                                        <Textarea id="message" placeholder="Type your message here..."
                                                                            className={`${cardClass} min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0 ring-offset-color-0`}
                                                                        />
                                                                        <div className="flex items-center p-3 pt-0">
                                                                            <Button
                                                                            className={`${isPolaris ? "SC-Polaris-Button SC-Primary" : `rounded-[9px]`} ml-auto gap-1.5`}
                                                                            style={isPolaris ? {} : {backgroundColor: widgetsSetting?.btnBackgroundColor, color: widgetsSetting?.btnTextColor,}}
                                                                            >
                                                                                Post {widgetsSetting?.isShowAnnouncementFeedback ? "comment" : "feedback"}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            ) : ("")}
                                                        </AccordionItem>
                                                    </Accordion>
                                                </div>
                                            ) : ("")}
                                        </div>
                                    </div>
                                );
                            })}
                        </Card>
                    </Fragment>
                ) : (
                    <Card className={`px-6 py-3 ${cardClass}`}>
                        <div className="flex items-center justify-center bg-white py-6">
                            <div className="max-w-md w-full text-center">
                                {Icon.noData}
                                <h3 className="mt-2 text-xl font-normal text-gray-900">No Items Found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    It looks like you haven't added any items yet. Start by adding
                                    new items to see them here.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AnnouncementWidgetPreview;
