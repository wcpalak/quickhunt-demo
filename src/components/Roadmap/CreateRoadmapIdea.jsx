import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux";
import {useToast} from "../ui/use-toast";
import CommCreateSheet from "../Comman/CommCreateSheet";
import {apiService, DO_SPACES_ENDPOINT} from "../../utils/constent";

const initialState = {
    title: "",
    images: [],
    topicId: [],
    projectId: "",
    description: "",
    descriptionImages: [],
    boardId: ""
}

const initialStateError = {
    title: "",
    description: "",
    boardId: "",
    imageError: ""
}

const CreateRoadmapIdea = ({
                               isOpen,
                               onOpen,
                               onClose,
                               closeCreateIdea,
                               selectedRoadmap,
                               roadmapList,
                               setRoadmapList,
                           }) => {
    const {toast} = useToast()
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const [ideaDetail, setIdeaDetail] = useState(initialState);
    const [formError, setFormError] = useState(initialStateError);
    const [topicLists, setTopicLists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imageSizeError, setImageSizeError] = useState('');

    useEffect(() => {
        if (projectDetailsReducer.id) {
            setTopicLists(allStatusAndTypes.topics)
            // setIdeaDetail({...initialState, boardId: allStatusAndTypes?.boards[0]?.id})
        }
    }, [projectDetailsReducer.id, allStatusAndTypes]);

    const handleChange = (id) => {
        const clone = [...ideaDetail.topicId];
        const index = clone.indexOf(id);
        if (index > -1) {
            clone.splice(index, 1);
        } else {
            clone.push(id);
        }
        setIdeaDetail({...ideaDetail, topicId: clone});
    };

    const generateImageKey = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '#';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const transformDescription = (description, descriptionImages) => {
        if (!description) return { transformedHtml: description, keysToDelete: [], updatedImages: [] };
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
                    updatedImages.push({ key: newKey, path: filename, fullPath: `feature-idea/${projectDetailsReducer.id}/${filename}` });
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
        if (keysToDelete.length === 0) return;
        const payload = { keys: keysToDelete };
        const response = await apiService.mediaDeleteImage(payload);
        if (response.success) {

        } else {
            toast({ description: response.error?.message || 'Failed to delete images', variant: "destructive" });
        }
    };

    const onCreateIdea = async (imagesToDelete = []) => {
        let validationErrors = {};
        Object.keys(ideaDetail).forEach(name => {
            const error = formValidate(name, ideaDetail[name]);
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

        setIsLoading(true)
        const { transformedHtml, keysToDelete, updatedImages } = transformDescription(
            ideaDetail.description,
            ideaDetail.descriptionImages || []
        );
        const allKeysToDelete = [...new Set([...keysToDelete, ...imagesToDelete.map(img => img.fullPath)])];
        let formData = new FormData();
        formData.append('title', ideaDetail.title);
        formData.append('slugUrl', ideaDetail.title ? ideaDetail.title.replace(/ /g, "-").replace(/\?/g, "-") : "");
        formData.append('description', transformedHtml);
        formData.append('projectId', projectDetailsReducer.id);
        formData.append('boardId', ideaDetail.boardId);
        ideaDetail.topicId.forEach(id => {
            formData.append('topicId[]', id);
        });
        formData.append('roadmapStatusId', selectedRoadmap && selectedRoadmap ? selectedRoadmap : "");
        if (updatedImages && updatedImages.length > 0) {
            formData.append('descriptionImages', JSON.stringify(
                updatedImages.map(img => ({
                    key: img.key,
                    path: img.path
                }))
            ))
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.createIdea(formData)
        setIsLoading(false)
        if (data.success) {
            let cloneRoadmap = [...roadmapList.columns];
            const roadmapIndex = cloneRoadmap.findIndex((x) => x.id === selectedRoadmap);
            if (roadmapIndex !== -1) {
                const cloneIdea = [...cloneRoadmap[roadmapIndex].ideas];
                cloneIdea.unshift(data.data);
                cloneRoadmap[roadmapIndex] = {...cloneRoadmap[roadmapIndex], ideas: cloneIdea, cards: cloneIdea}
            }
            setIdeaDetail(initialState)
            setImageSizeError('');
            setRoadmapList({columns: cloneRoadmap});
            onClose()
            toast({description: data.message})
        } else {
            toast({description: data?.error?.message, variant: "destructive"})
        }
    }

    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Title is required";
                } else {
                    return "";
                }
            case "boardId":
                if (!value || value.toString().trim() === "") {
                    return "Board is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onCancel = () => {
        setIdeaDetail(initialState);
        setFormError(initialStateError);
        setImageSizeError('');
        onClose();
    }

    return (
        <div>
            <CommCreateSheet
                isOpen={isOpen}
                onOpen={onOpen}
                onCancel={onCancel}
                ideaDetail={ideaDetail}
                setIdeaDetail={setIdeaDetail}
                handleChange={handleChange}
                topicLists={topicLists}
                allStatusAndTypes={allStatusAndTypes}
                formError={formError}
                isLoading={isLoading}
                onCreateIdea={onCreateIdea}
                formValidate={formValidate}
                setFormError={setFormError}
                setImageSizeError={setImageSizeError}
                imageSizeError={imageSizeError}
            />
        </div>
    );
};

export default CreateRoadmapIdea;