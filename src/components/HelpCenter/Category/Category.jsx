import React, {Fragment, useEffect, useCallback, useState} from "react";
import {Button} from "../../ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "../../ui/table";
import {Card, CardContent} from "../../ui/card";
import {Plus, X} from "lucide-react";
import {Sheet, SheetContent, SheetHeader} from "../../ui/sheet";
import dayjs from "dayjs";
import {useToast} from "../../ui/use-toast";
import {useSelector} from "react-redux";
import {Skeleton} from "../../ui/skeleton";
import EmptyData from "../../Comman/EmptyData";
import {apiService, baseUrl, DO_SPACES_ENDPOINT,} from "../../../utils/constent";
import {useNavigate} from "react-router";
import Pagination from "../../Comman/Pagination";
import DeleteDialog from "../../Comman/DeleteDialog";
import {debounce} from "lodash";
import {EmptyDataContent} from "../../Comman/EmptyDataContent";
import CategoryForm from "../../Comman/CategoryForm";
import {CommSearchBar} from "../../Comman/CommentEditor";
import {EmptyInCategoryContent} from "../../Comman/EmptyContentForModule";
import {DialogTitle} from "../../ui/dialog";
import {Icon} from "../../../utils/Icon";
import {Checkbox} from "../../ui/checkbox";
import {DndContext, closestCenter, PointerSensor, useSensor, useSensors,} from "@dnd-kit/core";
import {arrayMove, SortableContext, verticalListSortingStrategy,} from "@dnd-kit/sortable";
import SortableCategoryRow from "./SortableCategoryRow";
import {restrictToParentElement, restrictToVerticalAxis} from "@dnd-kit/modifiers";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

const initialState = {
    title: "",
    slug: "",
    description: "",
    descriptionImages: [],
    createdAt: dayjs().fromNow(),
    image: "",
    deleteImage: "",
};

const initialStateError = {
    title: "",
    slug: "",
    description: "",
};

const perPageLimit = 10;

