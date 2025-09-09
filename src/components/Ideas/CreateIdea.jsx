import React, {useState, useEffect} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {useToast} from "../ui/use-toast";
import {apiService, baseUrl, DO_SPACES_ENDPOINT} from "../../utils/constent";
import {useNavigate} from "react-router";
import CommCreateSheet from "../Comman/CommCreateSheet";
import {inboxMarkReadAction} from "../../redux/action/InboxMarkReadAction";

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

const CreateIdea = ({isOpen, onOpen, onClose, closeCreateIdea, setIdeasList, ideasList, getAllIdea, pageNo}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const dispatch = useDispatch();
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const inboxMarkReadReducer = useSelector(state => state.inboxMarkRead);

    const [ideaDetail, setIdeaDetail] = useState(initialState);
    const [formError, setFormError] = useState(initialStateError);
    const [topicLists, setTopicLists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imageSizeError, setImageSizeError] = useState('');

    useEffect(() => {
        if(projectDetailsReducer.id){
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
        setIdeaDetail({ ...ideaDetail, topicId: clone });
    };

    const convertToSlug = (text) => {
        return text
            .trim()
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "");
    }

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
        const trimmedTitle = ideaDetail.title.trim();
        const isDuplicate = ideasList.some(idea =>
            idea.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
        );
        if (isDuplicate) {
            validationErrors.title = "An feedback with this title already exists";
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
        formData.append('title', trimmedTitle);
        formData.append('slugUrl', convertToSlug(ideaDetail?.title || ''));
        formData.append('description', transformedHtml);
        formData.append('projectId', projectDetailsReducer.id);
        formData.append('boardId', ideaDetail.boardId);
        ideaDetail.topicId.forEach(id => {
            formData.append('topicId[]', id);
        });
        if (updatedImages && updatedImages.length > 0) {
            formData.append('descriptionImages', JSON.stringify(
                updatedImages.map(img => ({
                    key: img.key,
                    path: img.path
                }))
            ));
        }
        if (allKeysToDelete.length > 0) {
            await deleteImages(allKeysToDelete);
        }
        const data = await apiService.createIdea(formData)
        setIsLoading(false)
        if(data.success){
            const clone = [...ideasList];
            clone.push(data.data)
            setIdeasList(clone);
            setIdeaDetail(initialState)
            setImageSizeError('');
            const cloneInbox = [...inboxMarkReadReducer];
            cloneInbox.push({...data.data, isRead: 1})
            dispatch(inboxMarkReadAction(cloneInbox));
            await getAllIdea()
            closeCreateIdea()
            navigate(`${baseUrl}/feedback?pageNo=${pageNo}`);
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
        navigate(`${baseUrl}/feedback?pageNo=${pageNo}`);
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
                setImageSizeError={setImageSizeError}
                imageSizeError={imageSizeError}
                formError={formError}
                isLoading={isLoading}
                setFormError={setFormError}
                onCreateIdea={onCreateIdea}
                formValidate={formValidate}
            />
        </div>
    );
};

export default CreateIdea;