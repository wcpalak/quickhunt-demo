import React, { Fragment, useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2, X } from "lucide-react";
import { Progress } from "../ui/progress";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSelector } from "react-redux";
import CommonRichTextEditor from "../Comman/CommonRichTextEditor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "../ui/collapsible"
import { DO_SPACES_ENDPOINT, darkenColor, hexToRGBA } from "../../utils/constent";
import { useToast } from "../ui/use-toast";
import Branding from "../Comman/Branding";

const checklists = ({
                        inAppMsgSetting,
                        setInAppMsgSetting,
                        selectedStep,
                        setSelectedStep,
                        selectedStepIndex,
                        setSelectedStepIndex,
                        onImageUpload,
                    }) => {
    const { toast } = useToast()
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const userDetailsReducer = allStatusAndTypes.members.find((x) => x.userId == inAppMsgSetting.from);
    const [isHovered, setIsHovered] = useState(false);
    const [checkedIndices, setCheckedIndices] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const isPolaris = inAppMsgSetting.viewType === 2;
    const editorRefs = useRef({});

    const onToggle = () => setIsOpen(prev => !prev);

    useEffect(() => {
        const applyLinkColors = () => {
            Object.keys(editorRefs.current).forEach(key => {
                const editorRef = editorRefs.current[key];
                if (editorRef && editorRef.current) {
                    try {
                        const editorInstance = editorRef.current.getInstance();
                        if (editorInstance && editorInstance.element) {
                            const links = editorInstance.element.querySelectorAll("a");
                            links.forEach((a) => {
                                a.style.color = isPolaris ? "#005bd3" : null;
                            });
                        }
                    } catch (error) {
                        console.warn(`Error applying link colors to editor ${key}:`, error);
                    }
                }
            });
        };

        applyLinkColors();

        const timeoutIds = [
            setTimeout(applyLinkColors, 100),
            setTimeout(applyLinkColors, 300),
            setTimeout(applyLinkColors, 500),
            setTimeout(applyLinkColors, 1000),
            setTimeout(applyLinkColors, 2000)
        ];

        return () => timeoutIds.forEach(id => clearTimeout(id));
    }, [isPolaris, inAppMsgSetting.checklists, selectedStepIndex]);

    const onChange = (name, value) => {
        setInAppMsgSetting({ ...inAppMsgSetting, [name]: value });
    };

    const onSelectChecklists = (i, obj) => {
        setSelectedStep(obj)
        setSelectedStepIndex(i)
    }

    const updateStepRecord = (record) => {
        let clone = [...inAppMsgSetting.checklists];
        clone[selectedStepIndex] = record;
        setInAppMsgSetting({ ...inAppMsgSetting, checklists: clone });
    }

    const isDuplicateTitle = (title, currentIndex) => {
        const activeSteps = inAppMsgSetting.checklists;
        return activeSteps.some((step, index) =>
            index !== currentIndex &&
            step.title.trim().toLowerCase() === title.trim().toLowerCase()
        );
    };

    const onChangeChecklists = (name, value, record) => {
        if (name === "title") {
            if (value.trim() && isDuplicateTitle(value, selectedStepIndex)) {
                toast({
                    variant: "destructive",
                    description: "Step title already exists. Please use a unique title."
                });
                return;
            }
        }

        const obj = { ...record, [name]: value };
        setSelectedStep(obj);
        updateStepRecord(obj);
    };

    const handleAddStep = () => {
        let clone = [...inAppMsgSetting.checklists];
        const stepBoj = {
            title: "",
            description: '',
            actionType: 0,
            actionText: "Open",
            actionUrl: "",
            isRedirect: false,
            checklistId: ""
        };
        clone.push(stepBoj);
        setSelectedStep(stepBoj);
        setSelectedStepIndex(clone.length - 1);
        setInAppMsgSetting(prevState => ({
            ...prevState,
            checklists: clone
        }));
    };

    const onDeleteStep = (record, index) => {
        const clone = [...inAppMsgSetting.checklists];
        clone.splice(index, 1);
        setInAppMsgSetting(prevState => ({
            ...prevState,
            checklists: clone
        }));
        if (clone.length > 0) {
            const newIndex = index > 0 ? index - 1 : 0;
            setSelectedStep({ ...clone[newIndex] });
            setSelectedStepIndex(newIndex);
        } else {
            setSelectedStep(null);
            setSelectedStepIndex(null);
        }
    };


    const handleEditorChange = (id, newData) => {
        setInAppMsgSetting((prev) => ({
            ...prev,
            checklists: prev.checklists.map((x, i) => {
                if (i === id) {
                    return { ...x, description: newData };
                }
                return { ...x };
            }),
        }));
        
        // Apply link colors after editor content changes
        setTimeout(() => {
            const editorRef = editorRefs.current[`editor-${id}`];
            if (editorRef && editorRef.current) {
                try {
                    const editorInstance = editorRef.current.getInstance();
                    if (editorInstance && editorInstance.element) {
                        const links = editorInstance.element.querySelectorAll("a");
                        links.forEach((a) => {
                            a.style.color = isPolaris ? "#005bd3" : null;
                        });
                    }
                } catch (error) {
                    console.warn(`Error applying link colors to editor ${id}:`, error);
                }
            }
        }, 100);
    };


    const activeChecklists = (inAppMsgSetting?.checklists || []);
    const progress = (checkedIndices.length / activeChecklists.length) * 100;

    return (
        // <div className={`py-16 pb-0 px-[5px] md:px-0 bg-muted overflow-y-hidden h-[calc(100%_-_94px)] flex flex-col`}>
        <div className={`py-12 pb-0 px-[5px] md:px-0 bg-muted overflow-y-hidden h-[calc(100%_-_45px)] flex flex-col`}>
            <div className={"overflow-y-auto h-full"}>
                {isOpen && (
                // <div className={`max-w-[450px] mx-auto w-full rounded-[10px] pt-4 pb-6 relative max-h-[500px] overflow-y-auto`} style={{ backgroundColor: inAppMsgSetting.bgColor }}>
                <div className={`max-w-[450px] mx-auto w-full !pt-4 !pb-6 relative ${isPolaris ? "SC-Polaris-Box !px-0" : "rounded-[10px]"}`} 
                style={{ backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor }}>
                    {
                        inAppMsgSetting.isCloseButton &&
                        <Button size={'icon'} className={'w-8 h-8 absolute right-2 top-2'}
                                style={{
                                    backgroundColor: isPolaris ? '#f7f7f7' : isHovered ? darkenColor(inAppMsgSetting?.bgColor, 8) : darkenColor(inAppMsgSetting?.bgColor, 4),
                                }}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                        >
                            <X size={16} stroke={ isPolaris ? '#000' : inAppMsgSetting?.textColor} />
                        </Button>
                    }
                    <div className={"flex justify-between items-center px-11 gap-2"}>
                        <Input placeholder={"checklists title"}
                               value={inAppMsgSetting.checklistTitle || ''}
                               style={{ backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor, color: isPolaris ? null : inAppMsgSetting.textColor }}
                               onChange={(event) => onChange("checklistTitle", event.target.value)}
                               className={"w-full text-center border-none p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0 text-xl font-normal"}
                        />
                    </div>
                    <div className={"flex flex-col justify-between items-center px-4 mt-3 gap-3"}>
                        <Input placeholder={"checklists description (optional)"}
                               value={inAppMsgSetting.checklistDescription || ''}
                               style={{ backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor, color: isPolaris ? null : inAppMsgSetting.textColor }}
                               onChange={(event) => onChange("checklistDescription", event.target.value)}
                               className={"w-full text-center text-sm border-none p-0 h-auto focus-visible:ring-offset-0 focus-visible:ring-0 font-normal"}
                        />
                        {projectDetailsReducer.plan === 0 ? null :
                            inAppMsgSetting.showSender && inAppMsgSetting.from ? <div className={"pt-0 flex flex-row gap-2 items-center"}>
                                <Avatar className={"min-w-5 w-5 h-5"}>
                                    <AvatarImage src={userDetailsReducer?.profileImage ? `${DO_SPACES_ENDPOINT}/${userDetailsReducer?.profileImage}` : null}
                                                 alt={`${userDetailsReducer?.firstName}${userDetailsReducer?.lastName}`} />
                                    <AvatarFallback className={`text-xs`} style={{ color: isPolaris ? null : inAppMsgSetting.textColor }}>
                                        {userDetailsReducer?.firstName?.substring(0, 1)}{userDetailsReducer?.lastName?.substring(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={"flex flex-row gap-1"}>
                                    <h5 className={`text-sm font-normal text-muted-foreground`}
                                        style={{ color: isPolaris ? '#000' : inAppMsgSetting.textColor }}>{userDetailsReducer?.firstName} {userDetailsReducer?.lastName}</h5>
                                    <h5 className={`text-sm font-normal text-muted-foreground`}
                                        style={{ color: isPolaris ? '#000' : inAppMsgSetting.textColor }}><span className={'text-muted-foreground'} style={{color: isPolaris ? '#00000080' : hexToRGBA(inAppMsgSetting.textColor, 0.5)}}>from</span> {projectDetailsReducer?.name}</h5>
                                </div>
                            </div> : ""
                        }
                    </div>

                    <div className={"px-6 pt-8"}>

                        {
                            inAppMsgSetting.isShowProgress ?
                                <Fragment>
                                    <div className={"flex justify-between"}>
                                        <h5 className={`text-sm font-normal text-muted-foreground`}
                                            style={{color: isPolaris ? '#000' : inAppMsgSetting.textColor}}>{(inAppMsgSetting?.checklists || []).length} steps</h5>
                                        <h5 className={`text-sm font-normal text-muted-foreground`}
                                            style={{color: isPolaris ? '#000' : inAppMsgSetting.textColor}}>{checkedIndices.length} {' '} of {(inAppMsgSetting?.checklists || []).length} step</h5>
                                    </div>
                                    <Progress value={progress} progressColor={checkedIndices.length ? isPolaris ? '#000' : inAppMsgSetting.progressColor : undefined}
                                              className={`w-full mt-[6px] mb-3 h-2`} classNameInd={`bg-secondary`} />
                                </Fragment> : ""
                        }

                        <Card className={"rounded-[10px] gap-4 px-4 pb-6 pt-4 flex flex-col"}>
                            {
                                (inAppMsgSetting?.checklists || []).map((x, i) => {
                                    return (
                                        <Collapsible key={i} open={i === selectedStepIndex}
                                                     style={{ borderColor: i === selectedStepIndex ? `${isPolaris ? '#000' : inAppMsgSetting.activeColor}` : "" }}
                                                     className={`p-4 text-sm w-full border rounded-md ${i === selectedStepIndex ? "border border-solid" : ""}`}>
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center w-full">
                                                    <Checkbox
                                                        checked={checkedIndices.includes(i)} className={"w-6 h-6"}
                                                        onCheckedChange={(checked) => {
                                                            setCheckedIndices(prev => checked ? [...prev, i] : prev.filter(index => index !== i));
                                                        }}
                                                        style={{
                                                            backgroundColor: checkedIndices.includes(i) ? isPolaris ? '#000' : inAppMsgSetting.activeColor : undefined,
                                                            borderColor: isPolaris ? '#000' : inAppMsgSetting.activeColor
                                                        }}
                                                    />

                                                    <Input placeholder={"Step title"}
                                                           value={x.title}
                                                           onClick={() => onSelectChecklists(i, x)}
                                                           onChange={(e) => {
                                                               e.stopPropagation()
                                                               onChangeChecklists("title", e.target.value, x);
                                                           }}
                                                           className={"w-full ext-sm border-none py-[10px] h-auto focus-visible:ring-offset-0 focus-visible:ring-0 font-normal pr-5"}
                                                    />
                                                    {
                                                        i === selectedStepIndex ? <Trash2 size={18}
                                                                                          className={`cursor-pointer min-w-5 ${activeChecklists.length <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                                                                                          onClick={activeChecklists.length <= 1 ? undefined : () => onDeleteStep(x, i)}
                                                            /> :
                                                            <ChevronDown size={20} onClick={() => onSelectChecklists(i, x)} className={"cursor-pointer min-w-5"} />
                                                    }
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <div className={"ml-9 checklist"}>
                                                    <CommonRichTextEditor
                                                        ref={(el) => {
                                                            if (el) {
                                                                editorRefs.current[`editor-${i}`] = el;
                                                                // Apply link colors when editor is mounted
                                                                setTimeout(() => {
                                                                    try {
                                                                        const editorInstance = el.getInstance();
                                                                        if (editorInstance && editorInstance.element) {
                                                                            const links = editorInstance.element.querySelectorAll("a");
                                                                            links.forEach((a) => {
                                                                                a.style.color = isPolaris ? "#005bd3" : null;
                                                                            });
                                                                        }
                                                                    } catch (error) {
                                                                        console.warn(`Error applying link colors to mounted editor ${i}:`, error);
                                                                    }
                                                                }, 50);
                                                            }
                                                        }}
                                                        value={x.description}
                                                        onChange={(newData) => handleEditorChange(i, newData)}
                                                        onImageUpload={onImageUpload}
                                                        placeholder="Write your description… use / for commands"
                                                        enableImageUpload={true}
                                                        enableVideoUpload={false}
                                                        enableFileUpload={false}
                                                        moduleName="checklist"
                                                        uploadFolder="post"
                                                        isImageShow
                                                    />

                                                    {selectedStep?.actionType === 1 &&
                                                     <Button style={{
                                                        backgroundColor: isPolaris ? null : inAppMsgSetting.btnColor,
                                                        color: isPolaris ? null : inAppMsgSetting.btnTextColor
                                                    }} className={`mt-2 whitespace-normal max-w-max min-h-9 h-auto ${isPolaris ? "SC-Polaris-Button SC-Primary" : ""}`}>{selectedStep?.actionText}
                                                    </Button>}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )
                                })
                            }
                        </Card>
                        {
                            inAppMsgSetting.isDismiss &&
                            <div className={'flex justify-end'}>
                                <Button className={`${isPolaris ? "hover:underline text-[#005bd3] hover:text-[#004299] text-[13px]" : "text-gray-500 underline"}`} style={{ color: isPolaris ? null : inAppMsgSetting.textColor }} variant={"link"}>Dismiss it</Button>
                            </div>
                        }
                        <Button className={"hover:bg-primary w-full mt-3"} onClick={handleAddStep}>Add Step</Button>


                    </div>
                    <Branding className={'py-1 max-w-full text-center rounded-bl-lg border mt-5 rounded-br-lg -mb-6'} isPolaris={isPolaris} />
                </div>
                )}
            </div>
            <div className="flex m-4">
            <Button
                className={`${inAppMsgSetting?.isTriggerIcon ? "!w-[60px] !h-[60px]" : "h-10"} rounded-full ${isPolaris ? "bg-black hover:bg-black" : ""}`}
                onClick={onToggle}
            >
                {inAppMsgSetting?.isTriggerIcon === false ? (
                    inAppMsgSetting?.triggerText
                ) : (
                    <svg fill="#fff" width="20" height="20" viewBox="0 0 32 32">
                        <path
                            d="m6.98592 18.5024h7.60558l-4.014 10.8001c-.5212 1.4026.9155 2.132 1.845.9959l12.2254-15.1623c.2394-.2946.3521-.5611.3521-.8696 0-.519-.3944-.9117-.9718-.9117h-7.6057l4.0141-10.80017c.5211-1.40262-.9296-2.131982-1.8451-.99586l-12.2253 15.16233c-.23944.2945-.3662.561-.3662.8696 0 .5189.40845.9117.98592.9117z"
                            fill="#FFFFFF"
                        />
                    </svg>
                )}
            </Button>
            </div>
        </div>
    );
};

export default checklists;