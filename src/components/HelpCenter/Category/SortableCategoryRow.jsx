import React, { useRef, useEffect, useState, Fragment } from "react";
import {Card, CardContent} from "../../ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "../../ui/table";
import {useSortable, SortableContext, verticalListSortingStrategy,} from "@dnd-kit/sortable";
import {DndContext, closestCenter, useSensors, PointerSensor, MouseSensor, TouchSensor, useSensor, useDndMonitor} from "@dnd-kit/core";
import SortableSubRow from "./SortableSubRow";
import EmptyData from "../../Comman/EmptyData";
import {Checkbox} from "../../ui/checkbox";
import {Button} from "../../ui/button";
import {DropdownMenu, DropdownMenuTrigger,} from "@radix-ui/react-dropdown-menu";
import {DropdownMenuContent, DropdownMenuItem} from "../../ui/dropdown-menu";
import {Ellipsis, GripVertical, Plus} from "lucide-react";
import {restrictToParentElement, restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {isDragging} from "framer-motion";
import Pagination from "../../Comman/Pagination";
import { Skeleton } from "../../ui/skeleton";
import { Icon } from "../../../utils/Icon";

const perPageLimit = 10;

const SortableCategoryRow = ({
                                 category,
                                 onDragEndSubCategory,
                                 toggleSelectSubCategory,
                                 selectedSubCategories,
                                 selectionType,
                                 openSheetSubCategory,
                                 deleteSubRow,
                                 selectedCategories,
                                 toggleSelectCategory,
                                 openSheetCategory,
                                 resetSelections,
                                 initialState,
                                 deleteRow,
                                 handleSubCategoryPagination,
                                 isLoadingSubCate,
                                 categoryPages,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });
    const ref = useRef(null);
    const [width, setWidth] = useState(undefined);
    const [height, setHeight] = useState(undefined);

    useEffect(() => {
        if (isDragging && ref.current) {
            setWidth(ref.current.offsetWidth);
            setHeight(ref.current.offsetHeight);
        }
    }, [isDragging]);

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        touchAction: 'none',
        zIndex: isDragging ? 999 : undefined,
        width: isDragging ? width : '100%',
        height: isDragging ? height : undefined,
    };

    useDndMonitor({
        onDragStart: () => {
            document.body.classList.add('dragging');
        },
        onDragEnd: () => {
            document.body.classList.remove('dragging');
        },
        onDragCancel: () => {
            document.body.classList.remove('dragging');
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    return (
        <div ref={(node) => {
            setNodeRef(node);
            ref.current = node;
        }} style={style} className="my-6">
            <Card>
                <CardContent className={"p-0"}>
                    <div className="overflow-hidden">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEndSubCategory}
                        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        autoScroll={false}
                    >
                        {/*<div className="rounded-md grid grid-cols-1 overflow-auto whitespace-nowrap">*/}
                        <div className="rounded-md grid grid-cols-1 whitespace-nowrap">
                            <Table>
                                {/* --- Category header row --- */}
                                <TableHeader className={`bg-muted py-8 px-5`}>
                                    <TableRow>
                                        <TableCell className="px-2 py-[10px] md:px-3 w-[40px] !cursor-grab" {...attributes} {...listeners}>
                                            <GripVertical size={16} className="text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="px-2 py-[10px] md:px-3 w-[40px]">
                                            <Checkbox
                                                checked={selectedCategories.includes(category.id)}
                                                onCheckedChange={() => toggleSelectCategory(category.id)}
                                                disabled={selectionType === "subcategory"}
                                            />
                                        </TableCell>
                                        <TableHead
                                            className={`capitalize px-2 py-[10px] md:px-3 text-primary font-medium max-w-[270px] cursor-pointer truncate text-ellipsis overflow-hidden whitespace-nowrap`}
                                            onClick={() => openSheetCategory(category.id, category)}
                                        >
                                            {category.title}
                                        </TableHead>
                                        <TableHead className={`capitalize font-medium text-card-foreground px-2 py-[10px] md:px-3 w-[300px] text-end`}>
                                            Articles
                                        </TableHead>
                                        <TableHead className={`capitalize font-medium text-card-foreground px-2 py-[10px] md:px-3 w-[300px] text-end`}>
                                            Created At
                                        </TableHead>
                                        <TableHead className={`capitalize font-medium px-2 py-[10px] md:px-3 w-[300px] text-center`}>
                                            <div className={"space-x-4"}>
                                                <Button
                                                    variant={"ghost hover:bg-none"}
                                                    onClick={() => {
                                                        resetSelections();
                                                        openSheetSubCategory("", {
                                                            ...initialState,
                                                            categoryId: category.id,
                                                        })
                                                    }}
                                                    className={"border border-primary h-8 font-normal text-primary"}
                                                >
                                                    <Plus size={16} className={"mr-2"}/> Add Subcategory
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        disabled={selectionType === "subcategory" || selectedCategories.length > 0}
                                                        className={`text-card-foreground ${
                                                            selectionType === "subcategory" ||
                                                            selectedCategories.length > 0
                                                                ? "opacity-50 cursor-not-allowed hover:opacity-50"
                                                                : "hover:opacity-80"
                                                        }`}
                                                    >
                                                        <Ellipsis size={16}/>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align={"end"}>
                                                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => openSheetCategory(category.id, category)}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => deleteRow(category.id)}>
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                {/* --- Subcategories inside their own DndContext --- */}
                                <DndContext
                                    collisionDetection={closestCenter}
                                    onDragEnd={onDragEndSubCategory}
                                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                                    autoScroll={false}
                                >
                                    <SortableContext
                                        items={category?.subCategories?.rows?.map((s) => s.id) || []}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <TableBody>
                                            {
                                                isLoadingSubCate ? ([...Array(10)].map((_, index) => (
                                                    <TableRow key={index}>
                                                      {[...Array(6)].map((_, i) => (
                                                        <TableCell key={i} className={"max-w-[373px] px-2 py-[10px] md:px-3"}>
                                                          <Skeleton className={"rounded-md w-full h-7"}/>
                                                        </TableCell>
                                                      ))} 
                                                    </TableRow>
                                                  ))
                                                ) : <Fragment>
                                                    {category?.subCategories?.rows?.length > 0 ? (
                                                category?.subCategories?.rows?.map((sub) => (
                                                    <SortableSubRow
                                                        key={sub.id}
                                                        subCategory={sub}
                                                        parentCategoryId={category.id}
                                                        toggleSelectSubCategory={toggleSelectSubCategory}
                                                        selectedSubCategories={selectedSubCategories}
                                                        selectionType={selectionType}
                                                        openSheetSubCategory={openSheetSubCategory}
                                                        deleteSubRow={deleteSubRow}
                                                    />
                                                ))
                                            ) : (
                                                <TableRow className={"hover:bg-transparent"}>
                                                    <TableCell colSpan={6}><EmptyData emptyIcon={Icon.allCategoryEmpty} children={"No sub-categories created yet"}/></TableCell>
                                                </TableRow>
                                            )}
                                                </Fragment>
                                            }
                                        </TableBody>
                                    </SortableContext>
                                </DndContext>
                            </Table>
                                {category?.subCategories?.rows?.length > 0 ? (
                                <Pagination
                                    pageNo={categoryPages[category.id] || 1}
                                    totalPages={Math.ceil(category.subCategories.total / perPageLimit)}
                                    isLoading={isLoadingSubCate}
                                    handlePaginationClick={(newPage) => handleSubCategoryPagination(category.id, newPage)}
                                    stateLength={category?.subCategories?.rows?.length}
                                />
                            ) : ("")}
                        </div>
                    </DndContext>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SortableCategoryRow;
