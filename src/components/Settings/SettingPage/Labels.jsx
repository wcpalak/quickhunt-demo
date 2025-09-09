import React, {Fragment, useEffect, useState,} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../ui/card";
import {Button} from "../../ui/button";
import {Check, Loader2, Pencil, Plus, Square, Trash2, X} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import ColorInput from "../../Comman/ColorPicker";
import {Input} from "../../ui/input";
import {useDispatch, useSelector} from "react-redux";
import {allStatusAndTypesAction} from "../../../redux/action/AllStatusAndTypesAction";
import {toast} from "../../ui/use-toast";
import EmptyData from "../../Comman/EmptyData";
import randomColor from 'randomcolor';
import DeleteDialog from "../../Comman/DeleteDialog";
import {apiService, normalizeName} from "../../../utils/constent";
import {Tooltip, TooltipContent, TooltipTrigger} from "../../ui/tooltip";
import {Checkbox} from "../../ui/checkbox";

const initialNewLabel = {name: '', colorCode: "",};

const Labels = () => {
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);

    const [labelError, setLabelError] = useState(initialNewLabel);
    const [labelList, setLabelList] = useState([]);
    const [isEdit, setIsEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const [isSave, setIsSave] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        if (allStatusAndTypes.labels) {
            getAllLabels();
        }
    }, [allStatusAndTypes.labels]);

    const getAllLabels = async () => {
        setLabelList(allStatusAndTypes.labels);
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
            const allIds = (labelList || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const deleteParticularRow = async () => {
        setIsLoadingDelete(true);
        if (deleteType === 'single') {
            const clone = [...labelList];
            const indexToDelete = clone.findIndex((x) => x.id == deleteId);
            if (deleteId) {
                const data = await apiService.deleteLabels(deleteId);
                if (data.success) {
                    clone.splice(indexToDelete, 1);
                    setLabelList(clone);
                    dispatch(allStatusAndTypesAction({...allStatusAndTypes, labels: clone}));
                    toast({description: data.message});
                } else {
                    toast({description: data?.error?.message, variant: "destructive"});
                }
            }
        } else {
            const payload = {labelIds: selectedIds, projectId: projectDetailsReducer.id,};
            const data = await apiService.labelBatchUpdate(payload);
            if (data.success) {
                const updatedLabels = labelList.filter(item => !selectedIds.includes(item.id));
                setLabelList(updatedLabels);
                dispatch(allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    labels: updatedLabels
                }));
                setSelectedIds([]);
                toast({description: data.message});
            } else {
                toast({variant: "destructive", description: data.error.message});
            }
        }
        setOpenDelete(false);
        setIsLoadingDelete(false);
    };

    const onChangeColorColor = (newColor, isValid, index) => {
        const updatedColors = [...labelList];
        updatedColors[index] = { ...updatedColors[index], colorCode: newColor };
        setLabelList(updatedColors);
        if (isValid) {
            const isDuplicateColor = labelList.some((label, i) => i !== index && label.colorCode.toLowerCase() === newColor.toLowerCase());
            setLabelError({...labelError, colorCode: isDuplicateColor ? "A label with this color already exists." : "",});
        } else {
            setLabelError({...labelError, colorCode: "",});
        }
    };

    const handleShowInput = () => {
        const clone = [...labelList];
        clone.push({name: '', colorCode: randomColor(),});
        setIsEdit(clone.length - 1);
        setLabelList(clone)
        setLabelError(initialNewLabel);
        setSelectedIds([])
    };

    const handleInputChange = (event, index) => {
        const { name, value } = event.target;
        const cleanedValue = name === "name" ? value.trimStart() : value;
        const updatedColors = [...labelList];
        updatedColors[index] = { ...updatedColors[index], [name]: cleanedValue };
        setLabelList(updatedColors);
        setLabelError({
            ...labelError,
            [name]: validation(name, cleanedValue)
        });
    };

    const onBlur = (event) => {
        const { name, value } = event.target;
        const currentIndex = isEdit;
        const currentLabel = labelList[currentIndex] || {};

        const validationErrors = validateLabel(
            { ...currentLabel, [name]: value },
            labelList,
            currentIndex
        );

        setLabelError({
            ...labelError,
            [name]: validationErrors[name] || ""
        });
    };

    const validation = (name, value) => {
        switch (name) {
            case "name":
                if (!value || value.trim() === "") {
                    return "Label name is required.";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const validateLabel = (label, labelList, currentIndex) => {
        const errors = {};

        if (!label.name || label.name.trim() === "") {
            errors.name = "Label name is required.";
        } else if (label.name.length > 255) {
            errors.name = "Label name must not exceed 255 characters.";
        }

        const isDuplicateColor = labelList.some(
            (item, i) => i !== currentIndex && item.colorCode.toLowerCase() === label.colorCode.toLowerCase()
        );
        if (isDuplicateColor) {
            errors.colorCode = "A label with this color already exists.";
        }

        const normalizedName = normalizeName(label.name);
        const isDuplicateName = labelList.some(
            (item, i) => i !== currentIndex && normalizeName(item.name) === normalizedName
        );
        if (isDuplicateName) {
            errors.name = "A label with this name already exists.";
        }

        return errors;
    };

    const handleAddNewLabel = async (record, index) => {
        const validationErrors = validateLabel(record, labelList, index);

        if (Object.keys(validationErrors).length > 0) {
            setLabelError(validationErrors);
            // if (validationErrors.name) {
            //     toast({ description: validationErrors.name, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true);
        const payload = {
            projectId: `${projectDetailsReducer.id}`,
            name: record.name,
            colorCode: record.colorCode,
            // label_sort_order_id: record.label_sort_order_id || "1",
            // user_browser: record.user_browser || '',
            // user_ip_address: record.user_ip_address || '',
        }
        const data = await apiService.createLabels(payload)
        if (data.success) {
            let clone = [...labelList];
            clone.push(data.data);
            clone.splice(index, 1);
            setLabelList(clone);
            dispatch(allStatusAndTypesAction({...allStatusAndTypes, labels: clone}))
            setIsSave(false);
            toast({description: data.message})
        } else {
            setIsSave(false);
            toast({description: (data?.error?.message), variant: "destructive"})
        }
        setIsEdit(null);
    };

    const handleSaveLabel = async (index) => {
        const updatedColors = [...labelList];
        const labelToSave = updatedColors[index];
        const validationErrors = validateLabel(labelToSave, labelList, index);

        if (Object.keys(validationErrors).length > 0) {
            setLabelError(validationErrors);
            // if (validationErrors.name) {
            //     toast({ description: validationErrors.name, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true);
        const payload = {
            projectId: `${projectDetailsReducer.id}`,
            name: labelToSave.name,
            colorCode: labelToSave.colorCode,
            // label_sort_order_id: labelToSave.label_sort_order_id || '',
            // user_browser: labelToSave.user_browser || '',
            // user_ip_address: labelToSave.user_ip_address || '',
        }
        const data = await apiService.updateLabels(payload, labelToSave.id)
        if (data.success) {
            let clone = [...labelList];
            let index = clone.findIndex((x) => x.id === labelToSave.id);
            if (index !== -1) {
                clone[index] = data.data;
                setLabelList(clone)
                dispatch(allStatusAndTypesAction({...allStatusAndTypes, labels: clone}))
            }
            setIsSave(false)
            toast({description: data.message})
        } else {
            setIsSave(false);
            toast({description: data?.error?.message, variant: "destructive"})
        }
        setLabelError({...labelError, name: "", colorCode: "",});
        updatedColors[index] = {...labelToSave};
        setIsEdit(null);
    };

    const handleDeleteLabel = (id, type = 'single') => {
        if (type === 'all') {
            setDeleteType('all');
            setOpenDelete(true);
        } else {
            setDeleteId(id);
            setDeleteType('single');
            setOpenDelete(true);
        }
        setLabelList(allStatusAndTypes.labels);
        setIsEdit(null);
    };

    const onEdit = (index) => {
        setLabelError(initialNewLabel);
        const clone = [...labelList]
        if (isEdit !== null && !clone[isEdit]?.id) {
            clone.splice(isEdit, 1)
            setIsEdit(index)
            setLabelList(clone)
        } else if (isEdit !== index) {
            setLabelList(allStatusAndTypes?.labels);
            setIsEdit(index);
        } else {
            setIsEdit(index)
        }
    }

    const onEditCancel = () => {
        setIsEdit(null)
        setLabelList(allStatusAndTypes.labels);
    }

    return (
        <Card>
            {
                (openDelete || deleteType === 'all') &&
                <DeleteDialog
                    title={deleteType === 'single' ? "Are you sure you want to delete this label?" : `Are you sure you want to delete the selected ${selectedIds?.length > 1 ? 'Labels' : 'Label'}`}
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

            <CardHeader className="flex flex-row justify-between items-center border-b p-4 sm:px-5 sm:py-4 flex-wrap md:flex-nowrap gap-y-2">
                <div>
                    <CardTitle className="text-xl lg:text-2xl font-medium">Labels</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground p-0">
                        Add labels to structure your changelog and keep updates organized.
                    </CardDescription>
                </div>
                <Button disabled={isEdit != null} className={"gap-2 font-medium hover:bg-primary m-0"} onClick={handleShowInput}>
                    <Plus size={18} strokeWidth={3}/>New Label
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className={"overflow-auto max-h-[456px] whitespace-nowrap"}>
                    <Table>
                        <TableHeader className={`bg-muted  sticky top-0 z-10`}>
                            <TableRow className={"relative"}>
                                <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                    <div className="items-center flex space-x-2">
                                        <Checkbox
                                            id={"all"}
                                            checked={labelList.length > 0 && selectedIds.length === labelList.length}
                                            disabled={isLoading || !labelList?.length}
                                            onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                        />
                                        {
                                            (selectedIds.length > 0) &&
                                            <div className={'absolute left-[20px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                <div>
                                                    <label
                                                        htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                        className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                        {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All labels are selected`}
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
                                                                        disabled={isLoading || !labelList?.length || selectedIds.length === 0 || selectedIds.length === labelList.length}
                                                                        onClick={() => handleDeleteLabel(null, 'all')}
                                                                    >
                                                                        <Trash2 size={15} className={"text-destructive"}/>
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent className={"font-normal text-sm"}>
                                                                {selectedIds.length === labelList.length ?
                                                                    "Cannot delete all labels - one is required." :
                                                                    `Delete Selected ${selectedIds?.length > 1 ? 'Labels' : 'Label'}`}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    </div>
                                </TableHead>
                                {
                                    ["Label Name", "Label Color", "Action"].map((x, i) => {
                                        return (
                                            <TableHead key={i} className={`px-2 py-[10px] text-sm font-medium md:px-3 text-card-foreground ${i === 0 ? "w-2/5" : i === 1 ? "w-2/5" : ""}`}>{x}</TableHead>
                                        )
                                    })
                                }
                            </TableRow>
                        </TableHeader>

                        <TableBody className={"overflow-y-auto"}>
                            {
                                labelList.length > 0 ?
                                    <Fragment>
                                        {
                                            (labelList || []).map((x, i) => {
                                                return (
                                                    <TableRow key={i}>
                                                        {
                                                            isEdit == i ?
                                                                <Fragment>
                                                                    <TableCell className={"px-[12px] py-[10px]"}/>
                                                                    <TableCell className={"px-[12px] py-[10px] align-top"}>
                                                                        <Input
                                                                            autoFocus
                                                                            className={"bg-card h-9 "}
                                                                            type="text"
                                                                            value={x.name}
                                                                            name={"name"}
                                                                            onBlur={onBlur}
                                                                            onChange={(e) => handleInputChange(e, i)}
                                                                            placeholder={"Enter label name"}
                                                                        />
                                                                        {
                                                                            labelError.name ?
                                                                                <div className="grid gap-2 mt-[4px]">
                                                                                    {labelError.name && <span className="text-destructive text-sm">{labelError.name}</span>}
                                                                                </div> : ""
                                                                        }
                                                                    </TableCell>

                                                                    <TableCell
                                                                        className={"px-[12px] py-[10px] align-top"}>
                                                                        <div className={"flex items-center"}>
                                                                            <ColorInput name={"clr"} value={x.colorCode}
                                                                                        onChange={(color, isValid) => onChangeColorColor(color, isValid, i)}/>
                                                                        </div>
                                                                        {labelError.colorCode && (
                                                                            <div className="grid gap-2 mt-[4px]">
                                                                                <span className="text-red-500 font-normal text-sm">{labelError.colorCode}</span>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell
                                                                        className={`px-2 py-[10px] pt-[13px] md:px-3 font-medium text-xs align-top text-muted-foreground`}>
                                                                        <div className={"flex items-center gap-2"}>
                                                                        <Fragment>
                                                                            {
                                                                                x.id ? <Button disabled={isSave}
                                                                                    variant="outline hover:bg-transparent"
                                                                                    className={`p-1 border w-[30px] h-[30px]`}
                                                                                    onClick={() => handleSaveLabel(i)}
                                                                                >
                                                                                    {isSave ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check size={16}/>}
                                                                                </Button> : <Button disabled={isSave}
                                                                                    className={`text-sm font-medium h-[30px] w-[88px] hover:bg-primary`}
                                                                                    onClick={() => handleAddNewLabel(x, i)}
                                                                                >
                                                                                    {isSave ? <Loader2 className={"h-4 w-4 animate-spin"}/> : "Add Label"}
                                                                                </Button>
                                                                            }

                                                                            <Button
                                                                                variant="outline hover:bg-transparent"
                                                                                className="p-1 border w-[30px] h-[30px]"
                                                                                onClick={() => x.id ? onEditCancel() : onEdit(null)}
                                                                            >
                                                                                <X size={16}/>
                                                                            </Button>
                                                                        </Fragment>
                                                                        </div>
                                                                    </TableCell>
                                                                </Fragment>
                                                                :
                                                                <Fragment>
                                                                    <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                                        <Checkbox
                                                                            className={"mt-1"}
                                                                            checked={selectedIds.includes(x.id)}
                                                                            onCheckedChange={() => handleCheckboxChange(x.id)}
                                                                            disabled={labelList.filter(label => label.id).length === 1}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className={`px-2 py-[10px] md:px-3 font-medium text-xs max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-muted-foreground`}>{x.name}</TableCell>
                                                                    <TableCell className={`px-2 py-[10px] md:px-3 font-medium text-xs text-muted-foreground`}>
                                                                        <div className={"flex items-center gap-1"}>
                                                                            <Square size={16} strokeWidth={1} fill={x.colorCode} stroke={x.colorCode}/>
                                                                            <p>{x.colorCode}</p>
                                                                        </div>
                                                                    </TableCell>

                                                                    <TableCell
                                                                        className={`flex gap-2 px-2 py-[10px] md:px-3 font-medium text-xs text-muted-foreground`}>
                                                                        <Button
                                                                            variant="outline hover:bg-transparent"
                                                                            className="p-1 border w-[30px] h-[30px]"
                                                                            onClick={() => onEdit(i)}
                                                                            disabled={selectedIds.length > 0}
                                                                        >
                                                                            <Pencil size={16}/>
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline hover:bg-transparent"
                                                                            className="p-1 border w-[30px] h-[30px]"
                                                                            onClick={() => handleDeleteLabel(x.id)}
                                                                            disabled={selectedIds.length > 0 || labelList.filter(label => label.id).length === 1}
                                                                        >
                                                                            <Trash2 size={16}/>
                                                                        </Button>
                                                                    </TableCell>
                                                                </Fragment>
                                                        }
                                                    </TableRow>
                                                )
                                            })
                                        }
                                    </Fragment>
                                    :
                                    <TableRow className={"hover:bg-transparent"}>
                                        <TableCell colSpan={6}><EmptyData/></TableCell>
                                    </TableRow>
                            }
                        </TableBody>
                    </Table>
                </div>

            </CardContent>
        </Card>
    );
};

export default Labels;
