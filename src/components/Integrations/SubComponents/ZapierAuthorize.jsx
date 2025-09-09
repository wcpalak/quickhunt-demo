import React, {Fragment, useState} from 'react';
import zapierLogo from "@/assets/zapier.webp";
import QHhalf from "@/assets/QHhalf.png";
import {Button} from "@/components/ui/button.jsx";
import {apiService} from "../../../utils/constent";
import {Card} from "../../ui/card";
import {Loader2} from "lucide-react";
import {useSelector} from "react-redux";

const ZapierAuthorize = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const state = urlParams.get("state")
    const redirect_uri = urlParams.get("redirect_uri")
    const [isLoading, setIsLoading] = useState(false);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const onAccept = async () => {
        const payload = {
            state,
            redirectUri: redirect_uri,
        }
        setIsLoading(true)
        const response = await apiService.acceptZapier(payload)
        setIsLoading(false)
        if(response.data){
            window.open(response.data, "_self");
        }
    }

    const onNavigate = () => {
        window.open('https://zapier.com/dashboard/auth/oauth/return', "_self")
    }

    return (
        <Fragment>
            <div className={`max-w-[532px] m-auto h-screen flex flex-col justify-center`}>
                    <Card className={`w-full p-8 flex flex-col gap-10 justify-center`}>
                        <div className={"flex gap-6 justify-center items-center"}>
                            <img src={QHhalf} className={"w-[60px] min-w-[60px] border bg-white rounded h-[60px]"} alt="logo-quickhunt"/>
                            <div className={"flex gap-1"}>{Array.from(Array(3)).map((_,r) => <div key={r} className={"w-2 h-2 bg-gray-300 rounded-full"} />)}</div>
                            <img src={zapierLogo} className={"w-[60px] min-w-[60px] border bg-white rounded h-[60px]"} alt="logo-zapier"/>
                        </div>

                        <h3 className={"font-bold text-xl"}>To proceed, please grant Zapier permission to access the following information from your Quickhunt account:</h3>

                        <div className={"grid gap-2.5"}>
                            <div className={"grid gap-1"}>
                                <h3 className={"font-bold text-xl"}>Account Information</h3>
                                <p className={"text-gray-500 text-sm"}>Allow Zapier to view your name, email address, and profile avatar.</p>
                            </div>

                            <div className={"grid gap-1"}>
                                <h3 className={"font-bold text-xl"}>Projects & Boards</h3>
                                <p className={"text-gray-500 text-sm"}>Allow Zapier to retrieve your idea boards, changelog, and roadmaps.</p>
                            </div>

                            <div className={"grid gap-1"}>
                                <h3 className={"font-bold text-xl"}>Feedback & Posts</h3>
                                <p className={"text-gray-500 text-sm"}>Allow Zapier to access feedback, and user comments.</p>
                            </div>

                            <div className={"grid gap-1"}>
                                <h3 className={"font-bold text-xl"}>Webhooks</h3>
                                <p className={"text-gray-500 text-sm"}>Allow Zapier to create and manage webhooks for real-time syncing.</p>
                            </div>
                        </div>

                        <div className={"grid gap-2.5"}>
                            <Button onClick={projectDetailsReducer?.plan < 2 ? null : onAccept} disabled={isLoading || projectDetailsReducer?.plan < 2}> {isLoading ? <Loader2 className={"animate-spin mr-2"} size={15}/> : ""} Accept</Button>
                            <Button variant={"outline"} onClick={onNavigate}>Cancel</Button>
                        </div>
                    </Card>
                </div>
        </Fragment>
);
};

export default ZapierAuthorize;