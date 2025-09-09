import React, {useState, useEffect, Fragment} from 'react';
import {Separator} from "../ui/separator";
import {Icon} from "../../utils/Icon";
import {Button} from "../ui/button";
import {ChevronLeft, ChevronRight, Loader2, RefreshCw} from "lucide-react";
import {Skeleton} from "../ui/skeleton";
import {useDispatch, useSelector} from "react-redux";
import {ReadMoreText2} from "../Comman/ReadMoreText";
import {useLocation} from "react-router";
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card";
import CommonBreadCrumb from "../Comman/CommonBreadCrumb";
import {inboxMarkReadAction} from "../../redux/action/InboxMarkReadAction";
import {apiService, formatDate} from "../../utils/constent";
import BlurOverlay from "../Comman/BlurOverlay";
import { PieChart, Pie, Cell, ResponsiveContainer,Tooltip as RechartsTooltip, Legend} from "recharts"
import {commonParagraph} from "../../utils/Loader";
import EmptyData from "../Comman/EmptyData";
import {DateRangePicker} from "../ui/date-range-picker";
import {TooltipTrigger, Tooltip, TooltipContent} from "../ui/tooltip";
import topLocation from "../../assets/TopLocations.png";
import topDevices from "../../assets/TopDevices.png";
import topBrowser from "../../assets/TopBrowsers.png";

const perPageLimit = 10;

