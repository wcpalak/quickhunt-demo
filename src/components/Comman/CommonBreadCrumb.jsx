import React from 'react';
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "../ui/breadcrumb";

const statusMap = {
    1: {
        label: "Live",
        color: "text-foreground bg-[#C7F1C6] border border-[#69CC66]"
    },
    2: {
        label: "Scheduled",
        color: "text-foreground bg-blue-100 border border-blue-400"
    },
    3: {
        label: "Draft",
        color: "text-foreground bg-red-100 border border-red-400"
    },
    4: {
        label: "Paused",
        color: "text-foreground bg-yellow-100 border border-yellow-400"
    }
};


const CommonBreadCrumb = ({ className = '', links, currentPage, currentPagePath, separator = '/', truncateLimit = 30, status, crumbName }) => {
    const navigate = useNavigate();
    const statusInfo = statusMap[status] || null;

    return (
        <Breadcrumb>
            <BreadcrumbList className={`${className}`}>

                {links.map((link, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbItem className="cursor-pointer font-[500]">
                            <BreadcrumbLink onClick={() => navigate(link.path)}>
                                {link.label}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </React.Fragment>
                ))}
                {currentPagePath ? (
                    <BreadcrumbItem className={"cursor-pointer"}>
                        <BreadcrumbLink
                            onClick={() => navigate(currentPagePath)}
                            className={`w-full font-[500] ${currentPage?.length > truncateLimit ? "max-w-[200px] truncate" : ""}`}
                        >
                            {currentPage}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                    </BreadcrumbItem>
                ) : (
                    <BreadcrumbItem className={"cursor-pointer"}>
                    <BreadcrumbPage className={`w-full font-[500] ${currentPage?.length > truncateLimit ? "max-w-[200px] truncate" : ""}`}>
                        {currentPage}
                    </BreadcrumbPage>
                    </BreadcrumbItem>
                )}
                <BreadcrumbItem className={"cursor-pointer"}>
                <BreadcrumbPage className={`w-full font-[500] ${currentPage?.length > truncateLimit ? "max-w-[200px] truncate" : ""}`}>
                    {crumbName}
                </BreadcrumbPage>
                </BreadcrumbItem>
                {( statusInfo) && (
                    <BreadcrumbItem >
                        {statusInfo && (
                            <span className={`text-[13px] px-3 py-[1px] rounded-full ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        )}
                    </BreadcrumbItem>
                )}

            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default CommonBreadCrumb;
