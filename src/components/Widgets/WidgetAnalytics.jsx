import React, {Fragment, useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card";
import CommonBreadCrumb from "../Comman/CommonBreadCrumb";
import BlurOverlay from "../Comman/BlurOverlay";
import {commonParagraph} from "../../utils/Loader";
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip} from "recharts";
import {useParams, useSearchParams} from "react-router-dom";
import {apiService, formatDate} from "../../utils/constent";
import {useSelector} from "react-redux";
import {Skeleton} from "../ui/skeleton";
import EmptyData from "../Comman/EmptyData";
import {DateRangePicker} from "../ui/date-range-picker";
import {Button} from "../ui/button";
import {Loader2, RefreshCw} from "lucide-react";
import {TooltipContent, TooltipTrigger, Tooltip} from "../ui/tooltip";
import topDevices from "../../assets/TopDevices.png";
import topBrowser from "../../assets/TopBrowsers.png";
import topLocation from "../../assets/TopLocations.png";

const initialData = {
    ideaView: '',
    roadmapView: '',
    widgetView: '',
    announcementView: '',
    docsView: ''
}
const WidgetAnalytics = () => {
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [searchParams] = useSearchParams();
    const title = searchParams.get("title");
    const type = searchParams.get("type");
    const {id} = useParams();
    const [isTopLoading, setIsTopLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [browsersData, setBrowsersData] = useState([]);
    const [devicesData, setDevicesData] = useState([]);
    const [locationsData, setLocationsData] = useState([]);
    const [widgetData, setWidgetData] = useState(initialData);
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    useEffect(() => {
        if (id && projectDetailsReducer.plan > 0) {
            getAnnouncementAnalytics();
        }
    }, [id, projectDetailsReducer, state]);

    const getAnnouncementAnalytics = async () => {
        setIsTopLoading(true);
        const payload = {
            id: id,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        }
        const data = await apiService.getWidgetAnalytics(payload);
        setIsTopLoading(false);
        if (data.success) {
            const simplifiedData = (data.data?.browsers || []).map((x) => ({
                name: x.browser,
                value: x.count ? Number(x.count) : 0,
            }));
            setBrowsersData(simplifiedData);
            setDevicesData(data.data?.devices);
            setLocationsData(data.data?.locations);
            setWidgetData({
                ideaView: data.data?.ideaView,
                roadmapView: data.data?.roadmapView,
                widgetView: data.data?.widgetView,
                announcementView: data.data?.announcementView,
                docsView: data.data?.docsView,
            });
        }
    };

    const widAnalytics = [
        {
            id: 1,
            title: 'Widget views',
            count: widgetData?.widgetView,
        },
        {
            id: 2,
            title: 'Changelog views',
            count: widgetData?.announcementView,
        },
        {
            id: 3,
            title: 'Roadmap views',
            count: widgetData?.roadmapView,
        },
        {
            id: 4,
            title: 'Feedback page views',
            count: widgetData?.ideaView,
        },
        {
            id: 5,
            title: 'Doc page views',
            count: widgetData?.docsView,
        },
    ]

    const links = [{label: 'Widget', path: `/widget`}];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const CustomTooltip = ({active, payload}) => {
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
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await getAnnouncementAnalytics();
        setIsRefreshing(false);
    };

    return (
        <Fragment>
            <div
                className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                <div className={"pb-6 flex justify-between gap-2 items-center flex-wrap"}>
                    <CommonBreadCrumb
                        links={links}
                        currentPagePath={`/widget/${type}/${id}`}
                        crumbName={projectDetailsReducer.plan > 0 ? (isTopLoading ? "" : "Analytics") : "Analytics"}
                        currentPage={title}
                        truncateLimit={30}
                    />
                    <div className={"flex gap-2 items-center"}>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button variant={"outline"}
                                        className={"h-9"}
                                        onClick={handleManualRefresh}
                                        disabled={isRefreshing || isTopLoading || projectDetailsReducer.plan === 0}
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
                            <div className={"grid lg:grid-cols-5 md:grid-cols-2 sm:grid-cols-1"}>
                                {
                                    (widAnalytics || []).map((x, i) => {
                                        return (
                                            <Fragment key={i}>
                                                {
                                                    isTopLoading ?
                                                        <div
                                                            className={"space-y-[14px] w-full p-4 border-b md:border-r last:border-b-0 last:border-r-0"}>
                                                            <Skeleton className="h-4"/>
                                                            <Skeleton className="h-4"/></div> :
                                                        <div
                                                            className={`p-4 border-b md:border-r last:border-b-0 last:border-r-0`}>
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
                                    isTopLoading ? commonParagraph(3) : locationsData.length > 0 ?
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
                                {isTopLoading ? commonParagraph(3) : devicesData.length > 0 ?
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

export default WidgetAnalytics;
