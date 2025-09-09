import React, { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Circle, Dot, Plus, Search, X } from "lucide-react";
import { Button } from "../ui/button";
import UpdateRoadMapIdea from "./UpdateRoadMapIdea";
import { useSelector } from "react-redux";
import Board, { moveCard } from "@asseinfo/react-kanban";
import "@asseinfo/react-kanban/dist/styles.css";
import CreateRoadmapIdea from "./CreateRoadmapIdea";
import { useToast } from "../ui/use-toast";
import { commonLoad } from "../Comman/CommSkel";
import { EmptyDataContent } from "../Comman/EmptyDataContent";
import { EmptyRoadmapContent } from "../Comman/EmptyContentForModule";
import { apiService, baseUrl, DO_SPACES_ENDPOINT, isContentEmpty, isEmpty, } from "../../utils/constent";
import { useNavigate } from "react-router";
import CreateRoadmp from "./CreateRoadmp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { Icon } from "../../utils/Icon";
import EmptyData from "../Comman/EmptyData";
import { ReadMoreText } from "../Comman/ReadMoreText";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { useImagePreview } from "../Comman/ImagePreviewProvider";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandInput } from "../ui/command";

const loading = {
    columns: Array.from({ length: 5 }, (_, index) => ({
        id: index + 1,
        title: "",
        cards: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            title: "",
        })),
    })),
};

