import React, { Fragment, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ApiService } from "../../../utils/ApiService";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { AnalyticsLayout, AnalyticsLineChart, CommonTable, UserCell } from "./CommonAnalyticsView/CommonUse";
import { AnalyticsSummary } from "./CommonAnalyticsView/CommonUse";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "../../ui/chart";
import {Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts';
import Pagination from '../../Comman/Pagination';
import {commonParagraph} from "../../../utils/Loader";
import EmptyData from "../../Comman/EmptyData";
import {formatDate} from "../../../utils/constent";
import {chartLoading} from "../../Comman/CommSkel";
import topBrowser from "../../../assets/TopBrowsers.png";

const CheckListAnalyticsView = () => {
    const { id, type } = useParams();
    const apiService = new ApiService();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [inAppMsgSetting, setInAppMsgSetting] = useState({});
    const [analytics, setAnalytics] = useState({})
    const [analyticsData, setAnalyticsData] = useState([]);
    const [responsesData, setResponsesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingStepAnalysis, setIsLoadingStepAnalysis] = useState(false);
    const [browsersData, setBrowsersData] = useState([]);
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    const [pagination, setPagination] = useState({
        type: null,
        pageSize: 10,
        opened: { page: 1, total: 0 },
        responses: { page: 1, total: 0 },
    });

    useEffect(() => {
        if (id !== "new" && projectDetailsReducer.id && projectDetailsReducer.plan > 0) {
            getSingleInAppMessages();
        }
    }, [projectDetailsReducer.id, pagination.type, pagination.pageSize, pagination.opened.page, pagination.responses.page, state]);

    const getSingleInAppMessages = async () => {
        setIsLoading(true);
        setIsLoadingStepAnalysis(true);
        const currentType = pagination.type;
        const currentSize = pagination.pageSize;

        let pageConfig;

        switch (currentType) {
            case "responses":
                pageConfig = pagination.responses;
                break;
            default:
                pageConfig = pagination.opened;
                break;
        }

        const data = await apiService.getSingleInAppMessage(id, {
            page: pageConfig.page,
            pageSize: currentSize,
            type: currentType,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        });
        setIsLoading(false);
        setIsLoadingStepAnalysis(false);
        if (data.success) {
            const simplifiedData = (data?.data?.analytics?.browsers || []).map((x) => ({
                name: x.browser,
                value: x.count ? Number(x.count) : 0,
            }));
            setBrowsersData(simplifiedData);
            const analytics = data.data.analytics || {};
            const analyticsArray = analytics.analytics || [];
            const responsesArray = analytics.responses || [];

            const combinedData = {};
            analytics.charts?.forEach(({ x, y }) => {
                if (!combinedData[x]) {
                    combinedData[x] = { view: 0, response: 0, x };
                }
                combinedData[x].view = parseFloat(y);
            });
            analytics.responseCharts?.forEach(({ x, y }) => {
                if (!combinedData[x]) {
                    combinedData[x] = { view: 0, response: 0, x };
                }
                combinedData[x].response = parseFloat(y);
            });

            const result = Object.values(combinedData).sort((a, b) => new Date(a.x) - new Date(b.x));

            setAnalytics({
                chart: result,
                analytics: analytics.analytics,
                openCount: analytics.openCount,
                responseCount: analytics.responseCount,
                responses: analytics.responses,
                responsePercentage: analytics.responsePercentage,
                stepAnalysis: analytics.stepAnalysis,
                uniqueViews: analytics?.uniqueViews,
            });

            setInAppMsgSetting({
                ...data.data.data,
                bodyText: data.data.data.bodyText
            });

            setAnalyticsData(analyticsArray);
            setResponsesData(responsesArray);

            setPagination(prev => ({
                ...prev,
                opened: {
                    ...prev.opened,
                    total: (analytics.analyticsTotalPages) * prev.pageSize
                },
                responses: {
                    ...prev.responses,
                    total: (analytics.responsesTotalPages) * prev.pageSize
                }
            }));
        }
    };

    const analyticsViews = [
        {
            title: "Total View",
            show: true,
            count: analytics?.openCount || 0,
        },
        {
            title: "Total Response",
            show: inAppMsgSetting?.replyType === 1,
            count: analytics?.responseCount || 0,
        },
        {
            title: "Unique Views",
            show: true,
            count: analytics?.uniqueViews || 0,
        },
        {
            title: "Completion Rate",
            count: `${((analytics?.responsePercentage || 0)).toFixed(2)}%`,
            show: inAppMsgSetting?.replyType === 1,
        },
    ]

    const links = [{ label: 'In App Message', path: `/app-message` }];

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
        setPagination(prev => ({...prev, opened: { ...prev.opened, page: 1 }, responses: { ...prev.responses, page: 1 }}));
    };

    const openedColumns = [
        {
            label: "Name",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Avatar className="w-[20px] h-[20px]">
                        <AvatarFallback>{row?.name ? row?.name.substring(0, 1) : row?.email.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <p className="font-normal">{row.name || row.email}</p>
                </div>
            ),
        },
        { label: "When it was opened", render: (row) => dayjs(row.createdAt).format("MMM D, YYYY"), align: "right" },
    ];

    const repliedColumns = [
        { label: "Name", render: (row) => <UserCell name={row.name} email={row.email} /> },
        { label: "When they replied", render: (row) => dayjs(row.createdAt).format("MMM D, YYYY"), align: "right" },
    ];

    const stepChartConfig = {
        completed: { label: "Completed", color: "#7c3aed" },
        actionclicked: { label: "Action Clicked", color: "#a78bfa" },
        viewed: { label: "Viewed", color: "#7c3aed80" },
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await getSingleInAppMessages();
        setIsRefreshing(false);
    };

    return (
        <Fragment>
            <AnalyticsLayout 
                links={links}
                currentPagePath={`/app-message/${type}/${id}`}
                crumbName={projectDetailsReducer.plan > 0 ? (isLoading ? "" : "Analytics") : "Analytics"}
                currentPage={inAppMsgSetting?.title}
                status={inAppMsgSetting?.status}
                onUpdate={(values) => onChangeDate(values)}
                initialDateFrom={state.from}
                initialDateTo={state.to}
                // minDate={inAppMsgSetting?.createdAt}
                manualApiCall={handleManualRefresh}
                isRefreshingApiCall={isRefreshing}
                manualApiCallDisable={projectDetailsReducer.plan === 0 || isRefreshing || isLoading}
            >
                <AnalyticsSummary analyticsViews={analyticsViews} isLoading={isLoading} />
                <AnalyticsLineChart
                    title="How did that change over time?"
                    data={analytics?.chart}
                    isLoading={isLoading}
                    chartConfig={{
                        view: { label: "View", color: "#7c3bed80" },
                        response: { label: "Response", color: "#7c3aed" }
                    }}
                    dataKeys={["view", "response"]}
                />

                <Card>
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Step Analysis</CardHeader>
                    <CardContent className={"p-4 pl-0"}>
                        {
                            isLoadingStepAnalysis ? chartLoading(15, "p-2") :
                                <Fragment>
                                    {analytics?.stepAnalysis?.length > 0 &&
                                    analytics?.stepAnalysis.some((step) =>
                                        step.viewed > 0 || step.actionclicked > 0 || step.completed > 0
                                    ) ? (
                                        <ChartContainer config={stepChartConfig} width="100%" height={250} aspect={false}>
                                            <BarChart
                                                accessibilityLayer
                                                data={analytics?.stepAnalysis}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="title"
                                                    type="category"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval={0}
                                                    tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + "..." : value}
                                                />
                                                <YAxis type="number" tickLine={false} axisLine={false} />
                                                <ChartTooltip
                                                    cursor={false}
                                                    content={
                                                        <ChartTooltipContent
                                                            labelFormatter={(value) => (
                                                                <div className="max-w-[50px] truncate text-ellipsis overflow-hidden whitespace-nowrap">{value}</div>
                                                            )}
                                                            indicator="line"
                                                            formatter={(value, name) => [
                                                                <Fragment key="tooltip-content">
                                                                    <div
                                                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] mt-1"
                                                                        style={{ backgroundColor: `var(--color-${name.toLowerCase()})` }}
                                                                    />
                                                                    {stepChartConfig[name]?.label || name}
                                                                    <div className="ml-auto font-mono font-medium tabular-nums text-foreground">
                                                                        {value}
                                                                    </div>
                                                                </Fragment>,
                                                            ]}
                                                        />
                                                    }
                                                />
                                                <Bar dataKey="viewed" fill="var(--color-viewed)" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
                                                <Bar dataKey="actionclicked" fill="var(--color-actionclicked)" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
                                                <Bar dataKey="completed" fill="var(--color-completed)" radius={[0, 0, 0, 0]} stackId="a" barSize={50} />
                                            </BarChart>
                                        </ChartContainer>
                                    ) : (
                                        <EmptyData />
                                    )}
                                </Fragment>
                        }
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who opened</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        <CommonTable columns={openedColumns} data={analyticsData} isLoading={isLoading} skeletonColumns={2} />
                        {analyticsData.length > 0 && (
                            <Pagination
                                pageNo={pagination.opened.page}
                                totalPages={Math.ceil(pagination.opened.total / pagination.pageSize)}
                                isLoading={isLoading}
                                handlePaginationClick={(page) => {
                                    setPagination(prev => ({
                                        ...prev,
                                        type: "analytics",
                                        opened: { ...prev.opened, page }
                                    }));
                                }}
                                stateLength={analyticsData.length}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who completed</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        {/*<CommonTable columns={repliedColumns} data={analytics.responses || []} isLoading={isLoading} skeletonColumns={2}/>*/}
                        <CommonTable columns={repliedColumns} data={responsesData} isLoading={isLoading} skeletonColumns={2} />
                        {responsesData.length > 0 && (
                            <Pagination
                                pageNo={pagination.responses.page}
                                totalPages={Math.ceil(pagination.responses.total / pagination.pageSize)}
                                isLoading={isLoading}
                                handlePaginationClick={(page) => {
                                    setPagination(prev => ({
                                        ...prev,
                                        type: "responses",
                                        responses: { ...prev.responses, page }
                                    }));
                                }}
                                stateLength={responsesData.length}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card className={"shadow border"}>
                    <CardHeader className={"p-4 pb-0"}>
                        <CardTitle className={"text-base font-medium"}>Top Browsers</CardTitle>
                    </CardHeader>
                    <CardContent className={`p-4 ${isLoading ? "" : 'flex'} justify-center`}>
                        {
                            isLoading ? commonParagraph(8) : browsersData.length > 0 ?
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
                                        <Tooltip content={<CustomTooltip/>}/>
                                    </PieChart>
                                </ResponsiveContainer> : <EmptyData children={"No browser found"} emptyIcon={<img src={topBrowser}/>}/>
                        }
                    </CardContent>
                </Card>
            </AnalyticsLayout>
        </Fragment>
    );
};

export default CheckListAnalyticsView;