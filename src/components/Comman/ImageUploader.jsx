import React, {Fragment} from 'react';
import {CircleX, Upload} from "lucide-react";
import {DO_SPACES_ENDPOINT} from "../../utils/constent";
import { useImagePreview } from './ImagePreviewProvider';

const ImageUploader = ({
                           image,
                           onDelete,
                           onUpload,
                           altText = "Uploaded image",
                           imageWidth = "w-[282px]",
                           imageHeight = "h-[128px]"
                       }) => {
                        const { openPreview } = useImagePreview();
                        const imageSrc = image?.name
    ? URL.createObjectURL(image)
    : image
    ? `${DO_SPACES_ENDPOINT}/${image}`
    : null;

    return (
        <Fragment>
            {image ? (
                <div className={`${imageWidth} ${imageHeight} relative border p-[5px]`}>
                    <img
                        className="upload-img cursor-pointer"
                        src={image.name ? URL.createObjectURL(image) : `${DO_SPACES_ENDPOINT}/${image}`}
                        alt={altText}
                        onClick={() => openPreview(imageSrc)}
                    />
                    <CircleX
                        size={20}
                        className="stroke-gray-500 dark:stroke-white cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                        onClick={onDelete}
                    />
                </div>
            ) : (
                <Fragment>
                    <input
                        id="pictureInput"
                        type="file"
                        className="hidden"
                        onChange={onUpload}
                        accept="image/*"
                    />
                    <label
                        htmlFor="pictureInput"
                        className={`border-dashed ${imageWidth} ${imageHeight} py-[52px] flex items-center justify-center bg-muted border border-muted-foreground rounded cursor-pointer`}
                    >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </label>
                </Fragment>
            )}
        </Fragment>

    );
};

export default ImageUploader;