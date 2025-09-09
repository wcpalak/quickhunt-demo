import React, { useEffect, useState } from "react";
import { MoveLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {apiService, baseUrl} from "../../../utils/constent";
import { useSelector } from "react-redux";
import { Card, CardContent } from "../../ui/card";
import EmptyData from "../../Comman/EmptyData";

const PageLayout = ({
                        title,
                        apiMethod,
                        perPageLimit,
                        renderItem,
                        loadingSkeleton,
                        children,
                        emptyIcon,
                    }) => {
    const navigate = useNavigate();
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

    const [isLoading, setIsLoading] = useState(false);
    const [pageNo, setPageNo] = useState(1);
    const [totalRecord, setTotalRecord] = useState(0);
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
        feedbacks: [{ id: "", feedback: "", customer_email_id: "", customer_name: "", created_at: "" }],
        reactions: [{ created_at: "", customer_name: "", post_title: "", reaction_id: "" }],
    });

    useEffect(() => {
        if (projectDetailsReducer.id) {
            fetchData();
        }
    }, [projectDetailsReducer.id, pageNo]);

    const fetchData = async () => {
        setIsLoading(true);
        const data = await apiService[apiMethod]({
            projectId: projectDetailsReducer.id,
            page: pageNo,
            limit: perPageLimit,
        });
        setIsLoading(false);
        if (data.success) {
            setChartList(data.data.data);
            setTotalRecord(data.data.total);
        }
    };

    return (
        <div className="container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4">
            <div className="flex gap-4 items-center mb-6">
                <MoveLeft size={20} onClick={() => navigate(`${baseUrl}/dashboard`)} className="cursor-pointer" />
                <h1 className="text-2xl font-normal flex-initial w-auto">
                    {title} (<span>{totalRecord}</span>)
                </h1>
            </div>
            <Card>
                {isLoading ? (
                    loadingSkeleton
                ) : chartList.length > 0 ? (
                    <CardContent className="p-0">
                        {chartList.map((item, index) => renderItem(item, index))}
                    </CardContent>
                ) : (
                    <EmptyData emptyIcon={emptyIcon} children={title === "Comments" ? "No comments yet" : "No reactions yet"} />
                )}
                {children({ pageNo, setPageNo, totalRecord, isLoading, chartList })}
            </Card>
        </div>
    );
};

export default PageLayout;