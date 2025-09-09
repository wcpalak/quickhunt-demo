import React, { Fragment, useState, useEffect } from 'react';
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { apiService, DO_SPACES_ENDPOINT, getTokenVerify, getUserCountry, identifyUser, setProjectDetails, TOKEN_KEY, trackEvent, urlRegExp } from "../../../../utils/constent";
import { Input } from "../../../ui/input";
import { projectDetailsAction } from "../../../../redux/action/ProjectDetailsAction";
import { useDispatch } from "react-redux";
import { useToast } from "../../../ui/use-toast";
import { CircleX, Info, Loader2, Upload, X } from "lucide-react";
import TimezoneSelector from "../../../Comman/TimezoneSelector";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip.jsx";
import { Progress } from "@/components/ui/progress.jsx";

const initialStateProject = {
    name: '',
    website: "",
    domain: '',
    languageId: '3',
    timezoneId: '90',
    logo: '',
    favicon: '',
    apiKey: '',
    status: 1,
    browser: '',
    ipAddress: '',
    timezone: '',
    country: ''
}

const initialStateErrorProject = {
    name: '',
    timezone: '',
    website: '',
    domain: '',
}

const Step3 = ({ setStep, step, progress, setProgress }) => {
    const dispatch = useDispatch();
    const { toast } = useToast();

    const [createProjectDetails, setCreateProjectDetails] = useState(initialStateProject);
    const [formError, setFormError] = useState(initialStateErrorProject);
    const [isCreateLoading, setIsCreateLoading] = useState(false);

    useEffect(() => {
        async function fetchCountry() {
            const country = await getUserCountry();
            setCreateProjectDetails(prev => ({ ...prev, country: country || '' }));
        }
        fetchCountry();
    }, []);

    const onChangeText = (name, value) => {
        if (name === "name" || name === 'domain') {
            const cleanDomain = (name) => name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const sanitizedProjectName = cleanDomain(value);
            setCreateProjectDetails({ ...createProjectDetails, [name]: value, domain: sanitizedProjectName });
        } else {
            setCreateProjectDetails({ ...createProjectDetails, [name]: value, });
        }
        setFormError(formError => ({ ...formError, [name]: "" }));
    };

    const formValidate = (name, value) => {
        switch (name) {
            case "name":
                if (!value || value.trim() === "") {
                    return "Project name is required";
                } else if (value.length > 250) {
                    return "Project name must be less than or equal to 250 characters.";
                } else {
                    return "";
                }
            case "timezone":
                if (!value || value.trim() === "") {
                    return "Time zone is required";
                } else {
                    return "";
                }
            case "logo":
                if (value && value.size > 5 * 1024 * 1024) { // 5 MB
                    return "Image size must be less than 5 MB.";
                } else {
                    return "";
                }
            case "website":
                if (value && !value.match(urlRegExp)) {
                    return "Project URL is invalid";
                } else {
                    return "";
                }
            case "domain":
                if (!value || value.trim() === "") {
                    return "Project domain is required";
                } else {
                    return "";
                }
            default: {
                return "";
            }
        }
    };

    const onFinishSetup = async () => {
        let validationErrors = {};
        Object.keys(createProjectDetails).forEach(name => {
            const error = formValidate(name, createProjectDetails[name]);
            if (error && error.length > 0) {
                validationErrors[name] = error;
            }
        });
        if (Object.keys(validationErrors).length > 0) {
            setFormError(validationErrors);
            setIsCreateLoading(false);
            return;
        }
        const cleanDomain = (name) => name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const sanitizedProjectName = cleanDomain(createProjectDetails.name);
        const domain = `${cleanDomain(createProjectDetails.domain || sanitizedProjectName)}.quickhunt.app`;

        const payload = {
            ...createProjectDetails,
            onBoardComplete: 1,
            domain,
            country: createProjectDetails.country
        };

        setIsCreateLoading(true);
        const data = await apiService.createProjects(payload, { Authorization: `Bearer ${getTokenVerify()}` }, true)
        if (data.success) {
            let obj = { ...data.data, onBoardComplete: 1 };
            trackEvent("Onboarding", {
                projectId: obj.id,
                projectName: obj.name,
                projectDomain: obj.domain,
                userId: obj.userId,
                completed: "true"
            });

            setProjectDetails(obj);
            dispatch(projectDetailsAction(obj))
            toast({ description: data.message })
            setProgress(100)
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1500);
            });
            setStep(4);
            setIsCreateLoading(false);
            setCreateProjectDetails(initialStateProject)
            localStorage.setItem(TOKEN_KEY, getTokenVerify());
        } else {
            setIsCreateLoading(false);
            toast({ variant: "destructive", description: data.error.message })
        }
    }

    const onStep = (stepCount) => {
        setStep(stepCount)
    }

    const onDeleteImgLogo = async (name, value) => {
        setCreateProjectDetails({ ...createProjectDetails, [name]: value })
        setFormError(formError => ({ ...formError, logo: '' }));
    }

    const handleFileChange = (file) => {
        const selectedFile = file.target.files[0];
        setCreateProjectDetails({ ...createProjectDetails, logo: selectedFile });
        setFormError(formError => ({ ...formError, 'logo': formValidate('logo', selectedFile) }));
    };

    return (
        <Fragment>
            <div className={"flex flex-col justify-center gap-6"}>
                <div>
                    <h2 className={"font-semibold text-3xl "}>Quick Project Setup</h2>
                    <p className={"text-base  pt-3 font-normal"}>Get started by creating your first project and streamline feedback management effortlessly.</p>
                </div>
                <div className={`space-y-5`}>

                    <div className={"flex flex-col md:flex-row flex-wrap gap-[20px] md:gap-4"}>
                        <div className="w-full md:w-[132px] h-auto relative rounded-md">
                            {
                                createProjectDetails?.logo ?
                                    <div className="w-full md:w-[132px] h-[136px] relative border rounded-md flex justify-center items-center">
                                        <img
                                            className="max-w-full max-h-full rounded-md object-contain"
                                            src={createProjectDetails.logo?.name ? URL.createObjectURL(createProjectDetails.logo) : `${DO_SPACES_ENDPOINT}/${createProjectDetails.logo}`}
                                            alt="logo"
                                        />
                                        <CircleX
                                            size={20}
                                            className="stroke-gray-500 cursor-pointer absolute top-[0%] left-[100%] translate-x-[-50%] translate-y-[-50%] z-10"
                                            onClick={() => onDeleteImgLogo("logo", "")}
                                        />
                                    </div>
                                    :
                                    <div className={'h-full w-full'}>
                                        <input id="logo" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        <label htmlFor="logo" className={`flex h-full w-full py-0 justify-center items-center flex-shrink-0 bg-white rounded border border-input cursor-pointer`}>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="font-normal text-sm max-w-80">
                                                        Select project logo
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </label>
                                    </div>
                            }
                        </div>
                        <div className={"md:flex-1 md:space-y-0 space-y-[20px]"}>
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-right font-normal after:ml-1 after:content-['*'] after:text-destructive">Project Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Project name"
                                    className={`placeholder:text-muted-foreground/75`}
                                    value={createProjectDetails.name}
                                    name="name"
                                    onChange={(e) => onChangeText('name', e.target.value)}
                                />
                                {formError.name && <span className="text-destructive text-sm">{formError.name}</span>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="website" className="text-right font-normal">Project Website</Label>
                                <Input
                                    id="website"
                                    placeholder="https://yourcompany.com"
                                    className={`placeholder:text-muted-foreground/75`}
                                    value={createProjectDetails.website}
                                    name="website"
                                    onChange={(e) => onChangeText('website', e.target.value)}
                                />
                                {formError.website && <span className="text-destructive text-sm">{formError.website}</span>}
                            </div>
                        </div>
                    </div>
                    {formError.logo && <span className="text-destructive text-sm">{formError.logo}</span>}

                    <div className="space-y-1">
                        <Label htmlFor="domain" className="text-right font-normal after:ml-1 after:content-['*'] after:text-destructive">Project Domain</Label>
                        <div className="relative">
                            <Input
                                id="domain"
                                name="domain"
                                placeholder="e.g. myapp"
                                className="placeholder:text-muted-foreground/75 pr-[110px]"
                                value={createProjectDetails.domain}
                                onChange={(e) => onChangeText("domain", e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 text-sm font-medium">.quickhunt.app</span>
                        </div>
                        {formError.domain && (<span className="text-destructive text-sm">{formError.domain}</span>)}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="timezone" className="text-right font-normal after:ml-1 after:content-['*'] after:text-destructive flex items-center gap-1">Time Zone
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info size={15} />
                                    </TooltipTrigger>
                                    <TooltipContent>Adjust your project's time zone for proper scheduling and reports.</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <TimezoneSelector {...{ timezone: createProjectDetails.timezone, onChange: onChangeText, }} />
                        {formError.timezone && <span className="text-destructive text-sm">{formError.timezone}</span>}
                    </div>
                </div>
            </div>
            <div className="flex flex-row items-center gap-3 w-full md:flex-1">
                <Progress value={progress} className="h-2 bg-muted-foreground/20 flex-1" />
                <Label className="ml-2 whitespace-nowrap">Step {step}/3</Label>
            </div>
            <div className={"flex gap-2 justify-start"}>
                <Button variant={"outline hover:bg-none"} className={"border border-primary text-primary font-semibold px-[29px]"} onClick={() => onStep(2)}>Back</Button>
                <Button className="font-semibold hover:bg-primary md:w-auto gap-1 " disabled={isCreateLoading} onClick={() => onFinishSetup(4)}>
                    {isCreateLoading ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : ("")}Finish Sign up
                </Button>
            </div>
        </Fragment>
    );
};

export default Step3;