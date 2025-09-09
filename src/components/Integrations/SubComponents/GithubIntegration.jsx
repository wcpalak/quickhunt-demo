import React, {Fragment} from 'react';
import {Button} from "@/components/ui/button.jsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {CircleAlert, Loader2, X,} from "lucide-react";
import {isEmpty, toggleChat} from "../../../utils/constent";
import {Card, CardContent, CardFooter} from "../../ui/card";
import PlanBadge from "../../Comman/PlanBadge";
import {useSelector} from "react-redux";
import {commonParagraph} from "../../../utils/Loader";
import {Checkbox} from "../../ui/checkbox";
import {Switch} from "../../ui/switch";
import {Label} from "../../ui/label";
import {Icon} from "../../../utils/Icon";
import {Alert, AlertDescription, AlertTitle,} from "@/components/ui/alert"

const GithubIntegration = ({
                               loading,
                               onConnect,
                               integrationTypeExists,
                               loadingForAll,
                               isIntLoading,
                               disconnectModalOpen,
                               gitHubData,
                               setGitHubData,
                           }) => {

    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allStatusAndTypes = useSelector(state => state.allStatusAndTypes);

    const handleChange = (name, value) => {
        setGitHubData({...gitHubData, [name]: value})
    }

    const selectionChoice = [
        {
            label: 'Auto-Publish Changelog from GitHub Commits',
            desc: 'Quickhunt will now automatically create and publish changelog whenever a commit message follows the required format.',
            checkedKey: 'isSync',
        },
    ]

    const githubConnect = () => {
        onConnect('2', gitHubData?.id, 'githubSave')
    }

    const isStatus = gitHubData?.roadmapStatusId && !(allStatusAndTypes?.roadmapStatus || []).some(x => x.id == gitHubData.roadmapStatusId);

    return (
        <Fragment>
            {
                isIntLoading ? null : isStatus &&
                <Alert className="mb-4 bg-red-100 border border-destructive relative">
                    <CircleAlert size={17}/>
                    <AlertTitle>
                        Missing Status
                    </AlertTitle>
                    <AlertDescription className="pt-1">
                        The status linked to this item no longer exists. Please select a valid status to continue.
                    </AlertDescription>
                </Alert>
            }

            <Card className={'shadow'}>
                <CardContent className={`sm:p-6 p-4`}>
                    <div>
                        <div className={'mb-8 flex justify-between gap-2 flex-wrap'}>
                            <div className={"w-[130px]"}>{Icon.QhGhPin}</div>
                        </div>

                        <div className={'grid gap-4'}>
                            {
                                isIntLoading ? commonParagraph(4) : <Fragment>
                                    <div className={"grid gap-2"}>
                                        <div className={'flex flex-col gap-4'}>

                                            <div className={'flex items-center gap-2'}>
                                                <Switch id={'isActive'}  checked={gitHubData?.isActive} onCheckedChange={(checked) => handleChange('isActive', checked)}/>
                                                <Label htmlFor={'isActive'} className={"cursor-pointer"}>  Enable Integration</Label>
                                            </div>

                                            <div className={'flex flex-col gap-2'}>
                                                <h2 className={'font-medium text-sm'}>Set Automation Rules:</h2>

                                                <div className={'max-w-xl'}>
                                                    <span className={'text-sm'}>{' '} When {' '}</span>

                                                    <span className={'inline-block'}>{' '}
                                                        <Select disabled={projectDetailsReducer?.plan < 2}
                                                                value={gitHubData?.isAny} onValueChange={(value) => handleChange('isAny', value)}>
                                                    <SelectTrigger className="w-[80px] h-7">
                                                        <SelectValue placeholder="Select"/>
                                                    </SelectTrigger>
                                                    <SelectContent className="w-[80px]">
                                                        <SelectGroup>
                                                            <SelectItem value={true}>Any</SelectItem>
                                                            <SelectItem value={false}>All</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select> {' '}
                                                    </span>

                                                    <span className={'text-sm'}>{' '}linked GitHub issues are closed, automatically change the status of the linked Quickhunt feedback to {' '}</span>

                                                    <span className={'inline-block'}>{' '}
                                                        <Select value={gitHubData?.roadmapStatusId} disabled={projectDetailsReducer?.plan < 2}
                                                                onValueChange={(value) => handleChange('roadmapStatusId', value)}
                                                        >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select Status"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                { allStatusAndTypes?.roadmapStatus?.length > 0 ?
                                                                    (allStatusAndTypes?.roadmapStatus || []).map((x,i) => {
                                                                        return (
                                                                            <SelectItem key={i} value={x?.id}>{x?.title}</SelectItem>
                                                                        )
                                                                    }) : <SelectItem disabled value={'No status available'}>No status available</SelectItem>
                                                                }
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>{' '}
                                                    </span>

                                                    <span className={'text-sm'}>{' '}, and {' '}</span>

                                                    <span className={'inline-block'}>{' '}
                                                        <Select value={gitHubData?.isNotify} disabled={projectDetailsReducer?.plan < 2}
                                                                onValueChange={(value) => handleChange('isNotify', value)}
                                                        >
                                                        <SelectTrigger className="w-[135px] h-7">
                                                            <SelectValue placeholder="Select"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value={true}>notify</SelectItem>
                                                                <SelectItem value={false}>do not notify</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>{' '}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectionChoice.map(({ label, desc, checkedKey }, i) => (
                                        <div>
                                            <div key={i} className="flex space-x-2 items-center">
                                                <Checkbox
                                                    id={label} className={''}
                                                    disabled={projectDetailsReducer?.plan < 2}
                                                    checked={gitHubData?.[checkedKey]}
                                                    onCheckedChange={(checked) => handleChange(checkedKey, checked)}
                                                />
                                                <label htmlFor={label} className="text-sm font-semibold cursor-pointer">
                                                    {label}
                                                </label>
                                            </div>
                                            <span className="text-gray-500 text-sm pl-6">
                                            {' '} {desc}{' '}{projectDetailsReducer?.plan < 2 && (
                                                <PlanBadge title={'Growth'}/>)}
                                    </span>
                                        </div>
                                    ))}
                                </Fragment>
                            }
                        </div>
                    </div>
                </CardContent>

                <CardFooter className={"flex gap-2 justify-between border-t sm:p-6 p-4 sm:pt-5 pt-4"}>
                    <div>
                        Need help? <Button className={"p-0 h-auto font-normal"} variant={"link"} onClick={toggleChat}>Contact
                        Us</Button>
                    </div>
                    <div className={"flex gap-2 justify-end"}>
                        <Button onClick={githubConnect}
                                disabled={loading == '2' || projectDetailsReducer?.plan < 2 || isEmpty(gitHubData?.roadmapStatusId) || isStatus}
                                className={`relative`}>
                            {(loading == '2' && loadingForAll === 'githubSave') && <span
                                className="absolute inset-0 flex justify-center items-center"><Loader2
                                className="h-4 w-4 animate-spin"/></span>}
                            Save
                        </Button>

                        {
                            integrationTypeExists('2') &&
                            <Button variant={'destructive'} className={`relative`}
                                    onClick={() => disconnectModalOpen('2')}
                                    disabled={projectDetailsReducer?.plan < 2 || loading == '2' || !integrationTypeExists('2')}>
                                Disconnect
                            </Button>
                        }
                    </div>
                </CardFooter>
            </Card>
        </Fragment>
    );
};

export default GithubIntegration;