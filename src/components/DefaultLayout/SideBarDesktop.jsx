import React, { Fragment, useEffect, useState } from 'react';
import { Button } from "../ui/button";
import { Icon } from "../../utils/Icon";
import { apiService, baseUrl, useWindowSize } from "../../utils/constent";
import { useNavigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Activity, Bell, Cable, Clock, CreditCard, FileSliders, House, Inbox, LayoutTemplate, Lightbulb, Megaphone, Menu, NotebookPen, Settings, Users, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "../ui/sheet";
import { inboxMarkReadAction, trackActivityAction } from "../../redux/action/InboxMarkReadAction";
import { Badge } from "../ui/badge";
import { useTour } from '../Comman/TourProvider';

const SideBarDesktop = ({ isMobile, setIsMobile }) => {
    let navigate = useNavigate();
    let location = useLocation();
    const dispatch = useDispatch();
    const { type, id } = useParams();
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const inboxMarkRead = useSelector(state => state.inboxMarkRead);
    const [unreadCount, setUnreadCount] = useState(0);
    const { tourStep } = useTour();
    const { width } = useWindowSize();
    const isTourActive = tourStep !== null && tourStep < 7; // Assuming 7 is the final step
    const isMobileTourActive = isTourActive && width <= 1279;
    const [searchParams] = useSearchParams();
    const isfromOnboarding = searchParams.get("fromOnboarding") || false;
    const hasVisitedMigration = localStorage.getItem(`hasVisitedMigration_${userDetailsReducer?.id}`);

    useEffect(() => {
        if ((!isfromOnboarding && isMobileTourActive) && (tourStep === 0 || tourStep === 1) && !hasVisitedMigration && userDetailsReducer?.stripeStatus !== null) {
            setIsMobile(true);
        } else if ((!isfromOnboarding && isMobileTourActive) && (tourStep === 2 || tourStep === 3 || tourStep === 4 || tourStep === 5 || tourStep === 6) && !hasVisitedMigration) {
            setIsMobile(false);
        }
    }, [isMobileTourActive, isTourActive, width, tourStep, isfromOnboarding, hasVisitedMigration]);

    useEffect(() => {
        if (projectDetailsReducer.id) {
            getInboxNotification();
        }
    }, [projectDetailsReducer.id,])

    useEffect(() => {
        if (inboxMarkRead) {
            const unreadNotifications = inboxMarkRead.filter(notification => notification?.isRead == 0);
            setUnreadCount(unreadNotifications.length);
        }
    }, [inboxMarkRead])

    const getInboxNotification = async () => {
        const payload = {
            projectId: projectDetailsReducer.id,
            type: 1,
        }
        const data = await apiService.inboxNotification(payload);
        if (data.success) {
            dispatch(inboxMarkReadAction(data.data.data));
        }
    }
    useEffect(() => {
        if (window.location.href && projectDetailsReducer.id) {
            getTrackActivity();
        }
    }, [window.location.href, projectDetailsReducer.id])

    const getTrackActivity = async () => {
        const payload = {
            projectId: projectDetailsReducer.id,
            referrer: window.location.href,
        }
        const data = await apiService.trackActivity(payload);
        if (data.success) {
            dispatch(trackActivityAction(data.data.data));
        }
    }

    const onRedirect = (link) => {
        navigate(`${baseUrl}${link}`);
        if (link !== "/inbox") {
            getInboxNotification();
        }
        if (!isMobileTourActive) {
            if (isMobile) {
                setIsMobile(false)
            }
        }
    };

    const isActive = (link, subLink = "", subLink2 = "", subLink3 = "") => {
        return window.location.pathname === subLink3 || window.location.pathname === subLink2 || window.location.pathname === subLink || window.location.pathname === link;
    };

    const isHelpCenterActive = isActive(`${baseUrl}/help/article`, `${baseUrl}/help/category`) ||
        isActive(`${baseUrl}/help/article/${id}`, `${baseUrl}/help/category/${id}`) || isActive(`${baseUrl}/help/article/analytic-view/${id}`)

    const menuComponent = [
        {
            dashBtn: [
                {
                    title: 'Dashboard',
                    link: '/dashboard',
                    icon: <House size={15} />,
                    selected: isActive(`${baseUrl}/dashboard`, `${baseUrl}/dashboard/comments`, `${baseUrl}/dashboard/reactions`,),
                }
            ]
        },
        {
            mainTitle: 'Features',
            items: [
                {
                    title: 'Inbox',
                    link: '/inbox',
                    icon: <Inbox size={15} />,
                    selected: isActive(`${baseUrl}/inbox`, `${baseUrl}/inbox`),
                    unreadCount: unreadCount,
                },
                {
                    title: 'Feedback',
                    link: '/feedback',
                    icon: <Lightbulb size={15} />,
                    selected: isActive(`${baseUrl}/feedback`, `${baseUrl}/feedback/${id}`),
                    tourId: "btn-feedback-create",
                },
                {
                    title: 'Roadmap',
                    link: '/roadmap',
                    icon: <Activity size={15} />,
                    selected: isActive(`${baseUrl}/roadmap`),
                    tourId: "roadmap-section",
                },
                {
                    title: 'Changelog',
                    link: '/changelog',
                    icon: <Megaphone size={15} />,
                    tourCutout: width <= 1279 ? null : "sidebar-changelog",
                    selected: isActive(`${baseUrl}/changelog`, `${baseUrl}/changelog/${id}`, `${baseUrl}/changelog/analytic-view`),
                },
                {
                    title: 'In App Messages',
                    link: '/app-message',
                    icon: <NotebookPen size={15} />,
                    tourCutout: width <= 1279 ? null : "sidebar-app-message",
                    selected: isActive(`${baseUrl}/app-message`, `${baseUrl}/app-message/type`, `${baseUrl}/app-message/${type}/${id}`, `${baseUrl}/app-message/${type}/analytic/${id}`),
                },
                {
                    title: 'Docs',
                    link: '/help/article',
                    icon: <FileSliders size={15} />,
                    selected: isHelpCenterActive,
                    isDocs: true,
                    subItems: [
                        {
                            title: 'Articles',
                            link: `/help/article`,
                            selected: isActive(`${baseUrl}/help/article`, `${baseUrl}/help/article/${id}`, `${baseUrl}/help/article/analytic-view/${id}`),
                        },
                        {
                            title: 'Category',
                            link: `/help/category`,
                            selected: isActive(`${baseUrl}/help/category`, `${baseUrl}/help/category/${id}`),
                        }
                    ]
                },
                {
                    title: 'Widget',
                    link: '/widget',
                    icon: <LayoutTemplate size={15} />,
                    tourCutout: width <= 1279 ? null : "sidebar-widget",
                    selected: isActive(`${baseUrl}/widget`, `${baseUrl}/widget/type`, `${baseUrl}/widget/${type}/${id}`, `${baseUrl}/widget/analytic-view/${id}`),
                },
                {
                    title: 'Users',
                    link: '/user',
                    icon: <Users size={15} />,
                    selected: isActive(`${baseUrl}/user`),
                },
            ]
        },
    ];

    const footerMenuComponent = [
        {
            title: `${userDetailsReducer.trialDays === 1 || userDetailsReducer.trialDays === 0 ? userDetailsReducer.trialDays + " day trial left" : userDetailsReducer.trialDays + " days trial left"}`,
            link: '/pricing',
            icon: <Clock size={15} />,
            selected: false,
            isDisplay: userDetailsReducer?.stripeStatus === 'trialing'
        },
        {
            title: 'What’s New',
            link: '/notification',
            icon: <Bell size={15} />,
            selected: isActive(`${baseUrl}/notification`),
            isDisplay: true,
        },
        {
            title: 'Integrations',
            link: '/integrations',
            icon: <Cable size={15} />,
            selected: isActive(`${baseUrl}/integrations`),
            isDisplay: true,
            isNew: true,
        },
        {
            title: "Pricing",
            link: '/pricing',
            icon: <CreditCard size={15} />,
            selected: isActive(`${baseUrl}/pricing`),
            isDisplay: true,
            isPricing: true,
        },
        {
            title: 'Settings',
            link: '/settings/profile',
            icon: <Settings size={15} />,
            tourCutout: "sidebar-settings",
            selected: window.location.pathname?.includes('settings'),
            isDisplay: true,
        }
    ];

    const renderSubItems = (subItems) => {
        return (
            <div className={"pl-4"}>
                {subItems.map((subItem, index) => (
                    <Button key={index} variant={"link hover:no-underline"}
                        className={`w-full flex gap-4 h-9 justify-start transition-none items-center rounded-md`}
                        onClick={() => isTourActive ? null : onRedirect(subItem.link)}
                    >
                        <div className={`${subItem.selected ? "active-menu" : "menu-icon"}`}>{subItem.icon}</div>
                        <div className={`text-sm font-normal ${subItem.selected ? "text-primary " : ""}`}>{subItem.title}</div>
                    </Button>
                ))}
            </div>
        );
    };

    const commonRender = () => {
        return <Fragment>
            <nav className="grid items-start">
                {
                    (menuComponent || []).map((x, i) => {
                        return (
                            <div key={i} className={`flex flex-col py-4 ${x.dashBtn ? "" : "gap-1"}`}>
                                {
                                    (x.dashBtn || []).map((z, i) => {
                                        return (
                                            <Button key={i} variant={"link hover:no-underline"}
                                                className={`flex justify-start gap-2 py-0 px-2 pr-1 h-[28px] ${z.selected ? "rounded-md bg-primary/15 transition-none" : 'items-center hover:bg-primary/10 hover:text-primary transition-none'}`}
                                                onClick={() => isTourActive ? null : onRedirect(z.link)}
                                            >
                                                <div className={`${z.selected ? "active-menu" : ""}`}>{z.icon}</div>
                                                <div className={`font-normal text-left flex-1 text-sm ${z.selected ? "text-primary" : ""}`}>{z.title}</div>
                                            </Button>
                                        )
                                    })
                                }
                                {
                                    x.dashBtn ? "" :
                                        <Fragment>
                                            <h3 className={"text-sm font-medium px-2 pr-1"}>{x.mainTitle}</h3>
                                            <div className={"flex flex-col gap-1"}>
                                                {
                                                    (x.items || []).map((y, i) => {
                                                        return (
                                                            <Fragment key={i}>
                                                                <Button id={y.tourId} key={i} variant={"link hover:no-underline"}
                                                                    className={`${y.tourCutout ? y.tourCutout : ""} flex justify-start gap-2 py-0 px-2 pr-1 h-[28px] ${y.selected ? "rounded-md bg-primary/15 transition-none" : 'items-center transition-none hover:bg-primary/10 hover:text-primary'} `}
                                                                    onClick={() => isTourActive ? null : onRedirect(y.link)}
                                                                >
                                                                    <div className={`${y.selected ? "active-menu" : ""}`}>{y.icon}</div>
                                                                    <div className={`font-normal text-left flex-1 text-sm ${y.selected ? "text-primary" : ""}`}>{y.title} </div>
                                                                    {y.isSoon ? <Badge variant={'destructive'}>Coming Soon</Badge> : ""}
                                                                    {y.title === 'Inbox' && unreadCount > 0 && (<span className="bg-red-500 rounded-full w-2 h-2 ml-2" />)}
                                                                </Button>
                                                                {y.isDocs && isHelpCenterActive && y.subItems && renderSubItems(y.subItems)}
                                                            </Fragment>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </Fragment>
                                }
                            </div>
                        )
                    })
                }
            </nav>
            <div className="mt-auto pb-4">
                <nav className="grid gap-1">
                    {(footerMenuComponent || []).map((x, i) => {
                        const isTrialLeft = x.title.includes('days trial left') || x.title.includes('day trial left');

                        return (
                            x.isDisplay ? (
                                <Button
                                    key={i}
                                    variant={"link hover:no-underline"}
                                    className={`${x.tourCutout} flex justify-start gap-2 py-0 px-2 pr-1 h-[28px]
              ${isTrialLeft
                                            ? 'bg-primary text-primary-foreground rounded-md hover:bg-primary hover:text-primary-foreground'
                                            : x.selected
                                                ? 'rounded-md bg-primary/15 transition-none'
                                                : 'items-center hover:bg-primary/10 hover:text-primary transition-none'
                                        }`}
                                    onClick={() => isTourActive ? null : onRedirect(x.link)}
                                >
                                    <div className={`${x.selected ? "active-menu" : ""}`}>
                                        {x.icon}
                                    </div>
                                    <div
                                        className={`font-normal text-left flex-1 text-sm
                ${x.selected ? "text-primary" : ""}
                ${isTrialLeft ? 'text-primary-foreground hover:text-primary-foreground' : ''}
              `}
                                    >
                                        {x.title}
                                    </div>
                                    {x.isNew ? <Badge>New</Badge> : ""}
                                    {x.isPricing ? <Badge className='text-xs bg-[#ECFDF5] hover:bg-[#ECFDF5] border-[#10B981] text-[#047857] flex items-center gap-1'> <span className='w-2 h-2 bg-[#10B981] rounded-full' /> {projectDetailsReducer?.plan === 0 ? "Free" : projectDetailsReducer?.plan === 1 ? "Starter" : projectDetailsReducer?.plan === 2 ? "Growth" : projectDetailsReducer?.plan === 3 ? "Premium" : ""}</Badge> : ""}
                                </Button>
                            ) : null
                        );
                    })}
                </nav>
            </div>
        </Fragment>
    }

    return (
        <div className={`main-sidebar fixed start-0 top-0 z-[60] h-full xl:z-10 hidden xl:block ${location.pathname.includes("widget/") ? "overflow-hidden" : "overflow-auto"}`}>
            <div className="pointer-events-auto relative z-30 flex h-full w-[250px] flex-col ltr:-translate-x-full rtl:translate-x-full ltr:xl:translate-x-0 rtl:xl:translate-x-0">

                {
                    width <= 1279 ?
                        <Sheet open={isMobile}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 xl:hidden">
                                    <Menu size={20} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex gap-0 flex-col w-[280px] md:w-[340px] p-0">
                                <SheetHeader className={"flex gap-2 flex-row justify-between items-center p-3 py-2.5"}>
                                    <div className={"flex w-full items-center h-[56px] cursor-pointer"} onClick={() => onRedirect("/dashboard")}>
                                        {Icon.blueLogo}
                                    </div>
                                    <X size={18} className={"fill-card-foreground stroke-card-foreground m-0"} onClick={() => setIsMobile(false)} />
                                </SheetHeader>
                                <div className={"px-3 flex flex-col overflow-y-auto h-full bg-primary/5"}>
                                    {commonRender()}
                                </div>
                            </SheetContent>
                        </Sheet> : ""}
                <div className={`h-[calc(100vh_-_56px)] mt-[56px] px-3 flex flex-col overflow-y-auto h-full bg-primary/5`}>
                    {width <= 1279 ? null : commonRender()}
                </div>
            </div>
        </div>
    );
};

export default SideBarDesktop;