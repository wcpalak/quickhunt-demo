import React, { Fragment, useState } from 'react';
import { CircleX, Loader2, Paperclip, Pencil, Pin, Trash2, Upload, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useTheme } from "../theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Icon } from "../../utils/Icon";
import { Label } from "../ui/label";
import { DO_SPACES_ENDPOINT, handleImageOpen, isEmpty, onKeyFire } from "../../utils/constent";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useImagePreview } from './ImagePreviewProvider';

const fileType = ".jpg, .jpeg, .png";

export const CommentEditor = ({
    isEditMode,
    comment,
    images = [],
    onUpdateComment,
    onCancelComment,
    onDeleteImage,
    onImageClick,
    onImageUpload,
    onCommentChange,
    isSaving,
    idImageUpload = '',
    maxImages = 5
}) => {
    const { openPreview } = useImagePreview();
    const imageArray = Array.isArray(images) ? images : [];
    const isMaxImagesReached = imageArray.length >= maxImages;
    const renderCommentWithLinks = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">
                        {part}
                    </a>
                );
            }
            return part;
        });
    };
    const handleImageClickold = (img) => {
        // if (isEditMode) return;
        
        const imgSrc = img.name ? URL.createObjectURL(img) : `${DO_SPACES_ENDPOINT}/${img}`;
        openPreview([imgSrc]);
    };
    const handleImageClick = (index) => {
        const allImageUrls = imageArray.map((img) =>
          img.name ? URL.createObjectURL(img) : `${DO_SPACES_ENDPOINT}/${img}`
        );
        openPreview(allImageUrls, index);
      };
    return (
        <div className="space-y-2">
            {isEditMode ? (
                <div className="space-y-2">
                    <Textarea
                        value={comment} placeholder={'Add a reply…'}
                        onChange={onCommentChange}
                        onKeyDown={(e) => onKeyFire(e, (isEmpty(comment) || isSaving) ? null : () => onUpdateComment())}
                    />
                    {imageArray.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                            {imageArray.map((img, index) => {
                                return (
                                    <Fragment key={index}>
                                        {img && (
                                            <div className="border rounded relative w-full max-w-[50px] max-h-[50px] h-full">
                                                <AspectRatio ratio={10 / 10} className="bg-white">
                                                    <img
                                                        className="upload-img cursor-pointer"
                                                        src={img.name ? URL.createObjectURL(img) : `${DO_SPACES_ENDPOINT}/${img}`}
                                                        alt={img.name || ""}
                                                        onClick={() => handleImageOpen(img.name ? URL.createObjectURL(img) : img)}
                                                        // onClick={() => handleImageClick(index)}
                                                    />
                                                    <CircleX
                                                        size={20}
                                                        className="stroke-gray-500 dark:stroke-white cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                                        onClick={() => onDeleteImage(index, !!img.name)}
                                                    />
                                                </AspectRatio>
                                            </div>
                                        )}
                                    </Fragment>
                                )
                            })}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="min-w-[81px] h-[30px] text-sm font-medium hover:bg-primary"
                            onClick={onUpdateComment}
                            disabled={isEmpty(comment) || isSaving}
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                        </Button>
                        <div className="p-2 max-w-sm relative w-[36px]">
                            <Input id={idImageUpload} type="file" className="hidden" multiple={true} onChange={onImageUpload} accept={fileType} disabled={isMaxImagesReached} />
                            <label
                                // htmlFor="commentImageUpload"
                                htmlFor={idImageUpload}
                                className={`absolute inset-0 flex items-center justify-center bg-white border rounded cursor-pointer ${isMaxImagesReached
                                        ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                                        : "border-primary"
                                    }`}
                            >
                                <Paperclip size={16} className={isMaxImagesReached ? "stroke-gray-400" : "stroke-primary"} stroke={isMaxImagesReached ? "stroke-gray-400" : "stroke-primary"} />
                            </label>
                        </div>
                        <Button
                            className="h-[30px] text-sm font-medium text-primary border border-primary"
                            variant="outline hover:none"
                            onClick={onCancelComment}
                        >
                            Cancel
                        </Button>
                    </div>
                    {isMaxImagesReached && (<span className="text-xs text-red-500 whitespace-nowrap">Max 5 images can be uploaded.</span>)}
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs break-words">{renderCommentWithLinks(comment)}</p>
                    {
                        imageArray.length > 0 &&
                        <div className="flex gap-2 flex-wrap">
                            {imageArray.map((img, index) => {
                                return (
                                    <div
                                        key={index}
                                        className="border rounded relative w-full max-w-[50px] max-h-[50px] h-full"
                                        // onClick={() => onImageClick(img)}
                                        onClick={() => handleImageClick(index)}
                                    >
                                        <AspectRatio ratio={10 / 10} className="bg-white">
                                            <img className="upload-img cursor-pointer"
                                                // onClick={() => handleImageOpen(img.name ? URL.createObjectURL(img) : img)}
                                                src={`${DO_SPACES_ENDPOINT}/${img}`} alt="" />
                                        </AspectRatio>
                                    </div>
                                )
                            })}
                        </div>
                    }
                </div>
            )}
        </div>
    );
};