const AnalyticsViews = () => {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const postId = urlParams.get("id");
    const title = urlParams.get("title");
    const getPageNo = urlParams.get("pageNo") || 1;
    const dispatch = useDispatch();
    const allEmoji = useSelector(state => state.allStatusAndTypes.emoji);
    const inboxMarkReadReducer = useSelector(state => state.inboxMarkRead);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [analyticsObj, setAnalyticsObj] = useState({})
    const [feedbackList, setFeedbackList] = useState([])
    const [reactionList, setReactionList] = useState([])
    const [views, setViews] = useState([])
    const [totalFeedback, setTotalFeedback] = useState(0)
    const [pageNo, setPageNo] = useState(1);
    const [totalRecord, setTotalRecord] = useState(0);
    const [isLoadingReaction, setIsLoadingReaction] = useState(false)
    const [isLoadingFeedBack, setIsLoadingFeedBack] = useState(false)
    const [isLoading, setIsLoading] = useState(true);
    const [isTopLoading, setIsTopLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingSinglePost, setIsLoadingSinglePost] = useState(false);
    const [browsersData, setBrowsersData] = useState([]);
    const [devicesData, setDevicesData] = useState([]);
    const [locationsData, setLocationsData] = useState([]);
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    useEffect(() => {
        if (postId && projectDetailsReducer.plan > 0) {
            getReaction();
            getFeedback();
            getAnnouncementAnalytics();
        }
    }, [postId, pageNo, projectDetailsReducer, state]);

    useEffect(() => {
        if (!analyticsObj?.title) {
            getSinglePosts();
        }
        if(projectDetailsReducer.plan > 0){
            if(postId){
                getSinglePosts()
            }
        }
    }, [getPageNo, projectDetailsReducer]);

    const getSinglePosts = async () => {
        setIsLoadingSinglePost(true);
        const data = await apiService.getSinglePosts(postId);
        setIsLoadingSinglePost(false);
        if (data.success) {
            setAnalyticsObj(data.data.data)
            const updateInbox = inboxMarkReadReducer.map(item => {
                if ((item.source === 'post_feedbacks' || item.source === 'post_reactions') && item.id === data.data.data.id) {
                    return {...item, isRead: 1};
                }
                return item;
            });
            dispatch(inboxMarkReadAction(updateInbox));
        }
    }

    // useEffect(() => {
    //     if(!analyticsObj?.title){
    //         const getSinglePosts = async () => {
    //             const data = await apiService.getSinglePosts(postId);
    //             if (data.success) {
    //                 setAnalyticsObj(data.data.data)
    //                 const updateInbox = inboxMarkReadReducer.map(item => {
    //                     if ((item.source === 'post_feedbacks' || item.source === 'post_reactions') && item.id === data.data.data.id) {
    //                         return {...item, isRead: 1};
    //                     }
    //                     return item;
    //                 });
    //                 dispatch(inboxMarkReadAction(updateInbox));
    //             }
    //         }
    //         if(projectDetailsReducer.plan > 0){
    //             if(postId){
    //                 getSinglePosts()
    //             }
    //         }
    //     }
    // }, [getPageNo, projectDetailsReducer])

    const getFeedback = async () => {
        setIsLoadingFeedBack(true);
        setIsLoading(true);
        const payload = {
            id: postId,
            page: pageNo,
            limit: perPageLimit,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        }
        const data = await apiService.getFeedback(payload);
        if (data.success) {
            setFeedbackList(data.data.data);
            setTotalFeedback(data.data.total);
            setTotalRecord(data.data.total);
        }
        setIsLoadingFeedBack(false);
        setIsLoading(false);
    };

    const getReaction = async () => {
        setIsLoadingReaction(true)
        const payload = {
            id: postId,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        }
        const data = await apiService.getReaction(payload)
        setIsLoadingReaction(false)
        if (data.success) {
            setReactionList(data.data.reactions)
            setViews(data.data.views)
        }
    }

    const getAnnouncementAnalytics = async () => {
        setIsTopLoading(true);
        const payload = {
            id: postId,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        }
        const data = await apiService.getAnnouncementAnalytics(payload);
        setIsTopLoading(false);
        if (data.success) {
            const simplifiedData = (data.data?.browsers || []).map((x) => ({
                name: x.browser,
                value: x.count ? Number(x.count) : 0,
            }));
            setBrowsersData(simplifiedData);
            setDevicesData(data.data?.devices);
            setLocationsData(data.data?.locations);
        }
    };

    const totalPages = Math.ceil(totalRecord / perPageLimit);

    const handlePaginationClick = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPageNo(newPage);
        }
    };

    const analyticsViews = [
        {
            id: 1,
            title: "Total Views",
            count: projectDetailsReducer.plan === 0 ? 10 : (views && views[0] && views[0].totalView ? views[0].totalView : 0),
        },
        {
            id: 2,
            title: "Unique Views",
            count: projectDetailsReducer.plan === 0 ? 4 : (views && views[0] && views[0].uniqueView ? views[0].uniqueView : 0),
        },
        {
            id: 3,
            title: "Feedback",
            count: projectDetailsReducer.plan === 0 ? 2 : totalFeedback,
        },
    ]

    const links = [{ label: 'Changelog', path: `/changelog?pageNo=${getPageNo}` }];

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
        setState({
            from: isAllTime ? null : selected.from,
            to: isAllTime ? null : selected.to,
        });
        setPageNo(1);
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            getReaction(),
            getFeedback(),
            getAnnouncementAnalytics(),
            getSinglePosts()
        ]);
        setIsRefreshing(false);
    };

    return (
        <Fragment>
            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                <div className={"pb-6 flex justify-between gap-2 items-center flex-wrap"}>
                    <CommonBreadCrumb
                        links={links}
                        currentPagePath={`/changelog/${postId}`}
                        crumbName={isLoading ? "" : "Analytics"}
                        currentPage={projectDetailsReducer.plan === 0 ? title : analyticsObj?.title}
                        truncateLimit={30}
                    />
                    <div className={"flex gap-2 items-center"}>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button variant={"outline"}
                                        className={"h-9"}
                                        onClick={handleManualRefresh}
                                        disabled={isRefreshing || isLoadingReaction || isLoadingFeedBack || isTopLoading || isLoadingSinglePost}
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
                            <div className={"grid md:grid-cols-3 sm:grid-cols-1"}>
                                {
                                    (analyticsViews || []).map((x, i) => {
                                        return (
                                            <Fragment key={i}>
                                                {
                                                    isLoadingReaction ?
                                                        <div className={"space-y-[14px] w-full p-4 border-b md:border-r md:border-0 last:border-b-0 last:border-r-0"}>
                                                            <Skeleton className="h-4"/>
                                                            <Skeleton className="h-4"/></div> :
                                                        <div className={`p-4 border-b md:border-r md:border-0 last:border-b-0 last:border-r-0`}>
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
                    <Card>
                        <CardContent className={"p-4"}>
                            <div className={"flex flex-col gap-3"}>
                                <h5 className={"text-base font-medium leading-5"}>Reaction</h5>
                                {isLoadingReaction ? <div className="flex gap-4 items-center">
                                        {[...Array(4)].map((_, i) => {
                                            return (<Skeleton key={i} className="h-12 w-12 rounded-full"/>)
                                        })}
                                    </div>
                                    : <div className={"flex flex-row flex-wrap gap-4"}>
                                        {
                                            reactionList.length === 0 ?
                                                <p className={"text-muted-foreground text-xs font-normal"}>No reaction received for this changelog yet</p> : <Fragment>
                                                    {
                                                        (reactionList || []).map((x, index) => {
                                                            const matchedEmojiObject = (allEmoji || []).find((y) => y.id === x.reactionId);
                                                            return (
                                                                <div className={""} key={index}>
                                                                    <div className={"flex flex-row gap-2 items-center"}>
                                                                        {matchedEmojiObject ? <img className={"h-10 w-10"} src={matchedEmojiObject?.emojiUrl}/> : Icon?.smileEmoji2}
                                                                        <h5 className={"text-2xl font-medium"}>{x.total}</h5>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                </Fragment>
                                        }
                                    </div>}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className={"p-4"}>
                            <div className={"flex flex-col gap-4"}>
                                <h5 className={"text-base font-medium leading-5"}>Feedback</h5>
                                {
                                    isLoadingFeedBack ?
                                        <div>
                                            {
                                                [...Array(3)].map((_, i) => {
                                                    return (
                                                        <div key={i} className="space-y-2 mt-3">
                                                            <Skeleton className="h-4 w-full"/>
                                                            <Skeleton className="h-4 w-full"/>
                                                            <Separator/>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                        :
                                        <Fragment>
                                            {
                                                feedbackList.length == 0 ?
                                                    <p className={"text-muted-foreground text-xs font-normal"}>No feedback
                                                        received for this changelog yet</p> :
                                                    <div>
                                                        {
                                                            (feedbackList || []).map((x, i) => {
                                                                return (
                                                                    <div key={i} className={"py-4 first:pt-0 border-b"}>
                                                                        <div className={"flex flex-col gap-1"}>
                                                                            <div className={"flex gap-4 items-center"}>
                                                                                <h5 className={"text-sm font-medium"}>{x?.user.name ? x?.user.name : x?.user.firstName + "" + x?.user.lastName}</h5>
                                                                                <p className={"text-muted-foreground text-[12px] font-normal"}>{x?.user.email}</p>
                                                                            </div>
                                                                            <div className={"text-muted-foreground text-xs font-normal"}>
                                                                                <ReadMoreText2 className={"text-xs"} html={x.feedback}/>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                        <div className={"flex flex-row justify-end items-center gap-3 pt-4"}>
                                                            <Button
                                                                disabled={pageNo === 1 || isLoading}
                                                                variant={"outline"}
                                                                className={"h-[30px] w-[30px] p-1.5"}
                                                                onClick={() => handlePaginationClick(pageNo - 1)}
                                                            >
                                                                <ChevronLeft
                                                                    className={pageNo === 1 || isLoading ? "stroke-muted-foreground" : "stroke-primary"}/>
                                                            </Button>
                                                            <h5 className={"text-[14px] font-medium"}>{pageNo}</h5>
                                                            <Button
                                                                disabled={pageNo === totalPages || isLoading}
                                                                variant={"outline"}
                                                                className={"h-[30px] w-[30px] p-1.5"}
                                                                onClick={() => handlePaginationClick(pageNo + 1)}
                                                            >
                                                                <ChevronRight
                                                                    className={pageNo === totalPages || isLoading ? "stroke-muted-foreground" : "stroke-primary"}/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                            }
                                        </Fragment>
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
                                    isTopLoading ? commonParagraph(3) : locationsData.length > 0 ?
                                    (locationsData || []).map((x,i) => {
                                        return (
                                            <Fragment key={i}>
                                               <div className={'flex justify-between gap-2 bg-secondary/50 p-2 rounded-md mb-1 last:mb-0'}>
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
                                {isTopLoading ? commonParagraph(3) : devicesData.length > 0 ?
                                    (devicesData || []).map((x,i) => {
                                        return (
                                            <Fragment key={i}>
                                                <div className={'flex justify-between gap-2 bg-secondary/50 p-2 rounded-md mb-1 last:mb-0'}>
                                                    <span className={'text-sm'}>{x?.device?.charAt(0).toUpperCase() + x?.device?.slice(1)}</span>
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
                        <CardHeader className={"p-4 pb-0"}>
                            <CardTitle className={"text-base font-medium"}>Top Browsers</CardTitle>
                        </CardHeader>
                        <CardContent className={`p-4 ${isTopLoading ? "" : 'flex'} justify-center`}>
                            {
                                isTopLoading ? commonParagraph(8) : browsersData.length > 0 ?
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
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                            </Pie>
                                            <Legend
                                                align="center"
                                                verticalAlign="bottom"
                                                layout="horizontal"
                                                iconType="square"
                                                iconSize={12}
                                                formatter={(value) => (
                                                    <span style={{ marginRight: 10, fontSize: 12 }}>{value}</span>
                                                )}
                                            />
                                            <RechartsTooltip content={<CustomTooltip />} />
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

export default AnalyticsViews;