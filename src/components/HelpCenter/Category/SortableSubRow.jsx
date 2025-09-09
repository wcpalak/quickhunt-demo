import React from "react";
import {TableCell, TableRow,} from "../../ui/table";
import {useSortable,} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {Checkbox} from "../../ui/checkbox";
import dayjs from "dayjs";
import {DropdownMenu, DropdownMenuTrigger,} from "@radix-ui/react-dropdown-menu";
import {DropdownMenuContent, DropdownMenuItem} from "../../ui/dropdown-menu";
import {Ellipsis, GripVertical} from "lucide-react";

import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const SortableSubRow = ({
                            subCategory,
                            parentCategoryId,
                            toggleSelectSubCategory,
                            selectedSubCategories,
                            selectionType,
                            openSheetSubCategory,
                            deleteSubRow
                        }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: subCategory.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
        zIndex: isDragging ? 999 : undefined,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
        >
            <TableCell className="px-2 py-[10px] md:px-3 w-[40px] !cursor-grab" {...attributes} {...listeners} >
                <GripVertical size={16} className="ml-2 text-muted-foreground" />
            </TableCell>
            <TableCell className="px-2 py-[10px] md:px-3 w-[40px]">
                <Checkbox
                    checked={selectedSubCategories.includes(subCategory.id)}
                    onCheckedChange={() => toggleSelectSubCategory(subCategory.id)}
                    disabled={selectionType === "category"}
                />
            </TableCell>
            <TableCell
                className="px-2 py-[10px] md:px-3 max-w-[270px] truncate cursor-pointer"
                onClick={() => openSheetSubCategory(subCategory.id, { ...subCategory, categoryId: parentCategoryId })}
            >
                {subCategory.title}
            </TableCell>
            <TableCell className="px-2 py-[10px] md:px-3 w-[300px] text-end">
                {subCategory?.articleCount || "0"}
            </TableCell>
            <TableCell className="px-2 py-[10px] md:px-3 w-[300px] text-end">
                {subCategory?.createdAt
                    ? dayjs
                        .utc(subCategory?.createdAt)
                        .local()
                        .startOf("seconds")
                        .fromNow()
                    : "-"}
            </TableCell>
            <TableCell className="px-2 py-[10px] md:px-3 w-[300px] text-center">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        disabled={selectionType === "category" || selectedSubCategories.length > 0}
                        className={`text-card-foreground ${
                            selectionType === "category" ||
                            selectedSubCategories.length > 0
                                ? "opacity-50 cursor-not-allowed hover:opacity-50"
                                : "hover:opacity-80"
                        }`}
                    >
                        <Ellipsis className={`font-normal`} size={18}/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={"end"}>
                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => openSheetSubCategory(subCategory.id, {...subCategory, categoryId: parentCategoryId,})}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => deleteSubRow(subCategory.id)}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};

export default SortableSubRow;
