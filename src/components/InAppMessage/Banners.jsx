import React, {useEffect, useRef, useState} from 'react';
import { Plus, Trash2, X, ChevronRight } from "lucide-react";
import { Input } from "../ui/input";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent } from "../ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Button } from "../ui/button";
import EmojiPicker from "emoji-picker-react";
import {DO_SPACES_ENDPOINT, hexToRGBA} from "../../utils/constent";
import Branding from "../Comman/Branding";

const Banners = ({ inAppMsgSetting, setInAppMsgSetting }) => {
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const userDetailsReducer = allStatusAndTypes.members.find((x) => x.userId == inAppMsgSetting.from);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const textareaRef = useRef(null);
    const textRef = useRef(null);
    const isPolaris = inAppMsgSetting.viewType === 2;

    const onChange = (name, value) => {
        setInAppMsgSetting(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [inAppMsgSetting.bodyText]);

    const handleEmojiSelect = (event) => {
        const clone = [...inAppMsgSetting.reactions];
        if (clone?.filter(r => r.isActive)?.length >= 5) return;
        const obj = {
            id: "",
            emoji: event.emoji,
            emojiUrl: event.imageUrl,
            isActive: true,
        };
        clone.push(obj);
        setInAppMsgSetting(prevState => ({
            ...prevState,
            reactions: clone,
        }));
    };

    const onDeleteReaction = (record, index) => {
        let clone = [...inAppMsgSetting.reactions];
        if (record.id) {
            clone[index] = { ...record, isActive: false };
        } else {
            clone.splice(index, 1);
        }
        setInAppMsgSetting(prevState => ({ ...prevState, reactions: clone }));
    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const handleInput = (e) => {
        if (textRef.current) {
            const text = textRef.current.innerText.replace(/\n/g, '');
            onChange("bodyText", text);

            if (textRef.current.innerText !== text) {
                textRef.current.innerText = text;

                const range = document.createRange();
                range.selectNodeContents(textRef.current);
                range.collapse(false);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    };

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const selection = window.getSelection();
        let range = null;
        let startOffset = 0;
        let startContainer = el;
        let endOffset = 0;
        let endContainer = el;

        if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            startOffset = range.startOffset;
            startContainer = range.startContainer;
            endOffset = range.endOffset;
            endContainer = range.endContainer;
        }

        if (el.innerText !== inAppMsgSetting.bodyText) {
            el.innerText = inAppMsgSetting.bodyText || "";

            try {
                if (range && selection) {
                    const newRange = document.createRange();
                    if (document.contains(startContainer) && document.contains(endContainer)) {
                        newRange.setStart(startContainer, Math.min(startOffset, startContainer.length));
                        newRange.setEnd(endContainer, Math.min(endOffset, endContainer.length));

                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        return;
                    }
                }

                const newRange = document.createRange();
                newRange.selectNodeContents(el);
                newRange.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(newRange);
            } catch (e) {
                console.error("Error restoring cursor position:", e);
            }
        }
    }, [inAppMsgSetting.bodyText]);

    return (
        <div
            className={"relative bg-muted px-[5px] md:px-16 flex flex-col gap-4 py-8 bg-muted justify-start overflow-y-auto h-[calc(100%_-_94px)]"}
        >
            <div className={`absolute w-full max-w-full overflow-x-hidden ${inAppMsgSetting.position === "bottom" ? "bottom-0" : "top-0"} left-0`}
                 style={{ backgroundColor: isPolaris ? '#fff' : inAppMsgSetting.bgColor }}
            >
                <div className={`max-w-[1008px] m-auto`}>
                    {projectDetailsReducer.plan === 0 ? null :
                        (inAppMsgSetting.showSender && inAppMsgSetting.from) ?
                            <div className={"flex gap-2 items-center flex-wrap p-4 pb-0"} style={{justifyContent: inAppMsgSetting.alignment}}>
                                <Avatar className={"w-5 h-5 min-w-5"}>
                                    <AvatarImage src={userDetailsReducer?.profileImage ? `${DO_SPACES_ENDPOINT}/${userDetailsReducer?.profileImage}` : null}
                                                 alt={`${userDetailsReducer?.firstName}${userDetailsReducer?.lastName}`}/>
                                    <AvatarFallback
                                        className={`text-sm font-medium`} style={{color: isPolaris ? null : inAppMsgSetting.textColor}}>
                                        {userDetailsReducer?.firstName?.substring(0, 1)?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={"flex flex-wrap gap-x-1"}>
                                    <h5 className={"text-sm font-medium"} style={{color: isPolaris ? null : inAppMsgSetting.textColor}}>{userDetailsReducer?.firstName} {userDetailsReducer?.lastName} <span className={'text-muted-foreground font-normal'} style={{color: hexToRGBA(isPolaris ? '#000' : inAppMsgSetting.textColor, 0.5)}}>from</span></h5>
                                    <h5 className={`text-sm font-medium`} style={{color: isPolaris ? null : inAppMsgSetting.textColor}}> {projectDetailsReducer?.name}</h5>
                                </div>
                            </div>: ""
                    }

                    <div className={`p-4`}>
                        <div
                            className={`flex flex-wrap items-center gap-2 w-full ${inAppMsgSetting.alignment === "left" ? "justify-start" : inAppMsgSetting.alignment === "right" ? "justify-end" : inAppMsgSetting.alignment === "center" ? "justify-center" : "justify-start"}`}
                        >
                            <div
                                ref={textRef} id={'bannerInput'}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleInput}
                                onKeyDown={handleKeyDown}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = e.clipboardData.getData('text/plain');
                                    document.execCommand('insertText', false, text);
                                }}
                                className={`text-[16px] border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none relative`}
                                style={{
                                    backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor,
                                    color: isPolaris ? null : inAppMsgSetting.textColor,
                                    textAlign: inAppMsgSetting.alignment,
                                    minWidth: "150px",
                                    '--banner-placeholder-color': hexToRGBA(isPolaris ? '#000' : inAppMsgSetting.textColor, 0.5),
                                }}
                                data-placeholder="Your message..."
                                data-empty={!inAppMsgSetting.bodyText}
                            />

                            {inAppMsgSetting.actionType == 1 && (
                                <a
                                    className={`text-sm font-medium underline cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary"}`}
                                    style={{ color: isPolaris ? null : inAppMsgSetting.textColor }}
                                >
                                    {inAppMsgSetting.actionText}
                                </a>
                            )}

                            {inAppMsgSetting.actionType == 2 && (
                                <div className={`flex gap-3 flex-wrap`}>
                                    {(inAppMsgSetting.reactions || []).map((x, i) =>
                                        x.isActive ? (
                                            <div className={"relative group hover:cursor-pointer"} key={i}>
                                                {(inAppMsgSetting.reactions.filter(r => r.isActive).length > 1) && (
                                                    <span
                                                        onClick={() => onDeleteReaction(x, i)}
                                                        className="absolute hidden group-hover:inline-block py-0.5 leading-none right-[-11px] top-[-13px] border rounded shadow -top-1 text-[9px] font-medium tracking-wide px-0.5 text-background-accent bg-white"
                                                    >
                                                    <Trash2 size={16} />
                                                </span>
                                                )}
                                                <img className={"h-6 w-6 cursor-pointer"} src={x.emojiUrl} />
                                            </div>
                                        ) : null
                                    )}

                                    {
                                        inAppMsgSetting?.reactions?.filter(r => r.isActive)?.length < 5 &&
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"secondary"} className={"h-6 w-6 rounded-full p-1"}>
                                                    <Plus size={16} />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0 border-none w-[310px]">
                                                <EmojiPicker
                                                    theme={"light"}
                                                    height={350}
                                                    autoFocusSearch={true}
                                                    open={true}
                                                    skinTonesDisabled={true}
                                                    searchDisabled={false}
                                                    onEmojiClick={handleEmojiSelect}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    }
                                </div>
                            )}
                            {inAppMsgSetting.actionType == 3 && (
                                <div className={"relative max-w-[268px] w-full"}>
                                    <Input
                                        placeholder={"john@example.com"}
                                        autoFocus id={'bannerInput'}
                                        readOnly
                                        className={"max-w-[268px] w-full h-9 py-1 px-3 focus-visible:ring-offset-0 focus-visible:ring-0"}
                                        style={{
                                            backgroundColor: isPolaris ? null : inAppMsgSetting.bgColor,
                                            color: isPolaris ? null : inAppMsgSetting.textColor,
                                            borderColor: isPolaris ? null : inAppMsgSetting.textColor,
                                            '--banner-placeholder-color': hexToRGBA(isPolaris ? '#000' : inAppMsgSetting.textColor, 0.5),
                                        }}
                                    />
                                    <Button variant={"ghost hover:none"} className={"absolute top-[4px] right-0 py-0 px-3 h-7"}>
                                        <ChevronRight size={16} color={isPolaris ? '#000' : inAppMsgSetting.textColor} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {inAppMsgSetting.isCloseButton ? <X size={16} stroke={isPolaris ? '#000' : inAppMsgSetting?.btnColor} className={'cursor-pointer absolute right-[10px] top-[10px]'} /> : null}
                <Branding className={'py-1 max-w-max -mt-2'} isPolaris={isPolaris}/>
            </div>
        </div>
    );
};

export default Banners;