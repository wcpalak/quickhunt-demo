import React from 'react';
import { Ellipsis, X } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export const EmptyDataContent = ({ data, onClose, onClick, setSheetOpenCreate, cookieName, projectId, cardIcon }) => {
    const navigate = useNavigate();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);

    const derivedCookieName = `${cookieName}_${projectDetailsReducer?.id}`;

    const setCookie = () => {
        const date = new Date();
        date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${derivedCookieName}=true; ${expires}; path=/`;
    };

    const checkCookie = () => {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(`${derivedCookieName}=`)) {
                return true;
            }
        }
        return false;
    };

    const btnFunctionality = (record) => {
        if (record.redirect) {
            window.open(record.redirect, "_blank");
        }
        if (record.openSheet) {
            setSheetOpenCreate(true);
        }
        if (record.navigateTo) {
            navigate(record.navigateTo);
        }
        if (onClick) {
            onClick();
        }
    }

    if (checkCookie()) {
        return null;
    }

    return (
        <Card className={"p-4 space-y-2 relative"}>
            <div className={"absolute top-[4px] right-[4px] h-auto"}>
                {/* <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Ellipsis className={`font-medium`} size={18}/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={"end"}> */}
                {/*<DropdownMenuItem className={"cursor-pointer"} onClick={() => navigate(`${baseUrl}/app-message/3/new`)}>Leave feedback</DropdownMenuItem>*/}
                {/* <DropdownMenuItem
                            className={"cursor-pointer"}
                            onClick={() => {
                                setCookie();
                                if (onClose) onClose();
                            }}
                        >Close</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu> */}
                <Tooltip>
                    <TooltipTrigger>
                        <Button
                            variant="outline hover:bg-none"
                            className={`border-0 p-0 bg-none h-auto`}
                            onClick={() => {
                                setCookie();
                                if (onClose) onClose();
                            }}
                        >
                            <X className={`font-medium`} size={18} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Close</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
                {
                    (data || []).map((x, i) => {
                        return (
                            <div key={i} className={`rounded-[16px] border bg-card text-card-foreground shadow-sm flex`}>
                                <div className={"p-2 md:p-4 flex gap-2"}>
                                    {cardIcon && <div className='mt-[2px]'><span>{cardIcon}</span></div>}
                                    <div className='flex flex-col gap-2 flex-1'>
                                        <div className='space-y-1'>
                                            <div className={"font-medium"}>{x.title}</div>
                                            <div className={"text-sm text-muted-foreground"}>{x.description}</div>
                                        </div>
                                        <div className={"mt-auto flex flex-wrap gap-1 md:gap-2"}>
                                            {
                                                (x.btnText || []).map((y, j) => {
                                                    return (
                                                        <Button
                                                            // variant={"outline hover:bg-none"}
                                                            key={j}
                                                            // className={"!bg-[#3D3D4E] rounded-full text-white font-medium text-wrap"}
                                                            className={"font-medium p-0 text-wrap"}
                                                            variant={"link"}
                                                            onClick={() => btnFunctionality(y)}
                                                        >
                                                            {y.icon}{y.title}
                                                        </Button>
                                                    )
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </Card>
    );
};