import React, {Fragment} from 'react';
import { cn } from "../../lib/utils"
import {useSelector} from "react-redux";
import {Button} from "../ui/button";
import {useNavigate} from "react-router-dom";
import {baseUrl} from "../../utils/constent";
import {useTheme} from "../theme-provider";

const BlurOverlay = ({className = '', isAnalytics = false, classNameCenter = ''}) => {
    const {onProModal} = useTheme();
    const navigate = useNavigate();
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const isOwner = userDetailsReducer?.id == projectDetailsReducer?.userId;
    const plan = isOwner ? userDetailsReducer?.plan : projectDetailsReducer?.plan;

    if (plan !== 0) return null;

    const onRedirect = () => {
        if (isOwner) {
            onProModal(false);
            navigate(`${baseUrl}/pricing`);
        } else {
            onProModal(true);
        }
    };

    return (
        <Fragment>
            <div className={cn("absolute inset-0 z-10 bg-white/50 backdrop-blur-[3px] rounded-lg", className)}/>
            <div className="absolute inset-0 z-20 flex justify-center rounded-lg">
                <div className={cn("w-full max-w-lg flex flex-col justify-center items-center gap-4", classNameCenter)}>
                {/*<div className={'w-full max-w-lg flex flex-col pt-[35vh] items-center gap-4'}>*/}
                    {
                        isAnalytics && <p className={'text-sm text-center bg-muted/20'}>You’re on the Free plan, so analytics are currently hidden. Upgrade your plan to unlock detailed engagement metrics, user activity trends, and performance insights — and start making smarter product decisions.</p>
                    }
                    <Button className={'max-w-max'} onClick={onRedirect}>{isAnalytics ? "Upgrade now to access full analytics" : "Upgrade"}</Button>
                </div>
            </div>
        </Fragment>
    );
};

export default BlurOverlay;