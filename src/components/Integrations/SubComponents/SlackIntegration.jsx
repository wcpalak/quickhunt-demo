import React, {Fragment, useEffect, useState} from 'react';
import {Button} from "@/components/ui/button.jsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {Loader2, Plus, RefreshCw, CircleAlert, X} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.jsx";
import {Alert, AlertDescription, AlertTitle,} from "@/components/ui/alert"
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {useToast} from "../../ui/use-toast";
import {apiService, baseUrl, isEmpty, toggleChat} from "../../../utils/constent";
import {Label} from "../../ui/label";
import {Card, CardContent, CardFooter} from "../../ui/card";
import PlanBadge from "../../Comman/PlanBadge";
import {useSelector} from "react-redux";
import {commonParagraph} from "../../../utils/Loader";
import {Checkbox} from "../../ui/checkbox";
import DeleteDialog from "../../Comman/DeleteDialog";
import {Icon} from "../../../utils/Icon";

const SlackIntegration = ({
                              loading,
                              onConnect,
                              integrationTypeExists,
                              loadingForAll,
                              isIntLoading,
                              disconnectModalOpen,
                              slackData, setSlackData,
                              allConnectLoading,
                              getSlackIntegration,
                          }) => {
    const {toast} = useToast();
    const navigate = useNavigate();

    const {integrationType} = useParams();
    const [searchParams] = useSearchParams();

    const paramsObject = {};
    for (const [key, value] of searchParams.entries()) {
        paramsObject[key] = decodeURIComponent(value).replace(/\+/g, ' ');
    }

    const [isSWLoading, setIsSWLoading] = useState(false);
    const [isRefreshLoading, setIsRefreshLoading] = useState(false);
    const [isSChannelLoading, setIsSChannelLoading] = useState(false);
    const [workspaceData, setWorkspaceData] = useState([]);
    const [channelData, setChannelData] = useState([]);
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);
    const [isLoadDeleteWP, setIsLoadDeleteWP] = useState(false);
    const [teamChannelMap, setTeamChannelMap] = useState({});

    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getAllSlackWorkspace();
        }
    }, [projectDetailsReducer]);

    const getAllSlackWorkspace = async () => {
        setIsSWLoading(true)
        const response = await apiService.getAllSlackWorkspace(projectDetailsReducer.id);
        if (response.success) {
            setIsSWLoading(false)
            setWorkspaceData(response.data)
        } else {
            setIsSWLoading(false)
        }
    }

    const getAllSlackChannels = async (teamId, projectId) => {
        setIsSChannelLoading(true)
        const payload = {
            teamId: teamId,
            projectId: projectId,
        }
        const response = await apiService.getAllSlackChannels(payload);
        if (response.success) {
            setIsSChannelLoading(false)
            setChannelData(response?.data)
        } else {
            setIsSChannelLoading(false)
        }
    }

    useEffect(() => {
        if (slackData.teamId && projectDetailsReducer.id) {
            getAllSlackChannels(slackData.teamId, projectDetailsReducer.id)
        }
    }, [slackData.teamId, projectDetailsReducer.id])

    const handleChange = (name, value) => {
        if (name === 'teamId') {
            if (slackData?.teamId) {
                setTeamChannelMap(prev => ({
                    ...prev,
                    [slackData.teamId]: slackData.channelId || ''
                }));
            }
            const previousChannelId = teamChannelMap[value] || '';
            setSlackData(prev => ({
                ...prev,
                teamId: value,
                channelId: previousChannelId
            }));
        } else {
            setSlackData(prev => ({ ...prev, [name]: value }));
        }
    };

    const onRefreshChannel = async () => {
        if (slackData.teamId && projectDetailsReducer.id) {
            setIsRefreshLoading(true)
            await getAllSlackChannels(slackData.teamId, projectDetailsReducer.id)
            setIsRefreshLoading(false)
        }
    }

    const onNewWorkspace = async () => {
        await getSlackIntegration("1", false)
    }

    const disconnectWorkspace = async () => {
        if (!slackData?.teamId) return;
        setIsLoadDeleteWP(true)
        const payload = {
            teamId: slackData?.teamId,
            projectId: projectDetailsReducer.id,
        }
        const data = await apiService.workSpaceDisconnectOnSlack(payload);
        setIsLoadDeleteWP(false)
        if (data.success) {
            setSlackData({...slackData, teamId: ''})
            await getAllSlackWorkspace()
            setIsConfirmDelete(false)
            toast({description: data?.message});
        } else {
            toast({description: data?.error?.message, variant: "destructive"});
        }
    }

    const handleCancelDelete = () => {
        setIsConfirmDelete(false)
    }

    const onRemoveError = () => {
        navigate({
            pathname: `${baseUrl}/integrations/${integrationType}`,
            search: '',
        });
    }

    const selectionChoice = [
        {
            label: 'Changelog Comments',
            desc: 'Get notified when a user comments on your changelog post.',
            checkedKey: 'announcementsFeedback',
        },
        {
            label: 'Changelog Reactions',
            desc: 'Get alerted when users react (like, love, etc.) to your changelog.',
            checkedKey: 'announcementsReaction',
        },
        {
            label: 'New Feedback/Feedback Submitted',
            desc: 'Receive updates instantly when users share new feedback.',
            checkedKey: 'ideas',
        },
        {
            label: 'Feedback Comments',
            desc: 'Be notified when someone joins the conversation on feedback.',
            checkedKey: 'ideasComment',
        },
        {
            label: 'Feedback Upvotes',
            desc: 'Track what’s trending – get notified when users upvote feedback.',
            checkedKey: 'ideasVote',
        },
        {
            label: 'New Registered Customer',
            desc: 'Get notified when a user registers to interact with your project.',
            checkedKey: 'registerCustomer',
        },
        {
            label: 'New Guest Registration',
            desc: 'Be aware when a guest user registers to comment, react, or vote.',
            checkedKey: 'registerGuestCustomer',
        },
    ]

    const onConnectSlack = () => {
        if (isEmpty(slackData?.channelId)) {
            return toast({description: 'Please select channel.', variant: "destructive"});
        }

        const slackKeys = [
            'announcementsFeedback',
            'announcementsReaction',
            'ideas',
            'ideasComment',
            'ideasVote',
            'registerCustomer',
            'registerGuestCustomer'
        ];

        const isAnySelected = slackKeys.some(key => slackData[key]);

        if (!isAnySelected) {
            return toast({description: 'Please select at least one option.', variant: "destructive"});
        }

        onConnect('1', slackData?.id, 'slackSave')
    }

    return (
        <Fragment>
            {isConfirmDelete && (
                <DeleteDialog
                    title={"Are you sure you want to remove the Slack integration?"} isOpen={isConfirmDelete}
                    onDelete={disconnectWorkspace}
                    isDeleteLoading={isLoadDeleteWP}
                    onOpenChange={handleCancelDelete} deleteText={'Remove'}
                    description={"This will permanently remove Slack from all you’ll stop receiving notifications in Slack."}
                />
            )}

            {!isEmpty(paramsObject.error) && !isEmpty(paramsObject.message) && (
                <Alert className="mb-4 bg-red-100 border border-destructive relative">
                    <CircleAlert size={17}/>
                    <span className={'absolute right-0 top-0'}><Button variant={"plain"} onClick={onRemoveError}> <X size={18}/></Button></span>
                    <AlertTitle>
                        {paramsObject.error.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    </AlertTitle>
                    <AlertDescription className="pt-1">
                        {paramsObject.message}
                    </AlertDescription>
                </Alert>
            )}

            <Card className={'shadow'}>
                <CardContent className={`sm:p-6 p-4`}>
                    <div>
                        <div className={'mb-7 flex justify-between gap-2 flex-wrap'}>
                            <div className={"w-[130px]"}>{Icon.QhSlackPin}</div>
                            <Button variant={"destructive"} disabled={!slackData?.teamId || projectDetailsReducer?.plan < 2} onClick={() => setIsConfirmDelete(true)}>Remove Integration</Button>
                        </div>

                        <div className={'grid gap-6'}>
                            {
                                isIntLoading ? commonParagraph(4) : <Fragment>
                                    <div className={"grid gap-2 max-w-xl"}>
                                        <Label htmlFor="SlackWorkspace" className={'flex gap-2 items-center'}>Connect to Slack Workspace {projectDetailsReducer?.plan < 2 && <PlanBadge title={'Growth'}/>}</Label>
                                        <div className={'flex gap-1'}>
                                            <Select defaultValue={slackData?.teamId?.toString()} value={slackData?.teamId?.toString()} disabled={isSWLoading || projectDetailsReducer?.plan < 2}
                                                    onValueChange={(value) => handleChange('teamId', value)}
                                            >
                                                <SelectTrigger id={"SlackWorkspace"} >
                                                    <SelectValue placeholder="Select a Slack Workspace" value={slackData?.teamId?.toString()}/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {workspaceData.length > 0 ?
                                                            (workspaceData || []).map((x,i) => {
                                                                return (
                                                                    <SelectItem key={i} value={x?.teamId}>{x?.teamName}</SelectItem>
                                                                )
                                                            }) : <SelectItem disabled value={'No workspace available'}>No workspace available</SelectItem>
                                                        }
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant={"secondary"} size={"icon"} className={'min-w-10'} disabled={allConnectLoading == '1' || projectDetailsReducer?.plan < 2} onClick={onNewWorkspace}>
                                                        {allConnectLoading == '1' ?
                                                            <Loader2 size={17} className="animate-spin"/> :
                                                            <Plus size={17}/>}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className={"font-normal text-sm"}>Connect a new workspace</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {
                                        !isEmpty(slackData?.teamId) &&
                                        <Fragment>
                                            <div className={"grid gap-2 max-w-xl"}>
                                                <Label htmlFor="Channel">Select Channel</Label>
                                                <p className={'text-sm text-gray-500'}>
                                                    Select a Slack channel to receive notifications.
                                                </p>
                                                <div className={'flex gap-1'}>
                                                    <Select
                                                        defaultValue={slackData?.channelId?.toString()}
                                                        value={slackData?.channelId?.toString()}
                                                        onValueChange={(value) => handleChange('channelId', value)}
                                                        disabled={isSChannelLoading || projectDetailsReducer?.plan < 2}
                                                    >
                                                        <SelectTrigger id={"Channel"}>
                                                            <SelectValue placeholder="Select a Channel" value={slackData?.channelId?.toString()}/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                { channelData.length > 0 ?
                                                                    (channelData || []).map((x,i) => {
                                                                        return (
                                                                            <SelectItem key={i} value={x?.id}>{x?.name}</SelectItem>
                                                                        )
                                                                    }) : <SelectItem disabled value={'No channel available'}>No channel available</SelectItem>
                                                                }
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant={"secondary"} size={"icon"} className={'min-w-10'} disabled={isRefreshLoading || isSChannelLoading || !workspaceData.length || projectDetailsReducer?.plan < 2} onClick={onRefreshChannel}>
                                                                {isRefreshLoading || isSChannelLoading? <Loader2 size={17} className="animate-spin"/> : <RefreshCw size={17} />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className={"font-normal text-sm"}>Refresh Slack channel</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <p className={'text-sm'}><strong>Note:</strong> Notifications cannot be sent to private channels. Please ensure the selected channel is public.</p>
                                            </div>

                                            <div className={'flex flex-col gap-3'}>
                                                <h2 className={'font-medium text-sm'}>Select Your Notification Preferences:</h2>
                                                <div className={'flex flex-col gap-1'}>
                                                    {selectionChoice.map(({ label, desc, checkedKey }) => (
                                                        <div key={label} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={label}
                                                                disabled={projectDetailsReducer?.plan < 2}
                                                                checked={slackData?.[checkedKey]}
                                                                onCheckedChange={(checked) => handleChange(checkedKey, checked)}
                                                            />
                                                            <div>
                                                                <label htmlFor={label} className="text-sm font-semibold cursor-pointer">
                                                                    {label}
                                                                </label>
                                                                <span className="text-gray-500 text-sm">
                                                                    {' '}- {desc}{' '}{projectDetailsReducer?.plan < 2 && (<PlanBadge title={'Growth'} />)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Fragment>
                                    }

                                </Fragment>
                            }
                        </div>
                    </div>
                </CardContent>
                <CardFooter className={"flex gap-2 justify-between border-t sm:p-6 p-4 sm:pt-5 pt-4"}>
                    <div>
                        Need help? <Button className={"p-0 h-auto font-normal"} variant={"link"} onClick={toggleChat}>Contact Us</Button>
                    </div>
                    <div className={"flex gap-2 justify-end"}>
                        <Button onClick={onConnectSlack} disabled={loading == '1' || projectDetailsReducer?.plan < 2 || !workspaceData.length || !channelData.length} className={`relative`}>
                            {(loading == '1' && loadingForAll === 'slackSave') && <span
                                className="absolute inset-0 flex justify-center items-center"><Loader2
                                className="h-4 w-4 animate-spin"/></span>}
                            Save
                        </Button>

                        {
                            integrationTypeExists('1') &&
                            <Button variant={'destructive'} className={`relative`} onClick={() => disconnectModalOpen('1')} disabled={projectDetailsReducer?.plan < 2 || loading == '1' || !integrationTypeExists('1')}>
                                Disconnect from project
                            </Button>
                        }
                    </div>
                </CardFooter>
            </Card>
        </Fragment>
    );
};

export default SlackIntegration;