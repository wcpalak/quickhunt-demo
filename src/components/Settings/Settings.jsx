import React, {useEffect, useState} from "react";
import {Button} from "../ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card";
import {baseUrl, useWindowSize} from "../../utils/constent";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import Profile from "./SettingPage/Profile/Profile";
import Team from "./SettingPage/Team";
import Project from "./SettingPage/Project";
import Domain from "./SettingPage/Domain";
import Labels from "./SettingPage/Labels";
import Categories from "./SettingPage/Categories";
import Tags from "./SettingPage/Tags";
import Statuses from "./SettingPage/Statuses";
import Social from "./SettingPage/Social";
import Emoji from "./SettingPage/Emoji";
import {
    FileText,
    Globe,
    Kanban,
    Menu,
    SmilePlus,
    UserRound,
    UsersRound,
    Settings2,
    Tag,
    Layers3,
    NotepadText,
    CircleDashed,
    CircleFadingPlus,
    FolderKey,
    Map,
    Link,
} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "../ui/popover";
import Board from "./SettingPage/Board";
import GeneralSettings from "./SettingPage/GeneralSettings";
import ImportExport from "./SettingPage/ImportExport/ImportExport";
import Roadmap from "./SettingPage/Roadmap";
import { useTour } from "../Comman/TourProvider";
import Referral from "./SettingPage/Referral";

