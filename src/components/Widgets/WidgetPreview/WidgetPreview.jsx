import React, { Fragment, useEffect, useState } from "react";
import { Icon } from "../../../utils/Icon";
import { useSelector } from "react-redux";
import WidgetHeader from "./WidgetHeader";
import IdeaWidgetPreview from "./IdeaWidgetPreview";
import RoadmapWidgetPreview from "./RoadmapWidgetPreview";
import AnnouncementWidgetPreview from "./AnnouncementWidgetPreview";
import { Button } from "../../ui/button";
import { X } from "lucide-react";
import DocumentWidgetPreview from "./DocumentWidgetPreview";
import { brandingURL } from "../../../utils/constent";

const WidgetPreview = ({ widgetsSetting, type, toggle, onToggle, roadmapdata, selected, setSelected }) => {
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

    const navList = [
        {
            title: widgetsSetting.ideaTitle || "Feedback",
            link: "feedback",
            selected: selected === `feedback`,
            isCheck: widgetsSetting.isIdea !== false,
            isRedirect: widgetsSetting.ideaDisplay !== 2,
        },
        {
            title: widgetsSetting.roadmapTitle || "Roadmap",
            link: "roadmap",
            selected: selected === `roadmap`,
            isCheck: widgetsSetting.isRoadmap !== false,
            isRedirect: widgetsSetting.roadmapDisplay !== 2,
        },
        {
            title: widgetsSetting.changelogTitle || "Changelogs",
            link: "changelog",
            selected: selected === `changelog`,
            isCheck: widgetsSetting.isAnnouncement !== false,
            isRedirect: widgetsSetting.changelogDisplay !== 2,
        },
        {
            title: widgetsSetting.documentTitle || "Documents",
            link: "documents",
            selected: selected === `documents`,
            isCheck: widgetsSetting.isDocument !== false,
            isRedirect: widgetsSetting.documentDisplay !== 2,
        },
    ];

    const onRedirect = (link, redirectType) => {
        if (redirectType) {
            setSelected(link);
        } else {
            window.open(`https://${projectDetailsReducer.domain}/${link}`, "_blank");
        }
    };

    const isPolaris = widgetsSetting?.viewType === 2;

    const getBadgeStyle = (type = '', obj = {}) => {
        if (type === 'secondary') {
            return {
                className: isPolaris
                    ? "SC-Polaris-Badge"
                    : `rounded-[7px] text-xs px-2.5 py-0.5 font-semibold`,
                style: isPolaris
                    ? {}
                    : {
                        backgroundColor: obj?.bg,
                        color: obj?.clr,
                    },
            };
        }

        return { className: "", style: {} };
    };

    const renderContent = () => {
        return (
            <div className="flex flex-col relative h-full w-full">
                <WidgetHeader
                    onRedirect={onRedirect}
                    widgetsSetting={widgetsSetting}
                    onToggle={onToggle}
                    navList={navList}
                    isPolaris={isPolaris}
                />
                {/*{type === "sidebar" && (*/}
                {/*    <Button*/}
                {/*        size={"icon"}*/}
                {/*        onClick={onToggle}*/}
                {/*        variant={"secondary"}*/}
                {/*        className={"w-7 h-10 bg-white absolute top-1/2 -left-5 "}*/}
                {/*    >*/}
                {/*        <ChevronRight size={18}/>*/}
                {/*    </Button>*/}
                {/*)}*/}
                <main className="flex-1 block bg-white py-4 overflow-hidden">
                    {selected === "feedback" && widgetsSetting.isIdea && (
                        <IdeaWidgetPreview widgetsSetting={widgetsSetting} getBadgeStyle={getBadgeStyle} isPolaris={isPolaris} />
                    )}
                    {selected === "roadmap" && widgetsSetting.isRoadmap && (
                        <RoadmapWidgetPreview widgetsSetting={widgetsSetting} roadmapdata={roadmapdata} getBadgeStyle={getBadgeStyle} isPolaris={isPolaris} />
                    )}
                    {selected === "changelog" && widgetsSetting.isAnnouncement && (
                        <AnnouncementWidgetPreview widgetsSetting={widgetsSetting} getBadgeStyle={getBadgeStyle} isPolaris={isPolaris} />
                    )}
                    {selected === "documents" && widgetsSetting.isDocument && (
                        <DocumentWidgetPreview widgetsSetting={widgetsSetting} isPolaris={isPolaris} />
                    )}
                    {/* <ul className="flex gap-2 mt-4 items-center justify-center">
                            {Object.entries(allStatusAndTypes?.social || {})
                                .filter(([key, value]) => key !== "isActive" && value)
                                .map(([social, url]) => (
                                    <li key={social}>
                                        <a href={url} target="_blank" rel={social}
                                            className="w-8 h-8 border rounded flex items-center justify-center">
                                            {Icon[social]}
                                        </a>
                                    </li>
                                ))}
                        </ul> */}
                </main>
                {allStatusAndTypes?.setting?.isBranding === 0 &&
                    projectDetailsReducer.plan > 0 ? null : (
                    <section className={`py-4 bg-card`}>
                        <a className={`text-sm font-medium text-center flex justify-center gap-1 ${isPolaris ? "text-black" : "text-primary"}`} href={brandingURL} target="_blank">
                            {Icon.power}<span className={`text-black`}>Powered by</span>{" "}<span className={`${isPolaris ? "text-black" : "text-primary"} underline`}>Quickhunt</span>
                        </a>
                    </section>
                )}
            </div>
        );
    };
    return (
        <Fragment>
            {type === "popover" && (
                <div className={`QH-popover-admin ${toggle ? "QH-popover-open-admin" : ""} !overflow-visible`}
                    style={{
                        left:
                            widgetsSetting.launcherPosition === 1
                                ? type === "popover"
                                    ? `${widgetsSetting.launcherLeftSpacing || 20}px`
                                    : `${widgetsSetting.launcherLeftSpacing || 690}px`
                                : "inherit",
                        right:
                            widgetsSetting.launcherPosition === 2
                                ? `${widgetsSetting.launcherRightSpacing || 20}px`
                                : "inherit",
                        bottom: widgetsSetting.launcherBottomSpacing
                            ? `${widgetsSetting.launcherBottomSpacing || "90"}px`
                            : "inherit",
                        width: `${widgetsSetting.popoverWidth}px`,
                        height: `${widgetsSetting.popoverHeight}px`,
                    }}
                >
                    <Button size={"icon"} onClick={onToggle} variant={"secondary"}
                                className={"w-7 h-7 rounded-full bg-white z-10 absolute -right-2 border -top-3 "}
                            >
                                <X size={18} />
                            </Button>
                    {renderContent()}
                </div>
            )}

            {type === "sidebar" && (
                <div className={`QH-sidebar-admin ${toggle ? "QH-sidebar-open-admin" : ""} relative`}
                    style={{
                        left: widgetsSetting.sidebarPosition === 1 ? "0px" : "inherit",
                        right: widgetsSetting.sidebarPosition === 2 ? "0" : "inherit",
                    }}
                >
                    <div className={`QH-sidebar-content-admin ${type === "sidebar" ? "overflow-visible" : "overflow-hidden"}`}
                        style={{
                            left: widgetsSetting.sidebarPosition === 1 ? "0px" : "inherit",
                            right: widgetsSetting.sidebarPosition === 2 ? "0" : "inherit",
                            bottom: widgetsSetting.launcherBottomSpacing ? `${widgetsSetting.launcherBottomSpacing || "90"}px` : "inherit",
                            width: `${widgetsSetting.sidebarWidth}px`,
                        }}
                    >
                        {renderContent()}
                    </div>
                    <div className="QH-sidebar-shadow-admin" onClick={onToggle}>
                        &nbsp;
                    </div>
                </div>
            )}

            {type === "modal" && (
                <div className={"relative h-full"}>
                    <div className={`QH-modal-admin ${toggle ? "QH-modal-open-admin" : ""} overflow-visible`}>
                        <div className={`QH-modal-content-admin relative !overflow-visible`}
                            style={{ width: `${widgetsSetting.modalWidth}px`, height: `${widgetsSetting.modalHeight}px`, }}
                        >
                            <Button size={"icon"} onClick={onToggle} variant={"secondary"}
                                className={"w-7 h-7 rounded-full bg-white z-10 absolute -right-2 border -top-3 "}
                            >
                                <X size={18} />
                            </Button>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            )}

            {type === "embed" && (
                <div className={"p-4 xl:p-[30px] 2xl:p-[64px] h-full"}>
                    <div className={"QH-widget-embed-admin border rounded-lg overflow-hidden"}>
                        <div className={"QH-embed-admin"}>{renderContent()}</div>
                    </div>
                </div>
            )}
        </Fragment>
    );
};

export default WidgetPreview;
