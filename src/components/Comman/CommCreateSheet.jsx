import React, { useState, Fragment, useRef, useEffect, useCallback } from 'react';
import { Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Label } from "../ui/label";
import ReactQuillEditor from "./ReactQuillEditor";
import { Input } from "../ui/input";
import { CommandList, CommandItem, CommandInput, CommandGroup, CommandEmpty, Command } from "../ui/command";
import { PopoverContent, PopoverTrigger, Popover } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Icon } from "../../utils/Icon";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { apiService, baseUrl, slackIntImg, gitHubIntImg, zapierIntImg, HubSpotImg } from '../../utils/constent';
import {
    setCreateSheetFormState,
    setCreateSheetSimilarIdeas,
    clearCreateSheetState
} from '../../redux/action/CreateSheetAction';

const CommCreateSheet = ({
    isOpen,
    onOpen,
    onCancel,
    ideaDetail,
    handleChange,
    topicLists,
    allStatusAndTypes,
    formError,
    isLoading,
    onCreateIdea,
    setIdeaDetail,
    setFormError,
    formValidate,
    setImageSizeError,
    imageSizeError,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const similarIdeasPopupRef = useRef(null);
    const createSheetState = useSelector(state => state.createSheet);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [similarIdeas, setSimilarIdeas] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [openTopics, setOpenTopics] = useState(false);
    const [openBoardPopover, setOpenBoardPopover] = useState(false);
    const [isLoadingSimilarIdeas, setIsLoadingSimilarIdeas] = useState(false);
    const [showAllSimilarIdeas, setShowAllSimilarIdeas] = useState(false);
    const [showSimilarIdeasPopup, setShowSimilarIdeasPopup] = useState(false);
    const [isRestoringFromRedux, setIsRestoringFromRedux] = useState(false);

    const integrationsImg = [
        { img: slackIntImg, imgClass: "w-8 h-8" },
        { img: gitHubIntImg, imgClass: "w-8 h-8" },
        { img: zapierIntImg, imgClass: "w-8 h-8" },
        { img: HubSpotImg, imgClass: "w-8 h-8" },
    ]

    useEffect(() => {
        if (location.pathname === '/feedback' && !location.search.includes('opensheet')) {
            dispatch(clearCreateSheetState());
        }
    }, [location.pathname, location.search, dispatch]);

    const boardListRef = useRef(null);
    const topicListRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const debounceTimeoutRef = useRef(null);

    const debouncedGetSimilarIdeas = useCallback((title) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            // Check if title has at least one word followed by space and another character
            const hasWordSpacePattern = /^\S+\s+\S/.test(title?.trim() || '');

            if (title && title.trim().length >= 2 && hasWordSpacePattern && projectDetailsReducer?.plan === 3 && projectDetailsReducer.stripeStatus === "active") {
                setIsLoadingSimilarIdeas(true);
                setShowAllSimilarIdeas(false);
                try {
                    const payload = {
                        projectId: projectDetailsReducer?.id,
                        title: title.trim(),
                        description: ideaDetail.description || ""
                    };
                    const response = await apiService.getSimilarIdeas(payload);
                    const apiIdeas =
                        Array.isArray(response?.data)
                            ? response.data
                            : Array.isArray(response?.similarIdeas)
                                ? response.similarIdeas
                                : Array.isArray(response?.data?.similarIdeas)
                                    ? response.data.similarIdeas
                                    : [];
                    setSimilarIdeas(apiIdeas);

                    const similarIdeasData = {
                        similarIdeas: apiIdeas,
                        showAllSimilarIdeas: false
                    };
                    dispatch(setCreateSheetSimilarIdeas(similarIdeasData));

                    if (apiIdeas.length > 0) {
                        setShowSimilarIdeasPopup(true);
                    }
                } catch (error) {
                    setSimilarIdeas([]);
                    setShowSimilarIdeasPopup(false);

                    const similarIdeasData = {
                        similarIdeas: [],
                        showAllSimilarIdeas: false
                    };
                    dispatch(setCreateSheetSimilarIdeas(similarIdeasData));
                } finally {
                    setIsLoadingSimilarIdeas(false);
                }
            } else {
                setSimilarIdeas([]);
                setShowAllSimilarIdeas(false);
                setShowSimilarIdeasPopup(false);

                const similarIdeasData = {
                    similarIdeas: [],
                    showAllSimilarIdeas: false
                };
                dispatch(setCreateSheetSimilarIdeas(similarIdeasData));
            }
        }, 500);
    }, [projectDetailsReducer?.id, projectDetailsReducer?.plan, ideaDetail.description]);

    const closeSimilarIdeasPopup = () => {
        setShowSimilarIdeasPopup(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (similarIdeasPopupRef.current && !similarIdeasPopupRef.current.contains(event.target)) {
                closeSimilarIdeasPopup();
            }
        };

        if (showSimilarIdeasPopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSimilarIdeasPopup]);

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsRestoringFromRedux(true);

            if (location.pathname !== '/feedback' || location.search.includes('opensheet')) {
                if (createSheetState.formState) {
                    setIdeaDetail(prev => ({
                        ...prev,
                        ...createSheetState.formState
                    }));
                }

                if (createSheetState.similarIdeas && createSheetState.similarIdeas.length > 0) {
                    setSimilarIdeas(createSheetState.similarIdeas);
                    setShowAllSimilarIdeas(createSheetState.showAllSimilarIdeas || false);
                    setShowSimilarIdeasPopup(true);
                } else {
                    setSimilarIdeas([]);
                    setShowAllSimilarIdeas(false);
                    setShowSimilarIdeasPopup(false);
                }
            } else {
                setSimilarIdeas([]);
                setShowAllSimilarIdeas(false);
                setShowSimilarIdeasPopup(false);
            }
            setTimeout(() => {
                setIsRestoringFromRedux(false);
            }, 100);
        }
    }, [isOpen]);



    const handleSimilarIdeaClick = async (idea) => {
        const formState = {
            title: ideaDetail.title,
            description: ideaDetail.description,
            boardId: ideaDetail.boardId,
            topicId: ideaDetail.topicId,
            descriptionImages: ideaDetail.descriptionImages || []
        };

        dispatch(setCreateSheetFormState(formState));

        const similarIdeasData = {
            similarIdeas: similarIdeas,
            showAllSimilarIdeas: showAllSimilarIdeas
        };

        dispatch(setCreateSheetSimilarIdeas(similarIdeasData));

        navigate(`/feedback/${idea.id}`, {
            state: { fromCreateSheet: true }
        });
    };

    const handleWheelScroll = (ref) => (event) => {
        if (ref.current) {
            event.preventDefault();
            ref.current.scrollBy({
                top: event.deltaY,
                behavior: 'smooth'
            });
        }
    };

    const handleTouchScroll = (e) => {
        e.stopPropagation();
    };

    const onChangeText = (e) => {
        const { name, value, images } = e.target;
        const trimmedValue = name === "title" ? value.trimStart() : value;
        setIdeaDetail(prev => ({
            ...prev,
            [name]: trimmedValue,
            images: images ? [...prev.images, ...images] : prev.images
        }));
        setFormError(prev => ({
            ...prev,
            [name]: formValidate(name, trimmedValue)
        }));
        if (name === "description" && imageSizeError) {
            setImageSizeError('');
        }

        if (name === "title" && !isRestoringFromRedux && projectDetailsReducer?.plan === 3 && projectDetailsReducer.stripeStatus === "active") {
            debouncedGetSimilarIdeas(trimmedValue);
        }
    };

    const onChangeBoard = (value) => {
        setIdeaDetail({ ...ideaDetail, boardId: value });
        setFormError(formError => ({
            ...formError,
            boardId: formValidate("boardId", value),
        }));
        setOpenBoardPopover(false);
    };

    const handleSheetClose = () => {
        dispatch(clearCreateSheetState());
        onCancel();
    };

    const handleCreateFeedback = () => {
        dispatch(clearCreateSheetState());
        onCreateIdea(imagesToDelete);
    };

    const plan = projectDetailsReducer?.plan;

    let filteredBoards = allStatusAndTypes?.boards || [];
    if (plan === 0) {
        filteredBoards = filteredBoards.slice(0, 1);
    } else if (plan === 1) {
        filteredBoards = filteredBoards.slice(0, 5);
    } else if (plan === 2) {
        filteredBoards = filteredBoards.slice(0, 10);
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={isOpen ? handleSheetClose : onOpen}>
                <SheetContent className={"lg:max-w-[663px] md:max-w-[720px] sm:max-w-[520px] p-0"}>
                    <SheetHeader className={"px-4 py-5 lg:px-8 lg:py-[20px] border-b"}>
                        <div className={"flex justify-between items-center w-full"}>
                            <SheetTitle className={"text-xl font-medium capitalize"}>New Feedback</SheetTitle>
                            <span className={"max-w-[24px]"}><X onClick={handleSheetClose} className={"cursor-pointer"} /></span>
                        </div>
                    </SheetHeader>
                    <div className={"w-full overflow-y-auto h-[calc(100vh_-_69px)]"} ref={scrollContainerRef}>
                        <div className={"pb-[60px] sm:p-0"}>
                            <div className={"px-4 py-3 lg:py-6 lg:px-8 flex flex-col gap-6 border-b"}>
                                <div className="space-y-2">
                                    <Label htmlFor="title" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Title</Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            id="title"
                                            value={ideaDetail.title}
                                            placeholder={"Enter your feedback"}
                                            name={"title"}
                                            onChange={onChangeText}
                                        />

                                        {projectDetailsReducer?.plan === 3 && projectDetailsReducer.stripeStatus === "active" && isLoadingSimilarIdeas && ideaDetail.title && ideaDetail.title.trim().length >= 2 && (
                                            <div className="absolute top-full left-0 right-0 z-[9999] mt-1 p-2 bg-background border rounded-md shadow-xl">
                                                <div className="flex items-center gap-2 text-sm py-1">
                                                    {Icon.AIIcon}
                                                    <span className="text-gray-800">AI analyzing similar posts…</span>
                                                </div>
                                            </div>
                                        )}
                                        {similarIdeas.length > 0 && showSimilarIdeasPopup && (
                                            <div
                                                ref={similarIdeasPopupRef}
                                                className="absolute top-full left-0 right-0 z-[9999] mt-1 px-2 pb-3 pt-1 bg-background  border rounded-md shadow-xl"
                                            >
                                                {projectDetailsReducer?.plan === 3 && projectDetailsReducer.stripeStatus === "active" &&
                                                    !isLoadingSimilarIdeas &&
                                                    similarIdeas.length > 0 &&
                                                    ideaDetail.title &&
                                                    ideaDetail.title.trim().length >= 2 && (
                                                        <div className="relative">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute right-0 h-6 w-6 p-0 hover:bg-gray-100"
                                                                onClick={closeSimilarIdeasPopup}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>

                                                            <div className="space-y-3 pr-8">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                                                    <h4 className="text-sm font-semibold text-foreground">Similar Feedbacks Found</h4>
                                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                                                        {similarIdeas.length} {similarIdeas.length === 1 ? 'idea' : 'ideas'}
                                                                    </span>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {(showAllSimilarIdeas ? similarIdeas : similarIdeas).map((idea, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="px-3 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-sm hover:bg-muted/30"
                                                                            onClick={() => handleSimilarIdeaClick(idea)}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors truncate">
                                                                                        {idea.title}
                                                                                    </div>

                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        )}


                                    </div>
                                    {formError.title && <span className="text-red-500 text-sm">{formError.title}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className={"font-medium"}>Description</Label>
                                    <ReactQuillEditor
                                        value={ideaDetail.description}
                                        name={"description"}
                                        onChange={onChangeText}
                                        setImageSizeError={setImageSizeError}
                                        setImages={setIdeaDetail}
                                        title={ideaDetail.title}
                                        descriptionImages={ideaDetail.descriptionImages || []}
                                        uploadFolder={"feature-idea"} moduleName={'idea'}
                                        setImagesToDelete={setImagesToDelete}
                                        scrollContainerRef={scrollContainerRef}
                                        preventAutoScroll={true}
                                    />
                                    {imageSizeError && <span className="text-red-500 text-sm">{imageSizeError}</span>}
                                </div>
                                <div className={"space-y-2"}>
                                    <div className={`flex gap-2 justify-between items-center`}>
                                        <Label className={`font-medium capitalize after:ml-1 after:content-['*'] after:text-destructive`}>Choose Board for this Feedback</Label>
                                        <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/board`)}>Manage Boards</Button>
                                    </div>
                                    <Popover open={openBoardPopover} onOpenChange={setOpenBoardPopover} className="w-full p-0">
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openBoardPopover}
                                                className="w-full justify-between bg-card focus-visible:ring-0 focus-visible:ring-transparent"
                                            >
                                                <span className={`text-left w-11/12 block truncate ${ideaDetail.boardId ? "" : "text-muted-foreground"}`}>
                                                    {ideaDetail.boardId ? (
                                                        allStatusAndTypes?.boards.find(board => board.id === ideaDetail.boardId)?.title
                                                    ) : (
                                                        "Choose board"
                                                    )}
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
                                                                    <CommandItem
                                                                        value={board.id}
                                                                        className="p-0 flex gap-1 items-center cursor-pointer"
                                                                    >
                                                                        <RadioGroup>
                                                                            <RadioGroupItem
                                                                                className="m-2"
                                                                                checked={ideaDetail.boardId === board.id}
                                                                                onClick={() => {
                                                                                    onChangeBoard(board.id);
                                                                                    setOpenBoardPopover(false);
                                                                                }}
                                                                            />
                                                                        </RadioGroup>
                                                                        <span
                                                                            onClick={() => {
                                                                                onChangeBoard(board.id);
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
                                    {formError.boardId && <span className="text-red-500 text-sm">{formError.boardId}</span>}
                                </div>

                                <div className={"space-y-2"}>
                                    <div className={`flex gap-2 justify-between items-center`}>
                                        <Label className={"font-medium capitalize"}>Choose tags for this Feedback (optional)</Label>
                                        <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/tags`)}>Manage Tags</Button>
                                    </div>
                                    <Popover open={openTopics} onOpenChange={setOpenTopics} className="w-full p-0">
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openTopics}
                                                className="w-full justify-between bg-card focus-visible:ring-0 focus-visible:ring-transparent"
                                            >
                                                <div className="flex gap-1 overflow-hidden">
                                                    {(ideaDetail.topicId || []).length === 0 ? (
                                                        <span className="text-muted-foreground">Select topic</span>
                                                    ) : (
                                                        (ideaDetail.topicId || []).map((x, index) => {
                                                            const findObj = topicLists.find((y) => y.id === x);
                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="text-xs flex gap-[2px] dark:text-card bg-slate-300 items-center rounded py-0 px-2"
                                                                >
                                                                    <span className="max-w-[85px] truncate">
                                                                        {findObj?.title}
                                                                    </span>
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
                                                        {topicLists?.length > 0 ? (
                                                            topicLists.map((topic, i) => (
                                                                <Fragment key={i}>
                                                                    <CommandItem
                                                                        onSelect={(e) => { e.preventDefault(); }}
                                                                        value={topic.id}
                                                                        className="p-0 cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center gap-2 w-full">
                                                                            <Checkbox
                                                                                className="m-2"
                                                                                checked={(ideaDetail.topicId || []).includes(topic.id)}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleChange(topic.id);
                                                                                    setOpenTopics(true);
                                                                                }}
                                                                            />
                                                                            <span
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleChange(topic.id);
                                                                                    setOpenTopics(true);
                                                                                }}
                                                                                className="text-sm font-medium cursor-pointer w-full"
                                                                            >
                                                                                {topic.title}
                                                                            </span>
                                                                        </div>
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
                            </div>
                            <div className={"px-4 py-3 lg:py-6 lg:px-8 flex gap-6 border-b"}>
                                <Button className={`w-[130px] text-sm font-medium hover:bg-primary`} disabled={isLoading} onClick={handleCreateFeedback}>
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Feedback"}
                                </Button>
                                <Button variant={"outline hover:bg-transparent"} className={"border border-primary text-sm font-medium text-primary"} onClick={handleSheetClose}>Cancel</Button>
                            </div>
                            <div className={"px-4 py-3 lg:py-6 lg:px-8 space-y-6"}>
                                <div>
                                    <h2 className={"font-medium"}>Do you gather feedback elsewhere?</h2>
                                    <p className={"text-[14px]"}>Connect with your current tools to capture feedback.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    {integrationsImg.map((x, i) => (
                                        <div key={i} className="rounded-2xl border w-16 h-16 flex justify-center items-center cursor-pointer" onClick={() => navigate(`${baseUrl}/integrations`)}>
                                            <img className={x.imgClass} src={x.img} alt="Integration logo" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

        </>
    );
};

export default CommCreateSheet;