import React, {Fragment, useEffect, useState} from "react";
import {Button} from "../ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../ui/table";
import {BarChart, Ellipsis, Plus, Trash2} from "lucide-react";
import {useSelector} from "react-redux";
import {DropdownMenu, DropdownMenuTrigger,} from "@radix-ui/react-dropdown-menu";
import {DropdownMenuContent, DropdownMenuItem} from "../ui/dropdown-menu";
import {Card, CardContent} from "../ui/card";
import {useNavigate, useSearchParams} from "react-router-dom";
import {apiService, baseUrl, isEmpty, useWindowSize, WIDGET_DOMAIN} from "../../utils/constent";
import {useToast} from "../ui/use-toast";
import {Skeleton} from "../ui/skeleton";
import EmptyData from "../Comman/EmptyData";
import dayjs from "dayjs";
import Pagination from "../Comman/Pagination";
import DeleteDialog from "../Comman/DeleteDialog";
import {EmptyDataContent} from "../Comman/EmptyDataContent";
import CopyCode from "../Comman/CopyCode";
import {EmptyInWidgetContent} from "../Comman/EmptyContentForModule";
import {Icon} from "../../utils/Icon";
import {Checkbox} from "../ui/checkbox";
import {Tooltip, TooltipContent, TooltipTrigger} from "../ui/tooltip";
import partyPopper from "../../assets/PartyPopper.png";
import { useTour } from "../Comman/TourProvider";
import  widgetEmpt from "../../img/widgetEmpt.png";

const perPageLimit = 10;