const Category = () => {
    const {toast} = useToast();
    const navigate = useNavigate();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

    const [formError, setFormError] = useState(initialStateError);
    const [selectedCategory, setSelectedCategory] = useState(initialState);
    const [selectedSubCategory, setSelectedSubCategory] = useState(initialState);
    const [categoryList, setCategoryList] = useState([]);
    const [subCategoryId, setSubCategoryId] = useState("");
    const [pageNo, setPageNo] = useState(Number(getPageNo));
    const [totalRecord, setTotalRecord] = useState(0);
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isSheetOpenSub, setSheetOpenSub] = useState(false);
    const [categoryEdit, setCategoryEdit] = useState(false);
    const [subCategoryEdit, setSubCategoryEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [openDelete, setOpenDelete] = useState(false);
    const [openSubDelete, setOpenSubDelete] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const [subIdToDelete, setSubIdToDelete] = useState(null);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [filter, setFilter] = useState({search: "", categoryId: "", subCategoryId: "",});
    const [emptyContentBlock, setEmptyContentBlock] = useState(true);
    const [imageSizeError, setImageSizeError] = useState("");

    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState([]);
    const [deleteType, setDeleteType] = useState("");

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSubCategories, setSelectedSubCategories] = useState([]);
    const [selectAllCategories, setSelectAllCategories] = useState(false);
    const [selectAllSubCategories, setSelectAllSubCategories] = useState(false);
    const [selectionType, setSelectionType] = useState(null);
    const [subCategoryLoadingStates, setSubCategoryLoadingStates] = useState({});
    const [categoryPages, setCategoryPages] = useState({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const resetSelections = () => {
        setSelectedCategories([]);
        setSelectedSubCategories([]);
        setSelectAllCategories(false);
        setSelectAllSubCategories(false);
        setSelectionType(null);
    };

    const emptyContent = (status) => {
        setEmptyContentBlock(status);
    };

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllCategory(filter.search);
        }
        navigate(`${baseUrl}/help/category?pageNo=${pageNo}`);
    }, [projectDetailsReducer.id, pageNo]);

    const getAllCategory = async (search, categoryId = null) => {
        const subPage = categoryId ? categoryPages[categoryId] || 1 : 1;
        const data = await apiService.getAllCategory({
            projectId: projectDetailsReducer.id,
            search: search,
            page: pageNo,
            limit: perPageLimit,
            subPage: subPage,
            categoryId: categoryId
        });
        if (data.success) {
            setCategoryList(data.data);
            setTotalRecord(data.data.total);
            setIsLoading(false);
            if (!data.data.rows || data.data.rows.length === 0) {
                emptyContent(true);
            } else {
                emptyContent(false);
            }
        } else {
            setIsLoading(false);
            emptyContent(true);
        }
    };

      const handleSubCategoryPagination = async (categoryId, newSubPage) => {
        setSubCategoryLoadingStates(prev => ({ ...prev, [categoryId]: true }));
        const data = await apiService.getAllCategory({
          projectId: projectDetailsReducer.id,
          search: filter.search,
          page: pageNo,
          limit: perPageLimit,
          subPage: newSubPage,
          categoryId: categoryId
        });
        if (data.success) {
          const categoryData = data.data.rows.find(c => c.id === categoryId);
          const totalSubPages = Math.ceil(categoryData?.subCategories?.total / perPageLimit);
          let actualPage = newSubPage;
          if (newSubPage > totalSubPages && totalSubPages > 0) {
            actualPage = totalSubPages;
          } else if (newSubPage < 1) {
            actualPage = 1;
          }
          setCategoryPages(prev => ({ ...prev, [categoryId]: actualPage }));
          if (actualPage !== newSubPage) {
            setSubCategoryLoadingStates(prev => ({ ...prev, [categoryId]: false }));
            handleSubCategoryPagination(categoryId, actualPage);
            return;
          }
          setCategoryList(prev => {
            const updatedRows = prev.rows.map(category => {
              if (category.id === categoryId) {
                return {
                  ...category,
                  subCategories: categoryData?.subCategories || category.subCategories
                };
              }
              return category;
            });
            
            return { ...prev, rows: updatedRows };
          });
        } else {
          toast({ description: data.error.message, variant: "destructive" });
        }
        setSubCategoryLoadingStates(prev => ({ ...prev, [categoryId]: false }));
      };

    const toggleSelectCategory = (categoryId) => {
        setSelectionType("category");
        setSelectedCategories((prev) => {
            const updatedSelection = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId];
            if (updatedSelection.length === 0) {
                setSelectAllCategories(false);
                setSelectionType(null);
            }
            return updatedSelection;
        });
    };

    const toggleSelectSubCategory = (subCategoryId) => {
        setSelectionType("subcategory");
        setSelectedSubCategories((prev) => {
            const updatedSelection = prev.includes(subCategoryId) ? prev.filter((id) => id !== subCategoryId) : [...prev, subCategoryId];
            if (updatedSelection.length === 0) {
                setSelectAllSubCategories(false);
                setSelectionType(null);
            }
            return updatedSelection;
        });
    };

    const toggleSelectAllCategories = () => {
        setSelectionType("category");
        if (selectAllCategories) {
            setSelectedCategories([]);
            setSelectionType(null);
        } else {
            setSelectedCategories(categoryList.rows.map((category) => category.id));
        }
        setSelectAllCategories(!selectAllCategories);
    };

    const toggleSelectAllSubCategories = (categoryId) => {
        setSelectionType("subcategory");
        const category = categoryList.rows.find((c) => c.id === categoryId);
        if (!category) return;
        if (selectAllSubCategories) {
            setSelectedSubCategories((prev) => prev.filter((id) => !category?.subCategories?.rows?.some((sc) => sc.id === id)));
            setSelectionType(null);
        } else {
            const newSelected = [
                ...selectedSubCategories,
                ...(category?.subCategories?.rows?.map((sc) => sc.id) || []),
            ];
            setSelectedSubCategories(Array.from(new Set(newSelected)));
        }
        setSelectAllSubCategories(!selectAllSubCategories);
    };

    const cancelMultiDelete = () => {
        setSelectedCategories([]);
        setSelectedSubCategories([]);
        setSelectAllCategories(false);
        setSelectAllSubCategories(false);
        setSelectionType(null);
    };

    const deleteSelectedCategories = async () => {
        setIsLoadingDelete(true);
        if (selectedCategories.length === 0) return;
        const payload = {
            categoryIds: selectedCategories,
            projectId: projectDetailsReducer.id,
        };
        const data = await apiService.articleCategoryBatchUpdate(payload);
        setIsLoadingDelete(false);
        if (data.success) {
            setCategoryList((prev) => ({
                ...prev,
                rows: prev.rows.filter((category) => !selectedCategories.includes(category.id)),
            }));
            setSelectedCategories([]);
            setSelectAllCategories(false);
            setOpenDelete(false);
            setSelectionType(null);
            getAllCategory();
            toast({description: data.message});
            if (categoryList.rows.length === selectedCategories.length && pageNo > 1) {
                setPageNo(pageNo - 1);
            }
        } else {
            toast({description: data.error.message, variant: "destructive"});
        }
    };

    const deleteSelectedSubCategories = async () => {
        setIsLoadingDelete(true);
        if (selectedSubCategories.length === 0) return;
        const payload = {
          subCategoryIds: selectedSubCategories,
          projectId: projectDetailsReducer.id,
        };
        const data = await apiService.articleSubCategoryBatchUpdate(payload);
        setIsLoadingDelete(false);
        if (data.success) {
          setCategoryList(prev => {
            const updatedRows = prev.rows.map(category => {
              const originalSubCount = category?.subCategories?.total || 0;
              const filteredSubs = category?.subCategories?.rows?.filter((sc) => !selectedSubCategories.includes(sc.id)) || [];
              const deletedCount = (category?.subCategories?.rows?.length || 0) - filteredSubs.length;
              return {
                ...category,
                subCategories: {
                  ...category.subCategories,
                  rows: filteredSubs,
                  total: originalSubCount - deletedCount
                }
              };
            });
            return { ...prev, rows: updatedRows };
          });
          setSelectedSubCategories([]);
          setSelectAllSubCategories(false);
          setOpenSubDelete(false);
          setSelectionType(null);
          toast({description: data.message});
          const affectedCategories = categoryList.rows.filter(category => 
            category.subCategories?.rows?.some(sc => selectedSubCategories.includes(sc.id))
          );
          affectedCategories.forEach(category => {
            const currentPage = categoryPages[category.id] || 1;
            const remainingSubCount = (category.subCategories?.total || 0) - 
              selectedSubCategories.filter(id => category.subCategories?.rows?.some(sc => sc.id === id)).length;
            const newTotalPages = Math.ceil(remainingSubCount / perPageLimit);
            if (currentPage > newTotalPages && newTotalPages > 0) {
              setCategoryPages(prev => ({ ...prev, [category.id]: newTotalPages }));
              handleSubCategoryPagination(category.id, newTotalPages);
            }
            else if (currentPage <= newTotalPages) {
              handleSubCategoryPagination(category.id, currentPage);
            }
          });
        } else {
          toast({description: data.error.message, variant: "destructive"});
        }
      };

    const handleBulkDeleteCategories = async (ids) => {
        setIsLoadingDelete(true);
        const payload = {
            categoryIds: ids,
            projectId: projectDetailsReducer.id,
        };
        const data = await apiService.articleCategoryBatchUpdate(payload);
        if (data.success) {
            setIsLoadingDelete(false);
            setCategoryList((prev) => ({
                ...prev,
                rows: prev.rows.filter((item) => !ids.includes(item.id)),
            }));
            setSelectedCategoryIds([]);
            setOpenDelete(false);
            getAllCategory();
            toast({description: data.message});
        } else {
            toast({variant: "destructive", description: data.error.message});
        }
    };

    const handleBulkDeleteSubCategories = async (ids) => {
        setIsLoadingDelete(true);
        const payload = {
            subCategoryIds: ids,
            projectId: projectDetailsReducer.id,
        };
        const data = await apiService.articleSubCategoryBatchUpdate(payload);
        if (data.success) {
            setIsLoadingDelete(false);
            let shouldNavigateToPreviousPage = false;
            setCategoryList((prev) => {
                const updatedRows = prev.rows.map((category) => {
                    const originalSubCount = category?.subCategories?.rows?.length || 0;
                    const filteredSubs = category?.subCategories?.rows?.filter((sc) => !ids.includes(sc.id)) || [];
                    if (originalSubCount > 0 && filteredSubs.length === 0) {
                        shouldNavigateToPreviousPage = true;
                    }
                    return {
                        ...category,
                        subCategories: filteredSubs,
                    };
                });
                return {...prev, rows: updatedRows};
            });
            setSelectedSubCategoryIds([]);
            setOpenSubDelete(false);
            setOpenSubDelete(false);
            if (shouldNavigateToPreviousPage && pageNo > 1) {
                setPageNo(pageNo - 1);
            } else {
                getAllCategory(filter.search);
            }
            
            toast({description: data.message});
        } else {
            toast({variant: "destructive", description: data.error.message});
        }
    };

    const throttledDebouncedSearch = useCallback(
        debounce((value) => {
            getAllCategory(value, filter.categoryId, filter.subCategoryId);
        }, 500),
        [projectDetailsReducer.id]
    );

    const onChangeSearch = (e) => {
        const value = e.target.value;
        setFilter({...filter, search: value});
        throttledDebouncedSearch(value);
    };

    const clearSearchFilter = () => {
        setFilter((prev) => ({...prev, search: ""}));
        setPageNo(1);
        setIsLoading(true);
        getAllCategory("").then(() => {
            setIsLoading(false);
        });
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                return !value || value.trim() === "" ? "Name is required" : "";
            case "slug":
                if (!value || value.trim() === "") {
                    return "Slug is required";
                } else if (value.length > 160) {
                    return "Slug must be less than 160 characters";
                } else {
                    return "";
                }
            case "description":
                const cleanValue = value.trim();
                const textContent = value.replace(/<[^>]+>/g, '').trim();
                const hasImages = value.includes('<img');
                if (!cleanValue || (!textContent && !hasImages)) {
                    return "Description is required.";
                } else {
                    return "";
                }
            default:
                return "";
        }
    };

    const generateSlug = (title) => {
        if (!title) return "";
        const slugBase = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .substring(0, 150); // shorter to leave space for suffix
        const randomNumber = Math.floor(Math.random() * 99) + 1;
        const twoDigit = String(randomNumber).padStart(2, "0");
        return `${slugBase}-${twoDigit}`;
    };

    const generateImageKey = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "#";
        for (let i = 0; i < 8; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const transformDescription = (description, descriptionImages) => {
        if (!description) return {transformedHtml: description, keysToDelete: [], updatedImages: [],};
        const parser = new DOMParser();
        const doc = parser.parseFromString(description, "text/html");
        const images = doc.getElementsByTagName("img");
        const updatedImages = [...descriptionImages];
        const currentImageKeys = [];
        for (let img of images) {
            const imageUrl = img.src;
            if (imageUrl.startsWith("#")) {
                currentImageKeys.push(imageUrl);
                continue;
            }
            if (imageUrl.includes(DO_SPACES_ENDPOINT)) {
                const filename = imageUrl.split("/").pop();
                const existingImage = descriptionImages.find((img) => img.path === filename);
                if (existingImage) {
                    img.src = existingImage.key;
                    currentImageKeys.push(existingImage.key);
                } else {
                    const newKey = generateImageKey();
                    img.src = newKey;
                    updatedImages.push({
                        key: newKey,
                        path: filename,
                        fullPath: `feature-idea/${projectDetailsReducer.id}/${filename}`,
                    });
                    currentImageKeys.push(newKey);
                }
            }
        }
        const deletedImages = descriptionImages.filter((img) => !currentImageKeys.includes(img.key));
        const keysToDelete = deletedImages.map((img) => img.fullPath);
        return {
            transformedHtml: doc.body.innerHTML,
            keysToDelete,
            updatedImages: updatedImages.filter((img) => currentImageKeys.includes(img.key)),
        };
    };

    const deleteImages = async (keysToDelete) => {
        if (keysToDelete.length === 0) return;
        const payload = {keys: keysToDelete};
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {
        } else {
            toast({description: response.error?.message || "Failed to delete images", variant: "destructive",});
        }
    };

    const addCategory = async (imagesToDelete = []) => {
        const trimmedTitle = selectedCategory.title ? selectedCategory.title.trim() : "";
        const trimmedDescription = selectedCategory.description ? selectedCategory.description.trim() : "";

        let validationErrors = {};
        Object.keys(selectedCategory).forEach((name) => {
            const error = formValidate(name, selectedCategory[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (imageSizeError) {
            validationErrors.imageSizeError = imageSizeError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }

        const updatedIdea = {
            ...selectedCategory,
            title: trimmedTitle,
            description: trimmedDescription,
            slug: generateSlug(trimmedTitle),
        };
        setSelectedCategory(updatedIdea);

        setCategoryEdit(true);
        const {transformedHtml, keysToDelete, updatedImages} = transformDescription(selectedCategory.description, selectedCategory.descriptionImages || []);
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete.map((img) => img.fullPath),]),];
        let formData = new FormData();
        formData.append("projectId", projectDetailsReducer.id);
        formData.append("title", selectedCategory.title);
        formData.append("slug", updatedIdea.slug);
        formData.append("description", transformedHtml);
        formData.append(`image`, selectedCategory.image);
        if (updatedImages && updatedImages.length > 0) {
            formData.append("descriptionImages",
                JSON.stringify(updatedImages.map((img) => ({key: img.key, path: img.path,})))
            );
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.createCategory(formData);
        if (data.success) {
            setSelectedCategory(initialState);
            let clone = [...categoryList.rows];
            clone.unshift(data.data);
            setCategoryList(clone);
            setImageSizeError("");
            toast({description: data.message});
        } else {
            toast({description: data?.error.message, variant: "destructive"});
        }
        setCategoryEdit(false);
        closeSheetCategory(true);
    };

    const addSubCategory = async (imagesToDelete = []) => {
        const trimmedTitle = selectedSubCategory.title ? selectedSubCategory.title.trim() : "";
        const trimmedDescription = selectedSubCategory.description ? selectedSubCategory.description.trim() : "";
        const updatedIdea = {
            ...selectedSubCategory,
            title: trimmedTitle,
            description: trimmedDescription,
            slug: generateSlug(trimmedTitle),
        };
        setSelectedSubCategory(updatedIdea);
        let validationErrors = {};
        Object.keys(selectedSubCategory).forEach((name) => {
            const error = formValidate(name, selectedSubCategory[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (imageSizeError) {
            validationErrors.imageSizeError = imageSizeError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        setSubCategoryLoadingStates(prev => ({ ...prev, [subCategoryId]: true }));
        setSubCategoryEdit(true);
        const {transformedHtml, keysToDelete, updatedImages} = transformDescription(selectedSubCategory.description, selectedSubCategory.descriptionImages || []);
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete.map((img) => img.fullPath),]),];
        let formData = new FormData();
        formData.append("projectId", projectDetailsReducer.id);
        formData.append("categoryId", subCategoryId);
        formData.append("title", selectedSubCategory.title);
        formData.append("slug", selectedSubCategory.slug);
        formData.append("description", transformedHtml);
        formData.append(`image`, selectedSubCategory.image);
        if (updatedImages && updatedImages.length > 0) {
            formData.append("descriptionImages",
                JSON.stringify(updatedImages.map((img) => ({key: img.key, path: img.path,})))
            );
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.createSubCategory(formData);
        if (data.success) {
            setSubCategoryLoadingStates(prev => ({ ...prev, [subCategoryId]: false }));
            setCategoryPages(prev => ({ 
                ...prev, 
                [subCategoryId]: 1
              }));
            setCategoryList(prev => {
                const updatedRows = prev.rows.map(category => {
                    if (category.id === subCategoryId) {
                        const existingSubCategories = category.subCategories || { rows: [], total: 0 };
                        const currentPage = categoryPages[category.id] || 1;
                        if (currentPage === 1 && existingSubCategories.rows.length < perPageLimit) {
                            const updatedSubCategories = {
                                ...existingSubCategories,
                                rows: [data.data, ...existingSubCategories.rows],
                                total: existingSubCategories.total + 1
                            };
                            return { ...category, subCategories: updatedSubCategories };
                        } else {
                            const updatedSubCategories = {
                                ...existingSubCategories,
                                total: existingSubCategories.total + 1
                            };
                            return { ...category, subCategories: updatedSubCategories };
                        }
                    }
                    return category;
                });
                return { ...prev, rows: updatedRows };
            });
            setSelectedSubCategory(initialState);
            setImageSizeError("");
            toast({description: data.message});
            // closeSheetSubCategory(true);
            closeSheetSubCategory();
            handleSubCategoryPagination(subCategoryId, 1);
        } else {
            toast({description: data?.error.message, variant: "destructive"});
        }
        setSubCategoryEdit(false);
    };

    const transformDescriptionUpdate = (description, descriptionImages) => {
        if (!description) return {transformedHtml: description, keysToDelete: [], updatedImages: [],};

        const parser = new DOMParser();
        const doc = parser.parseFromString(description, "text/html");
        const images = doc.getElementsByTagName("img");
        const updatedImages = [...descriptionImages];
        const currentImageKeys = [];
        const keysToDelete = [];

        for (let img of images) {
            const imageUrl = img.src;
            if (imageUrl.startsWith("#")) {
                currentImageKeys.push(imageUrl);
                const existingImg = descriptionImages.find(
                    (imgObj) => imgObj.key === imageUrl
                );
                if (existingImg) {
                    updatedImages.push(existingImg);
                }
            } else if (imageUrl.includes(DO_SPACES_ENDPOINT)) {
                const filename = imageUrl.split("/").pop();
                const existingImg = descriptionImages.find(
                    (imgObj) =>
                        imgObj.path.includes(filename) ||
                        imgObj.fullPath?.includes(filename)
                );
                if (existingImg) {
                    img.src = existingImg.key;
                    currentImageKeys.push(existingImg.key);
                } else {
                    const newKey = generateImageKey();
                    img.src = newKey;
                    updatedImages.push({
                        key: newKey,
                        path: filename,
                        fullPath: `feature-idea/${projectDetailsReducer.id}/${filename}`,
                    });
                    currentImageKeys.push(newKey);
                }
            }
        }

        const deletedImages = descriptionImages.filter((img) => !currentImageKeys.includes(img.key));
        keysToDelete.push(...deletedImages.map((img) => img.fullPath));

        return {
            transformedHtml: doc.body.innerHTML,
            keysToDelete,
            updatedImages: updatedImages.filter((img) => currentImageKeys.includes(img.key)),
        };
    };

    const deleteImagesUpdate = async (keysToDelete) => {
        const payload = {
            keys: keysToDelete
                .map((key) => (key?.fullPath ? key?.fullPath : key?.path))
                .filter((path) => path),
        };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {
        } else {
            toast({description: response.error?.message || "Failed to delete images", variant: "destructive",});
        }
    };

    const updateCategory = async (imagesToDelete = [], name, value) => {
        const trimmedTitle = selectedCategory.title ? selectedCategory.title.trim() : "";
        const trimmedDescription = selectedCategory.description ? selectedCategory.description.trim() : "";
        const updatedIdea = {
            ...selectedCategory,
            title: trimmedTitle,
            description: trimmedDescription,
            slug: generateSlug(trimmedTitle),
        };
        setSelectedCategory(updatedIdea);
        let validationErrors = {};
        Object.keys(selectedCategory).forEach((name) => {
            const error = formValidate(name, selectedCategory[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (imageSizeError) {
            validationErrors.imageSizeError = imageSizeError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        if (name === "deleteImage") {
            setSelectedCategory({...selectedCategory, image: ""});
        } else {
            setSelectedCategory({...selectedCategory, [name]: value});
        }
        setCategoryEdit(true);
        let formData = new FormData();
        formData.append("projectId", projectDetailsReducer.id);
        formData.append("title", selectedCategory.title);
        formData.append("slug", selectedCategory.slug);
        const {transformedHtml, keysToDelete} = transformDescriptionUpdate(
            selectedCategory.description,
            selectedCategory.descriptionImages || []
        );
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete]),].filter((key) => key !== null && key !== undefined && key !== "");
        formData.append("description", transformedHtml);
        const imagesToSend = selectedCategory.descriptionImages?.map((img) => ({
            key: img.key,
            path: img.path.includes("/") ? img.path.split("/").pop() : img.path,
        }));
        formData.append("descriptionImages", JSON.stringify(imagesToSend));
        if (selectedCategory?.image === "") {
            formData.append("deleteImage", true);
        } else if (selectedCategory.image instanceof File) {
            formData.append("image", selectedCategory.image);
        }
        if (allKeysToDelete.length > 0) {
            await deleteImagesUpdate(allKeysToDelete);
        }
        const data = await apiService.updateCategory(formData, selectedCategory.id);
        if (data.success) {
            let clone = [...categoryList.rows];
            const index = clone.findIndex((x) => x.id === selectedCategory.id);
            if (index !== -1) {

                const originalSubCategories = clone[index]?.subCategories || { rows: [], total: 0 };
                clone[index] = { ...data.data, subCategories: originalSubCategories };
                setCategoryList({rows: clone, total: categoryList.total});
                setImageSizeError("");
                toast({description: data.message});
            } else {
                toast({description: data.error.message, variant: "destructive"});
            }
        }
        setCategoryEdit(false);
        setSheetOpen(false);
    };

    const updateSubCategory = async (imagesToDelete = [], name, value) => {
        const trimmedTitle = selectedSubCategory.title ? selectedSubCategory.title.trim() : "";
        const trimmedDescription = selectedSubCategory.description ? selectedSubCategory.description.trim() : "";
        const updatedIdea = {
            ...selectedSubCategory,
            title: trimmedTitle,
            description: trimmedDescription,
            slug: generateSlug(trimmedTitle),
        };
        setSelectedSubCategory(updatedIdea);
        let validationErrors = {};
        Object.keys(selectedSubCategory).forEach((name) => {
            const error = formValidate(name, selectedSubCategory[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (imageSizeError) {
            validationErrors.imageSizeError = imageSizeError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        if (name === "deleteImage") {
            setSelectedSubCategory({...selectedSubCategory, image: ""});
        } else {
            setSelectedSubCategory({...selectedSubCategory, [name]: value});
        }
        setSubCategoryLoadingStates(prev => ({ ...prev, [subCategoryId]: true }));
        setSubCategoryEdit(true);
        let formData = new FormData();
        formData.append("projectId", projectDetailsReducer.id);
        formData.append("categoryId", selectedSubCategory.categoryId);
        formData.append("title", selectedSubCategory.title);
        formData.append("slug", selectedSubCategory.slug);
        const {transformedHtml, keysToDelete} = transformDescriptionUpdate(
            selectedSubCategory.description,
            selectedSubCategory.descriptionImages || []
        );
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete]),].filter((key) => key !== null && key !== undefined && key !== "");
        formData.append("description", transformedHtml);
        const imagesToSend = selectedSubCategory.descriptionImages?.map((img) => ({
            key: img.key,
            path: img.path.includes("/") ? img.path.split("/").pop() : img.path,
        }));
        formData.append("descriptionImages", JSON.stringify(imagesToSend));
        if (selectedSubCategory?.image === "") {
            formData.append("deleteImage", true);
        } else if (selectedSubCategory.image instanceof File) {
            formData.append("image", selectedSubCategory.image);
        }
        if (allKeysToDelete.length > 0) {
            await deleteImagesUpdate(allKeysToDelete);
        }
        const data = await apiService.updateSubCategory(formData, selectedSubCategory.id);
        if (data.success) {
            setSubCategoryLoadingStates(prev => ({ ...prev, [subCategoryId]: false }));
            let clone = [...categoryList.rows];
            const index = clone.findIndex((x) => x.id == selectedSubCategory.categoryId);
            if (index !== -1) {
                const existingSubCategories = clone[index]?.subCategories || { rows: [], total: 0 };
                const subIndex = existingSubCategories.rows.findIndex((sub) => sub.id === selectedSubCategory.id);
                if (subIndex !== -1) {
                    const updatedRows = [...existingSubCategories.rows];
                    updatedRows[subIndex] = data.data;
                    clone[index] = {
                        ...clone[index], 
                        subCategories: {
                            ...existingSubCategories,
                            rows: updatedRows
                        }
                    };
                    setCategoryList({rows: clone, total: categoryList.total});
                }
                setImageSizeError("");
                toast({description: data.message});
                const currentPage = categoryPages[subCategoryId] || 1;
                handleSubCategoryPagination(subCategoryId, currentPage);
                // closeSheetSubCategory(true);
                closeSheetSubCategory();
            } else {
                toast({description: data.error.message, variant: "destructive"});
            }
        }
        setSubCategoryEdit(false);
        setSheetOpenSub(false);
    };

    const openSheetCategory = (id, data) => {
        const updatedData = {
            ...data,
            deleteImage: data?.image ? data.image : "",
            descriptionImages: Array.isArray(data?.descriptionImages) ? data?.descriptionImages : [],
            slug: data?.slug || "",
        };
        setSelectedCategory(id ? updatedData : initialState);
        navigate(`${baseUrl}/help/category`);
        setSheetOpen(true);
    };

    const openSheetSubCategory = (id, data) => {
        const updatedData = {
            ...data,
            deleteImage: data?.image ? data.image : "",
            descriptionImages: Array.isArray(data?.descriptionImages) ? data?.descriptionImages : [],
            slug: data?.slug || "",
        };
        setSelectedSubCategory(id ? updatedData : initialState);
        navigate(`${baseUrl}/help/category`);
        setSheetOpenSub(true);
        setSubCategoryId(data?.categoryId);
    };

    const closeSheetCategory = (callApi = false) => {
        setSheetOpen(false);
        setSelectedCategory(initialState);
        navigate(`${baseUrl}/help/category?pageNo=${pageNo}`);
        setFormError(initialStateError);
        setImageSizeError("");
        if (callApi) {
            setIsLoading(true);
            getAllCategory();
        }
    };

    const closeSheetSubCategory = (callApi = false) => {
        setSheetOpenSub(false);
        setSelectedSubCategory(initialState);
        navigate(`${baseUrl}/help/category?pageNo=${pageNo}`);
        setFormError(initialStateError);
        setImageSizeError("");
        // if (callApi) {
        //     getAllCategory();
        // }
    };

    const handleImageUpload = (file) => {
        const selectedFile = file.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                // 5 MB
                setFormError((prevErrors) => ({
                    ...prevErrors,
                    image: "Image size must be less than 5 MB.",
                }));
            } else {
                setFormError((prevErrors) => ({
                    ...prevErrors,
                    image: "",
                }));
                setSelectedCategory({
                    ...selectedCategory,
                    image: selectedFile,
                });
            }
        }
    };

    const handleImageUploadSub = (file) => {
        const selectedFile = file.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                // 5 MB
                setFormError((prevErrors) => ({
                    ...prevErrors,
                    image: "Image size must be less than 5 MB.",
                }));
            } else {
                setFormError((prevErrors) => ({
                    ...prevErrors,
                    image: "",
                }));
                setSelectedSubCategory({
                    ...selectedSubCategory,
                    image: selectedFile,
                });
            }
        }
    };

    const deleteRow = (id) => {
        if (id === "bulk" && selectedCategoryIds.length > 0) {
            setDeleteType("bulk");
            setOpenDelete(true);
        } else {
            setIdToDelete(id);
            setDeleteType("single");
            setOpenDelete(true);
        }
    };

    const onBulkDelete = () => {
        if (selectedCategories.length > 0) setOpenDelete(true);
        if (selectedSubCategories.length > 0) setOpenSubDelete(true);
    };

    const onToggleAllCheckbox = () => {
        if (selectedCategories.length > 0) {
            setSelectionType("category");
            toggleSelectAllCategories();
        }
        if (selectedSubCategories.length > 0) {
            setSelectionType("subcategory");
            const categoryId = categoryList.rows.find((c) =>
                c.subCategories?.rows?.some((sc) => selectedSubCategories.includes(sc.id))
            )?.id;
            if (categoryId) toggleSelectAllSubCategories(categoryId);
        }
    };

    const deleteSubRow = (id) => {
        if (id === "bulk" && selectedSubCategoryIds.length > 0) {
            setDeleteType("bulk");
            setOpenSubDelete(true);
        } else {
            setSubIdToDelete(id);
            setDeleteType("single");
            setOpenSubDelete(true);
        }
    };

    const deleteCategory = async () => {
        if (deleteType === "bulk") {
            await handleBulkDeleteCategories(selectedCategoryIds);
        } else {
            setIsLoadingDelete(true);
            const data = await apiService.deleteCategories(idToDelete);
            if (data.success) {
                const clone = [...categoryList.rows];
                const index = clone.findIndex((x) => x.id == idToDelete);
                if (index !== -1) {
                    clone.splice(index, 1);
                    setCategoryList({rows: clone, total: categoryList.total - 1});
                    if (clone.length === 0 && pageNo > 1) {
                        handlePaginationClick(pageNo - 1);
                    } else {
                        getAllCategory();
                    }
                }
                toast({description: data.message});
            } else {
                toast({description: data.error.message, variant: "destructive"});
            }
            setIsLoadingDelete(false);
        }
        setOpenDelete(false);
    };

    const deleteSubCategory = async () => {
        if (deleteType === "bulk") {
          await handleBulkDeleteSubCategories(selectedSubCategoryIds);
        } else {
          setIsLoadingDelete(true);
          const data = await apiService.deleteSubCategories(subIdToDelete);
          if (data.success) {
            setCategoryList(prev => {
              const updatedRows = prev.rows.map(category => {
                const subIndex = category?.subCategories?.rows?.findIndex(
                  (sub) => sub.id === subIdToDelete
                );
                if (subIndex !== -1) {
                  const updatedRows = [...category.subCategories.rows];
                  updatedRows.splice(subIndex, 1);
                  return {
                    ...category,
                    subCategories: {
                      ...category.subCategories,
                      rows: updatedRows,
                      total: (category.subCategories.total || 1) - 1
                    }
                  };
                }
                return category;
              });
              return {...prev, rows: updatedRows};
            });
            
            const parentCategory = categoryList.rows.find(category => 
              category.subCategories?.rows?.some(sc => sc.id === subIdToDelete)
            );
            
            if (parentCategory) {
              const currentPage = categoryPages[parentCategory.id] || 1;
              const remainingSubCount = (parentCategory.subCategories?.total || 0) - 1;
              const newTotalPages = Math.ceil(remainingSubCount / perPageLimit);
              if (currentPage > newTotalPages && newTotalPages > 0) {
                setCategoryPages(prev => ({ ...prev, [parentCategory.id]: newTotalPages }));
                handleSubCategoryPagination(parentCategory.id, newTotalPages);
              } else {
                handleSubCategoryPagination(parentCategory.id, currentPage);
              }
            }
            
            setOpenSubDelete(false);
            toast({description: data.message});
          } else {
            toast({description: data.error.message, variant: "destructive"});
          }
          setIsLoadingDelete(false);
        }
        setOpenSubDelete(false);
      };

    const totalPages = Math.ceil(totalRecord / perPageLimit);

    const handlePaginationClick = async (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setIsLoading(true);
            setPageNo(newPage);
            setSelectedCategories([]);
            setSelectedSubCategories([]);
            setSelectionType(null);
        } else {
            setIsLoading(false);
        }
    };

    const onDragEndCategory = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categoryList.rows.findIndex((c) => c.id === active.id);
    const newIndex = categoryList.rows.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
        const basePosition = (pageNo - 1) * perPageLimit;
        const updated = arrayMove(categoryList.rows, oldIndex, newIndex);
        setCategoryList((prev) => ({ ...prev, rows: updated }));

        const payload = {
            positions: updated.map((item, index) => ({
                id: item.id,
                position: basePosition + index + 1
            })),
            projectId: projectDetailsReducer.id
        };

        const data = await apiService.updatePositionCategory(payload);
        if (data.success) {
            toast({ description: data.message || "Category order updated successfully." });
            getAllCategory();
        } else {
            setCategoryList((prev) => ({ ...prev, rows: categoryList.rows }));
            toast({ description: data.error.message, variant: "destructive" });
        }
    }
};

    const onDragEndSubCategory = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const updatedRows = [...categoryList.rows];
        let movedSubCategories = [];
        let updatedCategoryIndex = null;
        let parentCategoryId = null;
        for (let i = 0; i < updatedRows.length; i++) {
            const subIndex = updatedRows[i].subCategories?.rows?.findIndex((s) => s.id === active.id);
            if (subIndex !== -1) {
                const subs = updatedRows[i].subCategories.rows;
                const oldIndex = subs.findIndex((s) => s.id === active.id);
                const newIndex = subs.findIndex((s) => s.id === over.id);
                movedSubCategories = arrayMove(subs, oldIndex, newIndex);
                updatedRows[i].subCategories.rows = movedSubCategories;
                updatedCategoryIndex = i;
                parentCategoryId = updatedRows[i].id;
                break;
            }
        }
        setCategoryList((prev) => ({ ...prev, rows: updatedRows }));
        const currentPage = categoryPages[parentCategoryId] || 1;
        const basePosition = (currentPage - 1) * perPageLimit;
        const payload = {
            positions: movedSubCategories.map((item, index) => ({ 
                id: item.id, 
                position: basePosition + index + 1 
            })),
        };
        const data = await apiService.updatePositionSubCategory(payload);
        if (data.success) {
            toast({ description: data.message });
        } else {
            setCategoryList((prev) => ({ ...prev, rows: categoryList.rows }));
            toast({ description: data.error.message, variant: "destructive" });
        }
    };

    const renderOpenSheet = (isSubCategory = false) => {
        const sheetOpen = isSubCategory ? isSheetOpenSub : isSheetOpen;
        // const onOpenChange = isSubCategory ? (isSheetOpenSub ? () => closeSheetSubCategory(false) : openSheetSubCategory) : (isSheetOpen ? () => closeSheetCategory(false) : openSheetCategory);
        const onOpenChange = isSubCategory ? (isSheetOpenSub ? () => closeSheetSubCategory() : openSheetSubCategory) : (isSheetOpen ? () => closeSheetCategory() : openSheetCategory);
        return (
            <Sheet open={sheetOpen} onOpenChange={onOpenChange}>
                <SheetContent className={"sm:max-w-[662px] p-0"}>
                    <SheetHeader className={"px-3 py-4 lg:px-8 lg:py-[20px] flex flex-row justify-between items-center border-b space-y-0"}>
                        <DialogTitle className={"text-lg md:text-xl font-medium capitalize"}>
                            {isSubCategory ? (selectedSubCategory?.id ? "Update Sub Category" : "Create Sub Category") : (selectedCategory?.id ? "Update Category" : "Create Category")}
                        </DialogTitle>
                        <span className={"max-w-[24px]"}>
                            {
                                // isSubCategory ? <X onClick={() => closeSheetSubCategory(false)} className={"cursor-pointer m-0"}/> :
                                isSubCategory ? <X onClick={() => closeSheetSubCategory()} className={"cursor-pointer m-0"}/> :
                                <X onClick={() => closeSheetCategory(false)} className={"cursor-pointer m-0"}/>
                            }
                        </span>
                    </SheetHeader>
                    <div className={"h-[calc(100vh_-_61px)] overflow-y-auto"}>
                        <CategoryForm
                            selectedData={isSubCategory ? selectedSubCategory : selectedCategory}
                            setSelectedData={isSubCategory ? setSelectedSubCategory : setSelectedCategory}
                            formError={formError}
                            setFormError={setFormError}
                            handleImageUpload={isSubCategory ? handleImageUploadSub : handleImageUpload}
                            handleSubmit={isSubCategory ? (selectedSubCategory?.id ? updateSubCategory : addSubCategory) : (selectedCategory?.id ? updateCategory : addCategory)}
                            isLoading={isSubCategory ? subCategoryEdit : categoryEdit}
                            closeSheet={isSubCategory ? closeSheetSubCategory : closeSheetCategory}
                            saveTitle={"Save"}
                            className={"w-[56px]"}
                            setImageSizeError={setImageSizeError}
                            imageSizeError={imageSizeError}
                            formValidate={formValidate}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Fragment>
            {isSheetOpen && (
                renderOpenSheet()
            )}

            {isSheetOpenSub && (
                renderOpenSheet(true)
            )}

            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                {openDelete && (
                    <DeleteDialog
                        title={
                            selectedCategories.length > 0
                                ? `Delete ${selectedCategories.length} ${
                                    selectedCategories.length > 1 ? "Categories" : "Category"
                                }`
                                : "You really want to delete this Category?"
                        }
                        isOpen={openDelete}
                        onOpenChange={() => setOpenDelete(false)}
                        onDelete={selectedCategories.length > 0 ? deleteSelectedCategories : deleteCategory}
                        isDeleteLoading={isLoadingDelete}
                        deleteRecord={selectedCategories.length > 0 ? selectedCategories : idToDelete}
                    />
                )}

                {openSubDelete && (
                    <DeleteDialog
                        title={
                            selectedSubCategories.length > 0
                                ? `Delete ${selectedSubCategories.length} ${
                                    selectedSubCategories.length > 1
                                        ? "Sub Categories"
                                        : "Sub Category"
                                }`
                                : "You really want to delete this Sub Category?"
                        }
                        isOpen={openSubDelete}
                        onOpenChange={() => setOpenSubDelete(false)}
                        onDelete={selectedSubCategories.length > 0 ? deleteSelectedSubCategories : deleteSubCategory}
                        isDeleteLoading={isLoadingDelete}
                        deleteRecord={selectedSubCategories.length > 0 ? selectedSubCategories : subIdToDelete}
                    />
                )}

                <div className={"flex items-center justify-between flex-wrap gap-2"}>
                    <div className={"flex flex-col flex-1 gap-y-0.5"}>
                        <h1 className={"text-2xl font-normal flex-initial w-auto"}>All Category ({totalRecord})</h1>
                        <p className={"text-sm text-muted-foreground"}>
                            Organize your articles into categories and sub-categories to
                            improve navigation and help users quickly find relevant
                            information.
                        </p>
                    </div>
                    <div className={"w-full lg:w-auto flex flex-wrap sm:flex-nowrap gap-2 items-center"}>
                        <div className={"flex gap-2 items-center w-full lg:w-auto"}>
                            <CommSearchBar
                                value={filter.search}
                                onChange={onChangeSearch}
                                onClear={clearSearchFilter}
                                placeholder="Search..."
                            />
                            <Button onClick={() => {
                                resetSelections();
                                openSheetCategory("", "")
                            }} className={"gap-2 font-medium hover:bg-primary"}>
                                <Plus size={20} strokeWidth={3}/>
                                <span className={"text-xs md:text-sm font-medium"}>New Category</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {(selectedCategories.length > 0 || selectedSubCategories.length > 0) && (
                    <div className="flex items-center flex-wrap gap-1 justify-between p-4 bg-gray-50 rounded-lg mt-4">
                        <div className="flex items-center space-x-4">
                            <Checkbox
                                checked={selectAllCategories || selectAllSubCategories}
                                onCheckedChange={onToggleAllCheckbox}
                                disabled={
                                    (selectionType === "category" &&
                                        selectedSubCategories.length > 0) ||
                                    (selectionType === "subcategory" &&
                                        selectedCategories.length > 0)
                                }
                            />
                            <span>{selectedCategories.length + selectedSubCategories.length}{" "}selected</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={cancelMultiDelete}>Cancel</Button>
                            <Button variant="destructive" onClick={onBulkDelete} disabled={isLoadingDelete}>
                                {isLoadingDelete ? "Deleting..." : "Delete Selected"}
                            </Button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className={"mt-6"}>
                        <Card>
                            <CardContent className={"p-0"}>
                                <div className={"rounded-md grid grid-cols-1 overflow-auto whitespace-nowrap"}>
                                    <Table>
                                        <TableHeader className={`bg-muted py-8 px-5`}>
                                            <TableRow>
                                                <TableHead className="px-2 py-[10px] md:px-3 w-[40px]" />
                                                <TableHead className="px-2 py-[10px] md:px-3 w-[40px]">
                                                    <Checkbox
                                                        checked={selectAllCategories}
                                                        onCheckedChange={toggleSelectAllCategories}
                                                        disabled={selectionType === "subcategory"}
                                                    />
                                                </TableHead>
                                                {["Title", "Articles", "Created At", "Actions"].map(
                                                    (x, i) => {
                                                        return (
                                                            <TableHead key={i} className={`font-medium text-card-foreground px-2 py-[10px] md:px-3 max-w-[300px]`}>
                                                                {x}
                                                            </TableHead>
                                                        );
                                                    }
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!isLoading ? (
                                                <Fragment>
                                                    {[...Array(10)].map((_, index) => (
                                                        <TableRow key={index}>
                                                            {[...Array(6)].map((_, i) => (
                                                                <TableCell key={i} className={"max-w-[373px] px-2 py-[10px] md:px-3"}>
                                                                    <Skeleton className={"rounded-md w-full h-7"}/>
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </Fragment>
                                            ) : (
                                                <TableRow className={"hover:bg-transparent"}>
                                                    <TableCell colSpan={6}><EmptyData/></TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : categoryList?.rows?.length > 0 ? (<div className="overflow-hidden"><DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={onDragEndCategory}
                        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        autoScroll={false}
                    >
                        <SortableContext
                            items={categoryList.rows.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {categoryList?.rows?.map((category) => (
                                <SortableCategoryRow
                                    key={category.id}
                                    category={category}
                                    onDragEndSubCategory={onDragEndSubCategory}
                                    toggleSelectSubCategory={toggleSelectSubCategory}
                                    selectedSubCategories={selectedSubCategories}
                                    selectionType={selectionType}
                                    openSheetSubCategory={openSheetSubCategory}
                                    deleteSubRow={deleteSubRow}
                                    deleteRow={deleteRow}
                                    initialState={initialState}
                                    openSheetCategory={openSheetCategory}
                                    toggleSelectCategory={toggleSelectCategory}
                                    selectedCategories={selectedCategories}
                                    resetSelections={resetSelections}
                                    isLoadingSubCate={subCategoryLoadingStates[category.id] || false}
                                    handleSubCategoryPagination={handleSubCategoryPagination}
                                    categoryPages={categoryPages}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    </div>
                ) : (
                    <Card className={"my-6"}>
                        <EmptyData emptyIcon={Icon.allCategoryEmpty} children={"No categories created yet"}/>
                    </Card>
                )}
                {categoryList?.rows?.length > 0 ? (
                    <div className={`${isLoading ? "hidden" : ""}`}>
                        <Card>
                            {categoryList?.rows?.length > 0 ? (
                                <Pagination
                                    pageNo={pageNo}
                                    totalPages={totalPages}
                                    isLoading={isLoading}
                                    handlePaginationClick={handlePaginationClick}
                                    stateLength={categoryList?.rows?.length}
                                />
                            ) : ("")}
                        </Card>
                    </div>
                ) : ("")}
                {isLoading || !emptyContentBlock ? ("") : (
                    <EmptyDataContent
                        data={EmptyInCategoryContent}
                        onClose={() => emptyContent(false)}
                        setSheetOpenCreate={() => openSheetCategory("", "")}
                        cookieName="hideCategoryEmptyContent"
                    />
                )}
            </div>
        </Fragment>
    );
};

export default Category;
