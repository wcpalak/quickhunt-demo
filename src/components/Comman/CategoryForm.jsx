import React, { useState, useRef } from 'react';
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import ReactQuillEditor from "./ReactQuillEditor";
import { CircleX, Loader2, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { DO_SPACES_ENDPOINT, imgPathUploadCut, restoreImagePaths } from "../../utils/constent";
import { useImagePreview } from './ImagePreviewProvider';

const CategoryForm = ({
    selectedData,
    setSelectedData,
    formError,
    setFormError,
    handleImageUpload,
    handleSubmit,
    isLoading,
    closeSheet,
    saveTitle,
    className = '',
    setImageSizeError,
    imageSizeError,
    formValidate,
}) => {
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const scrollContainerRef = useRef(null);
    const { openPreview } = useImagePreview();
    const onChangeText = (e) => {
        const { name, value, images } = e.target;
        const trimmedValue = (name === "title" || name === "description") ? value.trimStart() : value;
        setSelectedData(prev => {
            let updated = { ...prev };
            if (name === "title") {
                const slug = !prev.id ? trimmedValue
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")
                    .substring(0, 160) : prev.slug;
                updated = {
                    ...updated,
                    title: trimmedValue,
                    slug: slug
                };
            } else if (name === "slug" && !prev.id) {
                const slug = value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")
                    .substring(0, 160);
                updated = {
                    ...updated,
                    slug: slug
                };
            }
            // else if (name === "description") {
            //     const cleanValue = value.trim();
            //     const emptyContent = /^(<p>\s*<\/p>|<p><br><\/p>|<\/?[^>]+>)*$/;
            //     const isDescriptionEmpty = !value || cleanValue === "" || emptyContent.test(cleanValue);
            //
            //     updated = {
            //         ...updated,
            //         [name]: value,
            //         images: images ? [...prev.images, ...images] : prev.images
            //     };
            //
            //     // Set description error if empty
            //     setFormError(prev => ({
            //         ...prev,
            //         description: isDescriptionEmpty ? "Description is required" : ""
            //     }));
            // } else {
            //     updated[name] = value;
            // }
            // return updated;
            else if (name === "description") {
                // Check if the description has meaningful content (text or images)
                const hasContent = (value) => {
                    if (!value) return false;
                    // Consider the description valid if it contains text (after removing tags) or images
                    const textContent = value.replace(/<[^>]+>/g, '').trim();
                    const hasImages = value.includes('<img');
                    return textContent !== '' || hasImages;
                };

                const isDescriptionValid = hasContent(value);

                updated = {
                    ...updated,
                    [name]: value,
                    images: images ? [...prev.images, ...images] : prev.images
                };

                // Set description error only if there's no valid content
                setFormError(prev => ({
                    ...prev,
                    description: isDescriptionValid ? "" : "Description is required"
                }));
            } else {
                updated[name] = value;
            }
            return updated;
        });

        // Only set other field errors (not description)
        if (name !== "description") {
            setFormError(prev => ({
                ...prev,
                [name]: formValidate(name, trimmedValue)
            }));
        }

        if (name === "description" && imageSizeError) {
            setImageSizeError('');
        }
    };

    const handleDeleteImage = () => {
        setSelectedData({ ...selectedData, image: "" });
    };

    const setImages = (updater) => {
        setSelectedData((prev) => {
            const updatedImages = typeof updater === 'function' ? updater(prev) : updater;
            return { ...prev, ...updatedImages };
        });
    };

    return (
        <div className={"sm:px-8 sm:py-6 px-3 py-4 border-b space-y-6"}>
            <div className="grid w-full gap-2">
                <Label htmlFor="category-name" className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Name</Label>
                <Input type="text" id="category-name" value={selectedData.title} placeholder={"Enter the name..."} name={"title"} onChange={onChangeText} />
                {formError?.title && <span className="text-red-500 text-sm">{formError?.title}</span>}
            </div>
            <div className="grid w-full gap-2">
                <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Slug</Label>
                <Input
                    type="text"
                    value={selectedData.slug}
                    placeholder={"Enter the slug..."}
                    name={"slug"}
                    onChange={onChangeText}
                    disabled={!!selectedData.id}
                    maxLength={160}
                />
                {formError?.slug && <span className="text-red-500 text-sm">{formError?.slug}</span>}
                <span className="text-xs text-muted-foreground">
                    {selectedData.slug.length}/160 characters
                    {selectedData.id && " (Slug cannot be changed after creation)"}
                </span>
            </div>
            <div className="grid w-full gap-2">
                <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Description</Label>
                {
                    selectedData.id ?
                        <ReactQuillEditor
                            value={restoreImagePaths(selectedData.description, selectedData.descriptionImages)}
                            name={"description"}
                            onChange={onChangeText}
                            setImageSizeError={setImageSizeError}
                            descriptionImages={selectedData.descriptionImages}
                            setImages={setImages}
                            title={selectedData.title}
                            uploadFolder={"post"} moduleName={'help-center'}
                            setImagesToDelete={setImagesToDelete}
                            scrollContainerRef={scrollContainerRef}
                            preventAutoScroll={true}
                        /> :
                        <ReactQuillEditor
                            value={selectedData.description}
                            name={"description"}
                            onChange={onChangeText}
                            setImageSizeError={setImageSizeError}
                            setImages={setSelectedData}
                            title={selectedData.title}
                            descriptionImages={selectedData.descriptionImages || []}
                            uploadFolder={"post"} moduleName={'help-center'}
                            setImagesToDelete={setImagesToDelete}
                            scrollContainerRef={scrollContainerRef}
                            preventAutoScroll={true}
                        />
                }
                {formError?.description && <span className="text-red-500 text-sm">{formError?.description}</span>}
                {imageSizeError && <span className="text-red-500 text-sm">{imageSizeError}</span>}
            </div>
            <div className={"flex flex-col gap-2"}>
                <Label className={"font-medium"}>Icon</Label>
                <div className="w-[282px] h-[128px] flex gap-1">
                    {selectedData?.image ? (
                        <div>
                            <div className={"w-[282px] h-[128px] relative border p-[5px]"}>
                                <img
                                    className={"upload-img cursor-pointer"}
                                    src={
                                        selectedData?.image?.name
                                            ? URL.createObjectURL(selectedData?.image)
                                            : selectedData?.image?.includes('/')
                                                ? `${DO_SPACES_ENDPOINT}/${selectedData?.image}`
                                                : `${DO_SPACES_ENDPOINT}/${imgPathUploadCut}/post/${selectedData?.image}`
                                    }
                                    alt=""
                                    onClick={() => {
                                        const imgUrl = selectedData?.image?.name
                                          ? URL.createObjectURL(selectedData?.image)
                                          : selectedData?.image?.includes("/")
                                            ? `${DO_SPACES_ENDPOINT}/${selectedData?.image}`
                                            : `${DO_SPACES_ENDPOINT}/${imgPathUploadCut}/post/${selectedData?.image}`;
                                        openPreview([imgUrl], 0);
                                      }}
                                />
                                <CircleX
                                    size={20}
                                    className={`stroke-gray-500 dark:stroke-white cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10`}
                                    onClick={handleDeleteImage}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <input
                                id="pictureInput"
                                type="file"
                                className="hidden"
                                accept={"image/*"}
                                onChange={handleImageUpload}
                            />
                            <label
                                htmlFor="pictureInput"
                                className="border-dashed w-[282px] h-[128px] py-[52px] flex items-center justify-center bg-muted border border-muted-foreground rounded cursor-pointer"
                            >
                                <Upload className="h-4 w-4 text-muted-foreground" />
                            </label>
                        </div>
                    )}
                </div>
                {formError?.image && <span className="text-red-500 text-sm">{formError?.image}</span>}
            </div>
            <div className={"flex gap-4"}>
                <Button
                    className={`border ${className} font-medium hover:bg-primary`} disabled={isLoading}
                    onClick={() => handleSubmit(imagesToDelete)}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : saveTitle}
                </Button>

                <Button
                    variant={"ghost hover:bg-none"}
                    onClick={closeSheet}
                    className={`border border-primary font-medium text-primary`}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default CategoryForm;