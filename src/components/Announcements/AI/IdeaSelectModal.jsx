import React, { Fragment, useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog'
import { apiService } from '../../../utils/constent'
import { useSelector } from 'react-redux'
import { Input } from '../../ui/input'
import { Checkbox } from '../../ui/checkbox'

const initialState = {
    search: "",
    tagId: "",
    roadmapStatusId: "",
    isArchive: false,
    isActive: true,
}
const IdeaSelectModal = ({ openIdeaSelectModal, setOpenIdeaSelectModal, setSelectedIdeas, selectedIdeas }) => {

    const [load, setLoad] = useState("list");
    const [ideaList, setIdeasList] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [filter, setFilter] = useState(initialState);
    const [pageNo, setPageNo] = useState(1);
    const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

    useEffect(() => {
        if (projectDetailsReducer?.id && projectDetailsReducer.stripeStatus === 'active' && projectDetailsReducer?.plan === 3) {
            getAllIdea(filter, true);
        }
    }, [projectDetailsReducer]);

    useEffect(() => {
        if (projectDetailsReducer?.id && projectDetailsReducer.stripeStatus === 'active' && projectDetailsReducer?.plan === 3) {
            setPageNo(1);
            setIdeasList([]);
            setHasMore(true);
            getAllIdea(filter, true);
        }
    }, [filter.search]);

    // Handle pagination when pageNo changes (for infinite scroll)
    useEffect(() => {
        if (projectDetailsReducer?.id && projectDetailsReducer.stripeStatus === 'active' && projectDetailsReducer?.plan === 3 && pageNo > 1) {
            getAllIdea(filter, false);
        }
    }, [pageNo, projectDetailsReducer]);

    const getAllIdea = async (getFilter = {}, isReset = false) => {
        if (isReset) {
            setLoad("list");
        } else {
            setIsLoadingMore(true);
        }

        const currentPage = isReset ? 1 : pageNo;

        const data = await apiService.getAllIdea({
            projectId: projectDetailsReducer?.id,
            page: currentPage,
            limit: 10,
            search: getFilter?.search,
            tagId: '',
            roadmapStatusId: '',
            isArchive: false,
            isActive: true,
        });

        if (data.success) {
            const newIdeas = data?.data?.ideas || [];

            if (isReset) {
                setIdeasList(newIdeas);
                setPageNo(1);
            } else {
                // Check for duplicates before adding new ideas
                setIdeasList(prev => {
                    const existingIds = new Set(prev.map(idea => idea.id));
                    const uniqueNewIdeas = newIdeas.filter(idea => !existingIds.has(idea.id));
                    return [...prev, ...uniqueNewIdeas];
                });
            }

            const totalLoaded = isReset ? newIdeas.length : ideaList.length + newIdeas.length;
            setHasMore(totalLoaded < data.data.total);

            setLoad("");
            setIsLoadingMore(false);
        } else {
            setLoad("");
            setIsLoadingMore(false);
        }
    };

    const onChangeSearch = (e) => {
        const { name, value } = e.target;
        setFilter({ ...filter, [name]: value });
        setPageNo(1);
    }

    const handleIdeaSelect = (idea) => {
        setSelectedIdeas(prev => {
            const isAlreadySelected = prev.some(selected => selected.id === idea.id);
            if (isAlreadySelected) {
                return prev.filter(selected => selected.id !== idea.id);
            } else {
                return [...prev, { id: idea.id, title: idea.title }];
            }
        });
    };

    const isIdeaSelected = (ideaId) => {
        return selectedIdeas.some(selected => selected.id === ideaId);
    };

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        
        if (isNearBottom && hasMore && !isLoadingMore && load !== "list") {
            setPageNo(prev => prev + 1);
        }
    }, [hasMore, isLoadingMore, load]);

    return (
        <Fragment>
            <Dialog open={openIdeaSelectModal} onOpenChange={setOpenIdeaSelectModal}>
                <DialogContent className="max-w-xl p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle>Select Feedback</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"text-gray-900"}>
                        <div className='sticky top-0 p-4 pb-2 bg-secondary border-b'>
                            <Input type="search" name="search" placeholder="Search for post" onChange={onChangeSearch} value={filter.search} />
                        </div>
                        <div 
                            className="grid gap-3 p-4 pt-1 overflow-y-auto" 
                            style={{ scrollbarWidth: 'thin', maxHeight: '400px' }}
                            onScroll={handleScroll}
                        >
                            {load === "list" ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                                    </div>
                                ))
                            ) : (
                                <Fragment>
                                    {(ideaList || []).map((idea) => (
                                        <div
                                            key={idea.id}
                                            className={`p-3 border rounded cursor-pointer transition-colors flex items-start gap-3 ${isIdeaSelected(idea.id)
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => handleIdeaSelect(idea)}
                                        >
                                            <Checkbox
                                                checked={isIdeaSelected(idea.id)}
                                                onChange={() => handleIdeaSelect(idea)}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{idea.title}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {isLoadingMore && (
                                        <div className="flex justify-center py-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                        </div>
                                    )}

                                    {ideaList.length === 0 && load !== "list" && (
                                        <div className="text-center py-4 text-gray-500">
                                            No feedback found
                                        </div>
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </DialogDescription>

                    {selectedIdeas?.length > 0 && (
                        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {selectedIdeas?.length} feedback{selectedIdeas?.length !== 1 ? 's' : ''} selected
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedIdeas([])}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Fragment>
    )
}

export default IdeaSelectModal