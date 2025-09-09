import React, { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { apiService, baseUrl } from "../../utils/constent";
import { useNavigate } from "react-router";
import { useToast } from "../ui/use-toast";
import { Textarea } from "../ui/textarea";
import { useSelector } from "react-redux";
import { Checkbox } from "../ui/checkbox";

const initialState = {
  title: "",
  description: "",
  roadmapStatusIds: [],
};

const initialStateError = {
  title: "",
  description: "",
  roadmapStatusIds: "",
};

export default function CreateRoadmp({
  isOpen,
  onOpen,
  onClose,
  closeCreateIdea,
  setSheetOpenCreate,
  pageNo,
  getRoadmapAllOptions,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const projectDetailsReducer = useSelector(
    (state) => state.projectDetailsReducer
  );
  const [ideaDetail, setIdeaDetail] = useState(initialState);
  const { roadmapStatus } = useSelector((state) => state.allStatusAndTypes);
  const [formError, setFormError] = useState(initialStateError);
  const [isLoading, setIsLoading] = useState(false);

  const onCancel = () => {
    setIdeaDetail(initialState);
    setSheetOpenCreate(false);
    setFormError(initialStateError);
    onClose();
    navigate(`${baseUrl}/roadmap`);
  };

  const formValidate = (name, value) => {
    switch (name) {
      case "title":
        if (!value || value.trim() === "") {
          return "Title is required";
        } else {
          return "";
        }
      // case "description":
      //   if (!value || value.toString().trim() === "") {
      //     return "Description is required";
      //   } else {
      //     return "";
      //   }
      case "roadmapStatusIds":
        if (!value || value.length === 0) {
          return "Please select at least one status";
        } else {
          return "";
        }
      default: {
        return "";
      }
    }
  };
  const onChangeText = (e) => {
    const { name, value, files } = e.target;
    const trimmedValue = name === "title" ? value.trimStart() : value;
    if (
      (name === "title" || name === "description") &&
      trimmedValue.length > 255
    ) {
      return;
    }

    setIdeaDetail((prev) => ({
      ...prev,
      [name]: trimmedValue,
      images: files ? [...prev.images, ...files] : prev.images,
    }));

    setFormError((prev) => ({
      ...prev,
      [name]: formValidate(name, trimmedValue),
    }));
  };

  const handleStatusChange = (statusId) => {
    setIdeaDetail((prev) => {
      const newStatusIds = prev.roadmapStatusIds.includes(statusId)
        ? prev.roadmapStatusIds.filter((id) => id !== statusId)
        : [...prev.roadmapStatusIds, statusId];

      return {
        ...prev,
        roadmapStatusIds: newStatusIds,
      };
    });
  };

  const onCreateIdea = async () => {
    let validationErrors = {};
    Object.keys(ideaDetail).forEach((name) => {
      const error = formValidate(name, ideaDetail[name]);
      if (error && error.length > 0) {
        validationErrors[name] = error;
      }
    });

    const trimmedTitle = ideaDetail.title.trim();
    const trimmedDes = ideaDetail.description.trim();
    if (Object.keys(validationErrors).length > 0) {
      setFormError(validationErrors);
      return;
    }

    setIsLoading(true);
    const body = {
      projectId: projectDetailsReducer.id,
      title: trimmedTitle,
      description: trimmedDes,
      roadmapStatusIds: ideaDetail.roadmapStatusIds,
    };
    const data = await apiService.createRoadmap(body);

    setIsLoading(false);
    if (data.success) {
      setSheetOpenCreate(false);
      getRoadmapAllOptions();
      setIdeaDetail(initialState);
      closeCreateIdea();
      navigate(`${baseUrl}/roadmap?pageNo=${pageNo}`);
      toast({ description: data.message });
    } else {
      toast({ description: data?.error?.message, variant: "destructive" });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={isOpen ? onCancel : onOpen}>
      {/*<SheetContent className={"lg:max-w-[800px] md:max-w-full sm:max-w-full p-0"}>*/}
      <SheetContent className={"lg:max-w-[663px] md:max-w-[720px] sm:max-w-[520px] p-0"}>
        <SheetHeader className={"px-4 py-5 lg:px-8 lg:py-[20px] border-b"}>
          <div className={"flex justify-between items-center w-full"}>
            <SheetTitle className={"text-xl font-medium capitalize"}>
              Create New Roadmap!
            </SheetTitle>
            <span className={"max-w-[24px]"}>
              <X onClick={onCancel} className={"cursor-pointer"} />
            </span>
          </div>
        </SheetHeader>
        <div className={"w-full overflow-y-auto h-[calc(100vh_-_69px)]"}>
          <div className={"pb-[60px] sm:p-0"}>
            <div
              className={
                "px-4 py-3 lg:py-6 lg:px-8 flex flex-col gap-6 border-b"
              }
            >
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className={
                    "font-medium after:ml-1 after:content-['*'] after:text-destructive"
                  }
                >
                  Title
                </Label>
                <Input
                  type="text"
                  id="title"
                  value={ideaDetail?.title}
                  placeholder={"Enter your roadmap"}
                  name={"title"}
                  onChange={onChangeText}
                />
                {ideaDetail?.title?.length ? (
                  <p className="text-xs text-muted-foreground text-right">
                    {ideaDetail?.title?.length}/255
                  </p>
                ) : null}
                {formError.title && (
                  <span className="text-red-500 text-sm">
                    {formError.title}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className={
                    "font-medium"
                  }
                >
                  Description
                </Label>
                <Textarea
                  type="text"
                  id="description"
                  rows={5}
                  value={ideaDetail?.description}
                  placeholder={"Enter your description"}
                  name={"description"}
                  className={"bg-white"}
                  onChange={onChangeText}
                />
                {ideaDetail?.description?.length ? (
                  <p className="text-xs text-muted-foreground text-right">
                    {ideaDetail?.description?.length}/255
                  </p>
                ) : null}
                {/*{formError.description && (*/}
                {/*  <span className="text-red-500 text-sm">*/}
                {/*    {formError.description}*/}
                {/*  </span>*/}
                {/*)}*/}
              </div>
              <div className="flex flex-col gap-2">
                <div className={`flex gap-2 justify-between items-center`}>
                  <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}>Status</Label>
                  <Button variant={"link"} className={`h-auto p-0`} onClick={() => navigate(`${baseUrl}/settings/statuses`)}>Manage Statuses</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {roadmapStatus?.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`status-${status.id}`}
                        checked={ideaDetail.roadmapStatusIds.includes(
                          status.id
                        )}
                        onCheckedChange={() => handleStatusChange(status.id)}
                      />
                      <label
                        htmlFor={`status-${status.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {status.title}
                      </label>
                    </div>
                  ))}
                </div>
                {formError.roadmapStatusIds && (
                  <span className="text-red-500 text-sm">
                    {formError.roadmapStatusIds}
                  </span>
                )}
              </div>
            </div>

            <div className={"p-4 lg:p-8 flex gap-6"}>
              <Button
                className={`w-[120px] text-sm font-medium hover:bg-primary`}
                onClick={onCreateIdea} disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Roadmap"
                )}
              </Button>
              <Button
                variant={"outline hover:bg-transparent"}
                className={
                  "border border-primary text-sm font-medium text-primary"
                }
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
