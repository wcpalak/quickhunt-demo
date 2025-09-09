import React, {useState, Fragment, useEffect} from 'react';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../ui/table";
import {Badge} from "../ui/badge";
import {Button} from "../ui/button";
import {BarChart, ChevronDown, ChevronUp, Circle, Ellipsis, Eye, Pin, Trash2} from "lucide-react";
import {CardContent} from "../ui/card";
import {DropdownMenu, DropdownMenuTrigger} from "@radix-ui/react-dropdown-menu";
import {DropdownMenuContent, DropdownMenuItem} from "../ui/dropdown-menu";
import {Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue} from "../ui/select";
import dayjs from "dayjs";
import {apiService, baseUrl} from "../../utils/constent";
import {toast} from "../ui/use-toast";
import {Icon} from "../../utils/Icon";
import {Skeleton} from "../ui/skeleton";
import EmptyData from "../Comman/EmptyData";
import {useNavigate} from "react-router";
import {useLocation} from "react-router-dom";
import DeleteDialog from "../Comman/DeleteDialog";
import {Checkbox} from "../ui/checkbox";
import {Tooltip, TooltipTrigger, TooltipContent} from "../ui/tooltip";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const status = [
    {name: "Publish", value: 1, fillColor: "#389E0D", strokeColor: "#389E0D",},
    {name: "Draft", value: 3, fillColor: "#CF1322", strokeColor: "#CF1322",},
];
const status2 = [
    {name: "Publish", value: 1, fillColor: "#389E0D", strokeColor: "#389E0D",},
    {name: "Scheduled", value: 2, fillColor: "#63C8D9", strokeColor: "#63C8D9",},
    {name: "Draft", value: 3, fillColor: "#CF1322", strokeColor: "#CF1322",},
]

