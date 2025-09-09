import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog'
import { useSelector } from 'react-redux';
import { apiService, isEmpty } from '../../../utils/constent';
import { useParams } from 'react-router-dom';
import { Icon } from "../../../utils/Icon";

// Loading animation component
const LoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pb-8 pt-4">
      {/* AI Icon with pulse animation */}
      <div className="relative">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
          {Icon.AISmallBlue}
        </div>
        <div className="absolute inset-0 w-12 h-12 bg-blue-200 rounded-full animate-ping opacity-20"></div>
      </div>
      
      {/* Bouncing dots */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
      
      {/* Loading text */}
      <span className="text-sm font-medium text-blue-600 animate-pulse">
      Hang tight! Generating summary using AI...
      </span>
    </div>
  );
};

const GenerateSummaryModal = ({ openGenerateSummary, setOpenGenerateSummary }) => {
  const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);
  const { id } = useParams();
  const hasSummaryBeenGenerated = useRef(false);
  const [generateSummary, setGenerateSummary] = useState({});
  const [hasSuccessfullyGenerated, setHasSuccessfullyGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateSummaryWithAi = async (id) => {
    // Don't call API if already successfully generated
    if (hasSummaryBeenGenerated.current || hasSuccessfullyGenerated) return;

    hasSummaryBeenGenerated.current = true;
    setIsLoading(true);
    
    try {
      const payload = {
        projectId: projectDetailsReducer.id,
        ideaId: id
      }
      const data = await apiService.generateSummaryWithAi(payload);
      if (data.success) {
        setGenerateSummary(data.data);
        setHasSuccessfullyGenerated(true); // Mark as successfully generated
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      // Reset ref on error so user can try again
      hasSummaryBeenGenerated.current = false;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Only call API when modal opens and hasn't been successfully generated yet
    if (openGenerateSummary && !hasSuccessfullyGenerated && projectDetailsReducer.id && projectDetailsReducer.stripeStatus === 'active' && id !== "new" && projectDetailsReducer.plan === 3) {
      generateSummaryWithAi(id);
    }
  }, [openGenerateSummary, hasSuccessfullyGenerated, projectDetailsReducer.id, projectDetailsReducer.plan, id])

  return (
    <Dialog open={openGenerateSummary} onOpenChange={setOpenGenerateSummary}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className={"p-4 border-b"}>
          <DialogTitle className='flex items-center gap-1.5'>{Icon.AISmallBlue} AI Summary</DialogTitle>
        </DialogHeader>
        <DialogDescription className="p-0">
          {isLoading ? (
            <LoadingAnimation />
          ) : (
            <div className="space-y-3">
              {!isEmpty(generateSummary.summary) ? (
                <div className="p-4 pt-0">
                  <span className="text-sm font-normal break-words text-gray-700 leading-relaxed">
                    {generateSummary.summary}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-sm text-gray-500">
                  No summary available.
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

export default GenerateSummaryModal 