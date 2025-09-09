import React, {Fragment, useEffect, useState} from "react";
import {apiService, isContentEmpty, isEmpty} from "../../../../utils/constent";
import {useToast} from "../../../ui/use-toast";
import {ArrowLeft, ChevronRight} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "../../../ui/card";
import {Button} from "../../../ui/button";
import {ReadMoreText} from "../../../Comman/ReadMoreText";

export default function CategoryStep({categoryId, setStep, setArticleId, setsubCatId,isPolaris}) {
    const {toast} = useToast();
    const [categoryData, setCategoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const GetAllSubCategory = async () => {
        setIsLoading(true);
        const data = await apiService.getallSubCategory(categoryId);
        setIsLoading(false);
        if (data?.success) {
            setCategoryData(data?.data);
        } else {
            toast({variant: "destructive", description: data?.error?.message});
        }
    };

    useEffect(() => {
        if (categoryId) {
            GetAllSubCategory();
        }
    }, [categoryId]);

    return (
        <div className="overflow-auto">
            <div className="flex items-center gap-2 mb-[10px]">
                {
                    isLoading ? <div className="h-6 bg-gray-200 rounded w-3/4"/> :
                        <Fragment>
                            <Button
                                variant={"ghost"}
                                onClick={() => setStep(1)}
                                size="icon"
                                className={`${isPolaris ? "" : "text-primary"} w-8 h-8`}
                            >
                                <ArrowLeft size={20}/>
                            </Button>
                            <h1 className="text-xl font-bold">{categoryData.title}</h1>
                        </Fragment>
                }
            </div>

            {isContentEmpty(categoryData.description) ||
            isEmpty(categoryData.description) ? ("") : (
                <div className="mb-3 pt-3 description-container text-[#52525B]">
                    <ReadMoreText html={categoryData.description} alldata={categoryData}/>
                </div>
            )}

            {isLoading ? (
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-6">
                    {[...Array(6)].map((_, index) => (
                        <Card key={index} className="p-3">
                            <CardHeader>
                                <div className="h-6 bg-gray-200 rounded w-3/4"/>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"/>
                                <div className="h-4 bg-gray-200 rounded w-5/6"/>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-3">

                    {categoryData?.subCategory?.map((subcat, index) => (
                        <Card key={index} className="p-5 flex flex-col">
                            <CardHeader className="p-0 mb-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle
                                        onClick={() => {
                                            setStep(3);
                                            setsubCatId(subcat?.slug);
                                        }}
                                        className={`text-base cursor-pointer ${isPolaris ? "hover:text-[#004299]" : "hover:text-primary"} truncate font-semibold text-black`}
                                    >
                                        {subcat?.title}
                                    </CardTitle>
                                    <CardTitle
                                        onClick={() => {
                                            setStep(3);
                                            setsubCatId(subcat?.slug);
                                        }}
                                        className={`text-sm cursor-pointer ${isPolaris ? "hover:text-[#004299]" : "hover:text-primary"} truncate font-semibold text-[#262626] `}
                                    >
                                        {subcat?.articles?.length ? `(${subcat?.articles?.length}) articles` : null}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-grow">
                                {subcat?.articles && subcat?.articles?.length > 0 ? (
                                    <ul className="list-inside flex flex-col">
                                        {subcat.articles.slice(0, 5).map((article, articleIndex) => (
                                            <div key={articleIndex}
                                                 className="flex w-full group hover:bg-primary-foreground justify-between items-center border-b last:border-b-0 px-2 rounded"
                                            >
                                                <li
                                                    onClick={() => {
                                                        setStep(4);
                                                        setArticleId(article?.slug);
                                                    }}
                                                    className={`${isPolaris ? "hover:text-[#004299]" : "hover:text-primary"} text-xs w-full text-[#52525B] truncate cursor-pointer py-2`}
                                                >
                                                    {article?.title}
                                                </li>
                                                <ChevronRight
                                                    className={`size-5 ${isPolaris ? "group-hover:text-[#004299]" : "group-hover:text-primary"} text-[#52525B] cursor-pointer`}/>
                                            </div>
                                        ))}
                                        {subcat.articles.length > 5 && (
                                            <Button variant="ghost"
                                                    className={`w-full ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "text-primary hover:text-primary/80"} text-sm py-2`}
                                                    onClick={() => {
                                                        setStep(3);
                                                        setsubCatId(subcat?.slug);
                                                    }}
                                            >
                                                {`View More (${subcat.articles.length - 5} more)`}
                                            </Button>
                                        )}
                                    </ul>
                                ) : (<div className="text-sm text-gray-500">No articles found in this
                                    subcategory.</div>)}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
