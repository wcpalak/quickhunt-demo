import React, {Fragment} from 'react';
import {Badge} from "../ui/badge";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"
import {useTheme} from "../theme-provider";

const PlanBadge = ({title = ''}) => {
    const {onProModal} = useTheme()

    return (
        <Fragment>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={'inline-block leading-none'}>
                        <Badge onClick={() => onProModal(true)}
                               className={'cursor-pointer rounded-md hover:bg-primary px-1.5 text-[10px] h-5 py-1 tracking-wider'}>
                        {/*{projectDetailsReducer?.plan === 0 ? "STARTER" : projectDetailsReducer?.plan === 1 ? "Growth" : projectDetailsReducer?.plan === 2 ? "Business" : ""}*/}
                            {title?.toUpperCase()}
                    </Badge>
                    </span>
                </TooltipTrigger>
                <TooltipContent className={'font-normal max-w-[220px]'}>
                    This feature is only accessible on the <strong>{title}</strong>{title !== "Premium" && " or above"} Plan.
                </TooltipContent>
            </Tooltip>
        </Fragment>
    );
};

export default PlanBadge;