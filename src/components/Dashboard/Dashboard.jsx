import React, { Fragment, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import EmptyData from "../Comman/EmptyData";
import { chartLoading, commonLoad } from "../Comman/CommSkel";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, } from "../ui/chart";
import { ReadMoreText2 } from "../Comman/ReadMoreText";
import { DateRangePicker, formatDate, getPresetRange, PRESETS } from "../ui/date-range-picker";
import { Button } from "../ui/button";
import {useNavigate, useSearchParams} from "react-router-dom";
import {apiService, baseUrl} from "../../utils/constent";
import { Badge } from "../ui/badge";
import { UserAvatar } from "../Comman/CommentEditor";
import { Icon } from "../../utils/Icon";
import WelcomeModal from "./WelcomeModal";
import { MoveRight } from "lucide-react";

const chartConfig = {
    totalView: {
        label: "Total Post Views : ",
        color: "#7c3bed80",
    },
    uniqueView: {
        label: "Unique Post Views : ",
        color: "#7c3aed",
    },
}

export function Dashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const modalShow = searchParams.get("fromOnboarding") || null;
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);

    const [isLoading, setIsLoading] = useState(true);
    const [dataAvailable, setDataAvailable] = useState(true);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [state, setState] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 29)),
        to: new Date(),
    });

    const [dateDisplay, setDateDisplay] = useState('');

    const [chartList, setChartList] = useState({
        reactionAnalytic: [],
        guest: [],
        idea: [],
        totalViewCount: 0,
        totalViewCountDiff: 0,
        uniqueViewCount: 0,
        uniqueViewDiff: 0,
        feedbackCount: 0,
        feedbackCountDiff: 0,
        reactionCount: 0,
        reactionCountDiff: 0,
        most_view_post: [],
        feedbackAnalytics: [],
        uniqueViewList: [],
        totalViewViewList: [],
        feedbacks: [
            {
                id: "",
                feedback: "",
                customerEmail: "",
                customerName: "",
                createdAt: "",
            }
        ],
        reactions: [
            {
                createdAt: "",
                customerName: "",
                title: "",
                reactionId: "",
            }
        ]
    });

    useEffect(() => {
        const isFromOnboarding = modalShow === 'true';
        const userId = userDetailsReducer?.id;

        if (isFromOnboarding && userId) {
            const hasUserSeenModal = document.cookie.includes(`welcomeModalShown_${userId}=true`);
            if (!hasUserSeenModal) {
                setShowWelcomeModal(true);
            }
        }
    }, [modalShow, userDetailsReducer?.id]);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            dashboardData()
        }
    }, [projectDetailsReducer.id, state])

    const dashboardData = async () => {
        const payload = {
            projectId: projectDetailsReducer.id,
            ...(state.from && state.to && {
                startDate: dayjs(state.from).format("YYYY-MM-DD"),
                endDate: dayjs(state.to).format("YYYY-MM-DD")
            })
        }

        setIsLoading(true)
        const data = await apiService.dashboardData(payload)
        if (data.success) {
            setIsLoading(false)
            const feedbackAnalytics = data.data.feedbackAnalytics.map((j) => ({
                x: new Date(j.x),
                y: parseInt(j.y),
            }));
            setChartList({
                ...data.data,
                totalViewViewList: data.data.viewsAnalytic,
                feedbackAnalytics: feedbackAnalytics
            })
            setDataAvailable(data.data.viewsAnalytic.length > 0);
        } else {
            setIsLoading(false)
        }
    }

    const onChangeDate = (selected) => {
        setState({
            from: selected.from,
            to: selected.to,
        });
    }

    const checkPreset = () => {
        for (const preset of PRESETS) {
            const presetRange = getPresetRange(preset.name)
            const normalizedRangeFrom = new Date(state.from);
            normalizedRangeFrom.setHours(0, 0, 0, 0);
            const normalizedPresetFrom = new Date(
                presetRange.from?.setHours(0, 0, 0, 0)
            )
            const normalizedRangeTo = new Date(state.to ?? 0);
            normalizedRangeTo.setHours(0, 0, 0, 0);
            const normalizedPresetTo = new Date(
                presetRange.to?.setHours(0, 0, 0, 0) ?? 0
            )
            if (
                normalizedRangeFrom.getTime() === normalizedPresetFrom.getTime() &&
                normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
            ) {
                setDateDisplay(preset.displayDays)
                return
            }
        }
        if (state?.from && state?.to) {
            setDateDisplay(`${formatDate(state?.from)} - ${formatDate(state?.to)}`)
        }

    }

    useEffect(() => {
        checkPreset()
    }, [state])

    const programAnalytics = [
        {
            id: 1,
            title: "Total Views",
            compareText: (
                <span className={chartList.totalViewCountDiff < 0 ? 'text-destructive' : 'text-primary'}>
                    {parseFloat(chartList.totalViewCountDiff).toFixed(2)}%
                </span>
            ),
            count: chartList.totalViewCount || 0,
        },
        {
            id: 2,
            title: "Unique Views",
            compareText: (
                <span className={chartList.uniqueViewDiff < 0 ? 'text-destructive' : 'text-primary'}>
                    {parseFloat(chartList.uniqueViewDiff).toFixed(2)}%
                </span>
            ),
            count: chartList.uniqueViewCount || 0,
        },
        {
            id: 3,
            title: "Feedback",
            compareText: (
                <span className={chartList.feedbackCountDiff < 0 ? 'text-destructive' : 'text-primary'}>
                    {parseFloat(chartList.feedbackCountDiff).toFixed(2)}%
                </span>
            ),
            count: chartList.feedbackCount || 0,
        },
        {
            id: 4,
            title: "Total Reactions",
            compareText: (
                <span className={chartList.reactionCountDiff < 0 ? 'text-destructive' : 'text-primary'}>
                    {parseFloat(chartList.reactionCountDiff).toFixed(2)}%
                </span>
            ),
            count: chartList.reactionCount || 0,
        },
    ]

    return (
        <Fragment>

            <WelcomeModal
                open={showWelcomeModal}
                onOpenChange={setShowWelcomeModal}
            />

            <div className={"md:py-8 py-4 border-b"}>
                <div className='container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] px-3 md:px-4 space-y-1'>
                    <h1 className="md:text-[32px] text-[26px] capitalize">Welcome to Quickhunt</h1>
                    <p className={"text-sm text-muted-foreground"}>Streamline feedback collection, roadmap planning, changelog, messaging, and documentation to accelerate your product development.</p>
                </div>
            </div>
            <div
                className="container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pb-5 px-3 md:px-4 m-auto">
                <div className={"flex items-center flex-wrap pb-6 pt-9 gap-2 justify-between md:flex-nowrap"}>
                    <div className={"space-y-1"}>
                        <h3 className="text-base font-medium capitalize">Activity Summary</h3>
                        <p className={"text-sm text-muted-foreground"}>Monitor engagement, feedback, and feature performance to guide your next move.</p>
                    </div>
                    <DateRangePicker
                        onUpdate={(values) => onChangeDate(values)}
                        initialDateFrom={state.from}
                        initialDateTo={state.to}
                        align="start"
                        locale="en-GB"
                        showCompare={false}
                    />
                </div>
                <div className={"flex flex-col gap-8"}>
                    <div className={"grid lg:grid-cols-4 lg:gap-6 md:grid-cols-2 md:gap-4 gap-3"}>
                        {
                            (programAnalytics || []).map((x, i) => {
                                return (
                                    <Fragment key={i}>
                                        {
                                            isLoading ? <Card><CardContent
                                                className={"p-0"}> {commonLoad.commonParagraphThree} </CardContent></Card> :
                                                <Card
                                                    className={"rounded-lg border bg-card text-card-foreground shadow-sm"}
                                                    x-chunk={"dashboard-05-chunk-0"} key={i}>
                                                    <CardHeader className={"p-6 gap-0.5"}>
                                                        <CardTitle className={"text-base font-medium"}>
                                                            {x.title}
                                                        </CardTitle>
                                                        <CardContent className={"p-0 flex flex-col gap-2 m-0"}>
                                                            <h3 className={"text-primary text-2xl font-medium"}>
                                                                {x.count}
                                                            </h3>
                                                            {
                                                                (state.from && state.to) ?
                                                                    <p className={"text-xs"}>
                                                                        {x.compareText} {dateDisplay}
                                                                    </p> : ""
                                                            }
                                                        </CardContent>
                                                    </CardHeader>
                                                </Card>
                                        }
                                    </Fragment>
                                )
                            })
                        }
                    </div>
                    <div className={"flex flex-wrap gap-4 lg:gap-8 md:flex-nowrap"}>
                        <Card className={"lg:basis-2/3 basis-full min-w-[270px] shadow border flex flex-col"}>
                            <CardHeader className={"p-6 py-3 border-b flex-row justify-between items-center gap-2"}>
                                <CardTitle className={"text-base font-medium"}>
                                    Top {isLoading ? 0 : chartList.feedbacks.length > 0 ? chartList.feedbacks.length : ""} Comments
                                </CardTitle>
                                {
                                    isLoading ? "" : <Fragment>
                                        {
                                    chartList.feedbacks.length > 0 ?
                                        <Button variant={"ghost hover:none"} className={"p-0 h-auto text-primary font-medium"}
                                            onClick={() => navigate(`${baseUrl}/dashboard/comments`)}>
                                            View All
                                        </Button>
                                        : ""
                                }
                                    </Fragment>
                                }
                            </CardHeader>
                            <div className="relative max-h-[300px] flex-1 overflow-y-auto">
                                {
                                    isLoading ? (
                                        <CardContent className={"p-0"}>{commonLoad.dashboardComments}</CardContent>
                                    ) : (
                                        (chartList.feedbacks && chartList.feedbacks.length > 0) ? (
                                            (chartList.feedbacks || []).map((x, i) => {
                                                return (
                                                    <Fragment key={i}>
                                                        <CardContent className={"py-2.5 px-6 flex flex-col gap-4 border-b last:border-b-0"}>
                                                            <div className="flex gap-2 items-center justify-between cursor-pointer">
                                                                <div
                                                                    className="flex gap-2 items-center"
                                                                    onClick={() => {
                                                                        if (x.type === 1) {
                                                                            navigate(`${baseUrl}/changelog/${x.postId}`);
                                                                        } else if (x.type === 2) {
                                                                            navigate(`${baseUrl}/feedback/${x.postId}`);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className={"update-idea text-sm rounded-full text-center"}>
                                                                        <UserAvatar userPhoto={x.userPhoto} userName={x.customerName && x.customerName.substring(0, 1).toUpperCase()} />
                                                                    </div>
                                                                    <div className={"flex items-center flex-wrap gap-1 md:gap-2"}>
                                                                        <h4 className="text-sm font-medium">{x.customerName}</h4>
                                                                        <p className="text-xs text-muted-foreground">{x.customerEmail}</p>
                                                                    </div>
                                                                </div>
                                                                <Badge
                                                                    variant={"outline"}
                                                                    className={`text-xs font-normal text-muted-foreground ${x.type === 1 ? "text-[#3b82f6] border-[#3b82f6]" : "text-[#63c8d9] border-[#63c8d9]"}`}
                                                                >
                                                                    {x.type === 1 ? "Changelog" : "Feedback"}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs font-normal text-foreground cursor-pointer">
                                                                <ReadMoreText2
                                                                    html={x.comment}
                                                                    maxLength={100}
                                                                    onTextClick={() => {
                                                                        if (x.type === 1) {
                                                                            navigate(`${baseUrl}/changelog/${x.postId}`);
                                                                        } else if (x.type === 2) {
                                                                            navigate(`${baseUrl}/feedback/${x.postId}`);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </CardContent>
                                                    </Fragment>
                                                )
                                            })
                                        ) : (
                                            <EmptyData className={"h-full"} emptyIcon={Icon.commentEmpty} children={"No comments yet"} />
                                        )
                                    )
                                }
                            </div>
                        </Card>
                        <Card className={"lg:basis-1/3 basis-full min-w-[270px] shadow border flex flex-col"}>
                            <CardHeader className={"p-6 py-3 border-b flex-row justify-between items-center gap-2"}>
                                <CardTitle className={"text-base font-medium"}>
                                    Top {(isLoading ? 0 : chartList.reactions.length > 0 ? chartList.reactions.length : "")} Reactions</CardTitle>
                                {
                                    isLoading ? "" : <Fragment>
                                        {
                                    chartList.reactions.length > 0 ?
                                        <Button variant={"ghost hover:none"} className={"p-0 h-auto text-primary font-medium"}
                                            onClick={() => navigate(`${baseUrl}/dashboard/reactions`)}>
                                            View All
                                        </Button> : ""
                                }
                                    </Fragment>
                                }
                            </CardHeader>
                            <div className="relative max-h-[300px] flex-1 overflow-y-auto">
                                {
                                    isLoading ? (
                                        <CardContent className={"p-0"}>{commonLoad.commonParagraphTwoAvatar}</CardContent>
                                    ) : (
                                        (chartList.reactions && chartList.reactions.length > 0) ? (
                                            (chartList.reactions || []).map((x, i) => {
                                                const emoji = allStatusAndTypes.emoji.find((e) => e.id === x.reactionId) || { emojiUrl: "" };
                                                return (
                                                    <Fragment key={i}>
                                                        <CardContent className={"py-2.5 px-6 border-b last:border-b-0"}>
                                                            <div className={"flex gap-4"}>
                                                                <UserAvatar className={`rounded-none w-[35px] h-[35px]`} userPhoto={emoji.emojiUrl} />
                                                                <div className={"flex flex-col gap-1"}>
                                                                    <div className="flex gap-1 items-center">
                                                                        <h4
                                                                            className="text-sm font-medium cursor-pointer"
                                                                            onClick={() => navigate(`${baseUrl}/changelog/analytic-view?id=${x.postId}`)}
                                                                        >{x.customerName}</h4>
                                                                        <p className="text-xs text-muted-foreground">Reacted
                                                                            To</p>
                                                                    </div>
                                                                    <p
                                                                        className="text-xs font-medium text-foreground cursor-pointer"
                                                                        onClick={() => navigate(`${baseUrl}/changelog/analytic-view?id=${x.postId}`)}
                                                                    >"{x.title}"</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Fragment>
                                                );
                                            })
                                        ) : <EmptyData className={"h-full"} emptyIcon={Icon.reactionEmpty} children={"No reactions yet"} />
                                    )
                                }
                            </div>
                        </Card>
                    </div>
                    <div>
                        <Card className={"shadow border"}>
                            <CardHeader className={"p-4 pb-0 md:p-6 md:pb-0"}>
                                <CardTitle className={"text-base font-medium"}>Overview</CardTitle>
                            </CardHeader>
                            {dataAvailable ? (
                                <CardContent className={"pb-10 px-4 pt-8 m-0 md:px-7"}>
                                    {
                                        isLoading ? chartLoading(14) : (
                                            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                                                <BarChart accessibilityLayer data={chartList.totalViewViewList}>
                                                    <CartesianGrid vertical={false} />
                                                    <XAxis
                                                        dataKey="x"
                                                        tickLine={false}
                                                        tickMargin={10}
                                                        axisLine={false}
                                                        tickFormatter={(value) => {
                                                            const date = new Date(value);
                                                            return dayjs(value).format("MMM D")
                                                        }}
                                                    />
                                                    <YAxis tickLine={false} axisLine={false} />

                                                    <ChartTooltip
                                                        cursor={false}
                                                        labelFormatter={(value) => {
                                                            return dayjs(value).format("MMMM DD, YYYY")
                                                        }}
                                                        content={<ChartTooltipContent indicator="line" />}
                                                    />
                                                    <Bar dataKey="uniqueView" fill="var(--color-uniqueView)"
                                                        className={"cursor-pointer"} radius={4} />
                                                    <Bar dataKey="totalView" fill="var(--color-totalView)"
                                                        className={"cursor-pointer"} radius={4} />
                                                </BarChart>
                                            </ChartContainer>
                                        )
                                    }
                                </CardContent>
                            ) : <EmptyData className={"h-full"} children={"No activity yet"} emptyIcon={Icon.dashboardOverViewEmpty} />
                            }
                        </Card>
                    </div>
                    <Button variant={"link"} className={'gap-2 font-medium px-0 h-auto underline text-[#5865F2]'} onClick={() => window.open('https://discord.gg/2zxcabtrHW', "_blank")}>{Icon.discordIconBlue}Join us on Discord <MoveRight size={15} /></Button>
                </div>
            </div>
        </Fragment>
    )
}