const Settings = () => {
    let navigate = useNavigate();
    const {type, subType} = useParams();
    const { tourStep } = useTour();
    const { width } = useWindowSize();
    const isTourActive = tourStep !== null && tourStep < 7; // Assuming 7 is the final step
    const isMobileTourActive = isTourActive && width <= 1279;
    const [searchParams] = useSearchParams();
    const isfromOnboarding = searchParams.get("fromOnboarding") || false;
    const [open, setOpen] = useState(false);

    const isActive = (link) => {
        return type === link || `${type}/${subType}` === link;
    };

    const onRedirect = (link) => {
        navigate(`${baseUrl}/settings/${link}`);
        setOpen(false);
    };
    
    useEffect(() => {
        if ((!isfromOnboarding && isMobileTourActive) && (tourStep === 5)) {
            setOpen(true);
        } 
    }, [isMobileTourActive, isTourActive, width, tourStep, isfromOnboarding]);

    const settingsLinksList = [
        {
            title: "Profile",
            link: "profile",
            icon: <UserRound size={16}/>,
            selected: `${baseUrl}/profile`,
        },
        {
            title: "Team",
            link: "team",
            icon: <UsersRound size={16}/>,
            selected: `${baseUrl}/team`,
        },
        {
            title: "Project",
            link: "project",
            icon: <FileText size={16}/>,
            selected: `${baseUrl}/project`,
        },
        {
            title: "Domain",
            link: "domain",
            icon: <Globe size={16}/>,
            selected: `${baseUrl}/domain`,
        },
        {
            title: "Referral",
            link: "referral",
            icon: <Link size={16}/>,
            selected: `${baseUrl}/referral`,
        },
        {
            title: "Customize Feedback Portal",
            link: "general-settings",
            icon: <Settings2 size={16}/>,
            selected: `${baseUrl}/general-settings`,
            tourId: "general-settings-section"
        },
        {
            title: "Labels",
            link: "labels",
            icon: <Tag size={16} className={"rotate-90"}/>,
            selected: `${baseUrl}/labels`,
            useFor: "(Changelogs)",
        },
        {
            title: "Categories",
            link: "categories",
            icon: <Layers3 size={16}/>,
            selected: `${baseUrl}/categories`,
            useFor: "(Changelogs)",
        },
        {
            title: "Emoji",
            link: "emoji",
            icon: <SmilePlus size={17}/>,
            selected: `${baseUrl}/emoji`,
            useFor: "(Changelogs)",
        },
        {
            title: "Tags",
            link: "tags",
            icon: <NotepadText size={16}/>,
            selected: `${baseUrl}/tags`,
            useFor: "(Feedback)",
        },
        {
            title: "Boards",
            link: "board",
            icon: <Kanban size={17}/>,
            selected: `${baseUrl}/board`,
            useFor: "(Feedback)",
        },
        {
            title: "Roadmap",
            link: "roadmap",
            icon: <Map size={16}/>,
            selected: `${baseUrl}/roadmap`,
            useFor: "",
        },
        {
            title: "Statuses",
            link: "statuses",
            icon: <CircleDashed size={16}/>,
            selected: `${baseUrl}/statuses`,
            useFor: "(Roadmap)",
        },
        {
            title: "Social",
            link: "social",
            icon: <CircleFadingPlus size={16}/>,
            selected: `${baseUrl}/social`,
        },
        // {
        //     title: 'Import / Export',
        //     link: 'import-export',
        //     icon: Icon.importExport,
        //     selected: `${baseUrl}/import-export`,
        //     subLinks: [
        //         {
        //             title: 'Import',
        //             link: 'import',
        //             selected: `${baseUrl}/import-export/import`,
        //         },
        //     ],
        // },
        {
            title: "Import / Export",
            link: "import-export",
            icon: <FolderKey size={16}/>,
            subLinks: [
                {
                    title: "Import",
                    link: "import-export/import",
                },
            ],
        },
    ];

    const renderMenu = (type) => {
        switch (type) {
            case "profile":
                return <Profile/>;
            case "team":
                return <Team/>;
            case "project":
                return <Project/>;
            case "domain":
                return <Domain/>;
            case "referral":
                return <Referral/>;
            case "general-settings":
                return <GeneralSettings/>;
            case "labels":
                return <Labels/>;
            case "categories":
                return <Categories/>;
            case "tags":
                return <Tags/>;
            case "roadmap":
                return <Roadmap/>;
            case "statuses":
                return <Statuses/>;
            case "emoji":
                return <Emoji/>;
            case "social":
                return <Social/>;
            case "board":
                return <Board/>;
            case "import-export":
                return subType === "import" ? <ImportExport/> : <ImportExport/>;
            default:
                return null;
        }
    };

    return (
        <div className="container xl:max-w-[1200px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4">
            <div className={"flex flex-row justify-between items-start gap-4 relative"}>
                <div className={"flex flex-col gap-0.5"}>
                    <h1 className="text-2xl font-medium flex-initial w-auto">Settings</h1>
                    <p className={"text-sm text-muted-foreground"}>
                        Customize your Quickhunt setup with profile, team, and project settings. Manage labels,
                        categories, tags, and connect accounts. Import/export data easily.
                    </p>
                </div>
                {width <= 768 && (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger>
                            <Button variant="outline" className={"w-[30px] h-[30px]"} size="icon">
                                <Menu size={16}/>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align={"end"} className={"flex flex-col gap-1 pt-[14px] px-4 pb-8 p-2 "}>
                            {" "}
                            {(settingsLinksList || []).map((x, i) => {
                                return (
                                    <Button key={i} variant={"link hover:no-underline"} id={x.tourId || ''}
                                        className={`flex justify-start gap-4 h-9 ${
                                            isActive(x.link)
                                                ? "rounded-md bg-primary/15 transition-none"
                                                : "items-center hover:bg-primary/10 transition-none"
                                        }`}
                                        onClick={isTourActive ? null : () => onRedirect(x.link)}
                                    >
                                        <span className={`${isActive(x.link) ? "active-menu" : ""}`}>{x.icon}</span>
                                        <span className={`capitalize flex justify-between w-full ${isActive(x.link) ? "text-primary" : ""}`}>
                                            {x.title}<span>{x.useFor}</span>
                                        </span>
                                    </Button>
                                );
                            })}
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <div className="w-full flex lg:flex-nowrap flex-wrap items-start lg:gap-4 gap-6 mt-6">
                {width > 768 ? (
                    <div className="relative lg:sticky top-2 w-full lg:max-w-[350px]">
                        <Card>
                            <CardHeader className={"p-4 pb-0"}>
                                <CardTitle className={"text-base font-medium"}>General Settings</CardTitle>
                            </CardHeader>
                            <CardContent className={"flex flex-col gap-1.5 p-4"}>
                                {(settingsLinksList || []).map((x, i) => {
                                    return (
                                        <Button id={x.tourId || ''}
                                            key={i}
                                            variant={"link hover:no-underline"}
                                            className={`flex justify-start gap-2 py-0 px-2 pr-1 h-[28px] ${
                                                isActive(x.link)
                                                    ? "rounded-md bg-primary/15 transition-none"
                                                    : "items-center hover:bg-primary/10 hover:text-primary transition-none"
                                            }`}
                                            onClick={isTourActive ? null : () => onRedirect(x.link)}
                                        >
                                          <span className={`${isActive(x.link) ? "active-menu" : ""}`}>{x.icon}</span>
                                            <span className={`flex justify-between w-full ${isActive(x.link) ? "text-primary" : ""}`}>
                                                {x.title}<span>{x.useFor}</span>
                                            </span>
                                        </Button>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
                <div className="w-full">{renderMenu(type ?? "profile")}</div>
            </div>
        </div>
    );
};
export default Settings;
