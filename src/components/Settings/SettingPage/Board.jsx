import React, { useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "../../theme-provider";
import { Input } from "../../ui/input";
import dayjs from "dayjs";
import { allStatusAndTypesAction } from "../../../redux/action/AllStatusAndTypesAction";
import { toast } from "../../ui/use-toast";
import { Separator } from "../../ui/separator";
import EmptyData from "../../Comman/EmptyData";
import DeleteDialog from "../../Comman/DeleteDialog";
import { apiService, BOARD_LIMITS, normalizeName } from "../../../utils/constent";
import { Checkbox } from "../../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const initialState = { title: "" }

const Board = () => {
    const { onProModal } = useTheme();
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const [formError, setFormError] = useState(initialState);
    const [boardList, setBoardList] = useState([]);
    const [isSave, setIsSave] = useState(false);
    const [isEdit, setIsEdit] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        if (allStatusAndTypes?.boards) {
            getBoardList();
        }
    }, [allStatusAndTypes?.boards])

    const getBoardList = async () => {
        const reversedBoards = [...allStatusAndTypes.boards].reverse();
        setBoardList(reversedBoards);
        setIsLoading(false);
    }

    const handleCheckboxChange = (id) => {
        setSelectedIds((prev) => {
            const newSelectedIds = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            return newSelectedIds;
        });
    };

    const handleSelectAll = (isChecked) => {
        setAllSelectedDelete(0);
        if (isChecked) {
            const allIds = (boardList || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const deleteParticularRow = async () => {
        setIsLoadingDelete(true);
        if (deleteType === 'single') {
            const clone = [...boardList];
            const indexToDelete = clone.findIndex((x) => x.id == deleteId);
            if (deleteId) {
                const data = await apiService.deleteBoard(deleteId);
                if (data.success) {
                    clone.splice(indexToDelete, 1);
                    const reversedList = [...clone].reverse();
                    setBoardList(reversedList);
                    dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, boards: reversedList }));
                    toast({ description: data.message });
                } else {
                    toast({ description: data?.error?.message, variant: "destructive" });
                }
            }
        } else {
            const payload = {
                boardIds: selectedIds,
                projectId: projectDetailsReducer.id,
            };
            const data = await apiService.boardBatchUpdate(payload);
            if (data.success) {
                const updatedLabels = boardList.filter(item => !selectedIds.includes(item.id));
                const reversedList = [...updatedLabels].reverse();
                setBoardList(reversedList);
                dispatch(allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    boards: reversedList,
                }));
                setSelectedIds([]);
                toast({ description: data.message });
            } else {
                toast({ variant: "destructive", description: data.error.message });
            }
        }
        setOpenDelete(false);
        setIsLoadingDelete(false);
    };

    const handleDeleteBoard = (id, type = 'single') => {
        if (type === 'all') {
            setDeleteType('all');
            setOpenDelete(true);
        } else {
            setDeleteId(id);
            setDeleteType('single');
            setOpenDelete(true);
        }
        setBoardList([...allStatusAndTypes.boards].reverse());
        setIsEdit(null);
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Board name is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onBlur = (e) => {
        const { name, value } = e.target;
        const currentIndex = isEdit;
        const currentLabel = boardList[currentIndex] || {};

        const validationErrors = validateLabel(
            { ...currentLabel, [name]: value },
            boardList,
            currentIndex
        );

        setFormError({ ...formError, [name]: validationErrors[name] || "" });
    };

    const validateLabel = (board, boardList, currentIndex) => {
        const errors = {};

        if (!board.title || board.title.trim() === "") {
            errors.title = "Board name is required.";
        } else if (board.title.length > 255) {
            errors.title = "Board name must not exceed 255 characters.";
        }

        const normalizedName = normalizeName(board.title);
        const isDuplicateName = boardList.some(
            (item, i) => i !== currentIndex && normalizeName(item.title) === normalizedName
        );
        if (isDuplicateName) {
            errors.title = "A board with this name already exists.";
        }

        return errors;
    };

    const handleInputChange = (event, index) => {
        const { name, value } = event.target;
        const cleanedValue = name === "title" ? value.trimStart() : value;
        const updateBoard = [...boardList];
        updateBoard[index] = { ...updateBoard[index], [name]: cleanedValue };
        setBoardList(updateBoard);
        setFormError({ ...formError, [name]: formValidate(name, cleanedValue) });
    }

    const onEdit = (index) => {
        setFormError(initialState);
        const clone = [...boardList];
        if (isEdit !== null && !clone[isEdit]?.id) {
            clone.splice(isEdit, 1);
            setIsEdit(index);
            setBoardList([...clone]);
        } else if (isEdit !== index) {
            setBoardList([...allStatusAndTypes?.boards].reverse());
            setIsEdit(index);
        } else {
            setIsEdit(index);
        }
    }

    const updateBoard = async (index) => {
        const clone = [...boardList];
        const boardToSave = clone[index];
        const validationErrors = validateLabel(boardToSave, boardList, index);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true);
        const payload = {
            title: boardToSave.title,
            projectId: projectDetailsReducer.id
        }
        const data = await apiService.updateBoard(payload, boardToSave.id);
        if (data.success) {
            const clone = [...boardList];
            const index = clone.findIndex((x) => x.id === boardToSave.id)
            if (index !== -1) {
                clone[index] = data.data;

                const reversedClone = [...clone].reverse();
                setBoardList(reversedClone);
                dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, boards: reversedClone }));
            }

            setIsSave(false);
            toast({ description: data.message });
            setIsEdit(null);
        } else {
            setIsSave(false);
            toast({ description: data?.error.message, variant: "destructive" });
        }
    }

    const addBoard = async (newStatus, index) => {
        const validationErrors = validateLabel(newStatus, boardList, index);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true)
        const payload = {
            projectId: `${projectDetailsReducer.id}`,
            title: newStatus.title,
        }
        const data = await apiService.createBoard(payload);
        const clone = [...boardList];

        if (data.success) {
            clone.push(data.data);
            clone.splice(index, 1);

            const reversedClone = [...clone].reverse();

            setBoardList(reversedClone);
            dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, boards: reversedClone }));

            toast({ description: data.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }

        setIsSave(false);
        setIsEdit(null);
    };

    const createNewBoard = () => {
        const clone = [...boardList];
        const allowedLimit = BOARD_LIMITS[projectDetailsReducer.plan || 0];
        if (clone.length >= allowedLimit) {
            onProModal(true);
            return;
        }
        onProModal(false);
        clone.push(initialState);

        const reversedClone = [...clone]

        setBoardList(reversedClone);
        setIsEdit(reversedClone.findIndex((x) => x.id === undefined));
        setSelectedIds([]);
    };

    const onEditCancel = () => {
        setIsEdit(null);
        setBoardList([...allStatusAndTypes?.boards].reverse());
    };

    return (
        <Fragment>
            {
                (openDelete || deleteType === 'all') &&
                <DeleteDialog
                    title={deleteType === 'single' ? "Are you sure you want to delete this Board?" : `Are you sure you want to delete the selected ${selectedIds?.length > 1 ? 'Boards' : 'Board'}`}
                    isOpen={openDelete}
                    onOpenChange={() => {
                        setOpenDelete(false);
                        setDeleteType('');
                    }}
                    onDelete={deleteParticularRow}
                    isDeleteLoading={isLoadingDelete}
                    deleteRecord={deleteType === 'single' ? deleteId : selectedIds}
                />
            }

            <Card>
                <CardHeader className={"flex flex-row flex-wrap md:flex-nowrap justify-between gap-x-6 items-center p-4 sm:px-5 sm:py-4 gap-y-2"}>
                    <div>
                        <CardTitle className={"text-xl lg:text-2xl font-medium"}>Board</CardTitle>
                        <CardDescription className={"text-sm text-muted-foreground p-0"}>Create and manage boards to organize your roadmap feedback.</CardDescription>
                    </div>
                    <Button disabled={isEdit != null} className={"gap-2 font-medium hover:bg-primary m-0"} onClick={createNewBoard}>
                        <Plus size={18} strokeWidth={3} />New Board
                    </Button>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                    <div className={"overflow-auto whitespace-nowrap max-h-[456px]"}>
                        <Table>
                            <TableHeader className={"bg-muted sticky top-0 z-10"}>
                                <TableRow className={"relative"}>
                                    <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                        <div className="items-center flex space-x-2">
                                            <Checkbox
                                                id={"all"}
                                                checked={boardList.length > 0 && selectedIds.length === boardList.length}
                                                disabled={isLoading || !boardList?.length}
                                                onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                            />
                                            {
                                                (selectedIds.length > 0) &&
                                                <div className={'absolute left-[20px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                    <div>
                                                        <label
                                                            htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                            className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                            {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All boards are selected`}
                                                        </label>
                                                    </div>

                                                    {selectedIds.length > 0 && (
                                                        <div className="flex items-center gap-2 sticky right-2">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span>
                                                                        <Button
                                                                            className={'h-8 w-8'}
                                                                            variant={"outline"}
                                                                            size={"icon"}
                                                                            disabled={isLoading || !boardList?.length || selectedIds.length === 0 || selectedIds.length === boardList.length}
                                                                            onClick={() => handleDeleteBoard(null, 'all')}
                                                                        >
                                                                            <Trash2 size={15} className={"text-destructive"} />
                                                                        </Button>
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className={"font-normal text-sm"}>
                                                                    {selectedIds.length === boardList.length ?
                                                                        "Cannot delete all boards - one is required." :
                                                                        `Delete Selected ${selectedIds?.length > 1 ? 'Boards' : 'Board'}`}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        </div>
                                    </TableHead>
                                    {
                                        ["Board name", "Updated Date", "Action"].map((x, i) => {
                                            return (
                                                <TableHead key={i} className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground ${i === 0 ? "w-2/5" : i === 1 ? "w-2/5" : ""}`}>{x}</TableHead>
                                            )
                                        })
                                    }
                                </TableRow>
                            </TableHeader>
                            <TableBody className={"overflow-y-auto"}>
                                {
                                    boardList.length > 0 ?
                                        <Fragment>
                                            {
                                                (boardList || []).map((x, i) => {
                                                    return (
                                                        <TableRow key={i}>
                                                            {
                                                                isEdit == i ?
                                                                    <Fragment>
                                                                        <TableCell className={"px-[12px] py-[10px]"} />
                                                                        <TableCell className={"px-[12px] py-[10px]"}>
                                                                            <Input
                                                                                autoFocus
                                                                                className={"bg-card h-9"}
                                                                                type="title"
                                                                                value={x.title}
                                                                                name={"title"}
                                                                                onBlur={onBlur}
                                                                                onChange={(e) => handleInputChange(e, i)}
                                                                                placeholder={"Enter board name"}
                                                                            />
                                                                            {
                                                                                formError.title ?
                                                                                    <div className="grid gap-2 mt-[4px]">
                                                                                        {formError.title && <span className="text-red-500 text-sm">{formError.title}</span>}
                                                                                    </div> : ""
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className={"px-[12px] py-[10px]"} />
                                                                        <TableCell className={`px-2 py-[10px] md:px-3 font-medium ${formError.title ? "align-top" : "align-middle"} text-xs text-muted-foreground`}>
                                                                            <div className={"flex gap-2 items-center"}>
                                                                                <Fragment>
                                                                                    {
                                                                                        x.id ? <Button disabled={isSave}
                                                                                            variant="outline hover:bg-transparent"
                                                                                            className={`p-1 border w-[30px] h-[30px] ${isSave ? "justify-center items-center" : ""}`}
                                                                                            onClick={() => updateBoard(i)}
                                                                                        >
                                                                                            {isSave ? <Loader2 className="h-4 w-4 animate-spin justify-center" /> : <Check size={16} />}
                                                                                        </Button> : <Button disabled={isSave}
                                                                                            className="text-sm font-medium h-[30px] w-[92px] hover:bg-primary"
                                                                                            onClick={() => addBoard(x, i)}
                                                                                        >
                                                                                            {isSave ? <Loader2 className={"h-4 w-4 animate-spin"} /> : "Add Board"}
                                                                                        </Button>
                                                                                    }

                                                                                    <Button
                                                                                        variant="outline hover:bg-transparent"
                                                                                        className="p-1 border w-[30px] h-[30px]"
                                                                                        onClick={() => x.id ? onEditCancel() : onEdit(null)}
                                                                                    >
                                                                                        <X size={16} />
                                                                                    </Button>
                                                                                </Fragment>
                                                                            </div>
                                                                        </TableCell>
                                                                    </Fragment>
                                                                    :
                                                                    <Fragment>
                                                                        <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                                            <Checkbox
                                                                                checked={selectedIds.includes(x.id)}
                                                                                onCheckedChange={() => handleCheckboxChange(x.id)}
                                                                                disabled={boardList.filter(board => board.id).length === 1}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className={`px-2 py-[10px] md:px-3 font-medium text-xs max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-muted-foreground`}>
                                                                            {x.title}
                                                                        </TableCell>
                                                                        <TableCell className={`px-2 py-[10px] md:px-3 font-medium text-xs text-muted-foreground`}>
                                                                            {dayjs.utc(x?.updatedAt).local().startOf('seconds').fromNow()}
                                                                        </TableCell>
                                                                        <TableCell className={`flex px-2 py-[10px] md:px-3 text-muted-foreground `}>
                                                                            <Fragment>
                                                                                <div className="pr-0">
                                                                                    <Button onClick={() => onEdit(i)} disabled={selectedIds.length > 0} variant={"outline hover:bg-transparent"} className={`p-1 border w-[30px] h-[30px] `}>
                                                                                        <Pencil size={16} />
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="pl-2">
                                                                                    <Button
                                                                                        // disabled={boardList.filter(board => board.id).length === 1 || selectedIds.length === boardList.length}
                                                                                        disabled={selectedIds.length > 0 || boardList.filter(board => board.id).length === 1}
                                                                                        onClick={() => { handleDeleteBoard(x.id) }} variant={"outline hover:bg-transparent"}
                                                                                        className={`p-1 border w-[30px] h-[30px]`}
                                                                                    >
                                                                                        <Trash2 size={16} />
                                                                                    </Button>
                                                                                </div>
                                                                            </Fragment>
                                                                        </TableCell>
                                                                    </Fragment>
                                                            }
                                                        </TableRow>
                                                    )
                                                })
                                            }
                                        </Fragment> : <TableRow className={"hover:bg-transparent"}><TableCell colSpan={6}><EmptyData /></TableCell></TableRow>
                                }
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </Fragment>
    );
};

export default Board;