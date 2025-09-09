import React, { Fragment, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../../ui/card";
import { Button } from "../../ui/button";
import { Plus, Loader2 } from "lucide-react";
import { apiService } from "../../../utils/constent";
import { useSelector } from "react-redux";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "../../ui/accordion";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { useToast } from "../../ui/use-toast";
import { Skeleton } from "../../ui/skeleton";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import EmptyData from "../../Comman/EmptyData";
import { Icon } from "../../../utils/Icon";
import DeleteDialog from "../../Comman/DeleteDialog";
import { useSearchParams } from "react-router-dom";
import ProPlanModal from "../../Comman/ProPlanModal";

export default function Roadmap() {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedRoadmapIdFromUrl = searchParams.get('selected');
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const { roadmapStatus } = useSelector((state) => state.allStatusAndTypes);
    const [roadmapList, setRoadmapList] = useState([]);
    const [originalRoadmapList, setOriginalRoadmapList] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [openAccordion, setOpenAccordion] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isProModal, setIsProModal] = useState(false);

    useEffect(() => {
        if (selectedRoadmapIdFromUrl && roadmapList.length > 0) {
            const roadmapToOpen = roadmapList.find(
                (roadmap) => roadmap.id.toString() === selectedRoadmapIdFromUrl
            );

            if (roadmapToOpen) {
                setOpenAccordion(`item-${roadmapToOpen.id}`);
                setEditingItem(roadmapToOpen.id);

                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('selected');
                setSearchParams(newSearchParams);
            }
        }
    }, [selectedRoadmapIdFromUrl, roadmapList, searchParams, setSearchParams]);

    const validateFields = (item) => {
        const newErrors = {};

        if (!item.title?.trim()) {
            newErrors.title = "Title is required";
        } else if (item.title.length > 255) {
            newErrors.title = "Title must be less than 255 characters";
        }

        if (!item.roadmapStatusIds?.length) {
            newErrors.status = "At least one status must be selected";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getRoadmapAllOptions = async () => {
        setIsLoading(true);
        try {
            const id = projectDetailsReducer.id;
            const response = await apiService.getRoadmapoptions(id);
            if (response.success) {
                setRoadmapList(response.data || []);
                setOriginalRoadmapList(response.data || []);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                description: "Failed to fetch roadmap data",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (item) => {
        if (!validateFields(item)) {
            return;
        }
        setIsSaving(true);
        const body = {
            id: item.id,
            projectId: projectDetailsReducer.id,
            title: item.title?.trim(),
            description: item.description?.trim(),
            roadmapStatusIds: item.roadmapStatusIds,
            isShow: item.isShow,
        };
        try {
            const response = await apiService.updateRoadmap(body);
            if (response.success) {
                const updatedItem = { ...item, ...body, isNew: false };
                const updatedList = roadmapList.map((roadmap) => roadmap.id === item.id ? updatedItem : roadmap);
                setRoadmapList(updatedList);
                setOriginalRoadmapList(updatedList);
                toast({ description: "Roadmap updated successfully" });
                setEditingItem(null);
                setErrors({});
            } else {
                setRoadmapList(originalRoadmapList);
                toast({ variant: "destructive", description: response?.error?.message || "Failed to update roadmap", });
            }
        } catch (error) {
            setRoadmapList(originalRoadmapList);
            toast({ variant: "destructive", description: "An error occurred while updating roadmap", });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (itemId, field, value) => {
        setRoadmapList((prevList) =>
            prevList.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        );

        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const handleStatusChange = (itemId, statusId) => {
        setRoadmapList((prevList) =>
            prevList.map((item) => {
                if (item.id === itemId) {
                    const newStatusIds = item.roadmapStatusIds?.includes(statusId)
                        ? item.roadmapStatusIds.filter((id) => id !== statusId)
                        : [...(item.roadmapStatusIds || []), statusId];
                    return { ...item, roadmapStatusIds: newStatusIds };
                }
                return item;
            })
        );
        if (errors.status) {
            setErrors((prev) => ({ ...prev, status: null }));
        }
    };

    const handleCreateNew = () => {
        if (projectDetailsReducer?.plan === 0 && roadmapList.length >= 1) {
            setIsProModal(true);
            return;
        }

        const newRoadmap = {
            id: Date.now(),
            title: "",
            description: "",
            roadmapStatusIds: [],
            projectId: projectDetailsReducer.id,
            isNew: true,
            isShow: true,
        };
        setRoadmapList((prev) => [newRoadmap, ...prev]);
        setIsCreating(true);
        setEditingItem(newRoadmap.id);
        setOpenAccordion(`item-${newRoadmap.id}`);
    };

    const handleCreate = async (item) => {
        if (!validateFields(item)) {
            return;
        }
        setIsSaving(true);
        const body = {
            projectId: projectDetailsReducer.id,
            title: item.title?.trim(),
            description: item.description?.trim(),
            roadmapStatusIds: item.roadmapStatusIds,
            isShow: item.isShow,
        };
        try {
            const response = await apiService.createRoadmap(body);
            if (response.success) {
                const updatedItem = { ...response.data, isNew: false };
                setRoadmapList((prevList) =>
                    prevList.map((roadmap) =>
                        roadmap.id === item.id ? updatedItem : roadmap
                    )
                );
                setOriginalRoadmapList((prevList) =>
                    prevList.map((roadmap) =>
                        roadmap.id === item.id ? updatedItem : roadmap
                    )
                );
                toast({ description: "Roadmap created successfully" });
                setEditingItem(null);
                setErrors({});
                setIsCreating(false);
            } else {
                toast({ variant: "destructive", description: response?.error?.message || "Failed to create roadmap", });
            }
        } catch (error) {
            toast({ variant: "destructive", description: "An error occurred while creating roadmap", });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = (item) => {
        if (item.isNew) {
            setRoadmapList((prev) =>
                prev.filter((roadmap) => roadmap.id !== item.id)
            );
        } else {
            const originalItem = originalRoadmapList.find(
                (roadmap) => roadmap.id === item.id
            );
            if (originalItem) {
                setRoadmapList((prev) =>
                    prev.map((roadmap) =>
                        roadmap.id === item.id ? originalItem : roadmap
                    )
                );
            }
        }
        setEditingItem(null);
        setErrors({});
        setIsCreating(false);
        setOpenAccordion(null);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setIsDelete(true);
        try {
            const response = await apiService.onDeleteRoadmap(itemToDelete?.id);
            if (response.success) {
                toast({ description: "Roadmap deleted successfully" });
                await getRoadmapAllOptions();
            } else {
                toast({ variant: "destructive", description: response?.error?.message || "Failed to delete roadmap", });
            }
        } catch (error) {
            toast({ variant: "destructive", description: "An error occurred while deleting roadmap", });
        } finally {
            setIsDelete(false);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    useEffect(() => {
        getRoadmapAllOptions();
    }, [projectDetailsReducer.id]);

    const renderSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((index) => (
                <div key={index} className="border rounded-lg px-4 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-full" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Fragment>
            {deleteDialogOpen && (
                <DeleteDialog
                    title="Are you sure you want to remove this roadmap?"
                    isOpen={deleteDialogOpen}
                    onOpenChange={() => setDeleteDialogOpen(false)}
                    onDelete={handleDeleteConfirm}
                    isDeleteLoading={isDelete}
                    deleteRecord={itemToDelete}
                />
            )}

            <ProPlanModal
                isProModal={isProModal}
                setIsProModal={setIsProModal}
            />

            <Card>
                <CardHeader className={"p-4 sm:px-5 sm:py-4 gap-1 border-b flex flex-row sm:flex-nowrap flex-wrap justify-between items-center gap-y-2"}>
                    <div>
                        <CardTitle className={"text-xl lg:text-2xl font-medium"}>Roadmap</CardTitle>
                        <CardDescription className={"text-sm text-muted-foreground p-0 max-w-lg"}>
                            Create and manage your roadmap to keep users informed via your website.
                        </CardDescription>
                    </div>
                    <Button
                        className={"gap-2 font-medium hover:bg-primary m-0"}
                        onClick={handleCreateNew}
                        disabled={isCreating}
                    >
                        <Plus size={18} strokeWidth={3} />New Roadmap
                    </Button>
                </CardHeader>
                <CardContent className="px-4 pt-6 h-full overflow-auto m-auto">
                    {isLoading ? (renderSkeleton()) : roadmapList && roadmapList.length > 0 ? (
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full space-y-4"
                            value={openAccordion}
                            onValueChange={(value) => {
                                const itemId = value ? parseInt(value.replace("item-", "")) : null;
                                const currentItem = roadmapList.find((item) => item.id === itemId);

                                if (!value && editingItem) {
                                    const item = roadmapList.find((item) => item.id === editingItem);
                                    if (item && !item.isNew) {
                                        const originalItem = originalRoadmapList.find((roadmap) => roadmap.id === item.id);
                                        if (originalItem) {
                                            setRoadmapList((prev) =>
                                                prev.map((roadmap) =>
                                                    roadmap.id === item.id ? originalItem : roadmap
                                                )
                                            );
                                        }
                                    }
                                    if (selectedRoadmapIdFromUrl) {
                                        searchParams.delete('selected');
                                        setSearchParams(searchParams);
                                    }
                                }

                                setOpenAccordion(value);
                                setEditingItem(itemId);
                                setErrors({});
                            }}
                        >
                            {roadmapList?.map((item) => (
                                <AccordionItem
                                    key={item.id}
                                    value={`item-${item.id}`}
                                    className={`border rounded-lg px-4 data-[state=open]:shadow-sm transition-all duration-200 ${openAccordion === `item-${item.id}`
                                        ? "shadow-sm bg-slate-50"
                                        : ""
                                        }`}
                                >
                                    <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline w-full">
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="text-lg break-all">
                                                {item.title || (item.isNew ? "New Roadmap" : item.title)}
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive">
                                                    Title
                                                </label>
                                                <Input
                                                    value={item.title}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value.length <= 255) {
                                                            handleFieldChange(item.id, "title", value);
                                                        }
                                                    }}
                                                    className={` ${errors.title ? "border-red-500" : ""}`}
                                                    placeholder="Enter title"
                                                />
                                                {item.title.length ? (
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {item.title.length}/255
                                                    </p>
                                                ) : null}
                                                {errors.title && (<p className="text-sm text-red-500">{errors.title}</p>)}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Description</label>
                                                <Textarea
                                                    value={item.description || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value.length <= 255) {
                                                            handleFieldChange(item.id, "description", value);
                                                        }
                                                    }}
                                                    className={`min-h-[100px]  bg-white ${errors.description ? "border-red-500" : ""}`}
                                                    placeholder="Enter description"
                                                />
                                                {(item.description || "").length ? (
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {(item.description || "").length}/255
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive">
                                                    Select Statuses
                                                </label>
                                                <div className="grid grid-cols-2 pt-2">
                                                    {roadmapStatus?.map((status) => (
                                                        <div key={status.id}
                                                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                                        >
                                                            <Checkbox
                                                                id={`status-${status.id}-${item.id}`}
                                                                checked={item.roadmapStatusIds?.includes(status.id)}
                                                                onCheckedChange={() => handleStatusChange(item.id, status.id)}
                                                            />
                                                            <label htmlFor={`status-${status.id}-${item.id}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                                            >
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.colorCode }} />
                                                                {status.title}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                {errors.status && (<p className="text-sm text-red-500">{errors.status}</p>)}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Publish this roadmap</label>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id={`show-${item.id}`}
                                                        checked={item.isShow}
                                                        onCheckedChange={(checked) => {
                                                            handleFieldChange(item.id, "isShow", checked);
                                                            // if (!editingItem || editingItem !== item.id) {
                                                            //     handleUpdate({...item, isShow: checked});
                                                            // }
                                                            // if (editingItem === item.id || !editingItem) {
                                                            //     handleUpdate({...item, isShow: checked});
                                                            //   }
                                                        }}
                                                    />
                                                    <Label htmlFor={`show-${item.id}`} className="text-sm">
                                                        Show this roadmap
                                                        {/* {item.isShow ? "Visible" : "Hidden"} */}
                                                    </Label>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                {item.isNew ? (
                                                    <Button variant="outline" onClick={() => handleCancel(item)} disabled={isSaving}>
                                                        Cancel
                                                    </Button>
                                                ) : (
                                                    <Button variant="destructive" onClick={() => handleDeleteClick(item)} disabled={isDelete}>
                                                        {isDelete ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : null}
                                                        Delete
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => item.isNew ? handleCreate(item) : handleUpdate(item)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : null}
                                                    {item.isNew ? "Create" : "Save Changes"}
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className={"h-full flex items-center justify-center"}>
                            <EmptyData emptyIcon={Icon.roadmapEmpty} children={"You haven't created a roadmap yet"} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </Fragment>
    );
}
