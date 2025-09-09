import React, {useState, useEffect, Fragment} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../ui/card";
import {useTheme} from "../../theme-provider";
import {Button} from "../../ui/button";
import {Check, Loader2, Pencil, Plus, Trash2, X} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import {Input} from "../../ui/input";
import {useSelector, useDispatch} from "react-redux";
import dayjs from "dayjs";
import {allStatusAndTypesAction} from "../../../redux/action/AllStatusAndTypesAction";
import {toast} from "../../ui/use-toast";
import EmptyData from "../../Comman/EmptyData";
import DeleteDialog from "../../Comman/DeleteDialog";
import {apiService, normalizeName} from "../../../utils/constent";
import {Checkbox} from "../../ui/checkbox";
import {Tooltip, TooltipContent, TooltipTrigger} from "../../ui/tooltip";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const initialState = {title: ""}

const Tags = () => {
    const {onProModal} = useTheme();
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);

    const [formError, setFormError] = useState(initialState);
    const [topicLists, setTopicLists] = useState([]);
    const [isSave, setIsSave] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isEdit, setIsEdit] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        if (allStatusAndTypes.topics) {
            getAllTopics();
        }
    }, [allStatusAndTypes.topics]);

    const getAllTopics = async () => {
        setTopicLists(allStatusAndTypes.topics);
        setIsLoading(false)
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
            const allIds = (topicLists || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const deleteParticularRow = async () => {
        debugger
        setIsLoadingDelete(true);
        if (deleteType === 'single') {
            const clone = [...topicLists];
            const indexToDelete = clone.findIndex((x) => x.id == deleteId);
            if (deleteId) {
                const data = await apiService.deleteTopics(deleteId);
                if (data.success) {
                    clone.splice(indexToDelete, 1);
                    setTopicLists(clone);
                    dispatch(allStatusAndTypesAction({...allStatusAndTypes, topics: clone}));
                    toast({description: data.message});
                } else {
                    toast({description: data?.error?.message, variant: "destructive"});
                }
            }
        } else {
            const payload = {
                tagIds: selectedIds,
                projectId: projectDetailsReducer.id,
            };
            const data = await apiService.tagsBatchUpdate(payload);
            if (data.success) {
                const updatedLabels = topicLists.filter(item => !selectedIds.includes(item.id));
                setTopicLists(updatedLabels);
                dispatch(allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    topics: updatedLabels
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

    const handleDeleteStatus = (id, type = 'single') => {
        if (type === 'all') {
            setDeleteType('all');
            setOpenDelete(true);
        } else {
            setDeleteId(id);
            setDeleteType('single');
            setOpenDelete(true);
        }
        setTopicLists(allStatusAndTypes.topics);
        setIsEdit(null);
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Tag name is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const handleInputChange = (event, index) => {
        const {name, value} = event.target;
        const cleanedValue = name === "title" ? value.trimStart() : value;
        const updatedTopic = [...topicLists];
        updatedTopic[index] = {...updatedTopic[index], [name]: cleanedValue};
        setTopicLists(updatedTopic);
        setFormError({
            ...formError,
            [name]: formValidate(name, cleanedValue)
        });
    }

    const onBlur = (e) => {
        const { name, value } = e.target;
        const currentIndex = isEdit;
        const currentLabel = topicLists[currentIndex] || {};

        const validationErrors = validateLabel(
            { ...currentLabel, [name]: value },
            topicLists,
            currentIndex
        );

        setFormError({...formError, [name]: validationErrors[name] || ""});
    };

    const validateLabel = (tag, topicLists, currentIndex) => {
        const errors = {};

        if (!tag.title || tag.title.trim() === "") {
            errors.title = "Tag name is required.";
        } else if (tag.title.length > 255) {
            errors.title = "Tag name must not exceed 255 characters.";
        }

        const normalizedName = normalizeName(tag.title);
        const isDuplicateName = topicLists.some(
            (item, i) => i !== currentIndex && normalizeName(item.title) === normalizedName
        );
        if (isDuplicateName) {
            errors.title = "A tag with this name already exists.";
        }

        return errors;
    };

    const addTag = async (newTag, index) => {
        const validationErrors = validateLabel(newTag, topicLists, index);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        const payload = {
            projectId: `${projectDetailsReducer.id}`,
            title: newTag.title,
        }
        setIsSave(true)
        const data = await apiService.createTopics(payload);
        setIsSave(false);
        if (data.success) {
            const clone = [...topicLists];
            clone.push(data.data);
            clone.splice(index, 1);
            dispatch(allStatusAndTypesAction({...allStatusAndTypes, topics: clone}))
            setTopicLists(clone);
            dispatch(allStatusAndTypesAction({...allStatusAndTypes, topics: clone}));
            toast({description: data.message});
        } else {
            toast({description: data?.error?.message, variant: "destructive",});
        }
        setIsEdit(null);
    };

    const handleSaveTopic = async (index) => {
        const clone = [...topicLists];
        const tagToSave = clone[index];
        const validationErrors = validateLabel(tagToSave, topicLists, index);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        const payload = {
            title: tagToSave.title,
            projectId: projectDetailsReducer.id
        }
        setIsSave(true);
        const data = await apiService.updateTopics(payload, tagToSave.id);
        setIsSave(false);
        if (data.success) {
            const clone = [...topicLists];
            const index = clone.findIndex((x) => x.id === tagToSave.id)
            if (index !== -1) {
                clone[index] = data.data;
                dispatch(allStatusAndTypesAction({...allStatusAndTypes, topics: clone}));
                setTopicLists(clone)
            }
            toast({description: data.message});
            setIsEdit(null);
        } else {
            toast({description: data?.error?.message, variant: "destructive"});
        }
    }

    const handleNewTopics = () => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            const clone = [...topicLists];
            clone.push(initialState);
            setTopicLists(clone);
            setIsEdit(clone.length - 1);
            setFormError(initialState);
        }
        setSelectedIds([]);
    }

    const onEdit = (index) => {
        if (projectDetailsReducer.plan == 0) {
            onProModal(true);
        } else {
            setFormError(initialState);
            const clone = [...topicLists];
            if (isEdit !== null && !clone[isEdit]?.id) {
                clone.splice(isEdit, 1)
                setIsEdit(index)
                setTopicLists(clone);
            } else if (isEdit !== index) {
                setTopicLists(allStatusAndTypes?.topics);
                setIsEdit(index);
            } else {
                setIsEdit(index);
            }
        }
    }

    const onEditCancel = () => {
        setIsEdit(null)
        setTopicLists(allStatusAndTypes.topics);
    }

    return (
        <Fragment>
            {
                (openDelete || deleteType === 'all') &&
                <DeleteDialog
                    title={deleteType === 'single' ? "Are you sure you want to delete this Tag?" : `Are you sure you want to delete the selected ${selectedIds?.length > 1 ? 'Tags' : 'Tag'}`}
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
                <CardHeader
                    className={"p-4 sm:px-5 sm:py-4 gap-1 border-b flex flex-row flex-wrap justify-between items-center gap-y-2"}>
                    <div>
                        <CardTitle className={"text-xl lg:text-2xl font-medium"}>Tags</CardTitle>
                        <CardDescription className={"text-sm text-muted-foreground p-0"}>Create tags that users can assign when submitting feedback.</CardDescription>
                    </div>
                    <Button onClick={handleNewTopics} disabled={isEdit != null} className={"gap-2 font-medium hover:bg-primary m-0"}>
                        <Plus size={18} strokeWidth={3}/>New Tag
                    </Button>
                </CardHeader>
                <CardContent className={"p-0"}>
                    <div className={"overflow-auto whitespace-nowrap max-h-[456px]"}>
                        <Table>
                            <TableHeader className={`bg-muted sticky top-0 z-10`}>
                                <TableRow className={"relative"}>
                                    <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                        <div className="items-center flex space-x-2">
                                            <Checkbox id={"all"}
                                                checked={topicLists.length > 0 && selectedIds.length === topicLists.length}
                                                disabled={isLoading || !topicLists?.length}
                                                onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                            />
                                            {
                                                (selectedIds.length > 0) &&
                                                <div className={'absolute left-[20px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                    <div>
                                                        <label htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                            className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                            {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All tags are selected`}
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
                                                                        disabled={isLoading || !topicLists?.length || selectedIds.length === 0 || selectedIds.length === topicLists.length}
                                                                        onClick={() => handleDeleteStatus(null, 'all')}
                                                                    >
                                                                        <Trash2 size={15} className={"text-destructive"}/>
                                                                    </Button>
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className={"font-normal text-sm"}>
                                                                    {selectedIds.length === topicLists.length ?
                                                                        "Cannot delete all tags - one is required." :
                                                                        `Delete Selected ${selectedIds?.length > 1 ? 'Tags' : 'Tag'}`}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        </div>
                                    </TableHead>
                                    {
                                        ["Tag Name", "Updated Date", "Action"].map((x, i) => {
                                            return (
                                                <TableHead key={i} className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground ${i === 0 ? "w-2/5" : i === 1 ? "w-2/5" : ""}`}>{x}</TableHead>
                                            )
                                        })
                                    }
                                </TableRow>
                            </TableHeader>
                            <TableBody className={"overflow-y-auto"}>
                                {
                                    topicLists.length > 0 ?
                                        <Fragment>
                                            {
                                                (topicLists || []).map((x, i) => {
                                                    return (
                                                        <TableRow key={i}>
                                                            {
                                                                isEdit == i ?
                                                                    <Fragment>
                                                                        <TableCell className={"px-[12px] py-[10px]"}/>
                                                                        <TableCell className={"px-[12px] py-[10px]"}>
                                                                            <Input
                                                                                autoFocus
                                                                                placeholder={"Enter tag name"}
                                                                                className={"bg-card h-9"}
                                                                                type="title"
                                                                                value={x.title}
                                                                                name={"title"}
                                                                                onBlur={onBlur}
                                                                                onChange={(e) => handleInputChange(e, i)}
                                                                            />
                                                                            {
                                                                                formError.title ?
                                                                                    <div className="grid gap-2 mt-[4px]">
                                                                                        {formError.title && <span className="text-red-500 text-sm">{formError.title}</span>}
                                                                                    </div> : ""
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className={"px-[12px] py-[10px]"}/>
                                                                        <TableCell className={`px-2 py-[10px] md:px-3 font-medium ${formError.title ? "align-top": "align-middle"} text-xs text-muted-foreground`}>
                                                                            <div className={"flex gap-2 items-center"}>
                                                                                <Fragment>
                                                                                    {
                                                                                        x.id ? <Button disabled={isSave}
                                                                                            variant="outline hover:bg-transparent"
                                                                                            className={`p-1 border w-[30px] h-[30px] ${isSave ? "justify-center items-center" : ""}`}
                                                                                            onClick={() => handleSaveTopic(i)}
                                                                                        >
                                                                                            {isSave ? <Loader2 className="mr-1 h-4 w-4 animate-spin justify-center"/> : <Check size={16}/>}
                                                                                        </Button> : <Button disabled={isSave}
                                                                                            className="text-sm font-medium h-[30px] w-[76px] hover:bg-primary"
                                                                                            onClick={() => addTag(x, i)}
                                                                                        >
                                                                                            {isSave ? <Loader2 className={"mr-2  h-4 w-4 animate-spin"}/> : "Add Tag"}
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
                                                                                checked={selectedIds.includes(x.id)}
                                                                                onCheckedChange={() => handleCheckboxChange(x.id)}
                                                                                disabled={topicLists.filter(label => label.id).length === 1}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className={`px-2 py-[10px] md:px-3 font-medium text-xs max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-muted-foreground`}>
                                                                            {x.title}
                                                                        </TableCell>
                                                                        <TableCell className={`px-2 py-[10px] md:px-3 font-medium text-xs text-muted-foreground`}>{dayjs.utc(x.updatedAt).local().startOf('seconds').fromNow()}</TableCell>
                                                                        <TableCell className={`flex px-2 py-[10px] md:px-3 text-muted-foreground`}>
                                                                            <Fragment>
                                                                                <div className="pr-0">
                                                                                    <Button onClick={() => onEdit(i)} disabled={selectedIds.length > 0}
                                                                                            variant={"outline hover:bg-transparent"}
                                                                                            className={`p-1 border w-[30px] h-[30px] `}>
                                                                                        <Pencil size={16}/>
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="pl-2">
                                                                                    <Button
                                                                                        onClick={() => handleDeleteStatus(x.id)}
                                                                                        variant={"outline hover:bg-transparent"}
                                                                                        className={`p-1 border w-[30px] h-[30px]`}
                                                                                        // disabled={topicLists.filter(tag => tag.id).length === 1 || selectedIds.length === topicLists.length}
                                                                                        disabled={selectedIds.length > 0 || topicLists.filter(tag => tag.id).length === 1}
                                                                                    >
                                                                                        <Trash2 size={16}/>
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
                                        </Fragment>
                                        :
                                        <TableRow className={"hover:bg-transparent"}><TableCell colSpan={6}><EmptyData/></TableCell></TableRow>
                                }
                            </TableBody>
                        </Table>

                    </div>
                </CardContent>
            </Card>
        </Fragment>
    )
}

export default Tags;