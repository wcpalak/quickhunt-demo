import React, {Fragment, useEffect, useRef, useState} from "react";
import {apiService, baseUrl, isEditorContentEmpty,} from "../../../utils/constent";
import {Button} from "../../ui/button";
import {BarChart, Circle, Eye, Loader2} from "lucide-react";
import {useNavigate, useParams} from "react-router-dom";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "../../ui/select";
import {Label} from "../../ui/label";
import {Input} from "../../ui/input";
import {Card, CardHeader} from "../../ui/card";
import {useSelector} from "react-redux";
import {useToast} from "../../ui/use-toast";
import CommonBreadCrumb from "../../Comman/CommonBreadCrumb";
import {Skeleton} from "../../ui/skeleton";
import CommonRichTextEditor from "../../Comman/CommonRichTextEditor";

const statusOptions = [
    {name: "Publish", value: 1, fillColor: "#389E0D", strokeColor: "#389E0D"},
    {name: "Draft", value: 0, fillColor: "#CF1322", strokeColor: "#CF1322"},
];

const initialState = {
    title: "",
    slug: "",
    categoryId: null,
    subcategoryId: null,
    description: "",
    isActive: 1,
    categorySlug: "",
    subCategorySlug: "",
};

const initialStateError = {
    title: "",
    slug: "",
    categoryId: null,
    subcategoryId: null,
    description: "",
    isActive: 1,
};

const generateSlug = (title) => {
    if (!title) return "";
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .substring(0, 160);
};

