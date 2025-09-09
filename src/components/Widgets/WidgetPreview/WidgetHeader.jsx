import React, {Fragment, useState} from "react";
import {useSelector} from "react-redux";
import {Button} from "../../ui/button";
import {DO_SPACES_ENDPOINT} from "../../../utils/constent";
import {X} from "lucide-react";
import {useParams} from "react-router-dom";

const WidgetHeader = ({widgetsSetting, onRedirect, onToggle, navList, isPolaris}) => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const {type} = useParams();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const buttonAuth = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <div className={`gap-2 flex`}>
                    {widgetsSetting?.hideHeader ? null : (<Fragment>
                            <Button size={"xs"} variant={"outline"}
                                    className={`${isPolaris ? "SC-Polaris-Button SC-Secondary" : `rounded-[9px]`}`}
                                    style={isPolaris ? {} : {borderColor: widgetsSetting?.headerBtnBackgroundColor, color: widgetsSetting?.headerBtnBackgroundColor,}}
                            >
                                Sign in
                            </Button>
                            <Button size={"xs"}
                                    className={`${isPolaris ? "SC-Polaris-Button SC-Primary" : `rounded-[9px]`}`}
                                    style={isPolaris ? {} : {backgroundColor: widgetsSetting?.headerBtnBackgroundColor, color: widgetsSetting?.headerBtnTextColor,}}
                            >
                                Sign up
                            </Button>
                        </Fragment>
                    )}
                </div>
            </div>
        );
    };

    const bothCheck = (widgetsSetting?.hideHeader && navList.filter(x => x.isCheck).length === 1)

    return (
        <header className={`${bothCheck ? "" : 'border-b border-slate-200'} `} style={{backgroundColor: isPolaris ? "#ffffff" : widgetsSetting.headerBgColor}}>
            <div className={"px-3 h-full"}>
                {type === "sidebar" && (
                    <Button size={"icon"} onClick={onToggle} variant={"secondary"}
                        className={"w-[20px] h-[20px] absolute right-[5px] top-[5px]"}
                    >
                        <X size={15}/>
                    </Button>
                )}

                {
                    bothCheck ? null :
                        <div className={`flex justify-between items-start h-full ${navList.filter(x => x.isCheck).length > 1 ? "pt-3" : "py-3"}`}>
                            <div className="flex flex-col gap-5 h-full w-full">
                                {widgetsSetting?.hideHeader ? ("") : (
                                    <div className={"flex justify-between items-center gap-1"}>
                                        {projectDetailsReducer && projectDetailsReducer?.logo ? (
                                            <img alt={projectDetailsReducer?.name} className="max-h-10"
                                                src={`${DO_SPACES_ENDPOINT}/${projectDetailsReducer.logo}`}
                                            />
                                        ) : (
                                            <span
                                                className="text-3xl font-medium tracking-tight transition-colors max-w-max truncate"
                                                style={isPolaris ? {} : {color: widgetsSetting.headerProjectTitleColor}}>
                                                {projectDetailsReducer?.name || ""}
                                            </span>
                                        )}
                                        <div>{buttonAuth()}</div>
                                    </div>
                                )}
                                {
                                    navList.filter(x => x.isCheck).length > 1 &&
                                    <div className="h-full overflow-x-auto overflow-y-hidden">
                                        <ul className={`mb-b-1 flex items-center gap-5 h-full min-h-[31px]`}>
                                            {(navList || []).map((x, i) => {
                                                const isHovered = hoveredIndex === i;

                                                const textColor = x.selected || isHovered
                                                    ? isPolaris ? "#303030" : widgetsSetting?.headerActiveTabColor
                                                    : isPolaris ? "#1a1a1a" : widgetsSetting?.headerTextColor;

                                                const underlineColor = x.selected || isHovered
                                                    ? isPolaris ? "#303030" : widgetsSetting?.headerActiveTabColor
                                                    : "transparent";

                                                if (x.isCheck) {
                                                    return (
                                                        <li key={`Nav_${i}`} className="h-full flex items-center">
                                                            <button
                                                                onClick={() => onRedirect(x.link, x.isRedirect)}
                                                                onMouseEnter={() => setHoveredIndex(i)}
                                                                onMouseLeave={() => setHoveredIndex(null)}
                                                                style={{color: textColor}}
                                                                className={`text-sm relative h-full flex items-center transition-all duration-200 group`}
                                                            >
                                                                <span className={"max-w-[120px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}>{x.title}</span>
                                                                <span
                                                                    className={`absolute left-0 bottom-0 h-[1.8px] transition-all duration-300`}
                                                                    style={{
                                                                        width: x.selected || isHovered ? '100%' : '0%',
                                                                        backgroundColor: underlineColor,
                                                                    }}
                                                                />
                                                            </button>
                                                        </li>
                                                    );
                                                }
                                            })}
                                        </ul>
                                    </div>
                                }
                            </div>
                        </div>
                }
            </div>
        </header>
    );
};

export default WidgetHeader;
