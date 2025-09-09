import React, {useState, useEffect, Fragment} from 'react';
import {Skeleton} from "../../ui/skeleton";
import {useSelector} from "react-redux";
import {Card, CardContent, CardHeader, CardTitle} from "../../ui/card";
import CommonBreadCrumb from "../../Comman/CommonBreadCrumb";
import {apiService, cleanQuillHtml, formatDate} from "../../../utils/constent";
import BlurOverlay from "../../Comman/BlurOverlay";
import { PieChart, Pie, Cell, ResponsiveContainer,Tooltip as RechartsTooltip, Legend} from "recharts"
import {commonParagraph} from "../../../utils/Loader";
import EmptyData from "../../Comman/EmptyData";
import {DateRangePicker} from "../../ui/date-range-picker";
import {useParams, useSearchParams} from "react-router-dom";
import {TableHead, TableHeader, TableRow, TableBody, Table, TableCell} from "../../ui/table";
import Pagination from "../../Comman/Pagination";
import {ReadMoreText2} from "../../Comman/ReadMoreText";
import {Button} from "../../ui/button";
import {Loader2, RefreshCw} from "lucide-react";
import topLocation from "../../../assets/TopLocations.png";
import topDevices from "../../../assets/TopDevices.png";
import commentsPng from "../../../assets/Comment.png";
import topBrowser from "../../../assets/TopBrowsers.png";
import {Tooltip, TooltipContent} from "../../ui/tooltip";
import {TooltipTrigger} from "@radix-ui/react-tooltip";

const perPageLimit = 10;