const Widgets = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const getPageNo = searchParams.get("pageNo") || 1;
    const {toast} = useToast();
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const [widgetsSetting, setWidgetsSetting] = useState([]);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isCopyLoading, setCopyIsLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [openDelete, setOpenDelete] = useState(false);
    const [openCopyCode, setOpenCopyCode] = useState(false);
    const [selectedType, setSelectedType] = useState("script");
    const [deleteRecord, setDeleteRecord] = useState(null);
    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [totalRecord, setTotalRecord] = useState(0);
    const [emptyContentBlock, setEmptyContentBlock] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelectedDelete, setAllSelectedDelete] = useState(0);
    const [deleteType, setDeleteType] = useState("");
    const [selectedRecord, setSelectedRecord] = useState({});
    const { tourStep } = useTour();
    const { width } = useWindowSize();
    const isTourActive = tourStep !== null && tourStep < 7 && width <= 1279;
    const emptyContent = (status) => {
        setEmptyContentBlock(status);
    };

    const openSheet = (id, type) => {
        setDeleteRecord(id);
        setDeleteType(type)
        setOpenDelete(true);
    };

    const onRedirectAnalytics = (id, title, type) => {
        navigate(`${baseUrl}/widget/analytic-view/${id}?title=${title}&type=${type}`);
    };

    useEffect(() => {
        if (!isEmpty(projectDetailsReducer?.id)) {
            getWidgetsSetting(pageNo, perPageLimit);
        }
        navigate(`${baseUrl}/widget?pageNo=${pageNo}`);
    }, [projectDetailsReducer.id, pageNo, perPageLimit]);

    const getWidgetsSetting = async () => {
        setIsLoading(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            page: pageNo,
            limit: perPageLimit,
        };
        const data = await apiService.getWidgetsSetting(payload);
        setIsLoading(false);
        if (data.success) {
            setWidgetsSetting(data.data?.widgets);
            setTotalRecord(data.data.total);
            if (!data.data?.widgets || data.data?.widgets.length === 0) {
                emptyContent(true);
            } else {
                emptyContent(false);
            }
        } else {
            emptyContent(true);
        }
    };

    const handleCreateNew = (id, type) => {
        if (id === "type") {
            navigate(`${baseUrl}/widget/${id}`);
        } else {
            navigate(`${baseUrl}/widget/${type}/${id}?pageNo=${getPageNo}`);
        }
    };

    const deleteWidget = async (id) => {
        setIsDeleteLoading(true);
        const data = await apiService.onDeleteWidget(id, deleteRecord);
        if (data.success) {
            const clone = [...widgetsSetting];
            const index = clone.findIndex((x) => x.id === id);
            if (index !== -1) {
                clone.splice(index, 1);
                setWidgetsSetting(clone);
                if (clone.length === 0 && pageNo > 1) {
                    setPageNo(pageNo - 1);
                    getWidgetsSetting(pageNo - 1);
                } else {
                    getWidgetsSetting(pageNo);
                }
                setOpenDelete(false);
                setIsDeleteLoading(false);
                toast({description: data.message});
            } else {
                toast({variant: "destructive", description: data?.error?.message});
            }
        }
    };

    const handleCheckboxChange = (id) => {
        setSelectedIds((prev) => {
            const newSelectedIds = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            if (newSelectedIds.length === 0) {
            }
            return newSelectedIds;
        });
    };

    const handleSelectAll = (isChecked) => {
        setAllSelectedDelete(0);
        if (isChecked) {
            const allIds = (widgetsSetting || []).map((x) => x.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkDelete = async (ids) => {
        setIsDeleteLoading(true);
        const payload = {
            widgetIds: ids,
            projectId: projectDetailsReducer.id,
        };
        const data = await apiService.widgetBatchUpdate(payload);
        if (data.success) {
            setIsDeleteLoading(false);
            setWidgetsSetting((prev) => prev.filter((item) => !ids.includes(item.id)));
            setSelectedIds([]);
            setOpenDelete(false);
            getWidgetsSetting();
            toast({description: data.message});
        } else {
            toast({variant: "destructive", description: data.error.message});
        }
    };

    const deleteParticularRow = async () => {
        if (deleteType === "single") {
            await deleteWidget(deleteRecord);
        } else {
            await handleBulkDelete(selectedIds);
            setSelectedIds([]);
        }
        setOpenDelete(false);
    };

    const getCodeCopy = (record) => {
        setOpenCopyCode(!openCopyCode);
        setSelectedRecord(record)
    };

    const totalPages = Math.ceil(totalRecord / perPageLimit);

    const handlePaginationClick = async (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPageNo(newPage);
            setSelectedIds([]);
        }
    };

    const handleCopyCode = (id) => {
        setCopyIsLoading(true);
        navigator.clipboard.writeText(id).then(() => {
            setCopyIsLoading(false);
            toast({description: "Copied to clipboard"});
        }).catch((err) => {console.error("Failed to copy text: ", err);});
    };

    const navList = [
        {
            link: "feedback",
            isCheck: selectedRecord.isIdea !== false,
            isRedirect: selectedRecord.ideaDisplay !== 2,
        },
        {
            link: "roadmap",
            isCheck: selectedRecord.isRoadmap !== false,
            isRedirect: selectedRecord.roadmapDisplay !== 2,
        },
        {
            link: "changelog",
            isCheck: selectedRecord.isAnnouncement !== false,
            isRedirect: selectedRecord.changelogDisplay !== 2,
        },
    ];

    const visibleTab = navList.find(item => item.isCheck && item.isRedirect);

    const activeLink = visibleTab?.link || "feedback";

    const embedLink = `https://${projectDetailsReducer.domain}/widget/${activeLink}?widget='${selectedRecord?.sortCode}'${selectedRecord?.roadmapId ? `&roadmapId=${selectedRecord?.roadmapId}` : ""}`;

    const iFrame = `<iframe src="${embedLink}" style="border: 0px; outline: 0px; width: 450px; height: 400px;"></iframe>`;

    const callback = `window.Quickhunt('${selectedRecord?.sortCode}')`;

    const script = `<script>
    window.Quickhunt_Config = window.Quickhunt_Config || [];
    window.Quickhunt_Config.push({ Quickhunt_Widget_Key: 
     "${selectedRecord?.sortCode}"});
</script>
<script src="${WIDGET_DOMAIN}/widgetScript.js"></script>`;

    const codeString = selectedType === "script" ? script : selectedType === "embedlink" ? embedLink : selectedType === "iframe" ? iFrame : `${script}\n\n${callback}`;

    return (
        <Fragment>
            {(openDelete || deleteType === "all") && (
                <DeleteDialog
                    title={deleteType === "single" ? "You really want to delete this Widget?" : `Delete ${selectedIds?.length > 1 ? "Widgets" : "Widget"}`}
                    isOpen={openDelete}
                    onOpenChange={() => {setOpenDelete(false);setDeleteType("");}}
                    onDelete={deleteParticularRow}
                    isDeleteLoading={isDeleteLoading}
                    deleteRecord={deleteType === "single" ? deleteRecord : selectedIds}
                />
            )}
            {openCopyCode && (
                <Fragment>
                    <CopyCode
                        open={openCopyCode}
                        onClick={() => getCodeCopy({})}
                        title={<div className={"flex items-center gap-2"}><img className={"w-[20px] h-[20px]"} src={partyPopper} alt={"partyPopper"}/> {`Your Widget Is Live!`}</div>}
                        description={"Choose how you’d like to embed your widget, then copy and paste the code on your site to display it."}
                        codeString={codeString}
                        handleCopyCode={handleCopyCode}
                        onOpenChange={() => getCodeCopy({})}
                        isCopyLoading={isCopyLoading}
                        isWidget={true}
                        setSelectedType={setSelectedType}
                        selectedType={selectedType}
                        isCancelBtn={false}
                    />
                </Fragment>
            )}

            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                <div className={"flex flex-col"}>
                    <div className={"flex items-center justify-between flex-wrap gap-2"}>
                        <div className={"flex flex-col gap-y-0.5"}>
                            <h1 className="text-2xl font-normal flex-initial w-auto">Widgets ({totalRecord})</h1>
                            <p className={"text-sm text-muted-foreground"}>
                                Enhance your site with different widgets: Embed, Popover, Modal,
                                and Sidebar, for improved interactivity and access.
                            </p>
                        </div>
                        <div className={"w-full lg:w-auto flex sm:flex-nowrap flex-wrap gap-2 items-center"}>
                            <Button id={"btn-widget-create"} className={"gap-2 font-medium hover:bg-primary"} onClick={isTourActive ? null : () => handleCreateNew("type")}>
                                <Plus size={20} strokeWidth={3}/>
                                <span className={"text-xs md:text-sm font-medium"}>Create New</span>
                            </Button>
                        </div>
                    </div>
                    <Card className={"my-6"}>
                        <CardContent className={"p-0 overflow-auto"}>
                            <Table>
                                <TableHeader className={`p-2 lg:py-5 lg:px-8 bg-muted`}>
                                    <TableRow className={"relative"}>
                                        <TableHead className={`font-semibold px-2 py-[6px] h-10 md:px-3 text-nowrap`}>
                                            <div className="items-center flex space-x-2">
                                                {widgetsSetting.length > 0 ? (
                                                    <Checkbox id={"all"}
                                                        checked={widgetsSetting.length > 0 && selectedIds.length === widgetsSetting.length}
                                                        disabled={isLoading || !widgetsSetting.length}
                                                        onCheckedChange={isLoading ? null : (checked) => handleSelectAll(checked)}
                                                    />
                                                ) : ("")}
                                                {selectedIds.length > 0 && (
                                                    <div className={"absolute left-[20px] md:pl-3 pl-1 md:pr-3 pr-1 w-[calc(100%_-_30px)] flex justify-between items-center gap-4 h-full bg-muted"}>
                                                        <div>
                                                            <label htmlFor={allSelectedDelete === 0 ? "all" : ""}
                                                                className={`text-sm font-medium ${allSelectedDelete === 0 ? "cursor-pointer" : ""} text-gray-900 ml-0`}
                                                            >
                                                                {allSelectedDelete === 0 ? `${selectedIds?.length} Selected` : `All users are selected`}
                                                            </label>
                                                        </div>

                                                        {selectedIds.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button className={"sticky right-2 h-8 w-8"}
                                                                            variant={"outline"} size={"icon"}
                                                                            disabled={isLoading || !widgetsSetting.length || selectedIds.length === 0}
                                                                            onClick={() => {
                                                                                setDeleteType("all");
                                                                                setOpenDelete(true);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={15} className={"text-destructive"}/>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className={"font-normal text-sm"}>
                                                                        Delete Selected{" "}
                                                                        {selectedIds?.length > 1 ? "Widgets" : "Widget"}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                        {["Name", "Type", "Last Updated", "", "Analytics", "Actions",].map((x, i) => {
                                            return (
                                                <TableHead key={i}
                                                    className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground ${
                                                        i > 2 ? "max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap" : ""
                                                    } ${i >= 4 ? "text-center" : ""}`}
                                                >
                                                    {x}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        [...Array(10)].map((_, index) => {
                                            return (
                                                <TableRow key={index}>
                                                    {[...Array(7)].map((_, i) => {
                                                        return (
                                                            <TableCell className={"max-w-[373px] px-2 py-[10px] md:px-3"} key={i}>
                                                                <Skeleton className={"rounded-md w-full h-7"}/>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })
                                    ) : widgetsSetting.length > 0 ? (
                                        <>
                                            {widgetsSetting.map((x, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className={"px-2 py-[10px] md:px-3"}>
                                                        <Checkbox checked={selectedIds.includes(x.id)} onCheckedChange={() => handleCheckboxChange(x.id)}/>
                                                    </TableCell>
                                                    <TableCell onClick={() => handleCreateNew(x.id, x.type)}
                                                        className={"font-normal p-2 py-[10px] md:px-3 cursor-pointer capitalize max-w-[120px] cursor-pointer truncate text-ellipsis overflow-hidden whitespace-nowrap"}
                                                    >
                                                        {x.name}
                                                    </TableCell>
                                                    <TableCell className={"font-normal p-2 py-[10px] md:px-3 capitalize"}>{x.type}</TableCell>
                                                    <TableCell className={"font-normal p-2 py-[10px] md:px-3"}>{dayjs(x.updatedAt).format("D MMM, YYYY")}</TableCell>
                                                    <TableCell className={" p-2 py-[10px] md:px-3 text-center"}>
                                                        <Button className={"py-[6px] px-3 h-auto text-xs font-medium hover:bg-primary"} onClick={() => getCodeCopy(x)}>
                                                            Get code
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className={"font-normal p-2 py-[10px] md:px-3"}>
                                                        <div className={"flex justify-center"}>
                                                            <BarChart onClick={() => onRedirectAnalytics(x.id, x.name, x.type)} size={16} className={"cursor-pointer"}/>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={" p-2 py-[10px] md:px-3 text-center"}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger disabled={selectedIds.length > 0} className={`text-card-foreground ${selectedIds.length > 0 ? 'opacity-50 cursor-not-allowed hover:opacity-50' : 'hover:opacity-80'}`}>
                                                                <Ellipsis size={16} className={"font-normal"}/>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align={"end"}>
                                                                <DropdownMenuItem className={"cursor-pointer"} onClick={() => handleCreateNew(x.id, x.type)}>Edit</DropdownMenuItem>
                                                                <DropdownMenuItem className={"cursor-pointer"} onClick={() => openSheet(x.id, "single")}>Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    ) : (
                                        <TableRow className={"hover:bg-transparent"}>
                                            <TableCell colSpan={7}>
                                                <EmptyData 
                                                    emptyIcon={<img src={widgetEmpt} 
                                                    className='w-[190px] h-[140px]' />} 
                                                    children={<div className="space-y-4 text-center">
                                                        <div>
                                                        <h2 className="text-xl font-bold">Gather feedbacks, everywhere</h2>
                                                        <p>Deploy widgets across your product to capture feedback, anywhere</p>
                                                        </div>
                                                        <Button className={"gap-2 font-medium hover:bg-primary"} onClick={isTourActive ? null : () => handleCreateNew("type")}>
                                                            Start Your First Widget
                                                        </Button>
                                                    </div>}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        {widgetsSetting.length > 0 ? (
                            <Pagination
                                pageNo={pageNo}
                                totalPages={totalPages}
                                isLoading={isLoading}
                                handlePaginationClick={handlePaginationClick}
                                stateLength={widgetsSetting.length}
                            />
                        ) : ("")}
                    </Card>
                    {isLoading || !emptyContentBlock ? ("") : (
                        <EmptyDataContent data={EmptyInWidgetContent} onClose={() => emptyContent(false)} cookieName="hideWidgetEmptyContent"/>
                    )}
                </div>
            </div>
        </Fragment>
    );
};

export default Widgets;
