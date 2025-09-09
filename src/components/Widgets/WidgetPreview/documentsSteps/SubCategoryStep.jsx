import React, {Fragment, useEffect, useState} from "react";
import {apiService, DO_SPACES_ENDPOINT} from "../../../../utils/constent";
import {useToast} from "../../../ui/use-toast";
import {ChevronRight} from "lucide-react";
import {Card, CardContent, CardHeader} from "../../../ui/card";

export default function SubCategoryStep({setStep, setArticleId, setCategoryId, subCatId,isPolaris}) {
    const {toast} = useToast();
    const [categoryData, setCategoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const GetallSubCategory = async () => {
        setIsLoading(true);
        const data = await apiService.getallSubCategoryArticleList(subCatId);
        if (data?.success) {
            setCategoryData(data?.data);
            setIsLoading(false);
        } else {
            toast({variant: "destructive", description: data?.error?.message});
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (subCatId) {
            GetallSubCategory();
        }
    }, [subCatId]);
    
    return (
        <div className="overflow-auto">
            {categoryData?.slug && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className={`hover:underline underline underline-offset-2 cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary"}`}
                          onClick={() => {
                              setStep(2);
                              setCategoryId(categoryData?.categorySlug);
                          }}
                    >{" "}{categoryData?.categoryTitle}
                    </span>
                    {/* <ChevronRight className="text-sm" size={14}/>{" "}
                    <span> {categoryData?.title}</span> */}
                </div>
            )}
            {categoryData?.title && (
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold ">{categoryData.title}</h1>
                </div>
            )}

            {categoryData?.description && (
                    <div dangerouslySetInnerHTML={{__html: categoryData?.description?.replace(/<img\s+src="([^"]+)"\s*\/?>/g, (match, src) => {
                        if (/^#[a-zA-Z0-9-]+/.test(src)) {
                            const found = categoryData?.descriptionImages?.find((img) => img.key === src);
                            return found ?
                                `<img src="${DO_SPACES_ENDPOINT}/${found?.path}" class="my-2 object-contain object-center" style="max-width: 100%; height: auto;" />` : "";
                        }
                        return match;
                    }),}}
                        className="ql-editor mb-3"
                    />
            )}
            {isLoading ? (
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-6">
                    {[...Array(6)].map((_, index) => (
                        <Card key={index} className="p-3">
                            <CardHeader><div className="h-6 bg-gray-200 rounded w-3/4"/></CardHeader>
                            <CardContent className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"/>
                                <div className="h-4 bg-gray-200 rounded w-5/6"/>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : categoryData?.articles?.length ? (
                <>
                    <ul className="border p-3 rounded-lg">
                        {categoryData?.articles?.map((item, index) => (
                            <div key={index}
                                onClick={() => {
                                    setStep(4);
                                    setArticleId(item?.slug);
                                }}
                                className={`flex justify-between items-center group rounded-lg text-sm p-3 px-2 cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary hover:bg-slate-50"} `}
                            >
                                <li>{item?.title}</li>
                                <ChevronRight className={`text-muted-foreground ${isPolaris ? " group-hover:text-[#004299]" : "group-hover:text-primary"} text-sm size-5`}/>
                            </div>
                        ))}
                    </ul>
                </>
            ) : (<div className="text-center text-sm text-gray-500 mt-5">No articles found in this subcategory.</div>)}
        </div>
    );
}
