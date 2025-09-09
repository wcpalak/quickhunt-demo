import React, {useState} from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Icon} from "../../utils/Icon";
import {Label} from "@/components/ui/label"
import {apiService, baseUrl} from "../../utils/constent";
import {useNavigate} from "react-router-dom";
import {useToast} from "../ui/use-toast";
import {Button} from "../ui/button";
import {Check, Circle, Loader2} from "lucide-react";
import {Badge} from "../ui/badge";

const initialState = {
    projectId: '',
    boardId: ''
}

const PlanFeatureSelections = () => {
    let navigate = useNavigate();
    const {toast} = useToast();
    const [featureDetails, setFeatureDetails] = useState(initialState);
    const [featureError, setFeatureError] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);


    const formValidate = (name, value) => {
        switch (name) {
            case "title":
                if (!value || value.trim() === "") {
                    return "Title is required";
                } else {
                    return "";
                }
            case "categoryId":
                if (!value || value?.toString()?.trim() === "") {
                    return "Select a Category";
                } else {
                    return "";
                }
            case "subcategoryId":
                if (!value || value?.toString()?.trim() === "") {
                    return "Select a Sub Category";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onChange = (name, value) => {
        setFeatureDetails(prev => ({
            ...prev,
            [name]: value
        }));
        setFeatureError(prevErrors => ({
            ...prevErrors,
            [name]: formValidate(name, value, {
                ...featureDetails,
                [name]: value,
            }),
        }));
    };

    const onChangeLabel = (value) => {
        const clone = [...featureDetails.projectId]
        const index = clone.indexOf(value);
        if (index > -1) {
            clone.splice(index, 1);
        } else {
            clone.push(value);
        }
        setFeatureDetails({...featureDetails, projectId: clone});
    }

    const onSave = async () => {
        const validationErrors = formValidate(featureDetails);
        if (Object.keys(validationErrors).length > 0) {
            setFeatureError(validationErrors);
            return;
        }

        const payload = {
            email: featureDetails.email,
            password: featureDetails.password,
            loginType: "1"
        }

        // setIsLoading(true)
        // const data = await apiService.login(payload)
        // setIsLoading(false)
        // if (data.success) {
        //     navigate(`${baseUrl}/dashboard`);
        // } else {
        //     toast({variant: "destructive", description: data?.error?.message})
        // }
    }

    const labelList = []
    return (
        <div className={'container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4 h-full'}>
            <div className={" w-full flex justify-center items-center h-full"}>
                <div className={'w-full max-w-[400px]'}>
                    <div className={"flex items-center justify-center"}>{Icon.blueLogo}</div>
                    <h1 className="scroll-m-20 text-xl md:text-2xl font-medium text-center mt-6">
                        Features You Losses
                    </h1>
                    <div className={'flex flex-col gap-4 mt-10'}>
                        <div className={'flex flex-col gap-1.5'}>
                            <Label htmlFor="projects">Projects</Label>
                            <Select value={[]} onValueChange={onChangeLabel}>
                                <SelectTrigger className="h-9">
                                    <SelectValue className={"text-muted-foreground text-sm"}>
                                        {
                                            featureDetails?.projectId?.length > 0 ? (
                                                <div className={"flex gap-[2px]"}>
                                                    {
                                                        (featureDetails.projectId || []).map((x, i) => {
                                                            const findObj = labelList.find((y) => y.id == x);
                                                            return (
                                                                <Badge key={i} variant={"outline"}
                                                                       className={`h-[20px] py-0 px-2 text-xs rounded-[5px]  font-normal text-[${findObj?.colorCode}] border-[${findObj?.colorCode}] capitalize`}>
                                                                    <span className={"max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap"}>{findObj?.name}</span>
                                                                </Badge>
                                                            )
                                                        })
                                                    }
                                                </div>) : (<span className="text-muted-foreground">Select Project</span>)
                                        }
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {
                                            (labelList || []).map((x, i) => {
                                                return (
                                                    <SelectItem className={"p-2"} key={i} value={x.id.toString()}>
                                                        <div className={"flex gap-1"}>
                                                            <div onClick={() => onChangeLabel(x.id.toString())}
                                                                 className="checkbox-icon">
                                                                {featureDetails.projectId.includes(x.id.toString()) ?
                                                                    <Check size={18}/> :
                                                                    <div className={"h-[18px] w-[18px]"}/>}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {featureError?.title && <span className="text-red-500 text-sm">{featureError?.title}</span>}
                        </div>
                        <div className={'flex flex-col gap-1.5'}>
                            <Label htmlFor="board">Boards</Label>
                            <Select value={featureDetails.isActive} onValueChange={(value) => onChange('isActive', value)}>
                                <SelectTrigger className="w-" id={'board'}>
                                    <SelectValue placeholder="Select a board"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="apple">Apple</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {featureError?.title && <span className="text-red-500 text-sm">{featureError?.title}</span>}
                        </div>
                    </div>

                    <div className={'flex justify-center mt-8'}>
                        <Button className={'max-w-max gap-2'} onClick={onSave} disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin"/> } Confirm</Button>
                    </div>
                </div>
                </div>
        </div>
    );
};

export default PlanFeatureSelections;