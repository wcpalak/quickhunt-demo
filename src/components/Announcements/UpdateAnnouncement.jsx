import React, { useEffect, useState, Fragment, useRef } from 'react';
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import ReactQuillEditor from "../Comman/ReactQuillEditor";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { BarChart, CalendarIcon, Check, ChevronRight, Circle, Loader2, Pin, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "../ui/use-toast";
import { apiService, baseUrl, DO_SPACES_ENDPOINT, isContentEmpty, restoreImagePaths } from "../../utils/constent";
import { Checkbox } from "../ui/checkbox";
import { Command, CommandEmpty, CommandItem, CommandInput, CommandGroup, CommandList } from "../ui/command";
import { Card } from "../ui/card";
import CommonBreadCrumb from "../Comman/CommonBreadCrumb";
import PlanBadge from "../Comman/PlanBadge";
import { Icon } from "../../utils/Icon";
import DeleteDialog from "../Comman/DeleteDialog";
import ImageUploader from "../Comman/ImageUploader";
import dayjs from "dayjs";
import ChangeLogAiModal from './AI/ChangeLogAiModal';
import ProPlanModal from '../Comman/ProPlanModal';
import { useTheme } from "../theme-provider";
import { useWindowSize } from '../../utils/constent';

const initialState = {
    description: "",
    descriptionImages: [],
    slug: "",
    title: "",
    publishedAt: dayjs(new Date()),
    assignToId: [],
    pinTop: 0,
    expiredBoolean: 0,
    expiredAt: undefined,
    categoryId: "",
    labelId: [],
    image: "",
};

const initialStateError = { title: "", description: "", slug: "", categoryId: "", }

const UpdateAnnouncement = () => {
    const location = useLocation();
    const UrlParams = new URLSearchParams(location.search);
    const getPageNo = UrlParams.get("pageNo") || 1;
    const { id } = useParams();
    const {onProModal} = useTheme()
    const navigate = useNavigate();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const userDetailsReducer = useSelector((state) => state.userDetailsReducer);

    const [changeLogDetails, setChangeLogDetails] = useState(initialState);
    const [formError, setFormError] = useState(initialStateError);
    const [selectedRecord, setSelectedRecord] = useState({});
    const [labelList, setLabelList] = useState([]);
    const [memberList, setMemberList] = useState([])
    const [categoriesList, setCategoriesList] = useState([])
    const [isLoad, setIsLoad] = useState('')
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverOpenExpired, setPopoverOpenExpired] = useState(false);
    const [oldSelectedAnnouncement, setOldSelectedAnnouncement] = useState({});
    const [imageSizeError, setImageSizeError] = useState('');
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [openLabelsPopover, setOpenLabelsPopover] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [sendEmail, setSendEmail] = useState(false);
    const [canSendEmail, setCanSendEmail] = useState(false);
    const [openWriteWithAI, setOpenWriteWithAI] = useState(false);
    const [isHideAiButton, setIsHideAiButton] = useState(false);
    const scrollContainerRef = useRef(null);
    const { width } = useWindowSize();
    useEffect(() => {
        if (projectDetailsReducer.id) {
            if (id !== "new") {
                getSinglePosts();
            }
            setChangeLogDetails({ ...changeLogDetails, assignToId: [userDetailsReducer.id.toString()], });
            setLabelList(allStatusAndTypes.labels);
            setMemberList(allStatusAndTypes.members);
            setCategoriesList(allStatusAndTypes.categories);
        }
    }, [projectDetailsReducer.id, allStatusAndTypes,])

    const getSinglePosts = async () => {
        const data = await apiService.getSinglePosts(id);
        if (data.success) {
            const obj = {
                ...data.data.data,
                featureImage: data.data?.data?.featureImage,
                descriptionImages: Array.isArray(data.data.data.descriptionImages) ? data.data.data.descriptionImages : [],
                assignToId: data.data?.data?.assignToId?.toString() || '',
                publishedAt: data.data?.data?.publishedAt ? dayjs(data.data?.data?.publishedAt).format('YYYY-MM-DD') : dayjs(new Date()),
                expiredAt: data.data?.data?.expiredAt ? dayjs(data.data?.data?.expiredAt).format('YYYY-MM-DD') : undefined,
                categoryId: data.data?.data?.categoryId?.toString() || '',
                labels: data.data?.data?.labels || [],
            }
            setSelectedRecord(obj);
            setOldSelectedAnnouncement(obj);
        }
    }

    const handleFileChange = (file) => {
        const selectedFile = file.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setFormError(prevErrors => ({ ...prevErrors, featureImage: 'Image size must be less than 5 MB.' }));
            } else {
                setFormError(prevErrors => ({ ...prevErrors, featureImage: '' }));
                setSelectedRecord({ ...selectedRecord, featureImage: selectedFile });
            }
        }
    };

    const handleFileChangeCreate = (file) => {
        const selectedFile = file.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setFormError((prevErrors) => ({ ...prevErrors, image: "Image size must be less than 5 MB.", }));
            } else {
                setFormError((prevErrors) => ({ ...prevErrors, image: "", }));
                setChangeLogDetails({ ...changeLogDetails, image: selectedFile, });
            }
        }
    };

    const onDeleteImg = async (name, value) => {
        if (selectedRecord?.featureImage?.name) {
            setSelectedRecord(prev => {
                const { deleteImage, ...rest } = prev;
                return { ...rest, featureImage: "" };
            });
        } else if (selectedRecord?.featureImage) {
            setSelectedRecord({ ...selectedRecord, featureImage: "", deleteImage: value });
        } else {
            setSelectedRecord(prev => {
                const { deleteImage, ...rest } = prev;
                return rest;
            });
        }
    }

    const onDeleteImgCreate = async (name, value) => {
        if (changeLogDetails && changeLogDetails?.image && changeLogDetails.image?.name) {
            setChangeLogDetails({ ...changeLogDetails, image: "" });
        } else {
            setChangeLogDetails({ ...changeLogDetails, [name]: value, image: "" });
        }
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Title is required.";
                } else {
                    return "";
                }
            case "slug":
                if (!value || value.trim() === "") {
                    return "Slug is required.";
                } else {
                    return "";
                }
            case "description":
                if (isContentEmpty(value)) {
                    return "Description is required.";
                } else {
                    return "";
                }
            case "image":
                if (value && value.size > 5 * 1024 * 1024) {
                    // 5 MB
                    return "Image size must be less than 5 MB.";
                } else {
                    return "";
                }
            case "featureImage":
                if (value && value.size > 5 * 1024 * 1024) { // 5 MB
                    return "Image size must be less than 5 MB.";
                } else {
                    return "";
                }
            case "expiredAt":
                if (id === "new" ? (changeLogDetails.expiredBoolean === 1 && (!value)) : (selectedRecord.expiredBoolean === 1 && (!value || value === undefined))) {
                    return "Please select an expiration date.";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onChangeText = (event) => {
        const { name, value } = typeof event === 'object' && event.target ? event.target : { name: 'description', value: event };
        let updatedDetails = { ...selectedRecord };

        if (name === "title") {
            const trimmedValue = value.trimStart();
            updatedDetails = { ...updatedDetails, title: trimmedValue, };
        } else {
            updatedDetails[name] = value;
        }

        setSelectedRecord(updatedDetails);
        setFormError(prev => ({ ...prev, [name]: formValidate(name, updatedDetails[name]) }));
        if (name === "description" && imageSizeError) {
            setImageSizeError('');
        }
    };

    const onChangeTextCreate = (event) => {
        const { name, value, images } = event.target;
        const trimmedValue = name === "title" || name === "slug" ? value.trimStart() : value;
        setChangeLogDetails((prev) => {
            let updated = { ...prev };
            if (name === "title") {
                const slug = trimmedValue ? trimmedValue.replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, "-").toLowerCase() : "";
                updated = { ...updated, title: trimmedValue, slug: slug };
            }
            else if (name === "slug") {
                const slug = value.replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").toLowerCase();
                updated = { ...updated, slug: slug };
            }
            else if (name === "description") {
                updated = {
                    ...updated,
                    [name]: value,
                    ...(images && { descriptionImages: [...(prev.descriptionImages || []), ...images] }),
                };
            }
            else {
                updated[name] = value;
            }
            return updated;
        });
        setFormError((prev) => ({ ...prev, [name]: formValidate(name, trimmedValue), }));
    };

    const onChangeCategory = (selectedItems) => {
        const categoryId = selectedItems === null ? "" : selectedItems;
        if (id === "new") {
            setChangeLogDetails({ ...changeLogDetails, categoryId });
        } else {
            setSelectedRecord({ ...selectedRecord, categoryId });
        }
    }

    const commonToggle = (name, value) => {
        if (id === "new") {
            setChangeLogDetails({ ...changeLogDetails, [name]: value });
        } else {
            setSelectedRecord({ ...selectedRecord, [name]: value })
        }
        if (name === "expiredBoolean") {
            setFormError((formError) => ({ ...formError, expiredAt: formValidate("expiredAt", (id === "new" ? changeLogDetails.expiredAt : selectedRecord?.expiredAt)) }));
        }
    }

    const onDateChange = (name, date) => {
        if (date) {
            const formattedDate = new Date(date);

            if (id === "new") {
                let objCreate = { ...changeLogDetails, [name]: formattedDate };
                if (name === "publishedAt") {
                    objCreate = {
                        ...objCreate,
                        status: formattedDate > new Date() ? 2 : 1
                    };
                }
                setChangeLogDetails(objCreate);
            } else {
                let obj = { ...selectedRecord, [name]: formattedDate };
                if (name === "publishedAt") {
                    obj = {
                        ...obj,
                        status: formattedDate > new Date() ? 2 : 1
                    };
                }
                setSelectedRecord(obj);
            }

            setFormError((formError) => ({ ...formError, expiredAt: formValidate("expiredAt", formattedDate) }));
            setPopoverOpen(false);
            setPopoverOpenExpired(false);
        }
    };

    const generateImageKey = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "#";
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const transformDescription = (description, descriptionImages = []) => {
        if (!description) {
            return { transformedHtml: description, keysToDelete: [], updatedImages: [] };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(description, "text/html");
        const images = doc.getElementsByTagName("img");

        for (let img of images) {
            const src = img.getAttribute("src");
            if (src?.startsWith(window.location.origin)) {
                const hashIndex = src.indexOf("#");
                if (hashIndex !== -1) {
                    const hashOnly = src.substring(hashIndex);
                    img.setAttribute("src", hashOnly);
                }
            }
        }

        const updatedImages = [];
        const currentImageKeys = [];
        const keysToDelete = [];

        const normalize = (s) => s?.replace(/\s/g, '').trim();

        for (let img of images) {
            const imageUrl = img.getAttribute("src");

            if (imageUrl.startsWith('#')) {
                currentImageKeys.push(imageUrl);
                const existingImg = descriptionImages.find(imgObj => normalize(imgObj.key) === normalize(imageUrl));

                if (existingImg && !updatedImages.find(x => x.key === existingImg.key)) {
                    updatedImages.push(existingImg);
                }
            } else if (imageUrl.includes(DO_SPACES_ENDPOINT)) {
                const filename = imageUrl.split('/').pop();
                const existingImg = descriptionImages.find(imgObj => imgObj.path.includes(filename) || imgObj.fullPath?.includes(filename));

                if (existingImg) {
                    img.setAttribute("src", existingImg.key);
                    currentImageKeys.push(existingImg.key);
                    if (!updatedImages.find(x => x.key === existingImg.key)) {
                        updatedImages.push(existingImg);
                    }
                } else {
                    const newKey = generateImageKey();
                    img.setAttribute("src", newKey);
                    const newImage = {
                        key: newKey,
                        path: filename,
                        fullPath: `post/${projectDetailsReducer.id}/${filename}`
                    };
                    updatedImages.push(newImage);
                    currentImageKeys.push(newKey);
                }
            }
        }

        const deletedImages = descriptionImages.filter(img => !currentImageKeys.includes(img.key));
        keysToDelete.push(...deletedImages.map(img => img.fullPath));

        return {
            transformedHtml: doc.body.innerHTML,
            keysToDelete,
            updatedImages
        };
    };

    const deleteImages = async (keysToDelete) => {
        const payload = { keys: keysToDelete.map(key => key?.fullPath ? key?.fullPath : key?.path).filter(path => path) };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {

        } else {
            toast({ description: response.error?.message || 'Failed to delete images', variant: "destructive" });
        }
    };

    const updatePost = async (loader) => {
        let validationErrors = {};
        Object.keys(selectedRecord).forEach(name => {
            const error = formValidate(name, selectedRecord[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        const expiredAtError = formValidate("expiredAt", selectedRecord.expiredAt);
        if (expiredAtError) {
            validationErrors.expiredAt = expiredAtError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }
        if (imageSizeError) {
            validationErrors.imageSizeError = imageSizeError;
            return;
        }
        if (selectedRecord.expiredBoolean === 1 && !selectedRecord.expiredAt) {
            selectedRecord.expiredBoolean = 0;
        }
        setIsLoad(loader);
        let formData = new FormData();
        Object.keys(selectedRecord).forEach((x) => {
            if (x !== "labelId" && x !== "featureImage" && x !== "descriptionImages" && x !== "description") {
                if (x === "assignToId") {
                    formData.append(x, selectedRecord[x]);
                } else if (x === "publishedAt") {
                    formData.append("publishedAt", dayjs(selectedRecord?.publishedAt).format("YYYY-MM-DD"));
                } else if (x === "expiredAt") {
                    formData.append("expiredAt", selectedRecord?.expiredBoolean === 1 ? dayjs(selectedRecord?.expiredAt).format("YYYY-MM-DD") : "");
                } else if (x === "deleteImage" && selectedRecord?.featureImage?.name) {
                    if (selectedRecord.deleteImage && !selectedRecord.featureImage) {
                        formData.append("deleteImage", selectedRecord.deleteImage);
                    }
                } else if (x === "categoryId") {
                    formData.append("categoryId", selectedRecord?.categoryId || '');
                } else {
                    formData.append(x, selectedRecord[x]);
                }
            }
        });
        const { transformedHtml, keysToDelete, updatedImages } = transformDescription(
            selectedRecord?.description,
            selectedRecord?.descriptionImages || []
        );
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete])].filter(
            (key) => key !== null && key !== undefined && key !== ""
        );
        formData.append("description", transformedHtml);
        const imagesToSend = updatedImages.map((img) => ({
            key: img.key,
            path: img.path.includes("/") ? img.path.split("/").pop() : img.path,
        }));
        formData.append("descriptionImages", JSON.stringify(imagesToSend));
        if (selectedRecord?.featureImage && selectedRecord.featureImage.name) {
            formData.append("featureImage", selectedRecord.featureImage);
        }
        if (selectedRecord?.labels && Array.isArray(selectedRecord.labels)) {
            if (selectedRecord.labels.length > 0) {
                selectedRecord.labels.forEach((label) => { formData.append("labelId[]", label); });
            } else {
                formData.append("labelId[]", "");
            }
        } else {
            formData.append("labelId[]", "");
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
            setImagesToDelete((prev) => {
                const filtered = prev.filter((img) =>
                    !allKeysToDelete.includes(img.key) &&
                    !allKeysToDelete.includes(img.fullPath) &&
                    !allKeysToDelete.includes(img.path)
                );
                return filtered;
            });
        }
        const data = await apiService.updatePosts(formData, selectedRecord?.id);
        if (data.success) {
            setImagesToDelete([]);
            // setSelectedRecord(selectedRecord);
            // setOldSelectedAnnouncement(selectedRecord);
            setSelectedRecord(prev => {
                const { deleteImage, ...rest } = prev;
                return rest;
            });
            setOldSelectedAnnouncement(prev => {
                const { deleteImage, ...rest } = prev;
                return rest;
            });
            setImageSizeError('');
            setIsLoad('');
            toast({ description: data.message });
        } else {
            toast({ description: data?.error?.message, variant: "destructive" });
        }
    };

    //Create Post
    const transformDescriptionCreate = (description, descriptionImages) => {
        if (!description) {
            return { transformedHtml: description, keysToDelete: [], updatedImages: [] };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(description, 'text/html');
        const images = doc.getElementsByTagName('img');
        const updatedImages = [...descriptionImages];
        const currentImageKeys = [];

        for (let img of images) {
            const imageUrl = img.src;

            if (imageUrl.startsWith('#')) {
                currentImageKeys.push(imageUrl);
                continue;
            }

            if (imageUrl.includes(DO_SPACES_ENDPOINT)) {
                const filename = imageUrl.split('/').pop();

                const existingImage = descriptionImages.find(img => img.path === filename);
                if (existingImage) {
                    img.src = existingImage.key;
                    currentImageKeys.push(existingImage.key);
                } else {
                    const newKey = generateImageKey();
                    img.src = newKey;
                    updatedImages.push({
                        key: newKey,
                        path: filename,
                        fullPath: `feature-idea/${projectDetailsReducer.id}/${filename}`
                    });
                    currentImageKeys.push(newKey);
                }
            }
        }

        const deletedImages = descriptionImages.filter(img => !currentImageKeys.includes(img.key));
        const keysToDelete = deletedImages.map(img => img.fullPath);

        return {
            transformedHtml: doc.body.innerHTML,
            keysToDelete,
            updatedImages: updatedImages.filter(img => currentImageKeys.includes(img.key))
        };
    };

    const deleteImagesCreate = async (keysToDelete) => {
        const payload = { keys: keysToDelete };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {

        } else {
            toast({ description: response.error?.message || 'Failed to delete images', variant: "destructive" });
        }
    };

    const createPosts = async (load) => {
        let validationErrors = {};
        Object.keys(changeLogDetails).forEach(name => {
            const error = formValidate(name, changeLogDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        const imageError = formValidate('image', changeLogDetails.image);
        if (imageError) {
            validationErrors['image'] = imageError;
        }
        const expiredAtError = formValidate("expiredAt", changeLogDetails.expiredAt);
        if (expiredAtError) {
            validationErrors.expiredAt = expiredAtError;
        }
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            return;
        }

        if (changeLogDetails.expiredBoolean === 1 && !changeLogDetails.expiredAt) {
            changeLogDetails.expiredBoolean = 0;
        }
        setIsLoad(load);
        let formData = new FormData();
        formData.append("projectId", projectDetailsReducer.id);
        const { transformedHtml, keysToDelete, updatedImages } = transformDescriptionCreate(
            changeLogDetails.description,
            changeLogDetails.descriptionImages || []
        );
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete.map(img => img.fullPath)])];
        formData.append("description", transformedHtml);
        if (updatedImages && updatedImages.length > 0) {
            formData.append('descriptionImages', JSON.stringify(
                updatedImages.map(img => ({ key: img.key, path: img.path }))
            ));
        }
        formData.append(
            "slug",
            (() => {
                let baseSlug =
                    changeLogDetails.slug ||
                    changeLogDetails.title.replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, "-").toLowerCase() || "post";

                const randomNum = Math.floor(Math.random() * 99) + 1;
                const paddedNum = randomNum.toString().padStart(2, "0");

                return `${baseSlug}-${paddedNum}`;
            })()
        );
        formData.append("title", changeLogDetails.title);
        formData.append("publishedAt", dayjs(changeLogDetails.publishedAt).format("YYYY-MM-DD"));
        const expiredAt = changeLogDetails.expiredBoolean === 1 ? dayjs(changeLogDetails.expiredAt).format("YYYY-MM-DD") : "";
        formData.append("expiredAt", expiredAt);

        formData.append("categoryId", changeLogDetails.categoryId || "");
        formData.append("assignToId", changeLogDetails.assignToId.join());
        formData.append("pinTop", changeLogDetails.pinTop);
        formData.append("status", changeLogDetails.status || 1);
        formData.append("expiredBoolean", changeLogDetails.expiredBoolean);
        if (canSendEmail) {
            formData.append("notifyUsers", sendEmail && canSendEmail);
        }

        if (changeLogDetails.image) {
            formData.append("featureImage", changeLogDetails.image);
        }
        for (let i = 0; i < changeLogDetails.labelId.length; i++) {
            formData.append('labelId[]', changeLogDetails.labelId[i]);
        }
        if (allKeysToDelete.length > 0) {
            await deleteImagesCreate(allKeysToDelete);
        }
        const data = await apiService.createPosts(formData);
        if (data.success) {
            setChangeLogDetails(initialState);
            setImagesToDelete([]);
            setIsLoad('');
            toast({ description: data.message });
            navigate(`${baseUrl}/changelog?pageNo=${getPageNo}`)
        } else {
            toast({ variant: "destructive", description: data.error.message });
        }
    };

    const deleteAnnouncement = async () => {
        setIsDeleteLoading(true);
        const data = await apiService.deletePosts(selectedRecord?.id);
        setIsDeleteLoading(false);
        if (data.success) {
            toast({ description: data.message });
            navigate(`${baseUrl}/changelog?pageNo=${getPageNo}`);
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleValueChange = (value) => {
        if (id === "new") {
            setChangeLogDetails({ ...changeLogDetails, assignToId: [value] });
        } else {
            setSelectedRecord({ ...selectedRecord, assignToId: value });
        }
    };

    const deleteAssignTo = (e, index) => {
        e.stopPropagation();
    };

    const onChangeLabel = (value) => {
        if (id === "new") {
            const clone = [...(changeLogDetails?.labelId || [])];
            const index = clone.indexOf(value);
            if (index > -1) {
                clone.splice(index, 1);
            } else {
                clone.push(value);
            }
            setChangeLogDetails({ ...changeLogDetails, labelId: clone });
        } else {
            const clone = [...(selectedRecord?.labels || [])];
            const index = clone.indexOf(value);
            if (index > -1) {
                clone.splice(index, 1);
            } else {
                clone.push(value);
            }
            setSelectedRecord({ ...selectedRecord, labels: clone });
        }
    }

    const links = [{ label: 'Changelog', path: `/changelog?pageNo=${getPageNo}` }];

    const publishDate = id === "new" ? (changeLogDetails?.publishedAt ? new Date(changeLogDetails.publishedAt) : null) : (selectedRecord?.publishedAt ? new Date(selectedRecord.publishedAt) : null);

    const isDateDisabled = (date) => {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const publishDate = id === "new" ? (changeLogDetails?.publishedAt ? new Date(changeLogDetails.publishedAt) : null) : (selectedRecord?.publishedAt ? new Date(selectedRecord.publishedAt) : null);
        if (publishDate) {
            publishDate.setHours(0, 0, 0, 0);
        }
        const minDate = publishDate && publishDate > currentDate ? publishDate : currentDate;
        return date < minDate && date.toDateString() !== minDate.toDateString();
    };

    const handleOnCreateCancel = () => {
        setSelectedRecord(oldSelectedAnnouncement);
        setFormError(initialStateError);
        setImageSizeError('');
        navigate(`${baseUrl}/changelog?pageNo=${getPageNo}`)
    }

    const setImages = (updater) => {
        setSelectedRecord((prev) => {
            const updatedImages = typeof updater === 'function' ? updater(prev) : updater;
            return { ...prev, ...updatedImages };
        });
    };

    const handleStatusChange = (value) => {
        if (id === "new") {
            setChangeLogDetails({ ...changeLogDetails, status: value === "schedule" ? 2 : 1, });
        } else {
            setSelectedRecord({ ...selectedRecord, status: value === "schedule" ? 2 : 1 });
        }
    };

    const isFutureDate = publishDate && publishDate > new Date();

    const checkLimit = async () => {
        const data = await apiService.changelogLimitCheck({ projectId: projectDetailsReducer.id });
        if (data.success) {
            if (data.data.status === 409) {
                toast({ variant: "destructive", description: data.message });
            }
            setCanSendEmail(true);
            return true;
        } else {
            setSendEmail(false);
            setCanSendEmail(false);
            toast({ variant: "destructive", description: data.error.message });
            return false;
        }
    };

    const handleOpenChangelogWithAI = () => {
        if(projectDetailsReducer.plan === 3 && projectDetailsReducer.stripeStatus === 'active') {
            setOpenWriteWithAI(true);
        } else {
            onProModal(true);
        }
    }

    const handleOpenWriteWithAI = () => {
        return (
             id === "new" && (!isHideAiButton) && (
                <Fragment>
                    <Button
                        className={`lg:absolute bottom-5 left-1/2 lg:-translate-x-1/2 z-50 lg:mt-0 mt-3 shadow-[0_0_50px_1px_#7c3aed70] gap-1.5 hover:animate-none ${width <= 1279 ? "" : "gentle-bounce"} max-w-max`}
                        onClick={handleOpenChangelogWithAI}
                    >
                        {Icon.AIWhiteIcon} Generate changelog with AI
                        <ChevronRight size={16} />
                    </Button>
                </Fragment>
            )
        )
    }

    return (
        <Fragment>
            {
                projectDetailsReducer.plan === 3 && projectDetailsReducer.stripeStatus === 'active' && id === "new" && (
                    <Fragment>
                        <ChangeLogAiModal {...{ openWriteWithAI, setOpenWriteWithAI, setChangeLogDetails, changeLogDetails, setIsHideAiButton }} />
                    </Fragment>
                )
            }

            <ProPlanModal
                setIsProModal={onProModal}
            />

            <div className={"container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4"}>
                <div className={"flex flex-wrap justify-between items-center gap-2"}>
                    <CommonBreadCrumb
                        links={links}
                        currentPage={id !== "new" ? (selectedRecord?.title) : (changeLogDetails?.title || "New Post")}
                        truncateLimit={30}
                        status={id !== "new" ? selectedRecord?.status : undefined}
                    />
                    <div className={"flex flex-wrap items-center gap-2 md:gap-4"}>
                        <Button variant="outline" className={"w-[30px] h-[30px]"} size="icon"
                            onClick={() => commonToggle("pinTop", (id === "new" ? changeLogDetails.pinTop : selectedRecord?.pinTop) === 1 ? 0 : 1)}>
                            {(id === "new" ? changeLogDetails.pinTop : selectedRecord?.pinTop) === 1 ? <Pin size={15} className={`fill-card-foreground`} /> :
                                <Pin size={15} />}
                        </Button>
                        {
                            id !== "new" && (
                                <Fragment>
                                    <Button onClick={() => navigate(`${baseUrl}/changelog/analytic-view?id=${selectedRecord?.id}`)}
                                        variant="outline" className={"w-[30px] h-[30px]"} size="icon">
                                        <BarChart size={15} />
                                    </Button>
                                </Fragment>
                            )
                        }
                        <Button variant={"outline hover:bg-primary"} disabled={isLoad === 'head'} onClick={id === "new" ? () => createPosts("head") : () => updatePost("head")}
                            className={`bg-primary w-[101px] h-[30px] font-medium flex justify-center items-center text-card`}>
                            {isLoad === 'head' ? <Loader2 className="h-4 w-4 animate-spin" /> : `${id === "new" ? "Create Post" : "Update Post"}`}
                        </Button>
                        <Button onClick={() => navigate(`${baseUrl}/changelog?pageNo=${getPageNo}`)}
                            variant={"outline "}
                            className={`text-sm font-medium border border-primary block text-primary h-[30px]`}>Cancel</Button>
                        {
                            id !== "new" && (
                                <Fragment>
                                    <Button variant={"ghost hover-none"} onClick={() => setOpenDelete(true)}
                                        className={"font-medium h-[30px] border border-destructive text-destructive"}>
                                        <Trash2 size={16} className="mr-2" />
                                        Delete
                                    </Button>
                                    <DeleteDialog
                                        title="You really want to delete this Changelog?"
                                        isOpen={openDelete}
                                        onOpenChange={() => setOpenDelete(false)}
                                        onDelete={deleteAnnouncement}
                                        isDeleteLoading={isDeleteLoading}
                                        deleteRecord={selectedRecord?.id}
                                    />
                                </Fragment>
                            )
                        }
                    </div>
                </div>
                <Card className={"mt-4"}>
                    <div className={`flex lg:flex-nowrap flex-wrap`}>
                        <div className={"lg:max-w-[407px] w-full h-full border-r overflow-y-auto"}>
                            <div className={"lg:h-[calc(100vh_-_156px)] overflow-y-auto"}>
                                <div className="py-3 px-4 md:py-5 md:px-6 w-full space-y-1.5 border-b">
                                    <div className="space-y-1.5 h-full">
                                        <Label className={"font-medium"}>Featured image</Label>
                                        <div className="flex gap-1">
                                            {
                                                id === "new" ?
                                                    <Fragment>
                                                        {changeLogDetails?.image ? (
                                                            <div className="w-full">
                                                                {changeLogDetails?.image && (
                                                                    <ImageUploader
                                                                        imageWidth={"w-full"}
                                                                        className={"w-full"}
                                                                        image={changeLogDetails?.image}
                                                                        onDelete={() => onDeleteImgCreate('deleteImage', changeLogDetails?.image.name ? '' : changeLogDetails?.image)}
                                                                        altText="Cover Image"
                                                                    />
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full">
                                                                <ImageUploader
                                                                    imageWidth={"w-full"}
                                                                    className={"w-full"}
                                                                    onUpload={handleFileChangeCreate}
                                                                    altText="Cover Image"
                                                                />
                                                            </div>
                                                        )}
                                                    </Fragment>
                                                    :
                                                    <Fragment>
                                                        {selectedRecord?.featureImage ? (
                                                            <div className="w-full">
                                                                {selectedRecord?.featureImage && (
                                                                    <ImageUploader
                                                                        imageWidth={"w-full"}
                                                                        className={"w-full"}
                                                                        image={selectedRecord?.featureImage}
                                                                        onDelete={() => onDeleteImg('deleteImage', selectedRecord.featureImage.name ? '' : selectedRecord.featureImage)}
                                                                        altText="Cover Image"
                                                                    />
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full">
                                                                <ImageUploader
                                                                    imageWidth={"w-full"}
                                                                    className={"w-full"}
                                                                    onUpload={handleFileChange}
                                                                    altText="Cover Image"
                                                                />
                                                            </div>
                                                        )}
                                                    </Fragment>
                                            }
                                        </div>
                                        {formError.featureImage && <div className="text-xs text-red-500">{formError.featureImage}</div>}
                                    </div>
                                </div>
                                <div className="py-3 px-4 md:py-5 md:px-6 w-full space-y-4 border-b">
                                    <div className={"w-full space-y-1.5"}>
                                        <div className={`flex gap-2 justify-between items-center`}>
                                            <Label htmlFor="label" className={"font-medium"}>Label</Label>
                                            <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/labels`)}>Manage Labels</Button>
                                        </div>
                                        <Popover open={openLabelsPopover} onOpenChange={setOpenLabelsPopover}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="h-9 hover:bg-card w-full justify-between bg-card">
                                                    <div className="flex gap-1 overflow-hidden">
                                                        {(id === "new" ? changeLogDetails?.labelId?.length > 0 : selectedRecord?.labels?.length > 0) ? (
                                                            <Fragment>
                                                                {((id === "new" ? changeLogDetails.labelId : selectedRecord?.labels) || []).slice(0, 2).map((x, i) => {
                                                                    const findObj = labelList.find((y) => y.id == x);
                                                                    return (
                                                                        <Badge key={i} variant={"outline"}
                                                                            style={{ color: findObj?.colorCode, borderColor: findObj?.colorCode, textTransform: "capitalize" }}
                                                                            className={`h-[20px] py-0 px-2 text-xs rounded-[5px] font-normal text-[${findObj?.colorCode}] border-[${findObj?.colorCode}] capitalize`}
                                                                        >
                                                                            <span className="max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                                                                {findObj?.name}
                                                                            </span>
                                                                        </Badge>
                                                                    );
                                                                })}
                                                                {(id === "new" ? changeLogDetails?.labelId?.length : selectedRecord?.labels.length) > 2 && (
                                                                    <Badge variant={"outline"}
                                                                        className="h-[20px] py-0 px-2 text-xs rounded-[5px] font-normal text-muted-foreground border-muted-foreground">
                                                                        +{(id === "new" ? changeLogDetails?.labelId?.length : selectedRecord?.labels.length) - 2}
                                                                    </Badge>
                                                                )}
                                                            </Fragment>
                                                        ) : (<span className="text-muted-foreground">Select label</span>)}
                                                    </div>
                                                    {Icon.popoverChevronsUpDown}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command className="w-full">
                                                    <CommandInput placeholder="Search labels..." className="h-8" />
                                                    <CommandList>
                                                        <CommandEmpty>No labels found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {(labelList || []).map((label) => (
                                                                <CommandItem key={label.id} value={id === "new" ? label?.id?.toString() : label?.id}
                                                                    className="p-0 cursor-pointer gap-1"
                                                                    onSelect={() => {
                                                                        id === "new" ? onChangeLabel(label?.id?.toString()) : onChangeLabel(label?.id);
                                                                    }}>
                                                                    <Checkbox className="m-2"
                                                                        checked={id === "new" ? changeLogDetails?.labelId?.includes(label?.id?.toString()) : selectedRecord?.labels?.includes(label?.id)}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            id === "new" ? onChangeLabel(label?.id?.toString()) : onChangeLabel(label?.id);
                                                                        }}
                                                                    />
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <Circle fill={label.colorCode} stroke={label.colorCode} className="w-[10px] h-[10px]" />
                                                                        <span className="max-w-[150px] truncate">{label.name}</span>
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className={"w-full space-y-1.5"}>
                                        <Label className={"font-medium"}>Assign to</Label>
                                        <Select onValueChange={handleValueChange} value={[]}>
                                            <SelectTrigger className={"h-9"}>
                                                <SelectValue className={"text-muted-foreground text-sm"}>
                                                    {
                                                        id === "new" ? (
                                                            <Fragment>
                                                                {
                                                                    changeLogDetails?.assignToId?.length > 0 ? (
                                                                        <div className={"flex gap-[2px]"}>
                                                                            {
                                                                                (changeLogDetails.assignToId || []).slice(0, 2).map((x, index) => {
                                                                                    const findObj = memberList.find((y,) => y.userId == x);
                                                                                    return (
                                                                                        <div key={index}
                                                                                            className={`bg-muted-foreground/30 text-sm flex gap-[2px] items-center rounded py-0 px-2`}
                                                                                            onClick={(e) => deleteAssignTo(e, index)}>
                                                                                            {findObj?.firstName ? findObj?.firstName : ''}
                                                                                        </div>
                                                                                    )
                                                                                })
                                                                            }
                                                                            {(changeLogDetails.assignToId || []).length > 2}
                                                                        </div>) : (
                                                                        <span className="text-muted-foreground">Select assign to</span>)
                                                                }
                                                            </Fragment>
                                                        ) : (
                                                            <Fragment>
                                                                {(() => {
                                                                    const findObj = memberList.find(y => y.userId.toString() === selectedRecord?.assignToId?.toString());
                                                                    return findObj ? (
                                                                        <div className="flex gap-[2px]">
                                                                            <div className="bg-muted-foreground/30 text-sm flex items-center rounded py-0 px-2">
                                                                                {findObj.firstName || ''}
                                                                            </div>
                                                                        </div>
                                                                    ) : (<span className="text-muted-foreground">Select assign to</span>);
                                                                })()}
                                                            </Fragment>
                                                        )
                                                    }
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {(memberList || []).map((x, i) => (
                                                        <SelectItem className={"p-2"} key={i} value={x.userId.toString()}>
                                                            <div className={"flex gap-2"}>
                                                                <div onClick={() => handleValueChange(x.userId.toString())}
                                                                    className="checkbox-icon">
                                                                    {(id === "new" ? changeLogDetails.assignToId?.includes(x.userId.toString()) : selectedRecord?.assignToId == x.userId) ? (
                                                                        <Check size={18} />) : (
                                                                        <div className={"h-[18px] w-[18px]"} />)}
                                                                </div>
                                                                <span>{x.firstName ? x.firstName : ''} {x.lastName ? x.lastName : ''}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={"w-full space-y-1.5"}>
                                        <div className={`flex gap-2 justify-between items-center`}>
                                            <Label htmlFor="label" className={"font-medium"}>Category</Label>
                                            <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/categories`)}>Manage Categories</Button>
                                        </div>
                                        <Select
                                            value={id === "new" ? changeLogDetails && changeLogDetails.categoryId && changeLogDetails.categoryId.toString() :
                                                selectedRecord && selectedRecord?.categoryId && selectedRecord?.categoryId?.toString()
                                            }
                                            onValueChange={onChangeCategory}>
                                            <SelectTrigger className="h-9">
                                                {(id === "new" ? changeLogDetails?.categoryId : selectedRecord?.categoryId) ? (
                                                    <SelectValue>
                                                        {categoriesList.find(x => x.id.toString() === (id === "new" ? changeLogDetails.categoryId.toString() : selectedRecord?.categoryId.toString()))?.name}
                                                    </SelectValue>
                                                ) : (<span className="text-muted-foreground">Select a category</span>)}
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {(categoriesList || []).map((x, i) => {
                                                        return (
                                                            <SelectItem key={i} value={x.id.toString()}>{x.title}</SelectItem>
                                                        )
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <div className={"flex-1 space-y-1.5"}>
                                            <Label htmlFor="date" className={"font-medium"}>Published at {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                                <PopoverTrigger asChild className={"w-full"}>
                                                    <Button id="date" variant="outline"
                                                        disabled={projectDetailsReducer.plan === 0}
                                                        className={"justify-between hover:bg-card text-left font-normal flex text-muted-foreground hover:text-muted-foreground bg-card"}>
                                                        {/*{selectedRecord.updatedAt ? (dayjs(selectedRecord.updatedAt).format("MMM D, YYYY")) : (selectedRecord.publishedAt ? dayjs(selectedRecord.publishedAt).format("MMM D, YYYY") : "Select date")}*/}
                                                        {
                                                            (id === "new") ? <Fragment>{changeLogDetails?.publishedAt ? dayjs(changeLogDetails?.publishedAt).format("MMM D, YYYY") : "Select date"}</Fragment> :
                                                                <Fragment>{(selectedRecord?.publishedAt ? dayjs(selectedRecord?.publishedAt).format("MMM D, YYYY") : "Select date")}</Fragment>
                                                        }
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        captionLayout="dropdown"
                                                        showOutsideDays={false}
                                                        // selected={selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt) :(selectedRecord?.publishedAt ? new Date(selectedRecord?.publishedAt) : new Date())}
                                                        selected={id === "new" ? (changeLogDetails.publishedAt ? new Date(changeLogDetails.publishedAt) : new Date()) : (selectedRecord?.publishedAt ? new Date(selectedRecord?.publishedAt) : new Date())}
                                                        onSelect={(date) => onDateChange("publishedAt", date)}
                                                        startMonth={new Date(2024, 0)}
                                                        endMonth={new Date(2050, 12)}
                                                        hideNavigation
                                                        defaultMonth={id === "new" ? (changeLogDetails.publishedAt ? new Date(changeLogDetails.publishedAt) : new Date()) : (selectedRecord?.publishedAt ? new Date(selectedRecord?.publishedAt) : new Date())}
                                                    // defaultMonth={selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt) :(selectedRecord?.publishedAt ? new Date(selectedRecord?.publishedAt) : new Date())}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        {isFutureDate && (
                                            <div className="flex-1 space-y-1.5">
                                                <Label className={"font-medium"}>Select Status {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                                                <Select disabled={projectDetailsReducer.plan === 0} value={(id === "new" ? (changeLogDetails?.status === 2) : (selectedRecord?.status === 2)) ? "schedule" : "live"} onValueChange={handleStatusChange}>
                                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select status" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectItem value="schedule">Schedule</SelectItem>
                                                            <SelectItem value="live">Publish Now</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full space-y-1.5">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="expire_date" disabled={projectDetailsReducer.plan === 0}
                                                checked={id === "new" ? (changeLogDetails.expiredBoolean === 1) : (selectedRecord?.expiredBoolean === 1)}
                                                onCheckedChange={(checked) => commonToggle("expiredBoolean", checked ? 1 : 0)}
                                            />
                                            <label htmlFor="expire_date" className={`text-sm font-medium ${(id === "new" ? changeLogDetails.expiredBoolean : selectedRecord?.expiredBoolean) === 1 ? "after:ml-0.5 after:content-['*'] after:text-destructive" : ""}`}>
                                                Set Expiry Date {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}
                                            </label>
                                        </div>
                                        {(id === "new" ? changeLogDetails.expiredBoolean : selectedRecord?.expiredBoolean) === 1 && (
                                            <div className="grid w-full gap-2 basis-1/2">
                                                <Popover open={popoverOpenExpired} onOpenChange={setPopoverOpenExpired}>
                                                    <PopoverTrigger asChild>
                                                        <Button id="date" disabled={projectDetailsReducer.plan === 0} variant="outline"
                                                            className={"justify-between hover:bg-card text-left font-normal d-flex text-muted-foreground hover:text-muted-foreground bg-card"}>
                                                            {
                                                                id === "new" ? <Fragment>
                                                                    {changeLogDetails?.expiredAt ? dayjs(changeLogDetails.expiredAt).format("MMM D, YYYY") : "Select expiration date"}
                                                                </Fragment> : <Fragment>{selectedRecord?.expiredAt ? dayjs(selectedRecord.expiredAt).format("MMM D, YYYY") : "Select expiration date"}</Fragment>
                                                            }
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                                                        <Calendar
                                                            className={"pointer-events-auto"}
                                                            mode="single"
                                                            showOutsideDays={false}
                                                            captionLayout="dropdown"
                                                            selected={id === "new" ? (changeLogDetails?.expiredAt ? new Date(changeLogDetails.expiredAt) : null) : (selectedRecord?.expiredAt ? new Date(selectedRecord.expiredAt) : null)}
                                                            onSelect={(date) => onDateChange("expiredAt", date)}
                                                            endMonth={new Date(2050, 12)}
                                                            startMonth={publishDate || new Date()}
                                                            disabled={isDateDisabled}
                                                            hideNavigation
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {formError.expiredAt && <span className="text-sm text-destructive">{formError.expiredAt}</span>}
                                            </div>
                                        )}
                                    </div>
                                    {
                                        id === "new" && (
                                            <div className={"flex gap-2 items-center"}>
                                                <Checkbox id={"email_notify"} checked={sendEmail}
                                                    onCheckedChange={(checked) => {
                                                        setSendEmail(checked);
                                                        if (checked) {
                                                            checkLimit();
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={"email_notify"} className={"font-medium"}>Send email to subscribers</Label>
                                            </div>
                                        )
                                    }
                                </div>
                                <div className={"py-3 px-4 md:py-5 md:px-6 hidden lg:flex gap-4"}>
                                    <Button variant={"outline hover:bg-primary"} disabled={isLoad === 'bottom'} onClick={id === "new" ? () => createPosts("bottom") : () => updatePost("bottom")} className={`bg-primary w-[101px] font-medium text-card`}>
                                        {isLoad === 'bottom' ? <Loader2 className="h-4 w-4 animate-spin" /> : `${id === "new" ? "Create Post" : "Update Post"}`}
                                    </Button>
                                    <Button onClick={handleOnCreateCancel} variant={"outline "} className={`border border-primary text-sm font-medium text-primary`}>Cancel</Button>
                                </div>
                            </div>
                        </div>
                        <div className={`w-full lg:h-[calc(100vh_-_156px)] overflow-y-auto relative`} ref={scrollContainerRef}>
                            <div className={"py-3 px-4 md:py-5 md:px-6"}>
                                <div className={"flex flex-col gap-2"}>
                                    <div className="w-full flex flex-col gap-2">
                                        <div className={"space-y-1.5"}>
                                            <Label htmlFor="title" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Title</Label>
                                            {
                                                id === "new" ? <Input type="text" id="title" className={"h-9"} name={"title"}
                                                    placeholder={"Enter your title..."} value={changeLogDetails.title}
                                                    onChange={onChangeTextCreate} /> :
                                                    <Input type="text" id="title" className={"h-9"} name={"title"}
                                                        placeholder={"Enter your title..."} value={selectedRecord?.title}
                                                        onChange={onChangeText} />
                                            }
                                        </div>
                                        {formError.title && <span className="text-sm text-red-500">{formError.title}</span>}
                                        {
                                            id !== "new" && <p className={"text-sm font-normal text-muted-foreground break-words"}>
                                                This release will be available at {projectDetailsReducer.domain ?
                                                    <a href={`https://${projectDetailsReducer.domain?.toLowerCase()}/changelog/${selectedRecord?.slug?.toLowerCase()}`}
                                                        target={"_blank"}
                                                        className={"text-primary max-w-[593px] w-full break-words text-sm"}>{`https://${projectDetailsReducer.domain?.toLowerCase()}/changelog/${selectedRecord?.slug?.toLowerCase()}`}</a> : ""}</p>
                                        }
                                    </div>
                                    {
                                        id === "new" && <div className="w-full flex flex-col gap-2">
                                            <div className={"space-y-1.5"}>
                                                <Label htmlFor="slug" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Slug</Label>
                                                <Input type="text" id="slug" className={"h-9"} name={"slug"}
                                                    placeholder={"Enter your slug url..."} value={changeLogDetails.slug}
                                                    onChange={onChangeTextCreate} />
                                            </div>
                                            {formError.slug && <span className="text-sm text-red-500">{formError.slug}</span>}
                                            <p className={"text-sm font-normal text-muted-foreground break-words"}>
                                                This release will be available at {projectDetailsReducer.domain ?
                                                    <a href={`https://${projectDetailsReducer.domain?.toLowerCase()}/changelog/${changeLogDetails.slug?.toLowerCase()}`}
                                                        target={"_blank"}
                                                        className={"text-primary max-w-[593px] w-full break-words text-sm"}>{`https://${projectDetailsReducer.domain?.toLowerCase()}/changelog/${changeLogDetails.slug?.toLowerCase()}`}</a> : ""}</p>
                                        </div>
                                    }
                                    <div className="w-full flex flex-col gap-2">
                                        <Label htmlFor="description" className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Description</Label>
                                        {
                                            id === "new" ?
                                                <ReactQuillEditor
                                                    className={"min-h-[145px] h-full"}
                                                    value={changeLogDetails.description}
                                                    name={"description"}
                                                    onChange={onChangeTextCreate}
                                                    setImageSizeError={setImageSizeError}
                                                    setImages={setChangeLogDetails}
                                                    title={changeLogDetails.title}
                                                    descriptionImages={changeLogDetails.descriptionImages || []}
                                                    uploadFolder={"post"} moduleName={'post'}
                                                    setImagesToDelete={setImagesToDelete}
                                                    scrollContainerRef={scrollContainerRef}
                                                    preventAutoScroll={true}
                                                /> :
                                                <ReactQuillEditor
                                                    value={restoreImagePaths(selectedRecord?.description, selectedRecord?.descriptionImages || [])}
                                                    name={"description"}
                                                    onChange={onChangeText}
                                                    setImageSizeError={setImageSizeError}
                                                    descriptionImages={selectedRecord?.descriptionImages || []}
                                                    setImages={setImages}
                                                    title={selectedRecord?.title}
                                                    uploadFolder={"post"} moduleName={'post'}
                                                    setImagesToDelete={setImagesToDelete}
                                                    scrollContainerRef={scrollContainerRef}
                                                    preventAutoScroll={true}
                                                />
                                        }
                                        {formError.description &&
                                            <span className="text-sm text-red-500">{formError.description}</span>}
                                        {(formError.imageSizeError || imageSizeError) && (<span
                                            className="text-red-500 text-sm">{formError.imageSizeError || imageSizeError}</span>)}
                                    </div>
                                    {
                                handleOpenWriteWithAI()
                            }
                                    <div className={"mt-4 flex lg:hidden gap-4"}>
                                        <Button variant={"outline hover:bg-primary"} disabled={isLoad === 'bottom'} onClick={id === "new" ? () => createPosts("bottom") : () => updatePost("bottom")} className={`bg-primary w-[101px] font-medium text-card`}>
                                            {isLoad === 'bottom' ? <Loader2 className="h-4 w-4 animate-spin" /> : `${id === "new" ? "Create Post" : "Update Post"}`}
                                        </Button>
                                        <Button onClick={handleOnCreateCancel} variant={"outline "} className={`border border-primary text-sm font-medium text-primary`}>Cancel</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </Fragment>
    );
};

export default UpdateAnnouncement;