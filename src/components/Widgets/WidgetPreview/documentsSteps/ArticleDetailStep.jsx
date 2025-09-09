import React, {useEffect, useRef, useState} from "react";
import {apiService} from "../../../../utils/constent";
import {ChevronRight} from "lucide-react";
import {Skeleton} from "../../../ui/skeleton";

export default function ArticleDetailStep({
                                              setStep,
                                              articleId,
                                              setsubCatId,
                                              isPolaris
                                          }) {
    const mainContentRef = useRef(null);
    const headerContentRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [articleData, setArticleData] = useState({});
    const articleDescriptionRef = useRef(null);

    const getArticle = async () => {
        setLoading(true);
        const data = await apiService.getArticleSingle(articleId);
        if (data?.success) {
            setLoading(false);
            setArticleData(data?.data);
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (articleId) {
            getArticle();
        }
    }, [articleId]);

    useEffect(() => {
        if (isPolaris && articleDescriptionRef.current) {
            articleDescriptionRef.current
                .querySelectorAll("a")
                .forEach((a) => {
                    a.style.color = "#005bd3";
                });
        }
    }, [isPolaris, articleData]);

    return (
        <div className="flex flex-col w-full @2xl:mt-0 mt-0  overflow-y-auto overflow-x-hidden">
            <div className="">
                <div>
                    {loading ? (
                        [...Array(20)].map((_, index) => (
                            <div key={index} className="flex gap-5  @2xl:px-8 p-0 @2xl:ms-4 ms-0">
                                <Skeleton className={"h-10 w-full mt-5"}/>
                                <Skeleton className={"h-10 w-full mt-5"}/>
                            </div>
                        ))
                    ) : (
                        <div className="@md:flex mt-5 relative flex-row-reverse p-0 @2xl:ms-4 ms-0  [container-type:inline-size]">
                            <div ref={headerContentRef}
                                className="flex flex-wrap @md:hidden items-center gap-2 text-sm text-gray-500 mb-3"
                            >
                                <span className={`hover:underline underline underline-offset-2 text-nowrap text-center cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary"}`}
                                    onClick={() => {
                                        setStep(2);
                                        setsubCatId(articleData?.categorySlug);
                                    }}
                                >{" "}{articleData?.categoryTitle}
                                </span>
                                <ChevronRight className="text-sm" size={14}/>{" "}
                                <span className={`hover:underline underline underline-offset-2 text-nowrap text-center cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary"}`}
                                    onClick={() => {
                                        setStep(3);
                                        setsubCatId(articleData?.subCategorySlug);
                                    }}
                                >{" "}{articleData?.subCategoryTitle}
                                </span>
                                <ChevronRight className="text-sm" size={14}/>{" "}
                                <span> {articleData?.title}</span>
                            </div>

                            <div ref={mainContentRef} className="flex-1  relative scroll-mt-32"
                                style={{scrollBehavior: "smooth", scrollPaddingTop: "80px",}}
                            >
                                <div ref={headerContentRef} className="@md:flex hidden items-center gap-2 text-sm text-gray-500 mb-3">
                                    <span className={`hover:underline underline underline-offset-2 cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary"}`}
                                          onClick={() => setStep(2)}
                                    >{" "}{articleData?.categoryTitle}
                                    </span>
                                    <ChevronRight className="text-sm" size={14}/>{" "}
                                    <span className={`hover:underline underline underline-offset-2 cursor-pointer ${isPolaris ? "text-[#005bd3] hover:text-[#004299]" : "hover:text-primary"}`} onClick={() => setStep(3)}>
                                        {" "}{articleData?.subCategoryTitle}
                                    </span>
                                    <ChevronRight className="text-sm" size={14}/>{" "}
                                    <span> {articleData?.title}</span>
                                </div>

                                <div className="control-pane">
                                    <div className="control-section" id="rteTools">
                                        <div className="rte-control-section">
                                            <div
                                                id="commonRTE"
                                                className="e-control e-richtexteditor e-lib e-rte-toolbar-enabled e-rte-tb-expand"
                                                role="application"
                                                aria-label="Rich Text Editor"
                                                aria-disabled="false"
                                            >
                                                <div className="e-rte-container" role="presentation">
                                                    <div className="e-rte-content" id="commonRTErte-view">
                                                        <div
                                                            className="e-content e-mention e-lib e-keyboard"
                                                            id="commonRTE_rte-edit-view"
                                                            aria-label="mention"
                                                            role="textbox"
                                                            lang="en"
                                                            dir="ltr"
                                                            tabIndex="0"
                                                        >
                                                            <div ref={articleDescriptionRef}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: articleData?.description || "",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
