import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { AlertTriangle, Loader2, TriangleAlert } from 'lucide-react';

const ProjectLimitErrorDialog = ({
    open,
    onClose,
    userProjects = [],
    requiredDelete = 0,
    selectedProjects = [],
    setSelectedProjects,
    loading = false,
    onDeleteProjects,
    message = '',
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className={"text-base font-medium flex items-center gap-2"}>
                        <AlertTriangle className="w-5 h-5 text-base" />
                        <span className={"text-base font-medium"}>Project Limit Exceeded for Selected Plan</span>
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="p-4 text-gray-900 font-medium">
                    <div className="grid w-full place-items-start gap-1.5">
                        <div dangerouslySetInnerHTML={{ __html: message }} />
                        <div className="mt-3">
                            <div className=" font-semibold">Select projects to delete:</div>
                            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-2 p-2 bg-gray-50 rounded justify-items-center">
                                {[...userProjects]
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((proj) => (
                                        <label
                                            key={proj.id}
                                            className="flex items-center gap-2 w-full justify-start"
                                        >
                                            <Checkbox
                                                className="m-2"
                                                checked={selectedProjects.includes(proj.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        if (selectedProjects.length >= userProjects.length - 1) {
                                                            const projectToUncheck = selectedProjects[0];
                                                            setSelectedProjects((prev) => [
                                                                ...prev.filter(id => id !== projectToUncheck),
                                                                proj.id
                                                            ]);
                                                        } else {
                                                            setSelectedProjects((prev) => [...prev, proj.id]);
                                                        }
                                                    } else {
                                                        setSelectedProjects((prev) => prev.filter((id) => id !== proj.id));
                                                    }
                                                }}
                                            />
                                            <span>{proj.name}</span>
                                        </label>
                                    ))}
                            </div>
                            <div className="flex items-center text-red-600 mt-2 text-sm">
                                <TriangleAlert className="w-4 h-4 mr-2 " />
                                <span>Important: Deleting a project is permanent and cannot be undone.</span>
                            </div>

                            <div class="mt-2 text-sm">Need help making a decision? <a href="https://calendly.com/quickhunt/30min" target="_blank" class="text-violet-600 hover:underline">Book a quick call</a></div>
                        </div>
                    </div>
                </DialogDescription>
                <DialogFooter className="pl-4 py-2 border-t flex-nowrap flex-row gap-2 md:justify-start sm:justify-start">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={selectedProjects.length < requiredDelete || loading}
                        onClick={onDeleteProjects}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : ''}Delete Selected Projects
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectLimitErrorDialog; 