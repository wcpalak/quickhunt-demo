import {Fragment} from "react";
import {Skeleton} from "@/components/ui/skeleton.jsx";

export const commonParagraph = (count) => {
    return <div className={"grid gap-2"}>
        {
            Array.from(Array(count)).map((_, r) => {
                return (
                    <Fragment key={r}>
                        <Skeleton className="h-9 max-w-[100%]" />
                    </Fragment>
                )
            })
        }
    </div>
}

export const integrationLoad = (count) => {
    return <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
        {
            Array.from(Array(count)).map((_, r) => {
                return (
                    <Fragment key={r}>
                        <div className={`border bg-card text-card-foreground shadow-sm w-full h-[390px] rounded-lg flex flex-col`}>
                            <div className={"flex items-center bg-muted/30 justify-center py-6 h-[200px] rounded-t-lg"}>
                                <div className={"bg-white rounded-2xl w-16 h-16 flex justify-center items-center"}>
                                    <Skeleton className="w-16 h-16" />
                                </div>
                            </div>
                            <div className={"sm:p-5 sm:pt-4 p-4 pt-3 flex flex-col justify-between flex-grow"}>
                                <Skeleton className="w-full h-[28px]" />
                                <Skeleton className="w-full h-[80px]" />
                                <Skeleton className="w-full h-[36px]" />
                            </div>
                        </div>
                    </Fragment>
                )
            })
        }
    </div>
}