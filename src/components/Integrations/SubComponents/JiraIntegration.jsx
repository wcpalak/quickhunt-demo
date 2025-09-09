import React, { Fragment, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiService, isEmpty, toggleChat } from "../../../utils/constent";
import { Card, CardContent, CardFooter } from "../../ui/card";
import { useSelector } from "react-redux";
import { commonParagraph } from "../../../utils/Loader";
import { Icon } from "../../../utils/Icon";
import { useToast } from "../../ui/use-toast";
import { Badge } from '../../ui/badge';



const initialState = {
    id: "",
    integrationId: '',
    triggerStatus: "",
    roadMapStatusId: '',
    direction: "1",
    isNotify: true
}
const JiraIntegration = ({
    jiraData, loading,
    integrationTypeExists,
    isIntLoading,
    disconnectModalOpen,
}) => {
    const { toast } = useToast();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaveRuleLoading, setIsSaveRuleLoading] = useState(false);
    const [jiraStatuses, setJiraStatuses] = useState([]);
    const [jiraRuleData, setJiraRuleData] = useState(initialState);
    const [jiraRules, setJiraRules] = useState([]);
    const [isNew, setIsNew] = useState(false);
    const [index, setIndex] = useState(null);

    const handleChange = (name, value, index = null) => {
        if (index !== null) {
            const updatedRules = [...jiraRules];
            updatedRules[index] = { ...updatedRules[index], [name]: value };
            setJiraRules(updatedRules);
            const record = { ...updatedRules[index], [name]: value }
            addOrUpdateJiraRule(record)
        } else {
            setJiraRuleData({ ...jiraRuleData, [name]: value })
        }
    }

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getJiraStatuses(projectDetailsReducer.id)
        }
    }, [projectDetailsReducer.id])

    const getJiraStatuses = async (projectId) => {
        if (!projectId) return
        const payload = {
            projectId: projectId,
        }
        const response = await apiService.getJiraIntegration(payload);
        if (response.success) {
            setJiraStatuses(response?.data)
        }
    };

    useEffect(() => {
        if (jiraData?.id) {
            getJiraRules(jiraData?.id)
        }
    }, [jiraData?.id])

    const getJiraRules = async (integrationId) => {
        if (!integrationId) return;
        const payload = {
            integrationId: integrationId,
        }
        setIsLoading(true)
        const response = await apiService.getHubSpotRules(payload);
        setIsLoading(false)
        if (response.success) {
            setJiraRules(response?.data)
        }
    };

    const addOrUpdateJiraRule = async (record = null) => {
        if (!jiraData?.id) return;

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
                integrationId: jiraData?.id,
                triggerStatus: jiraRuleData.triggerStatus,
                roadMapStatusId: jiraRuleData.roadMapStatusId,
                direction: jiraRuleData.direction,
                isNotify: jiraRuleData.isNotify
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
                let clone = [...jiraRules]
                clone.push(response?.data)
                setJiraRules(clone);
                setJiraRuleData(initialState)
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
            let clone = [...jiraRules]
            clone.splice(index, 1)
            setJiraRules(clone);
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
                            <div className={"w-[130px]"}>{Icon.QhJiraPin}</div>
                        </div>

                        <div className={'grid gap-4'}>
                            {isLoading ? commonParagraph(4) :
                                (jiraRules || []).map((x, i) => {
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

                                                <span className={'text-sm'}>{' '}with the Jira status {' '}</span>

                                                <span className={'inline-block'}>{' '}
                                                    {' '}<Select value={x?.triggerStatus} disabled={projectDetailsReducer?.plan < 2}
                                                        onValueChange={(value) => handleChange('triggerStatus', value, i)}
                                                    >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select Jira Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                {jiraStatuses?.length > 0 ?
                                                                    (jiraStatuses || []).map((x, i) => {
                                                                        return (
                                                                            <SelectItem key={i} value={x?.statusId}>{x?.statusName}</SelectItem>
                                                                        )
                                                                    }) : <SelectItem disabled value={'No jira status available'}>No jira status available</SelectItem>
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
                                                                <SelectItem value={'2'}>Quickhunt to Jira</SelectItem>
                                                                <SelectItem value={'3'}>Jira to Quickhunt</SelectItem>
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
                                                <span className={'text-sm'}>{' '}users when you make changes on the Jira side.{' '}</span>

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
                                    <Select value={jiraRuleData?.roadMapStatusId} disabled={projectDetailsReducer?.plan < 2}
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

                                <span className={'text-sm'}>{' '}with the Jira status {' '}</span>

                                <span className={'inline-block'}>{' '}
                                    {' '}<Select value={jiraRuleData?.triggerStatus} disabled={projectDetailsReducer?.plan < 2}
                                        onValueChange={(value) => handleChange('triggerStatus', value)}
                                    >
                                        <SelectTrigger className="w-[135px] h-7">
                                            <SelectValue placeholder="Select Jira Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {jiraStatuses?.length > 0 ?
                                                    (jiraStatuses || []).map((x, i) => {
                                                        return (
                                                            <SelectItem key={i} value={x?.statusId}>{x?.statusName}</SelectItem>
                                                        )
                                                    }) : <SelectItem disabled value={'No jira status available'}>No jira status available</SelectItem>
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </span>

                                <span className={'text-sm'}>{' '}, in the direction of{' '}</span>

                                <span className={'inline-block'}>{' '}
                                    <Select value={jiraRuleData?.direction} disabled={projectDetailsReducer?.plan < 2}
                                        onValueChange={(value) => handleChange('direction', value)}
                                    >
                                        <SelectTrigger className="w-[135px] h-7">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value={'1'}>Bidirectional</SelectItem>
                                                <SelectItem value={'2'}>Quickhunt to Jira</SelectItem>
                                                <SelectItem value={'3'}>Jira to Quickhunt</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>{' '}
                                </span>

                                <span className={'text-sm'}>{' '}, and{' '}</span>
                                <span className={'inline-block'}>{' '}
                                    <Select value={jiraRuleData?.isNotify} disabled={projectDetailsReducer?.plan < 2}
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
                                <span className={'text-sm'}>{' '}users when you make changes on the Jira side.{' '}</span>

                                <div className='flex justify-end'>
                                    <Button className={'gap-2 mt-2 '} onClick={() => addOrUpdateJiraRule(null)} disabled={isSaveRuleLoading || projectDetailsReducer?.plan < 2}>
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
                            integrationTypeExists('5') &&
                            <Button variant={'destructive'}
                                onClick={() => disconnectModalOpen('5')}
                                disabled={projectDetailsReducer?.plan < 2 || loading == '5' || !integrationTypeExists('5')}>
                                Disconnect
                            </Button>
                        }
                    </div>
                </CardFooter>
            </Card>
        </Fragment>
    );
};

export default JiraIntegration;