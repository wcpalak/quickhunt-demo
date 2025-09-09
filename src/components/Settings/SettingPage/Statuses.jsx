import React, { Fragment, useState, useEffect, } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Button } from "../../ui/button";
import { Check, GripVertical, Loader2, Pencil, Plus, Square, Trash2, X } from "lucide-react";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../ui/table";
import ColorInput from "../../Comman/ColorPicker";
import { Input } from "../../ui/input";
import { useTheme } from "../../theme-provider";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "../../ui/use-toast";
import { allStatusAndTypesAction } from "../../../redux/action/AllStatusAndTypesAction";
import EmptyData from "../../Comman/EmptyData";
import randomColor from 'randomcolor';
import DeleteDialog from "../../Comman/DeleteDialog";
import { Checkbox } from "../../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { apiService, normalizeName } from "../../../utils/constent";

const initialStatus = { title: '', colorCode: '', };

const initialDnDState = {
    draggedFrom: null,
    draggedTo: null,
    isDragging: false,
    originalOrder: [],
    updatedOrder: []
}

const Statuses = () => {
    const { onProModal } = useTheme();
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);

    const [labelError, setLabelError] = useState(initialStatus);
    const [dragAndDrop, setDragAndDrop] = useState(initialDnDState);
    const [statusList, setStatusList] = useState([]);
    const [isEdit, setIsEdit] = useState(null);
    const [isSave, setIsSave] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('')
    const [touchStartIndex, setTouchStartIndex] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null); // highlight row

    useEffect(() => {
        if (allStatusAndTypes.roadmapStatus) {
            getAllRoadmapStatus();
        }
    }, [allStatusAndTypes.roadmapStatus]);

    const getAllRoadmapStatus = () => {
        setStatusList(allStatusAndTypes.roadmapStatus);
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
            const allIds = (statusList || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const deleteParticularRow = async () => {
        setIsDeleteLoading(true);
        if (deleteType === 'single') {
            const clone = [...statusList];
            const indexToDelete = clone.findIndex((x) => x.id == deleteId);
            if (deleteId) {
                const data = await apiService.onDeleteSettingsStatus(deleteId);
                if (data.success) {
                    clone.splice(indexToDelete, 1);
                    setStatusList(clone);
                    dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, roadmapStatus: clone }));
                    toast({ description: data.message });
                } else {
                    toast({ description: data?.error?.message, variant: "destructive" });
                }
            }
        } else {
            const payload = {
                roadmapStatusIds: selectedIds,
                projectId: projectDetailsReducer.id,
            };
            const data = await apiService.statusBatchUpdate(payload);
            if (data.success) {
                const updatedLabels = statusList.filter(item => !selectedIds.includes(item.id));
                setStatusList(updatedLabels);
                dispatch(allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    roadmapStatus: updatedLabels
                }));
                setSelectedIds([]);
                toast({ description: data.message });
            } else {
                toast({ variant: "destructive", description: data.error.message });
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
        setStatusList(allStatusAndTypes.roadmapStatus);
        setIsEdit(null);
    };

    const handleInputChange = (event, index) => {
        const { name, value } = event.target;
        const cleanedValue = name === "title" ? value.trimStart() : value;
        const updatedColors = [...statusList];
        updatedColors[index] = { ...updatedColors[index], [name]: cleanedValue };
        setStatusList(updatedColors);
        setLabelError({
            ...labelError,
            [name]: validation(name, cleanedValue)
        });
    };

    const onBlur = (event) => {
        const { name, value } = event.target;
        const currentIndex = isEdit;
        const currentLabel = statusList[currentIndex] || {};

        const validationErrors = validateLabel(
            { ...currentLabel, [name]: value },
            statusList,
            currentIndex
        );

        setLabelError({
            ...labelError,
            [name]: validationErrors[name] || ""
        });
    };

    const validation = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Status name is required."
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    }

    const validateLabel = (status, statusList, currentIndex) => {
        const errors = {};

        if (!status.title || status.title.trim() === "") {
            errors.title = "Status name is required.";
        } else if (status.title.length > 255) {
            errors.title = "Status name must not exceed 255 characters.";
        }

        const isDuplicateColor = statusList.some(
            (item, i) => i !== currentIndex && item.colorCode.toLowerCase() === status.colorCode.toLowerCase()
        );
        if (isDuplicateColor) {
            errors.colorCode = "A status with this color already exists.";
        }

        const normalizedName = normalizeName(status.title);
        const isDuplicateName = statusList.some(
            (item, i) => i !== currentIndex && normalizeName(item.title) === normalizedName
        );
        if (isDuplicateName) {
            errors.title = "A status with this name already exists.";
        }

        return errors;
    };

    const onChangeColorColor = (newColor, isValid, index) => {
        const updatedColors = [...statusList];
        updatedColors[index] = { ...updatedColors[index], colorCode: newColor };
        setStatusList(updatedColors);
        if (isValid) {
            const isDuplicateColor = statusList.some((label, i) => i !== index && label.colorCode.toLowerCase() === newColor.toLowerCase());
            setLabelError({ ...labelError, colorCode: isDuplicateColor ? "A status with this color already exists." : "", });
        } else {
            setLabelError({ ...labelError, colorCode: "", });
        }
    };

    const handleShowInput = () => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            const clone = [...statusList];
            clone.push({ title: '', colorCode: randomColor(), });
            setIsEdit(clone.length - 1);
            setStatusList(clone);
            setLabelError(initialStatus);
        }
        setSelectedIds([]);
    };

    const handleAddNewStatus = async (newStatus, index) => {
        const validationErrors = validateLabel(newStatus, statusList, index);

        if (Object.keys(validationErrors).length > 0) {
            setLabelError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true)
        const payload = {
            projectId: `${projectDetailsReducer.id}`,
            title: newStatus.title,
            colorCode: newStatus.colorCode,
        }
        const data = await apiService.createSettingsStatus(payload)
        if (data.success) {
            let clone = [...statusList];
            clone[index] = { ...data.data };
            setStatusList(clone);
            dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, roadmapStatus: clone }))
            setIsSave(false);
            setIsEdit(null);
            toast({ description: data.message })
        } else {
            setIsSave(false)
            toast({ description: data?.error?.message, variant: "destructive", })
        }
    };

    const handleSaveStatus = async (index) => {
        const updatedColors = [...statusList];
        const labelToSave = updatedColors[index];
        const validationErrors = validateLabel(labelToSave, statusList, index);

        if (Object.keys(validationErrors).length > 0) {
            setLabelError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        const payload = {
            projectId: `${projectDetailsReducer.id}`,
            title: labelToSave.title,
            colorCode: labelToSave.colorCode,
        }
        setIsSave(true)
        const data = await apiService.updateSettingsStatus(payload, labelToSave.id)
        setIsSave(false)
        if (data.success) {
            let clone = [...statusList];
            let index = clone.findIndex((x) => x.id === labelToSave.id);
            if (index !== -1) {
                clone[index] = data.data;
                setStatusList(clone)
                dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, roadmapStatus: clone }))
            }
            toast({ description: data.message })
        } else {
            toast({ description: data?.error.message, variant: "destructive" })
        }
        updatedColors[index] = { ...labelToSave };
        setStatusList(updatedColors);
        setIsEdit(null);
    };

    const onEdit = (index) => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            setLabelError(initialStatus);
            const clone = [...statusList]
            if (isEdit !== null && !clone[isEdit]?.id) {
                clone.splice(isEdit, 1)
                setIsEdit(index)
                setStatusList(clone)
            } else if (isEdit !== index) {
                setStatusList(allStatusAndTypes?.roadmapStatus);
                setIsEdit(index);
            } else {
                setIsEdit(index)
            }
        }
    }

    const onEditCancel = () => {
        setIsEdit(null)
        setStatusList(allStatusAndTypes.roadmapStatus)
    }

    const onDragStart = (event) => {
        const initialPosition = Number(event.currentTarget.dataset.position);
        setDragAndDrop({
            ...dragAndDrop,
            draggedFrom: initialPosition,
            isDragging: true,
            originalOrder: statusList
        });
        setDraggedIndex(initialPosition);
        event.dataTransfer.setData("text/html", '');
    }

    const onDragOver = (event) => {
        event.preventDefault();
        let newList = dragAndDrop.originalOrder;
        const draggedFrom = dragAndDrop.draggedFrom;
        const draggedTo = Number(event.currentTarget.dataset.position);
        const itemDragged = newList[draggedFrom];
        const remainingItems = newList.filter((item, index) => index !== draggedFrom);
        newList = [
            ...remainingItems.slice(0, draggedTo),
            itemDragged,
            ...remainingItems.slice(draggedTo)
        ];
        if (draggedTo !== dragAndDrop.draggedTo) {
            setDragAndDrop({
                ...dragAndDrop,
                updatedOrder: newList,
                draggedTo: draggedTo
            })
        }

    }

    const onDrop = async (event) => {
        const clone = [];
        const rank = [];
        dragAndDrop.updatedOrder.map((x, i) => {
            clone.push({ ...x, rank: i, })
            rank.push({ rank: i, id: x.id })
        });
        const payload = {
            ranks: rank
        }
        setStatusList(clone);
        dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, roadmapStatus: clone }));
        setDragAndDrop({
            ...dragAndDrop,
            draggedFrom: null,
            draggedTo: null,
            isDragging: false
        });
        const data = await apiService.roadmapSettingsStatusRank(payload)
        if (data.success) {
            toast({ description: data.message })
        } else {
            toast({ description: data?.error.message, variant: "destructive" })
        }
        setDraggedIndex(null);
    }

    const onDragLeave = () => {
        setDragAndDrop({
            ...dragAndDrop,
            draggedTo: null
        });
    }

    const handleTouchStart = (e, index) => {
        setTouchStartIndex(index);
        setDraggedIndex(index);
    };
    
    const handleTouchMove = (e, index) => {
        if (touchStartIndex === null) return;
    
        e.preventDefault(); // prevent scrolling while dragging
        const touch = e.touches[0];
        const targetRow = document.elementFromPoint(touch.clientX, touch.clientY)?.closest("tr");
    
        if (!targetRow) return;
        const newIndex = Number(targetRow.dataset.position);
    
        if (!isNaN(newIndex) && newIndex !== index && newIndex !== touchStartIndex) {
            let newList = [...statusList];
            const [moved] = newList.splice(touchStartIndex, 1);
            newList.splice(newIndex, 0, moved);
    
            setStatusList(newList);
            setTouchStartIndex(newIndex); // update new "drag position"
        }
    };
    
    const handleTouchEnd = async () => {
        if (touchStartIndex === null) return;
    
        // mimic your existing onDrop logic
        const clone = [];
        const rank = [];
        statusList.forEach((x, i) => {
            clone.push({ ...x, rank: i });
            rank.push({ rank: i, id: x.id });
        });
    
        const payload = { ranks: rank };
        setStatusList(clone);
        dispatch(allStatusAndTypesAction({ ...allStatusAndTypes, roadmapStatus: clone }));
    
        setTouchStartIndex(null);
        setDraggedIndex(null);
    
        const data = await apiService.roadmapSettingsStatusRank(payload);
        if (data.success) {
            toast({ description: data.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    };

    return (
        <Fragment>
            {
                (openDelete || deleteType === 'all') &&
                <DeleteDialog
                    title={deleteType === 'single' ? "Are you sure you want to delete the status?" : `Are you sure you want to delete the selected ${selectedIds?.length > 1 ? 'Statuses' : 'Status'}`}
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
                <CardHeader
                    className="flex flex-row flex-wrap gap-y-2 justify-between items-center border-b p-4 sm:px-5 sm:py-4">
                    <div>
                        <CardTitle className="text-xl lg:text-2xl font-medium">Statuses</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground p-0">
                            Manage the statuses you want to use on your roadmap.
                        </CardDescription>
                    </div>
                    <Button
                        disabled={isEdit !== null}
                        className={"gap-2 font-medium hover:bg-primary m-0"}
                        onClick={handleShowInput}
                    >
                        <Plus strokeWidth={3} size={18} />New Status
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className={"overflow-auto max-h-[456px] whitespace-nowrap"}>
                        <Table>
                            <colgroup>
                                <col style={{ width: '48px' }} />
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: '35%' }} />
                                <col style={{ width: '30%' }} />
                                <col style={{ width: '25%' }} />
                            </colgroup>
                            <TableHeader className={"bg-muted sticky top-0 z-10"}>
                                <TableRow className={"relative"}>
                                    <TableHead className={`px-2 py-[6px] h-10 md:px-3`} />
                                    <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                        <div className="items-center flex space-x-2">
                                            <Checkbox
                                                id={"all"}
                                                checked={statusList.length > 0 && selectedIds.length === statusList.length}
                                                disabled={isLoading || !statusList?.length}
                                                onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                            />
                                            {
                                                (selectedIds.length > 0) &&
                                                <div className={'absolute left-[71px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_80px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                    <div>
                                                        <label
                                                            htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                            className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                            {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All statuses are selected`}
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
                                                                            disabled={isLoading || !statusList?.length || selectedIds.length === 0 || selectedIds.length === statusList.length}
                                                                            onClick={() => handleDeleteStatus(null, 'all')}
                                                                        >
                                                                            <Trash2 size={15} className={"text-destructive"} />
                                                                        </Button>
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className={"font-normal text-sm"}>
                                                                    {selectedIds.length === statusList.length ?
                                                                        "Cannot delete all statuses - one is required." :
                                                                        `Delete Selected ${selectedIds?.length > 1 ? 'Statuses' : 'Status'}`}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        </div>
                                    </TableHead>
                                    {
                                        ["Status Name", "Status Color", "Action"].map((x, i) => {
                                            return (
                                                <TableHead key={i} className="px-2 py-[10px] md:px-3 font-medium text-card-foreground">{x}</TableHead>
                                            )
                                        })
                                    }
                                </TableRow>
                            </TableHeader>
                            <TableBody className={"overflow-y-auto"}>
                                {
                                    statusList.length > 0 ? <Fragment>
                                        {(statusList || []).map((x, i) => (
                                            <TableRow
                                                id={i}
                                                key={i}
                                                position={i}
                                                data-position={i}
                                                draggable={!isEdit}
                                                onDragStart={onDragStart}
                                                onDragOver={isEdit ? null : onDragOver}
                                                onDrop={onDrop}
                                                onDragLeave={onDragLeave}
                                                onTouchStart={(e) => handleTouchStart(e, i)}
                                                onTouchMove={(e) => handleTouchMove(e, i)}
                                                onTouchEnd={handleTouchEnd}
                                                className={`table-row-anim ${draggedIndex === i ? "opacity-50 bg-muted scale-[0.98] shadow-md" : ""}`}
                                            >
                                                <TableCell className={`px-[12px] py-[10px]`}>
                                                    <GripVertical className={"cursor-grab"} size={16} />
                                                </TableCell>
                                                {
                                                    isEdit === i ?
                                                        <Fragment>
                                                            <TableCell className={"px-[12px] py-[10px]"} />
                                                            <TableCell className={`px-[12px] py-[10px] align-top`}>
                                                                <Input
                                                                    autoFocus
                                                                    className={"bg-card h-9"}
                                                                    type="title"
                                                                    value={x.title}
                                                                    name={"title"}
                                                                    onBlur={onBlur}
                                                                    onChange={(e) => handleInputChange(e, i)}
                                                                    placeholder={"Enter status name"}
                                                                />
                                                                {
                                                                    labelError.title ?
                                                                        <div className="grid gap-2 mt-[4px]">
                                                                            <span
                                                                                className="text-red-500 text-sm">{labelError.title}</span>
                                                                        </div> : ""
                                                                }
                                                            </TableCell>
                                                            <TableCell
                                                                className={`font-medium text-xs px-[12px] py-[10px] align-top text-muted-foreground`}>
                                                                <div className={"flex items-center"}>
                                                                    <ColorInput name={"clr"} value={x.colorCode}
                                                                        onChange={(color, isValid) => onChangeColorColor(color, isValid, i)} />
                                                                </div>
                                                                {labelError.colorCode && (
                                                                    <div className="grid gap-2 mt-[4px]">
                                                                        <span className="text-red-500 font-normal text-sm">{labelError.colorCode}</span>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell
                                                                className={`px-[12px] py-[10px] ${(labelError) ? 'align-top' : 'align-middle'} text-muted-foreground`}>
                                                                <div className={"flex items-center gap-2"}>
                                                                    <Fragment>
                                                                        {
                                                                            x.id ? <Button disabled={isSave}
                                                                                variant="outline hover:bg-transparent"
                                                                                className={`p-1 border w-[30px] h-[30px] ${isSave ? "justify-center items-center" : ""}`}
                                                                                onClick={() => handleSaveStatus(i)}
                                                                            >
                                                                                {isSave ? <Loader2
                                                                                    className="h-4 w-4 animate-spin justify-center" /> :
                                                                                    <Check size={16} />}
                                                                            </Button> : <Button disabled={isSave}
                                                                                className="text-sm font-medium h-[30px] w-[93px] hover:bg-primary"
                                                                                onClick={() => handleAddNewStatus(x, i)}
                                                                            >
                                                                                {isSave ? <Loader2
                                                                                    className={"h-4 w-4 animate-spin"} /> : "Add Status"}
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
                                                                    disabled={statusList.filter(status => status.id).length === 1}
                                                                />
                                                            </TableCell>
                                                            <TableCell
                                                                className={`px-2 py-[10px] md:px-3 font-medium text-xs max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-muted-foreground`}>{x.title}</TableCell>
                                                            <TableCell
                                                                className={`font-medium text-xs px-[12px] py-[10px] text-muted-foreground`}>
                                                                <div className={"flex items-center gap-1"}>
                                                                    <Square size={16} strokeWidth={1} fill={x.colorCode}
                                                                        stroke={x.colorCode} />
                                                                    <p>{x.colorCode}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell
                                                                className={`flex gap-2 px-[12px] py-[10px] text-muted-foreground`}>
                                                                <Fragment>
                                                                    <Button
                                                                        variant="outline hover:bg-transparent"
                                                                        className="p-1 border w-[30px] h-[30px]"
                                                                        onClick={() => onEdit(i)}
                                                                        disabled={selectedIds.length > 0}
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline hover:bg-transparent"
                                                                        className="p-1 border w-[30px] h-[30px]"
                                                                        onClick={() => handleDeleteStatus(x.id, i)}
                                                                        // disabled={statusList.filter(stat => stat.id).length === 1 || selectedIds.length === statusList.length}
                                                                        disabled={selectedIds.length > 0 || statusList.filter(stat => stat.id).length === 1}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </Fragment>
                                                            </TableCell>
                                                        </Fragment>
                                                }
                                            </TableRow>
                                        ))}
                                    </Fragment> :
                                        <TableRow className={"hover:bg-transparent"}>
                                            <TableCell colSpan={6}>
                                                <EmptyData />
                                            </TableCell>
                                        </TableRow>
                                }
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </Fragment>
    );
};

export default Statuses;