const Roadmap = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { openPreview } = useImagePreview();
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const [roadmapList, setRoadmapList] = useState({ columns: [] });
    const [selectedIdea, setSelectedIdea] = useState({});
    const [selectedRoadmap, setSelectedRoadmap] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [emptyContentBlock, setEmptyContentBlock] = useState(true);
    const [originalIdea, setOriginalIdea] = useState({});
    const [roadmapOptions, setRoadmapOptions] = useState([]);
    const [selectedRoadmapId, setSelectedRoadmapId] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState({ open: false, type: "" });
    const [isSheetOpenCreate, setSheetOpenCreate] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedTopicIds, setSelectedTopicIds] = useState([]);
    const [openTopicPopover, setOpenTopicPopover] = useState(false);
    const [topicFilterSearch, setTopicFilterSearch] = useState("");
    const [isSearchFull, setIsSearchFull] = useState(false);
    const [openBoard, setOpenBoard] = useState(false);
    const [boardSearch, setBoardSearch] = useState("");
    const [selectedBoardIds, setSelectedBoardIds] = useState([]);

    const toggleValue = (array, value) => {
        const set = new Set(array || []);
        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }
        return Array.from(set);
    };

    const onChangeBoard = (value) => {
        setSelectedBoardIds((prev) => toggleValue(prev, value));
    };

    const removeTopicSelection = (topicId) => {
        setSelectedTopicIds((prev) => prev.filter((id) => id !== topicId));
    };

    const removeBoardSelection = (boardId) => {
        setSelectedBoardIds((prev) => prev.filter((id) => id !== boardId));
    };

    const clearAllSelections = () => {
        setSelectedTopicIds([]);
        setSelectedBoardIds([]);
        setSearchText("");
        setIsSearchFull(false);
        setTopicFilterSearch("");
        setBoardSearch("");
        setOpenTopicPopover(false);
        setOpenBoard(false);
    };

    const getStoredRoadmapId = () => {
        if (!projectDetailsReducer?.id) return "";
        const stored = localStorage.getItem(`selectedRoadmap_${projectDetailsReducer.id}`);
        return stored || "";
    };

    const setStoredRoadmapId = (value) => {
        if (!projectDetailsReducer?.id) return;
        if (value) {
            localStorage.setItem(`selectedRoadmap_${projectDetailsReducer.id}`, value);
        } else {
            localStorage.removeItem(`selectedRoadmap_${projectDetailsReducer.id}`);
        }
    };

    useEffect(() => {
        const storedId = getStoredRoadmapId();
        if (storedId) {
            setSelectedRoadmapId(storedId);
        }
    }, [projectDetailsReducer.id]);

    const getRoadmapAllOptions = async () => {
        setIsLoading(true);
        const id = projectDetailsReducer?.id;
        if (!id) {
            console.error("No project ID available");
            return;
        }

        const response = await apiService.getRoadmapoptions(id);
        if (response.success) {
            setIsLoading(false);
            const options = response.data || [];
            setRoadmapOptions(options);
            const storedId = getStoredRoadmapId();
            if (storedId && options.some((opt) => opt.id.toString() === storedId)) {
                setSelectedRoadmapId(storedId);
            } else if (options.length > 0) {
                const firstId = options[0].id.toString();
                setSelectedRoadmapId(firstId);
                setStoredRoadmapId(firstId);
            } else {
                setSelectedRoadmapId("");
                setStoredRoadmapId("");
            }
        } else {
            toast({ variant: "destructive", description: "Failed to load roadmap options", });
        }
    };

    const handleRoadmapChange = (value) => {
        if (!value) return;
        const isValidOption = roadmapOptions.some((opt) => opt.id.toString() === value);
        if (!isValidOption) {
            return;
        }

        setSelectedRoadmapId(value);
        setStoredRoadmapId(value);
    };

    useEffect(() => {
        return () => {
            if (projectDetailsReducer?.id) {
                setStoredRoadmapId("");
            }
        };
    }, [projectDetailsReducer.id]);

    useEffect(() => {
        if (projectDetailsReducer?.id) {
            getRoadmapAllOptions();
        }
    }, [projectDetailsReducer.id]);

    useEffect(() => {
        if (projectDetailsReducer?.id && selectedRoadmapId) {
            getRoadmapIdea();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoadmapId, projectDetailsReducer.id]);

    // Fetch on filter changes as well (server-side, best effort). Debounce search.
    useEffect(() => {
        if (!projectDetailsReducer?.id || !selectedRoadmapId) return;
        const timer = setTimeout(() => {
            getRoadmapIdea();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText, selectedTopicIds, selectedBoardIds]);

    const clearSearchFilter = () => {
        setSearchText('')
        setIsSearchFull(!isSearchFull)
        if (isSearchFull && !isContentEmpty(searchText)) {
            getRoadmapIdea();
        }
    };

    const getRoadmapIdea = async () => {
        setIsLoading(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            roadmapId: Number(selectedRoadmapId),
            page: "1",
            limit: "100",
        };
        if ((searchText || "").trim().length > 0) {
            payload.search = searchText.trim();
        }
        if (Array.isArray(selectedTopicIds) && selectedTopicIds.length > 0) {
            payload.tagId = selectedTopicIds;
        }
        if (Array.isArray(selectedBoardIds) && selectedBoardIds.length > 0) {
            payload.boardId = selectedBoardIds;
        }
        const data = await apiService.getRoadmapIdea(payload);
        if (data.success) {
            const roadmapListClone = [];
            data?.data?.data?.map((x) => { roadmapListClone.push({ ...x, cards: x.ideas }); });
            setRoadmapList({ columns: roadmapListClone });
            setIsLoading(false);
            const hasNoCards = roadmapListClone.every((item) => !item.cards || item.cards.length === 0);
            if (hasNoCards || !data.data || data.data.length === 0) {
                emptyContent(false);
            } else {
                emptyContent(false);
            }
        } else {
            setIsLoading(false);
            emptyContent(true);
        }
    };

    const emptyContent = (status) => {
        setEmptyContentBlock(status);
    };

    const openSheet = (type) => {
        if (type === "createRoadmap") {
            setSheetOpenCreate(true);
        } else {
            setIsSheetOpen({ open: true, type });
        }
    };
    const closeSheet = () => setIsSheetOpen({ open: false, type: "" });

    const openDetailsSheet = (record) => {
        const findRoadmap = roadmapList.columns.find((x) => x.id === record.roadmapStatusId);
        setSelectedIdea(record);
        setOriginalIdea(record);
        setSelectedRoadmap(findRoadmap);
        openSheet("update");
    };

    const setRoadmapRank = async (updatedCards, columnId) => {
        const rankPayload = updatedCards.map((card, index) => ({
            id: card.id,
            roadmapStatusId: columnId,
            rank: index,
        }));
        const data = await apiService.setRoadmapRank({ ranks: rankPayload });
        if (data.success) {
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const callApi = async (columnId, payload) => {
        let formData = new FormData();
        formData.append("roadmapStatusId", columnId);
        const data = await apiService.updateIdea(formData, payload);
        if (data.success) {
            toast({ description: data.message });
        } else {
        }
    };

    const handleCardMove = (_card, source, destination) => {
        const updatedBoard = moveCard(roadmapList, source, destination);
        const updatedColumns = [...updatedBoard.columns];

        const sourceIndex = updatedColumns.findIndex((col) => col.id == source.fromColumnId);
        const destinationIndex = updatedColumns.findIndex((col) => col.id == destination.toColumnId);

        if (source.fromColumnId !== destination.toColumnId) {
            if (sourceIndex !== -1) {
                const updatedSourceCards = updatedColumns[sourceIndex].cards.filter((card) => card.id !== _card.id);
                updatedColumns[sourceIndex] = {
                    ...updatedColumns[sourceIndex],
                    cards: updatedSourceCards,
                    ideas: updatedSourceCards,
                };
            }
        }
        if (destinationIndex !== -1) {
            let destinationCards = [...updatedColumns[destinationIndex].cards];
            destinationCards = destinationCards.map((card, index) => ({
                ...card,
                rank: index,
                roadmapStatusId: destination.toColumnId,
            }));
            updatedColumns[destinationIndex] = {
                ...updatedColumns[destinationIndex],
                cards: destinationCards,
                ideas: destinationCards,
            };
        }
        setRoadmapList({ columns: updatedColumns });
        if (source.fromColumnId !== destination.toColumnId) {
            callApi(destination.toColumnId, _card.id);
        }
        setRoadmapRank(updatedColumns[destinationIndex].cards, destination.toColumnId);

        const updatedCard = { ..._card, roadmapStatusId: destination.toColumnId, };
        setSelectedIdea(updatedCard);
    };

    const onCreateIdea = (mainRecord) => {
        setSelectedRoadmap(mainRecord);
        openSheet("create");
    };

    const openCreateIdea = () => {
        setSheetOpenCreate(true);
        navigate(`${baseUrl}/roadmap`);
    };
    const closeCreateIdea = () => {
        setSheetOpenCreate(false);
    };
    const openCreateRoadmap = () => {
        setSheetOpenCreate(true);
        navigate(`${baseUrl}/roadmap`);
    };


    return (
        <div
            className={`roadmap-container height-inherit h-svh max-w-[100%] md:pl-8 pl-0 p-r ${emptyContentBlock ? "overflow-y-auto" : ""}`}
        >
            {isSheetOpen.open && isSheetOpen.type === "update" && (
                <UpdateRoadMapIdea
                    isOpen={isSheetOpen.open}
                    onClose={closeSheet}
                    selectedIdea={selectedIdea}
                    originalIdea={originalIdea}
                    setOriginalIdea={setOriginalIdea}
                    setSelectedIdea={setSelectedIdea}
                    setSelectedRoadmap={setSelectedRoadmap}
                    selectedRoadmap={selectedRoadmap}
                    roadmapList={roadmapList}
                    setRoadmapList={setRoadmapList}
                    getRoadmapIdea={getRoadmapIdea}
                />
            )}
            {isSheetOpenCreate && (
                <CreateRoadmp
                    isOpen={isSheetOpenCreate}
                    onOpen={openCreateIdea}
                    onClose={closeCreateIdea}
                    closeCreateIdea={closeCreateIdea}
                    setSheetOpenCreate={setSheetOpenCreate}
                    isSheetOpenCreate={isSheetOpenCreate}
                    getRoadmapAllOptions={getRoadmapAllOptions}
                />
            )}

            {isSheetOpen.open && isSheetOpen.type === "create" && (
                <CreateRoadmapIdea
                    isOpen={isSheetOpen.open}
                    onClose={closeSheet}
                    selectedRoadmap={selectedRoadmap}
                    roadmapList={roadmapList}
                    setRoadmapList={setRoadmapList}
                />
            )}
            <div className={"p-4 px-2.5 sm:flex  justify-between items-center gap-3"}>
                <div className={"flex flex-col gap-y-0.5"}>
                    <h1 className="text-2xl font-normal flex-initial w-auto">Roadmap</h1>
                    <div className={`flex flex-wrap gap-2 items-center`}>
                        <p className={"text-sm text-muted-foreground text-wrap"}>
                            Create and display a roadmap on your website to keep users updated on the project's progress.
                        </p>
                        <Button variant={'link'} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/roadmap?selected=${selectedRoadmapId}`)}>Edit roadmap settings</Button>
                    </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:mt-0 mt-4">
                    <div className={'flex gap-2 items-center'}>
                        <div className={`relative h-9 border bg-white rounded-[9px] overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isSearchFull ? 'w-[220px] sm:w-[250px]' : 'w-9'}`}>
                            <div
                                className={`h-full overflow-hidden`}
                            >
                                <div className={`group relative overflow-hidden transition-all duration-300 ease-in-out ${isSearchFull ? "max-w-[250px]" : "max-w-0"}`} style={{ width: isSearchFull ? "100%" : "0" }}>
                                    <Search className="w-4 h-4 z-10 cursor-text absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <Input
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        className="h-full px-9 border-0 rounded-[9px] bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 w-full"
                                        type="text"
                                        placeholder="Search"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-9 h-full min-w-[36px] rounded-[9px] border-0 inline-flex absolute top-0 right-0 shrink-0"
                                    onClick={clearSearchFilter}
                                >
                                    {isSearchFull ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Topic-only Popover */}
                        <Popover open={openTopicPopover} onOpenChange={setOpenTopicPopover}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="w-9 h-9 min-w-[36px] rounded-[9px] shrink-0">
                                    {Icon.filterIcon}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="end">
                                <Command className="w-full">
                                    <div className="flex items-center border-b px-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <Input
                                            type="search"
                                            className="focus-visible:ring-0 outline-none h-9 rounded-none border-0"
                                            placeholder={"Search topic"}
                                            value={topicFilterSearch}
                                            onChange={(e) => setTopicFilterSearch(e.target.value)}
                                        />
                                        {topicFilterSearch?.trim().length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 p-0 text-muted-foreground"
                                                onClick={() => setTopicFilterSearch("")}
                                                aria-label="Clear topic search"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <CommandList className="w-full min-w-[230px]">
                                        <CommandEmpty>
                                            No topic found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {(allStatusAndTypes.topics || [])
                                                .filter((y) => (y.title || y.label || "").toLowerCase().includes((topicFilterSearch || "").toLowerCase()))
                                                .map((x, i) => (
                                                    <CommandItem
                                                        key={i}
                                                        value={String(x.id)}
                                                        className="p-0 flex gap-1 items-center cursor-pointer"
                                                    >
                                                        <Checkbox
                                                            className="m-2"
                                                            checked={selectedTopicIds.includes(x.id)}
                                                            onClick={() => {
                                                                setSelectedTopicIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (!next.has(x.id)) next.add(x.id); else next.delete(x.id);
                                                                    return Array.from(next);
                                                                });
                                                            }}
                                                        />
                                                        <span
                                                            onClick={() => {
                                                                setSelectedTopicIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (!next.has(x.id)) next.add(x.id); else next.delete(x.id);
                                                                    return Array.from(next);
                                                                });
                                                            }}
                                                            className="flex-1 w-full text-sm font-medium cursor-pointer flex gap-2 items-center"
                                                        >
                                                            {x.title || x.label}
                                                        </span>
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>


                        <Popover
                            open={openBoard}
                            onOpenChange={() => setOpenBoard(!openBoard)}
                            className="w-full p-0"
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-9 h-9 min-w-[36px] rounded-[9px] shrink-0"
                                >
                                    {Icon.boardIcon}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="end">
                                <Command className="w-full">
                                    <div className="flex items-center border-b px-2">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <Input
                                            type="search"
                                            className="h-9 border-0"
                                            placeholder="Search boards..."
                                            value={boardSearch || ""}
                                            onChange={(e) => setBoardSearch(e.target.value)}
                                        />
                                        {boardSearch?.trim().length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 p-0 text-muted-foreground"
                                                onClick={() => setBoardSearch("")}
                                                aria-label="Clear board search"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <CommandList className="w-full">
                                        <CommandEmpty>No boards found.</CommandEmpty>
                                        <CommandGroup>
                                            {(allStatusAndTypes.boards || [])
                                                .filter((board) =>
                                                    (board.title)
                                                        .toLowerCase()
                                                        .includes((boardSearch).toLowerCase())
                                                )
                                                .map((x, i) => {
                                                    return (
                                                        <CommandItem
                                                            key={i}
                                                            value={String(x.id)}
                                                            className="p-0 flex gap-1 items-center cursor-pointer"
                                                        >
                                                            <Checkbox
                                                                className="m-2"
                                                                checked={selectedBoardIds.includes(x.id)}
                                                                onClick={() => { onChangeBoard(x.id) }}
                                                            />
                                                            <span
                                                                onClick={() => { onChangeBoard(x.id) }}
                                                                className="flex-1 w-full text-sm font-medium cursor-pointer flex gap-2 items-center"
                                                            >
                                                                {x.title || x.label}
                                                            </span>
                                                        </CommandItem>
                                                    );
                                                })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                    </div>



                    {roadmapOptions?.length > 1 && (
                        <div className="">
                            <Select value={selectedRoadmapId} onValueChange={handleRoadmapChange} disabled={isLoading}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder={isLoading ? "Loading..." : "Select Roadmap"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {roadmapOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()} className="break-words w-[200px] break-all">
                                            {option.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                </div>
            </div>

            {(selectedTopicIds.length > 0 || selectedBoardIds.length > 0) && (
                <div className={"flex flex-wrap items-center gap-2 pl-3"}>
                    {(selectedTopicIds || []).map((topicId) => {
                        const topic = (allStatusAndTypes.topics || []).find((t) => t.id === topicId);
                        const label = topic?.title || topic?.label || `Topic ${topicId}`;
                        return (
                            <div
                                key={`selected_topic_${topicId}`}
                                className="flex items-center gap-1 text-xs bg-[#FBFBFF] border border-[#dee1ea80] py-1 pl-2 pr-1 font-medium text-[#5b678f] rounded-md"
                            >
                                <span className="max-w-[160px] truncate">{label}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0"
                                    onClick={() => removeTopicSelection(topicId)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                    {(selectedBoardIds || []).map((boardId) => {
                        const board = (allStatusAndTypes.boards || []).find((b) => b.id === boardId);
                        const label = board?.title || board?.label || `Board ${boardId}`;
                        return (
                            <div
                                key={`selected_board_${boardId}`}
                                className="flex items-center gap-1 text-xs bg-[#FBFBFF] border border-[#dee1ea80] py-1 pl-2 pr-1 font-medium text-[#5b678f] rounded-md"
                            >
                                <span className="max-w-[160px] truncate">{label}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0"
                                    onClick={() => removeBoardSelection(boardId)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                    <Button
                        variant="outline"
                        className="h-7 p-3  rounded-md text-primary hover:text-primary"
                        onClick={clearAllSelections}
                    >
                        Clear All
                    </Button>
                </div>
            )}

            <div className={"py-[11px] pt-[3px]"}>
                {isLoading ? (
                    <Board
                        allowAddColumn
                        disableColumnDrag
                        allowAddCard={{ on: "bottom" }}
                        addCard={{ on: "bottom" }}
                        renderCard={(y) => {
                            return (
                                <Card className={"mb-3"}>{commonLoad.commonParagraphThreeIcon}</Card>
                            );
                        }}
                        renderColumnHeader={({ id }) => {
                            return (
                                <Fragment>
                                    {commonLoad.commonParagraphOne}
                                    <div className={"add-idea"}>{commonLoad.commonParagraphOne}</div>
                                </Fragment>
                            );
                        }}
                    >
                        {loading}
                    </Board>
                ) : roadmapList.columns.length === 0 ? (
                    <EmptyData emptyIcon={Icon.roadmapEmpty} children={"You haven't created a roadmap yet"} />
                ) : (
                    <Board
                        allowAddColumn
                        disableColumnDrag
                        onCardDragEnd={handleCardMove}
                        allowAddCard={{ on: "bottom" }}
                        addCard={{ on: "bottom" }}
                        renderCard={(y) => {
                            const boardTitle = allStatusAndTypes?.boards?.find((board) => board.id === y.board)?.title || "";
                            return (
                                <Fragment>
                                    <Card onClick={() => openDetailsSheet(y)} className={"mb-3 shadow-sm"}>
                                        <div className="flex gap-2">
                                            <div className={"w-full"}>
                                                <CardContent className={"pr-0 py-4 ps-2"}>
                                                    {y && y?.coverImage && (
                                                        <Fragment>
                                                            <AspectRatio ratio={10 / 5} className="bg-muted rounded-ss-md rounded-se-md mb-2">
                                                                <img
                                                                    src={`${DO_SPACES_ENDPOINT}/${y.coverImage}`}
                                                                    alt={y.title}
                                                                    className="w-full h-full object-contain object-center cursor-pointer"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPreview(`${DO_SPACES_ENDPOINT}/${y.coverImage}`);
                                                                    }}
                                                                />
                                                            </AspectRatio>
                                                        </Fragment>
                                                    )}
                                                    <h3 className={`text-sm font-medium  ${y && y?.coverImage ? "m-0" : "-mt-1"}`}>
                                                        {y.title}
                                                    </h3>
                                                    {isContentEmpty(y.description) || isEmpty(y.description) ? ("") : (
                                                        <div className={"description-container text-sm"}>
                                                            <ReadMoreText
                                                                stopPropagation={true}
                                                                alldata={y}
                                                            />
                                                        </div>
                                                    )}
                                                    {boardTitle?.length ? (
                                                        <div className={"h-7 p-1 px-2 text-xs font-medium text-muted-foreground border border-input rounded-lg"}>
                                                            {boardTitle}
                                                        </div>
                                                    ) : ("")}
                                                    {y?.comments?.length || y.topic.length ? (
                                                        <div className="flex items-start gap-.5 mt-3">
                                                            {y.topic.length ? (
                                                                <div className="flex flex-wrap gap-1 w-fit items-center">
                                                                    {(y.topic || []).map((topic) => {
                                                                        return (
                                                                            <div key={`y_topic_${topic.id}`}
                                                                                className="max-w-[113px] truncate text-xs bg-[#FBFBFF] border-gray-[#dee1ea80] border truncate py-1 px-2 font-medium text-[#5b678f] rounded-md"
                                                                            >
                                                                                {topic.title}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : ("")}
                                                            {y?.comments?.length && y.topic.length ? (<Dot className="text-gray-300 -mt-0.5" size={20} />) : null}
                                                            {y?.comments?.length ? (y?.comments?.length ? (
                                                                <div className="flex items-center gap-1">
                                                                    {Icon.chatbuble}{" "}
                                                                    <div className="text-[10px] font-medium">
                                                                        {" "}
                                                                        {y?.comments?.length}
                                                                    </div>
                                                                </div>
                                                            ) : ("")) : ("")}
                                                        </div>
                                                    ) : ("")}
                                                </CardContent>
                                            </div>
                                            <CardHeader className={"gap-2 py-4 px-2"}>
                                                <div className="flex-initial flex-col flex items-center justify-start">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className={`inline-block w-5 h-5`}
                                                                style={{
                                                                    fill: y?.userVote ? "#7c3aed" : "#6b7280",
                                                                    color: y?.userVote ? "#7c3aed" : "#6b7280",
                                                                }}
                                                            >{Icon.caretUp}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className={"font-normal text-sm"}>
                                                            Vote
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <div className={`font-medium text-[11px]`}>
                                                        {y.vote}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </div>
                                    </Card>
                                </Fragment>
                            );
                        }}
                        renderColumnHeader={({ title, colorCode, id, cards }) => {
                            const column = roadmapList?.columns?.find((col) => col.id === id);
                            const cardCount = column ? column?.cards?.length : 0;

                            return (
                                <Fragment>
                                    <div className={`flex justify-between items-center gap-2 pb-[12px] ${cardCount === 0 ? "absolute left-[9px] top-[9px] w-[calc(100%-18px)]" : ""}`}>
                                        <CardTitle className={"flex items-center gap-2 text-sm font-medium px-[7px]"}>
                                            <Circle fill={colorCode} stroke={colorCode} className={"w-[10px] h-[10px]"} />
                                            {title} ({cardCount})
                                        </CardTitle>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant={"ghost hover:bg-transparent"} className={`p-1 h-auto border`} onClick={() => onCreateIdea(id)}>
                                                    <Plus size={18} strokeWidth={2} className={'text-gray-500'} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className={"font-normal text-sm"}>Create Feedback</TooltipContent>
                                        </Tooltip>
                                    </div>
                                    {cardCount === 0 ? (<div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 text-center mt-4 text-gray-500 overflow-y-auto text-sm flex justify-center items-center">No {title} posts.</div>) : ("")}
                                </Fragment>
                            );
                        }}
                    >
                        {(() => {
                            const query = (searchText || "").toLowerCase().trim();
                            const topicFilterSet = new Set(selectedTopicIds || []);
                            const boardFilterSet = new Set(selectedBoardIds || []);
                            const filteredColumns = (roadmapList.columns || []).map((column) => {
                                let filteredCards = (column.cards || []).filter((card) => {
                                    const titleMatch = query ? (card.title || "").toLowerCase().includes(query) : true;
                                    const descSource = (card.descriptionText || card.description || "").toString();
                                    const descMatch = query ? descSource.toLowerCase().includes(query) : true;
                                    const topics = Array.isArray(card.topic) ? card.topic : [];
                                    const topicMatchQuery = query ? topics.some((t) => (t.title || "").toLowerCase().includes(query)) : true;
                                    const topicMatchFilter = topicFilterSet.size ? topics.some((t) => topicFilterSet.has(t.id)) : true;
                                    const boardMatchFilter = boardFilterSet.size ? boardFilterSet.has(card.boardId) : true;
                                    return (titleMatch || descMatch || topicMatchQuery) && topicMatchFilter && boardMatchFilter;
                                });
                                return { ...column, cards: filteredCards };
                            });
                            return { columns: filteredColumns };
                        })()}
                    </Board>
                )}
            </div>
            {isLoading || !emptyContentBlock ? ("") : (
                <div className={"max-w-[1600px] w-full pl-[10px]"}>
                    <EmptyDataContent
                        data={EmptyRoadmapContent}
                        onClose={() => emptyContent(false)}
                        setSheetOpenCreate={() => openSheet("createRoadmap")}
                        cookieName="hideRoadmapEmptyContent"
                    />
                </div>
            )}
        </div>
    );
};

export default Roadmap;
