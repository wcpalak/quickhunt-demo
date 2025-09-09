import React, {Fragment} from 'react';
import {baseUrl, useWindowSize} from "../../utils/constent";
import {Card, CardContent} from "../ui/card";
import embedImg from "../../img/embed_widget.png";
import popoverImg from "../../img/popover_widget.png";
import modalImg from "../../img/modal_widget.png";
import sidebarImg from "../../img/sidebar_widget.png";
import {useNavigate} from "react-router-dom";
import {Button} from "../ui/button";
import {ArrowLeft} from "lucide-react";
import {useSelector} from "react-redux";
import PlanBadge from "../Comman/PlanBadge";
import BlurOverlay from "../Comman/BlurOverlay";
import { useTour } from '../Comman/TourProvider';
import { Badge } from '../ui/badge';

const WidgetsTypes = () => {
    const navigate = useNavigate();
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const { tourStep } = useTour();
    const { width } = useWindowSize();
    const isTourActive = tourStep !== null && tourStep < 7 && width >= 1279;

    const handleCreateClick = (type) => {
        if (type === 'embed' && projectDetailsReducer.plan === 0) {
        } else {
            navigate(`${baseUrl}/widget/${type}/new`);
        }
    }

    const widgetsList = [
        {
            title: <Fragment>Embed Widget {projectDetailsReducer.plan === 0 && <PlanBadge title={'Starter'}/>}</Fragment>,
            description : "Integrate content directly into your website for seamless user interaction.",
            img: embedImg,
            type: "embed"
        },
        {
            title: "Popover Widget",
            description : "Display interactive content in a small overlay for quick access without leaving the page.",
            img: popoverImg,
            type: "popover"
        },
        {
            title: "Modal Widget",
            description : "Present focused content in a popup window, requiring user action before returning to the main page.",
            img: modalImg,
            type: "modal"
        },
        {
            title: "Sidebar Widget",
            description : "Add a persistent sidebar for easy access to additional features or information on your website.",
            img: sidebarImg,
            type: "sidebar"
        }
    ];

    return (
        <Fragment>
            <div className={"pt-6 pb-5 px-3 md:px-8"}>
                <div className={"flex flex-col gap-4"}>
                    <div className={"space-x-4 flex items-center"}>
                        <Button className={"h-8 w-8"} variant={"outline"} size={"icon"} onClick={() => navigate(`${baseUrl}/widget`)}>
                            <ArrowLeft size={16} />
                        </Button>
                        <h1 className="text-2xl font-medium">Create New Widget</h1>
                    </div>
                    <div id={"btn-widget-create"} className={"grid lg:grid-cols-4 md:grid-cols-2 gap-4"}>
                        {
                            widgetsList.map((x, i) => {
                                return(
                                    <Card key={i} className={"cursor-pointer flex flex-col h-full"} onClick={isTourActive ? null : () => handleCreateClick(x.type)}>
                                        <div className={"border-b p-3 md:p-4 flex flex-col flex-1"}>
                                            <h2 className="text-base font-medium mb-2">{x.title} &nbsp;
                                                {x.type === 'embed' && <Badge className='text-xs bg-[#F5F3FF] border-[#8B5CF6] text-[#6D28D9]'>  Most Used</Badge>}
                                                </h2>
                                            <p className="text-sm font-normal text-muted-foreground">{x.description}</p>
                                        </div>
                                        <CardContent className={"p-3 md:p-4 bg-muted/50 relative"}>
                                            {(projectDetailsReducer.plan === 0 && x.type === 'embed') && <BlurOverlay/>}
                                            <img className="max-w-[706px] aspect-[706/450] w-full" src={x.img} alt={x.title} loading="lazy" height={'237'} />
                                        </CardContent>
                                    </Card>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default WidgetsTypes;