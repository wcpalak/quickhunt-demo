import React, { useState, useEffect, Fragment } from 'react';
import {
    apiService,
    baseUrl,
    isEmpty,
    slackIntImg,
    gitHubIntImg,
    zapierIntImg,
    HubSpotImg,
    ADMIN_DOMAIN, JiraImg, generateStateToken, JIRA_CLIENT_ID, BASE_URL_API,
} from "../../utils/constent";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card.jsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ArrowLeft, ArrowRightLeft, EllipsisVertical, Loader2, MoveRight, Pencil, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { useSelector } from "react-redux";
import { useToast } from "../ui/use-toast";
import SlackIntegration from "./SubComponents/SlackIntegration";
import PlanBadge from "../Comman/PlanBadge";
import GithubIntegration from "./SubComponents/GithubIntegration";
import DisconnectIntegration from "./Modals/DisconnectIntegration";
import { integrationLoad } from "../../utils/Loader";
import JiraIntegration from "./SubComponents/JiraIntegration";
import HubSpotIntegration from "./SubComponents/HubSpotIntegration";
import { userDetailsAction } from '../../redux/action/UserDetailAction';
import { useDispatch } from 'react-redux';

const initialSlack = {
    id: "",
    channelId: "",
    teamId: "",
    announcementsFeedback: false,
    announcementsReaction: false,
    ideas: false,
    ideasComment: false,
    ideasVote: false,
    registerCustomer: false,
    registerGuestCustomer: false,
}

const initialData = {
    id: "",
    isSync: true,
    isNotify: true,
    isActive: true,
    isAny: true,
    roadmapStatusId: ''
}

const initialHP = {
    id: "",
}

