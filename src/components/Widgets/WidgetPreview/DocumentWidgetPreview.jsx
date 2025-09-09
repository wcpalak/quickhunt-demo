import {Fragment, useCallback, useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {Button} from "../../ui/button";
import {CircleArrowRight, X} from "lucide-react";
import {useToast} from "../../ui/use-toast";
import {apiService, DO_SPACES_ENDPOINT, isEmpty,} from "../../../utils/constent";
import {Skeleton} from "../../ui/skeleton";
import {Icon} from "../../../utils/Icon";
import CategoryStep from "./documentsSteps/CategoryStep";
import ArticleDetailStep from "./documentsSteps/ArticleDetailStep";
import SubCategoryStep from "./documentsSteps/SubCategoryStep";

export default function DocumentWidgetPreview({widgetsSetting, isPolaris}) {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const {toast} = useToast();
    const loadedItemsCount = useRef(0);
    const searchTimeoutRef = useRef(null);
    const resultsContainerRef = useRef(null);
    const previousScrollHeightRef = useRef(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [_, setTotalResults] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const limit = 10;
    const [categoryData, setCategoryData] = useState([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [categoryId, setCategoryId] = useState(0);
    const [articleId, setArticleId] = useState(0);
    const [subCatId, setsubCatId] = useState(0);

    const searchItems = useCallback(async (query, pageNum = 1, isLoadMore = false) => {
            if (isLoadMore) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }

            try {
                const body = {
                    projectId: projectDetailsReducer?.id,
                    query: query || "",
                    type: "article",
                    page: pageNum,
                    limit: limit,
                };

                const response = await apiService.getGlobalSearchData(body);
                if (response.success && response.data?.results) {
                    const newResults = response.data.results;
                    setTotalResults(response.data.total || 0);

                    if (isLoadMore) {
                        setSearchResults((prev) => [...prev, ...newResults]);
                        loadedItemsCount.current += newResults.length;
                    } else {
                        setSearchResults(newResults);
                        loadedItemsCount.current = newResults.length;
                    }

                    setHasMore(loadedItemsCount.current < (response.data.total || 0));
                    if (isLoadMore && resultsContainerRef.current) {
                        requestAnimationFrame(() => {
                            const newScrollHeight = resultsContainerRef.current.scrollHeight;
                            const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
                            resultsContainerRef.current.scrollTop = scrollDiff;
                        });
                    }
                } else {
                    if (!isLoadMore) {
                        setSearchResults([]);
                        loadedItemsCount.current = 0;
                    }
                    setTotalResults(0);
                    setHasMore(false);
                }
            } catch (error) {
                if (!isLoadMore) {
                    setSearchResults([]);
                    loadedItemsCount.current = 0;
                }
                setTotalResults(0);
                setHasMore(false);
            } finally {
                if (isLoadMore) {
                    setIsLoadingMore(false);
                } else {
                    setIsLoading(false);
                }
            }
        },
        [projectDetailsReducer?.id]
    );

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        searchItems(searchQuery, nextPage, true);
    };

    const handleSearchChange = useCallback((value) => {
            setSearchQuery(value);
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                if (value.trim()) {
                    setPage(1);
                    searchItems(value, 1, false);
                } else {
                    setSearchResults([]);
                    setTotalResults(0);
                }
            }, 300);
        },
        [searchItems]
    );

    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        loadedItemsCount.current = 0;
        setTotalResults(0);
        setHasMore(false);
        searchItems("", 1, false);
    }, [searchItems]);

    const GetallCategory = async () => {
        setIsCategoryLoading(true);
        const payload = {
            projectId: projectDetailsReducer?.id,
        };
        const data = await apiService.getCategorySubCategory(payload);
        if (data?.success) {
            const filteredCategories = (data?.data || []).filter((cat) =>
                (cat?.subCategory || []).some(
                    (sub) => Array.isArray(sub.articles) && sub.articles.length > 0
                )
            );

            setCategoryData(filteredCategories);
            setIsCategoryLoading(false);
        } else {
            toast({variant: "destructive", description: data?.error?.message});
            setIsCategoryLoading(false);
        }
    };

    const handeredirect = (item) => {
        setArticleId(item?.slug);
        setCategoryId(item?.categorySlug);
        setsubCatId(item?.subCategorySlug);
        setStep(4);
    };

    useEffect(() => {
        if (projectDetailsReducer?.id) {
            GetallCategory();
        }
    }, [projectDetailsReducer?.id]);

    return (
        <div className={"px-3 flex flex-col h-full"}>
            {step === 1 && (
                <Fragment>
                    <div className="relative flex justify-center items-end max-w-xl w-full mx-auto">
                        <div className={`w-full mx-auto mt-5`}>
                            {!isEmpty(widgetsSetting.documentSubTitle) && (
                                <h1 className="text-center break-all font-medium text-[25px] mb-2">
                                    {widgetsSetting.documentSubTitle}
                                </h1>
                            )}

                            {!isEmpty(widgetsSetting.documentDescription) && (
                                <h2 className="text-[#52525B] break-all text-[15px] text-center mb-6">
                                    {widgetsSetting.documentDescription}
                                </h2>
                            )}
                            <div className="relative flex justify-center items-center">
                                <input type="text" value={searchQuery}
                                       onChange={(e) => handleSearchChange(e.target.value)}
                                       className={`${searchQuery?.length ? "rounded-t-[9px]" : "rounded-[9px]"}  h-[45px] border w-full px-3 outline-none pe-20`}
                                       placeholder="Search for articles"
                                />
                                {searchQuery && (
                                    <button onClick={handleClearSearch}
                                            className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                        <X className="h-4 w-4 text-gray-400"/>
                                    </button>
                                )}
                                <CircleArrowRight className="absolute right-3 text-[#9F9FA6]"/>
                            </div>
                        </div>
                        {searchQuery?.length ? (
                            <div
                                className="absolute border-b border-x h-72 text-ce overflow-auto bg-white  -bottom-[18rem] rounded-b-[9px]  w-full">
                                {(searchResults.length > 0 ||
                                    isLoading || (searchQuery && !isLoading)) && (
                                    <div className=" bg-white overflow-y-auto h-full ">
                                        {isLoading && !isLoadingMore ? (
                                            <div
                                                className="p-4 h-full flex justify-center items-center text-center text-gray-500">
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <>
                                                <div className="divide-y">
                                                    {searchResults.map((item) => (
                                                        <div key={item.id} onClick={() => {
                                                            handeredirect(item);
                                                        }} className="p-4 hover:bg-gray-50 cursor-pointer">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-sm font-medium">{item.title}</span>
                                                                <span
                                                                    className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                                {item.type}
                                                              </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {hasMore && (<div className="p-4 text-center">
                                                        <Button onClick={() => {
                                                            loadMore();
                                                        }} disabled={isLoadingMore} variant="outline"
                                                                className="w-full">
                                                            {isLoadingMore ? "Loading..." : "Load More"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (<div
                                                className="p-4 h-full  flex justify-center items-center text-center text-gray-500">
                                                No results found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Categories Section */}
                    {isCategoryLoading ? (
                        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] gap-5 mt-5">
                            {[...Array(9)].map((_, index) => (
                                <div key={index}>
                                    <Skeleton className={"h-40 w-full rounded-[15px]"}/>
                                </div>
                            ))}
                        </div>
                    ) : categoryData.length ? (
                        <div
                            className="my-[25px] grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] overflow-y-auto">
                            {categoryData.map((item, index) => (
                                <div key={index}
                                     onClick={() => {
                                         setStep(2);
                                         setCategoryId(item?.slug);
                                     }}
                                     className="border rounded-[15px] p-6 flex flex-col items-start hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between w-full mb-4">
                                        <div className={`p-2 size-[47px] rounded-[8px] bg-[#F5F5FA] ${isPolaris ? "" : "text-[#6806E1]"}`}>
                                            {item?.image ? (
                                                <img src={`${DO_SPACES_ENDPOINT}/${item?.image} `}
                                                     alt={"image" + item?.title} className="size-[31px] object-cover"/>
                                            ) : (Icon.emails)}
                                        </div>

                                        <span className="text-sm font-medium text-[#52525B]">
                                          {(item?.subCategory || []).reduce((acc, sub) => acc + (sub.articles?.length || 0), 0)}{" "}
                                            articles
                                        </span>
                                    </div>
                                    <h3 className="text-base font-medium  text-[#262626] mb-2">{item.title}</h3>

                                    <div
                                        dangerouslySetInnerHTML={{__html: item?.description?.replace(/<img[^>]*>/gi, ""),}}
                                        className="text-xs line-clamp-2 font-medium text-[#52525B]"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <h3 className=" text-center mt-20 sm:text-2xl text-lg font-medium text-slate-900">
                            No Article Found
                        </h3>
                    )}
                </Fragment>
            )}
            {step === 2 && (
                <CategoryStep
                    setStep={setStep}
                    step={step}
                    subCatId={subCatId}
                    setsubCatId={setsubCatId}
                    categoryId={categoryId}
                    setArticleId={setArticleId}
                    isPolaris={isPolaris}
                />
            )}
            {step === 3 && (
                <SubCategoryStep
                    setStep={setStep}
                    step={step}
                    categoryId={categoryId}
                    setArticleId={setArticleId}
                    subCatId={subCatId}
                    setCategoryId={setCategoryId}
                    setsubCatId={setsubCatId}
                    isPolaris={isPolaris}
                />
            )}
            {step === 4 && (
                <ArticleDetailStep
                    setStep={setStep}
                    step={step}
                    articleId={articleId}
                    setsubCatId={setsubCatId}
                    setCategoryId={setCategoryId}
                    isPolaris={isPolaris}
                />
            )}
        </div>
    );
}
