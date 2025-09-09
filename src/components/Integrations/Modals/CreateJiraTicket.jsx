import React, { Fragment, useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";
import { apiService, isEmpty } from "../../../utils/constent";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useSelector } from "react-redux";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"

const CreateJiraTicket = ({ open, onCloseModal, jiraTicketData, setJiraTicketData, onCreateJiraTicket, isJiraTicketCreate }) => {
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [jiraProjects, setJiraProjects] = useState([]);
    const [jiraProjectIssues, setJiraProjectIssues] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isLoadingIssues, setIsLoadingIssues] = useState(false);

    const handleChange = (name, value) => {
        setJiraTicketData({ ...jiraTicketData, [name]: value });

        if (name === 'jiraProjectKey') {
            setJiraTicketData({ ...jiraTicketData, [name]: value, issueType: '' });
            setJiraProjectIssues([]);

            const selectedProject = jiraProjects.find(project => project.jiraProjectKey === value);
            if (selectedProject) {
                getJiraProjectIssues(selectedProject.jiraProjectId);
            }
        }
    }

    useEffect(() => {
        if (projectDetailsReducer.id && open) {
            getJiraProjects();
        }
    }, [projectDetailsReducer.id, open])

    const getJiraProjects = async () => {
        if (!projectDetailsReducer.id) return;

        setIsLoadingProjects(true);
        const payload = {
            projectId: projectDetailsReducer.id,
        }
        const response = await apiService.getJiraProjects(payload);
        setIsLoadingProjects(false);

        if (response.success) {
            setJiraProjects(response?.data || []);
        }
    };

    const getJiraProjectIssues = async (jiraProjectId) => {
        if (!projectDetailsReducer.id || !jiraProjectId) return;

        setIsLoadingIssues(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            jiraProjectId: jiraProjectId,
        }
        const response = await apiService.getJiraProjectIssues(payload);
        setIsLoadingIssues(false);

        if (response.success) {
            setJiraProjectIssues(response?.data || []);
        }
    };

    return (
        <Fragment>
            <Dialog open={open} onOpenChange={onCloseModal}>
                <DialogContent className="max-w-xl p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>Create new Jira issue</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900 space-y-4"}>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                htmlFor={"jiraProjectKey"}>Jira Project</Label>
                            <Select value={jiraTicketData?.jiraProjectKey} disabled={projectDetailsReducer?.plan < 2 || isLoadingProjects}
                                onValueChange={(value) => handleChange('jiraProjectKey', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select Jira Project"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {isLoadingProjects ? (
                                            <SelectItem disabled value={'loading'}>
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading projects...
                                                </div>
                                            </SelectItem>
                                        ) : jiraProjects?.length > 0 ? (
                                            jiraProjects.map((project, i) => (
                                                <SelectItem key={i} value={project?.jiraProjectKey}>
                                                    {project?.jiraProjectName} ({project?.jiraProjectKey})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem disabled value={'No projects available'}>
                                                No Jira projects available
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                htmlFor={"issuetype"}>Issue Type</Label>
                            <Select value={jiraTicketData?.issueType}
                                disabled={projectDetailsReducer?.plan < 2 || !jiraTicketData?.jiraProjectKey || isLoadingIssues}
                                onValueChange={(value) => handleChange('issueType', value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={
                                        !jiraTicketData?.jiraProjectKey ? "Select project first" :
                                            isLoadingIssues ? "Loading issue types..." :
                                                "Select Issue Type"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {isLoadingIssues ? (
                                            <SelectItem disabled value={'loading'}>
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading issue types...
                                                </div>
                                            </SelectItem>
                                        ) : jiraProjectIssues?.length > 0 ? (
                                            jiraProjectIssues.map((issueType, i) => (
                                                <SelectItem key={i} value={issueType?.jiraIssueType}>
                                                    {issueType?.jiraIssueType}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem disabled value={'No issue types available'}>
                                                {!jiraTicketData?.jiraProjectKey ? 'Select project first' : 'No issue types available'}
                                            </SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                htmlFor={"issueTitle"}>Title</Label>
                            <Input placeholder={'Enter title'} disabled={projectDetailsReducer?.plan < 2}
                                value={jiraTicketData?.issueTitle} id={'issueTitle'}
                                onChange={(e) => handleChange('issueTitle', e.target.value)}
                            />
                        </div>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                htmlFor={"issueDesc"}>Description</Label>
                            <Textarea placeholder={'Enter description'} disabled={projectDetailsReducer?.plan < 2}
                                value={jiraTicketData?.issueDesc} id={'issueDesc'} className={'bg-white'}
                                onChange={(e) => handleChange('issueDesc', e.target.value)}
                            />
                        </div>
                    </DialogDescription>
                    <DialogFooter
                        className={"p-4 border-t items-center flex-row gap-2 flex-wrap"}>
                        <Button type="button" variant={"secondary"}
                            onClick={isJiraTicketCreate ? null : onCloseModal}
                            disabled={projectDetailsReducer?.plan < 2}
                        >
                            Cancel
                        </Button>
                        <Button type="submit"
                            onClick={onCreateJiraTicket}
                            disabled={
                                isJiraTicketCreate ||
                                isEmpty(jiraTicketData?.jiraProjectKey) ||
                                isEmpty(jiraTicketData?.issueType) ||
                                isEmpty(jiraTicketData?.issueTitle) ||
                                isEmpty(jiraTicketData?.issueDesc) ||
                                projectDetailsReducer?.plan < 2
                            }
                        >
                            {isJiraTicketCreate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create & link issue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default CreateJiraTicket;