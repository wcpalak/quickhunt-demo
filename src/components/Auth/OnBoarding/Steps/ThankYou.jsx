import React, { Fragment } from 'react';
import { Button } from "../../../ui/button";
import { Icon } from "../../../../utils/Icon";
import { useNavigate } from "react-router-dom";
import {baseUrl, toggleChat} from "../../../../utils/constent";
import partyPopper from "../../../../assets/PartyPopper.png";
import checkMarkButton from "../../../../assets/CheckMarkButton.png";
import wavingHand from "../../../../assets/WavingHand.png";

const socialLinks = [
    {
        name: "Facebook",
        url: "https://www.facebook.com/quickhuntapp",
        icon: Icon.facebookIcon,
    },
    {
        name: "TwitterX",
        url: "https://x.com/quickhuntapp",
        icon: Icon.twitterX,
    },
    {
        name: "LinkedIn",
        url: "https://www.linkedin.com/company/quickhunt-app",
        icon: Icon.linkedIn,
    },
    {
        name: "Instagram",
        url: "https://www.instagram.com/quickhunt.app",
        icon: Icon.onBoardInsta,
    },
];

const ThankYou = () => {
    let navigate = useNavigate();

    const onDashboard = () => {
        navigate(`${baseUrl}/dashboard?fromOnboarding=true`);
        localStorage.removeItem('token-verify-onboard')
    }

    return (
        <Fragment>
            <h1 className={"text-3xl md:text-[30px] font-bold text-primary flex items-center gap-2"}>
                <img className={"w-[40px] h-[40px]"} src={partyPopper} alt={"partyPopper"}/>
                Thank You for Signing Up!
            </h1>
            <div className={"flex flex-col"}>
                <h3 className={"text-xl md:text-2xl font-semibold"}>We’re excited to have you on board.</h3>
                <p className="text-base font-normal pt-4 flex items-center gap-2"><img className={"w-[20px] h-[20px]"} src={checkMarkButton} alt={"checkMarkButton"}/> What’s next?</p>
                <ul className="list-disc list-inside text-base font-normal mt-2 space-y-1">
                    <li className={'flex items-center flex-wrap gap-1.5'}>{Icon.onBoardArrow} Start collecting <b> feedback</b> and insights</li>
                    <li className={'flex items-center flex-wrap gap-1.5'}>{Icon.onBoardArrow} Create a public <b>roadmap </b>to build in public</li>
                    <li className={'flex items-center flex-wrap gap-1.5'}>{Icon.onBoardArrow} Publish helpful <b>docs</b> for self-serve support</li>
                    <li className={'flex items-center flex-wrap gap-1.5'}>{Icon.onBoardArrow} Share updates with a beautiful <b>changelog</b></li>
                    <li className={'flex items-center flex-wrap gap-1.5'}>{Icon.onBoardArrow} Engage users with <b>in-app messages</b></li>
                </ul>
                {/*<p className="text-base font-normal pt-4 flex items-center gap-2">*/}
                {/*    <img className={"w-[20px] h-[20px]"} src={wavingHand} alt={"wavingHand"} /> <b>Have questions? </b>Just hit the chat bubble!*/}
                {/*</p>*/}

                <div className={'flex items-center gap-3 mt-4 flex-wrap'}>
                    <Button variant={"link"} onClick={toggleChat} className={'gap-2 font-medium px-0 h-auto underline text-black'}>{Icon.headPhone} Support</Button> | <Button variant={"link"} className={'gap-2 font-medium px-0 h-auto underline text-black'} onClick={() => window.open('https://calendly.com/quickhunt', "_blank")}>{Icon.notePen}Book a Demo</Button>
                    | <Button variant={"link"} className={'gap-2 font-medium px-0 h-auto underline text-black'} onClick={() => window.open('https://discord.gg/2zxcabtrHW', "_blank")}>{Icon.discordIcon}Join our Discord Community</Button>
                </div>
            </div>
            <div className={"space-y-6"}>
                <div className={"text-[16px]"}>Follow us on social media for the latest updates, tips, and product news!</div>

                <div className={"flex flex-wrap justify-start gap-8 md:gap-[15px] pb-4"}>
                    {socialLinks.map((link, index) => (
                        <Button
                            key={index}
                            variant={"ghost hover:none"}
                            className={"h-auto p-0"}
                            onClick={() => window.open(link.url, "_blank")}
                            aria-label={`Open ${link.name}`}
                        >
                            {link.icon}
                        </Button>
                    ))}
                </div>
                <Button className={"font-semibold px-[20px] hover:bg-primary min-w-[116px]"} onClick={onDashboard}>Go to Dashboard</Button>

            </div>
        </Fragment>
    );
};

export default ThankYou;