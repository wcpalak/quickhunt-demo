
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../ui/use-toast";
import { apiService, PAYMENT_LIVE_ENV, PAYMENT_LIVE_TOKEN, getProjectDetails, setProjectDetails } from "../../utils/constent";
import { Button } from "@/components/ui/button.jsx";
import { Check, ChevronDown, ChevronUp, Info, Loader2, Minus, BellRing, CircleChevronRight, InfoIcon } from "lucide-react";
import { Card } from "@/components/ui/card.jsx";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DialogDescription } from '../ui/dialog';
import { userDetailsAction } from '../../redux/action/UserDetailAction';
import { projectDetailsAction } from '../../redux/action/ProjectDetailsAction';
import { allProjectAction } from '../../redux/action/AllProjectAction';
import ProjectLimitErrorDialog from '../Comman/ProjectLimitErrorDialog';
import { Icon } from '../../utils/Icon';

const PricingPlans = () => {
    const { toast } = useToast();
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const allProjectReducer = useSelector((state) => state.allProjectReducer);
    const isUserMismatch = userDetailsReducer?.id !== projectDetailsReducer?.userId;
    const dispatch = useDispatch();
    const [planInterval, setPlanInterval] = useState(1);
    const [oldPlanInterval, setOldPlanInterval] = useState(1);
    const [planType, setPlanType] = useState(0);
    const [planLoading, setPlanLoading] = useState(null);
    const [loading, setLoading] = useState('');
    const [yearlyLoading, setYearlyLoading] = useState(false);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [isDownGradeModal, setIsDownGradeModal] = useState(false);
    const [open, setOpen] = useState(true);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isSubscribeConfirmFlow, setIsSubscribeConfirmFlow] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [dialogType, setDialogType] = useState("");
    const [showTrialBanner, setShowTrialBanner] = useState(false);
    const [errorDialog, setErrorDialog] = useState({ open: false, message: '', requiredDelete: 0, userProjects: [], planToChange: null });
    const [selectedProjects, setSelectedProjects] = useState([]);
    const contentRef = useRef(null);
    const tableHeaderRef = useRef(null);
    const sentinelRef = useRef(null);
    const [height, setHeight] = useState(0);
    const [isStuck, setIsStuck] = useState(false);
    const isTrialing = userDetailsReducer?.stripeStatus === 'trialing';

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsStuck(!entry.isIntersecting);
            },
            { root: null, threshold: 0 }
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => {
            if (sentinelRef.current) {
                observer.unobserve(sentinelRef.current);
            }
        };
    }, []);


    useEffect(() => {
        if (open && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [open]);

    useEffect(() => {
        if (isUserMismatch) {
            if (projectDetailsReducer.plan !== undefined) {
                setPlanType(projectDetailsReducer.plan);
                const interval = projectDetailsReducer.planInterval !== undefined ? projectDetailsReducer.planInterval : 1;
                setOldPlanInterval(interval);
                setPlanInterval(interval);
            }
        } else {
            if (userDetailsReducer.planInterval) {
                setOldPlanInterval(userDetailsReducer.planInterval);
                setPlanInterval(userDetailsReducer.planInterval);
                setPlanType(userDetailsReducer.plan);
            }
        }
    }, [userDetailsReducer, projectDetailsReducer]);

    useEffect(() => {
        if (userDetailsReducer.stripeStatus === null && projectDetailsReducer.userId === userDetailsReducer.id) {
            setShowTrialBanner(true);
        } else {
            setShowTrialBanner(false);
        }
    }, [userDetailsReducer.plan, projectDetailsReducer.userId, userDetailsReducer.stripeStatus]);

    function getDiscountCodeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('code');
    }


    const plans = [
        {
            name: "Free",
            monthlyPrice: 0,
            yearlyPrice: 0,
            description: "Essential tools to explore Quickhunt.",
            planType: 0,
            disabled: planType == '0',
            btnText: planType == '0' ? "Activated" : (planType === null ? "Upgrade" : "Downgrade")
        },
        {
            name: "Starter",
            monthlyPrice: 29,
            yearlyPrice: 23,
            description: "Everything you need to get started",
            planType: 1,
            disabled: planType == '1' && oldPlanInterval == planInterval,
            btnText: planType === null ? "Upgrade" :
                (planType == 0 ? "Upgrade" :
                    (planType == '1' && oldPlanInterval == planInterval ? "Activated" :
                        "1" < planType && oldPlanInterval == planInterval ? "Downgrade" :
                            oldPlanInterval != planInterval && planInterval != "2" ? "Downgrade" :
                                'Upgrade'))
        },
        {
            name: "Growth",
            monthlyPrice: 49,
            yearlyPrice: 40,
            description: "Powerful tools for expanding teams.",
            planType: 2,
            isPopular: true,
            disabled: planType == '2' && oldPlanInterval == planInterval,
            btnText: planType === null ? "Upgrade" :
                (planType == 0 ? "Upgrade" :
                    (planType == '2' && oldPlanInterval == planInterval ? "Activated" :
                        "2" < planType && oldPlanInterval == planInterval ? "Downgrade" :
                            oldPlanInterval != planInterval && planInterval != "2" ? "Downgrade" :
                                'Upgrade'))
        },
        {
            name: "Premium",
            monthlyPrice: 99,
            yearlyPrice: 79,
            description: "Complete access for scaling faster.",
            planType: 3,
            disabled: planType == '3' && oldPlanInterval == planInterval,
            btnText: planType === null ? "Upgrade" :
                (planType == 0 ? "Upgrade" :
                    (planType == '3' && oldPlanInterval == planInterval ? "Activated" :
                        "3" < planType && oldPlanInterval == planInterval ? "Downgrade" :
                            oldPlanInterval != planInterval && planInterval != "2" ? "Downgrade" :
                                'Upgrade'))
        },
    ];

    const onChangeTab = (type) => {
        setPlanInterval(type);
    };

    const handlePlanAction = async (plan, actionType = '', projectList = null, overridePlanInterval = null) => {
        setPlanLoading(plan.planType);
        setLoading(actionType || plan.btnText.toLowerCase());
        const effectivePlanInterval = overridePlanInterval !== null ? overridePlanInterval : planInterval;
        const payload = {
            planInterval: effectivePlanInterval,
            planType: plan.planType
        };
        if (actionType === 'subscribe') {
            payload.isSubscribed = true;
        }
        const response = await apiService.changePlan(payload);
        setPlanLoading(null);
        setLoading(null);
        setYearlyLoading(false);
        setMonthlyLoading(false);

        if (response.success) {
            if (response.data?.priceId) {
                const itemsList = [
                    {
                        priceId: response.data.priceId,
                        quantity: 1
                    }
                ];
                const customerInfo = {
                    email: userDetailsReducer?.email,
                    address: {
                        countryCode: "US",
                        postalCode: "10021"
                    }
                };
                if (window.Paddle) {
                    const checkoutOptions = {
                        items: itemsList,
                        customer: customerInfo,
                    };
                    const discountCode = getDiscountCodeFromURL();

                    if (discountCode) {
                        checkoutOptions.discountCode = discountCode;
                    }

                    window.Paddle.Checkout.open(checkoutOptions);
                }
            } else {
                toast({ description: response.message });
                updateProjectAndUserDetails(
                    plan.planType,
                    effectivePlanInterval,
                    projectList,
                    actionType === 'subscribe' ? 'active' : (userDetailsReducer?.stripeStatus === null ? 'active' : null)
                );
                setIsDownGradeModal(false);
                setShowTrialBanner(false);
            }
        } else {
            toast({ variant: "destructive", description: response?.error?.message });
        }
    };

    const handlePlanSubscription = async (plan, type = 'manage') => {
        setLoading(type);
        const response = await apiService.planSubscription();
        if (response.success) {
            setTimeout(() => {
                setLoading(null);
                setIsDownGradeModal(false);
                window.open(response.data.url, "_blank");
            }, 500);
        } else {
            setLoading(null);
            toast({ variant: "destructive", description: response?.error?.message });
        }
    };

    const updateProjectAndUserDetails = (plan, planInterval, projectList = null, newStripeStatus = null) => {
        const allProjects = projectList || allProjectReducer.projectList || [];
        dispatch(userDetailsAction({
            ...userDetailsReducer,
            plan,
            planInterval,
            stripeStatus: newStripeStatus !== null ? newStripeStatus : userDetailsReducer.stripeStatus
        }));
        const updatedProjects = allProjects.map(proj =>
            proj.userId === userDetailsReducer.id ? { ...proj, plan, planInterval } : proj
        );
        dispatch(allProjectAction({ projectList: updatedProjects }));

        let currentProject = getProjectDetails();
        const latestProject = updatedProjects.find(proj => proj.id === currentProject.id);

        if (latestProject) {
            dispatch(projectDetailsAction(latestProject));
            setProjectDetails(latestProject);
        } else {
            const fallbackProject = {
                ...currentProject,
                plan,
                planInterval,
                userId: userDetailsReducer.id
            };
            dispatch(projectDetailsAction(fallbackProject));
            setProjectDetails(fallbackProject);
        }
    };

    const planFeaturesTable = [
        {
            title: null,
            features: [
                {
                    label: 'Projects',
                    free: '1 project',
                    starter: '3 Projects',
                    growth: '10 Projects',
                    premium: '20 Projects',
                    tooltip: ['Create and manage multiple products or workspaces—each with its own feedback, roadmap, changelog, and help center.']
                },
                {
                    label: 'Team member',
                    free: <Fragment>1 (+$10/mo/additional)</Fragment>,
                    starter: <Fragment>5 (+$10/mo/additional)</Fragment>,
                    growth: <Fragment>10 (+$10/mo/additional)</Fragment>,
                    premium: <Fragment>20 (+$10/mo/additional)</Fragment>,
                    tooltip: ['Invite your teammates to collaborate and manage projects together in one shared project']
                },
                {
                    label: 'End User',
                    free: 'Unlimited',
                    starter: 'Unlimited',
                    growth: 'Unlimited',
                    premium: 'Unlimited',
                    tooltip: ['Users who can view your public roadmap, changelog, submit feedback, and engage with your product updates.']
                },
                { label: 'Notifications', free: true, starter: true, growth: true, premium: true, tooltip: ['Send real-time alerts to end users and team members for changelog, feedback updates, and more.'] },
                { label: 'Remove Branding', free: false, starter: true, growth: true, premium: true, tooltip: ['Remove Quickhunt’s logo and branding from all public-facing widgets and pages.'] },
            ],
        },
        {
            title: 'Feedback & Roadmap',
            features: [
                {
                    label: 'Feedback Board',
                    free: '1 Board',
                    starter: '5 Board',
                    growth: '10 Board',
                    premium: 'Unlimited Boards',
                    tooltip: ['Collect, organize, and prioritize user-submitted feedback to shape your product roadmap.']
                },
                {
                    label: 'Roadmaps',
                    free: '1 Roadmap',
                    starter: 'Unlimited Roadmaps',
                    growth: 'Unlimited Roadmaps',
                    premium: 'Unlimited Roadmaps',
                    tooltip: ['Plan and prioritize features on a clear, shareable roadmap.']
                },
                {
                    label: 'Comments',
                    free: 'Unlimited',
                    starter: 'Unlimited',
                    growth: 'Unlimited',
                    premium: 'Unlimited',
                    tooltip: ['Enable discussions on feedback, roadmap items, and changelog to gather more context from users and team members.']
                },
                {
                    label: 'Feedback (Feedback Post)',
                    free: 'Unlimited',
                    starter: 'Unlimited',
                    growth: 'Unlimited',
                    premium: 'Unlimited',
                    tooltip: ['Let users share suggestions, report issues, or request features to help you build what matters most.']
                },
                { label: 'Embedded Widget', free: false, starter: true, growth: true, premium: true, tooltip: ['Display feedback/roadmap boards in directly within your app or website for a seamless user experience.'] },
                { label: 'Custom Domain', free: false, starter: true, growth: true, premium: true, tooltip: ['Connect your own domain to host your public roadmap, changelog, and help center with your brand’s URL.'] },
                { label: 'Custom Status', free: false, starter: true, growth: true, premium: true, tooltip: ['Create and manage your own feedback/roadmap statuses for feedback and roadmap items to match your product development process.'] },
                { label: 'Custom Tags', free: false, starter: true, growth: true, premium: true, tooltip: ['Add and manage tags to categorize feedback, and roadmap items for better organization and filtering.'] },
                { label: 'Custom Reactions', free: false, starter: true, growth: true, premium: true, tooltip: ["Allow users to react to posts using a set of predefined emojis, tailored to your product's tone and community style."] },
                {
                    label: 'Automatic Email Notification',
                    free: false,
                    starter: true,
                    growth: true,
                    premium: true,
                    tooltip: ['Users will automatically receive email notifications whenever the status of their feedback changes.']
                },
                {
                    label: 'AI Duplicate Finder',
                    free: false,
                    starter: false,
                    growth: false,
                    premium: true,
                    isNew: true,
                    tooltip: ['Quickly find and merge similar feedback posts with AI.']
                },
                {
                    label: 'AI Summary',
                    free: false,
                    starter: false,
                    growth: false,
                    premium: true,
                    isNew: true,
                    tooltip: ['Turn lengthy comment sections into short summaries.']
                },
            ],
        },
        {
            title: 'Changelog',
            features: [
                {
                    label: 'Changelog Releases',
                    free: 'Unlimited',
                    starter: 'Unlimited',
                    growth: 'Unlimited',
                    premium: 'Unlimited',
                    tooltip: ["Keep users updated with detailed release notes, product updates, and new features through your public changelog."]
                },
                { label: 'Public Page', free: true, starter: true, growth: true, premium: true, tooltip: ['Share all your product updates and changelog in one accessible, branded public page for your users.'] },
                { label: 'Comments', free: true, starter: true, growth: true, premium: true, tooltip: ["Allow users to engage with changelog by leaving comments, questions, or feedback."] },
                { label: 'Embedded Widget', free: false, starter: true, growth: true, premium: true, tooltip: ["Allow users to engage with changelog by leaving comments, questions, or feedback."] },
                { label: 'Custom Reactions', free: false, starter: true, growth: true, premium: true, tooltip: ["Enable users to react to changelogs using a set of predefined emojis customized to your brand style."] },
                {
                    label: 'Scheduled Changelogs',
                    free: false,
                    starter: true,
                    growth: true,
                    premium: true,
                    tooltip: ["Plan and publish changelogs at a future date and time to align with product launches or updates."]
                },
                { label: 'Domain', free: false, starter: true, growth: true, premium: true, tooltip: ["Host your changelogs on a custom domain to match your brand and provide a seamless user experience."] },
                { label: 'Analytics', free: false, starter: true, growth: true, premium: true, tooltip: ['Track performance of your changelogs with insights like views, reactions, and user engagement.'] },
                { label: 'AI Changelog', free: false, starter: false, growth: false, premium: true, isNew: true, tooltip: ['Automatically generate changelogs from your feedback with AI.'] },
                {
                    label: 'Email Notifications to Customers',
                    free: '150/emails',
                    starter: '7000/emails',
                    growth: '25,000/emails',
                    premium: '50,000/emails',
                    tooltip: ['Send changelog emails to all users automatically when a new update is published.']
                },
            ],
        },
        {
            title: 'Help Center(Docs)',
            features: [
                {
                    label: 'Categories',
                    free: 'Unlimited',
                    starter: 'Unlimited',
                    growth: 'Unlimited',
                    premium: 'Unlimited',
                    tooltip: ['Group related articles into organized collections or categories for easier navigation.']
                },
                { label: 'Public Page', free: true, starter: true, growth: true, premium: true, tooltip: ['Publish your knowledge base on a branded, searchable public help center.'] },
                {
                    label: 'Custom Elements & Editor',
                    free: true,
                    starter: true,
                    growth: true,
                    premium: true,
                    tooltip: ["Write and format rich content with a powerful editor and customize how articles appear to match your brand."]
                },
                { label: 'Embedded Widget', free: false, starter: true, growth: true, premium: true, tooltip: ['Display help articles inside your app or website with an easy-to-install widget.'] },
                { label: 'Domain', free: false, starter: true, growth: true, premium: true, tooltip: ["Host your knowledge base on a custom domain that aligns with your brand."] },
                { label: 'Analytics', free: false, starter: true, growth: true, premium: true, tooltip: ["Track impressions, clicks, and engagement for each docs to measure performance and impact."] },
                {
                    label: 'Docs',
                    free: '50',
                    starter: '150',
                    growth: '300',
                    premium: 'Unlimited',
                    tooltip: ['Create helpful docs, guides, and FAQs to support your users 24/7.']
                },
            ],
        },
        {
            title: 'In App Messages (Posts, Banners, Checklists, Survey, Product Tour)',
            features: [
                { label: 'In-app messages', free: '2', starter: '10', growth: '20', premium: 'Unlimited', tooltip: ["Deliver messages inside your product using banners, posts, surveys, checklists, and more."] },
                { label: 'Widget Customization', free: true, starter: true, growth: true, premium: true, tooltip: ["Customize the look and feel of each widget to match your app’s design and branding."] },
                { label: 'Custom Data', free: true, starter: true, growth: true, premium: true, tooltip: ["Pass user-specific data to personalize and segment in-app experiences effectively."] },
                { label: 'Scheduling', free: false, starter: true, growth: true, premium: true, tooltip: ["Set start and end times to display In app messages automatically based on your launch plan."] },
                { label: 'Sender name', free: false, starter: true, growth: true, premium: true, tooltip: ["Display a custom sender name on in-app messages for a more personal touch."] },
                { label: 'Analytics', free: false, starter: true, growth: true, premium: true, tooltip: ["Track impressions, clicks, and engagement for each widget to measure performance and impact."] },
                {
                    label: 'Conditional Logic',
                    free: false,
                    starter: true,
                    growth: true,
                    premium: true,
                    isNew: true,
                    tooltip: ["Target users based on behavior or conditions to show the right message at the right time."]
                },
                {
                    label: 'Product Tour',
                    isComingSoon: true,
                    free: false,
                    starter: true,
                    growth: true,
                    premium: true,
                    tooltip: ["Guide new users through key features with interactive, step-by-step product walkthroughs."]
                },
            ],
        },
        {
            title: 'Integrations',
            features: [
                {
                    label: 'Github',
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: ["Link feedback and feature requests to GitHub issues and track development progress. Automatically post changelogs to Quickhunt whenever you commit on GitHub."]
                },
                {
                    label: 'Slack',
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: ["Receive real-time updates and notifications in your Slack channels."]
                },
                {
                    label: 'Zapier',
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: ["Connect Quickhunt with 5,000+ apps to automate workflows—no coding required."]
                },
                {
                    label: 'HubSpot',
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    isNew: true,
                    tooltip: ["Sync user feedback with HubSpot CRM to align product decisions with customer data."]
                },
                {
                    label: 'Jira',
                    isComingSoon: true,
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: []
                },
                {
                    label: 'Salesforce',
                    isComingSoon: true,
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: ["Push feedback and insights into Salesforce to support customer success and sales teams."]
                },
                {
                    label: 'Intercom',
                    isComingSoon: true,
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: ["Capture and manage user feedback directly from Intercom conversations."]
                },
                {
                    label: 'Notion',
                    isComingSoon: true,
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: ["Send selected feedback or roadmap items to Notion for internal tracking and documentation."]
                },
                {
                    label: 'ClickUp',
                    isComingSoon: true,
                    free: false,
                    starter: false,
                    growth: true,
                    premium: true,
                    tooltip: []
                },
               
            ],
        },
        {
            title: 'Security and Additional',
            features: [
                { label: 'GDPR Compliance', free: true, starter: true, growth: true, premium: true, tooltip: ["Ensure your platform meets GDPR requirements by managing user data and privacy settings in compliance with EU regulations."] },
                {
                    label: '2-Factor Authentication',
                    free: true,
                    starter: true,
                    growth: true,
                    premium: true,
                    tooltip: ["Add an extra layer of security by requiring users to verify their identity with a second factor, such as a authentication app."]
                },
            ],
        },
        {
            title: 'Support',
            features: [
                { label: 'Email Support', free: true, starter: true, growth: true, premium: true, tooltip: ["Reach out to our support team via email for any questions or issues you may have."] },
                { label: 'Security Audit', free: true, starter: true, growth: true, premium: true, tooltip: ["Request a comprehensive security audit to ensure your data and operations are secure and compliant."] },
                { label: 'Live chat Support', free: false, starter: true, growth: true, premium: true, tooltip: ["Get real-time assistance from our support team directly within the platform."] },
                {
                    label: 'Dedicated Support Manager',
                    free: false,
                    starter: false,
                    growth: false,
                    premium: true,
                    tooltip: ["Access personalized support from a dedicated manager to ensure your success."]
                },
            ],
        },
    ];

    const planHeader = [
        {
            title: null,
            subTitle: "Feature Name",
        },
        {
            title: `$0`,
            subTitle: "Free",
            trial: "Get Started for Free",
            monthlyPrice: 0,
            yearlyPrice: 0,
            planType: 0,
        },
        {
            title: `$${planInterval == 1 ? 29 : 23}`,
            subTitle: "Starter",
            trial: "7 Days Free Trial",
            monthlyPrice: 29,
            yearlyPrice: 23,
            planType: 1,
        },
        {
            title: `$${planInterval == 1 ? 49 : 40}`,
            subTitle: "Growth",
            trial: "7 Days Free Trial",
            monthlyPrice: 49,
            yearlyPrice: 40,
            planType: 2,
        },
        {
            title: `$${planInterval == 1 ? 99 : 79}`,
            subTitle: "Premium",
            trial: "7 Days Free Trial",
            monthlyPrice: 99,
            yearlyPrice: 79,
            planType: 3,
        },
    ];

    const renderPlanIcon = (value) => {
        if (value === true) return <div className={'bg-primary rounded-full h-6 w-6 flex justify-center items-center'}><Check size={15} className="text-white" /></div>;
        if (value === false) return <div><Minus size={15} /></div>;
        return value;
    };

    useEffect(() => {
        if (!document.getElementById('paddle-js')) {
            const script = document.createElement('script');
            script.id = 'paddle-js';
            script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
            script.async = true;

            script.onload = () => {
                if (window.Paddle) {
                    const paddleEnv = PAYMENT_LIVE_ENV;
                    const paddleToken = PAYMENT_LIVE_TOKEN;

                    window.Paddle.Environment.set(paddleEnv);

                    window.Paddle.Initialize({
                        token: paddleToken,
                        eventCallback: function (data) {
                            if (data.name === "checkout.completed") {
                                const item = data.data.items?.[0];
                                const interval = item.billing_cycle?.interval;

                                if (item) {
                                    let planInterval = 1;
                                    if (interval === "year") {
                                        planInterval = 2;
                                    }

                                    const planMap = {
                                        "Free": 0,
                                        "Starter": 1,
                                        "Growth": 2,
                                        "Premium": 3
                                    };
                                    const plan = planMap[item.price_name] ?? 0;

                                    updateProjectAndUserDetails(plan, planInterval, null, 'active');
                                }
                            }
                        }
                    });
                }
            };
            document.body.appendChild(script);
        }
    }, []);

    return (
        <Fragment>
            <div className={"container xl:max-w-[1130px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] pt-8 pb-5 px-3 md:px-4 space-y-4"}>
                {showTrialBanner && (
                    <Fragment>
                        <div className="bg-gradient-to-r z-50 from-red-50 to-orange-50 border-b border-red-200 container xl:max-w-[1130px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] ">
                            <div className="container xl:max-w-[1130px] lg:max-w-[992px] md:max-w-[768px] sm:max-w-[639px] mx-auto px-3 md:px-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-3">
                                    <div className="flex items-start sm:items-center gap-3 flex-1">
                                        <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                                            <BellRing className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                                Your Trial Has Ended – Update Billing to Keep Using Quickhunt
                                            </h3>
                                            <p className="text-sm text-gray-600 pt-2">
                                                <span className="font-semibold text-gray-900"> Need More Time to Explore?</span> We’re happy to extend your trial so you can finish exploring all the features.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </Fragment>
                )}
                <div>
                    <div className={"flex flex-col justify-center items-center space-y-6"}>
                        <h3 className={"text-center text-2xl font-normal"}>Pricing</h3>
                        {
                            isUserMismatch ? (
                                <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 mt-2">
                                <InfoIcon size={16} />
                                <span>
                                    The owner of this project can update pricing and plans. Please reach out to the owner at 
                                    <a 
                                    className="text-primary font-medium underline ml-1"
                                    href={`mailto:${projectDetailsReducer.email}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    >
                                    {projectDetailsReducer.email}
                                    </a>.
                                </span>
                                </div>
                            ) : ""
                        }
                    </div>

                    <div onClick={() => window.open('https://quickhuntapp.endorsely.com/', '_blank')} className="cursor-pointer flex items-center gap-2 justify-center mt-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm  max-w-max m-auto">
                         {Icon.gift} Invite friends, earn rewards! Join our referral program → 
                         </div>

                    <div className={"flex justify-center pt-6"}>
                        <div className={"flex px-[5px] py-1 border rounded-md gap-1"}>
                            <Button
                                onClick={() => onChangeTab(1)}
                                variant={"ghost hover:none"}
                                disabled={isUserMismatch}
                                className={`font-normal w-[78px] h-8 ${planInterval == 1 ? "bg-[#EEE4FF] text-[#7C3AED]" : ""} ${isUserMismatch ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Monthly
                            </Button>
                            <Button
                                onClick={() => onChangeTab(2)}
                                variant={"ghost hover:none"}
                                disabled={isUserMismatch}
                                className={`font-normal gap-2 h-8 ${planInterval == 2 ? "bg-[#EEE4FF] text-[#7C3AED]" : ""} ${isUserMismatch ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Yearly
                                <Badge className={'text-[11px] leading-none'}>
                                    2 MONTHS FOR FREE
                                </Badge>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className={'overflow-x-auto max-w-[1000px]:overflow-visible'}>
                    <div className={"grid grid-cols-4 w-full max-w-[1000px]:gap-[18px] gap-4 min-w-[1000px] pt-4"}>
                        {plans.map((x) => {
                            const isActivated = x.disabled;
                            const isPlanTypeActive = (x.planType == planType);
                            const isActiveSameInterval = isPlanTypeActive && (oldPlanInterval == planInterval);
                            const isSwitch = (!isActiveSameInterval) && (planType !== null && planType !== undefined);
                            const isFreePlanActivatedOnTrial = (isTrialing && isPlanTypeActive && x.planType === 0) || (!isTrialing && isPlanTypeActive && x.planType === 0);
                            const isActivatedWhenStatusNull = userDetailsReducer?.stripeStatus === null && isPlanTypeActive;
                            const isActivatedForUI = (isActiveSameInterval && !isTrialing) || isFreePlanActivatedOnTrial || isActivatedWhenStatusNull;
                            const buttonLabel = isFreePlanActivatedOnTrial
                                ? "Activated"
                                : isActivatedWhenStatusNull
                                    ? (planInterval === 1 ? "Downgrade now" : "Upgrade now")
                                    : ((isTrialing && isPlanTypeActive && x.planType > 0)
                                        ? `Subscribe to ${x.name} `
                                        : (isSwitch ? `Switch to ${x.name} trial` : x.btnText));
                            const isTrialSubscribe = isTrialing && isPlanTypeActive && x.planType > 0;
                            return (
                                <div
                                    key={x.planType}
                                    className={`border flex flex-col justify-between px-6 pt-6 pb-8 rounded-[10px] relative 
                                        ${isActivated ? "border-violet-600" : ""} 
                                        ${isPlanTypeActive && userDetailsReducer?.stripeStatus === "trialing" ? "border-violet-600" : ""}
                                        ${isActivatedWhenStatusNull ? "border-violet-600" : ""}
                                        ${isActivatedForUI && userDetailsReducer?.stripeStatus !== null ? "border-violet-600" : ""}`}
                                >
                                    {x?.isPopular && <Badge className={'absolute -top-3 left-1/2 -translate-x-1/2 uppercase text-[10px] cursor-pointer'}>Most Popular</Badge>}

                                    <div>
                                        <div>
                                            <h3 className={"text-2xl font-normal mb-1"}>{x.name}</h3>
                                            <p className={`capitalize text-sm font-normal text-muted-foreground`}>
                                                {x.description}
                                            </p>
                                        </div>
                                        <h3 className={`text-[32px] font-medium ${planType > 0 && (x.planType == planType) ? "pt-[15px]" : `py-[15px]`}`}>
                                            <span className={`${(planInterval == 1 || x.planType == 0) ? "" : 'line-through'}`}>${x.monthlyPrice}</span>
                                            {(planInterval == 1 || x.planType == 0) ? "" : <span>{" "} ${x.yearlyPrice}</span>}
                                            <span className={`text-xl text-muted-foreground font-normal`}>/month</span>
                                        </h3>

                                        {planType > 0 &&
                                            x.planType === planType &&
                                            oldPlanInterval === planInterval &&
                                            userDetailsReducer?.stripeStatus !== 'trialing' &&
                                            userDetailsReducer?.stripeStatus !== null && (
                                                <Button
                                                    variant={"link"}
                                                    className={"gap-1 font-normal my-2 w-full"}
                                                    disabled={loading === 'manage' || isUserMismatch}
                                                    onClick={() => handlePlanSubscription(x, 'manage')}
                                                >
                                                    {loading === 'manage' && <Loader2 size={17} className="animate-spin mr-2" />}
                                                    Manage Your Subscription
                                                </Button>
                                            )}
                                    </div>

                                    <Button
                                        className={`w-full font-medium gap-2 ${isTrialSubscribe ? "bg-primary text-white" : (isActivatedWhenStatusNull ? `bg-primary text-white cursor-pointer ${isUserMismatch ? "" : "opacity-100"}` : (isActivatedForUI && userDetailsReducer?.stripeStatus !== null ? `hover:text-primary text-primary cursor-default hover:bg-background ${isUserMismatch ? "" : "opacity-100 disabled:opacity-100"}` : ""))} ${isUserMismatch ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={planLoading == x.planType || isUserMismatch || (isActivatedForUI && userDetailsReducer?.stripeStatus !== null)}
                                        variant={
                                            isActivatedWhenStatusNull
                                                ? ""
                                                : (isActivatedForUI && userDetailsReducer?.stripeStatus !== null)
                                                    ? "outline"
                                                    : userDetailsReducer?.stripeStatus === null
                                                        ? "outline"
                                                        : ((isTrialing && planType === 0) ? "outline" : (isSwitch ? "" : ""))
                                                            || userDetailsReducer?.stripeStatus === 'active'
                                                            ? ""
                                                            : "outline"
                                        }

                                        onClick={
                                            (planLoading == x.planType || isUserMismatch)
                                                ? null
                                                : () => {
                                                    setSelectedPlan(x);
                                                    if (userDetailsReducer?.stripeStatus === null && isActivatedWhenStatusNull) {
                                                        if (planInterval === 1) {
                                                            setDialogType("downgrade");
                                                            setShowUpgradeDialog(true);
                                                        } else if (planInterval === 2) {
                                                            handlePlanAction(x);
                                                        }
                                                        return;
                                                    }

                                                    if (isActivatedForUI && userDetailsReducer?.stripeStatus !== null) {
                                                        return; 
                                                    }

                                                    if (isTrialing && isPlanTypeActive && x.planType > 0) {
                                                       
                                                        if (planInterval === 1) {
                                                            setDialogType("subscribe");
                                                            setIsSubscribeConfirmFlow(true);
                                                            setShowUpgradeDialog(true);
                                                            return;
                                                        } else if (planInterval === 2) {
                                                            handlePlanAction(x, 'subscribe');
                                                        }
                                                        return;
                                                    }


                                                    if (planInterval === 2 && x.planType > planType) {
                                                        handlePlanAction(x);
                                                        return;
                                                    }

                                                    if (oldPlanInterval === 1 && planInterval === 2) {
                                                        handlePlanAction(x);
                                                        return;
                                                    }

                                                    if (
                                                        (planType === null || userDetailsReducer.plan === null)
                                                    ) {
                                                        setDialogType("upgrade");
                                                        setShowUpgradeDialog(true);

                                                    }
                                                    if (oldPlanInterval === 2 && planType === 0 && planInterval === 1) {
                                                        setDialogType("upgrade");
                                                        setShowUpgradeDialog(true);
                                                        return;
                                                    }
                                                    else if (x.planType === 0) {
                                                        setDialogType("downgrade");
                                                        setShowUpgradeDialog(true);
                                                    } else if (oldPlanInterval === 2 && planInterval === 1 && x.planType === planType) {
                                                        setDialogType("yearlyToMonthly");
                                                        setShowUpgradeDialog(true);
                                                    } else if (oldPlanInterval === 2 && planInterval === 1) {
                                                        setDialogType("downgrade");
                                                        setShowUpgradeDialog(true);
                                                    }

                                                    else if (x.planType < planType) {
                                                        setDialogType("downgrade");
                                                        setShowUpgradeDialog(true);
                                                    } else if (x.planType > planType) {
                                                        setDialogType("upgrade");
                                                        setShowUpgradeDialog(true);
                                                    } else if (x.planType === planType && oldPlanInterval !== planInterval && planInterval === 2) {
                                                        setDialogType("upgrade");
                                                        setShowUpgradeDialog(true);
                                                    }
                                                }
                                        }

                                    >
                                        {planLoading === x.planType && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {/* {buttonLabel} */}
                                        {isTrialing === false && userDetailsReducer?.stripeStatus === null && (
                                            isActivatedWhenStatusNull ? (planInterval === 1 ? "Downgrade now" : "Subscribe") : `${x.btnText} now`
                                        )}

                                        {isTrialing === false && userDetailsReducer?.stripeStatus !== null && (
                                            (isActivatedForUI && userDetailsReducer?.stripeStatus !== null) ? "Activated" : x.btnText
                                        )}

                                        {isTrialing === true && buttonLabel}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Collapsible open={open} onOpenChange={setOpen} className="w-full grid gap-5">
                    <CollapsibleTrigger asChild className="m-auto">
                        <Button variant="secondary" className={'font-semibold'}>
                            View Pricing Comparison {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                        </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className={`overflow-x-auto md:overflow-visible w-full max-w-full transition-all duration-300`}
                        style={{ maxHeight: `${height}px`, transition: '5s height' }}
                        ref={contentRef}
                    >
                        <Card className={`border-0 rounded-xl `}>
                            <Table className={`border min-w-[1000px] rounded-full`}>
                                <colgroup>
                                    {(planHeader || []).map((t, i) => <col key={i} className={`${i === 0 ? "max-w-[245px] w-[245px]" : ""}`} />)}
                                </colgroup>
                                <div ref={sentinelRef} className="h-0" />
                                <TableHeader ref={tableHeaderRef}
                                    className={`bg-primary hover:bg-primary text-white sticky top-0 z-10 ${isStuck ? "rounded-t-xl" : ""}`}>
                                    <TableRow className={`bg-primary hover:bg-primary ${isStuck ? "rounded-t-xl" : ""}`}>
                                        {planHeader.map((x, i) => (
                                            <TableCell key={i} className={`p-2.5 ${isStuck ? i === 0 ? "rounded-tl-xl" : i === 4 ? "rounded-tr-xl" : "" : ""}`}>
                                                <div className={`text-center ${i === 0 ? " justify-center items-center" : ""}`}>
                                                    {x.subTitle ? <p className={'text-lg'}>{x.subTitle}</p> : ""}
                                                    {x.title ? (
                                                        <h2 className={`block text-4xl font-semibold my-1`}>
                                                            <span className={`${(planInterval == 1 || x.planType == 0) ? "" : 'line-through'}`}>${x.monthlyPrice}</span>
                                                            {(planInterval == 1 || x.planType == 0) ? "" : <span>{" "} ${x.yearlyPrice}</span>}
                                                            <span className={`text-lg font-normal`}>/month</span>
                                                        </h2>
                                                    ) : ""}
                                                    {x.trial ? <h2 className={`block text-sm mt-2`}>{x.trial}</h2> : ""}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {(planFeaturesTable || []).map((section, i) => (
                                        <Fragment key={i}>
                                            <TableRow>
                                                {section.title && (
                                                    <TableCell colSpan={5} className="p-3 text-center bg-blue-50 font-medium sticky top-[120px] z-10">
                                                        {section.title}
                                                    </TableCell>
                                                )}
                                            </TableRow>

                                            {(section.features || []).map((x, j) => (
                                                <TableRow key={j}>
                                                    <TableCell className="text-sm p-3 border-r">
                                                        {x.label} {' '}
                                                        {Array.isArray(x.tooltip) && x.tooltip.length > 0 && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info
                                                                        size={14}
                                                                        className={`cursor-pointer inline text-gray-600 -mt-0.5 ${x.isComingSoon ? 'mr-1' : ''}`}
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="font-normal text-sm max-w-80">
                                                                    {x.tooltip}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}

                                                        {x.badge && <span className="ml-1">{x.badge}</span>}

                                                        {x.isNew && (<Badge className="ml-1">New</Badge>)}
                                                        {x.isComingSoon && (<Badge variant="destructive" className="hover:bg-[#ef4444] ml-1">Coming Soon</Badge>)}
                                                    </TableCell>

                                                    <TableCell className="text-sm text-center p-3 border-r">
                                                        <div className={'flex justify-center'}>{renderPlanIcon(x.free)}</div>
                                                    </TableCell>

                                                    <TableCell className="text-sm text-center p-3 border-r">
                                                        <div className={'flex justify-center'}>{renderPlanIcon(x.starter)}</div>
                                                    </TableCell>

                                                    <TableCell className="text-sm text-center p-3 border-r">
                                                        <div className={'flex justify-center'}>{renderPlanIcon(x.growth)}</div>
                                                    </TableCell>

                                                    <TableCell className="text-sm text-center p-3">
                                                        <div className={'flex justify-center'}>{renderPlanIcon(x.premium)}</div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {showUpgradeDialog && !isUserMismatch && (
                <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                    <DialogContent
                        className={`${dialogType === "yearlyToMonthly"
                            ? "max-w-[600px]"
                            : dialogType === "downgrade"
                                ? "sm:max-w-lg"
                                : "max-w-[600px]"
                            } p-0 gap-0 overflow-hidden`}
                    >

                        {dialogType !== "downgrade" && dialogType !== "upgrade" && dialogType !== "yearlyToMonthly" && dialogType !== "subscribe" && (
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle className="text-md flex font-medium items-center gap-2">
                                    {dialogType === "free" ? "Cancel Plan" : "Confirm Upgrade"}
                                </DialogTitle>
                            </DialogHeader>
                        )}

                        <DialogDescription className="px-6 pt-4 text-gray-900">
                            {dialogType === "downgrade" ? (
                                <div className="flex flex-col items-start text-center mb-4">
                                    <div className="text-xl font-semibold mb-4 text-left mt-3 text-primary">
                                        Some Features Won’t Be Available on This Plan
                                        <span className="block text-sm font-normal text-gray-700 mt-1">
                                            Downgrading your plan will reduce or remove access to several key features that help you better engage your users and grow your product:
                                        </span>
                                    </div>

                                    <ul className="text-left space-y-3 text-sm text-gray-700 mb-4">
                                        {[
                                            ["Feedback Boards", "Limited access to collect & manage user feedback"],
                                            ["Help Articles", "Fewer resources to support your users"],
                                            ["In-App Messages", "Reduced number of messages to engage users"],
                                            ["Integrations", "Limited tools to streamline your workflow"],
                                            ["Email Notifications", "Fewer automated messages to keep users informed"],
                                            ["Remove Branding", "Your widget will show Quickhunt branding again"],
                                            ["Team Members", "Reduced collaboration access for your team"],
                                        ].map(([title, desc]) => (
                                            <li key={title} className="flex items-start gap-2">
                                                <CircleChevronRight className="w-5 h-5 text-purple-600 mt-0.5" />
                                                <div>
                                                    <div className="font-medium text-base text-gray-900 ml-1">
                                                        {title}
                                                    </div>
                                                    <div className="text-sm text-gray-700 ml-1">{desc}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="text-sm text-gray-600 text-left">
                                        Thousands of SaaS teams rely on these tools every day to build stronger user relationships and ship the right features faster.
                                    </p>
                                </div>
                            ) : dialogType === "yearlyToMonthly" ? (
                                <div className="flex flex-col items-start text-left mb-4">
                                    <div className="text-xl font-semibold mb-4 text-left mt-3 text-primary">
                                        <span className=''>Switching to Monthly? You’ll Miss Out on 2 Months Free!</span>
                                    </div>

                                    <div className="text-sm text-gray-700 mb-4 space-y-1">
                                        <div className="flex items-start gap-2 mt-4">
                                            <span>
                                                You’re currently saving <strong className="text-gray-900 font-semibold">2 full months</strong> with the yearly plan.
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2 pt-2">
                                            <span>
                                                Switching to monthly means you’ll pay more over time for the same great features.
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 pt-3">
                                        <span role="img" aria-label="bulb">💡</span> Stay on the yearly plan and keep your savings!
                                    </p>


                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6 items-center text-left">
                                    <div className="space-y-3 text-gray-800">
                                        <div className="text-xl font-semibold text-primary pt-2">
                                            Upgrade to Yearly – Get 2 Months Free
                                        </div>


                                        <div className="flex items-start gap-2 pt-2">
                                            Why pay monthly when you can save big?
                                        </div>
                                        <div className="flex items-start gap-2 pb-4">
                                            <span>
                                                Switch to the yearly plan and get <strong className="text-gray-900 font-semibold">2 months absolutely free</strong>— enjoy uninterrupted access while saving more over time.
                                            </span>
                                        </div>
                                    </div>
                                    {/* <img src={UpgradePayment} className="w-40 h-40 md:w-48 md:h-48" alt="Upgrade illustration" /> */}
                                </div>
                            )}
                        </DialogDescription>

                        <DialogFooter className="px-4 py-2 border-t flex-nowrap flex-row gap-2 md:justify-between sm:justify-between items-center">
                            {dialogType === "downgrade" ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            onClick={() => setShowUpgradeDialog(false)}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            Stay on Current Plan
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-primary"
                                            onClick={async () => {
                                                setMonthlyLoading(true);

                                                const x = selectedPlan;
                                                if (
                                                    x.planType < planType ||
                                                    (oldPlanInterval === 2 && planInterval === 1)
                                                ) {
                                                    const planLimits = { 0: 1, 1: 3, 2: 10, 3: 20 };
                                                    const newLimit = planLimits[x.planType] || 1;
                                                    const userId = userDetailsReducer.id;
                                                    const allProjects = allProjectReducer.projectList || [];
                                                    const userProjects = allProjects.filter(p => p.userId === userId);
                                                    if (userProjects.length > newLimit) {
                                                        const requiredDelete = userProjects.length - newLimit;
                                                        setErrorDialog({
                                                            open: true,
                                                            message: `<div class="block text-sm font-normal text-gray-700 mt-1">You're downgrading to a plan that allows <strong>${newLimit} active projects.</strong><br />Currently, you have <strong>${userProjects.length} active projects.</strong> To proceed, please select <strong>${requiredDelete} projects to delete.</strong></div>`,
                                                            requiredDelete,
                                                            userProjects,
                                                            planToChange: x,
                                                        });
                                                        setSelectedProjects([]);
                                                        setMonthlyLoading(false);
                                                        setShowUpgradeDialog(false);
                                                        return;
                                                    }
                                                }
                                                await handlePlanAction(selectedPlan);
                                                setMonthlyLoading(false);
                                                setShowUpgradeDialog(false);
                                                setShowTrialBanner(false);

                                            }}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            {monthlyLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Downgrade Anyway"
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : dialogType === "yearlyToMonthly" ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            onClick={() => {
                                                setPlanInterval(2);
                                                setShowUpgradeDialog(false);
                                            }}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            Stay on Yearly & Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-primary"
                                            onClick={async () => {
                                                setMonthlyLoading(true);
                                                await handlePlanAction(selectedPlan);
                                                setMonthlyLoading(false);
                                                setShowUpgradeDialog(false);
                                                setShowTrialBanner(false);

                                            }}
                                            disabled={monthlyLoading}
                                        >
                                            {monthlyLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Switch to Monthly Anyway"
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : dialogType === "upgrade" ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            onClick={async () => {
                                                setYearlyLoading(true);
                                                try {
                                                    setPlanInterval(2);
                                                    setPlanType(selectedPlan.planType);
                                                    await handlePlanAction(selectedPlan, "upgrade", null, 2);
                                                    setShowUpgradeDialog(false);
                                                    setShowTrialBanner(false);
                                                } catch (error) {
                                                    toast({ variant: "destructive", description: "Failed to upgrade to yearly plan" });
                                                } finally {
                                                    setYearlyLoading(false);
                                                }
                                            }}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            {yearlyLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Upgrade to Yearly"
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-primary"
                                            onClick={async () => {
                                                setMonthlyLoading(true);
                                                try {
                                                    setPlanInterval(1);
                                                    setPlanType(selectedPlan.planType);
                                                    await handlePlanAction(selectedPlan, "upgrade", null, 1); // Force monthly
                                                    setShowUpgradeDialog(false);
                                                    setShowTrialBanner(false);
                                                } catch (error) {
                                                    toast({ variant: "destructive", description: "Failed to continue with monthly plan" });
                                                } finally {
                                                    setMonthlyLoading(false);
                                                }
                                            }}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            {monthlyLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Continue with Monthly"
                                            )}
                                        </Button>
                                    </div>
                                    {/* <div className="text-xs">
                                        Need help? <a href="https://calendly.com/quickhunt/30min" target="_blank" className="text-primary hover:underline">Let’s talk.</a>
                                    </div> */}
                                </>
                            ) : dialogType === "subscribe" ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            onClick={async () => {
                                                setYearlyLoading(true);
                                                try {
                                                    setPlanInterval(2);
                                                    setPlanType(selectedPlan.planType);
                                                    if (isSubscribeConfirmFlow) {
                                                        await handlePlanAction(selectedPlan, 'subscribe', null, 2);
                                                    }
                                                    setShowUpgradeDialog(false);
                                                } catch (error) {
                                                    toast({ variant: "destructive", description: "Failed to upgrade to yearly plan" });
                                                } finally {
                                                    setYearlyLoading(false);
                                                }
                                            }}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            {yearlyLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                isSubscribeConfirmFlow ? "Subscribe Yearly" : "Upgrade to Yearly"
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-primary"
                                            onClick={async () => {
                                                setMonthlyLoading(true);
                                                try {
                                                    setPlanInterval(1);
                                                    setPlanType(selectedPlan.planType);
                                                    if (isSubscribeConfirmFlow) {
                                                        await handlePlanAction(selectedPlan, 'subscribe', null, 1);
                                                    }
                                                    setShowUpgradeDialog(false);
                                                } catch (error) {
                                                    toast({ variant: "destructive", description: "Failed to continue with monthly plan" });
                                                } finally {
                                                    setMonthlyLoading(false);
                                                }
                                            }}
                                            disabled={yearlyLoading || monthlyLoading}
                                        >
                                            {monthlyLoading ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                isSubscribeConfirmFlow ? "Subscribe Monthly" : "Continue with Monthly"
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowUpgradeDialog(false)}
                                        disabled={yearlyLoading || monthlyLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            setMonthlyLoading(true);
                                            await handlePlanAction(selectedPlan);
                                            setMonthlyLoading(false);
                                            setShowUpgradeDialog(false);
                                        }}
                                        disabled={yearlyLoading || monthlyLoading}
                                    >
                                        {monthlyLoading ? (
                                            <span className="flex items-center gap-1">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            "OK"
                                        )}
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )
            }

            <ProjectLimitErrorDialog
                open={errorDialog.open}
                onClose={() => setErrorDialog({ open: false, message: '', requiredDelete: 0, userProjects: [], planToChange: null })}
                userProjects={errorDialog.userProjects}
                requiredDelete={errorDialog.requiredDelete}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                loading={monthlyLoading || yearlyLoading}
                onDeleteProjects={async () => {
                    const planToChange = errorDialog.planToChange;
                    setMonthlyLoading(true);
                    const payload = { projectIds: selectedProjects };
                    try {
                        await apiService.multiDeleteProjects(payload);

                        const deletedIds = selectedProjects;
                        const allProjects = allProjectReducer.projectList || [];
                        const updatedProjects = allProjects.filter(p => !deletedIds.includes(p.id));
                        dispatch(allProjectAction({ projectList: updatedProjects }));

                        const currentProject = getProjectDetails();
                        const stillExists = updatedProjects.some(p => p.id === currentProject?.id);
                        if (!stillExists) {
                            const newSelected = updatedProjects[0] || null;
                            dispatch(projectDetailsAction(newSelected));
                            setProjectDetails(newSelected);
                        }

                        if (planToChange) {
                            await handlePlanAction(planToChange, "downgrade", updatedProjects, planInterval);
                        }

                        setErrorDialog({ open: false, message: '', requiredDelete: 0, userProjects: [], planToChange: null });
                        setSelectedProjects([]);
                        setMonthlyLoading(false);
                    } catch (e) {

                        setMonthlyLoading(false);
                    }
                }}
                message={errorDialog.message}
            />
        </Fragment >
    );
};

export default PricingPlans;