const ArticleAnalyticsViews = () => {
    const {id} = useParams();
    const [searchParams] = useSearchParams();
    const title = searchParams.get("title");
    const slug = searchParams.get("slug");
    const getPageNo = searchParams.get("pageNo") || 1;
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [analyticsObj, setAnalyticsObj] = useState({})
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [isBrowsersLoading, setIsBrowsersLoading] = useState(true);
    const [isDevicesLoading, setIsDevicesLoading] = useState(true);
    const [isLocationsLoading, setIsLocationsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [browsersData, setBrowsersData] = useState([]);
    const [devicesData, setDevicesData] = useState([]);
    const [locationsData, setLocationsData] = useState([]);
    const [commentPage, setCommentPage] = useState(1);
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });
    const [commentsPagination, setCommentsPagination] = useState({
        currentPage: 1,
        total: 0,
        pageSize: 10,
    });


    useEffect(() => {
        if(id && projectDetailsReducer.plan > 0){
            getArticleAnalytics()
        }
    }, [id, projectDetailsReducer, state, commentPage])

    const getArticleAnalytics = async () => {
        const payload = {
            projectId: projectDetailsReducer.id,
            articleId: id,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
            commentPage: commentPage,
            commentLimit: perPageLimit
        }

        if (commentPage !== commentsPagination.currentPage) {
            setIsCommentsLoading(true);
        } else {
            setIsInitialLoading(true);
            setIsBrowsersLoading(true);
            setIsDevicesLoading(true);
            setIsLocationsLoading(true);
            setIsCommentsLoading(true);
        }

        const data = await apiService.getArticleAnalytics(payload);

        if (commentPage !== commentsPagination.currentPage) {
            setIsCommentsLoading(false);
        } else {
            setIsInitialLoading(false);
            setIsBrowsersLoading(false);
            setIsDevicesLoading(false);
            setIsLocationsLoading(false);
            setIsCommentsLoading(false);
        }

        if (data.success) {
            const simplifiedData = (data.data?.browsers || []).map((x) => ({
                name: x.browser,
                value: x.count ? Number(x.count) : 0,
            }));
            setAnalyticsObj(data.data);
            if (data.data?.comments?.pagination) {
                const { currentPage, totalComments, limit } = data.data.comments.pagination;
                setCommentsPagination({
                    currentPage,
                    total: totalComments,
                    pageSize: limit,
                });
            }
            setBrowsersData(simplifiedData);
            setDevicesData(data?.data?.devices);
            setLocationsData(data?.data?.locations);
        }
    }

    const analyticsViews = [
        {
            id: 1,
            title: "Total Articles Views",
            count: projectDetailsReducer.plan === 0 ? 10 : (analyticsObj?.totalArticleView || 0),
        },
        {
            id: 2,
            title: "Total Thumbs Down",
            count: projectDetailsReducer.plan === 0 ? 4 : (analyticsObj?.totalThumbsDown || 0),
        },
        {
            id: 3,
            title: "Total Thumbs Up",
            count: projectDetailsReducer.plan === 0 ? 14 : (analyticsObj?.totalThumbsUp || 0),
        },
        {
            id: 4,
            title: "Reaction Rate",
            count: projectDetailsReducer.plan === 0 ? "40%" : (analyticsObj?.requisitionRate || 0),
        },
        {
            id: 5,
            title: "Total Unique Views",
            count: projectDetailsReducer.plan === 0 ? 97 : (analyticsObj?.uniqueView || 0),
        },
    ]

    const links = [{ label: 'Article', path: `/help/article?pageNo=${getPageNo}` }];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const index = browsersData.findIndex((item) => item.name === data.name);
            const color = COLORS[index % COLORS.length];

            return (
                <div
                    style={{
                        backgroundColor: "#2a3b3e",
                        color: "#fff",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        padding: "5px 8px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                      <span
                          style={{
                              display: "inline-block",
                              width: "10px",
                              height: "10px",
                              backgroundColor: color,
                              marginRight: "5px",
                          }}
                      />
                    <span>{`${data.name}: ${data.value}`}</span>
                </div>
            );
        }
        return null;
    };

    const onChangeDate = (selected) => {
        const isAllTime = !selected?.from && !selected?.to;
        setState({from: isAllTime ? null : selected.from, to: isAllTime ? null : selected.to,});
        setCommentPage(1);
        handleManualRefresh();
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        setIsCommentsLoading(true);
        await getArticleAnalytics();
        setIsRefreshing(false);
    };

    return (
        <Fragment>
            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                <div className={"pb-6 flex justify-between gap-2 items-center flex-wrap"}>
                    <CommonBreadCrumb
                        links={links}
                        currentPagePath={`/help/article/${slug}`}
                        crumbName={projectDetailsReducer.plan > 0 ? (isInitialLoading ? "" : "Analytics") : "Analytics"}
                        currentPage={title}
                        truncateLimit={30}
                    />
                    <div className={"flex gap-2 items-center"}>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button variant={"outline"}
                                        className={"h-9"}
                                        onClick={handleManualRefresh}
                                        disabled={isRefreshing || isInitialLoading || projectDetailsReducer.plan === 0}
                                >
                                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh Analytics</p>
                            </TooltipContent>
                        </Tooltip>
                    <DateRangePicker
                        onUpdate={(values) => onChangeDate(values)}
                        initialDateFrom={state.from}
                        initialDateTo={state.to}
                        align="start"
                        locale="en-GB"
                        showCompare={false}
                        disabled={projectDetailsReducer.plan === 0}
                    />
                    </div>
                </div>
                <div className={`flex flex-col gap-4 relative`}>
                    <BlurOverlay {...{isAnalytics: true}}/>
                    <Card>
                        <CardContent className={"p-0"}>
                            <div className={"grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-1"}>
                                {
                                    (analyticsViews || []).map((x, i) => {
                                        return (
                                            <Fragment key={i}>
                                                {
                                                    isInitialLoading ?
                                                        <div className={"space-y-[14px] w-full p-4 border-b md:border-b-[0px] md:border-r last:border-b-0 last:border-r-0"}>
                                                            <Skeleton className="h-4"/>
                                                            <Skeleton className="h-4"/></div> :
                                                        <div className={`p-4 border-b lg:border-b-[0px] md:border-r last:border-b-0 last:border-r-0`}>
                                                            <h3 className={"text-base font-medium"}>{x.title}</h3>
                                                            <div className={"flex gap-1"}>
                                                                <h3 className={`text-2xl font-medium`}>{x.count}</h3>
                                                            </div>
                                                        </div>
                                                }
                                            </Fragment>
                                        )
                                    })
                                }
                            </div>
                        </CardContent>
                    </Card>

                    <div className={'grid sm:grid-cols-2 gap-4'}>
                        <Card className={"shadow border"}>
                            <CardHeader className={"p-4 pb-0"}>
                                <CardTitle className={"text-base font-medium"}>Top Locations</CardTitle>
                            </CardHeader>
                            <CardContent className={"p-4"}>
                                <div className={'flex justify-between gap-2 mb-0.5'}>
                                    <span className={'font-medium text-sm'}>Location</span>
                                    <span className={'font-medium text-sm'}>Visits</span>
                                </div>
                                {
                                    (isInitialLoading || isLocationsLoading) ? commonParagraph(3) : locationsData.length > 0 ?
                                        (locationsData || []).map((x, i) => {
                                            return (
                                                <Fragment key={i}>
                                                    <div
                                                        className={'flex justify-between gap-2 bg-secondary/50 p-2 rounded-md mb-1 last:mb-0'}>
                                                        <span className={'text-sm'}>{x.location}</span>
                                                        <span className={'text-sm'}>{x.count}</span>
                                                    </div>
                                                </Fragment>
                                            )
                                        }) : <EmptyData children={"No locations yet"} emptyIcon={<img src={topLocation}/>}/>
                                }
                            </CardContent>
                        </Card>

                        <Card className={"shadow border"}>
                            <CardHeader className={"p-4 pb-0"}>
                                <CardTitle className={"text-base font-medium"}>Top Devices</CardTitle>
                            </CardHeader>
                            <CardContent className={"p-4"}>
                                <div className={'flex justify-between gap-2 mb-0.5'}>
                                    <span className={'font-medium text-sm'}>Devices</span>
                                    <span className={'font-medium text-sm'}>Visits</span>
                                </div>
                                {(isInitialLoading || isDevicesLoading) ? commonParagraph(3) : devicesData.length > 0 ?
                                    (devicesData || []).map((x, i) => {
                                        return (
                                            <Fragment key={i}>
                                                <div
                                                    className={'flex justify-between gap-2 bg-secondary/50 p-2 rounded-md mb-1 last:mb-0'}>
                                                    <span
                                                        className={'text-sm'}>{x?.device?.charAt(0).toUpperCase() + x?.device?.slice(1)}</span>
                                                    <span className={'text-sm'}>{x?.count}</span>
                                                </div>
                                            </Fragment>
                                        )
                                    }) : <EmptyData children={"No devices found"} emptyIcon={<img src={topDevices}/>}/>
                                }
                            </CardContent>
                        </Card>
                    </div>

                    <Card className={"shadow border"}>
                        <Table>
                            <TableHeader className={`bg-muted`}>
                                <TableRow>
                                    <TableHead className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground`}>Name</TableHead>
                                    <TableHead className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground`}>Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    isCommentsLoading ? (
                                        [...Array(10)].map((_, index) => {
                                            return (
                                                <TableRow key={index}>
                                                    {[...Array(2)].map((_, i) => {
                                                        return (
                                                            <TableCell key={i} className={"max-w-[373px] px-2 py-[10px] md:px-3"}>
                                                                <Skeleton className={"rounded-md w-full h-7"}/>
                                                            </TableCell>
                                                        )})
                                                    }
                                                </TableRow>
                                            )
                                        })
                                    ) : analyticsObj?.comments?.data?.length > 0 ? (
                                        analyticsObj?.comments.data.map((x) => (
                                            <TableRow key={x.id}>
                                                <TableCell className="px-2 py-[10px] md:px-3 max-w-[270px] truncate">{x.customer?.name || "Unknown"}</TableCell>
                                                <TableCell className="px-2 py-[10px] md:px-3 whitespace-pre-line">
                                                    {
                                                        cleanQuillHtml(x.comment) ? (
                                                            <ReadMoreText2 html={x.comment} maxLength={300} />
                                                        ) : null
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className={"hover:bg-transparent"}>
                                            <TableCell colSpan={2}>
                                                <EmptyData children={"No comments"} emptyIcon={<img src={commentsPng}/>}/>
                                            </TableCell>
                                        </TableRow>
                                    )}
                            </TableBody>
                        </Table>
                        {(!isCommentsLoading && analyticsObj?.comments?.data?.length > 0) && (
                            <Pagination
                                pageNo={commentsPagination.currentPage}
                                totalPages={Math.ceil(commentsPagination.total / commentsPagination.pageSize)}
                                isLoading={isCommentsLoading}
                                handlePaginationClick={(page) => setCommentPage(page)}
                                stateLength={analyticsObj?.comments?.data?.length || 0}
                            />
                        )}
                    </Card>

                    <Card className={"shadow border"}>
                        <CardHeader className={"p-4 pb-0"}>
                            <CardTitle className={"text-base font-medium"}>Top Browsers</CardTitle>
                        </CardHeader>
                        <CardContent className={`p-4 ${(isInitialLoading || isBrowsersLoading) ? "" : 'flex'} justify-center`}>
                            {
                                (isInitialLoading || isBrowsersLoading) ? commonParagraph(8) : browsersData.length > 0 ?
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart width={300} height={200}>
                                            <Pie
                                                data={browsersData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                labelLine={false}
                                            >
                                                {(browsersData || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                                ))}
                                            </Pie>
                                            <Legend
                                                align="center"
                                                verticalAlign="bottom"
                                                layout="horizontal"
                                                iconType="square"
                                                iconSize={12}
                                                formatter={(value) => (
                                                    <span style={{marginRight: 10, fontSize: 12}}>{value}</span>
                                                )}
                                            />
                                            <RechartsTooltip content={<CustomTooltip/>}/>
                                        </PieChart>
                                    </ResponsiveContainer> : <EmptyData children={"No browser found"} emptyIcon={<img src={topBrowser}/>}/>
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Fragment>
    );
};

export default ArticleAnalyticsViews;