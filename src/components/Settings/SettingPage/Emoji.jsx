import React, {Fragment, useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../ui/card";
import {Button} from "../../ui/button";
import {Check, Loader2, Pencil, Plus, Trash2, X} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import {useTheme} from "../../theme-provider";
import EmojiPicker from "emoji-picker-react";
import {Popover, PopoverContent} from "../../ui/popover";
import {PopoverTrigger} from "@radix-ui/react-popover";
import {Input} from "../../ui/input";
import {useSelector} from "react-redux";
import {toast} from "../../ui/use-toast";
import {useDispatch} from "react-redux";
import {allStatusAndTypesAction} from "../../../redux/action/AllStatusAndTypesAction";
import EmptyData from "../../Comman/EmptyData";
import DeleteDialog from "../../Comman/DeleteDialog";
import {apiService} from "../../../utils/constent";
import {Checkbox} from "../../ui/checkbox";
import {Tooltip, TooltipContent, TooltipTrigger} from "../../ui/tooltip";

const Emoji = () => {
    const dispatch = useDispatch();
    const {onProModal} = useTheme();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);

    const [selectedEmoji, setSelectedEmoji] = useState({});
    const [emojiList, setEmojiList] = useState([]);
    const [deleteId, setDeleteId] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [isSave, setIsSave] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isChangeEditEmoji, setIsChangeEditEmoji] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        if (allStatusAndTypes.emoji) {
            getAllEmoji();
        }
    }, [allStatusAndTypes.emoji])

    const getAllEmoji = async () => {
        setEmojiList(allStatusAndTypes.emoji);
        setIsLoading(false)
    }

    const handleCheckboxChange = (id) => {
        setSelectedIds((prev) => {
            const newSelectedIds = prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id];
            return newSelectedIds;
        });
    };

    const handleSelectAll = (isChecked) => {
        setAllSelectedDelete(0);
        if (isChecked) {
            const allIds = (emojiList || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const deleteParticularRow = async () => {
        setIsDeleteLoading(true);
        if (deleteType === 'single') {
            const clone = [...emojiList];
            const indexToDelete = clone.findIndex((x) => x.id == deleteId);
            if (deleteId) {
                const data = await apiService.deleteEmoji(deleteId);
                if (data.success) {
                    clone.splice(indexToDelete, 1);
                    setEmojiList(clone);
                    dispatch(allStatusAndTypesAction({...allStatusAndTypes, emoji: clone}));
                    toast({description: data.message});
                } else {
                    toast({description: data?.error?.message, variant: "destructive"});
                }
            }
        } else {
            const payload = {
                emojiIds: selectedIds,
                projectId: projectDetailsReducer.id,
            };
            const data = await apiService.emojiBatchUpdate(payload);
            if (data.success) {
                const updatedLabels = emojiList.filter(item => !selectedIds.includes(item.id));
                setEmojiList(updatedLabels);
                dispatch(allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    emoji: updatedLabels
                }));
                setSelectedIds([]);
                toast({description: data.message});
            } else {
                toast({variant: "destructive", description: data.error.message});
            }
        }
        setOpenDelete(false);
        setIsDeleteLoading(false);
    };

    const handleDeleteStatus = (id, type = 'single') => {
        if (type === 'all') {
            setDeleteType('all');
            setOpenDelete(true);
        } else {
            setDeleteId(id);
            setDeleteType('single');
            setOpenDelete(true);
        }
        setEmojiList(allStatusAndTypes.emoji);
        setIsEdit(null);
    };

    const handleEmojiSelect = (event) => {
        if (isEdit) {
            setIsChangeEditEmoji(true);
        }
        setSelectedEmoji(event);
        setValidationError('');
    };

    const newEmoji = () => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            const clone = [...emojiList];
            clone.push({});
            setEmojiList(clone);
            setEditIndex(clone.length - 1);
            setValidationError("");
        }
        setSelectedIds([]);
    };

    const addEmoji = async (index) => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            if (!selectedEmoji.imageUrl) {
                setValidationError('Emoji is required.');
                return;
            }
            const emojiExists = emojiList.some(
                emoji => emoji.emojiUrl === selectedEmoji.imageUrl
            );

            if (emojiExists) {
                toast({description: "This emoji already exists!", variant: "destructive"});
                return;
            }
            setIsSave(true);
            const payload = {
                emoji: selectedEmoji.emoji,
                emojiUrl: selectedEmoji.imageUrl,
                projectId: projectDetailsReducer.id
            }
            const data = await apiService.createEmoji(payload);
            if (data.success) {
                const clone = [...emojiList];
                clone.push({id: data.data.id, emoji: selectedEmoji.emoji, emojiUrl: selectedEmoji.imageUrl,});
                clone.splice(index, 1);
                setEmojiList(clone);
                dispatch(allStatusAndTypesAction({...allStatusAndTypes, emoji: clone}))
                toast({description: data.message});
                setIsSave(false);
            } else {
                setIsSave(false);
                toast({description: data?.error?.message, variant: "destructive"});
            }
            setSelectedEmoji({});
            setIsChangeEditEmoji(false);
            setEditIndex(null);
        }
    };

    const handleSaveEmoji = async (index) => {
        const cloneEmojiList = [...emojiList];
        const emojiToSave = cloneEmojiList[index];
        const payload = {
            projectId: projectDetailsReducer.id,
            emoji: selectedEmoji.emoji,
            emojiUrl: selectedEmoji.imageUrl ? selectedEmoji.imageUrl : emojiToSave.emojiUrl
        }
        const emojiExists = emojiList.some(
            (emoji, i) => i !== index && emoji.emojiUrl === payload.emojiUrl
        );

        if (emojiExists) {
            toast({description: "This emoji already exists!", variant: "destructive"});
            return;
        }
        setIsSave(true);
        const data = await apiService.updateEmoji(payload, emojiToSave.id);
        setIsSave(false);
        if (data.success) {
            const clone = [...emojiList];
            clone[index] = {
                projectId: projectDetailsReducer.id,
                emoji: selectedEmoji.emoji,
                emojiUrl: payload.emojiUrl,
                id: emojiToSave.id
            };
            setEmojiList(clone);
            dispatch(allStatusAndTypesAction({...allStatusAndTypes, emoji: clone}))
            setEditIndex(null);
            setSelectedEmoji({});
            toast({description: data.message});
            setIsEdit(false);
            setIsChangeEditEmoji(false);
        } else {
            toast({description: data?.error?.message, variant: "destructive"});
            setIsEdit(false);
            setIsChangeEditEmoji(false);
        }
    };

    const onEdit = (record = {}, index = null) => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            setSelectedEmoji(record);
            setIsEdit(true);
            const clone = [...emojiList]
            if (editIndex !== null && !clone[editIndex]?.id) {
                clone.splice(editIndex, 1)
                setEditIndex(index)
                setEmojiList(clone)
            } else if (editIndex !== index) {
                setEmojiList(allStatusAndTypes?.emoji);
                setEditIndex(index);
            } else {
                setEditIndex(index);
            }
            setIsChangeEditEmoji(false);
        }
    };

    const onEditCancel = () => {
        setEditIndex(null);
        setIsChangeEditEmoji(false);
        setEmojiList(allStatusAndTypes.emoji);
        setSelectedEmoji({});
    };

    return (
        <Fragment>
            {
                (openDelete || deleteType === 'all') &&
                <DeleteDialog
                    title={deleteType === 'single' ? "Are you sure you want to delete this Emoji?" : `Are you sure you want to delete the selected ${selectedIds?.length > 1 ? 'Emojis' : 'Emoji'}`}
                    isOpen={openDelete}
                    onOpenChange={() => {
                        setOpenDelete(false);
                        setDeleteType('');
                    }}
                    onDelete={deleteParticularRow}
                    isDeleteLoading={isDeleteLoading}
                    deleteRecord={deleteType === 'single' ? deleteId : selectedIds}
                />
            }
            <Card>
                <CardHeader className={"p-4 sm:px-5 sm:py-4 gap-1 border-b flex flex-row justify-between items-center flex-wrap gap-y-2"}>
                    <div>
                        <CardTitle className={"text-xl lg:text-2xl font-medium"}>Emoji</CardTitle>
                        <CardDescription className={"text-sm text-muted-foreground p-0"}>Add emojis to make your changelog clear and engaging.</CardDescription>
                    </div>
                    <Button onClick={newEmoji} disabled={editIndex != null} className={"gap-2 font-medium hover:bg-primary m-0"}>
                        <Plus strokeWidth={3} size={18}/> New Emoji
                    </Button>
                </CardHeader>
                <CardContent className={"p-0"}>
                    <div className={"overflow-auto whitespace-nowrap max-h-[456px]"}>
                    <Table>
                        <TableHeader className={`bg-muted sticky top-0 z-10`}>
                            <TableRow className={"relative"}>
                                <TableHead colSpan={2} className={`px-2 py-[6px] h-10 md:px-3`}>
                                    <div className="items-center flex space-x-5">
                                        <Checkbox
                                            id={"all"}
                                            checked={emojiList.length > 0 && selectedIds.length === emojiList.length}
                                            disabled={isLoading || !emojiList?.length}
                                            onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                        />
                                        <span className={"text-card-foreground"}>Emoji</span>
                                        {
                                            (selectedIds.length > 0) &&
                                            <div className={'absolute left-[9px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                <div>
                                                    <label htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                        className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                        {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All emojis are selected`}
                                                    </label>
                                                </div>

                                                {selectedIds.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span>
                                                                <Button
                                                                    className={'sticky right-2 h-8 w-8'}
                                                                    variant={"outline"}
                                                                    size={"icon"}
                                                                    disabled={isLoading || !emojiList?.length || selectedIds.length === 0 || selectedIds.length === emojiList.length}
                                                                    onClick={() => handleDeleteStatus(null, 'all')}
                                                                >
                                                                    <Trash2 size={15} className={"text-destructive"}/>
                                                                </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className={"font-normal text-sm"}>
                                                                {selectedIds.length === emojiList.length ?
                                                                    "Cannot delete all emojis - one is required." :
                                                                    `Delete Selected ${selectedIds?.length > 1 ? 'Emojis' : 'Emoji'}`}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    </div>
                                </TableHead>
                                {
                                    ["Action"].map((x, i) => {
                                        return (
                                            <TableHead
                                                className={`px-2 py-[10px] md:px-3 text-sm font-medium text-card-foreground w-1/2 ${i == 0 ? "w-2/5 text-right" : ""}`}
                                                key={x}>{x}</TableHead>
                                        )
                                    })
                                }
                            </TableRow>
                        </TableHeader>
                        <TableBody className={"overflow-y-auto"}>
                            {
                                emojiList.length > 0 ? <>
                                    {
                                        (emojiList || []).map((x, i) => {
                                            return (
                                                <TableRow key={i}>
                                                    {
                                                        editIndex == i ?
                                                            <Fragment>
                                                                <TableCell colSpan={2} className={"px-[12px] py-[10px]"}>
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <div className={""}>
                                                                                {selectedEmoji.emojiUrl ?
                                                                                    <div
                                                                                        className={"border border-input w-full p-1 rounded-md bg-background cursor-pointer"}>
                                                                                        <img
                                                                                            className={"cursor-pointer h-[25px] w-[25px]"}
                                                                                            alt={"not-found"}
                                                                                            src={selectedEmoji?.emojiUrl}/>
                                                                                    </div>
                                                                                    : selectedEmoji?.imageUrl ? <div
                                                                                            className={"border border-input w-full p-1 rounded-md bg-background cursor-pointer"}>
                                                                                            <img
                                                                                                className={"cursor-pointer h-[25px] w-[25px]"}
                                                                                                alt={"not-found"}
                                                                                                src={selectedEmoji?.imageUrl}/>
                                                                                        </div>
                                                                                        : isChangeEditEmoji ? <div
                                                                                                className={"border border-input w-full p-1 rounded-md bg-background cursor-pointer"}>
                                                                                                <img
                                                                                                    className={"cursor-pointer h-[25px] w-[25px]"}
                                                                                                    alt={"not-found"}
                                                                                                    src={selectedEmoji?.imageUrl}/>
                                                                                            </div>
                                                                                            :
                                                                                            <Input autoFocus readOnly placeholder="Choose an emoji" className="cursor-pointer"/>}
                                                                                {validationError && <span
                                                                                    className={"text-destructive text-sm"}>{validationError}</span>}
                                                                            </div>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent
                                                                            className="w-full p-0 border-none w-[310px]]">
                                                                            <EmojiPicker
                                                                                height={350} autoFocusSearch={true} skinTonesDisabled={true}
                                                                                open={true} searchDisabled={false}
                                                                                onEmojiClick={handleEmojiSelect}/>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </TableCell>
                                                                <TableCell className={`px-[12px] py-[10px] align-middle text-muted-foreground`}>
                                                                    <div className={"flex justify-end items-center gap-2"}>
                                                                        <Fragment>
                                                                            {
                                                                                x.id ? <Button disabled={isSave}
                                                                                    variant="outline hover:bg-transparent"
                                                                                    className={`p-1 border w-[30px] h-[30px]`}
                                                                                    onClick={() => handleSaveEmoji(i)}
                                                                                >
                                                                                    {isSave ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check size={16}/>}
                                                                                </Button> : <Button disabled={isSave}
                                                                                    className="text-sm font-medium h-[30px] w-[90px] hover:bg-primary"
                                                                                    onClick={() => addEmoji(i)}
                                                                                >
                                                                                    {isSave ? <Loader2 className={"h-4 w-4 animate-spin"}/> : "Add Emoji"}
                                                                                </Button>
                                                                            }

                                                                            <Button
                                                                                variant="outline hover:bg-transparent"
                                                                                className="p-1 border w-[30px] h-[30px]"
                                                                                onClick={() => x.id ? onEditCancel() : onEdit()}
                                                                            >
                                                                                <X size={16}/>
                                                                            </Button>
                                                                        </Fragment>
                                                                    </div>
                                                                </TableCell>
                                                            </Fragment>
                                                            :
                                                            <Fragment>
                                                                <TableCell colSpan={2} className={"px-2 py-[10px] md:px-3"}>
                                                                    <div className={"flex items-center gap-5"}>
                                                                        <Checkbox
                                                                            className={"mt-1"}
                                                                            checked={selectedIds.includes(x.id)}
                                                                            onCheckedChange={() => handleCheckboxChange(x.id)}
                                                                            disabled={emojiList.filter(moj => moj.id).length === 1}
                                                                        />
                                                                        <img className={"h-[30px] w-[30px]"} alt={"not-found"} src={x.emojiUrl}/>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell
                                                                    className={`flex justify-end gap-2 px-3 py-[10px] text-muted-foreground`}>
                                                                    <Fragment>
                                                                        <Button
                                                                            variant="outline hover:bg-transparent"
                                                                            className="p-1 border w-[30px] h-[30px]"
                                                                            onClick={() => onEdit(x, i)}
                                                                            disabled={selectedIds.length > 0}
                                                                        >
                                                                            <Pencil size={16}/>
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline hover:bg-transparent"
                                                                            className="p-1 border w-[30px] h-[30px]"
                                                                            onClick={() => handleDeleteStatus(x.id)}
                                                                            // disabled={emojiList.filter(moj => moj.id).length === 1 || selectedIds.length === emojiList.length}
                                                                            disabled={selectedIds.length > 0 || emojiList.filter(moj => moj.id).length === 1}
                                                                        >
                                                                            <Trash2 size={16}/>
                                                                        </Button>
                                                                    </Fragment>
                                                                </TableCell>
                                                            </Fragment>
                                                    }
                                                </TableRow>
                                            )
                                        })
                                    }
                                </> : <TableRow className={"hover:bg-transparent"}><TableCell colSpan={6}><EmptyData/></TableCell></TableRow>
                            }
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </Fragment>
    )
}

export default Emoji;