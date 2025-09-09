import React, { Fragment, useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader } from "../ui/sheet";
import { Button } from "../ui/button";
import { ChevronsUpDown, Circle, CircleX, Dot, Loader2, Paperclip, Pencil, Trash2, X, } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { TooltipTrigger, TooltipContent, Tooltip } from "../ui/tooltip";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../ui/use-toast";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import ReactQuillEditor from "../Comman/ReactQuillEditor";
import ImageUploader from "../Comman/ImageUploader";
import {
    ActionButtons,
    CommentEditor,
    ImageGallery,
    SaveCancelButton,
    UploadButton,
    UserAvatar,
} from "../Comman/CommentEditor";
import { Skeleton } from "../ui/skeleton";
import {
    apiService,
    baseUrl,
    DO_SPACES_ENDPOINT,
    handleImageOpen,
    isContentEmpty,
    isEmpty,
    onKeyFire,
    restoreImagePaths,
} from "../../utils/constent";
import { DialogTitle } from "../ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Icon } from "../../utils/Icon";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Checkbox } from "../ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ReadMoreText } from "../Comman/ReadMoreText";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(relativeTime);


const initialStateError = { title: "", description: "", boardId: "", coverImage: "", };

const fileType = ".jpg, .jpeg, .png";

const UpdateRoadMapIdea = ({
    isOpen,
    onOpen,
    onClose,
    selectedIdea,
    setSelectedIdea,
    setSelectedRoadmap,
    selectedRoadmap,
    roadmapList,
    setRoadmapList,
    originalIdea,
    setOriginalIdea,
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const allStatusAndTypes = useSelector((state) => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
    const tagListRef = useRef(null);
    const boardListRef = useRef(null);
    const topicListRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const [commentText, setCommentText] = useState("");
    const [subCommentText, setSubCommentText] = useState({});
    const [subCommentTextEditIdx, setSubCommentTextEditIdx] = useState(null);
    const [topicLists, setTopicLists] = useState([]);
    const [commentFiles, setCommentFiles] = useState([]);
    const [subCommentFiles, setSubCommentFiles] = useState([]);
    const [deletedCommentImage, setDeletedCommentImage] = useState([]);
    const [deletedSubCommentImage, setDeletedSubCommentImage] = useState([]);
    const [roadmapStatus, setRoadmapStatus] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCreateIdea, setIsLoadingCreateIdea] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);
    const [selectedSubComment, setSelectedSubComment] = useState(null);
    const [selectedCommentIndex, setSelectedCommentIndex] = useState(null);
    const [selectedSubCommentIndex, setSelectedSubCommentIndex] = useState(null);
    const [isEditComment, setIsEditComment] = useState(false);
    const [isEditIdea, setIsEditIdea] = useState(false);
    const [isSaveComment, setIsSaveComment] = useState(false);
    const [isSaveUpdateComment, setIsSaveUpdateComment] = useState(false);
    const [isSaveUpdateSubComment, setIsSaveUpdateSubComment] = useState(false);
    const [isSaveSubComment, setIsSaveSubComment] = useState(false);
    const [formError, setFormError] = useState(initialStateError);
    const [imageSizeError, setImageSizeError] = useState("");
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [openBoardPopover, setOpenBoardPopover] = useState(false);
    const [openTopics, setOpenTopics] = useState(false);
    const [voteTipOpen, setVoteTipOpen] = useState(false);

    const handleWheelScroll = (ref) => (event) => {
        if (ref.current) {
            event.preventDefault();
            ref.current.scrollBy({
                top: event.deltaY,
                behavior: 'smooth'
            });
        }
    };

    const handleTouchScroll = (e) => {
        e.stopPropagation();
    };

    useEffect(() => {
        if (projectDetailsReducer.id) {
            setTopicLists(allStatusAndTypes.topics);
            setRoadmapStatus(allStatusAndTypes.roadmapStatus);
        }
    }, [projectDetailsReducer.id, allStatusAndTypes]);

    const handleChangeTopic = (id) => {
        const clone = [...selectedIdea?.topic];
        const index = clone.findIndex((item) => item.id === id);
        if (index !== -1) {
            clone.splice(index, 1);
        } else {
            const topicToAdd = topicLists.find((item) => item.id === id);
            if (topicToAdd) {
                clone.push(topicToAdd);
            }
        }
        setSelectedIdea({ ...selectedIdea, topic: clone });
    };

    const giveVote = async (type) => {
        const payload = { ideaId: selectedIdea?.id, type: type, };
        const data = await apiService.giveVote(payload);
        if (data.success) {
            let cloneRoadmap = [...roadmapList.columns];
            const roadmapIndex = cloneRoadmap.findIndex((x) => x.id === selectedRoadmap.id);
            if (roadmapIndex !== -1) {
                const clone = [...cloneRoadmap[roadmapIndex].ideas];
                const index = clone.findIndex((x) => x.id === selectedIdea?.id);
                if (index !== -1) {
                    let newVoteCount = clone[index].vote;
                    newVoteCount = data?.data?.removeVote ? newVoteCount - 1 : newVoteCount + 1;
                    clone[index].vote = newVoteCount;
                    clone[index].userVote = !data?.data?.removeVote;
                    const voterName = data.data.name || data.data?.firstname;
                    let voteLists = Array.isArray(clone[index]?.voteLists) ? [...clone[index].voteLists] : [];
                    const voteIndex = voteLists.findIndex((x) => (x.name || x?.firstname) === voterName);

                    if (data.data.removeVote) {
                        if (voteIndex !== -1) {
                            voteLists.splice(voteIndex, 1);
                        }
                    } else {
                        if (voteIndex === -1) {
                            voteLists.push(data.data);
                        }
                    }

                    clone[index].voteLists = voteLists;
                    cloneRoadmap[roadmapIndex] = {
                        ...cloneRoadmap[roadmapIndex],
                        ideas: clone,
                        cards: clone,
                    };
                }
            }
            setRoadmapList({ columns: cloneRoadmap });
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const onChangeTextSubComment = (e) => {
        let selectedSubCommentObj = { ...selectedSubComment, comment: e.target.value, };
        setSelectedSubComment(selectedSubCommentObj);
        let index = ((selectedComment && selectedComment.reply) || []).findIndex((x) => x.id === selectedSubComment.id);
        if (index !== -1) {
            const cloneReplay = [...selectedComment.reply];
            cloneReplay[index] = selectedSubCommentObj;
            setSelectedComment({ ...selectedComment, reply: cloneReplay });
        }
    };

    const onCreateSubComment = async (record, index) => {
        setIsSaveSubComment(true);
        let formData = new FormData();
        if (subCommentFiles[index] && subCommentFiles[index].length > 0) {
            subCommentFiles[index].forEach((file) => { formData.append("images", file); });
        }
        formData.append("comment", subCommentText[index] || "");
        formData.append("ideaId", selectedIdea?.id);
        formData.append("parentId", record.id);
        const data = await apiService.createComment(formData);

        if (data.success) {
            let cloneRoadmap = JSON.parse(JSON.stringify(roadmapList.columns));
            const roadmapIndex = cloneRoadmap.findIndex((column) => column.ideas.some((idea) => idea.id === selectedIdea?.id));

            if (roadmapIndex !== -1) {
                const ideaIndex = cloneRoadmap[roadmapIndex].ideas.findIndex((x) => x.id === selectedIdea?.id);

                if (ideaIndex !== -1) {
                    let cloneIdea = { ...cloneRoadmap[roadmapIndex].ideas[ideaIndex] };
                    const cloneComments = cloneIdea?.comments ? [...cloneIdea.comments] : [];
                    const updatedComments = cloneComments.map((comment, i) => ({
                        ...comment,
                        showReply: i === index ? true : false,
                    }));

                    const cloneSubComment = [...(updatedComments[index]?.reply || [])];
                    cloneSubComment.push(data.data);
                    updatedComments[index]["reply"] = cloneSubComment;
                    updatedComments[index]["showReply"] = true;

                    cloneIdea = { ...cloneIdea, comments: updatedComments };
                    cloneRoadmap[roadmapIndex].ideas[ideaIndex] = cloneIdea;
                    cloneRoadmap[roadmapIndex].cards = [...cloneRoadmap[roadmapIndex].ideas,];

                    setRoadmapList({ columns: cloneRoadmap });
                    setSelectedIdea(cloneIdea);
                }
            }

            setSubCommentText((prev) => ({ ...prev, [index]: "", }));
            setSubCommentFiles((prev) => ({ ...prev, [index]: [], }));
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
        setIsSaveSubComment(false);
    };

    const onCreateComment = async () => {
        setIsSaveComment(true);
        let formData = new FormData();
        for (let i = 0; i < commentFiles.length; i++) {
            formData.append(`images`, commentFiles[i]);
        }
        formData.append("comment", commentText);
        formData.append("ideaId", selectedIdea?.id);
        formData.append("parentId", "");
        const data = await apiService.createComment(formData);

        if (data.success) {
            setIsSaveComment(false);
            let cloneRoadmap = JSON.parse(JSON.stringify(roadmapList.columns));
            const roadmapIndex = cloneRoadmap.findIndex((column) => column.ideas.some((idea) => idea.id === selectedIdea?.id));

            if (roadmapIndex !== -1) {
                const ideaIndex = cloneRoadmap[roadmapIndex].ideas.findIndex((x) => x.id === selectedIdea?.id);

                if (ideaIndex !== -1) {
                    let cloneIdea = { ...cloneRoadmap[roadmapIndex].ideas[ideaIndex] };
                    const cloneComments = cloneIdea.comments ? [...cloneIdea.comments] : [];
                    cloneComments.unshift(data.data);
                    cloneIdea = { ...cloneIdea, comments: cloneComments };

                    cloneRoadmap[roadmapIndex].ideas[ideaIndex] = cloneIdea;
                    cloneRoadmap[roadmapIndex].cards = [...cloneRoadmap[roadmapIndex].ideas,];

                    setRoadmapList({ columns: cloneRoadmap });
                    setSelectedIdea(cloneIdea);
                }
            }

            toast({ description: data.message });
            setCommentText("");
            setCommentFiles([]);
        } else {
            setIsSaveComment(false);
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const onUpdateComment = async () => {
        setIsSaveUpdateComment(true);
        let formData = new FormData();
        if (selectedComment?.images?.length) {
            for (let i = 0; i < selectedComment.images.length; i++) {
                formData.append(`images`, selectedComment.images[i]);
            }
        }
        for (let i = 0; i < deletedCommentImage.length; i++) {
            formData.append(`removeImages[${i}]`, deletedCommentImage[i]);
        }
        formData.append("comment", selectedComment.comment);
        const data = await apiService.updateComment(selectedComment.id, formData);
        if (data.success) {
            let cloneRoadmap = JSON.parse(JSON.stringify(roadmapList.columns));
            const roadmapIndex = cloneRoadmap.findIndex((column) => column.ideas.some((idea) => idea.id === selectedIdea?.id));
            if (roadmapIndex !== -1) {
                const ideaIndex = cloneRoadmap[roadmapIndex].ideas.findIndex((x) => x.id === selectedIdea?.id);
                if (ideaIndex !== -1) {
                    let updatedIdeas = [...cloneRoadmap[roadmapIndex].ideas];
                    let updatedIdea = { ...updatedIdeas[ideaIndex] };
                    const updatedComments = updatedIdea.comments ? [...updatedIdea.comments] : [];
                    updatedComments[selectedCommentIndex] = { ...selectedComment, images: data.data.images, isEdited: true };
                    updatedIdea.comments = updatedComments;
                    updatedIdeas[ideaIndex] = updatedIdea;
                    cloneRoadmap[roadmapIndex] = { ...cloneRoadmap[roadmapIndex], ideas: updatedIdeas, cards: updatedIdeas, };
                    setRoadmapList({ columns: cloneRoadmap });
                    setSelectedIdea(updatedIdea);
                }
            }
            setSelectedCommentIndex(null);
            setSelectedComment(null);
            setIsEditComment(false);
            setDeletedCommentImage([]);
            setIsSaveUpdateComment(false);
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
            setIsSaveUpdateComment(false);
        }
    };

    const onUpdateSubComment = async () => {
        setIsSaveUpdateSubComment(true);
        let formData = new FormData();
        if (selectedSubComment?.images?.length) {
            for (let i = 0; i < selectedSubComment.images.length; i++) {
                formData.append(`images`, selectedSubComment.images[i]);
            }
        }
        for (let i = 0; i < deletedSubCommentImage.length; i++) {
            formData.append(`removeImages[${i}]`, deletedSubCommentImage[i]);
        }
        formData.append("comment", selectedSubComment.comment);
        const data = await apiService.updateComment(selectedSubComment.id, formData);
        if (data.success) {
            let cloneRoadmap = JSON.parse(JSON.stringify(roadmapList.columns));
            const roadmapIndex = cloneRoadmap.findIndex((column) => column.ideas.some((idea) => idea.id === selectedIdea?.id));
            if (roadmapIndex !== -1) {
                const ideaIndex = cloneRoadmap[roadmapIndex].ideas.findIndex((x) => x.id === selectedIdea?.id);
                if (ideaIndex !== -1) {
                    let updatedIdeas = [...cloneRoadmap[roadmapIndex].ideas];
                    let updatedIdea = { ...updatedIdeas[ideaIndex] };
                    const updatedComments = updatedIdea.comments ? [...updatedIdea.comments] : [];
                    if (updatedComments[selectedCommentIndex]?.reply) {
                        const updatedReplies = [...updatedComments[selectedCommentIndex].reply,];
                        updatedReplies[selectedSubCommentIndex] = { ...data.data, isEdited: true };
                        updatedComments[selectedCommentIndex].reply = updatedReplies;
                    }
                    updatedIdea.comments = updatedComments;
                    updatedIdeas[ideaIndex] = updatedIdea;
                    cloneRoadmap[roadmapIndex] = { ...cloneRoadmap[roadmapIndex], ideas: updatedIdeas, cards: updatedIdeas, };
                    setRoadmapList({ columns: cloneRoadmap });
                    setSelectedIdea(updatedIdea);
                }
            }
            setSelectedCommentIndex(null);
            setSelectedComment(null);
            setSelectedSubComment(null);
            setSelectedSubCommentIndex(null);
            setDeletedSubCommentImage([]);
            setIsSaveUpdateSubComment(false);
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
            setIsSaveUpdateSubComment(false);
        }
    };

    const deleteComment = async (id, index) => {
        const data = await apiService.deleteComment(id);
        if (data.success) {
            let finalUpdatedIdea = null;

            const newColumns = roadmapList.columns.map((column) => {
                if (column.id !== selectedIdea?.roadmapStatusId) {
                    return column;
                }
                const ideaIndex = column.ideas.findIndex((idea) => idea.id === selectedIdea.id);

                if (ideaIndex === -1) {
                    return column;
                }

                const updatedIdeas = [...column.ideas];
                const originalIdea = updatedIdeas[ideaIndex];

                const updatedIdea = { ...originalIdea, comments: originalIdea.comments.filter((_, i) => i !== index), };
                updatedIdeas[ideaIndex] = updatedIdea;
                finalUpdatedIdea = updatedIdea;

                return {
                    ...column,
                    ideas: updatedIdeas,
                    cards: updatedIdeas,
                };
            });

            if (finalUpdatedIdea) {
                setRoadmapList({ columns: newColumns });
                setSelectedIdea(finalUpdatedIdea);
            } else {
                toast({ variant: "destructive", description: "No idea was updated, state not changed." });
            }

            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const deleteSubComment = async (id, record, index, subIndex) => {
        const data = await apiService.deleteComment(id);
        if (data.success) {
            let finalUpdatedIdea = null;

            const newColumns = roadmapList.columns.map((column) => {
                if (column.id !== selectedIdea?.roadmapStatusId) {
                    return column;
                }
                const ideaIndex = column.ideas.findIndex((idea) => idea.id === selectedIdea.id);
                if (ideaIndex === -1) {
                    return column;
                }

                const updatedIdeas = [...column.ideas];
                const updatedIdea = { ...updatedIdeas[ideaIndex] };

                const updatedComments = updatedIdea.comments.map((comment, i) => {
                    if (i === index) {
                        const newReplies = comment.reply.filter((_, j) => j !== subIndex);

                        return {
                            ...comment,
                            reply: newReplies,
                        };
                    }
                    return comment;
                });
                updatedIdea.comments = updatedComments;
                updatedIdeas[ideaIndex] = updatedIdea;
                finalUpdatedIdea = updatedIdea;

                return {
                    ...column,
                    ideas: updatedIdeas,
                    cards: updatedIdeas,
                };
            });

            if (finalUpdatedIdea) {
                setRoadmapList({ columns: newColumns });
                setSelectedIdea(finalUpdatedIdea);
            } else {
                toast({ variant: "destructive", description: "No idea was updated, state not changed." });
            }
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const onEditComment = (record, index) => {
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
        setDeletedSubCommentImage([]);
        const updatedComments = selectedIdea.comments.map((comment, i) => ({ ...comment, showReply: i === index ? comment.showReply : false, }));
        setSelectedIdea({ ...selectedIdea, comments: updatedComments });
        setSubCommentTextEditIdx(null);
        setSubCommentText({});
        setSubCommentFiles({});
        setSelectedComment({ ...record, images: record.images || [] });
        setSelectedCommentIndex(index);
        setIsEditComment(true);
    };

    const onEditSubComment = (record, subRecord, index, subIndex) => {
        setIsEditComment(false);
        setDeletedCommentImage([]);

        setSelectedComment(record);
        setSelectedCommentIndex(index);
        setSelectedSubComment(subRecord);
        setSelectedSubCommentIndex(subIndex);
    };

    const onCancelComment = (index) => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setIsEditComment(false);
        setSubCommentTextEditIdx(index);
    };

    const onCancelSubComment = () => {
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
    };

    const onShowSubComment = (index) => {
        const updatedComments = selectedIdea.comments.map((comment, i) => ({ ...comment, showReply: i === index ? !comment.showReply : false, }));
        setSelectedIdea({ ...selectedIdea, comments: updatedComments });
        setSubCommentText({});
        setSubCommentFiles({});
        setSubCommentTextEditIdx(null);
        if (updatedComments[index].showReply) {
            setSubCommentTextEditIdx(index);
            setSubCommentText((prev) => ({ ...prev, [index]: "", }));
            setSubCommentFiles((prev) => ({ ...prev, [index]: [], }));
        }
    };

    const handleFeatureImgUpload = async (event) => {
        const file = event.target?.files[0];
        setSelectedIdea({ ...selectedIdea, coverImage: file });
        let formData = new FormData();
        formData.append("coverImage", file);
        setIsLoading(true);
        const data = await apiService.updateIdea(formData, selectedIdea?.id);
        if (data.success) {
            let cloneRoadmap = JSON.parse(JSON.stringify(roadmapList.columns));
            const roadmapIndex = cloneRoadmap.findIndex((column) => column.ideas.some((idea) => idea.id === selectedIdea?.id));
            if (roadmapIndex !== -1) {
                const ideaIndex = cloneRoadmap[roadmapIndex].ideas.findIndex((x) => x.id === selectedIdea?.id);
                if (ideaIndex !== -1) {
                    cloneRoadmap[roadmapIndex].ideas[ideaIndex] = data.data;
                    cloneRoadmap[roadmapIndex].cards = [...cloneRoadmap[roadmapIndex].ideas,];
                    setRoadmapList({ columns: cloneRoadmap });
                    setSelectedIdea(data.data);
                    setOriginalIdea(data.data);
                }
            }
            setIsLoading(false);
            toast({ description: data.message });
        } else {
            setIsLoading(false);
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const handleAddCommentImg = (event, isEdit = false) => {
        const files = Array.from(event.target.files);
        const existingImages = isEdit && selectedComment && selectedComment.images ? selectedComment.images.length : commentFiles.length;
        const remainingSlots = 5 - existingImages;
        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024).filter(file => file.type.includes("image")).slice(0, remainingSlots);

        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast({ variant: "destructive", description: "Some files exceeded the 5MB limit." });
        }

        const invalidTypeFiles = files.filter(file => !file.type.includes("image"));
        if (invalidTypeFiles.length > 0) {
            toast({ variant: "destructive", description: "Only image files are allowed." });
        }

        if (isEdit && selectedComment && selectedComment.id) {
            const images = Array.isArray(selectedComment.images) ? selectedComment.images : [];
            const clone = [...images, ...validFiles];
            setSelectedComment({ ...selectedComment, images: clone });
        } else {
            setCommentFiles([...commentFiles, ...validFiles]);
        }
        event.target.value = "";
    };

    const handleSubCommentUploadImg = (event, index) => {
        const files = Array.from(event.target.files);
        let remainingSlots;
        if (selectedSubComment && selectedSubComment.id) {
            const currentImages = selectedSubComment.images?.length || 0;
            remainingSlots = 5 - currentImages;
        } else {
            const currentFiles = subCommentFiles[index]?.length || 0;
            remainingSlots = 5 - currentFiles;
        }

        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024).filter(file => file.type.includes("image")).slice(0, remainingSlots);

        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast({ variant: "destructive", description: "Some files exceeded the 5MB limit." });
        }

        const invalidTypeFiles = files.filter(file => !file.type.includes("image"));
        if (invalidTypeFiles.length > 0) {
            toast({ variant: "destructive", description: "Only image files are allowed." });
        }

        if (selectedSubComment && selectedSubComment.id && selectedComment && selectedComment.id) {
            const images = Array.isArray(selectedSubComment.images) ? selectedSubComment.images : [];
            const newImages = [...images, ...validFiles];
            const updatedSubComment = { ...selectedSubComment, images: newImages };
            setSelectedSubComment(updatedSubComment);

            const replyIndex = (selectedComment.reply || []).findIndex(reply => reply.id === selectedSubComment.id);
            if (replyIndex !== -1) {
                const updatedReplies = [...selectedComment.reply];
                updatedReplies[replyIndex] = updatedSubComment;
                setSelectedComment({ ...selectedComment, reply: updatedReplies });
            }
        } else {
            setSubCommentFiles(prev => {
                const newFiles = { ...prev };
                newFiles[index] = [...(newFiles[index] || []), ...validFiles];
                return newFiles;
            });
        }
        event.target.value = "";
    };

    const onDeleteCommentImage = (index) => {
        const cloneImages = [...selectedComment.images];
        const isServerImage = typeof cloneImages[index] === "string";
        if (isServerImage) {
            const cloneDeletedImages = [...deletedCommentImage];
            cloneDeletedImages.push(cloneImages[index]);
            cloneImages.splice(index, 1);
            setDeletedCommentImage(cloneDeletedImages);
        } else {
            cloneImages.splice(index, 1);
        }
        setSelectedComment({ ...selectedComment, images: cloneImages, });
    };

    const onDeleteSubCommentImage = (index, isOld) => {
        if (isOld) {
            const cloneImages = [...selectedSubComment.images];
            const cloneDeletedImages = [...deletedSubCommentImage];
            cloneDeletedImages.push(cloneImages[index]);
            cloneImages.splice(index, 1);
            setSelectedSubComment({ ...selectedSubComment, images: cloneImages, });
            setDeletedSubCommentImage(cloneDeletedImages);
        } else {
            const cloneNewImages = [...selectedSubComment.images];
            cloneNewImages.splice(index, 1);
            setSelectedSubComment({ ...selectedSubComment, images: cloneNewImages, });
        }
    };

    const onDeleteSubCommentImageOld = (commentIndex, fileIndex) => {
        setSubCommentFiles((prev) => {
            const newFiles = { ...prev };
            if (newFiles[commentIndex]) {
                newFiles[commentIndex] = newFiles[commentIndex].filter((_, idx) => idx !== fileIndex);
            }
            return newFiles;
        });
    };

    const onChangeStatus = async (name, value) => {
        let updatedIdea = { ...selectedIdea, [name]: value };

        if (name === "removeCoverImage") {
            updatedIdea.coverImage = "";
        }

        setSelectedIdea(updatedIdea);

        let formData = new FormData();
        if (name === "roadmapStatusId" && value === null) value = "";
        formData.append(name, value);

        const res = await apiService.updateIdea(formData, selectedIdea?.id);

        if (res.success) {
            let cloneRoadmap = [...roadmapList.columns];

            if (name === "pin_to_top") {
                const currentRoadmapIndex = cloneRoadmap.findIndex((col) => col.ideas.some((idea) => idea.id === selectedIdea?.id));
                if (currentRoadmapIndex === -1) {
                    return;
                }
                const ideaIndex = cloneRoadmap[currentRoadmapIndex].ideas.findIndex((i) => i.id === selectedIdea?.id);
                if (value == 1) {
                    cloneRoadmap[currentRoadmapIndex].ideas.splice(ideaIndex, 1);
                    cloneRoadmap[currentRoadmapIndex].ideas.unshift(res.data);
                } else {
                    cloneRoadmap[currentRoadmapIndex].ideas[ideaIndex] = res.data;
                }

                cloneRoadmap[currentRoadmapIndex].cards = [...cloneRoadmap[currentRoadmapIndex].ideas,];
                setSelectedIdea(res.data);
            } else if (name === "roadmapStatusId") {
                const currentRoadmapIndex = cloneRoadmap.findIndex((col) => col.ideas.some((idea) => idea.id === selectedIdea?.id));

                if (currentRoadmapIndex !== -1) {
                    const ideaIndex = cloneRoadmap[currentRoadmapIndex].ideas.findIndex((i) => i.id === selectedIdea?.id);
                    if (ideaIndex !== -1) {
                        cloneRoadmap[currentRoadmapIndex].ideas.splice(ideaIndex, 1);
                        cloneRoadmap[currentRoadmapIndex].cards = [...cloneRoadmap[currentRoadmapIndex].ideas,];
                    }
                }
                const newRoadmapIndex = cloneRoadmap.findIndex((col) => col.id == value);
                if (newRoadmapIndex !== -1) {
                    cloneRoadmap[newRoadmapIndex].ideas.push(res.data);
                    cloneRoadmap[newRoadmapIndex].cards = [
                        ...cloneRoadmap[newRoadmapIndex].ideas,
                    ];
                    setSelectedRoadmap(cloneRoadmap[newRoadmapIndex]);
                } else {
                    console.warn("❌ Target roadmap column not found →", value);
                }

                setSelectedIdea(res.data);
            } else {
                const currentRoadmapIndex = cloneRoadmap.findIndex((col) => col.ideas.some((idea) => idea.id === selectedIdea?.id));
                if (currentRoadmapIndex === -1) {
                    console.warn("❌ Idea not found in any roadmap column!");
                    return;
                }
                const ideaIndex = cloneRoadmap[currentRoadmapIndex].ideas.findIndex((i) => i.id === selectedIdea?.id);
                cloneRoadmap[currentRoadmapIndex].ideas[ideaIndex] = res.data;
                cloneRoadmap[currentRoadmapIndex].cards = [...cloneRoadmap[currentRoadmapIndex].ideas,];
            }

            setRoadmapList({ columns: cloneRoadmap });
            setIsLoading(false);
            setIsEditIdea(false);
            toast({ description: res.message });
        } else {
            setIsLoading(false);
            toast({ variant: "destructive", description: res?.error?.message });
        }
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Title is required";
                } else {
                    return "";
                }
            case "boardId":
                if (!value || value?.toString()?.trim() === "") {
                    return "Board is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onChangeText = (event) => {
        const { name, value } = event.target;
        const trimmedValue = name === "title" || name === "description" ? value.trimStart() : value;
        setSelectedIdea((prev) => ({ ...prev, [name]: trimmedValue }));
        setFormError((prev) => ({ ...prev, [name]: formValidate(name, trimmedValue), }));
        if (name === "description" && imageSizeError) {
            setImageSizeError("");
        }
    };

    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    "image/jpeg",
                    0.7
                );
            };
            img.onerror = (err) => reject(err);
        });
    };

    const generateImageKey = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "#";
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }
        return result;
    };

    const transformDescription = (description, descriptionImages) => {
        if (!description)
            return {
                transformedHtml: description,
                keysToDelete: [],
                updatedImages: [],
            };

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
                const existingImg = descriptionImages.find((imgObj) => imgObj.key === imageUrl);
                if (existingImg) {
                    updatedImages.push(existingImg);
                }
            } else if (imageUrl.includes(DO_SPACES_ENDPOINT)) {
                const filename = imageUrl.split("/").pop();
                const existingImg = descriptionImages.find((imgObj) => imgObj.path.includes(filename) || imgObj.fullPath?.includes(filename));
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
            updatedImages: descriptionImages.filter((img) => currentImageKeys.includes(img.key)),
        };
    };

    const deleteImages = async (keysToDelete) => {
        const payload = {
            keys: keysToDelete.map((key) => (key?.fullPath ? key?.fullPath : key?.path)).filter((path) => path),
        };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {
        } else {
            toast({ description: response.error?.message || "Failed to delete images", variant: "destructive", });
        }
    };

    const onUpdateIdea = async (load) => {
        const trimmedTitle = selectedIdea.title ? selectedIdea.title.trim() : "";
        const trimmedDescription = selectedIdea.description ? selectedIdea.description.trim() : "";
        const updatedIdea = { ...selectedIdea, title: trimmedTitle, description: trimmedDescription, };
        setSelectedIdea(updatedIdea);
        let validationErrors = {};
        Object.keys(selectedIdea).forEach((name) => {
            const error = formValidate(name, selectedIdea[name]);
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
        setIsLoadingCreateIdea(load);
        let formData = new FormData();
        let topics = [];

        (selectedIdea?.topic || []).map((x) => { topics.push(x.id); });
        formData.append("title", selectedIdea?.title);
        formData.append("boardId", selectedIdea.boardId);
        formData.append("slugUrl", selectedIdea?.title ? selectedIdea?.title.replace(/ /g, "-").replace(/\?/g, "-") : "");
        const { transformedHtml, keysToDelete } = transformDescription(
            selectedIdea.description,
            selectedIdea.descriptionImages || []
        );
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete]),].filter((key) => key !== null && key !== undefined && key !== "");
        formData.append("description", transformedHtml);
        topics.forEach((id) => { formData.append("topicId[]", id); });
        if (selectedIdea.descriptionImages.length > 0) {
            formData.append(
                "descriptionImages",
                JSON.stringify(
                    selectedIdea.descriptionImages.map((img) => ({
                        key: img.key,
                        path: img.path.includes("/") ? img.path.split("/").pop() : img.path,
                    }))
                )
            );
        }
        if (selectedIdea.image) {
            const resizedImage = await resizeImage(selectedIdea.image);
            formData.append("image", resizedImage);
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.updateIdea(formData, selectedIdea?.id);
        setIsLoadingCreateIdea('');
        if (data.success) {
            setImagesToDelete([]);
            let cloneRoadmap = [...roadmapList.columns];
            const roadmapIndex = cloneRoadmap.findIndex((x) => x.id === selectedIdea?.roadmapStatusId);
            if (roadmapIndex !== -1) {
                const ideaIndex = cloneRoadmap[roadmapIndex].ideas.findIndex((x) => x.id === selectedIdea?.id);
                if (ideaIndex !== -1) {
                    cloneRoadmap[roadmapIndex].ideas[ideaIndex] = { ...data.data };
                    cloneRoadmap[roadmapIndex].cards = [...cloneRoadmap[roadmapIndex].ideas,];
                }
            }
            setRoadmapList({ columns: cloneRoadmap });
            setSelectedIdea({ ...data.data });
            setOriginalIdea({ ...data.data });
            setIsEditIdea(false);
            setImageSizeError("");
            toast({ description: data.message });
        } else {
            toast({ variant: "destructive", description: data?.error?.message });
        }
    };

    const openEdit = () => {
        setIsEditIdea(true);
    };

    const handleOnUpdateCancel = () => {
        setFormError(initialStateError);
        setSelectedIdea({ ...originalIdea });
        setIsEditIdea(false);
    };

    const onDeleteImageComment = (index) => {
        const clone = [...commentFiles];
        clone.splice(index, 1);
        setCommentFiles(clone);
    };

    const onCloseBoth = () => {
        onClose();
        setIsEditIdea(false);
        setCommentText("");
        setSubCommentText("");
        setSelectedComment(null);
        setSelectedCommentIndex(null);
        setSelectedSubComment(null);
        setSelectedSubCommentIndex(null);
    };

    const handleSubCommentTextChange = (e, index) => {
        setSubCommentText((prev) => ({ ...prev, [index]: e.target.value, }));
    };

    const setImages = (updater) => {
        setSelectedIdea((prev) => {
            const updatedImages = typeof updater === "function" ? updater(prev) : updater;
            return { ...prev, ...updatedImages };
        });
    };

    const onRedirectToUser = () => {
        if (selectedIdea?.createdBy !== 1) {
            navigate(`${baseUrl}/user?search=${encodeURIComponent(selectedIdea?.name || selectedIdea?.userName || '')}`);
        }
    }

    const plan = projectDetailsReducer?.plan;
    let filteredBoards = (allStatusAndTypes?.boards || []);
    if (plan === 0) {
        filteredBoards = filteredBoards.slice(0, 1);
    } else if (plan === 1) {
        filteredBoards = filteredBoards.slice(0, 5);
    } else if (plan === 2) {
        filteredBoards = filteredBoards.slice(0, 10);
    }

    return (
        <Fragment>
            <Sheet open={isOpen} onOpenChange={isOpen ? onCloseBoth : onOpen}>
                <SheetContent className={"lg:max-w-[1101px] md:max-w-[720px] sm:max-w-full p-0"}>
                    <SheetHeader className={"px-4 py-3 md:py-5 lg:px-8 lg:py-[20px] border-b flex-row justify-between items-center"}>
                        <DialogTitle>
                            <X onClick={onCloseBoth} className={"cursor-pointer"} />
                        </DialogTitle>
                        {
                            isEditIdea && (
                                <SaveCancelButton className={"m-0"} classBtnSave={"h-[24px]"} classBtnCancel={"h-[24px]"}
                                    onClickSave={() => onUpdateIdea("createdByTop")}
                                    load={isLoadingCreateIdea === "createdByTop"}
                                    onClickCancel={handleOnUpdateCancel}
                                />)
                        }
                    </SheetHeader>
                    <div className={`flex flex-wrap w-full ${selectedIdea?.comments?.length > 2 ? "h-[calc(100vh_-_100px)]" : "h-[calc(100vh_-_50px)]"} sm:h-[calc(100vh_-_65px)] overflow-y-auto`} ref={scrollContainerRef}
                    >
                        {/*<div className={`w-full lg:w-1/3 border-r lg:overflow-auto`}>*/}
                        <div className={`w-full lg:w-1/3 lg:sticky lg:top-0 lg:self-start lg:h-[calc(100vh_-_100px)] border-r overflow-y-auto`}>
                            <div className="py-3 px-4 md:py-5 md:px-6 w-full space-y-1.5 border-b">
                                <Label htmlFor="picture" className={"font-medium capitalize"}>Featured image</Label>
                                <div className="flex gap-1">
                                    <ImageUploader
                                        imageWidth={"w-full"}
                                        className={"w-full"}
                                        image={selectedIdea?.coverImage}
                                        onDelete={() =>
                                            onChangeStatus(
                                                "removeCoverImage",
                                                selectedIdea &&
                                                    selectedIdea?.coverImage &&
                                                    selectedIdea?.coverImage?.name ? "" : [selectedIdea?.coverImage]
                                            )
                                        }
                                        onUpload={handleFeatureImgUpload}
                                        altText="Cover Image"
                                    />
                                </div>
                            </div>
                            <div className="py-3 px-4 md:py-5 md:px-6 w-full space-y-4 border-b">
                                <div className={"flex gap-4 items-center"}>
                                    <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Upvoters</Label>
                                    <div className={"flex gap-2 items-center w-full"}>
                                        <div className={"flex gap-1 items-center"}>
                                            <Tooltip open={voteTipOpen}>
                                                <TooltipTrigger
                                                    asChild
                                                    onMouseEnter={() => setVoteTipOpen(true)}
                                                    onMouseLeave={() => setVoteTipOpen(false)}
                                                    onFocus={() => setVoteTipOpen(false)}
                                                    onBlur={() => setVoteTipOpen(false)}
                                                >
                                                    <Button className={"w-[30px] h-[30px] border"} variant={"plain"} onClick={() => giveVote(1)}>
                                                        <span className={`inline-block w-5 h-5`}
                                                            style={{
                                                                fill: selectedIdea?.userVote ? "#7c3aed" : "#6b7280",
                                                                color: selectedIdea?.userVote ? "#7c3aed" : "#6b7280",
                                                            }}
                                                        >{Icon.caretUp}</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className={"font-normal text-sm"}>
                                                    Vote
                                                </TooltipContent>
                                            </Tooltip>
                                            <p className={"text-sm font-normal"}>{selectedIdea?.vote}</p>
                                        </div>
                                        {selectedIdea && selectedIdea?.voteLists && selectedIdea?.voteLists.length ? (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost hover-none" className={"rounded-full p-0 h-[24px]"}>
                                                        {(selectedIdea.voteLists.slice(0, 1) || []).map((x, sivlIdx) => {
                                                            return (
                                                                <div className={"flex"} key={sivlIdx}>
                                                                    <div className={"relative"}>
                                                                        <div className={"update-idea text-sm rounded-full text-center"}>
                                                                            <UserAvatar
                                                                                userPhoto={x.profileImage}
                                                                                userName={x.name ? x.name : x?.username}
                                                                                className="w-[20px] h-[20px]"
                                                                                initialStyle={"text-sm"}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    {selectedIdea?.voteLists.length > 1 && (
                                                                        <div className={"update-idea text-sm rounded-full border text-center ml-[-5px]"}>
                                                                            <Avatar>
                                                                                <AvatarFallback>
                                                                                    +{selectedIdea?.voteLists.length - 1}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0" align={"start"}>
                                                    <div>
                                                        <div className="py-3 px-4">
                                                            <h4 className="font-normal leading-none text-sm">{`Voters (${selectedIdea?.voteLists.length})`}</h4>
                                                        </div>
                                                        <div className="border-t px-4 py-3 space-y-2">
                                                            {(selectedIdea?.voteLists || []).map(
                                                                (x, sivliddx) => {
                                                                    return (
                                                                        <div className={"flex gap-2"} key={sivliddx}>
                                                                            <div className={"update-idea text-sm rounded-full text-center"}>
                                                                                <UserAvatar
                                                                                    userPhoto={x.profileImage}
                                                                                    userName={x?.name ? x?.name : x?.username}
                                                                                    className="w-[20px] h-[20px]"
                                                                                    initialStyle={"text-sm"}
                                                                                />
                                                                            </div>
                                                                            <h4 className={"text-sm font-normal"}>
                                                                                {(x?.name ? x?.name : x?.username) || "Unknown"}
                                                                            </h4>
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ) : ("")}
                                    </div>
                                </div>
                                <div className={"flex gap-4 items-center"}>
                                    <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Status</Label>
                                    <Select
                                        onValueChange={(value) => onChangeStatus("roadmapStatusId", value)}
                                        value={selectedIdea?.roadmapStatusId}
                                    >
                                        <SelectTrigger className="w-[224px] h-[28px] px-3 py-1">
                                            <SelectValue>
                                                {selectedIdea?.roadmapStatusId ? (
                                                    <div className="flex items-center gap-2">
                                                        <Circle
                                                            fill={allStatusAndTypes.roadmapStatus.find((status) => status.id === selectedIdea?.roadmapStatusId)?.colorCode}
                                                            stroke={allStatusAndTypes.roadmapStatus.find((status) => status.id === selectedIdea?.roadmapStatusId)?.colorCode}
                                                            className="w-[10px] h-[10px]"
                                                        />
                                                        <span className={"max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}>
                                                            {allStatusAndTypes.roadmapStatus.find((status) => status.id === selectedIdea?.roadmapStatusId)?.title ?? "Unassigned"}
                                                        </span>
                                                    </div>
                                                ) : (<span className="text-gray-500">Unassigned</span>)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={null}>
                                                    <div className={"flex items-center gap-2"}>Unassigned</div>
                                                </SelectItem>
                                                {(roadmapStatus || []).map((x, i) => {
                                                    return (
                                                        <SelectItem key={i} value={x.id}>
                                                            <div className={"flex items-center gap-2"}>
                                                                <Circle
                                                                    fill={x.colorCode}
                                                                    stroke={x.colorCode}
                                                                    className={` w-[10px] h-[10px]`}
                                                                />
                                                                {x.title ? x.title : "Unassigned"}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className={"flex gap-4"}>
                                    <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Tags</Label>
                                    <div className="flex gap-1 flex-wrap">
                                        {selectedIdea?.topic?.length > 0 ? (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"ghost hover:none"} className={"p-0 h-[24px]"}>
                                                        <div className={"flex justify-between items-center gap-0.5"}>
                                                            <div className={"text-sm text-center"}>
                                                                <div className={`text-xs bg-[#FBFBFF] border-gray-[#dee1ea80] border truncate py-1 px-2 font-medium text-[#5b678f] rounded-md`}>
                                                                    {selectedIdea?.topic[0]?.title}
                                                                </div>
                                                            </div>
                                                            {selectedIdea?.topic?.length > 1 && (
                                                                <div className={"update-idea text-sm rounded-full border text-center"}>
                                                                    <Avatar>
                                                                        <AvatarFallback>+{selectedIdea?.topic?.length - 1}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0" align={"start"}>
                                                    <div>
                                                        <div className={"py-3 px-4"}>
                                                            <h4 className="font-normal leading-none text-sm">{`Topics (${selectedIdea?.topic?.length})`}</h4>
                                                        </div>
                                                        <div className="border-t px-4 py-3 space-y-2 max-h-[200px] overflow-y-auto smooth-scroll" ref={tagListRef} onWheel={handleWheelScroll(tagListRef)} onTouchMove={handleTouchScroll}>
                                                            {selectedIdea?.topic && selectedIdea?.topic.length > 0 && (
                                                                <div className="space-y-2">
                                                                    {selectedIdea?.topic.map((y, i) => (
                                                                        <div className="text-sm font-normal" key={i}>{y?.title}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (<span className="text-sm text-muted-foreground">No tags</span>)}
                                    </div>
                                </div>
                                <div className={"flex gap-4 items-center"}>
                                    <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Author</Label>
                                    <div className={"flex items-center gap-4 md:flex-nowrap flex-wrap w-full"}>
                                        <div className={"flex items-center gap-2"}>
                                            {/*<UserAvatar*/}
                                            {/*    initialStyle={"text-sm"}*/}
                                            {/*    userPhoto={selectedIdea?.profileImage}*/}
                                            {/*    userName={selectedIdea?.name ? selectedIdea?.name : selectedIdea?.userName}*/}
                                            {/*/>*/}
                                            {
                                                (selectedIdea?.name ? selectedIdea?.name : selectedIdea?.userName) ?
                                                    <div className={"flex items-center"}>
                                                        <Fragment>
                                                            <Button variant={"link"}
                                                                className={"h-auto p-0 text-card-foreground font-normal text-sm"}
                                                                onClick={onRedirectToUser}
                                                            >
                                                                {selectedIdea?.name ? selectedIdea?.name : selectedIdea?.userName}
                                                            </Button>
                                                            {/*<p className={"text-sm font-normal flex items-center text-muted-foreground"}>*/}
                                                            {/*    <Dot size={20}*/}
                                                            {/*         className={"fill-text-card-foreground stroke-text-card-foreground"}*/}
                                                            {/*    />*/}
                                                            {/*    {dayjs(selectedIdea?.createdAt).format("D MMM")}*/}
                                                            {/*</p>*/}
                                                        </Fragment>
                                                    </div> : <span className="font-normal text-sm">Unknown</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className={"flex gap-4 items-center"}>
                                    <Label className={"text-sm font-medium capitalize max-w-[80px] min-w-[120px]"}>Date</Label>
                                    <span className={"text-sm font-normal"}>{dayjs(selectedIdea?.createdAt).format("MMM DD, YYYY")}</span>
                                </div>
                            </div>
                        </div>
                        <div className={"w-full lg:w-2/3 overflow-y-auto lg:h-[calc(100vh_-_100px)]"}>
                            {isEditIdea ? (
                                <div className={"pb-100px"}>
                                    <div className={"px-4 py-3 lg:py-6 lg:px-8 flex flex-col gap-4 ld:gap-6 border-b"}>
                                        <div className="space-y-2">
                                            <Label htmlFor="text" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>
                                                Title
                                            </Label>
                                            <Input
                                                type="text"
                                                id="text"
                                                placeholder=""
                                                value={selectedIdea?.title}
                                                name={"title"}
                                                onChange={onChangeText}
                                            />
                                            {formError.title && (<span className="text-red-500 text-sm">{formError.title}</span>)}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message" className={"font-medium"}>Description</Label>
                                            <ReactQuillEditor
                                                value={restoreImagePaths(selectedIdea.description, selectedIdea.descriptionImages)}
                                                name={"description"}
                                                onChange={onChangeText}
                                                setImageSizeError={setImageSizeError}
                                                descriptionImages={selectedIdea.descriptionImages}
                                                setImages={setImages}
                                                title={selectedIdea.title}
                                                uploadFolder={"feature-idea"}
                                                moduleName={"idea"}
                                                setImagesToDelete={setImagesToDelete}
                                                scrollContainerRef={scrollContainerRef}
                                                preventAutoScroll={true}
                                            />
                                            {(formError.imageSizeError || imageSizeError) && (
                                                <span className="text-red-500 text-sm">{formError.imageSizeError || imageSizeError}</span>
                                            )}
                                        </div>
                                        <div className={"space-y-2"}>

                                            <div className={`flex gap-2 justify-between items-center`}>
                                                <Label className={"font-medium"}>Choose Board for this Feedback</Label>
                                                <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/board`)}>Manage Boards</Button>
                                            </div>
                                            <Popover open={openBoardPopover} onOpenChange={setOpenBoardPopover} className="w-full p-0">
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openBoardPopover}
                                                        className="w-full justify-between bg-card focus-visible:ring-0 focus-visible:ring-transparent"
                                                    >
                                                        <span className="text-left w-11/12 block truncate">
                                                            {selectedIdea.boardId ? (
                                                                filteredBoards.find(board => board.id === selectedIdea.boardId)?.title
                                                            ) : ("Select board")}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command className="w-full">
                                                        <CommandInput placeholder="Search boards..." className="h-8" />
                                                        <CommandList>
                                                            <CommandEmpty>No boards found.</CommandEmpty>
                                                            <CommandGroup className={'max-h-[200px] overflow-y-auto smooth-scroll'} ref={boardListRef} onWheel={handleWheelScroll(boardListRef)} onTouchMove={handleTouchScroll}>
                                                                {filteredBoards.length > 0 ? (
                                                                    filteredBoards.map((board) => (
                                                                        <Fragment key={board.id}>
                                                                            <CommandItem value={board.id} className="p-0 flex gap-1 items-center cursor-pointer">
                                                                                <RadioGroup>
                                                                                    <RadioGroupItem
                                                                                        className="m-2"
                                                                                        checked={selectedIdea.boardId === board.id}
                                                                                        onClick={() => {
                                                                                            onChangeText({
                                                                                                target: {
                                                                                                    name: "boardId",
                                                                                                    value: board.id,
                                                                                                },
                                                                                            });
                                                                                            setOpenBoardPopover(false);
                                                                                        }}
                                                                                    />
                                                                                </RadioGroup>
                                                                                <span
                                                                                    onClick={() => {
                                                                                        onChangeText({
                                                                                            target: {
                                                                                                name: "boardId",
                                                                                                value: board.id,
                                                                                            },
                                                                                        });
                                                                                        setOpenBoardPopover(false);
                                                                                    }}
                                                                                    className="text-sm font-medium cursor-pointer w-full"
                                                                                >
                                                                                    {board.title}
                                                                                </span>
                                                                            </CommandItem>
                                                                        </Fragment>
                                                                    ))
                                                                ) : (
                                                                    <CommandEmpty>No boards available</CommandEmpty>
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {formError.boardId && (<span className="text-red-500 text-sm">{formError.boardId}</span>)}
                                        </div>
                                    </div>
                                    <div className={"px-4 py-3 lg:py-6 lg:px-8 border-b space-y-2"}>
                                        <div className={`flex gap-2 justify-between items-center`}>
                                            <Label className={"font-medium"}>Choose Topics for this Feedback (optional)</Label>
                                            <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/tags`)}>Manage Tags</Button>
                                        </div>
                                        <Popover open={openTopics} onOpenChange={setOpenTopics} className="w-full p-0">
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openTopics}
                                                    className="w-full justify-between bg-card focus-visible:ring-0 focus-visible:ring-transparent"
                                                >
                                                    <div className="flex gap-1 overflow-hidden">
                                                        {(selectedIdea.topic || []).length === 0 ? (
                                                            <span className="text-muted-foreground">Select topic</span>
                                                        ) : (
                                                            (selectedIdea.topic || []).map((x, index) => {
                                                                const findObj = (topicLists || []).find((y) => y.id === x?.id);
                                                                return (
                                                                    <div key={index} className={`text-xs flex gap-[2px] bg-slate-300 items-center rounded py-0 px-2`}>
                                                                        <span className="max-w-[85px] truncate">{findObj?.title}</span>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command className="w-full">
                                                    <CommandInput placeholder="Search topics..." className="h-8" />
                                                    <CommandList>
                                                        <CommandEmpty>No topics found.</CommandEmpty>
                                                        <CommandGroup className={'max-h-[200px] overflow-y-auto smooth-scroll'} ref={topicListRef} onWheel={handleWheelScroll(topicListRef)} onTouchMove={handleTouchScroll}>
                                                            {(topicLists || []).length > 0 ? (
                                                                (topicLists || []).map((topic) => (
                                                                    <Fragment key={topic.id}>
                                                                        <CommandItem
                                                                            onSelect={(e) => { e.preventDefault(); }}
                                                                            value={topic.id}
                                                                            className="p-0 flex gap-1 items-center cursor-pointer"
                                                                        >
                                                                            <Checkbox className="m-2"
                                                                                checked={(selectedIdea.topic || []).some(t => t.id === topic.id)}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleChangeTopic(topic.id);
                                                                                    setOpenTopics(true);
                                                                                }}
                                                                            />
                                                                            <span
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleChangeTopic(topic.id);
                                                                                    setOpenTopics(true);
                                                                                }}
                                                                                className="text-sm font-medium cursor-pointer w-full"
                                                                            >
                                                                                {topic.title}
                                                                            </span>
                                                                        </CommandItem>
                                                                    </Fragment>
                                                                ))
                                                            ) : (<CommandEmpty>No topics available</CommandEmpty>)}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <SaveCancelButton className={"p-4 lg:p-8"}
                                        onClickSave={() => onUpdateIdea("createdByBottom")}
                                        load={isLoadingCreateIdea === "createdByBottom"}
                                        onClickCancel={handleOnUpdateCancel}
                                    />
                                </div>
                            ) : (
                                <Fragment>
                                    <div className={"px-4 py-3 lg:py-6 lg:px-8"}>
                                        <div className={"flex flex-col gap-4"}>
                                            <div className={"flex flex-col gap-4"}>
                                                <div className={"flex justify-between items-center gap-2"}>
                                                    <h2 className={"text-xl font-normal"}>{selectedIdea?.title}</h2>
                                                    <div className={"flex gap-2"}>
                                                        {selectedIdea?.isEdit === 1 ? (
                                                            <Button variant={"outline"} className={"w-[30px] h-[30px] p-1"} onClick={openEdit}>
                                                                <Pencil size={16} />
                                                            </Button>
                                                        ) : ("")}
                                                    </div>
                                                </div>
                                                {isContentEmpty(selectedIdea?.description) || isEmpty(selectedIdea?.description) ? ("") : (
                                                    <div className=" pt-3 description-container">
                                                        <ReadMoreText alldata={selectedIdea} />
                                                    </div>
                                                )}
                                            </div>
                                            {selectedIdea && selectedIdea?.images && selectedIdea?.images.length > 0 ? (
                                                <div className={"flex gap-2 flex-wrap"}>
                                                    {(selectedIdea?.images || []).map((x, siiIdx) => {
                                                        return (
                                                            <Fragment key={siiIdx}>
                                                                {x && (
                                                                    <div
                                                                        className="w-[50px] h-[50px] md:w-[100px] md:h-[100px] border p-[3px] relative"
                                                                        onClick={() => handleImageOpen(x.name ? URL.createObjectURL(x) : x)}
                                                                    >
                                                                        <img
                                                                            className="upload-img cursor-pointer"
                                                                            src={x.name ? URL.createObjectURL(x) : `${DO_SPACES_ENDPOINT}/${x}`}
                                                                            alt=""
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </div>
                                            ) : ("")}

                                            {isLoading ? (
                                                <div className={"flex flex-col gap-2"}>
                                                    <div className="w-full flex flex-col gap-2">
                                                        <Skeleton className={"w-[100px] h-[20px]"} />
                                                        <Skeleton className={"w-full h-[80px]"} />
                                                    </div>
                                                    <div className={"flex justify-end gap-2 items-center"}>
                                                        <Skeleton className={"w-[36px] h-[36px]"} />
                                                        <Skeleton className={"w-[128px] h-[36px]"} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={"flex flex-col gap-2"}>
                                                    <div className="w-full flex flex-col gap-2">
                                                        <Label htmlFor="message" className={"font-medium capitalize"}>Add comment</Label>
                                                        <>
                                                            <Textarea
                                                                placeholder="Start writing..."
                                                                id="message"
                                                                value={commentText}
                                                                onChange={(e) => setCommentText(e.target.value)}
                                                                onKeyDown={(e) =>
                                                                    onKeyFire(
                                                                        e,
                                                                        isEmpty(commentText) || isSaveComment
                                                                            ? null
                                                                            : () => onCreateComment()
                                                                    )
                                                                }
                                                            />
                                                            <div>
                                                                <ImageGallery commentFiles={commentFiles} onDeleteImageComment={onDeleteImageComment} />
                                                                {commentFiles?.length >= 5 && (<span className="text-xs text-red-500 whitespace-nowrap">Max 5 images can be uploaded.</span>)}
                                                            </div>
                                                        </>
                                                    </div>
                                                    <div className={"flex gap-1"}>
                                                        <div className={"flex gap-2 items-center"}>
                                                            <Button
                                                                className={"w-[128px] h-[36px] text-sm font-medium"}
                                                                onClick={onCreateComment}
                                                                disabled={isEmpty(commentText) || isSaveComment}
                                                            >
                                                                {isSaveComment ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("Post Comment")}
                                                            </Button>
                                                            <div className="p-2 max-w-sm relative w-[36px] h-[36px]">
                                                                <input
                                                                    id="commentFile"
                                                                    type="file"
                                                                    multiple={true}
                                                                    className="hidden"
                                                                    onChange={(e) => handleAddCommentImg(e, false)}
                                                                    accept={fileType}
                                                                    disabled={commentFiles?.length >= 5}
                                                                />
                                                                <label htmlFor="commentFile" className={`absolute inset-0 flex items-center justify-center bg-white border rounded cursor-pointer ${commentFiles?.length >= 5 ? "#d1d5db" : "border-primary"}`}>
                                                                    <Paperclip size={16} className={`${commentFiles?.length >= 5 ? "#d1d5db" : "stroke-primary"}`} stroke={`${commentFiles?.length >= 5 ? "#d1d5db" : "stroke-primary"}`} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Tabs defaultValue="comment" className="">
                                            <div className={"px-4 lg:px-8 border-b"}>
                                                <TabsList className="bg-transparent border-b-2 border-b-primary rounded-none">
                                                    <TabsTrigger value="comment" className={"ideas-tab-comm-bgCol"}>
                                                        Comments
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>

                                            {selectedIdea?.comments?.length > 0 ? (
                                                <TabsContent value="comment" className={`pb-5`}>
                                                    {selectedIdea && selectedIdea?.comments && selectedIdea?.comments.length > 0
                                                        ? (selectedIdea?.comments || []).map((x, i) => {
                                                            return (
                                                                <Fragment key={i}>
                                                                    <div className="p-2 lg:px-8">
                                                                    <div className={"flex gap-2 overflow-x-auto bg-[#f8fafc] p-[15px] rounded-[10px] border border-[#A3BCD5] border-opacity-10"}>
                                                                        <div>
                                                                            <UserAvatar
                                                                                userPhoto={x?.profileImage}
                                                                                userName={x?.name && x.name !== "null" ? x.name : x?.userName}
                                                                                initialStyle={"text-sm"}
                                                                            />
                                                                        </div>
                                                                        <div className={"w-full flex flex-col space-y-2"}>
                                                                            <div className={"flex gap-1 flex-wrap justify-between"}>
                                                                                <div className={"flex gap-1 items-start"}>
                                                                                    <h4 className={"text-sm font-normal"}>
                                                                                        {x?.name && x.name !== "null" ? x.name : x?.userName}
                                                                                    </h4>
                                                                                    <p className={"text-sm font-normal flex items-center text-muted-foreground"}>
                                                                                        <Dot size={20} className={"fill-text-card-foreground stroke-text-card-foreground"} />
                                                                                        {dayjs.utc(x.createdAt).local().startOf("seconds").fromNow()}
                                                                                        {x.isEdited && (
                                                                                            <span className={"text-sm font-normal text-muted-foreground ml-1"}>
                                                                                                (edited)
                                                                                            </span>
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <div className={"flex gap-2"}>
                                                                                    {selectedCommentIndex === i && isEditComment ? ("") : (
                                                                                        <Fragment>
                                                                                            <ActionButtons
                                                                                                isEditable={true}
                                                                                                onEdit={() => onEditComment(x, i)}
                                                                                                onDelete={() => deleteComment(x.id, i)}
                                                                                            />
                                                                                        </Fragment>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <Fragment>
                                                                                    {selectedCommentIndex === i && isEditComment ? (
                                                                                        <CommentEditor
                                                                                            isEditMode={selectedCommentIndex === i && isEditComment}
                                                                                            comment={selectedComment?.comment}
                                                                                            images={selectedComment?.images}
                                                                                            onUpdateComment={onUpdateComment}
                                                                                            onCancelComment={() => onCancelComment(i)}
                                                                                            onDeleteImage={(i) => onDeleteCommentImage(i)}
                                                                                            onImageUpload={(e) => handleAddCommentImg(e, true)}
                                                                                            onCommentChange={(e) => setSelectedComment({ ...selectedComment, comment: e.target.value, })}
                                                                                            isSaving={isSaveUpdateComment}
                                                                                            idImageUpload={"selectedCommentImg"}
                                                                                        />
                                                                                    ) : (
                                                                                        <CommentEditor
                                                                                            comment={x.comment}
                                                                                            images={x.images}
                                                                                            onImageClick={(img) => handleImageOpen(img)}
                                                                                        />
                                                                                    )}
                                                                                </Fragment>
                                                                            </div>

                                                                            {selectedCommentIndex === i ? ("") : (
                                                                                <div className={"flex justify-between"}>
                                                                                    <Button
                                                                                        className="p-0 text-sm h-auto font-medium text-primary"
                                                                                        variant={"ghost hover-none"}
                                                                                        onClick={() => onShowSubComment(i)}
                                                                                        key={`comment-nested-reply-to-${i}`}
                                                                                    >
                                                                                        Reply
                                                                                    </Button>
                                                                                    <div className={"flex items-center gap-2 cursor-pointer"} onClick={() => onShowSubComment(i)}>
                                                                                        <span className={"mt-0.5"}>{Icon.chatbuble}</span>
                                                                                        <p className={"text-base font-normal"}>{x.reply.length}</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {x.showReply ? (
                                                                                <div className={"space-y-3"}>
                                                                                    {(x.reply || []).map((y, j) => {
                                                                                        return (
                                                                                            <Fragment key={j}>
                                                                                                <div className={"flex gap-2"}>
                                                                                                    <div>
                                                                                                        <div className={"update-idea text-sm rounded-full text-center"}>
                                                                                                            <UserAvatar
                                                                                                                userPhoto={y.profileImage}
                                                                                                                userName={y?.name && y.name !== "null" ? y.name : y?.userName}
                                                                                                                initialStyle={"text-sm"}
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                    <div className={"w-full space-y-2"}>
                                                                                                        <div className={"flex flex-wrap gap-1 justify-between"}>
                                                                                                            <div className={"flex gap-1 items-start"}>
                                                                                                                <h4 className={"text-sm font-normal"}>
                                                                                                                    {y?.name && y.name !== "null" ? y.name : y?.userName}
                                                                                                                </h4>
                                                                                                                <p className={"text-sm font-normal flex items-center text-muted-foreground"}>
                                                                                                                    <Dot size={20} className={"fill-text-card-foreground stroke-text-card-foreground"} />
                                                                                                                    {dayjs.utc(y.createdAt).local().startOf("seconds").fromNow()}
                                                                                                                    {y.isEdited && (
                                                                                                                        <span className={"text-sm font-normal text-muted-foreground ml-1"}>
                                                                                                                            (edited)
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </p>
                                                                                                            </div>
                                                                                                            {selectedCommentIndex === i && selectedSubCommentIndex === j ? ("") : (
                                                                                                                <Fragment>
                                                                                                                    <ActionButtons
                                                                                                                        isEditable={true}
                                                                                                                        onEdit={() => onEditSubComment(x, y, i, j)}
                                                                                                                        onDelete={() => deleteSubComment(y.id, x, i, j)}
                                                                                                                    />
                                                                                                                </Fragment>
                                                                                                            )}
                                                                                                        </div>
                                                                                                        {selectedCommentIndex === i && selectedSubCommentIndex === j ? (
                                                                                                            <CommentEditor
                                                                                                                isEditMode={selectedCommentIndex === i && selectedSubCommentIndex === j}
                                                                                                                comment={selectedSubComment?.comment}
                                                                                                                images={selectedSubComment?.images}
                                                                                                                onUpdateComment={onUpdateSubComment}
                                                                                                                onCancelComment={onCancelSubComment}
                                                                                                                onDeleteImage={(i) => onDeleteSubCommentImage(i, true)}
                                                                                                                onImageUpload={(e) => handleSubCommentUploadImg(e, i)}
                                                                                                                onCommentChange={(e) => onChangeTextSubComment(e)}
                                                                                                                isSaving={isSaveUpdateSubComment}
                                                                                                                idImageUpload={"commentFileInput"}
                                                                                                            />
                                                                                                        ) : (
                                                                                                            <CommentEditor
                                                                                                                comment={y.comment}
                                                                                                                images={y.images}
                                                                                                                onImageClick={(img) => handleImageOpen(img)}
                                                                                                            />
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </Fragment>
                                                                                        );
                                                                                    })}
                                                                                    <div className={"space-y-2"}>
                                                                                        {subCommentTextEditIdx === i && (
                                                                                            <Fragment>
                                                                                                <Textarea
                                                                                                    value={subCommentText[i] || ""}
                                                                                                    placeholder={"Add a reply…"}
                                                                                                    onChange={(e) => handleSubCommentTextChange(e, i)}
                                                                                                    onKeyDown={(e) =>
                                                                                                        onKeyFire(e, isEmpty(subCommentText[i]) ||
                                                                                                            (isSaveSubComment &&
                                                                                                                subCommentTextEditIdx === i) ? null : () =>
                                                                                                            onCreateSubComment(x, i)
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                                {subCommentFiles[i] &&
                                                                                                    subCommentFiles[i]?.length ? (
                                                                                                    <div className={"flex gap-2 flex-wrap pt-1"}>
                                                                                                        {(subCommentFiles[i] || []).map((z, fileIdx) => {
                                                                                                            return (
                                                                                                                <Fragment key={fileIdx}>
                                                                                                                    {z && (
                                                                                                                        <div className="border rounded relative w-full max-w-[50px] max-h-[50px] h-full">
                                                                                                                            <AspectRatio ratio={10 / 10} className="bg-white">
                                                                                                                                <img
                                                                                                                                    className="upload-img cursor-pointer"
                                                                                                                                    src={z.name ? URL.createObjectURL(z) : `${DO_SPACES_ENDPOINT}/${z}`}
                                                                                                                                    alt={z.name || ""}
                                                                                                                                    onClick={() => handleImageOpen(z.name ? URL.createObjectURL(z) : z)}
                                                                                                                                />
                                                                                                                                <CircleX
                                                                                                                                    size={20}
                                                                                                                                    className="stroke-gray-500 cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                                                                                                                    onClick={() => onDeleteSubCommentImageOld(i, fileIdx)}
                                                                                                                                />
                                                                                                                            </AspectRatio>
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </Fragment>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>
                                                                                                ) : ("")}
                                                                                                {subCommentTextEditIdx === i && (
                                                                                                    <div>
                                                                                                        <div className={"flex gap-2"}>
                                                                                                            <Button
                                                                                                                className={`${isSaveSubComment === true ? "py-2 px-6" : "py-2 px-6"} w-[86px] h-[30px] text-sm font-medium`}
                                                                                                                disabled={isEmpty(subCommentText[i]) || isSaveSubComment && subCommentTextEditIdx === i}
                                                                                                                onClick={() => onCreateSubComment(x, i)}
                                                                                                            >
                                                                                                                {isSaveSubComment && subCommentTextEditIdx === i ? (<Loader2 size={16} className="animate-spin" />) : ("Reply")}
                                                                                                            </Button>
                                                                                                            <UploadButton
                                                                                                                onChange={(e) => handleSubCommentUploadImg(e, i)}
                                                                                                                disabled={subCommentFiles[i]?.length >= 5}
                                                                                                                currentImages={subCommentFiles}
                                                                                                                onClick={() => {
                                                                                                                    setSelectedComment(null);
                                                                                                                    setSelectedCommentIndex(null);
                                                                                                                    setSelectedSubComment(null);
                                                                                                                    setSelectedSubCommentIndex(null);
                                                                                                                }}
                                                                                                            />
                                                                                                        </div>
                                                                                                        {subCommentFiles[i]?.length >= 5 && (<span className="text-xs text-red-500 whitespace-nowrap">
                                                                                                            Max 5 images can be uploaded.
                                                                                                        </span>)}
                                                                                                    </div>
                                                                                                )}
                                                                                            </Fragment>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ) : ("")}
                                                                        </div>
                                                                    </div>
                                                                    </div>
                                                                </Fragment>
                                                            );
                                                        }) : ""}
                                                </TabsContent>
                                            ) : (<div className="py-10 flex flex-col justify-center items-center">
                                                {Icon.commentEmpty}
                                                <p className={"text-muted-foreground text-sm"}>No comments yet, be the first to share your thoughts!</p></div>
                                            )}
                                        </Tabs>
                                    </div>
                                </Fragment>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </Fragment>
    );
};

export default UpdateRoadMapIdea;
