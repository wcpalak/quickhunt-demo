import { useEffect, useState, Fragment, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { CalendarIcon, Check, Circle, Pin, X, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
import { useSelector } from "react-redux";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { toast } from "../ui/use-toast";
import { Badge } from "../ui/badge";
import ReactQuillEditor from "../Comman/ReactQuillEditor";
import { Checkbox } from "../ui/checkbox";
import { CommandItem, CommandList, CommandGroup, CommandInput, CommandEmpty, Command } from "../ui/command";
import { ImageUploader } from "../Comman/CommentEditor";
import { apiService, DO_SPACES_ENDPOINT } from "../../utils/constent";
import PlanBadge from "../Comman/PlanBadge";
import { Icon } from "../../utils/Icon";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);

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
const initialStateError = {
    title: "",
    description: "",
    slug: "",
    categoryId: "",
};

const CreateAnnouncement = ({ isOpen, onOpen, onClose, getAllPosts, announcementList, }) => {
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const userDetailsReducer = useSelector((state) => state.userDetailsReducer);

    const [changeLogDetails, setChangeLogDetails] = useState(initialState);
    const [formError, setFormError] = useState(initialStateError);
    const [labelList, setLabelList] = useState([]);
    const [memberList, setMemberList] = useState([])
    const [categoriesList, setCategoriesList] = useState([])
    const [isSave, setIsSave] = useState(false)
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverOpenExpired, setPopoverOpenExpired] = useState(false);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [openLabelsPopover, setOpenLabelsPopover] = useState(false);
    const listRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [sendEmail, setSendEmail] = useState(false);
    const [canSendEmail, setCanSendEmail] = useState(false);

    const handleWheelScroll = (event) => {
        if (listRef.current) {
            event.preventDefault();
            listRef.current.scrollBy({ top: event.deltaY, behavior: 'smooth' });
        }
    };

    const handleTouchScroll = (e) => {
        e.stopPropagation();
    };
    useEffect(() => {
        if (projectDetailsReducer.id) {
            setChangeLogDetails({ ...changeLogDetails, assignToId: [userDetailsReducer.id.toString()], });
            setLabelList(allStatusAndTypes.labels);
            setMemberList(allStatusAndTypes.members);
            setCategoriesList(allStatusAndTypes.categories);
        }
    }, [projectDetailsReducer.id, allStatusAndTypes, userDetailsReducer.id]);

    const handleFileChange = (file) => {
        const selectedFile = file.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                // 5 MB
                setFormError((prevErrors) => ({
                    ...prevErrors,
                    image: "Image size must be less than 5 MB.",
                }));
            } else {
                setFormError((prevErrors) => ({ ...prevErrors, image: "", }));
                setChangeLogDetails({ ...changeLogDetails, image: selectedFile, });
            }
        }
    };

    const onDeleteImg = async (name, value) => {
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
                const cleanValue = value.trim();
                const emptyContent = /^(<p>\s*<\/p>|<p><br><\/p>|<\/?[^>]+>)*$/;
                if (!value || value.trim() === "") {
                    // if (!value || cleanValue === "" || emptyContent.test(cleanValue)) {
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
            case "expiredAt":
                if (changeLogDetails.expiredBoolean === 1 && (!value)
                ) {
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
        const { name, value, images } = event.target;
        const trimmedValue =
            name === "title" || name === "slug" ? value.trimStart() : value;
        setChangeLogDetails((prev) => {
            let updated = { ...prev };
            if (name === "title") {
                const slug = trimmedValue.replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, "-").toLowerCase();
                updated = {
                    ...updated,
                    title: trimmedValue,
                    ...(updated.slug ===
                        updated.title.replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, "-").toLowerCase() && { slug: slug }),
                };
            } else if (name === "slug") {
                const slug = value.replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-").toLowerCase();
                updated = { ...updated, slug: slug, };
            } else if (name === "description") {
                updated = {
                    ...updated,
                    [name]: value,
                    ...(images && { descriptionImages: [...(prev.descriptionImages || []), ...images], }),
                };
            } else {
                updated[name] = value;
            }
            return updated;
        });
        setFormError((prev) => ({
            ...prev,
            [name]: formValidate(name, trimmedValue),
            // [name]: formValidate(name, changeLogDetails[name])
        }));
    };

    const onChangeCategory = (selectedItems) => {
        const categoryId = selectedItems;
        setChangeLogDetails({ ...changeLogDetails, categoryId });
    };

    const commonToggle = (name, value) => {
        setChangeLogDetails({ ...changeLogDetails, [name]: value });
        if (name === "expiredBoolean") {
            setFormError((formError) => ({
                ...formError,
                expiredAt: formValidate("expiredAt", changeLogDetails.expiredAt),
            }));
        }
    };

    const onDateChange = (name, date) => {
        if (date) {
            const formattedDate = new Date(date);
            let obj = { ...changeLogDetails, [name]: formattedDate };
            if (name === "publishedAt") {
                if (formattedDate > new Date()) {
                    obj = { ...obj, status: 2 };
                } else {
                    obj = { ...obj, status: 1 };
                }
            }
            setChangeLogDetails(obj);
            setFormError((formError) => ({
                ...formError,
                expiredAt: formValidate("expiredAt", formattedDate),
            }));
            setPopoverOpen(false);
            setPopoverOpenExpired(false);
        }
    };

    const generateImageKey = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '#';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    const transformDescription = (description, descriptionImages) => {
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

    const deleteImages = async (keysToDelete) => {
        const payload = { keys: keysToDelete };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {

        } else {
            toast({ description: response.error?.message || 'Failed to delete images', variant: "destructive" });
        }
    };

    const createPosts = async () => {
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
        const isSlugTaken = (announcementList || []).some(x => x.slug === changeLogDetails.slug);
        if (isSlugTaken) {
            toast({ description: "The post slug url has already been taken.", variant: "destructive" });
            return;
        }
        if (changeLogDetails.expiredBoolean === 1 && !changeLogDetails.expiredAt) {
            changeLogDetails.expiredBoolean = 0;
        }
        setIsSave(true);
        let formData = new FormData();
        formData.append("projectId", projectDetailsReducer.id);
        const { transformedHtml, keysToDelete, updatedImages } = transformDescription(
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
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.createPosts(formData);
        if (data.success) {
            setChangeLogDetails(initialState);
            setImagesToDelete([]);
            setIsSave(false);
            await getAllPosts();
            toast({ description: data.message });
            onClose("", data.data.data);
        } else {
            setIsSave(false);
            toast({ variant: "destructive", description: data.error.message });
        }
    };

    const handleValueChange = (value) => {
        setChangeLogDetails({ ...changeLogDetails, assignToId: [value] });
    };

    const onChangeLabel = (value) => {
        const clone = [...changeLogDetails.labelId];
        const index = clone.indexOf(value);
        if (index > -1) {
            clone.splice(index, 1);
        } else {
            clone.push(value);
        }
        setChangeLogDetails({ ...changeLogDetails, labelId: clone });
    };

    const deleteAssignTo = (e, index) => {
        e.stopPropagation();
    };

    const publishDate = changeLogDetails?.publishedAt ? new Date(changeLogDetails.publishedAt) : null;
    const isDateDisabled = (date) => {
        return publishDate && date < publishDate;
    };

    const handleStatusChange = (value) => {
        setChangeLogDetails({ ...changeLogDetails, status: value === "schedule" ? 2 : 1, });
    };

    const isFutureDate = publishDate && publishDate > new Date();

    const commInput = [{ title: "Title", name: "title", }, { title: "Slug", name: "slug", },];

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

    return (
        <Sheet open={isOpen} onOpenChange={isOpen ? onClose : onOpen}>
            <SheetContent className={"pt-6 p-0 lg:max-w-[663px] md:max-w-[720px] sm:max-w-[520px]"}>
                <SheetHeader className={`px-3 py-4 lg:px-8 lg:py-[20px] flex flex-row justify-between items-center border-b space-y-0`}>
                    <SheetTitle className={"text-lg md:text-xl font-medium"}>Create New Changelog</SheetTitle>
                    <div className={"flex items-center gap-6 m-0"}>
                        <Button className={"h-6 w-6 p-0"}
                            onClick={() => commonToggle("pinTop", changeLogDetails.pinTop === 1 ? 0 : 1)}
                            variant={"ghost hover:bg-none"}>
                            {changeLogDetails.pinTop === 1 ? <Pin size={15} className={`fill-card-foreground`} /> :
                                <Pin size={15} />}
                        </Button>
                        <span className={"max-w-6"}><X onClick={() => onClose(null, null, false)}
                            className={"cursor-pointer"} /></span>
                    </div>
                </SheetHeader>
                <div className={"h-[calc(100vh_-_61px)] overflow-y-auto"} ref={scrollContainerRef}>
                    <div className={"px-3 py-6 lg:px-8 space-y-1.5 border-b"}>
                        <Label className={"font-medium"}>Featured image</Label>
                        <div className="flex gap-1">
                            <ImageUploader className={"w-full"} stateDetails={changeLogDetails} onDeleteImg={onDeleteImg} handleFileChange={handleFileChange} />
                        </div>
                        {formError.image && (<div className={"text-xs text-destructive"}>{formError.image}</div>)}
                    </div>
                    <div className={"px-3 py-6 lg:px-8 border-b"}>
                        <div className={"flex flex-col gap-6"}>
                            {
                                commInput.map((x, i) => (
                                    <Fragment key={i}>
                                        <div className="w-full flex flex-col gap-2">
                                            <Label htmlFor="title"
                                                className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>{x.title}</Label>
                                            <Input type="text" id={x.name} className={"h-9"} name={x.name}
                                                placeholder={`${x.name === "title" ? "Enter your title..." : "Enter your slug url..."}`}
                                                value={changeLogDetails[x.name]} onChange={onChangeText} />
                                            {
                                                (x.name === "slug") &&
                                                <p className={"text-sm font-normal text-muted-foreground break-words"}>
                                                    This release will be available at {projectDetailsReducer.domain ?
                                                        <a href={`https://${projectDetailsReducer.domain?.toLowerCase()}/changelog/${changeLogDetails.slug?.toLowerCase()}`}
                                                            target={"_blank"}
                                                            className={"text-primary max-w-[593px] w-full break-words text-sm"}>{`https://${projectDetailsReducer.domain?.toLowerCase()}/changelog/${changeLogDetails[x.name]?.toLowerCase()}`}</a> : ""}</p>
                                            }
                                            {formError[x.name] &&
                                                <span className="text-sm text-destructive">{formError[x.name]}</span>}
                                        </div>
                                    </Fragment>
                                ))
                            }
                            <div className="w-full flex flex-col gap-2">
                                <Label htmlFor="description"
                                    className={"font-medium after:ml-0.5 after:content-['*'] after:text-destructive"}>Description</Label>
                                <ReactQuillEditor
                                    className={"min-h-[145px] h-full"}
                                    value={changeLogDetails.description}
                                    name={"description"}
                                    onChange={onChangeText}
                                    setImages={setChangeLogDetails}
                                    title={changeLogDetails.title}
                                    descriptionImages={changeLogDetails.descriptionImages || []}
                                    uploadFolder={"post"} moduleName={'post'}
                                    setImagesToDelete={setImagesToDelete}
                                    scrollContainerRef={scrollContainerRef}
                                    preventAutoScroll={true}
                                />
                                {formError.description &&
                                    <span className="text-sm text-destructive">{formError.description}</span>}
                            </div>
                        </div>
                    </div>
                    <div className={"px-3 py-6 lg:px-8 flex flex-col gap-4 border-b"}>
                        <div className={"flex flex-wrap md:flex-nowrap gap-4 items-start"}>
                            <div className="flex flex-col w-full gap-2 md:max-w-[288px]">
                                <Label htmlFor="label" className={"font-medium"}>Label</Label>
                                <Popover open={openLabelsPopover} onOpenChange={setOpenLabelsPopover}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-9 w-full justify-between bg-card">
                                            <div className="flex gap-1 overflow-hidden">
                                                {changeLogDetails?.labelId?.length > 0 ? (
                                                    (changeLogDetails.labelId || []).map((x, i) => {
                                                        const findObj = labelList.find((y) => y.id == x);
                                                        return (
                                                            <Badge key={i} variant={"outline"}
                                                                style={{
                                                                    color: findObj?.colorCode,
                                                                    borderColor: findObj?.colorCode,
                                                                    textTransform: "capitalize"
                                                                }}
                                                                className={`h-[20px] py-0 px-2 text-xs rounded-[5px] font-normal text-[${findObj?.colorCode}] border-[${findObj?.colorCode}] capitalize`}
                                                            >
                                                                <span
                                                                    className="max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                                                    {findObj?.name}
                                                                </span>
                                                            </Badge>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-muted-foreground">Select label</span>
                                                )}
                                            </div>
                                            {Icon.popoverChevronsUpDown}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command className="w-full">
                                            <CommandInput placeholder="Search labels..." className="h-8" />
                                            <CommandList>
                                                <CommandEmpty>No labels found.</CommandEmpty>
                                                <CommandGroup className={'max-h-[200px] overflow-y-auto smooth-scroll'}
                                                    ref={listRef} onWheel={handleWheelScroll}
                                                    onTouchMove={handleTouchScroll}>
                                                    {(labelList || []).map((label) => (
                                                        <CommandItem key={label.id} value={label.id.toString()}
                                                            className="p-0 cursor-pointer gap-1"
                                                            onSelect={() => {
                                                                onChangeLabel(label.id.toString());
                                                            }}
                                                        >
                                                            <Checkbox
                                                                className="m-2"
                                                                checked={changeLogDetails.labelId.includes(label.id.toString())}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onChangeLabel(label.id.toString());
                                                                }}
                                                            />
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <Circle fill={label.colorCode} stroke={label.colorCode}
                                                                    className="w-[10px] h-[10px]" />
                                                                <span
                                                                    className="max-w-[150px] truncate">{label.name}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col w-full gap-2 md:max-w-[288px]">
                                <Label htmlFor="label" className={"font-medium"}>Assign to</Label>
                                <Select onValueChange={handleValueChange} value={[]}>
                                    <SelectTrigger className={"h-9"}>
                                        <SelectValue className={"text-muted-foreground text-sm"}>
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
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {(memberList || []).map((x, i) => (
                                                <SelectItem className={"p-2"} key={i} value={x.userId?.toString()}>
                                                    <div className={"flex gap-2"}>
                                                        <div onClick={() => handleValueChange(x.userId.toString())}
                                                            className="checkbox-icon">
                                                            {changeLogDetails.assignToId?.includes(x.userId.toString()) ?
                                                                <Check size={18} /> :
                                                                <div className={"h-[18px] w-[18px]"} />}
                                                        </div>
                                                        <span>{x.firstName ? x.firstName : ''} {x.lastName ? x.lastName : ''}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className={"flex flex-wrap md:flex-nowrap gap-4 items-end"}>
                            <div className={"flex flex-col w-full gap-2 md:max-w-[288px]"}>
                                <Label htmlFor="label" className={"font-medium"}>Category</Label>
                                <Select
                                    value={changeLogDetails && changeLogDetails.categoryId && changeLogDetails.categoryId.toString()}
                                    onValueChange={onChangeCategory}>
                                    <SelectTrigger className="h-9">
                                        {changeLogDetails?.categoryId ? (
                                            <SelectValue>
                                                {categoriesList.find(x => x.id.toString() === changeLogDetails.categoryId.toString())?.name}
                                            </SelectValue>
                                        ) : (<span className="text-muted-foreground">Select a category</span>)}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {(categoriesList || []).map((x, i) => {
                                                return (
                                                    <SelectItem key={i} value={x.id.toString()}>{x.title}</SelectItem>
                                                )
                                            })
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col w-full gap-2 md:max-w-[288px]">
                                <Label htmlFor="date" className={"font-medium"}>Published
                                    at {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</Label>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button id="date" variant={"outline"}
                                            disabled={projectDetailsReducer.plan === 0}
                                            className={"justify-between hover:bg-card text-left font-normal d-flex px-3 h-9 text-muted-foreground hover:text-muted-foreground bg-card"}
                                        >
                                            {changeLogDetails.publishedAt ? dayjs(changeLogDetails.publishedAt).format("LL") : "Select date"}<CalendarIcon
                                                className="mr-2 h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                                        <Calendar className={"pointer-events-auto"}
                                            mode="single"
                                            captionLayout="dropdown"
                                            showOutsideDays={false}
                                            selected={changeLogDetails.publishedAt ? new Date(changeLogDetails.publishedAt) : new Date()}
                                            onSelect={(date) => onDateChange("publishedAt", date)}
                                            startMonth={new Date(2024, 0)}
                                            endMonth={new Date(2050, 12)}
                                            hideNavigation
                                            defaultMonth={changeLogDetails.publishedAt ? new Date(changeLogDetails.publishedAt) : new Date()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className={`flex flex-wrap md:flex-nowrap gap-4 ${(isFutureDate && changeLogDetails.expiredBoolean === 1) ? "items-end" : "items-start"}`}>
                            <div className={"order-2 md:order-1 flex flex-col gap-2 w-full md:max-w-[288px]"}>
                                <div className={"flex items-center gap-2"}>
                                    <Checkbox id={"expire_date"} disabled={projectDetailsReducer.plan === 0}
                                        checked={changeLogDetails.expiredBoolean === 1}
                                        onCheckedChange={(checked) => commonToggle("expiredBoolean", checked === true ? 1 : 0)} />
                                    <label htmlFor={"expire_date"}
                                        className={`text-sm font-medium ${changeLogDetails.expiredBoolean === 1 ? "after:ml-0.5 after:content-['*'] after:text-destructive" : ""}`}>
                                        Set Expiry Date {projectDetailsReducer.plan === 0 ? <PlanBadge title={'Starter'} /> : ""}</label>
                                </div>

                                {changeLogDetails.expiredBoolean === 1 ? (
                                    <div className="grid w-full gap-2 basis-1/2">
                                        <Popover open={popoverOpenExpired} onOpenChange={setPopoverOpenExpired}>
                                            <PopoverTrigger asChild>
                                                <Button id="date" disabled={projectDetailsReducer.plan === 0}
                                                    variant={"outline"}
                                                    className={"justify-between hover:bg-card text-left font-normal d-flex text-muted-foreground hover:text-muted-foreground bg-card"}
                                                >
                                                    {changeLogDetails?.expiredAt ? dayjs(changeLogDetails.expiredAt).format("LL") : "Select expiration date"}
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                                                <Calendar
                                                    className={"pointer-events-auto"}
                                                    mode="single"
                                                    showOutsideDays={false}
                                                    captionLayout="dropdown"
                                                    selected={changeLogDetails?.expiredAt ? new Date(changeLogDetails.expiredAt) : null}
                                                    onSelect={(date) => onDateChange("expiredAt", date)}
                                                    endMonth={new Date(2050, 12)}
                                                    startMonth={publishDate || new Date()}
                                                    disabled={isDateDisabled}
                                                    hideNavigation
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {formError.expiredAt && (
                                            <span className="text-sm text-destructive">{formError.expiredAt}</span>)}
                                    </div>
                                ) : ("")}
                            </div>
                            <div className={"order-1 md:order-2 flex flex-col w-full gap-2 md:max-w-[288px]"}>
                                {isFutureDate && (
                                    <div className="flex flex-col gap-2">
                                        <Label className={"font-medium leading-[20px]"}>Select Status</Label>
                                        <Select value={changeLogDetails.status === 2 ? "schedule" : "live"}
                                            onValueChange={handleStatusChange}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
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
                        </div>
                        <div className={"flex flex-wrap md:flex-nowrap gap-4 items-start"}>
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
                        </div>
                    </div>
                    <div className={"p-3 lg:p-8 sm:pb-0 flex flex-row gap-4"}>
                        <Button variant={"outline hover:bg-primary"} disabled={isSave} onClick={createPosts} className={`bg-primary w-[101px] font-medium text-primary-foreground`}>
                            {isSave ? (<Loader2 className=" h-4 w-4 animate-spin" />) : ("Publish Post")}
                        </Button>
                        <Button onClick={() => onClose(null, null, false)} variant={"outline"} className={`border border-primary text-sm font-medium text-primary`}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default CreateAnnouncement;
