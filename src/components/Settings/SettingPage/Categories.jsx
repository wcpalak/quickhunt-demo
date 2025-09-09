import React, {useState, Fragment, useEffect,} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "../../ui/card";
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

const Categories = () => {
    const dispatch = useDispatch();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const [formError, setFormError] = useState(initialState);
    const [categoriesList, setCategoriesList] = useState([]);
    const [isSave, setIsSave] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isEdit, setIsEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        if (allStatusAndTypes.categories) {
            getAllCategory();
        }
    }, [allStatusAndTypes.categories]);

    const getAllCategory = async () => {
        setCategoriesList(allStatusAndTypes.categories);
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
            const allIds = (categoriesList || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const deleteParticularRow = async () => {
        setIsLoadingDelete(true);
        if (deleteType === 'single') {
            const clone = [...categoriesList];
            const indexToDelete = clone.findIndex((x) => x.id == deleteId);
            if (deleteId) {
                const data = await apiService.deleteCategorySettings(deleteId);
                if (data.success) {
                    clone.splice(indexToDelete, 1);
                    setCategoriesList(clone);
                    dispatch(allStatusAndTypesAction({...allStatusAndTypes, categories: clone}));
                    toast({description: data.message});
                } else {
                    toast({description: data?.error?.message, variant: "destructive"});
                }
            }
        } else {
            const payload = {
                categoryIds: selectedIds,
                projectId: projectDetailsReducer.id,
            };
            const data = await apiService.categoryBatchUpdate(payload);
            if (data.success) {
                const updatedLabels = categoriesList.filter(item => !selectedIds.includes(item.id));
                setCategoriesList(updatedLabels);
                dispatch(allStatusAndTypesAction({
                    ...allStatusAndTypes,
                    categories: updatedLabels
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
        setCategoriesList(allStatusAndTypes.categories);
        setIsEdit(null);
    };

    const onBlur = (e) => {
        const { name, value } = e.target;
        const currentIndex = isEdit;
        const currentLabel = categoriesList[currentIndex] || {};

        const validationErrors = validateLabel(
            { ...currentLabel, [name]: value },
            categoriesList,
            currentIndex
        );

        setFormError({...formError, [name]: validationErrors[name] || ""});
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Category title is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const validateLabel = (category, categoriesList, currentIndex) => {
        const errors = {};

        if (!category.title || category.title.trim() === "") {
            errors.title = "Category title is required.";
        } else if (category.title.length > 255) {
            errors.title = "Category title must not exceed 255 characters.";
        }

        const normalizedName = normalizeName(category.title);
        const isDuplicateName = categoriesList.some(
            (item, i) => i !== currentIndex && normalizeName(item.title) === normalizedName
        );
        if (isDuplicateName) {
            errors.title = "A category with this name already exists.";
        }

        return errors;
    };

    const addCategory = async (newCategory, index) => {
        const validationErrors = validateLabel(newCategory, categoriesList, index);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            title: newCategory.title,
        }

        const clone = [...categoriesList];
        const data = await apiService.createCategorySettings(payload)

        if (data.success) {
            clone.push(data.data);
            clone.splice(index, 1);
            dispatch(allStatusAndTypesAction({...allStatusAndTypes, categories: clone}))
            setCategoriesList(clone);
            setIsSave(false);
            toast({description: data.message});
        } else {
            toast({description: data?.error.message, variant: "destructive"})
        }
        setIsEdit(null);
    }

    const addNewTopic = () => {
        const clone = [...categoriesList];
        clone.push(initialState);
        setCategoriesList(clone);
        setIsEdit(clone.length - 1);
        setFormError(initialState);
        setSelectedIds([]);
    }

    const onEdit = (index) => {
        setFormError(initialState);
        const clone = [...categoriesList];
        if (isEdit !== null && !clone[isEdit]?.id) {
            clone.splice(isEdit, 1)
            setIsEdit(index)
            setCategoriesList(clone);
        } else if (isEdit !== index) {
            setCategoriesList(allStatusAndTypes?.categories);
            setIsEdit(index);
        } else {
            setIsEdit(index);
        }
    }

    const handleInputChange = (event, index) => {
        const {name, value} = event.target;
        const cleanedValue = name === "title" ? value.trimStart() : value;
        const updatedCategory = [...categoriesList];
        updatedCategory[index] = {...updatedCategory[index], [name]: cleanedValue, description: cleanedValue};
        setCategoriesList(updatedCategory);
        setFormError({
            ...formError,
            [name]: formValidate(name, cleanedValue)
        });
    }

    const handleSaveCategory = async (index) => {
        const clone = [...categoriesList];
        const topicToSave = clone[index];
        const validationErrors = validateLabel(topicToSave, categoriesList, index);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            // if (validationErrors.title) {
            //     toast({ description: validationErrors.title, variant: "destructive" });
            // }
            return;
        }
        setIsSave(true);
        const payload = {
            title: topicToSave.title,
            projectId: projectDetailsReducer.id,
        }
        const data = await apiService.updateCategorySettings(payload, topicToSave.id);
        if (data.success) {
            const clone = [...categoriesList];
            const index = clone.findIndex((x) => x.id === topicToSave.id)
            if (index !== -1) {
                clone[index] = data.data;
                dispatch(allStatusAndTypesAction({...allStatusAndTypes, categories: clone}));
                setCategoriesList(clone)
            }
            setIsSave(false);
            toast({description: data.message});
            setIsEdit(null);
        } else {
            setIsSave(false);
            toast({description: data?.error.message, variant: "destructive"});
        }
    }

    const onEditCancel = () => {
        setIsEdit(null)
        setCategoriesList(allStatusAndTypes?.categories);
    }

    return (
        <Fragment>
            {
                (openDelete || deleteType === 'all') &&
                <DeleteDialog
                    title={deleteType === 'single' ? "Are you sure you want to delete this category?" : `Are you sure you want to delete the selected ${selectedIds?.length > 1 ? 'Categories' : 'Category'}`}
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
                    className={"p-6 gap-1 border-b flex flex-row flex-wrap justify-between items-center p-4 sm:px-5 sm:py-4 gap-y-2"}>
                    <div>
                        <CardTitle className={"text-xl lg:text-2xl font-medium"}>Categories</CardTitle>
                        <CardDescription className={"text-sm text-muted-foreground p-0 mt-1"}>Categorize your changelog for better organization.</CardDescription>
                    </div>
                    <Button disabled={isEdit != null} onClick={addNewTopic}
                            className={"gap-2 font-medium hover:bg-primary m-0"}>
                        <Plus size={18} strokeWidth={3}/>Create Category
                    </Button>
                </CardHeader>
                <CardContent className={"p-0"}>
                    <div className={"overflow-auto whitespace-nowrap max-h-[456px]"}>
                        <Table>
                            <TableHeader className={`bg-muted sticky top-0 z-10`}>
                                <TableRow className={"relative"}>
                                    <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                        <div className="items-center flex space-x-2">
                                            <Checkbox
                                                id={"all"}
                                                checked={categoriesList.length > 0 && selectedIds.length === categoriesList.length}
                                                disabled={isLoading || !categoriesList?.length}
                                                onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                            />
                                            {
                                                (selectedIds.length > 0) &&
                                                <div className={'absolute left-[20px] md:pl-3 pl-1 md:pr-3 pr-1 top-[0px] w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted'}>
                                                    <div>
                                                        <label
                                                            htmlFor={allSelectedDelete === 0 ? "all" : ""}
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
                                                                        disabled={isLoading || !categoriesList?.length || selectedIds.length === 0 || selectedIds.length === categoriesList.length}
                                                                        onClick={() => handleDeleteStatus(null, 'all')}
                                                                    >
                                                                        <Trash2 size={15} className={"text-destructive"}/>
                                                                    </Button>
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent className={"font-normal text-sm"}>
                                                                    {selectedIds.length === categoriesList.length ?
                                                                        "Cannot delete all categories - one is required." :
                                                                        `Delete Selected ${selectedIds?.length > 1 ? 'Categories' : 'Category'}`}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        </div>
                                    </TableHead>
                                    {
                                        ["Category Name", "Updated Date", "Action"].map((x, i) => {
                                            return (
                                                <TableHead key={i}
                                                           className={`${i == 0 ? "w-2/5" : i == 1 ? "w-2/5" : ""} text-sm font-medium px-2 py-[10px] md:px-3 text-card-foreground`}>{x}</TableHead>
                                            )
                                        })
                                    }
                                </TableRow>
                            </TableHeader>
                            <TableBody className={"overflow-y-auto"}>
                                {
                                    categoriesList.length > 0 ?
                                        <Fragment>
                                            {
                                                (categoriesList || []).map((x, i) => {
                                                    return (
                                                        <TableRow key={i}>
                                                            {
                                                                isEdit == i ?
                                                                    <Fragment>
                                                                        <TableCell className={"px-[12px] py-[10px]"}/>
                                                                        <TableCell className={"px-[12px] py-[10px]"}>
                                                                            <Input
                                                                                autoFocus
                                                                                placeholder={"Enter category name"}
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
                                                                                        <span className="text-red-500 text-sm">{formError.title}</span>
                                                                                    </div> : ""
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell/>
                                                                        <TableCell
                                                                            className={`px-2 py-[10px] pt-[13px] md:px-3 font-medium text-xs ${formError.title ? "align-top" : "align-middle"} text-muted-foreground align-top`}>
                                                                            <div className={"flex items-center gap-2"}>
                                                                                <Fragment>
                                                                                    {x.id ?
                                                                                        <Button disabled={isSave}
                                                                                            variant="outline hover:bg-transparent"
                                                                                            className={`p-1 border w-[30px] h-[30px]`}
                                                                                            onClick={() => handleSaveCategory(i)}
                                                                                        >
                                                                                            {isSave ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check size={16}/>}
                                                                                        </Button> : <Button disabled={isSave}
                                                                                            className="text-sm font-medium h-[30px] w-[112px] hover:bg-primary"
                                                                                            onClick={() => addCategory(x, i)}
                                                                                        >
                                                                                            {isSave ? <Loader2 className={"h-4 w-4 animate-spin"}/> : "Add Category"}
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
                                                                                disabled={categoriesList.filter(cat => cat.id).length === 1}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className={`px-2 py-[10px] md:px-3 font-medium text-xs max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap text-muted-foreground`}>
                                                                            {x.title}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            className={`px-2 py-[10px] md:px-3 font-medium text-xs text-muted-foreground`}>{dayjs.utc(x.updatedAt).local().startOf('seconds').fromNow()}</TableCell>
                                                                        <TableCell
                                                                            className={`px-2 py-[10px] md:px-3 text-muted-foreground`}>
                                                                            <div className={"flex items-center"}>
                                                                                <div className="pr-0">
                                                                                    <Button onClick={() => onEdit(i)} disabled={selectedIds.length > 0}
                                                                                            variant={"outline hover:bg-transparent"}
                                                                                            className={`p-1 border w-[30px] h-[30px] text-muted-foreground`}><Pencil
                                                                                        size={16}/></Button>
                                                                                </div>
                                                                                <div className="pl-2">
                                                                                    <Button
                                                                                        onClick={() => handleDeleteStatus(x.id)}
                                                                                        variant={"outline hover:bg-transparent"}
                                                                                        className={`p-1 border w-[30px] h-[30px] text-muted-foreground`}
                                                                                        // disabled={categoriesList.filter(cat => cat.id).length === 1 || selectedIds.length === categoriesList.length}
                                                                                        disabled={selectedIds.length > 0 || categoriesList.filter(cat => cat.id).length === 1}
                                                                                    >
                                                                                        <Trash2 size={16}/>
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
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
        </Fragment>
    );
};

export default Categories;