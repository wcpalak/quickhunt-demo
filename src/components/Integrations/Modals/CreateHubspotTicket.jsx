import React, {Fragment, useEffect, useState} from 'react';
import {Loader2} from "lucide-react";
import {apiService, isEmpty} from "../../../utils/constent";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.jsx";
import {Input} from "@/components/ui/input.jsx";
import {Label} from "@/components/ui/label.jsx";
import {Button} from "@/components/ui/button.jsx";
import {useSelector} from "react-redux";
import {Textarea} from "../../ui/textarea";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"

const CreateHubspotTicket = ({open, onCloseModalCHT, hpCTData, setHPCTData, onCreateHPTicket, isHPCTCreate}) => {
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [hubSpotStatues, setHubSpotStatues] = useState([]);

    const handleChange = (name, value) => {
        setHPCTData({...hpCTData, [name]: value})
    }

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getHubSpotStatuses(projectDetailsReducer.id)
        }
    }, [projectDetailsReducer.id])

    const getHubSpotStatuses = async (projectId) => {
        if (!projectId) return
        const payload = {
            projectId: projectId,
        }
        const response = await apiService.getHubSpotStatuses(payload);
        if (response.success) {
            setHubSpotStatues(response?.data?.statuses)
        }
    };

    return (
        <Fragment>
            <Dialog open={open} onOpenChange={onCloseModalCHT}>
                <DialogContent className="max-w-xl p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>Create new Hubspot ticket</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900 space-y-4"}>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                   htmlFor={"title"}>Title</Label>
                            <Input placeholder={'Enter title'} disabled={projectDetailsReducer?.plan < 2}
                                   value={hpCTData?.title} id={'title'}
                                   onChange={(e) => handleChange('title', e.target.value)}
                            />
                        </div>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                   htmlFor={"description"}>Description</Label>
                            <Textarea placeholder={'Enter description'} disabled={projectDetailsReducer?.plan < 2}
                                   value={hpCTData?.description} id={'description'} className={'bg-white'}
                                   onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </div>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"} htmlFor={"ticketStage"}>Stage</Label>
                            <Select value={hpCTData?.ticketStage} disabled={projectDetailsReducer?.plan < 2}
                                    onValueChange={(value) => handleChange('ticketStage', value,)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Stage"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        { hubSpotStatues?.length > 0 ?
                                            (hubSpotStatues || []).map((x,i) => {
                                                return (
                                                    <SelectItem key={i} value={x?.id}>{x?.label}</SelectItem>
                                                )
                                            }) : <SelectItem disabled value={'No hubspot status available'}>No hubspot status available</SelectItem>
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </DialogDescription>
                    <DialogFooter
                        className={"p-4 border-t items-center flex-row gap-2 flex-wrap"}>
                        <Button type="button" variant={"secondary"}
                                onClick={isHPCTCreate ? null : onCloseModalCHT} disabled={projectDetailsReducer?.plan < 2}
                        >
                            Cancel
                        </Button>
                        <Button type="submit"
                                onClick={onCreateHPTicket} disabled={isHPCTCreate || isEmpty(hpCTData?.title) || isEmpty(hpCTData?.description) || isEmpty(hpCTData?.ticketStage) || projectDetailsReducer?.plan < 2}
                        >
                            {isHPCTCreate && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create Hubspot ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default CreateHubspotTicket;