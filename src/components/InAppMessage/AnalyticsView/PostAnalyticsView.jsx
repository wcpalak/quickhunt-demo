import React, {Fragment, useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "../../ui/card";
import {useSelector} from "react-redux";
import dayjs from "dayjs";
import Pagination from '../../Comman/Pagination';
import {useParams} from "react-router-dom";
import {AnalyticsLayout, AnalyticsLineChart, AnalyticsSummary, CommonTable, ImageCarouselCell, UserCell} from "./CommonAnalyticsView/CommonUse";
import {apiService, formatDate} from "../../../utils/constent";
import {ReadMoreText2} from "../../Comman/ReadMoreText";
import {commonParagraph} from "../../../utils/Loader";
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import EmptyData from "../../Comman/EmptyData";
import topBrowser from "../../../assets/TopBrowsers.png";

const PostAnalyticsView = () => {
    const { id, type } = useParams();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [inAppMsgSetting, setInAppMsgSetting] = useState({});
    const [analytics, setAnalytics] = useState({});
    const [analyticsData, setAnalyticsData] = useState([]);
    const [responsesData, setResponsesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [isLoadingResponses, setIsLoadingResponses] = useState(true);
    const [isLoadingCharts, setIsLoadingCharts] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
        if (projectDetailsReducer.id && projectDetailsReducer.plan > 0) {
            getSingleInAppMessage();
        }
    }, [
        projectDetailsReducer.id,
        pagination.type,
        pagination.pageSize,
        pagination.opened.page,
        pagination.responses.page,
        state
    ]);

    const getSingleInAppMessage = async () => {  // Remove startDate and endDate parameters
        setIsLoading(true);

        const currentType = pagination.type;
        const currentSize = pagination.pageSize;

        const isInitialLoad = currentType === null;
        const isDateChange = state.from !== null || state.to !== null; // Check if dates are not null

        if (isInitialLoad || isDateChange) {
            setIsInitialLoading(true);
            setIsLoadingCharts(true);
        } else if (currentType === "responses") {
            setIsLoadingResponses(true);
        } else if (currentType === "analytics") {
            setIsLoadingAnalytics(true);
        }

        let pageConfig;

        switch (currentType) {
            case "responses":
                pageConfig = pagination.responses;
                break;
            default:
                pageConfig = pagination.opened;
        }

        const response = await apiService.getSingleInAppMessage(id, {
            page: pageConfig.page,
            pageSize: currentSize,
            type: currentType,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        });

        // Rest of the function remains the same...
        setIsLoading(false);
        setIsInitialLoading(false);
        setIsLoadingAnalytics(false);
        setIsLoadingResponses(false);
        setIsLoadingCharts(false);

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
            analyticsResult.charts?.forEach(({ x, y }) => {
                if (!combinedData[x]) {
                    combinedData[x] = { view: 0, response: 0, x };
                }
                combinedData[x].view = parseFloat(y);
            });
            analyticsResult.responseCharts?.forEach(({ x, y }) => {
                if (!combinedData[x]) {
                    combinedData[x] = { view: 0, response: 0, x };
                }
                combinedData[x].response = parseFloat(y);
            });

            const chart = Object.values(combinedData).sort((a, b) => new Date(a.x) - new Date(b.x));

            setAnalytics({
                chart,
                analytics: analyticsArray,
                openCount: analyticsResult.openCount,
                uniqueViews: analyticsResult?.uniqueViews,
                responseCount: analyticsResult.responseCount,
                responses: analyticsResult.responses,
                responsePercentage: analyticsResult.responsePercentage
            });

            setAnalyticsData(analyticsArray);
            setResponsesData(responsesArray);

            setPagination(prev => ({
                ...prev,
                opened: {
                    ...prev.opened,
                    total: (analyticsResult.analyticsTotalPages) * prev.pageSize
                },
                responses: {
                    ...prev.responses,
                    total: (analyticsResult.responsesTotalPages) * prev.pageSize
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
            // show: inAppMsgSetting?.replyType === 1,
            count: analytics?.responseCount || 0,
            show: true,
        },
        {
            title: "Unique Views",
            show: true,
            count: analytics?.uniqueViews || 0,
        },
        {
            title: "Completion Rate",
            count: `${((analytics?.responsePercentage || 0)).toFixed(2)}%`,
            // show: inAppMsgSetting?.replyType === 1,
            show: true,
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

    const onChangeDate = (selected) => {
        const isAllTime = !selected?.from && !selected?.to;
        setState({from: isAllTime ? null : selected.from, to: isAllTime ? null : selected.to,});
        setPagination(prev => ({...prev, opened: { ...prev.opened, page: 1 }, responses: { ...prev.responses, page: 1 }}));
    };

    const repliedColumns = [
        { label: "Name", render: (row) => <UserCell name={row.name} email={row.email} /> },
        {
            label: "Reply",
            dataKey: "response",
            className: "max-w-[270px] truncate text-ellipsis overflow-hidden whitespace-nowrap",
            render: (row) => <ReadMoreText2 html={row.response || '-'} maxLength={50} />
        },
        {
            label: "Reaction",
            align: "center",
            render: (row) =>
                row.emojiUrl ? (
                    <img className="h-6 w-6 cursor-pointer m-auto" src={row.emojiUrl} />
                ) : "-",
        },
        {
            label: "Image View",
            align: "center",
            render: (row) => <ImageCarouselCell files={row.file} />,
        },
        {
            label: "When they replied",
            align: "center",
            render: (row) => dayjs(row.createdAt).format("MMM D, YYYY"),
        },
    ];

    const openedColumns = [
        { label: "Name", render: (row) => <UserCell name={row.name} email={row.email} /> },
        {label: "When it was opened", render: (row) => dayjs(row.createdAt).format("MMM D, YYYY"), align: "right"},
    ];

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await getSingleInAppMessage();
        setIsRefreshing(false);
    };

    return (
        <Fragment>
            <AnalyticsLayout
                links={links}
                currentPagePath={`/app-message/${type}/${id}`}
                crumbName={projectDetailsReducer.plan > 0 ? (isLoading ? "" : "Analytics") : "Analytics"}
                currentPage={inAppMsgSetting?.title}
                status={isLoading ? "" : inAppMsgSetting?.status}
                onUpdate={(values) => onChangeDate(values)}
                initialDateFrom={state.from}
                initialDateTo={state.to}
                minDate={inAppMsgSetting?.createdAt}
                manualApiCall={handleManualRefresh}
                isRefreshingApiCall={isRefreshing}
                manualApiCallDisable={projectDetailsReducer.plan === 0 || isRefreshing || isInitialLoading}
            >
                <AnalyticsSummary analyticsViews={analyticsViews} isLoading={isInitialLoading} />
                <AnalyticsLineChart
                    title="How did that change over time?"
                    data={analytics?.chart}
                    isLoading={isInitialLoading || isLoadingCharts}
                    chartConfig={{
                        y: { label: "View", color: "#7c3aed" },
                        response: { label: "Response", color: "#10b981" }
                    }}
                    dataKeys={["y", "response"]}
                />

                <Card>
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who opened</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        <CommonTable
                            columns={openedColumns}
                            data={analyticsData}
                            // data={analytics.analytics || []}
                            isLoading={isInitialLoading || isLoadingAnalytics}
                            skeletonColumns={2}
                        />
                        {analyticsData.length > 0 && (
                            <Pagination
                                pageNo={pagination.opened.page}
                                totalPages={Math.ceil(pagination.opened.total / pagination.pageSize)}
                                isLoading={isLoadingAnalytics}
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
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who replied</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        <CommonTable
                            columns={repliedColumns}
                            data={responsesData}
                            isLoading={isInitialLoading || isLoadingResponses}
                            skeletonColumns={5}
                        />
                        {responsesData.length > 0 && (

                            <Pagination
                                pageNo={pagination.responses.page}
                                totalPages={Math.ceil(pagination.responses.total / pagination.pageSize)}
                                isLoading={isLoadingResponses}
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
                            (isInitialLoading || isLoadingCharts) ? commonParagraph(8) : browsersData.length > 0 ?
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

export default PostAnalyticsView;
