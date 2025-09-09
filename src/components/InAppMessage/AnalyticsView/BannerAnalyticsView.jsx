import React, { Fragment, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { ApiService } from "../../../utils/ApiService";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import EmptyData from "../../Comman/EmptyData";
import { UserAvatar } from "../../Comman/CommentEditor";
import { AnalyticsLayout, AnalyticsLineChart } from "./CommonAnalyticsView/CommonUse";
import { AnalyticsSummary } from "./CommonAnalyticsView/CommonUse";
import Pagination from '../../Comman/Pagination';
import {commonParagraph} from "../../../utils/Loader";
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import {formatDate} from "../../../utils/constent";
import topBrowser from "../../../assets/TopBrowsers.png";

const CommonBannerTable = ({ columns, data, isLoading, skeletonRows = 10, skeletonColumns = 4 }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {columns.map((col, index) => (
                        <TableHead
                            key={index}
                            className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground ${col.align ? `text-${col.align}` : ""}`}
                        >
                            {col.label}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading
                    ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {Array.from({ length: skeletonColumns }).map((_, colIndex) => (
                                <TableCell key={colIndex} className="px-2 py-[10px] md:px-3">
                                    <Skeleton className="rounded-md w-full h-7" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                    : data.length > 0 ? data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {columns.map((col, colIndex) => (
                                    <TableCell
                                        key={colIndex}
                                        className={`px-2 py-[10px] md:px-3 ${col.align ? `text-${col.align}` : ""}`}
                                    >
                                        {col.render ? col.render(row) : row[col.dataKey] || "-"}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                        : (
                            <TableRow className={"hover:bg-transparent"}>
                                <TableCell colSpan={columns.length}><EmptyData /></TableCell>
                            </TableRow>
                        )}
            </TableBody>
        </Table>
    );
};

const BannerAnalyticsView = () => {
    const { id, type } = useParams();
    const apiService = new ApiService();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [inAppMsgSetting, setInAppMsgSetting] = useState({});
    const [analytics, setAnalytics] = useState({})
    const [analyticsData, setAnalyticsData] = useState([]);
    const [responsesData, setResponsesData] = useState([]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [isResponsesLoading, setIsResponsesLoading] = useState(false);
    const [isChartsLoading, setIsChartsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [browsersData, setBrowsersData] = useState([]);
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    const [pagination, setPagination] = useState({
        opened: { page: 1, total: 0 },
        responses: { page: 1, total: 0 },
    });

    const openedColumns = [
        {
            label: "Name", dataKey: "name", render: (row) => (
                <div className="flex items-center gap-2">
                    <UserAvatar className="w-[20px] h-[20px]" userName={row?.name ? row?.name?.substring(0, 1) : row?.email?.substring(0, 1)} />
                    <p className="font-normal">{row.name || row.email}</p>
                </div>
            )
        },
        { label: "When it was opened", dataKey: "createdAt", render: (row) => dayjs(row.createdAt).format("MMM D, YYYY"), align: "right" },
    ];

    const repliedColumns = [
        {
            label: "Name", dataKey: "name", render: (row) => (
                <div className="flex items-center gap-2">
                    <UserAvatar className="w-[20px] h-[20px]" userName={row?.name ? row?.name?.substring(0, 1) : row?.email?.substring(0, 1)} />
                    <p className="font-normal">{row.name || row.email}</p>
                </div>
            )
        },
        {
            label: "Reaction", dataKey: "emojiUrl", align: "center", render: (row) =>
                row.emojiUrl ? <img className="h-6 w-6 cursor-pointer m-auto" src={row.emojiUrl} alt="reaction" /> : "-"
        },
        { label: "Collected Email", dataKey: "submitMail", align: "center" },
        {
            label: "When they replied",
            dataKey: "createdAt",
            align: "center",
            render: (row) => dayjs(row.createdAt).format("MMM D, YYYY")
        },
    ];

    useEffect(() => {
        if (id !== "new" && projectDetailsReducer.id && projectDetailsReducer.plan > 0) {
            getInitialData();
        }
    }, [projectDetailsReducer.id]);

    const getInitialData = async () => {
        setIsInitialLoading(true);
        await fetchData();
        setIsInitialLoading(false);
    };

    const fetchData = async (type = null, pageConfig = {}) => {
        try {
            if (type === "responses") {
                setIsResponsesLoading(true);
            } else if (type === "analytics") {
                setIsAnalyticsLoading(true);
            } else {
                setIsChartsLoading(true);
                if (!pageConfig.page) {
                    setIsAnalyticsLoading(true);
                    setIsResponsesLoading(true);
                }
            }

            const response = await apiService.getSingleInAppMessage(id, {
                page: type === "responses" ? pagination.responses.page : pagination.opened.page,
                pageSize: 10,
                type,
                startDate: state.from ? formatDate(state.from) : null,
                endDate: state.to ? formatDate(state.to) : null,
                ...pageConfig
            });

            if (response.success) {
                const simplifiedData = (response?.data?.analytics?.browsers || []).map((x) => ({
                    name: x.browser,
                    value: x.count ? Number(x.count) : 0,
                }));
                setBrowsersData(simplifiedData);

                const analyticsResult = response.data.analytics || {};
                const analyticsArray = analyticsResult.analytics || [];
                const responsesArray = analyticsResult.responses || [];

                setInAppMsgSetting(response.data.data);

                const combinedData = {};
                response.data.analytics?.charts?.forEach(({ x, y }) => {
                    if (!combinedData[x]) {
                        combinedData[x] = { view: 0, response: 0, x };
                    }
                    combinedData[x].view = parseFloat(y);
                });

                response.data.analytics?.responseCharts?.forEach(({ x, y }) => {
                    if (!combinedData[x]) {
                        combinedData[x] = { view: 0, response: 0, x };
                    }
                    combinedData[x].response = parseFloat(y);
                });

                const chartData = Object.values(combinedData).sort((a, b) => new Date(a.x) - new Date(b.x));

                setAnalytics({
                    chart: chartData,
                    analytics: analyticsResult.analytics,
                    openCount: analyticsResult.openCount,
                    uniqueViews: analyticsResult?.uniqueViews,
                    responseCount: analyticsResult.responseCount,
                    responses: analyticsResult.responses,
                    responsePercentage: analyticsResult.responsePercentage
                });

                if (type === "responses") {
                    setResponsesData(responsesArray);
                    setPagination(prev => ({
                        ...prev,
                        responses: {
                            ...prev.responses,
                            total: (analyticsResult?.responsesTotalPages || 0) * 10
                        }
                    }));
                } else if (type === "analytics") {
                    setAnalyticsData(analyticsArray);
                    setPagination(prev => ({
                        ...prev,
                        opened: {
                            ...prev.opened,
                            total: (analyticsResult?.analyticsTotalPages || 0) * 10
                        }
                    }));
                } else {
                    setAnalyticsData(analyticsArray);
                    setResponsesData(responsesArray);
                    setPagination({
                        opened: {
                            page: 1,
                            total: (analyticsResult?.analyticsTotalPages || 0) * 10
                        },
                        responses: {
                            page: 1,
                            total: (analyticsResult?.responsesTotalPages || 0) * 10
                        }
                    });
                }
            }
        } finally {
            if (type === "responses") {
                setIsResponsesLoading(false);
            } else if (type === "analytics") {
                setIsAnalyticsLoading(false);
            } else {
                setIsChartsLoading(false);
                if (!pageConfig.page) {
                    setIsAnalyticsLoading(false);
                    setIsResponsesLoading(false);
                }
            }
        }
    };

    const handlePagination = async (type, page) => {
        if (type === "responses") {
            setPagination(prev => ({
                ...prev,
                responses: { ...prev.responses, page }
            }));
            await fetchData("responses", { page });
        } else {
            setPagination(prev => ({
                ...prev,
                opened: { ...prev.opened, page }
            }));
            await fetchData("analytics", { page });
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
    ];

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

    const onChangeDate = async (selected) => {
        const isAllTime = !selected?.from && !selected?.to;
        setState({
            from: isAllTime ? null : selected.from,
            to: isAllTime ? null : selected.to,
        });
        setIsChartsLoading(true);
        await fetchData();
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        setIsAnalyticsLoading(true);
        setIsResponsesLoading(true);
        setIsChartsLoading(true);

        const newFrom = new Date(new Date().setDate(new Date().getDate() - 29));
        const newTo = new Date();
        setState({ from: newFrom, to: newTo });

        setPagination({
            opened: { page: 1, total: pagination.opened.total },
            responses: { page: 1, total: pagination.responses.total }
        });

        await fetchData();

        setIsRefreshing(false);
        setIsAnalyticsLoading(false);
        setIsResponsesLoading(false);
    };

    return (
        <Fragment>
            <AnalyticsLayout
                links={links}
                currentPagePath={`/app-message/${type}/${id}`}
                crumbName={projectDetailsReducer.plan > 0 ? (isInitialLoading ? "" : "Analytics") : "Analytics"}
                currentPage={inAppMsgSetting?.title}
                status={inAppMsgSetting?.status}
                onUpdate={onChangeDate}
                initialDateFrom={state.from}
                initialDateTo={state.to}
                manualApiCall={handleManualRefresh}
                isRefreshingApiCall={isRefreshing}
                manualApiCallDisable={projectDetailsReducer.plan === 0 || isRefreshing || isInitialLoading}
            >
                <AnalyticsSummary analyticsViews={analyticsViews} isLoading={isInitialLoading} />
                <AnalyticsLineChart
                    title="How did that change over time?"
                    data={analytics?.chart}
                    isLoading={isInitialLoading || isChartsLoading}
                    chartConfig={{
                        view: { label: "View", color: "#7c3bed80" },
                        response: { label: "Response", color: "#7c3aed" }
                    }}
                    dataKeys={["view", "response"]}
                />
                <Card>
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who opened</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        <CommonBannerTable
                            columns={openedColumns}
                            data={analyticsData}
                            isLoading={isInitialLoading || isAnalyticsLoading}
                            skeletonRows={10}
                            skeletonColumns={2}
                        />
                        {analyticsData.length > 0 && (
                            <Pagination
                                pageNo={pagination.opened.page}
                                totalPages={Math.ceil(pagination.opened.total / 10)}
                                isLoading={isAnalyticsLoading}
                                handlePaginationClick={(page) => handlePagination("analytics", page)}
                                stateLength={analyticsData.length}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who replied</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        <CommonBannerTable
                            columns={repliedColumns}
                            data={responsesData}
                            isLoading={isInitialLoading || isResponsesLoading}
                            skeletonRows={10}
                            skeletonColumns={4}
                        />
                        {responsesData.length > 0 && (
                            <Pagination
                                pageNo={pagination.responses.page}
                                totalPages={Math.ceil(pagination.responses.total / 10)}
                                isLoading={isResponsesLoading}
                                handlePaginationClick={(page) => handlePagination("responses", page)}
                                stateLength={responsesData.length}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card className={"shadow border"}>
                    <CardHeader className={"p-4 pb-0"}>
                        <CardTitle className={"text-base font-medium"}>Top Browsers</CardTitle>
                    </CardHeader>
                    <CardContent className={`p-4 ${isInitialLoading ? "" : 'flex'} justify-center`}>
                        {
                            (isInitialLoading || isChartsLoading) ? commonParagraph(8) : browsersData.length > 0 ?
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
                                            formatter={(value) => (<span style={{marginRight: 10, fontSize: 12}}>{value}</span>)}
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

export default BannerAnalyticsView;