export const UserAvatar = ({ userPhoto, userName, className, style, initialStyle, avatarFallbackInlineStyle }) => {
    const initials = userName
        ? userName
            .split(" ")
            .slice(0, 1)
            .map(word => word[0]?.toUpperCase())
            .join("")
        : "";
    return (
        <Avatar className={`min-w-[24px] w-[24px] min-h-[24px] h-[24px] ${className || ''} ${style || ''}`}>
            <AvatarImage src={userPhoto?.includes("https://cdn.jsdelivr.net/") ? userPhoto : userPhoto ? `${DO_SPACES_ENDPOINT}/${userPhoto}` : null} alt={initials || "User"} />
            <AvatarFallback style={avatarFallbackInlineStyle} className={`${initialStyle || ''} border`}>{initials || "U"}</AvatarFallback>
        </Avatar>
    );
};

export const ActionButtons = ({ isEditable, onEdit, onDelete, isPinned, onPinChange, itemIndex }) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await onDelete(itemIndex);
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="flex gap-2">
            {isEditable && onEdit && (
                <Button variant="outline" className="w-[25px] h-[25px] p-1" onClick={() => onEdit(itemIndex)}>
                    <Pencil className="w-[13px] h-[13px]" />
                </Button>
            )}
            {onDelete && (
                <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                    if (!isDeleting) setIsDeleteDialogOpen(open);
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-[25px] h-[25px] p-1" onClick={handleDeleteClick}>
                            <Trash2 className="w-[13px] h-[13px]" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className={"sm:max-w-lg p-0 gap-0"}>
                        <DialogHeader className={"p-4 border-b"}>
                            <DialogTitle className={"text-md"}>Are you sure?</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className={"p-4 text-gray-900"}>
                            This action cannot be undone. This will permanently delete the comment.
                        </DialogDescription>
                        <DialogFooter className={"p-4 border-t flex-nowrap flex-row gap-2 sm:gap-0 justify-end"}>
                            <Button
                                variant={"secondary"}
                                disabled={isDeleting}
                                onClick={() => setIsDeleteDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={isDeleting}
                                onClick={handleDeleteConfirm}
                            >
                                {isDeleting ? (
                                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                ) : null}
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            {typeof isPinned !== 'undefined' && onPinChange && (
                <Button variant="outline" className="w-[25px] h-[25px] p-1" onClick={() => onPinChange(!isPinned)}>
                    <Pin size={13} className={isPinned ? 'fill-card-foreground' : ''} />
                </Button>
            )}
        </div>
    );
};

export const SaveCancelButton = ({ onClickSave, load, onClickCancel, className, classBtnSave, classBtnCancel }) => {
    return (
        <Fragment>
            <div className={`${className} flex gap-3`}>
                <Button className={`${classBtnSave} w-[54px] text-sm font-medium hover:bg-primary`} disabled={load} onClick={onClickSave}>
                    {load ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button
                    variant={"outline hover:bg-transparent"}
                    className={`${classBtnCancel} border border-primary text-sm font-medium text-primary`}
                    onClick={onClickCancel}
                >
                    Cancel
                </Button>
            </div>
        </Fragment>
    )
}

export const ImageUploader = ({ stateDetails, onDeleteImg, handleFileChange, className }) => {
    const hasImage = stateDetails?.image;

    const handleDelete = () => {
        const imageName = hasImage && stateDetails.image.name ? "" : stateDetails.image;
        onDeleteImg('deleteImage', imageName);
    };

    return (
        <Fragment>
            {hasImage ? (
                <div className={`${className ? className : "w-[282px]"} h-[128px] relative border p-[5px]`}>
                    <img
                        className={"upload-img"}
                        src={hasImage && stateDetails.image.name ? URL.createObjectURL(stateDetails.image) : `${DO_SPACES_ENDPOINT}/${stateDetails.image}`}
                        alt=""
                    />
                    <CircleX
                        size={20}
                        className={`stroke-gray-500 dark:stroke-white cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10`}
                        onClick={handleDelete}
                    />
                </div>
            ) : (
                <Fragment>
                    <input
                        id="pictureInput"
                        type="file"
                        className="hidden"
                        accept={fileType}
                        multiple={true}
                        onChange={handleFileChange}
                    />
                    <label htmlFor="pictureInput"
                        className={`border-dashed ${className ? className : "w-[282px]"} h-[128px] py-[52px] flex gap-2 text-xs items-center justify-center bg-muted border border-muted-foreground rounded cursor-pointer`}
                    >
                        <Upload className="h-4 w-4 text-muted-foreground" /> Add featured image
                    </label>
                </Fragment>
            )}
        </Fragment>
    );
}

export const ImageGallery = ({ commentFiles, onDeleteImageComment }) => {
    const { openPreview } = useImagePreview();
    if (!commentFiles || commentFiles.length === 0) {
        return null;
    }

    const handleImageClick = (img) => {
        const imgSrc = img.name ? URL.createObjectURL(img) : `${DO_SPACES_ENDPOINT}/${img}`;
        openPreview([imgSrc]);
    };

    return (
        <div className={"flex flex-wrap gap-3 mt-1"}>
            {commentFiles.map((file, index) => (
                <Fragment key={index}>
                    {file && (
                        <div className="border rounded relative w-full max-w-[50px] max-h-[50px] h-full">
                            <AspectRatio ratio={10 / 10} className="bg-muted">
                                <img
                                    className="upload-img cursor-pointer"
                                    src={file.name ? URL.createObjectURL(file) : `${DO_SPACES_ENDPOINT}/${file}`}
                                    alt={file.name || 'uploaded image'}
                                    onClick={() => handleImageOpen(file.name ? URL.createObjectURL(file) : file)}
                                    // onClick={() => handleImageClick(file)}
                                    
                                />
                                <CircleX
                                    size={20}
                                    className="stroke-gray-500 dark:stroke-white cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                    onClick={() => onDeleteImageComment(index, false)}
                                />
                            </AspectRatio>
                        </div>
                    )}
                </Fragment>
            ))}
        </div>
    );
};

export const UploadButton = ({ onChange, id = "fileInput", className = "", disabled = false, currentImages = [], onClick }) => {
    const isMaxImagesReached = currentImages.length >= 5;
    const isDisabled = disabled || isMaxImagesReached;

    return (
        <div className={`p-2 max-w-sm relative w-[36px] ${className}`}>
            <input
                id={id}
                type="file"
                className="hidden"
                onChange={onChange}
                accept={fileType}
                multiple={true}
                disabled={isDisabled}
            />
            <label
                htmlFor={id}
                className={`absolute inset-0 flex items-center justify-center bg-white border rounded cursor-pointer ${isDisabled
                        ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                        : "border-primary"
                    }`}
                onClick={onClick}
            >
                <Paperclip
                    size={16}
                    className={isDisabled ? "stroke-gray-400" : "stroke-primary"}
                    stroke={isDisabled ? "stroke-gray-400" : "stroke-primary"}
                />
            </label>
        </div>
    );
};

export const StatusButtonGroup = ({ statusButtons = [], onChangeStatus, }) => {
    const { theme } = useTheme();
    return (
        <div className="flex gap-2">
            {statusButtons.map((btn, index) => (
                <div key={index} className="flex gap-1 justify-between">
                    <Button
                        variant="outline"
                        className={`hover:bg-muted ${btn.width || 'w-[110px]'} h-[30px] capitalize ${theme === "dark" ? "" : "border-muted-foreground text-muted-foreground"} text-xs font-medium`}
                        onClick={() => onChangeStatus(btn.statusKey, btn.statusValue)}
                    >
                        {btn.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            btn.label
                        )}
                    </Button>
                </div>
            ))}
        </div>
    );
};

export const FileUpload = ({ label, id, file, onDelete, onChange, error }) => (
    <div className="space-y-2">
        <div className="flex gap-2">
            {file ? (
                <div className="h-[50px] w-[50px] relative border rounded-lg">
                    <img
                        className="h-full w-full rounded-md object-cover"
                        src={file.name ? URL.createObjectURL(file) : `${DO_SPACES_ENDPOINT}/${file}`}
                        alt=""
                    />
                    <CircleX
                        size={20}
                        className="absolute top-[-10px] right-[-10px] cursor-pointer"
                        onClick={onDelete}
                    />
                </div>
            ) : (
                <label htmlFor={id} className="flex w-[50px] bg-muted h-[50px] justify-center items-center rounded cursor-pointer">
                    {Icon.editImgLogo}
                </label>
            )}
            <input
                id={id}
                type="file"
                className="hidden"
                accept={fileType}
                multiple={true}
                onChange={onChange}
            />
        </div>
        {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
);

export const CommSearchBar = ({ value, onChange, onClear, placeholder = "Search...", className = "", inputClassName = "" }) => (
    <div className={`relative w-full ${className}`}>
        <Input
            type="search" value={value}
            placeholder={placeholder}
            className={`w-full pl-4 pr-14 text-sm font-normal h-9 ${inputClassName}`}
            name={"search"}
            onChange={onChange}
        />
        {value.trim() !== '' && (
            <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                onClick={onClear}
            >
                <X className="w-4 h-4" />
            </button>
        )}
    </div>
)

export const CommInputField = ({ id, value, label, onChange, error }) => (
    <div className={"space-y-2"}>
        <Label htmlFor={id} className="font-normal">{label}</Label>
        <Input id={id} value={value} onChange={onChange} placeholder={`Enter ${label.toLowerCase()}`} />
        {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
)

