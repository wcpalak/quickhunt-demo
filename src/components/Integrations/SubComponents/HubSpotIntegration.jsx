import React, { Fragment, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { apiService, isEmpty, toggleChat } from "../../../utils/constent";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { useSelector } from "react-redux";
import { useToast } from "../../ui/use-toast";
import { Card, CardContent, CardFooter } from "../../ui/card";
import { commonParagraph } from "../../../utils/Loader";
import { Icon } from "../../../utils/Icon";
import { Badge } from '../../ui/badge';

const initialState = {
    id: "",
    integrationId: '',
    triggerStatus: "",
    roadMapStatusId: '',
    direction: "1",
    isNotify: true
}

const HubSpotIntegration = ({
    hubSpotData, loading,
    integrationTypeExists,
    isIntLoading,
    disconnectModalOpen,
}) => {
    const { toast } = useToast();

    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaveRuleLoading, setIsSaveRuleLoading] = useState(false);
    const [hubSpotStatues, setHubSpotStatues] = useState([]);
    const [hubSpotRuleData, setHubSpotRuleData] = useState(initialState);
    const [hubSpotRules, setHubSpotRules] = useState([]);
    const [isNew, setIsNew] = useState(false);
    const [index, setIndex] = useState(null);

    const handleChange = (name, value, index = null) => {
        if (index !== null) {
            const updatedRules = [...hubSpotRules];
            updatedRules[index] = { ...updatedRules[index], [name]: value };
            setHubSpotRules(updatedRules);
            const record = { ...updatedRules[index], [name]: value }
            addOrUpdateHPRule(record)
        } else {
            setHubSpotRuleData({ ...hubSpotRuleData, [name]: value })
        }
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

    useEffect(() => {
        if (hubSpotData?.id) {
            getHubSpotRules(hubSpotData?.id)
        }
    }, [hubSpotData?.id])

    const getHubSpotRules = async (integrationId) => {
        if (!integrationId) return;
        const payload = {
            integrationId: integrationId,
        }
        setIsLoading(true)
        const response = await apiService.getHubSpotRules(payload);
        setIsLoading(false)
        if (response.success) {
            setHubSpotRules(response?.data)
        }
    };

    const addOrUpdateHPRule = async (record = null) => {
        if (!hubSpotData?.id) return;

        let payload;
        if (record) {
            payload = {
                id: record?.id,
                integrationId: record?.integrationId,
                triggerStatus: record.triggerStatus,
                roadMapStatusId: record.roadMapStatusId,
                direction: record.direction,
                isNotify: record.isNotify
            }
        } else {
            payload = {
                integrationId: hubSpotData?.id,
                triggerStatus: hubSpotRuleData.triggerStatus,
                roadMapStatusId: hubSpotRuleData.roadMapStatusId,
                direction: hubSpotRuleData.direction,
                isNotify: hubSpotRuleData.isNotify
            }
        }

        if (isEmpty(payload.roadMapStatusId) || isEmpty(payload.triggerStatus)) {
            toast({ description: 'Please select status.', variant: "destructive" });
            return
        }

        if (!record) {
            setIsSaveRuleLoading(true)
        }
        const response = await apiService.createUpdateHubSpotRules(payload);
        setIsSaveRuleLoading(false)
        if (response.success) {
            if (!record) {
                let clone = [...hubSpotRules]
                clone.push(response?.data)
                setHubSpotRules(clone);
                setHubSpotRuleData(initialState)
                setIsNew(false)
            }
            toast({ description: response?.message })
        } else {
            toast({ description: response?.error?.message, variant: "destructive" });
        }
    }

    const onRemoveRule = async (record, index) => {
        if (!record?.id) return;
        const payload = {
            id: record?.id,
        }
        setIndex(index)
        const response = await apiService.hubSpotDeleteRule(payload);
        setIndex(null)
        if (response.success) {
            let clone = [...hubSpotRules]
            clone.splice(index, 1)
            setHubSpotRules(clone);
            toast({ description: response?.message })
        } else {
            toast({ description: response?.error?.message, variant: "destructive" });
        }
    }

    return (
        <Fragment>
            <Card className={'shadow'}>
                <CardContent className={`sm:p-6 p-4`}>
                    <div>
                        <div className={'mb-8 flex justify-between gap-2 flex-wrap'}>
                            <div className={"w-[130px]"}>{Icon.QhHubSpotPin}</div>
                        </div>

                        <div className={'grid gap-4'}>
                            {isLoading ? commonParagraph(4) :
                                (hubSpotRules || []).map((x, i) => {
                                    return (
                                        <Fragment key={i}>
                                            <div className={'p-4 relative border rounded-md leading-8'}>
                                                <div className='mb-3 flex justify-between items-center gap-2'>
                                                    <span><Badge variant={"secondary"} className='text-sm'>#Rule{i + 1}</Badge></span>
                                                    <Button variant={'secondary'} size={"icon"} className={'w-8 h-8'}
                                                        onClick={() => onRemoveRule(x, i)} disabled={index === i}>
                                                        {index === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} className='text-destructive' />}
                                                    </Button>
                                                </div>

                                                <span className={'text-sm'}>{' '} Synchronize the Quickhunt status {' '}</span>

                                                <span className={'inline-block'}>{' '}
                                                    <Select value={x?.roadMapStatusId} disabled={projectDetailsReducer?.plan < 2}
                                                        onValueChange={(value) => handleChange('roadMapStatusId', value, i)}
                                                    >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select Quickhunt Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {allStatusAndTypes?.roadmapStatus?.length > 0 ?
                                                                    (allStatusAndTypes?.roadmapStatus || []).map((x, i) => {
                                                                        return (
                                                                            <SelectItem key={i} value={x?.id}>{x?.title}</SelectItem>
                                                                        )
                                                                    }) : <SelectItem disabled value={'No status available'}>No status available</SelectItem>
                                                                }
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select> {' '}
                                                </span>

                                                <span className={'text-sm'}>{' '}with the HubSpot status {' '}</span>

                                                <span className={'inline-block'}>{' '}
                                                    {' '}<Select value={x?.triggerStatus} disabled={projectDetailsReducer?.plan < 2}
                                                        onValueChange={(value) => handleChange('triggerStatus', value, i)}
                                                    >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select Hubspot Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {hubSpotStatues?.length > 0 ?
                                                                    (hubSpotStatues || []).map((x, i) => {
                                                                        return (
                                                                            <SelectItem key={i} value={x?.id}>{x?.label}</SelectItem>
                                                                        )
                                                                    }) : <SelectItem disabled value={'No hubspot status available'}>No hubspot status available</SelectItem>
                                                                }
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </span>

                                                <span className={'text-sm'}>{' '}, in the direction of{' '}</span>

                                                <span className={'inline-block'}>{' '}
                                                    <Select value={x?.direction} disabled={projectDetailsReducer?.plan < 2}
                                                        onValueChange={(value) => handleChange('direction', value, i)}
                                                    >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value={'1'}>Bidirectional</SelectItem>
                                                                <SelectItem value={'2'}>Quickhunt to HubSpot</SelectItem>
                                                                <SelectItem value={'3'}>HubSpot to Quickhunt</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>{' '}
                                                </span>

                                                <span className={'text-sm'}>{' '}, and{' '}</span>
                                                <span className={'inline-block'}>{' '}
                                                    <Select value={x?.isNotify} disabled={projectDetailsReducer?.plan < 2}
                                                        onValueChange={(value) => handleChange('isNotify', value, i)}
                                                    >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value={true}>Notify</SelectItem>
                                                                <SelectItem value={false}>Do not notify</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>{' '}
                                                </span>
                                                <span className={'text-sm'}>{' '}users when you make changes on the HubSpot side.{' '}</span>

                                            </div>
                                        </Fragment>
                                    )
                                })
                            }
                            {
                                !isNew && <div className='mt-2'>
                                    <Button className={'gap-2'} onClick={() => setIsNew(true)} disabled={isSaveRuleLoading || projectDetailsReducer?.plan < 2}>
                                        <Plus size={16} /> Add New rule
                                    </Button>
                                </div>
                            }

                            {isNew && <div className={'p-4 border rounded-md leading-8'}>
                                <div className='mb-3'><Badge variant={"secondary"} className={'inline-flex items-center gap-2'}>Create New Rule</Badge></div>
                                <span className={'text-sm'}>{' '} Synchronize the Quickhunt status {' '}</span>

                                <span className={'inline-block'}>{' '}
                                    <Select value={hubSpotRuleData?.roadMapStatusId} disabled={projectDetailsReducer?.plan < 2}
                                        onValueChange={(value) => handleChange('roadMapStatusId', value)}
                                    >
                                        <SelectTrigger className="w-[135px] h-7">
                                            <SelectValue placeholder="Select Quickhunt Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {allStatusAndTypes?.roadmapStatus?.length > 0 ?
                                                    (allStatusAndTypes?.roadmapStatus || []).map((x, i) => {
                                                        return (
                                                            <SelectItem key={i} value={x?.id}>{x?.title}</SelectItem>
                                                        )
                                                    }) : <SelectItem disabled value={'No status available'}>No status available</SelectItem>
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select> {' '}
                                </span>

                                <span className={'text-sm'}>{' '}with the HubSpot status {' '}</span>

                                <span className={'inline-block'}>{' '}
                                    {' '}<Select value={hubSpotRuleData?.triggerStatus} disabled={projectDetailsReducer?.plan < 2}
                                        onValueChange={(value) => handleChange('triggerStatus', value)}
                                    >
                                        <SelectTrigger className="w-[135px] h-7">
                                            <SelectValue placeholder="Select Hubspot Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {hubSpotStatues?.length > 0 ?
                                                    (hubSpotStatues || []).map((x, i) => {
                                                        return (
                                                            <SelectItem key={i} value={x?.id}>{x?.label}</SelectItem>
                                                        )
                                                    }) : <SelectItem disabled value={'No hubspot status available'}>No hubspot status available</SelectItem>
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </span>

                                <span className={'text-sm'}>{' '}, in the direction of{' '}</span>

                                <span className={'inline-block'}>{' '}
                                    <Select value={hubSpotRuleData?.direction} disabled={projectDetailsReducer?.plan < 2}
                                        onValueChange={(value) => handleChange('direction', value)}
                                    >
                                        <SelectTrigger className="w-[135px] h-7">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={'1'}>Bidirectional</SelectItem>
                                                <SelectItem value={'2'}>Quickhunt to HubSpot</SelectItem>
                                                <SelectItem value={'3'}>HubSpot to Quickhunt</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>{' '}
                                </span>

                                <span className={'text-sm'}>{' '}, and{' '}</span>
                                <span className={'inline-block'}>{' '}
                                    <Select value={hubSpotRuleData?.isNotify} disabled={projectDetailsReducer?.plan < 2}
                                        onValueChange={(value) => handleChange('isNotify', value)}
                                    >
                                        <SelectTrigger className="w-[135px] h-7">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={true}>Notify</SelectItem>
                                                <SelectItem value={false}>Do not notify</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>{' '}
                                </span>
                                <span className={'text-sm'}>{' '}users when you make changes on the HubSpot side.{' '}</span>

                                <div className='flex justify-end'>
                                    <Button className={'gap-2 mt-2 '} onClick={() => addOrUpdateHPRule(null)} disabled={isSaveRuleLoading || projectDetailsReducer?.plan < 2}>
                                        {isSaveRuleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Rule
                                    </Button>
                                </div>

                            </div>}

                        </div>
                    </div>
                </CardContent>

                <CardFooter className={"flex gap-2 justify-between border-t sm:p-6 p-4 sm:pt-5 pt-4"}>
                    <div>
                        Need help? <Button className={"p-0 h-auto font-normal"} variant={"link"} onClick={toggleChat}>Contact
                            Us</Button>
                    </div>
                    <div className={"flex gap-2 justify-end"}>
                        {
                            integrationTypeExists('4') &&
                            <Button variant={'destructive'}
                                onClick={() => disconnectModalOpen('4')}
                                disabled={projectDetailsReducer?.plan < 2 || loading == '4' || !integrationTypeExists('4')}>
                                Disconnect
                            </Button>
                        }
                    </div>
                </CardFooter>
            </Card>
        </Fragment>
    );
};

export default HubSpotIntegration;