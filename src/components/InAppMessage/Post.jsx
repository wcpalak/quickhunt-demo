import React, { useRef, useEffect, useCallback, useState, Fragment } from 'react';
import { useSelector } from "react-redux";
import { Button } from "../ui/button";
import { MessageCircleMore, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import EmojiPicker from "emoji-picker-react";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "../ui/popover";
import { DO_SPACES_ENDPOINT, hexToRGBA } from "../../utils/constent";
import Branding from "../Comman/Branding";
import { Icon } from "../../utils/Icon";
import CommonRichTextEditor from '../Comman/CommonRichTextEditor';

const Post = ({ inAppMsgSetting, setInAppMsgSetting, isLoading, onImageUpload }) => {
    const editorRef = useRef(null);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const userDetailsReducer = allStatusAndTypes.members.find((x) => x.userId == inAppMsgSetting.from);
    const [isReplyBox, setIsReplyBox] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const isPolaris = inAppMsgSetting.viewType === 2;

    const handleEditorChange = useCallback((content) => {
        setEditorContent(content);
        setInAppMsgSetting(prevState => ({
            ...prevState,
            bodyText: content
        }));
    }, [setInAppMsgSetting]);

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
            clone[index] = { ...record, isActive: false }
        } else {
            clone.splice(index, 1)
        }
        setInAppMsgSetting(prevState => ({
            ...prevState,
            reactions: clone
        }));
    }

    useEffect(() => {
        if (!isLoading && inAppMsgSetting?.bodyText) {
            setEditorContent(inAppMsgSetting.bodyText);
        }
    }, [isLoading, inAppMsgSetting?.bodyText]);

    useEffect(() => {
        if (editorRef.current) {
            const editorInstance = editorRef.current.getInstance();
            if (editorInstance && editorInstance.element) {
                editorInstance.element
                    .querySelectorAll("a")
                    .forEach((a) => {
                        a.style.color = isPolaris ? "#005bd3" : null;
                    });
            }
        }
    }, [isPolaris, editorContent]); 

    return (
        <div
            id="post-scroll-container"
            className={`p-4 md:px-6 md:py-8 flex flex-col gap-4 bg-muted justify-start overflow-y-scroll h-[calc(100%_-_94px)]`}>
            <Card className={`m-auto max-w-full relative ${isPolaris ? "SC-Polaris-Box !p-[1px]" : "rounded-[10px] p-0"}`} style={{ width: `${inAppMsgSetting?.width}px` }}>
                <CardHeader className={"px-4 pt-4 pb-0 space-y-0"}>
                    <Button className={`h-4 w-4 p-0 text-muted-foreground absolute right-2 top-2`}
                        variant={"ghost hover:none"}><X size={16} stroke={isPolaris ? '#000' : inAppMsgSetting?.textColor} className={"h-5 w-5"} />
                    </Button>

                    {projectDetailsReducer.plan === 0 ? null :
                        (inAppMsgSetting.showSender && inAppMsgSetting.from) ?
                            <div className={"flex gap-2 items-center flex-wrap"}>
                                <Avatar className={"w-5 h-5 min-w-5"}>
                                    <AvatarImage src={userDetailsReducer?.profileImage ? `${DO_SPACES_ENDPOINT}/${userDetailsReducer?.profileImage}` : null}
                                        alt={`${userDetailsReducer?.firstName}${userDetailsReducer?.lastName}`} />
                                    <AvatarFallback
                                        className={`text-sm font-medium`}>
                                        {userDetailsReducer?.firstName?.substring(0, 1)?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={"flex flex-wrap gap-x-1"}>
                                    <h5 className={"text-sm font-medium"}>{userDetailsReducer?.firstName} {userDetailsReducer?.lastName} <span className={'text-muted-foreground font-normal'}>from</span></h5>
                                    <h5 className={`text-sm font-medium`}> {projectDetailsReducer?.name}</h5>
                                </div>
                            </div> : ""
                    }
                </CardHeader>
                <CardContent className={"p-4 min-h-[200px]"}>
                    {!isLoading && (
                        <CommonRichTextEditor
                            ref={editorRef}
                            value={editorContent}
                            onChange={handleEditorChange}
                            onImageUpload={onImageUpload}
                            placeholder="Write your description… use / for commands"
                            uploadFolder="post"
                            moduleName="post"
                            enableImageUpload={true}
                            enableVideoUpload={true}
                            enableFileUpload={true}
                            scrollContainerId="post-scroll-container"
                            scrollAlignMode="top"
                        />
                    )}
                </CardContent>
                {
                    inAppMsgSetting.replyType === 1 ?
                        <CardContent className={`p-0 relative rounded-bl-xl rounded-br-xl ${isPolaris ? "border-t" : ""} ${!isReplyBox ? "cursor-pointer" : ""}`}
                         style={{ background: isPolaris ? '#f7f7f7' : inAppMsgSetting.bgColor }} onClick={() => !isReplyBox ? setIsReplyBox(isReplyBox => !isReplyBox) : null}>
                            <div className={`${!isReplyBox ? "py-[10px] px-4" : "p-4"} flex flex-row justify-between`}>
                                {
                                    isReplyBox ?
                                        <Fragment>
                                            <div className="w-full">
                                                <button onClick={() => setIsReplyBox(false)}
                                                    className="inline-flex items-center z-10 justify-center ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground absolute top-0.5 right-0.5">
                                                    <svg viewBox="0 0 24 24" fill="none"
                                                        stroke={isPolaris ? '#000' : inAppMsgSetting?.textColor}
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="lucide lucide-x h-[16px] w-[16px]">
                                                        <path d="M18 6 6 18" />
                                                        <path d="m6 6 12 12" />
                                                    </svg>
                                                </button>
                                                <textarea id="textAreaPost"
                                                    style={{
                                                        color: isPolaris ? '#000' : inAppMsgSetting.textColor,
                                                        borderColor: hexToRGBA(isPolaris ? '#000' : inAppMsgSetting.textColor, 0.2),
                                                        '--placeholder-color': hexToRGBA(isPolaris ? '#000' : inAppMsgSetting.textColor, 0.4),
                                                    }}
                                                    placeholder="Type your message here..." rows="3"
                                                    readOnly
                                                    className="resize-none px-3 py-1.5 m-0 text-sm rounded border bg-transparent inset-0 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none w-full" />
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className={'flex gap-1'}>
                                                        <div className="w-[30px] h-[30px] flex items-center justify-center cursor-pointer">
                                                            <svg width="16" height="16"
                                                                viewBox="0 0 24 24" fill="none"
                                                                stroke={isPolaris ? '#000' : inAppMsgSetting.textColor}
                                                                strokeWidth="2" strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="lucide lucide-paperclip">
                                                                <path
                                                                    d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                            </svg>
                                                        </div>
                                                        <div
                                                            className="relative w-[30px] h-[30px] flex items-center justify-center cursor-pointer">
                                                            <svg width="16" height="16" viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke={isPolaris ? '#000' : inAppMsgSetting.textColor}
                                                                strokeWidth="2" strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="lucide lucide-smile">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                                                <line x1="9" x2="9.01" y1="9" y2="9" />
                                                                <line x1="15" x2="15.01" y1="9" y2="9" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        style={{
                                                            backgroundColor: isPolaris ? null : inAppMsgSetting.textColor,
                                                            color: isPolaris ? null : inAppMsgSetting.bgColor,
                                                        }}
                                                        className={`focus:ring-4 focus:outline-none focus:ring-blue-300 ${isPolaris ? "SC-Polaris-Button SC-Primary" : "px-3 py-2 text-xs font-medium rounded-lg"}`}>
                                                        Post
                                                    </button>
                                                </div>
                                            </div>
                                        </Fragment> :
                                        <Fragment>
                                            <div className={"flex flex-row gap-3 items-center"}>
                                                <MessageCircleMore size={20} stroke={isPolaris ? '#000' : inAppMsgSetting?.textColor} />
                                                <h5 className={"font-normal text-sm"} style={{ color: isPolaris ? null : inAppMsgSetting.textColor }}>Write a reply...</h5>
                                            </div>
                                            <div
                                                className={`w-9 h-9 flex items-center justify-center`} style={{ color: isPolaris ? '#000' : inAppMsgSetting.textColor }}>
                                                {Icon.arrowLeft}
                                            </div>
                                        </Fragment>
                                }
                            </div>
                            <Branding className={'py-1 max-w-full text-center rounded-bl-lg rounded-br-lg'} isPolaris={isPolaris} />
                        </CardContent> : inAppMsgSetting.replyType === 2 ?
                            <CardContent className={`p-0 rounded-bl-xl rounded-br-xl ${isPolaris ? "border-t" : ""}`}
                                style={{ background: isPolaris ? '#f7f7f7' : inAppMsgSetting.bgColor }}>
                                <div className={'p-4'}>
                                    <div className={"flex justify-center flex-wrap gap-5 w-full"}>
                                        {
                                            (inAppMsgSetting.reactions || []).map((x, i) => {
                                                return (
                                                    x.isActive ?
                                                        <div className={"relative group hover:cursor-pointer"} key={i}>
                                                            {(inAppMsgSetting.reactions.filter(r => r.isActive).length > 1) && (
                                                                <span
                                                                    onClick={() => onDeleteReaction(x, i)}
                                                                    className="absolute hidden group-hover:inline-block py-0.5 leading-none right-[-11px] top-[-13px] border rounded shadow -top-1 text-[9px] font-medium tracking-wide px-0.5 text-background-accent bg-white"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </span>
                                                            )}
                                                            <img className={"h-6 w-6 cursor-pointer"} src={x.emojiUrl} alt={x.emoji} />
                                                        </div> : null
                                                )
                                            })
                                        }
                                        {
                                            inAppMsgSetting?.reactions?.filter(r => r.isActive)?.length < 5 &&
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"secondary"} className={"h-6 w-6 rounded-[100%] p-1"}><Plus size={16} /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0 border-none w-[310px]">
                                                    <EmojiPicker theme={"light"} height={350} skinTonesDisabled={true}
                                                        autoFocusSearch={true} open={true} searchDisabled={false}
                                                        onEmojiClick={handleEmojiSelect} />
                                                </PopoverContent>
                                            </Popover>
                                        }
                                    </div>
                                </div>
                                <Branding className={'py-1 max-w-full text-center rounded-bl-lg rounded-br-lg'} isPolaris={isPolaris} />
                            </CardContent> : ""
                }
                {(inAppMsgSetting.replyType !== 1 && inAppMsgSetting.replyType !== 2) && <Branding className={'py-1 max-w-full text-center rounded-bl-lg rounded-br-lg'} isPolaris={isPolaris} />}
            </Card>
        </div>
    );
};

export default Post;