import React, { Fragment, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { ApiService } from "../../../utils/ApiService";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import Pagination from '../../Comman/Pagination';
import {useParams} from "react-router-dom";
import {Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,} from 'recharts';
import {ChartContainer, ChartTooltip, ChartTooltipContent} from "../../ui/chart";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "../../ui/table";
import {Avatar, AvatarFallback} from "../../ui/avatar";
import EmptyData from "../../Comman/EmptyData";
import { chartLoading } from "../../Comman/CommSkel";
import {cleanQuillHtml, formatDate} from "../../../utils/constent";
import { ReadMoreText2 } from "../../Comman/ReadMoreText";
import { AnalyticsLayout, AnalyticsLineChart, CommonTable, UserCell } from "./CommonAnalyticsView/CommonUse";
import { AnalyticsSummary } from "./CommonAnalyticsView/CommonUse";
import {commonParagraph} from "../../../utils/Loader";
import topBrowser from "../../../assets/TopBrowsers.png";

const chartConfigNPS = {
    detractor: { label: "Detractor", color: "#e87e6d", },
    passives: { label: "Passives", color: "#f0ca00", },
    promoter: { label: "Promoter", color: "#55c99b", },
}

const SurveysAnalyticsView = () => {
    const { id, type } = useParams();
    const apiService = new ApiService();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [inAppMsgSetting, setInAppMsgSetting] = useState({});
    const [analytics, setAnalytics] = useState({})
    const [analyticsResponse, setAnalyticsResponse] = useState([])
    const [analyticsData, setAnalyticsData] = useState([]);
    const [questionResponses, setQuestionResponses] = useState([]);
    const [responsesData, setResponsesData] = useState([]);
    const [browsersData, setBrowsersData] = useState([]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [isLoadingResponses, setIsLoadingResponses] = useState(true);
    const [isLoadingCharts, setIsLoadingCharts] = useState(true);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState({});
    const [isLoadingBrowsers, setIsLoadingBrowsers] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [stepPaginations, setStepPaginations] = useState({});
    const [stepPaginationTrigger, setStepPaginationTrigger] = useState(0);

    const [pagination, setPagination] = useState({
        type: null,
        pageSize: 10,
        opened: { page: 1, total: 0 },
        responses: { page: 1, total: 0 },
    });
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    useEffect(() => {
        if (projectDetailsReducer.id && projectDetailsReducer.plan > 0) {
            getSingleInAppMessages();
            if (pagination.type === null) {
                getResponseInAppMessage();
            }
        }
    }, [
        pagination.type,
        pagination.pageSize,
        pagination.opened.page,
        pagination.responses.page,
        stepPaginationTrigger,
        projectDetailsReducer.id,
        id,
        state
    ]);

    const getSingleInAppMessages = async () => {
        const { type, pageSize, opened, responses } = pagination;
        const pageConfig =
            type === "responses" ? responses
                : type === "analytics" ? opened
                    : stepPaginations[type] || { page: 1, pageSize: 10 };

        const isInitialLoad = type === null;
        const isDateChange = state.from !== null || state.to !== null;

        if (isInitialLoad) {
            setIsInitialLoading(true);
            setIsLoadingCharts(true);
            setIsLoadingResponses(true);
        } else if (isDateChange) {
            setIsLoadingCharts(true);
            setIsLoadingAnalytics(true);
            setIsLoadingResponses(true);
            setIsLoadingBrowsers(true);
        } else if (type === "responses") {
            setIsLoadingResponses(true);
        } else if (type === "analytics") {
            setIsLoadingAnalytics(true);
        } else if (type && stepPaginations[type]) {
            setIsLoadingQuestions(prev => ({ ...prev, [type]: true }));
        }

        const payload = {
            page: pageConfig.page,
            pageSize,
            type,
            startDate: state.from ? formatDate(state.from) : null,
            endDate: state.to ? formatDate(state.to) : null,
        }
        const { success, data } = await apiService.getSingleInAppMessage(id, payload);

        setIsInitialLoading(false);
        setIsLoadingAnalytics(false);
        setIsLoadingResponses(false);
        if (type && stepPaginations[type]) {
            setIsLoadingQuestions(prev => ({ ...prev, [type]: false }));
        }
        setIsLoadingCharts(false);
        setIsLoadingBrowsers(false);

        if (success) {
            const { analytics: result = {}, data: messageData } = data;
            const simplifiedData = (data?.analytics?.browsers || []).map((x) => ({
                name: x.browser,
                value: x.count ? Number(x.count) : 0,
            }));
            setBrowsersData(simplifiedData);
            const {
                questionResponses = [],
                analytics = [],
                responses: resps = [],
                analyticsTotalPages = 1,
                responsesTotalPages = 1
            } = result;

            setInAppMsgSetting(messageData);
            setAnalytics(result);
            setQuestionResponses(questionResponses);
            setAnalyticsData(analytics);
            setResponsesData(resps);

            setPagination(prev => ({
                ...prev,
                opened: { ...prev.opened, total: analyticsTotalPages * prev.pageSize },
                responses: { ...prev.responses, total: responsesTotalPages * prev.pageSize }
            }));
        }
    };

    const getResponseInAppMessage = async (startDate, endDate) => {
        setIsLoadingCharts(true);
        let payload = { inAppMessageId: id };
        if (startDate && endDate) {
            payload.startDate = dayjs(startDate).format('YYYY-MM-DD');
            payload.endDate = dayjs(endDate).format('YYYY-MM-DD');
        }
        const data = await apiService.getResponseInAppMessage(payload);
        setIsLoadingCharts(false);
        if (data.success) {
            setAnalyticsResponse(data.data);
        }
    };

    const handleStepPaginationClick = (stepId, page) => {
        setStepPaginations(prev => ({...prev, [stepId]: {...(prev[stepId] || { pageSize: 10 }), page}}));
        setPagination(prev => ({...prev, type: stepId.toString()}));
        setStepPaginationTrigger(Date.now());
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

    const onChangeDate = (selected) => {
        const isAllTime = !selected?.from && !selected?.to;
        setState({from: isAllTime ? null : selected.from, to: isAllTime ? null : selected.to,});
        setPagination(prev => ({...prev, opened: { ...prev.opened, page: 1 }, responses: { ...prev.responses, page: 1 }}));
        setStepPaginations({});
    };

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

    const getRepliedColumns = (steps) => {
        const baseColumns = [{ label: "Name", render: (row) => <UserCell name={row.name} email={row.email} /> },];

        const stepColumns = (steps || []).filter((_, index) => index !== 7).map((step) => ({
            label: step.text,
            className: "max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap",
            render: (row) => {
                const matchedResponse = row.response?.find((r) => r.stepId === step.stepId) || { response: "-" };
                return cleanQuillHtml(matchedResponse.response) ? (
                    <ReadMoreText2 html={matchedResponse.response} maxLength={30} />
                ) : "-";
            },
        }));

        return [
            ...baseColumns,
            ...stepColumns,
            { label: "Date Responded", render: (row) => dayjs(row.createdAt).format("MMM D, YYYY") },
        ];
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await getSingleInAppMessages();
        if (pagination.type === null) {
            await getResponseInAppMessage(state.from, state.to);
        }
        setIsRefreshing(false);
    };

    return (
        <Fragment>
            <AnalyticsLayout
                links={links}
                currentPagePath={`/app-message/${type}/${id}`}
                crumbName={projectDetailsReducer.plan > 0 ? (isInitialLoading ? "" : "Analytics") : "Analytics"}
                currentPage={inAppMsgSetting?.title}
                status={inAppMsgSetting?.status}
                onUpdate={(values) => onChangeDate(values)}
                initialDateFrom={state.from}
                initialDateTo={state.to}
                // minDate={inAppMsgSetting?.createdAt}
                manualApiCall={handleManualRefresh}
                isRefreshingApiCall={isRefreshing}
                manualApiCallDisable={projectDetailsReducer.plan === 0 || isRefreshing || isInitialLoading}
            >
                <AnalyticsSummary analyticsViews={analyticsViews} isLoading={isInitialLoading} />
                <AnalyticsLineChart
                    title="How did that change over time?"
                    data={analytics?.charts}
                    isLoading={isInitialLoading || isLoadingCharts}
                    chartConfig={{ y: { label: "View", color: "#7c3aed" } }}
                    dataKeys={["y"]}
                />
                <Card>
                    <CardHeader className="p-4 border-b text-base font-medium">Customers who opened</CardHeader>
                    <CardContent className="p-0 overflow-auto">
                        <CommonTable
                            columns={openedColumns}
                            data={analyticsData}
                            isLoading={isInitialLoading || isLoadingAnalytics}
                            skeletonColumns={2}
                        />
                        {analyticsData.length > 0 && (
                            <Pagination
                                pageNo={pagination.opened.page}
                                totalPages={Math.ceil(pagination.opened.total / pagination.pageSize)}
                                isLoading={isInitialLoading || isLoadingAnalytics}
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
                    <CardHeader className={"p-4 border-b text-base font-medium"}>Customers who responded</CardHeader>
                    <CardContent className={"p-0 overflow-auto"}>
                        <Table>
                            <TableHeader className={`bg-muted`}>
                                <TableRow>
                                    <TableHead className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground`}>Name</TableHead>
                                    {
                                        (inAppMsgSetting?.steps || []).filter((step, index) => index !== 7).map((x, i) => {
                                            return (
                                                <TableHead className={`max-w-[140px] truncate text-ellipsis overflow-hidden whitespace-nowrap px-2 py-[10px] md:px-3 font-medium text-card-foreground`} key={i}>
                                                    {x.text}
                                                </TableHead>
                                            );
                                        })
                                    }
                                    <TableHead className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground`}>Date Responded</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    (isLoadingResponses) ? (
                                        [...Array(10)].map((x, index) => {
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="px-2 py-[10px] md:px-3">
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="rounded-md w-full h-7" />
                                                        </div>
                                                    </TableCell>
                                                    {(inAppMsgSetting?.steps || []).filter((_, i) => i !== 7).map((_, i) => (
                                                        <TableCell key={`skeleton-step-${i}`} className="max-w-[373px] px-2 py-[10px] md:px-3">
                                                            <Skeleton className="rounded-md w-full h-7" />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="px-2 py-[10px] md:px-3">
                                                        <Skeleton className="rounded-md w-full h-7" />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })) : (analytics?.responses || []).length > 0 ?
                                            <Fragment>
                                                {
                                                    (analytics?.responses || []).map((response, i) => {
                                                        const userName = response?.name || response?.email;
                                                        const createdAt = dayjs(response?.createdAt).format("MMM D, YYYY");
                                                        return (
                                                            <TableRow key={response.userId || i}>
                                                                {/* User Information */}
                                                                <TableCell className="px-2 py-[10px] md:px-3">
                                                                    <div className={"flex items-center gap-2"}>
                                                                    <Avatar className="w-[20px] h-[20px]"><AvatarFallback>{userName?.substring(0, 1)}</AvatarFallback></Avatar>
                                                                    <p className="font-normal max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap">{userName}</p>
                                                                    </div>
                                                                </TableCell>
                                                                {/* Responses for Steps */}
                                                                {(inAppMsgSetting?.steps || []).filter((_, index) => index !== 7).map((step, stepIndex) => {
                                                                    const matchedResponse = response?.response?.find((r) => r.stepId === step.stepId) || {response: "-"};
                                                                    let reactionEmoji = null;
                                                                    if (matchedResponse.reactionId && step.reactions) {
                                                                        const foundReaction = step.reactions.find(r => r.id === matchedResponse.reactionId);
                                                                        if (foundReaction) {
                                                                            reactionEmoji = (
                                                                                <img src={foundReaction.emojiUrl} alt={foundReaction.emoji} className="w-5 h-5"/>
                                                                            );
                                                                        }
                                                                    }
                                                                    return (
                                                                        <TableCell key={`response-${response.userId}-${stepIndex}`} className="px-2 py-[10px] md:px-3 font-normal">
                                                                            {reactionEmoji ? (reactionEmoji
                                                                            ) : cleanQuillHtml(matchedResponse.response) ? (
                                                                                <ReadMoreText2 html={matchedResponse.response} maxLength={16} maxWidthClassName={"max-w-[200px]"}/>
                                                                            ) : "-"}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                                <TableCell className="px-2 py-[10px] md:px-3 font-normal whitespace-nowrap">{createdAt}</TableCell>
                                                            </TableRow>
                                                        )
                                                    })
                                                }
                                            </Fragment> : <TableRow className={"hover:bg-transparent"}>
                                                <TableCell colSpan={10}><EmptyData/></TableCell>
                                            </TableRow>
                                }
                            </TableBody>

                        </Table>
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
                        {/*<CommonTable*/}
                        {/*    columns={getRepliedColumns(inAppMsgSetting?.steps)}*/}
                        {/*    data={analytics.responses || []}*/}
                        {/*    isLoading={isLoading}*/}
                        {/*    skeletonColumns={(inAppMsgSetting?.steps?.length || 1) + 2}*/}
                        {/*/>*/}
                    </CardContent>
                </Card>
                <div className={"flex flex-col gap-4"}>
                    <div className={"flex flex-col gap-8"}>
                        <div className={"grid lg:grid-cols-2 md:grid-cols-2 md:gap-4 gap-3"}>
                            {
                                analyticsResponse.map((x) => {
                                    let questionType2 = [];
                                    let questionType4 = [];
                                    let questionType5 = [];
                                    if (x.questionType === 2 || x.questionType === 3) {
                                        for (let i = x.startNumber; i <= x.endNumber; i++) {
                                            const foundReport = x.report.find(item => item.response === i.toString());
                                            if (foundReport) {
                                                questionType2.push({
                                                    total: foundReport.total,
                                                    response: x.questionType === 3 ? `(${foundReport.response} stars)` : `(${foundReport.response})`
                                                });
                                            } else {
                                                questionType2.push({ total: 0, response: x.questionType === 3 ? `(${i} stars)` : `(${i})` });
                                            }
                                        }
                                    }
                                    if (x.questionType === 4) {
                                        x.reactions.map((r) => {
                                            const foundReport = x.report.find(item => item.reactionId === r.id);
                                            if (foundReport) {
                                                questionType4.push({ total: foundReport.total, response: foundReport.emoji });
                                            } else {
                                                questionType4.push({ total: 0, response: r.emoji });
                                            }
                                        })
                                    }

                                    if (x.questionType === 5) {
                                        x.options.map((r) => {
                                            const foundReport = x.report.find(item => item.stepOptionId === r.id);
                                            const displayText = r.title.length > 30 ? `${r.title.substring(0, 30)}...` : r.title;
                                            if (foundReport) {
                                                questionType5.push({ total: foundReport.total, response: displayText, fullText: r.title });
                                            } else {
                                                questionType5.push({
                                                    total: 0,
                                                    response: displayText,
                                                    fullText: r.title
                                                });
                                            }
                                        })
                                    }
                                    return (
                                        x.questionType === 6 || x.questionType === 7 || x.questionType === 8 ? "" :
                                            <Card key={x.id}>
                                                <CardHeader className={"p-4 border-b text-base font-medium"}>{x.text}</CardHeader>
                                                {
                                                    isInitialLoading ? chartLoading(7, "p-2") :
                                                        <CardContent className={"p-4 pl-0"}>
                                                            {
                                                                x.questionType === 1 ? <div>
                                                                    <ChartContainer config={chartConfigNPS}>
                                                                        {x?.report1?.length > 0 ? (
                                                                            <BarChart accessibilityLayer data={x?.report1}>
                                                                                <CartesianGrid vertical={false}/>
                                                                                <XAxis
                                                                                    dataKey="createdAt"
                                                                                    tickLine={false}
                                                                                    tickMargin={10}
                                                                                    axisLine={false}
                                                                                    tickFormatter={(value) => {
                                                                                        const date = new Date(value)
                                                                                        return date.toLocaleDateString("en-US", {
                                                                                            month: "short",
                                                                                            day: "numeric",
                                                                                        })
                                                                                    }}
                                                                                />
                                                                                <YAxis tickLine={false} axisLine={false}
                                                                                       tickFormatter={(value) => `${value}%`}/>
                                                                                <ChartTooltip
                                                                                    cursor={true}
                                                                                    content={<ChartTooltipContent
                                                                                        labelFormatter={(value) => {
                                                                                            const date = new Date(value);
                                                                                            return date.toLocaleDateString("en-US", {
                                                                                                month: "short",
                                                                                                day: "2-digit",
                                                                                                year: "numeric",
                                                                                            });
                                                                                        }}
                                                                                        formatter={(value, name) => {
                                                                                            return (
                                                                                                <Fragment>
                                                                                                    <div
                                                                                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                                                                                        style={{backgroundColor: `var(--color-${name.toLowerCase()})`,}}
                                                                                                    />
                                                                                                    {chartConfigNPS?.label || name}
                                                                                                    <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                                                                                        {value}
                                                                                                        <span className="font-normal text-muted-foreground">%</span>
                                                                                                    </div>
                                                                                                </Fragment>
                                                                                            )
                                                                                        }}
                                                                                    />}
                                                                                />
                                                                                <Bar
                                                                                    dataKey="detractorPercentage"
                                                                                    stackId="a"
                                                                                    fill="var(--color-detractor)"
                                                                                    radius={[0, 0, 4, 4]}
                                                                                    name={"Detractor"}
                                                                                />
                                                                                <Bar
                                                                                    dataKey="passivesPercentage"
                                                                                    stackId="a"
                                                                                    fill="var(--color-passives)"
                                                                                    radius={[0, 0, 0, 0]}
                                                                                    name={"Passives"}
                                                                                />
                                                                                <Bar
                                                                                    dataKey="promoterPercentage"
                                                                                    stackId="a"
                                                                                    fill="var(--color-promoter)"
                                                                                    name={"Promoter"}
                                                                                    radius={[4, 4, 0, 0]}
                                                                                />
                                                                            </BarChart>
                                                                        ) : <div className="flex items-center justify-center h-full">
                                                                            <EmptyData />
                                                                        </div>}
                                                                    </ChartContainer>
                                                                </div> : <div>
                                                                    <ChartContainer config={{total: {label: 'Total', color: "#7c3aed26",}}}>
                                                                        {(() => {
                                                                            const chartData = x.questionType === 2 || x.questionType === 3
                                                                                ? questionType2
                                                                                : x.questionType === 4
                                                                                    ? questionType4
                                                                                    : x.questionType === 5
                                                                                        ? questionType5
                                                                                        : [];
                                                                            const hasData = chartData.some(item => item.total > 0);
                                                                            return hasData ? (
                                                                                <BarChart accessibilityLayer data={chartData}>
                                                                                    <CartesianGrid vertical={false}/>
                                                                                    <XAxis
                                                                                        dataKey="response"
                                                                                        tickLine={false}
                                                                                        tickMargin={10}
                                                                                        axisLine={false}
                                                                                        tick={{
                                                                                            width: 50,
                                                                                            fontSize: 12,
                                                                                            fill: '#6b7280',
                                                                                        }}
                                                                                        tickFormatter={(value) => {
                                                                                            const maxLength = 5;
                                                                                            return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
                                                                                        }}
                                                                                    />
                                                                                    <YAxis tickLine={false} axisLine={false}/>
                                                                                    <ChartTooltip
                                                                                        cursor={false}
                                                                                        content={<ChartTooltipContent indicator="line"/>}
                                                                                        // content={<ChartTooltipContent
                                                                                        //     indicator="line"
                                                                                        //     formatter={(value, name, props) => {
                                                                                        //         return [
                                                                                        //             <Fragment key="tooltip-content">
                                                                                        //                 <div className="font-medium">{props.payload.fullText || props.payload.response}</div>
                                                                                        //                 <div className="text-muted-foreground">Count: {value}</div>
                                                                                        //             </Fragment>
                                                                                        //         ];
                                                                                        //     }}
                                                                                        // />}
                                                                                    />
                                                                                    <Bar dataKey="total"
                                                                                         fill="var(--color-total)"
                                                                                         className={"cursor-pointer"}
                                                                                         radius={4}
                                                                                         barSize={30}
                                                                                    />
                                                                                </BarChart>
                                                                            ) : <div className="flex items-center justify-center h-full">
                                                                                <EmptyData />
                                                                            </div>
                                                                        })()}
                                                                    </ChartContainer>
                                                                </div>
                                                            }
                                                        </CardContent>
                                                }
                                            </Card>
                                    )
                                })
                            }
                            <Card className={"shadow border"}>
                                <CardHeader className={"p-4 pb-0"}>
                                    <CardTitle className={"text-base font-medium"}>Top Browsers</CardTitle>
                                </CardHeader>
                                <CardContent className={`p-4 ${(isInitialLoading || isLoadingBrowsers) ? "" : 'flex'} justify-center`}>
                                    {
                                        (isInitialLoading || isLoadingBrowsers) ? commonParagraph(8) : browsersData.length > 0 ?
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
                    <div className="flex flex-col gap-4">
                        {questionResponses.map((q, idx) => (
                            <Card key={q.stepId}>
                                {q.text && (
                                    <CardHeader className="p-4 border-b text-base font-medium">
                                        {q.text}
                                    </CardHeader>
                                )}
                                <CardContent className="p-0 overflow-auto">
                                    <Table>
                                        <TableHeader className={`bg-muted`}>
                                            <TableRow>
                                                {["Name", "Response", "Date Responded"].map((x, i) => (
                                                    <TableHead key={i} className={`px-2 py-[10px] md:px-3 font-medium text-card-foreground`}>
                                                        {x}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingQuestions[q.stepId] ? (
                                                [...Array(3)].map((_, i) => (
                                                    <TableRow key={i}>
                                                        {[...Array(3)].map((_, j) => (
                                                            <TableCell key={j}>
                                                                <Skeleton className="h-6 w-full rounded-md" />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (q.responses?.length > 0 ? (
                                                q.responses.map((r, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="flex items-center px-2 py-[10px] md:px-3 gap-2">
                                                            <Avatar className="w-[20px] h-[20px]">
                                                                <AvatarFallback>{r?.name?.[0] || r?.email?.[0] || "?"}</AvatarFallback>
                                                            </Avatar>
                                                            <p className="font-normal">{r?.name || r?.email}</p>
                                                        </TableCell>
                                                        <TableCell className="px-2 py-[10px] md:px-3 font-normal max-w-[270px]">
                                                            {(() => {
                                                                const responseText =
                                                                    Array.isArray(r.response) && r.response.length > 0
                                                                        ? r.response[0].response
                                                                        : "";

                                                                return typeof responseText === "string" && cleanQuillHtml(responseText) ? (
                                                                    <ReadMoreText2 html={responseText} maxLength={300} />
                                                                ) : null;
                                                            })()}
                                                        </TableCell>
                                                        <TableCell className="px-2 py-[10px] md:px-3 font-normal">
                                                            {dayjs(r.createdAt).format("MMM D, YYYY")}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow className={"hover:bg-transparent"}>
                                                    <TableCell colSpan={3}>
                                                        <EmptyData />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {!isLoadingQuestions[q.stepId] && q.responses?.length > 0 && (
                                        <Pagination
                                            pageNo={stepPaginations[q.stepId]?.page || 1}
                                            totalPages={Math.ceil((q.totalRecords || 0) / pagination.pageSize)}
                                            isLoading={isLoadingQuestions[q.stepId]}
                                            handlePaginationClick={(page) => handleStepPaginationClick(q.stepId, page)}
                                            stateLength={q.responses?.length || 0}
                                        />
                                    )}
                                </CardContent>

                            </Card>
                        ))}
                    </div>
                </div>
            </AnalyticsLayout>
        </Fragment>
    );
};

export default SurveysAnalyticsView;