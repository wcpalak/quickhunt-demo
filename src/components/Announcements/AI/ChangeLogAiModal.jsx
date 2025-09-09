import React, { Fragment, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { apiService, isEmpty } from '../../../utils/constent'
import { X } from 'lucide-react'
import IdeaSelectModal from './IdeaSelectModal'
import { useSelector } from 'react-redux'
import { toast } from '../../ui/use-toast';
import { Badge } from '../../ui/badge'
import { Icon } from "../../../utils/Icon";
import { Textarea } from "../../ui/textarea"

const JumpingDots = ({ text = "Loading" }) => {
  return (
    <span className="flex gap-1.5">
      {text}
      <span className="flex gap-1 pt-3">
        <span className="w-[3px] h-[3px] bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-[3px] h-[3px] bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-[3px] h-[3px] bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </span>
    </span>
  );
};

const ChangeLogAiModal = ({ openWriteWithAI, setOpenWriteWithAI, setChangeLogDetails, changeLogDetails, setIsHideAiButton }) => {

  const [formData, setFormData] = useState({
    additionalFeatures: "",
    howToUse: "",
  });
  const [openIdeaSelectModal, setOpenIdeaSelectModal] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const projectDetailsReducer = useSelector((state) => state.projectDetailsReducer);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  const onSubmit = async () => {
    if (!projectDetailsReducer?.id) {
      return;
    }
    if (isEmpty(formData.additionalFeatures)) {
      toast({ variant: "destructive", description: "Please fill the additional features" });
      return;
    }

    setIsLoading(true);
    const payload = {
      ...formData,
      ideaIds: (selectedIdeas || []).map(idea => idea.id),
      projectId: projectDetailsReducer?.id,
    }
    const response = await apiService.createPostWithAi(payload);
    setIsLoading(false);
    if (response.success) {
      const slug = response?.data?.title ? response?.data?.title?.replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, "-").toLowerCase() : "";
      setChangeLogDetails({ ...changeLogDetails, title: response?.data?.title, description: `<p>${response?.data?.description}</p>`, slug: slug });
      setIsHideAiButton(true);
      setOpenWriteWithAI(false);
      setFormData({
        additionalFeatures: "",
        howToUse: "",
      });
      setSelectedIdeas([]);
      toast({ description: response.message });
    } else {
      toast({ variant: "destructive", description: response.error.message });
    }
  }

  return (
    <Fragment>
      <Dialog open={openWriteWithAI} onOpenChange={setOpenWriteWithAI}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className={"p-4 border-b"}>
            <DialogTitle className='flex items-center gap-1.5'>{Icon.AISmallBlue} Generate changelog with AI</DialogTitle>
          </DialogHeader>
          <DialogDescription className="grid gap-4 px-4">
            <div className="grid gap-2 mb-3">
              <Label htmlFor="name-1" className={"text-gray-800"}>Choose feedback to create changelog</Label>
              <Button className='max-w-max h-8 mt-1.5' onClick={() => setOpenIdeaSelectModal(true)}>Search feedback posts</Button>
              {selectedIdeas?.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    Selected Feedbacks ({selectedIdeas.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedIdeas.map((idea) => (
                      <Badge key={idea.id} variant="secondary" className='flex items-center gap-2'>
                        <span>{idea.title}</span>
                        <Button variant="ghost" size="icon" className='h-4 w-4'
                          onClick={() => setSelectedIdeas(prev => prev.filter(item => item.id !== idea.id))}
                        >
                          <X size={15} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name-1" className={"after:ml-1 after:content-['*'] after:text-destructive text-gray-800"}>Add additional features or improvements</Label>
              <Textarea id="name-1" rows={3} name="additionalFeatures" placeholder='Enter additional enhancements…' className='bg-white' onChange={onChange} value={formData.additionalFeatures} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username-1" className={"text-gray-800"}>What can users do with this update?
              </Label>
              <Textarea id="username-1" name="howToUse" placeholder='Explain the benefits for users…' className='bg-white' onChange={onChange} value={formData.howToUse} />
            </div>
          </DialogDescription>
          <DialogFooter className={"p-4 border-t"}>
            <Button onClick={onSubmit} disabled={isLoading} className='gap-2 rounded-[50px]'>
              {isLoading ? (
                <Fragment>
                  {Icon.AISmall}
                  <JumpingDots text="Generating changelog with AI" />
                </Fragment>
              ) : (
                <Fragment>
                  {Icon.AIbrush} Generate
                </Fragment>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <IdeaSelectModal openIdeaSelectModal={openIdeaSelectModal} setOpenIdeaSelectModal={setOpenIdeaSelectModal} setSelectedIdeas={setSelectedIdeas} selectedIdeas={selectedIdeas} />
    </Fragment>
  )
}

export default ChangeLogAiModal