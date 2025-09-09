import React, { Fragment, useEffect, useState, useCallback } from 'react';
import { Loader2, Search } from "lucide-react";
import { apiService, isEmpty } from "../../../utils/constent";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useSelector } from "react-redux";
import { useToast } from "../../ui/use-toast";
import { debounce } from "lodash";

const LinkExistingJiraTicket = ({ open, onCloseModal, onLinkJiraTicket, linkJiraIndex, ideaId }) => {
    const { toast } = useToast();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [jiraIssues, setJiraIssues] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const searchJiraIssues = async (keyword = "") => {
        if (!projectDetailsReducer.id) return;

        setIsSearching(true);
        const payload = {
            projectId: projectDetailsReducer.id,
            keyword: keyword,
            ideaId: ideaId
        }

        const response = await apiService.searchJiraIssues(payload);
        setIsSearching(false);
        setHasSearched(true);

        if (response.success) {
            setJiraIssues(response?.data || []);
        } else {
            toast({
                description: response?.error?.message || "Failed to search Jira issues",
                variant: "destructive"
            });
        }
    };

    const debouncedSearch = useCallback(
        debounce((keyword) => {
            searchJiraIssues(keyword);
        }, 500),
        [projectDetailsReducer.id]
    );

    useEffect(() => {
        if (projectDetailsReducer.id && open) {
            searchJiraIssues("");
        }
    }, [projectDetailsReducer.id, open]);

    const handleSearchChange = (value) => {
        setSearchKeyword(value);
        debouncedSearch(value);
    };

    const handleLinkTicket = async (issueKey, index) => {
        const result = await onLinkJiraTicket(issueKey, index);

        // Only update the issues list if the API call was successful
        if (result?.success) {
            const updatedIssues = jiraIssues.filter((_, i) => i !== index);
            setJiraIssues(updatedIssues);
        }
    };

    const handleClose = () => {
        setSearchKeyword("");
        setJiraIssues([]);
        setHasSearched(false);
        debouncedSearch.cancel();
        onCloseModal();
    };

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    return (
        <Fragment>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl p-0 gap-0">
                    <DialogHeader className={"p-4 border-b"}>
                        <DialogTitle className={"text-md"}>Link to existing Jira issue</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className={"p-4 text-gray-900 space-y-4"}>

                        <div className="space-y-4">
                            <div className={"grid gap-1.5"}>
                                <Label className={"font-medium"} htmlFor={"search"}>
                                    Search Jira Issues
                                </Label>
                                <div className="relative">
                                    <Input
                                        placeholder={'Search by issue key, title, or description...'}
                                        disabled={projectDetailsReducer?.plan < 2}
                                        value={searchKeyword}
                                        id={'search'}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="pr-10"
                                    />
                                    <div className="absolute right-1 top-1 h-8 w-8 flex items-center justify-center">
                                        {isSearching ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                        ) : (
                                            <Search className="h-4 w-4 text-gray-400" title="Auto-search enabled - just type to search" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {isSearching ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Searching Jira issues...</span>
                                    </div>
                                </div>
                            ) : hasSearched && jiraIssues.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    {searchKeyword ?
                                        `No Jira issues found matching "${searchKeyword}"` :
                                        "No Jira issues found"
                                    }
                                </div>
                            ) : (
                                jiraIssues.map((issue, index) => (
                                    <div
                                        key={index}
                                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm text-gray-600 min-w-0 truncate">
                                                        {issue.issueTitle}
                                                    </span>

                                                </div>
                                            </div>


                                            <Button className={'gap-2 h-6 underline-offset-1 px-0'} variant={"link"} disabled={linkJiraIndex === index || projectDetailsReducer?.plan < 2} onClick={() => handleLinkTicket(issue.issueKey || issue.key, index)}>
                                                {linkJiraIndex === index ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Linking...
                                                    </>
                                                ) : (
                                                    "Link to Issue"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogDescription>
                    <DialogFooter className={"p-4 border-t items-center flex-row gap-2 flex-wrap"}>
                        <Button
                            type="button"
                            variant={"secondary"}
                            onClick={handleClose}
                            disabled={projectDetailsReducer?.plan < 2}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Fragment>
    );
};

export default LinkExistingJiraTicket;