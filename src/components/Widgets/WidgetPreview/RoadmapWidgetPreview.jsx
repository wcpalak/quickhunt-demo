import React, {Fragment, useEffect, useRef, useState} from "react";
import {Card} from "../../ui/card";
import {Skeleton} from "../../ui/skeleton";
import {useSelector} from "react-redux";
import {apiService, DO_SPACES_ENDPOINT, isContentEmpty, isEmpty} from "../../../utils/constent";
import {Dot, Search} from "lucide-react";
import {Icon} from "../../../utils/Icon";
import {AspectRatio} from "@radix-ui/react-aspect-ratio";
import {ReadMoreText} from "../../Comman/ReadMoreText";
import {Button} from "../../ui/button";
import { useImagePreview } from "../../Comman/ImagePreviewProvider";

const RoadmapWidgetPreview = ({widgetsSetting, roadmapdata, isPolaris}) => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const {roadmapId} = widgetsSetting;
    const [roadmapList, setRoadmapList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scrollingSections, setScrollingSections] = useState({});
    const timersRef = useRef({});
    const { openPreview } = useImagePreview();

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getRoadmapIdea();
        }
    }, [projectDetailsReducer.id, roadmapId]);

    const getRoadmapIdea = async () => {
        setIsLoading(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            roadmapId: Number(roadmapId),
            page: "1",
            limit: "100",
        };
        const data = await apiService.getRoadmapIdea(payload);
        setIsLoading(false);
        if (data.success) {
            setRoadmapList(data.data.data);
        }
    };

    const handleScroll = (roadmapId, event, type = '') => {
        if (timersRef.current[roadmapId]) {
            clearTimeout(timersRef.current[roadmapId]);
        }

        setScrollingSections((prev) => ({
            ...prev,
            [roadmapId]: true,
        }));

        timersRef.current[roadmapId] = setTimeout(() => {
            setScrollingSections((prev) => ({
                ...prev,
                [roadmapId]: false,
            }));
            delete timersRef.current[roadmapId];
        }, 800);
    };

    const cardClass = `bg-white text-black border-[#e2e8f0]`;

    const matchedRoadmap = roadmapdata.find(roadmap => roadmap.id === widgetsSetting.roadmapId);
    
    return (
        <div className={"px-3 flex flex-col h-full"}>
            <div className={'flex flex-col gap-1 mb-2'}>
                <div className={'flex flex-wrap justify-between items-center gap-2'}>
                    <h1 className="text-[20px] font-medium">{widgetsSetting.roadmapTitle || "Roadmap"}</h1>
                    <div className={'flex gap-2'}>
                        <Button variant="outline" size="icon" className="w-9 h-9 rounded-[9px]">
                            <Search className="w-4 h-4"/>
                        </Button>

                        <Button variant="outline" size="icon" className="w-9 h-9 rounded-[9px]">
                            {Icon.filter}
                        </Button>

                        <Button variant="outline" size="icon" className="w-9 h-9 rounded-[9px]">
                            {Icon.boardIcon}
                        </Button>
                    </div>
                </div>
                {
                    (!isEmpty(matchedRoadmap?.description) && widgetsSetting.isShowRoadmapDescription === true) &&
                    <h6 className="text-[13px] text-[#52525B]">{matchedRoadmap?.description}</h6>
                }

            </div>
            <Card className={`p-0 border-0 overflow-x-auto overflow-y-hidden ${cardClass} flex-1 rounded-none roadmap-scroll ${scrollingSections['x-auto'] ? 'scrolling' : ''}`}
             onScroll={(e) => handleScroll('x-auto', e)}>
                {isLoading ? (
                    <div className="flex gap-4 items-start h-full">
                        {Array.from(Array(5)).map((_, r) => {
                            const loadCount = r === 0 || r === 3 ? 3 : r === 2 || r === 5 ? 5 : 4;
                            return (
                                <div key={`roadmapLoad_${r}`} className={`shrink-0 w-[342px] min-w-[342px] max-w-[342px] overflow-y-auto h-full roadmap-scroll ${scrollingSections['x-auto'] ? 'scrolling' : ''}`}
                                 onScroll={(e) => handleScroll(r, e)}>
                                    <Card className={`${cardClass} py-3 px-2 shadow-inner h-full min-h-fit`}>
                                        <h4 className={`text-sm text-slate-700 font-medium flex gap-2 items-center`}>
                                            <Skeleton className="h-3 w-3/5 bg-[#f1f5f9]"/>
                                        </h4>
                                        <div className={"flex gap-2 flex-col mt-4"}>
                                            {Array.from(Array(loadCount)).map((_, p) => {
                                                return (
                                                    <Card className={`p-2 ${cardClass}`} key={`roadmapLoad_${r}_${p}`}>
                                                        <div className="flex gap-2 items-center">
                                                            <Skeleton className="w-7 h-7 rounded bg-[#f1f5f9]"/>
                                                            <Skeleton className="h-4 w-4/5 bg-[#f1f5f9]"/>
                                                        </div>
                                                        <div className="flex flex-col gap-2 mt-3 mb-1">
                                                            <Skeleton className="h-2 w-full bg-[#f1f5f9]"/>
                                                            <Skeleton className="h-2 w-3/5 bg-[#f1f5f9]"/>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                ) : roadmapList && roadmapList.length > 0 ? (
                    <div className="flex gap-3 items-start h-full pb-3">
                        {(roadmapList || []).map((data) => {
                            return (
                                <div key={`roadmap_${data.id}`}
                                     className={`relative shrink-0 w-[342px] min-w-[342px] max-w-[342px] overflow-y-auto h-full ${scrollingSections[data.id] ? 'scrolling' : ''} roadmap-scroll`} onScroll={(e) => handleScroll(data.id,e, 'api')}>
                                    <Card className={`${isPolaris ? "SC-Polaris-Box SC-Secondary" : "p-[9px] bg-[#fbfbff] border-0 rounded-[10px]"} h-full min-h-fit`}>
                                        <h4 className={"tracking-tight flex items-center gap-2 text-sm font-medium px-[7px] pt-0.5 pb-[12px]"}>
                                            {isPolaris ? "" :  <span className={"w-2.5 h-2.5 rounded-full"} style={{backgroundColor: data.colorCode}}/>}
                                            {isPolaris ? <span className="SC-Polaris-Badge">{data.title} ({data.ideas.length})</span> : <Fragment>{data.title} ({data.ideas.length})</Fragment>}
                                        </h4>
                                        <div className={`flex flex-col ${scrollingSections[data.id] ? 'scrolling' : ''} overflow-y-auto roadmap-scroll ${navigator.platform.includes("Mac") ? "pr-[7px]" : ""}`} onScroll={(e) => handleScroll(data.id,e, 'api')}>
                                            {data.ideas.length ? (
                                                <Fragment>
                                                    {(data.ideas || []).map((idea) => {
                                                        return (
                                                            <Card key={`roadmap_idea_${idea.id}`}
                                                                className={`${isPolaris ? "SC-Polaris-Box !p-0" : "rounded-lg border bg-card text-card-foreground shadow-sm"} mb-3 last:mb-0`}
                                                            >
                                                                <div className="flex gap-2">
                                                                    <div className={'p-6 pr-0 py-4 ps-2 flex-1 max-w-[calc(100%_-_44px)]'}>
                                                                        {(idea.coverImage && widgetsSetting.roadmapImage) && (
                                                                            <AspectRatio ratio={10 / 5} className="bg-muted rounded-ss-md rounded-se-md mb-2">
                                                                                <img
                                                                                    src={`${DO_SPACES_ENDPOINT}/${idea.coverImage}`}
                                                                                    alt={idea.title}
                                                                                    className="w-full h-full object-contain object-center cursor-pointer"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openPreview(`${DO_SPACES_ENDPOINT}/${idea.coverImage}`);
                                                                                    }}
                                                                                />
                                                                            </AspectRatio>
                                                                        )}
                                                                        <h3 className={`text-sm font-medium  ${(idea.coverImage && widgetsSetting.roadmapImage) ? "m-0" : "-mt-1"}`}>
                                                                            {idea.title}
                                                                        </h3>
                                                                        {!isContentEmpty(idea?.description) && widgetsSetting?.isRoadmapDescription && (
                                                                            <Fragment>
                                                                                <ReadMoreText alldata={idea} className={'mt-1 text-[13px] text-[#52525B]'} isPolaris={isPolaris} />
                                                                            </Fragment>
                                                                        )}

                                                                        {/* comment topic section */}
                                                                        {(idea?.comments?.length && widgetsSetting?.isRoadmapComments) || (idea.topic.length && widgetsSetting?.isRoadmapTags) ? (
                                                                            <div className="flex items-start gap-.5 mt-3">
                                                                                {idea.topic.length && widgetsSetting?.isRoadmapTags ? (
                                                                                    <div className="flex flex-wrap gap-1 w-fit items-center">
                                                                                        {(idea.topic || []).map((topic) => {
                                                                                            return (
                                                                                                <div key={`y_topic_${topic.id}`}
                                                                                                className={`${isPolaris ? "SC-Polaris-Badge" : "text-xs bg-[#f6f5ff] border-gray-[#dee1ea80] border truncate py-1 px-2 font-medium text-[#5b678f] rounded-md"}`}
                                                                                                >
                                                                                                    {topic.title}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                ) : ("")}

                                                                                {idea?.comments?.length && widgetsSetting?.isRoadmapComments && idea.topic.length && widgetsSetting?.isRoadmapTags ? (
                                                                                    <Dot className="text-gray-300 -mt-0.5" size={20}/>
                                                                                ) : null}
                                                                                {idea?.comments?.length && widgetsSetting?.isRoadmapComments ? (
                                                                                    idea?.comments?.length ? (
                                                                                        <div className="flex items-center gap-1">
                                                                                            {Icon.chatbuble}{" "}
                                                                                            <div className="text-[10px] font-medium">
                                                                                                {" "}
                                                                                                {idea?.comments?.length}
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : ("")) : ("")}
                                                                            </div>
                                                                        ) : ("")}
                                                                    </div>
                                                                    <div className={'flex flex-col space-y-1.5 p-6 gap-2 py-4 px-2'}>
                                                                        <div className="flex-initial flex-col flex items-center justify-start">
                                                                            <span className={`inline-block w-5 h-5 cursor-pointer`}
                                                                                style={
                                                                                    idea?.userVote === 1 && !isPolaris ? {
                                                                                        color: "#7c3aed", fill: "#7c3aed"} : {
                                                                                        color: "#6b7280", fill: "#6b7280"}
                                                                                }
                                                                            >
                                                                                {Icon.caretUp}
                                                                            </span>
                                                                            <div className={`font-medium text-[11px]`}>{idea.vote}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        );
                                                    })}
                                                </Fragment>
                                            ) : (<span className="text-sm text-[#52525B] mt-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">No {data?.title} posts</span>)}
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex gap-4 items-start h-full pb-3">
                        {allStatusAndTypes?.roadmapStatus?.map((item, index) => (
                            <div key={index} className="shrink-0 w-[342px] min-w-[342px] max-w-[342px] overflow-y-auto h-full roadmap-scroll">
                                <Card className="p-[9px] bg-[#fbfbff] border-0 rounded-[10px] flex flex-col h-full min-h-fit">
                                    <h4 className={"tracking-tight flex items-center gap-2 text-sm font-medium px-[7px] pt-0.5 pb-[12px]"}>
                                        {isPolaris ? "" :<span style={{backgroundColor: item?.colorCode}} className={"w-2.5 h-2.5 rounded-full"}/>}
                                        {isPolaris ? <span className="SC-Polaris-Badge">{item.title}</span> : <Fragment>{item.title}</Fragment>}
                                    </h4>
                                    <div className={"flex flex-col text-sm text-[#52525B] items-center justify-center flex-1"}>
                                        No {item?.title} posts
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RoadmapWidgetPreview;