const ArticleDetail = () => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const editorRef = useRef(null);

    const [articlesDetails, setArticlesDetails] = useState(initialState);
    const [formError, setFormError] = useState(initialStateError);
    const [articleList, setArticleList] = useState([]);
    const [load, setLoad] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadBreadCrumb, setIsLoadBreadCrumb] = useState(true);
    const [editorContent, setEditorContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);

    useEffect(() => {
        if (id !== "new" && projectDetailsReducer.id) {
            getSingleArticle();
        }
        if (projectDetailsReducer.id) {
            getAllCategoryV2();
        }
    }, [id, projectDetailsReducer.id]);

    const getAllCategoryV2 = async () => {
        const data = await apiService.getAllCategoryV2({
            projectId: projectDetailsReducer.id,
        });
        setIsLoading(false);
        if (data.success) {
            setArticleList(data.data?.rows);
        }
    };

    const getSingleArticle = async () => {
        const data = await apiService.getSingleArticle(id);
        if (data.success) {
            const payload = {
                ...initialState,
                id: data.data.id,
                title: data.data.title,
                categoryId: data.data.categoryId,
                categoryTitle: data.data.categoryTitle,
                subcategoryId: data.data.subcategoryId,
                subCategoryTitle: data.data.subCategoryTitle,
                slug: data?.data?.slug || "",
                description: data.data.description,
                isActive: data.data.isActive,
                categorySlug: data?.data?.categorySlug,
                subCategorySlug: data?.data?.subCategorySlug,
            };
            setArticlesDetails(payload);
            setEditorContent(data.data.description || '');
            setOriginalContent(data.data.description || '');
        }
        setIsLoadBreadCrumb(false);
    };

    const handleOnChange = (name, value) => {
        const trimmedValue = name === "title" ? value.trimStart() : value;
        setArticlesDetails((prev) => {
            const newState = {
                ...prev, [name]: name === "categoryId" || name === "subcategoryId" ? value?.toString() : trimmedValue,
            };
            if (name === "title" && id === "new") {
                newState.slug = generateSlug(trimmedValue);
            }
            if (name === "slug") {
                const formattedSlug = trimmedValue.replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").toLowerCase();
                newState.slug = formattedSlug;
            }
            if (name === "categoryId") {
                newState.subcategoryId = null;
            }
            return newState;
        });
        setFormError((formError) => ({
            ...formError,
            [name]: formValidate(name, trimmedValue),
        }));
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Title is required";
                } else if (value.length > 250) {
                    return "Title must be less than 250 characters";
                } else {
                    return "";
                }
            case "slug":
                if (id === 'new') {
                    if (!value || value.trim() === "") {
                        return "Slug is required";
                    } else if (value.length > 160) {
                        return "Slug must be less than 160 characters";
                    }
                }
                return "";
            case "categoryId":
                if (!value || value?.toString()?.trim() === "") {
                    return "Select a Category";
                } else {
                    return "";
                }
            case "subcategoryId":
                if (!value || value?.toString()?.trim() === "") {
                    return "Select a Sub Category";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const handleEditorChange = (content) => {
        setEditorContent(content);
        setArticlesDetails((prev) => ({
            ...prev,
            description: content,
        }));
        setFormError((prev) => ({
            ...prev,
            description: formValidate("description", content),
        }));
    };

    // const selectedCategory = articleList?.find((category) => category.id === Number(articlesDetails?.categoryId)) || { title: articlesDetails?.categoryTitle, subCategories: [] };
    // const subcategories = selectedCategory ? selectedCategory?.subCategories : [];

    const selectedCategory =
  articleList?.find(
    (category) => category.id === Number(articlesDetails?.categoryId)
  ) || { subCategories: [] };

const subcategories = selectedCategory?.subCategories || [];

    const extractImageUrls = (content) => {
        if (!content) return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const images = doc.querySelectorAll('img');

        return Array.from(images).map(img => {
            const src = img.getAttribute('src');
            // Extract the path part from the URL (assuming your images are stored with a known pattern)
            const url = new URL(src);
            return url.pathname.replace(/^\/media\//, ''); // Adjust this based on your actual URL structure
        });
    };

    const handleArticle = async (type) => {
        const trimmedTitle = articlesDetails.title ? articlesDetails.title.trim() : "";
        const updatedIdea = {...articlesDetails, title: trimmedTitle,};
        setArticlesDetails(updatedIdea);
        let validationErrors = {};
        Object.keys(articlesDetails).forEach((name) => {
            const error = formValidate(name, articlesDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }

        if (isEditorContentEmpty(articlesDetails?.description)) {
            toast({ variant: "destructive", description: "Please write a message." });
            return;
        }

        const selectedCategory = articleList.find((item) => item.id === Number(articlesDetails.categoryId));
        let selectedSubCategory = null;
        if (selectedCategory && selectedCategory.subCategories && selectedCategory.subCategories.rows) {
            selectedSubCategory = selectedCategory.subCategories.rows.find(
                (sub) => sub.id === Number(articlesDetails.subcategoryId)
            );
        }

        const randomNumber = Math.floor(Math.random() * 99) + 1;
        const twoDigit = String(randomNumber).padStart(2, "0");
        const payload = {
            projectId: projectDetailsReducer.id,
            categoryId: articlesDetails.categoryId,
            // subcategoryId: selectedSubCategory ? selectedSubCategory.id : null,
            subcategoryId: articlesDetails.subcategoryId,
            title: articlesDetails.title,
            description: editorContent,
            isActive: articlesDetails.isActive,
        };
        if (type !== "update") {
            payload.slug = `${articlesDetails.slug}-${twoDigit}`;
        }

        setLoad(type);

        const currentImageUrls = extractImageUrls(editorContent);
        const imagesToDelete = uploadedImages.filter(url =>
            !currentImageUrls.includes(url)
        );

        if (type === "update") {
            // const imageUrls = extractImageUrls(editorContent); // new
            // const previousImageUrls = extractImageUrls(originalContent); // old
            //
            // const imagesToDelete = previousImageUrls.filter(url => !imageUrls.includes(url));
            //
            // if (imagesToDelete.length > 0) {
            //     const deletePayload = { keys: imagesToDelete };
            //     await apiService.mediaDeleteImage(deletePayload);
            // }

            // const currentImageUrls = extractImageUrls(editorContent);
            // const previousImageUrls = extractImageUrls(originalContent);
            //
            // // Only delete images that were in original content but are now missing
            // const imagesToDelete = previousImageUrls.filter(url =>
            //     !currentImageUrls.includes(url)
            // );
            //
            // // Also delete any uploaded images that were removed before saving
            // const removedUploads = uploadedImages.filter(url =>
            //     !currentImageUrls.includes(url)
            // );
            //
            // const allImagesToDelete = [...imagesToDelete, ...removedUploads];
            //
            // if (allImagesToDelete.length > 0) {
            //     await apiService.mediaDeleteImage({ keys: allImagesToDelete });
            // }

            const previousImageUrls = extractImageUrls(originalContent);
            imagesToDelete.push(
                ...previousImageUrls.filter(url => !currentImageUrls.includes(url))
            );
        }

        if (imagesToDelete.length > 0) {
            await apiService.mediaDeleteImage({ keys: imagesToDelete });
        }

        let data;
        if (type === "update") {
            data = await apiService.updateArticle(payload, articlesDetails.id);
        } else {
            data = await apiService.createArticles(payload);
        }
        setLoad("");
        if (data?.success) {
            setUploadedImages([]);
            if (type === "update") {
                setOriginalContent(editorContent);
                setArticleList(articleList);
            } else {
                setArticlesDetails(initialState);
                setEditorContent('');
                setOriginalContent('');
            }
            toast({ description: data.message });
            if (type !== "update") {
                navigate(`${baseUrl}/help/article`);
            }
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    };

    const renderSidebarItems = () => {
        return (
            <div className={"border-b px-4 py-6 space-y-6"}>
                <div className={"space-y-2"}>
                    <Label className={"text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive"}>
                        Title
                    </Label>
                    <Input
                        name="title"
                        placeholder={"Article title"}
                        value={articlesDetails.title}
                        onChange={(e) => handleOnChange("title", e.target.value)}
                        className={"text-sm font-normal w-full h-auto"}
                        autoFocus
                    />
                    {formError?.title && (<span className="text-red-500 text-sm">{formError?.title}</span>)}
                </div>
                <div className={"space-y-2"}>
                    <Label className={"text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive"}>
                        Slug
                    </Label>
                    <Input
                        name="slug"
                        placeholder={"Article slug"}
                        value={articlesDetails.slug}
                        onChange={(e) => handleOnChange("slug", e.target.value)}
                        className={"text-sm font-normal w-full h-auto"}
                        maxLength={160}
                        disabled={id !== "new"}
                    />

                    {formError?.slug && (<span className="text-red-500 text-sm block">{formError?.slug}</span>)}
                    <span className="text-xs text-muted-foreground block">
                        {`${id === "new" ? `${articlesDetails.slug.length}/160 characters` : ""}`}
                        {id !== "new" && " (Slug cannot be changed after creation)"}
                    </span>

                </div>
                <div className={"space-y-2"}>
                    <Label className={"text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive"}>
                        Select Category
                    </Label>
                    <Select value={articlesDetails.categoryId?.toString()} onValueChange={(value) => handleOnChange("categoryId", value)}>
                        <SelectTrigger className="h-auto">
                            <SelectValue placeholder="Select a category">
                                {articleList?.find((item) => Number(item.id) === Number(articlesDetails.categoryId))?.title ||
                                (<span className="text-muted-foreground">Select a category</span>)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {articleList?.length > 0 ? (
                                    articleList?.map((item, i) => (
                                        <SelectItem key={i} value={item.id.toString()} className={"cursor-pointer"}>
                                            {item.title}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem disabled className={"cursor-pointer"}>No Categories</SelectItem>
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {formError.categoryId && (<span className="text-red-500 text-sm">{formError.categoryId}</span>)}
                </div>
                <div className={"space-y-2"}>
                    <Label className={"text-sm font-medium after:ml-1 after:content-['*'] after:text-destructive"}>
                        Select Sub Category
                    </Label>
                    <Select
                        value={articlesDetails.subcategoryId?.toString()}
                        onValueChange={(value) => handleOnChange("subcategoryId", value)}
                        >
                        <SelectTrigger className="h-auto">
                            <SelectValue placeholder="Select a subcategory">
                            {subcategories.find((item) => item.id === Number(articlesDetails.subcategoryId))?.title ||
                                (<span className="text-muted-foreground">Select a subcategory</span>)}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                            {subcategories.length > 0 ? (
                                subcategories.map((subCategory, i) => (
                                <SelectItem key={i} value={subCategory.id.toString()} className={"cursor-pointer"}>
                                    {subCategory.title}
                                </SelectItem>
                                ))
                            ) : (
                                <SelectItem disabled className={"cursor-pointer"}>No Sub Categories</SelectItem>
                            )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {formError.subcategoryId && (
                        <span className="text-red-500 text-sm">{formError.subcategoryId}</span>
                    )}
                </div>
            </div>
        );
    };

    const links = [{ label: "Article", path: `/help/article` }];

    const viewLink = (id, subId, subslug) => {
        window.open(
            `https://${projectDetailsReducer.domain}/documents/${subId}/${subslug}/${id}`,
            "_blank"
        );
    };

    return (
        <Fragment>
            <div className={"p-4 md:py-6 md:px-4 border-b flex items-center justify-between flex-wrap gap-2"}>
                <CommonBreadCrumb
                    links={links}
                    currentPage={(isLoading || isLoadBreadCrumb) && id !== "new" ? null : articlesDetails?.title}
                    truncateLimit={30}
                />
                <div className={"flex flex-wrap gap-2 md:gap-4 items-center"}>
                    {id !== "new" ? (
                        <Button
                            variant="outline"
                            className={"w-8 h-8"}
                            size="icon"
                            onClick={() =>
                                navigate(`${baseUrl}/help/article/analytic-view/${articlesDetails.id}?slug=${articlesDetails.slug}&title=${encodeURIComponent(articlesDetails.title)}`)
                            }
                        >
                            <BarChart size={16} />
                        </Button>
                    ) : ("")}
                    <Select
                        value={articlesDetails.isActive}
                        onValueChange={(value) => handleOnChange("isActive", Number(value))}
                    >
                        <SelectTrigger className={"w-[120px] h-auto py-[6px]"}>
                            <SelectValue
                                placeholder={
                                    articlesDetails.isActive
                                        ? statusOptions.find(
                                            (s) => s.value == articlesDetails.isActive
                                        )?.name
                                        : "Publish"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {statusOptions.map((x, i) => (
                                    <SelectItem key={i} value={x.value}>
                                        <div className={"flex items-center gap-2"}>
                                            <Circle
                                                fill={x.fillColor}
                                                stroke={x.strokeColor}
                                                className={`font-normal w-2 h-2`}
                                            />
                                            {x.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    {id !== "new" && (
                        <Button
                            variant={"ghost hover:bg-none"}
                            disabled={!articlesDetails.isActive}
                            onClick={() =>
                                viewLink(
                                    articlesDetails.slug,
                                    articlesDetails.categorySlug,
                                    articlesDetails?.subCategorySlug
                                )
                            }
                            className={"px-3 py-[6px] border font-normal h-auto"}
                        >
                            <Eye size={16} className={"mr-3"} /> Preview
                        </Button>
                    )}
                    <Button
                        className={"w-[81px] py-[7px] font-medium h-8 hover:bg-primary"}
                        disabled={load !== ''}
                        onClick={() =>
                            id !== "new"
                                ? handleArticle("update")
                                : handleArticle("create")
                        }
                    >
                        {load ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : id !== "new" ? (
                            "Update"
                        ) : (
                            "Create"
                        )}
                    </Button>
                </div>
            </div>
            <div
                className={
                    "flex flex-wrap md:flex-nowrap h-[calc(100%_-_83px)] overflow-y-auto"
                }
            >
                <div className={"max-w-[407px] w-full border-r h-full overflow-y-auto"}>
                    {renderSidebarItems()}
                </div>
                <div
                    className={
                        "bg-muted w-full p-4 md:px-16 md:py-8 flex flex-col md:gap-4 justify-start overflow-y-auto h-[calc(100vh_-_402px)] md:h-[calc(100vh_-_140px)]"
                    }
                >
                    {isLoading && id !== "new" ? (
                        <div className={"flex flex-col gap-4"}>
                            {Array.from(Array(25)).map((_, r) => {
                                return (
                                    <div key={r}>
                                        <Skeleton className="h-[10px] rounded-full bg-muted-foreground/20" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <Card id="article-editor-scroll-container" className={`rounded-[10px] p-0 h-full overflow-auto`}>
                            <CardHeader className={"p-3 pt-4"}>
                                <div className={"w-full"}>
                                    <CommonRichTextEditor
                                        ref={editorRef}
                                        value={editorContent}
                                        onChange={handleEditorChange}
                                        onImageUpload={(imageUrl) => {
                                            // Track newly uploaded images
                                            setUploadedImages(prev => [...prev, imageUrl]);
                                        }}
                                        placeholder="Start typing here — use / to explore commands"
                                        uploadFolder="post"
                                        moduleName="article"
                                        className="w-full"
                                        scrollContainerId="article-editor-scroll-container"
                                        scrollAlignMode="top"
                                    />
                                </div>
                            </CardHeader>
                        </Card>
                    )}
                </div>
            </div>
        </Fragment>
    );
};

export default ArticleDetail;