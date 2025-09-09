import React, {Fragment} from 'react';
import {Loader2} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.jsx";
import {Input} from "@/components/ui/input.jsx";
import {Label} from "@/components/ui/label.jsx";
import {Button} from "@/components/ui/button.jsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {useSelector} from "react-redux";
import {isEmpty} from "../../../utils/constent";
import {Textarea} from "../../ui/textarea";

const GtiHubCreateIssue = ({open, gitHubAllRepo, gitHubRepoData, setGitHubRepoData, onCloseModal, onCreateIssue, isGHRepoCreate}) => {
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const handleChange = (name, value) => {
        setGitHubRepoData({...gitHubRepoData, [name]: value})
    }

    return (
        <Fragment>
            <Dialog open={open} onOpenChange={isGHRepoCreate ? null : onCloseModal}>
                <DialogContent className="sm:max-w-xl p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>Create a new Github issue</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900 space-y-6"}>
                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                   htmlFor={"repo"}>Repository</Label>
                            <Select value={gitHubRepoData?.repoName} disabled={projectDetailsReducer?.plan < 2}
                                    onValueChange={(value) => handleChange('repoName', value)}
                            >
                                <SelectTrigger id={"repo"}>
                                    <SelectValue placeholder="Select a Repository" value={gitHubRepoData?.repoName}/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {
                                            gitHubAllRepo.length > 0 ?
                                                (gitHubAllRepo || []).map((x, i) => {
                                                    return (
                                                        <SelectItem key={i} value={x?.name}>{x?.name}</SelectItem>
                                                    )
                                                }) :
                                                <SelectItem disabled value={'No repository available'}>No repository available</SelectItem>
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                   htmlFor={"issueTitle"}>Title</Label>
                            <Input placeholder={'Enter title'} disabled={projectDetailsReducer?.plan < 2}
                                   value={gitHubRepoData?.issueTitle} id={'issueTitle'}
                                   onChange={(e) => handleChange('issueTitle',  e.target.value)}
                            />
                        </div>
                        <div className={"grid gap-1.5"}>
                            <Label className={"font-medium after:ml-1 after:content-['*'] after:text-destructive"}
                                   htmlFor={"issueDescription"}>Description</Label>
                            <Textarea placeholder={'Enter description'} className={'bg-white'}
                                   value={gitHubRepoData?.issueDescription}
                                    id={'issueDescription'} disabled={projectDetailsReducer?.plan < 2}
                                   onChange={(e) => handleChange('issueDescription',  e.target.value)}
                            />
                        </div>

                    </DialogDescription>
                    <DialogFooter
                        className={"p-4 border-t items-center flex-row gap-2  flex-wrap"}>
                        <Button type="button" variant={"secondary"}
                                onClick={isGHRepoCreate ? null : onCloseModal} disabled={isGHRepoCreate || projectDetailsReducer?.plan < 2}
                        >
                            Cancel
                        </Button>
                        <Button type="submit"
                                onClick={onCreateIssue} disabled={isGHRepoCreate || isEmpty(gitHubRepoData?.repoName) || isEmpty(gitHubRepoData?.issueTitle) || isEmpty(gitHubRepoData?.issueDescription) || projectDetailsReducer?.plan < 2}
                        >
                            {isGHRepoCreate && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default GtiHubCreateIssue;