import React, {Fragment, useCallback, useEffect, useState} from "react";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "../../ui/select";
import {BarChart, Circle, Ellipsis, Eye, Filter, GripVertical, Plus, Trash2, X,} from "lucide-react";
import {Button} from "../../ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "../../ui/table";
import {Card, CardContent} from "../../ui/card";
import {useTheme} from "../../theme-provider";
import {DropdownMenu, DropdownMenuPortal, DropdownMenuSub, DropdownMenuTrigger,} from "@radix-ui/react-dropdown-menu";
import {DropdownMenuContent, DropdownMenuItem, DropdownMenuSubContent, DropdownMenuSubTrigger,} from "../../ui/dropdown-menu";
import {useNavigate} from "react-router-dom";
import {apiService, ARTICLE_LIMITS, baseUrl} from "../../../utils/constent";
import dayjs from "dayjs";
import {useSelector} from "react-redux";
import {useToast} from "../../ui/use-toast";
import {Skeleton} from "../../ui/skeleton";
import EmptyData from "../../Comman/EmptyData";
import {Badge} from "../../ui/badge";
import Pagination from "../../Comman/Pagination";
import DeleteDialog from "../../Comman/DeleteDialog";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "../../ui/command";
import {debounce} from "lodash";
import {EmptyDataContent} from "../../Comman/EmptyDataContent";
import {CommSearchBar} from "../../Comman/CommentEditor";
import {EmptyInArticlesContent} from "../../Comman/EmptyContentForModule";
import {Icon} from "../../../utils/Icon";
import {Tooltip, TooltipTrigger, TooltipContent} from "../../ui/tooltip";
import {Checkbox} from "../../ui/checkbox";
import {RadioGroup, RadioGroupItem} from "../../ui/radio-group";
import {arrayMove, useSortable, SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {useSensors, useSensor, PointerSensor, MouseSensor, TouchSensor, DndContext, closestCenter, useDndMonitor} from "@dnd-kit/core";
import {restrictToParentElement, restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {isDragging} from "framer-motion";
import { CSS } from "@dnd-kit/utilities";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const status = [
    {name: "Publish", value: 1, fillColor: "#389E0D", strokeColor: "#389E0D"},
    {name: "Draft", value: 0, fillColor: "#CF1322", strokeColor: "#CF1322"},
];

const perPageLimit = 10;

const SortableRow = ({ article, onEdit, deleteRow, selectedIds, handleCheckboxChange, viewLink, onRedirectAnalytics, handleStatus }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: article.id });

    const style = {
        transform: CSS?.Transform?.toString(transform),
        transition,
        touchAction: 'none',
        zIndex: isDragging ? 999 : undefined,
    };

    useDndMonitor({
        onDragStart: () => {document.body.classList.add('dragging');},
        onDragEnd: () => {document.body.classList.remove('dragging');},
        onDragCancel: () => {document.body.classList.remove('dragging');}
    });

    return (
        <TableRow ref={setNodeRef} style={style}>
            <TableCell className="px-2 py-[10px] md:px-3 w-[40px] !cursor-grab" {...attributes} {...listeners} >
                <GripVertical size={16} className="ml-2 text-muted-foreground" />
            </TableCell>
            <TableCell className={"px-2 py-[10px] md:px-3"}>
                <Checkbox
                    checked={selectedIds.includes(article.id)}
                    onCheckedChange={() => handleCheckboxChange(article.id)}
                />
            </TableCell>
            <TableCell
                onClick={() => onEdit(article.slug)}
                className={"px-2 py-[10px] md:px-3 font-normal cursor-pointer max-w-[270px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}
            >
                {article.title}
            </TableCell>
            <TableCell
                className={"px-2 py-[10px] md:px-3 font-normal max-w-[270px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}
            >
                {article?.categoryTitle} / {article?.subCategoryTitle}
            </TableCell>
            <TableCell className={"px-2 py-[10px] md:px-3 font-normal"}>
                <Select value={article.isActive} onValueChange={(value) => handleStatus(article, value)}>
                    <SelectTrigger className="w-[137px] h-7">
                        <SelectValue
                            placeholder={article.isActive ? status.find((s) => s.value == article.isActive)?.name : "Publish"}/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {(status || []).map((x, i) => {
                                return (
                                    <Fragment key={i}>
                                        <SelectItem value={x.value} disabled={x.value === 2}>
                                            <div className={"flex items-center gap-2"}>
                                                <Circle fill={x.fillColor} stroke={x.strokeColor} className={`font-normal w-2 h-2`}/>
                                                {x.name}
                                            </div>
                                        </SelectItem>
                                    </Fragment>
                                );
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell
                className={"px-2 py-[10px] md:px-3 font-normal max-w-[270px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}
            >
                <div className={"flex items-center"}>
                    <Button
                        variant={"ghost hover:bg-none"}
                        size="icon"
                        className={"h-auto"}
                        onClick={() => viewLink(article.slug, article.categorySlug, article?.subCategorySlug)}
                    >
                        <Eye size={18} className={`font-normal`}/>
                    </Button>
                </div>
            </TableCell>
            <TableCell className={"px-2 py-[10px] md:px-3 font-normal"}>
                <div className={"flex justify-center"}>
                    <BarChart
                        onClick={() => onRedirectAnalytics(article.id, article.slug, article.title)}
                        size={16}
                        className={"cursor-pointer"}
                    />
                </div>
            </TableCell>
            <TableCell
                className={"px-2 py-[10px] md:px-3 font-normal max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}
            >
                {article?.createdAt ? dayjs.utc(article?.createdAt).local().startOf("seconds").fromNow() : "-"}
            </TableCell>
            <TableCell className={"px-2 py-[10px] md:px-3 font-normal"}>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        disabled={selectedIds.length > 0}
                        className={`text-card-foreground ${selectedIds.length > 0 ? 'opacity-50 cursor-not-allowed hover:opacity-50' : 'hover:opacity-80'}`}
                    >
                        <Ellipsis size={16}/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={"end"}>
                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => onEdit(article.slug)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className={"cursor-pointer"} onClick={() => deleteRow(article.id)}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};

const Articles = () => {
    const {onProModal} = useTheme();
    const {toast} = useToast();
    const navigate = useNavigate();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

    const [filter, setFilter] = useState({search: "", categoryId: "", subcategoryId: "",});
    const [articles, setArticles] = useState([]);
    const [articleList, setArticleList] = useState([]);
    const [totalRecord, setTotalRecord] = useState(0);
    const [totalArticles, setTotalArticles] = useState(0);
    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [idToDelete, setIdToDelete] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [openFilter, setOpenFilter] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [emptyContentBlock, setEmptyContentBlock] = useState(true);

    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [bulkStatusValue, setBulkStatusValue] = useState("");
    const [deleteType, setDeleteType] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        })
    );

    const emptyContent = (status) => {
        setEmptyContentBlock(status);
    };

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllArticles(filter.search);
            getAllCategoryV2();
        }
        navigate(`${baseUrl}/help/article?pageNo=${pageNo}`);
    }, [projectDetailsReducer.id, pageNo]);

    const getAllArticles = async (search, categoryId, subCategoryId) => {
        const params = {
            projectId: projectDetailsReducer.id,
            page: pageNo,
            limit: perPageLimit,
        };

        if (search !== undefined && search !== "") params.search = search;
        if (categoryId !== undefined && categoryId !== "")
            params.categoryId = categoryId;
        if (subCategoryId !== undefined && subCategoryId !== "")
            params.subCategoryId = subCategoryId;

        const data = await apiService.getAllArticles(params);
        setIsLoading(false);
        if (data.success) {
            setArticles(data?.data?.formattedData);
            setTotalRecord(data.data.total);
            setTotalArticles(data.data.totalArticles);
            if (
                !data?.data?.formattedData ||
                data?.data?.formattedData.length === 0
            ) {
                emptyContent(true);
            } else {
                emptyContent(false);
            }
        } else {
            emptyContent(true);
        }
    };

    const getAllCategoryV2 = async () => {
        const data = await apiService.getAllCategoryV2({
            projectId: projectDetailsReducer.id,
        });
        if (data.success) {
            setArticleList(data.data);
        }
    };

    const throttledDebouncedSearch = useCallback(
        debounce((value) => {
            getAllArticles(value, filter.categoryId, filter.subcategoryId);
        }, 500),
        [projectDetailsReducer.id, filter.categoryId, filter.subcategoryId]
    );

    const onChangeSearch = (e) => {
        const value = e.target.value;
        setFilter({...filter, search: value});
        throttledDebouncedSearch(value);
    };

    const filterData = (name, value) => {
        let updatedFilter = {...filter};
        if (name === "categoryId") {
            updatedFilter.categoryId = value;
            const category = articleList.rows.find((x) => x.id === value);
            setSelectedCategory(category ? {id: value, title: category.title} : null);
        } else if (name === "subcategoryId") {
            updatedFilter.subcategoryId = value;
            const subCategory = articleList.rows.flatMap((x) => x.subCategories).find((y) => y.id === value);
            setSelectedSubCategory(subCategory ? {id: value, title: subCategory.title} : null);
        }

        setFilter(updatedFilter);
        setOpenFilter(false);
        setPageNo(1);
        getAllArticles(updatedFilter.search, updatedFilter.categoryId, updatedFilter.subcategoryId);
    };

    const clearSearchFilter = () => {
        setFilter((prev) => ({...prev, search: ""}));
        setPageNo(1);
        getAllArticles("", filter.categoryId, filter.subcategoryId);
    };

    const clearCategoryFilter = () => {
        setSelectedCategory(null);
        setFilter((prev) => ({...prev, categoryId: "",}));
        setPageNo(1);
        getAllArticles(filter.search, "", filter.subcategoryId);
    };

    const clearSubCategoryFilter = () => {
        setSelectedSubCategory(null);
        setFilter((prev) => ({...prev, subcategoryId: ""}));
        setPageNo(1);
        getAllArticles(filter.search, filter.categoryId, "");
    };

    const handleCreateClick = () => {
        const userPlan = projectDetailsReducer.plan;
        const articlesLimit = ARTICLE_LIMITS[userPlan];
        if (totalArticles < articlesLimit) {
            navigate(`${baseUrl}/help/article/new`);
            onProModal(false);
        } else {
            onProModal(true);
        }
    };

    const onEdit = (record) => {
        navigate(`${baseUrl}/help/article/${record}?pageNo=${getPageNo}`);
    };

    const deleteRow = (id, type = "single") => {
        setIdToDelete(id);
        setDeleteType(type);
        setOpenDelete(true);
    };

    const handleDelete = async () => {
        setIsLoadingDelete(true);
        const data = await apiService.deleteArticles(idToDelete);
        const clone = [...articles];
        const index = clone.findIndex((x) => x.id == idToDelete);
        if (data.success) {
            if (index !== -1) {
                clone.splice(index, 1);
                setArticles(clone);
                if (clone.length === 0 && pageNo > 1) {
                    handlePaginationClick(pageNo - 1);
                } else {
                    getAllArticles();
                }
            }
            toast({description: data.message});
        } else {
            toast({description: data.error.message, variant: "destructive"});
        }
        setIsLoadingDelete(false);
        setOpenDelete(false);
    };

    const totalPages = Math.ceil(totalRecord / perPageLimit);

    const handlePaginationClick = async (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setIsLoading(true);
            setPageNo(newPage);
            setSelectedIds([]);
        }
    };

    const handleStatus = async (object, value) => {
        const payload = {...object, isActive: value,};
        const data = await apiService.updateArticle(payload, object.id);
        if (data.success) {
            setArticles(articles.map((x) => x.id === object.id ? {...x, isActive: value,} : x));
            toast({description: data.message});
        } else {
            toast({description: data.error.message, variant: "destructive"});
        }
    };

    const handleCheckboxChange = (id) => {
        setSelectedIds((prev) => {
            const newSelectedIds = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            if (newSelectedIds.length === 0) {
                setBulkStatusValue("");
            }
            return newSelectedIds;
        });
    };

    const handleSelectAll = (isChecked) => {
        setAllSelectedDelete(0);
        if (isChecked) {
            const allIds = (articles || []).map((x) => x.id);
            setSelectedIds(allIds);
            setBulkStatusValue("");
        } else {
            setSelectedIds([]);
            setBulkStatusValue("");
        }
    };

    const handleBulkStatusUpdate = async (ids, statusValue) => {
        const payload = {
            articleIds: ids,
            projectId: projectDetailsReducer.id,
            actionType: "status",
            actionValue: Number(statusValue),
        };
        const data = await apiService.articlesBatchUpdate(payload);
        if (data.success) {
            setArticles((prev) => prev.map((item) => ids.includes(item.id) ? {
                ...item,
                isActive: Number(statusValue)
            } : item));
            setSelectedIds([]);
            setBulkStatusValue("");
            getAllArticles();
            toast({description: data.message});
        } else {
            toast({variant: "destructive", description: data.error.message});
        }
    };

    const handleBulkDelete = async (ids) => {
        setIsLoadingDelete(true);
        const payload = {
            articleIds: ids,
            projectId: projectDetailsReducer.id,
            actionType: "delete",
            actionValue: 2,
        };

        const data = await apiService.articlesBatchUpdate(payload);
        if (data.success) {
            setArticles((prev) => prev.filter((item) => !ids.includes(item.id)));
            setSelectedIds([]);
            setOpenDelete(false);
            setIsLoadingDelete(false);
            getAllArticles();
            setPageNo(1);
            toast({description: data.message});
        } else {
            toast({variant: "destructive", description: data.error.message});
        }
    };

    const deleteParticularRow = async () => {
        if (deleteType === "single") {
            await handleDelete();
        } else {
            await handleBulkDelete(selectedIds);
            setSelectedIds([]);
            setBulkStatusValue("");
        }
        setOpenDelete(false);
    };

    const viewLink = (id, subId, cat) => {
        window.open(`https://${projectDetailsReducer.domain}/documents/${subId}/${cat}/${id}`, "_blank");
    };

    const onRedirectAnalytics = (id, slug, title) => {
        // navigate(`${baseUrl}/help/article/analytic-view/${id}?slug=${slug}&title=${title}`);
        navigate(`${baseUrl}/help/article/analytic-view/${id}?slug=${slug}&title=${encodeURIComponent(title)}`);
    };

    const clearAllFilters = () => {
        setFilter({ search: "", categoryId: "", subcategoryId: "" });
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        getAllArticles("", "", "");
    };

     const handleDragEnd = async (event) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = articles.findIndex((item) => item.id === active.id);
        const newIndex = articles.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const basePosition = (pageNo - 1) * perPageLimit;
            const updated = arrayMove(articles, oldIndex, newIndex);
            const payload = {
                positions: updated.map((item, index) => ({
                    id: item.id,
                    position: basePosition + index + 1
                })),
                projectId: projectDetailsReducer.id
            };
            
            setArticles(updated);
            const data = await apiService.updatePositionArticles(payload);
            if (data.success) {
                toast({description: data.message});
                getAllArticles();
            } else {
                setArticles(articles);
                toast({description: data.error.message, variant: "destructive"});
            }
        }
    };

    return (
        <div
            className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
            {(openDelete || deleteType === "all") && (
                <DeleteDialog
                    title={deleteType === "single" ? "You really want to delete this Article?" : `Delete ${selectedIds?.length > 1 ? "Articles" : "Article"}`}
                    isOpen={openDelete}
                    onOpenChange={() => {
                        setOpenDelete(false);
                        setDeleteType("");
                    }}
                    onDelete={deleteParticularRow}
                    isDeleteLoading={isLoadingDelete}
                    deleteRecord={deleteType === "single" ? idToDelete : selectedIds}
                />
            )}
            <div className={"flex items-center justify-between flex-wrap gap-2"}>
                <div className={"flex flex-col flex-1 gap-y-0.5"}>
                    <h1 className="text-2xl font-normal flex-initial w-auto">All Articles ({totalRecord})</h1>
                    <p className={"text-sm text-muted-foreground"}>
                        Create a self-service help center to save your team time and provide
                        customers with the support they've been seeking.
                    </p>
                </div>
                <div className={"w-full lg:w-auto flex sm:flex-nowrap flex-wrap gap-2 items-center"}>
                    <div className={"flex gap-2 items-center w-full lg:w-auto"}>
                        <CommSearchBar value={filter.search} onChange={onChangeSearch} onClear={clearSearchFilter}
                                       placeholder="Search..." inputClassName={"min-w-[224px] pr-[34px]"}
                        />
                        <div className={"flex items-center"}>
                            <DropdownMenu open={openFilter} onOpenChange={setOpenFilter}>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-9 w-9" size="icon" variant="outline">
                                        <Filter fill="true" className="w-4 h-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>Category</DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <Command>
                                                    <CommandInput placeholder="Search..."/>
                                                    <CommandList>
                                                        <CommandEmpty>No data found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <RadioGroup
                                                                value={filter.categoryId}
                                                                className="gap-0"
                                                                onValueChange={(value) => {
                                                                    filterData("categoryId", value);
                                                                    setOpenFilter(false);
                                                                }}
                                                            >
                                                                {(articleList?.rows || []).map((x) => (
                                                                    <CommandItem
                                                                        key={x.id}
                                                                        value={x.id}
                                                                        className="p-0 flex gap-1 items-center cursor-pointer"
                                                                        onSelect={() => {
                                                                            filterData("categoryId", x.id);
                                                                            setOpenFilter(false);
                                                                        }}
                                                                    >
                                                                        <RadioGroupItem
                                                                            id={`category-${x.id}`}
                                                                            value={x.id}
                                                                            className="m-2"
                                                                        />
                                                                        <span
                                                                            onClick={() => {
                                                                                filterData("categoryId", x.id);
                                                                                setOpenFilter(false);
                                                                            }}
                                                                            className="flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center">
                                                                            <span className="max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                                                                {x.title}
                                                                            </span>
                                                                        </span>
                                                                    </CommandItem>
                                                                ))}
                                                            </RadioGroup>
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>Sub Category</DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                <Command>
                                                    <CommandInput placeholder="Search..."/>
                                                    <CommandList>
                                                        <CommandEmpty>No data found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <RadioGroup
                                                                value={filter.subcategoryId}
                                                                className="gap-0"
                                                                onValueChange={(value) => {
                                                                    filterData("subcategoryId", value);
                                                                    setOpenFilter(false);
                                                                }}
                                                            >
                                                                {(articleList?.rows || []).flatMap(x => x.subCategories).map((y) => (
                                                                    <CommandItem
                                                                        key={y.id}
                                                                        value={y.id}
                                                                        className="p-0 flex gap-1 items-center cursor-pointer"
                                                                        onSelect={() => {
                                                                            filterData("subcategoryId", y.id);
                                                                            setOpenFilter(false);
                                                                        }}
                                                                    >
                                                                        <RadioGroupItem
                                                                            id={`subcategory-${y.id}`}
                                                                            value={y.id}
                                                                            className="m-2"
                                                                        />
                                                                        <span
                                                                            onClick={() => {
                                                                                filterData("subcategoryId", y.id);
                                                                                setOpenFilter(false);
                                                                            }}
                                                                            className="flex-1 w-full text-sm font-normal cursor-pointer flex gap-2 items-center">
                                                                            <span className="max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                                                                {y.title}
                                                                            </span>
                                                                        </span>
                                                                    </CommandItem>
                                                                ))}
                                                            </RadioGroup>
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <Button onClick={handleCreateClick} className={"gap-2 font-medium hover:bg-primary"}>
                        <Plus size={20} strokeWidth={3}/>
                        <span className={"text-xs md:text-sm font-medium"}>New Article</span>
                    </Button>
                </div>
            </div>
            {(selectedCategory || selectedSubCategory) && (
                <div className="mt-4 flex gap-4">
                    {selectedCategory && (
                        <Badge key={`selected-${selectedCategory.id}`} variant="outline"
                               className="rounded p-0 font-medium">
                            <span className="px-3 py-1.5 border-r">{selectedCategory.title}</span>
                            <span className="w-7 h-7 flex items-center justify-center cursor-pointer" onClick={clearCategoryFilter}>
                                <X className="w-4 h-4"/>
                            </span>
                        </Badge>
                    )}
                    {selectedSubCategory && (
                        <Badge key={`selected-${selectedSubCategory.id}`} variant="outline"
                               className="rounded p-0 font-medium">
                            <span className="px-3 py-1.5 border-r">{selectedSubCategory.title}</span>
                            <span className="w-7 h-7 flex items-center justify-center cursor-pointer" onClick={clearSubCategoryFilter}>
                                <X className="w-4 h-4"/>
                            </span>
                        </Badge>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-primary hover:text-primary ml-2"
                        onClick={clearAllFilters}
                    >
                        Clear all
                    </Button>
                </div>
            )}
            <div className={"my-6"}>
                <Card>
                    <CardContent className={"p-0 overflow-auto"}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            autoScroll={false}
                        >
                            <SortableContext
                                items={articles.map(item => item.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <Table>
                                    <TableHeader className={`bg-muted py-8 px-5`}>
                                        <TableRow className={"relative"}>
                                            <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap ${selectedIds.length > 0 ? "hidden" : ""}`} />
                                            <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                                <div className="items-center flex space-x-2">
                                                    {articles.length > 0 ? (
                                                        <Checkbox
                                                            id={"all"}
                                                            disabled={isLoading || !articles?.length}
                                                            checked={articles.length > 0 && selectedIds.length === articles.length}
                                                            onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                                        />
                                                    ) : ("")}
                                                    {selectedIds.length > 0 && (
                                                        <div
                                                            className={"absolute left-[20px] md:pl-3 pl-1 w-[calc(100%_-_28px)] rounded-tl-md rounded-tr-md flex justify-between items-center gap-4 h-[48px] bg-muted"}>
                                                            <div>
                                                                <label htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                                       className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}
                                                                >
                                                                    {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All articles are selected`}
                                                                </label>
                                                            </div>

                                                            {selectedIds.length > 0 && (
                                                                <div className="flex items-center gap-2 md:pr-3 pr-1">
                                                                    <Select value={bulkStatusValue}
                                                                            onValueChange={(value) => {
                                                                                setBulkStatusValue(value);
                                                                                handleBulkStatusUpdate(selectedIds, value);
                                                                            }}
                                                                    >
                                                                        <SelectTrigger className="w-[150px] h-8"><SelectValue
                                                                            placeholder="Bulk Status"/></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectGroup>
                                                                                {status.map((x, i) => (
                                                                                    <SelectItem key={i} value={x.value.toString()}>
                                                                                        <div className={"flex items-center gap-2"}>
                                                                                            <Circle fill={x.fillColor} stroke={x.strokeColor} className={`font-normal w-2 h-2`}/>
                                                                                            {x.name}
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectGroup>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button className={"h-8 w-8"}
                                                                                    variant={"outline"} size={"icon"}
                                                                                    disabled={isLoading || !articles?.length || selectedIds.length === 0}
                                                                                    onClick={() => deleteRow(null, "all")}
                                                                            >
                                                                                <Trash2 size={15} className={"text-destructive"}/>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className={"font-normal text-sm"}>
                                                                            Delete
                                                                            Selected{" "}{selectedIds?.length > 1 ? "Articles" : "Article"}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableHead>
                                            {["Title", "Category / Subcategory", "Status", "Preview", "Analytics", "Created At", "",].map((x, i) => (
                                                <TableHead
                                                    className={`font-medium text-card-foreground px-2 py-[10px] md:px-3 ${i === 4 ? "text-center" : ""} ${i === 5 ? "max-w-[140px] text-start truncate text-ellipsis overflow-hidden whitespace-nowrap" : ""}`}
                                                    key={i}
                                                >
                                                    {x}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(10)].map((_, index) => {
                                                return (
                                                    <TableRow key={index}>
                                                        {[...Array(9)].map((_, i) => {
                                                            return (
                                                                <TableCell key={i} className={"max-w-[373px] px-2 py-[10px] md:px-3"}>
                                                                    <Skeleton className={"rounded-md  w-full h-7"}/>
                                                                </TableCell>
                                                            );
                                                        })}
                                                    </TableRow>
                                                );
                                            })
                                        ) : articles?.length > 0 ? (
                                            <Fragment>
                                                {articles.map((article) => (
                                                    <SortableRow
                                                        key={article.id}
                                                        article={article}
                                                        onEdit={onEdit}
                                                        deleteRow={deleteRow}
                                                        selectedIds={selectedIds}
                                                        handleCheckboxChange={handleCheckboxChange}
                                                        viewLink={viewLink}
                                                        onRedirectAnalytics={onRedirectAnalytics}
                                                        handleStatus={handleStatus}
                                                    />
                                                ))}
                                            </Fragment>
                                        ) : (
                                            <TableRow className={"hover:bg-transparent"}>
                                                <TableCell colSpan={9}>
                                                    <EmptyData
                                                        children={filter ? "No articles found" : "No articles created yet"}
                                                        emptyIcon={Icon.allArticlesEmpty}/>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                    {articles?.length > 0 ? (
                        <Pagination pageNo={pageNo} totalPages={totalPages} isLoading={isLoading}
                                    handlePaginationClick={handlePaginationClick} stateLength={articles?.length}
                        />
                    ) : ("")}
                </Card>
            </div>
            {isLoading || !emptyContentBlock ? ("") : (
                <EmptyDataContent data={EmptyInArticlesContent} onClose={() => emptyContent(false)}
                                  setSheetOpenCreate={handleCreateClick} cookieName="hideArticleEmptyContent"
                />
            )}
        </div>
    );
};

export default Articles;