const AnnouncementsTable = ({
                                data,
                                isLoading,
                                handleDelete,
                                isLoadingDelete,
                                onStatusChange,
                                selectedIds,
                                setSelectedIds,
                                handleBulkDelete,
                                handleBulkStatusUpdate
                            }) => {
    const location = useLocation();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo");
    const navigate = useNavigate();

    const [announcementData, setAnnouncementData] = useState([]);
    const [sortOrder, setSortOrder] = useState('asc');
    const [sortedColumn, setSortedColumn] = useState('');
    const [idToDelete, setIdToDelete] = useState(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteType, setDeleteType] = useState('');
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [bulkStatusValue, setBulkStatusValue] = useState('');

    useEffect(() => {
        if (Array.isArray(data)) {
            setAnnouncementData(data.map((item) => ({...item, status: item.status ?? 1})));
        } else {
            setAnnouncementData([]);
        }
    }, [data]);

    const toggleSort = (column) => {
        let sortedData = [...announcementData];
        if (sortedColumn === column) {
            setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortedColumn(column);
            setSortOrder('asc');
        }
        if (column === "Published At") {
            sortedData.sort((a, d) => {
                const dateA = new Date(a.publishedAt);
                const dateD = new Date(d.publishedAt);
                return sortOrder === 'asc' ? dateA - dateD : dateD - dateA;
            });
        }
        setAnnouncementData(sortedData);
    };

    const handleStatusChange = async (object, value) => {
        const updatedRecord = {
            ...object,
            status: value,
            publishedAt: value === 1 ? dayjs(new Date()).format("YYYY-MM-DD") : object.publishedAt,
        };
        setAnnouncementData((prev) => prev.map((x) => (x.id === object.id ? updatedRecord : x)));
        onStatusChange(updatedRecord);
        const labelIds = object.labels.map((label) => label.id);
        // const { featureImage, ...payloadWithoutFeatureImage } = object;
        const payload = {
            // ...payloadWithoutFeatureImage,
            status: value,
            publishedAt: value === 1 ? dayjs(new Date()).format("YYYY-MM-DD") : object.publishedAt,
            labels: labelIds,
            expiredBoolean: (value === 1 && object.status === 3) ? 0 : object.expiredBoolean,
            expiredAt: (value === 1 && object.status === 3) ? null : object.expiredAt
        };
        const data = await apiService.updateAnnouncementStatus(payload, object.id);
        if (data.success) {
            toast({description: data.message});
        } else {
            toast({description: data.error.message, variant: "destructive"});
            setAnnouncementData((prev) => prev.map((x) => (x.id === object.id ? object : x)));
            onStatusChange(object);
        }
    };

    const onEdit = (record) => {
        navigate(`${baseUrl}/changelog/${record.id}?pageNo=${getPageNo}`);
    };

    const shareFeedback = (domain, slug) => {
        window.open(`https://${domain}/changelog/${slug}`, "_blank")
    }

    const deleteRow = (id, type = 'single') => {
        setIdToDelete(id);
        setDeleteType(type);
        setOpenDelete(true);
    }

    const deleteParticularRow = async () => {
        if (deleteType === 'single') {
            await handleDelete(idToDelete);
        } else {
            await handleBulkDelete(selectedIds, "status", 1);
            setSelectedIds([]);
            setBulkStatusValue('');
        }
        setOpenDelete(false);
    }

    const handleCheckboxChange = (id) => {
        setSelectedIds((prev) => {
            const newSelectedIds = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            if (newSelectedIds.length === 0) {
                setBulkStatusValue('');
            }
            return newSelectedIds;
        });
    };

    const handleSelectAll = (isChecked) => {
        setAllSelectedDelete(0);
        if (isChecked) {
            const allIds = (announcementData || []).map((x) => x.id);
            setSelectedIds(allIds);
            setBulkStatusValue('');
        } else {
            setSelectedIds([]);
            setBulkStatusValue('');
        }
    };

    const handleAll = (isChecked) => {
        setAllSelectedDelete(allSelectedDelete === 0 ? 1 : 0);
        if (isChecked) {
            const allIds = (announcementData || []).map((x) => x.id);
            setSelectedIds(allIds);
            setBulkStatusValue('');
        } else {
            setSelectedIds([]);
            setBulkStatusValue('');
        }
    };

    return (
        <Fragment>
            {
                openDelete &&
                <DeleteDialog
                    title={deleteType === 'single' ? "You really want to delete this Changelog?" : `Delete ${selectedIds?.length > 1 ? 'Changelogs' : 'Changelog'}`}
                    isOpen={openDelete}
                    onOpenChange={() => {setOpenDelete(false);setDeleteType('');}}
                    onDelete={deleteParticularRow}
                    isDeleteLoading={isLoadingDelete}
                    deleteRecord={deleteType === 'single' ? idToDelete : selectedIds}
                />
            }

            <CardContent className={"p-0 overflow-auto"}>
                <Table>
                    <TableHeader className={"bg-muted"}>
                        <TableRow>
                            <TableCell colSpan={selectedIds.length > 0 ? 5 : null} className={`px-2 py-[10px] md:px-3 font-normal max-w-[270px]`}>
                                <div className="items-center flex space-x-2">
                                    {
                                        announcementData.length > 0 ?
                                            <Checkbox id={"all"}
                                                checked={announcementData.length > 0 && selectedIds.length === announcementData.length}
                                                // checked={deleteType !== 'single' && (announcementData.length > 0 && selectedIds.length === announcementData.length)}
                                                disabled={isLoading || !announcementData?.length}
                                                onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                            /> : ""
                                    }
                                    {
                                        selectedIds.length > 0 ?
                                            <label htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}>
                                                {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All changelogs are selected`}
                                            </label> : ""
                                    }
                                </div>
                            </TableCell>
                            {
                                selectedIds.length > 0 ? <Fragment>
                                    <TableCell className={"px-2 py-[10px] md:px-3"}>
                                        {
                                            announcementData.length > 10 ?
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant={"link"} className={'text-blue-600 pl-0 ml-3'}
                                                            disabled={isLoading || !announcementData?.length}
                                                            onClick={() => handleAll(allSelectedDelete === 0)}
                                                        >
                                                            {allSelectedDelete === 0 ? `Select all changelogs` : `Undo`}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className={"font-normal text-sm"}>
                                                        {allSelectedDelete === 0 ? `Delete all changelogs` : `Undo`}
                                                    </TooltipContent>
                                                </Tooltip> : ""
                                        }
                                        {selectedIds.length > 0 && (
                                            <div className="flex items-center gap-2 justify-end">
                                                <Select
                                                    value={bulkStatusValue}
                                                    onValueChange={(value) => {
                                                        setBulkStatusValue(value);
                                                        handleBulkStatusUpdate(selectedIds, value);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[150px] h-8">
                                                        <SelectValue placeholder="Bulk Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {status.map((x,i) => (
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
                                                        <Button
                                                            className={'h-8 w-8'} variant={"outline"} size={"icon"}
                                                            disabled={isLoading || !announcementData?.length || selectedIds.length === 0}
                                                            onClick={() => deleteRow(null, 'all')}
                                                        >
                                                            <Trash2 size={15} className={"text-destructive"}/>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className={"font-normal text-sm"}>
                                                        Delete Selected {selectedIds?.length > 1 ? 'Changelogs' : 'Changelog'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </TableCell>
                                </Fragment> : ""
                            }
                            {
                                selectedIds.length > 0 ? "" :
                                ["Title", "Last Updated", "Published At", "Status", "",].map((x, i) => (
                                    <TableHead key={i}
                                        className={`font-medium text-card-foreground px-2 py-[10px] md:px-3 ${x === "Published At" ? "cursor-pointer" : ""} max-w-[140px] truncate text-ellipsis`}
                                        onClick={() => x === "Published At" && toggleSort("Published At")}
                                    >
                                        {x}
                                        {x === "Published At" && (sortOrder === 'asc' ? (<ChevronUp size={18} className="inline ml-1" />) : (<ChevronDown size={18} className="inline ml-1" />))}
                                    </TableHead>
                                ))
                            }
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            isLoading ? (
                                [...Array(10)].map((_, index) => {
                                    return (
                                        <TableRow key={index}>
                                            {[...Array(6)].map((_, i) => {
                                                return (
                                                    <TableCell key={i} className={"max-w-[373px] px-2 py-[10px] md:px-3"}>
                                                        <Skeleton className={"rounded-md w-full h-7"}/>
                                                    </TableCell>
                                                )})
                                            }
                                        </TableRow>
                                    )
                                })
                            ) : announcementData.length > 0 ? <>
                                {(announcementData || []).map((x, index) => {
                                    return (
                                        <TableRow key={index} className={selectedIds.includes(x.id) ? "bg-muted/50" : ""}>
                                            <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                <Checkbox checked={selectedIds.includes(x.id)}
                                                    onCheckedChange={() => handleCheckboxChange(x.id)}
                                                />
                                            </TableCell>
                                            <TableCell className={`px-2 py-[10px] md:px-3 font-normal max-w-[270px]`}>
                                                <div className={"flex flex-wrap items-center gap-2 md:gap-1"}>
                                                    {x.pinTop === 1 && <Pin size={14} className={`fill-card-foreground`}/>}
                                                    <span className={"cursor-pointer max-w-[270px] truncate text-ellipsis overflow-hidden whitespace-nowrap"} onClick={() => onEdit(x)}>{x?.title}</span>
                                                    {x.labels && x.labels.length > 0 ?
                                                        <div className={"flex flex-wrap gap-1"}>
                                                            <Fragment>
                                                                {(x.labels || []).map((y, index) => {
                                                                    return (
                                                                        <Badge variant={"outline"} key={index}
                                                                           style={{color: y.colorCode, borderColor: y.colorCode, textTransform: "capitalize"}}
                                                                           className={`h-[20px] py-0 px-2 text-xs rounded-[5px]  font-medium text-[${y.colorCode}] border-[${y.colorCode}] capitalize`}>
                                                                        <span className={"max-w-[85px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}>{y.name}</span>
                                                                        </Badge>
                                                                    )
                                                                })}
                                                            </Fragment>
                                                        </div> : ""}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`font-normal px-2 py-[10px] md:px-3`}>{x?.updatedAt ? dayjs.utc(x.updatedAt).local().startOf('seconds').fromNow() : "-"}</TableCell>
                                            <TableCell className={`font-normal px-2 py-[10px] md:px-3`}>{x.publishedAt ? dayjs(x.publishedAt).format('D MMM, YYYY') : dayjs().format('D MMM, YYYY')}</TableCell>
                                            <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                <Select value={x.status} onValueChange={(value) => handleStatusChange(x, value)}>
                                                    <SelectTrigger className="w-[137px] h-7">
                                                        <SelectValue placeholder={x.status ? status.find(s => s.value == x.status)?.name : "Publish"}/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {(x.status === 2 ? status2 : status || []).map((x, i) => {
                                                                return (
                                                                    <Fragment key={i}>
                                                                        <SelectItem value={x.value} disabled={x.value === 2}>
                                                                            <div className={"flex items-center gap-2"}>
                                                                                <Circle fill={x.fillColor} stroke={x.strokeColor} className={`font-normal w-2 h-2`}/>
                                                                                {x.name}
                                                                            </div>
                                                                        </SelectItem>
                                                                    </Fragment>
                                                                )})
                                                            }
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                <div className={`flex gap-5 items-center justify-center`}>
                                                <Button disabled={x.status !== 1} variant={"ghost"}
                                                    onClick={() => shareFeedback(x.domain, x.slug)}
                                                    className={"p-0 h-auto"}
                                                >
                                                    <Eye size={18} className={`font-normal`}/>
                                                </Button>
                                                    <Button
                                                        onClick={() => navigate(`${baseUrl}/changelog/analytic-view?id=${x.id}&title=${x?.title}`)}
                                                        variant={"ghost"} className={"p-0 h-auto"}
                                                    >
                                                        <BarChart size={18}/>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger disabled={selectedIds.length > 0} className={`text-card-foreground ${selectedIds.length > 0 ? 'opacity-50 cursor-not-allowed hover:opacity-50' : 'hover:opacity-80'}`}>
                                                            <Ellipsis className={`font-medium`} size={18}/>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align={"end"}>
                                                            <DropdownMenuItem className={"cursor-pointer"} onClick={() => onEdit(x)}>Edit</DropdownMenuItem>
                                                            <DropdownMenuItem className={"cursor-pointer"} onClick={() => deleteRow(x.id)}>Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </> : <TableRow className={"hover:bg-transparent"}>
                                <TableCell colSpan={6}>
                                    <EmptyData
                                        children={<div className="space-y-4 text-center mt-[15px]">
                                            <div>
                                            <h2 className="text-xl font-bold">Ready to share what’s new?</h2>
                                            <p>Let your users know about new features, bug fixes, and improvements</p>
                                            </div>
                                            <Button onClick={() => navigate(`${baseUrl}/changelog/new`)} className={`font-medium `}>
                                                Create Your First Changelog
                                            </Button>
                                        </div>}
                                        emptyIcon={Icon.chnagelogEmptyContentIcon}
                                    />
                                </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                </Table>
            </CardContent>
        </Fragment>
    );
};

export default AnnouncementsTable;