const Integrations = () => {
    const { toast } = useToast();
    const dispatch = useDispatch();

    const { integrationType } = useParams();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const navigate = useNavigate();
    const [pageNo, setPageNo] = useState(1);
    const [loading, setLoading] = useState('');
    const [loadingForAll, setLoadingForAll] = useState('');
    const [integrationsData, setIntegrationsData] = useState([]);
    const [isIntLoading, setIsIntLoading] = useState(false);
    const [allModal, setAllModal] = useState('');
    const [disconnectId, setDisconnectId] = useState('');
    const [getApicall, setGetApicall] = useState(false)
    const [slackData, setSlackData] = useState(initialSlack);
    const [gitHubData, setGitHubData] = useState(initialData);
    const [jiraData, setJiraData] = useState(initialData);
    const [allConnectLoading, setAllConnectLoading] = useState('');
    const [hubSpotData, setHubSpotData] = useState(initialHP);
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);

    useEffect(() => {
       
            const getUserDetails = async () => {
                const userDetails = await apiService.getUserDetails();
                if (userDetails.success) {
                    dispatch(userDetailsAction({
                        ...userDetailsReducer,
                        plan: userDetails.data.plan,
                        planInterval: userDetails.data.planInterval
                    }));
                }
            }
            getUserDetails();
    }, []);

    useEffect(() => {
        if (getApicall) {
            if (projectDetailsReducer.id) {
                getIntegrations(false)
            }
        }
    }, [getApicall, projectDetailsReducer.id])

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getIntegrations(true)
        }
    }, [projectDetailsReducer.id])


    const getIntegrations = async (loaderType = false) => {
        if (loaderType) {
            setIsIntLoading(true);
        }
        setGetApicall(false)
        const response = await apiService.getIntegrations(projectDetailsReducer.id);
        setIsIntLoading(false);
        if (response.success) {
            setIntegrationsData(response?.data)

            const getIntegrationByType = (type) => {
                return (response?.data || []).find(x => x?.integrationType == type);
            };

            // slack
            const slackIntegration = getIntegrationByType('1');
            if (slackIntegration?.settings) {
                setSlackData({ ...slackIntegration?.settings, id: slackIntegration?.id });
            }

            // github
            const gitIntegration = getIntegrationByType('2');
            if (gitIntegration?.settings) {
                setGitHubData({ ...gitIntegration?.settings, id: gitIntegration?.id });
            }

            // hubspot
            const hubSpotIntegration = getIntegrationByType('4');
            if (hubSpotIntegration?.settings) {
                setHubSpotData({ ...hubSpotData, id: hubSpotIntegration?.id });
            }

            // jira
            const jiraIntegration = getIntegrationByType('5');
            if (jiraIntegration?.settings) {
                setJiraData({ ...jiraIntegration, id: jiraIntegration?.id });
            }
        }
    };

    const makeRoute = (rType = '') => {
        return `${ADMIN_DOMAIN}${baseUrl}/integrations/${rType}`
    }

    const getSlackIntegration = async (type, isNew = true) => {
        if (!projectDetailsReducer.id) return
        const redirectURL = makeRoute('slack');
        setAllConnectLoading(type)
        const response = await apiService.isExistSlack(projectDetailsReducer.id);
        setAllConnectLoading('')
        if (response.success) {
            if (response?.data?.isExist && isNew) {
                handlePageChange('slack')
            } else {
                const payload = {
                    projectId: projectDetailsReducer.id,
                    redirectURL: redirectURL,
                    slackOAuthErrorURL: redirectURL,
                }
                const data = await apiService.getSlackIntegration(payload);

                if (data.success) {
                    window.open(data?.data?.url, "_self")
                } else {
                    toast({ description: data?.error?.message, variant: "destructive" });
                }
            }
        } else {
            toast({ description: response?.error?.message, variant: "destructive" });
        }
    }

    const getGitHubIntegration = async (type) => {
        if (!projectDetailsReducer.id) return;

        setAllConnectLoading(type);
        const redirectURL = makeRoute('github');

        const stateObj = {
            projectId: projectDetailsReducer.id,
            createdBy: projectDetailsReducer.userId,
            stateToken: generateStateToken(),
            redirectURL: redirectURL,
        };

        const authorizeUrl = `https://github.com/apps/devquickhunt-tool/installations/select_target?state=${encodeURIComponent(JSON.stringify(stateObj))}`;

        setTimeout(() => {
            window.open(authorizeUrl, "_self");
        }, 300);
        setAllConnectLoading('');
    };

    const getHubSpotIntegration = async (type) => {
        if (!projectDetailsReducer.id) return
        const redirectURL = makeRoute('hubspot');
        const payload = {
            projectId: projectDetailsReducer.id,
            redirectURL: redirectURL,
            hubSpotOAuthErrorURL: redirectURL,
        }
        setAllConnectLoading(type)
        const response = await apiService.getHubSpot(payload);
        setAllConnectLoading('')
        if (response.success) {
            window.open(response?.data?.url, "_self")
        } else {
            toast({ description: response?.error?.message, variant: "destructive" });
        }
    };

    const getJiraIntegration = async (type) => {
        if (!projectDetailsReducer.id) return;

        setAllConnectLoading(type);
        const redirectURL = makeRoute('jira');

        const stateObj = {
            projectId: projectDetailsReducer.id,
            createdBy: projectDetailsReducer.userId,
            stateToken: generateStateToken(),
            redirectURL: redirectURL,
        };

        const authorizeUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${JIRA_CLIENT_ID}&scope=read%3Ajira-work%20read%3Ajira-user%20write%3Ajira-work%20manage%3Ajira-webhook%20offline_access&redirect_uri=${BASE_URL_API}/jira/oauth/callback&state=${encodeURIComponent(JSON.stringify(stateObj))}&response_type=code&prompt=consent`;

        setTimeout(() => {
            window.open(authorizeUrl, "_self");
        }, 300);
        setAllConnectLoading('');
    };

    const onConnect = async (type, recordUpdateId, forAllLoad = '') => {
        if (!projectDetailsReducer.id) return;

        const payload = {
            projectId: projectDetailsReducer.id,
            type: type,
            id: recordUpdateId?.toString() || "",
            settings: type == '1' ? slackData : type == '2' ? gitHubData : type == '5' ? jiraData : {}
        }

        setLoading(type)
        setLoadingForAll(forAllLoad)
        const response = await apiService.connectIntegration(payload);
        if (response.success) {
            setGetApicall(false)
            setLoading('')
            setLoadingForAll('')
            toast({ description: response?.message })
            onCloseAllModal()
            await getIntegrations()
        } else {
            setLoading('')
            setLoadingForAll('')
            toast({ description: response?.error?.message, variant: "destructive" });
        }
    }

    const onDisconnect = async (intId, type, onSuccessCallback) => {
        setLoading(type)
        const response = await apiService.disconnectIntegration(intId);
        setLoading('')
        if (response.success) {
            toast({ description: response?.message })
            if (type == '1') {
                setSlackData(initialSlack)
            } else if (type == '2') {
                setGitHubData(initialData)
            } else if (type == '4') {
                setHubSpotData(initialHP)
            }
            else if (type == '5') {
                setJiraData(initialData)
            }

            if (onSuccessCallback) {
                onSuccessCallback(response); // 🔑 open instructions instead of closing modal directly
            }

            if (type != '4') {
                handlePageChange('')
                onCloseAllModal()
                await getIntegrations()
            }


        } else {
            toast({ description: response.error.message, variant: "destructive" })
        }
    }

    const integrationTypeExists = (type) => integrationsData?.some((x) => x?.integrationType == type);

    const integrationExistsId = (type) => {
        const integration = integrationsData?.find(x => x?.integrationType == type);
        return integration?.id || '';
    }

    // const findKeyValue = (type, key) => {
    //     const matchingIntegrations = integrationsData?.filter((x) => x.integrationType == type) || [];
    //     const lastMatch = matchingIntegrations?.pop();
    //     return lastMatch?.[key];
    // };

    const disconnectModalOpen = (intId) => {
        setAllModal('disconnectModalOpen')
        setDisconnectId(intId)
    }

    const handlePageChange = (typeChange) => {
        if (typeChange) {
            navigate({
                pathname: `${baseUrl}/integrations/${typeChange}`,
                search: '',
            });
        } else {
            navigate({
                pathname: `${baseUrl}/integrations`,
                search: '',
            });
        }
    }

    const allOfThem = [
        {
            id: integrationExistsId(1),
            integrationType: 1,
            isPlan: projectDetailsReducer?.plan < 2,
            img: slackIntImg,
            imgClass: "max-w-6",
            label: 'Slack',
            imgBgColor: '#ECF8FC',
            desc: 'Get real-time alerts for new feedback, and updates-right in your Slack channels.',
            loading: loading == '1',
            connect: integrationTypeExists('1'),
            onClick: () => integrationTypeExists('1') ? handlePageChange('slack') : getSlackIntegration('1'),
            buttonText: integrationTypeExists('1') ? "Settings" : "Connect",
            disabled: projectDetailsReducer?.plan < 2,
            isNew: false
        },
        {
            id: integrationExistsId(2),
            integrationType: 2,
            isPlan: projectDetailsReducer?.plan < 2,
            img: gitHubIntImg,
            imgClass: "max-w-7",
            label: 'GitHub',
            imgBgColor: '#00000017',
            desc: 'Connect GitHub to turn feedback into issues and changelogs automatically.',
            loading: loading == '2',
            connect: integrationTypeExists('2'),
            onClick: () => integrationTypeExists('2') ? handlePageChange('github') : getGitHubIntegration('2'),
            buttonText: integrationTypeExists('2') ? "Settings" : "Connect",
            disabled: projectDetailsReducer?.plan < 2,
            isNew: false
        },
        {
            id: integrationExistsId(3),
            integrationType: 3,
            isPlan: projectDetailsReducer?.plan < 2,
            img: zapierIntImg,
            imgClass: "max-w-12",
            label: 'Zapier',
            imgBgColor: '#fff1eb',
            desc: 'Easily connect Quickhunt to 5,000+ apps and boost productivity.',
            disabled: projectDetailsReducer?.plan < 2,
            loading: false,
            connect: integrationTypeExists('3'),
            onClick: () => window.open('https://zapier.com/apps/quickhunt/integrations', '_blank'),
            buttonText: integrationTypeExists('3') ? "Disconnect" : "Connect",
            isNew: false
        },
        {
            id: integrationExistsId(4),
            integrationType: 4,
            isPlan: projectDetailsReducer?.plan < 2,
            img: HubSpotImg,
            imgClass: "max-w-7",
            label: 'Hubspot',
            imgBgColor: '#ff7a5936',
            desc: 'Connect Hubspot to turn feedback into issues and changelogs automatically.',
            loading: loading == '4',
            connect: integrationTypeExists('4'),
            onClick: () => integrationTypeExists('4') ? handlePageChange('hubspot') : getHubSpotIntegration('4'),
            buttonText: integrationTypeExists('4') ? "Settings" : "Connect",
            disabled: projectDetailsReducer?.plan < 2,
            isNew: false,
        },
        {
            id: integrationExistsId(5),
            integrationType: 5,
            isPlan: projectDetailsReducer?.plan < 2,
            img: JiraImg,
            imgClass: "max-w-10",
            label: 'Jira',
            imgBgColor: '#146ae021',
            desc: "The Jira integration lets you configure status syncing with Jira once you've set up the integration.",
            loading: loading == '5',
            connect: integrationTypeExists('5'),
            onClick: () => integrationTypeExists('5') ? handlePageChange('jira') : getJiraIntegration('5'),
            buttonText: integrationTypeExists('5') ? "Settings" : "Connect",
            // disabled: projectDetailsReducer?.plan < 2,
            disabled: true,
            isNew: false,
            isSoon: true,
        },
    ];

    const onEditLink = (type = '') => {
        // if (type == '4') {
        //     onHubspot()
        // }
    }

    const onCloseAllModal = (forceNavigate = false) => {
        setAllModal("");
        setDisconnectId("");
        if (forceNavigate) {
            navigate(`${baseUrl}/integrations?pageNo=${pageNo}`);
        }
    };

    const titleOfIntegration = () => {
        const integrationTitles = {
            slack: {
                title: "Slack Integration",
                subTitle: "Connect your workspace to receive real-time Slack notifications and Never miss a comment, vote, or reaction - stay informed as your users engage.",
            },
            github: {
                title: "GitHub",
                subTitle: "Quickhunt for GitHub helps you turn user feedback into GitHub issues, keeping your engineering and product teams aligned. Automatically sync statuses and even publish changelog directly from commit messages.",
            },
            hubspot: {
                title: "HubSpot",
                subTitle: "Connect Quickhunt with HubSpot to get instant alerts",
            },
        };

        return integrationTitles[integrationType] || {
            title: "Powerful Integrations",
            subTitle: "Power up your product workflow by integrating with tools that help you work better, together.",
        };
    };

    const goBack = () => {
        handlePageChange('')
        setGetApicall(true)
    }

    return (
        <Fragment>
            <Fragment>
                <DisconnectIntegration {...{
                    allModal,
                    onCloseAllModal,
                    loading,
                    onDisconnect,
                    integrationExistsId,
                    disconnectId,
                    setDisconnectId
                }} />
            </Fragment>

            <div className={`sm:px-6 px-3 w-full sm:pb-6 pb-4`}>
                <div className={"max-w-[1000px] m-auto h-full"}>
                    <div className={"sm:pb-6 sm:pt-6 pt-3 pb-4 flex gap-2 items-center"}>
                        {!isEmpty(integrationType) &&
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size={"icon"} onClick={goBack}
                                        variant={"outline"} className={'min-w-10'}><ArrowLeft size={18} /></Button>
                                </TooltipTrigger>
                                <TooltipContent className={"font-normal text-sm"}>Back</TooltipContent>
                            </Tooltip>
                        }

                        <div>
                            <h2 className={"text-xl font-bold"}>{titleOfIntegration().title}</h2>
                            <p className={"text-sm text-gray-500"}>{titleOfIntegration().subTitle}</p>
                        </div>
                    </div>

                    <Fragment>
                        {integrationType === "slack" && <SlackIntegration {...{
                            loading,
                            onConnect,
                            integrationTypeExists,
                            loadingForAll,
                            isIntLoading,
                            disconnectModalOpen,
                            slackData,
                            setSlackData,
                            allConnectLoading,
                            getSlackIntegration,
                        }} />}

                        {integrationType === "github" && <GithubIntegration {...{
                            loading,
                            onConnect,
                            integrationTypeExists,
                            loadingForAll,
                            isIntLoading,
                            disconnectModalOpen,
                            gitHubData, setGitHubData,
                            allConnectLoading,
                        }} />}

                        {
                            integrationType === 'hubspot' &&
                            <HubSpotIntegration {...{
                                hubSpotData, loading,
                                integrationTypeExists,
                                isIntLoading,
                                disconnectModalOpen,
                            }} />
                        }

                        {integrationType === 'jira' && <JiraIntegration {...{
                            loading,
                            onConnect,
                            integrationTypeExists,
                            loadingForAll,
                            isIntLoading,
                            disconnectModalOpen,
                            jiraData, setJiraData,
                            allConnectLoading,
                        }} />}

                    </Fragment>

                    {isEmpty(integrationType) &&
                        <Fragment>
                            {isIntLoading ? integrationLoad(6) :
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allOfThem.map((x, i) => {
                                        return (
                                            <Fragment key={i}>
                                                {x.integrationType !== null ? (
                                                    <Card className="w-full min-h-[100%] rounded-lg flex flex-col">
                                                        <div
                                                            className="flex items-center justify-center py-6 h-[200px] rounded-t-lg "
                                                            style={{ backgroundColor: x.imgBgColor, }}
                                                        >
                                                            <div
                                                                className="bg-white rounded-2xl shadow-md w-16 h-16 flex justify-center items-center">
                                                                <img className={` ${x.imgClass}`} src={x.img} />
                                                            </div>
                                                        </div>
                                                        <CardContent
                                                            className="sm:p-5 sm:pt-4 p-4 pt-3 flex flex-col justify-between flex-grow">
                                                            <CardTitle className="text-lg font-semibold text-gray-900">
                                                                <div className={"flex items-center gap-2"}>
                                                                    <h3 className={`font-semibold text-md`}>
                                                                        {x.label}
                                                                    </h3>
                                                                    {x.isPlan ? null : x.connect ? (
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant={"link hover:no-underline"}
                                                                                    className={"h-2 w-2 p-0"}>
                                                                                    <Badge
                                                                                        className={"h-2 w-2 rounded p-0 bg-green-700 hover:bg-green-700"}>
                                                                                        &nbsp;
                                                                                    </Badge>
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent
                                                                                className={"font-normal text-sm"}>
                                                                                Connected
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    ) : ""}
                                                                    {x.isPlan ? <PlanBadge title={'Growth'} /> : ""}
                                                                    {x.isNew ? <Badge>New</Badge> : ""}
                                                                    {x.isSoon ? <Badge variant={'destructive'}>Coming
                                                                        Soon</Badge> : ""}
                                                                </div>
                                                            </CardTitle>
                                                            <p className="text-gray-600 pt-2 text-sm md:min-h-[80px] overflow-hidden break-words">{x.desc}</p>

                                                            <div className={"md:mt-3 mt-5 flex justify-between"}>
                                                                <Button
                                                                    className={"gap-2"}
                                                                    onClick={(isIntLoading || x.isPlan || loading == x.integrationType) ? null : x.onClick}
                                                                    disabled={(([1, 2, 3, 4, 5]?.includes(x.integrationType)) && allConnectLoading == x.integrationType) || x.isPlan || isIntLoading || x.disabled}
                                                                    variant={"outline"}
                                                                >
                                                                    {x.buttonText ? x.buttonText : x.connect ? 'Disconnect' : 'Connect'}
                                                                    {(([1, 2]?.includes(x.integrationType)) && allConnectLoading == x.integrationType) ?
                                                                        <Loader2 className={"animate-spin"} size={15} /> :
                                                                        ([1, 2, 3, 4, 5]?.includes(x.integrationType)) ?
                                                                            <MoveRight size={15} /> :
                                                                            <ArrowRightLeft size={15} />}
                                                                </Button>

                                                                {x.connect && (
                                                                    ([0]?.includes(x.integrationType)) && (
                                                                        <DropdownMenu align={"end"} className="flex">
                                                                            <DropdownMenuTrigger
                                                                                className={"focus-visible:none outline-0 border-0py-2 px-2 rounded-md hover:bg-secondary"}>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <EllipsisVertical size={17} />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent
                                                                                        className={"font-normal text-sm"}>
                                                                                        Actions
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </DropdownMenuTrigger>

                                                                            <DropdownMenuContent align={"end"} className={"gap-3"}>
                                                                                {x.connect &&
                                                                                    ([0]?.includes(x.integrationType)) ? (
                                                                                    <DropdownMenuItem
                                                                                        className={"cursor-pointer flex gap-2"}
                                                                                        disabled={loading == x.integrationType || x.isPlan || x.disabled}
                                                                                        onClick={() => onEditLink(x.integrationType)}
                                                                                    >
                                                                                        <Pencil size={15} />{" "}Edit
                                                                                    </DropdownMenuItem>
                                                                                ) : ("")}
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    )
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ) : (
                                                    <Card
                                                        className="w-full h-full md:min-h-[250px] min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-blue-500 rounded-xl bg-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                                                        onClick={x.onClick}
                                                    >
                                                        <div
                                                            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                                                            <Plus size={24} className="text-blue-500" />
                                                        </div>
                                                        <h3 className="text-blue-600 font-semibold text-lg mt-3">{x.label}</h3>
                                                        <p className="text-gray-500 text-sm text-center mt-1 px-4">{x.desc}</p>
                                                    </Card>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                    }
                                </div>
                            }
                        </Fragment>
                    }
                </div>
            </div>

        </Fragment>
    )
};

export default Integrations;